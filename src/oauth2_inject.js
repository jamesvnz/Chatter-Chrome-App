/**
 * @author James Valentine
 * Taken from: https://github.com/borismus/oauth2-extensions/blob/master/lib/oauth2_inject.js
 * based on: http://smus.com/oauth2-chrome-extensions
 */

// This script serves as an intermediary between the the oauth result and our processing of it. 

// Get all ? params from this URL
var url = window.location.href;

//Only intercept responses that are actually for us by using the state variable in the response URL
if (url.indexOf('chatter_demonstration') > 0) {
	
	var params = url.substring(url.indexOf('#'));

	// Also append the current URL to the params
	params += '&from=' + encodeURIComponent(url);

	// Redirect back to the extension itself so that we have priveleged
	// access again
	var redirect = chrome.extension.getURL('oauth_result.html');
	window.location = redirect + params;

}
