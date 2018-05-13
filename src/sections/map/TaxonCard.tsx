import { inject, observer } from 'mobx-react';
import * as React from 'react';
import Icon from '../../iconography/Icon';
import {Close, Loading} from '../../iconography/Icons';
import { TaxaStore } from '../../stores/taxa';
import {MView} from "../../stores/view";
import './TaxonCard.css';

interface ITaxonCardProps {
  taxaStore?: TaxaStore;
  viewStore?: MView;
}

@inject('taxaStore', 'viewStore')
@observer
export default class TaxonCard extends React.Component<ITaxonCardProps> {
  public render() {
    const { taxaStore, viewStore } = this.props;
    if (!taxaStore || !viewStore) {
      return null;
    }

    if (!viewStore.TaxonCardVisible || !taxaStore.Selected) {
      return null;
    }

    if (taxaStore.Selected.FetchIsPending) {
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
          onClick={viewStore.HideTaxonCard}
        />
        <div className="map-taxon-card-media">
          <img src={taxaStore.Selected.PhotoURL} />
            {/*<div className="map-taxon-card-media-caption"></div>*/}
        </div>
        <div className="map-taxon-card-content">
          <h3>{taxaStore.Selected.CommonName}</h3>
          <h4>{taxaStore.Selected.ScientificName}</h4>
            {taxaStore.Selected.Description &&
                <div>
                  <h6 className="paragraph">{taxaStore.Selected.Description.Text}</h6>
                  <h6 style={{fontStyle: "italic", opacity: 0.4}}>
                      {taxaStore.Selected.Description.Citation}
                  </h6>
                </div>
            }
        </div>
      </div>
    );
  }


}
