---
title: "C# Functional Programming In-Depth (10) Query Expression"
published: 2018-06-10
description: "C# 3.0 introduces query expression, a SQL-like query syntactic sugar for query methods composition."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-query-expression](/posts/functional-csharp-query-expression "https://weblogs.asp.net/dixin/functional-csharp-query-expression")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

C# 3.0 introduces query expression, a SQL-like query syntactic sugar for query methods composition.

## Syntax and compilation

The following is the syntax of query expression:

```csharp
from [Type] identifier in source
[from [Type] identifier in source]
[join [Type] identifier in source on expression equals expression [into identifier]]
[let identifier = expression]
[where predicate]
[orderby ordering [ascending | descending][, ordering [ascending | descending], …]]
select expression | group expression by key [into identifier]
[continuation]
```

It introduces new language keywords to C#, which are called query keywords:

-   from
-   join, on, equals
-   let
-   where
-   orderby, ascending, descending
-   select
-   group, by
-   into

Query expression is compiled to query method calls at compile time:

<table border="0" cellpadding="2" cellspacing="0" width="672"><tbody><tr><td valign="top" width="297">Query expression</td><td valign="top" width="373">Query method</td></tr><tr><td valign="top" width="297">single from clause with select clause</td><td valign="top" width="373">Select</td></tr><tr><td valign="top" width="297">multiple from clauses with select clause</td><td valign="top" width="373">SelectMany</td></tr><tr><td valign="top" width="297">Type in from/join clauses</td><td valign="top" width="373">Cast</td></tr><tr><td valign="top" width="297">join clause without into</td><td valign="top" width="373">Join</td></tr><tr><td valign="top" width="297">join clause with into</td><td valign="top" width="373">GroupJoin</td></tr><tr><td valign="top" width="297">let clause</td><td valign="top" width="373">Select</td></tr><tr><td valign="top" width="297">where clauses</td><td valign="top" width="373">Where</td></tr><tr><td valign="top" width="297">orderby clause with or without ascending</td><td valign="top" width="373">OrderBy, ThenBy</td></tr><tr><td valign="top" width="297">orderby clause with descending</td><td valign="top" width="373">OrderByDescending, ThenByDescending</td></tr><tr><td valign="top" width="297">group clause</td><td valign="top" width="373">GroupBy</td></tr><tr><td valign="top" width="297">into with continuation</td><td valign="top" width="373">Nested query</td></tr></tbody></table>

It is already demonstrated how query expression syntax works for LINQ. Actually, this syntax is not specific for LINQ query or IEnumerable<T>/ParallelQuery<T>/IQueryable<T> types, but a [general C# syntactic sugar](https://www.infoq.com/interviews/LINQ-Erik-Meijer). Take select clause (compiled to Select method call) as example, it can work for any type, as long as the compiler can find a Select instance method or extension method for that type. Take int as example, it does not have a Select instance method, so the following extension method can be defined to accept a selector function:

```csharp
internal static partial class Int32Extensions
{
    internal static TResult Select<TResult>(this int int32, Func<int, TResult> selector) => 
        selector(int32);
}
```

Now select clause of query expression syntax can be applied to int:

```csharp
internal static partial class QueryExpression
{
    internal static void SelectInt32()
    {
        int mapped1 = from zero in default(int) // 0
                      select zero; // 0
        double mapped2 = from three in 1 + 2 // 3
                         select Math.Sqrt(three + 1); // 2
    }
}
```

And they are compiled to above Select extension method call:

```csharp
internal static void CompiledSelectInt32()
{
    int mapped1 = Int32Extensions.Select(default, zero => zero); // 0
    double mapped2 = Int32Extensions.Select(1 + 2, three => Math.Sqrt(three + 1)); // 2
}
```

More generally, Select method can be defined for any type:

```csharp
internal static partial class ObjectExtensions
{
    internal static TResult Select<TSource, TResult>(this TSource value, Func<TSource, TResult> selector) => 
        selector(value);
}
```

Now select clause and Select method can be applied to any type:

```csharp
internal static void SelectGuid()
{
    string mapped = from newGuid in Guid.NewGuid()
                    select newGuid.ToString();
}

internal static void CompiledSelectGuid()
{
    string mapped = ObjectExtensions.Select(Guid.NewGuid(), newGuid => newGuid.ToString());
}
```

Some tools, like [Resharper](https://www.jetbrains.com/resharper), a powerful [extension for Visual Studio](https://visualstudiogallery.msdn.microsoft.com/EA4AC039-1B5C-4D11-804E-9BEDE2E63ECF), can help converting query expressions to query methods at design time:

[![image_thumb2](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-Functional-Programming-In-Depth-10-Que_851B/image_thumb2_thumb.png "image_thumb2")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-Functional-Programming-In-Depth-10-Que_851B/image_thumb2_2.png)

## Query expression pattern

To enable all the query keywords for a certain type, a set of query methods are required to be provided. The following interfaces demonstrate the signatures of the required methods for a locally queryable type:

```typescript
public interface ILocal
{
    ILocal<T> Cast<T>();
}

public interface ILocal<T> : ILocal
{
    ILocal<T> Where(Func<T, bool> predicate);

    ILocal<TResult> Select<TResult>(Func<T, TResult> selector);

    ILocal<TResult> SelectMany<TSelector, TResult>(
        Func<T, ILocal<TSelector>> selector,
        Func<T, TSelector, TResult> resultSelector);

    ILocal<TResult> Join<TInner, TKey, TResult>(
        ILocal<TInner> inner,
        Func<T, TKey> outerKeySelector,
        Func<TInner, TKey> innerKeySelector,
        Func<T, TInner, TResult> resultSelector);

    ILocal<TResult> GroupJoin<TInner, TKey, TResult>(
        ILocal<TInner> inner,
        Func<T, TKey> outerKeySelector,
        Func<TInner, TKey> innerKeySelector,
        Func<T, ILocal<TInner>, TResult> resultSelector);

    IOrderedLocal<T> OrderBy<TKey>(Func<T, TKey> keySelector);

    IOrderedLocal<T> OrderByDescending<TKey>(Func<T, TKey> keySelector);

    ILocal<ILocalGroup<TKey, T>> GroupBy<TKey>(Func<T, TKey> keySelector);

    ILocal<ILocalGroup<TKey, TElement>> GroupBy<TKey, TElement>(
        Func<T, TKey> keySelector, Func<T, TElement> elementSelector);
}

public interface IOrderedLocal<T> : ILocal<T>
{
    IOrderedLocal<T> ThenBy<TKey>(Func<T, TKey> keySelector);

    IOrderedLocal<T> ThenByDescending<TKey>(Func<T, TKey> keySelector);
}

public interface ILocalGroup<TKey, T> : ILocal<T>
{
    TKey Key { get; }
}
```

All above methods return ILocalSource<T>, so these methods or query expression clauses can be easily composed. The above query methods are represented as instance methods. As fore mentioned, extension methods work too. This is called the query expression pattern. Similarly, the following interfaces demonstrate the signatures of the required query methods for a remotely queryable type, which replaces all function parameters with expression tree parameters:

```typescript
public interface IRemote
{
    IRemote<T> Cast<T>();
}

public interface IRemote<T> : IRemote
{
    IRemote<T> Where(Expression<Func<T, bool>> predicate);

    IRemote<TResult> Select<TResult>(Expression<Func<T, TResult>> selector);

    IRemote<TResult> SelectMany<TSelector, TResult>(
        Expression<Func<T, IRemote<TSelector>>> selector,
        Expression<Func<T, TSelector, TResult>> resultSelector);

    IRemote<TResult> Join<TInner, TKey, TResult>(
        IRemote<TInner> inner,
        Expression<Func<T, TKey>> outerKeySelector,
        Expression<Func<TInner, TKey>> innerKeySelector,
        Expression<Func<T, TInner, TResult>> resultSelector);

    IRemote<TResult> GroupJoin<TInner, TKey, TResult>(
        IRemote<TInner> inner,
        Expression<Func<T, TKey>> outerKeySelector,
        Expression<Func<TInner, TKey>> innerKeySelector,
        Expression<Func<T, IRemote<TInner>, TResult>> resultSelector);

    IOrderedRemote<T> OrderBy<TKey>(Expression<Func<T, TKey>> keySelector);

    IOrderedRemote<T> OrderByDescending<TKey>(Expression<Func<T, TKey>> keySelector);

    IRemote<IRemoteGroup<TKey, T>> GroupBy<TKey>(Expression<Func<T, TKey>> keySelector);

    IRemote<IRemoteGroup<TKey, TElement>> GroupBy<TKey, TElement>(
        Expression<Func<T, TKey>> keySelector, Expression<Func<T, TElement>> elementSelector);
}

public interface IOrderedRemote<T> : IRemote<T>
{
    IOrderedRemote<T> ThenBy<TKey>(Expression<Func<T, TKey>> keySelector);

    IOrderedRemote<T> ThenByDescending<TKey>(Expression<Func<T, TKey>> keySelector);
}

public interface IRemoteGroup<TKey, T> : IRemote<T>
{
    TKey Key { get; }
}
```

The following example demonstrates how the query expression syntax is enabled for ILocal<T> and IRemote<T>:

```csharp
internal static void LocalQuery(ILocal<Uri> uris)
{
    ILocal<string> query =
        from uri in uris
        where uri.IsAbsoluteUri // ILocal.Where and anonymous method.
        group uri by uri.Host into hostUris // ILocal.GroupBy and anonymous method.
        orderby hostUris.Key // ILocal.OrderBy and anonymous method.
        select hostUris.ToString(); // ILocal.Select and anonymous method.
}

internal static void RemoteQuery(IRemote<Uri> uris)
{
    IRemote<string> query =
        from uri in uris
        where uri.IsAbsoluteUri // IRemote.Where and expression tree.
        group uri by uri.Host into hostUris // IRemote.GroupBy and expression tree.
        orderby hostUris.Key // IRemote.OrderBy and expression tree.
        select hostUris.ToString(); // IRemote.Select and expression tree.
}
```

Their syntax looks identical but they are compiled to different query method calls:

```csharp
internal static void CompiledLocalQuery(ILocal<Uri> uris)
{
    ILocal<string> query = uris
        .Where(uri => uri.IsAbsoluteUri) // ILocal.Where and anonymous method.
        .GroupBy(uri => uri.Host) // ILocal.GroupBy and anonymous method.
        .OrderBy(hostUris => hostUris.Key) // ILocal.OrderBy and anonymous method.
        .Select(hostUris => hostUris.ToString()); // ILocal.Select and anonymous method.
}

internal static void CompiledRemoteQuery(IRemote<Uri> uris)
{
    IRemote<string> query = uris
        .Where(uri => uri.IsAbsoluteUri) // IRemote.Where and expression tree.
        .GroupBy(uri => uri.Host) // IRemote.GroupBy and expression tree.
        .OrderBy(hostUris => hostUris.Key) // IRemote.OrderBy and expression tree.
        .Select(hostUris => hostUris.ToString()); // IRemote.Select and expression tree.
}
```

.NET provides 3 sets of built-in query methods:

-   IEnumerable<T> represents local sequential data source and query, its query expression pattern is implemented by extension methods provided by System.Linq.Enumerable
-   ParallelQuery<T> represents local parallel data source and query, its query expression pattern is implemented by extension methods provided by System.Linq.ParallelEnumerable
-   IQueryable<T> represents remote data source and query, its query expression pattern is implemented by extension methods provided by System.Linq.Queryable

So query expression works for these 3 kinds of LINQ. The details of query expression usage and compilation is covered by the LINQ to Objects chapter.

## Query expression vs. query method

Query expression is compiled to query method calls, either syntax can be used to build a LINQ query. However, query expression does not cover all query methods and their overloads. For example, Skip and Take query are not supported by query expression syntax:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count);

        public static IEnumerable<TSource> Take<TSource>(this IEnumerable<TSource> source, int count);
    }
}
```

The following query implement filtering and mapping queries with query expression, but Skip and Take have to be called as query methods, so it is in a hybrid syntax:

```csharp
public static void QueryExpressionAndMethod(IEnumerable<Product> products)
{
    IEnumerable<string> query =
        (from product in products
         where product.ListPrice > 0
         select product.Name)
        .Skip(20)
        .Take(10);
}
```

Another example is, Where query method for IEnumerable<T> has 2 overloads:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);

        public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
    }
}
```

The first Where overload is supported by query expression where clause, the second overload is not.

All query expression syntax and all query methods will be discussed in detail in later chapters. Query expression is also a tool to build general functional workflow, which will also be discussed in the Category Theory chapter.