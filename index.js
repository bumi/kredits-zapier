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
  // This is just shorthand to reference the installed dependencies you have. Zapier will
  // need to know these before we can upload
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  // beforeRequest & afterResponse are optional hooks into the provided HTTP client
  beforeRequest: [
  ],

  afterResponse: [
    handleHTTPError
  ],

  // If you want to define optional resources to simplify creation of triggers, searches, creates - do that here!
  resources: {
  },

  // If you want your trigger to show up, you better include it here!
  triggers: {
    [contributionAdded.key]: contributionAdded,
    [contributionVetoed.key]: contributionVetoed
  },

  // If you want your searches to show up, you better include it here!
  searches: {
    [getContributor.key]: getContributor,
    [getContribution.key]: getContribution
  },

  // If you want your creates to show up, you better include it here!
  creates: {
    [addContribution.key]: addContribution,
    [addContributor.key]: addContributor
  }
};

// Finally, export the app.
module.exports = App;
