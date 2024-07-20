import * as parse5 from "parse5";
import type { VisitPage } from "./message";
import { sendMessage } from "./to-engine-facade";
//import * as cssom from "rrweb-cssom";

//console.log(cssom.parse("body { color: red; }"));

const LOAD_TIME_MILLISEC = 3000;

addEventListener("message", async (e): Promise<void> => {
  switch (e.data.type) {
    case "VisitPage": {
      await new Promise((resolve) => setTimeout(resolve, LOAD_TIME_MILLISEC));
      sendMessage({ type: "UpdateStatus", status: "startLoading" });
      await new Promise((resolve) => setTimeout(resolve, LOAD_TIME_MILLISEC));
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
      const dom = parse5.parse(await res.text());
      console.log("Received a new document", dom);
      console.log(JSON.parse(JSON.stringify(dom, removeCircularReferences)));
      sendMessage({ type: "UpdateStatus", status: "finishLoading" });
      break;
    }
    default:
      console.error("Unknown message", e.data);
      break;
  }
});

// As far as I tried, this is the best way to make it work both in browser and in Node.js.
function parseToyBrowserProtocol(url: string): string {
  const { protocol } = new URL(url);
  const lengthBeforePath = `${protocol}//`.length;
  return `/${url.slice(lengthBeforePath)}.html`;
}

function removeCircularReferences(k: string, v: unknown): unknown {
  if (k === "parentNode") {
    return undefined;
  }
  return v;
  
}
