//This script parses out the oauth results and stores them
var url = unescape(window.location.href.match(/from=([^&]+)/)[1]);

console.log(url);

//Need to get the oauth object into here.  
var message = url.split("#")[1];

//alert (message);
var backgroundPage = chrome.extension.getBackgroundPage();

var oauthResults = backgroundPage.oauthResults;

oauthResults.access_token = decodeURIComponent(message.match(/.*access_token=([^&]*)&.*/)[1]);
oauthResults.instance_url = decodeURIComponent(message.match(/.*instance_url=([^&]*)&.*/)[1]);
oauthResults.id_url = decodeURIComponent(message.match(/.*id=([^&]*)&?.*/)[1]);
oauthResults.issued_at = decodeURIComponent(message.match(/.*issued_at=([^&]*)&.*/)[1]);
oauthResults.refresh_token = decodeURIComponent(message.match(/.*refresh_token=([^&]*)&.*/)[1]);

backgroundPage.storeCredentials(oauthResults);

var loginNotification = webkitNotifications.createNotification('/icon32.png', // image.
'Success!', // title.
'You have logged in to Chatter!' // body.
);
loginNotification.show();

// close notification
setTimeout(function() {
    loginNotification.cancel();
}, 7000);

chrome.tabs.getCurrent(function(tab) {
    chrome.tabs.remove(tab.id);
});