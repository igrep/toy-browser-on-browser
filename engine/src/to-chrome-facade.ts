import type {
  CanvasReady,
  FromEngineMessage,
  VisitPage,
  FinishLoading,
} from "./message";

export class Engine {
  #worker: Worker;
  #onStartLoading: Set<() => void> = new Set();
  #onFinishLoading: Set<(loadedDocument: string) => void> = new Set();

  constructor(worker: Worker) {
    this.#worker = worker;

    this.#worker.onmessage = (e) => {
      const message = e.data as FromEngineMessage;
      switch (message.type) {
        case "StartLoading":
          for (const callback of this.#onStartLoading) {
            callback();
          }
          break;
        case "FinishLoading":
          for (const callback of this.#onFinishLoading) {
            callback((message as FinishLoading).loadedDocument);
          }
          break;
        default:
          console.error("Unknown message", message);
          break;
      }
    };
  }

  canvasReady(canvas: OffscreenCanvas): void {
    this.#worker.postMessage(
      { type: "CanvasReady", canvas } satisfies CanvasReady,
      [canvas],
    );
  }

  visitPage(url: string): void {
    this.#worker.postMessage({ type: "VisitPage", url } satisfies VisitPage);
  }

  onStartLoading(callback: () => void): void {
    this.#onStartLoading.add(callback);
  }

  removeOnStartLoading(callback: () => void): void {
    this.#onStartLoading.delete(callback);
  }

  onFinishLoading(callback: (loadedDocument: string) => void): void {
    this.#onFinishLoading.add(callback);
  }

  removeOnFinishLoading(callback: (loadedDocument: string) => void): void {
    this.#onFinishLoading.delete(callback);
  }

  terminate(): void {
    this.#worker.terminate();
  }
}
