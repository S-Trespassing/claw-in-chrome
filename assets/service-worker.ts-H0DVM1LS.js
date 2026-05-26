import {
  Y as e,
  t,
  Z as s,
  _ as a,
  $ as n,
  a0 as o,
  a1 as i,
  a2 as r,
  a3 as c,
  a4 as d,
  a5 as u,
} from "./mcpPermissions-qqAoJjJ8.js";
import {
  r as m,
  s as l,
  S as p,
  x as h,
  j as w,
  n as y,
  y as f,
  p as g,
  z as _,
  A as T,
  B as b,
  c as I,
  C as v,
  E,
} from "./PermissionManager-9s959502.js";
import "./index-BVS4T5_D.js";
let A = null;
let N = null;
let P = false;
let k = false;
let S = false;
let C = null;
let M = null;
const __cpNativeMessagingContract =
  globalThis.__CP_CONTRACT__?.nativeMessaging || {};
const __cpNativeMessagingPermission =
  __cpNativeMessagingContract.PERMISSION || "nativeMessaging";
const __cpNativeHostDesktopName =
  __cpNativeMessagingContract.HOST_DESKTOP ||
  "com.anthropic.claude_browser_extension";
const __cpNativeHostClaudeCodeName =
  __cpNativeMessagingContract.HOST_CLAUDE_CODE ||
  "com.anthropic.claude_code_browser_extension";
const __cpExtensionUrlPrefix = "/chrome/";
const __cpExtensionUrlPermissionsPath = "/chrome/permissions";
// 语义锚点：PermissionManager 相关的 storage key 优先从 contract 读取（缺失时回退到 bundle 内枚举）。
const __cpContractPermissionManagerKeys =
  globalThis.__CP_CONTRACT__?.permissionManager || {};
const __cpStorageKeyUpdateAvailable =
  __cpContractPermissionManagerKeys.UPDATE_AVAILABLE_STORAGE_KEY ||
  "updateAvailable";
const __cpStorageKeySavedPrompts =
  __cpContractPermissionManagerKeys.SAVED_PROMPTS_STORAGE_KEY || "savedPrompts";
const __cpAlarmPrefixPrompt = "prompt_";
const __cpAlarmPrefixRetry = "retry_";
const __cpCommandToggleSidePanel = "toggle-side-panel";
const __cpOpenSidePanelTabIds = new Set();
const __cpContractMessages = globalThis.__CP_CONTRACT__?.messages || {};
const __cpAgentIndicatorContract =
  globalThis.__CP_CONTRACT__?.agentIndicator || {};
const __cpBackgroundMessageTypeSwKeepalive =
  __cpContractMessages.SW_KEEPALIVE || "SW_KEEPALIVE";
const __cpBackgroundMessageTypePanelOpened =
  __cpContractMessages.PANEL_OPENED || "PANEL_OPENED";
const __cpBackgroundMessageTypePanelClosed =
  __cpContractMessages.PANEL_CLOSED || "PANEL_CLOSED";
const __cpBackgroundMessageTypeShowPermissionNotification =
  __cpContractMessages.SHOW_PERMISSION_NOTIFICATION ||
  "SHOW_PERMISSION_NOTIFICATION";
const __cpBackgroundMessageTypeResizeWindow =
  __cpContractMessages.resize_window || "resize_window";
const __cpBackgroundMessageTypeMcpPermissionResponse =
  __cpContractMessages.MCP_PERMISSION_RESPONSE || "MCP_PERMISSION_RESPONSE";
const __cpBackgroundMessageTypeCheckAndRefreshOauth =
  __cpContractMessages.check_and_refresh_oauth || "check_and_refresh_oauth";
const __cpBackgroundMessageTypePlayNotificationSound =
  __cpContractMessages.PLAY_NOTIFICATION_SOUND || "PLAY_NOTIFICATION_SOUND";
const __cpBackgroundMessageTypeOpenSidePanel =
  __cpContractMessages.open_side_panel || "open_side_panel";
const __cpBackgroundMessageTypeCheckNativeHostStatus =
  __cpContractMessages.check_native_host_status || "check_native_host_status";
const __cpBackgroundMessageTypeSendMcpNotification =
  __cpContractMessages.SEND_MCP_NOTIFICATION || "SEND_MCP_NOTIFICATION";
const __cpBackgroundMessageTypeOpenOptionsWithTask =
  __cpContractMessages.OPEN_OPTIONS_WITH_TASK || "OPEN_OPTIONS_WITH_TASK";
const __cpBackgroundMessageTypeExecuteScheduledTask =
  __cpContractMessages.EXECUTE_SCHEDULED_TASK || "EXECUTE_SCHEDULED_TASK";
const __cpBackgroundMessageTypeStopAgent =
  __cpContractMessages.STOP_AGENT || "STOP_AGENT";
const __cpBackgroundMessageTypeSwitchToMainTab =
  __cpContractMessages.SWITCH_TO_MAIN_TAB || "SWITCH_TO_MAIN_TAB";
const __cpBackgroundMessageTypeSecondaryTabCheckMain =
  __cpContractMessages.SECONDARY_TAB_CHECK_MAIN || "SECONDARY_TAB_CHECK_MAIN";
const __cpBackgroundMessageTypeMainTabAckResponse =
  __cpContractMessages.MAIN_TAB_ACK_RESPONSE || "MAIN_TAB_ACK_RESPONSE";
const __cpBackgroundMessageTypeStaticIndicatorHeartbeat =
  __cpContractMessages.STATIC_INDICATOR_HEARTBEAT ||
  "STATIC_INDICATOR_HEARTBEAT";
const __cpBackgroundMessageTypeDismissStaticIndicatorForGroup =
  __cpContractMessages.DISMISS_STATIC_INDICATOR_FOR_GROUP ||
  "DISMISS_STATIC_INDICATOR_FOR_GROUP";
const __cpBackgroundMessageTypePopulateInputText =
  __cpContractMessages.POPULATE_INPUT_TEXT || "POPULATE_INPUT_TEXT";
const __cpBackgroundMessageTypeExecuteTask =
  __cpContractMessages.EXECUTE_TASK || "EXECUTE_TASK";
const __cpBackgroundMessageTypeOffscreenPlaySound =
  __cpContractMessages.OFFSCREEN_PLAY_SOUND || "OFFSCREEN_PLAY_SOUND";
const __cpBackgroundMessageTypeMainTabAckRequest =
  __cpContractMessages.MAIN_TAB_ACK_REQUEST || "MAIN_TAB_ACK_REQUEST";
const __cpAgentIndicatorCurrentTabSentinel =
  __cpAgentIndicatorContract.CURRENT_TAB_SENTINEL || "CURRENT_TAB";
const __cpStaticIndicatorAckPayloadFieldSecondaryTabId = "secondaryTabId";
const __cpStaticIndicatorAckPayloadFieldMainTabId = "mainTabId";
const __cpStaticIndicatorAckPayloadFieldTimestamp = "timestamp";
const __cpStaticIndicatorAckCacheTtlMs = 3000;
const __cpBackgroundMessageTypeLogout = "logout";
const __cpExternalMessageTypeOauthRedirect = "oauth_redirect";
const __cpExternalMessageTypePing = "ping";
const __cpExternalMessageTypeOnboardingTask = "onboarding_task";
const __cpTrustedExternalOriginClaudeAi = "https://claude.ai";
const __cpTrustedExternalOrigins = [__cpTrustedExternalOriginClaudeAi];
const __cpPermissionManagerStorageKeyMcpConnected =
  __cpContractPermissionManagerKeys.MCP_CONNECTED_STORAGE_KEY ||
  p.MCP_CONNECTED;
const __cpPermissionManagerStorageKeyUpdateAvailable =
  __cpContractPermissionManagerKeys.UPDATE_AVAILABLE_STORAGE_KEY ||
  p.UPDATE_AVAILABLE;
const __cpPermissionManagerStorageKeyPendingScheduledTask =
  __cpContractPermissionManagerKeys.PENDING_SCHEDULED_TASK_STORAGE_KEY ||
  p.PENDING_SCHEDULED_TASK;
const __cpPermissionManagerStorageKeyTargetTabId =
  __cpContractPermissionManagerKeys.TARGET_TAB_ID_STORAGE_KEY ||
  p.TARGET_TAB_ID;
const __cpNativePortMessageTypeToolRequest = "tool_request";
const __cpNativePortMessageTypeToolResponse = "tool_response";
const __cpNativePortMessageTypeStatusResponse = "status_response";
const __cpNativePortMessageTypeMcpConnected = "mcp_connected";
const __cpNativePortMessageTypeMcpDisconnected = "mcp_disconnected";
const __cpNativePortMessageTypePing = "ping";
const __cpNativePortMessageTypePong = "pong";
const __cpNativePortMessageTypeGetStatus = "get_status";
const __cpNativePortMessageTypeNotification = "notification";
const __cpNativePortNotificationJsonRpcVersion = "2.0";
const __cpChromeNotificationTypeBasic = "basic";
const __cpScheduledTaskFallbackName = "Scheduled Task";
const __cpScheduledTaskExecutionTypeManual = "manual";
const __cpScheduledTaskExecutionTypeAutomatic = "automatic";
const __cpSwitchToMainTabErrorNoMainTab = "No main tab found";
const __cpSwitchToMainTabErrorNoSenderTab = "No sender tab";
const __cpExternalBridgeErrorUntrustedOrigin = "Untrusted origin";
function L(e) {
  if (e?.includes("native messaging host not found")) {
    k = false;
  }
}
// 原生宿主桥初始化入口：检查权限、探测两个 host，并把 port 生命周期挂到后台。
async function R() {
  try {
    return await (async function () {
      if (A) {
        return true;
      }
      if (P) {
        return false;
      }
      P = true;
      try {
        if (
          !(await chrome.permissions.contains({
            permissions: [__cpNativeMessagingPermission],
          }))
        ) {
          return false;
        }
        if (typeof chrome.runtime.connectNative != "function") {
          return false;
        }
        const s = [
          {
            name: __cpNativeHostDesktopName,
            label: "Desktop",
          },
          {
            name: __cpNativeHostClaudeCodeName,
            label: "Claude Code",
          },
        ];
        for (const a of s) {
          try {
            const t = chrome.runtime.connectNative(a.name);
            if (
              await new Promise((e) => {
                let s = false;
                const a = () => {
                  if (!s) {
                    s = true;
                    chrome.runtime.lastError;
                    e(false);
                  }
                };
                const n = (o) => {
                  if (!s) {
                    if (o.type === __cpNativePortMessageTypePong) {
                      s = true;
                      t.onDisconnect.removeListener(a);
                      t.onMessage.removeListener(n);
                      e(true);
                    }
                  }
                };
                t.onDisconnect.addListener(a);
                t.onMessage.addListener(n);
                try {
                  t.postMessage({
                    type: __cpNativePortMessageTypePing,
                  });
                } catch (o) {
                  if (!s) {
                    s = true;
                    e(false);
                  }
                  return;
                }
                setTimeout(() => {
                  if (!s) {
                    s = true;
                    t.onDisconnect.removeListener(a);
                    t.onMessage.removeListener(n);
                    e(false);
                  }
                }, 10000);
              })
            ) {
              A = t;
              N = a.name;
              k = true;
              A.onMessage.addListener(async (e) => {
                await O(e);
              });
              A.onDisconnect.addListener(() => {
                const t = chrome.runtime.lastError?.message;
                A = null;
                N = null;
                S = false;
                l(__cpPermissionManagerStorageKeyMcpConnected, false);
                L(t);
                e();
              });
              A.postMessage({
                type: __cpNativePortMessageTypeGetStatus,
              });
              return true;
            }
            t.disconnect();
          } catch (t) {}
        }
        return false;
      } catch (t) {
        if (t instanceof Error) {
          L(t.message);
        }
        return false;
      } finally {
        P = false;
      }
    })();
  } catch (t) {
    return false;
  }
}
// 原生宿主权限/会话清理入口：移除 nativeMessaging 权限并断开现有 port。
async function U() {
  try {
    await chrome.permissions.remove({
      permissions: [__cpNativeMessagingPermission],
    });
    A?.disconnect();
    A = null;
    N = null;
    P = false;
    k = false;
    S = false;
    return true;
  } catch (e) {
    return false;
  }
}
// 原生宿主消息分发：工具执行、连接状态同步、状态查询回包。
async function O(e) {
  switch (e.type) {
    case __cpNativePortMessageTypeToolRequest:
      await (async function (e) {
        try {
          const { method: t, params: n } = e;
          if (t === "execute_tool") {
            if (!n?.tool) {
              D(s("No tool specified"));
              return;
            }
            const e = n.client_id;
            const t = n.args?.tabGroupId;
            const o =
              typeof t == "number"
                ? t
                : (typeof t == "string" && parseInt(t, 10)) || undefined;
            const i = n.args?.tabId;
            const r =
              typeof i == "number"
                ? i
                : (typeof i == "string" && parseInt(i, 10)) || undefined;
            const c = n.session_scope;
            D(
              await a({
                toolName: n.tool,
                args: n.args || {},
                tabId: r,
                tabGroupId: o,
                clientId: e,
                source: "native-messaging",
                sessionScope: c,
              }),
              e,
            );
          } else {
            D({
              content: `Unknown method: ${t}`,
            });
          }
        } catch (t) {
          D(
            s(
              `Tool execution failed: ${t instanceof Error ? t.message : "Unknown error"}`,
            ),
          );
        }
      })(e);
      break;
    case __cpNativePortMessageTypeStatusResponse:
      if (C) {
        clearTimeout(M);
        M = null;
        C({
          nativeHostInstalled: k,
          mcpConnected: S,
        });
        C = null;
      }
      break;
    case __cpNativePortMessageTypeMcpConnected:
      (async function () {
        S = true;
        l(__cpPermissionManagerStorageKeyMcpConnected, true);
        await t.initialize();
        t.startTabGroupChangeListener();
      })();
      break;
    case __cpNativePortMessageTypeMcpDisconnected:
      S = false;
      l(__cpPermissionManagerStorageKeyMcpConnected, false);
      t.stopTabGroupChangeListener();
  }
}
function D({ content: e, is_error: t }, s) {
  if (!A) {
    return;
  }
  if (!e || (typeof e != "string" && !Array.isArray(e))) {
    return;
  }
  let a;
  a = t
    ? (function (e) {
        let t;
        const s =
          "IMPORTANT: The user has explicitly declined this action. Do not attempt to use other tools or workarounds. Instead, acknowledge the denial and ask the user how they would prefer to proceed.";
        t =
          typeof e == "string"
            ? e.includes("Permission denied by user")
              ? `${e} - ${s}`
              : e
            : e.map((t) =>
                typeof t == "object" &&
                t !== null &&
                "text" in t &&
                typeof t.text == "string" &&
                t.text.includes("Permission denied by user")
                  ? {
                      ...t,
                      text: `${e} - ${s}`,
                    }
                  : t,
              );
        return {
          type: __cpNativePortMessageTypeToolResponse,
          error: {
            content: t,
          },
        };
      })(e)
    : {
        type: __cpNativePortMessageTypeToolResponse,
        result: {
          content: e,
        },
      };
  A.postMessage(a);
}
// 原生宿主 tool_response 回包桥：把后台工具结果 / 用户拒绝统一包装回 native host。
const x = __cpExtensionUrlPrefix;
// clau.de deep-link / 扩展路由桥：
// `/chrome/permissions`、`/chrome/reconnect`、`/chrome/tab/<id>` 都从这里分流处理。
async function $(e, s) {
  try {
    const a = new URL(e);
    if (a.host !== "clau.de") {
      return false;
    }
    // permissions 深链接：跳到 options#permissions，再关闭当前 clau.de 中转页。
    if (a.pathname.toLowerCase() === __cpExtensionUrlPermissionsPath) {
      await (async function (e) {
        try {
          const e = chrome.runtime.getURL("options.html#permissions");
          await chrome.tabs.create({
            url: e,
          });
        } catch (t) {
        } finally {
          await G(e);
        }
      })(s);
      return true;
    }
    if (!a.pathname.startsWith(x)) {
      return false;
    }
    const i = a.pathname.substring(8).toLowerCase();
    // reconnect 深链接：断开旧 native host / bridge，再重新初始化后台连接。
    if (i === "reconnect") {
      await (async function (e) {
        try {
          await U();
          n();
          await new Promise((e) => setTimeout(e, 500));
          const [e, t] = await Promise.all([R(), o()]);
          h("claude_chrome.extension_url.reconnect", {
            native_host_success: e,
            bridge_initiated: t,
          });
        } catch (t) {
          h("claude_chrome.extension_url.reconnect", {
            success: false,
          });
        } finally {
          await G(e);
        }
      })(s);
      return true;
    }
    // tab 深链接：聚焦指定 tab，并把 sidepanel 绑定到对应主标签组上下文。
    if (i.startsWith("tab/")) {
      const e = parseInt(i.substring(4), 10);
      await (async function (e, s) {
        if (isNaN(e)) {
          h("claude_chrome.extension_url.tab_switch", {
            success: false,
            error: "invalid_tab_id",
          });
          await G(s);
          return true;
        }
        try {
          await t.initialize();
          const a = await t.findGroupByTab(e);
          if (!a || a.isUnmanaged) {
            h("claude_chrome.extension_url.tab_switch", {
              success: false,
              error: "tab_not_managed",
            });
            await G(s);
            return true;
          }
          const n = await chrome.tabs.get(e);
          if (n.windowId !== undefined) {
            await chrome.windows.update(n.windowId, {
              focused: true,
            });
          }
          await chrome.tabs.update(e, {
            active: true,
          });
          h("claude_chrome.extension_url.tab_switch", {
            success: true,
          });
          await G(s);
          return true;
        } catch (a) {
          h("claude_chrome.extension_url.tab_switch", {
            success: false,
          });
          await G(s);
          return true;
        }
      })(e, s);
      return true;
    }
    return false;
  } catch {
    h("claude_chrome.extension_url.unknown_exception", {});
    return false;
  }
}
async function G(e) {
  try {
    await chrome.tabs.remove(e);
  } catch (t) {}
}
// 网络请求头注入入口：统一给外部 API 请求附加扩展版 User-Agent。
async function B() {
  const e = w();
  const t = `${`claude-browser-extension/${chrome.runtime.getManifest().version} (external)`} ${navigator.userAgent} `;
  const s = [
    {
      id: 1,
      priority: 1,
      action: {
        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
        requestHeaders: [
          {
            header: "User-Agent",
            operation: chrome.declarativeNetRequest.HeaderOperation.SET,
            value: t,
          },
        ],
      },
      condition: {
        urlFilter: `${e.apiBaseUrl}/*`,
        resourceTypes: [
          chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
          chrome.declarativeNetRequest.ResourceType.OTHER,
        ],
      },
    },
  ];
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [1],
    addRules: s,
  });
}
// 定时任务闹钟恢复入口：重建 repeat prompt 的 alarm 和下次执行时间。
async function F() {
  try {
    const t = (await I.getAllPrompts()).filter(
      (e) => e.repeatType && e.repeatType !== "none",
    );
    if (t.length === 0) {
      return;
    }
    let s = 0;
    let a = 0;
    for (const n of t) {
      try {
        await I.updateAlarmForPrompt(n);
        s++;
      } catch (e) {
        a++;
      }
    }
    try {
      await I.updateNextRunTimes();
    } catch (e) {}
  } catch (e) {}
}
// service worker 启动链：先恢复 bridge/listener/offscreen，再探测 native host 和定时任务。
// detached window 锁巡检、group/session cleanup 则由 loader 后注册的 recovered runtime 追加，不在这里展开。
y();
i();
r();
o();
c().catch((e) => {});
R();
// 语义锚点：静态提示条心跳会遍历同组 tab，并缓存 3s ACK 结果以避免重复探测。
// 这份 ACK cache 只服务主/副 tab 存活探测，不参与 detached window 的打开、复用和锁清理。
const H = new Map();
chrome.runtime.onInstalled.addListener(async (e) => {
  chrome.storage.local.remove([__cpStorageKeyUpdateAvailable]);
  chrome.runtime.setUninstallURL(
    "https://docs.google.com/forms/d/e/1FAIpQLSdLa1wTVkB2ml2abPI1FP9KiboOnp2N0c3aDmp5rWmaOybWwQ/viewform",
  );
  f();
  await t.initialize();
  await B();
  R();
  await F();
});
chrome.runtime.onStartup.addListener(async () => {
  f();
  await B();
  await t.initialize();
  o();
  R();
  await F();
});
chrome.permissions.onAdded.addListener((e) => {
  if (e.permissions?.includes(__cpNativeMessagingPermission)) {
    R();
  }
});
chrome.permissions.onRemoved.addListener((e) => {
  if (e.permissions?.includes(__cpNativeMessagingPermission)) {
    U();
  }
});
chrome.action.onClicked.addListener(K);
chrome.notifications.onClicked.addListener(async (e) => {
  chrome.notifications.clear(e);
  const t = e.split("_");
  let s = null;
  if (t.length >= 2 && t[1] !== "unknown") {
    s = parseInt(t[1], 10);
  }
  if (s && !isNaN(s)) {
    try {
      const e = await chrome.tabs.get(s);
      if (e && e.windowId) {
        await chrome.windows.update(e.windowId, {
          focused: true,
        });
        await chrome.tabs.update(s, {
          active: true,
        });
        return;
      }
    } catch {}
  }
  const [a] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (a?.id && a.windowId) {
    await chrome.windows.update(a.windowId, {
      focused: true,
    });
  }
});
chrome.commands.onCommand.addListener((e) => {
  if (e === __cpCommandToggleSidePanel) {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      async (e) => {
        const t = e[0];
        if (!t?.id) {
          return;
        }
        if (__cpOpenSidePanelTabIds.has(t.id) && typeof chrome.sidePanel?.close === "function") {
          try {
            await chrome.sidePanel.close({
              tabId: t.id,
            });
            __cpOpenSidePanelTabIds.delete(t.id);
          } catch {}
          return;
        }
        await K(t);
        __cpOpenSidePanelTabIds.add(t.id);
      },
    );
  }
});
let q = false;
// sidepanel 打开桥：负责 sidepanel API 打开和 tab group 托管初始化。
async function W(e) {
  if (!chrome.sidePanel) {
    h("claude_chrome.sidepanel.unsupported_browser", {
      user_agent: navigator.userAgent,
    });
    if (!q) {
      q = true;
      chrome.notifications.create({
        type: __cpChromeNotificationTypeBasic,
        iconUrl: "/icon-128.png",
        title: "Browser not supported",
        message:
          "Claw requires the Chrome Side Panel API, which isn't available in this browser. Use Google Chrome, Microsoft Edge, or Brave.",
      });
    }
    return;
  }
  chrome.sidePanel.setOptions({
    tabId: e,
    path: `sidepanel.html?tabId=${encodeURIComponent(e)}`,
    enabled: true,
  });
  chrome.sidePanel.open({
    tabId: e,
  });
  await t.initialize(true);
  const s = await t.findGroupByTab(e);
  if (s) {
    if (s.isUnmanaged) {
      try {
        await t.adoptOrphanedGroup(e, s.chromeGroupId);
      } catch (a) {}
      return;
    }
  } else {
    try {
      await t.createGroup(e);
    } catch (a) {}
    R();
  }
}
async function K(e) {
  const t = e.id;
  if (t) {
    await W(t);
  }
}
// 定时任务窗口会话入口：新建目标窗口、弹出独立 sidepanel，并向面板投递执行动作。
async function z(e, s) {
  const a = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const n = await chrome.windows.create({
    url: e.url || "about:blank",
    type: "normal",
    focused: true,
  });
  if (!n || !n.id || !n.tabs || n.tabs.length === 0) {
    throw new Error("Failed to create window for scheduled task");
  }
  const o = n.tabs[0];
  if (!o.id) {
    throw new Error("Failed to get tab in new window for scheduled task");
  }
  await t.initialize(true);
  await t.createGroup(o.id);
  await l(__cpPermissionManagerStorageKeyTargetTabId, o.id);
  await (async function (e) {
    const { sessionId: t, skipPermissions: s, model: a } = e;
    const n = chrome.runtime.getURL(
      `sidepanel.html?mode=window&sessionId=${t}${s ? "&skipPermissions=true" : ""}${a ? `&model=${encodeURIComponent(a)}` : ""}`,
    );
    const o = await chrome.windows.create({
      url: n,
      type: "popup",
      width: 500,
      height: 768,
      left: 100,
      top: 100,
      focused: true,
    });
    if (!o) {
      throw new Error("Failed to create sidepanel window");
    }
    return o;
  })({
    sessionId: a,
    skipPermissions: e.skipPermissions,
    model: e.model,
  });
  await (async function (e) {
    const {
      tabId: t,
      prompt: s,
      taskName: a,
      runLogId: n,
      sessionId: o,
      isScheduledTask: i,
    } = e;
    return new Promise((e, r) => {
      const c = 30000;
      const d = Date.now();
      let u = false;
      const m = async () => {
        try {
          if (Date.now() - d > c) {
            r(new Error("Timeout waiting for tab to load for task execution"));
            return;
          }
          if ((await chrome.tabs.get(t)).status === "complete") {
            setTimeout(() => {
              if (!u) {
                u = true;
                // 语义锚点：scheduled task 通过 windowSessionId 定向独立 sidepanel；当前 bundle 不生产 targetTabId。
                chrome.runtime.sendMessage(
                  {
                    type: __cpBackgroundMessageTypeExecuteTask,
                    prompt: s,
                    taskName: a,
                    runLogId: n,
                    windowSessionId: o,
                    isScheduledTask: i,
                  },
                  (t) => {
                    const s = chrome.runtime.lastError?.message;
                    if (s || !t?.success) {
                      r(
                        new Error(
                          `Failed to send prompt: ${s ?? "side panel not ready"}`,
                        ),
                      );
                    } else {
                      e();
                    }
                  },
                );
              }
            }, 3000);
          } else {
            setTimeout(m, 500);
          }
        } catch (l) {
          r(l);
        }
      };
      setTimeout(m, 1000);
    });
  })({
    tabId: o.id,
    prompt: e.prompt,
    taskName: e.name,
    runLogId: s,
    sessionId: a,
    isScheduledTask: true,
  });
}
// 更新可用态同步入口：写入后台状态，供 options/sidepanel 提示升级。
chrome.runtime.onUpdateAvailable.addListener((e) => {
  l(__cpPermissionManagerStorageKeyUpdateAvailable, true);
  h("claude_chrome.extension.update_available", {
    current_version: chrome.runtime.getManifest().version,
    new_version: e.version,
  });
});
// 后台消息桥，负责 sidepanel 打开、权限通知、OAuth 刷新和 MCP 回包。
// recovered runtime 只额外消费 OPEN_GROUP_DETACHED_WINDOW；这里继续承接 ACK/indicator/native-host 等主桥消息。
chrome.runtime.onMessage.addListener((e, s, a) => {
  let __cpResponseSent = false;
  const __cpSendResponse = a;
  a = (e) => {
    if (__cpResponseSent) {
      return;
    }
    __cpResponseSent = true;
    try {
      __cpSendResponse(e);
    } catch {}
  };
  (async () => {
    // 后台主桥消息分区：
    // 1) keepalive 空 ACK
    // 2) ACK-only / OAuth probe
    // 3) sidepanel 打开与输入注入
    // 4) native host 状态 / MCP 通知 / options / scheduled task
    // 5) agent / tab-group 协调
    // 6) offscreen 音频
    if (e.type !== __cpBackgroundMessageTypeSwKeepalive) {
      // 轻量 ACK 类消息：仅回包确认，让 sidepanel / 指示器 / keepalive 调用方快速结束。
      // 其中 PANEL_OPENED / PANEL_CLOSED 只是面板生命周期 ACK，不参与 MCP permission promise 的解析。
      if (
        e.type === __cpBackgroundMessageTypePanelOpened ||
        e.type === __cpBackgroundMessageTypePanelClosed ||
        e.type === __cpBackgroundMessageTypeShowPermissionNotification ||
        e.type === __cpBackgroundMessageTypeResizeWindow ||
        e.type === __cpBackgroundMessageTypeMcpPermissionResponse
      ) {
        // 语义锚点：MCP_PERMISSION_RESPONSE 在 service-worker 主桥里只是轻量 ACK；requestId/allowed 不在这里解析。
        a({
          success: true,
        });
        return;
      }
      // OAuth 探测桥：当前恢复层不在此 bundle 内做刷新，只回传固定探测结果。
      if (e.type === __cpBackgroundMessageTypeCheckAndRefreshOauth) {
        a({
          isValid: false,
          isRefreshed: false,
        });
        return;
      }
      // 非音频类消息继续在主桥里细分；PLAY_NOTIFICATION_SOUND 则单独走 offscreen document。
      if (e.type !== __cpBackgroundMessageTypePlayNotificationSound) {
        // sidepanel 打开主链：打开侧栏后，按重试策略把 prompt/模型/附件注入输入框。
        if (e.type === __cpBackgroundMessageTypeOpenSidePanel) {
          // 语义锚点：OPEN_SIDE_PANEL 的 tabId 只负责打开/绑定目标 sidepanel；后续 POPULATE_INPUT_TEXT 不再携带 tabId。
          const t = e.tabId || s.tab?.id;
          if (!t) {
            a({
              success: false,
            });
            return;
          }
          await W(t);
          if (e.prompt) {
            const t = async (s = 0) => {
              try {
                const t = s === 0 ? 800 : 500;
                await new Promise((e) => setTimeout(e, t));
                await new Promise((t, s) => {
                  chrome.runtime.sendMessage(
                    {
                      type: __cpBackgroundMessageTypePopulateInputText,
                      prompt: e.prompt,
                      permissionMode: e.permissionMode,
                      selectedModel: e.selectedModel,
                      attachments: e.attachments,
                    },
                    (e) => {
                      const a = chrome.runtime.lastError?.message;
                      if (a || !e?.success) {
                        s(new Error(a ?? "side panel not ready"));
                      } else {
                        t();
                      }
                    },
                  );
                });
              } catch (a) {
                if (s < 5) {
                  await t(s + 1);
                }
              }
            };
            await t();
          }
          a({
            success: true,
          });
          return;
        }
        // 退出登录探测：当前发行版只需要告诉调用方该能力已禁用。
        if (e.type === __cpBackgroundMessageTypeLogout) {
          a({
            success: true,
            disabled: true,
          });
          // 原生宿主 / MCP bridge 状态读取：优先向 native host 请求最新状态，失败时回退本地缓存。
        } else if (e.type === __cpBackgroundMessageTypeCheckNativeHostStatus) {
          const e = await (async function () {
            if (A && k) {
              if (M) {
                clearTimeout(M);
              }
              return new Promise((e) => {
                C = e;
                A.postMessage({
                  type: __cpNativePortMessageTypeGetStatus,
                });
                M = setTimeout(() => {
                  C = null;
                  e({
                    nativeHostInstalled: k,
                    mcpConnected: S,
                  });
                }, 10000);
              });
            } else {
              return {
                nativeHostInstalled: k,
                mcpConnected: S,
              };
            }
          })();
          a({
            status: {
              nativeHostInstalled: e.nativeHostInstalled,
              mcpConnected: e.mcpConnected || d(),
            },
          });
          // MCP 通知桥：优先走 native host 的 notification 通道，失败时再走浏览器内 fallback。
        } else if (e.type === __cpBackgroundMessageTypeSendMcpNotification) {
          const t = (function (e, t) {
            if (!A) {
              return false;
            }
            const s = {
              type: __cpNativePortMessageTypeNotification,
              jsonrpc: __cpNativePortNotificationJsonRpcVersion,
              method: e,
              params: t || {},
            };
            A.postMessage(s);
            return true;
          })(e.method, e.params);
          const s = u(e.method, e.params);
          a({
            success: t || s,
          });
          // options 引导桥：把待执行任务先写入 storage，再聚焦或打开 options#prompts。
        } else if (e.type === __cpBackgroundMessageTypeOpenOptionsWithTask) {
          try {
            await l(
              __cpPermissionManagerStorageKeyPendingScheduledTask,
              e.task,
            );
            const t = chrome.runtime.getURL("options.html");
            const s = (await chrome.tabs.query({})).find((e) =>
              e.url?.startsWith(t),
            );
            if (s && s.id) {
              await chrome.tabs.update(s.id, {
                url: chrome.runtime.getURL("options.html#prompts"),
                active: true,
              });
              if (s.windowId) {
                await chrome.windows.update(s.windowId, {
                  focused: true,
                });
              }
            } else {
              await chrome.tabs.create({
                url: chrome.runtime.getURL("options.html#prompts"),
              });
            }
            a({
              success: true,
            });
          } catch (n) {
            a({
              success: false,
              error: n.message,
            });
          }
          // 定时任务执行桥：由后台统一落埋点并把任务转交 sidepanel 独立窗口。
        } else if (e.type === __cpBackgroundMessageTypeExecuteScheduledTask) {
          try {
            const { task: t, runLogId: s } = e;
            await z(t, s);
            h("claude_chrome.scheduled_task.executed", {
              task_id: t.id,
              task_name: t.name,
              success: true,
              execution_type: e.isManual
                ? __cpScheduledTaskExecutionTypeManual
                : __cpScheduledTaskExecutionTypeAutomatic,
            });
            a({
              success: true,
            });
          } catch (n) {
            h("claude_chrome.scheduled_task.executed", {
              task_id: e.task.id,
              task_name: e.task.name,
              success: false,
              execution_type: e.isManual
                ? __cpScheduledTaskExecutionTypeManual
                : __cpScheduledTaskExecutionTypeAutomatic,
              error: n.message,
            });
            a({
              success: false,
              error: n.message,
            });
          }
          // agent / tab-group 协调链：Stop、主副 tab 切换、ACK 探测、静态提示条心跳都从这里汇总。
          // detached window 链与这里的 ACK 只共享“同组上下文”这一层语义，不共享回包账本或锁状态。
        } else if (e.type === __cpBackgroundMessageTypeStopAgent) {
          let n;
          if (
            e.fromTabId === __cpAgentIndicatorCurrentTabSentinel &&
            s.tab?.id
          ) {
            n = (await t.getMainTabId(s.tab.id)) || s.tab.id;
          } else if (typeof e.fromTabId == "number") {
            n = e.fromTabId;
          }
          if (n) {
            // 语义锚点：background 会给 STOP_AGENT 补 targetTabId，供 sidepanel consumer 过滤多面板广播。
            chrome.runtime.sendMessage({
              type: __cpBackgroundMessageTypeStopAgent,
              targetTabId: n,
            });
          }
          a({
            success: true,
          });
        } else if (e.type === __cpBackgroundMessageTypeSwitchToMainTab) {
          // secondary -> main 聚焦桥：把副 tab 切回主 tab，并同步聚焦对应窗口。
          if (s.tab?.id) {
            try {
              await t.initialize(true);
              const e = await t.getMainTabId(s.tab.id);
              if (e) {
                await chrome.tabs.update(e, {
                  active: true,
                });
                const t = await chrome.tabs.get(e);
                if (t.windowId) {
                  await chrome.windows.update(t.windowId, {
                    focused: true,
                  });
                }
                a({
                  success: true,
                });
              } else {
                a({
                  success: false,
                  error: __cpSwitchToMainTabErrorNoMainTab,
                });
              }
            } catch (n) {
              a({
                success: false,
                error: n.message,
              });
            }
          } else {
            a({
              success: false,
              error: __cpSwitchToMainTabErrorNoSenderTab,
            });
          }
        } else if (e.type === __cpBackgroundMessageTypeSecondaryTabCheckMain) {
          // secondary -> main 的 ACK 请求桥：只确认主 tab 是否还活着，不负责 detached popup 的生命周期。
          chrome.runtime.sendMessage(
            {
              type: __cpBackgroundMessageTypeMainTabAckRequest,
              [__cpStaticIndicatorAckPayloadFieldSecondaryTabId]:
                e[__cpStaticIndicatorAckPayloadFieldSecondaryTabId],
              [__cpStaticIndicatorAckPayloadFieldMainTabId]:
                e[__cpStaticIndicatorAckPayloadFieldMainTabId],
              [__cpStaticIndicatorAckPayloadFieldTimestamp]:
                e[__cpStaticIndicatorAckPayloadFieldTimestamp],
            },
            (e) => {
              const t = chrome.runtime.lastError?.message;
              a(
                !t && e?.success
                  ? {
                      success: true,
                    }
                  : {
                      success: false,
                    },
              );
            },
          );
        } else if (e.type === __cpBackgroundMessageTypeMainTabAckResponse) {
          // 主 tab ACK 回包：这里只透传 success，供 secondary heartbeat 判断主 tab 存活。
          // secondaryTabId/mainTabId/timestamp 只服务探测阶段与 ACK cache，不进入最终收口结果。
          a({
            success: e.success,
          });
        } else if (
          e.type === __cpBackgroundMessageTypeStaticIndicatorHeartbeat
        ) {
          // 静态提示条心跳：遍历同组 tab 做 ACK 探测；detached window 是否复用/新开由 recovered runtime 单独判断。
          (async () => {
            const e = s.tab?.id;
            if (e) {
              try {
                const s = (await chrome.tabs.get(e)).groupId;
                if (
                  s === undefined ||
                  s === chrome.tabGroups.TAB_GROUP_ID_NONE
                ) {
                  a({
                    success: false,
                  });
                  return;
                }
                if (await t.findGroupByTab(e)) {
                  a({
                    success: true,
                  });
                  return;
                }
                const n = await chrome.tabs.query({
                  groupId: s,
                });
                const o = async (t) => {
                  if (t >= n.length) {
                    a({
                      success: false,
                    });
                    return;
                  }
                  const s = n[t];
                  if (s.id === e || !s.id) {
                    await o(t + 1);
                    return;
                  }
                  const i = s.id;
                  const r = Date.now();
                  const c = H.get(i);
                  if (c && r - c.timestamp < __cpStaticIndicatorAckCacheTtlMs) {
                    if (c.isAlive) {
                      a({
                        success: true,
                      });
                      return;
                    } else {
                      await o(t + 1);
                      return;
                    }
                  }
                  chrome.runtime.sendMessage(
                    {
                      type: __cpBackgroundMessageTypeMainTabAckRequest,
                      [__cpStaticIndicatorAckPayloadFieldSecondaryTabId]: e,
                      [__cpStaticIndicatorAckPayloadFieldMainTabId]: i,
                      [__cpStaticIndicatorAckPayloadFieldTimestamp]: r,
                    },
                    async (e) => {
                      const t = chrome.runtime.lastError?.message;
                      const s = !t && (e?.success ?? false);
                      H.set(i, {
                        timestamp: r,
                        isAlive: s,
                      });
                      if (s) {
                        a({
                          success: true,
                        });
                      } else {
                        await o(t + 1);
                      }
                    },
                  );
                };
                await o(0);
              } catch (n) {
                a({
                  success: false,
                });
              }
            } else {
              a({
                success: false,
              });
            }
          })();
        } else if (
          e.type === __cpBackgroundMessageTypeDismissStaticIndicatorForGroup
        ) {
          // 这里只清静态提示条；tab group 关闭后的 session scope / detached lock 清理由 recovered runtime 的事件处理链负责。
          (async () => {
            const e = s.tab?.id;
            if (e) {
              try {
                const s = (await chrome.tabs.get(e)).groupId;
                if (
                  s === undefined ||
                  s === chrome.tabGroups.TAB_GROUP_ID_NONE
                ) {
                  a({
                    success: false,
                  });
                  return;
                }
                await t.initialize();
                await t.dismissStaticIndicatorsForGroup(s);
                a({
                  success: true,
                });
              } catch (n) {
                a({
                  success: false,
                });
              }
            } else {
              a({
                success: false,
              });
            }
          })();
        }
      } else {
        // offscreen 音频播放桥：确保 offscreen document 存在后，把音频 URL 和音量转发给它。
        try {
          await c();
          await chrome.runtime.sendMessage({
            type: __cpBackgroundMessageTypeOffscreenPlaySound,
            audioUrl: e.audioUrl,
            volume: e.volume || 0.5,
          });
          a({
            success: true,
          });
        } catch (n) {
          a({
            success: false,
            error: n.message,
          });
        }
      }
    } else {
      a();
    }
  })().catch((t) => {
    a({
      success: false,
      error:
        t && typeof t.message === "string"
          ? t.message
          : String(t || "Unknown background error"),
    });
  });
  return true;
});
// tab 关闭同步入口：先让 tab-group 管理器更新主副 tab 账本；
// detached popup 的关闭/锁清理由 recovered runtime 的 onTabRemoved 追加收口。
chrome.tabs.onRemoved.addListener(async (e) => {
  await t.handleTabClosed(e);
});
// clau.de navigation bridge：消费 `/chrome/permissions` / `reconnect` / `tab/<id>` 这类扩展深链接。
chrome.webNavigation.onBeforeNavigate.addListener(async (e) => {
  if (e.frameId === 0) {
    await $(e.url, e.tabId);
  }
});
// 定时任务闹钟桥：`prompt_` 负责执行任务，`retry_` 负责补偿重排。
chrome.alarms.onAlarm.addListener(async (e) => {
  if (e.name.startsWith(__cpAlarmPrefixPrompt)) {
    try {
      const n = e.name;
      const o = await chrome.storage.local.get([__cpStorageKeySavedPrompts]);
      const i = (o.savedPrompts || []).find((e) => e.id === n);
      if (i) {
        const e = `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        let o = null;
        try {
          const t = {
            id: i.id,
            name: i.command || __cpScheduledTaskFallbackName,
            prompt: i.prompt,
            url: i.url,
            enabled: true,
            skipPermissions: i.skipPermissions !== false,
            model: i.model,
          };
          await z(t, e);
        } catch (t) {
          o = t instanceof Error ? t : new Error(String(t));
          try {
            await chrome.notifications.create({
              type: __cpChromeNotificationTypeBasic,
              iconUrl: "/icon-128.png",
              title: "Scheduled Task Failed",
              message: `Task "${i.command || __cpScheduledTaskFallbackName}" failed to execute. ${o.message}`,
              priority: 2,
            });
          } catch (s) {}
        }
        if (i.repeatType === "monthly" || i.repeatType === "annually") {
          try {
            await I.updateAlarmForPrompt(i);
          } catch (t) {
            const e = `${__cpAlarmPrefixRetry}${n}`;
            try {
              await chrome.alarms.create(e, {
                delayInMinutes: 1,
              });
            } catch (a) {}
            try {
              await chrome.notifications.create({
                type: __cpChromeNotificationTypeBasic,
                iconUrl: "/icon-128.png",
                title: "Scheduled Task Setup Failed",
                message: `Failed to schedule next occurrence of "${i.command || __cpScheduledTaskFallbackName}". Please check the task settings.`,
                priority: 2,
              });
            } catch (s) {}
          }
        }
      }
    } catch (t) {}
  } else if (e.name.startsWith(__cpAlarmPrefixRetry)) {
    try {
      const a = e.name.replace(__cpAlarmPrefixRetry, "");
      const n = await chrome.storage.local.get([__cpStorageKeySavedPrompts]);
      const o = (n.savedPrompts || []).find((e) => e.id === a);
      if (o && (o.repeatType === "monthly" || o.repeatType === "annually")) {
        try {
          await I.updateAlarmForPrompt(o);
        } catch (t) {
          try {
            await chrome.notifications.create({
              type: __cpChromeNotificationTypeBasic,
              iconUrl: "/icon-128.png",
              title: "Scheduled Task Needs Attention",
              message: `Could not automatically reschedule "${o.command || __cpScheduledTaskFallbackName}". Please edit the task to reschedule it.`,
              priority: 2,
            });
          } catch (s) {}
        }
      }
    } catch (t) {}
  }
});
// 外部页面桥：只信任 claude.ai，用于 onboarding prompt 注入与存在性探测。
chrome.runtime.onMessageExternal.addListener((e, t, s) => {
  (async () => {
    var a;
    if ((a = t.origin) && __cpTrustedExternalOrigins.includes(a)) {
      if (e.type === __cpExternalMessageTypeOauthRedirect) {
        s({
          success: false,
          disabled: true,
        });
      } else if (e.type === __cpExternalMessageTypePing) {
        s({
          success: true,
          exists: true,
        });
      } else if (e.type === __cpExternalMessageTypeOnboardingTask) {
        chrome.runtime.sendMessage(
          {
            type: __cpBackgroundMessageTypePopulateInputText,
            prompt: e.payload?.prompt,
          },
          (e) => {
            const t = chrome.runtime.lastError?.message;
            s({
              success: !t && !!e?.success,
              error: t ?? (e?.success ? undefined : "side panel not ready"),
            });
          },
        );
      }
    } else {
      s({
        success: false,
        error: __cpExternalBridgeErrorUntrustedOrigin,
      });
    }
  })();
  return true;
});
