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
  var svgb = require('svgbuilder.js');
  var identityButtonBlock = {};
  var icons = require('icons.js');

  // Initial settings for blocks of this type.
  identityButtonBlock.defaultSettings = function() {
    // Return a new object with settings for the controller.
    return {
      data:{
        // What comparison: A, B, A+B
        button:'A'
        // Value
        //value:0,
      },
    };
  };

  identityButtonBlock.configuratorOpen = function(div, block) {
    identityButtonBlock.activeBlock = block;
    div.innerHTML =
      `<div class='editorDiv'>
          <div class="dropdown-label-txt svg-clear idButton-comparison-label">button:
          </div>
          <select class="dropdown-comparison idButton-comparison" id="dropdown-comparison">
            <option value="A" id="idButton-A">A</option>
            <option value="B" id="idButton-B">B</option>
            <option value="A+B" id="idButton-AB">A+B</option>
          </select>
      </div>`;

    // Connect the dataBinding.
    var drop = document.getElementById("dropdown-comparison");
    var opts = drop.options;
    for (var i = 0; i < opts.length; i++) {
      if (opts[i].value === block.controllerSettings.data.button) {
        drop.selectedIndex = i;
        break;
      }
    }
  };

  // Close the identity blocks and clean up hooks related to it.
  identityButtonBlock.configuratorClose = function(div, block) {
    var comparison = document.getElementById('dropdown-comparison');
    var index = comparison.selectedIndex;
    block.controllerSettings.data.button = comparison.options[index].value;
    identityButtonBlock.activeBlock = null;
    block.updateSvg();
  };

  // Buid an SVG for the block that indicates the device name
  // and connection status
  identityButtonBlock.svg = function(root, block) {
    var button = icons.button(1, '', 15, 10);
    root.appendChild(button);

    var data = block.controllerSettings.data.button;
    var txt = svgb.createText('svg-clear block-idButton-label', 40, 40, data);
    txt.setAttribute('text-anchor', 'middle');
    root.appendChild(txt);
  };

  return identityButtonBlock;
  }();
