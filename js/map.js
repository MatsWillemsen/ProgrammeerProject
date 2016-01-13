d3.json('matchdata.json', function(data) {

  var domain = {
    min: {x: -120, y: -120},
    max: {x: 14870, y: 14980}
  }
  var xscale = d3.scale.linear()
    .domain([domain.min.x, domain.max.x])
    .range([0, 512])

  var yscale = d3.scale.linear()
    .domain([domain.min.y, domain.max.y])
    .range([512, 0])

  
  data.forEach(function(d) {
    d.minute = d.minute;
    d.x = xscale(d.xposition);
    d.y = yscale(d.yposition);
    d.value = 1;
  });

  var dx = crossfilter(data);
  var all = dx.groupAll()
  var minuteDimension = dx.dimension(function(d) {return d.minute});
  minuteDimension.filter([0, 100])

  var championDimension = dx.dimension(function(d) { return d.killerchamp});
  var minuteGroup = minuteDimension.group();


  var svg = d3.select('#minimap').append('svg:svg')
    .attr('width', 512)
    .attr('height', 512)

  var mapimage = svg.append('image')
    .attr('xlink:href', 'https://s3-us-west-1.amazonaws.com/riot-api/img/minimap-ig.png')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', 512)
    .attr('height', 512)

  var circlessvg = svg.append('svg:g');
  var heat = simpleheat('canvas');
  var updateData = function(data) {
    heat.clear();

    var heatmapdata = [];
    data.forEach(function(data) {
      heatmapdata.push([
        data.x,
        data.y,
        data.value
      ])
    })
    heat.data(heatmapdata);
    heat.max(Math.ceil(data.length / 525));
    heat.radius(5, 10);
    heat.draw();
  }


  updateData(data);
  var actionChart = dc.barChart('#minuteChart');
  var ww = document.getElementById("minuteChart").clientWidth
  actionChart.width(ww)
             .height(50)
             .margins({top: 0, right: 0, bottom: 20, left: 0})
             .on('filtered', function(chart, filter) {
               updateData(minuteDimension.top(Infinity))
             })
             .dimension(minuteDimension)
             .group(minuteGroup)
             .centerBar(true)
             .gap(1)
             .elasticY(true)
             .x(d3.scale.linear().domain([0,50]))
             .yAxis().ticks(0)



  dc.renderAll();
  dc.redrawAll();
  d3.json('champions.json', function(data) {
    var championList = d3.select('#champions').selectAll('img').data(data);
    championList.enter().append('img')
      .attr('src',function(d) { console.log(d); return 'http://ddragon.leagueoflegends.com/cdn/6.1.1/img/champion/' + d.image})
      .attr('width', 50)
      .attr('height', 50)
      .on('click', function(d, i) {
        championDimension.filterExact(d.id);
        updateData(minuteDimension.top(Infinity));
        dc.redrawAll();
      })
  })
})
