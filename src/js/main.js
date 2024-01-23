import leaflet from "leaflet";
import $ from "./lib/qsa.js";
import "./statefulInputs.js"

var mapContainer = $.one(".backdrop .map");
var map = new leaflet.Map(mapContainer, {
  zoomSnap: .1,
  scrollWheelZoom: false
});
new leaflet.TileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Esri"
}).addTo(map);

fetch("./assets/intersected_simpler.geojson").then(async response => {
  var data = await response.json();
  var schoolData = new leaflet.GeoJSON(data);
  schoolData.addTo(map);
  var bounds = schoolData.getBounds();
  // TODO: bounds should position the map based on the scrolling section placement
  map.fitBounds(bounds, { padding: [100, 100] });
});

for (var school of window.DATA) {
  var marker = new leaflet.Marker([school.lat, school.long], {
    icon: new leaflet.DivIcon({
      iconSize: [8, 8],
      className: ["school-marker", school.category, school.secondary].join(" ")
    })
  });
  marker.addTo(map);
  marker.bindPopup(school.name);
  marker.data = school;
  school.marker = marker;
}

/*
- SoT is the hash, but we don't look at that outside of the last section
- Three troll arrays for filtering/painting:
  - district filter
  - district paint
  - school filter
- state object accepts changes (maybe a proxy) and dispatches a debounced update event
- create custom elements that can automatically dispatch to the state based on their contents?
  - stateful-checkbox
  - stateful-radio
  - stateful-select
*/

import { state } from "./state";
Object.assign(state.data, {
  grades: new Set(["ES", "MS", "HS"])
});

window.state = state;
state.events.addEventListener("update", function({ detail }) {
  for (var school of window.DATA) {
    if (detail.grades.has(school.category)) {
      school.marker.addTo(map)
    } else {
      school.marker.remove();
    }
  }
});