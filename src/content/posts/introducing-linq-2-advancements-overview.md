---
title: "Introducing LINQ (2) Advancements Overview"
published: 2009-11-24
description: "\\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

According to [MSDN](http://msdn.microsoft.com/en-us/netframework/aa904594.aspx):

> LINQ is one of Microsoft’s most exciting, powerful new development technologies.

## Independent to data source

This sample mentioned in [part 1](/posts/introducing-linq-1-what-is-linq) is working on items in a .NET array:

```csharp
var results = from number in source
               where number > 0
               orderby number descending
               select number;
```

This kind of LINQ query expression can also be used on other data source, like data in SQL Server, data on the Internet, etc.

## Strong typing

It is obvious that each item in the above LINQ query is strong typed: source is an int\[\], number is an int. Even we used “var” keyword for results, it is actually an IEnumerable<int>.

Since the data is strong typed, intellisense can work in IDE:

![introducing-linq-advancements-overview-1](https://aspblogs.z22.web.core.windows.net/dixin/Media/introducinglinqadvancementsoverview1_49F804F0.png "introducing-linq-advancements-overview-1")

## Query compilation

The query expression looks like a SQL query. But they are totally different. For example, in the previous LINQ to SQL scenario, the T-SQL “SELECT” statement is not compiled, but the C# “select” query expression is compiled. Strong typing and the ability of identifying issues in compile time provides outstanding productivity.

## Deferred execution

Deferred execution is a feature of functional programming. Now it is introduced all over the LINQ. In the runtime, when this statement finished executing, we got the local variable: products.

```csharp
var results = from product in database.Products
               where product.Category.CategoryName == "Beverages"
               orderby product.ProductName
               select product.ProductName; // Defines the query.
```


Please notice at this time positive is not the query result, but the query definition itself.

When we iterate the results, which means the results need to be fetched, the query executes:

```csharp
foreach (var item in results) // Executes the query when we need the query results.
{
    Console.WriteLine(item);
}
```

## LINQ is far more than querying

Beside querying different data sources, LINQ also brings

-   functional programming constructs to C# (Check this article for [functional programming](http://www.cs.chalmers.se/~rjmh/Papers/whyfp.html));
-   a way of parallel computing (See [Parallel LINQ](http://msdn.microsoft.com/en-us/library/dd460688\(VS.100\).aspx));
-   reactive programming (See [Rx](http://msdn.microsoft.com/en-us/devlabs/ee794896.aspx));
-   …

LINQ does not only change the way of working with data, like writing , it also changes the way of thinking on problems.