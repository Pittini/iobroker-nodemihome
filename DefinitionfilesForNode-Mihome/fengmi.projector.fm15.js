const Device = require('../device-miio');

module.exports = class extends Device {

  static model = 'fengmi.projector.fm15';
  static name = 'Mijia Laser TV';
  static image = 'http://static.home.mi.com/app/image/get/file/developer_1543307568u9wu6wij.png';

  constructor(opts) {
    super(opts);

    this._propertiesToMonitor = [
      'power'
    ];
  }


  setPower(v) {
    return this.miioCall('set_power', [v ? 'on' : 'off']);
  }


};