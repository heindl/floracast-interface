/**
 * @jest-environment floracast-jest-environment-jsdom
 */

import {} from 'jest';
import { when } from 'mobx';
import * as uuid from 'uuid';
import { getCoordinateStore } from '../coordinates';
import { getTaxaStore } from '../taxa';
import { getTimelineStore } from '../timeline';
import { getViewStore, PointType } from '../view';

it(
  'should generate timeline points.',
  async () => {
    const namespace = uuid.v4().substr(0, 5);

    const coordinateStore = getCoordinateStore(namespace);
    await when(() => coordinateStore.IsReady);
    coordinateStore.SetZoom(7);

    const viewStore = getViewStore(namespace);
    viewStore.SetPointType(PointType.Predictions);

    const taxaStore = getTaxaStore(namespace);
    taxaStore.Select('Io1ftGL');

    const timelineStore = getTimelineStore(namespace);

    await when(() => timelineStore.TickMarks.length > 0);
    expect(timelineStore.TickMarks.length).toEqual(52);

    viewStore.SetPointType(PointType.Occurrences);

    await when(() => timelineStore.TickMarks.length === 12);

    expect(timelineStore.TickMarks.length).toEqual(12);

    // expect(generator.marks.length).toEqual(12);
    //
    // [2, 2, 15, 46, 74, 9, 5, 9, 15, 11, 12, 3].forEach((pointCount, i) => {
    //   expect(generator.marks[i].pointCount).toEqual(pointCount);
    // });

    // console.log(generator.marks);
  },
  10000
);
