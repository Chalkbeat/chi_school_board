class ReactiveState {
  events = new EventTarget();
  scheduled = false;
  #hashMemory = false;

  constructor(initial = {}) {
    for (var f of "notify schedule onHashChange".split(" ")) {
      this[f] = this[f].bind(this);
    }
    var { schedule } = this;
    var handler = {
      set(target, property, value) {
        var was = target[property];
        if (value !== was) {
          target[property] = value;
          schedule();
        }
        return true;
      }
    }
    this.raw = initial;
    this.data = new Proxy(this.raw, handler);
    window.addEventListener("hashchange", this.onHashChange);
  }

  schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(this.notify);
  }

  notify() {
    this.scheduled = false;
    // send event
    var detail = structuredClone(this.raw);
    this.events.dispatchEvent(new CustomEvent("update", { detail }));
    // if hashing is turned on, serialize state
    if (this.#hashMemory) {
      window.location.hash = this.serialize();
    }
  }

  serialize() {
    var params = new URLSearchParams();
    for (var k in this.raw) {
      var value = this.raw[k];
      if (value instanceof Array) {
        value = JSON.stringify(value);
      }
      params.set(k, value);
    }
    return params.toString();
  }

  parse() {
    var hash = window.location.hash.slice(1);
    var result = {};
    var params = new URLSearchParams(hash);
    for (var [k, v] of params) {
      if (v[0] == "[") {
        v = JSON.parse(v);
      }
      if (v == "true" || v == "false") {
        v = v == "true";
      }
      result[k] = v;
    }
    return result;
  }

  onHashChange() {
    // if hashing is not on, skip this
    if (!this.#hashMemory) return;
    Object.assign(this.data, this.parse());
  }

  get hashMemory() {
    return this.#hashMemory;
  }

  set hashMemory(enabled) {
    this.#hashMemory = enabled;
    if (this.#hashMemory) {
      this.onHashChange();
    } else {
      // clear the hash, maybe?
      window.location.hash = "";
    }
  }
}

export var state = new ReactiveState();