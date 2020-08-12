/*
Copyright (c) 2020 Trashbots - SDG

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

var app = require('./appMain.js');
var overlays = require('./overlays/overlays.js').init();


// Determine if page launched in broswer, or cordova/phone-gap app.
app.isRegularBrowser =
	document.URL.indexOf('http://') >= 0 ||
	document.URL.indexOf('https://') >= -0;

if (!app.isRegularBrowser) {

	// Add view port info dynamically. might help iOS WKWebview
	var meta = document.createElement('meta');
	meta.name = 'viewport';
	meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0';
	document.getElementsByTagName('head')[0].appendChild(meta);
	//<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">


	app.isCordovaApp = true;
	// Guess that it is Cordova then. Not intened to run directly from file:
	document.addEventListener('deviceready', app.start, false);
	var script = document.createElement('script');
	// Load cordova.js if not in regular browser, and then set up initialization.
	script.setAttribute('src', './cordova.js');
	document.head.appendChild(script);
} else {
	// If in regular broswer, call start directly.
	const isMobile = (/iPhone|iPad|iPod|Android/i).test(navigator.userAgent);
	if (isMobile) {
		// Build the HTML for mobile overlay without animation
		overlays.insertHTML(`
			<div id='mobileOverlay'>
				<div id='mobileDialog'>
				<h1 style = "text-align:center">You are on a mobile Device</h1>
					<div style = "text-align:center;">
						Consider using our mobile app: <a href = "https://tblocks.app.link">TBlocks</a>
					</div>
				</div>
			</div>`
		);
		var regularWebsite = document.getElementById("regularWebsite");
		regularWebsite.onclick = function () {
			overlays.currentIsClosing = true;
			document.getElementById("mobileOverlay").style.display = "none";
			overlays.overlayShell.classList.add('fullScreenSlideOut');
			app.isCordovaApp = false;
			app.start();
		};
	} else {
		app.isCordovaApp = false;
		app.start();
	}
}

