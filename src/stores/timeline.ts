/* tslint:disable:max-classes-per-file */
import * as d3Scale from 'd3-scale';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import * as moment from 'moment';
import {MTime} from "./date";
import {getGlobalModel} from "./globals";
import MLocationMapCoordinates from "./location/map";
import {IMapPoint, MMapOccurrences, MMapPoints, MMapPredictions} from "./points";
import {PointType} from './view';

export interface ITickMark {
  moment: moment.Moment;
  predictionMean: number;
  scaledPredictionMean?: number;
  pointCount: number;
  scaledPointCount?: number;
  x: number;
  y: number;
  fill?: string;
}

const ColorScale: d3Scale.ScaleSequential<string> = d3Scale.scaleSequential(interpolateSpectral).domain([1,0]);

export function GetColor(v: number): string {
    return ColorScale(v)
}

interface IReactionData{
    isLoading: boolean,
    latitude: number,
    longitude: number,
    radius: number,
    viewPort: [number, number],
}

export class MMapTimeline {

    @observable
    public TickMarks = observable.array<ITickMark>([], {deep: false});

  protected readonly namespace: string;
  protected readonly pointType: PointType;

  // protected geoSpatialIndex?: IJSONRequestObject;

    protected UnsubscribeSetMarksReaction?: IReactionDisposer;

  constructor(namespace: string, pointType: PointType) {

      this.namespace = namespace;
      this.pointType = pointType;

        const mPoints: MMapPoints =
            pointType === PointType.Predictions ?
            getGlobalModel(namespace, MMapPredictions) :
            getGlobalModel(namespace, MMapOccurrences);

        const coordStore: MLocationMapCoordinates = getGlobalModel(namespace, MLocationMapCoordinates);

      this.UnsubscribeSetMarksReaction = reaction(
          () => ({
              isLoading: mPoints.IsLoading, // Assume that
              latitude: coordStore.Latitude,
              longitude: coordStore.Longitude,
              radius: coordStore.Radius,
              viewPort: coordStore.ViewPort,
          }),
          (o) => this.setMarks(o),
                  {
                      fireImmediately: false,
                      name: `${pointType} Set Marks`
                  }
      );
  }

  @action
  protected setMarks(i: IReactionData) {
      if (i.isLoading) {
          this.TickMarks.replace([]);
          return
      }
      this.TickMarks.replace(this.scaledMarks(i.latitude, i.longitude, i.radius, i.viewPort))
  }

  protected scale(viewPort: [number, number]): d3Scale.ScaleTime<number, number> {

        // const x_padding = 35;
        const xPadding = 10;

        const dimensions: ReadonlyArray<number> = [
            xPadding,
            viewPort[0] - (xPadding + 5),
        ];

        return d3Scale
            .scaleTime()
            .domain([new Date(2017, 0, 1), new Date(2017, 11, 31)])
            .range(dimensions);
    }


    protected dates(): moment.Moment[] {

        if (this.pointType === PointType.Occurrences) {
            return [
                moment("20170106"),
                moment("20170203"),
                moment("20170303"),
                moment("20170407"),
                moment("20170505"),
                moment("20170602"),
                moment("20170707"),
                moment("20170804"),
                moment("20170901"),
                moment("20171006"),
                moment("20171103"),
                moment("20171201"),
            ];
        }

        const range = getGlobalModel(this.namespace, MTime).PredictionDateRange;

        const start = range[0];
        const end = range[1];

        const tmp = start.clone();
        const res: moment.Moment[] = [];

        while( tmp.isBefore(end) ){
            tmp.add(7, 'days');
            res.push(tmp.clone());
        }

        // res.push(end);

        return res

    }

    protected marks(latitude: number, longitude: number, radius: number, viewPort: [number, number]): ITickMark[] {

        const mPredictions: MMapPoints = getGlobalModel(this.namespace, MMapPredictions);
        const scale = this.scale(viewPort);
        const fmt = this.pointType === PointType.Occurrences ? 'MM' : 'YYYYMMDD';

        return this.dates().map((m: moment.Moment) => {
            const points = mPredictions.GetPoints(latitude, longitude, radius, m.format(fmt));
            const predictionTotal = _.sumBy<IMapPoint>(points, (p: IMapPoint) => p.prediction || 0);

            const mark: ITickMark = {
                moment: m,
                pointCount: points.length,
                predictionMean: predictionTotal > 0 ?  predictionTotal / points.length : 0,
                x: scale(m.clone().set('year', 2017).toDate()),
                y: 0,
            };

            if (this.pointType === PointType.Occurrences && mark.pointCount > 0) {
                mark.predictionMean = 0.65;
            }

            return mark
        })



    }

    protected scaledMarks(latitude: number, longitude: number, radius: number, viewPort: [number, number]): ITickMark[] {
      const marks = this.marks(latitude, longitude, radius, viewPort);

        // TODO: For this to be correct, would be much better to get an initial max of all days everywhere.
        // As it is, the numbers will get larger as you zoom.
        const predictionMeanMax = _.maxBy<ITickMark>(marks, (m) => m.predictionMean) || {predictionMean: 0};
        const pointCountMax = _.maxBy<ITickMark>(marks, (m) => m.pointCount) || {pointCount: 0};

        return marks.map((mark) => {
            mark.scaledPredictionMean =
                this.pointType === PointType.Predictions
                    ? minMaxScale(mark.predictionMean, predictionMeanMax.predictionMean, 0)
                    : mark.predictionMean;

            mark.scaledPointCount = minMaxScale(
                mark.pointCount,
                pointCountMax.pointCount,
                0
            );

            mark.fill = ColorScale(mark.scaledPredictionMean);

            return mark;
        });

    }

}

function minMaxScale(v: number, globalMax: number, globalMin: number): number {
  // Scale Count
  const scaleMin = 0;
  const scaleMax = 1;
  const std = (v - globalMin) / (globalMax - globalMin);
  return std * (scaleMax - scaleMin) + scaleMin;
}

export class MMapPredictionTimeline extends MMapTimeline {
    constructor(namespace: string) {
        super(namespace, PointType.Predictions)
    }
}

export class MMapOccurrenceTimeline extends MMapTimeline {
    constructor(namespace: string) {
        super(namespace, PointType.Occurrences)
    }
}



// @action
// protected setMarks(i: IReactionData){
//
//       if (!this.geoSpatialIndex) {
//           this.TickMarks.clear();
//           return
//       }
//
//       const occurrenceDateRange: [moment.Moment, moment.Moment] = [moment("20170101"), moment("20171231")];
//
//       this.TickMarks.replace(
//           this.getMarks(
//               i.pointType,
//               generateMomentTicks(
//                   i.pointType,
//                   i.pointType === PointType.Predictions ?
//                       getGlobalModel(this.namespace, MTime).PredictionDateRange :
//                       occurrenceDateRange
//               ),
//               generateTimeScale(
//                   occurrenceDateRange,
//                   i.viewPort || [0,0]
//               ),
//               timelineObjects
//           )
//       )
// }

// protected fetchJSON(i: IReactionData) {
//
//     if (i.pointType === PointType.Occurrences) {
//         return
//     }
//
//     if (!i.nameUsageId || i.nameUsageId === '') {
//         this.geoSpatialIndex = undefined;
//         this.setMarks(i);
//         return
//     }
//
//     getFirebaseStorageRef(this.namespace).ref(`${i.pointType.toLowerCase()}-timeline/${i.nameUsageId}.json`).getDownloadURL().then((url) => {
//
//         fetch(url)
//             .then((res) => {
//                 return res.json();
//             })
//             .then((jsonResponse: IJSONRequestObject) => {
//                 this.geoSpatialIndex = jsonResponse;
//                 this.setMarks(i)
//             }).catch((err) => {
//                 getGlobalModel(this.namespace, MErrors).Report(err)
//         })
//     })
//
// }

// protected subscribe(){
//
//     const pointType = this.viewStore.PointType;
//     const nameUsageId = this.taxaStore.Selected
//       ? this.taxaStore.Selected.NameUsageID
//       : '';
//     const covering = this.coordStore.Covering;
//     const predictionDateRange: [moment.Moment, moment.Moment] =
//       this.dateStore.PredictionDateRange;
//     const occurrenceDateRange: [moment.Moment, moment.Moment] = [moment("20170101"), moment("20171231")];
//     const viewPort: [number, number] = this.coordStore.ViewPort;
//
//     const momentRange = pointType === PointType.Occurrences ?
//         occurrenceDateRange:
//         predictionDateRange;
//
//     const momentTicks = generateMomentTicks(pointType, momentRange);
//     const tScale = generateTimeScale(occurrenceDateRange, viewPort);
//
//     if (nameUsageId === '') {
//       return this.setMarks(pointType, momentTicks, tScale, new Map());
//     }
//
//     if (pointType === PointType.Predictions) {
//       return FetchPredictionTimeline(this.fireStoreRef, covering, nameUsageId)
//         .then((t) => {
//           this.setMarks(pointType, momentTicks, tScale, t);
//         })
//         .catch(this.errorStore.Report);
//     }
//
//     if (pointType === PointType.Occurrences) {
//       return FetchOccurrenceTimeline(this.fireStoreRef, covering, nameUsageId)
//         .then((t) => {
//           this.setMarks(pointType, momentTicks, tScale, t);
//         })
//         .catch(this.errorStore.Report);
//     }
//
//     return;
// };



// protected dispose() {
//     this.unsubscribe();
// };
// this._color_scale = scaleLinear().range([0,1]).domain(schemeRdYlBu)


// interface ITimelineObject {
//     t: number;
//     Ω?: number;
// }

// type IJSONRequestPoint = [number, number, number]

// interface IJSONRequestObject{
//     [key: string]: Array<[number, number, number]>
// }