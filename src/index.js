const cheerio = require('cheerio'),
      request = require('request'),
      Promise = require('bluebird'),
      jsdom = require('jsdom');

const createObjectKeys = () => {
  const currentMonth = new Date().getUTCMonth() + 1,
        nextMonth = (currentMonth === 12) ? 1 : currentMonth + 1,
        year = new Date().getFullYear();

  return [`${currentMonth}-${year}`, `${nextMonth}-${year}`];
};

const parseScript = body => {
  return cheerio.load(body)('script[charset=utf-8]')[0]
          .children[0]
          .data
          .match(/([^\*\/]*)(?=\/\*)/g)[2];
};

const getData = body => {
  jsdom.defaultDocumentFeatures = {
    FetchExternalResources: ['script'],
    ProcessExternalResources: ['script'],
    MutationEvents: '2.0',
    QuerySelector: false
  }
  const window = jsdom.jsdom(`<script>${parseScript(body)}</script>`).defaultView,
        keys = createObjectKeys();

  return {
    [keys[1]]: window.upComingMonths,
    [keys[0]]: window.thisMonths
  };
};

const priorityDate = params => {
  const _url = 'http://travel.state.gov/content/visas/en/immigrate/immigrant-process/approved/checkdate.html';
  const options = Object.assign({ url: _url }, params),
        defer = Promise.defer();

  request.get(options.url,
    function (error, response, body) {
      if(error || response.statusCode != 200) {
        defer.reject(error);
      } else {
        defer.resolve(getData(body));
      }
  });

  return defer.promise;
};

export default priorityDate;
