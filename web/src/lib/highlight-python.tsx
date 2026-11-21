import type { ReactNode } from "react";

const KEYWORDS = new Set([
  "from",
  "import",
  "async",
  "await",
  "def",
  "class",
  "return",
  "for",
  "in",
  "while",
  "if",
  "else",
  "elif",
  "with",
  "as",
  "try",
  "except",
  "raise",
  "yield",
  "lambda",
  "pass",
  "not",
  "and",
  "or",
  "is",
]);
const CONSTANTS = new Set(["None", "True", "False", "self"]);

// One pass over the text: comment | string | decorator | number | word | whitespace | other.
const TOKEN =
  /(#.*$)|("""[\s\S]*?"""|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*')|(@[\w.]+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(\s+)|([\s\S])/gm;

/** Colour classes (defined in globals.css as `.tok-*`). */
const CLASS = {
  comment: "tok-comment",
  string: "tok-string",
  decorator: "tok-decorator",
  number: "tok-number",
  keyword: "tok-keyword",
  constant: "tok-constant",
  function: "tok-function",
  type: "tok-type",
} as const;

/**
 * Tiny Python highlighter: enough for short, readable snippets, with no library.
 * Returns React elements (never an HTML string), so the text is always escaped.
 */
export function highlightPython(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let previousWord = "";
  let key = 0;
  const push = (text: string, className?: string) =>
    out.push(
      className ? (
        <span key={key++} className={className}>
          {text}
        </span>
      ) : (
        text
      ),
    );

  for (const m of code.matchAll(TOKEN)) {
    const [text, comment, string, decorator, number, word, space] = m;
    if (comment) push(text, CLASS.comment);
    else if (string) push(text, CLASS.string);
    else if (decorator) push(text, CLASS.decorator);
    else if (number) push(text, CLASS.number);
    else if (word) {
      const after = code.slice((m.index ?? 0) + text.length);
      if (KEYWORDS.has(word)) push(text, CLASS.keyword);
      else if (CONSTANTS.has(word)) push(text, CLASS.constant);
      else if (previousWord === "def" || previousWord === "class")
        push(text, CLASS.function);
      else if (/^\(/.test(after)) push(text, CLASS.function);
      else if (/^[A-Z]/.test(word)) push(text, CLASS.type);
      else push(text);
      previousWord = word;
      continue;
    } else push(text);
    if (!space) previousWord = "";
  }
  return out;
}
