/*
 * grunt-buster-tdd
 * https://github.com/christian/grunt-buster-tdd
 *
 * Copyright (c) 2013 Christian Alfoni Jørgensen
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    // PLUGIN DEPS
    grunt.loadNpmTasks('grunt-contrib-watch');


    // Module DEPS
    var http = require('http'),
        serverRunning = false,
        doReload = false,
        busterCss = grunt.file.read(__dirname + '/../staticFiles/buster-test.css'),
        busterTest = grunt.file.read(__dirname + '/../staticFiles/buster-test.js'),
        sinon = grunt.file.read(__dirname + '/../staticFiles/sinon-1.7.1.js'),
        expect = grunt.file.read(__dirname + '/../staticFiles/expect.js'),
        exposeExpect = grunt.file.read(__dirname + '/../staticFiles/exposeExpect.js'),
        reporter = grunt.file.read(__dirname + '/../staticFiles/reporter.js'),
        reload = grunt.file.read(__dirname + '/../staticFiles/reload.js');

    // OPTIONS
    var sources,
        libs,
        testFile,
        testsPath,
        port;

    // METHODS
    var p = {
        extractFilesMap: function (files) {
            var filesMap = {};
            files.forEach(function (fileData) {
                filesMap[fileData.dest] = fileData.src || [];
            });
            return filesMap;
        },
        extractOriginalPaths: function (files) {
            var filesMap = {};
            files.forEach(function (fileData) {
                filesMap[fileData.dest] = fileData.orig.src;
            });
            return filesMap;
        },
        setResourcesAndOptions: function (files, options, testName) {
            sources = files.sources;
            libs = files.libs;
            port = options.port || 3001;
            testFile = testName + '-test.js';
            testsPath = options.testsPath || '';
        },
        addLibs: function () {
            var libScripts = '';
            libs.forEach(function (lib) {
                libScripts += '<script src="' + lib + '"></script>\n';
            });
            return libScripts;
        },
        addSources: function () {
            var sourcesScripts = '';
            sources.forEach(function (source) {
                sourcesScripts += '<script src="' + source + '"></script>\n';
            });
            return sourcesScripts;
        },
        sendIndex: function (req, res) {
            var body = '<!DOCTYPE html>' +
                '<html>' +
                '<head>' +
                '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
                '<style>html, body {background-color: #111; } .test-file-name { color: #444 !important; font-size: 24px !important; position: fixed; bottom: 10px; right: 10px;color: white; }</style>' +
                '<script src="/reporter.js"></script>' +
                '</head>' +
                '<body>' +
                '<span class="test-file-name">' + testFile + '</span>';

            body += p.addLibs();
            body += p.addSources();
            body += '<script src="' + testsPath + testFile + '"></script>' +
                '</body>' +
                '</html>';

            res.writeHead(200, {
                "Content-Type": "text/html",
                'Content-Length': body.length
            });
            res.end(body);
        },
        sendRunnerCss: function (req, res) {
            res.writeHead(200, {
                "Content-Type": "text/css",
                'Content-Length': busterCss.length
            });
            res.end(busterCss);
        },
        sendReporter: function (req, res) {
            var lib = busterTest + '\n' + sinon + '\n' + expect + '\n' + exposeExpect + '\n' + reporter.replace(/BUSTER-TEST-FILE/g, testFile) + '\n' + reload;
            res.writeHead(200, {
                "Content-Type": "application/javascript",
                'Content-Length': lib.length
            });
            res.end(lib);
        },
        sendFile: function (req, res) {
            if (req.url.match(/\.js$/)) {
                var file = grunt.file.read(process.cwd() + req.url);
                res.writeHead(200, {
                    "Content-Type": "application/javascript",
                    'Content-Length': file.length
                });
                res.end(file);
            } else {
                res.writeHead(404);
                res.end();
            }
        },
        reload: function (req, res) {
            if (doReload) {
                doReload = false;
                res.end('reload');
            } else {
                res.end('');
            }
        },
        addWatchTask: function (fileMap) {
            var watchConfig = grunt.config('watch') || {},
                files = fileMap.sources;

            files.push(testsPath + testFile);
            watchConfig.__tdd = {
                files: files,
                tasks: ['tdd'],
                options: {
                    spawn: false,
                    interrupt: true
                }
            }
            grunt.config('watch', watchConfig);
        }
    };

    grunt.registerMultiTask('tdd', 'Test single test files in browser with automatic reload', function () {
        if (!serverRunning) {
            p.setResourcesAndOptions(p.extractFilesMap(this.files), this.options(), grunt.option('test'));
            var server = http.createServer(function (req, res) {
                switch (req.url) {
                    case '/':
                        p.sendIndex(req, res);
                        break;
                    case '/reload':
                        p.reload(req, res);
                        break;
                    case '/reporter.js':
                        p.sendReporter(req, res);
                        break;
                    case '/buster-test.css':
                        p.sendRunnerCss(req, res);
                        break;
                    default:
                        p.sendFile(req, res);
                }
                ;
            });
            server.listen(port);
            serverRunning = true;
            p.addWatchTask(p.extractOriginalPaths(this.files));
            grunt.task.run(['watch:__tdd']);
        } else {
            doReload = true;
        }
    });
};