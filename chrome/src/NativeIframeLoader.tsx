import { type SyntheticEvent, useCallback, useState } from "react";

import {
  type Engine,
  useOnStartLoading,
} from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";
import { PAGE_HEIGHT, PAGE_WIDTH } from "./contants";
import { getFlagInHash } from "./hash-params";

export function NativeIframeLoader({ engine }: { engine: Engine }) {
  const [path, setPath] = useState<string | null>(null);
  useOnStartLoading(engine, setPath);

  const [open, setOpen] = useState(getFlagInHash("nativeIframeOpen"));
  const onToggle = useCallback((event: SyntheticEvent<HTMLDetailsElement>) => {
    setOpen(event.currentTarget.open);
  }, []);

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
