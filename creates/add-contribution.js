const moment = require('moment');
const Kredits = require('kredits-contracts');
const ethers = require('ethers');

function getAmount (bundle) {
  let amount = 0;
  if (bundle.inputData.amount) {
    amount = parseInt(bundle.inputData.amount);
  } else if (bundle.inputData.amountLabel) {
    let label = bundle.inputData.amountLabel;
    if (Array.isArray(label)) {
      label = bundle.inputData.find(l => l.match(/kredits-(\d+)/i));
    }
    if (label) {
      let match = label.match(/kredits-(\d+)/i);
      if (match) {
        amount = parseInt(match[1]);
      }
    }
  }
  if (bundle.inputData.multiplier) {
    amount = amount * parseInt(bundle.inputData.multiplier);
  }
  return amount;
}

function getContributors (bundle) {
  let conributorIds;
  if (Array.isArray(bundle.inputData.contributors)) {
    contributorIds = bundle.inputData.contributors.map(c => c.id);
  } else {
    contributorIds = bundle.inputData.contributors.split(',');
  }
}

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
    const walletTransactionCount = await kredits.provider.getTransactionCount(kredits.signer.address);
    let nonce = walletTransactionCount;

    let amount = getAmount(bundle);
    if (amount === 0) {
      z.console.log('Amount is 0; Skipping');
      return Promise.resolve();
    }

    z.console.log('Creating contributions for', bundle.inputData.conributorId);
    const contributorIds = bundle.inputData.contributorId.split(',');
    let contributionPromises = contributorIds.map(async (id) => {
      let contributor = await kredits.Contributor.getById(id);
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
      return kredits.Contribution.addContribution(contributionAttr, { nonce: nonce++ }).then(tx => tx.hash);
    });

    return Promise.all(contributionPromises).then(transactionHashes => {
      return { transactionHashes, amount, description: bundle.inputData.description };
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
      { key: 'amount', label: 'Contribution amount', required: false },
      { key: 'amountLabel', label: 'Amount label', required: false, helpText: 'Alternative to the amount input. Parses the amount from an entry like `kredits-500`' },
      { key: 'description', label: 'Contribution description', required: true },
      { key: 'contributorId', label: 'Contributor', required: true, helpText: 'Comma separated list of contributor IDs' },
      { key: 'kind', label: 'Contribution kind', required: false },
      { key: 'url', label: 'URL', required: false }
    ],
    perform: addContribution,
    sample: {
      amount: 100,
      description: "Contribution description"
    }
  }
};
