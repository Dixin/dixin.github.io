---
title: "Entity Framework Core and LINQ to Entities (9) Performance"
published: 2018-10-30
description: "The previous parts has discussed some aspects that can impact the performance of EF/Core and LINQ to Entities, and here is a summary:"
image: ""
tags: ["C#", ".NET", ".NET Core", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## EF version of this article: [https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-10-performance](/posts/entity-framework-and-linq-to-entities-10-performance "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-10-performance")

The previous parts has discussed some aspects that can impact the performance of EF/Core and LINQ to Entities, and here is a summary:

-   Remote LINQ to Entities query can have better performance than local or hybrid query. An intuitive example is Last query for a table data source, which could query the entire table, load data to local, and query the last result locally. It is better to just have a remote query and only load the specific result.
-   Using Select to only query the data can have better performance than querying full entity.
-   Disabling entity tracking can improve the performance.
-   Disabling automatic change detection can improve the performance.
-   When adding a sequence of entities to repository, DbSet<T>.AddRange/DbSet<T>.RemoveRange call can have better performance than many DbSet<T>.Add/DbSet<T>.Remove calls.

> And, in EF, with lazy loading, accessing an entity’s navigation property can cause additional database query round trips (the N + 1 queries problem). Eager loading can improve the performance by read all needed data with 1 single database query.

This part continues the discussion of performance.

## Initialization

> EF dies a lot of initialization work before the first database query is executed.
> 
> The following example simply pulls categories from the repository, with one LINQ to Entities query:’
> 
> ```sql
> internal static partial class Performance
> {
>     internal static void Initialize()
>     {
>         using (AdventureWorks adventureWorks = new AdventureWorks())
>         {
>             IQueryable<ProductCategory> categories = adventureWorks.ProductCategories;
>             categories.WriteLines(category => category.Name);
>             // select cast(serverproperty('EngineEdition') as int)
> 
>             // SELECT Count(*)
>             // FROM INFORMATION_SCHEMA.TABLES AS t
>             // WHERE t.TABLE_SCHEMA + '.' + t.TABLE_NAME IN ('HumanResources.Employee','Person.Person','Production.ProductCategory','Production.ProductSubcategory','Production.Product','Production.ProductProductPhoto','Production.ProductPhoto','Production.TransactionHistory','HumanResources.vEmployee') 
>             //    OR t.TABLE_NAME = 'EdmMetadata'
>             // exec sp_executesql N'SELECT 
>             //    [GroupBy1].[A1] AS [C1]
>             //    FROM ( SELECT 
>             //        COUNT(1) AS [A1]
>             //        FROM [dbo].[__MigrationHistory] AS [Extent1]
>             //        WHERE [Extent1].[ContextKey] = @p__linq__0
>             //    )  AS [GroupBy1]',N'@p__linq__0 nvarchar(4000)',@p__linq__0=N'AdventureWorks'
>             // SELECT 
>             //    [GroupBy1].[A1] AS [C1]
>             //    FROM ( SELECT 
>             //        COUNT(1) AS [A1]
>             //        FROM [dbo].[__MigrationHistory] AS [Extent1]
>             //    )  AS [GroupBy1]
>             // SELECT TOP (1) 
>             //    [Extent1].[Id] AS [Id], 
>             //    [Extent1].[ModelHash] AS [ModelHash]
>             //    FROM [dbo].[EdmMetadata] AS [Extent1]
>             //    ORDER BY [Extent1].[Id] DESC
>             // SELECT 
>             //    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
>             //    [Extent1].[Name] AS [Name]
>             //    FROM [Production].[ProductCategory] AS [Extent1]
>         }
>     }
> }
> ```
> 
> Executing above code, a bunch of SQL queries can be traced. And only the last SELECT query is the expected LINQ to Entities query translation. Actually, before a database’s first operation at runtime (e.g., querying Production.ProductCategory table here), EF does a lot of work to initialize its object-relational mapping:
> 
> 1.  Initialize provider manifest
> 2.  Initialize the entity data model. EF automatically builds the object models (CLR models, not above entities), conceptual models, storage models, object-conceptual model mappings, conceptual-storage model mappings, etc..
> 3.  Initialize the database, if needed.
> 4.  Initialize mapping views, which are the mapping information for entity sets.
> 5.  Initialize a dynamic assembly "EntityFrameworkDynamicProxies-{OriginalAssemblyName}, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", and define proxy types in it.
> 
> The above initialization steps executes only once at runtime, and their performance can be improved from the default behavior.

### Provider initialization

> As fore mentioned, EF implements the provider model to work with different kinds of data stores, and it need to get the basic information of current data store. For SQL database:
> 
> -   The SQL database server’s version is detected by calling DbConnection.ServerVersion
> -   The engine edition is queried by above [SERVERPROPERTY](https://msdn.microsoft.com/en-us/library/ms174396.aspx) metadata function, to determine whether it is a on premise database (SQL Server) or cloud database (SQL Azure, aka Azure SQL Database).
> 
> For SQL database, the supported provider manifest tokens are:
> 
> ```csharp
> namespace System.Data.Entity.SqlServer
> {
>     internal class SqlProviderManifest : DbXmlEnabledProviderManifest
>     {
>         internal const string TokenSql8 = "2000";
> 
>         internal const string TokenSql9 = "2005";
> 
>         internal const string TokenSql10 = "2008";
> 
>         internal const string TokenSql11 = "2012";
> 
>         internal const string TokenAzure11 = "2012.Azure";
> 
>         // Other members.
>     }
> }
> ```
> 
> For any on premise SQL database later than 11.0, just use “2012”. For cloud SQL database, use “2012.Azure”. In this tutorial, the server version and engine edition is known. So these information can be provided to EF via System.Data.Entity.Infrastructure.IManifestTokenResolver:
> 
> ```csharp
> public class SqlConfiguration : DbConfiguration
> {
>     public SqlConfiguration() =>
>             this.SetManifestTokenResolver(new SqlManifestTokenResolver());
> }
> 
> public class SqlManifestTokenResolver : IManifestTokenResolver
> {
>     public string ResolveManifestToken(DbConnection connection) => "2012.Azure";
> }
> ```
> 
> Then engine edition query is not executed during initialization. Notice EF only support defining a single type derived from DbConfiguration. In the object-relational mapping part, there us already a RetryConfiguration type defined to specify the retry strategy. The logic in both types must be merged intto one type, otherwise EF throws exception during initialization.

### Database initialization

> The database initialization work is represented by System.Data.Entity.IDatabaseInitializer<TContext> interface:
> 
> ```csharp
> namespace System.Data.Entity
> {
>     public interface IDatabaseInitializer<in TContext> where TContext : DbContext
>     {
>         void InitializeDatabase(TContext context);
>     }
> }
> ```
> 
> EF provides several built-in initializers under System.Data.Entity namespace:
> 
> -   NullDatabaseInitializer<TContext>: Do nothing for initialization
> -   DropCreateDatabaseAlways<TContext>: Always drop the database and create again
> -   DropCreateDatabaseIfModelChanges<TContext>: Drop and create database when the code mapping mismatches database schema.
> -   MigrateDatabaseToLatestVersion<TContext, TMigrationsConfiguration>: Use the specified code to update the database to the latest version.
> -   CreateDatabaseIfNotExists<TContext>: Create database if not exist.
> 
> CreateDatabaseIfNotExists<TContext>: is the default initializer, so it is executed here too. As a result, EF attempts to [query the existence of the mapped tables and views, database migration history, and entity data model info, etc](https://romiller.com/2014/06/10/reducing-code-first-database-chatter/). Apparently, here AdventureWorks database does not have the migration and entity data model info; recreating database is not needed as well. So the database initialization can be turned off, by setting the initializer to NullDatabaseInitializer<TContext>:
> 
> ```
> public partial class AdventureWorks
> {
>     static AdventureWorks()
>     {
>         Database.SetInitializer(new NullDatabaseInitializer<AdventureWorks>()); // Call once.
>         // Equivalent to: Database.SetInitializer<AdventureWorks>(null);
>     }
> }
> ```
> 
> where NullDatabaseInitializer<TContext> provide empty operation that does nothing:
> 
> ```csharp
> namespace System.Data.Entity
> {
>     public class NullDatabaseInitializer<TContext> : IDatabaseInitializer<TContext> where TContext : DbContext
>     {
>         public virtual void InitializeDatabase(TContext context)
>         {
>         }
>     }
> }
> ```
> 
> Now all the additional database queries for initialization are turned off.

### Mapping views initialization

> In EF, mapping views are not the views inside the database. They are System.Data.Entity.Infrastructure.MappingViews.DbMappingView instances, representing the mapping information for entity sets. Instead of generate these instances at runtime, pre-generate them at design time can improve the performance. Microsoft provides a Visual Studio extension, EF Power Tools, to generate these code. It needs to be [modified](http://thedatafarm.com/data-access/installing-ef-power-tools-into-vs2015/) to installed with the latest Visual Studio. After the installation, just right click the code file containing the database mapping (the class derived from DbContext), and in the menu click EF => Generate Views, it generates a file, containing the code to create the DbMappingView instances.

## Cache

After the object-relational mapping metadata is initialized, they are cached, so that the initialization only happens once for the AppDomain. EF/Core also implement cache for entities and query translation.

### Entity cache

As fore mentioned, by default, the entities queried from repository are cached and tracked. This behavior can be demonstrated by the following example:

```sql
internal static void CachedEntity(AdventureWorks adventureWorks)
{
    ProductCategory categoryCopy1 = adventureWorks.ProductCategories
        .Single(entity => entity.ProductCategoryID == 1);
    categoryCopy1.Name = "Cache";

    ProductCategory categoryCopy2 = adventureWorks.ProductCategories
        .Single(entity => entity.Name == "Bikes");
    categoryCopy2.Name.WriteLine(); // Cache
    object.ReferenceEquals(categoryCopy1, categoryCopy2).WriteLine(); // True

    ProductCategory categoryCopy3 = adventureWorks.ProductCategories
#if EF
        .SqlQuery(
#else
        .FromSql(
#endif
            @"SELECT TOP (1) [ProductCategory].[ProductCategoryID], [ProductCategory].[Name]
            FROM [Production].[ProductCategory]
            ORDER BY [ProductCategory].[ProductCategoryID]")
        .Single();
    object.ReferenceEquals(categoryCopy1, categoryCopy3).WriteLine(); // True
}
```

In this example, the first query reads data from the repository and materialize the data to a category entity, and update its Name. Then the repository is queried again by Name. After reading the data, EF/Core find the primary key is the same as the cached entity, so EF/Core do not materialize the data just read, it reuses the previous category entity. Performance can be improved by skipping the materialization, but tricky result can happen. The second query reads entity with Name “Bikes”, but the query result entity has Name “Cache”. This is not only LINQ to Entities queries’ behavior, When DbSet<T> directly executes SQL query in the repository, EF/Core still uses cached entities.

Entity is not cached when tracking is turned off, or entity is not queried from the repository. Each of the following queries materializes a new entity:

```sql
internal static void UncachedEntity(AdventureWorks adventureWorks)
{
    ProductCategory categoryCopy1 = adventureWorks.ProductCategories
        .Single(entity => entity.ProductCategoryID == 1);
    categoryCopy1.Name = "Cache";

    ProductCategory categoryCopy2 = adventureWorks.ProductCategories
        .AsNoTracking().Single(entity => entity.Name == "Bikes");
    categoryCopy2.Name.WriteLine(); // Bikes
    object.ReferenceEquals(categoryCopy1, categoryCopy2).WriteLine(); // False

    ProductCategory categoryCopy3 = adventureWorks.ProductCategories
#if EF
        .SqlQuery(
#else
        .FromSql(
#endif
            @"SELECT TOP (1) [ProductCategory].[ProductCategoryID], [ProductCategory].[Name]
            FROM [Production].[ProductCategory]
            ORDER BY [ProductCategory].[ProductCategoryID]")
        .AsNoTracking()
        .Single();
    object.ReferenceEquals(categoryCopy1, categoryCopy3).WriteLine(); // False

#if EF
    ProductCategory categoryCopy4 = adventureWorks.Database
        .SqlQuery<ProductCategory>(@"
            SELECT TOP (1) [ProductCategory].[ProductCategoryID], [ProductCategory].[Name]
            FROM [Production].[ProductCategory]
            ORDER BY [ProductCategory].[ProductCategoryID]")
        .Single();
    object.ReferenceEquals(categoryCopy1, categoryCopy4).WriteLine(); // False
#endif
}
```

DbSet.Find accept the primary keys and returns an entity. Calling Find can improve the performance, because it looks up cache before querying the repository:
```
internal static void Find(AdventureWorks adventureWorks)
{
    Product[] products = adventureWorks.Products
        .Where(entity => entity.Name.StartsWith("Road")).ToArray(); // Execute query.
    Product product = adventureWorks.Products.Find(999); // No database query.
    object.ReferenceEquals(products.Last(), product).WriteLine(); // True
}
```

Here when Find is called, entity with the specified primary key is already queries, cached and tracked, so Find directly returns the cached entity, without repository query or data materialization.

### LINQ query translation cache

As discussed in the query translation part, EF/Core translate a LINQ to Entities query in 2 steps:

-   Compile LINQ expression tree to database expression tree
-   Generate SQL from database expression tree

To improve the performance, EF Core caches the query translations in a Microsoft.Extensions.Caching.Memory.MemoryCache. Before processing a LINQ query, EF Core computes the cache key, and looks up the cache. If the translation is found, then it reuses the translation; if not, it translates the query, and add the translation to cache.. For SQL database queries, the cache key’s hash code is computed with the the hash code of the following values:

-   The LINQ query expression tree. The LINQ query expression tree is scanned recursively, the hash code of the nodes and APIs represented by the expression tree nodes are used to compute the hash code of the entire expression tree.
-   DbContext.Model
-   DbContext.ChangeTracker.QueryTrackingBehavior, which is an enumeration of TrackAll or NoTracking
-   A Boolean value that indicates whether the query is executed asynchronously
-   SqlServerOptionsExtension.UseRelationalNulls, which can be specified with SqlServerDbContextOptionsBuilder.UseRelationalNulls
-   SqlServerOptionsExtension.RowNumberPaging, which can be specified with SqlServerDbContextOptionsBuilder.UseRowNumberForPaging

> EF always compiles the LINQ expression tree to database expression tree, then cache the SQL generation in a dictionary. For example:
> 
> ```
> internal static void TranslationCache(AdventureWorks adventureWorks)
> {
>     int minLength = 1;
>     IQueryable<Product> query = adventureWorks.Products
>         .Where(product => product.Name.Length >= minLength)
>         .Include(product => product.ProductSubcategory);
>     query.Load();
> }
> ```
> 
> EF generates the cache key with the following values:
> 
> -   The database expression tree’s string representation. Here it is: \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.Products:Transient.collection\[Product(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),@p\_\_linq\_\_0:Edm.Int32(Nullable=False,DefaultValue=))))
> -   The parameters’ string representation: @@1p\_\_linq\_\_0:System.Int32
> -   The path of the Include query. Here it is ProductSubcategory
> -   The query’s MergeOption, which is AppendOnly by default.
> -   System.Data.Entity.Core.Objects.ObjectContextOptions.UseCSharpNullComparisonBehavior

The following example executes 2 LINQ to Entities queries:
```
internal static void UnreusedTranslationCache(AdventureWorks adventureWorks)
{
    IQueryable<Product> queryWithConstant1 = adventureWorks.Products
        .Where(product => product.Name.Length >= 1);
    queryWithConstant1.Load();

    IQueryable<Product> queryWithConstant2 = adventureWorks.Products
        .Where(product => product.Name.Length >= 10);
    queryWithConstant2.Load();
}
```

These first LINQ query builds expression trees with a ConstantExpression node representing int value 1. The second query builds similar expression tree but with a different ConstantExpression node representing int value 10. So these LINQ expression trees are different. In EF Core, the first expression tree’s translation cannot be reused for the second query.

> In EF, their compiled database expression trees are different too, with 2 different DbConstantExpression nodes. The 2 database expression trees’ string representations are:
> 
> -   \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.ProductCategories:Transient.collection\[ProductCategory(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),1:Edm.Int32(Nullable=True,DefaultValue=))))
> -   \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.ProductCategories:Transient.collection\[ProductCategory(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),10:Edm.Int32(Nullable=True,DefaultValue=))))
> 
> So the first query’s SQL generation cannot be used for the second query either.

To reuse the translation cache, these queries can be parameterized by simply replace the constants with variables:
```
internal static void ReusedTranslationCache(AdventureWorks adventureWorks)
{
    int minLength = 1;
    IQueryable<Product> queryWithClosure1 = adventureWorks.Products
        .Where(product => product.Name.Length >= minLength);
    queryWithClosure1.Load();

    minLength = 10;
    IQueryable<Product> queryWithClosure2 = adventureWorks.Products
        .Where(product => product.Name.Length >= minLength);
    queryWithClosure2.Load();
}
```

As discussed in the C# features chapter, the predicate lambda expressions capture variable minLength with the closure syntactic sugar. The above code is compiled to:
```
internal static void ReusedTranslationCache(AdventureWorks adventureWorks)
{
    int minLength = 1;
    IQueryable<Product> queryWithClosure1 = adventureWorks.Products
        .Where(product => product.Name.Length >= minLength);
    queryWithClosure1.Load();

    minLength = 10;
    IQueryable<Product> queryWithClosure2 = adventureWorks.Products
        .Where(product => product.Name.Length >= minLength);
    queryWithClosure2.Load();
}
```

In the predicates, the outer variable access is compiled to field access. So in the LINQ queries’ expression trees, there are no longer ConstantExpression nodes representing different int values, but MemberExpression nodes representing the same field. As a result, the 2 query’s LINQ expression trees are identical, and the translation is reused.

> In EF, if a query method accepts values instead of lambda expression, this parameterization approach does not work. For example, Skip and Take accept int values as parameters:
> 
> ```
> internal static void UnresuedSkipTakeTranslationCache(AdventureWorks adventureWorks)
> {
>     int skip = 1;
>     int take = 1;
>     IQueryable<Product> skipTakeWithVariable1 = adventureWorks.Products
>         .OrderBy(product => product.ProductID).Skip(skip).Take(take);
>     skipTakeWithVariable1.Load();
> 
>     skip = 10;
>     take = 10;
>     IQueryable<Product> skipTakeWithVariable2 = adventureWorks.Products
>         .OrderBy(product => product.ProductID).Skip(skip).Take(take);
>     skipTakeWithVariable2.Load();
> }
> ```
> 
> The above LINQ queries access to variable skip and take, but these variable access are also represented by ConstantExpression nodes. So their expression trees are different, and converted database command trees are different, and their translations cannot be reused for each other. To resolve this problem, EF provides a lambda expression version for these methods:
> 
> ```csharp
> namespace System.Data.Entity
> {
>     public static class QueryableExtensions
>     {
>         public static IQueryable<TSource> Skip<TSource>(this IQueryable<TSource> source, Expression<Func<int>> countAccessor);
> 
>         public static IQueryable<TSource> Take<TSource>(this IQueryable<TSource> source, Expression<Func<int>> countAccessor);
>     }
> }
> ```
> 
> Now Skip and Take can access variables via closure:
> 
> ```
> internal static void ResuedSkipTakeTranslationCache(AdventureWorks adventureWorks)
> {
>     int skip = 1;
>     int take = 1;
>     IQueryable<Product> skipTakeWithClosure1 = adventureWorks.Products
>         .OrderBy(product => product.ProductID).Skip(() => skip).Take(() => take);
>     skipTakeWithClosure1.Load();
> 
>     skip = 10;
>     take = 10;
>     IQueryable<Product> skipTakeWithClosure2 = adventureWorks.Products
>         .OrderBy(product => product.ProductID).Skip(() => skip).Take(() => take);
>     skipTakeWithClosure2.Load();
> }
> ```
> 
> These LINQ queries have MemberExpression nodes again. EF can convert them to identical parameterized database expression trees. Now their translations can be reused for each other.

### SQL query plan cache

LINQ queries with different constants are translated to different SQL queries. Above queryWithConstant1 and queryWithConstant2 are translated to:

```sql
SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID], [product].[RowVersion]
FROM [Production].[Product] AS [product]
WHERE LEN([product].[Name]) >= 1

SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID], [product].[RowVersion]
FROM [Production].[Product] AS [product]
WHERE LEN([product].[Name]) >= 10
```

Apparently they have different query plans in SQL database, which cannot be reused for each other:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-9-_9F66/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-9-_9F66/image_8.png)

With parameterization, queryWithClosure1 and queryWithClosure2 are translated to identical SQL queries, with different parameter values:

```sql
exec sp_executesql N'SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID], [product].[RowVersion]
FROM [Production].[Product] AS [product]
WHERE LEN([product].[Name]) >= @__minLength_0',N'@__minLength_0 int',@__minLength_0=1

exec sp_executesql N'SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID], [product].[RowVersion]
FROM [Production].[Product] AS [product]
WHERE LEN([product].[Name]) >= @__minLength_0',N'@__minLength_0 int',@__minLength_0=10
```

So in SQL database, queryWithClosure1’s query plan is cached and reused for queryWithClosure2:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-9-_9F66/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-9-_9F66/image_6.png)

## Asynchrony

Generally, for long running I/O bound operation, asynchrony can improve the application responsiveness and service scalability. EF/Core support asynchrony for database CRUD operations, and these async APIs are very easy to use with C# async/await keywords. Please notice this does not mean all the synchronous API calls must be replaced by asynchronous API calls, the application must be tested to identify which API has better performance.

### Asynchronous data queries and data changes

For LINQ to Entities queries, EF/Core start to read the data when values are pulled from IQueryable<T> data source, for example:

-   Pull the values from the query represented by IQueryable<T>.
-   Call a query method to return a single value from the IQueryable<T>, like First, etc..
-   Call a LINQ to Objects query method to return a new collection, like ToArray, etc..

For these operations and APIs, async parities are provided as IQueryable<T> extension methods. In EF Core, these async query APIs are also provided as extension methods in Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions:

-   async iteration method: ForEachAsync asynchronously pulls each value from IQueryable<T> data source and call the specified function.
-   async methods to return a single value:

-   Element: FirstAsync, FirstOrDefaultAsync, LastAsync, LastOrDefaultAsync, SingleAsync, SingleOrDefaultAsync
-   Aggregation: CountAsync, LongCountAsync, MinAsync, MaxAsync, SumAsync, AverageAsync
-   Quantifier: AllAsync, AnyAsync, ContainsAsync

-   async methods to return a new collection: ToArrayAsync, ToDictionaryAsync, ToListAsync

> In EF, these methods are provided in System.Data.Entity.QueryableExtensions, and LastAsync, LastOrDefaultAsync are not provided, since EF does not support Last, LastOrDefault.

For data changes, DbContext.SaveChangesAsync is provided as a parity of DbContext.SaveChanges. For example:
```
internal static async Task Async(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> categories = adventureWorks.ProductCategories;
    await categories.ForEachAsync( // Async version of foreach/ForEach.
        category => category.Name.WriteLine());

    ProductSubcategory subcategory = await adventureWorks.ProductSubcategories
        .FirstAsync(entity => entity.Name.Contains("Bike")); // Async version of First.
    subcategory.Name.WriteLine();

    Product[] products = await adventureWorks.Products
        .Where(product => product.ListPrice <= 10)
        .ToArrayAsync(); // Async version of ToArray.

    adventureWorks.Products.RemoveRange(products);
    (await adventureWorks.SaveChangesAsync()).WriteLine(); // Async version of SaveChanges.
}
```

### Transactions and connection resiliency with asynchronous operations

These async APIs work in EF/Core transaction. In this tutorial, connection resiliency is enabled because cloud SQL database is used, so call the retry strategy’s ExecuteAsync method:

```sql
internal static async Task DbContextTransactionAsync(AdventureWorks adventureWorks)
{
    await adventureWorks.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
    {
#if EF
        using (IDbContextTransaction transaction = adventureWorks.Database.BeginTransaction(
#else
        using (IDbContextTransaction transaction = await adventureWorks.Database.BeginTransactionAsync(
#endif
            IsolationLevel.ReadUncommitted))
        {
            try
            {
                adventureWorks.CurrentIsolationLevel().WriteLine(); // ReadUncommitted

                ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
#if EF
                adventureWorks.ProductCategories.Add(category);
#else
                await adventureWorks.ProductCategories.AddAsync(category);
#endif
                (await adventureWorks.SaveChangesAsync()).WriteLine(); // 1

                await adventureWorks.Database.ExecuteSqlCommandAsync(
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

These async APIs also work in ADO.NET transaction:

```sql
internal static async Task DbTransactionAsync()
{
    using (SqlConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
    {
        await connection.OpenAsync();
        using (DbTransaction transaction = connection.BeginTransaction(IsolationLevel.Serializable))
        {
            try
            {
                using (AdventureWorks adventureWorks = new AdventureWorks(connection))
                {
                    await adventureWorks.Database.CreateExecutionStrategy().ExecuteAsync(async () =>
                    {
                        adventureWorks.Database.UseTransaction(transaction);
                        adventureWorks.CurrentIsolationLevel().WriteLine(); // Serializable

                        ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
#if EF
                        adventureWorks.ProductCategories.Add(category);
#else
                        await adventureWorks.ProductCategories.AddAsync(category);
#endif
                        (await adventureWorks.SaveChangesAsync()).WriteLine(); // 1.
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
                    (await command.ExecuteNonQueryAsync()).WriteLine(); // 1
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

TransactionScope by default does not support across thread transaction flow. Using the the async/await syntactic sugar for TransactionScope causes InvalidOperationException: A TransactionScope must be disposed on the same thread that it was created.. To resolved this, Since .NET 4.5.1, a new constructor for TransactionScope is provided to explicitly enable transaction flow across thread continuations:

```sql
internal static async Task TransactionScopeAsync()
{
    await new ExecutionStrategy().ExecuteAsync(async () =>
    {
        using (TransactionScope scope = new TransactionScope(
            scopeOption: TransactionScopeOption.Required,
            transactionOptions: new TransactionOptions()
            {
                IsolationLevel = System.Transactions.IsolationLevel.RepeatableRead
            },
            asyncFlowOption: TransactionScopeAsyncFlowOption.Enabled))
        {
            using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
            using (DbCommand command = connection.CreateCommand())
            {
                command.CommandText = DbContextExtensions.CurrentIsolationLevelSql;
                await connection.OpenAsync();
                using (DbDataReader reader = await command.ExecuteReaderAsync())
                {
                    await reader.ReadAsync();
                    reader[0].WriteLine(); // RepeatableRead
                }
            }

            using (AdventureWorks adventureWorks = new AdventureWorks())
            {
                ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
                adventureWorks.ProductCategories.Add(category);
                (await adventureWorks.SaveChangesAsync()).WriteLine(); // 1
            }

            using (AdventureWorks adventureWorks = new AdventureWorks())
            {
                adventureWorks.CurrentIsolationLevel().WriteLine(); // RepeatableRead
            }

            using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
            using (DbCommand command = connection.CreateCommand())
            {
                command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0";
                DbParameter parameter = command.CreateParameter();
                parameter.ParameterName = "@p0";
                parameter.Value = nameof(ProductCategory);
                command.Parameters.Add(parameter);

                await connection.OpenAsync();
                (await command.ExecuteNonQueryAsync()).WriteLine(); // 1
            }

            scope.Complete();
        }
    });
}
```

### Asynchronous concurrent conflicts

EF/Core also provide async APIs for other database operations. In the previous concurrency part, a DbContext.SaveChanges overload is implemented to handle concurrency conflict, refresh entity, and retry saving changes. Here a async version can be implemented easily:
```
public static partial class DbContextExtensions
{
    public static async Task<int> SaveChangesAsync(
        this DbContext context, Func<IEnumerable<EntityEntry>, Task> resolveConflictsAsync, int retryCount = 3)
    {
        if (retryCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(retryCount));
        }

        for (int retry = 1; retry < retryCount; retry++)
        {
            try
            {
                return await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException exception) when (retry < retryCount)
            {
                await resolveConflictsAsync(exception.Entries);
            }
        }
        return await context.SaveChangesAsync();
    }

    public static async Task<int> SaveChangesAsync(
        this DbContext context, Func<IEnumerable<EntityEntry>, Task> resolveConflictsAsync, RetryStrategy retryStrategy)
    {
        RetryPolicy retryPolicy = new RetryPolicy(
            new TransientDetection<DbUpdateConcurrencyException>(), retryStrategy);
        retryPolicy.Retrying += (sender, e) =>
            resolveConflictsAsync(((DbUpdateConcurrencyException)e.LastException).Entries).Wait();
        return await retryPolicy.ExecuteAsync(async () => await context.SaveChangesAsync());
    }
}
```

With the async/await syntactic sugar, the implementation looks very similar to the synchronous version. The following are the SaveChangesAsync overloads to accept RefreshConflict enumeration:
```
public static async Task<int> SaveChangesAsync(
    this DbContext context, RefreshConflict refreshMode, int retryCount = 3)
{
    if (retryCount <= 0)
    {
        throw new ArgumentOutOfRangeException(nameof(retryCount));
    }

    return await context.SaveChangesAsync(
        async conflicts => await Task.WhenAll(conflicts.Select(async tracking =>
            await tracking.RefreshAsync(refreshMode))),
        retryCount);
}

public static async Task<int> SaveChangesAsync(
    this DbContext context, RefreshConflict refreshMode, RetryStrategy retryStrategy) =>
        await context.SaveChangesAsync(
            async conflicts => await Task.WhenAll(conflicts.Select(async tracking =>
                await tracking.RefreshAsync(refreshMode))),
            retryStrategy);
```

Instead of calling the previously defined Refresh extension method to refresh the DbEntityEntry instance, here a async method RefreshAsync is called to refresh asynchronously:
```
public static async Task<EntityEntry> RefreshAsync(this EntityEntry tracking, RefreshConflict refreshMode)
{
    switch (refreshMode)
    {
        case RefreshConflict.StoreWins:
        {
            await tracking.ReloadAsync();
            break;
        }
        case RefreshConflict.ClientWins:
        {
            PropertyValues databaseValues = await tracking.GetDatabaseValuesAsync();
            if (databaseValues == null)
            {
                tracking.State = EntityState.Detached;
            }
            else
            {
                tracking.OriginalValues.SetValues(databaseValues);
            }
            break;
        }
        case RefreshConflict.MergeClientAndStore:
        {
            PropertyValues databaseValues = await tracking.GetDatabaseValuesAsync();
            if (databaseValues == null)
            {
                tracking.State = EntityState.Detached;
            }
            else
            {
                PropertyValues originalValues = tracking.OriginalValues.Clone();
                tracking.OriginalValues.SetValues(databaseValues);
#if EF
                databaseValues.PropertyNames
                    .Where(property => !object.Equals(originalValues[property], databaseValues[property]))
                    .ForEach(property => tracking.Property(property).IsModified = false);
#else
                databaseValues.Properties
                    .Where(property => !object.Equals(originalValues[property.Name], databaseValues[property.Name]))
                    .ForEach(property => tracking.Property(property.Name).IsModified = false);
#endif
            }
            break;
        }
    }
    return tracking;
}
```

Now concurrency conflict can be resolved automatically and asynchronously:
```
internal static async Task SaveChangesAsync()
{
    using (AdventureWorks adventureWorks1 = new AdventureWorks())
    using (AdventureWorks adventureWorks2 = new AdventureWorks())
    {
        int id = 950;
        Product productCopy1 = await adventureWorks1.Products.FindAsync(id);
        Product productCopy2 = await adventureWorks2.Products.FindAsync(id);

        productCopy1.Name = nameof(productCopy1);
        productCopy1.ListPrice = 100;
        (await adventureWorks1.SaveChangesAsync()).WriteLine(); // 1

        productCopy2.Name = nameof(productCopy2);
        productCopy2.ProductSubcategoryID = 1;
        (await adventureWorks2.SaveChangesAsync(RefreshConflict.MergeClientAndStore)).WriteLine(); // 1
    }
}
```