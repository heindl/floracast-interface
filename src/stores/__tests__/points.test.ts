/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import '@firebase/firestore';
import {} from 'jest';
import { when } from 'mobx';
import * as PapaParse from 'papaparse';
import * as uuid from 'uuid';
import {MTime} from '../date';
import {clearGlobalStores, getGlobalModel} from "../globals";
import MLocationMapCoordinates from "../location/map";
import {MMapPredictions} from "../points";
import {MMapTaxa} from "../taxa";
import {MMapPredictionTimeline} from "../timeline";

PapaParse.RemoteChunkSize = undefined; // Resolve an issue with header type.

const MN = [44.9708547, -93.4012199];
const CHI = [41.8339058, -88.0114663];

describe('point model suite', () => {

    describe('base point store',() => {
            
            let namespace: string;
            let mCoords: MLocationMapCoordinates;
            let mTime: MTime;
            let mTaxa: MMapTaxa;
            let mPredictions: MMapPredictions;

            beforeEach(() => {
                namespace = uuid.v4().substr(0, 5);
                mCoords = getGlobalModel(namespace, MLocationMapCoordinates);
                mTime = getGlobalModel(namespace, MTime);
                mTaxa = getGlobalModel(namespace, MMapTaxa);
                mPredictions = getGlobalModel(namespace, MMapPredictions);
                mCoords.SetCoordinates(MN[0], MN[1]); // Minneapolis
                mCoords.SetZoom(6);
                mTime.FromFormattedString('20170908');
                mTaxa.Select('ugkG3de');
            });

            it('instatiates and fetches csv', async () => {
                await when(() => mPredictions.IsLoading === false);
                expect(mPredictions.MapPoints.length).toEqual(82);
            });

                it('updates points on location changes', async () => {
                    await when(() => mPredictions.IsLoading === false);
                    expect(mPredictions.MapPoints.length).toEqual(82);
                    mCoords.SetZoom(7);

                    expect(mPredictions.MapPoints.length).toEqual(41);

                    mCoords.SetZoom(6);

                    expect(mPredictions.MapPoints.length).toEqual(82);

                    mTime.FromFormattedString('20170929');

                    expect(mPredictions.MapPoints.length).toEqual(40);

                    mCoords.SetCoordinates(CHI[0], CHI[1]);

                    expect(mPredictions.MapPoints.length).toEqual(227);
                });
        
            it('generates timeline marks and updates when scaled', async () => {
                    const mTimeline: MMapPredictionTimeline = getGlobalModel(namespace, MMapPredictionTimeline);
                    await when(() => mTimeline.TickMarks.length > 0);
                    expect(mTimeline.TickMarks.filter((m) => m.pointCount > 0).length).toEqual(40);
                    mCoords.SetCoordinates(CHI[0], CHI[1]);
                    await when(() => mTimeline.TickMarks.filter((m) => m.pointCount > 0).length > 41);
                    expect(mTimeline.TickMarks.filter((m) => m.pointCount > 0).length).toEqual(48);
            });
    });

});
