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
        key: 'contributors',
        required: true,
        children: [
          { key: 'contributorId', label: 'Contributor ID', required: false },
          { key: 'site', type: 'string', label: 'Account Site', helpText: 'Account site (e.g. github.com)', required: false },
          { key: 'accountUid', type: 'integer', label: 'Account ID', helpText: 'The user id on that site', required: false },
          { key: 'accountUsername', type: 'string', label: 'Account Username', helpText: 'The user name on that site', required: false }
        ]
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
        let contributorPromises = [];
        if (bundle.inputData.contributorId) {
          contributorPromises.push(kredits.Contributor.getById(bundle.inputData.contributorId));
        }

        bundle.inputData.contributors.forEach(c => {
          if (c.contributorId) {
            contributorPromises.push(kredits.Contributor.getById(c.contributorId));
          }
          let search = { site: bundle.inputData.site };
          if (c.accountUid) {
            search.uid = parseInt(c.accountUid);
          } else if (c.accountUsername) {
            search.username = c.accountUsername;
          }
          contributorPromises = contributorPromises.concat(kredits.Contributor.filterByAccount(search));
        });

        return Promise.all(contributorPromises).then(contributors => {
          let flattened = [];
          contributors.forEach(c => {
            flattened = flattened.concat(c.filter(c => c));
          });
          let contributorsAttr = flattened.map(c => {
            return { id: c.id, name: c.name, ipfsHash: c.ipfsHash, balanceInt: c.balanceInt, accounts: c.accounts };
          });
          return [
            {
              contributors: contributorsAttr,
              contributorIds: contributorsAttr.map(c => c.id).join(',')
            }
          ];
        });
      });
    },

    sample: {
      contributorIds: '1,2',
      contributors: [{
        id: 1,
        name: 'Satoshi',
        ipfsHash: 'QmdVBRx32Udya5PTNOJH3q6XAFiCm8DyHeaXpSDdgDmwam',
        balanceInt: 2342
      }]
    },

    outputFields: [
      { key: 'contributorIds', label: 'contributorIds' },
      { key: 'contributors', label: 'Contributors' }
    ]
  }
};
