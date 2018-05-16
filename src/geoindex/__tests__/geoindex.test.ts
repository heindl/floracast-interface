/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import {} from 'jest';
import { when } from 'mobx';
import * as uuid from 'uuid';
import { getCoordinateStore } from '../../stores/coordinates';
import { getFireStoreRef } from '../../stores/firestore';
import { FetchOccurrenceTaxa, FetchPredictionTaxa } from '../taxa';

it('computes a GeoHash covering from a bounding box', async () => {
  const namespace = uuid.v4().substr(0, 5);

  const coordStore = getCoordinateStore(namespace);
  await when(() => coordStore.IsReady === true);
  coordStore.SetZoom(6);

  const fireStoreRef = getFireStoreRef(namespace);
  const cellIds = coordStore.Covering;

  // const points = await FetchPredictionPoints(fireStoreRef, cellIds, 'Io1ftGL', '20170327')
  //
  // expect(points.length).toEqual(13);
  //
  let taxa = await FetchPredictionTaxa(
    fireStoreRef,
    cellIds,
    [coordStore.Latitude, coordStore.Longitude],
    '20170327'
  );

  // expect(taxa.length).toEqual(2);
  // expect(taxa).toContain('Io1ftGL');
  // expect(taxa).toContain('sbjeYTj');

  taxa = await FetchOccurrenceTaxa(fireStoreRef, cellIds, '05');

  console.log('taxa', taxa);
});

// it("fetches taxa", async () => {
//     const namespace = uuid.v4().substr(0, 5);
//
//     const coordStore = getCoordinateStore(namespace);
//
//     await when(() => coordStore.IsReady === true);
//
//     coordStore.SetCoordinates(31.7142857,-83.687538);
//     coordStore.SetZoom(8);
//
//     const dateStore = getDateStore(namespace);
//     dateStore.FromFormattedString("20170414");
//
//     await sleep(5000);
//
//     const taxaStore = getTaxaStore(namespace);
//
//     await when(()=>taxaStore.Taxa.length > 0);
//
//     console.log(taxaStore.Taxa);
//
// }, 20000);
