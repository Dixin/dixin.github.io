---
title: "Entity Framework Core and LINQ to Entities in Depth (8) Optimistic Concurrency"
published: 2019-10-15
description: "Conflicts can occur if the same data is read and changed concurrently. Generally, there are 2  approaches:"
image: ""
tags: [".NET", ".NET Core", "C#", "EF Core", "Entity Framework Core", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: "Entity Framework Core"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core (EF Core) series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework (EF) series](/archive/?tag=Entity%20Framework)\]

Conflicts can occur if the same data is read and changed concurrently. Generally, there are 2 [concurrency control](https://en.wikipedia.org/wiki/Concurrency_control) approaches:

-   Pessimistic concurrency: one database client can lock the data being accessed, in order to prevent other database clients to change that same data concurrently.
-   Optimistic concurrency: Data is not locked in the database for client to CRUD. Any database client is allowed to read and change any data concurrently. As a result, concurrency conflicts can happen. This is how EF/Core work with database.

To demonstrate the behavior of EF/Core for concurrency, the following DbReaderWriter type is defined as database CRUD client:

```csharp
internal partial class DbReaderWriter : IDisposable
{
    private readonly DbContext context;

    internal DbReaderWriter(DbContext context) => this.context = context;

    internal TEntity Read<TEntity>(params object[] keys) where TEntity : class => 
        this.context.Set<TEntity>().Find(keys);

    internal int Write(Action change)
    {
        change();
        return this.context.SaveChanges();
    }

    internal DbSet<TEntity> Set<TEntity>() where TEntity : class => this.context.Set<TEntity>();

    public void Dispose() => this.context.Dispose();
}
```

Multiple DbReaderWriter instances can be be used to read and write data concurrently. For example:

```sql
internal static partial class Concurrency
{
    internal static void NoCheck(
        DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
    {
        int id = 1;
        ProductCategory categoryCopy1 = readerWriter1.Read<ProductCategory>(id);
        ProductCategory categoryCopy2 = readerWriter2.Read<ProductCategory>(id);

        readerWriter1.Write(() => categoryCopy1.Name = nameof(readerWriter1));
        // exec sp_executesql N'SET NOCOUNT ON;
        // UPDATE [Production].[ProductCategory] SET [Name] = @p0
        // WHERE [ProductCategoryID] = @p1;
        // SELECT @@ROWCOUNT;
        // ',N'@p1 int,@p0 nvarchar(50)',@p1=1,@p0=N'readerWriter1'
        readerWriter2.Write(() => categoryCopy2.Name = nameof(readerWriter2)); // Last client wins.
        // exec sp_executesql N'SET NOCOUNT ON;
        // UPDATE [Production].[ProductCategory] SET [Name] = @p0
        // WHERE [ProductCategoryID] = @p1;
        // SELECT @@ROWCOUNT;
        // ',N'@p1 int,@p0 nvarchar(50)',@p1=1,@p0=N'readerWriter2'

        ProductCategory category3 = readerWriter3.Read<ProductCategory>(id);
        category3.Name.WriteLine(); // readerWriter2
    }
}
```

In this example, multiple DbReaderWriter instances read and write data concurrently:

1.  readerWriter1 reads category “Bikes”
2.  readerWriter2 reads category “Bikes”. These 2 entities are independent because they are are from different DbContext instances.
3.  readerWriter1 updates category’s name from “Bikes” to “readerWriter1”. As previously discussed, by default EF/Core locate the category with its primary key.
4.  In database, this category’s name is no longer “Bikes”
5.  readerWriter2 updates category’s name from “Bikes” to “readerWriter2”. It locates the category with its primary key as well. The primary key is unchanged, so the same category can be located and the name can be changed.
6.  So later when readerWriter3 reads the entity with the same primary key, the category entity’s Name is “readerWriter2”.

## Detect Concurrency conflicts

Concurrency conflicts can be detected by checking entities’ property values besides primary keys. To required EF/Core to check a certain property, just add a System.ComponentModel.DataAnnotations.ConcurrencyCheckAttribute to it. Remember when defining ProductPhoto entity, its ModifiedDate has a \[ConcurrencyCheck\] attribute:

```csharp
public partial class ProductPhoto
{
    [ConcurrencyCheck]
    public DateTime ModifiedDate { get; set; }
}
```

This property is also called the concurrency token. When EF/Core translate changes of a photo, ModifiedDate property is checked along with the primary key to locate the photo:

```sql
internal static void ConcurrencyCheck(DbReaderWriter readerWriter1, DbReaderWriter readerWriter2)
{
    int id = 1;
    ProductPhoto photoCopy1 = readerWriter1.Read<ProductPhoto>(id);
    ProductPhoto photoCopy2 = readerWriter2.Read<ProductPhoto>(id);

    readerWriter1.Write(() =>
    {
        photoCopy1.LargePhotoFileName = nameof(readerWriter1);
        photoCopy1.ModifiedDate = DateTime.Now;
    });
    // exec sp_executesql N'SET NOCOUNT ON;
    // UPDATE [Production].[ProductPhoto] SET [LargePhotoFileName] = @p0, [ModifiedDate] = @p1
    // WHERE [ProductPhotoID] = @p2 AND [ModifiedDate] = @p3;
    // SELECT @@ROWCOUNT;
    // ',N'@p2 int,@p0 nvarchar(50),@p1 datetime2(7),@p3 datetime2(7)',@p2=1,@p0=N'readerWriter1',@p1='2017-01-25 22:04:25.9292433',@p3='2008-04-30 00:00:00'
    readerWriter2.Write(() =>
    {
        photoCopy2.LargePhotoFileName = nameof(readerWriter2);
        photoCopy2.ModifiedDate = DateTime.Now;
    });
    // exec sp_executesql N'SET NOCOUNT ON;
    // UPDATE [Production].[ProductPhoto] SET [LargePhotoFileName] = @p0, [ModifiedDate] = @p1
    // WHERE [ProductPhotoID] = @p2 AND [ModifiedDate] = @p3;
    // SELECT @@ROWCOUNT;
    // ',N'@p2 int,@p0 nvarchar(50),@p1 datetime2(7),@p3 datetime2(7)',@p2=1,@p0=N'readerWriter2',@p1='2017-01-25 22:04:59.1792263',@p3='2008-04-30 00:00:00'
}
```

In the translated SQL statement, the WHERE clause contains primary key and the original concurrency token. The following is how EF/Core check the concurrency conflicts:

1.  readerWriter1 reads photo with primary key 1, and modified date “2008-04-30 00:00:00”
2.  readerWriter2 reads the same photo with primary key 1, and modified date “2008-04-30 00:00:00”
3.  readerWriter1 locates the photo with primary key and original modified date, and update its large photo file name and modified date.
4.  In database the photo’s modified date is no longer the original value “2008-04-30 00:00:00”
5.  readerWriter2 tries to locate the photo with primary key and original modified date. However the provided modified date is outdated. EF/Core detect that 0 row is updated by the translated SQL, and throws DbUpdateConcurrencyException: Database operation expected to affect 1 row(s) but actually affected 0 row(s). Data may have been modified or deleted since entities were loaded. See [http://go.microsoft.com/fwlink/?LinkId=527962](http://go.microsoft.com/fwlink/?LinkId=527962) for information on understanding and handling optimistic concurrency exceptions.

Another option for concurrency check is System.ComponentModel.DataAnnotations.TimestampAttribute. It can only be used for a byte\[\] property, which is mapped from a [rowversion](https://technet.microsoft.com/en-us/library/ms182776.aspx) (timestamp) column. For SQL database, these 2 terms, rowversion and timestamp, are the same thing. timestamp is just a [synonym](https://technet.microsoft.com/en-us/library/ms177566.aspx) of rowversion data type. A row’s non-nullable rowversion column is a 8 bytes (binary(8)) counter maintained by database, its value increases for each change of the row.

Microsoft’s AdventureWorks sample database does not have such a rowversion column, so create one for the Production.Product table:

```csharp
ALTER TABLE [Production].[Product] ADD [RowVersion] rowversion NOT NULL
GO
```

Then define the mapping property for Product entity:

```csharp
public partial class Product
{
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    [Timestamp]
    public byte[] RowVersion { get; set; }

    [NotMapped]
    public string RowVersionString =>
        $"0x{BitConverter.ToUInt64(this.RowVersion.Reverse().ToArray(), 0).ToString("X16")}";
}
```

Now RowVersion property is the concurrency token. Regarding database automatically increases the RowVersion value, Rowversion also has the \[DatabaseGenerated(DatabaseGeneratedOption.Computed)\] attribute. The other RowVersionString property returns a readable representation of the byte array returned by RowVersion. It is not a part of the object-relational mapping, so it has a \[NotMapped\] attribute. The following example updates and and deletes the same product concurrently:

```sql
internal static void RowVersion(DbReaderWriter readerWriter1, DbReaderWriter readerWriter2)
{
    int id = 995;
    Product productCopy1 = readerWriter1.Read<Product>(id);
    productCopy1.RowVersionString.WriteLine(); // 0x0000000000000803

    Product productCopy2 = readerWriter2.Read<Product>(id);
    productCopy2.RowVersionString.WriteLine(); // 0x0000000000000803

    readerWriter1.Write(() => productCopy1.Name = nameof(readerWriter1));
    // exec sp_executesql N'SET NOCOUNT ON;
    // UPDATE [Production].[Product] SET [Name] = @p0
    // WHERE [ProductID] = @p1 AND [RowVersion] = @p2;
    // SELECT [RowVersion]
    // FROM [Production].[Product]
    // WHERE @@ROWCOUNT = 1 AND [ProductID] = @p1;
    // ',N'@p1 int,@p0 nvarchar(50),@p2 varbinary(8)',@p1=995,@p0=N'readerWriter1',@p2=0x0000000000000803
    productCopy1.RowVersionString.WriteLine(); // 0x00000000000324B1
    readerWriter2.Write(() => readerWriter2.Set<Product>().Remove(productCopy2));
    // exec sp_executesql N'SET NOCOUNT ON;
    // DELETE FROM [Production].[Product]
    // WHERE [ProductID] = @p0 AND [RowVersion] = @p1;
    // SELECT @@ROWCOUNT;
    // ',N'@p0 int,@p1 varbinary(8)',@p0=995,@p1=0x0000000000000803
}
```

When updating and deleting photo entities, its auto generated RowVersion property value is checked too. So this is how it works:

1.  readerWriter1 reads product with primary key 995 and row version 0x0000000000000803
2.  readerWriter2 reads product with the same primary key 995 and row version 0x0000000000000803
3.  readerWriter1 locates the photo with primary key and original row version, and update its name. Database automatically increases the photo’s row version. Since the row version is specified as \[DatabaseGenerated(DatabaseGeneratedOption.Computed)\], EF/Core also locate the photo with the primary key to query the increased row version, and update the entity at client side.
4.  In database the product’s row version is no longer 0x0000000000000803.
5.  Then readerWriter2 tries to locate the product with primary key and original row version, and delete it. No product can be found with outdated row version, EF/Core detect that 0 row is deleted, and throws DbUpdateConcurrencyException.

## Resolve concurrency conflicts

DbUpdateConcurrencyException is thrown when SaveChanges detects concurrency conflict:

```csharp
namespace Microsoft.EntityFrameworkCore
{
    public class DbUpdateException : Exception
    {
        public virtual IReadOnlyList<EntityEntry> Entries { get; }

        // Other members.
    }

    public class DbUpdateConcurrencyException : DbUpdateException
    {
        // Members.
    }
}
```

Inherited from DbUpdateException, DbUpdateConcurrencyException has an Entries property. Entries returns a sequence of EntityEntry instances, representing the conflicting entities’ tracking information. The basic idea of resolving concurrency conflicts, is to handle DbUpdateConcurrencyException and retry SaveChanges:

```csharp
internal partial class DbReaderWriter
{
    internal int Write(Action change, Action<DbUpdateConcurrencyException> handleException, int retryCount = 3)
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
                handleException(exception);
            }
        }
        return this.context.SaveChanges();
    }
}
```

In the above Write overload, if SaveChanges throws DbUpdateConcurrencyException, the handleException function is called. This function is expected to handle the exception and resolve the conflicts properly. Then SaveChanges is called again. If the last retry of SaveChanges still throws DbUpdateConcurrencyException, the exception is thrown to the caller.

### Retain database values (database wins)

Similar to previous examples, the following example has multiple DbReaderWriter instances to update a product concurrently:

```csharp
internal static void UpdateProduct(
    DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3,
    Action<EntityEntry> resolveConflicts)
{
    int id = 950;
    Product productCopy1 = readerWriter1.Read<Product>(id);
    Product productCopy2 = readerWriter2.Read<Product>(id);

    readerWriter1.Write(() =>
    {
        productCopy1.Name = nameof(readerWriter1);
        productCopy1.ListPrice = 100.0000M;
    });
    readerWriter2.Write(
        change: () =>
        {
            productCopy2.Name = nameof(readerWriter2);
            productCopy2.ProductSubcategoryID = 1;
        },
        handleException: exception =>
        {
            EntityEntry tracking = exception.Entries.Single();
            Product original = (Product)tracking.OriginalValues.ToObject();
            Product current = (Product)tracking.CurrentValues.ToObject();
            Product database = productCopy1; // Values saved in database.
            $"Original:  ({original.Name},   {original.ListPrice}, {original.ProductSubcategoryID}, {original.RowVersionString})"
                        .WriteLine();
            $"Database:  ({database.Name}, {database.ListPrice}, {database.ProductSubcategoryID}, {database.RowVersionString})"
                .WriteLine();
            $"Update to: ({current.Name}, {current.ListPrice}, {current.ProductSubcategoryID})"
                .WriteLine();

            resolveConflicts(tracking);
        });

    Product resolved = readerWriter3.Read<Product>(id);
    $"Resolved:  ({resolved.Name}, {resolved.ListPrice}, {resolved.ProductSubcategoryID}, {resolved.RowVersionString})"
        .WriteLine();
}
```

This is how it works with concurrency conflicts:

1.  readerWriter1 reads product with primary key 950, and RowVersion 0x00000000000007D1
2.  readerWriter2 reads product with the same primary key 950, and RowVersion 0x00000000000007D1
3.  readerWriter1 locates product with primary key and original RowVersion 0x00000000000007D1, and updates product’s name and list price. Database automatically increases the product’s row version
4.  In database the product’s row version is no longer 0x00000000000007D1.
5.  readerWriter2 tries to locate product with primary key and original RowVersion, and update product’s name and subcategory.
6.  readerWriter2 fails to update product, because it cannot locate the product with original RowVersion 0x00000000000007D1. Again, no product can be found with outdated row version, DbUpdateConcurrencyException is thrown.

As a result, the handleException function specified for readWriter2 is called, it retrieves the conflicting product’s tracking information from DbUpdateConcurrencyException.Entries, and logs these information:

-   product’s original property values read by readerWriter2 before the changes
-   product’s property values in database at this moment, which are already updated readerWriter1
-   product’s current property values after changes, which readerWriter2 fails to save to database.

Then handleException calls resolveConflicts function to actually resolve the conflict. Then readerWriter2 retries to save the product changes again. This time, SaveChanges should succeed, because there is no conflicts anymore (In this example, there are only 2 database clients reading/writing data concurrently. In reality, the concurrency can be higher, an appropriate retry count or retry strategy should be specified.). Eventually, readerWriter3 reads the product from database, verify its property values.

There are several options to implement the resolveConflicts function to resolves the conflicts. One simple option, called “database wins”, is to simply give up the client update, and let database retain whatever values it has for that entity. This seems to be easy to just catch DbUpdateConcurrencyException and do nothing, then database naturally wins, and retains its values:

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
            return 0; // this.context is in a corrupted state.
        }
    }
}
```

However, this way leaves the DbContext, the conflicting entity, and the entity’s tracking information in a corrupted state. For the caller, since the change saving is done, the entity’s property values should be in sync with database values, but the values are actually out of sync and still conflicting. Also, the entity has a tracking state Modified after change saving is done. So the safe approach is to reload and refresh the entity’s values and tracking information:

```csharp
internal static void DatabaseWins(
    DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
{
    UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
    {
        tracking.State.WriteLine(); // Modified
        tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // True
        tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
        tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True

        tracking.Reload(); // Execute query.

        tracking.State.WriteLine(); // Unchanged
        tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // False
        tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
        tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // False
    });
    // Original:  (ML Crankset,   256.4900, 8, 0x00000000000007D1)
    // Database:  (readerWriter1, 100.0000, 8, 0x0000000000036335)
    // Update to: (readerWriter2, 256.4900, 1)
    // Resolved:  (readerWriter1, 100.0000, 8, 0x0000000000036335)
}
```

UpdateProduct is called with a resolveConflicts function, which resolves the conflict by calling Reload method on the EntityEntry instance representing the conflicting product’s tracking information:

1.  EntityEntry.Reload executes a SELECT statement to read the product’s property values from database, then refresh the product entity and all tracking information. The product’s property values, the tracked original property values before changes, the tracked current property values after changes, are all refreshed to the queried database values. The entity tracking state is also refreshed to Unchanged.
2.  At this moment, product has the same tracked original values and current values, as if it is just initially read from database, without changes.
3.  When DbReaderWriter.Write’s retry logic calls SaveChanges again, no changed entity is detected. SaveChanges succeeds without executing any SQL, and returns 0. As expected, readerWriter2 does not update any value to database, and all values in database are retained.

Later, when readerWriter3 reads the product again, product has all values updated by readerWrtier1.

### Overwrite database values (client wins)

Another simple option, called “client wins”, is to disregard values in database, and overwrite them with whatever data submitted from client.

```sql
internal static void ClientWins(
    DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
{
    UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
    {
        PropertyValues databaseValues = tracking.GetDatabaseValues();
        // Refresh original values, which go to WHERE clause of UPDATE statement.
        tracking.OriginalValues.SetValues(databaseValues);

        tracking.State.WriteLine(); // Modified
        tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // True
        tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // True
        tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
    });
    // Original:  (ML Crankset,   256.4900, 8, 0x00000000000007D1)
    // Database:  (readerWriter1, 100.0000, 8, 0x0000000000036336)
    // Update to: (readerWriter2, 256.4900, 1)
    // Resolved:  (readerWriter2, 256.4900, 1, 0x0000000000036337)
}
```

The same conflict is resolved differently:

1.  EntityEntry.GetDatabaseValues executes a SELECT statement to read the product’s property values from database, including the updated row version. This call does not impact the product values or tracking information.
2.  Manually set the tracked original property values to the queried database values. The entity tracking state is still Changed. The original property values become all different from tracked current property values. So all product properties are tracked as modified.
3.  At this moment, the product has tracked original values updated, and keeps all tracked current values, as if it is read from database after readerWriter1 updates the name and list price, and then have all properties values changed.
4.  When DbReaderWriter.Write’s retry logic calls SaveChanges again, product changes are detected to submit. So EF/Core translate the product change to a UPDATE statement. In the SET clause, since there are 3 properties tracked as modified, 3 columns are set. In the WHERE clause, to locate the product, the tracked original row version has been set to the updated value from database. This time product can be located, and all 3 properties are updated. SaveChanges succeeds and returns 1. As expected, readerWriter2 updates all value to database.

Later, when readerWriter3 reads the product again, product has all values updated by readerWrter2.

### Merge with database values

A more complex but useful option, is to merge the client values and database values. For each property:

-   If original value is different from database value, which means database value is already updated by other concurrent client, then give up updating this property, and retain the database value
-   If original value is the same as database value, which means no concurrency conflict for this property, then process normally to submit the change

```sql
internal static void MergeClientAndDatabase(
    DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
{
    UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
    {
        PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute query.
        PropertyValues originalValues = tracking.OriginalValues.Clone();
        // Refresh original values, which go to WHERE clause.
        tracking.OriginalValues.SetValues(databaseValues);
        // If database has an different value for a property, then retain the database value.
#if EF
        databaseValues.PropertyNames // Navigation properties are not included.
            .Where(property => !object.Equals(originalValues[property], databaseValues[property]))
            .ForEach(property => tracking.Property(property).IsModified = false);
#else
        databaseValues.Properties // Navigation properties are not included.
            .Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
            .ForEach(property => tracking.Property(property.Name).IsModified = false);
#endif
        tracking.State.WriteLine(); // Modified
        tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // False
        tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
        tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
    });
    // Original:  (ML Crankset,   256.4900, 8, 0x00000000000007D1)
    // Database:  (readerWriter1, 100.0000, 8, 0x0000000000036338)
    // Update to: (readerWriter2, 256.4900, 1)
    // Resolved:  (readerWriter1, 100.0000, 1, 0x0000000000036339)
}
```

With this approach:

1.  Again, EntityEntry.GetDatabaseValues executes a SELECT statement to read the product’s property values from database, including the updated row version.
2.  Backup tracked original values, then refresh conflict.OriginalValues to the database values, so that these values can go to the translated WHERE clause. Again, the entity tracking state is still Changed. The original property values become all different from tracked current property values. So all product values are tracked as modified and should go to SET clause.
3.  For each property, if the backed original value is different from the database value, it means this property is changed by other client and there is concurrency conflict. In this case, revert this property’s tracking status to unmodified. The name and list price are reverted.
4.  At this moment, the product has tracked original values updated, and only keeps tracked current value of subcategory, as if it is read from database after readerWriter1 updates the name and list price, and then only have subcategory changed, which has no conflict.
5.  When DbReaderWriter.Write’s retry logic calls SaveChanges again, product changes are detected to submit. Here only subcategory is updated to database. SaveChanges succeeds and returns 1. As expected, readerWriter2 only updates value without conflict, the other conflicted values are retained.

Later, when readerWriter3 reads the product, product has name and list price values updated by readerWrtier1, and has subcategory updated by readerWriter2.

## Save changes with concurrency conflict handling

Similar to above DbReaderWriter.Write method, a general SaveChanges extension method for DbContext can be defined to handle concurrency conflicts and apply simple retry logic:

```csharp
public static partial class DbContextExtensions
{
    public static int SaveChanges(
        this DbContext context, Action<IEnumerable<EntityEntry>> resolveConflicts, int retryCount = 3)
    {
        if (retryCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(retryCount));
        }

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

To apply custom retry logic, Microsoft provides EnterpriseLibrary.TransientFaultHandling NuGet package ([Exception Handling Application Block](https://msdn.microsoft.com/en-us/library/dn440728.aspx)) for .NET Framework. It has been ported to .NET Core for this tutorial, as EnterpriseLibrary.TransientFaultHandling.Core NuGet package. can be used. With this library, a SaveChanges overload with customizable retry logic can be easily defined:

```csharp
public class TransientDetection<TException> : ITransientErrorDetectionStrategy
    where TException : Exception
{
    public bool IsTransient(Exception ex) => ex is TException;
}

public static partial class DbContextExtensions
{
    public static int SaveChanges(
        this DbContext context, Action<IEnumerable<EntityEntry>> resolveConflicts, RetryStrategy retryStrategy)
    {
        RetryPolicy retryPolicy = new RetryPolicy(
            errorDetectionStrategy: new TransientDetection<DbUpdateConcurrencyException>(),
            retryStrategy: retryStrategy);
        retryPolicy.Retrying += (sender, e) =>
            resolveConflicts(((DbUpdateConcurrencyException)e.LastException).Entries);
        return retryPolicy.ExecuteAction(context.SaveChanges);
    }
}
```

Here Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.ITransientErrorDetectionStrategy is the contract to detect each exception, and determine whether the exception is transient and the operation should be retried. Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryStrategy is the contract of retry logic. Then Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryPolicy executes the operation with the specified exception detection, exception handling, and retry logic.

As discussed above, to resolve a concurrency conflict, the entity and its tracking information need to be refreshed. So the more specific SaveChanges overloads can be implemented by applying refresh for each conflict:

```csharp
public enum RefreshConflict
{
    StoreWins,

    ClientWins,

    MergeClientAndStore
}

public static partial class DbContextExtensions
{
    public static int SaveChanges(this DbContext context, RefreshConflict refreshMode, int retryCount = 3)
    {
        if (retryCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(retryCount));
        }

        return context.SaveChanges(
            conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryCount);
    }

    public static int SaveChanges(
        this DbContext context, RefreshConflict refreshMode, RetryStrategy retryStrategy) =>
            context.SaveChanges(
                conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryStrategy);
}
```

A RefreshConflict enumeration has to be defined with 3 members to represent the 3 options discussed above: database wins, client wind, merge client and database.. And here the Refresh method is an extension method for EntityEntry:

```sql
public static EntityEntry Refresh(this EntityEntry tracking, RefreshConflict refreshMode)
{
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
            PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
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
        case RefreshConflict.MergeClientAndStore:
        {
            PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
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
                PropertyValues originalValues = tracking.OriginalValues.Clone();
                tracking.OriginalValues.SetValues(databaseValues);
                // If database has an different value for a property, then retain the database value.
#if EF
                databaseValues.PropertyNames // Navigation properties are not included.
                    .Where(property => !object.Equals(originalValues[property], databaseValues[property]))
                    .ForEach(property => tracking.Property(property).IsModified = false);
#else
                databaseValues.Properties // Navigation properties are not included.
                    .Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
                    .ForEach(property => tracking.Property(property.Name).IsModified = false);
#endif
                // Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
            }
            break;
        }
    }
    return tracking;
}
```

> EF already provides a System.Data.Entity.Core.Objects.RefreshMode enumeration, but it only has 2 members: StoreWins and ClientWins.

This Refresh extension method covers the update conflicts discussed above, as well as deletion conflicts. Now the these SaveChanges extension methods can be used to manage concurrency conflicts easily. For example:

```csharp
internal static void SaveChanges(AdventureWorks adventureWorks1, AdventureWorks adventureWorks2)
{
    int id = 950;
    Product productCopy1 = adventureWorks1.Products.Find(id);
    Product productCopy2 = adventureWorks2.Products.Find(id);

    productCopy1.Name = nameof(adventureWorks1);
    productCopy1.ListPrice = 100;
    adventureWorks1.SaveChanges();

    productCopy2.Name = nameof(adventureWorks2);
    productCopy2.ProductSubcategoryID = 1;
    adventureWorks2.SaveChanges(RefreshConflict.MergeClientAndStore);
}
```