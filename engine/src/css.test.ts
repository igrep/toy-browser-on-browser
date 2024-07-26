import { describe, expect, test } from "vitest";

import { parseSelector } from "./css";

describe("parseSelector", () => {
  test.each([
    {
      input: "rule",
      expected: [
        {
          type: "type",
          tagName: "rule",
        },
      ],
    },
    {
      input: "test   [foo=bar]",
      expected: [
        {
          type: "attribute",
          tagName: "test",
          operator: "=",
          attribute: "foo",
          value: "bar",
        },
      ],
    },
    {
      input: "test [bar=baz], testtest[piyo~=guoo]",
      expected: [
        {
          type: "attribute",
          tagName: "test",
          operator: "=",
          attribute: "bar",
          value: "baz",
        },
        {
          type: "attribute",
          tagName: "testtest",
          operator: "~=",
          attribute: "piyo",
          value: "guoo",
        },
      ],
    },
    {
      input: ".klass,#id",
      expected: [
        {
          type: ".",
          className: "klass",
        },
        {
          type: "#",
          id: "id",
        },
      ],
    },
  ])("`$cssText` -> $expected", ({ input, expected }) => {
    expect(parseSelector(input)).toEqual(expected);
  });
});
