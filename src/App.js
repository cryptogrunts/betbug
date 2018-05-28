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
  createBet = async event => {
    event.preventDefault();

    const depositValue = 100000;
    let oracle, market;
    console.log('creating oracle...');
    const gnosis = await Gnosis.create();
    console.log('ipfs hash is', this.state.hash);
    oracle = await gnosis.createCentralizedOracle(this.state.hash);
    console.info(`Oracle created with address ${oracle.address}`);
    this.setState({ oracle });
    console.log('firing categorical event....');

    const categoryEvent = await gnosis.createCategoricalEvent({
      collateralToken: gnosis.etherToken,
      oracle,
      // Note the outcomeCount must match the length of the outcomes array published on IPFS
      outcomeCount: 3
    });
    console.info(
      `Categorical event created with address ${categoryEvent.address}`
    );
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
              <button onClick={this.createBet} type="primary">
                Create Bet
              </button>
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
