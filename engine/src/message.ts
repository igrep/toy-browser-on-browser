export type ToEngineMessage = CanvasReady | VisitPage | DomUpdate;

export interface CanvasReady {
  type: "CanvasReady";
  canvas: OffscreenCanvas;
  initialUrl: string;
}

export interface VisitPage {
  type: "VisitPage";
  url: string;
}

export interface DomUpdate {
  type: "DomUpdate";
  html: string;
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
