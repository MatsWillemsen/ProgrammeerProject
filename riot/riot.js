var request = require('request');
var util = require('util');

var apikey = 'a2fff1e3-fdad-47e4-a4c8-2b39d2ef9b80'

exports.getMatchInfo = function(region,matchid, cb) {
  var url = util.format('https://euw.api.pvp.net/api/lol/%s/v2.2/match/%d?includeTimeline=true&api_key=%s', region, matchid, apikey);
  request.get({url : url, json: true}, function(err, response, body) {
    cb(err, response, body);
  });
}

exports.getPlayerLeague = function(region, player, cb) {
  var url = util.format('https://euw.api.pvp.net/api/lol/%s/v2.5/league/by-summoner/%d?includeTimeline=true&api_key=%s', region, player, apikey);
  request.get({url : url, json: true}, function(err, response, body) {
    cb(err, response, body);
  });
}

exports.getMatchList = function(region, player, cb) {
  var url = util.format('https://euw.api.pvp.net/api/lol/%s/v2.2/matchlist/by-summoner/%d?rankedQueues=RANKED_SOLO_5x5&api_key=%s', region, player, apikey);
  request.get({url : url, json: true}, function(err, response, body) {
    cb(err, response, body);
  });
}

exports.getLeague = function(region, league, cb) {
  var url = util.format('https://euw.api.pvp.net/api/lol/%s/v2.5/league/%s?type=RANKED_SOLO_5x5&api_key=%s', region, league, apikey);
  console.log(url);
  request.get({url : url, json: true}, function(err, response, body) {
    cb(err, response, body);
  });
}
