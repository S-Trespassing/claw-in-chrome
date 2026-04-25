#  Claw in Chrome

<div align="center">

![Claw in Chrome](https://img.shields.io/badge/Claw-in%20Chrome-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.66.5-green?style=for-the-badge)
![Platform](https://img.shields.io/badge/platform-Chrome%20116%2B-lightgrey?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

</div>

[简体中文](./README.md) | English

Put Claw into Chrome's sidebar so you can connect your own model providers directly while giving AI access to browser-side assistance and task execution.

<a href="#-quick-start"><b>🚀 Quick Start</b></a> | <a href="#-features"><b>✨ Features</b></a> | <a href="#-project-structure"><b>🗂️ Project Structure</b></a>

![Sidebar chat](./screenshots/03.png) 
![Flow visualizer](./screenshots/06.png)

---

## ✨ Features

- **🧠 Custom model providers**
  - Connect your own model APIs and configure key fields such as `Base URL`, `API Key`, and `Model`.
- **🧩 Native sidebar workflow**
  - Run as a Chrome extension with no extra desktop client required. Open the sidebar and start using it directly in your browser.
- **🔗 Works with Claw in Chrome MCP**
  - Can be used together with [`claw-in-chrome-mcp`](https://github.com/S-Trespassing/claw-in-chrome-mcp) to expand browser-side automation and coordination capabilities.
- **⚙️ Finer-grained parameter control**
  - Edit provider parameters that are difficult or impossible to adjust in the original plugin, making it easier to support local models, custom gateways, and third-party platforms.
- **🌍 Multilingual and UI enhancements**
  - Includes multilingual resources, settings-page enhancements, and visualization-related modules for ongoing iteration and easier troubleshooting.

## 💡 Use Cases

- Connect your own model APIs in Chrome instead of being limited to the default provider
- Keep the sidebar workflow while integrating local models, proxy gateways, or third-party platforms
- Let AI handle more browser-side assistance and information-organizing tasks for you

## 🚀 Quick Start

### 1. Install the extension

1. Open `chrome://extensions/`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Select this `claw in chrome` folder
5. Pin `Claw` to the browser toolbar and open the sidebar

### 2. Configure a model provider

Open the extension options page and go to `Model provider` in the left menu. Create a new profile and fill in:

- `Provider format`
- `Base URL`
- `API Key`
- `Model`

To use Codex/ChatGPT login credentials, choose `Codex login` as the authentication mode, keep `Provider format` on `OpenAI Responses API`, and use `https://chatgpt.com/backend-api/codex` as the base URL. Run `codex login` locally, then paste the contents of `~/.codex/auth.json` or the access token into the credential field.

After saving and applying the configuration, close and reopen the sidebar once to make it take effect.

### 3. Recommended setting

**We recommend using the `Anthropic` protocol format first.**

For this project's target workflow, that format usually unlocks the best tool behavior and aligns more closely with expected interactions.

## 🗂️ Project Structure

- `assets/`: extension assets and bundled files
- `i18n/`: localization resources
- `tests/`: unit, integration, and E2E tests
- `scripts/`: release helper scripts
- `docs/`: screenshots and supplementary docs

## ⚖️ License

**MIT**

---

**⭐ If this project helps you, consider giving it a Star.**

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=S-Trespassing/claw-in-chrome&type=date&legend=top-left)](https://www.star-history.com/#S-Trespassing/claw-in-chrome&type=date&legend=top-left)
