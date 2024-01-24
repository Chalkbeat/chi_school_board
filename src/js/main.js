import "./state-bindings.js"
import { mergeChanges } from "./map.js";
import $ from "./lib/qsa";

/* TEST BUTTON */
document.querySelector(".demo-button").addEventListener("click", () => mergeChanges({
  district: "District F",
  ES: false
}));

var blocks = $(".scroll-block").reverse();
var currentBlock = null;

const FILTER_SCHEMA = {
  ES: Boolean,
  MS: Boolean,
  HS: Boolean
};

// add the final filter block, which is just defaults
window.BLOCKS.filters = {};

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
      break;
    }
  }
}

window.addEventListener("scroll", onScroll);