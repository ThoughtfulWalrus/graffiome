'use strict';

// helper function to determine what the current tab is and perform a callback on that tabID value
var getCurrentTabID = function(callback) {
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    var currentTabId = tabs[0].id;
    callback(currentTabId);
  });
};

// getStatus takes a callback and applies it to the status of the current tab
// it queries the current tab for the status of the app on that tab
var getStatus = function(callback) {
  getCurrentTabID(function(tabID) {
    chrome.tabs.sendMessage(tabID, {getStatus: true}, function(res) {
      callback(res.status, tabID);
    });
  });
};

// generic send tab message function, telling the content script to change from
// the current status to the opposite
var sendTabMessage = function(status, tabID) {
 var msg;
 if (status === 'off') {
   msg = 'on';
 } else {
   msg = 'off';
 }
 chrome.tabs.sendMessage(tabID, {toggle: msg}, function(res){
   console.log('toggleStatus:', res);
 });
};

// Begin Angular Module
angular.module('graffio.mainController', ['firebase', 'ngFx'])
.controller('mainController', function($scope, $state) {
  var ref = new Firebase(FIREBASE_CONNECTION);

  $scope.logout = function() {
    ref.unauth();
    chrome.runtime.sendMessage({action: 'clearToken'});
    $state.go('login');
  };
}).controller('onOffController', function($scope){
  // initialize text before we can query the current tab
  $scope.onOffButtonTxt = 'loading...';
  $scope.highlightBtnTxt = 'loading...';


  // generic UI update function for the status of the app
  // needs to use $scope.$apply since these callback functions otherwise wouldn't trigger a $digest event
  // even though they would update the $scope variable values...
  // $scope.$apply triggers the $digest, which in turn is what causes a UI update
  var setStatusUi = function(status) {
    console.log('setStatusUI called...');
    console.log('setStatusUI status: ', status);
    $scope.$apply(function() {
      if (status === 'off') {
        $scope.onOffButtonTxt = 'On';
      } else {
        $scope.onOffButtonTxt = 'Off';
      }
    });
  };

  // function called when button is pressed by user wishing to toggle the current state
  $scope.toggleStatus = function() {

    // figure out what existing state is from the content script
    getStatus(function(status, tabID) {
      // send a message to the tab and also set the current button value to be the opposite
      // ie. if a user clicks 'On' it should send a message telling the app to start drawing
      // and also change the UI here to indicate that the next click will turn the app off
      sendTabMessage(status, tabID);
      if (status === 'off') {
        setStatusUi('on');
      } else {
        setStatusUi('off');
      }
    });
  };

  $scope.getHighlighterStatus = function(){
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      var currentTabId = tabs[0].id;
      // Figure out what the current state of the highlighter is
      chrome.tabs.sendMessage(currentTabId, {getHighlighterStatus: true}, function(res) {
        // I should get back highlighter from canvas here.
        // It will have toggled
        $scope.$apply(function() {
          if (res.status === true) {
            $scope.highlightBtnTxt = 'On';
          } else {
            $scope.highlightBtnTxt = 'Off';
          }
        });
      });
    });
  };

  $scope.toggleHighlighter = function() {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      var currentTabId = tabs[0].id;
      // Figure out what the current state of the highlighter is
      chrome.tabs.sendMessage(currentTabId, {toggleHighlighterStatus: true}, function(res) {
        // I should get back highlighter from canvas here.
        // It will have toggled
        $scope.$apply(function() {
          if (res.status === true) {
            $scope.highlightBtnTxt = 'On';
          } else {
            $scope.highlightBtnTxt = 'Off';
          }
        });
      });
    });
  };

  console.log('initial get status called...');
  // Initial call to getStatus to figure out what status the page was in last.
  $scope.getHighlighterStatus();

  getStatus(function(status) {
    setStatusUi(status);
    console.log('status set');
  });

}).controller('paletteController', function($scope){

  $scope.erase = function(){
    getCurrentTabID(function(activeTab){
      chrome.tabs.sendMessage(activeTab, {erase: true}, function(res) {
        console.log(res)
      });
    });
  };

  $scope.changeColor = function(event){
    var color = angular.element(event.target).attr('class').split(' ')[0]
    getCurrentTabID(function(activeTab){
      chrome.tabs.sendMessage(activeTab, {changeColor: color}, function(res) {
        console.log(res)
      });
    });
  };

  $scope.nyan = function(){
    getCurrentTabID(function(activeTab){
      chrome.tabs.sendMessage(activeTab, {image: 'static/nyan.gif'}, function(res) {
        console.log(res)
      });
    });
  };

}).controller('groupController', function($scope, $firebaseArray){
  var ref = new Firebase(FIREBASE_CONNECTION + '/users');
  var user = ref.getAuth().uid.replace(':','');

  $scope.groups = null;
  $scope.newGroup = '';
  $scope.groupsLoaded = false;

  $scope.addGroup = function(){
    // Try to find the index of the new group name to add
    var isNewGroup = $scope.groups.map(function(group) {
                          return group.name;
                        }).indexOf($scope.newGroup);

    // Only add the group if it is not empty and it doesnt already exist
    if($scope.newGroup !== '' && isNewGroup === -1) {
      $scope.groups.$add({name: $scope.newGroup});
      $scope.newGroup = '';
    }
  };

  $scope.removeGroup = function() {
    var indexToRemove = $scope.groups.indexOf(this.group)
    $scope.groups.$remove(indexToRemove);
  };

  $firebaseArray(ref.child(user).child('groups')).$loaded()
    .then(function(list){
      $scope.groups = list;
      $scope.groupsLoaded = true;
    });
});


//
