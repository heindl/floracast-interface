import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import {MTime} from "../../stores/date";
import MErrors from '../../stores/errors';
import {getGlobalModel} from "../../stores/globals";
import MLocationUserCoordinates, {DefaultRadius} from "../../stores/location/coordinate";
import MLocationPlace from "../../stores/location/place";
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


  constructor(props: Props) {
    super(props);
    if (!props.history) {
      throw Error('History Props not Found');
    }

    // Do before router store initialization in order to set to initial path.
    this.updateMatchParams(props.match.params);
  }

  public componentWillReceiveProps(nextProps: IForecastIndexProps) {
      this.updateMatchParams(nextProps.match.params);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    getGlobalModel('default', MErrors).Report(error)
  }

  public render() {
      return (
         <ForecastPage />
      );
  }

  protected updateMatchParams = (params: IPathMatchParams) => {

    const mCoords = getGlobalModel('default', MLocationUserCoordinates);
    const mPlace = getGlobalModel('default', MLocationPlace);
    const mTime = getGlobalModel('default', MTime);

    if (params.city && params.state) {
        const city = params.city.replace("+", " ");
        const state = params.state.replace("+", " ");
        mCoords.SetRadius(DefaultRadius);
        mPlace.ReverseGeocode({
            address: `${city}, ${state}`,
        });
    } else {
        mCoords.SetRadius(DefaultRadius);
        mCoords.Geolocate();
    }
    if (params.date) {
      mTime.FromFormattedString(params.date);
    }
  };


}

export default withRouter<Props>(ForecastIndex);
