'use strict';
var userToken = null;

var ref = new Firebase(FIREBASE_CONNECTION);

var registeredSites = {}; //firebase event listener

// inform all tabs that the token as changed
var broadcastData = function(site, user, data) {
  console.log('broadcasting', site, user, data);
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab){
      chrome.tabs.sendMessage(tab.id, {canvasData: true, site: site, user: user, data: data});
    });
  });
};

var getCurrentUser = function() {
  return ref.getAuth() ? ref.getAuth().uid.replace(':','') : null;
};

var getCurrentUserGroups = function () {
  var currentUser = getCurrentUser();
  var currentUserGroupsArray = [];
  var currentUserGroupsDbPath = ref.child('users').child(currentUser).child('groups');

  currentUserGroupsDbPath.on("value", function(snapshot) {
    var groups = snapshot.val();  
    for (var group in groups) {
      //console.log(groups[group].name);
      var test = groups[group].name;
      currentUserGroups.push(test);        
    }
    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
  });

  return currentUserGroupsArray;
};
var currentUserGroups = getCurrentUserGroups();


var getActiveUserGroup = function () {

  var activeGroup = {};
  var currentUserGroupsDbPath = ref.child('users').child(getCurrentUser()).child('groups');

  currentUserGroupsDbPath.on("value", function(snapshot) {
    var groups = snapshot.val();  
      for (var group in groups) {            
        if (group === 'active') {
          activeGroup['active'] = groups[group]
          console.log(activeGroup);
        }
      }
  }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
  });
}

getActiveUserGroup();

var saveUserCanvas = function(site, data) {
  if (getCurrentUser()){
    ref.child('web/data/sites').child(site).child('users').child(getCurrentUser()).set(data);

    return true;
  } else {
    return false;
  }
};

var registerSite = function(site) {
  console.log('registering site', site);
  if (!registeredSites[site]){
    registeredSites[site] = {count: 0, listener: null};
  }
  if (registeredSites[site].count <= 0) {
    registeredSites[site].count = 1;

    registeredSites[site].listener = ref.child('web/data/sites').child(site).child('users').on('value',
      function (snapshot) {
      
        var FBData = snapshot.val();
        for (var user in FBData) {
          
          broadcastData(site, user, FBData[user]);
        }
      });


  } else {
    registeredSites[site] += 1;
    ref.child(site).once('value', function (snapshot) {
      var FBData = snapshot.val();
      for (var user in FBData) {
        broadcastData(site, user, FBData[user]);
      }
    });
  }
};

var unregisterSite = function(site) {
  console.log('unregistering site', site);
  if (registeredSites[site]) {
    registeredSites[site].count -= 1;
  }
  if (registeredSites[site].count <= 0){
    registeredSites[site].count = 0;
    ref.child(site).off('value', registeredSites[site].listener);
  }
};

var loginUser = function(token) {
  ref.authWithCustomToken(token, function(error) {
    if (error) {
      console.log('Login Failed!', error);
    }
  });
};

var logoutUser = function() {
  ref.unauth();
};

// Listener for messages coming to the background script
chrome.runtime.onMessage.addListener(function(request,sender,sendResponse) {
  if (request.action === 'setToken') { // if it's setting the token, change that variable
    loginUser(request.token);
  } else if (request.action === 'clearToken') { // Deauthenticate the user
    logoutUser();
  } else if (request.action === 'getToken') { // if it's requesting the token, return it
    sendResponse({token: userToken});
  } else if (request.action === 'getUser') { // if it's requesting the token, return it
    sendResponse({user: getCurrentUser()});
  } else if (request.action === 'saveCanvas') {
    sendResponse({saveStatus: saveUserCanvas(request.site, request.data)});
  } else if (request.action === 'startSiteData') {
    registerSite(request.site);
  } else if (request.action === 'stopSiteData') {
    unregisterSite(request.site);
  }
});
