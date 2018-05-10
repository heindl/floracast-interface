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

class AreaCache {
  protected readonly centre: [number, number];
  protected readonly distanceCache: Map<string, number> = new Map();
  protected readonly sqKmCache: Map<string, number> = new Map();

  constructor(centre: [number, number]) {
    this.centre = centre;
  }

  public GetDistance = (token: string): number => {
    let distance = this.distanceCache.get(token);
    if (distance && distance !== 0) {
      return distance;
    }

    const coords = S2CellId.fromToken(token).toLatLng();
    const lat = coords.latDegrees.toNumber();
    const lng = coords.lngDegrees.toNumber();

    distance = haversine([lat, lng], this.centre, {
      format: '[lat,lon]',
      unit: 'km',
    });

    this.distanceCache.set(token, distance);
    return distance;
  };

  public GetSquareKilometer = (
    token: string,
    doc: DocumentSnapshot
  ): number => {
    let km = this.sqKmCache.get(token) || 0;
    if (km && km !== 0) {
      return km;
    }
    km = doc.get('AreaKilometers') || 0;
    this.sqKmCache.set(token, km);
    return km;
  };
}

export interface IPredictionResponse {
  nameUsageId: string;
  areaToken: string;
  sortValue: number;
  prediction: number;
  distance: number;
    sqKm: number;
}

export function FetchPredictionTaxa(
  fireStoreRef: FirebaseFirestore,
  cellIds: S2CellId[],
  centre: [number, number], // Latitude, Longitude
  date: string
) {
  return new Promise<IPredictionResponse[]>((resResolve, resReject) => {
    const areaCache = new AreaCache(centre);
    Promise.all(
      cellIds.map((cellId) => {
        return new Promise((resolve, reject) => {
          return fireStoreRef
            .collection('PredictionIndex')
            .where(`S2Tokens.${cellId.level()}`, '==', cellId.toToken())
            .where(`Timeline.${date}.𝝨`, '==', true)
            .get()
            .then((snapshots) => {
              const initial: IPredictionResponse[] = snapshots.docs.map((doc) => {
                const [nameUsageId, areaToken] = doc.id.split('-');
                const distance = areaCache.GetDistance(areaToken);
                const sqKm = areaCache.GetSquareKilometer(areaToken, doc);
                const prediction = doc.get(`Timeline.${date}.Ω`) || 0;
                return {
                  areaToken,
                    distance,
                  nameUsageId,
                  prediction,
                  sortValue: prediction * 50 + sqKm * 0.01 - distance * 0.5,
                    sqKm,
                };
              });
              const ordered = _.orderBy(
                initial,
                ['sortValue', 'areaToken', 'nameUsageId'],
                ['desc', 'asc', 'asc']
              );
              const res = _.uniqBy(ordered, (r) => r.nameUsageId);
              resolve(res);
            })
            .catch(reject);
        });
      })
    )
      .then((list: IPredictionResponse[][]) => {
        let res = _.flatten(list);
        res = _.orderBy(
          res,
          ['sortValue', 'areaToken', 'nameUsageId'],
          ['desc', 'asc', 'asc']
        );
        res = _.uniqBy(res, (r) => r.nameUsageId);
        resResolve(res);
      })
      .catch(resReject);
  });
}
