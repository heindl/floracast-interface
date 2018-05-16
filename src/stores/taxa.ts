/* tslint:disable:max-classes-per-file */

import * as _ from 'lodash';
import {action, IReactionDisposer, observable, reaction} from 'mobx';
import {S2CellId} from "nodes2ts";
import {
    FetchOccurrenceTaxa,
    FetchPredictionTaxa, IPredictionResponse,
} from '../geoindex/taxa';
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
    covering: S2CellId[];
    inFocusField?: InFocusField;
    section?: string;
}

class TaxaStore {

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

  protected fetchTaxa(i: ITaxaFetchData){

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
            getGlobalModel(this.namespace, MErrors).Report(err);
            this.SetLoading(false);
          });
      }

      if (i.pointType === PointType.Occurrences) {
        FetchOccurrenceTaxa(getFireStoreRef(this.namespace), i.covering, i.date)
          .then((res: Array<[string, number]>) => {
            this.setOccurrenceTaxa(res);
          })
          .catch((err) => {
              getGlobalModel(this.namespace, MErrors).Report(err);
            this.SetLoading(false);
          });
      }
  };

    protected dispose() {
        this.unsubscribe();
    };
}


export class MUserTaxa extends TaxaStore {
    constructor(namespace: string) {
        super(namespace, MLocationUserCoordinates, MLocationUserComputations)
    }
}

export class MMapTaxa extends TaxaStore {
    constructor(namespace: string) {
        super(namespace, MLocationMapCoordinates, MLocationMapComputations)
    }
}