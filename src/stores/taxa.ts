import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {S2CellId} from "nodes2ts";
import {
    FetchOccurrenceTaxa,
    FetchPredictionTaxa, IPredictionResponse,
} from '../geoindex/taxa';
import {getCoordinateStore} from './coordinates';
import {getDateStore} from './date';
import {getErrorStore} from './errors';
import {getFireStoreRef} from './firestore';
import Taxon from './taxon';
import {getViewStore, InFocusField, PointType} from './view';

export class TaxaStore {

    @observable public Selected?: Taxon;

    @observable public Taxa = observable.array<Taxon>([], {deep: true});

    @observable public IsLoading: boolean = true;

  protected readonly namespace: string;

    protected unsubscribe: IReactionDisposer;

    constructor(namespace: string) {
        this.namespace = namespace;
        const coordinateStore = getCoordinateStore(namespace);
        const viewStore = getViewStore(namespace);
        const dateStore = getDateStore(namespace);

        this.unsubscribe = reaction(
            () => {
                return {
                    covering: coordinateStore.Covering,
                    date: dateStore.DateString,
                    inFocusField: viewStore.InFocusField,
                    lat: coordinateStore.Latitude,
                    lng: coordinateStore.Longitude,
                    pointType: viewStore.PointType,
                    section: viewStore.Section,
                }
            },
            (i) => this.fetchTaxa(i),
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

    this.Taxa.replace(
      res.map((r, i) => {
        const txn =
          this.Taxa.find((t) => t.NameUsageID === r.nameUsageId) ||
          new Taxon(r.nameUsageId, this.namespace, r.areaToken);
        txn.ProtectedArea.SetDistanceKilometers(r.distance);
        txn.ProtectedArea.SetSquareKilometersArea(r.sqKm);
        txn.SetPrediction(r.prediction);
        return txn;
      })
    );

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

  protected fetchTaxa(i: {
      lat: number;
      lng: number;
      pointType: PointType;
      date: string;
      covering: S2CellId[];
      inFocusField?: InFocusField;
      section?: string;
                      }){

        console.log("Fetching taxa", i)

      const go = !_.isEmpty(i.lat)
          && !_.isEmpty(i.lng)
          && !_.isEmpty(i.pointType)
          && !_.isEmpty(i.date)
          && !_.isEmpty(i.covering);

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

      console.log("listisvisible", listIsVisible)

      if (!listIsVisible && this.Selected) {
        return
      }

      this.SetLoading(true);

      if (i.pointType === PointType.Predictions) {
        FetchPredictionTaxa(getFireStoreRef(this.namespace), i.covering, [i.lat, i.lng], i.date)
          .then((res: IPredictionResponse[]) => {
            this.setPredictionTaxa(res);
          })
          .catch((err) => {
            getErrorStore(this.namespace).Report(err);
            this.SetLoading(false);
          });
      }

      if (i.pointType === PointType.Occurrences) {
        FetchOccurrenceTaxa(getFireStoreRef(this.namespace), i.covering, i.date)
          .then((res: Array<[string, number]>) => {
            this.setOccurrenceTaxa(res);
          })
          .catch((err) => {
              getErrorStore(this.namespace).Report(err);
            this.SetLoading(false);
          });
      }
  };

    protected dispose() {
        this.unsubscribe();
    };
}

const namespaces: Map<string, TaxaStore> = new Map();

export function getTaxaStore(namespace: string): TaxaStore {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new TaxaStore(namespace);
    namespaces.set(namespace, store);
  }
  return store;
}
