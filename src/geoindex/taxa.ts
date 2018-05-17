import {DocumentSnapshot, FirebaseFirestore} from "@firebase/firestore-types";
import * as haversine from 'haversine';
import * as _ from 'lodash';
import { S2CellId } from 'nodes2ts';

export function FetchOccurrenceTaxa(
  fireStoreRef: FirebaseFirestore,
  cellIds: S2CellId[],
  month: string
) {
  return new Promise<Array<[string, number]>>((resResolve, resReject) => {
    const aggr: { [key: string]: number } = {};
    Promise.all(
      cellIds.map((cellId) => {
        return new Promise((resolve, reject) => {
          return fireStoreRef
            .collection('Occurrences')
            .where(
              `GeoFeatureSet.S2Tokens.${cellId.level()}`,
              '==',
              cellId.toToken()
            )
            .where('FormattedMonth', '==', month)
            .get()
            .then((snapshots) => {
              snapshots.forEach((doc) => {
                aggr[doc.get('NameUsageID')] =
                  (aggr[doc.get('NameUsageID')] += 1) || 1;
              });
              resolve();
            })
            .catch(reject);
        });
      })
    )
      .then(() => {
        resResolve(_.sortBy(_.toPairs(aggr), (p) => p[1]));
      })
      .catch(resReject);
  });
}

// class AreaCache {
//   protected readonly centre: [number, number];
//   protected readonly distanceCache: Map<[number, number], number> = new Map();
//   protected readonly sqKmCache: Map<string, number> = new Map();
//
//   constructor(centre: [number, number]) {
//     this.centre = centre;
//   }
//
//   public GetDistance = (latlng: [number, number]): number => {
//     let distance = this.distanceCache.get(token);
//     if (distance && distance !== 0) {
//       return distance;
//     }
//
//     const coords = S2CellId.fromToken(token).toLatLng();
//     const lat = coords.latDegrees.toNumber();
//     const lng = coords.lngDegrees.toNumber();
//
//     distance = haversine([lat, lng], this.centre, {
//       format: '[lat,lon]',
//       unit: 'km',
//     });
//
//     this.distanceCache.set(token, distance);
//     return distance;
//   };
//
//   public GetSquareKilometer = (
//     token: string,
//     doc: DocumentSnapshot
//   ): number => {
//     let km = this.sqKmCache.get(token) || 0;
//     if (km && km !== 0) {
//       return km;
//     }
//     km = doc.get('AreaKilometers') || 0;
//     this.sqKmCache.set(token, km);
//     return km;
//   };
// }

export interface IPredictionResponse {
  nameUsageId: string;
  sortValue: number;
  prediction: number;
  distance: number;
  lat: number;
  lng: number;
    sqKm: number;
}

interface IFirestorePredictionResponse {
  [key: string]: ITaxaArrayDoc[]
}

interface ITaxaArrayDoc {
  Ω: number,
    lat: number,
    lng: number,
  km: number,
}

export function FetchPredictionTaxa(
  fireStoreRef: FirebaseFirestore,
  s2Tokens: string[],
  centre: [number, number], // Latitude, Longitude
  date: string
) {
  return new Promise<IPredictionResponse[]>((resResolve, resReject) => {
    // const areaCache = new AreaCache(centre);
    Promise.all(s2Tokens.map((token) => {
        return new Promise((resolve, reject) => {
          fireStoreRef
              .collection('PredictionIndex')
            .where(`Token`, '==', token)
            .where(`Date`, '==', date)
            .get()
            .then((snapshots) => {
              const res: IPredictionResponse[] = [];
              snapshots.docs.forEach((snap: DocumentSnapshot) => {

                   const taxa: IFirestorePredictionResponse = snap.get("Taxa");

                   _.each(taxa, (docs: ITaxaArrayDoc[], nameUsageId: string) => {
                       docs.forEach((doc: ITaxaArrayDoc) => {
                           const distance = haversine(
                               [doc.lat, doc.lng],
                               centre, {
                                   format: '[lat,lon]',
                                   unit: 'km',
                               }
                           );
                           res.push({
                               distance,
                               lat: doc.lat,
                               lng: doc.lng,
                               nameUsageId,
                               prediction: doc.Ω,
                               sortValue: doc.Ω * 50 + doc.km * 0.01 - distance * 0.5,
                               sqKm: doc.km
                           })
                       })
                   });
              });
              resolve(res);
            })
            .catch(reject);
        });
      })
    ).then((list: IPredictionResponse[][]) => {

        resResolve(
            _.uniqBy(
                _.orderBy(
                    _.flatten(_.compact(list)),
                    ['sortValue', 'nameUsageId'],
                    ['desc', 'asc']
                ),
                (r) => r.nameUsageId,
            )
        );
      })
      .catch(resReject);
  });
}
