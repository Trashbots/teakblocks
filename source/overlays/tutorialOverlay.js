
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

// Drive mode overlay allows users to diretly control the motors and other IO.
module.exports = function(){

  var tutorialOverlay = {};

  var editStyle = require('editStyle.js');
  var app = require('./../appMain.js');
  var tbe = app.tbe;
  var overlays = require('./overlays.js');
  var dots = require('./actionDots.js');

  app.isShowingTutorial = false;

  function TutorialPage(name, titleText, aboutText) {
    return {
      "name": name,
      "titleText": titleText,
      "aboutText": aboutText
    }
  }

  var tutorialPages = [
    TutorialPage('intro-page',
      'TBlocks Tutorial - Introduction',
      'Welcome to the tutorial for TBlocks!'),
    TutorialPage('play-dot-page',
      'TBlocks Tutorial - Play Button',
      'This is the play button.'),
    TutorialPage('stop-dot-page',
      'TBlocks Tutorial - Stop Button',
      'This is the stop button.'),
    TutorialPage('driveOverlay-dot-page',
      'TBlocks Tutorial - Drive Button',
      'This is the drive button.'),
    TutorialPage('debugOverlay-dot-page',
      'TBlocks Tutorial - Debug Button',
      'This is the debug button.'),
    TutorialPage('pages-dot-page',
      'TBlocks Tutorial - Pages Button',
      'This is the pages button.'),
    TutorialPage('edit-dot-page',
      'TBlocks Tutorial - Edit Button',
      'This is the edit button.'),
    TutorialPage('calibrate-dot-page',
      'TBlocks Tutorial - Calibrate Button',
      'This is the calibrate button.'),
    TutorialPage('tutorialOverlay-dot-page',
      'TBlocks Tutorial - Tutorial Button',
      'This is the tutorial button.'),
    TutorialPage('deviceScanOverlay-dot-page',
      'TBlocks Tutorial - Device Scan Button',
      'This is the device scan button.'),
    TutorialPage('start-palette-page',
      'TBlocks Tutorial - Start Palette',
      'This is the start palette.'),
    TutorialPage('action-palette-page',
      'TBlocks Tutorial - Action Palette',
      'This is the action palette.'),
    TutorialPage('control-palette-page',
      'TBlocks Tutorial - Control Palette',
      'This is the control palette.')
  ];

  var curPageIndex = 0;

  // External function for putting it all together.
  tutorialOverlay.start = function () {
    app.isShowingTutorial = true;

    overlays.insertHTML(`
        <style id='tutorial-text-id'>
          tutorial-text { font-size:18px; }
        </style>
        <div id='tutorialOverlay'>
            <div id='tutorialDialog'>
              <p id="tutorial-title" class='tutorial-title'></p>
              <p id = 'tutorial-about' class='tutorial-body tutorial-text'></p>
              <br>
            <div align='center'>
                <button id='tutorial-prev' class='tutorial-button tutorial-text'>Previous Page</button>
                <button id='tutorial-next' class='tutorial-button tutorial-text'>Next page</button>
                <button id='tutorial-skip' class='tutorial-button tutorial-text'>Skip tutorial</button>
            </div>
            <br>
            </div>
        </div>`);


    // Step to next tutorial page
    var prevButton = document.getElementById('tutorial-prev');
    prevButton.onclick = tutorialOverlay.prevTutorial;

    // Step to next tutorial page
    var nextButton = document.getElementById('tutorial-next');
    nextButton.onclick = tutorialOverlay.nextTutorial;

    // Exit simply go back to editor.
    var skipButton = document.getElementById('tutorial-skip');
    skipButton.onclick = tutorialOverlay.skipTutorial;

    tutorialOverlay.showTutorialPage(0);
    tutorialOverlay.deactivateAllButtons();
  };

  tutorialOverlay.resize = function() {
    var overlay = document.getElementById('tutorialOverlay');
    var w = overlay.clientWidth;
    var h = overlay.clientHeight;
    var scale = editStyle.calcSreenScale(w, h);

    var fs = (20 * scale) + 'px';
    var elts = document.getElementsByClassName("tutorial-text");
    var i=0;
    for(i = 0; i < elts.length; i++) {
      elts[i].style.fontSize = fs;
    }

    var bh = (50 * scale) + 'px';
    elts = document.getElementsByClassName("tutorial-button");
    for(i = 0; i < elts.length; i++) {
      elts[i].style.height = bh;
    }
  };

  tutorialOverlay.prevTutorial = function() {
    // console.log("prevTutorial");
    tutorialOverlay.showTutorialPage(curPageIndex - 1);
  }

  tutorialOverlay.nextTutorial = function() {
    // console.log("nextTutorial");
    tutorialOverlay.showTutorialPage(curPageIndex + 1);
  }

  tutorialOverlay.showTutorialPage = function(index) {
    console.log("showing page " + index);
    curPageIndex = index;

    var page = tutorialPages[curPageIndex];


    // change text of tutorial page
    var tutorialTitle = document.getElementById("tutorial-title");
    var tutorialAbout = document.getElementById("tutorial-about");
    tutorialTitle.innerHTML = page.titleText;
    tutorialTitle.innerHTML += " (" + (curPageIndex + 1) + "/" + tutorialPages.length + ")";
    tutorialAbout.innerHTML = page.aboutText;

    var tutorialOverlayHTML = document.getElementById("tutorialOverlay");
    // if tutorial page for dot, highlight the dot
    tutorialOverlay.deactivateAllButtons();
    if (page.name.includes("-dot-")) {
      var dotName = page.name.substring(0, page.name.indexOf("-"));
      // console.log("Dot page", dotName);
      dots.commandDots[dotName].activate(3);
    }

    if (page.name.includes("-palette-")) {
      var paletteName = page.name.substring(0, page.name.indexOf("-"));
      // console.log("Palette page", paletteName);
      // tbe.showTabGroup(paletteName);
      // tbe.switchTabs(paletteName)
  		tbe.switchTabsTutorial(paletteName);
      // show background
      tutorialOverlayHTML.style.backgroundColor = "transparent";
    } else {
      // hide background
      tutorialOverlayHTML.style.backgroundColor = "";
    }

    // enable/disable prev/next buttons
    var prevButton = document.getElementById('tutorial-prev');
    var nextButton = document.getElementById('tutorial-next');
    prevButton.disabled = (index == 0);
    nextButton.disabled = (index == tutorialPages.length - 1);
  }

  tutorialOverlay.deactivateAllButtons = function() {
    for (let val of Object.values(dots.commandDots)) {
      val.activate(0);
    }
  }

  // tutorialOverlay.highlightTab = function(group) {
  //   var tab = tbe.tabGroups[group];
  //   console.log(tab);
  //   tbe.dropArea = tab;
  //   tbe.dropAreaGroup.appendChild(tab);
  //   tbe.showTabGroup(group);
  // }

  tutorialOverlay.skipTutorial = function() {
    console.log("skipTutorial");
    tutorialOverlay.deactivateAllButtons();
    overlays.hideOverlay(null);
  }

  tutorialOverlay.exit = function () {
    app.isShowingTutorial = false;
  };

  tutorialOverlay.showLaunchAboutBox = function() {
    var value = app.storage.getItem('teakBlockShowAboutBox');
    return (value === null) || (value === true);
  };

  return tutorialOverlay;
}();
