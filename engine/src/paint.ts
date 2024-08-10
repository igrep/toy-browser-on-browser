// Ref. https://limpet.net/mbrubeck/2014/11/05/toy-layout-engine-7-painting.html
//      https://github.com/askerry/toy-browser/blob/0e0b79bffe2ff2c2acfee8e5062d87efb9bbaa30/src/render/paint.cc

import {
  borderBoxOf,
  LayoutBoxText,
  type Box,
  type LayoutBox,
  type LayoutBoxElement,
} from "./box";

// Pair of CanvasRenderingContext2D's method and its arguments.
export type PaintCommand = PaintLine | PaintRect | PaintText;

export interface PaintLine {
  type: "line";
  width: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export interface PaintRect extends Box {
  type: "rect";
  color: string;
}

export interface PaintText {
  type: "text";
  x: number;
  y: number;
  text: string;
  color: string;
}

export function buildPaintCommands(layoutRoot: LayoutBox): PaintCommand[] {
  const commands: PaintCommand[] = [];
  addPaintCommands(commands, layoutRoot);
  return commands;
}

function addPaintCommands(
  commands: PaintCommand[],
  layoutRoot: LayoutBox,
  parent?: LayoutBoxElement | undefined,
): void {
  if (layoutRoot.renderTreeNode.type === "text") {
    if (parent == null) {
      throw new Error("Text node needs a parent box to see its font color.");
    }
    addPaintText(commands, layoutRoot as LayoutBoxText, parent);
    return;
  }
  const layoutBoxElement = layoutRoot as LayoutBoxElement;
  addPaintShape(commands, layoutBoxElement);
  for (const child of layoutRoot.children) {
    addPaintCommands(commands, child, layoutBoxElement);
  }
}

function addPaintShape(
  commands: PaintCommand[],
  layoutRoot: LayoutBoxElement,
): void {
  addPaintBackground(commands, layoutRoot);
  addPaintBorders(commands, layoutRoot);
}

function addPaintBackground(
  commands: PaintCommand[],
  layoutRoot: LayoutBoxElement,
): void {
  const color = layoutRoot.renderTreeNode.style.get("background-color");
  if (color != null) {
    commands.push({
      type: "rect",
      color,
      ...borderBoxOf(layoutRoot.dimensions),
    });
  }
}

function addPaintBorders(
  commands: PaintCommand[],
  layoutRoot: LayoutBoxElement,
): void {
  const color = layoutRoot.renderTreeNode.style.get("border-color");
  if (color == null) {
    return;
  }

  const widthStr = layoutRoot.renderTreeNode.style.get("border-width");
  if (widthStr == null) {
    return;
  }
  const width = parseFloat(widthStr);
  if (isNaN(width) || width <= 0) {
    return;
  }

  const { x, y, width: boxWidth, height } = borderBoxOf(layoutRoot.dimensions);
  commands.push(
    {
      // top
      type: "line",
      color,
      width,
      x1: x,
      y1: y,
      x2: x + boxWidth,
      y2: y,
    },
    {
      // right
      type: "line",
      color,
      width,
      x1: x + boxWidth,
      y1: y,
      x2: x + boxWidth,
      y2: y + height,
    },
    {
      // bottom
      type: "line",
      color,
      width,
      x1: x + boxWidth,
      y1: y + height,
      x2: x,
      y2: y + height,
    },
    {
      // left
      type: "line",
      color,
      width,
      x1: x,
      y1: y + height,
      x2: x,
      y2: y,
    },
  );
}

function addPaintText(
  commands: PaintCommand[],
  layoutRoot: LayoutBoxText,
  parent: LayoutBoxElement,
): void {
  const color = parent.renderTreeNode.style.get("color") ?? "black";
  commands.push({
    type: "text",
    x: layoutRoot.dimensions.content.x,
    y:
      layoutRoot.dimensions.content.y +
      layoutRoot.textMetrics.fontBoundingBoxAscent,
    text: layoutRoot.renderTreeNode.contents,
    color,
  });
}

export function runPaintCommandOn(
  command: PaintCommand,
  canvasContext: OffscreenCanvasRenderingContext2D,
): void {
  switch (command.type) {
    case "line":
      canvasContext.beginPath();
      canvasContext.strokeStyle = command.color;
      canvasContext.lineWidth = command.width;
      canvasContext.moveTo(command.x1, command.y1);
      canvasContext.lineTo(command.x2, command.y2);
      canvasContext.stroke();
      break;
    case "rect":
      canvasContext.fillStyle = command.color;
      canvasContext.fillRect(
        command.x,
        command.y,
        command.width,
        command.height,
      );
      break;
    case "text":
      canvasContext.fillStyle = command.color;
      canvasContext.fillText(command.text, command.x, command.y);
      break;
  }
}
