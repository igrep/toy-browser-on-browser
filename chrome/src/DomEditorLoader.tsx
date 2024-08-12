import { type ChangeEvent, useCallback, useState } from "react";
import { useAtom } from "jotai";

import {
  type Engine,
  useOnFinishLoading,
} from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";
import { domEditorOpenAtom } from "./hash-state";
import { DomEditor } from "./DomEditor";

export function DomEditorLoader({ engine }: { engine: Engine }) {
  const [domString, setDomString] = useState<string | null>(null);
  useOnFinishLoading(engine, setDomString);

  const [open, setOpen] = useAtom(domEditorOpenAtom);
  const onToggle = useCallback(
    (event: ChangeEvent<HTMLDetailsElement>) => {
      setOpen(event.currentTarget.open);
    },
    [setOpen],
  );

  return (
    <details open={open} onToggle={onToggle}>
      <summary>Edit DOM</summary>
      {domString == null ? (
        "No Page Opened Yet"
      ) : (
        <DomEditor domString={domString} engine={engine} />
      )}
    </details>
  );
}
