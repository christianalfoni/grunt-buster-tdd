(function (buster) {
    // Reset buster native HTML reporter, except stats
    buster.reporters.html.contextStart = function () {
    };
    buster.reporters.html.testSuccess = function () {
    };
    buster.reporters.html.testFailure = function () {
    };
    buster.reporters.html.testError = function () {
    };
    buster.reporters.html.testDeferred = function () {
    };

    var tests = [];
    var mainBranches = [];
    var currentBranch = null;
    var collapseBusterTests = localStorage.collapseBusterTests && localStorage.collapseBusterTests === 'true';

    var getTestBranch = function (testCase, branch) {
        branch = branch || currentBranch;
        if (branch) {
            for (var x = 0; x < branch.tests.length; x++) {
                var currentBranchTest = branch.tests[x];
                if (currentBranchTest.name === testCase.name) {
                    return currentBranchTest;
                } else if (currentBranchTest.tests) {
                    var deeperBranchHit = getTestBranch(testCase, currentBranchTest);
                    if (deeperBranchHit) {
                        return deeperBranchHit;
                    }
                }
            }
        }
    }

    var mergeContextsAndTests = function (testCase) {
        var testArray = [],
            contexts = testCase.getContexts(),
            tests = testCase.getTests();

        tests.forEach(function (test) {
            testArray.push(test);
        });

        contexts.forEach(function (context) {
            testArray.push({
                name: context.name,
                tests: []
            })
        });

        return testArray;
    }

    var getTestInBranch = function (testCase, branch) {

        for (var x = 0; x < branch.tests.length; x++) {
            var testOrContext = branch.tests [x];
            if (testOrContext.name === testCase.name && !testOrContext.result) {
                return testOrContext;
            } else if (!testOrContext.func) { // If is new context
                var test = getTestInBranch(testCase, testOrContext);
                if (test) {
                    return test;
                }
            }
        }

    }

    var createStack = function (stack) {
        var stackObjects = [],
            stack = stack.split('\n'),
            lineParts;

        stack.forEach(function (line) {
            if (line.match(/\.js/) && !line.match(/(?:singlerun.js)/)) { // Remove buster stack traces?
                var regexp = new RegExp(location.host + '(.*)');
                lineParts = line.match(regexp)[1].split(':').reverse();
                stackObjects.push({
                    isTest: lineParts[2].match(/BUSTER-TEST-FILE/),
                    file: lineParts[2],
                    lineNumber: lineParts[1] // Index 0 is character index
                });
            }
        });
        return stackObjects;

    }

    var createElement = function (type, className, content) {
        var element = document.createElement(type);
        element.className = className || '';
        element.innerHTML = content || '';
        return element;
    }

//    var createShortError = function (message, lineNumber) {
//        var wrapper = createElement('div', 'error');
//        wrapper.appendChild(createElement('span', 'error-message', message));
//        wrapper.appendChild(createElement('span', 'error-lineNumber', ' on line ' + lineNumber));
//        return wrapper;
//    }

    var branchLevel = 0;
    var addBranches = function (branches, list) {
        branchLevel++;
        branches.forEach(function (branch) {
            if (branch.result) { // If test
                var result = createElement('li', branch.result.type);
                list.appendChild(result);
                if (branch.result.type === 'failure') {
                    result.innerHTML = branch.name + ' &#187; ' + branch.result.error.message;
                    var stack = branch.result.error.stack ? createStack(branch.result.error.stack) : [],
                        wrapper = createElement('div', 'stack');

                    stack.forEach(function (stackData) {
                        wrapper.appendChild(createElement('div', null, 'Line ' + stackData.lineNumber + ' in ' + stackData.file));
//                        if (stackData.isTest) {
//                            document.getElementById('error-summary').appendChild(createShortError(branch.result.error.message, stackData.lineNumber));
//                        }
                    });
                    result.appendChild(wrapper);
                } else {
                    result.innerHTML = branch.name;
                }
            } else { // If new context
                var newContext = createElement('li'),
                    branchList = createElement('ul', 'branch' + branchLevel);
                list.appendChild(createElement('li', 'context', branch.name));
                list.appendChild(newContext);
                branchList.style.marginLeft = '10px';
                newContext.appendChild(branchList);
                addBranches(branch.tests, branchList);
            }
        });
        branchLevel--;
    };
    var addTests = function () {
        var topLevel = createElement('ul', 'buster-test branch');
        addBranches(mainBranches, topLevel);
        return topLevel;
    };

    var toggleCollapse = function (tests) {
        var contexts = Array.prototype.slice.call(tests.querySelectorAll('.context'), 0);
        contexts.forEach(function (context) {
            if (collapseBusterTests && context.nextSibling && !context.nextSibling.querySelectorAll('.failure').length) {
                context.nextSibling.style.display = 'none';
                context.className = context.nextSibling.querySelectorAll('.deferred').length ? 'context success deferred' : 'context success';
            } else if (context.nextSibling) {
                context.nextSibling.style.display = 'block';
                context.className = 'context';
            }
        });
    };


    buster.testRunner.on('context:start', function (testCase) {
        var test = getTestBranch(testCase);
        if (!test) {
            test = tests;
            test.push({
                name: testCase.name,
                tests: mergeContextsAndTests(testCase)
            });
            mainBranches.push(test[test.length - 1]);
            currentBranch = mainBranches[mainBranches.length - 1];
        } else {
            test.tests = mergeContextsAndTests(testCase);
        }

    });

    var successBranch = 0;
    buster.testRunner.on('test:success', function (testCase) {
        for (var x = successBranch; x < mainBranches.length; x++) {
            var branch = mainBranches[x],
                branchTest = getTestInBranch(testCase, branch)
            if (branchTest) {
                branchTest.result = {
                    type: 'success',
                    assertions: testCase.assertions
                };
            } else {
                successBranch++;
            }
        }
    });

    var failureBranch = 0;
    buster.testRunner.on('test:failure', function (testCase) {
        for (var x = failureBranch; x < mainBranches.length; x++) {
            var branch = mainBranches[x],
                branchTest = getTestInBranch(testCase, branch)
            if (branchTest) {
                branchTest.result = {
                    type: 'failure',
                    error: {
                        message: testCase.error.message,
                        stack: testCase.error.stack
                    }
                }
            } else {
                failureBranch++;
            }
        }
    });

    var errorBranch = 0;
    buster.testRunner.on('test:error', function (testCase) {
        for (var x = failureBranch; x < mainBranches.length; x++) {
            var branch = mainBranches[x],
                branchTest = getTestInBranch(testCase, branch)
            if (branchTest) {
                branchTest.result = {
                    type: 'failure',
                    error: {
                        message: testCase.error.message,
                        stack: testCase.error.stack
                    }
                }
            } else {
                errorBranch++;
            }
        }
    });

    var deferredBranch = 0;
    buster.testRunner.on('test:deferred', function (testCase) {
        for (var x = failureBranch; x < mainBranches.length; x++) {
            var branch = mainBranches[x],
                branchTest = getTestInBranch(testCase, branch)
            if (branchTest) {
                branchTest.result = {
                    type: 'deferred'
                }
            } else {
                deferredBranch++;
            }
        }
    });

    buster.testRunner.on('suite:end', function () {
//        var errorSummary = createElement('div', 'error-summary');
//        errorSummary.id = 'error-summary';
//        document.body.appendChild(errorSummary);
        var tests = addTests();
        collapseBusterTests = localStorage.collapseBusterTests ? JSON.parse(localStorage.collapseBusterTests) : false;
        toggleCollapse(tests);
        window.addEventListener('keydown', function (event) {
            if (event.keyCode === 32) {
                collapseBusterTests = !collapseBusterTests;
                localStorage.collapseBusterTests = collapseBusterTests;
                toggleCollapse(tests);
                event.preventDefault();
            }
        });
        document.body.appendChild(tests);
    });


}(buster));