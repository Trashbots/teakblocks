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
      'Welcome to the tutorial for TBlocks! Through this, you will learn about each of the different action buttons and coding blocks. At any point, you can click “End Tutorial” to close this panel. Click “Next Page” to continue!'),
    TutorialPage('play',
      'dot',
      'TBlocks Tutorial - Play Button',
      'This is the “Play” button. You will use this button each time you want to run your code on the Bot.'),
    TutorialPage('stop',
      'dot',
      'TBlocks Tutorial - Stop Button',
      'This is the “Stop” button. You will use this button each time you want to stop running your code on the Bot. This will stop the motors and clear the LED matrix!'),
    TutorialPage('driveOverlay',
      'dot',
      'TBlocks Tutorial - Drive Button',
      'This is the “Gamepad” button. Clicking this button will allow you to drive your robot around using the gamepad controller.'),
    TutorialPage('debugOverlay',
      'dot',
      'TBlocks Tutorial - Debug Button',
      'This is the “Debug” button. This is a sneak peek into what’s going on in the background!'),
    TutorialPage('pages',
      'dot',
      'TBlocks Tutorial - Pages Button',
      'This is the “Pages” button. Click between the pages to code up to 5 programs at once!'),
    TutorialPage('edit',
      'dot',
      'TBlocks Tutorial - Edit Button',
      'This is the “Edit” button. Use this drop down for functions such as “Copy”, “Paste”, “Delete All”, and “Settings”.'),
    TutorialPage('calibrate',
      'dot',
      'TBlocks Tutorial - Calibrate Button',
      'This is the “Calibrate” button. This button can be used to calibrate the motors to drive perfectly straight. Make sure you’re on the most updated version (click the button to check)!'),
    TutorialPage('tutorialOverlay',
      'dot',
      'TBlocks Tutorial - Tutorial Button',
      'This is the “Tutorial” button. Use this button at any time to access this tutorial again!'),
    TutorialPage('deviceScanOverlay',
      'dot',
      'TBlocks Tutorial - Device Scan Button',
      'This is the “Device Scan” button. Click here to connect a Bot to your app!'),
    TutorialPage('start',
      'palette',
      'TBlocks Tutorial - Start Palette',
      'This is the “Start” Palette. These are the blocks needed to start a chain. Click below to see what each of the blocks specifically does!'),
    TutorialPage('action',
      'palette',
      'TBlocks Tutorial - Action Palette',
      'This is the “Action” Palette. These are the blocks that do things on the Bot. Use this palette to play with the LED display, run the motors, play music, or use variables. Click below to see what each of the blocks specifically does!'),
    TutorialPage('control',
      'palette',
      'TBlocks Tutorial - Control Palette',
      'This is the “Control” Palette. These are the blocks that control the flow of the program. There is a looping block and a wait block. Click below to see what each of the blocks specifically does!')
  ];

  tutorialData.blockPages = {
    identity: TutorialPage('identity',
      'block',
      'Run Block',
      'Runs its program when the “Play” button is pressed (in the top left corner)'),
    identityAccelerometer: TutorialPage('identityAccelerometer',
      'block',
      'Accelerometer Block',
      'Runs its program when the Bot senses a certain acceleration'),
    identityButton: TutorialPage('identityButton',
      'block',
      'Button Block',
      'Runs its program when "A", "B", or "A + B" button(s) are clicked'),
    identityTemperature: TutorialPage('identityTemperature',
      'block',
      'Temperature Block',
      'Runs its program when the Bot senses a certain temperature'),

    picture: TutorialPage('picture',
      'block',
      'Smile Block',
      'Shows an image on the LED display'),
    sound: TutorialPage('sound',
      'block',
      'Sound Block',
      'Plays a sequence of up to 4 notes'),
    motor: TutorialPage('motor',
      'block',
      'Single Motor Block',
      'Runs a single motor (1 or 2) for a set time and at a set speed'),
    twoMotor: TutorialPage('twoMotor',
      'block',
      'Double Motor Block',
      'Runs both motors for a set time and at a set speed'),
    variableSet: TutorialPage('variableSet',
      'block',
      'Set Block',
      'Sets variable A, B, or C to a certain value'),
    variableAdd: TutorialPage('variableAdd',
      'block',
      'Add Block',
      'Adds or subtracts a value to variable A, B, or C'),
    print: TutorialPage('print',
      'block',
      'Print Block',
      'Prints the value of a variable OR will print the value of a sensor'),

    wait: TutorialPage('wait',
      'block',
      'Wait Block',
      'Pauses the program for a certain amount of time'),
    loop: TutorialPage('loop',
      'block',
      'Loop Block',
      'Loops through a sequence of TBlocks a set amount of times'),
    tail: TutorialPage('tail',
      'block',
      'Loop Block',
      'Loops through a sequence of TBlocks a set amount of times'),
  }


  return tutorialData;
}();
