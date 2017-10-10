import {Actions, AccountStore, Contact, React} from 'nylas-exports';
import {RetinaImg} from 'nylas-component-kit';
import bitmask from './bitmask-api';

export default class ParticipantsFooter extends React.Component {
  static displayName = 'ParticipantsFooter';
  constructor(props) {
    super(props);

    this.state = {
      insecureContacts: [],
    };

    this.inviteMessageSubject = "Try out rewire!";
    this.isInviteMessage = this.props.draft.subject === this.inviteMessageSubject;

    this.inviteContacts = this.inviteContacts.bind(this);
  }

  shouldComponentUpdate(prevProps, prevState){
    return (!_.isEqual(prevProps.draft.to, this.props.draft.to) ||
            !_.isEqual(prevProps.draft.cc, this.props.draft.cc) ||
            !_.isEqual(prevProps.draft.bcc, this.props.draft.bcc) ||
            !_.isEqual(prevState.insecureContacts, this.state.insecureContacts));
  }

  render() {
    // If this is already an invite message, don't show a prompt to invite people.
    if (this.isInviteMessage){
      return (<div />)
    }

    const participants = this.props.draft.to.concat(this.props.draft.cc).concat(this.props.draft.bcc);

    bitmask.keys.list(AccountStore.accountForId(this.props.draft.accountId).emailAddress, false).then(
      (secureKeys) => {
        this.setState({
          insecureContacts: _.difference(
            _.without(participants.map(participant => {return participant.email}), "mcnair@rewire.co"),
            secureKeys.map(key => {return key.address})
          )}
        );
      }
    ).catch(error => {return undefined});

    if (this.state.insecureContacts.length === 0){
      return ( <div /> )
    }

    return (
      <div className="collapsed-composer-participants">
        <strong>Warning</strong>: this message will be sent to some contacts insecurely.
        <button
          onClick={this.inviteContacts}
          style={{"margin-left": "10px"}}
          className="btn btn-normal btn-emphasis btn-text"
        >
          Invite them to Rewire!
        </button>
      </div>
    );
  }

  inviteContacts(){
    for (let contact of this.state.insecureContacts){
      Actions.composeNewDraft({
        to: [new Contact({email: contact})],
        subject: this.inviteMessageSubject,
        body: "Join me on Rewire! Rewire allows secure conversations without having to trust the organization running your email. Sign up at https://rewire.co/signup"
      });
    }
  }
}
