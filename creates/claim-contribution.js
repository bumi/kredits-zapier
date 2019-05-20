const Kredits = require('kredits-contracts');
const ethers = require('ethers');

const claimContribution = (z, bundle) => {

  let ethProvider = new ethers.getDefaultProvider(bundle.inputData.network);
  let wallet = new ethers.Wallet(bundle.inputData.wallet);
  let signer = wallet.connect(ethProvider);
  let options = {
    addresses: { Kernel: bundle.inputData.daoAddress },
    apm: 'open.aragonpm.eth',
    ipfsConfig: { host: 'ipfs.kosmos.org', port: '5444', protocol: 'https' }
  };
  return new Kredits(ethProvider, signer, options).init().then(async (kredits) => {
    const latestBlock = await kredits.provider.getBlockNumber();
    const walletTransactionCount = await kredits.provider.getTransactionCount(kredits.signer.address);
    let nonce = walletTransactionCount;

    let contributionIds = [];
    if (bundle.inputData.contributionId) {
      contributionIds.push(bundle.inputData.contributionId);
    }
    if (bundle.inputData.contributorId) {
      let contributions = await kredits.Contribution.all({page: {size: 50}});
      contributions.forEach(c => {
        let confirmed = latestBlock > c.confirmedAtBlock;
        if (!c.claimed && !c.vetoed && confirmed && c.contributorId === parseInt(bundle.inputData.contributorId)) {
          contributionIds.push(c.id);
        }
      });
    }
    let claims = contributionIds.map(c => kredits.Contribution.functions.claim(c, { nonce: nonce++ }));
    return Promise.all(claims).then(transactions => {
      return { transactionHashes: transactions.map(t => t.hash) };
    });
  });
};

module.exports = {
  key: 'claim_contributions',
  noun: 'Kredits Claim',

  display: {
    label: 'Claim Kredits Contributions',
    description: 'Claims Kredits contribution tokens.'
  },

  operation: {
    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'wallet', label: 'Oracle wallet', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
      { key: 'contributorId', label: 'Contributor ID', type: 'integer', required: true },
    ],
    perform: claimContribution,
    sample: {
      transactionHashes: ['0x0000112234']
    }
  }
};
