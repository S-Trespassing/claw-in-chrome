(function () {
  if (globalThis.__CP_SERVICE_WORKER_RUNTIME__) {
    return;
  }

  const sessionContract = globalThis.__CP_CONTRACT__?.session || {};
  const detachedWindowContract = globalThis.__CP_CONTRACT__?.detachedWindow || {};
  const messageContract = globalThis.__CP_CONTRACT__?.messages || {};
  const CHAT_SCOPE_PREFIX = sessionContract.CHAT_SCOPE_PREFIX || "claw.chat.scopes.";
  const CHAT_CLEANUP_AUDIT_KEY = sessionContract.CHAT_CLEANUP_AUDIT_KEY || "claw.chat.cleanup.audit";
  const CHAT_CLEANUP_AUDIT_LIMIT = Number.isFinite(Number(sessionContract.CHAT_CLEANUP_AUDIT_LIMIT)) ? Math.trunc(Number(sessionContract.CHAT_CLEANUP_AUDIT_LIMIT)) : 40;
  const OPEN_GROUP_DETACHED_WINDOW_MESSAGE_TYPE = detachedWindowContract.OPEN_GROUP_MESSAGE_TYPE || "OPEN_GROUP_DETACHED_WINDOW";
  const OPEN_SIDE_PANEL_MESSAGE_TYPE = messageContract.open_side_panel || "open_side_panel";
  const PING_SIDEPANEL_MESSAGE_TYPE = messageContract.PING_SIDEPANEL || "PING_SIDEPANEL";
  const TOGGLE_SIDE_PANEL_COMMAND_NAME = "toggle-side-panel";
  const NEW_CHAT_COMMAND_NAME = "new-chat";
  const NEW_CHAT_SESSION_MESSAGE_TYPE = "NEW_CHAT_SESSION";

  function createNoopConsole() {
    return {
      debug() {},
      warn() {}
    };
  }

  function normalizeStorageScopeId(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function extractScopeIdFromStorageKey(key) {
    const rawKey = String(key || "");
    if (!rawKey.startsWith(CHAT_SCOPE_PREFIX)) {
      return "";
    }
    const suffix = rawKey.slice(CHAT_SCOPE_PREFIX.length);
    const separatorIndex = suffix.indexOf(".");
    return separatorIndex > 0 ? suffix.slice(0, separatorIndex) : "";
  }

  // session cleanup 子链只关心 storage 里的 scope 账本，不负责 popup/ack/message 分发。
  function createScopeCleanupRuntime(deps) {
    const options = deps && typeof deps === "object" ? deps : {};
    const chromeApi = options.chrome;
    if (!chromeApi?.storage?.local) {
      throw new Error("createScopeCleanupRuntime requires chrome.storage.local");
    }
    const consoleApi = options.console || globalThis.console || createNoopConsole();
    const now = typeof options.now === "function" ? options.now : () => Date.now();
    const createTrackedScopeEntry = () => ({
      keys: [],
      groupIds: new Set(),
      mainTabIds: new Set()
    });

    function getGroupIdFromScopeId(scopeId) {
      const normalizedScopeId = normalizeStorageScopeId(scopeId);
      if (!normalizedScopeId.startsWith("chrome-group:")) {
        return null;
      }
      const groupId = Number(normalizedScopeId.slice("chrome-group:".length));
      return Number.isFinite(groupId) && groupId !== chromeApi.tabGroups?.TAB_GROUP_ID_NONE ? groupId : null;
    }

    function isChromeGroupScopeId(scopeId) {
      return normalizeStorageScopeId(scopeId).startsWith("chrome-group:");
    }

    function getMainTabIdFromScopeId(scopeId) {
      const normalizedScopeId = normalizeStorageScopeId(scopeId);
      if (!normalizedScopeId.startsWith("group:")) {
        return null;
      }
      const mainTabId = Number(normalizedScopeId.slice("group:".length));
      return Number.isFinite(mainTabId) && mainTabId > 0 ? mainTabId : null;
    }

    function collectGroupIdsFromStorageValue(value) {
      const groupIds = new Set();
      const addGroupId = candidate => {
        const groupId = Number(candidate);
        if (Number.isFinite(groupId) && groupId !== chromeApi.tabGroups?.TAB_GROUP_ID_NONE) {
          groupIds.add(groupId);
        }
      };

      if (Array.isArray(value)) {
        for (const item of value) {
          addGroupId(item?.chromeGroupId);
        }
        return groupIds;
      }

      if (value && typeof value === "object") {
        addGroupId(value.chromeGroupId);
        addGroupId(value?.meta?.chromeGroupId);
      }

      return groupIds;
    }

    function collectMainTabIdsFromStorageValue(value) {
      const mainTabIds = new Set();
      const addMainTabId = candidate => {
        const mainTabId = Number(candidate);
        if (Number.isFinite(mainTabId) && mainTabId > 0) {
          mainTabIds.add(mainTabId);
        }
      };

      if (Array.isArray(value)) {
        for (const item of value) {
          addMainTabId(item?.mainTabId);
        }
        return mainTabIds;
      }

      if (value && typeof value === "object") {
        addMainTabId(value.mainTabId);
        addMainTabId(value?.meta?.mainTabId);
      }

      return mainTabIds;
    }

    // storage 快照索引层：
    // 把同一 scopeId 下分散在多个 key 的内容先聚合起来，
    // 后续 closed-group / orphan-scan 都只面对这个索引，不直接在原始 snapshot 上重复扫。
    function collectStoredScopeEntries(storageSnapshot) {
      const scopeEntries = new Map();
      for (const [storageKey, storageValue] of Object.entries(storageSnapshot || {})) {
        const scopeId = extractScopeIdFromStorageKey(storageKey);
        if (!scopeId) {
          continue;
        }
        if (!scopeEntries.has(scopeId)) {
          scopeEntries.set(scopeId, createTrackedScopeEntry());
        }
        const entry = scopeEntries.get(scopeId);
        entry.keys.push(storageKey);
        const scopeGroupId = getGroupIdFromScopeId(scopeId);
        if (scopeGroupId !== null) {
          entry.groupIds.add(scopeGroupId);
        }
        const scopeMainTabId = getMainTabIdFromScopeId(scopeId);
        if (scopeMainTabId !== null) {
          entry.mainTabIds.add(scopeMainTabId);
        }
        for (const groupId of collectGroupIdsFromStorageValue(storageValue)) {
          entry.groupIds.add(groupId);
        }
        for (const mainTabId of collectMainTabIdsFromStorageValue(storageValue)) {
          entry.mainTabIds.add(mainTabId);
        }
      }
      return scopeEntries;
    }

    function findScopeIdsByGroupId(scopeEntries, groupId) {
      const matchedScopeIds = [];
      for (const [scopeId, entry] of scopeEntries.entries()) {
        if (entry.groupIds.has(groupId)) {
          matchedScopeIds.push(scopeId);
        }
      }
      return matchedScopeIds;
    }

    async function appendCleanupAudit(type, payload = {}) {
      try {
        const existing = await chromeApi.storage.local.get(CHAT_CLEANUP_AUDIT_KEY);
        const currentItems = Array.isArray(existing[CHAT_CLEANUP_AUDIT_KEY]) ? existing[CHAT_CLEANUP_AUDIT_KEY] : [];
        const nextItems = [
          ...currentItems,
          {
            ts: new Date(now()).toISOString(),
            type,
            payload
          }
        ].slice(-CHAT_CLEANUP_AUDIT_LIMIT);
        await chromeApi.storage.local.set({
          [CHAT_CLEANUP_AUDIT_KEY]: nextItems
        });
      } catch {}
    }

    async function removeScopeEntries(scopeIds, storageSnapshot = null) {
      const normalizedScopeIds = [
        ...new Set((Array.isArray(scopeIds) ? scopeIds : []).map(normalizeStorageScopeId).filter(Boolean))
      ];
      if (normalizedScopeIds.length === 0) {
        return {
          removedScopeIds: [],
          removedKeyCount: 0
        };
      }

      const scopeIdSet = new Set(normalizedScopeIds);
      const snapshot = storageSnapshot ?? await chromeApi.storage.local.get(null);
      const keysToRemove = [];
      for (const storageKey of Object.keys(snapshot)) {
        const scopeId = extractScopeIdFromStorageKey(storageKey);
        if (scopeId && scopeIdSet.has(scopeId)) {
          keysToRemove.push(storageKey);
        }
      }

      if (keysToRemove.length > 0) {
        await chromeApi.storage.local.remove(keysToRemove);
      }

      consoleApi.debug?.("[session-cleanup] removed scopes", {
        scopeIds: normalizedScopeIds,
        removedKeyCount: keysToRemove.length
      });
      await appendCleanupAudit("removed_scopes", {
        scopeIds: normalizedScopeIds,
        removedKeyCount: keysToRemove.length
      });

      return {
        removedScopeIds: normalizedScopeIds,
        removedKeyCount: keysToRemove.length
      };
    }

    // tab group 被关闭后的清理链：
    // 先找出所有指向该 chrome-group 的 scope，再把同 mainTabId 关联的 group:* scope 一并清掉。
    async function cleanupClosedGroupScopes(groupIdValue) {
      const groupId = Number(groupIdValue);
      if (!Number.isFinite(groupId) || groupId === chromeApi.tabGroups?.TAB_GROUP_ID_NONE) {
        return {
          removedScopeIds: [],
          removedKeyCount: 0
        };
      }

      const storageSnapshot = await chromeApi.storage.local.get(null);
      const scopeEntries = collectStoredScopeEntries(storageSnapshot);
      const directScopeIdsForClosedGroup = findScopeIdsByGroupId(scopeEntries, groupId);

      if (directScopeIdsForClosedGroup.length === 0) {
        consoleApi.debug?.("[session-cleanup] no scopes matched closed group", {
          groupId
        });
        await appendCleanupAudit("closed_group_no_match", {
          groupId
        });
        return {
          removedScopeIds: [],
          removedKeyCount: 0
        };
      }

      // 第二层扩散规则：group 关闭后，不只删 chrome-group:*；
      // 同 mainTabId 关联的 group:* scope 也要一起删，避免会话只删半边。
      const mainTabIdsLinkedToClosedGroup = new Set();
      for (const scopeId of directScopeIdsForClosedGroup) {
        const entry = scopeEntries.get(scopeId);
        if (!entry) {
          continue;
        }
        for (const mainTabId of entry.mainTabIds) {
          mainTabIdsLinkedToClosedGroup.add(mainTabId);
        }
      }

      const scopeIdsToRemove = new Set(directScopeIdsForClosedGroup);
      if (mainTabIdsLinkedToClosedGroup.size > 0) {
        for (const [scopeId, entry] of scopeEntries.entries()) {
          if ([...entry.mainTabIds].some(mainTabId => mainTabIdsLinkedToClosedGroup.has(mainTabId))) {
            scopeIdsToRemove.add(scopeId);
          }
        }
      }

      // NOTE: 为支持按 URL 恢复会话，group 关闭不再删除 scope 数据；
      // 这里只记录审计信息，便于诊断“本来会命中哪些 scope”。
      const retainedScopeIds = [...scopeIdsToRemove];
      const auditScopeIdSampleLimit = 12;
      consoleApi.debug?.("[session-cleanup] retain scopes for closed group", {
        groupId,
        retainedScopeCount: retainedScopeIds.length
      });
      await appendCleanupAudit("closed_group_retained", {
        groupId,
        retainedScopeCount: retainedScopeIds.length,
        scopeIds: retainedScopeIds.slice(0, auditScopeIdSampleLimit)
      });
      return {
        removedScopeIds: [],
        removedKeyCount: 0
      };
    }

    async function canResolveTabGroup(groupId) {
      if (typeof chromeApi.tabGroups?.get !== "function") {
        return false;
      }
      try {
        await chromeApi.tabGroups.get(groupId);
        return true;
      } catch {
        return false;
      }
    }

    // 启动/安装时做一次孤儿组扫描，只删 chrome-group:* 这类“组已经消失”的残留 scope。
    async function cleanupOrphanGroupScopes() {
      const storageSnapshot = await chromeApi.storage.local.get(null);
      const scopeEntries = collectStoredScopeEntries(storageSnapshot);
      const groupIdsSeenInScopeSnapshot = new Set();

      for (const entry of scopeEntries.values()) {
        for (const groupId of entry.groupIds) {
          groupIdsSeenInScopeSnapshot.add(groupId);
        }
      }

      if (groupIdsSeenInScopeSnapshot.size === 0) {
        await appendCleanupAudit("orphan_scan_no_groups", {});
        return {
          removedScopeIds: [],
          removedKeyCount: 0
        };
      }

      const orphanScopeIds = new Set();
      // orphan scan 只按 groupId 是否还能 resolve 来判定，
      // 命中后只移除 chrome-group:* scope，把 group:* 会话留给显式 group close 链处理。
      for (const groupId of groupIdsSeenInScopeSnapshot) {
        const exists = await canResolveTabGroup(groupId);
        if (!exists) {
          for (const scopeId of findScopeIdsByGroupId(scopeEntries, groupId)) {
            if (isChromeGroupScopeId(scopeId)) {
              orphanScopeIds.add(scopeId);
            }
          }
        }
      }

      if (orphanScopeIds.size === 0) {
        consoleApi.debug?.("[session-cleanup] orphan scope scan found nothing to remove");
        await appendCleanupAudit("orphan_scan_noop", {
          groupIds: [...groupIdsSeenInScopeSnapshot]
        });
        return {
          removedScopeIds: [],
          removedKeyCount: 0
        };
      }

      // NOTE: 为支持按 URL 恢复会话，孤儿组扫描不再删除 scope 数据；
      // 这里只记录审计信息，便于诊断“哪些 scope 已经变成孤儿”。
      const retainedScopeIds = [...orphanScopeIds];
      const auditScopeIdSampleLimit = 12;
      consoleApi.debug?.("[session-cleanup] retain orphan scopes for url recovery", {
        retainedScopeCount: retainedScopeIds.length
      });
      await appendCleanupAudit("orphan_scan_retained", {
        retainedScopeCount: retainedScopeIds.length,
        scopeIds: retainedScopeIds.slice(0, auditScopeIdSampleLimit)
      });
      return {
        removedScopeIds: [],
        removedKeyCount: 0
      };
    }

    return {
      constants: {
        CHAT_SCOPE_PREFIX,
        CHAT_CLEANUP_AUDIT_KEY,
        CHAT_CLEANUP_AUDIT_LIMIT
      },
      normalizeStorageScopeId,
      extractScopeIdFromStorageKey,
      getGroupIdFromScopeId,
      isChromeGroupScopeId,
      getMainTabIdFromScopeId,
      collectGroupIdsFromStorageValue,
      collectMainTabIdsFromStorageValue,
      collectStoredScopeEntries,
      findScopeIdsByGroupId,
      appendCleanupAudit,
      removeScopeEntries,
      canResolveTabGroup,
      cleanupClosedGroupScopes,
      cleanupOrphanGroupScopes
    };
  }

  // service worker recovered runtime 只补三层职责：
  // 1) detached window 打开/复用/锁清理
  // 2) session scope cleanup
  // 3) 安装/启动时的维护任务
  // ACK、静态提示条心跳、MCP/native host 等消息仍由 bundle 内原 onMessage 主桥处理。
  function createServiceWorkerRuntimeHandlers(deps) {
    const options = deps && typeof deps === "object" ? deps : {};
    const chromeApi = options.chrome;
    if (!chromeApi) {
      throw new Error("createServiceWorkerRuntimeHandlers requires a chrome dependency");
    }
    const consoleApi = options.console || globalThis.console || createNoopConsole();
    const cleanupRuntime = options.cleanupRuntime || createScopeCleanupRuntime(options);
    const normalizePositiveNumber = typeof options.normalizePositiveNumber === "function" ? options.normalizePositiveNumber : value => {
      const normalizedValue = Number(value);
      return Number.isFinite(normalizedValue) && normalizedValue > 0 ? Math.trunc(normalizedValue) : null;
    };
    const clearUninstallUrl = typeof options.clearUninstallUrl === "function" ? options.clearUninstallUrl : async () => {};
    const sweepDetachedWindowLocks = typeof options.sweepDetachedWindowLocks === "function" ? options.sweepDetachedWindowLocks : async () => ({});
    const readDetachedWindowLocks = typeof options.readDetachedWindowLocks === "function" ? options.readDetachedWindowLocks : async () => ({});
    const closeDetachedWindowForLockEntry = typeof options.closeDetachedWindowForLockEntry === "function" ? options.closeDetachedWindowForLockEntry : async () => false;
    const removeDetachedWindowLockByWindowId = typeof options.removeDetachedWindowLockByWindowId === "function" ? options.removeDetachedWindowLockByWindowId : async () => [];
    const openDetachedWindowForGroup = typeof options.openDetachedWindowForGroup === "function" ? options.openDetachedWindowForGroup : async () => ({
      success: false,
      error: "Missing openDetachedWindowForGroup dependency"
    });
    const openSidePanelTabIds = new Set();
    const getDetachedLocksForHostWindow = (locks, normalizedWindowId) => Object.values(locks).filter(lockEntry =>
      lockEntry?.hostWindowId === normalizedWindowId &&
      lockEntry?.windowId !== normalizedWindowId
    );
    const getDetachedLocksForMainTab = (locks, normalizedTabId) => Object.values(locks).filter(lockEntry => lockEntry?.mainTabId === normalizedTabId);
    const buildDetachedWindowOpenFailure = error => ({
      success: false,
      error: error instanceof Error ? error.message : String(error || "Unknown detached window error")
    });

    // 安装/启动维护链：清掉发行版留下的 uninstall survey，再做 scope + detached lock 巡检。
    async function runBackgroundMaintenance() {
      await clearUninstallUrl();
      await cleanupRuntime.cleanupOrphanGroupScopes();
      await sweepDetachedWindowLocks();
    }

    function onInstalled() {
      runBackgroundMaintenance().catch(error => {
        consoleApi.warn?.("[background-maintenance] install maintenance failed", error);
      });
    }

    function onStartup() {
      runBackgroundMaintenance().catch(error => {
        consoleApi.warn?.("[background-maintenance] startup maintenance failed", error);
      });
    }

    // group 关闭只触发 session scope 清理。
    // detached popup 本身仍依赖 onTabRemoved/onWindowRemoved 收口，避免和现存窗口竞争状态。
    function onTabGroupRemoved(group) {
      cleanupRuntime.cleanupClosedGroupScopes(group?.id).catch(error => {
        consoleApi.warn?.("[session-cleanup] closed group cleanup failed", error);
        cleanupRuntime.appendCleanupAudit("closed_group_failed", {
          groupId: Number(group?.id),
          message: error instanceof Error ? error.message : String(error || "")
        });
      });
    }

    // host window 被关掉时，先找所有挂在这个 host 上的 detached popup 并关闭，
    // 再按 windowId 把对应锁账本删掉，避免 popup 已死但锁还在。
    function onWindowRemoved(windowId) {
      (async () => {
        const normalizedWindowId = normalizePositiveNumber(windowId);
        const locks = await readDetachedWindowLocks();
        const hostWindowLocks = getDetachedLocksForHostWindow(locks, normalizedWindowId);
        for (const lockEntry of hostWindowLocks) {
          await closeDetachedWindowForLockEntry(lockEntry);
        }
        await removeDetachedWindowLockByWindowId(windowId);
      })().catch(error => {
        consoleApi.warn?.("[detached-window] failed to cleanup popup lock", {
          windowId,
          message: error instanceof Error ? error.message : String(error || "")
        });
      });
    }

    // main tab 被删掉时，group 对应的 detached popup 失去锚点，直接按 lock 关闭。
    function onTabRemoved(tabId) {
      (async () => {
        const locks = await readDetachedWindowLocks();
        const normalizedTabId = normalizePositiveNumber(tabId);
        for (const lockEntry of getDetachedLocksForMainTab(locks, normalizedTabId)) {
          await closeDetachedWindowForLockEntry(lockEntry);
        }
      })().catch(error => {
        consoleApi.warn?.("[detached-window] failed to cleanup popup after main tab removed", {
          tabId,
          message: error instanceof Error ? error.message : String(error || "")
        });
      });
    }

    const isDetachedWindowOpenMessage = message => message?.type === OPEN_GROUP_DETACHED_WINDOW_MESSAGE_TYPE;

    const buildDetachedWindowOpenPayload = (message, sender) => ({
      ...message,
      // sender.tab.id 是 detached window 打开桥的默认主上下文；
      // 显式 mainTabId 只在调用方已经知道主 tab 时覆盖。
      tabId: normalizePositiveNumber(message?.tabId) ?? normalizePositiveNumber(sender?.tab?.id),
      mainTabId: normalizePositiveNumber(message?.mainTabId)
    });

    async function handleOpenDetachedWindowMessage(message, sender) {
      return openDetachedWindowForGroup(buildDetachedWindowOpenPayload(message, sender));
    }

    async function resolveCommandTargetTabId(tab) {
      let targetTabId = normalizePositiveNumber(tab?.id);
      if (targetTabId) {
        return targetTabId;
      }
      const activeTabs = await chromeApi.tabs?.query?.({
        active: true,
        currentWindow: true
      });
      return normalizePositiveNumber(activeTabs?.[0]?.id);
    }

    async function handleToggleSidePanelCommand(command, tab) {
      if (command !== TOGGLE_SIDE_PANEL_COMMAND_NAME) {
        return false;
      }
      const targetTabId = await resolveCommandTargetTabId(tab);
      if (!targetTabId) {
        return false;
      }
      if (openSidePanelTabIds.has(targetTabId) && typeof chromeApi.sidePanel?.close === "function") {
        await chromeApi.sidePanel.close({
          tabId: targetTabId
        });
        openSidePanelTabIds.delete(targetTabId);
        return true;
      }
      await chromeApi.sidePanel?.setOptions?.({
        tabId: targetTabId,
        path: `sidepanel.html?tabId=${encodeURIComponent(targetTabId)}`,
        enabled: true
      });
      await chromeApi.sidePanel?.open?.({
        tabId: targetTabId
      });
      openSidePanelTabIds.add(targetTabId);
      return true;
    }

    async function ensureSidePanelReadyForTab(tabId) {
      const normalizedTabId = normalizePositiveNumber(tabId);
      if (!normalizedTabId) {
        return false;
      }
      await chromeApi.runtime.sendMessage({
        type: OPEN_SIDE_PANEL_MESSAGE_TYPE,
        tabId: normalizedTabId
      });
      for (let attempt = 0; attempt < 5; attempt += 1) {
        try {
          const pingResult = await chromeApi.runtime.sendMessage({
            type: PING_SIDEPANEL_MESSAGE_TYPE,
            targetTabId: normalizedTabId
          });
          if (pingResult?.success === true) {
            return true;
          }
        } catch {}
      }
      return false;
    }

    async function handleNewChatCommand(command, tab) {
      if (command !== NEW_CHAT_COMMAND_NAME) {
        return false;
      }
      const targetTabId = await resolveCommandTargetTabId(tab);
      if (!targetTabId) {
        return false;
      }
      const sidePanelReady = await ensureSidePanelReadyForTab(targetTabId);
      if (!sidePanelReady) {
        return false;
      }
      await chromeApi.runtime.sendMessage({
        type: NEW_CHAT_SESSION_MESSAGE_TYPE,
        targetTabId
      });
      return true;
    }

    function onMessage(message, sender, sendResponse) {
      // 这里故意只消费 OPEN_GROUP_DETACHED_WINDOW。
      // 其余 ACK/indicator/native host/permission 等消息继续走 bundle 内原始 runtime.onMessage 主桥。
      if (!isDetachedWindowOpenMessage(message)) {
        return false;
      }

      // runtime message handler 分层：
      // 这里只负责把 sender/message 规范化后转交 detached window opener，
      // 不在这里做 ACK、cleanup 或任何 bundle 侧消息分发。
      handleOpenDetachedWindowMessage(message, sender).then(result => {
        sendResponse(result);
      }).catch(error => {
        sendResponse(buildDetachedWindowOpenFailure(error));
      });

      return true;
    }

    function onCommand(command, tab) {
      (async () => {
        if (await handleToggleSidePanelCommand(command, tab)) {
          return;
        }
        await handleNewChatCommand(command, tab);
      })().catch(error => {
        consoleApi.warn?.("[commands] command handling failed", {
          command,
          tabId: tab?.id,
          message: error instanceof Error ? error.message : String(error || "")
        });
      });
    }

    return {
      chrome: chromeApi,
      cleanupRuntime,
      clearUninstallUrl,
      runBackgroundMaintenance,
      isDetachedWindowOpenMessage,
      buildDetachedWindowOpenPayload,
      handleOpenDetachedWindowMessage,
      resolveCommandTargetTabId,
      handleToggleSidePanelCommand,
      ensureSidePanelReadyForTab,
      handleNewChatCommand,
      handlers: {
        onInstalled,
        onStartup,
        onTabGroupRemoved,
        onWindowRemoved,
        onTabRemoved,
        onMessage,
        onCommand
      }
    };
  }

  function registerServiceWorkerRuntimeHandlers(deps) {
    const runtime = createServiceWorkerRuntimeHandlers(deps);
    Promise.resolve(runtime.clearUninstallUrl()).catch(() => {});
    runtime.chrome.runtime?.onInstalled?.addListener?.(runtime.handlers.onInstalled);
    runtime.chrome.runtime?.onStartup?.addListener?.(runtime.handlers.onStartup);
    runtime.chrome.tabGroups?.onRemoved?.addListener?.(runtime.handlers.onTabGroupRemoved);
    runtime.chrome.windows?.onRemoved?.addListener?.(runtime.handlers.onWindowRemoved);
    runtime.chrome.tabs?.onRemoved?.addListener?.(runtime.handlers.onTabRemoved);
    runtime.chrome.runtime?.onMessage?.addListener?.(runtime.handlers.onMessage);
    runtime.chrome.commands?.onCommand?.addListener?.(runtime.handlers.onCommand);
    return runtime;
  }

  globalThis.__CP_SERVICE_WORKER_RUNTIME__ = {
    constants: {
      CHAT_SCOPE_PREFIX,
      CHAT_CLEANUP_AUDIT_KEY,
      CHAT_CLEANUP_AUDIT_LIMIT
    },
    normalizeStorageScopeId,
    extractScopeIdFromStorageKey,
    createScopeCleanupRuntime,
    createServiceWorkerRuntimeHandlers,
    registerServiceWorkerRuntimeHandlers
  };
})();
