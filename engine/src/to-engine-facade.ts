import type { FromEngineMessage } from "./message";

/*
 * Implementing this is an over engineering so far.
export function onMessage(callbacks: Callbacks): void {
  addEventListener("message", async (e): Promise<void> => {
  })
}
*/

export function sendMessage(message: FromEngineMessage): void {
  postMessage(message);
}
