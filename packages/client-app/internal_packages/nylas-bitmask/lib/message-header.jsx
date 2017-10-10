import {
  React,
  NylasAPI,
  NylasAPIRequest,
} from 'nylas-exports';

import {RetinaImg} from 'nylas-component-kit'
import Spinner from './spinner'

export default class MessageHeader extends React.Component {
  static displayName = 'MessageHeader-bitmask';
  constructor(props) {
    super(props);
    this.state = {}
  }

  _loadMessagesViaAPI(callback, err_func) {
    const messagePath = `/messages/${this.props.messages[0].id}`;
    new NylasAPIRequest({
      api: NylasAPI,
      options: {
        accountId: this.props.messages[0].accountId,
        path: messagePath,
        headers: {Accept: "message/rfc822"},
        json: false,
      },
    })
      .run()
      .then((rawEmail) => {
        callback(rawEmail)
      })
      .catch((err) => {
        err_func(err)
      })
  }

  componentDidMount(){
    this._loadMessagesViaAPI(
      email => {
        this.setState({
          error: false,
          secure: (email.split("\r\n").some(line => {return line === 'X-Leap-Encryption: decrypted'})),
        });
      },
      error => {
        this.setState({error: error});
      }
    )
  }

  render() {
    if (this.state.error) {
      return (
        <img src="nylas://nylas-bitmask/assets/22/error.png" style={{height: "22px"}}/>
      )
    } else if (this.state.secure === true) {
      return (
        <img src="nylas://nylas-bitmask/assets/22/lock.png" style={{height: "22px"}}/>
      )
    } else if (this.state.secure === false) {
      return (
        <img src="nylas://nylas-bitmask/assets/22/unlock.png" style={{height: "22px"}}/>
      )
    } else {
      return (
        <div style={{height: "22px", width: "22px"}}>
          <Spinner height={"22px"} width={"22px"} />
        </div>
      )
    }
  }
}
