const Kredits = require('kredits-contracts');
const ethers = require('ethers');

module.exports = {
  key: 'get_contributor',

  noun: 'Kredits Contributor',
  display: {
    label: 'Find Contributor',
    description: 'Search for a contributor by account details or ID.'
  },

  operation: {
    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
      { key: 'contributorId', label: 'Contributor ID', required: false },
      {
        key: 'site',
        type: 'string',
        label: 'Account Site',
        helpText: 'Account site (e.g. github.com)',
        required: true
      },
      {
        key: 'accountUid',
        type: 'integer',
        label: 'Account ID',
        helpText: 'The user id on that site',
        required: false
      },
      {
        key: 'accountUsername',
        type: 'string',
        label: 'Account Username',
        helpText: 'The user name on that site',
        required: false
      }
    ],

    perform: (z, bundle) => {
      let ethProvider = new ethers.getDefaultProvider(bundle.inputData.network);
      let options = {
        addresses: { Kernel: bundle.inputData.daoAddress },
        apm: 'open.aragonpm.eth',
        ipfsConfig: { host: 'ipfs.infura.io', port: '5001', protocol: 'https' }
      };
      return new Kredits(ethProvider, null, options).init().then(kredits => {
        if (bundle.inputData.contributorId) {
          return kredits.Contributor.getById(bundle.inputData.contributorId)
            .then(c => { return [c] });
        }
        let search = { site: bundle.inputData.site };
        if (bundle.inputData.accountUid) {
          search.uid = parseInt(bundle.inputData.accountUid);
        } else if (bundle.inputData.accountUsername) {
          search.username = bundle.inputData.accountUsername;
        } else {
          return Promise.resolve();
        }

        return kredits.Contributor.filterByAccount(search);
      });
    },

    sample: {
      id: 1,
      name: 'Satoshi',
      ipfsHash: 'QmdVBRx32Udya5PTNOJH3q6XAFiCm8DyHeaXpSDdgDmwam',
      balanceInt: 2342
    },

    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'name', label: 'Name'},
      {key: 'ipfsHash', label: 'IPFS Hash'},
      {key: 'balanceInt', label: 'Kredits Balance'}
    ]
  }
};
