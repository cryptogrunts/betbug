import React, { PureComponent } from 'react';
import '../css/root.css';
import {
  createDescription,
  createOracle,
  createEvent,
  createMarket,
  calcCost,
  calcProfit,
  buyTokens,
  sellTokens,
  resolve,
  withdrawWinnings
} from '../features/betForm/helpers';

import Gnosis from '@gnosis.pm/pm-js';

class App extends PureComponent {
  state = {
    event: {
      title: '',
      resolutionDate: ''
    },
    importedMarket: null,
    market: null,
    cost: null,
    profit: null
  };

  async componentDidMount() {
    const gnosis = await Gnosis.create({
      ethereum: window.web3.currentProvider
    });
    const importedMarket = await gnosis.contracts.Market.at(
      '0xbE2c8e39734eCe4ec201d2106E04216c348E08b8'
    );

    console.log(await importedMarket.buy(0, 100, 1e20));

    console.info('Bought 1 Outcome Token of Outcome with index 1');

    gnosis.lmsrMarketMaker
      .calcCost('0xbE2c8e39734eCe4ec201d2106E04216c348E08b8', 1, 1e18)
      .then(cost => this.setState({ cost }));

    gnosis.lmsrMarketMaker
      .calcProfit('0xbE2c8e39734eCe4ec201d2106E04216c348E08b8', 1, 1e18)
      .then(profit => this.setState({ profit }));

  //   const CategoricalEventArtifact = await gnosis.contracts.CategoricalEvent.at(
  //     '0xf21cCb9fC218b1636DE844b3852Ec9f9ED679B4a'
  //   );

  //   const eventWeb3Contract = await window.web3.eth.contract(
  //     CategoricalEventArtifact.abi,
  //     '0xf21cCb9fC218b1636DE844b3852Ec9f9ED679B4a'
  //   );

  //   this.setState({ market: eventWeb3Contract });
  // }

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
      .then(categoryEvent => {
        this.setState({ categoryEvent });
        return createMarket(categoryEvent);
      })
      .then(market => {
        this.setState({ market });
        this.calcBuyAndSell(market);
      })
      .catch(error => console.error(error));
    this.setState({ loading: false });
  };

  calcBuyAndSell = market => {
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
                  <button
                    onClick={() =>
                      buyTokens(this.state.importedMarket).then(() =>
                        this.calcBuyAndSell(this.state.market)
                      )
                    }
                  >
                    Buy
                  </button>
                </div>
              )}

              {this.state.profit && (
                <div>
                  <p
                  >{`Sell 1 Outcome Token with index 1 gives ${this.state.profit.valueOf() /
                    1e18} ETH tokens of profit`}</p>
                  <button
                    onClick={() =>
                      sellTokens(this.state.market).then(() =>
                        this.calcBuyAndSell(this.state.market)
                      )
                    }
                  >
                    Sell
                  </button>
                </div>
              )}

              <div>
                <button
                  onClick={() =>
                    resolve(this.state.categoryEvent, this.state.market)
                  }
                  type="primary"
                >
                  Resolve
                </button>

                <button
                  onClick={() => withdrawWinnings(this.state.categoryEvent)}
                  type="primary"
                >
                  Withdraw Winnings
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
