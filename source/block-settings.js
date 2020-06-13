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

module.exports = function () {
  var ko = require('knockout');
  var tbe = require('./teakblocks.js');
  var conductor = require('./conductor.js');

  var moveUp = 0;

  // Bindable properties
  var blockSettings = {
    visible: ko.observable(true),
    activeBlock:null
  };

  blockSettings.insert = function(domRoot) {
    // Create a div shell that will be positioned and scaled as needed.
    blockSettings.commonDiv = document.createElement("div");
    blockSettings.commonDiv.innerHTML =
    `<div id="block-settings" class="block-config-form">
      <div class="group-div">
        <button class="block-run width-third">
          <i class="fa fa-step-forward" aria-hidden="true"></i>
        </button>
        <button class="block-clone width-third">
          <i class="fa fa-clone" aria-hidden="true"></i>
        </button>
        <button class="block-clear width-third">
          <i class="fa fa-trash-o" aria-hidden="true"></i>
        </button>
      </div>
      <div id="block-settings-custom"></div>
      <div id="block-controller-tabs"></div>
    </div>`;
    blockSettings.commonDiv.style.width= '240px';
//    blockSettings.commonDiv.style.pointerEvents = 'all';
    domRoot.appendChild(blockSettings.commonDiv);

    blockSettings.groupDiv = document.createElement("div");
    blockSettings.groupDiv.innerHTML =
    `<div id="block-settings" class="block-config-form">
      <div class="group-div">
        <button class="block-run width-third">
          <i class="fa fa-step-forward" aria-hidden="true"></i>
        </button>
        <button class="block-clone width-third">
          <i class="fa fa-clone" aria-hidden="true"></i>
        </button>
        <button class="block-clear width-third">
          <i class="fa fa-trash-o" aria-hidden="true"></i>
        </button>
      </div>
    </div>`;
    blockSettings.groupDiv.style.width= '240px';
//    blockSettings.groupDiv.style.pointerEvents = 'all';
    domRoot.appendChild(blockSettings.groupDiv);

    for(var i = 0; i < 2; i++){ // To process through commonDiv and groupDiv
      document.getElementsByClassName('block-run')[i].onclick = function() {
        conductor.playOne(blockSettings.activeBlock);
      };
      document.getElementsByClassName('block-clone')[i].onclick = blockSettings.cloneGroup;
      document.getElementsByClassName('block-clear')[i].onclick = blockSettings.deleteGroup;
    }

    // Get a reference to the div that is customized for each block.
    blockSettings.customDiv = document.getElementById('block-settings-custom');

    // Get a reference to the div that lists controllers.
    blockSettings.controllersDiv = document.getElementById('block-controller-tabs');//TABS - uncomment
  };

  blockSettings.cloneGroup = function() {
    // TODO grab whole loop if necessary
    if (blockSettings.activeBlock !== null) {
      // Back up start if necessary for clone to be logical.
      var startBlock = tbe.findChunkStart(blockSettings.activeBlock);
      if (startBlock.isLoopTail()) {
        // Redirect logive to look a loop beginning
        startBlock = startBlock.flowHead;
      }
      // Extend end if necessary for clone to be logical.
      var endBlock = startBlock;
      if (endBlock.isLoopHead()) {
        endBlock = endBlock.flowTail;
      }
      if(startBlock.isGroupSelected()){
        endBlock = startBlock.selectionEnd();
      }
      var clone = tbe.replicateChunk(startBlock, endBlock, 0, 0);
      // move it to some open space
      // TODO use more logic to find a good place to put the block.
      var dy = 0;
      if(moveUp === 0){
        dy = -120;
        moveUp = dy;
      } else if(moveUp < 0){
        dy = -40 + moveUp;
        moveUp = dy;
      } else if(moveUp > 0){
        dy = 40 + moveUp;
        moveUp = dy;
      }
      if (clone.top < -dy) {
        dy = 120;
        moveUp = dy;
      } else if(clone.bottom > tbe.height - moveUp - 80){
        dy = 120;
        moveUp = dy;
      }
      tbe.animateMove(clone, clone.last, 0, dy, 20);
    }
  };

  blockSettings.deleteGroup = function() {
    if (blockSettings.activeBlock === null)
      return;

    // TODO grab whole loop if necessary
    // Delete the block.
    var block1 = tbe.findChunkStart(blockSettings.activeBlock);
    if (block1.isLoopTail()) {
      // Redirect logive to look a loop beginning
      block1 = block1.flowHead;
    }
    if (block1.isLoopHead() && block1.next === block1.flowTail) {
      // Delete an empty loop.
      tbe.deleteChunk(block1, block1.next);
    } else if (block1.isLoopHead() && !block1.next.isSelected()) {
      // Delete a loop, but leave the interior intact
      tbe.deleteChunk(block1.flowTail, block1.flowTail);
      tbe.deleteChunk(block1, block1);
    } else if (block1.isLoopHead() && block1.next.isSelected()) {
      // Delete a loop including the interior blocks
      tbe.deleteChunk(block1, block1.flowTail);
    } else {
      // If the block is part of a selected chain, find the last block in the chain
      tbe.deleteChunk(block1, block1.selectionEnd());
    }
  };


  blockSettings.isOpen = function() {
      return (this.activeBlock !== null);
  };

  blockSettings.hide = function(exceptBlock) {

    var isSelectedGroup = false;
    var block = this.activeBlock;

    if(block !== null && block.isGroupSelected()){
      if(!block.isIsolatedLoop()){
        isSelectedGroup = true;
      }
    }

    // If the form is actually associated with a block, hide it.
    if (block !== null && block !== exceptBlock) {
      if (block.funcs.configuratorClose !== undefined) {
        block.funcs.configuratorClose(this.customDiv, block);
        // TODO too aggresive, but works
      }
      this.activeBlock = null;

      var div = null;

      // Start animation to hide the form.
      if(isSelectedGroup){
        div = this.groupDiv;
      } else {
        div = this.commonDiv;
      }
      div.style.transition = 'all 0.2s ease';
      div.style.position = 'absolute';
      div.style.transform = 'scale(0.33, 0.0)';

      // Clear out the custom part of the form.
      this.customDiv.innerHTML = '';

      this.tabNames = [];
      this.tabButtons = [];
    }
  };

  // A block has been tapped on, the gesture for the config page.
  // Bring it up, toggle it, or move it as apppropriate.
  blockSettings.tap = function(block) {
    if (this.activeBlock === block) {
      // Clicked on the same block so make it go away.
      tbe.clearStates();
    } else if (this.activeBlock !== null) {
      // Clicked on a block other than the one that is showing.
      // Make the block that is showing go away,
      // then show the new one once the hide transition is done.
      tbe.clearStates();
      this.activeBlock = block;
      if(block.name === 'tail'){
        block.markSelected(true);
        block.flowHead.markSelected(true);
      } else if(block.name === 'loop'){
        block.markSelected(true);
        block.flowTail.markSelected(true);
      } else {
        block.markSelected(true);
      }
      setTimeout(function() { blockSettings.showActive(); }, 400);
//      this.addEventListener(this.showActive, 500);
    } else {
      // Nothing is showing, so make it pop-up.
      //block.markSelected(true);
      if(block.name === 'tail'){
        block.markSelected(true);
        block.flowHead.markSelected(true);
      } else if(block.name === 'loop'){
        block.markSelected(true);
        block.flowTail.markSelected(true);
      } else {
        block.markSelected(true);
      }
      this.activeBlock = block;
      this.showActive(null);
    }
  };

  // Build the row of tabs one for each controller editor that can be used
  // by the actor.
  blockSettings.buildControllerTabs = function() {
    // Clear out old tabs.
    blockSettings.controllersDiv.innerHTML = '';//TABS - uncomment

    // Get the list of tabs with HTML snippets.
    var tabs = this.activeBlock.funcs.tabs;
    this.tabButtons = [];
    if (tabs !== undefined) {
      this.tabNames = Object.keys(tabs);

      // Build some SOM for the buttons.
      var tabCount = this.tabNames.length;
      var tabsDiv = document.createElement('div');
      var width = (100 / tabCount) + '%';

      for (var i = 0; i < tabCount; i++) {
        // Create the button.
        var button = document.createElement('button');
        var name = this.tabNames[i];
        blockSettings.tabButtons.push(button);
        tabsDiv.appendChild(button);//TABS - uncomment

        // Configure all its settings.
        button.id = name;
        button.className = 'block-settings-tab';
        button.style.width = width;
        // Tweak the curved edges based on position.
        if (i===0) {
          button.style.borderRadius='0px 0px 0px 10px';
        } else if (i === (tabCount-1)) {
          button.style.borderRadius='0px 0px 10px 0px';
        } else {
          button.style.borderRadius='0px';
        }

        // Inject the HTML snippet.
        button.innerHTML = tabs[name];
        button.onclick = blockSettings.onClickTab;
      }
      // Add the row of tabs to the view.
      this.controllersDiv.appendChild(tabsDiv);//TABS - uncomment

      // Select the initial tab.
      this.selectActiveTab(this.activeBlock.controllerSettings.controller);
    } else {
      // Add controller tabs at the bottom.
      var controllers = this.activeBlock.funcs.controllers;
      if (typeof controllers === "function") {
        // OLD way, delete once other code is merged.
        controllers(blockSettings.controllersDiv);//TABS - uncomment
      } else {
        blockSettings.controllersDiv.innerHTML = '';//TABS - uncomment
      }
    }
  };

  blockSettings.onClickTab = function() {
    // Since its DOM event, 'this' will be the button.
    blockSettings.selectActiveTab(this.id);
  };

  blockSettings.selectActiveTab = function(name) {
    var count = this.tabNames.length;
    for ( var i = 0; i < count; i++) {
      if (this.tabNames[i] === name) {
        this.tabButtons[i].classList.add('tab-selected');
      } else {
        this.tabButtons[i].classList.remove('tab-selected');
      }
    }
  };

  // Build the middle from part, the controllers editor.
  blockSettings.buildController = function() {
    // Allow block to customize bottom part of form.
    var configuratorOpen = this.activeBlock.funcs.configuratorOpen;
    if (typeof configuratorOpen === "function") {
      configuratorOpen(blockSettings.customDiv, this.activeBlock);
    } else {
      blockSettings.customDiv.innerHTML =
      `<div>
          <label><input type="checkbox">
            <span class="label-text">Power</span>
          </label>
      </div>`;
    }
  };

  // Internal method to show the form.
  blockSettings.showActive = function (event) {
    var isSelectedGroup = false;
    var tweakx = 0;
    var tweaky = 0;
    var block = this.activeBlock;

    if (block === null) {
      return; // Nothing to show.
    }

    if (block !== null && block.isGroupSelected()) {
      if (!block.isIsolatedLoop()) {
        isSelectedGroup = true;
      }
    }
    this.buildControllerTabs();
    this.buildController();

    // Start animation to show settings form.
    var x = block.left;
    var y = block.bottom;
    var div = null;
    if (isSelectedGroup) {
      div = blockSettings.groupDiv;
    } else {
      div = blockSettings.commonDiv;
    }

    // Note after animation sizes are not so obvious. clientHeight
    // is unchanged, use it.
    var settingsHeight = div.clientHeight;

    if (tbe.height > 450) {
      // For screens large enough center the form above or beneath the selected group
      if (x-80 < 0) {
        tweakx = 85-x;
      } else if(x+160 > tbe.width){
        tweakx = tbe.width - (x+165);
      }

      if (y+settingsHeight > tbe.height) {
        // Move the from above the selection.
        // If it is agroup selection then much less room is needed.
        tweaky = -settingsHeight -10 - block.height;
      }
    } else {
      // For smaller screens move it to left or right
      // TODO manage long short window, like those on broswers
      if ((x + 60) < (tbe.width / 2)) {
        x = tbe.width - 175;
      } else {
        x = 100;
      }
      y = 65;
    }

    div.style.transition = 'all 0.0s ease';
    div.style.left = ((x-80) + tweakx) + 'px';
    div.style.right = ((x+80) + tweakx) + 'px';
    div.style.top = ((y+5) + tweaky) + 'px';
    // Second step has to be done in callback in order to allow
    // animation to work.
    setTimeout(function() {
      div.style.transition = 'all 0.2s ease';
      div.style.position = 'absolute';
      div.style.transform = 'scale(1.0, 1.0)';
    }, 10);
  };


  return blockSettings;
}();
