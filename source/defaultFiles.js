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
  var defaultFiles = {};
  var app = require('./appMain.js');
  var defaultPages = [
    { title: 'docA', text: `()`},
    { title: 'docB', text: `(
    (chain x:80 y:160 (
      (identity start:'click' deviceName:'-?-' bus:'ble')
      (picture pix:(0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 0 0 0 1 0 1 1 1 0))
      (picture pix:(0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 1 1 0 1 0 0 0 1))
      (picture pix:(0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 1 1 1 1 0 0 0 0 0))
      (picture pix:(0 1 0 1 0 0 0 0 0 0 0 1 1 1 0 1 0 0 0 1 0 1 1 1 0))
    )))`},
    { title: 'docC', text: `(
      (chain x:80 y:160 (
        (identity start:'click' deviceName:'-?-' bus:'ble')
        (loop count:'25' (
          (picture pix:(1 1 1 1 1 1 0 0 0 1 1 0 0 0 1 1 0 0 0 1 1 1 1 1 1))
          (picture pix:(0 0 0 0 0 0 1 1 1 0 0 1 0 1 0 0 1 1 1 0 0 0 0 0 0))
          (picture pix:(0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0))
        ))
      )))`},
    { title: 'docD', text: `(
      (chain x:80 y:160 (
        (identity start:'click' deviceName:'-?-' bus:'ble')
        (sound description:'C4' period:'1/4')
        (sound description:'E4' period:'1/4')
        (sound description:'G4' period:'1/4')
        (sound description:'E4' period:'1/4')
        (sound description:'C4' period:'1/4')
      )))`},
    { title: 'docE', text: `(
      (chain x:80 y:160 (
        (identity start:'click' deviceName:'-?-' bus:'ble')
        (motor speed:50 duration:0)
        (motor speed:'100' duration:0)
        (motor speed:50 duration:0)
        (motor speed:'0' duration:0)
        (motor speed:'-50' duration:0)
        (motor speed:'-100' duration:0)
        (motor speed:'-50' duration:0)
      )))`}
  ];

  defaultFiles.setupDefaultPages = function(force) {
    for(var i = 0; i < defaultPages.length; i++) {
      var page = defaultPages[i];
      if (force || app.storage.getItem(page.title) === null) {
        app.storage.setItem(page.title, page.text);
      }
    }
  };

  return defaultFiles;
}();
