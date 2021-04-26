
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

  var tutorialData = require('./tutorialData.js');

  var tutorialPages = tutorialData.pages;
  var tutorialBlockPages = tutorialData.blockPages;

  app.isShowingTutorial = false;

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
                  <button id='tutorial-next' class='tutorial-button tutorial-text'>Next Page</button>
                  <button id='tutorial-end' class='tutorial-button tutorial-text'>End Tutorial</button>
              </div>
              <br>
              <p id="tutorial-block-title" class='tutorial-title'></p>
              <p id = 'tutorial-block-about' class='tutorial-body tutorial-text'></p>
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
    var endButton = document.getElementById('tutorial-end');
    endButton.onclick = tutorialOverlay.endTutorial;

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

    // resize based on tutorial page type (palette vs. non-palette)

    var root = document.getElementById('overlayRoot');
    var w = window.innerWidth;
    var h = window.innerHeight;
    var scale = editStyle.calcSreenScale(w, h);
    var baseValue = 80 * scale;
    var topOffset;
    var botOffset;
    if (tutorialPages[curPageIndex].type === "palette") {
      topOffset = 0;
      botOffset = 2 * baseValue;;
    } else {
      topOffset = baseValue;
      botOffset = 0;
    }
    var tstr = topOffset.toString() + 'px';
    var hstr = "calc(100% - " + (topOffset + botOffset).toString() + "px)";
    root.style.height = hstr;
    root.style.top = tstr;


    var dialog = document.getElementById("tutorialDialog");
    dialog.style.top = "calc(4% + " + (baseValue - topOffset).toString() + "px)";
    console.log("DIALOG", dialog.style.top);
  };

  tutorialOverlay.prevTutorial = function() {
    // console.log("prevTutorial");
    tutorialOverlay.deselectPaletteBlocks();
    tutorialOverlay.showTutorialPage(curPageIndex - 1);
  }

  tutorialOverlay.nextTutorial = function() {
    // console.log("nextTutorial");
    tutorialOverlay.deselectPaletteBlocks();
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

    //resize
    tutorialOverlay.resize();

    // if tutorial page for dot, highlight the dot
    var tutorialOverlayHTML = document.getElementById("tutorialOverlay");
    tutorialOverlay.deactivateAllButtons();
    if (page.type === "dot") {
      dots.commandDots[page.name].activate(3);
    }

    // switch tabs
    if (page.type === "palette") {
      tbe.switchTabsTutorial(page.name);
    }

    // enable/disable prev/next buttons
    var prevButton = document.getElementById('tutorial-prev');
    var nextButton = document.getElementById('tutorial-next');
    prevButton.disabled = (index == 0);
    nextButton.disabled = (index == tutorialPages.length - 1);

    // reset tutorial block page
    document.getElementById("tutorial-block-title").innerHTML = "";
    document.getElementById("tutorial-block-about").innerHTML = "";

    // default block selected
    if (page.type == "palette") {
      if (page.name == 'start') {
        tutorialOverlay.showBlockDetails(app.tbe.getPaletteBlockByName('identity'));
      } else if (page.name == 'action') {
        tutorialOverlay.showBlockDetails(app.tbe.getPaletteBlockByName('picture'));
      } else if (page.name == 'control') {
        tutorialOverlay.showBlockDetails(app.tbe.getPaletteBlockByName('wait'));
      }
    }
  }

  tutorialOverlay.deactivateAllButtons = function() {
    for (let val of Object.values(dots.commandDots)) {
      val.activate(0);
    }
  }

  tutorialOverlay.showBlockDetails = function(block) {
    console.log("showBlockDetails", block);
    var page = tutorialBlockPages[block.name];
    // update page information
    var tutorialBlockTitle = document.getElementById("tutorial-block-title");
    var tutorialBlockAbout = document.getElementById("tutorial-block-about");
    tutorialBlockTitle.innerHTML = page.titleText;
    tutorialBlockAbout.innerHTML = page.aboutText;
    // highlight only the selected block
    tutorialOverlay.deselectPaletteBlocks();
    block.svgRect.classList.add('selected-block');
    // if it is the loop block, highlight both
    if (block.name == "loop") {
      app.tbe.getPaletteBlockByName("tail").svgRect.classList.add('selected-block');
    } else if (block.name == "tail") {
      app.tbe.getPaletteBlockByName("loop").svgRect.classList.add('selected-block');
    }
  }

  tutorialOverlay.deselectPaletteBlocks = function() {
    for (let b of document.querySelectorAll(".selected-block")) {
      b.classList.remove('selected-block');
    }
  }

  tutorialOverlay.endTutorial = function() {
    console.log("endTutorial");
    app.isShowingTutorial = false;
    tutorialOverlay.deactivateAllButtons();
    tutorialOverlay.deselectPaletteBlocks();
    overlays.hideOverlay(null);
  }

  tutorialOverlay.exit = function () {
  };

  tutorialOverlay.showLaunchAboutBox = function() {
    var value = app.storage.getItem('teakBlockShowAboutBox');
    return (value === null) || (value === true);
  };

  return tutorialOverlay;
}();
