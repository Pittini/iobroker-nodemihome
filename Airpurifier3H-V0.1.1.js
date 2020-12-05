const SkriptVersion = "0.1.1"; //Link zu Git: https://github.com/Pittini/iobroker-nodemihome / Forum:

const mihome = require('node-mihome');

const username = '';
const password = '';
const options = { country: 'de' }; // 'ru', 'us', 'tw', 'sg', 'cn', 'de' (Default: 'cn')


const praefix0 = "javascript.0.MiHome.AirPurifier3H.";
const praefix1 = "javascript.0.MiHome.YourDevices.";

const logging = true;
const States = [];
let DpCount = 0;

log("Starting Airpurifier3H-V" + SkriptVersion);

async function Init() { //Cloudlogin und auslesen der gesamten Clouddaten
    // local miIO
    mihome.miioProtocol.init();

    try {// cloud MIoT
        await mihome.miCloudProtocol.login(username, password);
    }
    catch {
        log("You are already logged in, login canceled");
    }
    //console.warn(await mihome.miCloudProtocol.getDevices(null, options)) //Gibt alle vorhandenen Devices zurück
    let AllDevicesRaw = await mihome.miCloudProtocol.getDevices(null, options); //Gibt alle vorhandenen Devices zurück
    if (logging) console.warn(await mihome.miCloudProtocol.getDevice([317335021], options)); // get devices information from list ids

    for (let x = 0; x < AllDevicesRaw.length; x++) {
        if (AllDevicesRaw[x].model == "zhimi.airpurifier.mb3") {
            Create_device(AllDevicesRaw[x].did, AllDevicesRaw[x].model, AllDevicesRaw[x].localip, AllDevicesRaw[x].token);
            return;
        };
    };
}

Init();
const DeviceData = [];

async function Create_device(did, model, adress, token) {
    log("did=" + did + " model=" + model + " adress=" + adress + " token=" + token)

    const device = mihome.device({
        id: did, // required, device id
        model: model, // required, device model "zhimi.airpurifier.mb3"
        address: adress, // miio-device option, local ip address
        token: token, // miio-device option, device token 4ff8a96292d0451c5148142a0a851e4f
        refresh: 30000 // miio-device option, device properties refresh interval in ms
    });

    device.on('properties', (data) => {
        //console.log(data);

        DeviceData[0] = device.getPower(); // liefert ein bestimmtes Attribut
        DeviceData[1] = device.getMode(); // liefert ein bestimmtes Attribut
        DeviceData[2] = device.getFanLevel(); // liefert ein bestimmtes Attribut
        DeviceData[3] = device.getTemperature(); // liefert ein bestimmtes Attribut
        DeviceData[4] = device.getHumidity(); // liefert ein bestimmtes Attribut
        DeviceData[5] = device.getPM2_5(); // liefert ein bestimmtes Attribut
        DeviceData[6] = device.getFilterRemaining(); // liefert ein bestimmtes Attribut
        DeviceData[7] = device.getBuzzer(); // liefert ein bestimmtes Attribut
        DeviceData[8] = device.getLcdBrightness(); // liefert ein bestimmtes Attribut
        log(DeviceData)
    });
    //await device.getMode(); // Liefert alle Attribute

    await device.init(); // connect to device and poll for properties
    //await device.setFanLevel(0); // call the method
    //await device.setMode(1); // call the method

    device.destroy();

}


/*

DeviceGets=["getPower","getMode","getFanLevel","getTemperature","getHumidity","getPM2_5","getFilterRemaining","getBuzzer","getLcdBrightness"]
DeviceSets=["setPower","setMode","setFanLevel","setBuzzer","setLcdBrightness","setChildLock"]


States[DpCount] = { id: praefix + "Power", initial: false, forceCreation: false, common: { read: true, write: true, name: "Power", type: "boolean", role: "state", def: false } }; //
DpCount++;
States[DpCount] = { id: praefix + "Mode", initial: "", forceCreation: false, common: { read: true, write: true, name: "Mode", type: "string", role: "state", def: "" } }; //
DpCount++;
States[DpCount] = { id: praefix + "FanLevel", initial: 1, forceCreation: false, common: { read: true, write: true, name: "FanLevel", type: "number", role: "state", def: 1 } }; //
DpCount++;
States[DpCount] = { id: praefix + "Temperature", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Temperature", type: "number", unit: "°C" role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "Humidity", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Humidity", type: "number", unit: "%" role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "PM2_5", initial: 0, forceCreation: false, common: { read: true, write: false, name: "PM 2.5", type: "number", unit: "" role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "FilterRemaining", initial: 0, forceCreation: false, common: { read: true, write: false, name: "Filter Remaining", type: "number", unit: "days" role: "state", def: 0 } }; //
DpCount++;
States[DpCount] = { id: praefix + "Buzzer", initial: false, forceCreation: false, common: { read: true, write: true, name: "Buzzer", type: "boolean", role: "state", def: false } }; //
DpCount++;



//Alle States anlegen, Main aufrufen wenn fertig
let numStates = States.length;
States.forEach(function (state) {
    createState(state.id, state.initial, state.forceCreation, state.common, function () {
        numStates--;
        if (numStates === 0) {
            if (logging) log("CreateStates fertig!");
            main();
        };
    });
});

------------------------------------

# miIO protocol controller
This is plugin developed by based on plugin [miIO Device Library](https://www.npmjs.com/package/miio)
It's plugin provides simple work above protocol miIO, is provided simple API for send and recieve commands different device's. Have support async methods.

# Usage

 ```JavaScript
const miIO = require('miio-controller');
 ```
---
## Example
```JavaScript
let miio = new miIO("tokenHere", "ipHere");
miio.handshake()
    .then(() => {
        miio.sendCommand('get_prop', ["power"])
            .then(res => console.log(res))
            .catch(err => console.log(err));
    })
    .catch(err => console.log(err));
```
## Example with async await
```JavaScript
async function main() {
    let miio = new miIO("tokenHere", "ipHere");
    await miio.handshake();
    console.log(await miio.sendCommand('get_prop', ["power"]));
}
main();
```

## More methods
- sendJson(json) - send custom json string to device.

*/




