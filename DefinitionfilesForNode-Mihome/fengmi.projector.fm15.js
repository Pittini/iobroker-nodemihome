const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'fengmi.projector.fm15';
  static name = 'Mijia Laser TV';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);

    this._miotSpecType = 'urn:miot-spec-v2:device:projector:0000A02C:fengmi-fm15:1';
    this._propertiesToMonitor = [
      'speaker:volume'
    ];
  }


  setVolume(v) {
    return this.miotSetProperty('speaker:volume', v);
  }


};