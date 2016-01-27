var RiotAPI = require('./riot.js');
var jsonfile = require('jsonfile');
var needle = require('needle');
var _ = require('underscore');

var api = new RiotAPI.api('a2fff1e3-fdad-47e4-a4c8-2b39d2ef9b80');
var parser = new RiotAPI.parser(api);

parser.writeChampionData().then(function(data) {
  //console.log(data);
}, function(err) {
  console.error(err);
})