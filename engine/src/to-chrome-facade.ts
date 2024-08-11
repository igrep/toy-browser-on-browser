import { useEffect } from "react";
import type {
  CanvasReady,
  FromEngineMessage,
  VisitPage,
  FinishLoading,
  StartLoading,
} from "./message";

export class Engine {
  #worker: Worker;
  #onStartLoading: Set<(path: string) => void> = new Set();
  #onFinishLoading: Set<(loadedDocument: string) => void> = new Set();

  constructor(worker: Worker) {
    this.#worker = worker;

    this.#worker.onmessage = (e) => {
      const message = e.data as FromEngineMessage;
      switch (message.type) {
        case "StartLoading":
          for (const callback of this.#onStartLoading) {
            callback((message as StartLoading).path);
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

  canvasReady(canvas: OffscreenCanvas, initialUrl: string): void {
    this.#worker.postMessage(
      { type: "CanvasReady", canvas, initialUrl } satisfies CanvasReady,
      [canvas],
    );
  }

  canvasReadyWithPath(canvas: OffscreenCanvas, path: string): void {
    this.canvasReady(canvas, `toy-browser://${path}`);
  }

  visitPage(url: string): void {
    this.#worker.postMessage({ type: "VisitPage", url } satisfies VisitPage);
  }

  visitPath(path: string): void {
    this.visitPage(`toy-browser://${path}`);
  }

  onStartLoading(callback: (path: string) => void): void {
    this.#onStartLoading.add(callback);
  }

  removeOnStartLoading(callback: (path: string) => void): void {
    this.#onStartLoading.delete(callback);
  }

  onFinishLoading(callback: (loadedDocument: string) => void): void {
    this.#onFinishLoading.add(callback);
  }

  removeOnFinishLoading(callback: (loadedDocument: string) => void): void {
    this.#onFinishLoading.delete(callback);
  }
}

export function useOnStartLoading(
  engine: Engine,
  callback: (path: string) => void,
): void {
  useEffect(() => {
    engine.onStartLoading(callback);
    return () => {
      engine.removeOnStartLoading(callback);
    };
  }, [engine, callback]);
}

export function useOnFinishLoading(
  engine: Engine,
  callback: (loadedDocument: string) => void,
): void {
  useEffect(() => {
    engine.onFinishLoading(callback);
    return () => {
      engine.removeOnFinishLoading(callback);
    };
  }, [engine, callback]);
}
