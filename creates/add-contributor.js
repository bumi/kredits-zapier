const Kredits = require('kredits-contracts');
const ethers = require('ethers');

const addContributor = (z, bundle) => {

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

    let contributorAttr = {
      account: bundle.inputData.account,
      name: bundle.inputData.name,
      url: bundle.inputData.url,
      kind: bundle.inputData.kind || 'person',
      github_uid: bundle.inputData.githubUid,
      github_username: bundle.inputData.githubUsername,
      gitea_username: bundle.inputData.giteaUsername,
    };

    return kredits.Contributor.add(contributionAttr, { nonce: nonce++ })
      .then(tx => {
        contributorAttr.transactionHash = tx.hash;
        return contributionAttr;
      });
  });
};

module.exports = {
  key: 'add_contributor',
  noun: 'Kredits contributor',

  display: {
    label: 'Create Kredits Contributor',
    description: 'Creates a Kredits contributor entry.'
  },

  operation: {
    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'wallet', label: 'Oracle wallet', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
      { key: 'account', label: 'Account', required: true },
      { key: 'name', label: 'Name', required: false },
      { key: 'url', label: 'URL', required: false },
      { key: 'githubUid', label: 'GitHub ID', type: 'integer', required: false },
      { key: 'githubUsername', label: 'GitHub Username', required: false },
      { key: 'giteaUsername', label: 'Gitea Username', required: false }

    ],
    perform: addContributor,
    sample: {
      name: 'Satoshi',
      account: '0x265A133fAA8C57af7be1837fEFa07178a67d77Cc',
      transactionHash: '0x0000112234'
    }
  }
};
