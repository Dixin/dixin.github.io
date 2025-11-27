---
title: "Entity Framework and LINQ to Entities (8) Transactions"
published: 2016-02-10
description: "As discussed above, by default DbContext.SaveChanges execute all data creation, update and deletion in a transaction, so that all the work can succeed or fail as a unit. The following example tries to"
image: ""
tags: [".NET", "C#", "Entity Framework", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions**](/posts/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions")

As discussed above, by default DbContext.SaveChanges execute all data creation, update and deletion in a transaction, so that all the work can succeed or fail as a unit. The following example tries to update 2 entities, so there will be 2 UPDATE statements in the transaction:

```csharp
internal static partial class Transactions
{
    internal static void Default()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            ProductCategory category = adventureWorks.ProductCategories.First();
            category.Name = "Update"; // Valid value.
            ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First();
            subcategory.ProductCategoryID = -1; // Invalid value.
            try
            {
                adventureWorks.SaveChanges();
            }
            catch (DbUpdateException exception)
            {
                Trace.WriteLine(exception);
                // System.Data.Entity.Infrastructure.DbUpdateException: An error occurred while updating the entries. See the inner exception for details.
                // ---> System.Data.Entity.Core.UpdateException: An error occurred while updating the entries. See the inner exception for details. 
                // ---> System.Data.SqlClient.SqlException: The UPDATE statement conflicted with the FOREIGN KEY constraint "FK_ProductSubcategory_ProductCategory_ProductCategoryID". The conflict occurred in database "D:\ONEDRIVE\WORKS\DRAFTS\CODESNIPPETS\DATA\ADVENTUREWORKS_DATA.MDF", table "Production.ProductCategory", column 'ProductCategoryID'. The statement has been terminated.
                adventureWorks.Entry(category).Reload();
                Trace.WriteLine(category.Name); // Accessories
                adventureWorks.Entry(subcategory).Reload();
                Trace.WriteLine(subcategory.ProductCategoryID); // 1
            }
        }
    }
}
```

The category entity has valid properties, so its UPDATE statement executes successfully. The subcategory has a invalid foreign key value, so tis UPDATE statement fails. As a result, Entity Framework rollbacks the entire session, and throws DbUpdateException. Then, if querying these 2 entities again, they both have the original property values before update. In this example, there are 6 SQL statements in total: 2 SELECT statements to query entities, 2 UPDATE statements in a transaction, and 2 SELECT statements to query the entities again:

```sql
SELECT TOP (1) 
    [c].[ProductCategoryID] AS [ProductCategoryID], 
    [c].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [c]

SELECT TOP (1) 
    [c].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [c].[Name] AS [Name], 
    [c].[ProductCategoryID] AS [ProductCategoryID]
    FROM [Production].[ProductSubcategory] AS [c]

BEGIN TRANSACTION
    exec sp_executesql N'UPDATE [Production].[ProductCategory]
    SET [Name] = @0
    WHERE ([ProductCategoryID] = @1)
    ',N'@0 nvarchar(50),@1 int',@0=N'Update',@1=4

    exec sp_executesql N'UPDATE [Production].[ProductSubcategory]
    SET [ProductCategoryID] = @0
    WHERE ([ProductSubcategoryID] = @1)
    ',N'@0 int,@1 int',@0=-1,@1=1
ROLLBACK TRANSACTION

SELECT TOP (1) 
    [c].[ProductCategoryID] AS [ProductCategoryID], 
    [c].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [c]

SELECT TOP (1) 
    [c].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [c].[ProductCategoryID] AS [ProductCategoryID], 
    [c].[Name] AS [Name]
    FROM [Production].[ProductSubcategory] AS [c]
```

## DbContextTransaction

In Entity Framework, there are some options to customize or control the transaction. Database.BeginTransaction method can start a transaction, and returns a System.Data.Entity.DbContextTransaction object.

```sql
internal static partial class Transactions
{
    internal static void DbContextTransaction()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        using (DbContextTransaction transaction = adventureWorks.Database.BeginTransaction(
            IsolationLevel.ReadUncommitted))
        {
            try
            {
                Trace.WriteLine(adventureWorks.QueryCurrentIsolationLevel()); // ReadUncommitted

                ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
                adventureWorks.ProductCategories.Add(category);
                Trace.WriteLine(adventureWorks.SaveChanges()); // 1

                Trace.WriteLine(adventureWorks.Database.ExecuteSqlCommand(
                    "DELETE FROM [Production].[ProductCategory] WHERE [Name] = {0}",
                    nameof(ProductCategory))); // 1
                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}
```

When calling Database.BeginTransaction, the transaction’s [isolation level](https://technet.microsoft.com/en-us/library/ms189122.aspx) can be optionally specified. If an isolation level is not provided for BeginTransaction, it will be read committed by default. Here BeginTransaction is called with System.Data.IsolationLevel.ReadUncommitted, the lowest isolation level. Internally, Entity Framework calls ADO.NET to start the transaction, and ADO.NET converts IsolationLevel enumeration to System.Data.SqlClient.TdsEnums.TransactionManagerIsolationLevel enumeration:

```csharp
namespace System.Data.SqlClient
{
    internal static class TdsEnums
    {
        internal enum TransactionManagerIsolationLevel
        {
            Unspecified, // 0
            ReadUncommitted, // 1
            ReadCommitted, // 2
            RepeatableRead, // 3
            Serializable, // 4
            Snapshot // 5
        }
    }
}
```

Then value 3 (ReadUncommitted) is written to a packet (represented by System.Data.SqlClient.SNIPacket class), and sent to SQL database via TDS protocol. There is no SQL statement like [SET TRANSACTION ISOLATION LEVEL](https://msdn.microsoft.com/en-us/library/ms173763.aspx) executed, so the actual isolation level cannot be logged by Entity Framework, or traced by SQL Profiler. In above example, QueryCurrentIsolationLevel is called to verify the current transaction’s isolation level. It is an extension method of DbContext:

```sql
public static partial class DbContextExtensions
{
    public const string CurrentIsolationLevelSql = @"
        SELECT
            CASE transaction_isolation_level
                WHEN 0 THEN N'Unspecified'
                WHEN 1 THEN N'ReadUncommitted'
                WHEN 2 THEN N'ReadCommitted'
                WHEN 3 THEN N'RepeatableRead'
                WHEN 4 THEN N'Serializable'
                WHEN 5 THEN N'Snapshot'
            END
        FROM sys.dm_exec_sessions
        WHERE session_id = @@SPID";

    public static string QueryCurrentIsolationLevel(this DbContext context)
    {
        context.NotNull(nameof(context));

        return context.Database.SqlQuery<string>(CurrentIsolationLevelSql).Single();
    }
}
```

It queries the server-scope view [sys.dm\_exec\_sessions](https://msdn.microsoft.com/en-us/library/ms176013.aspx) with current session id, which can be retrieved by built-in function [@@SPID](https://msdn.microsoft.com/en-us/library/ms189535.aspx). As expected, the query result is “ReadUncommitted”. After that, a category entity is created and SaveChanges is called. Entity Framework detects a transaction is explicitly created, so SaveChanges does not involve an individual transaction like all the previous examples. Then Database.ExecuteSqlCommnd is called to delete that category entity. Eventually, to commit the transaction, call DbContextTransaction.Commit, to rollback the transaction, call DbContextTransaction.Rollback. And the complete SQL execution is:

```sql
BEGIN TRANSACTION
    SELECT         
        CASE transaction_isolation_level
            WHEN 0 THEN N'Unspecified'
            WHEN 1 THEN N'ReadUncommitted'
            WHEN 2 THEN N'ReadCommitted'
            WHEN 3 THEN N'RepeatableRead'
            WHEN 4 THEN N'Serializable'
            WHEN 5 THEN N'Snapshot'
        END
    FROM sys.dm_exec_sessions
    WHERE session_id = @@SPID

    exec sp_executesql N'INSERT [Production].[ProductCategory]([Name])
    VALUES (@0)
    SELECT [ProductCategoryID]
    FROM [Production].[ProductCategory]
    WHERE @@ROWCOUNT > 0 AND [ProductCategoryID] = scope_identity()',N'@0 nvarchar(50)',@0=N'ProductCategory'

    exec sp_executesql N'DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0',N'@p0 nvarchar(15)',@p0=N'ProductCategory'
COMMIT TRANSACTION
```

## DbTransaction

Besides creating a transaction explicitly, Entity Framework can also use an existing ADO.NET transaction, represented by System.Data.Common.DbTransaction class. Such a DbTransaction object can be created by calling DbConnection.BeginTransaction, so an existing DbConnection object will be used here. To have Entity Framework use an existing connection as well, add a constructor for AdventureWorks class:

```csharp
public partial class AdventureWorks
{
    public AdventureWorks(DbConnection connection, bool contextOwnsConnection = false)
        : base(connection, contextOwnsConnection)
    {
    }
}
```

Now the DbContext can use an existing connection by calling above constructor, and it can use an existing transaction by calling Database.UseTransaction:

```sql
internal static void DbTransaction()
{
    using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
    {
        connection.Open();
        using (DbTransaction transaction = connection.BeginTransaction(IsolationLevel.Serializable))
        {
            try
            {
                using (AdventureWorks adventureWorks = new AdventureWorks(connection))
                {
                    adventureWorks.Database.UseTransaction(transaction);
                    Trace.WriteLine(adventureWorks.QueryCurrentIsolationLevel()); // Serializable

                    ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
                    adventureWorks.ProductCategories.Add(category);
                    Trace.WriteLine(adventureWorks.SaveChanges()); // 1.
                }

                using (DbCommand command = connection.CreateCommand())
                {
                    command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0";
                    DbParameter parameter = command.CreateParameter();
                    parameter.ParameterName = "@p0";
                    parameter.Value = nameof(ProductCategory);
                    command.Parameters.Add(parameter);
                    command.Transaction = transaction;
                    Trace.WriteLine(command.ExecuteNonQuery()); // 1
                }
                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    }
}
```

In this example, an DbConnection object is explicitly constructed. Similar to Database.BeginTransaction, DbConnection.BeginTransaction starts a transaction, and returns a DbTransaction object. Isolation level can be optionally provided to DbConnection.BeginTransaction as well. Here Serializable is specified, which is the highest isolation level. After that, DbContext uses the existing connection and transaction to verify current session’s isolation level, and create a category object. DbContext knows an existing transaction is used, so SaveChanges does not start an individual transaction. Then the connection is used again to execute a DbCommand to delete the category entity. Similar to DbContextTransaction again, eventually just call DbTransaction.Commit to commit the transaction, or call DbTransaction.Rollback to rollback. Here the executed SQL is exactly the same as previous DbContextTransaction example.

## TransactionScope

The DbContextTransaction object only work with its source DbContext object, and DbTransaction object only work with its source DbConnection object. .NET provides System.Transactions.TransactionScope to work across the lifecycle of multiple DbContext or DbConnection objects:

```sql
internal static void TransactionScope()
{
    using (TransactionScope scope = new TransactionScope(
        TransactionScopeOption.Required,
        new TransactionOptions() { IsolationLevel = System.Transactions.IsolationLevel.RepeatableRead }))
    {
        using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
        using (DbCommand command = connection.CreateCommand())
        {
            command.CommandText = DbContextExtensions.CurrentIsolationLevelSql;
            connection.Open();
            using (DbDataReader reader = command.ExecuteReader())
            {
                reader.Read();
                Trace.WriteLine(reader[0]); // RepeatableRead
            }
        }

        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
            adventureWorks.ProductCategories.Add(category);
            Trace.WriteLine(adventureWorks.SaveChanges()); // 1
        }

        using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
        using (DbCommand command = connection.CreateCommand())
        {
            command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0";
            DbParameter parameter = command.CreateParameter();
            parameter.ParameterName = "@p0";
            parameter.Value = nameof(ProductCategory);
            command.Parameters.Add(parameter);

            connection.Open();
            Trace.WriteLine(command.ExecuteNonQuery()); // 1
        }

        scope.Complete();
    }
}
```

When constructing TransactionScope, the isolation level is specified to be RepeatableRead. Unlike DbContextTransaction or DbTransaction, TransactionScope’s default isolation level is Serializable, if not specified. When SaveChanges is called, it detects the ambient transaction by calling System.Transactions.Transaction.Current, so it does not start an individual transaction. Here the executed SQL is the same as previous examples. TransactionScope can also be used with async programming, which will be discussed later.