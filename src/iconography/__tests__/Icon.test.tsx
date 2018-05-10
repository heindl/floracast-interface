import * as enzyme from 'enzyme';
import * as ReactSixteenAdapter from 'enzyme-adapter-react-16';
import * as React from 'react';
import Icon from '../Icon';
import { Flower } from '../Icons';
enzyme.configure({ adapter: new ReactSixteenAdapter() });

it('renders the correct text when no enthusiasm level is given', () => {
  enzyme.render(<Icon icon={Flower} />);
});
