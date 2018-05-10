// import * as firestore from "@firebase/firestore";
// import * as _ from 'lodash';
// import { S2CellId } from 'nodes2ts';
// import { PointType } from '../stores/view';
//
// export interface TimelineObject {
//   t: number;
//   Ω?: number;
// }
//
// class TimelineAggregator {
//   public readonly pointType: PointType;
//
//   public data: Map<string, TimelineObject> = new Map();
//
//   constructor(pointType: PointType) {
//     this.pointType = pointType;
//   }
//
//   protected merge = (obj: TimelineObject, k: string) => {
//     const current: TimelineObject = this.data.get(k) || { t: 0, Ω: 0 };
//     const total = current.t + 1;
//     this.data.set(k, {
//       t: total,
//       Ω: 1 / total * (obj.Ω || 0) + current.t / total * (current.Ω || 0),
//     });
//   };
//   public MergeTimeline = (aggr: TimelineAggregator) => {
//     aggr.data.forEach((v, k) => {
//       this.merge(v, k);
//     });
//     return this;
//   };
//
//   public MergeDocumentData = (data: { [field: string]: { Ω?: number } }) => {
//     _.each(data, this.merge);
//     return this;
//   };
// }
//
// export function FetchPredictionTimeline(
//   fireStoreRef: firestore.FirebaseFirestore,
//   cellIds: S2CellId[],
//   nameUsageId: string
// ) {
//   return new Promise<Map<string, TimelineObject>>((resResolve, resReject) => {
//     Promise.all(
//       cellIds.map((cellId) => {
//         return new Promise((resolve, reject) => {
//           fireStoreRef
//             .collection('PredictionIndex')
//             .where('NameUsageID', '==', nameUsageId)
//             .where(`S2Tokens.${cellId.level()}`, '==', cellId.toToken())
//             .get()
//             .then((snaps) => {
//               const aggr = new TimelineAggregator(PointType.Predictions);
//               snaps.forEach((snap) =>
//                 aggr.MergeDocumentData(snap.get('Timeline'))
//               );
//               resolve(aggr);
//             })
//             .catch(reject);
//         });
//       })
//     )
//       .then((list: TimelineAggregator[]) => {
//         const aggr = new TimelineAggregator(PointType.Predictions);
//         list.forEach(aggr.MergeTimeline);
//         resResolve(aggr.data);
//       })
//       .catch(resReject);
//   });
// }
//
// export function FetchOccurrenceTimeline(
//   fireStoreRef: firestore.FirebaseFirestore,
//   cellIds: S2CellId[],
//   nameUsageId: string
// ) {
//   return new Promise<Map<string, TimelineObject>>((resResolve, resReject) => {
//     Promise.all(
//       cellIds.map((cellId) => {
//         return new Promise((resolve, reject) => {
//           fireStoreRef
//             .collection('Occurrences')
//             .where('NameUsageID', '==', nameUsageId)
//             .where(
//               `GeoFeatureSet.S2Tokens.${cellId.level()}`,
//               '==',
//               cellId.toToken()
//             )
//             .get()
//             .then((snaps) => {
//               const res = new Map<string, number>();
//               snaps.forEach((s) => {
//                 const month = s.get('FormattedMonth');
//                 res.set(month, 1 + (res.get(month) || 0));
//               });
//               resolve(res);
//             })
//             .catch(reject);
//         });
//       })
//     )
//       .then((tmlns: Array<Map<string, number>>) => {
//         const res = new Map<string, TimelineObject>();
//         tmlns.forEach((tmln) => {
//           tmln.forEach((v: number, k: string) => {
//             const e = res.get(k) || { t: 0 };
//             res.set(k, { t: e.t + 1 });
//           });
//         });
//         resResolve(res);
//       })
//       .catch(resReject);
//   });
// }
