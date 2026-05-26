class FakeClassList {
  constructor(element) {
    this.element = element;
  }

  _getList() {
    return String(this.element.className || "").split(/\s+/).filter(Boolean);
  }

  _setList(next) {
    this.element.className = Array.from(new Set(next)).join(" ");
  }

  add(...tokens) {
    this._setList(this._getList().concat(tokens.map(token => String(token || "")).filter(Boolean)));
  }

  remove(...tokens) {
    const blocked = new Set(tokens.map(token => String(token || "")).filter(Boolean));
    this._setList(this._getList().filter(token => !blocked.has(token)));
  }

  contains(token) {
    return this._getList().includes(String(token || ""));
  }
}

class FakeElement {
  constructor(tagName, ownerDocument) {
    this.tagName = String(tagName || "").toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = {};
    this.className = "";
    this.hidden = false;
    this.value = "";
    this.type = "";
    this.disabled = false;
    this.inputMode = "";
    this.placeholder = "";
    this.title = "";
    this.listeners = new Map();
    this.classList = new FakeClassList(this);
    this._id = "";
    this._textContent = "";
  }

  get id() {
    return this._id;
  }

  set id(value) {
    this._id = String(value || "");
    this.attributes.id = this._id;
  }

  get isConnected() {
    if (this === this.ownerDocument.body || this === this.ownerDocument.head) {
      return true;
    }
    return Boolean(this.parentNode && this.parentNode.isConnected);
  }

  get childElementCount() {
    return this.children.length;
  }

  get firstChild() {
    return this.children[0] || null;
  }

  get lastChild() {
    return this.children[this.children.length - 1] || null;
  }

  get nextElementSibling() {
    if (!this.parentNode) {
      return null;
    }
    const siblings = this.parentNode.children;
    const index = siblings.indexOf(this);
    return index >= 0 ? siblings[index + 1] || null : null;
  }

  get textContent() {
    return this._textContent + this.children.map(child => child.textContent).join("");
  }

  set textContent(value) {
    this._textContent = String(value || "");
    this.children = [];
  }

  appendChild(child) {
    if (!child) {
      return child;
    }
    if (child.parentNode) {
      child.remove();
    }
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  replaceChildren(...children) {
    this._textContent = "";
    for (const child of this.children) {
      child.parentNode = null;
    }
    this.children = [];
    for (const child of children.filter(Boolean)) {
      this.appendChild(child);
    }
  }

  remove() {
    if (!this.parentNode) {
      return;
    }
    const siblings = this.parentNode.children;
    const index = siblings.indexOf(this);
    if (index >= 0) {
      siblings.splice(index, 1);
    }
    this.parentNode = null;
  }

  contains(node) {
    if (!node) {
      return false;
    }
    if (node === this) {
      return true;
    }
    return this.children.some(child => child.contains(node));
  }

  setAttribute(name, value) {
    const key = String(name || "");
    const nextValue = String(value || "");
    this.attributes[key] = nextValue;
    if (key === "id") {
      this.id = nextValue;
      return;
    }
    if (key === "class") {
      this.className = nextValue;
      return;
    }
    if (key.startsWith("data-")) {
      const dataKey = key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      this.dataset[dataKey] = nextValue;
    }
  }

  getAttribute(name) {
    return this.attributes[String(name || "")];
  }

  addEventListener(type, listener) {
    const current = this.listeners.get(type) || [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  dispatchEvent(event) {
    const nextEvent = event && typeof event === "object" ? event : {
      type: String(event || "")
    };
    nextEvent.target = nextEvent.target || this;
    nextEvent.currentTarget = this;
    nextEvent.preventDefault ||= function () {};
    nextEvent.stopPropagation ||= function () {};
    for (const listener of this.listeners.get(nextEvent.type) || []) {
      listener(nextEvent);
    }
  }

  click() {
    this.dispatchEvent({
      type: "click"
    });
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  insertAdjacentElement(position, element) {
    if (position !== "afterend" || !this.parentNode) {
      throw new Error(`unsupported insertAdjacentElement position: ${position}`);
    }
    if (element.parentNode) {
      element.remove();
    }
    const siblings = this.parentNode.children;
    const index = siblings.indexOf(this);
    element.parentNode = this.parentNode;
    siblings.splice(index + 1, 0, element);
    return element;
  }

  _matchesSelector(selector) {
    const normalized = String(selector || "").trim();
    if (!normalized) {
      return false;
    }
    if (normalized.includes(",")) {
      return normalized.split(",").some(part => this._matchesSelector(part));
    }
    const descendantParts = normalized.split(/\s+/).filter(Boolean);
    if (descendantParts.length > 1) {
      const ownSelector = descendantParts[descendantParts.length - 1];
      if (!this._matchesSelector(ownSelector)) {
        return false;
      }
      let currentAncestor = this.parentNode instanceof FakeElement ? this.parentNode : null;
      for (let index = descendantParts.length - 2; index >= 0; index -= 1) {
        const ancestorSelector = descendantParts[index];
        let matchedAncestor = null;
        while (currentAncestor) {
          if (currentAncestor._matchesSelector(ancestorSelector)) {
            matchedAncestor = currentAncestor;
            currentAncestor = currentAncestor.parentNode instanceof FakeElement ? currentAncestor.parentNode : null;
            break;
          }
          currentAncestor = currentAncestor.parentNode instanceof FakeElement ? currentAncestor.parentNode : null;
        }
        if (!matchedAncestor) {
          return false;
        }
      }
      return true;
    }
    if (normalized.startsWith("#")) {
      return this.id === normalized.slice(1);
    }
    const tagWithAttrMatch = normalized.match(/^([a-zA-Z0-9_-]+)?((?:\[[^\]]+\])+)$|^([a-zA-Z0-9_-]+)$/);
    if (tagWithAttrMatch) {
      const tagName = tagWithAttrMatch[1] || tagWithAttrMatch[3] || "";
      if (tagName && this.tagName !== tagName.toUpperCase()) {
        return false;
      }
      const attributeGroup = tagWithAttrMatch[2] || "";
      if (!attributeGroup) {
        return true;
      }
      const attributeSegments = attributeGroup.match(/\[[^\]]+\]/g) || [];
      return attributeSegments.every(segment => {
        const attrMatch = segment.match(/^\[([^=\]~*]+)([*]?=)?['"]?([^'"\]]*)['"]?\]$/);
        if (!attrMatch) {
          return false;
        }
        const attrName = String(attrMatch[1] || "").trim();
        const operator = attrMatch[2] || "";
        const expectedValue = attrMatch[3];
        if (!Object.prototype.hasOwnProperty.call(this.attributes, attrName)) {
          return false;
        }
        if (!operator) {
          return true;
        }
        const actualValue = String(this.attributes[attrName] || "");
        if (operator === "=") {
          return actualValue === expectedValue;
        }
        if (operator === "*=") {
          return actualValue.includes(expectedValue);
        }
        return false;
      });
    }
    return this.tagName === normalized.toUpperCase();
  }


  closest(selector) {
    let current = this;
    while (current) {
      if (current._matchesSelector(selector)) {
        return current;
      }
      current = current.parentNode instanceof FakeElement ? current.parentNode : null;
    }
    return null;
  }

  querySelector(selector) {
    const matches = this.querySelectorAll(selector);
    return matches[0] || null;
  }

  querySelectorAll(selector) {
    const output = [];
    for (const child of this.children) {
      if (child._matchesSelector(selector)) {
        output.push(child);
      }
      output.push(...child.querySelectorAll(selector));
    }
    return output;
  }
}

class FakeDocument {
  constructor(options = {}) {
    this.readyState = options.readyState || "complete";
    this.documentElement = {
      lang: options.lang || ""
    };
    this.head = new FakeElement("head", this);
    this.body = new FakeElement("body", this);
    this.body.parentNode = {
      isConnected: true
    };
    this.head.parentNode = {
      isConnected: true
    };
    this.listeners = new Map();
    this.activeElement = null;
  }

  createElement(tagName) {
    return new FakeElement(tagName, this);
  }

  addEventListener(type, listener) {
    const current = this.listeners.get(type) || [];
    current.push(listener);
    this.listeners.set(type, current);
  }

  dispatchEvent(event) {
    const nextEvent = event && typeof event === "object" ? event : {
      type: String(event || "")
    };
    nextEvent.target ||= this;
    nextEvent.currentTarget = this;
    nextEvent.preventDefault ||= function () {};
    nextEvent.stopPropagation ||= function () {};
    for (const listener of this.listeners.get(nextEvent.type) || []) {
      listener(nextEvent);
    }
  }

  getElementById(id) {
    const targetId = String(id || "");

    function walk(node) {
      if (!node) {
        return null;
      }
      if (node.id === targetId) {
        return node;
      }
      for (const child of node.children || []) {
        const match = walk(child);
        if (match) {
          return match;
        }
      }
      return null;
    }

    return walk(this.head) || walk(this.body);
  }

  querySelectorAll(selector) {
    return this.head.querySelectorAll(selector).concat(this.body.querySelectorAll(selector));
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.target = null;
    this.options = null;
  }

  observe(target, options) {
    this.target = target;
    this.options = options;
  }

  disconnect() {}

  takeRecords() {
    return [];
  }
}

function findElementByText(root, tagName, text) {
  const expectedTag = String(tagName || "").toUpperCase();
  const expectedText = String(text || "").trim();
  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current && current.tagName === expectedTag && String(current.textContent || "").trim() === expectedText) {
      return current;
    }
    for (const child of current?.children || []) {
      queue.push(child);
    }
  }
  return null;
}

module.exports = {
  FakeDocument,
  FakeElement,
  FakeMutationObserver,
  findElementByText
};
