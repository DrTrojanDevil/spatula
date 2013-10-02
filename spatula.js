var $ = require('cheerio');

var Spatula = {
  'menu': function(url) {
    var paths = Array.prototype.slice.call(arguments,1);
  },
  'scrape': function(save, menu, template, parser) {
    parser = parser || Spatula.markdown;
  },
  'markdown': function(html) {
  }
};

exports = Spatula;
