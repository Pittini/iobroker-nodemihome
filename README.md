# iobroker-nodemihome Skript (kein Adapter!) BETA
Skript zur Steuerung von bisher nicht unterstützten Xiaomi Geräten in Iobroker via node-mihome

## Features:
* Auslesen von Token und anderen Devicedaten via CloudLogin
* Steuerung und Information zum Xiaomi Airpurifier3H

## Aktuell unterstütze Geräte (lesen/schreiben):
* Xiaomi Air Purifier 3H (voll/voll)
* YeeLight Strip Plus (voll/teilw.)
* Roussou Fan (voll/voll)
* Yeelight LED Bulb (Color) (voll/teilw.)
* Yeelight LED Bulb (Tunable) (voll/teilw.)
* Smartmi Evaporative Humidifier (voll/voll)

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

Nach dem Start solltest Du nun unter "javaskript.0.MiHome" etliche Channels (abhängig von der Anzahl der Geräte welche Du besitzt) finden, mit den jeweiligen Basisdaten wie Ip Adresse, Token usw.
In einem dieser Channels findest Du nun auch die Daten Deines AirPurifiers mit weiteren Datenpunkten.

## Known Issues
### Xiaomi Air Purifier 3H
- Mode kann gelesen aber nicht gesetzt werden.  
Gefixt sobald gemerged wird: https://github.com/maxinminax/node-mihome/pull/15
- FilterLifetime wird nicht angezeigt.  
Gefixt sobald gemerged wird: https://github.com/maxinminax/node-mihome/pull/15

## Changelog
#### 16.12.20 (V0.1.6)
- Fix: Problem mit unterschiedlichen dids behoben
#### 3.12.20 (V0.1.4)
- Add: Init