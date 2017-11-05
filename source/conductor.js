/*
Copyright (c) 2017 Paul Austin - SDG

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
  var conductor = {};

  conductor.ble = require('./bleConnections.js');
  conductor.tbe = null;
  conductor.hbTimer = 0;
  conductor.runningBlocks = [];
  conductor.count = null;
  conductor.defaultPix = '0000000000';

  // Once the conductor system is connected to the editor,
  // it will ping the target device to determine
  // its current state.

  // Scan the editor looking for identity blocks
  // For each id block,
  // determine if it is currently connected and still responding.

  // Give some time for the animation to complete, then remove.

  conductor.activeBits = [];

  conductor.attachToScoreEditor = function(tbe) {
    console.log('attached to ', tbe);
    conductor.tbe = tbe;
    conductor.linkHeartBeat();
    conductor.ble.connectionChanged.subscribe(conductor.updateIndentiyBlocks);
  };

  // If there is a change in connections update teh indentity blocks
  // TODO this linkage is ver much a bit of a hack.
  conductor.updateIndentiyBlocks = function() {
    console.log(' updating identity blocks');
    var blockChainIterator  = conductor.tbe.forEachDiagramChain;
    blockChainIterator(function(chainStart) {
      if (chainStart.name === 'identity') {
        var botName = chainStart.controllerSettings.data.deviceName;
        var status = conductor.ble.connectionStatus(botName);
        if (status === conductor.ble.statusEnum.BEACON) {
          // Try to connect ot it.
          conductor.ble.connect(botName);
        }
        chainStart.updateSvg();
      }
    });
  };

  conductor.linkHeartBeat = function() {
    conductor.hbTimer = 0;

    // Visit all chains and see if any have changed connection states.
    // conductor.checkAllIdentityBlocks();

    // Set all of the blocks to a regular state.
    conductor.tbe.forEachDiagramBlock(function(b){
      b.svgRect.classList.remove('running-block');
    });

    if (conductor.runningBlocks.length > 0) {
      for (var i = 0; i < conductor.runningBlocks.length; i++) {
        var block = conductor.runningBlocks[i];
        if (block !== null) {
          if(conductor.loopCount === undefined && block.isLoopHead()){
            conductor.loopCount = block.controllerSettings.data.duration;
          }

          if (block.name === 'tail' && conductor.loopCount > 1) {
            block = block.flowHead;
            conductor.loopCount -= 1;
          } else if (block.name === 'tail' && conductor.loopCount === 1) {
            conductor.loopCount = undefined;
            if (block.next !== null) {
              block = block.next;
            } else {
              conductor.stopAll();
            }
          }

          if (block !== null && block.name === 'loop') {
            block = block.next;
          }
          // If this is a new block, get its duration
          if (conductor.count === null) {
            conductor.count = block.controllerSettings.data.duration;
          }

          // If it does not have a duration or it has a duration of 0
          // then set its duration to 1
          if (conductor.count === undefined || conductor.count === '0') {
            conductor.count = 1;
          }
          console.log(conductor.count);

          if (block !== null) {
            conductor.count = parseInt(conductor.count, 10);

            // Mark the current block as running
            var id = block.first;
            if (id.name === 'identity') { // && !block.isCommented()
              conductor.tbe.svg.appendChild(block.svgGroup);
              block.svgRect.classList.add('running-block');
            }

            // If the block has not played for its entire duration,
            // continue playing the block.
            // Otherwise, get the next block ready and set count to null.
            conductor.playOne(block);
            if (conductor.count > 1) {
              conductor.count -= 1;
            } else {
              conductor.runningBlocks[i] = block.next;
              conductor.count = null;
            }
          }
        }
      }
    }
    conductor.hbTimer = setTimeout(function() { conductor.linkHeartBeat(); }, 1000);
  };

  // Find all start all blocks and start them running.
  conductor.playAll = function() {
    conductor.runningBlocks = [];
    var blockChainIterator  = conductor.tbe.forEachDiagramChain;
    blockChainIterator(function(chainStart) {
      // Ignore chains that don't start with an identity block.
      if (chainStart.name === 'identity') {
        conductor.runningBlocks.push(chainStart.next);
      }
    });
  };

  // Stop all running chains.
  conductor.stopAll = function() {
    var blockChainIterator  = conductor.tbe.forEachDiagramChain;
    var botName = '';
    var message = '(m:(1 2) d:0);';
    var message2 = '(px:' + conductor.defaultPix + ');';
    blockChainIterator(function(chainStart) {
      chainStart.svgRect.classList.remove('running-block');
      // Ignore chains that don't start with an identity block.
      if (chainStart.name === 'identity') {
        botName = chainStart.controllerSettings.data.deviceName;
        conductor.ble.write(botName, message);
        conductor.ble.write(botName, message2);
      }
    });
    conductor.count = null;
    conductor.runningBlocks = [];
    console.log('stop all');
    // Single step, find target and head of chain, and run the single block.
  };

  conductor.playOne = function(block) {
    var first = block.first;

    if (first.name === 'identity') {
      var botName = first.controllerSettings.data.deviceName;
      var message = '';
      var d = block.controllerSettings.data;
      if (block.name === 'picture') {
        var imageData = d.pix;
        var pixStr = conductor.packPix(imageData);
        message = '(px:' + pixStr + ':' + 1 + ');';
      } else if (block.name === 'servo') {
        message = '(sr:' + 50 + ');';
      } else if (block.name === 'motor') {
        message = '(m:'+ d.motor + ' d:' + d.speed +' b:' + d.duration + ');';
      } else if (block.name === 'twoMotor') {
        message = '(m:(1 2) d:' + d.speed + ');'; // +' b:' + d.duration
      } else if (block.name === 'sound') {
        message = '(nt:' + d.description + ':' + 1 + ');';
      } else if (block.name === 'wait') {
        message = '';
      }
      conductor.ble.write(botName, message);
    }
    // Single step, find target and head of chain and run the single block.
  };

  conductor.playSingleChain = function() {
    console.log('play single chain');
    // The conductor starts one chain (part of the score).
  };

  conductor.packPix = function(imageData) {
    var pixStr = '';
    for (var i = 0; i < 5; i++) {
      var value = 0;
      for(var j = 0; j < 5; j++) {
        value *= 2;
        if (imageData[(i*5) + j] !== 0) {
          value += 1;
        }
      }
      var str = value.toString(16);
      if (str.length===1) {
        str = '0' + str;
      }
      pixStr += str;
    //  console.log('image in hex',value,str);
    }
    return pixStr;
  };
  return conductor;
}();
