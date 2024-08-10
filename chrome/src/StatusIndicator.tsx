import { useState, useCallback } from "react";
import {
  useOnFinishLoading,
  useOnStartLoading,
  type Engine,
} from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";

export function StatusIndicator({ engine }: { engine: Engine }) {
  const [status, setStatus] = useState<"StartLoading" | "FinishLoading" | null>(
    null,
  );
  let message = "";
  switch (status) {
    case "StartLoading":
      message = "Loading...";
      break;
    case "FinishLoading":
      message = "Done.";
      break;
  }

  const onStartLoading = useCallback((_path: string) => {
    setStatus("StartLoading");
  }, []);
  useOnStartLoading(engine, onStartLoading);

  const onFinishLoading = useCallback((_loadedDocument: string) => {
    setStatus("FinishLoading");
  }, []);
  useOnFinishLoading(engine, onFinishLoading);

  return <div>{message}</div>;
}
