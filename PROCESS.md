## Proces

### 04-01-2016

Eerste opzet gemaakt, met een proposal. Tevens de documentatie van de Riot API bekeken en besloten dat deze API afdoende is voor alle informatie

### 05-01-2016

Eerste scripts gemaakt om de Riot API uit te kunnen lezen / API key aangevraagd. Opzet gemaakt om de data in op te kunnen slaan (het uiteindelijke json-bestand)

### 06-01-2016

Kill-data weggeschreven naar bestanden. Via Crossfilter / DC.js eerste grafiek (en dot-map met posities) gemaakt! Geen moeilijkheden uiteindelijk

### 07-01-2016
Data-bestanden aangepast. Mogelijk gemaakt om te filteren per 'action type' in een minuut. Dot-map efficiënter gemaakt. Dot-map uiteindelijk niet makkelijk om te zetten naar heatmap

### 08-01-2016
Eerste (hele langzame) heatmap gekoppeld aan filters voor prototype. Deze is ook al functioneel.

### 11-01-2016
Heatmap efficiënter gemaakt. Moeilijk deze dynamisch te maken op aantal kills.

### 12-01-2016
Andere library gebruikt voor de heatmap. Veel sneller nu, en mogelijk om dynamisch de max-min op te kunnen geven. Aantal acties / 525 blijkt een goede formule hiervoor te zijn (voor de radius, ceil naar 1.0)

### 13-01-2016
Code opgeschoond. Voornamelijk ES6 code gebruikt nu. Maakt het mogelijk om classes te gebruiken, promises, eigenlijk alles wat nuttig is voor dit project.

### 14-01-2016 tot 18-01-2016
Script geschreven om ook positie-data te kunnen verwerken van alle champions. Dit was uiteindelijk moeilijk, omdat deze geheel anders in de timeline terecht komen. Mogelijkheid gemaakt om meerdere heatmaps toe te voegen

### 19-01-2016 tot 21-01-2016
Design geheel omgeschreven. Verhaal-aspect meer naar voren laten komen. Design-document wordt aankomende week op basis hiervan gewijzigd. Systeem is nu in plaats van een dashboard een 'stappenplan', met meer uitleg per stap over het spel. Zorgt voor meer duidelijkheid.
