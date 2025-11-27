---
title: "IE7 Still Does Not Like PNG: filter Is Faster Than background"
published: 2008-12-22
description: "Everyone knows IE 6 does not like PNG images. When a transparent PNG is created as a background image,"
image: ""
tags: ["CSS", "Web"]
category: "CSS"
draft: false
lang: ""
---

Everyone knows IE 6 does not like PNG images. When a transparent PNG is created as a background image,

```csharp
.webos
{
    background: url(Transparent.png);
}
```

IE 6 renders it in a wrong way, which causes a lot of trouble in web design. Here a filter has to be used.

```csharp
.webos
{
    filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='Contents/Transparent.png', sizingMethod='scale');
}
```

Filter is more difficult to use. One of the biggest trouble is, in the filter, the path of the png file is not related to the CSS file, but the page using the CSS. Usually we share one CSS file among a lot of pages, and if the pages are in different paths, the filter does not work well.

For these years, I use the following to display transparent PNG background, which I learnt from Micosoft.com source code:

```csharp
.webos
{
    filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src='Contents/Transparent.png', sizingMethod='scale');
}
.webos[class] /* Does not work in IE6 */
{
    background:url(Transparent.png);
}
```

In IE 7, this bug seems to be fixed. But today when writing WebOS, there is a new trouble. A JavaScript animation is created, a div with a transparent PNG background was resized by JavaScript. This animation ran well in Opera, Firefox and Safari, even smoothly in IE 6. But in IE7, it ran extremely slowly, and caused very high CPU usage. Finally, I found the reason: the high CPU usage was caused by the transparent PNG background.

I changed the CSS for IE 7 to use filter, then the resizing became as smooth as Firefox!

So the conclusion is, even the bug of transparent is fixed in IE7, it still has performance problem. Filter is much more effective. In IE7, “filter” should still be preferred rather than “background”.