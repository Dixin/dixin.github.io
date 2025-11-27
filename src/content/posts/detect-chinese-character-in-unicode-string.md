---
title: "Detect Chinese Character in Unicode String"
published: 2016-01-10
description: "Recently, when trying to convert some directory/file names between Chinese and English, it is necessary to detect if a Unicode string contains Chinese characters. Unfortunately, Chinese language detec"
image: ""
tags: ["C#", "Unicode"]
category: "Unicode"
draft: false
lang: ""
---

Recently, when trying to convert some directory/file names between Chinese and English, it is necessary to detect if a Unicode string contains Chinese characters. Unfortunately, Chinese language detection, or language detection, is [not easy](https://blogs.msdn.microsoft.com/oldnewthing/20120111-00/?p=8603). There are several options:

-   Use [API](https://msdn.microsoft.com/en-us/goglobal/dd156834.aspx#ELS8) of [Microsoft Language Detection](https://msdn.microsoft.com/en-us/library/windows/desktop/dd319066.aspx) in [Extended Linguistic Services](https://msdn.microsoft.com/en-us/library/windows/desktop/dd317839.aspx)
-   Use the [Detect API](https://msdn.microsoft.com/en-us/library/ff512411.aspx) of [Microsoft Translator](https://msdn.microsoft.com/en-us/library/ff512423.aspx)
-   Microsoft has a sample [C# package for language identification](http://research.microsoft.com/en-us/downloads/5a84b263-41d6-4ce1-a186-8e3f76efe2e5/)
-   Take the character range of East Asia languages ([CJK Unified Ideographs (Han)](http://www.unicode.org/charts/PDF/U4E00.pdf), where [CJK](http://www.unicode.org/faq/han_cjk.html) means Chinese-Japanese-Korean) from the [Unicode charts](http://www.unicode.org/charts/), and detect whether each character is in the range.
-   Use Google Chrome’s [language detector](https://github.com/mikemccand/chromium-compact-language-detector), since Chrome is [open source](http://src.chromium.org/viewvc/chrome/trunk/src/third_party/cld/).

These are all practical, but it would be nice if there is a [simple stupid](https://en.wikipedia.org/wiki/KISS_principle) solution. Actually .NET has an infamous enum [System.Globalization.UnicodeCategory](https://msdn.microsoft.com/en-us/library/system.globalization.unicodecategory.aspx), it has 29 members:

-   UppercaseLetter
-   LowercaseLetter
-   OpenPunctuation
-   ClosePunctuation
-   MathSymbol
-   OtherLetter
-   …

And there are 2 APIs accepting a char and returning the char’s UnicodeCategory:

-   char.GetUnicodeCategory
-   CharUnicodeInfo.GetUnicodeCategory

So, generally, the following extension method detects if a string contains char in the specified UnicodeCategory:

```csharp
public static bool Any(this string value, UnicodeCategory category) =>
    !string.IsNullOrWhiteSpace(value)
    && value.Any(@char => char.GetUnicodeCategory(@char) == category);
```

Chinese characters are categorized into OtherLetter, so the Chinese detection problem can becomes OtherLetter detection.

```csharp
public static bool HasOtherLetter(this string value) => value.Any(UnicodeCategory.OtherLetter);
```

The detection is easy:

```csharp
bool hasOtherLetter = text.HasOtherLetter();
```

It is not totally accurate for Chinese language, but it works very well to distinguish English string and Chinese string.