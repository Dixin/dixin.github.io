---
title: "Understanding LINQ to SQL (2) IQueryable<T>"
published: 2010-03-29
description: "\\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to SQL", "LINQ via C# Series", "SQL Server"]
category: "LINQ"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

The core of LINQ to Objects is IEnumerable<T>:

-   [Query methods](/posts/understanding-linq-to-objects-3-query-methods) are designed for IEnumerable<T> as [extension methods](/posts/understanding-csharp-3-0-features-5-extension-method), like Where(), Select(), etc.;
-   Query methods are designed to be fluent, LINQ to Objects queries can be written in [declarative paradigm](/posts/understanding-linq-to-objects-1-programming-paradigm) via [method chaining](/posts/understanding-linq-to-objects-2-method-chaining);
-   Query methods are designed to be [deferred execution](/posts/understanding-linq-to-objects-6-deferred-execution) as long as [possible](/posts/understanding-linq-to-objects-7-query-methods-internals).

Since most of the .NET collections implements IEnumerable<T>, LINQ to Objects query can be applied on them.

By contrast, the core of LINQ to SQL is IQueryable<T>.

## IQueryable and IQueryable<T>

IQueryable and IQueryable<T> are used to build specific query against a specific data source, like SQL Server, etc.:

```csharp
namespace System.Linq
{
    public interface IQueryable : IEnumerable
    {
        Type ElementType { get; }

        Expression Expression { get; }

        IQueryProvider Provider { get; }
    }

    public interface IQueryable<out T> : IEnumerable<T>, IQueryable, IEnumerable
    {
    }
}
```

Check this post for the meaning of out keyword.

The ElementType property is easy to understand. Generally speaking, an IQueryable<T> is an IEnumerable<T> with an expression and query provider:

-   Expression property returns an Expression object to express the meaning of the current query;
-   Provider property returns an IQueryProvider, which is able to execute the current query on the specific data source.

The concept of expression and query provider will be covered in later posts. This post will concentrate on IQueryable<T> itself.

## IQueryable and IQueryable<T> extensions

Just like a bunch of extension methods for IEnumerable and IEnumerable<T> are defined on System.Linq.Enumerable class, the System.Linq.Queryable class contians the extension methods for IQueryable and IQueryable<T>:

<table border="0" cellpadding="2" cellspacing="0" width="620"><tbody><tr><td valign="top" width="95">Category</td><td valign="top" width="260">System.Linq.Enumerable</td><td valign="top" width="263">System.Linq.Queryable</td></tr><tr><td valign="top" width="95">Restriction</td><td valign="top" width="260">Where, <span style="text-decoration: underline;">OfType</span></td><td valign="top" width="263">Where, <span style="text-decoration: underline;">OfType</span></td></tr><tr><td valign="top" width="95">Projection</td><td valign="top" width="260">Select, SelectMany</td><td valign="top" width="263">Select, SelectMany</td></tr><tr><td valign="top" width="95">Ordering</td><td valign="top" width="260">OrderBy, ThenBy, OrderByDescending, ThenByDescending, Reverse</td><td valign="top" width="263">OrderBy, ThenBy, OrderByDescending, ThenByDescending, Reverse</td></tr><tr><td valign="top" width="95">Join</td><td valign="top" width="260">Join, GroupJoin</td><td valign="top" width="263">Join, GroupJoin</td></tr><tr><td valign="top" width="95">Grouping</td><td valign="top" width="260">GroupBy</td><td valign="top" width="263">GroupBy</td></tr><tr><td valign="top" width="95">Aggregation</td><td valign="top" width="260">Aggregate, Count, LongCount, Sum, Min, Max, Average</td><td valign="top" width="263">Aggregate, Count, LongCount, Sum, Min, Max, Average</td></tr><tr><td valign="top" width="95">Partitioning</td><td valign="top" width="260">Take, Skip, TakeWhile, SkipWhile</td><td valign="top" width="263">Take, Skip, TakeWhile, SkipWhile</td></tr><tr><td valign="top" width="95">Cancatening</td><td valign="top" width="260">Concat</td><td valign="top" width="263">Concat</td></tr><tr><td valign="top" width="95">Set</td><td valign="top" width="260">Distinct, Union, Intersect, Except, Zip</td><td valign="top" width="263">Distinct, Union, Intersect, Except, Zip</td></tr><tr><td valign="top" width="95">Conversion</td><td valign="top" width="260">ToSequence, ToArray, ToList, ToDictionary, ToLookup, <span style="text-decoration: underline;">Cast</span>, <span style="text-decoration: underline;">AsEnumerable</span></td><td valign="top" width="263"><span style="text-decoration: underline;">Cast</span>, {AsQueryable}</td></tr><tr><td valign="top" width="95">Equality</td><td valign="top" width="260">SequenceEqual</td><td valign="top" width="263">SequenceEqual</td></tr><tr><td valign="top" width="95">Elements</td><td valign="top" width="260">First, FirstOrDefault, Last, LastOrDefault, Single, SingleOrDefault, ElementAt, ElementAtOrDefault, DefaultIfEmpty</td><td valign="top" width="263">First, FirstOrDefault, Last, LastOrDefault, Single, SingleOrDefault, ElementAt, ElementAtOrDefault, DefaultIfEmpty</td></tr><tr><td valign="top" width="95">Generation</td><td valign="top" width="260">[Range], [Repeat], [Empty]</td><td valign="top" width="263"></td></tr><tr><td valign="top" width="95">Qualifiers</td><td valign="top" width="260">Any, All, Contains</td><td valign="top" width="263">Any, All, Contains</td></tr></tbody></table>

The underlined methods are extension methods for the non-generic IEnumerbale and IQueryable interfaces. Methods in \[\] are normal static methods. And the AsQueryable() methods in {} are also special, they are extension methods for IEnumerable and IEnumerable<T>.

Please notice that, since IQuerayable<T> implements IEnumerable<T>, IEnumerable<T>’s extension methods are also IQuerayable<T>’s extension methods, like ToArray(), etc.

## Table<T>

In LINQ to SQL, most of the time, the query works on (the model of) SQL data table:

```csharp
Table<Product> source = database.Products; // Products table of Northwind database.
IQueryable<string> results = source.Where(product =>
                                            product.Category.CategoryName == "Beverages")
                                   .Select(product => product.ProductName);
```

The actual type of (the model of) Products table is Table<T>:

```csharp
[Database(Name = "Northwind")]
public partial class NorthwindDataContext : DataContext
{
    public Table<Product> Products
    {
        get
        {
            return this.GetTable<Product>();
        }
    }
}
```

And, Table<T> implements IQueryable<T>:

```csharp
namespace System.Data.Linq
{
    public sealed class Table<TEntity> : IQueryable<TEntity>, IQueryable, 
                                         IEnumerable<TEntity>, IEnumerable,
                                         ITable<TEntity>, ITable,
                                         IQueryProvider, 
                                         IListSource
        where TEntity : class
    {
        // ...
    }
}
```

So all the above query methods are applicable for Table<T>.

## IEnumerable<T> extensions vs. IQueryable<T> extensions

In the above table, two kinds of Where() extension methods are applicable for IQueryable<T>:

-   Where() extension method for IQueryable<T>, defined in Queryable class;
-   Where() extension method for IEnumerable<T>, defind in Queryable class, since IQueryable<T> implements IEnumerable<T>.

They are difference from the signatures:

```csharp
namespace System.Data.Linq
{
    public static class Enumerable
    {
        // This is also Available for IQueryable<T>,
        // because IQueryable<T> implements IEnumerable<T>.
        public static IEnumerable<TSource> Where<TSource>(
            this IEnumerable<TSource> source, Func<TSource, bool> predicate)
        {
            // ...
        }
    }

    public static class Queryable
    {
        public static IQueryable<TSource> Where<TSource>(
            this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
        {
            // ...
        }
    }
}
```

Please notice that the above Where() method invocation satisfies both of the signatures:

```csharp
source.Where(product => product.Category.CategoryName == "Beverages").Select(...
```

In this invocation:

-   source argument: it is a Table<T> object, and Table<T> implements both IQueryable<T> and IEnumerable<T>;
-   predicate argument: The predicate is written as lambda expression, accorsing to [this post](/posts/understanding-csharp-3-0-features-6-lambda-expression), lambda expression (product => product.Category.CategoryName == "Beverages") can be compiled into either anonymous method (Func<Product, bool>) or expression tree (Expression<Func<Product, bool>>).

How does the compiler choose the 2 satisfied Where() methods? Because Queryable.Where()’s first parameter is an IQueryable<T> object, and second parameter is also Ok, it is considered to be a stronger match, and it is choosed by compiler.

Because Queryable.Where() returns an IQueryable<T>, then, again, Queryable.Select() is choosed by compiler instead of Enumerable.Select().

So the above qeury is equal to:

```csharp
IQueryable<Product> source = database.Products; // Products table of Northwind database.
// Queryable.Where() is choosed by compiler.
IQueryable<Product> products = source.Where(product =>
                                            product.Category.CategoryName == "Beverages");
// Queryable.Select() is choosed by compiler.
IQueryable<string> results = products.Select(product => product.ProductName);
```

By checking all the duplicated extension mrethods betwwen IEnumerable<T> and IQueryable<T>, IQueryable<T> extension methods evolve the signatures by:

-   replacing all IEnumerable<T> parameter with IQueryable<T> parameter;
-   replacing all function parameter with expression tree parameter.

The expression tree parameter will be explained in the next post.