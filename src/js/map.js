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
  scrollWheelZoom: false
});
new TileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Esri"
}).addTo(map);

var bounds = new LatLngBounds();
// add map markers and link the data together
var schoolLookup = {};
for (var school of window.SCHOOLS) {
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
    for (var id of l.feature.properties.schools.split(", ").map(Number)) {
      if (id in schoolLookup) {
        schoolLookup[id].districts.add(l.feature.properties.district);
      }
    }
    // TODO: replace this with a panel update
    l.bindPopup("District " + l.feature.properties.district);
  });
  // by adding it to the state data, we trigger a re-render
  state.data.seatLayer = layer;
  console.log(schoolLookup);
});

// called whenever the reactive state data changes
function updateMap(data) {
  console.log(data);
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