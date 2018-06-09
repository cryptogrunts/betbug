// @ts-check
import Gnosis from '@gnosis.pm/pm-js';

let gnosis, ipfsHash, market;

/**  @param {string} title */
/**  @param {number} resolutionDate */
export const createDescription = async (title, resolutionDate) => {
  gnosis = await Gnosis.create();
  // gnosis = await Gnosis.create({ rinkby: window.web3.currentProvider });
  ipfsHash = await gnosis.publishEventDescription({
    title,
    resolutionDate,
    outcomes: ['Yes', 'No']
  });

  return ipfsHash;
};

/**  @param {string} hash */
export const createOracle = async hash =>
  await gnosis.createCentralizedOracle(hash);

export const createEvent = async oracle => {
  const depositValue = 100000;
  const categoryEvent = await gnosis.createCategoricalEvent({
    collateralToken: gnosis.etherToken,
    oracle,
    outcomeCount: 2
  });

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

  const { Token } = gnosis.contracts;
  const outcomeCount = (await categoryEvent.getOutcomeCount()).valueOf();

  for (let i = 0; i < outcomeCount; i++) {
    const outcomeToken = await Token.at(await categoryEvent.outcomeTokens(i));
    console.log(
      'Have',
      (await outcomeToken.balanceOf(gnosis.defaultAccount)).valueOf(),
      'units of outcome',
      i
    );
  }

  return categoryEvent;
};

export const createMarket = async categoryEvent => {
  market = await gnosis.createMarket({
    event: categoryEvent.address,
    marketMaker: gnosis.lmsrMarketMaker,
    fee: 50000
    // signifies a 5% fee on transactions
    // see docs at Gnosis.createMarket (api-reference.html#createMarket) for more info
  });
  console.log('the market address is ', market.address);

  //Funding market with 4 eth to provide liquidity. There is a bounded loss the market maker can expect via LMSR function
  const txResults = await Promise.all(
    [
      [
        gnosis.etherToken.constructor,
        await gnosis.etherToken.deposit.sendTransaction({ value: 4e5 })
      ],
      [
        gnosis.etherToken.constructor,
        await gnosis.etherToken.approve.sendTransaction(market.address, 4e5)
      ],
      [market.constructor, await market.fund.sendTransaction(4e5)]
    ].map(([contract, txHash]) => contract.syncTransaction(txHash))
  );

  const expectedEvents = ['Deposit', 'Approval', 'MarketFunding'];

  txResults.forEach((txResult, i) => {
    Gnosis.requireEventFromTXResult(txResult, expectedEvents[i]);
    console.log('txResult', txResult);
  });

  return market;
};

//@dev using 'currentMarket' as a parameter instead of 'market' because of a name clash with the global variable declard at the top of this file
export const calcCost = async currentMarket =>
  await gnosis.lmsrMarketMaker.calcCost(currentMarket.address, 1, 1e18);

export const calcProfit = async currentMarket =>
  await gnosis.lmsrMarketMaker.calcProfit(currentMarket.address, 1, 1e18);

export const buyTokens = async () => {
  await gnosis.buyOutcomeTokens({
    market,
    outcomeTokenIndex: 1,
    outcomeTokenCount: 100
  });
  console.info('Bought 1 Outcome Token of Outcome with index 1');
};

export const sellTokens = async () => {
  await gnosis.sellOutcomeTokens({
    market,
    outcomeTokenIndex: 1,
    outcomeTokenCount: 1000
  });
  console.info('sold 1 Outcome Token of Outcome with index 1');
};

export const resolve = async (categoryEvent, market) => {
  await gnosis
    .resolveEvent({ event: categoryEvent, outcome: 1 })
    .catch(error => console.error(error));

  // @dev close and withdraw
  Gnosis.requireEventFromTXResult(await market.close(), 'MarketClose');
  Gnosis.requireEventFromTXResult(
    await market.withdrawFees(),
    'MarketFeeWithdrawal'
  );
};

export const withdrawWinnings = async categoryEvent =>
  Gnosis.requireEventFromTXResult(
    await categoryEvent.redeemWinnings(),
    'WinningsRedemption'
  );
