var system = require('system');

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 60001, //< Default Max Timeout is 3s
      start = new Date().getTime(),
      condition = false,
      interval = setInterval(function () {
        if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
          // If not time-out yet and condition not yet fulfilled
          condition = (typeof (testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
        } else {
          if (!condition) {
            // If condition still not fulfilled (timeout but condition is 'false')
            console.log("'waitFor()' timeout, " + maxtimeOutMillis + " elapsed without the condition being fulfilled.");
            phantom.exit(1);
          } else {
            // Condition fulfilled (timeout and/or condition is 'true')
            console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
            typeof (onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
            clearInterval(interval); //< Stop this interval
          }
        }
      }, 100); //< repeat check every 100ms
};

if (system.args.length !== 2) {
  console.log('Usage: run-jasmine.js URL');
  phantom.exit(1);
}

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function (msg) {
  console.log(msg);
};
page.open(system.args[1], function (status) {
  var i, passedElement
  if (status !== "success") {
    console.log("Unable to access network");
    phantom.exit(1);
  } else {
    waitFor(function () {
      return page.evaluate(function () {
        if (!window.api.fstmJasmineIsWaiting) {
          console.log(window.api.status());
          window.api.fstmJasmineIsWaiting = true;
        }
        return window.api.status() === "done";
      });
    }, function () {
      try {
        global_page = page;
        var exitCode = page.evaluate(function () {

          console.log('');

          var specs = window.api.specs();

          var failed = 0;
          var passed = 0;

          for(i = 0; i < specs.length; i++) {
            var spec = specs[i];
            if (spec.status == "passed") {
              passed++;
              console.log("Test Passed\t" + spec.description);
            } else {
              failed++;
              console.log("***FAILURE***\t" + spec.description + "\tExpected: " + spec.failedExpectations[0].expected + " Actual: " + spec.failedExpectations[0].actual);
            }
          }

          console.log("");
          console.log((failed + passed) + " Total Specs Run");
          console.log(failed + " Failed");
          console.log(passed + " Passed");

          if(failed > 0) {
            return 1;
          }
        });
      } catch (ex) {
        exitCode = 1;
      }
      console.log('');
      phantom.exit(exitCode);
    });
  }
});