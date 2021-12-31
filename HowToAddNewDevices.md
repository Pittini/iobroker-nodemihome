### How to add new Devices to iobroker nodemihome:

Um ein neues Gerät für iobroker/nodemihome verfügbar zu machen sind folgende Schritte nötig:

1. Das Skript installieren und einmalig starten. Es werden jetzt alle Geräte abgerufen welche Ihr bei der Xiaomi App verfügbar habt. Darunter sollte auch das neue, noch nicht integrierte Gerät, aufzufinden sein. Wichtig ist hier die genaue Modelbezeichnung wie z.B. "deerma.humidifier.jsq4".
2. Nun ruft Ihr im Browser die Seite http://miot-spec.org/miot-spec-v2/instances?status=all auf, und gebt in der Browsersuche die genaue Modellbezeichnung aus Schritt 1 an. Habt Ihr die gefunden, kopiert Euch die "urn" raus, sieht z.B. so aus: "**urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq4:1**"
3. Zusammen mit dem Präfix entsteht nun aus obiger urn, eine komplette Adresse wie z.B. **https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq4:1** - diese ruft Ihr nun auf und erhaltet ein JSON welche alle Propertys Eures Gerätes anzeigt. Der Einsatz eines JSON Viewers wie z.B. dem "Online JSON Viewer" - http://jsonviewer.stack.hu/ ist angeraten um eine übersichtliche Darstellung zu haben.
4. Jetzt kommt der lästige Teil, Ihr müßt rausfinden welches der beiden von Xiaomi verwendeten Protokolle Euer Gerät spricht, "miio oder "miot". Um Zeit und Aufwand zu sparen, mache ich die dazu nötigen "Versuche" meist nur mit dem Ein/Ausschalter, den hat an sich jedes Gerät. **Grundsätzlich gilt:** Für jedes Gerät braucht es ein Definitionsfile und eine Entsprechung im Skript. Um nicht jedes mal alles neu machen zu müssen, hat es sich bewährt, bereits vorhandene Devices zu kopieren und dann passend abzuändern.
Also nehmt Ihr Euch eine vorhandene Definitionsdatei (idealerweise vom gleichen Gerätetyp) und öffnet diese im Editor. Sieht dann z.B. so aus:   

<details>
  <summary>Spoiler</summary>

```Js
const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'zhimi.humidifier.ca4';
  static name = 'Smartmi Evaporative Humidifier';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);

    this._miotSpecType = 'urn:miot-spec-v2:device:humidifier:0000A00E:zhimi-ca4:1';
    this._propertiesToMonitor = [
      'humidifier:on',
      'humidifier:fault',
      'humidifier:fan-level',
      'humidifier:target-humidity',
      'humidifier:water-level',
      'humidifier:speed-level',
      'humidifier:dry',
      'humidifier:use-time',
      'environment:temperature',
      'environment:relative-humidity',
      'alarm:alarm',
      'screen:brightness',
      'physical-controls-locked:physical-controls-locked',
      'other:actual-speed',
      'other:power-time'
    ];
  }

  setPower(v) {
    return this.miotSetProperty('humidifier:on', v);
  }

  setFanLevel(v) {
    return this.miotSetProperty('humidifier:fan-level', v);
  }

  setTargetHumidity(v) {
    return this.miotSetProperty('humidifier:target-humidity', v);
  }

  setMode(v) {
    return this.miotSetProperty('humidifier:dry', v);
  }

  setBuzzer(v) {
    return this.miotSetProperty('alarm:alarm', v);
  }

  setBright(v) {
    return this.miotSetProperty('screen:brightness', v);
  }

  setChildLock(v) {
    return this.miotSetProperty('physical-controls-locked:physical-controls-locked', v);
  }

};
```

</details>   

5. Jetzt korrigiert Ihr Zeile "model", "name" und "this._miotSpecType" entsprechend Eurem Device und lasst vom Block in Zeile 14-30 nur das sichere Ein/Aus Property stehen, das ganze sieht dann so aus:   


```Js
const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'deerma.humidifier.jsq4';
  static name = 'XIAOMI Mijia CJSJSQ01DY Pure Evaporation';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);

    this._miotSpecType = 'urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq4:1';
    this._propertiesToMonitor = [
        'humidifier:on'
    ];
  }

  setPower(v) {
    return this.miotSetProperty('humidifier:on', v);
  }

};
```

6. Jetzt die Datei unter neuem Namen abspeichern. Der Name MUSS der Modelname mit der Endung .js sein, in unserem Beispiel also **deerma.humidifier.jsq4.js**
7. Die Device Definitionsdatei jetzt nach: /opt/iobroker/node_modules/iobroker.javascript/node_modules/node-mihome/lib/devices/ kopieren.
8. Mindestens den **Javaskript Adapter neustarten**, idealerweise das gesamte System. 
9. Jetzt muß das Skript angepasst/ergänzt werden, hierzu ist zuerst der nächste Index zu ermitteln, d.h. Ihr sucht im Skript, im Definitionsbereich nach **"DefineDevice[xx] ="**, wobei xx für den Index steht. Also angenommen der höchste Index den Ihr findet ist 24, dann nehmt Ihr für Euren neuen Eintrag die 25.
10. Nun stellt einen neuen Defintionsblock ins Skript, der Index ist gemäß .9 anzupassen, ebenso model und description. Ihr könnt nachstehendes Beispiel kopieren, hier ist bereits für Testzwecke der "Empfänger" für beide möglichen Protokolle integriert.

```Js
DefineDevice[25] = { // Untestet
    info: {},
    model: "deerma.humidifier.jsq4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq4:1
    description: "XIAOMI Mijia CJSJSQ01DY Pure Evaporation",
    setter: {
        "humidifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "power": async function (obj, val) { await device[obj].setPower(val) }
    },
    common:
        [{ name: "humidifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};
```

11. Nachdem Ihr das Skript gespeichert und gestartet habt, sollte jetzt ein Kanal für Euer Device erstellt worden sein, dort findet Ihr auch den "on" bzw. "power" Datenpunkt. Hier ist nun zu testen ob dieser: 
a.) befüllt wird, 
b.) bei Schaltung via App, aktualisiert wird, und 
c.) Bei Änderung des Datenpunktes das Gerät auch entsprechend geschaltet wird.

12. Klappt all das, wißt Ihr, dass es das richtige (neue) Protokoll ist und könnt alle verfügbaren Datenpunkte (sowohl in der Def Datei, als auch im Skript) ergänzen, entsprechend dem in .3 bereits erwähnten JSON Daten. Das meiste läßt sich von anderen Devices kopieren, sowohl in der Def. Datei, als auch im Skript. Es liegt bei Euch ob Ihr wirklich jedes Property einbinden wollt (actions und events klappt nicht, könnt Ihr Euch sparen) oder Euch auf sinnvolles bzw. gebräuchliches beschränkt. Solltet Ihr hier nicht weiterkommen, erstellt ein Issue, nach Eurer Vorarbeit ist es kein Problem das für Euch fertig zu machen.
13. Klappt es jedoch nicht, müßt Ihr das andere Protokoll versuchen, hierzu sind die Schritte .4 bis inkl. .8 mit, wie folgt, geänderten Daten (Die Zeile "this._miotSpecType..." fällt ersatzlos weg und aus 'humidifier:on' wird 'power') zu wiederholen.


  ```Js
const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'deerma.humidifier.jsq4';
  static name = 'XIAOMI Mijia CJSJSQ01DY Pure Evaporation';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);

    this._propertiesToMonitor = [
        'power'
    ];
  }

  setPower(v) {
    return this.miotSetProperty('power', v);
  }


};
  ```

14. Damit hats jetzt geklappt mit dem An/Aus schalten? Dann kommt jetzt die schlechte Nachricht, es gibt keine Quelle, fürs alte Protokoll, wo Du nachsehen könntest welche Propertys das Gerät hat, hier hilft nur try and error. Die schöne Übersicht aus .3 ist hier nutzlos. Sieh nach ob ähnliche Geräte bereits mit dem alten Protokoll bei den Def Dateien dabei sind und versucht nach und nach die dortigen Befehle, evtl. abgeglichen mit den Befehlen welche Euch die App anbietet, durch zu testen.   

    Sollte auch nur EIN Eintrag in "this._propertiesToMonitor =" fehlerhaft, bzw. nicht vorhanden sein, tritt ein interner Fehler auf und es werden **keinerlei** Daten mehr zu oder von diesem Gerät geschickt, d.h. auch die anderen, bereits getesteten Punkte funktionieren nicht mehr.
 
