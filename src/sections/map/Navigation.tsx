/* tslint:disable:max-classes-per-file */
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../iconography/Icon';
import { SeedOfLife } from '../../iconography/Icons';
import { TaxaStore } from '../../stores/taxa';
import { TimelineStore } from '../../stores/timeline';
import {InFocusField, PointType, ViewStore} from '../../stores/view';
import './Navigation.css';
import DateSearchField from './search-fields/DateSearchField';
import PointTypeSearchField from './search-fields/PointTypeSearchField';
import TaxaSearchField from './search-fields/TaxaSearchField';
import Tick from './TimelineTick';

interface ITickMarkProps{
    pointType: PointType;
    timelineStore?: TimelineStore;
}

@inject('timelineStore')
@observer
class TickMarks extends React.Component<ITickMarkProps> {
    public render() {

        const {timelineStore} = this.props;

        if (!timelineStore) {
            return null
        }
        return (
            <div id="timeline">
                {timelineStore.TickMarks.map((mark, i) => {
                    return <Tick key={mark.moment.unix()} mark={mark} />;
                })}
            </div>
        )
    }
}

interface INavigationProps {
  viewStore?: ViewStore;
  taxaStore?: TaxaStore;
}

@inject('viewStore', 'taxaStore')
@observer
export default class Navigation extends React.Component<INavigationProps> {
  public PointTypeSearchRef: HTMLDivElement;
  public TaxaSearchRef: HTMLDivElement;
  public DateSearchRef: HTMLDivElement;

  constructor(props: INavigationProps) {
    super(props);
    this.examineClickEvent = this.examineClickEvent.bind(this);
  }

  public componentDidMount() {
    document.addEventListener('mousedown', this.examineClickEvent);
  }

  public componentWillUnmount() {
    document.removeEventListener('mousedown', this.examineClickEvent);
  }

  public render() {
    const { viewStore, taxaStore } = this.props;

    if (!viewStore || !taxaStore) {
      return null;
    }

    // const taxaFuncWord =
    //   viewStore.PointType === PointType.Occurrences ? 'of' : 'for';
    // const dateFuncWord =
    //   viewStore.PointType === PointType.Occurrences ? 'in' : 'on';

    return (
      <div id="navigation">
        <div id="search-bar">
          <div id="search-bar-logo">
            <Link to="/">
              <Icon
                icon={SeedOfLife}
                height={'35px'}
                width={'35px'}
                color={'#000'}
              />
            </Link>
          </div>
          <PointTypeSearchField setRef={this.setPointRef} />

          <h6 className="search-field-function-word">|</h6>

          <DateSearchField setRef={this.setDateRef} />

          {taxaStore.Selected &&
            taxaStore.Selected.CommonName && (
              <h6 className="search-field-function-word">|</h6>
            )}

          <TaxaSearchField setRef={this.setTaxaSearchRef} />

        </div>

        {viewStore.TimelineIsVisible &&
          <TickMarks pointType={viewStore.PointType} />
        }
      </div>
    );
  }

  protected setPointRef = (r: HTMLDivElement) => {
      this.PointTypeSearchRef = r
  };

    protected setDateRef = (r: HTMLDivElement) => {
        this.DateSearchRef = r
    };

    protected setTaxaSearchRef = (r: HTMLDivElement) => {
        this.TaxaSearchRef = r
    };

    protected examineClickEvent = (e: Event) => {
        const { viewStore } = this.props;
        if (!viewStore) {
            return;
        }

        let inside: boolean = false;

        if (e.target) {
            inside =
                inside ||
                (this.PointTypeSearchRef &&
                    this.PointTypeSearchRef.contains(e.target as Node));
            inside =
                inside ||
                (this.TaxaSearchRef && this.TaxaSearchRef.contains(e.target as Node));
            inside =
                inside ||
                (this.DateSearchRef && this.DateSearchRef.contains(e.target as Node));
        }

        if (!inside) {
            viewStore.SetInFocusField(InFocusField.FieldNone);
        }
    };
}