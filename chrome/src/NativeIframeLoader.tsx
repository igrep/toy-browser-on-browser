import { type ChangeEvent, useCallback, useState } from "react";
import { useAtom } from "jotai";

import {
  type Engine,
  useOnStartLoading,
} from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";
import { PAGE_HEIGHT, PAGE_WIDTH } from "./contants";
import { nativeIframeOpenAtom } from "./hash-state";

export function NativeIframeLoader({ engine }: { engine: Engine }) {
  const [path, setPath] = useState<string | null>(null);
  useOnStartLoading(engine, setPath);

  const [open, setOpen] = useAtom(nativeIframeOpenAtom);
  const onToggle = useCallback(
    (event: ChangeEvent<HTMLDetailsElement>) => {
      setOpen(event.currentTarget.open);
    },
    [setOpen],
  );

  return (
    <details onToggle={onToggle} open={open}>
      <summary>Compare with how your browser renders</summary>
      {!open || path == null ? (
        "No Page Opened Yet"
      ) : (
        <iframe src={path} width={PAGE_WIDTH} height={PAGE_HEIGHT} />
      )}
      ;
    </details>
  );
}
