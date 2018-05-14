/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import {} from 'jest';
import { when } from 'mobx';
import * as uuid from 'uuid';
import {clearGlobalStores, getGlobalModel} from "../../globals";
import {MLocationUserComputations} from '../computation';
import MLocationUserCoordinates, {DefaultRadius} from '../coordinate';
import MLocationMapCoordinates, {ZoomDefault} from '../map';
import LocationPlaceStore from '../place';

describe('location store suite', () => {

    const atl = [33.619953, -84.389027]; // Atlanta
    const bos = [42.314518, -71.110712]; // Boston
    const stl = [38.627003, -90.199404]; // St. Louis
    // const chi = [41.833392, -87.944856]; // Chicago

    describe('initial coordinate store', () => {

        let CS: MLocationUserCoordinates;

        beforeEach(() => {
            CS = getGlobalModel(
                uuid.v4().substr(0, 5),
                MLocationUserCoordinates
            );
        });

        it('instantiates from globals', () => {
            expect(CS.Radius).toEqual(DefaultRadius)
        });

        it('sets coordinates', () => {
            CS.SetCoordinates(atl[0], atl[1]);
            expect(CS.Latitude).toEqual(atl[0]);
            expect(CS.Longitude).toEqual(atl[1]);
        });

        it('sets radius', () => {
            CS.SetRadius(100)
            expect(CS.Radius).toEqual(100)
        });

        it('geolocates', async () => {
            CS.Geolocate();
            await when(() => CS.Latitude !== 0);
            expect(CS.Latitude).toEqual(atl[0]);
            expect(CS.Longitude).toEqual(atl[1]);
        });

        it('instantiates on multiple namespaces', async () => {
            CS.Geolocate();
            const newCS = getGlobalModel(
                uuid.v4().substr(0, 5),
                MLocationUserCoordinates
            );
            newCS.SetCoordinates(bos[0], bos[1]);
            await when(() => CS.Latitude !== 0);
            expect(CS.Latitude).toEqual(atl[0]);
            expect(CS.Longitude).toEqual(atl[1]);
            expect(newCS.Latitude).toEqual(bos[0]);
            expect(newCS.Longitude).toEqual(bos[1]);
        })
    });

    describe('map extended coordinate store', () => {

        let CS: MLocationMapCoordinates;

        beforeEach(() => {
            CS = getGlobalModel(
                uuid.v4().substr(0, 5),
                MLocationMapCoordinates
            );
        });
        afterEach(() => {
            clearGlobalStores();
        });

        it('instantiates from globals', () => {
            expect(CS.Zoom).toEqual(ZoomDefault)
            expect(CS.ViewPort[0]).toEqual(600);
            expect(CS.ViewPort[1]).toEqual(400);
        });

        it('updates radius from zoom', () => {
              expect(CS.Radius).toBeCloseTo(91.724);
              CS.IncrementZoom(-1);
              expect(CS.Radius).toBeCloseTo(183.449);
              CS.IncrementZoom(1);
              expect(CS.Radius).toBeCloseTo(91.724);
              CS.SetZoom(5);
              expect(CS.Radius).toBeCloseTo(733.795);
        });

        it('updates radius from viewport change', async () => {
              window.innerWidth = 900;
              window.innerHeight = 600;
              window.dispatchEvent(
                new Event('resize', { bubbles: true, cancelable: true })
              );

                await when(() => CS.ViewPort[0] !== 600);

              expect(CS.ViewPort[0]).toEqual(900);
              expect(CS.ViewPort[1]).toEqual(600);
              expect(CS.Radius).toBeCloseTo(137.587);
        })
    })

    describe('place extended coordinate store', () => {

        let PS: LocationPlaceStore;
        let CS: MLocationUserCoordinates;

        beforeEach(() => {
            const namespace = uuid.v4().substr(0, 5);
            CS = getGlobalModel(
                namespace,
                MLocationUserCoordinates
            );
            PS = getGlobalModel(
                namespace,
                LocationPlaceStore
            );
        });
        afterEach(() => {
            clearGlobalStores();
        });

        it('instantiates from globals and loads google maps', async () => {
            await when(() => PS.GoogleMapsScriptHasLoaded);
        });

        it('geocodes on instantiation', async () => {
            CS.Geolocate();
            await when(() => PS.Locality === 'Forest Park');
            expect(PS.AdminAreaLong).toEqual('Georgia');
            expect(PS.AdminAreaShort).toEqual('GA');
        }, 10000);

        it('geocodes on location change', async () => {
            CS.SetCoordinates(bos[0], bos[1]);
            await when(() => PS.Locality === 'Boston');
            expect(PS.AdminAreaLong).toEqual('Massachusetts');
            expect(PS.AdminAreaShort).toEqual('MA');
        });

        it('reverse geocodes from address', async () => {
            await PS.ReverseGeocode({address: 'St. Louis, Missouri'});
            await when(() => PS.AdminAreaLong === 'Missouri');
            expect(PS.AdminAreaShort).toEqual('MO');
            expect(CS.Longitude).toBeCloseTo(stl[1]);
            expect(CS.Latitude).toBeCloseTo(stl[0]);
        })
    });

    describe('coordinate store computations', () => {

        let CS: MLocationUserCoordinates;
        let CCS: MLocationUserComputations;

        beforeEach(() => {
            const namespace = uuid.v4().substr(0, 5);
            CS = getGlobalModel(
                namespace,
                MLocationUserCoordinates
            );
            CCS = getGlobalModel(
                namespace,
                MLocationUserComputations
            );
        });
        afterEach(() => {
            clearGlobalStores();
        });

        it('generates a S2CellId covering', async () => {
            CS.Geolocate();
            CS.SetRadius(500);
            await when(() => CCS.Covering.length > 0);
            expect(CCS.Covering.length).toEqual(13);
            expect(CCS.CoveringAtLevelSeven.length).toEqual(9);
        });
    })


});
