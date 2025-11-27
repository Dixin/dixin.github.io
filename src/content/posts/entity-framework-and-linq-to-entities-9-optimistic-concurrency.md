---
title: "Entity Framework and LINQ to Entities (9) Optimistic Concurrency"
published: 2016-02-10
description: "Conflicts can occur if the same piece of data is read and changed concurrently. Generally, there are 2  approaches:"
image: ""
tags: [".NET", "C#", "Entity Framework", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-8-optimistic-concurrency**](/posts/entity-framework-core-and-linq-to-entities-8-optimistic-concurrency "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-8-optimistic-concurrency")

Conflicts can occur if the same piece of data is read and changed concurrently. Generally, there are 2 [concurrency control](https://en.wikipedia.org/wiki/Concurrency_control) approaches:

-   Pessimistic concurrency: one database client can lock the data being accessed, in order to prevent other database clients to change that data concurrently. Entity Framework does not have built-in support for this approach.
-   Optimistic concurrency: This is how Entity Framework works with database. No data is locked in the database for CRUD. Any database client is allowed to read and change any data concurrently. As a result, concurrency conflict can happen.

To demonstrate Entity Framework’s behavior for concurrency, the following DbReaderWriter class is defined as database CRUD client:

```csharp
internal partial class DbReaderWriter : IDisposable
{
    private readonly DbContext context;

    internal DbReaderWriter(DbContext context)
    {
        this.context = context;
    }

    internal TEntity Read<TEntity>
        (params object[] keys) where TEntity : class => this.context.Set<TEntity>().Find(keys);

    internal int Write(Action change)
    {
        change();
        return this.context.SaveChanges();
    }

    internal DbSet<TEntity> Set<TEntity>() where TEntity : class => this.context.Set<TEntity>();

    public void Dispose() => this.context.Dispose();
}
```

Multiple DbReaderWriter objects can be be used to read and write data concurrently.

```csharp
internal static partial class Concurrency
{
    internal static void NoCheck() // Check no column, last client wins.
    {
        const int id = 1;
        using (DbReaderWriter readerWriter1 = new DbReaderWriter(new AdventureWorks()))
        using (DbReaderWriter readerWriter2 = new DbReaderWriter(new AdventureWorks()))
        {

            ProductCategory category1 = readerWriter1.Read<ProductCategory>(id);
            ProductCategory category2 = readerWriter2.Read<ProductCategory>(id);

            readerWriter1.Write(() => category1.Name = nameof(readerWriter1));
            readerWriter2.Write(() => category2.Name = nameof(readerWriter2)); // Win.
        }
        using (DbReaderWriter readerWriter3 = new DbReaderWriter(new AdventureWorks()))
        {
            ProductCategory category3 = readerWriter3.Read<ProductCategory>(id);
            Trace.WriteLine(category3.Name); // readerWriter2
        }
    }
}
```

Here 2 DbReaderWriter objects read and write data concurrently:

1.  readerWriter1 reads category with Name “Bikes”
2.  readerWriter1 reads category with Name “Bikes”. As fore mentioned, these 2 entities are independent 2 objects because they are are from different DbContext objects.
3.  readerWriter1 updates category’s Name from “Bikes” to “readerWriter1”:
    ```sql
    exec sp_executesql N'UPDATE [Production].[ProductCategory]
    SET [Name] = @0
    WHERE ([ProductCategoryID] = @1)
    ',N'@0 nvarchar(50),@1 int',@0=N'readerWriter1',@1=1
    ```
    
4.  At this moment, in database, this category’s Name is no longer “Bikes”
5.  readerWriter2 updates category’s Name from “Bikes” to “readerWriter2”:
    ```sql
    exec sp_executesql N'UPDATE [Production].[ProductCategory]
    SET [Name] = @0
    WHERE ([ProductCategoryID] = @1)
    ',N'@0 nvarchar(50),@1 int',@0=N'readerWriter2',@1=1
    ```
    

As discussed before, by default, when DbContext translates changes to UPDATE statements, primary key is used to locate the row. Apparently, above 2 UPDATE statements can both execute successfully, without concurrency conflict. This is the default behavior of Entity Framework, the last database client wins. So later when readerWriter3 reads the entity with the same primary key, the category entity’s Name is “readerWriter2”.

## Detect Concurrency conflicts

Concurrency conflicts can be detected by checking entities’ property values besides primary keys. To required Entity Framework to check a certain property, just add a System.ComponentModel.DataAnnotations.ConcurrencyCheckAttribute to it. Remember when defining ProductPhoto entity class, its ModifiedDate has a \[ConcurrencyCheck\] attribute:

```csharp
public partial class ProductPhoto
{
    [ConcurrencyCheck]
    public DateTime ModifiedDate { get; set; }
}
```

When Entity Framework translate changes of a photo, the ModifiedDate property will be checked too:

```csharp
internal static void ConcurrencyCheck()
{
    using (DbReaderWriter readerWriter1 = new DbReaderWriter(new AdventureWorks()))
    using (DbReaderWriter readerWriter2 = new DbReaderWriter(new AdventureWorks()))
    {
        const int id = 1;
        ProductPhoto photoCopy1 = readerWriter1.Read<ProductPhoto>(id);
        ProductPhoto photoCopy2 = readerWriter2.Read<ProductPhoto>(id);

        readerWriter1.Write(() =>
        {
            photoCopy1.LargePhotoFileName = nameof(readerWriter1);
            photoCopy1.ModifiedDate = DateTime.Now;
        });
        readerWriter2.Write(() =>
        {
            photoCopy2.LargePhotoFileName = nameof(readerWriter2);
            photoCopy2.ModifiedDate = DateTime.Now;
        });
        // System.Data.Entity.Infrastructure.DbUpdateConcurrencyException: Store update, insert, or delete statement affected an unexpected number of rows (0).Entities may have been modified or deleted since entities were loaded.See http://go.microsoft.com/fwlink/?LinkId=472540 for information on understanding and handling optimistic concurrency exceptions. 
        // ---> System.Data.Entity.Core.OptimisticConcurrencyException: Store update, insert, or delete statement affected an unexpected number of rows (0).Entities may have been modified or deleted since entities were loaded.See http://go.microsoft.com/fwlink/?LinkId=472540 for information on understanding and handling optimistic concurrency exceptions.
    }
}
```

In the translated SQL statement, the WHERE clause contains primary key ProductID and also original ModifiedDate value:

1.  readerWriter1 reads product with ModifiedDate “2008-04-30 00:00:00”
2.  readerWriter1 reads product with ModifiedDate “2008-04-30 00:00:00”
3.  readerWriter1 locates the product with primary key and ModifiedDate, and update its Name and ModifiedDate:
    ```sql
    exec sp_executesql N'UPDATE [Production].[ProductPhoto]
    SET [LargePhotoFileName] = @0, [ModifiedDate] = @1
    WHERE (([ProductPhotoID] = @2) AND ([ModifiedDate] = @3))
    ',N'@0 nvarchar(50),@1 datetime2(7),@2 int,@3 datetime2(7)',@0=N'readerWriter1',@1='2016-07-04 23:24:24.6053455',@2=1,@3='2008-04-30 00:00:00'
    ```
    
4.  At this moment, in database the product’s ModifiedDate is no longer “2008-04-30 00:00:00”
5.  Then readerWriter2 tries to locate the product with primary key and ModifiedDate, and update its Name and ModifiedDate:
    ```sql
    exec sp_executesql N'UPDATE [Production].[ProductPhoto]
    SET [LargePhotoFileName] = @0, [ModifiedDate] = @1
    WHERE (([ProductPhotoID] = @2) AND ([ModifiedDate] = @3))
    ',N'@0 nvarchar(50),@1 datetime2(7),@2 int,@3 datetime2(7)',@0=N'readerWriter1',@1='2016-07-04 23:24:24.6293420',@2=1,@3='2008-04-30 00:00:00'
    ```
    

This time readerWriter2 fails. Between readerWriter2 reads and writers a photo, this photo is changed by readerWriter1. So in readerWrtier2’s UPDATE statement cannot locate any row to update. Entity Framework detects that 0 row is updated, and throws System.Data.Entity.Infrastructure.DbUpdateConcurrencyException.

Another API for concurrency check is System.ComponentModel.DataAnnotations.TimestampAttribute. It can only be used for a byte\[\] property, which maps to a [rowversion](https://technet.microsoft.com/en-us/library/ms182776.aspx) (timestamp) column. For SQL database, these 2 terms rowversion and timestamp are the same thing. Timestamp is just a [synonym](https://technet.microsoft.com/en-us/library/ms177566.aspx) of rowversion data type. A row’s non nullable rowversion column is a 8 bytes (binary(8)) counter maintained by database, its value increases for each change of the row.

Microsoft’s AdventureWorks sample database does not have such a rowversion column, so create one for the \[Production\].\[Product\] table:

```csharp
ALTER TABLE [Production].[Product] ADD [RowVersion] rowversion NOT NULL
GO
```

Then add the mapping property to Product entity:

```csharp
public partial class Product
{
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    [Timestamp]
    public byte[] RowVersion { get; set; }
}
```

The following example update and and delete the same entity concurrently:

```csharp
internal static void RowVersion()
{
    using (DbReaderWriter readerWriter1 = new DbReaderWriter(new AdventureWorks()))
    using (DbReaderWriter readerWriter2 = new DbReaderWriter(new AdventureWorks()))
    {
        const int id = 999;
        Product productCopy1 = readerWriter1.Read<Product>(id);
        Trace.WriteLine(productCopy1.RowVersion.ToRowVersionString()); // 0x0000000000000803
        Product productCopy2 = readerWriter2.Read<Product>(id);
        Trace.WriteLine(productCopy2.RowVersion.ToRowVersionString()); // 0x0000000000000803

        readerWriter1.Write(() => productCopy1.Name = nameof(readerWriter1));
        Trace.WriteLine(productCopy1.RowVersion.ToRowVersionString()); // 0x00000000000324B1
        readerWriter2.Write(() => readerWriter2.Set<Product>().Remove(productCopy2));
        // System.Data.Entity.Infrastructure.DbUpdateConcurrencyException: Store update, insert, or delete statement affected an unexpected number of rows (0). Entities may have been modified or deleted since entities were loaded. See http://go.microsoft.com/fwlink/?LinkId=472540 for information on understanding and handling optimistic concurrency exceptions.
        // ---> System.Data.Entity.Core.OptimisticConcurrencyException: Store update, insert, or delete statement affected an unexpected number of rows (0). Entities may have been modified or deleted since entities were loaded. See http://go.microsoft.com/fwlink/?LinkId=472540 for information on understanding and handling optimistic concurrency exceptions.
    }
}
```

Above ToRowVersionString is an extension method to get a readable string representation from a rowversion, which is an array of 8 System.Byte values in .NET:

```csharp
public static string ToRowVersionString(this byte[] rowVersion) =>
    $"0x{BitConverter.ToString(rowVersion).Replace("-", string.Empty)}";
```

When updating and deleting photo entities, its auto generated RowVersion property value is checked too. So this is how it works:

1.  readerWriter1 reads photo with RowVersion 0x0000000000000803
2.  readerWriter2 reads photo with RowVersion 0x0000000000000803
3.  readerWriter1 locates the photo with primary key and RowVersion, and update its RowVersion. Regarding database will automatically increase the RowVersion value, Entity Framework also queries the increased RowVersion value with the primary key:
    ```sql
    exec sp_executesql N'UPDATE [Production].[Product]
    SET [Name] = @0
    WHERE (([ProductID] = @1) AND ([RowVersion] = @2))
    SELECT [RowVersion]
    FROM [Production].[Product]
    WHERE @@ROWCOUNT > 0 AND [ProductID] = @1',N'@0 nvarchar(50),@1 int,@2 binary(8)',@0=N'readerWriter1',@1=999,@2=0x0000000000000803
    ```
    
4.  At this moment, in database the product’s RowVersion is no longer 0x0000000000000803.
5.  Then readerWriter2 tries to locate the product with primary key and RowVersion, and delete it
    ```sql
    exec sp_executesql N'DELETE [Production].[Product]
    WHERE (([ProductID] = @0) AND ([RowVersion] = @1))',N'@0 int,@1 binary(8)',@0=999,@1=0x0000000000000803
    ```
    

The deletion fails because the concurrent update changes the RowVersion, and the row cannot be located with the primary key and RowVersion. Again, Entity Framework detects 0 row is deleted, and throws DbUpdateConcurrencyException.

## Resolve concurrency conflicts

As fore mentioned, when SaveChanges detects concurrency conflict, it throws DbUpdateConcurrencyException:

```csharp
namespace System.Data.Entity.Infrastructure
{
    using System.Collections.Generic;

    public class DbUpdateException : DataException
    {
        public IEnumerable<DbEntityEntry> Entries { get; }
    }

    public class DbUpdateConcurrencyException : DbUpdateException
    {
    }
}
```

DbUpdateConcurrencyException has an Entries property, inherited from DbUpdateException. Entries returns a sequence of DbEntityEntry objects, representing the conflicting entities’ tracking information.

So the basic idea of resolving concurrency conflicts, is to handle DbUpdateConcurrencyException and retry SaveChanges:

```csharp
internal partial class DbReaderWriter
{
    internal int Write(Action change, Action<IEnumerable<DbEntityEntry>> handleDbUpdateConcurrencyException, int retryCount = 3)
    {
        change();
        for (int retry = 1; retry < retryCount; retry++)
        {
            try
            {
                return this.context.SaveChanges();
            }
            catch (DbUpdateConcurrencyException exception)
            {
                handleDbUpdateConcurrencyException(exception.Entries);
            }
        }
        return this.context.SaveChanges();
    }
}
```

In the above Write overload, if SaveChanges throws DbUpdateConcurrencyException, the handleDbUpdateConcurrencyException function is called. This function is expected to handle the exception and resolve the conflicts properly. Then SaveChanges is called again. If the last retry of SaveChanges still throws DbUpdateConcurrencyException, the exception is not caught or handled here, but thrown to the caller of Write.

### Retain database values (database wins)

Similar to previous examples, the following example constructs 2 DbReaderWriter objects to update a product concurrently:

```csharp
internal static void UpdateProduct(Action<DbEntityEntry> resolveProductConflict)
{
    const int id = 950;
    using (DbReaderWriter readerWriter1 = new DbReaderWriter(new AdventureWorks()))
    using (DbReaderWriter readerWriter2 = new DbReaderWriter(new AdventureWorks()))
    {
        Product productCopy1 = readerWriter1.Read<Product>(id);
        Product productCopy2 = readerWriter2.Read<Product>(id);
        readerWriter1.Write(() =>
            {
                productCopy1.Name = nameof(readerWriter1);
                productCopy1.ListPrice = 100;
            });
        readerWriter2.Write(
            change: () =>
                {
                    productCopy2.Name = nameof(readerWriter2);
                    productCopy2.ProductSubcategoryID = 1;
                },
            handleDbUpdateConcurrencyException: exception =>
                {
                    // Logging.
                    DbEntityEntry tracking = exception.Entries.Single();
                    Product original = (Product)tracking.OriginalValues.ToObject();
                    Product updateTo = (Product)tracking.CurrentValues.ToObject();
                    Product database = productCopy1; // Values saved in database.

                    Trace.WriteLine(
                        $"Original:  ({original.Name},   {original.ListPrice}, {original.ProductSubcategoryID}, {original.RowVersion.ToRowVersionString()})");
                    Trace.WriteLine(
                        $"Database:  ({database.Name}, {database.ListPrice}, {database.ProductSubcategoryID}, {database.RowVersion.ToRowVersionString()})");
                    Trace.WriteLine(
                        $"Update to: ({updateTo.Name}, {updateTo.ListPrice}, {updateTo.ProductSubcategoryID})");

                    // Resolve product conflict.
                    resolveProductConflict(tracking);
                });
    }

    using (DbReaderWriter readerWriter3 = new DbReaderWriter(new AdventureWorks()))
    {
        Product resolved = readerWriter3.Read<Product>(id);
        Trace.WriteLine(
            $"Resolved:  ({resolved.Name}, {resolved.ListPrice}, {resolved.ProductSubcategoryID}, {resolved.RowVersion.ToRowVersionString()})");
    }
}
```

Here the concurrency conflict happens:

1.  readerWriter2 reads product, the RowVersion is 0x00000000000007D1
2.  readerWriter1 locates product with primary key ProductID and original RowVersion 0x00000000000007D1, and updates product’s Name and ListPrice. After the update, in database, product’s Rowversion is increased to 0x0000000000036335
    ```sql
    exec sp_executesql N'UPDATE [Production].[Product]
    SET [Name] = @0, [ListPrice] = @1
    WHERE (([ProductID] = @2) AND ([RowVersion] = @3))
    SELECT [RowVersion]
    FROM [Production].[Product]
    WHERE @@ROWCOUNT > 0 AND [ProductID] = @2',N'@0 nvarchar(50),@1 decimal(18,2),@2 int,@3 binary(8)',@0=N'readerWriter1',@1=100.00,@2=950,@3=0x00000000000007D1
    ```
    
3.  readerWriter2 tries to locate product with primary key and original RowVersion 0x00000000000007D1, and update product’s Name and ProductSubcategoryID.
    ```sql
    exec sp_executesql N'UPDATE [Production].[Product]
    SET [Name] = @0, [ProductSubcategoryID] = @1
    WHERE (([ProductID] = @2) AND ([RowVersion] = @3))
    SELECT [RowVersion]
    FROM [Production].[Product]
    WHERE @@ROWCOUNT > 0 AND [ProductID] = @2',N'@0 nvarchar(50),@1 int,@2 int,@3 binary(8)',@0=N'readerWriter2',@1=1,@2=950,@3=0x00000000000007D1
    ```
    
4.  readerWriter2 fails to update product, because it cannot locate the product with original RowVersion 0x00000000000007D1. In ReaderWriter.Write, SaveChanges throws handleDbUpdateConcurrencyException.

As a result, the provided handleDbUpdateConcurrencyException function is called, it retrieves the conflicting product’s tracking information from DbUpdateConcurrencyException.Entries, and logs these information:

-   product’s original property values, which are read by readerWriter2
-   product’s property values in database, which are already updated to database by readerWriter1 at this moment
-   product’s current property values, which should be updated to database by readerWriter2, but failed.

Then it calls resolveProductConflict function to actually resolve the conflict.

After these are done, DbReaderWriter.Write’s retry logic calls SaveChanges again. This time, SaveChanges should succeed, becuase there is no conflict anymore (In this example, there are only 2 database clients reading/writing data concurrently. In reality, the concurrency can be higher, an appropriate retry count or retry strategy should be specified.). Eventually, readerWriter3 reads the product from database, verify its property values after 2 concurrent updates.

So the question is, how should resolveProductConflict function resolve the conflict? One simple option, called “database wins”, is to give up the client update, and let database retain whatever values it has for that entity. This seems to be easy – just catch DbUpdateConcurrencyException and do nothing, then database naturally wins, and retains its values:

```csharp
internal partial class DbReaderWriter
{
    internal int WriteDatabaseWins(Action change)
    {
        change();
        try
        {
            return this.context.SaveChanges();
        }
        catch (DbUpdateConcurrencyException)
        {
            return 0;
            // this.context is in a corrupted state.
        }
    }
}
```

However, handling conflict with this approach can leave the DbContext, the entity to update, and the entity’s tracking information in a corrupted state. For the caller, since the change saving is done, the entity’s property values should be in sync with database values, but the values can be out of sync and still conflicting. Also, an entity to update has a tracking state Modified, after change saving is done, its tracking state can be still Modified. A much safer approach is to reload and refresh the entity:

```csharp
internal static void DatabaseWins() =>
    UpdateProduct(resolveProductConflict: tracking =>
        {
            Trace.WriteLine(tracking.State); // Modified
            Trace.WriteLine(tracking.Property(nameof(Product.Name)).IsModified); // True
            Trace.WriteLine(tracking.Property(nameof(Product.ListPrice)).IsModified); // False
            Trace.WriteLine(tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified); // True

            tracking.Reload();

            Trace.WriteLine(tracking.State); // Unchanged
            Trace.WriteLine(tracking.Property(nameof(Product.Name)).IsModified); // False
            Trace.WriteLine(tracking.Property(nameof(Product.ListPrice)).IsModified); // False
            Trace.WriteLine(tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified); // False
        });
// Original:  (ML Crankset,   256.4900, 8, 0x00000000000007D1)
// Database:  (readerWriter1, 100.0000, 8, 0x0000000000036335)
// Update to: (readerWriter2, 256.4900, 1)
// Resolved:  (readerWriter1, 100.0000, 8, 0x0000000000036335)
```

UpdateProduct is called with a resolveProductConflict function, which resolves the conflict by calling Reload method on the DbEntityEntry object representing the conflicting product’s tracking information:

1.  As fore mentioned, DbEntityEntry.Reload executes a SELECT statement to read the product’s property values from database
2.  Reload also refresh the product entity and all tracking information:

-   product entity’s property values are refreshed to the queried database values
-   the tracked original property values, represented by tracking.OriginalValues, are refreshed to the queried database values
-   the tracked current property values, represented by tracking.CurrentValues, are refreshed to the queried database values
-   tracking.State is also refreshed to Unchanged.

4.  At this moment, product entity is refurnished, as if it is just initially read from database.
5.  When DbReaderWriter.Write’s retry logic calls SaveChanges again, no changed entity is detected. SaveChanges succeeds without executing any SQL, and returns 0. As a result, readerWriter2 gives up updating any value to database, and whatever values in database are retained.

Later, when readerWriter3 reads the product again, product has database values, with Name and ListPrice updated by readerWrtier1.

### Overwrite database values (client wins)

Another simple option, called “client wins”, is to disregard values in database, and overwrite them with whatever data submitted from client.

```sql
internal static void ClientWins() =>
    UpdateProduct(resolveProductConflict: tracking =>
        {
            DbPropertyValues databaseValues = tracking.GetDatabaseValues();
            // Refresh original values, which go to WHERE clause.
            tracking.OriginalValues.SetValues(databaseValues);

            Trace.WriteLine(tracking.State); // Modified
            Trace.WriteLine(tracking.Property(nameof(Product.Name)).IsModified); // True
            Trace.WriteLine(tracking.Property(nameof(Product.ListPrice)).IsModified); // True
            Trace.WriteLine(tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified); // True
        });
// Original:  (ML Crankset,   256.4900, 8, 0x00000000000007D1)
// Database:  (readerWriter1, 100.0000, 8, 0x0000000000036336)
// Update to: (readerWriter2, 256.4900, 1)
// Resolved:  (readerWriter2, 256.4900, 1, 0x0000000000036337)
```

The same conflict is resolved differently:

1.  As fore mentioned, DbEntityEntry.GetDatabaseValues executes a SELECT statement to read the product’s property values from database, and it does not impact the product entity or its tracking information. At this moment, since readerWriter2 updated product’s Name and ProductSubcategoryID, these 2 properties are still tracked as modified, and ListPrice is still tracked as unmodified.
2.  Manually refresh conflict.OriginalValues, the tracked original property values, to the queried database values.
3.  At this moment, tracking.State is still Modified. However, for the Name, ListPrice and ProductSubcategoryID properties of product, their values in tracking.OriginalValues are different from the values in tracking.CurrentValue. Now these 3 properties are all tracked as modified.
4.  When DbReaderWriter.Write’s retry logic calls SaveChanges again, product entity is detected to be updated. So Entity Framework translates the product change to a UPDATE statement. In the SET clause, since there are 3 properties tracked as modified, 3 columns are set. In the WHERE clause to locate the product with primary key and RowVersion again, and the RowVersion property value in updated tracking.OriginalValues is used. This time product can be located, and all 3 properties are updated. SaveChanges succeeds and returns 1
    ```sql
    exec sp_executesql N'UPDATE [Production].[Product]
    SET [Name] = @0, [ListPrice] = @1, [ProductSubcategoryID] = @2
    WHERE (([ProductID] = @3) AND ([RowVersion] = @4))
    SELECT [RowVersion]
    FROM [Production].[Product]
    WHERE @@ROWCOUNT > 0 AND [ProductID] = @3',N'@0 nvarchar(50),@1 decimal(18,2),@2 int,@3 int,@4 binary(8)',@0=N'readerWriter2',@1=256.49,@2=1,@3=950,@4=0x0000000000036336
    ```
    

Later, when readerWriter3 reads the product again, product has the Name, ListPrice and ProductSubcategoryID values from readerWrter2, their database values are overwritten.

### Merge with database values

A more complex option, is to merge the client values and database values. For each property:

-   If original value is different from database value, which means database value is already updated by other concurrent client, then give up updating this property, and retain the database value
-   If original value is the same as database value, which means no concurrency conflict for this property, then process normally

```sql
internal static void MergeClientAndDatabase() =>
    UpdateProduct(resolveProductConflict: tracking =>
        {
            DbPropertyValues databaseValues = tracking.GetDatabaseValues();
            DbPropertyValues originalValues = tracking.OriginalValues.Clone();
            // Refresh original values, which go to WHERE clause.
            tracking.OriginalValues.SetValues(databaseValues);
            databaseValues.PropertyNames // Navigation properties are not included.
                // If original value is updated in database,
                .Where(property => !object.Equals(originalValues[property], databaseValues[property]))
                // then give up update, and retain the database value.
                .ForEach(property => tracking.Property(property).IsModified = false);

            Trace.WriteLine(tracking.State); // Modified
            Trace.WriteLine(tracking.Property(nameof(Product.Name)).IsModified); // False
            Trace.WriteLine(tracking.Property(nameof(Product.ListPrice)).IsModified); // False
            Trace.WriteLine(tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified); // True
        });
// Original:  (ML Crankset,   256.4900, 8, 0x00000000000007D1)
// Database:  (readerWriter1, 100.0000, 8, 0x0000000000036338)
// Update to: (readerWriter2, 256.4900, 1)
// Resolved:  (readerWriter1, 100.0000, 1, 0x0000000000036339)
```

With this approach:

1.  Again, DbEntityEntry.GetDatabaseValues executes a SELECT statement to read the product’s property values from database
2.  Backup tracking.Original values, then refresh conflict.OriginalValues to the database values, so that these values can go to the translated WHERE clause. For Name and ListPrice, the backup original value is different from the database value, which is concurrently updated by readerWriter1. So their property state is refreshed to unmodified, and they will not go to the translated SET clause.
3.  At this moment, tracking.State is still Modified, but only ProductSubcategoryID does not conflict with database value, and will be updated normally
4.  When DbReaderWriter.Write’s retry logic calls SaveChanges again, Entity Framework translates the product change to a UPDATE statement, which has refreshed RowVersion in WHERE clause, and only ProductSubcategoryID in SET clause. And SaveChanges should successfully execute and return 1
    ```sql
    exec sp_executesql N'UPDATE [Production].[Product]
    SET [ProductSubcategoryID] = @0
    WHERE (([ProductID] = @1) AND ([RowVersion] = @2))
    SELECT [RowVersion]
    FROM [Production].[Product]
    WHERE @@ROWCOUNT > 0 AND [ProductID] = @1',N'@0 int,@1 int,@2 binary(8)',@0=1,@1=950,@2=0x0000000000036338
    ```
    

Later, when readerWriter3 reads the product, product has Name and ListPrice values from readerWrtier1, and ProductSubcategoryID value from readerWriter2.

## SaveChanges with concurrency conflict handling

Similar to above DbReaderWriter.Write method, a general SaveChanges method extension method for DbContext can be defined to handle concurrency conflict and apply simple retry logic:

```csharp
public static partial class DbContextExtensions
{
    public static int SaveChanges(
        this DbContext context, Action<IEnumerable<DbEntityEntry>> resolveConflicts, int retryCount = 3)
    {
        context.NotNull(nameof(context));
        resolveConflicts.NotNull(nameof(resolveConflicts));
        Argument.Range(retryCount > 0, $"{retryCount} must be greater than 0.", nameof(retryCount));

        for (int retry = 1; retry < retryCount; retry++)
        {
            try
            {
                return context.SaveChanges();
            }
            catch (DbUpdateConcurrencyException exception) when (retry < retryCount)
            {
                resolveConflicts(exception.Entries);
            }
        }
        return context.SaveChanges();
    }
}
```

To apply custom retry logic, Microsoft [Exception Handling Application Block](https://msdn.microsoft.com/en-us/library/dn440728.aspx) can be used. It is a library providing contracts and implementations for retry logic, and it can be installed from [Nuget](https://www.nuget.org/packages/EnterpriseLibrary.TransientFaultHandling/):

```csharp
Install-Package EnterpriseLibrary.TransientFaultHandling
```

Then a SaveChanges overload with customizable retry logic can be defined with the help of this library:

```csharp
public class TransientDetection<TException> : ITransientErrorDetectionStrategy
    where TException : Exception
{
    public bool IsTransient(Exception ex) => ex is TException;
}

public static partial class DbContextExtensions
{
    public static int SaveChanges(
        this DbContext context, Action<IEnumerable<DbEntityEntry>> resolveConflicts, RetryStrategy retryStrategy)
    {
        context.NotNull(nameof(context));
        resolveConflicts.NotNull(nameof(resolveConflicts));
        retryStrategy.NotNull(nameof(retryStrategy));

        RetryPolicy retryPolicy = new RetryPolicy(
            new TransientDetection<DbUpdateConcurrencyException>(), retryStrategy);
        retryPolicy.Retrying += (sender, e) => 
            resolveConflicts(((DbUpdateConcurrencyException)e.LastException).Entries);
        return retryPolicy.ExecuteAction(context.SaveChanges);
    }
}
```

Here Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.ITransientErrorDetectionStrategy is the contract to detect each exception, and determine whether the action should be retried. Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryStrategy is the contract of retry logic. Then Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryPolicy executes the action with the specified exception detection, exception handling, and retry logic together.

As discussed above, to resolve a concurrency conflict, the entity and its tracking information need to be refreshed. So the more specific SaveChanges overloads can be implemented by applying refresh for each conflict:

```csharp
public enum RefreshConflict
{
    StoreWins,

    ClientWins,

    MergeClinetAndStore
}

public static partial class DbContextExtensions
{
    public static int SaveChanges(this DbContext context, RefreshConflict refreshMode, int retryCount = 3)
    {
        context.NotNull(nameof(context));
        Argument.Range(retryCount > 0, $"{retryCount} must be greater than 0.", nameof(retryCount));

        return context.SaveChanges(
            conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryCount);
    }

    public static int SaveChanges(this DbContext context, RefreshConflict refreshMode, RetryStrategy retryStrategy)
    {
        context.NotNull(nameof(context));
        retryStrategy.NotNull(nameof(retryStrategy));

        return context.SaveChanges(
            conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryStrategy);
    }
}
```

Entity Framework already provides a System.Data.Entity.Core.Objects.RefreshMode enumeration, but it only has 2 members: StoreWins and ClientWins. So a RefreshConflict enumeration has to be defined with 3 members. And here the Refresh method is an extension method for DbEntityEntry:

```sql
public static partial class DbEntutyEntryExtensions
{
    public static DbEntityEntry Refresh(this DbEntityEntry tracking, RefreshConflict refreshMode)
    {
        tracking.NotNull(nameof(tracking));

        switch (refreshMode)
        {
            case RefreshConflict.StoreWins:
                {
                    // When entity is already deleted in database, Reload sets tracking state to Detached.
                    // When entity is already updated in database, Reload sets tracking state to Unchanged.
                    tracking.Reload(); // Execute SELECT.
                    // Hereafter, SaveChanges ignores this entity.
                    break;
                }
            case RefreshConflict.ClientWins:
                {
                    DbPropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
                    if (databaseValues == null)
                    {
                        // When entity is already deleted in database, there is nothing for client to win against.
                        // Manually set tracking state to Detached.
                        tracking.State = EntityState.Detached;
                        // Hereafter, SaveChanges ignores this entity.
                    }
                    else
                    {
                        // When entity is already updated in database, refresh original values, which go to in WHERE clause.
                        tracking.OriginalValues.SetValues(databaseValues);
                        // Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
                    }
                    break;
                }
            case RefreshConflict.MergeClinetAndStore:
                {
                    DbPropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
                    if (databaseValues == null)
                    {
                        // When entity is already deleted in database, there is nothing for client to merge with.
                        // Manually set tracking state to Detached.
                        tracking.State = EntityState.Detached;
                        // Hereafter, SaveChanges ignores this entity.
                    }
                    else
                    {
                        // When entity is already updated, refresh original values, which go to WHERE clause.
                        DbPropertyValues originalValues = tracking.OriginalValues.Clone();
                        tracking.OriginalValues.SetValues(databaseValues);
                        // If database has an different value for a property, then retain the database value.
                        databaseValues.PropertyNames // Navigation properties are not included.
                            .Where(property => !object.Equals(originalValues[property], databaseValues[property]))
                            .ForEach(property => tracking.Property(property).IsModified = false);
                        // Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
                    }
                    break;
                }
        }
        return tracking;
    }
}
```

This Refresh extension method covers the update conflict discussed above, as well as deletion conflict. When the currently entity is already deleted in database:

-   If refresh mode is StoreWins, DbEntityEntry.Load is called. It executes SELECT query. Since no entity can be read, Entity Frmaework knows this entity is already deleted in database. It refreshes the tracking state to Detached. This entity is off the tracking by DbContext. Later when SaveChanges is retried, it ignores this entity.
-   If refresh mode is ClientWins or Merge, DbEntityEntry.GetDatabaseValues is called. It executes SELECT query. Since no entity is read, it returns null. In this case, there is nothing for the client to win against or merge with. So entity’s tracking state is manually refreshed to Detached. And when SaveChanges is retried, it ignores this entity too.

Now the these SaveChanges extension methods can be used to manage concurrent conflict easily. For example:

```csharp
internal static void SaveChanges()
{
    using (AdventureWorks adventureWorks1 = new AdventureWorks())
    using (AdventureWorks adventureWorks2 = new AdventureWorks())
    {
        const int id = 950;
        Product productCopy1 = adventureWorks1.Products.Find(id);
        Product productCopy2 = adventureWorks2.Products.Find(id);

        productCopy1.Name = nameof(adventureWorks1);
        productCopy1.ListPrice = 100;
        adventureWorks1.SaveChanges();

        productCopy2.Name = nameof(adventureWorks2);
        productCopy2.ProductSubcategoryID = 1;
        adventureWorks2.SaveChanges(RefreshConflict.MergeClinetAndStore);
    }
}
```