---
title: "Entity Framework and LINQ to Entities (6) Deferred Execution, Laziness Loading and Eager Loading"
published: 2016-02-26
description: "In LINQ to Objects, query methods returning IEnumerable<T> implements deferred execution. Similarly, in LINQ to Entities, query methods returning IQueryable<T> implements deferred execution too."
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework", "LINQ to Entities", "SQL Server", "SQL"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-6-query-data-loading**](/posts/entity-framework-core-and-linq-to-entities-6-query-data-loading "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-6-query-data-loading")

In LINQ to Objects, query methods returning IEnumerable<T> implements deferred execution. Similarly, in LINQ to Entities, query methods returning IQueryable<T> implements deferred execution too.

## Deferred execution

As previous part discussed, when creating a LINQ to Entities query, if Queryable methods returning IQueryable<T> are called, these methods just keep building the expression tree, there is no query execution. The execution is deferred.

### Iterator pattern

IQueryable<T> implements IEnumerable<T>. So values can be pulled from IQueryable<T> with the standard iterator pattern. When trying to pull the first value, Entity Framework translates LINQ to Entities query to SQL, and execute SQL in the database. This process can be demonstrated by the following GetIterator method, implemented with the Iterator<T> class from the LINQ to Objects chapter:
```
public static class QueryableExtensions
{
    public static IEnumerator<TSource> GetIterator<TSource>(
        this IQueryable<TSource> query, DbContext dbContext)
    {
        query.NotNull(nameof(query));
        dbContext.NotNull(nameof(dbContext));

        IEnumerator<TSource> sqlReader = null;
        bool isSqlExecuted = false;
        return new Iterator<TSource>(
            start: () =>
                {
                    Trace.WriteLine("|_Convert expression tree to database command tree.");
                    DbQueryCommandTree commandTree = dbContext.Convert(query.Expression);
                    Trace.WriteLine("|_Generate SQL from database command tree.");
                    DbCommand sql = dbContext.Generate(commandTree);
                    Trace.WriteLine("|_Build SQL query.");
                    IEnumerable<TSource> sqlQuery = dbContext.Database.SqlQuery<TSource>(
                        sql.CommandText,
                        sql.Parameters.OfType<DbParameter>().Select(parameter => parameter.Value).ToArray());
                    sqlReader = sqlQuery.GetEnumerator();
                },
            hasNext: () =>
                {
                    if (!isSqlExecuted)
                    {
                        Trace.WriteLine("|_Execute SQL query.");
                        isSqlExecuted = true;
                    }
                    Trace.WriteLine($"|_Try reading a row and materializing to {typeof(TSource).Name} object.");
                    return sqlReader.MoveNext();
                },
            next: () => sqlReader.Current,
            dispose: () => sqlReader.Dispose()).StartState();
    }
}
```

Take the previous simple Where and Select query as example, this is how the values are pulled from IQueryable<T>:
```
internal static partial class Laziness
{
    internal static void WhereAndSelect()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            IQueryable<Product> products = adventureWorks.Products
                .Where(product => product.Name.StartsWith("M"));
            // products.ForEach(product => Trace.WriteLine(product));
            Trace.WriteLine("Get iterator from LINQ to Entities query.");
            using (IEnumerator<Product> iterator = products
                .GetIterator(adventureWorks)) // products.GetEnumerator()
            {
                while (new Func<bool>(() =>
                    {
                        Trace.WriteLine("Try moving iterator to next.");
                        return iterator.MoveNext(); // Translate and execute query.
                    })())
                {
                    Product product = iterator.Current;
                    Trace.WriteLine($"Get iterator current product: {product.Name}.");
                }
            }
        }
    }
}
```

In iterator pattern, IQueryable<T>.GetEnumerator should be called to get an iterator. Here for demonstration purpose, the GetEnumerator method is replaced by above GetIterator. Later, when the iterator’s MoveNext method is called for the first iteration, Entity Framework starts to work. It:

-   converts LINQ to Entities query’s expression tree to database command tree,
-   generates SQL query,
-   executes SQL query,
-   reads the first row
-   materializes the row data to the specified Product object.

Then each following iteration reads a row and materializes it to a Product object. The above query execution outputs the following trace:

> Get iterator from LINQ to Entities query. Try moving iterator to next. |\_Convert expression tree to database command tree. |\_Generate SQL from database command tree. |\_Build SQL query. |\_Execute SQL query. |\_Try reading a row and materializing to Product object. Get iterator current product: ML Bottom Bracket. Try moving iterator to next. |\_Try reading a row and materializing to Product object. Get iterator current product: ML Crankset. Try moving iterator to next. |\_Try reading a row and materializing to Product object. Get iterator current product: Mountain-400-W Silver, 38. ...

### Lazy/eager evaluation

Deferred execution can be either lazy evaluation or eager evaluation. As the previous part discussed, when Entity Framework translates LINQ to Entities query to a DbCommand object, representing the database query and parameters. Then it calls DbCommand.ExecuteReader method to build a DbDataReader, then calls DbDataReader.Read method to read each row. DbCommand and DbDataReader are abstract classes. For SQL database, actually SqlCommand and SqlDataReader are used. Calling SqlCommand.ExecuteReader executes the SQL query, and [streams](http://blogs.msdn.com/b/adonet/archive/2012/04/20/using-sqldatareader-s-new-async-methods-in-net-4-5-beta.aspx) a number of rows to local buffer through [TDS (tabular data stream) protocol](https://en.wikipedia.org/wiki/Tabular_Data_Stream). Then, calling SqlDataReader.Read reads each row from local buffer. So LINQ to Entities. So LINQ to Entities’ evaluation is neither completely lazy (steaming 1 row for each iteration), nor completely eager (streaming all rows at the first iteration). It is somewhere between, implemented by batch streaming into a local buffer.

## Lazy loading and eager loading

An entity can have navigation properties, referencing associated entities. By default, these associated entities are not queried, until they are pulled. This feature of Entity Framework is called lazy loading.

### Implicit and explicit lazy loading

In the entity definition, the navigation properties are defined as virtual. By default, the derived proxy classes override these properties and implement lazy loading:
```
internal static void ImplicitLazyLoading()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Database query.
        Trace.WriteLine(subcategory.Name);
        ProductCategory associatedCategory = subcategory.ProductCategory; // Database query.
        Trace.WriteLine(associatedCategory.Name);
        ICollection<Product> associatedProducts = subcategory.Products; // Database query.
        Trace.WriteLine(associatedProducts.Count);
    }
}
```

The above example executes 3 database queries:

-   The first subcategory entity is queried by First
    ```sql
    SELECT TOP (1) 
        [c].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [c].[Name] AS [Name], 
        [c].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [c]
    ```
    
-   The associated single category entity is queried when it is pulled from navigation property ProductSubcategory.ProductCategory
    ```sql
    exec sp_executesql N'SELECT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        [Extent1].[Name] AS [Name]
        FROM [Production].[ProductCategory] AS [Extent1]
        WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=1
    ```
    
-   The associated product entities is queried when they are pulled from navigation property ProductSubcategory.Products
    ```sql
    exec sp_executesql N'SELECT 
        CASE 
            WHEN (
                ((CASE 
                    WHEN ([Extent1].[Style] = N''M'') THEN cast(1 as bit) 
                    ELSE cast(0 as bit) 
                END) <> 1) AND 
                ((CASE 
                    WHEN ([Extent1].[Style] = N''U'') THEN cast(1 as bit)
                    ELSE cast(0 as bit)
                END) <> 1) AND 
                ((CASE
                    WHEN ([Extent1].[Style] = N''W'') THEN cast(1 as bit) 
                    ELSE cast(0 as bit) 
                END) <> 1)) THEN ''0X''
            WHEN ([Extent1].[Style] = N''M'') THEN ''0X0X''
            WHEN ([Extent1].[Style] = N''U'') THEN ''0X1X''
            ELSE ''0X2X'' 
        END AS [C1], 
        [Extent1].[ProductID] AS [ProductID], 
        [Extent1].[RowVersion] AS [RowVersion], 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ProductSubcategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=1
    ```
    The Style column is queried by a CASE expression because it is discriminator column for the table per hierarchy inheritance.

Entity Framework also provides APIs for explicit lazy loading:

```csharp
namespace System.Data.Entity
{
    using System.Data.Entity.Infrastructure;

    public class DbContext
    {
        public DbEntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;

        // Other members.
    }
}

namespace System.Data.Entity.Infrastructure
{
    using System.Collections.Generic;
    using System.Linq.Expressions;

    public class DbEntityEntry<TEntity> where TEntity : class
    {
        public DbReferenceEntry<TEntity, TProperty> Reference<TProperty>(
            Expression<Func<TEntity, TProperty>> navigationProperty) where TProperty : class;

        public DbCollectionEntry<TEntity, TElement> Collection<TElement>(
            Expression<Func<TEntity, ICollection<TElement>>> navigationProperty) where TElement : class;

        // Other members.
    }
}
```

DbContext.Entry method accepts an entity and returns a DbEntityEntry<TEntity> object, which represents the entity’s information tracked by the source DbContext. DbEntityEntry<TEntity> provides a Reference method to get a DbReferenceEntry<TEntity, TProperty> object, which represents a navigation property to another associated single entity. DbEntityEntry<TEntity> also provides a Collection method to get a DbCollectionEntry<TEntity, TElement> object, which represents a navigation property to a collection of other associated entities. So the associated entities can be manually loaded by calling DbReferenceEntry<TEntity, TProperty>.Load and DbCollectionEntry<TEntity, TElement>.Load:
```
internal static void ExplicitLazyLoading()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Database query.
        Trace.WriteLine(subcategory.Name);
        adventureWorks
            .Entry(subcategory) // Return DbEntityEntry<ProductSubcategory>.
            .Reference(entity => entity.ProductCategory) // Return DbReferenceEntry<ProductSubcategory, ProductCategory>.
            .Load(); // Database query.
        Trace.WriteLine(subcategory.ProductCategory.Name);
        adventureWorks
            .Entry(subcategory) // Return DbEntityEntry<ProductSubcategory>.
            .Collection(entity => entity.Products) // Return DbCollectionEntry<ProductSubcategory, Product>.
            .Load(); // Database query.
        Trace.WriteLine(subcategory.Products.Count);
    }
}
```

When the Load method is called, the associated entities are queried, and the navigation properties becomes ready. Here the SQL queries are the same as above implicit lazy loading. Explicit lazy loading can be useful, because the associated data to load can be specified by a query. For example, if only the associated category’s Name and the associated products’ Count is needed, then call DbReferenceEntry<TEntity, TProperty>.Query and DbCollectionEntry<TEntity, TElement>.Query to start a query:
```
internal static void ExplicitLazyLoadingWithQuery()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Database query.
        Trace.WriteLine(subcategory.Name);
        string associatedCategoryName = adventureWorks
            .Entry(subcategory).Reference(entity => entity.ProductCategory)
            .Query() // Return IQueryable<ProductCategory>.
            .Select(category => category.Name).Single(); // Database query.
        Trace.WriteLine(associatedCategoryName);
        int associatedProductsCount = adventureWorks
            .Entry(subcategory).Collection(entity => entity.Products)
            .Query() // Return IQueryable<Product>.
            .Count(); // Database query.
        Trace.WriteLine(associatedProductsCount);
    }
}
```

This time, for the associated category, only its Name is queried:

```sql
exec sp_executesql N'SELECT 
    [Limit1].[Name] AS [Name]
    FROM ( SELECT TOP (2) 
        [Extent1].[Name] AS [Name]
        FROM [Production].[ProductCategory] AS [Extent1]
        WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1
    )  AS [Limit1]',N'@EntityKeyValue1 int',@EntityKeyValue1=1
```

For the associated products, only their count is queried:

```sql
exec sp_executesql N'SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        COUNT(1) AS [A1]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ProductSubcategoryID] = @EntityKeyValue1
    )  AS [GroupBy1]',N'@EntityKeyValue1 int',@EntityKeyValue1=1
```

Lazy loading can be a little tricky when used with deferred execution. The following example throws EntityCommandExecutionException:
```
internal static void LazyLoadingAndDeferredExecution()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductSubcategory> subcategories = adventureWorks.ProductSubcategories;
        subcategories
            .ForEach(subcategory => Trace.WriteLine( // Reading subcategories is in progress.
                $"{subcategory.ProductCategory.Name}/{subcategory.Name}: {subcategory.Products.Count}"));
        // EntityCommandExecutionException: There is already an open DataReader associated with this Command which must be closed first.
    }
}
```

When the ForEach’s action starts executing for the first ForEach iteration, it pulls 1 subcategory entity from the database query. Entity Framework translates and executes the query, and eventually builds a System.Data.Common.DbDataReader object to read 1 row from the query result. This reader is not closed during the action execution, so that it can be called again in the next iteration to read another row. DbDataReader uses the DbContext’s database connection [exclusively](https://msdn.microsoft.com/en-us/library/haa3afyz.aspx). As a result, when the action pulls associated product entity from the navigation property, Entity Framework tries to build another reader, and it fails with an exception. The above exception can be fixed by finishing reading subcategories before reading from lazy loading, so that the the readers’ lifecycle do not overlap:
```
internal static void LazyLoadingAndImmediateExecution()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductSubcategory> subcategories = adventureWorks.ProductSubcategories;
        subcategories
            .ToArray() // Finish reading subcategories.
            .ForEach(subcategory => Trace.WriteLine(
                $@"{subcategory.ProductCategory/* Finish reading category. */.Name}/{subcategory.Name}: {subcategory.Products/* Finish reading products. */.Count}"));
    }
}
```

Here ToArray() is translated to database query; For each iteration, pulling category and pulling products are translated to 2 separate database queries. So, if there are N subcategories, the above code executes 1 + 2 \* N database queries. The performance can be better if all data are retrieved by 1 queried.

### Eager loading

Entity Framework provides an Include extension method for IQueryable<T>, to query entities and their associated entities eagerly:
```
internal static void EagerLoadingWithInclude()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductSubcategory> subcategories = adventureWorks.ProductSubcategories
            .Include(subcategory => subcategory.ProductCategory)
            .Include(subcategory => subcategory.Products);
        subcategories.ForEach(subcategory => Trace.WriteLine(
            $"{subcategory.ProductCategory.Name}/{subcategory.Name}: {subcategory.Products.Count}"));
    }
}
```

Include methods are translated to JOINs:

```sql
SELECT 
    [Project1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Project1].[Name] AS [Name], 
    [Project1].[ProductCategoryID] AS [ProductCategoryID], 
    [Project1].[ProductCategoryID1] AS [ProductCategoryID1], 
    [Project1].[Name1] AS [Name1], 
    [Project1].[C2] AS [C1], 
    [Project1].[C1] AS [C2], 
    [Project1].[ProductID] AS [ProductID], 
    [Project1].[RowVersion] AS [RowVersion], 
    [Project1].[Name2] AS [Name2], 
    [Project1].[ListPrice] AS [ListPrice], 
    [Project1].[ProductSubcategoryID1] AS [ProductSubcategoryID1]
    FROM ( SELECT 
        [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        [Extent2].[ProductCategoryID] AS [ProductCategoryID1], 
        [Extent2].[Name] AS [Name1], 
        [Extent3].[ProductID] AS [ProductID], 
        [Extent3].[RowVersion] AS [RowVersion], 
        [Extent3].[Name] AS [Name2], 
        [Extent3].[ListPrice] AS [ListPrice], 
        [Extent3].[ProductSubcategoryID] AS [ProductSubcategoryID1], 
        CASE 
            WHEN ([Extent3].[ProductID] IS NULL) THEN CAST(NULL AS varchar(1)) 
            WHEN (
                ((CASE 
                    WHEN ([Extent3].[Style] = N'M') THEN cast(1 as bit) 
                    ELSE cast(0 as bit) 
                END) <> 1) AND 
                ((CASE 
                    WHEN ([Extent3].[Style] = N'U') THEN cast(1 as bit) 
                    ELSE cast(0 as bit) 
                END) <> 1) AND 
                ((CASE 
                    WHEN ([Extent3].[Style] = N'W') THEN cast(1 as bit) 
                    ELSE cast(0 as bit) 
                END) <> 1)) THEN '4X' 
            WHEN ([Extent3].[Style] = N'M') THEN '4X0X' 
            WHEN ([Extent3].[Style] = N'U') THEN '4X1X' 
            ELSE '4X2X' 
        END AS [C1], 
        CASE 
            WHEN ([Extent3].[ProductID] IS NULL) THEN CAST(NULL AS int) 
            ELSE 1 
        END AS [C2]
        FROM   [Production].[ProductSubcategory] AS [Extent1]
        INNER JOIN [Production].[ProductCategory] AS [Extent2] ON [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
        LEFT OUTER JOIN [Production].[Product] AS [Extent3] ON [Extent1].[ProductSubcategoryID] = [Extent3].[ProductSubcategoryID]
    )  AS [Project1]
    ORDER BY [Project1].[ProductSubcategoryID] ASC, [Project1].[ProductCategoryID1] ASC, [Project1].[C2] ASC
```

Include can be used with Select to load multiple levels of associated entities. The following example queries all categories, and eagerly load all associated subcategories and products:
```
internal static void EagerLoadingWithIncludeAndSelect()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductCategory> categories = adventureWorks.ProductCategories
            .Include(category => category.ProductSubcategories.Select(subcategory => subcategory.Products));
        categories.ForEach(category => Trace.WriteLine(
            $@"{category.Name}: {string.Join(", ", category.ProductSubcategories
                .Select(subcategory => $"{subcategory.Name}-{subcategory.Products.Count}"))}"));
    }
}
```

The translated SQL query is also JOINs:

```sql
SELECT 
    [Project1].[ProductCategoryID] AS [ProductCategoryID], 
    [Project1].[Name] AS [Name], 
    [Project1].[C3] AS [C1], 
    [Project1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Project1].[Name1] AS [Name1], 
    [Project1].[ProductCategoryID1] AS [ProductCategoryID1], 
    [Project1].[C2] AS [C2], 
    [Project1].[C1] AS [C3], 
    [Project1].[ProductID] AS [ProductID], 
    [Project1].[RowVersion] AS [RowVersion], 
    [Project1].[Name2] AS [Name2], 
    [Project1].[ListPrice] AS [ListPrice], 
    [Project1].[ProductSubcategoryID1] AS [ProductSubcategoryID1]
    FROM ( SELECT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        [Extent1].[Name] AS [Name], 
        [Join1].[ProductSubcategoryID1] AS [ProductSubcategoryID], 
        [Join1].[Name1] AS [Name1], 
        [Join1].[ProductCategoryID] AS [ProductCategoryID1], 
        [Join1].[ProductID] AS [ProductID], 
        [Join1].[RowVersion] AS [RowVersion], 
        [Join1].[Name2] AS [Name2], 
        [Join1].[ListPrice] AS [ListPrice], 
        [Join1].[ProductSubcategoryID2] AS [ProductSubcategoryID1], 
        CASE
            WHEN ([Join1].[ProductSubcategoryID1] IS NULL) THEN CAST(NULL AS varchar(1))
            WHEN ([Join1].[ProductID] IS NULL) THEN CAST(NULL AS varchar(1))
            WHEN (
                ((CASE
                    WHEN ([Join1].[Style] = N'M') THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END) <> 1) AND
                ((CASE
                    WHEN ([Join1].[Style] = N'U') THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END) <> 1) AND
                ((CASE
                    WHEN ([Join1].[Style] = N'W') THEN CAST(1 AS bit)
                    ELSE CAST(0 AS bit)
                END) <> 1)) THEN '4X'
            WHEN ([Join1].[Style] = N'M') THEN '4X0X'
            WHEN ([Join1].[Style] = N'U') THEN '4X1X'
            ELSE '4X2X'
        END AS [C1],
        CASE
            WHEN ([Join1].[ProductSubcategoryID1] IS NULL) THEN CAST(NULL AS int)
            WHEN ([Join1].[ProductID] IS NULL) THEN CAST(NULL AS int)
            ELSE 1
        END AS [C2],
        CASE
            WHEN ([Join1].[ProductSubcategoryID1] IS NULL) THEN CAST(NULL AS int)
            ELSE 1
        END AS [C3]
        FROM  [Production].[ProductCategory] AS [Extent1]
        LEFT OUTER JOIN  (SELECT 
            [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID1], 
            [Extent2].[Name] AS [Name1], 
            [Extent2].[ProductCategoryID] AS [ProductCategoryID], 
            [Extent3].[ProductID] AS [ProductID], 
            [Extent3].[RowVersion] AS [RowVersion], 
            [Extent3].[Name] AS [Name2], 
            [Extent3].[ListPrice] AS [ListPrice], 
            [Extent3].[ProductSubcategoryID] AS [ProductSubcategoryID2], 
            [Extent3].[Style] AS [Style]
            FROM  [Production].[ProductSubcategory] AS [Extent2]
            LEFT OUTER JOIN [Production].[Product] AS [Extent3] 
            ON [Extent2].[ProductSubcategoryID] = [Extent3].[ProductSubcategoryID] ) AS [Join1] 
        ON [Extent1].[ProductCategoryID] = [Join1].[ProductCategoryID]
    )  AS [Project1]
    ORDER BY [Project1].[ProductCategoryID] ASC, [Project1].[C3] ASC, [Project1].[ProductSubcategoryID] ASC, [Project1].[C2] ASC
```

As discussed in the query methods part, eager loading can also be easily with Select:
```
internal static void EagerLoadingWithSelect()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        var subcategories = adventureWorks.ProductSubcategories.Select(subcategory => new
        {
            Name = subcategory.Name,
            CategoryName = subcategory.ProductCategory.Name,
            ProductCount = subcategory.Products.Count
        });
        subcategories.ForEach(subcategory => Trace.WriteLine(
            $"{subcategory.CategoryName}/{subcategory.Name}: {subcategory.ProductCount}"));
    }
}
```

Include eagerly loads the full associated entities. Select can be flexible when not all associated data are needed. Here the translated query is smaller:

```sql
SELECT 
    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent2].[Name] AS [Name1], 
    (SELECT 
        COUNT(1) AS [A1]
        FROM [Production].[Product] AS [Extent3]
        WHERE [Extent1].[ProductSubcategoryID] = [Extent3].[ProductSubcategoryID]) AS [C1]
    FROM  [Production].[ProductSubcategory] AS [Extent1]
    INNER JOIN [Production].[ProductCategory] AS [Extent2] ON [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
```

### The N + 1 problem

Sometimes lazy loading can cause the “N + 1 queries” problem. The following example queries some subcategories, and print each subcategory’s information:
```
internal static void PrintSubcategoriesWithLazyLoading()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory[] subcategories = adventureWorks.ProductSubcategories
            .GroupBy(subcategory => subcategory.ProductCategoryID, (key, group) => group.FirstOrDefault())
            .ToArray(); // 1 query for N subcategories.
        subcategories.ForEach(subcategory => Trace.WriteLine(
            $"{subcategory.Name} ({subcategory.ProductCategory.Name})")); // N queries.
    }
}
```

When ToArray is called, 1 database query is executed, and it returns 4 subcategories:

```sql
SELECT 
    [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Limit1].[Name] AS [Name], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID]
    FROM   (SELECT DISTINCT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
    OUTER APPLY  (SELECT TOP (1) 
        [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [Extent2].[Name] AS [Name], 
        [Extent2].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent2]
        WHERE [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID] ) AS [Limit1]
```

In this query. each subcategory’s associated category is not queried because of lazy loading. Later, when the subcategories are printed in the loop, each iteration pulls one associated category. So there are 4 more database queries:

```sql
exec sp_executesql N'SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=1

exec sp_executesql N'SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=2

exec sp_executesql N'SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=3

exec sp_executesql N'SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] = @EntityKeyValue1',N'@EntityKeyValue1 int',@EntityKeyValue1=4
```

This “N + 1 queries” problem can be resolved by eager loading:
```
internal static void PrintSubcategoriesWithEagerLoading()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductSubcategory[] subcategories = adventureWorks.ProductSubcategories
            .GroupBy(subcategory => subcategory.ProductCategoryID, (key, group) => group.FirstOrDefault())
            .Include(subcategory => subcategory.ProductCategory)
            .ToArray(); // 1 query for N subcategories.
        subcategories.ForEach(subcategory => Trace.WriteLine(
            $"{subcategory.Name} ({subcategory.ProductCategory.Name})")); // N queries.
    }
}
```

This time there is only 1 database query for all subcategories and their associated categories:

```sql
SELECT 
    [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Limit1].[Name1] AS [Name], 
    [Limit1].[ProductCategoryID1] AS [ProductCategoryID], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID1], 
    [Limit1].[Name] AS [Name1]
    FROM   (SELECT DISTINCT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
    OUTER APPLY  (SELECT TOP (1) 
        [Extent3].[ProductCategoryID] AS [ProductCategoryID], 
        [Extent3].[Name] AS [Name], 
        [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [Extent2].[Name] AS [Name1], 
        [Extent2].[ProductCategoryID] AS [ProductCategoryID1]
        FROM  [Production].[ProductSubcategory] AS [Extent2]
        INNER JOIN [Production].[ProductCategory] AS [Extent3] ON [Extent2].[ProductCategoryID] = [Extent3].[ProductCategoryID]
        WHERE [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID] ) AS [Limit1]
```

### Disable lazy loading

There are some scenarios lazy loading needs to be disabled, like entity serialization. There are several ways to disable lazy loading for different scopes

-   To disable lazy loading for specific navigation properties, just do not mark it as virtual, so that the derived proxy class cannot override it with the lazy load implementation.
-   To disable lazy loading for specific DbContext, set DbContextConfiguration object’s LazyLoadingEnabled property to false:
    ```
    internal static void DisableLazyLoading()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            adventureWorks.Configuration.LazyLoadingEnabled = false;
            ProductSubcategory subcategory = adventureWorks.ProductSubcategories.First(); // Database query.
            Trace.WriteLine(subcategory.Name);
            ProductCategory associatedCategory = subcategory.ProductCategory; // No database query.
            Trace.WriteLine(associatedCategory == null); // True
            ICollection<Product> associatedProducts = subcategory.Products; // No database query.
            Trace.WriteLine(associatedProducts.Count); // 0
        }
    }
    ```
    
-   To disable lazy loading by default, set LazyLoadingEnabled when constructing DbContext:
    ```
    public partial class AdventureWorks
    {
        public AdventureWorks()
            : base(ConnectionStrings.AdventureWorks)
        {
            this.Configuration.LazyLoadingEnabled = false;
        }
    }
    ```