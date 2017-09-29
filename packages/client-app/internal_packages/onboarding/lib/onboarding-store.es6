import {AccountStore, Actions, IdentityStore, FolderSyncProgressStore} from 'nylas-exports';
import {ipcRenderer} from 'electron';
import NylasStore from 'nylas-store';

import OnboardingActions from './onboarding-actions';

function accountTypeForProvider(provider) {
  if (provider === 'eas') {
    return 'exchange';
  }
  if (provider === 'custom') {
    return 'imap';
  }
  return provider;
}

class OnboardingStore extends NylasStore {
  constructor() {
    super();

    this.listenTo(OnboardingActions.moveToPreviousPage, this._onMoveToPreviousPage)
    this.listenTo(OnboardingActions.moveToPage, this._onMoveToPage)
    this.listenTo(OnboardingActions.accountJSONReceived, this._onAccountJSONReceived)
    this.listenTo(OnboardingActions.authenticationJSONReceived, this._onAuthenticationJSONReceived)
    this.listenTo(OnboardingActions.setAccountInfo, this._onSetAccountInfo);
    this.listenTo(OnboardingActions.setAccountType, this._onSetAccountType);
    ipcRenderer.on('set-account-type', (e, type) => {
      if (type) {
        this._onSetAccountType(type)
      } else {
        this._pageStack = ['account-choose']
        this.trigger()
      }
    })

    const {existingAccount, addingAccount, accountType} = NylasEnv.getWindowProps();
    this._accountInfo = {};

    if (existingAccount) {
      // Used when re-adding an account after re-connecting
      const existingAccountType = accountTypeForProvider(existingAccount.provider);
      this._pageStack = ['account-settings']
      this._accountInfo = {
        name: existingAccount.name,
        email: existingAccount.emailAddress,
      };
      this._onSetAccountType(existingAccountType);
    } else if (addingAccount) {
      // Adding a new, unknown account
      this._pageStack = ['account-settings'];
      if (accountType) {
        this._onSetAccountType(accountType);
      }
    } else {
      // Standard new user onboarding flow.
      this._pageStack = ['welcome'];
    }
  }

  _onOnboardingComplete = () => {
    // When account JSON is received, we want to notify external services
    // that it succeeded. Unfortunately in this case we're likely to
    // close the window before those requests can be made. We add a short
    // delay here to ensure that any pending requests have a chance to
    // clear before the window closes.
    setTimeout(() => {
      ipcRenderer.send('account-setup-successful');
    }, 100);
  }

  _onSetAccountType = (type) => {
    let nextPage = "account-settings";
    if (type === 'gmail') {
      nextPage = "account-settings-gmail";
    } else if (type === 'exchange') {
      nextPage = "account-settings-exchange";
    }

    Actions.recordUserEvent('Selected Account Type', {
      provider: type,
    });

    // Don't carry over any type-specific account information
    const {email, name, password} = this._accountInfo;
    this._onSetAccountInfo({email, name, password, type});
    this._onMoveToPage(nextPage);
  }

  _onSetAccountInfo = (info) => {
    this._accountInfo = info;
    this.trigger();
  }

  _onMoveToPreviousPage = () => {
    this._pageStack.pop();
    this.trigger();
  }

  _onMoveToPage = (page) => {
    this._pageStack.push(page)
    this.trigger();
  }

  _onAuthenticationJSONReceived = async (json) => {
    const isFirstAccount = AccountStore.accounts().length === 0;

    await IdentityStore.saveIdentity(json);

    setTimeout(() => {
      if (isFirstAccount) {
        this._onSetAccountInfo(Object.assign({}, this._accountInfo, {
          name: `${json.firstname || ""} ${json.lastname || ""}`,
          email: json.email,
        }));
        OnboardingActions.moveToPage('account-choose');
      } else {
        this._onOnboardingComplete();
      }
    }, 1000);
  }

  _onAccountJSONReceived = async (json, localToken, cloudToken) => {
    try {
      const isFirstAccount = AccountStore.accounts().length === 0;

      AccountStore.addAccountFromJSON(json, localToken, cloudToken);
      this._accountFromAuth = AccountStore.accountForEmail(json.email_address);

      Actions.recordUserEvent('Email Account Auth Succeeded', {
        provider: this._accountFromAuth.provider,
      });
      ipcRenderer.send('new-account-added');
      NylasEnv.displayWindow();

      if (isFirstAccount) {
        this._onMoveToPage('initial-preferences');
        Actions.recordUserEvent('First Account Linked', {
          provider: this._accountFromAuth.provider,
        });
      } else {
        await FolderSyncProgressStore.whenCategoryListSynced(json.id)
        this._onOnboardingComplete();
      }
    } catch (e) {
      NylasEnv.reportError(e);
      NylasEnv.showErrorDialog("Unable to Connect Account", "Sorry, something went wrong on the Nylas server. Please try again later.");
    }
  }

  page() {
    return this._pageStack[this._pageStack.length - 1];
  }

  pageDepth() {
    return this._pageStack.length;
  }

  accountInfo() {
    return this._accountInfo;
  }

  accountFromAuth() {
    return this._accountFromAuth;
  }
}

export default new OnboardingStore();
