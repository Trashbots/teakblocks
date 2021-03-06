# Teak Blocks
A web based block editor for making teak programs.


# Tools you may need
Teak Block editor is implemented in HTML5. The underlying JavaScript is bundled and compressed with [Browserify](http://browserify.org/). The tools also allows npm style package support. It is typically installed as such:

```
npm install -g browserify       // Turning npm style packages into browser js
npm install -g less             // Compiling *.less into *.css
npm install -g catw             // For build process
```
Yes, it is also based on [npm](https://www.npmjs.com/) packages and thus npm and [node](https://nodejs.org/en/) itself.

If you just want to use teakblocks in a browser. this is all you need. To build
native apps you need [Cordova](https://cordova.apache.org/) as well. Cordova is also installed with npm.

```
npm install -g cordova
npm install -g uglify-js
```

The html_app already has a few config files set up to work with Cordova however, to build for a native platform you need to install support files for the platforms. These additional files are not part of this repo, but they are easy to add. Change directories to the top of the html_app and run the Cordova commands. For android, it should look like this:

```
cd html_app
cordova platform add android
cordova plugin add cordova-plugin-ble
cordova build android
cordova run android
```

# Simple browser-only setup
For browser-only setup, run the following command:
```
npm run browser-install
```

Additionally, replace the `/html_app/www/font-awesome` folder with the `/font-awesome` folder from https://github.com/Trashbots/tblocks.


# Building and Deploying
Automation is still minimal but there are a few tools packaged as npm scripts. One nice upside to npm scripts is that they can be run from any directory in the repo's file structure. To see how the scripts work look at the `<package.json>` file.

```
npm run cpfonts4  // copy font awesome from modules to html_app (run this once)

npm run watch-css // Copies .less files (css)

npm run wify      // Run browserify with watchify

npm run http      // Run npm's http-server on the ./html_app/www directory

npm run watch-dev // Runs three above scripts (watch-css, wify, http)

npm run abuild    // Kick off Cordova/android build

npm run adeploy   // Download to tablet/phone using adb

npm run           // List these scripts.
```

When you edit JS files the bundle_tbe.js must be rebuilt before your changes will take affect. You can set up the tool [watchify](https://www.npmjs.com/package/watchify) that triggers the builds automatically. The build typically takes about a second.

Note that android development requires the Android SDK which is part of [Android Studio](https://developer.android.com/studio/index.html). The SDK must also be added to the command line path. That will look something like this:

```
# Typical path on OSX/MacOS
export PATH="/Users/user-name/Library/Android/sdk/platform-tools/:$PATH"

```

# Repository structure

Here are a few directories that make up the project.

```
source/                     // The js files in original unbundled form
html_app/www/               // Directory that works as root for http-server
html_app/www/bundled_tbe.js // Browserified js
html_app/platforms/         // Tools and generated files for cordova builds
node_modules/               // Third party JS modules pulled from npmjs.com             
```

# License

TeakBlock is published under the MIT license so you can experiment all you want,
and use what you learn.  Details are in `<license.txt>`

SDG
