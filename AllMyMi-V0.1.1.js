const SkriptVersion = "0.0.1"; //vom 13.12.2020 / Link zu Git: https://github.com/Pittini/iobroker-nodemihome / Forum: https://forum.iobroker.net/topic/39388/vorlage-xiaomi-airpurifier-3h-u-a-inkl-token-auslesen

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
2. Alle dort gelisteten Geräte abrufen
3. Für alle abgerufenen Geräte Basic Channel/Datenpunkte anlegen
4. Prüfen welche supporteten Geräte in der Auflistung vorhanden sind und die entsprechenden spezifischen Datenpunkte erstellen


*/
// ######### TESTBEREICH ################
let TargetModel = "zhimi.airpurifier.mb3"
//getMiotData('https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb3:2');

async function getMiotData(url) {
    if (logging) log("Reaching MiotUrlConstructor");
    try {
        const response = await axios.get(url, { timeout: 10000 });
        log("resp:" + JSON.stringify(response.data));
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

let device;

const States = [];
let DpCount = 0;
let TriggerLock = true;
log("Starting AllMyMi V." + SkriptVersion);


Init();

//Devicedaten did 317335021 Purifier 3H
const DeviceGets = ["Power", "Mode", "FanLevel", "Buzzer", "LcdBrightness", "Temperature", "Humidity", "PM2_5", "FilterRemaining", "Filterlife", "Filterused"]
const DeviceSets = ["Power", "Mode", "FanLevel", "Buzzer", "LcdBrightness", "ChildLock"]

const DefineDevice = [];
DefineDevice[0] = {
    info: {},
    model: "zhimi.airpurifier.mb3",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-mb3:2
    description: "Purifier 3H",
    common:
        [{ name: "power", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "mode", format: "string", read: true, write: true, states: { "none": "=Fanlevel", "auto": "auto", "sleep": "sleep", "favorite": "favorite" } },
        { name: "fanlevel", format: "number", read: true, write: true, min: 1, max: 3 },
        { name: "buzzer", format: "boolean", read: true, write: true, min: false, max: true },
        { name: "lcdbrightness", format: "number", read: true, write: true, min: 0, max: 2 },
        { name: "temperature", format: "number", read: true, write: false, min: -40, max: 125, unit: "°C" },
        { name: "humidity", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "pm2_5", format: "number", read: true, write: false, min: 0, max: 600 },
        { name: "filterremaining", format: "number", read: true, write: false, min: 0, max: 1000, unit: "d" },
        { name: "filterlife", format: "number", read: true, write: false, min: 0, max: 100, unit: "%" },
        { name: "filterused", format: "number", read: true, write: false, min: false, max: true, unit: "h" },
        { name: "childlock", format: "string", read: true, write: true, min: false, max: true }]
};

DefineDevice[1] = {
    info: {},
    model: "leshow.fan.ss4",// https://miot-spec.org/miot-spec-v2/instance?type=urn:miot-spec-v2:device:fan:0000A005:leshow-ss4:1
    description: "Fan",
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
    common:
        [{ name: "power", format: "boolean", read: true, write: true },
        { name: "bright", format: "number", read: true, write: true, min: 1, max: 100 },
        { name: "rgb", format: "number", read: true, write: true, min: 1, max: 16777215 }]
};


//GenerateSupportetDeviceArray()
function GenerateSupportetDeviceArray() {
    let ModelArray = [];
    for (let x in DefineDevice) {
        if (DefineDevice.hasOwnProperty(x)) {

            console.log("Found Devicedefinition for "  + DefineDevice[x].model);
            ModelArray[x] = DefineDevice[x].model;
        };
    };
    log("This are " + DefineDevice.length + " supported devices in summary");
    return ModelArray;
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


function PrepareGenericDps(did, name) {
    //StaticDps
    States[DpCount] = { id: praefix0 + "." + did + ".Info.IpAdress", initial: "", forceCreation: false, common: { read: true, write: true, name: "Ip Adress", type: "string", role: "value", def: "" } }; //
    DpCount++;
    States[DpCount] = { id: praefix0 + "." + did + ".Info.Token", initial: "", forceCreation: false, common: { read: true, write: true, name: "Token", type: "string", role: "value", def: "" } }; //
    DpCount++;
    States[DpCount] = { id: praefix0 + "." + did + ".Info.DeviceId", initial: "", forceCreation: false, common: { read: true, write: true, name: "Device Id", type: "string", role: "value", def: "" } }; //
    DpCount++;
    States[DpCount] = { id: praefix0 + "." + did + ".Info.Model", initial: "", forceCreation: false, common: { read: true, write: true, name: "Model", type: "string", role: "value", def: "" } }; //
    DpCount++;
    States[DpCount] = { id: praefix0 + "." + did + ".Info.Rssi", initial: 0, forceCreation: false, common: { read: true, write: false, name: "rssi", type: "number", role: "value.rssi", def: 0 } }; //
    DpCount++;
    States[DpCount] = { id: praefix0 + "." + did + ".Info.Name", initial: "", forceCreation: false, common: { read: true, write: true, name: "Name", type: "string", role: "value", def: "" } }; //
    DpCount++;
    States[DpCount] = { id: praefix0 + "." + did + ".Info.IsOnline", initial: false, forceCreation: false, common: { read: true, write: true, name: "Is online", type: "boolean", role: "value", def: false } }; //
    DpCount++;
}

function PrepareGenericDps2(did, name, x) {
    //StaticDps
    for (let x in DefineDevice) {
        DefineDevice[x].info = [
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.IpAdress", initial: "", forceCreation: false, common: { read: true, write: true, name: "Ip Adress", type: "string", role: "value", def: "" } },
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.Token", initial: "", forceCreation: false, common: { read: true, write: true, name: "Token", type: "string", role: "value", def: "" } },
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.DeviceId", initial: "", forceCreation: false, common: { read: true, write: true, name: "Device Id", type: "string", role: "value", def: "" } },
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.Model", initial: "", forceCreation: false, common: { read: true, write: true, name: "Model", type: "string", role: "value", def: "" } },
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.Rssi", initial: 0, forceCreation: false, common: { read: true, write: false, name: "rssi", type: "number", role: "value.rssi", def: 0 } },
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.Name", initial: "", forceCreation: false, common: { read: true, write: true, name: "Name", type: "string", role: "value", def: "" } },
            { id: praefix0 + "." + AllDevicesRaw[x].did + ".Info.IsOnline", initial: false, forceCreation: false, common: { read: true, write: true, name: "Is online", type: "boolean", role: "value", def: false } }]
    }
    log(DefineDevice[1].info[2])


}


function CreateStates() {
    if (logging) log("Reaching CreateStates()");

    //Alle States anlegen, Main aufrufen wenn fertig
    let numStates = States.length;
    States.forEach(function (state) {
        createState(state.id, state.initial, state.forceCreation, state.common, function () {
            numStates--;
            if (numStates === 0) {
                if (logging) log(States.length+" States created, now setting up channels!");
                setObject(praefix0, { type: 'channel', common: { name: "" }, native: {} }); //Root zum Channel machen
                for (let x = 0; x < AllDevicesRaw.length; x++) {
                    setObject(praefix0 + "." + AllDevicesRaw[x].did, { type: 'device', common: { name: AllDevicesRaw[x].name }, native: {} }); //DeviceChannels machen
                    if (logging) log(AllDevicesRaw[x])
                };


                //main();
            };
        });
    });
}

function main() {
    if (logging) log("Reaching main");
    WriteGenericDpValues();
    CreateDpTrigger();
}


function WriteGenericDpValues() { //Alle vorhandenen generischen Werte einlesen und in Dps schreiben
    for (let x = 0; x < AllDevicesRaw.length; x++) { //Alle vorhandenen Xiaomi Devices durchgehen
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.IpAdress", AllDevicesRaw[x].localip);
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.Token", AllDevicesRaw[x].token);
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.DeviceId", AllDevicesRaw[x].did);
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.Model", AllDevicesRaw[x].model);
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.Rssi", AllDevicesRaw[x].rssi);
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.Name", AllDevicesRaw[x].name);
        setState(praefix0 + "." + AllDevicesRaw[x].did + ".Info.IsOnline", AllDevicesRaw[x].isOnline);
        for (let y = 0; y < DefineDevice.length; y++) {
            if (AllDevicesRaw[x].model == DefineDevice[y].model) {
                Create_device(AllDevicesRaw[x].did, AllDevicesRaw[x].model, AllDevicesRaw[x].localip, AllDevicesRaw[x].token)
            };
        }

        if (logging) log(AllDevicesRaw[x].model)
    };
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
      await  PrepareGenericDps(AllDevicesRaw[x].did, AllDevicesRaw[x].name); //und allgemeine generische Infos Dps vorbereiten
    };
    log("Now searching for supported Devices...");
    for (let x = 0; x < AllDevicesRaw.length; x++) { //Jetzt erneut alle beim User vorhandenen Xiaomi Devices durchgehen
        for (let y = 0; y < DefineDevice.length; y++) { //und abgleichen mit von Skript und node-mihome unterstützten Geräten
            if (AllDevicesRaw[x].model == DefineDevice[y].model) { //Bei match Devicespezifische DPs vorbereiten
                log("Device " + AllDevicesRaw[x].name + " is supported, creating DataPoints");
              await  PrepareDeviceDps(AllDevicesRaw[x].did, AllDevicesRaw[x].model);
            };
        };
    };


    CreateStates();
}


async function Create_device(did, model, adress, token) {
    if (logging) log("Reaching CreateDevice did=" + did + " model=" + model + " adress=" + adress + " token=" + token);

    device = mihome.device({
        id: did, // required, device id
        model: model, // required, device model "zhimi.airpurifier.mb3"
        address: adress, // miio-device option, local ip address
        token: token, // miio-device option, device token 4ff8a96292d0451c5148142a0a851e4f
        refresh: refresh // miio-device option, device properties refresh interval in ms
    });
    log(JSON.stringify(device))
    device.on('properties', (data) => {
        device.Power = device.getPower(); // liefert ein bestimmtes Attribut
        device.Mode = device.getMode(); // liefert ein bestimmtes Attribut - auto/sleep/none
        device.FanLevel = device.getFanLevel(); // liefert ein bestimmtes Attribut
        device.Temperature = device.getTemperature(); // liefert ein bestimmtes Attribut
        device.Humidity = device.getHumidity(); // liefert ein bestimmtes Attribut
        device.PM2_5 = device.getPM2_5(); // liefert ein bestimmtes Attribut
        device.FilterRemaining = device.getFilterRemaining(); // liefert ein bestimmtes Attribut
        device.Buzzer = device.getBuzzer(); // liefert ein bestimmtes Attribut
        device.LcdBrightness = device.getLcdBrightness(); // liefert ein bestimmtes Attribut
        device.Filterlife = device.getFilterlife(); // liefert ein bestimmtes Attribut
        device.Filterused = device.getFilterused(); // liefert ein bestimmtes Attribut
        RefreshDps(did);
    });

    await device.init(); // connect to device and poll for properties

    onStop(function () { //Bei Scriptende Device löschen
        device.destroy();
        unsubscribe('properties');
    }, 10);
}

function RefreshDps(did) {
    if (logging) log("Reaching RefreshDps ");
    TriggerLock = true;

    if (device.Power != DeviceData[0]) {
        DeviceData[0] = device.Power;
        setState(praefix0 + "." + did + "." + DeviceGets[0], DeviceData[0]);
    }
    if (device.Mode != DeviceData[1]) {
        DeviceData[1] = device.Mode;
        setState(praefix0 + "." + did + "." + DeviceGets[1], DeviceData[1]);
    }
    if (device.FanLevel != DeviceData[2]) {
        DeviceData[2] = device.FanLevel;
        setState(praefix0 + "." + did + "." + DeviceGets[2], DeviceData[2]);
    }
    if (device.Buzzer != DeviceData[3]) {
        DeviceData[3] = device.Buzzer;
        setState(praefix0 + "." + did + "." + DeviceGets[3], DeviceData[3]);
    }
    if (device.LcdBrightness != DeviceData[4]) {
        DeviceData[4] = device.LcdBrightness;
        setState(praefix0 + "." + did + "." + DeviceGets[4], DeviceData[4]);
    }

    if (device.Temperature != DeviceData[5]) {
        DeviceData[5] = device.Temperature;
        setState(praefix0 + "." + did + "." + DeviceGets[5], DeviceData[5]);
    }
    if (device.Humidity != DeviceData[6]) {
        DeviceData[6] = device.Humidity;
        setState(praefix0 + "." + did + "." + DeviceGets[6], DeviceData[6]);
    }
    if (device.PM2_5 != DeviceData[7]) {
        DeviceData[7] = device.PM2_5;
        setState(praefix0 + "." + did + "." + DeviceGets[7], DeviceData[7]);
    }
    if (device.FilterRemaining != DeviceData[8]) {
        DeviceData[8] = device.FilterRemaining;
        setState(praefix0 + "." + did + "." + DeviceGets[8], DeviceData[8]);
    }

    if (device.Filterlife != DeviceData[9]) {
        DeviceData[9] = device.Filterlife;
        setState(praefix0 + "." + did + "." + DeviceGets[9], DeviceData[9]);
    }
    if (device.Filterused != DeviceData[10]) {
        DeviceData[10] = device.Filterused;
        setState(praefix0 + "." + did + "." + DeviceGets[10], DeviceData[10]);
    }

    TriggerLock = false;

    if (logging) log(DeviceData)


}

async function SetDevice(x, data) {
    if (logging) log("Reaching SetDevice x=" + x + " data=" + data);
    DeviceData[x] = data;
    //await device.init(); // connect to device and poll for properties
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
    for (let x = 0; x < AllDevicesRaw.length; x++) {
        if (AllDevicesRaw[x].model = TargetModel) {
            for (let y = 0; y < DeviceSets.length; y++) {
                on(praefix0 + "." + AllDevicesRaw[x].did + "." + DeviceSets[y], function (dp) { //Bei Statusänderung
                    if (logging) log("Triggered y=" + y + " Triggerlock=" + TriggerLock)
                    if (TriggerLock) {
                        TriggerLock = false;
                        if (logging) log("Refresh write, triggering canceled");
                    } else {
                        if (logging) log("Wonna write now");
                        SetDevice(y, dp.state.val);
                    };
                });
            };

        };
    };
}







