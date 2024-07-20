import { useState, useEffect } from 'react';
import type { Engine } from '@igrep/toy-browser-on-browser-engine/src/to-chrome-facade';
import type { UpdateStatus } from '@igrep/toy-browser-on-browser-engine/src/message';

export function StatusIndicator({ engine }: { engine: Engine }) {
  const [status, setStatus] = useState<UpdateStatus['status'] | null>(null);
  console.log(status);
  let message = "";
  switch (status) {
    case "startLoading":
      message = "Loading...";
      break;
    case "finishLoading":
      message = "Done.";
      break;
  }

  useEffect(() => {
    engine.onUpdateStatus(setStatus);
  }, [engine]);

  return <div>{message}</div>;
}
