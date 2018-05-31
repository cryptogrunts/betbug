import React, { Component } from 'react';
import SimpleStorageContract from '../build/contracts/SimpleStorage.json';
import getWeb3 from './utils/getWeb3';
import Gnosis from '@gnosis.pm/pm-js';
import './css/oswald.css';
import './css/open-sans.css';
import './css/pure-min.css';
import './App.css';

let gnosis, ipfsHash;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      storageValue: 0,
      web3: null,
      oracle: null,
      event: {
        title: 'Loading...'
      }
    };
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        this.setState({
          web3: results.web3
        });

        // Instantiate contract once web3 provided.
        this.instantiateContract();
      })
      .catch(() => {
        console.log('Error finding web3.');
      });
  }

  componentDidMount() {
    this.createDescription();
  }

  instantiateContract() {
    /*
     * SMART CONTRACT EXAMPLE
     *
     * Normally these functions would be called in the context of a
     * state management library, but for convenience I've placed them here.
     */

    const contract = require('truffle-contract');
    const simpleStorage = contract(SimpleStorageContract);
    simpleStorage.setProvider(this.state.web3.currentProvider);

    // Declaring this for later so we can chain functions on SimpleStorage.
    var simpleStorageInstance;

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage
        .deployed()
        .then(instance => {
          simpleStorageInstance = instance;

          // Stores a given value, 5 by default.
          return simpleStorageInstance.set(5, { from: accounts[0] });
        })
        .then(result => {
          // Get the value from the contract to prove it worked.
          return simpleStorageInstance.get.call(accounts[0]);
        })
        .then(result => {
          // Update state with the result.
          return this.setState({ storageValue: result.c[0] });
        });
    });
  }

  createDescription = async () => {
    gnosis = await Gnosis.create();
    ipfsHash = await gnosis.publishEventDescription({
      title: 'Who will win the U.S. presidential election of 2016?',
      description:
        'Every four years, the citizens of the United States vote for their next president...',
      resolutionDate: '2016-11-08T23:00:00-05:00',
      outcomes: ['Clinton', 'Trump', 'Other']
    });
    // now the event description has been uploaded to ipfsHash and can be used
    console.assert(
      (await gnosis.loadEventDescription(ipfsHash)).title ===
        'Who will win the U.S. presidential election of 2016?'
    );

    let event = await gnosis.loadEventDescription(ipfsHash);

    this.setState({ event });

    console.info(
      `Ipfs hash: https://ipfs.infura.io/api/v0/cat?stream-channels=true&arg=${ipfsHash}`
    );
    this.setState({ hash: ipfsHash });
  };
  createOracle = async event => {
    event.preventDefault();
    let oracle;
    console.log('creating oracle...');
    const gnosis = await Gnosis.create();
    console.log('ipfs hash is', this.state.hash);
    oracle = await gnosis.createCentralizedOracle(this.state.hash);
    console.info(`Oracle created with address ${oracle.address}`);
    this.setState({ oracle });
  };

  createEvent = async event => {
    event.preventDefault();
    console.log('firing categorical event....');
    let oracle = this.state.oracle;
    const depositValue = 100000;

    const categoryEvent = await gnosis.createCategoricalEvent({
      collateralToken: gnosis.etherToken,
      oracle,
      outcomeCount: 2
    });
    console.info(
      `Categorical event created with address ${categoryEvent.address}`
    );
    this.setState({ categoryEvent });
    console.log('event is', categoryEvent);

    // What im experimenting with today
    // here I'm basically trying to improt tx results into the same contract
    console.log('getting tx results ..... ');
    const txResults = await Promise.all(
      [
        [
          gnosis.etherToken.constructor,
          await gnosis.etherToken.deposit.sendTransaction({
            value: depositValue
          })
        ],
        [
          gnosis.etherToken.constructor,
          await gnosis.etherToken.approve.sendTransaction(
            categoryEvent.address,
            depositValue
          )
        ],
        [
          categoryEvent.constructor,
          await categoryEvent.buyAllOutcomes.sendTransaction(depositValue)
        ]
      ].map(([contract, txHash]) => contract.syncTransaction(txHash))
    );

    // Make sure everything worked
    const expectedEvents = ['Deposit', 'Approval', 'OutcomeTokenSetIssuance'];
    txResults.forEach((txResult, i) => {
      Gnosis.requireEventFromTXResult(txResult, expectedEvents[i]);
    });
    console.log('txResult', txResults);

    console.log('Checking bet balance ...');

    const { Token } = gnosis.contracts;
    const outcomeCount = (await categoryEvent.getOutcomeCount()).valueOf();
    console.log('Outcome count is', outcomeCount);
    for (let i = 0; i < outcomeCount; i++) {
      const outcomeToken = await Token.at(await categoryEvent.outcomeTokens(i));
      console.log(
        'Have',
        (await outcomeToken.balanceOf(gnosis.defaultAccount)).valueOf(),
        'units of outcome',
        i
      );
    }
  };

  createMarket = async event => {
    event.preventDefault();
    let market;
    const gnosis = await Gnosis.create();

    const categoryEvent = this.state.categoryEvent;
    console.log('creating market ..');
    market = await gnosis.createMarket({
      event: categoryEvent.address,
      marketMaker: gnosis.lmsrMarketMaker,
      fee: 50000
      // signifies a 5% fee on transactions
      // see docs at Gnosis.createMarket (api-reference.html#createMarket) for more info
    });
    console.info(`Market created with address ${market.address}`);
    this.setState({ market });
    //Funding market with 4 eth to provide liquidity. There is a bounded loss the market maker can expect via LMSR function
    const txResults = await Promise.all(
      [
        [
          gnosis.etherToken.constructor,
          await gnosis.etherToken.deposit.sendTransaction({ value: 4e18 })
        ],
        [
          gnosis.etherToken.constructor,
          await gnosis.etherToken.approve.sendTransaction(market.address, 4e18)
        ],
        [market.constructor, await market.fund.sendTransaction(4e18)]
      ].map(([contract, txHash]) => contract.syncTransaction(txHash))
    );

    const expectedEvents = ['Deposit', 'Approval', 'MarketFunding'];
    txResults.forEach((txResult, i) => {
      Gnosis.requireEventFromTXResult(txResult, expectedEvents[i]);
    });
    console.log('expected events', txResults);
  };

  calcCost = async event => {
    event.preventDefault();
    const market = this.state.market;
    const gnosis = await Gnosis.create();
    console.log('LMSR  cost...');
    const cost = await gnosis.lmsrMarketMaker.calcCost(market.address, 1, 1e17);
    console.info(
      `Buy 1 Outcome Token with index 1 costs ${cost.valueOf() /
        1e187} ETH tokens`
    );
  };
  calcProfit = async event => {
    event.preventDefault();
    const marketAddress = this.state.market.address;

    const profit = await gnosis.lmsrMarketMaker.calcProfit(
      marketAddress,
      1,
      1e18
    );
    console.info(
      `Sell 1 Outcome Token with index 1 gives ${profit.valueOf() /
        1e18} ETH tokens of profit`
    );
  };

  buyTokens = async event => {
    event.preventDefault();
    const { market } = this.state;
    const gnosis = await Gnosis.create();
    console.log('bet on outcome that we win ....');
    await gnosis.buyOutcomeTokens({
      market,
      outcomeTokenIndex: 1,
      outcomeTokenCount: 1e18
    });
    console.info('Bought 1 Outcome Token of Outcome with index 1');
  };
  sellTokens = async event => {
    event.preventDefault();
    const market = this.state.market;
    const gnosis = await Gnosis.create();
    await gnosis.sellOutcomeTokens({
      market,
      outcomeTokenIndex: 1,
      outcomeTokenCount: 1e18
    });
  };
  betResolve = async event => {
    event.preventDefault();
    const { categoryEvent } = this.state;
    console.log('Resolving worst case scenario ...');
    const gnosis = await Gnosis.create();

    await gnosis.resolveEvent({ categoryEvent, outcome: 1 });
  };

  // owner of the market

  closeAndWithdraw = async event => {
    event.preventDefault();
    const { market } = this.state;
    async function closeAndWithdraw() {
      Gnosis.requireEventFromTXResult(await market.close(), 'MarketClose');
      Gnosis.requireEventFromTXResult(
        await market.withdrawFees(),
        'MarketFeeWithdrawal'
      );
    }
  };

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
          <a href="#" className="pure-menu-heading pure-menu-link">
            Truffle Box
          </a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>{this.state.event.title}</h1>
              <p>
                {this.state.event.resolutionDate &&
                  this.state.event.resolutionDate}
              </p>
              <ul>
                {this.state.event.outcomes &&
                  this.state.event.outcomes.map(item => (
                    <li key={item}>{item}</li>
                  ))}
              </ul>
              <button onClick={this.createOracle} type="primary">
                Create Oracle
              </button>
              <div>
                <button onClick={this.createEvent} type="primary">
                  Create Event
                </button>
              </div>
              <div>
                <button onClick={this.createMarket} type="primary">
                  Create Market
                </button>
              </div>
              <div>
                <button onClick={this.calcCost} type="primary">
                  Calculate cost
                </button>
              </div>
              <div>
                <button onClick={this.calcProfit} type="primary">
                  Calculate Profit
                </button>
              </div>
              <div>
                <button onClick={this.buyTokens} type="primary">
                  Buy Tokens
                </button>
              </div>
              <div>
                <button onClick={this.sellTokens} type="primary">
                  Sell Tokens
                </button>
              </div>
              <div>
                <button onClick={this.betResolve} type="primary">
                  Resolve
                </button>
              </div>

              <h2>Smart Contract Example</h2>
              <p>
                If your contracts compiled and migrated successfully, below will
                show a stored value of 5 (by default).
              </p>
              <p>
                Try changing the value stored on <strong>line 59</strong> of
                App.js.
              </p>
              <p>The stored value is: {this.state.storageValue}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }
}

export default App;
