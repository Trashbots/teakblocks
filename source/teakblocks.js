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
	var assert = require('assert');
	var interact = require('interact.js');
	var teakText = require('./teaktext.js');
	var svgb = require('svgbuilder.js');
	var icons = require('icons.js');
	var trashBlocks = require('./trashBlocks.js');
	var fblocks = require('./fblock-settings.js');
	var teakselection = require('./teakselection');
	var actionDots = require('./overlays/actionDots.js');
	var conductor = require('./conductor.js');
	var app = require('./appMain.js');

	var tbe = {};

	tbe.fblocks = fblocks;
	tbe.diagramBlocks = {};
	tbe.paletteBlocks = {};
	tbe.blockIdSequence = 100;
	tbe.currentDoc = 'docA';
	tbe.currentUndoIndex = 0;
	tbe.stopUndo = false;
	tbe.draggingSelectionArea = null;
	tbe.defaultBlockLoc = [40, 120];
	tbe.identityIndent = 120;

	// Visitor for each block in the diagram
	tbe.forEachDiagramBlock = function (callBack) {
		//console.log('diagram blocks', tbe.diagramBlocks);
		for (var key in tbe.diagramBlocks) {
			if (tbe.diagramBlocks.hasOwnProperty(key)) {
				var block = tbe.diagramBlocks[key];
				if (typeof block === 'object') {
					callBack(block);
				}
			}
		}
	};

	// Visitor for each block in the palette
	tbe.forEachPalette = function (callBack) {
		for (var key in tbe.paletteBlocks) {
			if (tbe.paletteBlocks.hasOwnProperty(key)) {
				var block = tbe.paletteBlocks[key];
				if (typeof block === 'object') {
					callBack(block);
				}
			}
		}
	};

	// Visitor that finds the head of each chain.
	tbe.forEachDiagramChain = function (callBack) {
		tbe.forEachDiagramBlock(function (block) {
			if (block.prev === null) {
				callBack(block);
			}
		});
	};

	// Clear any semi modal state
	tbe.clearStates = function clearStates(block) {
		// Clear any showing forms or multi step state.
		// If the user has interacted with a general part of the editor.
		if (app.isShowingTutorial) {
			return;
		}

		actionDots.reset();
		app.overlays.hideOverlay(null);
		this.components.blockSettings.hide(block);
		tbe.forEachDiagramBlock(function (b) { b.markSelected(false); });
	};

	tbe.init = function init(svg, ceiling) {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.svg = svg;
		this.svgCeiling = ceiling;
		this.background = svgb.createRect('editor-background', 0, 0, 20, 20, 0);
		this.svg.insertBefore(this.background, this.svgCeiling);
		this.configInteractions();
		interact.maxInteractions(Infinity);

		teakselection.init(tbe);

		return this;
	};

	tbe.elementToBlock = function (el) {
		var text = el.getAttribute('interact-id');
		if (text === null) {
			log.trace('svg elt had no id:', el);
			return null;
		}
		var values = text.split(':');
		//log.trace('diagramblocks!!', this.diagramBlocks, values);

		var obj = null;
		if (values[0] === 'd') {
			obj = this.diagramBlocks[text];
		} else if (values[0] === 'p') {
			obj = this.paletteBlocks[text];
		}
		if (obj === undefined) {
			obj = null;
		}
		if (obj === null) {
			log.trace('block not found, id was <', text, '>');
		}
		return obj;
	};

	tbe.clearAllBlocks = function () {
		tbe.clearStates();
		trashBlocks(tbe);
	};

	tbe.saveCurrentDoc = function () {
		var currentDocText = teakText.blocksToText(tbe.forEachDiagramChain);
		app.storage.setItem(tbe.currentDoc, currentDocText);
	};

	tbe.loadDoc = function (docName) {
		// If they are actully switching then load the new one.
		if (tbe.currentDoc !== docName) {
			tbe.clearStates();
			tbe.clearDiagramBlocks();
			tbe.currentDoc = docName;
			var loadedDocText = app.storage.getItem(docName);
			if (loadedDocText !== null) {
				//teakText.textToBlocks(tbe, loadedDocText);
				tbe.textToBlocks(docName, loadedDocText);
			}
			actionDots.setDocTitle(docName.substring(3, 4));
		}
	};

	tbe.textToBlocks = function (docName, docText){
		if (docName === null){
			docName = tbe.currentDoc;
		}
		//teakText.textToBlocks(tbe, docText);
		try{
			teakText.textToBlocks(tbe, docText);
		} catch(error) {
			var blankDoc = "()";

			tbe.clearStates();
			tbe.clearDiagramBlocks();
			app.storage.setItem(docName, blankDoc);
			teakText.textToBlocks(tbe, blankDoc);
		}
	}

	tbe.nextBlockId = function (prefix) {
		var blockId = prefix + String(tbe.blockIdSequence);
		tbe.blockIdSequence += 1;
		return blockId;
	};

	tbe.addBlock = function (x, y, name) {
		var block = new this.FunctionBlock(x, y, name);
		block.isPaletteBlock = false;
		block.interactId = tbe.nextBlockId('d:');
		if(block.name === 'loop') {
		}
		this.diagramBlocks[block.interactId] = block;
		return block;
	};

	tbe.addPaletteBlock = function (x, y, name, pgroup) {
		var block = new this.FunctionBlock(x, y, name);
		block.pgroup = pgroup;
		block.isPaletteBlock = true;
		block.interactId = tbe.nextBlockId('p:');
		this.paletteBlocks[block.interactId] = block;

		// Looks like blocks are added to main editor, so it is removed
		// then added to the palette. Odd...
		tbe.svg.removeChild(block.svgGroup);
		if (block.rect.right + 30 > tbe.width) {
			block.svgGroup.setAttribute('class', 'drag-group hiddenPaletteBlock');
		}
		tbe.tabGroups[pgroup].appendChild(block.svgGroup)

		return block;
	};

	// Delete a chunk of blocks (typically one).
	tbe.deleteChunk = function (block, endBlock) {

		// Remember any tail so it can be slid over.
		var tail = endBlock.next;
		var head = block.prev;

		// Disconnect the chunk from its surroundings.
		if (head !== null) {
			head.next = tail;
		}
		if (tail !== null) {
			tail.prev = head;
		}
		block.prev = null;
		endBlock.next = null;

		// Now that the chunk has been disconnected, measure it.
		var deleteWidth = block.chainWidth;
		var tempBlock = null;

		if ((block.flowTail === endBlock) && (!block.isGroupSelected())) {
			tbe.clearStates();
			if (block.prev !== null) {
				block.next.prev = block.prev;
			} else {
				block.next.prev = null;
			}
			block.next = null;

			if (endBlock.next !== null) {
				endBlock.prev.next = endBlock.next;
			} else {
				endBlock.prev.next = null;
			}
			endBlock.prev = null;

			delete tbe.diagramBlocks[block.interactId];

			tbe.svg.removeChild(block.svgGroup);
			block.svgGroup = null;
			block.svgRect = null;
			block.next = null;
			block.prev = null;

			delete tbe.diagramBlocks[endBlock.interactId];

			tbe.svg.removeChild(endBlock.svgGroup);
			endBlock.svgGroup = null;
			endBlock.svgRect = null;
			endBlock.next = null;
			endBlock.prev = null;
		} else {
			// Delete the chunk.
			tbe.clearStates();

			while (block !== null) {
				tempBlock = block.next; // Make a copy of block.next before it becomes null
				// Remove map entry for the block.
				delete tbe.diagramBlocks[block.interactId];

				tbe.svg.removeChild(block.svgGroup);
				block.svgGroup = null;
				block.svgRect = null;
				block.next = null;
				block.prev = null;

				block = tempBlock;
			}
		}

		// Slide any remaining blocks over to the left.
		// The links have already been fixed.
		if (tail !== null) {
			tbe.animateMove(tail, tail.last, -deleteWidth, 0, 10);
		}
	};

	tbe.deleteBlock = function () {

	};

	// Copy a chunk or the rest of the chain, and return the copy.
	// The section specified should not have links to parts outside.
	tbe.replicateChunk = function (chain, endBlock, offsetX, offsetY) {

		this.clearStates(); //???

		//log.trace('duplicating', chain,endBlock === null); //AMAN

		var stopPoint = null;
		if (endBlock !== undefined && endBlock !== null) {
			// This might be null as well.
			stopPoint = endBlock.next;
		}

		var newChain = null;
		var newBlock = null;
		var b = null;

		// Copy the chain of blocks and set the newBlock field.
		b = chain;
		while (b !== stopPoint) {
			newBlock = new this.FunctionBlock(b.left + offsetX, b.top + offsetY, b.name);
			b.newBlock = newBlock;
			if (newChain === null) {
				newChain = newBlock;
			}

			// TODO can params and controller settings be combined?
			//newBlock.params = JSON.parse(JSON.stringify(b.params));
			newBlock.controllerSettings = JSON.parse(JSON.stringify(b.controllerSettings));
			newBlock.isPaletteBlock = false;
			newBlock.interactId = tbe.nextBlockId('d:');
			this.diagramBlocks[newBlock.interactId] = newBlock;
			b = b.next;
		}
		// Fix up pointers in the new chain.
		b = chain;
		while (b !== stopPoint) {
			newBlock = b.newBlock;
			newBlock.next = b.mapToNewBlock(b.next);
			newBlock.prev = b.mapToNewBlock(b.prev);
			newBlock.flowHead = b.mapToNewBlock(b.flowHead);
			newBlock.flowTail = b.mapToNewBlock(b.flowTail);
			b = b.next;
		}
		// Clear out the newBlock field, and fix up svg as needed.
		b = chain;
		while (b !== stopPoint) {
			var temp = b.newBlock;
			b.newBlock = null;
			b = b.next;
			temp.fixupChainCrossBlockSvg();
		}

		// Update images in the new chain.
		b = newChain;
		while (b !== null) {
			b.updateSvg();
			b = b.next;
		}

		// Return pointer to head of new chain.
		return newChain;
	};

	//------------------------------------------------------------------------------
	// FunctionBlock -- Constructor for FunctionBlock object.
	//
	//      *-- svgGroup
	//        |
	//        *--- custom graphics for bloc (clear to pointer)
	//        |
	//        *--- svgRect framing rec common to all blocks
	//        |
	//        *--- [svgCrossBlock] option behind block region graphics
	//
	tbe.FunctionBlock = function FunctionBlock(x, y, blockName) {

		// Connect the generic block class to the behavior definition class.
		this.name = blockName;
		this.funcs = fblocks.bind(blockName);
		if (typeof this.funcs.defaultSettings === 'function') {
			this.controllerSettings = this.funcs.defaultSettings();
		} else {
			this.controllerSettings = { controller: 'none', data: 4 };
		}

		// Place holder for sequencing links.
		this.prev = null;
		this.next = null;
		this.flowHead = null;
		this.flowTail = null;

		// Blocks at the top level have a nesting of 0.
		this.nesting = 0;
		this.newBlock = null;

		// Dragging state information.
		this.dragging = false;
		this.snapTarget = null;   // Object to append, prepend, replace
		this.snapOpen = {         // Object for snapping to the grid
			top: null,
			left: null
		};
		this.snapAction = null;   // append, prepend, replace, ...
		this.targetShadow = null; // Svg element to hilite target location

		// Create the actual SVG object.
		// It's a group of two pieces:
		// a rounded rect and a group that holds the custom graphics for the block.
		let width = this.controllerSettings.width;
		if (width === undefined) {
			width = 70;
		}
		this.rect = {
			left: 0,
			top: 0,
			right: width,
			bottom: 80,
		};
		this.svgGroup = svgb.createGroup('drag-group', 0, 0);
		if (blockName.startsWith('identity')) {
			this.svgRect = icons.paletteBlockIdentity(1, 'function-block identity-block', 0, 0, width);
		} else {
			this.svgRect = icons.paletteBlock(1, 'function-block', 0, 0, this);
		}
		this.svgGroup.appendChild(this.svgRect);
		this.svgCustomGroup = null; // see updateSvg()
		this.updateSvg();

		// Position block, relative to its initial location at (0, 0).
		this.dmove(x, y, true);

		// Add block to the editor tree. This makes it visible.
		this.moveToFront();
	};

	tbe.FunctionBlock.prototype.isStartBlock = function () {
		// This works for now.
		return this.name.startsWith('identity');
	}

	// Create an image for the block base on its type.
	tbe.FunctionBlock.prototype.updateSvg = function () {

		// Remove the old custom image if they exist.
		if (this.svgCustomGroup !== null) {
			this.svgGroup.removeChild(this.svgCustomGroup);
		}

		// Build custom image for this block.
		this.svgCustomGroup = svgb.createGroup('', 0, 0);
		if (typeof this.funcs.svg === 'function') {
			this.funcs.svg(this.svgCustomGroup, this);
		}

		// Add it to doc's SVG tree.
		this.svgGroup.appendChild(this.svgCustomGroup);
	};

	// Checks if block passed in is in the same chain as this.
	tbe.FunctionBlock.prototype.chainContainsBlock = function (other) {
		// Block is the first block of the chain.
		var block = this.first;
		// Go through the whole chain and look for if any blocks same as other.
		while (block !== null) {
			// If a similarity is found, return true.
			if (block === other) {
				return true;
			}
			block = block.next;
		}
		// If no blocks that were the same were found, return false.
		return false;
	};

	tbe.FunctionBlock.prototype.refreshNesting = function () {
		var nesting = 0;
		var b = this.first;
		while (b !== null) {
			if (b.flowTail !== null) {
				b.nesting = nesting;
				nesting += 1;
			} else if (b.flowHead !== null) {
				nesting -= 1;
				b.nesting = nesting;
			} else {
				b.nesting = nesting;
			}
			b = b.next;
		}
	};

	// Scan down the chain and allow any block that has cross block graphics
	// to update them.
	tbe.FunctionBlock.prototype.fixupChainCrossBlockSvg = function () {
		// TODO, only refresh nesting when the links actually change.
		// no need to do it during each animation step.
		this.refreshNesting();
		var b = this;
		while (b !== null) {
			if (typeof b.funcs.crossBlockSvg === 'function') {
				b.funcs.crossBlockSvg(b);
			}
			b = b.next;
		}
	};

	Object.defineProperty(tbe.FunctionBlock.prototype, 'first', {
		get: function () {
			var block = this;
			while (block.prev !== null) {
				block = block.prev;
			}
			return block;
		}
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'last', {
		get: function () {
			var block = this;
			while (block.next !== null) {
				block = block.next;
			}
			return block;
		}
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'chainWidth', {
		get: function () {
			var block = this;
			var width = 0;
			while (block !== null) {
				width += block.rect.right - block.rect.left;
				block = block.next;
			}
			return width;
		}
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'top', {
		get: function () { return this.rect.top; }
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'left', {
		get: function () { return this.rect.left; }
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'bottom', {
		get: function () { return this.rect.bottom; }
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'right', {
		get: function () { return this.rect.right; }
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'width', {
		get: function () { return this.rect.right - this.rect.left; }
	});

	Object.defineProperty(tbe.FunctionBlock.prototype, 'height', {
		get: function () { return this.rect.bottom - this.rect.top; }
	});

	// Example of an object property added with defineProperty with an accessor property descriptor
	Object.defineProperty(tbe.FunctionBlock.prototype, 'interactId', {
		get: function () {
			return this.svgRect.getAttribute('interact-id');
		},
		set: function (id) {
			this.svgGroup.setAttribute('interact-id', id);
			this.svgRect.setAttribute('interact-id', id);
		},
	});

	// mapToNewBlock -- uUed by replicateChunk to fix up pointers in a
	// copied chain.
	tbe.FunctionBlock.prototype.mapToNewBlock = function (object) {
		if (object === undefined || object === null) {
			return null;
		} else {
			return object.newBlock;
		}
	};

	// Mark all block in the chain starting with 'this' block as being dragged.
	// Disconnect from the previous part of the chain.
	tbe.FunctionBlock.prototype.setDraggingState = function (state) {
		// If this block is in a chain, disconnect it from blocks in front.
		if (state && (this.prev !== null)) {
			this.prev.next = null;
			this.prev = null;
		}
		// Set the state of all blocks down the chain.
		var block = this;
		while (block !== null) {
			block.dragging = state;
			// block.hilite(state);

			block = block.next;
		}
	};

	tbe.FunctionBlock.prototype.moveToFront = function () {
		// TODO moving to the front interrupts (prevents) the animations.
		//tbe.svg.removeChild(this.svgGroup);
		tbe.svg.insertBefore(this.svgGroup, tbe.svgCeiling);
	};

	tbe.FunctionBlock.prototype.markSelected = function (state) {
		if (state) {
			this.moveToFront();
			this.svgRect.classList.add('selected-block');
			if (this.flowHead !== null) {
				this.flowHead.svgRect.classList.add('selected-block');
			}
			if (this.flowTail !== null) {
				this.flowTail.svgRect.classList.add('selected-block');
			}
		} else {
			this.svgRect.classList.remove('selected-block');
		}
	};

	tbe.FunctionBlock.prototype.isSelected = function () {
		return this.svgRect.classList.contains('selected-block');
	};

	// For a selected block find the last in the selected set.
	tbe.FunctionBlock.prototype.selectionEnd = function () {
		var block = this;
		while (block.next !== null && block.next.isSelected()) {
			block = block.next;
		}
		return block;
	};

	tbe.FunctionBlock.prototype.isLoopHead = function () {
		return (this.flowTail !== null);
	};

	tbe.FunctionBlock.prototype.isLoopTail = function () {
		return (this.flowHead !== null);
	};

	tbe.FunctionBlock.prototype.isCommented = function () {
		return (this.svgRect.classList.contains('commented'));
	};

	tbe.FunctionBlock.prototype.isIdentity = function () {
		return (this.name.includes('identity'));
	};

	// Checks if a selected loop is the only thing selected.
	tbe.FunctionBlock.prototype.isIsolatedLoop = function () {
		if (this.isLoopHead() && this.isSelected()) {
			if (this.prev !== null && this.prev.isSelected()) {
				return false;
			} else if (this.flowTail.next !== null && this.flowTail.next.isSelected()) {
				return false;
			} else if (this.next !== this.flowTail && this.next.isSelected()) {
				return false;
			}
		}
		if (this.isLoopTail() && this.isSelected()) {
			if (this.next !== null && this.next.isSelected()) {
				return false;
			} else if (this.flowHead.prev !== null && this.flowHead.prev.isSelected()) {
				return false;
			} else if (this.prev !== this.flowHead && this.prev.isSelected()) {
				return false;
			}
		}
		if (!this.isLoopHead() && !this.isLoopTail()) {
			return false;
		}
		if (!this.isSelected()) {
			return false;
		}
		return true;
	};

	// Determine if the block is part of selection that is more than one block
	tbe.FunctionBlock.prototype.isGroupSelected = function () {
		var before = false;
		var after = false;
		if (this.next !== null) {
			before = this.next.isSelected();
		}
		if (this.prev !== null) {
			after = this.prev.isSelected();
		}
		return (this.isSelected() && (before || after));
	};

	tbe.FunctionBlock.prototype.isOnScreen = function () {
		if (this.rect !== null) {
			if (this.rect.left + this.width >= 0 && this.rect.right - this.width <= tbe.width) {
				if (this.rect.top + this.height >= 0 && this.rect.bottom - this.height <= tbe.height) {
					return true;
				}
			}
		}
		return false;
	};

	// Change the element class to trigger CSS changes.
	tbe.FunctionBlock.prototype.hilite = function (state) {
		// TODO looks like there is more than one bring to front
		// unify the function and give it a better name.
		if (state) {
			// Bring highlighted block to top. Blocks don't normally
			// overlap, so Z plane is not important. But blocks that are
			// being dragged need to float above ones on the diagram.
			this.moveToFront();
		}
	};

	// Move a section of a chain by a delta (x, y) (from this to endBlock)
	tbe.FunctionBlock.prototype.dmove = function (dx, dy, snapToInt, endBlock) {
		var block = this;
		if (endBlock === undefined) {
			endBlock = null;
		}

		while (block !== null) {
			var r = block.rect;
			r.left += dx;
			r.top += dy;
			r.right += dx;
			r.bottom += dy;
			if (snapToInt) {
				// Final locations are forced to integers for clean serialization.
				r.top = Math.round(r.top);
				r.left = Math.round(r.left);
				r.bottom = Math.round(r.bottom);
				r.right = Math.round(r.right);
			}

			if (block.svgGroup) {
				svgb.translateXY(block.svgGroup, r.left, r.top);
			}

			if (block === endBlock) {
				break;
			}
			block = block.next;
		}
	};

	//------------------------------------------------------------------------------
	// Calculate the intersecting area of two rectangles.
	tbe.intersectingArea = function intersectingArea(r1, r2) {
		var x = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
		if (x < 0)
			return 0;
		var y = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
		if (y < 0) {
			return 0;
		}
		return x * y;
	};

	tbe.FunctionBlock.prototype.hilitePossibleTarget = function () {
		var self = this;
		var target = null;
		var overlap = 0;
		var bestOverlap = 0;
		var action = null;
		var rect = null;
		var thisWidth = this.width;

		// Look at every diagram block taking into consideration
		// whether or not it is in the chain.
		tbe.forEachDiagramBlock(function (entry) {
			if (entry !== self && !entry.dragging) {
				rect = {
					top: entry.top,
					bottom: entry.bottom,
					left: entry.left - (thisWidth * 0.5),
					right: entry.right - (thisWidth * 0.5),
				};
				if (entry.prev === null) {
					// For left edge, increase gravity field
					rect.left -= thisWidth * 0.5;
				}
				if (entry.next === null) {
					// For right edge, increase gravity field
					rect.right += thisWidth * 1.5;
				}

				overlap = tbe.intersectingArea(self.rect, rect);
				if (overlap > bestOverlap) {
					bestOverlap = overlap;
					target = entry;
				}
			}
		});

		// Refine the action based on geometery.
		if (target !== null) {

			if (self.left <= (target.left)) {
				if (target.prev !== null) {
					if (!self.isStartBlock()) { action = 'insert'; }
				} else {
					if (!target.isStartBlock()) { action = 'prepend'; }
				}
			} else if (!self.name.includes('identity')) {
				action = 'append';
			}
		}

		var shadowX = null;
		var shadowY = null;
		var gridsize = 40;

		if (action === null) {
			action = 'outsnap';
			if (target !== null) {
				var diff = target.rect.bottom - this.rect.top;
				shadowX = (Math.round((this.rect.top + diff) / gridsize) * gridsize);
				shadowY = (Math.round(this.rect.left / gridsize) * gridsize);
				target = null;
			}
		}

		if (shadowX === null && shadowY === null) {
			shadowX = Math.round(this.rect.top / gridsize) * gridsize;
			shadowY = Math.round(this.rect.left / gridsize) * gridsize;
		}

		// Update shadows as needed.
		if ((this.snapTarget !== target || this.snapAction !== action)) {
			if (this.snapTarget !== null) {
				this.removeTargetShadows();
			}
			this.snapTarget = target;
			this.snapAction = action;
			if (target !== null) {
				this.insertTargetShadows(target, action);
			}
		} else if (action === 'outsnap' && ((this.snapOpen.top !== shadowX || this.snapOpen.left !== shadowY) || this.snapAction !== action)) {
			this.removeTargetShadows();
			this.snapAction = action;
			this.snapOpen = {
				top: shadowX,
				left: shadowY
			};

			this.insertTargetShadows(this.snapOpen, action);
		}
		return target;
	};

	// Show the shadow blocks to indicate where the blocks will end up if placed
	// in the current location.
	tbe.FunctionBlock.prototype.insertTargetShadows = function (target, action) {
		var block = this;
		var y = target.top;
		var x = 0;
		if (action === 'prepend') {
			x = target.left - this.chainWidth;
		} else if (action === 'insert') {
			// The shadows will be covered up, and not going to move the
			// down stream blocks until the move is committed.
			// so offset them a bit.
			// TODO show above OR based on where dragging blocks are coming from.
			x = target.left - 20;
			y -= 25;
		} else if (action === 'append') {
			x = target.right;
		} else if (action === 'outsnap') {
			var gridsize = 40;
			x = gridsize * (Math.round(this.rect.left / gridsize));
			y = gridsize * (Math.round(this.rect.top / gridsize));
		} else {
			return;
		}
		var shadow = null;
		while (block !== null) {
			if (action === 'outsnap') {
				shadow = icons.paletteBlock(1, 'shadow-block shadow-block-outsnap', x, y, block);//svgb.createRect('shadow-block shadow-block-outsnap', x, y, block.width, block.height, 10);
			} else {
				shadow = icons.paletteBlock(1, 'shadow-block', x, y, block);//svgb.createRect('shadow-block', x, y, block.width, block.height, 10);
			}
			tbe.svg.insertBefore(shadow, tbe.background.nextSibling);

			block.targetShadow = shadow;
			x += block.width;
			block = block.next;
		}
	};

	tbe.FunctionBlock.prototype.removeTargetShadows = function () {
		var block = this;
		var shadowsToRemove = [];
		while (block !== null) {
			var shadow = block.targetShadow;
			if (shadow !== null) {
				shadowsToRemove.push(shadow);
				if (block.snapAction === 'outsnap') {
					shadow.setAttribute('class', 'shadow-block-leave shadow-block-leave-outsnap');
				} else {
					shadow.setAttribute('class', 'shadow-block-leave');
				}
				block.targetShadow = null;
			}
			block = block.next;
		}
		// Give some time for the animation to complete, then remove.
		setTimeout(function () {
			shadowsToRemove.forEach(function (elt) {
				if (elt.parentNode !== null) {
					tbe.svg.removeChild(elt);
				}
			});
		},
			1000);
		var shadows = document.getElementsByClassName('shadow-block');
		for (var i = shadows.length - 1; i >= 0; i--) {
			shadows[i].parentNode.removeChild(shadows[i]);
		}
	};

	tbe.FunctionBlock.prototype.moveToPossibleTarget = function () {
		var thisLast = this.last;
		var targx = 0;
		var dx = 0;
		var dy = 0;
		assert(this.prev === null, 'err1');
		assert(thisLast.next === null, 'err2');

		if (this.snapTarget !== null) {
			// TODO:assert that chain we have has clean prev/next links
			// Append/Prepend the block(chain) to the list
			if (this.snapAction === 'prepend') {
				assert(this.snapTarget.prev === null, 'err3');
				targx = this.snapTarget.left - this.chainWidth;
				thisLast.next = this.snapTarget;
				this.snapTarget.prev = thisLast;
			} else if (this.snapAction === 'append') {
				assert(this.snapTarget.next === null, 'err4');
				targx = this.snapTarget.right;
				this.prev = this.snapTarget;
				this.snapTarget.next = this;
				// slide down post blocks if insert
				// logically here, in annimation bellow
			} else if (this.snapAction === 'insert') {
				assert(this.snapTarget.prev !== null, 'err5');
				targx = this.snapTarget.left;
				// Determin space needed for new segment
				// before its spliced in.
				var width = this.chainWidth;

				thisLast.next = this.snapTarget;
				this.prev = this.snapTarget.prev;
				this.snapTarget.prev.next = this;
				this.snapTarget.prev = thisLast;

				//log.trace('insert',this);
				//	this.diagramBlocks[this.interactId] = this;

				/*
				tbe.forEachDiagramBlock(function (key) {
					if(key.interactId === this.interactId) {
						log.trace(key);
					}
				});
				*/

				// Set up animation to slide down old blocks.
				tbe.animateMove(this.snapTarget, this.snapTarget.last, width, 0, 10);
			}

			// Set up an animation to move the dragging blocks to new location.
			dx = targx - this.left;
			dy = this.snapTarget.top - this.top;
			// The model snaps directly to the target location
			// but the view eases to it.
			tbe.animateMove(this, thisLast, dx, dy, 10);
		} else if (this.snapOpen !== null) {
			dx = Math.round(this.snapOpen.left - this.rect.left);
			dy = Math.round(this.snapOpen.top - this.rect.top);
			tbe.animateMove(this, thisLast, dx, dy, 10);
		} else {
			// Nothing to snap to so leave it where is ended up.
			// still need sound though
			// tbe.audio.drop.play();
		}
		this.hilite(false);
		this.snapTarget = null;
		this.snapAction = null;
		this.snapOpen = {
			top: null,
			left: null
		};
	};

	// animateMove -- move a chunk of block to its new location. The prev and next
	// links should already be set up for the final location.
	tbe.animateMove = function (firstBlock, lastBlock, dx, dy, frames) {
		var state = {
			frame: frames,
			adx: dx / frames,
			ady: dy / frames,
			chunkStart: firstBlock,
			chunkEnd: lastBlock
		};
		tbe.animateMoveCore(state);
	};

	tbe.animateMoveCore = function (state) {
		var frame = state.frame;
		state.chunkStart.dmove(state.adx, state.ady, (frame === 1), state.chunkEnd);
		state.chunkStart.fixupChainCrossBlockSvg();
		if (frame > 1) {
			state.frame = frame - 1;
			requestAnimationFrame(function () { tbe.animateMoveCore(state); });
		} else {
			// Once animation is over shadows are covered, remove them.
			tbe.audio.playSound(tbe.audio.shortClick);
			state.chunkStart.removeTargetShadows();
		}
	};

	tbe.clearDiagramBlocks = function clearDiagramBlocks() {
		tbe.internalClearDiagramBlocks();
	};
	tbe.internalClearDiagramBlocks = function clearDiagramBlocks() {
		tbe.forEachDiagramBlock(function (block) {
			tbe.svg.removeChild(block.svgGroup);
			block.svgGroup = null;
			block.svgCustomGroup = null;
			block.svgRect = null;
			block.next = null;
			block.prev = null;
		});
		tbe.diagramBlocks = {};
	};

	// Find a selected block on the diragram. There should only
	// be one set of blocks selected.
	tbe.findSelectedChunk = function findSelectedChunk() {
		var selected = null;
		tbe.forEachDiagramBlock(function (block) {
			if (selected === null && block.isSelected()) {
				selected = block;
			}
		});
		return selected;
	};

	// Starting at a block that was clicked on find the logical range that
	// should be selected, typically that is the selected block to the end.
	// But for flow blocks it more subtle.
	tbe.findChunkStart = function findChunkStart(clickedBlock) {
		var chunkStart = clickedBlock;
		while (chunkStart.isSelected()) {
			if (chunkStart.prev !== null && chunkStart.prev.isSelected()) {
				chunkStart = chunkStart.prev;
			} else {
				break;
			}
		}
		// Scan to end see if a flow tail is found.
		/*var b = chunkStart;
		while (b !== null) {
		  // If tail found inlcude the whole flow block.
		  if (b.flowHead !== null) {
			chunkStart = b.flowHead;
		  }
		  // If at the top its a clean place to break the chain.
		  if (b.nesting === 0) {
			break;
		  }
		  b = b.next;
		}*/
		return chunkStart;
	};
	// Finds the block before where a block can be placed (end of chain)
	// Used when block is dropped by tapping on palette
	tbe.findInsertionPoint = function findInsertionPoint() {
		var foundBlock = null;
		var defaultX = Math.round(tbe.defaultBlockLoc[0]);
		var defaultY = Math.round(tbe.defaultBlockLoc[1]);

		// Find the block at the default location
		tbe.forEachDiagramBlock(function (block) {
			var top = block.top;
			var left = block.left;
			if (top === defaultY && left === defaultX) {
				foundBlock = block;
			}
		});
		// Go find the end of the chain with foundBlock as the start
		while (foundBlock !== null && foundBlock.next !== null) {
			foundBlock = foundBlock.next;
		}
		return foundBlock;
	};
	// Places variable block after the the insertion point
	tbe.autoPlace = function autoPlace(block) {
		var foundBlock = tbe.findInsertionPoint();
		block = tbe.replicateChunk(block, null, 0, 0);
		var x = tbe.defaultBlockLoc[0];
		var y = tbe.defaultBlockLoc[1];
		var dx = Math.round(x - block.left);
		var dy = Math.round(y - block.top);

		if (foundBlock !== null && block.isIdentity()) {
			block.dmove(dx, dy);
			tbe.identityAutoPlace(block);
			return;
		}

		// Check if a chain currently exists
		// If one exists, move the block next to it
		if (foundBlock === null) {
			block.dmove(dx, dy);
		} else {
			block.dmove(dx + foundBlock.right - x, dy);
			foundBlock.next = block;
			block.prev = foundBlock;
		}
	};

	tbe.identityAutoPlace = function identityAutoPlace(block) {
    while (block.bottom + 120 <= tbe.height - 100) {
      // check if intersecting
      var signal = {valid : true};
      tbe.forEachDiagramBlock(function(compare) {
        if (tbe.intersectingArea(compare, block) > 100 && compare !== block && block.bottom + 120 < tbe.height - 150) {
          signal.valid = false;
  				return;
  			}
      })
      if (signal.valid) {
        return;
      } else {
        block.dmove(0, 120);
      }
    }
    tbe.deleteChunk(block, block);

		// tbe.forEachDiagramBlock(function (compare) {
		// 	//console.log("compare", tbe.intersectingArea(compare, block));
		// 	if (tbe.intersectingArea(compare, block) > 100 && compare !== block && block.bottom + 120 < tbe.height - 150) {
		// 		block.dmove(0, 120);
		// 		tbe.identityAutoPlace(block);
		// 		return;
		// 	} else if (block.bottom + 120 > tbe.height - 100) {
		// 		tbe.deleteChunk(block, block);
		// 	}
		// });
	};

	tbe.keyEvent = function (e) {
		e = e || window.event;

		// Browsers report keys code differently, check both.
		var key = e.which || e.keyCode || 0;

		// Look for control modifier
		var ctrl = e.ctrlKey ? e.ctrlKey : (key === 17);

		if (key === 86 && ctrl) {
			log.trace("Ctrl + V Pressed !");
		} else if (key === 67 && ctrl) {
			log.trace("Ctrl + C Pressed !");
			var array = [];
			tbe.forEachDiagramBlock(function (block) {
				if (block.isSelected()) {
					array.push(block);
				}
			});
			var textArea = document.createElement("textarea");

			textArea.style.position = 'fixed';
			textArea.style.top = 0;
			textArea.style.left = 0;
			textArea.style.width = '2em';
			textArea.style.height = '2em';
			textArea.style.padding = 0;
			textArea.style.border = 'none';
			textArea.style.outline = 'none';
			textArea.style.boxShadow = 'none';
			textArea.style.background = 'transparent';
			if (array.length >= 0) {
				textArea.value = teakText.chunkToText(tbe.findChunkStart(array[0]), null, '');
				log.trace(textArea);
				document.body.appendChild(textArea);
				textArea.select();

				try {
					var successful = document.execCommand('copy');
					var msg = successful ? 'successful' : 'unsuccessful';
					log.trace('Copying text command was ' + msg);
				} catch (err) {
					log.trace('Oops, unable to copy');
				}
			}

			document.body.removeChild(textArea);
		} else if (key === 8) {
			if (tbe.components.blockSettings.isOpen()) {
				tbe.components.blockSettings.deleteGroup();
			} else {
				var sBlock = tbe.findSelectedChunk();
				if (sBlock !== null) {
					tbe.deleteChunk(sBlock, sBlock.selectionEnd());
				}
			}
		} else if (key === 49) {
			tbe.loadDoc('docA');
		} else if (key === 50) {
			tbe.loadDoc('docB');
		} else if (key === 51) {
			tbe.loadDoc('docC');
		} else if (key === 52) {
			tbe.loadDoc('docD');
		} else if (key === 53) {
			tbe.loadDoc('docE');
		} else if (key === 80) {
			log.trace('key pressed');
			conductor.playAll();
		} else if (key === 83) {
			conductor.stopAll();
		} else if (key === 88) {
			var cloneBlocks = [];
			tbe.forEachDiagramBlock(function (block) {
				if (block.isSelected()) {
					cloneBlocks.push(block);
				}
			});
			if (cloneBlocks.length !== 0) {
				var clone = tbe.replicateChunk(cloneBlocks[0], cloneBlocks[cloneBlocks.length - 1], 0, 0);

				// TODO put it in a non-hardcoded place
				var dy = -140;
				if (clone.top < 140) {
					dy = 140;
				}
				tbe.animateMove(clone, clone.last, 0, dy, 20);
			}
		} else if (ctrl && key === 65) {
			var selected = null;
			tbe.forEachDiagramBlock(function (block) {
				if (block.isSelected()) {
					selected = block;
				}
			});

			tbe.clearStates();

			while (selected.next !== null) {
				selected.markSelected(true);
				selected = selected.next;
			}
			while (selected !== null) {
				selected.markSelected(true);
				selected = selected.prev;
			}
		}
	};

	document.body.addEventListener("keydown", tbe.keyEvent, false);

	// Attach these interactions properties based on the class property of the DOM elements
	tbe.configInteractions = function configInteractions() {
		var thisTbe = tbe;

		// Most edit transaction start from code dispatched from this code.
		// Know it well and edit with caution. There are subtle interaction states
		// managed in these event handlers.
		interact('.drag-delete')
			.on('down', function () {
				var block = thisTbe.elementToBlock(event.target);
				if (block === null)
					return;
				thisTbe.clearStates();
				thisTbe.deleteChunk(block, block.last);
			});

		// Pointer events to the background go here. Might make sure the event is not
		// right next to a block, e.g. allow some safe zones.
		interact('.editor-background')
			.on('down', function (event) {
				try {
					//save here potentially
					thisTbe.clearStates();
					teakselection.startSelectionBoxDrag(event);
				} catch (error) {
					log.trace('exception in drag selection');
				}
			});

		// Event directed to function blocks (SVG objects with class 'drag-group')
		// These come in two main types: pointer events(mouse, track, and touch) and
		// drag events. Drag events start manually, if the semantics of the pointer
		// event indicate that makes sense. Note that the object at the root of the
		// drag event may differ from the object the pointer event came to.
		// For example, dragging may use the head of a flow block, not the tail that was
		// clicked on or that chain dragged might be a copy of the block clicked on.
		//
		// After making change test on FF, Safari, Chrome, desktop and tablet. Most
		// browser breaking behaviour differences have been in this code.

		interact('.drag-group')
			// Pointer events.
			.on('down', function (event) {
        if (app.isShowingTutorial) {
          return;
        }
				tbe.pointerDownObject = event.target;
			})
			.on('tap', function (event) {
				log.trace('tappped');
				var block = thisTbe.elementToBlock(event.target);
				if (block !== null && block.isPaletteBlock) {
					// Tapping on an palette item will place it on the sheet.
          var tutorialOverlay = require("./overlays/tutorialOverlay.js");
          if (app.isShowingTutorial) {
            var block = thisTbe.elementToBlock(event.target);
            tutorialOverlay.showBlockDetails(block);
          } else {
            tbe.autoPlace(block);
          }
				} else {
					// Tapping on diagram block brings up a config page.
					actionDots.reset();
					//log.trace(thisTbe.components);	
					thisTbe.components.blockSettings.tap(block);
				}
			})
			.on('up', function (event) {
        if (app.isShowingTutorial) {
          return;
        }
				var block = thisTbe.elementToBlock(event.target);
				if (block.rect.top > tbe.height - 100 && !block.isPaletteBlock) {
					event.interaction.stop();
					block.setDraggingState(false);
					if (block.isLoopHead()) {
						block.next.markSelected(true);
						block.markSelected(true);
						tbe.deleteChunk(block, block.last);
					} else if (block.isLoopTail()) {
						tbe.deleteChunk(block.flowHead, block.last);
					} else {
						tbe.deleteChunk(block, block.last);
					}
				}
			})
			.on('move', function (event) {
				//log.trace('moving rn');
				if (app.isShowingTutorial) {
					return;
				}
				try {
					var interaction = event.interaction;
					var block = thisTbe.elementToBlock(event.target); 
					if (block.name === 'tail') {
						block = block.flowHead;
					}
					// If the pointer was moved while being held down
					// and an interaction hasn't started yet...
					if (interaction.pointerIsDown && !interaction.interacting()) {
						if (tbe.pointerDownObject === event.target) {						
							block = tbe.findChunkStart(block);
							var targetToDrag = block.svgGroup;
							var notIsolated = (block.next !== null && block.prev !== null);
							var next = block;
							var prev = block;
							if (block.nesting > 0 && notIsolated && !block.isGroupSelected()) {
								var temp_block = block;
								var nesting = 2;
								var width = 0;

								if(block.name === 'loop') {
                                    var temp_block = block;
                                    var nesting = 0;
                                    var tail = block.flowTail;
									var width = 0;

                                    while(temp_block !== tail) {
                                        nesting += 1;
										width += temp_block.width;
                                        temp_block = temp_block.next;
                                    }
 
                                    nesting +=1;
									width += temp_block.width;
                                    next = block.flowTail.next; 
                                    prev = block.prev;
                                    block.flowTail.next.prev = prev;
                                    block.prev.next = next;
                                    block.flowTail.next = null;
                                    block.prev = null;
                                    tbe.animateMove(next, next.last, -width, 0, 10);
                                }

								else {
									next = block.next;
									prev = block.prev;
									block.next.prev = prev;
									block.prev.next = next;
									block.next = null;
									block.prev = null;
									if (next !== null) {
										tbe.animateMove(next, next.last, -block.width, 0, 10); 
									}
								}								
							} else if (block.nesting > 0 && notIsolated && block.isGroupSelected()) {
								next = block;
								prev = block.prev;
								while (next.next !== null && next.next.isSelected()) {
									next = next.next;
								}
								var nextCopy = next.next;
								next.next.prev = prev;
								prev.next = next.next;
								next.next = null;
								block.prev = null;
								if (next !== null) {
									tbe.animateMove(nextCopy, nextCopy.last, -block.chainWidth, 0, 10);
								}
							}

							// If coming from palette, or if coming from shift drag...
							if (block.isPaletteBlock || event.shiftKey) {
								var offsetX = 0;
								var offsetY = 0;
								if (block.isPaletteBlock) {
									var pageRect = event.target.getBoundingClientRect();
									offsetX = pageRect.x - block.left;
									offsetY = pageRect.y - block.top;
								}
								block = thisTbe.replicateChunk(block, null, offsetX, offsetY);
								targetToDrag = block.svgGroup;
							}

							// Start a drag interaction targeting the clone.
							block.setDraggingState(true);

							tbe.clearStates();
							interaction.start({ name: 'drag' },
								event.interactable,
								targetToDrag);
						}
					} else {
						tbe.pointerDownObject = null;
					}
				} catch (error) {
					log.trace('Exception in move event', error);
				}
			})
			.draggable({
				manualStart: true, // Drag wont start until initiated by code.
				restrict: {
					restriction: thisTbe.svg,
					endOnly: true,
					// Restrictions, by default, are for the point not the whole object
					// so R and B are 1.x to include the width and height of the object.
					// 'Coordinates' are percent of width and height.
					elementRect: { left: -0.2, top: -0.2, right: 1.2, bottom: 2.4 },
					// TODO bottom needs to exclude the palette.
				},
				inertia: {
					resistance: 20,
					minSpeed: 50,
					endSpeed: 1
				},
				max: Infinity,
				onstart: function () {
				},
				onend: function (event) {
					var block = thisTbe.elementToBlock(event.target);
					if (block === null)
						return;

					if (block.dragging) {
						// If snap happens in coastin-move
						// the chain will no longer be dragging.
						block.moveToPossibleTarget();
						block.setDraggingState(false);
					}

					tbe.moveToFront(block, tbe.dropAreaGroup);
				},
				onmove: function (event) {
					// Since there is inertia these callbacks continue to
					// happen after the user lets go.
					
					var block = thisTbe.elementToBlock(event.target);
		
					if (block === null)
						return;
					if (!block.dragging) {
						// If snap happens in coasting-move
						// the chain will no longer be dragging.
						return;
					}

					// Puts the blocks being dragged at the top
					tbe.moveToFront(block, tbe.svgCeiling)

					// Move the chain to the new location based on deltas.
					block.dmove(event.dx, event.dy, true);

					// Then see if there is a possible target, a place to snap to.
					var target = block.hilitePossibleTarget();

					// If there is a target and its in the coasting phase then redirect
					// the coasting to the target.
					if (target !== null) {
						var iStatus = event.interaction.inertiaStatus;
						if ((iStatus !== undefined && iStatus !== null) && iStatus.active) {
							// Its in the coasting state, just move it to the snapping place.
							block.moveToPossibleTarget();
							block.setDraggingState(false);
						}
					}
				}
			});
	};

	tbe.moveToFront = function (blockChain, ceiling) {
		var temp = blockChain;
		while (temp !== null) {
			//  tbe.svg.append(temp.svgGroup);
			tbe.svg.insertBefore(temp.svgGroup, ceiling);
			temp = temp.next;
		}
	};

	tbe.blocksOnScreen = function () {
		var toReturn = false;
		tbe.forEachDiagramBlock(function (block) {
			if (block.isOnScreen()) {
				toReturn = true;
			}
		});
		if (Object.keys(tbe.diagramBlocks).length === 0) {
			return false;
		}
		return toReturn;
	};

	tbe.sizePaletteToWindow = function sizePaletteToWindow() {
		var w = tbe.width;
		var h = tbe.height;

		svgb.resizeRect(tbe.background, w, h);
		tbe.windowRect = { left: 0, top: 0, right: w, bottom: h };

		var scale = 1.0;
		if (h < 250) {
			scale = 250 / 500;
		} else if (h < 500) {
			scale = h / 500;
		}

		//var top = h - 90;
		var paletteHeight = (h - (100 * scale));
		svgb.translateXY(tbe.dropAreaGroup, 0, paletteHeight);
		for (let i = 0; i < tbe.dropAreaGroup.childNodes.length; i++) {
			let tab = tbe.dropAreaGroup.childNodes[i];
			let r = tab.childNodes[0];
			svgb.resizeRect(r, w / scale, 100);
			var scalestr = 'scale(' + scale + ')'
			tab.setAttribute('transform', scalestr);
		}
	};

	tbe.createTabSwitcherButton = function () {
		var group = svgb.createGroup('tabSwitcher', 0, 0);
		var circle = svgb.createCircle('tabSwitcherRing', 50, 50, 40, 0);
		group.appendChild(circle);
		return group;
	};

	tbe.buildTabs = function () {
		var dropAreaGroup = svgb.createGroup('dropAreaGroup', 0, 0);
		var names = ['Start', 'Action', 'Control'];
		for (var i = 0; i < 3; i++) {
			var group = svgb.createGroup('', 0, 0);
			var className = 'area' + String(i + 1);
			var rect = svgb.createRect('dropArea ' + className, 0, 0, tbe.width, 100, 0);
			var tab = svgb.createRect('dropArea ' + className, 10 + (160 * i), -30, 150, 40, 5);
			var text = svgb.createText('dropArea svg-clear', 20 + (160 * i), -10, names[i]);
			group.appendChild(rect);
			group.appendChild(tab);
			group.appendChild(text);
			dropAreaGroup.appendChild(group);
		}

		interact('.dropArea')
			.on('down', function (event) {
				var group = event.target.parentNode.getAttribute('group');
				tbe.switchTabs(group);
			});

		this.svg.insertBefore(dropAreaGroup, tbe.svgCeiling);
		this.dropAreaGroup = dropAreaGroup;

		tbe.tabGroups = [];
		tbe.tabGroups['start'] = tbe.dropAreaGroup.childNodes[0];
		tbe.tabGroups['action'] = tbe.dropAreaGroup.childNodes[1];
		tbe.tabGroups['control'] = tbe.dropAreaGroup.childNodes[2];

		// For event routing.
		tbe.tabGroups['start'].setAttribute('group', 'start');
		tbe.tabGroups['action'].setAttribute('group', 'action');
		tbe.tabGroups['control'].setAttribute('group', 'control');
	};

	tbe.switchTabs = function (group) {
		// This moves the tab background to the front.
    if (app.isShowingTutorial) {
      return;
    }
		this.clearStates();
		var tab = tbe.tabGroups[group];
		this.dropArea = tab;
		tbe.dropAreaGroup.appendChild(tab);
		tbe.showTabGroup(group);
	};

	tbe.switchTabsTutorial = function (group) {
		// This moves the tab background to the front.
    // soft clearStates
		actionDots.reset();
		// app.overlays.hideOverlay(null);
		this.components.blockSettings.hide();
		tbe.forEachDiagramBlock(function (b) { b.markSelected(false); });

		var tab = tbe.tabGroups[group];
		this.dropArea = tab;
		tbe.dropAreaGroup.appendChild(tab);
		tbe.showTabGroup(group);
	};

	tbe.showTabGroup = function (group) {
		tbe.forEachPalette(function (block) {
			if (block.pgroup === group) {
				block.svgGroup.setAttribute('class', 'drag-group');
			} else {
				block.svgGroup.setAttribute('class', 'hiddenPaletteBlock');
			}
		});
	};

	tbe.resize = function () {
		// This is the logical size (used by SVG, etc) not retina pixels.
		tbe.width = window.innerWidth;
		tbe.height = window.innerHeight;
		// First resize palette and background then resize the action buttons
		tbe.sizePaletteToWindow();
		actionDots.resize(tbe.width, tbe.height);
	};

	tbe.addPalette = function (palette) {
		const leftIndent = 30;
		var indent = leftIndent;
		var increment = 30;
		var lastGroup = 'start';

		tbe.buildTabs();

		var blocks = palette.blocks;
		var blockTop = 10; //tbe.height - 90;
		for (var index = 0; index < blocks.length; index++) {
			var name = blocks[index].name;
			var pgroup = blocks[index].group;
			if (pgroup !== lastGroup) {
				indent = leftIndent;
				increment = 15;
				lastGroup = pgroup;
			}
			var block = this.addPaletteBlock(indent, blockTop, name, pgroup);

			if (name === 'loop') {
				// The loop is two blocks, needs a little special work here.
				var blockTail = this.addPaletteBlock(block.right, blockTop, 'tail', 'control');
				block.next = blockTail;
				blockTail.prev = block;
				// A flow block set has direct pointers between the two end points.
				block.flowTail = blockTail;
				blockTail.flowHead = block;
				blockTail.fixupChainCrossBlockSvg();
			}
			indent += block.chainWidth + increment;
		}

		tbe.switchTabs('start');
		// dropAreaGroup.appendChild(tbe.createTabSwitcherButton());
	};

  tbe.getPaletteBlockByName = function(name) {
    for (const k in app.tbe.paletteBlocks) {
      var b = app.tbe.paletteBlocks[k];
      if (b.name == name) {
        return b;
      }
    }
    return null;
  }

	return tbe;
}();