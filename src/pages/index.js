import React, { PureComponent } from 'react';
import '../css/root.css';
import {
  createDescription,
  createOracle,
  createEvent,
  createMarket
} from '../features/betForm/helpers';
import { Link } from '@reach/router';

class App extends PureComponent {
  state = {
    event: {
      title: '',
      resolutionDate: ''
    }
  };

  handleChange = (field, value) => {
    let event = { ...this.state.event };
    event[field] = value;
    this.setState({ event });
  };

  handleSubmit = async (title, deadline) => {
    this.setState({ loading: true });
    await createDescription(title, deadline)
      .then(hash => {
        console.log('hash', hash);
        return createOracle(hash);
      })
      .then(oracle => createEvent(oracle))
      .then(categoryEvent => {
        this.setState({ categoryEvent });
        return createMarket(categoryEvent);
      })
      .then(market => {
        this.setState({ market });
      })
      .catch(error => console.error(error));
    this.setState({ loading: false });
  };

  render() {
    return (
      <div className="pure-g">
        <div className="pure-u-1-1">
          <h2>Create your bet</h2>
          <label htmlFor="title" className="db">
            Title
          </label>
          <input
            type="text"
            value={this.state.event.title}
            name="title"
            className="db"
            onChange={e => this.handleChange('title', e.target.value)}
            placeholder="Yes/No questions only."
          />

          <label htmlFor="deadline" className="db">
            Deadline
          </label>

          <input
            type="datetime-local"
            value={this.state.event.resolutionDate}
            name="deadline"
            className="db"
            onChange={e => this.handleChange('resolutionDate', e.target.value)}
          />

          <button
            onClick={() =>
              this.handleSubmit(
                this.state.event.title,
                this.state.event.deadline
              )
            }
          >
            Create Your Bet
          </button>

          {this.state.loading && <p>Creating your bet...</p>}
          {this.state.market && (
            <Link className="bg-red" to={`/bet/${this.state.market.address}`}>
              Go to Your New Bet
            </Link>
          )}
        </div>
      </div>
    );
  }
}

export default App;
