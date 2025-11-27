---
title: "Caution! Different Language Versions Of Firefox Renders Differently"
published: 2007-09-21
description: "For the same HTML:"
image: ""
tags: ["HTML", "Web", "XHTML"]
category: "HTML"
draft: false
lang: ""
---

For the same HTML:

```csharp
<input type="file" style="width:160px;" />
```

Firefox has problem in different language versions:

![firefox_cn_en](https://aspblogs.z22.web.core.windows.net/dixin/Media/firefox_cn_en_6FF8CAEF.gif "firefox_cn_en")

The top control is the representation in Chinese version of Firefox, which looks fine, but it breaks in the English version Firefox (the second control in the picture).

So special attention should be paid when testing Web pages in Firefox.