import * as React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import {MTime} from "../../stores/date";
import MErrors from '../../stores/errors';
import {getGlobalModel} from "../../stores/globals";
import MLocationUserCoordinates, {DefaultRadius} from "../../stores/location/coordinate";
import MLocationPlace from "../../stores/location/place";
import {MView} from "../../stores/view";
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

    protected mCoords: MLocationUserCoordinates;
    protected mPlace: MLocationPlace;
    protected mTime: MTime;


  constructor(props: Props) {
    super(props);
      this.mCoords = getGlobalModel('default', MLocationUserCoordinates);
      this.mPlace = getGlobalModel('default', MLocationPlace);
      this.mTime = getGlobalModel('default', MTime);
    // Do before router store initialization in order to set to initial path.
      if (!props.match.params.city || !props.match.params.state) {
          // this.updateMatchParams(props.match.params);
          this.mCoords.Geolocate();
      }
      this.updateMatchParams({}, this.props.match.params);
      this.mCoords.SetRadius(DefaultRadius);
  }

  public componentDidMount() {
      getGlobalModel('default', MView).SetSection('forecast');
  }

  public componentWillReceiveProps(nextProps: IForecastIndexProps) {

      this.updateMatchParams(this.props.match.params, nextProps.match.params);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    getGlobalModel('default', MErrors).Report(error)
  }

  public render() {
      return (
         <ForecastPage />
      );
  }

  protected updateMatchParams = (oParams: IPathMatchParams, nParams: IPathMatchParams) => {

    if (nParams.city && nParams.state) {
        if (oParams.city !== nParams.city || oParams.state !== nParams.state) {
            const city = nParams.city.replace("+", " ");
            const state = nParams.state.replace("+", " ");
            this.mPlace.ReverseGeocode({
                address: `${city}, ${state}`,
            });
        }
        if (nParams.date && oParams.date !== nParams.date) {
          this.mTime.FromFormattedString(nParams.date);
        }
    }

  };


}

export default withRouter<Props>(ForecastIndex);
