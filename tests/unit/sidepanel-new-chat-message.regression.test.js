const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const scriptPath = path.join(__dirname, "..", "..", "assets", "sidepanel-BoLm9pmH.js");

function main() {
  const source = fs.readFileSync(scriptPath, "utf8");
  const start = source.indexOf('if (a.type === __cpSidepanelRuntimeMessageTypeNewChatSession) {');
  const end = source.indexOf('if (a.type === __cpSidepanelRuntimeMessageTypeStopAgent) {', start);
  const branch = source.slice(start, end);

  assert.match(
    branch,
    /querySelector/,
    "NEW_CHAT_SESSION handler should locate the actual new chat button in the sidepanel DOM"
  );
  assert.doesNotMatch(
    branch,
    /\br\(\);/,
    "NEW_CHAT_SESSION handler must not call the permission deny callback"
  );

  console.log("sidepanel new chat message regression test passed");
}

main();
