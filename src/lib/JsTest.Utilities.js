/* ******************************
Author: Jim Speaker
Copyright 2014-2017, iOnTech
james@iontech.org

Copyright (c) 2014-2017 Jim Speaker

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

JsTests.Fixture = (function () {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  // ReSharper restore CallerCalleeUsing

  var initialize = function (options) {
    var callback = options.callback,
      path = options.path ? options.path : "";

    JsTests.testFrame = $(JsTests.Selectors.testFrame);

    var authentication = new JsTests.Authentication(options.authenticated, path);
    authentication.init(callback);

    if (JsTests.testFrame.length === 0 ||
      JsTests.testFrame.attr("src").indexOf(JsTests.Host.name()) === -1 ||
      JsTests.testFrame[0].contentWindow.location.pathname !== path) {
      var frame = new JsTests.Frame();
      JsTests.Frame().onLoad(frame.initialize(path), callback);
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

JsTests.Authentication = function (authenticated, path) {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(authenticated, path);
  }
  // ReSharper restore CallerCalleeUsing

  var self = this;
  this.authenticated = authenticated;
  this.path = path;

  var requestedFrameExists = function () {
    return !(JsTests.testFrame.length === 0 ||
      JsTests.testFrame.attr("src").indexOf(JsTests.Host.name()) === -1 ||
      JsTests.testFrame[0].contentWindow.location.pathname !== path);
  };

  var tryLoginExistingFrame = function (callback) {
    if (!self.authenticated || !requestedFrameExists()) return false;

    JsTests.Account().login(callback);
    return true;
  };

  var tryLoginNonExistentFrame = function (callback) {
    if (!self.authenticated || requestedFrameExists()) return false;

    var frame = new JsTests.Frame();
    JsTests.Account().login(function () {
      JsTests.Frame().onLoad(frame.initialize(self.path), callback);
    });
    return true;
  };

  var tryLogoutNestedAuthenticationFrame = function (callback) {
    var framedAuthentication = JsTests.Configuration.framedAuthentication ? true : false;
    if (self.authenticated === undefined || self.authenticated === true || !framedAuthentication) return false;

    var frame = new JsTests.Frame();
    JsTests.Frame().onLoad(frame.initialize(path), function () {
      JsTests.Account().logout(callback);
    });
    return true;
  };

  var tryLogout = function (callback) {
    if (self.authenticated === undefined || self.authenticated === true) return false;

    var frame = new JsTests.Frame();
    JsTests.Account().logout(function () {
      JsTests.Frame().onLoad(frame.initialize(path), callback);
    });
    return true;
  };

  var init = function (callback) {
    if (tryLoginExistingFrame(callback)) return;

    if (tryLoginNonExistentFrame(callback)) return;

    if (tryLogoutNestedAuthenticationFrame(callback)) return;

    if (tryLogout(callback)) return;
  };

  return {
    init: init
  };
};

JsTests.Frame = function () {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  // ReSharper restore CallerCalleeUsing

  var tryGetFrameContentWindow = function () {
    if (!JsTests.testFrame || JsTests.testFrame.length === 0) return false;

    return JsTests.testFrame[0].contentWindow;
  };

  var tryBindingFrameContentWindowReady = function (callback) {
    var frameContentWindow = tryGetFrameContentWindow();
    if (!frameContentWindow) return false;

    $(frameContentWindow).ready(function () {
      callback && callback();
    });
    return true;
  };

  var onLoad = function (testFrame, callback) {
    JsTests.testFrame = $(JsTests.Selectors.testFrame);
    $(JsTests.Selectors.testFrame).one("load", function () {
      if (tryBindingFrameContentWindowReady(callback)) return;

      callback && callback();
    });
  };

  var initialize = function (path) {
    var pathUtility = new JsTests.PathUtilityFactory(path).create();
    var fqPath = pathUtility.fullyQualified();

    $(JsTests.Selectors.testFrameContainer).html("<iframe src='" + fqPath + "' frameborder='0' width='100%' height='500'></iframe>");
    return $(JsTests.Selectors.testFrame);
  };

  return {
    onLoad: onLoad,
    initialize: initialize
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
      if (data.hasOwnProperty(prop) && data[prop] && data[prop].toString() === "Invalid Date") {
        data[prop] = null;
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

JsTests.PathUtilityFactory = function (path) {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(path);
  }
  // ReSharper restore CallerCalleeUsing

  var self = this;
  this.path = path;

  var create = function () {
    if (window.location.protocol.indexOf("http") === 0) return new JsTests.UrlPathUtlility(self.path);

    if (window.location.protocol.indexOf("file") === 0) return new JsTests.FilePathUtility(self.path);

    throw new Error("PathUtilityFactory could not resolve strategy.");
  };

  return {
    create: create
  };
};

JsTests.UrlPathUtlility = function (path) {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(path);
  }
  // ReSharper restore CallerCalleeUsing

  var self = this;
  this.path = path;

  var fullyQualified = function () {
    return window.location.protocol + "//" + JsTests.Host.name() + self.path;
  };

  return {
    fullyQualified: fullyQualified
  };
};

JsTests.FilePathUtility = function (path) {
  // ReSharper disable CallerCalleeUsing
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee(path);
  }
  // ReSharper restore CallerCalleeUsing

  var self = this;
  this.path = path;

  var fullyQualified = function () {
    return window.location.pathname.substr(0, window.location.pathname.lastIndexOf("/")) + self.path;
  };

  return {
    fullyQualified: fullyQualified
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
