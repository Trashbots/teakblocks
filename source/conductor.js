/* eslint-disable max-depth */
/* eslint-disable complexity */
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
 
const { exit } = require('./overlays/driveOverlay.js');
 
module.exports = function () {
    var log = require('log.js');
    var conductor = {};
    var dso = require('./overlays/deviceScanOverlay.js');
    var dots = require('./overlays/actionDots.js');
    var cxn = require('./cxn.js');
    var variables = require('./variables.js');
 
    conductor.cxn = require('./cxn.js');
    conductor.tbe = null;
    conductor.hbTimer = 0;
    conductor.sensorTimer = 0;
    conductor.runningBlocks = [];
    conductor.count = null;
    conductor.defaultPix = '0000000000';
    conductor.run = false;
    conductor.soundCount = 0;
    
    //AMAN: Nested for loop additions
    var nested_loop_counts = [];
    var nested_loop_blocks = {};
    var stopped = false;
    var nest_completed = false; 
    var nest_exists = false;
	var loop_exists = false;

    // Once the conductor system is connected to the editor,
    // it will ping the target device to determine its current state.
    // Scan the editor looking for identity blocks
 
    conductor.activeBits = [];
 
    conductor.attachToScoreEditor = function (tbe) {
        conductor.tbe = tbe;
        conductor.linkHeartBeat();
        conductor.cxn.connectionChanged.subscribe(conductor.updateIndentityBlocks);
    };
 
    // If there is a change in connections update the indentity blocks
    // TODO this linkage is very much a bit of a hack.
    conductor.updateIndentityBlocks = function () {
        log.trace('update identity blocks');
        var blockChainIterator = conductor.tbe.forEachDiagramChain;
        blockChainIterator(function (chainStart) {
            if (chainStart.name.startsWith('identity')) {
                var botName = dso.deviceName;
                var status = conductor.cxn.connectionStatus(botName);
                if (status === conductor.cxn.statusEnum.BEACON) {
                    // Try to connect ot it.
                    conductor.cxn.connect(botName);
                }
                chainStart.updateSvg();
            }
        });
    };
 
    conductor.linkHeartBeat = function () {
        //log.trace('linkHeartBeat called', conductor.runningBlocks.length);
        let duration = 1000;
        var botName = dso.deviceName;
        conductor.hbTimer = 0;
        conductor.cxn.write(botName, '(m:(1 2) d:0);');
        var nested = false;
 
        // Set all of the blocks to a regular state.
        conductor.tbe.forEachDiagramBlock(function (b) {
            b.svgRect.classList.remove('running-block');
        });
 
        if(dso.deviceName != undefined && dso.batteryLabel != null){
            //console.log("YP", dso.deviceName);
            //dso.updateScreenName();
        }
 
        if (conductor.runningBlocks.length > 0) {
            for (var i = 0; i < conductor.runningBlocks.length; i++) {
                var block = conductor.runningBlocks[i];
                if (block !== null) {
                    log.trace('2. Iterate through each block:', block);
                    
                                         // ---- LOOP ----  //

                    if (conductor.loopCount === undefined && block.isLoopHead()) {
                        log.trace('2a. Block is a Loop');
                        if(!nest_completed) {
                            // Update loops count array
                            for(var a in nested_loop_blocks) {
                                //don't want the innermost loop to be included in this loop unless theres only one loop
                                if(nested_loop_counts.length === 1 || nested_loop_blocks[a] === block && a != (nested_loop_counts.length - 1)) {
                                    --nested_loop_counts[a];

                                    if(a === 0) {
                                        for(var a = 1; a < nested_loop_counts.length; ++a) {
                                            nested_loop_counts[a] = parseInt(nested_loop_blocks[a].controllerSettings.data.duration);
                                            //++nested_loop_counts[a];
                                        }
                                    }

                                    var condition = (nested_loop_counts[a] === 0 && a != 0);

                                    if(condition && block.flowTail.next !== null && block.flowTail.next.name !== 'tail') {
                                        block = block.flowTail.next;
                                        conductor.runningBlocks[i] = block; 
                                        //nested = true;

                                        while(nested_loop_counts[a] === 0 && a != 0) {
                                            //--nested_loop_counts[a-1]; DONT DECREMENT
                                            nested_loop_counts[a] = parseInt(nested_loop_blocks[a].controllerSettings.data.duration) + 1;
                                            //++nested_loop_counts[a];
                                            a = a - 1;
                                        }
                                        
                                    }

                                    else {
                                        //possibly == not ===
                                        while(nested_loop_counts[a] === 0 && a != 0) {
                                            --nested_loop_counts[a-1];
                                            nested_loop_counts[a] = parseInt(nested_loop_blocks[a].controllerSettings.data.duration) + 1;
                                            //++nested_loop_counts[a];
                                            a = a - 1;
                                        }

                                        if(condition && nested_loop_counts[0] !== 0) {
                                            //block = nested_loop_blocks[a + 1].next;
                                            block = nested_loop_blocks[a].next;
                                            conductor.runningBlocks[i] = block; 
                                            nested = true;
                                            log.trace('chosen block due to conidition', block);
                                        }
                                    } 

                                    log.trace('2a i. Nested loop counts array updated', nested_loop_counts);
                                    break;
                                }
                            } 
                        }

                        if(block.name !== 'tail' && block.name !== 'loop') {
                            log.trace('Break');
                            break;
                        }
                        
                        else if(nested_loop_counts[0] <= 0 && nest_exists) {
                            log.trace('2a ii. Outermost loop is at 0.');
                            nest_completed = true;
                            nested = true;
                            block = nested_loop_blocks[0].flowTail.next;
                            conductor.helper(block);
                            conductor.runningBlocks[i] = block; 
                        }

						//end of non nested loop
						else if(nested_loop_counts[0] === 0 && !nest_exists) {
							conductor.helper(block);
							nested = true;
						}

						// on the inner most loop
						else if(Object.values(nested_loop_blocks)[Object.keys(nested_loop_blocks).length-1]  === block) {
							log.trace('2a iii. Loop block is the innermost loop');
                            conductor.loopCount = block.controllerSettings.data.duration; 
                            log.trace('loopCount set', conductor.loopCount, typeof conductor.loopCount);
						}

                        //run next block
						else if(block.next.name !== 'loop') {
							block = block.next;
                            conductor.runningBlocks[i] = block;
						}
                        
                        else {
                            block = block.next;
                            conductor.runningBlocks[i] = block;
                            log.trace('nested for loops, the chosen loop is:', block);
  
                            //if next loop block is the innermost
                            if(nested_loop_blocks[nested_loop_counts-1] === block) {
                                conductor.loopCount = block.controllerSettings.data.duration; 
                                log.trace('loopCount set', conductor.loopCount, typeof conductor.loopCount);
                            }

                            else {
                                nested = true;
                            }
                        }
                    } 
                                             // --- TAIL ---
                    
                    if(block !== null) {
                        //tail - block - tail
                        if(block.name === 'tail' && conductor.loopCount === undefined && nest_exists) {
                            log.trace('TAIL: tail-block-tail');
                            var temp_count = -1;
                            for(var a in nested_loop_blocks) {
                                if(nested_loop_blocks[a] === block) {
                                    temp_count = nested_loop_counts[a];
                                }
                            } 
                            
                            if(temp_count == 0) {
                                block = block.next; //on purpose
                                conductor.runningBlocks[i] = block;
                                nested = true;
                                nest_completed = true;
                                nest_exists = false;
                            }

                            else {
                                block = block.flowHead;
                                conductor.runningBlocks[i] = block;
                                log.trace('tail of outer loop arrived, block is now:', block);
                                nested = true;
                            }
                        }

                        else if (block.name === 'tail' && conductor.loopCount > 1) {
                            log.trace('TAIL: loopcount > 1');
                            conductor.loopCount -= 1;
                            log.trace('reached the tail, decreasing loopcount:', conductor.loopCount);
                            block = block.flowHead;
                            conductor.runningBlocks[i] = block;
                            log.trace('block reset back to head of for loop',block);

                            for(var a in nested_loop_blocks) {
                                if(nested_loop_blocks[a] === block) {
                                    --nested_loop_counts[a];
                                    log.trace('Nested loop counts INNER LOOP updated', nested_loop_counts);
                                    break;
                                }
                            } 

                        } else if (block.name === 'tail' && conductor.loopCount == 1) {
                            log.trace('TAIL: loopcount == 1', nest_exists);
                            conductor.loopCount = undefined;                            
                            if (block.next !== null) {
                                block = block.next;
                                if(block.name === 'loop') {
                                    log.trace('BACK TO BACK FOR LOOPS');
                                    conductor.helper(block);
                                    nested = true;
                                    conductor.runningBlocks[i] = block;
                                    log.trace('next loop count:', conductor.loopCount);
                                }
        
                                else if(block.name === 'tail') {
                                    for(var a in nested_loop_blocks) {
                                        if(nested_loop_blocks[a] === block.prev.flowHead) {
                                            nested_loop_counts[a] = block.prev.flowHead.controllerSettings.data.duration;
                                            log.trace('Nested loop counts INNER LOOP reset:', nested_loop_counts);
                                            break;
                                        }
                                    } 
                                    block = block.flowHead;
                                    //block = nested_loop_blocks[0];
                                    conductor.runningBlocks[i] = block;
                                    conductor.loopCount = undefined;
                                    log.trace('tail of inner loop arrived, block is now:', block);
                                    nested = true;
                                }

                                else {
                                    for(var a in nested_loop_blocks) {
                                        if(nested_loop_blocks[a] === block.prev.flowHead) {
                                            nested_loop_counts[a] = block.prev.flowHead.controllerSettings.data.duration;
                                            log.trace('Nested loop counts INNER LOOP reset:', nested_loop_counts);
                                            break;
                                        }
                                    } 

                                    if(nested_loop_counts.length === 1) {
                                        conductor.helper(block);
                                    }

                                    conductor.runningBlocks[i] = block;
                                }
                            } else {
                                conductor.stopAll();
                            }
                        }
                    }

                    //executing single block
                    if(!nested && !nest_completed) {
                        if (block !== null && block.name === 'loop') {
                            block = block.next;
                        }
    
                        // If this is a new block, get its duration
    
                        if (block.name === 'print') {
                            let x = conductor.getPrintVal(block.controllerSettings.data); //value
                            duration = (x.toString().length + 1)* 1000; //digits * 1000
                        }
                        if (block.count === null || block.count === undefined || stopped) {
                            block.count = block.controllerSettings.data.duration;
                            stopped = false;
                            // if (block.name === 'print') {
                            //  let x = conductor.getPrintVal(block.controllerSettings.data); //value
                            //  block.count = x.toString().length; //digits
                            // } else {
                            //  block.count = block.controllerSettings.data.duration;
                            // }
                        }
                        
    
                        // If it does not have a duration or it has a duration of 0
                        // then set its duration to 1
                        if (block.count === undefined || block.count === '0') {
                            block.count = 1;
                        }
    
                        if (block !== null) {
                            log.trace('checking block count:', block.count);
                            block.count = parseInt(block.count, 10);
    
                            // Mark the current block as running
                            var id = block.first;
                            if (id.name.startsWith('identity')) {
                                block.moveToFront();
                                block.svgRect.classList.add('running-block');
                            }
    
    
                            // If the block has not played for its entire duration,
                            // continue playing the block.
                            // Otherwise, get the next block ready and set count to null.
                            conductor.playOne(block);
                            if (block.count > 1) {
                                block.count -= 1;
                            } else {
                                conductor.runningBlocks[i] = block.next;
                                block.count = null;
                            }
                        }
                    }
 
                    nested = false;
                }
            }
        }
        // if (block && block.name === 'print') {
        //  let x = conductor.getPrintVal(block.controllerSettings.data); //value
        //  let digits = x.toString().length;
        //  conductor.hbTimer = setTimeout(function() { conductor.linkHeartBeat(); }, digits*1000);
 
        //  // conductor.hbTimer = setTimeout(function() { conductor.linkHeartBeat(); }, 3000);
        // } else {
        conductor.hbTimer = setTimeout(function () { conductor.linkHeartBeat(); }, duration);
        // }
    };
 
	conductor.helper = function (block) {
        nested_loop_counts = [];
        nested_loop_blocks = [];
		loop_exists = false;
        //find 'nearest' loop to block
		while(block !== null) {
			if(block.name === 'loop') {
				loop_exists = true;
				break;
			}
			block = block.next;
		}

		if(loop_exists) {
			var j = 0;
			nested_loop_counts[j] = block.controllerSettings.data.duration;
			nested_loop_blocks[j] = block;
			var block_tail = block.flowTail;
			block = block.next;
			while(block !== block_tail) {
				if(block.name === 'loop') {
					++j;
					nested_loop_counts[j] = block.controllerSettings.data.duration;
					nested_loop_blocks[j] = block;
				}
				block = block.next;
			}

            //increment each value in loop counts so its one more than loop val.
			for(var x = 0; x < nested_loop_counts.length; ++x) {
				++nested_loop_counts[x];
			}

			log.trace('1a. Nested for loop array initiated:', nested_loop_counts);
			log.trace('1b. Nested for loop array #2 initiated:', nested_loop_blocks);
			nest_completed = false;
			nest_exists = (nested_loop_counts.length > 1);
		}
        
        else {
            nest_exists = false;
            nest_completed = false;
        }
	}
    // Find all start all blocks and start them running.
    conductor.playAll = function () {
        nest_exists = false;
        dots.activate('play', 5);
        conductor.runningBlocks = [];
        conductor.run = true;
        variables.resetVars();
        var blockChainIterator = conductor.tbe.forEachDiagramChain;
        blockChainIterator(function (chainStart) {
            // Ignore chains that don't start with an identity block.
            if (chainStart.name === 'identity') {
                conductor.runningBlocks.push(chainStart.next);
                var block = chainStart.next;
                conductor.helper(block);
            } else if (chainStart.name === 'identityAccelerometer' || chainStart.name === 'identityButton' || chainStart.name === 'identityTemperature') {
                //chainStart.controllerSettings.data.run = "yes";
                cxn.buttonA = null;
                cxn.buttonB = null;
                cxn.buttonAB = null;
                conductor.checkSensorIdentity(chainStart);
            }
        });
    };
 
    conductor.satisfiesStart = function (val, block, error) {
        var blockValue = parseInt(block.controllerSettings.data.value, 10);
        if (block.controllerSettings.data.comparison === '<') {
            return val < blockValue;
        } else if (block.controllerSettings.data.comparison === '>') {
            return val > blockValue;
        } else if (block.controllerSettings.data.comparison === '=') {
            if (val === blockValue) {
                return true;
            } else if (val + error > blockValue && val - error < blockValue) {
                return true;
            }
            return false;
        }
        return null;
    };
 
    conductor.runningBlockIsNotInChain = function (block) {
        while (block !== null) {
            if (block.svgRect.classList.contains('running-block')) {
                return false;
            }
            block = block.next;
        }
        return true;
    };
 
    conductor.checkSensorIdentity = function (block) {
        conductor.sensorTimer = 0;
        var data = block.controllerSettings.data;
        //conductor.cxn.write(dso.deviceName, '(sensor);');
        if (conductor.run) {
            if (block.name === 'identityAccelerometer' && cxn.accelerometer !== null) {
                var accel = cxn.accelerometer;
                console.log("Accelerometer", accel);
                if (conductor.satisfiesStart(accel, block, 5) && conductor.runningBlockIsNotInChain(block)) {
                    conductor.runningBlocks.push(block.next);
                }
            } else if (block.name === 'identityTemperature' && cxn.temperature !== null) {
                var temp = cxn.temperature;
                console.log("Temperature", temp);
                if (conductor.satisfiesStart(temp, block, 0)) {
                    conductor.runningBlocks.push(block.next);
                }
            } else if (block.name === 'identityButton') {
                //console.log(data.button);
                if (data.button === 'A' && cxn.buttonA) {
                    conductor.runningBlocks.push(block.next);
                    cxn.buttonA = null;
                } else if (data.button === 'B' && cxn.buttonB) {
                    conductor.runningBlocks.push(block.next);
                    cxn.buttonB = null;
                } else if (data.button === 'A+B' && cxn.buttonAB) {
                    conductor.runningBlocks.push(block.next);
                    cxn.buttonAB = null;
                }
            }
        }
        conductor.sensorTimer = setTimeout(function () { conductor.checkSensorIdentity(block); }, 50);
    };
 
    // Stop all running chains.
    conductor.stopAll = function () {
        //AMAN loop additions
        nested_loop_counts = [];
        nested_loop_blocks = {};
        stopped = false;
        nest_completed = false; 
        nest_exists = false;
        loop_exists = false;

        dots.activate('play', 0);
        var blockChainIterator = conductor.tbe.forEachDiagramChain;
        var botName = '';
        var message = '(m:(1 2) d:0);';
        var message2 = '(px:' + conductor.defaultPix + ');';
        conductor.run = false;
        blockChainIterator(function (chainStart) {
            chainStart.svgRect.classList.remove('running-block');
            // Ignore chains that don't start with an identity block.
            if (chainStart.name.startsWith('identity')) {
                botName = dso.deviceName;
                conductor.cxn.write(botName, message);
                conductor.cxn.write(botName, message2);
            }
        });
        conductor.count = null;
        conductor.loopCount = undefined;
        conductor.runningBlocks = [];
        conductor.soundCount = 0;
        //block.count = null;
        stopped = true;
        log.trace('stop all');
        // Single step, find target and head of chain, and run the single block.
    };
 
    conductor.playOne = function (block) {
        var first = block.first;
 
        if (first.name.startsWith('identity')) {
            var botName = dso.deviceName;
            var message = '';
            var d = block.controllerSettings.data;
            if (block.name === 'picture') {
                var imageData = d.pix;
                var pixStr = conductor.packPix(imageData);
                message = '(px:' + pixStr + ':' + 1 + ');';
            } else if (block.name === 'servo') {
                message = '(sr:' + 50 + ');';
            } else if (block.name === 'motor') {
                message = '(m:' + d.motor + ' d:' + -d.speed + ' b:' + d.duration + ');';
            } else if (block.name === 'twoMotor') {
                message = '(m:(1 2) d:' + -d.speed + ');'; // +' b:' + d.duration
            } else if (block.name === 'sound') {
                //log.trace('11: sound');
                // pass the Solfege index
                message = '(nt:' + d.s.split(" ")[conductor.soundCount] + ');';
                if (conductor.soundCount === d.duration - 1) {
                    conductor.soundCount = 0;
                } else {
                    conductor.soundCount += 1;
                }
                //console.log('message', message);
            } else if (block.name === 'wait') {
                message = '';
            } else if (block.name === 'variableSet') {
                variables.set(d.variable, d.value);
            } else if (block.name === 'variableAdd') {
                // Decrement is done with negative numbers.
                variables.func(d.variable, '+', d.value);
            } else if (block.name === 'print') {
                var val = conductor.getPrintVal(d);
                message = '(pr:' + val + ');';
            }
            conductor.cxn.write(botName, message);
        }
        // variables.printVars();
        // Single step, find target and head of chain and run the single block.
    };
 
    conductor.getPrintVal = function (d) {
        var val = 0;
        if (d.print === 'var') {
            console.log('var------');
            val = variables.get(d.variable);
        } else if (d.print === 'sensor') {
            console.log('sensor------');
            if (d.sensor === 'accelerometer') {
                val = cxn.accelerometer;
            } else if (d.sensor === 'temperature') {
                val = cxn.temperature;
            }
        }
        //console.log('conductor print', d.print, d.variable, d.sensor, val);
        return Math.trunc(val); //truncated to an integer
    };
 
    conductor.playSingleChain = function () {
        log.trace('play single chain');
        // The conductor starts one chain (part of the score).
    };
 
    conductor.packPix = function (imageData) {
        var pixStr = '';
        for (var i = 0; i < 5; i++) {
            var value = 0;
            for (var j = 0; j < 5; j++) {
                value *= 2;
                if (imageData[(i * 5) + j] !== 0) {
                    value += 1;
                }
            }
            var str = value.toString(16);
            if (str.length === 1) {
                str = '0' + str;
            }
            pixStr += str;
        }
        return pixStr;
    };
    return conductor;
}();
 

