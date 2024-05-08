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

var fi = (condition, outcome) => condition
  ? outcome instanceof Function
    ? outcome() : outcome
  : "";

// TODO: this should probably be a component with a better approach to templating
var detailContainer = $.one(".school-detail");
state.addEventListener("update", function({ detail: data }) {
  if (data.selectedSchool) {
    var school = data.selectedSchool;
    detailContainer.innerHTML = `
<hr>
Selected School: ${school.name}
<ul>
  <li> Category: ${({ ES: "Elementary", MS: "Middle", HS: "High" })[school.category]} school
  <li> Type: ${school.secondary}
  <li> Associated district: ${String(school.home_district || "none").replace(/,/g, ", ")}
  ${fi(school.enrollment, () => `
  <li> Enrollment: ${school.enrollment.absolute.total}
  `)}
</ul>
    `
  } else if (data.district) {
    var demos = {
      black: "Black",
      white: "white",
      hispanic: "Hispanic or Latino",
      none: "No majority"
    }
    detailContainer.innerHTML = `
<hr>
Selected district: ${data.district}
<ul>
${fi(data.demographics, () => `
  <li> Majority racial demographic: ${demos[data.demographics[data.district].majority]}
`)}
</ul>
`
  } else {
    detailContainer.innerHTML = "";
  }
});
