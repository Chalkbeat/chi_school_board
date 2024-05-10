import { state } from "./map.js";

import dot from "./lib/dot";
import templateHTML from "./_details.html"
var renderDetail = dot.compile(templateHTML);

class DetailBlock extends HTMLElement {
  constructor() {
    super();
    
  }

  connectedCallback() {
    state.addEventListener("update", this.onStateUpdate.bind(this));
    this.onUpdateState({ detail: state.raw });
  }

  disconnectedCallback() {
    state.removeEventListener("update", this.onStateUpdate.bind(this));
  }

  onStateUpdate(e) {
    this.innerHTML = renderDetail(e.detail);
  }
}

customElements.define("detail-block", DetailBlock);