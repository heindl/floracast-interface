// Type definitions for react-places-autocomplete 6.1
// Project: https://github.com/kenny-hibino/react-places-autocomplete/
// Definitions by: Guilherme Hübner <https://github.com/guilhermehubner>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped
// TypeScript Version: 2.6
//
/// <reference types="googlemaps" />

declare module 'react-places-autocomplete' {
  import * as React from 'react';

  export interface FormattedSuggestionType {
    mainText: string;
    secondaryText: string;
  }

  export interface Suggestion {
    suggestion: string;
    formattedSuggestion: FormattedSuggestionType;
  }

  export interface PropTypes {
    inputProps: {
      value: string;
      onChange: (value: string) => void;
      type?: string;
      name?: string;
      placeholder?: string;
      onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    };
    onError?: (status: string, clearSuggestion: () => void) => void;
    onSelect?: (address: string, placeID: string) => void;
    onEnterKeyDown?: (address: string, placeID: string) => void;
    renderSuggestion?: (suggestion: Suggestion) => React.ReactNode;
    classNames?: {
      root?: string;
      input?: string;
      autocompleteContainer?: string;
      autocompleteItem?: string;
      autocompleteItemActive?: string;
    };
    styles?: {
      root?: React.CSSProperties;
      input?: React.CSSProperties;
      autocompleteContainer?: React.CSSProperties;
      autocompleteItem?: React.CSSProperties;
      autocompleteItemActive?: React.CSSProperties;
    };
    options?: {
      bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
      componentRestrictions?: google.maps.GeocoderComponentRestrictions;
      location?: google.maps.LatLng | google.maps.LatLngLiteral;
      offset?: number | string;
      radius?: number | string;
      types?: string[];
    };

    debounce?: number;
    highlightFirstSuggestion?: boolean;
    renderFooter?: () => React.ReactNode;
    shouldFetchSuggestions?: (value: string) => boolean;
  }

  export function geocodeByAddress(
    address: string,
    callback: (
      results: google.maps.GeocoderResult[],
      status: google.maps.GeocoderStatus
    ) => void
  ): void;
  export function geocodeByPlaceId(
    placeId: string,
    callback: (
      results: google.maps.GeocoderResult[],
      status: google.maps.GeocoderStatus
    ) => void
  ): void;

  export default class PlacesAutocomplete extends React.Component<PropTypes> {}
}
