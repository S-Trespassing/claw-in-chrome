(function () {
  const SIDE_PANEL_PATH = "/sidepanel.html";
  const INPUT_SELECTORS = [
    '[data-chat-input-container] [contenteditable="true"]',
    '[data-chat-input-container] textarea',
    '[role="textbox"]',
    '[contenteditable="true"]',
    'textarea'
  ];
  const NEW_CHAT_SELECTORS = [
    'button[aria-label*="New chat"]',
    'button[aria-label*="new chat"]',
    'button[aria-label*="New session"]',
    'button[aria-label*="new session"]',
    'button[aria-label*="新建会话"]',
    'button[aria-label*="新会话"]',
    'button[aria-label*="新建聊天"]',
    'button[aria-label*="新聊天"]',
    'button[title*="New chat"]',
    'button[title*="New session"]',
    'button[title*="新建会话"]',
    'button[title*="新会话"]',
    'button[title*="新建聊天"]',
    'button[title*="新聊天"]'
  ];
  const AUTO_FOCUS_RETRY_LIMIT = 20;
  const AUTO_FOCUS_RETRY_DELAY_MS = 120;

  function isSidepanelContext() {
    const pathname = String(globalThis.location?.pathname || window.location?.pathname || "");
    return pathname.endsWith(SIDE_PANEL_PATH);
  }

  function getActiveElement() {
    return document.activeElement || null;
  }

  function isEditableElement(element) {
    if (!element || typeof element !== "object") {
      return false;
    }
    const tagName = String(element.tagName || "").toUpperCase();
    if (tagName === "TEXTAREA") {
      return true;
    }
    if (tagName === "INPUT") {
      const inputType = String(element.type || "text").toLowerCase();
      return inputType !== "button" && inputType !== "checkbox" && inputType !== "radio" && inputType !== "range" && inputType !== "submit" && inputType !== "reset" && inputType !== "file";
    }
    if (String(element.getAttribute?.("role") || "").toLowerCase() === "textbox") {
      return true;
    }
    const contentEditable = String(element.getAttribute?.("contenteditable") || "").toLowerCase();
    return contentEditable === "true" || element.isContentEditable === true;
  }

  function queryFirst(selectors) {
    for (const selector of selectors) {
      const match = document.querySelector(selector);
      if (match) {
        return match;
      }
    }
    return null;
  }

  function findChatInput() {
    return queryFirst(INPUT_SELECTORS);
  }

  function findNewChatButton() {
    return queryFirst(NEW_CHAT_SELECTORS);
  }

  function focusChatInput(options) {
    const behavior = options && typeof options === "object" ? options : {};
    const activeElement = getActiveElement();
    if (!behavior.force && isEditableElement(activeElement)) {
      return false;
    }
    const input = findChatInput();
    if (!input || typeof input.focus !== "function") {
      return false;
    }
    input.focus();
    return getActiveElement() === input;
  }

  function scheduleAutoFocusAttempt(attempt) {
    if (attempt >= AUTO_FOCUS_RETRY_LIMIT) {
      return;
    }
    setTimeout(function () {
      if (focusChatInput()) {
        return;
      }
      scheduleAutoFocusAttempt(attempt + 1);
    }, AUTO_FOCUS_RETRY_DELAY_MS);
  }

  function installAutoFocus() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        focusChatInput();
        scheduleAutoFocusAttempt(0);
      });
    } else {
      focusChatInput();
      scheduleAutoFocusAttempt(0);
    }

    window.addEventListener("focus", function () {
      focusChatInput();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") {
        focusChatInput();
      }
    });

    const root = document.getElementById("root") || document.body;
    if (typeof MutationObserver === "function" && root) {
      const observer = new MutationObserver(function () {
        if (focusChatInput()) {
          observer.disconnect();
        }
      });
      observer.observe(root, {
        childList: true,
        subtree: true
      });
    }
  }

  function shouldHandleSlash(event) {
    if (!event || event.key !== "/") {
      return false;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return false;
    }
    return !isEditableElement(getActiveElement());
  }

  function shouldHandleNewChat(event) {
    if (!event) {
      return false;
    }
    const key = String(event.key || "").toLowerCase();
    return event.altKey && !event.ctrlKey && !event.metaKey && key === "n";
  }

  function installShortcuts() {
    window.addEventListener("keydown", function (event) {
      if (!shouldHandleNewChat(event)) {
        return;
      }
      const button = findNewChatButton();
      if (!button || typeof button.click !== "function") {
        return;
      }
      event.preventDefault();
      event.stopPropagation?.();
      button.click();
    }, true);

    document.addEventListener("keydown", function (event) {
      if (shouldHandleSlash(event)) {
        const focused = focusChatInput({
          force: true
        });
        if (focused) {
          event.preventDefault();
          event.stopPropagation?.();
        }
      }
    });
  }

  if (!isSidepanelContext()) {
    return;
  }

  installAutoFocus();
  installShortcuts();
})();
