import { Map, Marker, GeoJSON, DivIcon, LatLngBounds, TileLayer } from "leaflet/dist/leaflet-src.esm.js";
import Wherewolf from "wherewolf";
import $ from "./lib/qsa.js";
import { ReactiveStore } from "./state.js";
import { markerFilters, districtFilters, districtThemes } from "./filters.js";


// utility function for async dependencies
async function after(...args) {
  var callback = args.pop();
  return Promise.all(args).then((result) => callback(...result));
}

function fetchJSON(url) {
  return fetch(url).then(r => r.json());
}

// map setup
var filterDetails = $.one("#filters detail-block");
var mapContainer = $.one(".backdrop .map");
var maxBounds = [[42.188,-88.795], [41.182,-86.627]]
export var map = new Map(mapContainer, {
  maxBounds,
  zoomSnap: .1,
  zoomControl: false,
  scrollWheelZoom: false,
  maxBoundsViscosity: 1,
  dragging: false
});
map.fitBounds(maxBounds);

var tiles = new TileLayer("./assets/synced/tiles/carto_light_nolabels/{z}/{x}/{y}.png", {
  minZoom: 9,
  maxZoom: 13,
  updateWhenZooming: false,
  updateWhenIdle: true,
  attribution: "Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL."
}).addTo(map);
window.map = map;

// padding query
var media = window.matchMedia("(max-width: 600px)");

// default map setup values
// we use these to provide a starting point
// but also to merge over in the scrolling blocks
const STATE_DEFAULT = {
  _district: "",
  school: "",
  theme: "allGray",
  schoolTheme: false,
  districtLayer: 10,
  type: "all",
  ES: true,
  MS: true,
  HS: true,
  interactive: false
};

export var state = new ReactiveStore({
  ...STATE_DEFAULT,
  // these getters/setters implement multi-property relationships
  // setting the school ID also sets the selectedSchool
  set school(id) {
    var school = this.schools?.find(s => s.id == id);
    this.district = school?.home_district || "";
    this.selectedSchool = school || false;
  },
  get school() {
    return this.selectedSchool?.id || "";
  },
  // setting the district resets the school filter
  set district(number) {
    if (number != this._district) {
      this._district = number;
      this.selectedSchool = false;
    }
  },
  get district() {
    return this._district;
  },
  get padding() {
    if (media.matches) {
      return { padding: [50, 50] };
    } else {
      return {
        paddingTopLeft: [window.innerWidth / 2, 100],
        paddingBottomRight: [100, 100]
      };
    }
  }
});
window.mapState = state;

// add map markers and link the data together
var loadedProfiles = new Promise(async (ok, fail) => {
  var schools = await fetchJSON("./profiles.json");
  state.data.schools = schools;
  for (let school of schools) {
    school.districts = new Set(school.district);
    var marker = new Marker([school.lat, school.long], {
      icon: new DivIcon({
        iconSize: [8, 8],
        className: ["school-marker", school.category, school.secondary, school.designation].join(" ")
      })
    });
    marker.addTo(map);
    marker.on("click", e => {
      if (!state.raw.interactive) return;
      state.data.school = school.id;
      filterDetails.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    marker.bindPopup(school.short);
    marker.data = school;
    school.marker = marker;
  }
  ok(schools);
});

// load enrollment data
var loadedEnrollment = fetchJSON("./enrollment.json");

// connect enrollment to schools
after(loadedProfiles, loadedEnrollment, (schools, enrollment) => {
  for (var school of schools) {
    school.enrollment = enrollment[school.id]
  }
});

// lazy-load the GeoJSON for the districts and combine 10/20 district layers
after(
  fetchJSON("./assets/districts-10.geojson"),
  fetchJSON("./assets/districts-20.geojson"),
  (ten, twenty) => {
  var wolf = new Wherewolf();
  console.log(ten);
  wolf.add("2024", ten);
  wolf.add("2026", twenty);
  state.raw.wolf = wolf;

  var layer = new GeoJSON(ten);
  layer.addData(twenty);
  layer.addTo(map);
  layer.addEventParent(map);

  layer.eachLayer(l => {
    var key = l.feature.properties.sub || l.feature.properties.district;
    l.on("click", e => {
      if (!state.raw.interactive) return;
      state.data.district = key;
      state.data.selectedSchool = "";
      filterDetails.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
  
  // by adding it to the state data, we trigger a re-render
  state.data.seatLayer = layer;
});

// district demos aren't connected to any other data
fetchJSON("./demographics.json").then(d => state.data.demographics = d);

var lastBounds = null;

// called whenever the reactive state data changes
function updateMap(data) {
  var bounds;

  // disable click interactions for intro blocks
  mapContainer.dataset.interactive = data.interactive;
  // set the marker theme
  document.body.dataset.schoolMode = data.schoolTheme;

  // paint and filter
  if (data.seatLayer) {
    var paint = districtThemes[data.theme] || districtThemes.highlighter;
    data.seatLayer.eachLayer(function(layer) {
      var { name } = layer.feature.properties;
      var survives = districtFilters.every(f => f(layer.feature, data));
      layer.setStyle({
        className: survives ? "" : "hidden",
        ...paint(layer.feature.properties, data)
      });
      // update after first render
      if (layer._path) layer._path.classList.toggle("hidden", !survives);
      if (survives) {
        if (!bounds) bounds = new LatLngBounds();
        bounds.extend(layer.getBounds());
      }
    })
  }

  if (data.schools) {
    // update markers
    var filtered = data.schools.slice();
    for (var f of markerFilters) {
      filtered = filtered.filter(s => f(s, data));
    }
    var survived = new Set(filtered);
    for (var school of data.schools) {
      if (survived.has(school)) {
        school.marker.addTo(map);
        if (!bounds) bounds = new LatLngBounds();
        bounds.extend(school.marker.getLatLng())
      } else {
        school.marker.remove();
      }
    }
  }

  if (data.selectedSchool) {
    data.selectedSchool.marker.openPopup();
  }

  if (bounds && (!bounds.equals(lastBounds))) map.flyToBounds(bounds, data.padding);
  lastBounds = bounds;
}

export function mergeChanges(patch) {
  Object.assign(state.data, STATE_DEFAULT, patch);
}

state.addEventListener("update", e => updateMap(e.detail));
var ignoreNext = false;
map.on("click", e => {
  if (!state.raw.interactive) return;
  if (ignoreNext) return ignoreNext = false;
  if (e.propagatedFrom) return ignoreNext = true;
  state.data.district = state.data.selectedSchool = "";
});

// // Generates a list of tiles to download for local caching
// var tileBounds = [[42.488,-88.795], [41.182,-86.627]];
// var zooms = [8, 9, 10, 11, 12, 13];
// var out = [];
// var tileRanges = zooms.map(function(z) {
//   var [nw, se] = tileBounds.map(p => map.project(p, z));
//   var pnw = [nw.x / 256, nw.y / 256].map(n => Math.floor(n));
//   var pse = [se.x / 256, se.y / 256].map(n => Math.ceil(n));
//   out.push({
//     z,
//     startX: pnw[0],
//     // endX: pse[0],
//     startY: pnw[1],
//     // endY: pse[1],
//     xRange: pse[0] - pnw[0],
//     yRange: pse[1] - pnw[1]
//   })
// });
// console.table(out);