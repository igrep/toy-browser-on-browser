export type ToEngineMessage = CanvasReady | VisitPage;

export interface CanvasReady {
  type: "CanvasReady";
  canvas: OffscreenCanvas;
}

export interface VisitPage {
  type: "VisitPage";
  url: string;
}

export type FromEngineMessage = StartLoading | FinishLoading;

export interface StartLoading {
  type: "StartLoading";
}

export interface FinishLoading {
  type: "FinishLoading";
  loadedDocument: string;
}
