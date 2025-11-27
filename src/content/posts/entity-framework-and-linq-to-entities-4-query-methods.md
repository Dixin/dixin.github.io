---
title: "Entity Framework and LINQ to Entities (4) Query Methods"
published: 2016-05-31
description: "This part discusses how to query SQL database with the defined mapping classes. Entity Framework and LINQ to Entities supports most of the extension methods provided by Queryable class:"
image: ""
tags: [".NET", "C#", "Entity Framework", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## EF Core version of this article: [https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-4-query-methods](/posts/entity-framework-core-and-linq-to-entities-4-query-methods "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-4-query-methods")

This part discusses how to query SQL database with the defined mapping classes. Entity Framework and LINQ to Entities supports most of the extension methods provided by Queryable class:

1.  Return a new IQueryable<T> source:

-   Generation: DefaultIfEmpty
-   Filtering (restriction): Where, OfType
-   Mapping (projection): Select
-   Grouping: GroupBy
-   Join: Join, GroupJoin, SelectMany, Select
-   Apply: GroupBy, GroupJoin, Select
-   Concatenation: Concat
-   Set: Distinct, GroupBy, Union, Intersect, Except
-   Convolution: ~Zip~
-   Partitioning: Take, Skip, ~TakeWhile~, ~SkipWhile~
-   Ordering: OrderBy, ThenBy, OrderByDescending, ThenByDescending, ~Reverse~
-   Conversion: Cast, AsQueryable

3.  Return a single value:
    -   Element: First, FirstOrDefault, ~Last~, ~LastOrDefault~, ~ElementAt~, ~ElementAtOrDefault~, Single, SingleOrDefault
    -   Aggregation: ~Aggregate~, Count, LongCount, Min, Max, Sum, Average
    -   Quantifier: All, Any, Contains
    -   Equality: ~SequenceEqual~

If a Queryable method has no proper target SQL translation, this method is not supported by LINQ to Entities. Query with such a methods will result NotSupportedException. In above list:

-   The crossed methods are not supported ([the list in MDSN](https://msdn.microsoft.com/en-us/library/bb738550.aspx) is not up to date), because there is no general translation to SQL, e.g. SQL database has no built-in Zip operation, etc..
-   The underlined methods have some overloads not supported:

-   For GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except, Contains, the overloads with IEqualityComparer<T> parameter are not supported, because apparently IEqualityComparer<T> has no equivalent SQL translation
-   For OrderBy, ThenBy, OrderByDescending, ThenByDescending, the overloads with IComparer<T> parameter are not supported
-   For Where, Select, SelectMany, the indexed overloads are not supported

In this part, all the LINQ to Entities queries will be demonstrated with query methods. All kinds of LINQ queries share the same query expression pattern, which has been discussed in detail in the LINQ to Objects chapter. Here query expressions will only be demonstrated for join queries, where they may be more intuitive than query methods.

Here, to make the code shorter, one database object will be reused for all the queries:

```csharp
internal static partial class QueryMethods
{
    private static readonly AdventureWorks AdventureWorks = new AdventureWorks();
}
```

In reality, a DbContext object should always be constructed and disposed for each [unit of work](http://martinfowler.com/eaaCatalog/unitOfWork.html).

## Return a new IQueryable<T> source

Just like all the other kinds of LINQ, LINQ to Entities implements deferred execution for these query methods. The SQL query is translated and executed only when the values are pulled from IQueryable<T>.

### Generation

As fore mentioned, DefaultIfEmpty is the only generation method provided:

```csharp
internal static void DefaultIfEmpty()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.DefaultIfEmpty(); // Define query.
    categories.ForEach(category => Trace.WriteLine(category?.Name)); // Execute query.
}
```

When ForEach is called, the query is translated to SQL and executed:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM   ( SELECT 1 AS X ) AS [SingleRowTable1]
    LEFT OUTER JOIN [Production].[ProductCategory] AS [Extent1] ON 1 = 1
```

The OUTER JOIN ON 1 = 1 from a single row table guarantees that the SQL query result has at least 1 row. If the right table of JOIN has rows, the JOIN results is the rows; otherwise, the JOIN result will be 1 row, where each column is NULL.

The other DefaultIfEmpty overload accepts a specified default value:

```csharp
internal static void DefaultIfEmptyWithPrimitive()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<int> categories = source
        .Select(category => category.ProductCategoryID)
        .DefaultIfEmpty(-1); // Define query.
    categories.ForEach(category => Trace.WriteLine(category)); // Execute query.
}
```

The translation checks if the JOIN result is NULL. If so, the specified default value –1 is used:

```sql
SELECT 
    CASE WHEN ([Project1].[C1] IS NULL) THEN -1 ELSE [Project1].[ProductCategoryID] END AS [C1]
    FROM   ( SELECT 1 AS X ) AS [SingleRowTable1]
    LEFT OUTER JOIN  (SELECT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        cast(1 as tinyint) AS [C1]
        FROM [Production].[ProductCategory] AS [Extent1] ) AS [Project1] ON 1 = 1
```

This overload and its translation works for a single column. It throws NotSupportedException for entity type:

```csharp
internal static void DefaultIfEmptyWithEntity()
{
    ProductCategory defaultCategory = new ProductCategory();
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.DefaultIfEmpty(defaultCategory); // Define query.
    categories.ForEach(category => Trace.WriteLine(category?.Name)); // Execute query.
    // NotSupportedException: Unable to create a constant value of type 'Dixin.Linq.EntityFramework.ProductCategory'. Only primitive types or enumeration types are supported in this context.
}
```

DefaultIfEmpty can also be used to implement outer join, which will be discussed soon.

### Filtering (restriction)

Entity Framework translates Queryable.Where to SQL WHERE clause. And the predicate expression tree (again, not predicate function in Enumerable.Where) is translated to the condition in WHERE clause

```csharp
internal static void Where()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.Where(category => category.ProductCategoryID > 0); // Define query.
    categories.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
}
```
```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE [Extent1].[ProductCategoryID] > 0
```

The C# || operator in the predicate expression tree is translated to SQL OR operator in WHERE clause:

```csharp
internal static void WhereWithOr()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.Where(category =>
        category.ProductCategoryID <= 1 || category.ProductCategoryID >= 4); // Define query.
    categories.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
}
```
```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE ([Extent1].[ProductCategoryID] <= 1) OR ([Extent1].[ProductCategoryID] >= 4)
```

The C# && operator is translated to SQL AND operator. Also, multiple Where calls are translated to one single WHERE clause with AND too

```csharp
internal static void WhereWithAnd()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.Where(category =>
        category.ProductCategoryID > 0 && category.ProductCategoryID < 5); // Define query.
    categories.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
}

internal static void WhereAndWhere()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source
        .Where(category => category.ProductCategoryID > 0)
        .Where(category => category.ProductCategoryID < 5); // Define query.
    categories.ForEach(category => Trace.WriteLine(category.Name)); // Execute query.
}
```

These 2 LINQ to Entities queries are translated to identical SQL queries:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name]
    FROM [Production].[ProductCategory] AS [Extent1]
    WHERE ([Extent1].[ProductCategoryID] > 0) AND ([Extent1].[ProductCategoryID] < 5)
```

The other filtering method, OfType, is equivalent to Where with is operator:

```csharp
internal static void WhereWithIs()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<Product> products = source.Where(product => product is UniversalProduct); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.GetType().Name}")); // Execute query.
    // NotSupportedException: Method 'Boolean IsNullOrEmpty(System.String)' has no supported translation to SQL.
}

internal static void OfTypeWithEntiy()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<UniversalProduct> products = source.OfType<UniversalProduct>(); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.GetType().Name}")); // Execute query.
}
```

The Where and OfType queries are both translated to WHERE:

```sql
SELECT 
    '0X0X' AS [C1], 
    [Extent1].[ProductID] AS [ProductID], 
    [Extent1].[RowVersion] AS [RowVersion], 
    [Extent1].[Name] AS [Name], 
    [Extent1].[ListPrice] AS [ListPrice], 
    [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID]
    FROM [Production].[Product] AS [Extent1]
    WHERE [Extent1].[Style] = N'U'
```

OfType works for entity type. It throws NotSupportedException for primitive type representing a single column:

```csharp
internal static void OfTypeWithPromitive()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<int> products = source.Select(p => p.ProductID).OfType<int>(); // Define query.
    products.ForEach(product => Trace.WriteLine(product)); // Execute query.
    // NotSupportedException: 'System.Int32' is not a valid metadata type for type filtering operations. Type filtering is only valid on entity types and complex types.
}
```

### Mapping (projection)

In above queries, Queryable.Select is not called, so the translated SELECT clause contains all the mapped columns to construct the entity objects; if Select is called, the selector expression tree is translated to specified columns in SELECT clause. For example:

```csharp
internal static void Select()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<string> categories = source.Select(category => 
        category.Name + category.Name); // Define query.
    categories.ForEach(category => Trace.WriteLine(category)); // Execute query.
}

internal static void SelectWithStringConcat()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    IQueryable<string> categories = source.Select(category =>
        string.Concat(category.Name, category.Name)); // Define query.
    categories.ForEach(category => Trace.WriteLine(category)); // Execute query.
}
```

These 2 queries are semantically equivalent. The C# + operator and string.Concat method are both translated to SQL + operator:

```sql
SELECT 
    [Extent1].[Name] + [Extent1].[Name] AS [C1]
    FROM [Production].[ProductCategory] AS [Extent1]
```

Select supports Anonymous type:

```csharp
internal static void SelectAnonymousType()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source.Select(product =>
        new { Name = product.Name, IsExpensive = product.ListPrice > 1000, Constant = 1 }); // Define query.
    products.ForEach(product => Trace.WriteLine(product.Name)); // Execute query.
}
```

It is translated to:

```sql
SELECT 
    1 AS [C1], 
    [Extent1].[Name] AS [Name], 
    CASE 
        WHEN ([Extent1].[ListPrice] > cast(1000 as decimal(18))) THEN cast(1 as bit) 
        WHEN ( NOT ([Extent1].[ListPrice] > cast(1000 as decimal(18)))) THEN cast(0 as bit) 
    END AS [C2]
    FROM [Production].[Product] AS [Extent1]
```

### Grouping

The following is a simple GroupBy example, :

```csharp
internal static void GroupBy()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    IQueryable<IGrouping<int, string>> groups = source.GroupBy(
        subcategory => subcategory.ProductCategoryID,
        subcategory => subcategory.Name); // Define query.
    groups.ForEach(group => Trace.WriteLine($"{group.Key}: {string.Join(", ", group)}")); // Execute query.
}
```

Above GroupBy query is translated to LEFT OUTER JOIN instead of GROUP BY:

```sql
SELECT 
    [Project2].[ProductCategoryID] AS [ProductCategoryID], 
    [Project2].[C1] AS [C1], 
    [Project2].[Name] AS [Name]
    FROM ( SELECT 
        [Distinct1].[ProductCategoryID] AS [ProductCategoryID], 
        [Extent2].[Name] AS [Name], 
        CASE WHEN ([Extent2].[ProductCategoryID] IS NULL) THEN CAST(NULL AS int) ELSE 1 END AS [C1]
        FROM   (SELECT DISTINCT 
            [Extent1].[ProductCategoryID] AS [ProductCategoryID]
            FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
        LEFT OUTER JOIN [Production].[ProductSubcategory] AS [Extent2] ON [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
    )  AS [Project2]
    ORDER BY [Project2].[ProductCategoryID] ASC, [Project2].[C1] ASC
```

This is because above GroupBy returns hierarchical result (collection of groups, and each group is a collection of values), but SQL query can only result table of rows. So here is how it works:

-   The translated SQL has to first query all the keys with a SELECT DISTINCT query
-   Then it has the keys to LEFT OUTER JOIN all the rows. The join result is a table of all group key and group value pairs (ProductCategoryID and Name pairs)
-   Then it sorts all the group key and group value pairs by the group keys, to make sure in the final result, the values appears group by group.
-   Eventually Entity Framework transforms the SQL result table into .NET hierarchical data structure, a IQueryable<T> collection of IGrouping<T> collections.

To implement SQL GROUP BY query, just have the GroupBy query to return flattened result (collection of values). This can be done with a GroupBy overload accepting a resultSelector, or equivalently, an additional Select query:

```csharp
internal static void GroupByWithResultSelector()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    var groups = source.GroupBy(
        subcategory => subcategory.ProductCategoryID,
        subcategory => subcategory.Name,
        (key, group) => new { CategoryID = key, SubcategoryCount = group.Count() }); // Define query.
    groups.ForEach(group => Trace.WriteLine($"{group.CategoryID}: {group.SubcategoryCount}")); // Execute query.
}

internal static void GroupByAndSelect()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    var groups = source
        .GroupBy(
            subcategory => subcategory.ProductCategoryID,
            subcategory => subcategory.Name)
        .Select(group => new { CategoryID = group.Key, SubcategoryCount = group.Count() }); // Define query.
    groups.ForEach(group => Trace.WriteLine($"{group.CategoryID}: {group.SubcategoryCount}")); // Execute query.
}
```

Notice aggregate query method Count is called to flattening the result. These 2 queries are semantically equivalent. They are both translated to identical GROUP BY query:

```sql
SELECT 
    [GroupBy1].[K1] AS [ProductCategoryID], 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        [Extent1].[ProductCategoryID] AS [K1], 
        COUNT(1) AS [A1]
        FROM [Production].[ProductSubcategory] AS [Extent1]
        GROUP BY [Extent1].[ProductCategoryID]
    )  AS [GroupBy1]
```

SelectMany can also flatten hierarchical result:

```csharp
internal static void GroupByAndSelectMany()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    IQueryable<ProductSubcategory> distinct = source
        .GroupBy(subcategory => subcategory.ProductCategoryID)
        .SelectMany(group => group); // Define query.
    distinct.ForEach(subcategory => Trace.WriteLine(subcategory.Name)); // Execute query.
}
```

This time no aggregate method is called, so above query cannot be translated to GROUP BY. It is translated to INNER JOIN:

```sql
SELECT 
    [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Extent2].[Name] AS [Name], 
    [Extent2].[ProductCategoryID] AS [ProductCategoryID]
    FROM   (SELECT DISTINCT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
    INNER JOIN [Production].[ProductSubcategory] AS [Extent2] ON [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
```

GroupBy’s keySelector can return anonymous type to support multiple keys:

```csharp
internal static void GroupByMultipleKeys()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var groups = source.GroupBy(
        product => new { ProductSubcategoryID = product.ProductSubcategoryID, ListPrice = product.ListPrice },
        (key, group) => new
        {
            ProductSubcategoryID = key.ProductSubcategoryID,
            ListPrice = key.ListPrice,
            Count = group.Count()
        }); // Define query.
    groups.ForEach(group => Trace.WriteLine(
        $"{group.ProductSubcategoryID}, {group.ListPrice}: {group.Count}")); // Execute query.
}
```

The key’s properties are translated to keys in GROUP BY clause:

```sql
SELECT 
    1 AS [C1], 
    [GroupBy1].[K2] AS [ProductSubcategoryID], 
    [GroupBy1].[K1] AS [ListPrice], 
    [GroupBy1].[A1] AS [C2]
    FROM ( SELECT 
        [Extent1].[ListPrice] AS [K1], 
        [Extent1].[ProductSubcategoryID] AS [K2], 
        COUNT(1) AS [A1]
        FROM [Production].[Product] AS [Extent1]
        GROUP BY [Extent1].[ListPrice], [Extent1].[ProductSubcategoryID]
    )  AS [GroupBy1]
```

### Join

### Inner join

Besides above GroupBy, as discussed in the LINQ to Objects chapter, inner join can be done with Join and SelectMany. The following examples simply join the ProductSubcategory and ProductCategory entities with their ProductCategoryID properties:

```csharp
internal static void InnerJoinWithJoin()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories = outer.Join(
        inner,
        subcategory => subcategory.ProductCategoryID,
        category => category.ProductCategoryID,
        (subcategory, category) => new { Subcategory = subcategory.Name, Category = category.Name }); // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}

internal static void InnerJoinWithSelectMany()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories = outer
        .SelectMany(
            subcategory => inner,
            (subcategory, category) => new { Subcategory = subcategory, Category = category })
        .Where(crossJoinValue =>
            crossJoinValue.Subcategory.ProductCategoryID == crossJoinValue.Category.ProductCategoryID)
        .Select(crossJoinValue =>
            new { Subcategory = crossJoinValue.Subcategory.Name, Category = crossJoinValue.Category.Name }); // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}
```

And their query expression versions are similar:

```csharp
internal static void InnerJoinWithJoin()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories =
        from subcategory in outer
        join category in inner
        on subcategory.ProductCategoryID equals category.ProductCategoryID
        select new { Subcategory = subcategory.Name, Category = category.Name }; // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}

internal static void InnerJoinWithSelectMany()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories =
        from subcategory in outer
        from category in inner
        where subcategory.ProductCategoryID == category.ProductCategoryID
        select new { Subcategory = subcategory.Name, Category = category.Name }; // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}
```

Inner join can be translated from GroupJoin and Select too:

```csharp
internal static void InnerJoinWithGroupJoin()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories = outer
        .GroupJoin(
            inner,
            subcategory => subcategory.ProductCategoryID,
            category => category.ProductCategoryID,
            (subcategory, categories) => new { Subcategory = subcategory, Categories = categories })
        .SelectMany(
            subcategory => subcategory.Categories, // LEFT OUTER JOIN if DefaultIfEmpty is called.
            (subcategory, category) =>
                new { Subcategory = subcategory.Subcategory.Name, Category = category.Name }); // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}

internal static void InnerJoinWithSelect()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var categories = outer
        .Select(subcategory => new
        {
            Subcategory = subcategory,
            Categories = inner.Where(category => category.ProductCategoryID == subcategory.ProductCategoryID)
        })
        .SelectMany(
            subcategory => subcategory.Categories, // LEFT OUTER JOIN if DefaultIfEmpty is called.
            (subcategory, category) =>
                new { Subcategory = subcategory.Subcategory.Name, Category = category.Name }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {category.Subcategory}")); // Execute query.
}
```

Here GroupJoin and Select returns hierarchical result, collection of collections, so SelectMany is called to flatten it to collection of values. Their query expression versions are:

```csharp
internal static void InnerJoinWithGroupJoin()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories =
        from subcategory in outer
        join category in inner
        on subcategory.ProductCategoryID equals category.ProductCategoryID into categories
        from category in categories // LEFT OUTER JOIN if DefaultIfEmpty is called.
        select new { Subcategory = subcategory.Name, Category = category.Name }; // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}

internal static void InnerJoinWithSelect()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var categories =
        from subcategory in outer
        select new
        {
            Subcategory = subcategory,
            Categories = from category in inner
                         where category.ProductCategoryID == subcategory.ProductCategoryID
                         select category
        } into subcategory
        from category in subcategory.Categories // LEFT OUTER JOIN if DefaultIfEmpty is called.
        select new { Subcategory = subcategory.Subcategory.Name, Category = category.Name }; // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {category.Subcategory}")); // Execute query.
}
```

Here the ProductCategory and ProductSubCategory entities are associated, also inner join can be implemented by the navigation property:

```csharp
internal static void InnerJoinWithAssociation()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    var subcategories = outer.Select(subcategory =>
        new { Subcategory = subcategory.Name, Category = subcategory.ProductCategory.Name }); // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}
```

All the above queries are translated to the same INNER JOIN query:

```sql
SELECT 
    [Extent2].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent2].[Name] AS [Name1]
    FROM  [Production].[ProductSubcategory] AS [Extent1]
    INNER JOIN [Production].[ProductCategory] AS [Extent2] ON [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
```

Apparently, navigation property is the easiest way for join query, as long as the entities are associated. The following example inner joins 3 entities, Product, ProductProductPhoto, ProductPhoto:

```csharp
internal static void MultipleInnerJoinsWithAssociations()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source.SelectMany(
        product => product.ProductProductPhotos,
        (product, productProductPhoto) => new
        {
            Product = product.Name,
            Photo = productProductPhoto.ProductPhoto.LargePhotoFileName
        }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Product}: {product.Photo}")); // Execute query.
}
```

It is translated to multiple INNER JOINs:

```sql
SELECT 
    [Extent1].[ProductID] AS [ProductID], 
    [Extent1].[Name] AS [Name], 
    [Extent3].[LargePhotoFileName] AS [LargePhotoFileName]
    FROM   [Production].[Product] AS [Extent1]
    INNER JOIN [Production].[ProductProductPhoto] AS [Extent2] ON [Extent1].[ProductID] = [Extent2].[ProductID]
    INNER JOIN [Production].[ProductPhoto] AS [Extent3] ON [Extent2].[ProductPhotoID] = [Extent3].[ProductPhotoID]
```

If above query is implemented by Join with keys, or by SelectMany with keys, then multiple Join or SelectMany calls are needed.

Just like LINQ to Objects, to join with multiple keys, have the outerKeySelector and innerKeySelector return anonymous type. The following example joins the ProductSubcategory and ProductCategory entities with their ProductCategoryID properties, and their Name properties:

```csharp
internal static void InnerJoinWithMultipleKeys()
{
    IQueryable<ProductSubcategory> outer = AdventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> inner = AdventureWorks.ProductCategories;
    var subcategories = outer.Join(
        inner,
        subcategory =>
            new { ProductCategoryID = subcategory.ProductCategoryID, Name = subcategory.Name },
        category =>
            new { ProductCategoryID = category.ProductCategoryID, Name = category.Name },
        (subcategory, category) => new { Subcategory = subcategory.Name, Category = category.Name }); // Define query.
    subcategories.ForEach(subcategory => Trace.WriteLine($"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}
```

The anonymous type’s properties is translated to keys of join:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent2].[Name] AS [Name1]
    FROM  [Production].[ProductSubcategory] AS [Extent1]
    INNER JOIN [Production].[ProductCategory] AS [Extent2] ON ([Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID]) AND ([Extent1].[Name] = [Extent2].[Name]
```

### Left outer join

Left outer join can be done with GroupJoin and Select. The following examples joins ProductCategory and ProductSubcategory entities with their ProductCategoryID properties:

```csharp
internal static void LeftOuterJoinWithGroupJoin()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories = outer.GroupJoin(
        inner,
        category => category.ProductCategoryID,
        subcategory => subcategory.ProductCategoryID,
        (category, subcategories) => new
        {
            Category = category.Name,
            Subcategories = subcategories.Select(subcategory => subcategory.Name)
        }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {string.Join(", ", category.Subcategories)}")); // Execute query.
}

internal static void LeftOuterJoinWithSelect()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories = outer
        .Select(category => new
        {
            Category = category.Name,
            Subcategories = inner
                .Where(subcategory => subcategory.ProductCategoryID == category.ProductCategoryID)
                .Select(subcategory => subcategory.Name)
        }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {string.Join(", ", category.Subcategories)}")); // Execute query.
}
```

Their query expression versions are:

```csharp
internal static void LeftOuterJoinWithGroupJoin()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories =
        from category in outer
        join subcategory in inner
        on category.ProductCategoryID equals subcategory.ProductCategoryID into subcategories
        select new
        {
            Category = category.Name,
            Subcategories = subcategories.Select(subcategory => subcategory.Name)
        }; // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {string.Join(", ", category.Subcategories)}")); // Execute query.
}

internal static void LeftOuterJoinWithSelect()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories =
        from category in outer
        select new
        {
            Category = category,
            Subcategories = from subcategory in inner
                            where subcategory.ProductCategoryID == category.ProductCategoryID
                            select subcategory
        }; // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {string.Join(", ", category.Subcategories)}")); // Execute query.
}
```

Above GroupJoin and Select returns hierarchical result, so they are both translated to the same pattern as the first GroupBy example above:

```sql
SELECT 
    [Project1].[ProductCategoryID] AS [ProductCategoryID], 
    [Project1].[Name] AS [Name], 
    [Project1].[C1] AS [C1], 
    [Project1].[Name1] AS [Name1]
    FROM ( SELECT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        [Extent1].[Name] AS [Name], 
        [Extent2].[Name] AS [Name1], 
        CASE WHEN ([Extent2].[ProductCategoryID] IS NULL) THEN CAST(NULL AS int) ELSE 1 END AS [C1]
        FROM  [Production].[ProductCategory] AS [Extent1]
        LEFT OUTER JOIN [Production].[ProductSubcategory] AS [Extent2] ON [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
    )  AS [Project1]
    ORDER BY [Project1].[ProductCategoryID] ASC, [Project1].[C1] ASC
```

To implement a simple left outer join query, just call SelectMany to flatten the hierarchical result:

```csharp
internal static void LeftOuterJoinWithGroupJoinAndSelectMany()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories = outer
        .GroupJoin(
            inner,
            category => category.ProductCategoryID,
            subcategory => subcategory.ProductCategoryID,
            (category, subcategories) => new { Category = category, Subcategories = subcategories })
        .SelectMany
            (category => category.Subcategories.DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
            (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {category.Subcategory}")); // Execute query.
}

internal static void LeftOuterJoinWithSelectAndSelectMany()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories = outer
        .Select(category => new
        {
            Category = category,
            Subcategories = inner
                .Where(subcategory => subcategory.ProductCategoryID == category.ProductCategoryID)
        })
        .SelectMany(
            category => category.Subcategories.DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
            (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {category.Subcategory}")); // Execute query.
}
```

Notice DefaultIfEmpty must be called in SelectMany, otherwise the queries become inner join. And their query expression versions are:

```csharp
internal static void LeftOuterJoinWithGroupJoinAndSelectMany()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories =
        from category in outer
        join subcategory in inner
        on category.ProductCategoryID equals subcategory.ProductCategoryID into subcategories
        from subcategory in subcategories.DefaultIfEmpty() // INNER JOIN if DefaultIfEmpty is missing.
        select new { Category = category.Name, Subcategory = subcategory.Name }; // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {category.Subcategory}")); // Execute query.
}

internal static void LeftOuterJoinWithSelectAndSelectMany()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories =
        from category in outer
        select new
        {
            Category = category,
            Subcategories = from subcategory in inner
                            where subcategory.ProductCategoryID == category.ProductCategoryID
                            select subcategory
        } into category
        from subcategory in category.Subcategories.DefaultIfEmpty() // INNER JOIN if DefaultIfEmpty is missing.
        select new { Category = category.Category.Name, Subcategory = subcategory.Name }; // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category}: {category.Subcategory}")); // Execute query.
}
```

Similar to inner join, left outer join can be done with entities association too:

```csharp
internal static void LeftOuterJoinWithAssociation()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    var categories = source.SelectMany(
        category => category.ProductSubcategories.DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
        (category, subcategory) =>
            new { Category = category.Name, Subcategory = subcategory.Name }); // Define query.
    categories.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.Category}: {subcategory.Subcategory}")); // Execute query.
}
```

Again, DefaultIfEmpty must be called in SelectMany, otherwise the query become inner join. The above flattened left outer join queries are translated to identical LEFT OUTER JOIN:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name], 
    [Extent2].[Name] AS [Name1]
    FROM  [Production].[ProductCategory] AS [Extent1]
    LEFT OUTER JOIN [Production].[ProductSubcategory] AS [Extent2] ON [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
```

### Cross join

Just like LINQ to Objects, cross join can be done with SelectMany and Join. The following examples query the expensive products (list price greater than 2000) and cheap products (list price less than 100), and then cross join them to get all possible product bundles, where each bundle has one expensive product and one cheap product:

```csharp
internal static void CrossJoinWithSelectMany()
{
    IQueryable<Product> outer = AdventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<Product> inner = AdventureWorks.Products.Where(product => product.ListPrice < 100);
    var bundles = outer.SelectMany(
        outerProduct => inner,
        (outerProduct, innerProduct) =>
            new { Expensive = outerProduct.Name, Cheap = innerProduct.Name }); // Define query.
    bundles.ForEach(bundle => Trace.WriteLine($"{bundle.Expensive}: {bundle.Cheap}")); // Execute query.
}

internal static void CrossJoinWithJoin()
{
    IQueryable<Product> outer = AdventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<Product> inner = AdventureWorks.Products.Where(product => product.ListPrice < 100);
    var bundles = outer.Join(
        inner,
        product => true,
        product => true,
        (outerProduct, innerProduct) =>
            new { Expensive = outerProduct.Name, Cheap = innerProduct.Name }); // Define query.
    bundles.ForEach(bundle => Trace.WriteLine($"{bundle.Expensive}: {bundle.Cheap}")); // Execute query.
}
```

Their query expression versions are similar:

```csharp
internal static void CrossJoinWithSelectMany()
{
    IQueryable<Product> outer = AdventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<Product> inner = AdventureWorks.Products.Where(product => product.ListPrice < 100);
    var bundles =
        from outerProduct in outer
        from innerProduct in inner
        // where true == true
        select new { Expensive = outerProduct.Name, Cheap = innerProduct.Name }; // Define query.
    bundles.ForEach(bundle => Trace.WriteLine($"{bundle.Expensive}: {bundle.Cheap}")); // Execute query.
}

internal static void CrossJoinWithJoin()
{
    IQueryable<Product> outer = AdventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<Product> inner = AdventureWorks.Products.Where(product => product.ListPrice < 100);
    var bundles =
        from outerProduct in outer
        join innerProduct in inner
        on true equals true
        select new { Expensive = outerProduct.Name, Cheap = innerProduct.Name }; // Define query.
    bundles.ForEach(bundle => Trace.WriteLine($"{bundle.Expensive}: {bundle.Cheap}")); // Execute query.
}
```

Above SelectMany is translated to CROSS JOIN, and Join is translated to INNER JOIN:

```sql
SELECT 
    1 AS [C1], 
    [Extent1].[Name] AS [Name], 
    [Extent2].[Name] AS [Name1]
    FROM  [Production].[Product] AS [Extent1]
    CROSS JOIN [Production].[Product] AS [Extent2]
    WHERE ([Extent1].[ListPrice] > cast(2000 as decimal(18))) AND ([Extent2].[ListPrice] < cast(100 as decimal(18)))

SELECT 
    1 AS [C1], 
    [Extent1].[Name] AS [Name], 
    [Extent2].[Name] AS [Name1]
    FROM  [Production].[Product] AS [Extent1]
    INNER JOIN [Production].[Product] AS [Extent2] ON 1 = 1
    WHERE ([Extent1].[ListPrice] > cast(2000 as decimal(18))) AND ([Extent2].[ListPrice] < cast(100 as decimal(18)))
```

These 2 SQL queries are equivalent. They have the same query plan.

### Self join

Entities can join with themselves. The following example joins the Products data source with Products data source with ListPrice, to query each product’s same price products.

```csharp
internal static void SelfJoin()
{
    IQueryable<Product> outer = AdventureWorks.Products;
    IQueryable<Product> inner = AdventureWorks.Products;
    var products = outer.GroupJoin(
        inner,
        product => product.ListPrice,
        product => product.ListPrice,
        (product, samePriceProducts) => new
        {
            Name = product.Name,
            ListPrice = product.ListPrice,
            SamePriceProducts = samePriceProducts
                .Where(samePriceProduct => samePriceProduct.ProductID != product.ProductID)
                .Select(samePriceProduct => samePriceProduct.Name)
        }); // Define query.
    products.ForEach(product => Trace.WriteLine(
        $"{product.Name} ({product.ListPrice}): {string.Join(", ", product.SamePriceProducts)}")); // Execute query.
}
```

The the query expression version is:

```csharp
internal static void SelfJoin()
{
    IQueryable<Product> outer = AdventureWorks.Products;
    IQueryable<Product> inner = AdventureWorks.Products;
    var products =
        from outerProduct in outer
        join innerProduct in inner
        on outerProduct.ListPrice equals innerProduct.ListPrice into samePriceProducts
        select new
        {
            Name = outerProduct.Name,
            ListPrice = outerProduct.ListPrice,
            SamePriceProducts = from samePriceProduct in samePriceProducts
                                where samePriceProduct.ProductID != outerProduct.ProductID
                                select samePriceProduct.Name
        }; // Define query.
    products.ForEach(product => Trace.WriteLine(
        $"{product.Name} ({product.ListPrice}): {string.Join(", ", product.SamePriceProducts)}")); // Execute query.
}
```

They are translated to self join:

```sql
SELECT 
    [Project1].[ProductID] AS [ProductID], 
    [Project1].[Name] AS [Name], 
    [Project1].[ListPrice] AS [ListPrice], 
    [Project1].[C1] AS [C1], 
    [Project1].[Name1] AS [Name1]
    FROM ( SELECT 
        [Extent1].[ProductID] AS [ProductID], 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        [Extent2].[Name] AS [Name1], 
        CASE WHEN ([Extent2].[ProductID] IS NULL) THEN CAST(NULL AS int) ELSE 1 END AS [C1]
        FROM  [Production].[Product] AS [Extent1]
        LEFT OUTER JOIN [Production].[Product] AS [Extent2] ON ([Extent1].[ListPrice] = [Extent2].[ListPrice]) AND ([Extent2].[ProductID] <> [Extent1].[ProductID])
    )  AS [Project1]
    ORDER BY [Project1].[ProductID] ASC, [Project1].[C1] ASC
```

Again, the translated SQL contains this ORDER BY query, because GroupJoin returns hierarchical result

### Apply

In SQL, APPLY matches each left table row with all rows in the right table. CROSS APPLY is similar to INNER JOIN, each row in left table will be in the result if there is any matching row in the right table; and OUTER APPLY is similar to OUTER JOIN, each row of the left table will be in the result no mater it has a match or not. For example:

```sql
SELECT [Left].[Count], [Right].[Value] FROM
    (SELECT [Count]
        FROM (VALUES (0), (1), (2), (3)) [0 to 4]([Count])) AS [Left]
    CROSS APPLY 
    (SELECT top ([Count]) [Value]
        FROM (VALUES (N'a'), (N'b'), (N'c'), (N'd')) [0 to 4]([Value])) AS [Right];
```

Here the left table is a table of numbers, the right table is a table of Unicode character strings. Each number will be matched to that number of strings, so the result is:

<table><tbody><tr><td width="100">Count</td><td width="100">Value</td></tr><tr><td width="100">1</td><td width="100">a</td></tr><tr><td width="100">2</td><td width="100">a</td></tr><tr><td width="100">2</td><td width="100">b</td></tr><tr><td width="100">3</td><td width="100">a</td></tr><tr><td width="100">3</td><td width="100">b</td></tr><tr><td width="100">3</td><td width="100">c</td></tr></tbody></table>

0 matches 0 strings, so 0 is not in the CROSS APPLY result. It will be in the OUTER APPLY result:

```sql
SELECT [Left].[Count], [Right].[Value] FROM
    (SELECT [Count]
        FROM (VALUES (0), (1), (2), (3)) [0 to 4]([Count])) AS [Left]
    OUTER APPLY 
    (SELECT top ([Count]) [Value]
        FROM (VALUES (N'a'), (N'b'), (N'c'), (N'd')) [0 to 4]([Value])) AS [Right];
```

<table><tbody><tr><td width="100">Count</td><td width="100">Value</td></tr><tr><td width="100">0</td><td width="100">NULL</td></tr><tr><td width="100">1</td><td width="100">a</td></tr><tr><td width="100">2</td><td width="100">a</td></tr><tr><td width="100">2</td><td width="100">b</td></tr><tr><td width="100">3</td><td width="100">a</td></tr><tr><td width="100">3</td><td width="100">b</td></tr><tr><td width="100">3</td><td width="100">c</td></tr></tbody></table>

### Cross apply

In LINQ to Entities queries, SelectMany can flatten hierarchical data, for example, hierarchical result from GroupBy:

```csharp
internal static void CrossApplyWithGroupByAndTake()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    var categories = source
        .GroupBy(subcategory => subcategory.ProductCategoryID)
        .SelectMany(
            group => group.Take(1),
            (group, subcategory) =>
                new { ProductCategoryID = group.Key, FirstSubcategory = subcategory }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.ProductCategoryID}: {category.FirstSubcategory?.Name}")); // Execute query.
}
```

Here Take is called when flattening the hierarchical result. Logically, if a group is not empty, there will be 1 row for this group in the query result; and a group is empty, there will not be a row for this group in the query result. so above query is translated to CROSS APPLY:

```sql
SELECT 
    [Distinct1].[ProductCategoryID] AS [ProductCategoryID], 
    [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Limit1].[Name] AS [Name], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID1]
    FROM   (SELECT DISTINCT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
    CROSS APPLY  (SELECT TOP (1) 
        [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [Extent2].[Name] AS [Name], 
        [Extent2].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent2]
        WHERE [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID] ) AS [Limit1]
```

As fore mentioned, GroupJoin and one-to-many association can produce hierarchical data, which then can be flattened by SelectMany:

```csharp
internal static void CrossApplyWithGroupJoinAndTake()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories = outer
        .GroupJoin(
            inner,
            category => category.ProductCategoryID,
            subcategory => subcategory.ProductCategoryID,
            (category, subcategories) => new { Category = category, Subcategories = subcategories })
        .SelectMany(
            category => category.Subcategories.Take(1),
            (category, subcategory) =>
                new { Category = category.Category, FirstSubcategory = subcategory }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category.Name}: {category.FirstSubcategory?.Name}")); // Execute query.
}

internal static void CrossApplyWithAssociationAndTake()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    var categories = source
        .Select(category => new { Category = category, Subcategories = category.ProductSubcategories })
        .SelectMany(
            category => category.Subcategories.Take(1),
            (category, subcategory) =>
                new { Category = category.Category, FirstSubcategory = subcategory }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category.Name}: {category.FirstSubcategory?.Name}")); // Execute query.
}
```

They are semantically equivalent. They will be translated to CROSS APPLY too, because of Take:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name], 
    [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Limit1].[Name] AS [Name1], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID1]
    FROM  [Production].[ProductCategory] AS [Extent1]
    CROSS APPLY  (SELECT TOP (1) 
        [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [Extent2].[Name] AS [Name], 
        [Extent2].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent2]
        WHERE [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID] ) AS [Limit1]
```

### Outer apply

FirstOrDefault accepts a IQueryable<T> data source and returns a single value, so it can be used to flatten hierarchical data too. again, take GroupBy as example:

```csharp
internal static void OuterApplyWithGroupByAndFirstOrDefault()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    var categories = source.GroupBy(
        subcategory => subcategory.ProductCategoryID,
        (key, group) => new { ProductCategoryID = key, FirstSubcategory = group.FirstOrDefault() }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.ProductCategoryID}: {category.FirstSubcategory?.Name}")); // Execute query.
}
```

The different from Take is, no matter the group is empty or not, there is always 1 row for this group in the query result. So above query it translated to OUTER APPLY:

```sql
SELECT 
    [Distinct1].[ProductCategoryID] AS [ProductCategoryID], 
    [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Limit1].[Name] AS [Name], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID1]
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

Similarly, when FirstOrDefault is called in GroupJoin or one-to-many association:

```csharp
internal static void OuterApplyWithGroupJoinAndFirstOrDefault()
{
    IQueryable<ProductCategory> outer = AdventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = AdventureWorks.ProductSubcategories;
    var categories = outer.GroupJoin(
        inner,
        category => category.ProductCategoryID,
        subcategory => subcategory.ProductCategoryID,
        (category, subcategories) => 
            new { Category = category, FirstSubcategory = subcategories.FirstOrDefault() }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category.Name}: {category.FirstSubcategory?.Name}")); // Execute query.
}

internal static void OuterApplyWithAssociationAndFirstOrDefault()
{
    IQueryable<ProductCategory> source = AdventureWorks.ProductCategories;
    var categories = source.Select(category => new
    {
        Category = category,
        FirstSubcategory = category.ProductSubcategories.FirstOrDefault()
    }); // Define query.
    categories.ForEach(category => Trace.WriteLine(
        $"{category.Category.Name}: {category.FirstSubcategory?.Name}")); // Execute query.
}
```

the translation is OUTER APPLY too:

```sql
SELECT 
    [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
    [Extent1].[Name] AS [Name], 
    [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID], 
    [Limit1].[Name] AS [Name1], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID1]
    FROM  [Production].[ProductCategory] AS [Extent1]
    OUTER APPLY  (SELECT TOP (1) 
        [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
        [Extent2].[Name] AS [Name], 
        [Extent2].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent2]
        WHERE [Extent1].[ProductCategoryID] = [Extent2].[ProductCategoryID] ) AS [Limit1]
```

### Concatenation

The following example concatenates the cheap products’ names with the expensive products’ names:

```csharp
internal static void Concat()
{
    IQueryable<string> first = AdventureWorks.Products
        .Where(product => product.ListPrice < 100)
        .Select(product => product.Name);
    IQueryable<string> second = AdventureWorks.Products
        .Where(product => product.ListPrice > 2000)
        .Select(product => product.Name);
    IQueryable<string> concat = first.Concat(second); // Define query.
    concat.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

Here Select is called before Concat. It is equivalent to call Select after Concat:

```csharp
internal static void ConcatWithSelect()
{
    IQueryable<Product> first = AdventureWorks.Products.Where(product => product.ListPrice < 100);
    IQueryable<Product> second = AdventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<string> concat = first
        .Concat(second)
        .Select(product => product.Name); // Define query.
    concat.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

They are both translate to identical UNION ALL query:

```sql
SELECT 
    [UnionAll1].[Name] AS [C1]
    FROM  (SELECT 
        [Extent1].[Name] AS [Name]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] < cast(100 as decimal(18))
    UNION ALL
        SELECT 
        [Extent2].[Name] AS [Name]
        FROM [Production].[Product] AS [Extent2]
        WHERE [Extent2].[ListPrice] > cast(2000 as decimal(18))) AS [UnionAll1]
```

### Set

The following example queries the subcategories for the distinct ProductCategoryIDs:

```csharp
internal static void Distinct()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    IQueryable<int> distinct = source
        .Select(subcategory => subcategory.ProductCategoryID)
        .Distinct(); // Define query.
    distinct.ForEach(value => Trace.WriteLine(value)); // Execute query.
}
```

Also, as fore mentioned, GroupBy can also query distinct group keys:

```csharp
internal static void DistinctWithGroupBy()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    IQueryable<int> distinct = source.GroupBy(
        subcategory => subcategory.ProductCategoryID,
        (key, group) => key); // Define query.
    distinct.ForEach(value => Trace.WriteLine(value)); // Execute query.
}
```

Here Distinct and GroupBy are translated to identical SELECT DISTINCT query:

```sql
SELECT 
    [Distinct1].[ProductCategoryID] AS [ProductCategoryID]
    FROM ( SELECT DISTINCT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent1]
    )  AS [Distinct1]
```

To query distinct multiple keys, use anonymous type:

```csharp
internal static void DistinctMultipleKeys()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    var distinct = source
        .Select(subcategory => 
            new { ProductCategoryID = subcategory.ProductCategoryID, Name = subcategory.Name })
        .Distinct(); // Define query.
    distinct.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.ProductCategoryID}: {subcategory.Name}")); // Execute query.
}

internal static void DistinctWithGroupByMultipleKeys()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    var distinct = source.GroupBy(
        subcategory => new { ProductCategoryID = subcategory.ProductCategoryID, Name = subcategory.Name },
        (key, group) => key); // Define query.
    distinct.ForEach(subcategory => Trace.WriteLine(
        $"{subcategory.ProductCategoryID}: {subcategory.Name}")); // Execute query.
}
```

The anonymous type’s properties are translated into the SELECT DISTINCT clause:

```sql
SELECT 
    [Distinct1].[C1] AS [C1], 
    [Distinct1].[ProductCategoryID] AS [ProductCategoryID], 
    [Distinct1].[Name] AS [Name]
    FROM ( SELECT DISTINCT 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
        1 AS [C1]
        FROM [Production].[ProductSubcategory] AS [Extent1]
    )  AS [Distinct1]
```

GroupBy can also be used for more complex scenarios, for example, query the complete entities with certain distinct properties. Please see above APPLY examples.

The following example queries subcategories’ Names, where they have distinct ProductCategoryIDs:

```csharp
internal static void DistinctWithGroupByAndFirstOrDefault()
{
    IQueryable<ProductSubcategory> source = AdventureWorks.ProductSubcategories;
    IQueryable<string> distinct = source.GroupBy(
        subcategory => subcategory.ProductCategoryID,
        (key, group) => group.Select(subcategory => subcategory.Name).FirstOrDefault()); // Define query.
    distinct.ForEach(subcategory => Trace.WriteLine(subcategory)); // Execute query.
}
```

It is translated to:

```sql
SELECT 
    (SELECT TOP (1) 
        [Extent2].[Name] AS [Name]
        FROM [Production].[ProductSubcategory] AS [Extent2]
        WHERE [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID]) AS [C1]
    FROM ( SELECT DISTINCT 
        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
        FROM [Production].[ProductSubcategory] AS [Extent1]
    )  AS [Distinct1]
```

The other set query methods, Intersect and Except:

```csharp
internal static void Intersect()
{
    var first = AdventureWorks.Products
        .Where(product => product.ListPrice > 100)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
    var second = AdventureWorks.Products
        .Where(product => product.ListPrice < 2000)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
    var intersect = first.Intersect(second); // Define query.
    intersect.ForEach(product => Trace.WriteLine(product)); // Execute query.
}

internal static void Except()
{
    var first = AdventureWorks.Products
        .Where(product => product.ListPrice > 100)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
    var second = AdventureWorks.Products
        .Where(product => product.ListPrice > 2000)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
    var except = first.Except(second); // Define query.
    except.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

are translated to INTERSECT and EXCEPT:

```sql
SELECT 
    [Intersect1].[C1] AS [C1], 
    [Intersect1].[Name] AS [C2], 
    [Intersect1].[ListPrice] AS [C3]
    FROM  (SELECT 
        1 AS [C1], 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] > cast(100 as decimal(18))
    INTERSECT
        SELECT 
        1 AS [C1], 
        [Extent2].[Name] AS [Name], 
        [Extent2].[ListPrice] AS [ListPrice]
        FROM [Production].[Product] AS [Extent2]
        WHERE [Extent2].[ListPrice] < cast(2000 as decimal(18))) AS [Intersect1]
    
SELECT 
    [Except1].[C1] AS [C1], 
    [Except1].[Name] AS [C2], 
    [Except1].[ListPrice] AS [C3]
    FROM  (SELECT 
        1 AS [C1], 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] > cast(100 as decimal(18))
    EXCEPT
        SELECT 
        1 AS [C1], 
        [Extent2].[Name] AS [Name], 
        [Extent2].[ListPrice] AS [ListPrice]
        FROM [Production].[Product] AS [Extent2]
        WHERE [Extent2].[ListPrice] > cast(2000 as decimal(18))) AS [Except1]
```

### Partitioning

Take cannot be used independently. OrderBy must be called before calling Skip. For example:

```csharp
internal static void OrderByAndSkip()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<string> products = source
        .OrderBy(product => product.Name)
        .Skip(10)
        .Select(product => product.Name); // Define query.
    products.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

Without OrderBy, Entity Framework throws NotSupportedException. The reason is, Skip is translated to OFFSET clause, and OFFSET requires ORDER BY:

```sql
SELECT 
    [Extent1].[Name] AS [Name]
    FROM [Production].[Product] AS [Extent1]
    ORDER BY [Extent1].[Name] ASC
    OFFSET 10 ROWS
```

When Take is called without calling Skip:

```csharp
internal static void Take()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<string> products = source
        .Take(10)
        .Select(product => product.Name); // Define query.
    products.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

it is translated to TOP:

```sql
SELECT TOP (10) 
    [c].[Name] AS [Name]
    FROM [Production].[Product] AS [c]
```

When Take is called with Skip:

```csharp
internal static void OrderByAndSkipAndTake()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<string> products = source
        .OrderBy(product => product.Name)
        .Skip(20)
        .Take(10)
        .Select(product => product.Name); // Define query.
    products.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

the translation becomes OFFSET-FETCH clause:

```sql
SELECT 
    [Extent1].[Name] AS [Name]
    FROM [Production].[Product] AS [Extent1]
    ORDER BY [Extent1].[Name] ASC
    OFFSET 20 ROWS FETCH NEXT 10 ROWS ONLY
```

This is extremely helpful for pagination.

### Ordering

OrderBy/OrderByDescding are translated to ORDER BY clause with ASC/DESC. For example:

```csharp
internal static void OrderBy()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source
        .OrderBy(product => product.ListPrice)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}")); // Execute query.
}

internal static void OrderByDescending()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source
        .OrderByDescending(product => product.ListPrice)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}")); // Execute query.
}
```

The translations are:

```sql
SELECT 
    [Project1].[C1] AS [C1], 
    [Project1].[Name] AS [Name], 
    [Project1].[ListPrice] AS [ListPrice]
    FROM ( SELECT 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
    )  AS [Project1]
    ORDER BY [Project1].[ListPrice] ASC

SELECT 
    [Project1].[C1] AS [C1], 
    [Project1].[Name] AS [Name], 
    [Project1].[ListPrice] AS [ListPrice]
    FROM ( SELECT 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
    )  AS [Project1]
    ORDER BY [Project1].[ListPrice] DESC
```

To sort with multiple keys, call OrderBy/OrderByDescending and ThenBy/ThenByDescending:

```csharp
internal static void OrderByAndThenBy()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source
        .OrderBy(product => product.ListPrice)
        .ThenBy(product => product.Name)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}")); // Execute query.
}
```

Similar to GroupBy/Join/GroupJoin, the ordering query methods’ keySelector can return anonymous type:

```csharp
internal static void OrderByAnonymousType()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source
        .OrderBy(product => new { ListPrice = product.ListPrice, Name = product.Name })
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}")); // Execute query.
}
```

These 2 queries are semantically equivalent. They are translated to identical ORDER BY query:

```sql
SELECT 
    [Project1].[C1] AS [C1], 
    [Project1].[Name] AS [Name], 
    [Project1].[ListPrice] AS [ListPrice]
    FROM ( SELECT 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
    )  AS [Project1]
    ORDER BY [Project1].[ListPrice] ASC, [Project1].[Name] ASC
```

If OrderBy/OrderByDescending are called multiple times:

```csharp
internal static void OrderByAndOrderBy()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var products = source
        .OrderBy(product => product.ListPrice)
        .OrderBy(product => product.Name)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}")); // Execute query.
}
```

only the last call is translated:

```sql
SELECT 
    [Project1].[C1] AS [C1], 
    [Project1].[Name] AS [Name], 
    [Project1].[ListPrice] AS [ListPrice]
    FROM ( SELECT 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
    )  AS [Project1]
    ORDER BY [Project1].[Name] ASC
```

### Conversion

Cast can convert primitive types, for example, decimal (money) to string (nvarchar):

```csharp
internal static void Cast()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<string> listPrices = source
        .Select(product => product.ListPrice)
        .Cast<string>(); // Define query.
    listPrices.ForEach(listPrice => Trace.WriteLine(listPrice)); // Execute query.
}
```

Cast is translated to CAST:

```sql
SELECT 
     CAST( [Extent1].[ListPrice] AS nvarchar(max)) AS [C1]
    FROM [Production].[Product] AS [Extent1]
```

SQL function CAST only works for primitive types, so Cast query method cannot convert arbitrary data. The following example attempts to convert Product to UniversalProduct:

```csharp
internal static void CastEntity()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<UniversalProduct> universalProducts = source
        .Where(product => product.Name.StartsWith("Road-750"))
        .Cast<UniversalProduct>(); // Define query.
    universalProducts.ForEach(product => Trace.WriteLine($"{product.Name}: {product.GetType().Name}")); // Execute query.
    // NotSupportedException: Unable to cast the type 'Dixin.Linq.EntityFramework.Product' to type 'Dixin.Linq.EntityFramework.UniversalProduct'. LINQ to Entities only supports casting EDM primitive or enumeration types.
}
```

Apparently, above conversion cannot be translated to a CAST expression, so Entity Framework throws a NotSupportedException.

The other conversion query method is AsQueryable. It has 2 overloads, a generic overload to convert IEnumerable<T> source to IQueryable<T>, and a non-generic overload to convert IEnumerable source to IQueryable. Also, remember Enumerable.AsEnumerable can convert more derived source (e.g., a IQueryable<T> source) to IEnumerable<T>. These AsQueryable/AsEnumerable methods look like the AsParallel/AsSequential methods, which convert between LINQ to Objects parallel/sequential queries. However, AsQueryable/AsEnumerable usually do not convert between remote LINQ to Entities query and local LINQ to Objects query. Here is the implementation of Enumerable.AsEnumerable, and Queryable.AsQueryable (the generic overload):

```csharp
namespace System.Linq
{
    using System.Collections.Generic;

    public static class Enumerable
    {
        public static IEnumerable<TSource> AsEnumerable<TSource>(this IEnumerable<TSource> source) => source;
    }

    public static class Queryable
    {
        public static IQueryable<TElement> AsQueryable<TElement>(this IEnumerable<TElement> source) =>
            source is IQueryable<TElement> ? (IQueryable<TElement>)source : new EnumerableQuery<TElement>(source);
    }
}
```

AsQueryable accepts an IEnumerable<T> source. If the input source is indeed an IQueryable<T> source, then return the input source; if not, wrap the input source into an EnumerablleQuery<T> object, and return it. EnumerablleQuery<T> is a special implementation of IQueryable<T>. When pulling values from EnumerableQuery<T> source, System.Linq.EnumerableRewriter.Visit is called to translate the query to local LINQ to Objects query, then execute the query locally. As a result, AsEnumerable can convert a remote LINQ to Entities query to local LINQ to Objects query, but AsQueryable cannot convert a local LINQ to Objects query to a remote LINQ to Entities query (and logically, a local .NET data source cannot be converted to a remote SQL data source). For example:

```csharp
internal static void AsEnumerableAsQueryable()
{
    IQueryable<Product> source1 = AdventureWorks.Products;
    var query1 = source1 // DbSet<T> object, derives from DbQuery<T>.
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }) // Return DbQuery<T> object.
        .AsEnumerable() // Do nothing, directly return the input DbQuery<T> object.
        .AsQueryable() // Do nothing, directly return the input DbQuery<T> object.
        .Where(product => product.ListPrice > 0); // Continue LINQ to Entities query.
    query1.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}"));

    IQueryable<Product> source2 = AdventureWorks.Products;
    var query2 = source2 // DbSet<T> object, derives from DbQuery<T>.
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }) // Return DbQuery<T> object.
        .AsEnumerable() // Do nothing, directly return the input DbQuery<T> object.
        .Select(product => product) // Enumerable.Select, returns a generator wrapping the input DbQuery<T> object.
        .AsQueryable() // Return an EnumerableQuery<T> object wrapping the input generator.
        .Where(product => product.ListPrice > 0); // No longer LINQ to Entities query on DbSet<T> or DbQuery<T>.
    query2.ForEach(product => Trace.WriteLine($"{product.Name}: {product.ListPrice}"));
}
```

In the first query:

-   Select is called on DbSet<T> source, it returns a DbQuery<T>, and it will be translated to SQL query.
-   AsEnumerable returns the input source directly, which is actually an DbQuery<T> source.
-   Then, AsQueryable is called. since the input DbQuery<T> source is IQueryable<T>, it directly returns the input source again.
-   So after calling AsEnumerable and AsQueryable, nothing happens. Where is still LINQ to Entities query on DbQuery<T>, it will be translated to WHERE clause.

So it is translated as if AsEnumerable call and AsQueryable call do not exist:

```sql
SELECT 
    1 AS [C1], 
    [Extent1].[Name] AS [Name], 
    [Extent1].[ListPrice] AS [ListPrice]
    FROM [Production].[Product] AS [Extent1]
    WHERE [Extent1].[ListPrice] > cast(0 as decimal(18))
```

In the second query:

-   The first Select will be translated to SQL query.
-   The second Select is called after AsEnumerable, so it is Enumerable.Select instead of Queryable.Select. As discussed in the LINQ to Objects chapter, Enumerable.Select returns a generator, which wraps the input source.
-   Then AsQueryable is called. Since the input generator is not IQueryable<T>, it returns an EnumerableQuery<T>, which wraps he generator.
-   Where is called on EnumerbaleQuery<T> source, it will be translated to LINQ to Objects query.

The translated SQL does not have the WHERE clause:

```sql
SELECT 
    1 AS [C1], 
    [Extent1].[Name] AS [Name], 
    [Extent1].[ListPrice] AS [ListPrice]
    FROM [Production].[Product] AS [Extent1]
```

AsEnumerable can be useful for LINQ to Entities for some special cases. For example, LINQ to Entities’ Select query method does not support mapping to existing entity type:

```csharp
internal static void SelectEntities()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<Product> products = source
        .Where(product => product is UniversalProduct)
        .Select(product => new UniversalProduct()
        {
            ProductID = product.ProductID,
            Name = product.Name,
            ListPrice = product.ListPrice,
            ProductSubcategoryID = product.ProductSubcategoryID
        }); // Define query.
    products.ForEach(product => Trace.WriteLine($"{product.ProductID}: {product.Name}")); // Execute query.
    // NotSupportedException: The entity or complex type 'Dixin.Linq.EntityFramework.UniversalProduct' cannot be constructed in a LINQ to Entities query.
}
```

Executing above query throws a NotSupportedException. This is by design, because this kind of mapping causes difficulties for Entity Framework. For example, by default DbContext maintains the mapping between remote rows and query result entities, and constructing entities on the fly prevents doing so. Here, one solution is to construct the UniversalProduct entities with local LINQ to Objects query:

```csharp
internal static void SelectEntityObjects()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IEnumerable<Product> products = source
        .Where(product => product is UniversalProduct) // Return IQueryable<Product>. LINQ to Entities.
        .AsEnumerable() // Return IEnumerable<(int, string)>. LINQ to Objects from here.
        .Select(product => new UniversalProduct()
        {
            ProductID = product.ProductID,
            Name = product.Name,
            ListPrice = product.ListPrice,
            ProductSubcategoryID = product.ProductSubcategoryID
        }); // Define query.
    products.ForEach(product => Trace.WriteLine(product.Name)); // Execute query.
}
```

## Return a single value

Query methods in this category takes an IQueryable<T> input source and returns a single value. As demonstrated above, they can be used with the other query methods to flatten hierarchical data, like aggregation query method with GroupBy are translated to SQL aggregation function with GROUP BY, etc. When they are called at the end of a LINQ to Entities query, they returns some value with immediate execution, which is similar behavior to LINQ to Objects.

### Element

First/FirstOrDefault execute the LINQ to Entities queries immediately for the first value/first or default value. The following example queries the first product’s Name:

```csharp
internal static void First()
{
    IQueryable<Product> source = AdventureWorks.Products;
    string first = source
        .Select(product => product.Name)
        .First(); // Execute query.
    Trace.WriteLine(first);
}
```

It is translated to TOP (1):

```sql
SELECT TOP (1) 
    [c].[Name] AS [Name]
    FROM [Production].[Product] AS [c]
```

First/FirstOrDefault can also accept a predicate expression tree. The following example queries the first or default product with ListPrice greater than 5000:

```csharp
internal static void FirstOrDefault()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var firstOrDefault = source
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice })
        .FirstOrDefault(product => product.ListPrice > 5000); // Execute query.
    Trace.WriteLine($"{firstOrDefault?.Name}");
}
```

The predicate is translated to WHERE clause:

```sql
SELECT 
    [Limit1].[C1] AS [C1], 
    [Limit1].[Name] AS [Name], 
    [Limit1].[ListPrice] AS [ListPrice]
    FROM ( SELECT TOP (1) 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] > cast(5000 as decimal(18))
    )  AS [Limit1]
```

As discussed in LINQ to Objects, Single/SingleOrDefault look similar to, but the semantics is more strict:

```csharp
internal static void Single()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var single = source
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice })
        .Single(product => product.ListPrice < 50); // Execute query.
    Trace.WriteLine($"{single.Name}");
}
```

To ensure the query result does not have more than 1 row, Single/SingleOrDefault are translated to TOP (2):

```sql
SELECT 
    [Limit1].[C1] AS [C1], 
    [Limit1].[Name] AS [Name], 
    [Limit1].[ListPrice] AS [ListPrice]
    FROM ( SELECT TOP (2) 
        [Extent1].[Name] AS [Name], 
        [Extent1].[ListPrice] AS [ListPrice], 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] < cast(50 as decimal(18))
```

Single/SingleOrDefault can also accept predicate:

```csharp
internal static void SingleOrDefault()
{
    IQueryable<Product> source = AdventureWorks.Products;
    var singleOrDefault = source
        .GroupBy(
            subcategory => subcategory.ListPrice,
            (key, groups) => new { ListPrice = key, Count = groups.Count() })
        .SingleOrDefault(group => group.Count > 10); // Define query.
    Trace.WriteLine($"{singleOrDefault?.ListPrice}");
}
```

It is translated to WHERE as well:

```sql
SELECT 
    [Limit1].[C2] AS [C1], 
    [Limit1].[ListPrice] AS [ListPrice], 
    [Limit1].[C1] AS [C2]
    FROM ( SELECT TOP (2) 
        [GroupBy1].[A1] AS [C1], 
        [GroupBy1].[K1] AS [ListPrice], 
        1 AS [C2]
        FROM ( SELECT 
            [Extent1].[ListPrice] AS [K1], 
            COUNT(1) AS [A1]
            FROM [Production].[Product] AS [Extent1]
            GROUP BY [Extent1].[ListPrice]
        )  AS [GroupBy1]
        WHERE [GroupBy1].[A1] > 10
    )  AS [Limit1]
```

### Aggregation

Count/LongCount are translated to SQL aggregate functions COUNT/COUNT\_BIG, and the provided predicate is translated to WHERE clause. The following examples query the System.Int32 count of categories, and the System.Int64 count of the products with ListPrice greater than 0:

```csharp
internal static void Count()
{
    IQueryable<Product> source = AdventureWorks.Products;
    int count = source.Count(); // Execute query.
    Trace.WriteLine(count);
}

internal static void LongCount()
{
    IQueryable<Product> source = AdventureWorks.Products;
    long longCount = source.LongCount(product => product.ListPrice > 0); // Execute query.
    Trace.WriteLine(longCount);
}
```

They are translated to:

```sql
SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        COUNT(1) AS [A1]
        FROM [Production].[ProductCategory] AS [Extent1]
    )  AS [GroupBy1]

SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        COUNT_BIG(1) AS [A1]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] > cast(0 as decimal(18))
    )  AS [GroupBy1]
```

Max/Min are translated to MAX/MIN functions. If a selector is provided, the selector is translated to argument of MAX/MIN. The following examples query the latest ModifiedDate of photos, and the lowest ListPrice of products:

```csharp
internal static void Max()
{
    IQueryable<ProductPhoto> source = AdventureWorks.ProductPhotos;
    DateTime max = source.Select(photo => photo.ModifiedDate).Max(); // Execute query.
    Trace.WriteLine(max); 
}

internal static void Min()
{
    IQueryable<Product> source = AdventureWorks.Products;
    decimal min = source.Min(product => product.ListPrice); // Execute query.
    Trace.WriteLine(min);
}
```

Their translations are in the same pattern:

```sql
SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        MAX([Extent1].[ModifiedDate]) AS [A1]
        FROM [Production].[ProductPhoto] AS [Extent1]
    )  AS [GroupBy1]

SELECT 
    [GroupBy1].[A1] AS [C1]
    FROM ( SELECT 
        MIN([Extent1].[ListPrice]) AS [A1]
        FROM [Production].[Product] AS [Extent1]
    )  AS [GroupBy1]
```

Min/Max cannot evaluate for any type, because SQL MAX/MIN functions only accept numeric, character string, uniqueidentifier, and datetime arguments.

For other scenarios, like query some properties

### Quantifier

Any is translated to EXISTS operator, and the LINQ to Entities query before Any is translated to subquery of EXISTS. The following example simply query whether any product exists:

```csharp
internal static void Any()
{
    IQueryable<Product> source = AdventureWorks.Products;
    bool anyUniversal = source.Any(); // Execute query.
    Trace.WriteLine(anyUniversal);
}
```

It is translated to:

```sql
SELECT 
    CASE WHEN ( EXISTS (SELECT 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
    )) THEN cast(1 as bit) ELSE cast(0 as bit) END AS [C1]
    FROM  ( SELECT 1 AS X ) AS [SingleRowTable1]
```

Contains can be implemented by Any equivalently, so Contains is translated to EXISTS too. The following example queries whether any product’s ListPrice is 100:

```csharp
internal static void Contains()
{
    IQueryable<Product> source = AdventureWorks.Products;
    // Only primitive types or enumeration types are supported.
    bool contains = source.Select(product => product.ListPrice).Contains(100); // Execute query.
    Trace.WriteLine(contains);
}
```

It is equivalent to the following Any query:

```csharp
internal static void AnyWithPredicate()
{
    IQueryable<Product> source = AdventureWorks.Products;
    bool anyUniversal = source.Any(product => product.ListPrice == 100); // Execute query.
    Trace.WriteLine(anyUniversal);
}
```

They are translated to identical EXISTS query, and the predicate for Any is translated to WHERE clause:

```sql
SELECT 
    CASE WHEN ( EXISTS (SELECT 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
        WHERE cast(100 as decimal(18)) = [Extent1].[ListPrice]
    )) THEN cast(1 as bit) ELSE cast(0 as bit) END AS [C1]
    FROM  ( SELECT 1 AS X ) AS [SingleRowTable1]
```

All can be implemented by Any equivalently too. The following example queries whether all products’ ListPrices are not 100:

```csharp
internal static void AllNot()
{
    IQueryable<Product> source = AdventureWorks.Products;
    bool allNot = source.All(product => product.ProductSubcategoryID != null); // Execute query.
    Trace.WriteLine(allNot);
}
```

It is equivalent to query whether not any product’s ListPrice is 100:

```csharp
internal static void NotAny()
{
    IQueryable<Product> source = AdventureWorks.Products;
    bool notAny = !source.Any(product => !(product.ProductSubcategoryID != null)); // Execute query.
    Trace.WriteLine(notAny);
}
```

So above All query is translated to NOT EXISTS, and in the subquery’s WHERE clause, != null is translated to opposite condition IS NULL:

```sql
SELECT 
    CASE WHEN ( NOT EXISTS (SELECT 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
        WHERE ([Extent1].[ProductSubcategoryID] IS NULL) 
            OR (CASE -- OR and the succeeding condition is redundant.
                    WHEN ([Extent1].[ProductSubcategoryID] IS NOT NULL) THEN cast(1 as bit) 
                    ELSE cast(0 as bit) 
                END IS NULL)
    )) THEN cast(1 as bit) ELSE cast(0 as bit) END AS [C1]
    FROM  ( SELECT 1 AS X ) AS [SingleRowTable1]

SELECT 
    CASE WHEN ( EXISTS (SELECT 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ProductSubcategoryID] IS NULL
    )) THEN cast(1 as bit) ELSE cast(0 as bit) END AS [C1]
    FROM  ( SELECT 1 AS X ) AS [SingleRowTable1]
```

Their translation are not identical, but in the same pattern. In the ALL translation, the WHERE clause’s OR operator and the succeeding condition is redundant. Also the Any translation is EXISTS, the “not” any is done by the .NET ! operator outside the LINQ to Entities query, so it is not translated.