---
title: "Entity Framework and LINQ to Entities (3) Logging"
published: 2016-02-22
description: "As fore mentioned, this tutorial will use SQL Profiler to trace the remote SQL queries, which are translated from the LINQ to Entities queries. This is most close the the truth, because the tracing un"
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework", "LINQ to Entities", "SQL Server", "SQL"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## EF Core version of this article: [https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-3-logging-and-tracing-queries](/posts/entity-framework-core-and-linq-to-entities-3-logging-and-tracing-queries "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-3-logging-and-tracing-queries")

As fore mentioned, this tutorial will use SQL Profiler to trace the remote SQL queries, which are translated from the LINQ to Entities queries. This is most close the the truth, because the tracing uncovers the actual SQL query executed in SQL database. Entity Framework also provides several options to log the translated SQL database operations programmatically.

## DbQuery<T>.ToString

For queries, the easiest way is to call ToString method on the IQueryable<T> object. In LINQ to Entities query, the IQueryable<T> is actually implemented with System.Data.Entity.Infrastructure.DbQuery<T>. DbQuery<T>.ToString returns its SQL translation:

```sql
internal static partial class Log
{
    internal static void DbQueryToString()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            IQueryable<ProductCategory> source = adventureWorks.ProductCategories; // Define query.
            string translatedSql = source.ToString();
            Trace.WriteLine(translatedSql);
            // SELECT 
            //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
            //    [Extent1].[Name] AS [Name]
            //    FROM [Production].[ProductCategory] AS [Extent1]
            source.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
        }
    }
}
```

## Database.Log

Besides LINQ to Entities queries, Entity Framework also supports other database operations, like updating the database. So a more general logging API is provides. The DbContext class has a Database property to expose a System.Data.Entity.Database object, where a Log action can be specified:

```csharp
namespace System.Data.Entity
{
    public class DbContext : IDisposable, IObjectContextAdapter
    {
        public Database Database { get; }

        // Other members.
    }

    public class Database
    {
        public Action<string> Log { get; set; }

        // Other members.
    }
}
```

The Log action will be called for all database operations:

```sql
internal static void DatabaseLog()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        adventureWorks.Database.Log = log => Trace.Write(log);
        IQueryable<ProductCategory> source = adventureWorks.ProductCategories; // Define query.
        source.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
        // Opened connection at 5/21/2016 12:33:34 AM -07:00
        // SELECT 
        //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        //    [Extent1].[Name] AS [Name]
        //    FROM [Production].[ProductCategory] AS [Extent1]
        // -- Executing at 5/21/2016 12:31:58 AM -07:00
        // -- Completed in 11 ms with result: SqlDataReader4
        // Closed connection at 5/21/2016 12:33:35 AM -07:00
    }
}
```

## IDbCommandInterceptor

For low-level logging control, Entity Framework provides System.Data.Entity.Infrastructure.Interception.IDbCommandInterceptor interface:

```csharp
namespace System.Data.Entity.Infrastructure.Interception
{
    public interface IDbCommandInterceptor : IDbInterceptor // IDbInterceptor is an empty interface.
    {
        void NonQueryExecuted(DbCommand command, DbCommandInterceptionContext<int> interceptionContext);

        void NonQueryExecuting(DbCommand command, DbCommandInterceptionContext<int> interceptionContext);

        void ReaderExecuted(DbCommand command, DbCommandInterceptionContext<DbDataReader> interceptionContext);

        void ReaderExecuting(DbCommand command, DbCommandInterceptionContext<DbDataReader> interceptionContext);

        void ScalarExecuted(DbCommand command, DbCommandInterceptionContext<object> interceptionContext);

        void ScalarExecuting(DbCommand command, DbCommandInterceptionContext<object> interceptionContext);
    }
}
```

Here is a simple implementation:

```csharp
internal class DbCommandInterceptor : IDbCommandInterceptor
{
    private readonly Action<string> log;

    internal DbCommandInterceptor(Action<string> log)
    {
        this.log = log;
    }

    public void NonQueryExecuting(DbCommand command, DbCommandInterceptionContext<int> interceptionContext) =>
        this.Log(nameof(this.NonQueryExecuting), interceptionContext, command);

    public void NonQueryExecuted(DbCommand command, DbCommandInterceptionContext<int> interceptionContext) =>
        this.Log(nameof(this.NonQueryExecuting), interceptionContext);

    public void ReaderExecuting(DbCommand command, DbCommandInterceptionContext<DbDataReader> interceptionContext) =>
        this.Log(nameof(this.ReaderExecuting), interceptionContext, command);

    public void ReaderExecuted(DbCommand command, DbCommandInterceptionContext<DbDataReader> interceptionContext) =>
        this.Log(nameof(this.ReaderExecuted), interceptionContext);

    public void ScalarExecuting(DbCommand command, DbCommandInterceptionContext<object> interceptionContext) =>
        this.Log(nameof(this.ScalarExecuting), interceptionContext, command);

    public void ScalarExecuted(DbCommand command, DbCommandInterceptionContext<object> interceptionContext) =>
        this.Log(nameof(this.ScalarExecuted), interceptionContext);

    private void Log<TResult>(
        string @event, DbCommandInterceptionContext<TResult> interceptionContext, DbCommand command = null)
    {
        Exception exception = interceptionContext.Exception;
        if (command == null)
        {
            this.log(exception == null ? @event : $"{@event}: {exception}");
        }
        else
        {
            this.log($@"{@event}: {command.CommandText}{string.Concat(command.Parameters
                .OfType<DbParameter>()
                .Select(parameter => $", {parameter.ParameterName}={parameter.Value}"))}");
            if (exception != null)
            {
                this.log($@"{@event}: {exception}");
            }
        }
    }
}
```

An interceptor has to be registered with System.Data.Entity.Infrastructure.Interception.DbInterception.Add:

```sql
internal static void DbCommandInterceptor()
{
    DbCommandInterceptor dbCommandTrace = new DbCommandInterceptor(message => Trace.WriteLine(message));
    DbInterception.Add(dbCommandTrace);
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductCategory> source = adventureWorks.ProductCategories; // Define query.
        source.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
        // ReaderExecuting: SELECT 
        //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        //    [Extent1].[Name] AS [Name]
        //    FROM [Production].[ProductCategory] AS [Extent1]
        // ReaderExecuted
    }
    DbInterception.Remove(dbCommandTrace);
}
```