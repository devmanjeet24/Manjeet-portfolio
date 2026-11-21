export interface SseMessage {
  event: string;
  data: string;
}

/**
 * Incremental Server-Sent Events parser. Feed it text as it arrives (chunks can split an event
 * anywhere); it calls `onMessage` for every complete event. Handles \n, \r\n and \r line ends,
 * several `data:` lines per event and `:` comment lines.
 */
export function createSseParser(onMessage: (message: SseMessage) => void) {
  let buffer = "";
  let event = "message";
  let data: string[] = [];

  const dispatch = () => {
    if (data.length > 0) onMessage({ event, data: data.join("\n") });
    event = "message";
    data = [];
  };

  const line = (text: string) => {
    if (text === "") return dispatch();
    if (text.startsWith(":")) return;
    const colon = text.indexOf(":");
    const field = colon === -1 ? text : text.slice(0, colon);
    let value = colon === -1 ? "" : text.slice(colon + 1);
    if (value.startsWith(" ")) value = value.slice(1);
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      // A trailing \r may be the first half of \r\n: keep it for the next chunk.
      const held = buffer.endsWith("\r") ? "\r" : "";
      const complete = held ? buffer.slice(0, -1) : buffer;
      const lines = complete.split(/\r\n|\n|\r/);
      buffer = (lines.pop() ?? "") + held;
      lines.forEach(line);
    },
    /** Call when the stream ends: a final event without a blank line after it still counts. */
    end() {
      if (buffer) line(buffer.replace(/\r$/, ""));
      buffer = "";
      dispatch();
    },
  };
}
