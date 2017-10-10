import {React} from 'nylas-exports';
import {RetinaImg} from 'nylas-component-kit'

export default class ThreadListIcon extends React.Component {
  static displayName = 'ThreadListIcon';
  constructor(props) {
    super(props);
  }

  render() {
    console.log(this.props);
    let secure = false;
    if (secure) {
      return (
        <img src="nylas://nylas-bitmask/assets/16/lock.png" style={{height: "16px", float: "right"}}/>
      );
    } else {
      return (
        <img src="nylas://nylas-bitmask/assets/16/unlock.png" style={{height: "16px", float: "right"}}/>
      );
    }
  }
}
