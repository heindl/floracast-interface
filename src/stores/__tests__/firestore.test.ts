/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import * as firebase from 'firebase';
import {} from 'jest';
import * as uuid from 'uuid';
import { getFireStoreRef } from '../firestore';

it('confirms firestore is fetching data', () => {
  const namespace = uuid.v4().substr(0, 5);
  const fireStore = getFireStoreRef(namespace);

  const q = fireStore
    .collection('Occurrences')
    .where(
      'GeoFeatureSet.GeoPoint',
      '>',
      new firebase.firestore.GeoPoint(25.99754991, -97.55859375)
    )
    .where(
      'GeoFeatureSet.GeoPoint',
      '<',
      new firebase.firestore.GeoPoint(40.6139524, -71.19140625)
    );

  q
    .get()
    .then((snapshot) => {
      expect(snapshot.size).toEqual(52);
    })
    .catch((error) => {
      throw error;
    });
});
