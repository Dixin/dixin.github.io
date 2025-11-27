---
title: "Update code font from Consolas to Cascadia Code with ligature"
published: 2020-05-31
description: "A decade ago, I . They are both monospaced. The difference is:"
image: ""
tags: ["Font", "Visual Studio", "Visual Studio Code", "Windows Terminal"]
category: "Visual Studio"
draft: false
lang: ""
---

A decade ago, I [blogged that I switched my code font from Courier New to Consolas](/posts/blog-code-font-change-from-courier-new-to-consolas). They are both monospaced. The difference is:

-   Courier New is an old font introduced in Windows 3.1.
-   Consolas is introduced with Windows Vista/Office 2007/Visual Studio 2010. It [always uses ClearType](https://devblogs.microsoft.com/visualstudio/visual-studio-2010-text-clarity-cleartype-options/), which is designed for LCD screens and other flat panels which arrange their pixels in vertical stripes of red, green and blue.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_2.png)

After using Consolas for 10+ years, now I am switching code font to Cascadia Code.

## Cascadia and Windows Terminal

A week ago, Widows Terminal 1.0 is released by Microsoft, along with a dedicated Cascadia fonts. Cascadia is [open source](https://github.com/microsoft/cascadia-code) and is [named](https://twitter.com/cinnamon_msft/status/1130864977185632256) after Widows Terminal’s code name. I personally prefer the name “Seattle”, where I live.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_4.png)

Microsoft actually released 2 Cascadia fonts along with Windows Terminal:

-   Cascadia mono: the normal monospaced font
-   Cascadia code: the fancy version of Cascadia mono, with programming ligatures
-   Cascadia mono PL: Cascadia mono plus powerline symbols
-   Cascadia code PL: Cascadia code plus powerline symbols

They are designed by [Aaron Bell](https://twitter.com/aaronbell) from [Saja Typeworks](https://www.sajatypeworks.com/). Microsoft [recommends Cascadia Code](https://devblogs.microsoft.com/commandline/cascadia-code/) for terminal apps and code editors.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_10.png)

The font design looks good for me, except number 7 and letter f looks inconsistent with others:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_6.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_14.png)

## Text ligature

Ligature means two or more graphemes are joined as a single glyph. The most example is that e and t can be joined as &. The following are examples of joined letters:

![](https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Ligatures.svg/300px-Ligatures.svg.png)

Here are some ligatures examples in Unicode (Multiple letters/single ligature/Unicode/HTML):

-   A E/Æ/U+00C6/&AElig;
-   a e/æ/U+00E6/&aelig;
-   O E/Œ/U+0152/&OElig;
-   o e/œ/U+0153/&oelig;
-   f f/ﬀ/U+FB00/&#xFB00;
-   f‌ i/ﬁ/U+FB01/&#xFB01;
-   i j/ĳ/U+0133/&#x133;
-   s t/ﬆ/U+FB06/&#xFB06;
-   f f i/ﬃ/U+FB03/&#xFB03;

CSS also support ligature with properties font-feature-settings and font-variant-ligatures.

I used to practice calligraphy in Chinese and English, but personally I am not in favor of ligatures.

### Code ligature

Programing ligature means to join code symbols as a single glyph. For example, in terminal or code editor,

-   “greater than or equal to” operator >= can be joined as ≥
-   “not equal” operator != cam ne joined as ≠
-   “double arrow”operator => can be joined as ⇒

Recently code ligature become popular because of the [Fira Code](https://github.com/tonsky/FiraCode) font based on [Fira Mono from Mozilla](https://github.com/mozilla/Fira), [Monoid font](https://github.com/larsenwork/monoid), [Hasklig font](https://github.com/i-tu/Hasklig), etc. Here is a [detailed comparison](https://betterwebtype.com/articles/2020/02/13/5-monospaced-fonts-with-cool-coding-ligatures/).

Ligate in programming language is said to improve readability. Personally I do not have a strong preference. There are also [some people who do not like ligature at all](https://news.ycombinator.com/item?id=19805053). In Cascadia Code, the following are some examples of how programming operator characters are joined as ligatures in this font:

> ++ -- \*\* && !! || %% ;; ?? +++ --- \*\*\* www # ## ### #### /= ^= =~ ~- -~ ~~ ~= ~@ ?. #{ #( #\_ #\_( #\[ \]# #? #: #= #! <= >= <> <<< >>> == != =/= === !== =!= =:= <== ==> <=> => <<= =>> >>= =<< <=< >=> << >> -< >- <<- ->> >>- -<< <-- --> <- <-> -> <$ <$> $> <+ <+> +> <\* <\*> \*> <~ <~> ~> </ /> </> <!-- --> <||| <|| <| <|> |> ||> |||> .. ... :: ::: .- .= := ::= ..< <: :> :< >: \_\_ -| \_|\_ |- |= ||= \[| |\] {| |} 0xFF 1x2

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_9.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_20.png)

## Powerline

Powerline was a status line plugin for vim. [Powerline symbols](https://github.com/microsoft/cascadia-code/issues/10) (U+E0A0 to U+E0A2 and U+E0B0 to U+E0B3) are [extra box-drawing characters](https://en.wikipedia.org/wiki/Private_Use_Areas) that could be useful for displaying status.

-   U+E0A0 ![image](https://user-images.githubusercontent.com/14316954/63142523-f9e84e80-bf9e-11e9-838f-e3ae9ebdfe2e.png)
-   U+E0A1 ![image](https://user-images.githubusercontent.com/14316954/63142529-02408980-bf9f-11e9-8dd5-58365099be9d.png)
-   U+E0A2 ![image](https://user-images.githubusercontent.com/14316954/63142537-09679780-bf9f-11e9-820d-c30aea428d14.png)
-   U+E0B0 ![image](https://user-images.githubusercontent.com/14316954/63142612-50558d00-bf9f-11e9-90de-7fe0530c0089.png)
-   U+E0B1 ![image](https://user-images.githubusercontent.com/14316954/63142620-58153180-bf9f-11e9-8d1b-5849849a049d.png)
-   U+E0B2 ![image](https://user-images.githubusercontent.com/14316954/63142626-5f3c3f80-bf9f-11e9-95ba-9900ae8e7aae.png)
-   U+E0B3 ![image](https://user-images.githubusercontent.com/14316954/63142634-67947a80-bf9f-11e9-9452-7022cc85633e.png)

### Install and configure

Cascadia Code is installed along with Windows Terminal. You can also download and install Cascadia Code PL from official release page: [https://github.com/microsoft/cascadia-code/releases](https://github.com/microsoft/cascadia-code/releases). With chocolatey, it can be installed by: choco install cascadiacodepl. You can also manually install it for Linux etc..

[![Screenshot from 2020-05-31 03-35-25](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/Screenshot%20from%202020-05-31%2003-35-25_thumb.png "Screenshot from 2020-05-31 03-35-25")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/Screenshot%20from%202020-05-31%2003-35-25_2.png)

In Windows Terminal, the default font is Cascadia Mono.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_24.png)

Open settings. In the JSON configuration, under profiles/defaults, add "fontFace": "Cascadia Code PL", and save. The terminal instantly becomes:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_12.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_26.png)

To make usage of powerline symbols, you can [install oh-my-posh](https://github.com/JanDeDobbeleer/oh-my-posh) for PowerShell, and [install oh-my-zsh](https://github.com/ohmyzsh/ohmyzsh) for WSL then [switch the theme to “agnoster”](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes):

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_8.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_22.png)

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_18.png)

In Visual Studio, to use Cascadia Code, In Tools/Options, search for font, change it to Cascadia:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_13.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_28.png)

In Visual Studio Code, open File/Preferences/Settings, search for font, and add it to the head:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Tips-for-using-Windows-Terminal_FB67/image_6.png)

Then search for ligature, turn it on ("editor.fontLigatures": true). On Windows, the ligatures will be shown in VS Code. On Ubuntu, you need to restart VS Code.