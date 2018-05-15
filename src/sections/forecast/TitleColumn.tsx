import {observer} from "mobx-react";
import * as React from "react";
import Icon from "../../iconography/Icon";
import {ChevronLeft, ChevronRight} from "../../iconography/Icons";
import {MTime} from "../../stores/date";
import {getGlobalModel} from "../../stores/globals";
import {MLocationUserComputations} from "../../stores/location/computation";
import MLocationPlace from "../../stores/location/place";

@observer
export default class ForecastPageTitleColumn extends React.Component {
    public render() {

        const DMS = getGlobalModel('default', MLocationUserComputations).DMS;
        const mPlace = getGlobalModel('default', MLocationPlace);
        const formattedDate = getGlobalModel('default', MTime).Formatted;

        return (
            <div id="forecast-page-title">
                <h3>Predictions</h3>
                <h4><i>for</i></h4>
                <h3>Mushrooms</h3>
                <h4><i>near</i></h4>
                <h3>
                    {mPlace.Locality}, {mPlace.AdminAreaLong}
                </h3>
                <h5 style={{opacity: 0.65}}>{DMS}</h5>
                <h4><i>on</i></h4>
                <div className="forecast-page-header-date-field">
                    <Icon
                        height={'20px'}
                        width={'20px'}
                        icon={ChevronLeft}
                        onClick={this.decrementDate}
                        color="#e0e0e0"
                        activeColor="#000"
                    />
                    <h3 style={{ padding: '0 25px' }}>
                        {formattedDate}
                    </h3>
                    <Icon
                        height={'20px'}
                        width={'20px'}
                        icon={ChevronRight}
                        onClick={this.incrementDate}
                        color="#e0e0e0"
                        activeColor="#000"
                    />
                </div>
            </div>
        )
    }

    protected decrementDate = () => {
        getGlobalModel('default', MTime).Shift(-1)
    };

    protected incrementDate = () => {
        getGlobalModel('default', MTime).Shift(1)
    }
}