import * as classNames from 'classnames';
import { inject, observer } from 'mobx-react';
import * as React from 'react';
import Icon from '../../iconography/Icon';
import { Loading, PaperPlane } from '../../iconography/Icons';
import {
  ContactFormStateCode,
  ContactFormStore,
} from '../../stores/contact-form';
import './SmallForm.css';

const headerTexts: Map<ContactFormStateCode, string> = new Map<
  ContactFormStateCode,
  string
>([
  [
    ContactFormStateCode.Initial,
    'Sign-up to get the floracast e-mailed to you twice a week.',
  ],
  [ContactFormStateCode.Complete, 'Awesome!'],
  [ContactFormStateCode.Exists, "You're already on the list!"],
  [ContactFormStateCode.Failed, 'Something broke ...'],
]);

// const messageTexts: Map<ContactFormStateCode, string> = new Map<
//   ContactFormStateCode,
//   string
// >([
//   [
//     ContactFormStateCode.Initial,
//     '',
//     // "The model updates on the site every day, and twice a week you can get an e-mail with a forecast for where you are and what you're interested in.",
//   ],
//   [
//     ContactFormStateCode.Complete,
//     'Thank you for signing up! We will let you know as soon as the project is ready to try.',
//   ],
//   [ContactFormStateCode.Exists, ''],
//   [
//     ContactFormStateCode.Failed,
//     'We apologize, but your e-mail could not be saved. We have received the error and will try to fix it quickly, so please try again soon.',
//   ],
// ]);

interface ISmallFormProps {
  contactFormStore?: ContactFormStore;
}

interface ISmallFormState {
  emailValue: string;
}

@inject('contactFormStore')
@observer
export default class SmallForm extends React.Component<
  ISmallFormProps,
  ISmallFormState
> {
  constructor(props: ISmallFormProps) {
    super(props);
    this.state = { emailValue: '' };
  }

  public render() {
      const {contactFormStore} = this.props;

      if (!contactFormStore) {
          return null;
      }

      return (

          <div className="small-form-container">

              {contactFormStore.StateCode === ContactFormStateCode.Processing &&
                <div className="small-form-content">
                    <Icon id="small-form-loading-icon" icon={Loading} height={"90%"} width={"auto"}/>
                </div>
              }
              {contactFormStore.StateCode !== ContactFormStateCode.Processing &&
              <div className="small-form-content">
                  <h4 className="small-form-intro">
                      {headerTexts.get(contactFormStore.StateCode)}
                  </h4>
                  <form
                      className={classNames({
                          hidden:
                          contactFormStore.StateCode === ContactFormStateCode.Complete,
                          'small-form-form': true,
                      })}
                      onSubmit={this.saveEmail}
                  >
                      <input
                          className="small-form-input"
                          value={this.state.emailValue}
                          onChange={this.updateEmail}
                          type="email"
                          placeholder="Email"
                      />
                      <button type="submit" className="small-form-button">
                          <Icon
                              icon={PaperPlane}
                              height="3.5rem"
                              width="3.5rem"
                              color="#fff"
                          />
                      </button>
                  </form>
              </div>
              }
          </div>

      );
  }

  protected updateEmail = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        this.setState({emailValue: e.target.value})
  }

  protected saveEmail = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (this.props.contactFormStore) {
          this.props.contactFormStore.SaveEmail(this.state.emailValue)
      }
  }

}
