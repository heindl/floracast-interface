import * as React from "react";
import {getGlobalModel} from "../../../stores/globals";
import {MMapTaxa} from "../../../stores/taxa";
import {InFocusField, MView} from "../../../stores/view";

interface ITaxaFieldElementProps{
    commonName: string,
    photo: string,
    nameUsageId: string;
    scientificName: string;
}

export default class TaxaFieldElement extends React.Component<ITaxaFieldElementProps> {
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
        getGlobalModel('default', MMapTaxa).Select(this.props.nameUsageId);
        getGlobalModel('default', MView).SetInFocusField(InFocusField.FieldNone);
    }
}