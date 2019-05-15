const moment = require('moment');
const Kredits = require('kredits-contracts');
const ethers = require('ethers');

const addContribution = (z, bundle) => {

  let ethProvider = new ethers.getDefaultProvider(bundle.inputData.network);
  let wallet = new ethers.Wallet(bundle.inputData.wallet);
  let signer = wallet.connect(ethProvider);
  let options = {
    addresses: { Kernel: bundle.inputData.daoAddress },
    apm: 'open.aragonpm.eth',
    ipfsConfig: { host: 'ipfs.infura.io', port: '5001', protocol: 'https' }
  };
  return new Kredits(ethProvider, signer, options).init().then(async (kredits) => {

    let contributor = await kredits.Contributor.getById(bundle.inputData.contributorId);
    let amount = parseInt(bundle.inputData.amount) * parseInt(bundle.inputData.multiplier || '1');

    let now = moment();
    let contributionAttr = {
      date: now.format("YYYY-MM-DD"),
      time: now.format('hh:mm:ssZ'),
      amount: amount,
      contributorId: contributor.id,
      contributorIpfsHash: contributor.ipfsHash,
      kind: bundle.inputData.kind || 'dev',
      description: bundle.inputData.description,
      url: bundle.inputData.url || '',
      details: {}
    };

    return kredits.Contribution.addContribution(contributionAttr)
      .then(tx => {
        contributionAttr.transactionHash = tx.hash;
        return contributionAttr;
      });
  });
};

module.exports = {
  key: 'add_contribution',
  noun: 'Kredits contribution',

  display: {
    label: 'Create Kredits Contribution',
    description: 'Creates a Kredits contribution entry.'
  },

  operation: {
    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'wallet', label: 'Oracle wallet', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
      { key: 'amount', label: 'Contribution amount', required: true },
      { key: 'description', label: 'Contribution description', required: true },
      { key: 'contributorId', label: 'Contributor', required: true },
      { key: 'kind', label: 'Contribution kind', required: false },
      { key: 'url', label: 'URL', required: false }
    ],
    perform: addContribution,
    sample: {
      amount: 100,
      description: "Contribution description",
      transactionHash: '0x0000112234'
    }
  }
};
