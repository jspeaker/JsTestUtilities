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
    
    spyOn(JsTestMock, "foo");
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
    beforeEach(function () {
      actual = JsTests.Fixture.initialize({
        authenticated: true,
        callback: JsTestMock.foo
      });
    });
    
    it("Then it should return a jQuery reference to a non-existent test frame", function () {
      expect(JsTests.testFrame).toBeTruthy();
      expect(JsTests.testFrame.length).toBe(0);
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
  });
  
  describe("When calling Fixture initialize with no authentication", function () {
    beforeEach(function () {
      actual = JsTests.Fixture.initialize({ authenticated: false });
    });
    
    it("Then it should return a jQuery reference to a non-existent test frame", function () {
      expect(JsTests.testFrame).toBeTruthy();
      expect(JsTests.testFrame.length).toBe(0);
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
  });
  
  describe("When calling Fixture initialize with undefined authentication", function () {
    beforeEach(function () {
      actual = JsTests.Fixture.initialize({});
    });
    
    it("Then it should return a jQuery reference to a non-existent test frame", function () {
      expect(JsTests.testFrame).toBeTruthy();
      expect(JsTests.testFrame.length).toBe(0);
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
  });

});
