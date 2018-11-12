import * as geolib from 'geolib';
import {computed} from "mobx";
import {observer} from "mobx-react";
import * as React from 'react';
import * as ReactLeaflet from 'react-leaflet';
import ConfidenceScale from "../../iconography/ConfidenceScale";
import {getGlobalModel} from "../../stores/globals";
import MLocationUserCoordinates from "../../stores/location/coordinate";
import ProtectedArea from '../../stores/protected-area';
import {MView} from "../../stores/view";
import './ProtectedAreaTooltip.css';

interface ITooltipProps {
    clusterId?: number;
    latitude: number,
    longitude: number,
    prediction: number;
}

interface ITooltipState {
    area?: ProtectedArea;
}

@observer
export default class ProtectedAreaTooltip extends React.Component<
    ITooltipProps,
    ITooltipState
    > {

    public TooltipRef?: HTMLDivElement;
    public ProtectedAreaNameRef?: HTMLHeadingElement;
    public ProtectedAreaDirectionsLinkRef?: HTMLHeadingElement;

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

        // const prediction = Math.round(this.props.prediction * 100);

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
                        <h4 className="prediction-marker-tooltip-name narrow heavy" ref={this.setAreaNameRef}>
                           {this.state.area.Name}
                        </h4>
                        }
                        {(this.state.area && this.state.area.Designation && this.state.area.Designation.indexOf("Unknown") === -1) &&
                        <h4 className="prediction-marker-tooltip-designation narrow">{this.state.area.Designation}</h4>
                        }
                        <h5 className="prediction-marker-tooltip-distance" ref={this.setProtectedAreaDirectionsLinkRef}>{this.distanceToUser} miles | <span>Directions</span></h5>
                        {/*<h3 className="prediction-marker-tooltip-prediction narrow">{prediction}%</h3>*/}
                    </div>
                </div>
            </ReactLeaflet.Tooltip>
        )
    }

    protected setDivRef = (r: HTMLDivElement) => {
        this.TooltipRef = r
    };

    protected setAreaNameRef = (r: HTMLHeadingElement) => {
        this.ProtectedAreaNameRef = r
    };

    protected setProtectedAreaDirectionsLinkRef = (r: HTMLHeadingElement) => {
        this.ProtectedAreaDirectionsLinkRef = r;
    }

    protected onOpen = () => {

        if (!this.state.area) {
            const a = new ProtectedArea('default', this.props.latitude, this.props.longitude);
            a.Hydrate();
            this.setState({
                area: a,
            });
        }
    };

    @computed
    protected get distanceToUser(): string {
        const mUserCoords = getGlobalModel('default', MLocationUserCoordinates);
        return (geolib.getDistance({
            latitude: mUserCoords.Latitude,
            longitude: mUserCoords.Longitude,
        }, {
            latitude: this.props.latitude,
            longitude: this.props.longitude
        }) * 0.000621371).toFixed(0)
    }

    protected examineExternalClickEvent = (e: Event) => {


        const mUserCoords = getGlobalModel('default', MLocationUserCoordinates);

        if (this.ProtectedAreaDirectionsLinkRef && this.ProtectedAreaDirectionsLinkRef.contains(e.target as Node)) {

                const link = [
                    `https://www.google.com/maps/dir/?api=1`,
                    `origin=${mUserCoords.Latitude},${mUserCoords.Longitude}`,
                    `destination=${this.props.latitude},${this.props.longitude}`
                ].join('&');

                window.open(link, "_blank");
                return
        }


        if (this.ProtectedAreaNameRef && this.ProtectedAreaNameRef.contains(e.target as Node)) {
            if (!this.state.area) {
                return
            }

            window.open(`https://duckduckgo.com/?q=!ducky+${
                this.state.area.Name.split(' ').join('+')
                }`, "_blank");
            return
        }
        if (this.TooltipRef && this.TooltipRef.contains(e.target as Node)) {
            return
        }
        getGlobalModel('default', MView).SetProtectedAreaToken('');
    };
}
