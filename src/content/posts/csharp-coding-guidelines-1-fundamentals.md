---
title: "C# Coding Guidelines (1) Fundamentals"
published: 2009-10-06
description: "Recently some talks on dos and don'ts of C# 2.0 / 3.0 / 4.0 are delivered for some junior developers in my friend’s team. Since the feedback looks good, those contents are decided to write down."
image: ""
tags: [".NET", "C#", "Coding Guidelines"]
category: ".NET"
draft: false
lang: ""
---

Recently some talks on dos and don'ts of C# 2.0 / 3.0 / 4.0 are delivered for some junior developers in my friend’s team. Since the feedback looks good, those contents are decided to write down.

C# Coding Guidelines:

-   C# Coding Guidelines (1) Fundamentals
-   [C# Coding Guidelines (2) Naming](/posts/csharp-coding-guidelines-2-naming)
-   [C# Coding Guidelines (3) Members](/posts/csharp-coding-guidelines-3-members)
-   [C# Coding Guidelines (4) Types](/posts/csharp-coding-guidelines-4-types)
-   [C# Coding Guidelines (5) Exceptions](/posts/csharp-coding-guidelines-5-exceptions)
-   [C# Coding Guidelines (6) Documentation](/posts/csharp-coding-guidelines-6-documentation)
-   [C# Coding Guidelines (7) Tools](/posts/csharp-coding-guidelines-7-tools)

This part is used to mention some general concepts.

## Framework Design Guidelines

The first thing is, one important way to learn professional C# coding is to read the book “[Framework Design Guidelines: Conventions, Idioms, and Patterns for Reusable .NET Libraries](http://www.amazon.com/Framework-Design-Guidelines-Conventions-Libraries/dp/0321545613/ref=dp_ob_title_bk)” (2nd Edition).

![frame-work-design-guidelines](https://aspblogs.z22.web.core.windows.net/dixin/Media/frameworkdesignguidelines_17CB25D7.png "frame-work-design-guidelines")

This book is from the 10 years’ professional coding and design experience of Microsoft. It is the winner of the 16th Jolt Productivity award in 2006. Just like [Jeffrey Richter](http://www.wintellect.com/cs/blogs/jeffreyr/default.aspx) said,

> This book is an absolute must read for all .NET developers. It gives clear ‘do’ and ‘don’t’ guidance on how to design class libraries for .NET. It also offers insight into the design and creation of .NET that really helps developers understand the reasons why things are the way they are. This information will aid developers designing their own class libraries and will also allow them to take advantage of the .NET class library more effectively.

## Consistency

[Anders Hejlsberg](http://en.wikipedia.org/wiki/Anders_Hejlsberg), chief designer of C# programming language, said that,

> I have always felt that a key characteristic of a framework must be consistency.

It is also mentioned in the [Usability Maxims](http://en.wikipedia.org/wiki/Usability#Lund.2C_1997_Usability_Maxims):

> Consistency, consistency, consistency.

Consistency need to be enforced as a rule with high priority. Externally consistency makes the design easier to use, and internally consistency makes the code easier to maintain.

## Usability

This word is borrowed from the user experience design. Referring to “[the king of usability](http://www.useit.com/jakob/)” [Jakob Nielsen](http://en.wikipedia.org/wiki/Jakob_Nielsen_\(usability_consultant\))’s explanation, [usability](http://en.wikipedia.org/wiki/Usability) is a part of usefulness:

-   Learnability: How easy is it for developers to accomplish basic tasks (like invoking the API) the first time they encounter the design?
-   Efficiency: Once developers have learned the design, how quickly can they perform tasks?
-   Memorability: When developers return to the design after a period of not using it, how easily can they re establish proficiency?
-   Errors: How many errors do developers make, how severe are these errors, and how easily can they recover from the errors?
-   Satisfaction: How pleasant is it to use the design?