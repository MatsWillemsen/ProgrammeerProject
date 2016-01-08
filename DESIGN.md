## Design-document

### Data-processing

Er zijn twee manieren waarop de data wordt verwerkt. Allereerst wordt de data ingeladen via een D3-json call, om de objecten terug te krijgen. Omdat D3 deze records niet op een efficiënte manier kan verwerken, wordt er op basis van deze data een aantal crossfilter-dimensies (en groeperingen) gemaakt. 

Deze crossfilter-dimensies maken het mogelijk om snel te filteren op een specifieke dimensie, en de rest van de data hier dan uit te halen. Deze data wordt niet direct gekoppeld aan een user-interface, maar wordt doorgegeven aan een tweetal elementen.

Allereerst wordt het doorgegeven aan de 'barchart'-histogram die telt als selector voor de minuten. Die wordt op deze data automatisch bijgeschaald.

Vervolgens wordt deze data ook doorgegeven aan de heatmap-functie. Die voegt deze datapunten samen in specifieke 'buckets'. De intensiteit van de kleur wordt bepaald door het aantal events dat in een specifieke bucket wordt geplaatst. Dit wordt uiteindelijk automatisch verwerkt, en iedere keer als er een filter wordt aangepast, wordt deze heatmap ook aangepast

### Andere API's

Voor het scrapen zelf wordt gebruik gemaakt van de nieuwe ECMAScript 6-standaard, omdat deze het makkelijk maakt om de code net te organiseren, en het gebruik te maken van zogenoemde _promises_. Dit zijn handvatten voor asynchrone operaties. Omdat er een groot aantal calls naar de Riot-API afhankelijk zijn van elkaar, moeten deze gecoördineerd worden afgehandeld. Het gebruik maken van _promises_ helpt hiermee.

ES6 wordt gebruikt binnen een node.js (om specifiek te zijn io.js-omgeving). Dit is een Javascript-runtime die buiten een browser om werkt (maar in essentie wel de V8-engine van Google Chrome gebruikt). Dit maakt het mogelijk om javascript-code te schrijven die gebruik kan maken van low-level machine api's (zoals bestanden wegschrijven of andersoortige I/O).

### Data-model 

De data die wordt opgehaald uit de RiotAPI wordt omgezet naar een json-bestand genaamd matches.json. Voor iedere event maakt deze een nieuw object aan, met de benodigde informatie. Op het moment van schrijven bevat het de volgende informatie:

- League
- Type (kill, killed, etc)
- X position
- Y position
- Killer Champion
- Killed Champion

### Public Methods

Dit onderdeel is vooral relevant voor de scraper. Het tekenen van de interface maakt vooral gebruik van standaard D3-logica. 

Voor de scraper worden de volgende twee klasses gedefiniëerd (met de volgende functies)

- RiotAPI
	- doMethod() - Promise

- RiotParser
	- parseKillFrames - Array(KillFrame)
	- getKillData - Promise
	- writeMatchData - Promise

