import * as parse5 from "parse5";

import type { CanvasReady, VisitPage } from "./message";
import { sendMessage } from "./to-engine-facade";
import { displayDomOnCanvas, parseToyBrowserProtocol } from "./core";

let canvas: OffscreenCanvas | null = null;

addEventListener("message", (e) => {
  switch (e.data.type) {
    case "CanvasReady": {
      const { canvas: canvasSent, initialUrl } = e.data as CanvasReady;
      canvas = canvasSent;

      // This is the last line of this function
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchAndDisplayPage(initialUrl, canvas);
      break;
    }
    case "VisitPage": {
      if (canvas == null) {
        console.error("Canvas is not ready");
        return;
      }

      const { url } = e.data as VisitPage;

      // This is the last line of this function
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      fetchAndDisplayPage(url, canvas);
      break;
    }
    default:
      console.error("Unknown message", e.data);
      break;
  }
});

async function fetchAndDisplayPage(
  url: string,
  canvas: OffscreenCanvas,
): Promise<void> {
  const path = parseToyBrowserProtocol(url);
  sendMessage({ type: "StartLoading", path });

  const res = await fetch(path);
  // This must be false positive
  // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
  if (!res.ok) {
    console.error("Failed to fetch", path);
    return;
  }

  const domString = await res.text();
  const dom = parse5.parse(domString);
  displayDomOnCanvas(dom, canvas);

  sendMessage({ type: "FinishLoading", loadedDocument: domString });
}
