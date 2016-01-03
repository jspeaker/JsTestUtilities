/* ******************************
 * Author: James Speaker
 * Copyright 2016, iOnTech
 * james@iontech.org
 * *************************** */
var JsTests = JsTests || {};

JsTests.Selectors = {
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

JsTests.verbosity = 2; // 0 error, 1 warning, 2 information
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

JsTests.Utility = {
};

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
