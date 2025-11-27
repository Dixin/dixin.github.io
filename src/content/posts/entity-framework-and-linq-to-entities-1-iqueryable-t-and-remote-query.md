---
title: "Entity Framework and LINQ to Entities (1) IQueryable<T> and Remote Query"
published: 2016-01-16
description: "The previous chapters discussed LINQ to Objects, LINQ to XML (objects), and Parallel LINQ (to Objects). All of these APIs query in memory objects managed by .NET. This chapter discusses Entity Framewo"
image: ""
tags: [".NET", "C#", "Entity Framework", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## **\[**[**LINQ via C# series**](/posts/linq-via-csharp)**\]**

## **\[**[**Entity Framework Core series**](/archive/?tag=Entity%20Framework%20Core)**\]**

## **\[**[**Entity Framework series**](/archive/?tag=Entity%20Framework)**\]**

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-1-remote-query**](/posts/entity-framework-core-and-linq-to-entities-1-remote-query "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-1-remote-query")

The previous chapters discussed LINQ to Objects, LINQ to XML (objects), and Parallel LINQ (to Objects). All of these APIs query in memory objects managed by .NET. This chapter discusses Entity Framework, a Microsoft library providing a different kind of LINQ technology, LINQ to Entities. LINQ to Entities can access and query relational data managed by different kinds of databases, e.g.:

-   SQL Server and Azure SQL Database (aka SQL Azure)
-   [Oracle](http://download.oracle.com/oll/obe/EntityFrameworkOBE/EntityFrameworkOBE.htm)
-   [MySQL](https://dev.mysql.com/doc/connector-net/en/connector-net-entityframework60.html)
-   [PostgreSQL](https://www.devart.com/dotconnect/postgresql/articles/tutorial_ef.html)

etc. This tutorial uses Microsoft [SQL Server LocalDB](https://msdn.microsoft.com/en-us/library/hh510202.aspx) with the Microsoft AdventureWorks sample database as the data source. SQL Server LocalDB is a free, lightweight SQL Server [edition](http://download.microsoft.com/download/D/7/D/D7D64E12-C8E5-4A8C-A104-C945C188FA99/SQL_Server_2014_Datasheet.pdf). It is [extremely easy to install/use, but with rich programmability](https://blogs.msdn.microsoft.com/sqlexpress/2011/07/12/introducing-localdb-an-improved-sql-express/). Please follow these step to setup:

1.  [Download SQL Server LocalDB](https://www.microsoft.com/en-in/download/details.aspx?id=52679), and use the installer to download SQL Server LocalDB and install. Zero configuration is required for installation. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_14.png)
2.  [Download SQL Server Management Tools](https://msdn.microsoft.com/en-us/library/mt238290.aspx) and install. [This includes](https://msdn.microsoft.com/en-us/library/hh213248.aspx):

-   [SQL Server Management Studio](https://en.wikipedia.org/wiki/SQL_Server_Management_Studio), a free integration environment to manage SQL Server and SQL database.
-   [SQL Server Profiler](https://msdn.microsoft.com/en-us/library/ms181091.aspx), a free trace tool. This tutorial will use it to uncover how Entity Framework works with the SQL data source.

4.  (Optional) [Download SQL Server Data Tools](https://msdn.microsoft.com/en-us/library/mt204009.aspx) and install. It is a free Visual Studio extension, and enables SQL database management inside Visual Studio.
5.  Download and install Microsoft SQL Server sample databases AdventureWorks. The [full database from Microsoft](http://msftdbprodsamples.codeplex.com/) will be about 205MB, so a compacted and shrunk version of the AdventureWorks database is provided for this tutorial. It is only 34MB, and is available from [GitHub](https://github.com/Dixin/CodeSnippets/tree/master/Data). Just download the [AdventureWorks\_Data.mdf](https://github.com/Dixin/CodeSnippets/blob/master/Data/AdventureWorks_Data.mdf) file and the [AdventureWorks\_Log.ldf](https://github.com/Dixin/CodeSnippets/blob/master/Data/AdventureWorks_Log.ldf) file to the same directory.
6.  Install Entity Framework library to code project:
    ```powershell
    Install-Package EntityFramework
    ```
    By default, 2 assemblies will be added to the references: EntityFramework.dll and EntityFramework.SqlServer.dll. Entity Framework implements a provider model to support different kinds of databases, so EntityFramework.dll has the general functionalities for all the databases, and EntityFramewwork.SqlServer.dll implements SQL database specific functionalities.

## Remote query vs. local query

LINQ to Objects and Parallel LINQ query .NET objects in current .NET process’s local memory, these queries are called local queries. LINQ to XML queries XML data source, which are .NET XML objects in local memory as well, so LINQ to XML queries are also local queries. As demonstrated at the beginning of this tutorial, LINQ can also query data in another domain, like tweets in Twitter, rows in database tables, etc. Apparently, these data source are not .NET objects directly available in local memory. These queries are called remote queries.

A local LINQ to Objects data source is represented by IEnumerable<T>. A remote LINQ data source, like a table in database, is represented by IQueryable<T>. Similar to ParallelQuery<T> discussed in the Parallel LINQ chapter, IQueryable<T> is another parity with IEnumerbale<T>:

<table cellpadding="2" cellspacing="0" width="600"><tbody><tr><td valign="top" width="200">Sequential LINQ</td><td valign="top" width="200">Parallel LINQ</td><td valign="top" width="200">LINQ to Entities</td></tr><tr><td valign="top" width="200">IEnumerable</td><td valign="top" width="200">ParallelQuery</td><td valign="top" width="200">IQueryable</td></tr><tr><td valign="top" width="200">IEnumerable&lt;T&gt;</td><td valign="top" width="200">ParallelQuery&lt;T&gt;</td><td valign="top" width="200">IQueryable&lt;T&gt;</td></tr><tr><td valign="top" width="200">IOrderedEnumerable&lt;T&gt;</td><td valign="top" width="200">OrderedParallelQuery&lt;T&gt;</td><td valign="top" width="200">IOrderedQueryable&lt;T&gt;</td></tr><tr><td valign="top" width="200">Enumerable</td><td valign="top" width="200">ParallelEnumerable</td><td valign="top" width="200">Queryable</td></tr></tbody></table>

```csharp
namespace System.Linq
{
    public interface IQueryable : IEnumerable
    {
        Expression Expression { get; }

        Type ElementType { get; }

        IQueryProvider Provider { get; }
    }

    public interface IOrderedQueryable : IQueryable, IEnumerable
    {
    }

    public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable
    {
    }

    public interface IOrderedQueryable<out T> : IQueryable<T>, IEnumerable<T>, IOrderedQueryable, IQueryable, IEnumerable
    {
    }
}
```

IEnumerable<T> has many implementations, like array in mscorlib.dll, Microsoft.Collections.Immutable.ImmutableList<T> in System.Collections.Immutable.dll, etc. Here Entity Framework provides several IQueryable<T> implementations, like System.Data.Entity.Infrastructure.DbQuery<T> and System.Data.Entity.DbSet<T> in EntityFramework.dll, etc. DbQuery<T> and DbSet<T> will be used all over this chapter. Please see the LINQ to Objects chapter for the full implementation/inheritance hierarchy for IEnumerable<T>, ParallelQuery<T>, and IQueryable<T>.

Queryable class defines all the extension methods for IQueryable<T>, which are parities with Enumerable class’s methods. For example, here are the Where/Select/Concat methods side by side:

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

        // More query methods...
    }

    public static class Queryable
    {
        public static IQueryable<TSource> Where<TSource>(
            this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate);

        public static IQueryable<TResult> Select<TSource, TResult>(
            this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector);

        public static IQueryable<TSource> Concat<TSource>(
            this IQueryable<TSource> source1, IQueryable<TSource> source2);

        // More query methods...
    }
}
```

And similarly, the ordering methods side by side:

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

With this design, the fluent method chaining and the LINQ query expressions pattern works smoothly for remote LINQ queries.

Queryable class does not provide the following query methods:

-   AsEnumerable: it returns an IEnumerable<T> representing a sequence of .NET objects, and this method is already provided by Enumerable in LINQ to Objects
-   Empty/Range/Repeat: it does not make sense for .NET to generate a remote data source for further remote queries; the other generation method, DefaultIfEmpty, is available, because DefaultIfEmpty generates from an input IQuerable<T> source.
-   Max/Min overloads for .NET primary types: these .NET primitive types may not exist in the remote data source, like a SQL/Oracle/MySQL database, also LINQ to Objects has provided these methods to query these .NET primitive values in local memory.
-   ToArray/ToDictionary/ToList/ToLookup: similarly, collection types like array, dictionary, … may not exist in the remote data source, also LINQ to Objects has provided these methods to pull values from data source and convert to .NET collections.

Queryable provides an additional query method:

-   AsQueryable: unlike to AsSequential/AsParallel, AsEnumerable/AsQueryable cannot switch between local LINQ to Objects query and remote LINQ to Entities query. This method will be discussed later.

## Function vs. expression tree

As discussed in the C# chapter, the major difference is Enumerable query methods accepts functions, and Queryable methods accepts expression trees. Functions are executable .NET code, and expression trees are .NET data objects representing abstract syntax trees, which can be translated to other domain-specific language. In the C# chapter, the expression tree part demonstrated compiling an arithmetic expression tree into IL code at runtime, and execute it dynamically. The same approach can be used to translate an arithmetic expression tree to SQL query and execute it inside SQL Server.

```csharp
public class InfixVisitor : BinaryArithmeticExpressionVisitor<string>
{
    protected override string VisitAdd
        (BinaryExpression add, LambdaExpression expression) => this.VisitBinary(add, "+", expression);

    protected override string VisitConstant
        (ConstantExpression constant, LambdaExpression expression) => constant.Value.ToString();

    protected override string VisitDivide
        (BinaryExpression divide, LambdaExpression expression) => this.VisitBinary(divide, "/", expression);

    protected override string VisitMultiply
        (BinaryExpression multiply, LambdaExpression expression) => this.VisitBinary(multiply, "*", expression);

    protected override string VisitParameter
        (ParameterExpression parameter, LambdaExpression expression) => $"@{parameter.Name}";

    protected override string VisitSubtract
        (BinaryExpression subtract, LambdaExpression expression) => this.VisitBinary(subtract, "-", expression);

    private string VisitBinary
        (BinaryExpression binary, string @operator, LambdaExpression expression) =>
            $"({this.VisitNode(binary.Left, expression)} {@operator} {this.VisitNode(binary.Right, expression)})";
}
```

Please see the expression tree part in the C# chapter for the definition of BinaryArithmeticExpressionVisitor<T>. Above InfixVisitor can traverse an arithmetic expression tree, and output infix expression string, which can work in SQL:

```csharp
internal static partial class ExpressionTree
{
    internal static void Translate()
    {
        InfixVisitor infixVisitor = new InfixVisitor();
        Expression<Func<double, double, double>> expression1 = (a, b) => a * a + b * b;
        string infixExpression1 = infixVisitor.VisitBody(expression1);
        Trace.WriteLine(infixExpression1); // ((@a * @a) + (@b * @b))

        Expression<Func<double, double, double, double, double, double>> expression2 =
            (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
        string infixExpression2 = infixVisitor.VisitBody(expression2);
        Trace.WriteLine(infixExpression2); // (((@a + @b) - ((@c * @d) / 2)) + (@e * 3))
    }
}
```

Notice @ is prepended to parameter name, so that the result expression string can be used in SQL query as SELECT expression:

```sql
public static partial class BinaryArithmeticTranslator
{
    [SuppressMessage("Microsoft.Security", "CA2100:Review SQL queries for security vulnerabilities")]
    internal static double ExecuteSql(
        string connection,
        string arithmeticExpression,
        IEnumerable<KeyValuePair<string, double>> parameters)
    {
        using (SqlConnection sqlConnection = new SqlConnection(connection))
        using (SqlCommand command = new SqlCommand($"SELECT {arithmeticExpression}", sqlConnection))
        {
            sqlConnection.Open();
            parameters.ForEach(parameter => command.Parameters.AddWithValue(parameter.Key, parameter.Value));
            return (double)command.ExecuteScalar();
        }
    }
}
```

And the following Sql method can accept an arithmetic expression tree, and emit a dynamic method the at runtime. When the returned dynamic method is called, the arithmetic expression tree will be translated to SQL query, and executed in SQL

```csharp
public static partial class BinaryArithmeticTranslator
{
    private static readonly InfixVisitor InfixVisitor = new InfixVisitor();

    public static TDelegate Sql<TDelegate>(
        Expression<TDelegate> expression, string connection = ConnectionStrings.LocalDb)
        where TDelegate : class
    {
        DynamicMethod dynamicMethod = new DynamicMethod(
            string.Empty,
            expression.ReturnType,
            expression.Parameters.Select(parameter => parameter.Type).ToArray(),
            typeof(BinaryArithmeticTranslator).Module);
        EmitIL(dynamicMethod.GetILGenerator(), InfixVisitor.VisitBody(expression), expression, connection);
        return dynamicMethod.CreateDelegate(typeof(TDelegate)) as TDelegate;
    }

    private static void EmitIL<TDelegate>(ILGenerator ilGenerator, string infixExpression, Expression<TDelegate> expression, string connection)
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
                nameof(ExecuteSql),
                BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.InvokeMethod));

        // Returns the result of ExecuteSql.
        ilGenerator.Emit(OpCodes.Ret);
    }
}
```

When a connection string is not provided to Sql method, it takes a default connection string of SQL Server LocalDB:

```csharp
internal static partial class ConnectionStrings
{
    internal const string LocalDb = @"Data Source=(LocalDB)\MSSQLLocalDB;Integrated Security=True;Connect Timeout=30";
}
```

This is how to use Sql method:

```csharp
internal static void Execute()
{
    Expression<Func<double, double, double>> expression1 = (a, b) => a * a + b * b;
    Func<double, double, double> local1 = expression1.Compile();
    Trace.WriteLine(local1(1, 2)); // 5
    Func<double, double, double> remote1 = BinaryArithmeticTranslator.Sql(expression1);
    Trace.WriteLine(remote1(1, 2)); // 5

    Expression<Func<double, double, double, double, double, double>> expression2 =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
    Func<double, double, double, double, double, double> local2 = expression2.Compile();
    Trace.WriteLine(local2(1, 2, 3, 4, 5)); // 12
    Func<double, double, double, double, double, double> remote2 = BinaryArithmeticTranslator.Sql(expression2);
    Trace.WriteLine(remote2(1, 2, 3, 4, 5)); // 12
}
```

As fore mentioned, the Expression<TDelegate>.Compile method emits a method that executes the arithmetic computation locally in CLR. In contrast, BinaryArithmeticTranslator.Sql emits a method that calls ExecuteSql and executes the arithmetic computation remotely in a SQL Server.

## Trace SQL query execution

It would be nice if the actual SQL query execution can be observed. SQL Server provides a free tool SQL Server Profiler for this. FOr this tutorial, a little bit configuration is needed. Start SQL Server Profiler, Go to File => Templates => New Template. In the General tab, type a trace template name:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_4.png)

In the Events Selection tab, select a few events to trace:

-   Stored Procedures

-   RPC: Completed
-   RPC: Starting

-   TSQL

-   SQL: BatchCompleted
-   SQL: BatchStarting

-   Transactions

-   TM: Begin Tran completed
-   TM: Begin Tran starting
-   TM: Commit Tran completed
-   TM: Commit Tran starting
-   TM: Rollback Tran completed
-   TM: Rollback Tran starting

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_8.png)

Click Save to save this trace template.

Another optional configuration is font. The default font is [Lucida Console](https://en.wikipedia.org/wiki/Lucida#Lucida_Console). It can be changed to Visual Studio’s font ([Consolas](https://en.wikipedia.org/wiki/Consolas) by default) for visual consistency.

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_16.png)

To start tracing, Click File => New Trace, specify Server name as (LocalDB)\\MSSQLLocalDB, which is the same as the Data Source value in above connection string:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_10.png)

Click Connect, the Trace Properties dialog pops up. Select the trace template just created:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_12.png)

Click Run, the trace is started. Now, execute above code that calls BinaryArithmeticTranslator.Sql, the following events are traced:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_10.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_22.png)

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_thumb_11.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-1_13528/image_24.png)

And the executed SQL commands prove that the arithmetic expressions are executed remotely in SQL Server:

```sql
exec sp_executesql N'SELECT ((@a * @a) + (@b * @b))',N'@a float,@b float',@a=1,@b=2

exec sp_executesql N'SELECT (((@a + @b) - ((@c * @d) / 2)) + (@e * 3))',N'@a float,@b float,@c float,@d float,@e float',@a=1,@b=2,@c=3,@d=4,@e=5
```