import {FirebaseStorage} from "@firebase/storage-types";
import * as geokdbush from 'geokdbush';
import * as kdbush from 'kdbush';
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {S2Cell, S2LatLng} from "nodes2ts";
import {DateStore, getDateStore} from './date';
import {ErrorStore, getErrorStore} from './errors';
import {getFirebaseStorageRef} from './firestore';
import {TaxaStore} from './taxa';
import {PointType} from './view';

/* Date, Latitude, Longitude, Prediction, ID */
type TJSONResponsePoint = [string, number, number, number] | [string, number, number, number, string]

export interface IMapPoint{
    id: string;
    pointType: PointType;
    prediction?: number;
    date?: string;
    latitude: number;
    longitude: number;
}

export class PointStore {

    @observable
    public MapPoints = observable.array<IMapPoint>();

    @observable
    public IsLoading: boolean = false;

    protected geoindex: kdbush.KDBush<TJSONResponsePoint> = kdbush([], (a) => a[2], (a) => a[1]);

  protected readonly namespace: string;
    protected readonly pointType: PointType;

  protected coordinateStore: CoordinateStore;
  protected dateStore: DateStore;
  protected firebaseStorageRef: FirebaseStorage;
  protected errorStore: ErrorStore;
  protected taxaStore: TaxaStore;

    protected UnsubscribeDateLocationReaction: IReactionDisposer;
    protected UnsubscribeFetchJSONReaction: IReactionDisposer;

    constructor(namespace: string, pointType: PointType) {

        this.namespace = namespace;
        this.pointType = pointType;
        this.coordinateStore = getCoordinateStore(namespace);
        this.dateStore = getDateStore(namespace);
        this.firebaseStorageRef = getFirebaseStorageRef(namespace);
        this.errorStore = getErrorStore(namespace);
        this.taxaStore = getTaxaStore(namespace);

        this.UnsubscribeFetchJSONReaction = reaction(
            () => this.taxaStore.Selected ? this.taxaStore.Selected.NameUsageID: undefined,
            (nameUsageId?: string) => {this.fetchJSON(nameUsageId)},
            {
                fireImmediately: false,
                name: `${pointType} PointStore JSON Fetch`
            }
        );

        this.UnsubscribeDateLocationReaction = reaction(
            () => {
                return {
                        date: this.dateStore.DateString,
                        latitude: this.coordinateStore.Latitude,
                        longitude: this.coordinateStore.Longitude,
                        radius: this.coordinateStore.Radius,
                    }

                },
                (i) => this.setMapPoints(i),
                {
                    fireImmediately: false,
                    name: `${pointType} Date Location Reaction`
                },
        )

    }

    protected dispose() {
        this.UnsubscribeDateLocationReaction();
        this.UnsubscribeFetchJSONReaction();
    };


    @action
    protected setMapPoints(i?: {
        latitude: number;
        longitude: number;
        radius: number;
        date: string;
    }) {
        console.log("Setting Map Points", i)
        const go = !_.isNil(i)
            && this.geoindex.points.length > 0
            && !_.isEmpty(i.latitude)
            && !_.isEmpty(i.longitude)
            && !_.isEmpty(i.radius)
            && !_.isEmpty(i.date);

        if (!i || !go) {
            this.MapPoints.clear();
            return
        }
        this.MapPoints.replace(
            _.map<TJSONResponsePoint, IMapPoint>(
                _.filter(
                    geokdbush.around(this.geoindex, i.longitude, i.latitude, i.radius),
                    (a) => a[0] === i.date,
                ),
                (a) => ({
                    date: this.pointType === PointType.Predictions ? undefined : a[0],
                    id: a.length === 5 ? a[4] : S2Cell.fromLatLng(S2LatLng.fromDegrees(a[1], a[2]).normalized()).id.toToken(),
                    latitude: a[1],
                    longitude: a[2],
                    pointType: this.pointType,
                    prediction: this.pointType === PointType.Predictions ? a[3] : undefined,
                })
            )
        )
    }


    @action
    protected setLoading(b: boolean) {
        this.IsLoading = b;
    }

    protected fetchJSON(nameUsageId?: string) {

        console.log("Fetching JSON", nameUsageId)

        if (this.pointType === PointType.Occurrences) {
            return
        }

        if (!nameUsageId || nameUsageId === '') {
            this.geoindex = kdbush([], (a) => a[2], (a) => a[1]);
            this.setMapPoints();
            return
        }

        this.setLoading(true);

        this.firebaseStorageRef.ref(`${this.pointType.toLowerCase()}/${nameUsageId}.json`).getDownloadURL().then((url) => {

            fetch(url)
                .then((res) => {
                    return res.json();
                })
                .then((jsonResponse: TJSONResponsePoint[]) => {
                    console.log("HAVE JSON RESPONSE")
                    this.geoindex = kdbush<TJSONResponsePoint>(
                        jsonResponse,
                        (a) => a[2],
                        (a) => a[1]
                    );
                    console.log("Index Created")
                    this.setLoading(false);
                    this.setMapPoints({
                        date: this.dateStore.DateString,
                        latitude: this.coordinateStore.Latitude,
                        longitude: this.coordinateStore.Longitude,
                        radius: this.coordinateStore.Radius,
                    })
                }).catch((err) => {
                    this.errorStore.Report(err);
                    this.setLoading(false)
                })
        })

    }


}

// interface IGeoJSONFeatureProperties{
//     id?: string;
//     pointType: PointType;
//     predictionCount?: number;
//     date?: string;
//     point_count?: number; // Built into SuperCluster.
// }
//
// function generateSuperCluster(data: StorageDataPoint[], pointType: PointType): Supercluster {
//     const forOccurrences = pointType === PointType.Occurrences;
//
//     const mapper = (properties: IGeoJSONFeatureProperties ) => {
//
//         const p: IGeoJSONFeatureProperties = {
//             id: properties.id,
//             pointType: forOccurrences ? PointType.Occurrences : PointType.Predictions
//         };
//
//         if (forOccurrences) {
//             p.date = properties.date;
//         } else {
//             p.predictionCount = properties.predictionCount;
//         }
//
//         return p
//
//     };
//
//     const reducer = forOccurrences ? undefined : (accumulated: IGeoJSONFeatureProperties, props: IGeoJSONFeatureProperties) => {
//         accumulated.predictionCount = (accumulated.predictionCount || 0) + (props.predictionCount || 0);
//         return accumulated
//     };
//
//     const sc = supercluster({
//         extent: 256,
//         initial: () => ({pointType}),
//         map: mapper,
//         minZoom: 6,
//         radius: forOccurrences ? 1 : 128,
//         reduce: reducer,
//     });
//     sc.load(data.map((a: StorageDataPoint) => {
//         const ll = S2CellId.fromToken(a[0]).toLatLng();
//
//         const properties: IGeoJSONFeatureProperties = {
//             id: a[0],
//             pointType: forOccurrences ? PointType.Occurrences : PointType.Predictions
//         };
//
//         if (a.length === 2) {
//             properties.predictionCount = a[1]
//         }
//
//         if (a.length === 3) {
//             properties.id = a[2];
//             properties.date = a[1];
//         }
//
//         const v: GeoJSON.Feature<GeoJSON.Point> = {
//             geometry: {
//                 coordinates: [ll.lngDegrees.toNumber(), ll.latDegrees.toNumber()],
//                 type: 'Point',
//             },
//             properties,
//             type: 'Feature'
//         };
//         return v
//     }));
//     return sc;
// }

const namespaces: Map<string, PointStore> = new Map();

export function getPointStore(namespace: string, pointType: PointType): PointStore {
    const key = `${namespace}|${pointType}`;
  let store = namespaces.get(key);
  if (!store) {
    store = new PointStore(namespace, pointType);
    namespaces.set(key, store);
  }
  return store;
}
