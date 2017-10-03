import React from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import {Actions} from 'nylas-exports'
import OnboardingStore from './onboarding-store';
import PageTopBar from './page-top-bar';

import WelcomePage from './page-welcome';
import AccountSettingsPage from './page-account-settings';
import InitialPreferencesPage from './page-initial-preferences';


const PageComponents = {
  "welcome": WelcomePage,
  "account-settings": AccountSettingsPage,
  "initial-preferences": InitialPreferencesPage,
}

export default class OnboardingRoot extends React.Component {
  static displayName = 'OnboardingRoot';
  static containerRequired = false;

  constructor(props) {
    super(props);
    this.state = this._getStateFromStore();
  }

  componentDidMount() {
    this.unsubscribe = OnboardingStore.listen(this._onStateChanged, this);
    NylasEnv.center();
    NylasEnv.displayWindow();

    if (NylasEnv.timer.isPending('open-add-account-window')) {
      const {source} = NylasEnv.getWindowProps()
      Actions.recordPerfMetric({
        source,
        action: 'open-add-account-window',
        actionTimeMs: NylasEnv.timer.stop('open-add-account-window'),
        maxValue: 4 * 1000,
      })
    }

    if (NylasEnv.timer.isPending('app-boot')) {
      // If this component is mounted and we are /still/ timing `app-boot`, it
      // means that the app booted for an unauthenticated user and we are
      // showing the onboarding window for the first time.
      // In this case, we can't report `app-boot` time because we don't have a
      // nylasId or accountId required to report a metric.
      // However, we do want to clear the timer by stopping it
      NylasEnv.timer.stop('app-boot')
    }
  }

  componentWillUnmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  _getStateFromStore = () => {
    return {
      page: OnboardingStore.page(),
      pageDepth: OnboardingStore.pageDepth(),
      accountInfo: OnboardingStore.accountInfo(),
    };
  }

  _onStateChanged = () => {
    this.setState(this._getStateFromStore());
  }

  render() {
    const Component = PageComponents[this.state.page];
    if (!Component) {
      throw new Error(`Cannot find component for page: ${this.state.page}`);
    }

    return (
      <div className="page-frame">
        <PageTopBar
          pageDepth={this.state.pageDepth}
          allowMoveBack={!('initial-preferences' === this.state.page)}
        />
        <ReactCSSTransitionGroup
          transitionName="alpha-fade"
          transitionLeaveTimeout={150}
          transitionEnterTimeout={150}
        >
          <div key={this.state.page} className="page-container">
            <Component accountInfo={this.state.accountInfo} ref="activePage" />
          </div>
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}
