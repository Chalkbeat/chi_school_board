/*

ReactiveStore is a basic observable data object. Making shallow changes to
the .data property will cause the object to queue an "update" event. You can
bypass the proxy by talking to .raw, but you'll need to call schedule
() afterward. 

If the state object's .hashMemory property is set to true, it will also mirror
the URL hash. These updates are live and two-way.

*/

export class ReactiveStore extends EventTarget {
  scheduled = false;
  #hashMemory = false;
  proxies = new WeakMap();

  constructor(initial = {}) {
    super();
    for (var f of "notify schedule onHashChange".split(" ")) {
      this[f] = this[f].bind(this);
    }
    var { schedule, proxies } = this;
    var handler = {
      get(target, property, receiver) {
        var value = Reflect.get(target, property, receiver);
        if (value instanceof Object) {
          if (value instanceof Function) {
            return (...args) => {
              target[property](...args);
              schedule();
            }
          }
          var proxy = proxies.get(value);
          if (!proxy) {
            proxy = new Proxy(value, handler);
            proxies.set(value, proxy);
          }
          return proxy;
        }
        return value;
      },
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
    this.dispatchEvent(new CustomEvent("update", { detail: this.raw }));
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