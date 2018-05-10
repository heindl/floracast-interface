/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import {} from 'jest';
import { when } from 'mobx';
import * as uuid from 'uuid';
import sleep from '../../utils/sleep.mock';
import { getCoordinateStore } from '../coordinates';

it('instantiates, parses and renders correct coords', async () => {
  const atl = [33.619953, -84.389027]; // Atlanta
  const bos = [42.314518, -71.110712]; // Boston
  const stl = [38.653016, -90.378053]; // St. Louis
  const chi = [41.833392, -87.944856]; // Chicago

  const namespace = uuid.v4().substr(0, 5);

  const cs = getCoordinateStore(namespace);

  await when(() => cs.IsReady === true);

  await when(() => cs.City !== 'Asheville');

  expect(cs.Latitude).toEqual(atl[0]);
  expect(cs.Longitude).toEqual(atl[1]);
  expect(cs.Zoom).toEqual(9);
  // expect(cs.DistanceKilometers(bos[0], bos[1])).toBeCloseTo(1511.633417);
  // let bearingTo = cs.BearingTo(bos[0], bos[1]);
  // expect(bearingTo.s).toEqual('NE');
  // expect(bearingTo.i).toBeCloseTo(46.333564);
  expect(cs.Formatted).toEqual(`@${atl[0]},${atl[1]},9z`);
  expect(cs.City).toEqual('Forest Park');
    expect(cs.StateAbbreviation).toEqual('GA');
  expect(cs.State).toEqual('Georgia');

  expect(() => {
    cs.FromPath(`@${chi[0]},${chi[1]}`);
  }).toThrow();
  cs.FromPath(`@${chi[0]},${chi[1]},9z`);

  await when(() => cs.StateAbbreviation === 'IL');

  expect(cs.Latitude).toEqual(chi[0]);
  expect(cs.Longitude).toEqual(chi[1]);
  expect(cs.Zoom).toEqual(9);
  // expect(cs.DistanceKilometers(stl[0], stl[1])).toBeCloseTo(409.94112577);
  // bearingTo = cs.BearingTo(stl[0], stl[1]);
  // expect(bearingTo.s).toEqual('SW');
  // expect(bearingTo.i).toBeCloseTo(-148.922565);
  expect(cs.City).toEqual('Oak Brook');
  expect(cs.StateAbbreviation).toEqual('IL');
    expect(cs.State).toEqual('Illinois');

  expect(cs.Radius).toBeCloseTo(82.137173);
  cs.IncrementZoom(-1);
  expect(cs.Radius).toBeCloseTo(164.26595685);
  cs.IncrementZoom(1);
  expect(cs.Radius).toBeCloseTo(82.137173);
  cs.SetZoom(5);
  expect(cs.Radius).toBeCloseTo(1308.3695047);

  window.innerWidth = 900;
  window.innerHeight = 600;
  window.dispatchEvent(
    new Event('resize', { bubbles: true, cancelable: true })
  );

  await sleep(250);

  expect(cs.ViewPort[0]).toEqual(900);
  expect(cs.ViewPort[1]).toEqual(600);
  expect(cs.Radius).toBeCloseTo(1951.5935901);

  cs.SetZoom(9);
  expect(cs.ViewPort[0]).toEqual(900);
  expect(cs.ViewPort[1]).toEqual(600);
  expect(cs.Radius).toBeCloseTo(123.203138674);
}, 20000);
