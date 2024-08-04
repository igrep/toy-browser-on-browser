import {
  getStyle,
  isBlock,
  RenderElementNode,
  RenderTextNode,
  RenderTreeNode,
} from "./render-tree";

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

export type LayoutBox = LayoutBoxElement | LayoutBoxText;

export interface LayoutBoxElement {
  readonly renderTreeNode: RenderElementNode;
  readonly dimensions: Dimensions;
  readonly children: LayoutBox[];
}

export interface LayoutBoxText {
  readonly renderTreeNode: RenderTextNode;
  readonly dimensions: Dimensions;
  readonly children: [];
}

export interface Cursor {
  x: number;
  y: number;
  shouldRenderBelow: boolean;
}

export function buildUnadjustedLayoutBox(
  renderTreeNode: RenderTreeNode,
): LayoutBox {
  if (renderTreeNode.type === "text") {
    return {
      renderTreeNode,
      dimensions: emptyDimensions(),
      children: [] as const,
    };
  }
  return {
    renderTreeNode,
    dimensions: emptyDimensions(),
    children: renderTreeNode.children.map(buildUnadjustedLayoutBox),
  };
}

// Ref. https://github.com/askerry/toy-browser/blob/master/src/layout.cc
export function layout(
  layoutRoot: LayoutBox,
  container: Dimensions,
  canvasContext: CanvasText,
  cursor: Cursor = defaultCursor(),
): void {
  calculateWidth(layoutRoot, container, canvasContext);
  calculatePosition(layoutRoot, container, cursor);
  layoutChildren(
    layoutRoot,
    container.content.width - container.padding.left - container.padding.right,
    canvasContext,
  );
  calculateHeight(layoutRoot, canvasContext);
}

function calculateWidth(
  layoutBox: LayoutBox,
  container: Dimensions,
  canvasContext: CanvasText,
): void {
  const style = getStyle(layoutBox.renderTreeNode);

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

  let width =
    layoutBox.renderTreeNode.type === "text"
      ? String(measureTextWidth(layoutBox.renderTreeNode, canvasContext))
      : (style.get("width") ?? "auto");

  const totalWidth =
    (parseFloat(marginLeft) || 0) +
    (parseFloat(borderLeft) || 0) +
    (parseFloat(paddingLeft) || 0) +
    (parseFloat(width) || 0) +
    (parseFloat(paddingRight) || 0) +
    (parseFloat(borderRight) || 0) +
    (parseFloat(marginRight) || 0);

  if (width !== "auto" && totalWidth > container.content.width) {
    if (marginLeft === "auto") {
      marginLeft = "0";
    }
    if (marginRight === "auto") {
      marginRight = "0";
    }
  }

  const underflow = container.content.width - totalWidth;

  let widthI = parseFloat(width);
  if (
    layoutBox.renderTreeNode.type === "text" ||
    !isBlock(layoutBox.renderTreeNode)
  ) {
    width = String(totalWidth);
  }

  let marginLeftI = parseFloat(marginLeft);
  let marginRightI = parseFloat(marginRight);
  if (width === "auto") {
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
        marginLeftI = marginRightI = underflow / 2;
      } else {
        marginLeftI = underflow;
      }
    } else if (marginRight === "auto") {
      marginRightI = underflow;
    } else {
      marginRightI = parseFloat(marginRight) + underflow;
    }
  }

  const d = layoutBox.dimensions;
  d.content.width = widthI;
  d.padding.left = parseFloat(paddingLeft);
  d.padding.right = parseFloat(paddingRight);
  d.border.left = parseFloat(borderLeft);
  d.border.right = parseFloat(borderRight);
  d.margin.left = marginLeftI;
  d.margin.right = marginRightI;
}

function calculatePosition(
  layoutBox: LayoutBox,
  container: Dimensions,
  { x, y }: Cursor,
): void {
  const style = getStyle(layoutBox.renderTreeNode);
  const d = layoutBox.dimensions;

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
    container.content.x + x + d.margin.left + d.border.left + d.padding.left;
  d.content.y =
    container.content.y + y + d.margin.top + d.border.top + d.padding.top;
}

function layoutChildren(
  layoutBox: LayoutBox,
  parentWidth: number,
  canvasContext: CanvasText,
): void {
  let cursorX = 0;
  let cursorY = 0;
  let previousElementIsBlock = false;
  let previousElementHeight = 0;

  const availableChildWidth = isBlock(layoutBox.renderTreeNode)
    ? layoutBox.dimensions.content.width
    : parentWidth;

  for (const child of layoutBox.children) {
    calculateWidth(child, layoutBox.dimensions, canvasContext);

    const currentElementIsBlock = isBlock(child.renderTreeNode);
    const overflow =
      cursorX + child.dimensions.content.width > availableChildWidth;
    const shouldRenderBelow =
      previousElementIsBlock || currentElementIsBlock || overflow;
    if (shouldRenderBelow) {
      cursorX = 0;
      cursorY += previousElementHeight;
    }

    layout(child, layoutBox.dimensions, canvasContext, {
      x: cursorX,
      y: cursorY,
      shouldRenderBelow,
    });

    if (!isBlock(child.renderTreeNode)) {
      cursorX += borderBoxWidth(child.dimensions);

      if (
        !isBlock(layoutBox.renderTreeNode) ||
        (getStyle(layoutBox.renderTreeNode).get("width") ?? "auto") === "auto"
      ) {
        layoutBox.dimensions.content.width += child.dimensions.content.width;
      }
    }

    const childMarginBoxHeight = marginBoxHeight(child.dimensions);
    if (shouldRenderBelow) {
      layoutBox.dimensions.content.height += childMarginBoxHeight;
    }

    if (childMarginBoxHeight > layoutBox.dimensions.content.height) {
      layoutBox.dimensions.content.height = childMarginBoxHeight;
    }
    previousElementHeight = childMarginBoxHeight;

    previousElementIsBlock = currentElementIsBlock;
  }
}

function calculateHeight(
  layoutBox: LayoutBox,
  canvasContext: CanvasText,
): void {
  if (layoutBox.renderTreeNode.type === "text") {
    layoutBox.dimensions.content.height = measureTextHeight(
      layoutBox.renderTreeNode,
      canvasContext,
    );
    return;
  }

  const height = getStyle(layoutBox.renderTreeNode).get("height");
  if (height != null && height !== "auto") {
    layoutBox.dimensions.content.height = parseFloat(height);
  }
}

function measureTextHeight(
  renderTreeNode: RenderTextNode,
  canvasContext: CanvasText,
): number {
  const { fontBoundingBoxAscent, fontBoundingBoxDescent } =
    canvasContext.measureText(renderTreeNode.contents);
  return fontBoundingBoxAscent + fontBoundingBoxDescent;
}

function measureTextWidth(
  renderTreeNode: RenderTextNode,
  canvasContext: CanvasText,
): number {
  const { width } = canvasContext.measureText(renderTreeNode.contents);
  return width;
}

export function viewportSizeToContainer({
  width,
  height,
}: {
  width: number;
  height: number;
}): Dimensions {
  const empty = emptyDimensions();
  return {
    ...empty,
    content: { ...empty.content, width, height },
  };
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

export function defaultCursor(): Cursor {
  return {
    x: 0,
    y: 0,
    shouldRenderBelow: true,
  };
}

function expandWidth(width: number, { left, right }: EdgeSizes): number {
  return width + left + right;
}

function paddingBoxWidth({ content, padding }: Dimensions): number {
  return expandWidth(content.width, padding);
}

function borderBoxWidth(dimensions: Dimensions): number {
  return expandWidth(paddingBoxWidth(dimensions), dimensions.border);
}

function expandHeight(height: number, { top, bottom }: EdgeSizes): number {
  return height + top + bottom;
}

function paddingBoxHeight({ content, padding }: Dimensions): number {
  return expandHeight(content.height, padding);
}

function borderBoxHeight(dimensions: Dimensions): number {
  return expandHeight(paddingBoxHeight(dimensions), dimensions.border);
}

function marginBoxHeight(dimensions: Dimensions) {
  return expandHeight(borderBoxHeight(dimensions), dimensions.margin);
}

export function borderBoxOf(dimensions: Dimensions): Box {
  return {
    x: dimensions.content.x - dimensions.border.left - dimensions.padding.left,
    y: dimensions.content.y - dimensions.border.top - dimensions.padding.top,
    width: borderBoxWidth(dimensions),
    height: borderBoxHeight(dimensions),
  };
}
