/* tslint:disable:max-classes-per-file */

import * as classNames from "classnames";
import * as React from 'react';
import Waypoint from "react-waypoint";
import './Wreath.css'

interface ISeed {
    cx: number;
    cy: number;
    radius: number;
}

interface ICircleGroupProps {
    circles: ISeed[];
    radius: number;
    selected: Set<string>;
}

class CircleGroup extends React.Component<ICircleGroupProps> {

    public render() {

        return (
            <g>
                {this.props.circles.map((s, i) => {
                    const k = `${s.cx},${s.cy}`;

                    return (
                        <circle
                            key={k}
                            className={classNames({
                                'seed-circle': true,
                                'selected-seed-circle': this.props.selected.has(k),
                            })}
                            cx={s.cx}
                            cy={s.cy}
                            r={this.props.radius}
                        />
                    );
                })}
            </g>
        )
    }
}

// One of the beautiful arrangements of circles found at the Temple of Osiris at Abydos, Egypt (Rawles 1997).
// The pattern also appears in Italian art from the 13th century (Wolfram 2002, p. 43).
// The circles are placed with 6-fold symmetry, forming a mesmerizing pattern of circles and lenses.
// src: WolframAlpha

interface IWreathProps{
    width: string;
    height: string;
    radius: number;
    viewBox: [number, number];
    style?: object;
}

interface IWreathState{
    isDone: boolean;
    timerHasStarted: boolean;
    selected: Set<string>;
    circles: ISeed[];
}

// {/*<Seed*/}
// {/*key={i}*/}
// {/*cx={g.cx}*/}
// {/*cy={g.cy}*/}
// {/*radius={g.radius}*/}
// {/*groupId={i}*/}
// {/*totalGroupCount={this.seedGroups.length}*/}
// {/*registerDone={() => this.setState({isDone: true})}*/}
// {/*isDone={this.state.isDone}*/}
// {/*/>*/}

export default class Wreath extends React.Component<IWreathProps, IWreathState> {

    protected seedGroups: ISeed[];
    protected intervalId: number;
    protected intersections: Map<string, Set<string>>;
    protected active: Set<number>;

    constructor(props: IWreathProps) {
        super(props);
        this.state = {
            circles: [],
            isDone: false,
            selected: new Set<string>(),
            timerHasStarted: false,
        };
        this.seedGroups = getAllCirclesWithinViewbox(props.radius, props.viewBox);
        this.active = new Set<number>();
        this.intersections = new Map<string, Set<string>>();
    }

    public componentWillUnmount() {
        // Delete interval in case is wasn't already.
        window.clearInterval(this.intervalId)
    }

    public render() {

        return (
            <Waypoint onEnter={this.startTimer}>
                <svg
                    version="1.1"
                     xmlns="http://www.w3.org/2000/svg"
                     xmlnsXlink="http://www.w3.org/1999/xlink"
                     viewBox={`0 0 ${this.props.viewBox[0]} ${this.props.viewBox[1]}`}
                    height={this.props.height}
                    width={this.props.width}
                    className="wreath-of-life"
                    style={this.props.style}
                >

                    <CircleGroup
                        circles={this.state.circles}
                        radius={this.props.radius}
                        selected={this.state.selected}
                    />
                </svg>
            </Waypoint>
        )
    }

    protected startTimer = () => {

        if (this.state.timerHasStarted) {
            return
        }

        this.setState({timerHasStarted: true});

        this.intervalId = setInterval(this.timer.bind(this), 100);
    };

    protected timer = () => {

        const guess = Math.floor(Math.random() * this.seedGroups.length);
        // const yGuess = Math.floor(Math.random() * this.props.viewBox[1] + 1);

        if (this.active.has(guess)) {
            return
        }

        this.active = this.active.add(guess);

        const s = this.seedGroups[guess];

        const x = s.cx;
        const y = s.cy;

        this.setState((p) => ({circles: p.circles.concat([s])}));

        const coordString = `${x},${y}`;
        const radius = this.props.radius;

        [
            90,
            270,
            30,
            330,
            150,
            210,
        ].forEach((theta: number) => {
            const ay = Math.round(y + radius * Math.sin(theta * Math.PI / 180));
            const ax = Math.round(x + radius * Math.cos(theta * Math.PI / 180));
            const k = `${ax},${ay}`;
            const i = (this.intersections.get(k) || new Set<string>()).add(coordString);
            if (i.size >= 6) {
                this.setState({isDone: true, selected: i});
                clearInterval(this.intervalId);
                return
            }
            this.intersections.set(k, i);
        });
    }

}

function getAllCirclesWithinViewbox(radius: number, viewBox: [number, number]): ISeed[] {

    const translateX = (radius * 0.875);
    const translateY = radius;
    const columnCount = (viewBox[0] / (radius)) - 1;
    const rowCount = (viewBox[1] / (radius)) - 2;

    const res: ISeed[] = [];
    for (let column = 1; column <= columnCount; column++) {
        for (let row = 1; row <= rowCount; row++) {
            const evenColumn = (column % 2 === 0);
            if (evenColumn && row === 15) {
                    continue
            }
            const cx = Math.round(column * translateX);
            const cy = Math.round(evenColumn ? (row * translateY) + (translateY * 0.5) : row * translateY);


            res.push({cx, cy, radius});
        }
    }
    return res;
}
