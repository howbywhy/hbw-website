import assert from "node:assert/strict";
import { test } from "node:test";
import { normaliseLogotype } from "./logotype";

test("keeps the drawing and the viewBox", () => {
  const mark = normaliseLogotype('<svg viewBox="0 0 100 50"><path d="M0 0h10v10z"/></svg>');
  assert.ok(mark);
  assert.equal(mark.viewBox, "0 0 100 50");
  assert.equal(mark.ratio, 2);
  assert.match(mark.body, /<path d="M0 0h10v10z"\s*\/>/);
});

test("strips fills so the mark inherits one ink", () => {
  const mark = normaliseLogotype(
    '<svg viewBox="0 0 10 10"><path fill="#B6B1A6" stroke="rgb(1,2,3)" d="M0 0h1"/></svg>'
  );
  assert.ok(mark);
  assert.doesNotMatch(mark.body, /B6B1A6/);
  assert.doesNotMatch(mark.body, /stroke=/);
  assert.match(mark.body, /d="M0 0h1"/);
});

test("strips an Illustrator <style> block and the classes that used it", () => {
  const mark = normaliseLogotype(
    '<svg viewBox="0 0 10 10"><style type="text/css">.st0{fill:#282627;}</style><path class="st0" d="M0 0h1"/></svg>'
  );
  assert.ok(mark);
  assert.doesNotMatch(mark.body, /282627/);
  assert.doesNotMatch(mark.body, /class=/);
  assert.doesNotMatch(mark.body, /<style/i);
  assert.match(mark.body, /d="M0 0h1"/);
});

test("keeps fill=none, which is structure rather than colour", () => {
  const mark = normaliseLogotype('<svg viewBox="0 0 10 10"><circle fill="none" r="4" cx="5" cy="5"/></svg>');
  assert.ok(mark);
  assert.match(mark.body, /fill="none"/);
  assert.match(mark.body, /r="4"/);
});

test("falls back to width and height when there is no viewBox", () => {
  const mark = normaliseLogotype('<svg width="200" height="100"><path d="M0 0h1"/></svg>');
  assert.ok(mark);
  assert.equal(mark.viewBox, "0 0 200 100");
  assert.equal(mark.ratio, 2);
});

test("drops scripts and event handlers", () => {
  const mark = normaliseLogotype(
    '<svg viewBox="0 0 10 10"><script>fetch("//evil")</script><path onclick="steal()" onload="x()" d="M0 0h1"/></svg>'
  );
  assert.ok(mark);
  assert.doesNotMatch(mark.body, /<script/i);
  assert.doesNotMatch(mark.body, /evil/);
  assert.doesNotMatch(mark.body, /onclick/i);
  assert.doesNotMatch(mark.body, /onload/i);
  assert.match(mark.body, /d="M0 0h1"/);
});

test("drops foreignObject, external use and embedded images", () => {
  const mark = normaliseLogotype(
    '<svg viewBox="0 0 10 10">' +
      '<foreignObject><body xmlns="http://www.w3.org/1999/xhtml">hi</body></foreignObject>' +
      '<use href="https://evil.example/x.svg#a"/>' +
      '<image href="data:image/png;base64,AAAA"/>' +
      '<path d="M0 0h1"/></svg>'
  );
  assert.ok(mark);
  assert.doesNotMatch(mark.body, /foreignObject/i);
  assert.doesNotMatch(mark.body, /<use/i);
  assert.doesNotMatch(mark.body, /<image/i);
  assert.doesNotMatch(mark.body, /evil\.example/);
  assert.match(mark.body, /d="M0 0h1"/);
});

test("drops javascript: and url() attribute values", () => {
  const mark = normaliseLogotype(
    '<svg viewBox="0 0 10 10"><path filter="url(#gone)" d="M0 0h1"/><a xlink:href="javascript:alert(1)"><path d="M1 1h1"/></a></svg>'
  );
  assert.ok(mark);
  assert.doesNotMatch(mark.body, /javascript:/i);
  assert.doesNotMatch(mark.body, /url\(/i);
  assert.match(mark.body, /d="M0 0h1"/);
});

test("returns null for input that is not a usable mark", () => {
  assert.equal(normaliseLogotype(null), null);
  assert.equal(normaliseLogotype(undefined), null);
  assert.equal(normaliseLogotype(""), null);
  assert.equal(normaliseLogotype("   "), null);
  assert.equal(normaliseLogotype("<p>not an svg</p>"), null);
  // No viewBox and no dimensions: nothing to scale it by.
  assert.equal(normaliseLogotype("<svg><path d='M0 0h1'/></svg>"), null);
  // A zero-height viewBox would divide by zero.
  assert.equal(normaliseLogotype('<svg viewBox="0 0 10 0"><path d="M0 0h1"/></svg>'), null);
  // Nothing left to draw once the style block goes.
  assert.equal(normaliseLogotype('<svg viewBox="0 0 10 10"><style>.a{fill:red}</style></svg>'), null);
});

test("survives an XML declaration and a generator comment", () => {
  const mark = normaliseLogotype(
    '<?xml version="1.0" encoding="utf-8"?>\n<!-- Generator: Adobe Illustrator 28.2.0 -->\n' +
      '<svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 512.2"><path d="M0 0h1"/></svg>'
  );
  assert.ok(mark);
  assert.equal(mark.viewBox, "0 0 1920 512.2");
  assert.doesNotMatch(mark.body, /Illustrator/);
});

test("keeps nested groups and their transforms", () => {
  const mark = normaliseLogotype(
    '<svg viewBox="0 0 10 10"><g id="a" transform="translate(2 2)"><g><path d="M0 0h1"/></g></g></svg>'
  );
  assert.ok(mark);
  assert.match(mark.body, /transform="translate\(2 2\)"/);
  assert.match(mark.body, /id="a"/);
});
