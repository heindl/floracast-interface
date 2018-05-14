import * as _ from 'lodash';
import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import {MTime} from "../../stores/date";
import MErrors from "../../stores/errors";
import {getGlobalModel} from "../../stores/globals";
import MLocationMapCoordinates from "../../stores/location/map";
import {parseCoordinates} from "../../stores/router";
import {MMapTaxa} from "../../stores/taxa";
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

  constructor(props: Props) {
    super(props);
    if (!props.history) {
      throw Error('History Props not Found');
    }

    // Do before router store initialization in order to set to initial path.
    updateMatchParams(props.match.params);
  }


  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      getGlobalModel('default', MErrors).Report(error);
  }

  public componentWillReceiveProps(nextProps: Props) {
    updateMatchParams(nextProps.match.params);
  }

  public render() {
    return (
        <div id="map-component" style={{
          height: "100vh",
            position: "fixed", // Note: necessary for leaflet map to function.
            width: "100vw",
        }}>
          <Navigation />
          <TaxonCard />
          <PointMap namespace={'default'} />
        </div>
    );
  }

}

function updateMatchParams(params: IPathMatchParams) {

    const sCoords = getGlobalModel('default', MLocationMapCoordinates);

    // Eventually set the default to the most ecologically significant area in the country
    const coords = _.assign({
        lat: 37.9420743,
        lng: -107.9058009,
        zoom: 6,
    }, parseCoordinates(params.coordinates || ''));

    sCoords.SetCoordinates(coords.lat, coords.lng);
    sCoords.SetZoom(coords.zoom);

    if (params.date) {
        const sTime = getGlobalModel('default', MTime);
        sTime.FromFormattedString(params.date)
    }

    if (params.nameUsageId) {
        const mTaxa = getGlobalModel('default', MMapTaxa);
        mTaxa.Select(params.nameUsageId);
    }
}

export default withRouter<Props>(Index);
