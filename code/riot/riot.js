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
      var url = `https://global.api.pvp.net/api/lol/static-data/euw/v1.2/champion?champData=all&api_key=${this.apikey}`
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
  getTeamLeague(participants) {
    let leagues = ["UNRANKED", "BRONZE", "SILVER", "GOLD","PLATINUM","DIAMOND","MASTER"]
    let scores = []
    participants.forEach(function(participant) {
      let score = leagues.indexOf(participant.highestAchievedSeasonTier)
      if(score > -1) {
        scores.push(score);
      }
    })
    let avgScore = scores.reduce( (p, c) => p + c, 0) / scores.length;
    return leagues[Math.ceil(avgScore)]
  }
  parseKillFrames(matchdata) {
    var data = [];
    var golddata = [];
    var positiondata = [];
    var playerData = {};
    var league = this.getTeamLeague(matchdata.participants);
    if(!matchdata.participants) {
      return data;
    }
    matchdata.participants.forEach(function(participant) {
      var role = "";
      if(participant.timeline.role){
        if(participant.timeline.role == "DUO_CARRY")
        {
          role = "ADC"
        }
        else if(participant.timeline.role == "DUO_SUPPORT")
        {
          role = "SUPPORT";
          console.log('SUPPORT', participant);
        }
        else {
          role = participant.timeline.lane
        }
      }
      else {
        console.log('NO ROLE', participant);
      }
      playerData[participant.participantId] = {
        champion: participant.championId,
        role: role
      }
    });
    if(matchdata.timeline) {
      matchdata.timeline.frames.forEach(function(frame, minute) {
        if(frame.participantFrames) {
          var minuteGold = 0;
          for(var index in frame.participantFrames) {
            var curFrame = frame.participantFrames[index];
            if(curFrame.position) {
              positiondata.push({
                league: league,
                minute: minute,
                xposition: curFrame.position.x,
                yposition: curFrame.position.y,
                champion: playerData[curFrame.participantId].champion,
                role: playerData[curFrame.participantId].role
              })              
            }
            minuteGold += curFrame.totalGold;
          }
          golddata.push({
            league: league,
            minute: minute,
            gold: minuteGold
          })

        }
        if(frame.events) {
          frame.events.forEach(function(event) {
            if(event.eventType == 'CHAMPION_KILL') {
              if(event.killerId != 0) {
                data.push({
                  league: league,
                  minute: minute,
                  type: 'kill',
                  xposition: event.position.x,
                  yposition: event.position.y,
                  killerchamp: playerData[event.killerId].champion,
                  victimchamp: playerData[event.victimId].champion,
                  role: playerData[event.killerId].role
                });
              }
              if(event.assistingParticipantIds) {
                event.assistingParticipantIds.forEach(function(participant) {
                  data.push({
                    league: league,
                    minute: minute,
                    type: 'assist',
                    xposition: event.position.x,
                    yposition: event.position.y,
                    killerchamp: playerData[participant].champion,
                    victimchamp: playerData[event.victimId].champion,
                    role: playerData[participant].role
                  })
                })
              }
            }
          })
        }
      })
    }
    return [data, golddata, positiondata];
  }
  getKillData(matches) {
    var data = [];
    var golddata = [];
    var written = 0;
    var that = this;
    return new Promise(function(resolve, reject) {
      matches.forEach(function(match) {
        that.api.doMethod('matchInfo', {
          region: 'euw',
          matchid: match
        }).then(function(matchdata) {
          let parsed = that.parseKillFrames(matchdata);
          data = data.concat(parsed);
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
            name: championData.data[key].name,
            image: championData.data[key].image.full,
            title: championData.data[key].title,
            stats: championData.data[key].stats,
            lore: championData.data[key].lore,
            spells: championData.data[key].spells,
            passive: championData.data[key].passive
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
        var golddata = [];
        var positiondata = [];
        matches.forEach(function(match) {
          let parsed = that.parseKillFrames(match);
          let matchdata = parsed[0]
          let gdata = parsed[1]
          let pdata = parsed[2]
          data = data.concat(matchdata);
          golddata = golddata.concat(gdata);
          positiondata = positiondata.concat(pdata);
        })
        jsonfile.writeFileSync('matchdata.json', data);
        jsonfile.writeFileSync('golddata.json', golddata);
        jsonfile.writeFileSync('positions.json', positiondata);
        resolve(data);
      })
    })
  }
}
exports.api = RiotAPI;
exports.parser = RiotParser;
