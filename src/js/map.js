import { Map, Marker, GeoJSON, DivIcon, LatLngBounds, TileLayer } from "leaflet/dist/leaflet-src.esm.js";
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
var mapContainer = $.one(".backdrop .map");
var maxBounds = [[42.188,-88.795], [41.182,-86.627]]
export var map = new Map(mapContainer, {
  maxBounds,
  zoomSnap: .1,
  scrollWheelZoom: false,
  maxBoundsViscosity: 1
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

// default map setup values
// we use these to provide a starting point
// but also to merge over in the scrolling blocks
const STATE_DEFAULT = {
  district: "",
  theme: "allGray",
  schoolTheme: false,
  districtLayer: 10,
  ES: true,
  MS: true,
  HS: true
};
export var state = new ReactiveStore({ ...STATE_DEFAULT });
window.mapState = state;

// padding query
var media = window.matchMedia("(max-width: 600px)");
function onMediaQuery() {
  if (media.matches) {
    state.raw.padding = { padding: [50, 50] };
  } else {
    state.raw.padding = {
      paddingTopLeft: [window.innerWidth / 2, 100],
      paddingBottomRight: [100, 100]
    };
  }
}
onMediaQuery();
media.addEventListener("change", onMediaQuery);

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
    // TODO: replace this with a detail panel
    marker.bindPopup(school.name);
    marker.on("click", e => state.data.selectedSchool = school);
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
  var layer = new GeoJSON(ten);
  layer.addData(twenty);
  layer.addTo(map);

  layer.eachLayer(l => {
    var key = l.feature.properties.sub || l.feature.properties.district;
    l.on("click", e => {
      state.data.district = key;
      state.data.selectedSchool = "";
    });
    l.bindPopup("District " + key);
  });
  
  // by adding it to the state data, we trigger a re-render
  state.data.seatLayer = layer;
  ok(layer);
});

// district demos aren't connected to any other data
fetchJSON("./demographics.json").then(d => state.data.demographics = d);

// called whenever the reactive state data changes
function updateMap(data) {
  var bounds;

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

  if (bounds) map.flyToBounds(bounds, data.padding);
}

export function mergeChanges(patch) {
  Object.assign(state.data, STATE_DEFAULT, patch);
}

state.addEventListener("update", e => updateMap(e.detail));
map.on("click", e => state.data.district = state.data.selectedSchool = "");

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