const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const contractPath = path.join(__dirname, "..", "..", "claw-contract.js");
const adapterPath = path.join(__dirname, "..", "..", "provider-format-adapter.js");
const contractSource = fs.readFileSync(contractPath, "utf8");
const adapterSource = fs.readFileSync(adapterPath, "utf8");

async function runAdapterWithUpstreamHandler(upstreamHandler, options = {}) {
  const config = {
    format: "openai_chat",
    baseUrl: "https://provider.example/v1",
    apiKey: "test-key",
    defaultModel: "gpt-5.4",
    fastModel: "",
    ...(options.config || {})
  };
  const upstreamCalls = [];
  const nativeFetch = async (input, init) => {
    upstreamCalls.push({
      url: String(input),
      body: init && typeof init.body === "string" ? JSON.parse(init.body) : null,
      headers: init ? Object.fromEntries(new Headers(init.headers).entries()) : {}
    });
    return upstreamHandler({
      input,
      init,
      call: upstreamCalls[upstreamCalls.length - 1],
      callIndex: upstreamCalls.length - 1
    });
  };
  const sandbox = {
    console,
    Request,
    Response,
    Headers,
    URL,
    TextEncoder,
    TextDecoder,
    TransformStream,
    ReadableStream,
    WritableStream,
    AbortController,
    DOMException,
    setTimeout,
    clearTimeout,
    fetch: nativeFetch,
    chrome: {
      storage: {
        local: {
          async get(key) {
            if (typeof key === "string") {
              return {
                [key]: config
              };
            }
            return {
              customProviderConfig: config
            };
          }
        },
        onChanged: {
          addListener() {}
        }
      }
    }
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(contractSource, sandbox, {
    filename: "claw-contract.js"
  });
  vm.runInNewContext(adapterSource, sandbox, {
    filename: "provider-format-adapter.js"
  });
  const requestBody = options.requestBody || {
    model: "gpt-5.4",
    max_tokens: 128,
    stream: false,
    messages: [
      {
        role: "user",
        content: "Find the search box."
      }
    ]
  };
  const request = new Request(options.requestUrl || "https://provider.example/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": "anthropic-test-key",
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify(requestBody)
  });
  const response = await sandbox.fetch(request);
  if (options.readText) {
    return {
      status: response.status,
      text: await response.text(),
      upstreamCalls
    };
  }
  return {
    status: response.status,
    json: await response.json(),
    upstreamCalls
  };
}

async function runAdapterWithPayload(providerPayload) {
  return runAdapterWithUpstreamHandler(async () => new Response(JSON.stringify(providerPayload), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  }));
}

async function testOutputTextPartsSurviveOpenAIChatTransform() {
  const payload = {
    id: "chatcmpl-output-text",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: [
            {
              type: "output_text",
              output_text: "FOUND: 1\nSHOWING: 1\n---\nref_1 | textbox | Search | textbox | text match"
            }
          ]
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.equal(result.upstreamCalls.length, 1, "should call upstream once");
  assert.equal(result.upstreamCalls[0].url, "https://provider.example/v1/chat/completions");
  assert.equal(result.json.type, "message");
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "FOUND: 1\nSHOWING: 1\n---\nref_1 | textbox | Search | textbox | text match"
    }
  ]);
}

async function testStringContentStillWorks() {
  const payload = {
    id: "chatcmpl-string",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: "FOUND: 0\nERROR: no matches"
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "FOUND: 0\nERROR: no matches"
    }
  ]);
}

async function testMessageLevelResponseTextFallbackWorks() {
  const payload = {
    id: "chatcmpl-response-text",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: [],
          response_text: "FOUND: 1\nSHOWING: 1\n---\nref_2 | button | Search | button | response_text fallback"
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "FOUND: 1\nSHOWING: 1\n---\nref_2 | button | Search | button | response_text fallback"
    }
  ]);
}

async function testEmptyNonStreamContentRetriesAsStream() {
  const result = await runAdapterWithUpstreamHandler(async ({ callIndex, call }) => {
    if (callIndex === 0) {
      return new Response(JSON.stringify({
        id: "chatcmpl-empty-content",
        model: "gpt-5.4",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant"
            }
          }
        ],
        usage: {
          prompt_tokens: 42,
          completion_tokens: 7,
          total_tokens: 49
        }
      }), {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "content-length": "280"
        }
      });
    }
    assert.equal(call.body.stream, true, "stream fallback should request streaming");
    assert.equal(call.headers.accept, "text/event-stream", "stream fallback should request SSE");
    return new Response([
      "data: {\"id\":\"chatcmpl-stream\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\"},\"finish_reason\":null}]}",
      "",
      "data: {\"id\":\"chatcmpl-stream\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"FOUND: 1\\nSHOWING: 1\\n---\\nref_9 | textbox | Search | textbox | streamed fallback\"},\"finish_reason\":null}]}",
      "",
      "data: {\"id\":\"chatcmpl-stream\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":42,\"completion_tokens\":7,\"total_tokens\":49}}",
      "",
      "data: [DONE]",
      ""
    ].join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/event-stream"
      }
    });
  });
  assert.equal(result.upstreamCalls.length, 2, "should retry once with streaming fallback");
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "FOUND: 1\nSHOWING: 1\n---\nref_9 | textbox | Search | textbox | streamed fallback"
    }
  ]);
}

async function testJsonContentToolCallIsConvertedToToolUse() {
  const payload = {
    id: "chatcmpl-json-tool",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: "{\"name\":\"search\",\"arguments\":\"{\\\"query\\\":\\\"cats\\\"}\"}"
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "content_tool_call_0",
      name: "search",
      input: {
        query: "cats"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testNestedFunctionWrapperContentIsConvertedToToolUse() {
  const payload = {
    id: "chatcmpl-json-nested-tool",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: "{\"type\":\"function\",\"function\":{\"name\":\"search\",\"arguments\":\"{\\\"query\\\":\\\"cats\\\"}\"}}"
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "content_tool_call_0",
      name: "search",
      input: {
        query: "cats"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testResponsesTextWrappedToolCallIsConvertedToToolUse() {
  const payload = {
    id: "resp-json-tool",
    model: "gpt-5.4",
    status: "completed",
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: "{\"name\":\"search\",\"arguments\":\"{\\\"query\\\":\\\"cats\\\"}\"}"
          }
        ]
      }
    ],
    usage: {
      input_tokens: 12,
      output_tokens: 4,
      total_tokens: 16
    }
  };
  const result = await runAdapterWithUpstreamHandler(async () => new Response(JSON.stringify(payload), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  }), {
    config: {
      format: "openai_responses"
    },
    requestBody: {
      model: "gpt-5.4",
      max_tokens: 128,
      stream: false,
      tools: [
        {
          name: "search",
          description: "Search",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string"
              }
            },
            required: ["query"]
          }
        }
      ],
      messages: [
        {
          role: "user",
          content: "Find cats"
        }
      ]
    }
  });
  assert.equal(result.upstreamCalls[0].url, "https://provider.example/v1/responses");
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "responses_text_tool_call_0",
      name: "search",
      input: {
        query: "cats"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testCodexAuthHeadersForwardToResponsesEndpoint() {
  const result = await runAdapterWithUpstreamHandler(async () => new Response(JSON.stringify({
    id: "resp-codex",
    model: "gpt-5.5",
    status: "completed",
    output: [
      {
        type: "message",
        content: [
          {
            type: "output_text",
            text: "FOUND: 0\nERROR: no matches"
          }
        ]
      }
    ]
  }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  }), {
    config: {
      authMode: "codex",
      format: "openai_responses",
      baseUrl: "https://chatgpt.com/backend-api/codex",
      apiKey: "codex-access",
      codexAccountId: "acc_123",
      defaultModel: "gpt-5.5"
    },
    requestUrl: "https://chatgpt.com/backend-api/codex/messages",
    requestBody: {
      model: "gpt-5.5",
      max_tokens: 128,
      temperature: 0,
      stream: true,
      messages: [
        {
          role: "user",
          content: "Find cats"
        }
      ]
    }
  });

  assert.equal(result.upstreamCalls.length, 1, "should call Codex once");
  assert.equal(result.upstreamCalls[0].url, "https://chatgpt.com/backend-api/codex/responses");
  assert.equal(result.upstreamCalls[0].headers.authorization, "Bearer codex-access");
  assert.equal(result.upstreamCalls[0].headers["chatgpt-account-id"], "acc_123");
  assert.equal(result.upstreamCalls[0].headers.version, "claw-in-chrome-codex-provider");
  assert.equal(Object.prototype.hasOwnProperty.call(result.upstreamCalls[0].body, "max_output_tokens"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(result.upstreamCalls[0].body, "temperature"), false);
  assert.equal(result.upstreamCalls[0].body.instructions, "");
  assert.equal(result.upstreamCalls[0].body.store, false);
  assert.equal(result.upstreamCalls[0].body.stream, true);
  assert.equal(result.json.content[0].text, "FOUND: 0\nERROR: no matches");
}

async function testCodexStreamWithoutContentTypeTransforms() {
  const result = await runAdapterWithUpstreamHandler(async () => new Response([
    "event: response.created",
    "data: {\"type\":\"response.created\",\"response\":{\"id\":\"resp_codex_stream\",\"model\":\"gpt-5.5\",\"status\":\"in_progress\"}}",
    "",
    "event: response.output_text.delta",
    "data: {\"type\":\"response.output_text.delta\",\"delta\":\"OK\"}",
    "",
    "event: response.completed",
    "data: {\"type\":\"response.completed\",\"response\":{\"id\":\"resp_codex_stream\",\"model\":\"gpt-5.5\",\"status\":\"completed\",\"usage\":{\"input_tokens\":4,\"output_tokens\":1}}}",
    "",
    "data: [DONE]",
    ""
  ].join("\n"), {
    status: 200
  }), {
    readText: true,
    config: {
      authMode: "codex",
      format: "openai_responses",
      baseUrl: "https://chatgpt.com/backend-api/codex",
      apiKey: "codex-access",
      codexAccountId: "acc_123",
      defaultModel: "gpt-5.5"
    },
    requestUrl: "https://chatgpt.com/backend-api/codex/messages",
    requestBody: {
      model: "gpt-5.5",
      max_tokens: 128,
      temperature: 0,
      stream: true,
      messages: [
        {
          role: "user",
          content: "Find cats"
        }
      ]
    }
  });

  assert.equal(result.status, 200);
  assert.match(result.text, /event: message_start/);
  assert.match(result.text, /event: content_block_delta/);
  assert.match(result.text, /OK/);
  assert.equal(Object.prototype.hasOwnProperty.call(result.upstreamCalls[0].body, "max_output_tokens"), false);
  assert.equal(result.upstreamCalls[0].body.instructions, "");
  assert.equal(result.upstreamCalls[0].body.store, false);
}

async function testResponsesRuntimeFallsBackToChatWhenConfiguredEndpointFails() {
  const result = await runAdapterWithUpstreamHandler(async ({ callIndex, call }) => {
    if (callIndex === 0) {
      assert.equal(call.url, "https://provider.example/v1/responses");
      return new Response(JSON.stringify({
        error: {
          message: "Responses endpoint unsupported"
        }
      }), {
        status: 404,
        headers: {
          "content-type": "application/json; charset=utf-8"
        }
      });
    }
    assert.equal(call.url, "https://provider.example/v1/chat/completions");
    return new Response(JSON.stringify({
      id: "chatcmpl-fallback",
      model: "gpt-5.4",
      choices: [
        {
          index: 0,
          finish_reason: "stop",
          message: {
            role: "assistant",
            content: "FOUND: 1\nSHOWING: 1\n---\nref_fallback | textbox | Search | textbox | runtime fallback"
          }
        }
      ]
    }), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8"
      }
    });
  }, {
    config: {
      format: "openai_responses",
      defaultModel: "gpt-5.4"
    },
    requestBody: {
      model: "gpt-5.4",
      max_tokens: 128,
      stream: false,
      messages: [
        {
          role: "user",
          content: "Find cats"
        }
      ]
    }
  });
  assert.equal(result.upstreamCalls.length, 2, "should retry with chat completions after responses failure");
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "FOUND: 1\nSHOWING: 1\n---\nref_fallback | textbox | Search | textbox | runtime fallback"
    }
  ]);
}

async function testGpt54ChatToolCallsDropReasoningEffort() {
  const result = await runAdapterWithUpstreamHandler(async () => new Response(JSON.stringify({
    id: "chatcmpl-gpt54-tool",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "browser.find",
                arguments: "{\"query\":\"Search\"}"
              }
            }
          ]
        }
      }
    ]
  }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  }), {
    requestBody: {
      model: "gpt-5.4",
      max_tokens: 128,
      stream: false,
      thinking: {
        type: "enabled",
        budget_tokens: 8000
      },
      tools: [
        {
          name: "browser.find",
          description: "Find element",
          input_schema: {
            type: "object",
            properties: {
              query: {
                type: "string"
              }
            },
            required: ["query"]
          }
        }
      ],
      messages: [
        {
          role: "user",
          content: "Find the search box."
        }
      ]
    }
  });
  assert.equal("reasoning_effort" in result.upstreamCalls[0].body, false, "gpt-5.4 chat tool calls should omit reasoning_effort");
}

async function testConfiguredProviderDefaultsFillMissingAnthropicFields() {
  const result = await runAdapterWithUpstreamHandler(async () => new Response(JSON.stringify({
    id: "chatcmpl-config-defaults",
    model: "gpt-5.1",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: "FOUND: 1\nSHOWING: 1\n---\nref_cfg | textbox | Search | textbox | config defaults"
        }
      }
    ]
  }), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  }), {
    config: {
      format: "openai_chat",
      defaultModel: "gpt-5.1",
      reasoningEffort: "high",
      maxOutputTokens: 4321,
      contextWindow: 240000
    },
    requestBody: {
      model: "gpt-5.1",
      stream: false,
      messages: [
        {
          role: "user",
          content: "Find the search box."
        }
      ]
    }
  });
  assert.equal(result.upstreamCalls[0].body.max_tokens, 4321, "missing max_tokens should use provider default");
  assert.equal(result.upstreamCalls[0].body.reasoning_effort, "high", "missing output_config should use provider reasoning default");
}

async function testStreamFallbackJsonToolCallContentIsConvertedToToolUse() {
  const result = await runAdapterWithUpstreamHandler(async ({ callIndex, call }) => {
    if (callIndex === 0) {
      return new Response(JSON.stringify({
        id: "chatcmpl-empty-json-tool",
        model: "gpt-5.4",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant"
            }
          }
        ],
        usage: {
          prompt_tokens: 42,
          completion_tokens: 7,
          total_tokens: 49
        }
      }), {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "content-length": "280"
        }
      });
    }
    assert.equal(call.body.stream, true, "stream fallback should request streaming");
    return new Response([
      "data: {\"id\":\"chatcmpl-stream-tool\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\"},\"finish_reason\":null}]}",
      "",
      "data: {\"id\":\"chatcmpl-stream-tool\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"{\\\"type\\\":\\\"function\\\",\\\"function\\\":{\\\"name\\\":\\\"search\\\",\\\"arguments\\\":\\\"{\\\\\\\"query\\\\\\\":\\\\\\\"cats\\\\\\\"}\\\"}}\"},\"finish_reason\":null}]}",
      "",
      "data: {\"id\":\"chatcmpl-stream-tool\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"content\":\"\"},\"finish_reason\":\"stop\"}],\"usage\":{\"prompt_tokens\":42,\"completion_tokens\":7,\"total_tokens\":49}}",
      "",
      "data: [DONE]",
      ""
    ].join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/event-stream"
      }
    });
  });
  assert.equal(result.upstreamCalls.length, 2, "should retry once with streaming fallback");
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "stream_text_tool_call_0",
      name: "search",
      input: {
        query: "cats"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testRefusalPartsRemainVisibleText() {
  const payload = {
    id: "chatcmpl-refusal",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: [
            {
              type: "refusal",
              refusal: "I cannot do that."
            }
          ]
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "I cannot do that."
    }
  ]);
}

async function testToolCallsDoNotTriggerStreamFallbackRetry() {
  const result = await runAdapterWithUpstreamHandler(async () => new Response(JSON.stringify({
    id: "chatcmpl-tool-call",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: {
                name: "browser.find",
                arguments: "{\"query\":\"Search\"}"
              }
            }
          ]
        }
      }
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 3,
      total_tokens: 13
    }
  }), {
    status: 200,
    headers: {
      "content-type": "text/event-stream"
    }
  }));

  assert.equal(result.upstreamCalls.length, 1, "tool call responses should not retry as stream fallback");
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "call_1",
      name: "browser.find",
      input: {
        query: "Search"
      }
    }
  ]);
}

async function testLegacyFunctionCallIsConvertedToToolUse() {
  const payload = {
    id: "chatcmpl-function-call",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "function_call",
        message: {
          role: "assistant",
          function_call: {
            name: "browser.open_tab",
            arguments: "{\"url\":\"https://example.com\"}"
          }
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "function_call_0",
      name: "browser.open_tab",
      input: {
        url: "https://example.com"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testMalformedToolCallArgumentsReturnErrorResponse() {
  const payload = {
    id: "chatcmpl-bad-tool-args",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "tool_calls",
        message: {
          role: "assistant",
          tool_calls: [
            {
              id: "call_bad_args",
              type: "function",
              function: {
                name: "browser.find",
                arguments: "{\"query\":"
              }
            }
          ]
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.equal(result.status, 500);
  assert.equal(result.json.type, "error");
  assert.match(result.json.error.message, /tool call arguments are not valid json/i);
}

async function testMessageContentObjectStillExtractsVisibleText() {
  const payload = {
    id: "chatcmpl-content-object",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: {
            type: "text",
            text: "FOUND: 2\nSHOWING: 2\n---\nref_3 | link | Search docs | link | object content"
          }
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "FOUND: 2\nSHOWING: 2\n---\nref_3 | link | Search docs | link | object content"
    }
  ]);
}

async function testMessageOutputTextFallbackCanPromoteInlineToolCall() {
  const payload = {
    id: "chatcmpl-output-text-tool",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: {
          role: "assistant",
          content: [],
          output_text: "{\"name\":\"browser.find\",\"arguments\":\"{\\\"query\\\":\\\"Search docs\\\"}\"}"
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "message_text_tool_call_0",
      name: "browser.find",
      input: {
        query: "Search docs"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testStreamingDeltaToolCallsAreReassembledAcrossChunks() {
  const result = await runAdapterWithUpstreamHandler(async ({ callIndex, call }) => {
    if (callIndex === 0) {
      return new Response(JSON.stringify({
        id: "chatcmpl-empty-stream-tool-call",
        model: "gpt-5.4",
        choices: [
          {
            index: 0,
            finish_reason: "stop",
            message: {
              role: "assistant"
            }
          }
        ],
        usage: {
          prompt_tokens: 11,
          completion_tokens: 5,
          total_tokens: 16
        }
      }), {
        status: 200,
        headers: {
          "content-type": "text/event-stream",
          "content-length": "280"
        }
      });
    }
    assert.equal(call.body.stream, true, "stream fallback should request streaming");
    return new Response([
      "data: {\"id\":\"chatcmpl-stream-delta-tool\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"role\":\"assistant\"},\"finish_reason\":null}]}",
      "",
      "data: {\"id\":\"chatcmpl-stream-delta-tool\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"id\":\"call_stream_1\",\"function\":{\"name\":\"browser.find\",\"arguments\":\"{\\\"query\\\":\"}}]},\"finish_reason\":null}]}",
      "",
      "data: {\"id\":\"chatcmpl-stream-delta-tool\",\"object\":\"chat.completion.chunk\",\"model\":\"gpt-5.4\",\"choices\":[{\"index\":0,\"delta\":{\"tool_calls\":[{\"index\":0,\"function\":{\"arguments\":\"\\\"Search docs\\\"}\"}}]},\"finish_reason\":\"tool_calls\"}],\"usage\":{\"prompt_tokens\":11,\"completion_tokens\":5,\"total_tokens\":16}}",
      "",
      "data: [DONE]",
      ""
    ].join("\n"), {
      status: 200,
      headers: {
        "content-type": "text/event-stream"
      }
    });
  });
  assert.equal(result.upstreamCalls.length, 2, "should retry once and reassemble tool-call deltas");
  assert.deepEqual(result.json.content, [
    {
      type: "tool_use",
      id: "call_stream_1",
      name: "browser.find",
      input: {
        query: "Search docs"
      }
    }
  ]);
  assert.equal(result.json.stop_reason, "tool_use");
}

async function testContentFilterMapsToEndTurnWithoutToolUse() {
  const payload = {
    id: "chatcmpl-content-filter",
    model: "gpt-5.4",
    choices: [
      {
        index: 0,
        finish_reason: "content_filter",
        message: {
          role: "assistant",
          content: "Filtered response"
        }
      }
    ]
  };
  const result = await runAdapterWithPayload(payload);
  assert.equal(result.json.stop_reason, "end_turn");
  assert.deepEqual(result.json.content, [
    {
      type: "text",
      text: "Filtered response"
    }
  ]);
}

async function main() {
  await testOutputTextPartsSurviveOpenAIChatTransform();
  await testStringContentStillWorks();
  await testMessageLevelResponseTextFallbackWorks();
  await testEmptyNonStreamContentRetriesAsStream();
  await testJsonContentToolCallIsConvertedToToolUse();
  await testNestedFunctionWrapperContentIsConvertedToToolUse();
  await testResponsesTextWrappedToolCallIsConvertedToToolUse();
  await testCodexAuthHeadersForwardToResponsesEndpoint();
  await testCodexStreamWithoutContentTypeTransforms();
  await testResponsesRuntimeFallsBackToChatWhenConfiguredEndpointFails();
  await testGpt54ChatToolCallsDropReasoningEffort();
  await testConfiguredProviderDefaultsFillMissingAnthropicFields();
  await testStreamFallbackJsonToolCallContentIsConvertedToToolUse();
  await testRefusalPartsRemainVisibleText();
  await testToolCallsDoNotTriggerStreamFallbackRetry();
  await testLegacyFunctionCallIsConvertedToToolUse();
  await testMalformedToolCallArgumentsReturnErrorResponse();
  await testMessageContentObjectStillExtractsVisibleText();
  await testMessageOutputTextFallbackCanPromoteInlineToolCall();
  await testStreamingDeltaToolCallsAreReassembledAcrossChunks();
  await testContentFilterMapsToEndTurnWithoutToolUse();
  console.log("provider-format-adapter find regression tests passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
