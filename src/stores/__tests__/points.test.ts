/**
 * @jest-environment floracast-jest-environment-jsdom
 */
import '@firebase/firestore';
import {} from 'jest';
import { when } from 'mobx';
import * as uuid from 'uuid';
import { getCoordinateStore } from '../coordinates';
import { getDateStore } from '../date';
import { getMapPointStore } from '../points';
import { getTaxaStore } from '../taxa';
import { getViewStore, PointType } from '../view';

it(
  'instantiates, parses and renders correct date',
  async () => {
    const namespace = uuid.v4().substr(0, 5);

    const coordStore = getCoordinateStore(namespace);

    await when(() => coordStore.IsReady === true);

    const dateStore = getDateStore(namespace);

    const viewStore = getViewStore(namespace);
    const taxaStore = getTaxaStore(namespace);
    taxaStore.Select('Io1ftGL');
    viewStore.SetPointType(PointType.Occurrences);

    dateStore.FromFormattedString('20170421');

    coordStore.SetZoom(8);

    const pointStore = getMapPointStore(namespace);

    await when(() => pointStore.Points.length > 0);
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
