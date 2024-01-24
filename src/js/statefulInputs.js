/*
Behavioral components that update a linked state when their contents change
*/

import { state } from "./map.js";

class StateBinding extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("input", this);
    state.events.addEventListener("update", this.update.bind(this));
    this.update({ detail: state.raw });
  }

  handleEvent({ target }) {
    var type = target.tagName != "INPUT" ? target.tagName.toLowerCase() : target.type;
    switch (type) {
      case "radio":
        var { name, value } = target;
        state.data[name] = value;
      break;

      case "checkbox":
        var key = target.name || target.value;
        var value = target.checked;
        state.data[key] = value;
      break;

      default:
        var key = target.name;
        var value = "valueAsNumber" in target ? target.valueAsNumber : target.value;
        state.data[key] = value;
    }
  }

  update({ detail }) {
    var inputs = this.querySelectorAll("input, select");
    for (var input of inputs) {
      if (input.type == "checkbox" || input.type == "radio") {
        var key = input.name || input.value;
        input.checked = detail[key];
      } else {
        input.value = detail[input.name];
      }
    }
  }
}

customElements.define("state-binding", StateBinding);

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