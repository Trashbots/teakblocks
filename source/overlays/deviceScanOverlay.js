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

// An overlay to see log messages and communications
// between the app and the robot.
module.exports = function () {
  var interact = require('interact.js');
  var fastr = require('fastr.js');
  var tbot = require('tbot.js');
  var icons = require('icons.js');
  var svgb = require('svgbuilder.js');
  var cxn = require('./../cxn.js');
  var overlays = require('./overlays.js');
  var deviceScanOverlay = {};
  var dso = deviceScanOverlay;


  const fullThreshold = (75+100)/2;
  const threeQuartersThreshold = (50+75)/2;
  const halfThreshold = (25+50)/2;
  const oneQuarterThreshold = (25)/2;

  dso.nonName = "-?-";
  dso.tbots = {};
  dso.deviceName = dso.nonName;

  dso.selectDevice = function(newBotName) {
    // Move the selected name into the object.
    if (typeof newBotName === 'string') {
      dso.updateScreenName(newBotName);
    }
  };


  dso.getBattery = function() {
    let percent = cxn.batteryPercent;
    /*if (dso.deviceName === dso.nonName)
    {
      return ""
    }
    else */if (percent > fullThreshold) {
      return fastr.batteryFull;
    } else if (percent > threeQuartersThreshold) {
      return fastr.batteryThreeQuarters;
    } else if (percent > halfThreshold) {
      return fastr.batteryHalf;
    } else if (percent > oneQuarterThreshold) {
      return fastr.batteryOneQuarter;
    } else {
      return fastr.batteryEmpty;
    }
  };


  dso.updateScreenName = function(botName) {
    console.log("update name", botName)
    dso.deviceName = botName;
    dso.disconnectButton.disabled = (dso.deviceName === dso.nonName);
    // console.log(dso.decoratedName())
    // console.log(cxn.versionNumber)
    //dso.deviceName = "vegat"
    if (cxn.versionNumber >= 11 && dso.deviceName !== dso.nonName) {
      dso.deviceNameLabel.innerHTML = fastr.robot;
      dso.deviceNameLabel.setAttribute('x', dso.robotOnlyPos);
      dso.batteryLabel.innerHTML = dso.getBattery();
      dso.actualNameLabel.innerHTML = dso.deviceName;
    } else {
      dso.deviceNameLabel.innerHTML = fastr.robot + ' ' + dso.deviceName;
      dso.deviceNameLabel.setAttribute('x', dso.robotAndTextPos);
      if(dso.batteryLabel != null){
        dso.batteryLabel.innerHTML = null;
        dso.batteryLabel = null;
      }
      if(dso.actualNameLabel != null){
        dso.actualNameLabel.innerHTML = null;
        dso.actualNameLabel = null;
      }

	}
	if (dso.deviceName !== dso.nonName) {
		cxn.botName = dso.deviceName;
	} else {
		cxn.botName = null;
	}
    //console.log(dso.deviceNameLabel.innerHTML)
  };

  dso.updateLabel = function() {
    dso.scanButton.innerHTML  = (cxn.scanning) ? (
        'Searching for ' + fastr.robot
    ) : (
        'Search for ' + fastr.robot
    );
  };

  dso.defaultSettings = function() {
    // Return a new object with settings for the controller.
    return {
      data:{
        // What triggers this chain, mouse click, button, message,...
        start:'click',
        // Device name
        deviceName:dso.nonName,
        // Connection mechanism
        bus:'ble',
      },
      // Indicate what controller isx active. This may affect the data format.
      controller:'target-bt',
      status:0,
    };
  };

  dso.initTestVars = function(e) {
    dso.testKeyTCount = 0;
    dso.testKeyCCount = 0;
    dso.testBotsShowing = false;
  }

  dso.testButton = function(e) {
    if (e.pageX < 60 && e.pageY < 200 && !dso.testBotsShowing) {
      dso.testBotsShowing = true;
      dso.addTestBots();
    } else if (e.pageX < 60 && e.pageY > 250) {
      dso.testBotsShowing = false;
      dso.removeAllBots();
    }
  };

  dso.addTestBots = function() {
    console.log("Adding test bots");
    var testNames = ['CUPUR', 'CAPAZ', 'FELIX', 'SADOW', 'NATAN', 'GATON', 'FUTOL', 'BATON', 'FILON', 'CAPON'];
    for (var i in testNames) {
      dso.addNewBlock(testNames[i], 0, icons.t55);
    }
    dso.testBotsShowing = true;
  };

  dso.removeAllBots = function() {
    console.log("Removing all bots");
    dso.tbots = {};
    dso.svg.removeChild(dso.tbotGroup);
    dso.tbotGroup = dso.svg.appendChild(svgb.createGroup('', 0, 0));
    dso.testBotsShowing = false;
  };

  dso.keyEvent = function(e) {
    if (e.key === 'T') {
      if (dso.testBotsShowing === false) {
        dso.testKeyTCount +=1;
      }
    } else if (e.key === 'C') {
      dso.testKeyCCount += 1;
    } else {
      dso.testKeyTCount = dso.testKeyCCount = 0;
    }
    if (dso.testKeyTCount > 3) {
      dso.addTestBots();
      dso.testKeyTCount = dso.testKeyCCount = 0;
    } else if (dso.testKeyCCount > 3) {
      dso.removeAllBots();
      dso.testKeyTCount = dso.testKeyCCount = 0;
    }
  };

  // External function for putting it all together.
  dso.start = function () {
    document.body.addEventListener('keydown', dso.keyEvent, false);

    // Construct the DOM for the overlay.
    overlays.insertHTML(`
        <div id='dsoOverlay'>
            <div id='dsoSvgShell' class='dso-list-box-shell'>
              <svg id='dsoSVG' class= 'dso-svg-backgound' width='100%' height='100%' xmlns="http://www.w3.org/2000/svg"></svg>
            </div>
            <div class='dso-botton-bar'>
                <button id='dsoScan' class='fa fas dso-button'>
                LABEL SET BASED ON STATE
                </button>
                <button id='dsoDisconnect' class='fa fas dso-button' style='float:right'>
                Disconnect
                </button>
            </div>
        </div>`);

    dso.svg = document.getElementById('dsoSVG');
    dso.background = svgb.createRect('dso-svg-backgound', 0, 0, 20, 20, 0);
    var backgroundGroup = dso.svg.appendChild(svgb.createGroup('', 0, 0));
    backgroundGroup.appendChild(dso.background);

    dso.tbotGroup = dso.svg.appendChild(svgb.createGroup('', 0, 0));

    // build the visuals list
    for (var t in dso.tbots) {
      dso.tbots[t].buildSvg(dso.svg);
    }

    dso.scanButton = document.getElementById('dsoScan');
    dso.scanButton.onclick = dso.onScanButton;
    dso.disconnectButton = document.getElementById('dsoDisconnect');
    dso.disconnectButton.onclick = dso.onDisconnectButton;

    // Backdoor way to change hold duration.
    dso.saveHold = interact.debug().defaultOptions._holdDuration;
    interact.debug().defaultOptions._holdDuration = 2000;
    dso.interact = interact('.dso-svg-backgound', {context:dso.svg})
      .on('hold', function(e) { dso.testButton(e); } );
    dso.deviceNameLabel = document.getElementById('device-name-label');
    dso.batteryLabel = document.getElementById('battery-label');
    dso.actualNameLabel = document.getElementById('actual-name-label');
    if (!cxn.isBLESupported()) {
      dso.sorryCantDoIt();
    }

    if (!cxn.scanUsesHostDialog()) {
      dso.watch = cxn.connectionChanged.subscribe(dso.refreshList);
      cxn.startScanning();
    }

    dso.updateLabel();
    dso.updateScreenName(dso.deviceName);

    // setup dragging
    dso.initDragScroll(dso.svg);

    dso.initTestVars();
  };

  dso.initDragScroll = function() {
    var shell = document.getElementById("dsoSvgShell");
    var svg = document.getElementById("dsoSVG");
    dso.pos = {top: 0, left: 0, x: 0, y: 0};
    dso.pointerDown = false;
    interact('.dso-svg-backgound')
      .on('down', function (event) {
        dso.pointerDown = true;
        dso.pos = {
          left: shell.scrollLeft,
          top: shell.scrollTop,
          x: event.clientX,
          y: event.clientY,
        }
      })
      .on('move', function (event) {
        if (dso.pointerDown) {
          var dx = event.clientX - dso.pos.x;
          var dy = event.clientY - dso.pos.y;
          shell.scrollTop = dso.pos.top - dy;
        }
      })
      .on('up', function (event) {
        dso.pointerDown = false;
      });
  }

  dso.sorryCantDoIt = function() {
    var tb = new tbot.Class(dso.tbotGroup, 100, 20, '-----', icons.sad55);
    dso.tbotGroup = dso.svg.appendChild(svgb.createGroup('', 0, 0));
    var message = 'Cannot access Bluetooth (BLE)';
    dso.tbotGroup.appendChild(svgb.createText('svg-clear tbot-device-name', 450, 95, message));
  };

  dso.nextLocation = function(i) {
    let w = dso.columns;
    let row = Math.floor(i / w);
    let col = i % w;
    return {x: 20 + (col * 150), y:20 + (row * 150)};
  };

  // calculates min height of svg based on number of bots needed to be displayed
  dso.updateSVGHeight = function() {
    var num = Object.keys(dso.tbots).length;
    var height = 20 + Math.ceil(num / dso.columns) * 150;
    document.getElementById('dsoSVG').style.height = height + 'px';
  };

  dso.pauseResume = function(active) {
    //log.trace('pause-resume', active, '************************************');
  };

  dso.resize = function() {
    // Ran in to problems using HTML layout (via flex layout) so
    // just forcing it right now. Many of these numbers could be
    // calculated.
    var overlay = document.getElementById('dsoOverlay');
    dso.w = overlay.clientWidth;
    dso.h = overlay.clientHeight;
    var svgHeight = (dso.h - 95) + 'px';
    document.getElementById('dsoSvgShell').style.height = svgHeight;

    svgb.resizeRect(dso.background, dso.w, dso.h);

    dso.columns = Math.floor((dso.w - 40) / 150);
    var i = 0;
    for (var t in dso.tbots) {
      var loc = dso.nextLocation(i);
      i += 1;
      var tb = dso.tbots[t];
      tb.setLocation(loc.x, loc.y);
    }
    // sets height of tbots
    dso.updateSVGHeight();
  };

  // Close the overlay.
  dso.exit = function() {
    console.log("exit");

    document.body.removeEventListener('keydown', dso.keyEvent, false);

    interact.debug().defaultOptions._holdDuration = dso.saveHold;

    for (var t in dso.tbots) {
      dso.tbots[t].releaseSvg();
    }
    dso.testBotsShowing = false;
    dso.svg = null;
    dso.background = null;
    dso.tbotGroup = null;

    // if (cxn.scanning) {
    //   console.log("cxn.scanning");
    //   cxn.stopScanning();
    //   dso.watch.dispose();
    //   dso.watch = null;
    // } else {
    //   console.log("not cxn.scanning");
    // }

    var botName = dso.deviceName;
    var message = '(vs)';
    cxn.write(botName, message);
  };

  dso.tryConnect = function(tb) {
    console.log("tryconnect", tb);
    if (cxn.scanUsesHostDialog()) {
      console.log("trycon1");
      // In Host dialog mode (used on browsers) a direct connection
      // can be made, so just bring up the host scan. That will
      // disconnect any current as well.
      dso.onScanButton();
    } else if (!tb.selected) {
      console.log("trycon2");
      // Right now only one connection is allowed
      //tb.setConnectionStatus(cxn.statusEnum.CONNECTING);
      cxn.disconnectAll();
      cxn.connect(tb.name);
      dso.selectDevice(tb.name);
    } else {
      console.log("trycon3");
      // Just clear this one
      // Only one is connected so use the main button.
      cxn.disconnectAll();
    }
  };

  dso.onScanButton = function(e) {
    if (cxn.scanUsesHostDialog()) {
      if (cxn.scanning) {
        console.log("onScanButton1")
        cxn.stopScanning();
        dso.watch.dispose();
        dso.watch = null;
      } else {
        console.log("onScanButton2")
        dso.onDisconnectButton();
        dso.refreshList(cxn.devices);
        dso.watch = cxn.connectionChanged.subscribe(dso.refreshList);
        console.log(cxn.devices);
        cxn.startScanning();
      }
    }
  };

  dso.onDisconnectButton = function() {
      cxn.disconnectAll();
  };

  dso.addNewBlock = function(key, status, face) {
    var loc = dso.nextLocation(Object.keys(dso.tbots).length);
    var tb = new tbot.Class(dso.tbotGroup, loc.x, loc.y, key, face);
    tb.onclick = function() { dso.tryConnect(tb); };
    tb.setConnectionStatus(status);
    dso.tbots[key] = tb;
    dso.updateSVGHeight()
    return tb;
  };

  // refreshList() -- rebuilds the UI list based on devices the
  // connection manager knows about.
  dso.refreshList = function (bots) {
    console.log("refreshList");
    var cxnSelectedBot = dso.nonName;
    for (var key in bots) {
      let status = bots[key].status;
      var tb = dso.tbots[key];
      if (tb !== undefined) {
        tb.setConnectionStatus(status);
      } else {
        tb = dso.addNewBlock(key, status, icons.smile55);
      }
      if (status === cxn.statusEnum.CONNECTED) {
          cxnSelectedBot = key;
      }
    }
    dso.updateLabel();
    dso.updateScreenName(cxnSelectedBot);
  };

  return dso;
}();
