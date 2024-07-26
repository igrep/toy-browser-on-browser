declare module "rrweb-cssom" {
  function parse(css: string): CSSStyleSheet;

  class StyleSheet {
    readonly parentStyleSheet: CSSStyleSheet | null;
  }

  class CSSStyleSheet extends StyleSheet {
    readonly cssRules: CSSRule[];
  }

  type CSSRule = CSSStyleRule | unknown; // Other types are not supported

  class CSSStyleRule {
    selectorText: string;
    readonly style: CSSStyleDeclaration;
  }

  class CSSStyleDeclaration {
    length: number;
    getPropertyPriority(property: string): string;
    getPropertyValue(property: string): string;
    removeProperty(property: string): string;
    setProperty(property: string, value: string, priority?: string): void;

    [index: number]: string;
    [name: string]: string;
  }
}
