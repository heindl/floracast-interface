import {action, IReactionDisposer, observable, reaction} from 'mobx';
import supercluster, {Supercluster} from 'supercluster';
import {CoordinateStore, getCoordinateStore} from './coordinates';
import {DateStore, getDateStore} from './date';
import {ErrorStore, getErrorStore} from './errors';
import {getFirebaseStorageRef} from './firestore';

import {FirebaseStorage} from "@firebase/storage-types";
import * as GeoJSON from "geojson";
import * as _ from 'lodash';
import { S2CellId } from 'nodes2ts';
import {getTaxaStore, TaxaStore} from './taxa';
import Taxon from "./taxon";
import {PointType} from './view';


interface IPointProps{
    id: string;
    pointType: string;
    predictionCount: number;
    point_count: number; // Built into SuperCluster.
}

export class PointStore {

    @observable
    public Clusters?: {[key: string]: Supercluster};

    @observable
    public IsLoading: boolean = false;

    @observable
    public MapPoints: Array<GeoJSON.Feature<GeoJSON.Point>> = [];

  protected readonly namespace: string;
    protected readonly pointType: PointType;

  protected coordinateStore: CoordinateStore;
  protected dateStore: DateStore;
  protected firebaseStorageRef: FirebaseStorage;
  protected errorStore: ErrorStore;
  protected taxaStore: TaxaStore;

    protected UnsubscribePointReaction: IReactionDisposer;
    protected UnsubscribeFetchJSONReaction: IReactionDisposer;



    constructor(namespace: string, pointType: PointType) {

        this.namespace = namespace;
        this.coordinateStore = getCoordinateStore(namespace);
        this.dateStore = getDateStore(namespace);
        this.firebaseStorageRef = getFirebaseStorageRef(namespace);
        this.errorStore = getErrorStore(namespace);
        this.taxaStore = getTaxaStore(namespace);


        this.UnsubscribeFetchJSONReaction = reaction(
            () => this.taxaStore.Selected,
            (selected?: Taxon) => this.fetchJSON(selected ? selected.NameUsageID: undefined),
            {
                fireImmediately: true,
                name: `${pointType} JSON Fetch`
            }
        );

        this.UnsubscribePointReaction = reaction(
            () => ({
                bbox: this.coordinateStore.Bounds,
                date: this.dateStore.DateString,
                zoom: this.coordinateStore.Zoom,
            }),
            this.updatePoints,
            {
                fireImmediately: true,
                name: `${pointType} Point Reaction`
            }
        );

    }

    protected dispose() {
        this.UnsubscribeFetchJSONReaction();
        this.UnsubscribePointReaction();
    };

    @action
    protected setClusters(c?: {[key: string]: Supercluster}) {
        this.Clusters = c
    }

    @action
    protected setPoints(points: Array<GeoJSON.Feature<GeoJSON.Point>>) {
        this.MapPoints = points;
    }

    @action
    protected setLoading(b: boolean) {
        this.IsLoading = b;
    }

    protected updatePoints(o?: {
        date: string,
        bbox: [number, number, number, number],
        zoom: number,
    }) {
        if (!this.Clusters || !o) {
            return this.setPoints([])
        }
        this.setPoints(this.Clusters[o.date].getClusters(o.bbox, o.zoom))
    }

    protected fetchJSON(nameUsageId?: string) {

        if (!nameUsageId || nameUsageId === '') {
            return this.setClusters();
        }

        this.setLoading(true);

        this.firebaseStorageRef.ref(`/${this.pointType.toLowerCase()}/${nameUsageId}.json`).getDownloadURL().then((url) => {
            fetch(url)
                .then((res) => {
                    return res.json();
                })
                .then((jsonResponse) => {
                    this.setClusters(_.mapValues(jsonResponse, (data) => {
                        return generateSuperCluster(data, this.pointType)
                    }));
                    this.setLoading(false)
                }).catch((err) => {
                    this.errorStore.Report(err);
                    this.setLoading(false)
                })
        })

    }


}

function generateSuperCluster(data: Array<[string, number]>, pointType: PointType): Supercluster {
    const forOccurrences = pointType === PointType.Occurrences;

    const mapper = forOccurrences ? undefined : (properties: IPointProps ) => ({
        id: properties.id,
        predictionCount: properties.predictionCount
    });

    const reducer = forOccurrences ? undefined : (accumulated: IPointProps, props: IPointProps) => {
        accumulated.predictionCount = (accumulated.predictionCount || 0) + (props.predictionCount || 0);
        return accumulated
    };

    const sc = supercluster({
        extent: 256,
        initial: () => ({pointType}),
        map: mapper,
        minZoom: 6,
        radius: forOccurrences ? 1 : 128,
        reduce: reducer,
    });
    sc.load(data.map((a: [string, number]) => {
        const ll = S2CellId.fromToken(a[0]).toLatLng();
        const v: GeoJSON.Feature<GeoJSON.Point> = {
            geometry: {
                coordinates: [ll.lngDegrees.toNumber(), ll.latDegrees.toNumber()],
                type: 'Point',
            },
            properties: {
                id: a[0],
                predictionCount: a[1],
            },
            type: 'Feature'
        };
        return v
    }));
    return sc;
}

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
