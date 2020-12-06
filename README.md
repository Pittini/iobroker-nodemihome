# iobroker-nodemihome Skript (kein Adapter!) BETA
Skript zur Steuerung von bisher nicht unterstützten Xiaomi Geräten in Iobroker via node-mihome

## Features:
* Auslesen von Token und anderen Devicedaten via CloudLogin
* Steuerung und Information zum Xiaomi Airpurifier3H

## Installation:
  ###  Vorraussetzungen: 
   1. Installierter "JavaScript Adapter" aka "Script Engine" ab Version 4.
   ![iobnmhtut2.jpg](/admin/iobnmhtut2.jpg) 
   3. Im Javascript Adapter als Zusatzmodul eingetragene "node-mihome".
   ![iobnmhtut1.jpg](/admin/iobnmhtut1.jpg) 
   5. Du kennst Deine Logindaten der Xiaomi Cloud (egal ob EU oder Chinaserver) und hast diese in den Skripteinstellungen eingetragen.
   6. Du weist auf welchem Server (Mainland China oder De) Dein Gerät registriert ist und hast dies in den Skripteinstellung, bei "options" eingetragen.
   7. Du legst ein neues JS Projekt an und kopierst das Skript dort hinein
   8. Du trägst im Skript Usernamen und Passwort Deines Xiaomi Cloudzugangs ein

Nach dem Start solltest Du nun unter "javaskript.0.MiHome" etliche Channels (abhängig von der Anzahl der Geräte welche Du besitzt) finden, mit den jeweiligen Basisdaten wie Ip Adresse, Token usw.
In einem dieser Channels findest Du nun auch die Daten Deines AirPurifiers mit weiteren Datenpunkten.

## Known Issues
- Mode kann gelesen aber nicht gesetzt werden.
- FilterLifetime wird nicht angezeigt.

## Changelog
#### 3.12.20 (V0.1.4)
- Add: Init