const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'zhimi.humidifier.ca4';
  static name = 'Smartmi Evaporative Humidifier';
  static image =
    'https://cdn.cnbj1.fds.api.mi-img.com/iotweb-product-center/developer_1566881006690Xccq6g7F.png?GalaxyAccessKeyId=AKVGLQWBOVIRQ3XLEW&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;Expires=9223372036854775807&amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;amp;Signature=hGrzbHprrc2iBCFqLjolW7fR4b8=';

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
    return this.miotSetProperty('physical-controls-locked.physical-controls-locked', v);
  }

};