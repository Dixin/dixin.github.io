---
title: "Entity Framework Core and LINQ to Entities in Depth (7) Data Changes and Transactions"
published: 2019-10-14
description: "Besides LINQ to Entities queries, EF Core also provides rich APIs for data changes, with imperative paradigm."
image: ""
tags: [".NET", ".NET Core", "C#", "EF Core", "Entity Framework Core", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core (EF Core) series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework (EF) series](/archive/?tag=Entity%20Framework)\]

Besides LINQ to Entities queries, EF Core also provides rich APIs for data changes, with imperative paradigm.

## Repository pattern and unit of work pattern

In EF Core, DbSet<T> implements repository pattern. Repositories can centralize data access for applications, and connect between the data source and the business logic. A DbSet<T> instance can be mapped to a database table, which is a repository for data CRUD (create, read, update and delete):

namespace Microsoft.EntityFrameworkCore

```csharp
{
```
```csharp
public abstract class DbSet<TEntity> : IQueryable<TEntity> // Other interfaces.
```
```csharp
where TEntity : class
```
```csharp
{
```
```csharp
public virtual TEntity Find(params object[] keyValues);
```

```csharp
public virtual EntityEntry<TEntity> Add(TEntity entity);
```

```csharp
public virtual void AddRange(IEnumerable<TEntity> entities);
```

```csharp
public virtual EntityEntry<TEntity> Remove(TEntity entity);
```

```csharp
public virtual void RemoveRange(IEnumerable<TEntity> entities);
```

```csharp
// Other members.
```
```csharp
}
```

}

DbSet<T> implements IQueryable<T>, so that DbSet<T> can represent the data source to read from. DbSet<T>.Find is also provided to read entity by the primary keys. After reading, the retrieved data can be changed. Add and AddRange methods track the specified entities as to be created in the repository. Remove and RemoveRange methods track the specified entities as to be deleted in the repository.

As fore mentioned, a unit of work is a collection of data operations that should together or fail together as a unit. DbContext implements unit of work pattern:

namespace Microsoft.EntityFrameworkCore

```csharp
{
```
```csharp
public class DbContext : IDisposable, IInfrastructure<IServiceProvider>
```
```csharp
{
```
```csharp
public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;
```

```csharp
public virtual ChangeTracker ChangeTracker { get; }
```

```csharp
public virtual int SaveChanges();
```

```csharp
public virtual void Dispose();
```
```csharp
}
```

}

As the mapping of database, DbContext’s Set method returns the specified entity’s repositories. For example, calling AdventureWorks.Products is equivalent to calling AdventureWorks.Set<Product>. The entities tracking is done at the DbContext level, by its ChangeTracker. When DbContext.Submit is called, the tracked changes are submitted to database. When a unit of work is done, DbContext should be disposed.

## Track entities and changes

DbContext.ChangeTracker property returns Microsoft.EntityFrameworkCore.ChangeTracking.ChangeTracker, which can track entities for the source DbContext:

namespace Microsoft.EntityFrameworkCore.ChangeTracking

```csharp
{
```
```csharp
public class ChangeTracker : IInfrastructure<IStateManager>
```
```csharp
{
```
```csharp
public virtual IEnumerable<EntityEntry> Entries();
```

```csharp
public virtual IEnumerable<EntityEntry<TEntity>> Entries<TEntity>() where TEntity : class;
```

```csharp
public virtual void DetectChanges();
```

```csharp
public virtual bool HasChanges();
```

```csharp
// Other members.
```
```csharp
}
```

}

Each entity’s loading and tracking information is represented by Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry or Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity>. The following is the non generic EntityEntry:

namespace Microsoft.EntityFrameworkCore.ChangeTracking

```csharp
{
```
```csharp
public class EntityEntry : IInfrastructure<InternalEntityEntry>
```
```csharp
{
```
```csharp
public virtual EntityState State { get; set; }
```

```csharp
public virtual object Entity { get; }
```

```csharp
public virtual PropertyEntry Property(string propertyName);
```

```csharp
public virtual PropertyValues CurrentValues { get; }
```

```csharp
public virtual PropertyValues OriginalValues { get; }
```

```csharp
public virtual PropertyValues GetDatabaseValues();
```

```csharp
public virtual void Reload();
```

```csharp
// Other members.
```
```csharp
}
```

}

Besides the loading information APIs discussed in previous part, EntityEntry also provides rich APIs for entity’s tracking information and state management:

· State returns the entity’s tracking state: Detached, Unchanged, Added, Deleted, or Modified.

· Entity property returns the tracked entity

· Property returns the specified property’s tracking information.

· CurrentValues returns the tracked entity’s current property values.

· OriginalValues returns the tracked entity’s original property values

· GetDatabaseValues instantly execute a SQL query to read entity’s property values from database, without updating current entity’s property values and tracking information.

· Reload also executes a SQL query to read the database values, and also update current entity’s property values, and all tracking information

The generic EntityEntry<TEntity> is just stronger typing:

namespace Microsoft.EntityFrameworkCore.ChangeTracking

```csharp
{
```
```csharp
public class EntityEntry<TEntity> : EntityEntry where TEntity : class
```
```csharp
{
```
```csharp
public virtual TEntity Entity { get; }
```

```csharp
// Other members.
```
```csharp
}
```

}

As fore mentioned in data loading part, DbContext.Entry also accepts an entity and return its EntityEntry<TEntity>/EntityEntry.

### Track entities

By default, all entities read from repositories are tracked by the source DbContext. For example:

internal static void EntitiesFromSameDbContext(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
Product productById = adventureWorks.Products
```
```csharp
.Single(product => product.ProductID == 999);
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```

```csharp
Product productByName = adventureWorks.Products
```
```csharp
.Single(product => product.Name == "Road-750 Black, 52");
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```csharp
object.ReferenceEquals(productById, productByName).WriteLine(); // True
```

}

The single result from the first LINQ to Entities query is tracked by DbContext. Later, the second query has a single result too. EF Core identifies both results map to the same data row of the same table, so they are reference to the same entity instance.

If data from repositories are not entities mapping to table rows, they cannot be tracked:

internal static void ObjectsFromSameDbContext(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
var productById = adventureWorks.Products
```
```csharp
.Select(product => new { ProductID = product.ProductID, Name = product.Name })
```
```csharp
.Single(product => product.ProductID == 999);
```
```csharp
var productByName = adventureWorks.Products
```
```csharp
.Select(product => new { ProductID = product.ProductID, Name = product.Name })
```
```csharp
.Single(product => product.Name == "Road-750 Black, 52");
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
```
```csharp
object.ReferenceEquals(productById, productByName).WriteLine(); // False
```

}

Here data is queries from repositories, and anonymous type instances are constructed on the fly. EF Core cannot decide if 2 arbitrary instances semantically represent the same piece of data in remote database. This time 2 query results are independent from each other.

Since the tracking is at DbContext scope. Entities of different DbContext instances belong to different units of work, and do not interfere each other:

internal static void EntitiesFromMultipleDbContexts()

```csharp
{
```
```csharp
Product productById;
```
```csharp
Product productByName;
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
productById = adventureWorks.Products.Single(product => product.ProductID == 999);
```
```csharp
}
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
productByName = adventureWorks.Products.Single(product => product.Name == "Road-750 Black, 52");
```
```csharp
}
```
```csharp
object.ReferenceEquals(productById, productByName).WriteLine(); // False.
```

}

### Track entity changes and property changes

The following example demonstrate CRUD operations in the product repository, then examine all the tracking information:

internal static void EntityChanges(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
Product create = new Product() { Name = nameof(create), ListPrice = 1 };
```
```csharp
adventureWorks.Products.Add(create); // Create locally.
```
```csharp
Product read = adventureWorks.Products.Single(product => product.ProductID == 999); // Read from remote to local.
```
```csharp
IQueryable<Product> update = adventureWorks.Products
```
```csharp
.Where(product => product.Name.Contains("HL"));
```
```csharp
update.ForEach(product => product.ListPrice += 100); // Update locally.
```
```csharp
IQueryable<Product> delete = adventureWorks.Products
```
```csharp
.Where(product => product.Name.Contains("ML"));
```
```csharp
adventureWorks.Products.RemoveRange(delete); // Delete locally.
```

```csharp
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // True
```
```csharp
adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
```
```csharp
{
```
```csharp
Product changed = tracking.Entity;
```
```csharp
switch (tracking.State)
```
```csharp
{
```
```csharp
case EntityState.Added:
```
```csharp
case EntityState.Deleted:
```
```csharp
case EntityState.Unchanged:
```
```csharp
$"{tracking.State}: {(changed.ProductID, changed.Name, changed.ListPrice)}".WriteLine();
```
```csharp
break;
```
```csharp
case EntityState.Modified:
```
```csharp
Product original = (Product)tracking.OriginalValues.ToObject();
```
```csharp
$"{tracking.State}: {(original.ProductID, original.Name, original.ListPrice)} => {(changed.ProductID, changed.Name, changed.ListPrice)}"
```
```csharp
.WriteLine();
```
```csharp
break;
```
```csharp
}
```
```csharp
});
```
```csharp
// Added: (-2147482647, toCreate, 1)
```
```csharp
// Unchanged: (999, Road-750 Black, 52, 539.9900)
```
```csharp
// Modified: (951, HL Crankset, 404.9900) => (951, HL Crankset, 504.9900)
```
```csharp
// Modified: (996, HL Bottom Bracket, 121.4900) => (996, HL Bottom Bracket, 221.4900)
```
```csharp
// Deleted: (950, ML Crankset, 256.4900)
```
```csharp
// Deleted: (995, ML Bottom Bracket, 101.2400)
```

}

If an entity is not read from a DbContext instance’s repositories, then it has nothing to do with that unit of work, and apparently is not tracked by that DbContext instance. DbSet<T> provides an Attach method to place an entity to the repository, and the DbContext tracks the entity as the Unchanged state:

internal static void Attach(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
Product product = new Product() { ProductID = 950, Name = "ML Crankset", ListPrice = 539.99M };
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
```

```csharp
adventureWorks.Products.Attach(product);
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```csharp
adventureWorks.ChangeTracker.Entries<Product>().Single().State.WriteLine(); // Unchanged
```
```csharp
product.Name = "After attaching";
```
```csharp
adventureWorks.ChangeTracker.Entries<Product>().Single().State.WriteLine(); // Modified
```
```csharp
adventureWorks.ChangeTracker.Entries<Product>().WriteLines(tracking =>
```
```csharp
$"{tracking.State}: {tracking.OriginalValues[nameof(Product.Name)]} => {tracking.CurrentValues[nameof(Product.Name)]}");
```
```csharp
// Modified: ML Crankset => After attaching
```

}

### Track relationship changes

The relationship of entities is also tracked. Remember Product’s foreign key ProductSubcategoryID is nullable. The following example reads a subcategory and its products, then delete the relationship. As a result, each navigation property is cleared to empty collection or null. And each related subcategory’s foreign key property value is synced to null, which is tracked:

internal static void RelationshipChanges(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories
```
```csharp
.Include(entity => entity.Products).Single(entity => entity.ProductSubcategoryID == 8);
```
```csharp
subcategory.Products.Count.WriteLine(); // 2
```
```csharp
subcategory.Products
```
```csharp
.All(product => product.ProductSubcategory == subcategory).WriteLine(); // True
```

```csharp
subcategory.Products.Clear();
```
```csharp
// Equivalent to: subcategory.Products.ForEach(product => product.ProductSubcategory = null);
```
```csharp
subcategory.Products.Count.WriteLine(); // 0
```
```csharp
subcategory.Products
```
```csharp
.All(product => product.ProductSubcategory == null).WriteLine(); // True
```
```csharp
adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
```
```csharp
{
```
```csharp
Product original = (Product)tracking.OriginalValues.ToObject();
```
```csharp
Product changed = tracking.Entity;
```
```csharp
$"{tracking.State}: {(original.ProductID, original.Name, original.ProductSubcategoryID)} => {(changed.ProductID, changed.Name, changed.ProductSubcategoryID)}".WriteLine();
```
```csharp
});
```
```csharp
// Modified: (950, ML Crankset, 8) => (950, ML Crankset, )
```
```csharp
// Modified: (951, HL Crankset, 8) => (951, HL Crankset, )
```

}

### Enable and disable tracking

DbContext’s default behavior is to track all changes automatically. This can be turned off if not needed. To disable tracking for specific entities queried from repository, call the EntityFrameworkQueryableExtensions.AsNoTracking extension method for IQueryable<T> query:

internal static void AsNoTracking(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
Product untracked = adventureWorks.Products.AsNoTracking().First();
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
```

}

Tracking can also be enabled or disabled at the DbContext scope, by setting the ChangeTracker.AutoDetectChangesEnabled property to true or false. The default value of ChangeTracker.AutoDetectChangesEnabled is true, so usually it is not needed to manually detect changes by calling ChangeTracker.DetectChanges method. The changes are automatically detected when DbContext.SubmitChanges is called. The changes are also automatically detected when tracking information is calculated, for example, when calling ChangeTracker.Entries, DbContext.Entry, etc.

If needed, changes and be manually tracked by calling ChangeTracker.DetectChanges method:

internal static void DetectChanges(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
adventureWorks.ChangeTracker.AutoDetectChangesEnabled = false;
```
```csharp
Product product = adventureWorks.Products.First();
```
```csharp
product.ListPrice += 100;
```
```csharp
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // False
```
```csharp
adventureWorks.ChangeTracker.DetectChanges();
```
```csharp
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // True
```

}

## Change data

To change the data in the database, just create a DbContext instance, change the data in its repositories, and call DbContext.SaveChanges method to submit the tracked changes to the remote database as a unit of work.

### Create

To create new entities into the repository, call DbSet<T>.Add or DbSet<T>.AddRange. The following example creates a new category, and a new related subcategory, and add to repositories:

internal static ProductCategory Create()

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = new ProductCategory() { Name = "Create" };
```
```csharp
ProductSubcategory subcategory = new ProductSubcategory() { Name = "Create" };
```
```csharp
category.ProductSubcategories = new HashSet<ProductSubcategory>() { subcategory };
```
```csharp
// Equivalent to: subcategory.ProductCategory = category;
```
```csharp
category.ProductCategoryID.WriteLine(); // 0
```
```csharp
subcategory.ProductCategoryID.WriteLine(); // 0
```
```csharp
subcategory.ProductSubcategoryID.WriteLine(); // 0
```

```csharp
adventureWorks.ProductCategories.Add(category); // Track creation.
```
```csharp
// Equivalent to: adventureWorks.ProductSubcategories.Add(subcategory);
```
```csharp
adventureWorks.ChangeTracker.Entries()
```
```csharp
.Count(tracking => tracking.State == EntityState.Added).WriteLine(); // 2
```
```csharp
object.ReferenceEquals(category.ProductSubcategories.Single(), subcategory).WriteLine(); // True
```

```csharp
adventureWorks.SaveChanges().WriteLine(); // 2
```
```csharp
// BEGIN TRANSACTION
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// INSERT INTO [Production].[ProductCategory] ([Name])
```
```csharp
// VALUES (@p0);
```
```sql
// SELECT [ProductCategoryID]
```
```sql
// FROM [Production].[ProductCategory]
```
```sql
// WHERE @@ROWCOUNT = 1 AND [ProductCategoryID] = scope_identity();
```
```csharp
// ',N'@p0 nvarchar(50)',@p0=N'Create'
```
```csharp
//
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// INSERT INTO [Production].[ProductCategory] ([Name])
```
```csharp
// VALUES (@p0);
```
```sql
// SELECT [ProductCategoryID]
```
```sql
// FROM [Production].[ProductCategory]
```
```sql
// WHERE @@ROWCOUNT = 1 AND [ProductCategoryID] = scope_identity();
```
```csharp
// ',N'@p0 nvarchar(50)',@p0=N'Create'
```
```csharp
// COMMIT TRANSACTION
```

```csharp
adventureWorks.ChangeTracker.Entries()
```
```csharp
.Count(tracking => tracking.State != EntityState.Unchanged).WriteLine(); // 0
```
```csharp
category.ProductCategoryID.WriteLine(); // 5
```
```csharp
subcategory.ProductCategoryID.WriteLine(); // 5
```
```csharp
subcategory.ProductSubcategoryID.WriteLine(); // 38
```
```csharp
return category;
```
```csharp
} // Unit of work.
```

}

Here DbSet<T>.Add is called only once with 1 subcategory entity. Internally, Add triggers change detection, and tracks this subcategory as Added state. Since this subcategory is related with another category entity with navigation property, the related category is also tracked, as the Added state too. So in total there are 2 entity changes tracked. When DbContext.SaveChanges is called, EF Core translates these 2 changes to 2 SQL INSERT statements:

The category’s key is identity key, with value generated by database, so is subcategory. So in the translated INSERT statements, the new category’s ProductCategoryID and the new subcategory’s ProductSubcategory are ignored. After the each new row is created, a SELECT statement calls SCOPE\_IDENTITY metadata function to read the last generated identity value, which is the primary key of the inserted row. As a result, since there are 2 row changes in total, SaveChanges returns 2, And the 2 changes are submitted in a transaction, so that all changes can succeed or fail as a unit.

DbSet<T>.AddRange can be called with multiple entities. AddRange only triggers change detection once for all the entities, so it can have better performance than multiple Add calls,

### Update

To update entities in the repositories, just change their properties, including navigation properties. The following example updates a subcategory entity’s name, and related category entity, which is translated to UPDATE statement:

internal static void Update(int categoryId, int subcategoryId)

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = adventureWorks.ProductCategories.Find(categoryId);
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.Find(subcategoryId);
```
```csharp
$"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})"
```
```csharp
.WriteLine(); // (48, Create, 25)
```
```csharp
subcategory.Name = "Update"; // Entity property update.
```
```csharp
subcategory.ProductCategory = category; // Relashionship (foreign key) update.
```
```csharp
adventureWorks.ChangeTracker.Entries().Count(tracking => tracking.State != EntityState.Unchanged)
```
```csharp
.WriteLine(); // 1
```
```csharp
$"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})"
```
```csharp
.WriteLine(); // (48, Update, 1)
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 1
```
```csharp
// BEGIN TRANSACTION
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[ProductSubcategory] SET [Name] = @p0, [ProductCategoryID] = @p1
```
```sql
// WHERE [ProductSubcategoryID] = @p2;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p2 int,@p0 nvarchar(50),@p1 int',@p2=25,@p0=N'Update',@p1=25
```
```csharp
// COMMIT TRANSACTION
```
```csharp
} // Unit of work.
```

}

The above example first call Find to read the entities with a SELECT query, then execute the UPDATE statement. Here the row to update is located by primary key, so, if the primary key is known, then it can be used directly:

internal static void UpdateWithoutRead(int categoryId)

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = new ProductCategory()
```
```csharp
{
```
```csharp
ProductCategoryID = categoryId,
```
```csharp
Name = Guid.NewGuid().ToString() // To be updated.
```
```csharp
};
```
```csharp
adventureWorks.ProductCategories.Attach(category); // Track entity.
```
```csharp
EntityEntry tracking = adventureWorks.ChangeTracker.Entries<ProductCategory>().Single();
```
```csharp
tracking.State.WriteLine(); // Unchanged
```
```csharp
tracking.State = EntityState.Modified;
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 1
```
```csharp
// BEGIN TRANSACTION
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[ProductCategory] SET [Name] = @p0
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p1 int,@p0 nvarchar(50)',@p1=25,@p0=N'513ce396-4a5e-4a86-9d82-46f284aa4f94'
```
```csharp
// COMMIT TRANSACTION
```
```csharp
} // Unit of work.
```

}

Here a category entity is constructed on the fly, with specified primary key and updated Name. To track and save the changes, ii is attached to the repository. As fore mentioned, the attached entity is tracked as Unchanged state, so just manually set its state to Modified. This time, only one UPDATE statement is translated and executed, without SELECT.

When there is no change to save, SaveChanges does not translate or execute any SQL and returns 0:

internal static void SaveNoChanges(int categoryId)

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = adventureWorks.ProductCategories.Find(categoryId);
```
```csharp
string originalName = category.Name;
```
```csharp
category.Name = Guid.NewGuid().ToString(); // Entity property update.
```
```csharp
category.Name = originalName; // Entity property update.
```
```csharp
EntityEntry tracking = adventureWorks.ChangeTracker.Entries().Single();
```
```csharp
tracking.State.WriteLine(); // Unchanged
```
```csharp
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // False
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 0
```
```csharp
} // Unit of work.
```

}

### Delete

To delete entities from the repositories, call DbSet<T>.Remove or DbSet<T>.RemoveRange. The following example read an entity then delete it:

internal static void Delete(int subcategoryId)

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.Find(subcategoryId);
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```csharp
adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State.WriteLine(); // Unchanged
```
```csharp
adventureWorks.ProductSubcategories.Remove(subcategory); // Track deletion.
```
```csharp
adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State.WriteLine(); // Deleted
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 1
```
```csharp
// BEGIN TRANSACTION
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```sql
// DELETE FROM [Production].[ProductSubcategory]
```
```sql
// WHERE [ProductSubcategoryID] = @p0;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p0 int',@p0=48
```
```csharp
// COMMIT TRANSACTION
```
```csharp
} // Unit of work.
```

}

Here, the row to delete is also located with primary key. So again, when primary key is known, reading entity can be skipped:

internal static void DeleteWithoutRead(int categoryId)

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = new ProductCategory() { ProductCategoryID = categoryId };
```
```csharp
adventureWorks.ProductCategories.Attach(category);
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```csharp
adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State.WriteLine(); // Unchanged
```
```csharp
adventureWorks.ProductCategories.Remove(category); // Track deletion.
```
```csharp
adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State.WriteLine(); // Deleted
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 1
```
```csharp
// BEGIN TRANSACTION
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```sql
// DELETE FROM [Production].[ProductCategory]
```
```sql
// WHERE [ProductCategoryID] = @p0;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p0 int',@p0=25
```
```csharp
// COMMIT TRANSACTION
```
```csharp
} // Unit of work.
```

}

If a principal entity is loaded with its dependent entities, deleting the principal entity becomes cascade deletion:

internal static void DeleteCascade(int categoryId)

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = adventureWorks.ProductCategories
```
```csharp
.Include(entity => entity.ProductSubcategories)
```
```csharp
.Single(entity => entity.ProductCategoryID == categoryId);
```
```csharp
ProductSubcategory subcategory = category.ProductSubcategories.Single();
```
```csharp
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 2
```
```csharp
adventureWorks.ProductCategories.Remove(category); // Track deletion.
```
```csharp
// Optional: adventureWorks.ProductSubcategories.Remove(subcategory);
```
```csharp
adventureWorks.ChangeTracker.Entries().Count(tracking => tracking.State == EntityState.Deleted)
```
```csharp
.WriteLine(); // 2
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 2
```
```csharp
// BEGIN TRANSACTION
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```sql
// DELETE FROM [Production].[ProductSubcategory]
```
```sql
// WHERE [ProductSubcategoryID] = @p0;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p0 int',@p0=49
```

```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```sql
// DELETE FROM [Production].[ProductCategory]
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p1 int',@p1=26
```
```csharp
// COMMIT TRANSACTION
```
```csharp
} // Unit of work.
```

}

Here the cascade deletion are translated and executed in the right order. The subcategory is deleted first, then category is deleted.

## Transaction

As discussed above, by default DbContext.SaveChanges execute all data creation, update and deletion in a transaction, so that all the work can succeed or fail as a unit. If the unit of work succeeds, the transaction is committed, if any operation fails, the transaction is rolled back. EF Core also supports custom transactions.

### Transaction with connection resiliency and execution strategy

If the retry strategy is enabled for connection resiliency for DbContext by default, then this default retry strategy does not work custom transaction. Custom transaction works within a single retry operation, but not cross multiple retries. In EF Core, database façade’s CreateExecutionStrategy method can be called to explicitly specify a single retry operation:

internal static void ExecutionStrategy(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```csharp
{
```
```csharp
// Single retry operation, which can have custom transactions.
```
```csharp
});
```

}

### EF Core transaction

EF Core provides Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction to represent a transaction. It can be created by DbContext.Database.BeginTransaction, where the transaction’s isolation level can be optionally specified. The following example executes a entity change and custom SQL with one EF Core transaction:

internal static void DbContextTransaction(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```csharp
{
```
```csharp
using (IDbContextTransaction transaction = adventureWorks.Database
```
```csharp
.BeginTransaction(IsolationLevel.ReadUncommitted))
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
```
```csharp
adventureWorks.ProductCategories.Add(category);
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 1
```

```csharp
adventureWorks.Database
```
```sql
.ExecuteSqlCommand($@"DELETE FROM [Production].[ProductCategory] WHERE [Name] = {nameof(ProductCategory)}")
```
```csharp
.WriteLine(); // 1
```
```csharp
adventureWorks.CurrentIsolationLevel().WriteLine(); // ReadUncommitted transaction.Commit();
```
```csharp
}
```
```csharp
catch
```
```csharp
{
```
```csharp
transaction.Rollback();
```
```csharp
throw;
```
```csharp
}
```
```csharp
}
```
```csharp
});
```

}

EF Core transaction wraps ADO.NET transaction. When the EF Core transaction begins, The specified isolation level is written to a packet (represented by System.Data.SqlClient.SNIPacket type), and sent to SQL database via TDS protocol. There is no SQL statement like SET TRANSACTION ISOLATION LEVEL executed, so the actual isolation level cannot be logged by EF Core, or traced by SQL Profiler. In above example, CurrentIsolationLevel is called to verify the current transaction’s isolation level. It is an extension method of DbContext. It queries the dynamic management view sys.dm\_exec\_sessions with current session id, which can be retrieved with @@SPID function:

internal static IsolationLevel CurrentIsolationLevel(this DbConnection connection,

```csharp
DbTransaction transaction = null)
```
```csharp
{
```
```csharp
using (DbCommand command = connection.CreateCommand())
```
```csharp
{
```
```csharp
command.CommandText =
```
```sql
@"SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID";
```
```csharp
command.Transaction = transaction;
```
```csharp
switch ((short)command.ExecuteScalar())
```
```csharp
{
```
```csharp
case 0: return IsolationLevel.Unspecified;
```
```csharp
case 1: return IsolationLevel.ReadUncommitted;
```
```csharp
case 2: return IsolationLevel.ReadCommitted;
```
```csharp
case 3: return IsolationLevel.RepeatableRead;
```
```csharp
case 4: return IsolationLevel.Serializable;
```
```csharp
case 5: return IsolationLevel.Snapshot;
```
```csharp
default: throw new InvalidOperationException();
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

```csharp
internal static IsolationLevel CurrentIsolationLevel(this DbContext dbContext) =>
```
```csharp
dbContext.Database.GetDbConnection().CurrentIsolationLevel(
```

dbContext.Database.CurrentTransaction?.GetDbTransaction());

When DbContext.SaveChanges is called to create entity. it detects a transaction is explicitly created with the current DbContext, so it uses that transaction and does not automatically begins a new transaction like all the previous examples. Then DbContext.Database.ExecuteSqlCommnd is called to delete entity. It also detects and uses transaction of the current DbContext. Eventually, to commit the transaction, call IDbContextTransaction.Commit, to rollback the transaction, call IDbContextTransaction.Rollback.

### ADO.NET transaction

EF Core can also use the ADO.NET transaction, represented by System.Data.Common.DbTransaction. The following example execute the same entity change and custom SQL command with one ADO.NET transaction. To use an existing ADO.NET transaction, call DbContext.Database.UseTransaction:

internal static void DbTransaction()

```csharp
{
```
```csharp
using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
```
```csharp
{
```
```csharp
connection.Open();
```
```csharp
using (DbTransaction transaction = connection.BeginTransaction(IsolationLevel.RepeatableRead))
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks(connection))
```
```csharp
{
```
```csharp
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```csharp
{
```
```csharp
adventureWorks.Database.UseTransaction(transaction);
```
```csharp
adventureWorks.CurrentIsolationLevel().WriteLine(); // RepeatableRead
```

```csharp
ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
```
```csharp
adventureWorks.ProductCategories.Add(category);
```
```csharp
adventureWorks.SaveChanges().WriteLine(); // 1.
```
```csharp
});
```
```csharp
}
```

```csharp
using (DbCommand command = connection.CreateCommand())
```
```csharp
{
```
```sql
command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @Name";
```
```csharp
DbParameter parameter = command.CreateParameter();
```
```csharp
parameter.ParameterName = "@Name";
```
```csharp
parameter.Value = nameof(ProductCategory);
```
```csharp
command.Parameters.Add(parameter);
```
```csharp
command.Transaction = transaction;
```
```csharp
command.ExecuteNonQuery().WriteLine(); // 1
```
```csharp
connection.CurrentIsolationLevel(transaction).WriteLine(); // RepeatableRead
```
```csharp
}
```

```csharp
transaction.Commit();
```
```csharp
}
```
```csharp
catch
```
```csharp
{
```
```csharp
transaction.Rollback();
```
```csharp
throw;
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

}

### Transaction scope

As fore mentioned, EF Core transaction only works with its source DbContext, and the ADO.NET transaction only work with its source DbConnection. EF Core can also use System.Transactions.TransactionScope to have a transaction that work across the lifecycle of multiple DbContext or DbConnection instances:

internal static void TransactionScope(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```csharp
{
```
```csharp
using (TransactionScope scope = new TransactionScope(
```
```csharp
TransactionScopeOption.Required,
```
```csharp
new TransactionOptions() { IsolationLevel = IsolationLevel.Serializable }))
```
```csharp
{
```
```csharp
using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
```
```csharp
using (DbCommand command = connection.CreateCommand())
```
```csharp
{
```
```csharp
command.CommandText = "INSERT INTO [Production].[ProductCategory] ([Name]) VALUES(@Name); ";
```
```csharp
DbParameter parameter = command.CreateParameter();
```
```csharp
parameter.ParameterName = "@Name";
```
```csharp
parameter.Value = nameof(ProductCategory);
```
```csharp
command.Parameters.Add(parameter);
```

```csharp
connection.Open();
```
```csharp
command.ExecuteNonQuery().WriteLine(); // 1
```
```csharp
connection.CurrentIsolationLevel().WriteLine(); // Serializable
```
```csharp
}
```

```csharp
using (AdventureWorks adventureWorks1 = new AdventureWorks())
```
```csharp
{
```
```csharp
ProductCategory category = adventureWorks1.ProductCategories
```
```csharp
.Single(entity => entity.Name == nameof(ProductCategory));
```
```csharp
adventureWorks1.ProductCategories.Remove(category);
```
```csharp
adventureWorks1.SaveChanges().WriteLine(); // 1
```
```csharp
adventureWorks1.CurrentIsolationLevel().WriteLine(); // Serializable
```
```csharp
}
```

```csharp
scope.Complete();
```
```csharp
}
```
```csharp
});
```

}

## Resolving optimistic concurrency

Conflicts can occur if the same data is read and changed concurrently. Generally, there are 2 concurrency control approaches:

· Pessimistic concurrency: one database client can lock the data being accessed, in order to prevent other database clients to change that same data concurrently.

· Optimistic concurrency: Data is not locked in the database for client to CRUD. Any database client is allowed to read and change any data concurrently. As a result, concurrency conflicts can happen. This is how EF Core work with database.

To demonstrate the behavior of EF Core for concurrency, the following DbReaderWriter type is defined as database CRUD client:

internal partial class DbReaderWriter : IDisposable

```csharp
{
```
```csharp
private readonly DbContext context;
```

```csharp
internal DbReaderWriter(DbContext context) => this.context = context;
```

```csharp
internal TEntity Read<TEntity>(params object[] keys) where TEntity : class =>
```
```csharp
this.context.Set<TEntity>().Find(keys);
```

```csharp
internal int Write(Action change)
```
```csharp
{
```
```csharp
change();
```
```csharp
return this.context.SaveChanges();
```
```csharp
}
```

```csharp
internal DbSet<TEntity> Set<TEntity>() where TEntity : class => this.context.Set<TEntity>();
```

```csharp
public void Dispose() => this.context.Dispose();
```

}

Multiple DbReaderWriter instances can be be used to read and write data concurrently. For example:

internal static void NoCheck(

```csharp
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```csharp
{
```
```csharp
int id = 1;
```
```csharp
ProductCategory categoryCopy1 = readerWriter1.Read<ProductCategory>(id);
```
```csharp
ProductCategory categoryCopy2 = readerWriter2.Read<ProductCategory>(id);
```

```csharp
readerWriter1.Write(() => categoryCopy1.Name = nameof(readerWriter1));
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[ProductCategory] SET [Name] = @p0
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p1 int,@p0 nvarchar(50)',@p1=1,@p0=N'readerWriter1'
```
```csharp
readerWriter2.Write(() => categoryCopy2.Name = nameof(readerWriter2)); // Last client wins.
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[ProductCategory] SET [Name] = @p0
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p1 int,@p0 nvarchar(50)',@p1=1,@p0=N'readerWriter2'
```

```csharp
ProductCategory category3 = readerWriter3.Read<ProductCategory>(id);
```
```csharp
category3.Name.WriteLine(); // readerWriter2
```

}

In this example, multiple DbReaderWriter instances read and write data concurrently:

1. readerWriter1 reads category “Bikes”

2. readerWriter2 reads category “Bikes”. These 2 entities are independent because they are are from different DbContext instances.

3. readerWriter1 updates category’s name from “Bikes” to “readerWriter1”. As previously discussed, by default EF Core locate the category with its primary key.

4. In database, this category’s name is no longer “Bikes”

5. readerWriter2 updates category’s name from “Bikes” to “readerWriter2”. It locates the category with its primary key as well. The primary key is unchanged, so the same category can be located and the name can be changed.

6. So later when readerWriter3 reads the entity with the same primary key, the category entity’s Name is “readerWriter2”.

### Detect Concurrency conflicts

Concurrency conflicts can be detected by checking entities’ property values besides primary keys. To required EF Core to check a certain property, just add a System.ComponentModel.DataAnnotations.ConcurrencyCheckAttribute to it. Remember when defining ProductPhoto entity, its ModifiedDate has a \[ConcurrencyCheck\] attribute:

public partial class ProductPhoto

```csharp
{
```
```csharp
[ConcurrencyCheck]
```
```csharp
public DateTime ModifiedDate { get; set; }
```

}

This property is also called the concurrency token. When EF Core translate changes of a photo, ModifiedDate property is checked along with the primary key to locate the photo:

internal static void ConcurrencyCheck(DbReaderWriter readerWriter1, DbReaderWriter readerWriter2)

```csharp
{
```
```csharp
int id = 1;
```
```csharp
ProductPhoto photoCopy1 = readerWriter1.Read<ProductPhoto>(id);
```
```csharp
ProductPhoto photoCopy2 = readerWriter2.Read<ProductPhoto>(id);
```

```csharp
readerWriter1.Write(() =>
```
```csharp
{
```
```csharp
photoCopy1.LargePhotoFileName = nameof(readerWriter1);
```
```csharp
photoCopy1.ModifiedDate = DateTime.Now;
```
```csharp
});
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[ProductPhoto] SET [LargePhotoFileName] = @p0, [ModifiedDate] = @p1
```
```sql
// WHERE [ProductPhotoID] = @p2 AND [ModifiedDate] = @p3;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p2 int,@p0 nvarchar(50),@p1 datetime2(7),@p3 datetime2(7)',@p2=1,@p0=N'readerWriter1',@p1='2017-01-25 22:04:25.9292433',@p3='2008-04-30 00:00:00'
```
```csharp
readerWriter2.Write(() =>
```
```csharp
{
```
```csharp
photoCopy2.LargePhotoFileName = nameof(readerWriter2);
```
```csharp
photoCopy2.ModifiedDate = DateTime.Now;
```
```csharp
});
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[ProductPhoto] SET [LargePhotoFileName] = @p0, [ModifiedDate] = @p1
```
```sql
// WHERE [ProductPhotoID] = @p2 AND [ModifiedDate] = @p3;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p2 int,@p0 nvarchar(50),@p1 datetime2(7),@p3 datetime2(7)',@p2=1,@p0=N'readerWriter2',@p1='2017-01-25 22:04:59.1792263',@p3='2008-04-30 00:00:00'
```
```csharp
// DbUpdateConcurrencyException: Database operation expected to affect 1 row(s) but actually affected 0 row(s). Data may have been modified or deleted since entities were loaded.
```

}

In the translated SQL statement, the WHERE clause contains primary key and the original concurrency token. The following is how EF Core check the concurrency conflicts:

1. readerWriter1 reads photo with primary key 1, and modified date “2008-04-30 00:00:00”

2. readerWriter2 reads the same photo with primary key 1, and modified date “2008-04-30 00:00:00”

3. readerWriter1 locates the photo with primary key and original modified date, and update its large photo file name and modified date.

4. In database the photo’s modified date is no longer the original value “2008-04-30 00:00:00”

5. readerWriter2 tries to locate the photo with primary key and original modified date. However the provided modified date is outdated. EF Core detect that 0 row is updated by the translated SQL, and throws DbUpdateConcurrencyException: Database operation expected to affect 1 row(s) but actually affected 0 row(s). Data may have been modified or deleted since entities were loaded.

Another option for concurrency check is System.ComponentModel.DataAnnotations.TimestampAttribute. It can only be used for a byte\[\] property, which is mapped from a rowversion (timestamp) column. For SQL database, these 2 terms, rowversion and timestamp, are the same thing. timestamp is just a synonym of rowversion data type. A row’s non-nullable rowversion column is a 8 bytes (binary(8)) counter maintained by database, its value increases for each change of the row.

Microsoft’s AdventureWorks sample database does not have such a rowversion column, so create one for the Production.Product table:

ALTER TABLE \[Production\].\[Product\] ADD \[RowVersion\] rowversion NOT NULL

GO

Then define the mapping property for Product entity:

public partial class Product

```csharp
{
```
```csharp
[DatabaseGenerated(DatabaseGeneratedOption.Computed)]
```
```csharp
[Timestamp]
```
```csharp
public byte[] RowVersion { get; set; }
```

```csharp
[NotMapped]
```
```csharp
public string RowVersionString =>
```
```csharp
$"0x{BitConverter.ToUInt64(this.RowVersion.Reverse().ToArray(), 0).ToString("X16")}";
```

}

Now RowVersion property is the concurrency token. Regarding database automatically increases the RowVersion value, Rowversion also has the \[DatabaseGenerated(DatabaseGeneratedOption.Computed)\] attribute. The other RowVersionString property returns a readable representation of the byte array returned by RowVersion. It is not a part of the object-relational mapping, so it has a \[NotMapped\] attribute. The following example updates and and deletes the same product concurrently:

internal static void RowVersion(DbReaderWriter readerWriter1, DbReaderWriter readerWriter2)

```csharp
{
```
```csharp
int id = 995;
```
```csharp
Product productCopy1 = readerWriter1.Read<Product>(id);
```
```csharp
productCopy1.RowVersionString.WriteLine(); // 0x0000000000000803
```

```csharp
Product productCopy2 = readerWriter2.Read<Product>(id);
```
```csharp
productCopy2.RowVersionString.WriteLine(); // 0x0000000000000803
```

```csharp
readerWriter1.Write(() => productCopy1.Name = nameof(readerWriter1));
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```csharp
// UPDATE [Production].[Product] SET [Name] = @p0
```
```sql
// WHERE [ProductID] = @p1 AND [RowVersion] = @p2;
```
```sql
// SELECT [RowVersion]
```
```sql
// FROM [Production].[Product]
```
```sql
// WHERE @@ROWCOUNT = 1 AND [ProductID] = @p1;
```
```csharp
// ',N'@p1 int,@p0 nvarchar(50),@p2 varbinary(8)',@p1=995,@p0=N'readerWriter1',@p2=0x0000000000000803
```
```csharp
productCopy1.RowVersionString.WriteLine(); // 0x00000000000324B1
```
```csharp
readerWriter2.Write(() => readerWriter2.Set<Product>().Remove(productCopy2));
```
```csharp
// exec sp_executesql N'SET NOCOUNT ON;
```
```sql
// DELETE FROM [Production].[Product]
```
```sql
// WHERE [ProductID] = @p0 AND [RowVersion] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```csharp
// ',N'@p0 int,@p1 varbinary(8)',@p0=995,@p1=0x0000000000000803
```
```csharp
// DbUpdateConcurrencyException: Database operation expected to affect 1 row(s) but actually affected 0 row(s). Data may have been modified or deleted since entities were loaded.
```

}

When updating and deleting photo entities, its auto generated RowVersion property value is checked too. So this is how it works:

1. readerWriter1 reads product with primary key 995 and row version 0x0000000000000803

2. readerWriter2 reads product with the same primary key 995 and row version 0x0000000000000803

3. readerWriter1 locates the photo with primary key and original row version, and update its name. Database automatically increases the photo’s row version. Since the row version is specified as \[DatabaseGenerated(DatabaseGeneratedOption.Computed)\], EF Core also locate the photo with the primary key to query the increased row version, and update the entity at client side.

4. In database the product’s row version is no longer 0x0000000000000803.

5. Then readerWriter2 tries to locate the product with primary key and original row version, and delete it. No product can be found with outdated row version, EF Core detect that 0 row is deleted, and throws DbUpdateConcurrencyException.

### Resolve concurrency conflicts

DbUpdateConcurrencyException is thrown when SaveChanges detects concurrency conflict:

namespace Microsoft.EntityFrameworkCore

```csharp
{
```
```csharp
public class DbUpdateException : Exception
```
```csharp
{
```
```csharp
public virtual IReadOnlyList<EntityEntry> Entries { get; }
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public class DbUpdateConcurrencyException : DbUpdateException
```
```csharp
{
```
```csharp
// Members.
```
```csharp
}
```

}

Inherited from DbUpdateException, DbUpdateConcurrencyException has an Entries property. Entries returns a sequence of EntityEntry instances, representing the conflicting entities’ tracking information. The basic idea of resolving concurrency conflicts, is to handle DbUpdateConcurrencyException and retry SaveChanges:

internal partial class DbReaderWriter

```csharp
{
```
```csharp
internal int Write(Action change, Action<DbUpdateConcurrencyException> handleException, int retryCount = 3)
```
```csharp
{
```
```csharp
change();
```
```csharp
for (int retry = 1; retry < retryCount; retry++)
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
return this.context.SaveChanges();
```
```csharp
}
```
```csharp
catch (DbUpdateConcurrencyException exception)
```
```csharp
{
```
```csharp
handleException(exception);
```
```csharp
}
```
```csharp
}
```
```csharp
return this.context.SaveChanges();
```
```csharp
}
```

}

In the above Write overload, if SaveChanges throws DbUpdateConcurrencyException, the handleException function is called. This function is expected to handle the exception and resolve the conflicts properly. Then SaveChanges is called again. If the last retry of SaveChanges still throws DbUpdateConcurrencyException, the exception is thrown to the caller.

### Retain database values (database wins)

Similar to previous examples, the following example has multiple DbReaderWriter instances to update a product concurrently:

internal static void UpdateProduct(

```csharp
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3,
```
```csharp
Action<EntityEntry>resolveConflicts)
```
```csharp
{
```
```csharp
int id = 950;
```
```csharp
Product productCopy1 = readerWriter1.Read<Product>(id);
```
```csharp
Product productCopy2 = readerWriter2.Read<Product>(id);
```

```csharp
readerWriter1.Write(() =>
```
```csharp
{
```
```csharp
productCopy1.Name = nameof(readerWriter1);
```
```csharp
productCopy1.ListPrice = 100.0000M;
```
```csharp
});
```
```csharp
readerWriter2.Write(
```
```csharp
change: () =>
```
```csharp
{
```
```csharp
productCopy2.Name = nameof(readerWriter2);
```
```csharp
productCopy2.ProductSubcategoryID = 1;
```
```csharp
},
```
```csharp
handleException: exception =>
```
```csharp
{
```
```csharp
EntityEntry tracking = exception.Entries.Single();
```
```csharp
Product original = (Product)tracking.OriginalValues.ToObject();
```
```csharp
Product current = (Product)tracking.CurrentValues.ToObject();
```
```csharp
Product database = productCopy1; // Values saved in database.
```
```csharp
$"Original: ({original.Name}, {original.ListPrice}, {original.ProductSubcategoryID}, {original.RowVersionString})"
```
```csharp
.WriteLine();
```
```csharp
$"Database: ({database.Name}, {database.ListPrice}, {database.ProductSubcategoryID}, {database.RowVersionString})"
```
```csharp
.WriteLine();
```
```csharp
$"Update to: ({current.Name}, {current.ListPrice}, {current.ProductSubcategoryID})"
```
```csharp
.WriteLine();
```

```csharp
resolveConflicts(tracking);
```
```csharp
});
```

```csharp
Product resolved = readerWriter3.Read<Product>(id);
```
```csharp
$"Resolved: ({resolved.Name}, {resolved.ListPrice}, {resolved.ProductSubcategoryID}, {resolved.RowVersionString})"
```
```csharp
.WriteLine();
```

}

This is how it works with concurrency conflicts:

1. readerWriter1 reads product with primary key 950, and RowVersion 0x00000000000007D1

2. readerWriter2 reads product with the same primary key 950, and RowVersion 0x00000000000007D1

3. readerWriter1 locates product with primary key and original RowVersion 0x00000000000007D1, and updates product’s name and list price. Database automatically increases the product’s row version

4. In database the product’s row version is no longer 0x00000000000007D1.

5. readerWriter2 tries to locate product with primary key and original RowVersion, and update product’s name and subcategory.

6. readerWriter2 fails to update product, because it cannot locate the product with original RowVersion 0x00000000000007D1. Again, no product can be found with outdated row version, DbUpdateConcurrencyException is thrown.

As a result, the handleException function specified for readWriter2 is called, it retrieves the conflicting product’s tracking information from DbUpdateConcurrencyException.Entries, and logs these information:

· product’s original property values read by readerWriter2 before the changes

· product’s property values in database at this moment, which are already updated readerWriter1

· product’s current property values after changes, which readerWriter2 fails to save to database.

Then handleException calls resolveConflicts function to actually resolve the conflict. Then readerWriter2 retries to save the product changes again. This time, SaveChanges should succeed, because there is no conflicts anymore (In this example, there are only 2 database clients reading/writing data concurrently. In reality, the concurrency can be higher, an appropriate retry count or retry strategy should be specified.). Eventually, readerWriter3 reads the product from database, verify its property values.

There are several options to implement the resolveConflicts function to resolves the conflicts. One simple option, called “database wins”, is to simply give up the client update, and let database retain whatever values it has for that entity. This seems to be easy to just catch DbUpdateConcurrencyException and do nothing, then database naturally wins, and retains its values:

internal partial class DbReaderWriter

```csharp
{
```
```csharp
internal int WriteDatabaseWins(Action change)
```
```csharp
{
```
```csharp
change();
```
```csharp
try
```
```csharp
{
```
```csharp
return this.context.SaveChanges();
```
```csharp
}
```
```csharp
catch (DbUpdateConcurrencyException)
```
```csharp
{
```
```csharp
return 0; // this.context is in a corrupted state.
```
```csharp
}
```
```csharp
}
```

}

However, this way leaves the DbContext, the conflicting entity, and the entity’s tracking information in a corrupted state. For the caller, since the change saving is done, the entity’s property values should be in sync with database values, but the values are actually out of sync and still conflicting. Also, the entity has a tracking state Modified after change saving is done. So the safe approach is to reload and refresh the entity’s values and tracking information:

internal static void DatabaseWins(

```csharp
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```csharp
{
```
```csharp
UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
```
```csharp
{
```
```csharp
tracking.State.WriteLine(); // Modified
```
```csharp
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // True
```
```csharp
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
```
```csharp
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
```

```csharp
tracking.Reload(); // Execute query.
```

```csharp
tracking.State.WriteLine(); // Unchanged
```
```csharp
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // False
```
```csharp
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
```
```csharp
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // False
```
```csharp
});
```
```csharp
// Original: (ML Crankset, 256.4900, 8, 0x00000000000007D1)
```
```csharp
// Database: (readerWriter1, 100.0000, 8, 0x0000000000036335)
```
```csharp
// Update to: (readerWriter2, 256.4900, 1)
```
```csharp
// Resolved: (readerWriter1, 100.0000, 8, 0x0000000000036335)
```

}

UpdateProduct is called with a resolveConflicts function, which resolves the conflict by calling Reload method on the EntityEntry instance representing the conflicting product’s tracking information:

1. EntityEntry.Reload executes a SELECT statement to read the product’s property values from database, then refresh the product entity and all tracking information. The product’s property values, the tracked original property values before changes, the tracked current property values after changes, are all refreshed to the queried database values. The entity tracking state is also refreshed to Unchanged.

2. At this moment, product has the same tracked original values and current values, as if it is just initially read from database, without changes.

3. When DbReaderWriter.Write’s retry logic calls SaveChanges again, no changed entity is detected. SaveChanges succeeds without executing any SQL, and returns 0. As expected, readerWriter2 does not update any value to database, and all values in database are retained.

Later, when readerWriter3 reads the product again, product has all values updated by readerWrtier1.

### Overwrite database values (client wins)

Another simple option, called “client wins”, is to disregard values in database, and overwrite them with whatever data submitted from client.

internal static void ClientWins(

```csharp
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```csharp
{
```
```csharp
UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
```
```csharp
{
```
```csharp
PropertyValues databaseValues = tracking.GetDatabaseValues();
```
```sql
// Refresh original values, which go to WHERE clause of UPDATE statement.
```
```csharp
tracking.OriginalValues.SetValues(databaseValues);
```

```csharp
tracking.State.WriteLine(); // Modified
```
```csharp
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // True
```
```csharp
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // True
```
```csharp
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
```
```csharp
});
```
```csharp
// Original: (ML Crankset, 256.4900, 8, 0x00000000000007D1)
```
```csharp
// Database: (readerWriter1, 100.0000, 8, 0x0000000000036336)
```
```csharp
// Update to: (readerWriter2, 256.4900, 1)
```
```csharp
// Resolved: (readerWriter2, 256.4900, 1, 0x0000000000036337)
```

}

The same conflict is resolved differently:

1. EntityEntry.GetDatabaseValues executes a SELECT statement to read the product’s property values from database, including the updated row version. This call does not impact the product values or tracking information.

2. Manually set the tracked original property values to the queried database values. The entity tracking state is still Changed. The original property values become all different from tracked current property values. So all product properties are tracked as modified.

3. At this moment, the product has tracked original values updated, and keeps all tracked current values, as if it is read from database after readerWriter1 updates the name and list price, and then have all properties values changed.

4. When DbReaderWriter.Write’s retry logic calls SaveChanges again, product changes are detected to submit. So EF Core translate the product change to a UPDATE statement. In the SET clause, since there are 3 properties tracked as modified, 3 columns are set. In the WHERE clause, to locate the product, the tracked original row version has been set to the updated value from database. This time product can be located, and all 3 properties are updated. SaveChanges succeeds and returns 1. As expected, readerWriter2 updates all value to database.

Later, when readerWriter3 reads the product again, product has all values updated by readerWrter2.

### Merge with database values

A more complex but useful option, is to merge the client values and database values. For each property:

· If original value is different from database value, which means database value is already updated by other concurrent client, then give up updating this property, and retain the database value

· If original value is the same as database value, which means no concurrency conflict for this property, then process normally to submit the change

internal static void MergeClientAndDatabase(

```csharp
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```csharp
{
```
```csharp
UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
```
```csharp
{
```
```csharp
PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute query.
```
```csharp
PropertyValues originalValues = tracking.OriginalValues.Clone();
```
```sql
// Refresh original values, which go to WHERE clause.
```
```csharp
tracking.OriginalValues.SetValues(databaseValues);
```
```csharp
// If database has an different value for a property, then retain the database value.
```
```csharp
databaseValues.Properties // Navigation properties are not included.
```
```csharp
.Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
```
```csharp
.ForEach(property => tracking.Property(property.Name).IsModified = false);
```
```csharp
tracking.State.WriteLine(); // Modified
```
```csharp
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // False
```
```csharp
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
```
```csharp
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
```
```csharp
});
```
```csharp
// Original: (ML Crankset, 256.4900, 8, 0x00000000000007D1)
```
```csharp
// Database: (readerWriter1, 100.0000, 8, 0x0000000000036338)
```
```csharp
// Update to: (readerWriter2, 256.4900, 1)
```
```csharp
// Resolved: (readerWriter1, 100.0000, 1, 0x0000000000036339)
```

}

With this approach:

1. Again, EntityEntry.GetDatabaseValues executes a SELECT statement to read the product’s property values from database, including the updated row version.

2. Backup tracked original values, then refresh conflict.OriginalValues to the database values, so that these values can go to the translated WHERE clause. Again, the entity tracking state is still Changed. The original property values become all different from tracked current property values. So all product values are tracked as modified and should go to SET clause.

3. For each property, if the backed original value is different from the database value, it means this property is changed by other client and there is concurrency conflict. In this case, revert this property’s tracking status to unmodified. The name and list price are reverted.

4. At this moment, the product has tracked original values updated, and only keeps tracked current value of subcategory, as if it is read from database after readerWriter1 updates the name and list price, and then only have subcategory changed, which has no conflict.

5. When DbReaderWriter.Write’s retry logic calls SaveChanges again, product changes are detected to submit. Here only subcategory is updated to database. SaveChanges succeeds and returns 1. As expected, readerWriter2 only updates value without conflict, the other conflicted values are retained.

Later, when readerWriter3 reads the product, product has name and list price values updated by readerWrtier1, and has subcategory updated by readerWriter2.

### Save changes with concurrency conflict handling

Similar to above DbReaderWriter.Write method, a general SaveChanges extension method for DbContext can be defined to handle concurrency conflicts and apply simple retry logic:

public static int SaveChanges(

```csharp
this DbContext context, Action<IEnumerable<EntityEntry>> resolveConflicts, int retryCount = 3)
```
```csharp
{
```
```csharp
if (retryCount <= 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(retryCount));
```
```csharp
}
```

```csharp
for (int retry = 1; retry < retryCount; retry++)
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
return context.SaveChanges();
```
```csharp
}
```
```csharp
catch (DbUpdateConcurrencyException exception) when (retry < retryCount)
```
```csharp
{
```
```csharp
resolveConflicts(exception.Entries);
```
```csharp
}
```
```csharp
}
```
```csharp
return context.SaveChanges();
```

}

To apply custom retry logic, Microsoft provides EnterpriseLibrary.TransientFaultHandling NuGet package (Exception Handling Application Block) for .NET Framework. It has been ported to .NET Core for this tutorial, as EnterpriseLibrary.TransientFaultHandling.Core NuGet package. can be used. With this library, a SaveChanges overload with customizable retry logic can be easily defined:

public class TransientDetection<TException> : ITransientErrorDetectionStrategy

```csharp
where TException : Exception
```
```csharp
{
```
```csharp
public bool IsTransient(Exception ex) => ex is TException;
```
```csharp
}
```

```csharp
public static int SaveChanges(
```
```csharp
this DbContext context, Action<IEnumerable<EntityEntry>> resolveConflicts, RetryStrategy retryStrategy)
```
```csharp
{
```
```csharp
RetryPolicy retryPolicy = new RetryPolicy(
```
```csharp
errorDetectionStrategy: new TransientDetection<DbUpdateConcurrencyException>(),
```
```csharp
retryStrategy: retryStrategy);
```
```csharp
retryPolicy.Retrying += (sender, e) =>
```
```csharp
resolveConflicts(((DbUpdateConcurrencyException)e.LastException).Entries);
```
```csharp
return retryPolicy.ExecuteAction(context.SaveChanges);
```

}

Here Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.ITransientErrorDetectionStrategy is the contract to detect each exception, and determine whether the exception is transient and the operation should be retried. Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryStrategy is the contract of retry logic. Then Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryPolicy executes the operation with the specified exception detection, exception handling, and retry logic.

As discussed above, to resolve a concurrency conflict, the entity and its tracking information need to be refreshed. So the more specific SaveChanges overloads can be implemented by applying refresh for each conflict:

public enum RefreshConflict

```csharp
{
```
```csharp
StoreWins,
```

```csharp
ClientWins,
```

```csharp
MergeClientAndStore
```
```csharp
}
```

```csharp
public static int SaveChanges(this DbContext context, RefreshConflict refreshMode, int retryCount = 3)
```
```csharp
{
```
```csharp
if (retryCount< = 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(retryCount));
```
```csharp
}
```

```csharp
return context.SaveChanges(
```
```csharp
conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryCount);
```
```csharp
}
```

```csharp
public static int SaveChanges(
```
```csharp
this DbContext context, RefreshConflict refreshMode, RetryStrategy retryStrategy) =>
```
```csharp
context.SaveChanges(
```

conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryStrategy);

A RefreshConflict enumeration has to be defined with 3 members to represent the 3 options discussed above: database wins, client wind, merge client and database.. And here the Refresh method is an extension method for EntityEntry:

public static EntityEntry Refresh(this EntityEntry tracking, RefreshConflict refreshMode)

```csharp
{
```
```csharp
switch (refreshMode)
```
```csharp
{
```
```csharp
case RefreshConflict.StoreWins:
```
```csharp
{
```
```csharp
// When entity is already deleted in database, Reload sets tracking state to Detached.
```
```csharp
// When entity is already updated in database, Reload sets tracking state to Unchanged.
```
```csharp
tracking.Reload(); // Execute SELECT.
```
```csharp
// Hereafter, SaveChanges ignores this entity.
```
```csharp
break;
```
```csharp
}
```
```csharp
case RefreshConflict.ClientWins:
```
```csharp
{
```
```csharp
PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
```
```csharp
if (databaseValues == null)
```
```csharp
{
```
```csharp
// When entity is already deleted in database, there is nothing for client to win against.
```
```csharp
// Manually set tracking state to Detached.
```
```csharp
tracking.State = EntityState.Detached;
```
```csharp
// Hereafter, SaveChanges ignores this entity.
```
```csharp
}
```
```csharp
else
```
```csharp
{
```
```sql
// When entity is already updated in database, refresh original values, which go to in WHERE clause.
```
```csharp
tracking.OriginalValues.SetValues(databaseValues);
```
```sql
// Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
```
```csharp
}
```
```csharp
break;
```
```csharp
}
```
```csharp
case RefreshConflict.MergeClientAndStore:
```
```csharp
{
```
```csharp
PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
```
```csharp
if (databaseValues == null)
```
```csharp
{
```
```csharp
// When entity is already deleted in database, there is nothing for client to merge with.
```
```csharp
// Manually set tracking state to Detached.
```
```csharp
tracking.State = EntityState.Detached;
```
```csharp
// Hereafter, SaveChanges ignores this entity.
```
```csharp
}
```
```csharp
else
```
```csharp
{
```
```sql
// When entity is already updated, refresh original values, which go to WHERE clause.
```
```csharp
PropertyValues originalValues = tracking.OriginalValues.Clone();
```
```csharp
tracking.OriginalValues.SetValues(databaseValues);
```
```csharp
// If database has an different value for a property, then retain the database value.
```
```csharp
databaseValues.Properties // Navigation properties are not included.
```
```csharp
.Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
```
```csharp
.ForEach(property => tracking.Property(property.Name).IsModified = false);
```
```sql
// Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
```
```csharp
}
```
```csharp
break;
```
```csharp
}
```
```csharp
}
```
```csharp
return tracking;
```

}

This Refresh extension method covers the update conflicts discussed above, as well as deletion conflicts. Now the these SaveChanges extension methods can be used to manage concurrency conflicts easily. For example:

internal static void SaveChanges(AdventureWorks adventureWorks1, AdventureWorks adventureWorks2)

```csharp
{
```
```csharp
int id = 950;
```
```csharp
Product productCopy1 = adventureWorks1.Products.Find(id);
```
```csharp
Product productCopy2 = adventureWorks2.Products.Find(id);
```

```csharp
productCopy1.Name = nameof(adventureWorks1);
```
```csharp
productCopy1.ListPrice = 100;
```
```csharp
adventureWorks1.SaveChanges();
```

```csharp
productCopy2.Name = nameof(adventureWorks2);
```
```csharp
productCopy2.ProductSubcategoryID = 1;
```
```csharp
adventureWorks2.SaveChanges(RefreshConflict.MergeClientAndStore);
```

}