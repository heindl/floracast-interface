import {FirebaseFirestore} from "@firebase/firestore-types";
import * as d3Scale from 'd3-scale';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as _ from 'lodash';
import {computed} from 'mobx';
import * as moment from 'moment';
import { CoordinateStore, getCoordinateStore } from './coordinates';
import { DateStore, getDateStore } from './date';
import {ErrorStore, getErrorStore} from './errors';
import {getFireStoreRef} from './firestore';
import {getPointStore, PointStore} from "./points";
import {getTaxaStore, TaxaStore} from './taxa';
import {getViewStore, PointType, ViewStore} from './view';

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

// this._color_scale = scaleLinear().range([0,1]).domain(schemeRdYlBu)
export function GetColor(v: number): string {
    return ColorScale(v)
}

interface ITimelineObject {
    t: number;
    Ω?: number;
}

export class TimelineStore {
  protected readonly namespace: string;

  protected occurrencePointStore: PointStore;
    protected predictionPointStore: PointStore;

  protected viewStore: ViewStore;
  protected taxaStore: TaxaStore;
  protected fireStoreRef: FirebaseFirestore;
  protected errorStore: ErrorStore;
  protected dateStore: DateStore;
  protected coordStore: CoordinateStore;


  // protected unsubscribe: IReactionDisposer;

  constructor(namespace: string) {

      this.namespace = namespace;

      this.occurrencePointStore = getPointStore(namespace, PointType.Occurrences);
      this.predictionPointStore = getPointStore(namespace, PointType.Predictions);

    this.viewStore = getViewStore(namespace);
    this.taxaStore = getTaxaStore(namespace);
    this.fireStoreRef = getFireStoreRef(namespace);
    this.errorStore = getErrorStore(namespace);
    this.dateStore = getDateStore(namespace);
    this.coordStore = getCoordinateStore(namespace);

    // const autoRunOptions: IReactionOptions = {fireImmediately: false, name: "Timeline Fetch"};
    // this.subscribe = this.subscribe.bind(this);
    // this.unsubscribe = autorun(this.subscribe,
    //     autoRunOptions
    // );
  }


    @computed
    public get OccurrenceTickMarks() {

        const bounds = this.coordStore.Bounds;
        const zoom = this.coordStore.Zoom;
        const superClusters = this.occurrencePointStore.Clusters;
        const viewPort: [number, number] = this.coordStore.ViewPort;

        const res: Map<string, ITimelineObject> = new Map();
        _.each(superClusters, (c, date) => {
            let t = 0;
            c.getClusters(bounds, zoom).forEach((g) => {
                if (!g.properties || !g.properties.point_count) {
                    throw Error(`Invalid Properties`)
                }
                t = t + g.properties.point_count;
            });
            res.set(date, {t})
        });

        const dateRange: [moment.Moment, moment.Moment] = [moment("20170101"), moment("20171231")];

        return this.getMarks(
            PointType.Occurrences,
            generateMomentTicks(PointType.Occurrences, dateRange),
            generateTimeScale(dateRange, viewPort),
            res
        );
    }

  @computed
  public get PredictionTickMarks() {

      const bounds = this.coordStore.Bounds;
      const zoom = this.coordStore.Zoom;
      const superClusters = this.predictionPointStore.Clusters;
      const viewPort: [number, number] = this.coordStore.ViewPort;
      const dateRange =  this.dateStore.PredictionDateRange;

      const res: Map<string, ITimelineObject> = new Map();
      _.each(superClusters, (c, date) => {
          let t = 0;
          let Ω = 0;
          c.getClusters(bounds, zoom).forEach((g) => {
              t = t + ((g.properties && g.properties.point_count) || 1);
              Ω = Ω + ((g.properties && g.properties.predictionCount) || 0);
          });
          res.set(date, {t, Ω: (Ω/t)})
      });

      return this.getMarks(
          PointType.Predictions,
          generateMomentTicks(PointType.Predictions, dateRange),
          generateTimeScale(
              [moment("20170101"), moment("20171231")],
              viewPort
          ),
          res
      );
  }

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

  protected getMarks(
    pointType: PointType,
    momentTicks: moment.Moment[],
    tScale: d3Scale.ScaleTime<number, number>,
    objs: Map<string, ITimelineObject>
  ) {
    // Would like to not need to listen for pointType, but we need the tick marks regardless.

    const fmt = pointType === PointType.Occurrences ? 'MM' : 'YYYYMMDD';

    let maxPointCount = 0;
    let maxPredictionAvg = 0;

    const res: ITickMark[] = momentTicks.map((m: moment.Moment) => {

      // Even if we are using month, date should be be a Tuesday or a Friday.
      // let day = m.isoWeekday();
      // if (pointType === PointType.Occurrences && (day !== 5 && day !== 2)) {
      //   day = day < 2 || day > 5 ? 2 : 5;
      //   m.isoWeekday(day);
      // }

      const obj: ITimelineObject = objs.get(m.format(fmt)) || { t: 0 };

      const mark: ITickMark = {
        moment: m,
        pointCount: obj.t,
        predictionMean: obj.Ω || 0,
        x: tScale(m.clone().set('year', 2017).toDate()),
        y: 0,
      };

      if (pointType === PointType.Occurrences && mark.pointCount > 0) {
        mark.predictionMean = 0.65;
      }

      maxPointCount =
        mark.pointCount > maxPointCount ? mark.pointCount : maxPointCount;
      maxPredictionAvg =
        mark.predictionMean > maxPredictionAvg
          ? mark.predictionMean
          : maxPredictionAvg;

      return mark;
    });

    return res.map((mark) => {
            mark.scaledPredictionMean =
                pointType === PointType.Predictions
                    ? minMaxScale(mark.predictionMean, maxPredictionAvg, 0)
                    : mark.predictionMean;

            mark.scaledPointCount = minMaxScale(
                mark.pointCount,
                maxPointCount,
                0
            );

            mark.fill = ColorScale(mark.scaledPredictionMean);

            return mark;
        });
  };

    // protected dispose() {
    //     this.unsubscribe();
    // };

}

const monthTicks: moment.Moment[] = [
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

function generateMomentTicks(pointType: PointType, momentRange: [moment.Moment, moment.Moment]): moment.Moment[] {

  if (pointType === PointType.Occurrences) {
    return monthTicks
  }

    const start = momentRange[0];
    const end = momentRange[1];

    const tmp = start.clone();
    const res: moment.Moment[] = [];

    while( tmp.isBefore(end) ){
        tmp.add(7, 'days');
        res.push(tmp.clone());
    }

    // res.push(end);

    return res

}

function generateTimeScale(
    momentRange: [moment.Moment, moment.Moment],
  viewPort: [number, number]
): d3Scale.ScaleTime<number, number> {

  // const x_padding = 35;
  const xPadding = 10;

  const dimensions: ReadonlyArray<number> = [
    xPadding,
    viewPort[0] - (xPadding + 5),
  ];

  return d3Scale
    .scaleTime()
    .domain([momentRange[0].toDate(), momentRange[1].toDate()])
    .range(dimensions);
}

function minMaxScale(v: number, globalMax: number, globalMin: number): number {
  // Scale Count
  const scaleMin = 0;
  const scaleMax = 1;
  const std = (v - globalMin) / (globalMax - globalMin);
  return std * (scaleMax - scaleMin) + scaleMin;
}

const namespaces: Map<string, TimelineStore> = new Map();

export function getTimelineStore(namespace: string): TimelineStore {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new TimelineStore(namespace);
    namespaces.set(namespace, store);
  }
  return store;
}
