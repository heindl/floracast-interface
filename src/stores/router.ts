import * as history from 'history';
import * as _ from 'lodash';

interface IParams {
    lat?: number;
    lng?: number;
    zoom?: number;
    nameUsageId?: string;
    taxonCategory?: string;
    date?: string;
    locality?: string;
    adminAreaLong?: string;
}

interface IPath {
    params: IParams,
    section: string,
}

export class MRouter {

    public readonly HistoryRef: history.History;

    protected readonly namespace: string;

    constructor(namespace: string) {
        this.namespace = namespace;
        this.HistoryRef = history.createBrowserHistory()
    }

    public ParseCurrentPath = (): IPath => {
        const sPath = this.HistoryRef.location.pathname.split("/");
        const prefix = sPath[1];
        if (prefix === 'map') {
            return {
                params: parseMapParams(sPath.slice(2)),
                section: prefix,
            }
        }
        if (prefix === 'forecast') {
            return {
                params: parseForecastParams(sPath.slice(2)),
                section: prefix,
            }
        }
        return {section: prefix, params: {}}
    }


    public NavigateTo = (i: IPath) => {

        if (i.section !== 'map' && i.section !== 'forecast') {
            return
        }

        // Merge with current
        const current = this.ParseCurrentPath();

        const params = _.assign(current.params, i.params);

        const nPath = i.section === 'map' ? formMapPath(params) : formForecastPath(params);

        if (nPath === this.HistoryRef.location.pathname) {
            return
        }

        this.HistoryRef.push(nPath);
    };

    public UpdateCurrentPath = (i: IParams) => {
        const current = this.ParseCurrentPath();
        if (current.section !== 'map' && current.section !== 'forecast') {
            return
        }

        const params = _.assign(current.params, i);

        this.HistoryRef.push(
            current.section === 'map' ? formMapPath(params) : formForecastPath(params)
        )
    }

}

function formForecastPath(i: IParams): string {
    if (!i.locality || !i.adminAreaLong) {
        return '/forecast';
    }
    return [
        '/forecast',
        i.adminAreaLong.toLowerCase().trim().replace(' ', '+'),
        i.locality.toLowerCase().trim().replace(' ', '+'),
        i.date || '',
    ]
        .filter((s) => s && s !== '')
        .join('/');
}

function formMapPath(i: IParams): string {
    let r = '/map';
    const coordStr = stringifyCoordinates(i);
    if (coordStr === '') {
        return r
    }
    r += `/${coordStr}`;
    if (!i.date) {
        return r;
    }
    return (r += `/${i.date}/${i.nameUsageId || ''}`);
}

function parseMapParams(params: string[]): IParams {
    const iParams: IParams = (params.length >= 1) ? parseCoordinates(params[0]) : {};
    if (params.length >= 2) {
        iParams.date = params[1]
    }
    if (params.length >= 3) {
        iParams.nameUsageId = params[2]
    }
    return iParams
}

function parseForecastParams(params: string[]): IParams {
    const res: IParams = {};
    if (params.length >= 1) {
        res.adminAreaLong = params[0].replace("+", " ")
    }
    if (params.length >= 2) {
        res.locality = params[1].replace("+", " ")
    }
    if (params.length >= 3) {
        res.date = params[2].replace("+", " ")
    }
    return res
}

export function parseCoordinates(s: string): IParams {
    const commaMatches = s.match(/,/gi);
    if (
        !commaMatches ||
        commaMatches.length === 0 ||
        !s.startsWith('@') ||
        !s.endsWith('z')
    ) {
        // throw Error(
        //     `Could not construct location with invalid path parameter [${loc}]`
        // );
        return {}
    }
    const divisions: string[] = s
        .replace('@', '')
        .replace('z', '')
        .split(',');
    return {
        lat: parseFloat(divisions[0]),
        lng: parseFloat(divisions[1]),
        zoom: parseInt(divisions[2], 10),
    };
}

function stringifyCoordinates(i: IParams): string {
    if (!i.lat || !i.lng || i.lng === 0 || i.lat === 0) {
        return ''
    }
    return `@${i.lat},${i.lng},${i.zoom || 9}z`
}