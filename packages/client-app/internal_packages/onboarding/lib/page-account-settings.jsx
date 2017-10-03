import React from 'react';
import {RegExpUtils} from 'nylas-exports';

import OnboardingActions from './onboarding-actions';
import CreatePageForForm from './decorators/create-page-for-form';
import {accountInfoWithIMAPAutocompletions, runAuthRequest} from './onboarding-helpers';
import FormField from './form-field';

import bitmask from './bitmask-api';

class AccountBasicSettingsForm extends React.Component {
  static displayName = 'AccountBasicSettingsForm';

  static propTypes = {
    accountInfo: React.PropTypes.object,
    errorFieldNames: React.PropTypes.array,
    submitting: React.PropTypes.bool,
    onConnect: React.PropTypes.func,
    onFieldChange: React.PropTypes.func,
    onFieldKeyPress: React.PropTypes.func,
  };

  static submitLabel = (accountInfo) => {
    return (accountInfo.type === 'imap') ? 'Continue' : 'Connect Account';
  }

  static titleLabel = (AccountType) => {
    return AccountType.title || `Add your Rewire account`;
  }

  static subtitleLabel = () => {
    return 'Enter your Rewire account credentials to get started.';
  }

  static validateAccountInfo = (accountInfo) => {
    const {email, password, name} = accountInfo;
    const errorFieldNames = [];
    let errorMessage = null;

    if (!email || !password || !name) {
      return {errorMessage, errorFieldNames, populated: false};
    }

    if (!RegExpUtils.emailRegex().test(accountInfo.email)) {
      errorFieldNames.push('email')
      errorMessage = "Please provide a valid email address."
    }
    if (!accountInfo.password) {
      errorFieldNames.push('password')
      errorMessage = "Please provide a password for your account."
    }
    if (!accountInfo.name) {
      errorFieldNames.push('name')
      errorMessage = "Please provide your name."
    }

    return {errorMessage, errorFieldNames, populated: true};
  }

  submit() {
    let accountInfo = {
      email: this.props.accountInfo.email,
      type: "imap",
      name: this.props.accountInfo.name,
      imap_host: '127.0.0.1',
      imap_port: 1984,
      imap_username: this.props.accountInfo.email,
      imap_security: "none",
      imap_allow_insecure_ssl:  false,
      smtp_host: '127.0.0.1',
      smtp_port: 2013,
      smtp_username: this.props.accountInfo.email,
      smtp_security: "none",
      smtp_allow_insecure_ssl: true,
    };
    console.log("here");
    bitmask.bonafide.user.auth(this.props.accountInfo.email, this.props.accountInfo.password, true).then(
      (response) => {
        console.log("response")
        console.log(response);
        bitmask.mail.get_token(this.props.accountInfo.email).then((response) => {
          accountInfo.imap_password = response.token;
          accountInfo.smtp_password = response.token;
          const reqOptions = {};
          console.log(response);
          runAuthRequest(accountInfo, reqOptions)
            .then((json) => {
              console.log(json);
              OnboardingActions.setAccountInfo(accountInfo);
              OnboardingActions.accountJSONReceived(json, json.localToken, json.cloudToken)
            })
        })
      }
    );
  }

  render() {
    return (
      <form className="settings">
        <FormField field="name" title="Name" {...this.props} />
        <FormField field="email" title="Email" {...this.props} />
        <FormField field="password" title="Password" type="password" {...this.props} />
      </form>
    )
  }
}

export default CreatePageForForm(AccountBasicSettingsForm);
