---
title: "Customizing IE Scrollbar"
published: 2007-11-22
description: "Today someone is asking how to customize the color of IE scrollbar. The following code works for HTML:"
image: ""
tags: ["CSS", "HTML", "Web", "XHTML"]
category: "CSS"
draft: false
lang: ""
---

Today someone is asking how to customize the color of IE scrollbar. The following code works for HTML:

```csharp
body
{
    scrollbar-face-color: #E3F1D1;
    scrollbar-highlight-color: #FFFFFF;
    scrollbar-shadow-color: #ABD48F;
    scrollbar-3dlight-color: #D1D7DC;
    scrollbar-arrow-color: #247624;
    scrollbar-track-color: #ededed;
    scrollbar-darkshadow-color: #247624;
}
```
[](http://11011.net/software/vspaste)

But not for XHTML. For XHTML page, it should be like this:

```csharp
html
{
    scrollbar-face-color: #E3F1D1;
    scrollbar-highlight-color: #FFFFFF;
    scrollbar-shadow-color: #ABD48F;
    scrollbar-3dlight-color: #D1D7DC;
    scrollbar-arrow-color: #247624;
    scrollbar-track-color: #ededed;
    scrollbar-darkshadow-color: #247624;
}
```

These CSS work in IE 6 and IE 7, and is not supported by Firefox, Opera, Safari. In those browsers, the customized scrollbar has to be emulated. And here are some resources:

-   [fleXcroll](http://www.hesido.com/web.php?page=customscrollbar): Supports keyboard, mouse wheel, and text selection aid;
-   [Custom Scrollbars](http://www.jools.net/projects/javascript/scrollable-divs/): Based on [Prototype](http://www.prototypejs.org/);
-   [LinScroll](http://onewww.net/blog/article.asp?id=95): Based on [jQuery](http://www.jquery.com/).