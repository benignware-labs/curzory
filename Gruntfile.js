module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js'],
      options: {
        globals: {
          jQuery: true
        }
      }
    },
    watch: {
      dist: {
        files: ["src/**/*.js"],
        tasks: ['build']
      }
    },
    copy: {
      dist: {
        expand: true,
        cwd: 'src',
        src: ['jquery.curzory.js'],
        dest: 'dist/'
      },
      samples: {
        expand: true,
        cwd: 'dist',
        src: ['jquery.curzory.js'],
        dest: 'samples/dist/'
      }
    },
    browserify: {
      curzory: {
        options: {
          browserifyOptions: {
            standalone: 'curzory',
            debug: true
          }
        },
        files: {
          'dist/curzory.js': 'src/curzory.js'
        }
      },
      jqueryCurzory: {
        options: {
          browserifyOptions: {
            debug: true
          }
        },
        files: {
          'dist/jquery.curzory.js': 'src/jquery.curzory.js'
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/jquery.curzory.min.js': ['dist/jquery.curzory.js'],
          'dist/curzory.min.js': ['dist/curzory.js']
        }
      }
    },
    connect: {
      samples: {
        options: {
          open: true,
          base: 'samples',
          port: 9000,
          livereload: true,
          keepalive: false,
          index: 'index.html'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('default', ['jshint']);
  
  grunt.registerTask('build', ['browserify:curzory', 'browserify:jqueryCurzory', 'uglify:dist', 'copy:samples']);
  
  grunt.registerTask('serve', ['build', 'connect:samples', 'watch']);

};