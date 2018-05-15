/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import * as History from 'history';
import {} from 'jest';
import * as uuid from 'uuid';
import {getGlobalModel} from "../globals";
import {MRouter} from "../router";

describe('router', () => {

      let router: MRouter;
      let historyRef: History.History;

      beforeEach(() => {
          router = getGlobalModel(
              uuid.v4().substr(0, 5),
              MRouter,
          );
          historyRef = router.HistoryRef;
      });

    it('parses map path', () => {
        historyRef.push('/map/@35.538851,-82.705490,9z/20180316/ugkG3de');
        expect(router.ParseCurrentPath()).toEqual({
            params: {
                date: '20180316',
                lat: 35.538851,
                lng: -82.705490,
                nameUsageId: 'ugkG3de',
                zoom: 9,
            },
            section: 'map',
        });
    });

    it('parses forecast path', () => {
        historyRef.push('/forecast/north+carolina/asheville/20180316');
        expect(router.ParseCurrentPath()).toEqual({
            params: {
                adminAreaLong: 'north carolina',
                date: '20180316',
                locality: 'asheville',
            },
            section: 'forecast',
        });
    });

      it('navigates to map', async () => {
         router.NavigateTo({
             params: {
                 date: '20180316',
               lat: 35.538851,
                 lng: -82.705491,
             },
             section: 'map',
         });
          expect(historyRef.location.pathname).toEqual(
              '/map/@35.538851,-82.705491,9z/20180316/'
          );
      });

      it('navigates to forecast', () => {
          router.NavigateTo({
              params: {
                  adminAreaLong: 'North Carolina',
                  date: '20180316',
                  locality: 'Asheville',
              },
              section: 'forecast',
          });
          expect(historyRef.location.pathname).toEqual(
              '/forecast/north+carolina/asheville/20180316'
          );
      });

    it('handles updates', () => {
        historyRef.push('/map/@35.538851,-82.705491,9z/20180316/');
        router.NavigateTo({
            params: {
                date: '20180310',
                lat: 35.538851,
                lng: -82.705491,
            },
            section: 'map',
        });
        expect(historyRef.location.pathname).toEqual(
            '/map/@35.538851,-82.705491,9z/20180310/'
        );
    })

});
