/*
Copyright (c) 2016 Paul Austin - SDG

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
  // var interact = require('interact.js');
  var svgb = require('./../svgbuilder.js');
  var flowBlockHead = {};
  var flowBlockTail = {};

  // List of HTML snippets used for controller tabs.
  // flow block uses text labels for now.
  flowBlockHead.tabs= {
    // Simple interation count based for loop
    'forLoop' : 'for',
    // Loop while something is true
    'whileLoop'  : 'while',
    // Skip body if condition not true
    'ifThen'   : 'if'
  };

  // Initial setting for blocks of this type.
  flowBlockHead.defaultSettings= function() {
    // return a new object with settings for the controller.
    return {
      // And the data that goes with that editor.
      data: {count:5},
      // Indicate what controller is active. This may affect the data format.
      controller: 'forLoop'
    };
  };
  flowBlockTail.defaultSettings = flowBlockHead.defaultSettings;

  flowBlockTail.calculateEnclosedScopeDepth = function(blockTail) {
    // walk back from end of a loop to its front and determine the deepest
    // number of scopes it contains. That depth determines how far out
    // the flowBar needs to be.
    var nesting = 0;
    var maxDepth = 0;
    var b = blockTail.prev;
    // Null should not be hit.
    while ((b !== null) && (b !== blockTail.loopHead)) {
      if (b.loopHead !== null) {
        nesting += 1;
        if (nesting > maxDepth) {
          maxDepth = nesting;
        }
      } else if (b.loopTail !== null) {
        nesting -= 1;
      }
      // Walk back looking for head.
      b = b.prev;
    }
    return maxDepth;
  };

  flowBlockTail.svg = function() {
  };

  flowBlockTail.crossBlockSvg = function(block) {
    var depth = this.calculateEnclosedScopeDepth(block);
    // The tail of the loop does the flow-bar rendering.
    var left = 40 - (block.rect.left - block.loopHead.rect.left);
    var width = block.rect.right - block.loopHead.rect.left - 80;
    var radius = 10;

    var scb = block.svgCrossBlock;
    if (scb !== undefined) {
      block.svgGroup.removeChild(scb);
    }

    var pb = svgb.pathBuilder;
    var pathd = '';
    pathd =  pb.move(left, 0);
    pathd += pb.arc(radius, 90, 0, 1, radius, (-radius * (depth + 1)));
    pathd += pb.hline(width - (2 * radius));
    pathd += pb.arc(radius, 90, 0, 1, radius, (radius  * (depth + 1)));
    scb = svgb.createPath('loop-region svg-clear', pathd);
    block.svgGroup.insertBefore(scb, block.svgRect);
    block.svgCrossBlock = scb;
  };

  return {flowBlockHead:flowBlockHead, flowBlockTail:flowBlockTail};
}();
