---
title: "Entity Framework Core and LINQ to Entities in Depth (7) Data Changes and Transactions"
published: 2019-10-14
description: "Besides LINQ to Entities queries, EF Core also provides rich APIs for data changes, with imperative paradigm."
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework Core", "LINQ to Entities", "SQL Server", "SQL", "EF Core", ".NET Core"]
category: "C#"
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
```
{
```
```
public abstract class DbSet<TEntity> : IQueryable<TEntity> // Other interfaces.
```
```
where TEntity : class
```
```
{
```
```
public virtual TEntity Find(params object[] keyValues);
```
```
public virtual EntityEntry<TEntity> Add(TEntity entity);
```
```
public virtual void AddRange(IEnumerable<TEntity> entities);
```
```
public virtual EntityEntry<TEntity> Remove(TEntity entity);
```
```
public virtual void RemoveRange(IEnumerable<TEntity> entities);
```
```
// Other members.
```
```
}
```

}

DbSet<T> implements IQueryable<T>, so that DbSet<T> can represent the data source to read from. DbSet<T>.Find is also provided to read entity by the primary keys. After reading, the retrieved data can be changed. Add and AddRange methods track the specified entities as to be created in the repository. Remove and RemoveRange methods track the specified entities as to be deleted in the repository.

As fore mentioned, a unit of work is a collection of data operations that should together or fail together as a unit. DbContext implements unit of work pattern:

namespace Microsoft.EntityFrameworkCore
```
{
```
```csharp
public class DbContext : IDisposable, IInfrastructure<IServiceProvider>
```
```
{
```
```
public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;
```
```
public virtual ChangeTracker ChangeTracker { get; }
```
```
public virtual int SaveChanges();
```
```
public virtual void Dispose();
```
```
}
```

}

As the mapping of database, DbContext’s Set method returns the specified entity’s repositories. For example, calling AdventureWorks.Products is equivalent to calling AdventureWorks.Set<Product>. The entities tracking is done at the DbContext level, by its ChangeTracker. When DbContext.Submit is called, the tracked changes are submitted to database. When a unit of work is done, DbContext should be disposed.

## Track entities and changes

DbContext.ChangeTracker property returns Microsoft.EntityFrameworkCore.ChangeTracking.ChangeTracker, which can track entities for the source DbContext:

namespace Microsoft.EntityFrameworkCore.ChangeTracking
```
{
```
```csharp
public class ChangeTracker : IInfrastructure<IStateManager>
```
```
{
```
```
public virtual IEnumerable<EntityEntry> Entries();
```
```
public virtual IEnumerable<EntityEntry<TEntity>> Entries<TEntity>() where TEntity : class;
```
```
public virtual void DetectChanges();
```
```
public virtual bool HasChanges();
```
```
// Other members.
```
```
}
```

}

Each entity’s loading and tracking information is represented by Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry or Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity>. The following is the non generic EntityEntry:

namespace Microsoft.EntityFrameworkCore.ChangeTracking
```
{
```
```csharp
public class EntityEntry : IInfrastructure<InternalEntityEntry>
```
```
{
```
```
public virtual EntityState State { get; set; }
```
```
public virtual object Entity { get; }
```
```
public virtual PropertyEntry Property(string propertyName);
```
```
public virtual PropertyValues CurrentValues { get; }
```
```
public virtual PropertyValues OriginalValues { get; }
```
```
public virtual PropertyValues GetDatabaseValues();
```
```
public virtual void Reload();
```
```
// Other members.
```
```
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
```
{
```
```csharp
public class EntityEntry<TEntity> : EntityEntry where TEntity : class
```
```
{
```
```
public virtual TEntity Entity { get; }
```
```
// Other members.
```
```
}
```

}

As fore mentioned in data loading part, DbContext.Entry also accepts an entity and return its EntityEntry<TEntity>/EntityEntry.

### Track entities

By default, all entities read from repositories are tracked by the source DbContext. For example:

internal static void EntitiesFromSameDbContext(AdventureWorks adventureWorks)
```
{
```
```
Product productById = adventureWorks.Products
```
```
.Single(product => product.ProductID == 999);
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```
Product productByName = adventureWorks.Products
```
```
.Single(product => product.Name == "Road-750 Black, 52");
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```
object.ReferenceEquals(productById, productByName).WriteLine(); // True
```

}

The single result from the first LINQ to Entities query is tracked by DbContext. Later, the second query has a single result too. EF Core identifies both results map to the same data row of the same table, so they are reference to the same entity instance.

If data from repositories are not entities mapping to table rows, they cannot be tracked:

internal static void ObjectsFromSameDbContext(AdventureWorks adventureWorks)
```
{
```
```
var productById = adventureWorks.Products
```
```
.Select(product => new { ProductID = product.ProductID, Name = product.Name })
```
```
.Single(product => product.ProductID == 999);
```
```
var productByName = adventureWorks.Products
```
```
.Select(product => new { ProductID = product.ProductID, Name = product.Name })
```
```
.Single(product => product.Name == "Road-750 Black, 52");
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
```
```
object.ReferenceEquals(productById, productByName).WriteLine(); // False
```

}

Here data is queries from repositories, and anonymous type instances are constructed on the fly. EF Core cannot decide if 2 arbitrary instances semantically represent the same piece of data in remote database. This time 2 query results are independent from each other.

Since the tracking is at DbContext scope. Entities of different DbContext instances belong to different units of work, and do not interfere each other:

internal static void EntitiesFromMultipleDbContexts()
```
{
```
```
Product productById;
```
```
Product productByName;
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
productById = adventureWorks.Products.Single(product => product.ProductID == 999);
```
```
}
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
productByName = adventureWorks.Products.Single(product => product.Name == "Road-750 Black, 52");
```
```
}
```
```
object.ReferenceEquals(productById, productByName).WriteLine(); // False.
```

}

### Track entity changes and property changes

The following example demonstrate CRUD operations in the product repository, then examine all the tracking information:

internal static void EntityChanges(AdventureWorks adventureWorks)
```
{
```
```
Product create = new Product() { Name = nameof(create), ListPrice = 1 };
```
```
adventureWorks.Products.Add(create); // Create locally.
```
```
Product read = adventureWorks.Products.Single(product => product.ProductID == 999); // Read from remote to local.
```
```
IQueryable<Product> update = adventureWorks.Products
```
```
.Where(product => product.Name.Contains("HL"));
```
```
update.ForEach(product => product.ListPrice += 100); // Update locally.
```
```
IQueryable<Product> delete = adventureWorks.Products
```
```
.Where(product => product.Name.Contains("ML"));
```
```
adventureWorks.Products.RemoveRange(delete); // Delete locally.
```
```
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // True
```
```
adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
```
```
{
```
```
Product changed = tracking.Entity;
```
```
switch (tracking.State)
```
```
{
```
```
case EntityState.Added:
```
```
case EntityState.Deleted:
```
```
case EntityState.Unchanged:
```
```
$"{tracking.State}: {(changed.ProductID, changed.Name, changed.ListPrice)}".WriteLine();
```
```
break;
```
```
case EntityState.Modified:
```
```
Product original = (Product)tracking.OriginalValues.ToObject();
```
```
$"{tracking.State}: {(original.ProductID, original.Name, original.ListPrice)} => {(changed.ProductID, changed.Name, changed.ListPrice)}"
```
```
.WriteLine();
```
```
break;
```
```
}
```
```
});
```
```
// Added: (-2147482647, toCreate, 1)
```
```
// Unchanged: (999, Road-750 Black, 52, 539.9900)
```
```
// Modified: (951, HL Crankset, 404.9900) => (951, HL Crankset, 504.9900)
```
```
// Modified: (996, HL Bottom Bracket, 121.4900) => (996, HL Bottom Bracket, 221.4900)
```
```
// Deleted: (950, ML Crankset, 256.4900)
```
```
// Deleted: (995, ML Bottom Bracket, 101.2400)
```

}

If an entity is not read from a DbContext instance’s repositories, then it has nothing to do with that unit of work, and apparently is not tracked by that DbContext instance. DbSet<T> provides an Attach method to place an entity to the repository, and the DbContext tracks the entity as the Unchanged state:

internal static void Attach(AdventureWorks adventureWorks)
```
{
```
```
Product product = new Product() { ProductID = 950, Name = "ML Crankset", ListPrice = 539.99M };
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
```
```
adventureWorks.Products.Attach(product);
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```
adventureWorks.ChangeTracker.Entries<Product>().Single().State.WriteLine(); // Unchanged
```
```
product.Name = "After attaching";
```
```
adventureWorks.ChangeTracker.Entries<Product>().Single().State.WriteLine(); // Modified
```
```
adventureWorks.ChangeTracker.Entries<Product>().WriteLines(tracking =>
```
```
$"{tracking.State}: {tracking.OriginalValues[nameof(Product.Name)]} => {tracking.CurrentValues[nameof(Product.Name)]}");
```
```
// Modified: ML Crankset => After attaching
```

}

### Track relationship changes

The relationship of entities is also tracked. Remember Product’s foreign key ProductSubcategoryID is nullable. The following example reads a subcategory and its products, then delete the relationship. As a result, each navigation property is cleared to empty collection or null. And each related subcategory’s foreign key property value is synced to null, which is tracked:

internal static void RelationshipChanges(AdventureWorks adventureWorks)
```
{
```
```
ProductSubcategory subcategory = adventureWorks.ProductSubcategories
```
```
.Include(entity => entity.Products).Single(entity => entity.ProductSubcategoryID == 8);
```
```
subcategory.Products.Count.WriteLine(); // 2
```
```
subcategory.Products
```
```
.All(product => product.ProductSubcategory == subcategory).WriteLine(); // True
```
```
subcategory.Products.Clear();
```
```
// Equivalent to: subcategory.Products.ForEach(product => product.ProductSubcategory = null);
```
```
subcategory.Products.Count.WriteLine(); // 0
```
```
subcategory.Products
```
```
.All(product => product.ProductSubcategory == null).WriteLine(); // True
```
```
adventureWorks.ChangeTracker.Entries<Product>().ForEach(tracking =>
```
```
{
```
```
Product original = (Product)tracking.OriginalValues.ToObject();
```
```
Product changed = tracking.Entity;
```
```
$"{tracking.State}: {(original.ProductID, original.Name, original.ProductSubcategoryID)} => {(changed.ProductID, changed.Name, changed.ProductSubcategoryID)}".WriteLine();
```
```
});
```
```
// Modified: (950, ML Crankset, 8) => (950, ML Crankset, )
```
```
// Modified: (951, HL Crankset, 8) => (951, HL Crankset, )
```

}

### Enable and disable tracking

DbContext’s default behavior is to track all changes automatically. This can be turned off if not needed. To disable tracking for specific entities queried from repository, call the EntityFrameworkQueryableExtensions.AsNoTracking extension method for IQueryable<T> query:

internal static void AsNoTracking(AdventureWorks adventureWorks)
```
{
```
```
Product untracked = adventureWorks.Products.AsNoTracking().First();
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 0
```

}

Tracking can also be enabled or disabled at the DbContext scope, by setting the ChangeTracker.AutoDetectChangesEnabled property to true or false. The default value of ChangeTracker.AutoDetectChangesEnabled is true, so usually it is not needed to manually detect changes by calling ChangeTracker.DetectChanges method. The changes are automatically detected when DbContext.SubmitChanges is called. The changes are also automatically detected when tracking information is calculated, for example, when calling ChangeTracker.Entries, DbContext.Entry, etc.

If needed, changes and be manually tracked by calling ChangeTracker.DetectChanges method:

internal static void DetectChanges(AdventureWorks adventureWorks)
```
{
```
```
adventureWorks.ChangeTracker.AutoDetectChangesEnabled = false;
```
```
Product product = adventureWorks.Products.First();
```
```
product.ListPrice += 100;
```
```
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // False
```
```
adventureWorks.ChangeTracker.DetectChanges();
```
```
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // True
```

}

## Change data

To change the data in the database, just create a DbContext instance, change the data in its repositories, and call DbContext.SaveChanges method to submit the tracked changes to the remote database as a unit of work.

### Create

To create new entities into the repository, call DbSet<T>.Add or DbSet<T>.AddRange. The following example creates a new category, and a new related subcategory, and add to repositories:

internal static ProductCategory Create()
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductCategory category = new ProductCategory() { Name = "Create" };
```
```
ProductSubcategory subcategory = new ProductSubcategory() { Name = "Create" };
```
```
category.ProductSubcategories = new HashSet<ProductSubcategory>() { subcategory };
```
```
// Equivalent to: subcategory.ProductCategory = category;
```
```
category.ProductCategoryID.WriteLine(); // 0
```
```
subcategory.ProductCategoryID.WriteLine(); // 0
```
```
subcategory.ProductSubcategoryID.WriteLine(); // 0
```
```
adventureWorks.ProductCategories.Add(category); // Track creation.
```
```
// Equivalent to: adventureWorks.ProductSubcategories.Add(subcategory);
```
```
adventureWorks.ChangeTracker.Entries()
```
```
.Count(tracking => tracking.State == EntityState.Added).WriteLine(); // 2
```
```
object.ReferenceEquals(category.ProductSubcategories.Single(), subcategory).WriteLine(); // True
```
```
adventureWorks.SaveChanges().WriteLine(); // 2
```
```
// BEGIN TRANSACTION
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// INSERT INTO [Production].[ProductCategory] ([Name])
```
```
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
```
// ',N'@p0 nvarchar(50)',@p0=N'Create'
```
```
//
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// INSERT INTO [Production].[ProductCategory] ([Name])
```
```
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
```
// ',N'@p0 nvarchar(50)',@p0=N'Create'
```
```
// COMMIT TRANSACTION
```
```
adventureWorks.ChangeTracker.Entries()
```
```
.Count(tracking => tracking.State != EntityState.Unchanged).WriteLine(); // 0
```
```
category.ProductCategoryID.WriteLine(); // 5
```
```
subcategory.ProductCategoryID.WriteLine(); // 5
```
```
subcategory.ProductSubcategoryID.WriteLine(); // 38
```
```
return category;
```
```
} // Unit of work.
```

}

Here DbSet<T>.Add is called only once with 1 subcategory entity. Internally, Add triggers change detection, and tracks this subcategory as Added state. Since this subcategory is related with another category entity with navigation property, the related category is also tracked, as the Added state too. So in total there are 2 entity changes tracked. When DbContext.SaveChanges is called, EF Core translates these 2 changes to 2 SQL INSERT statements:

The category’s key is identity key, with value generated by database, so is subcategory. So in the translated INSERT statements, the new category’s ProductCategoryID and the new subcategory’s ProductSubcategory are ignored. After the each new row is created, a SELECT statement calls SCOPE\_IDENTITY metadata function to read the last generated identity value, which is the primary key of the inserted row. As a result, since there are 2 row changes in total, SaveChanges returns 2, And the 2 changes are submitted in a transaction, so that all changes can succeed or fail as a unit.

DbSet<T>.AddRange can be called with multiple entities. AddRange only triggers change detection once for all the entities, so it can have better performance than multiple Add calls,

### Update

To update entities in the repositories, just change their properties, including navigation properties. The following example updates a subcategory entity’s name, and related category entity, which is translated to UPDATE statement:

internal static void Update(int categoryId, int subcategoryId)
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductCategory category = adventureWorks.ProductCategories.Find(categoryId);
```
```
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.Find(subcategoryId);
```
```
$"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})"
```
```
.WriteLine(); // (48, Create, 25)
```
```
subcategory.Name = "Update"; // Entity property update.
```
```
subcategory.ProductCategory = category; // Relashionship (foreign key) update.
```
```
adventureWorks.ChangeTracker.Entries().Count(tracking => tracking.State != EntityState.Unchanged)
```
```
.WriteLine(); // 1
```
```
$"({subcategory.ProductSubcategoryID}, {subcategory.Name}, {subcategory.ProductCategoryID})"
```
```
.WriteLine(); // (48, Update, 1)
```
```
adventureWorks.SaveChanges().WriteLine(); // 1
```
```
// BEGIN TRANSACTION
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// UPDATE [Production].[ProductSubcategory] SET [Name] = @p0, [ProductCategoryID] = @p1
```
```sql
// WHERE [ProductSubcategoryID] = @p2;
```
```sql
// SELECT @@ROWCOUNT;
```
```
// ',N'@p2 int,@p0 nvarchar(50),@p1 int',@p2=25,@p0=N'Update',@p1=25
```
```
// COMMIT TRANSACTION
```
```
} // Unit of work.
```

}

The above example first call Find to read the entities with a SELECT query, then execute the UPDATE statement. Here the row to update is located by primary key, so, if the primary key is known, then it can be used directly:

internal static void UpdateWithoutRead(int categoryId)
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductCategory category = new ProductCategory()
```
```
{
```
```
ProductCategoryID = categoryId,
```
```
Name = Guid.NewGuid().ToString() // To be updated.
```
```
};
```
```
adventureWorks.ProductCategories.Attach(category); // Track entity.
```
```
EntityEntry tracking = adventureWorks.ChangeTracker.Entries<ProductCategory>().Single();
```
```
tracking.State.WriteLine(); // Unchanged
```
```
tracking.State = EntityState.Modified;
```
```
adventureWorks.SaveChanges().WriteLine(); // 1
```
```
// BEGIN TRANSACTION
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// UPDATE [Production].[ProductCategory] SET [Name] = @p0
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```
// ',N'@p1 int,@p0 nvarchar(50)',@p1=25,@p0=N'513ce396-4a5e-4a86-9d82-46f284aa4f94'
```
```
// COMMIT TRANSACTION
```
```
} // Unit of work.
```

}

Here a category entity is constructed on the fly, with specified primary key and updated Name. To track and save the changes, ii is attached to the repository. As fore mentioned, the attached entity is tracked as Unchanged state, so just manually set its state to Modified. This time, only one UPDATE statement is translated and executed, without SELECT.

When there is no change to save, SaveChanges does not translate or execute any SQL and returns 0:

internal static void SaveNoChanges(int categoryId)
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductCategory category = adventureWorks.ProductCategories.Find(categoryId);
```
```
string originalName = category.Name;
```
```
category.Name = Guid.NewGuid().ToString(); // Entity property update.
```
```
category.Name = originalName; // Entity property update.
```
```
EntityEntry tracking = adventureWorks.ChangeTracker.Entries().Single();
```
```
tracking.State.WriteLine(); // Unchanged
```
```
adventureWorks.ChangeTracker.HasChanges().WriteLine(); // False
```
```
adventureWorks.SaveChanges().WriteLine(); // 0
```
```
} // Unit of work.
```

}

### Delete

To delete entities from the repositories, call DbSet<T>.Remove or DbSet<T>.RemoveRange. The following example read an entity then delete it:

internal static void Delete(int subcategoryId)
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.Find(subcategoryId);
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```
adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State.WriteLine(); // Unchanged
```
```
adventureWorks.ProductSubcategories.Remove(subcategory); // Track deletion.
```
```
adventureWorks.ChangeTracker.Entries<ProductSubcategory>().Single().State.WriteLine(); // Deleted
```
```
adventureWorks.SaveChanges().WriteLine(); // 1
```
```
// BEGIN TRANSACTION
```
```
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
```
// ',N'@p0 int',@p0=48
```
```
// COMMIT TRANSACTION
```
```
} // Unit of work.
```

}

Here, the row to delete is also located with primary key. So again, when primary key is known, reading entity can be skipped:

internal static void DeleteWithoutRead(int categoryId)
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductCategory category = new ProductCategory() { ProductCategoryID = categoryId };
```
```
adventureWorks.ProductCategories.Attach(category);
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 1
```
```
adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State.WriteLine(); // Unchanged
```
```
adventureWorks.ProductCategories.Remove(category); // Track deletion.
```
```
adventureWorks.ChangeTracker.Entries<ProductCategory>().Single().State.WriteLine(); // Deleted
```
```
adventureWorks.SaveChanges().WriteLine(); // 1
```
```
// BEGIN TRANSACTION
```
```
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
```
// ',N'@p0 int',@p0=25
```
```
// COMMIT TRANSACTION
```
```
} // Unit of work.
```

}

If a principal entity is loaded with its dependent entities, deleting the principal entity becomes cascade deletion:

internal static void DeleteCascade(int categoryId)
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
ProductCategory category = adventureWorks.ProductCategories
```
```
.Include(entity => entity.ProductSubcategories)
```
```
.Single(entity => entity.ProductCategoryID == categoryId);
```
```
ProductSubcategory subcategory = category.ProductSubcategories.Single();
```
```
adventureWorks.ChangeTracker.Entries().Count().WriteLine(); // 2
```
```
adventureWorks.ProductCategories.Remove(category); // Track deletion.
```
```
// Optional: adventureWorks.ProductSubcategories.Remove(subcategory);
```
```
adventureWorks.ChangeTracker.Entries().Count(tracking => tracking.State == EntityState.Deleted)
```
```
.WriteLine(); // 2
```
```
adventureWorks.SaveChanges().WriteLine(); // 2
```
```
// BEGIN TRANSACTION
```
```
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
```
// ',N'@p0 int',@p0=49
```
```
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
```
// ',N'@p1 int',@p1=26
```
```
// COMMIT TRANSACTION
```
```
} // Unit of work.
```

}

Here the cascade deletion are translated and executed in the right order. The subcategory is deleted first, then category is deleted.

## Transaction

As discussed above, by default DbContext.SaveChanges execute all data creation, update and deletion in a transaction, so that all the work can succeed or fail as a unit. If the unit of work succeeds, the transaction is committed, if any operation fails, the transaction is rolled back. EF Core also supports custom transactions.

### Transaction with connection resiliency and execution strategy

If the retry strategy is enabled for connection resiliency for DbContext by default, then this default retry strategy does not work custom transaction. Custom transaction works within a single retry operation, but not cross multiple retries. In EF Core, database façade’s CreateExecutionStrategy method can be called to explicitly specify a single retry operation:

internal static void ExecutionStrategy(AdventureWorks adventureWorks)
```
{
```
```
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```
{
```
```
// Single retry operation, which can have custom transactions.
```
```
});
```

}

### EF Core transaction

EF Core provides Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction to represent a transaction. It can be created by DbContext.Database.BeginTransaction, where the transaction’s isolation level can be optionally specified. The following example executes a entity change and custom SQL with one EF Core transaction:

internal static void DbContextTransaction(AdventureWorks adventureWorks)
```
{
```
```
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```
{
```
```
using (IDbContextTransaction transaction = adventureWorks.Database
```
```
.BeginTransaction(IsolationLevel.ReadUncommitted))
```
```
{
```
```
try
```
```
{
```
```
ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
```
```
adventureWorks.ProductCategories.Add(category);
```
```
adventureWorks.SaveChanges().WriteLine(); // 1
```
```
adventureWorks.Database
```
```sql
.ExecuteSqlCommand($@"DELETE FROM [Production].[ProductCategory] WHERE [Name] = {nameof(ProductCategory)}")
```
```
.WriteLine(); // 1
```
```
adventureWorks.CurrentIsolationLevel().WriteLine(); // ReadUncommitted transaction.Commit();
```
```
}
```
```
catch
```
```
{
```
```
transaction.Rollback();
```
```
throw;
```
```
}
```
```
}
```
```
});
```

}

EF Core transaction wraps ADO.NET transaction. When the EF Core transaction begins, The specified isolation level is written to a packet (represented by System.Data.SqlClient.SNIPacket type), and sent to SQL database via TDS protocol. There is no SQL statement like SET TRANSACTION ISOLATION LEVEL executed, so the actual isolation level cannot be logged by EF Core, or traced by SQL Profiler. In above example, CurrentIsolationLevel is called to verify the current transaction’s isolation level. It is an extension method of DbContext. It queries the dynamic management view sys.dm\_exec\_sessions with current session id, which can be retrieved with @@SPID function:

internal static IsolationLevel CurrentIsolationLevel(this DbConnection connection,
```
DbTransaction transaction = null)
```
```
{
```
```
using (DbCommand command = connection.CreateCommand())
```
```
{
```
```
command.CommandText =
```
```sql
@"SELECT transaction_isolation_level FROM sys.dm_exec_sessions WHERE session_id = @@SPID";
```
```
command.Transaction = transaction;
```
```
switch ((short)command.ExecuteScalar())
```
```
{
```
```
case 0: return IsolationLevel.Unspecified;
```
```
case 1: return IsolationLevel.ReadUncommitted;
```
```
case 2: return IsolationLevel.ReadCommitted;
```
```
case 3: return IsolationLevel.RepeatableRead;
```
```
case 4: return IsolationLevel.Serializable;
```
```
case 5: return IsolationLevel.Snapshot;
```
```
default: throw new InvalidOperationException();
```
```
}
```
```
}
```
```
}
```
```
internal static IsolationLevel CurrentIsolationLevel(this DbContext dbContext) =>
```
```
dbContext.Database.GetDbConnection().CurrentIsolationLevel(
```

dbContext.Database.CurrentTransaction?.GetDbTransaction());

When DbContext.SaveChanges is called to create entity. it detects a transaction is explicitly created with the current DbContext, so it uses that transaction and does not automatically begins a new transaction like all the previous examples. Then DbContext.Database.ExecuteSqlCommnd is called to delete entity. It also detects and uses transaction of the current DbContext. Eventually, to commit the transaction, call IDbContextTransaction.Commit, to rollback the transaction, call IDbContextTransaction.Rollback.

### ADO.NET transaction

EF Core can also use the ADO.NET transaction, represented by System.Data.Common.DbTransaction. The following example execute the same entity change and custom SQL command with one ADO.NET transaction. To use an existing ADO.NET transaction, call DbContext.Database.UseTransaction:

internal static void DbTransaction()
```
{
```
```
using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
```
```
{
```
```
connection.Open();
```
```
using (DbTransaction transaction = connection.BeginTransaction(IsolationLevel.RepeatableRead))
```
```
{
```
```
try
```
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks(connection))
```
```
{
```
```
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```
{
```
```
adventureWorks.Database.UseTransaction(transaction);
```
```
adventureWorks.CurrentIsolationLevel().WriteLine(); // RepeatableRead
```
```
ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
```
```
adventureWorks.ProductCategories.Add(category);
```
```
adventureWorks.SaveChanges().WriteLine(); // 1.
```
```
});
```
```
}
```
```
using (DbCommand command = connection.CreateCommand())
```
```
{
```
```sql
command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @Name";
```
```
DbParameter parameter = command.CreateParameter();
```
```
parameter.ParameterName = "@Name";
```
```
parameter.Value = nameof(ProductCategory);
```
```
command.Parameters.Add(parameter);
```
```
command.Transaction = transaction;
```
```
command.ExecuteNonQuery().WriteLine(); // 1
```
```
connection.CurrentIsolationLevel(transaction).WriteLine(); // RepeatableRead
```
```
}
```
```
transaction.Commit();
```
```
}
```
```
catch
```
```
{
```
```
transaction.Rollback();
```
```
throw;
```
```
}
```
```
}
```
```
}
```

}

### Transaction scope

As fore mentioned, EF Core transaction only works with its source DbContext, and the ADO.NET transaction only work with its source DbConnection. EF Core can also use System.Transactions.TransactionScope to have a transaction that work across the lifecycle of multiple DbContext or DbConnection instances:

internal static void TransactionScope(AdventureWorks adventureWorks)
```
{
```
```
adventureWorks.Database.CreateExecutionStrategy().Execute(() =>
```
```
{
```
```
using (TransactionScope scope = new TransactionScope(
```
```
TransactionScopeOption.Required,
```
```
new TransactionOptions() { IsolationLevel = IsolationLevel.Serializable }))
```
```
{
```
```
using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
```
```
using (DbCommand command = connection.CreateCommand())
```
```
{
```
```
command.CommandText = "INSERT INTO [Production].[ProductCategory] ([Name]) VALUES(@Name); ";
```
```
DbParameter parameter = command.CreateParameter();
```
```
parameter.ParameterName = "@Name";
```
```
parameter.Value = nameof(ProductCategory);
```
```
command.Parameters.Add(parameter);
```
```
connection.Open();
```
```
command.ExecuteNonQuery().WriteLine(); // 1
```
```
connection.CurrentIsolationLevel().WriteLine(); // Serializable
```
```
}
```
```
using (AdventureWorks adventureWorks1 = new AdventureWorks())
```
```
{
```
```
ProductCategory category = adventureWorks1.ProductCategories
```
```
.Single(entity => entity.Name == nameof(ProductCategory));
```
```
adventureWorks1.ProductCategories.Remove(category);
```
```
adventureWorks1.SaveChanges().WriteLine(); // 1
```
```
adventureWorks1.CurrentIsolationLevel().WriteLine(); // Serializable
```
```
}
```
```
scope.Complete();
```
```
}
```
```
});
```

}

## Resolving optimistic concurrency

Conflicts can occur if the same data is read and changed concurrently. Generally, there are 2 concurrency control approaches:

· Pessimistic concurrency: one database client can lock the data being accessed, in order to prevent other database clients to change that same data concurrently.

· Optimistic concurrency: Data is not locked in the database for client to CRUD. Any database client is allowed to read and change any data concurrently. As a result, concurrency conflicts can happen. This is how EF Core work with database.

To demonstrate the behavior of EF Core for concurrency, the following DbReaderWriter type is defined as database CRUD client:

internal partial class DbReaderWriter : IDisposable
```
{
```
```csharp
private readonly DbContext context;
```
```
internal DbReaderWriter(DbContext context) => this.context = context;
```
```
internal TEntity Read<TEntity>(params object[] keys) where TEntity : class =>
```
```
this.context.Set<TEntity>().Find(keys);
```
```
internal int Write(Action change)
```
```
{
```
```
change();
```
```
return this.context.SaveChanges();
```
```
}
```
```
internal DbSet<TEntity> Set<TEntity>() where TEntity : class => this.context.Set<TEntity>();
```
```
public void Dispose() => this.context.Dispose();
```

}

Multiple DbReaderWriter instances can be be used to read and write data concurrently. For example:

internal static void NoCheck(
```
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```
{
```
```
int id = 1;
```
```
ProductCategory categoryCopy1 = readerWriter1.Read<ProductCategory>(id);
```
```
ProductCategory categoryCopy2 = readerWriter2.Read<ProductCategory>(id);
```
```
readerWriter1.Write(() => categoryCopy1.Name = nameof(readerWriter1));
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// UPDATE [Production].[ProductCategory] SET [Name] = @p0
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```
// ',N'@p1 int,@p0 nvarchar(50)',@p1=1,@p0=N'readerWriter1'
```
```
readerWriter2.Write(() => categoryCopy2.Name = nameof(readerWriter2)); // Last client wins.
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// UPDATE [Production].[ProductCategory] SET [Name] = @p0
```
```sql
// WHERE [ProductCategoryID] = @p1;
```
```sql
// SELECT @@ROWCOUNT;
```
```
// ',N'@p1 int,@p0 nvarchar(50)',@p1=1,@p0=N'readerWriter2'
```
```
ProductCategory category3 = readerWriter3.Read<ProductCategory>(id);
```
```
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
```
{
```
```
[ConcurrencyCheck]
```
```
public DateTime ModifiedDate { get; set; }
```

}

This property is also called the concurrency token. When EF Core translate changes of a photo, ModifiedDate property is checked along with the primary key to locate the photo:

internal static void ConcurrencyCheck(DbReaderWriter readerWriter1, DbReaderWriter readerWriter2)
```
{
```
```
int id = 1;
```
```
ProductPhoto photoCopy1 = readerWriter1.Read<ProductPhoto>(id);
```
```
ProductPhoto photoCopy2 = readerWriter2.Read<ProductPhoto>(id);
```
```
readerWriter1.Write(() =>
```
```
{
```
```
photoCopy1.LargePhotoFileName = nameof(readerWriter1);
```
```
photoCopy1.ModifiedDate = DateTime.Now;
```
```
});
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// UPDATE [Production].[ProductPhoto] SET [LargePhotoFileName] = @p0, [ModifiedDate] = @p1
```
```sql
// WHERE [ProductPhotoID] = @p2 AND [ModifiedDate] = @p3;
```
```sql
// SELECT @@ROWCOUNT;
```
```
// ',N'@p2 int,@p0 nvarchar(50),@p1 datetime2(7),@p3 datetime2(7)',@p2=1,@p0=N'readerWriter1',@p1='2017-01-25 22:04:25.9292433',@p3='2008-04-30 00:00:00'
```
```
readerWriter2.Write(() =>
```
```
{
```
```
photoCopy2.LargePhotoFileName = nameof(readerWriter2);
```
```
photoCopy2.ModifiedDate = DateTime.Now;
```
```
});
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
// UPDATE [Production].[ProductPhoto] SET [LargePhotoFileName] = @p0, [ModifiedDate] = @p1
```
```sql
// WHERE [ProductPhotoID] = @p2 AND [ModifiedDate] = @p3;
```
```sql
// SELECT @@ROWCOUNT;
```
```
// ',N'@p2 int,@p0 nvarchar(50),@p1 datetime2(7),@p3 datetime2(7)',@p2=1,@p0=N'readerWriter2',@p1='2017-01-25 22:04:59.1792263',@p3='2008-04-30 00:00:00'
```
```
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
```
{
```
```
[DatabaseGenerated(DatabaseGeneratedOption.Computed)]
```
```
[Timestamp]
```
```
public byte[] RowVersion { get; set; }
```
```
[NotMapped]
```
```
public string RowVersionString =>
```
```
$"0x{BitConverter.ToUInt64(this.RowVersion.Reverse().ToArray(), 0).ToString("X16")}";
```

}

Now RowVersion property is the concurrency token. Regarding database automatically increases the RowVersion value, Rowversion also has the \[DatabaseGenerated(DatabaseGeneratedOption.Computed)\] attribute. The other RowVersionString property returns a readable representation of the byte array returned by RowVersion. It is not a part of the object-relational mapping, so it has a \[NotMapped\] attribute. The following example updates and and deletes the same product concurrently:

internal static void RowVersion(DbReaderWriter readerWriter1, DbReaderWriter readerWriter2)
```
{
```
```
int id = 995;
```
```
Product productCopy1 = readerWriter1.Read<Product>(id);
```
```
productCopy1.RowVersionString.WriteLine(); // 0x0000000000000803
```
```
Product productCopy2 = readerWriter2.Read<Product>(id);
```
```
productCopy2.RowVersionString.WriteLine(); // 0x0000000000000803
```
```
readerWriter1.Write(() => productCopy1.Name = nameof(readerWriter1));
```
```
// exec sp_executesql N'SET NOCOUNT ON;
```
```
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
```
// ',N'@p1 int,@p0 nvarchar(50),@p2 varbinary(8)',@p1=995,@p0=N'readerWriter1',@p2=0x0000000000000803
```
```
productCopy1.RowVersionString.WriteLine(); // 0x00000000000324B1
```
```
readerWriter2.Write(() => readerWriter2.Set<Product>().Remove(productCopy2));
```
```
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
```
// ',N'@p0 int,@p1 varbinary(8)',@p0=995,@p1=0x0000000000000803
```
```
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
```
{
```
```csharp
public class DbUpdateException : Exception
```
```
{
```
```
public virtual IReadOnlyList<EntityEntry> Entries { get; }
```
```
// Other members.
```
```
}
```

```csharp
public class DbUpdateConcurrencyException : DbUpdateException
```
```
{
```
```
// Members.
```
```
}
```

}

Inherited from DbUpdateException, DbUpdateConcurrencyException has an Entries property. Entries returns a sequence of EntityEntry instances, representing the conflicting entities’ tracking information. The basic idea of resolving concurrency conflicts, is to handle DbUpdateConcurrencyException and retry SaveChanges:

internal partial class DbReaderWriter
```
{
```
```
internal int Write(Action change, Action<DbUpdateConcurrencyException> handleException, int retryCount = 3)
```
```
{
```
```
change();
```
```
for (int retry = 1; retry < retryCount; retry++)
```
```
{
```
```
try
```
```
{
```
```
return this.context.SaveChanges();
```
```
}
```
```
catch (DbUpdateConcurrencyException exception)
```
```
{
```
```
handleException(exception);
```
```
}
```
```
}
```
```
return this.context.SaveChanges();
```
```
}
```

}

In the above Write overload, if SaveChanges throws DbUpdateConcurrencyException, the handleException function is called. This function is expected to handle the exception and resolve the conflicts properly. Then SaveChanges is called again. If the last retry of SaveChanges still throws DbUpdateConcurrencyException, the exception is thrown to the caller.

### Retain database values (database wins)

Similar to previous examples, the following example has multiple DbReaderWriter instances to update a product concurrently:

internal static void UpdateProduct(
```
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3,
```
```
Action<EntityEntry>resolveConflicts)
```
```
{
```
```
int id = 950;
```
```
Product productCopy1 = readerWriter1.Read<Product>(id);
```
```
Product productCopy2 = readerWriter2.Read<Product>(id);
```
```
readerWriter1.Write(() =>
```
```
{
```
```
productCopy1.Name = nameof(readerWriter1);
```
```
productCopy1.ListPrice = 100.0000M;
```
```
});
```
```
readerWriter2.Write(
```
```
change: () =>
```
```
{
```
```
productCopy2.Name = nameof(readerWriter2);
```
```
productCopy2.ProductSubcategoryID = 1;
```
```
},
```
```
handleException: exception =>
```
```
{
```
```
EntityEntry tracking = exception.Entries.Single();
```
```
Product original = (Product)tracking.OriginalValues.ToObject();
```
```
Product current = (Product)tracking.CurrentValues.ToObject();
```
```
Product database = productCopy1; // Values saved in database.
```
```
$"Original: ({original.Name}, {original.ListPrice}, {original.ProductSubcategoryID}, {original.RowVersionString})"
```
```
.WriteLine();
```
```
$"Database: ({database.Name}, {database.ListPrice}, {database.ProductSubcategoryID}, {database.RowVersionString})"
```
```
.WriteLine();
```
```
$"Update to: ({current.Name}, {current.ListPrice}, {current.ProductSubcategoryID})"
```
```
.WriteLine();
```
```
resolveConflicts(tracking);
```
```
});
```
```
Product resolved = readerWriter3.Read<Product>(id);
```
```
$"Resolved: ({resolved.Name}, {resolved.ListPrice}, {resolved.ProductSubcategoryID}, {resolved.RowVersionString})"
```
```
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
```
{
```
```
internal int WriteDatabaseWins(Action change)
```
```
{
```
```
change();
```
```
try
```
```
{
```
```
return this.context.SaveChanges();
```
```
}
```
```
catch (DbUpdateConcurrencyException)
```
```
{
```
```
return 0; // this.context is in a corrupted state.
```
```
}
```
```
}
```

}

However, this way leaves the DbContext, the conflicting entity, and the entity’s tracking information in a corrupted state. For the caller, since the change saving is done, the entity’s property values should be in sync with database values, but the values are actually out of sync and still conflicting. Also, the entity has a tracking state Modified after change saving is done. So the safe approach is to reload and refresh the entity’s values and tracking information:

internal static void DatabaseWins(
```
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```
{
```
```
UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
```
```
{
```
```
tracking.State.WriteLine(); // Modified
```
```
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // True
```
```
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
```
```
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
```
```
tracking.Reload(); // Execute query.
```
```
tracking.State.WriteLine(); // Unchanged
```
```
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // False
```
```
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
```
```
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // False
```
```
});
```
```
// Original: (ML Crankset, 256.4900, 8, 0x00000000000007D1)
```
```
// Database: (readerWriter1, 100.0000, 8, 0x0000000000036335)
```
```
// Update to: (readerWriter2, 256.4900, 1)
```
```
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
```
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```
{
```
```
UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
```
```
{
```
```
PropertyValues databaseValues = tracking.GetDatabaseValues();
```
```sql
// Refresh original values, which go to WHERE clause of UPDATE statement.
```
```
tracking.OriginalValues.SetValues(databaseValues);
```
```
tracking.State.WriteLine(); // Modified
```
```
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // True
```
```
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // True
```
```
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
```
```
});
```
```
// Original: (ML Crankset, 256.4900, 8, 0x00000000000007D1)
```
```
// Database: (readerWriter1, 100.0000, 8, 0x0000000000036336)
```
```
// Update to: (readerWriter2, 256.4900, 1)
```
```
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
```
DbReaderWriter readerWriter1, DbReaderWriter readerWriter2, DbReaderWriter readerWriter3)
```
```
{
```
```
UpdateProduct(readerWriter1, readerWriter2, readerWriter3, resolveConflicts: tracking =>
```
```
{
```
```
PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute query.
```
```
PropertyValues originalValues = tracking.OriginalValues.Clone();
```
```sql
// Refresh original values, which go to WHERE clause.
```
```
tracking.OriginalValues.SetValues(databaseValues);
```
```
// If database has an different value for a property, then retain the database value.
```
```
databaseValues.Properties // Navigation properties are not included.
```
```
.Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
```
```
.ForEach(property => tracking.Property(property.Name).IsModified = false);
```
```
tracking.State.WriteLine(); // Modified
```
```
tracking.Property(nameof(Product.Name)).IsModified.WriteLine(); // False
```
```
tracking.Property(nameof(Product.ListPrice)).IsModified.WriteLine(); // False
```
```
tracking.Property(nameof(Product.ProductSubcategoryID)).IsModified.WriteLine(); // True
```
```
});
```
```
// Original: (ML Crankset, 256.4900, 8, 0x00000000000007D1)
```
```
// Database: (readerWriter1, 100.0000, 8, 0x0000000000036338)
```
```
// Update to: (readerWriter2, 256.4900, 1)
```
```
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
```
this DbContext context, Action<IEnumerable<EntityEntry>> resolveConflicts, int retryCount = 3)
```
```
{
```
```
if (retryCount <= 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(retryCount));
```
```
}
```
```
for (int retry = 1; retry < retryCount; retry++)
```
```
{
```
```
try
```
```
{
```
```
return context.SaveChanges();
```
```
}
```
```
catch (DbUpdateConcurrencyException exception) when (retry < retryCount)
```
```
{
```
```
resolveConflicts(exception.Entries);
```
```
}
```
```
}
```
```
return context.SaveChanges();
```

}

To apply custom retry logic, Microsoft provides EnterpriseLibrary.TransientFaultHandling NuGet package (Exception Handling Application Block) for .NET Framework. It has been ported to .NET Core for this tutorial, as EnterpriseLibrary.TransientFaultHandling.Core NuGet package. can be used. With this library, a SaveChanges overload with customizable retry logic can be easily defined:

public class TransientDetection<TException> : ITransientErrorDetectionStrategy
```
where TException : Exception
```
```
{
```
```
public bool IsTransient(Exception ex) => ex is TException;
```
```
}
```
```
public static int SaveChanges(
```
```
this DbContext context, Action<IEnumerable<EntityEntry>> resolveConflicts, RetryStrategy retryStrategy)
```
```
{
```
```
RetryPolicy retryPolicy = new RetryPolicy(
```
```
errorDetectionStrategy: new TransientDetection<DbUpdateConcurrencyException>(),
```
```
retryStrategy: retryStrategy);
```
```
retryPolicy.Retrying += (sender, e) =>
```
```
resolveConflicts(((DbUpdateConcurrencyException)e.LastException).Entries);
```
```
return retryPolicy.ExecuteAction(context.SaveChanges);
```

}

Here Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.ITransientErrorDetectionStrategy is the contract to detect each exception, and determine whether the exception is transient and the operation should be retried. Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryStrategy is the contract of retry logic. Then Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.RetryPolicy executes the operation with the specified exception detection, exception handling, and retry logic.

As discussed above, to resolve a concurrency conflict, the entity and its tracking information need to be refreshed. So the more specific SaveChanges overloads can be implemented by applying refresh for each conflict:

public enum RefreshConflict
```
{
```
```
StoreWins,
```
```
ClientWins,
```
```
MergeClientAndStore
```
```
}
```
```
public static int SaveChanges(this DbContext context, RefreshConflict refreshMode, int retryCount = 3)
```
```
{
```
```
if (retryCount< = 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(retryCount));
```
```
}
```
```
return context.SaveChanges(
```
```
conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryCount);
```
```
}
```
```
public static int SaveChanges(
```
```
this DbContext context, RefreshConflict refreshMode, RetryStrategy retryStrategy) =>
```
```
context.SaveChanges(
```

conflicts => conflicts.ForEach(tracking => tracking.Refresh(refreshMode)), retryStrategy);

A RefreshConflict enumeration has to be defined with 3 members to represent the 3 options discussed above: database wins, client wind, merge client and database.. And here the Refresh method is an extension method for EntityEntry:

public static EntityEntry Refresh(this EntityEntry tracking, RefreshConflict refreshMode)
```
{
```
```
switch (refreshMode)
```
```
{
```
```
case RefreshConflict.StoreWins:
```
```
{
```
```
// When entity is already deleted in database, Reload sets tracking state to Detached.
```
```
// When entity is already updated in database, Reload sets tracking state to Unchanged.
```
```
tracking.Reload(); // Execute SELECT.
```
```
// Hereafter, SaveChanges ignores this entity.
```
```
break;
```
```
}
```
```
case RefreshConflict.ClientWins:
```
```
{
```
```
PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
```
```
if (databaseValues == null)
```
```
{
```
```
// When entity is already deleted in database, there is nothing for client to win against.
```
```
// Manually set tracking state to Detached.
```
```
tracking.State = EntityState.Detached;
```
```
// Hereafter, SaveChanges ignores this entity.
```
```
}
```
```
else
```
```
{
```
```sql
// When entity is already updated in database, refresh original values, which go to in WHERE clause.
```
```
tracking.OriginalValues.SetValues(databaseValues);
```
```sql
// Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
```
```
}
```
```
break;
```
```
}
```
```
case RefreshConflict.MergeClientAndStore:
```
```
{
```
```
PropertyValues databaseValues = tracking.GetDatabaseValues(); // Execute SELECT.
```
```
if (databaseValues == null)
```
```
{
```
```
// When entity is already deleted in database, there is nothing for client to merge with.
```
```
// Manually set tracking state to Detached.
```
```
tracking.State = EntityState.Detached;
```
```
// Hereafter, SaveChanges ignores this entity.
```
```
}
```
```
else
```
```
{
```
```sql
// When entity is already updated, refresh original values, which go to WHERE clause.
```
```
PropertyValues originalValues = tracking.OriginalValues.Clone();
```
```
tracking.OriginalValues.SetValues(databaseValues);
```
```
// If database has an different value for a property, then retain the database value.
```
```
databaseValues.Properties // Navigation properties are not included.
```
```
.Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
```
```
.ForEach(property => tracking.Property(property.Name).IsModified = false);
```
```sql
// Hereafter, SaveChanges executes UPDATE/DELETE for this entity, with refreshed values in WHERE clause.
```
```
}
```
```
break;
```
```
}
```
```
}
```
```
return tracking;
```

}

This Refresh extension method covers the update conflicts discussed above, as well as deletion conflicts. Now the these SaveChanges extension methods can be used to manage concurrency conflicts easily. For example:

internal static void SaveChanges(AdventureWorks adventureWorks1, AdventureWorks adventureWorks2)
```
{
```
```
int id = 950;
```
```
Product productCopy1 = adventureWorks1.Products.Find(id);
```
```
Product productCopy2 = adventureWorks2.Products.Find(id);
```
```
productCopy1.Name = nameof(adventureWorks1);
```
```
productCopy1.ListPrice = 100;
```
```
adventureWorks1.SaveChanges();
```
```
productCopy2.Name = nameof(adventureWorks2);
```
```
productCopy2.ProductSubcategoryID = 1;
```
```
adventureWorks2.SaveChanges(RefreshConflict.MergeClientAndStore);
```

}