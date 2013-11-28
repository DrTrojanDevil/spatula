var cheerio = require('cheerio');
var http = require('http');
var url = require('url');
var Iconv = require('iconv').Iconv;

var Spatula = {
  'Menu': function(reqUrl) {
    var paths = Array.prototype.slice.call(arguments,1);
    var urlObj = url.parse(reqUrl);
    var domain = urlObj.protocol + '//' + urlObj.hostname;
    var uri = urlObj.path;
    for (var i=0;i<10;i++) {
      paths[paths.length] = paths[paths.length-1];
    }
    this.scrape = function(save,template,parser,encoding) {
      http.get(reqUrl,function(res){
        res.setEncoding('utf8');
        var collector = [];
        res.on('data', function(chunk) {
          collector.push(chunk);
        });
        res.on('end', function() {
          var html = collector.join('');
          var menu = Spatula._menuScraper(html, paths, domain, uri);
          Spatula.scrape(save,menu,template,parser,encoding);
        });
      });
    }
  },
  'scrape': function(save, menu, template, parser, encoding) {
    parser = (parser === false) ? function(html){return html;} :
        parser || Spatula.markdown;
    encoding = ( /^utf\-?8$/i.test(encoding) ) ? 'utf8' :
     (encoding) ? encoding : 'utf8';
    if (encoding != 'utf8') {
      var iconv = new Iconv(encoding,'UTF-8');
    }
    if (!menu) {
      throw "Error: Menu is undefined";
    } else if (menu.scrape) {
      menu.scrape(save, template, parser, encoding);
    } else {
      //for each URL in menu, parse a template and pass it to save
      menu.forEach( function (e,i) {
        var reqUrl = e;
        if (typeof reqUrl !== 'string') {
          reqUrl = Object.keys(e)[0];
          Spatula.scrape(save,e[reqUrl],template,parser);
        }
        http.get(reqUrl,function(res){
          var collector = [];
          res.on('data', function(chunk) {
            collector.push(chunk);
          });
          res.on('end', function() {
            var html = Buffer.concat(collector);
            if (encoding == 'utf8') {
              html = html.toString();
            } else {
              html = iconv.convert(html).toString();
            }
            save(reqUrl,Spatula._parseTemplate(template,html,parser));
          });
        });  
      });
    }
  },
  'markdown': function(html) {
    var replacements = {
      'p':'\r\n\r\n',
      'br':'\r\n',
      'ol': function ($ol) {
        return '\r\n\r\n'+$ol.children('li').map(function(i){
          return (i+1)+'. '+$(this).html();
        }).join('\r\n')+'\r\n\r\n';
      },
      'ul': function ($ul) {
        return '\r\n\r\n'+$ul.children('li').map(function(i){
          return ' * '+$(this).html();
        }).join('\r\n')+'\r\n\r\n';
      },
      'div':'\r\n\r\n',
      'td':'\r\n\r\n',
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
    paths = paths.slice();
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
    var newTemplate = {};
    var $ = cheerio.load(html);
    for (var key in origTemplate) {
      var val = origTemplate[key];
      if (typeof val === 'string') {
        var $el = $(val).first();
        newTemplate[key] = $el.attr('src') || parser($el.html())
      } else if (val instanceof Array) {
        newTemplate[key] = $(val[0]).map(function(i,el) {
          return $(el).attr('src') || parser($(el).html());
        });
      } else if (typeof val === 'function') {
        newTemplate[key] = val($);
      } else { //nested template
        newTemplate[key] = Spatula._parseTemplate(val,html,parser);
      }
    }
    return newTemplate;
  }
};

module.exports = Spatula;
