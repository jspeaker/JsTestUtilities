# JsTestUtilities

JsTestUtilities is a library by iOnTech (Jim Speaker) that allows running a web application in an iFrame while Jasmine runs in the main window and exercises integration tests against the actual web application. This provides a solution to a number of different problems with testing web user interfaces with Jasmine. This solution, as stated, is to allow Jasmine to be used for full integration tests as well as more basic UI tests. In my opinion, it's ability to fully integration test a web application from the UI level while properly handling the asynchronous nature of modern web applications (e.g. Ajax) renders Selenium obsolete.

### Problems solved:   ###
1. Fixtures are a fixed-in-time HTML representation of a user-interface component and get out of sync with the actual views, typically generated views, in a web application. Running Jasmine tests against fixtures is brittle in that when the actual view code changes, and the fixture is not updated accordingly, the test(s) may pass while the production code is actually broken because of the view changes, i.e. false positives.
2. Generating fixtures dynamically is complex and laborious. Some view engines, such as Spark, provide access to internals which allow rendering the HTML that would be generated at runtime and saving that HTML as Jasmine fixtures. While this approach does solve the fixed-in-time issue with static HTML files, as stated it is laborious and rather complex. Additionally, generating HTML fixtures is of limited usefulness as the static HTML does not accommodate testing the web application's ability to communicate properly via Ajax, etc.
3. Testing the UI in its entirety, however deeply you find useful, is now a reality. It is possible with this approach to resize the UI iFrame within the browser or PhantomJS headless browser and test the responsiveness of your application. Because the web application is running, and test assertions are running against the current state of the actual user interface, assertions can be made about the UI elements' current state of display, positioning, etc.

## Getting Started ##
It is recommended that you create a separate project for your Jasmine tests. Of course, we would not want to mix up our test code with our application code. E.g.:  

 - MyApplication  
    -- Controllers  
    -- Views  
    -- (etc)  
 - JsTests.Integration.MyApplication  

### Installation ###

Install the Nuget package in the test project:  
  `PM> Install-Package iOnTech.JsTestUtilities`

Once you've installed the Nuget package you will find that file content has been added to your project as follows:

 - MyApplication  
    -- Controllers  
    -- Views  
    -- (etc)  
 - JsTests.Integration.MyApplication  
    -- Content  
    ---- jasmine  
    ---- jasmine_favicon.png  
    -- Scripts  
    ---- jasmine  
    ------ boot.js  
    ------ console.js  
    ------ jasmine-html.js  
    ------ jasmine.js  
    ---- lib  
    ------ phantom-jasmine  
    -------- console-runner.js  
    -------- run-jasmine.js  
    ------ JsTest.Utilities.Extensions.js  
    ------ JsTest.Utilities.js  
    ------ LICENSE.txt  
    ---- spec  
    ------ ReadMe.txt  
    -- SpecRunner.html

**Important Install Notes:**  
JsTestUtilities Nuget package has a dependency on Jasmine. The boot.js file that comes with Jasmine may throw the following error when you run your tests via PhantomJs from the command line:  
> phantomjs://webpage.evaluate():3   
> TypeError: 'undefined' is not an object (evaluating 'window.api.status')

### Adding Your First Test ###
In its most basic form, the JsTestUtilities library is very simple and gives you the ability to test your UI with a minimum of fuss. The following example shows a simple test written for a website's home page. Something like this might make a decent, albeit simple, smoke test in a continuous deployment (CD) scenario:

    describe("Given Home Page", function () {
      var ns;
    
      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: false,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			done();
          }
        });
      });
    
      describe("When the page is loaded", function () {
        it("Then it should display a known element", function() {
          expect(ns.$(".body-content h1").text()).toBe("Some text in your known element.");
        });
      });
    });

#### What does it all mean ####
Here's a breakdown of the above test.  

The `var ns` is just a variable to contain a reference to the global namespace of the script running within the iFrame. It will be used throughout the tests whenever referring to anything within the iFrame, i.e. code under test.
  
	  var ns;
	
The Jasmine `beforeAll` function is called to initialize the test iFrame before all tests run. `JsTests.Fixture.initialize` takes a parameter object that in this case specifies all three properties, `path`, `authenticated`, and a `callback` function. The `callback` is essential, as it sets the `ns` variable to the namespace within the iFrame, and calls the Jasmine `done` function which signals Jasmine that asynchronous behavior has completed and it may continue. The `path` option defaults to "", and the `authenticated` option defaults to false.

      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: false,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			done();
          }
        });
      });

Once the iFrame has been initialized, in this case to the home page at `path: "/"` and the namespace has been referenced, tests may be written against the content of the iFrame. Notice that `ns` prefixes calls to jQuery within the iFrame - remember, that you should be calling the JavaScript, whether you're using jQuery or not, within the namespace of the iFrame, not the namespace of your Jasmine tests in the main window.

      describe("When the page is loaded", function () {
        it("Then it should display a known element", function() {
          expect(ns.$(".body-content h1").text()).toBe("Some text in your known element.");
        });
      });

### Running Your Test ###
At the root of your test project the file SpecRunner.html was added. For the most part this is the boilerplate HTML file from Jasmine, with the additions of the references to the appropriate script files and a placeholder for your first spec file.