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
  var svgb = require('svgbuilder.js');
  var icons = require('icons.js');
  var keypad = require('./../keypadTab.js');
  var calcpad = require('./../calcpad.js');
  var vars = require('./../../variables.js');
  var variableSetBlock = {};

  // Items for selecting a device from a list.
  variableSetBlock.keyPadValue = ko.observable(0);

  // Initial settings for blocks of this type.
  variableSetBlock.defaultSettings = function() {
    // Return a new object with settings for the controller.
    return {
      data:{
        // What variable: A, B, C
        variable:'A',
        // Value
        value:0
      },
    };
  };

  variableSetBlock.configuratorOpen = function(div, block) {
    // calcpad.open(div, block);

    keypad.openTabs(div, {
      'getValue': function() { return block.controllerSettings.data.value; },
      'setValue': function(value) { block.controllerSettings.data.value = value; },
      'type':variableSetBlock,
      'block': block,
      'min':-100,
      'max':100,
      'suffix':"",
      'numArray': ["-1", "C", "+1", "-10", undefined, "+10"],
      'calcLayout': 'simple',
      'inner': `<div id='keypadDiv' class='editorDiv'>
          <select class="dropdown-comparison vars-dropdown-comparison" id="var-list">
          </select>
          <div class="dropdown-label-txt varSet-label-txt svg-clear">=
          </div>
          <div id="numeric-display" class = "numeric-display-third svg-clear" width='30px' height='80px' data-bind='text: keyPadValue'>
          </div>
          <svg id="keypadSvg" class='area' width='225px' height='200px' xmlns='http://www.w3.org/2000/svg'></svg>
      </div>`
    });

    var selObj = document.getElementById("var-list");
    vars.addOptions(selObj, block.controllerSettings.data.variable);
  };

  // Close the identity blocks and clean up hooks related to it.
  variableSetBlock.configuratorClose = function(div, block) {
    // Determine what was seleced
    var selObj = document.getElementById('var-list');
    block.controllerSettings.data.variable = vars.getSelected(selObj);
    block.updateSvg();
    //calcpad.close(div);
    keypad.closeTabs(div);
  };

  // Buid an SVG for the block that indicates the device name
  // and connection status
  variableSetBlock.svg = function(root, block) {
    var varData = block.controllerSettings.data.variable;
    var variable = icons.variable(0.9, 20, 5, varData);
    root.appendChild(variable);

    var val = block.controllerSettings.data.value;
    var num = svgb.createText('svg-clear vars-bottom-txt', 45, 71, String(val));
    num.setAttribute('text-anchor', 'middle');
    root.appendChild(num);
  };


  return variableSetBlock;
  }();
