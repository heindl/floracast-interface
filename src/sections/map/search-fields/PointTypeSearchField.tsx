import * as classnames from 'classnames';
import {computed} from "mobx";
import { observer } from 'mobx-react';
import * as React from 'react';
import {getGlobalModel} from "../../../stores/globals";
import {InFocusField, MView, PointType} from '../../../stores/view';

interface IViewStoreProps {
  setRef: (ref: HTMLDivElement) => void;
}

@observer
export default class PointTypeSearchField extends React.Component<
  IViewStoreProps
> {
  public readonly subtext = {
    [PointType.Occurrences]: 'Places they were found',
    [PointType.Predictions]: "Where we'd look",
  };

  public render() {

    const isInFocus = this.isInFocus;
    const deselectedPointType = this.deselectedValue;
    const pointType = getGlobalModel('default', MView).PointType;

    return (
      <div
        id="point-type-field"
        ref={(r) => r && this.props.setRef(r)}
        className={classnames({
          'search-field': true,
          'search-field-focused': isInFocus,
          'search-field-unfocused': !isInFocus,
        })}
      >
        <div
          className="search-field-element"
          onClick={this.toggleVisibility}
        >
            <div className="search-field-element-content">
          <h4>{pointType}</h4>
          <h5 className="search-field-highlight">
            {this.subtext[pointType]}
          </h5>
            </div>
        </div>
        {isInFocus && (
          <div
            className="search-field-element"
            onClick={this.selectAlternate}
          >
              <div className="search-field-element-content">
            <h4>{deselectedPointType}</h4>
            <h5 className="search-field-highlight">
              {this.subtext[deselectedPointType]}
            </h5>
              </div>
          </div>
        )}
      </div>
    );
  }

  @computed
    protected get deselectedValue(): PointType {
        const pointType = getGlobalModel('default', MView).PointType;
        if (pointType === PointType.Occurrences) {
            return PointType.Predictions
        }
        return PointType.Occurrences;
    };

    @computed
    protected get isInFocus(): boolean {
        const inFocusField = getGlobalModel('default', MView).InFocusField;
        return inFocusField === InFocusField.FieldPointType
    };


    protected selectAlternate = () => {
        const mView = getGlobalModel('default', MView);
        mView.SetPointType(this.deselectedValue);
        mView.SetInFocusField(InFocusField.FieldNone);
    };

    protected toggleVisibility = () => {
        getGlobalModel('default', MView).SetInFocusField(
            this.isInFocus ? InFocusField.FieldNone : InFocusField.FieldPointType
        )
    }
}
