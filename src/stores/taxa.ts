/* tslint:disable:max-classes-per-file */

import {DocumentSnapshot, FirebaseFirestore} from "@firebase/firestore-types";
import * as geolib from 'geolib';
import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {S2CellId} from "nodes2ts";
import {MTime} from "./date";
import MErrors from "./errors";
import {getFireStoreRef} from './firestore';
import {getGlobalModel} from "./globals";
import {MLocationMapComputations, MLocationUserComputations} from "./location/computation";
import MLocationUserCoordinates from "./location/coordinate";
import MLocationMapCoordinates from "./location/map";
import Taxon from './taxon';
import {InFocusField, MView, PointType} from './view';



interface ITaxaFetchData{
    lat: number;
    lng: number;
    pointType: PointType;
    date: string;
    covering: string[];
    inFocusField?: InFocusField;
    section?: string;
}

class MTaxa {
    static get global(): string {
        return "MTaxa";
    }

    @observable public Selected?: Taxon;

    @observable public Taxa = observable.array<Taxon>([], {deep: true});

    @observable public IsLoading: boolean = true;

  protected readonly namespace: string;

    protected unsubscribe: IReactionDisposer;

    constructor(
        namespace: string,
        mCoordType: typeof MLocationUserCoordinates | typeof MLocationMapCoordinates,
        mCompType: typeof MLocationUserComputations | typeof MLocationMapComputations,
    ) {
        this.namespace = namespace;

        const mCoords = getGlobalModel(namespace, mCoordType);
        const mComps = getGlobalModel(namespace, mCompType);

        const viewStore = getGlobalModel(namespace, MView);
        const dateStore = getGlobalModel(namespace, MTime);

        this.unsubscribe = reaction(
            () => ({
                    covering: mComps.Covering,
                    date: dateStore.DateString,
                    inFocusField: viewStore.InFocusField,
                    lat: mCoords.Latitude,
                    lng: mCoords.Longitude,
                    pointType: viewStore.PointType,
                    section: viewStore.Section,
            }),
            (i: ITaxaFetchData) => this.fetchTaxa(i),
            {
                fireImmediately: false,
                name: "Taxa Fetch",
            }
        );
    }

    @action
    public Select(txn: Taxon | string) {
        const id = typeof txn === 'string' ? txn : txn.NameUsageID;
        if (this.Selected && id === this.Selected.NameUsageID) {
            return;
        }
        this.Selected =
            typeof txn === 'string' ? new Taxon(txn, this.namespace) : txn;
    }

  @action
  protected SetLoading(b: boolean) {
    this.IsLoading = b;
  }

  @action
  protected setPredictionTaxa(res: IPredictionResponse[]) {

      if (res.length === 0) {
          this.Taxa.clear();
          this.SetLoading(false);
          return
      }

      const tlist = res.map((r, i) => {
          const txn =
              this.Taxa.find((t) => t.NameUsageID === r.nameUsageId) ||
              new Taxon(r.nameUsageId, this.namespace, r.lat, r.lng);
          txn.ProtectedArea.SetDistanceKilometers(r.distance);
          txn.ProtectedArea.SetSquareKilometersArea(r.sqKm);
          txn.SetPrediction(r.prediction);
          return txn;
      });

    this.Taxa.replace(tlist);

    if (!this.Selected && res.length !== 0) {
      this.Select(this.Taxa[0]);
    }
    this.SetLoading(false);
  }

  @action
  protected setOccurrenceTaxa(res: Array<[string, number]>) {

    if (res.length === 0) {
        this.Taxa.clear();
        this.SetLoading(false);
        return
    }

    this.Taxa.replace(
      res.map((r) => {
        const index = this.Taxa.findIndex((t) => t.NameUsageID === r[0]);
        return index === -1
          ? new Taxon(r[0], this.namespace)
          : this.Taxa[index];
      })
    );
    if (!this.Selected && res.length !== 0) {
      this.Select(this.Taxa[0]);
    }
    this.SetLoading(false);
  }

  protected fetchTaxa(i: ITaxaFetchData){

      const go = i.lat !== 0
          && i.lng !== 0
          && i.pointType === PointType.Predictions
          && i.date !== ''
          && i.covering.length > 0;

      if (!go) {
          if (i.pointType) {
              if (i.pointType === PointType.Predictions) {
                  this.setPredictionTaxa([])
              } else {
                  this.setOccurrenceTaxa([])
              }
          }
          return
      }

      const listIsVisible = (i.inFocusField === InFocusField.FieldTaxon || i.section === 'forecast');

      if (!listIsVisible && this.Selected) {
        return
      }

      this.SetLoading(true);

      if (i.pointType === PointType.Predictions) {
        FetchPredictionTaxa(
            getFireStoreRef(this.namespace),
            i.covering,
            [i.lat, i.lng],
            i.date,
        ).then((res: IPredictionResponse[]) => {
            this.setPredictionTaxa(res);
          })
          .catch((err) => {
            getGlobalModel(this.namespace, MErrors).Report(err);
            this.SetLoading(false);
          });
      }

      // if (i.pointType === PointType.Occurrences) {
      //   FetchOccurrenceTaxa(getFireStoreRef(this.namespace), i.covering, i.date)
      //     .then((res: Array<[string, number]>) => {
      //       this.setOccurrenceTaxa(res);
      //     })
      //     .catch((err) => {
      //         getGlobalModel(this.namespace, MErrors).Report(err);
      //       this.SetLoading(false);
      //     });
      // }
  };

    protected dispose() {
        this.unsubscribe();
    };
}


export class MUserTaxa extends MTaxa {
    static get global(): string {
        return "MUserTaxa";
    }

    constructor(namespace: string) {
        super(namespace, MLocationUserCoordinates, MLocationUserComputations)
    }
}

export class MMapTaxa extends MTaxa {
    static get global(): string {
        return "MMapTaxa";
    }

    constructor(namespace: string) {
        super(namespace, MLocationMapCoordinates, MLocationMapComputations)
    }
}


export function FetchOccurrenceTaxa(
    fireStoreRef: FirebaseFirestore,
    cellIds: S2CellId[],
    month: string
) {
    return new Promise<Array<[string, number]>>((resResolve, resReject) => {
        const aggr: { [key: string]: number } = {};
        Promise.all(
            cellIds.map((cellId) => {
                return new Promise((resolve, reject) => {
                    return fireStoreRef
                        .collection('Occurrences')
                        .where(
                            `GeoFeatureSet.S2Tokens.${cellId.level()}`,
                            '==',
                            cellId.toToken()
                        )
                        .where('FormattedMonth', '==', month)
                        .get()
                        .then((snapshots) => {
                            snapshots.forEach((doc) => {
                                aggr[doc.get('NameUsageID')] =
                                    (aggr[doc.get('NameUsageID')] += 1) || 1;
                            });
                            resolve();
                        })
                        .catch(reject);
                });
            })
        )
            .then(() => {
                resResolve(_.sortBy(_.toPairs(aggr), (p) => p[1]));
            })
            .catch(resReject);
    });
}

export interface IPredictionResponse {
    nameUsageId: string;
    sortValue: number;
    prediction: number;
    distance: number;
    lat: number;
    lng: number;
    sqKm: number;
}

interface IFirestorePredictionResponse {
    [key: string]: ITaxaArrayDoc[]
}

interface ITaxaArrayDoc {
    Ω: number,
    lat: number,
    lng: number,
    km: number,
}

export function FetchPredictionTaxa(
    fireStoreRef: FirebaseFirestore,
    s2Tokens: string[],
    centre: [number, number], // Latitude, Longitude
    date: string
) {
    return new Promise<IPredictionResponse[]>((resResolve, resReject) => {
        // const areaCache = new AreaCache(centre);
        Promise.all(s2Tokens.map((token) => {
                return new Promise((resolve, reject) => {
                    fireStoreRef
                        .collection('PredictionIndex')
                        .where(`Token`, '==', token)
                        .where(`Date`, '==', date)
                        .get()
                        .then((snapshots) => {
                            const res: IPredictionResponse[] = [];
                            snapshots.docs.forEach((snap: DocumentSnapshot) => {

                                const taxa: IFirestorePredictionResponse = snap.get("Taxa");

                                _.each(taxa, (docs: ITaxaArrayDoc[], nameUsageId: string) => {
                                    docs.forEach((doc: ITaxaArrayDoc) => {
                                        const distance = geolib.getDistance(
                                            {latitude: doc.lat, longitude: doc.lng},
                                            {latitude: centre[0], longitude: centre[1]}
                                        );
                                        res.push({
                                            distance,
                                            lat: doc.lat,
                                            lng: doc.lng,
                                            nameUsageId,
                                            prediction: doc.Ω,
                                            sortValue: doc.Ω * 50 + doc.km * 0.01 - distance * 0.5,
                                            sqKm: doc.km
                                        })
                                    })
                                });
                            });
                            resolve(res);
                        })
                        .catch(reject);
                });
            })
        ).then((list: IPredictionResponse[][]) => {

            resResolve(
                _.uniqBy(
                    _.orderBy(
                        _.flatten(_.compact(list)),
                        ['sortValue', 'nameUsageId'],
                        ['desc', 'asc']
                    ),
                    (r) => r.nameUsageId,
                )
            );
        })
            .catch(resReject);
    });
}
