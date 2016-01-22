var RiotAPI = require('./riot.js');
var jsonfile = require('jsonfile');
var needle = require('needle');
var _ = require('underscore');


var summonerId = 44386842;
var api = new RiotAPI.api('a2fff1e3-fdad-47e4-a4c8-2b39d2ef9b80');
var parser = new RiotAPI.parser(api);
/*
parser.writeChampionData().then(function(data) {
  console.log(data);
}, function(err) {
  console.error(err);
})*/

/*
parser.writeMatchData(summonerId).then(function(data) {
  console.log(data);
}, function(err) {
  console.error(err);
})
*/

parser.parseSeedData().then(function(data) {
})
/*
api.doMethod('league', {
  region : 'euw',
  league: 'challenger'
}).then(function(body) {
  console.log(body);
}, function(err) {
  console.err(err);
});

/*
var writeKillData = function(matches, cb) {
  var data = []
  var written = 0
  matches.forEach(function(match) {
    riot.getMatchInfo('euw', match, function(err, response, body) {
      var killdata = []
      if(body.timeline) {
        var frames = body.timeline.frames;
        frames.forEach(function(frame, minute) {
          if(frame.events) {
            frame.events.forEach(function(event) {
              if(event.eventType == 'CHAMPION_KILL') {
                killdata.push({
                  league: 'silver',
                  minute: minute,
                  type: 'kill',
                  xposition: event.position.x,
                  yposition: event.position.y,
                });
              }
            })
          }
        });
        data.push(killdata);
      }
      written += 1;
      if(matches.length == written)
      {
        cb(data);
      }
    })
  })
}
var getLeagueData = function(league, cb) {
  riot.getPlayerLeague('euw',summonerId, function(err, response, body) {
    var playerids = []
    body[summonerId][0].entries.forEach(function(entry) {
      playerids.push(entry.playerOrTeamId);
    })
  })
}
var getMatches = function() {
  riot.getMatchList('euw',summonerId, function(err, response, body) {
    matches = _(body.matches).map(function(match) {
      return match.matchId;
    });
    matches = _(matches).last(300);
    writeKillData(matches, function(data) {
      jsonfile.writeFile('matches.json', data, function(err) {
        console.error(err);
      });
    })
  })
}
getMatches();

/*
riot.getMatchInfo('euw',[2450803562, 2450803563], function(err, response, body) {
  console.log(body);
});
*/
