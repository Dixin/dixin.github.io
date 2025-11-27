---
title: "Entity Framework Core and LINQ to Entities in Depth (2) Modeling Database: Object-Relational Mapping"
published: 2019-10-04
description: "In LINQ to Entities, the queries are based on Object-relational mapping. .NET and SQL database and have 2 different data type systems. For example, .NET has System.Int64 and System.String, while SQL d"
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework Core", "LINQ to Entities", "SQL Server", "SQL", "Object-Relational Mapping", ".NET Core", "EF Core"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core (EF Core) series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework (EF) series](/archive/?tag=Entity%20Framework)\]

In LINQ to Entities, the queries are based on Object-relational mapping. .NET and SQL database and have 2 different data type systems. For example, .NET has System.Int64 and System.String, while SQL database has bigint and nvarchar; .NET has sequences and objects, while SQL database has tables and rows;, etc. Object-relational mapping is a popular technology to map and convert between application data objects and database relational data.

### Data types

EF Core can map most SQL data types to .NET types:

<table border="1" cellpadding="0" cellspacing="0" class="MsoNormalTable" style="border: currentcolor; border-image: none; border-collapse: collapse; mso-border-alt: solid black .75pt; mso-yfti-tbllook: 1184;"><tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;"><td style="padding: 0.75pt; border: 1pt solid black; border-image: none; mso-border-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">SQL type category</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">SQL type</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">.NET type</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">C# primitive</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 1;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Exact numeric</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">bit</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Boolean</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">bool</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 2;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">tinyint</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Byte</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">byte</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 3;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">smallint</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Int16</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">short</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 4;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">int</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Int32</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">int</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 5;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">bigint</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Int64</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">long</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 6;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">smallmoney, money, decimal, numeric</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Decimal</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">decimal</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 7;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Approximate numeric</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">real</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Single</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">float</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 8;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">float</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Double</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">double</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 9;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Character string</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">char, varchar, text</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.String</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">string</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 10;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">nchar, nvarchar, ntext</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.String</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">string</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 11;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Binary string</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">binary, varbinary</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Byte[]</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">byte[]</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 12;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">image</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Byte[]</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">byte[]</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 13;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">rowversion (timestamp)</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Byte[]</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">byte[]</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 14;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Date time</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">date</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.DateTime</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 15;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">time</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.TimeSpan</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 16;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">smalldatetime, datetime, datetime2</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.DateTime</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 17;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">datetimeoffset</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.DateTimeOffset</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 18;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Other</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">hierarchyid</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">No built-in support</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 19;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">xml</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.String</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">string</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 20;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">uniqueidentifier</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Guid</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 21; mso-yfti-lastrow: yes;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;"></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">sql_variant</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Object</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">object</p><font style="font-size: 12pt;"></font></td></tr></tbody></table>

The mapping of spatial types are supported through NetTopologySuite, a free and open source library. For SQL database, just install the Microsoft.EntityFrameworkCore.SqlServer.NetTopologySuite NuGet package.

### Database

A SQL database is mapped to a type derived from Microsoft.EntityFrameworkCore.DbContext:

public partial class AdventureWorks : DbContext { }

The following is the definition of DbContext:

namespace Microsoft.EntityFrameworkCore
```
{
```
```csharp
public class DbContext : IDisposable, IInfrastructure<IServiceProvider>
```
```
{
```
```
public DbContext(DbContextOptions options);
```
```
public virtual ChangeTracker ChangeTracker { get; }
```
```
public virtual DatabaseFacade Database { get; }
```
```
public virtual void Dispose();
```
```
public virtual int SaveChanges();
```
```
public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;
```

```csharp
protected internal virtual void OnModelCreating(ModelBuilder modelBuilder);
```
```
// Other members.
```
```
}
```

}

DbContext implements IDisposable. Generally, a database instance should be constructed and disposed for each unit of work - a collection of data operations that should succeed or fail as a unit:

internal static void Dispose()
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
// Unit of work.
```
```
}
```

}

EF Core also support DbContext pooling to improve performance. In the application or service, If DbContext is used through dependency injection, and it is no custom state (just like the above AdventureWorks type with no fields), then DbContext pooling can be enabled to reuse DbContext without disposing.

In EF Core, most of the object-relational mapping can be implemented declaratively, and the rest of the mapping can be implemented imperatively by overriding DbContext.OnModelCreating, which is automatically called by EF Core during initialization:

public partial class AdventureWorks
```
{
```
```csharp
protected override void OnModelCreating(ModelBuilder modelBuilder)
```
```
{
```
```
base.OnModelCreating(modelBuilder);
```
```
MapCompositePrimaryKey(modelBuilder);
```
```
MapManyToMany(modelBuilder);
```
```
MapDiscriminator(modelBuilder);
```
```
}
```

}

The above MapCompositePrimaryKey, MapManyToMany, MapDiscriminator functions are implemented later in this chapter.

### Connection resiliency and execution retry strategy

The connection to the mapped database can be specified from the constructor of DbContext:

public partial class AdventureWorks
```
{
```
```
public AdventureWorks(DbConnection connection = null)
```
```
: base(GetDbContextOptions(connection))
```
```
{
```
```
}
```

```csharp
private static DbContextOptions GetDbContextOptions(
```
```
DbConnection connection = null) =>
```
```
new DbContextOptionsBuilder<AdventureWorks>()
```
```
.UseSqlServer(
```
```
connection: connection ??
```
```
new SqlConnection(ConnectionStrings.AdventureWorks),
```
```
sqlServerOptionsAction: options => options.EnableRetryOnFailure(
```
```
maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30),
```
```
errorNumbersToAdd: null))
```
```
.Options;
```

}

Here when database connection is not provided to the constructor, a new database connection is created with the previously defined connection string. Also, regarding the connection between application and SQL database may be interrupted over the network, EF Core supports connection resiliency for SQL database. This is very helpful for Azure SQL database deployed in the cloud instead of local network. In the above example, EF Core is specified to automatically retries up to 5 times with the retry interval of 30 seconds.

### Tables

There are tens of tables in the AdventureWorks database, but don’t panic, this book only involves a few tables, and a few columns of these tables. In EF Core, a table definition can be mapped to an entity type definition, where each column is mapped to a entity property. For example, the AdventureWorks database has a Production.ProductCategory table. Its definition can be virtually viewed as:

CREATE SCHEMA \[Production\];
```
GO
```

```sql
CREATE TYPE [dbo].[Name] FROM nvarchar(50) NULL;
```
```
GO
```
```
CREATE TABLE [Production].[ProductCategory](
```
```
[ProductCategoryID] int IDENTITY(1,1) NOT NULL
```
```
CONSTRAINT [PK_ProductCategory_ProductCategoryID] PRIMARY KEY CLUSTERED,
```
```
[Name] [dbo].[Name] NOT NULL, -- nvarchar(50).
```
```
[rowguid] uniqueidentifier ROWGUIDCOL NOT NULL -- Ignored in mapping.
```
```
CONSTRAINT [DF_ProductCategory_rowguid] DEFAULT (NEWID()),
```
```
[ModifiedDate] datetime NOT NULL -- Ignored in mapping.
```
```
CONSTRAINT [DF_ProductCategory_ModifiedDate] DEFAULT (GETDATE()));
```

GO

This table definition can be mapped to a ProductCategory entity definition:

public partial class AdventureWorks
```
{
```
```
public const string Production = nameof(Production); // Production schema.
```
```
}
```
```
[Table(nameof(ProductCategory), Schema = AdventureWorks.Production)]
```
```
public partial class ProductCategory
```
```
{
```
```
[Key]
```
```
[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
```
```
public int ProductCategoryID { get; set; }
```
```
[MaxLength(50)]
```
```
[Required]
```
```
public string Name { get; set; }
```
```
// Other columns are ignored.
```

}

The \[Table\] attribute specifies the table name and schema. \[Table\] can be omitted when the table name is the same as the entity name, and the table is under the default dbo schema. In the table-entity mapping:

· The ProductCategoryID column of int type is mapped to a System.Int32 property with the same name. The \[Key\] attribute indicates it is a primary key. EF Core requires a table to have primary key to be mapped. \[DatabaseGenerated\] indicates it is an identity column, with value generated by database.

· The Name column is of dbo.Name type. which is actually nvarchar(50), so it is mapped to Name property of type System.String. The \[MaxLength\] attribute indicates the max length of the string value is 50. \[Required\] indicates it should not be null or empty string or whitespace string.

· The other columns rowguid and ModifiedDate are not mapped. They are not used in this book to keep the code examples simple.

At runtime, each row of Production.ProductCategory table is mapped to a ProductCategory entity instance. The entire table can be mapped to an IQueryable<T> data source, exposed as a property of the database mapping. EF Core provides DbSet<T>, which implements IQueryable<T>, to represent a table data source:

public partial class AdventureWorks
```
{
```
```
public DbSet<ProductCategory>ProductCategories { get; set; }
```

}

EF Core also supports immutable entity definition:

\[Table(nameof(ProductCategory), Schema = AdventureWorks.Production)\]
```
public partial class ProductCategory
```
```
{
```
```
public ProductCategory(int productCategoryID, string name) =>
```
```
(this.ProductCategoryID, this.Name) = (productCategoryID, name);
```
```
[Key]
```
```
[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
```
```csharp
public int ProductCategoryID { get; private set; }
```
```
[MaxLength(50)]
```
```
[Required]
```
```csharp
public string Name { get; private set; }
```

}

This book defines all table mapping as mutable, since it is easier to update the entities and save back to database.

### Relationships

In SQL database, tables can have foreign key relationships, including one-to-one, one-to-many, and many-to-many relationships.

### One-to-one

The following Person.Person table and HumanResources.Employee table has a one-to-one relationship:

HumanResources.Employee table’s BusinessEntityID column is a foreign key that refers to Person.Person table’s primary key. Their definition can be virtually viewed as:

CREATE TABLE \[Person\].\[Person\](
```
[BusinessEntityID] int NOT NULL
```
```
CONSTRAINT [PK_Person_BusinessEntityID] PRIMARY KEY CLUSTERED,
```
```
[FirstName] [dbo].[Name] NOT NULL,
```
```
[LastName] [dbo].[Name] NOT NULL
```
```
/* Other columns. */);
```
```
GO
```
```
CREATE TABLE [HumanResources].[Employee](
```
```
[BusinessEntityID] int NOT NULL
```
```
CONSTRAINT [PK_Employee_BusinessEntityID] PRIMARY KEY CLUSTERED
```
```
CONSTRAINT [FK_Employee_Person_BusinessEntityID] FOREIGN KEY
```
```
REFERENCES [Person].[Person] ([BusinessEntityID]),
```
```
[JobTitle] nvarchar(50) NOT NULL,
```
```
[HireDate] date NOT NULL
```
```
/* Other columns. */);
```

GO

So each row in HumanResources.Employee table refers to one row in Person.Person table (an employee must be a person). On the other hand, each row in Person.Person table can be referred by 0 or 1 row in HumanResources.Employee table (a person can be an employee, or not). This relationship can be represented by navigation property of entity type:

public partial class AdventureWorks
```
{
```
```
public const string Person = nameof(Person);
```
```
public const string HumanResources = nameof(HumanResources);
```
```
public DbSet<Person> People { get; set; }
```
```
public DbSet<Employee> Employees { get; set; }
```
```
}
```
```
[Table(nameof(Person), Schema = AdventureWorks.Person)]
```
```
public partial class Person
```
```
{
```
```
[Key]
```
```
public int BusinessEntityID { get; set; }
```
```
[Required]
```
```
[MaxLength(50)]
```
```
public string FirstName { get; set; }
```
```
[Required]
```
```
[MaxLength(50)]
```
```
public string LastName { get; set; }
```
```
public virtual Employee Employee { get; set; } // Reference navigation property.
```
```
}
```
```
[Table(nameof(Employee), Schema = AdventureWorks.HumanResources)]
```
```
public partial class Employee
```
```
{
```
```
[Key]
```
```
[ForeignKey(nameof(Person))]
```
```
public int BusinessEntityID { get; set; }
```
```
[Required]
```
```
[MaxLength(50)]
```
```
public string JobTitle { get; set; }
```
```
public DateTime HireDate { get; set; }
```
```
public virtual Person Person { get; set; } // Reference navigation property.
```

}

The \[ForeignKey\] attribute indicates Employee entity’s BusinessEntityID property is the foreign key for the relationship represented by navigation property. Here Person is called the primary entity, and Employee is called the dependent entity. Their navigation properties are called reference navigation properties, because each navigation property can refer to a single entity. The navigation property is designed to be virtual to enable proxy entity to implement lazy loading. Proxy entity and lazy loading is discussed in the query translation and data loading chapter.

### One-to-many

The Production.ProductCategory and Production.ProductSubcategory tables have a one-to-many relationship, so are Production.ProductSubcategory and Production.Product:

Each row in Production.ProductCategory table can refer to many rows in Production.ProductSubcategory table (category can have many subcategories), and each row in Production.ProductSubcategory table can refer to many rows in Production.Product table (subcategory can have many products). Their definitions can be virtually viewed as:

CREATE TABLE \[Production\].\[ProductSubcategory\](
```
[ProductSubcategoryID] int IDENTITY(1,1) NOT NULL
```
```
CONSTRAINT [PK_ProductSubcategory_ProductSubcategoryID] PRIMARY KEY CLUSTERED,
```
```
[Name] [dbo].[Name] NOT NULL, -- nvarchar(50).
```
```
[ProductCategoryID] int NOT NULL
```
```
CONSTRAINT [FK_ProductSubcategory_ProductCategory_ProductCategoryID] FOREIGN KEY
```
```
REFERENCES [Production].[ProductCategory] ([ProductCategoryID]),
```
```
/* Other columns. */)
```
```
GO
```
```
CREATE TABLE [Production].[Product](
```
```
[ProductID] int IDENTITY(1,1) NOT NULL
```
```
CONSTRAINT [PK_Product_ProductID] PRIMARY KEY CLUSTERED,
```
```
[Name] [dbo].[Name] NOT NULL, -- nvarchar(50).
```
```
[ListPrice] money NOT NULL,
```
```
[ProductSubcategoryID] int NULL
```
```
CONSTRAINT [FK_Product_ProductSubcategory_ProductSubcategoryID] FOREIGN KEY
```
```
REFERENCES [Production].[ProductSubcategory] ([ProductSubcategoryID])
```
```
/* Other columns. */)
```

GO

These one-to-many relationships can be represented by navigation property of type ICollection<T>:

public partial class ProductCategory
```
{
```
```
public virtual ICollection<ProductSubcategory> ProductSubcategories { get; set; } // Collection navigation property.
```
```
}
```
```
[Table(nameof(ProductSubcategory), Schema = AdventureWorks.Production)]
```
```
public partial class ProductSubcategory
```
```
{
```
```
[Key]
```
```
[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
```
```
public int ProductSubcategoryID { get; set; }
```
```
[MaxLength(50)]
```
```
[Required]
```
```
public string Name { get; set; }
```
```
public int ProductCategoryID { get; set; }
```
```
public virtual ProductCategory ProductCategory { get; set; } // Reference navigation property.
```
```
public virtual ICollection<Product> Products { get; set; } // Collection navigation property.
```
```
}
```
```
[Table(nameof(Product), Schema = AdventureWorks.Production)]
```
```
public partial class Product
```
```
{
```
```
[Key]
```
```
[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
```
```
public int ProductID { get; set; }
```
```
[MaxLength(50)]
```
```
[Required]
```
```
public string Name { get; set; }
```
```
public decimal ListPrice { get; set; }
```
```
public int? ProductSubcategoryID { get; set; }
```
```
public virtual ProductSubcategory ProductSubcategory { get; set; } // Reference navigation property.
```

}

Notice Production.Product table’s ProductSubcategoryID column is nullable, so it is mapped to a int? property. Here \[ForeignKey\] attribute is omitted, because each dependent entity’ foreign key is separated from its primary key, so the foreign key can be automatically discovered by EF Core.

### Many-to-many

Production.Product and Production.ProductPhoto tables has many-to-many relationship.

This is implemented by 2 one-to-many relationships with another Production.ProductProductPhoto junction table. These tables’ definitions can be virtually viewed as:

CREATE TABLE \[Production\].\[ProductPhoto\](
```
[ProductPhotoID] int IDENTITY(1,1) NOT NULL
```
```
CONSTRAINT [PK_ProductPhoto_ProductPhotoID] PRIMARY KEY CLUSTERED,
```
```
[LargePhotoFileName] nvarchar(50) NULL,
```
```
[ModifiedDate] datetime NOT NULL
```
```
CONSTRAINT [DF_ProductPhoto_ModifiedDate] DEFAULT (GETDATE())
```
```
/* Other columns. */)
```
```
GO
```
```
CREATE TABLE [Production].[ProductProductPhoto](
```
```
[ProductID] int NOT NULL
```
```
CONSTRAINT [FK_ProductProductPhoto_Product_ProductID] FOREIGN KEY
```
```
REFERENCES [Production].[Product] ([ProductID]),
```
```
[ProductPhotoID] int NOT NULL
```
```
CONSTRAINT [FK_ProductProductPhoto_ProductPhoto_ProductPhotoID] FOREIGN KEY
```
```
REFERENCES [Production].[ProductPhoto] ([ProductPhotoID]),
```
```
CONSTRAINT [PK_ProductProductPhoto_ProductID_ProductPhotoID] PRIMARY KEY NONCLUSTERED ([ProductID], [ProductPhotoID])
```
```
/* Other columns. */)
```

GO

So the many-to-many relationship can be mapped to 2 one-to-many relationships with the junction:

public partial class Product
```
{
```
```
public virtual ICollection<ProductProductPhoto> ProductProductPhotos { get; set; } // Collection navigation property.
```
```
}
```
```
[Table(nameof(ProductPhoto), Schema = AdventureWorks.Production)]
```
```
public partial class ProductPhoto
```
```
{
```
```
[Key]
```
```
[DatabaseGenerated(DatabaseGeneratedOption.Identity)]
```
```
public int ProductPhotoID { get; set; }
```
```
[MaxLength(50)]
```
```
public string LargePhotoFileName { get; set; }
```
```
[ConcurrencyCheck]
```
```
public DateTime ModifiedDate { get; set; }
```
```
public virtual ICollection<ProductProductPhoto> ProductProductPhotos { get; set; } // Collection navigation property.
```
```
}
```
```
[Table(nameof(ProductProductPhoto), Schema = AdventureWorks.Production)]
```
```
public partial class ProductProductPhoto
```
```
{
```
```
[Key]
```
```
[Column(Order = 0)]
```
```
public int ProductID { get; set; }
```
```
[Key]
```
```
[Column(Order = 1)]
```
```
public int ProductPhotoID { get; set; }
```
```
public virtual Product Product { get; set; } // Reference navigation property.
```
```
public virtual ProductPhoto ProductPhoto { get; set; } // Reference navigation property.
```

}

ProductPhoto.ModifiedDate has a \[ConcurrencyCheck\] attribute for concurrency conflict check, which is discussed in the data manipulation chapter. Production.ProductProductPhoto table has a composite primary key. As a junction table, each row in the table has a unique combination of ProductID and ProductPhotoID. EF Core requires additional initialization for composite primary key, which should be executed in DbContext’s OnModelCreating method:

public partial class AdventureWorks
```
{
```
```csharp
private static void MapCompositePrimaryKey(ModelBuilder modelBuilder) // Called by OnModelCreating.
```
```
{
```
```
modelBuilder.Entity<ProductProductPhoto>()
```
```
.HasKey(productProductPhoto => new
```
```
{
```
```
ProductID = productProductPhoto.ProductID,
```
```
ProductPhotoID = productProductPhoto.ProductPhotoID
```
```
});
```
```
}
```

}

EF Core also requires additional initialization for many-to-many relationship represented by 2 one-to-many relationships, which should be executed in OnModelCreating as well:

public partial class AdventureWorks
```
{
```
```csharp
private static void MapManyToMany(ModelBuilder modelBuilder) // Called by OnModelCreating.
```
```
{
```
```
modelBuilder.Entity<ProductProductPhoto>()
```
```
.HasOne(productProductPhoto => productProductPhoto.Product)
```
```
.WithMany(product => product.ProductProductPhotos)
```
```
.HasForeignKey(productProductPhoto => productProductPhoto.ProductID);
```
```
modelBuilder.Entity<ProductProductPhoto>()
```
```
.HasOne(productProductPhoto => productProductPhoto.ProductPhoto)
```
```
.WithMany(photo => photo.ProductProductPhotos)
```
```
.HasForeignKey(productProductPhoto => productProductPhoto.ProductPhotoID);
```
```
}
```

}

Finally, all the above tables can be exposed as properties of AdventureWorks:

public partial class AdventureWorks
```
{
```
```
public DbSet<Person> People { get; set; }
```
```
public DbSet<Employee> Employees { get; set; }
```
```
public DbSet<ProductSubcategory>ProductSubcategories { get; set; }
```
```
public DbSet<Product> Products { get; set; }
```
```
public DbSet<ProductPhoto> ProductPhotos { get; set; }
```

}

### Inheritance

EF Core supports table per hierarchy (TPH) inheritance for entity types. With TPH, one table is mapped to many entity types in the inheritance hierarchy, so a discriminator column is needed to identify each specific row’s mapping entity. Take the Production.TransactionHistory table as example, its definition can be virtually viewed as:

CREATE TABLE \[Production\].\[TransactionHistory\](
```
[TransactionID] int IDENTITY(100000,1) NOT NULL
```
```
CONSTRAINT [PK_TransactionHistory_TransactionID] PRIMARY KEY CLUSTERED,
```
```
[ProductID] int NOT NULL
```
```
CONSTRAINT [FK_TransactionHistory_Product_ProductID] FOREIGN KEY
```
```
REFERENCES [Production].[Product] ([ProductID]),
```
```
[TransactionDate] datetime NOT NULL,
```
```
[TransactionType] nchar(1) NOT NULL
```
```
CONSTRAINT [CK_Product_Style]
```
```
CHECK (UPPER([TransactionType]) = N'P' OR UPPER([TransactionType]) = N'S' OR UPPER([TransactionType]) = N'W'),
```
```
[Quantity] int NOT NULL,
```
```
[ActualCost] money NOT NULL
```
```
/* Other columns. */);
```

GO

Its TransactionType column allows value “P”, “S”, or “W” to indicate each row representing a purchase transaction, sales transaction, or work transaction. So the mapping entities’ hierarchy can be:

\[Table(nameof(TransactionHistory), Schema = AdventureWorks.Production)\]
```
public abstract class TransactionHistory
```
```
{
```
```
[Key]
```
```
public int TransactionID { get; set; }
```
```
public int ProductID { get; set; }
```
```
public DateTime TransactionDate { get; set; }
```
```
public int Quantity { get; set; }
```
```
public decimal ActualCost { get; set; }
```
```
}
```

```csharp
public class PurchaseTransactionHistory : TransactionHistory { }
```

```csharp
public class SalesTransactionHistory : TransactionHistory { }
```

public class WorkTransactionHistory : TransactionHistory { }

Then the discriminator must be specified when OnModelCreating is executed:

public enum TransactionType { P, S, W }
```
public partial class AdventureWorks
```
```
{
```
```csharp
private static void MapDiscriminator(ModelBuilder modelBuilder) // Called by OnModelCreating.
```
```
{
```
```
modelBuilder.Entity<TransactionHistory>()
```
```
.HasDiscriminator<string>(nameof(TransactionType))
```
```
.HasValue<PurchaseTransactionHistory>(nameof(TransactionType.P))
```
```
.HasValue<SalesTransactionHistory>(nameof(TransactionType.S))
```
```
.HasValue<WorkTransactionHistory>(nameof(TransactionType.W));
```
```
}
```

}

Now these entities can all be exposed as data sources:

public partial class AdventureWorks
```
{
```
```
public DbSet<TransactionHistory>Transactions { get; set; }
```
```
public DbSet<PurchaseTransactionHistory> PurchaseTransactions { get; set; }
```
```
public DbSet<SalesTransactionHistory>SalesTransactions { get; set; }
```
```
public DbSet<WorkTransactionHistory>WorkTransactions { get; set; }
```

}

### Views

A view can also be mapped as if it is a table, if the view has one or more columns which can be virtually viewed as primary key. Take the Production.vEmployee view as example, its definition can be virtually viewed as:

CREATE VIEW \[HumanResources\].\[vEmployee\]
```
AS
```
```
SELECT
```
```
e.[BusinessEntityID],
```
```
p.[FirstName],
```
```
p.[LastName],
```
```
e.[JobTitle]
```
```
-- Other columns.
```
```sql
FROM [HumanResources].[Employee] e
```
```
INNER JOIN [Person].[Person] p
```
```
ON p.[BusinessEntityID] = e.[BusinessEntityID]
```
```
/* Other tables. */;
```

GO

The BusinessEntityID is unique and can be the virtual primary key. So it can be mapped as the following entity:

\[Table(nameof(vEmployee), Schema = AdventureWorks.HumanResources)\]

```csharp
public class vEmployee
```
```
{
```
```
[Key]
```
```
public int BusinessEntityID { get; set; }
```
```
public string FirstName { get; set; }
```
```
public string LastName { get; set; }
```
```
public string JobTitle { get; set; }
```

}

And then expose as data source:

public partial class AdventureWorks
```
{
```
```
public DbSet<vEmployee> vEmployees { get; set; }
```

}

## Summary

Text: