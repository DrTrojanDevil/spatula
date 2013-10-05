var cheerio = require('cheerio');
var http = require('http');
var url = require('url');

var Spatula = {
  'Menu': function(reqUrl) {
    var paths = Array.prototype.slice.call(arguments,1);
    var urlObj = url.parse(reqUrl);
    var domain = urlObj.protocol + '//' + urlObj.hostname;
    var uri = urlObj.path;
    for (var i=0;i<10;i++) {
      paths[paths.length] = paths[paths.length-1];
    }
    this.scrape = function(save,template,parser) {
      http.get(reqUrl,function(res){
        res.setEncoding('utf8');
        var collector = [];
        res.on('data', function(chunk) {
          collector.push(chunk);
        });
        res.on('end', function() {
          var html = collector.join('');
          var menu = Spatula._menuScraper(html, paths, domain, uri);
          Spatula.scrape(save,menu,template,parser);
        });
      });
    }
  },
  'scrape': function(save, menu, template, parser) {
    parser = (parser === false) ? function(html){return html;} :
        parser || Spatula.markdown;
    if (!menu) {
      throw "Error: Menu is undefined";
    } else if (menu.scrape) {
      menu.scrape(save, template, parser);
    } else {
      //for each URL in menu, parse a template and pass it to save
      menu.forEach( function (e,i) {
        var reqUrl = e;
        if (typeof reqUrl !== 'string') {
          reqUrl = Object.keys(e)[0];
          Spatula.scrape(save,e[reqUrl],template,parser);
        }
        http.get(reqUrl,function(res){
          res.setEncoding('utf8');
          var collector = [];
          res.on('data', function(chunk) {
            collector.push(chunk);
          });
          res.on('end', function() {
            var html = collector.join('');
            save(reqUrl,Spatula._parseTemplate(template,html,parser));
          });
        });  
      });
    }
  },
  'markdown': function(html) {
    var replacements = {
      'p':'\r\n\r\n',
      'ul':'\r\n\r\n',
      'div':'\r\n\r\n',
      'td':'\r\n\r\n',
      'li':'\r\n * ',
      'h1':'\r\n# ',
      'h2':'\r\n## ',
      'h3':'\r\n### ',
      'h4':'\r\n#### ',
      'h5':'\r\n##### ',
      'h6':'\r\n###### ',
      'a': function ($anchor) {
        return '[' + $anchor.text() + ']('+ $anchor.attr('href')+')';
      },
      'em': ['*','*'],
      'i': ['*','*'],
      'strong': ['**','**'],
      'b': ['**','**']
    }
    var $ = cheerio.load(html);
    for (var key in replacements) {
      var $tags= $(key);
      var replacement = replacements[key];
      $tags.each(function(i,tag) {
        var $tag = $(tag);
        var newTag = '';
        if (typeof replacement === 'string') {
          var txt = $tag.html();
          newTag = replacement + txt;
        } else if (replacement instanceof Array) {
          var txt = $tag.html();
          newTag = replacement[0] + txt + replacement[1];
        } else if (typeof replacement === 'function') {
          newTag = replacement($tag);
        }
        $tag.replaceWith(newTag);
      });
    }
    return $.root().text().replace(/(\r?\n)+/g,'\r\n')
  },
  '_menuScraper': function(html, paths, domain, uri) {
    if (!paths.length) return;
    var $ = cheerio.load(html);
    var menu = $(paths.shift());
    if (!menu) return;
    return menu.map(function(i,el) {
      var path = $(el).attr('href') || $(el).find('a').first().attr('href');
      var url = '';
      if (path[0] == '/') {
        url = domain + path;
      } else if (! /\:\/\//.test(path)) {
        var tmpUri = uri.replace(/\/(index\.[a-z]+)?$/i,'').split('/');
        while (/^\.\.\//.test(path)) {
          path = path.replace('../','');
          tmpUri.pop();
        }
        path = path.replace('./','');
        console.log(url);
        url = domain + tmpUri.join('/') + '/'+ path;
      } else {
        url = path;
      }
      var subMenu = Spatula._menuScraper($(el).html(), paths, domain, uri);
      if (subMenu && subMenu.length) {
        var obj = {};
        obj[url] = subMenu;
        return obj;
      } else {
        return url;
      }
    });
  },
  '_parseTemplate': function (origTemplate, html, parser) {
    var template = JSON.parse(JSON.stringify(origTemplate)); //stupid way of cloning a simple object without external deps
    var $ = cheerio.load(html);
    for (var key in template) {
      var val = template[key];
      if (typeof val === 'string') {
        var $el = $(val).first();
        template[key] = $el.attr('src') || parser($el.html())
      } else if (val instanceof Array) {
        template[key] = $(val[0]).map(function(i,el) {
          return $(el).attr('src') || parser($(el).html());
        });
      } else { //nested template
        template[key] = Spatula._parseTemplate(val,html,parser);
      }
    }
    return template;
  }
};

module.exports = Spatula;
