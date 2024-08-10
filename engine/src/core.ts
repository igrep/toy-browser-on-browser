import type { DefaultTreeAdapterMap } from "parse5";
import { buildRenderTree } from "./render-tree";
import {
  buildUnadjustedLayoutBox,
  layout,
  viewportSizeToContainer,
} from "./box";
import { buildPaintCommands, runPaintCommandOn } from "./paint";

// As far as I tried, this is the best way to make it work both in browser and in Node.js.
export function parseToyBrowserProtocol(url: string): string {
  const { protocol } = new URL(url);
  const lengthBeforePath = `${protocol}//`.length;
  return `/${url.slice(lengthBeforePath)}.html`;
}

export function displayDomOnCanvas(
  dom: DefaultTreeAdapterMap["document"],
  canvas: OffscreenCanvas,
): void {
  const context = canvas.getContext("2d");
  if (context == null) {
    console.error("Failed to get 2d context");
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);

  //  call buildRenderTree, buildUnadjustedLayoutBox, layout, buildPaintCommands, and runPaintCommandOn.
  const renderTree = buildRenderTree(dom);
  if (renderTree == null) {
    console.info("Empty render tree", dom);
    return;
  }
  const layoutBox = buildUnadjustedLayoutBox(renderTree, context);
  layout(layoutBox, viewportSizeToContainer(canvas));
  const paintCommands = buildPaintCommands(layoutBox);
  for (const command of paintCommands) {
    runPaintCommandOn(command, context);
  }
}
