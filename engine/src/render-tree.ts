import type { DefaultTreeAdapterMap } from "parse5";
import type { SimpleSelector, StyleRuleWithSelector } from "./css";
import { parseCss } from "./css";

export type RenderTreeNode = RenderElementNode | RenderTextNode;

export interface RenderElementNode {
  readonly type: "element";
  readonly tagName: string;
  readonly style: Map<string, string>;
  readonly children: RenderTreeNode[];
}

export interface RenderTextNode {
  readonly type: "text";
  readonly contents: string;
}

export function buildRenderTree(
  doc: DefaultTreeAdapterMap["document"],
): RenderTreeNode | undefined {
  const { childNodes } = doc;
  const styleRules = collectStyleRules(childNodes);

  const result = childNodes.flatMap(
    (child: DefaultTreeAdapterMap["childNode"]): RenderTreeNode[] =>
      applyStyleRules(child, styleRules),
  );
  if (result.length > 1) {
    console.warn("Multiple root elements found in the document");
  }
  return result[0];
}

export function isBlock(renderTreeNode: RenderTreeNode): boolean {
  if (renderTreeNode.type === "text") {
    return false;
  }

  return renderTreeNode.style.get("display") === "block";
}

export function getStyle(renderTreeNode: RenderTreeNode): Map<string, string> {
  if (renderTreeNode.type === "text") {
    return new Map(); // Cache with WeakMap if necessary
  }
  return renderTreeNode.style;
}

export function getCurrentColor(renderTreeNode: RenderTreeNode): string {
  return getStyle(renderTreeNode).get("color") ?? "black";
}

function collectStyleRules(
  childNodes: DefaultTreeAdapterMap["childNode"][],
): StyleRuleWithSelector[] {
  return childNodes.flatMap(
    (child: DefaultTreeAdapterMap["childNode"]): StyleRuleWithSelector[] => {
      if (child.nodeName !== "style") {
        if (!child.nodeName.startsWith("#")) {
          return collectStyleRules(
            (child as DefaultTreeAdapterMap["element"]).childNodes,
          );
        }
        return [];
      }
      const styleTagContents = child.childNodes[0];
      if (styleTagContents == null) {
        return [];
      }
      if (styleTagContents.nodeName !== "#text") {
        console.warn("style tag's direct child is not a text node");
        return [];
      }
      return parseCss(
        (styleTagContents as DefaultTreeAdapterMap["textNode"]).value,
      );
    },
  );
}

function applyStyleRules(
  element: DefaultTreeAdapterMap["childNode"],
  styleRules: StyleRuleWithSelector[],
): RenderTreeNode[] {
  if (element.nodeName === "#text") {
    const contents = trimConsecutiveSpaces(
      (element as DefaultTreeAdapterMap["textNode"]).value,
    );
    if (contents === " ") {
      // I'm not sure if this is the right behavior, but this helps to reduce debug logs.
      return [];
    }
    return [
      {
        type: "text",
        contents,
      },
    ];
  }

  if (element.nodeName.startsWith("#")) {
    return [];
  }

  const elementNode = element as DefaultTreeAdapterMap["element"];
  const matchingStyleRules = [...defaultRules, ...styleRules].filter(
    (styleRule: StyleRuleWithSelector): boolean =>
      styleRule.selectorList.some((selector) =>
        matchesSelector(selector, elementNode),
      ),
  );

  const style = new Map<string, string>();
  for (const styleRule of matchingStyleRules) {
    const nameAndValues = styleRule.style;
    for (let i = 0; i < nameAndValues.length; ++i) {
      // Non-null assertions below are safe because both the index and the name are valid.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const name = nameAndValues[i]!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      style.set(name, nameAndValues[name]!);
    }
  }

  if (style.get("display") === "none") {
    return [];
  }

  return [
    {
      type: "element",
      tagName: elementNode.tagName,
      style,
      children: elementNode.childNodes.flatMap(
        (child: DefaultTreeAdapterMap["childNode"]) =>
          applyStyleRules(child, styleRules),
      ),
    },
  ];
}

function matchesSelector(
  selector: SimpleSelector,
  elementNode: DefaultTreeAdapterMap["element"],
): boolean {
  switch (selector.type) {
    case "*":
      return true;
    case "type":
      return selector.tagName === elementNode.tagName;
    case ".":
      return elementNode.attrs.some(
        (attr) =>
          attr.name === "class" &&
          attr.value.split(/\s+/).includes(selector.className),
      );
    case "#":
      return elementNode.attrs.some(
        (attr) => attr.name === "id" && attr.value === selector.id,
      );
    case "attribute":
      return elementNode.attrs.some((attr): boolean => {
        if (
          elementNode.tagName !== selector.tagName ||
          attr.name !== selector.attribute
        ) {
          return false;
        }
        if (selector.operator === "~=") {
          return attr.value.includes(selector.value);
        }
        if (selector.operator === "=") {
          return attr.value === selector.value;
        }
        return ((_: never): never => {
          throw new Error(`Unknown attribute operator: ${selector.operator}`);
        })(selector.operator);
      });
    default:
      throw new Error(
        `Unsupported selector type: ${(selector as SimpleSelector).type}`,
      );
  }
}

function trimConsecutiveSpaces(value: string): string {
  return value.replace(/\s+/g, " ");
}

// Some of them are extracted from https://searchfox.org/mozilla-central/source/layout/style/res/html.css
// then translated non-supported rules to supported ones
// Ref. https://www.nda.co.jp/memo/pxpt.html
const defaultRules: StyleRuleWithSelector[] = parseCss(`
* {
  display: block;
}
head {
  display: none;
}
style {
  display: none;
}
span {
  display: inline;
}

body {
  display: block;
  margin: 8;
}

p, dl {
  display: block;
  margin-top: 16;
  margin-bottom: 16;
}

dd {
  display: block;
  margin-left: 40px;
}

blockquote, figure {
  display: block;
  margin-block: 16;
}

address {
  display: block;
}

center {
  display: block;
}

h1 {
  display: block;
  margin-top: 26;
  margin-bottom: 26;
}

h2 {
  display: block;
  margin-top: 19;
  margin-bottom: 19;
}

h3 {
  display: block;
  margin-top: 19;
  margin-bottom: 19;
}

h4 {
  display: block;
  margin-top: 21.5;
  margin-bottom: 21.5;
}

h5 {
  display: block;
  margin-top: 22;
  margin-bottom: 22;
}

h6 {
  display: block;
  margin-top: 24;
  margin-bottom: 24;
}
`);
