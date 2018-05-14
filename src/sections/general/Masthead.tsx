// import { History } from 'history';
/* tslint:disable:no-var-requires*/
import { observer } from 'mobx-react';
const Vibrant = require('node-vibrant');
import * as classnames from 'classnames';
import * as _ from 'lodash';
import {computed} from "mobx";
import {Palette} from "node-vibrant/lib/color";
import * as React from 'react';
import {
  default as PlacesAutocomplete,
  Suggestion,
} from 'react-places-autocomplete';
import Icon from "../../iconography/Icon";
import {Search} from "../../iconography/Icons";
import MErrors from "../../stores/errors";
import {getGlobalModel} from "../../stores/globals";
import MLocationUserCoordinates from "../../stores/location/coordinate";
import MLocationPlace from "../../stores/location/place";
import {MRouter} from "../../stores/router";
import Header from '../general/Header';
import './Masthead.css';


function importRandomImage(): string {
    const i = Math.floor(Math.random() * 14);
    return require(`../../images/masthead/${i}.jpg`);
}

interface IMastheadState {
  address?: string;
  logoScheme: string;
  mastScheme: string;
  backgroundImage: string;
  buttonHover: boolean;
}

@observer
class Masthead extends React.Component<{}, IMastheadState> {
  constructor(props: {}) {
      super(props);
    this.state = {
        backgroundImage: importRandomImage(),
        buttonHover: false,
        logoScheme: 'white',
        mastScheme: 'white',
    };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      getGlobalModel('default', MErrors).Report(error);
  }

  public render() {

    return (
      <div id="masthead-container">
          <img
              src={this.state.backgroundImage}
              onLoad={this.setMastheadColorFromPhoto}
          />
        <Header color={this.state.logoScheme} activeColor={this.state.mastScheme} />
        <div id="masthead-content" className={classnames({'scheme-dark': this.state.mastScheme === '#000'})}>
          <h1 id="intro" className="narrow heavy" style={{color: this.state.mastScheme}}>
            {this.redirectIndex() === -1
              ? 'What will you find outside?'
              : 'Where are you?'}
          </h1>
        <div className="masthead-form">
          <PlacesAutocomplete
            renderSuggestion={this.autoCompleteItem}
            // root, input, autocompleteContainer, autocompleteItem, autocompleteItemActive, googleLogoContainer, googleLogoImage
            classNames={{
              autocompleteContainer:
                'masthead-autocomplete-container narrow',
              autocompleteItem: 'masthead-autocomplete-item narrow',
              autocompleteItemActive:
                'masthead-autocomplete-item-active narrow',
              input: `masthead-form-control`,
              root: 'masthead-form-group',
            }}
            inputProps={{
              onChange: this.handleInputChange,
              placeholder: 'City, State',
              type: 'search',
              value: this.inputText(),
            }}
            onError={this.handleError}
            onSelect={this.handleSelect}
            onEnterKeyDown={this.handleSelect}
            options={{
              componentRestrictions: { country: ['us'] },
              types: ['(cities)'],
            }}
          />
          <button
              className="masthead-form-button"
              style={{
                  backgroundColor: this.state.buttonHover ? this.state.mastScheme : "transparent",
                  border: this.state.buttonHover ?  "2px solid transparent" : `2px solid ${this.state.mastScheme}`,
              }}
            onClick={this.handleButtonSelect}
              onMouseEnter={this.toggleButtonHover}
              onMouseLeave={this.toggleButtonHover}
            type="submit"
          >
              <Icon
                  icon={Search}
                  selected={this.state.buttonHover}
                  style={{opacity: this.state.buttonHover ? 0.7 : 1}}
                  activeColor={this.state.logoScheme}
                  color={this.state.mastScheme} />
          </button>
        </div>
        </div>
        <svg
          className="masthead-circle"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="100" r="97" stroke={this.state.mastScheme} strokeWidth={3} />
        </svg>
      </div>
    );
  }

  protected autoCompleteItem = (s: Suggestion) => {
      return (
          <div>
              <strong>{s.formattedSuggestion.mainText}</strong>
              {', '}
              <small>
                  {s.formattedSuggestion.secondaryText.replace(', United States', '')}
              </small>
          </div>
      );
  };


    protected redirectIndex = () => {
        return window.location.href.indexOf('redirect=');
    };

    protected toggleButtonHover = () => {
        this.setState((prev) => {
            return {buttonHover: !prev.buttonHover}
        })
    };


    @computed
    protected inputText = (): string => {

        const mPlace = getGlobalModel('default', MLocationPlace);

        if (this.state.address && this.state.address.trim() !== '') {
            return this.state.address
        }

        if (mPlace.Locality && mPlace.AdminAreaLong) {
            return `${mPlace.Locality}, ${mPlace.AdminAreaLong}`
        }
        return ''
    };

    protected handleInputChange = (i: string) => {
        this.setState({address: i})
    };

    protected handleError = (status: string, clearSuggestion: () => void) => {
        getGlobalModel('default', MErrors).Report(Error(status));
        clearSuggestion();
    }

    protected setMastheadColorFromPhoto = (e: React.SyntheticEvent<HTMLImageElement>) => {
        Vibrant.from(e.target).build().getPalette().then((p: Palette) => {

            const res: Array<[string, string, string, number]> = [];

            if (p.DarkVibrant) {
                res.push(["dark", p.DarkVibrant.getTitleTextColor(), p.DarkVibrant.getHex(), p.DarkVibrant.getPopulation()])
            }
            if (p.Vibrant) {
                res.push(["light", p.Vibrant.getTitleTextColor(), p.Vibrant.getHex(), p.Vibrant.getPopulation()])
            }
            if (p.Muted) {
                res.push(["light", p.Muted.getTitleTextColor(), p.Muted.getHex(), p.Muted.getPopulation()])
            }
            if (p.DarkMuted) {
                res.push(["dark", p.DarkMuted.getTitleTextColor(), p.DarkMuted.getHex(), p.DarkMuted.getPopulation()])
            }
            if (p.LightMuted) {
                res.push(["light", p.LightMuted.getTitleTextColor(), p.LightMuted.getHex(), p.LightMuted.getPopulation()])
            }
            if (p.LightVibrant) {
                res.push(["light", p.LightVibrant.getTitleTextColor(), p.LightVibrant.getHex(), p.LightVibrant.getPopulation()])
            }

            res.sort((a, b) => {
                return  b[3] - a[3]
            });

            this.setState({
                mastScheme: res[0][1]
            });

            const r = _.remove(res, (n) => n[0] === (res[1][0] === "dark" ? "light": "dark"));

            this.setState({
                logoScheme: r[r.length-1][2],
            });
        })
    };

    protected handleButtonSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
        this.handleSelect(this.inputText())
    };

    protected handleSelect = (address?: string, placeId?: string) => {

        const mCoords = getGlobalModel('default', MLocationUserCoordinates);
        const mPlace = getGlobalModel('default', MLocationPlace);

        if (!address || address.trim() === '') {
            return
        }

        const hasForecastRedirect =
            this.redirectIndex() === -1 ||
            window.location.href.substr(
                this.redirectIndex() + 'redirect='.length,
                1
            ) === 'f';

        if (hasForecastRedirect) {
            const [city, state] = address.split(',');
            if (!city || !state) {
                return;
            }
            getGlobalModel('default', MRouter).NavigateTo({
                params: {
                    adminAreaLong: state,
                    locality: city,
                },
                section: 'forecast',
            });
        } else {
            mPlace.ReverseGeocode({address, placeId});
            getGlobalModel('default', MRouter).NavigateTo({
                params: {
                    lat: mCoords.Latitude,
                    lng: mCoords.Longitude,
                },
                section: 'map',
            });
        }
    };

}

export default Masthead;
