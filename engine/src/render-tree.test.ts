import { describe, expect, test } from "vitest";

import * as parse5 from "parse5";

import { buildRenderTree } from "./render-tree";
import type { RenderTreeNode } from "./render-tree";

function element(
  tagName: string,
  style: { [name: string]: string },
  children: RenderTreeNode[] = [],
): RenderTreeNode {
  return {
    type: "element",
    tagName,
    style: new Map(Object.entries(style)),
    children,
  };
}

function block(others: { [name: string]: string } = {}): {
  [name: string]: string;
} {
  return { ...others, display: "block" };
}

function inline(others: { [name: string]: string } = {}): {
  [name: string]: string;
} {
  return { ...others, display: "inline" };
}

describe("buildRenderTree", () => {
  test.each([
    {
      cssText: "",
      htmlBody: '<p id="test"></p>',
      expected: [element("p", block())],
    },
    {
      cssText: "div { display: block; }",
      htmlBody: '<span id="test"></span>',
      expected: [element("span", inline())],
    },
    {
      cssText: "p { display: inline; }",
      htmlBody: '<div class="test"><p class="test"></p></div>',
      expected: [element("div", block(), [element("p", inline())])],
    },

    {
      cssText: "p { display: none; }",
      htmlBody: '<p id="test"></p>',
      expected: [],
    },
    {
      cssText: "p { display: none; }",
      htmlBody: '<div class="test"><p class="test"></p></div>',
      expected: [element("div", block())],
    },
  ])(
    "`$cssText` + `$htmlBody` -> $expected (no star)",
    ({ cssText, htmlBody, expected }) => {
      const htmlContents = `<html><head><style>${cssText}</style></head><body>${htmlBody}</body></html>`;
      expect(buildRenderTree(parse5.parse(htmlContents))).toEqual([
        element("html", block(), [element("body", block(), expected)]),
      ]);
    },
  );

  test.each([
    {
      cssText: "* { display: block; } div { display: inline; }",
      htmlBody: '<p id="test"></p>',
      expected: [element("p", block())],
    },
    {
      cssText: "* { display: block; } p { display: inline; color: red; }",
      htmlBody: '<p id="test"></p>',
      expected: [element("p", inline({ color: "red" }))],
    },

    {
      cssText: "* { display: block; }",
      htmlBody: '<div class="test"><span class="test"></span></div>',
      expected: [element("div", block(), [element("span", block())])],
    },
  ])(
    "`$cssText` + `$htmlBody` -> $expected (block star)",
    ({ cssText, htmlBody, expected }) => {
      const htmlContents = `<html><head><style>${cssText}</style></head><body>${htmlBody}</body></html>`;
      expect(buildRenderTree(parse5.parse(htmlContents))).toEqual([
        element("html", block(), [
          element("head", block(), [
            element("style", block(), [
              {
                type: "text",
                contents: cssText,
              },
            ]),
          ]),
          element("body", block(), expected),
        ]),
      ]);
    },
  );

  test.each([
    {
      cssText: "* { display: inline; }",
      htmlBody: '<p id="test"></p>',
      expected: [element("p", inline())],
    },
    {
      cssText: "* { display: inline; } p[id=hello] { color: red; }",
      htmlBody: '<p id="test"></p>',
      expected: [element("p", inline())],
    },
    {
      cssText: "* { display: inline; } p[id=test] { color: red; }",
      htmlBody: '<p id="test"></p>',
      expected: [element("p", inline({ color: "red" }))],
    },
  ])(
    "`$cssText` + `$htmlBody` -> $expected (inline star)",
    ({ cssText, htmlBody, expected }) => {
      const htmlContents = `<html><head><style>${cssText}</style></head><body>${htmlBody}</body></html>`;
      expect(buildRenderTree(parse5.parse(htmlContents))).toEqual([
        element("html", inline(), [
          element("head", inline(), [
            element("style", inline(), [
              {
                type: "text",
                contents: cssText,
              },
            ]),
          ]),
          element("body", inline(), expected),
        ]),
      ]);
    },
  );
});
