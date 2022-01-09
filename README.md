# iobroker-nodemihome Skript (kein Adapter!) BETA
Skript zur Steuerung von bisher nicht unterstützten Xiaomi Geräten in Iobroker via node-mihome

## Features:
* Auslesen von Token und anderen Devicedaten via CloudLogin
* Steuerung und Information von Xiaomi Geräten



## Aktuell vom Skript unterstütze Geräte - Name - Model - (lesen/schreiben):

### Fans
* Roussou Fan                     - leshow.fan.ss4          - (voll/voll)
* Mi Fan 2S                       - zhimi.fan.za4           - (voll/voll)
* Mi Smart Standing Fan Pro       - dmaker.fan.p15          - (voll/voll)
* Mi Smart Standing Fan 1C        - dmaker.fan.1c           - (voll/voll)
* Mi Smart Standing Fan 2         - dmaker.fan.p18          - (voll/voll)
* SmartMi Fan 3                   - zhima.fan.za5           - (voll/voll)

### Humidifiers
* Smartmi Evaporative Humidifier  - zhimi.humidifier.cb1    - (voll/voll)
* Smartmi Evaporative Humidifier  - deerma.humidifier.jsq   - (ready to test)
* Smartmi Evaporative Humidifier  - zhimi.humidifier.ca4    - (voll/ voll)
* XIAOMI Mijia Pure Evaporation   - deerma.humidifier.jsq4   - (voll/ voll)

### Purifiers
* Xiaomi Air Purifier 3H          - zhimi.airpurifier.mb3   - (voll/voll)
* Xiaomi Air Purifier 2H          - zhimi.airpurifier.mc2   - (voll/voll)
* Mi Air Purifier Pro H           - zhimi.airpurifier.vb2   - (voll/voll)
* Mi Air Purifier 3C              - zhimi.airpurifier.mb4   - (voll/voll)
* Mi Air Purifier Pro             - zhimi.airpurifier.v7    - (voll/voll)
* Air Purifier                    - zhimi.airpurifier.ma4   - (ready to test)
* Xiaomi Air Purifier 2S          - zhimi.airpurifier.mc1   - (voll/voll)
* Xiaomi Air Purifier 2           - zhimi.airpurifier.m1    - (ready to test)
* Xiaomi Air Purifier 2S (China)  - zhimi.airpurifier.ma2   - (voll/voll)

### Lights
* YeeLight Strip Plus             - yeelink.light.strip2    - (voll/teilw.)
* Yeelight LED Bulb (Color)       - yeelink.light.color2    - (voll/teilw.)
* Yeelight LED Bulb (Tunable)     - yeelink.light.ct2       - (voll/voll)
* Yeelight Crystal Pedestal Light - yeelink.light.ceiling1  - (in progress)
* Yeelight LED Ceiling Light      - yeelink.light.ceiling3  - (ready to test)
* Mi LED Desk Lamp 1S             - yeelink.light.lamp4     - (voll/voll)
* Yeelight Meteorite Pendelleuchte- yeelink.light.ceiling10 - (voll/voll)



## Installation:
  ###  Vorraussetzungen: 
   1. Installierter "JavaScript Adapter" aka "Script Engine" ab Version 4.8.0   
   ![iobnmhtut2.jpg](/admin/iobnmhtut2.jpg) 
   2. Im Javascript Adapter als Zusatzmodul eingetragene "node-mihome" und "setObject" zugelassen.   
   ![iobnmhtut1.jpg](/admin/iobnmhtut1.jpg) 
   
      

   3. Du kennst Deine Logindaten der Xiaomi Cloud (aka Mi Home App) (egal ob EU oder Chinaserver) und hast diese in den Skripteinstellungen eingetragen.
   4. Du weist auf welchem Server (Mainland China oder De) Dein Gerät registriert ist und hast dies in den Skripteinstellungen, bei "options" eingetragen.
   5. Du legst ein neues JS Projekt an und kopierst das Skript dort hinein
   6. Du trägst im Skript Usernamen und Passwort Deines Xiaomi Cloudzugangs ein

Nach dem Start solltest Du nun unter "javaskript.0.MiHomeAll" etliche Channels (abhängig von der Anzahl der Geräte welche Du besitzt) finden, mit den jeweiligen Basisdaten wie Ip Adresse, Token usw.
In einem dieser Channels findest Du nun auch die Daten des gesuchten Gerätes mit weiteren Datenpunkten, u.a. dem Modelnamen. Merk oder notier Dir diesen, im nächsten Schritt mußt Du die entsprechende Definitionsdatei kopieren.   
  

## Anleitung für Integration nicht in der originalen node-mihome vorhandener Geräte (inzwischen fast alle, bitte nach dieser Anleitung vorgehen)!
1. Die Device Definitionsdatei/en welche zu Deinem Gerät/en gehört, von hier: https://github.com/Pittini/iobroker-nodemihome/tree/main/DefinitionfilesForNode-Mihome nach: /opt/iobroker/node_modules/iobroker.javascript/node_modules/node-mihome/lib/devices/ kopieren.
2. Mindestens den Javaskript Adapter neustarten, idealerweise das gesamte System. 
3. Die aktuellste Skriptversion installieren und starten.
   

## Known Issues
### Script kann sich nicht anmelden: Error: Pls login before make any request
- Vor der Einrichtung im ioBroker bitte erst in der Smartphoneapp abmelden. Nach erfolgreicher Einrichtung im ioBroker kann auch am Handy wieder angemeldet werden.
- Siehe https://github.com/Pittini/iobroker-nodemihome/issues/48

### Alle Farblampen
- Farbe kann nicht gesetzt werden
- Definitionsdateien welche manuell ins Verzeichnis /opt/iobroker/node_modules/iobroker.javascript/node_modules/node-mihome/lib/devices/ kopiert wurden, gehen nach update des JS Adapters bzw. der node-mihome verloren und müssen erneut einkopiert werden. Dieses Verhalten bleibt solange bestehen bis der node-mihome Entwickler die entsprechenden PullRequests merged und liegt nicht in meiner Kontrolle. 

**If you like it, please consider a donation:**
                                                                          
[![paypal](https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=GGF786JBJNYRN&source=url) 

## Changelog
#### 09.01.22
* Add: Integration Mi Air Purifier 2S https://github.com/Pittini/iobroker-nodemihome/pull/55
#### 04.12.21 (0.2.28)
* Del: Integration Mijia Laser TV > fengmi.projector.fm15 canceled/removed
* Add: Testintegration XIAOMI Mijia CJSJSQ01DY Pure Evaporation > deerma.humidifier.jsq4 https://github.com/Pittini/iobroker-nodemihome/issues/50
* Fix: zhimi.humidifier.ca4 ControlLock konnte gelesen aber nicht gesetzt werden. Typo in Def. Datei behoben.
* Add: Neue Einstellungsvariable skipRssiRefresh integriert um Netzlast zu verringern wenn rssi und isOnline nicht benötigt wird. 
#### 22.10.21 (0.2.27)
* Add: Integration Mijia Laser TV > fengmi.projector.fm15 https://github.com/Pittini/iobroker-nodemihome/issues/47
#### 18.10.21 (0.2.26)
* Fix: Test und fix für zhimi.humidifier.ca4 https://github.com/Pittini/iobroker-nodemihome/issues/46
#### 18.08.21 (0.2.25)
* Add: Integration SmartMi Fan 3 > zhimi.fan.za5 https://github.com/Pittini/iobroker-nodemihome/issues/33
#### 06.08.21 (0.2.24)
* Fix: Rssi und isOnline werden nun korrekt refresht
#### 24.06.21 (0.2.23)
* Add: Integration Mi Smart Standing Fan 2 > dmaker.fan.p18 https://github.com/Pittini/iobroker-nodemihome/issues/37
* Fix: Kleinere interne Bugs
#### 24.06.21 (0.2.18)
* Add: Testintegration Mi Air Purifier 2 > zhimi.airpurifier.m1 https://github.com/Pittini/iobroker-nodemihome/issues/34
#### 07.06.21 (0.2.17)
* Fix: Mi Fan 2S > zhimi.fan.za4 Datenpunkte für Drehwinkel, Winkelaktivierung und Normal/Natural korrigiert https://github.com/Pittini/iobroker-nodemihome/issues/31
* Add: Integration Yeelight YLDL01YL Meteorite Pendelleuchte > yeelink.light.ceiling10 https://github.com/Pittini/iobroker-nodemihome/issues/29
#### 20.05.21 (0.2.16)
* Add: Integration Mi Air Purifier 2S > zhimi.airpurifier.mc1 https://github.com/Pittini/iobroker-nodemihome/issues/28
#### 11.05.21 (0.2.15)
* Add: Integration Mi Smart Standing Fan 1C > dmaker.fan.1c. https://github.com/Pittini/iobroker-nodemihome/issues/27
* Add: Automatische Konvertierung von String zu Zahl (wenn möglich) um Probleme mit Vis jqui input zu vermeiden.
#### 04.05.21 (0.2.14)
* Add: Integration Air Purifier > zhimi.airpurifier.ma4
#### 04.05.21 (0.2.13)
* Add: Mi Smart Standing Fan Pro hinzugefügt.
#### 15.04.21 (0.2.12)
- Fix: Probleme beim power Datenpunkt vom Mi Fan 2S und Mi Desk Lamp 1S behoben. https://github.com/Pittini/iobroker-nodemihome/issues/21 + https://github.com/Pittini/iobroker-nodemihome/issues/20
#### 11.04.21 (0.2.11)
- Fix: Problem mit "led" beim Purifier Pro behoben
- Add: Purifier Pro (ohne H) integriert
#### 11.03.21 (0.2.10)
- Add: Mi LED Desk Lamp 1S aka yeelink.light.lamp4
#### 01.02.21 (0.2.9)
- Fix: Falschen Datentyp für alarm.alarm beim Airpurifier 3H korrigiert. https://github.com/Pittini/iobroker-nodemihome/issues/14
#### 01.02.21 (0.2.8)
- Add: Purifier 2H integriert und getestet (https://github.com/Pittini/iobroker-nodemihome/issues/6)
- Change: Interne Codeänderungen und Ergänzungen.
#### 25.01.21 (0.2.7)
- Change: Statt wie bisher bei Datenänderung das gesamte Device zu aktualisieren werden nun nur noch geänderte Werte aktualisiert.
#### 19.01.21 (0.2.5)
- Add: Purifier 3C zum testen hinzugefügt.
#### 16.01.21 (0.2.4)
- Fix: Purifier, alle Modelle, Filterproperties korrigiert.
- Fix: Fehler bei leeren Datenpaketen behoben.
#### 16.01.21 (0.2.3)
- Add:  Modelle hinzugefügt
#### 05.01.21 (0.2.0)
- Change: Nahezu vollständiger rewrite. Es können nun (theoretisch) eine unbegrenzte Zahl von Xiaomi Geräten simultan verarbeitet werden. Skript kann relativ leicht durch hinzufügen neuer Definitionen um weitere Geräte erweitert werden.
- Change: Die Datenpunktstruktur und Bezeichnungen für den Air Purifier 3H haben sich im Vergleich zum Vorgängerskript komplett verändert, bitte nötigenfalls Vis anpassen.
#### 16.12.20 (V0.1.6)
- Fix: Problem mit unterschiedlichen dids behoben
#### 3.12.20 (V0.1.4)
- Add: Init

.   
**If you like it, please consider a donation:**
                                                                          
[![paypal](https://www.paypalobjects.com/en_US/DK/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=GGF786JBJNYRN&source=url) 
