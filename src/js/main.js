var leaflet = require("leaflet");
var $ = require("./lib/qsa");

var mapContainer = $.one(".backdrop .map");
var map = new leaflet.Map(mapContainer, {
  zoomSnap: .1
});
new leaflet.TileLayer("https://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  subdomains: ["services"],
  attribution: "<a href=\"https://static.arcgis.com/attribution/World_Topo_Map\">Esri</a>"
}).addTo(map);

fetch("./assets/intersected_simpler.geojson").then(async response => {
  var data = await response.json();
  var schoolData = new leaflet.GeoJSON(data);
  schoolData.addTo(map);
  var bounds = schoolData.getBounds();
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
}
