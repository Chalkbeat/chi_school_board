import "./state-bindings.js"
import { mergeChanges, state } from "./map.js";
import $ from "./lib/qsa";

/* TEST BUTTON */
document.querySelector(".demo-button").addEventListener("click", () => mergeChanges({
  district: 1,
  ES: false
}));

var blocks = $(".scroll-block").reverse();
var currentBlock = null;

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

// TODO: this should probably be a component with a better approach to templating
var schoolDetailContainer = $.one(".school-detail");
state.addEventListener("update", function({ detail: data }) {
  if (data.selectedSchool) {
    var school = data.selectedSchool;
    schoolDetailContainer.innerHTML = `
<hr>
Selected School: ${school.name}
<ul>
  <li> Category: ${({ ES: "Elementary", MS: "Middle", HS: "High" })[school.category]} school
  <li> Type: ${school.secondary}
  <li> Associated districts: ${String(school.district || "none").replace(/,/g, ", ")}
</ul>
    `
  } else {
    schoolDetailContainer.innerHTML = "";
  }
});
