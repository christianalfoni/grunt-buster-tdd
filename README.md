grunt-buster-tdd
================

Get on with TDD in the browser with this auto-reload, one-file and error highlighting testrunner/reporter.

## Dependency
- grunt-contrib-watch (**npm install grunt-contrib-watch**)

## Install
**npm install grunt-buster-tdd**

**Important!** Due to watching a lot of files for changes when writing tests it is needed to increase MacOSX default limit, which is very low by default. Create/Edit your ~/.bash_profile file and add the following line: ulimit -S -n 2048 (or higher).

## Use
```javascript
module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        tdd: {
            browser: {
                files: {
                    sources: ['sources/**/*.js'], // The source files of the project
                    libs: ['libs/**/*.js'] // Any libs to load first
                },
                options: {
                    testsPath: 'tests/', // Where are your tests located?
                    port: 3002 // Port to show tests, defaults to 3001
                }
            }
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-buster-tdd');

    // By default, lint and run all tests.
    grunt.registerTask('default', ['tdd:browser']);

};
```
Given that you have the file *tests/foo-test.js*, you load the runner with: **grunt --test=foo**. This means that all test files should have the following format: *"name"-test.js*.

## How it works
- Go to localhost:3001 (or port defined) in your browser
- The task will automatically watch your source files and the test file you are working in. If any of them change, the browser will automatically refresh
- press **space** to collapse and expand the successfull tests
- You can nest tests as much as you want
- If you'd rather use **expect js** to assert your tests, you are welcome to just do that, it is included. Or use **Buster js** assertions
- The stack trace shown is only related to your testfile and source code, never the test framework


## How it looks
A summary of tests are shown at the top and a nested structure shows your tests.
![Successfull tests](https://raw.github.com/christianalfoni/grunt-buster-tdd/master/fullscreen.png "Successfull tests")

By hitting **space** you can collapse the successfull tests. If any error occurs, it will be displayed.
![Collapsed tests with error](https://raw.github.com/christianalfoni/grunt-buster-tdd/master/error.png "Collapsed tests with error")
