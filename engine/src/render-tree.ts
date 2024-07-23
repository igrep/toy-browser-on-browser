import type { DefaultTreeAdapterMap } from "parse5";

export interface RenderTreeNode {
  type: "element" | "text";
  display: "block" | "inline";
  children: RenderTreeNode[];
}

export function buildRenderTree(doc: DefaultTreeAdapterMap["document"]): RenderTreeNode[] {
  const { childNodes } = doc;
  const styleRules = collectStyleRules(childNodes);

  return childNodes.flatMap(
    (child: DefaultTreeAdapterMap["childNode"]): RenderTreeNode[] =>
      applyStyleRules(child, styleRules)
  );
}
