declare module 'rrweb-cssom' {
  function parse(css: string): CSSStyleSheet;

  class CSSStyleSheet {
    parentStyleSheet: CSSStyleSheet | null;
    cssRules: CSSRule[];
  }

  type CSSRule = CSSStyleSheet|CSSMediaRule|CSSContainerRule|CSSSupportsRule|
      CSSFontFaceRule|CSSKeyframesRule|CSSDocumentRule;
}
