//
// Nylas has a spinner class, but it is designed to show a large
// overlay spinner.
//
// This is a circular spinner that works well in small spaces.
//

import React from 'react';

class Spinner extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let bars = [];
    const props = this.props;

    for (let i = 0; i < 12; i++) {
      let barStyle = {};
      barStyle.animationDelay =
        (i - 12) / 10 + 's';

      barStyle.transform =
        'rotate(' + (i * 30) + 'deg) translate(146%)';

      bars.push(
        <div style={barStyle} className="rewire-spinner-item" key={i} />
      );
    }

    return (
      <div style={{height: this.props.height, width: this.props.width}} className={(props.className || '') + ' rewire-spinner'}>
        {bars}
      </div>
    );
  }
};

export default Spinner;