---
title: "C# Coding Guidelines (7) Tools"
published: 2009-10-14
description: "C# Coding Guidelines:"
image: ""
tags: [".NET", "C#", "Coding Guidelines"]
category: "C#"
draft: false
lang: ""
---

C# Coding Guidelines:

-   [C# Coding Guidelines (1) Fundamentals](/posts/csharp-coding-guidelines-1-fundamentals)
-   [C# Coding Guidelines (2) Naming](/posts/csharp-coding-guidelines-2-naming)
-   [C# Coding Guidelines (3) Members](/posts/csharp-coding-guidelines-3-members)
-   [C# Coding Guidelines (4) Types](/posts/csharp-coding-guidelines-4-types)
-   [C# Coding Guidelines (5) Exceptions](/posts/csharp-coding-guidelines-5-exceptions)
-   [C# Coding Guidelines (6) Documentation](/posts/csharp-coding-guidelines-6-documentation)
-   C# Coding Guidelines (7) Tools

In this article some excellent tools for code quality will be introduced.

## FxCop / Code Analysis

[FxCop](http://msdn.microsoft.com/en-us/library/bb429476\(VS.80\).aspx) is standalone while Code Analysis is integrated in Visual Studio, but many developer do not quite care about it.

Its original purpose is programmatic enforcement of the [Framework Design Guidelines](http://www.amazon.com/Framework-Design-Guidelines-Conventions-Libraries/dp/0321545613/ref=dp_ob_title_bk). Applying Code Analysis in the daily coding will be helpful to build the habit of professional coding.

You can get a lot of useful information from the [Code Analysis Team Blog](http://blogs.msdn.com/fxcop/).

## StyleCop

Many people never used this tool. Personally I like it very much. [StyleCop](http://code.msdn.microsoft.com/sourceanalysis) analyzes C# source code to enforce a set of style and consistency rules, which are customizable.

After the installation it can be integrated into Visual Studio:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines7Tools_12A4B/image_thumb.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines7Tools_12A4B/image_2.png)

You can download the latest version from [here](http://code.msdn.microsoft.com/sourceanalysis/Release/ProjectReleases.aspx?ReleaseId=1425). And the StyleCop Team Blog is [here](http://blogs.msdn.com/sourceanalysis/).

## Resharper + \[StyleCop For Resharper\]

[Resharper](http://www.jetbrains.com/resharper/index.html) is the most powerful plug-in for Visual Studio I have ever used. Its features include:

-   [error analysis and suggestions](http://www.jetbrains.com/resharper/documentation/presentation/overview/quick-fixes/qf_ca_demo.htm)
-   [navigation and search](http://www.jetbrains.com/resharper/documentation/presentation/overview/navigation/Navigate_from_here_demo.htm)
-   [code generation](http://www.jetbrains.com/resharper/documentation/presentation/overview/code_generation/Generate_demo.htm)
-   [refactorings](http://www.jetbrains.com/resharper/documentation/presentation/overview/refactorings/Refactor_this_demo.htm)

etc.

Itself also supports plug-ins, like this excellent [StyleCop for ReSharper](http://www.codeplex.com/StyleCopForReSharper). After the installation, Visual Studio becomes like this:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines7Tools_12A4B/image_thumb_2.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines7Tools_12A4B/image_6.png)

The developer cannot get rid of even a slight coding style inconsistency.

And this is its Code Cleanup feature:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines7Tools_12A4B/image_thumb_1.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines7Tools_12A4B/image_4.png)

So many customizable rules make it incomparable with the Ctrl + K + D of Visual Studio.

## GhostDoc

[GhostDoc](http://submain.com/products/ghostdoc.aspx) is a small plug-in of Visual Studio used to generate XML documentation comments. Using GhostDoc greatly saves a lot time.

## Sandcastle

This is a toolkit for generating document from the XML comments in the code.

These are needed to install:

-   [Microsoft HTML Help Workshop](http://go.microsoft.com/fwlink/?LinkId=14188)
-   [Sandcastle Documentation Compiler](http://sandcastle.codeplex.com/)
-   [Sandcastle Help File Builder](http://www.codeplex.com/SHFB)

Then just:

-   import the solution;
-   customize the configurations;
-   build the document.

Then the MSDN-like document is built, which looks very professional. Here are some snapshots in [part 6](/posts/csharp-coding-guidelines-6-documentation).