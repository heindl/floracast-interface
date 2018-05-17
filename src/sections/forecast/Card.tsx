import {computed} from "mobx";
import { observer } from 'mobx-react';
import * as React from 'react';
import ConfidenceScale from "../../iconography/ConfidenceScale";
import {MTime} from "../../stores/date";
import {getGlobalModel} from "../../stores/globals";
import {MLocationUserComputations} from "../../stores/location/computation";
import MLocationUserCoordinates from "../../stores/location/coordinate";
import {MRouter} from "../../stores/router";
import {MUserTaxa} from '../../stores/taxa';
import Taxon from '../../stores/taxon';
import { MView } from '../../stores/view';
import './Card.css';

interface ICardProps {
  taxon: Taxon;
}

@observer
export default class Card extends React.Component<ICardProps> {

    public constructor(props: ICardProps) {
        super(props);
        if (props.taxon.ProtectedArea) {
          props.taxon.ProtectedArea.Hydrate()
        }
      }

  // @computed get ProtectedAreaName(): string {
  //     // correct; computed property will track the `user.name` property
  //     return this.props.taxon.ProtectedArea && this.props.taxon.ProtectedArea.Name || ''
  // }

  public render() {

      const {taxon} = this.props;

    return (
      <div className="forecast-card">

        <div className="forecast-card-taxon">
          <h3 className="forecast-card-taxon-common-name">
            <a onClick={this.navigateToMapTaxon}>{taxon.CommonName}</a>
          </h3>
          <h4 className="forecast-card-taxon-scientific-name">{taxon.ScientificName}</h4>
        </div>

            {(taxon.ProtectedArea.Name !== '') &&
              <div className="forecast-card-protected-area">

                    <h4 className="narrow forecast-card-protected-area-name">
                        <a onClick={this.navigateToMapProtectedArea}>
                            {taxon.ProtectedArea.Name}
                        </a>
                    </h4>
                    {taxon.ProtectedArea.Designation.toLowerCase().indexOf("unknown") === -1 &&
                      <h5 className="forecast-card-protected-area-designation">
                          <i>{taxon.ProtectedArea.Designation}</i>
                      </h5>
                    }

                    <h5 className="forecast-card-protected-area-distance">
                        {Math.round(taxon.ProtectedArea.DistanceKilometers * 0.621371)} miles {this.bearingToProtectedArea}
                    </h5>
                  <ConfidenceScale prediction={taxon.Prediction} style={{
                     zIndex: 0,
                  }}/>
              </div>
            }
          <img
              className="forecast-card-image"
              src={taxon.PhotoURL}
          />

      </div>
    );
  }

    protected navigateToMapProtectedArea = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const coords = getGlobalModel('default', MLocationUserCoordinates);
        const viewStore = getGlobalModel('default', MView);
        const taxaStore = getGlobalModel('default', MUserTaxa);

        viewStore.SetProtectedAreaToken(
            this.props.taxon.ProtectedArea.IndexKey()
        );
        taxaStore.Select(this.props.taxon.NameUsageID);
        getGlobalModel('default', MRouter).NavigateTo({
            params: {
                date: getGlobalModel('default', MTime).DateString,
                lat: coords.Latitude,
                lng: coords.Longitude,
                nameUsageId: this.props.taxon.NameUsageID,
            },
            section: 'map',
        });
    };

    protected navigateToMapTaxon = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const coords = getGlobalModel('default', MLocationUserCoordinates);
        const viewStore = getGlobalModel('default', MView);
        const taxaStore = getGlobalModel('default', MUserTaxa);

        viewStore.ShowTaxonCard();
        taxaStore.Select(this.props.taxon.NameUsageID);
        getGlobalModel('default', MRouter).NavigateTo({
            params: {
                date: getGlobalModel('default', MTime).DateString,
                lat: coords.Latitude,
                lng: coords.Longitude,
                nameUsageId: this.props.taxon.NameUsageID,
            },
            section: 'map',
        });
    };

    @computed
    protected get bearingToProtectedArea() {
        const coordComps = getGlobalModel('default', MLocationUserComputations);
        const bearingFunc = coordComps.BearingToFunc;
        return bearingFunc(
            this.props.taxon.ProtectedArea.Latitude,
            this.props.taxon.ProtectedArea.Longitude).s
    };
}
