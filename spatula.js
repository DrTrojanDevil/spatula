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
    var replacements = {
      'p':'r\n\r\n',
      'ul':'r\n\r\n',
      'div':'r\n\r\n',
      'td':'r\n\r\n',
      'li':' * ',
      'h1':'#',
      'h2':'##',
      'h3':'###',
      'h4':'####',
      'h5':'#####',
      'h6':'######',
      'a': function ($anchor) {
        return '[' + $anchor.text() + ']('+ $anchor.attr('href')+')';
      },
      'em': ['*','*'],
      'i': ['*','*'],
      'strong': ['**','**'],
      'b': ['**','**']
    }
    var keys = Object.keys(replacements);
    var $ = cheerio.load(html);
    for (var i=0; i<keys.length;i++) {
      var $tag = $(keys[i]);
      var replacement = replacements[keys[i]];
      var newTag = '';
      if (typeof replacement === 'string') {
        var txt = $tag.html();
        newTag = replacement + txt;
      } else if (typeof replacement === 'array') {
        var txt = $tag.html();
        newTag = replacement[0] + txt + replacement[1];
      } else if (typeof replacement === 'function') {
        newTag = replacement($tag);
      }
      $tag.replace(newTag);
    }
    return $.text().replace(/(\r?\n)+/g,'\r\n')
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
