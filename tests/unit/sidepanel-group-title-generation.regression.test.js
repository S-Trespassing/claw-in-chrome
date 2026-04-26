const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const bundlePath = path.join(__dirname, "..", "..", "assets", "sidepanel-BoLm9pmH.js");

function readSource() {
  return fs.readFileSync(bundlePath, "utf8").replace(/\r\n/g, "\n");
}

function assertIncludes(source, snippet, label) {
  assert.equal(source.includes(snippet), true, `${label} should include the expected snippet`);
}

function assertNotIncludes(source, snippet, label) {
  assert.equal(source.includes(snippet), false, `${label} should not include the removed snippet`);
}

function main() {
  const source = readSource();

  assertIncludes(
    source,
    "const r = __cpBuildTaskStyleGroupTitlePrompt(s, n);",
    "group title generator"
  );

  assertIncludes(
    source,
    "Think like PageAgent naming an active browser task. Use the user's request as the main signal, then use page context only to make the title more specific. Put the final answer between <title> tags.",
    "group title generator"
  );

  assertIncludes(
    source,
    "Generate a <title> based on the first message in the conversation.",
    "group title generator"
  );

  assertIncludes(
    source,
    "const s = __cpExtractSessionDisplayText(e?.content, __CP_CHAT_SESSION_TEXT_LIMIT);",
    "group title generator"
  );

  assertIncludes(
    source,
    "return o || __cpBuildTaskStyleGroupTitleFallback(s, n);",
    "group title generator"
  );

  assertIncludes(
    source,
    "return __cpBuildTaskStyleGroupTitleFallback(s, n);",
    "group title generator"
  );

  assertIncludes(
    source,
    'return t && t.toLowerCase() !== "title" ? __cpTrimSessionText(__cpStripSessionDisplayArtifacts(t), __CP_GROUP_TITLE_LIMIT) : "";',
    "group title generator"
  );

  assertNotIncludes(
    source,
    "Think about it, then suggest a title based on the first message, putting it between <title> tags.",
    "group title generator"
  );

  console.log("sidepanel group title generation regression test passed");
}

main();
