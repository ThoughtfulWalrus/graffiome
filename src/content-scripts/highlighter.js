'use strict';

var tabUrl = window.location.href.toString();
var selection = window.getSelection();
var ranges;

var Color = 'Yellow';
var Highlighter = rangy.createHighlighter();

var Red = rangy.createClassApplier('Red');
var Blue = rangy.createClassApplier('Blue');
var Green = rangy.createClassApplier('Green');
var Pink = rangy.createClassApplier('Pink');
var Aqua = rangy.createClassApplier('Aqua');
var Yellow = rangy.createClassApplier('Yellow');

Highlighter.addClassApplier(Red);
Highlighter.addClassApplier(Blue);
Highlighter.addClassApplier(Green);
Highlighter.addClassApplier(Pink);
Highlighter.addClassApplier(Aqua);
Highlighter.addClassApplier(Yellow);

// var reloadHighlights = function(){
//   chrome.storage.local.get( function (storage) {
//     if (storage[tabUrl]){
//       ranges = storage[tabUrl];
//       Highlighter.deserialize(ranges);
//     }
//   });
// };


var saveUserHighlights = function(ranges){
  chrome.runtime.sendMessage(
    {action: 'saveUserHighlights', site: tabUrl, data: ranges},
    function(response) {
      if (response.saveStatus) {
        console.log('saving user highlights');
      } else {
        console.log('failed to save highlights');
    }
  });
};

// // Message Listener
// chrome.runtime.onMessage.addListener(
//   function (request, sender, sendResponse) {
//    if (request.color) {
//     Color = request.color;
//    }
//    if (request.remove) {
//     console.log('remove')
//     Highlighter.removeAllHighlights();
//     ranges = Highlighter.serialize();
//     saveHighlights(ranges);
//    }
//   }
// );

$(function() {
  // reloadHighlights();
  $('body').mouseup( function() {
    if ( selection.type === "Range" ){
      Highlighter.highlightSelection(Color);
      ranges = Highlighter.serialize();
      saveUserHighlights(ranges);
    }
  });
});
