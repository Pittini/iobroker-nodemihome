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
    
      'humidifier:on'
    ];
  }

  getPower() {
    const { power } = this.properties;
    if (power === 'on') return true;
    if (power === 'off') return false;
    return undefined;
  }

  getFanLevel() {
    const fanLevel = parseInt(this.properties['mode'], 10);
    if (fanLevel >= 0) return fanLevel;
    return undefined;
  }

  getTartgetHumidity() {
    return this.properties['limit_hum'];
  }

  getWaterLevel() {
    return this.properties['depth'];
  }

  getTemperature() {
    return this.properties['temperature'];
  }

  getHumidity() {
    return this.properties['humidity'];
  }

  getMode() {
    const { dry } = this.properties;
    if (dry === 'on') return 'dry';
    if (dry === 'off') return 'humidify';
    return undefined;
  }

  getChildLock() {
    const childLock = this.properties['child_lock'];
    if (childLock === 'on') return true;
    if (childLock === 'off') return false;
    return undefined;
  }

  getLedBrightness() {
    const led = this.properties['led_b'];
    if (led >= 0) return led;
    return undefined;
  }

  getBuzzer() {
    const { buzzer } = this.properties;
    if (buzzer === 'on') return true;
    if (buzzer === 'off') return false;
    return undefined;
  }

  setPower(v) {
    return this.miotSetProperty('humidifier:on', v);
  }


};