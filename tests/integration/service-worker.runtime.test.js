const assert = require("node:assert/strict");
const path = require("node:path");

const {
  createChromeMock,
  flushMicrotasks,
  runScriptInSandbox
} = require("../helpers/chrome-test-utils");

const contractPath = path.join(__dirname, "..", "..", "claw-contract.js");
const runtimePath = path.join(__dirname, "..", "..", "service-worker-runtime.js");

function createServiceWorkerHarness(options = {}) {
  const chromeMock = createChromeMock({
    storageState: options.storageState || {},
    existingGroupIds: options.existingGroupIds || [],
    tabById: options.tabById || {},
    runtimeSendMessageResult: options.runtimeSendMessageResult,
    runtimeSendMessageImpl: options.runtimeSendMessageImpl
  });
  const consoleApi = options.consoleOverride || console;
  const sandbox = {
    console: consoleApi,
    chrome: chromeMock.chrome
  };
  sandbox.globalThis = sandbox;
  runScriptInSandbox(contractPath, sandbox);
  runScriptInSandbox(runtimePath, sandbox);
  const api = sandbox.__CP_SERVICE_WORKER_RUNTIME__;
  const runtime = options.register === false ? null : api.registerServiceWorkerRuntimeHandlers({
    chrome: chromeMock.chrome,
    console: consoleApi,
    cleanupRuntime: options.cleanupRuntime,
    clearUninstallUrl: options.clearUninstallUrl,
    sweepDetachedWindowLocks: options.sweepDetachedWindowLocks,
    readDetachedWindowLocks: options.readDetachedWindowLocks,
    closeDetachedWindowForLockEntry: options.closeDetachedWindowForLockEntry,
    removeDetachedWindowLockByWindowId: options.removeDetachedWindowLockByWindowId,
    openDetachedWindowForGroup: options.openDetachedWindowForGroup,
    normalizePositiveNumber: options.normalizePositiveNumber
  });
  return {
    api,
    runtime,
    chromeMock,
    consoleApi
  };
}

function invokeMessageHandler(listener, message, sender = {}) {
  return new Promise((resolve, reject) => {
    try {
      listener(message, sender, resolve);
    } catch (error) {
      reject(error);
    }
  });
}

async function testCleanupClosedGroupRetainsRelatedScopesForUrlRecovery() {
  const { api, chromeMock } = createServiceWorkerHarness({
    register: false,
    storageState: {
      "claw.chat.scopes.chrome-group:12.meta": {
        chromeGroupId: 12,
        mainTabId: 99
      },
      "claw.chat.scopes.group:99.messages": {
        mainTabId: 99
      },
      "claw.chat.scopes.group:101.messages": {
        mainTabId: 101
      }
    }
  });
  const cleanupRuntime = api.createScopeCleanupRuntime({
    chrome: chromeMock.chrome,
    console
  });

  const result = await cleanupRuntime.cleanupClosedGroupScopes(12);

  assert.equal(result.removedKeyCount, 0);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.chrome-group:12.meta"], undefined);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.group:99.messages"], undefined);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.group:101.messages"], undefined);
}

async function testCleanupOrphanGroupScopesRetainsChromeGroupScopesForUrlRecovery() {
  const { api, chromeMock } = createServiceWorkerHarness({
    register: false,
    storageState: {
      "claw.chat.scopes.chrome-group:12.meta": {
        chromeGroupId: 12
      },
      "claw.chat.scopes.group:55.messages": {
        chromeGroupId: 12,
        mainTabId: 55
      },
      "claw.chat.scopes.chrome-group:22.meta": {
        chromeGroupId: 22
      }
    },
    existingGroupIds: [22]
  });
  const cleanupRuntime = api.createScopeCleanupRuntime({
    chrome: chromeMock.chrome,
    console
  });

  const result = await cleanupRuntime.cleanupOrphanGroupScopes();

  assert.equal(result.removedKeyCount, 0);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.chrome-group:12.meta"], undefined);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.group:55.messages"], undefined);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.chrome-group:22.meta"], undefined);
}

async function testRuntimeMessageHandlerDelegatesToDetachedWindowOpener() {
  const openCalls = [];
  const { chromeMock } = createServiceWorkerHarness({
    openDetachedWindowForGroup: async (payload) => {
      openCalls.push(payload);
      return {
        success: true,
        windowId: 321
      };
    }
  });

  const listener = chromeMock.events.runtimeOnMessage.listeners[0];
  const response = await invokeMessageHandler(listener, {
    type: "OPEN_GROUP_DETACHED_WINDOW",
    mainTabId: 77,
    sessionId: "session-a"
  }, {
    tab: {
      id: 55
    }
  });

  assert.equal(response.success, true);
  assert.equal(response.windowId, 321);
  assert.equal(openCalls.length, 1);
  assert.equal(openCalls[0].tabId, 55);
  assert.equal(openCalls[0].mainTabId, 77);
  assert.equal(openCalls[0].sessionId, "session-a");
}

async function testUnknownMessageReturnsFalseWithoutCallingOpener() {
  let openCalls = 0;
  const { chromeMock } = createServiceWorkerHarness({
    openDetachedWindowForGroup: async () => {
      openCalls += 1;
      return {
        success: true
      };
    }
  });

  const listener = chromeMock.events.runtimeOnMessage.listeners[0];
  let sendResponseCalls = 0;
  const result = listener({
    type: "OTHER_MESSAGE"
  }, {}, () => {
    sendResponseCalls += 1;
  });

  assert.equal(result, false);
  assert.equal(openCalls, 0);
  assert.equal(sendResponseCalls, 0);
}

async function testMessageHandlerReturnsFailurePayloadWhenOpenerRejects() {
  const { chromeMock } = createServiceWorkerHarness({
    openDetachedWindowForGroup: async () => {
      throw new Error("open failed");
    }
  });

  const listener = chromeMock.events.runtimeOnMessage.listeners[0];
  const response = await invokeMessageHandler(listener, {
    type: "OPEN_GROUP_DETACHED_WINDOW"
  }, {
    tab: {
      id: 99
    }
  });

  assert.equal(response.success, false);
  assert.equal(response.error, "Error: open failed");
}

async function testTabRemovedClosesMatchingDetachedWindowLock() {
  const closedLocks = [];
  const { chromeMock } = createServiceWorkerHarness({
    readDetachedWindowLocks: async () => ({
      a: {
        groupId: 12,
        mainTabId: 7,
        windowId: 91
      },
      b: {
        groupId: 13,
        mainTabId: 8,
        windowId: 92
      }
    }),
    closeDetachedWindowForLockEntry: async (lockEntry) => {
      closedLocks.push(lockEntry);
      return true;
    }
  });

  chromeMock.events.tabsOnRemoved.listeners[0](7);
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(closedLocks.length, 1);
  assert.equal(closedLocks[0].groupId, 12);
}

async function testWindowRemovedClosesHostWindowLocksAndRemovesWindowLock() {
  const closedLocks = [];
  const removedWindowIds = [];
  const { chromeMock } = createServiceWorkerHarness({
    readDetachedWindowLocks: async () => ({
      a: {
        groupId: 12,
        hostWindowId: 5,
        windowId: 91
      },
      b: {
        groupId: 13,
        hostWindowId: 5,
        windowId: 5
      },
      c: {
        groupId: 14,
        hostWindowId: 6,
        windowId: 92
      }
    }),
    closeDetachedWindowForLockEntry: async (lockEntry) => {
      closedLocks.push(lockEntry);
      return true;
    },
    removeDetachedWindowLockByWindowId: async (windowId) => {
      removedWindowIds.push(windowId);
      return [];
    }
  });

  chromeMock.events.windowsOnRemoved.listeners[0](5);
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(closedLocks.length, 1);
  assert.equal(closedLocks[0].groupId, 12);
  assert.deepEqual(removedWindowIds, [5]);
}


async function testCommandHandlerSendsNewChatRuntimeMessage() {
  const { chromeMock } = createServiceWorkerHarness();

  const commandListener = chromeMock.events.commandsOnCommand.listeners[0];
  await commandListener("new-chat", {
    id: 42,
    windowId: 7
  });
  await flushMicrotasks();

  assert.equal(chromeMock.calls.runtime.sendMessage.length, 3);
  assert.equal(chromeMock.calls.runtime.sendMessage[0].type, "open_side_panel");
  assert.equal(chromeMock.calls.runtime.sendMessage[0].tabId, 42);
  assert.equal(chromeMock.calls.runtime.sendMessage[1].type, "PING_SIDEPANEL");
  assert.equal(chromeMock.calls.runtime.sendMessage[1].targetTabId, 42);
  assert.equal(chromeMock.calls.runtime.sendMessage[2].type, "NEW_CHAT_SESSION");
  assert.equal(chromeMock.calls.runtime.sendMessage[2].targetTabId, 42);
  assert.equal(chromeMock.calls.tabs.sendMessage.length, 0);
}

async function testCommandHandlerResolvesActiveTabWhenChromeOmitsTabArgument() {
  const { chromeMock } = createServiceWorkerHarness({
    tabById: {
      51: {
        id: 51,
        windowId: 9,
        active: true,
        currentWindow: true
      },
      52: {
        id: 52,
        windowId: 10,
        active: false,
        currentWindow: false
      }
    }
  });

  const commandListener = chromeMock.events.commandsOnCommand.listeners[0];
  await commandListener("new-chat");
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(chromeMock.calls.tabs.query.length, 1);
  assert.deepEqual(chromeMock.calls.tabs.query[0], {
    active: true,
    currentWindow: true
  });
  assert.equal(chromeMock.calls.runtime.sendMessage.length, 3);
  assert.equal(chromeMock.calls.runtime.sendMessage[0].type, "open_side_panel");
  assert.equal(chromeMock.calls.runtime.sendMessage[0].tabId, 51);
  assert.equal(chromeMock.calls.runtime.sendMessage[1].type, "PING_SIDEPANEL");
  assert.equal(chromeMock.calls.runtime.sendMessage[1].targetTabId, 51);
  assert.equal(chromeMock.calls.runtime.sendMessage[2].type, "NEW_CHAT_SESSION");
  assert.equal(chromeMock.calls.runtime.sendMessage[2].targetTabId, 51);
}

async function testNewChatCommandOpensAndPingsSidePanelBeforeSendingMessage() {
  const { chromeMock } = createServiceWorkerHarness({
    runtimeSendMessageResult: {
      success: true,
      tabId: 42
    }
  });

  const commandListener = chromeMock.events.commandsOnCommand.listeners[0];
  await commandListener("new-chat", {
    id: 42,
    windowId: 7
  });
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(chromeMock.calls.runtime.sendMessage.length, 3);
  assert.equal(chromeMock.calls.runtime.sendMessage[0].type, "open_side_panel");
  assert.equal(chromeMock.calls.runtime.sendMessage[0].tabId, 42);
  assert.equal(chromeMock.calls.runtime.sendMessage[1].type, "PING_SIDEPANEL");
  assert.equal(chromeMock.calls.runtime.sendMessage[1].targetTabId, 42);
  assert.equal(chromeMock.calls.runtime.sendMessage[2].type, "NEW_CHAT_SESSION");
  assert.equal(chromeMock.calls.runtime.sendMessage[2].targetTabId, 42);
}

async function testNewChatCommandRetriesPingUntilSidePanelIsReady() {
  const pingAttempts = [];
  const { chromeMock } = createServiceWorkerHarness({
    runtimeSendMessageImpl: async payload => {
      if (payload.type === "PING_SIDEPANEL") {
        pingAttempts.push(payload);
        return pingAttempts.length >= 3 ? {
          success: true,
          tabId: 42
        } : {
          success: false
        };
      }
      return {
        success: true
      };
    }
  });

  const commandListener = chromeMock.events.commandsOnCommand.listeners[0];
  await commandListener("new-chat", {
    id: 42,
    windowId: 7
  });
  await flushMicrotasks();
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(chromeMock.calls.runtime.sendMessage.length, 5);
  assert.equal(chromeMock.calls.runtime.sendMessage[0].type, "open_side_panel");
  assert.equal(chromeMock.calls.runtime.sendMessage[1].type, "PING_SIDEPANEL");
  assert.equal(chromeMock.calls.runtime.sendMessage[2].type, "PING_SIDEPANEL");
  assert.equal(chromeMock.calls.runtime.sendMessage[3].type, "PING_SIDEPANEL");
  assert.equal(chromeMock.calls.runtime.sendMessage[4].type, "NEW_CHAT_SESSION");
  assert.equal(chromeMock.calls.runtime.sendMessage[4].targetTabId, 42);
}

async function testRegisterCallsInjectedClearUninstallUrlImmediately() {
  let clearCalls = 0;
  createServiceWorkerHarness({
    clearUninstallUrl: async () => {
      clearCalls += 1;
    }
  });

  await flushMicrotasks();

  assert.equal(clearCalls, 1);
}

async function testStartupMaintenanceRunsInjectedCleanupSteps() {
  let clearCalls = 0;
  let sweepCalls = 0;
  const { chromeMock } = createServiceWorkerHarness({
    storageState: {
      "claw.chat.scopes.chrome-group:99.meta": {
        chromeGroupId: 99
      }
    },
    clearUninstallUrl: async () => {
      clearCalls += 1;
    },
    sweepDetachedWindowLocks: async () => {
      sweepCalls += 1;
    }
  });

  clearCalls = 0;
  await chromeMock.events.runtimeOnStartup.listeners[0]();
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(clearCalls, 1);
  assert.equal(sweepCalls, 1);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.chrome-group:99.meta"], undefined);
}

async function testInstalledMaintenanceRunsInjectedCleanupSteps() {
  let clearCalls = 0;
  let sweepCalls = 0;
  const { chromeMock } = createServiceWorkerHarness({
    storageState: {
      "claw.chat.scopes.chrome-group:41.meta": {
        chromeGroupId: 41
      }
    },
    clearUninstallUrl: async () => {
      clearCalls += 1;
    },
    sweepDetachedWindowLocks: async () => {
      sweepCalls += 1;
    }
  });

  clearCalls = 0;
  await chromeMock.events.runtimeOnInstalled.listeners[0]();
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(clearCalls, 1);
  assert.equal(sweepCalls, 1);
  assert.notEqual(chromeMock.storageMock.state["claw.chat.scopes.chrome-group:41.meta"], undefined);
}

async function testTabGroupCleanupFailureAppendsAuditEntry() {
  const auditCalls = [];
  const cleanupRuntime = {
    async cleanupClosedGroupScopes() {
      throw new Error("cleanup failed");
    },
    async appendCleanupAudit(type, payload) {
      auditCalls.push({
        type,
        payload
      });
    }
  };
  const { chromeMock } = createServiceWorkerHarness({
    cleanupRuntime
  });

  chromeMock.events.tabGroupsOnRemoved.listeners[0]({
    id: 44
  });
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(auditCalls.length, 1);
  assert.equal(auditCalls[0].type, "closed_group_failed");
  assert.equal(auditCalls[0].payload.groupId, 44);
  assert.equal(auditCalls[0].payload.message, "Error: cleanup failed");
}

async function testStartupMaintenanceFailureOnlyWarns() {
  const warnings = [];
  const cleanupRuntime = {
    async cleanupOrphanGroupScopes() {
      throw new Error("scan failed");
    },
    async cleanupClosedGroupScopes() {
      return {
        removedScopeIds: [],
        removedKeyCount: 0
      };
    },
    async appendCleanupAudit() {}
  };
  const { chromeMock } = createServiceWorkerHarness({
    consoleOverride: {
      warn(...args) {
        warnings.push(args);
      }
    },
    cleanupRuntime,
    clearUninstallUrl: async () => {},
    sweepDetachedWindowLocks: async () => {}
  });

  chromeMock.events.runtimeOnStartup.listeners[0]();
  await flushMicrotasks();
  await flushMicrotasks();

  assert.equal(warnings.length, 1);
  assert.equal(String(warnings[0][0]).includes("[background-maintenance] startup maintenance failed"), true);
}

async function testCleanupClosedGroupNoMatchWritesAudit() {
  const { api, chromeMock } = createServiceWorkerHarness({
    register: false,
    storageState: {
      "claw.chat.scopes.group:99.messages": {
        mainTabId: 99
      }
    }
  });
  const cleanupRuntime = api.createScopeCleanupRuntime({
    chrome: chromeMock.chrome,
    console
  });

  const result = await cleanupRuntime.cleanupClosedGroupScopes(777);
  const audit = chromeMock.storageMock.state["claw.chat.cleanup.audit"];

  assert.equal(result.removedKeyCount, 0);
  assert.equal(Array.isArray(audit), true);
  assert.equal(audit[audit.length - 1].type, "closed_group_no_match");
  assert.equal(audit[audit.length - 1].payload.groupId, 777);
}

async function testCleanupOrphanGroupScopesNoGroupsWritesAudit() {
  const { api, chromeMock } = createServiceWorkerHarness({
    register: false,
    storageState: {
      unrelated: {
        value: 1
      }
    }
  });
  const cleanupRuntime = api.createScopeCleanupRuntime({
    chrome: chromeMock.chrome,
    console
  });

  const result = await cleanupRuntime.cleanupOrphanGroupScopes();
  const audit = chromeMock.storageMock.state["claw.chat.cleanup.audit"];

  assert.equal(result.removedKeyCount, 0);
  assert.equal(Array.isArray(audit), true);
  assert.equal(audit[audit.length - 1].type, "orphan_scan_no_groups");
}

async function main() {
  await testCleanupClosedGroupRetainsRelatedScopesForUrlRecovery();
  await testCleanupOrphanGroupScopesRetainsChromeGroupScopesForUrlRecovery();
  await testRuntimeMessageHandlerDelegatesToDetachedWindowOpener();
  await testUnknownMessageReturnsFalseWithoutCallingOpener();
  await testMessageHandlerReturnsFailurePayloadWhenOpenerRejects();
  await testTabRemovedClosesMatchingDetachedWindowLock();
  await testWindowRemovedClosesHostWindowLocksAndRemovesWindowLock();
  await testCommandHandlerSendsNewChatRuntimeMessage();
  await testCommandHandlerResolvesActiveTabWhenChromeOmitsTabArgument();
  await testNewChatCommandOpensAndPingsSidePanelBeforeSendingMessage();
  await testNewChatCommandRetriesPingUntilSidePanelIsReady();
  await testRegisterCallsInjectedClearUninstallUrlImmediately();
  await testStartupMaintenanceRunsInjectedCleanupSteps();
  await testInstalledMaintenanceRunsInjectedCleanupSteps();
  await testTabGroupCleanupFailureAppendsAuditEntry();
  await testStartupMaintenanceFailureOnlyWarns();
  await testCleanupClosedGroupNoMatchWritesAudit();
  await testCleanupOrphanGroupScopesNoGroupsWritesAudit();
  console.log("service worker runtime integration tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
