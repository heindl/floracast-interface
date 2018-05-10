// import * as firestore from "@firebase/firestore";
// import * as GeoJSON from "geojson";
// import * as _ from 'lodash';
// import * as moment from "moment";
// import {S2CellId} from "nodes2ts";
// import supercluster, {Supercluster} from "supercluster";
// import {PointType} from "../stores/view";
//
// interface PointProps{
//     id: string;
//     pointType: string;
//     predictionCount: number;
//     point_count: number; // Built into SuperCluster.
// }
//
//
//
// class DateIndexedPointClusters {
//     protected pointType: PointType;
//     protected data: {[key: string]: Supercluster | Array<GeoJSON.Feature<GeoJSON.Point>>};
//
//     public get(): Supercluster {
//
//     }
//
//     protected merge = (gj: GeoJSON.Feature<GeoJSON.Point>, date: string) => {
//         const a: Array<GeoJSON.Feature<GeoJSON.Point>> = this.data.get(date) || [];
//         a.push(gj);
//         this.data.set(date, a);
//     };
// }
//
// class Aggregator {
//
//     protected pointType: PointType;
//
//     public data: Map<string, Array<GeoJSON.Feature<GeoJSON.Point>>> = new Map();
//
//     protected merge = (gj: GeoJSON.Feature<GeoJSON.Point>, date: string) => {
//         const a: Array<GeoJSON.Feature<GeoJSON.Point>> = this.data.get(date) || [];
//         a.push(gj);
//         this.data.set(date, a);
//     };
//
//     constructor(pointType: PointType) {
//         this.pointType = pointType;
//     }
//
//     public MergeOccurrenceDocument = (snap: firestore.DocumentSnapshot) => {
//         const coords = snap.get('GeoFeatureSet.GeoPoint');
//         const date = snap.get('FormattedDate');
//         this.merge({
//             geometry: {
//                 coordinates: [coords.longitude, coords.latitude],
//                 type: "Point",
//             },
//             properties: {
//                 id: snap.id,
//             },
//             type: "Feature"
//         }, `2017${date.substr(4, 2)}01`)
//     };
//
//     public MergePredictionDocument = (snap: firestore.DocumentSnapshot) => {
//
//         const token = snap.id.split('-')[1];
//         const ll = S2CellId.fromToken(token).toLatLng();
//
//         const timeline: {[date: string]: {Ω: number}} = snap.get(`Timeline`);
//
//         _.each(timeline, (tl, date) => {
//
//             if (moment(date, "YYYYMMDD").isoWeekday() !== 2) {
//                 return
//             }
//
//             return this.merge({
//                 geometry: {
//                     coordinates: [ll.lngDegrees.toNumber(), ll.latDegrees.toNumber()],
//                     type: 'Point',
//                 },
//                 properties: {
//                     id: token,
//                     predictionCount: tl.Ω,
//                 },
//                 type: 'Feature'
//             }, date)
//         });
//     };
//
//     public GenerateClusters = (): DateIndexedPointClusters => {
//
//         const forOccurrences = this.pointType === PointType.Occurrences;
//
//         const mapper = forOccurrences ? undefined : (properties: PointProps ) => ({
//             id: properties.id,
//             predictionCount: properties.predictionCount
//         });
//
//         const reducer = forOccurrences ? undefined : (accumulated: PointProps, props: PointProps) => {
//             accumulated.predictionCount = (accumulated.predictionCount || 0) + (props.predictionCount || 0);
//             return accumulated
//         };
//
//         const res = new Map<string, Supercluster>();
//         this.data.forEach((v, k) => {
//             const index = supercluster({
//                 extent: 256,
//                 initial: () => ({pointType: this.pointType}),
//                 map: mapper,
//                 minZoom: 6,
//                 radius: forOccurrences ? 1 : 128,
//                 reduce: reducer,
//             });
//             index.load(v);
//             res.set(k, index)
//         });
//         return res
//     }
//
// }
//
// export function FetchPredictionClusters(
//     fireStoreRef: firestore.FirebaseFirestore,
//     nameUsageId: string,
// ) {
//     return new Promise((resResolve, resReject) => {
//
//         fireStoreRef
//             .collection(`PredictionIndex`)
//             .where('NameUsageID', '==', nameUsageId)
//             .get()
//             .then((snapshots) => {
//                 const aggr = new Aggregator(PointType.Predictions);
//                 snapshots.forEach((snap) => {
//                     aggr.MergePredictionDocument(snap)
//                 });
//                 resResolve(aggr.GenerateClusters())
//             }).catch(resReject)
//     })
// }
//
// export function FetchOccurrenceClusters(
//     fireStoreRef: firestore.FirebaseFirestore,
//     nameUsageId: string,
// ) {
//     return new Promise((resResolve, resReject) => {
//
//         fireStoreRef
//             .collection(`Occurrences`)
//             .where('NameUsageID', '==', nameUsageId)
//             .get()
//             .then((snapshots) => {
//                 const aggr = new Aggregator(PointType.Occurrences);
//                 snapshots.forEach((snap) => {
//                     aggr.MergeOccurrenceDocument(snap)
//                 });
//                 resResolve(aggr.GenerateClusters())
//             }).catch(resReject)
//     })
// }