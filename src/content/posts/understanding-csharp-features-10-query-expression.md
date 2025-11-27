---
title: "Understanding C# Features (10) Query Expression"
published: 2009-12-16
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "LINQ", "LINQ via C#", "C# Features"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

C# query expression defines a SQL-like query. The following is a query expression working on an IEnumerable<int> sequence:
```
public static partial class LinqToObjects
{
    public static IEnumerable<int> Positive(IEnumerable<int> source)
    {
        return from value in source
               where value > 0
               select value;
    }
}
```

And the following query expression works on a IQeuryable<T> sequence:
```
public static string[] ProductNames(string categoryName)
{
    using (AdventureWorksDataContext adventureWorks = new AdventureWorksDataContext())
    {
        IQueryable<string> query =
            from product in adventureWorks.Products
            where product.ProductSubcategory.ProductCategory.Name == categoryName
            orderby product.ListPrice ascending
            select product.Name; // Define query.
        return query.ToArray(); // Execute query.
    }
}
```

## Syntax

The syntax of C# query expression is like SQL:
```
from [Type] identifier in source
[from [Type] identifier in source]
[join [Type] identifier in source on expression equals expression [into identifier]]
[let identifier = expression]
[where predicate]
[orderby ordering [ascending | descending][, ordering [ascending | descending], …]]
select expression | group expression by key [into identifier]
[continueation]
```

which involves query keywords:

-   from
-   in
-   join, on, equals
-   let
-   where
-   orderby, ascending, descending
-   select
-   group, by
-   into

These syntax and examples will be explained in detail later.

## Compilation

Query expression is translated (compiled) to query methods (also called query operators) at compile time:

<table border="0" cellpadding="2" cellspacing="0" width="672"><tbody><tr><td valign="top" width="297">Query expression</td><td valign="top" width="373">Query method</td></tr><tr><td valign="top" width="297">single from clause with select clause</td><td valign="top" width="373">Select</td></tr><tr><td valign="top" width="297">multiple from clauses with select clause</td><td valign="top" width="373">SelectMany</td></tr><tr><td valign="top" width="297">T in from/join clauses</td><td valign="top" width="373">Cast</td></tr><tr><td valign="top" width="297">join clause without into</td><td valign="top" width="373">Join</td></tr><tr><td valign="top" width="297">join clause with into</td><td valign="top" width="373">GroupJoin</td></tr><tr><td valign="top" width="297">let clause</td><td valign="top" width="373">Select</td></tr><tr><td valign="top" width="297">where clauses</td><td valign="top" width="373">Where</td></tr><tr><td valign="top" width="297">orderby clause with or without ascending</td><td valign="top" width="373">OrderBy, ThenBy</td></tr><tr><td valign="top" width="297">orderby clause with descending</td><td valign="top" width="373">OrderByDescending, ThenByDescending</td></tr><tr><td valign="top" width="297">group clause</td><td valign="top" width="373">GroupBy</td></tr><tr><td valign="top" width="297">into with continuation</td><td valign="top" width="373">Nested query</td></tr></tbody></table>

For example, the above 2 query expressions are compiled into query method calls:
```
public static partial class LinqToObjects
{
    public static IEnumerable<int> Positive(IEnumerable<int> source)
    {
        return source.Where(value => value > 0);
    }
}

public static partial class LinqToSql
{
    public static string[] ProductNames(string categoryName)
    {
        using (NorthwindDataContext database = new NorthwindDataContext())
        {
            IQueryable<string> query = database.Products
                .Where(product => product.Category.CategoryName == categoryName)
                .Select(product => product.ProductName); // Define query.
            return query.ToArray(); // Execute query.
        }
    }
}
```

Here:

-   In Positive method, source is an IEnumerable<T>, so query expression is compiled to:
    -   a Where query method call on IEnumerbale<T>. The Where method of IEnumerable<T> has:
        -   a Func<T, bool> parameter, the where clause is compiled to a anonymous method, which can be represented by a lambda expression: value => value > 0.
-   In ProductNames method, database.Products is an IQueryable<Product>, so query expression is compiled to:
    -   a Where query method call on IQueryable<Product>. The Where method of IQueryable<Product> has a:
        -   Expression<Func<Product, bool>> parameter, so the where clause is compiled to a expression tree, which can be represented by a lambda expression: product => product.Category.CategoryName == categoryName
    -   a Select query method call on IQueryable<Product>. The Select method of IQueryable<Product> has a:
        -   Expression<Func<Product, TResult>> parameter. Here TResult is string, because product.ProductName is slected, so the select clause is compiled to an Expression<Func<Product, string>> expression tree, which can be represented by a lambda expression: product => product.ProductName

If completely desuagring above extension methods and lambda expression syntax, the query expressions in Positive is actually compiled to:

```csharp
public static class CompiledLinqToObjects
{
    [CompilerGenerated]
    private static Func<int, bool> cachedAnonymousMethodDelegate;

    [CompilerGenerated]
    private static bool Positive0(int value)
    {
        return value > 0;
    }

    public static IEnumerable<int> Positive(IEnumerable<int> source)
    {
        return Enumerable.Where(
            source,
            cachedAnonymousMethodDelegate ?? (cachedAnonymousMethodDelegate = Positive0));
    }
}
```

And the query expression in ProductNames is compiled to:

```csharp
internal static class CompiledLinqToSql
{
    [CompilerGenerated]
    private sealed class Closure
    {
        internal string categoryName;
    }

    internal static string[] ProductNames(string categoryName)
    {
        Closure closure = new Closure { categoryName = categoryName };
        AdventureWorks adventureWorks = new AdventureWorks();

        try
        {
            ParameterExpression product = Expression.Parameter(typeof(Product), "product");

            // Define query
            IQueryable<string> query = Queryable.Select(
                Queryable.Where(
                    adventureWorks.Products, 
                    Expression.Lambda<Func<Product, bool>>(
                        Expression.Equal( // => product.ProductSubCategory.ProductCategory.Name == closure.categoryName
                            Expression.Property(
                                Expression.Property( // product.ProductSubCategory.ProductCategory.Name
                                    Expression.Property(product, "ProductSubCategory"), // product.ProductSubCategory
                                    "ProductCategory"), // ProductSubCategory.ProductCategory
                                "Name"), // ProductCategory.Name
                            Expression.Field( // Or Expression.Constant(categoryName) works too.
                                Expression.Constant(closure), "categoryName"), // closure.categoryName
                            false,
                            typeof(string).GetMethod("op_Equals")), // ==
                        product)),
                Expression.Lambda<Func<Product, string>>( // product => product.ProductName
                    Expression.Property(product, "ProductName"), // => product.ProductName
                    product)); // product =>

            // Execute query.
            return query.ToArray();
        }
        finally
        {
            adventureWorks.Dispose();
        }
    }
}
```

In ProductNames method, the categoryName parameter is wrapped into a Closure class.

## Query expression pattern

To enable above query keyword, the source for query expression must provide some certain methods. The following classes demonstrate those methods for full support of above query keywords:
```
public abstract class Source
{
    public abstract Source<T> Cast<T>();
}

public abstract class Source<T> : Source
{
    public abstract Source<T> Where(Func<T, bool> predicate);

    public abstract Source<TResult> Select<TResult>(Func<T, TResult> selector);

    public abstract Source<TResult> SelectMany<TSelector, TResult>(
        Func<T, Source<TSelector>> selector,
        Func<T, TSelector, TResult> resultSelector);

    public abstract Source<TResult> Join<TInner, TKey, TResult>(
        Source<TInner> inner,
        Func<T, TKey> outerKeySelector,
        Func<TInner, TKey> innerKeySelector,
        Func<T, TInner, TResult> resultSelector);

    public abstract Source<TResult> GroupJoin<TInner, TKey, TResult>(
        Source<TInner> inner,
        Func<T, TKey> outerKeySelector,
        Func<TInner, TKey> innerKeySelector,
        Func<T, Source<TInner>, TResult> resultSelector);

    public abstract OrderedSource<T> OrderBy<TKey>(Func<T, TKey> keySelector);

    public abstract OrderedSource<T> OrderByDescending<TKey>(Func<T, TKey> keySelector);

    public abstract Source<SoourceGroup<TKey, T>> GroupBy<TKey>(Func<T, TKey> keySelector);

    public abstract Source<SoourceGroup<TKey, TElement>> GroupBy<TKey, TElement>(
        Func<T, TKey> keySelector,
        Func<T, TElement> elementSelector);
}

public abstract class OrderedSource<T> : Source<T>
{
    public abstract OrderedSource<T> ThenBy<TKey>(Func<T, TKey> keySelector);

    public abstract OrderedSource<T> ThenByDescending<TKey>(Func<T, TKey> keySelector);
}

public abstract class SoourceGroup<TKey, T> : Source<T>
{
    public abstract TKey Key { get; }
}
```

Here the query methods are all demonstrated as instance methods. Actually either instance or extension methods will work. .NET provides built-in query methods as extension methods:

-   System.Linq.Enumerable class contains the extension methods for IEnumerable<T>
-   System.Linq.Queryable class contains the extension methods for IQueryable<T>

The built-in query methods are all for sequences - either IEnumerable<T> or IQueryable<T>. However, the query expression pattern applies to anything (any CLR type). To demonstrate [this great flexibility](http://www.infoq.com/interviews/LINQ-Erik-Meijer), a query method can be implemented for int (System.Int32 type):
```
public static partial class Int32Extensions
{
    public static TResult Select<TResult>(this int value, Func<int, TResult> selector) => selector(value);
}
```

This Select method follows the Select signature in above query expression pattern. Also, notice in above compilation table, Select query method can be compiled from the select query keyword. As a result, int (System.Int32 type) now can be queried by LINQ query expression with select clause:
```
public static void QueryExpression()
{
    int query1 = from zero in default(int) // 0
                 select zero; // 0

    string query2 = from three in 1 + 2 // 3
                    select (three + 4).ToString(CultureInfo.InvariantCulture); // "7"
}
```

This looks a little too fancy. Actually, at compile time, they become just calls to above Select extension method for int:
```
public static void QueryMethod()
{
    int query1 = Int32Extensions.Select(default(int), zero => zero);

    string query2 = Int32Extensions.Select(
        (1 + 2), three => (three + 4).ToString(CultureInfo.InvariantCulture)); // "7"
}
```

If a Where query method is implemented for int, then the where keyword can be used in LINQ queries to int, and so on.

Here the experiment with Select can go a little further. Select’s int argument can be replaced with any type:
```
public static partial class ObjectExtensions
{
    public static TResult Select<TSource, TResult>(this TSource value, Func<TSource, TResult> selector) => selector(value);
}
```

Then similarly there is:
```
string query = from newGuild in Guid.NewGuid()
               select newGuild.ToString();
```

which will be compiled to:
```
string query = ObjectExtensions.Select(Guid.NewGuid(), newGuild => newGuild.ToString());
```

This powerful design makes LINQ query syntax possible for any data type.

Some tool, like [Resharper](https://www.jetbrains.com/resharper), a powerful [extension for Visual Studio](https://visualstudiogallery.msdn.microsoft.com/EA4AC039-1B5C-4D11-804E-9BEDE2E63ECF), can compile query expressions to query methods at design time:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Understand.0-Features-7-Query-Expression_14776/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Understand.0-Features-7-Query-Expression_14776/image_2.png)

This is very useful to find out the truth of LINQ query.

## Query expression vs. query method

Regarding query expression is compiled to query method calls, either of them can be used when coding a LINQ query. In this tutorial prefers query methods rather than query expression, because:

-   Query methods are desugared from query expression, so they are closer to the “truth”.
-   Query expressions can express some query methods, but not all the overloads of them.
-   Consistency. Query expression does not cover all query scenarios/query overloads, then query method has to be used, so that the query ends up a mix of query expression and query methods.

For example, built-in query method Select has 2 overloads:
```
public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);

public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
```

The first Where logic can be expressed by query expression, as fore mentioned, but the second Where cannot. The following query cannot be implemented with query expression:
```
public static partial class LinqToObjects
{
    public static IEnumerable<Person> Where
        (IEnumerable<Person> source) => source.Where((person, index) => person.Age >= 18 && index%2 == 0);
}
```

Another example is, query expression cannot page the query results:
```
public static string[] ProductNames(string categoryName, int pageSize, int pageIndex)
{
    using (AdventureWorksDataContext adventureWorks = new AdventureWorksDataContext())
    {
        IQueryable<string> query =
            (from product in adventureWorks.Products
             where product.ProductSubcategory.ProductCategory.Name == categoryName
             orderby product.ListPrice ascending
             select product.Name)
            .Skip(pageSize * checked(pageIndex - 1))
            .Take(pageSize); // Define query.
        return query.ToArray(); // Execute query.
    }
}
```

Query methods look more consistent:
```
public static string[] ProductNames2(string categoryName, int pageSize, int pageIndex)
{
    using (AdventureWorksDataContext adventureWorks = new AdventureWorksDataContext())
    {
        IQueryable<string> query = adventureWorks
            .Products
            .Where(product => product.ProductSubcategory.ProductCategory.Name == categoryName)
            .OrderBy(product => product.ListPrice)
            .Select(product => product.Name)
            .Skip(pageSize * checked(pageIndex - 1))
            .Take(pageSize); // Define query.
        return query.ToArray(); // Execute query.
    }
}
```

Query expression will be explained in detail in a later chapter. It is also essentially a powerful tool to build functional workflow, which will also be explained in another chapter.