# League of Legends Toolkit

## Introductie

Er zijn veel analyse-websites voor League of Legends, maar dit zijn vaak multi-page apps. Het is moeilijk om verschillende zaken met elkaar te vergelijken, en inzichten te krijgen van multidimensionale factoren. De toolkit die in dit project wordt aangeboden maakt het moeglijk om veel verschillende elementen samen te kunnen voegen tot één grote visualisatie, de minimap-heatmap. Deze heatmap bevat de belangrijkste elementen die tot een succesvolle game kunnen leiden: deaths en kills. Dit inzichtelijk maken maakt het mogelijk om te leren van fouten, en voor te bereiden op andere matches. 

## Functies	

- De toolkit gaat laten zien waar de gekozen activiteit (kills, deaths) het meeste plaatsvindt
- De toolkit maakt het mogelijk om een selectie te maken tussen verschillende factoren
	- Tijdsselectie (early-game, mid-game, end-game, en een selectie met specifieke minuten (0 - 65 minuten)
	- Champion-selectie
	- Region-selectie
	- Lane
	- Leagues (Bronze, Silver... Challenger)
-  De verschillende factoren beïnvloeden elkaar, en kunnen gecombineerd worden gebruikt (een specifieke champion in een specifieke region bijvoorbeeld). 

## Schets

![](doc/sketch.png)

Deze eerste schets laat het overzicht van de website zien. Het grootste onderdeel van de visualisatie is de heatmap op de minimap geprojecteert. Vervolgens kan er een selectie worden gemaakt welke informatie er getoond moet worden (in het begin nog deaths / kills).

Onder de heatmap komt de 'action chart', waar er een selectie gemaakt kan worden van de minuten waarop gefilterd moet worden. Deze 'action chart' is een bar chart, met als hoogte de totale frequentie van acties binnen een specifieke minuut. 

Hieronder kunnen een aantal selecties worden uitgevoerd, in het begin alleen nog maar champion-selectie, maar later ook lane-selectie en region-selectie. Hier iets selecteren zorgt ervoor dat de heatmap automatisch wordt bijgewerkt.

## Databronnen

De enige databron die voor deze analyse nodig is is de Riot Games API van Riot Games. Deze API geeft de locatie van deaths/kills iedere minuut van een match weer. Deze wordt opgehaald via een node.js-script. Deze gaat van 100,000 matches de data aggregeren op minuut / locatie. Vervolgens wordt dit omgezet naar een json-bestand, die verwerkt kan worden door D3. Binnen de Riot Games API worden de volgende API requests gebruikt:

- League-v2.5 (om de top 100 van spelers binnen een league te kiezen)
- Matchlist-v2.2 (om de laatste 1000 games van die spelers te kiezen)
- Match-v2.2 (om de tijd-events van de specifieke match te kunnen verkrijgen).

## Verschillende elementen

De app bestaat uit twee elementen. Allereerst is er de 'scraper', die alle data vergaart en aggregeert. Dit is een simpel script, die de benodigde requests achter elkaar uitvoert. Het uitvoeren van dit script duurt enige tijd, aangezien er maar 500 requests per 10 minuten uitgevoerd mogen worden. Dit script gaat een aantal dagen draaien, en maakt uiteindelijk een match.json bestand aan met alle informatie. Vervolgens is er het visualisatieplatform die dit match.json-bestand uitleest, en de benodigde visualisaties maakt.

## Platform / API's

Voor de scraper wordt het node.js-framework gebruikt. Dit maakt het mogelijk om snel een functionele scraper te maken, die gebruik maakt van de Riot Games API. Werken met JSON-bestanden voor beide de request, en het uiteindelijke match.json-bestand, is hierin makkelijk, omdat het in essentie een javascript-omgeving is. Hier wordt gebruik gemaakt van de volgende libraries:

- Request.JS (om API-requests te kunnen doen, en automatisch dit om te zetten naar JSON)
- Jsonfile.JS (Om het uiteindelijke JSON-bestand makkelijk weg te schrijven)

Voor de visualisatie worden een aantal andere frameworks gebruikt.

- jQuery (Om het toevoegen van elementen, en andere DOM-manipulaties mogelijk te maken)
- Bootstrap (Om de lay-out te maken, en het positioneren van elementen te vergemakkelijken)
- D3.js (Om de visualisaties (heatmap / grafieken) te kunnen maken)
- Crossfilter.js (Om live-dataminpulatie uit te voeren op 100,000 rows is een efficiente library vereist).
- DC.js (Om Crossfilter met D3 te kunnen combineren (en het live-updaten van filters mogelijk te maken) wordt DC.js gebruikt

## Potentiële problemen

Ik verwacht geen problemen met het vergaren van data, aangezien deze goed aanwezig is, en vrij eenvoudig te verwerken is. Wel verwacht ik problemen om de uiteindelijke lay-out van de app toegankelijk te houden, omdat het nogal specifieke data bevat (van één specifiek spelletje).

Ook denk ik dat het combineren van de verschillende elementen lastig wordt (en dan vooral met de performance). Dit hoop ik dus op te kunnen lossen met crossfilter. Het toevoegen van crossfilter zorgt wel voor een sterk verhoogde complexiteit van de app, dus het kan zijn dat het introduceren van crossfilter er voor zorgt dat het project te moeilijk wordt.

## Vergelijkbare applicaties

Zoals al in de inleiding vermeld zijn er een aantal andere toolkits, die met dezelfde data andere dingen doen ([League of Graphs](http://www.leagueofgraphs.com/), [Lolking](http://www.lolking.net/), [op.gg](http://na.op.gg/). Vrijwel al deze websites laten specifieke informatie van een speler zien, en niet geaggregeerde data (met uitzondering van League of Graphs). Ook maken ze het niet mogelijk om dynamisch andere elementen te kiezen als filtering, wat vergelijken tussen verschillende elementen onmogelijk maakt. 


