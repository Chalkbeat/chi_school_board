/*
Bakes out JSON files from various sources (mostly sheets) so they can be loaded async.
*/

module.exports = function(grunt) {

  var fs = require("node:fs");

  grunt.registerTask("bake", "Generate JSON files with school data for async load", function() {
    grunt.task.requires("json");

    var { profiles, enrollment, demographics } = grunt.data.json;
    var profileLookup = {};
    for (var row of profiles) {
      row.district = row.district ? row.district.split(",").map(Number) : [];
      profileLookup[row.id] = row;
    }

    // transform demographic data
    for (var k in demographics) {
      var population = demographics[k];
      delete population.key;
      demographics[k] = { population, enrollment: {
          total: 0,
          white: 0,
          black: 0,
          asian: 0,
          hispanic: 0,
          multi: 0
        }
      }
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
          year: 2023
        };
        item.percents = {
          white: row.white / row.total,
          black: row.black / row.total,
          asian: row.asian / row.total,
          hispanic: row.hispanic / row.total,
          multi: row.multi / row.total
        }
        for (var key of [row.district, row.subdistrict]) {
          if (!key) continue;
          var demo = demographics[key];
          for (var k in item.absolute) {
            demo.enrollment[k] += item.absolute[k];
          }
        }
      }
    }

    // convert demo enrollment totals to percents
    for (var d in demographics) {
      var demo = demographics[d];
      var highest = 0;
      var majority = "none";
      for (var r of ["white", "black", "asian", "hispanic", "multi"]) {
        var percent = demo.enrollment[r] = demo.enrollment[r] / demo.enrollment.total;
        if (percent > .5 && percent > highest) {
          highest = demo.enrollment[r];
          majority = r;
        }
      }
      demo.enrollment.majority = majority;
    }

    grunt.file.write("build/profiles.json", JSON.stringify(profiles));
    grunt.file.write("build/enrollment.json", JSON.stringify(enrollLookup, null, 2));
    grunt.file.write("build/demographics.json", JSON.stringify(demographics));
  });

}