/*
Behavioral components that update a linked state when their contents change
*/

import { state } from "./state.js";

class StatefulInput extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("input", this);
    state.events.addEventListener("update", this.update.bind(this));
    this.update({ detail: state.raw });
  }

  handleEvent(e) {
    var key = this.getAttribute("key");
    state.data[key] = "valueAsNumber" in e.target ? e.target.valueAsNumber : e.target.value;
  }

  update({ detail }) {
    var input = this.querySelector("input, select");
    var key = this.getAttribute("key");
    input.value = detail[key];
  }
}

customElements.define("stateful-input", StatefulInput);

class StatefulCheck extends StatefulInput {
  handleEvent(e) {
    var key = this.getAttribute("key");
    state.data[key] = e.target.checked;
  }

  update({ detail }) {
    var key = this.getAttribute("key");
    var value = detail[key];
    var input = this.querySelector("input");
    input.checked = !!value;
  }
}

customElements.define("stateful-check", StatefulCheck);

class StatefulRadio extends StatefulInput {
  handleEvent(e) {
    var key = this.getAttribute("key");
    var { name, value } = e.target;
    state.data[key || name] = value;
  }

  update({ detail }) {
    var key = this.getAttribute("key");
    if (!(key in detail)) return;
    var value = detail[key];
    var input = this.querySelector(`input[value="${detail[key]}"]`);
    if (input) input.checked = true;
  }
}

customElements.define("stateful-radio", StatefulRadio);