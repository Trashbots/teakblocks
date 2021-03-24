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

  var tutorialData = {}

  function TutorialPage(name, type, titleText, aboutText) {
    return {
      "name": name,
      "type": type,
      "titleText": titleText,
      "aboutText": aboutText
    }
  }

  tutorialData.pages = [
    TutorialPage('intro',
      'basic',
      'TBlocks Tutorial - Introduction',
      'Welcome to the tutorial for TBlocks!'),
    TutorialPage('play',
      'dot',
      'TBlocks Tutorial - Play Button',
      'This is the play button.'),
    TutorialPage('stop',
      'dot',
      'TBlocks Tutorial - Stop Button',
      'This is the stop button.'),
    TutorialPage('driveOverlay',
      'dot',
      'TBlocks Tutorial - Drive Button',
      'This is the drive button.'),
    TutorialPage('debugOverlay',
      'dot',
      'TBlocks Tutorial - Debug Button',
      'This is the debug button.'),
    TutorialPage('pages',
      'dot',
      'TBlocks Tutorial - Pages Button',
      'This is the pages button.'),
    TutorialPage('edit',
      'dot',
      'TBlocks Tutorial - Edit Button',
      'This is the edit button.'),
    TutorialPage('calibrate',
      'dot',
      'TBlocks Tutorial - Calibrate Button',
      'This is the calibrate button.'),
    TutorialPage('tutorialOverlay',
      'dot',
      'TBlocks Tutorial - Tutorial Button',
      'This is the tutorial button.'),
    TutorialPage('deviceScanOverlay',
      'dot',
      'TBlocks Tutorial - Device Scan Button',
      'This is the device scan button.'),
    TutorialPage('start',
      'palette',
      'TBlocks Tutorial - Start Palette',
      'This is the start palette.'),
    TutorialPage('action',
      'palette',
      'TBlocks Tutorial - Action Palette',
      'This is the action palette.'),
    TutorialPage('control',
      'palette',
      'TBlocks Tutorial - Control Palette',
      'This is the control palette.')
  ];

  tutorialData.blockPages = {
    identity: TutorialPage('identity',
      'block',
      'TBlocks Tutorial - Identity Block',
      'FILLER TEXT Identity'),
    identityAccelerometer: TutorialPage('identityAccelerometer',
      'block',
      'TBlocks Tutorial - Identity Accelerometer Block',
      'FILLER TEXT Identity Accelerometer'),
    identityButton: TutorialPage('identityButton',
      'block',
      'TBlocks Tutorial - Identity Button Block',
      'FILLER TEXT Identity Button'),
    identityTemperature: TutorialPage('identityTemperature',
      'block',
      'TBlocks Tutorial - Identity Temperature Block',
      'FILLER TEXT Identity Temperature'),

    picture: TutorialPage('picture',
      'block',
      'TBlocks Tutorial - Picture Block',
      'FILLER TEXT Picture'),
    sound: TutorialPage('sound',
      'block',
      'TBlocks Tutorial - Sound Block',
      'FILLER TEXT Sound'),
    motor: TutorialPage('motor',
      'block',
      'TBlocks Tutorial - Motor Block',
      'FILLER TEXT Motor'),
    twoMotor: TutorialPage('twoMotor',
      'block',
      'TBlocks Tutorial - Two Motor Block',
      'FILLER TEXT Two Motor'),
    variableSet: TutorialPage('variableSet',
      'block',
      'TBlocks Tutorial - Variable Set Block',
      'FILLER TEXT Variable Set'),
    variableAdd: TutorialPage('variableAdd',
      'block',
      'TBlocks Tutorial - Variable Add Block',
      'FILLER TEXT Variable Add'),
    print: TutorialPage('print',
      'block',
      'TBlocks Tutorial - Print Block',
      'FILLER TEXT Print'),

    wait: TutorialPage('wait',
      'block',
      'TBlocks Tutorial - Wait Block',
      'FILLER TEXT Wait'),
    loop: TutorialPage('loop',
      'block',
      'TBlocks Tutorial - Loop Block',
      'FILLER TEXT Loop'),
    tail: TutorialPage('tail',
      'block',
      'TBlocks Tutorial - Tail Block',
      'FILLER TEXT Tail'),
  }


  return tutorialData;
}();
