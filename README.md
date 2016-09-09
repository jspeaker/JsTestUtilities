# [iOnTech.JsTestUtilities](https://www.nuget.org/packages/iOnTech.JsTestUtilities/) #

JsTestUtilities is a library by [iOnTech](http://www.iontech.org) (Jim Speaker) that allows running a web application in an iFrame while Jasmine runs in the main window and exercises both integration and unit tests against the actual web application. This provides a solution to a number of different problems with testing web user interfaces with [Jasmine](http://jasmine.github.io/2.0/introduction.html). This solution, as stated, is to allow Jasmine to be used for both unit tests and full integration tests, as well as more basic UI tests. In my opinion, it's ability to fully test a web application from the UI level while properly handling the asynchronous nature of modern web applications (e.g. Ajax) renders [Selenium](http://www.seleniumhq.org/) obsolete. 

Without doing a little bit of Spies setup magic in the JsTest.Utilities.Extension.js file, tests will run as end-to-end integration tests. I'll get into how to fairly simply set up Spies to mock out external dependencies and make your tests run as non-integrated [TDD](https://en.wikipedia.org/wiki/Test-driven_development)/[BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) tests later, along with other more advanced topics.

### Problems solved:   ###
1. Fixtures are a fixed-in-time HTML representation of a user-interface component and get out of sync with the actual views, typically generated views, in a web application. Running Jasmine tests against fixtures is brittle in that when the actual view code changes, and the fixture is not updated accordingly, the test(s) may pass while the production code is actually broken because of the view changes, i.e. false positives.
2. Generating fixtures dynamically is complex and laborious. Some view engines, such as [Spark](https://github.com/SparkViewEngine), provide access to internals which allow rendering the HTML that would be generated at runtime and saving that HTML as Jasmine fixtures. While this approach does solve the fixed-in-time issue with static HTML files, as stated it is laborious and rather complex. Additionally, generating HTML fixtures is of limited usefulness as the static HTML does not accommodate testing the web application's ability to communicate properly via Ajax, etc.
3. Testing the UI in its entirety, however deeply you find useful, is now a reality. It is possible with this approach to re-size the UI iFrame within the browser or [PhantomJS](http://phantomjs.org/) headless browser and test the responsiveness of your application. Because the web application is running, and test assertions are running against the current state of the actual user interface, assertions can be made about the UI elements' current state of display, positioning, etc.

## Getting Started ##
It is recommended that you create a separate project for your Jasmine tests. Of course, we would not want to mix up our test code with our application code. E.g.:  

 - MyApplication  
    -- Controllers  
    -- Views  
    -- (etc)  
 - JsTests.Integration.MyApplication  

### Installation ###

#### Prerequisites ####
If you are planning to run your tests during Continuous Integration (CI), which I highly encourage, or even more awesomely, in your Continuous Delivery (CD) work flow, then you will need to install:
**[PhantomJS](http://phantomjs.org/)**

`PM> Install-Package PhantomJS`

I'm currently running version 1.9.8. I cannot vouch for compatibility with the latest version, 2.1.1 at the time of this writing, however I would be surprised if there are issues with later versions.

#### Nuget Package Install ####

Install the [Nuget package](https://www.nuget.org/packages/iOnTech.JsTestUtilities/) in the test project:  
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

I have included a file in a "jasmine-tweak" directory called "boot.js" that you can use to replace the boot.js file if you experience the above problem. It simply adds two lines of js that instantiate the `window.api` object.

### Adding Your First Test ###
In its most basic form, the JsTestUtilities library is very simple and gives you the ability to test your UI with a minimum of fuss. Start by adding a .js file to your spec directory. You might call it something like, home_test.js. Add the following code example which shows a simple test written for a website's home page. Something like this might make a decent, albeit simple, smoke test in a continuous deployment (CD) scenario:

    describe("Given Home Page", function () {
      var ns;
    
      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: false,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			JsTests.Spies().init();
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

**What does it all mean?**  
Here's a breakdown of the above test.  

The `var ns` is just a variable to contain a reference to the global namespace of the DOM running within the iFrame. It will be used throughout the tests whenever referring to anything within the iFrame, i.e. code under test, page elements, etc.
  
	  var ns;
	
The Jasmine `beforeAll` function is called to initialize the test iFrame before all tests run. `JsTests.Fixture.initialize` takes a parameter object that in this case specifies all three properties, `path`, `authenticated`, and a `callback` function. The `callback` is essential, as it sets the `ns` variable to the namespace within the iFrame, and calls the Jasmine `done` function which signals Jasmine that asynchronous behavior has completed and it may continue. The `path` option defaults to "", and the `authenticated` option defaults to false.  

Why `beforeAll` and not the better known `beforeEach`, you might ask? Using `beforeEach` would re-instantiate the iFrame before every test. Using `beforeAll` is a *huge* performance improvement in that it only instantiates the iFrame once before all the tests run.

      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: false,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			JsTests.Spies().init();
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

### Running Your First Test ###
At the root of your test project the file SpecRunner.html was added. For the most part this is the boilerplate HTML file from Jasmine, with the additions of the references to the appropriate script files and a placeholder for your first spec file. In SpecRunner.html replace the commented out script tag,   
	`<!-- <script type="text/javascript" src="spec/[my-test].js"></script> -->`  
with an uncommented script tag that points to your new spec file.  
	`<script type="text/javascript" src="spec/home_test.js"></script>`

Last, but not least, you'll want to make sure that your tests are accessible and have access to your web application. This is a very important point, and this is *my recommendation*, though certainly not the only solution: set up your test project as a virtual directory (vdir) of your web application *only in development and test environments.* The reason it needs to be a vdir of the application is *browser security*. The main window needs to have script access to the iFrame, thus, it must be part of the web application.

Once you've set up the virtual directory, simply navigate to the specrunner.html file in your favorite web browser. In this example I'm aliasing my vdir as "jstests", thus:  
*http://127.0.0.1/jstests/specrunner.html*

>As a side note, in my Continuous Deployment process I am using Octopus Deploy with the IIS6+ Home Directory feature to discretely deploy my JavaScript test projects from my private Nuget feed as virtual directories of the application web sites, and only executing those process steps in lower environments. Subsequent TeamCity steps run and verify the Jasmine tests, and if successful, another step then calls to Octopus Deploy to promote the release to the next environment.

**Important Note**  
Your deployment process, whatever it may be, should **never set up a virtual directory that points to the Jasmine tests**, nor should it even deploy the Jasmine tests, **in production environments**.



## Advanced Topics: Extending JsTestUtilities ##

**JsTest.Utilities.Extensions.js** has been provided to extend the base functionality in a number of different ways and is *intended to be customized for your purposes.*

### Spies ###
`JsTests.Spies` is provided to allow setting up Jasmine Spies on script that is running within your iFrame. By calling `JsTests.Spies().init()` within your iFrame initialization callback function you can Spy on script that is within the iFrame namespace.

      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: false,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			JsTests.Spies().init();
			done();
          }
        });
      });

Setting up the Spies is only slightly more interesting than the usual means of setting up Jasmine Spies. Within the `JsTests.Spies` object's `init` function, specify Jasmine spies within the iFrame namespace. 

A primary example is the need to Spy on script/objects within your web application so that assertions can be made related to the calls, parameters and state of those objects. The trick is to ensure that Spies on said objects always return the same instance of the object. Then, you can Spy on the methods of that object instance:  

	var fooControllerInstance = new ns.MyApplication.FooController();
	...
	spyOn(ns.MyApplication, "FooController").and.returnValue(fooControllerInstance);
	spyOn(fooControllerInstance, "doStuff").and.callThrough();


Another example that is important is mocking out external dependencies. Let's say your application integrates with Facebook and you don't want your application to call Facebook while being tested, but it's important to test that not only the calls have been made, but that callbacks are executed, state is set properly, etc. You can override the behavior of the pertinent methods and call through. 
	
    ns.FB = {
      getLoginStatus: function (callback) {
        callback && callback({ status: "connected" });
      },
      ui: function (options, callback) {
        callback && callback({});
      },
      init: function (options, callback) {
        callback && callback({});
      }
    };

    spyOn(ns.FB, "getLoginStatus").and.callThrough();
    spyOn(ns.FB, "ui").and.callThrough();
    spyOn(ns.FB, "init").and.callThrough();


Another excellent example is a web application that is using geolocation to acquire positioning for a user. You certainly would not want geolocation to actually be called during tests because a) in a browser it requires user intervention to accept, and b) in PhantomJs (headless browser) geolocation is not supported. Thus, `navigator.geolocation` can be overridden:

    ns.navigator.geolocation = {
      watchPosition: function () { },
      clearWatch: function () { }
    }

### Authentication ###
Most web applications employ authentication and authorization of one flavor or another. JsTestUtilities address authentication via Forms authentication. Because it is JavaScript, of course, Kerberos based authentication such as Windows authentication or ADFS authentication *is not addressed* by JsTestUtilities. It does appear that, while PhantomJS does not support NTLM/Kerberos authentication out of the box, that there is a way to implement it using PhantomJS 2.0.x. Given that, I will be looking into updating JsTestUtilities to support this.

In order to accommodate Forms authentication JsTest.Utilities.Extensions.js contains the stub of an object call `JsTests.Account` which contains a `login` and `logout` function that accept a callback. The particulars of your system being unknown, of course, there was not a one-size-fits-all solution that could be put in place, thus the stub with the extension file.

Let's look at an example of how `login` and `logout` might be implemented. In the `login` function a reference to the iFrame namespace is first acquired. In this example, the `MyApplication` object at the root may contain a `user` object, the `user` may already be `connected` and the user may be the expected test user. In this case, the user is already authenticated and the `login` function simply calls whatever callback was provided and returns. If the expected user is not already authenticated, however, then the `login` function calls `logout` to ensure that any existing sessions are indeed logged out, with a callback function that calls `login` with the appropriate test user credentials:

	  var login = function (callback) {
	    var testFrame = $(JsTests.Selectors.testFrame);
	
	    if (testFrame[0] && 
			testFrame[0].contentWindow.MyApplication.user && 
			testFrame[0].contentWindow.MyApplication.user.connected &&
			testFrame[0].contentWindow.MyApplication.user.name === "mytestuser") {
	      callback && callback();
	      return;
	    }
	
	    this.logout(function () {
		    $.ajax("/login/submit", {
		      async: true,
		      cache: false,
		      type: "POST",
		      contentType: "application/json; utf-8",
		      dataType: "html",
		      data: JSON.stringify({ name: "mytestuser", password: "password" }),
		      success: callback ? callback : function () { }
		    });
	    });
	  };
	
	  var logout = function (callback) {
		$.when(
			$.ajax("/en/logout", {
		      async: true,
		      cache: false,
		      contentType: "application/json; utf-8"
		    }))
		 .then(callback);
	  };

How does `JsTests.Account().login()` get called? The answer is: simply by adding `authenticated: true` to the init options object.

      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: true,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			JsTest.Spies().init();
			done();
          }
        });
      });

The object `JsTests.Account()` can also be referenced anywhere in your Jasmine test code in order to call `login` or `logout` as needed. I've found that when I have a Given (see [Gherkin language](https://github.com/cucumber/cucumber/wiki/Gherkin "Gherkin")) that states that the user is authenticated, I simply instantiate the iFrame with `authenticated: true`, however, and never end up calling it directly.

## Asynchronous Operations / Asynchronous Script Loading ##
One of the biggest gotchas with testing web application user interfaces is asynchronous calls and the need to wait for async scripts to load. Both situations can be addressed in the same way. Let's talk about the latter first.


### Asynchronous Script Loading ###

There are, of course, many situations where scripts are loaded asynchronously to improve page load times, among other things.

Let's take as an example a web application that is multilingual and uses the jQuery Globalization plug-in. The Globalization library, as a whole, is *huge*. Thus, the model is that when a page is initializing it only loads the necessary portions of the library based on the current culture. This is all done async, of course, to prevent blocking execution. 

Let's say in my application I have a function that initialize the globalization, and my application is concerned with the proper internationalization (globalization) of numbers, currency, dates, plurals, dates and times:

    var language = MyApplication.Culture.language;

    $.when(
        $.getJSON("/scripts/globalization/cldr/main/" + language + "/numbers.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/numberingSystems.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/currencyData.json"),
        $.getJSON("/scripts/globalization/cldr/main/" + language + "/currencies.json"),
        $.getJSON("/scripts/globalization/cldr/main/" + language + "/ca-gregorian.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/plurals.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/ordinals.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/timeData.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/weekData.json"),
        $.getJSON("/scripts/globalization/cldr/supplemental/likelySubtags.json")
      )
      .then(function () {
        return [].slice.apply(arguments, [0]).map(function (result) {
          return result[0];
        });
      })
      .then(Globalize.load)
      .then(
        function () {
          Globalize(language);
          Globalize.locale(language);
          $(document).trigger("globalization-script-loaded");
        }
      );

Notice that the last asynchronous thing that is executed by the final `.then` call is a custom event trigger:  

   	$(document).trigger("globalization-script-loaded");

In my event handling bootstrapper for the application I have an event handler set for this event that sets a ScriptState property to `true` to signify that it has been initialized:  

    $(document).on("globalization-script-loaded", function () {
      MyApplication.ScriptState.globalization = true;
    });

*It could easily be argued that this is muddying up my production code with test code. Tracking the state of asynchronous script loading like this is actually very useful to my application and is used by the production code.*

By setting this `ScriptState` object, the test code now has something that it can examine and `waitFor` the asynchronous completion before executing tests. Also, notice that the Jasmine `done` callback is simply being handed to the `waitFor` method as a callback:

      beforeAll(function (done) {
        JsTests.Fixture.initialize({
          path: "/",
          authenticated: false,
          callback: function () {
            ns = JsTests.Fixture.namespace();
			JsTests.Spies().init();
			JsTests.waitFor("globalization", ns.MyApplication.ScriptState, done);
          }
        });
      });

### Asynchronous Operations ###

Asynchronous Operations are typically Ajax calls in a modern web application. So, for purposes of documentation, I'll focus solely on Ajax.

In the same way that we triggered a custom event in the case of asynchronous script loading, we can trigger a custom event in the case of an Ajax call completion. We'll take as an example an application that allows the user to manage alerts, so the user interface allows the user to do the usual CRUD operations. We'll look at the create operation which is implemented via an Ajax call. Within the submit handler script for the create call we'll simply set the `MyApplication.ScriptState.alertsLoaded` boolean to false before we make the call, in case it's been called previously, then make the Ajax call and set the boolean to true when it completes:
	
	MyApplication.ScriptState.alertsLoaded = false;
	
	$.ajax("/alert/create", {
	  async: true,
	  cache: false,
	  type: "POST",
	  contentType: "application/json; utf-8",
	  dataType: "json",
	  data: JSON.stringify(data),
	  success: function (result) {
			$(document).trigger("alerts-loaded", [result]);
		},
	  error: function (xhr) {
			// handle error
		}
	});

And, in your event handling bootstrapper set up an event handler for the custom event `alerts-loaded`:

	var handleAlertsLoaded = function (e, result) {
		// do stuff with the result data that your application needs to do
		// and set the alertsLoaded boolean to true
		MyApplication.ScriptState.alertsLoaded = true;
	};
	$(document).on("alerts-loaded", handleAlertsLoaded);


*Again, it can easily be argued that this is muddying up my production code with test code. Tracking the state of asynchronous operations like this is actually very useful to my application and is used by the production code.*


## Other Tips and Tricks ##

### More Fun with Async ###

`JsTests.waitFor` is a simple function that is available to you in your tests whenever you need to wait for something to complete before proceeding. The function takes three parameters: the `propertyName` (string), the `scriptStateObject` (object), and the `callback` (function). The specified property of the `scriptStateObject` is evaluated for truthiness until it is truthy, at which point the callback is executed. The `scriptStateObject[propertyName]` can exist in either the iFrame namespace, which is what this was designed for, or if you find it useful could certainly also be in the main window namespace. Just be sure to reference the iFrame namespace if that is your intent. And, remember, the real awesomeness in Jasmine is the native `done` function that signals Jasmine that async stuff has completed and it's okay to continue processing.

	beforeEach(function (done) {
		var ns = JsTests.Fixture.namespace();
	
		JsTests.waitFor('fooProperty', ns.MyApplication.BazObject, function (done) { 
			doAllTheThings();
			done();
		});
	});

### Console Logging ###

JsTest.Utilities.js contains a `JsTests.verbosity` property which is set to 2 (information) by default. This property is used JsTestUtilities to determine how verbosely to write to the JavaScript console. Feel free to set it to 0 (errors only), 1 (errors and warnings) or 2 (errors, warnings and information) as you see fit. 

`JsTests.Console` can be used within your tests, as well, and is useful for outputting information to the console while having control over the verbosity of it. It's just a simple singleton (self-instantiating) wrapper object that exposes three methods:

	JsTests.Console.information(message)
	JsTests.Console.warning(message)
	JsTests.Console.error(message)

Of course, the tests should only be run in lower environments, and only logs to the console in the context of test runs, so the verbosity doesn't have any impact on your application.

### Ajax Wrapper ###

Inevitably it may arise that you need to make an Ajax call or two from within your tests. It's sad, but it's true. In general you should make every effort to use script to click buttons, dropdown lists, focus elements, etc, in order to ensure that your application does all the things correctly to execute those calls. However, for those rare situations where it is actually necessary, a wrapper object has been provided in JsTest.Utilities.

`JsTests.Ajax` is an instance object that exposes four methods (functions):

The `get` method executes a standard jQuery Ajax GET to a URL you specify, specifies **JSON** as the result content type, and supports callback parameters for your success handler and error handler callbacks.

	JsTests.Ajax().get(url, successHandler, errorHandler)

The `post` method executes a standard jQuery Ajax POST to a URL you specify using your supplied JSON data, specifies **JSON** as the result content type, and supports callback parameters for your success handler and error handler callbacks.

	JsTests.Ajax().post(url, data, successHandler, errorHandler)


The `submit` method is much like the `post` method, except that it requires an additional `method` parameter that makes it flexible in that it can excercise any of the standard HTTP methods `["GET" | "POST" | "PUT" | "DELETE" ]` The method then executes a standard jQuery Ajax call with your specified method to a URL you specify using your supplied JSON data, specifies **JSON** as the result content type, and supports callback parameters for your success handler and error handler callbacks.

	JsTests.Ajax().submit(url, method, data, successHandler, errorHandler)

The `postJsonForHtml` method executes a standard jQuery Ajax POST to a URL you specify using your supplied JSON data, specifies **HTML** as the result content type, and supports callback parameters for your success handler and error handler callbacks.

	JsTests.Ajax().postJsonForHtml(url, data, successHandler, errorHandler)

## References ##

[Jasmine 2.0](http://jasmine.github.io/2.0/introduction.html)  
[Gherkin](https://github.com/cucumber/cucumber/wiki/Gherkin)  
[PhantomJS](http://phantomjs.org/)