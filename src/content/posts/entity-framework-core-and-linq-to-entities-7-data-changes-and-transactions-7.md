---
title: "Entity Framework/Core and LINQ to Entities (7) Data Changes and Transactions"
published: 2019-03-27
description: "Besides LINQ to Entities queries, EF/Core also provides rich APIs for data changes, with imperative paradigm."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **Latest EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions**](/posts/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-7-data-changes-and-transactions")

## EF version of this article: [https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-7-data-changes](/posts/entity-framework-and-linq-to-entities-7-data-changes "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-7-data-changes") and [https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-8-transactions](/posts/entity-framework-and-linq-to-entities-8-transactions "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-8-transactions")

Besides LINQ to Entities queries, EF/Core also provides rich APIs for data changes, with imperative paradigm.

## Repository pattern and unit of work pattern

In EF/Core, DbSet<T> implements [repository pattern](https://msdn.microsoft.com/en-us/library/ff649690.aspx). Repositories can centralize data access for applications, and connect between the data source and the business logic. A DbSet<T> instance can be mapped to a database table, which is a repository for data [CRUD (create, read, update and delete)](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete):

```csharp
namespace Microsoft.EntityFrameworkCore
{
    public abstract class DbSet<TEntity> : IQueryable<TEntity> // Other interfaces.
        where TEntity : class
    {
        public virtual TEntity Find(params object[] keyValues);

        public virtual EntityEntry<TEntity> Add(TEntity entity);

        public virtual void AddRange(IEnumerable<TEntity> entities);

        public virtual EntityEntry<TEntity> Remove(TEntity entity);

        public virtual void RemoveRange(IEnumerable<TEntity> entities);

        // Other members.
    }
}
```

DbSet<T> implements IQueryable<T>, so that DbSet<T> can represent the data source to read from. DbSet<T>.Find is also provided to read entity by the primary keys. After reading, the retrieved data can be changed. Add and AddRange methods track the specified entities as to be created in the repository. Remove and RemoveRange methods track the specified entities as to be deleted in the repository.

As fore mentioned, a [unit of work](http://martinfowler.com/eaaCatalog/unitOfWork.html) is a collection of data operations that should together or fail together as a unit. DbContext implements unit of work pattern:

```csharp
namespace Microsoft.EntityFrameworkCore
{
    public class DbContext : IDisposable, IInfrastructure<IServiceProvider>
    {
        public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;

        public virtual ChangeTracker ChangeTracker { get; }

        public virtual int SaveChanges();

        public virtual void Dispose();
    }
}
```

As the mapping of database, DbContext’s Set method returns the specified entity’s repositories. For example, calling AdventureWorks.Products is equivalent to calling AdventureWorks.Set<Product>. The entities tracking is done at the DbContext level, by its ChangeTracker. When DbContext.Submit is called, the tracked changes are submitted to database. When a unit of work is done, DbContext should be disposed.

> In EF, the members of DbSet<TEntity> and DbContext have slightly different signatures:
> 
> ```csharp
> namespace System.Data.Entity
> {
>     public class DbSet<TEntity> : DbQuery<TEntity>, IQueryable<TEntity> // Other interfaces.
>         where TEntity : class
>     {
>         public virtual TEntity Find(params object[] keyValues);
> 
>         public virtual TEntity Add(TEntity entity);
> 
>         public virtual IEnumerable<TEntity> AddRange(IEnumerable<TEntity> entities);
> 
>         public virtual TEntity Remove(TEntity entity);
> 
>         public virtual IEnumerable<TEntity> RemoveRange(IEnumerable<TEntity> entities);
> 
>         // Other members.
>     }
> 
>     public class DbContext : IDisposable // Other interfaces.
>     {
>         public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;
> 
>         public DbChangeTracker ChangeTracker { get; }
> 
>         public virtual int SaveChanges();
> 
>         public void Dispose();
> 
>         // Other members.
>     }
> }
> ```

## Track entities and changes

DbContext.ChangeTracker property returns Microsoft.EntityFrameworkCore.ChangeTracking.ChangeTracker, which can track entities for the source DbContext:

```csharp
namespace Microsoft.EntityFrameworkCore.ChangeTracking
{
    public class ChangeTracker : IInfrastructure<IStateManager>
    {
        public virtual IEnumerable<EntityEntry> Entries();

        public virtual IEnumerable<EntityEntry<TEntity>> Entries<TEntity>() where TEntity : class;

        public virtual void DetectChanges();

        public virtual bool HasChanges();

        // Other members.
    }
}
```

Each entity’s loading and tracking information is represented by Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry or Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity>. The following is the non generic EntityEntry:

```csharp
namespace Microsoft.EntityFrameworkCore.ChangeTracking
{
    public class EntityEntry : IInfrastructure<InternalEntityEntry>
    {
        public virtual EntityState State { get; set; }

        public virtual object Entity { get; }

        public virtual PropertyEntry Property(string propertyName);

        public virtual PropertyValues CurrentValues { get; }

        public virtual PropertyValues OriginalValues { get; }

        public virtual PropertyValues GetDatabaseValues();

        public virtual void Reload();

        // Other members.
    }
}
```

Besides the loading information APIs discussed in previous part, EntityEntry also provides rich APIs for entity’s tracking information and state management:

-   State returns the entity’s tracking state: Detached, Unchanged, Added, Deleted, or Modified.
-   Entity property returns the tracked entity
-   Property returns the specified property’s tracking information.
-   CurrentValues returns the tracked entity’s current property values.
-   OriginalValues returns the tracked entity’s original property values
-   GetDatabaseValues instantly execute a SQL query to read entity’s property values from database, without updating current entity’s property values and tracking information.
-   Reload also executes a SQL query to read the database values, and also update current entity’s property values, and all tracking information

The generic EntityEntry<TEntity> is just stronger typing:

```csharp
namespace Microsoft.EntityFrameworkCore.ChangeTracking
{
    public class EntityEntry<TEntity> : EntityEntry where TEntity : class
    {
        public virtual TEntity Entity { get; }

        // Other members.
    }
}
```

As fore mentioned in data loading part, DbContext.Entry also accepts an entity and return its EntityEntry<TEntity>/EntityEntry.

> In EF, the types involved above are named with Db prefix: DbChangeTracker, DbEntityEntry, DbEntityEntry<TEntity>, DbPropertyEntry, DbPropertyValues, with similar members.

### Track entities

By default, all entities read from repositories are tracked by the source DbContext. For example:

```csharp
internal static partial class Tracking
{
    internal static void EntitiesFromSameDbContext(AdventureWorks adventureWorks)
    {
        Product productById = adventureWorks.Products
            .Single(product => product.ProductID == 999);
        adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1

        Product productByName = adventureWorks.Products
            .Single(product => product.Name == "Road-750 Black, 52");
        adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
        object.ReferenceEquals(productById, productByName).WriteLine(); // True
    }
}
```

The single result from the first LINQ to Entities query is tracked by DbContext. Later, the second query has a single result too. EF/Core identifies both results map to the same data row of the same table, so they are reference to the same entity instance.

If data from repositories are not entities mapping to table rows, they cannot be tracked:

```csharp
internal static void ObjectsFromSameDbContext(AdventureWorks adventureWorks)
{
    var productById = adventureWorks.Products
        .Select(product => new { ProductID = product.ProductID, Name = product.Name })
        .Single(product => product.ProductID == 999);
    var productByName = adventureWorks.Products
        .Select(product => new { ProductID = product.ProductID, Name = product.Name })
        .Single(product => product.Name == "Road-750 Black, 52");
    adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
    object.ReferenceEquals(productById, productByName).WriteLine(); // False
}
```

Here data is queries from repositories, and anonymous type instances are constructed on the fly. EF/Core cannot decide if 2 arbitrary instances semantically represent the same piece of data in remote database. This time 2 query results are independent from each other.

Since the tracking is at DbContext scope. Entities of different DbContext instances belong to different units of work, and do not interfere each other:

```csharp
internal static void EntitiesFromMultipleDbContexts()
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
    object.ReferenceEquals(productById, productByName).WriteLine(); // False.
}
```

### Track entity changes and property changes

The following example demonstrate CRUD operations in the product repository, then examine all the tracking information:

```csharp
internal static void EntityChanges(AdventureWorks adventureWorks)
{
    Product create = new Product() { Name = nameof(create), ListPrice = 1 };
    adventureWorks.Products.Add(create); // Create locally.
    Product read = adventureWorks.Products.Single(product => product.ProductID == 999); // Read from remote to local.
    IQueryable<Product> update = adventureWorks.Products
        .Where(product => product.Name.Contains("HL"));
    update.ForEach(product => product.ListPrice += 100); // Update locally.
    IQueryable<Product> delete = adventureWorks.Products
        .Where(product => product.Name.Contains("ML"));
    adventureWorks.Products.RemoveRange(delete); // Delete locally.

    adventureWorks.ChangeTracker.HasChanges().WriteLine(); // True
    adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
    {
        Product changed = tracking.Entity;
        switch (tracking.State)
        {
            case EntityState.Added:
            case EntityState.Deleted:
            case EntityState.Unchanged:
                $"{tracking.State}: {(changed.ProductID, changed.Name, changed.ListPrice)}".WriteLine();
                break;
            case EntityState.Modified:
                Product original = (Product)tracking.OriginalValues.ToObject();
                $"{tracking.State}: {(original.ProductID, original.Name, original.ListPrice)} => {(changed.ProductID, changed.Name, changed.ListPrice)}"
                    .WriteLine();
                break;
        }
    });
    // Added: (-2147482647, toCreate, 1)
    // Unchanged: (999, Road-750 Black, 52, 539.9900)
    // Modified: (951, HL Crankset, 404.9900) => (951, HL Crankset, 504.9900)
    // Modified: (996, HL Bottom Bracket, 121.4900) => (996, HL Bottom Bracket, 221.4900)
    // Deleted: (950, ML Crankset, 256.4900)
    // Deleted: (995, ML Bottom Bracket, 101.2400)
}
```

If an entity is not read from a DbContext instance’s repositories, then it has nothing to do with that unit of work, and apparently is not tracked by that DbContext instance. DbSet<T> provides an Attach method to place an entity to the repository, and the DbContext tracks the entity as the Unchanged state:

```csharp
internal static void Attach(AdventureWorks adventureWorks)
{
    Product product = new Product() { ProductID = 950, Name = "ML Crankset", ListPrice = 539.99M };
    adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0

    adventureWorks.Products.Attach(product);
    adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
    adventureWorks.ChangeTracker.Entries<Product>().Single().State.WriteLine(); // Unchanged
    product.Name = "After attaching";
    adventureWorks.ChangeTracker.Entries<Product>().Single().State.WriteLine(); // Modified
    adventureWorks.ChangeTracker.Entries<Product>().WriteLines(tracking =>
        $"{tracking.State}: {tracking.OriginalValues[nameof(Product.Name)]} => {tracking.CurrentValues[nameof(Product.Name)]}");
    // Modified: ML Crankset => After attaching
}
```

### Track relationship changes

The relationship of entities is also tracked. Remember Product’s foreign key ProductSubcategoryID is nullable. The following example reads a subcategory and its products, then delete the relationship. As a result, each navigation property is cleared to empty collection or null. And each related subcategory’s foreign key property value is synced to null, which is tracked:

```csharp
internal static void RelationshipChanges(AdventureWorks adventureWorks)
{
    ProductSubcategory subcategory = adventureWorks.ProductSubcategories
        .Include(entity => entity.Products).Single(entity => entity.ProductSubcategoryID == 8);
    subcategory.Products.Count.WriteLine(); // 2
    subcategory.Products
        .All(product => product.ProductSubcategory == subcategory).WriteLine(); // True

    subcategory.Products.Clear();
    // Equivalent to: subcategory.Products.ForEach(product => product.ProductSubcategory = null);
    subcategory.Products.Count.WriteLine(); // 0
    subcategory.Products
        .All(product => product.ProductSubcategory == null).WriteLine(); // True
    adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
    {
        Product original = (Product)tracking.OriginalValues.ToObject();
        Product changed = tracking.Entity;
        $"{tracking.State}: {(original.ProductID, original.Name, original.ProductSubcategoryID)} => {(changed.ProductID, changed.Name, changed.ProductSubcategoryID)}".WriteLine();
    });
    // Modified: (950, ML Crankset, 8) => (950, ML Crankset, )
    // Modified: (951, HL Crankset, 8) => (951, HL Crankset, )
}
```

### Enable and disable tracking

DbContext’s default behavior is to track all changes automatically. This can be turned off if not needed. To disable tracking for specific entities queried from repository, call the EntityFrameworkQueryableExtensions.AsNoTracking extension method for IQueryable<T> query:

```csharp
internal static void AsNoTracking(AdventureWorks adventureWorks)
{
    Product untracked = adventureWorks.Products.AsNoTracking().First();
    adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
}
```

Tracking can also be enabled or disabled at the DbContext scope, by setting the ChangeTracker.AutoDetectChangesEnabled property to true or false. The default value of ChangeTracker.AutoDetectChangesEnabled is true, so usually it is not needed to manually detect changes by calling ChangeTracker.DetectChanges method. The changes are automatically detected when DbContext.SubmitChanges is called. The changes are also automatically detected when tracking information is calculated, for example, when calling ChangeTracker.Entries, DbContext.Entry, etc.

> In EF, the switch is DbContext.Configuration.AutoDetectChangesEnabled. And when AutoDetectChangesEnabled is true (by default), DetectChanges is called much more frequently than in EF Core.

If needed, changes and be manually tracked by calling ChangeTracker.DetectChanges method:

```csharp
internal static void DetectChanges(AdventureWorks adventureWorks)
{
    adventureWorks.ChangeTracker.AutoDetectChangesEnabled = false;
    Product product = adventureWorks.Products.First();
    product.ListPrice += 100;
    adventureWorks.ChangeTracker.HasChanges().WriteLine(); // False
    adventureWorks.ChangeTracker.DetectChanges();
    adventureWorks.ChangeTracker.HasChanges().WriteLine(); // True
}
```

## Change data

To change the data in the database, just create a DbContext instance, change the data in its repositories, and call DbContext.SaveChanges method to submit the tracked changes to the remote database as a unit of work.

### Create

To create new entities into the repository, call DbSet<T>.Add or DbSet<T>.AddRange. The following example creates a new category, and a new related subcategory, and add to repositories:

```sql
internal static partial class Changes
{
    internal static ProductCategory Create()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            ProductCategory category = new ProductCategory() { Name = "Create" };
            ProductSubcategory subcategory = new ProductSubcategory() { Name = "Create" };
            category.ProductSubcategories = new HashSet<ProductSubcategory>() { subcategory };
            // Equivalent to: subcategory.ProductCategory = category;
            category.ProductCategoryID.WriteLine(); // 0
            subcategory.ProductCategoryID.WriteLine(); // 0
            subcategory.ProductSubcategoryID.WriteLine(); // 0

            adventureWorks.ProductCategories.Add(category); // Track creation.
            // Equivalent to: adventureWorks.ProductSubcategories.Add(subcategory);
            adventureWorks.ChangeTracker.Entries()
                .Count(tracking => tracking.State == EntityState.Added).WriteLine(); // 2
            object.ReferenceEquals(category.ProductSubcategories.Single(), subcategory).WriteLine(); // True

            adventureWorks.SaveChanges().WriteLine(); // 2
            // BEGIN TRANSACTION
            //    exec sp_executesql N'SET NOCOUNT ON;
            //    INSERT INTO [Production].[ProductCategory] ([Name])
            //    VALUES (@p0);
            //    SELECT [ProductCategoryID]
            //    FROM [Production].[ProductCategory]
            //    WHERE @@ROWCOUNT = 1 AND [ProductCategoryID] = scope_identity();
            //    ',N'@p0 nvarchar(50)',@p0=N'Create'
            //
            //    exec sp_executesql N'SET NOCOUNT ON;
            //    INSERT INTO [Production].[ProductCategory] ([Name])
            //    VALUES (@p0);
            //    SELECT [ProductCategoryID]
            //    FROM [Production].[ProductCategory]
            //    WHERE @@ROWCOUNT = 1 AND [ProductCategoryID] = scope_identity();
            //    ',N'@p0 nvarchar(50)',@p0=N'Create'
            // COMMIT TRANSACTION

            adventureWorks.ChangeTracker.Entries()
                .Count(tracking => tracking.State != EntityState.Unchanged).WriteLine(); // 0
            category.ProductCategoryID.WriteLine(); // 5
            subcategory.ProductCategoryID.WriteLine(); // 5
            subcategory.ProductSubcategoryID.WriteLine(); // 38
            return category;
        } // Unit of work.
    }
}
```

Here DbSet<T>.Add is called only once with 1 subcategory entity. Internally, Add triggers change detection, and tracks this subcategory as Added state. Since this subcategory is related with another category entity with navigation property, the related category is also tracked, as the Added state too. So in total there are 2 entity changes tracked. When DbContext.SaveChanges is called, EF/Core translates these 2 changes to 2 SQL INSERT statements:

The category’s key is identity key, with value generated by database, so is subcategory. So in the translated INSERT statements, the new category’s ProductCategoryID and the new subcategory’s ProductSubcategory are ignored. After the each new row is created, a SELECT statement calls SCOPE\_IDENTITY metadata function to read the last generated identity value, which is the primary key of the inserted row. As a result, since there are 2 row changes in total, SaveChanges returns 2, And the 2 changes are submitted in a transaction, so that all changes can succeed or fail as a unit.

DbSet<T>.AddRange can be called with multiple entities. AddRange only triggers change detection once for all the entities, so it can have better performance than multiple Add calls,

### Update

To update entities in the repositories, just change their properties, including navigation properties. The following example updates a subcategory entity’s name, and related category entity, which is translated to UPDATE statement:

```sql
internal static void Update(int categoryId, int subcategoryId)
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories.Find(categoryId);
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories.Find(subcategoryId);
        $"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})"
            .WriteLine(); // (48, Create, 25)
        subcategory.Name = "Update"; // Entity property update.
        subcategory.ProductCategory = category; // Relashionship (foreign key) update.
        adventureWorks.ChangeTracker.Entries().Count(tracking => tracking.State != EntityState.Unchanged)
            .WriteLine(); // 1
        $"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})"
            .WriteLine(); // (48, Update, 1)
        adventureWorks.SaveChanges().WriteLine(); // 1
        // BEGIN TRANSACTION
        //    exec sp_executesql N'SET NOCOUNT ON;
        //    UPDATE [Production].[ProductSubcategory] SET [Name] = @p0, [ProductCategoryID] = @p1
        //    WHERE [ProductSubcategoryID] = @p2;
        //    SELECT @@ROWCOUNT;
        //    ',N'@p2 int,@p0 nvarchar(50),@p1 int',@p2=25,@p0=N'Update',@p1=25
        // COMMIT TRANSACTION
    } // Unit of work.
}
```

The above example first call Find to read the entities with a SELECT query, then execute the UPDATE statement. Here the row to update is located by primary key, so, if the primary key is known, then it can be used directly:

```sql
internal static void UpdateWithoutRead(int categoryId)
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = new ProductCategory()
        {
            ProductCategoryID = categoryId,
            Name = Guid.NewGuid().ToString() // To be updated.
        };
        adventureWorks.ProductCategories.Attach(category); // Track entity.
        EntityEntry tracking = adventureWorks.ChangeTracker.Entries<ProductCategory>().Single();
        tracking.State.WriteLine(); // Unchanged
        tracking.State = EntityState.Modified;
        adventureWorks.SaveChanges().WriteLine(); // 1
        // BEGIN TRANSACTION
        //    exec sp_executesql N'SET NOCOUNT ON;
        //    UPDATE [Production].[ProductCategory] SET [Name] = @p0
        //    WHERE [ProductCategoryID] = @p1;
        //    SELECT @@ROWCOUNT;
        //    ',N'@p1 int,@p0 nvarchar(50)',@p1=25,@p0=N'513ce396-4a5e-4a86-9d82-46f284aa4f94'
        // COMMIT TRANSACTION
    } // Unit of work.
}
```

Here a category entity is constructed on the fly, with specified primary key and updated Name. To track and save the changes, ii is attached to the repository. As fore mentioned, the attached entity is tracked as Unchanged state, so just manually set its state to Modified. This time, only one UPDATE statement is translated and executed, without SELECT.

When there is no change to save, SaveChanges does not translate or execute any SQL and returns 0:

```csharp
internal static void SaveNoChanges(int categoryId)
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories.Find(categoryId);
        string originalName = category.Name;
        category.Name = Guid.NewGuid().ToString(); // Entity property update.
        category.Name = originalName; // Entity property update.
        EntityEntry tracking = adventureWorks.ChangeTracker.Entries().Single();
        tracking.State.WriteLine(); // Unchanged
        adventureWorks.ChangeTracker.HasChanges().WriteLine(); // False
        adventureWorks.SaveChanges().WriteLine(); // 0
    } // Unit of work.
}
```

### Delete

To delete entities from the repositories, call DbSet<T>.Remove or DbSet<T>.RemoveRange. The following example read an entity then delete it:

```sql
internal static void Delete(int subcategoryId)
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories.Find(subcategoryId);
        adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
        adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State.WriteLine(); // Unchanged
        adventureWorks.ProductSubcategories.Remove(subcategory); // Track deletion.
        adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State.WriteLine(); // Deleted
        adventureWorks.SaveChanges().WriteLine(); // 1
        // BEGIN TRANSACTION
        //    exec sp_executesql N'SET NOCOUNT ON;
        //    DELETE FROM [Production].[ProductSubcategory]
        //    WHERE [ProductSubcategoryID] = @p0;
        //    SELECT @@ROWCOUNT;
        //    ',N'@p0 int',@p0=48
        // COMMIT TRANSACTION
    } // Unit of work.
}
```

Here, the row to delete is also located with primary key. So again, when primary key is known, reading entity can be skipped:

```sql
internal static void DeleteWithoutRead(int categoryId)
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = new ProductCategory() { ProductCategoryID = categoryId };
        adventureWorks.ProductCategories.Attach(category);
        adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
        adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State.WriteLine(); // Unchanged
        adventureWorks.ProductCategories.Remove(category); // Track deletion.
        adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State.WriteLine(); // Deleted
        adventureWorks.SaveChanges().WriteLine(); // 1
        //    BEGIN TRANSACTION
        //    exec sp_executesql N'SET NOCOUNT ON;
        //    DELETE FROM [Production].[ProductCategory]
        //    WHERE [ProductCategoryID] = @p0;
        //    SELECT @@ROWCOUNT;
        //    ',N'@p0 int',@p0=25
        // COMMIT TRANSACTION
    } // Unit of work.
}
```

If a principal entity is loaded with its dependent entities, deleting the principal entity becomes cascade deletion:

```sql
internal static void DeleteCascade(int categoryId)
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category = adventureWorks.ProductCategories
            .Include(entity => entity.ProductSubcategories)
            .Single(entity => entity.ProductCategoryID == categoryId);
        ProductSubcategory subcategory = category.ProductSubcategories.Single();
        adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 2
        adventureWorks.ProductCategories.Remove(category); // Track deletion.
        // Optional: adventureWorks.ProductSubcategories.Remove(subcategory);
        adventureWorks.ChangeTracker.Entries().Count(tracking => tracking.State == EntityState.Deleted)
            .WriteLine(); // 2
        adventureWorks.SaveChanges().WriteLine(); // 2
        // BEGIN TRANSACTION
        //    exec sp_executesql N'SET NOCOUNT ON;
        //    DELETE FROM [Production].[ProductSubcategory]
        //    WHERE [ProductSubcategoryID] = @p0;
        //    SELECT @@ROWCOUNT;
        //    ',N'@p0 int',@p0=49

        //    exec sp_executesql N'SET NOCOUNT ON;
        //    DELETE FROM [Production].[ProductCategory]
        //    WHERE [ProductCategoryID] = @p1;
        //    SELECT @@ROWCOUNT;
        //    ',N'@p1 int',@p1=26
        // COMMIT TRANSACTION
    } // Unit of work.
}
```

Here the cascade deletion are translated and executed in the right order. The subcategory is deleted first, then category is deleted.

> In EF, untracked entities’ changes cannot to be translated or executed. The following example tries to delete a untracked entity from the repository, it throws InvalidOperationException:
> 
> ```csharp
> internal static void UntrackedChanges()
> {
>     using (AdventureWorks adventureWorks = new AdventureWorks())
>     {
>         ProductCategory untracked = adventureWorks.ProductCategories
>             .AsNoTracking()
>             .Single(category => category.Name == "Bikes");
>         adventureWorks.ProductCategories.Remove(untracked); // Track no deletion.
>         adventureWorks.SaveChanges().WriteLine();
>         // InvalidOperationException: The object cannot be deleted because it was not found in the ObjectStateManager.
>     } // Unit of work.
> }
> ```

## Transaction

As discussed above, by default DbContext.SaveChanges execute all data creation, update and deletion in a transaction, so that all the work can succeed or fail as a unit. If the unit of work succeeds, the transaction is committed, if any operation fails, the transaction is rolled back. EF/Core also supports custom transactions.

### Transaction with connection resiliency and execution strategy

If the retry strategy is enabled for connection resiliency for DbContext by default, then this default retry strategy does not work custom transaction. Custom transaction works within a single retry operation, but not cross multiple retries. In EF Core, database façade’s CreateExecutionStrategy method can be called to explicitly specify a single retry operation:

```csharp
internal static partial class Transactions
{
    internal static void ExecutionStrategy(AdventureWorks adventureWorks)
    {
        adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
        {
            // Single retry operation, which can have custom transactions.
        });
    }
}
```

> In EF, the default retry strategy must be manually disabled, so that an individual retry logic must be manually created to start a single retry operation. In the object-relational mapping part, an ExecutionStrategy type is defined to turn on/off the default retry strategy. It can be reused to implement this:
> 
> ```csharp
> public partial class ExecutionStrategy : IDbExecutionStrategy
> {
>     private readonly IDbExecutionStrategy strategy = Create();
> 
>     public bool RetriesOnFailure => this.strategy.RetriesOnFailure;
> 
>     public void Execute(Action operation) =>
>         ExecuteOperation(() => { this.strategy.Execute(operation); return (object)null; });
> 
>     public TResult Execute<TResult>(Func<TResult> operation) =>
>         ExecuteOperation(() => this.strategy.Execute(operation));
> 
>     public Task ExecuteAsync(
>         Func<Task> operation, CancellationToken cancellationToken = default) =>
>             ExecuteOperation(() => this.strategy.ExecuteAsync(operation, cancellationToken));
> 
>     public Task<TResult> ExecuteAsync<TResult>(
>         Func<Task<TResult>> operation, CancellationToken cancellationToken = default) =>
>             ExecuteOperation(() => this.strategy.ExecuteAsync(operation, cancellationToken));
> 
>     private static T ExecuteOperation<T>(Func<T> resultFactory)
>     {
>         DisableExecutionStrategy = true;
>         try
>         {
>             return resultFactory();
>         }
>         finally
>         {
>             DisableExecutionStrategy = false;
>         }
>     }
> }
> ```
> 
> In EF, the database façade does not have CreateExecutionStrategy method, so a extension method can be defined for DbContext.Database:
> 
> ```csharp
> public static class DatabaseExtensions
> {
>     public static ExecutionStrategy CreateExecutionStrategy(this DatabaseFacade database) => 
>         new ExecutionStrategy();
> }
> ```
> 
> Now EF can use the same pattern as EF Core to work with custom transactions.

### EF/Core transaction

EF Core provides Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction to represent a transaction. It can be created by DbContext.Database.BeginTransaction, where the transaction’s [isolation level](https://technet.microsoft.com/en-us/library/ms189122.aspx) can be optionally specified. The following example executes a entity change and custom SQL with one EF/Core transaction:

```sql
internal static void DbContextTransaction(AdventureWorks adventureWorks)
{
    adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
    {
        using (IDbContextTransaction transaction = adventureWorks.Database.BeginTransaction(
            IsolationLevel.ReadUncommitted))
        {
            try
            {
                adventureWorks.CurrentIsolationLevel().WriteLine(); // ReadUncommitted

                ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
                adventureWorks.ProductCategories.Add(category);
                adventureWorks.SaveChanges().WriteLine(); // 1

                adventureWorks.Database.ExecuteSqlCommand(
                    sql: "DELETE FROM [Production].[ProductCategory] WHERE [Name] = {0}",
                    parameters: nameof(ProductCategory)).WriteLine(); // 1
                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }
    });
}
```

EF/Core transaction wraps ADO.NET transaction. When the EF/Core transaction begins, The specified isolation level is written to a packet (represented by System.Data.SqlClient.SNIPacket type), and sent to SQL database via TDS protocol. There is no SQL statement like [SET TRANSACTION ISOLATION LEVEL](https://msdn.microsoft.com/en-us/library/ms173763.aspx) executed, so the actual isolation level cannot be logged by EF/Core, or traced by SQL Profiler. In above example, CurrentIsolationLevel is called to verify the current transaction’s isolation level. It is an extension method of DbContext. It queries the dynamic management view [sys.dm\_exec\_sessions](https://msdn.microsoft.com/en-us/library/ms176013.aspx) with current session id, which can be retrieved with [@@SPID](https://msdn.microsoft.com/en-us/library/ms189535.aspx) function:

```sql
public static partial class DbContextExtensions
{
    public static readonly string CurrentIsolationLevelSql = $@"
        SELECT
            CASE transaction_isolation_level
                WHEN 0 THEN N'{IsolationLevel.Unspecified}'
                WHEN 1 THEN N'{IsolationLevel.ReadUncommitted}''
                WHEN 2 THEN N'{IsolationLevel.ReadCommitted}''
                WHEN 3 THEN N'{IsolationLevel.RepeatableRead}''
                WHEN 4 THEN N'{IsolationLevel.Serializable}''
                WHEN 5 THEN N'{IsolationLevel.Snapshot}''
            END
        FROM sys.dm_exec_sessions
        WHERE session_id = @@SPID";

    public static string CurrentIsolationLevel(this DbContext context)
    {
        using (DbCommand command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = CurrentIsolationLevelSql;
            command.Transaction = context.Database.CurrentTransaction.GetDbTransaction();
            return (string)command.ExecuteScalar();
        }
    }
}
```

When DbContext.SaveChanges is called to create entity. it detects a transaction is explicitly created with the current DbContext, so it uses that transaction and does not automatically begins a new transaction like all the previous examples. Then DbContext.Database.ExecuteSqlCommnd is called to delete entity. It also detects and uses transaction of the current DbContext. Eventually, to commit the transaction, call IDbContextTransaction.Commit, to rollback the transaction, call IDbContextTransaction.Rollback

> In EF has built-in support to execute custom SQL with result of primitive type, so CurrentIsolationLevel can be implemented as:/p>
> 
> ```csharp
> public static string CurrentIsolationLevel(this DbContext context) =>
>     context.Database.SqlQuery<string>(CurrentIsolationLevelSql).Single();
> ```

### ADO.NET transaction

EF/Core can also use the ADO.NET transaction, represented by System.Data.Common.DbTransaction. The following example execute the same entity change and custom SQL command with one ADO.NET transaction. To use an existing ADO.NET transaction, call DbContext.Database.UseTransaction:

```sql
internal static void DbTransaction()
{
    using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
    {
        connection.Open();
        using (DbTransaction transaction = connection.BeginTransaction(IsolationLevel.RepeatableRead))
        {
            try
            {
                using (AdventureWorks adventureWorks = new AdventureWorks(connection))
                {
                    adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
                    {
                        adventureWorks.Database.UseTransaction(transaction);
                        adventureWorks.CurrentIsolationLevel().WriteLine(); // RepeatableRead

                        ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
                        adventureWorks.ProductCategories.Add(category);
                        adventureWorks.SaveChanges().WriteLine(); // 1.
                    });
                }
                using (DbCommand command = connection.CreateCommand())
                {
                    command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0";
                    DbParameter parameter = command.CreateParameter();
                    parameter.ParameterName = "@p0";
                    parameter.Value = nameof(ProductCategory);
                    command.Parameters.Add(parameter);
                    command.Transaction = transaction;
                    command.ExecuteNonQuery().WriteLine(); // 1
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

### Transaction scope

> The EF transaction only work with its source DbContext, and the ADO.NET transaction only work with its source DbConnection. Since EF work with .NET Framework, where System.Transactions.TransactionScope is provided, TransactionScope can be used with EF to have a transaction that work across the lifecycle of multiple DbContext or DbConnection instances:
> 
> ```sql
> internal static void TransactionScope()
> {
>     new ExecutionStrategy().Execute(() =>
>     {
>         using (TransactionScope scope = new TransactionScope(
>             scopeOption: TransactionScopeOption.Required,
>             transactionOptions: new TransactionOptions()
>             {
>                 IsolationLevel = System.Transactions.IsolationLevel.Serializable
>             }))
>         {
>             using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
>             using (DbCommand command = connection.CreateCommand())
>             {
>                 command.CommandText = DbContextExtensions.CurrentIsolationLevelSql;
>                 connection.Open();
>                 using (DbDataReader reader = command.ExecuteReader())
>                 {
>                     reader.Read();
>                     reader[0].WriteLine(); // RepeatableRead
>                 }
>             }
>             using (AdventureWorks adventureWorks = new AdventureWorks())
>             {
>                 ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
>                 adventureWorks.ProductCategories.Add(category);
>                 adventureWorks.SaveChanges().WriteLine(); // 1
>             }
>             using (AdventureWorks adventureWorks = new AdventureWorks())
>             {
>                 adventureWorks.CurrentIsolationLevel().WriteLine(); // Serializable
>             }
>             using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
>             using (DbCommand command = connection.CreateCommand())
>             {
>                 command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0";
>                 DbParameter parameter = command.CreateParameter();
>                 parameter.ParameterName = "@p0";
>                 parameter.Value = nameof(ProductCategory);
>                 command.Parameters.Add(parameter);
> 
>                 connection.Open();
>                 command.ExecuteNonQuery().WriteLine(); // 1
>             }
>             scope.Complete();
>         }
>     });
> }
> ```