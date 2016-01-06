/* ******************************
 * Author: James Speaker
 * Copyright 2014-2016, iOnTech
 * james@iontech.org
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
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  
  var initialize = function (options) {
    var callback = options.callback, testFrame,
        path = options.path ? options.path : "";
    
    JsTests.testFrame = testFrame = $(JsTests.Selectors.testFrame);
    
    if (options.authenticated) {
      JsTests.Account().login(function () {
        if (testFrame.length === 0 || testFrame.attr("src").indexOf(JsTests.Host.name()) === -1 || testFrame[0].contentWindow.location.pathname !== path) {
          JsTests.Frame().onLoad(instantiateNewIframe(path), callback);
        } else {
          callback && callback();
        }
      });
      return;
    }
    
    if (options.authenticated !== undefined && options.authenticated === false) {
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
    return JsTests.testFrame && JsTests.testFrame.length > 0 ? JsTests.testFrame[0].contentWindow : window;
  };
  
  var instantiateNewIframe = function (path) {
    $(JsTests.Selectors.testFrameContainer).html("<iframe src='//" + JsTests.Host.name() + path + "' frameborder='0' width='100%' height='500'></iframe>");
    return $(JsTests.Selectors.testFrame);
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
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }

  var onLoad = function (testFrame, callback) {
    $(JsTests.Selectors.testFrame).one("load", function () {
      JsTests.testFrame = $(JsTests.Selectors.testFrame);
      var frameDocument = JsTests.testFrame&& JsTests.testFrame.length > 0 ? JsTests.testFrame[0].contentWindow : null;
      
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
  var start = new Date().getTime(), intervalTime = 1;
  JsTests.Console.information("Waiting for " + propertyName + " in the jasmine IFrame namespace.");
  var interval = setInterval(function () {
    if (scriptStateObject[propertyName]) {
      JsTests.Console.information("waitFor(" + propertyName + ") completed in " + (new Date().getTime() - start) + "ms.");
      clearInterval(interval);
      callback && callback();
    }
  }, intervalTime);
};

JsTests.verbosity = 1; // 0 error, 1 warning, 2 information
JsTests.Console = (function () {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  
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
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }
  
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
  
  var cleanInvalidDates = function (data) {
    for (var prop in data) {
      if (data[prop] && data[prop].toString() === "Invalid Date") {
        data[prop] = null;
      }
    }
    return data;
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
