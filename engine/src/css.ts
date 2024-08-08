import cssom from "rrweb-cssom";

export function parseCss(cssText: string): StyleRuleWithSelector[] {
  const cssomResult = cssom.parse(cssText);
  if (cssomResult instanceof cssom.CSSStyleSheet) {
    return cssomResult.cssRules.map(
      (cssRule: cssom.CSSRule): StyleRuleWithSelector => {
        if (cssRule instanceof cssom.CSSStyleRule) {
          return {
            selectorList: parseSelector(cssRule.selectorText),
            style: cssRule.style,
          };
        }
        throw new Error(`Unsupported CSSRule type: ${String(cssRule)}!`);
      },
    );
  }
  throw new Error(
    `Unexpected result from cssom.parse: ${String(cssomResult)}!`,
  );
}

export function parseSelector(
  selectorText: string,
): CommaSeparatedSelectorList {
  return selectorText
    .split(",")
    .map((simpleSelectorText: string): SimpleSelector => {
      simpleSelectorText = simpleSelectorText.trim();
      const firstChar = simpleSelectorText[0];
      switch (firstChar) {
        case "*":
          return { type: "*" };
        case "#":
          return {
            type: "#",
            id: simpleSelectorText.slice(1),
          };
        case ".":
          return {
            type: ".",
            className: simpleSelectorText.slice(1),
          };
        default: {
          const tagNameMd = simpleSelectorText.match(/^[a-zA-Z]+/);
          if (tagNameMd == null) {
            throw new Error(
              `Invalid selector: ${JSON.stringify(simpleSelectorText)}`,
            );
          }
          const tagName = tagNameMd[0];
          const afterTagName = simpleSelectorText
            .slice(tagName.length)
            .trimStart();
          if (afterTagName === "") {
            return {
              type: "type",
              tagName: tagName,
            };
          }
          const match = afterTagName.match(
            /^\[([a-zA-Z]+)([~]?=)"?([^"\]]+)"?\]$/,
          );
          if (match == null) {
            throw new Error(
              `Invalid attribute selector: ${JSON.stringify(simpleSelectorText)}`,
            );
          }
          return {
            type: "attribute",
            tagName,
            operator: match[2] as "=" | "~=",
            // These must be non-null because all the groups in the regex above are non-optional.
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            attribute: match[1]!,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value: match[3]!,
          };
        }
      }
    });
}

export interface StyleRuleWithSelector {
  selectorList: CommaSeparatedSelectorList;
  style: cssom.CSSStyleDeclaration;
}

export type CommaSeparatedSelectorList = Selector[];

// Simplified version of the CSSOM selector types
export type Selector = SimpleSelector;

export type SimpleSelector =
  | UniversalSelector
  | TypeSelector
  | IdSelector
  | ClassSelector
  | AttributeSelector;

export interface UniversalSelector {
  type: "*";
}

export interface TypeSelector {
  type: "type";
  tagName: string;
}

export interface IdSelector {
  type: "#";
  id: string;
}

export interface ClassSelector {
  type: ".";
  className: string;
}

export interface AttributeSelector {
  type: "attribute";
  tagName: string;
  operator: "=" | "~=";
  attribute: string;
  value: string;
}
