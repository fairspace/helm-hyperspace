import React from 'react';
import {render, cleanup, getByText} from '@testing-library/react';
import {act} from 'react-dom/test-utils';

import SearchPageContainer, {SearchPage} from '../SearchPage';
import Config from "../../common/services/Config";
import configFile from "../../config";

afterEach(cleanup);

beforeAll(() => {
    Config.setConfig(Object.assign(configFile, {
        externalConfigurationFiles: [],
    }));

    return Config.init();
});

describe('<SearchPage />', () => {
    it('should render table when receiving results', () => {
        const {queryByTestId} = render(
            <SearchPage
                classes={{}}
                loading={false}
                results={{
                    total: 1,
                    items: [{id: 1, highlights: []}]
                }}
            />
        );

        expect(queryByTestId('results-table')).toBeTruthy();
    });

    it('should render error component on error', () => {
        const {container, queryByTestId} = render(
            <SearchPage
                classes={{}}
                error={{
                    message: 'An error'
                }}
            />
        );

        expect(queryByTestId('results-table')).toBeFalsy();
        expect(getByText(container, 'An error')).toBeTruthy();
    });

    it('should perform search on component first mount', async () => {
        const searchApi = {
            search: jest.fn(() => Promise.resolve({
                total: 1,
                items: []
            }))
        };

        await act(async () => {
            render(<SearchPageContainer
                classes={{}}
                location={{
                    search: 'query'
                }}
                searchApi={searchApi}
            />);
        });

        expect(searchApi.search.mock.calls.length).toEqual(1);
    });
});
