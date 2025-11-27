---
title: "Entity Framework/Core and LINQ to Entities (1) Remote Query"
published: 2019-03-11
description: "The previous chapters discussed LINQ to Objects, LINQ to XML (objects), and Parallel LINQ (to Objects). All of these LINQ technologies query local in-memory objects managed by .NET. This chapter discu"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## Latest EF Core version of this article: [https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-1-remote-query](/posts/entity-framework-core-and-linq-to-entities-1-remote-query "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-1-remote-query")

## **EF version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-1-remote-query**](/posts/entity-framework-and-linq-to-entities-1-remote-query "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-1-remote-query")

## Entity Framework and Entity Framework Core

The previous chapters discussed LINQ to Objects, LINQ to XML (objects), and Parallel LINQ (to Objects). All of these LINQ technologies query local in-memory objects managed by .NET. This chapter discusses a different kind of LINQ technology, LINQ to Entities, which queries relational data managed by databases. LINQ to Entities was provided by Entity Framework (EF), a Microsoft library released since .NET Framework 3.5 Service Pack 1. In 2016, Microsoft also released the cross platform version, Entity Framework Core (EF Core), along with with .NET Core 1.0. EF and EF Core both implement a provider model, so that LINQ to Entitiescan be implemented by different providers to work with different kinds of databases, including SQL Server (on-premise database) and Azure SQL Database (cloud database, aka SQL Azure), [DB2](https://www.devart.com/dotconnect/db2/), [MySQL](https://dev.mysql.com/doc/connector-net/en/connector-net-entityframework60.html), [Oracle](http://download.oracle.com/oll/obe/EntityFrameworkOBE/EntityFrameworkOBE.htm), [PostgreSQL](https://www.devart.com/dotconnect/postgresql/articles/tutorial_ef.html), [SQLLite](https://www.devart.com/dotconnect/sqlite/), etc.

EF is a library for .NET Framework so it only works on Windows. EF Core is provided for both .NET Framework and .NET Core, so it works cross-platform. This tutorial focuses on cross platform EF Core. It also covers EF, regarding after many years EF has been stabilized, with many rich tools and solutions available. For the scenarios where EF Core and EF work differently, the conditional compilation symbol EF is used to identify EF code.

EF Core APIs are under Microsoft.EntityFrameworkCore namespace, and EF APIs are under System.Data.Entity namespace. Some APIs share the same name, and some are slightly different:

<table border="0" cellpadding="2" cellspacing="0" width="866"><tbody><tr><td valign="top" width="426">EF Core</td><td valign="top" width="438">EF</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.DbContext</td><td valign="top" width="438">System.Data.Entity.DbContext</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.DbSet&lt;TEntity&gt;</td><td valign="top" width="438">System.Data.Entity.DbSet&lt;TEntity&gt;</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.ModelBuilder</td><td valign="top" width="438">System.Data.Entity.DbModelBuilder</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.Infrastructure.DatabaseFacade</td><td valign="top" width="438">System.Data.Entity.Database</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.ChangeTracking.ChangeTracker</td><td valign="top" width="438">System.Data.Entity.Infrastructure.DbChangeTracker*</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry</td><td valign="top" width="438">System.Data.Entity.Infrastructure.DbEntityEntry*</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.ChangeTracking.PropertyEntry</td><td valign="top" width="438">System.Data.Entity.Infrastructure.DbPropertyEntry*</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction</td><td valign="top" width="438">System.Data.Entity.DbContextTransaction*</td></tr><tr><td valign="top" width="426">Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException</td><td valign="top" width="438">System.Data.Entity.Infrastructure.DbUpdateConcurrencyException</td></tr></tbody></table>

This tutorial follows the EF Core API names, and assumes the following aliases are defined for EF types marked with \*:

```csharp
#if EF
using ModelBuilder = System.Data.Entity.DbModelBuilder;
using DatabaseFacade = System.Data.Entity.Database;
using ChangeTracker = System.Data.Entity.Infrastructure.DbChangeTracker;
using EntityEntry = System.Data.Entity.Infrastructure.DbEntityEntry;
using PropertyEntry = System.Data.Entity.Infrastructure.DbPropertyEntry;
using IDbContextTransaction = System.Data.Entity.DbContextTransaction;
#endif
```

## SQL database

To demonstrate LINQ to Entities queries and other database operations, this tutorial uses the classic sample SQL database AdventureWorks provided by Microsoft as the data source, because this sample database has a very intuitive structure, it also works with Azure SQL Database and all SQL Server [editions](http://download.microsoft.com/download/D/7/D/D7D64E12-C8E5-4A8C-A104-C945C188FA99/SQL_Server_2014_Datasheet.pdf). The full sample database provided by Microsoft is relatively large, so a trimmed version is provided for this tutorial in the code samples repo:

-   AdventureWorks.bacpac: about 3M, for Azure SQL Database
-   AdventureWorks\_Data.mdf and AdventureWorks\_Log.ldf: about 30M, for SQL Server

Microsoft SQL database is available in the cloud, and on premise (Windows and Linux). There are many free options to setup, just follow any one of them:

-   Azure SQL Database in the cloud

1.  Sign up [Azure free trial](https://azure.com/free) program, or sign up [Visual Studio Dev Essentials](https://www.visualstudio.com/dev-essentials/) program, to get free Azure account and free credits.
2.  Sign in to Azure portal, create a storage account, then create a container, and upload the AdventureWorks.bacpac file into the container.
3.  In Azure portal, create a SQL Database server, then add local IP address to the server’s firewall settings to enable access.
4.  In Azure portal, import the uploaded AdventureWorks.bacpac from the storage account to the server, and create a SQL database. There the many pricing tier options for the database creation, where the Basic tier only costs about $5 per months, which is totally covered by the free credit.

-   SQL Server on Windows [![image_thumb111](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/e1962de25213_106EC/image_thumb111_thumb.png "image_thumb111")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/e1962de25213_106EC/image_thumb111_2.png)

1.  There are several free options to install SQL Server:

-   SQL Server LocalDB: the easiest option, since no configuration is required for setup.
-   SQL Server Express Core
-   SQL Server Express with Advanced Services
-   SQL Server Developer Edition: free after signing up [Visual Studio Dev Essentials](https://www.visualstudio.com/dev-essentials/) program

3.  Install free tools. Microsoft provides rich tools on Windows, any tool of the following works:

-   [SQL Server Data Tools](https://msdn.microsoft.com/en-us/library/mt204009.aspx) for Visual Studio is a free Visual Studio extension enabling SQL database management inside Visual Studio
-   [SQL Server Management Tools](https://msdn.microsoft.com/en-us/library/mt238290.aspx), which includes [SQL Server Management Studio](https://en.wikipedia.org/wiki/SQL_Server_Management_Studio) (a free integration environment to manage SQL Server and SQL database), [SQL Server Profiler](https://msdn.microsoft.com/en-us/library/ms181091.aspx) (a free tracing tool), and other tools.
-   [mssql extension](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) for Visual Studio Code

5.  Use the installed ool to attach AdventureWorks\_Data.mdf and AdventureWorks\_Log.ldf to SQL Server

-   SQL Server on Linux

1.  Install SQL Server for Linux evaluation edition, which is free and available for Red Hat and Ubuntu
2.  Install SQL Server Tools for Linux, or [mssql extension](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) for Visual Studio Code
3.  Use the installed tool to attach AdventureWorks\_Data.mdf and AdventureWorks\_Log.ldf to SQL Server.

-   SQL Server Docker image on Linux, Mac, or Windows

1.  Install Docker, then in preferences, [change the memory](https://docs.microsoft.com/en-us/sql/linux/sql-server-linux-setup-docker) to 4GB or more
2.  Pull the SQL Server Docker image (microsoft/mssql-server-linux or microsoft/mssql-server-windows), and run
3.  For Linux or Windows, install tools mentioned above; For Mac, install [sql-cli](https://www.npmjs.com/package/sql-cli) tool from npm, or [mssql extension](https://marketplace.visualstudio.com/items?itemName=ms-mssql.mssql) for Visual Studio Code.
4.  Use the tool to attach AdventureWorks\_Data.mdf and AdventureWorks\_Log.ldf to SQL Server.

When the sample database is ready, save the database connection string. For .NET Core, the connection string can be saved for the application as a JSON file, for example, App.json:

```csharp
{
  "ConnectionStrings": {
    "AdventureWorks": "Server=tcp:dixin.database.windows.net,1433;Initial Catalog=AdventureWorks;Persist Security Info=False;User ID=***;Password=***;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
  }
}
```

For .NET Framework, the connection string can be saved in the application’s App.config file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <connectionStrings>
    <add name="AdventureWorks" connectionString="Server=tcp:dixin.database.windows.net,1433;Initial Catalog=AdventureWorks;Persist Security Info=False;User ID=***;Password=***;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;" />
  </connectionStrings>
</configuration>
```

Now the connection string can be read by C# code:

```csharp
internal static class ConnectionStrings
{
    internal static string AdventureWorks { get; } =
#if NETFX
        ConfigurationManager.ConnectionStrings[nameof(AdventureWorks)].ConnectionString;
#else
        new ConfigurationBuilder().AddJsonFile("App.json").Build()
            .GetConnectionString(nameof(AdventureWorks));
#endif
}
```

## Remote query vs. local query

LINQ to Objects, Parallel LINQ query .NET objects in current .NET application’s local memory, these queries are called local queries. LINQ to XML queries XML data source, which are local .NET objects representing XML structures as well, so LINQ to XML queries are also local queries. As demonstrated at the beginning of this tutorial, LINQ can also query data in other data domains, like tweets in Twitter, rows in database tables, etc. Apparently, these data source are not .NET objects directly available in local memory. These queries are called remote queries.

Local data sources and local queries are represented by IEnumerable<T>. Remote LINQ data sources, like a table in database, and remote queries, are represented by System.Linq.IQueryable<T>. Similar to ParallelQuery<T> discussed in the Parallel LINQ chapter, IQueryable<T> is another parity with IEnumerable<T>:

<table cellpadding="2" cellspacing="0" width="542"><tbody><tr><td valign="top" width="290">LINQ to (local) Objects</td><td valign="top" width="250">LINQ to (remote) Entities</td></tr><tr><td valign="top" width="290">System.Collections.IEnumerable</td><td valign="top" width="250">System.Linq.IQueryable</td></tr><tr><td valign="top" width="290">System.Collections.Generic.IEnumerable&lt;T&gt;</td><td valign="top" width="250">System.Linq.IQueryable&lt;T&gt;</td></tr><tr><td valign="top" width="290">System.Linq.IOrderedEnumerable&lt;T&gt;</td><td valign="top" width="250">System.Linq.IOrderedQueryable&lt;T&gt;</td></tr><tr><td valign="top" width="290">System.Linq.Enumerable</td><td valign="top" width="250">System.Linq.Queryable</td></tr></tbody></table>

```csharp
namespace System.Linq
{
    public interface IQueryable : IEnumerable
    {
        Expression Expression { get; }

        Type ElementType { get; }

        IQueryProvider Provider { get; }
    }

    public interface IOrderedQueryable : IQueryable, IEnumerable { }

    public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable { }

    public interface IOrderedQueryable<out T> : IQueryable<T>, IEnumerable<T>, IOrderedQueryable, IQueryable, IEnumerable { }
}
```

IEnumerable<T> has many implementations, like T\[\] array, Microsoft.Collections.Immutable.ImmutableList<T>, etc. EF Core provides IQueryable<T> implementations, including Microsoft.EntityFrameworkCore.DbSet<T>, Microsoft.EntityFrameworkCore.Query.Internal.EntityQueryable<T>, etc. Please see the LINQ to Objects chapter for the detailed list and inheritance hierarchy for types implementing IEnumerable<T>, ParallelQuery<T>, and IQueryable<T>.

> EF provides IQueryable<T> implementations including System.Data.Entity.DbSet<T>, System.Data.Entity.Infrastructure.DbQuery<T>, etc.

System.Linq.Queryable static class provides all the query methods for IQueryable<T>, which are parities with Enumerable query methods. For example, the following are the local and remote Where/Select/Concat/Cast methods side by side:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Where<TSource>(
            this IEnumerable<TSource> source, Func<TSource, bool> predicate);

        public static IEnumerable<TResult> Select<TSource, TResult>(
            this IEnumerable<TSource> source, Func<TSource, TResult> selector);

        public static IEnumerable<TSource> Concat<TSource>(
            this IEnumerable<TSource> first, IEnumerable<TSource> second);

        public static IEnumerable<TResult> Cast<TResult>(this IEnumerable source);

        // Other members.
    }

    public static class Queryable
    {
        public static IQueryable<TSource> Where<TSource>(
            this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate);

        public static IQueryable<TResult> Select<TSource, TResult>(
            this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector);

        public static IQueryable<TSource> Concat<TSource>(
            this IQueryable<TSource> source1, IEnumerable<TSource> source2);

        public static IQueryable<TResult> Cast<TResult>(this IQueryable source);

        // Other members.
    }
}
```

For each remote query method, the type of generic source sequence and result sequence is simply replaced by IQueryable<T>, the type of non-generic sequence is replaced by Queryable, and the call back functions are replaced by expression trees representing those functions. Similarly, the following are the ordering methods side by side, where the type of ordered source sequence and result sequence is replaced by IOrderedQueryable<T>:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
            this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
            this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
            this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
            this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
    }

    public static class Queryable
    {
        public static IOrderedQueryable<TSource> OrderBy<TSource, TKey>(
            this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);

        public static IOrderedQueryable<TSource> OrderByDescending<TSource, TKey>(
            this IQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);

        public static IOrderedQueryable<TSource> ThenBy<TSource, TKey>(
            this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);

        public static IOrderedQueryable<TSource> ThenByDescending<TSource, TKey>(
            this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
    }
}
```

With this design, fluent method chaining and the LINQ query expressions pattern are implemented for remote LINQ queries.

Queryable does not provide the following query methods:

-   Empty/Range/Repeat: it does not make sense for .NET to locally generate a remote data source or remote query on the fly; the other generation method, DefaultIfEmpty, is available, because DefaultIfEmpty works with an IQueryable<T> source.
-   AsEnumerable: it returns IEnumerable<T> representing a local sequence of .NET objects, and this conversion is already provided by Enumerable in LINQ to Objects
-   ToArray/ToDictionary/ToList/ToLookup: these methods creates local .NET collections, and these conversions are already provided by local LINQ to Objects.
-   Max/Min overloads for .NET primary types: these .NET primitive types belongs to local .NET application, not the remote data domain.

Queryable also provides an additional query method:

-   AsQueryable: unlike AsSequential/AsParallel switching between sequential and parallel query, AsEnumerable/AsQueryable cannot freely switch between local and remote query. This method is discussed later.

## Function vs. expression tree

Enumerable query methods accept functions, and Queryable methods accept expression trees. As discussed in the Functional Programming chapter, functions are executable .NET code, and expression trees are data structures representing abstract syntax tree of functions, which can be translated to other domain-specific language. The Functional Programming chapter also demonstrates compiling an arithmetic expression tree into CIL code at runtime, and executing it dynamically. The same approach can be used to translate arithmetic expression tree to SQL query, and execute it in a remote SQL database. The following example reuses the previously defined BinaryArithmeticExpressionVisitor<T> type:

```csharp
internal class InfixVisitor : BinaryArithmeticExpressionVisitor<string>
{
    internal override string VisitBody(LambdaExpression expression) => $"SELECT {base.VisitBody(expression)};";

    protected override string VisitAdd(
        BinaryExpression add, LambdaExpression expression) => this.VisitBinary(add, "+", expression);

    protected override string VisitConstant(
        ConstantExpression constant, LambdaExpression expression) => constant.Value.ToString();

    protected override string VisitDivide(
        BinaryExpression divide, LambdaExpression expression) => this.VisitBinary(divide, "/", expression);

    protected override string VisitMultiply(
        BinaryExpression multiply, LambdaExpression expression) => this.VisitBinary(multiply, "*", expression);

    protected override string VisitParameter(
        ParameterExpression parameter, LambdaExpression expression) => $"@{parameter.Name}";

    protected override string VisitSubtract(
        BinaryExpression subtract, LambdaExpression expression) => this.VisitBinary(subtract, "-", expression);

    private string VisitBinary(
        BinaryExpression binary, string @operator, LambdaExpression expression) =>
            $"({this.VisitNode(binary.Left, expression)} {@operator} {this.VisitNode(binary.Right, expression)})";
}
```

It can traverse an arithmetic expression tree, and compile it to a SQL SELECT statement with infix arithmetic expression:

```sql
internal static partial class ExpressionTree
{
    internal static void Sql()
    {
        InfixVisitor infixVisitor = new InfixVisitor();
        Expression<Func<double, double, double>> expression1 = (a, b) => a * a + b * b;
        string infixExpression1 = infixVisitor.VisitBody(expression1);
        infixExpression1.WriteLine(); // SELECT ((@a * @a) + (@b * @b));

        Expression<Func<double, double, double, double, double, double>> expression2 =
            (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
        string infixExpression2 = infixVisitor.VisitBody(expression2);
        infixExpression2.WriteLine(); // SELECT (((@a + @b) - ((@c * @d) / 2)) + (@e * 3));
    }
}
```

Here @ is prepended to each parameter name, which is the SQL syntax.

The following ExecuteScalar method is defined to execute the compiled SQL statement with SQL parameters and SQL database connection string provided, and return a single result value:

```csharp
public static partial class BinaryArithmeticTranslator
{
    internal static double ExecuteScalar(
        string connection,
        string command,
        IDictionary<string, double> parameters)
    {
        using (SqlConnection sqlConnection = new SqlConnection(connection))
        using (SqlCommand sqlCommand = new SqlCommand(command, sqlConnection))
        {
            sqlConnection.Open();
            parameters.ForEach(parameter => sqlCommand.Parameters.AddWithValue(parameter.Key, parameter.Value));
            return (double)sqlCommand.ExecuteScalar();
        }
    }
}
```

And the following Sql method is defined wrap the entire work. It accept an arithmetic expression tree, call the above InfixVisitor.VisitBody to compile it to SQL, then emit a dynamic function, which extracts the parameters and calls above ExecuteScalar method to execute the SQL:

```csharp
public static partial class BinaryArithmeticTranslator
{
    private static readonly InfixVisitor InfixVisitor = new InfixVisitor();

    public static TDelegate Sql<TDelegate>(Expression<TDelegate> expression, string connection) where TDelegate : class
    {
        DynamicMethod dynamicMethod = new DynamicMethod(
            string.Empty,
            expression.ReturnType,
            expression.Parameters.Select(parameter => parameter.Type).ToArray(),
            typeof(BinaryArithmeticTranslator).Module);
        EmitIL(dynamicMethod.GetILGenerator(), InfixVisitor.VisitBody(expression), expression, connection);
        return (TDelegate)(object)dynamicMethod.CreateDelegate(typeof(TDelegate));
    }

    private static void EmitIL<TDelegate>(
        ILGenerator ilGenerator, string infixExpression, Expression<TDelegate> expression, string connection)
    {
        // Dictionary<string, double> dictionary = new Dictionary<string, double>();
        ilGenerator.DeclareLocal(typeof(Dictionary<string, double>));
        ilGenerator.Emit(
            OpCodes.Newobj,
            typeof(Dictionary<string, double>).GetConstructor(Array.Empty<Type>()));
        ilGenerator.Emit(OpCodes.Stloc_0);

        for (int index = 0; index < expression.Parameters.Count; index++)
        {
            // dictionary.Add($"@{expression.Parameters[i].Name}", args[i]);
            ilGenerator.Emit(OpCodes.Ldloc_0); // dictionary.
            ilGenerator.Emit(OpCodes.Ldstr, $"@{expression.Parameters[index].Name}");
            ilGenerator.Emit(OpCodes.Ldarg_S, index);
            ilGenerator.Emit(
                OpCodes.Callvirt,
                typeof(Dictionary<string, double>).GetMethod(
                    nameof(Dictionary<string, double>.Add),
                    BindingFlags.Instance | BindingFlags.Public | BindingFlags.InvokeMethod));
        }

        // BinaryArithmeticTanslator.ExecuteSql(connection, expression, dictionary);
        ilGenerator.Emit(OpCodes.Ldstr, connection);
        ilGenerator.Emit(OpCodes.Ldstr, infixExpression);
        ilGenerator.Emit(OpCodes.Ldloc_0);
        ilGenerator.Emit(
            OpCodes.Call,
            typeof(BinaryArithmeticTranslator).GetMethod(
                nameof(ExecuteScalar),
                BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.InvokeMethod));

        // Returns the result of ExecuteSql.
        ilGenerator.Emit(OpCodes.Ret);
    }
}
```

As fore mentioned, .NET built-in Expression<TDelegate>.Compile method compiles expression tree to CIL, and emits a function to execute the CIL locally with current .NET application process. In contrast, here BinaryArithmeticTranslator.Sql compiles the arithmetic expression tree to SQL, and emits a function to execute the SQL in a specified remote SQL database:

```csharp
internal static void ExecuteSql()
{
    Expression<Func<double, double, double>> expression1 = (a, b) => a * a + b * b;
    Func<double, double, double> local1 = expression1.Compile();
    local1(1, 2).WriteLine(); // 5
    Func<double, double, double> remote1 = expression1.Sql(ConnectionStrings.AdventureWorks);
    remote1(1, 2).WriteLine(); // 5

    Expression<Func<double, double, double, double, double, double>> expression2 =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
    Func<double, double, double, double, double, double> local2 = expression2.Compile();
    local2(1, 2, 3, 4, 5).WriteLine(); // 12
    Func<double, double, double, double, double, double> remote2 = expression2.Sql(ConnectionStrings.AdventureWorks);
    remote2(1, 2, 3, 4, 5).WriteLine(); // 12
}
```