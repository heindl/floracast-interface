/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import * as History from 'history';
import {} from 'jest';
import {when} from "mobx";
import * as uuid from 'uuid';
import sleep from '../../utils/sleep.mock';
import { getCoordinateStore } from '../coordinates';
import { getDateStore } from '../date';
import { getRouterStore } from '../router';
import { getViewStore, PointType } from '../view';

it('instantiates, parses and updates router', async () => {
  const namespace = uuid.v4().substr(0, 5);

  const historyRef = History.createBrowserHistory({
    basename: '',
  });
  historyRef.push('map');
  const coordStore = getCoordinateStore(namespace);
  const viewStore = getViewStore(namespace);
  const dateStore = getDateStore(namespace);
  const routerStore = getRouterStore(historyRef, namespace);

  viewStore.SetPointType(PointType.Occurrences);

  await when(() => viewStore.PointType === PointType.Occurrences);

  expect(coordStore.Latitude).toEqual(35.538851);
  expect(coordStore.Longitude).toEqual(-82.7054901);
  expect(dateStore.DateString).toEqual('20180316');

  expect(historyRef.location.pathname).toEqual(
    '/map/occurrences/@35.538851,-82.705490,9z/20180316/'
  );

  coordStore.SetPosition(33.619953, -84.389027, 9);

  // await when(() => historyRef.location.pathname === '/map/occurrences/@33.6199531,-84.3890274,9z/20180316/')

  await sleep(250);

  expect(historyRef.location.pathname).toEqual(
    '/map/occurrences/@33.619953,-84.389027,9z/20180316/'
  );

  coordStore.SetZoom(10);

  await sleep(250);

  expect(historyRef.location.pathname).toEqual(
    '/map/occurrences/@33.619953,-84.389027,10z/20180316/'
  );

  dateStore.FromFormattedString('20180320');

  await sleep(250);

  expect(historyRef.location.pathname).toEqual(
    '/map/occurrences/@33.619953,-84.389027,10z/20180320/'
  );

  viewStore.SetPointType(PointType.Predictions);

  await sleep(250);

  expect(historyRef.location.pathname).toEqual(
    '/map/predictions/@33.619953,-84.389027,10z/20180320/'
  );
});
