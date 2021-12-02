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