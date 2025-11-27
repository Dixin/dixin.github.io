---
title: "Functional Programming and LINQ Paradigm (3) LINQ to Data Sources"
published: 2019-05-30
description: "As fore mentioned, LINQ is a functional programming model, consists of syntax in languages and APIs in libraries:"
image: ""
tags: [".NET", "C#", "Introducing LINQ", "LINQ"]
category: "LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

As fore mentioned, LINQ is a functional programming model, consists of syntax in languages and APIs in libraries:

[![clip_image002[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Introducing-LINQ-3-Infrastructure_F6C4/clip_image002[4]_thumb.gif "clip_image002[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Introducing-LINQ-3-Infrastructure_F6C4/clip_image002[4].gif)

For a certain language, like C#, there is only 1 set of LINQ query syntax working with many LINQ API sets, and each API set works with a specific data domain. Here are examples of these API sets:

· In .NET Standard, Microsoft provides:

o LINQ to Objects: a set of LINQ APIs for .NET objects in memory

o Parallel LINQ: another set of LINQ APIs also for .NET objects in memory, with parallel query capability

o LINQ to XML: a set of LINQ APIs for XML data objects in memory

· Microsoft also provides other libraries based on .NET Standard:

o LINQ to Entities: a set of LINQ APIs in Entity Framework Core (EF Core) library for databases, including Microsoft SQL Server, Microsoft Azure SQL Database (aka SQL Azure), as well as SQLite, Oracle, MySQL, PostgreSQL, etc.

o LINQ to NoSQL: a set of LINQ APIs for Azure CosmosDB, the Microsoft NoSQL database service. For convenience these APIs are called LINQ to NoSQL in this book.

· In .NET Framework for Windows, Microsoft provides:

o LINQ to DataSets: a set of LINQ APIs for data cached in data sets

o LINQ to SQL: a set of LINQ APIs for relational data in Microsoft SQL Server

· There are also third-party LINQ libraries, for example:

o LINQ to JSON, s set of LINQ APIs for JSON data in memory

o LINQ to Twitter, a set of LINQ APIs for Twitter data in Twitter’s services.

<table border="1" cellpadding="0" cellspacing="0" class="MsoNormalTable" style="border: currentcolor; border-image: none; border-collapse: collapse; mso-padding-alt: 0in 0in 0in 0in; mso-border-alt: solid windowtext .5pt; mso-yfti-tbllook: 1184;"><tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;"><td style="border-width: 1pt medium medium 1pt; border-style: solid none none solid; border-color: windowtext currentcolor currentcolor windowtext; padding: 0in; mso-border-top-alt: solid windowtext .5pt; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ APIs</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt medium medium; border-style: solid none none; border-color: windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-top-alt: solid windowtext .5pt;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">.NET <span lang="EN-IN" style="mso-ansi-language: en-in;">Standard: NuGet</span> package</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt medium medium; border-style: solid none none; border-color: windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-top-alt: solid windowtext .5pt;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">.NET <span lang="EN-IN" style="mso-ansi-language: en-in;">Framework: NuGet</span> package<span lang="EN-IN" style="mso-ansi-language: en-in;"> or .dll assembly</span></p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt medium medium; border-style: solid solid none none; border-color: windowtext windowtext currentcolor currentcolor; padding: 0in; mso-border-top-alt: solid windowtext .5pt; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Namespace</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 1;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to Objects</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">NETStandard.Library</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Core.dll</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Linq</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 2;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0.1in; line-height: 17pt; mso-add-space: auto;"><span lang="EN-IN" style="mso-ansi-language: en-in;">LINQ to Objects Interactive Extension (Ix)</span></p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 8pt 0.1in; line-height: 17pt; mso-add-space: auto;"><span lang="EN-IN" style="mso-ansi-language: en-in;">System.Interactive</span></p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 8pt 0.1in; line-height: 17pt; mso-add-space: auto;"><span lang="EN-IN" style="mso-ansi-language: en-in;">System.Interactive</span></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 8pt 0.1in; line-height: 17pt; mso-add-space: auto;"><span lang="EN-IN" style="mso-ansi-language: en-in;">System.Linq</span></p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 3;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">Parallel LINQ</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">NETStandard.Library</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Core.dll</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Linq</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 4;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to XML</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">NETStandard.Library</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Xml.Linq.dll</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Xml.Linq</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 5;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to Entities</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Microsoft.EntityFrameworkCore</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Microsoft.EntityFrameworkCore</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Microsoft.EntityFrameworkCore</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 6;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to NoSQL</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Microsoft.Azure.DocumentDB<span lang="EN-IN" style="mso-ansi-language: en-in;">.Core</span></p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Microsoft.Azure.DocumentDB</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Microsoft.Azure.Documents.Client</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 7;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to SQL</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Not available</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;"><span lang="EN-IN" style="mso-ansi-language: en-in;">System.Data.Linq.dll</span></p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Data.Linq</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 8;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to DataSets</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Not available</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">System.Data.DataSetExtensions.dll</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Data</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 9;"><td style="border-width: medium medium medium 1pt; border-style: none none none solid; border-color: currentcolor currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-left-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to JSON</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Newtonsoft.Json</p><font style="font-size: 12pt;"></font></td><td style="padding: 0in; border: currentcolor; border-image: none;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">Newtonsoft.Json</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt medium medium; border-style: none solid none none; border-color: currentcolor windowtext currentcolor currentcolor; padding: 0in; border-image: none; mso-border-right-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">Newtonsoft.Json.Linq</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 10; mso-yfti-lastrow: yes;"><td style="border-width: medium medium 1pt 1pt; border-style: none none solid solid; border-color: currentcolor currentcolor windowtext windowtext; padding: 0in; mso-border-left-alt: solid windowtext .5pt; mso-border-bottom-alt: solid windowtext .5pt;" valign="top" width="64"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">LINQ to Twitter</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium medium 1pt; border-style: none none solid; border-color: currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-bottom-alt: solid windowtext .5pt;" valign="top" width="210"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">linqtotwitter</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium medium 1pt; border-style: none none solid; border-color: currentcolor currentcolor windowtext; padding: 0in; border-image: none; mso-border-bottom-alt: solid windowtext .5pt;" valign="top" width="216"><font style="font-size: 12pt;"></font><p class="TableTextCxSpMiddle" style="margin: 0in 0in 0pt; line-height: 17pt;">linqtotwitter</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor windowtext windowtext currentcolor; padding: 0in; mso-border-right-alt: solid windowtext .5pt; mso-border-bottom-alt: solid windowtext .5pt;" valign="top" width="74"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">LinqToTwitter</p><font style="font-size: 12pt;"></font></td></tr></tbody></table>

### One language for different data domains

C# developer can use a single LINQ language syntax to work with different data. At compile time, the LINQ syntax can be compiled to different API calls according to different contexts. At runtime, these specific API calls work with specific data domains. To use LINQ to work with data, there are usually 3 steps:

1. Get the data source for LINQ query

2. Define the LINQ query

3. Execute the LINQ query

### LINQ to Objects

LINQ to Objects queries .NET objects in memory. The following example queries positive integers from the integer array in memory, and get the integers’ square roots in ascending order:

internal static void LinqToObjectsWithQueryExpression()

```csharp
{
```
```csharp
IEnumerable<int> source = new int[] { 4, 3, 2, 1, 0, -1 }; // Get source.
```
```csharp
IEnumerable<double> query =
```
```csharp
from int32 in source
```
```csharp
where int32> 0
```
```csharp
orderby int32
```
```csharp
select Math.Sqrt(int32); // Define query.
```
```csharp
foreach (double result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```

}

Here the data source is a sequence of integers in memory. The query is built declaratively in native C# language keywords (where, orderby, select, etc.), which is called query expression:

· The from clause specifies data source

· The where clause filters the data source and keeps the integers greater than 0,

· The orderby clause sort the filtered integers in ascending order

· The select clause maps the sorted integers to their square roots.

Building the query does not execute it. Later, when pulling the results from the query with a foreach loop, the query is executed.

Besides above query expression syntax. There is another query method call syntax to build LINQ query:

internal static void LinqToObjectsWithQueryMethods()

```csharp
{
```
```csharp
IEnumerable<int>source = new int[] { 4, 3, 2, 1, 0, -1 }; // Get source.
```
```csharp
IEnumerable<double> query = source
```
```csharp
.Where(int32 => int32 > 0)
```
```csharp
.OrderBy(int32 => int32)
```
```csharp
.Select(int32 => Math.Sqrt(int32)); // Define query.
```
```csharp
foreach (double result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```

}

These 2 versions of query are identical. The query expression is compiled to query method calls, which is discussed in detail in the Functional Programming and LINQ to Objects chapters.

### Parallel LINQ

The above LINQ to Object query executes sequentially. The filter-sort-map computation are executed for all integers with a single thread, and the query results are produced one by one in a deterministic order. Parallel LINQ (to Objects) is the parallel version of the LINQ to Objects APIs. It also works with objects in memory but can execute the query in parallel with multiple threads, in order to utilize multiple processor cores and improve the LINQ query performance. The following are the parallel version of the above queries:

internal static void ParallelLinq()

```csharp
{
```
```csharp
int[] values = { 4, 3, 2, 1, 0, -1 };
```
```csharp
ParallelQuery<int>source = values.AsParallel(); // Get source.
```
```csharp
ParallelQuery<double> query =
```
```csharp
from int32 in source
```
```csharp
where int32 > 0
```
```csharp
orderby int32
```
```csharp
select Math.Sqrt(int32); // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// ParallelQuery<double> query = source
```
```csharp
// .Where(int32 => int32 > 0)
```
```csharp
// .OrderBy(int32 => int32)
```
```csharp
// .Select(int32 => Math.Sqrt(int32));
```
```csharp
query.ForAll(result => Trace.WriteLine(result)); // Execute query.
```

}

The query creation syntax is exactly the same as sequential LINQ to Objects. The query execution syntax is different. In the previous LINQ to Objects query execution, a foreach loop is used to pull the results one by one sequentially. Here Parallel LINQ provides a special ForAll method to execute the pulling in parallel. Since the results are computed in parallel, the query results can be produced in nondeterministic order.

### LINQ to XML

LINQ to XML queries XML data. The ASP.NET blog RSS feed https://weblogs.asp.net/dixin/rss is XML and can be the source:

<?xml version\="1.0" encoding\="utf-8"?>

```csharp
<rss version="2.0">
```
```csharp
<channel>
```
```csharp
<title>Dixin's Blog</title>
```
```csharp
<link>https://weblogs.asp.net:443/dixin/</link>
```
```csharp
<description>https://weblogs.asp.net:443/dixin/</description>
```
```csharp
<item>
```
```csharp
<title>EntityFramework.Functions: Code First Functions for Entity Framework</title>
```
```csharp
<link>https://weblogs.asp.net/dixin/entityframework.functions</link>
```
```csharp
<description><!-- Description. --></description>
```
```csharp
<pubDate>Mon Dec 17, 2015 06:27:56 GMT</pubDate>
```
```csharp
<guid isPermaLink="true">https://weblogs.asp.net/dixin/entityframework.functions</guid>
```
```csharp
<category>.NET</category>
```
```csharp
<category>LINQ</category>
```
```csharp
<category>Entity Framework</category>
```
```csharp
<category>LINQ to Entities</category>
```
```csharp
<category>Code First</category>
```
```csharp
</item>
```
```csharp
<!-- More items. -->
```
```csharp
</channel>
```

</rss\>

The following example queries the items with permalink from the feed and get the items’ titles in ascending order of the items’ publish dates:

internal static void LinqToXml()

```csharp
{
```
```csharp
XDocument feed = XDocument.Load("https://weblogs.asp.net/dixin/rss");
```
```csharp
IEnumerable<XElement>source = feed.Descendants("item"); // Get source.
```
```csharp
IEnumerable<string> query =
```
```csharp
from item in source
```
```csharp
where (bool)item.Element("guid").Attribute("isPermaLink")
```
```csharp
orderby (DateTime)item.Element("pubDate")
```
```csharp
select (string)item.Element("title"); // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// IEnumerable<string> query = source
```
```csharp
// .Where(item => (bool)item.Element("guid").Attribute("isPermaLink"))
```
```csharp
// .OrderBy(item => (DateTime)item.Element("pubDate"))
```
```csharp
// .Select(item => (string)item.Element("title"));
```
```csharp
foreach (string result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```

}

In this example, the data source is XML data loaded in memory. It queries all <item> elements in the XML document, filter them and only keep the <item> elements with child< guid> elements, whose isPermaLink attributes have the value true, then sort the <item> element by the time represented by the child< pubDate> elements in descending order; then get <item> elements’ child <title> elements’ values. Again, later when pulling the results from the query with a foreach loop, the query is executed.

### LINQ to DataSets

.NET Framework provides System.Data.DataSet type to cache tabular data from relational database. When working with relational database, this book uses Microsoft SQL database and Microsoft AdventureWorks sample database. In the following example, data is read from the AdventureWorks database’s Production.Product table, and cached in a DataSet instance. The following example queries the products in the specified subcategory, and get the products’ names, in ascending order of products’ list prices.

internal static void LinqToDataSets(string connectionString)

```csharp
{
```
```csharp
using (DataSet dataSet = new DataSet())
```
```csharp
using (DataAdapter dataAdapter = new SqlDataAdapter(
```
```sql
@"SELECT [Name], [ListPrice], [ProductSubcategoryID] FROM [Production].[Product]", connectionString))
```
```csharp
{
```
```csharp
dataAdapter.Fill(dataSet);
```
```csharp
EnumerableRowCollection<DataRow> source = dataSet.Tables[0].AsEnumerable(); // Get source.
```
```csharp
EnumerableRowCollection<string> query =
```
```csharp
from product in source
```
```csharp
where product.Field<int>("ProductSubcategoryID") == 1
```
```csharp
orderby product.Field<decimal>("ListPrice")
```
```csharp
select product.Field<string>("Name"); // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// EnumerableRowCollection<string> query = source
```
```csharp
// .Where(product => product.Field<int>("ProductSubcategoryID") == 1)
```
```csharp
// .OrderBy(product => product.Field<decimal>("ListPrice"))
```
```csharp
// .Select(product => product.Field<string>("Name"));
```
```csharp
foreach (string result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```
```csharp
}
```

}

Here the query is created to filter the products in the DataSet object, and only keeps the products under the specified subcategory, then sort the products by their list price fields, then get the products’ name fields. Later, when pulling the results from the query with a foreach loop, the query is executed.

### LINQ to Entities

Microsoft Entity Framework Core provides LINQ to Entities to enable LINQ queries directly working with data in database. The AdventureWorks sample database includes the following 3 related tables:

[](file:///D:/Temp/User/WindowsLiveWriter-1359268108/supfiles8825BF9/image_thumb312.png)[![clip_image004[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Introducing-LINQ-3-Infrastructure_F6C4/clip_image004[4]_thumb.gif "clip_image004[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Introducing-LINQ-3-Infrastructure_F6C4/clip_image004[4].gif)

The following example queries Production.Product table for the products under the specified category, and get the products’ names in the order of their list prices:

internal static void LinqToEntities()

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
IQueryable<Product>source = adventureWorks.Products; // Get source.
```
```csharp
IQueryable<string> query =
```
```csharp
from product in source
```
```csharp
where product.ProductSubcategory.ProductCategory.Name == "Bikes"
```
```csharp
orderby product.ListPrice
```
```csharp
select product.Name; // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// IQueryable<string> query = source
```
```csharp
// .Where(product => product.ProductSubcategory.ProductCategory.Name == "Bikes")
```
```csharp
// .OrderBy(product => product.ListPrice)
```
```csharp
// .Select(product => product.Name);
```
```csharp
foreach (string result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```
```csharp
}
```

}

Here the data source is the relational data stored in the remote database table, not local .NET objects in memory. The above AdventureWorks type is the LINQ to Entities data context and represents the database, and its Products property represents the table. The query is created to filter the products in the table, and only keeps the products under the specified category, then sort the products by their list prices, and get the products’ names. Later, when pulling the results from the query with a foreach loop, the query is executed to read from the database.

### LINQ to SQL

LINQ to SQL is a lightweight database access technology provided by .NET Framework. As the name suggests, LINQ to SQL only works with Microsoft SQL Server. Its APIs are similar to LINQ to Entities APIs. So, if the above queries are implemented by LINQ to SQL, the code can have the same looking:

#if NETFX

```csharp
internal static void LinqToSql()
```
```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
IQueryable<Product>source = adventureWorks.Products; // Get source.
```
```csharp
IQueryable<string> query =
```
```csharp
from product in source
```
```csharp
where product.ProductSubcategory.ProductCategory.Name == "Bikes"
```
```csharp
orderby product.ListPrice
```
```csharp
select product.Name; // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// IQueryable<string> query = source
```
```csharp
// .Where(product => product.ProductSubcategory.ProductCategory.Name == "Bikes")
```
```csharp
// .OrderBy(product => product.ListPrice)
```
```csharp
// .Select(product => product.Name);
```
```csharp
foreach (string result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

#endif

Here the AdventureWorks type is a LINQ to SQL data context, which is different from the LINQ to Entities data context. So, the pulling execution on the query triggers LINQ to SQL API calls, which read data from the database.

### LINQ to NoSQL

Microsoft provides LINQ APIs in client library to work with its non-relational database (aka NoSQL database) service, CosmosDB. To setup a data source for LINQ, create a free account, then follow the Microsoft documents to import some JSON documents representing some stores with addresses:

\[

```csharp
{
```
```csharp
"id": "1424",
```
```csharp
"Name": "Closeout Boutique",
```
```csharp
"Address": {
```
```csharp
"AddressType": "Main Office",
```
```csharp
"AddressLine1": "1050 Oak Street",
```
```csharp
"Location": {
```
```csharp
"City": "Seattle",
```
```csharp
"StateProvinceName": "Washington"
```
```csharp
},
```
```csharp
"PostalCode": "98104",
```
```csharp
"CountryRegionName": "United States"
```
```csharp
}
```
```csharp
},
```
```csharp
// More documents.
```

\]

Here the source is the database’s Store collection. The following example queries the stores in the specified city, and get their names in the alphabetic order:

internal static void LinqToNoSql(string key)

```csharp
{
```
```csharp
using (DocumentClient client = new DocumentClient(
```
```csharp
new Uri("https://dixin.documents.azure.com:443/"), key))
```
```csharp
{
```
```csharp
IOrderedQueryable<Store>source = client.CreateDocumentQuery<Store>(
```
```csharp
UriFactory.CreateDocumentCollectionUri("dixin", "Store")); // Get source.
```
```csharp
IQueryable<string> query = from store in source
```
```csharp
where store.Address.Location.City == "Seattle"
```
```csharp
orderby store.Name
```
```csharp
select store.Name; // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// IQueryable<string> query = source
```
```csharp
// .Where(store => store.Address.CountryRegionName == "United States")
```
```csharp
// .OrderBy(store => store.Address.PostalCode)
```
```csharp
// .Select(store => store.Name);
```
```csharp
foreach (string result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```
```csharp
}
```

}

The query is created to filter the products in the collection, and only keeps the stores in the specified city, then sort the stores by their names, then get the stores’ names.

### LINQ to JSON

LINQ to JSON is a third party set of APIs enabling LINQ for JSON data. Tumblr provides APIs returning JSON data, which can be a data source:

{

```csharp
"meta": {
```
```csharp
"status": 200,
```
```csharp
"msg": "OK"
```
```csharp
},
```
```csharp
"response": {
```
```csharp
"posts": [
```
```csharp
{
```
```csharp
"type": "photo",
```
```csharp
"blog_name": "dixinyan",
```
```csharp
"id": 94086491678,
```
```csharp
"post_url": "http://dixinyan.tumblr.com/post/94086491678/microsoft-way-microsoft-campus-microsoft-campus",
```
```csharp
"slug": "microsoft-way-microsoft-campus-microsoft-campus",
```
```csharp
"date": "2014-08-07 19:11:43 GMT",
```
```csharp
"timestamp": 1407438703,
```
```csharp
"state": "published",
```
```csharp
"format": "html",
```
```csharp
"reblog_key": "FZQVzcFD",
```
```csharp
"tags": [ "Microsoft" ],
```
```csharp
"short_url": "https://tmblr.co/Z_W6Et1Nd-UuU",
```
```csharp
"summary": "Microsoft Way, Microsoft Campus Microsoft Campus is the informal name of Microsoft's corporate headquarters, located at One...",
```
```csharp
"recommended_source": null,
```
```csharp
"recommended_color": null,
```
```csharp
"note_count": 4,
```
```csharp
"caption": "<h2>Microsoft Way, Microsoft Campus </h2><p>Microsoft Campus is the informal name of Microsoft&rsquo;s corporate headquarters, located at One Microsoft Way in Redmond, Washington. Microsoft initially moved onto the grounds of the campus on February 26, 1986. <a href=\"http://en.wikipedia.org/wiki/Microsoft_Redmond_Campus\" target=\"_blank\">en.wikipedia.org/wiki/Microsoft_Redmond_Campus</a>\n\n<a href=\"https://www.flickr.com/dixin\" target=\"_blank\"></a></p>",
```
```csharp
"image_permalink": "http://dixinyan.tumblr.com/image/94086491678",
```
```csharp
"can_like": true,
```
```csharp
"can_reblog": true,
```
```csharp
"can_send_in_message": true,
```
```csharp
"can_reply": false,
```
```csharp
"display_avatar": true
```
```csharp
// More post info.
```
```csharp
},
```
```csharp
// More posts.
```
```csharp
],
```
```csharp
"total_posts": 20
```
```csharp
}
```

}

The following example queries the posts with specified tag, and get their summary in the order of items’ publish dates:

internal static void LinqToJson(string apiKey)

```csharp
{
```
```csharp
using (WebClient webClient = new WebClient())
```
```csharp
{
```
```csharp
string feedUri = $"https://api.tumblr.com/v2/blog/dixinyan.tumblr.com/posts/photo?api_key={apiKey}";
```
```csharp
JObject feed = JObject.Parse((webClient.DownloadString(feedUri)));
```
```csharp
IEnumerable<JToken>source = feed["response"]["posts"]; // Get source.
```
```csharp
IEnumerable<string> query =
```
```csharp
from post in source
```
```csharp
where post["tags"].Any(tag => "Microsoft".Equals((string)tag, StringComparison.OrdinalIgnoreCase))
```
```csharp
orderby (DateTime)post["date"]
```
```csharp
select (string)post["summary"]; // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// IEnumerable<string> query = source
```
```csharp
// .Where(post => post["tags"].Any(tag =>
```
```csharp
// "Microsoft".Equals((string)tag, StringComparison.OrdinalIgnoreCase)))
```
```csharp
// .OrderBy(post => (DateTime)post["date"])
```
```csharp
// .Select(post => (string)post["summary"]);
```
```csharp
foreach (string result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```
```csharp
}
```

}

It queries all posts in the JSON document, filter them and only keep the items with the specified tag, then sort the posts by their publish dates, then get the items’ titles.

### LINQ to Twitter

LINQ to Twitter is another third-party library enabling LINQ queries for Twitter data. To access Twitter as a data source, registering an app with Twitter to get the consumer key, consumer secrete, OAuth token, and OAuth token secrete. The following example queries the tweets with specified search keyword:

internal static void LinqToTwitter(

```csharp
string consumerKey, string consumerSecret, string oAuthToken, string oAuthTokenSecret)
```
```csharp
{
```
```csharp
SingleUserAuthorizer credentials = new SingleUserAuthorizer()
```
```csharp
{
```
```csharp
CredentialStore = new InMemoryCredentialStore()
```
```csharp
{
```
```csharp
ConsumerKey = consumerKey,
```
```csharp
ConsumerSecret = consumerSecret,
```
```csharp
OAuthToken = oAuthToken,
```
```csharp
OAuthTokenSecret = oAuthTokenSecret
```
```csharp
}
```
```csharp
};
```
```csharp
using (TwitterContext twitter = new TwitterContext(credentials))
```
```csharp
{
```
```csharp
IQueryable<Search>source = twitter.Search; // Get source.
```
```csharp
IQueryable<List<Status>> query =
```
```csharp
from search in source
```
```csharp
where search.Type == SearchType.Search && search.Query == "LINQ"
```
```csharp
orderby search.SearchMetaData.Count
```
```csharp
select search.Statuses; // Define query.
```
```csharp
// Equivalent to:
```
```csharp
// IQueryable<List<Status>> query = source
```
```csharp
// .Where(search => search.Type == SearchType.Search && search.Query == "LINQ")
```
```csharp
// .OrderBy(search => search.SearchMetaData.Count)
```
```csharp
// .Select(search => search.Statuses);
```
```csharp
foreach (List<Status> search in query) // Execute query.
```
```csharp
{
```
```csharp
foreach (Status status in search)
```
```csharp
{
```
```csharp
Trace.WriteLine(status.Text);
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

}

Sometimes the query result could be fun. For example, a casino in Las Vegas is named LINQ, and a Japanese idol girls’ music group is also named LinQ (Love in Qshu), etc.

### Productivity

When LINQ was first released with .NET Framework 3.5, MSDN describes it as:

LINQ is one of Microsoft’s most exciting, powerful new development technologies.

Traditionally, to work with a specific data domain, a domain specific language and a set of domain specific APIs are used. For example, the following example is equivalent to above LINQ to XML query logic, implemented in traditional programming model, which calls XML APIs to execute query expression in XPath language:

internal static void Xml()

```csharp
{
```
```csharp
XPathDocument feed = new XPathDocument("https://weblogs.asp.net/dixin/rss");
```
```csharp
XPathNavigator navigator = feed.CreateNavigator();
```
```csharp
XPathExpression selectExpression = navigator.Compile("//item[guid/@isPermaLink='true']/title/text()");
```
```csharp
XPathExpression sortExpression = navigator.Compile("../../pubDate/text()");
```
```csharp
selectExpression.AddSort(sortExpression, Comparer<DateTime>.Default);
```
```csharp
XPathNodeIterator nodes = navigator.Select(selectExpression);
```
```csharp
foreach (object node in nodes)
```
```csharp
{
```
```csharp
Trace.WriteLine(node);
```
```csharp
}
```

}

For SQL database, the traditional programming model implements the above LINQ to Entities query logic by calling ADO.NET data access APIs to execute query statement in SQL language:

internal static void Sql(string connectionString)

```csharp
{
```
```csharp
using (DbConnection connection = new SqlConnection(connectionString))
```
```csharp
using (DbCommand command = connection.CreateCommand())
```
```csharp
{
```
```csharp
command.CommandText =
```
```sql
@"SELECT [Product].[Name]
```
```sql
FROM [Production].[Product] AS [Product]
```
```csharp
LEFT OUTER JOIN [Production].[ProductSubcategory] AS [Subcategory]
```
```csharp
ON [Subcategory].[ProductSubcategoryID] = [Product].[ProductSubcategoryID]
```
```csharp
LEFT OUTER JOIN [Production].[ProductCategory] AS [Category]
```
```csharp
ON [Category].[ProductCategoryID] = [Subcategory].[ProductCategoryID]
```
```sql
WHERE [Category].[Name] = @categoryName
```
```csharp
ORDER BY [Product].[ListPrice] DESC";
```
```csharp
DbParameter parameter = command.CreateParameter();
```
```csharp
parameter.ParameterName = "@categoryName";
```
```csharp
parameter.Value = "Bikes";
```
```csharp
command.Parameters.Add(parameter);
```
```csharp
connection.Open();
```
```csharp
using (DbDataReader reader = command.ExecuteReader())
```
```csharp
{
```
```csharp
while (reader.Read())
```
```csharp
{
```
```csharp
string productName = (string)reader["Name"];
```
```csharp
Trace.WriteLine(productName);
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

}

Similarly, for Twitter data, there are network APIs to query Twitter’s REST endpoints, etc. LINQ implements a unified and consistent language syntax and programming model for many different data domains. Above examples demonstrated the same C# syntax builds filter-sort-map query flows for .NET objects, XML data, cached tabular data, SQL database, NoSQL database, JSON, Twitter data. This capability makes LINQ a powerful and productive solution for working with data.

C# is a strongly typed language. In C#, any value has a type, including any value in LINQ query. And any expression is evaluated to a type, including LINQ query expressions. Any method has a type for each parameter and a type for return value, including LINQ query methods. So, LINQ queries are checked by compiler and runtime for type safety, which is great help for productivity, unless dynamic typing is used to bypass the compiler check:

internal static void Dynamic()

```csharp
{
```
```csharp
IEnumerable<int> source = new int[] { 4, 3, 2, 1, 0, -1 }; // Get source.
```
```csharp
IEnumerable<dynamic> query =
```
```csharp
from dynamic value in source
```
```csharp
where value.ByPass.Compiler.Check > 0
```
```csharp
orderby value.ByPass().Compiler().Check()
```
```csharp
select value & new object(); // Define query.
```
```csharp
foreach (dynamic result in query) // Execute query.
```
```csharp
{
```
```csharp
Trace.WriteLine(result);
```
```csharp
}
```

}

Strong typing also enables IntelliSense for tools, which also improves the productivity:

[![clip_image006[4]](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Introducing-LINQ-3-Infrastructure_F6C4/clip_image006[4]_thumb.gif "clip_image006[4]")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Introducing-LINQ-3-Infrastructure_F6C4/clip_image006[4].gif)

LINQ also supports deferred execution. Usually, LINQ query is executed only when the results are pulled from the query. This enables creating query with arbitrary complexity. In above examples, during the composition of filter-sort-map, no execution is triggered. Later, when the results are pulled, the entire filter-sort-map query executes is triggered. This is also important for productivity. Take above LINQ to Entities query as example, when the query is executed against the SQL database, the entire filter-sort-map query logic is submitted to database as a single database query.

LINQ is not only about data query. Many LINQ libraries provide rich APIs to manipulate and change the data, like LINQ to XML, LINQ to SQL, and EF Core, and LINQ to NoSQL, etc. Parallel LINQ is a special set of LINQ APIs, it can significantly improve the query performance for .NET objects, it also provides a simple programming model for general parallel computing.

### Local query vs. remote query

Generally, there are 2 kinds of LINQ technologies:

· Local query: The data source for local query is .NET objects in local memory of current .NET application or service. Apparently, (sequential) LINQ to Objects queries, and Parallel LINQ (to Objects) queries are local queries. LINQ to XML have XML data loaded to memory as specialized .NET objects representing the XML data structure, then query these objects, so LINQ to XML queries are also local queries too. Similarly, LINQ to DataSets and LINQ to JSON queries are local queries too. As demonstrated above, the local sequential LINQ data source and query is represented by System.Collections.Generics.IEnumerable<T> interface, and the local parallel LINQ data source and query is represented by System.Linq.ParallelQuery<T> type.

· Remote query: The data source for remote query is not in the local memory. For example, LINQ to Entities queries the data stored in a relational database, apparently the data source is not available as .NET objects in the memory of current .NET application or service. So, LINQ to Entities queries are remote queries. So are LINQ to SQL, LINQ to DocumentDB and LINQ to Twitter. As demonstrated above, the remote LINQ data source and query is represented by System.Linq.IQueryable<T> interface.

There are so many LINQ technologies, it is infeasible and also unnecessary to have one book for all of them. This book covers C# language's LINQ features, and the most used LINQ APIs: LINQ to Object (sequential local queries), LINQ to XML (specialized local queries), Parallel LINQ (parallel local queries), as well as EF/Core (remote queries). With the unified and consistent LINQ programming model, mastering these LINQ knowledge enables developers working any other local or remote LINQ technologies, understanding the internal implementation of these LINQ technologies also enables developer to build custom LINQ APIs to for other local or remote data scenarios.

## Summary

This chapter introduces the brief history and basic concept of .NET, C#, .NET Standard, and demonstrate how to setup tools to start coding on Windows, macOS, and Linux. It also introduces programming paradigms, and explains what is declarative/functional programming by comparing to imperative/object-oriented programming. It also explains what is LINQ, and how LINQ works with many different data domains with a unified programming model. The next chapter discusses more concepts of C# programming and give a overview of C#’s basic syntax used through this book.