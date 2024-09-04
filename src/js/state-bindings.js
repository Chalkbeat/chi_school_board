/*
Behavioral components that update a linked state when their contents change
*/

import { state } from "./map.js";

/*
<state-binding>

This is a basic behavioral component that links select/input to a key in the
the map state. It's a two-way binding, so when the state changes, the
component will match as well. Checkboxes are booleans, radio buttons get the
selected value, and numeric inputs will use valueAsNumber.

All bound input elements should have a name for this to work, just as if they
were participating in a form.

*/

class StateBinding extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("input", this);
    state.addEventListener("update", this.update.bind(this));
    this.update({ detail: state.raw });
  }

  handleEvent({ target }) {
    var type = target.tagName != "INPUT" ? target.tagName.toLowerCase() : target.type;
    switch (type) {
      case "radio":
        var key = target.name;
        var value = target.value;
        state.data[key] = value;
      break;
      
      case "checkbox":
        var key = target.name || target.value;
        var value = target.checked;
        state.data[key] = value;
      break;

      default:
        var { name, value } = target;
        if ("valueAsNumber" in target && typeof target.valueAsNumber == "number") {
          value = target.valueAsNumber;
        }
        state.data[name] = value;
    }
  }

  update({ detail }) {
    var inputs = this.querySelectorAll("input, select");
    for (var input of inputs) {
      if (input.type == "checkbox") {
        var key = input.name || input.value;
        input.checked = detail[key];
      } else if (input.type == "radio") {
        var key = input.name;
        input.checked = detail[key] == input.value;
      } else {
        input.value = detail[input.name];
      }
    }
  }
}

customElements.define("state-binding", StateBinding);

/*

<state-binding-set> 

Provides a special-case for collections of checkboxes, and adds them to a Set
instead of linking each of them to an individual key. This is useful for
multi-select scenarios, assuming we don't want to use <select multiple>.

*/

class StateBindingSet extends StateBinding {
  handleEvent(e) {
    var key = this.dataset.key;
    var existing = state.data[key];
    var value = e.target.value;
    var mode = e.target.checked ? "add" : "delete";
    if (!existing) {
      state.data[key] = new Set([value]);
    } else {
      state.data[key][mode](value);
      state.schedule();
    }
    e.stopPropagation();
  }

  update({ detail }) {
    var key = this.dataset.key;
    var value = state.data[key];
    if (!value) return;
    var inputs = this.querySelectorAll("input");
    for (var input of inputs) {
      input.checked = value.has(input.value);
    }
  }
}

customElements.define("state-binding-set", StateBindingSet);