---
title: "Entity Framework and LINQ to Entities (10) Performance"
published: 2016-02-17
description: "The previous parts has discussed a few aspects that can impact the performance of Entity Framework and LINQ to Entities, and here is a summary:"
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework", "LINQ to Entities", "SQL Server", "SQL"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-9-performance**](/posts/entity-framework-core-and-linq-to-entities-9-performance "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-9-performance")

The previous parts has discussed a few aspects that can impact the performance of Entity Framework and LINQ to Entities, and here is a summary:

-   Properly specify database initializer and provider manifest token resolver can improve the initialization performance.
-   LINQ to Entities query can have better performance than LINQ to Objects query. An intuitive example is, context.Set<TEntity>().Take(2) can have better performance than context.Set<TEntity>().ToList().Take(2):

-   In the former query, Take is LINQ to Entities method (Queryable.Take). It is translated to database query, only the query result is read to local.
-   In the latter query, Take is LINQ to Object method (Enumerable.Take). This query reads the entire table from database to local, and query locally with Enumerable.Take.

-   Using Select to only query the needed data can have better performance than querying full entity with all data.
-   In lazy loading, accessing an entity’s navigation property can cause additional database query round trips (the N + 1 queries problem). Eager loading can improve the performance by read all needed data with 1 single database query.
-   Disabling entity tracking can improve the performance.
-   Disabling automatic change detection can improve the performance.
-   When adding multiple entities to repository, each DbSet<T>.Add call triggers change detection. DbSet<T>.AddRange can improve performance because it only triggers change detection once. Similarly, DbSet<T>.RemoveRange can improve performance from multiple DbSet<T>.Remove calls.

This part continues discussing performance.

## Initialization

The following example simply pulls categories from the repository, with one LINQ to Entities query:
```
internal static class Query
{
    internal static void Table()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            IQueryable<ProductCategory> allRowsInTable = adventureWorks.ProductCategories;
            allRowsInTable.ForEach(categoryRow => Trace.WriteLine(
                $"{categoryRow.ProductCategoryID}:{categoryRow.Name}"));
            // 1:Bikes 2:Components 3:Clothing 4:Accessories 
        }
    }
}
```

Executing above code, the SQL Profiler will trace a bunch of SQL queries:

```sql
select cast(serverproperty('EngineEdition') as int)

SELECT Count(*)
FROM INFORMATION_SCHEMA.TABLES AS t
WHERE t.TABLE_SCHEMA + '.' + t.TABLE_NAME IN ('Production.vProductAndDescription','Production.ProductCategory','Production.ProductSubcategory','Production.Product','Production.ProductProductPhoto','Production.ProductPhoto')
    OR t.TABLE_NAME = 'EdmMetadata'

exec sp_executesql N'SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        COUNT(1) AS [A1]
        FROM [dbo].[__MigrationHistory] AS [Extent1]
        WHERE [Extent1].[ContextKey] = @p__linq__0
    )  AS [GroupBy1]',N'@p__linq__0 nvarchar(4000)',@p__linq__0=N'Dixin.Linq.EntityFramework.AdventureWorks'

SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        COUNT(1) AS [A1]
        FROM [dbo].[__MigrationHistory] AS [Extent1]
    )  AS [GroupBy1]

SELECT TOP (1) 
    [Extent1].[Id] AS [Id], 
    [Extent1].[ModelHash] AS [ModelHash]
    FROM [dbo].[EdmMetadata] AS [Extent1]
    ORDER BY [Extent1].[Id] DESC

SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
```

Only the last SELECT query is the expected LINQ to Entities query translation. Actually, before a database’s first operation at runtime (e.g., querying Production.ProductCategory table here), Entity Framework does a lot of work to initialize its object-relational mapping:

1.  Initialize provider manifest
2.  Initialize the entity data model. Entity framework automatically builds the object models (CLR models, not above entities), conceptual models, storage models, object-conceptual model mappings, conceptual-storage model mappings, etc..
3.  Initialize the database, if needed.
4.  Initialize mapping views, which are the mapping information for entity sets.
5.  Initialize a dynamic assembly "EntityFrameworkDynamicProxies-{OriginalAssemblyName}, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null", and define proxy classes in it.

The above initialization steps executes only once at runtime, and they can be improved from the default behavior.

### Provider manifest initialization

As fore mentioned, Entity Framework implements the provider model to work with different kinds of data stores, and it need to get the basic information of current data store. For SQL database:

-   The database server’s version is detected by calling DbConnection.ServerVersion
-   The engine edition is queried by above [SERVERPROPERTY](https://msdn.microsoft.com/en-us/library/ms174396.aspx) metadata function, to determine whether it is a on premise database (SQL Server) or cloud database (SQL Azure, aka Azure SQL Database).

In this tutorial, the server version and engine edition is known. So these information can be provided to Entity Framework via System.Data.Entity.Infrastructure.IManifestTokenResolver:

```csharp
public class SqlConfiguration : DbConfiguration
{
    public SqlConfiguration()
    {
        this.SetManifestTokenResolver(new SqlManifestTokenResolver());
    }
}

public class SqlManifestTokenResolver : IManifestTokenResolver
{
    public string ResolveManifestToken(DbConnection connection) => "2012";
}
```

For SQL database, the supported provider manifest tokens are:

```csharp
namespace System.Data.Entity.SqlServer
{
    using System.Data.Entity.Core.Common;

    internal class SqlProviderManifest : DbXmlEnabledProviderManifest
    {
        internal const string TokenSql8 = "2000";

        internal const string TokenSql9 = "2005";

        internal const string TokenSql10 = "2008";

        internal const string TokenSql11 = "2012";

        internal const string TokenAzure11 = "2012.Azure";

        // Other members.
    }
}
```

For any on premise SQL engine newer than 11.0, just use “2012”.

Also, apparently the AdventureWorks database does not have the migration history and entity data model info, and creating database is not needed as well. So the database initialization can be turned off, by setting the initializer to NullDatabaseInitializer<TContext>:
```
public partial class AdventureWorks
{
    static AdventureWorks()
    {
        Database.SetInitializer(new NullDatabaseInitializer<AdventureWorks>()); // Call once.
        // Equivalent to: Database.SetInitializer<AdventureWorks>(null);
    }
}
```

where NullDatabaseInitializer<TContext> is just an empty class doing nothing:

```csharp
namespace System.Data.Entity
{
    public class NullDatabaseInitializer<TContext> : IDatabaseInitializer<TContext> where TContext : DbContext
    {
        public virtual void InitializeDatabase(TContext context)
        {
        }
    }
}
```

Now all the additional database queries for initialization are turned off.

### Database initialization

The database initialization work is represented by System.Data.Entity.IDatabaseInitializer<TContext> interface:

```csharp
namespace System.Data.Entity
{
    public interface IDatabaseInitializer<in TContext> where TContext : DbContext
    {
        void InitializeDatabase(TContext context);
    }
}
```

Entity Framework provides several built-in initializers under System.Data.Entity namespace:

-   NullDatabaseInitializer<TContext>: Do nothing for initialization
-   DropCreateDatabaseAlways<TContext>: Always drop the database and create again
-   DropCreateDatabaseIfModelChanges<TContext>: Drop and create database when the code mapping mismatches database schema.
-   MigrateDatabaseToLatestVersion<TContext, TMigrationsConfiguration>: Use the specified code to update the database schema to the latest version.
-   CreateDatabaseIfNotExists<TContext>: Create database if not exist.

CreateDatabaseIfNotExists<TContext>: is the default initializer, so it is executed here too. As a result, Entity Framework attempts to [query the existence of the mapped tables and views, database migration history, and entity data model info, etc](https://romiller.com/2014/06/10/reducing-code-first-database-chatter/). Apparently, here AdventureWorks database does not have the migration and entity data model info; recreating database is not needed as well. So the database initialization can be turned off, by setting the initializer to NullDatabaseInitializer<TContext>:
```
public partial class AdventureWorks
{
    static AdventureWorks()
    {
        Database.SetInitializer(new NullDatabaseInitializer<AdventureWorks>()); // Call once.
        // Equivalent to: Database.SetInitializer<AdventureWorks>(null);
    }
}
```

where NullDatabaseInitializer<TContext> is just an empty class doing nothing:

```csharp
namespace System.Data.Entity
{
    public class NullDatabaseInitializer<TContext> : IDatabaseInitializer<TContext> where TContext : DbContext
    {
        public virtual void InitializeDatabase(TContext context)
        {
        }
    }
}
```

Now all the additional database queries for initialization are turned off.

### Mapping views initialization

Mapping views are not the views inside the database. They are System.Data.Entity.Infrastructure.MappingViews.DbMappingView objects, representing the mapping information for entity sets. Instead of generate these objects at runtime, pre-generate them at design time can improve the performance. Microsoft provides a Visual Studio extension, Entity Framework Power Tools, to generate these code. It needs to be [modified](http://thedatafarm.com/data-access/installing-ef-power-tools-into-vs2015/) to installed with the latest Visual Studio. After the installation, just right click the code file containing the database mapping (the class derived from DbContext), and in the menu click Entity Framework => Generate Views, it will generate a file, containing the code to create the DbMappingView objects.

## Cache

After the metadata is initialized, they are cached, so that the initialization only happens once for the AppDomain. Entity Framework also implement cache for entities and query translation.

### Entity cache

As fore mentioned, by default, the entities queried from repository are cached and tracked. This behavior can be demonstrated by the following example:

```sql
internal static void CachedEntity()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category1 = adventureWorks.ProductCategories
            .Single(entity => entity.ProductCategoryID == 1);
        category1.Name = "Cache";

        ProductCategory category2 = adventureWorks.ProductCategories
            .Single(entity => entity.Name == "Bikes");
        Trace.WriteLine(category2.Name); // Cache
        Trace.WriteLine(category1 == category2); // True

        ProductCategory category3 = adventureWorks.ProductCategories
            .SqlQuery(@"
                SELECT TOP (1) [ProductCategory].[ProductCategoryID], [ProductCategory].[Name]
                FROM [Production].[ProductCategory]
                ORDER BY [ProductCategory].[ProductCategoryID]")
            .Single();
        Trace.WriteLine(category1 == category3); // True
    }
}
```

In this example, the first query reads data from the repository and materialize the data to a category entity, and update its Name. Then the repository is queried again by Name. After reading the data, Entity Framework founds the primary key is the same as the cached entity, so Entity Framework does not materialize the data just read, it reuses the previous category entity. Performance can be improved by skipping the materialization, but tricky result can happen. The second query reads entity with Name “Bikes”, but the query result entity has Name “Cache”. This is not only LINQ to Entities queries’ behavior, When DbSet<T>.SqlQuery to directly execute SQL query in the repository, Entity Framework still looks up cache before materializing.

Entity is not cached when tracking is turned off, or entity is not queried from the repository. Each of the following queries materializes a new entity:

```sql
internal static void UncachedEntity()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        ProductCategory category1 = adventureWorks.ProductCategories
            .Single(entity => entity.ProductCategoryID == 1);
        category1.Name = "Cache";

        ProductCategory category2 = adventureWorks.ProductCategories
            .AsNoTracking().Single(entity => entity.Name == "Bikes");
        Trace.WriteLine(category2.Name); // Bikes
        Trace.WriteLine(category1 == category2); // False

        ProductCategory category3 = adventureWorks.Database
            .SqlQuery<ProductCategory>(@"
                SELECT TOP (1) [ProductCategory].[ProductCategoryID], [ProductCategory].[Name]
                FROM [Production].[ProductCategory]
                ORDER BY [ProductCategory].[ProductCategoryID]")
            .Single();
        Trace.WriteLine(category1 == category3); // False
    }
}
```

DbSet.Find accept the primary keys and returns an entity. Calling Find can improve the performance, because it looks up cache before querying the repository:
```
internal static void Find()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        Product[] products = adventureWorks.Products
            .Where(product => product.Name.StartsWith("Road")).ToArray(); // SELECT.
        Product fromCache = adventureWorks.Products.Find(999); // No database query.
        Trace.WriteLine(products.Contains(fromCache)); // True
    }
}
```

Here when Find is called, entity with the specified primary key is already queries, cached and tracked, so Find directly returns the cached entity, without repository query or data materialization.

### LINQ query translation cache

As discussed in the query translation part, Entity Framework translates a LINQ to Entities query in 2 steps:

-   Converts .NET expression tree to database command tree
-   Generate SQL from database command tree

To improve the performance, the generated SQL is automatically cached for each database command tree. Take the following query as example:
```
internal static void TranslationCache()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        int minLength = 1;
        IQueryable<ProductCategory> query = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= minLength)
            .Include(category => category.ProductSubcategories);
        query.Load();
    }
}
```

Entity Framework always convert the LINQ query’s expression tree to database command tree, then it generates the cache key with the following information:

-   The database command tree’s root DbExpression object’s string representation. Here it is: \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.ProductCategories:Transient.collection\[Dixin.Linq.EntityFramework.ProductCategory(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),@p\_\_linq\_\_0:Edm.Int32(Nullable=False,DefaultValue=))))
-   The parameters’ string representation: @@1p\_\_linq\_\_0:System.Int32
-   The path of the Include query: ProductSubcategories
-   The query’s MergeOption. As fore mentioned, it is AppendOnly by default.
-   System.Data.Entity.Core.Objects.ObjectContextOptions’s UseCSharpNullComparisonBehavior property value

The translations are cached in a dictionary, so the generated key is used to look up a dictionary value. If not found, then generate SQL and add to the dictionary. This cached value is called query plan, and represented by System.Data.Entity.Core.Objects.Internal.ObjectQueryExecutionPlan. It includes the translated database query represented by DbCommand and System.Data.Entity.Core.Common.DbCommandDefinition, and other metadata, like parameters, result type, etc..

The following example executes 2 LINQ to Entities queries:
```
internal static void UncachedTranslation()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductCategory> queryWithConstant1 = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= 1);
        queryWithConstant1.Load();

        IQueryable<ProductCategory> queryWithConstant2 = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= 10);
        queryWithConstant2.Load();
    }
}
```

These first LINQ query builds expression trees with a ConstantExpression node representing int value 1. The second query builds similar expression tree but with a different ConstantExpression node representing int value 10. SO they are converted to 2 different database command trees, with 2 different DbConstantExpression nodes. The 2 database command trees’ string representations are:

-   \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.ProductCategories:Transient.collection\[Dixin.Linq.EntityFramework.ProductCategory(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),1:Edm.Int32(Nullable=True,DefaultValue=))))
-   \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.ProductCategories:Transient.collection\[Dixin.Linq.EntityFramework.ProductCategory(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),10:Edm.Int32(Nullable=True,DefaultValue=))))

So their query translation cannot be reused for each other. To resolve this problem, these queries can be parameterized by simply replace the constants with variables:
```
internal static void CachedTranslation()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        int minLength = 1;
        IQueryable<ProductCategory> queryWithClosure1 = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= minLength);
        queryWithClosure1.Load();

        minLength = 10;
        IQueryable<ProductCategory> queryWithClosure2 = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= minLength);
        queryWithClosure2.Load();
    }
}
```

As discussed in the C# features chapter, the predicate lambda expressions capture variable minLength with the closure syntactic sugar. The above code is compiled to:

```csharp
[CompilerGenerated]
private sealed class DisplayClass1
{
    public int minLength;
}

[CompilerGenerated]
private sealed class DisplayClass2
{
    public int minLength;
}

internal static void CompiledCachedTranslation()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        int minLength = 1;
        DisplayClass1 displayClass1 = new DisplayClass1() { minLength = minLength };
        IQueryable<ProductCategory> queryWithClosure1 = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= displayClass1.minLength);
        queryWithClosure1.Load();

        minLength = 10;
        DisplayClass1 displayClass2 = new DisplayClass1() { minLength = minLength };
        IQueryable<ProductCategory> queryWithClosure2 = adventureWorks.ProductCategories
            .Where(category => category.Name.Length >= displayClass2.minLength);
        queryWithClosure2.Load();
    }
}
```

The variable access is compiled to filed access. So in the LINQ queries’ expression trees, there are no longer ConstantExpression nodes, but FieldExpression nodes. Entity Framework converts these FieldExpression nodes to DbParameterReference nodes, representing int parameters. As a result, these 2 LINQ queries are converted to identical database command trees, with:

-   identical root node string representation: \[Filter\](BV'LQ1'=(\[Scan\](AdventureWorks.ProductCategories:Transient.collection\[Dixin.Linq.EntityFramework.ProductCategory(Nullable=True,DefaultValue=)\]))(\[>=\](FUNC<Edm.Length(In Edm.String(Nullable=True,DefaultValue=,MaxLength=,Unicode=,FixedLength=))>:ARGS((Var('LQ1')\[.\]Name)),@p\_\_linq\_\_0:Edm.Int32(Nullable=False,DefaultValue=))))
-   identical parameters’ string representation: @@1p\_\_linq\_\_0:System.Int32
-   and all the other identical metadata

So the query translations have identical cache key, and their translations can be reused for each other.

If a query method accepts values instead of lambda expression, this parameterization approach does not work. For example, Skip and Take accept int values as parameters:
```
internal static void UncachedSkipTake()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        int skip = 1;
        int take = 1;
        IQueryable<ProductSubcategory> skipTakeWithVariable1 = adventureWorks.ProductSubcategories
            .OrderBy(p => p.ProductSubcategoryID).Skip(skip).Take(take);
        skipTakeWithVariable1.Load();

        skip = 10;
        take = 10;
        IQueryable<ProductSubcategory> skipTakeWithVariable2 = adventureWorks.ProductSubcategories
            .OrderBy(p => p.ProductSubcategoryID).Skip(skip).Take(take);
        skipTakeWithVariable2.Load();
    }
}
```

The above LINQ queries access to variable skip and take, but these variable access are also represented by ConstantExpression nodes. So their expression trees are different, and converted database command trees are different, and their translations cannot be reused for each other. To resolve this problem, Entity Framework provides a lambda expression version for these methods:

```csharp
namespace System.Data.Entity
{
    using System.Linq;
    using System.Linq.Expressions;

    public static class QueryableExtensions
    {
        public static IQueryable<TSource> Skip<TSource>(this IQueryable<TSource> source, Expression<Func<int>> countAccessor);

        public static IQueryable<TSource> Take<TSource>(this IQueryable<TSource> source, Expression<Func<int>> countAccessor);
    }
}
```

Now Skip and Take can access variables via closure:
```
internal static void CachedSkipTake()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        int skip = 1;
        int take = 1;
        IQueryable<ProductSubcategory> skipTakeWithClosure1 = adventureWorks.ProductSubcategories
            .OrderBy(p => p.ProductSubcategoryID).Skip(() => skip).Take(() => take);
        skipTakeWithClosure1.Load();

        skip = 10;
        take = 10;
        IQueryable<ProductSubcategory> skipTakeWithClosure2 = adventureWorks.ProductSubcategories
            .OrderBy(p => p.ProductSubcategoryID).Skip(() => skip).Take(() => take);
        skipTakeWithClosure2.Load();
    }
}
```

These LINQ queries have FieldExpression nodes again. Entity Framework can convert them to identical parameterized database command trees. Now their translations can be reused for each other.

### SQL query plan cache

LINQ queries with different constants are translated to different SQL queries. Above queryWithConstant1 and queryWithConstant2 are translated to:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE (LEN([Extent1].[Name])) >= 1

SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE (LEN([Extent1].[Name])) >= 10
```

Apparently they have different query plans in SQL database, which cannot be reused for each other:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-10_13D39/image_thumb_7.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-10_13D39/image_16.png)

With parameterization, queryWithClosure1 and queryWithClosure2 are translated to identical SQL queries, with different parameter values:

```sql
exec sp_executesql N'SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE (LEN([Extent1].[Name])) >= @p__linq__0',N'@p__linq__0 int',@p__linq__0=1

exec sp_executesql N'SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE (LEN([Extent1].[Name])) >= @p__linq__0',N'@p__linq__0 int',@p__linq__0=10
```

So in SQL database, queryWithClosure1’s query plan is cached and reused for queryWithClosure2:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-10_13D39/image_thumb_6.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framework-and-LINQ-to-Entities-10_13D39/image_14.png)

## Asynchrony

Generally, for long running IO bound operation, asynchrony can improve the application responsiveness and service scalability. Entity Framework supports asynchrony for database CRUD operations, and these async APIs are very easy to use with C# async/await keywords.

### Asynchronous data queries and changes

For LINQ to Entities queries, Entity Framework starts to read the data when values are pulled from IQueryable<T> data source, for example:

-   Pull the values from IQueryable<T> with the iterator pattern, typically a foreach loop.
-   Call a query method to return a single value from the IQueryable<T>, like First, etc..
-   Call a LINQ to Objects query method to return a new collection, like ToArray, etc..

For these operations and APIs, Entity Framework provides async parities as IQueryable<T> extension methods, defined in System.Data.Entity.QueryableExtensions class:

-   QueryableExtensions.ForEachAsync asynchronously pulls each value from IQueryable<T> data source and execute the specified action with each value.
-   QueryableExtensions provides async methods to return a single value:

-   Element: FirstAsync, FirstOrDefaultAsync, SingleAsync, SingleOrDefaultAsync
-   Aggregation: CountAsync, LongCountAsync, MinAsync, MaxAsync, SumAsync, AverageAsync
-   Quantifier: AllAsync, AnyAsync, ContainsAsync

-   QueryableExtensions provides async methods to return a new collection: ToArrayAsync, ToDictionaryAsync, ToListAsync

For data changes, DbContext.SaveChangesAsync is provided as a parity of DbContext.SaveChanges. For example:
```
internal static async Task Async()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        IQueryable<ProductCategory> categories = adventureWorks.ProductCategories;
        await categories.ForEachAsync( // Async version of foreach/ForEach.
            category => Trace.WriteLine(category.Name));

        ProductSubcategory subcategory = await adventureWorks.ProductSubcategories
            .FirstAsync(entity => entity.Name.StartsWith("A")); // Async version of First.
        Trace.WriteLine(subcategory.Name);

        Product[] products = await adventureWorks.Products
            .Where(product => product.ListPrice <= 10)
            .ToArrayAsync(); // Async version of ToArray.

        adventureWorks.Products.RemoveRange(products);
        await adventureWorks.SaveChangesAsync(); // Async version of SaveChanges.
    }
}
```

### Transactions with asynchronous operations

Entity Framework and ADO.NET async APIs also work with DbContextTransaction and DbTransaction naturally:

```sql
internal static async Task DbContextTransactionAsync()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    using (DbContextTransaction transaction = adventureWorks.Database.BeginTransaction(
        IsolationLevel.ReadUncommitted))
    {
        try
        {
            Trace.WriteLine(adventureWorks.QueryCurrentIsolationLevel()); // ReadUncommitted

            ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
            adventureWorks.ProductCategories.Add(category);
            Trace.WriteLine(await adventureWorks.SaveChangesAsync()); // 1

            Trace.WriteLine(await adventureWorks.Database.ExecuteSqlCommandAsync(
                "DELETE FROM [Production].[ProductCategory] WHERE [Name] = {0}",
                nameof(ProductCategory))); // 1
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}

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
                    adventureWorks.Database.UseTransaction(transaction);
                    Trace.WriteLine(adventureWorks.QueryCurrentIsolationLevel()); // Serializable

                    ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
                    adventureWorks.ProductCategories.Add(category);
                    Trace.WriteLine(await adventureWorks.SaveChangesAsync()); // 1.
                }

                using (DbCommand command = connection.CreateCommand())
                {
                    command.CommandText = "DELETE FROM [Production].[ProductCategory] WHERE [Name] = @p0";
                    DbParameter parameter = command.CreateParameter();
                    parameter.ParameterName = "@p0";
                    parameter.Value = nameof(ProductCategory);
                    command.Parameters.Add(parameter);
                    command.Transaction = transaction;
                    Trace.WriteLine(await command.ExecuteNonQueryAsync()); // 1
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

TransactionScope by default does not support across thread transaction flow. Using the the async/await syntactic sugar for TransactionScope causes InvalidOperationException: A TransactionScope must be disposed on the same thread that it was created.. To resolved this, .NET 4.5.1+ introduced a new constructor for TransactionScope to explicitly enable transaction flow across thread continuations:

```sql
internal static async Task TransactionScopeAsync()
{
    using (TransactionScope scope = new TransactionScope(
        TransactionScopeOption.Required,
        new TransactionOptions() { IsolationLevel = System.Transactions.IsolationLevel.RepeatableRead },
        TransactionScopeAsyncFlowOption.Enabled))
    {
        using (DbConnection connection = new SqlConnection(ConnectionStrings.AdventureWorks))
        using (DbCommand command = connection.CreateCommand())
        {
            command.CommandText = DbContextExtensions.CurrentIsolationLevelSql;
            await connection.OpenAsync();
            using (DbDataReader reader = await command.ExecuteReaderAsync())
            {
                await reader.ReadAsync();
                Trace.WriteLine(reader[0]); // RepeatableRead
            }
        }

        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            ProductCategory category = new ProductCategory() { Name = nameof(ProductCategory) };
            adventureWorks.ProductCategories.Add(category);
            Trace.WriteLine(await adventureWorks.SaveChangesAsync()); // 1
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
            Trace.WriteLine(await command.ExecuteNonQueryAsync()); // 1
        }

        scope.Complete();
    }
}
```

### Asynchronous concurrency conflicts

Entity Framework also provides async APIs for other database operations. In the previous concurrency part, a DbContext.SaveChanges overload is implemented to handle concurrency conflict, refresh entity, and retry saving changes. Here a async version can be implemented easily:
```
public static partial class DbContextExtensions
{
    public static async Task<int> SaveChangesAsync(
        this DbContext context, Func<IEnumerable<DbEntityEntry>, Task> resolveConflictsAsync, int retryCount = 3)
    {
        context.NotNull(nameof(context));
        Argument.Range(retryCount > 0, $"{retryCount} must be greater than 0.", nameof(retryCount));

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
        this DbContext context, Func<IEnumerable<DbEntityEntry>, Task> resolveConflictsAsync, RetryStrategy retryStrategy)
    {
        context.NotNull(nameof(context));
        resolveConflictsAsync.NotNull(nameof(resolveConflictsAsync));
        retryStrategy.NotNull(nameof(retryStrategy));

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
public static partial class DbContextExtensions
{
    public static async Task<int> SaveChangesAsync(
        this DbContext context, RefreshConflict refreshMode, int retryCount = 3)
    {
        context.NotNull(nameof(context));
        Argument.Range(retryCount > 0, $"{retryCount} must be greater than 0.", nameof(retryCount));

        return await context.SaveChangesAsync(
            async conflicts =>
            {
                foreach (DbEntityEntry tracking in conflicts)
                {
                    await tracking.RefreshAsync(refreshMode);
                }
            },
            retryCount);
    }

    public static async Task<int> SaveChangesAsync(
        this DbContext context, RefreshConflict refreshMode, RetryStrategy retryStrategy)
    {
        context.NotNull(nameof(context));
        retryStrategy.NotNull(nameof(retryStrategy));

        return await context.SaveChangesAsync(
            async conflicts =>
            {
                foreach (DbEntityEntry tracking in conflicts)
                {
                    await tracking.RefreshAsync(refreshMode);
                }
            },
            retryStrategy);
    }
}
```

Instead of calling the previously defined Refresh extension method to refresh the DbEntityEntry object, here a async method RefreshAsync is called to refresh asynchronously:
```
public static partial class DbEntutyEntryExtensions
{
    public static async Task<DbEntityEntry> RefreshAsync(this DbEntityEntry tracking, RefreshConflict refreshMode)
    {
        tracking.NotNull(nameof(tracking));

        switch (refreshMode)
        {
            case RefreshConflict.StoreWins:
                {
                    await tracking.ReloadAsync();
                    break;
                }
            case RefreshConflict.ClientWins:
                {
                    DbPropertyValues databaseValues = await tracking.GetDatabaseValuesAsync();
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
            case RefreshConflict.MergeClinetAndStore:
                {
                    DbPropertyValues databaseValues = await tracking.GetDatabaseValuesAsync();
                    if (databaseValues == null)
                    {
                        tracking.State = EntityState.Detached;
                    }
                    else
                    {
                        DbPropertyValues originalValues = tracking.OriginalValues.Clone();
                        tracking.OriginalValues.SetValues(databaseValues);
                        databaseValues.PropertyNames
                            .Where(property => !object.Equals(originalValues[property], databaseValues[property]))
                            .ForEach(property => tracking.Property(property).IsModified = false);
                    }
                    break;
                }
        }
        return tracking;
    }
}
```

Now concurrency conflict can be resolved automatically and asynchronously:
```
internal static async Task SaveChangesAsync()
{
    using (AdventureWorks adventureWorks1 = new AdventureWorks())
    using (AdventureWorks adventureWorks2 = new AdventureWorks())
    {
        const int id = 950;
        Product productCopy1 = await adventureWorks1.Products.FindAsync(id);
        Product productCopy2 = await adventureWorks2.Products.FindAsync(id);

        productCopy1.Name = nameof(adventureWorks1);
        productCopy1.ListPrice = 100;
        await adventureWorks1.SaveChangesAsync();

        productCopy2.Name = nameof(adventureWorks2);
        productCopy2.ProductSubcategoryID = 1;
        await adventureWorks2.SaveChangesAsync(RefreshConflict.MergeClinetAndStore);
    }
}
```