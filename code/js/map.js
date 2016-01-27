class RiotHeatmap {

  // constructor met root id van het element. Moet een div zijn.
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
  // voegt een SVG-element met een image toe. Geen regulier image-element omdat het geldt als overlay, zo is opacity makkelijker in te stellen.
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
    // Er is geen makkelijke manier om dynamisch de range aan te passen, omdat de heatmap uitgaat van grijstinten (zie report). 
    // Deze formule blijkt voor de data robuust te zijn.
    this.heatmap.max(Math.ceil(data.length / 525));
    if(data.length < 15000) {
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
    // ruimte maken voor de 6 crossfilter-instanties, en d3, en de charts.
    this.cf = {}
    this.cf2 = {}
    this.cfg = {}
    this.cfg2 = {}
    this.cfp = {}
    this.cfp2 = {}
    this.d3 = {}
    this.charts = {}
    this.compare = false;
  }
  prepare(data, golddata, positiondata) {
    // domeinen van coordinaten bepalen. Deze data komt van de Riot Games API. 
    this.d3.domain = {
      min: {x: -120, y: -120},
      max: {x: 14870, y: 14980}
    }
    // Lineair schalen naar de 256x256 minimaps / heatmaps.
    this.d3.xscale = d3.scale.linear()
      .domain([this.d3.domain.min.x, this.d3.domain.max.x])
      .range([0, 256])
    this.d3.yscale = d3.scale.linear()
      .domain([this.d3.domain.min.y, this.d3.domain.max.y])
      .range([256, 0])

    // Direct de schaling uitvoeren (één keer doorrekenen bij het laden van de pagina is efficiënter dan dit iedere keer uitvoeren)
    // Value is nodig om de heatmaps op elkaar te kunnen stapelen.
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

    // twee crossfilter-instanties per dimensie (om te kunnen vergelijken). Hier worden de filters op uitgevoerd.
    this.cf.dx = crossfilter(data);
    this.cf2.dx = crossfilter(data);
    this.cfg.dx = crossfilter(golddata);
    this.cfg2.dx = crossfilter(golddata);
    this.cfp.dx = crossfilter(positiondata);
    this.cfp2.dx = crossfilter(positiondata);

    // Positie-dimensies die nodig zijn. Komen overeen met de filters die gekozen kunnen worden.
    this.cfp.dim = {
      minute: this.cfp.dx.dimension(d => d.minute),
      champion: this.cfp.dx.dimension(d => d.champion),
      role: this.cfp.dx.dimension(d => d.role),
      league: this.cfp.dx.dimension(d => d.league)
    }
    // Tweede set positie-dimensies (voor vergelijken)
    this.cfp2.dim = {
      minute: this.cfp2.dx.dimension(d => d.minute),
      champion: this.cfp2.dx.dimension(d => d.champion),
      role: this.cfp2.dx.dimension(d => d.role),
      league: this.cfp2.dx.dimension(d => d.league)
    }

    // Standaard crossfilter-groups voor minuten
    this.cfp.grp = {
      minute: this.cfp.dim.minute.group(),
    }
    this.cfp2.grp = {
      minute: this.cfp.dim.minute.group(),
    }

    // Gold-dimensies (1 en 2)
    this.cfg.dim = {
      minute: this.cfg.dx.dimension(d => d.minute),
      gold: this.cfg.dx.dimension(d => d.gold)
    }
    this.cfg2.dim = {
      minute: this.cfg.dx.dimension(d => d.minute),
      gold: this.cfg.dx.dimension(d => d.gold)
    }    
    // Killdata-dimensies. 
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
    this.cf2.dim = {
      type: this.cf2.dx.dimension(d => d.type),
      minute: this.cf2.dx.dimension(d=> d.minute),
      killchampion: this.cf2.dx.dimension(d=>d.killerchamp),
      deathchampion: this.cf2.dx.dimension(d=>d.victimchamp),
      period: this.cf2.dx.dimension(d => {
        if(d.minute < 15) return "Early";
        if(d.minute >= 15 && d.minute <= 25) return "Mid";
        else return "End";        
      }),
      role: this.cf2.dx.dimension(d => d.role),
      league: this.cf2.dx.dimension(d => d.league)
    }    

    //Killdata-groeperingen (inclusief period MapReduce-functies)
    this.cf.grp = {
      minute : this.cf.dim.minute.group(),
      period : this.cf.dim.period.group().reduceSum(d => d.value)
    }
    this.cf2.grp = {
      minute : this.cf2.dim.minute.group(),
      period : this.cf2.dim.period.group().reduceSum(d => d.value)
    }    

    // Map-reduce groepen voor gold-data, om gemiddelde gold-data terug te krijgen per minuut (robuust voor meerdere matches).
    // Telt alle match-data bij elkaar op, en deelt het uiteindelijk naar het aantal matches.
    this.cfg.grp = {
      gold: this.cfg.dim.minute.group().reduce((p,v) => {
        ++p.fights
        p.total += (v.gold)
        p.avg = Math.round(p.total / p.fights)
        return p
      }, (p,v) => {
        --p.fights
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
    this.cfg2.grp = {
      gold: this.cfg2.dim.minute.group().reduce((p,v) => {
        ++p.fights
        p.total += (v.gold)
        p.avg = Math.round(p.total / p.fights)
        return p
      }, (p,v) => {
        --p.fights
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

  // ES6-promise om meerdere bestanden makkelijk te kunnen laden via D3.json-functies.
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
  loadChampions(data, step) {
    // Champion-data inladen. Er wordt een data->enter->exit()-constructie gebruikt voor het snel kunnen aanpassen. Wordt geïndexeerd op de naam van de champion (standaard-indexering van D3 werkt hier niet).
    let championList = d3.select(`#${step}`).select('.championlist').selectAll('div.champportrait').data(data, (d) => d.name );
    let enter = 
      championList.enter()
      .append('div')
      .attr('class','col-xs-2 champportrait')
      enter
      .append('img')
      // image toevoegen op basis van data in champions.json
      .attr('src',d => { return 'http://ddragon.leagueoflegends.com/cdn/6.1.1/img/champion/' + d.image})
      .attr('class','img-responsive')
      .attr('width', 150)
      .attr('height', 150)
      .on('click', (d, i) => {
        // dit is nodig omdat er twee locaties zijn met deze functionaliteit. Alleen voor deze locatie uitvoeren.
        let champroot = $(`#${step}`)
        // Specifieke informatie wegschrijven over de champion
        champroot.find('.championinfo .name').text(d.name);
        champroot.find('.championinfo .subtitle').text(d.title);
        champroot.find('.championinfo .lore').html(d.lore);
        champroot.find('.championinfo .portrait').attr('src', 'http://ddragon.leagueoflegends.com/cdn/6.1.1/img/champion/' + d.image);
        // d.spells is een array van de Q-spell, W-spell, E-spell en R-spell. ES6 wordt gebruikt om deze uit te pakken
        let [q, w, e, r] = d.spells;
        let passive = d.passive;
        let spells = [passive, q, w, e, r];
        let root = $(`#${step} .championinfo .spells`);
        root.empty();
        // Passive en spells toevoegen. Ook een popover toevoegen met meer informatie voor die spell
        for(let spell of spells) {
          let url = `http://ddragon.leagueoflegends.com/cdn/6.1.1/img/${spell.image.group}/${spell.image.full}`
          let image = $(`<div class='col-xs-2'>
                            <img src='${url}' class='portrait' data-content="${spell.sanitizedDescription}" data-placement="bottom" data-trigger="hover" data-container='#${step} .spells' title='${spell.name}'></img>
                         </div>`);
          image.appendTo(root);
        }
        // Stats toevoegen. Omdat stats van elkaar verschillen kan dit niet veel efficiënter.
        champroot.find('.championinfo .stats .health').text(`${d.stats.hp} (+${d.stats.hpperlevel} per level)`);
        champroot.find('.championinfo .stats .healthregen').text(`${d.stats.hpregen} (+${d.stats.hpregenperlevel} per level)`);
        champroot.find('.championinfo .stats .mana').text(`${d.stats.mp} (+${d.stats.mpperlevel} per level)`);
        champroot.find('.championinfo .stats .manaregen').text(`${d.stats.mpregen} (+${d.stats.mpregenperlevel} per level)`);
        champroot.find('.championinfo .stats .ad').text(`${d.stats.attackdamage} (+${d.stats.attackdamageperlevel} per level)`);
        champroot.find('.championinfo .stats .armor').text(`${d.stats.armor} (+${d.stats.armorperlevel} per l evel)`);
        // Attack speed is een berekening. Je krijgt de offset, standaard is deze 0.625 (op basis daarvan de attack speed berekenen)
        let attackspeed = (0.625 / (1 + d.stats.attackspeedoffset)).toFixed(2);
        champroot.find('.championinfo .stats .as').text(`${attackspeed} (+${d.stats.attackspeedperlevel} per level)`);
        champroot.find('.championinfo .stats .mr').text(`${d.stats.spellblock} (+${d.stats.spellblockperlevel} per level)`);
        champroot.find('.championinfo .stats .ms').text(`${d.stats.movespeed}`);
        champroot.find('img[data-trigger]').popover();

        // Filteren per stap (de goede crossfilter-dimensie moet wordfen gekozen)
        if(step == 'stap2') {
          this.cf.dim.killchampion.filterExact(d.id);
          this.cfp.dim.champion.filterExact(d.id);          
        }
        else {
          this.cf2.dim.killchampion.filterExact(d.id);
          this.cfp2.dim.champion.filterExact(d.id);   
        }
        this.updateData();
        dc.redrawAll();
      })
      // kleine div toevoegen met de naam van de champion (voor als je niet wil zoeken)
      enter
      .append('div')
      .attr('class','caption')
      .append('span')
      .attr('class','text-center')
      .text((d) => d.name);
    // hele element weghalen als het element niet meer voorkomt in de zoekresultaten.
    championList.exit().remove();
  }
  // Wordt gebruikt in combinatie met de loadFile functie. Promise.all() wacht totdat alle promises zeker fulfilled zijn.
  loadData(championfile, matchdata, golddata, positiondata) {
    return Promise.all([
      this.loadFile(championfile),
      this.loadFile(matchdata),
      this.loadFile(golddata),
      this.loadFile(positiondata)
    ])
  }

  // DC.js charts maken, op basis van de selecties die de gebruiker heeft gedaan.
  createCharts() {
    // als er vergeleken wordt en gold-verdeling getoond moet worden,.
    if(this.compare && this.goldEnabled) {
      this.charts.gold1 = dc.lineChart('#goldDistribution1');
        // gold-distribution is een line chart (en maak deze aan)
        // deze truuk zorgt ervoor dat de charts worden aangepast op basis van de breedte van de scherm van de gebruiker. 
        this.charts.gold1.width(document.querySelector('#goldDistribution1').clientWidth)
        .margins({top: 0, right: 0, bottom: 20, left: 50})
        .height(200)
        .transitionDuration(1000)
        .dimension(this.cfg.dim.minute) // X-as is dimensie
        .mouseZoomable(false) // geen mouse-zoom aanzetten
        .x(d3.scale.linear().domain([0,50])) // hardcode dimensie tussen 0 en 50 (Riot Games API is niet altijd 100% accuraat)
        .elasticY(false) // Y-dimensie niet aanpassen naar hertekening
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .group(this.cfg.grp.gold, 'Gold value') // Gegroepeerd wordt er op gold
        .valueAccessor(d => d.value.avg) // MapReduce-groep gemiddelde gebruiken. 
      this.charts.gold2 = dc.lineChart('#goldDistribution2');
        this.charts.gold2.width(document.querySelector('#goldDistribution2').clientWidth)
        .margins({top: 0, right: 0, bottom: 20, left: 50})
        .height(200)
        .transitionDuration(1000)
        .dimension(this.cfg2.dim.minute)
        .mouseZoomable(false)
        .x(d3.scale.linear().domain([0,50]))
        .elasticY(false)
        .renderHorizontalGridLines(true)
        .brushOn(false)
        .group(this.cfg2.grp.gold, 'Gold value')
        .valueAccessor(d => d.value.avg)         
    }
    else {
      // anders dezelfde grafiek aanmaken voor één selectie
      if(this.goldEnabled) {
        this.charts.gold1 = dc.lineChart('#goldDistribution1');
        this.charts.gold1.width(document.querySelector('#goldDistribution1').clientWidth)
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
        .valueAccessor(d => d.value.avg);
      }
    }
    // De minute-selection chart. Deze fungeert vooral als selectiemiddel om de heatmaps te kunnen filteren
    this.charts.action = dc.barChart('#minuteChart');
      this.charts.action
      .width(document.querySelector('#minuteChart').clientWidth)
      .height(50)
      .margins({top: 0, right: 0, bottom: 20, left: 20})
      // als er een filter is gekozen
      .on('filtered', (d,i) => {
        // voeg deze dan toe aan alle nodige dimensies
        if(this.compare) {
          if(this.positionEnabled) {
            this.cfp.dim.minute.filter(i);
            this.cfp2.dim.minute.filter(i);
          }
          if(this.killEnabled) {
            this.cf2.dim.minute.filter(i);
          }
        }
        else if(this.positionEnabled) {
          this.cfp.dim.minute.filter(i);
        }
        this.updateData()
      })
      .dimension(this.cf.dim.minute)
      .group(this.cf.grp.minute)
      .centerBar(true)
      .gap(1)
      .elasticY(true)
      .x(d3.scale.linear().domain([0,50]))
      .yAxis().ticks(0) // laat Y-as niet zien (absolute waarden zijn hierbij niet nuttig)

    dc.renderAll();
  }
  loadHeatMap() {
    // hier worden alle heatmaps aangemaakt, voor killData en positionData (en voor de vergelijkingen)
     if(this.compare) {
      if(this.killEnabled) {
        this.killheat1 = new RiotHeatmap('#killData1');
        this.killheat2 = new RiotHeatmap('#killData2');
      }
      if(this.positionEnabled) {
        this.positionheat1 = new RiotHeatmap('#positionData1');
        this.positionheat2 = new RiotHeatmap('#positionData2');
      }
     }
     else {
      if(this.killEnabled) {
        this.killheat1 = new RiotHeatmap('#killData');
      }
      if(this.positionEnabled) {
        this.positionheat1 = new RiotHeatmap('#positionData');
      }
     }
  }
  animate() {
    // als de client de animaties kan weergeven, de animatie van de heatmaps tonen. Niet iedere client kan dit aan.
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
    // alle bestanden eerst laden.
    this.loadData('champions.json', 'matchdata.json', 'golddata.json','positions.json').then((data) => {
      // data-object uitpakken
      let [champions, matches, gold, positions] = data;
      // de data in de nodige crossfilter-dimensies gooien
      this.prepare(matches, gold, positions);
      // champions inladen voor beide selecties
      this.loadChampions(champions, 'stap2');
      this.loadChampions(champions, 'stap3');
      let that = this;
      let ta = $('#stap2 .typeahead');
      // Als er een wijziging is in de textbox van de champions, filter de champions hierop, en laad de champions opnieuw (D3 past automatisch de views aan)
      ta.bind('input', function(e) {
        let val = $(this).val();
        that.loadChampions(champions.filter(function(d) { 
          return d.name.match(new RegExp(val, 'i')) != null;
        }), 'stap2');
      })
      // zelfde proces voor de tweede selectie.
      $('#stap3 .typeahead')
      .bind('input', function(e) {
        let val = $(this).val();
        that.loadChampions(champions.filter(function(d) { 
          return d.name.match(new RegExp(val, 'i')) != null;
        }), 'stap3');
      })
      $('#stap2 button[data-role]').click(function() {
        // Af en toe weet de Riot Games API niet welke rol een champion heeft (role="BOTTOM") In dit geval beide rollen pakken.
        if($(this).attr('data-role') == "ADC")
        {
          let filter = (d) => { return d == "BOTTOM" || d == "ADC"}
          // dimensies hierop filteren
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
          // als er een champion wordt gekozen, hiervoor een animatie tonen.
          $('#stap2 .roles').velocity('fadeOut', {
              duration: 500,
              complete: function(elements) {
                $('#stap2 .champions').velocity('fadeIn', { duration: 1000 });
              }
            });
        }
        else {
          that.cf.dim.role.filterExact($(this).attr('data-role'));
          that.cfp.dim.role.filterExact($(this).attr('data-role'));
        }
        // data bijwerken op basis van selecties.
        that.updateData();
      });
      // vergelijkbaar met stap2 
      $('#stap3 button[data-role]').click(function() {
        if($(this).attr('data-role') == "ADC")
        {
          let filter = (d) => { return d == "BOTTOM" || d == "ADC"}
          that.cf2.dim.role.filter(filter);
          that.cfp2.dim.role.filter(filter);
        }
        else if($(this).attr('data-role') == "SUPPORT") {
          let filter = (d) => { return d == "BOTTOM" || d == "SUPPORT"}
          that.cf2.dim.role.filter(filter);
          that.cfp2.dim.role.filter(filter);
        }
        else if($(this).attr('data-role') == "OTHER")
        {
          $('#stap3 .roles').velocity('fadeOut', {
              duration: 500,
              complete: function(elements) {
                $('#stap3 .champions').velocity('fadeIn', { duration: 1000 });
              }
            });
        }
        else {
          that.cf2.dim.role.filterExact($(this).attr('data-role'));
          that.cfp2.dim.role.filterExact($(this).attr('data-role'));
        }
        if(!that.compare) {
          that.compare = true;
        }
        that.updateData();
      });
      // als er een league wordt gekozen, deze bijwerken als filter.
      $('#stap1 button[data-league]').click(function() {
        that.cf.dim.league.filterExact($(this).attr('data-league'));
        that.cfp.dim.league.filterExact($(this).attr('data-league'));
        //that.updateData();
      })
      $('#stap3 button[data-league]').click(function() {
        that.cf2.dim.league.filterExact($(this).attr('data-league'));
        that.cfp2.dim.league.filterExact($(this).attr('data-league'));
        if(!that.compare) {
          that.compare = true;
        }        
        //that.updateData();
      })
      // als er op Genereren wordt gedrukt worden alle elementen van de grafiek pas aangemaakt. 
      $('.generateMaps').click(() => {
        let root = $('#stap5');
        // kijken welke elementen er zijn aangevinkt, en deze wegschrijven
        that.killEnabled = $('#killEnabled').prop('checked');
        that.positionEnabled = $('#positionEnabled').prop('checked');
        that.goldEnabled = $('#goldEnabled').prop('checked');
        // als er vergeleken wordt, moet er ruimte worden gemaakt om de vergelijkingen naast elkaar uit te kunnen voeren. Hier worden de elementen allemaal naast- en onder elkaar toegevoegd.
        if(that.compare) {
          $(`<div class='col-xs-6'><h1 class='text-center'>X</h1></div><div class='col-xs-6'><h1 class='text-center'>Y</h1></div>`).appendTo(root);
          if(that.killEnabled) {
            $(`<div id='killData1' class='col-xs-3'></div>`).appendTo(root);
            $(`<div id='killData2' class='col-xs-3'></div>`).appendTo(root);
          }
          if(that.positionEnabled) {
            $(`<div id='positionData1' class='col-xs-3'></div>`).appendTo(root);
            $(`<div id='positionData2' class='col-xs-3'></div>`).appendTo(root);            
          }
          if(that.goldEnabled) {
            $(`<div id="goldDistribution1" class="col-xs-6"></div>`).appendTo(root);
            $(`<div id="goldDistribution2" class="col-xs-6"></div>`).appendTo(root);
          }
          let minuteChart = $(`<div id="minuteChart" class="col-xs-11"></div>`).appendTo(root);
        }
        else {
          $(`<div class='col-xs-12'><h1 class='text-center'>X</h1></div>`).appendTo(root);
          if(that.killEnabled) {
            let killData = $(`<div id='killData' class='col-xs-5 col-xs-offset-2'></div>`).appendTo(root);
          }
          if(that.positionEnabled) {
            let positionData = $(`<div id='positionData' class='col-xs-5'></div>`).appendTo(root);
          }
          if(that.goldEnabled) {
            let goldData = $(`<div id="goldDistribution1" class="col-xs-11"></div>`).appendTo(root);
          }
          let minuteChart = $(`<div id="minuteChart" class="col-xs-11"></div>`).appendTo(root);
        }
        // maak de charts aan
        that.createCharts();
        // laad de heatmap
        that.loadHeatMap();
        // werk voor de laatste maal de data bij (dit is niet altijd nodig)
        that.updateData();
      })
    })
  }
  updateData() {
    // op basis van de selecties de heatmaps bijwerken. De rest van de DC.js-grafieken worden door crossfilter automatisch bijgewerkt.
    if(this.compare) {
      if(this.killEnabled) {
        let data = this.cf.dim.minute.top(Infinity);
        let data2 = this.cf2.dim.minute.top(Infinity);
        this.killheat1.addData(data);
        this.killheat2.addData(data2);
      }
      if(this.positionEnabled) {
        let data = this.cfp.dim.minute.top(Infinity);
        let data2 = this.cfp2.dim.minute.top(Infinity);
        this.positionheat1.addData(data);
        this.positionheat2.addData(data2);        
      }
    }
    else {
      if(this.killEnabled) {
        let data = this.cf.dim.minute.top(Infinity);
        this.killheat1.addData(data);
      }
      if(this.positionEnabled) {
        let data = this.cfp.dim.minute.top(Infinity);
        this.positionheat1.addData(data);       
      }
    }
  }
}
// class initialiseren, en laden.
map = new LeagueMap();
map.onload();
