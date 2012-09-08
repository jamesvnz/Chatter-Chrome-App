/**

This script is the AngularJS controller. It interacts with the Background page.

Copyright 2012, James Valentine, Fronde Systems Group, www.fronde.com

*/

//Use the Chrome API to retrieve the Background Page
var backgroundPage = chrome.extension.getBackgroundPage();

function FeedController($scope) {

	$scope.feed = backgroundPage.feed;

	$scope.oauthResults = backgroundPage.oauthResults;

	$scope.infoText = null;
  $scope.errorText = null;

  $scope.login = function() {
      backgroundPage.doLogin();
  };

  $scope.logout = function() {
      backgroundPage.doLogout(function(){
        $scope.feed = null;
        $scope.infoText = "Successfully Logged out."
        $scope.$apply();
      });
  };

  //Refreshes the News Feed. Has both success and error callbacks.
  $scope.refresh = function(isBackground) {

      $scope.infoText = "Refreshing...";

      backgroundPage.getNewsFeed(
          function(data) {
            backgroundPage.feed = data;
            $scope.feed = data;
            $scope.infoText = "Refresh successful";

            //Clear the text after a few seconds.
            setTimeout(function(){
                $scope.infoText = null;
                $scope.$apply();
              }, 10000);

            $scope.$apply();
          },
          function(message) {
            $scope.errorText = "Error refreshing: " + message;
            $scope.$apply();
          }
        );
  };

  //Simple helper to use the Jquery Timeago plugin to format Days
  //Turns a date into a "2 hours ago" style string.
  $scope.formatTimeago = function(dateString) {
    if (dateString) {
          return jQuery.timeago(dateString);
      }
      return "never"
  };

  //To display Chatter Feed Data properly we need to strip out the HTML special characters.
  $scope.deentitize = function(input) {

      if (input == null) {
        return null;
      }

      var ret = input.replace(/&gt;/g, '>');
      ret = ret.replace(/&lt;/g, '<');
      ret = ret.replace(/&quot;/g, '"');
      ret = ret.replace(/&apos;/g, "'");
      ret = ret.replace(/&amp;/g, '&');
      ret = ret.replace(/&#39;/g, "'");
      return ret;
  };

  //This section causes the automatic refreshing to run every 30 seconds.
  setInterval(function() {
      if ($scope.oauthResults.access_token != null) {
          console.log("refreshing....")
          $scope.refresh(true);
      }
  }, 30000);


}