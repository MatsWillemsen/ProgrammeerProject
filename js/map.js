class RiotHeatmap {
  constructor(id) {
    this.root = $('<div style="position: relative;"></div>');
    this.root.appendTo($(id));
    this.minimapdiv = $('<div></div>');
    this.minimapdiv.appendTo(this.root);
    this.minimapcanvas = $('<canvas style="position: absolute; top: 0; left: 20;" width="256" height="256"></canvas>');
    this.minimapcanvas.appendTo(this.root);
    this.heatmap = simpleheat(this.minimapcanvas[0]);
    this.addImage();
  }
  addImage() {
    d3.select(this.minimapdiv[0]).append('svg:svg')
      .attr('width', 256)
      .attr('height', 256)
      .append('image')
        .attr('xlink:href', 'https://s3-us-west-1.amazonaws.com/riot-api/img/minimap-ig.png')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 256)
        .attr('height', 256)
  }
  addData(data) {
    this.heatmap.data(data);
    this.heatmap.max(Math.ceil(data.length / 525));
    if(data.length < 5000) {
      this.heatmap.radius(8,16)
    }
    else {
      this.heatmap.radius(5, 10);
    }
    this.heatmap.draw();
  }

}

class LeagueMap {
  constructor() {
    this.cf = {}
    this.cfg = {}
    this.cfp = {}
    this.d3 = {}
    this.charts = {}
    this.selectedChampion = 0;
  }
  prepare(data, golddata, positiondata) {
    this.d3.domain = {
      min: {x: -120, y: -120},
      max: {x: 14870, y: 14980}
    }
    this.d3.xscale = d3.scale.linear()
      .domain([this.d3.domain.min.x, this.d3.domain.max.x])
      .range([0, 256])
    this.d3.yscale = d3.scale.linear()
      .domain([this.d3.domain.min.y, this.d3.domain.max.y])
      .range([256, 0])

    positiondata.forEach(d => {
      d.minute = d.minute,
      d.x = this.d3.xscale(d.xposition),
      d.y = this.d3.yscale(d.yposition)
      d.value = 1
    });
    data.forEach(d => {
      d.minute = d.minute,
      d.x = this.d3.xscale(d.xposition),
      d.y = this.d3.yscale(d.yposition),
      d.value = 1
    });
    this.cf.dx = crossfilter(data);
    this.cfg.dx = crossfilter(golddata);
    this.cfp.dx = crossfilter(positiondata);


    this.cfp.dim = {
      minute: this.cfp.dx.dimension(d => d.minute),
      champion: this.cfp.dx.dimension(d => d.champion),
      role: this.cfp.dx.dimension(d => d.role),
      league: this.cfp.dx.dimension(d => d.league)
    }
    this.cfp.grp = {
      minute: this.cfp.dim.minute.group(),
    }

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
      }),
      role: this.cf.dx.dimension(d => d.role),
      league: this.cf.dx.dimension(d => d.league)
    }
    this.cf.grp = {
      minute : this.cf.dim.minute.group(),
      period : this.cf.dim.period.group().reduceSum(d => d.value)
    }
    this.cfg.grp = {
      gold: this.cfg.dim.minute.group().reduce((p,v) => {
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
    let championList = d3.select('.championlist').selectAll('div.champportrait').data(data, (d) => d.name );
    let enter = 
      championList.enter()
      .append('div')
      .attr('class','col-xs-2 champportrait')
      enter
      .append('img')
      .attr('src',d => { return 'http://ddragon.leagueoflegends.com/cdn/6.1.1/img/champion/' + d.image})
      .attr('class','img-responsive')
      .attr('width', 150)
      .attr('height', 150)
      .on('click', (d, i) => {
        /*this.cf.dim.killchampion.filterExact(d.id);
        this.cfp.dim.champion.filterExact(d.id);
        this.selectedChampion = d.id;
        this.updateData();
        dc.redrawAll();*/
        $('.championinfo .name').text(d.name);
        $('.championinfo .subtitle').text(d.title);
        $('.championinfo .lore').html(d.lore);
        $('.championinfo .portrait').attr('src', 'http://ddragon.leagueoflegends.com/cdn/6.1.1/img/champion/' + d.image);

        let [q, w, e, r] = d.spells;
        let passive = d.passive;
        let spells = [passive, q, w, e, r];
        let root = $('.championinfo .spells');
        root.empty();
        for(let spell of spells) {
          let url = `http://ddragon.leagueoflegends.com/cdn/6.1.1/img/${spell.image.group}/${spell.image.full}`
          let image = $(`<div class='col-xs-2'>
                            <img src='${url}' class='portrait' data-content="${spell.sanitizedDescription}" data-placement="bottom" data-trigger="hover" data-container='.spells' title='${spell.name}'></img>
                         </div>`);
          image.appendTo(root);
        }
        $('.championinfo .stats .health').text(`${d.stats.hp} (+${d.stats.hpperlevel} per level)`);
        $('.championinfo .stats .healthregen').text(`${d.stats.hpregen} (+${d.stats.hpregenperlevel} per level)`);
        $('.championinfo .stats .mana').text(`${d.stats.mp} (+${d.stats.mpperlevel} per level)`);
        $('.championinfo .stats .manaregen').text(`${d.stats.mpregen} (+${d.stats.mpregenperlevel} per level)`);
        $('.championinfo .stats .ad').text(`${d.stats.attackdamage} (+${d.stats.attackdamageperlevel} per level)`);
        $('.championinfo .stats .armor').text(`${d.stats.armor} (+${d.stats.armorperlevel} per level)`);
        let attackspeed = (0.625 / (1 + d.stats.attackspeedoffset)).toFixed(2);
        $('.championinfo .stats .as').text(`${attackspeed} (+${d.stats.attackspeedperlevel} per level)`);
        $('.championinfo .stats .mr').text(`${d.stats.spellblock} (+${d.stats.spellblockperlevel} per level)`);
        $('.championinfo .stats .ms').text(`${d.stats.movespeed}`);
        $('img[data-trigger]').popover();
        this.cf.dim.killchampion.filterExact(d.id);
        this.cfp.dim.champion.filterExact(d.id);
        this.updateData();
        dc.redrawAll();
      })
      enter
      .append('div')
      .attr('class','caption')
      .append('span')
      .attr('class','text-center')
      .text((d) => d.name);
    championList.exit().remove();
  }
  loadData(championfile, matchdata, golddata, positiondata) {
    return Promise.all([
      this.loadFile(championfile),
      this.loadFile(matchdata),
      this.loadFile(golddata),
      this.loadFile(positiondata)
    ])
  }
  createCharts() {
    /*
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
      .group(this.cf.grp.period)*/
    this.charts.action = dc.barChart('#minuteChart');
      this.charts.action
      .width(document.querySelector('#minuteChart').clientWidth)
      .height(50)
      .margins({top: 0, right: 0, bottom: 20, left: 20})
      .on('filtered', (d,i) => {
        this.cfp.dim.minute.filter(i);
        this.updateData()
      })
      .dimension(this.cf.dim.minute)
      .group(this.cf.grp.minute)
      .centerBar(true)
      .gap(1)
      .elasticY(true)
      .x(d3.scale.linear().domain([0,50]))
      .yAxis().ticks(0)
    /*
    this.charts.gold = dc.lineChart('#goldDistribution');
      this.charts.gold.width(document.querySelector('#goldDistribution').clientWidth)
      .margins({top: 0, right: 0, bottom: 20, left: 50})
      .height(200)
      .transitionDuration(1000)
      .dimension(this.cfg.dim.minute)
      .mouseZoomable(false)
      .x(d3.scale.linear().domain([0,50]))
      .elasticY(false)
      .renderHorizontalGridLines(true)
      .brushOn(false)
      .group(this.cfg.grp.gold, 'Gold value')
      .valueAccessor(d => d.value.avg)*/

    dc.renderAll();
  }
  /*
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
  }*/
  loadHeatMap() {
     //this.heat = simpleheat('canvas');
     this.killheat = new RiotHeatmap('#killData');
     this.positionheat = new RiotHeatmap('#positionData');
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
      window.setTimeout(doAnimation, 500);
    }
    //doAnimation();
  }
  onload() {
    this.loadData('champions.json', 'matchdata.json', 'golddata.json','positions.json').then((data) => {
      let [champions, matches, gold, positions] = data;
      this.prepare(matches, gold, positions);
      //this.createCharts();
      //this.loadMiniMap();
      //this.loadHeatMap();
      //this.updateData();
      let championList = this.loadChampions(champions);
      let that = this;
      let ta = $('.typeahead');
      ta.bind('input', function(e) {
        let val = $(this).val();
        that.loadChampions(champions.filter(function(d) { 
          return d.name.match(new RegExp(val, 'i')) != null;
        }));
      })
      $('button[data-role]').click(function() {

        if($(this).attr('data-role') == "ADC")
        {
          let filter = (d) => { return d == "BOTTOM" || d == "ADC"}
          that.cf.dim.role.filter(filter);
          that.cfp.dim.role.filter(filter);
        }
        else if($(this).attr('data-role') == "SUPPORT") {
          let filter = (d) => { return d == "BOTTOM" || d == "SUPPORT"}
          that.cf.dim.role.filter(filter);
          that.cfp.dim.role.filter(filter);
        }
        else if($(this).attr('data-role') == "OTHER")
        {
          $('.roles').velocity('fadeOut', {
              duration: 500,
              complete: function(elements) {
                $('.champions').velocity('fadeIn', { duration: 1000 });
              }
            });
        }
        else {
          that.cf.dim.role.filterExact($(this).attr('data-role'));
          that.cfp.dim.role.filterExact($(this).attr('data-role'));
        }
        that.updateData();
      });
      $('button[data-league]').click(function() {
        that.cf.dim.league.filterExact($(this).attr('data-league'));
        that.cfp.dim.league.filterExact($(this).attr('data-league'));
        //that.updateData();
      })
      $('.generateMaps').click(() => {
        let spinner = new Spinner({}).spin(document.querySelector('.spinner'));
        let root = $('#stap4');
        let killData = $(`<div id='killData' class='col-xs-6'></div>`).appendTo(root);
        let positionData = $(`<div id='positionData' class='col-xs-6'></div>`).appendTo(root);
        let minuteChart = $(`<div id="minuteChart" class="col-xs-12"></div>`).appendTo(root);
        that.createCharts();
        that.loadHeatMap();
        that.updateData();
      })
      //this.animate();
    })
  }
  updateData() {
    let data = this.cf.dim.minute.top(Infinity);
    let positiondata = this.cfp.dim.minute.top(Infinity);

    this.killheat.addData(data);
    this.positionheat.addData(positiondata)
    /*
    this.heat.clear();
    this.heat.data(heatmapdata);
    this.heat.max(Math.ceil(data.length / 525));
    if(data.length < 5000) {
      this.heat.radius(8,16)
    }
    else {
      this.heat.radius(5, 10);
    }
    this.heat.draw();*/
  }
}

map = new LeagueMap();
map.onload();
