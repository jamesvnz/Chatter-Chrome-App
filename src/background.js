/*
 *      background.js
 *      
 *      Copyright 2012 James Valentine <james.valentine@fronde.com>
 *      
 *      This the core background class used to control the extension.
 *      
 */

//let's use v25 in all our requests.
var chatterURI = "/services/data/v25.0/chatter";

/*
 * As per the parameters detailed on this page:
 * https://login.salesforce.com/help/doc/en/remoteaccess_oauth_user_agent_flow.htm
 *
 * Substitute with your own Client ID !!
 */

var oauthParameters = {
    'base_authorise_url': 'https://login.salesforce.com/services/oauth2/authorize',
    'response_type': 'token',
    'client_id': '3MVG9CVKiXR7Ri5pBJcTaPA4.92uNTr69raLq2d7d8OqJzH9RxCmcnKk3Nk6T362h_lVgx9mP8.yhmF__5XZF',
    'redirect_uri': 'https://login.salesforce.com/services/oauth2/success',
    'reauth_url': 'https://login.salesforce.com/services/oauth2/token',
    'scope': 'id chatter_api refresh_token',
    'authorize_tabId': null,
    'state': 'chatter_demonstration'  //we reflect the state to properly intercept the authorisation for our app.
};

//Store the feed in the background page so it doesn't disappear when the page is closed.
var feed = null;

/**
 * Use this to store the login result.
 */
var oauthResults = {
    'access_token': null,
    'instance_url': null,
    'id_url': null,
    'refresh_token': null,
    'issued_at': null,
    'signature': null
};

function buildEmptyOauthResults() {
    oauthResults = {
        'access_token': null,
        'instance_url': null,
        'id_url': null,
        'refresh_token': null,
        'issued_at': null,
        'signature': null
    };
}

/*
 * This Builds the appropriate Auth URL for Salesforce to provide an OAuth token.
 */

function buildAuthURL() {
    return oauthParameters.base_authorise_url + '?response_type=' + oauthParameters.response_type + '&client_id=' + oauthParameters.client_id + '&state=' + oauthParameters.state + '&redirect_uri=' + oauthParameters.redirect_uri + '&scope=' + oauthParameters.scope;
}

/*
 * Open a new window to do the login
 */

function doLogin() {
    chrome.tabs.create({
        'url': buildAuthURL()
    });
}


/*
 * Retrieves the News Feed.
 */

function getNewsFeed(callbackSuccess, callbackError) {
    var url = buildFeedURL();

    getChatterData(url, callbackSuccess, callbackError);
}

/**
 * Helper to build the feed url
 * 
 * We need to append sid=null to stop it conflicting with Salesforce session cookies we may
 * have from our active Salesforce sessions.
 */

function buildFeedURL() {
    return oauthResults.instance_url + chatterURI + "/feeds/news/me/feed-items?sort=LastModifiedDateDesc&sid=null";
}

/**
 *  Revoke the auth token (i.e. Logout)
 */

function revokeAuthToken(oauthToken, callbackSuccess, callbackError) {
    var url = "https://login.salesforce.com/services/oauth2/revoke?token=" + oauthToken;
    getChatterData(url, callbackSuccess, callbackError);
}


/*
 *	This method calls the Chatter API, invoking Success Callback if it works and
 *	Error Callback if something goes wrong.
 *	Authentication errors will cause a re-auth to be attempted.
 */

function getChatterData(url, callbackSuccess, callbackError) {

    if (oauthResults.access_token == null) {
        if (getStoredCredentials() != null) {
            oauthResults = getStoredCredentials();
        } else {
            callbackError("Log in first");
            return;
        }
    }

    $.ajax({
        type: 'GET',
        url: url,
        beforeSend: function(xhr) {
            xhr.setRequestHeader('Content-type', 'application/json');
            xhr.setRequestHeader('Authorization', 'OAuth ' + oauthResults.access_token);
            xhr.setRequestHeader('X-PrettyPrint', 1);
        },
        success: function(data) {
            callbackSuccess(data);
        },
        error: function(xhr, textStatus, errorThrown) {
            if (errorThrown == 'Unauthorized') {
                reauth();
                callbackError("Reauthorisation required, try again.");
            } else {
                var error = JSON.parse(xhr.responseText);
                callbackError(error[0].message);
            }
        }
    });
}


function getStoredCredentials() {

    if (localStorage.oauthCredentials == null) {
        buildEmptyOauthResults()
        storeCredentials(oauthResults);
    }
    return JSON.parse(localStorage.oauthCredentials);
}

function storeCredentials(oauthCredentials) {
    localStorage.oauthCredentials = JSON.stringify(oauthCredentials);
}

function clearCredentials() {
    buildEmptyOauthResults();
    localStorage.oauthCredentials = JSON.stringify(oauthResults);
}

function doLogout(callbackSuccess, callbackError) {
    revokeAuthToken(oauthResults.access_token, callbackSuccess, callbackError);
    clearCredentials();
}

/**
 * Reauthenticate user using the refresh token
 * callback - callback function
 * callbackParams - array with callback function params
 */

function reauth(callback, callbackParams) {
    $.ajax({
        type: 'POST',
        url: oauthParameters.reauth_url,
        data: {
            'grant_type': 'refresh_token',
            'client_id': oauthParameters.client_id,
            'refresh_token': oauthResults.refresh_token
        },
        beforeSend: function(xhr) {
            xhr.setRequestHeader('X-PrettyPrint', 1);
        },
        success: function(data) {
            // update oauth values
            oauthResults.access_token = data.access_token;
            oauthResults.instance_url = data.instance_url;

            storeCredentials(oauthResults);

            // execute callback function
            if (callback != null) {
                callback.apply(null, callbackParams);
            }
        },
        error: function(xhr, textStatus, errorThrown) {
            var error = JSON.parse(xhr.responseText);
            console.log("Error during reauthentication: " + error[0].message);
        }
    });
}


//ensure we have some credentials if they're stored
if (oauthResults == null || oauthResults.access_token == null) {
    if (getStoredCredentials() != null) {
        oauthResults = getStoredCredentials();
    }
}