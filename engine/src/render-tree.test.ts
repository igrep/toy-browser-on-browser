import { describe, expect, test } from "vitest"

import * as parse5 from "parse5";

import { buildRenderTree } from "./render-tree";

describe("buildRenderTree", () => {
  test.each([
    { cssText: "", htmlBody: '<p id="test"></p>', expected: [{ type: "element", display: "block", children: [] }] },
    { cssText: "* { display: inline; }", htmlBody: '<p id="test"></p>', expected: [{ type: "element", display: "inline", children: [] }] },
    { cssText: "div { display: block; }", htmlBody: '<span id="test"></span>', expected: [{ type: "element", display: "inline", children: [] }] },
    { cssText: "* { display: block; } div { display: inline; }", htmlBody: '<p id="test"></p>', expected: [{ type: "element", display: "block", children: [] }] },
    { cssText: "* { display: block; } p { display: inline; color: red; }", htmlBody: '<p id="test"></p>', expected: [{ type: "element", display: "inline", color: "red", children: [] }] },
    { cssText: "* { display: inline; } p[id=hello] { color: red; }", htmlBody: '<p id="test"></p>', expected: [{ type: "element", display: "inline", children: [] }] },
    { cssText: "* { display: inline; } p[id=test] { color: red; }", htmlBody: '<p id="test"></p>', expected: [{ type: "element", display: "inline", color: "red", children: [] }] },

    { cssText: "* { display: block; }", htmlBody: '<div class="test"><span class="test"></span></div>', expected: [{ type: "element", display: "block", children: [{ type: "element", display: "block", children: [] }] }] },
    { cssText: "p { display: inline; }", htmlBody: '<div class="test"><p class="test"></p></div>', expected: [{ type: "element", display: "block", children: [{ type: "element", display: "inline", children: [] }] }] },

    { cssText: "p { display: none; }", htmlBody: '<p id="test"></p>', expected: [] },
    { cssText: "p { display: none; }", htmlBody: '<div class="test"><p class="test"></p></div>', expected: [{ type: "element", display: "block", children: [] }] },

  ])('`$cssText` + `$htmlBody` -> $expected', ({ cssText, htmlBody, expected }) => {
      const htmlContents = `<html><head><style>${cssText}</style></head><body>${htmlBody}</body></html>`;
      expect(buildRenderTree(parse5.parse(htmlContents))).toEqual({
        type: "element",
        display: "block",
        children: [
          {
            type: "element",
            display: "block",
            children: [expected],
          },
        ],
      });
  });
});
