/* tslint:disable:max-classes-per-file */
import * as AlgoliaSearch from 'algoliasearch';
import * as classnames from 'classnames';
import * as _ from 'lodash';
import { inject, observer } from 'mobx-react';
import { toWords } from 'number-to-words';
import * as React from 'react';
import { MErrors } from '../../../stores/errors';
import { TaxaStore } from '../../../stores/taxa';
import { InFocusField, MView } from '../../../stores/view';

interface IAlgoliaTaxaResponse {
  CommonName?: string;
  NameUsageID: string;
  ReferenceCount?: number;
  ScientificName?: string;
  objectID?: number;
  Thumbnail?: string;
  TotalOccurrenceCount?: number;
}

interface ITaxaSearchFieldProps {
  taxaStore?: TaxaStore;
  viewStore?: MView;
  errorStore?: MErrorStore;
  setRef: (ref: HTMLDivElement) => void;
}

interface ITaxaSearchFieldState {
  algoliaResults: IAlgoliaTaxaResponse[];
  inputValue?: string;
}

@inject('taxaStore', 'errorStore', 'viewStore')
@observer
export default class TaxaSearchField extends React.Component<
  ITaxaSearchFieldProps,
  ITaxaSearchFieldState
> {
  protected algoliaClient: AlgoliaSearch.Client;
  protected algoliaIndex: AlgoliaSearch.Index;

  constructor(props: ITaxaSearchFieldProps) {
    super(props);
    this.algoliaClient = AlgoliaSearch(
      process.env.REACT_APP_FLORACAST_ALGOLIA_APPLICATION_ID || '',
      process.env.REACT_APP_FLORACAST_ALGOLIA_API_KEY || ''
    );
    this.algoliaIndex = this.algoliaClient.initIndex('NameUsages');

    this.handleChange = this.handleChange.bind(this);
    this.state = { algoliaResults: [], inputValue: '' };
  }

  public handleChange = (e: React.FormEvent<HTMLInputElement>) => {
    const { errorStore } = this.props;
    if (!errorStore) {
      return;
    }

    const searchValue =
      !e || e.currentTarget.value.trim() === ''
        ? undefined
        : e.currentTarget.value;

    this.setState({ inputValue: searchValue });

    if (!searchValue) {
      return this.setState({
        algoliaResults: [],
      });
    }

    this.algoliaIndex
      .search(searchValue)
      .then((res: AlgoliaSearch.Response) => {
        this.setState({ algoliaResults: res.hits });
      })
      .catch((err) => {
        this.setState({ algoliaResults: [] });
        errorStore.Report(err);
      });
  };



  public render() {
    const { taxaStore, viewStore } = this.props;
    if (!taxaStore || !viewStore) {
      return null;
    }

    if (!taxaStore.Selected || !taxaStore.Selected.CommonName) {
      return null;
    }

    const isInFocus = viewStore.InFocusField === InFocusField.FieldTaxon;

    // const initialOptions: Option[] = taxaStore.Selected ? [{
    //             label: taxaStore.Selected.CommonName,
    //             value: taxaStore.Selected.NameUsageID
    //         }] : [];

    return (
      <div
        id="taxa-search-field"
        ref={(r) => r && this.props.setRef(r)}
        className={classnames({
          'search-field': true,
          'search-field-focused': isInFocus,
          'search-field-unfocused': !isInFocus,
        })}
      >
        {!isInFocus && (
          <div
            className="search-field-element"
            onClick={this.toggleVisibility}
          >
            <div className="search-field-element-content">
              <h4>{`${taxaStore.Selected.CommonName}`}</h4>
              <h5 className="search-field-highlight">
                {taxaStore.Selected.ScientificName}
                  {!viewStore.TaxonCardVisible &&
                      <span>|</span>
                  }
                  {!viewStore.TaxonCardVisible &&
                    <a
                        style={{zIndex: 2000}}
                        onClick={this.showTaxonCard}
                    >More info</a>
                  }

              </h5>
            </div>
          </div>
        )}

        {isInFocus && (
            <div className="search-field-elements">
              <div className="search-field-element">
                  <div className="search-field-element-content">
                    <input
                        autoFocus={true}
                        type="text"
                      onChange={this.handleChange}
                      value={this.state.inputValue}
                      placeholder={`${taxaStore.Selected.CommonName}`}
                    />
                  </div>
              </div>

                {this.state.algoliaResults.map((t) => {
                    return (
                        <TaxaFieldElement
                          commonName={t.CommonName || ''}
                          photo={t.Thumbnail || ''}
                          nameUsageId={t.NameUsageID}
                          key={t.NameUsageID}
                          scientificName={t.ScientificName || ''}
                        />
                    );
                })}
                <div className="search-field-element search-field-taxa-summary">
                    {taxaStore.Taxa.length > 0 && (
                        <div className="search-field-element-content">
                        <h4 className="narrow">
                            {_.capitalize(toWords(taxaStore.Taxa.length))} species nearby today:
                        </h4>
                        </div>
                    )}
                    {taxaStore.Taxa.length === 0 && <h5>No species nearby on this date.</h5>}
                    <hr/>
                </div>
                {taxaStore.Taxa.map((t) => {
                    return (
                        <TaxaFieldElement
                            commonName={t.CommonName}
                            photo={t.PhotoURL}
                            nameUsageId={t.NameUsageID}
                            key={t.NameUsageID}
                            scientificName={t.ScientificName}
                        />
                    );
                })}
            </div>
        )}
      </div>
    );
  }

  protected toggleVisibility = () => {
      if (this.props.viewStore) {
          const isInFocus = this.props.viewStore.InFocusField === InFocusField.FieldTaxon;
          this.props.viewStore.SetInFocusField(isInFocus ? InFocusField.FieldNone: InFocusField.FieldTaxon);
      }
  }

  protected showTaxonCard = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.props.viewStore) {
        this.props.viewStore.ShowTaxonCard();
      }
  }

}

interface ITaxaFieldElementProps{
  commonName: string,
  photo: string,
  nameUsageId: string;
  scientificName: string;
    taxaStore?: TaxaStore;
    viewStore?: MView;
}

@inject('taxaStore', 'viewStore')
@observer
class TaxaFieldElement extends React.Component<ITaxaFieldElementProps> {
  public render() {
    return (
      <div
          className="search-field-element"
          key={this.props.nameUsageId}
          onClick={this.selectTaxon}
      >
          <img src={this.props.photo} />
          <div className="search-field-element-content">
              <h4>{this.props.commonName}</h4>
              <h5 className="search-field-highlight">{this.props.scientificName}</h5>
          </div>
      </div>
    )
  }

   protected selectTaxon = () => {

        if (this.props.taxaStore) {
            this.props.taxaStore.Select(this.props.nameUsageId);
        }

       if (this.props.viewStore) {
           this.props.viewStore.SetInFocusField(InFocusField.FieldNone);
       }

       // Clear input.
       this.setState({ inputValue: '' });
    }
}