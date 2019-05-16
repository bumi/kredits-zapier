const Kredits = require('kredits-contracts');
const ethers = require('ethers');

module.exports = {
  key: 'contribution_vetoed',

  noun: 'Kredits Contribution',
  display: {
    label: 'Kredits Contributions Vetoed',
    description: 'Trigger when a Kredits contribution gets vetoed.'
  },

  operation: {

    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
    ],

    perform: (z, bundle) => {
      let ethProvider = new ethers.getDefaultProvider(bundle.inputData.network);
      let options = {
        addresses: { Kernel: bundle.inputData.daoAddress },
        apm: 'open.aragonpm.eth',
        ipfsConfig: { host: 'ipfs.infura.io', port: '5001', protocol: 'https' }
      };
      return new Kredits(ethProvider, null, options).init().then(async (kredits) => {

        const latestBlock = await kredits.provider.getBlockNumber();
        let fromBlock = latestBlock - 300; // last 300 blocks
        let event = kredits.Contribution.contract.interface.events.ContributionVetoed;
        let logs = await kredits.provider.getLogs({
          fromBlock: fromBlock,
          toBlock: 'latest',
          address: kredits.Contribution.contract.address,
          topics: [event.topic]
        });

        let eventDetails = logs.map(log => event.decode(log.data, log.topics));
        let results = eventDetails.map(async (e) => {
          let contribution = {}
          try {
            contribution = await kredits.Contribution.getById(e.id);
          } catch(error) {
            z.console.log('Failed to load contribution. (IPFS error?!) ' + e.id);
            z.console.log(error.message);
          }
          return {
            id: z.hash('md5', e.id + kredits.Contribution.contract.address),
            vetoedByAccount: e.vetoedByAccount,
            contributorId: contribution.contributorId,
            amount: e.amount,
            contributionId: e.id,
            vetoed: contribution.vetoed,
            claimed: contribution.claimed,
            ipfsHash: contribution.ipfsHash,
            url: contribution.url,
            description: contribution.description
          }
        });
        return Promise.all(results);
      });

    },

    sample: {
      id: 'xxxxxx',
      vetoedByAccount: '0x2101153KF9a45B73DE56fb44F17A30895786F708',
      contributorId: 4,
      amount: 500,
      contributionId: 23,
      vetoed: true,
      claimed: false,
      ipfsHash: 'QmdnmhKPn7eTtLB4sPRFVndePqz9ksjJcWSKXGnPZcTV3F',
      description: 'Kredits contribution',
      url: 'http://kredits.kosmos.org'
    },

    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'vetoedByAccount', label: 'Veto by account'},
      {key: 'contributorId', label: 'Contributor ID'},
      {key: 'contributionId', label: 'Contribution ID'},
      {key: 'amount', label: 'Amount'},
      {key: 'description', label: 'Description'},
      {key: 'ipfsHash', label: 'IPFS hash'},
      {key: 'url', label: 'URL'},
      {key: 'claimed', label: 'Claimed?'},
      {key: 'vetoed', label: 'Vetoed?'}
    ]
  }

};
