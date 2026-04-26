(function () {
  const contract = globalThis.__CP_CONTRACT__?.customProvider || {};
  const ANTHROPIC_FORMAT = "anthropic";
  const OPENAI_CHAT_FORMAT = "openai_chat";
  const OPENAI_RESPONSES_FORMAT = "openai_responses";
  const DEFAULT_FORMAT = ANTHROPIC_FORMAT;
  const AUTH_MODE_API_KEY = "api_key";
  const AUTH_MODE_CODEX = "codex";
  const DEFAULT_AUTH_MODE = AUTH_MODE_API_KEY;
  const CODEX_DEFAULT_BASE_URL = "https://chatgpt.com/backend-api/codex";
  const CODEX_REFRESH_TOKEN_URL = "https://auth.openai.com/oauth/token";
  const CODEX_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
  const CODEX_MODELS_CLIENT_VERSION = "0.125.0-alpha.3";
  const CODEX_ACCESS_TOKEN_REFRESH_SKEW_MS = 120000;
  const DEFAULT_CONTEXT_WINDOW = 200000;
  const DEFAULT_MAX_OUTPUT_TOKENS = 10000;
  const MIN_CONTEXT_WINDOW = 20000;
  const FETCH_TIMEOUT_MS = 15000;
  const REASONING_EFFORT_VALUES = ["none", "low", "medium", "high", "max"];
  const LEGACY_STORAGE_KEY = contract.STORAGE_KEY || "customProviderConfig";
  const PROFILES_STORAGE_KEY =
    contract.PROFILES_STORAGE_KEY || "customProviderProfiles";
  const ACTIVE_PROFILE_STORAGE_KEY =
    contract.ACTIVE_PROFILE_STORAGE_KEY || "customProviderActiveProfileId";
  const BACKUP_KEY = contract.BACKUP_KEY || "customProviderOriginalApiKey";
  const ANTHROPIC_API_KEY_STORAGE_KEY =
    contract.ANTHROPIC_API_KEY_STORAGE_KEY || "anthropicApiKey";
  const FETCHED_MODELS_CACHE_KEY =
    contract.FETCHED_MODELS_CACHE_KEY || "customProviderFetchedModelsCache";
  const SELECTED_MODEL_STORAGE_KEY =
    contract.SELECTED_MODEL_STORAGE_KEY || "selectedModel";
  const SELECTED_MODEL_QUICK_MODE_STORAGE_KEY =
    contract.SELECTED_MODEL_QUICK_MODE_STORAGE_KEY || "selectedModelQuickMode";
  const MODEL_SELECTION_SYNC_SIGNATURE_KEY =
    contract.MODEL_SELECTION_SYNC_SIGNATURE_KEY ||
    "customProviderSelectedModelSyncSignature";
  const QUICK_MODEL_SELECTION_SYNC_SIGNATURE_KEY =
    contract.QUICK_MODEL_SELECTION_SYNC_SIGNATURE_KEY ||
    "customProviderSelectedModelQuickModeSyncSignature";
  const HTTP_PROVIDER_STORAGE_KEY =
    contract.HTTP_PROVIDER_STORAGE_KEY || "customProviderAllowHttp";
  const HTTP_PROVIDER_MIGRATED_KEY =
    contract.HTTP_PROVIDER_MIGRATED_KEY || "customProviderAllowHttpMigrated";
  const DEFAULT_HTTP_PROVIDER_ENABLED = true;
  const HTTP_PROVIDER_DISABLED_MESSAGE =
    "HTTP 协议未启用。请前往 Options 打开“允许 HTTP 协议”后再使用 http:// 地址。";
  const FETCHED_MODELS_CACHE_LIMIT = 24;
  const HEALTH_CHECK_PROMPT = "Reply with OK only.";
  const HEALTH_CHECK_MAX_TOKENS = 64;
  function normalizeAuthMode(value) {
    const mode = String(value || "")
      .trim()
      .toLowerCase();
    if (
      mode === AUTH_MODE_CODEX ||
      mode === "chatgpt" ||
      mode === "codex_login" ||
      mode === "codex-chatgpt"
    ) {
      return AUTH_MODE_CODEX;
    }
    return AUTH_MODE_API_KEY;
  }
  function normalizeFormat(value) {
    const format = String(value || "")
      .trim()
      .toLowerCase();
    if (!format || format === ANTHROPIC_FORMAT) {
      return ANTHROPIC_FORMAT;
    }
    if (format === "openai" || format === OPENAI_CHAT_FORMAT) {
      return OPENAI_CHAT_FORMAT;
    }
    if (format === "responses" || format === OPENAI_RESPONSES_FORMAT) {
      return OPENAI_RESPONSES_FORMAT;
    }
    return DEFAULT_FORMAT;
  }
  function parseJsonObject(value) {
    const text = String(value || "").trim();
    if (!text || !/^[\[{]/.test(text)) {
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  function decodeBase64UrlJson(value) {
    const text = String(value || "").trim();
    if (!text) {
      return null;
    }
    try {
      const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const decoded =
        typeof globalThis.atob === "function" ? globalThis.atob(padded) : "";
      if (!decoded) {
        return null;
      }
      const jsonText = decodeURIComponent(
        decoded
          .split("")
          .map(function (char) {
            return "%" + char.charCodeAt(0).toString(16).padStart(2, "0");
          })
          .join(""),
      );
      const parsed = JSON.parse(jsonText);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }
  function decodeJwtPayload(token) {
    const parts = String(token || "").split(".");
    if (parts.length < 2) {
      return null;
    }
    return decodeBase64UrlJson(parts[1]);
  }
  function extractCodexAccountIdFromPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }
    const directCandidates = [
      payload.account_id,
      payload.chatgpt_account_id,
      payload["chatgpt_account_id"],
    ];
    for (const candidate of directCandidates) {
      const value = String(candidate || "").trim();
      if (value) {
        return value;
      }
    }
    const authClaim = payload["https://api.openai.com/auth"];
    if (authClaim && typeof authClaim === "object") {
      return extractCodexAccountIdFromPayload(authClaim);
    }
    return "";
  }
  function extractCodexAccountIdFromToken(token) {
    return extractCodexAccountIdFromPayload(decodeJwtPayload(token));
  }
  function normalizeCodexAuthPayload(rawApiKey, source) {
    const raw = String(rawApiKey || "").trim();
    const parsed = parseJsonObject(raw);
    const tokenSource =
      parsed?.tokens && typeof parsed.tokens === "object"
        ? parsed.tokens
        : parsed && typeof parsed === "object"
          ? parsed
          : {};
    const accessToken = String(
      tokenSource.access_token || tokenSource.accessToken || raw,
    ).trim();
    const refreshToken = String(
      tokenSource.refresh_token ||
        tokenSource.refreshToken ||
        source?.codexRefreshToken ||
        source?.refreshToken ||
        "",
    ).trim();
    const idToken = String(
      tokenSource.id_token || tokenSource.idToken || source?.codexIdToken || "",
    ).trim();
    const accountId = String(
      tokenSource.account_id ||
        tokenSource.accountId ||
        source?.codexAccountId ||
        source?.accountId ||
        extractCodexAccountIdFromToken(idToken) ||
        extractCodexAccountIdFromToken(accessToken) ||
        "",
    ).trim();
    const lastRefresh = String(
      parsed?.last_refresh ||
        parsed?.lastRefresh ||
        source?.codexLastRefresh ||
        source?.lastRefresh ||
        "",
    ).trim();
    return {
      apiKey: accessToken,
      codexAccountId: accountId,
      codexRefreshToken: refreshToken,
      codexLastRefresh: lastRefresh,
    };
  }
  function isCodexAuthConfig(config) {
    return normalizeAuthMode(config?.authMode) === AUTH_MODE_CODEX;
  }
  function inferFormat(source) {
    const explicitFormat = String(source?.format || "").trim();
    if (explicitFormat) {
      return normalizeFormat(explicitFormat);
    }
    const baseUrl = String(source?.baseUrl || "")
      .trim()
      .toLowerCase();
    if (/\/responses$/i.test(baseUrl)) {
      return OPENAI_RESPONSES_FORMAT;
    }
    if (/\/chat\/completions$/i.test(baseUrl)) {
      return OPENAI_CHAT_FORMAT;
    }
    const name = String(source?.name || "")
      .trim()
      .toLowerCase();
    const model = String(source?.defaultModel || "")
      .trim()
      .toLowerCase();
    if (
      name.includes("openai") ||
      name.includes("gpt") ||
      model.startsWith("gpt-") ||
      model.startsWith("chatgpt") ||
      (model.length > 1 && model.startsWith("o") && /\d/.test(model[1]))
    ) {
      return OPENAI_CHAT_FORMAT;
    }
    return DEFAULT_FORMAT;
  }
  function normalizeReasoningEffort(value) {
    const effort = String(value || "")
      .trim()
      .toLowerCase();
    return REASONING_EFFORT_VALUES.includes(effort) ? effort : "medium";
  }
  function normalizeContextWindow(value) {
    const numeric = Number(String(value ?? "").trim());
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return DEFAULT_CONTEXT_WINDOW;
    }
    return Math.max(MIN_CONTEXT_WINDOW, Math.round(numeric));
  }
  function normalizeMaxOutputTokens(value, fallbackValue) {
    const numeric = Number(String(value ?? "").trim());
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return fallbackValue || DEFAULT_MAX_OUTPUT_TOKENS;
    }
    return Math.max(1, Math.round(numeric));
  }
  function normalizeConfig(raw, fallbackEnabled) {
    const source = raw && typeof raw === "object" ? raw : {};
    const authMode = normalizeAuthMode(source.authMode);
    const codexAuth =
      authMode === AUTH_MODE_CODEX
        ? normalizeCodexAuthPayload(source.apiKey, source)
        : null;
    return {
      id: String(source.id || "").trim(),
      name: String(source.name || "").trim(),
      authMode,
      format:
        authMode === AUTH_MODE_CODEX ? OPENAI_RESPONSES_FORMAT : inferFormat(source),
      baseUrl: String(
        source.baseUrl || (authMode === AUTH_MODE_CODEX ? CODEX_DEFAULT_BASE_URL : ""),
      )
        .trim()
        .replace(/\/+$/, ""),
      apiKey:
        authMode === AUTH_MODE_CODEX
          ? codexAuth.apiKey
          : String(source.apiKey || "").trim(),
      codexAccountId:
        authMode === AUTH_MODE_CODEX ? codexAuth.codexAccountId : "",
      codexRefreshToken:
        authMode === AUTH_MODE_CODEX ? codexAuth.codexRefreshToken : "",
      codexLastRefresh:
        authMode === AUTH_MODE_CODEX ? codexAuth.codexLastRefresh : "",
      defaultModel: String(source.defaultModel || "").trim(),
      fastModel: String(
        source.fastModel || source.small_fast_model || "",
      ).trim(),
      reasoningEffort: normalizeReasoningEffort(source.reasoningEffort),
      maxOutputTokens: normalizeMaxOutputTokens(source.maxOutputTokens),
      contextWindow: normalizeContextWindow(source.contextWindow),
      fetchedModels: normalizeFetchedModels(source.fetchedModels),
    };
  }
  function isHttpBaseUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return false;
    }
    try {
      return String(new URL(raw).protocol || "").toLowerCase() === "http:";
    } catch {
      return /^http:\/\//i.test(raw);
    }
  }
  function createEmptyConfig() {
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
  }
  function joinUrl(baseUrl, suffix) {
    return `${String(baseUrl || "").replace(/\/+$/, "")}/${String(suffix || "").replace(/^\/+/, "")}`;
  }
  function buildModelsUrl(config) {
    const next = normalizeConfig(config);
    const url = joinUrl(next.baseUrl, "models");
    if (!isCodexAuthConfig(next)) {
      return url;
    }
    const separator = url.includes("?") ? "&" : "?";
    return (
      url +
      separator +
      "client_version=" +
      encodeURIComponent(CODEX_MODELS_CLIENT_VERSION)
    );
  }
  function buildRequestUrl(baseUrl, format) {
    const normalizedBaseUrl = String(baseUrl || "")
      .trim()
      .replace(/\/+$/, "");
    const normalizedFormat = normalizeFormat(format);
    if (!normalizedBaseUrl) {
      return "";
    }
    if (normalizedFormat === OPENAI_CHAT_FORMAT) {
      if (/\/chat\/completions$/i.test(normalizedBaseUrl)) {
        return normalizedBaseUrl;
      } else {
        return normalizedBaseUrl + "/chat/completions";
      }
    }
    if (normalizedFormat === OPENAI_RESPONSES_FORMAT) {
      if (/\/responses$/i.test(normalizedBaseUrl)) {
        return normalizedBaseUrl;
      } else {
        return normalizedBaseUrl + "/responses";
      }
    }
    if (/\/messages$/i.test(normalizedBaseUrl)) {
      return normalizedBaseUrl;
    } else {
      return normalizedBaseUrl + "/messages";
    }
  }
  function extractErrorMessage(payload, fallback) {
    if (typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }
    if (!payload || typeof payload !== "object") {
      return fallback;
    }
    const candidates = [
      payload.error,
      payload.message,
      payload.detail,
      payload.title,
      payload.reason,
      payload.msg,
      payload.err_msg,
      payload.error_msg,
      payload.statusText,
      payload.responseText,
      payload.base_resp,
      payload.baseResp,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
      if (candidate && typeof candidate === "object") {
        const nested = [
          candidate.message,
          candidate.error,
          candidate.detail,
          candidate.type,
          candidate.reason,
          candidate.msg,
          candidate.err_msg,
          candidate.error_msg,
          candidate.status_msg,
          candidate.statusMessage,
        ];
        for (const item of nested) {
          if (typeof item === "string" && item.trim()) {
            return item.trim();
          }
        }
      }
    }
    return fallback;
  }
  function sortModels(models) {
    const conversationalHints = [
      "claude",
      "gpt",
      "o1",
      "o3",
      "o4",
      "o5",
      "sonnet",
      "opus",
      "haiku",
      "chat",
    ];
    function score(model) {
      const value = String(model?.value || "").toLowerCase();
      if (conversationalHints.some((hint) => value.includes(hint))) {
        return 0;
      } else {
        return 1;
      }
    }
    return [...models].sort((left, right) => {
      const leftScore = score(left);
      const rightScore = score(right);
      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }
      return String(left.label || left.value).localeCompare(
        String(right.label || right.value),
        "en",
      );
    });
  }
  function dedupeModels(models) {
    const map = new Map();
    for (const item of models || []) {
      const value = String(item?.value || "").trim();
      if (!value) {
        continue;
      }
      if (!map.has(value)) {
        map.set(value, {
          value,
          label: String(item?.label || value).trim() || value,
          manual: !!item?.manual,
        });
      }
    }
    return sortModels(Array.from(map.values()));
  }
  function normalizeFetchedModels(models) {
    const map = new Map();
    for (const item of models || []) {
      const value = String(item?.value || item?.model || "").trim();
      if (!value) {
        continue;
      }
      const current = map.get(value);
      if (!current) {
        map.set(value, {
          value,
          label: String(item?.label || item?.name || value).trim() || value,
          manual: !!item?.manual,
        });
      } else if (item?.manual) {
        current.manual = true;
      }
    }
    return sortModels(Array.from(map.values()));
  }
  function hashProviderCacheKey(value) {
    let hash = 2166136261;
    const text = String(value || "");
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(36);
  }
  function buildFetchedModelsCacheEntryKey(config) {
    const next = normalizeConfig(config);
    if (!next.baseUrl || !next.apiKey) {
      return "";
    }
    const credentialKey =
      next.authMode === AUTH_MODE_CODEX
        ? next.codexAccountId || next.codexRefreshToken || next.apiKey
        : next.apiKey;
    return (
      "provider_" +
      hashProviderCacheKey(
        [next.authMode, next.format, next.baseUrl, credentialKey].join("\n"),
      )
    );
  }
  function normalizeFetchedModelsCache(raw) {
    const source = raw && typeof raw === "object" ? raw : {};
    const entries = {};
    for (const [key, entry] of Object.entries(source)) {
      if (!key) {
        continue;
      }
      const models = normalizeFetchedModels(entry?.models);
      if (!models.length) {
        continue;
      }
      entries[key] = {
        models,
        updatedAt: Number.isFinite(entry?.updatedAt) ? entry.updatedAt : 0,
      };
    }
    return entries;
  }
  async function readFetchedModelsCache(options) {
    const settings = options && typeof options === "object" ? options : {};
    const storage = settings.storageArea || globalThis.chrome?.storage?.local;
    if (!storage) {
      return {};
    }
    const stored = await storage.get(FETCHED_MODELS_CACHE_KEY);
    return normalizeFetchedModelsCache(stored[FETCHED_MODELS_CACHE_KEY]);
  }
  async function readCachedFetchedModels(config, options) {
    const cacheKey = buildFetchedModelsCacheEntryKey(config);
    if (!cacheKey) {
      return [];
    }
    const cache = await readFetchedModelsCache(options);
    return normalizeFetchedModels(cache[cacheKey]?.models);
  }
  async function persistFetchedModelsForConfig(config, models, options) {
    const cacheKey = buildFetchedModelsCacheEntryKey(config);
    const normalizedModels = normalizeFetchedModels(models);
    if (!cacheKey || !normalizedModels.length) {
      return normalizedModels;
    }
    const settings = options && typeof options === "object" ? options : {};
    const storage = settings.storageArea || globalThis.chrome?.storage?.local;
    if (!storage) {
      return normalizedModels;
    }
    const cache = await readFetchedModelsCache({
      storageArea: storage,
    });
    cache[cacheKey] = {
      models: normalizedModels,
      updatedAt: Date.now(),
    };
    const prunedEntries = Object.entries(cache)
      .sort(function (left, right) {
        return (right[1]?.updatedAt || 0) - (left[1]?.updatedAt || 0);
      })
      .slice(0, FETCHED_MODELS_CACHE_LIMIT);
    await storage.set({
      [FETCHED_MODELS_CACHE_KEY]: Object.fromEntries(prunedEntries),
    });
    return normalizedModels;
  }
  function createProfileId() {
    return (
      "provider_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(36).slice(2, 8)
    );
  }
  function normalizeProfile(raw) {
    const config = normalizeConfig(raw);
    return {
      id: String(raw?.id || "").trim() || createProfileId(),
      name: String(raw?.name || "").trim(),
      authMode: config.authMode,
      format: config.format,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      codexAccountId: config.codexAccountId,
      codexRefreshToken: config.codexRefreshToken,
      codexLastRefresh: config.codexLastRefresh,
      defaultModel: config.defaultModel,
      fastModel: config.fastModel,
      reasoningEffort: config.reasoningEffort,
      maxOutputTokens: config.maxOutputTokens,
      contextWindow: config.contextWindow,
      fetchedModels: normalizeFetchedModels(raw?.fetchedModels),
    };
  }
  function hasUsableConfig(raw) {
    const config = normalizeConfig(raw);
    return !!(config.baseUrl && config.apiKey && config.defaultModel);
  }
  function hasDeprecatedProviderFields(raw) {
    const source = raw && typeof raw === "object" ? raw : null;
    return !!source && ("enabled" in source || "notes" in source);
  }
  function hasConfigContent(raw) {
    const config = normalizeConfig(raw);
    return !!(
      config.name ||
      config.authMode !== DEFAULT_AUTH_MODE ||
      config.baseUrl ||
      config.apiKey ||
      config.defaultModel ||
      config.fastModel ||
      normalizeFetchedModels(raw?.fetchedModels).length
    );
  }
  function projectProfileToConfig(profile) {
    if (!profile) {
      return createEmptyConfig();
    }
    return {
      name: String(profile.name || "").trim(),
      authMode: normalizeAuthMode(profile.authMode),
      format: isCodexAuthConfig(profile)
        ? OPENAI_RESPONSES_FORMAT
        : normalizeFormat(profile.format),
      baseUrl: String(
        profile.baseUrl ||
          (isCodexAuthConfig(profile) ? CODEX_DEFAULT_BASE_URL : ""),
      )
        .trim()
        .replace(/\/+$/, ""),
      apiKey: String(profile.apiKey || "").trim(),
      codexAccountId: isCodexAuthConfig(profile)
        ? String(profile.codexAccountId || "").trim()
        : "",
      codexRefreshToken: isCodexAuthConfig(profile)
        ? String(profile.codexRefreshToken || "").trim()
        : "",
      codexLastRefresh: isCodexAuthConfig(profile)
        ? String(profile.codexLastRefresh || "").trim()
        : "",
      defaultModel: String(profile.defaultModel || "").trim(),
      fastModel: String(profile.fastModel || "").trim(),
      reasoningEffort: normalizeReasoningEffort(profile.reasoningEffort),
      maxOutputTokens: normalizeMaxOutputTokens(profile.maxOutputTokens),
      contextWindow: normalizeContextWindow(profile.contextWindow),
      fetchedModels: normalizeFetchedModels(profile.fetchedModels),
    };
  }
  function hasLegacyActiveHttpProvider(stored) {
    const source = stored && typeof stored === "object" ? stored : {};
    const profiles = Array.isArray(source[PROFILES_STORAGE_KEY])
      ? source[PROFILES_STORAGE_KEY].map(normalizeProfile)
      : [];
    const activeProfileId = resolveActiveProfileId(
      profiles,
      source[ACTIVE_PROFILE_STORAGE_KEY],
    );
    const activeProfile =
      profiles.find(function (profile) {
        return profile.id === activeProfileId;
      }) || null;
    if (isHttpBaseUrl(activeProfile?.baseUrl)) {
      return true;
    }
    return isHttpBaseUrl(source[LEGACY_STORAGE_KEY]?.baseUrl);
  }
  async function ensureHttpProviderSupportMigration(storage, stored) {
    if (!storage) {
      return DEFAULT_HTTP_PROVIDER_ENABLED;
    }
    const snapshot =
      stored && typeof stored === "object"
        ? stored
        : await storage.get([
            HTTP_PROVIDER_STORAGE_KEY,
            HTTP_PROVIDER_MIGRATED_KEY,
            LEGACY_STORAGE_KEY,
            PROFILES_STORAGE_KEY,
            ACTIVE_PROFILE_STORAGE_KEY,
          ]);
    if (typeof snapshot[HTTP_PROVIDER_STORAGE_KEY] === "boolean") {
      return snapshot[HTTP_PROVIDER_STORAGE_KEY];
    }
    const shouldEnable =
      hasLegacyActiveHttpProvider(snapshot) || DEFAULT_HTTP_PROVIDER_ENABLED;
    const payload = {
      [HTTP_PROVIDER_MIGRATED_KEY]: true,
      [HTTP_PROVIDER_STORAGE_KEY]: shouldEnable,
    };
    await storage.set(payload);
    return shouldEnable;
  }
  async function readHttpProviderSupportEnabled(options) {
    const settings = options && typeof options === "object" ? options : {};
    if (typeof settings.enabled === "boolean") {
      return settings.enabled;
    }
    const storage = settings.storageArea || globalThis.chrome?.storage?.local;
    if (!storage) {
      return DEFAULT_HTTP_PROVIDER_ENABLED;
    }
    const stored =
      settings.storedState && typeof settings.storedState === "object"
        ? settings.storedState
        : null;
    if (stored && typeof stored[HTTP_PROVIDER_STORAGE_KEY] === "boolean") {
      return stored[HTTP_PROVIDER_STORAGE_KEY];
    }
    return ensureHttpProviderSupportMigration(storage, stored);
  }
  async function assertHttpProviderAllowed(config, options) {
    const next = normalizeConfig(config);
    if (!next.baseUrl || !isHttpBaseUrl(next.baseUrl)) {
      return next;
    }
    const enabled = await readHttpProviderSupportEnabled(options);
    if (!enabled) {
      throw new Error(HTTP_PROVIDER_DISABLED_MESSAGE);
    }
    return next;
  }
  function resolveActiveProfileId(profiles, requestedId) {
    const normalizedRequestedId = String(requestedId || "").trim();
    if (
      normalizedRequestedId &&
      profiles.some(function (profile) {
        return profile.id === normalizedRequestedId;
      })
    ) {
      return normalizedRequestedId;
    }
    return profiles[0]?.id || null;
  }
  function stableSerialize(value) {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  function buildProviderSelectionIdentity(profile) {
    if (!profile || typeof profile !== "object") {
      return "";
    }
    return stableSerialize({
      id: String(profile.id || "").trim(),
      format: normalizeFormat(profile.format),
      baseUrl: String(profile.baseUrl || "")
        .trim()
        .replace(/\/+$/, ""),
    });
  }
  function buildModelSelectionSyncSignature(profile) {
    if (!profile || typeof profile !== "object") {
      return "";
    }
    const defaultModel = String(profile.defaultModel || "").trim();
    if (!defaultModel) {
      return "";
    }
    return stableSerialize({
      provider: buildProviderSelectionIdentity(profile),
      model: defaultModel,
    });
  }
  function buildQuickModelSelectionSyncSignature(profile) {
    if (!profile || typeof profile !== "object") {
      return "";
    }
    const quickModel = String(
      profile.fastModel ||
        profile.small_fast_model ||
        profile.defaultModel ||
        "",
    ).trim();
    if (!quickModel) {
      return "";
    }
    return stableSerialize({
      provider: buildProviderSelectionIdentity(profile),
      model: quickModel,
    });
  }
  function buildModelSelectionSyncPayload(
    previousActiveProfile,
    nextActiveProfile,
  ) {
    if (!nextActiveProfile || typeof nextActiveProfile !== "object") {
      return null;
    }
    const payload = {};
    const previousStandardSignature = buildModelSelectionSyncSignature(
      previousActiveProfile,
    );
    const nextStandardSignature =
      buildModelSelectionSyncSignature(nextActiveProfile);
    if (
      nextStandardSignature &&
      previousStandardSignature !== nextStandardSignature
    ) {
      payload[SELECTED_MODEL_STORAGE_KEY] = String(
        nextActiveProfile.defaultModel || "",
      ).trim();
      payload[MODEL_SELECTION_SYNC_SIGNATURE_KEY] = nextStandardSignature;
    }
    const previousQuickSignature = buildQuickModelSelectionSyncSignature(
      previousActiveProfile,
    );
    const nextQuickSignature =
      buildQuickModelSelectionSyncSignature(nextActiveProfile);
    if (nextQuickSignature && previousQuickSignature !== nextQuickSignature) {
      payload[SELECTED_MODEL_QUICK_MODE_STORAGE_KEY] = String(
        nextActiveProfile.fastModel ||
          nextActiveProfile.small_fast_model ||
          nextActiveProfile.defaultModel ||
          "",
      ).trim();
      payload[QUICK_MODEL_SELECTION_SYNC_SIGNATURE_KEY] = nextQuickSignature;
    }
    return Object.keys(payload).length ? payload : null;
  }
  async function persistProviderStoreState(nextState) {
    const state = nextState && typeof nextState === "object" ? nextState : {};
    const storage = state.storageArea || globalThis.chrome?.storage?.local;
    if (!storage) {
      throw new Error("Provider storage is not available.");
    }
    const profiles = Array.isArray(state.profiles)
      ? state.profiles.map(normalizeProfile)
      : [];
    const activeProfileId = resolveActiveProfileId(
      profiles,
      state.activeProfileId,
    );
    const activeProfile =
      profiles.find(function (profile) {
        return profile.id === activeProfileId;
      }) || null;
    const legacyConfig = projectProfileToConfig(activeProfile);
    const modelSelectionSyncPayload =
      state.modelSelectionSyncPayload &&
      typeof state.modelSelectionSyncPayload === "object"
        ? state.modelSelectionSyncPayload
        : null;
    const writes = [
      storage.set({
        [PROFILES_STORAGE_KEY]: profiles,
        [ACTIVE_PROFILE_STORAGE_KEY]: activeProfileId,
        [LEGACY_STORAGE_KEY]: legacyConfig,
        ...(modelSelectionSyncPayload || {}),
      }),
      storage.remove(ANTHROPIC_API_KEY_STORAGE_KEY),
    ];
    if (state.originalApiKey === undefined) {
      const nextBackupApiKey =
        state.currentApiKey && state.currentApiKey !== activeProfile?.apiKey
          ? state.currentApiKey
          : null;
      writes.push(
        storage.set({
          [BACKUP_KEY]: nextBackupApiKey,
        }),
      );
    }
    await Promise.all(writes);
    return {
      profiles,
      activeProfileId,
      activeProfile,
      config: legacyConfig,
      originalApiKey:
        state.originalApiKey === undefined
          ? state.currentApiKey && state.currentApiKey !== activeProfile?.apiKey
            ? state.currentApiKey
            : null
          : state.originalApiKey,
      currentApiKey: "",
      migrated: !!state.migrated,
      httpEnabled:
        typeof state.httpEnabled === "boolean"
          ? state.httpEnabled
          : await readHttpProviderSupportEnabled({
              storageArea: storage,
            }),
    };
  }
  async function readProviderStoreState(options) {
    const settings = options && typeof options === "object" ? options : {};
    const storage = settings.storageArea || globalThis.chrome?.storage?.local;
    if (!storage) {
      const emptyConfig = createEmptyConfig();
      return {
        profiles: [],
        activeProfileId: null,
        activeProfile: null,
        config: emptyConfig,
        originalApiKey: undefined,
        currentApiKey: "",
        migrated: false,
        httpEnabled: DEFAULT_HTTP_PROVIDER_ENABLED,
      };
    }
    const stored = await storage.get([
      LEGACY_STORAGE_KEY,
      PROFILES_STORAGE_KEY,
      ACTIVE_PROFILE_STORAGE_KEY,
      BACKUP_KEY,
      ANTHROPIC_API_KEY_STORAGE_KEY,
      HTTP_PROVIDER_STORAGE_KEY,
      HTTP_PROVIDER_MIGRATED_KEY,
    ]);
    let profiles = Array.isArray(stored[PROFILES_STORAGE_KEY])
      ? stored[PROFILES_STORAGE_KEY].map(normalizeProfile)
      : [];
    let activeProfileId = resolveActiveProfileId(
      profiles,
      stored[ACTIVE_PROFILE_STORAGE_KEY],
    );
    let migrated = false;
    const hasLegacyDeprecatedFields = hasDeprecatedProviderFields(
      stored[LEGACY_STORAGE_KEY],
    );
    const hasProfileDeprecatedFields =
      Array.isArray(stored[PROFILES_STORAGE_KEY]) &&
      stored[PROFILES_STORAGE_KEY].some(function (profile) {
        return hasDeprecatedProviderFields(profile);
      });
    if (!profiles.length && hasConfigContent(stored[LEGACY_STORAGE_KEY])) {
      profiles = [normalizeProfile(stored[LEGACY_STORAGE_KEY])];
      activeProfileId = profiles[0].id;
      migrated = true;
    }
    const activeProfile =
      profiles.find(function (profile) {
        return profile.id === activeProfileId;
      }) || null;
    const legacyConfig = projectProfileToConfig(activeProfile);
    const httpEnabled = await readHttpProviderSupportEnabled({
      storageArea: storage,
      storedState: stored,
    });
    const needsSync =
      migrated ||
      hasLegacyDeprecatedFields ||
      hasProfileDeprecatedFields ||
      stableSerialize(legacyConfig) !==
        stableSerialize(normalizeConfig(stored[LEGACY_STORAGE_KEY])) ||
      stored[ACTIVE_PROFILE_STORAGE_KEY] !== activeProfileId;
    if (needsSync && settings.persist !== false) {
      return persistProviderStoreState({
        storageArea: storage,
        profiles,
        activeProfileId,
        originalApiKey: Object.prototype.hasOwnProperty.call(stored, BACKUP_KEY)
          ? stored[BACKUP_KEY]
          : undefined,
        currentApiKey: stored[ANTHROPIC_API_KEY_STORAGE_KEY] || "",
        migrated,
        httpEnabled,
      });
    }
    return {
      profiles,
      activeProfileId,
      activeProfile,
      config: legacyConfig,
      originalApiKey: Object.prototype.hasOwnProperty.call(stored, BACKUP_KEY)
        ? stored[BACKUP_KEY]
        : undefined,
      currentApiKey: stored[ANTHROPIC_API_KEY_STORAGE_KEY] || "",
      migrated,
      httpEnabled,
    };
  }
  async function saveProviderProfile(profileInput, options) {
    const settings = options && typeof options === "object" ? options : {};
    const currentState =
      settings.state ||
      (await readProviderStoreState({
        storageArea: settings.storageArea,
      }));
    const incoming =
      profileInput && typeof profileInput === "object" ? profileInput : {};
    const nextProfile = normalizeProfile({
      ...incoming,
      id: settings.profileId || incoming.id || "",
    });
    await assertHttpProviderAllowed(nextProfile, {
      storageArea: settings.storageArea,
      enabled:
        typeof currentState.httpEnabled === "boolean"
          ? currentState.httpEnabled
          : undefined,
    });
    const profiles = currentState.profiles.slice();
    const existingIndex = profiles.findIndex(function (profile) {
      return profile.id === nextProfile.id;
    });
    if (existingIndex >= 0) {
      profiles.splice(existingIndex, 1, nextProfile);
    } else {
      profiles.push(nextProfile);
    }
    const shouldActivate = settings.activateOnSave !== false;
    const nextActiveProfile =
      profiles.find(function (profile) {
        return (
          profile.id ===
          (shouldActivate ? nextProfile.id : currentState.activeProfileId)
        );
      }) || null;
    return persistProviderStoreState({
      storageArea: settings.storageArea,
      profiles,
      activeProfileId: shouldActivate
        ? nextProfile.id
        : currentState.activeProfileId,
      modelSelectionSyncPayload: buildModelSelectionSyncPayload(
        currentState.activeProfile,
        nextActiveProfile,
      ),
      originalApiKey: currentState.originalApiKey,
      currentApiKey: currentState.currentApiKey,
      httpEnabled: currentState.httpEnabled,
    });
  }
  async function setActiveProviderProfile(profileId, options) {
    const settings = options && typeof options === "object" ? options : {};
    const currentState =
      settings.state ||
      (await readProviderStoreState({
        storageArea: settings.storageArea,
      }));
    if (
      !currentState.profiles.some(function (profile) {
        return profile.id === profileId;
      })
    ) {
      throw new Error("Provider profile not found.");
    }
    const nextActiveProfile =
      currentState.profiles.find(function (profile) {
        return profile.id === profileId;
      }) || null;
    await assertHttpProviderAllowed(nextActiveProfile, {
      storageArea: settings.storageArea,
      enabled:
        typeof currentState.httpEnabled === "boolean"
          ? currentState.httpEnabled
          : undefined,
    });
    return persistProviderStoreState({
      storageArea: settings.storageArea,
      profiles: currentState.profiles,
      activeProfileId: profileId,
      modelSelectionSyncPayload: buildModelSelectionSyncPayload(
        currentState.activeProfile,
        nextActiveProfile,
      ),
      originalApiKey: currentState.originalApiKey,
      currentApiKey: currentState.currentApiKey,
      httpEnabled: currentState.httpEnabled,
    });
  }
  async function deleteProviderProfile(profileId, options) {
    const settings = options && typeof options === "object" ? options : {};
    const currentState =
      settings.state ||
      (await readProviderStoreState({
        storageArea: settings.storageArea,
      }));
    const profiles = currentState.profiles.filter(function (profile) {
      return profile.id !== profileId;
    });
    const activeProfileId =
      currentState.activeProfileId === profileId
        ? profiles[0]?.id || null
        : resolveActiveProfileId(profiles, currentState.activeProfileId);
    const nextActiveProfile =
      profiles.find(function (profile) {
        return profile.id === activeProfileId;
      }) || null;
    return persistProviderStoreState({
      storageArea: settings.storageArea,
      profiles,
      activeProfileId,
      modelSelectionSyncPayload: buildModelSelectionSyncPayload(
        currentState.activeProfile,
        nextActiveProfile,
      ),
      originalApiKey: currentState.originalApiKey,
      currentApiKey: currentState.currentApiKey,
      httpEnabled: currentState.httpEnabled,
    });
  }
  async function reconcileActiveProviderModelSelection(options) {
    const settings = options && typeof options === "object" ? options : {};
    const storage = settings.storageArea || globalThis.chrome?.storage?.local;
    if (!storage) {
      return false;
    }
    const currentState =
      settings.state ||
      (await readProviderStoreState({
        storageArea: storage,
      }));
    const activeProfile = currentState.activeProfile;
    if (!activeProfile) {
      return false;
    }
    const expectedStandardSignature =
      buildModelSelectionSyncSignature(activeProfile);
    const expectedQuickSignature =
      buildQuickModelSelectionSyncSignature(activeProfile);
    if (!expectedStandardSignature && !expectedQuickSignature) {
      return false;
    }
    const stored = await storage.get([
      MODEL_SELECTION_SYNC_SIGNATURE_KEY,
      QUICK_MODEL_SELECTION_SYNC_SIGNATURE_KEY,
    ]);
    const payload = {};
    if (
      expectedStandardSignature &&
      stored[MODEL_SELECTION_SYNC_SIGNATURE_KEY] !== expectedStandardSignature
    ) {
      payload[SELECTED_MODEL_STORAGE_KEY] = String(
        activeProfile.defaultModel || "",
      ).trim();
      payload[MODEL_SELECTION_SYNC_SIGNATURE_KEY] = expectedStandardSignature;
    }
    if (
      expectedQuickSignature &&
      stored[QUICK_MODEL_SELECTION_SYNC_SIGNATURE_KEY] !==
        expectedQuickSignature
    ) {
      payload[SELECTED_MODEL_QUICK_MODE_STORAGE_KEY] = String(
        activeProfile.fastModel ||
          activeProfile.small_fast_model ||
          activeProfile.defaultModel ||
          "",
      ).trim();
      payload[QUICK_MODEL_SELECTION_SYNC_SIGNATURE_KEY] =
        expectedQuickSignature;
    }
    if (!Object.keys(payload).length) {
      return false;
    }
    await storage.set(payload);
    return true;
  }
  async function parseJsonSafe(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        message: text,
      };
    }
  }
  function parseServerSentEventText(text) {
    const events = [];
    const blocks = String(text || "").split(/\r?\n\r?\n+/);
    for (const block of blocks) {
      const dataLines = [];
      for (const line of block.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) {
          continue;
        }
        if (trimmed.startsWith("data:")) {
          dataLines.push(trimmed.slice(5).trimStart());
        }
      }
      const data = dataLines.join("\n").trim();
      if (!data || data === "[DONE]") {
        continue;
      }
      try {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === "object") {
          events.push(parsed);
        }
      } catch {
        events.push({
          message: data,
        });
      }
    }
    return events;
  }
  function extractOutputTextFromSseEvent(event) {
    if (!event || typeof event !== "object") {
      return "";
    }
    const type = String(event.type || "").trim();
    if (
      type === "response.output_text.delta" &&
      typeof event.delta === "string"
    ) {
      return event.delta;
    }
    if (
      type === "response.output_text.delta" &&
      typeof event.text === "string"
    ) {
      return event.text;
    }
    if (typeof event.delta === "string") {
      return event.delta;
    }
    if (typeof event.delta?.text === "string") {
      return event.delta.text;
    }
    if (Array.isArray(event.choices)) {
      return event.choices
        .map(function (choice) {
          return String(choice?.delta?.content || "").trim();
        })
        .filter(Boolean)
        .join("");
    }
    return "";
  }
  function extractDoneTextFromSseEvent(event) {
    if (!event || typeof event !== "object") {
      return "";
    }
    if (
      String(event.type || "") === "response.output_text.done" &&
      typeof event.text === "string"
    ) {
      return event.text;
    }
    return "";
  }
  function sseEventsToProbePayload(events) {
    const list = Array.isArray(events) ? events : [];
    const deltaText = list.map(extractOutputTextFromSseEvent).join("").trim();
    const doneText = deltaText
      ? ""
      : list.map(extractDoneTextFromSseEvent).filter(Boolean).join("").trim();
    const outputText = deltaText || doneText;
    return {
      output_text: outputText,
      output: list,
      event_count: list.length,
    };
  }
  async function parseProviderPayload(response) {
    const text = await response.text();
    if (!text) {
      return {};
    }
    const contentType = String(response.headers?.get?.("content-type") || "");
    if (contentType.includes("text/event-stream") || /^data:/m.test(text)) {
      const events = parseServerSentEventText(text);
      if (events.length) {
        return sseEventsToProbePayload(events);
      }
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        message: text,
      };
    }
  }
  function getJwtExpiryMs(token) {
    const payload = decodeJwtPayload(token);
    const seconds = Number(payload?.exp);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return 0;
    }
    return seconds * 1000;
  }
  function shouldRefreshCodexAccessToken(config, nowMs) {
    const next = normalizeConfig(config);
    if (!isCodexAuthConfig(next) || !next.codexRefreshToken) {
      return false;
    }
    const expiryMs = getJwtExpiryMs(next.apiKey);
    if (!expiryMs) {
      return false;
    }
    const now = Number.isFinite(nowMs) ? nowMs : Date.now();
    return expiryMs <= now + CODEX_ACCESS_TOKEN_REFRESH_SKEW_MS;
  }
  async function refreshCodexAuthForConfig(config, options) {
    const settings = options && typeof options === "object" ? options : {};
    const next = normalizeConfig(config);
    if (!isCodexAuthConfig(next) || !next.codexRefreshToken) {
      return next;
    }
    if (
      !settings.force &&
      !shouldRefreshCodexAccessToken(next, settings.nowMs)
    ) {
      return next;
    }
    const fetchImpl = settings.fetchImpl || globalThis.fetch;
    if (typeof fetchImpl !== "function") {
      return next;
    }
    const response = await fetchImpl(CODEX_REFRESH_TOKEN_URL, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_id: CODEX_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: next.codexRefreshToken,
      }),
      signal: settings.signal,
    });
    const payload = await parseJsonSafe(response);
    if (!response.ok) {
      throw new Error(
        extractErrorMessage(payload, `Codex 认证刷新失败（${response.status}）`),
      );
    }
    const refreshed = normalizeConfig({
      ...next,
      apiKey: String(payload.access_token || next.apiKey).trim(),
      codexRefreshToken: String(
        payload.refresh_token || next.codexRefreshToken,
      ).trim(),
      codexAccountId:
        extractCodexAccountIdFromToken(payload.id_token) ||
        extractCodexAccountIdFromToken(payload.access_token) ||
        next.codexAccountId,
      codexLastRefresh: new Date().toISOString(),
    });
    const profileId = String(settings.profileId || next.id || "").trim();
    if (settings.persist !== false && profileId) {
      await saveProviderProfile(refreshed, {
        profileId,
        storageArea: settings.storageArea,
        activateOnSave: true,
      });
    }
    return refreshed;
  }
  function buildProviderHeaders(config, format, includeContentType) {
    const normalizedFormat = normalizeFormat(format);
    let headers;
    if (normalizedFormat === ANTHROPIC_FORMAT) {
      headers = {
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
        Accept: "application/json",
      };
    } else if (isCodexAuthConfig(config)) {
      headers = {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "text/event-stream, application/json",
        version: "claw-in-chrome-codex-provider",
      };
      if (config.codexAccountId) {
        headers["ChatGPT-Account-ID"] = config.codexAccountId;
      }
    } else {
      headers = {
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "application/json",
      };
    }
    if (includeContentType) {
      headers["content-type"] = "application/json";
    }
    return headers;
  }
  function isLikelyChatLikeModel(value) {
    const model = String(value || "")
      .trim()
      .toLowerCase();
    return (
      model.startsWith("gpt-") ||
      model.startsWith("chatgpt") ||
      (model.length > 1 && model.startsWith("o") && /\d/.test(model[1]))
    );
  }
  function buildHealthCheckCandidates(config) {
    if (isCodexAuthConfig(config)) {
      return [OPENAI_RESPONSES_FORMAT];
    }
    const requestedFormat = normalizeFormat(config?.format);
    const candidates = [requestedFormat];
    const baseUrl = String(config?.baseUrl || "")
      .trim()
      .toLowerCase();
    const model = String(config?.defaultModel || "")
      .trim()
      .toLowerCase();
    const name = String(config?.name || "")
      .trim()
      .toLowerCase();
    const looksChatLike =
      isLikelyChatLikeModel(model) ||
      name.includes("openai") ||
      name.includes("gpt");
    if (
      requestedFormat === OPENAI_RESPONSES_FORMAT &&
      looksChatLike &&
      !/\/responses$/i.test(baseUrl)
    ) {
      candidates.push(OPENAI_CHAT_FORMAT);
    }
    return candidates;
  }
  function buildHealthCheckBody(config, format) {
    const model = String(config?.defaultModel || "").trim();
    const normalizedFormat = normalizeFormat(format);
    if (normalizedFormat === ANTHROPIC_FORMAT) {
      return {
        model,
        max_tokens: HEALTH_CHECK_MAX_TOKENS,
        stream: false,
        messages: [
          {
            role: "user",
            content: HEALTH_CHECK_PROMPT,
          },
        ],
      };
    }
    if (normalizedFormat === OPENAI_CHAT_FORMAT) {
      return {
        model,
        max_tokens: HEALTH_CHECK_MAX_TOKENS,
        temperature: 0,
        stream: false,
        messages: [
          {
            role: "user",
            content: HEALTH_CHECK_PROMPT,
          },
        ],
      };
    }
    const responseBody = {
      model,
      input: isCodexAuthConfig(config)
        ? [
            {
              type: "message",
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: HEALTH_CHECK_PROMPT,
                },
              ],
            },
          ]
        : HEALTH_CHECK_PROMPT,
      ...(isCodexAuthConfig(config)
        ? {
            instructions: "",
            tools: [],
            tool_choice: "auto",
            parallel_tool_calls: false,
            reasoning: null,
            store: false,
            include: [],
          }
        : {}),
      stream: isCodexAuthConfig(config),
    };
    if (!isCodexAuthConfig(config)) {
      responseBody.max_output_tokens = HEALTH_CHECK_MAX_TOKENS;
    }
    return responseBody;
  }
  function extractReadableTextFromPart(part, options) {
    const settings = options && typeof options === "object" ? options : {};
    const allowReasoning = settings.allowReasoning !== false;
    if (typeof part === "string") {
      return part.trim();
    }
    if (!part || typeof part !== "object") {
      return "";
    }
    const type = String(part.type || "")
      .trim()
      .toLowerCase();
    if (type === "tool_use" || type === "tool_result") {
      return "";
    }
    if (type === "text" && typeof part.text === "string") {
      return part.text.trim();
    }
    if (
      allowReasoning &&
      type === "thinking" &&
      typeof part.thinking === "string"
    ) {
      return part.thinking.trim();
    }
    if (allowReasoning && type === "reasoning") {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
      if (typeof part.reasoning === "string" && part.reasoning.trim()) {
        return part.reasoning.trim();
      }
    }
    const directCandidates = [
      part.output_text,
      part.content_text,
      part.response_text,
      part.text,
    ];
    if (allowReasoning) {
      directCandidates.push(part.reasoning, part.thinking);
    }
    for (const candidate of directCandidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
    if (typeof part.content === "string" && part.content.trim()) {
      return part.content.trim();
    }
    const nestedCollections = [
      part.content,
      part.message?.content,
      part.output,
      part.reasoning_details,
      part.delta,
    ];
    for (const nested of nestedCollections) {
      const text = extractTextFromContentParts(nested, options);
      if (text) {
        return text;
      }
    }
    return "";
  }
  function extractTextFromContentParts(parts, options) {
    if (typeof parts === "string") {
      return parts.trim();
    }
    if (parts && typeof parts === "object" && !Array.isArray(parts)) {
      return extractReadableTextFromPart(parts, options);
    }
    if (!Array.isArray(parts)) {
      return "";
    }
    return parts
      .map(function (part) {
        return extractReadableTextFromPart(part, options);
      })
      .filter(Boolean)
      .join(" ")
      .trim();
  }
  function hasProbeResponseSignalInParts(parts) {
    if (typeof parts === "string") {
      return !!parts.trim();
    }
    if (!parts) {
      return false;
    }
    if (!Array.isArray(parts)) {
      if (typeof parts !== "object") {
        return false;
      }
      const type = String(parts.type || "")
        .trim()
        .toLowerCase();
      if (type === "tool_use" || type === "tool_result") {
        return false;
      }
      if (typeof parts.text === "string" && parts.text.trim()) {
        return true;
      }
      if (typeof parts.thinking === "string" && parts.thinking.trim()) {
        return true;
      }
      if (typeof parts.reasoning === "string" && parts.reasoning.trim()) {
        return true;
      }
      if (typeof parts.content === "string" && parts.content.trim()) {
        return true;
      }
      return (
        hasProbeResponseSignalInParts(parts.content) ||
        hasProbeResponseSignalInParts(parts.message?.content) ||
        hasProbeResponseSignalInParts(parts.output) ||
        hasProbeResponseSignalInParts(parts.reasoning_details) ||
        hasProbeResponseSignalInParts(parts.delta)
      );
    }
    return parts.some(function (part) {
      return hasProbeResponseSignalInParts(part);
    });
  }
  function extractProbeReply(payload) {
    if (!payload || typeof payload !== "object") {
      return "";
    }
    if (typeof payload.output_text === "string" && payload.output_text.trim()) {
      return payload.output_text.trim();
    }
    const textFirstCandidates = [
      extractTextFromContentParts(payload.content, {
        allowReasoning: false,
      }),
      extractTextFromContentParts(payload.message?.content, {
        allowReasoning: false,
      }),
      Array.isArray(payload.output)
        ? payload.output
            .map(function (item) {
              return extractTextFromContentParts(item?.content, {
                allowReasoning: false,
              });
            })
            .filter(Boolean)
            .join(" ")
            .trim()
        : "",
      Array.isArray(payload.choices)
        ? payload.choices
            .map(function (choice) {
              if (typeof choice?.message?.content === "string") {
                return choice.message.content.trim();
              }
              return extractTextFromContentParts(choice?.message?.content, {
                allowReasoning: false,
              });
            })
            .filter(Boolean)
            .join(" ")
            .trim()
        : "",
      typeof payload.message === "string" ? payload.message.trim() : "",
      typeof payload.content === "string" ? payload.content.trim() : "",
    ];
    for (const candidate of textFirstCandidates) {
      if (candidate) {
        return candidate;
      }
    }
    return "";
  }
  function hasProbeResponseSignal(payload) {
    if (!payload || typeof payload !== "object") {
      return false;
    }
    if (typeof payload.output_text === "string" && payload.output_text.trim()) {
      return true;
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return true;
    }
    if (typeof payload.content === "string" && payload.content.trim()) {
      return true;
    }
    if (typeof payload.thinking === "string" && payload.thinking.trim()) {
      return true;
    }
    if (typeof payload.reasoning === "string" && payload.reasoning.trim()) {
      return true;
    }
    return (
      hasProbeResponseSignalInParts(payload.content) ||
      hasProbeResponseSignalInParts(payload.message?.content) ||
      hasProbeResponseSignalInParts(payload.output) ||
      hasProbeResponseSignalInParts(
        payload.choices?.map(function (choice) {
          return choice?.message?.content;
        }),
      ) ||
      hasProbeResponseSignalInParts(payload.reasoning_details)
    );
  }
  // 统一向兼容供应商请求 /models，并把返回值整理成下拉可选项。
  async function fetchProviderModels(config, options) {
    const next = normalizeConfig(config);
    if (!next.baseUrl) {
      throw new Error("请先填写 Base URL。");
    }
    await assertHttpProviderAllowed(next, options);
    if (!next.apiKey) {
      throw new Error("请先填写 API Key。");
    }
    const controller = new AbortController();
    const timer = globalThis.setTimeout(function () {
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    try {
      const headers = buildProviderHeaders(next, next.format, false);
      const response = await (options?.fetchImpl || globalThis.fetch)(
        buildModelsUrl(next),
        {
          method: "GET",
          headers,
          signal: controller.signal,
        },
      );
      const payload = await parseJsonSafe(response);
      if (!response.ok) {
        throw new Error(
          extractErrorMessage(payload, `获取模型失败（${response.status}）`),
        );
      }
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.models)
          ? payload.models
          : [];
      const models = dedupeModels(
        list
          .filter(function (item) {
            if (!isCodexAuthConfig(next)) {
              return true;
            }
            return item?.visibility !== "hide" && item?.supported_in_api !== false;
          })
          .map(function (item) {
            const id = String(item?.id || item?.slug || "").trim();
            return {
              value: id,
              label: String(item?.display_name || id).trim() || id,
            };
          }),
      );
      if (!models.length) {
        throw new Error("接口已响应，但没有返回可选模型。");
      }
      return models;
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("获取模型超时，请稍后重试。");
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
    }
  }
  async function probeProviderModel(config, options) {
    const next = normalizeConfig(config);
    if (!next.baseUrl) {
      throw new Error("请先填写 Base URL。");
    }
    await assertHttpProviderAllowed(next, options);
    if (!next.apiKey) {
      throw new Error("请先填写 API Key。");
    }
    if (!next.defaultModel) {
      throw new Error("请先选择一个模型后再检测。");
    }
    const controller = new AbortController();
    const timer = globalThis.setTimeout(function () {
      controller.abort();
    }, FETCH_TIMEOUT_MS);
    const fetchImpl = options?.fetchImpl || globalThis.fetch;
    const candidates = buildHealthCheckCandidates(next);
    let lastError = null;
    try {
      for (const format of candidates) {
        const requestUrl = buildRequestUrl(next.baseUrl, format);
        try {
          const response = await fetchImpl(requestUrl, {
            method: "POST",
            headers: buildProviderHeaders(next, format, true),
            body: JSON.stringify(buildHealthCheckBody(next, format)),
            signal: controller.signal,
          });
          const payload = await parseProviderPayload(response);
          if (!response.ok) {
            throw new Error(
              extractErrorMessage(
                payload,
                `健康检测失败（${response.status}）`,
              ),
            );
          }
          const replyText = extractProbeReply(payload);
          const responseDetected = hasProbeResponseSignal(payload);
          if (!replyText && !responseDetected) {
            throw new Error("模型已响应，但没有返回可读文本。");
          }
          return {
            ok: true,
            format,
            requestUrl,
            replyText,
            responseDetected,
          };
        } catch (error) {
          lastError = error;
        }
      }
      throw lastError || new Error("健康检测失败。");
    } catch (error) {
      if (error && error.name === "AbortError") {
        throw new Error("健康检测超时，请稍后重试。");
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timer);
    }
  }
  function syncModelOptions(select, models, selectedValue) {
    if (!select) {
      return;
    }
    select.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = models.length
      ? "选择一个已获取的模型"
      : "点击“获取模型”后可直接选择";
    select.appendChild(placeholder);
    for (const model of models) {
      const option = document.createElement("option");
      option.value = model.value;
      option.textContent = model.label || model.value;
      select.appendChild(option);
    }
    select.disabled = models.length === 0;
    if (
      selectedValue &&
      models.some((model) => model.value === selectedValue)
    ) {
      select.value = selectedValue;
    } else {
      select.value = "";
    }
  }
  globalThis.CustomProviderModels = {
    ANTHROPIC_FORMAT,
    OPENAI_CHAT_FORMAT,
    OPENAI_RESPONSES_FORMAT,
    DEFAULT_FORMAT,
    AUTH_MODE_API_KEY,
    AUTH_MODE_CODEX,
    DEFAULT_AUTH_MODE,
    CODEX_DEFAULT_BASE_URL,
    DEFAULT_CONTEXT_WINDOW,
    DEFAULT_MAX_OUTPUT_TOKENS,
    LEGACY_STORAGE_KEY,
    PROFILES_STORAGE_KEY,
    ACTIVE_PROFILE_STORAGE_KEY,
    BACKUP_KEY,
    ANTHROPIC_API_KEY_STORAGE_KEY,
    FETCHED_MODELS_CACHE_KEY,
    HTTP_PROVIDER_STORAGE_KEY,
    HTTP_PROVIDER_MIGRATED_KEY,
    HTTP_PROVIDER_DISABLED_MESSAGE,
    extractErrorMessage,
    normalizeAuthMode,
    normalizeFormat,
    normalizeReasoningEffort,
    normalizeMaxOutputTokens,
    normalizeContextWindow,
    normalizeConfig,
    normalizeProfile,
    createEmptyConfig,
    isHttpBaseUrl,
    readHttpProviderSupportEnabled,
    assertHttpProviderAllowed,
    hasUsableConfig,
    projectProfileToConfig,
    readProviderStoreState,
    saveProviderProfile,
    setActiveProviderProfile,
    deleteProviderProfile,
    reconcileActiveProviderModelSelection,
    readCachedFetchedModels,
    persistFetchedModelsForConfig,
    refreshCodexAuthForConfig,
    buildRequestUrl,
    fetchProviderModels,
    probeProviderModel,
    syncModelOptions,
  };
  reconcileActiveProviderModelSelection().catch(function () {});
})();
