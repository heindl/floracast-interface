/* tslint:disable:max-classes-per-file */

import * as geokdbush from 'geokdbush';
import * as kdbush from 'kdbush';
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {S2Cell, S2LatLng} from "nodes2ts";
import * as Papa from 'papaparse';
import {MTime} from './date';
import MErrors from './errors';
import {getFirebaseStorageRef} from './firestore';
import {getGlobalModel} from "./globals";
import MLocationMapCoordinates from "./location/map";
import {MMapTaxa} from './taxa';
import {PointType} from './view';

/* Date, Latitude, Longitude, Prediction, ID */
type TJSONResponsePoint = [number, number, number, number] | [number, number, number, number, string]

export interface IMapPoint{
    id: string;
    pointType: PointType;
    prediction?: number;
    date?: string;
    latitude: number;
    longitude: number;
}

class MMapPoints {

    @observable
    public MapPoints = observable.array<IMapPoint>();

    @observable
    public IsLoading: boolean = false;

    protected geoindex: kdbush.KDBush<TJSONResponsePoint> = kdbush([], (a) => a[2], (a) => a[1]);

  protected readonly namespace: string;
    protected readonly pointType: PointType;

    protected UnsubscribeDateLocationReaction: IReactionDisposer;
    protected UnsubscribeFetchJSONReaction: IReactionDisposer;

    constructor(namespace: string, pointType: PointType) {

        this.namespace = namespace;
        this.pointType = pointType;
        const coordinateStore = getGlobalModel(namespace, MLocationMapCoordinates);
        const dateStore = getGlobalModel(namespace, MTime);
        const taxaStore = getGlobalModel(namespace, MMapTaxa);

        this.UnsubscribeFetchJSONReaction = reaction(
            () => taxaStore.Selected ? taxaStore.Selected.NameUsageID: undefined,
            (nameUsageId?: string) => {this.fetchJSON(nameUsageId)},
            {
                fireImmediately: true,
                name: `${pointType} PointStore JSON Fetch`
            }
        );

        this.UnsubscribeDateLocationReaction = reaction(
            () => {
                return {
                        date: dateStore.DateString,
                        isLoading: this.IsLoading, // Add to kick off each time new data has completed loading.
                        latitude: coordinateStore.Latitude,
                        longitude: coordinateStore.Longitude,
                        radius: coordinateStore.Radius,
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
        isLoading: boolean;
        latitude: number;
        longitude: number;
        radius: number;
        date: string;
    }) {
        const go = !_.isNil(i)
            && this.geoindex.points.length > 0
            && !i.isLoading
            && i.latitude !== 0
            && i.longitude !== 0
            && i.radius !== 0
            && i.date !== '';

        if (!i || !go) {
            this.MapPoints.clear();
            return
        }

        const dateInt = parseInt(i.date, 10);

        this.MapPoints.replace(
            _.map<TJSONResponsePoint, IMapPoint>(
                geokdbush.around(
                    this.geoindex,
                    i.longitude,
                    i.latitude,
                    undefined,
                    i.radius,
                    (a: TJSONResponsePoint) => {
                        return a[0] === dateInt
                    }
                ),
                (a) => ({
                    date: this.pointType === PointType.Predictions ? undefined : a[0].toString(),
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

        this.setLoading(true);

        if (!nameUsageId || nameUsageId === '') {
            this.geoindex = kdbush([], (a) => a[2], (a) => a[1]);
            this.setLoading(false);
            return
        }



        getFirebaseStorageRef(this.namespace).ref(`${this.pointType.toLowerCase()}/${nameUsageId}.csv`).getDownloadURL().then((url) => {
            const res: TJSONResponsePoint[] = [];
            const mErrors = getGlobalModel(this.namespace, MErrors);
            Papa.parse(url, {
                complete: () => {
                    this.geoindex = kdbush<TJSONResponsePoint>(
                        res,
                        (a) => a[2],
                        (a) => a[1]
                    );
                    this.setLoading(false);
                },
                delimiter: ",",
                download: true,
                dynamicTyping: true,
                error: (err) => {
                    mErrors.Report(
                        err,
                        {'PointType': this.pointType, 'NameUsageId': nameUsageId},
                        `Could not parse CSV file`
                    );
                    this.geoindex = kdbush([], (a) => a[2], (a) => a[1]);
                    this.setLoading(false)
                },
                fastMode: true,
                header: false,
                step: (row, parser) => {
                    res.push(row.data[0] as TJSONResponsePoint);
                    if (row.errors.length > 0) {
                        row.errors.forEach((err) => {
                            mErrors.Report(
                                err,
                                {'PointType': this.pointType, 'NameUsageId': nameUsageId},
                                `Could not parse csv line`);
                        });
                        parser.abort()
                    }
                },
                worker: true,
            });
        })

    }


}

export class MMapOccurrences extends MMapPoints {
    constructor(namespace: string) {
        super(namespace, PointType.Occurrences)
    }
}

export class MMapPredictions extends MMapPoints {
    constructor(namespace: string) {
        super(namespace, PointType.Predictions)
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