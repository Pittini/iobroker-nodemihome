const Device = require('../device-miio');
//edited and checked for full funcionality by Wildbill-Z
module.exports = class extends Device {

  static model = 'zhimi.airpurifier.vb2';
  static name = 'Mi Air Purifier Pro H';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);

    this._miotSpecType = 'urn:miot-spec-v2:device:air-purifier:0000A007:zhimi-vb2:1';
    this._propertiesToMonitor = [
      'air-purifier:fault',
      'air-purifier:on',
      'air-purifier:fan-level',
      'air-purifier:mode',
      'environment:pm2.5-density',
      'environment:relative-humidity',
      'environment:temperature',
      'filter:filter-life-level',
      'filter:filter-used-time',
      'alarm:volume',
      'motor-speed:motor1-set-speed',
      'motor-speed:motor1-speed',
      'motor-speed:favorite-level',
      'indicator-light:brightness',
      'indicator-light:on',
      'use-time:use-time',
      'physical-controls-locked:physical-controls-locked'];
  }

  getFilterlife() {
    return this.properties['filter:filter-life-level'];
  }

  getFilterused() {
    return this.properties['filter:filter-used-time'];
  }

  getPower() {
    return this.properties['air-purifier:on'];
  }

  getMode() {
    const mode = this.properties['air-purifier:mode'];
    if (mode === 0) return 'auto';
    if (mode === 1) return 'sleep';
    if (mode === 2) return 'favorite';
    if (mode === 3) return 'none';
    return undefined;
  }

  getFanLevel() { // 1 - 3
    return this.properties['air-purifier:fan-level'];
  }

  getFavLevel() { // 1 - 9
    return this.properties['motor-speed:favorite-level'];
  }

  getSpeed() {
    return this.properties['motor-speed:motor1-speed'];
  }

  getSetSpeed() {
    return this.properties['motor-speed:motor1-set-speed'];
  }


  getTemperature() {
    return this.properties['environment:temperature'];
  }

  getHumidity() {
    return this.properties['environment:relative-humidity'];
  }

  // eslint-disable-next-line camelcase
  getPM2_5() {
    return this.properties['environment:pm2.5-density'];
  }

  getFilterRemaining() {
    const filterTotal = this.properties['filter:filter-life-level'];
    const filterUsed = this.properties['filter:filter-used-time'];
    if (filterTotal > 0 && filterUsed >= 0) {
      //return Math.max((1 - filterUsed / filterTotal) * 100, 0);
      return Math.max(filterUsed / (100 - filterTotal) * filterTotal/24, 0);
    }
    return undefined;
  }

  getBuzzer() {
    return this.properties['alarm:volume'];
  }

  getUseTime() {
    return this.properties['use-time:use-time'];
  }

  getLcdBrightness() {
    return this.properties['indicator-light:brightness'];
  }

  setPower(v) {
    return this.miotSetProperty('air-purifier:on', v);
  }

  setMode(v) {
    if (v === 'auto') v = 0;
    else if (v === 'sleep') v = 1;
    else if (v === 'favorite') v = 2;
    else if (v === 'none') v = 3;
    return this.miotSetProperty('air-purifier:mode', v);
  }

  setFanLevel(v) { // 1-3
    return this.miotSetProperty('air-purifier:fan-level', v);
  }

  setFavLevel(v) { // 1 - 9
    return this.miotSetProperty('motor-speed:favorite-level', v);
  }

  setBuzzer(v) {
    return this.miotSetProperty('alarm:volume', v);
  }

  setLcdBrightness(v) { // 0-brightest, 1-glimmer, 2-led_closed
    return this.miotSetProperty('indicator-light:brightness', v);
  }

  setChildLock(v) {
    return this.miotSetProperty('physical-controls-locked:physical-controls-locked', v);
  }

};

