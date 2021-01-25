# iobroker-nodemihome Skript (kein Adapter!) BETA
Skript zur Steuerung von bisher nicht unterstützten Xiaomi Geräten in Iobroker via node-mihome

## Features:
* Auslesen von Token und anderen Devicedaten via CloudLogin
* Steuerung und Information von Xiaomi Geräten



## Aktuell vom Skript unterstütze Geräte - Name - Model - (lesen/schreiben):

### Fans
* Roussou Fan                     - leshow.fan.ss4 - (voll/voll)
* Fan                             - zhimi.fan.za4 - (ready to test)

### Humidifiers
* Smartmi Evaporative Humidifier  - zhimi.humidifier.cb1    - (voll/voll)
* Smartmi Evaporative Humidifier  - deerma.humidifier.jsq   - (ready to test)
* Smartmi Evaporative Humidifier  - zhimi.humidifier.ca4    - (ready to test)

### Purifiers
* Xiaomi Air Purifier 3H          - zhimi.airpurifier.mb3   - (voll/voll)
* Xiaomi Air Purifier 2H          - zhimi.airpurifier.mc2   - (ready to test)
* Mi Air Purifier Pro H           - zhimi.airpurifier.vb2   - (voll/voll)
* Mi Air Purifier 3C              - zhimi.airpurifier.mb4   - (voll/voll - waiting for pr)

### Lights
* YeeLight Strip Plus             - yeelink.light.strip2    - (voll/teilw.)
* Yeelight LED Bulb (Color)       - yeelink.light.color2    - (voll/teilw.)
* Yeelight LED Bulb (Tunable)     - yeelink.light.ct2       - (voll/voll - waiting for pr)
* Yeelight Crystal Pedestal Light - yeelink.light.ceiling1  - (in progress)
* Yeelight LED Ceiling Light      - yeelink.light.ceiling3  - (ready to test)


## Installation:
  ###  Vorraussetzungen: 
   1. Installierter "JavaScript Adapter" aka "Script Engine" ab Version 4.8.0   
   ![iobnmhtut2.jpg](/admin/iobnmhtut2.jpg) 
   2. Im Javascript Adapter als Zusatzmodul eingetragene "node-mihome".   
   ![iobnmhtut1.jpg](/admin/iobnmhtut1.jpg) 
   3. Du kennst Deine Logindaten der Xiaomi Cloud (egal ob EU oder Chinaserver) und hast diese in den Skripteinstellungen eingetragen.
   4. Du weist auf welchem Server (Mainland China oder De) Dein Gerät registriert ist und hast dies in den Skripteinstellung, bei "options" eingetragen.
   5. Du legst ein neues JS Projekt an und kopierst das Skript dort hinein
   6. Du trägst im Skript Usernamen und Passwort Deines Xiaomi Cloudzugangs ein

Nach dem Start solltest Du nun unter "javaskript.0.MiHomeAll" etliche Channels (abhängig von der Anzahl der Geräte welche Du besitzt) finden, mit den jeweiligen Basisdaten wie Ip Adresse, Token usw.
In einem dieser Channels findest Du nun auch die Daten des gesuchten Gerätes mit weiteren Datenpunkten.

## Known Issues
### Alle Farblampen
- Farbe kann nicht gesetzt werden

## Changelog
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
