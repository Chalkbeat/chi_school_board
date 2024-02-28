import { Map, Marker, GeoJSON, DivIcon, LatLngBounds, TileLayer } from "leaflet/dist/leaflet-src.esm.js";
import $ from "./lib/qsa.js";
import { ReactiveStore } from "./state.js";
import { markerFilters, districtFilters } from "./filters.js";
import debounce from "./lib/debounce.js";

// default map setup values
// we use these to provide a starting point
// but also to merge over in the scrolling blocks
const STATE_DEFAULT = {
  ES: true,
  MS: true,
  HS: true,
  district: ""
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
media.addEventListener("change", onMediaQuery);
window.addEventListener("resize", debounce(onMediaQuery));
onMediaQuery();

// map setup
var mapContainer = $.one(".backdrop .map");
export var map = new Map(mapContainer, {
  zoomSnap: .1,
  scrollWheelZoom: false,
  maxBounds: [[42.188,-88.795], [41.182,-86.627]],
  maxBoundsViscosity: 1
});
// https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg
var tiles = new TileLayer("./assets/synced/tiles/carto_light_nolabels/{z}/{x}/{y}.png", {
  minZoom: 9,
  maxZoom: 13,
  updateWhenZooming: false,
  updateWhenIdle: true,
  attribution: "Map tiles by Carto, under CC BY 3.0. Data by OpenStreetMap, under ODbL."
}).addTo(map);
window.map = map;
window.tiles = tiles;

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

map.on("click", e => state.data.district = state.data.selectedSchool = "");

var bounds = new LatLngBounds();
// add map markers and link the data together
var schoolLookup = {};
for (let school of window.SCHOOLS) {
  schoolLookup[school.id] = school;
  school.districts = new Set();
  bounds.extend([school.lat, school.long])
  var marker = new Marker([school.lat, school.long], {
    icon: new DivIcon({
      iconSize: [8, 8],
      className: ["school-marker", school.category, school.secondary].join(" ")
    })
  });
  marker.addTo(map);
  // TODO: replace this with a detail panel
  marker.bindPopup(school.name);
  marker.on("click", e => state.data.selectedSchool = school);
  marker.data = school;
  school.marker = marker;
}
map.fitBounds(bounds);

// lazy-load the GeoJSON for the districts and connect it to the map
fetch("./assets/sb3757-intersected.geojson").then(async response => {
  var data = await response.json();
  var layer = new GeoJSON(data);
  layer.addTo(map);
  layer.eachLayer(l => {
    for (var id of l.feature.properties.schools.split(", ")) {
      if (id in schoolLookup) {
        schoolLookup[id].districts.add(l.feature.properties.district);
      }
    }
    // TODO: replace this with a panel update
    l.on("click", e => state.data.district = l.feature.properties.district);
    l.bindPopup("District " + l.feature.properties.district);
  });
  // by adding it to the state data, we trigger a re-render
  state.data.seatLayer = layer;
});

// called whenever the reactive state data changes
function updateMap(data) {
  var bounds = new LatLngBounds();

  // paint and filter
  if (data.seatLayer) {
    data.seatLayer.eachLayer(function(layer) {
      var { name } = layer.feature.properties;
      var survives = districtFilters.every(f => f(layer.feature, data));
      // TODO: get base styles from the custom paint function
      layer.setStyle({
        color: "var(--seatColor)",
        // set class on first render
        className: survives ? "" : "hidden"
      });
      // update after first render
      if (layer._path) layer._path.classList.toggle("hidden", !survives);
      if (survives) {
        bounds.extend(layer.getBounds());
      }
    })
  }

  // update markers
  var schools = window.SCHOOLS.slice();
  for (var f of markerFilters) {
    schools = schools.filter(s => f(s, data));
  }
  var survived = new Set(schools);
  for (var school of window.SCHOOLS) {
    if (survived.has(school)) {
      school.marker.addTo(map);
      bounds.extend(school.marker.getLatLng())
    } else {
      school.marker.remove();
    }
  }

  // TODO: bounds should position the map based on the scrolling section placement
  map.flyToBounds(bounds, data.padding);
}

export function mergeChanges(patch) {
  Object.assign(state.data, STATE_DEFAULT, patch);
}

state.addEventListener("update", e => updateMap(e.detail));