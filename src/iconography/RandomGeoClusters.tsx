/* tslint:disable:max-classes-per-file */
import {inject, observer} from "mobx-react";
import * as React from "react";
import {Transition} from "react-transition-group";
import {CoordinateStore} from "../stores/coordinates";
import './RandomGeoClusters.css';

interface ICircle {
    cx: number;
    cy: number;
    radius: number;
    color: string;
}

interface ICircleGroupProps {
    circles: ICircle[];
    totalCycleTime: number;
    in: boolean;
}

class CircleGroup extends React.Component<ICircleGroupProps> {

    protected statusStyles : { [index:string] : {[key: string]: number} } = {
        entered: {
            opacity: 0.9,
        },
        entering: {
            opacity: 0.01,
        },
        exited: {
            opacity: 0,
        },
        exiting: {
            opacity: 0.01,
        },
    };

    public render() {


        return (
            <g>
                {this.props.circles.map((c, i) => {

                    const timeout = getRandomInt(0, this.props.totalCycleTime - (this.props.totalCycleTime * 0.30));

                    return (
                        <Transition
                            key={`${c.cx},${c.cy}`}
                            timeout={{
                                enter: timeout,
                                exit: 100
                            }}
                            appear={true}
                            in={this.props.in}
                        >
                            {(status: string) => {
                                return (
                                    <circle
                                        className="random-geo-cluster-point"
                                        style={{
                                            ...this.statusStyles[status],
                                            // transition: `opacity ${500}ms ease-in-out`,
                                            transitionProperty: 'opacity',
                                            transitionTimingFunction: "ease",
                                            willChange: 'opacity',
                                        }}
                                        fill={c.color}
                                        cx={c.cx}
                                        cy={c.cy}
                                        r={c.radius}
                                    />
                                )
                            }}
                        </Transition>
                    )
                })}
            </g>
        )
    }
}


interface IRandomGeoClustersProps{
    width: string;
    height: string;
    radiusRange: [number, number];
    countRange: [number, number];
    viewBox: [number, number];
    style?: object;
    totalCycleTime: number;
    coordinateStore?: CoordinateStore;
}

interface IRandomGeoClustersState{
    circles: ICircle[],
    in?: boolean;
    mapLink?: string;
}

function getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min;
}

@inject('coordinateStore', 'errorStore')
@observer
export default class RandomGeoClusters extends React.Component<IRandomGeoClustersProps, IRandomGeoClustersState> {

    protected intervalId: number;
    protected staticMapDiv: HTMLDivElement;

    constructor(props: IRandomGeoClustersProps) {
        super(props);
        this.generateCircles = this.generateCircles.bind(this);
        this.state = {
            circles: [],
            mapLink: '',
        }
    }

    public componentDidMount() {

        const {coordinateStore} = this.props;
        if (!coordinateStore) {
            return
        }

        this.generateCircles();
        this.intervalId = window.setInterval(this.generateCircles, this.props.totalCycleTime);

        this.setState({
            mapLink: coordinateStore.StaticMapFunc.f(
                this.staticMapDiv.clientHeight,
                this.staticMapDiv.clientWidth,
                7
            )
        });
    }

    public componentWillUnmount() {
        window.clearInterval(this.intervalId)
    }


    public render() {

        return (
            <div
                id="random-geo-clusters"
                ref={(r) => {if (r) {this.staticMapDiv = r}}}
                // style={{backgroundImage: `url("${this.state.mapLink}")`}}
            >
                <img
                    style={{
                        height: "100%",
                        opacity: 0.3,
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: "100%",
                        zIndex:1,

                    }}
                    src={this.state.mapLink}
                />
                <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    viewBox={`0 0 ${this.props.viewBox[0]} ${this.props.viewBox[1]}`}
                    height={this.props.height}
                    width={this.props.width}
                    style={{
                        height: "100%",
                        position: "absolute",
                        right: 0,
                        top: 0,
                        width: "100%",
                        zIndex:1,
                        ...this.props.style}}
                >
                    <CircleGroup
                        circles={this.state.circles}
                        totalCycleTime={this.props.totalCycleTime}
                        in={this.state.in || false}
                    />

                </svg>
            </div>
        );
    }


    protected generateCircles() {

        this.setState({in: false});

        const colors = [
            "#264653",
            "#2A9D8F",
            "#E9C46A",
            "#F4A261",
            "#E76F51"
        ]

        const midX = getRandomInt(0, this.props.viewBox[0]);
        const midY = getRandomInt(0, this.props.viewBox[1]);

        const w = this.props.radiusRange[1] * 8;

        const xRange = [
            midX - w , midX + w
        ]

        const yRange = [
            midY - w, midY + w
        ]

        const colorPosition = getRandomInt(0, colors.length);

        const res: ICircle[] = [];

        const clusterCount = getRandomInt(this.props.countRange[0], this.props.countRange[1]);

        while (res.length < clusterCount) {
            res.push({
                color: colors[colorPosition],
                cx: getRandomInt(xRange[0], xRange[1]),
                cy: getRandomInt(yRange[0], yRange[1]),
                radius: getRandomInt(this.props.radiusRange[0], this.props.radiusRange[1]),
            })
        }

        this.setState({in: true, circles: res})

    }
}
