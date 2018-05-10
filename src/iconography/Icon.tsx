import * as ClassNames from 'classnames';
import * as React from 'react';
import * as uuid from 'uuid';

export interface IIconProps {
  selected?: boolean;
  icon: [React.ReactNode, React.ReactNode] | [React.ReactNode];
  height?: string | number;
  width?: string | number;
  id?: string;
  viewBox?: string;
  color?: string;
  activeColor?: string;
  onClick?: () => void;
  style?: object;
}

export interface IconState {
  hover: boolean;
}

export default class Icon extends React.Component<IIconProps, IconState> {
  constructor(props: IIconProps) {
    super(props);
    this.state = {
      hover: false,
    };
  }

  public render() {
    const height = this.props.height
      ? typeof this.props.height === 'number'
        ? `${this.props.height}px`
        : this.props.height
      : '30px';
    const width = this.props.width
      ? typeof this.props.width === 'number'
        ? `${this.props.width}px`
        : this.props.width
      : '30px';

    const fill = this.state.hover || this.props.selected
      ? this.props.activeColor || '#000'
      : this.props.color || '#000';

    return (
      <svg
        version="1.1"
        id={this.props.id || uuid.v4().substr(0, 5)}
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        style={this.props.style}
        x="0px"
        y="0px"
        width={width}
        fill={fill}
        stroke={fill}
        height={height}
        viewBox={this.props.viewBox || '0 0 512 512'}
        xmlSpace="preserve"
        onClick={this.props.onClick}
        onMouseEnter={this.toggleHover}
        onMouseLeave={this.toggleHover}
        className={ClassNames({
          hovered: this.state.hover,
          icon: true,
          selected: this.props.selected,
        })}
      >
        {this.props.selected || this.state.hover
          ? this.props.icon[1] || this.props.icon[0]
          : this.props.icon[0]}
      </svg>
    );
  }

    protected toggleHover = () => {
        this.setState((prev) => {
            return {hover: !prev.hover}
        })
    };

}
