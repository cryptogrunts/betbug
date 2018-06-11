import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Gnosis from '@gnosis.pm/pm-js';
import {
  sellTokens,
  calcCost,
  calcProfit,
  resolve,
  withdrawWinnings,
  buyTokens
} from '../features/betForm/helpers';

class Bets extends PureComponent {
  state = {
    event: {
      title: null
    },
    cost0: null,
    cost1: null,
    cost: null,
    profit: null,
    importedMarket: null
  };

  static propTypes = {
    betId: PropTypes.string.isRequired
  };

  async componentDidMount() {
    const gnosis = await Gnosis.create({
      ethereum: window.web3.currentProvider
    });

    gnosis.lmsrMarketMaker
      .calcCost(this.props.betId, 0, 1e18)
      .then(cost0 => this.setState({ cost0 }));
    gnosis.lmsrMarketMaker
      .calcCost(this.props.betId, 1, 1e18)
      .then(cost1 => this.setState({ cost1 }));

    gnosis.lmsrMarketMaker
      .calcProfit(this.props.betId, 1, 1e18)
      .then(profit => this.setState({ profit }));

    await gnosis
      .loadEventDescription('QmNQvzPautJs6CUKcAVygW9MPdjy9CqEt4jKVx4B2ZwXyK')
      .then(event => this.setState({ event }));
  }

  calcBuyAndSell = market => {
    calcCost(market).then(cost => this.setState({ cost }));
    calcProfit(market).then(profit => this.setState({ profit }));
  };

  handleBuy = async e => {
    const gnosis = await Gnosis.create({
      ethereum: window.web3.currentProvider
    });
    const importedMarket = await gnosis.contracts.Market.at(this.props.betId);

    await importedMarket.buy(e, 100000, 1e17);
  };

  render() {
    return (
      <div>
        <div className="min-h5 mt3">
          {this.state.event.title && <h1>{this.state.event.title} ?</h1>}

          {this.state.event.resolutionDate && (
            <time>{this.state.event.resolutionDate}</time>
          )}
        </div>
        <div>
          {this.state.cost0 ? (
            <div className="dib">
              <p>{`Betting YES costs ${this.state.cost0.valueOf() /
                1e187} ETH`}</p>
              <button onClick={() => this.handleBuy(0)}>Bet YES</button>
            </div>
          ) : (
            <p>Calculating prices...</p>
          )}
          {this.state.cost1 ? (
            <div className="dib ml3">
              <p>{`Betting NO costs ${this.state.cost1.valueOf() /
                1e187} ETH`}</p>
              <button onClick={() => this.handleBuy(1)}>Bet NO</button>
            </div>
          ) : (
            <p>Waking the crypto gods...</p>
          )}
        </div>
        <br />
        <br />
        <br />
        <br />
        {/* {this.state.profit && (
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
            <p className="red">
              only shows if already have tokens and can sell
            </p>
          </div>
        )} */}

        <div>
          <button
            onClick={() => resolve(this.state.categoryEvent, this.state.market)}
            type="primary"
          >
            Resolve
          </button>
          <p className="red">should only show if you created the bet</p>

          <button
            onClick={() => withdrawWinnings(this.state.categoryEvent)}
            type="primary"
          >
            Withdraw Winnings
          </button>
          <p className="red">should only show if you have winnings</p>
        </div>
      </div>
    );
  }
}

export default Bets;
