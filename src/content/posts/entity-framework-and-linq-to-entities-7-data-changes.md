---
title: "Entity Framework and LINQ to Entities (7) Data Changes"
published: 2016-01-10
description: "Besides LINQ to Entities queries, Entity Framework also provides rich APIs for data changes."
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework", "LINQ to Entities", "SQL Server", "SQL"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions**](/posts/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions")

Besides LINQ to Entities queries, Entity Framework also provides rich APIs for data changes.

## Repository pattern and unit of work pattern

In Entity Framework, DbSet<T> implements [repository pattern](https://msdn.microsoft.com/en-us/library/ff649690.aspx). Repositories centralizes data access for applications, and mediates between the data source layer/tier and the business layers/tiers. A DbSet<T> object can be mapped to a database table, which is a repository for data [CRUD (create, read, update and delete)](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete):

```csharp
namespace System.Data.Entity
{
    public interface DbSet<TEntity> : DbQuery<TEntity>, IQueryable<TEntity> // Other interfaces.
        where TEntity : class
    {
        public virtual TEntity Add(TEntity entity);

        public virtual IEnumerable<TEntity> AddRange(IEnumerable<TEntity> entities);

        public virtual TEntity Find(params object[] keyValues);

        public virtual TEntity Remove(TEntity entity);

        public virtual IEnumerable<TEntity> RemoveRange(IEnumerable<TEntity> entities);

        // Other members.
    }
}
```

IQueryable<T> is implemented so that data can be read. Find is also provided to read data by primary keys. After reading, the retrieved data can be changed. Add and AddRange adds data to be created in the repository. Remove and RemoveRange remove data to be deleted in the repository.

A [unit of work](http://martinfowler.com/eaaCatalog/unitOfWork.html) is a collection of data operations that should succeed or fail as a unit. DbContext implements unit of work pattern:

```csharp
namespace System.Data.Entity
{
    using System.Data.Entity.Infrastructure;

    public class DbContext : IDisposable // Other interfaces.
    {
        public DbChangeTracker ChangeTracker { get; }

        public void Dispose();

        public virtual int SaveChanges();

        public virtual DbSet Set(Type entityType);

        // Other members.
    }
}
```

As the mapping of database, DbContext’s Set method and its derived class’ mapping properties provide the access to repositories for data operations, it can also track the data changes from these data operations, and save all changes to database as a unit.

## Track entities and changes

DbContext.ChangeTracker property returns a System.Data.Entity.Infrastructure.DbCangeTracker object, which can track entities for the source DbContext object:

```csharp
namespace System.Data.Entity.Infrastructure
{
    public class DbChangeTracker
    {
        public void DetectChanges();

        public IEnumerable<DbEntityEntry> Entries();

        public IEnumerable<DbEntityEntry<TEntity>> Entries<TEntity>() where TEntity : class;

        public bool HasChanges();

        // Other members.
    }
}
```

The non generic Entries method returns the tracking information for all tracked entities. Each entity’s tracking information is represented by a System.Data.Entity.Infrastructure.DbEntityEntry object:

```csharp
namespace System.Data.Entity.Infrastructure
{
    public class DbEntityEntry
    {
        public DbPropertyValues CurrentValues { get; }

        public object Entity { get; }

        public DbPropertyValues OriginalValues { get; }

        public EntityState State { get; set; }

        public DbPropertyValues GetDatabaseValues();

        public DbPropertyEntry Property(string propertyName);

        public void Reload();

        public DbEntityEntry<TEntity> Cast<TEntity>() where TEntity : class;

        // Other members.
    }
}
```

DbEntityEntry provides rich APIs for entity’s state management:

-   The Entity property above returns the tracked entity
-   State returns the entity’s tracking state: Detached, Unchanged, Added, Deleted, or Modified.
-   OriginalValues returns the tracked entity’s original property values
-   CurrentValues returns the tracked entity’s current property values.
-   GetDatabaseValues instantly execute a SQL query, and reads entity’s property values from database, without impacting current entity, or any tracking information including State, OriginalValues, CurrentValues.
-   Property returns the specified property’s tracking information.
-   Reload also executes a SELECT statement to read the database values, then it refreshes the entity’s property values, and all tracking information including State, OriginalValues, CurrentValues.

the generic Entries method is a filtered version, it only returns the tracking information for entities of the specified type. It returns a sequence of generic DbEntityEntry<TEntity> objects:

```csharp
namespace System.Data.Entity.Infrastructure
{
    public class DbEntityEntry<TEntity> where TEntity : class
    {
        public DbPropertyValues CurrentValues { get; }

        public TEntity Entity { get; }

        public DbPropertyValues OriginalValues { get; }

        public EntityState State { get; set; }

        public DbPropertyValues GetDatabaseValues();

        public DbPropertyEntry Property(string propertyName);

        public void Reload();

        public static implicit operator DbEntityEntry(DbEntityEntry<TEntity> entry);

        // Other members.
    }
}
```

DbEntityEntry<TEntity> is similar to DbEntityEntry for entity tracking and state management. DbEntityEntry can be converted to DbEntityEntry<TEntity> by calling DbEntityEntry.Cast, and DbEntityEntry<TEntity> can be implicitly converted to DbEntityEntry.

As fore mentioned in lazy load part, for a known entity, its tracking information can also be retrieved by calling DbContext.Entry. DbEntityEntry and DbEntityEntry<TEntity> also provides a few other methods, like Reference and Collection, which can be used for explicit lazy loading.

### Track entities

By default, DbContext tracks all entities read from its repositories. For example:
```
internal static partial class Tracking
{
    internal static void EntitiesFromSameDbContext()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            Product productById = adventureWorks.Products
                .Single(product => product.ProductID == 999);
            Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 1

            Product productByName = adventureWorks.Products
                .Single(product => product.Name == "Road-750 Black, 52");
            Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 1
            Trace.WriteLine(object.ReferenceEquals(productById, productByName)); // True
        }
    }
}
```

The single productById entity from first LINQ to Entities query is tracked by DbContext. Later, the second query results a single productByName entity too. Entity Framework figures out productById and productByName both map to the same data row of the same table, so productById and productByName reference to the same entity in memory.

If data from repositories are not entities mapping to table rows, they cannot be tracked:
```
internal static void ObjectsFromSameDbContext()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        var productById = adventureWorks.Products
            .Select(product => new { ProductID = product.ProductID, Name = product.Name })
            .Single(product => product.ProductID == 999);
        var productByName = adventureWorks.Products
            .Select(product => new { ProductID = product.ProductID, Name = product.Name })
            .Single(product => product.Name == "Road-750 Black, 52");
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 0
        Trace.WriteLine(object.ReferenceEquals(productById, productByName)); // False
    }
}
```

Here data is queries from repositories, and anonymous type objects are constructed on the fly. Entity Framework cannot decide if 2 arbitrary objects semantically represent the same piece of data. This time productById and productByName are independent from each other.

The tracking is at DbContext level. Entities from different DbContext objects belong to different units of work, and do not interfere each other:
```
internal static void EntitiesFromDbContexts()
{
    Product productById;
    Product productByName;
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        productById = adventureWorks.Products.Single(product => product.ProductID == 999);
    }
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        productByName = adventureWorks.Products.Single(product => product.Name == "Road-750 Black, 52");
    }
    Trace.WriteLine(object.ReferenceEquals(productById, productByName)); // False.
}
```

### Track entity changes and property changes

The following example CRUDs some data in the product repository, and examine all the tracking:
```
internal static void EntityChanges()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        Product toCreate = new Product() { Name = nameof(toCreate), ListPrice = 1 };
        adventureWorks.Products.Add(toCreate); // Create entity.
        Product read = adventureWorks.Products.Single(product => product.ProductID == 999); // Read entity.
        IQueryable<Product> toUpdate = adventureWorks.Products
            .Where(product => product.Name.Contains("HL"));
        toUpdate.ForEach(product => product.ListPrice += 100); // Update entities.
        IQueryable<Product> toDelete = adventureWorks.Products
            .Where(product => product.Name.Contains("ML"));
        adventureWorks.Products.RemoveRange(toDelete); // Delete entities.

        Trace.WriteLine(adventureWorks.ChangeTracker.HasChanges()); // True
        adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
        {
            Product changed = tracking.Entity;
            switch (tracking.State)
            {
                case EntityState.Added:
                case EntityState.Deleted:
                case EntityState.Unchanged:
                    Trace.WriteLine($"{tracking.State}: ({changed.ProductID}, {changed.Name}, {changed.ListPrice})");
                    break;
                case EntityState.Modified:
                    Product original = tracking.OriginalValues.ToObject() as Product;
                    Trace.WriteLine(
                        $"{tracking.State}: ({original.ProductID}, {original.Name}, {original.ListPrice}) => ({changed.ProductID}, {changed.Name}, {changed.ListPrice})");
                    break;
            }
        });
        // Added: (0, toCreate, 1)
        // Modified: (951, HL Crankset, 404.9900) => (951, HL Crankset, 504.9900)
        // Modified: (996, HL Bottom Bracket, 121.4900) => (996, HL Bottom Bracket, 221.4900)
        // Deleted: (950, ML Crankset, 256.4900)
        // Deleted: (995, ML Bottom Bracket, 101.2400)
        // Unchanged: (999, Road-750 Black, 52, 539.9900)
    }
}
```

If an entity is not read from a DbContext object’s repositories, then it has nothing to do with that unit of work, and apparently is not tracked by that DbContext object. DbSet<T> provides an Attach method to place an entity to the repository, and the DbContext tracks the entity as the Unchanged state:
```
internal static void Attach()
{
    Product onTheFly = new Product() { ProductID = 950, Name = "ML Crankset", ListPrice = 539.99M };
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 0

        adventureWorks.Products.Attach(onTheFly);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 1
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries<Product>().Single().State); // Unchanged
        onTheFly.Name = "After attaching";
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries<Product>().Single().State); // Modified
        adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking => Trace.WriteLine(
            $"{tracking.State}: {tracking.OriginalValues[nameof(Product.Name)]} => {tracking.CurrentValues[nameof(Product.Name)]}"));
        // Modified: ML Crankset => After attaching
    }
}
```

### Track association changes

The association of entities is also tracked. Remember Product’s foreign key ProductSubcategoryID is nullable. The following example reads a subcategory and its products, then delete the association. As a result, each navigation property is cleared to empty collection or null. And essentially, each product’s ProductSubcategoryID is changed to null, which is tracked:
```
internal static void AssociationChanges()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories
            .Include(entity => entity.Products).Single(entity => entity.ProductSubcategoryID == 8);
        Trace.WriteLine(subcategory.Products.Count); // 2
        Trace.WriteLine(subcategory.Products
            .All(product => product.ProductSubcategory == subcategory)); // True

        subcategory.Products.Clear();
        // Equivalent to: subcategory.Products.ForEach(product => product.ProductSubcategory = null);
        Trace.WriteLine(subcategory.Products.Count); // 0
        Trace.WriteLine(subcategory.Products
            .All(product => product.ProductSubcategory == null)); // True
        adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
            {
                Product original = tracking.OriginalValues.ToObject() as Product;
                Product changed = tracking.Entity;
                Trace.WriteLine(
                    $"{tracking.State}: ({original.ProductID}, {original.Name}, {original.ProductSubcategoryID}) => ({changed.ProductID}, {changed.Name}, {changed.ProductSubcategoryID})");
            });
        // Modified: (950, ML Crankset, 8) => (950, ML Crankset, )
        // Modified: (951, HL Crankset, 8) => (951, HL Crankset, )
    }
}
```

### Disable tracking

DbContext’s default behavior is to track all changes automatically. This can be turned off. To disable tracking for specific entities read from repository, Entity Framework provides a AsNoTracking extension method for IQueryable<T>:
```
internal static void AsNoTracking()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        Product untracked = adventureWorks.Products.AsNoTracking().First();
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 0
    }
}
```

Tracking can also be disabled at the DbContext scope. If needed, changes and be manually tracked by calling DbChangeTracker.DetectChanges method:
```
internal static void DetectChanges()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        adventureWorks.Configuration.AutoDetectChangesEnabled = false;
        Product product = adventureWorks.Products.First();
        product.ListPrice += 100;
        Trace.WriteLine(adventureWorks.ChangeTracker.HasChanges()); // False
        adventureWorks.ChangeTracker.DetectChanges();
        Trace.WriteLine(adventureWorks.ChangeTracker.HasChanges()); // True
    }
}
```

## Change data

To change the data in the database, just create a DbContext object, change the data in its repositories, and call DbContext.SaveChanges method to submit the tracked changes to the remote database as a unit of work.

### Create

To create new entities to the repository, call DbSet<T>.Add or DbSet<T>.AddRange. The following example creates 2 new associated entities, and add to repositories:
```
internal static partial class Changes
{
    internal static ProductCategory Create()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
            ProductSubcategory subcategory = new ProductSubcategory() { Name = nameof(ProductSubcategory) };
            adventureWorks.ProductSubcategories.Add(subcategory);
            subcategory.ProductCategory = category;
            // Equivalent to: category.ProductSubcategories.Add(subcategory);
            Trace.WriteLine(adventureWorks.ChangeTracker.Entries()
                .Count(tracking => tracking.State == EntityState.Added)); // 2
            Trace.WriteLine(category.ProductCategoryID); // 0
            Trace.WriteLine(subcategory.ProductCategoryID); // 0
            Trace.WriteLine(subcategory.ProductSubcategoryID); // 0

            Trace.WriteLine(adventureWorks.SaveChanges()); // 2
            Trace.WriteLine(adventureWorks.ChangeTracker.Entries()
                .Count(tracking => tracking.State != EntityState.Unchanged)); // 0
            Trace.WriteLine(category.ProductCategoryID); // 25
            Trace.WriteLine(subcategory.ProductCategoryID); // 25
            Trace.WriteLine(subcategory.ProductSubcategoryID); // 50
            return category;
        }
    }
}
```

Here DbSet<T>.Add is called once with 1 subcategory entity. Internally, Add triggers change detection, and tracks this subcategory as Added state. Since this subcategory is associated with another category entity, the associated category is also tracked, as the same Added state. So in total there are 2 entity changes tracked. When DbContext.SaveChanges is called, Entity Framework translates these 2 changes to 2 SQL INSERT statements:

```sql
BEGIN TRANSACTION
    exec sp_executesql N'INSERT [Production].[ProductCategory]([Name])
    VALUES (@0)
    SELECT [ProductCategoryID]
    FROM [Production].[ProductCategory]
    WHERE @@ROWCOUNT > 0 AND [ProductCategoryID] = scope_identity()',N'@0 nvarchar(50)',@0=N'ProductCategory'

    exec sp_executesql N'INSERT [Production].[ProductSubcategory]([Name], [ProductCategoryID])
    VALUES (@0, @1)
    SELECT [ProductSubcategoryID]
    FROM [Production].[ProductSubcategory]
    WHERE @@ROWCOUNT > 0 AND [ProductSubcategoryID] = scope_identity()',N'@0 nvarchar(50),@1 int',@0=N'ProductSubcategory',@1=25
COMMIT TRANSACTION
```

The \[Production\].\[ProductCategory\] and \[Production\].\[ProductSubcategory\] tables’ primary key is an identity column, which is generated by database. So the new category’s ProductCategoryID and the new subcategory’s ProductSubcategory properties are ignored in the translated INSERT statements. After the each new row is created, a SELECT statement calls SCOPE\_IDENTITY metadata function to read the last generated identity value, which is the primary key of the inserted row. As a result, since there are 2 row changes in total, SaveChanges returns 2, And the 2 changes are submitted in a transaction, so that all changes can succeed or fail as a unit.

DbSet<T>.AddRange can be called with multiple entities. AddRange only triggers change detection once for all the entities, so it can have better performance than multiple Add calls,

### Update

To update entities in the repositories, just modify the entities’ properties. The following example updates a subcategory entity’s Name property, and ProductCategory navigation property:
```
internal static void Update()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories
            .Single(entity => entity.Name == "Bikes");
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories
            .Single(entity => entity.Name == nameof(ProductSubcategory));
        Trace.WriteLine(
            $"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})");
        // (48, ProductSubcategory, 25)

        subcategory.Name = "Update"; // Update property.
        subcategory.ProductCategory = category; // Update association (foreign key).
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries()
            .Count(tracking => tracking.State != EntityState.Unchanged)); // 1
        Trace.WriteLine(
            $"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})");
        // (48, Update, 1)

        Trace.WriteLine(adventureWorks.SaveChanges()); // 1
    }
}
```

The changes are translated to a UPDATE statement to update a column and a foreign key of specified row, and the row is located by the primary key:

```sql
SELECT TOP (2) 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE N'Bikes' = [Extent1].[Name]

SELECT TOP (2) 
    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID]
    FROM [Production].[ProductSubcategory] AS [Extent1]
    WHERE N'ProductSubcategory' = [Extent1].[Name]

BEGIN TRANSACTION
    exec sp_executesql N'UPDATE [Production].[ProductSubcategory]
    SET [Name] = @0, [ProductCategoryID] = @1
    WHERE ([ProductSubcategoryID] = @2)
    ',N'@0 nvarchar(50),@1 int,@2 int',@0=N'Update',@1=1,@2=50
COMMIT TRANSACTION
```

The above example first read the entities, then update. Since the row to update is located by primary key, if the primary key is known, then it can be used directly:
```
internal static void UpdateWithoutRead(int categoryId)
{
    ProductCategory category = new ProductCategory()
        {
            ProductCategoryID = categoryId,
            Name = Guid.NewGuid().ToString()
        };
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        adventureWorks.ProductCategories.Attach(category);
        DbEntityEntry<ProductCategory> tracking = adventureWorks.ChangeTracker.Entries<ProductCategory>()
            .Single();
        Trace.WriteLine(tracking.State); // Unchanged
        tracking.State = EntityState.Modified;
        Trace.WriteLine(adventureWorks.SaveChanges()); // 1
    }
}
```

Here a category entity is constructed on the fly, with specified primary key and updated Name. To track and save the changes, ii is attached to the repository. As fore mentioned, the attached entity is tracked as Unchanged state, so just manually set its state to Modified.. This time, only one UPDATE statement is translated and executed, without SELECT:

```sql
BEGIN TRANSACTION
    exec sp_executesql N'UPDATE [Production].[ProductCategory]
    SET [Name] = @0
    WHERE ([ProductCategoryID] = @1)
    ',N'@0 nvarchar(50),@1 int',@0=N'f20d6c0c-1e92-4060-8a5d-72c41062b1be',@1=25
BEGIN TRANSACTION
```

When there is no change to save, SaveChanges returns 0:
```
internal static void SaveNoChanges()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories.Find(1);
        string originalName = category.Name;
        category.Name = Guid.NewGuid().ToString(); // Update property value.
        category.Name = originalName; // Update property back to original value.
        Trace.WriteLine(adventureWorks.ChangeTracker.HasChanges()); // False
        Trace.WriteLine(adventureWorks.SaveChanges()); // 0
    }
}
```

Find queries category entity by primary key:

```sql
exec sp_executesql N'SELECT TOP (2) 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @p0',N'@p0 int',@p0=1
```

The category’s Name is updated, then updated back to original value. When calling SaveChanges, there is no change tracked or detected, so it does not execute UPDATE statement or any other SQL.

### Delete

To delete entities from the repositories, call DbSet<T>.Remove or DbSet<T>.RemoveRange. The following example read an entity then delete it:
```
internal static void Delete()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories
            .OrderByDescending(entity => entity.ProductSubcategoryID).First();
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 1
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State); // Unchanged

        adventureWorks.ProductSubcategories.Remove(subcategory);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State); // Deleted
        Trace.WriteLine(adventureWorks.SaveChanges()); // 1
    }
}
```

Calling DbSet<T>.Add also triggers change detection, so the subcategory is tracked as Deleted state. When SaveChanges is called, the entity deletion is translated to a DELETE statement:

```sql
SELECT TOP (1) 
    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID]
    FROM [Production].[ProductSubcategory] AS [Extent1]
    ORDER BY [Extent1].[ProductSubcategoryID] DESC

BEGIN TRANSACTION
    exec sp_executesql N'DELETE [Production].[ProductSubcategory]
    WHERE ([ProductSubcategoryID] = @0)',N'@0 int',@0=50
COMMIT TRANSACTION
```

The row to delete is also located with primary key. So again, when primary key is known, reading entity can be skipped:
```
internal static void DeleteWithoutRead(int categoryId)
{
    ProductCategory category = new ProductCategory() { ProductCategoryID = categoryId };
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        adventureWorks.ProductCategories.Attach(category);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 1
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State); // Unchanged

        adventureWorks.ProductCategories.Remove(category);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State); // Deleted
        Trace.WriteLine(adventureWorks.SaveChanges()); // 1.
    }
}
```

When constructing the entity on the fly, only the primary key is provided. This is enough to locate the row and delete it. This example only translate and execute a DELETE statement:

```sql
BEGIN TRANSACTION
    exec sp_executesql N'DELETE [Production].[ProductCategory]
    WHERE ([ProductCategoryID] = @0)',N'@0 int',@0=25
COMMIT TRANSACTION
```

The following example delete an category entity which is associated with subcategory entities:
```
internal static void DeleteWithAssociation()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories.Find(1);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 1

        adventureWorks.ProductCategories.Remove(category);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries()
            .Count(tracking => tracking.State == EntityState.Deleted)); // 1
        Trace.WriteLine(adventureWorks.SaveChanges());
        // System.Data.Entity.Infrastructure.DbUpdateException: An error occurred while updating the entries. See the inner exception for details.
        // ---> System.Data.Entity.Core.UpdateException: An error occurred while updating the entries. See the inner exception for details.
        // ---> System.Data.SqlClient.SqlException: The DELETE statement conflicted with the REFERENCE constraint "FK_ProductSubcategory_ProductCategory_ProductCategoryID". The conflict occurred in database "D:\DIXIN\ONEDRIVE\WORKS\DRAFTS\CODESNIPPETS\DATA\ADVENTUREWORKS_DATA.MDF", table "Production.ProductSubcategory", column 'ProductCategoryID'.
    }
}
```

SaveChanges fails, because the specified entity to delete is referenced by other entities.

```sql
exec sp_executesql N'SELECT TOP (2) 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @p0',N'@p0 int',@p0=1

BEGIN TRANSACTION
    exec sp_executesql N'DELETE [Production].[ProductCategory]
    WHERE ([ProductCategoryID] = @0)',N'@0 int',@0=1036
ROLLBACK TRANSACTION
```

So a category can be deleted along with its subcategories:
```
internal static void DeleteAllAssociated()
{
    Create(); // Create category "ProductCategory" and its subcategory "ProductSubcategory".
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories
            .Single(entity => entity.Name == nameof(ProductCategory));
        ProductSubcategory subcategory = category.ProductSubcategories.Single();
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries().Count()); // 2

        adventureWorks.ProductCategories.Remove(category);
        // Optional: adventureWorks.ProductSubcategories.Remove(subcategory);
        Trace.WriteLine(adventureWorks.ChangeTracker.Entries()
            .Count(tracking => tracking.State == EntityState.Deleted)); // 2
        Trace.WriteLine(adventureWorks.SaveChanges()); // 2
    }
}
```

Here, DbSet<T>.Remove is only called once with 1 entity, but Entity Framework detects 2 entities to delete, because of the association. Now the deletion is translated to 2 DELETE statements:

```sql
SELECT TOP (2) 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE N'ProductCategory' = [Extent1].[Name]

exec sp_executesql N'SELECT 
    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID]
    FROM [Production].[ProductSubcategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=26

BEGIN TRANSACTION
    exec sp_executesql N'DELETE [Production].[ProductSubcategory]
    WHERE ([ProductSubcategoryID] = @0)',N'@0 int',@0=51

    exec sp_executesql N'DELETE [Production].[ProductCategory]
    WHERE ([ProductCategoryID] = @0)',N'@0 int',@0=26
COMMIT TRANSACTION
```

Notice Entity Framework also translates and executes the deletion in the right order. The sub entity is deleted before the entity.

Untracked changes cannot to be translated or executed. The following example tries to delete a untracked entity from the repository:
```
internal static void UntrackedChanges()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory untracked = adventureWorks.ProductCategories.AsNoTracking().First();
        adventureWorks.ProductCategories.Remove(untracked);
        Trace.WriteLine(adventureWorks.SaveChanges());
        // InvalidOperationException: The object cannot be deleted because it was not found in the ObjectStateManager.
    }
}
```

Here the only translated and executed SQL is the First query:

```sql
SELECT TOP (1) 
    [c].[ProductCategoryID] AS [ProductCategoryID], 
    [c].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [c]
```

The entity read from repository is untracked, so SaveChanges cannot translate or execute SQL, and throws InvalidOperationException.