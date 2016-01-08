d3.json('matchdata.json', function(data) {
  data.forEach(function(d) {
    d.minute = d.minute;
    d.x = d.xposition;
    d.y = d.yposition;
    d.value = 1;
  });

  var dx = crossfilter(data);
  var all = dx.groupAll()
  var minuteDimension = dx.dimension(function(d) {return d.minute});
  minuteDimension.filter([0, 100])

  var championDimension = dx.dimension(function(d) { return d.killerchamp});
  var minuteGroup = minuteDimension.group();

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

  var heatmap = h337.create({
    container: document.querySelector('#minimap')
  })
  var updateData = function(data) {
    var heatmapdata = [];
    data.forEach(function(data) {
      heatmapdata.push({
        x : xscale(data.x),
        y : yscale(data.y),
        value: data.value
      })
    })
    heatmap.setData({
      max: 70,
      data: heatmapdata
    });
    /*
    console.log(hexbin(data)[0]);
    var circles = circlessvg.selectAll('.hexagon').data(hexbin(data)[0]);
    circles.enter().append('path')
      .attr('class','hexagon')
      .attr('d',hexbin.hexagon())
      .attr("transform", function(d) { console.log(d.x); return "translate(" + xscale(d.x) + "," + yscale(d.y) + ")"; })
    circles.exit().remove()
    */
    /*
    var circles = circlessvg.selectAll('circle').data(data);
    circles.enter().append("svg:circle")
                .attr('cx', function(d) { return xscale(d.x) })
                .attr('cy', function(d) { return yscale(d.y) })
                .attr('r', 5)
                .attr('class', 'kills')
    circles.exit().remove();*/
  }


  updateData(data);
  var actionChart = dc.barChart('#minuteChart');

  actionChart.width(800)
             .height(50)
             .margins({top: 0, right: 50, bottom: 20, left: 40})
             .on('filtered', function(chart, filter) {
               updateData(minuteDimension.top(Infinity))
             })
             .dimension(minuteDimension)
             .group(minuteGroup)
             .centerBar(true)
             .gap(1)
             .x(d3.scale.linear().domain([0,65]))
             .yAxis().ticks(0)


  dc.renderAll();
  dc.redrawAll();
  d3.json('champions.json', function(data) {
    console.log(data);
    var dropdown = d3.select('#championDropdown').selectAll('a').data(data);
    dropdown.enter().append('a')
      .attr('class','dropdown-item')
      .attr('href','#')
      .attr('data-id', function(d) { return d.id })
      .text(function(d) { return d.name; })
      .on('click', function(d, i) {
        championDimension.filterExact(d.id);
        updateData(minuteDimension.top(Infinity));
        dc.redrawAll();
      })
  })
})
