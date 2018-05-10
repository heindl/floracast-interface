import * as history from 'history';
import {autorun, IReactionDisposer, IReactionOptions} from 'mobx';
import {CoordinateStore, getCoordinateStore} from './coordinates';
import {DateStore, getDateStore} from './date';
import {getTaxaStore, TaxaStore} from './taxa';
import {getViewStore, PointType, ViewStore} from './view';

export class RouterStore {

    public static FormForecastPath(obj: {
        city?: string;
        state?: string;
        date?: string;
    }): string {
        if (!obj.city || !obj.state) {
            return '/forecast';
        }
        return [
            '/forecast',
            obj.state.toLowerCase().replace(' ', '+'),
            obj.city && obj.city.toLowerCase().replace(' ', '+'),
            obj.date,
        ]
            .filter((s) => s && s !== '')
            .join('/');
    }

    public static FormMapPath(obj: {
        pointType?: PointType;
        coordStr?: string;
        date?: string;
        nameUsageId?: string;
    }): string {
        let r = '/map';
        if (!obj.pointType) {
            return r;
        }
        r += `/${obj.pointType && obj.pointType.toString().toLowerCase()}`;
        if (!obj.coordStr) {
            return r;
        }
        r += `/${obj.coordStr}`;
        if (!obj.date) {
            return r;
        }
        return (r += `/${obj.date}/${obj.nameUsageId || ''}`);
    }

  protected historyRef: history.History;
  protected readonly namespace: string;

  protected coordStore: CoordinateStore;
  protected dateStore: DateStore;
  protected viewStore: ViewStore;
  protected taxaStore: TaxaStore;

    protected unsubscribe: IReactionDisposer;

  // This is really only necessary for testing. Should just listen to history.pathname.
  // @observable public Path: string = '';

    constructor(historyRef: history.History, namespace: string) {
        this.namespace = namespace;
        this.historyRef = historyRef;

        this.coordStore = getCoordinateStore(this.namespace);
        this.dateStore = getDateStore(this.namespace);
        this.viewStore = getViewStore(this.namespace);
        this.taxaStore = getTaxaStore(this.namespace);

        const autoRunOptions: IReactionOptions = {fireImmediately: false, name: "Router Update"};
        this.subscribe = this.subscribe.bind(this);
        this.unsubscribe = autorun(
            this.subscribe,
            autoRunOptions
        );
    }



    protected subscribe(){
        const currentPathName = this.historyRef.location.pathname;
        const prefix = currentPathName.split('/')[1];

        if (prefix !== 'map' && prefix !== 'forecast') {
            return;
        }

        this.viewStore.SetSection(prefix);

        const pathname =
            prefix !== 'map'
                ? RouterStore.FormForecastPath({
                    city: this.coordStore.City,
                    date: this.dateStore.ActiveIsToday ? undefined : this.dateStore.DateString,
                    state: this.coordStore.State,
                })
                : RouterStore.FormMapPath({
                    coordStr: this.coordStore.Formatted,
                    date: this.dateStore.DateString,
                    nameUsageId: this.taxaStore.Selected && this.taxaStore.Selected.NameUsageID,
                    pointType: this.viewStore.PointType,
                });

        if (pathname === currentPathName) {
          return
        }

        this.historyRef.push(pathname);
    };

  protected dispose() {
    this.unsubscribe();
  };
}

const namespaces: Map<string, RouterStore> = new Map();

export function getRouterStore(
  historyRef: history.History,
  namespace: string
): RouterStore {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new RouterStore(historyRef, namespace);
    namespaces.set(namespace, store);
  }
  return store;
}
