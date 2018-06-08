var HDWalletProvider = require('truffle-hdwallet-provider');
var { MNEMONIC } = require('./secrets.js');

module.exports = {
  networks: {
    development: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '5777'
    },
    rinkby: {
      provider: function() {
        return new HDWalletProvider(
          MNEMONIC,
          'https://rinkeby.infura.io/qWWCAOLoD65CmWAo4jLg '
        );
      },
      network_id: 4
    }
  }
};
