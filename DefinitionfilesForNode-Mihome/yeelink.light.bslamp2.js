const Device = require('../device-miio');
const { withLightEffect } = require('../utils');

module.exports = class extends Device {

  static model = 'yeelink.light.bslamp2';
  static name = 'Yeelink Bedside Lamp';
  static image = 'https://i01.appmifile.com/v1/MI_18455B3E4DA706226CF7535A58E875F0267/pms_1595312790.51825143.png';

  constructor(opts) {
    super(opts);

   // this._miotSpecType = 'urn:yeelink-spec:service:light-extension:00000001:yeelink-bslamp2:1';
    this._propertiesToMonitor = [
      'power',
      'bright',
      'rgb',
      'color_mode',
      'ct'];
  }

  getPower() {
    const { power } = this.properties;
    if (power === 'on') return true;
    if (power === 'off') return false;
    return undefined;
  }

  getBrightness() {
    const brightness = parseInt(this.properties.bright, 10);
    if (brightness >= 0) return brightness;
    return undefined;
  }

  getColorRgb() {
    const colorRgb = parseInt(this.properties.rgb, 10);
    if (colorRgb >= 1) return colorRgb;
    return undefined;
  }

  getMode() {
    const mode = parseInt(this.properties.color_mode, 10);
    if (mode >= 1) return mode;
    return undefined;
  }

  getCt() {
    const ct = parseInt(this.properties['color-temperature'], 10);
    if (ct >= 1700) return ct;
    return undefined;
  }


  setPower(v) {
    return this.miioCall('set_power', withLightEffect(v ? 'on' : 'off'));
  }

  setBrightness(v) {
    return this.miioCall('set_bright', withLightEffect(v));
  }

  setColorRgb(v) {
    this._miioCall('set_rgb', withLightEffect(v.rgb));
  }

  setMode(v) {
    return this.miioCall('set_color_mode', withLightEffect(v));
  }
  setCt(v) {
    return this.miioCall('set_color-temperature', withLightEffect(v));
  }

};