import { state } from "./map.js";

import dot from "./lib/dot";
import templateHTML from "./_details.html"
var renderDetail = dot.compile(templateHTML);

class DetailBlock extends HTMLElement {
  constructor() {
    super();
    this.onStateUpdate = this.onStateUpdate.bind(this);
    this.visible = false;
    var observer = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.onStateUpdate({ detail: state.raw });
    }, {
      rootMargin: "30%"
    });
    observer.observe(this);
  }

  connectedCallback() {
    state.addEventListener("update", this.onStateUpdate);
    this.onStateUpdate({ detail: state.raw });
  }

  disconnectedCallback() {
    state.removeEventListener("update", this.onStateUpdate);
  }

  onStateUpdate(e) {
    if (!this.visible) return;
    this.innerHTML = renderDetail(e.detail);
  }
}

customElements.define("detail-block", DetailBlock);