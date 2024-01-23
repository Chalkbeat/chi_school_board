import { ReactiveState } from "./state.js";
import markerFilters from "./markerFilters.js";

export var state = new ReactiveState({
  grades: new Set(["ES", "MS", "HS"]),
  seatFilter: new Set()
});

window.state = state;

import leaflet from "leaflet";
import $ from "./lib/qsa.js";

var mapContainer = $.one(".backdrop .map");
export var map = new leaflet.Map(mapContainer, {
  zoomSnap: .1,
  scrollWheelZoom: false
});
new leaflet.TileLayer("https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  attribution: "Esri"
}).addTo(map);

fetch("./assets/intersected_simpler.geojson").then(async response => {
  var data = await response.json();
  var layer = new leaflet.GeoJSON(data);
  layer.addTo(map);
  layer.eachLayer(l => {
    state.data.seatFilter.add(l.feature.properties.name);
    l.bindPopup(l.feature.properties.name);
  });
  state.data.seatLayer = layer;
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

function updateMap(data) {
  var bounds = new leaflet.LatLngBounds([[41.9, -87.74], [41.9, -87.74]]);

  // paint and filter
  if (data.seatLayer) {
    data.seatLayer.eachLayer(function(layer) {
      var { name } = layer.feature.properties;
      var survives = data.seatFilter.has(name);
      if (layer._path) layer._path.toggleAttribute("hidden", !survives);
      layer.setStyle({
        color: "var(--seatColor)"
      });
      if (survives) {
        bounds.extend(layer.getBounds());
      }
    })
  }

  // update markers
  var schools = window.DATA.slice();
  for (var f of markerFilters) {
    schools = schools.filter(s => f(s, data));
  }
  var survived = new Set(schools);
  for (var school of window.DATA) {
    if (survived.has(school)) {
      school.marker.addTo(map);
      bounds.extend(school.marker.getLatLng())
    } else {
      school.marker.remove();
    }
  }

  // TODO: bounds should position the map based on the scrolling section placement
  map.fitBounds(bounds, { padding: [100, 100] });
}

state.events.addEventListener("update", e => updateMap(e.detail));