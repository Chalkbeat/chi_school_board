import "./state-bindings.js"
import { mergeChanges, state } from "./map.js";
import $ from "./lib/qsa";

var blocks = $(".scroll-block").reverse();
var currentBlock = null;

// add the final filter block, which is just defaults
window.BLOCKS.filters = { schoolTheme: "type" };

function onScroll(e) {
  for (var b of blocks) {
    var bounds = b.getBoundingClientRect();
    if (bounds.top < window.innerHeight * .8) {
      if (b == currentBlock) return;
      currentBlock = b;
      var { id } = b;
      if (!id) return;
      var filterSetup = window.BLOCKS[id];
      if (!filterSetup) return;
      mergeChanges(filterSetup);
      document.body.dataset.schoolMode = filterSetup.schoolTheme;
      break;
    }
  }
}
window.addEventListener("scroll", onScroll);
onScroll();

import dot from "./lib/dot";
import templateHTML from "./_details.html"
var renderDetail = dot.compile(templateHTML);

var fi = (condition, outcome) => condition
  ? outcome instanceof Function
    ? outcome() : outcome
  : "";

// TODO: this should probably be a component with a better approach to templating
var detailContainer = $.one(".school-detail");
state.addEventListener("update", function({ detail: data }) {
  detailContainer.innerHTML = renderDetail(data);
});
