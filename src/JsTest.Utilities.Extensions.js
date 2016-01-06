/* ******************************
 * Author: James Speaker
 * Copyright 2014-2016, iOnTech
 * james@iontech.org
 * *************************** */
var JsTests = JsTests || {};

JsTests.Spies = function () {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }

  var ns = JsTests.Fixture.namespace();

  var init = function () {
  };

  return {
    init: init
  };
};

JsTests.Account = function () {
  if (!(this instanceof arguments.callee)) {
    return new arguments.callee();
  }

  var ns = JsTests.Fixture.namespace();

  var login = function (callback) {
    callback && callback();
  };

  var logout = function (callback) {
    callback && callback();
  };

  return {
    login: login,
    logout: logout
  };
};
