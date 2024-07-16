import * as parse5 from "parse5";
import * as cssom from "rrweb-cssom";



console.log(parse5.parse("<!DOCTYPE html><html><body>hello</body></html>"));
console.log(cssom.parse("body { color: red; }"));
