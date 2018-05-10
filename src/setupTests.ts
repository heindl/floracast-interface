// const resizeEvent = new window.Event("resize", {bubbles: true});
// // resizeEvent.initEvent('resize', true, true);
//
// window.resizeTo = (width, height) => {
//     window.innerWidth = width;
//     window.innerHeight = height;
//     window.dispatchEvent(resizeEvent);
// };

import { IGeoLocationMock } from './utils/geolocation.mock';

// global.window.innerWidth = 600;
// global.window.innerHeight = 400;

global.innerWidth = 600;
global.innerHeight = 400;

global.navigator.geolocation = new IGeoLocationMock(33.6199531, -84.3890274); // Atlanta

jest.mock('moment', () => {
  const moment = require.requireActual('moment');
  moment.now = () => 1521222084282; // 20180316
  return moment;
});
