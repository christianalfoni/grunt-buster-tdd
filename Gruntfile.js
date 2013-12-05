/*
 * grunt-buster-singlerun
 * https://github.com/christianalfoni/grunt-buster-singlerun
 *
 * Copyright (c) 2013 christianalfoni
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        // Unit tests.
        buster: {
            all: {
                test: {
                    tests: 'test/**/*_test.js',
                    config: 'test/buster-config.js'
                }
            },
            options: {
                growl: false
            }
        }

    });

    // Actually load this plugin's task(s).
    //grunt.loadTasks('tasks');

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');


    // By default, lint and run all tests.
    grunt.registerTask('default', ['jshint']);

};
