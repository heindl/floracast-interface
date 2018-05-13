/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import '@firebase/firestore';
import {} from 'jest';
import { when } from 'mobx';
import * as PapaParse from 'papaparse';
import * as uuid from 'uuid';
import {MTime} from '../date';
import {getGlobalModel} from "../globals";
import MLocationMapCoordinates from "../location/map";
import {MMapPredictions} from "../points";
import {MMapTaxa} from "../taxa";

PapaParse.RemoteChunkSize = undefined; // Resolve an issue with header type.

it(
  'instantiates, parses and renders correct date',
  async () => {
    const namespace = uuid.v4().substr(0, 5);

    const coordStore: MLocationMapCoordinates = getGlobalModel(namespace, MLocationMapCoordinates);

    coordStore.SetCoordinates(44.9708547,-93.4012199); // Minneapolis
    coordStore.SetZoom(6);
    const dateStore: MTime = getGlobalModel(namespace, MTime);
    dateStore.FromFormattedString('20170908');
    const taxaStore: MMapTaxa = getGlobalModel(namespace, MMapTaxa);
    taxaStore.Select('ugkG3de');

    const mPredictions = getGlobalModel(namespace, MMapPredictions);

    // const pointStore = getPointStore(namespace, PointType.Predictions);
    //
    await when(() => mPredictions.MapPoints.length > 0);

    expect(mPredictions.MapPoints.length).toEqual(82);

    coordStore.SetZoom(7);

      expect(mPredictions.MapPoints.length).toEqual(41);

      coordStore.SetZoom(6);

      expect(mPredictions.MapPoints.length).toEqual(82);

      dateStore.FromFormattedString('20170929');

      expect(mPredictions.MapPoints.length).toEqual(40);

      coordStore.SetCoordinates(41.8339058,-88.0114663);

      expect(mPredictions.MapPoints.length).toEqual(227);
  },
  10000
);
