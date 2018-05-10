/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import {} from 'jest';
import moment = require('moment');
import * as uuid from 'uuid';
import { DateStore, getDateStore } from '../date';

it('shifts a date to a predicted weekday', () => {
  interface StandardWeekdayTest {
    i: 0 | 1 | -1;
    s: string;
    e: string;
  }

  [
    { i: 0, s: '2018-04-17', e: '2018-04-17' },
    { i: 0, s: '2018-04-16', e: '2018-04-17' },
    { i: 0, s: '2018-04-15', e: '2018-04-13' },
    { i: 0, s: '2018-04-14', e: '2018-04-13' },
    { i: 1, s: '2018-04-17', e: '2018-04-20' },
    { i: -1, s: '2018-04-17', e: '2018-04-13' },
  ].forEach((t: StandardWeekdayTest) => {
    const m = moment(t.s);
    const r = DateStore.toStandardDay(m, t.i);
    expect(r.format('YYYY-MM-DD')).toEqual(t.e);
  });
});

it('instantiates, parses and renders correct date', () => {
  const namespace = uuid.v4().substr(0, 5);
  const dateStore = getDateStore(namespace);
  expect(dateStore.MonthString).toEqual('03');
  expect(dateStore.DateString).toEqual('20180316');
  expect(dateStore.Formatted).toEqual('March 16');

  expect(() => {
    dateStore.FromFormattedString('20180201');
  }).toThrow();

  expect(() => {
    dateStore.FromFormattedString('02');
  }).toThrow();

  dateStore.FromFormattedString('20180209');
  expect(dateStore.MonthString).toEqual('02');
  expect(dateStore.DateString).toEqual('20180209');
  expect(dateStore.Formatted).toEqual('February 9');

  dateStore.Shift(-1);
  expect(dateStore.DateString).toEqual('20180206');
  dateStore.Shift(-1);
  expect(dateStore.DateString).toEqual('20180202');

  dateStore.FromFormattedString('20180209');

  dateStore.Shift(1);
  expect(dateStore.DateString).toEqual('20180213');
  dateStore.Shift(1);
  expect(dateStore.DateString).toEqual('20180216');
});
