import * as classnames from 'classnames';
import { observer } from 'mobx-react';
import * as React from 'react';
import { MTime } from '../../../stores/date';
import {getGlobalModel} from "../../../stores/globals";
import { InFocusField, MView, PointType } from '../../../stores/view';

interface IDateFieldProps {
  setRef: (ref: HTMLDivElement) => void;
}

@observer
export default class DateSearchField extends React.Component<IDateFieldProps> {
  public render() {

      const pointType = getGlobalModel('default', MView).PointType;
      const mTime = getGlobalModel('default', MTime);
      const formattedDate = pointType === PointType.Predictions ? mTime.Formatted : mTime.FormattedMonth;

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
            {formattedDate}
          </h4>
            </div>
        </div>
      </div>
    );
  }

  protected toggleVisibility = () => {
      const mView = getGlobalModel('default', MView);
      mView.ToggleTimelineVisibility();
      mView.SetInFocusField(InFocusField.FieldNone);
  }
}
