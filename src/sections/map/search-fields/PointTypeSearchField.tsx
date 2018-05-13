import * as classnames from 'classnames';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { MErrors } from '../../../stores/errors';
import { InFocusField, PointType, MView } from '../../../stores/view';

interface IViewStoreProps {
  viewStore?: MView;
  errorStore?: MErrorStore;
  setRef: (ref: HTMLDivElement) => void;
}

@inject('viewStore', 'errorStore')
@observer
export default class PointTypeSearchField extends React.Component<
  IViewStoreProps
> {
  public readonly subtext = {
    [PointType.Occurrences]: 'Places they were found',
    [PointType.Predictions]: "Where we'd look",
  };

  constructor(props: IViewStoreProps) {
    super(props);
  }

  public render() {
    const { viewStore } = this.props;
    if (!viewStore) {
      return null;
    }
    const isInFocus = viewStore.InFocusField === InFocusField.FieldPointType;
    const deselectedPointType =
      viewStore.PointType === PointType.Occurrences
        ? PointType.Predictions
        : PointType.Occurrences;

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
          <h4>{viewStore.PointType}</h4>
          <h5 className="search-field-highlight">
            {this.subtext[viewStore.PointType]}
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

    protected deselectedValue = () => {
        if (!this.props.viewStore || this.props.viewStore.PointType === PointType.Occurrences) {
            return PointType.Predictions
        }
        return PointType.Occurrences;
    };

    protected isInFocus = () => {
        return this.props.viewStore && this.props.viewStore.InFocusField === InFocusField.FieldPointType
    };

    protected selectAlternate = () => {
        if (this.props.viewStore) {
            this.props.viewStore.SetPointType(this.deselectedValue());
            this.props.viewStore.SetInFocusField(InFocusField.FieldNone);
        }
    };

    protected toggleVisibility = () => {
        if (this.props.viewStore) {
            this.props.viewStore.SetInFocusField(
                this.isInFocus() ? InFocusField.FieldNone : InFocusField.FieldPointType
            );
        }
    }
}
