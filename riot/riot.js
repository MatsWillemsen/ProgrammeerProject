"use strict";

var request = require('request');
var util = require('util');
var jsonfile = require('jsonfile');


var RiotAPI = class RiotAPI {
  constructor(apikey) {
    this.apikey = apikey;
    this.calls = 0;
  }
  doMethod(method, args) {
    if(method == 'matchInfo') {
      var url = `https://euw.api.pvp.net/api/lol/${args.region}/v2.2/match/${args.matchid}?includeTimeline=true&api_key=${this.apikey}`
    }
    else if(method == 'playerLeague') {
      var url = `https://euw.api.pvp.net/api/lol/${args.region}/v2.5/league/by-summoner/${args.summonerid}?includeTimeline=true&api_key=${this.apikey}`
    }
    else if(method == 'matchList') {
      var url = `https://euw.api.pvp.net/api/lol/${args.region}/v2.2/matchlist/by-summoner/${args.summonerid}?rankedQueues=RANKED_SOLO_5x5&api_key=${this.apikey}`
    }
    else if(method == 'league') {
      var url = `https://euw.api.pvp.net/api/lol/${args.region}/v2.5/league/${args.league}?type=RANKED_SOLO_5x5&api_key=${this.apikey}`
    }
    else if(method == 'champions') {
      var url = `https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?api_key=${this.apikey}`
    }
    this.calls += 1;
    return new Promise(function(resolve, reject) {
      request.get({url: url, json: true}, function(err, response, body) {
        if(err) {
          reject(err);
        }
        else {
          resolve(body);
        }
      });
    });
  }
}

var RiotParser = class RiotParser {
  constructor(api) {
    this.api = api;
  }
  parseKillFrames(matchdata) {
    var data = [];
    var playerData = {};
    if(!matchdata.participants) {
      return data;
    }
    matchdata.participants.forEach(function(participant) {
      playerData[participant.participantId] = {
        champion: participant.championId
      }
    });
    if(matchdata.timeline) {
      matchdata.timeline.frames.forEach(function(frame, minute) {
        if(frame.events) {
          frame.events.forEach(function(event) {
            if(event.eventType == 'CHAMPION_KILL') {
              if(event.killerId != 0) {
                data.push({
                  league: 'silver',
                  minute: minute,
                  type: 'kill',
                  xposition: event.position.x,
                  yposition: event.position.y,
                  killerchamp: playerData[event.killerId].champion,
                  victimchamp: playerData[event.victimId].champion
                });
              }
            }
          })
        }
      })
    }
    return data;
  }
  getKillData(matches) {
    var data = [];
    var written = 0;
    var that = this;
    return new Promise(function(resolve, reject) {
      matches.forEach(function(match) {
        that.api.doMethod('matchInfo', {
          region: 'euw',
          matchid: match
        }).then(function(matchdata) {
          data = data.concat(that.parseKillFrames(matchdata));
          written += 1;
          console.log(written, matches.length);
          if(written >= matches.length - 5) {
            resolve(data);
          }
        }, function(err) {
          reject(err);
        })
      })
    })
  }
  writeMatchData(summoner) {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.api.doMethod('matchList', {
        region: 'euw',
        summonerid: summoner
      }).then(function(matchlist) {
        var matchids = [];
        for(var i = 0; i < matchlist.matches.length; i++) {
          matchids.push(matchlist.matches[i].matchId);
        }
        matchids = matchids.slice(0, 100);
        that.getKillData(matchids).then(function(data) {
          jsonfile.writeFileSync('matchdata.json', data);
          resolve(true);
        }, function(err) {
          reject(err);
        });
      })
    })
  }
  writeChampionData() {
    var that = this;
    var champions = [];
    return new Promise(function(resolve, reject) {
      that.api.doMethod('champions', {
        region: 'euw'
      }).then(function(championData) {
        for(var key in championData.data) {
          champions.push({
            id : championData.data[key].id,
            name: championData.data[key].name
          })
        }
        jsonfile.writeFileSync('champions.json', champions);
        resolve(true);
      }, function(err) {
        reject(err);
      })
    })
  }
  parseSeedData() {
    var that = this;
    return new Promise(function(resolve, reject) {
      jsonfile.readFile('riot/matches1.json', function(err, matches) {
        matches = matches.matches;
        var data = [];
        matches.forEach(function(match) {
          data = data.concat(that.parseKillFrames(match));
        })
        jsonfile.writeFileSync('matchdata.json', data);
        resolve(data);
      })
    })
  }
}
exports.api = RiotAPI;
exports.parser = RiotParser;

/*
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
}*/
