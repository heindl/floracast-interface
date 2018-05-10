/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import {} from 'jest';
import { when } from 'mobx';
import uuid = require('uuid');
import { getCoordinateStore } from '../coordinates';
import { getDateStore } from '../date';
import { getTaxaStore } from '../taxa';
import { getViewStore, PointType } from '../view';

it(
  'instantiates, parses and updates router',
  async () => {
    const namespace = uuid.v4().substr(0, 5);

    const coordStore = getCoordinateStore(namespace);
    await when(() => coordStore.IsReady === true);
    coordStore.SetZoom(7);

    const dateStore = getDateStore(namespace);
    dateStore.FromFormattedString('20170421');

    const viewStore = getViewStore(namespace);
    viewStore.SetPointType(PointType.Predictions);

    const taxaStore = getTaxaStore(namespace);

    await when(() => taxaStore.Taxa.length > 0);

    console.log(taxaStore.Taxa.peek());

    // expect(taxaStore.Taxa.length).toEqual(2);
    //
    // viewStore.SetPointType(PointType.Occurrences);
    //
    // expect(taxaStore.Taxa.length).toEqual(2);
  },
  20000
);
