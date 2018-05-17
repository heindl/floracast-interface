/* tslint:disable:no-var-requires max-classes-per-file */
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
const Papa = require('papaparse');
import supercluster, {Supercluster} from 'supercluster';
import MErrors from './errors';
import {getGlobalModel} from "./globals";
import {TileSize, ZoomMinimum} from "./location/map";
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
    static get global(): string {
        return "MMapPoints";
    }

    @observable
    public IsLoading: boolean = false;

    // protected geoindex: _.Dictionary<kdbush.KDBush<TJSONResponsePoint>> = {};
    protected geoindex: _.Dictionary<Supercluster> = {};

  protected readonly namespace: string;
    protected readonly pointType: PointType;

    // protected UnsubscribeDateLocationReaction: IReactionDisposer;
    protected UnsubscribeFetchJSONReaction: IReactionDisposer;

    constructor(namespace: string, pointType: PointType) {

        this.namespace = namespace;
        this.pointType = pointType;
        // const coordinateStore = getGlobalModel(namespace, MLocationMapCoordinates);
        // const dateStore: MTime = getGlobalModel(namespace, MTime);
        const taxaStore = getGlobalModel(namespace, MMapTaxa);

        this.UnsubscribeFetchJSONReaction = reaction(
            () => taxaStore.Selected ? taxaStore.Selected.NameUsageID: undefined,
            (nameUsageId?: string) => {this.fetchJSON(nameUsageId)},
            {
                fireImmediately: true,
                name: `${pointType} PointStore JSON Fetch`
            }
        );

    }

    public GetAggregation(bbox: [number, number, number, number], zoom: number, date: string): [number, number] {

        if (zoom === 0 || date.trim() === '') {
            return [0, 0]
        }

        const forOccurrences = this.pointType === PointType.Occurrences;

        if (!(this.geoindex.hasOwnProperty(date))) {
            return [0, 0]
        }

        const points = this.geoindex[date].getClusters(bbox, zoom);

        const pointCount = forOccurrences ?
            points.length :
            _.sumBy(
                points,
                (p: GeoJSON.Feature<GeoJSON.Point>) => {
                    if (!p.properties) {
                        return 0
                    }
                    return p.properties.point_count || 1
                });
        const predictionSum = forOccurrences ?
            0 :
            _.sumBy(
                points,
                    (p: GeoJSON.Feature<GeoJSON.Point>) => {
                        if (!p.properties) {
                            return 0
                        }
                        return p.properties.predictionCount || 0
            });

        return [pointCount, predictionSum === 0 ? 0 : predictionSum / pointCount]

    }

    public GetPoints(bbox: [number, number, number, number], zoom: number, date: string): Array<GeoJSON.Feature<GeoJSON.Point>> {

        if (zoom === 0 || date.trim() === '') {
            return []
        }

        if (!(this.geoindex.hasOwnProperty(date))) {
            return []
        }

        return this.geoindex[date].getClusters(bbox, zoom);

        // return points.map((p: GeoJSON.Feature<GeoJSON.Point>) => {
        //
        //     if (!p.properties) {
        //         throw Error(`Missing Properties`)
        //     }
        //
        //     const lat = p.geometry.coordinates[1];
        //     const lng = p.geometry.coordinates[0];
        //
        //     return {
        //         date,
        //         id: p.properties.id || S2Cell.fromLatLng(S2LatLng.fromDegrees(lat, lng)).id.parentL(16).toToken(),
        //         latitude: lat,
        //         longitude: lng,
        //         pointType: this.pointType,
        //         prediction: ((p.properties.predictionCount || 0) / (p.properties.point_count || 1)),
        //     }
        // })
    }

    protected dispose() {
        // this.UnsubscribeDateLocationReaction();
        this.UnsubscribeFetchJSONReaction();
    };

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

        const mErrors = getGlobalModel(this.namespace, MErrors);

        Papa.parse(
            `https://floracast-map-data.storage.googleapis.com/${this.pointType.toLowerCase()}/${nameUsageId}.csv`,
            {
            complete: (parseResults?: {data: TJSONResponsePoint[], errors?: Papa.ParseError[]}) => {


                if (!parseResults) {
                    this.geoindex = {};
                    this.setLoading(false);
                    return
                }

                if (parseResults.errors && parseResults.errors.length > 0) {
                    parseResults.errors.forEach((err) => {
                        mErrors.Report(
                            err,
                            {'PointType': this.pointType, 'NameUsageId': nameUsageId},
                            `Could not parse csv line`);
                    });
                    this.geoindex = {};
                    this.setLoading(false);
                    return
                }

                this.geoindex = _.chain(parseResults.data)
                    .groupBy((p) => p[0].toString())
                    .mapValues((pts, d) => {
                        return generateSuperCluster(pts, this.pointType)
                    })
                    .value();

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
            skipEmptyLines: true,
            worker: true,
        });

    }
}

export class MMapOccurrences extends MMapPoints {
    static get global(): string {
        return "MMapOccurrences";
    }
    constructor(namespace: string) {
        super(namespace, PointType.Occurrences)
    }
}

export class MMapPredictions extends MMapPoints {
    static get global(): string {
        return "MMapPredictions";
    }
    constructor(namespace: string) {
        super(namespace, PointType.Predictions)
    }
}

interface IGeoJSONFeatureProperties{
    occurrenceId?: string;
    // pointType: PointType;
    predictionCount?: number;
    date?: string;
    point_count?: number; // Built into SuperCluster.
    cluster_id?: number;
}

function generateSuperCluster(data: TJSONResponsePoint[], pointType: PointType): Supercluster {
    const forOccurrences = pointType === PointType.Occurrences;

    const mapper = (properties: IGeoJSONFeatureProperties ) => {

        const p: IGeoJSONFeatureProperties = {};

        if (forOccurrences) {
            p.occurrenceId = properties.occurrenceId;
            p.date = properties.date;
        } else {
            p.predictionCount = properties.predictionCount;
        }

        return p

    };

    const reducer = forOccurrences ? undefined : (accumulated: IGeoJSONFeatureProperties, props: IGeoJSONFeatureProperties) => {
        accumulated.predictionCount = (accumulated.predictionCount || 0) + (props.predictionCount || 0);
        return accumulated
    };

    const sc = supercluster({
        extent: TileSize,
        map: mapper,
        maxZoom: 8,
        minZoom: ZoomMinimum,
        radius: 20,
        reduce: reducer,
    });
    sc.load(data.map((a: TJSONResponsePoint) => {

        const properties: IGeoJSONFeatureProperties = {
            date: forOccurrences ? a[0].toString() : undefined,
            occurrenceId: forOccurrences && a.length === 5 ? a[4] : undefined,
            predictionCount: forOccurrences ? undefined : a[3],
            // Note that generating the s2token here is very slow.
        };

        const v: GeoJSON.Feature<GeoJSON.Point> = {
            geometry: {
                coordinates: [a[2], a[1]],
                type: 'Point',
            },
            properties,
            type: 'Feature'
        };
        return v
    }));
    return sc;
}