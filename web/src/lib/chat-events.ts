/**
 * Placeholder wiring for the site assistant (the chat widget is built later).
 *
 * The widget will call `onOpenChat(handler)` once mounted. Anywhere on the site,
 * `openChat()` asks it to open. Until a widget exists, `openChat()` returns false.
 */
export const OPEN_CHAT_EVENT = "portfolio:open-chat";

let listeners = 0;

/** Ask the chat widget to open. Returns false when no widget is listening yet. */
export function openChat(): boolean {
  if (listeners === 0) return false;
  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
  return true;
}

/** For the chat widget: run `handler` whenever something calls `openChat()`. Returns an unsubscribe. */
export function onOpenChat(handler: () => void): () => void {
  listeners++;
  window.addEventListener(OPEN_CHAT_EVENT, handler);
  return () => {
    listeners--;
    window.removeEventListener(OPEN_CHAT_EVENT, handler);
  };
}
