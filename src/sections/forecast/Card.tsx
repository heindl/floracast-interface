import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import ConfidenceScale from "../../iconography/ConfidenceScale";
import { CoordinateStore } from '../../stores/coordinates';
import { ErrorStore } from '../../stores/errors';
import { RouterStore } from '../../stores/router';
import { TaxaStore } from '../../stores/taxa';
import Taxon from '../../stores/taxon';
import { ViewStore } from '../../stores/view';
import './Card.css';

interface ICardProps {
  taxon: Taxon;
  errorStore?: ErrorStore;
  viewStore?: ViewStore;
  coordinateStore?: CoordinateStore;
  taxaStore?: TaxaStore;
}

@inject('viewStore', 'taxaStore', 'coordinateStore')
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
    const { taxon, viewStore, coordinateStore } = this.props;
    if (!viewStore || !coordinateStore) {
      return;
    }

      const bearingFunc = coordinateStore.BearingToFunc;

    const mapPath = RouterStore.FormMapPath({
      coordStr: coordinateStore.Formatted,
      pointType: viewStore.PointType,
    });

    return (
      <div className="forecast-card">

        <div className="forecast-card-taxon">
          <h3 className="forecast-card-taxon-common-name">
            <Link onClick={this.selectTaxon} to={mapPath}>{taxon.CommonName}</Link>
          </h3>
          <h4 className="forecast-card-taxon-scientific-name">{taxon.ScientificName}</h4>
        </div>

            {(taxon.ProtectedArea.Name !== '') &&
              <div className="forecast-card-protected-area">

                    <h4 className="narrow forecast-card-protected-area-name">
                        <Link onClick={this.selectProtectedArea} to={mapPath}>
                            {taxon.ProtectedArea.Name}
                        </Link>
                    </h4>
                    {taxon.ProtectedArea.Designation.toLowerCase().indexOf("unknown") === -1 &&
                      <h5 className="forecast-card-protected-area-designation">
                          <i>{taxon.ProtectedArea.Designation}</i>
                      </h5>
                    }

                    <h5 className="forecast-card-protected-area-distance">
                        {Math.round(taxon.ProtectedArea.DistanceKilometers * 0.621371)} miles {bearingFunc(taxon.ProtectedArea.Latitude, taxon.ProtectedArea.Longitude).s}
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

  protected selectTaxon = (e: React.MouseEvent<HTMLAnchorElement>) => {
      const { taxaStore, viewStore} = this.props;
      if (!taxaStore || !viewStore) {
          return;
      }
      viewStore.ShowTaxonCard();
      taxaStore.Select(this.props.taxon.NameUsageID);
  }

    protected selectProtectedArea = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (this.props.viewStore) {
            this.props.viewStore.SetProtectedAreaToken(
                this.props.taxon.ProtectedArea.TokenID || ''
            );
        }
    }
}
