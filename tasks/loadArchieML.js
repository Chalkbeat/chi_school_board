/*
Process text files as ArchieML
Anything that has a .txt extension in /data will be loaded
*/

var path = require("path");
var betty = require("@nprapps/betty");

module.exports = function(grunt) {

  grunt.registerTask("archieml", "Loads ArchieML files from data/*.txt", function() {

    grunt.task.requires("state");
    grunt.data.archieml = {};

    var files = grunt.file.expand("data/*.txt");

    files.forEach(function(f) {
      var name = path.basename(f).replace(/(\.docs)?\.txt$/, "");
      var contents = grunt.file.read(f);

      var parsed = betty.parse(contents, {
        XonFieldName: t => t[0].toLowerCase() + t.slice(1),
        onValue: function(v) {
          if (typeof v == "object") return v;
          if (v.match(/^0$|^-?(0?\.|[1-9])[\d\.]*$/)) {
            var n = Number(v);
            return isNaN(n) ? v : n;
          } else if (v.match(/^(true|false)$/i)) {
            return v.toLowerCase() == "true";
          }
          return v;
        }
      });
      grunt.data.archieml[name] = parsed;
    });

  });

};