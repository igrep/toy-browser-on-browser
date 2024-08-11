export type ToEngineMessage = CanvasReady | VisitPage;

export interface CanvasReady {
  type: "CanvasReady";
  canvas: OffscreenCanvas;
  initialUrl: string;
}

export interface VisitPage {
  type: "VisitPage";
  url: string;
}

export type FromEngineMessage = StartLoading | FinishLoading;

export interface StartLoading {
  type: "StartLoading";
  path: string;
}

export interface FinishLoading {
  type: "FinishLoading";
  loadedDocument: string;
}
