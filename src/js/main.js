import "./state-bindings.js"
import { mergeChanges, state } from "./map.js";
import $ from "./lib/qsa";

var blocks = $(".scroll-block").reverse();
var currentBlock = null;

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

// side effects from form interactions
$.one("#filters").addEventListener("input", function(e) {
  switch (e.target.name) {
    case "district":
      // new district means removing the school
      state.data.selectedSchool = "";
    break;    
  }
});

import "./detail-block.js";