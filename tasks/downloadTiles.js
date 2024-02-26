module.exports = function(grunt) {
  var tileConfig = require("../data/tile_downloads.sheet.json");
  var fs = require("node:fs/promises");
  var path = require("node:path");

  var tileSets = {
    carto_light_nolabels: "https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
    // stamen_watercolor: "https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg" 
  }

  async function task() {
    for (var row of tileConfig) {
      for (var i = 0; i <= row.xCount; i++) {
        for (var j = 0; j <= row.yCount; j++) {
          var x = row.x + i;
          var y = row.y + j;
          var z = row.zoom;
          var coords = { x, y, z };
          for (var layer in tileSets) {
            var url = tileSets[layer].replace(/\{(\w)\}/g, (_, c) => coords[c]);
            var local = `src/assets/synced/tiles/${layer}/${z}/${x}/${y}.${url.slice(-3)}`;
            console.log(`Downloading tile ${layer} - ${z}/${x}/${y}`);
            await fs.mkdir(path.dirname(local), { recursive: true });
            var response = await fetch(url);
            var buffer = Buffer.from(await response.arrayBuffer());
            await fs.writeFile(local, buffer);
          }
        }
      }
    }
  }

  grunt.registerTask("tiles", "Download tiles from provider as a local cache", function() {
    var done = this.async()
    task().then(done);
  });
}