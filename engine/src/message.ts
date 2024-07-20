export type ToEngineMessage = VisitPage;

export interface VisitPage {
  type: "VisitPage";
  url: string;
}

export type FromEngineMessage = UpdateStatus;

export interface UpdateStatus {
  type: "UpdateStatus";
  status: "startLoading" | "finishLoading";
}
