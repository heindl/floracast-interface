/* tslint:disable:max-classes-per-file */
import * as classnames from 'classnames';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { toWords } from 'number-to-words';
import * as React from 'react';
import {getGlobalModel} from "../../../stores/globals";
import {MMapTaxa} from "../../../stores/taxa";
import { InFocusField, MView } from '../../../stores/view';
import AlgoliaNameUsageResults from "./AlgoliaNameUsageResults";
import TaxaFieldElement from "./TaxaSearchElement";

@observer
class TaxaModelNameUsageResults extends React.Component{
    public render() {
        const taxa = getGlobalModel('default', MMapTaxa).Taxa;
        return (

            <div>
                <div className="search-field-element search-field-taxa-summary">
                    {taxa.length > 0 && (
                        <div className="search-field-element-content">
                            <h4 className="narrow">
                                {_.capitalize(toWords(taxa.length))} species
                                nearby today:
                            </h4>
                        </div>
                    )}
                    {taxa.length === 0 &&
                        <h5>No species nearby on this date.</h5>
                    }
                    <hr/>
                </div>
                {taxa.map((t) => {
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
        )
    }
}

interface ITaxaSearchFieldProps {
    setRef: (ref: HTMLDivElement) => void;
}

interface ITaxaSearchFieldState {
    inputValue?: string;
}

@observer
export default class TaxaSearchField extends React.Component<
  ITaxaSearchFieldProps,
  ITaxaSearchFieldState
> {

    constructor(props: ITaxaSearchFieldProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.state = {inputValue: ''};
    }

    public handleChange = (e: React.FormEvent<HTMLInputElement>) => {
        const searchValue =
            !e || e.currentTarget.value.trim() === ''
                ? undefined
                : e.currentTarget.value;

        this.setState({inputValue: searchValue});
    };

    public render() {

        const taxon = getGlobalModel('default', MMapTaxa).Selected;
        const mView = getGlobalModel('default', MView);

        if (!taxon || !taxon.CommonName) {
            return null;
        }

        const isInFocus = mView.InFocusField === InFocusField.FieldTaxon;

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
                            <h4>{`${taxon.CommonName}`}</h4>
                            <h5 className="search-field-highlight">
                                {taxon.ScientificName}
                                {!mView.TaxonCardVisible &&
                                <span>|</span>
                                }
                                {!mView.TaxonCardVisible &&
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
                                    placeholder={`${taxon.CommonName}`}
                                />
                            </div>
                        </div>
                        <AlgoliaNameUsageResults inputValue={this.state.inputValue}/>
                        <TaxaModelNameUsageResults/>
                    </div>
                )}
            </div>
        );
    }

    protected toggleVisibility = () => {
        const viewStore = getGlobalModel('default', MView);
        const isInFocus = viewStore.InFocusField === InFocusField.FieldTaxon;
        viewStore.SetInFocusField(isInFocus ?
            InFocusField.FieldNone :
            InFocusField.FieldTaxon
        );
    };

    protected showTaxonCard = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        e.stopPropagation();
        getGlobalModel('default', MView).ShowTaxonCard();
    }

}