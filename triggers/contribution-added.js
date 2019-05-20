const Kredits = require('kredits-contracts');
const ethers = require('ethers');
// We recommend writing your triggers separate like this and rolling them
// into the App definition at the end.
module.exports = {
  key: 'contribution_added',

  // You'll want to provide some helpful display labels and descriptions
  // for users. Zapier will put them into the UX.
  noun: 'Kredits Contribution',
  display: {
    label: 'New Kredits Contributions',
    description: 'Trigger when a new Kredits contribution is added.'
  },

  // `operation` is where the business logic goes.
  operation: {

    // `inputFields` can define the fields a user could provide,
    // we'll pass them in as `bundle.inputData` later.
    inputFields: [
      { key: 'daoAddress', label: 'DAO address', required: true },
      { key: 'network', label: 'Ethereum network', required: true, choices: { rinkeby: 'Rinkeby' } },
      { key: 'contributorId', label: 'Contributor ID', type: 'integer',  helpText: 'Kredits Contributor ID' }
    ],

    perform: (z, bundle) => {
      let ethProvider = new ethers.getDefaultProvider(bundle.inputData.network);
      let options = {
        addresses: { Kernel: bundle.inputData.daoAddress },
        apm: 'open.aragonpm.eth',
        ipfsConfig: { host: 'ipfs.infura.io', port: '5001', protocol: 'https' }
      };
      return new Kredits(ethProvider, null, options).init().then(async (kredits) => {
        let contributorId = bundle.inputData.contributorId || null;

        const latestBlock = await kredits.provider.getBlockNumber();
        let fromBlock = latestBlock - 300; // last 300 blocks
        let event = kredits.Contribution.contract.interface.events.ContributionAdded;
        let logs = await kredits.provider.getLogs({
          fromBlock: fromBlock,
          toBlock: 'latest',
          address: kredits.Contribution.contract.address,
          topics: [event.topic]
        });

        let eventDetails = logs.map(log => event.decode(log.data, log.topics));
        if (contributorId) {
          eventDetails = eventDetails.filter(e => e.contributorId === parseInt(contributorId) )
        }
        let results = eventDetails.map(async (e) => {
          let contribution = {};
          let contributor = {};
          try {
            contribution = await kredits.Contribution.getById(e.id);
            contributor = await kredits.Contributor.getById(e.contributorId);
          } catch(error) {
            z.console.log('Failed to load contribution. (IPFS error?!) ' + e.id);
            z.console.log(error.message);
          }
          return {
            id: z.hash('md5', e.id + kredits.Contribution.contract.address),
            contributorId: e.contributorId,
            contributorName: contributor.name,
            contributorIpfsHash: contributor.ipfsHash,
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

    // In cases where Zapier needs to show an example record to the user, but we are unable to get a live example
    // from the API, Zapier will fallback to this hard-coded sample. It should reflect the data structure of
    // returned records, and have obviously dummy values that we can show to any user.
    sample: {
      id: 'xxxxxx',
      contributorId: 4,
      contributorName: 'Satoshi',
      contributorIpfsHash: 'QmfamjKpn7eTtLB4sPRFVndePqz9ksIJcqSKXknPZcTV2Fd',
      amount: 500,
      contributionId: 23,
      vetoed: false,
      claimed: false,
      ipfsHash: 'QmdnmhKPn7eTtLB4sPRFVndePqz9ksjJcWSKXGnPZcTV3F',
      description: 'Kredits contribution',
      url: 'http://kredits.kosmos.org'
    },

    // If the resource can have fields that are custom on a per-user basis, define a function to fetch the custom
    // field definitions. The result will be used to augment the sample.
    //   outputFields: [
    //    () => { return []; }
    //   ]
    // For a more complete example of using dynamic fields see
    // https://github.com/zapier/zapier-platform-cli#customdynamic-fields.
    // Alternatively, a static field definition should be provided, to specify labels for the fields
    outputFields: [
      {key: 'id', label: 'ID'},
      {key: 'contributorId', label: 'Contributor ID'},
      {key: 'contributorName', label: 'Contributor Name'},
      {key: 'contributorIpfsHash', label: 'Contributor IPFS hash'},
      {key: 'contributionId', label: 'Contribution ID'},
      {key: 'amount', label: 'Amount'},
      {key: 'description', label: 'Description'},
      {key: 'ipfsHash', label: 'IPFS hash'},
      {key: 'url', label: 'URL'},
      {key: 'claimed', label: 'Claimed?'},
      {key: 'vetoed', label: 'Vetoed?'}
    ]
  },

};
