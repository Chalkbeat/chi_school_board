import "./state-bindings.js"
import { mergeChanges, state } from "./map.js";
import $ from "./lib/qsa";

var blocks = $(".scroll-block").reverse();
var currentBlock = null;
var filterBlock = $.one("#filters");
var snapshot = null;

// add the final filter block, which is just defaults
window.BLOCKS.filters = {
  schoolTheme: "type",
  interactive: true
};

function onScroll(e) {
  for (var b of blocks) {
    var bounds = b.getBoundingClientRect();
    if (bounds.top < window.innerHeight * .8) {
      if (b == currentBlock) return;
      if (currentBlock == filterBlock) {
        // we're leaving the filters, save their state
        snapshot = Object.fromEntries(Object.entries(state.raw));
      }

      currentBlock = b;
      var { id } = b;
      if (!id) return;
      var filterSetup = window.BLOCKS[id];
      if (b == filterBlock && snapshot) {
        filterSetup = snapshot;
      }
      if (!filterSetup) return;
      mergeChanges(filterSetup);
      break;
    }
  }
}
window.addEventListener("scroll", onScroll);
onScroll();

import "./detail-block.js";

var shareButton = $.one("button.share");
if ("share" in navigator) {
  shareButton.toggleAttribute("hidden", false);
  shareButton.addEventListener("click", () => {
    navigator.share({
      url: window.location.href,
      title: `Chalkbeat Chicago: ${document.title}`,
      text: `${document.title}: ${window.location.href}`
    });
  });
}