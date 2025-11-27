---
title: "Understanding LINQ to SQL (10) Implementing LINQ to SQL Provider"
published: 2010-05-11
description: "\\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to SQL", "LINQ via C# Series", "TSQL"]
category: "LINQ"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

So far LINQ to SQL data CRUD (Creating / Retrieving / Updating / Deleting) has been explained. This post takes a deeper look at the internal implementation of LINQ to SQL query.

## The provider model

Unlike IEnumerable / IEnumerable<T>, the IQueryable / IQueryable<T> need a query provider:

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

And this is the definition of IQueryProvider:

```csharp
namespace System.Linq
{
    public interface IQueryProvider
    {
        IQueryable CreateQuery(Expression expression);

        IQueryable<TElement> CreateQuery<TElement>(Expression expression);

        object Execute(Expression expression);

        TResult Execute<TResult>(Expression expression);
    }
}
```

Yes, IQueryable / IQueryable<T> are much more complex than IEnumerable / IEnumerable<T>, because they are supposed to work against non-.NET data source, like SQL Server database, etc.

Please also notice IOrderedQueryable and IOrderedQueryable<T>:

```csharp
namespace System.Linq
{
    // The same as IQueryable.
    public interface IOrderedQueryable : IQueryable, IEnumerable
    {
    }
    
    // The same as IQueryable<T>.
    public interface IOrderedQueryable<out T> : IOrderedQueryable,
                                                IQueryable<T>, IQueryable,
                                                IEnumerable<T>, IEnumerable
    {
    }
}
```

They are the same as IQueryable and IQueryable<T>, and just used to represent an ordering query, like OrderBy(), etc.

### Implement IQueryable<T> and IOrderedQueryable<T>

The best way to understand these interfaces is just creating IQueryable / IQueryable<T> objects, and examining how they work and query data from SQL Server.

This is one simple implementation:

```csharp
public class Queryable<TSource> : IOrderedQueryable<TSource>
{
    public Queryable(IQueryProvider provider, IQueryable<TSource> innerSource)
    {
        this.Provider = provider;
        this.Expression = Expression.Constant(innerSource);
    }

    public Queryable(IQueryProvider provider, Expression expression)
    {
        this.Provider = provider;
        this.Expression = expression;
    }

    #region IEnumerable<TSource> Members

    public IEnumerator<TSource> GetEnumerator()
    {
        return this.Provider.Execute<IEnumerable<TSource>>(this.Expression).GetEnumerator();
    }

    #endregion

    #region IEnumerable Members

    IEnumerator IEnumerable.GetEnumerator()
    {
        return this.GetEnumerator();
    }

    #endregion

    #region IQueryable Members

    public Type ElementType
    {
        get
        {
            return typeof(TSource);
        }
    }

    public Expression Expression
    {
        get;
        private set;
    }

    public IQueryProvider Provider
    {
        get;
        private set;
    }

    #endregion
}
```

Since Queryable<TSource> implements IOrderedQueryable<T>, it also implements IQeryable<TSource>, IQeryable and IOrderedQueryable.

There is not too much things. The most important method is GetEnumerator(). When a Queryable<TSource> object is iterated to traverse the data items, it simply asks its query provider to execute its expression to retrieve an IEnumerable<TSource> object, and return that object’s iterator.

### Implement IQueryProvider

So the actual SQL query implantation is in the query provider:

```csharp
public class QueryProvider : IQueryProvider
{
    // Translates LINQ query to SQL.
    private readonly Func<IQueryable, DbCommand> _translator;

    // Executes the translated SQL and retrieves results.
    private readonly Func<Type, string, object[], IEnumerable> _executor;

    public QueryProvider(
        Func<IQueryable, DbCommand> translator,
        Func<Type, string, object[], IEnumerable> executor)
    {
        this._translator = translator;
        this._executor = executor;
    }

    #region IQueryProvider Members

    public IQueryable<TElement> CreateQuery<TElement>(Expression expression)
    {
        return new Queryable<TElement>(this, expression);
    }

    public IQueryable CreateQuery(Expression expression)
    {
        throw new NotImplementedException();
    }

    public TResult Execute<TResult>(Expression expression)
    {
        bool isCollection = typeof(TResult).IsGenericType &&
            typeof(TResult).GetGenericTypeDefinition() == typeof(IEnumerable<>);
        Type itemType = isCollection
            // TResult is an IEnumerable`1 collection.
            ? typeof(TResult).GetGenericArguments().Single()
            // TResult is not an IEnumerable`1 collection, but a single item.
            : typeof(TResult);
        IQueryable queryable = Activator.CreateInstance(
            typeof(Queryable<>).MakeGenericType(itemType), this, expression) as IQueryable;

        IEnumerable queryResult;

        // Translates LINQ query to SQL.
        using (DbCommand command = this._translator(queryable))
        {
            // Executes the transalted SQL.
            queryResult = this._executor(
                itemType,
                command.CommandText,
                command.Parameters.OfType<DbParameter>()
                                  .Select(parameter => parameter.Value)
                                  .ToArray());
        }

        return isCollection
            ? (TResult)queryResult // Returns an IEnumerable`1 collection.
            : queryResult.OfType<TResult>()
                         .SingleOrDefault(); // Returns a single item.
    }

    public object Execute(Expression expression)
    {
        throw new NotImplementedException();
    }

    #endregion
}
```

QueryProvider must be initialized with a translator and executor, so that it is able to translate LINQ query to SQL, and execute the translated SQL.

And here the most important is the generic Execute() method, which is called by the above Queryable<TSource>.GetEnumerator(). It does the following work:

-   Checks whether it should return a collection of items (for the Where() scenarios, etc.), or should return a sinlge item (for the Single() query scenarios, etc.)
-   Invokes the translator to translate LINQ query to SQL.
-   Invokes the executor to execute the translated SQL and retrieves the result.
-   Returns result of a proper type (either a collection, or a single item).

## Query method internals

Before running the query, take a look at the IQueryable<T> query methods.

### Deferred execution methods

Take Where() as an example:

```csharp
public static class Queryable
{
    public static IQueryable<TSource> Where<TSource>(
        this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
    {
        // Checks arguments.
        return source.Provider.CreateQuery<TSource>(
            Expression.Call(
                null,
                ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(new Type[]
                    { 
                        typeof(TSource) 
                    }),
                new Expression[] 
                    { 
                        source.Expression, 
                        Expression.Quote(predicate) 
                    }));
    }
}
```

It is very very different from [IEnumerable<T>’s Where() query method](/posts/understanding-linq-to-objects-7-query-methods-internals). It is not executing any thing, it just:

-   Constructs a new expression tree, which contains the following information:
    -   The original expression tree from the source IQueryable<T> object
    -   The predicate expression tree
    -   This Where() query method is invoked
-   Then invokes the query provider’s generic CreateQuery() method to construct a new IQueryable<TSource> object.

Obviously, the above constructed expression tree is used to contain the information which is prepared to be translated.

The ordering query method, like OrderBy(), is a little different, which converts the constructed IQueryable<TSource> object to an IOrderedQueryable<TSource> object:

```csharp
public static IOrderedQueryable<TSource> OrderBy<TSource, TKey>(
    this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector)
{
    // Checks arguments.
    return (IOrderedQueryable<TSource>)source.Provider.CreateQuery<TSource>(
        Expression.Call(
            null, 
            ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(new Type[] 
                { 
                    typeof(TSource), 
                    typeof(TKey) 
                }), 
            new Expression[] 
                { 
                    source.Expression, 
                    Expression.Quote(keySelector) 
                }));
}
```

And so is ThenBy():

```csharp
public static IOrderedQueryable<TSource> ThenBy<TSource, TKey>(
    this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector)
{
    // Checks arguments.
    return (IOrderedQueryable<TSource>)source.Provider.CreateQuery<TSource>(
        Expression.Call(
            null, 
            ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(new Type[] 
                { 
                    typeof(TSource), 
                    typeof(TKey) 
                }), 
            new Expression[] { 
                    source.Expression, 
                    Expression.Quote(keySelector) 
            }));
}
```

ThenBy() / ThenByDescending() are extension methods of IOrderedQueryable<TSource> instead of IQueryable<TSource>, which means, It must be invoked after invoking OrderBy() / OrderByDescending().

### Eager execution methods

Single() is different:

```csharp
public static TSource Single<TSource>(this IQueryable<TSource> source)
{
    // Checks arguments.
    return source.Provider.Execute<TSource>(
        Expression.Call(
            null, 
            ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(new Type[] 
                { 
                    typeof(TSource) 
                }), 
            new Expression[] 
                { 
                    source.Expression 
                }));
}
```

Logically, Single() cannot be deferred. So after construction the expression tree, it invokes query provider’s generic Execute() method, and returns a TSource object instead of a IQueryable<TSource>.

Of course, the aggregate methods looks similar, invoking Execute() instead of CreateQuery():

```csharp
public static decimal Average<TSource>(
    this IQueryable<TSource> source, Expression<Func<TSource, decimal>> selector)
{
    // Checks arguments.
    return source.Provider.Execute<decimal>(
        Expression.Call(
            null, 
            ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(new Type[] 
                { 
                    typeof(TSource) 
                }), 
            new Expression[] 
                { 
                    source.Expression, 
                    Expression.Quote(selector) 
                }));
}
```

It cannot be deferred either.

## Work together

Now it is ready to run all the stuff above.

### Query a collection of items (deferred execution)

The following query expects a collection of Product objects:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryProvider provider = new QueryProvider(database.GetCommand, database.ExecuteQuery);
    IQueryable<Product> source = new Queryable<Product>(provider, database.GetTable<Product>());
    IQueryable<string> results = source.Where(product => product.CategoryID == 2)
                                       .OrderBy(product => product.ProductName)
                                       .Select(product => product.ProductName)
                                       .Skip(5)
                                       .Take(10);

    using (IEnumerator<string> iterator = results.GetEnumerator())
    {
        while (iterator.MoveNext())
        {
            string item = iterator.Current;
            Console.WriteLine(item);
        }
    }
}
```

To initialize the provider, DataContext.GetCommand() and DataContext.ExecuteQuery() are passed as translator and executor.

When results.GetEnumerator() is invoked, provider.Execute() is invoked. The query is translated to:

```sql
exec sp_executesql N'SELECT [t1].[ProductName]
FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY [t0].[ProductName]) AS [ROW_NUMBER], [t0].[ProductName]
    FROM [dbo].[Products] AS [t0]
    WHERE [t0].[CategoryID] > @p0
    ) AS [t1]
WHERE [t1].[ROW_NUMBER] BETWEEN @p1 + 1 AND @p1 + @p2
ORDER BY [t1].[ROW_NUMBER]',N'@p0 int,@p1 int,@p2 int',@p0=2,@p1=5,@p2=10
```

by the provider’s translator, then provider’s executor executes the above SQL in SQL Server, and return a collection of items.

This is the printed output:

> Escargots de Bourgogne Filo Mix Flotemysost Geitost Gnocchi di nonna Alice Gorgonzola Telino Gravad lax Gudbrandsdalsost Gumbär Gummibärchen Gustaf's Knäckebröd

### Query a single item (eager execution)

The following sample is different:

```csharp
IQueryProvider provider = new QueryProvider(database.GetCommand, database.ExecuteQuery);
IQueryable<Product> source = new Queryable<Product>(provider, database.GetTable<Product>());
string productName = source.Where(product => product.CategoryID > 2)
                           .Select(product => product.ProductName)
                           .First();
```

Without deferred execution and iterating, the First() invokes provider.Execute() directly.

This is the translated SQL:

```sql
exec sp_executesql N'SELECT TOP (1) [t0].[ProductName]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] > @p0',N'@p0 int',@p0=2
```

### Aggregate (eager execution)

Aggregate query is also eager:

```csharp
IQueryProvider provider = new QueryProvider(database.GetCommand, database.ExecuteQuery);
IQueryable<Product> source = new Queryable<Product>(provider, database.GetTable<Product>());
decimal averagePrice = source.Where(product => product.CategoryID == 2)
                             .Average(product => product.UnitPrice.GetValueOrDefault());
```

This is the translated SQL:

```sql
exec sp_executesql N'SELECT AVG([t1].[value]) AS [value]
FROM (
    SELECT COALESCE([t0].[UnitPrice],0) AS [value], [t0].[CategoryID]
    FROM [dbo].[Products] AS [t0]
    ) AS [t1]
WHERE [t1].[CategoryID] = @p0',N'@p0 int',@p0=2
```

### SQL translating and executing

The above samples explained the implementation of LINQ to SQL query and query provider. Inside the QueryProvider class, it does not provide the detailed implementation of SQL translating and executing, but pass the work to DataContext.GetCommand() and DataContext.ExecuteQuery().

[This post](/posts/understanding-linq-to-sql-3-expression-tree) has demonstrated the simplest SQL translating and executing. But the realistic work is very very complex. Since this is not a SQL series but a LINQ / functional programming series, to develop a full featured SQL “compiler” is far beyond this series’ scope. For SQL executing, it is also complex to convert the retrieved data back to strong-typed objects in LINQ to SQL. To understand the entire translating and executing process, please follow the source code of Table<T>, which implements IQueryProvider.

Internally, Table<T> uses several internal classes, like SqlProvider, QueryConverter, etc., to accomplish the translating. For example, one of the core APIs is the QueryConverter.VisitSequenceOperatorCall():

```csharp
internal class QueryConverter
{
    private SqlNode VisitSequenceOperatorCall(MethodCallExpression mc)
    {
        Type declaringType = mc.Method.DeclaringType;
        if (!(declaringType == typeof(Enumerable)) && !(declaringType == typeof(Queryable)))
        {
            throw new InvalidOperationException(string.Format(
                CultureInfo.InvariantCulture,
                "Sequence operator call is only valid for Sequence, Queryable, or DataQueryExtensions not for '{0}'",
                declaringType));
        }

        bool isNotSupported = false;
        switch (mc.Method.Name)
        {
            case "Where":
                isNotSupported = true;

                // The overload:
                // IQueryable<TSource> Where<TSource>(
                // this IQueryable<TSource> source, Expression<Func<TSource, int, bool>> predicate)
                // is not supported.

                // The MethodCallExpression object mc should have 2 arguments.
                // The first argument should be null.
                // The second argument should be Expression.Quote(predicate).
                if (mc.Arguments.Count != 2 ||
                    // IsLambda() removes the quote to get the predicate object,
                    // and checks predicate.NodeType ==  ExpressionType.Lambda.
                    !this.IsLambda(mc.Arguments[1]) ||
                    // precicate should have 1 TSource argument.
                    this.GetLambda(mc.Arguments[1]).Parameters.Count != 1)
                {
                    break; // The overload is not supported.
                }

                // The overload:
                // IQueryable<TSource> Where<TSource>(
                // this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
                // is supported.
                return this.VisitWhere(mc.Arguments[0], this.GetLambda(mc.Arguments[1]));

            case "OrderBy":
                isNotSupported = true;

                if (mc.Arguments.Count != 2 || !this.IsLambda(mc.Arguments[1]) ||
                    this.GetLambda(mc.Arguments[1]).Parameters.Count != 1)
                {
                    break; // The overload is not supported.
                }

                return this.VisitOrderBy(
                    mc.Arguments[0], this.GetLambda(mc.Arguments[1]), SqlOrderType.Ascending);

            case "ThenBy":
                isNotSupported = true;

                if (mc.Arguments.Count != 2 || !this.IsLambda(mc.Arguments[1]) ||
                    this.GetLambda(mc.Arguments[1]).Parameters.Count != 1)
                {
                    break; // The overload is not supported.
                }

                return this.VisitThenBy(
                    mc.Arguments[0], this.GetLambda(mc.Arguments[1]), SqlOrderType.Ascending);

            case "Single":
            case "SingleOrDefault":
                isNotSupported = true;

                if (mc.Arguments.Count != 1)
                {
                    if (mc.Arguments.Count != 2 || !this.IsLambda(mc.Arguments[1]) ||
                        this.GetLambda(mc.Arguments[1]).Parameters.Count != 1)
                    {
                        break; // The overload is not supported.
                    }

                    return this.VisitFirst(
                        mc.Arguments[0], this.GetLambda(mc.Arguments[1]), false);
                }

                return this.VisitFirst(mc.Arguments[0], null, false);

            case "Average":
                isNotSupported = true;

                if (mc.Arguments.Count != 1)
                {
                    if (mc.Arguments.Count != 2 || !this.IsLambda(mc.Arguments[1]) ||
                        this.GetLambda(mc.Arguments[1]).Parameters.Count != 1)
                    {
                        break; // The overload is not supported.
                    }

                    return this.VisitAggregate(
                        mc.Arguments[0], this.GetLambda(mc.Arguments[1]), SqlNodeType.Avg, mc.Type);
                }

                return this.VisitAggregate(mc.Arguments[0], null, SqlNodeType.Avg, mc.Type);

            // Other cases, like "Take", "Skip", "Distinct", etc.                
        }

        if (isNotSupported)
        {
            throw new NotSupportedException(string.Format(
                CultureInfo.InvariantCulture,
                "Unsupported overload used for query operator '{0}'.",
                mc.Method.Name));
        }

        throw new NotSupportedException(string.Format(
            CultureInfo.InvariantCulture,
            "The query operator '{0}' is not supported.",
            mc.Method.Name));
    }
}
```

Please compare this with the fore mentioned IQueryable<T> query methods, Where(), OrderBy(), Single(), Average(), etc.

There is also [an excellent tutorial](http://msdn.microsoft.com/en-us/vcsharp/ee672195.aspx) from MSDN.

## LINQ Providers

There are several kinds of built-in LINQ in .NET 4.0:

-   [LINQ to Objects](http://msdn.microsoft.com/en-us/library/bb397919.aspx)
    -   [Parallel LINQ to Objects](http://msdn.microsoft.com/en-us/library/dd460688.aspx)
-   [LINQ to XML](http://msdn.microsoft.com/en-us/library/bb387098.aspx)
-   [LINQ to ADO.NET](http://msdn.microsoft.com/en-us/library/bb397942.aspx)
    -   [LINQ to SQL](http://msdn.microsoft.com/en-us/library/bb386976.aspx)
    -   [LINQ to DataSet](http://msdn.microsoft.com/en-us/library/bb386977.aspx)
    -   [LINQ to Entities](http://msdn.microsoft.com/en-us/library/bb386964.aspx)

[![built-in-linq](https://aspblogs.z22.web.core.windows.net/dixin/Media/builtinlinq_12A094FC.gif "built-in-linq")](http://msdn.microsoft.com/en-us/library/bb399365.aspx)

### Built-in IQueryable LINQ Providers

LINQ to Objects and LINQ to XML are IEnumerable based, and the 3 kinds of LINQ to ADO.NET are IQueryable-based, which have their specific IQueryProvider.

For example, in LINQ to SQL, the IQueryable, IQueryable<T> and IQueryProvider are implemented by Table<T> class and an internal DataQuery<T> class. DataQuery<T> also implements IOrderedQueryable and IOrderedQueryable<T>. These classes and all the other related classes (like SqlProvider, ) can be considered the provider of LINQ to SQL.

### LINQ to Everything

To implement any other LINQ query against a specific data source, the specific LINQ provider should be provided. That is, classes which implements the above IQueryable, IQueryable<T>, IQueryProvider, IOrderedQueryable and IOrderedQueryable<T> interfaces. The [LINQ to Wikipedia](http://linqtowikipedia.codeplex.com/) provider [at the beginning of the series](/posts/introducing-linq-1-what-is-linq) is one example. [This post](http://blogs.msdn.com/charlie/archive/2008/02/28/link-to-everything-a-list-of-linq-providers.aspx) lists a lot of custom LINQ providers, like:

-   [LINQ to Excel](http://www.codeplex.com/xlslinq)
-   [LINQ to Sharepoint](http://www.codeplex.com/LINQtoSharePoint)
-   [LINQ to WMI](http://bloggingabout.net/blogs/emile/archive/2005/12/12/10514.aspx)

etc.

[This tutorial](http://msdn.microsoft.com/en-us/library/bb546158.aspx) teaches how to create a IQueryable LINQ provider against the [TerraServer-USA Web service](http://go.microsoft.com/fwlink/?LinkId=98557).

### LINQ to Objects provider

LINQ to Objects is IEnumerable based, but the interesting thing is, IEnumerble<T> has an AsQueryable() extension method, which turns IEnumerble-based query into IQueryable-based query:

```csharp
public static class Queryable
{
    public static IQueryable<TElement> AsQueryable<TElement>(
        this IEnumerable<TElement> source)
    {
        // Checks arguments.
        if (source is IQueryable<TElement>)
        {
            return (IQueryable<TElement>)source;
        }

        return new EnumerableQuery<TElement>(source);
    }
}
```

Here the EnumerableQuery<T> class implements IQueryable<T>, as well as the IQueryProvider:

```csharp
namespace System.Linq
{
    public abstract class EnumerableQuery
    {
        // ...
    }

    public class EnumerableQuery<T> : EnumerableQuery, IQueryProvider,
                                      IQueryable<T>, IQueryable,
                                      IOrderedQueryable<T>, IOrderedQueryable,
                                      IEnumerable<T>, IEnumerable
    {
        // ...
    }
}
```

Internally, EnumerableQuery<T>.Execute() invokes Expression<TDelegate>.Compile() to execute the expression representing the query.