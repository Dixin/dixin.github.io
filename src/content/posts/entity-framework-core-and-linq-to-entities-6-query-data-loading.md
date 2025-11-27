---
title: "Entity Framework Core and LINQ to Entities in Depth (6) Query Data Loading"
published: 2019-10-11
description: "After translated to SQL, in LINQ to Entities, sequence queries returning IQueryable<T> implements deferred execution too."
image: ""
tags: [".NET", ".NET Core", "C#", "EF Core", "Entity Framework Core", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: "Entity Framework Core"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core (EF Core) series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework (EF) series](/archive/?tag=Entity%20Framework)\]

After translated to SQL, in LINQ to Entities, sequence queries returning IQueryable<T> implements deferred execution too.

### Deferred execution

As previous part discussed, when defining a LINQ to Entities query represented by IQueryable<T>, an expression tree is built, there is no query execution. The execution is deferred until trying to pull the results from the query.

### Iterator pattern

IQueryable<T> implements IEnumerable<T>, so values can be pulled from IQueryable<T> with the standard iterator pattern. When trying to pull the first value, EF Core translates LINQ to Entities query to SQL, and execute SQL in the database. The implementation can be demonstrated with the Iterator<T> type from the LINQ to Objects chapter:

public static IEnumerator<TEntity> GetEntityIterator<TEntity>(

```csharp
this IQueryable<TEntity> query, DbContext dbContext) where TEntity : class
```
```csharp
{
```
```csharp
"| |_Compile LINQ expression tree to database expression tree.".WriteLine();
```
```csharp
(SelectExpression DatabaseExpression, IReadOnlyDictionary<string, object> Parameters) compilation = dbContext.Compile(query.Expression);
```

```csharp
IEnumerator<TEntity> entityIterator = null;
```
```csharp
return new Iterator<TEntity>(
```
```csharp
start: () =>
```
```csharp
{
```
```csharp
"| |_Generate SQL from database expression tree.".WriteLine();
```
```csharp
IRelationalCommand sql = dbContext.Generate(compilation.DatabaseExpression);
```
```csharp
IEnumerable<TEntity> sqlQuery = dbContext.Set<TEntity>().FromRawSql(
```
```csharp
sql: sql.CommandText,
```
```csharp
parameters: compilation.Parameters
```
```csharp
.Select(parameter => new SqlParameter(parameter.Key, parameter.Value)).ToArray());
```
```csharp
entityIterator = sqlQuery.GetEnumerator();
```
```csharp
"| |_Execute generated SQL.".WriteLine();
```
```csharp
},
```
```csharp
moveNext: () => entityIterator.MoveNext(),
```
```csharp
getCurrent: () =>
```
```csharp
{
```
```csharp
$"| |_Materialize data row to {typeof(TEntity).Name} entity.".WriteLine();
```
```csharp
return entityIterator.Current;
```
```csharp
},
```
```csharp
dispose: () => entityIterator.Dispose(),
```
```csharp
end: () => " |_End.".WriteLine()).Start();
```

}

The following example executes Where and Take query to load 3 products with more than 10 characters in name. It demonstrates how to pull the results from IQueryable<T> with the iterator pattern:

internal static void DeferredExecution(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<Product> categories = adventureWorks.Products
```
```csharp
.Where(product => product.Name.Length > 100)
```
```csharp
.Take(3);
```
```csharp
"Iterator - Create from LINQ to Entities query.".WriteLine();
```
```csharp
using (IEnumerator<Product> iterator = categories.GetEntityIterator(adventureWorks)) // Compile query.
```
```csharp
{
```
```csharp
int index = 0;
```
```csharp
while (new Func<bool>(() =>
```
```csharp
{
```
```csharp
bool moveNext = iterator.MoveNext();
```
```csharp
$"|_Iterator - [{index++}] {nameof(IEnumerator<Product>.MoveNext)}: {moveNext}.".WriteLine();
```
```csharp
return moveNext; // Generate SQL when first time called.
```
```csharp
})())
```
```csharp
{
```
```csharp
Product product = iterator.Current;
```
```csharp
$"| |_Iterator - [{index}] {nameof(IEnumerator<Product>.Current)}: {product.Name}.".WriteLine();
```
```csharp
}
```
```csharp
}
```
```csharp
// Iterator - Create from LINQ to Entities query.
```
```csharp
// | |_Compile LINQ expression tree to database expression tree.
```
```csharp
// |_Iterator - [0] MoveNext: True.
```
```csharp
// | |_Generate SQL from database expression tree.
```
```csharp
// | |_Execute generated SQL.
```
```csharp
// | |_Materialize data row to Product entity.
```
```csharp
// | |_Iterator - [0] Current: ML Crankset.
```
```csharp
// |_Iterator - [1] MoveNext: True.
```
```csharp
// | |_Materialize data row to Product entity.
```
```csharp
// | |_Iterator - [1] Current: HL Crankset.
```
```csharp
// |_Iterator - [2] MoveNext: True.
```
```csharp
// | |_Materialize data row to Product entity.
```
```csharp
// | |_Iterator - [2] Current: Touring-2000 Blue, 60.
```
```csharp
// |_Iterator - [3] MoveNext: False.
```
```csharp
// |_End.
```

}

Here for demonstration purpose, the GetEntityIterator extension method of IQueryable<T> is called instead of GetEnumerator. In EF Core, when the iterator is created from IQueryable<T>, the LINQ query expression tree is compiled to database query expression tree. Later, when the iterator’s MoveNext method is called for the first time, the SQL query is generated and executed. In each iteration, an entity is materialized from the SQL execution result.

### Lazy evaluation vs. eager evaluation

Deferred execution can be either lazy evaluation or eager evaluation. Internally, EF Core call ADP.NET APIs to execute query, including DbDataReader, etc. DbDataReader is abstract class. EF Core SQL database provider actually uses SqlDataReader in ADO.NET, which is derived from DbDataReader, to load the database query results. By default, when SqlDataReader starts to read data, it streams a number of rows to local buffer through TDS (tabular data stream) protocol. So by default, LINQ to Entities’ deferred execution is neither eager (load all rows when pulling the first result), nor totally lazy (load 1 result when pulling each result).

When retry logic is specified for connection resiliency, EF Core become eager evaluation. When trying to pull the first query result, EF Core call DbDataReader to load all results from database.

### Explicit loading

After an entity is queried, its related entities can be loaded through the navigation property. DbContext.Entry method accepts an entity of type TEntity, and returns Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity>, which represents that entity’s tracking and loading information. EntityEntry<TEntity> provides a Reference method to return Microsoft.EntityFrameworkCore.ChangeTracking.ReferenceEntry<TEntity, TProperty> instance, which represents the tracking and loading information of a single related entity from reference navigation property. EntityEntry<TEntity> also provides a Collection method to return Microsoft.EntityFrameworkCore.ChangeTracking.ReferenceEntry.CollectionEntry<TEntity, TProperty>, which represents the tracking and loading information of multiple related entities from collection navigation property. These related entities in the navigation properties can be manually loaded by calling ReferenceEntry<TEntity, TProperty>.Load and CollectionEntry<TEntity, TProperty>.Load:

internal static void ExplicitLoading(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
```
```sql
// SELECT TOP(1) [p].[ProductSubcategoryID], [p].[Name], [p].[ProductCategoryID]
```
```sql
// FROM [Production].[ProductSubcategory] AS [p]
```
```csharp
subcategory.Name.WriteLine();
```

```csharp
adventureWorks
```
```csharp
.Entry(subcategory) // Return EntityEntry<ProductSubcategory>.
```
```csharp
.Reference(entity => entity.ProductCategory) // Return ReferenceEntry<ProductSubcategory, ProductCategory>.
```
```csharp
.Load(); // Execute query.
```
```sql
// exec sp_executesql N'SELECT [e].[ProductCategoryID], [e].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [e]
```
```sql
// WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```
```csharp
subcategory.ProductCategory.Name.WriteLine();
```

```csharp
adventureWorks
```
```csharp
.Entry(subcategory) // Return EntityEntry<ProductSubcategory>.
```
```csharp
.Collection(entity => entity.Products) // Return CollectionEntry<ProductSubcategory, Product>.
```
```csharp
.Load(); // Execute query.
```
```sql
// exec sp_executesql N'SELECT [e].[ProductID], [e].[ListPrice], [e].[Name], [e].[ProductSubcategoryID]
```
```sql
// FROM [Production].[Product] AS [e]
```
```sql
// WHERE [e].[ProductSubcategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```
```csharp
subcategory.Products.WriteLines(product => product.Name);
```

}

When the Load method is called, the related entities are queried, and become available through the navigation properties. Besides loading the full entities, explicit lazy loading also support custom query. The following example uses the reference navigation property and collection navigation property as LINQ to Entities data sources, by calling ReferenceEntry<TEntity, TProperty>.Query and CollectionEntry<TEntity, TProperty>.Query:

internal static void ExplicitLoadingWithQuery(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
```
```sql
// SELECT TOP(1) [p].[ProductSubcategoryID], [p].[Name], [p].[ProductCategoryID]
```
```sql
// FROM [Production].[ProductSubcategory] AS [p]
```
```csharp
subcategory.Name.WriteLine();
```
```csharp
string categoryName = adventureWorks
```
```csharp
.Entry(subcategory).Reference(entity => entity.ProductCategory)
```
```csharp
.Query() // Return IQueryable<ProductCategory>.
```
```csharp
.Select(category => category.Name).Single(); // Execute query.
```
```sql
// exec sp_executesql N'SELECT TOP(2) [e].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [e]
```
```sql
// WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```
```csharp
categoryName.WriteLine();
```

```csharp
IQueryable<string>products = adventureWorks
```
```csharp
.Entry(subcategory).Collection(entity => entity.Products)
```
```csharp
.Query() // Return IQueryable<Product>.
```
```csharp
.Select(product => product.Name); // Execute query.
```
```sql
// exec sp_executesql N'SELECT [e].[Name]
```
```sql
// FROM [Production].[Product] AS [e]
```
```sql
// WHERE [e].[ProductSubcategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```
```csharp
products.WriteLines();
```

}

### Eager loading

In explicit loading, after an entity is queried, its related entities are loaded separately. In eager loading, when an entity is queried, its related entities are loaded during the same query. To enable eager loading, call Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions’ Include method, which is an extension method for IQueryable<T>:

internal static void EagerLoadingWithInclude(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<ProductSubcategory> subcategoriesWithCategory = adventureWorks.ProductSubcategories
```
```csharp
.Include(subcategory => subcategory.ProductCategory);
```
```csharp
subcategoriesWithCategory.WriteLines(subcategory =>
```
```csharp
$"{subcategory.ProductCategory.Name}: {subcategory.Name}");
```
```sql
// SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID], [p].[ProductCategoryID], [p].[Name]
```
```sql
// FROM [Production].[ProductSubcategory] AS [subcategory]
```
```csharp
// INNER JOIN [Production].[ProductCategory] AS [p] ON [subcategory].[ProductCategoryID] = [p].[ProductCategoryID]
```

```csharp
IQueryable<ProductSubcategory> subcategoriesWithProducts = adventureWorks.ProductSubcategories
```
```csharp
.Include(subcategory => subcategory.Products);
```
```csharp
subcategoriesWithProducts.WriteLines(subcategory => $@"{subcategory.Name}: {string.Join(
```
```csharp
", ", subcategory.Products.Select(product => product.Name))}");
```
```sql
// SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
```
```sql
// FROM [Production].[ProductSubcategory] AS [subcategory]
```
```csharp
// ORDER BY [subcategory].[ProductSubcategoryID]
```

```sql
// SELECT [p].[ProductID], [p].[ListPrice], [p].[Name], [p].[ProductSubcategoryID], [p].[RowVersion]
```
```sql
// FROM [Production].[Product] AS [p]
```
```sql
// WHERE EXISTS (
```
```sql
// SELECT 1
```
```sql
// FROM [Production].[ProductSubcategory] AS [subcategory]
```
```sql
// WHERE [p].[ProductSubcategoryID] = [subcategory].[ProductSubcategoryID])
```
```csharp
// ORDER BY [p].[ProductSubcategoryID]
```

}

Eager loading related entity through reference navigation property is translated to INNER JOIN. Eager loading through collection navigation property is translated to 2 SQL queries for 2 types of entities. More queries can be chained after calling Include.

In EF Core, ThenInclude can be called for eager loading of multiple levels of related entities:

internal static void EagerLoadingMultipleLevels(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<Product>products = adventureWorks.Products
```
```csharp
.Include(product => product.ProductProductPhotos)
```
```csharp
.ThenInclude(productProductPhoto => productProductPhoto.ProductPhoto);
```
```csharp
products.WriteLines(product => $@"{product.Name}: {string.Join(
```
```csharp
", ",
```
```csharp
product.ProductProductPhotos.Select(productProductPhoto =>
```
```csharp
productProductPhoto.ProductPhoto.LargePhotoFileName))}");
```
```sql
// SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID], [product].[RowVersion]
```
```sql
// FROM [Production].[Product] AS [product]
```
```csharp
// ORDER BY [product].[ProductID]
```

```sql
// SELECT [p].[ProductID], [p].[ProductPhotoID], [p0].[ProductPhotoID], [p0].[LargePhotoFileName], [p0].[ModifiedDate]
```
```sql
// FROM [Production].[ProductProductPhoto] AS [p]
```
```csharp
// INNER JOIN [Production].[ProductPhoto] AS [p0] ON [p].[ProductPhotoID] = [p0].[ProductPhotoID]
```
```sql
// WHERE EXISTS (
```
```sql
// SELECT 1
```
```sql
// FROM [Production].[Product] AS [product]
```
```sql
// WHERE [p].[ProductID] = [product].[ProductID])
```
```csharp
// ORDER BY [p].[ProductID]
```

}

### Lazy loading

EF Core also supports lazy loading.

public partial class AdventureWorks

```csharp
{
```
```csharp
public AdventureWorks(DbConnection connection = null, bool lazyLoading = true)
```
```csharp
: base(GetDbContextOptions(connection, lazyLoading))
```
```csharp
{
```
```csharp
}
```

```csharp
private static DbContextOptions GetDbContextOptions(
```
```csharp
DbConnection connection = null, bool lazyLoading = true) =>
```
```csharp
new DbContextOptionsBuilder<AdventureWorks>()
```
```csharp
.UseLazyLoadingProxies(lazyLoading)
```
```csharp
.UseSqlServer(
```
```csharp
connection: connection ??
```
```csharp
new SqlConnection(ConnectionStrings.AdventureWorks),
```
```csharp
sqlServerOptionsAction: options => options.EnableRetryOnFailure(
```
```csharp
maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30),
```
```csharp
errorNumbersToAdd: null))
```
```csharp
.Options;
```

}

When an entity’s navigation property is accessed, the related entities are queried and loaded automatically:

internal static void LazyLoading(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
```
```sql
// SELECT TOP(1) [p].[ProductSubcategoryID], [p].[Name], [p].[ProductCategoryID]
```
```sql
// FROM [Production].[ProductSubcategory] AS [p]
```
```csharp
subcategory.Name.WriteLine();
```

```csharp
ProductCategory category = subcategory.ProductCategory; // Execute query.
```
```sql
// exec sp_executesql N'SELECT [e].[ProductCategoryID], [e].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [e]
```
```sql
// WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```
```csharp
category.Name.WriteLine();
```

```csharp
ICollection<Product> products = subcategory.Products; // Execute query.
```
```sql
// exec sp_executesql N'SELECT [e].[ProductID], [e].[ListPrice], [e].[Name], [e].[ProductSubcategoryID], [e].[RowVersion]
```
```sql
// FROM [Production].[Product] AS [e]
```
```sql
// WHERE [e].[ProductSubcategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```
```csharp
products.WriteLines(product => product.Name);
```

}

### The N + 1 problem

Sometimes lazy loading can cause the “N + 1 queries” problem. The following example queries the subcategories, and pulls each subcategory’s information:

internal static void MultipleLazyLoading(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
ProductSubcategory[] subcategories = adventureWorks.ProductSubcategories.ToArray(); // Execute query.
```
```sql
// SELECT [p].[ProductSubcategoryID], [p].[Name], [p].[ProductCategoryID]
```
```sql
// FROM [Production].[ProductSubcategory] AS [p]
```

```csharp
subcategories.WriteLines(subcategory =>
```
```csharp
$"{subcategory.Name} ({subcategory.ProductCategory.Name})"); // Execute query.
```
```sql
// exec sp_executesql N'SELECT [e].[ProductCategoryID], [e].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [e]
```
```sql
// WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
```

```sql
// exec sp_executesql N'SELECT [e].[ProductCategoryID], [e].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [e]
```
```sql
// WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=2
```

```csharp
// ...
```

}

When loading the subcategories, 1 database query is executed. When each subcategory’s related category is pulled through the navigation property, it is loaded instantly, if not loaded yet. So in total there are N queries for related categories + 1 query for subcategories executed. For better performance in this kind of scenario, eager loading or inner join should be used to load all entities and related entities with 1 single query.

### Disable lazy loading

There are some scenarios where lazy loading needs to be disabled, like entity serialization. There are several ways to disable lazy loading for different scopes

· To globally disable lazy loading for specific navigation properties, just do not mark it as virtual, so that the derived proxy entity cannot override it with the lazy load implementation.

· To disable lazy loading for specific DbContext or specific query, call DbContext.Configuration to get a DbConfiguration instance, and set its LazyLoadingEnabled property to false.

internal static void DisableLazyLoading()

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks(lazyLoading: false))
```
```csharp
{
```
```csharp
ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
```
```csharp
subcategory.Name.WriteLine();
```
```csharp
ProductCategory category = subcategory.ProductCategory; // No query.
```
```csharp
(category == null).WriteLine(); // True
```

```csharp
ICollection<Product> products = subcategory.Products; // No query.
```
```csharp
(products == null).WriteLine(); // True
```
```csharp
}
```

}