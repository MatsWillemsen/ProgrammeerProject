(function() {
  var RiotAPI, request;

  request = require('request');

  RiotAPI = (function() {
    function RiotAPI(apikey) {
      this.apikey = apikey;
    }

    RiotAPI.prototype.getMatchInfo = function(region, matchid) {
      return new Promise(function(resolve, reject) {});
    };

    return RiotAPI;

  })();

}).call(this);
