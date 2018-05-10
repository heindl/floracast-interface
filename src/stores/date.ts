import * as _ from 'lodash';
import { action, computed, observable } from 'mobx';
import * as moment from 'moment';

const WeekdaysPredictionsGenerated: { [key: number]: string } = {
  2: 'Tuesday',
  5: 'Friday',
};

// export const StandardWeekday = 'Wednesday';
// // const StandardWeekdayInt = 3;
// export const CurrentDate = moment()
//     .day(StandardWeekday)
//     .subtract(1, 'weeks');
// export const CurrentDateString = CurrentDate.clone().format('YYYYMMDD');
// export const OldestDate = moment()
//     .day(StandardWeekday)
//     .subtract(52, 'weeks');
// export const OldestDateString = OldestDate.clone().format('YYYYMMDD');
// export const CurrentYear = CurrentDate.clone().year();
// export const LastYear = CurrentDate.clone().year();
//
// export const PredictionDateRange = [
//     OldestDate.clone().toDate(),
//     CurrentDate.clone().toDate()
// ];
//
// export const OccurrenceDateRange = [
//     new Date(2016, 0, 1),
//     new Date(2016, 11, 1)
// ];

export class DateStore {

    public readonly PredictionDateRange: [moment.Moment, moment.Moment];

    // Easy to mock in jest.
    protected readonly today: moment.Moment;
    @observable protected activeUnix: number; // Unix seconds to ensure mobx picks up reaction.
    protected readonly namespace: string;


  constructor(namespace: string) {
      this.namespace = namespace;
      this.today = toStandardDay(moment(), 0);
      this.PredictionDateRange = [
          this.today.clone().subtract(52, 'weeks'),
          this.today.clone(),
      ];

      this.fromMoment(this.today);
  }

    public FromFormattedString(date: string) {
        if (date.length !== 8) {
            throw Error(`Invalid path date [${date}]`);
        }
        this.fromMoment(moment(date, 'YYYYMMDD'));
    }

  @computed
  public get MonthString(): string {
    return moment.unix(this.activeUnix).format('MM');
  }

  @computed
  public get DateString(): string {
    return moment.unix(this.activeUnix).format('YYYYMMDD');
  }

  public get ActiveIsToday(): boolean {
      const active = moment.unix(this.activeUnix);
      return active.format("YYYYMMDD") === this.today.format("YYYYMMDD");
  }

  @computed
  public get FormattedMonth(): string {
    return moment.unix(this.activeUnix).format('MMMM');
  }

  @computed
  public get Formatted(): string {
    return moment.unix(this.activeUnix).format('MMM D, YY');
  }

  public Shift(i: -1 | 1): void {
    this.fromMoment(toStandardDay(moment.unix(this.activeUnix), i));
  }

  @action
  protected fromMoment(m: moment.Moment) {
    if (!(m.isoWeekday() in WeekdaysPredictionsGenerated)) {
      m = toStandardDay(m, -1)
    }
    if (this.activeUnix !== m.unix()) {
      this.activeUnix = m.unix();
    }
  }
}

const namespaces: Map<string, DateStore> = new Map();

export function getDateStore(namespace: string): DateStore {
  let store = namespaces.get(namespace);
  if (!store) {
    store = new DateStore(namespace);
    namespaces.set(namespace, store);
  }
  return store;
}

// Zero direction means find the nearest day, forward or backward.
function toStandardDay(
    given: moment.Moment,
    direction: -1 | 0 | 1
): moment.Moment {
    // 2: Tuesday, 5: Friday

    const m: moment.Moment = given.clone();

    const dates: Array<{ d: number; t: moment.Moment }> = _.flatten(
        [-1, 0, 1].map((wk) => {
            return [5, 2].map((d) => {
                const t = m
                    .clone()
                    .add(wk, 'week')
                    .isoWeekday(d);
                return { d: t.diff(m), t };
            });
        })
    ).sort((a, b) => Math.abs(a.d) - Math.abs(b.d));

    switch (direction) {
        case -1:
            return dates.filter((d) => d.d < 0)[0].t;
        case 1:
            return dates.filter((d) => d.d > 0)[0].t;
        default:
            return dates[0].t;
    }
}
