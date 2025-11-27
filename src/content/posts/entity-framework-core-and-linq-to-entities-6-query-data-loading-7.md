---
title: "Entity Framework/Core and LINQ to Entities (6) Query Data Loading"
published: 2019-03-27
description: "After translated to SQL, in LINQ to Entities, sequence queries returning IQueryable<T> implements deferred execution too."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **Latest EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-6-query-data-loading**](/posts/entity-framework-core-and-linq-to-entities-6-query-data-loading "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-6-query-data-loading")

## EF Version of this article: [https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-6-deferred-execution-laziness-loading-and-eager-loading](/posts/entity-framework-and-linq-to-entities-6-deferred-execution-laziness-loading-and-eager-loading "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-6-deferred-execution-laziness-loading-and-eager-loading")

After translated to SQL, in LINQ to Entities, sequence queries returning IQueryable<T> implements deferred execution too.

## Deferred execution

As previous part discussed, when defining a LINQ to Entities query represented by IQueryable<T>, an expression tree is built, there is no query execution. The execution is deferred until trying to pull the results from the query.

### Iterator pattern

IQueryable<T> is derived from IEnumerable<T>, so values can be pulled from IQueryable<T> with the standard iterator pattern. When trying to pull the first value, EF Core translates LINQ to Entities query to SQL, and execute SQL in the database. The implementation can be demonstrated with the Iterator<T> type from the LINQ to Objects chapter:

```csharp
public static class QueryableExtensions
{
    public static IEnumerator<TEntity> GetEntityIterator<TEntity>(
        this IQueryable<TEntity> query, DbContext dbContext) where TEntity : class
    {
        "| |_Compile LINQ expression tree to database expression tree.".WriteLine();
        (SelectExpression DatabaseExpression, IReadOnlyDictionary<string, object> Parameters) compilation =
            dbContext.Compile(query.Expression);

        IEnumerator<TEntity> entityIterator = null;
        return new Iterator<TEntity>(
            start: () =>
            {
                "| |_Generate SQL from database expression tree.".WriteLine();
                IRelationalCommand sql = dbContext.Generate(
                    compilation.DatabaseExpression, compilation.Parameters);
                IEnumerable<TEntity> sqlQuery = dbContext.Set<TEntity>().FromSql(
                    sql: sql.CommandText,
                    parameters: compilation.Parameters
                        .Select(parameter => new SqlParameter(parameter.Key, parameter.Value)).ToArray());
                entityIterator = sqlQuery.GetEnumerator();
                "| |_Execute generated SQL.".WriteLine();
            },
            moveNext: () => entityIterator.MoveNext(),
            getCurrent: () =>
            {
                $"| |_Materialize data row to {typeof(TEntity).Name} entity.".WriteLine();
                return entityIterator.Current;
            },
            dispose: () => entityIterator.Dispose(),
            end: () => "  |_End.".WriteLine()).Start();
    }
}
```

The following example executes Where and Take query to load 3 products with more than 10 characters in name. It demonstrates how to pull the results from IQueryable<T> with the iterator pattern:

```csharp
internal static partial class Loading
{
    internal static void DeferredExecution(AdventureWorks adventureWorks)
    {
        IQueryable<Product> categories = adventureWorks.Products
            .Where(product => product.Name.Length > 10)
            .Take(3);
        "Iterator - Create from LINQ to Entities query.".WriteLine();
        using (IEnumerator<Product> iterator = categories.GetEntityIterator(adventureWorks)) // Compile query.
        {
            int index = 0;
            while (new Func<bool>(() =>
                {
                    bool moveNext = iterator.MoveNext();
                    $"|_Iterator - [{index++}] {nameof(IEnumerator<Product>.MoveNext)}: {moveNext}.".WriteLine();
                    return moveNext; // Generate SQL when first time called.
                })())
            {
                Product product = iterator.Current;
                $"| |_Iterator - [{index}] {nameof(IEnumerator<Product>.Current)}: {product.Name}.".WriteLine();
            }
        }
        // Iterator - Create from LINQ to Entities query.
        // | |_Compile LINQ expression tree to database expression tree.
        // |_Iterator - [0] MoveNext: True.
        // | |_Generate SQL from database expression tree.
        // | |_Execute generated SQL.
        // | |_Materialize data row to Product entity.
        // | |_Iterator - [0] Current: ML Crankset.
        // |_Iterator - [1] MoveNext: True.
        // | |_Materialize data row to Product entity.
        // | |_Iterator - [1] Current: HL Crankset.
        // |_Iterator - [2] MoveNext: True.
        // | |_Materialize data row to Product entity.
        // | |_Iterator - [2] Current: Touring-2000 Blue, 60.
        // |_Iterator - [3] MoveNext: False.
        //   |_End.
    }
}
```

Here for demonstration purpose, the GetEntityIterator extension method of IQueryable<T> is called instead of GetEnumerator. In EF Core, when the iterator is created from IQueryable<T>, the LINQ query expression tree is compiled to database query expression tree. Later, when the iterator’s MoveNext method is called for the first time, the SQL query is generated and executed. In each iteration, an entity is materialized from the SQL execution result.

> EF is slightly more deferred then EF Core. The query compilation, SQL generation, and SQL execution all start when the iterator’s MoveNext method is called for the first time.

### Lazy evaluation vs. eager evaluation

Deferred execution can be either lazy evaluation or eager evaluation. Internally, EF/Core call ADP.NET APIs to execute query, including DbDataReader, etc. DbDataReader is abstract class. EF/Core SQL database provider actually uses SqlDataReader in ADO.NET, which is derived from DbDataReader, to load the database query results. By default, when SqlDataReader starts to read data, it [streams](http://blogs.msdn.com/b/adonet/archive/2012/04/20/using-sqldatareader-s-new-async-methods-in-net-4-5-beta.aspx) a number of rows to local buffer through [TDS (tabular data stream) protocol](https://en.wikipedia.org/wiki/Tabular_Data_Stream). So by default, LINQ to Entities’ deferred execution is neither eager (load all rows when pulling the first result), nor totally lazy (load 1 result when pulling each result).

When retry logic is specified for connection resiliency, EF/Core become eager evaluation. When trying to pull the first query result, EF/Core call DbDataReader to load all results from database.

## Explicit loading

After an entity is queried, its related entities can be loaded through the navigation property. DbContext.Entry method accepts an entity of type TEntity, and returns Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry<TEntity>, which represents that entity’s tracking and loading information. EntityEntry<TEntity> provides a Reference method to return Microsoft.EntityFrameworkCore.ChangeTracking.ReferenceEntry<TEntity, TProperty> instance, which represents the tracking and loading information of a single related entity from reference navigation property. EntityEntry<TEntity> also provides a Collection method to return Microsoft.EntityFrameworkCore.ChangeTracking.ReferenceEntry.CollectionEntry<TEntity, TProperty>, which represents the tracking and loading information of multiple related entities from collection navigation property. These related entities in the navigation properties can be manually loaded by calling ReferenceEntry<TEntity, TProperty>.Load and CollectionEntry<TEntity, TProperty>.Load:

```sql
internal static void ExplicitLoading(AdventureWorks adventureWorks)
{
    ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
    // SELECT TOP(1) [p].[ProductSubcategoryID], [p].[Name], [p].[ProductCategoryID]
    // FROM [Production].[ProductSubcategory] AS [p]
    subcategory.Name.WriteLine();

    adventureWorks
        .Entry(subcategory) // Return EntityEntry<ProductSubcategory>.
        .Reference(entity => entity.ProductCategory) // Return ReferenceEntry<ProductSubcategory, ProductCategory>.
        .Load(); // Execute query.
    // exec sp_executesql N'SELECT [e].[ProductCategoryID], [e].[Name]
    // FROM [Production].[ProductCategory] AS [e]
    // WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
    subcategory.ProductCategory.Name.WriteLine();

    adventureWorks
        .Entry(subcategory) // Return EntityEntry<ProductSubcategory>.
        .Collection(entity => entity.Products) // Return CollectionEntry<ProductSubcategory, Product>.
        .Load(); // Execute query.
    // exec sp_executesql N'SELECT [e].[ProductID], [e].[ListPrice], [e].[Name], [e].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [e]
    // WHERE [e].[ProductSubcategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
    subcategory.Products.WriteLines(product => product.Name);
}
```

When the Load method is called, the related entities are queried, and become available through the navigation properties. Besides loading the full entities, explicit lazy loading also support custom query. The following example uses the reference navigation property and collection navigation property as LINQ to Entities data sources, by calling ReferenceEntry<TEntity, TProperty>.Query and CollectionEntry<TEntity, TProperty>.Query:

```sql
internal static void ExplicitLoadingWithQuery(AdventureWorks adventureWorks)
{
    ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
    // SELECT TOP(1) [p].[ProductSubcategoryID], [p].[Name], [p].[ProductCategoryID]
    // FROM [Production].[ProductSubcategory] AS [p]
    subcategory.Name.WriteLine();
    string categoryName = adventureWorks
        .Entry(subcategory).Reference(entity => entity.ProductCategory)
        .Query() // Return IQueryable<ProductCategory>.
        .Select(category => category.Name).Single(); // Execute query.
    // exec sp_executesql N'SELECT TOP(2) [e].[Name]
    // FROM [Production].[ProductCategory] AS [e]
    // WHERE [e].[ProductCategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
    categoryName.WriteLine();

    IQueryable<string> products = adventureWorks
        .Entry(subcategory).Collection(entity => entity.Products)
        .Query() // Return IQueryable<Product>.
        .Select(product => product.Name); // Execute query.
    // exec sp_executesql N'SELECT [e].[Name]
    // FROM [Production].[Product] AS [e]
    // WHERE [e].[ProductSubcategoryID] = @__get_Item_0',N'@__get_Item_0 int',@__get_Item_0=1
    products.WriteLines();
}
```

> In EF, the above entry types are named with the Db prefix: DbEntityEntry<TEntity>, DbReferenceEntry<TEntity, TProperty>, DbCollectionEntry<TEntity, TElement>. And they are under System.Data.Entity.Infrastructure namespace.

## Eager loading

In explicit loading, after an entity is queried, its related entities are loaded separately. In eager loading, when an entity is queried, its related entities are loaded during the same query. To enable eager loading, call Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions’ Include method, which is an extension method for IQueryable<T>:

```sql
internal static void EagerLoadingWithInclude(AdventureWorks adventureWorks)
{
    IQueryable<ProductSubcategory> subcategoriesWithCategory = adventureWorks.ProductSubcategories
        .Include(subcategory => subcategory.ProductCategory);
    subcategoriesWithCategory.WriteLines(subcategory =>
        $"{subcategory.ProductCategory.Name}: {subcategory.Name}");
    // SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID], [p].[ProductCategoryID], [p].[Name]
    // FROM [Production].[ProductSubcategory] AS [subcategory]
    // INNER JOIN [Production].[ProductCategory] AS [p] ON [subcategory].[ProductCategoryID] = [p].[ProductCategoryID]

    IQueryable<ProductSubcategory> subcategoriesWithProducts = adventureWorks.ProductSubcategories
        .Include(subcategory => subcategory.Products);
    subcategoriesWithProducts.WriteLines(subcategory => $@"{subcategory.Name}: {string.Join(
        ", ", subcategory.Products.Select(product => product.Name))}");
    // SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
    // FROM [Production].[ProductSubcategory] AS [subcategory]
    // ORDER BY [subcategory].[ProductSubcategoryID]

    // SELECT [p].[ProductID], [p].[ListPrice], [p].[Name], [p].[ProductSubcategoryID], [p].[RowVersion]
    // FROM [Production].[Product] AS [p]
    // WHERE EXISTS (
    //    SELECT 1
    //    FROM [Production].[ProductSubcategory] AS [subcategory]
    //    WHERE [p].[ProductSubcategoryID] = [subcategory].[ProductSubcategoryID])
    // ORDER BY [p].[ProductSubcategoryID]
}
```

Eager loading related entity through reference navigation property is translated to INNER JOIN. Eager loading through collection navigation property is translated to 2 SQL queries for 2 types of entities. More query methods can be chained after calling Include.

> As fore mentioned, EF always translates LINQ to Entities queries to remote query. In EF, eager loading is translated to a single LEFT OUTER JOIN query.

In EF Core, ThenInclude can be called for eager loading of multiple levels of related entities:

```sql
internal static void EagerLoadingMultipleLevels(AdventureWorks adventureWorks)
{
    IQueryable<Product> products = adventureWorks.Products
        .Include(product => product.ProductProductPhotos)
        .ThenInclude(productProductPhoto => productProductPhoto.ProductPhoto);
    products.WriteLines(product => $@"{product.Name}: {string.Join(
        ", ", 
        product.ProductProductPhotos.Select(productProductPhoto => 
            productProductPhoto.ProductPhoto.LargePhotoFileName))}");
    // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID], [product].[RowVersion]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ProductID]

    // SELECT [p].[ProductID], [p].[ProductPhotoID], [p0].[ProductPhotoID], [p0].[LargePhotoFileName], [p0].[ModifiedDate]
    // FROM [Production].[ProductProductPhoto] AS [p]
    // INNER JOIN [Production].[ProductPhoto] AS [p0] ON [p].[ProductPhotoID] = [p0].[ProductPhotoID]
    // WHERE EXISTS (
    //    SELECT 1
    //    FROM [Production].[Product] AS [product]
    //    WHERE [p].[ProductID] = [product].[ProductID])
    // ORDER BY [p].[ProductID]
}
```

> In EF, Include with Select subquery can load multiple levels of related entities:
> 
> ```sql
> internal static void EagerLoadingMultipleLevels(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> products = adventureWorks.Products
>         .Include(product => product.ProductProductPhotos
>             .Select(productProductPhoto => productProductPhoto.ProductPhoto));
>     products.WriteLines(product => $@"{product.Name}: {string.Join(
>         ", ", 
>         product.ProductProductPhotos.Select(productProductPhoto => 
>             productProductPhoto.ProductPhoto.LargePhotoFileName))}");
>     // SELECT 
>     //    [Project1].[ProductID] AS [ProductID], 
>     //    [Project1].[Name] AS [Name], 
>     //    [Project1].[ListPrice] AS [ListPrice], 
>     //    [Project1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
>     //    [Project1].[RowVersion] AS [RowVersion], 
>     //    [Project1].[C1] AS [C1], 
>     //    [Project1].[ProductID1] AS [ProductID1], 
>     //    [Project1].[ProductPhotoID] AS [ProductPhotoID], 
>     //    [Project1].[ProductPhotoID1] AS [ProductPhotoID1], 
>     //    [Project1].[LargePhotoFileName] AS [LargePhotoFileName], 
>     //    [Project1].[ModifiedDate] AS [ModifiedDate]
>     //    FROM ( SELECT 
>     //        [Extent1].[ProductID] AS [ProductID], 
>     //        [Extent1].[Name] AS [Name], 
>     //        [Extent1].[ListPrice] AS [ListPrice], 
>     //        [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
>     //        [Extent1].[RowVersion] AS [RowVersion], 
>     //        [Join1].[ProductID] AS [ProductID1], 
>     //        [Join1].[ProductPhotoID1] AS [ProductPhotoID], 
>     //        [Join1].[ProductPhotoID2] AS [ProductPhotoID1], 
>     //        [Join1].[LargePhotoFileName] AS [LargePhotoFileName], 
>     //        [Join1].[ModifiedDate] AS [ModifiedDate], 
>     //        CASE WHEN ([Join1].[ProductID] IS NULL) THEN CAST(NULL AS int) ELSE 1 END AS [C1]
>     //        FROM  [Production].[Product] AS [Extent1]
>     //        LEFT OUTER JOIN  (SELECT [Extent2].[ProductID] AS [ProductID], [Extent2].[ProductPhotoID] AS [ProductPhotoID1], [Extent3].[ProductPhotoID] AS [ProductPhotoID2], [Extent3].[LargePhotoFileName] AS [LargePhotoFileName], [Extent3].[ModifiedDate] AS [ModifiedDate]
>     //            FROM  [Production].[ProductProductPhoto] AS [Extent2]
>     //            INNER JOIN [Production].[ProductPhoto] AS [Extent3] ON [Extent2].[ProductPhotoID] = [Extent3].[ProductPhotoID] ) AS [Join1] ON [Extent1].[ProductID] = [Join1].[ProductID]
>     //    )  AS [Project1]
>     //    ORDER BY [Project1].[ProductID] ASC, [Project1].[C1] ASC
> }
> ```

## Lazy loading

> EF also supports lazy loading. When an entity’s navigation property is accessed, the related entities are queried and loaded automatically:
> 
> ```sql
> internal static void LazyLoading(AdventureWorks adventureWorks)
> {
>     ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
>     // SELECT TOP (1) 
>     //    [c].[ProductSubcategoryID] AS [ProductSubcategoryID], 
>     //    [c].[Name] AS [Name], 
>     //    [c].[ProductCategoryID] AS [ProductCategoryID]
>     //    FROM [Production].[ProductSubcategory] AS [c]
>     subcategory.Name.WriteLine();
> 
>     ProductCategory category = subcategory.ProductCategory; // Execute query.
>     // exec sp_executesql N'SELECT 
>     //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
>     //    [Extent1].[Name] AS [Name]
>     //    FROM [Production].[ProductCategory] AS [Extent1]
>     //    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=1
>     category.Name.WriteLine();
> 
>     ICollection<Product> products = subcategory.Products; // Execute query.
>     // exec sp_executesql N'SELECT 
>     //    [Extent1].[ProductID] AS [ProductID], 
>     //    [Extent1].[Name] AS [Name], 
>     //    [Extent1].[ListPrice] AS [ListPrice], 
>     //    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID]
>     //    FROM [Production].[Product] AS [Extent1]
>     //    WHERE [Extent1].[ProductSubcategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=1
>     products.WriteLines(product => product.Name);
> }
> ```

### The N + 1 problem

> Sometimes lazy loading can cause the “N + 1 queries” problem. The following example queries the subcategories, and pulls each subcategory’s information:
> 
> ```sql
> internal static void MultipleLazyLoading(AdventureWorks adventureWorks)
> {
>     ProductSubcategory[] subcategories = adventureWorks.ProductSubcategories.ToArray(); // Execute query.
>     // SELECT 
>     //    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
>     //    [Extent1].[Name] AS [Name], 
>     //    [Extent1].[ProductCategoryID] AS [ProductCategoryID]
>     //    FROM [Production].[ProductSubcategory] AS [Extent1]
> 
>     subcategories.WriteLines(subcategory => 
>         $"{subcategory.Name} ({subcategory.ProductCategory.Name})"); // Execute query.
>     // exec sp_executesql N'SELECT 
>     //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
>     //    [Extent1].[Name] AS [Name]
>     //    FROM [Production].[ProductCategory] AS [Extent1]
>     //    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=1
> 
>     // exec sp_executesql N'SELECT 
>     //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
>     //    [Extent1].[Name] AS [Name]
>     //    FROM [Production].[ProductCategory] AS [Extent1]
>     //    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=2
> 
>     // ...
> }
> ```
> 
> When loading the subcategories, 1 database query is executed. When each subcategory’s related category is pulled through the navigation property, it is loaded instantly, if not loaded yet. So in total there are N queries for related categories + 1 query for subcategories executed. For better performance in this kind of scenario, eager loading or inner join should be used to load all entities and related entities with 1 single query.

### Disable lazy loading

> There are some scenarios where lazy loading needs to be disabled, like entity serialization. There are several ways to disable lazy loading for different scopes
> 
> -   To globally disable lazy loading for specific navigation properties, just do not mark it as virtual, so that the derived proxy entity cannot override it with the lazy load implementation.
> -   To disable lazy loading for specific DbContext or specific query, call DbContext.Configuration to get a DbConfiguration instance, and set its LazyLoadingEnabled property to false.
> 
> ```csharp
> internal static void DisableLazyLoading(AdventureWorks adventureWorks)
> {
>     adventureWorks.Configuration.LazyLoadingEnabled = false;
>     ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Execute query.
>   
>     ProductCategory category = subcategory.ProductCategory; // No query.
>     (category == null).WriteLine(); // True
> 
>     ICollection<Product> products = subcategory.Products; // No query.
>     (products == null).WriteLine(); // True
> }
> ```