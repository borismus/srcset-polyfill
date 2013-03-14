module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: { all: ['js/*.js'] },
    concat: {
      dist: {
        src: [
          'js/libs/*',
          'js/srcset-info.js',
          'js/viewport-info.js',
          'js/main.js'
        ],
        dest: 'build/srcset.js'
      }
    },
    uglify: {
      my_target: {
        files: {
          'build/srcset.min.js': ['build/srcset.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['jshint', 'concat', 'uglify']);
};
