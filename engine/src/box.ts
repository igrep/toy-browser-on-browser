import { isBlock, RenderTreeNode } from "./render-tree";

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
  if (lastChild === undefined || !isAnonymousBlockBox(lastChild)) {
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

function isInlineBox(box: LayoutBox): box is LayoutInlineNode {
  return !box.isBlock;
}

function isAnonymousBlockBox(box: LayoutBox): box is LayoutAnonymousBlockNode {
  return box.renderTreeNode === null;
}
