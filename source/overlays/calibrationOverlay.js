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

module.exports = function(){

  var calibrationOverlay = {};
  var editStyle = require('editStyle.js');
  var app = require('./../appMain.js');
  var overlays = require('./overlays.js');
  var cxn = require('./../cxn.js');
  var dso = require('./deviceScanOverlay.js');

  // External function for putting it all together.
  calibrationOverlay.start = function () {

    overlays.insertHTML(`
        <style id='calibration-text-id'>
          calibration-text { font-size:18px; }
        </style>
        <div id='calibrationOverlay'>
            <div id='calibrationDialog'>
              <p class='calibration-title'>Smart Steering Calibration</p>
              <p class='calibration-body calibration-text'>Click below to activate Smart Steering Calibration, a PID based system for accurate driving</p>
              <!--p id = 'calibration-copy' class='calibration-body calibration-text'>© 2020 Trashbots. All rights reserved.</p-->
              <br>
            <div id='calibration-button-area'>
                <button id='calibration-activate' class='calibration-button calibration-text'>Begin calibration!</button>
            </div>
            <br><br>
            <button id='calibration-done' class='calibration-button calibration-text'>Close.</button>
            <br>
            </div>
        </div>`);

    var caliArea = document.getElementById('calibration-button-area');

    if(cxn.connectionStatus(dso.deviceName) !== 3){
      caliArea.innerHTML = "<p style='font-style: italic;' class='calibration-body calibration-text'>Smart Steering Calibration not supported. Please connect a Trashbot.</p>";
    } else if (!(cxn.versionNumber >= 10)){
      caliArea.innerHTML = "<p style='font-style: italic;' class='calibration-body calibration-text'>Smart Steering Calibration not supported. Please update Trashbot. Refer to trashbots.co/updating-your-bot for instructions.</p>";
    } else {
      var activateButton = document.getElementById('calibration-activate');
      activateButton.onclick = calibrationOverlay.activate;
    }

    // Exit simply go back to editor.
    var exitButton = document.getElementById('calibration-done');
    exitButton.onclick = calibrationOverlay.hideAbout;

  };

  calibrationOverlay.resize = function() {
    var overlay = document.getElementById('calibrationOverlay');
    var w = overlay.clientWidth;
    var h = overlay.clientHeight;
    var scale = editStyle.calcSreenScale(w, h);

    var fs = (20 * scale) + 'px';
    var elts = document.getElementsByClassName("calibration-text");
    var i=0;
    for(i = 0; i < elts.length; i++) {
      elts[i].style.fontSize = fs;
    }

    var bh = (50 * scale) + 'px';
    elts = document.getElementsByClassName("calibration-button");
    for(i = 0; i < elts.length; i++) {
      elts[i].style.height = bh;
    }
  };

  calibrationOverlay.hideAbout = function() {
      overlays.hideOverlay(null);
  };

  calibrationOverlay.activate = function() {
    if(!cxn.calibrated){
      cxn.calibrated = true;
      var botName = dso.deviceName;
      var message = '(calibrate)';
      
      if (cxn.write(botName, message))
      {
        cxn.calibrating = true;
      }
    }
  };

  calibrationOverlay.exit = function () {
    cxn.calibrating = false;
    //overlays.hideOverlay(null);
  };

  calibrationOverlay.showLaunchAboutBox = function() {
    var value = app.storage.getItem('teakBlockShowAboutBox');
    return (value === null) || (value === true);
  };

  return calibrationOverlay;
}();
