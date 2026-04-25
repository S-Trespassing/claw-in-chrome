(function () {
  function debugLog(type, payload, level) {
    try {
      globalThis.__CP_OPTIONS_DEBUG__?.log(type, payload, level);
    } catch {}
  }
  const rootContract = globalThis.__CP_CONTRACT__ || {};
  const providerContract = rootContract.customProvider || {};
  const sessionContract = rootContract.session || {};
  const promptsContract = rootContract.prompts || {};
  const workflowsContract = rootContract.workflows || {};
  const debugContract = rootContract.debug || {};
  const uiContract = rootContract.ui || {};
  const STORAGE_KEY = providerContract.STORAGE_KEY || "customProviderConfig";
  const BACKUP_KEY =
    providerContract.BACKUP_KEY || "customProviderOriginalApiKey";
  const ANTHROPIC_API_KEY_STORAGE_KEY =
    providerContract.ANTHROPIC_API_KEY_STORAGE_KEY || "anthropicApiKey";
  const STYLE_ID = "cp-options-inline-provider-style";
  const ROOT_ID = "cp-options-enhancements-root";
  const WORKFLOW_ROOT_ID = "cp-options-workflow-root";
  const SESSION_ROOT_ID = "cp-options-session-root";
  const PROMPT_ROOT_ID = "cp-options-prompt-root";
  const DEBUG_ROOT_ID = "cp-options-debug-root";
  const PROVIDER_ANCHOR_ID = "cp-options-provider-anchor";
  const SESSION_ANCHOR_ID = "cp-options-session-anchor";
  const PROMPT_ANCHOR_ID = "cp-options-prompt-anchor";
  const DEBUG_ANCHOR_ID = "cp-options-debug-anchor";
  const PANEL_ID = "cp-options-inline-provider-panel";
  const NAV_ITEM_ID = "cp-options-provider-nav-item";
  const WORKFLOW_NAV_ITEM_ID = "cp-options-workflow-nav-item";
  const SESSION_NAV_ITEM_ID = "cp-options-session-nav-item";
  const PROMPT_NAV_ITEM_ID = "cp-options-prompt-nav-item";
  const BUILTIN_PROMPT_PROFILE_ID = "__builtin_default_prompt__";
  const DEBUG_LOGS_KEY =
    debugContract.SIDEPANEL_LOGS_STORAGE_KEY || "sidepanelDebugLogs";
  const DEBUG_META_KEY =
    debugContract.SIDEPANEL_META_STORAGE_KEY || "sidepanelDebugMeta";
  const SYSTEM_PROMPT_STORAGE_KEY =
    promptsContract.SYSTEM_PROMPT_STORAGE_KEY || "chrome_ext_system_prompt";
  const PROMPT_PROFILES_STORAGE_KEY =
    promptsContract.PROFILES_STORAGE_KEY || "customSystemPromptProfiles";
  const PROMPT_ACTIVE_PROFILE_STORAGE_KEY =
    promptsContract.ACTIVE_PROFILE_STORAGE_KEY ||
    "customSystemPromptActiveProfileId";
  const WORKFLOW_STORAGE_KEY =
    workflowsContract.STORAGE_KEY || "claw_site_workflows_v1";
  const PREFERRED_LOCALE_STORAGE_KEY =
    uiContract.PREFERRED_LOCALE_STORAGE_KEY || "preferred_locale";
  const DEBUG_MODE_STORAGE_KEY =
    uiContract.DEBUG_MODE_STORAGE_KEY || "debugMode";
  const SHOW_TRACE_IDS_STORAGE_KEY =
    uiContract.SHOW_TRACE_IDS_STORAGE_KEY || "showTraceIds";
  const SHOW_SYSTEM_REMINDERS_STORAGE_KEY =
    uiContract.SHOW_SYSTEM_REMINDERS_STORAGE_KEY || "showSystemReminders";
  const SHOW_TOOL_RESULT_DETAILS_STORAGE_KEY =
    uiContract.SHOW_TOOL_RESULT_DETAILS_STORAGE_KEY ||
    "showToolResultDetails";
  const i18nShared =
    globalThis.__CP_I18N_SHARED__ ||
    globalThis.__CP_GITHUB_UPDATE_SHARED__ ||
    {};
  const CHAT_SCOPE_PREFIX =
    sessionContract.CHAT_SCOPE_PREFIX || "claw.chat.scopes.";
  const CHAT_SESSION_LIMIT = 20;
  const CHAT_SESSION_TITLE_LIMIT = 80;
  const CHAT_SESSION_PREVIEW_LIMIT = 160;
  const DEFAULT_AGENT_ROLE_PROMPT =
    "You are Claude CUSTOM, a browser sidepanel assistant inside a Chrome extension. Help the user complete their request accurately and concisely. Use available browser context and tools when needed, but never pretend an action succeeded if you did not actually perform it. If a request could cause irreversible changes, purchases, submissions, account changes, authentication changes, or destructive actions, pause and ask the user to confirm before proceeding.";
  const DEBUG_EXPORT_SENSITIVE_KEYS = new Set([
    "apikey",
    "anthropicapikey",
    "accesstoken",
    "refreshtoken",
    "authtoken",
    "authorization",
    "token",
    "secret",
    "password",
    "codexrefreshtoken",
    "codexaccesstoken",
    "currentapikey",
    "originalapikey",
  ]);
  const DEBUG_EXPORT_PRIVATE_URL_KEYS = new Set([
    "baseurl",
    "providerurl",
    "requesturl",
    "url",
    "href",
    "uri",
    "filename",
    "source",
    "origin",
  ]);
  const DEBUG_EXPORT_PRIVATE_TEXT_KEYS = new Set([
    "bodypreview",
    "prompt",
    "content",
    "requestbody",
    "responsebody",
    "rawbody",
    "inputtext",
    "outputtext",
  ]);
  function normalizeDebugExportKey(key) {
    return String(key || "")
      .replace(/[^a-z0-9]/gi, "")
      .toLowerCase();
  }
  function isDebugExportSensitiveKey(key) {
    const normalized = normalizeDebugExportKey(key);
    return !!normalized && DEBUG_EXPORT_SENSITIVE_KEYS.has(normalized);
  }
  function isDebugExportPrivateUrlKey(key) {
    const normalized = normalizeDebugExportKey(key);
    return !!normalized && DEBUG_EXPORT_PRIVATE_URL_KEYS.has(normalized);
  }
  function isDebugExportPrivateTextKey(key) {
    const normalized = normalizeDebugExportKey(key);
    return !!normalized && DEBUG_EXPORT_PRIVATE_TEXT_KEYS.has(normalized);
  }
  function sanitizeDebugExportString(value, key) {
    const normalized = normalizeDebugExportKey(key);
    let text = String(value || "");
    if (!text) {
      return text;
    }
    if (isDebugExportSensitiveKey(normalized)) {
      return "[redacted-secret]";
    }
    if (normalized === "useragent") {
      return "[redacted-user-agent]";
    }
    if (isDebugExportPrivateTextKey(normalized)) {
      return `[redacted-text:${text.length}]`;
    }
    if (isDebugExportPrivateUrlKey(normalized)) {
      if (normalized === "href" && text.startsWith("/")) {
        return text.split(/[?#]/)[0] || "[redacted-url]";
      }
      return "[redacted-url]";
    }
    text = text
      .replace(
        /\b(?:https?|wss?|chrome-extension):\/\/[^\s"'<>]+/gi,
        "[redacted-url]",
      )
      .replace(/\bBearer\s+[A-Za-z0-9._-]+\b/gi, "Bearer [redacted]")
      .replace(/\b(?:sk|rk|pk)-[A-Za-z0-9*._-]{5,}\b/gi, function (token) {
        return token.split("-")[0] + "-[redacted]";
      })
      .replace(
        /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|auth(?:orization|[_-]?token)?|secret|password)\b\s*[:=]\s*[^\s,;]+/gi,
        function (match) {
          return match.replace(/[:=]\s*[^\s,;]+$/, ": [redacted]");
        },
      );
    return text.length > 600 ? text.slice(0, 600) + "...[truncated]" : text;
  }
  function summarizeDebugExportProvider(value) {
    const fetchedModels = Array.isArray(value?.fetchedModels)
      ? value.fetchedModels
      : [];
    return {
      format: sanitizeDebugExportString(value?.format || "", "format"),
      defaultModel: sanitizeDebugExportString(
        value?.defaultModel || "",
        "defaultModel",
      ),
      fastModel: sanitizeDebugExportString(
        value?.fastModel || value?.small_fast_model || "",
        "fastModel",
      ),
      reasoningEffort: sanitizeDebugExportString(
        value?.reasoningEffort || "",
        "reasoningEffort",
      ),
      maxOutputTokens:
        typeof value?.maxOutputTokens === "number"
          ? value.maxOutputTokens
          : value?.maxOutputTokens || undefined,
      contextWindow:
        typeof value?.contextWindow === "number"
          ? value.contextWindow
          : value?.contextWindow || undefined,
      name: sanitizeDebugExportString(value?.name || "", "name"),
      authMode: sanitizeDebugExportString(value?.authMode || "", "authMode"),
      fetchedModelCount: fetchedModels.length,
      hasApiKey: !!value?.apiKey,
      hasCodexRefreshToken: !!value?.codexRefreshToken,
      hasCodexAccountId: !!value?.codexAccountId,
      hasBaseUrl: !!value?.baseUrl,
    };
  }
  function sanitizeDebugExportValue(value, depth, seen, parentKey) {
    if (value == null) {
      return value;
    }
    if (depth > 4) {
      return "[max-depth]";
    }
    if (typeof value === "string") {
      return sanitizeDebugExportString(value, parentKey);
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (typeof value === "function") {
      return "[function]";
    }
    if (value instanceof Error) {
      return {
        name: value.name,
        message: sanitizeDebugExportString(value.message, "message"),
        stack: sanitizeDebugExportString(value.stack || "", "stack"),
      };
    }
    if (typeof URL !== "undefined" && value instanceof URL) {
      return sanitizeDebugExportString(value.toString(), parentKey);
    }
    if (Array.isArray(value)) {
      return value.slice(0, 50).map(function (item) {
        return sanitizeDebugExportValue(item, depth + 1, seen);
      });
    }
    if (typeof value !== "object") {
      return String(value);
    }
    if (seen.has(value)) {
      return "[circular]";
    }
    seen.add(value);
    if (isDebugExportSensitiveKey(parentKey)) {
      return "[redacted-secret]";
    }
    if (
      normalizeDebugExportKey(parentKey) === "customproviderconfig" ||
      normalizeDebugExportKey(parentKey) === "customprovider"
    ) {
      return summarizeDebugExportProvider(value);
    }
    const output = {};
    for (const key of Object.keys(value).slice(0, 30)) {
      output[key] = isDebugExportSensitiveKey(key)
        ? "[redacted-secret]"
        : sanitizeDebugExportValue(value[key], depth + 1, seen, key);
    }
    return output;
  }
  function sanitizeDebugExportLogs(logs) {
    return Array.isArray(logs)
      ? logs.map(function (entry) {
          return sanitizeDebugExportValue(entry, 0, new WeakSet());
        })
      : [];
  }
  function sanitizeDebugExportMeta(meta) {
    return meta && typeof meta === "object"
      ? sanitizeDebugExportValue(meta, 0, new WeakSet())
      : null;
  }
  const DEFAULT_UI_STRINGS = {
      providerName: "Model provider",
      subtitle:
        "Configure a compatible provider, endpoint, and default model used by Claw in Chrome.",
      providerNameLabel: "Provider name",
      providerNamePlaceholder: "OpenRouter / Private gateway",
      providerFormatLabel: "Provider format",
      authModeLabel: "Authentication",
      authModeApiKey: "API key",
      authModeCodex: "Codex login",
      baseUrlLabel: "Base URL",
      baseUrlPlaceholder: "https://api.openai.com/v1",
      requestUrlPrefix: "Request URL: ",
      apiKeyLabel: "API key",
      apiKeyPlaceholder: "provider key",
      codexAuthLabel: "Codex auth JSON / access token",
      codexAuthPlaceholder: "Paste ~/.codex/auth.json or a Codex access token",
      showApiKey: "Show API key",
      hideApiKey: "Hide API key",
      defaultModelLabel: "Model",
      defaultModelPlaceholder: "gpt-5.4",
      fastModelLabel: "Fast model",
      fastModelPlaceholder: "Optional fast model",
      fastModelHelp:
        "Used for internal small_fast requests. If omitted or unavailable, Claw falls back to the main model.",
      maxOutputTokensLabel: "Max output tokens",
      maxOutputTokensPlaceholder: "10000",
      reasoningEffortLabel: "Reasoning effort",
      reasoningEffortHelp:
        "Only applies to providers and models that support reasoning effort, such as GPT-5 and o-series models.",
      contextWindowLabel: "Context window (unit: k)",
      contextWindowPlaceholder: "200",
      reasoningEffortNone: "Off",
      reasoningEffortLow: "Low",
      reasoningEffortMedium: "Medium",
      reasoningEffortHigh: "High",
      reasoningEffortMax: "Max",
      fetchedModelsLabel: "Fetched models",
      fetchedModelsHint:
        "Fetch models from your provider to select one directly.",
      fetchedModelsReady:
        "Models were fetched successfully. You can pick one directly.",
      fetchedModelsLoading: "Fetching models from the provider...",
      fetchedModelsError:
        "Model fetch failed. Check the format, endpoint, and API key.",
      fetchModels: "Fetch model list",
      fetchingModels: "Fetching...",
      addModelAria: "Add model manually",
      manualAddModelTitle: "Add model",
      manualAddModelSubtitle: "Enter a model ID to add it to the current list.",
      manualModelIdLabel: "Model ID",
      manualModelIdPlaceholder: "e.g. gpt-5.4",
      manualModelAliasLabel: "Model alias",
      manualModelAliasPlaceholder: "Defaults to the model ID",
      manualAddConfirm: "Add model",
      cancelAction: "Cancel",
      manualModelIdRequired: "Enter a model ID first.",
      manualModelAdded: "Model added. Save to apply it.",
      manualModelSelected: "Model already exists. Selected for you.",
      manualModelRemoved: "Model removed from the list.",
      newProfile: "New profile",
      backToList: "Back to list",
      editProfile: "Edit",
      activateProfile: "Set as current",
      activeProfile: "Current",
      deleteProfile: "Delete",
      deleteProfileConfirm: 'Delete "{name}"?',
      emptyProfilesTitle: "No provider profiles yet",
      emptyProfilesHelp:
        "Create a provider profile, then save and apply it to the side panel.",
      unnamedProfile: "Provider profile",
      createProfileTitle: "Create profile",
      editProfileTitle: "Edit profile",
      formatSummaryLabel: "Format",
      modelSummaryLabel: "Model",
      fastModelSummaryLabel: "Fast model",
      endpointSummaryLabel: "Endpoint",
      notConfigured: "Not configured",
      currentBadge: "Current",
      profileActivated: "Current provider updated.",
      profileDeleted: "Provider profile deleted.",
      healthCheck: "Health check",
      healthChecking: "Checking...",
      healthCheckFailure: "Health check failed.",
      healthCheckSuccess: "Health check passed. Model replied: {reply}",
      healthCheckSuccessGeneric: "Health check passed. Model responded.",
      saveAndApply: "Save and apply",
      selectFetchedModel: "Select model",
      fetchModelsToPickOne: "Fetch models to pick one",
      fetchFailure: "Unable to fetch models right now.",
      baseUrlRequired: "Base URL is required.",
      apiKeyRequired: "API key is required.",
      defaultModelRequired: "Choose or enter a default model before saving.",
      saveSuccessEnabled: "Saved. Reopen the side panel to apply the provider.",
      saveFailure: "Failed to save this provider configuration.",
      sessionTitle: "Session management",
      sessionSubtitle:
        "Review local chat groups saved on this device and remove the ones you no longer need.",
      sessionRefresh: "Refresh",
      sessionRefreshing: "Refreshing...",
      sessionEmptyTitle: "No local chat groups yet",
      sessionEmptyHelp:
        "Saved chat groups from the side panel will appear here after you start chatting.",
      sessionListCount: "{count} local chat groups saved.",
      sessionView: "View",
      sessionViewRecord: "Open record",
      sessionCloseViewer: "Close",
      sessionBackToHistory: "Back to sessions",
      sessionHistoryTitle: "Saved sessions",
      sessionHistorySubtitle:
        "Browse the saved session thumbnails in this group.",
      sessionRecordTitle: "Session record",
      sessionRecordSubtitle: "Review the saved messages for this session.",
      sessionRecordEmpty: "No saved messages in this session.",
      sessionRecordLoadFailure: "Failed to load this session record.",
      sessionRoleUser: "User",
      sessionRoleAssistant: "Assistant",
      sessionRoleSystem: "System",
      sessionRoleTool: "Tool",
      sessionRoleUnknown: "Message",
      sessionUpdatedAtLabel: "Updated",
      sessionCreatedAtLabel: "Created",
      sessionMessagesLabel: "Messages",
      sessionGroupCountLabel: "Sessions",
      sessionTotalMessagesLabel: "Total messages",
      sessionModeLabel: "Mode",
      sessionModelLabel: "Model",
      sessionScopeLabel: "Scope",
      sessionUrlLabel: "URL",
      sessionAnchorUrlLabel: "First URL",
      sessionTabLabel: "Tab",
      sessionLatestTabLabel: "Latest tab",
      sessionPreviewLabel: "Preview",
      sessionModeStandard: "Standard",
      sessionModeQuick: "Quick",
      sessionDelete: "Delete group",
      sessionDeleteConfirm: 'Delete local chat group "{name}"?',
      sessionDeleted: "Local chat group deleted.",
      sessionLoadFailure: "Failed to load local chat groups.",
      sessionDeleteFailure: "Failed to delete this local chat group.",
      sessionUntitled: "New chat",
      promptTitle: "Prompt overrides",
      promptSubtitle:
        "Manage reusable agent role prompt profiles for the side panel assistant. The built-in default prompt always stays in the list and cannot be edited or deleted.",
      promptEmptyProfilesTitle: "No prompt profiles yet",
      promptEmptyProfilesHelp:
        "Create a prompt profile, then save and set it as current whenever you want to use it.",
      promptDefaultProfileName: "Built-in default prompt",
      promptProfileNameLabel: "Profile name",
      promptProfileNamePlaceholder: "Default coding role",
      agentRoleLabel: "Agent role",
      agentRoleHelp:
        "This field maps to the main system prompt used by the side panel assistant.",
      agentRolePlaceholder: "Enter custom system prompt...",
      promptCreateTitle: "Create prompt profile",
      promptEditTitle: "Edit prompt profile",
      promptSummaryTargetLabel: "Target",
      promptSummaryPreviewLabel: "Preview",
      promptSummaryLengthLabel: "Length",
      promptTargetValue: "Main agent role",
      promptSave: "Save and apply",
      promptSaved: "Prompt profile saved and applied.",
      promptActivated: "Current prompt profile updated.",
      promptDeleted: "Prompt profile deleted.",
      promptDeleteConfirm: 'Delete prompt profile "{name}"?',
      promptNameRequired: "Enter a profile name.",
      promptContentRequired: "Enter the agent role prompt first.",
      promptSaveFailure: "Failed to save this prompt profile.",
      workflowTitle: "Workflow library",
      workflowSubtitle:
        "Manage reusable workflow definitions derived from Teach Claw or handcrafted prompts. Save them locally, edit JSON directly, import or export them in bulk, and automatically mirror saved shortcuts here.",
      workflowNew: "New workflow",
      workflowImport: "Import JSON",
      workflowExportAll: "Export all",
      workflowListCount: "{count} workflows saved locally.",
      workflowEmptyTitle: "No workflows yet",
      workflowEmptyHelp:
        "Create your first workflow to keep reusable browser task prompts in one place.",
      workflowEditTitle: "Edit workflow",
      workflowCreateTitle: "Create workflow",
      workflowJsonLabel: "Workflow JSON",
      workflowJsonHelp:
        "Use one JSON object per workflow. Required fields: name, label, description, prompt. Optional fields such as url_patterns, inputs, enabled, source, and version are preserved. Entries synced from shortcuts refresh automatically when the shortcut changes.",
      workflowJsonPlaceholder:
        '{\n  "name": "new-workflow",\n  "label": "New workflow",\n  "description": "What this workflow does",\n  "prompt": "Describe the repeatable task here.",\n  "url_patterns": ["*://*/*"],\n  "inputs": [],\n  "enabled": true,\n  "source": "user",\n  "version": 1\n}',
      workflowSave: "Save workflow",
      workflowFormatJson: "Format JSON",
      workflowUpdatedAtLabel: "Updated",
      workflowPatternsLabel: "Match",
      workflowInputsLabel: "Inputs",
      workflowPromptLabel: "Prompt",
      workflowSourceLabel: "Source",
      workflowVersionLabel: "Version",
      workflowSourceUser: "Custom",
      workflowSourceShortcut: "Shortcut",
      workflowSourceRecorded: "Recorded",
      workflowSourceImported: "Imported",
      workflowEnable: "Enable",
      workflowDisable: "Disable",
      workflowEdit: "Edit",
      workflowDelete: "Delete",
      workflowExport: "Export",
      workflowDeleteConfirm: 'Delete workflow "{name}"?',
      workflowSaved: "Workflow saved.",
      workflowDeleted: "Workflow deleted.",
      workflowEnabled: "Workflow enabled.",
      workflowDisabled: "Workflow disabled.",
      workflowImported: "Import completed: {count} workflows saved.",
      workflowImportFailure: "Import failed. Check the JSON file format.",
      workflowExported: "Workflow export started.",
      workflowExportEmpty: "There are no workflows to export yet.",
      workflowNameRequired:
        "The workflow JSON must include a non-empty name field.",
      workflowLabelRequired:
        "The workflow JSON must include a non-empty label field.",
      workflowDescriptionRequired:
        "The workflow JSON must include a non-empty description field.",
      workflowPromptRequired:
        "The workflow JSON must include a non-empty prompt field.",
      workflowJsonInvalid:
        "The workflow JSON is invalid. Check the syntax first.",
      workflowJsonObjectRequired:
        "The editor only accepts a single workflow JSON object.",
      workflowSaveFailure: "Failed to save this workflow.",
      workflowDuplicateReplaceConfirm: '"{name}" already exists. Replace it?',
      inlineModelSaved: "Model updated.",
      inlineFastModelSaved: "Fast model updated.",
      inlineContextWindowSaved: "Context window updated.",
      inlineMaxOutputTokensSaved: "Max output tokens updated.",
      inlineReasoningSaved: "Reasoning effort updated.",
      debugTitle: "Developer / debug",
      debugSubtitle:
        "Turn on sidepanel diagnostic displays and logging controls. Changes apply immediately, and the captured logs below can still be exported.",
      debugToggleTitle: "Enable debug mode",
      debugToggleHelp:
        "When enabled, the side panel writes diagnostic events into local extension storage.",
      debugToggleAria: "Toggle debug mode",
      traceIdsTitle: "Show trace IDs",
      traceIdsHelp:
        "Display trace IDs at the beginning of each response stream.",
      traceIdsEnabled: "Trace ID display is enabled.",
      traceIdsDisabled: "Trace ID display is disabled.",
      traceIdsSaveFailure: "Failed to update trace ID display.",
      systemRemindersTitle: "Show system reminders",
      systemRemindersHelp:
        "Display system reminder tags for debugging tab context changes.",
      systemRemindersEnabled: "System reminder display is enabled.",
      systemRemindersDisabled: "System reminder display is disabled.",
      systemRemindersSaveFailure:
        "Failed to update system reminder display.",
      toolResultDetailsTitle: "Show tool result details",
      toolResultDetailsHelp:
        "When enabled, each tool step in the side panel shows detailed parameters and outputs inline.",
      toolResultDetailsOn: "Enabled",
      toolResultDetailsOff: "Disabled",
      toolResultDetailsEnabled: "Tool result details are enabled.",
      toolResultDetailsDisabled: "Tool result details are disabled.",
      toolResultDetailsSaveFailure:
        "Failed to update tool result details setting.",
      debugLogsTitle: "Captured logs",
      debugLogsHelp: "Copy or download the stored logs for troubleshooting.",
      debugLogsEmpty: "No debug logs have been captured yet.",
      debugLogsCount: "{count} log entries available.",
      debugLogsUpdatedPrefix: "Last updated:",
      debugEnabled: "Debug mode is enabled.",
      debugDisabled: "Debug mode is disabled.",
      debugSaveFailure: "Failed to update debug mode.",
      copyLogs: "Copy logs",
      downloadLogs: "Download logs",
      copyLogsSuccess: "Logs copied to clipboard.",
      copyLogsFailure: "Failed to copy logs.",
      downloadLogsSuccess: "Logs downloaded.",
      downloadLogsFailure: "Failed to download logs.",
  };
  let currentUiStrings = cloneStrings(DEFAULT_UI_STRINGS);
  let renderedUiLocaleKey = "";
  let deferredUiLocaleCheckTimer = 0;

  function cloneStrings(value) {
    return typeof i18nShared.cloneLocaleValue === "function"
      ? i18nShared.cloneLocaleValue(value)
      : JSON.parse(JSON.stringify(value));
  }

  async function ensureUiStrings(localeTag) {
    const nextLocaleTag =
      (typeof i18nShared.normalizeUiLocaleTag === "function"
        ? i18nShared.normalizeUiLocaleTag(localeTag)
        : String(localeTag || "").trim()) || "en-US";
    if (typeof i18nShared.resolveCustomI18nSection === "function") {
      currentUiStrings = await i18nShared.resolveCustomI18nSection(
        "customProvider",
        nextLocaleTag,
        DEFAULT_UI_STRINGS,
      );
      return;
    }
    currentUiStrings = cloneStrings(DEFAULT_UI_STRINGS);
  }

  const helpers = globalThis.CustomProviderModels || {};
  const DEFAULT_FORMAT = helpers.DEFAULT_FORMAT || "anthropic";
  const AUTH_MODE_API_KEY = helpers.AUTH_MODE_API_KEY || "api_key";
  const AUTH_MODE_CODEX = helpers.AUTH_MODE_CODEX || "codex";
  const DEFAULT_AUTH_MODE = helpers.DEFAULT_AUTH_MODE || AUTH_MODE_API_KEY;
  const CODEX_DEFAULT_BASE_URL =
    helpers.CODEX_DEFAULT_BASE_URL || "https://chatgpt.com/backend-api/codex";
  const OPENAI_RESPONSES_FORMAT =
    helpers.OPENAI_RESPONSES_FORMAT || "openai_responses";
  const DEFAULT_CONTEXT_WINDOW = helpers.DEFAULT_CONTEXT_WINDOW || 200000;
  const DEFAULT_MAX_OUTPUT_TOKENS = helpers.DEFAULT_MAX_OUTPUT_TOKENS || 10000;
  const MIN_CONTEXT_WINDOW = 20000;
  const CONTEXT_WINDOW_STEP_K = 10;
  const PROFILES_STORAGE_KEY =
    helpers.PROFILES_STORAGE_KEY ||
    providerContract.PROFILES_STORAGE_KEY ||
    "customProviderProfiles";
  const ACTIVE_PROFILE_STORAGE_KEY =
    helpers.ACTIVE_PROFILE_STORAGE_KEY ||
    providerContract.ACTIVE_PROFILE_STORAGE_KEY ||
    "customProviderActiveProfileId";
  const readProviderStoreState =
    helpers.readProviderStoreState ||
    async function () {
      const stored = await chrome.storage.local.get([
        STORAGE_KEY,
        BACKUP_KEY,
        ANTHROPIC_API_KEY_STORAGE_KEY,
      ]);
      return {
        profiles: [],
        activeProfileId: null,
        activeProfile: null,
        config:
          stored[STORAGE_KEY] ||
          (helpers.createEmptyConfig
            ? helpers.createEmptyConfig()
            : {
                name: "",
                format: DEFAULT_FORMAT,
                baseUrl: "",
                apiKey: "",
                defaultModel: "",
                fastModel: "",
                reasoningEffort: "medium",
                maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
                contextWindow: DEFAULT_CONTEXT_WINDOW,
                fetchedModels: [],
              }),
        originalApiKey: Object.prototype.hasOwnProperty.call(stored, BACKUP_KEY)
          ? stored[BACKUP_KEY]
          : undefined,
        currentApiKey: stored[ANTHROPIC_API_KEY_STORAGE_KEY] || "",
      };
    };
  const saveProviderProfile =
    helpers.saveProviderProfile ||
    async function (next) {
      await chrome.storage.local.set({
        [STORAGE_KEY]: next,
      });
      return readProviderStoreState();
    };
  const setActiveProviderProfile =
    helpers.setActiveProviderProfile ||
    async function () {
      return readProviderStoreState();
    };
  const deleteProviderProfile =
    helpers.deleteProviderProfile ||
    async function () {
      return readProviderStoreState();
    };
  const readCachedFetchedModels =
    helpers.readCachedFetchedModels ||
    async function () {
      return [];
    };
  const persistFetchedModelsForConfig =
    helpers.persistFetchedModelsForConfig ||
    async function (config, models) {
      return Array.isArray(models) ? models.slice() : [];
    };
  function generatePromptProfileId() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
    return `prompt-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }
  function normalizePromptProfile(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const id = String(source.id || "").trim();
    if (!id) {
      return null;
    }
    return {
      id,
      name: String(source.name || "").trim(),
      prompt: String(source.prompt || "").trim(),
      createdAt: source.createdAt || null,
      updatedAt: source.updatedAt || null,
    };
  }
  async function readPromptProfilesState() {
    const stored = await chrome.storage.local.get([
      PROMPT_PROFILES_STORAGE_KEY,
      PROMPT_ACTIVE_PROFILE_STORAGE_KEY,
    ]);
    const profiles = Array.isArray(stored[PROMPT_PROFILES_STORAGE_KEY])
      ? stored[PROMPT_PROFILES_STORAGE_KEY].map(normalizePromptProfile).filter(
          Boolean,
        )
      : [];
    const activeProfileId =
      typeof stored[PROMPT_ACTIVE_PROFILE_STORAGE_KEY] === "string"
        ? stored[PROMPT_ACTIVE_PROFILE_STORAGE_KEY]
        : null;
    const activeProfile =
      profiles.find(function (profile) {
        return profile.id === activeProfileId;
      }) || null;
    return {
      profiles,
      activeProfileId: activeProfile ? activeProfile.id : null,
      activeProfile,
    };
  }
  async function writePromptProfilesState(profiles, activeProfileId) {
    await chrome.storage.local.set({
      [PROMPT_PROFILES_STORAGE_KEY]: profiles,
    });
    if (activeProfileId) {
      await chrome.storage.local.set({
        [PROMPT_ACTIVE_PROFILE_STORAGE_KEY]: activeProfileId,
      });
    } else {
      await chrome.storage.local.remove(PROMPT_ACTIVE_PROFILE_STORAGE_KEY);
    }
  }
  async function readAgentSystemPromptState() {
    const stored = await chrome.storage.local.get([SYSTEM_PROMPT_STORAGE_KEY]);
    const raw = stored[SYSTEM_PROMPT_STORAGE_KEY];
    const record = raw && typeof raw === "object" ? raw : {};
    const customPrompt =
      typeof record.systemPrompt === "string" ? record.systemPrompt : "";
    return {
      record,
      customPrompt,
      effectivePrompt: customPrompt.trim()
        ? customPrompt
        : DEFAULT_AGENT_ROLE_PROMPT,
      isCustom: !!customPrompt.trim(),
    };
  }
  async function saveAgentSystemPrompt(promptText) {
    const stored = await chrome.storage.local.get([SYSTEM_PROMPT_STORAGE_KEY]);
    const current =
      stored[SYSTEM_PROMPT_STORAGE_KEY] &&
      typeof stored[SYSTEM_PROMPT_STORAGE_KEY] === "object"
        ? {
            ...stored[SYSTEM_PROMPT_STORAGE_KEY],
          }
        : {};
    current.systemPrompt = String(promptText || "");
    await chrome.storage.local.set({
      [SYSTEM_PROMPT_STORAGE_KEY]: current,
    });
    return readAgentSystemPromptState();
  }
  async function restoreAgentSystemPrompt() {
    const stored = await chrome.storage.local.get([SYSTEM_PROMPT_STORAGE_KEY]);
    const current =
      stored[SYSTEM_PROMPT_STORAGE_KEY] &&
      typeof stored[SYSTEM_PROMPT_STORAGE_KEY] === "object"
        ? {
            ...stored[SYSTEM_PROMPT_STORAGE_KEY],
          }
        : {};
    delete current.systemPrompt;
    if (Object.keys(current).length) {
      await chrome.storage.local.set({
        [SYSTEM_PROMPT_STORAGE_KEY]: current,
      });
    } else {
      await chrome.storage.local.remove(SYSTEM_PROMPT_STORAGE_KEY);
    }
    return readAgentSystemPromptState();
  }
  async function savePromptProfile(next, options) {
    const settings = options && typeof options === "object" ? options : {};
    const state = await readPromptProfilesState();
    const now = new Date().toISOString();
    const existingIndex = settings.profileId
      ? state.profiles.findIndex(function (profile) {
          return profile.id === settings.profileId;
        })
      : -1;
    const base = existingIndex >= 0 ? state.profiles[existingIndex] : null;
    const profile = {
      id: existingIndex >= 0 ? base.id : generatePromptProfileId(),
      name: String(next?.name || "").trim(),
      prompt: String(next?.prompt || "").trim(),
      createdAt: base?.createdAt || now,
      updatedAt: now,
    };
    const profiles = state.profiles.slice();
    if (existingIndex >= 0) {
      profiles.splice(existingIndex, 1, profile);
    } else {
      profiles.push(profile);
    }
    const activateOnSave = settings.activateOnSave !== false;
    const nextActiveProfileId = activateOnSave
      ? profile.id
      : state.activeProfileId === profile.id
        ? profile.id
        : state.activeProfileId;
    await writePromptProfilesState(profiles, nextActiveProfileId);
    if (nextActiveProfileId === profile.id) {
      await saveAgentSystemPrompt(profile.prompt);
    } else if (!nextActiveProfileId) {
      await restoreAgentSystemPrompt();
    }
    return readPromptProfilesState();
  }
  async function setActivePromptProfile(profileId) {
    const state = await readPromptProfilesState();
    if (!profileId) {
      await writePromptProfilesState(state.profiles, null);
      await restoreAgentSystemPrompt();
      return readPromptProfilesState();
    }
    const profile = state.profiles.find(function (entry) {
      return entry.id === profileId;
    });
    if (!profile) {
      throw new Error("Prompt profile not found.");
    }
    await writePromptProfilesState(state.profiles, profile.id);
    await saveAgentSystemPrompt(profile.prompt);
    return readPromptProfilesState();
  }
  async function deletePromptProfile(profileId) {
    const state = await readPromptProfilesState();
    const profiles = state.profiles.filter(function (profile) {
      return profile.id !== profileId;
    });
    const nextActiveProfileId =
      state.activeProfileId === profileId ? null : state.activeProfileId;
    await writePromptProfilesState(profiles, nextActiveProfileId);
    if (state.activeProfileId === profileId) {
      await restoreAgentSystemPrompt();
    }
    return readPromptProfilesState();
  }
  function normalizeWorkflowText(value) {
    return String(value || "")
      .replace(/\r\n/g, "\n")
      .trim();
  }
  function normalizeWorkflowPatterns(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map(function (entry) {
        return String(entry || "").trim();
      })
      .filter(Boolean);
  }
  function normalizeWorkflowInputs(value) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value
      .map(function (entry) {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const name = String(entry.name || "").trim();
          const description = String(entry.description || "").trim();
          if (!name && !description) {
            return null;
          }
          return {
            ...entry,
            name,
            description,
            required: entry.required !== false,
          };
        }
        const text = String(entry || "").trim();
        if (!text) {
          return null;
        }
        return {
          name: text,
          description: "",
          required: true,
        };
      })
      .filter(Boolean);
  }
  function createEmptyWorkflowDefinition() {
    return {
      name: "new-workflow",
      label: "New workflow",
      description: "",
      prompt: "",
      url_patterns: ["*://*/*"],
      inputs: [],
      enabled: true,
      source: "user",
      version: 1,
    };
  }
  function normalizeWorkflowEntry(raw, options) {
    const source =
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? {
            ...raw,
          }
        : {};
    const settings = options && typeof options === "object" ? options : {};
    const fallbackCreatedAt = normalizeSessionNumber(
      settings.fallbackCreatedAt,
      Date.now(),
    );
    const fallbackUpdatedAt = normalizeSessionNumber(
      settings.fallbackUpdatedAt,
      Date.now(),
    );
    const name = normalizeWorkflowText(source.name || source.id || "");
    if (!name) {
      return null;
    }
    const label = normalizeWorkflowText(source.label || source.title || name);
    const description = normalizeWorkflowText(source.description || "");
    const prompt = normalizeWorkflowText(
      source.prompt || source.taskPrompt || "",
    );
    const rawSource = String(source.source || "user")
      .trim()
      .toLowerCase();
    return {
      ...source,
      name,
      label: label || name,
      description,
      prompt,
      url_patterns: normalizeWorkflowPatterns(
        source.url_patterns || source.urlPatterns || [],
      ),
      inputs: normalizeWorkflowInputs(source.inputs),
      enabled: source.enabled !== false,
      source:
        rawSource === "recorded"
          ? "recorded"
          : rawSource === "imported"
            ? "imported"
            : rawSource === "shortcut"
              ? "shortcut"
              : "user",
      version: Math.max(1, Math.round(Number(source.version) || 1)),
      createdAt: normalizeSessionNumber(source.createdAt, fallbackCreatedAt),
      updatedAt: normalizeSessionNumber(source.updatedAt, fallbackUpdatedAt),
    };
  }
  async function readWorkflowStoreState() {
    const stored = await chrome.storage.local.get([WORKFLOW_STORAGE_KEY]);
    const raw = stored[WORKFLOW_STORAGE_KEY];
    const payload =
      raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const workflows = (
      Array.isArray(payload.workflows) ? payload.workflows : []
    )
      .map(function (entry) {
        return normalizeWorkflowEntry(entry, {
          fallbackCreatedAt: Date.now(),
          fallbackUpdatedAt: Date.now(),
        });
      })
      .filter(Boolean)
      .sort(function (left, right) {
        return Number(right.updatedAt || 0) - Number(left.updatedAt || 0);
      });
    return {
      workflows,
      updatedAt: normalizeSessionNumber(payload.updatedAt, Date.now()),
    };
  }
  async function writeWorkflowStoreState(workflows) {
    const payload = {
      version: 1,
      updatedAt: Date.now(),
      workflows: (Array.isArray(workflows) ? workflows : [])
        .map(function (entry) {
          return normalizeWorkflowEntry(entry, {
            fallbackCreatedAt: Date.now(),
            fallbackUpdatedAt: Date.now(),
          });
        })
        .filter(Boolean)
        .sort(function (left, right) {
          return Number(right.updatedAt || 0) - Number(left.updatedAt || 0);
        }),
    };
    await chrome.storage.local.set({
      [WORKFLOW_STORAGE_KEY]: payload,
    });
    return payload;
  }
  function downloadTextFile(filename, text, mimeType) {
    const blob = new Blob([String(text || "")], {
      type: mimeType || "application/json",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = String(filename || "download.txt");
    anchor.click();
    setTimeout(function () {
      URL.revokeObjectURL(objectUrl);
    }, 0);
  }
  const createEmptyConfig =
    helpers.createEmptyConfig ||
    function () {
      return {
        name: "",
        authMode: DEFAULT_AUTH_MODE,
        format: DEFAULT_FORMAT,
        baseUrl: "",
        apiKey: "",
        codexAccountId: "",
        codexRefreshToken: "",
        codexLastRefresh: "",
        defaultModel: "",
        fastModel: "",
        reasoningEffort: "medium",
        maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
        contextWindow: DEFAULT_CONTEXT_WINDOW,
        fetchedModels: [],
      };
    };
  const probeProviderModel =
    helpers.probeProviderModel ||
    async function () {
      throw new Error("健康检测工具未加载。");
    };
  const SHARED_FRAME_CLASS = "bg-bg-100 border border-border-300 rounded-xl";
  let activeDropdownController = null;
  let activeUiCleanup = null;
  let uiRebuildScheduled = false;
  let preferredUiLocaleKey = "";
  const normalizeReasoningEffort =
    helpers.normalizeReasoningEffort ||
    function (value) {
      const effort = String(value || "")
        .trim()
        .toLowerCase();
      return ["none", "low", "medium", "high", "max"].includes(effort)
        ? effort
        : "medium";
    };
  const normalizeMaxOutputTokens =
    helpers.normalizeMaxOutputTokens ||
    function (value, fallbackValue) {
      const numeric = Number(String(value ?? "").trim());
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return fallbackValue || DEFAULT_MAX_OUTPUT_TOKENS;
      }
      return Math.max(1, Math.round(numeric));
    };
  const normalizeContextWindow =
    helpers.normalizeContextWindow ||
    function (value, fallbackValue) {
      const numeric = Number(String(value ?? "").trim());
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return fallbackValue || DEFAULT_CONTEXT_WINDOW;
      }
      return Math.max(MIN_CONTEXT_WINDOW, Math.round(numeric));
    };
  function formatMaxOutputTokensForInput(value) {
    return String(normalizeMaxOutputTokens(value, DEFAULT_MAX_OUTPUT_TOKENS));
  }
  function formatContextWindowForInput(value) {
    return String(
      Math.max(
        Math.ceil(MIN_CONTEXT_WINDOW / 1000),
        Math.ceil(normalizeContextWindow(value, DEFAULT_CONTEXT_WINDOW) / 1000),
      ),
    );
  }
  function parseContextWindowInputK(value) {
    return Number(
      String(value ?? "")
        .trim()
        .replace(/[kK]/g, ""),
    );
  }
  function getContextWindowInputWidth(value, placeholder) {
    const text =
      String(value ?? "").trim() || String(placeholder ?? "").trim() || "200";
    const characters = Math.max(4, Math.min(7, text.length + 2));
    return `${characters}ch`;
  }
  const normalizeConfig =
    helpers.normalizeConfig ||
    function (raw, fallbackEnabled) {
      const source = raw && typeof raw === "object" ? raw : {};
      const authMode =
        String(source.authMode || "").trim().toLowerCase() === AUTH_MODE_CODEX
          ? AUTH_MODE_CODEX
          : DEFAULT_AUTH_MODE;
      return {
        name: String(source.name || "").trim(),
        authMode,
        format:
          authMode === AUTH_MODE_CODEX
            ? OPENAI_RESPONSES_FORMAT
            : String(source.format || DEFAULT_FORMAT).trim() || DEFAULT_FORMAT,
        baseUrl: String(
          source.baseUrl ||
            (authMode === AUTH_MODE_CODEX ? CODEX_DEFAULT_BASE_URL : ""),
        )
          .trim()
          .replace(/\/+$/, ""),
        apiKey: String(source.apiKey || "").trim(),
        codexAccountId:
          authMode === AUTH_MODE_CODEX
            ? String(source.codexAccountId || "").trim()
            : "",
        codexRefreshToken:
          authMode === AUTH_MODE_CODEX
            ? String(source.codexRefreshToken || "").trim()
            : "",
        codexLastRefresh:
          authMode === AUTH_MODE_CODEX
            ? String(source.codexLastRefresh || "").trim()
            : "",
        defaultModel: String(source.defaultModel || "").trim(),
        fastModel: String(
          source.fastModel || source.small_fast_model || "",
        ).trim(),
        reasoningEffort: normalizeReasoningEffort(source.reasoningEffort),
        maxOutputTokens: normalizeMaxOutputTokens(source.maxOutputTokens),
        contextWindow: normalizeContextWindow(source.contextWindow),
        fetchedModels: Array.isArray(source.fetchedModels)
          ? source.fetchedModels.slice()
          : [],
      };
    };
  const buildRequestUrl =
    helpers.buildRequestUrl ||
    function (baseUrl, format) {
      const normalizedBaseUrl = String(baseUrl || "")
        .trim()
        .replace(/\/+$/, "");
      const normalizedFormat = String(format || DEFAULT_FORMAT)
        .trim()
        .toLowerCase();
      if (!normalizedBaseUrl) {
        return "";
      }
      if (normalizedFormat === "openai_chat" || normalizedFormat === "openai") {
        return /\/chat\/completions$/i.test(normalizedBaseUrl)
          ? normalizedBaseUrl
          : normalizedBaseUrl + "/chat/completions";
      }
      if (
        normalizedFormat === "openai_responses" ||
        normalizedFormat === "responses"
      ) {
        return /\/responses$/i.test(normalizedBaseUrl)
          ? normalizedBaseUrl
          : normalizedBaseUrl + "/responses";
      }
      return /\/messages$/i.test(normalizedBaseUrl)
        ? normalizedBaseUrl
        : normalizedBaseUrl + "/messages";
    };
  const fetchProviderModels =
    helpers.fetchProviderModels ||
    async function () {
      throw new Error("Model fetch helper is not available.");
    };
  function getDocumentTextExcludingCustomRoots() {
    if (!document.body || typeof document.createTreeWalker !== "function") {
      return "";
    }
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) {
            return NodeFilter.FILTER_REJECT;
          }
          if (
            parent.closest(
              `#${ROOT_ID}, #${SESSION_ROOT_ID}, #${PROMPT_ROOT_ID}, #${DEBUG_ROOT_ID}`,
            )
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );
    let text = "";
    while (walker.nextNode()) {
      text += " " + String(walker.currentNode.nodeValue || "");
    }
    return text.trim();
  }
  function normalizeLocaleKey(value) {
    if (typeof i18nShared.normalizeUiLocaleTag === "function") {
      return i18nShared.normalizeUiLocaleTag(value);
    }
    const locale = String(value || "")
      .trim()
      .toLowerCase();
    if (!locale) {
      return "";
    }
    return locale.startsWith("zh") ? "zh-CN" : "en-US";
  }
  async function readStoredPreferredUiLocaleKey() {
    try {
      const stored = await chrome.storage.local.get(
        PREFERRED_LOCALE_STORAGE_KEY,
      );
      return normalizeLocaleKey(stored[PREFERRED_LOCALE_STORAGE_KEY]);
    } catch {
      return "";
    }
  }
  function applyPreferredUiLocaleKey(value) {
    const nextLocaleKey = normalizeLocaleKey(value);
    if (nextLocaleKey === preferredUiLocaleKey) {
      return false;
    }
    preferredUiLocaleKey = nextLocaleKey;
    return true;
  }
  function clearDeferredUiLocaleCheck() {
    if (!deferredUiLocaleCheckTimer) {
      return;
    }
    clearTimeout(deferredUiLocaleCheckTimer);
    deferredUiLocaleCheckTimer = 0;
  }
  function scheduleDeferredUiLocaleCheck(attempts) {
    const remainingAttempts = Number.isFinite(Number(attempts))
      ? Math.max(0, Number(attempts))
      : 0;
    if (!remainingAttempts) {
      return;
    }
    clearDeferredUiLocaleCheck();
    deferredUiLocaleCheckTimer = setTimeout(function () {
      deferredUiLocaleCheckTimer = 0;
      if (!syncRenderedUiLocale("deferred")) {
        scheduleDeferredUiLocaleCheck(remainingAttempts - 1);
      }
    }, 50);
  }
  function detectDocumentUiLocaleKey() {
    const explicitLocaleKey = normalizeLocaleKey(
      document?.documentElement?.dataset?.cpUiLocale ||
        (typeof document?.documentElement?.getAttribute === "function"
          ? document.documentElement.getAttribute("data-cp-ui-locale")
          : ""),
    );
    if (explicitLocaleKey) {
      return explicitLocaleKey;
    }
    if (typeof i18nShared.getUiLocaleTag === "function") {
      return i18nShared.getUiLocaleTag({
        document,
        navigatorLanguage: navigator.language,
        ignoredSelectors: [
          "#" + ROOT_ID,
          "#" + SESSION_ROOT_ID,
          "#" + PROMPT_ROOT_ID,
          "#" + DEBUG_ROOT_ID,
        ],
        zhPageHints: [
          "Claw in Chrome 设置",
          "Claude in Chrome 设置",
          "权限",
          "快捷键",
          "选项",
        ],
        enPagePatterns: [
          /\bPermissions\b/i,
          /\bShortcuts\b/i,
          /\bOptions\b/i,
          /\bChange language\b/i,
        ],
      });
    }
    const nativeText = getDocumentTextExcludingCustomRoots();
    if (
      /\bPermissions\b|\bShortcuts\b|\bOptions\b|\bChange language\b/i.test(
        nativeText,
      )
    ) {
      return "en-US";
    }
    if (
      nativeText.includes("Claw in Chrome 设置") ||
      nativeText.includes("Claude in Chrome 设置") ||
      nativeText.includes("权限") ||
      nativeText.includes("快捷键") ||
      nativeText.includes("选项")
    ) {
      return "zh-CN";
    }
    return normalizeLocaleKey(document.documentElement.lang || navigator.language);
  }
  function getUiLocaleKey() {
    return preferredUiLocaleKey || detectDocumentUiLocaleKey();
  }
  function isChineseUi() {
    return getUiLocaleKey().startsWith("zh");
  }
  function getStrings() {
    return currentUiStrings;
  }
  async function buildUiForCurrentLocale() {
    await ensureUiStrings(getUiLocaleKey());
    buildUi();
  }
  function scheduleUiRebuild() {
    if (uiRebuildScheduled) {
      return;
    }
    uiRebuildScheduled = true;
    const scheduler =
      typeof requestAnimationFrame === "function"
        ? requestAnimationFrame
        : function (callback) {
            return setTimeout(callback, 16);
          };
    scheduler(function () {
      uiRebuildScheduled = false;
      buildUiForCurrentLocale().catch(function () {});
    });
  }
  function syncRenderedUiLocale(reason) {
    const nextLocaleKey = getUiLocaleKey();
    if (!nextLocaleKey || nextLocaleKey === renderedUiLocaleKey) {
      return false;
    }
    debugLog("customProvider.locale.sync", {
      reason,
      from: renderedUiLocaleKey,
      to: nextLocaleKey,
      hash: location.hash,
    });
    scheduleUiRebuild();
    return true;
  }
  function getApiKeyVisibilityIconMarkup(visible) {
    if (visible) {
      return "<svg viewBox='0 0 20 20' fill='none' aria-hidden='true'><path d='M2.2 2.2L17.8 17.8' stroke='currentColor' stroke-width='1.6' stroke-linecap='round'/><path d='M8.7 8.83A2 2 0 0 0 8 10a2 2 0 0 0 3.17 1.63' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/><path d='M4.46 6.54C3.21 7.57 2.4 8.83 2 10c1.04 3.04 4.18 5.5 8 5.5 1.7 0 3.27-.49 4.58-1.32' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/><path d='M7 4.92A8.36 8.36 0 0 1 10 4.5c3.82 0 6.96 2.46 8 5.5a9.72 9.72 0 0 1-1.73 2.83' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>";
    }
    return "<svg viewBox='0 0 20 20' fill='none' aria-hidden='true'><path d='M2 10c1.04-3.04 4.18-5.5 8-5.5s6.96 2.46 8 5.5c-1.04 3.04-4.18 5.5-8 5.5S3.04 13.04 2 10Z' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/><circle cx='10' cy='10' r='2.5' stroke='currentColor' stroke-width='1.6'/></svg>";
  }
  function truncateStatusText(value, maxLength) {
    const text =
      typeof value === "string" ? value.trim() : String(value || "").trim();
    const limit = Number.isFinite(maxLength) && maxLength > 0 ? maxLength : 72;
    if (text.length <= limit) {
      return text;
    }
    return text.slice(0, limit) + "...";
  }
  function appendStatusCodeSuffix(fallback, code) {
    if (!fallback) {
      return code;
    }
    return /[\u4e00-\u9fff]/.test(fallback)
      ? `${fallback}（${code}）`
      : `${fallback} (${code})`;
  }
  function compactStatusMessage(message, fallback) {
    const fallbackText = typeof fallback === "string" ? fallback.trim() : "";
    if (typeof message !== "string") {
      return fallbackText;
    }
    const raw = message.trim();
    if (!raw) {
      return fallbackText;
    }
    const normalized = raw.replace(/\s+/g, " ").trim();
    const statusCodeMatch = normalized.match(/\b([45]\d{2})\b/);
    const hasHtml =
      /<!doctype|<html|<head|<body|<title|<center|<h1|<hr\b|<\/?[a-z][\s\S]*>/i.test(
        raw,
      );
    if (hasHtml) {
      return statusCodeMatch
        ? appendStatusCodeSuffix(fallbackText, statusCodeMatch[1])
        : fallbackText;
    }
    if (!normalized) {
      return fallbackText;
    }
    if (normalized.length > 120) {
      return statusCodeMatch
        ? appendStatusCodeSuffix(fallbackText, statusCodeMatch[1])
        : fallbackText;
    }
    return normalized;
  }
  function getReadableErrorMessage(error, fallback) {
    const extracted =
      typeof helpers.extractErrorMessage === "function"
        ? helpers.extractErrorMessage(error, "")
        : "";
    if (typeof extracted === "string" && extracted.trim()) {
      return compactStatusMessage(extracted, fallback || "");
    }
    if (error && typeof error.message === "string" && error.message.trim()) {
      return compactStatusMessage(error.message, fallback || "");
    }
    if (typeof error === "string" && error.trim()) {
      return compactStatusMessage(error, fallback || "");
    }
    return compactStatusMessage("", fallback || "");
  }
  const syncModelOptions = function (select, models, selectedValue) {
    if (!select) {
      return;
    }
    const strings = getStrings();
    const normalizedSelectedValue = String(selectedValue || "").trim();
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = models.length
      ? strings.selectFetchedModel
      : strings.fetchModelsToPickOne;
    select.appendChild(placeholder);
    for (const model of models || []) {
      const option = document.createElement("option");
      option.value = model.value;
      option.textContent = model.label || model.value;
      option.dataset.manual = model.manual ? "true" : "false";
      select.appendChild(option);
    }
    if (
      normalizedSelectedValue &&
      !(models || []).some((model) => model.value === normalizedSelectedValue)
    ) {
      const fallbackOption = document.createElement("option");
      fallbackOption.value = normalizedSelectedValue;
      fallbackOption.textContent = normalizedSelectedValue;
      fallbackOption.dataset.manual = "false";
      select.appendChild(fallbackOption);
    }
    select.disabled = !models.length && !normalizedSelectedValue;
    select.value = normalizedSelectedValue;
  };
  const styles = `
    html {
      scrollbar-gutter: stable both-edges;
    }
    body {
      overflow-y: auto;
    }
    .cp-page-stack {
      display: grid;
      gap: 1.25rem;
    }
    .cp-page-card {
      color: hsl(var(--text-100));
    }
    .cp-page-heading {
      margin: 0;
    }
    .cp-page-subheading {
      margin: 0.5rem 0 1.5rem;
      max-width: 54rem;
    }
    .cp-page-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0;
    }
    .cp-update-enhancer-row-control {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      flex: 0 0 auto;
      pointer-events: auto;
    }
    .cp-update-enhancer-toggle {
      position: relative;
      inline-size: 52px;
      block-size: 30px;
      flex: 0 0 auto;
      padding: 0;
      border: none;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.22);
      box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.04);
      transition:
        background-color 260ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 260ms cubic-bezier(0.22, 1, 0.36, 1),
        transform 220ms ease;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      -webkit-tap-highlight-color: transparent;
      outline: none;
      overflow: hidden;
    }
    .cp-update-enhancer-toggle::after {
      content: "";
      position: absolute;
      top: 4px;
      left: 4px;
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: #ffffff;
      box-shadow:
        0 8px 18px rgba(15, 23, 42, 0.14),
        0 1px 3px rgba(15, 23, 42, 0.08);
      will-change: transform;
      transition:
        transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 220ms ease;
    }
    .cp-update-enhancer-toggle[data-enabled="true"] {
      background: color-mix(
        in srgb,
        hsl(var(--brand-100, 20 67% 54%)) 74%,
        white 26%
      );
      box-shadow:
        inset 0 0 0 1px rgba(217, 119, 6, 0.08),
        0 8px 18px rgba(217, 119, 6, 0.14);
    }
    .cp-update-enhancer-toggle[data-enabled="true"]::after {
      transform: translate3d(22px, 0, 0);
    }
    .cp-update-enhancer-toggle:focus-visible {
      outline: none;
      box-shadow:
        inset 0 0 0 1px rgba(217, 119, 6, 0.12),
        0 10px 24px rgba(217, 119, 6, 0.16);
    }
    .cp-update-enhancer-toggle:hover::after {
      box-shadow:
        0 10px 22px rgba(15, 23, 42, 0.16),
        0 1px 3px rgba(15, 23, 42, 0.08);
    }
    .cp-update-enhancer-toggle:active::after {
      transform: translate3d(1px, 0, 0) scale(0.96);
    }
    .cp-update-enhancer-toggle[data-enabled="true"]:active::after {
      transform: translate3d(21px, 0, 0) scale(0.96);
    }
    .cp-update-enhancer-toggle:disabled {
      cursor: not-allowed;
      opacity: 0.58;
    }
    .cp-page-row-copy,
    .cp-page-field {
      display: grid;
      gap: 0.5rem;
      min-width: 0;
    }
    .cp-page-row-title {
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 1rem;
      font-weight: 500;
      line-height: 1.4;
      color: hsl(var(--text-100));
    }
    .cp-page-help,
    .cp-page-row-help,
    .cp-page-status,
    .cp-page-url-preview,
    .cp-page-meta {
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      line-height: 1.45;
      color: hsl(var(--text-400));
    }
    .cp-page-help,
    .cp-page-row-help,
    .cp-page-status {
      font-size: 0.875rem;
    }
    .cp-page-url-preview,
    .cp-page-meta {
      font-size: 0.8125rem;
      display: block;
      max-width: 100%;
      white-space: normal;
    }
    .cp-page-grid {
      display: grid;
      gap: 1rem;
      width: 100%;
    }
    .cp-page-grid-2 {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: start;
    }
    .cp-page-grid-3 {
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: start;
    }
    .cp-page-grid-2 > * {
      min-width: 0;
    }
    .cp-page-grid-3 > * {
      min-width: 0;
    }
    .cp-page-label-row {
      display: grid;
      gap: 0.25rem;
      align-items: start;
      justify-items: start;
    }
    .cp-page-split-label-row {
      display: grid;
      gap: 0.75rem;
      width: 100%;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: end;
    }
    .cp-page-split-label-row > .cp-page-label {
      min-width: 0;
    }
    .cp-model-control-row {
      display: flex;
      align-items: stretch;
      gap: 0.75rem;
      width: 100%;
    }
    .cp-model-control-row > .cp-dropdown {
      flex: 1 1 auto;
      min-width: 0;
    }
    .cp-model-control-row > .cp-page-select {
      flex: 1 1 auto;
      min-width: 0;
    }
    .cp-model-control-row > .cp-page-input {
      flex: 1 1 auto;
      min-width: 0;
    }
    .cp-model-control-row > .cp-page-input-shell {
      flex: 1 1 auto;
      min-width: 0;
    }
    .cp-context-window-shell {
      justify-content: flex-start;
      gap: 0.5rem;
      padding-left: 0.875rem;
      padding-right: 0.25rem;
    }
    .cp-context-window-value {
      display: inline-flex;
      align-items: baseline;
      gap: 0.125rem;
      flex: 0 0 auto;
      min-width: auto;
    }
    .cp-context-window-shell .cp-context-window-input {
      flex: 0 0 auto;
      width: 5ch;
      min-width: 4ch;
      padding-left: 0;
      padding-right: 0;
      text-align: left;
    }
    .cp-context-window-stepper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.125rem;
      flex: 0 0 auto;
      margin-left: auto;
      margin-right: 0.375rem;
    }
    .cp-context-window-step-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 1rem;
      height: 0.875rem;
      padding: 0;
      border: 0;
      background: transparent;
      color: hsl(var(--text-300));
      font-size: 0.75rem;
      line-height: 1;
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .cp-context-window-step-btn:hover,
    .cp-context-window-step-btn:focus {
      color: hsl(var(--text-100));
      outline: none;
    }
    .cp-model-action-group {
      display: flex;
      align-items: stretch;
      flex: 0 0 auto;
      flex-wrap: wrap;
      justify-content: flex-start;
      margin-left: 0;
      gap: 0.75rem;
    }
    .cp-provider-editor-action-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .cp-model-action-btn {
      min-height: 3rem;
      box-sizing: border-box;
      white-space: nowrap;
    }
    .cp-model-action-btn-main {
      flex: 0 0 auto;
    }
    .cp-model-action-btn-add {
      flex: 0 0 auto;
    }
    .cp-page-label {
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.3;
      color: hsl(var(--text-200));
    }
    .cp-page-input,
    .cp-page-select,
    .cp-page-textarea {
      appearance: none;
      -webkit-appearance: none;
      width: 100%;
      box-sizing: border-box;
      min-height: 3rem;
      color: hsl(var(--text-100));
      padding: 0.75rem 0.875rem;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.95rem;
      line-height: 1.45;
      box-shadow: none;
      transition: none;
    }
    .cp-page-select {
      padding-right: 2.75rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%235B5A55' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.95rem center;
      background-size: 14px 14px;
    }
    .cp-native-select {
      display: none !important;
    }
    .cp-dropdown {
      position: relative;
      width: 100%;
      overflow: visible;
    }
    .cp-dropdown-trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      width: 100%;
      min-height: 3rem;
      padding: 0.75rem 0.875rem;
      text-align: left;
      color: hsl(var(--text-200));
      cursor: pointer;
    }
    .cp-dropdown-trigger:hover,
    .cp-dropdown-trigger[data-open="true"] {
      background: hsl(var(--bg-200));
      color: hsl(var(--text-100));
    }
    .cp-dropdown-trigger:disabled {
      opacity: 0.64;
      cursor: not-allowed;
    }
    .cp-dropdown-trigger-label {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.95rem;
      line-height: 1.45;
    }
    .cp-dropdown-trigger-icon {
      flex: 0 0 auto;
      width: 14px;
      height: 14px;
      opacity: 0.85;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 14 14' fill='none'%3E%3Cpath d='M3.5 5.25L7 8.75L10.5 5.25' stroke='%235B5A55' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: center;
      background-size: 14px 14px;
    }
    .cp-dropdown-menu {
      position: absolute;
      z-index: 80;
      left: 0;
      right: 0;
      top: calc(100% + 0.5rem);
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 0.5rem;
      box-shadow: none;
      max-height: 300px;
      overflow-y: auto;
    }
    .cp-dropdown-menu[data-placement="top"] {
      top: auto;
      bottom: calc(100% + 0.5rem);
    }
    .cp-dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1 1 auto;
      min-width: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0.75rem 0.875rem;
      border: 0;
      border-radius: 0.875rem;
      background: transparent;
      color: hsl(var(--text-100));
      text-align: left;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .cp-dropdown-item:hover,
    .cp-dropdown-item[data-active="true"] {
      background: hsl(var(--bg-200));
      color: hsl(var(--text-000));
    }
    .cp-dropdown-item:disabled {
      opacity: 0.56;
      cursor: default;
    }
    .cp-dropdown-item-label {
      flex: 1;
      min-width: 0;
      font-size: 0.875rem;
      line-height: 1.4;
      white-space: normal;
      word-break: break-word;
    }
    .cp-dropdown-item-check {
      margin-left: auto;
      color: hsl(var(--accent-100));
      font-size: 0.875rem;
      line-height: 1;
      flex: 0 0 auto;
    }
    .cp-dropdown-item-shell {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      width: 100%;
    }
    .cp-dropdown-item-shell[data-active="true"] .cp-dropdown-item {
      background: hsl(var(--bg-200));
      color: hsl(var(--text-000));
    }
    .cp-dropdown-item-delete {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 1.875rem;
      height: 1.875rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      color: hsl(var(--text-400));
      font-size: 1rem;
      line-height: 1;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .cp-dropdown-item-delete:hover {
      background: hsl(var(--bg-200));
      color: hsl(var(--danger-100));
    }
    .cp-page-input-mono {
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
      font-size: 0.875rem;
    }
    .cp-page-textarea {
      min-height: 5.5rem;
      resize: vertical;
    }
    .cp-prompt-textarea {
      min-height: 14rem;
    }
    .cp-page-input::placeholder,
    .cp-page-textarea::placeholder {
      color: hsl(var(--text-400));
    }
    .cp-page-input:hover,
    .cp-page-select:hover,
    .cp-page-textarea:hover {
      box-shadow: none;
    }
    .cp-page-input-shell {
      display: flex;
      align-items: center;
      min-height: 3rem;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
    }
    .cp-page-input-shell .cp-page-input {
      min-height: 0;
      border: 0;
      background: transparent;
      padding-right: 0.375rem;
      box-shadow: none;
      flex: 1 1 auto;
      min-width: 0;
    }
    .cp-page-input-shell .cp-page-input:hover,
    .cp-page-input-shell .cp-page-input:focus {
      box-shadow: none;
      outline: none;
    }
    .cp-page-visibility-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      margin-right: 0.25rem;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: transparent;
      color: hsl(var(--text-300));
      cursor: pointer;
      flex: 0 0 auto;
      transition: background-color 0.15s ease, color 0.15s ease;
    }
    .cp-page-visibility-btn:hover {
      background: hsl(var(--bg-200));
      color: hsl(var(--text-100));
    }
    .cp-page-visibility-btn:focus {
      outline: none;
      box-shadow: none;
    }
    .cp-page-visibility-btn svg {
      width: 1rem;
      height: 1rem;
      display: block;
    }
    .cp-page-input:focus,
    .cp-page-select:focus,
    .cp-page-textarea:focus {
      outline: none;
      box-shadow: none;
    }
    .cp-provider-view {
      display: grid;
      gap: 1rem;
    }
    .cp-provider-header {
      position: relative;
    }
    .cp-provider-header-action {
      position: absolute;
      top: 0;
      right: 0;
    }
    .cp-provider-header .cp-page-subheading {
      margin-right: 12rem;
    }
    .cp-provider-toolbar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .cp-provider-toolbar-copy {
      display: grid;
      gap: 0.35rem;
      min-width: 0;
    }
    .cp-provider-card-list {
      display: grid;
      gap: 1rem;
    }
    .cp-provider-card {
      display: grid;
      gap: 1rem;
    }
    .cp-provider-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cp-provider-card-title-wrap {
      display: grid;
      gap: 0.25rem;
      min-width: 0;
      flex: 1 1 24rem;
    }
    .cp-provider-card-title-row {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.625rem;
      flex-wrap: wrap;
      min-width: 0;
    }
    .cp-provider-card-title {
      margin: 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
      color: hsl(var(--text-100));
      word-break: break-word;
    }
    .cp-provider-card-subtitle {
      margin: 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      line-height: 1.45;
      color: hsl(var(--text-400));
      word-break: break-word;
    }
    .cp-provider-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 1.75rem;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      background: hsl(var(--bg-300));
      color: hsl(var(--text-000));
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.8125rem;
      font-weight: 500;
      line-height: 1.2;
      white-space: nowrap;
    }
    .cp-provider-badge[data-tone="brand"] {
      background: hsl(var(--brand-100));
      color: hsl(var(--oncolor-100));
    }
    .cp-provider-summary {
      display: grid;
      gap: 0.75rem;
    }
    .cp-provider-summary-row {
      display: grid;
      gap: 0.75rem;
    }
    .cp-provider-summary-row[data-columns="2"] {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .cp-provider-summary-row[data-columns="3"] {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .cp-provider-editor-primary-row {
      grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    }
    .cp-provider-summary[data-layout="single"] {
      grid-template-columns: minmax(0, 1fr);
    }
    .cp-provider-summary-item {
      display: grid;
      gap: 0.25rem;
      min-width: 0;
    }
    .cp-provider-summary-item[data-field="model"],
    .cp-provider-summary-item[data-field="reasoning"],
    .cp-provider-summary-item[data-field="fastModel"],
    .cp-provider-summary-item[data-field="contextWindow"],
    .cp-provider-summary-item[data-field="maxOutputTokens"] {
      gap: 0.5rem;
    }
    .cp-provider-summary-label {
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1.35;
      color: hsl(var(--text-400));
    }
    .cp-provider-summary-value {
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      line-height: 1.45;
      color: hsl(var(--text-100));
      word-break: break-word;
    }
    .cp-provider-summary-value[data-truncate="true"] {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      word-break: normal;
    }
    .cp-provider-summary-value[data-truncate="multiline"] {
      display: -webkit-box;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: normal;
      word-break: break-word;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
    }
    .cp-provider-summary-value[data-mono="true"] {
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
      font-size: 0.8125rem;
    }
    .cp-provider-inline-control {
      width: 100%;
    }
    .cp-provider-inline-control .cp-dropdown {
      width: 100%;
    }
    .cp-provider-inline-control .cp-dropdown-trigger {
      width: 100%;
    }
    .cp-provider-inline-control .cp-page-input {
      width: 100%;
    }
    .cp-provider-editor-field {
      gap: 0.5rem;
    }
    .cp-provider-editor-field .cp-page-meta {
      margin-top: 0.125rem;
    }
    .cp-provider-editor-field .cp-page-label-row .cp-page-meta {
      margin-top: 0;
    }
    .cp-provider-editor-model-field .cp-model-control-row {
      align-items: center;
    }
    .cp-provider-card-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cp-workflow-json-textarea {
      min-height: 30rem;
      font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
      font-size: 0.8125rem;
      line-height: 1.55;
      white-space: pre;
      tab-size: 2;
      resize: vertical;
    }
    .cp-workflow-header-actions {
      align-items: stretch;
    }
    .cp-workflow-card-actions {
      align-items: stretch;
    }
    .cp-session-browser-copy {
      display: grid;
      gap: 0.25rem;
      min-width: 0;
      flex: 1 1 24rem;
    }
    .cp-session-history-empty {
      padding: 1rem 0 0;
    }
    .cp-session-record-list {
      display: grid;
      gap: 0.75rem;
    }
    .cp-session-record-item {
      display: grid;
      gap: 0.625rem;
      padding: 1rem;
      border-radius: 0.875rem;
      border: 1px solid hsl(var(--border-300));
      background: hsl(var(--bg-000));
    }
    .cp-session-record-item[data-role="user"] {
      border-color: hsl(var(--border-200));
      background: hsl(var(--bg-100));
    }
    .cp-session-record-item[data-role="assistant"] {
      border-color: hsl(var(--border-300));
    }
    .cp-session-record-item[data-role="system"],
    .cp-session-record-item[data-role="tool"] {
      background: hsl(var(--bg-100));
    }
    .cp-session-record-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cp-session-record-role {
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.8125rem;
      font-weight: 600;
      line-height: 1.35;
      color: hsl(var(--text-200));
    }
    .cp-session-record-content {
      margin: 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      line-height: 1.6;
      color: hsl(var(--text-100));
      white-space: pre-wrap;
      word-break: break-word;
    }
    .cp-provider-empty {
      display: grid;
      gap: 0.5rem;
      padding: 1.25rem;
      background: hsl(var(--bg-100));
      border: 1px dashed hsl(var(--border-300));
      border-radius: 0.75rem;
    }
    .cp-provider-empty-title {
      margin: 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
      color: hsl(var(--text-100));
    }
    .cp-provider-empty-help {
      margin: 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      line-height: 1.45;
      color: hsl(var(--text-400));
    }
    .cp-provider-editor-toolbar {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .cp-provider-editor-title {
      margin: 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 1rem;
      font-weight: 600;
      line-height: 1.35;
      color: hsl(var(--text-100));
    }
    .cp-provider-editor-help {
      margin: 0.25rem 0 0;
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.875rem;
      line-height: 1.45;
      color: hsl(var(--text-400));
    }
    .cp-provider-floating-shell {
      position: sticky;
      bottom: 1rem;
      z-index: 8;
      display: flex;
      justify-content: center;
      margin-top: 0.25rem;
      pointer-events: none;
    }
    .cp-provider-floating-capsule {
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
    }
    .cp-provider-floating-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      white-space: nowrap;
      flex: 0 0 auto;
    }
    .cp-provider-floating-btn:disabled {
      opacity: 0.56;
      cursor: not-allowed;
    }
    .cp-page-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .cp-page-btn-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cp-page-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 3rem;
      padding: 0.75rem 1rem;
      color: hsl(var(--text-200));
      font-family: var(--font-ui, ui-sans-serif, system-ui);
      font-size: 0.95rem;
      cursor: pointer;
      box-shadow: none;
      transition: none;
    }
    .cp-page-field > .cp-page-btn,
    .cp-page-field > .cp-page-select,
    .cp-page-field > .cp-page-input,
    .cp-page-field > .cp-page-textarea {
      width: 100%;
    }
    .cp-page-btn:hover {
      color: hsl(var(--text-100));
    }
    .cp-page-btn:disabled {
      opacity: 0.64;
      cursor: wait;
    }
    .cp-page-btn-primary {
      border-color: hsl(var(--brand-100));
      background: hsl(var(--brand-100));
      color: hsl(var(--oncolor-100));
    }
    .cp-page-btn-primary:hover {
      border-color: hsl(var(--brand-200));
      background: hsl(var(--brand-200));
      color: hsl(var(--oncolor-100));
    }
    .cp-page-btn-quiet {
      min-height: 3rem;
      padding: 0.75rem 1rem;
      font-size: 0.95rem;
    }
    .cp-page-status[data-kind="success"],
    .cp-page-meta[data-tone="ready"] {
      color: hsl(var(--success-100));
    }
    .cp-page-status[data-kind="error"],
    .cp-page-meta[data-tone="error"] {
      color: hsl(var(--danger-100));
    }
    .cp-page-meta[data-tone="loading"] {
      color: hsl(var(--text-300));
    }
    .cp-modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(20, 20, 19, 0.34);
    }
    .cp-modal-card {
      width: min(28rem, calc(100vw - 2rem));
    }
    .cp-session-modal-card {
      display: flex;
      flex-direction: column;
      width: min(68rem, calc(100vw - 2rem));
      max-height: min(84vh, 56rem);
      overflow: hidden;
    }
    .cp-session-modal-card > .cp-session-modal-view {
      flex: 1 1 auto;
      min-height: 0;
      overflow: hidden;
    }
    .cp-session-modal-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 0;
    }
    .cp-session-modal-scroll {
      display: grid;
      flex: 1 1 auto;
      gap: 1rem;
      min-height: 0;
      overflow: auto;
      overscroll-behavior: contain;
      padding-right: 0.25rem;
    }
    .cp-modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .cp-page-panel[data-disabled="true"] .cp-page-fieldset {
      opacity: 0.72;
    }
    @media (max-width: 767px) {
      .cp-provider-header-action {
        position: static;
        margin-top: 1rem;
      }
      .cp-provider-header .cp-page-subheading {
        margin-right: 0;
      }
      .cp-provider-floating-shell {
        bottom: 0.75rem;
      }
      .cp-provider-floating-capsule {
        width: min(100%, 32rem);
      }
      .cp-provider-floating-btn {
        flex: 1 1 0;
        min-width: 0;
      }
      .cp-page-grid-2 {
        grid-template-columns: 1fr;
      }
      .cp-page-grid-3 {
        grid-template-columns: 1fr;
      }
      .cp-page-split-label-row {
        grid-template-columns: 1fr;
      }
      .cp-model-control-row {
        flex-direction: column;
      }
      .cp-provider-summary-row[data-columns="2"],
      .cp-provider-summary-row[data-columns="3"] {
        grid-template-columns: 1fr;
      }
      .cp-provider-editor-primary-row {
        grid-template-columns: 1fr;
      }
      .cp-model-action-group {
        flex-wrap: wrap;
        width: 100%;
      }
      .cp-model-action-btn-main {
        flex: 1 1 auto;
      }
      .cp-page-row,
      .cp-page-actions {
        flex-direction: column;
        align-items: flex-start;
      }
      .cp-page-btn-row,
      .cp-page-btn {
        width: 100%;
      }
    }
  `;
  function createNode(tag, className, text) {
    const node = document.createElement(tag);
    if (className) {
      node.className = className;
    }
    if (text != null) {
      node.textContent = text;
    }
    return node;
  }
  function closeActiveDropdown(except) {
    if (activeDropdownController && activeDropdownController !== except) {
      activeDropdownController.close();
    }
  }
  function enhanceSelect(select) {
    select.classList.add("cp-native-select");
    const shell = createNode("div", "cp-dropdown");
    const trigger = createNode(
      "button",
      `cp-dropdown-trigger ${SHARED_FRAME_CLASS}`,
    );
    trigger.type = "button";
    const triggerLabel = createNode("span", "cp-dropdown-trigger-label");
    const triggerIcon = createNode("span", "cp-dropdown-trigger-icon");
    trigger.appendChild(triggerLabel);
    trigger.appendChild(triggerIcon);
    const menu = createNode("div", `cp-dropdown-menu ${SHARED_FRAME_CLASS}`);
    menu.hidden = true;
    let isOpen = false;
    let isPreparingOpen = false;
    function getOptions() {
      return Array.from(select.options || []);
    }
    function getSelectedOption() {
      return (
        getOptions().find(function (option) {
          return option.value === select.value;
        }) ||
        select.options[select.selectedIndex] ||
        null
      );
    }
    function positionMenu() {
      const rect = trigger.getBoundingClientRect();
      menu.style.left = "0";
      menu.style.right = "0";
      menu.style.width = "100%";
      menu.style.top = "calc(100% + 0.5rem)";
      menu.style.bottom = "auto";
      menu.dataset.placement = "bottom";
      menu.style.visibility = "hidden";
      menu.hidden = false;
      const menuHeight = menu.offsetHeight;
      if (
        rect.bottom + 8 + menuHeight > window.innerHeight - 8 &&
        rect.top - 8 - menuHeight >= 8
      ) {
        menu.dataset.placement = "top";
        menu.style.top = "auto";
        menu.style.bottom = "calc(100% + 0.5rem)";
      }
      menu.style.visibility = "";
    }
    function syncTrigger() {
      const selected = getSelectedOption();
      triggerLabel.textContent = selected ? selected.textContent : "";
      trigger.disabled = !!select.disabled;
    }
    function dispatchChange() {
      select.dispatchEvent(
        new Event("change", {
          bubbles: true,
        }),
      );
      select.dispatchEvent(
        new Event("input", {
          bubbles: true,
        }),
      );
    }
    function renderMenu() {
      menu.innerHTML = "";
      const options = getOptions();
      const nonEmptyOptions = options.filter(function (option) {
        return option.value !== "";
      });
      const sourceOptions = nonEmptyOptions.length ? nonEmptyOptions : options;
      for (const option of sourceOptions) {
        const shell = createNode("div", "cp-dropdown-item-shell");
        shell.dataset.active = option.value === select.value ? "true" : "false";
        const item = createNode("button", "cp-dropdown-item");
        item.type = "button";
        item.disabled = !!option.disabled;
        const label = createNode(
          "span",
          "cp-dropdown-item-label",
          option.textContent || "",
        );
        item.appendChild(label);
        if (option.value === select.value) {
          item.appendChild(createNode("span", "cp-dropdown-item-check", "✓"));
        }
        item.addEventListener("click", function () {
          if (option.disabled) {
            return;
          }
          if (select.value !== option.value) {
            select.value = option.value;
            dispatchChange();
          }
          controller.close();
        });
        shell.appendChild(item);
        if (
          option.dataset.manual === "true" &&
          typeof select.__cpDeleteOption === "function"
        ) {
          const deleteButton = createNode(
            "button",
            "cp-dropdown-item-delete",
            "×",
          );
          deleteButton.type = "button";
          deleteButton.setAttribute("aria-label", `delete-${option.value}`);
          deleteButton.addEventListener("click", function (event) {
            event.preventDefault();
            event.stopPropagation();
            select.__cpDeleteOption(option.value);
            if (isOpen) {
              renderMenu();
              positionMenu();
            }
          });
          shell.appendChild(deleteButton);
        }
        menu.appendChild(shell);
      }
    }
    async function open() {
      if (isOpen || isPreparingOpen) {
        return;
      }
      isPreparingOpen = true;
      closeActiveDropdown(controller);
      try {
        if (typeof select.__cpBeforeOpen === "function") {
          trigger.disabled = true;
          trigger.dataset.loading = "true";
          await select.__cpBeforeOpen({
            select,
            controller,
            trigger,
            menu,
          });
          syncTrigger();
        }
        if (select.disabled) {
          return;
        }
        renderMenu();
        isOpen = true;
        trigger.dataset.open = "true";
        positionMenu();
        activeDropdownController = controller;
      } finally {
        isPreparingOpen = false;
        delete trigger.dataset.loading;
        syncTrigger();
      }
    }
    function close() {
      if (!isOpen) {
        return;
      }
      isOpen = false;
      trigger.dataset.open = "false";
      menu.hidden = true;
      if (activeDropdownController === controller) {
        activeDropdownController = null;
      }
    }
    function toggle() {
      if (isOpen) {
        close();
      } else {
        open();
      }
    }
    trigger.addEventListener("click", function (event) {
      event.preventDefault();
      void toggle();
    });
    trigger.addEventListener("keydown", function (event) {
      if (
        event.key === "ArrowDown" ||
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        void open();
      } else if (event.key === "Escape") {
        close();
      }
    });
    const handleDocumentPointerDown = function (event) {
      const target = event.target;
      if (!shell.contains(target) && !menu.contains(target)) {
        close();
      }
    };
    const handleWindowReflow = function () {
      if (isOpen) {
        positionMenu();
      }
    };
    document.addEventListener("mousedown", handleDocumentPointerDown, true);
    window.addEventListener("resize", handleWindowReflow);
    window.addEventListener("scroll", handleWindowReflow, true);
    const handleSelectChange = function () {
      syncTrigger();
      if (isOpen) {
        renderMenu();
        positionMenu();
      }
    };
    select.addEventListener("change", handleSelectChange);
    select.parentNode.insertBefore(shell, select);
    shell.appendChild(trigger);
    shell.appendChild(menu);
    shell.appendChild(select);
    syncTrigger();
    const controller = {
      close,
      refresh() {
        syncTrigger();
        if (isOpen) {
          renderMenu();
          positionMenu();
        }
      },
      open,
      destroy() {
        close();
        document.removeEventListener(
          "mousedown",
          handleDocumentPointerDown,
          true,
        );
        window.removeEventListener("resize", handleWindowReflow);
        window.removeEventListener("scroll", handleWindowReflow, true);
        select.removeEventListener("change", handleSelectChange);
      },
    };
    return controller;
  }
  async function getState() {
    const stored = await readProviderStoreState();
    return {
      profiles: stored.profiles || [],
      activeProfileId: stored.activeProfileId || null,
      config: stored.activeProfile || stored.config || createEmptyConfig(),
      originalApiKey: stored.originalApiKey,
      currentApiKey: stored.currentApiKey,
    };
  }
  async function getDebugState() {
    const stored = await chrome.storage.local.get([
      DEBUG_LOGS_KEY,
      DEBUG_META_KEY,
      DEBUG_MODE_STORAGE_KEY,
      SHOW_TRACE_IDS_STORAGE_KEY,
      SHOW_SYSTEM_REMINDERS_STORAGE_KEY,
      SHOW_TOOL_RESULT_DETAILS_STORAGE_KEY,
    ]);
    const rawLogs = Array.isArray(stored[DEBUG_LOGS_KEY])
      ? stored[DEBUG_LOGS_KEY]
      : [];
    const rawMeta =
      stored[DEBUG_META_KEY] && typeof stored[DEBUG_META_KEY] === "object"
        ? stored[DEBUG_META_KEY]
        : null;
    const logs = sanitizeDebugExportLogs(rawLogs);
    const meta = sanitizeDebugExportMeta(rawMeta);
    if (
      JSON.stringify(rawLogs) !== JSON.stringify(logs) ||
      JSON.stringify(rawMeta) !== JSON.stringify(meta)
    ) {
      try {
        await chrome.storage.local.set({
          [DEBUG_LOGS_KEY]: logs,
          [DEBUG_META_KEY]: meta,
        });
      } catch {}
    }
    if (stored[DEBUG_MODE_STORAGE_KEY] !== true) {
      try {
        await chrome.storage.local.set({
          [DEBUG_MODE_STORAGE_KEY]: true,
        });
      } catch {}
    }
    return {
      logs,
      meta,
      debugMode: true,
      showTraceIds: stored[SHOW_TRACE_IDS_STORAGE_KEY] === true,
      showSystemReminders: stored[SHOW_SYSTEM_REMINDERS_STORAGE_KEY] === true,
      showToolResultDetails:
        stored[SHOW_TOOL_RESULT_DETAILS_STORAGE_KEY] === true,
    };
  }
  function formatTimestamp(value) {
    if (!value) {
      return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return String(value);
    }
    return parsed.toLocaleString(getUiLocaleKey() || undefined, {
      hour12: false,
    });
  }
  function buildDebugExport(logs, meta) {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        meta: sanitizeDebugExportMeta(meta),
        count: Array.isArray(logs) ? logs.length : 0,
        logs: sanitizeDebugExportLogs(logs),
      },
      null,
      2,
    );
  }
  function normalizeSessionScopeId(value) {
    const normalized = String(value || "").trim();
    return normalized ? normalized.replace(/[^\w:-]/g, "_") : "";
  }
  function chatScopeStoragePrefix(scopeId) {
    const normalized = normalizeSessionScopeId(scopeId);
    return normalized ? `${CHAT_SCOPE_PREFIX}${normalized}` : "";
  }
  function chatScopeIndexKey(scopeId) {
    const prefix = chatScopeStoragePrefix(scopeId);
    return prefix ? `${prefix}.index` : "";
  }
  function chatScopeDraftKey(scopeId) {
    const prefix = chatScopeStoragePrefix(scopeId);
    return prefix ? `${prefix}.activeDraft` : "";
  }
  function chatScopeActiveSessionKey(scopeId) {
    const prefix = chatScopeStoragePrefix(scopeId);
    return prefix ? `${prefix}.activeSession` : "";
  }
  function chatScopeRestoreAnchorKey(scopeId) {
    const prefix = chatScopeStoragePrefix(scopeId);
    return prefix ? `${prefix}.restoreAnchor` : "";
  }
  function chatSessionStorageKey(scopeId, sessionId) {
    const prefix = chatScopeStoragePrefix(scopeId);
    const normalizedSessionId = String(sessionId || "").trim();
    return prefix && normalizedSessionId
      ? `${prefix}.byId.${normalizedSessionId}`
      : "";
  }
  function normalizeSessionNumber(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0
      ? Math.round(numeric)
      : fallback;
  }
  function trimSessionText(value, maxLength) {
    const normalized = String(value || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!normalized) {
      return "";
    }
    const limit =
      Number.isFinite(Number(maxLength)) && Number(maxLength) > 0
        ? Number(maxLength)
        : CHAT_SESSION_PREVIEW_LIMIT;
    return normalized.length > limit
      ? `${normalized.slice(0, Math.max(0, limit - 1)).trimEnd()}…`
      : normalized;
  }
  function stripSessionDisplayArtifacts(value) {
    return String(value || "")
      .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, " ")
      .replace(/<system-reminder>[\s\S]*$/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  function normalizeSessionMode(value) {
    return value === "quick" ? "quick" : "standard";
  }
  function normalizeLocalSessionMeta(value, strings) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const sessionId = String(value.id || "").trim();
    const scopeId = normalizeSessionScopeId(value.scopeId);
    if (!sessionId || !scopeId) {
      return null;
    }
    const fallbackTitle = strings?.sessionUntitled || "New chat";
    return {
      id: sessionId,
      scopeId,
      title:
        trimSessionText(
          stripSessionDisplayArtifacts(value.title || ""),
          CHAT_SESSION_TITLE_LIMIT,
        ) || fallbackTitle,
      preview: trimSessionText(
        stripSessionDisplayArtifacts(value.preview || ""),
        CHAT_SESSION_PREVIEW_LIMIT,
      ),
      createdAt: normalizeSessionNumber(value.createdAt, Date.now()),
      updatedAt: normalizeSessionNumber(value.updatedAt, Date.now()),
      messageCount: Math.max(0, Number(value.messageCount) || 0),
      mode: normalizeSessionMode(value.mode),
      selectedModel: trimSessionText(
        value.selectedModel || "",
        CHAT_SESSION_TITLE_LIMIT,
      ),
      currentUrl: trimSessionText(value.currentUrl || "", 240),
      domain: trimSessionText(value.domain || "", CHAT_SESSION_TITLE_LIMIT),
      tabTitle: trimSessionText(value.tabTitle || "", 120),
    };
  }
  function normalizeLocalRestoreAnchor(value) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const scopeId = normalizeSessionScopeId(value.scopeId);
    const currentUrl = trimSessionText(
      value.currentUrl || value.url || "",
      240,
    );
    if (!scopeId || !currentUrl) {
      return null;
    }
    return {
      scopeId,
      currentUrl,
      domain: trimSessionText(value.domain || "", CHAT_SESSION_TITLE_LIMIT),
      tabTitle: trimSessionText(value.tabTitle || "", 120),
      createdAt: normalizeSessionNumber(value.createdAt, Date.now()),
      sessionId: String(value.sessionId || "").trim(),
    };
  }
  function extractLocalSessionText(value, depth) {
    const nextDepth = Number.isFinite(Number(depth)) ? Number(depth) : 0;
    if (nextDepth > 4 || value == null) {
      return "";
    }
    if (typeof value === "string") {
      return String(value || "")
        .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, " ")
        .replace(/<system-reminder>[\s\S]*$/gi, " ")
        .trim();
    }
    if (Array.isArray(value)) {
      return value
        .map(function (entry) {
          return extractLocalSessionText(entry, nextDepth + 1);
        })
        .filter(Boolean)
        .join("\n\n")
        .trim();
    }
    if (typeof value === "object") {
      if (typeof value.text === "string") {
        return extractLocalSessionText(value.text, nextDepth + 1);
      }
      if (value.type === "tool_use") {
        const name = String(value.name || "").trim();
        return name ? `[Tool] ${name}` : "[Tool]";
      }
      if (value.type === "tool_result") {
        return extractLocalSessionText(value.content, nextDepth + 1);
      }
      if ("content" in value) {
        return extractLocalSessionText(value.content, nextDepth + 1);
      }
      try {
        return JSON.stringify(value);
      } catch {
        return "";
      }
    }
    return "";
  }
  function normalizeLocalSessionMessage(value, index, strings) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const role = String(value.role || "")
      .trim()
      .toLowerCase();
    const text = trimSessionText(
      stripSessionDisplayArtifacts(extractLocalSessionText(value.content, 0)),
      6000,
    );
    if (!text) {
      return null;
    }
    return {
      id: String(value.id || `message-${index + 1}`),
      role,
      text,
    };
  }
  function normalizeLocalSessionSnapshot(value, strings) {
    if (!value || typeof value !== "object") {
      return null;
    }
    const meta = normalizeLocalSessionMeta(
      value.meta || {
        id: value?.meta?.id || value?.id,
        scopeId: value.scopeId || value?.meta?.scopeId,
        title: value?.meta?.title,
        preview: value?.meta?.preview,
        createdAt: value?.meta?.createdAt,
        updatedAt: value?.meta?.updatedAt,
        messageCount: value?.meta?.messageCount,
        mode: value?.meta?.mode || value?.mode,
        selectedModel: value?.selectedModel || value?.meta?.selectedModel,
        currentUrl: value?.currentUrl || value?.meta?.currentUrl,
        domain: value?.domain || value?.meta?.domain,
        tabTitle: value?.tabTitle || value?.meta?.tabTitle,
      },
      strings,
    );
    if (!meta) {
      return null;
    }
    const messages = (Array.isArray(value.messages) ? value.messages : [])
      .map(function (entry, index) {
        return normalizeLocalSessionMessage(entry, index, strings);
      })
      .filter(Boolean);
    return {
      meta,
      messages,
    };
  }
  function extractSessionScopeIds(snapshot) {
    const scopeIds = new Set();
    for (const key of Object.keys(snapshot || {})) {
      const text = String(key || "");
      if (!text.startsWith(CHAT_SCOPE_PREFIX) || !text.endsWith(".index")) {
        continue;
      }
      const scopeId = text.slice(CHAT_SCOPE_PREFIX.length, -".index".length);
      if (scopeId) {
        scopeIds.add(scopeId);
      }
    }
    return Array.from(scopeIds.values()).sort();
  }
  async function getSessionStoreState(strings) {
    const stored = await chrome.storage.local.get(null);
    const sessions = [];
    extractSessionScopeIds(stored).forEach(function (scopeId) {
      const indexKey = chatScopeIndexKey(scopeId);
      const restoreAnchorKey = chatScopeRestoreAnchorKey(scopeId);
      const rawEntries = Array.isArray(stored[indexKey])
        ? stored[indexKey]
        : [];
      const normalizedEntries = rawEntries
        .map(function (entry) {
          return normalizeLocalSessionMeta(entry, strings);
        })
        .filter(function (entry) {
          return entry && entry.scopeId === scopeId;
        })
        .sort(function (left, right) {
          return right.updatedAt - left.updatedAt;
        });
      if (normalizedEntries.length === 0) {
        return;
      }
      const latestEntry = normalizedEntries[0];
      const earliestEntry = normalizedEntries
        .slice()
        .sort(function (left, right) {
          const leftCreated = Number(left.createdAt || left.updatedAt || 0);
          const rightCreated = Number(right.createdAt || right.updatedAt || 0);
          if (leftCreated !== rightCreated) {
            return leftCreated - rightCreated;
          }
          return Number(left.updatedAt || 0) - Number(right.updatedAt || 0);
        })[0];
      const restoreAnchor =
        normalizeLocalRestoreAnchor(stored[restoreAnchorKey]) ||
        (earliestEntry
          ? {
              scopeId,
              currentUrl: trimSessionText(earliestEntry.currentUrl || "", 240),
              domain: trimSessionText(
                earliestEntry.domain || "",
                CHAT_SESSION_TITLE_LIMIT,
              ),
              tabTitle: trimSessionText(earliestEntry.tabTitle || "", 120),
              createdAt: normalizeSessionNumber(
                earliestEntry.createdAt || earliestEntry.updatedAt,
                Date.now(),
              ),
              sessionId: String(earliestEntry.id || "").trim(),
            }
          : null);
      const title =
        trimSessionText(
          (restoreAnchor && restoreAnchor.tabTitle) ||
            latestEntry.tabTitle ||
            latestEntry.title ||
            strings.sessionUntitled,
          CHAT_SESSION_TITLE_LIMIT,
        ) || strings.sessionUntitled;
      sessions.push({
        id: scopeId,
        scopeId,
        title,
        preview: latestEntry.preview || "",
        createdAt: normalizeSessionNumber(
          (restoreAnchor && restoreAnchor.createdAt) ||
            earliestEntry.createdAt ||
            earliestEntry.updatedAt,
          Date.now(),
        ),
        updatedAt: normalizeSessionNumber(latestEntry.updatedAt, Date.now()),
        sessionCount: normalizedEntries.length,
        messageCount: normalizedEntries.reduce(function (total, entry) {
          return total + Math.max(0, Number(entry.messageCount) || 0);
        }, 0),
        mode: normalizeSessionMode(latestEntry.mode),
        selectedModel: trimSessionText(
          latestEntry.selectedModel || "",
          CHAT_SESSION_TITLE_LIMIT,
        ),
        currentUrl: trimSessionText(latestEntry.currentUrl || "", 240),
        domain: trimSessionText(
          (restoreAnchor && restoreAnchor.domain) ||
            earliestEntry.domain ||
            latestEntry.domain ||
            "",
          CHAT_SESSION_TITLE_LIMIT,
        ),
        tabTitle: trimSessionText(latestEntry.tabTitle || "", 120),
        anchorUrl: trimSessionText(
          (restoreAnchor && restoreAnchor.currentUrl) ||
            earliestEntry.currentUrl ||
            latestEntry.currentUrl ||
            "",
          240,
        ),
        anchorTabTitle: trimSessionText(
          (restoreAnchor && restoreAnchor.tabTitle) ||
            earliestEntry.tabTitle ||
            "",
          120,
        ),
        latestSessionId: String(latestEntry.id || "").trim(),
        entries: normalizedEntries.slice(),
      });
    });
    sessions.sort(function (left, right) {
      return right.updatedAt - left.updatedAt;
    });
    return {
      sessions,
      totalCount: sessions.length,
    };
  }
  async function deleteLocalSessionEntry(session) {
    const scopeId = normalizeSessionScopeId(session?.scopeId);
    const prefix = chatScopeStoragePrefix(scopeId);
    if (!scopeId || !prefix) {
      return;
    }
    const stored = await chrome.storage.local.get(null);
    const removeKeys = Object.keys(stored || {}).filter(function (key) {
      return String(key || "").startsWith(prefix);
    });
    await chrome.storage.local.remove(removeKeys.filter(Boolean));
  }
  async function readLocalSessionSnapshot(scopeId, sessionId, strings) {
    const normalizedScopeId = normalizeSessionScopeId(scopeId);
    const normalizedSessionId = String(sessionId || "").trim();
    const sessionKey = chatSessionStorageKey(
      normalizedScopeId,
      normalizedSessionId,
    );
    if (!normalizedScopeId || !normalizedSessionId || !sessionKey) {
      return null;
    }
    const stored = await chrome.storage.local.get(sessionKey);
    return normalizeLocalSessionSnapshot(stored[sessionKey], strings);
  }
  function setStatus(node, kind, message) {
    node.dataset.kind = kind || "";
    if (node.classList.contains("cp-page-meta")) {
      node.dataset.tone =
        kind === "success"
          ? "ready"
          : kind === "error"
            ? "error"
            : kind === "loading"
              ? "loading"
              : "";
    }
    node.textContent = message || "";
  }
  async function saveConfig(next, state) {
    return saveProviderProfile(next, {
      profileId: state.editingProfileId || undefined,
    });
  }
  function getActiveTab() {
    const hash = String(window.location.hash || "").replace(/^#/, "");
    return (hash.split("?")[0] || "permissions").toLowerCase();
  }
  function getHashQuery() {
    const hash = String(window.location.hash || "").replace(/^#/, "");
    const parts = hash.split("?");
    return new URLSearchParams(parts[1] || "");
  }
  function isOptionsTabActive() {
    return getActiveTab() === "options";
  }
  function getCustomSubview() {
    if (!isOptionsTabActive()) {
      return "";
    }
    const customSubview = String(getHashQuery().get("cpSubview") || "")
      .trim()
      .toLowerCase();
    const value = String(getHashQuery().get("provider") || "")
      .trim()
      .toLowerCase();
    if (customSubview === "workflow" || customSubview === "workflows") {
      return "workflow";
    }
    if (value === "prompt" || value === "prompts") {
      return "prompt";
    }
    if (value === "session" || value === "sessions") {
      return "session";
    }
    if (value === "true" || value === "provider") {
      return "provider";
    }
    return "";
  }
  function isProviderViewActive() {
    return getCustomSubview() === "provider";
  }
  function isWorkflowViewActive() {
    return getCustomSubview() === "workflow";
  }
  function isSessionViewActive() {
    return getCustomSubview() === "session";
  }
  function isPromptViewActive() {
    return getCustomSubview() === "prompt";
  }
  function setCustomSubview(view) {
    const nextHash =
      view === "provider"
        ? "options?provider=true"
        : view === "workflow"
          ? "options?provider=true&cpSubview=workflow"
          : view === "session"
            ? "options?provider=session"
            : view === "prompt"
              ? "options?provider=prompt"
              : "options";
    if (window.location.hash.replace(/^#/, "") !== nextHash) {
      window.location.hash = nextHash;
    }
  }
  function findSidebarNavList() {
    const navLists = Array.from(document.querySelectorAll("nav ul"));
    return (
      navLists.find(function (node) {
        const text = String(node.textContent || "");
        return text.includes("Options") || text.includes("选项");
      }) || null
    );
  }
  function findOptionsNavItem(list) {
    const items = Array.from((list || findSidebarNavList())?.children || []);
    return (
      items.find(function (node) {
        const text = String(node.textContent || "").trim();
        return text === "Options" || text === "选项";
      }) || null
    );
  }
  function findNavButton(node) {
    if (!node || typeof node.querySelector !== "function") {
      return null;
    }
    return node.querySelector("button, a");
  }
  function isNativeNavButtonActive(button) {
    const className = String(button?.className || "");
    return (
      className.includes("bg-bg-300") && className.includes("text-text-000")
    );
  }
  function getNativeNavButtonClassNames(list, optionsItem) {
    const nativeButtons = Array.from(
      (list || findSidebarNavList())?.children || [],
    )
      .filter(function (node) {
        return (
          node &&
          node.id !== NAV_ITEM_ID &&
          node.id !== WORKFLOW_NAV_ITEM_ID &&
          node.id !== SESSION_NAV_ITEM_ID &&
          node.id !== PROMPT_NAV_ITEM_ID
        );
      })
      .map(findNavButton)
      .filter(Boolean);
    const activeButton =
      nativeButtons.find(isNativeNavButtonActive) ||
      findNavButton(optionsItem) ||
      nativeButtons[0] ||
      null;
    const inactiveButton =
      nativeButtons.find(function (button) {
        return button !== activeButton;
      }) ||
      nativeButtons[0] ||
      activeButton;
    return {
      activeClassName: String(activeButton?.className || ""),
      inactiveClassName: String(
        inactiveButton?.className || activeButton?.className || "",
      ),
    };
  }
  function ensureCustomNavItem(options) {
    const config = options && typeof options === "object" ? options : {};
    const list = config.list;
    const optionsItem = config.optionsItem;
    const optionsButton = config.optionsButton;
    const id = config.id;
    if (!list || !optionsItem || !optionsButton || !id) {
      return null;
    }
    let navItem = document.getElementById(id);
    let button = findNavButton(navItem);
    if (!navItem || !button) {
      if (navItem?.parentNode) {
        navItem.remove();
      }
      navItem = document.createElement("li");
      navItem.id = id;
      button = optionsButton.cloneNode(true);
      button.removeAttribute("href");
      button.type = "button";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        config.onClick?.();
      });
      navItem.appendChild(button);
    }
    const nativeClassNames = getNativeNavButtonClassNames(list, optionsItem);
    const nextClassName = config.active
      ? nativeClassNames.activeClassName
      : nativeClassNames.inactiveClassName;
    if (button.textContent !== config.label) {
      button.textContent = config.label;
    }
    if (nextClassName && button.className !== nextClassName) {
      button.className = nextClassName;
    }
    if (button.type !== "button") {
      button.type = "button";
    }
    return navItem;
  }
  function ensureProviderNavItem(strings) {
    const list = findSidebarNavList();
    const optionsItem = findOptionsNavItem(list);
    if (!list || !optionsItem) {
      return null;
    }
    const optionsButton = findNavButton(optionsItem);
    if (!optionsButton) {
      debugLog(
        "customProvider.nav.no-button",
        {
          hasOptionsItem: !!optionsItem,
        },
        "warn",
      );
      return null;
    }
    const providerActive = isProviderViewActive();
    const workflowActive = isWorkflowViewActive();
    const sessionActive = isSessionViewActive();
    const promptActive = isPromptViewActive();
    const providerNavItem = ensureCustomNavItem({
      list,
      optionsItem,
      optionsButton,
      id: NAV_ITEM_ID,
      label: strings.providerName,
      active: providerActive,
      onClick() {
        debugLog("customProvider.nav.click", {
          currentHash: location.hash,
          target: "provider",
        });
        setCustomSubview("provider");
      },
    });
    const workflowNavItem = ensureCustomNavItem({
      list,
      optionsItem,
      optionsButton,
      id: WORKFLOW_NAV_ITEM_ID,
      label: strings.workflowTitle,
      active: workflowActive,
      onClick() {
        debugLog("customProvider.nav.click", {
          currentHash: location.hash,
          target: "workflow",
        });
        setCustomSubview("workflow");
      },
    });
    const sessionNavItem = ensureCustomNavItem({
      list,
      optionsItem,
      optionsButton,
      id: SESSION_NAV_ITEM_ID,
      label: strings.sessionTitle,
      active: sessionActive,
      onClick() {
        debugLog("customProvider.nav.click", {
          currentHash: location.hash,
          target: "session",
        });
        setCustomSubview("session");
      },
    });
    const promptNavItem = ensureCustomNavItem({
      list,
      optionsItem,
      optionsButton,
      id: PROMPT_NAV_ITEM_ID,
      label: strings.promptTitle,
      active: promptActive,
      onClick() {
        debugLog("customProvider.nav.click", {
          currentHash: location.hash,
          target: "prompt",
        });
        setCustomSubview("prompt");
      },
    });
    const nativeClassNames = getNativeNavButtonClassNames(list, optionsItem);
    if (providerNavItem && optionsItem.nextElementSibling !== providerNavItem) {
      optionsItem.insertAdjacentElement("afterend", providerNavItem);
    }
    if (
      workflowNavItem &&
      providerNavItem?.nextElementSibling !== workflowNavItem
    ) {
      (providerNavItem || optionsItem).insertAdjacentElement(
        "afterend",
        workflowNavItem,
      );
    }
    if (
      sessionNavItem &&
      (workflowNavItem || providerNavItem)?.nextElementSibling !==
        sessionNavItem
    ) {
      (workflowNavItem || providerNavItem || optionsItem).insertAdjacentElement(
        "afterend",
        sessionNavItem,
      );
    }
    if (
      promptNavItem &&
      (workflowNavItem || sessionNavItem || providerNavItem)
        ?.nextElementSibling !== promptNavItem
    ) {
      (
        workflowNavItem ||
        sessionNavItem ||
        providerNavItem ||
        optionsItem
      ).insertAdjacentElement("afterend", promptNavItem);
    }
    const nextInactive =
      providerActive || workflowActive || sessionActive || promptActive;
    if (
      optionsItem.classList.contains("cp-nav-override-inactive") !==
      nextInactive
    ) {
      optionsItem.classList.toggle("cp-nav-override-inactive", nextInactive);
    }
    return {
      providerNavItem,
      workflowNavItem,
      sessionNavItem,
      promptNavItem,
      nativeClassNames,
    };
  }
  function findOptionsContentRoot() {
    const list = findSidebarNavList();
    const nav = list ? list.closest("nav") : null;
    const grid = nav ? nav.parentElement : null;
    if (!grid) {
      return null;
    }
    return (
      Array.from(grid.children).find(function (node) {
        return node !== nav && node && node.nodeType === Node.ELEMENT_NODE;
      }) || null
    );
  }
  function findMountAnchor(id) {
    const node = document.getElementById(id);
    return node && node.nodeType === Node.ELEMENT_NODE ? node : null;
  }
  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) {
      return;
    }
    const style = createNode("style");
    style.id = STYLE_ID;
    style.textContent = styles;
    document.head.appendChild(style);
  }
  function buildUi() {
    if (typeof activeUiCleanup === "function") {
      activeUiCleanup();
      activeUiCleanup = null;
    }
    debugLog("customProvider.buildUi.start", {
      readyState: document.readyState,
      hash: location.hash,
    });
    ensureStyles();
    let localeKey = getUiLocaleKey();
    renderedUiLocaleKey = localeKey;
    let strings = getStrings();
    const providerRoot = createNode("div", "space-y-6");
    providerRoot.id = ROOT_ID;
    const workflowRoot = createNode("div", "space-y-6");
    workflowRoot.id = WORKFLOW_ROOT_ID;
    workflowRoot.hidden = true;
    const debugMountRoot = createNode("div", "space-y-6 mt-6");
    debugMountRoot.id = DEBUG_ROOT_ID;
    const panel = createNode(
      "section",
      "cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    panel.id = PANEL_ID;
    const stack = createNode("div", "cp-page-stack");
    const header = createNode("div", "cp-provider-header");
    header.appendChild(
      createNode(
        "h3",
        "cp-page-heading text-text-100 font-xl-bold",
        strings.providerName,
      ),
    );
    header.appendChild(
      createNode(
        "p",
        "cp-page-subheading text-text-300 font-base",
        strings.subtitle,
      ),
    );
    const headerAction = createNode("div", "cp-provider-header-action");
    const listButtonRow = createNode("div", "cp-page-btn-row");
    const addProfileButton = createNode(
      "button",
      "px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.newProfile,
    );
    addProfileButton.type = "button";
    listButtonRow.appendChild(addProfileButton);
    headerAction.appendChild(listButtonRow);
    header.appendChild(headerAction);
    const listView = createNode("div", "cp-provider-view");
    listView.hidden = false;
    const listStatus = createNode("div", "cp-page-status");
    const emptyState = createNode("div", "cp-provider-empty");
    emptyState.appendChild(
      createNode("h4", "cp-provider-empty-title", strings.emptyProfilesTitle),
    );
    emptyState.appendChild(
      createNode("p", "cp-provider-empty-help", strings.emptyProfilesHelp),
    );
    const profileCardList = createNode("div", "cp-provider-card-list");
    listView.appendChild(listStatus);
    listView.appendChild(emptyState);
    listView.appendChild(profileCardList);
    const editorView = createNode("div", "cp-provider-view");
    editorView.hidden = true;
    const editorToolbar = createNode("div", "cp-provider-editor-toolbar");
    const editorToolbarCopy = createNode("div");
    const editorTitle = createNode(
      "h4",
      "cp-provider-editor-title",
      strings.createProfileTitle,
    );
    editorToolbarCopy.appendChild(editorTitle);
    const backToListButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.backToList,
    );
    backToListButton.type = "button";
    editorToolbar.appendChild(editorToolbarCopy);
    const form = document.createElement("form");
    form.id = "cp-provider-editor-form";
    form.className = "cp-page-stack cp-page-fieldset";
    const providerFormatOptions = [
      ["anthropic", "Anthropic Messages"],
      ["openai_chat", "OpenAI Chat Completions"],
      ["openai_responses", "OpenAI Responses API"],
    ];
    const providerAuthModeOptions = [
      [AUTH_MODE_API_KEY, strings.authModeApiKey],
      [AUTH_MODE_CODEX, strings.authModeCodex],
    ];
    const identityGrid = createNode("div", "cp-page-grid cp-page-grid-2");
    const nameField = createNode("label", "cp-page-field");
    const nameInput = createNode(
      "input",
      `cp-page-input ${SHARED_FRAME_CLASS}`,
    );
    nameInput.placeholder = strings.providerNamePlaceholder;
    nameField.appendChild(
      createNode("span", "cp-page-label", strings.providerNameLabel),
    );
    nameField.appendChild(nameInput);
    const formatField = createNode("label", "cp-page-field");
    const formatSelect = createNode(
      "select",
      `cp-page-select ${SHARED_FRAME_CLASS}`,
    );
    providerFormatOptions.forEach(function (option) {
      const node = document.createElement("option");
      node.value = option[0];
      node.textContent = option[1];
      formatSelect.appendChild(node);
    });
    formatField.appendChild(
      createNode("span", "cp-page-label", strings.providerFormatLabel),
    );
    formatField.appendChild(formatSelect);
    const authModeField = createNode("label", "cp-page-field");
    const authModeSelect = createNode(
      "select",
      `cp-page-select ${SHARED_FRAME_CLASS}`,
    );
    providerAuthModeOptions.forEach(function (option) {
      const node = document.createElement("option");
      node.value = option[0];
      node.textContent = option[1];
      authModeSelect.appendChild(node);
    });
    authModeField.appendChild(
      createNode("span", "cp-page-label", strings.authModeLabel),
    );
    authModeField.appendChild(authModeSelect);
    identityGrid.appendChild(nameField);
    identityGrid.appendChild(formatField);
    identityGrid.appendChild(authModeField);
    const baseUrlField = createNode("label", "cp-page-field");
    const baseUrlInput = createNode(
      "input",
      `cp-page-input cp-page-input-mono ${SHARED_FRAME_CLASS}`,
    );
    baseUrlInput.placeholder = strings.baseUrlPlaceholder;
    const requestPreview = createNode(
      "div",
      "cp-page-url-preview",
      strings.requestUrlPrefix + "/messages",
    );
    requestPreview.dataset.empty = "true";
    baseUrlField.appendChild(
      createNode("span", "cp-page-label", strings.baseUrlLabel),
    );
    baseUrlField.appendChild(baseUrlInput);
    baseUrlField.appendChild(requestPreview);
    const apiKeyField = createNode("label", "cp-page-field");
    const apiKeyShell = createNode(
      "div",
      `cp-page-input-shell ${SHARED_FRAME_CLASS}`,
    );
    const apiKeyInput = createNode("input", "cp-page-input cp-page-input-mono");
    apiKeyInput.type = "password";
    apiKeyInput.placeholder = strings.apiKeyPlaceholder;
    const apiKeyToggle = createNode("button", "cp-page-visibility-btn");
    apiKeyToggle.type = "button";
    function setApiKeyVisibility(visible) {
      apiKeyInput.type = visible ? "text" : "password";
      const label = visible ? strings.hideApiKey : strings.showApiKey;
      apiKeyToggle.setAttribute("aria-label", label);
      apiKeyToggle.title = label;
      apiKeyToggle.dataset.visible = visible ? "true" : "false";
      apiKeyToggle.innerHTML = getApiKeyVisibilityIconMarkup(visible);
    }
    setApiKeyVisibility(false);
    apiKeyToggle.addEventListener("click", function () {
      setApiKeyVisibility(apiKeyInput.type === "password");
      apiKeyInput.focus({
        preventScroll: true,
      });
    });
    const apiKeyLabel = createNode("span", "cp-page-label", strings.apiKeyLabel);
    apiKeyField.appendChild(apiKeyLabel);
    apiKeyShell.appendChild(apiKeyInput);
    apiKeyShell.appendChild(apiKeyToggle);
    apiKeyField.appendChild(apiKeyShell);
    const modelField = createNode(
      "div",
      "cp-page-field cp-provider-summary-item cp-provider-editor-field cp-provider-editor-model-field",
    );
    modelField.dataset.field = "model";
    const pickerLabelRow = createNode("div", "cp-page-label-row");
    pickerLabelRow.appendChild(
      createNode("span", "cp-page-label", strings.defaultModelLabel),
    );
    const modelMeta = createNode(
      "span",
      "cp-page-meta",
      strings.fetchedModelsHint,
    );
    pickerLabelRow.appendChild(modelMeta);
    const modelControlRow = createNode("div", "cp-model-control-row");
    const modelSelect = createNode(
      "select",
      `cp-page-select ${SHARED_FRAME_CLASS}`,
    );
    const modelActionGroup = createNode("div", "cp-model-action-group");
    const fetchModelsButton = createNode(
      "button",
      "cp-model-action-btn cp-model-action-btn-main px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.fetchModels,
    );
    fetchModelsButton.type = "button";
    const addModelButton = createNode(
      "button",
      "cp-model-action-btn cp-model-action-btn-add px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.manualAddModelTitle,
    );
    addModelButton.type = "button";
    addModelButton.setAttribute("aria-label", strings.addModelAria);
    const healthCheckButton = createNode(
      "button",
      "cp-model-action-btn cp-model-action-btn-main px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.healthCheck,
    );
    healthCheckButton.type = "button";
    modelActionGroup.appendChild(fetchModelsButton);
    modelActionGroup.appendChild(addModelButton);
    modelActionGroup.appendChild(healthCheckButton);
    modelField.appendChild(pickerLabelRow);
    modelControlRow.appendChild(modelSelect);
    modelField.appendChild(modelControlRow);
    const fastModelField = createNode(
      "div",
      "cp-page-field cp-provider-summary-item cp-provider-editor-field",
    );
    fastModelField.dataset.field = "fastModel";
    const fastModelLabelRow = createNode("div", "cp-page-label-row");
    const fastModelSelect = createNode(
      "select",
      `cp-page-select ${SHARED_FRAME_CLASS}`,
    );
    fastModelLabelRow.appendChild(
      createNode("span", "cp-page-label", strings.fastModelLabel),
    );
    const fastModelMeta = createNode(
      "span",
      "cp-page-meta",
      strings.fastModelHelp,
    );
    fastModelLabelRow.appendChild(fastModelMeta);
    fastModelSelect.title = strings.fastModelLabel;
    fastModelField.appendChild(fastModelLabelRow);
    fastModelField.appendChild(fastModelSelect);
    const reasoningField = createNode(
      "label",
      "cp-page-field cp-provider-summary-item cp-provider-editor-field",
    );
    reasoningField.dataset.field = "reasoning";
    const reasoningSelect = createNode(
      "select",
      `cp-page-select ${SHARED_FRAME_CLASS}`,
    );
    reasoningSelect.title = strings.reasoningEffortLabel;
    reasoningField.appendChild(
      createNode("span", "cp-page-label", strings.reasoningEffortLabel),
    );
    reasoningField.appendChild(reasoningSelect);
    const contextWindowField = createNode(
      "div",
      "cp-page-field cp-provider-summary-item cp-provider-editor-field",
    );
    contextWindowField.dataset.field = "contextWindow";
    const contextWindowLabelRow = createNode("div", "cp-page-label-row");
    contextWindowLabelRow.appendChild(
      createNode("span", "cp-page-label", strings.contextWindowLabel),
    );
    const contextWindowShell = createNode(
      "div",
      `cp-page-input-shell cp-context-window-shell ${SHARED_FRAME_CLASS}`,
    );
    const contextWindowValue = createNode("div", "cp-context-window-value");
    const contextWindowInput = createNode(
      "input",
      "cp-page-input cp-page-input-mono cp-context-window-input",
    );
    const contextWindowStepper = createNode("div", "cp-context-window-stepper");
    const contextWindowStepUp = createNode(
      "button",
      "cp-context-window-step-btn",
      "▴",
    );
    const contextWindowStepDown = createNode(
      "button",
      "cp-context-window-step-btn",
      "▾",
    );
    contextWindowInput.type = "text";
    contextWindowInput.inputMode = "numeric";
    contextWindowInput.placeholder = strings.contextWindowPlaceholder;
    contextWindowInput.setAttribute("aria-label", strings.contextWindowLabel);
    contextWindowInput.title = strings.contextWindowLabel;
    contextWindowInput.autocomplete = "off";
    contextWindowInput.spellcheck = false;
    contextWindowStepUp.type = "button";
    contextWindowStepDown.type = "button";
    contextWindowStepUp.setAttribute(
      "aria-label",
      `${strings.contextWindowLabel} +${CONTEXT_WINDOW_STEP_K}k`,
    );
    contextWindowStepDown.setAttribute(
      "aria-label",
      `${strings.contextWindowLabel} -${CONTEXT_WINDOW_STEP_K}k`,
    );
    appendReasoningEffortOptions(reasoningSelect);
    contextWindowField.appendChild(contextWindowLabelRow);
    contextWindowValue.appendChild(contextWindowInput);
    contextWindowShell.appendChild(contextWindowValue);
    contextWindowStepper.appendChild(contextWindowStepUp);
    contextWindowStepper.appendChild(contextWindowStepDown);
    contextWindowShell.appendChild(contextWindowStepper);
    contextWindowField.appendChild(contextWindowShell);
    const maxOutputTokensField = createNode(
      "label",
      "cp-page-field cp-provider-summary-item cp-provider-editor-field",
    );
    maxOutputTokensField.dataset.field = "maxOutputTokens";
    const maxOutputTokensInput = createNode(
      "input",
      `cp-page-input cp-page-input-mono ${SHARED_FRAME_CLASS}`,
    );
    maxOutputTokensInput.type = "text";
    maxOutputTokensInput.inputMode = "numeric";
    maxOutputTokensInput.placeholder = strings.maxOutputTokensPlaceholder;
    maxOutputTokensInput.setAttribute(
      "aria-label",
      strings.maxOutputTokensLabel,
    );
    maxOutputTokensInput.title = strings.maxOutputTokensLabel;
    maxOutputTokensInput.autocomplete = "off";
    maxOutputTokensInput.spellcheck = false;
    maxOutputTokensField.appendChild(
      createNode("span", "cp-page-label", strings.maxOutputTokensLabel),
    );
    maxOutputTokensField.appendChild(maxOutputTokensInput);
    const primaryModelGrid = createNode(
      "div",
      "cp-provider-summary-row cp-provider-editor-primary-row",
    );
    primaryModelGrid.dataset.columns = "2";
    primaryModelGrid.appendChild(modelField);
    primaryModelGrid.appendChild(fastModelField);
    const tokenControlsGrid = createNode("div", "cp-provider-summary-row");
    tokenControlsGrid.dataset.columns = "3";
    tokenControlsGrid.appendChild(reasoningField);
    tokenControlsGrid.appendChild(contextWindowField);
    tokenControlsGrid.appendChild(maxOutputTokensField);
    const modelActionsRow = createNode("div", "cp-provider-editor-action-row");
    modelActionsRow.appendChild(modelActionGroup);
    const saveButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.saveAndApply,
    );
    saveButton.type = "submit";
    saveButton.setAttribute("form", form.id);
    const editorFloatingShell = createNode("div", "cp-provider-floating-shell");
    editorFloatingShell.hidden = true;
    const editorFloatingCapsule = createNode(
      "div",
      `cp-provider-floating-capsule ${SHARED_FRAME_CLASS}`,
    );
    editorFloatingCapsule.appendChild(backToListButton);
    editorFloatingCapsule.appendChild(saveButton);
    editorFloatingShell.appendChild(editorFloatingCapsule);
    const manualModelOverlay = createNode("div", "cp-modal-backdrop");
    manualModelOverlay.hidden = true;
    const manualModelCard = createNode(
      "div",
      "cp-page-card cp-modal-card bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    const manualModelStack = createNode("div", "cp-page-stack");
    const manualModelHeader = createNode("div");
    manualModelHeader.appendChild(
      createNode(
        "h3",
        "cp-page-heading text-text-100 font-xl-bold",
        strings.manualAddModelTitle,
      ),
    );
    manualModelHeader.appendChild(
      createNode(
        "p",
        "cp-page-subheading text-text-300 font-base",
        strings.manualAddModelSubtitle,
      ),
    );
    const manualModelField = createNode("label", "cp-page-field");
    const manualModelInput = createNode(
      "input",
      `cp-page-input cp-page-input-mono ${SHARED_FRAME_CLASS}`,
    );
    manualModelInput.placeholder = strings.manualModelIdPlaceholder;
    manualModelField.appendChild(
      createNode("span", "cp-page-label", strings.manualModelIdLabel),
    );
    manualModelField.appendChild(manualModelInput);
    const manualModelAliasField = createNode("label", "cp-page-field");
    const manualModelAliasInput = createNode(
      "input",
      `cp-page-input ${SHARED_FRAME_CLASS}`,
    );
    manualModelAliasInput.placeholder = strings.manualModelAliasPlaceholder;
    manualModelAliasField.appendChild(
      createNode("span", "cp-page-label", strings.manualModelAliasLabel),
    );
    manualModelAliasField.appendChild(manualModelAliasInput);
    const manualModelStatus = createNode("div", "cp-page-status");
    const manualModelActions = createNode("div", "cp-modal-actions");
    const manualModelCancelButton = createNode(
      "button",
      "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.cancelAction,
    );
    manualModelCancelButton.type = "button";
    const manualModelConfirmButton = createNode(
      "button",
      "px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.manualAddConfirm,
    );
    manualModelConfirmButton.type = "button";
    manualModelActions.appendChild(manualModelCancelButton);
    manualModelActions.appendChild(manualModelConfirmButton);
    manualModelStack.appendChild(manualModelHeader);
    manualModelStack.appendChild(manualModelField);
    manualModelStack.appendChild(manualModelAliasField);
    manualModelStack.appendChild(manualModelStatus);
    manualModelStack.appendChild(manualModelActions);
    manualModelCard.appendChild(manualModelStack);
    manualModelOverlay.appendChild(manualModelCard);
    form.appendChild(identityGrid);
    form.appendChild(baseUrlField);
    form.appendChild(apiKeyField);
    form.appendChild(primaryModelGrid);
    form.appendChild(tokenControlsGrid);
    form.appendChild(modelActionsRow);
    stack.appendChild(header);
    editorView.appendChild(editorToolbar);
    editorView.appendChild(form);
    stack.appendChild(listView);
    stack.appendChild(editorView);
    panel.appendChild(stack);
    const workflowPanel = createNode(
      "section",
      "cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    const workflowStack = createNode("div", "cp-page-stack");
    const workflowHeader = createNode("div", "cp-provider-header");
    workflowHeader.appendChild(
      createNode(
        "h3",
        "cp-page-heading text-text-100 font-xl-bold",
        strings.workflowTitle,
      ),
    );
    workflowHeader.appendChild(
      createNode(
        "p",
        "cp-page-subheading text-text-300 font-base",
        strings.workflowSubtitle,
      ),
    );
    const workflowHeaderAction = createNode("div", "cp-provider-header-action");
    const workflowHeaderButtons = createNode(
      "div",
      "cp-page-btn-row cp-workflow-header-actions",
    );
    const addWorkflowButton = createNode(
      "button",
      "px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.workflowNew,
    );
    addWorkflowButton.type = "button";
    const importWorkflowButton = createNode(
      "button",
      `cp-page-btn cp-page-btn-quiet ${SHARED_FRAME_CLASS}`,
      strings.workflowImport,
    );
    importWorkflowButton.type = "button";
    const exportAllWorkflowsButton = createNode(
      "button",
      `cp-page-btn cp-page-btn-quiet ${SHARED_FRAME_CLASS}`,
      strings.workflowExportAll,
    );
    exportAllWorkflowsButton.type = "button";
    workflowHeaderButtons.appendChild(addWorkflowButton);
    workflowHeaderButtons.appendChild(importWorkflowButton);
    workflowHeaderButtons.appendChild(exportAllWorkflowsButton);
    workflowHeaderAction.appendChild(workflowHeaderButtons);
    workflowHeader.appendChild(workflowHeaderAction);
    const workflowSummaryMeta = createNode("div", "cp-page-meta");
    const workflowListStatus = createNode("div", "cp-page-status");
    const workflowListView = createNode("div", "cp-provider-view");
    const workflowEmptyState = createNode("div", "cp-provider-empty");
    workflowEmptyState.appendChild(
      createNode("h4", "cp-provider-empty-title", strings.workflowEmptyTitle),
    );
    workflowEmptyState.appendChild(
      createNode("p", "cp-provider-empty-help", strings.workflowEmptyHelp),
    );
    const workflowCardList = createNode("div", "cp-provider-card-list");
    workflowListView.appendChild(workflowListStatus);
    workflowListView.appendChild(workflowEmptyState);
    workflowListView.appendChild(workflowCardList);
    const workflowEditorView = createNode("div", "cp-provider-view");
    workflowEditorView.hidden = true;
    const workflowEditorToolbar = createNode(
      "div",
      "cp-provider-editor-toolbar",
    );
    const workflowEditorToolbarCopy = createNode("div");
    const workflowEditorTitle = createNode(
      "h4",
      "cp-provider-editor-title",
      strings.workflowCreateTitle,
    );
    const workflowEditorHelp = createNode(
      "p",
      "cp-provider-editor-help",
      strings.workflowJsonHelp,
    );
    workflowEditorToolbarCopy.appendChild(workflowEditorTitle);
    workflowEditorToolbarCopy.appendChild(workflowEditorHelp);
    const workflowBackButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.backToList,
    );
    workflowBackButton.type = "button";
    workflowEditorToolbar.appendChild(workflowEditorToolbarCopy);
    const workflowForm = document.createElement("form");
    workflowForm.id = "cp-workflow-editor-form";
    workflowForm.className = "cp-page-stack cp-page-fieldset";
    const workflowJsonField = createNode("label", "cp-page-field");
    const workflowJsonLabelRow = createNode("div", "cp-page-label-row");
    workflowJsonLabelRow.appendChild(
      createNode("span", "cp-page-label", strings.workflowJsonLabel),
    );
    workflowJsonLabelRow.appendChild(
      createNode("span", "cp-page-help", strings.workflowJsonHelp),
    );
    const workflowJsonTextarea = createNode(
      "textarea",
      `cp-page-textarea cp-workflow-json-textarea ${SHARED_FRAME_CLASS}`,
    );
    workflowJsonTextarea.placeholder = strings.workflowJsonPlaceholder;
    workflowJsonTextarea.spellcheck = false;
    workflowJsonTextarea.wrap = "off";
    workflowJsonField.appendChild(workflowJsonLabelRow);
    workflowJsonField.appendChild(workflowJsonTextarea);
    const workflowStatus = createNode("div", "cp-page-status");
    const workflowFormatButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.workflowFormatJson,
    );
    workflowFormatButton.type = "button";
    const workflowSaveButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.workflowSave,
    );
    workflowSaveButton.type = "submit";
    workflowSaveButton.setAttribute("form", workflowForm.id);
    const workflowFloatingShell = createNode(
      "div",
      "cp-provider-floating-shell",
    );
    workflowFloatingShell.hidden = true;
    const workflowFloatingCapsule = createNode(
      "div",
      `cp-provider-floating-capsule ${SHARED_FRAME_CLASS}`,
    );
    workflowFloatingCapsule.appendChild(workflowBackButton);
    workflowFloatingCapsule.appendChild(workflowFormatButton);
    workflowFloatingCapsule.appendChild(workflowSaveButton);
    workflowFloatingShell.appendChild(workflowFloatingCapsule);
    workflowForm.appendChild(workflowJsonField);
    workflowForm.appendChild(workflowStatus);
    workflowEditorView.appendChild(workflowEditorToolbar);
    workflowEditorView.appendChild(workflowForm);
    workflowStack.appendChild(workflowHeader);
    workflowStack.appendChild(workflowSummaryMeta);
    workflowStack.appendChild(workflowListView);
    workflowStack.appendChild(workflowEditorView);
    workflowPanel.appendChild(workflowStack);
    workflowRoot.appendChild(workflowPanel);
    workflowRoot.appendChild(workflowFloatingShell);
    const sessionRoot = createNode("div", "space-y-6");
    sessionRoot.id = SESSION_ROOT_ID;
    const sessionPanel = createNode(
      "section",
      "cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    const sessionStack = createNode("div", "cp-page-stack");
    const sessionHeader = createNode("div", "cp-provider-header");
    sessionHeader.appendChild(
      createNode(
        "h3",
        "cp-page-heading text-text-100 font-xl-bold",
        strings.sessionTitle,
      ),
    );
    sessionHeader.appendChild(
      createNode(
        "p",
        "cp-page-subheading text-text-300 font-base",
        strings.sessionSubtitle,
      ),
    );
    const sessionHeaderAction = createNode("div", "cp-provider-header-action");
    const sessionHeaderButtons = createNode("div", "cp-page-btn-row");
    const refreshSessionsButton = createNode(
      "button",
      `cp-page-btn cp-page-btn-quiet ${SHARED_FRAME_CLASS}`,
      strings.sessionRefresh,
    );
    refreshSessionsButton.type = "button";
    sessionHeaderButtons.appendChild(refreshSessionsButton);
    sessionHeaderAction.appendChild(sessionHeaderButtons);
    sessionHeader.appendChild(sessionHeaderAction);
    const sessionSummaryMeta = createNode("div", "cp-page-meta");
    const sessionListStatus = createNode("div", "cp-page-status");
    const sessionEmptyState = createNode("div", "cp-provider-empty");
    sessionEmptyState.appendChild(
      createNode("h4", "cp-provider-empty-title", strings.sessionEmptyTitle),
    );
    sessionEmptyState.appendChild(
      createNode("p", "cp-provider-empty-help", strings.sessionEmptyHelp),
    );
    const sessionCardList = createNode("div", "cp-provider-card-list");
    const sessionBrowserOverlay = createNode("div", "cp-modal-backdrop");
    sessionBrowserOverlay.hidden = true;
    const sessionBrowserCard = createNode(
      "div",
      "cp-page-card cp-modal-card cp-session-modal-card bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    sessionBrowserCard.setAttribute("role", "dialog");
    sessionBrowserCard.setAttribute("aria-modal", "true");
    sessionBrowserCard.setAttribute("aria-label", strings.sessionHistoryTitle);
    sessionBrowserCard.tabIndex = -1;
    const sessionBrowserView = createNode(
      "div",
      "cp-provider-view cp-session-modal-view",
    );
    sessionBrowserView.hidden = true;
    const sessionBrowserToolbar = createNode(
      "div",
      "cp-provider-editor-toolbar",
    );
    const sessionBrowserToolbarCopy = createNode(
      "div",
      "cp-session-browser-copy",
    );
    const sessionBrowserTitle = createNode(
      "h4",
      "cp-provider-editor-title",
      strings.sessionHistoryTitle,
    );
    const sessionBrowserHelp = createNode(
      "p",
      "cp-provider-editor-help",
      strings.sessionHistorySubtitle,
    );
    sessionBrowserToolbarCopy.appendChild(sessionBrowserTitle);
    sessionBrowserToolbarCopy.appendChild(sessionBrowserHelp);
    const sessionBrowserBackButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.backToList,
    );
    sessionBrowserBackButton.type = "button";
    sessionBrowserToolbar.appendChild(sessionBrowserToolbarCopy);
    sessionBrowserToolbar.appendChild(sessionBrowserBackButton);
    const sessionBrowserScroll = createNode("div", "cp-session-modal-scroll");
    const sessionBrowserStatus = createNode("div", "cp-page-status");
    const sessionHistoryEmptyState = createNode(
      "div",
      "cp-provider-empty cp-session-history-empty",
    );
    sessionHistoryEmptyState.appendChild(
      createNode("h4", "cp-provider-empty-title", strings.sessionEmptyTitle),
    );
    sessionHistoryEmptyState.appendChild(
      createNode("p", "cp-provider-empty-help", strings.sessionHistorySubtitle),
    );
    const sessionHistoryCardList = createNode("div", "cp-provider-card-list");
    const sessionRecordView = createNode("div", "cp-provider-view");
    sessionRecordView.hidden = true;
    const sessionRecordList = createNode("div", "cp-session-record-list");
    const sessionRecordEmptyState = createNode(
      "div",
      "cp-provider-empty cp-session-history-empty",
    );
    sessionRecordEmptyState.hidden = true;
    sessionRecordEmptyState.appendChild(
      createNode("h4", "cp-provider-empty-title", strings.sessionRecordEmpty),
    );
    sessionRecordView.appendChild(sessionRecordList);
    sessionRecordView.appendChild(sessionRecordEmptyState);
    sessionBrowserView.appendChild(sessionBrowserToolbar);
    sessionBrowserScroll.appendChild(sessionBrowserStatus);
    sessionBrowserScroll.appendChild(sessionHistoryEmptyState);
    sessionBrowserScroll.appendChild(sessionHistoryCardList);
    sessionBrowserScroll.appendChild(sessionRecordView);
    sessionBrowserView.appendChild(sessionBrowserScroll);
    sessionBrowserOverlay.appendChild(sessionBrowserCard);
    sessionStack.appendChild(sessionHeader);
    sessionStack.appendChild(sessionSummaryMeta);
    sessionStack.appendChild(sessionListStatus);
    sessionStack.appendChild(sessionEmptyState);
    sessionStack.appendChild(sessionCardList);
    sessionStack.appendChild(sessionBrowserView);
    sessionPanel.appendChild(sessionStack);
    sessionRoot.appendChild(sessionPanel);
    const promptRoot = createNode("div", "space-y-6");
    promptRoot.id = PROMPT_ROOT_ID;
    const promptPanel = createNode(
      "section",
      "cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    const promptStack = createNode("div", "cp-page-stack");
    const promptHeader = createNode("div", "cp-provider-header");
    promptHeader.appendChild(
      createNode(
        "h3",
        "cp-page-heading text-text-100 font-xl-bold",
        strings.promptTitle,
      ),
    );
    promptHeader.appendChild(
      createNode(
        "p",
        "cp-page-subheading text-text-300 font-base",
        strings.promptSubtitle,
      ),
    );
    const promptHeaderAction = createNode("div", "cp-provider-header-action");
    const promptHeaderButtons = createNode("div", "cp-page-btn-row");
    const addPromptProfileButton = createNode(
      "button",
      "px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.newProfile,
    );
    addPromptProfileButton.type = "button";
    promptHeaderButtons.appendChild(addPromptProfileButton);
    promptHeaderAction.appendChild(promptHeaderButtons);
    promptHeader.appendChild(promptHeaderAction);
    const promptListView = createNode("div", "cp-provider-view");
    const promptListStatus = createNode("div", "cp-page-status");
    const promptEmptyState = createNode("div", "cp-provider-empty");
    promptEmptyState.appendChild(
      createNode(
        "h4",
        "cp-provider-empty-title",
        strings.promptEmptyProfilesTitle,
      ),
    );
    promptEmptyState.appendChild(
      createNode(
        "p",
        "cp-provider-empty-help",
        strings.promptEmptyProfilesHelp,
      ),
    );
    const promptCardList = createNode("div", "cp-provider-card-list");
    promptListView.appendChild(promptListStatus);
    promptListView.appendChild(promptEmptyState);
    promptListView.appendChild(promptCardList);
    const promptEditorView = createNode("div", "cp-provider-view");
    promptEditorView.hidden = true;
    const promptEditorToolbar = createNode("div", "cp-provider-editor-toolbar");
    const promptEditorToolbarCopy = createNode("div");
    const promptEditorTitle = createNode(
      "h4",
      "cp-provider-editor-title",
      strings.promptCreateTitle,
    );
    promptEditorToolbarCopy.appendChild(promptEditorTitle);
    const promptBackButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.backToList,
    );
    promptBackButton.type = "button";
    promptEditorToolbar.appendChild(promptEditorToolbarCopy);
    const promptForm = document.createElement("form");
    promptForm.id = "cp-prompt-editor-form";
    promptForm.className = "cp-page-stack cp-page-fieldset";
    const promptNameField = createNode("label", "cp-page-field");
    const promptNameInput = createNode(
      "input",
      `cp-page-input ${SHARED_FRAME_CLASS}`,
    );
    promptNameInput.placeholder = strings.promptProfileNamePlaceholder;
    promptNameField.appendChild(
      createNode("span", "cp-page-label", strings.promptProfileNameLabel),
    );
    promptNameField.appendChild(promptNameInput);
    const promptField = createNode("label", "cp-page-field");
    const promptLabelRow = createNode("div", "cp-page-label-row");
    const promptTextarea = createNode(
      "textarea",
      `cp-page-textarea cp-prompt-textarea ${SHARED_FRAME_CLASS}`,
    );
    promptTextarea.placeholder = strings.agentRolePlaceholder;
    promptTextarea.spellcheck = false;
    promptTextarea.wrap = "soft";
    promptLabelRow.appendChild(
      createNode("span", "cp-page-label", strings.agentRoleLabel),
    );
    promptLabelRow.appendChild(
      createNode("span", "cp-page-help", strings.agentRoleHelp),
    );
    promptField.appendChild(promptLabelRow);
    promptField.appendChild(promptTextarea);
    const promptStatus = createNode("div", "cp-page-status");
    const promptSaveButton = createNode(
      "button",
      "cp-provider-floating-btn px-6 py-3 bg-brand-100 text-oncolor-100 rounded-xl hover:bg-brand-100/90 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
      strings.promptSave,
    );
    promptSaveButton.type = "submit";
    promptSaveButton.setAttribute("form", promptForm.id);
    const promptFloatingShell = createNode("div", "cp-provider-floating-shell");
    promptFloatingShell.hidden = true;
    const promptFloatingCapsule = createNode(
      "div",
      `cp-provider-floating-capsule ${SHARED_FRAME_CLASS}`,
    );
    promptFloatingCapsule.appendChild(promptBackButton);
    promptFloatingCapsule.appendChild(promptSaveButton);
    promptFloatingShell.appendChild(promptFloatingCapsule);
    promptForm.appendChild(promptNameField);
    promptForm.appendChild(promptField);
    promptForm.appendChild(promptStatus);
    promptEditorView.appendChild(promptEditorToolbar);
    promptEditorView.appendChild(promptForm);
    promptStack.appendChild(promptHeader);
    promptStack.appendChild(promptListView);
    promptStack.appendChild(promptEditorView);
    promptPanel.appendChild(promptStack);
    promptRoot.appendChild(promptPanel);
    promptRoot.appendChild(promptFloatingShell);
    const debugPanel = createNode(
      "section",
      "cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
    );
    const debugStack = createNode("div", "cp-page-stack");
    const debugHeader = createNode("div");
    debugHeader.appendChild(
      createNode(
        "h3",
        "cp-page-heading text-text-100 font-xl-bold",
        strings.debugTitle,
      ),
    );
    debugHeader.appendChild(
      createNode(
        "p",
        "cp-page-subheading text-text-300 font-base",
        strings.debugSubtitle,
      ),
    );
    const createToggleMetaNode = function () {
      const metaNode = createNode("div", "cp-page-meta");
      metaNode.hidden = true;
      metaNode.setAttribute("aria-hidden", "true");
      return metaNode;
    };
    const debugModeRow = createNode("div", "cp-page-row");
    const debugModeCopy = createNode("div", "cp-page-row-copy");
    debugModeCopy.appendChild(
      createNode("div", "cp-page-row-title", strings.debugToggleTitle),
    );
    debugModeCopy.appendChild(
      createNode("p", "cp-page-row-help", strings.debugToggleHelp),
    );
    const debugModeControl = createNode(
      "div",
      "cp-update-enhancer-row-control",
    );
    const debugModeMeta = createToggleMetaNode();
    const debugModeToggle = createNode(
      "button",
      "cp-page-toggle cp-update-enhancer-toggle",
    );
    debugModeToggle.type = "button";
    debugModeToggle.style.pointerEvents = "auto";
    debugModeToggle.setAttribute("role", "switch");
    debugModeToggle.setAttribute("aria-checked", "false");
    debugModeToggle.setAttribute("aria-label", strings.debugToggleAria);
    debugModeToggle.title = strings.debugToggleTitle;
    debugModeControl.appendChild(debugModeMeta);
    debugModeControl.appendChild(debugModeToggle);
    debugModeRow.appendChild(debugModeCopy);
    debugModeRow.appendChild(debugModeControl);
    const toolResultDetailsRow = createNode("div", "cp-page-row");
    const toolResultDetailsCopy = createNode("div", "cp-page-row-copy");
    toolResultDetailsCopy.appendChild(
      createNode("div", "cp-page-row-title", strings.toolResultDetailsTitle),
    );
    toolResultDetailsCopy.appendChild(
      createNode("p", "cp-page-row-help", strings.toolResultDetailsHelp),
    );
    const toolResultDetailsControl = createNode(
      "div",
      "cp-update-enhancer-row-control",
    );
    const toolResultDetailsMeta = createToggleMetaNode();
    const toolResultDetailsToggle = createNode(
      "button",
      "cp-page-toggle cp-update-enhancer-toggle",
    );
    toolResultDetailsToggle.type = "button";
    toolResultDetailsToggle.style.pointerEvents = "auto";
    toolResultDetailsToggle.setAttribute("role", "switch");
    toolResultDetailsToggle.setAttribute("aria-checked", "false");
    toolResultDetailsToggle.setAttribute(
      "aria-label",
      strings.toolResultDetailsTitle,
    );
    toolResultDetailsToggle.title = strings.toolResultDetailsTitle;
    toolResultDetailsControl.appendChild(toolResultDetailsMeta);
    toolResultDetailsControl.appendChild(toolResultDetailsToggle);
    toolResultDetailsRow.appendChild(toolResultDetailsCopy);
    toolResultDetailsRow.appendChild(toolResultDetailsControl);
    const traceIdsRow = createNode("div", "cp-page-row");
    const traceIdsCopy = createNode("div", "cp-page-row-copy");
    traceIdsCopy.appendChild(
      createNode("div", "cp-page-row-title", strings.traceIdsTitle),
    );
    traceIdsCopy.appendChild(
      createNode("p", "cp-page-row-help", strings.traceIdsHelp),
    );
    const traceIdsControl = createNode(
      "div",
      "cp-update-enhancer-row-control",
    );
    const traceIdsMeta = createToggleMetaNode();
    const traceIdsToggle = createNode(
      "button",
      "cp-page-toggle cp-update-enhancer-toggle",
    );
    traceIdsToggle.type = "button";
    traceIdsToggle.style.pointerEvents = "auto";
    traceIdsToggle.setAttribute("role", "switch");
    traceIdsToggle.setAttribute("aria-checked", "false");
    traceIdsToggle.setAttribute("aria-label", strings.traceIdsTitle);
    traceIdsToggle.title = strings.traceIdsTitle;
    traceIdsControl.appendChild(traceIdsMeta);
    traceIdsControl.appendChild(traceIdsToggle);
    traceIdsRow.appendChild(traceIdsCopy);
    traceIdsRow.appendChild(traceIdsControl);
    const systemRemindersRow = createNode("div", "cp-page-row");
    const systemRemindersCopy = createNode("div", "cp-page-row-copy");
    systemRemindersCopy.appendChild(
      createNode("div", "cp-page-row-title", strings.systemRemindersTitle),
    );
    systemRemindersCopy.appendChild(
      createNode("p", "cp-page-row-help", strings.systemRemindersHelp),
    );
    const systemRemindersControl = createNode(
      "div",
      "cp-update-enhancer-row-control",
    );
    const systemRemindersMeta = createToggleMetaNode();
    const systemRemindersToggle = createNode(
      "button",
      "cp-page-toggle cp-update-enhancer-toggle",
    );
    systemRemindersToggle.type = "button";
    systemRemindersToggle.style.pointerEvents = "auto";
    systemRemindersToggle.setAttribute("role", "switch");
    systemRemindersToggle.setAttribute("aria-checked", "false");
    systemRemindersToggle.setAttribute(
      "aria-label",
      strings.systemRemindersTitle,
    );
    systemRemindersToggle.title = strings.systemRemindersTitle;
    systemRemindersControl.appendChild(systemRemindersMeta);
    systemRemindersControl.appendChild(systemRemindersToggle);
    systemRemindersRow.appendChild(systemRemindersCopy);
    systemRemindersRow.appendChild(systemRemindersControl);
    const debugLogsRow = createNode("div", "cp-page-row");
    const debugLogsCopy = createNode("div", "cp-page-row-copy");
    debugLogsCopy.appendChild(
      createNode("div", "cp-page-row-title", strings.debugLogsTitle),
    );
    debugLogsCopy.appendChild(
      createNode("p", "cp-page-row-help", strings.debugLogsHelp),
    );
    const debugLogsMeta = createNode(
      "div",
      "cp-page-meta",
      strings.debugLogsEmpty,
    );
    debugLogsCopy.appendChild(debugLogsMeta);
    const debugButtonRow = createNode("div", "cp-page-btn-row");
    const copyLogsButton = createNode(
      "button",
      `cp-page-btn cp-page-btn-quiet ${SHARED_FRAME_CLASS}`,
      strings.copyLogs,
    );
    copyLogsButton.type = "button";
    const downloadLogsButton = createNode(
      "button",
      `cp-page-btn cp-page-btn-quiet ${SHARED_FRAME_CLASS}`,
      strings.downloadLogs,
    );
    downloadLogsButton.type = "button";
    debugButtonRow.appendChild(copyLogsButton);
    debugButtonRow.appendChild(downloadLogsButton);
    debugLogsRow.appendChild(debugLogsCopy);
    debugLogsRow.appendChild(debugButtonRow);
    const debugStatus = createNode("div", "cp-page-status");
    debugStack.appendChild(debugHeader);
    debugStack.appendChild(toolResultDetailsRow);
    debugStack.appendChild(traceIdsRow);
    debugStack.appendChild(systemRemindersRow);
    debugStack.appendChild(debugLogsRow);
    debugStack.appendChild(debugStatus);
    debugPanel.appendChild(debugStack);
    providerRoot.appendChild(panel);
    providerRoot.appendChild(editorFloatingShell);
    providerRoot.appendChild(manualModelOverlay);
    document.body.appendChild(sessionBrowserOverlay);
    debugMountRoot.appendChild(debugPanel);
    const state = {
      profiles: [],
      activeProfileId: null,
      editorMode: "list",
      editingProfileId: null,
      originalApiKey: undefined,
      currentApiKey: "",
      availableModels: [],
      isFetchingModels: false,
      isCheckingHealth: false,
      cardDropdownControllers: [],
    };
    const promptProfilesState = {
      profiles: [],
      activeProfileId: null,
      editorMode: "list",
      editingProfileId: null,
      isSaving: false,
    };
    const workflowState = {
      workflows: [],
      editorMode: "list",
      editingWorkflowName: null,
      isSaving: false,
    };
    const sessionState = {
      sessions: [],
      totalCount: 0,
      isRefreshing: false,
      deletingSessionKeys: new Set(),
      viewMode: "groups",
      selectedGroupScopeId: "",
      selectedSessionId: "",
      selectedSessionSnapshot: null,
      isLoadingSnapshot: false,
    };
    const formatDropdown = enhanceSelect(formatSelect);
    const authModeDropdown = enhanceSelect(authModeSelect);
    const modelDropdown = enhanceSelect(modelSelect);
    const fastModelDropdown = enhanceSelect(fastModelSelect);
    const reasoningDropdown = enhanceSelect(reasoningSelect);
    modelSelect.__cpDeleteOption = function (value) {
      removeManualModel(value);
    };
    fastModelSelect.__cpDeleteOption = function (value) {
      removeManualModel(value);
    };
    let isManualModelDialogOpen = false;
    const debugState = {
      logs: [],
      meta: null,
      debugMode: true,
      debugModePending: false,
      showTraceIds: false,
      showTraceIdsPending: false,
      showSystemReminders: false,
      showSystemRemindersPending: false,
      showToolResultDetails: false,
      showToolResultDetailsPending: false,
    };
    const formatLabelByValue = new Map(providerFormatOptions);
    function normalizeModelOption(item) {
      const value = String(item?.value || item?.model || "").trim();
      if (!value) {
        return null;
      }
      return {
        value,
        label: String(item?.label || item?.name || value).trim() || value,
        manual: !!item?.manual,
      };
    }
    function shouldReplaceMergedModelOption(current, candidate) {
      if (!current) {
        return true;
      }
      if (!current.manual && candidate.manual) {
        return true;
      }
      if (current.manual && !candidate.manual) {
        return false;
      }
      const currentLabel =
        String(current.label || current.value).trim() || current.value;
      const candidateLabel =
        String(candidate.label || candidate.value).trim() || candidate.value;
      const currentHasCustomLabel = currentLabel !== current.value;
      const candidateHasCustomLabel = candidateLabel !== candidate.value;
      if (!currentHasCustomLabel && candidateHasCustomLabel) {
        return true;
      }
      if (
        current.manual &&
        candidate.manual &&
        currentLabel !== candidateLabel
      ) {
        return true;
      }
      return false;
    }
    function mergeModelOptions(primary, secondary) {
      const merged = [];
      const indexByValue = new Map();
      for (const source of [primary, secondary]) {
        for (const item of source || []) {
          const normalized = normalizeModelOption(item);
          if (!normalized) {
            continue;
          }
          const existingIndex = indexByValue.get(normalized.value);
          if (existingIndex === undefined) {
            indexByValue.set(normalized.value, merged.length);
            merged.push(normalized);
            continue;
          }
          if (
            shouldReplaceMergedModelOption(merged[existingIndex], normalized)
          ) {
            merged[existingIndex] = {
              ...merged[existingIndex],
              ...normalized,
              manual: merged[existingIndex].manual || normalized.manual,
            };
          } else if (normalized.manual) {
            merged[existingIndex].manual = true;
          }
        }
      }
      return merged;
    }
    function getProviderFetchIdentity(config) {
      const next = normalizeConfig(config, false);
      const credentialKey =
        next.authMode === AUTH_MODE_CODEX
          ? next.codexAccountId || next.codexRefreshToken || next.apiKey
          : next.apiKey;
      return [
        next.authMode || DEFAULT_AUTH_MODE,
        next.format || DEFAULT_FORMAT,
        String(next.baseUrl || "").trim(),
        String(credentialKey || "").trim(),
      ].join("::");
    }
    let cachedModelsHydrationToken = 0;
    async function hydrateCachedModelsForConfig(
      config,
      selectedValue,
      fastSelectedValue,
    ) {
      const identity = getProviderFetchIdentity(config);
      if (!identity || identity === `${DEFAULT_AUTH_MODE}::${DEFAULT_FORMAT}:::`) {
        return;
      }
      const token = ++cachedModelsHydrationToken;
      const cachedModels = await readCachedFetchedModels(config);
      if (token !== cachedModelsHydrationToken) {
        return;
      }
      if (!cachedModels.length) {
        return;
      }
      if (getProviderFetchIdentity(readForm()) !== identity) {
        return;
      }
      state.availableModels = mergeModelOptions(
        cachedModels,
        state.availableModels,
      );
      renderModelOptions(
        selectedValue ||
          String(config?.defaultModel || "").trim() ||
          modelSelect.value ||
          "",
        (fastSelectedValue ?? String(config?.fastModel || "").trim()) ||
          fastModelSelect.value ||
          "",
      );
    }
    async function persistFetchedModelsForEditor(config, models) {
      const persistedModels = await persistFetchedModelsForConfig(
        config,
        models,
      );
      const editingProfile = state.editingProfileId
        ? state.profiles.find(function (entry) {
            return entry.id === state.editingProfileId;
          })
        : null;
      if (!editingProfile) {
        return persistedModels;
      }
      if (
        getProviderFetchIdentity(editingProfile) !==
        getProviderFetchIdentity(config)
      ) {
        return persistedModels;
      }
      const stored = await saveProviderProfile(
        {
          ...editingProfile,
          fetchedModels: persistedModels,
        },
        {
          profileId: editingProfile.id,
          activateOnSave: false,
        },
      );
      applyStoredState(stored);
      return persistedModels;
    }
    function getFormatLabel(value) {
      return (
        formatLabelByValue.get(String(value || "").trim()) ||
        String(value || DEFAULT_FORMAT).trim() ||
        DEFAULT_FORMAT
      );
    }
    function appendReasoningEffortOptions(select) {
      [
        ["none", strings.reasoningEffortNone],
        ["low", strings.reasoningEffortLow],
        ["medium", strings.reasoningEffortMedium],
        ["high", strings.reasoningEffortHigh],
        ["max", strings.reasoningEffortMax],
      ].forEach(function (option) {
        const node = document.createElement("option");
        node.value = option[0];
        node.textContent = option[1];
        select.appendChild(node);
      });
    }
    function syncReasoningEditorControls(
      reasoningEffort,
      contextWindow,
      maxOutputTokens,
    ) {
      reasoningSelect.value = normalizeReasoningEffort(reasoningEffort);
      maxOutputTokensInput.value =
        formatMaxOutputTokensForInput(maxOutputTokens);
      contextWindowInput.value = formatContextWindowForInput(contextWindow);
      contextWindowInput.style.width = getContextWindowInputWidth(
        contextWindowInput.value,
        contextWindowInput.placeholder,
      );
      reasoningDropdown.refresh();
    }
    function readMaxOutputTokensValue() {
      return normalizeMaxOutputTokens(
        maxOutputTokensInput.value,
        DEFAULT_MAX_OUTPUT_TOKENS,
      );
    }
    function readContextWindowValue() {
      const numericK = parseContextWindowInputK(contextWindowInput.value);
      if (!Number.isFinite(numericK) || numericK <= 0) {
        return normalizeContextWindow(
          DEFAULT_CONTEXT_WINDOW,
          DEFAULT_CONTEXT_WINDOW,
        );
      }
      return normalizeContextWindow(numericK * 1000, DEFAULT_CONTEXT_WINDOW);
    }
    function adjustContextWindowValue(deltaK) {
      const numericK = parseContextWindowInputK(contextWindowInput.value);
      const fallbackK = Number(
        formatContextWindowForInput(DEFAULT_CONTEXT_WINDOW),
      );
      const baseK =
        Number.isFinite(numericK) && numericK > 0
          ? Math.round(numericK)
          : fallbackK;
      const nextK = Math.max(
        Math.ceil(MIN_CONTEXT_WINDOW / 1000),
        baseK + deltaK,
      );
      contextWindowInput.value = formatContextWindowForInput(
        normalizeContextWindow(nextK * 1000, DEFAULT_CONTEXT_WINDOW),
      );
      contextWindowInput.style.width = getContextWindowInputWidth(
        contextWindowInput.value,
        contextWindowInput.placeholder,
      );
      setEditorStatus("", "");
    }
    function getProfileDisplayName(profile, index) {
      const name = String(profile?.name || "").trim();
      if (name) {
        return name;
      }
      const model = getModelDisplayLabel(
        profile?.fetchedModels,
        profile?.defaultModel,
      );
      const format = getFormatLabel(profile?.format);
      if (format && model) {
        return `${format} · ${model}`;
      }
      if (model) {
        return model;
      }
      return `${strings.unnamedProfile} ${index + 1}`;
    }
    function getModelDisplayLabel(models, modelValue) {
      const value = String(modelValue || "").trim();
      if (!value) {
        return "";
      }
      const matched = (models || []).find(function (item) {
        return String(item?.value || item?.model || "").trim() === value;
      });
      return String(matched?.label || matched?.name || value).trim() || value;
    }
    function getEndpointSummary(baseUrl) {
      const value = String(baseUrl || "").trim();
      if (!value) {
        return strings.notConfigured;
      }
      try {
        const parsed = new URL(value);
        return parsed.host || value;
      } catch {
        return value.length > 48 ? value.slice(0, 48) + "..." : value;
      }
    }
    function getActiveProfile() {
      return (
        state.profiles.find(function (profile) {
          return profile.id === state.activeProfileId;
        }) || null
      );
    }
    function getProfileSelectableModels(profile) {
      const next = profile && typeof profile === "object" ? profile : {};
      return mergeModelOptions(
        Array.isArray(next.fetchedModels) ? next.fetchedModels : [],
        [
          {
            value: String(next.defaultModel || "").trim(),
            label: String(next.defaultModel || "").trim(),
          },
          {
            value: String(next.fastModel || "").trim(),
            label: String(next.fastModel || "").trim(),
          },
        ],
      );
    }
    function cleanupCardDropdowns() {
      for (const controller of state.cardDropdownControllers) {
        try {
          controller?.destroy?.();
        } catch {}
      }
      state.cardDropdownControllers = [];
    }
    async function handleInlineModelChange(
      profile,
      select,
      controller,
      fieldName,
      successMessage,
    ) {
      const nextModel = String(select?.value || "").trim();
      if (fieldName === "defaultModel" && !nextModel) {
        return;
      }
      if (nextModel === String(profile?.[fieldName] || "").trim()) {
        return;
      }
      try {
        setStatus(listStatus, "", "");
        select.disabled = true;
        controller?.refresh?.();
        const stored = await saveProviderProfile(
          {
            ...profile,
            [fieldName]: nextModel,
          },
          {
            profileId: profile.id,
            activateOnSave: false,
          },
        );
        applyStoredState(stored);
        renderProfileCards();
        setStatus(listStatus, "success", successMessage);
      } catch (error) {
        select.disabled = false;
        controller?.refresh?.();
        setStatus(
          listStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.saveFailure,
        );
      }
    }
    async function ensureCardModelsLoaded(
      profile,
      select,
      controller,
      selectedValue,
    ) {
      const next = normalizeConfig(profile, false);
      try {
        const fetchedModels = mergeModelOptions(
          await fetchProviderModels(next),
          Array.isArray(profile?.fetchedModels) ? profile.fetchedModels : [],
        );
        const persistedModels = await persistFetchedModelsForConfig(
          next,
          fetchedModels,
        );
        profile.fetchedModels = persistedModels.slice();
        const liveProfile = state.profiles.find(function (entry) {
          return entry.id === profile?.id;
        });
        if (liveProfile) {
          liveProfile.fetchedModels = persistedModels.slice();
        }
        const stored = await saveProviderProfile(
          {
            ...profile,
            fetchedModels: persistedModels,
          },
          {
            profileId: profile.id,
            activateOnSave: false,
          },
        );
        applyStoredState(stored);
        syncModelOptions(
          select,
          persistedModels,
          String(selectedValue || "").trim(),
        );
        controller?.refresh?.();
      } catch (error) {
        controller?.refresh?.();
        setStatus(
          listStatus,
          "error",
          getReadableErrorMessage(error, strings.fetchFailure),
        );
      }
    }
    async function handleInlineReasoningChange(profile, select, controller) {
      const nextReasoningEffort = normalizeReasoningEffort(select?.value);
      if (
        nextReasoningEffort ===
        normalizeReasoningEffort(profile?.reasoningEffort)
      ) {
        return;
      }
      try {
        setStatus(listStatus, "", "");
        select.disabled = true;
        controller?.refresh?.();
        const stored = await saveProviderProfile(
          {
            ...profile,
            reasoningEffort: nextReasoningEffort,
          },
          {
            profileId: profile.id,
            activateOnSave: false,
          },
        );
        applyStoredState(stored);
        renderProfileCards();
        setStatus(listStatus, "success", strings.inlineReasoningSaved);
      } catch (error) {
        select.disabled = false;
        controller?.refresh?.();
        setStatus(
          listStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.saveFailure,
        );
      }
    }
    async function handleInlineMaxOutputTokensChange(profile, input) {
      const nextMaxOutputTokens = normalizeMaxOutputTokens(
        input?.value,
        DEFAULT_MAX_OUTPUT_TOKENS,
      );
      if (
        nextMaxOutputTokens ===
        normalizeMaxOutputTokens(
          profile?.maxOutputTokens,
          DEFAULT_MAX_OUTPUT_TOKENS,
        )
      ) {
        input.value = String(nextMaxOutputTokens);
        return;
      }
      try {
        setStatus(listStatus, "", "");
        input.disabled = true;
        input.value = String(nextMaxOutputTokens);
        const stored = await saveProviderProfile(
          {
            ...profile,
            maxOutputTokens: nextMaxOutputTokens,
          },
          {
            profileId: profile.id,
            activateOnSave: false,
          },
        );
        applyStoredState(stored);
        renderProfileCards();
        setStatus(listStatus, "success", strings.inlineMaxOutputTokensSaved);
      } catch (error) {
        input.disabled = false;
        input.value = String(
          normalizeMaxOutputTokens(
            profile?.maxOutputTokens,
            DEFAULT_MAX_OUTPUT_TOKENS,
          ),
        );
        setStatus(
          listStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.saveFailure,
        );
      }
    }
    async function handleInlineContextWindowChange(profile, input) {
      const rawValue = Number(
        String(input?.value ?? "")
          .trim()
          .replace(/[kK]/g, ""),
      );
      const nextContextWindow =
        Number.isFinite(rawValue) && rawValue > 0
          ? normalizeContextWindow(rawValue * 1000, DEFAULT_CONTEXT_WINDOW)
          : normalizeContextWindow(
              DEFAULT_CONTEXT_WINDOW,
              DEFAULT_CONTEXT_WINDOW,
            );
      if (
        nextContextWindow ===
        normalizeContextWindow(profile?.contextWindow, DEFAULT_CONTEXT_WINDOW)
      ) {
        input.value = formatContextWindowForInput(nextContextWindow);
        return;
      }
      try {
        setStatus(listStatus, "", "");
        input.disabled = true;
        input.value = formatContextWindowForInput(nextContextWindow);
        const stored = await saveProviderProfile(
          {
            ...profile,
            contextWindow: nextContextWindow,
          },
          {
            profileId: profile.id,
            activateOnSave: false,
          },
        );
        applyStoredState(stored);
        renderProfileCards();
        setStatus(listStatus, "success", strings.inlineContextWindowSaved);
      } catch (error) {
        input.disabled = false;
        input.value = formatContextWindowForInput(
          normalizeContextWindow(
            profile?.contextWindow,
            DEFAULT_CONTEXT_WINDOW,
          ),
        );
        setStatus(
          listStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.saveFailure,
        );
      }
    }
    async function handleCardHealthCheck(profile, button) {
      const next = normalizeConfig(profile, false);
      try {
        setStatus(listStatus, "", "");
        if (button) {
          button.disabled = true;
          button.textContent = strings.healthChecking;
        }
        debugLog("customProvider.health.start", {
          profileId: profile?.id || null,
          model: next.defaultModel,
          format: next.format,
          baseUrl: next.baseUrl,
        });
        const result = await probeProviderModel(next);
        const preview = truncateStatusText(result?.replyText || "");
        const successMessage = preview
          ? strings.healthCheckSuccess.replace("{reply}", preview)
          : strings.healthCheckSuccessGeneric;
        debugLog("customProvider.health.success", {
          profileId: profile?.id || null,
          model: next.defaultModel,
          format: result?.format || next.format,
          requestUrl: result?.requestUrl || "",
          replyPreview: preview,
          hasVisibleReply: !!preview,
        });
        setStatus(listStatus, "success", successMessage);
      } catch (error) {
        const errorMessage = getReadableErrorMessage(
          error,
          strings.healthCheckFailure,
        );
        debugLog(
          "customProvider.health.failure",
          {
            profileId: profile?.id || null,
            model: next.defaultModel,
            format: next.format,
            baseUrl: next.baseUrl,
            message: errorMessage,
            error,
          },
          "error",
        );
        setStatus(listStatus, "error", errorMessage);
      } finally {
        if (button) {
          button.disabled = false;
          button.textContent = strings.healthCheck;
        }
      }
    }
    function applyStoredState(stored) {
      state.profiles = Array.isArray(stored.profiles)
        ? stored.profiles.slice()
        : [];
      state.activeProfileId = stored.activeProfileId || null;
      state.originalApiKey = stored.originalApiKey;
      state.currentApiKey = stored.currentApiKey;
    }
    function updateEditorModeUi() {
      const isEditing = state.editorMode === "edit";
      listView.hidden = isEditing;
      editorView.hidden = !isEditing;
      editorFloatingShell.hidden = !isEditing;
      addProfileButton.hidden = isEditing;
      editorTitle.textContent = state.editingProfileId
        ? strings.editProfileTitle
        : strings.createProfileTitle;
    }
    function applyPromptProfilesStoredState(stored) {
      promptProfilesState.profiles = Array.isArray(stored?.profiles)
        ? stored.profiles.slice()
        : [];
      promptProfilesState.activeProfileId = stored?.activeProfileId || null;
    }
    function isBuiltinPromptProfileId(profileId) {
      return String(profileId || "") === BUILTIN_PROMPT_PROFILE_ID;
    }
    function createBuiltinPromptProfile() {
      return {
        id: BUILTIN_PROMPT_PROFILE_ID,
        name: strings.promptDefaultProfileName,
        prompt: DEFAULT_AGENT_ROLE_PROMPT,
        isBuiltin: true,
      };
    }
    function getRenderablePromptProfiles() {
      return [createBuiltinPromptProfile()].concat(
        promptProfilesState.profiles.slice(),
      );
    }
    function getPromptProfileDisplayName(profile, index) {
      if (profile?.isBuiltin || isBuiltinPromptProfileId(profile?.id)) {
        return strings.promptDefaultProfileName;
      }
      const name = String(profile?.name || "").trim();
      if (name) {
        return name;
      }
      return `${strings.promptTitle} ${index + 1}`;
    }
    function getPromptPreview(prompt) {
      const normalized = String(prompt || "")
        .trim()
        .replace(/\s+/g, " ");
      if (!normalized) {
        return strings.notConfigured;
      }
      return normalized;
    }
    function updatePromptControls() {
      promptSaveButton.disabled = promptProfilesState.isSaving;
      addPromptProfileButton.disabled = promptProfilesState.isSaving;
    }
    function updatePromptEditorModeUi() {
      const isEditing = promptProfilesState.editorMode === "edit";
      promptListView.hidden = isEditing;
      promptEditorView.hidden = !isEditing;
      promptFloatingShell.hidden = !isEditing;
      addPromptProfileButton.hidden = isEditing;
      promptEditorTitle.textContent = promptProfilesState.editingProfileId
        ? strings.promptEditTitle
        : strings.promptCreateTitle;
    }
    function renderPromptProfileCards() {
      promptCardList.innerHTML = "";
      const profiles = getRenderablePromptProfiles();
      promptEmptyState.hidden = profiles.length > 0;
      profiles.forEach(function (profile, index) {
        const isBuiltin =
          !!profile?.isBuiltin || isBuiltinPromptProfileId(profile?.id);
        const isActive = isBuiltin
          ? !promptProfilesState.activeProfileId
          : profile.id === promptProfilesState.activeProfileId;
        const card = createNode(
          "div",
          "cp-provider-card cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
        );
        const cardHeader = createNode("div", "cp-provider-card-header");
        const titleWrap = createNode("div", "cp-provider-card-title-wrap");
        titleWrap.appendChild(
          createNode(
            "h4",
            "cp-provider-card-title",
            getPromptProfileDisplayName(profile, index),
          ),
        );
        cardHeader.appendChild(titleWrap);
        if (isActive) {
          const badge = createNode(
            "span",
            "cp-provider-badge",
            strings.currentBadge,
          );
          badge.dataset.tone = "brand";
          cardHeader.appendChild(badge);
        }
        const summary = createNode("div", "cp-provider-summary");
        summary.dataset.layout = "single";
        [
          [
            strings.promptSummaryPreviewLabel,
            getPromptPreview(profile.prompt),
            false,
          ],
        ].forEach(function (entry) {
          const item = createNode("div", "cp-provider-summary-item");
          item.appendChild(
            createNode("span", "cp-provider-summary-label", entry[0]),
          );
          const value = createNode(
            "span",
            "cp-provider-summary-value",
            entry[1],
          );
          value.dataset.truncate = "multiline";
          if (entry[2]) {
            value.dataset.mono = "true";
          }
          item.appendChild(value);
          summary.appendChild(item);
        });
        const actionRow = createNode("div", "cp-provider-card-actions");
        const activateButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          isActive ? strings.activeProfile : strings.activateProfile,
        );
        activateButton.type = "button";
        activateButton.disabled = isActive;
        activateButton.addEventListener("click", function () {
          handleActivatePromptProfile(profile.id).catch(function () {});
        });
        actionRow.appendChild(activateButton);
        if (!isBuiltin) {
          const editButton = createNode(
            "button",
            "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
            strings.editProfile,
          );
          editButton.type = "button";
          editButton.addEventListener("click", function () {
            openPromptEditor(profile.id);
          });
          const deleteButton = createNode(
            "button",
            "px-6 py-3 bg-bg-100 text-danger-100 border border-border-300 rounded-xl hover:bg-bg-200 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
            strings.deleteProfile,
          );
          deleteButton.type = "button";
          deleteButton.addEventListener("click", function () {
            handleDeletePromptProfile(profile.id).catch(function () {});
          });
          actionRow.appendChild(editButton);
          actionRow.appendChild(deleteButton);
        }
        card.appendChild(cardHeader);
        card.appendChild(summary);
        card.appendChild(actionRow);
        promptCardList.appendChild(card);
      });
    }
    function readPromptForm() {
      return {
        name: String(promptNameInput.value || "").trim(),
        prompt: String(promptTextarea.value || "").trim(),
      };
    }
    function writePromptForm(profile) {
      const next =
        profile && typeof profile === "object"
          ? profile
          : {
              name: "",
              prompt: "",
            };
      promptNameInput.value = String(next.name || "");
      promptTextarea.value = String(next.prompt || "");
    }
    function openPromptList(kind, message) {
      promptProfilesState.editorMode = "list";
      promptProfilesState.editingProfileId = null;
      setStatus(promptStatus, "", "");
      renderPromptProfileCards();
      updatePromptEditorModeUi();
      setStatus(promptListStatus, kind || "", message || "");
      updatePromptControls();
    }
    function openPromptEditor(profileId) {
      if (isBuiltinPromptProfileId(profileId)) {
        return;
      }
      promptProfilesState.editorMode = "edit";
      promptProfilesState.editingProfileId = profileId || null;
      const profile = profileId
        ? promptProfilesState.profiles.find(function (entry) {
            return entry.id === profileId;
          })
        : null;
      writePromptForm(
        profile || {
          name: "",
          prompt: DEFAULT_AGENT_ROLE_PROMPT,
        },
      );
      setStatus(promptListStatus, "", "");
      setStatus(promptStatus, "", "");
      updatePromptEditorModeUi();
      updatePromptControls();
    }
    async function refreshPromptProfiles(resetToList) {
      const stored = await readPromptProfilesState();
      applyPromptProfilesStoredState(stored);
      if (resetToList || promptProfilesState.editorMode === "list") {
        if (resetToList) {
          setStatus(promptListStatus, "", "");
        }
        openPromptList("", "");
        return;
      }
      if (promptProfilesState.editingProfileId) {
        const profile = promptProfilesState.profiles.find(function (entry) {
          return entry.id === promptProfilesState.editingProfileId;
        });
        if (profile) {
          writePromptForm(profile);
          updatePromptEditorModeUi();
        } else {
          openPromptList("", "");
        }
      } else {
        writePromptForm({
          name: "",
          prompt: DEFAULT_AGENT_ROLE_PROMPT,
        });
        updatePromptEditorModeUi();
      }
      setStatus(promptStatus, "", "");
      updatePromptControls();
    }
    async function handleActivatePromptProfile(profileId) {
      try {
        setStatus(promptListStatus, "", "");
        const stored = await setActivePromptProfile(
          isBuiltinPromptProfileId(profileId) ? null : profileId,
        );
        applyPromptProfilesStoredState(stored);
        openPromptList("success", strings.promptActivated);
      } catch (error) {
        setStatus(
          promptListStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.promptSaveFailure,
        );
      }
    }
    async function handleDeletePromptProfile(profileId) {
      if (isBuiltinPromptProfileId(profileId)) {
        return;
      }
      const profile = promptProfilesState.profiles.find(function (entry) {
        return entry.id === profileId;
      });
      const label = getPromptProfileDisplayName(
        profile,
        Math.max(
          0,
          promptProfilesState.profiles.findIndex(function (entry) {
            return entry.id === profileId;
          }),
        ),
      );
      if (
        !window.confirm(strings.promptDeleteConfirm.replace("{name}", label))
      ) {
        return;
      }
      try {
        setStatus(promptListStatus, "", "");
        const stored = await deletePromptProfile(profileId);
        applyPromptProfilesStoredState(stored);
        openPromptList("success", strings.promptDeleted);
      } catch (error) {
        setStatus(
          promptListStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.promptSaveFailure,
        );
      }
    }
    async function handlePromptSave() {
      const next = readPromptForm();
      if (!next.name) {
        setStatus(promptStatus, "error", strings.promptNameRequired);
        promptNameInput.focus();
        return;
      }
      if (!next.prompt) {
        setStatus(promptStatus, "error", strings.promptContentRequired);
        promptTextarea.focus();
        return;
      }
      try {
        promptProfilesState.isSaving = true;
        updatePromptControls();
        setStatus(promptStatus, "", "");
        const stored = await savePromptProfile(next, {
          profileId: promptProfilesState.editingProfileId || undefined,
        });
        applyPromptProfilesStoredState(stored);
        openPromptList("success", strings.promptSaved);
      } catch (error) {
        setStatus(
          promptStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.promptSaveFailure,
        );
      } finally {
        promptProfilesState.isSaving = false;
        updatePromptControls();
      }
    }
    function applyWorkflowStoredState(stored) {
      workflowState.workflows = Array.isArray(stored?.workflows)
        ? stored.workflows.slice()
        : [];
    }
    function updateWorkflowControls() {
      const isEditing = workflowState.editorMode === "edit";
      addWorkflowButton.disabled = workflowState.isSaving;
      importWorkflowButton.disabled = workflowState.isSaving;
      exportAllWorkflowsButton.disabled =
        workflowState.isSaving || workflowState.workflows.length === 0;
      workflowFormatButton.disabled = workflowState.isSaving;
      workflowSaveButton.disabled = workflowState.isSaving;
      addWorkflowButton.hidden = isEditing;
      importWorkflowButton.hidden = isEditing;
      exportAllWorkflowsButton.hidden = isEditing;
      workflowHeaderButtons.hidden = isEditing;
    }
    function updateWorkflowEditorModeUi() {
      const isEditing = workflowState.editorMode === "edit";
      workflowRoot.hidden = !isWorkflowViewActive();
      workflowSummaryMeta.hidden = isEditing;
      workflowListView.hidden = isEditing;
      workflowEditorView.hidden = !isEditing;
      workflowFloatingShell.hidden = !isEditing;
      workflowEditorTitle.textContent = workflowState.editingWorkflowName
        ? strings.workflowEditTitle
        : strings.workflowCreateTitle;
      updateWorkflowControls();
    }
    function createWorkflowSummaryItem(label, value, options) {
      const config = options && typeof options === "object" ? options : {};
      const item = createNode("div", "cp-provider-summary-item");
      item.appendChild(createNode("span", "cp-provider-summary-label", label));
      const text = createNode(
        "span",
        "cp-provider-summary-value",
        value || strings.notConfigured,
      );
      if (config.mono) {
        text.dataset.mono = "true";
      }
      if (config.multiline) {
        text.dataset.truncate = "multiline";
      } else if (config.truncate) {
        text.dataset.truncate = "true";
      }
      item.appendChild(text);
      return item;
    }
    function getWorkflowDisplayName(workflow, index) {
      const label = normalizeWorkflowText(
        workflow?.label || workflow?.name || "",
      );
      return label || `Workflow ${index + 1}`;
    }
    function getWorkflowSourceLabel(workflow) {
      const source = String(workflow?.source || "user")
        .trim()
        .toLowerCase();
      if (source === "recorded") {
        return strings.workflowSourceRecorded;
      }
      if (source === "imported") {
        return strings.workflowSourceImported;
      }
      if (source === "shortcut") {
        return strings.workflowSourceShortcut;
      }
      return strings.workflowSourceUser;
    }
    function getWorkflowPromptPreview(workflow) {
      return (
        trimSessionText(normalizeWorkflowText(workflow?.prompt || ""), 320) ||
        strings.notConfigured
      );
    }
    function buildWorkflowEditorPayload(workflow) {
      return JSON.stringify(
        workflow || createEmptyWorkflowDefinition(),
        null,
        2,
      );
    }
    function readWorkflowEditor() {
      return String(workflowJsonTextarea.value || "").trim();
    }
    function writeWorkflowEditor(value) {
      workflowJsonTextarea.value = String(value || "");
    }
    function openWorkflowList(kind, message) {
      workflowState.editorMode = "list";
      workflowState.editingWorkflowName = null;
      setStatus(workflowStatus, "", "");
      renderWorkflowCards();
      updateWorkflowEditorModeUi();
      setStatus(workflowListStatus, kind || "", message || "");
    }
    function openWorkflowEditor(workflowName) {
      workflowState.editorMode = "edit";
      workflowState.editingWorkflowName = workflowName || null;
      const workflow = workflowName
        ? workflowState.workflows.find(function (entry) {
            return (
              normalizeWorkflowText(entry?.name || "") ===
              normalizeWorkflowText(workflowName)
            );
          })
        : null;
      writeWorkflowEditor(
        buildWorkflowEditorPayload(workflow || createEmptyWorkflowDefinition()),
      );
      setStatus(workflowListStatus, "", "");
      setStatus(workflowStatus, "", "");
      updateWorkflowEditorModeUi();
      requestAnimationFrame(function () {
        workflowJsonTextarea.focus();
      });
    }
    function renderWorkflowCards() {
      workflowCardList.innerHTML = "";
      workflowEmptyState.hidden = workflowState.workflows.length > 0;
      workflowSummaryMeta.textContent = workflowState.workflows.length
        ? strings.workflowListCount.replace(
            "{count}",
            String(workflowState.workflows.length),
          )
        : "";
      workflowSummaryMeta.dataset.tone = workflowState.workflows.length
        ? "ready"
        : "";
      workflowState.workflows.forEach(function (workflow, index) {
        const isEnabled = workflow.enabled !== false;
        const card = createNode(
          "div",
          "cp-provider-card cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
        );
        const cardHeader = createNode("div", "cp-provider-card-header");
        const titleWrap = createNode("div", "cp-provider-card-title-wrap");
        const titleRow = createNode("div", "cp-provider-card-title-row");
        titleRow.appendChild(
          createNode(
            "h4",
            "cp-provider-card-title",
            getWorkflowDisplayName(workflow, index),
          ),
        );
        const sourceBadge = createNode(
          "span",
          "cp-provider-badge",
          getWorkflowSourceLabel(workflow),
        );
        titleRow.appendChild(sourceBadge);
        if (isEnabled) {
          const enabledBadge = createNode(
            "span",
            "cp-provider-badge",
            strings.workflowEnable,
          );
          enabledBadge.dataset.tone = "brand";
          titleRow.appendChild(enabledBadge);
        }
        titleWrap.appendChild(titleRow);
        titleWrap.appendChild(
          createNode(
            "p",
            "cp-provider-card-subtitle",
            workflow.description || strings.notConfigured,
          ),
        );
        cardHeader.appendChild(titleWrap);
        const summary = createNode("div", "cp-provider-summary");
        const topRow = createNode("div", "cp-provider-summary-row");
        topRow.dataset.columns = "3";
        topRow.appendChild(
          createWorkflowSummaryItem(
            strings.workflowUpdatedAtLabel,
            formatTimestamp(workflow.updatedAt),
          ),
        );
        topRow.appendChild(
          createWorkflowSummaryItem(
            strings.workflowPatternsLabel,
            Array.isArray(workflow.url_patterns) && workflow.url_patterns.length
              ? workflow.url_patterns.join(", ")
              : strings.notConfigured,
            {
              multiline: true,
            },
          ),
        );
        topRow.appendChild(
          createWorkflowSummaryItem(
            strings.workflowInputsLabel,
            String(Array.isArray(workflow.inputs) ? workflow.inputs.length : 0),
          ),
        );
        const bottomRow = createNode("div", "cp-provider-summary-row");
        bottomRow.dataset.columns = "2";
        bottomRow.appendChild(
          createWorkflowSummaryItem(
            strings.workflowVersionLabel,
            String(workflow.version || 1),
          ),
        );
        bottomRow.appendChild(
          createWorkflowSummaryItem(
            strings.workflowPromptLabel,
            getWorkflowPromptPreview(workflow),
            {
              multiline: true,
            },
          ),
        );
        summary.appendChild(topRow);
        summary.appendChild(bottomRow);
        const actionRow = createNode(
          "div",
          "cp-provider-card-actions cp-workflow-card-actions",
        );
        const toggleButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          isEnabled ? strings.workflowDisable : strings.workflowEnable,
        );
        toggleButton.type = "button";
        toggleButton.addEventListener("click", function () {
          handleWorkflowToggle(workflow.name).catch(function () {});
        });
        const exportButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.workflowExport,
        );
        exportButton.type = "button";
        exportButton.addEventListener("click", function () {
          exportWorkflowSet([workflow]);
        });
        const editButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.workflowEdit,
        );
        editButton.type = "button";
        editButton.addEventListener("click", function () {
          openWorkflowEditor(workflow.name);
        });
        const deleteButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-danger-100 border border-border-300 rounded-xl hover:bg-bg-200 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.workflowDelete,
        );
        deleteButton.type = "button";
        deleteButton.addEventListener("click", function () {
          handleWorkflowDelete(workflow.name).catch(function () {});
        });
        actionRow.appendChild(toggleButton);
        actionRow.appendChild(exportButton);
        actionRow.appendChild(editButton);
        actionRow.appendChild(deleteButton);
        card.appendChild(cardHeader);
        card.appendChild(summary);
        card.appendChild(actionRow);
        workflowCardList.appendChild(card);
      });
      updateWorkflowControls();
    }
    async function refreshWorkflows(resetToList) {
      const stored = await readWorkflowStoreState();
      applyWorkflowStoredState(stored);
      if (resetToList || workflowState.editorMode === "list") {
        if (resetToList) {
          setStatus(workflowListStatus, "", "");
        }
        openWorkflowList("", "");
        return;
      }
      if (workflowState.editingWorkflowName) {
        const workflow = workflowState.workflows.find(function (entry) {
          return (
            normalizeWorkflowText(entry?.name || "") ===
            normalizeWorkflowText(workflowState.editingWorkflowName)
          );
        });
        if (workflow) {
          writeWorkflowEditor(buildWorkflowEditorPayload(workflow));
          updateWorkflowEditorModeUi();
        } else {
          openWorkflowList("", "");
        }
      } else {
        writeWorkflowEditor(
          buildWorkflowEditorPayload(createEmptyWorkflowDefinition()),
        );
        updateWorkflowEditorModeUi();
      }
      setStatus(workflowStatus, "", "");
      updateWorkflowControls();
    }
    function normalizeWorkflowFromEditor(rawText) {
      let parsed = null;
      try {
        parsed = JSON.parse(String(rawText || ""));
      } catch (error) {
        throw new Error(strings.workflowJsonInvalid);
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(strings.workflowJsonObjectRequired);
      }
      const existing = workflowState.editingWorkflowName
        ? workflowState.workflows.find(function (entry) {
            return (
              normalizeWorkflowText(entry?.name || "") ===
              normalizeWorkflowText(workflowState.editingWorkflowName)
            );
          })
        : null;
      const normalized = normalizeWorkflowEntry(
        {
          ...parsed,
          source: parsed.source || existing?.source || "user",
          createdAt: parsed.createdAt || existing?.createdAt || Date.now(),
          updatedAt: Date.now(),
        },
        {
          fallbackCreatedAt: existing?.createdAt || Date.now(),
          fallbackUpdatedAt: Date.now(),
        },
      );
      if (!normalized?.name) {
        throw new Error(strings.workflowNameRequired);
      }
      if (!normalized.label) {
        throw new Error(strings.workflowLabelRequired);
      }
      if (!normalized.description) {
        throw new Error(strings.workflowDescriptionRequired);
      }
      if (!normalized.prompt) {
        throw new Error(strings.workflowPromptRequired);
      }
      return normalized;
    }
    function exportWorkflowSet(workflows) {
      const items = Array.isArray(workflows)
        ? workflows
            .map(function (entry) {
              return normalizeWorkflowEntry(entry, {
                fallbackCreatedAt: Date.now(),
                fallbackUpdatedAt: Date.now(),
              });
            })
            .filter(Boolean)
        : [];
      if (!items.length) {
        setStatus(workflowListStatus, "error", strings.workflowExportEmpty);
        return;
      }
      const payload = JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          workflows: items,
        },
        null,
        2,
      );
      const label =
        trimSessionText(items.length === 1 ? items[0].name : "workflows", 48)
          .replace(/[^\w.-]+/g, "-")
          .replace(/^-+|-+$/g, "") || "workflows";
      downloadTextFile(
        `claw-workflows-${label}.json`,
        payload,
        "application/json",
      );
      setStatus(workflowListStatus, "success", strings.workflowExported);
    }
    async function handleWorkflowToggle(workflowName) {
      const currentName = normalizeWorkflowText(workflowName);
      const updated = workflowState.workflows
        .map(function (entry) {
          if (normalizeWorkflowText(entry?.name || "") !== currentName) {
            return entry;
          }
          return normalizeWorkflowEntry(
            {
              ...entry,
              enabled: entry.enabled === false,
              updatedAt: Date.now(),
            },
            {
              fallbackCreatedAt: entry.createdAt,
              fallbackUpdatedAt: Date.now(),
            },
          );
        })
        .filter(Boolean);
      await writeWorkflowStoreState(updated);
      applyWorkflowStoredState({
        workflows: updated,
      });
      openWorkflowList(
        "success",
        updated.find(function (entry) {
          return normalizeWorkflowText(entry?.name || "") === currentName;
        })?.enabled === false
          ? strings.workflowDisabled
          : strings.workflowEnabled,
      );
    }
    async function handleWorkflowDelete(workflowName) {
      const normalizedName = normalizeWorkflowText(workflowName);
      const workflow = workflowState.workflows.find(function (entry) {
        return normalizeWorkflowText(entry?.name || "") === normalizedName;
      });
      const label = getWorkflowDisplayName(workflow, 0);
      if (
        !window.confirm(strings.workflowDeleteConfirm.replace("{name}", label))
      ) {
        return;
      }
      const updated = workflowState.workflows.filter(function (entry) {
        return normalizeWorkflowText(entry?.name || "") !== normalizedName;
      });
      await writeWorkflowStoreState(updated);
      applyWorkflowStoredState({
        workflows: updated,
      });
      if (
        workflowState.editingWorkflowName &&
        normalizeWorkflowText(workflowState.editingWorkflowName) ===
          normalizedName
      ) {
        workflowState.editingWorkflowName = null;
      }
      openWorkflowList("success", strings.workflowDeleted);
    }
    async function handleWorkflowSave() {
      let normalized = null;
      try {
        normalized = normalizeWorkflowFromEditor(readWorkflowEditor());
      } catch (error) {
        setStatus(
          workflowStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.workflowSaveFailure,
        );
        workflowJsonTextarea.focus();
        return;
      }
      const previousName = normalizeWorkflowText(
        workflowState.editingWorkflowName || "",
      );
      const duplicate = workflowState.workflows.find(function (entry) {
        const entryName = normalizeWorkflowText(entry?.name || "");
        return entryName === normalized.name && entryName !== previousName;
      });
      if (
        duplicate &&
        !window.confirm(
          strings.workflowDuplicateReplaceConfirm.replace(
            "{name}",
            normalized.name,
          ),
        )
      ) {
        return;
      }
      try {
        workflowState.isSaving = true;
        updateWorkflowControls();
        const filtered = workflowState.workflows.filter(function (entry) {
          const entryName = normalizeWorkflowText(entry?.name || "");
          return entryName !== previousName && entryName !== normalized.name;
        });
        filtered.unshift(normalized);
        await writeWorkflowStoreState(filtered);
        applyWorkflowStoredState({
          workflows: filtered,
        });
        openWorkflowList("success", strings.workflowSaved);
      } catch (error) {
        setStatus(
          workflowStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.workflowSaveFailure,
        );
      } finally {
        workflowState.isSaving = false;
        updateWorkflowControls();
      }
    }
    function formatWorkflowEditorJson() {
      try {
        const normalized = normalizeWorkflowFromEditor(readWorkflowEditor());
        writeWorkflowEditor(buildWorkflowEditorPayload(normalized));
        setStatus(workflowStatus, "", "");
      } catch (error) {
        setStatus(
          workflowStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.workflowJsonInvalid,
        );
      }
    }
    function openWorkflowImportPicker() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json,application/json";
      input.addEventListener(
        "change",
        function () {
          const file = input.files && input.files[0];
          if (!file) {
            return;
          }
          file
            .text()
            .then(async function (text) {
              const parsed = JSON.parse(String(text || ""));
              const rawItems = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed?.workflows)
                  ? parsed.workflows
                  : parsed && typeof parsed === "object"
                    ? [parsed]
                    : [];
              if (!rawItems.length) {
                throw new Error(strings.workflowImportFailure);
              }
              let nextWorkflows = workflowState.workflows.slice();
              let importedCount = 0;
              for (const rawItem of rawItems) {
                const normalized = normalizeWorkflowEntry(
                  {
                    ...rawItem,
                    source: rawItem?.source || "imported",
                    updatedAt: Date.now(),
                  },
                  {
                    fallbackCreatedAt: Date.now(),
                    fallbackUpdatedAt: Date.now(),
                  },
                );
                if (
                  !normalized?.name ||
                  !normalized.label ||
                  !normalized.description ||
                  !normalized.prompt
                ) {
                  continue;
                }
                const existingIndex = nextWorkflows.findIndex(function (entry) {
                  return (
                    normalizeWorkflowText(entry?.name || "") === normalized.name
                  );
                });
                if (
                  existingIndex >= 0 &&
                  !window.confirm(
                    strings.workflowDuplicateReplaceConfirm.replace(
                      "{name}",
                      normalized.name,
                    ),
                  )
                ) {
                  continue;
                }
                if (existingIndex >= 0) {
                  const existing = nextWorkflows[existingIndex];
                  nextWorkflows.splice(
                    existingIndex,
                    1,
                    normalizeWorkflowEntry(
                      {
                        ...normalized,
                        createdAt: existing.createdAt || normalized.createdAt,
                      },
                      {
                        fallbackCreatedAt:
                          existing.createdAt || normalized.createdAt,
                        fallbackUpdatedAt: Date.now(),
                      },
                    ),
                  );
                } else {
                  nextWorkflows.unshift(normalized);
                }
                importedCount += 1;
              }
              await writeWorkflowStoreState(nextWorkflows);
              applyWorkflowStoredState({
                workflows: nextWorkflows,
              });
              openWorkflowList(
                importedCount ? "success" : "error",
                importedCount
                  ? strings.workflowImported.replace(
                      "{count}",
                      String(importedCount),
                    )
                  : strings.workflowImportFailure,
              );
            })
            .catch(function () {
              setStatus(
                workflowListStatus,
                "error",
                strings.workflowImportFailure,
              );
            });
        },
        {
          once: true,
        },
      );
      input.click();
    }
    function getSessionDisplayUrl(session) {
      return trimSessionText(
        session?.anchorUrl ||
          session?.currentUrl ||
          session?.domain ||
          session?.scopeId ||
          "",
        240,
      );
    }
    function getSessionIdentityKey(session) {
      return (
        normalizeSessionScopeId(session?.scopeId) ||
        String(session?.id || "").trim()
      );
    }
    function getSessionDisplayTitle(session) {
      return (
        trimSessionText(
          getSessionDisplayUrl(session) ||
            session?.title ||
            session?.anchorTabTitle ||
            session?.tabTitle ||
            strings.notConfigured,
          240,
        ) || strings.notConfigured
      );
    }
    function getSelectedSessionGroup() {
      return (
        sessionState.sessions.find(function (entry) {
          return (
            normalizeSessionScopeId(entry?.scopeId) ===
            normalizeSessionScopeId(sessionState.selectedGroupScopeId)
          );
        }) || null
      );
    }
    function getSelectedGroupEntries() {
      const group = getSelectedSessionGroup();
      return Array.isArray(group?.entries) ? group.entries.slice() : [];
    }
    function getSelectedSessionMeta() {
      const selectedSessionId = String(
        sessionState.selectedSessionId || "",
      ).trim();
      if (!selectedSessionId) {
        return null;
      }
      return (
        getSelectedGroupEntries().find(function (entry) {
          return String(entry?.id || "").trim() === selectedSessionId;
        }) || null
      );
    }
    function getSessionRoleLabel(role) {
      const normalizedRole = String(role || "")
        .trim()
        .toLowerCase();
      if (normalizedRole === "user") {
        return strings.sessionRoleUser;
      }
      if (normalizedRole === "assistant") {
        return strings.sessionRoleAssistant;
      }
      if (normalizedRole === "system") {
        return strings.sessionRoleSystem;
      }
      if (normalizedRole.indexOf("tool") !== -1) {
        return strings.sessionRoleTool;
      }
      return strings.sessionRoleUnknown;
    }
    function mountSessionBrowserInline() {
      if (sessionBrowserView.parentNode !== sessionStack) {
        sessionStack.appendChild(sessionBrowserView);
      }
    }
    function mountSessionBrowserModal() {
      if (sessionBrowserView.parentNode !== sessionBrowserCard) {
        sessionBrowserCard.appendChild(sessionBrowserView);
      }
    }
    function updateSessionViewModeUi() {
      const isGroupList = sessionState.viewMode === "groups";
      const isRecord = sessionState.viewMode === "record";
      const selectedGroup = getSelectedSessionGroup();
      const hasSessions = sessionState.sessions.length > 0;
      if (isRecord) {
        mountSessionBrowserModal();
      } else {
        mountSessionBrowserInline();
      }
      sessionCardList.hidden = !isGroupList || !hasSessions;
      sessionEmptyState.hidden = !isGroupList || hasSessions;
      sessionBrowserOverlay.hidden = !isRecord;
      sessionBrowserView.hidden = isGroupList;
      sessionBrowserBackButton.hidden = isGroupList;
      sessionHistoryCardList.hidden = isRecord;
      sessionHistoryEmptyState.hidden =
        isRecord || getSelectedGroupEntries().length > 0;
      sessionRecordView.hidden = !isRecord;
      sessionSummaryMeta.hidden = false;
      sessionHeaderButtons.hidden = false;
      sessionBrowserCard.setAttribute(
        "aria-hidden",
        isGroupList ? "true" : "false",
      );
      if (isGroupList) {
        return;
      }
      if (isRecord) {
        const selectedSession = getSelectedSessionMeta();
        sessionBrowserTitle.textContent =
          selectedSession?.title || strings.sessionRecordTitle;
        sessionBrowserHelp.textContent = selectedGroup
          ? getSessionDisplayTitle(selectedGroup)
          : strings.sessionRecordSubtitle;
        sessionBrowserBackButton.textContent = strings.sessionBackToHistory;
      } else {
        sessionBrowserTitle.textContent = selectedGroup
          ? getSessionDisplayTitle(selectedGroup)
          : strings.sessionHistoryTitle;
        sessionBrowserHelp.textContent =
          selectedGroup?.title || strings.sessionHistorySubtitle;
        sessionBrowserBackButton.textContent = strings.backToList;
      }
    }
    function renderSessionRecord() {
      sessionRecordList.innerHTML = "";
      const snapshot = sessionState.selectedSessionSnapshot;
      const selectedSession = getSelectedSessionMeta();
      if (
        !snapshot ||
        !Array.isArray(snapshot.messages) ||
        snapshot.messages.length === 0
      ) {
        sessionRecordEmptyState.hidden = false;
        if (selectedSession) {
          sessionRecordEmptyState.querySelector(
            ".cp-provider-empty-title",
          ).textContent = strings.sessionRecordEmpty;
        }
        return;
      }
      sessionRecordEmptyState.hidden = true;
      snapshot.messages.forEach(function (message) {
        const item = createNode("div", "cp-session-record-item");
        item.dataset.role = String(message?.role || "")
          .trim()
          .toLowerCase();
        const meta = createNode("div", "cp-session-record-meta");
        meta.appendChild(
          createNode(
            "span",
            "cp-session-record-role",
            getSessionRoleLabel(message?.role),
          ),
        );
        if (selectedSession?.updatedAt) {
          meta.appendChild(
            createNode(
              "span",
              "cp-provider-summary-label",
              formatTimestamp(selectedSession.updatedAt),
            ),
          );
        }
        item.appendChild(meta);
        item.appendChild(
          createNode(
            "p",
            "cp-session-record-content",
            String(message?.text || ""),
          ),
        );
        sessionRecordList.appendChild(item);
      });
    }
    function renderSessionHistoryCards() {
      sessionHistoryCardList.innerHTML = "";
      const entries = getSelectedGroupEntries();
      entries.forEach(function (entry) {
        const isSelected =
          String(entry?.id || "").trim() ===
          String(sessionState.selectedSessionId || "").trim();
        const card = createNode(
          "div",
          "cp-provider-card cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
        );
        const cardHeader = createNode("div", "cp-provider-card-header");
        const titleWrap = createNode("div", "cp-provider-card-title-wrap");
        const titleRow = createNode("div", "cp-provider-card-title-row");
        titleRow.appendChild(
          createNode(
            "h4",
            "cp-provider-card-title",
            trimSessionText(
              entry?.title || strings.sessionUntitled,
              CHAT_SESSION_TITLE_LIMIT,
            ) || strings.sessionUntitled,
          ),
        );
        titleWrap.appendChild(titleRow);
        titleWrap.appendChild(
          createNode(
            "p",
            "cp-provider-card-subtitle",
            trimSessionText(
              entry?.preview || entry?.tabTitle || strings.notConfigured,
              CHAT_SESSION_PREVIEW_LIMIT,
            ) || strings.notConfigured,
          ),
        );
        cardHeader.appendChild(titleWrap);
        const summary = createNode("div", "cp-provider-summary");
        const summaryRow = createNode("div", "cp-provider-summary-row");
        summaryRow.dataset.columns = "3";
        summaryRow.appendChild(
          createSessionSummaryItem(
            strings.sessionUpdatedAtLabel,
            formatTimestamp(entry.updatedAt),
          ),
        );
        summaryRow.appendChild(
          createSessionSummaryItem(
            strings.sessionMessagesLabel,
            String(entry.messageCount || 0),
          ),
        );
        summaryRow.appendChild(
          createSessionSummaryItem(
            strings.sessionModelLabel,
            entry.selectedModel || strings.notConfigured,
            {
              mono: true,
              truncate: true,
            },
          ),
        );
        summary.appendChild(summaryRow);
        const actionRow = createNode("div", "cp-provider-card-actions");
        const openButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.sessionViewRecord,
        );
        openButton.type = "button";
        openButton.disabled = sessionState.isLoadingSnapshot && isSelected;
        openButton.addEventListener("click", function () {
          openSessionRecord(entry).catch(function () {});
        });
        actionRow.appendChild(openButton);
        card.appendChild(cardHeader);
        card.appendChild(summary);
        card.appendChild(actionRow);
        sessionHistoryCardList.appendChild(card);
      });
    }
    async function openSessionRecord(entry) {
      const group = getSelectedSessionGroup();
      if (!group || !entry?.id) {
        return;
      }
      sessionState.selectedSessionId = String(entry.id || "").trim();
      sessionState.isLoadingSnapshot = true;
      sessionState.selectedSessionSnapshot = null;
      sessionState.viewMode = "record";
      updateSessionViewModeUi();
      renderSessionRecord();
      requestAnimationFrame(function () {
        sessionBrowserCard.focus();
      });
      setStatus(sessionBrowserStatus, "loading", strings.sessionRefreshing);
      try {
        const snapshot = await readLocalSessionSnapshot(
          group.scopeId,
          entry.id,
          strings,
        );
        sessionState.selectedSessionSnapshot = snapshot;
        renderSessionRecord();
        setStatus(sessionBrowserStatus, "", "");
      } catch (error) {
        sessionState.selectedSessionSnapshot = null;
        renderSessionRecord();
        setStatus(
          sessionBrowserStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.sessionRecordLoadFailure,
        );
      } finally {
        sessionState.isLoadingSnapshot = false;
      }
    }
    function openSessionGroup(group) {
      sessionState.selectedGroupScopeId = normalizeSessionScopeId(
        group?.scopeId,
      );
      sessionState.selectedSessionId = "";
      sessionState.selectedSessionSnapshot = null;
      sessionState.viewMode = "history";
      setStatus(sessionBrowserStatus, "", "");
      renderSessionHistoryCards();
      updateSessionViewModeUi();
    }
    function closeSessionRecordDialog() {
      if (sessionState.viewMode !== "record") {
        return;
      }
      sessionState.viewMode = "history";
      sessionState.selectedSessionId = "";
      sessionState.selectedSessionSnapshot = null;
      sessionState.isLoadingSnapshot = false;
      setStatus(sessionBrowserStatus, "", "");
      renderSessionHistoryCards();
      updateSessionViewModeUi();
    }
    function handleSessionBrowserBack() {
      if (sessionState.viewMode === "record") {
        closeSessionRecordDialog();
        return;
      }
      sessionState.viewMode = "groups";
      sessionState.selectedGroupScopeId = "";
      sessionState.selectedSessionId = "";
      sessionState.selectedSessionSnapshot = null;
      sessionState.isLoadingSnapshot = false;
      setStatus(sessionBrowserStatus, "", "");
      updateSessionViewModeUi();
    }
    function updateSessionControls() {
      refreshSessionsButton.disabled = sessionState.isRefreshing;
      refreshSessionsButton.textContent = sessionState.isRefreshing
        ? strings.sessionRefreshing
        : strings.sessionRefresh;
    }
    function createSessionSummaryItem(label, value, options) {
      const config = options && typeof options === "object" ? options : {};
      const item = createNode("div", "cp-provider-summary-item");
      item.appendChild(createNode("span", "cp-provider-summary-label", label));
      const text = createNode(
        "span",
        "cp-provider-summary-value",
        value || strings.notConfigured,
      );
      if (config.mono) {
        text.dataset.mono = "true";
      }
      if (config.multiline) {
        text.dataset.truncate = "multiline";
      } else if (config.truncate) {
        text.dataset.truncate = "true";
      }
      item.appendChild(text);
      return item;
    }
    function renderSessionCards() {
      sessionCardList.innerHTML = "";
      sessionEmptyState.hidden = sessionState.sessions.length > 0;
      sessionSummaryMeta.textContent = sessionState.totalCount
        ? strings.sessionListCount.replace(
            "{count}",
            String(sessionState.totalCount),
          )
        : "";
      sessionSummaryMeta.dataset.tone = sessionState.totalCount ? "ready" : "";
      sessionState.sessions.forEach(function (session) {
        const sessionKey = getSessionIdentityKey(session);
        const isDeleting = sessionState.deletingSessionKeys.has(sessionKey);
        const latestTabTitle = trimSessionText(session?.tabTitle || "", 120);
        const subtitle =
          trimSessionText(
            session?.title ||
              latestTabTitle ||
              session?.anchorTabTitle ||
              strings.notConfigured,
            CHAT_SESSION_PREVIEW_LIMIT,
          ) || strings.notConfigured;
        const card = createNode(
          "div",
          "cp-provider-card cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
        );
        const cardHeader = createNode("div", "cp-provider-card-header");
        const titleWrap = createNode("div", "cp-provider-card-title-wrap");
        const titleRow = createNode("div", "cp-provider-card-title-row");
        titleRow.appendChild(
          createNode(
            "h4",
            "cp-provider-card-title",
            getSessionDisplayTitle(session),
          ),
        );
        titleWrap.appendChild(titleRow);
        titleWrap.appendChild(
          createNode(
            "p",
            "cp-provider-card-subtitle",
            subtitle || strings.notConfigured,
          ),
        );
        cardHeader.appendChild(titleWrap);
        const summary = createNode("div", "cp-provider-summary");
        const summaryTopRow = createNode("div", "cp-provider-summary-row");
        summaryTopRow.dataset.columns = "3";
        summaryTopRow.appendChild(
          createSessionSummaryItem(
            strings.sessionUpdatedAtLabel,
            formatTimestamp(session.updatedAt),
          ),
        );
        summaryTopRow.appendChild(
          createSessionSummaryItem(
            strings.sessionGroupCountLabel,
            String(session.sessionCount || 0),
          ),
        );
        summaryTopRow.appendChild(
          createSessionSummaryItem(
            strings.sessionTotalMessagesLabel,
            String(session.messageCount || 0),
          ),
        );
        summary.appendChild(summaryTopRow);
        const actionRow = createNode("div", "cp-provider-card-actions");
        const viewButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.sessionView,
        );
        viewButton.type = "button";
        viewButton.disabled = isDeleting;
        viewButton.addEventListener("click", function () {
          openSessionGroup(session);
        });
        const deleteButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-danger-100 border border-border-300 rounded-xl hover:bg-bg-200 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.sessionDelete,
        );
        deleteButton.type = "button";
        deleteButton.disabled = isDeleting;
        deleteButton.addEventListener("click", function () {
          handleDeleteSession(session).catch(function () {});
        });
        actionRow.appendChild(viewButton);
        actionRow.appendChild(deleteButton);
        card.appendChild(cardHeader);
        card.appendChild(summary);
        card.appendChild(actionRow);
        sessionCardList.appendChild(card);
      });
    }
    async function refreshSessions() {
      sessionState.isRefreshing = true;
      updateSessionControls();
      try {
        const stored = await getSessionStoreState(strings);
        sessionState.sessions = stored.sessions;
        sessionState.totalCount = stored.totalCount;
        if (sessionState.selectedGroupScopeId && !getSelectedSessionGroup()) {
          sessionState.viewMode = "groups";
          sessionState.selectedGroupScopeId = "";
          sessionState.selectedSessionId = "";
          sessionState.selectedSessionSnapshot = null;
        }
        renderSessionCards();
        renderSessionHistoryCards();
        renderSessionRecord();
        updateSessionViewModeUi();
      } finally {
        sessionState.isRefreshing = false;
        updateSessionControls();
      }
    }
    async function handleSessionRefresh(showLoadingStatus) {
      if (showLoadingStatus) {
        setStatus(sessionListStatus, "loading", strings.sessionRefreshing);
      }
      try {
        await refreshSessions();
        if (showLoadingStatus) {
          setStatus(sessionListStatus, "", "");
        }
      } catch (error) {
        setStatus(
          sessionListStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.sessionLoadFailure,
        );
      }
    }
    async function handleDeleteSession(session) {
      const label = session?.title || strings.sessionUntitled;
      if (
        !window.confirm(strings.sessionDeleteConfirm.replace("{name}", label))
      ) {
        return;
      }
      const sessionKey = getSessionIdentityKey(session);
      sessionState.deletingSessionKeys.add(sessionKey);
      renderSessionCards();
      try {
        await deleteLocalSessionEntry(session);
        await refreshSessions();
        setStatus(sessionListStatus, "success", strings.sessionDeleted);
      } catch (error) {
        setStatus(
          sessionListStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.sessionDeleteFailure,
        );
      } finally {
        sessionState.deletingSessionKeys.delete(sessionKey);
        renderSessionCards();
      }
    }
    function renderProfileCards() {
      cleanupCardDropdowns();
      profileCardList.innerHTML = "";
      const profiles = state.profiles.slice();
      emptyState.hidden = profiles.length > 0;
      profiles.forEach(function (profile, index) {
        const isActive = profile.id === state.activeProfileId;
        const cardModelOptions = getProfileSelectableModels(profile);
        const card = createNode(
          "div",
          "cp-provider-card cp-page-card cp-page-panel bg-bg-100 border border-border-300 rounded-xl px-6 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8",
        );
        const cardHeader = createNode("div", "cp-provider-card-header");
        const titleWrap = createNode("div", "cp-provider-card-title-wrap");
        const titleRow = createNode("div", "cp-provider-card-title-row");
        titleRow.appendChild(
          createNode(
            "h4",
            "cp-provider-card-title",
            getProfileDisplayName(profile, index),
          ),
        );
        titleRow.appendChild(
          createNode(
            "span",
            "cp-provider-badge",
            getFormatLabel(profile.format),
          ),
        );
        titleWrap.appendChild(titleRow);
        titleWrap.appendChild(
          createNode(
            "p",
            "cp-provider-card-subtitle",
            String(profile.baseUrl || "").trim() || strings.notConfigured,
          ),
        );
        cardHeader.appendChild(titleWrap);
        if (isActive) {
          const badge = createNode(
            "span",
            "cp-provider-badge",
            strings.currentBadge,
          );
          badge.dataset.tone = "brand";
          cardHeader.appendChild(badge);
        }
        const summary = createNode("div", "cp-provider-summary");
        const summaryTopRow = createNode("div", "cp-provider-summary-row");
        summaryTopRow.dataset.columns = "2";
        const summaryBottomRow = createNode("div", "cp-provider-summary-row");
        summaryBottomRow.dataset.columns = "3";
        [
          [
            "model",
            strings.modelSummaryLabel,
            String(profile.defaultModel || "").trim(),
          ],
          [
            "fastModel",
            strings.fastModelSummaryLabel,
            String(profile.fastModel || "").trim(),
          ],
        ].forEach(function (entry) {
          const item = createNode("div", "cp-provider-summary-item");
          item.dataset.field = entry[0];
          item.appendChild(
            createNode("span", "cp-provider-summary-label", entry[1]),
          );
          const modelShell = createNode("div", "cp-provider-inline-control");
          const modelSelectInline = createNode(
            "select",
            `cp-page-select ${SHARED_FRAME_CLASS}`,
          );
          syncModelOptions(modelSelectInline, cardModelOptions, entry[2]);
          modelShell.appendChild(modelSelectInline);
          item.appendChild(modelShell);
          const inlineDropdownController = enhanceSelect(modelSelectInline);
          modelSelectInline.__cpBeforeOpen = function () {
            return ensureCardModelsLoaded(
              profile,
              modelSelectInline,
              inlineDropdownController,
              entry[2],
            );
          };
          state.cardDropdownControllers.push(inlineDropdownController);
          modelSelectInline.addEventListener("change", function () {
            const fieldName =
              entry[0] === "fastModel" ? "fastModel" : "defaultModel";
            const successMessage =
              entry[0] === "fastModel"
                ? strings.inlineFastModelSaved
                : strings.inlineModelSaved;
            handleInlineModelChange(
              profile,
              modelSelectInline,
              inlineDropdownController,
              fieldName,
              successMessage,
            ).catch(function () {});
          });
          summaryTopRow.appendChild(item);
        });
        const reasoningItem = createNode("div", "cp-provider-summary-item");
        reasoningItem.dataset.field = "reasoning";
        reasoningItem.appendChild(
          createNode(
            "span",
            "cp-provider-summary-label",
            strings.reasoningEffortLabel,
          ),
        );
        const reasoningShell = createNode("div", "cp-provider-inline-control");
        const reasoningSelectInline = createNode(
          "select",
          `cp-page-select ${SHARED_FRAME_CLASS}`,
        );
        appendReasoningEffortOptions(reasoningSelectInline);
        reasoningSelectInline.value = normalizeReasoningEffort(
          profile.reasoningEffort,
        );
        reasoningShell.appendChild(reasoningSelectInline);
        reasoningItem.appendChild(reasoningShell);
        const inlineDropdownController = enhanceSelect(reasoningSelectInline);
        state.cardDropdownControllers.push(inlineDropdownController);
        reasoningSelectInline.addEventListener("change", function () {
          handleInlineReasoningChange(
            profile,
            reasoningSelectInline,
            inlineDropdownController,
          ).catch(function () {});
        });
        summaryBottomRow.appendChild(reasoningItem);
        const contextWindowItem = createNode("div", "cp-provider-summary-item");
        contextWindowItem.dataset.field = "contextWindow";
        contextWindowItem.appendChild(
          createNode(
            "span",
            "cp-provider-summary-label",
            strings.contextWindowLabel,
          ),
        );
        const contextWindowShell = createNode(
          "div",
          "cp-provider-inline-control",
        );
        const contextWindowInline = createNode(
          "input",
          `cp-page-input cp-page-input-mono ${SHARED_FRAME_CLASS}`,
        );
        contextWindowInline.type = "text";
        contextWindowInline.inputMode = "numeric";
        contextWindowInline.value = formatContextWindowForInput(
          profile.contextWindow,
        );
        contextWindowShell.appendChild(contextWindowInline);
        contextWindowItem.appendChild(contextWindowShell);
        contextWindowInline.addEventListener("change", function () {
          handleInlineContextWindowChange(profile, contextWindowInline).catch(
            function () {},
          );
        });
        contextWindowInline.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            contextWindowInline.blur();
          }
        });
        summaryBottomRow.appendChild(contextWindowItem);
        const maxOutputTokensItem = createNode(
          "div",
          "cp-provider-summary-item",
        );
        maxOutputTokensItem.dataset.field = "maxOutputTokens";
        maxOutputTokensItem.appendChild(
          createNode(
            "span",
            "cp-provider-summary-label",
            strings.maxOutputTokensLabel,
          ),
        );
        const maxOutputTokensShell = createNode(
          "div",
          "cp-provider-inline-control",
        );
        const maxOutputTokensInline = createNode(
          "input",
          `cp-page-input cp-page-input-mono ${SHARED_FRAME_CLASS}`,
        );
        maxOutputTokensInline.type = "text";
        maxOutputTokensInline.inputMode = "numeric";
        maxOutputTokensInline.value = String(
          normalizeMaxOutputTokens(
            profile.maxOutputTokens,
            DEFAULT_MAX_OUTPUT_TOKENS,
          ),
        );
        maxOutputTokensShell.appendChild(maxOutputTokensInline);
        maxOutputTokensItem.appendChild(maxOutputTokensShell);
        maxOutputTokensInline.addEventListener("change", function () {
          handleInlineMaxOutputTokensChange(
            profile,
            maxOutputTokensInline,
          ).catch(function () {});
        });
        maxOutputTokensInline.addEventListener("keydown", function (event) {
          if (event.key === "Enter") {
            event.preventDefault();
            maxOutputTokensInline.blur();
          }
        });
        summaryBottomRow.appendChild(maxOutputTokensItem);
        summary.appendChild(summaryTopRow);
        summary.appendChild(summaryBottomRow);
        const actionRow = createNode("div", "cp-provider-card-actions");
        const activateButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          isActive ? strings.activeProfile : strings.activateProfile,
        );
        activateButton.type = "button";
        activateButton.disabled = isActive;
        activateButton.addEventListener("click", function () {
          handleActivateProfile(profile.id).catch(function () {});
        });
        const healthCheckCardButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.healthCheck,
        );
        healthCheckCardButton.type = "button";
        healthCheckCardButton.addEventListener("click", function () {
          handleCardHealthCheck(profile, healthCheckCardButton).catch(
            function () {},
          );
        });
        const editButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-text-200 border border-border-300 rounded-xl hover:bg-bg-200 hover:text-text-100 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.editProfile,
        );
        editButton.type = "button";
        editButton.addEventListener("click", function () {
          openEditor(profile.id);
        });
        const deleteButton = createNode(
          "button",
          "px-6 py-3 bg-bg-100 text-danger-100 border border-border-300 rounded-xl hover:bg-bg-200 transition-all font-large disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",
          strings.deleteProfile,
        );
        deleteButton.type = "button";
        deleteButton.addEventListener("click", function () {
          handleDeleteProfile(profile.id).catch(function () {});
        });
        actionRow.appendChild(activateButton);
        actionRow.appendChild(healthCheckCardButton);
        actionRow.appendChild(editButton);
        actionRow.appendChild(deleteButton);
        card.appendChild(cardHeader);
        card.appendChild(summary);
        card.appendChild(actionRow);
        profileCardList.appendChild(card);
      });
    }
    function openList(kind, message) {
      closeManualModelDialog();
      state.editorMode = "list";
      state.editingProfileId = null;
      setEditorStatus("", "");
      renderProfileCards();
      updateEditorModeUi();
      if (kind || message) {
        setStatus(listStatus, kind || "", message || "");
      }
    }
    function openEditor(profileId) {
      cleanupCardDropdowns();
      closeManualModelDialog();
      state.editorMode = "edit";
      state.editingProfileId = profileId || null;
      const profile = profileId
        ? state.profiles.find(function (entry) {
            return entry.id === profileId;
          })
        : null;
      writeForm(profile || createEmptyConfig());
      setApiKeyVisibility(false);
      setFetchState(false);
      setHealthCheckState(false);
      setStatus(listStatus, "", "");
      setEditorStatus("", "");
      updateEditorModeUi();
      hydrateCachedModelsForConfig(
        profile || createEmptyConfig(),
        String((profile || createEmptyConfig()).defaultModel || "").trim(),
        String((profile || createEmptyConfig()).fastModel || "").trim(),
      ).catch(function () {});
    }
    function openManualModelDialog() {
      closeActiveDropdown();
      isManualModelDialogOpen = true;
      manualModelOverlay.hidden = false;
      const currentModelId = String(modelSelect.value || "").trim();
      const currentModel =
        state.availableModels.find(function (item) {
          return String(item?.value || "").trim() === currentModelId;
        }) || null;
      manualModelInput.value = currentModelId;
      setManualModelAliasValue(
        String(currentModel?.label || currentModelId || "").trim(),
        true,
      );
      setStatus(manualModelStatus, "", "");
      requestAnimationFrame(function () {
        manualModelInput.focus();
        manualModelInput.select();
      });
    }
    function closeManualModelDialog() {
      isManualModelDialogOpen = false;
      manualModelOverlay.hidden = true;
      setStatus(manualModelStatus, "", "");
    }
    let manualModelAliasAutoValue = "";
    function setManualModelAliasValue(value, isAutoSynced) {
      const nextValue = String(value || "").trim();
      manualModelAliasInput.value = nextValue;
      manualModelAliasAutoValue = nextValue;
      manualModelAliasInput.dataset.autoSynced = isAutoSynced
        ? "true"
        : "false";
    }
    function syncManualModelAliasFromId(force) {
      const modelId = String(manualModelInput.value || "").trim();
      const aliasValue = String(manualModelAliasInput.value || "").trim();
      const isAutoSynced = manualModelAliasInput.dataset.autoSynced !== "false";
      if (
        !force &&
        !isAutoSynced &&
        aliasValue &&
        aliasValue !== manualModelAliasAutoValue
      ) {
        return;
      }
      setManualModelAliasValue(modelId, true);
    }
    function applyManualModel() {
      const modelId = String(manualModelInput.value || "").trim();
      const modelLabel =
        String(manualModelAliasInput.value || "").trim() || modelId;
      if (!modelId) {
        setStatus(manualModelStatus, "error", strings.manualModelIdRequired);
        manualModelInput.focus();
        return;
      }
      const alreadyExists = state.availableModels.some(function (item) {
        return item.value === modelId;
      });
      state.availableModels = mergeModelOptions(state.availableModels, [
        {
          value: modelId,
          label: modelLabel,
          manual: true,
        },
      ]);
      renderModelOptions(modelId);
      closeManualModelDialog();
      setEditorStatus(
        "success",
        alreadyExists ? strings.manualModelSelected : strings.manualModelAdded,
        alreadyExists ? strings.manualModelSelected : strings.manualModelAdded,
      );
    }
    function removeManualModel(modelId) {
      const nextSelectedValue =
        modelSelect.value === modelId ? "" : modelSelect.value;
      state.availableModels = state.availableModels.filter(function (item) {
        return !(item.value === modelId && item.manual);
      });
      renderModelOptions(nextSelectedValue);
      setEditorStatus(
        "success",
        strings.manualModelRemoved,
        strings.manualModelRemoved,
      );
    }
    function setFetchState(isFetching) {
      state.isFetchingModels = isFetching;
      fetchModelsButton.disabled = isFetching;
      fetchModelsButton.textContent = isFetching
        ? strings.fetchingModels
        : strings.fetchModels;
    }
    function setHealthCheckState(isChecking) {
      state.isCheckingHealth = isChecking;
      healthCheckButton.disabled = isChecking;
      healthCheckButton.textContent = isChecking
        ? strings.healthChecking
        : strings.healthCheck;
    }
    function updateModelMeta(message, tone) {
      modelMeta.textContent = message || strings.fetchedModelsHint;
      modelMeta.dataset.tone = tone || "";
    }
    function restoreModelMeta() {
      updateModelMeta(
        state.availableModels.length
          ? strings.fetchedModelsReady
          : strings.fetchedModelsHint,
        state.availableModels.length ? "ready" : "",
      );
    }
    function setEditorStatus(kind, message, fallback) {
      if (!kind) {
        restoreModelMeta();
        return;
      }
      updateModelMeta(
        compactStatusMessage(message, fallback || ""),
        kind === "success"
          ? "ready"
          : kind === "error"
            ? "error"
            : kind === "loading"
              ? "loading"
              : "",
      );
    }
    function renderModelOptions(selectedValue, fastSelectedValue) {
      const resolvedSelectedValue =
        selectedValue === undefined ? modelSelect.value : selectedValue;
      const resolvedFastSelectedValue =
        fastSelectedValue === undefined
          ? fastModelSelect.value
          : fastSelectedValue;
      syncModelOptions(
        modelSelect,
        state.availableModels,
        resolvedSelectedValue,
      );
      syncModelOptions(
        fastModelSelect,
        state.availableModels,
        resolvedFastSelectedValue,
      );
      modelDropdown.refresh();
      fastModelDropdown.refresh();
      restoreModelMeta();
    }
    function clearModels() {
      const currentModel = modelSelect.value;
      const currentFastModel = fastModelSelect.value;
      state.availableModels = [];
      renderModelOptions(currentModel, currentFastModel);
    }
    function updateRequestPreview() {
      const previewUrl =
        buildRequestUrl(baseUrlInput.value, formatSelect.value) || "/messages";
      requestPreview.textContent = strings.requestUrlPrefix + previewUrl;
      requestPreview.dataset.empty = baseUrlInput.value.trim()
        ? "false"
        : "true";
    }
    function syncAuthModeUi(fillDefaults) {
      const isCodex = authModeSelect.value === AUTH_MODE_CODEX;
      apiKeyLabel.textContent = isCodex
        ? strings.codexAuthLabel
        : strings.apiKeyLabel;
      apiKeyInput.placeholder = isCodex
        ? strings.codexAuthPlaceholder
        : strings.apiKeyPlaceholder;
      if (isCodex) {
        if (fillDefaults && !baseUrlInput.value.trim()) {
          baseUrlInput.value = CODEX_DEFAULT_BASE_URL;
        }
        if (formatSelect.value !== OPENAI_RESPONSES_FORMAT) {
          formatSelect.value = OPENAI_RESPONSES_FORMAT;
          formatDropdown.refresh();
        }
      }
      updateRequestPreview();
    }
    function readForm() {
      const next = normalizeConfig(
        {
          name: nameInput.value,
          authMode: authModeSelect.value,
          format: formatSelect.value,
          baseUrl: baseUrlInput.value,
          apiKey: apiKeyInput.value,
          defaultModel: modelSelect.value,
          fastModel: fastModelSelect.value,
          reasoningEffort: reasoningSelect.value,
          maxOutputTokens: readMaxOutputTokensValue(),
          contextWindow: readContextWindowValue(),
          fetchedModels: state.availableModels,
        },
        false,
      );
      next.fetchedModels = Array.isArray(state.availableModels)
        ? state.availableModels.slice()
        : [];
      return next;
    }
    function writeForm(config) {
      const next = normalizeConfig(config, false);
      nameInput.value = next.name || "";
      authModeSelect.value = next.authMode || DEFAULT_AUTH_MODE;
      formatSelect.value = next.format || DEFAULT_FORMAT;
      baseUrlInput.value = next.baseUrl || "";
      apiKeyInput.value = next.apiKey || "";
      authModeDropdown.refresh();
      formatDropdown.refresh();
      syncAuthModeUi(false);
      syncReasoningEditorControls(
        next.reasoningEffort || "medium",
        next.contextWindow,
        next.maxOutputTokens,
      );
      state.availableModels = Array.isArray(next.fetchedModels)
        ? next.fetchedModels.slice()
        : [];
      renderModelOptions(next.defaultModel || "", next.fastModel || "");
      updateRequestPreview();
    }
    async function refresh(resetToList) {
      const stored = await getState();
      applyStoredState(stored);
      setFetchState(false);
      setHealthCheckState(false);
      if (resetToList || state.editorMode === "list") {
        if (resetToList) {
          setStatus(listStatus, "", "");
        }
        openList("", "");
        return;
      }
      if (state.editingProfileId) {
        const profile = state.profiles.find(function (entry) {
          return entry.id === state.editingProfileId;
        });
        if (profile) {
          writeForm(profile);
          await hydrateCachedModelsForConfig(
            profile,
            String(profile.defaultModel || "").trim(),
            String(profile.fastModel || "").trim(),
          );
          updateEditorModeUi();
        } else {
          openList("", "");
        }
      } else {
        writeForm(createEmptyConfig());
        await hydrateCachedModelsForConfig(createEmptyConfig(), "", "");
        updateEditorModeUi();
      }
      setEditorStatus("", "");
    }
    async function handleActivateProfile(profileId) {
      try {
        setStatus(listStatus, "", "");
        const stored = await setActiveProviderProfile(profileId);
        applyStoredState(stored);
        openList("success", strings.profileActivated);
      } catch (error) {
        setStatus(
          listStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.saveFailure,
        );
      }
    }
    async function handleDeleteProfile(profileId) {
      const profile = state.profiles.find(function (entry) {
        return entry.id === profileId;
      });
      const label = getProfileDisplayName(
        profile,
        Math.max(
          0,
          state.profiles.findIndex(function (entry) {
            return entry.id === profileId;
          }),
        ),
      );
      if (
        !window.confirm(strings.deleteProfileConfirm.replace("{name}", label))
      ) {
        return;
      }
      try {
        setStatus(listStatus, "", "");
        const stored = await deleteProviderProfile(profileId);
        applyStoredState(stored);
        openList("success", strings.profileDeleted);
      } catch (error) {
        setStatus(
          listStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.saveFailure,
        );
      }
    }
    function renderDebugMeta() {
      const count = debugState.logs.length;
      if (!count) {
        debugLogsMeta.textContent = strings.debugLogsEmpty;
        debugLogsMeta.dataset.tone = "";
      } else {
        let message = strings.debugLogsCount.replace("{count}", String(count));
        if (debugState.meta && debugState.meta.lastFlushAt) {
          message +=
            " " +
            strings.debugLogsUpdatedPrefix +
            " " +
            formatTimestamp(debugState.meta.lastFlushAt);
        }
        debugLogsMeta.textContent = message;
        debugLogsMeta.dataset.tone = "ready";
      }
      copyLogsButton.disabled = !count;
      downloadLogsButton.disabled = !count;
    }
    function renderDebugToggle(metaNode, toggleNode, enabled, pending) {
      metaNode.textContent = "";
      metaNode.dataset.tone = "";
      metaNode.hidden = true;
      metaNode.setAttribute("aria-hidden", "true");
      toggleNode.dataset.enabled = enabled ? "true" : "false";
      toggleNode.setAttribute("aria-checked", enabled ? "true" : "false");
      toggleNode.disabled = !!pending;
    }
    async function setDebugPreference(options) {
      const {
        storageKey,
        stateKey,
        pendingKey,
        enabled,
        render,
        enabledMessage,
        disabledMessage,
        failureMessage,
      } = options;
      const nextEnabled = !!enabled;
      debugState[pendingKey] = true;
      render();
      try {
        await chrome.storage.local.set({
          [storageKey]: nextEnabled,
        });
        debugState[stateKey] = nextEnabled;
        setStatus(
          debugStatus,
          "success",
          nextEnabled ? enabledMessage : disabledMessage,
        );
      } catch (error) {
        setStatus(
          debugStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : failureMessage,
        );
      } finally {
        debugState[pendingKey] = false;
        render();
      }
    }
    function renderDebugModeToggle() {
      renderDebugToggle(
        debugModeMeta,
        debugModeToggle,
        debugState.debugMode,
        debugState.debugModePending,
      );
    }
    async function setDebugModeEnabled(enabled) {
      await setDebugPreference({
        storageKey: DEBUG_MODE_STORAGE_KEY,
        stateKey: "debugMode",
        pendingKey: "debugModePending",
        enabled,
        render: renderDebugModeToggle,
        enabledMessage: strings.debugEnabled,
        disabledMessage: strings.debugDisabled,
        failureMessage: strings.debugSaveFailure,
      });
    }
    function renderToolResultDetailsToggle() {
      renderDebugToggle(
        toolResultDetailsMeta,
        toolResultDetailsToggle,
        debugState.showToolResultDetails,
        debugState.showToolResultDetailsPending,
      );
    }
    async function setToolResultDetailsEnabled(enabled) {
      await setDebugPreference({
        storageKey: SHOW_TOOL_RESULT_DETAILS_STORAGE_KEY,
        stateKey: "showToolResultDetails",
        pendingKey: "showToolResultDetailsPending",
        enabled,
        render: renderToolResultDetailsToggle,
        enabledMessage: strings.toolResultDetailsEnabled,
        disabledMessage: strings.toolResultDetailsDisabled,
        failureMessage: strings.toolResultDetailsSaveFailure,
      });
    }
    function renderTraceIdsToggle() {
      renderDebugToggle(
        traceIdsMeta,
        traceIdsToggle,
        debugState.showTraceIds,
        debugState.showTraceIdsPending,
      );
    }
    async function setTraceIdsEnabled(enabled) {
      await setDebugPreference({
        storageKey: SHOW_TRACE_IDS_STORAGE_KEY,
        stateKey: "showTraceIds",
        pendingKey: "showTraceIdsPending",
        enabled,
        render: renderTraceIdsToggle,
        enabledMessage: strings.traceIdsEnabled,
        disabledMessage: strings.traceIdsDisabled,
        failureMessage: strings.traceIdsSaveFailure,
      });
    }
    function renderSystemRemindersToggle() {
      renderDebugToggle(
        systemRemindersMeta,
        systemRemindersToggle,
        debugState.showSystemReminders,
        debugState.showSystemRemindersPending,
      );
    }
    async function setSystemRemindersEnabled(enabled) {
      await setDebugPreference({
        storageKey: SHOW_SYSTEM_REMINDERS_STORAGE_KEY,
        stateKey: "showSystemReminders",
        pendingKey: "showSystemRemindersPending",
        enabled,
        render: renderSystemRemindersToggle,
        enabledMessage: strings.systemRemindersEnabled,
        disabledMessage: strings.systemRemindersDisabled,
        failureMessage: strings.systemRemindersSaveFailure,
      });
    }
    async function refreshDebug() {
      const stored = await getDebugState();
      debugState.logs = stored.logs;
      debugState.meta = stored.meta;
      debugState.debugMode = true;
      debugState.debugModePending = false;
      debugState.showTraceIds = !!stored.showTraceIds;
      debugState.showTraceIdsPending = false;
      debugState.showSystemReminders = !!stored.showSystemReminders;
      debugState.showSystemRemindersPending = false;
      debugState.showToolResultDetails = !!stored.showToolResultDetails;
      debugState.showToolResultDetailsPending = false;
      renderDebugMeta();
      renderToolResultDetailsToggle();
      renderTraceIdsToggle();
      renderSystemRemindersToggle();
    }
    async function handleFetchModels() {
      const next = readForm();
      try {
        setFetchState(true);
        setEditorStatus("", "");
        updateModelMeta(strings.fetchedModelsLoading, "loading");
        const fetchedModels = mergeModelOptions(
          await fetchProviderModels(next),
          state.availableModels,
        );
        state.availableModels = await persistFetchedModelsForEditor(
          next,
          fetchedModels,
        );
        renderModelOptions(next.defaultModel || "", next.fastModel || "");
        setEditorStatus("", "");
      } catch (error) {
        renderModelOptions(
          next.defaultModel || modelSelect.value || "",
          next.fastModel || fastModelSelect.value || "",
        );
        restoreModelMeta();
        setEditorStatus(
          "error",
          error && typeof error.message === "string" ? error.message : "",
          strings.fetchFailure,
        );
      } finally {
        setFetchState(false);
      }
    }
    async function handleHealthCheck() {
      const next = readForm();
      try {
        setHealthCheckState(true);
        setEditorStatus("", "");
        updateModelMeta(strings.healthChecking, "loading");
        debugLog("customProvider.health.start", {
          model: next.defaultModel,
          format: next.format,
          baseUrl: next.baseUrl,
        });
        const result = await probeProviderModel(next);
        const preview = truncateStatusText(result?.replyText || "");
        const successMessage = preview
          ? strings.healthCheckSuccess.replace("{reply}", preview)
          : strings.healthCheckSuccessGeneric;
        debugLog("customProvider.health.success", {
          model: next.defaultModel,
          format: result?.format || next.format,
          requestUrl: result?.requestUrl || "",
          replyPreview: preview,
          hasVisibleReply: !!preview,
        });
        restoreModelMeta();
        setEditorStatus(
          "success",
          successMessage,
          strings.healthCheckSuccessGeneric,
        );
      } catch (error) {
        const errorMessage = getReadableErrorMessage(
          error,
          strings.healthCheckFailure,
        );
        debugLog(
          "customProvider.health.failure",
          {
            model: next.defaultModel,
            format: next.format,
            baseUrl: next.baseUrl,
            message: errorMessage,
            error,
          },
          "error",
        );
        restoreModelMeta();
        setEditorStatus("error", errorMessage, strings.healthCheckFailure);
      } finally {
        setHealthCheckState(false);
      }
    }
    addProfileButton.addEventListener("click", function () {
      openEditor(null);
    });
    backToListButton.addEventListener("click", function () {
      openList("", "");
    });
    addWorkflowButton.addEventListener("click", function () {
      openWorkflowEditor(null);
    });
    importWorkflowButton.addEventListener("click", function () {
      openWorkflowImportPicker();
    });
    exportAllWorkflowsButton.addEventListener("click", function () {
      exportWorkflowSet(workflowState.workflows);
    });
    addPromptProfileButton.addEventListener("click", function () {
      openPromptEditor(null);
    });
    workflowBackButton.addEventListener("click", function () {
      openWorkflowList("", "");
    });
    promptBackButton.addEventListener("click", function () {
      openPromptList("", "");
    });
    sessionBrowserBackButton.addEventListener("click", function () {
      handleSessionBrowserBack();
    });
    promptNameInput.addEventListener("input", function () {
      setStatus(promptStatus, "", "");
    });
    promptTextarea.addEventListener("input", function () {
      setStatus(promptStatus, "", "");
    });
    workflowJsonTextarea.addEventListener("input", function () {
      setStatus(workflowStatus, "", "");
    });
    promptForm.addEventListener("submit", function (event) {
      event.preventDefault();
      handlePromptSave().catch(function () {});
    });
    workflowFormatButton.addEventListener("click", function () {
      formatWorkflowEditorJson();
    });
    workflowForm.addEventListener("submit", function (event) {
      event.preventDefault();
      handleWorkflowSave().catch(function () {});
    });
    writePromptForm({
      name: "",
      prompt: DEFAULT_AGENT_ROLE_PROMPT,
    });
    updatePromptEditorModeUi();
    updatePromptControls();
    writeWorkflowEditor(
      buildWorkflowEditorPayload(createEmptyWorkflowDefinition()),
    );
    updateWorkflowEditorModeUi();
    renderSessionCards();
    renderSessionHistoryCards();
    renderSessionRecord();
    updateSessionViewModeUi();
    updateSessionControls();
    refreshSessionsButton.addEventListener("click", function () {
      handleSessionRefresh(true).catch(function () {});
    });
    healthCheckButton.addEventListener("click", function () {
      handleHealthCheck().catch(function () {});
    });
    toolResultDetailsToggle.addEventListener("click", function () {
      if (debugState.showToolResultDetailsPending) {
        return;
      }
      setToolResultDetailsEnabled(!debugState.showToolResultDetails).catch(
        function () {},
      );
    });
    traceIdsToggle.addEventListener("click", function () {
      if (debugState.showTraceIdsPending) {
        return;
      }
      setTraceIdsEnabled(!debugState.showTraceIds).catch(function () {});
    });
    systemRemindersToggle.addEventListener("click", function () {
      if (debugState.showSystemRemindersPending) {
        return;
      }
      setSystemRemindersEnabled(!debugState.showSystemReminders).catch(
        function () {},
      );
    });
    copyLogsButton.addEventListener("click", async function () {
      try {
        await refreshDebug();
        if (!debugState.logs.length) {
          setStatus(debugStatus, "error", strings.debugLogsEmpty);
          return;
        }
        await navigator.clipboard.writeText(
          buildDebugExport(debugState.logs, debugState.meta),
        );
        setStatus(debugStatus, "success", strings.copyLogsSuccess);
      } catch (error) {
        setStatus(
          debugStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.copyLogsFailure,
        );
      }
    });
    downloadLogsButton.addEventListener("click", async function () {
      try {
        await refreshDebug();
        if (!debugState.logs.length) {
          setStatus(debugStatus, "error", strings.debugLogsEmpty);
          return;
        }
        const blob = new Blob(
          [buildDebugExport(debugState.logs, debugState.meta)],
          {
            type: "application/json",
          },
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download =
          "claude-sidepanel-logs-" +
          new Date().toISOString().replace(/[:.]/g, "-") +
          ".json";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 0);
        setStatus(debugStatus, "success", strings.downloadLogsSuccess);
      } catch (error) {
        setStatus(
          debugStatus,
          "error",
          error && typeof error.message === "string"
            ? error.message
            : strings.downloadLogsFailure,
        );
      }
    });
    fetchModelsButton.addEventListener("click", function () {
      handleFetchModels().catch(function () {});
    });
    addModelButton.addEventListener("click", function () {
      openManualModelDialog();
    });
    manualModelCancelButton.addEventListener("click", function () {
      closeManualModelDialog();
    });
    manualModelConfirmButton.addEventListener("click", function () {
      applyManualModel();
    });
    manualModelInput.addEventListener("input", function () {
      syncManualModelAliasFromId(false);
    });
    manualModelAliasInput.addEventListener("input", function () {
      const modelId = String(manualModelInput.value || "").trim();
      const aliasValue = String(manualModelAliasInput.value || "").trim();
      const isStillAutoSynced =
        !aliasValue ||
        aliasValue === modelId ||
        aliasValue === manualModelAliasAutoValue;
      manualModelAliasInput.dataset.autoSynced = isStillAutoSynced
        ? "true"
        : "false";
      if (isStillAutoSynced) {
        manualModelAliasAutoValue = aliasValue;
      }
    });
    manualModelInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applyManualModel();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeManualModelDialog();
      }
    });
    manualModelAliasInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applyManualModel();
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeManualModelDialog();
      }
    });
    manualModelOverlay.addEventListener("click", function (event) {
      if (event.target === manualModelOverlay) {
        closeManualModelDialog();
      }
    });
    sessionBrowserOverlay.addEventListener("click", function (event) {
      if (event.target === sessionBrowserOverlay) {
        closeSessionRecordDialog();
      }
    });
    const handleWindowKeydown = function (event) {
      if (event.key === "Escape" && isManualModelDialogOpen) {
        closeManualModelDialog();
        return;
      }
      if (event.key === "Escape" && sessionState.viewMode === "record") {
        closeSessionRecordDialog();
      }
    };
    window.addEventListener("keydown", handleWindowKeydown);
    modelSelect.addEventListener("change", function () {
      setEditorStatus("", "");
    });
    reasoningSelect.addEventListener("change", function () {
      setEditorStatus("", "");
    });
    maxOutputTokensInput.addEventListener("input", function () {
      setEditorStatus("", "");
    });
    maxOutputTokensInput.addEventListener("change", function () {
      maxOutputTokensInput.value = formatMaxOutputTokensForInput(
        readMaxOutputTokensValue(),
      );
      setEditorStatus("", "");
    });
    contextWindowInput.addEventListener("input", function () {
      contextWindowInput.style.width = getContextWindowInputWidth(
        contextWindowInput.value,
        contextWindowInput.placeholder,
      );
      setEditorStatus("", "");
    });
    contextWindowInput.addEventListener("change", function () {
      contextWindowInput.value = formatContextWindowForInput(
        readContextWindowValue(),
      );
      contextWindowInput.style.width = getContextWindowInputWidth(
        contextWindowInput.value,
        contextWindowInput.placeholder,
      );
      setEditorStatus("", "");
    });
    contextWindowInput.addEventListener("keydown", function (event) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        adjustContextWindowValue(CONTEXT_WINDOW_STEP_K);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        adjustContextWindowValue(-CONTEXT_WINDOW_STEP_K);
      }
    });
    contextWindowStepUp.addEventListener("click", function () {
      adjustContextWindowValue(CONTEXT_WINDOW_STEP_K);
      contextWindowInput.focus({
        preventScroll: true,
      });
    });
    contextWindowStepDown.addEventListener("click", function () {
      adjustContextWindowValue(-CONTEXT_WINDOW_STEP_K);
      contextWindowInput.focus({
        preventScroll: true,
      });
    });
    [authModeSelect, formatSelect, baseUrlInput, apiKeyInput].forEach(function (node) {
      node.addEventListener("change", clearModels);
      node.addEventListener("input", function () {
        if (state.availableModels.length) {
          clearModels();
        }
        hydrateCachedModelsForConfig(readForm(), modelSelect.value || "").catch(
          function () {},
        );
      });
      node.addEventListener("change", function () {
        hydrateCachedModelsForConfig(readForm(), modelSelect.value || "").catch(
          function () {},
        );
      });
    });
    authModeSelect.addEventListener("change", function () {
      syncAuthModeUi(true);
      hydrateCachedModelsForConfig(readForm(), modelSelect.value || "").catch(
        function () {},
      );
    });
    [formatSelect, baseUrlInput].forEach(function (node) {
      node.addEventListener("change", updateRequestPreview);
      node.addEventListener("input", updateRequestPreview);
    });
    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const next = readForm();
      if (!next.baseUrl) {
        setEditorStatus(
          "error",
          strings.baseUrlRequired,
          strings.baseUrlRequired,
        );
        baseUrlInput.focus();
        return;
      }
      if (!next.apiKey) {
        setEditorStatus(
          "error",
          strings.apiKeyRequired,
          strings.apiKeyRequired,
        );
        apiKeyInput.focus();
        return;
      }
      if (!next.defaultModel) {
        setEditorStatus(
          "error",
          strings.defaultModelRequired,
          strings.defaultModelRequired,
        );
        modelSelect.focus();
        return;
      }
      try {
        saveButton.disabled = true;
        const stored = await saveConfig(next, state);
        applyStoredState(stored);
        openList("success", strings.saveSuccessEnabled);
      } catch (error) {
        setEditorStatus(
          "error",
          error && typeof error.message === "string" ? error.message : "",
          strings.saveFailure,
        );
      } finally {
        saveButton.disabled = false;
      }
    });
    let lastHost = null;
    let syncScheduled = false;
    let syncInFlight = false;
    let syncPending = false;
    let observer = null;
    const handleStorageChange = function (changes, areaName) {
      if (areaName !== "local") {
        return;
      }
      if (
        PREFERRED_LOCALE_STORAGE_KEY in changes &&
        applyPreferredUiLocaleKey(
          changes[PREFERRED_LOCALE_STORAGE_KEY]?.newValue,
        )
      ) {
        scheduleUiRebuild();
        return;
      }
      const hasSessionChange = Object.keys(changes).some(function (key) {
        return String(key || "").startsWith(CHAT_SCOPE_PREFIX);
      });
      if (
        DEBUG_LOGS_KEY in changes ||
        DEBUG_META_KEY in changes ||
        DEBUG_MODE_STORAGE_KEY in changes ||
        SHOW_TRACE_IDS_STORAGE_KEY in changes ||
        SHOW_SYSTEM_REMINDERS_STORAGE_KEY in changes ||
        SHOW_TOOL_RESULT_DETAILS_STORAGE_KEY in changes
      ) {
        refreshDebug().catch(function () {});
      }
      if (
        PROMPT_PROFILES_STORAGE_KEY in changes ||
        PROMPT_ACTIVE_PROFILE_STORAGE_KEY in changes ||
        SYSTEM_PROMPT_STORAGE_KEY in changes
      ) {
        if (isPromptViewActive()) {
          refreshPromptProfiles(false).catch(function () {});
        }
      }
      if (WORKFLOW_STORAGE_KEY in changes) {
        if (isWorkflowViewActive()) {
          refreshWorkflows(false).catch(function () {});
        }
      }
      if (
        STORAGE_KEY in changes ||
        PROFILES_STORAGE_KEY in changes ||
        ACTIVE_PROFILE_STORAGE_KEY in changes ||
        BACKUP_KEY in changes ||
        ANTHROPIC_API_KEY_STORAGE_KEY in changes
      ) {
        if (isProviderViewActive()) {
          refresh(false).catch(function () {});
        }
      }
      if (hasSessionChange && isSessionViewActive()) {
        refreshSessions().catch(function () {});
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    function syncSubviewVisibility() {
      const providerActive = isProviderViewActive();
      const workflowActive = isWorkflowViewActive();
      const sessionActive = isSessionViewActive();
      const promptActive = isPromptViewActive();
      providerRoot.hidden = !providerActive;
      workflowRoot.hidden = !workflowActive;
      sessionRoot.hidden = !sessionActive;
      promptRoot.hidden = !promptActive;
      if (!providerActive && !promptActive) {
        closeManualModelDialog();
      }
      if (!sessionActive && sessionState.viewMode === "record") {
        closeSessionRecordDialog();
      }
      return {
        providerActive,
        workflowActive,
        sessionActive,
        promptActive,
      };
    }
    async function syncMount() {
      const nextLocaleKey = getUiLocaleKey();
      if (nextLocaleKey !== localeKey) {
        debugLog("customProvider.locale.changed", {
          from: localeKey,
          to: nextLocaleKey,
          hash: location.hash,
        });
        scheduleUiRebuild();
        return;
      }
      const { providerActive, workflowActive, sessionActive, promptActive } =
        syncSubviewVisibility();
      const providerHost = findMountAnchor(PROVIDER_ANCHOR_ID);
      const sessionHost = findMountAnchor(SESSION_ANCHOR_ID);
      const promptHost = findMountAnchor(PROMPT_ANCHOR_ID);
      const debugHost = findMountAnchor(DEBUG_ANCHOR_ID);
      if (!isOptionsTabActive()) {
        closeManualModelDialog();
        closeSessionRecordDialog();
        debugLog("customProvider.syncMount.skip", {
          reason: "not-options-tab",
          hash: location.hash,
        });
        if (providerRoot.parentNode) {
          providerRoot.remove();
        }
        if (workflowRoot.parentNode) {
          workflowRoot.remove();
        }
        if (sessionRoot.parentNode) {
          sessionRoot.remove();
        }
        if (promptRoot.parentNode) {
          promptRoot.remove();
        }
        if (debugMountRoot.parentNode) {
          debugMountRoot.remove();
        }
        lastHost = null;
        return;
      }
      if (!providerHost || !sessionHost || !promptHost || !debugHost) {
        closeManualModelDialog();
        closeSessionRecordDialog();
        if (providerRoot.parentNode) {
          providerRoot.remove();
        }
        if (workflowRoot.parentNode) {
          workflowRoot.remove();
        }
        if (sessionRoot.parentNode) {
          sessionRoot.remove();
        }
        if (promptRoot.parentNode) {
          promptRoot.remove();
        }
        if (debugMountRoot.parentNode) {
          debugMountRoot.remove();
        }
        lastHost = null;
        return;
      }
      const providerNeedsRefresh = providerRoot.parentNode !== providerHost;
      const workflowNeedsRefresh = workflowRoot.parentNode !== providerHost;
      const sessionNeedsRefresh = sessionRoot.parentNode !== sessionHost;
      const promptNeedsRefresh = promptRoot.parentNode !== promptHost;
      const debugNeedsRefresh = debugMountRoot.parentNode !== debugHost;
      debugLog("customProvider.syncMount.host", {
        providerActive,
        workflowActive,
        sessionActive,
        promptActive,
        providerNeedsRefresh,
        workflowNeedsRefresh,
        sessionNeedsRefresh,
        promptNeedsRefresh,
        debugNeedsRefresh,
        providerHostTag: providerHost.tagName,
        sessionHostTag: sessionHost.tagName,
        promptHostTag: promptHost.tagName,
        debugHostTag: debugHost.tagName,
      });
      if (providerRoot.parentNode !== providerHost) {
        providerHost.appendChild(providerRoot);
      }
      if (workflowRoot.parentNode !== providerHost) {
        providerHost.appendChild(workflowRoot);
      }
      if (sessionRoot.parentNode !== sessionHost) {
        sessionHost.appendChild(sessionRoot);
      }
      if (promptRoot.parentNode !== promptHost) {
        promptHost.appendChild(promptRoot);
      }
      if (debugMountRoot.parentNode !== debugHost) {
        debugHost.appendChild(debugMountRoot);
      }
      lastHost =
        providerActive || workflowActive
          ? providerHost
          : sessionActive
            ? sessionHost
            : promptActive
              ? promptHost
              : debugHost;
      const refreshTasks = [];
      if (providerNeedsRefresh) {
        refreshTasks.push(refresh(true));
      }
      if (workflowNeedsRefresh) {
        refreshTasks.push(refreshWorkflows(true));
      }
      if (sessionNeedsRefresh) {
        refreshTasks.push(refreshSessions());
      }
      if (promptNeedsRefresh) {
        refreshTasks.push(refreshPromptProfiles(true));
      }
      if (debugNeedsRefresh) {
        refreshTasks.push(refreshDebug());
      }
      if (refreshTasks.length) {
        await Promise.allSettled(refreshTasks);
        debugLog("customProvider.syncMount.refreshed", {
          providerActive,
          workflowActive,
          sessionActive,
          promptActive,
          refreshCount: refreshTasks.length,
        });
      }
    }
    function resumeObserver() {
      if (!observer) {
        return;
      }
      observer.disconnect();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
    function runSyncMount(reason) {
      if (syncInFlight) {
        syncPending = true;
        return;
      }
      syncScheduled = false;
      syncInFlight = true;
      if (observer) {
        observer.disconnect();
      }
      debugLog("customProvider.syncMount.run", {
        reason,
        hash: location.hash,
      });
      syncMount()
        .catch(function (error) {
          debugLog(
            "customProvider.syncMount.error",
            {
              reason,
              error,
            },
            "error",
          );
        })
        .finally(function () {
          syncInFlight = false;
          resumeObserver();
          if (syncPending) {
            syncPending = false;
            queueSyncMount("pending");
          }
        });
    }
    function queueSyncMount(reason) {
      if (syncInFlight) {
        syncPending = true;
        return;
      }
      if (syncScheduled) {
        return;
      }
      syncScheduled = true;
      const scheduler =
        typeof requestAnimationFrame === "function"
          ? requestAnimationFrame
          : function (callback) {
              return setTimeout(callback, 16);
            };
      scheduler(function () {
        runSyncMount(reason);
      });
    }
    observer = new MutationObserver(function () {
      queueSyncMount("mutation");
    });
    resumeObserver();
    const handleHashChange = function () {
      syncSubviewVisibility();
      queueSyncMount("hashchange");
    };
    window.addEventListener("hashchange", handleHashChange);
    activeUiCleanup = function () {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      chrome.storage.onChanged.removeListener(handleStorageChange);
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("keydown", handleWindowKeydown);
      clearDeferredUiLocaleCheck();
      cleanupCardDropdowns();
      closeManualModelDialog();
      closeActiveDropdown();
      if (providerRoot.parentNode) {
        providerRoot.remove();
      }
      if (workflowRoot.parentNode) {
        workflowRoot.remove();
      }
      if (sessionRoot.parentNode) {
        sessionRoot.remove();
      }
      if (promptRoot.parentNode) {
        promptRoot.remove();
      }
      if (debugMountRoot.parentNode) {
        debugMountRoot.remove();
      }
      if (sessionBrowserOverlay.parentNode) {
        sessionBrowserOverlay.remove();
      }
      lastHost = null;
    };
    queueSyncMount("initial");
    debugLog("customProvider.buildUi.done", {
      hash: location.hash,
    });
  }
  const handleExternalUiLocaleChanged = function () {
    scheduleDeferredUiLocaleCheck(1);
  };
  async function bootstrapUi() {
    window.addEventListener("cp:ui-locale-changed", handleExternalUiLocaleChanged);
    applyPreferredUiLocaleKey(await readStoredPreferredUiLocaleKey());
    await buildUiForCurrentLocale();
    scheduleDeferredUiLocaleCheck(20);
  }
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        bootstrapUi().catch(function (error) {
          debugLog(
            "customProvider.bootstrap.error",
            {
              error,
            },
            "error",
          );
        });
      },
      {
        once: true,
      },
    );
  } else {
    bootstrapUi().catch(function (error) {
      debugLog(
        "customProvider.bootstrap.error",
        {
          error,
        },
        "error",
      );
    });
  }
})();
