import { atom, useAtom } from "jotai";
import { useCallback } from "react";

import type { Engine } from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";
import { pathAtom } from "./hash-state";
import { StatusIndicator } from "./StatusIndicator";
import { NativeIframeLoader } from "./NativeIframeLoader";
import { PAGE_HEIGHT, PAGE_WIDTH } from "./contants";
import { AddressBar } from "./AddressBar";
import { DomEditorLoader } from "./DomEditorLoader";

const canvasIsTransferredAtom = atom(false);

function App({ engine }: { engine: Engine }) {
  const [path] = useAtom(pathAtom);
  const [canvasIsTransferred, setCanvasIsTransferred] = useAtom(
    canvasIsTransferredAtom,
  );
  return (
    <>
      <AddressBar engine={engine} />
      <canvas
        width={PAGE_WIDTH}
        height={PAGE_HEIGHT}
        style={{ border: "1px solid black" }}
        ref={useCallback(
          (canvas: HTMLCanvasElement) => {
            if (canvasIsTransferred) {
              return;
            }
            if (canvas == null) {
              return;
            }
            engine.canvasReadyWithPath(
              canvas.transferControlToOffscreen(),
              path,
            );
            setCanvasIsTransferred(true);
          },
          [engine, path, canvasIsTransferred, setCanvasIsTransferred],
        )}
      ></canvas>
      <StatusIndicator engine={engine} />
      <div style={{ height: "1rem" }}></div>
      <NativeIframeLoader engine={engine} />
      <DomEditorLoader engine={engine} />
    </>
  );
}

export default App;
