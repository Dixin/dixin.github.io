---
title: "Understanding LINQ to SQL (8) Transaction"
published: 2010-04-22
description: "\\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to SQL", "LINQ via C# Series", "SQL Server", "TSQL"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

Database data Changing cannot be talked about without [transactions](http://en.wikipedia.org/wiki/Database_transaction).

## Implementing TRANSACTION (BEGIN / COMMIT / ROLLBACK)

The previous post has shown that, when invoking SubmitChanges(), the translated SQL (INSERT / UPDATE / DELETE) are always executed within a TRANSACTION.

Internally, DataContext.SubmitChanges() invokes DataContext.SubmitChanges(ConflictMode.FailOnFirstConflict). The latter is implemented like this:

```csharp
public class DataContext : IDisposable
{
    public virtual void SubmitChanges(ConflictMode failureMode)
    {
        if (this._isInSubmitChanges) // Concurrency is not allowed.
        {
            throw new InvalidOperationException(
                "The operation cannot be performed during a call to SubmitChanges.");
        }

        if (!this.ObjectTrackingEnabled) // Tracking must be enabled.
        {
            throw new InvalidOperationException(
                "Object tracking is not enabled for the current data context instance.");
        }

        this._isInSubmitChanges = true;

        try
        {
            if (Transaction.Current != null ||
                this.Transaction != null) // Custom transaction is specified.
            {
                // Process changes...
                return;
            }

            try
            {
                try
                {
                    this.Transaction = this.Connection.BeginTransaction(
                        IsolationLevel.ReadCommitted); // BEGIN TRANSACTION
                    // Process changes...
                    this.Transaction.Commit(); // COMMIT TRANSACTION
                }
                catch
                {
                    this.Transaction.Rollback(); // ROLLBACK TRANSACTION
                    throw; // Failure is notified to the caller.
                }

                return; // Successes.
            }
            finally
            {
                this.Transaction = null; // Finally block ensures clearing transaction.
            }
        }
        finally
        {
            this._isInSubmitChanges = false; // Finally block ensures resetting the flag.
        }
    }
}
```

It ensures all changes (INSERT / UPDATE / DELETE) are submitted within a TRANSACTION.

Conflict will be explained in the next post.

## Default transaction

If the DataContext.Transaction has never been set, it is null. In such scenarios LINQ to SQL will create a DbTransaction object to implement the TRANSACTION:

```csharp
try
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        Category[] categories = database.Categories.Take(2).ToArray();
        Console.WriteLine("Category[0]: {0}", categories[0].CategoryName); // Beverages
        categories[0].CategoryName = "Updated";
        // Updating should success.

        Console.WriteLine("Category[1]: {0}", categories[1].CategoryName); // Condiments
        categories[1].CategoryName = "Aotobots of Transformers";
        // Updating should fail in database, because CategoryName is NVARCHAR(15).

        database.SubmitChanges();
    }
}
catch (Exception exception)
{
    Console.WriteLine("{0}: {1}", exception.GetType(), exception.Message);

    // Checks whether any change has been submitted.
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        Category[] categories = database.Categories.Take(2).ToArray();
        // All records are not updated.
        Console.WriteLine("Category[0]: {0}", categories[0].CategoryName); // Beverages
        Console.WriteLine("Category[1]: {0}", categories[1].CategoryName); // Condiments
    }

    throw;
}
```

The above code tried to submit two changes, which are translated to two UPDATE statements:

```sql
BEGIN TRANSACTION 

exec sp_executesql N'UPDATE [dbo].[Categories]
SET [CategoryName] = @p2
WHERE ([CategoryID] = @p0) AND ([CategoryName] = @p1)',N'@p0 int,@p1 nvarchar(4000),@p2 nvarchar(4000)',@p0=1,@p1=N'Beverages',@p2=N'Updated'
-- Successes.

exec sp_executesql N'UPDATE [dbo].[Categories]
SET [CategoryName] = @p2
WHERE ([CategoryID] = @p0) AND ([CategoryName] = @p1)',N'@p0 int,@p1 nvarchar(4000),@p2 nvarchar(4000)',@p0=2,@p1=N'Condiments',@p2=N'Aotobots of Transformers'
-- Falis. SubmitChanges() catches a SqlException.

ROLLBACK TRANSACTION -- this.Transaction.Rollback();

-- SubmitChanges() re-throws the SqlException to caller.
```

Because the second UPDATE fails, Submit() catches a SqlException, then it invoke DbTransaction.Rollback() and re-throw the SqlException to the code in the upper call stack.

## Custom transactions

If DataContext.Transaction is set with a custom DbTransaction:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    database.Transaction = database.Connection.BeginTransaction();
    // Now DataContext.Transaction is not null.
}
```

or current submitting code is bracketed inside a TransactionScope:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    using (TransactionScope transactionScope = new TransactionScope())
    {
        // Transaction.Current is not null here.
    }
}
```

Then it is not LINQ to SQL’s responsibility to implement the logic of transactions.

Because this is a LINQ / functional programming series, not a SQL / ADO.NET series, the further details of transaction will not be explained. Please check [MSDN](http://msdn.microsoft.com/en-us/library/bb386995.aspx) and [Wikipedia](http://en.wikipedia.org/wiki/Database_transaction) for more information.