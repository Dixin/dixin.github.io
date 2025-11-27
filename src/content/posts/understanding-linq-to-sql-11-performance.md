---
title: "Understanding LINQ to SQL (11) Performance"
published: 2011-01-31
description: "\\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "LINQ", "LINQ to SQL", "LINQ via C# Series", "SQL Server", "TSQL"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

LINQ to SQL has a lot of great features like

-   strong typing
-   query compilation
-   deferred execution
-   declarative paradigm

etc., which are very productive. Of course, these cannot be free, and one price is the performance.

## O/R mapping overhead

Because LINQ to SQL is based on O/R mapping, one obvious overhead is, data changing usually requires data retrieving:

```csharp
private static void UpdateProductUnitPrice(int id, decimal unitPrice)
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        Product product = database.Products.Single(item => item.ProductID == id); // SELECT...
        product.UnitPrice = unitPrice; // UPDATE...
        database.SubmitChanges();
    }
}
```

Before updating an entity, that entity has to be retrieved by an extra SELECT query. This is slower than direct data update via ADO.NET:

```csharp
private static void UpdateProductUnitPrice(int id, decimal unitPrice)
{
    using (SqlConnection connection = new SqlConnection(
        "Data Source=localhost;Initial Catalog=Northwind;Integrated Security=True"))
    using (SqlCommand command = new SqlCommand(
        @"UPDATE [dbo].[Products] SET [UnitPrice] = @UnitPrice WHERE [ProductID] = @ProductID",
        connection))
    {
        command.Parameters.Add("@ProductID", SqlDbType.Int).Value = id;
        command.Parameters.Add("@UnitPrice", SqlDbType.Money).Value = unitPrice;

        connection.Open();
        command.Transaction = connection.BeginTransaction();
        command.ExecuteNonQuery(); // UPDATE...
        command.Transaction.Commit();
    }
}
```

The above imperative code specifies the “how to do” details with better performance.

For the same reason, some articles from Internet insist that, when updating data via LINQ to SQL, the above declarative code should be replaced by:

```csharp
private static void UpdateProductUnitPrice(int id, decimal unitPrice)
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        database.ExecuteCommand(
            "UPDATE [dbo].[Products] SET [UnitPrice] = {0} WHERE [ProductID] = {1}",
            id, 
            unitPrice);
    }
}
```

Or just create a stored procedure:

```sql
CREATE PROCEDURE [dbo].[UpdateProductUnitPrice]
(
    @ProductID INT,
    @UnitPrice MONEY
)
AS
BEGIN
    BEGIN TRANSACTION 
    UPDATE [dbo].[Products] SET [UnitPrice] = @UnitPrice WHERE [ProductID] = @ProductID
    COMMIT TRANSACTION
END
```

and map it as a method of NorthwindDataContext (explained in [this post](/posts/understanding-linq-to-sql-1-object-relational-mapping)):

```csharp
private static void UpdateProductUnitPrice(int id, decimal unitPrice)
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        database.UpdateProductUnitPrice(id, unitPrice);
    }
}
```

As a normal trade off for O/R mapping, a decision has to be made between performance overhead and programming productivity according to the case. In a developer’s perspective, if O/R mapping is chosen, I consistently choose the declarative LINQ code, unless this kind of overhead is unacceptable.

## Data retrieving overhead

After talking about the O/R mapping specific issue. Now look into the LINQ to SQL specific issues, for example, performance in the data retrieving process. The previous post has explained that the SQL translating and executing is complex. Actually, [the LINQ to SQL pipeline](http://blogs.msdn.com/b/charlie/archive/2007/08/06/linq-to-sql-pipeline-video-with-luca-bolognese-and-matt-warren.aspx) is similar to the compiler pipeline. It consists of about 15 steps to translate an C# expression tree to SQL statement, which can be categorized as:

> -   Convert: Invoke SqlProvider.BuildQuery() to convert the tree of Expression nodes into a tree of SqlNode nodes;
> -   Bind: Used visitor pattern to figure out the meanings of names according to the mapping info, like a property for a column, etc.;
> -   Flatten: Figure out the hierarchy of the query;
> -   Rewrite: for SQL Server 2000, if needed
> -   Reduce: Remove the unnecessary information from the tree.
> -   Parameterize
>     -   Format: Generate the SQL statement string;
>     -   Parameterize: Figure out the parameters, for example, a reference to a local variable should be a parameter in SQL;
>     -   Materialize: Executes the reader and convert the result back into typed objects.

So for each data retrieving, even for data retrieving which looks simple:

```csharp
private static Product[] RetrieveProducts(int productId)
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        return database.Products.Where(product => product.ProductID == productId)
                                .ToArray();
    }
}
```

LINQ to SQL goes through above steps to translate and execute the query. Fortunately, there is a built-in way to cache the translated query.

### Compiled query

When such a LINQ to SQL query is executed repeatedly, The CompiledQuery can be used to translate query for one time, and execute for multiple times:

```csharp
internal static class CompiledQueries
{
    private static readonly Func<NorthwindDataContext, int, Product[]> _retrieveProducts = 
        CompiledQuery.Compile((NorthwindDataContext database, int productId) =>
            database.Products.Where(product => product.ProductID == productId).ToArray());

    internal static Product[] RetrieveProducts(
        this NorthwindDataContext database, int productId)
    {
        return _retrieveProducts(database, productId);
    }
}
```

The new version of RetrieveProducts() gets better performance, because only when \_retrieveProducts is first time invoked, it internally invokes SqlProvider.Compile() to translate the query expression. And it also uses lock to make sure translating once in multi-threading scenarios.

### Static SQL / stored procedures without translating

Another way to avoid the translating overhead is to use static SQL or stored procedures, just as the above examples. Because this is a functional programming series, this article not dive into. For the details, [Scott Guthrie](http://en.wikipedia.org/wiki/Scott_Guthrie) already has some excellent articles:

-   [LINQ to SQL (Part 6: Retrieving Data Using Stored Procedures)](http://weblogs.asp.net/scottgu/archive/2007/08/16/linq-to-sql-part-6-retrieving-data-using-stored-procedures.aspx)
-   [LINQ to SQL (Part 7: Updating our Database using Stored Procedures)](http://weblogs.asp.net/scottgu/archive/2007/08/23/linq-to-sql-part-7-updating-our-database-using-stored-procedures.aspx)
-   [LINQ to SQL (Part 8: Executing Custom SQL Expressions)](http://weblogs.asp.net/scottgu/archive/2007/08/27/linq-to-sql-part-8-executing-custom-sql-expressions.aspx)

## Data changing overhead

By looking into the data updating process, it also needs a lot of work:

-   Begins transaction
-   Processes the changes (ChangeProcessor)
    -   Walks through the objects to identify the changes
    -   Determines the order of the changes
    -   Executes the changings
        -   LINQ queries may be needed to execute the changings, like the first example in this article, an object needs to be retrieved before changed, then the above whole process of data retrieving will be went through
        -   If there is user customization, it will be executed, for example, a table’s INSERT / UPDATE / DELETE can be customized in the O/R designer

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_6DCBF16A.png "image")

It is important to keep these overhead in mind.

### Bulk deleting / updating

Another thing to be aware is the bulk deleting:

```csharp
private static void DeleteProducts(int categoryId)
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        database.Products.DeleteAllOnSubmit(
            database.Products.Where(product => product.CategoryID == categoryId));
        database.SubmitChanges();
    }
}
```

The expected SQL should be like:

```sql
BEGIN TRANSACTION 
exec sp_executesql N'DELETE FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] = @p0',N'@p0 int',@p0=9
COMMIT TRANSACTION
```

Hoverer, as fore mentioned, the actual SQL is to retrieving the entities, and then delete them one by one:

```sql
-- Retrieves the entities to be deleted:
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] = @p0',N'@p0 int',@p0=9

-- Deletes the retrieved entities one by one:
BEGIN TRANSACTION 
exec sp_executesql N'DELETE FROM [dbo].[Products] WHERE ([ProductID] = @p0) AND ([ProductName] = @p1) AND ([SupplierID] IS NULL) AND ([CategoryID] = @p2) AND ([QuantityPerUnit] IS NULL) AND ([UnitPrice] = @p3) AND ([UnitsInStock] = @p4) AND ([UnitsOnOrder] = @p5) AND ([ReorderLevel] = @p6) AND (NOT ([Discontinued] = 1))',N'@p0 int,@p1 nvarchar(4000),@p2 int,@p3 money,@p4 smallint,@p5 smallint,@p6 smallint',@p0=78,@p1=N'Optimus Prime',@p2=9,@p3=$0.0000,@p4=0,@p5=0,@p6=0
exec sp_executesql N'DELETE FROM [dbo].[Products] WHERE ([ProductID] = @p0) AND ([ProductName] = @p1) AND ([SupplierID] IS NULL) AND ([CategoryID] = @p2) AND ([QuantityPerUnit] IS NULL) AND ([UnitPrice] = @p3) AND ([UnitsInStock] = @p4) AND ([UnitsOnOrder] = @p5) AND ([ReorderLevel] = @p6) AND (NOT ([Discontinued] = 1))',N'@p0 int,@p1 nvarchar(4000),@p2 int,@p3 money,@p4 smallint,@p5 smallint,@p6 smallint',@p0=79,@p1=N'Bumble Bee',@p2=9,@p3=$0.0000,@p4=0,@p5=0,@p6=0
-- ...
COMMIT TRANSACTION
```

And the same to the bulk updating. This is really not effective and need to be aware. Here is already some solutions from the Internet, like [this one](http://www.aneyfamily.com/terryandann/post/2008/04/Batch-Updates-and-Deletes-with-LINQ-to-SQL.aspx). The idea is wrap the above SELECT statement into a INNER JOIN:

```sql
exec sp_executesql N'DELETE [dbo].[Products] FROM [dbo].[Products] AS [j0] 
INNER JOIN (   
SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] = @p0) AS [j1] 
ON ([j0].[ProductID] = [j1].[[Products])', -- The Primary Key
N'@p0 int',@p0=9
```

## Query plan overhead

The last thing is about the SQL Server [query plan](http://en.wikipedia.org/wiki/Query_plan). Before .NET 4.0, LINQ to SQL has an issue (not sure if it is a bug). LINQ to SQL internally uses ADO.NET, but it does not set the SqlParameter.Size for a variable-length argument, like argument of NVARCHAR type, etc. So for two queries with the same SQL but different argument length:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    database.Products.Where(product => product.ProductName == "A")
        .Select(product => product.ProductID).ToArray();

    // The same SQL and argument type, different argument length.
    database.Products.Where(product => product.ProductName == "AA")
        .Select(product => product.ProductID).ToArray();
}
```

Pay attention to the argument length in the translated SQL:

```sql
exec sp_executesql N'SELECT [t0].[ProductID]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] = @p0',N'@p0 nvarchar(1)',@p0=N'A'

exec sp_executesql N'SELECT [t0].[ProductID]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] = @p0',N'@p0 nvarchar(2)',@p0=N'AA'
```

Here is the overhead: The first query’s query plan cache is not reused by the second one:

```sql
SELECT sys.syscacheobjects.cacheobjtype, sys.dm_exec_cached_plans.usecounts, sys.syscacheobjects.[sql] FROM sys.syscacheobjects
INNER JOIN sys.dm_exec_cached_plans
ON sys.syscacheobjects.bucketid = sys.dm_exec_cached_plans.bucketid;
```

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_539DF983.png "image")

They actually use different query plans. Again, pay attention to the argument length in the \[sql\] column (@p0 nvarchar(2) / @p0 nvarchar(1)).

Fortunately, in .NET 4.0 this is fixed:

```csharp
internal static class SqlTypeSystem
{
    private abstract class ProviderBase : TypeSystemProvider
    {
        protected int? GetLargestDeclarableSize(SqlType declaredType)
        {
            SqlDbType sqlDbType = declaredType.SqlDbType;
            if (sqlDbType <= SqlDbType.Image)
            {
                switch (sqlDbType)
                {
                    case SqlDbType.Binary:
                    case SqlDbType.Image:
                        return 8000;
                }

                return null;
            }

            if (sqlDbType == SqlDbType.NVarChar)
            {
                return 4000; // Max length for NVARCHAR.
            }

            if (sqlDbType != SqlDbType.VarChar)
            {
                return null;
            }

            return 8000;
        }
    }
}
```

In this above example, the translated SQL becomes:

```sql
exec sp_executesql N'SELECT [t0].[ProductID]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] = @p0',N'@p0 nvarchar(4000)',@p0=N'A'

exec sp_executesql N'SELECT [t0].[ProductID]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] = @p0',N'@p0 nvarchar(4000)',@p0=N'AA'
```

So that they reuses the same query plan cache:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_0660D825.png "image")

Now the \[usecounts\] column is 2.