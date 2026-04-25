#  Claw in Chrome

<div align="center">

![Claw in Chrome](https://img.shields.io/badge/Claw-in%20Chrome-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.66.5-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Chrome%20116%2B-lightgrey?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

</div>

简体中文 | [English](./README_EN.md)

把 Claw 放进 Chrome 侧边栏，让你在浏览网页时直接接入自己的模型供应商，并把浏览器内的部分操作能力交给 AI。

<a href="#-快速开始"><b>🚀 快速开始</b></a> | <a href="#-功能亮点"><b>✨ 功能亮点</b></a> | <a href="#-项目结构"><b>🗂️ 项目结构</b></a>

![侧边栏聊天界面](./screenshots/03.png) 
![流程可视化](./screenshots/06.png)

---

## ✨ 功能亮点

- **🧠 自定义模型供应商**
  - 支持接入你自己的模型接口，按需配置 `Base URL`、`API Key`、`模型` 等关键参数。
- **🧩 侧边栏内直接使用**
  - 作为 Chrome 扩展运行，无需额外桌面客户端，打开侧边栏即可完成对话与任务辅助。
- **🔗 可与 Claw in Chrome MCP 联动**
  - 支持与 [`claw-in-chrome-mcp`](https://github.com/S-Trespassing/claw-in-chrome-mcp) 配合使用，扩展浏览器内的自动化与协同能力。
- **⚙️ 更细粒度的参数控制**
  - 可编辑原插件中不方便调整的供应商参数，方便适配自建网关、本地模型和第三方平台。
- **🌍 多语言与界面增强**
  - 仓库内置多语言资源、设置页增强与可视化相关模块，方便持续迭代与日常排查。

## 💡 适用场景

- 想在 Chrome 里直接调用自己的模型接口，而不是受限于默认提供方
- 想保留侧边栏工作流，同时接入本地模型、代理网关或第三方平台
- 想让 AI 在浏览网页时承担更多辅助操作与信息整理工作

## 🚀 快速开始

### 1. 安装扩展

1. 打开 `chrome://extensions/`
2. 开启右上角 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择当前 `claw in chrome` 文件夹
5. 将 `Claw` 固定到浏览器工具栏，并打开侧边栏

### 2. 配置模型供应商

打开扩展设置页，进入左侧 `模型供应商`。新增一套配置后，主要填写：

- `供应商格式`
- `Base URL`
- `API Key`
- `模型`

如果要使用 Codex/ChatGPT 登录认证，请把认证方式选为 `Codex login`，`供应商格式` 保持 `OpenAI Responses API`，Base URL 使用 `https://chatgpt.com/backend-api/codex`。本机先运行 `codex login`，然后把 `~/.codex/auth.json` 内容或 access token 粘贴到凭据输入框。

保存并应用后，关闭并重新打开一次侧边栏即可生效。

### 3. 推荐设置

**推荐优先使用 `Anthropic` 协议格式。**

在当前项目的目标场景下，这种格式通常更能发挥工具能力，也更容易对齐交互预期。

## 🗂️ 项目结构

- `assets/`：扩展资源与打包产物
- `i18n/`：多语言文案
- `tests/`：单元、集成与 E2E 测试
- `scripts/`：发布辅助脚本
- `docs/`：截图与补充说明

## ⚖️ License

**MIT** 

---

**⭐ 如果这个项目对你有帮助，欢迎点个 Star 支持一下。**

##  Star 历史


[![Star History Chart](https://api.star-history.com/svg?repos=S-Trespassing/claw-in-chrome&type=date&legend=top-left)](https://www.star-history.com/#S-Trespassing/claw-in-chrome&type=date&legend=top-left)
