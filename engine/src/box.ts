import { getStyle, isBlock, RenderTreeNode } from "./render-tree";

// Ref. https://limpet.net/mbrubeck/2014/09/08/toy-layout-engine-5-boxes.html

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Dimensions {
  content: Box;
  padding: EdgeSizes;
  border: EdgeSizes;
  margin: EdgeSizes;
}

export interface EdgeSizes {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface LayoutBoxCore {
  dimensions: Dimensions;
  children: LayoutBox[];
}

export interface LayoutBlockNode extends LayoutBoxCore {
  renderTreeNode: RenderTreeNode;
  isBlock: true;
}

export interface LayoutInlineNode extends LayoutBoxCore {
  renderTreeNode: RenderTreeNode;
  isBlock: false;
}

export interface LayoutAnonymousBlockNode extends LayoutBoxCore {
  renderTreeNode: null;
  isBlock: true;
}

export type LayoutBox =
  | LayoutBlockNode
  | LayoutInlineNode
  | LayoutAnonymousBlockNode;

export function buildUnadjustedLayoutBox(
  renderTreeNode: RenderTreeNode,
): LayoutBox {
  if (renderTreeNode.type === "text") {
    return {
      isBlock: false,
      renderTreeNode,
      dimensions: emptyDimensions(),
      children: [],
    };
  }

  const root: LayoutBox = {
    isBlock: renderTreeNode.style.get("display") === "block",
    renderTreeNode,
    dimensions: emptyDimensions(),
    children: [],
  };

  for (const child of renderTreeNode.children) {
    if (isBlock(child)) {
      root.children.push(buildUnadjustedLayoutBox(child));
      continue;
    }
    getInlineContainer(root).children.push(buildUnadjustedLayoutBox(child));
  }

  return root;
}

//// Ref. https://limpet.net/mbrubeck/2014/09/17/toy-layout-engine-6-block.html
export function layout(layoutRoot: LayoutBox, containingBlock: Box): void {
  if (isBlockBox(layoutRoot)) {
    calculateBlockWidth(layoutRoot, containingBlock);
    calculateBlockPosition(layoutRoot, containingBlock);
    layoutBlockChildren(layoutRoot);
    calculateBlockHeight(layoutRoot);
  }
  // NOTE: Inline and anonymous block boxes are not supported as the referred page does not.
}

function calculateBlockWidth(
  layoutBlock: LayoutBlockNode,
  containingBlock: Box,
): void {
  const style = getStyle(layoutBlock.renderTreeNode);

  let width = style.get("width") ?? "auto";

  let marginLeft = style.get("margin-left") ?? style.get("margin") ?? "0";
  let marginRight = style.get("margin-right") ?? style.get("margin") ?? "0";

  const borderLeft =
    style.get("border-left-width") ?? style.get("border-width") ?? "0";
  const borderRight =
    style.get("border-right-width") ?? style.get("border-width") ?? "0";

  const paddingLeft =
    style.get("padding-left-width") ?? style.get("padding-width") ?? "0";
  const paddingRight =
    style.get("padding-right-width") ?? style.get("padding-width") ?? "0";

  const totalWidth =
    (parseFloat(marginLeft) || 0) +
    (parseFloat(borderLeft) || 0) +
    (parseFloat(paddingLeft) || 0) +
    (parseFloat(width) || 0) +
    (parseFloat(paddingRight) || 0) +
    (parseFloat(borderRight) || 0) +
    (parseFloat(marginRight) || 0);

  if (width !== "auto" && totalWidth > containingBlock.width) {
    if (marginLeft === "auto") {
      marginLeft = "0";
    }
    if (marginRight === "auto") {
      marginRight = "0";
    }
  }

  const underflow = containingBlock.width - totalWidth;

  let widthI = parseFloat(width);
  let marginLeftI = parseFloat(marginLeft);
  let marginRightI = parseFloat(marginRight);
  if (width === "auto") {
    // (true, _ _)
    if (marginLeft === "auto") {
      marginLeftI = 0;
    }
    if (marginRight === "auto") {
      marginRightI = 0;
    }

    if (underflow >= 0) {
      widthI = underflow;
    } else {
      widthI = 0;
      marginRightI = parseFloat(marginRight) + underflow;
    }
  } else {
    if (marginLeft === "auto") {
      if (marginRight === "auto") {
        // (false, true, true)
        marginLeftI = marginRightI = underflow / 2;
      } else {
        // (false, true, false)
        marginLeftI = underflow;
      }
    } else if (marginRight === "auto") {
      // (false, false, true)
      marginRightI = underflow;
    } else {
      // (false, false, false)
      marginRightI = parseFloat(marginRight) + underflow;
    }
  }

  const d = layoutBlock.dimensions;
  d.content.width = widthI;
  d.padding.left = parseFloat(paddingLeft);
  d.padding.right = parseFloat(paddingRight);
  d.border.left = parseFloat(borderLeft);
  d.border.right = parseFloat(borderRight);
  d.margin.left = marginLeftI;
  d.margin.right = marginRightI;
}

function calculateBlockPosition(
  layoutBlock: LayoutBlockNode,
  containingBlock: Box,
): void {
  const style = getStyle(layoutBlock.renderTreeNode);
  const d = layoutBlock.dimensions;

  d.margin.top = parseFloat(
    style.get("margin-top") ?? style.get("margin") ?? "0",
  );
  d.margin.bottom = parseFloat(
    style.get("margin-bottom") ?? style.get("margin") ?? "0",
  );

  d.border.top = parseFloat(
    style.get("border-top-width") ?? style.get("border-width") ?? "0",
  );
  d.border.bottom = parseFloat(
    style.get("border-bottom-width") ?? style.get("border-width") ?? "0",
  );

  d.padding.top = parseFloat(
    style.get("padding-top") ?? style.get("padding") ?? "0",
  );
  d.padding.bottom = parseFloat(
    style.get("padding-bottom") ?? style.get("padding") ?? "0",
  );

  d.content.x =
    containingBlock.x + d.margin.left + d.border.left + d.padding.left;
  d.content.y = containingBlock.y + d.margin.top + d.border.top + d.padding.top;
}

function layoutBlockChildren(layoutBlock: LayoutBlockNode): void {
  for (const child of layoutBlock.children) {
    layout(child, layoutBlock.dimensions.content);
    layoutBlock.dimensions.content.height += marginHeight(child.dimensions);
  }
}

function calculateBlockHeight(layoutBlock: LayoutBlockNode) {
  const height = getStyle(layoutBlock.renderTreeNode).get("height");
  if (height != null && height !== "auto") {
    layoutBlock.dimensions.content.height = parseFloat(height);
  }
}

function emptyDimensions(): Dimensions {
  return {
    content: emptyBox(),
    padding: emptyEdges(),
    border: emptyEdges(),
    margin: emptyEdges(),
  };
}

function emptyBox(): Box {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };
}

function emptyEdges(): EdgeSizes {
  return {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  };
}

function getInlineContainer(root: LayoutBox): LayoutBox {
  if (isInlineBox(root) || isAnonymousBlockBox(root)) {
    return root;
  }

  const lastChild = root.children[root.children.length - 1];
  if (lastChild == null || !isAnonymousBlockBox(lastChild)) {
    const anonymousLastChild: LayoutAnonymousBlockNode = {
      isBlock: true,
      renderTreeNode: null,
      dimensions: emptyDimensions(),
      children: [],
    };
    root.children.push(anonymousLastChild);
    return anonymousLastChild;
  }

  return lastChild;
}

function isBlockBox(box: LayoutBox): box is LayoutBlockNode {
  return box.isBlock && box.renderTreeNode !== null;
}

function isInlineBox(box: LayoutBox): box is LayoutInlineNode {
  return !box.isBlock;
}

function isAnonymousBlockBox(box: LayoutBox): box is LayoutAnonymousBlockNode {
  return box.renderTreeNode === null;
}

function marginHeight(dimensions: Dimensions): number {
  return (
    dimensions.margin.top +
    dimensions.border.top +
    dimensions.padding.top +
    dimensions.content.height +
    dimensions.padding.bottom +
    dimensions.border.bottom +
    dimensions.margin.bottom
  );
}
