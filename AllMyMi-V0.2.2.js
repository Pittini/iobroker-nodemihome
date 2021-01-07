const SkriptVersion = "0.2.1"; //vom 06.01.2021 / Link zu Git: https://github.com/Pittini/iobroker-nodemihome / Forum: https://forum.iobroker.net/topic/39388/vorlage-xiaomi-airpurifier-3h-u-a-inkl-token-auslesen

const mihome = require('node-mihome');

// Logindaten für Xiaomi Cloud:
const username = '';
const password = '';
const options = { country: 'de' }; // 'ru', 'us', 'tw', 'sg', 'cn', 'de' (Default: 'cn');
const refresh = 10000;

const praefix0 = "javascript.0.MiHomeAll"; //Root für Skriptdatenpunkte

const logging = true; //Logging aktivieren/deaktivieren

//Ab hier nix mehr ändern!
/*
1. Xiaomi Cloudlogin
2. Alle dort gelisteten Geräte und deren Basicdaten abrufen
3. Für alle abgerufenen Geräte Basic Channel/Datenpunkte anlegen
4. Prüfen welche supporteten Geräte in der Auflistung vorhanden sind und die entsprechenden spezifischen Datenpunkte erstellen
5. Basic Channels mit Daten füllen / einlesen
6. devicearray erstellen via node-mihome und die Gerätespezifischen Werte einlesen


*/
// ######### TESTBEREICH ################
//const axios = require('axios');

//let miotDefinition= getMiotData('https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb3:2');

async function getMiotData(url) {
    if (logging) log("Reaching MiotUrlConstructor");
    try {
        const response = await axios.get(url, { timeout: 10000 });
        log("resp:" + JSON.stringify(response.data));
        for (let z in Object.keys(response.data.services)) {
            log("Keys=" + Object.keys(response.data.services[z]))
            log(JSON.stringify(response.data.services[z]))
        }

        return response.data;
    } catch (error) {
        console.error(error);
    }
}

function MiotUrlConstructor(miotdevice) {
    if (logging) log("Reaching MiotUrlConstructor");
    let BaseUrl = "https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:" + miotdevice;
    return BaseUrl;
}

// ################ ENDE TESTBEREICH ####################



const DeviceData = [];
let AllDevicesRaw = [];

let device = [];

const States = [];
let DpCount = 0;
log("Starting AllMyMi V." + SkriptVersion);


Init();

const DefineDevice = [];

// ***************************** Device Definitions *************************

// ***************************** Airpurifier ********************************

DefineDevice[0] = { // Tested and working
    info: {},
    model: "zhimi.airpurifier.mb3",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb3:2
    description: "Purifier 3H",
    setter: {
        "air-purifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "air-purifier.mode": async function (obj, val) { await device[obj].setMode(val) },
        "air-purifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "indicator-light.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "air-purifier.on", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", format: "number", read: true, write: false, min: 0, max: 5, states: { 0: "No faults", 1: "m1_run", 2: "m1_stuck", 3: "no_sensor", 4: "error_hum", 5: "error_temp" } },
        { name: "air-purifier.mode", format: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "sleep", 2: "favorite", 3: "fanset" } },
        { name: "air-purifier.fan-level", format: "number", read: true, write: true, min: 1, max: 3 },
        { name: "alarm.alarm", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "indicator-light.brightness", format: "number", read: true, write: true, min: 0, max: 2 },
        { name: "indicator-light.on", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", format: "number", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "environment.relative-humidity", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "environment.pm2_5-density", format: "number", read: true, write: false, min: 0, max: 600 },
        { name: "filter.filter-remaining", format: "number", read: true, write: false, min: 0, max: 1000, unit: "d" },
        { name: "filter.filter-life-level", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter.filter-used-time", format: "number", read: true, write: false, min: false, max: true, unit: "h" },
        { name: "physical-controls-locked.physical-controls-locked", format: "boolean", read: true, write: true, min: false, max: true }]
};

DefineDevice[8] = { // untested
    info: {},
    model: "zhimi.airpurifier.mc2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mc2:1
    description: "Purifier 2H",
    setter: {
        "air-purifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "air-purifier.mode": async function (obj, val) { await device[obj].setMode(val) },
        "air-purifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "indicator-light.brightness": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "air-purifier.on", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", format: "number", read: true, write: false, min: 0, max: 5, states: { 0: "No faults", 1: "m1_run", 2: "m1_stuck", 3: "no_sensor", 4: "error_hum", 5: "error_temp" } },
        { name: "air-purifier.mode", format: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "sleep", 2: "favorite" } },
        { name: "air-purifier.fan-level", format: "number", read: true, write: true, min: 1, max: 3 },
        { name: "alarm.alarm", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "indicator-light.brightness", format: "number", read: true, write: true, min: 0, max: 2 },
        { name: "indicator-light.on", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", format: "number", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "environment.relative-humidity", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "environment.pm2_5-density", format: "number", read: true, write: false, min: 0, max: 600 },
        { name: "filter.filter-remaining", format: "number", read: true, write: false, min: 0, max: 1000, unit: "d" },
        { name: "filter.filter-life-level", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filter.filter-used-time", format: "number", read: true, write: false, min: false, max: true, unit: "h" },
        { name: "physical-controls-locked.physical-controls-locked", format: "boolean", read: true, write: true, min: false, max: true }]
};

// ***************************** Fans *********************************
//  TODO https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:zhimi-sa1:1

DefineDevice[1] = { // untested
    info: {},
    model: "leshow.fan.ss4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:leshow-ss4:1  
    description: "Leshow Fan",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "blow": async function (obj, val) { await device[obj].setFanLevel(val) },
        "yaw": async function (obj, val) { await device[obj].setFanSwing(val) },
        "mode": async function (obj, val) { await device[obj].setSleepMode(val) },
        "sound": async function (obj, val) { await device[obj].setBuzzer(val) },
        "timer": async function (obj, val) { await device[obj].setTimer(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "blow", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "yaw", format: "boolean", read: true, write: true },
        { name: "mode", format: "boolean", read: true, write: true },
        { name: "sound", format: "boolean", read: true, write: true },
        { name: "timer", format: "number", read: true, write: true, min: 0, max: 540, unit: "m" }]
};

DefineDevice[9] = { // untested
    info: {},
    model: "zhimi.fan.za4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:zhimi-za4:1  
    description: "Fan",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "angle": async function (obj, val) { await device[obj].setFanLevel(val) },
        "angle_enable": async function (obj, val) { await device[obj].setSwing(val) },
        "fan_level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) },
        "led_b": async function (obj, val) { await device[obj].setLcdBrightness(val) },
        "speed_level": async function (obj, val) { await device[obj].setSleepMode(val) },
        "poweroff_time": async function (obj, val) { await device[obj].setTimer(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "angle", format: "number", read: true, write: true, min: 1, max: 120 },
        { name: "angle_enable", format: "boolean", read: true, write: true },
        { name: "fan_level", format: "number", read: true, write: true, min: 1, max: 4 },
        { name: "buzzer", format: "boolean", read: true, write: true },
        { name: "child_lock", format: "boolean", read: true, write: true },
        { name: "led_b", format: "boolean", read: true, write: true },
        { name: "speed_level", format: "number", read: true, write: true, min: 1, max: 4 },
        { name: "poweroff_time", format: "number", read: true, write: true, min: 0, max: 540, unit: "m" }]
};

// ***************************** Lights *********************************

DefineDevice[2] = { // Tested and ok except setting color
    info: {},
    model: "yeelink.light.strip2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-color2:1    
    description: "Yeelight Lightstrip Plus",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "hue": async function (obj, val) { await device[obj].setColorHSV(val) },
        "color_mode": async function (obj, val) { await device[obj].setColorMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "hue", format: "number", read: true, write: true, min: 0, max: 16777215 },
        { name: "sat", format: "number", read: true, write: true, min: 0, max: 100 },
        { name: "color_mode", format: "number", read: true, write: true, min: 1, max: 2 },
        { name: "ct", format: "number", read: true, write: true, min: 1700, max: 6500 }]
};

DefineDevice[5] = { // Tested and working
    info: {},
    model: "yeelink.light.ct2",//     http://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ct2:1
    description: "Yeelight LED Bulb (Tunable)",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "ct": async function (obj, val) { await device[obj].setColorTemperature(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "ct", format: "number", read: true, write: true, min: 1700, max: 6500 }]
};

DefineDevice[6] = { // Tested and working except color setting
    info: {},
    model: "yeelink.light.color2",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-color2:1
    description: "Yeelight LED Bulb (Color)",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "rgb": async function (obj, val) { await device[obj].setColorRgb(val) },
        "color_mode": async function (obj, val) { await device[obj].setColorMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "rgb", format: "number", read: true, write: true, min: 1, max: 16777215 },
        { name: "color_mode", format: "number", read: true, write: true, min: 1, max: 2 },
        { name: "ct", format: "number", read: true, write: true, min: 1700, max: 6500 }]
};
DefineDevice[10] = { // untested
    info: {},
    model: "yeelink.light.ceiling3",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ceiling3:1
    description: "Yeelight LED Ceiling Light",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "nl_br": async function (obj, val) { await device[obj].setBrightness(val) },
        "night_mode": async function (obj, val) { await device[obj].setSleepMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "nl_br", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "night_mode", format: "boolean", read: true, write: true },
        { name: "ct", format: "number", read: true, write: true, min: 1700, max: 6500 }]
};
DefineDevice[11] = { // untested
    info: {},
    model: "yeelink.light.ceiling1",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-ceiling1:1
    description: "Yeelight Crystal Pedestal Light",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "bright": async function (obj, val) { await device[obj].setBrightness(val) },
        "nl_br": async function (obj, val) { await device[obj].setBrightness(val) },
        "night_mode": async function (obj, val) { await device[obj].setSleepMode(val) },
        "ct": async function (obj, val) { await device[obj].setCt(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "nl_br", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "night_mode", format: "boolean", read: true, write: true },
        { name: "ct", format: "number", read: true, write: true, min: 1700, max: 6500 }]
};

// ***************************** Humidifier *********************************

DefineDevice[3] = { // Tested and working
    info: {},
    model: "zhimi.humidifier.cb1",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:zhimi-cb1:1
    description: "Smartmi Evaporative Humidifier",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "mode": async function (obj, val) { await device[obj].setFanLevel(val) },
        "limit_hum": async function (obj, val) { await device[obj].setTargetHumidity(val) },
        "led": async function (obj, val) { await device[obj].setLedBrightness(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) },
        "dry": async function (obj, val) { await device[obj].setMode(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "depth", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "limit_hum", format: "number", read: true, write: true, min: 0, max: 100, unit: "%", states: { 30: "30%", 40: "40%", 50: "50%", 60: "60%", 70: "70%", 80: "80%" } },
        { name: "led", format: "number", read: true, write: true, min: 0, max: 2, states: { 0: "bright", 1: "dim", 2: "off" } },
        { name: "buzzer", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "temperature", format: "number", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "humidity", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "child_lock", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "dry", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "mode", format: "string", read: true, write: true, states: { "auto": "auto", "silent": "silent", "medium": "medium", "high": "high" } }]
};
DefineDevice[4] = { // untested
    info: {},
    model: "deerma.humidifier.jsq",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq:1
    description: "Smartmi Evaporative Humidifier",
    setter: {
        "humidifier.on": async function (obj, val) { await device[obj].setPower(val) },
        "humidifier.fan-level": async function (obj, val) { await device[obj].setFanLevel(val) },
        "alarm.alarm": async function (obj, val) { await device[obj].setBuzzer(val) },
        "physical-controls-locked.physical-controls-locked": async function (obj, val) { await device[obj].setChildLock(val) }
    },
    common:
        [{ name: "humidifier.on", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "humidifier.fan-level", format: "number", read: true, write: true, min: 0, max: 3, states: { 0: "auto", 1: "level1", 2: "level2", 3: "level3" } },
        { name: "humidifier.water-level", format: "number", read: true, write: false, min: 0, max: 127 },
        { name: "alarm.alarm", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "environment.temperature", format: "number", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "environment.relative-humidity", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "physical-controls-locked.physical-controls-locked", format: "boolean", read: true, write: true, min: false, max: true }]
};
DefineDevice[12] = { // untested
    info: {},
    model: "zhimi.humidifier.ca4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:zhimi-ca4:1
    description: "Smartmi Evaporative Humidifier",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "buzzer": async function (obj, val) { await device[obj].setBuzzer(val) },
        "mode": async function (obj, val) { await device[obj].setFanLevel(val) },
        "limit_hum": async function (obj, val) { await device[obj].setTargetHumidity(val) },
        "led": async function (obj, val) { await device[obj].setLedBrightness(val) },
        "child_lock": async function (obj, val) { await device[obj].setChildLock(val) },
        "dry": async function (obj, val) { await device[obj].setMode(val) }
    },
    common:
        [{ name: "power", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "depth", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "limit_hum", format: "number", read: true, write: true, min: 0, max: 100, unit: "%", states: { 30: "30%", 40: "40%", 50: "50%", 60: "60%", 70: "70%", 80: "80%" } },
        { name: "led", format: "number", read: true, write: true, min: 0, max: 2, states: { 0: "bright", 1: "dim", 2: "off" } },
        { name: "buzzer", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "temperature", format: "number", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "humidity", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "child_lock", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "dry", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "mode", format: "string", read: true, write: true, states: { "auto": "auto", "silent": "silent", "medium": "medium", "high": "high" } }]
};

// ***************************** Divers *********************************
// TODO https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:coffee-machine:0000A049:scishare-s1102:1
// TODO https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:camera:0000A01C:mijia-v1:1
// TODO https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:plant-monitor:0000A030:hhcc-v1:1

DefineDevice[7] = { // In arbeit - unvollständig
    info: {},
    model: "lumi.gateway.v3",//    https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:gateway:0000A019:lumi-v3:1
    description: "Xiaomi RGB Gateway",
    setter: {
        "power": async function (obj, val) { await device[obj].setPower(val) },
        "doorbell_push": async function (obj, val) { await device[obj].setBrightness(val) },
        "toggle_light": async function (obj, val) { await device[obj].setLightPower(val) },
    },
    common:
        [{ name: 'illumination', role: 'value.lux', write: false, read: true, type: 'number', unit: 'lux' },
        { name: 'rgb', role: 'level.color.rgb', write: true, read: true, type: 'string' },
        { name: 'nightlight_rgb', role: 'level.color.rgb', write: true, read: true, type: 'string' },
        { name: "mute", format: "boolean", read: true, write: true },
        { name: 'toggle_light', role: 'switch', write: true, read: true, type: 'boolean' },
        { name: 'light.dimmer', role: 'level.dimmer', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: 'gateway_volume', role: 'level.volume', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: 'doorbell_volume', role: 'level.volume', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: 'alarming_volume', role: 'level.volume', write: true, read: true, type: 'number', unit: '%', min: 0, max: 100 },
        { name: "doorbell_push", format: "boolean", read: true, write: true },
        { name: "arming", format: "boolean", read: true, write: true },
        { name: "arming_time", format: "number", read: true, write: true },
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
            setState(praefix0 + "." + AllDevicesRaw[x].did + ".info." + DefineDevice[0].info[y].id, AllDevicesRaw[x][DefineDevice[0].info[y].id]);
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
                log("Device " + AllDevicesRaw[x].name + " is supported, creating DataPoints");
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
            if (typeof data != "undefined") {
                if (JSON.stringify(device[i].data) !== JSON.stringify(data)) {//Nur refreshen bei Datenänderung
                    device[i].data = data;
                    RefreshDps(i);
                };
            } else {
                log("Data was empty (undefined), aborting refresh", "warn");
            };
        });
    };

    onStop(function () { //Bei Scriptende alle Devices löschen
        for (let x in device) {
            device[x].destroy();
        };
        unsubscribe('properties');
    }, 10);
}



function RefreshDps(DeviceIndex) {
    if (logging) log("Reaching RefreshDps at " + device[DeviceIndex].definition.description);
    //log("Model=" + device[DeviceIndex].model + ".   Data=" + JSON.stringify(device[DeviceIndex].data) + " z=" + DeviceIndex, "warn")
    //   log("Model=" + device[DeviceIndex].model + " OldData=" + JSON.stringify(device[DeviceIndex].olddata) + " z=" + DeviceIndex, "warn")
    // log(device[DeviceIndex].model + " Power=" + device[DeviceIndex].getPower())
    // log(Object.keys(device[DeviceIndex].data))
    // log(device[DeviceIndex].data['environment:temperature'])

    for (let x in device[DeviceIndex].data) { //Alle properties des Devices durchgehen
        for (let y in device[DeviceIndex].definition.common) {
            if (device[DeviceIndex].definition.common[y].name == CorrectChannelId(x)) {


                switch (device[DeviceIndex].definition.common[y].name) {
                    case 'power': //Umwandlung von power on/off zu true/false beim Dp schreiben. data muß unverändert bleiben da im Trigger mit origdaten abgeglichen wird
                        break;
                    case 'rgb': //Umwandlung von Dezimal RGB zu Hex Rgb
                        // log(ConvertDeziToHex(device[DeviceIndex].data[x]))
                        setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), ConvertDeziToHex(device[DeviceIndex].data[x]), true);

                        break;
                    default:
                        if (device[DeviceIndex].data[x] == 'on') { // On immer zu true wandeln
                            setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), true, true);
                        }
                        else if (device[DeviceIndex].data[x] == 'off') { // Off immer zu false wandeln
                            setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), false, true);
                        } else { // Ansonsten Normal den Wert schreiben
                            setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), device[DeviceIndex].data[x], true);

                        };


                };


                //  if (logging) log("Refreshing " + praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x) + " / value=" + device[DeviceIndex].data[x] + " / read=" + device[DeviceIndex].definition.common[y].read + " write=" + device[DeviceIndex].definition.common[y].write);
            };
        };
    };
    //      if (logging) log(DeviceData[DeviceIndex])
    return true;
}

async function SetDevice(i, key, keyvalue) {
    if (logging) log("Reaching SetDevice - i=" + i + " key=" + key + " keyvalue=" + keyvalue);
    if (device[i].definition.common[key].name == 'rgb') { //Block wandelt Farb Hewwerte in Dezimalwert um
        keyvalue = ConvertHexToDezi(keyvalue);
        keyvalue = String(keyvalue)
    }
    if (device[i].definition.common[key].name == 'hue') { //Block kombiniert bei Änderungen von hue oder sat jweils die beiden Werte zu Array für übergabe an Funktion
        keyvalue = [keyvalue, device[i].data['sat']];
    } else if (device[i].definition.common[key].name == 'sat') {
        keyvalue = [device[i].data['hue'], keyvalue];
        for (let x in device[i].definition.common) {
            if (device[i].definition.common[x].name == 'hue') {
                log("tata")
                key = x;
            };
        };
    };
    log("Keyvalue=" + keyvalue + " key=" + key)
    if (logging) log("Reaching SetDevice i=" + i);
    // log("Setting Device " + device[i].model + " to value " + keyvalue + " at " + device[i].definition.common[key].name)
    // log("Setting Device " + device[i].model + " to value " + keyvalue + " at " + device[i].setter[device[i].definition.common[key].name])
    log(device[i].setter[device[i].definition.common[key].name](i, keyvalue))
}

function CreateDpTrigger() {
    if (logging) log("Reaching CreateDpTrigger");

    for (let i in device) {
        if (logging) log("Setting DataPointTrigger #" + i + " for " + device[i].model);

        for (let x in device[i].definition.common) { //Alle properties der Devicedefinition durchgehen
            if (device[i].definition.common[x].write) {
                //  log(praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name)
                on({ id: praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name, change: "ne", ack: false }, function (dp) { //Bei Statusänderung
                    if (logging) log("Triggered i=" + i + " x=" + x + " ack=" + dp.state.ack)
                    SetDevice(i, x, dp.state.val);
                });
                if (logging) log("Setting Datapoint Trigger for " + praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name + " / read=" + device[i].definition.common[x].read + " write=" + device[i].definition.common[x].write);
            } else {
                if (logging) log("No Datapoint Trigger set for " + device[i].definition.common[x].name + " because its readonly.")
            };
        };
    };
}

//***************** U T I L S *********************** */

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
    }
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


