'use strict';

var tabUrl = CryptoJS.SHA1(window.location.href).toString();
var selection = window.getSelection();
var highlighterOn = false;
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

var reloadHighlights = function(){
  chrome.runtime.sendMessage(
    {action: 'reloadUserHighlights', site: tabUrl},
    function(response) {
      if (response.ranges) {
        console.log('RANGE!!!');
        Highlighter.deserialize(response.ranges);
      } else {
        console.log('failed to load highlights');
    }
  });


  // chrome.storage.local.get( function (storage) {
  //   if (storage[tabUrl]){
  //     ranges = storage[tabUrl];
  //     Highlighter.deserialize(ranges);
  //   }
  // });
};

var setHighlighterListener = function(highlighterOn){
  if( highlighterOn ){
    $('body').mouseup( function() {
      if ( selection.type === 'Range' ){
        console.log(Highlighter);
        Highlighter.highlightSelection(Color);
        ranges = Highlighter.serialize();
        saveUserHighlights(ranges);
      }
    });
  } else {
    $('body').off('mouseup');
  }
};

var saveUserHighlights = function(ranges){
  console.log('from saveUserHighlights: ', ranges);
  var cb =  function(response) {
      if (response.saveStatus) {
        console.log('saving user highlights');
      } else {
        console.log('failed to save highlights');
    }
  };

  var request = {action: 'saveUserHighlights', site: tabUrl, data: ranges};


  chrome.runtime.sendMessage(request, cb);
};

// Message Listener
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if ( request.getHighlighterStatus === true){
      sendResponse({status:highlighterOn});
    } else if ( request.toggleHighlighterStatus === true){
      highlighterOn = !highlighterOn;
      setHighlighterListener(highlighterOn);

      sendResponse({status:highlighterOn});
    }



   // if (request.color) {
   //  Color = request.color;
   // }
   // if (request.remove) {
   //  console.log('remove')
   //  Highlighter.removeAllHighlights();
   //  ranges = Highlighter.serialize();
   //  saveHighlights(ranges);
   // }
  }
);



$(function() {
  reloadHighlights();
  // $('body').mouseup( function() {
  //   if ( selection.type === 'Range' ){
  //     console.log(Highlighter);
  //     Highlighter.highlightSelection(Color);
  //     ranges = Highlighter.serialize();
  //     saveUserHighlights(ranges);
  //   }
  // });
});
