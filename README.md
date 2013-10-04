#Spatula

Because it's way easier than copy/pasting all the pages.

##Usage:

```javascript
var S = require('spatula');

var menu = new S.Menu('http://example.com','nav > ul > li','ul > li');

var template = {
  'title': 'h1#title',
  'images': ['ul#slider > li img'],
  'content': 'div#content'
};

var save = function (collection) {
  //save to database
}

S.scrape(save,menu,template);
```

##API:

###Spatula.Menu(url,paths...)

Constructor, returns `Spatula.Menu` object.

`url` is a URL. Each `path` argument is used as a
[cheerio](http://matthewmueller.github.io/cheerio/) selector, and Spatula
automatically extracts the href attribute of the first child anchor element.
(Spatula also recreates absolute URLs from relative URL paths.) If
only one argument is given, the menu will only be one level deep. If multiple
arguments are given, the menu will use the arguments as relative DOM paths at
their corresponding level indices. *If multiple arguments are given, the last
argument will be used recursively for a maximum of ten menu levels.*

###Spatula.scrape(callback, menu, template, [parser])

* `callback` is... well, you figure it out.
* `menu` is either a menu object (the result of calling `Spatula.menu()`) or
a menu array of the form:

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

*It is important to note that all of the cheerio paths in `template` are
relative to the document, not to each other (unlike the path arguments
to `Spatula.Menu`)*

* `parser` is a function receiving HTML snippets for the template, and
returning a parsed version of them. This is `Spatula.markdown` by default.
Explicitly setting `parser` to `false` will populate the template with
unparsed HTML.

###Spatula.markdown(html)

Used internally to convert HTML content to markup.
