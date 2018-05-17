import { observer } from 'mobx-react';
import * as React from 'react';
import Icon from '../../iconography/Icon';
import {Close, Loading} from '../../iconography/Icons';
import {getGlobalModel} from "../../stores/globals";
import {MMapTaxa} from "../../stores/taxa";
import {MView} from "../../stores/view";
import './TaxonCard.css';

@observer
export default class TaxonCard extends React.Component {
  public render() {

      const mView = getGlobalModel('default', MView);

      const isVisible = mView.TaxonCardVisible;
      const taxon = getGlobalModel('default', MMapTaxa).Selected;

    if (!isVisible || !taxon) {
      return null;
    }

    if (taxon.FetchIsPending) {
      return (
        <div className="map-taxon-card">
          <Icon icon={Loading} width="50%" height="50%" />
        </div>
      );
    }
    return (
      <div className='map-taxon-card'>
        <Icon
          icon={Close}
          style={{position: 'absolute', top: '5px', right: '5px', cursor: "pointer"}}
          color="#999"
          activeColor="#000"
          height={'15px'}
          width={'15px'}
          onClick={this.hideTaxonCard}
        />
        <div className="map-taxon-card-media">
          <img src={taxon.PhotoURL} />
            {/*<div className="map-taxon-card-media-caption"></div>*/}
        </div>
        <div className="map-taxon-card-content">
          <h3>{taxon.CommonName}</h3>
          <h4>{taxon.ScientificName}</h4>
            {taxon.Description &&
                <div>
                  <h6 className="paragraph">{taxon.Description.Text}</h6>
                  <h6 style={{fontStyle: "italic", opacity: 0.4}}>
                      {taxon.Description.Citation}
                  </h6>
                </div>
            }
        </div>
      </div>
    );
  }

  protected hideTaxonCard = () => {
      getGlobalModel('default', MView).HideTaxonCard();
  }

}
