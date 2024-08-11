export const paths = [
  "blank",
  "first-page",
  "second-page",
  "3",
  "4",
  "5",
  "6",
] as const;

export type Path = (typeof paths)[number];
