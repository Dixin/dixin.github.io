---
title: "C# functional programming in-depth (1) C# language basics"
published: 2019-06-01
description: "The previous chapter demonstrates that C# is a standardized, cross-platform, and multi-paradigm language, and gives an overview that C# is very functional with rich features, including LINQ, a unified"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# 6.0", "LINQ", "LINQ via C#", "C# Features", "Functional Programming", "Functional C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

The previous chapter demonstrates that C# is a standardized, cross-platform, and multi-paradigm language, and gives an overview that C# is very functional with rich features, including LINQ, a unified functional programming model to work with different data domains. Since this chapter, we dive into C# coding.

This chapter introduces the basic concepts and some basic syntax of C# programming for readers who are new to C# programming and who want to catch up with the latest status of C# 7.3. These concepts and language elements are used through this book. Understanding these basics, you should be ready for the following chapters of functional programming aspects and LINQ technologies, which covers the functional features of C# and all the relevant features in great detail. Some C# features out of the scope of functional programming and LINQ are not discussed in this book, like inheritance of object-oriented programming, pointer in unsafe code, interop with other unmanaged code, dynamic programming, etc.

<table border="1" cellpadding="0" cellspacing="0" class="MsoNormalTable" style="border: currentcolor; border-image: none; border-collapse: collapse; mso-border-alt: solid black .75pt; mso-yfti-tbllook: 1184;"><tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;"><td style="padding: 0.75pt; border: 1pt solid black; border-image: none; mso-border-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">C#</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">Basic features covered in this chapter</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">Functional and relevant features covered in later chapters</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">Features out of scope</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 1;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">1.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Class Structure Interface Enumeration Attribute</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Delegate Event Function member ref parameter out parameter Parameter array foreach statement</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Inheritance Pointer Interop</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 2;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">1.1</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">pragma directive</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 3;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">1.2</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">foreach for IDisposable</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 4;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">2.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Static class Partial type Generic type Nullable value type Null coalescing operator</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Anonymous method Generator Covariance and contravariance Generic method</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 5;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">3.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Auto property Object initializer Collection initializer</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Anonymous type Implicitly typed local variable Query expression Lambda expression Extension method Partial method</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 6;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">4.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Named argument Optional argument Generic covariance and contravariance</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Dynamic type</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 7;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">5.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Asynchronous function Caller info argument</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 8;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">6.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Property initializer Dictionary initializer Null propagation operator Exception filter String interpolation nameof operator</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Static import Expression bodied member await in catch/finally block</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 9;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">7.0</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">throw expression Digit separator</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Out variable Tuple and deconstruction Local function Expanded expression bodied member ref return and local Discard Generalized asynchronous return throw expression Pattern matching</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 10;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">7.1</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">default literal expression</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Async Main method Inferred tuple element name</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 11;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">7.2</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">ref structure Leading underscores in numeric literals</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Non-trailing named arguments in parameter ref readonly return and local Readonly structure</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">private protected modifier</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 12;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"><span style="mso-ascii-theme-font: minor-fareast; mso-fareast-theme-font: minor-fareast; mso-hansi-theme-font: minor-fareast; mso-fareast-language: zh-cn;">7.3</span></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">ref local reassignment</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">stackalloc initializer</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Attributes on backing fields</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Expression variables in initializers and queries</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Tuple comparison</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Indexing movable fixed buffers</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Custom fixed statement</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 13; mso-yfti-lastrow: yes;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"><span style="mso-ascii-theme-font: minor-fareast; mso-fareast-theme-font: minor-fareast; mso-hansi-theme-font: minor-fareast; mso-fareast-language: zh-cn;">8.0</span></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">using declaration</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Static local function</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">switch expressin</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">pattern match</p><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Asynchronous stream</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr></tbody></table>

## Type system

.NET Standard specification is a list of types and their members, which should be implemented by all frameworks in .NET family and used by .NET languages. C# is a strongly typed language. In C#, any value and any expression that evaluates to a value has a type, any function has a type as well. C# compiler checks all type information to ensure C# program is type safe, unless dynamic type is used.

### Types and members

C# and .NET Standard support 5 kinds of types: class, structure, enumeration, delegate, and interface.

A class is a reference type defined with the class keyword. It can have fields, properties, methods, events, operators, indexers, constructors, destructor, and nested class, structure, enumeration, delegate, and interface types. A class is always derived from System.Object class.

namespace System
```
{
```
```csharp
public class Object
```
```
{
```
```
public Object();
```
```
public static bool Equals(Object objA, Object objB);
```
```
public static bool ReferenceEquals(Object objA, Object objB);
```
```
public virtual bool Equals(Object obj);
```
```
public virtual int GetHashCode();
```
```
public Type GetType();
```
```
public virtual string ToString();
```

```csharp
protected virtual void Finalize();
```
```
}
```

}

Object has a static Equals method to test whether 2 instances are considered equal, an instance Equals method to test whether the current instance and the other instance are considered equal, and a static ReferenceEquals method to test whether 2 instances are the same instance. It has a GetHashCode method as the default hash function to return a hash code number for quick test of instances. It also has a GetType method to return the type of current instance, and a ToString method to return the text representation of the current instance. And finally, it has a virtual Finalize method, which can be overridden by derived types to free and cleanup resources.

The following example is a part of System.Exception class implementation in .NET Framework. It demonstrates the syntax to define a class and different kinds of members. This class implements the System.ISerializable interface, and derives the System.\_Exception class. When defining a class, base class System.Object can be omitted.

namespace System
```
{
```
```
[Serializable]
```
```csharp
public class Exception : ISerializable, _Exception // , System.Object
```
```
{
```
```
internal string _message; // Field.
```

```csharp
private Exception _innerException; // Field.
```
```
[OptionalField(VersionAdded = 4)]
```
```csharp
private SafeSerializationManager _safeSerializationManager; // Field.
```
```
public Exception InnerException { get { return this._innerException; } } // Property.
```
```
public Exception(string message, Exception innerException) // Constructor.
```
```
{
```
```
this.Init();
```
```
this._message = message;
```
```
this._innerException = innerException;
```
```
}
```
```
public virtual Exception GetBaseException() // Method.
```
```
{
```
```
Exception innerException = this.InnerException;
```
```
Exception result = this;
```
```
while (innerException != null)
```
```
{
```
```
result = innerException;
```
```
innerException = innerException.InnerException;
```
```
}
```
```
return result;
```
```
}
```

```csharp
protected event EventHandler<SafeSerializationEventArgs> SerializeObjectState // Event.
```
```
{
```
```
add
```
```
{
```
```
this._safeSerializationManager.SerializeObjectState += value;
```
```
}
```
```
remove
```
```
{
```
```
this._safeSerializationManager.SerializeObjectState -= value;
```
```
}
```
```
}
```
```
internal enum ExceptionMessageKind // Nested enumeration type.
```
```
{
```
```
ThreadAbort = 1,
```
```
ThreadInterrupted = 2,
```
```
OutOfMemory = 3
```
```
}
```
```
// Other members.
```
```
}
```

}

Here Exception class is tagged as Serializable, and its \_safeSerializationManager filed is tagged as OptionalField with additional information. These declarative tags are called attribute in C#. Attribute is a special class derived from System.Attribute class, used like a tag to associate declarative information with C# code elements, including assembly, module, type, type member, function parameter and return value.

A structure is value type defined with the struct keyword, which is then derived from System.Object class. It can have all kinds of members of class except destructor. A structure always derives from System.ValueType class, and interestingly, System.ValueType is a reference type derived from System.Object. In practice, a structure is usually defined to represent very small and immutable data structure, in order to improve the performance of memory allocation/deallocation. The following example is a part of the implementation of System.TimeSpan structure:

namespace System
```
{
```
```
public struct TimeSpan : IComparable, IComparable<TimeSpan>, IEquatable<TimeSpan>, IFormattable // , System.ValueType
```
```
{
```
```
public const long TicksPerMillisecond = 10000; // Constant.
```
```
public static readonly TimeSpan Zero = new TimeSpan(0); // Field.
```
```
internal long _ticks; // Field.
```
```
public TimeSpan(long ticks) // Constructor.
```
```
{
```
```
this._ticks = ticks;
```
```
}
```
```
public long Ticks { get { return _ticks; } } // Property.
```
```
public int Milliseconds // Property.
```
```
{
```
```
get { return (int)((_ticks / TicksPerMillisecond) % 1000); }
```
```
}
```
```
public static bool Equals(TimeSpan t1, TimeSpan t2) // Method.
```
```
{
```
```
return t1._ticks == t2._ticks;
```
```
}
```
```
public static bool operator ==(TimeSpan t1, TimeSpan t2) // Operator.
```
```
{
```
```
return t1._ticks == t2._ticks;
```
```
}
```
```
// Other members.
```
```
}
```

}

An enumeration is a value type derived from System.Enum class, which is derived from System.ValueType class. It can only have constant fields of the specified underlying integral type (int by default). For example:

namespace System
```
{
```
```
[Serializable]
```
```
public enum DayOfWeek // : int
```
```
{
```
```
Sunday = 0,
```
```
Monday = 1,
```
```
Tuesday = 2,
```
```
Wednesday = 3,
```
```
Thursday = 4,
```
```
Friday = 5,
```
```
Saturday = 6,
```
```
}
```

}

A delegate is a reference type derived from System.MulticastDelegate class, which is derived from System.Delegate class. Delegate type represents function type, and is discussed in detail in the delegate chapter.

namespace System
```
{
```
```
public delegate void Action();
```

}

An interface is a contract to be implemented by class or structure. Interface can only have public and abstract properties, methods, and events without implementation. For example:

namespace System.ComponentModel
```
{
```
```
public interface INotifyDataErrorInfo
```
```
{
```
```
event EventHandler<DataErrorsChangedEventArgs> ErrorsChanged; // Event.
```
```
bool HasErrors { get; } // Property.
```
```
IEnumerable GetErrors(string propertyName); // Method.
```
```
}
```

}

Any class or structure implementing the above interface must have the specified 3 members as public.

### Built-in types

There are basic. NET types most commonly used in C# programming, so C# provides language keywords as aliases of those types, which are called built-in types of C#:

<table border="1" cellpadding="0" cellspacing="0" class="MsoNormalTable" style="border: currentcolor; border-image: none; border-collapse: collapse; mso-border-alt: solid black .75pt; mso-yfti-tbllook: 1184;"><tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;"><td style="padding: 0.75pt; border: 1pt solid black; border-image: none; mso-border-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">C# keyword</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">.NET type</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 1;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">bool</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Boolean</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 2;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">sbyte</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.SByte</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 3;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">byte</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Byte</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 4;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">char</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Char</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 5;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">short</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Init16</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 6;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">ushort</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.UInit16</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 7;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">int</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Init32</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 8;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">uint</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.UInit32</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 9;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">long</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Init54</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 10;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">ulong</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.UInit54</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 11;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">float</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Single</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 12;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">double</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Double</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 13;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">decimal</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Decimal</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 14;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">object</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Object</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 15; mso-yfti-lastrow: yes;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">string</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.String</p><font style="font-size: 12pt;"></font></td></tr></tbody></table>

### Reference type vs. value type

In C#, classes are reference types, including object, string, array, etc. Delegates is also reference type, which is discussed later. Structures are value types, including primitive types (bool, sbyte, byte, char, short, ushort, int, uint, long, ulong, float, double), decimal, System.DateTime, System.DateTimeOffset, System.TimeSpan, System.Guid, System.Nullable<T>, enumeration (since enumeration’s underlying type is always a numeric primitive type), etc. The following example defines a reference type and a value type, which look similar to each other:

internal class Point
```
{
```
```csharp
private readonly int x;
```

```csharp
private readonly int y;
```
```
internal Point(int x, int y)
```
```
{
```
```
this.x = x;
```
```
this.y = y;
```
```
}
```
```
internal int X { get { return this.x; } }
```
```
internal int Y { get { return this.y; } }
```
```
}
```
```
internal readonly struct ValuePoint
```
```
{
```
```csharp
private readonly int x;
```

```csharp
private readonly int y;
```
```
internal ValuePoint(int x, int y)
```
```
{
```
```
this.x = x;
```
```
this.y = y;
```
```
}
```
```
internal int X { get { return this.x; } }
```
```
internal int Y { get { return this.y; } }
```

}

Instances of reference type and value type are allocated differently. Reference type is always allocated on the managed heap, and deallocated by garbage collection. Value type is either allocated on the stack and deallocated by stack unwinding, or is allocated and deallocated inline with the container. So generally, value type may have better performance for allocation and deallocation. Usually, a type can be designed as value type if it is small, immutable, and logically similar to a primitive type. The above System.TimeSpan type structure represents a duration of time, it is designed to be value type, because it is just an immutable wrapper of a long value, which represents ticks. The following example demonstrates this difference:

internal static void LocalVariable()
```
{
```
```
Point reference1 = new Point(1, 2);
```
```
Point reference2 = reference1; // Copy.
```
```
reference2 = new Point(3, 4); // reference1 is not impacted.
```
```
ValuePoint value1 = new ValuePoint(5, 6);
```
```
ValuePoint value2 = value1; // Copy.
```
```
value2 = new ValuePoint(7, 8); // value1 is not impacted.
```

}

When a Point instance is constructed as a local variable, since it is reference type, it is allocated in the managed heap. Its fields are value types, so the fields are allocated inline on the managed heap too. The local variable reference1 can be viewed as a pointer, pointing to managed heap location that holds the data. When assigning reference1 to reference2, the pointer is copied. So reference1 and reference2 both point to the same Point instance in the managed heap. When ValuePoint is constructed as a local variable, since it is value type. it is allocated in the stack. Its fields are also allocated inline in the stack. The local variable value1 holds the actual data. When assigning value1 to value2, the entire instance is copied, so value1 and value2 are 2 different ValuePoint instances in stack.

### ref local variable and immutable ref local variable

In C#, ref modifier can be used for local variable to avoid copying the reference or the value. ref can be read as “alias” or “no copy”:

internal static void RefLocalVariable()
```
{
```
```
Point reference1 = new Point(1, 2);
```
```
ref Point reference2 = ref reference1; // Alias.
```
```
reference2 = new Point(3, 4); // reference1 is not reassigned.
```
```
ValuePoint value1 = new ValuePoint(5, 6);
```
```
ref ValuePoint value2 = ref value1; // Alias.
```
```
value2 = new ValuePoint(7, 8); // value1 is not reassigned.
```
```
Point reference3 = new Point(1, 2);
```
```
reference2 = ref reference3; // Alias of something else.
```
```
ValuePoint value3 = new ValuePoint(5, 6);
```
```
value2 = ref value3; // Alias of something else.
```

}

Here reference2 is declared with ref and initialized with reference1. It can be viewed as an alias of reference1. If reference2 mutates, reference1 mutates in sync, and vice versa. C# 7.3 allows ref local variable to be reassigned with ref modifier. After reassigning reference3 to reference2 with ref modifier, reference2 becomes the alias of reference3. Similarly, value2 is an alias of value1. After reassignment with ref modifier, value2 becomes the alias of value3.

Since C# 7.2, the readonly modifier can be used with ref for immutable alias:

internal static void ImmutableRefLocalVariable()
```
{
```
```
Point reference1 = new Point(1, 2);
```
```
ref readonly Point reference2 = ref reference1; // Immutable alias.
```
```
reference2 = new Point(3, 4); // Cannot be compiled.
```
```
ValuePoint value1 = new ValuePoint(3, 4);
```
```
ref readonly ValuePoint value2 = ref value1; // Immutable alias.
```
```
value2 = new ValuePoint(7, 8); // Cannot be compiled.
```

}

The immutability is checked by compiler. Here trying to mutate reference2 and value2 causes compile time error.

### Array and stack-allocated array

In C#, array always derives from System.Array class and is reference type.

internal static void Array()
```
{
```
```
Point[] referenceArray = new Point[] { new Point(5, 6) };
```
```
ValuePoint[] valueArray = new ValuePoint[] { new ValuePoint(7, 8) };
```
```
Span<ValuePoint> valueArrayOnStack = stackalloc ValuePoint[] { new ValuePoint(9, 10) };
```

}

So referenceArray and valueArray are both allocated on heap, and their items are both on heap too. Since C# 7.3, the new keyword can be replaced by stackalloc keyword to allocate a value type array on stack, with its items on stack too. Stack-allocated array is represented by System.Span<T> structure.

### Default value

Reference type can be null and value type cannot:

internal static void Default()
```
{
```
```
Point defaultReference = default(Point);
```
```
Trace.WriteLine(defaultReference is null); // True
```
```
ValuePoint defaultValue = default(ValuePoint);
```
```
Trace.WriteLine(defaultValue.X); // 0
```
```
Trace.WriteLine(defaultValue.Y); // 0
```

}

The default value of reference type is simply null. The default of value type is an actual instance, with all fields initialized to their default values. Actually, the above local variables’ initialization is compiled to:

internal static void CompiledDefault()
```
{
```
```
Point defaultReference = null;
```
```
ValuePoint defaultValue = new ValuePoint();
```

}

A structure always virtually has a parameterless default constructor. Calling this default constructor instantiates the structure and sets all its fields to default values. Here defaultValue’s int fields are initialized to 0. If ValuePoint has a reference type field, the reference type field is initialized to null.

Since C# 7.1, the type in the default value expression can be omitted, if the type can be inferred. So the above default value syntax can be simplified to:

internal static void DefaultLiteralExpression()
```
{
```
```
Point defaultReference = default;
```
```
ValuePoint defaultValue = default;
```

}

### ref structure

C# 7.2 enables the ref modifier for structure definition, so that the structure can be only allocated on stack. This can be helpful for performance critical scenarios, where memory allocation/deallocation on heap can be performance overhead.

internal ref struct OnStackOnly { }
```
internal static void Allocation()
```
```
{
```
```
OnStackOnly valueOnStack = new OnStackOnly();
```
```
OnStackOnly[] arrayOnHeap = new OnStackOnly[10]; // Cannot be compiled.
```
```
}
```
```
internal class OnHeapOnly
```
```
{
```
```csharp
private OnStackOnly fieldOnHeap; // Cannot be compiled.
```
```
}
```
```
internal struct OnStackOrHeap
```
```
{
```
```csharp
private OnStackOnly fieldOnStackOrHeap; // Cannot be compiled.
```

}

As fore mentioned, array is reference type allocated on heap, so the compiler does not allow an array of ref structure. An instance of class is always allocated on heap, so ref structure cannot be its field. An instance of normal structure can be on stack or heap, so ref structure cannot be its field either.

### Static class

C# 2.0 enables static modifier for class definition. Take System.Math as example:

namespace System
```
{
```
```
public static class Math
```
```
{
```
```
// Static members only.
```
```
}
```

}

A static class can only have static members, and cannot be instantiated. Static class is compiled to abstract sealed class. In C#, a static class consisting of static methods is equivalent to a module of functions.

### Partial type

C# 2.0 introduces the partial keyword to split the definition of class, structure, or interface at design time.

internal partial class Device
```
{
```
```csharp
private string name;
```
```
internal string Name
```
```
{
```
```
get { return this.name; }
```
```
set { this.name = value; }
```
```
}
```
```
}
```
```
internal partial class Device
```
```
{
```
```
public string FormattedName
```
```
{
```
```
get { return this.name.ToUpperInvariant (); }
```
```
}
```

}

This is good for managing large type by splitting it into multiple smaller files. Partial type is also frequently used in code generation, so that user can append custom code to types generated by tool. At compile time, the multiple parts of a type are merged.

### Interface and implementation

When a type implements an interface, this type can implement each interface member either implicitly or explicitly. The following interface has 2 member methods:

internal interface IInterface
```
{
```
```
void Implicit();
```
```
void Explicit();
```

}

And the following type implementing this interface:

internal class Implementation : IInterface
```
{
```
```
public void Implicit() { }
```
```
void IInterface.Explicit() { }
```

}

This Implementations type has a public Implicit method with the same signature as the IInterface’s Implicit method, so C# compiler takes Implementations.Implicit method as the implementation of IInterface.Implicit method. This syntax is called implicit interface implementation. The other method Explicit, is implemented explicitly as an interface member, not as a member method of Implementations type. The following example demonstrates how to use these interface members:

internal static void InterfaceMembers()
```
{
```
```
Implementation @object = new Implementation();
```
```
@object.Implicit(); // @object.Explicit(); cannot be compiled.
```
```
IInterface @interface = @object;
```
```
@interface.Implicit();
```
```
@interface.Explicit();
```

}

An implicitly implemented interface member can be accessed from the instance of the implementation type and interface type, but an explicitly implemented interface member can only be accessed from the instance of the interface type. Here the variable name @object and @interface are prefixed with special character @, because object and interface are C# language keywords, and cannot be directly used as identifier.

### IDisposable interface and using declaration

The .NET runtime (CLR, CoreCLR, MonoCLR, etc.) manages memory automatically. It allocates memory for .NET objects and release the memory with garbage collector. A .NET object can also allocate other resources unmanaged by .NET runtime, like opened files, window handles, database connections, etc. .NET provides a standard contract for these types:

namespace System
```
{
```
```
public interface IDisposable
```
```
{
```
```
void Dispose();
```
```
}
```

}

A type implementing the above System.IDisposable interface must have a Dispose method, which explicitly releases its unmanaged resources when called. For example, System.Data.SqlClient.SqlConnection represents a connection to a SQL database, it implements IDisposable and provides Dispose method to release the underlying database connection. The following example is the standard try-finally pattern to use IDisposable object and call Dispose method:

internal static void Dispose(string connectionString)
```
{
```
```
SqlConnection connection = new SqlConnection(connectionString);
```
```
try
```
```
{
```
```
connection.Open();
```
```
Trace.WriteLine(connection.ServerVersion);
```
```
// Work with connection.
```
```
}
```
```
finally
```
```
{
```
```
if ((object)connection != null)
```
```
{
```
```
((IDisposable)connection).Dispose();
```
```
}
```
```
}
```

}

The Dispose method is called in finally block, so it is ensured to be called, even if exception is thrown from the operations in the try block, or if the current thread is aborted. IDisposable is widely used, so C# introduces a using statement syntactic sugar since 1.0. The above code is equivalent to:

internal static void Using(string connectionString)
```
{
```
```
using SqlConnection connection = new SqlConnection(connectionString);
```
```
connection.Open();
```
```
Trace.WriteLine(connection.ServerVersion);
```
```
// Work with connection.
```

}

This is more declarative at design time, and the try-finally is generated at compile time. Disposable instances should be always used with this syntax, to ensure its Dispose method is called in the right way.

### Generic type

C# 2.0 introduces generic programming. Generic programming is a paradigm that supports type parameters, so that type information are allowed to be provided later. The following stack data structure of int values is non generic:

internal interface IInt32Stack
```
{
```
```
void Push(int value);
```
```
int Pop();
```
```
}
```
```
internal class Int32Stack : IInt32Stack
```
```
{
```
```csharp
private int[] values = new int[0];
```
```
public void Push(int value)
```
```
{
```
```
Array.Resize(ref this.values, this.values.Length + 1);
```
```
this.values[this.values.Length - 1] = value;
```
```
}
```
```
public int Pop()
```
```
{
```
```
if (this.values.Length == 0)
```
```
{
```
```
throw new InvalidOperationException("Stack empty.");
```
```
}
```
```
int value = this.values[this.values.Length - 1];
```
```
Array.Resize(ref this.values, this.values.Length - 1);
```
```
return value;
```
```
}
```

}

This code is not very reusable. Later, if stacks are needed for values of other data types, like string, decimal, etc., then there are some options:

· For each new data type, make a copy of above code and modify the int type information. So IStringStack and StringStack can be defined for string, IDecimalStack and DecimalStack for decimal, and so on and on. Apparently this way is not feasible.

· Since every type is derived from object, a general stack for object can be defined, which is IObjectStack and ObjectStack. The Push method accepts object, and Pop method returns object, so the stack can be used for values of any data type. However, this design loses the compile time type checking. Calling Push with any argument can be compiled. Also, at runtime, whenever Pop is called, the returned object has to be casted to the expected type, which is a performance overhead and a chance to fail.

### Type parameter

With generics, a much better option is to replace the concrete type int with a type parameter T, which is declared in angle brackets following the stack type name:

internal interface IStack<T\>
```
{
```
```
void Push(T value);
```
```
T Pop();
```
```
}
```
```
internal class Stack<T>: IStack<T>
```
```
{
```
```csharp
private T[] values = new T[0];
```
```
public void Push(T value)
```
```
{
```
```
Array.Resize(ref this.values, this.values.Length + 1);
```
```
this.values[this.values.Length - 1] = value;
```
```
}
```
```
public T Pop()
```
```
{
```
```
if (this.values.Length == 0)
```
```
{
```
```
throw new InvalidOperationException("Stack empty.");
```
```
}
```
```
T value = this.values[this.values.Length - 1];
```
```
Array.Resize(ref this.values, this.values.Length - 1);
```
```
return value;
```
```
}
```

}

When using this generic stack, specify a concrete type for parameter T:

internal static void Stack()
```
{
```
```
Stack<int>stack1 = new Stack<int>();
```
```
stack1.Push(int.MaxValue);
```
```
int value1 = stack1.Pop();
```
```
Stack<string>stack2 = new Stack<string>();
```
```
stack2.Push(Environment.MachineName);
```
```
string value2 = stack2.Pop();
```
```
Stack<Uri>stack3 = new Stack<Uri>();
```
```
stack3.Push(new Uri("https://weblogs.asp.net/dixin"));
```
```
Uri value3 = stack3.Pop();
```

}

So, generics enables code reuse with type safety. IStack<T> and Stack<T> are strong typed, where IStack<T>.Push/Stack<T>.Push accept a value of type T, and IStack<T>Pop/IStack<T>.Pop return a value of type T. For example, When T is int, IStack<int>.Push/Stack<int>.Push accept an int value; When T is string, IStack<string>.Pop/Stack<int>.Pop returns a string value; etc. So IStack<T> and Stack<T> are polymorphic types, and this is called parametric polymorphism.

In .NET, a generic type with type parameters are called open type (or open constructed type). If generic type’s all type parameters are specified with concrete types, then it is called closed type (or closed constructed type). Here Stack<T> is open type, and Stack<int>, Stack<string>, Stack<Uri> are closed types.

The syntax for generic structure is the same as above generic class. Generic delegate and generic method will be discussed later.

### Type parameter constraints

For above generic types and the following generic type, the type parameter can be arbitrary value:

internal class Constraint<T\>
```
{
```
```
internal void Method()
```
```
{
```
```
T value = null;
```
```
}
```

}

Above code cannot be compiled, with error CS0403: Cannot convert null to type parameter 'T' because it could be a non-nullable value type. The reason is, as fore mentioned, only values of reference types (instances of classes) can be null, but here T is allowed be structure type too. For this kind of scenario, C# supports constraints for type parameters, with the where keyword:

internal class Constraint<T\> where T: class
```
{
```
```
internal static void Method()
```
```
{
```
```
T value1 = null;
```
```
}
```

}

Here T must be reference type, for example, Constraint<string> is allowed by compiler, and Constraint<int> causes a compiler error. Here are some more examples of constraints syntax:

internal partial class Constraints<T1, T2, T3, T4, T5, T6, T7\>
```
where T1 : struct
```
```
where T2 : class
```
```
where T3 : DbConnection
```
```
where T4 : IDisposable
```
```
where T5 : struct, IComparable, IComparable<T5>
```
```
where T6 : new()
```

where T7 : T2, T3, T4, IDisposable, new() { }

The above generic type has 7 type parameters:

· T1 must be value type (structure)

· T2 must be reference type (class)

· T3 must be the specified type, or derive from the specified type

· T4 must be the specified interface, or implement the specified interface

· T5 must be value type (structure), and must implement all the specified interfaces

· T6 must have a public parameterless constructor

· T7 must be or derive from or implement T2, T3, T4, and must implement the specified interface, and must have a public parameterless constructor

Take T3 as example:

internal partial class Constraints<T1, T2, T3, T4, T5, T6, T7\>
```
{
```
```
internal static void Method(T3 connection)
```
```
{
```
```
using (connection) // DbConnection implements IDisposable.
```
```
{
```
```
connection.Open(); // DbConnection has Open method.
```
```
}
```
```
}
```

}

Regarding System.Data.Common.DbConnection implements System.IDisposable, and has a CreateCommand method, so the above t3 object can be used with using statement, and the CreateCommand call can be compiled too.

The following is an example closed type of Constraints<T1, T2, T3, T4, T5, T6, T7>:

internal static void CloseType()
```
{
```
```
Constraints<bool, object, DbConnection, IDbConnection, int, Exception, SqlConnection>closed = default;
```

}

Here:

· bool is value type

· object is reference type

· DbConnection is DbConnection

· System.Data.Common.IDbConnection implements IDisposable

· int is value type, implements System.IComparable, and implements System.IComparable<int> too

· System.Exception has a public parameterless constructor

· System.Data.SqlClient.SqlConnection derives from object, derives from DbConnection, implements IDbConnection, and has a public parameterless constructor

### Nullable value type

As fore mentioned, In C#/.NET, instance of type cannot be null. However, there are still some scenarios for value type to represent logical null. A typical example is database table. A value retrieved from a nullable integer column can be either integer value, or null. C# 2.0 introduces a nullable value type syntax T?, for example int? reads nullable int. T? is just a shortcut of the System.Nullable<T> generic structure:

namespace System
```
{
```
```
public struct Nullable<T> where T : struct
```
```
{
```
```csharp
private bool hasValue;
```
```
internal T value;
```
```
public Nullable(T value)
```
```
{
```
```
this.value = value;
```
```
this.hasValue = true;
```
```
}
```
```
public bool HasValue
```
```
{
```
```
get { return this.hasValue; }
```
```
}
```
```
public T Value
```
```
{
```
```
get
```
```
{
```
```
if (!this.hasValue)
```
```
{
```
```
throw new InvalidOperationException("Nullable object must have a value.");
```
```
}
```
```
return this.value;
```
```
}
```
```
}
```
```
// Other members.
```
```
}
```

}

The following example demonstrates how to use nullable int:

internal static void Nullable()
```
{
```
```
int? nullable = null;
```
```
nullable = 1;
```
```
if (nullable != null)
```
```
{
```
```
int value = (int)nullable;
```
```
}
```

}

Apparently, int? is the Nullable<int> structure, and cannot be real null. Above code is syntactic sugar and compiled to normal structure usage:

internal static void CompiledNullable()
```
{
```
```
Nullable<int>nullable = new Nullable<int>();
```
```
nullable = new Nullable<int>(1);
```
```
if (nullable.HasValue)
```
```
{
```
```
int value = nullable.Value;
```
```
}
```

}

When nullable is assigned with null, it is actually assigned with an instance of Nullable<int> instance. Here the structure’s default parameterless constructor is called, so a Nullable<int> instance is initialized, with each data field is initialized with its default value. So nullable’s hasValue field is false, indicating this instance logically represents null. Then nullable is reassigned with normal int value, it is actually assigned with another Nullable<int> instance, where hasValue field is set to true and value field is set to the specified int value. The non null check is compiled to HasValue property call. And the type conversion from int? to int is compiled to the Value property call.

## Declarative C#

C# supports declarative attribute since 1.0. A lot of features are added to C# since 3.0 make it more declarative and less imperative. Most of these features are syntactic sugar.

### Auto property

A property is essentially a getter with body and/or a setter with body. In many cases, a property’s setter and getter just wraps a data field, like the above Device type’s Name property. This pattern can be annoying when a type has many properties for wrapping data fields, so C# 3.0 introduces auto property syntactic sugar:

internal partial class Device
```
{
```
```
internal decimal Price { get; set; }
```

}

The backing field definition and the body of getter/setter are generated by compiler:

internal class CompiledDevice
```
{
```
```
[CompilerGenerated]
```
```csharp
private decimal priceBackingField;
```
```
internal decimal Price
```
```
{
```
```
[CompilerGenerated]
```
```
get { return this.priceBackingField; }
```
```
[CompilerGenerated]
```
```
set { this.priceBackingField = value; }
```
```
}
```
```
// Other members.
```

}

Since C# 6.0, auto property can be getter only. And C# 7.3 allows field-targeted attribute declared on auto property:

\[Serializable\]

internal partial class Category

{

internal Category(string name)

{

this.Name = name;

}

\[field: NonSerialized\]

internal string Name { get; /\* private set; \*/ }

}

The above Name property is compiled to be getter only with read only backing field, and the field-targeted NonSerialized attribute is compiled to the generated backing field:

\[Serializable\]
```
internal partial class CompiledCategory
```
```
{
```
```
[CompilerGenerated]
```
```
[DebuggerBrowsable(DebuggerBrowsableState.Never)]
```
```
[NonSerialized]
```
```csharp
private readonly string nameBackingField;
```
```
internal CompiledCategory(string name)
```
```
{
```
```
this.nameBackingField = name;
```
```
}
```
```
internal string Name
```
```
{
```
```
[CompilerGenerated]
```
```
get { return this.nameBackingField; }
```
```
}
```

}

### Property initializer

C# 6.0 introduces property initializer syntactic sugar, so that property’s initial value can be provided inline as an expression:

internal partial class Category
```
{
```
```
internal Guid Id { get; } = Guid.NewGuid();
```
```
internal string Description { get; set; } = string.Empty;
```

}

The property initializer is compiled to backing field initializer:

internal partial class CompiledCategory
```
{
```
```
[CompilerGenerated]
```
```
[DebuggerBrowsable(DebuggerBrowsableState.Never)]
```
```csharp
private readonly Guid idBackingField = Guid.NewGuid();
```
```
[CompilerGenerated]
```
```
[DebuggerBrowsable(DebuggerBrowsableState.Never)]
```
```csharp
private string descriptionBackingField = string.Empty;
```
```
internal Guid Id
```
```
{
```
```
[CompilerGenerated]
```
```
get { return this.idBackingField; }
```
```
}
```
```
internal string Description
```
```
{
```
```
[CompilerGenerated]
```
```
get { return this.descriptionBackingField; }
```
```
[CompilerGenerated]
```
```
set { this.descriptionBackingField = value; }
```
```
}
```

}

### Object initializer

A Device instance can be initialized with a sequence of imperative property assignment statements:

internal static void SetProperties()
```
{
```
```
Device device = new Device();
```
```
device.Name = "Surface Book";
```
```
device.Price = 1349M;
```

}

C# 3.0 introduces object initializer syntactic sugar to merge constructor call and property setting in a declarative style:

internal static void ObjectInitializer()
```
{
```
```
Device device = new Device() { Name = "Surface Book", Price = 1349M };
```

}

The object initializer syntax in the second example is compiled to the code in the first example.

### Collection initializer

Similarly, C# 3.0 also introduces collection initializer syntactic sugar for type that implements System.Collections.IEnumerable interface and has a parameterized Add method. Take the following device collection as example:

internal class DeviceCollection : IEnumerable
```
{
```
```csharp
private Device[] devices = new Device[0];
```
```
internal void Add(Device device)
```
```
{
```
```
Array.Resize(ref this.devices, this.devices.Length + 1);
```
```
this.devices[this.devices.Length - 1] = device;
```
```
}
```
```
public IEnumerator GetEnumerator() // IEnumerable member.
```
```
{
```
```
return this.devices.GetEnumerator();
```
```
}
```

}

It can be initialized declaratively:

internal static void CollectionInitializer(Device device1, Device device2)
```
{
```
```
DeviceCollection devices = new DeviceCollection() { device1, device2 };
```

}

The above code is compiled to a normal constructor call followed by a sequence of Add method calls:

internal static void CompiledCollectionInitializer(Device device1, Device device2)
```
{
```
```
DeviceCollection devices = new DeviceCollection();
```
```
devices.Add(device1);
```
```
devices.Add(device2);
```

}

### Index initializer

C# 6.0 introduces index initializer for type with indexer setter:

internal class DeviceDictionary
```
{
```
```
internal Device this[int id] { set { } }
```

}

It is another declarative syntactic sugar:

internal static void IndexInitializer(Device device1, Device device2)
```
{
```
```
DeviceDictionary devices = new DeviceDictionary { [10] = device1, [11] = device2 };
```

}

The above syntax is compiled to normal constructor call followed by a sequence of indexer calls:

internal static void CompiledIndexInitializer(Device device1, Device device2)
```
{
```
```
DeviceDictionary devices = new DeviceDictionary();
```
```
devices[0] = device1;
```
```
devices[1] = device2;
```

}

### Null coalescing operator

C# 2.0 introduces a null coalescing operator ??. It works with 2 operands as left ?? right. If the left operand is not null, it returns the left operand, otherwise, it returns the right operand. For example, when working with reference or nullable value, it is very common to have null check at runtime, and have null replaced:

internal partial class Point
```
{
```
```
internal static Point Default { get; } = new Point(0, 0);
```
```
}
```
```
internal partial struct ValuePoint
```
```
{
```
```
internal static ValuePoint Default { get; } = new ValuePoint(0, 0);
```
```
}
```
```
internal static void DefaultValueForNull(Point reference, ValuePoint? nullableValue)
```
```
{
```
```
Point point;
```
```
If (reference!=null)
```
```
{
```
```
point = reference;
```
```
}
```
```
else
```
```
{
```
```
point = reference;
```
```
}
```
```
ValuePoint valuePoint = nullableValue != null ? (ValuePoint)nullableValue : ValuePoint.Default;
```

}

This above if statement and ternary operator can be simplified by an expression with the null coalescing operator:

internal static void DefaultValueForNullWithNullCoalescing(Point reference, ValuePoint? nullableValue)
```
{
```
```
Point point = reference ?? Point.Default;
```
```
ValuePoint valuePoint = nullableValue ?? ValuePoint.Default;
```

}

### Null conditional operators

It is also very common to check null before member or indexer access:

internal static void NullCheck(Category category, Device\[\] devices)
```
{
```
```
string categoryText = null;
```
```
if (category != null)
```
```
{
```
```
categoryText = category.ToString();
```
```
}
```
```
string firstDeviceName;
```
```
if (devices != null)
```
```
{
```
```
Device firstDevice = devices[0];
```
```
if (first != null)
```
```
{
```
```
firstDeviceName = firstDevice.Name;
```
```
}
```
```
}
```

}

To simplify the nested if statement for null check with an expression, C# 6.0 introduces null conditional operators (also called null propagation operators), including ?. for member access and ?\[\] for indexer access:

internal static void NullCheckWithNullConditional(Category category, Device\[\] devices)
```
{
```
```
string categoryText = category?.ToString();
```
```
string firstDeviceName = devices?[0]?.Name;
```

}

### throw expression

Since C# 7.0, throw statement can be used as expression. The throw expression is frequently used with the conditional operator and null coalescing operator to simplify argument check:

internal partial class Subcategory
```
{
```
```
internal Subcategory(string name, Category category)
```
```
{
```
```
this.Name = !string.IsNullOrWhiteSpace(name) ? name : throw new ArgumentNullException("name");
```
```
this.Category = category ?? throw new ArgumentNullException("category");
```
```
}
```
```
internal Category Category { get; }
```
```
internal string Name { get; }
```

}

The above throw expressions are compiled to if control flows:

internal partial class CompiledSubcategory
```
{
```
```
internal CompiledSubcategory(string name, Category category)
```
```
{
```
```
If (string.IsNullOrWhiteSpace(name))
```
```
{
```
```
throw new ArgumentNullException("name");
```
```
}
```
```
this.Name = name;
```
```
if (category == null)
```
```
{
```
```
throw new ArgumentNullException("category");
```
```
}
```
```
this.Category = category;
```
```
}
```
```
internal Category Category { get; }
```
```
internal string Name { get; }
```

}

### Exception filter

In C#, it used to be common to catch an exception, filter, and then handle/rethrow. The following example tries to download HTML string from the specified URI, and it can handle the download failure if the response status is bad request. So, it catches the exception to check with an if statement. If the exception has expected info, it handles the exception; otherwise, it rethrows the exception.

internal static void CatchFilterRethrow(WebClient webClient)
```
{
```
```
try
```
```
{
```
```
string html = webClient.DownloadString("http://weblogs.asp.net/dixin");
```
```
}
```
```
catch (WebException exception)
```
```
{
```
```
if ((exception.Response as HttpWebResponse)?.StatusCode == HttpStatusCode.BadRequest)
```
```
{
```
```
// Handle exception.
```
```
}
```
```
else
```
```
{
```
```
throw;
```
```
}
```
```
}
```

}

C# 6.0 introduces exception filter at the language level. the catch block can have an expression to filter the specified exception before catching. If the expression returns true, the catch block is executed:

internal static void ExceptionFilter(WebClient webClient)
```
{
```
```
try
```
```
{
```
```
string html = webClient.DownloadString("http://weblogs.asp.net/dixin");
```
```
}
```
```
catch (WebException exception) when ((exception.Response as HttpWebResponse)?.StatusCode == HttpStatusCode.BadRequest)
```
```
{
```
```
// Handle exception.
```
```
}
```

}

Exception filter is not a syntactic sugar to replace if statement with declarative expression, but a .NET runtime feature. The above exception filter expression is compiled to filter clause in CIL. The following cleaned CIL virtually demonstrates the compilation result:

.method assembly hidebysig static void ExceptionFilter(class \[System\]System.Net.WebClient webClient) cil managed
```
{
```
```
.try
```
```
{
```
```
// string html = webClient.DownloadString("http://weblogs.asp.net/dixin");
```
```
}
```
```
filter
```
```
{
```
```
// when ((exception.Response as HttpWebResponse)?.StatusCode == HttpStatusCode.BadRequest)
```
```
}
```
```
{
```
```
// Handle exception.
```
```
}
```

}

When the filter expression returns false, the catch clause is never executed, so there is no need to rethrow exception. Rethrowing exception causes stack unwinding, as if the exception is from the throw statement, and the original call stack and other info is lost. So this feature is very helpful for diagnostics and debugging.

### String interpolation

For many years, string composite formatting is widely used in C#. It inserts values to indexed placeholders in string format:

internal static void Log(Device device)
```
{
```
```
string message = string.Format("{0}: {1}, {2}", DateTime.Now.ToString("o"), device.Name, device.Price);
```
```
Trace.WriteLine(message);
```

}

C# 6.0 introduces string interpolation syntactic sugar to declare the values in place, with no need to maintaining the indexes:

internal static void LogWithStringInterpolation(Device device)
```
{
```
```
string message = string.Format($"{DateTime.Now.ToString("o")}: {device.Name}, {device.Price}");
```
```
Trace.WriteLine(message);
```

}

The second interpolation version is more declarative and productive, without maintaining a series of indexes. This syntax is actually compiled to the first composite formatting.

### nameof operator

C# 6.0 introduces a nameof operator to obtain the string name of variable, type, or member. Take argument check as example:

internal static void ArgumentCheck(int count)
```
{
```
```
if (count < 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException("count");
```
```
}
```

}

The parameter name is a hard coded string, and cannot be checked by compiler. Now with nameof operator, the compiler can generated the above parameter name string constant:

internal static void NameOf(int count)
```
{
```
```
if (count < 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(count));
```
```
}
```

}

### Digit separator and leading underscore

C# 7.0 introduces underscore as the digit separator, as well as the 0b prefix for binary number. C# 7.1 supports an optional underscore at the beginning of the number.

internal static void DigitSeparator()
```
{
```
```
int value1 = 10_000_000;
```
```
double value2 = 0.123_456_789;
```
```
int value3 = 0b0001_0000; // Binary.
```
```
int value4 = 0b_0000_1000; // Binary.
```

}

These small features greatly improve the readability of long numbers and binary numbers at design time.

## Summary

This chapter demonstrates the syntax of C# class, structure, enumeration, interface, as well as their members. It also discusses the concepts of built-in types, reference type, value type, generic type, nullable value type, etc. It then introduces some basic declarative syntax of C#, including initializers, operators, expressions, etc., and how they are implemented by compiler. The declarative syntax in recent C# releases 7.0, 7.1, 7.2, 7.3 are also covered. After getting familiar with these basics, the next chapter starts to discuss more in-depth knowledge of C# functional programming aspects.