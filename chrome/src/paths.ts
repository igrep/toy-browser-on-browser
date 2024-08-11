export const paths = ["blank", "first-page", "second-page"] as const;

export type Path = (typeof paths)[number];
