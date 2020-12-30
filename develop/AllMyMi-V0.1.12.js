const SkriptVersion = "0.1.12"; //vom 30.12.2020 / Link zu Git: https://github.com/Pittini/iobroker-nodemihome / Forum: https://forum.iobroker.net/topic/39388/vorlage-xiaomi-airpurifier-3h-u-a-inkl-token-auslesen

const mihome = require('node-mihome');
const axios = require('axios');

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
let TargetModel = "zhimi.airpurifier.mb3"
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
let TriggerLock = true;
log("Starting AllMyMi V." + SkriptVersion);


Init();

//Devicedaten Purifier 3H
const DeviceGets = ["Power", "Mode", "FanLevel", "Buzzer", "LcdBrightness", "Temperature", "Humidity", "PM2_5", "FilterRemaining", "Filterlife", "Filterused"]
const DeviceSets = ["Power", "Mode", "FanLevel", "Buzzer", "LcdBrightness", "ChildLock"]

const DefineDevice = [];
DefineDevice[0] = {
    info: {},
    model: "zhimi.airpurifier.mb3",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb3:2
    description: "Purifier 3H",
    setter: { "on": "setPower()", "mode": "setMode()", "fan-level": "setFanLevel()", "alarm.alarm": "setBuzzer()", "indicator-light.brightness": "setLcdBrightness()", "physical-controls-locked.physical-controls-locked": "setChildLock()" },
    common:
        [{ name: "air-purifier.on", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "air-purifier.fault", format: "number", read: true, write: false, min: false, max: true, states: { 0: "No faults", 1: "m1_run", 2: "m1_stuck", 3: "no_sensor", 4: "error_hum", 5: "error_temp" } },
        { name: "air-purifier.mode", format: "number", read: true, write: true, states: { 0: "auto", 1: "sleep", 2: "favorite", 3: "fanset" } },
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
DefineDevice[1] = {
    info: {},
    model: "leshow.fan.ss4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:leshow-ss4:1
    description: "Fan",
    setter: {},
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "fanlevel", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "fanswing", format: "boolean", read: true, write: true },
        { name: "sleepmode", format: "boolean", read: true, write: true },
        { name: "buzzer", format: "boolean", read: true, write: true },
        { name: "timer", format: "number", read: true, write: true, min: 0, max: 540 }]
};
DefineDevice[2] = {
    info: {},
    model: "yeelink.light.strip2",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:light:0000A001:yeelink-color2:1    
    description: "Yeelight Lightstrip Plus",
    setter: {},
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "rgb", format: "number", read: true, write: true, min: 1, max: 16777215 },
        { name: "mode", format: "number", read: true, write: true, min: 1, max: 2 },
        { name: "ct", format: "number", read: true, write: true, min: 1700, max: 6500 }]
};

//https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq:1


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
    for (let x = 0; x < AllDevicesRaw.length; x++) { //Jetzt erneut alle beim User vorhandenen Xiaomi Devices durchgehen
        for (let y = 0; y < DefineDevice.length; y++) { //und abgleichen mit von Skript und node-mihome unterstützten Geräten
            if (AllDevicesRaw[x].model == DefineDevice[y].model) { //Bei match Devicespezifische DPs vorbereiten
                log("Device " + AllDevicesRaw[x].name + " is supported, creating DataPoints");
                await PrepareDeviceDps(AllDevicesRaw[x].did, AllDevicesRaw[x].model);
            };
        };
    };
    CreateStates();
}

//################################################

//Step 2 - Deviceobjekte anlegen, Trigger erzeugen und Datenpunktrefresh initieren
async function CreateDevices() {
    if (logging) log("Reaching CreateDevices ");
    let z = 0;

    for (let x in AllDevicesRaw) {
        for (let y in DefineDevice) {
            if (AllDevicesRaw[x].model == DefineDevice[y].model) {
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
                device[z].olddata = {};
                device[z].definition = DefineDevice[y];
                log("Created device " + JSON.stringify(device[z]) + " now fetching data");
                await device[z].init(); // connect to device and poll for properties
                log("Init Device# " + z + " - device=" + JSON.stringify(device[z].model));

                z++;
            };
        };
    };

    for (let i in device) {
        log("Setting trigger #" + i + " for " + device[i].model);
        device[i].on('properties', (data) => {
            device[i].data = data;
            if (JSON.stringify(device[i].data) !== JSON.stringify(device[i].olddata)) {//Nur refreshen bei Datenänderung
                RefreshDps(i);
            };
            device[i].olddata = device[i].data;
        });
    };



    onStop(function () { //Bei Scriptende alle Devices löschen
        for (let x in device) {
            device[x].destroy();
        };
        unsubscribe('properties');
    }, 10);
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

function RefreshDps(DeviceIndex) {
    if (logging) log("Reaching RefreshDps ");
    TriggerLock = true;
    //log("Model=" + device[DeviceIndex].model + ".   Data=" + JSON.stringify(device[DeviceIndex].data) + " z=" + DeviceIndex, "warn")
    //   log("Model=" + device[DeviceIndex].model + " OldData=" + JSON.stringify(device[DeviceIndex].olddata) + " z=" + DeviceIndex, "warn")
    // log(device[DeviceIndex].model + " Power=" + device[DeviceIndex].getPower())
    // log(Object.keys(device[DeviceIndex].data))
    // log(device[DeviceIndex].data['environment:temperature'])

    //log(device[DeviceIndex].id);

    for (let x in device[DeviceIndex].data) { //Alle properties des Devices durchgehen
        for (let y in device[DeviceIndex].definition.common) {
            if (device[DeviceIndex].definition.common[y].name == CorrectChannelId(x)) {
                setState(praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x), device[DeviceIndex].data[x]);
                if (logging) log("Refreshing " + praefix0 + "." + device[DeviceIndex].id + "." + CorrectChannelId(x) + " / value=" + device[DeviceIndex].data[x] + " / read=" + device[DeviceIndex].definition.common[y].read + " write=" + device[DeviceIndex].definition.common[y].write);
            };
        };
    };
    TriggerLock = false;

    //      if (logging) log(DeviceData[DeviceIndex])

    return true;

}

async function SetDevice(x, data) {
    if (logging) log("Reaching SetDevice x=" + x + " data=" + data);
    DeviceData[x] = data;

    switch (x) {
        case 0:
            log(await device.setPower(data));
            break;
        case 1:
            log(await device.setMode(data));
            device.mode = data
            DeviceData[1] = data
            break;
        case 2:
            log(await device.setFanLevel(data));
            break;
        case 3:
            log(await device.setBuzzer(data));
            break;
        case 4:
            log(device.setLcdBrightness(data));
            break;
        case 5:
            log(await device.setChildLock(data));
            break;

        default:
    }
}

function CreateDpTrigger() {
    if (logging) log("Reaching CreateDpTrigger");

    for (let i in device) {
        if (logging) log("Setting DataPointTrigger #" + i + " for " + device[i].model);

        for (let x in device[i].definition.common) { //Alle properties der Devicedefinition durchgehen
            if (device[i].definition.common[x].write) {
                log(praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name)
                on(praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name, function (dp) { //Bei Statusänderung
                    if (logging) log("Triggered i=" + i + " Triggerlock=" + TriggerLock)
                    if (TriggerLock) {
                        TriggerLock = false;
                        if (logging) log("Refresh write, triggering canceled");
                    } else {
                        if (logging) log("Wonna write now");
                        // SetDevice(y, dp.state.val);
                    };
                });
                if (logging) log("Setting Datapiont Trigger for " + praefix0 + "." + device[i].id + "." + device[i].definition.common[x].name + " / read=" + device[i].definition.common[x].read + " write=" + device[i].definition.common[x].write);
            } else {
                if (logging) log("No Datapoint Trigger set for " + device[i].definition.common[x].name + " because its readonly.")
            };
        };
    };
}







