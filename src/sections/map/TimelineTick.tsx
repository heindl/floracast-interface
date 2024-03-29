// import TimelineTickPopper from './Poppers/TimelineTickPopper';
import * as classNames from 'classnames';
import * as React from 'react';
import {MTime} from "../../stores/date";
import {getGlobalModel} from "../../stores/globals";
import { ITickMark } from '../../stores/timeline';
import './TimelineTick.css';

const maxCircleRadius = 61.8;
const minCircleRadius = 38.2;

interface ITickProps {
  mark: ITickMark;
  selected?: boolean;
}

interface ITickState {
  hover: boolean;
}

export default class TimelineTick extends React.Component<
  ITickProps,
  ITickState
> {
  // public svgHoverElement?: HTMLDivElement;

  constructor(props: ITickProps) {
    super(props);
    this.state = {
      hover: false,
    };
  }

  // _on_mouse_over = () => {
  //     this.tooltipTimeout = window.setTimeout(
  //         this._set_hovered.bind(this, true),
  //         250
  //     );
  // };
  //
  // _on_mouse_out = () => {
  //     window.clearTimeout(this.tooltipTimeout);
  //     return this._set_hovered(false);
  // };

  public render() {
    const { mark } = this.props;



    const isBeginningOfMonth = mark.moment.date() <= 7;
    // const isBeginningOfYear = mark.moment.month() === 0 && isBeginningOfMonth;

    const radius = mark.scaledPointCount ?
        ((maxCircleRadius * mark.scaledPointCount) + minCircleRadius) :
        minCircleRadius;
    let opacity = (mark.scaledPredictionMean || 0) * 0.8;
    const fill = mark.fill;

    const isActive = this.state.hover || this.props.selected;

    if (isActive && opacity === 0) {
      opacity = 0.5
    }




      return (
      <div
        className="tick"
        style={{ left: mark.x }}
        onClick={this.setDate}
        onMouseEnter={this.toggleButtonHover}
        onMouseLeave={this.toggleButtonHover}
        // ref={(r) => {
        //   if (r) {
        //     this.svgHoverElement = r;
        //   }
        // }}
      >
        <h6 className="tick-month">
          {isBeginningOfMonth && mark.moment.format('MMM')}
        </h6>

        <svg viewBox="0 0 200 200">
          <g>
            <line
              x1={100}
              x2={100}
              y1={75}
              y2={125}
              stroke="#777"
              strokeWidth={isBeginningOfMonth ? 3 : 1}
            />
            {isActive && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                opacity={opacity}
                className="tick-keyframe-two"
                fill={fill}
              />
            )}
            {isActive && (
              <circle
                cx="100"
                cy="100"
                r={radius}
                opacity={opacity}
                className="tick-keyframe-one"
                strokeWidth={1}
                stroke={fill}
                fill="transparent"
              />
            )}

            <circle
              cx="100"
              cy="100"
              className={classNames({
                'tick-keyframe-three': isActive,
              })}
              r={radius}
              opacity={opacity}
              fill={fill}
            >
              {isActive && (
                <animate
                  attributeName="r"
                  begin="0s"
                  dur="2s"
                  values={`${radius};${radius * 0.8}`}
                  calcMode="linear"
                  repeatCount="indefinite"
                />
              )}
            </circle>
          </g>
        </svg>
        {isBeginningOfMonth && (
          <h6 className="tick-year">{mark.moment.format('YY')}</h6>
        )}
        {/*{this.state.hover && (*/}
        {/*<TimelineTickPopper mark={mark} reference={this.svgHoverElement}/>*/}
        {/*)}*/}
      </div>
    );
  }

    protected toggleButtonHover = () => {
        this.setState((prev) => {
            return {hover: !prev.hover}
        })
    };

    protected setDate = () => {
          getGlobalModel('default', MTime).FromFormattedString(
              this.props.mark.moment.format('YYYYMMDD')
          );
    };

}
