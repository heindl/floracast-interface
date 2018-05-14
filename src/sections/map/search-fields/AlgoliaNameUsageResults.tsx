/* tslint:disable:max-classes-per-file */
import * as AlgoliaSearch from 'algoliasearch';
import * as React from 'react';
import MErrors from "../../../stores/errors";
import {getGlobalModel} from "../../../stores/globals";
import TaxaFieldElement from "./TaxaSearchElement";

interface IAlgoliaTaxaResponse {
    CommonName?: string;
    NameUsageID: string;
    ReferenceCount?: number;
    ScientificName?: string;
    objectID?: number;
    Thumbnail?: string;
    TotalOccurrenceCount?: number;
}

interface IAlgoliaResultsProps{
    inputValue?: string;
}

interface IAlgoliaResultsState{
    results: IAlgoliaTaxaResponse[];
}

export default class AlgoliaNameUsageResults extends React.Component<IAlgoliaResultsProps, IAlgoliaResultsState> {

    protected algoliaClient: AlgoliaSearch.Client;
    protected algoliaIndex: AlgoliaSearch.Index;

    constructor(props: IAlgoliaResultsProps) {
        super(props);
        this.state = {results: []};
        this.algoliaClient = AlgoliaSearch(
            process.env.REACT_APP_FLORACAST_ALGOLIA_APPLICATION_ID || '',
            process.env.REACT_APP_FLORACAST_ALGOLIA_API_KEY || ''
        );
        this.algoliaIndex = this.algoliaClient.initIndex('NameUsages');
    }

    public componentDidUpdate(pastProps: IAlgoliaResultsProps, pastState: IAlgoliaResultsState) {

        if (this.props.inputValue === pastProps.inputValue) {
            return
        }

        this.algoliaIndex
            .search({query: this.props.inputValue})
            .then((res: AlgoliaSearch.Response) => {
                this.setState({ results: res.hits });
            })
            .catch((err: Error) => {
                this.setState({ results: [] });
                getGlobalModel('default', MErrors).Report(err);
            });
    }


    public render() {

        return (
            <div>
                {
                    this.state.results.map((t) => {
                        return (
                            <TaxaFieldElement
                                commonName={t.CommonName || ''}
                                photo={t.Thumbnail || ''}
                                nameUsageId={t.NameUsageID}
                                key={t.NameUsageID}
                                scientificName={t.ScientificName || ''}
                            />
                        )
                    })
                }
            </div>
        )
    }
}