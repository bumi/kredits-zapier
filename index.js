const addContribution = require('./creates/add-contribution');
const addContributor = require('./creates/add-contributor');
const getContributor = require('./searches/get-contributor');
const getContribution = require('./searches/get-contribution');
const contributionAdded = require('./triggers/contribution-added');
const contributionVetoed = require('./triggers/contribution-vetoed');

const handleHTTPError = (response, z) => {
  if (response.status >= 400) {
    throw new Error(`Unexpected status code ${response.status}`);
  }
  return response;
};

const App = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  beforeRequest: [
  ],

  afterResponse: [
    handleHTTPError
  ],

  resources: {
  },

  triggers: {
    [contributionAdded.key]: contributionAdded,
    [contributionVetoed.key]: contributionVetoed
  },

  searches: {
    [getContributor.key]: getContributor,
    [getContribution.key]: getContribution
  },

  creates: {
    [addContribution.key]: addContribution,
    [addContributor.key]: addContributor
  }
};

module.exports = App;
