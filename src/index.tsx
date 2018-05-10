/*! eslint-disable import/first */

import { configure } from 'mobx';
import * as React from 'react';
import { asyncComponent } from 'react-async-component';
import * as ReactDOM from 'react-dom';
import * as ReactGA from 'react-ga';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import './index.css';
import registerServiceWorker from './registerServiceWorker';

// import {enableLogging} from 'mobx-logger';
//
// enableLogging();

const trackingId = process.env.REACT_APP_GA_TRACKING_ID;
if (trackingId) {
  ReactGA.initialize(trackingId);
}

configure({
  enforceActions: true,
});

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
// import injectTapEventPlugin from 'react-tap-event-plugin';
// injectTapEventPlugin();

const logPageView = (): null => {
  ReactGA.set({ page: window.location.pathname + window.location.search });
  ReactGA.pageview(window.location.pathname + window.location.search);
  return null;
};

const AsyncHome = asyncComponent({
  name: 'Home',
  resolve: () =>
    import(/* webpackChunkName: "Home" */ './sections/general/Home').then(
      (x) => x.default
    ),
});

const AsyncStatic = asyncComponent({
  name: 'Policy',
  resolve: () =>
    import(/* webpackChunkName: "Policy" */ './sections/general/StaticPage').then(
      (x) => x.default
    ),
});

const AsyncMap = asyncComponent({
  name: 'Map',
  resolve: () =>
    import(/* webpackChunkName: "Map" */ './sections/map/Index').then(
      (x) => x.default
    ),
});

const AsyncForecast = asyncComponent({
  name: 'Forecast',
  resolve: () =>
    import(/* webpackChunkName: "ForecastPage" */ './sections/forecast/Index').then(
      (x) => x.default
    ),
});

ReactDOM.render(
  <BrowserRouter>
    <div>
      <Route path="/" component={logPageView} />
      <Switch>
        <Route exact={true} path="/" component={AsyncHome} name="home" />
        {/*<Route*/}
          {/*exact={true}*/}
          {/*path="/forecast"*/}
          {/*render={() => <Redirect to="/?redirect=forecast" />}*/}
          {/*name="forecast-locator"*/}
        {/*/>*/}
        <Route
          path="/forecast/:state?/:city?/:date?"
          component={AsyncForecast}
          name="forecast"
        />
        {/*<Route*/}
          {/*exact={true}*/}
          {/*path="/map"*/}
          {/*render={() => <Redirect to="/?redirect=map" />}*/}
          {/*name="map-locator"*/}
        {/*/>*/}
        <Route
          path="/map/:pointType(occurrences|predictions)?/:coordinates?/:date?/:nameUsageId?"
          component={AsyncMap}
          name="map"
          id="map-container"
        />
        <Route
            path="/:page"
            component={AsyncStatic}
            name="static-page"
            namespace="default"
        />
      </Switch>
    </div>
  </BrowserRouter>,
  document.getElementById('root')
);
registerServiceWorker();
