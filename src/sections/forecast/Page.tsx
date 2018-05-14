/* tslint:disable:max-classes-per-file */

import { observer } from 'mobx-react';
import * as React from 'react';
import { MTime } from '../../stores/date';
import MErrors from "../../stores/errors";
import {getGlobalModel} from "../../stores/globals";
import MLocationUserCoordinates from "../../stores/location/coordinate";
import {MRouter} from "../../stores/router";
import {MUserTaxa} from "../../stores/taxa";
import Header from '../general/Header';
import SmallForm from '../general/SmallForm';
import Card from './Card';
import './Page.css';
import ForecastPageTitleColumn from "./TitleColumn";


@observer
class TaxaCardList extends React.Component {
    public render() {
        const taxa = getGlobalModel('default', MUserTaxa).Taxa;

        if (taxa.length > 0) {
            return null
        }
        return (
            <div id="forecast-page-list">
                {taxa.map((t) => {
                    return <Card key={t.NameUsageID} taxon={t} />;
                })}
            </div>
        );
    }
}

@observer
class ForecastPageError extends React.Component {
    public render() {
        const errorMessage = getGlobalModel('default', MErrors).ErrorMessage;
        const taxaCount = getGlobalModel('default', MUserTaxa).Taxa.length;
        const radius = getGlobalModel('default', MLocationUserCoordinates).Radius;

        if (errorMessage) {
            return (
                <div id="forecast-page-error">
                    <h2>Apologies, but something broke ...</h2>
                    <h4 className="paragraph">
                        There was an error while fetching the records. I've been notified
                        and we will try to fix it as soon as possible. So please come back
                        again soon and give it another try.
                    </h4>

                </div>
            )
        }
        if (taxaCount === 0) {
            return (
                <div id="forecast-page-error">
                    <h2>Mighty quiet out there ...</h2>
                    <h4 className="paragraph">
                        Apologies, but our model hasn't forecast anything within{' '}
                        {Math.round(radius * 0.621371)} miles of you today.
                    </h4>
                    <h4 className="paragraph">
                        Maybe try clicking backward or forward a few days or check our{' '}
                        <a onClick={this.navigateToMap} style={{ textDecoration: 'underline' }}>
                            interactive map
                        </a>{' '}
                        for a wider search.
                    </h4>
                </div>
            )
        }
        return null
    }

    protected navigateToMap = () => {
        const coords = getGlobalModel('default', MLocationUserCoordinates);
        getGlobalModel('default', MRouter).NavigateTo({
            params: {
                date: getGlobalModel('default', MTime).DateString,
                lat: coords.Latitude,
                lng: coords.Longitude,
            },
            section: 'map',
        });
    };
}

@observer
export default class ForecastPage extends React.Component {

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    getGlobalModel('default', MErrors).Report(error);
  }

  public render() {

      const isLoading = getGlobalModel('default', MUserTaxa).IsLoading;

    return (
        <div id="forecast-page-container">
          <div id="forecast-page-header">
            <Header />
          </div>
          <ForecastPageTitleColumn />
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
            {isLoading &&
                <div id="forecast-page-content">
                    <div id="forecast-page-loading" />;
                </div>
            }

            {!isLoading &&
            <div id="forecast-page-content">
                <ForecastPageError/>
                <TaxaCardList/>
            </div>
            }

        </div>
    );
  }

}
