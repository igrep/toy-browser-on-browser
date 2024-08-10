import * as parse5 from "parse5";

import type { VisitPage } from "./message";
import { sendMessage } from "./to-engine-facade";
import { displayDomOnCanvas, parseToyBrowserProtocol } from "./core";

let canvas: OffscreenCanvas | null = null;

console.log("Worker is ready");
addEventListener("message", async (e): Promise<void> => {
  console.debug("Worker received", e.data);
  switch (e.data.type) {
    case "CanvasReady":
      canvas = (e.data as { canvas: OffscreenCanvas }).canvas;
      break;
    case "VisitPage": {
      if (canvas == null) {
        console.error("Canvas is not ready");
        return;
      }

      sendMessage({ type: "StartLoading" });

      const { url } = e.data as VisitPage;
      const path = parseToyBrowserProtocol(url);
      console.debug("Fetching", path);
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
      break;
    }
    default:
      console.error("Unknown message", e.data);
      break;
  }
});
