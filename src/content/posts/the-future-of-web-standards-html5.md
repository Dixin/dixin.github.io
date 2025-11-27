---
title: "The Future Of Web Standards: HTML5"
published: 2007-12-11
description: "hibernated for years:"
image: ""
tags: ["HTML", "HTML5", "Web", "XHTML"]
category: "HTML"
draft: false
lang: ""
---

[W3C](http://www.w3.org/) hibernated for years:

-   HTML was last updated in 1999;
-   XHTML was last updated in 2002.

[WHATWG](http://www.whatwg.org/) (Web Hypertext Application Technology Working Group)was started by [Google](http://www.google.com/), [Mozilla](http://www.mozilla.org/), [Apple](http://www.apple.com/) and [Opera](http://www.opera.com/) since in 2004 to develop the next generation of Web markups’ standards. Then they submitted an HTML 5 draft proposal, intending to replace the current HTML and XHTML.

According to a recent [voting result](http://www.w3.org/2002/09/wbs/40318/htmlbg/results) of W3C, the future Web Standards will be HTML 5, not XHTML 2. This vote is based on the [application](http://lists.w3.org/Archives/Public/public-html/2007Apr/0429.html) of developing HTML5 as Web Standards.

So W3C decided to

-   accept the HTML5 proposal from WHATWG
-   release the next version of HTML as HTML5.

Unlike usual W3C working groups before, this group consists of members on behalf of key companies which will lead new Web Standards into practice:

-   Ian Hickson ([Google](http://www.google.com/));
-   Dave Hyatt ([Apple](http://www.apple.com/));
-   Chris Wilson ([Microsoft](http://www.microsoft.com/)), also the group lead.

Instead of [bringing a revolution to HTML like XHTML 2](http://www.ibm.com/developerworks/cn/xml/x-futhtml2.html), WHATWG expects a evolution. Some results from the WHATWG spec has been implemented in some browsers, like <[canvas](http://developer.mozilla.org/en/docs/Canvas_tutorial)\>.

In the [HTML 5 differences from HTML 4](http://dev.w3.org/html5/html4-differences/Overview.html) draft, improvements of HTML 5 can be seen, like changes of grammars, and removed elements and attributes.

## Grammars

HTML 5 can be declared via HTML grammar:

```xml
<!doctype html>
<html>
    <head>
        <meta charset="UTF-8">
        <title>Sample document</title>
    </head>
    <body>
        <p>Sample paragraph</p>
    </body>
</html>
```
[](http://11011.net/software/vspaste)

as well as XML grammar:

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<html xmlns="http://www.w3.org/1999/xhtml">
    <head>
        <title>Sample document</title>
    </head>
    <body>
        <p>Sample paragraph</p>
    </body>
</html>
```
[](http://11011.net/software/vspaste)

## Language features

Elements like div, li, etc., become more strict. For example, these elements should not includes block level elements and inline elements. These code are valid:

```csharp
<div> 
    <em>...</em> 
    ...
</div> 
<div> 
    <p><em>...</em></p> 
    <p>...</p> 
</div>
```
[](http://11011.net/software/vspaste)

But the following code is invalid:

```csharp
<div> 
    <em>...</em> 
    <p>...</p> 
</div>
```
[](http://11011.net/software/vspaste)

This is helpful to identify the level the elements.

### Removed elements

-   Pure presentation: <basefont>, <big, <center>, <font>, <s>, <strike>, <tt>, <u>;
-   Negative for usability: <frame>, <frameset>, noframes>;
-   Obscure:<acronym> , <applet>, <isindex>, <dir>.

### Removed attributes

-   accesskey attribute of <a, <area>, <button>, <input>, <label>, <legend> and <textarea>;
-   rev and charset attributes of <link and <a>;
-   sshape and coords attributes of <a>;
-   longdesc attribute of <img and <iframe>;
-   target attribute of <link>;
-   nohref attribute of <area>;
-   profile attribute of <head>;
-   version attribute of <html>;
-   name attribute of <map>, <img>, <object>, <form>, <iframe>, and <a> (should be replaced id attribute);
-   scheme attribute of <meta>;
-   archive, classid, codebase, codetype, declare and standby attributes of <object>;
-   valuetype and type attributes of <param>;
-   charset and language attributes of <script>;
-   summary attribute of <table>;
-   headers, axis and abbr attributes of <td>, and <th>;
-   scope attribute of <td>;
-   align attribute of <caption, <iframe>, <img>, <input>, <object>, <legend>, <table>, <hr>, <div>, <h1>, <h2>, <h3>, <h4>, <h5>, <h6>, <p>, <col>, <colgroup>, <tbody>, <td>, <tfoot>, <th>, <thead>, <tr>, and <body>;
-   alink, link, text and vlink attributes of <body>;
-   background attribute of <body>;
-   bgcolor attribute of <table>, <tr, <td, <th>, and <body>;
-   border attribute of <table>, <img>, and <object>;
-   cellpadding and cellspacing attributes of <table>;
-   char and charoff attributes of <col>, <colgroup>, <tbody>, <td>, <tfoot>, <th>, <thead>, and <tr>;
-   clear attribute of <br>;
-   compact attribute of <dl>, <menu>, <ol>, and <u>;
-   frame attribute of <table>;
-   frameborder attribute of <iframe>;
-   height attribute of <iframe>, <td> and <th>;
-   hspace and vspace attributes of <img> and <object>;
-   marginheight and marginwidth attributes of <iframe>;
-   noshade attribute of <hr>;
-   nowrap attribute of <td>, and <th>;
-   rules attribute of <table>;
-   scrolling attribute of <iframe>;
-   size attribute of <hr>, <input>, and <select>;
-   style attribute of all elements with the exception of <font>;
-   type attribute of <li>, <ol>, and <ul>;
-   valign attribute of <col>, <colgroup>, <tbody>, <td>, <tfoot>, <th>, <thead>, and <tr>;
-   width attribute of <hr>, <table>, <td>, <th>, <col>, <colgroup>, <iframe>, and <pre>.

Currently, regarding future compatibility, these removed elements and attributes should be avoided.

## Resources

-   [The future of HTML, Part 1: WHATWG](http://www.ibm.com/developerworks/library/x-futhtml1/?S_TACT=105AGX52&S_CMP=cn-a-x);
-   [The future of HTML, Part 2: XHTML 2.0](http://www.ibm.com/developerworks/xml/library/x-futhtml2.html?S_TACT=105AGX52&S_CMP=cn-a-x);
-   [HTML 5 differences from HTML 4](http://dev.w3.org/html5/html4-differences/Overview.html).