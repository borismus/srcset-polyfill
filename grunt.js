module.exports = function(grunt) {
  grunt.initConfig({
    lint: { all: ['js/*.js'] },
    concat: { 'build/srcset.js': [
      'js/libs/*',
      'js/srcset-info.js',
      'js/viewport-info.js',
      'js/main.js'
      ]
    },
    min: { 'build/srcset.min.js': ['build/srcset.js'] },
  });

  grunt.registerTask('default', 'lint concat min');
};
