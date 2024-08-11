import { useAtom } from "jotai";

import type { Engine } from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";
import { pathAtom } from "./hash-state";
import { Path, paths } from "./paths";

export function AddressBar({ engine }: { engine: Engine }) {
  const [path, setPath] = useAtom(pathAtom);
  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    engine.visitPath(event.target.value);
    setPath(event.target.value as Path);
  }

  function initSelect(select: HTMLSelectElement | null) {
    if (select == null) {
      return;
    }
    select.value = path;
  }

  return (
    <label style={{ display: "block", paddingBottom: "0.5rem" }}>
      {"URL: "}
      <select onChange={onChange} ref={initSelect}>
        {paths.map((path) => (
          <option key={path} value={path}>
            toy-browser://{path}
          </option>
        ))}
      </select>
    </label>
  );
}
