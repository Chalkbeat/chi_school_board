/*
Bakes out JSON files from various sources (mostly sheets) so they can be loaded async.
*/

module.exports = function(grunt) {

  var fs = require("node:fs");

  grunt.registerTask("bake", "Generate JSON files with school data for async load", function() {
    grunt.task.requires("json");

    var { profiles, enrollment } = grunt.data.json;
    for (var row of profiles) {
      row.district = row.district ? row.district.split(",").map(Number) : [];
    }

    // trim and pre-compute enrollment data
    var enrollLookup = {};
    for (var row of enrollment) {
      var item = enrollLookup[row.id] ??= { trends: [] };
      item.trends.push({ total: row.total, year: row.year });
      if (row.year == 2023) {
        item.absolute = {
          total: Number(row.total),
          white: Number(row.white),
          black: Number(row.black),
          asian: Number(row.asian),
          hispanic: Number(row.hispanic),
          multi: Number(row.multi),
        };
        item.percents = {
          white: row.white / row.total,
          black: row.black / row.total,
          asian: row.asian / row.total,
          hispanic: row.hispanic / row.total,
          multi: row.multi / row.total
        }
      }
    }

    grunt.file.write("build/profiles.json", JSON.stringify(profiles));
    grunt.file.write("build/enrollment.json", JSON.stringify(enrollLookup, null, 2));
  });

}