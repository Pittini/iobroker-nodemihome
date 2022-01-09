const SkriptVersion = "0.2.29"; //vom 9.1.2022 / Link zu Git: https://github.com/Pittini/iobroker-nodemihome / Forum: https://forum.iobroker.net/topic/39388/vorlage-xiaomi-airpurifier-3h-u-a-inkl-token-auslesen

const mihome = require('node-mihome');

// Logindaten für Xiaomi Cloud:
const username = '';
const password = '';
const options = { country: 'de' }; // 'ru', 'us', 'tw', 'sg', 'cn', 'de' (Default: 'cn');
const refresh = 10000; // Alle 10sek neue Daten
const SkipRssiRefresh = true; //Bei true wird rssi und isOnline nicht mehr aktualisiert was zu verminderter Netzlast führt.

const praefix0 = "javascript.0.MiHomeAll"; //Root für Skriptdatenpunkte

const logging = false; //Logging aktivieren/deaktivieren

//Ab hier nix mehr ändern!
/*
1. Xiaomi Cloudlogin
2. Alle dort gelisteten Geräte und deren Basicdaten abrufen
3. Für alle abgerufenen Geräte Basic Channel/Datenpunkte anlegen
4. Prüfen welche supporteten Geräte in der Auflistung vorhanden sind und die entsprechenden spezifischen Datenpunkte erstellen
5. Basic Channels mit Daten füllen / einlesen
6. devicearray erstellen via node-mihome und die Gerätespezifischen Werte einlesen


*/
// const DeviceData = [];
let AllDevicesRaw = [];
let device = [];
const States = [];
let DpCount = 0;
let GenericDpRefreshIntervalObj;
const DefineDevice = [];

log("Starting AllMyMi V." + SkriptVersion);

Init();


// ***************************** Device Definitions *************************

// ***************************** Airpurifiers ********************************

DefineDevice[0] = { // Tested and working
    info: {},
    model: "zhimi.airpurifier.mb3",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb3:2
    description: "Purifier 3H",
    setter: {
        "air-purifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "air-purifier.mode": async function (obj, val) { await device[obj].setMode(val) },
        "motor-speed.favorite-fan-level": async function (obj, val) { await device[obj].setFavLevel(val) },
        "air-purifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "indicator-light.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "air-purifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", type: "number", read: true, write: false, min: 0, max: 5, states: { 0: "No faults", 1: "m1_run", 2: "m1_stuck", 3: "no_sensor", 4: "error_hum", 5: "error_temp", 6: "timer_error1", 7: "timer_error2" } },
        { name: "air-purifier.mode", type: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "sleep", 2: "favorite", 3: "fanset" } },
        { name: "air-purifier.fan-level", type: "number", read: true, write: true, min: 1, max: 3 },
        { name: "alarm.alarm", type: "boolean", read: true, write: true },
        { name: "indicator-light.brightness", type: "number", read: true, write: true, min: 0, max: 2 },
        { name: "indicator-light.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "motor-speed.motor-speed", type: "number", read: true, write: false, min: 0, max: 3000, unit: "rpm" },
        { name: "motor-speed.motor-set-speed", type: "number", read: true, write: false, min: 0, max: 3000, unit: "rpm" },
        { name: "motor-speed.favorite-fan-level", type: "number", read: true, write: true, min: 0, max: 14 },
        { name: "use-time.use-time", type: "number", read: true, write: false },
        { name: "environment.relative-humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "environment.pm2_5-density", type: "number", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "filter.filter-life-level", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter.filter-used-time", type: "number", read: true, write: false, unit: "h" },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[20] = {  // Tested and working - https://github.com/Pittini/iobroker-nodemihome/issues/28
    info: {},
    model: "zhimi.airpurifier.mc1",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mc1:1
    description: "Purifier 2S",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "mode": async function (obj, val) { await device[obj].setMode(val) },
        "favorite_level": async function (obj, val) { await device[obj].setFavoriteLevel(val) },
        "led": async function (obj, val) { await device[obj].setLed(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "mode", type: "string", role: "state", read: true, write: true, states: { "auto": "auto", "silent": "silent", "favorite": "favorite" } },
        { name: "favorite_level", type: "number", role: "state", read: true, write: true, min: 1, max: 10 },
        { name: "temp_dec", type: "number", role: "value.temperature", read: true, write: false, min: -40.0, max: 525.0, unit: "°C" },
        { name: "humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "aqi", type: "number", role: "value", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "led", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "buzzer", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "filter1_life", type: "number", role: "value", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "f1_hour", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "f1_hour_used", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[26] = {  // Tested and working
    info: {},
    model: "zhimi.airpurifier.ma2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-ma2:1
    description: "Purifier 2S",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "mode": async function (obj, val) { await device[obj].setMode(val) },
        "favorite_level": async function (obj, val) { await device[obj].setFavoriteLevel(val) },
        "led": async function (obj, val) { await device[obj].setLed(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "mode", type: "string", role: "state", read: true, write: true, states: { "auto": "auto", "silent": "silent", "favorite": "favorite" } },
        { name: "favorite_level", type: "number", role: "state", read: true, write: true, min: 1, max: 10 },
        { name: "temp_dec", type: "number", role: "value.temperature", read: true, write: false, min: -40.0, max: 525.0, unit: "°C" },
        { name: "humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "aqi", type: "number", role: "value", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "led", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "buzzer", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "filter1_life", type: "number", role: "value", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "f1_hour", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "f1_hour_used", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[22] = {  // Tested and working - https://github.com/Pittini/iobroker-nodemihome/issues/34
    info: {},
    model: "zhimi.airpurifier.m1",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-m1:1
    description: "Purifier 2",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "mode": async function (obj, val) { await device[obj].setMode(val) },
        "favorite_level": async function (obj, val) { await device[obj].setFavoriteLevel(val) },
        "led": async function (obj, val) { await device[obj].setLed(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "mode", type: "string", role: "state", read: true, write: true, states: { "auto": "auto", "silent": "silent", "favorite": "favorite" } },
        { name: "favorite_level", type: "number", role: "state", read: true, write: true, min: 1, max: 10 },
        { name: "temp_dec", type: "number", role: "value.temperature", read: true, write: false, min: -40.0, max: 525.0, unit: "°C" },
        { name: "humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "aqi", type: "number", role: "value", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "led", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "buzzer", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "filter1_life", type: "number", role: "value", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "f1_hour", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "f1_hour_used", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[8] = {  // Tested and working - https://github.com/Pittini/iobroker-nodemihome/issues/6
    info: {},
    model: "zhimi.airpurifier.mc2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mc2:1
    description: "Purifier 2H",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "mode": async function (obj, val) { await device[obj].setMode(val) },
        "favorite_level": async function (obj, val) { await device[obj].setFavoriteLevel(val) },
        "led": async function (obj, val) { await device[obj].setLed(val) },
        "led_b": async function (obj, val) { await device[obj].setLedB(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "mode", type: "string", role: "state", read: true, write: true, states: { "auto": "auto", "silent": "silent", "favorite": "favorite" } },
        { name: "favorite_level", type: "number", role: "state", read: true, write: true, min: 0, max: 16 },
        { name: "temp_dec", type: "number", role: "value.temperature", read: true, write: false, min: -40.0, max: 525.0, unit: "°C" },
        { name: "humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "aqi", type: "number", role: "value", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "average_aqi", type: "number", role: "value", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "led", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "led_b", type: "number", role: "state", read: true, write: true, min: 0, max: 2, states: { 0: "bright", 1: "dim", 2: "off" } },
        { name: "buzzer", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "filter1_life", type: "number", role: "value", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "f1_hour", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "f1_hour_used", type: "number", role: "value", read: true, write: false, unit: "h" },
        { name: "motor1_speed", type: "number", role: "value", read: true, write: false, unit: "rpm" },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[13] = { // Tested and working
    info: {},
    model: "zhimi.airpurifier.vb2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-vb2:1
    description: "Mi Air Purifier Pro H",
    setter: {
        "air-purifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "air-purifier.mode": async function (obj, val) { await device[obj].setMode(val) },
        "motor-speed.favorite-level": async function (obj, val) { await device[obj].setFavLevel(val) },
        "air-purifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.volume": async function (obj, val) { await device[obj].setBuzzer(val) },
        "indicator-light.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "air-purifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", type: "number", read: true, write: false, min: 0, max: 5, states: { 0: "No faults", 1: "m1_run", 2: "m1_stuck", 3: "no_sensor", 4: "error_hum", 5: "error_temp", 6: "timer_error1", 7: "timer_error2" } },
        { name: "air-purifier.mode", type: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "sleep", 2: "favorite", 3: "fanset" } },
        { name: "air-purifier.fan-level", type: "number", read: true, write: true, min: 1, max: 3 },
        { name: "alarm.volume", type: "number", read: true, write: true, min: 0, max: 100 },
        { name: "indicator-light.brightness", type: "number", read: true, write: true, min: 0, max: 2 },
        { name: "indicator-light.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "motor-speed.motor1-speed", type: "number", read: true, write: false, min: 0, max: 3000, unit: "rpm" },
        { name: "motor-speed.motor1-set-speed", type: "number", read: true, write: false, min: 0, max: 3000, unit: "rpm" },
        { name: "motor-speed.favorite-level", type: "number", read: true, write: true, min: 0, max: 14 },
        { name: "use-time.use-time", type: "number", read: true, write: false },
        { name: "environment.relative-humidity", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "environment.pm2_5-density", type: "number", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "filter.filter-life-level", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter.filter-used-time", type: "number", read: true, write: false, unit: "h" },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[14] = { // Tested and working - https://github.com/Pittini/iobroker-nodemihome/issues/6
    info: {},
    model: "zhimi.airpurifier.v7",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-v7:1
    description: "Mi Air Purifier",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "mode": async function (obj, val) { await device[obj].setFanLevel(val) },
        "led": async function (obj, val) { await device[obj].setDisplay(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "mode", type: "string", read: true, write: true, states: { "auto": "auto", "silent": "silent", "favorite": "favorite" } },
        { name: "favorite_level", type: "number", read: true, write: false, min: 0, max: 16 },
        { name: "temp_dec", type: "number", role: "value.temperature", read: true, write: false },
        { name: "humidity", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "aqi", type: "number", read: true, write: false, unit: "μg/m³" },
        { name: "average_aqi", type: "number", read: true, write: false, unit: "μg/m³" },
        { name: "led", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "bright", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "volume", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter1_life", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "f1_hour", type: "number", read: true, write: false },
        { name: "f1_hour_used", type: "number", read: true, write: false },
        { name: "motor1_speed", type: "number", read: true, write: false, unit: "rpm" },
        { name: "motor2_speed", type: "number", read: true, write: false, unit: "rpm" },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[15] = { // Tested and working
    info: {},
    model: "zhimi.airpurifier.mb4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb4:2
    description: "Purifier 3C",
    setter: {
        "air-purifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "air-purifier.mode": async function (obj, val) { await device[obj].setMode(val) },
        "custom-service.favorite-speed": async function (obj, val) { await device[obj].setFavSpeed(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "screen.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "air-purifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", type: "string", read: true, write: false },
        { name: "air-purifier.mode", type: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "sleep", 2: "favorite", 3: "fanset" } },
        { name: "alarm.alarm", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "screen.brightness", type: "number", read: true, write: true, min: 0, max: 8 },
        { name: "environment.pm2_5-density", type: "number", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "custom-service.moto-speed-rpm", type: "number", read: true, write: false, min: 0, max: 65535, unit: "rpm" },
        { name: "custom-service.favorite-speed", type: "number", read: true, write: true, min: 300, max: 2300, unit: "rpm" },
        { name: "filter.filter-life-level", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter.filter-used-time", type: "number", read: true, write: false, unit: "h" },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

DefineDevice[18] = { // Untested
    info: {},
    model: "zhimi.airpurifier.ma4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-ma4:1
    description: "Air Purifier",
    setter: {
        "air-purifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "air-purifier.mode": async function (obj, val) { await device[obj].setMode(val) },
        "air-purifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "indicator-light.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "air-purifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", type: "number", read: true, write: false, min: 0, max: 5, states: { 0: "No faults", 1: "m1_run", 2: "m1_stuck", 3: "no_sensor", 4: "error_hum", 5: "error_temp", 6: "timer_error1", 7: "timer_error2" } },
        { name: "air-purifier.mode", type: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "sleep", 2: "favorite", 3: "none" } },
        { name: "air-purifier.fan-level", type: "number", read: true, write: true, min: 1, max: 3 },
        { name: "alarm.alarm", type: "boolean", read: true, write: true, min: false, max: true },
        { name: "indicator-light.brightness", type: "number", read: true, write: true, min: 0, max: 2 },
        { name: "indicator-light.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "environment.relative-humidity", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "environment.pm2_5-density", type: "number", read: true, write: false, min: 0, max: 600, unit: "μg/m³" },
        { name: "filter.filter-life-level", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter.filter-used-time", type: "number", read: true, write: false, unit: "h" },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};

// ***************************** Fans *********************************
//  TODO https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:zhimi-sa1:1

DefineDevice[1] = { // untested
    info: {},
    model: "leshow.fan.ss4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:leshow-ss4:1  
    description: "Leshow Fan",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val ? 'on' : 'off') },
        "blow": async function (obj, val) { await device[obj].setFanLevel(val) },
        "yaw": async function (obj, val) { await device[obj].setFanSwing(val ? 'on' : 'off') },
        "mode": async function (obj, val) { await device[obj].setSleepMode(val) },
        "sound": async function (obj, val) { await device[obj].setBuzzer(val ? 'on' : 'off') },
        "timer": async function (obj, val) { await device[obj].setTimer(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "blow", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "yaw", type: "boolean", role: "switch", read: true, write: true },
        { name: "mode", type: "boolean", role: "switch", read: true, write: true },
        { name: "sound", type: "boolean", role: "switch", read: true, write: true },
        { name: "timer", type: "number", read: true, write: true, min: 0, max: 540, unit: "m" }]
};

DefineDevice[9] = { // Tested and working
    info: {},
    model: "zhimi.fan.za4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:zhimi-za4:1  
    description: "Mi Fan 2S",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "angle": async function (obj, val) { await device[obj].setSwingAngle(val) },
        "angle_enable": async function (obj, val) { await device[obj].setSwing(val) },
        "natural_level": async function (obj, val) { await device[obj].setSleepMode((val == 1) ? true : false) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val ? 'on' : 'off') },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val ? 'on' : 'off') },
        "led_b": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "speed_level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "poweroff_time": async function (obj, val) { await device[obj].setTimer(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "angle", type: "number", read: true, write: true, min: 1, max: 120 },
        { name: "angle_enable", type: "boolean", role: "switch", read: true, write: true },
        { name: "natural_level", type: "number", read: true, write: true, min: 0, max: 1, states: { 0: "Straight Wind", 1: "Natural Wind" } },
        { name: "buzzer", type: "boolean", role: "switch", read: true, write: true },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true },
        { name: "led_b", type: "boolean", role: "switch", read: true, write: true },
        { name: "speed_level", type: "number", read: true, write: true, min: 1, max: 100, unit: "%" },
        { name: "poweroff_time", type: "number", read: true, write: true, min: 0, max: 540, unit: "m" }]
};

DefineDevice[24] = { // Tested and working
    info: {},
    model: "zhimi.fan.za5",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:zhimi-za5:1  
    description: "Smartmi Fan 3",
    setter: {
        "fan.on": async function (obj, val) { await device[obj].setPower(val) },
        "fan.mode": async function (obj, val) { await device[obj].setMode(val) },
        "fan.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "fan.horizontal-swing": async function (obj, val) { await device[obj].setHorizontalSwing(val) },
        "fan.horizontal-angle": async function (obj, val) { await device[obj].setHorizontalAngle(val) },
        "fan.anion": async function (obj, val) { await device[obj].setAnion(val) },
        "custom-service.speed-level": async function (obj, val) { await device[obj].setSpeedLevel(val) },
        "indicator-light.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setAlarm(val) },
        "custom-service.swing-step-move": async function (obj, val) { if(val != "") await device[obj].setSwingStepMove(val)},
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) },
        "fan.off-delay": async function (obj, val) { await device[obj].setOffDelayTime(val) }
    },
    common:
        [{ name: "fan.on", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.mode", type: "number", role: "switch", read: true, write: true, min: 0, max: 1, states: { 0: "Natural Wind" , 1: "Straight Wind" } },
        { name: "fan.fan-level", type: "number", role: "switch", read: true, write: true, min: 1, max: 4, states: { 1: "1", 2: "2", 3: "3", 4: "4"} },
        { name: "fan.horizontal-swing", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.horizontal-angle", type: "number", role: "switch", read: true, write: true, min: 30, max: 120, unit: "°", states: { 30: "30", 60: "60", 90: "90", 120: "120" } },
        { name: "fan.anion", type: "boolean", role: "switch", read: true, write: true },
        { name: "custom-service.speed-level", type: "number", role: "switch", read: true, write: true, min: 1, max: 100},
        { name: "custom-service.battery-state",  type: "boolean", role: "switch", read: true, write: false, states: { true: "used", false: "unused" } },
        { name: "custom-service.speed-now",  type: "number", role: "switch", read: true, write: false, min: 0, max: 3000, unit: "RPM" },
        { name: "custom-service.ac-state",  type: "boolean", role: "switch", read: true, write: false, states: { true: "plugged", false: "unplugged" } },
        { name: "indicator-light.brightness", type: "number", read: true, write: true, min: 0, max: 100, unit:"%"},
        { name: "alarm.alarm", type: "boolean", role: "switch", read: true, write: true },
        { name: "custom-service.swing-step-move", type: "string", role: "switch", read: false, write: true, states: {"": "None", "left": "Left", "right": "Right" }},
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true},
        { name: "fan.off-delay", type: "number", role: "switch", read: true, write: true, min: 0, max: 36000, unit: "s" },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -30.0, max: 100.0, unit: "°C" },
        { name: "environment.relative-humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" }        
        ]
};DefineDevice[17] = { // Tested and working
    info: {},
    model: "dmaker.fan.p15",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:dmaker-p15:1  
    description: "Mi Smart Standing Fan Pro",
    setter: {
        "fan.on": async function (obj, val) { await device[obj].setPower(val) },
        "fan.mode": async function (obj, val) { await device[obj].setMode(val) },
        "fan.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "fan.horizontal-swing": async function (obj, val) { await device[obj].setHorizontalSwing(val) },
        "fan.horizontal-angle": async function (obj, val) { await device[obj].setHorizontalAngle(val) },
        "indicator-light.on": async function (obj, val) { await device[obj].setIndicatorLight(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setAlarm(val) },
        "motor-controller.motor-control": async function (obj, val) { await device[obj].setMotorController(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) },
        "off-delay-time.off-delay-time": async function (obj, val) { await device[obj].setOffDelayTime(val) }
    },
    common:
        [{ name: "fan.on", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.mode", type: "number", role: "switch", read: true, write: true, min: 0, max: 1, states: { 0: "Straight Wind", 1: "Natural Wind" } },
        { name: "fan.fan-level", type: "number", role: "switch", read: true, write: true, min: 1, max: 4, states: { 1: "Slow", 2: "Middle", 3: "High", 4: "Turbo" } },
        { name: "fan.horizontal-swing", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.horizontal-angle", type: "number", role: "switch", read: true, write: true, min: 30, max: 140, unit: "°", states: { 30: "30°", 60: "60°", 90: "90°", 120: "120°", 140: "140°" } },
        { name: "fan.status", type: "number", role: "indicator", read: true, write: false, min: 1, max: 100 },
        { name: "indicator-light.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "alarm.alarm", type: "boolean", role: "switch", read: true, write: true },
        { name: "motor-controller.motor-control", type: "number", role: "switch", read: false, write: true, min: 0, max: 2, states: { 0: "None", 1: "Left", 2: "Right" } },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "off-delay-time.off-delay-time", type: "number", role: "switch", read: true, write: true, min: 0, max: 480, unit: "m" }
        ]
};

DefineDevice[19] = { // Tested and working
    info: {},
    model: "dmaker.fan.1c",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:dmaker-1c:1  
    description: "Mi Smart Standing Fan 1C",
    setter: {
        "fan.on": async function (obj, val) { await device[obj].setPower(val) },
        "fan.mode": async function (obj, val) { await device[obj].setMode(val) },
        "fan.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "fan.horizontal-swing": async function (obj, val) { await device[obj].setHorizontalSwing(val) },
        "fan.brightness": async function (obj, val) { await device[obj].setBrightness(val) },
        "fan.alarm": async function (obj, val) { await device[obj].setAlarm(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) },
        "fan.off-delay-time": async function (obj, val) { await device[obj].setOffDelayTime(val) }
    },
    common:
        [{ name: "fan.on", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.mode", type: "number", role: "switch", read: true, write: true, min: 0, max: 1, states: { 0: "Straight Wind", 1: "Sleep" } },
        { name: "fan.fan-level", type: "number", role: "switch", read: true, write: true, min: 1, max: 3, states: { 1: "Slow", 2: "Middle", 3: "High" } },
        { name: "fan.horizontal-swing", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.status", type: "number", role: "indicator", read: true, write: false, min: 1, max: 100 },
        { name: "fan.brightness", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "fan.alarm", type: "boolean", role: "switch", read: true, write: true },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "fan.off-delay-time", type: "number", role: "switch", read: true, write: true, min: 0, max: 480, unit: "m" }
        ]
};

DefineDevice[23] = { // Tested and working
    info: {},
    model: "dmaker.fan.p18",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:dmaker-p18:1  
    description: "Mi Smart Standing Fan 2",
    setter: {
        "fan.on": async function (obj, val) { await device[obj].setPower(val) },
        "fan.mode": async function (obj, val) { await device[obj].setMode(val) },
        "fan.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "fan.horizontal-swing": async function (obj, val) { await device[obj].setHorizontalSwing(val) },
        "fan.horizontal-angle": async function (obj, val) { await device[obj].setHorizontalAngle(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setAlarm(val) },
        "motor-controller.motor-control": async function (obj, val) { await device[obj].setMotorController(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) },
        "off-delay-time.off-delay-time": async function (obj, val) { await device[obj].setOffDelayTime(val) }
    },
    common:
        [{ name: "fan.on", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.mode", type: "number", role: "switch", read: true, write: true, min: 0, max: 1, states: { 0: "Straight Wind", 1: "Natural Wind" } },
        { name: "fan.fan-level", type: "number", role: "switch", read: true, write: true, min: 1, max: 4, states: { 1: "Slow", 2: "Middle", 3: "High", 4: "Turbo" } },
        { name: "fan.horizontal-swing", type: "boolean", role: "switch", read: true, write: true },
        { name: "fan.horizontal-angle", type: "number", role: "switch", read: true, write: true, min: 30, max: 140, unit: "°", states: { 30: "30°", 60: "60°", 90: "90°", 120: "120°", 140: "140°" } },
        { name: "fan.status", type: "number", role: "indicator", read: true, write: false, min: 1, max: 100 },
        { name: "alarm.alarm", type: "boolean", role: "switch", read: true, write: true },
        { name: "motor-controller.motor-control", type: "number", role: "switch", read: false, write: true, min: 0, max: 2, states: { 0: "None", 1: "Left", 2: "Right" } },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "off-delay-time.off-delay-time", type: "number", role: "switch", read: true, write: true, min: 0, max: 480, unit: "m" }
        ]
};

// ***************************** Lights *********************************

DefineDevice[2] = { // Tested and ok except setting color
    info: {},
    model: "yeelink.light.strip2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-color2:1    
    description: "Yeelight Lightstrip Plus",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val ? 'on' : 'off') },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "hue": async function (obj, val) { await device[obj].setColorHSV(val) },
        "color_mode": async function (obj, val) { await device[obj].setColorMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "hue", type: "number", read: true, write: true, min: 0, max: 16777215 },
        { name: "sat", type: "number", read: true, write: true, min: 0, max: 100 },
        { name: "color_mode", type: "number", read: true, write: true, min: 1, max: 2 },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};

DefineDevice[5] = { // Tested and working
    info: {},
    model: "yeelink.light.ct2",//     http://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ct2:1
    description: "Yeelight LED Bulb (Tunable)",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val ? 'on' : 'off') },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "ct": async function (obj, val) { await device[obj].setColorTemperature(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};

DefineDevice[6] = { // Tested and working except color setting
    info: {},
    model: "yeelink.light.color2",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-color2:1
    description: "Yeelight LED Bulb (Color)",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val ? 'on' : 'off') },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "rgb": async function (obj, val) { await device[obj].setColorRgb(val) },
        "color_mode": async function (obj, val) { await device[obj].setColorMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "rgb", type: "number", read: true, write: true, min: 1, max: 16777215 },
        { name: "color_mode", type: "number", read: true, write: true, min: 1, max: 2 },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};
DefineDevice[10] = { // untested
    info: {},
    model: "yeelink.light.ceiling3",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ceiling3:1
    description: "Yeelight LED Ceiling Light",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val ? 'on' : 'off') },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "nl_br": async function (obj, val) { await device[obj].setBrightness(val) },
        "night_mode": async function (obj, val) { await device[obj].setSleepMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "nl_br", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "night_mode", type: "boolean", role: "switch", read: true, write: true },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};
DefineDevice[11] = { // untested
    info: {},
    model: "yeelink.light.ceiling1",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ceiling1:1
    description: "Yeelight Crystal Pedestal Light",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val ? 'on' : 'off') },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "nl_br": async function (obj, val) { await device[obj].setBrightness(val) },
        "night_mode": async function (obj, val) { await device[obj].setSleepMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "nl_br", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "night_mode", type: "boolean", read: true, write: true },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};

DefineDevice[21] = { // untested
    info: {},
    model: "yeelink.light.ceiling10",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ceiling10:1
    description: "Yeelight Meteorite Pedestal Light",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "main_power": async function (obj, val) { await device[obj].setMainPower(val) },
        "bg_power": async function (obj, val) { await device[obj].setBgPower(val) },
        "bg_bright": async function (obj, val) { await device[obj].setBgBrightness(val) },
        "active_bright": async function (obj, val) { await device[obj].setActiveBrightness(val) },
        "color_mode": async function (obj, val) { await device[obj].setColorMode(val) },
        "ct": async function (obj, val) { await device[obj].setColorTemperature(val) },
        "bg_ct": async function (obj, val) { await device[obj].setBgColorTemperature(val) },
        "bg_rgb": async function (obj, val) { await device[obj].setBgColorRgb(val) },
        "bg_hue": async function (obj, val) { await device[obj].setBgColorHSV([val, 100]) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "main_power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bg_power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bg_bright", type: "number", role: 'level.dimmer', read: true, write: true, min: 1, max: 100, unit: "%" },
        { name: "active_bright", type: "number", role: 'level.dimmer', read: true, write: true, min: 1, max: 100, unit: "%" },
        { name: "color_mode", type: "boolean", role: 'switch.mode.color', read: true, write: true },
        { name: "moon_mode", type: "boolean", role: 'switch.mode.moon', read: true, write: true },
        { name: "bg_ct", type: "number", role: 'level.color.temperature', read: true, write: true, min: 2600, max: 6500, unit: "K" },
        { name: "ct", type: "number", role: 'level.color.temperature', read: true, write: true, min: 2600, max: 6500, unit: "K" },
        { name: "bg_rgb", type: "string", role: 'level.color.rgb', read: true, write: true },
        { name: "bg_hue", type: "number", role: 'level.color.hue', read: true, write: true, min: 0, max: 359 },
        { name: "bg_sat", type: "number", role: 'level.color.saturation', read: true, write: true, min: 1, max: 100 }]
};


DefineDevice[16] = { // untested
    info: {},
    model: "yeelink.light.lamp4",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-lamp4:1
    description: "Mi LED Desk Lamp 1S",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "ct": async function (obj, val) { await device[obj].setColorTemperature(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};

DefineDevice[27] = { // Tested and ok -https://github.com/Pittini/iobroker-nodemihome/issues/52 
    info: {},
    model: "yeelink.light.bslamp2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-bslamp2:1
    description: "Yeelink Bedside Lamp",
    setter: {
		"power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "rgb": async function (obj, val) { await device[obj].setColorRgb(val) },
        "color_mode": async function (obj, val) { await device[obj].setColorMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true },
        { name: "bright", type: "number", read: true, write: true, min: 1, max: 100 },
        { name: "rgb", type: "number", read: true, write: true, min: 1, max: 16777215 },
        { name: "color_mode", type: "number", read: true, write: true, min: 1, max: 2 },
        { name: "ct", type: "number", read: true, write: true, min: 1700, max: 6500 }]
};
// ***************************** Humidifier *********************************

DefineDevice[3] = { // Tested and working
    info: {},
    model: "zhimi.humidifier.cb1",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:zhimi-cb1:1
    description: "Smartmi Evaporative Humidifier",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val ? 'on' : 'off') },
        "mode": async function (obj, val) { await device[obj].setFanLevel(val) },
        "limit_hum": async function (obj, val) { await device[obj].setTargetHumidity(val) },
        "led": async function (obj, val) { await device[obj].setLedBrightness(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) },
        "dry": async function (obj, val) { await device[obj].setMode(val ? 'dry' : 'humidify') }
    },
    common:
        [{ name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "depth", type: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "limit_hum", type: "number", read: true, write: true, min: 0, max: 100, unit: "%", states: { 30: "30%", 40: "40%", 50: "50%", 60: "60%", 70: "70%", 80: "80%" } },
        { name: "led", type: "number", read: true, write: true, min: 0, max: 2, states: { 0: "bright", 1: "dim", 2: "off" } },
        { name: "buzzer", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "temperature", type: "number", role: "value.temperature", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "child_lock", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "dry", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "mode", type: "string", read: true, write: true, states: { "auto": "auto", "silent": "silent", "medium": "medium", "high": "high" } }]
};
DefineDevice[4] = { // untested
    info: {},
    model: "deerma.humidifier.jsq",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq:1
    description: "Mi Smart Antibacterial Humidifier",
    setter: {
        "humidifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "humidifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "humidifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "power", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "humidifier.fan-level", type: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "level1", 2: "level2", 3: "level3" } },
        { name: "humidifier.water-level", type: "number", read: true, write: false, min: 0, max: 127 },
        { name: "alarm.alarm", type: "boolean", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "environment.relative-humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true }]
};
DefineDevice[12] = { // Tested and working
    info: {},
    model: "zhimi.humidifier.ca4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:zhimi-ca4:1
    description: "Smartmi Evaporative Humidifier",
    setter: {
        "humidifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "humidifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "humidifier.target-humidity": async function (obj, val) { await device[obj].setTargetHumidity(val) },
        "humidifier.dry": async function (obj, val) { await device[obj].setMode(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "screen.brightness": async function (obj, val) { await device[obj].setBright(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "humidifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "humidifier.fault", type: "number", read: true, write: false, min: 0, max: 15 },
        { name: "humidifier.fan-level", type: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "level1", 2: "level2", 3: "level3" } },
        { name: "humidifier.target-humidity", type: "number", read: true, write: true, min: 30, max: 80, unit: "%" },
        { name: "humidifier.water-level", type: "number", read: true, write: false, min: 0, max: 128 },
        { name: "humidifier.speed-level", type: "number", read: true, write: false, min: 200, max: 2000 },
        { name: "humidifier.dry", type: "boolean", read: true, write: true, min: false, max: true },
        { name: "humidifier.use-time", type: "number", read: true, write: false, min: 0, max: 2147483600 },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "environment.relative-humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "alarm.alarm", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "screen.brightness", type: "number", role: "value.brightnesss", read: true, write: true, min: 0, max: 2, states: { 0: "Dark", 1: "Glimmer", 2: "Brightest" } },
        { name: "physical-controls-locked.physical-controls-locked", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "other.actual-speed", type: "number", read: true, write: false, min: 0, max: 2000 },
        { name: "other.power-time", type: "number", read: true, write: false, min: 0, max: 4294967295, unit: "Seconds" }]
};
DefineDevice[25] = { // Tested and working - https://github.com/Pittini/iobroker-nodemihome/issues/50
    info: {},
    model: "deerma.humidifier.jsq4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq4:1
    description: "XIAOMI Mijia CJSJSQ01DY Pure Evaporation",
    setter: {
        "humidifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "humidifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "humidifier.target-humidity": async function (obj, val) { await device[obj].setTargetHumidity(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "indicator-light.on": async function (obj, val) { await device[obj].setBright(val) }
    },
    common:
        [{ name: "humidifier.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "humidifier.fault", type: "number", read: true, write: false, min: 0, max: 2, states: { 0: "No faults", 1: "Insufficient Water", 2: "Water Separation" } },
        { name: "humidifier.fan-level", type: "number", read: true, write: true, min: 0, max: 3, states: { 1: "Level1", 2: "Level2", 3: "Humidity" } },
        { name: "humidifier.target-humidity", type: "number", read: true, write: true, min: 40, max: 80, unit: "%" },
        { name: "environment.temperature", type: "number", role: "value.temperature", read: true, write: false, min: -30, max: 100, unit: "°C" },
        { name: "environment.relative-humidity", type: "number", role: "value.humidity", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "alarm.alarm", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "indicator-light.on", type: "boolean", role: "switch", read: true, write: true, min: false, max: true },
        { name: "custom.water-shortage-fault", type: "boolean", role: "switch", read: true, write: false, min: false, max: true },
        { name: "custom.the-tank-filed", type: "boolean", role: "switch", read: true, write: false, min: false, max: true }]
};


// ***************************** Divers *********************************

DefineDevice[7] = { // In arbeit - unvollständig
    info: {},
    model: "lumi.gateway.v3",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:gateway:0000A019:lumi-v3:1
    description: "Xiaomi RGB Gateway",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "doorbell_push": async function (obj, val) { await device[obj].setBrightness(val) },
        "toggle_light": async function (obj, val) { await device[obj].setLightPower(val) }
    },
    common:
        [{ name: 'illumination', role: 'value.lux', write: false, read: true, type: 'number', unit: 'lux' },
        { name: 'rgb', role: 'level.color.rgb', write: true, read: true, type: 'string' },
        { name: 'nightlight_rgb', role: 'level.color.rgb', write: true, read: true, type: 'string' },
        { name: "mute", type: "boolean", read: true, write: true },
        { name: 'toggle_light', role: 'switch', write: true, read: true, type: 'boolean' },
        { name: 'light.dimmer', role: 'level.dimmer', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: 'gateway_volume', role: 'level.volume', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: 'doorbell_volume', role: 'level.volume', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: 'alarming_volume', role: 'level.volume', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: "doorbell_push", type: "boolean", read: true, write: true },
        { name: "arming", type: "boolean", read: true, write: true },
        { name: "arming_time", type: "number", read: true, write: true },
        { name: 'music_ID', role: 'state', write: true, read: false, type: 'number', desc: '10000 - stop, 10005 - custom ringtone' },
        { name: 'proto_version', role: 'info', write: false, read: true, type: 'string' },
        { name: 'join_permission', role: 'state', write: true, read: true, type: 'string' },
        { name: 'remove_device', role: 'state', write: true, read: true, type: 'string' },     // Removing a subdevice (device sid)
        { name: 'connected', role: 'indicator.reachable', write: false, read: true, type: 'boolean', desc: 'Will be set to false if no packets received in 20 seconds' }]
};

/*
   gateway:          {type: 'gateway',            fullName: 'Xiaomi RGB Gateway', ClassName: Gateway, states: {
          +  illumination:   {name: 'Illumination',    role: 'value.lux',         write: false, read: true,  type: 'number', unit: 'lux'},
          +  rgb:            {name: 'RGB',             role: 'level.color.rgb',   write: true,  read: true,  type: 'string'},
            on:             {name: 'Light',           role: 'switch',            write: true,  read: true,  type: 'boolean'},
            dimmer:         {name: 'Light',           role: 'level.dimmer',      write: true,  read: true,  type: 'number', unit: '%', min: 0, max: 100},
            volume:         {name: 'Volume',          role: 'level.volume',      write: true,  read: true,  type: 'number', unit: '%', min: 0, max: 100},
            mid:            {name: 'Music ID',        role: 'state',             write: true,  read: false, type: 'number', desc: '10000 - stop, 10005 - custom ringtone'},
            proto_version:  {name: 'Proto Version',   role: 'info',              write: false, read: true,  type: 'string'},
            join_permission:{name: 'Add device',      role: 'state',             write: true, read: true,  type: 'string'},     // Permission to add subdevices (yes / no)
            remove_device:  {name: 'Remove device',   role: 'state',             write: true, read: true,  type: 'string'},     // Removing a subdevice (device sid)
            connected:      {name: 'Is gateway connected', role: 'indicator.reachable', write: false, read: true, type: 'boolean', desc: 'Will be set to false if no packets received in 20 seconds'}
        }
*/

for (let x in DefineDevice) { //An alle Devicedefinitionen die generischen Datenpunkte anhängen
    DefineDevice[x].info = [
        { id: "localip", initial: "", forceCreation: false, common: { read: true, write: true, name: "Ip Adress", type: "string", role: "value", def: "" } },
        { id: "token", initial: "", forceCreation: false, common: { read: true, write: true, name: "Token", type: "string", role: "value", def: "" } },
        { id: "did", initial: "", forceCreation: false, common: { read: true, write: true, name: "Device Id", type: "string", role: "value", def: "" } },
        { id: "model", initial: "", forceCreation: false, common: { read: true, write: true, name: "Model", type: "string", role: "value", def: "" } },
        { id: "rssi", initial: 0, forceCreation: false, common: { read: true, write: false, name: "rssi", type: "number", role: "value.rssi", def: 0 } },
        { id: "name", initial: "", forceCreation: false, common: { read: true, write: true, name: "Name", type: "string", role: "value", def: "" } },
        { id: "isOnline", initial: false, forceCreation: false, common: { read: true, write: true, name: "Is online", type: "boolean", role: "value", def: false } }]

}

function PrepareDeviceDps(did, model) {
    if (logging) log("Reaching PrepareDeviceDps, did=" + did + " model=" + model);
    for (let x in DefineDevice) { //Alle definierten Model durchgehen
        if (DefineDevice[x].model == model) { //bei Model match
            for (let y in DefineDevice[x].common) { //Alle common propertys des models durchgehen und Var zusammensetzen
                States[DpCount] = { id: praefix0 + "." + did + "." + DefineDevice[x].common[y].name, common: DefineDevice[x].common[y] }; // 
                DpCount++;
            };
        };
    };
}

function PrepareGenericDps(did) {  //GenericDps
    // if (logging) log("Reaching PrepareGenericDps(did)");
    for (let y in DefineDevice[0].info) { //Alle info propertys des models durchgehen und Var zusammensetzen
        // log("DefineDevice[0].info[y]=" + JSON.stringify(DefineDevice[0].info[y].common.name))
        States[DpCount] = { id: praefix0 + "." + did + ".info." + DefineDevice[0].info[y].id, common: DefineDevice[0].info[y].common }; // 
        DpCount++;
    };
}

function CreateStates() {
    if (logging) log("Reaching CreateStates()");

    //Alle States anlegen, Main aufrufen wenn fertig
    let numStates = States.length;
    States.forEach(function (state) {
        createState(state.id, state.initial, state.forceCreation, state.common, function () {
            numStates--;
            if (numStates === 0) {
                if (logging) log(States.length + " States created, now setting up channels!");
                setObject(praefix0, { type: 'channel', common: { name: "" }, native: {} }); //Root zum Channel machen
                for (let x = 0; x < AllDevicesRaw.length; x++) {
                    setObject(praefix0 + "." + AllDevicesRaw[x].did, { type: 'device', common: { name: AllDevicesRaw[x].name }, native: {} }); //DeviceChannels machen
                    // if (logging) log("AllDevicesRaw[x]=" +JSON.stringify (AllDevicesRaw[x]))
                };
                main();
            };
        });
    });
}

async function main() {
    if (logging) log("Reaching main");
    await WriteGenericDpValues();
    await CreateDevices();
    CreateDpTrigger();
}

function WriteGenericDpValues() { //Alle vorhandenen generischen Werte einlesen und in Dps schreiben
    if (logging) log("Reaching WriteGenericDpValues()");
    for (let x in AllDevicesRaw) { //Alle vorhandenen Xiaomi Devices durchgehen
        for (let y in DefineDevice[0].info) { //Nimm ersten Eintrag aus DefineDevices da die Generics bei allen gleich sind
            setState(praefix0 + "." + AllDevicesRaw[x].did + ".info." + DefineDevice[0].info[y].id, AllDevicesRaw[x][DefineDevice[0].info[y].id], true);
            // log("DefineDevice[" + 0 + "].info[" + y + "]=" + JSON.stringify(DefineDevice[0].info[y]));
            // log("" + praefix0 + "." + AllDevicesRaw[x].did + ".Info." + DefineDevice[0].info[y].id)
            // log(AllDevicesRaw[x][DefineDevice[0].info[y].id])
        };
    };
    return true;
}

//################################################

//Step 1 - Einloggen in die Cloud und abrufen aller Gerätedaten, dann vorbereiten der allgemeinen und devicespezifischen Datenpunkte mit anschließendem anlegen derselben
async function Init() { //Cloudlogin und auslesen der gesamten Clouddaten
    if (logging) log("Reaching init");

    mihome.miioProtocol.init();// local miIO

    try {// cloud MIoT Login
        await mihome.miCloudProtocol.login(username, password); //Versuch einzuloggen
    }
    catch {
        log("You are already logged in, login canceled"); //Wenn schon eingeloggt
    };
    log("Retrieving your in " + options.country + " registered MiHome Devices");
    AllDevicesRaw = await mihome.miCloudProtocol.getDevices(null, options); //Gibt alle vorhandenen Devices zurück und weist die Werte einem lokalen Array zu
    log("Found " + AllDevicesRaw.length + " MiHome Devices, those are:");

    for (let x = 0; x < AllDevicesRaw.length; x++) { //Alle beim User vorhandenen Xiaomi Devices durchgehen
        log(AllDevicesRaw[x].name);
        await PrepareGenericDps(AllDevicesRaw[x].did); //und allgemeine generische Infos Dps vorbereiten
    };
    log("Now searching for supported Devices...");
    let NoDeviceMatch = true;
    for (let x = 0; x < AllDevicesRaw.length; x++) { //Jetzt erneut alle beim User vorhandenen Xiaomi Devices durchgehen
        for (let y = 0; y < DefineDevice.length; y++) { //und abgleichen mit von Skript und node-mihome unterstützten Geräten
            if (AllDevicesRaw[x].model == DefineDevice[y].model) { //Bei match Devicespezifische DPs vorbereiten
                log("Device " + AllDevicesRaw[x].name + " is supported, creating DataPoints if necessary");
                await PrepareDeviceDps(AllDevicesRaw[x].did, AllDevicesRaw[x].model);
                NoDeviceMatch = false;
            };
        };
    };
    if (NoDeviceMatch) {
        log("No supported Devices found!", "warn");
    }
    CreateStates();
}

//################################################

//Step 2 - Deviceobjekte anlegen, Trigger erzeugen und Datenpunktrefresh initieren
async function CreateDevices() {
    if (logging) log("Reaching CreateDevices ");
    let z = 0;

    for (let x in AllDevicesRaw) { //Alle beim User gefundenen Geräte durchlaufen
        for (let y in DefineDevice) { //Alle vom Skript unterstützten und definierten Devices durchlaufen
            if (AllDevicesRaw[x].model == DefineDevice[y].model) { //Wenn die beiden matchen
                log("Now creating device for " + AllDevicesRaw[x].model + " / " + AllDevicesRaw[x].did + " / " + AllDevicesRaw[x].localip + " / " + AllDevicesRaw[x].token + " / " + refresh);

                device[z] = mihome.device({
                    id: AllDevicesRaw[x].did, // required, device id
                    model: AllDevicesRaw[x].model, // required, device model "zhimi.airpurifier.mb3"
                    address: AllDevicesRaw[x].localip, // miio-device option, local ip address
                    token: AllDevicesRaw[x].token, // miio-device option, device token 4ff8a96292d0451c5148142a0a851e4f
                    refresh: refresh // miio-device option, device properties refresh interval in ms
                });
                device[z].model = AllDevicesRaw[x].model;
                device[z].setter = DefineDevice[y].setter;
                device[z].definition = DefineDevice[y];
                device[z].firstrun = true;
                device[z].rssi = 0;
                device[z].isOnline = true;
                log("Created device " + JSON.stringify(device[z]) + " now fetching data");
                await device[z].init(); // connect to device and poll for properties
                log("Init Device# " + z + " - device=" + JSON.stringify(device[z].model));
                z++;
            };
        };
    };

    for (let i in device) { //Datenabruf zyklisch entsprechend refresh
        log("Setting trigger #" + i + " for " + device[i].model);
        device[i].on('properties', (data) => {
            if (typeof data != "undefined" && data != {}) {
                if (JSON.stringify(device[i].data) !== JSON.stringify(data)) {//Prüfen ob Datenänderung pro device
                    //if (logging)                     log(data)
                    if (typeof device[i].data == "undefined") {
                        device[i].data = data;
                    };
                    RefreshDps(i, data);
                };
            } else {
                log("Data was empty (undefined), aborting refresh", "warn");
            };

        });
    };

    if (!SkipRssiRefresh) {
        GenericDpRefreshIntervalObj = setInterval(function () { //
            RefreshGenericDpsTicker();
        }, refresh); //
    };

    onStop(function () { //Bei Scriptende alle Devices löschen
        for (let x in device) {
            device[x].destroy();
        };
        unsubscribe('properties');
        clearInterval(GenericDpRefreshIntervalObj);
    }, 10);
}

async function RefreshGenericDpsTicker() {
    // log("Reaching RefreshGenericDpsTicker()" , "info");

    let dummy = await mihome.miCloudProtocol.getDevices(null, options); //Gibt  Devices zurück und weist die Werte einem lokalen Array zu
    if (typeof dummy != "object") return false;
    for (let DeviceIndex in device) {
        for (let DummyDeviceIndex in dummy) {
            if (dummy[DummyDeviceIndex].did == device[DeviceIndex].id) {
                if (typeof dummy[DeviceIndex].rssi != "undefined") {
                    if (device[DeviceIndex].rssi != dummy[DeviceIndex].rssi) {
                        device[DeviceIndex].rssi = dummy[DeviceIndex].rssi;
                        setStateAsync(praefix0 + "." + device[DeviceIndex].id + ".info." + "rssi", device[DeviceIndex].rssi, true);
                    };
                };
                if (typeof dummy[DeviceIndex].isOnline != "undefined") {
                    if (device[DeviceIndex].isOnline != dummy[DeviceIndex].isOnline) {
                        device[DeviceIndex].isOnline = dummy[DeviceIndex].isOnline;
                        setStateAsync(praefix0 + "." + device[DeviceIndex].id + ".info." + "isOnline", device[DeviceIndex].isOnline, true);
                    };
                };
            };
        };
    };
    return true;
}

function RefreshDps(DeviceIndex, NewData) {
    // if (logging) log("Reaching RefreshDps at " + device[DeviceIndex].definition.description);

    for (let x in device[DeviceIndex].data) { //Alle properties des Devices durchgehen
        for (let i in NewData) {//Alle properties des Datenblocks durchgehen
            if ((NewData[i] !== device[DeviceIndex].data[x] || device[DeviceIndex].firstrun == true) && i === x) { //Überprüfen ob Datenänderung im property bei propertymatch, firstrun immer refreshen

                if (logging) log("New Data at " + device[DeviceIndex].model + " " + i + " oldvalue=" + device[DeviceIndex].data[x] + " newvalue=" + NewData[i] + " path=" + praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x));
                device[DeviceIndex].data[x] = NewData[i]; //Geänderten Wert ins Objekt schreiben

                for (let y in device[DeviceIndex].definition.common) { //Alle Definitionsproperties durchgehen um ChannelId zu suchen
                    if (device[DeviceIndex].definition.common[y].name == CorrectChannelId(x) && device[DeviceIndex].definition.common[y].read == true) { //Wenn match und read=true
                        if (typeof device[DeviceIndex].data[x] == 'undefined' || typeof device[DeviceIndex].id == 'undefined') { //Wenn kein Pfad oder keine Daten
                            log("Empty packet for " + device[DeviceIndex].definition.common[y].name + ", skipping refresh", 'warn');
                            //return false;
                        } else {
                            //Prüfung auf bestimmte keys
                            switch (device[DeviceIndex].definition.common[y].name) {
                                case 'temp_dec': //Umwandlung von 10tel Grad auf Grad beim Dp schreiben. data muß unverändert bleiben da im Trigger mit origdaten abgeglichen wird
                                    setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), parseInt(device[DeviceIndex].data[x]) / 10, true);
                                    break;
                                case 'bright':
                                case 'ct':
                                case 'hue':
                                case 'rgb':
                                case 'color_mode':
                                    setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), parseInt(device[DeviceIndex].data[x]), true);
                                    break;
                                default: //Wenn kein Treffer jetzt Prüfung auf bestimmte Daten
                                    switch (device[DeviceIndex].data[x]) {
                                        case 'on':
                                            setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), true, true);
                                            break;
                                        case 'off':
                                            setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), false, true);
                                            break;
                                        default:
                                            setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), device[DeviceIndex].data[x], true);
                                    };
                            };
                        };
                        if (logging) log("Refreshing " + praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x) + " / value=" + device[DeviceIndex].data[x] + " / read=" + device[DeviceIndex].definition.common[y].read + " write=" + device[DeviceIndex].definition.common[y].write);
                    };
                };
            };
        };
    };
    device[DeviceIndex].firstrun = false;
    //if (logging) log(DeviceData[DeviceIndex])
    return true;
}

async function SetDevice(i, key, keyvalue) {
    if (logging) log("Reaching SetDevice - i=" + i + " key=" + key + " keyvalue=" + keyvalue);
    if (device[i].definition.common[key].name == 'rgb') { //Block wandelt Farb Hewwerte in Dezimalwert um
        keyvalue = ConvertHexToDezi(keyvalue);
        keyvalue = String(keyvalue);
    }
    if (device[i].definition.common[key].name == 'hue') { //Block kombiniert bei Änderungen von hue oder sat jweils die beiden Werte zu Array für übergabe an Funktion
        keyvalue = [keyvalue, device[i].data['sat']];
    } else if (device[i].definition.common[key].name == 'sat') {
        keyvalue = [device[i].data['hue'], keyvalue];
        for (let x in device[i].definition.common) {
            if (device[i].definition.common[x].name == 'hue') {
                key = x;
            };
        };
    };
    log("Keyvalue=" + keyvalue + " key=" + key)
    if (logging) log("Reaching SetDevice i=" + i);
    // log("Setting Device " + device[i].model + " to value " + keyvalue + " at " + device[i].definition.common[key].name)
    // log("Setting Device " + device[i].model + " to value " + keyvalue + " at " + device[i].setter[device[i].definition.common[key].name])
    log(device[i].setter[device[i].definition.common[key].name](i, keyvalue)); //Diese Zeile nicht entfernen, Funktionsaufruf!!!
}

function CreateDpTrigger() {
    if (logging) log("Reaching CreateDpTrigger");

    for (let i in device) {
        if (logging) log("Setting DataPointTrigger #" + i + " for " + device[i].model);

        for (let x in device[i].definition.common) { //Alle properties der Devicedefinition durchgehen
            if (device[i].definition.common[x].write) {
                //  log(praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name)
                on({ id: praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name, change: "ne", ack: false }, function (dp) { //Bei Statusänderung
                    if (logging) log("Triggered i=" + i + " x=" + x + " ack=" + dp.state.ack);
                    SetDevice(i, x, CheckDataTypeAndConvert(dp.state.val, device[i].definition.common[x].type));
                });
                if (logging) log("Setting Datapoint Trigger for " + praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name + " / read=" + device[i].definition.common[x].read + " write=" + device[i].definition.common[x].write);
            } else {
                if (logging) log("No Datapoint Trigger set for " + device[i].definition.common[x].name + " because its readonly.");
            };
        };
    };
}

//***************** U T I L S *********************** */
function CheckDataTypeAndConvert(value, HasToBe) {
    if (typeof value == "string" && HasToBe == "number") {
        if (parseFloat(value) == parseInt(value)) { //Umgewandelter String ist Int
            return parseInt(value);
        } else {
            return parseFloat(value);
        };
    } else {
        return value;
    };
}


function CorrectChannelId(cid) { //Erzeugt eine iobroker taugliche channelid. Punkte werden zu unterstrichen gewandelt, Doppelpunkte zu Punkten
    let temp = cid;
    if (typeof temp == "object") {
        temp = JSON.stringify(cid);
    };
    cid = temp.replace(".", '_'); //Erstmal alle potentiellen Punkte im channelnamen entfernen
    temp = cid.replace(/:/g, "."); //Jetzt alle Doppelpunkte durch Punkte ersetzen
    return temp;
}

function ConvertDeziToHex(DeziValue) {
    DeziValue = toInt(DeziValue)
    //log(typeof DeziValue)
    if (typeof DeziValue == "number") {
        return "#" + DeziValue.toString(16)
    };
}

function ConvertHexToDezi(HexValue) {

    if (typeof HexValue == "string") {
        if (HexValue.indexOf('#') != -1) {
            HexValue = HexValue.substr(1).toLowerCase()
        } else {
            HexValue = HexValue.toLowerCase()
        };
    };

    var i, j, digits = [0], carry;
    for (i = 0; i < HexValue.length; i += 1) {
        carry = parseInt(HexValue.charAt(i), 16);
        for (j = 0; j < digits.length; j += 1) {
            digits[j] = digits[j] * 16 + carry;
            carry = digits[j] / 10 | 0;
            digits[j] %= 10;
        }
        while (carry > 0) {
            digits.push(carry % 10);
            carry = carry / 10 | 0;
        }
    }
    return digits.reverse().join('');
}

/*
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   {number}  r       The red color value
 * @param   {number}  g       The green color value
 * @param   {number}  b       The blue color value
 * @return  {Array}           The HSL representation
 */
function rgbToHsl(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    var r = parseInt(result[1], 16);
    var g = parseInt(result[2], 16);
    var b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b),
        min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100)];
}


