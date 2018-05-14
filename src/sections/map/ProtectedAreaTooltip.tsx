import * as React from 'react';
import * as ReactLeaflet from 'react-leaflet';
import ConfidenceScale from "../../iconography/ConfidenceScale";
import {getGlobalModel} from "../../stores/globals";
import ProtectedArea from '../../stores/protected-area';
import {MView} from "../../stores/view";
import './ProtectedAreaTooltip.css';

interface ITooltipProps {
    token: string;
    clusterID?: number;
    latitude: number,
    longitude: number,
    prediction: number;
}

interface ITooltipState {
    area?: ProtectedArea;
}

export default class ProtectedAreaTooltip extends React.Component<
    ITooltipProps,
    ITooltipState
    > {

    public TooltipRef?: HTMLDivElement;

    constructor(props: ITooltipProps) {
        super(props);
        this.state = {};
    }

    public componentDidMount() {
        document.addEventListener('mousedown', this.examineExternalClickEvent);
    }

    public componentWillUnmount() {
        document.removeEventListener('mousedown', this.examineExternalClickEvent);
    }

    public render() {

        const prediction = Math.round(this.props.prediction * 100);

        return (

            <ReactLeaflet.Tooltip
                permanent={true}
                position={{lat: this.props.latitude, lng: this.props.longitude}}
                minWidth={150}
                // maxWidth={200}
                direction="top"
                interactive={true}
                onOpen={this.onOpen}
            >
                <div className="prediction-marker-tooltip" ref={this.setDivRef}>
                    {/*<Icon*/}
                        {/*icon={Close}*/}
                        {/*style={{position: 'absolute', top: '3px', right: '3px'}}*/}
                        {/*color="#999"*/}
                        {/*activeColor="#000"*/}
                        {/*height={'15px'}*/}
                        {/*width={'15px'}*/}
                        {/*onClick={() => viewStore.SetProtectedAreaToken('')}*/}
                    {/*/>*/}
                   <ConfidenceScale prediction={this.props.prediction}/>
                    <div className="prediction-marker-tooltip-content">
                        {this.state.area &&
                        <h3 className="prediction-marker-tooltip-name narrow">{this.state.area.Name}</h3>
                        }
                        {(this.state.area && this.state.area.Designation && this.state.area.Designation.indexOf("Unknown") === -1) &&
                        <h4 className="prediction-marker-tooltip-designation narrow">{this.state.area.Designation}</h4>
                        }
                        <h3 className="prediction-marker-tooltip-prediction narrow">{prediction}%</h3>
                    </div>
                </div>
            </ReactLeaflet.Tooltip>
        )
    }

    protected setDivRef = (r: HTMLDivElement) => {
        this.TooltipRef = r
    };

    protected onOpen = () => {
        if (!this.state.area && this.props.token && this.props.token !== '') {
            const a = new ProtectedArea(this.props.token, 'default');
            a.Hydrate();
            this.setState({
                area: a,
            });
        }
    };

    protected examineExternalClickEvent = (e: Event) => {
        if (this.TooltipRef && this.TooltipRef.contains(e.target as Node)) {
            return
        }
        getGlobalModel('default', MView).SetProtectedAreaToken('');
    };
}
