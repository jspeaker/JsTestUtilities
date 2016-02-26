describe("Given JsTest.Utilities", function () {
  var actual,
      accountInstance = new JsTests.Account(),
      frameInstance = new JsTests.Frame();
  
  beforeEach(function () {
    spyOn(JsTests, "Account").and.returnValue(accountInstance);
    spyOn(accountInstance, "login").and.callThrough();
    spyOn(accountInstance, "logout").and.callThrough();
    
    spyOn(JsTests, "Frame").and.returnValue(frameInstance);
    spyOn(frameInstance, "onLoad").and.callThrough();
    
    spyOn(JsTestMock, "fnToCallback");
  });
  
  describe("When calling JsTests.Host.name", function () {
    var expected = window.location.host;
    beforeEach(function () {
      actual = JsTests.Host.name();
    });
    
    it("Then it should return the correct host name", function () {
      expect(actual).toBe(expected);
    });
  });
  
  describe("When calling Fixture initialize with authentication", function () {
    describe("and authentication is framed", function() {
      beforeEach(function() {
        JsTests.Configuration.framedAuthentication = true;
        actual = JsTests.Fixture.initialize({
          authenticated: true,
          callback: JsTestMock.fnToCallback,
          path: "/fixtures/index.html"
        });
      });
      
      it("Then it should return a jQuery reference to a test frame", function () {
        expect(JsTests.testFrame).toBeTruthy();
        expect(JsTests.testFrame.length).toBe(1);
      });
      
      it("Then it should call Account login", function () {
        expect(JsTests.Account().login).toHaveBeenCalled();
      });
      
      it("Then it should not call Account logout", function () {
        expect(JsTests.Account().logout).not.toHaveBeenCalled();
      });
      
      it("Then it should call the on load event handler for the frame", function () {
        expect(JsTests.Frame().onLoad).toHaveBeenCalled();
      });
      
      it("Then it should not call the callback", function () { // the file: protocol prevents frame access
        expect(JsTestMock.fnToCallback).not.toHaveBeenCalled();
      });
    });
    
    describe("and authentication is not framed", function () {
      beforeEach(function () {
        JsTests.Configuration.framedAuthentication = false;
        actual = JsTests.Fixture.initialize({
          authenticated: true,
          callback: JsTestMock.fnToCallback,
          path: "/fixtures/index.html"
        });
      });
      
      it("Then it should return a jQuery reference to a test frame", function () {
        expect(JsTests.testFrame).toBeTruthy();
        expect(JsTests.testFrame.length).toBe(1);
      });
      
      it("Then it should call Account login", function () {
        expect(JsTests.Account().login).toHaveBeenCalled();
      });
      
      it("Then it should not call Account logout", function () {
        expect(JsTests.Account().logout).not.toHaveBeenCalled();
      });
      
      it("Then it should call the on load event handler for the frame", function () {
        expect(JsTests.Frame().onLoad).toHaveBeenCalled();
      });
      
      it("Then it should not call the callback", function () { // the file: protocol prevents frame access
        expect(JsTestMock.fnToCallback).not.toHaveBeenCalled();
      });
    });
  });
  
  describe("When calling Fixture initialize with no authentication", function () {
    describe("and authentication is framed", function () {
      beforeEach(function () {
        JsTests.Configuration.framedAuthentication = true;
        actual = JsTests.Fixture.initialize({
          authenticated: false,
          callback: JsTestMock.fnToCallback,
          path: "/fixtures/index.html"
        });
      });
      
      it("Then it should return a jQuery reference to a test frame", function () {
        expect(JsTests.testFrame).toBeTruthy();
        expect(JsTests.testFrame.length).toBe(1);
      });
      
      it("Then it should not call Account login", function () {
        expect(JsTests.Account().login).not.toHaveBeenCalled();
      });
      
      it("Then it should not call Account logout", function () {
        expect(JsTests.Account().logout).not.toHaveBeenCalled();
      });
      
      it("Then it should call the on load event handler for the frame", function () {
        expect(JsTests.Frame().onLoad).toHaveBeenCalled();
      });
      
      it("Then it should not call the callback", function () { // the file: protocol prevents frame access
        expect(JsTestMock.fnToCallback).not.toHaveBeenCalled();
      });
    });
    
    describe("and authentication is not framed", function () {
      beforeEach(function () {
        JsTests.Configuration.framedAuthentication = false;
        actual = JsTests.Fixture.initialize({
          authenticated: false,
          callback: JsTestMock.fnToCallback,
          path: "/fixtures/index.html"
        });
      });
      
      it("Then it should return a jQuery reference to a test frame", function () {
        expect(JsTests.testFrame).toBeTruthy();
        expect(JsTests.testFrame.length).toBe(1);
      });
      
      it("Then it should not call Account login", function () {
        expect(JsTests.Account().login).not.toHaveBeenCalled();
      });
      
      it("Then it should call Account logout", function () {
        expect(JsTests.Account().logout).toHaveBeenCalled();
      });
      
      it("Then it should call the on load event handler for the frame", function () {
        expect(JsTests.Frame().onLoad).toHaveBeenCalled();
      });
      
      it("Then it should not call the callback", function () { // the file: protocol prevents frame access
        expect(JsTestMock.fnToCallback).not.toHaveBeenCalled();
      });
    });
  });
  
  describe("When calling Fixture initialize with undefined authentication", function () {
    beforeEach(function () {
      actual = JsTests.Fixture.initialize({
        callback: JsTestMock.fnToCallback,
        path: "/fixtures/index.html"
      });
    });
    
    it("Then it should return a jQuery reference to a test frame", function () {
      expect(JsTests.testFrame).toBeTruthy();
      expect(JsTests.testFrame.length).toBe(1);
    });
    
    it("Then it should not call Account login", function () {
      expect(JsTests.Account().login).not.toHaveBeenCalled();
    });
    
    it("Then it should not call Account logout", function () {
      expect(JsTests.Account().logout).not.toHaveBeenCalled();
    });
    
    it("Then it should call the on load event handler for the frame", function () {
      expect(JsTests.Frame().onLoad).toHaveBeenCalled();
    });
    
    it("Then it should not call the callback", function () { // the file: protocol prevents frame access
      expect(JsTestMock.fnToCallback).not.toHaveBeenCalled();
    });
  });

});
