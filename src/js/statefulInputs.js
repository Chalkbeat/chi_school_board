/*
Behavioral components that update a linked state when their contents change
*/

import { state } from "./map.js";

class StatefulInput extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("input", this);
    state.events.addEventListener("update", this.update.bind(this));
    this.update({ detail: state.raw });
  }

  handleEvent(e) {
    var key = this.dataset.key;
    state.data[key] = "valueAsNumber" in e.target ? e.target.valueAsNumber : e.target.value;
  }

  update({ detail }) {
    var input = this.querySelector("input, select");
    var key = this.dataset.key;
    input.value = detail[key];
  }
}

customElements.define("stateful-input", StatefulInput);

class StatefulCheck extends StatefulInput {
  handleEvent(e) {
    var key = e.target.dataset.key || this.dataset.key;
    state.data[key] = e.target.checked;
  }

  update({ detail }) {
    var key = this.dataset.key;
    var value = detail[key];
    var input = this.querySelector("input");
    input.checked = !!value;
  }
}

customElements.define("stateful-check", StatefulCheck);

class StatefulSet extends StatefulInput {
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

customElements.define("stateful-set", StatefulSet);

class StatefulRadio extends StatefulInput {
  handleEvent(e) {
    var key = this.dataset.key;
    var { name, value } = e.target;
    state.data[key || name] = value;
  }

  update({ detail }) {
    var key = this.dataset.key;
    if (!(key in detail)) return;
    var value = detail[key];
    var input = this.querySelector(`input[value="${detail[key]}"]`);
    if (input) input.checked = true;
  }
}

customElements.define("stateful-radio", StatefulRadio);