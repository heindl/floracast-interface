import {FirebaseFirestore} from "@firebase/firestore-types";
import {action, autorun, IReactionDisposer, IReactionOptions, observable} from 'mobx';
import {
    FetchOccurrenceTaxa,
    FetchPredictionTaxa, IPredictionResponse,
} from '../geoindex/taxa';
import {CoordinateStore, getCoordinateStore} from './coordinates';
import {DateStore, getDateStore} from './date';
import {ErrorStore, getErrorStore} from './errors';
import {getFireStoreRef} from './firestore';
import Taxon from './taxon';
import {getViewStore, InFocusField, PointType, ViewStore} from './view';

export class TaxaStore {

    @observable public Selected?: Taxon;

    @observable public Taxa = observable.array<Taxon>([], {deep: true});

    @observable public IsLoading: boolean = true;

  protected readonly namespace: string;
    protected coordinateStore: CoordinateStore;
    protected viewStore: ViewStore;
    protected dateStore: DateStore;
    protected fireStoreRef: FirebaseFirestore;
    protected errorStore: ErrorStore;

    protected unsubscribe: IReactionDisposer;

    constructor(namespace: string) {
        this.namespace = namespace;
        this.coordinateStore = getCoordinateStore(namespace);
        this.viewStore = getViewStore(namespace);
        this.fireStoreRef = getFireStoreRef(namespace);
        this.dateStore = getDateStore(namespace);
        this.errorStore = getErrorStore(namespace);

        const autoRunOptions: IReactionOptions = {fireImmediately: false, name: "Taxa Fetch"};
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = autorun(this.subscribe,
            autoRunOptions
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

  protected subscribe(){

      if (!this.coordinateStore.Latitude || !this.coordinateStore.Longitude) {
          return
      }

      const centre: [number, number] = [
          this.coordinateStore.Latitude,
        this.coordinateStore.Longitude,
      ];
      const pointType = this.viewStore.PointType;
      const date = this.dateStore.DateString;
      const covering = this.coordinateStore.Covering;

      const listIsVisible = (this.viewStore.InFocusField === InFocusField.FieldTaxon || this.viewStore.Section === 'forecast')

      if (!listIsVisible && this.Selected) {
        return
      }

      this.SetLoading(true);

      if (pointType === PointType.Predictions) {
        FetchPredictionTaxa(this.fireStoreRef, covering, centre, date)
          .then((res: IPredictionResponse[]) => {
            this.setPredictionTaxa(res);
          })
          .catch((err) => {
            this.errorStore.Report(err);
            this.SetLoading(false);
          });
      }

      if (pointType === PointType.Occurrences) {
        FetchOccurrenceTaxa(this.fireStoreRef, covering, date)
          .then((res: Array<[string, number]>) => {
            this.setOccurrenceTaxa(res);
          })
          .catch((err) => {
            this.errorStore.Report(err);
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
