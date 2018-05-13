import * as d3Scale from 'd3-scale';
import { interpolateSpectral } from 'd3-scale-chromatic';
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import * as moment from 'moment';
import {MTime} from "./date";
import MErrors from "./errors";
import {getFirebaseStorageRef} from './firestore';
import {getGlobalModel} from "./globals";
import MLocationMapCoordinates from "./location/map";
import {MMapTaxa} from "./taxa";
import {MView, PointType} from './view';

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

type IJSONRequestPoint = [number, number, number]

interface IJSONRequestObject{
    [key: string]: Array<[number, number, number]>
}

interface IReactionData{
    pointType: PointType,
    viewPort?: [number, number],
    levelSevenTokens?: string[],
    nameUsageId?: string
}

export class MMapTimeline {

    @observable
    public TickMarks = observable.array<ITickMark>([], {deep: false});

  protected readonly namespace: string;

  protected geoSpatialIndex?: IJSONRequestObject;


  protected UnsubscribeFetchJSONReaction?: IReactionDisposer;
    protected UnsubscribeSetMarksReaction?: IReactionDisposer;

  constructor(namespace: string) {

      this.namespace = namespace;

        const viewStore = getGlobalModel(namespace, MView);
        const taxaStore = getGlobalModel(namespace, MMapTaxa);
        const coordStore = getGlobalModel(namespace, MLocationMapCoordinates);

      this.UnsubscribeFetchJSONReaction = reaction(
          () => ({
              nameUsageId: taxaStore.Selected && taxaStore.Selected.NameUsageID,
              pointType: viewStore.PointType,
          }),
          (o) => {this.fetchJSON({
              levelSevenTokens: coordStore.CoveringAtLevelSeven,
              nameUsageId: o.nameUsageId || undefined,
              pointType: o.pointType,
              viewPort: coordStore.ViewPort,
          }, )},
          {
              fireImmediately: false,
              name: `${viewStore.PointType} JSON Fetch`
          }
      );

      this.UnsubscribeSetMarksReaction = reaction(
          () => coordStore.CoveringAtLevelSeven,
          (tokens) => {this.setMarks({
              levelSevenTokens: tokens,
              pointType: viewStore.PointType,
              viewPort: coordStore.ViewPort,
          })},
          {
              fireImmediately: false,
              name: `${viewStore.PointType} JSON Fetch`
          }
      );
  }


  @action
  protected setMarks(i: IReactionData){

        if (!this.geoSpatialIndex || !i.levelSevenTokens) {
            this.TickMarks.clear();
            return
        }

        const timelineObjects = _.mapValues<
            {[key: string]: IJSONRequestPoint[]},
            ITimelineObject
            >(
                _.groupBy(
                    _.flatten(_.values(_.pick(this.geoSpatialIndex, i.levelSevenTokens))),
                    (v: IJSONRequestPoint) => v[0]
                ),
                (v) => {
                    const o: ITimelineObject = {
                        t: _.sumBy(v, (a) => a[1])
                    };
                    const p = _.sumBy(v, (a) => a[1]);
                    o.Ω = p > 0 ? p / o.t : undefined;
                    return o
                }
        );

        const occurrenceDateRange: [moment.Moment, moment.Moment] = [moment("20170101"), moment("20171231")];

        this.TickMarks.replace(
            this.getMarks(
                i.pointType,
                generateMomentTicks(
                    i.pointType,
                    i.pointType === PointType.Predictions ?
                        getGlobalModel(this.namespace, MTime).PredictionDateRange :
                        occurrenceDateRange
                ),
                generateTimeScale(
                    occurrenceDateRange,
                    i.viewPort || [0,0]
                ),
                timelineObjects
            )
        )
  }

    protected fetchJSON(i: IReactionData) {

        if (i.pointType === PointType.Occurrences) {
            return
        }

        if (!i.nameUsageId || i.nameUsageId === '') {
            this.geoSpatialIndex = undefined;
            this.setMarks(i);
            return
        }

        getFirebaseStorageRef(this.namespace).ref(`${i.pointType.toLowerCase()}-timeline/${i.nameUsageId}.json`).getDownloadURL().then((url) => {

            fetch(url)
                .then((res) => {
                    return res.json();
                })
                .then((jsonResponse: IJSONRequestObject) => {
                    this.geoSpatialIndex = jsonResponse;
                    this.setMarks(i)
                }).catch((err) => {
                    getGlobalModel(this.namespace, MErrors).Report(err)
            })
        })

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
    objs: {[key: string]: ITimelineObject}
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

      const obj: ITimelineObject = objs.hasOwnProperty(m.format(fmt)) ? objs[m.format(fmt)] : { t: 0 };

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

const namespaces: Map<string, MMapTimeline> = new Map();

export function getTimelineStore(namespace: string): MMapTimeline {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new MMapTimeline(namespace);
    namespaces.set(namespace, store);
  }
  return store;
}
