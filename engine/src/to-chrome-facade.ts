import type { FromEngineMessage, UpdateStatus, VisitPage } from "./message";

export class Engine {
  #worker: Worker;
  #onUpdateStatus: (status: UpdateStatus["status"]) => void = () => {};

  constructor(worker: Worker) {
    this.#worker = worker;

    this.#worker.onmessage = (e) => {
      const message = e.data as FromEngineMessage;
      switch (message.type) {
        case "UpdateStatus":
          this.#onUpdateStatus(message.status);
          break;
        default:
          console.error("Unknown message", message);
          break;
      }
    };
  }

  visitPage(url: string) {
    this.#worker.postMessage({ type: "VisitPage", url } satisfies VisitPage);
  }

  onUpdateStatus(callback: (status: UpdateStatus["status"]) => void) {
    this.#onUpdateStatus = callback;
  }
}
