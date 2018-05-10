import { Provider } from 'mobx-react';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { CoordinateStore, getCoordinateStore } from '../../stores/coordinates';
import { DateStore, getDateStore } from '../../stores/date';
import { ErrorStore, getErrorStore } from '../../stores/errors';
import { getPointStore, PointStore } from '../../stores/points';
import { getRouterStore, RouterStore } from '../../stores/router';
import { getTaxaStore, TaxaStore } from '../../stores/taxa';
import { getTimelineStore, TimelineStore } from '../../stores/timeline';
import {getViewStore, PointType, ViewStore} from '../../stores/view';
import Navigation from './Navigation';
import PointMap from './PointMap';
import TaxonCard from "./TaxonCard";

// Not matching an
// example inform we match URL /:id
// interface MatchParams {
// id: string;
// }

// Note we use Partial<RouteComponentProps> to make all RouteComponentProps as optional for high order component
// interface IndexProps extends Partial<RouteComponentProps<MatchParams>> {
//     id: string;
// }

interface IndexProps {
  id: string;
  match: {
    params: IPathMatchParams;
  };
}

interface IPathMatchParams {
  pointType?: string;
  coordinates?: string;
  date?: string;
  nameUsageId?: string;
}

type Props = IndexProps & RouteComponentProps<{}>;

class Index extends React.Component<Props> {

  public stores: {
    coordinateStore: CoordinateStore;
    dateStore: DateStore;
    errorStore: ErrorStore;
    occurrencePointStore: PointStore;
      predictionPointStore: PointStore;
    taxaStore: TaxaStore;
    timelineStore: TimelineStore;
    viewStore: ViewStore;
  };

    protected routerStore: RouterStore;

  constructor(props: Props) {
    super(props);
    if (!props.history) {
      throw Error('History Props not Found');
    }

    this.stores = {
      coordinateStore: getCoordinateStore('default'),
      dateStore: getDateStore('default'),
      errorStore: getErrorStore('default'),
        occurrencePointStore: getPointStore('default', PointType.Occurrences),
        predictionPointStore: getPointStore('default', PointType.Predictions),
      taxaStore: getTaxaStore('default'),
      timelineStore: getTimelineStore('default'),
      viewStore: getViewStore('default'),
    };

    // Do before router store initialization in order to set to initial path.
    this.updateMatchParams(props.match.params);

    // Do after capturing initial props.
    this.routerStore = getRouterStore(props.history, 'default');
  }


  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.stores.errorStore.Report(error);
  }

  public componentWillReceiveProps(nextProps: Props) {
    this.updateMatchParams(nextProps.match.params);
  }

  public render() {
    return (
      <Provider {...this.stores}>
        <div id="map-component" style={{
          height: "100vh",
            position: "fixed", // Note: necessary for leaflet map to function.
            width: "100vw",
        }}>
          <Navigation />
          <TaxonCard />
          <PointMap namespace={'default'} />
        </div>
      </Provider>
    );
  }


    protected updateMatchParams(params: IPathMatchParams) {
        if (params.coordinates) {
            this.stores.coordinateStore.FromPath(params.coordinates);
        }

        if (params.date) {
            this.stores.dateStore.FromFormattedString(params.date);
        }

        if (params.pointType) {
            this.stores.viewStore.SetPointTypeFromString(params.pointType);
        }

        if (params.nameUsageId) {
            this.stores.taxaStore.Select(params.nameUsageId);
        }
    }
}

export default withRouter<Props>(Index);
