---
title: "Introducing CoolWebOS.com"
published: 2009-09-20
description: "This post is supposed to introduce the so-called WebOS – , as well as to have your important feedback."
image: ""
tags: [".NET", "ASP.NET", "ASP.NET MVC", "C#", "CSS", "HTML", "JavaScript", "jQuery", "LINQ", "Web", "WebOS", "XHTML"]
category: ".NET"
draft: false
lang: ""
---

This post is supposed to introduce the so-called WebOS – [http://www.CoolWebOS.com/](http://www.CoolWebOS.com/), as well as to have your important feedback.

WebOS 0.2 has been released quietly for some time. It is an OS-like personal Web portal, implementing the desktop OS experience in the Web pages.

## Features

The current features includes:

-   Using Web pages to simulate the UI of [some kind of operating system](http://www.apple.com/macosx/what-is-macosx/), providing
    -   a log on UI,
    -   a main desktop UI, where users can run “applications” from the start menu;
-   Each “application” is a Web widget, which are
    -   either provided by WebOS itself,
    -   or mashed up from the Internet, like [Google Gadgets](http://www.google.com/webmasters/gadgets/);
-   WebOS and its widgets are localizable, which means users can switch languages;
-   WebOS is an extensible framework, so in the future, more and more widgets can be integrated;
-   Finally, WebOS is also considered to be a potential [SaaS](http://en.wikipedia.org/wiki/Software_as_a_service) platform.

There are also some other technical objectives:

-   The infrastructure (trying to avoid the word “architecture”) should be somehow professional;
-   WebOS is designed to be very unit-testable (That’s why [ASP.NET MVC](http://www.asp.net/mvc/) is used);
-   The C# code quality should be compliant with Microsoft [Framework Design Guidelines](http://www.amazon.com/Framework-Design-Guidelines-Conventions-Libraries/dp/0321545613);
-   The JavaScript and CSS code must be well organized;
-   WebOS must be no dependency on concrete data source like SQL Server, MySQL, Access, XML, etc., that’s because WebOS would be moved from one server to another, and those servers may support different data source, and that’s the reason [repository pattern](http://martinfowler.com/eaaCatalog/repository.html) is used;
-   WebOS should be cross-browser-compatible in IE 6, [IE 7](http://www.microsoft.com/windows/internet-explorer/ie7/), [IE 8](http://www.microsoft.com/windows/internet-explorer/default.aspx), and the latest [Firefox](http://www.mozilla.com/firefox/), [Opera](http://www.opera.com/), [Safari](http://www.apple.com/safari/), and [Chrome](http://www.google.com/chrome).

I created, designed and implemented WebOS independently:

-   Designed the infrastructure;
-   Designed the database and developed the Website, service layer and data access layer;
-   Designed and developed the widget framework, and developed several sample widgets;
-   Improving user experience by usability testing.

My friends Ling and [Mark](http://fastdev.spaces.live.com) have offered distinguished code review. Many thanks!

## Technologies

Actually, I am using a bunch of fancy stuff for the code (but they are probably outdated in your opinion):

-   [ASP.NET MVC 1.0 RTM](http://www.microsoft.com/downloads/details.aspx?displaylang=en&FamilyID=53289097-73ce-43bf-b6a6-35e00103cb4b) (I will upgrade to [ASP.NET MVC 2.0 Preview](http://www.microsoft.com/downloads/details.aspx?displaylang=en&FamilyID=d34f9eaa-fcbe-4e20-b2fd-a9a03de7d6dd) later if I have time);
-   [jQuery](http://jquery.com/) 1.3.2;
-   [Interface](http://interface.eyecon.ro/) for jQuery;
-   [Repository pattern](http://martinfowler.com/eaaCatalog/repository.html) and [LINQ to SQL](http://msdn.microsoft.com/en-us/library/bb425822.aspx) for the data access;
-   [Dependency injection pattern](http://martinfowler.com/articles/injection.html) with the help of [Unity](http://unity.codeplex.com/);
-   A little [Bootstrapper](http://weblogs.asp.net/rashid/archive/2009/02/17/use-bootstrapper-in-your-asp-net-mvc-application-and-reduce-code-smell.aspx);
-   System.Web.Abstraction.dll for improving the unit-testability;
-   [StyleCop](http://code.msdn.microsoft.com/sourceanalysis) and Code Analysis are applied to help improving the code quality;
-   Well modularized JavaScript and CSS;
-   Of course, the globalization mechanism of ASP.NET;
-   …

I need to emphasize this is a totally playful website. Maybe we should not expect too much for such [JK](http://en.wiktionary.org/wiki/JK) website.

## Feedback

The URI is: [http://www.CoolWebOS.com/](http://www.CoolWebOS.com/).

If you have any problems, found some bugs, or have anything to say, please reply this post to offer the feedback, which is so important and appreciative.