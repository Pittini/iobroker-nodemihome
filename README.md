# iobroker-nodemihome BETA
Steuerung von bisher nicht unterstützten Xiaomi Geräten in Iobroker via node-mihome

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

## Known Issues
- Mode kann gelesen aber nicht gesetzt werden.
- FilterLifetime wird nicht angezeigt.

## Changelog
#### 3.12.20 (V0.1.3)
- Add: Init