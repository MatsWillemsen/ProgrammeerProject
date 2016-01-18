class LeagueMap {
  constructor() {
    this.cf = {}
    this.cfg = {}
    this.d3 = {}
    this.charts = {}
    this.selectedChampion = 0;
  }
  prepare(data, golddata) {
    this.d3.domain = {
      min: {x: -120, y: -120},
      max: {x: 14870, y: 14980}
    }
    this.d3.xscale = d3.scale.linear()
      .domain([this.d3.domain.min.x, this.d3.domain.max.x])
      .range([0, 512])
    this.d3.yscale = d3.scale.linear()
      .domain([this.d3.domain.min.y, this.d3.domain.max.y])
      .range([512, 0])
    data.forEach(d => {
      d.minute = d.minute,
      d.x = this.d3.xscale(d.xposition),
      d.y = this.d3.yscale(d.yposition),
      d.value = 1;
    });
    this.cf.dx = crossfilter(data);
    this.cfg.dx = crossfilter(golddata);
    this.cfg.dim = {
      minute: this.cfg.dx.dimension(d => d.minute),
      gold: this.cfg.dx.dimension(d => d.gold)
    }
    this.cf.dim = {
      type: this.cf.dx.dimension(d => d.type),
      minute: this.cf.dx.dimension(d=> d.minute),
      killchampion: this.cf.dx.dimension(d=>d.killerchamp),
      deathchampion: this.cf.dx.dimension(d=>d.victimchamp),
      period: this.cf.dx.dimension(d => {
        if(d.minute < 15) return "Early";
        if(d.minute >= 15 && d.minute <= 25) return "Mid";
        else return "End";        
      })
    }
    this.cf.grp = {
      minute : this.cf.dim.minute.group(),
      period : this.cf.dim.period.group().reduceSum(d => d.value)
    }
    this.cfg.grp = {
      gold: this.cfg.dim.gold.group().reduce((p,v) => {
        ++p.fights
        p.total += (v.gold)
        p.avg = Math.round(p.total / p.fights)
        return p
      }, (p,v) => {
        ++p.fights
        p.total -= (v.goldValue)
        p.avg = p.fights? Math.round(p.total / p.fights) : 0
        return p
      }, () => {
        return {
          fights: 0,
          total: 0,
          avg: 0
        }
      })
    }
  }
  loadFile(file) {
    return new Promise((resolve, reject) => {
      d3.json(file, function(error, data) {
        if(error) {
          reject(error);
        }
        else {
          resolve(data);
        }
      })
    })
  }
  loadChampions(data) {
    let championList = d3.select('#champions').selectAll('img').data(data);
    championList.enter().append('img')
      .attr('src',d => { return 'http://ddragon.leagueoflegends.com/cdn/6.1.1/img/champion/' + d.image})
      .attr('width', 50)
      .attr('height', 50)
      .on('click', (d, i) => {
        this.cf.dim.killchampion.filterExact(d.id);
        this.selectedChampion = d.id;
        this.updateData();
        dc.redrawAll();
      })
  }
  loadData(championfile, matchdata, golddata) {
    return Promise.all([
      this.loadFile(championfile),
      this.loadFile(matchdata),
      this.loadFile(golddata)
    ])
  }
  createCharts() {
    this.charts.period = dc.pieChart('#gamePeriodChart')
      .width(document.querySelector('#gamePeriodChart').clientWidth)
      .height(200)
      .radius(80)
      .on('filtered', (chart, filter) => {
        this.updateData()
      })
      .externalLabels(30)
      .drawPaths(true)
      .innerRadius(30)
      .dimension(this.cf.dim.period)
      .group(this.cf.grp.period)
    this.charts.action = dc.barChart('#minuteChart');
      this.charts.action
      .width(document.querySelector('#minuteChart').clientWidth)
      .height(50)
      .margins({top: 0, right: 0, bottom: 20, left: 0})
      .on('filtered', (d,i) => {
        this.updateData()
      })
      .dimension(this.cf.dim.minute)
      .group(this.cf.grp.minute)
      .centerBar(true)
      .gap(1)
      .elasticY(true)
      .x(d3.scale.linear().domain([0,50]))
      .yAxis().ticks(0)
      
    this.charts.gold = dc.lineChart('#goldDistribution');
      this.charts.gold.renderArea(true)
      .width(document.querySelector('#goldDistribution').clientWidth)
      .height(200)
      .transitionDuration(1000)
      .dimension(this.cfg.dim.minute)
      .mouseZoomable(false)
      .x(d3.scale.linear().domain([0,50]))
      .elasticY(true)
      .renderHorizontalGridLines(true)
      .brushOn(false)
      .group(this.cfg.grp.gold, 'Gold value')
      .valueAccessor((d) => { return d.value.avg})

    dc.renderAll();
  }
  loadMiniMap() {
    d3.select('#minimap').append('svg:svg')
      .attr('width', 512)
      .attr('height', 512)
      .append('image')
        .attr('xlink:href', 'https://s3-us-west-1.amazonaws.com/riot-api/img/minimap-ig.png')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 512)
        .attr('height', 512)
  }
  loadHeatMap() {
     this.heat = simpleheat('canvas');
  }
  animate() {
    let currentTime = 0;
    let doAnimation = () => {
      this.charts.action.filter(null);
      this.charts.action.filter([currentTime, currentTime + 1]);
      this.cf.dim.minute.filter([currentTime, currentTime + 1]);
      this.charts.action.redraw();
      this.updateData();
      currentTime += 1;
      if(currentTime == 50) {
        currentTime = 0;
      }
      window.setTimeout(doAnimation, 200);
    }
    doAnimation();
  }
  onload() {
    this.loadData('champions.json', 'matchdata.json', 'golddata.json').then((data) => {
      let [champions, matches, gold] = data;
      this.prepare(matches, gold);
      this.cf.dim.type.filter('kill');
      this.createCharts();
      this.loadMiniMap();
      this.loadHeatMap();
      this.updateData();
      this.loadChampions(champions);
      let that = this;
      let ta = $('.typeahead').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
      }, {
        name: 'champions',
        source: new Bloodhound({
          datumTokenizer: Bloodhound.tokenizers.whitespace,
          queryTokenizer: Bloodhound.tokenizers.whitespace,
          local: champions.map((d) => d.name)
        })
      });
      $('form.championpicker').submit(function() {
        let champ = $('.typeahead:nth-of-type(2)').val();
        return false;
      })
      $('.typeButton').click(function() {
        let type = $(this).attr('data-type');
        if(type == 'kill') {
          that.cf.dim.deathchampion.filterAll();
          that.cf.dim.killchampion.filterExact(that.selectedChampion);
        }
        else {
          that.cf.dim.killchampion.filterAll();
          that.cf.dim.deathchampion.filterExact(that.selectedChampion);
        }
        that.updateData();
      });
      this.animate();
    })
  }
  updateData() {
    let data = this.cf.dim.minute.top(Infinity);
    let heatmapdata = [];
    data.forEach(function(data) {
      heatmapdata.push([
        data.x,
        data.y,
        data.value
      ])
    })
    this.heat.clear();
    this.heat.data(heatmapdata);
    this.heat.max(Math.ceil(data.length / 525));
    if(data.length < 5000) {
      this.heat.radius(8,16)
    }
    else {
      this.heat.radius(5, 10);
    }
    this.heat.draw();
  }
}

map = new LeagueMap();
map.onload();
