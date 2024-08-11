import { atom } from "jotai";
import { type Path, paths } from "./paths";
import { focusAtom } from "jotai-optics";

const baseAtom = atom(location.hash.slice(1));
const hashAtom = atom(
  (get) => get(baseAtom),
  (_get, set, newValue: string): void => {
    location.hash = newValue;
    set(baseAtom, newValue);
  },
);

interface TypedHashState {
  nativeIframeOpen: boolean;
  path: Path;
}

function parse(hash: string): TypedHashState {
  const parts = hash.split("&");
  const result: TypedHashState = {
    nativeIframeOpen: false,
    path: paths[0],
  };
  for (const part of parts) {
    const [key, value] = part.split("=");
    if (key === "nativeIframeOpen") {
      result.nativeIframeOpen = true;
      continue;
    }

    if (key === "path") {
      if (!paths.includes(value as Path)) {
        console.error("Invalid path", value);
        continue;
      }
      result.path = value as Path;
      continue;
    }

    console.error("Unknown key", key);
  }
  return result;
}

function serialize(state: TypedHashState): string {
  const parts: string[] = [];
  if (state.nativeIframeOpen) {
    parts.push("nativeIframeOpen");
  }
  parts.push(`path=${state.path}`);
  return parts.join("&");
}

const typedHashStateAtom = atom(
  (get) => parse(get(hashAtom)),
  (_get, set, newValue: TypedHashState): void => {
    set(hashAtom, serialize(newValue));
  },
);

export const nativeIframeOpenAtom = focusAtom(typedHashStateAtom, (o) =>
  o.prop("nativeIframeOpen"),
);
export const pathAtom = focusAtom(typedHashStateAtom, (o) => o.prop("path"));
