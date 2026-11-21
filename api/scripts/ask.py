"""Ask the portfolio assistant from the command line.

    python -m scripts.ask "What projects has he built?"
    python -m scripts.ask --chat                      # a conversation that remembers earlier turns
    python -m scripts.ask --samples                   # run the 10 sample questions
    python -m scripts.ask --retrieval-only "..."      # only show the passages found (no model call)
    python -m scripts.ask --show-context "..."        # also print the full passages given to the model

Uses the same database, models and settings as the API (.env). Nothing is written to chat_logs.
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from dataclasses import dataclass

from app.core.config import Settings, get_settings
from app.db.session import DatabaseNotConfigured, dispose_engine, get_session_factory
from app.services import rag
from app.services.llm import (
    ChatMessage,
    Embedder,
    LLMError,
    LLMProvider,
    ProviderNotConfigured,
    get_condense_llm,
    get_embedder,
    get_llm,
)
from scripts.sample_questions import SAMPLES


@dataclass
class Services:
    settings: Settings
    session_factory: object
    embedder: Embedder
    llm: LLMProvider | None
    condense_llm: LLMProvider | None


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawTextHelpFormatter)
    parser.add_argument("question", nargs="?", help="the question to ask")
    parser.add_argument("--chat", action="store_true", help="interactive: keep the conversation going")
    parser.add_argument("--samples", action="store_true", help="run the 10 sample questions and summarise")
    parser.add_argument(
        "--retrieval-only", action="store_true", help="skip the model: show what was retrieved"
    )
    parser.add_argument(
        "--show-context", action="store_true", help="print the full passages the model receives"
    )
    parser.add_argument("--top-k", type=int, help="override RAG_TOP_K")
    parser.add_argument("--max-distance", type=float, help="override RAG_MAX_DISTANCE")
    parser.add_argument("--no-mmr", action="store_true", help="turn MMR re-ranking off")
    return parser.parse_args(argv)


def build_services(args: argparse.Namespace) -> Services:
    settings = get_settings()
    update: dict[str, object] = {}
    if args.top_k:
        update["rag_top_k"] = args.top_k
    if args.max_distance is not None:
        update["rag_max_distance"] = args.max_distance
    if args.no_mmr:
        update["rag_use_mmr"] = False
    if update:
        settings = settings.model_copy(update=update)
    llm = condense = None
    if not args.retrieval_only:
        llm, condense = get_llm(), get_condense_llm()
    return Services(settings, get_session_factory(), get_embedder(), llm, condense)


def _where(doc_meta: dict) -> str:
    heading = doc_meta.get("heading") or "(no heading)"
    return f"{doc_meta['source']} > {heading}"


async def ask(
    svc: Services, question: str, history: list[ChatMessage], *, retrieval_only: bool, show_context: bool
) -> dict:
    """Run one question, print it nicely and return what happened (for the samples summary)."""
    print(f"\nQ: {question}")
    found: list[dict] = []
    answer_parts: list[str] = []
    standalone = question

    if retrieval_only:
        retriever = rag.build_retriever(svc.settings, svc.session_factory, svc.embedder)
        turn = await rag.prepare_turn(
            question=question, history=history, settings=svc.settings, retriever=retriever, condense_llm=None
        )
        standalone = turn.standalone_question
        found = [
            {
                "source": d.metadata["source"],
                "heading": d.metadata["heading"],
                "distance": d.metadata["distance"],
                "preview": d.page_content,
            }
            for d in turn.documents
        ]
    else:
        assert svc.llm is not None
        async for event in rag.stream_answer(
            question=question,
            history=history,
            session_id="cli-session",
            ip_hash=None,
            session_factory=svc.session_factory,
            settings=svc.settings,
            llm=svc.llm,
            embedder=svc.embedder,
            condense_llm=svc.condense_llm,
            debug=True,
            save_log=False,
        ):
            if event.type == "debug":
                standalone = event.data["standalone_question"]
                found = event.data["chunks"]
            elif event.type == "token":
                answer_parts.append(event.data["text"])
            elif event.type == "error":
                print(
                    f"   ERROR ({event.data['code']}): {event.data['message']} (see the log for the reason)"
                )
                return {"question": question, "found": found, "answer": "", "error": event.data["code"]}

    if standalone != question:
        print(f"   searched for: {standalone}")
    if found:
        print("   found:")
        for item in found:
            print(f"     d={item['distance']:.2f}  {_where(item)}")
            if show_context:
                for line in item["preview"].splitlines():
                    print(f"            | {line}")
    else:
        print("   found: nothing close enough")
    if not retrieval_only:
        print(f"A: {''.join(answer_parts).strip()}")
    return {"question": question, "found": found, "answer": "".join(answer_parts), "error": None}


def _history(pairs: list[tuple[str, str]]) -> list[ChatMessage]:
    return [ChatMessage(role, text) for role, text in pairs]  # type: ignore[arg-type]


async def run_samples(svc: Services, *, retrieval_only: bool, show_context: bool) -> int:
    if svc.llm is not None and svc.llm.name == "mock":
        print("Note: LLM_PROVIDER=mock, so the 'A:' lines are not real answers. Check the 'found:' lines.")
    results = []
    for sample in SAMPLES:
        result = await ask(
            svc,
            sample["question"],
            _history(sample["history"]),
            retrieval_only=retrieval_only,
            show_context=show_context,
        )
        found = result["found"]
        expect = sample["expect"]
        if expect is None:
            ok = not found
            verdict = (
                "OK  nothing relevant found"
                if ok
                else f"CHECK found {len(found)} passage(s) for an off-topic question"
            )
        else:
            ok = any(
                f["source"] == name and text.lower() in f["heading"].lower()
                for f in found
                for name, text in expect
            )
            wanted = ", ".join(f"{name}{' > ...' + text + '...' if text else ''}" for name, text in expect)
            verdict = f"{'HIT ' if ok else 'MISS'} wanted one of: {wanted}"
        print(f"   -> {verdict}   [{sample['note']}]")
        results.append(ok)
    print(f"\nRetrieval check: {sum(results)}/{len(results)} questions retrieved the right material.")
    return 0 if all(results) else 2


async def run_chat(svc: Services, *, retrieval_only: bool, show_context: bool) -> int:
    print("Ask about the portfolio owner. Empty line or Ctrl-D to stop.")
    history: list[ChatMessage] = []
    while True:
        try:
            question = (await asyncio.to_thread(input, "\nyou> ")).strip()
        except EOFError:
            break
        if not question:
            break
        result = await ask(svc, question, history, retrieval_only=retrieval_only, show_context=show_context)
        history += [
            ChatMessage("user", question),
            ChatMessage("assistant", result["answer"].strip() or "(no answer)"),
        ]
    return 0


async def run(args: argparse.Namespace) -> int:
    try:
        svc = build_services(args)
        if args.samples:
            return await run_samples(svc, retrieval_only=args.retrieval_only, show_context=args.show_context)
        if args.chat:
            return await run_chat(svc, retrieval_only=args.retrieval_only, show_context=args.show_context)
        if not args.question:
            print("Give a question, or use --chat or --samples.", file=sys.stderr)
            return 1
        await ask(svc, args.question, [], retrieval_only=args.retrieval_only, show_context=args.show_context)
        return 0
    except ProviderNotConfigured as exc:
        print(
            f"{exc}\nTip: add --retrieval-only to see what would be retrieved without calling a model.",
            file=sys.stderr,
        )
        return 1
    except DatabaseNotConfigured:
        print("DATABASE_URL is not set. Copy .env.example to .env and fill it in.", file=sys.stderr)
        return 1
    except LLMError as exc:
        print(f"Failed: {exc}", file=sys.stderr)
        return 1
    finally:
        await dispose_engine()


def main() -> None:
    sys.exit(asyncio.run(run(parse_args())))


if __name__ == "__main__":
    main()
