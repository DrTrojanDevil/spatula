var cheerio = require('cheerio');
var http = require('http');

var Spatula = {
  'Menu': function(url) {
    var paths = Array.prototype.slice.call(arguments,1);
    for (var i=0;i<10;i++) {
      paths[paths.length] = paths[paths.length-1];
    }
    this.scrape = function(save,template,parser) {
      http.get(url,function(res){
        res.setEncoding('utf8');
        res.on('data', function(html) {
          var menu = Spatula._menuScraper(html, paths, domain, uri);
          Spatula.scrape(save,menu,template,parser);
        });
      });
    }
  },
  'scrape': function(save, menu, template, parser) {
    parser = parser || Spatula.markdown;
    if (menu.scrape) {
      menu.scrape(save, template, parser);
    } else {
      //shit, actually scrape stuff (TODO)
    }
  },
  'markdown': function(html) {
  },
  '_menuScraper': function(html, paths, domain, uri) {
    if (!paths.length) return;
    var $ = cheerio.load(html);
    var menu = $(paths.shift());
    if (!menu) return;
    menu.map(function(el) {
      var path = $(el).find('a:first').attr('href');
      var url = '';
      if (path[0] == '/') {
        url = domain + path;
      } else if (! /\:\/\//.test(path)) {
        url = domain + uri + path;
      } else {
        url = path;
      }
      var subMenu = Spatula._menuScraper(el, paths, domain, uri);
      if (subMenu) {
        var obj = {};
        obj[url] = subMenu;
        return obj;
      } else {
        return url;
      }
    });
  }
};

exports = Spatula;
