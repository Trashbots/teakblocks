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

	var stopped = false;

	// Once the conductor system is connected to the editor,
	// it will ping the target device to determine its current state.
	// Scan the editor looking for identity blocks

	conductor.activeBits = [];

	conductor.attachToScoreEditor = function (tbe) {
		log.trace('2: attach to score editor called');
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
		log.trace('linkHeartBeat called', conductor.runningBlocks.length);
		let duration = 1000;
		var botName = dso.deviceName;
		conductor.hbTimer = 0;
		conductor.cxn.write(botName, '(m:(1 2) d:0);');

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
				//block = conductor.runningBlocks[i];
				log.trace('inside linkheartbeat loop');

				if (block !== null) {
					log.trace('inside linkheartbeat loop',block, conductor.loopCount, typeof conductor.loopCount, conductor.loopCount == 1, block.name === 'tail', block.name === 'tail' && conductor.loopCount == 1);
					if (conductor.loopCount === undefined && block.isLoopHead()) {
						conductor.loopCount = block.controllerSettings.data.duration;
						log.trace('loopCount set', conductor.loopCount, typeof conductor.loopCount);
					}

					if (block.name === 'tail' && conductor.loopCount > 1) {
						conductor.loopCount -= 1;
						//if(conductor.loopCount !== 1) {
							block = block.flowHead;
						//}
						log.trace('reached the tail, decreasing loopcount:', conductor.loopCount);
						conductor.runningBlocks[i] = block;
						log.trace('block reset back to head of for loop',block);
					} else if (block.name === 'tail' && conductor.loopCount == 1) {
						log.trace('tail and loopcount is 1');
						conductor.loopCount = undefined;
						if (block.next !== null) {
							log.trace('block.next isnt null');
							block = block.next;
							if(block.name === 'loop') {
								conductor.loopCount = block.controllerSettings.data.duration;
								conductor.runningBlocks[i] = block;
								log.trace('next loop count:', conductor.loopCount);
							}
						} else {
							log.trace('stopall has been called');
							conductor.stopAll();
						}
					}

					if (block !== null && block.name === 'loop') {
						block = block.next;
						//block.count = null;
						log.trace('block moved to next block', block);
					}


					// If this is a new block, get its duration

					if (block.name === 'print') {
						let x = conductor.getPrintVal(block.controllerSettings.data); //value
						duration = (x.toString().length + 1)* 1000; //digits * 1000
					}
					if (block.count === null || block.count === undefined || stopped) {
						log.trace(block.count === null, block.count === undefined, stopped);
						block.count = block.controllerSettings.data.duration;
						log.trace('block.count set', block.count);
						stopped = false;
						// if (block.name === 'print') {
						// 	let x = conductor.getPrintVal(block.controllerSettings.data); //value
						// 	block.count = x.toString().length; //digits
						// } else {
						// 	block.count = block.controllerSettings.data.duration;
						// }
					}

					// If it does not have a duration or it has a duration of 0
					// then set its duration to 1
					if (block.count === undefined || block.count === '0') {
						log.trace('block.count to 1');
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
						log.trace('playone() called', block.count,block);
						if (block.count > 1) {
							block.count -= 1;
						} else {
							conductor.runningBlocks[i] = block.next;
							//log.trace('end of block, pusehd to', conductor.runningBlocks[i]);
							block.count = null;
						}
					}
				}
			}
		}
		// if (block && block.name === 'print') {
		// 	let x = conductor.getPrintVal(block.controllerSettings.data); //value
		// 	let digits = x.toString().length;
		// 	conductor.hbTimer = setTimeout(function() { conductor.linkHeartBeat(); }, digits*1000);

		// 	// conductor.hbTimer = setTimeout(function() { conductor.linkHeartBeat(); }, 3000);
		// } else {
		conductor.hbTimer = setTimeout(function () { conductor.linkHeartBeat(); }, duration);
		// }
	};

	// Find all start all blocks and start them running.
	conductor.playAll = function () {
		log.trace('5: Conductor.playall');
		dots.activate('play', 5);
		conductor.runningBlocks = [];
		conductor.run = true;
		variables.resetVars();
		var blockChainIterator = conductor.tbe.forEachDiagramChain;
		blockChainIterator(function (chainStart) {
			log.trace('chainstart',chainStart);
			// Ignore chains that don't start with an identity block.
			if (chainStart.name === 'identity') {
				conductor.runningBlocks.push(chainStart.next);
				log.trace('6:',chainStart.next, ' pushed');
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
		log.trace('stop all ting:', typeof conductor.loopCount);
		conductor.runningBlocks = [];
		conductor.soundCount = 0;
		//block.count = null;
		stopped = true;
		log.trace('stop all');
		// Single step, find target and head of chain, and run the single block.
	};

	conductor.playOne = function (block) {
		//log.trace('playone called',block, block.first);
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
