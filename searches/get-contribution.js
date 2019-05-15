const Kredits = require('kredits-contracts');
const ethers = require('ethers');

module.exports = {
  key: 'contribution',

  noun: 'Kredits Contribution',
  display: {
    label: 'Find Contribution',
    description: 'Search for a contribution by ID'
  },

  operation: {
    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
      { key: 'contributionId', label: 'Contribution ID', required: true },
    ],

    perform: (z, bundle) => {
      let ethProvider = new ethers.getDefaultProvider(bundle.inputData.network);
      let options = {
        addresses: { Kernel: bundle.inputData.daoAddress },
        apm: 'open.aragonpm.eth',
        ipfsConfig: { host: 'ipfs.infura.io', port: '5001', protocol: 'https' }
      };
      return new Kredits(ethProvider, null, options).init().then(kredits => {
        return kredits.Contribution.getById(bundle.inputData.contributionId);
      });
    },

    sample: {
      id: 1,
      contributorId: 23,
      amount: 500,
      description: 'Kredits contribution',
      vetoed: true,
      claimed: false,
      ipfsHash: 'QmdVBRx32Udya5PTNOJH3q6XAFiCm8DyHeaXpSDdgDmwam',
      url: 'https://kredits.kosmos.org'
    },

    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'contributorId', label: 'Contributor Id'},
      {key: 'amount', label: 'Amount'},
      {key: 'description', label: 'Description'},
      {key: 'vetoed', label: 'Vetored?'},
      {key: 'claimed', label: 'Claimed?'},
      {key: 'ipfsHash', label: 'IPFS Hash'},
      {key: 'url', label: 'URL'},
    ]
  }
};
