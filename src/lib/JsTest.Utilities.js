/* ******************************
Author: James Speaker
Copyright 2014-2016, iOnTech
james@iontech.org

Copyright (c) 2016 Jim Speaker

MIT License

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 * *************************** */

var JsTests = JsTests || {};

JsTests.Selectors = {
  testFrameContainer: "#test-fixture",
  testFrame: "#test-fixture iframe"
};

JsTests.Host = (function () {
  var hostName;

  var name = function () {
    if (hostName) {
      return hostName;
    }

    hostName = location.search.getQueryValue("host");
    if (!hostName) {
      hostName = location.host;
    }
    return hostName;
  }

  return {
    name: name
  };
})();

JsTests.Fixture = (function () {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  // ReSharper restore CallerCalleeUsing

  var instantiateNewIframe = function (path) {
    var fqPath;
    if (window.location.protocol === "file:") {
      fqPath = window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/")) + path;
    } else {
      fqPath = window.location.protocol + "//" + JsTests.Host.name() + path;
    }
    $(JsTests.Selectors.testFrameContainer).html("<iframe src='" + fqPath + "' frameborder='0' width='100%' height='500'></iframe>");
    return $(JsTests.Selectors.testFrame);
  };

  var initialize = function (options) {
    var callback = options.callback, testFrame,
      path = options.path ? options.path : "",
      framedAuthentication = JsTests.Configuration.framedAuthentication ? true : false;

    JsTests.testFrame = testFrame = $(JsTests.Selectors.testFrame);

    if (options.authenticated) {
      if (testFrame.length === 0 || testFrame.attr("src").indexOf(JsTests.Host.name()) === -1 || testFrame[0].contentWindow.location.pathname !== path) {
        JsTests.Account().login(function () {
          JsTests.Frame().onLoad(instantiateNewIframe(path), callback);
        });
      } else {
        JsTests.Account().login(callback);
      }
      return;
    }

    if (options.authenticated !== undefined && options.authenticated === false) {
      if (framedAuthentication) {
        JsTests.Frame().onLoad(instantiateNewIframe(path), function () {
          JsTests.Account().logout(callback);
        });
        return;
      }

      JsTests.Account().logout(function () {
        JsTests.Frame().onLoad(instantiateNewIframe(path), callback);
      });
      return;
    }

    if (testFrame.length === 0 || testFrame.attr("src").indexOf(JsTests.Host.name()) === -1 || testFrame[0].contentWindow.location.pathname !== path) {
      JsTests.Frame().onLoad(instantiateNewIframe(path), callback);
    } else {
      callback && callback();
    }
  };

  var initialized = function () {
    return JsTests.testFrame && JsTests.testFrame.contents && JsTests.testFrame.contents().find("div").length > 0;
  };

  var namespace = function () {
    return JsTests.testFrame && JsTests.testFrame.length > 0 && JsTests.testFrame[0].contentWindow ? JsTests.testFrame[0].contentWindow : window;
  };

  var content = function () {
    return JsTests.testFrame && JsTests.testFrame.length > 0 ? JsTests.testFrame.contents() : null;
  };

  return {
    initialize: initialize,
    initialized: initialized,
    namespace: namespace,
    content: content
  };
})();

JsTests.Frame = function () {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  // ReSharper restore CallerCalleeUsing

  var onLoad = function (testFrame, callback) {
    JsTests.testFrame = $(JsTests.Selectors.testFrame);
    $(JsTests.Selectors.testFrame).one("load", function () {
      var frameDocument = JsTests.testFrame && JsTests.testFrame.length > 0 ? JsTests.testFrame[0].contentWindow : null;
      if (!frameDocument) {
        callback && callback();
        return;
      }
      $(frameDocument).ready(function () {
        callback && callback();
      });
    });
  };

  return {
    onLoad: onLoad
  };
};

JsTests.waitFor = function (propertyName, scriptStateObject, callback) {
  JsTests.Wait().until(propertyName, scriptStateObject, true, callback);
};

JsTests.waitForNot = function (propertyName, scriptStateObject, callback) {
  JsTests.Wait().until(propertyName, scriptStateObject, false, callback);
};

JsTests.Wait = (function () {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }

  var until = function (propertyName, scriptStateObject, condition, callback) {
    var start = new Date().getTime(), intervalTime = 1;
    JsTests.Console.information("Waiting for " + propertyName + " in the jasmine IFrame namespace.");
    var interval = setInterval(function () {
      if (scriptStateObject[propertyName] === condition) {
        JsTests.Console.information("waitFor(" + propertyName + ") completed in " + (new Date().getTime() - start) + "ms.");
        clearInterval(interval);
        callback && callback();
      }
    }, intervalTime);
  };

  return {
    until: until
  };
});

JsTests.verbosity = 2; // 0 error, 1 warning, 2 information
JsTests.Console = (function () {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  // ReSharper restore CallerCalleeUsing

  var information = function (message) {
    if (JsTests.verbosity < 2) { return; }
    console.log(message);
  };

  var warning = function (message) {
    if (JsTests.verbosity < 1) { return; }
    console.log(message);
  };

  var error = function (message) {
    if (JsTests.verbosity < 0) { return; }
    console.log(message);
  };

  return {
    information: information,
    warning: warning,
    error: error
  }
})();

JsTests.Ajax = function () {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  // ReSharper restore CallerCalleeUsing

  var cleanInvalidDates = function (data) {
    for (var prop in data) {
      if (data.hasOwnProperty(prop)) {
        if (data[prop] && data[prop].toString() === "Invalid Date") {
          data[prop] = null;
        }
      }
    }
    return data;
  };

  var submit = function (url, method, data, successHandler, errorHandler) {
    data = cleanInvalidDates(data);
    $.ajax(url, {
      async: true,
      cache: false,
      type: method,
      contentType: "application/json; utf-8",
      dataType: "json",
      data: JSON.stringify(data),
      success: successHandler ? successHandler : function () { },
      error: errorHandler ? errorHandler : function () { }
    });
  };

  var get = function (url, successHandler, errorHandler) {
    $.ajax(url, {
      async: true,
      cache: false,
      contentType: "application/json; utf-8",
      success: successHandler ? successHandler : function () { },
      error: errorHandler ? errorHandler : function () { }
    });
  };

  var post = function (url, data, successHandler, errorHandler) {
    data = cleanInvalidDates(data);
    $.ajax(url, {
      async: true,
      cache: false,
      type: "POST",
      contentType: "application/json; utf-8",
      dataType: "json",
      data: JSON.stringify(data),
      success: successHandler ? successHandler : function () { },
      error: errorHandler ? errorHandler : function () { }
    });
  };

  var postJsonForHtml = function (url, data, successHandler, errorHandler) {
    data = cleanInvalidDates(data);
    $.ajax(url, {
      async: true,
      cache: false,
      type: "POST",
      contentType: "application/json; utf-8",
      dataType: "html",
      data: JSON.stringify(data),
      success: successHandler ? successHandler : function () { },
      error: errorHandler ? errorHandler : function () { }
    });
  };

  return {
    get: get,
    post: post,
    submit: submit,
    postJsonForHtml: postJsonForHtml
  };
};

JsTests.isFunction = function (theVariable) {
  var getType = {};
  return theVariable && getType.toString.call(theVariable) === "[object Function]";
};

// ReSharper disable NativeTypePrototypeExtending
String.prototype.getQueryValue = function (key) {
  var i, kvp;
  var query = decodeURIComponent(this.replace("?", ""));
  var params = query.split("&");
  for (i = 0; i < params.length; i += 1) {
    kvp = params[i].split("=");
    if (kvp.length > 1 && kvp[0] === key) {
      return kvp[1];
    }
  }
  return "";
};

String.prototype.getHost = function () {
  var a = document.createElement("a");
  a.href = this;
  return a.hostname;
};
// ReSharper restore NativeTypePrototypeExtending
