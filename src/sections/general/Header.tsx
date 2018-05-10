import * as React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../iconography/Icon';
import { SeedOfLife } from '../../iconography/Icons';
import './Header.css';

interface IHeaderProps {
  color?: string;
  activeColor?: string;
}

export default class Header extends React.Component<IHeaderProps> {
  public render() {
    return (
      <div id="logo">
        <Link to="/">
          <Icon
            icon={SeedOfLife}
            height={'3.5rem'}
            width={'3.5rem'}
            color={this.props.color || '#000'}
            activeColor={this.props.activeColor}
          />
          <h3 className="title" style={{ color: this.props.color || '#000' }}>
            floracast
          </h3>
        </Link>
      </div>
    );
  }
}
