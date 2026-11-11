/** 画廊里的四块展示. 键就是分段控件的值. */
export const STUDIO_VIEW = {
  field: "field",
  kiln: "kiln",
  shots: "shots",
  texture: "texture",
} as const;

export type StudioView = (typeof STUDIO_VIEW)[keyof typeof STUDIO_VIEW];

export const STUDIO_VIEWS = [
  { key: STUDIO_VIEW.field, label: "田野" },
  { key: STUDIO_VIEW.kiln, label: "窑四号" },
  { key: STUDIO_VIEW.shots, label: "镜头" },
  { key: STUDIO_VIEW.texture, label: "质感" },
] as const;
