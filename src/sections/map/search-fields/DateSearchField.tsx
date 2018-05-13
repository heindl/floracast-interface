import * as classnames from 'classnames';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { MTime } from '../../../stores/date';
import { InFocusField, PointType, MView } from '../../../stores/view';

interface IDateFieldProps {
  dateStore?: MTime;
  viewStore?: MView;
  setRef: (ref: HTMLDivElement) => void;
}

@inject('viewStore', 'dateStore')
@observer
export default class DateSearchField extends React.Component<IDateFieldProps> {
  public render() {
    const { viewStore, dateStore } = this.props;
    if (!viewStore || !dateStore) {
      return null;
    }
    return (
      <div
        id="timeline-date-field"
        ref={(r) => r && this.props.setRef(r)}
        className={classnames({
          'search-field': true,
          // "search-field-focused": viewStore.TimelineIsVisible,
          'search-field-unfocused': true,
        })}
        onClick={this.toggleVisibility}
      >
        <div className="search-field-element">
            <div className="search-field-element-content">
          <h4>
            {viewStore.PointType === PointType.Predictions
              ? dateStore.Formatted
              : dateStore.FormattedMonth}
          </h4>
            </div>
        </div>
      </div>
    );
  }

  protected toggleVisibility = () => {
      if (this.props.viewStore) {
          this.props.viewStore.ToggleTimelineVisibility();
          this.props.viewStore.SetInFocusField(InFocusField.FieldNone);
      }
  }
}
