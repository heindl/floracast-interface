import * as classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../iconography/Icon';
import { Loading, PaperPlane } from '../../iconography/Icons';
import {
  ContactFormStateCode,
  ContactFormStore,
} from '../../stores/contact-form';
import './BetaForm.css';

const headerTexts: Map<ContactFormStateCode, string> = new Map<
  ContactFormStateCode,
  string
>([
  [ContactFormStateCode.Initial, "Don't miss out"],
  [ContactFormStateCode.Complete, 'Awesome!'],
  [ContactFormStateCode.Exists, "You're already on the list!"],
  [ContactFormStateCode.Failed, 'Something broke ...'],
]);

const messageTexts: Map<ContactFormStateCode, string> = new Map<
  ContactFormStateCode,
  string
>([
  [
    ContactFormStateCode.Initial,
    'Sign up to get a weekly e-mail with your local weekend forecast.',
  ],
  [
    ContactFormStateCode.Complete,
    'Thank you for signing up! We are still in beta and will let you know as soon as the project is ready to try.',
  ],
  [ContactFormStateCode.Exists, ''],
  [
    ContactFormStateCode.Failed,
    'We apologize, but your e-mail could not be saved. We have received the error and will try to fix it quickly, so please try again soon.',
  ],
]);

interface IBetaFormProps {
  contactFormStore?: ContactFormStore;
}

interface IBetaFormState {
  emailValue: string;
}

@inject('contactFormStore')
@observer
export default class BetaForm extends React.Component<
  IBetaFormProps,
  IBetaFormState
> {
  constructor(props: IBetaFormProps) {
    super(props);
    this.state = { emailValue: '' };
  }

  public render() {
    const { contactFormStore } = this.props;

    if (!contactFormStore) {
      return null;
    }

    if (contactFormStore.StateCode === ContactFormStateCode.Processing) {
      return (
        <div id="beta-form-container">
          <div className="beta-form-content">
            <Icon icon={Loading} height={120} width={120} />
          </div>
        </div>
      );
    } else {
      return (
        <div id="beta-form-container">
          <div className="beta-form-content">
            <h2 className="narrow heavy">
              {headerTexts.get(contactFormStore.StateCode)}
            </h2>
            <h4 className="content-intro">
              {messageTexts.get(contactFormStore.StateCode)}
            </h4>
            <form
              className={classNames({
                'beta-form-input': true,
                hidden:
                  contactFormStore.StateCode === ContactFormStateCode.Complete,
              })}
              onSubmit={this.saveEmail}
            >
              <input
                id="beta-form-email"
                value={this.state.emailValue}
                onChange={this.updateEmail}
                type="email"
                placeholder="Email"
              />
              <button
                type="submit"
                style={{ height: '45px' }}
                className="beta-form-send"
              >
                <Icon icon={PaperPlane} height="40px" width="40px" />
              </button>
            </form>
            <h5 className="beta-form-terms">
              {!ContactFormStateCode.Complete ? (
                <span>
                  By signing up, you agree to our <Link to="/terms">Terms</Link>{' '}
                  &amp; <Link to="/privacy">Privacy Policy</Link>.
                </span>
              ) : (
                <span>
                  <Link to="/terms">Terms &amp; Conditions</Link> |{' '}
                  <Link to="/privacy">Privacy Policy</Link>
                </span>
              )}
            </h5>
          </div>
        </div>
      );
    }
  }

    protected updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ emailValue: e.target.value })
    };

    protected saveEmail = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (this.props.contactFormStore) {
            this.props.contactFormStore.SaveEmail(this.state.emailValue)
        }
    }

}
