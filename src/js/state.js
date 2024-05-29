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
  proxies = new WeakMap();

  constructor(initial = {}) {
    super();
    for (var f of "notify schedule".split(" ")) {
      this[f] = this[f].bind(this);
    }
    var { schedule, proxies } = this;
    var handler = {
      get(target, property, receiver) {
        var value = Reflect.get(target, property, receiver);
        switch (typeof value) {
          case "object":
            var proxy = proxies.get(value);
            if (!proxy) {
              proxy = new Proxy(value, handler);
              proxies.set(value, proxy);
            }
            return proxy;

          // trap method calls and observe them
          // would be cool to use handler.apply() but
          // it snags on Set methods
          case "function":
            return (...args) => {
              target[property](...args);
              schedule();
            };

          default:
            return value;
        }
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
  }
}