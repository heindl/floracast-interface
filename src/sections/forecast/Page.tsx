import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../iconography/Icon';
import { ChevronLeft, ChevronRight } from '../../iconography/Icons';
import { CoordinateStore } from '../../stores/coordinates';
import { MTime } from '../../stores/date';
import { MErrors } from '../../stores/errors';
import { TaxaStore } from '../../stores/taxa';
import Header from '../general/Header';
import SmallForm from '../general/SmallForm';
import Card from './Card';
import './Page.css';

interface IForecastPageProps {
  coordinateStore?: CoordinateStore;
  errorStore?: MErrorStore;
  taxaStore?: TaxaStore;
  dateStore?: MTime;
}

@inject('coordinateStore', 'errorStore', 'taxaStore', 'dateStore')
@observer
export default class ForecastPage extends React.Component<IForecastPageProps> {
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (!this.props.errorStore) {
      return;
    }
    this.props.errorStore.Report(error);
  }

  public render() {
    const { dateStore, coordinateStore } = this.props;

    if (!dateStore || !coordinateStore) {
      return null;
    }

    return (
        <div id="forecast-page-container">
          <div id="forecast-page-header">
            <Header />
          </div>
          <div id="forecast-page-title">
              <h3>Predictions</h3>
              <h4><i>for</i></h4>
              <h3>Mushrooms</h3>
            <h4><i>near</i></h4>
            <h3>
              {coordinateStore.City}, {coordinateStore.State}
            </h3>
            <h5 style={{opacity: 0.65}}>{coordinateStore.DMS}</h5>
            <h4><i>on</i></h4>
            <div className="forecast-page-header-date-field">
              <Icon
                height={'20px'}
                width={'20px'}
                icon={ChevronLeft}
                onClick={this.decrementDate}
                color="#e0e0e0"
                activeColor="#000"
              />
              <h3 style={{ padding: '0 25px' }}>
                {dateStore.Formatted}
              </h3>
              <Icon
                height={'20px'}
                width={'20px'}
                icon={ChevronRight}
                onClick={this.incrementDate}
                color="#e0e0e0"
                activeColor="#000"
              />
            </div>
          </div>
            <div id="forecast-page-form">
                <SmallForm />
            </div>
          {/*{[1, 2, 3].map(i => {*/}
          {/*return (*/}
          {/*<svg*/}
          {/*key={i}*/}
          {/*className="background-circle"*/}
          {/*viewBox="0 0 200 200"*/}
          {/*xmlns="http://www.w3.org/2000/svg"*/}
          {/*>*/}
          {/*<circle cx="100" cy="100" r="97" strokeWidth={3} />*/}
          {/*</svg>*/}
          {/*);*/}
          {/*})}*/}
          <div id="forecast-page-content">{this.content()}</div>
        </div>
    );
  }

    protected content = (): React.ReactNode | null => {
        const { dateStore, coordinateStore, errorStore, taxaStore } = this.props;
        if (!dateStore || !coordinateStore || !errorStore || !taxaStore) {
            return null;
        }

        if (taxaStore.IsLoading) {
            return <div id="forecast-page-loading" />;
        }

        if (errorStore.ErrorMessage) {
            return (
                <div id="forecast-page-error">
                    <h2>Apologies, but something broke ...</h2>
                    <h4 className="paragraph">
                        There was an error while fetching the records. I've been notified
                        and we will try to fix it as soon as possible. So please come back
                        again soon and give it another try.
                    </h4>
                </div>
            );
        }

        // TODO: Scan past or near days for those that would have a result.
        if (taxaStore.Taxa.length === 0) {
            return (
                <div id="forecast-page-error">
                    <h2>Mighty quiet out there ...</h2>
                    <h4 className="paragraph">
                        Apologies, but our model hasn't forecast anything within{' '}
                        {Math.round(coordinateStore.Radius * 0.621371)} miles of you today.
                    </h4>
                    <h4 className="paragraph">
                        Maybe try clicking backward or forward a few days or check our{' '}
                        <Link to={`/map/predictions/${coordinateStore.Formatted}/${dateStore.DateString}`} style={{ textDecoration: 'underline' }}>
                            interactive map
                        </Link>{' '}
                        for a wider search.
                    </h4>
                </div>
            );
        }

        return (
            <div id="forecast-page-list">
                {taxaStore.Taxa.map((t) => {
                    return <Card key={t.NameUsageID} taxon={t} />;
                })}
            </div>
        );
    };

    protected decrementDate = () => {
      if (this.props.dateStore) {
          this.props.dateStore.Shift(-1)
      }
    }
    protected incrementDate = () => {
        if (this.props.dateStore) {
            this.props.dateStore.Shift(1)
        }
    }
}
