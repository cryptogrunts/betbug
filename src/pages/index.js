import React, { Component } from 'react';
import '../css/root.css';
import {
  createDescription,
  createOracle,
  createEvent,
  createMarket,
  calcCost,
  calcProfit,
  buyTokens,
  sellTokens
} from '../features/betForm/helpers';

class App extends Component {
  state = {
    event: {
      title: '',
      resolutionDate: ''
    },
    market: null,
    cost: null,
    profit: null
  };

  // betResolve = async event => {
  //   event.preventDefault();
  //   const { categoryEvent } = this.state;
  //   console.log('Resolving worst case scenario ...');
  //   const gnosis = await Gnosis.create();

  //   await gnosis.resolveEvent({ categoryEvent, outcome: 1 });
  // };

  // owner of the market

  // closeAndWithdraw = async event => {
  //   event.preventDefault();
  //   const { market } = this.state;
  //   async function closeAndWithdraw() {
  //     Gnosis.requireEventFromTXResult(await market.close(), 'MarketClose');
  //     Gnosis.requireEventFromTXResult(
  //       await market.withdrawFees(),
  //       'MarketFeeWithdrawal'
  //     );
  //   }
  // };

  handleChange = (field, value) => {
    let event = { ...this.state.event };
    event[field] = value;
    this.setState({ event });
  };

  handleSubmit = async (title, deadline) => {
    this.setState({ loading: true });
    await createDescription(title, deadline)
      .then(hash => createOracle(hash))
      .then(oracle => createEvent(oracle))
      .then(categoryEvent => createMarket(categoryEvent))
      .then(market => {
        this.setState({ market });
        this.calcBuyAndSell(market);
      })
      .catch(error => console.error(error));
    this.setState({ loading: false });
  };

  calcBuyAndSell = async market => {
    calcCost(market).then(cost => this.setState({ cost }));
    calcProfit(market).then(profit => this.setState({ profit }));
  };

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">
            BET BUG
          </a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <div className="min-h5 mt3">
                {this.state.event.title && <h1>{this.state.event.title} ?</h1>}
                {this.state.event.title && (
                  <ul>
                    <li>Yes</li>
                    <li>No</li>
                  </ul>
                )}
                {this.state.event.resolutionDate && (
                  <time>{this.state.event.resolutionDate}</time>
                )}
              </div>

              <hr />
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
                onChange={e =>
                  this.handleChange('resolutionDate', e.target.value)
                }
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
              <hr />
              {this.state.cost && (
                <div>
                  <p
                  >{`Buy 1 Outcome Token with index 1 costs ${this.state.cost.valueOf() /
                    1e187} ETH tokens`}</p>
                  <button onClick={() => buyTokens()}>Buy</button>
                </div>
              )}

              {this.state.profit && (
                <div>
                  <p
                  >{`Sell 1 Outcome Token with index 1 gives ${this.state.profit.valueOf() /
                    1e18} ETH tokens of profit`}</p>
                  <button onClick={() => sellTokens()}>Sell</button>
                </div>
              )}

              {/*
          
             
             
              <div>
                <button onClick={this.betResolve} type="primary">
                  Resolve
                </button>
              </div> */}
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
