import { useState, useEffect, useCallback } from "react";
import type { Engine } from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";

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

  const onStartLoading = useCallback(() => {
    setStatus("StartLoading");
  }, []);
  const onFinishLoading = useCallback((_loadedDocument: string) => {
    setStatus("FinishLoading");
  }, []);

  useEffect(() => {
    engine.onStartLoading(onStartLoading);
    engine.onFinishLoading(onFinishLoading);
    return () => {
      engine.removeOnStartLoading(onStartLoading);
      engine.removeOnFinishLoading(onFinishLoading);
    };
  }, [engine, onStartLoading, onFinishLoading]);

  return <div>{message}</div>;
}
