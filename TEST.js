
for (const i in objectInput) {
    id = objectInput[i].pathConsumption
    const obj = objectInput[i];
    arrObj[id] = await this.funcCreateObject(obj);
};


async funcCreateObject(obj) {
    let objTemp = {};

    //Klasse erstellen
    class Geraet {
        /**
         * @param {number} startValue
         * @param {number} endValue
         * @param {number} startCount
         * @param {number} endCount
         * @param {string | string} statusDevice
         * @param {string | number} consumpLive
         * @param {string | number} averageConsumption
         * @param {string | number} runtime
         * @param {string | string} messageDP
         */
        constructor(obj, statusDevice, consumpLive, runtime, runtimeMS, messageDP, autoOffDP, averageConsumption, doNotDisturb, objVal) {
            // Attribute
            // Vorgaben
            // DPs
            this.deviceName = obj.name;
            this.deviceType = obj.type;
            this.currentConsumption = obj.pathConsumption;
            this.switchPower = obj.pathSwitch;
            // script intern
            this.pathStatus = statusDevice;
            this.pathLiveConsumption = consumpLive;
            this.timeTotal = runtime;
            this.timeTotalMs = runtimeMS;
            this.messageDP = messageDP;
            this.averageConsumption = averageConsumption;
            this.doNotDisturb = doNotDisturb;
            this.dnd = false;
            this.autoOffDP = autoOffDP;
            // boolean
            this.startMessageSent = false;
            this.endMessageSent = false;
            this.started = false;
            this.abort = obj.abort;
            // boolean Benutzervorgaben
            this.autoOff = obj.autoOff;
            // number
            this.verbrauch = 0;
            this.resultStart = 0;
            this.resultEnd = 0;
            this.resultStandby = 0;
            // Verbrauchswerte
            this.startValue = objVal.startVal;
            this.endValue = objVal.endVal;
            // Zaehler Abbruchbedingungen
            this.startCount = objVal.startCount;
            this.endCount = objVal.endCount;
            // timeout
            this.timeoutMsg = null;
            this.startZeit = 0;
            this.endZeit = 0;
            // array
            this.arrStart = [];
            this.arrEnd = [];
            this.arrStandby = [];

            // Methoden

            // Abbruchvalue erstellen
            if (objVal.endCount >= 5 && objVal.endCount <= 10) {
                this.valCancel = objVal.endCount - 5;
            } else if (objVal.endCount > 10) {
                this.valCancel = 10;
            } else {
                this.valCancel = 5;
            };

            /*obj Startext erstellen*/
            this.startMessageText = obj.startText;
            if (obj.startText != `` && obj.startText != undefined) {
                this.startMessage = true;
            } else {
                this.startMessage = false;
            };

            /*obj Endtext erstellen*/
            this.endMessageText = obj.endText;
            if (obj.endText != `` && obj.endText != undefined) {
                this.endMessage = true;
            } else {
                this.endMessage = false;
            };

            /*obj timer erstellen*/
            if (obj.autoOff) {
                if (obj.timer != `` && obj.timer != undefined && obj.timer != 0) {
                    this.timeoutInMS = (Math.floor(obj.timer) * 60 * 1000); // Umrechnung auf ms
                } else {
                    this.timeoutInMS = 0;
                };
            };
            this.timeout = null

            /*obj telegram erstellen*/
            if (obj.telegram != `` && obj.telegram != undefined) {
                this.telegramUser = obj.telegram
                this.telegram = true;
            } else {
                this.telegram = false;
            };

            /*obj alexa erstellen*/
            if (obj.alexa != undefined) {
                this.alexaID = obj.alexa;
                this.alexaVolOld = 0;
                this.alexa = true;
            } else {
                this.alexa = false;
            };

            /*obj sayIt erstellen*/
            if (obj.sayit != undefined) {
                this.sayItID = obj.sayit;
                this.sayItVolOld = 0;
                this.sayIt = true;
            } else {
                this.sayIt = false;
            };

            /*obj whatsapp erstellen*/
            if (obj.whatsapp != `` && obj.whatsapp != undefined) {
                this.whatsappID = obj.whatsapp;
                this.whatsapp = true;
            } else {
                this.whatsapp = false;
            };

        };
    };

    // Objekte erstellen
    //DPs erstellen
    const statusDevice = (`${obj.name}.Status`);
    const consumpLive = (`${obj.name}.live consumption`);
    const runtime = (`${obj.name}.runtime`);
    const runtimeMS = (`${obj.name}.runtime in ms`);
    const messageDP = (`${obj.name}.messageDP`);
    const autoOffDP = (`${obj.name}.config.auto Off`);
    const averageConsumption = (`${obj.name}.average consumption`);
    const doNotDisturb = (`${obj.name}.config.do not disturb`);

    //Only displaying data points
    await this.setObjectNotExistsAsync(statusDevice, {
        type: `state`,
        common: {
            name: `Status ${obj.name}`,
            type: `string`,
            role: `indicator`,
            read: true,
            write: false,
        },
        native: {},
    });
    await this.setObjectNotExistsAsync(consumpLive, {
        type: `state`,
        common: {
            name: `live consumption ${obj.name}`,
            type: `number`,
            role: `indicator`,
            unit: `W`,
            read: true,
            write: false,
        },
        native: {},
    });
    await this.setObjectNotExistsAsync(runtime, {
        type: `state`,
        common: {
            name: `runtime ${obj.name}`,
            type: `string`,
            role: `indicator`,
            read: true,
            write: false,
        },
        native: {},
    });
    await this.setObjectNotExistsAsync(runtimeMS, {
        type: `state`,
        common: {
            name: `runtime in ms ${obj.name}`,
            type: `number`,
            role: `indicator`,
            read: true,
            write: false,
        },
        native: {},
    });
    await this.setObjectNotExistsAsync(messageDP, {
        type: `state`,
        common: {
            name: `messageDP ${obj.name}`,
            type: `string`,
            role: `indicator`,
            read: true,
            write: false,
        },
        native: {},
    });
    await this.setObjectNotExistsAsync(averageConsumption, {
        type: `state`,
        common: {
            name: `average consumption ${obj.name}`,
            type: `number`,
            role: `indicator`,
            unit: `W`,
            read: true,
            write: false,
        },
        native: {},
    });

    await this.setObjectNotExistsAsync(doNotDisturb, {
        type: `state`,
        common: {
            name: `do not disturb ${obj.name}`,
            type: `boolean`,
            role: `indicator`,
            read: true,
            write: true,
        },
        native: {},
    });

    // device type ermitteln und Objekt bauen
    let devCusType;
    let devDefType;
    devCusType = await this.config.defaultTypeIDFinal;
    devDefType = await this.config.customTypeIDFinal;

    let objVal = {
        used: false,
        startVal: 0,
        endVal: 0,
        startCount: 0,
        endCount: 0
    };

    for (const i in devCusType) {
        if (devCusType[i].name == obj.type) {
            objVal.used = true;
            objVal.startVal = devCusType[i].startVal;
            objVal.endVal = devCusType[i].endVal;
            objVal.startCount = devCusType[i].startCount;
            objVal.endCount = devCusType[i].endCount;
        };
    };

    if (objVal.used == false) {
        for (const i in devDefType) {
            if (devDefType[i].name == obj.type) {
                objVal.startVal = devDefType[i].startVal
                objVal.endVal = devDefType[i].endVal
                objVal.startCount = devDefType[i].startCount
                objVal.endCount = devDefType[i].endCount
            };
        };
    };
    this.log.debug(`RETURN ${JSON.stringify(objVal)}`);

    const device = new Geraet(obj, statusDevice, consumpLive, runtime, runtimeMS, messageDP, autoOffDP, averageConsumption, doNotDisturb, objVal);
    objTemp = device;
    arrDevices.push(device);

    this.log.warn(`RETURN ${JSON.stringify(objTemp)}`);
    this.log.debug(`arrDevices ${JSON.stringify(arrDevices)}`);
    this.log.info(`Device ${JSON.stringify(objTemp.deviceName)} was successfully created`)

    return objTemp;
};