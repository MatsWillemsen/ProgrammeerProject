---
author:
- Mats Willemsen
title: Visualisatie van League of Legends data
...

<span>2</span>

Introductie
===========

League of Legends is een *Multiplayer Online Battle Arena* (MOBA). Een
belangrijk onderdeel van dit spel is reageren op het gedrag van
*champions* (actoren in het spel), vooral met betrekking tot hun
verplaatsingen en hun *kills* (acties waarin een *champion* van een
andere *champion* overwint. De gepresenteerde applicatie maakt het
mogelijk om dit op een gestructureerde manier te doen, en de
verplaatsingen en acties van *champions* te visualiseren. De applicatie
maakt het tevens mogelijk om filters aan te brengen voor rollen in het
spel, specifieke *champions* te selecteren, of alle data te selecteren
binnen een specifieke moeilijkheidsgraad (*league*) in het spel.

Er worden in de applicatie hiervoor een viertal stappen doorlopen. In de
eerste stap wordt een *league* gekozen. Dit zorgt ervoor dat alleen de
data van die specifieke *league* wordt meegenomen in de analyses. In de
tweede stap kan een *champion* of een rol in het spel genomen.
*Champions* kunnen worden gegroepeerd in een rol, afhankelijk van hun
functie. Deze stap maakt met mogelijk om dus geaggregeerde analyses te
maken op basis van een rol, of te zoeken voor een specifieke *champion*.
In de derde stap wordt het mogelijk om ’vergelijkingen’ aan te brengen
in de visualisatie. Binnen de vergelijking kunnen dezelfde keuzes worden
gemaakt als in de vorige twee stappen, alleen kan er voor de
vergelijking gekozen worden voor óf een rol(of *champion*) óf een
*league*, in plaats van beide opties. Als vierde stap kunnen er
elementen in de visualisaties worden aan- of uitgezet. Deze elementen
omvatten de data voor acties van champions (*kills*), verplaatsingen van
champions, en de groei van totale middelen (*gold*) voor spelen waar die
*champion* of rol onderdeel van is geweest.

Hierna worden de visualisaties getoond op basis van de in de vierde stap
gekozen elementen. De verplaatsingen en acties worden getoond in een
*heatmap*, getoond over een kaart van het spel. De distributie van
totale middelen wordt getoond als *line-graph* over de tijd heen.

Technical Design
================

De applicatie bestaat uit twee delen. Allereerst is er een gedeelte om
de benodigde data te verzamelen, en een andere om deze te presenteren.
In dit stuk worden beide elementen uitgelicht.

Parser
------

De *parser* van deze applicatie is een *node.js*-applicatie, die de
benodigde informatie verzamelt van een API die Riot Games (ontwikkelaar
van *League of Legends*) beschikbaar is gesteld. Voor het inlezen van de
data is er een EcmaScript 6(ES6)-compatible node.js-module geschreven
genaamd *RiotParser*. Deze parser bestaat uit een aantal onderdelen die
hieronder worden uitgelicht.

Allereerst is er een *RiotAPI*-klasse die wordt aangemaakt. Het doel van
deze klasse is het gestructureerd uitvoeren van *requests* naar de Riot
Games-API, en dat de logica hiervoor gescheiden kan worden van de rest
van de parser. De klasse heeft één functie: *doMethod*. Deze functie
voert de request uit naar de Riot Games-API, en geeft een ES6 *Promise*
terug. Deze *Promise* maakt het mogelijk om verschillende asynchrone
requests uit te voeren, en een functie uit te voeren wanneer deze zijn
afgerond. Dit zorgt ervoor dat de parser verschillende zaken
tegelijkertijd kan doen, en uiteindelijk samen kan voegen tot één
resultaat.

Een ander element van *RiotParser* zijn de functies om de resultaten van
de calls naar de *RiotAPI* te verwerken. De functies die hier worden
gebruikt zetten het JSON-resultaat van *RiotAPI* om naar een
JSON-resultaat dat in de webapplicatie gebruikt kan worden. Het grootste
gedeelte van de code omvat het omzetten van *game frames* uit de *game
data* naar champion-acties en champion-verplaatsingen. De Riot Games-API
geeft namelijk voor alle gevraagde matches een overzicht welke acties er
zijn uitgevoerd, en welke verplaatsingen er zijn uitgevoerd voor iedere
minuut van die game. De code leest deze acties, en schrijft iedere actie
weg als individuele *row* in de data, inclusief alle benodigde data voor
het filteren en groeperen voor de webapplicatie.

Uiteindelijk zorgen deze functies ervoor dat er drie bestanden worden
weggeschreven: *matchdata.json*, *golddata.json*, en *positions.json*,
voor respectievelijk de actiedata van champions, de distributie van
totale middelen (*gold*) in het spel, en de posities van *champions* in
het spel. Ook schrijft het informatie weg over champions, in een bestand
genaamd *champions.json*.

Visualisation
-------------

De code die voor de visualisatie is gebruikt is ook geschreven als
ES6-module, en werkt daarom alleen in de laatste revisies van Chrome
(50.x). ES6 biedt een groot aantal voordelen ten opzichte van ES5, en
die worden vooral gebruikt om de code efficiënt en gestructureerd te
maken. De module bestaat uit twee onderdelen: De *LeagueMap*-module die
de directe functionaliteit van de webapplicatie afvangt, en de
*RiotHeatmap*-module, die het mogelijk maakt om op een dynamische manier
*heatmaps* te tonen aan de gebruiker.

*LeagueMap-module*

De LeagueMap-module bestaat uit een onderdelen die worden geladen als de
pagina in de browser geladen is. Één van de eerste dingen die de module doet
is het inladen van vier bestanden: champion-informatie, voor het opzoeken en 
filteren van champions; matchdata om de informatie over de *kills* op te zoeken; 
golddata om de groei van gold over de tijd te kunnen analyseren; en position-data.
Deze worden ingeladen via een ES6-*promise* request, om er voor te zorgen dat
alle data aanwezig is voordat deze data verwerkt wordt. 

Vervolgens worden deze gekoppeld aan een serie van *crossfilter*-instanties. 
Crossfilter is een Javascript-library die het mogelijk maakt om grote hoeveelheden
data op een snelle manier te kunnen groeperen en filteren. Aangezien de data die geladen
wordt meer dan 200,000 records bevat (en realtime gefilterd kunnen worden) is deze library
nodig om de performance goed te houden. Er worden 6 crossfilter-instanties aangemaakt.
Drie van deze instanties worden gebruikt om de initiele analyses mogelijk te maken.
Nogmaals drie instanties worden gebruikt voor de vergelijkingen (mochten deze gebruikt worden). Om de performance van het verloop van *gold* over de tijd heen hoog te houden, worden er gebruik gemaakt van MapReduce-functies, die grote hoeveelheden data kunnen groeperen en reduceren naar een enkele begrijpbare waarde (gold over de tijd heen).

Voor het zoeken van champions en het verwerken van de data van champions wordt een combinatie van D3 / jQuery gebruikt. De D3 selections maken het mogelijk om snel en efficiënt de elementen toe te voegen, en jQuery maakt het mogelijk om hier eenvoudig de nodige HTML voor aan te passen. Samengevoegd zorgt dit ervoor dat zoekopdrachten naar champions real-time verwerkt kunnen worden. 

Voor de grafiek van het verloop van *gold* over de tijd heen, en de tijd-selector (om door de heatmaps heen te gaan) wordt een koppeling gemaakt tussen crossfilter en D3 via een library genaamd DC.js. Deze maakt het mogelijk om de efficiëntie die wordt gehaald door crossfilter vertaald kan worden naar een voor D3-efficiënte implementatie. 

De verschillende stappen worden aan elkaar gekoppeld via een Bootstrap-scrollspy module, die het mogelijk maakt de voortgang te volgen door naar de menu's te kijken. Velocity.js zorgt ervoor dat de animaties die worden gebruikt in de webapplicatie soepel verlopen, en niet afdoen aan de performance voor de gebruiker. 

*RiotHeatmap-module*

Voor de heatmap wordt gebruik gemaakt van een aangepaste implementatie van de simpleheat.js-library. Deze library is op een aantal punten aangepast, om het mogelijk te maken crossfilter-data te gebruiken, zonder enige performanceverlies (ten opzichte van de standaard-implementatie). Deze library maakt de heatmap door een aantal cirkels te tekenen op een canvas-element (in *grayscale*), met een lage *opacity*, op de locatie van het punt. Des te meer punten er worden getekend op die plek, des te hoger de concentratie van zwart op dat punt. Deze concentratie van zwart wordt vervolgens omgezet naar een kleur (die wordt gegeven; blauw tot rood in dit geval) om de heatmap te kunnen maken. 

Dit canvas-element wordt op een SVG-element gepositioneerd (die even groot is), met een image-element dat de minimap van het League of Legends-spel representeert. De canvas heeft hierin een lage opacity; zo kan je de heatmap zien als overlay van de League of Legends-minimap.

Challenges
================

*Geen dashboard meer*

Tijdens de ontwikkeling van dit project zijn er een aantal wijzigingen geweest ten opzichte van het initiële design-document. Allereerst is het idee om een dashboard te ontwikkelen op basis van de data afgeschaft. Tijdens het ontwikkelen van het design-document had ik geen rekening gehouden met het 'verhaal'-element. Voor niet-spelers zou het totaal onduidelijk zijn geweest wat voor data er getoond wordt, en zou het daarom ook geen meerwaarde hebben. Naar aanleiding van deze gedachte is het doel en het design van de applicatie geheel anders geworden. Er is meer uitleg over het spel, en de gebruiker van de applicatie doorloopt nu een aantal stappen (met filters) alvorens deze de visualisaties te zien krijgt. Hierdoor krijgt de gebruiker een beter beeld van de elementen op de applicatie, en wordt deze door de applicatie heen geleid. 

*Performance van de heatmap*

Het lijkt lastig te zijn om een heatmap te maken die ook nog eens efficiënt wordt gemaakt op basis van meer dan 100,000 records. Een groot gedeelte van de ontwikkeltijd is hier in gegaan. De eerste ideeën om dit op basis van D3 te doen werden afgeschaft; de performance hiervan was te laag. Hierna is de heatmap.js-library gebruikt, maar ook deze had uiteindelijk (naar mate er meer records werden toegevoegd) een te lage performance. Een crossfilter / simpleheat.js-hybride bleek uiteindelijk de performance te behalen die nodig was voor de applicatie (en had als bijkomend voordeel dat deze eenvoudiger uit te breiden was).

*Minder grafieken, meer duidelijkheid*

Een ander element van het verwijderen van het dashboard, was het wijzigen van het aantal visualisaties dat werd getoond aan de gberuiker. Allereerst was ik in de veronderstelling dat meer informatie tonen beter is, maar al gauw kwam ik er achter (vooral toen de vergelijkingen werden ontwikkeld) dat het principe van *less is more* zeker opgaat. De gebruiker kan daarom nu alle visualisaties die worden getoond zelf uitkiezen, met een beschrijving van ieder van de visualisaties. Uiteindelijk is hiermee het gebruikersgemaak verhoogd.

Trade-offs
================

Één van de belangrijkste trade-offs die naar voren kwam bij de eerdergenoemde challenges, was de verminderde informatiestroom naar de gebruiker. De *hard-core* League of Legends-speler kan nu minder met de informatie die wordt getoond dan in een eerdere revisie van het systeem. Omdat het nieuwe design gebruiksvriendelijker is, en het gros van de populatie nu beter met de applicatie om kan gaan, nam ik deze wijziging voor lief. Als de visualisaties gebruikt gaan worden in de context van een League of Legends-fanwebsite, dan moet hier anders naar gekeken worden. 

Uiteindelijk hebben de meeste wijzigingen hierin het algemene gebruikersgemak verhoogd, en de performance verbeterd.