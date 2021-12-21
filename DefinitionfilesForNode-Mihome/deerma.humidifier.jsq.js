const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'deerma.humidifier.jsq';
  static name = 'Smartmi Evaporative Humidifier';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);
    this._miotSpecType = 'urn:miot-spec-v2:device:humidifier:0000A00E:deerma-jsq:1';

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

  setBuzzer(v) {
    return this.miotSetProperty('alarm:alarm', v);
  }

  setBright(v) {
    return this.miotSetProperty('indicator-light:on', v);
  }


};