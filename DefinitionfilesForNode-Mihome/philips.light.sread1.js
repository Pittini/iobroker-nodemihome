const Device = require('../device-miio');
const { withLightEffect } = require('../utils');

module.exports = class extends Device {

  static model = 'philips.light.sread1';
  static name = 'Xiaomi Philips Eyecare Smart Lamp 2';
  static image = 'https://i02.appmifile.com/images/2017/08/25/e6a37aba-73b4-4740-9d49-7aec8d75c199.png';

  constructor(opts) {
    super(opts);

    this._propertiesToMonitor = [
      'power',
      'bright',
      'ambstatus',
      'ambvalue',
      'eyecare',
      'scene_num',
      'notifystatus',
      'bls',
      'dvalue'
    ];
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

  getAmbientStatus() {
    const { ambstatus } = this.properties;
    if (ambstatus === 'on') return true;
    if (ambstatus === 'off') return false;
    return undefined;
  }

  getAmbientBrightness() {
    const ambvalue = parseInt(this.properties.ambvalue, 10);
    if (ambvalue >= 0) return ambvalue;
    return undefined;
  }

  getEyecareStatus() {
    const { eyecare } = this.properties;
    if (eyecare === 'on') return true;
    if (eyecare === 'off') return false;
    return undefined;
  }

  getEyecareScene() {
    const scene_num = parseInt(this.properties.scene_num, 10);
    if (scene_num >= 0) return scene_num;
    return undefined;
  }

  getNightLight() {
    const { bls } = this.properties;
    if (bls === 'on') return true;
    if (bls === 'off') return false;
    return undefined;
  }

  getFatigueReminder() {
    const { notifystatus } = this.properties;
    if (notifystatus === 'on') return true;
    if (notifystatus === 'off') return false;
    return undefined;
  }

  getDelayOff() {
    const dvalue = parseInt(this.properties.dvalue, 10);
    if (dvalue >= 0) return dvalue;
    return undefined;
  }

  setPower(v) {
    return this.miioCall('set_power', [v]);
  }

  setBrightness(v) {
    return this.miioCall('set_bright', [v]);
  }

  setAmbientStatus(v) {
    return this.miioCall('enable_amb', [v]);
  }

  setAmbientBrightness(v) {
    return this.miioCall('set_amb_bright', [v]);
  }

  setEyecareStatus(v) {
    return this.miioCall('set_eyecare', [v]);
  }

  setEyecareScene(v) {
    return this.miioCall('set_user_scene', [v]);
  }

  setFatigueReminder(v) {
    return this.miioCall('set_notfiyuser', [v]);
  }

  setNightLight(v) {
    return this.miioCall('enable_bl', [v]);
  }

  setDelayOff(v) {
    return this.miioCall('delay_off', [v]);
  }
};
