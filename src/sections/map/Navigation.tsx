/* tslint:disable:max-classes-per-file */
import { observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../iconography/Icon';
import { SeedOfLife } from '../../iconography/Icons';
import {getGlobalModel} from "../../stores/globals";
import {MMapTaxa} from '../../stores/taxa';
import {MMapOccurrenceTimeline, MMapPredictionTimeline} from '../../stores/timeline';
import {InFocusField, MView, PointType} from '../../stores/view';
import './Navigation.css';
import DateSearchField from './search-fields/DateSearchField';
import PointTypeSearchField from './search-fields/PointTypeSearchField';
import TaxaSearchField from './search-fields/TaxaSearchField';
import Tick from './TimelineTick';

@observer
class Timeline extends React.Component {
    public render() {

        const mView = getGlobalModel('default', MView);
        if (!mView.TimelineIsVisible) {
            return null
        }

        const tickMarks = mView.PointType === PointType.Predictions ?
            getGlobalModel('default', MMapPredictionTimeline).TickMarks :
            getGlobalModel('default', MMapOccurrenceTimeline).TickMarks;
        return (
            <div id="timeline">
                {tickMarks.map((mark, i) => {
                    return <Tick key={mark.moment.unix()} mark={mark} />;
                })}
            </div>
        )
    }
}

@observer
export default class Navigation extends React.Component<{}> {
  public PointTypeSearchRef: HTMLDivElement;
  public TaxaSearchRef: HTMLDivElement;
  public DateSearchRef: HTMLDivElement;

  constructor(props: {}) {
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

    // const taxaFuncWord =
    //   viewStore.PointType === PointType.Occurrences ? 'of' : 'for';
    // const dateFuncWord =
    //   viewStore.PointType === PointType.Occurrences ? 'in' : 'on';

      const selectedTaxon = getGlobalModel('default', MMapTaxa).Selected;

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

            {(selectedTaxon && selectedTaxon.CommonName) &&
            <h6 className="search-field-function-word">|</h6>
            }

          <TaxaSearchField setRef={this.setTaxaSearchRef} />

        </div>

          <Timeline />
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
            getGlobalModel('default', MView).SetInFocusField(InFocusField.FieldNone);
        }
    };
}
