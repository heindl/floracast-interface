/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import '@firebase/firestore';
import {} from 'jest';
import { when } from 'mobx';
import * as uuid from 'uuid';
import sleep from "../../utils/sleep.mock";
import { getCoordinateStore } from '../coordinates';
import { getDateStore } from '../date';
import { getTaxaStore } from '../taxa';



it(
  'instantiates, parses and renders correct date',
  async () => {
    const namespace = uuid.v4().substr(0, 5);

    const coordStore = getCoordinateStore(namespace);

    await when(() => coordStore.IsReady === true);

      coordStore.SetZoom(6);
    //
    // const dateStore = getDateStore(namespace);
    // dateStore.FromFormattedString('20180420');
    // // // const viewStore = getViewStore(namespace);
    // const taxaStore = getTaxaStore(namespace);
    // taxaStore.Select('ugkG3de');
    // // viewStore.SetPointType(PointType.Occurrences);
    //
    //
    //




    // const pointStore = getPointStore(namespace, PointType.Predictions);
    //
    // await when(() => pointStore.MapPoints.length > 0);

    // console.log(pointStore.MapPoints)
    //
    // const coordinateStore = getCoordinateStore(namespace);
    // const fireStoreRef = getFireStoreRef(namespace);
    //
    // const bounds = coordinateStore.Bounds;
    // // INAT-48701-5279873, (35.5926383215, -121.0413186275)
    // const res = await fireStoreRef.collection("Occurrences")
    //         .where("NameUsageID", "==", "Ljs5iDe")
    //         .where("GeoFeatureSet.GeoPoint", ">", bounds[0])
    //         .where("GeoFeatureSet.GeoPoint", "<", bounds[1]).get();
    //
    // res.forEach(snap => {
    //     console.log(snap.get("GeoFeatureSet.GeoPoint"));
    // })
  },
  20000
);
