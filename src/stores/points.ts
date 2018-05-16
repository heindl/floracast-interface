/* tslint:disable:no-var-requires max-classes-per-file */
import * as geokdbush from 'geokdbush';
import * as kdbush from 'kdbush';
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {S2Cell, S2LatLng} from "nodes2ts";
const Papa = require('papaparse');
import {MTime} from './date';
import MErrors from './errors';
import {getGlobalModel} from "./globals";
import MLocationMapCoordinates from "./location/map";
import {MMapTaxa} from './taxa';
import {PointType} from './view';

// Papa.RemoteChunkSize = undefined; // Resolves an issue with header type.
Papa.SCRIPT_PATH = `${process.env.PUBLIC_URL}/papaparse.js`;

/* Date, Latitude, Longitude, Prediction, ID */
type TJSONResponsePoint = [number, number, number, number] | [number, number, number, number, string]

export interface IMapPoint{
    id: string;
    pointType: PointType;
    prediction?: number;
    date: string;
    latitude: number;
    longitude: number;
}

export class MMapPoints {

    @observable
    public MapPoints = observable.array<IMapPoint>([], {deep: false});

    @observable
    public IsLoading: boolean = false;

    protected geoindex: _.Dictionary<kdbush.KDBush<TJSONResponsePoint>> = {};

  protected readonly namespace: string;
    protected readonly pointType: PointType;

    protected UnsubscribeDateLocationReaction: IReactionDisposer;
    protected UnsubscribeFetchJSONReaction: IReactionDisposer;

    constructor(namespace: string, pointType: PointType) {

        this.namespace = namespace;
        this.pointType = pointType;
        const coordinateStore = getGlobalModel(namespace, MLocationMapCoordinates);
        const dateStore: MTime = getGlobalModel(namespace, MTime);
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
        );

    }

    public GetAggregation(latitude: number, longitude: number, radius: number, date: string): [number, number] {
        if (latitude === 0 || longitude === 0 || radius === 0 || date.trim() === '') {
            return [0, 0]
        }

        if (!(this.geoindex.hasOwnProperty(date))) {
            return [0, 0]
        }

        const filterByDate = (v: TJSONResponsePoint) => {
            if (date.length === 2) {
                // Assume to be month.
                return v[0].toString().substr(4, 2) === date;
            }
            return v[0].toString() === date;
        };

        const points = geokdbush.around(
            this.geoindex[date],
            longitude,
            latitude,
            undefined,
            radius,
            filterByDate,
        );
        const predMean = this.pointType === PointType.Predictions ?
            (_.sumBy<TJSONResponsePoint>(points, (p: TJSONResponsePoint) => p[3]) / points.length) :
            0;

        return [points.length, predMean]

    }

    public GetPoints(latitude: number, longitude: number, radius: number, date: string): IMapPoint[] {

        if (latitude === 0 || longitude === 0 || radius === 0 || date.trim() === '') {
            return []
        }

        if (!(this.geoindex.hasOwnProperty(date))) {
            return []
        }

        const filterByDate = (v: TJSONResponsePoint) => {
            if (date.length === 2) {
                // Assume to be month.
                return v[0].toString().substr(4, 2) === date;
            }
            return v[0].toString() === date;
        };

        return geokdbush.around(
            this.geoindex[date],
            longitude,
            latitude,
            undefined,
            radius,
            filterByDate,
        ).map((a: TJSONResponsePoint) => {
            return {
                date,
                id: a.length === 5 ? a[4] : S2Cell.fromLatLng(S2LatLng.fromDegrees(a[1], a[2]).normalized()).id.toToken(),
                latitude: a[1],
                longitude: a[2],
                pointType: this.pointType,
                prediction: this.pointType === PointType.Predictions ? a[3] : undefined,
            }
        })
    }

    protected dispose() {
        this.UnsubscribeDateLocationReaction();
        this.UnsubscribeFetchJSONReaction();
    };

    @action
    protected setMapPoints(i?: {
        date: string;
        isLoading: boolean;
        latitude: number;
        longitude: number;
        radius: number;
    }) {
        const go = !_.isNil(i)
            && this.geoindex.hasOwnProperty(i.date)
            && !i.isLoading
            && i.latitude !== 0
            && i.longitude !== 0
            && i.radius !== 0
            && i.date.length === 8;

        if (!i || !go) {
            this.MapPoints.clear();
            return
        }

        this.MapPoints.replace(this.GetPoints(i.latitude, i.longitude, i.radius, i.date));
    }


    @action
    protected setLoading(b: boolean) {
        this.IsLoading = b;
    }

    protected fetchJSON(nameUsageId?: string) {

        if (this.pointType === PointType.Occurrences) {
            return
        }

        this.setLoading(true);

        if (!nameUsageId || nameUsageId === '') {
            this.geoindex = {};
            this.setLoading(false);
            return
        }

        // getFirebaseStorageRef(this.namespace)
        //     .ref(`${this.pointType.toLowerCase()}/${nameUsageId}.csv`)
        //     .getDownloadURL()
        //     .then((url) => {


        const mErrors = getGlobalModel(this.namespace, MErrors);

        Papa.parse(
            `https://floracast-map-data.storage.googleapis.com/${this.pointType.toLowerCase()}/${nameUsageId}.csv`,
            {
            complete: (parseResults: {data: TJSONResponsePoint[], errors: Papa.ParseError[]}) => {

                if (parseResults.errors.length > 0) {
                    parseResults.errors.forEach((err) => {
                        mErrors.Report(
                            err,
                            {'PointType': this.pointType, 'NameUsageId': nameUsageId},
                            `Could not parse csv line`);
                    });
                    return
                }

                // this.geoindex = _.flow(
                //     _.groupBy(p => p[0].toString()),
                //     _.mapValues((pts) => kdbush<TJSONResponsePoint>(
                //             pts,
                //             (a: TJSONResponsePoint) => a[2],
                //             (a: TJSONResponsePoint) => a[1]
                //         )
                //     )(parseResults.data);

                this.geoindex = _.chain(parseResults.data)
                    .groupBy((p) => p[0].toString())
                    .mapValues((pts) => kdbush<TJSONResponsePoint>(
                            pts,
                            (a: TJSONResponsePoint) => a[2],
                            (a: TJSONResponsePoint) => a[1]
                    )).value();

                this.setLoading(false);
            },
            download: true,
            dynamicTyping: true,
            error: (err: Papa.ParseError) => {
                mErrors.Report(
                    err,
                    {'PointType': this.pointType, 'NameUsageId': nameUsageId},
                    `Could not parse CSV file`
                );
                this.geoindex = {};
                this.setLoading(false)
            },
            fastMode: true,
            header: false,
            // chunk: (parseResults: {data: TJSONResponsePoint[], errors: Papa.ParseError[]}, parser: Papa.Parser) => {
            //
            //     if (parseResults.errors.length > 0) {
            //         parseResults.errors.forEach((err) => {
            //             mErrors.Report(
            //                 err,
            //                 {'PointType': this.pointType, 'NameUsageId': nameUsageId},
            //                 `Could not parse csv line`);
            //         });
            //         parser.abort();
            //         return
            //     }
            //
            //     res.push(...parseResults.data.map((a: TJSONResponsePoint) => {
            //         return {
            //             date: a[0].toString(),
            //             id: a.length === 5 ? a[4] : S2Cell.fromLatLng(S2LatLng.fromDegrees(a[1], a[2]).normalized()).id.toToken(),
            //             latitude: a[1],
            //             longitude: a[2],
            //             pointType: this.pointType,
            //             prediction: this.pointType === PointType.Predictions ? a[3] : undefined,
            //         }
            //     }));
            //
            // },
            // withCredentials: true,
            worker: true,
        });

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