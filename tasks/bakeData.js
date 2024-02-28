/*
Bakes out JSON files from various sources (mostly sheets) so they can be loaded async.
*/

module.exports = function(grunt) {

  var fs = require("node:fs");

  grunt.registerTask("bake", "Generate JSON files with school data for async load", function() {
    grunt.task.requires("json");

    grunt.file.write("build/profiles.json", JSON.stringify(grunt.data.json.profiles));
    grunt.file.write("build/enrollment.json", JSON.stringify(grunt.data.json.enrollment));
  });

}