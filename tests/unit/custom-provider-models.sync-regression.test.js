const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const contractPath = path.join(__dirname, "..", "..", "claw-contract.js");
const modelsPath = path.join(__dirname, "..", "..", "custom-provider-models.js");
const contractSource = fs.readFileSync(contractPath, "utf8");
const modelsSource = fs.readFileSync(modelsPath, "utf8");

function createProfile(overrides = {}) {
  return {
    id: "provider_a",
    name: "Provider A",
    format: "openai_chat",
    baseUrl: "https://provider-a.example/v1",
    apiKey: "key-a",
    defaultModel: "gpt-5.4",
    fastModel: "gpt-5.4-mini",
    reasoningEffort: "medium",
    maxOutputTokens: 10000,
    contextWindow: 200000,
    fetchedModels: [],
    ...overrides
  };
}

function projectProfileToConfig(profile) {
  return {
    name: profile.name,
    format: profile.format,
    baseUrl: profile.baseUrl,
    apiKey: profile.apiKey,
    defaultModel: profile.defaultModel,
    fastModel: profile.fastModel,
    reasoningEffort: profile.reasoningEffort,
    maxOutputTokens: profile.maxOutputTokens,
    contextWindow: profile.contextWindow,
    fetchedModels: profile.fetchedModels
  };
}

function buildStandardSyncSignature(profile) {
  return JSON.stringify({
    provider: JSON.stringify({
      id: profile.id,
      format: profile.format,
      baseUrl: profile.baseUrl
    }),
    model: profile.defaultModel
  });
}

function buildQuickSyncSignature(profile) {
  return JSON.stringify({
    provider: JSON.stringify({
      id: profile.id,
      format: profile.format,
      baseUrl: profile.baseUrl
    }),
    model: profile.fastModel || profile.defaultModel
  });
}

function createStorageArea(initialState) {
  const state = {
    ...initialState
  };
  return {
    state,
    async get(keys) {
      if (keys == null) {
        return {
          ...state
        };
      }
      if (typeof keys === "string") {
        return {
          [keys]: state[keys]
        };
      }
      if (Array.isArray(keys)) {
        const output = {};
        for (const key of keys) {
          output[key] = state[key];
        }
        return output;
      }
      if (typeof keys === "object") {
        const output = {};
        for (const [key, fallbackValue] of Object.entries(keys)) {
          output[key] = Object.prototype.hasOwnProperty.call(state, key) ? state[key] : fallbackValue;
        }
        return output;
      }
      return {};
    },
    async set(next) {
      Object.assign(state, next);
    },
    async remove(keys) {
      const list = Array.isArray(keys) ? keys : [keys];
      for (const key of list) {
        delete state[key];
      }
    }
  };
}

function loadModels(storageArea, overrides = {}) {
  const sandbox = {
    console,
    AbortController,
    clearTimeout,
    setTimeout,
    fetch: async () => {
      throw new Error("fetch should not be called in this test");
    },
    chrome: {
      storage: {
        local: storageArea
      }
    },
    ...overrides
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(contractSource, sandbox, {
    filename: "claw-contract.js"
  });
  vm.runInNewContext(modelsSource, sandbox, {
    filename: "custom-provider-models.js"
  });
  return sandbox.CustomProviderModels;
}

async function waitForMicrotasks() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function testSavingActiveProfileSyncsSelectedModels() {
  const activeProfile = createProfile();
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile),
    selectedModel: "gpt-old-sticky",
    selectedModelQuickMode: "gpt-old-quick"
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.saveProviderProfile({
    ...activeProfile,
    defaultModel: "gpt-5.5",
    fastModel: "gpt-5.5-mini"
  }, {
    profileId: activeProfile.id,
    storageArea
  });

  assert.equal(storageArea.state.selectedModel, "gpt-5.5");
  assert.equal(storageArea.state.selectedModelQuickMode, "gpt-5.5-mini");
  assert.equal(storageArea.state.customProviderConfig.defaultModel, "gpt-5.5");
  assert.equal(storageArea.state.customProviderConfig.fastModel, "gpt-5.5-mini");
  assert.ok(storageArea.state.customProviderSelectedModelSyncSignature, "standard sync signature should be stored");
  assert.ok(storageArea.state.customProviderSelectedModelQuickModeSyncSignature, "quick sync signature should be stored");
}

async function testSavingNonModelFieldsKeepsExistingStickySelection() {
  const activeProfile = createProfile();
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile),
    selectedModel: "manual-standard-choice",
    selectedModelQuickMode: "manual-quick-choice",
    customProviderSelectedModelSyncSignature: buildStandardSyncSignature(activeProfile),
    customProviderSelectedModelQuickModeSyncSignature: buildQuickSyncSignature(activeProfile)
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.saveProviderProfile({
    ...activeProfile,
    contextWindow: 240000,
    maxOutputTokens: 12000
  }, {
    profileId: activeProfile.id,
    storageArea
  });

  assert.equal(storageArea.state.selectedModel, "manual-standard-choice");
  assert.equal(storageArea.state.selectedModelQuickMode, "manual-quick-choice");
}

async function testEditingInactiveProfileDoesNotResyncActiveSelection() {
  const activeProfile = createProfile();
  const inactiveProfile = createProfile({
    id: "provider_b",
    name: "Provider B",
    baseUrl: "https://provider-b.example/v1",
    apiKey: "key-b",
    defaultModel: "gpt-4.1",
    fastModel: "gpt-4.1-mini"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile, inactiveProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile),
    selectedModel: "manual-standard-choice",
    selectedModelQuickMode: "manual-quick-choice",
    customProviderSelectedModelSyncSignature: buildStandardSyncSignature(activeProfile),
    customProviderSelectedModelQuickModeSyncSignature: buildQuickSyncSignature(activeProfile)
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.saveProviderProfile({
    ...inactiveProfile,
    defaultModel: "gpt-4.2"
  }, {
    profileId: inactiveProfile.id,
    storageArea,
    activateOnSave: false
  });

  assert.equal(storageArea.state.selectedModel, "manual-standard-choice");
  assert.equal(storageArea.state.selectedModelQuickMode, "manual-quick-choice");
  assert.equal(storageArea.state.customProviderActiveProfileId, activeProfile.id);
}

async function testActivatingAnotherProfileSyncsSelectedModels() {
  const activeProfile = createProfile();
  const inactiveProfile = createProfile({
    id: "provider_b",
    name: "Provider B",
    baseUrl: "https://provider-b.example/v1",
    apiKey: "key-b",
    defaultModel: "gpt-4.1",
    fastModel: "gpt-4.1-mini"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile, inactiveProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile),
    selectedModel: "manual-standard-choice",
    selectedModelQuickMode: "manual-quick-choice"
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.setActiveProviderProfile(inactiveProfile.id, {
    storageArea
  });

  assert.equal(storageArea.state.customProviderActiveProfileId, inactiveProfile.id);
  assert.equal(storageArea.state.selectedModel, inactiveProfile.defaultModel);
  assert.equal(storageArea.state.selectedModelQuickMode, inactiveProfile.fastModel);
}

async function testReconcileRepairsExistingStaleSelectionWithoutResave() {
  const activeProfile = createProfile({
    defaultModel: "gpt-5.4",
    fastModel: "gpt-5.4-mini"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile),
    selectedModel: "stale-sticky-model",
    selectedModelQuickMode: "stale-quick-model"
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  assert.equal(storageArea.state.selectedModel, activeProfile.defaultModel);
  assert.equal(storageArea.state.selectedModelQuickMode, activeProfile.fastModel);

  storageArea.state.selectedModel = "manual-standard-choice";
  storageArea.state.selectedModelQuickMode = "manual-quick-choice";

  const reconciled = await models.reconcileActiveProviderModelSelection({
    storageArea
  });

  assert.equal(reconciled, false, "matching sync signatures should not overwrite later manual model choices");
  assert.equal(storageArea.state.selectedModel, "manual-standard-choice");
  assert.equal(storageArea.state.selectedModelQuickMode, "manual-quick-choice");
}

async function testLoadingLegacyStorageCleansDeprecatedFields() {
  const activeProfile = createProfile();
  const legacyProfile = {
    ...activeProfile,
    enabled: true,
    notes: "legacy note"
  };
  const storageArea = createStorageArea({
    customProviderProfiles: [legacyProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: {
      ...projectProfileToConfig(activeProfile),
      enabled: true,
      notes: "legacy config note"
    }
  });

  loadModels(storageArea);
  await waitForMicrotasks();

  assert.equal(Object.prototype.hasOwnProperty.call(storageArea.state.customProviderConfig, "enabled"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(storageArea.state.customProviderConfig, "notes"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(storageArea.state.customProviderProfiles[0], "enabled"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(storageArea.state.customProviderProfiles[0], "notes"), false);
}

async function testManualAliasOnlyChangesDisplayName() {
  const activeProfile = createProfile({
    defaultModel: "MiniMax-M2.7",
    fastModel: "MiniMax-M2.7-fast",
    fetchedModels: [{
      value: "MiniMax-M2.7",
      label: "MiniMax M2.7 正式版",
      manual: true
    }, {
      value: "MiniMax-M2.7-fast",
      label: "MiniMax M2.7 快速版",
      manual: true
    }]
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile),
    selectedModel: "stale-model-id",
    selectedModelQuickMode: "stale-fast-model-id"
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.saveProviderProfile(activeProfile, {
    profileId: activeProfile.id,
    storageArea
  });

  assert.equal(storageArea.state.selectedModel, "MiniMax-M2.7");
  assert.equal(storageArea.state.selectedModelQuickMode, "MiniMax-M2.7-fast");
  assert.equal(storageArea.state.customProviderConfig.defaultModel, "MiniMax-M2.7");
  assert.equal(storageArea.state.customProviderConfig.fetchedModels.find((item) => item.value === "MiniMax-M2.7")?.label, "MiniMax M2.7 正式版");
}

async function testSyncModelOptionsUsesAliasButKeepsModelIdValue() {
  const storageArea = createStorageArea({});
  const select = {
    children: [],
    disabled: false,
    value: ""
  };
  Object.defineProperty(select, "innerHTML", {
    get() {
      return "";
    },
    set() {
      this.children = [];
    }
  });
  select.appendChild = function (child) {
    this.children.push(child);
  };
  const models = loadModels(storageArea, {
    document: {
      createElement() {
        return {
          value: "",
          textContent: "",
          dataset: {}
        };
      }
    }
  });

  models.syncModelOptions(select, [{
    value: "MiniMax-M2.7",
    label: "MiniMax M2.7 正式版",
    manual: true
  }], "MiniMax-M2.7");

  assert.equal(select.children[1].textContent, "MiniMax M2.7 正式版");
  assert.equal(select.children[1].value, "MiniMax-M2.7");
  assert.equal(select.value, "MiniMax-M2.7");
}
async function testSavingHttpProfileDefaultsToEnabled() {
  const httpProfile = createProfile({
    baseUrl: "http://provider-a.example/v1"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [],
    customProviderConfig: {}
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.saveProviderProfile(httpProfile, {
    profileId: httpProfile.id,
    storageArea
  });

  assert.equal(storageArea.state.customProviderConfig.baseUrl, "http://provider-a.example/v1");
  assert.equal(storageArea.state.customProviderProfiles[0].baseUrl, "http://provider-a.example/v1");
  assert.equal(storageArea.state.customProviderAllowHttp, true);
  assert.equal(storageArea.state.customProviderAllowHttpMigrated, true);
}
async function testSavingHttpProfileSucceedsWhenToggleEnabled() {
  const httpProfile = createProfile({
    baseUrl: "http://provider-a.example/v1"
  });
  const storageArea = createStorageArea({
    customProviderAllowHttp: true,
    customProviderAllowHttpMigrated: true
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.saveProviderProfile(httpProfile, {
    profileId: httpProfile.id,
    storageArea
  });

  assert.equal(storageArea.state.customProviderConfig.baseUrl, "http://provider-a.example/v1");
  assert.equal(storageArea.state.customProviderProfiles[0].baseUrl, "http://provider-a.example/v1");
}
async function testActivatingHttpProfileDefaultsToEnabled() {
  const activeProfile = createProfile();
  const httpProfile = createProfile({
    id: "provider_http",
    name: "HTTP Provider",
    baseUrl: "http://provider-http.example/v1",
    apiKey: "key-http",
    defaultModel: "gpt-4.1",
    fastModel: "gpt-4.1-mini"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [activeProfile, httpProfile],
    customProviderActiveProfileId: activeProfile.id,
    customProviderConfig: projectProfileToConfig(activeProfile)
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await models.setActiveProviderProfile(httpProfile.id, {
    storageArea
  });

  assert.equal(storageArea.state.customProviderActiveProfileId, httpProfile.id);
  assert.equal(storageArea.state.customProviderAllowHttp, true);
  assert.equal(storageArea.state.customProviderAllowHttpMigrated, true);
}
async function testFetchAndProbeAllowHttpByDefault() {
  const httpProfile = createProfile({
    baseUrl: "http://provider-a.example/v1"
  });
  const storageArea = createStorageArea({});
  let fetchCalls = 0;
  const fetchImpl = async (input) => {
    fetchCalls += 1;
    const url = String(input);
    if (url.endsWith("/models")) {
      return {
        ok: true,
        status: 200,
        headers: {
          get() {
            return "application/json";
          }
        },
        async text() {
          return JSON.stringify({
            data: [{
              id: "gpt-5.4"
            }]
          });
        }
      };
    }
    return {
      ok: true,
      status: 200,
      headers: {
        get() {
          return "application/json";
        }
      },
      async text() {
        return JSON.stringify({
          content: [{
            type: "text",
            text: "OK"
          }]
        });
      }
    };
  };
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  const fetched = await models.fetchProviderModels(httpProfile, {
    storageArea,
    fetchImpl
  });
  const probe = await models.probeProviderModel(httpProfile, {
    storageArea,
    fetchImpl
  });

  assert.equal(fetched.length, 1);
  assert.equal(fetched[0].value, "gpt-5.4");
  assert.equal(fetched[0].label, "gpt-5.4");
  assert.equal(fetched[0].manual, false);
  assert.equal(probe.ok, true);
  assert.equal(fetchCalls, 2);
  assert.equal(storageArea.state.customProviderAllowHttp, true);
  assert.equal(storageArea.state.customProviderAllowHttpMigrated, true);
}
async function testFetchAndProbeRejectWhenHttpExplicitlyDisabled() {
  const httpProfile = createProfile({
    baseUrl: "http://provider-a.example/v1"
  });
  const storageArea = createStorageArea({
    customProviderAllowHttp: false,
    customProviderAllowHttpMigrated: true
  });
  let fetchCalls = 0;
  const fetchImpl = async () => {
    fetchCalls += 1;
    throw new Error("fetch should not be called");
  };
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  await assert.rejects(models.fetchProviderModels(httpProfile, {
    storageArea,
    fetchImpl
  }), /HTTP 协议未启用/);
  await assert.rejects(models.probeProviderModel(httpProfile, {
    storageArea,
    fetchImpl
  }), /HTTP 协议未启用/);

  assert.equal(fetchCalls, 0);
}
async function testLegacyActiveHttpProfileMigratesToggleToEnabled() {
  const httpProfile = createProfile({
    baseUrl: "http://provider-a.example/v1"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [httpProfile],
    customProviderActiveProfileId: httpProfile.id,
    customProviderConfig: projectProfileToConfig(httpProfile)
  });

  loadModels(storageArea);
  await waitForMicrotasks();

  assert.equal(storageArea.state.customProviderAllowHttp, true);
  assert.equal(storageArea.state.customProviderAllowHttpMigrated, true);
}

async function testCodexAuthJsonNormalizesAndSavesTokens() {
  const authJson = JSON.stringify({
    tokens: {
      access_token: "codex-access",
      refresh_token: "codex-refresh",
      account_id: "acc_123"
    },
    last_refresh: "2026-04-25T00:00:00.000Z"
  });
  const storageArea = createStorageArea({});
  const models = loadModels(storageArea);
  await waitForMicrotasks();

  const normalized = models.normalizeConfig({
    authMode: models.AUTH_MODE_CODEX,
    apiKey: authJson,
    defaultModel: "gpt-5.5"
  });

  assert.equal(normalized.authMode, models.AUTH_MODE_CODEX);
  assert.equal(normalized.format, models.OPENAI_RESPONSES_FORMAT);
  assert.equal(normalized.baseUrl, models.CODEX_DEFAULT_BASE_URL);
  assert.equal(normalized.apiKey, "codex-access");
  assert.equal(normalized.codexRefreshToken, "codex-refresh");
  assert.equal(normalized.codexAccountId, "acc_123");

  await models.saveProviderProfile({
    ...createProfile({
      authMode: models.AUTH_MODE_CODEX,
      format: models.OPENAI_RESPONSES_FORMAT,
      baseUrl: "",
      apiKey: authJson,
      defaultModel: "gpt-5.5"
    })
  }, {
    profileId: "provider_codex",
    storageArea
  });

  assert.equal(storageArea.state.customProviderProfiles[0].apiKey, "codex-access");
  assert.equal(storageArea.state.customProviderProfiles[0].codexRefreshToken, "codex-refresh");
  assert.equal(storageArea.state.customProviderProfiles[0].codexAccountId, "acc_123");
  assert.equal(storageArea.state.customProviderConfig.baseUrl, models.CODEX_DEFAULT_BASE_URL);
}

async function testCodexProbeUsesStreamingResponsesAndAccountHeader() {
  const storageArea = createStorageArea({});
  const models = loadModels(storageArea);
  await waitForMicrotasks();
  let capturedCall = null;
  const fetchImpl = async (input, init) => {
    capturedCall = {
      url: String(input),
      headers: init.headers,
      body: JSON.parse(init.body)
    };
    return {
      ok: true,
      status: 200,
      headers: {
        get() {
          return "text/event-stream";
        }
      },
      async text() {
        return [
          "event: response.output_text.delta",
          "data: {\"type\":\"response.output_text.delta\",\"delta\":\"OK\"}",
          "",
          "data: [DONE]",
          ""
        ].join("\n");
      }
    };
  };

  const result = await models.probeProviderModel(createProfile({
    authMode: models.AUTH_MODE_CODEX,
    format: models.OPENAI_RESPONSES_FORMAT,
    baseUrl: models.CODEX_DEFAULT_BASE_URL,
    apiKey: "codex-access",
    codexAccountId: "acc_123",
    defaultModel: "gpt-5.5"
  }), {
    storageArea,
    fetchImpl
  });

  assert.equal(capturedCall.url, `${models.CODEX_DEFAULT_BASE_URL}/responses`);
  assert.equal(capturedCall.headers.Authorization, "Bearer codex-access");
  assert.equal(capturedCall.headers["ChatGPT-Account-ID"], "acc_123");
  assert.equal(capturedCall.headers.Accept, "text/event-stream, application/json");
  assert.equal(capturedCall.body.stream, true);
  assert.equal(Object.prototype.hasOwnProperty.call(capturedCall.body, "max_output_tokens"), false);
  assert.equal(Array.isArray(capturedCall.body.input), true);
  assert.equal(result.replyText, "OK");
  assert.equal(result.ok, true);
}

async function testCodexFetchModelsUsesClientVersionAndModelsPayload() {
  const storageArea = createStorageArea({});
  const models = loadModels(storageArea);
  await waitForMicrotasks();
  let capturedCall = null;
  const fetchImpl = async (input, init) => {
    capturedCall = {
      url: String(input),
      headers: init.headers
    };
    return {
      ok: true,
      status: 200,
      headers: {
        get() {
          return "application/json";
        }
      },
      async text() {
        return JSON.stringify({
          models: [
            {
              slug: "gpt-5.5",
              display_name: "GPT-5.5",
              visibility: "list",
              supported_in_api: true
            },
            {
              slug: "gpt-hidden",
              display_name: "Hidden",
              visibility: "hide",
              supported_in_api: true
            },
            {
              slug: "gpt-unsupported",
              display_name: "Unsupported",
              visibility: "list",
              supported_in_api: false
            }
          ]
        });
      }
    };
  };

  const fetched = await models.fetchProviderModels(createProfile({
    authMode: models.AUTH_MODE_CODEX,
    format: models.OPENAI_RESPONSES_FORMAT,
    baseUrl: models.CODEX_DEFAULT_BASE_URL,
    apiKey: "codex-access",
    codexAccountId: "acc_123",
    defaultModel: "gpt-5.5"
  }), {
    storageArea,
    fetchImpl
  });

  assert.match(capturedCall.url, /\/models\?client_version=0\.125\.0-alpha\.3$/);
  assert.equal(capturedCall.headers.Authorization, "Bearer codex-access");
  assert.equal(capturedCall.headers["ChatGPT-Account-ID"], "acc_123");
  assert.equal(fetched.length, 1);
  assert.equal(fetched[0].value, "gpt-5.5");
  assert.equal(fetched[0].label, "GPT-5.5");
  assert.equal(fetched[0].manual, false);
}

async function testCodexRefreshPersistsUpdatedTokens() {
  const codexProfile = createProfile({
    authMode: "codex",
    format: "openai_responses",
    baseUrl: "https://chatgpt.com/backend-api/codex",
    apiKey: "old-access",
    codexRefreshToken: "old-refresh",
    codexAccountId: "acc_123",
    defaultModel: "gpt-5.5"
  });
  const storageArea = createStorageArea({
    customProviderProfiles: [codexProfile],
    customProviderActiveProfileId: codexProfile.id,
    customProviderConfig: projectProfileToConfig(codexProfile)
  });
  const models = loadModels(storageArea);
  await waitForMicrotasks();
  let refreshBody = null;
  const fetchImpl = async (input, init) => {
    assert.equal(String(input), "https://auth.openai.com/oauth/token");
    refreshBody = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      async text() {
        return JSON.stringify({
          access_token: "new-access",
          refresh_token: "new-refresh"
        });
      }
    };
  };

  const refreshed = await models.refreshCodexAuthForConfig(codexProfile, {
    profileId: codexProfile.id,
    storageArea,
    fetchImpl,
    force: true
  });

  assert.equal(refreshBody.grant_type, "refresh_token");
  assert.equal(refreshBody.refresh_token, "old-refresh");
  assert.equal(refreshed.apiKey, "new-access");
  assert.equal(refreshed.codexRefreshToken, "new-refresh");
  assert.equal(storageArea.state.customProviderProfiles[0].apiKey, "new-access");
  assert.equal(storageArea.state.customProviderConfig.apiKey, "new-access");
}

async function main() {
  await testSavingActiveProfileSyncsSelectedModels();
  await testSavingNonModelFieldsKeepsExistingStickySelection();
  await testEditingInactiveProfileDoesNotResyncActiveSelection();
  await testActivatingAnotherProfileSyncsSelectedModels();
  await testReconcileRepairsExistingStaleSelectionWithoutResave();
  await testLoadingLegacyStorageCleansDeprecatedFields();
  await testManualAliasOnlyChangesDisplayName();
  await testSyncModelOptionsUsesAliasButKeepsModelIdValue();
  await testSavingHttpProfileDefaultsToEnabled();
  await testSavingHttpProfileSucceedsWhenToggleEnabled();
  await testActivatingHttpProfileDefaultsToEnabled();
  await testFetchAndProbeAllowHttpByDefault();
  await testFetchAndProbeRejectWhenHttpExplicitlyDisabled();
  await testLegacyActiveHttpProfileMigratesToggleToEnabled();
  await testCodexAuthJsonNormalizesAndSavesTokens();
  await testCodexProbeUsesStreamingResponsesAndAccountHeader();
  await testCodexFetchModelsUsesClientVersionAndModelsPayload();
  await testCodexRefreshPersistsUpdatedTokens();
  console.log("custom-provider-models sync regression tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
