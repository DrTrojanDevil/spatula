#Spatula

Because it's way easier than copy/pasteing 9000 pages.

##Usage:

```javascript
var S = require('spatula');

var menu = S.menu('http://example.com','nav > ul > li','ul > li');

var template = {
  'title': 'h1#title',
  'images': ['ul#slider > li img'],
  'content': 'div#content'
};

var save = function (collection) {
  //save to database
}

S.scrape(menu,template).finished(save);
```

##API:

###Spatula.menu(url,paths...)

Returns a menu tree in the form:

```javascript
[
  "<url>",
  "<url>",
  {
    "<url>": [
      "<url>",
      .
      .
      .
      {
        "<url>": [
          .
          .
          .
          "<url>"
        ]
      }
    ]
  },
  .
  .
  .
  .
  "<url>"
]
```

`url` is a URL. Each `path` argument is used as a
[cheerio](http://matthewmueller.github.io/cheerio/) selector, and Spatula
automatically extracts the href attribute of the first child anchor element.
(Spatula also recreates absolute URLs from relative URL paths.) If
only one argument is given, the menu will only be one level deep. If multiple
arguments are given, the menu will use the arguments as relative DOM paths at
their corresponding level indices. *If multiple arguments are given, the last
argument will be used recursively for a maximum of ten menu levels.*

###Spatula.scrape(menu, template, parser)

Returns the Spatula object for chaining (eg. to attach the finished listener)

* `menu` is a menu object, the result of calling `Spatula.menu()`
* `template` is a nestable dictionary object of the form:

```javascript
{
  "<key>": "<cheerio path>", //string value only return first match
  "<key>": ["<cheerio path"], //single-value array returns all matches
  .
  .
  .
  "<key>": {
    "<key>": "<cheerio path>",
    .
    .
    .
  }
}
```

* `parser` is a function receiving the populated template, and returning
a parsed version of it. This is `Spatula.markdown` by default.

###Spatula.finished(callback)

Accepts an event handler for when the scraping is complete.

###Spatula.markdown(html)

Used internally to convert HTML content to markup.
