import { Provider } from 'mobx-react';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import {
  ContactFormStore,
  getContactFormStore,
} from '../../stores/contact-form';
import { CoordinateStore, getCoordinateStore } from '../../stores/coordinates';
import { MTime, getDateStore } from '../../stores/date';
import { MErrors, getErrorStore } from '../../stores/errors';
import { getRouterStore, RouterStore } from '../../stores/router';
import { getTaxaStore, TaxaStore } from '../../stores/taxa';
import { getViewStore, MView } from '../../stores/view';
import ForecastPage from './Page';
import './Page.css';

interface IForecastIndexProps {
  match: {
    params: IPathMatchParams;
  };
}

interface IPathMatchParams {
  city?: string;
  state?: string;
  date?: string;
}

type Props = IForecastIndexProps & RouteComponentProps<{}>;

class ForecastIndex extends React.Component<Props> {


  public stores: {
    coordinateStore: CoordinateStore;
    dateStore: MTime;
    errorStore: MErrorStore;
    taxaStore?: TaxaStore;
    viewStore: MView;
    contactFormStore: ContactFormStore;
    routerStore?: RouterStore;
  };

  constructor(props: Props) {
    super(props);
    if (!props.history) {
      throw Error('History Props not Found');
    }

    this.stores = {
      contactFormStore: getContactFormStore('default'),
      coordinateStore: getCoordinateStore('default'),
      dateStore: getDateStore('default'),
      errorStore: getErrorStore('default'),
      taxaStore: getTaxaStore('default'),
      viewStore: getViewStore('default'),
    };

    // Do before router store initialization in order to set to initial path.
    this.updateMatchParams(props.match.params);

    // Do after capturing initial props.
    this.stores.routerStore = getRouterStore(props.history, 'default');
  }

  public componentWillReceiveProps(nextProps: IForecastIndexProps) {
      this.updateMatchParams(nextProps.match.params);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      this.stores.errorStore.Report(error);
  }

  public render() {
      return (
          <Provider {...this.stores}>
              <ForecastPage />
          </Provider>
      );
  }

  protected updateMatchParams = (params: IPathMatchParams) => {
    if (params.city && params.state) {
        this.stores.coordinateStore.SetCity(params.city.replace("+", " "));
        this.stores.coordinateStore.SetState(params.state.replace("+", " "));
        this.stores.coordinateStore.SetZoom(9);
        this.stores.coordinateStore.GeocodeAddress();
    } else {
        this.stores.coordinateStore.SetZoom(9);
      this.stores.coordinateStore.Geolocate();
    }
    if (params.date) {
      this.stores.dateStore.FromFormattedString(params.date);
    }
  };


}

export default withRouter<Props>(ForecastIndex);
