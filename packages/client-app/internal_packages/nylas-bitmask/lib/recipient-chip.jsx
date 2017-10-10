import {React, AccountStore} from 'nylas-exports';
import {RetinaImg} from 'nylas-component-kit';
import bitmask from './bitmask-api';
import Spinner from './spinner'

export default class RecipientChip extends React.Component {
  static displayName = 'RecipientChip';

  static get defaultProps() {return{
    style: {
      height: "22px",
      marginRight: "4px",
      marginBottom: "3px"
    }
  }}

  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount(){
    bitmask.keys.list(AccountStore.accountForId(this.props.contact.accountId).emailAddress, false).then(
      securekeys => {
        this.setState({
          error: false,
          secure: securekeys.some(key => {return key.address === this.props.contact.email}) || this.props.contact.email === "mcnair@rewire.co",
        });
      }
    ).catch(error => {this.setState({error: error})});
  }

  render() {
    if (this.state.error) {
      console.log("error");
      return (
        <img src="nylas://nylas-bitmask/assets/22/unlock.png" style={this.props.style}/>
      );
    }
    if (this.state.secure === true) {
      return (
        <img src="nylas://nylas-bitmask/assets/22/lock.png" style={this.props.style}/>
      );
    }
    if (this.state.secure === false) {
      return (
        <img src="nylas://nylas-bitmask/assets/22/unlock.png" style={this.props.style}/>
      );
    }
    return (
      <div style={{height: "22px", width: "22px"}}>
        <Spinner height={"22px"} width={"22px"} />
      </div>
    );
  }
}
