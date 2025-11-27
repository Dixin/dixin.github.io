---
title: "Entity Framework/Core and LINQ to Entities (4) Query Methods (Operators)"
published: 2019-03-15
description: "This part discusses how to query SQL database with the defined mapping entities. In EF/Core, LINQ to Entities supports most of the methods provided by Queryable:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## Latest EF Core version of this article: [https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-4-query-methods](/posts/entity-framework-core-and-linq-to-entities-4-query-methods "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-4-query-methods")

## EF version of this article: [https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-4-query-methods](/posts/entity-framework-and-linq-to-entities-4-query-methods "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-4-query-methods")

This part discusses how to query SQL database with the defined mapping entities. In EF/Core, LINQ to Entities supports most of the methods provided by Queryable:

1.  Sequence queries: return a new IQueryable<T> source

-   Filtering (restriction): Where, OfType\*
-   Mapping (projection): Select
-   Generation: DefaultIfEmpty\*
-   Grouping: GroupBy\*
-   Join: Join, GroupJoin, SelectMany, Select
-   Concatenation: Concat\*
-   Set: Distinct, GroupBy\*, Union\*, Intersect\*, Except\*
-   Convolution: Zip
-   Partitioning: Take, Skip, TakeWhile, SkipWhile
-   Ordering: OrderBy\*, ThenBy, OrderByDescending\*, ThenByDescending, Reverse
-   Conversion: Cast, AsQueryable

3.  Value queries: return a single value
    -   Element: First, FirstOrDefault, Last\*, LastOrDefault\*, ElementAt, ElementAtOrDefault, Single, SingleOrDefault
    -   Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average\*
    -   Quantifier: All, Any, Contains
    -   Equality: SequenceEqual

In above list:

-   The crossed methods are not supported by LINQ to Entities ([the list provided by MDSN](https://msdn.microsoft.com/en-us/library/bb738550.aspx) is not up to date), because they cannot be translated to proper SQL database operations. For example, SQL database has no built-in Zip operation support. Calling these crossed methods throws NotSupportedException at runtime
-   The underlined methods have some overloads supported by LINQ to Entities, and other overloads not supported:

-   For GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except, Contains, the overloads accepting IEqualityComparer<T> parameter are not supported, because apparently IEqualityComparer<T> has no equivalent SQL translation
-   For OrderBy, ThenBy, OrderByDescending, ThenByDescending, the overloads with IComparer<T> parameter are not supported
-   For Where, Select, SelectMany, the indexed overloads are not supported

-   In EF Core, the methods marked with \* can execute the query locally in some cases, without being translated to SQL.

> EF translate all supported query methods to SQL and executed in database.

For LINQ to Entities, apparently these methods enable fluent method chaining, implement the same LINQ query expression pattern as LINQ to Objects and Parallel LINQ. So in this part, most of the LINQ to Entities queries are demonstrated with query methods.

## Sequence queries

Similar to the other kinds of LINQ, LINQ to Entities implements deferred execution for these query methods returning IQueryable<T>. The SQL query is translated and executed only when trying to pull the result value from IQueryable<T> for the first time.

### Filtering (restriction)

EF/Core translates Where query method call to WHERE clause in SQL, and translates the predicate expression tree (again, not predicate function) to the condition in WHERE clause. The following example queries categories with ProductCategoryID greater than 0:

```sql
internal static void Where(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.Where(category => category.ProductCategoryID > 0); // Define query.
    categories.WriteLines(category => category.Name); // Execute query.
    // SELECT [category].[ProductCategoryID], [category].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // WHERE [category].[ProductCategoryID] > 0
}
```

When WriteLines executes, it pulls the results from the query represented by IQueryable<ProductCategory>. At this moment, the query is translated to SQL, and executed in database, then SQL execution results are read by EF/Core and yielded.

The C# || operator in the predicate expression tree is translated to SQL OR operator in WHERE clause:

```sql
internal static void WhereWithOr(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.Where(category =>
        category.ProductCategoryID < 2 || category.ProductCategoryID > 3); // Define query.
    categories.WriteLines(category => category.Name); // Execute query.
    // SELECT [category].[ProductCategoryID], [category].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // WHERE ([category].[ProductCategoryID] < 2) OR ([category].[ProductCategoryID] > 3)
}
```

Similarly, the C# && operator is translated to SQL AND operator:

```sql
internal static void WhereWithAnd(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source.Where(category =>
        category.ProductCategoryID > 0 && category.ProductCategoryID < 5); // Define query.
    categories.WriteLines(category => category.Name); // Execute query.
    // SELECT [category].[ProductCategoryID], [category].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // WHERE ([category].[ProductCategoryID] > 0) AND ([category].[ProductCategoryID] < 5)
}
```

Multiple Where calls are also translated to one single WHERE clause with AND:

```sql
internal static void WhereAndWhere(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source
        .Where(category => category.ProductCategoryID > 0)
        .Where(category => category.ProductCategoryID < 5); // Define query.
    categories.WriteLines(category => category.Name); // Execute query.
    // SELECT [category].[ProductCategoryID], [category].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // WHERE ([category].[ProductCategoryID] > 0) AND ([category].[ProductCategoryID] < 5)
}
```

The other filtering method, OfType, can be used for entity types in inheritance hierarchy. And it is equivalent to Where query with is operator. The following examples both query sales transactions from all transactions:

```sql
internal static void WhereWithIs(AdventureWorks adventureWorks)
{
    IQueryable<TransactionHistory> source = adventureWorks.Transactions;
    IQueryable<TransactionHistory> transactions = source.Where(transaction => transaction is SalesTransactionHistory); // Define query.
    transactions.WriteLines(transaction => $"{transaction.GetType().Name} {transaction.TransactionDate} {transaction.ActualCost}"); // Execute query.
    // SELECT [transaction].[TransactionID], [transaction].[ActualCost], [transaction].[ProductID], [transaction].[Quantity], [transaction].[TransactionDate], [transaction].[TransactionType]
    // FROM [Production].[TransactionHistory] AS [transaction]
    // WHERE [transaction].[TransactionType] IN (N'W', N'S', N'P') AND ([transaction].[TransactionType] = N'S')
}

internal static void OfTypeEntity(AdventureWorks adventureWorks)
{
    IQueryable<TransactionHistory> source = adventureWorks.Transactions;
    IQueryable<WorkTransactionHistory> transactions = source.OfType<WorkTransactionHistory>(); // Define query.
    transactions.WriteLines(transaction => $"{transaction.GetType().Name} {transaction.TransactionDate} {transaction.ActualCost}"); // Execute query.
    // SELECT [t].[TransactionID], [t].[ActualCost], [t].[ProductID], [t].[Quantity], [t].[TransactionDate], [t].[TransactionType]
    // FROM [Production].[TransactionHistory] AS [t]
    // WHERE [t].[TransactionType] = N'W'
}
```

When primitive type is specified for OfType, it works locally. The following example queries products with ProductSubcategoryID not null:

```sql
internal static void OfTypePrimitive(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<int> products = source.Select(product => product.ProductSubcategoryID).OfType<int>(); // Define query.
    products.ToArray().Length.WriteLine(); // Execute query.
    // SELECT [p].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [p]
}
```

In EF Core, the above query is translated to a basic SELECT statement without filtering. EF Core executes the translated SQL to query the specified nullable int column of all rows to local, then the int results are locally filtered from all the nullable int results.

> EF does not support OfType with primitive type. In EF, the above query throws NotSupportedException: 'System.Int32' is not a valid metadata type for type filtering operations. Type filtering is only valid on entity types and complex types.

### Mapping (projection)

In above queries, Queryable.Select is not called, and the query results are entities. So in the translated SQL, the SELECT clause queries all the mapped columns in order to construct the result entities. When Select is called, the selector expression tree is translated into SELECT clause. The following example queries persons’ full names by concatenating the first name and last name:

```sql
internal static void Select(AdventureWorks adventureWorks)
{
    IQueryable<Person> source = adventureWorks.People;
    IQueryable<string> names = source.Select(person =>
        person.FirstName + " " + person.LastName); // Define query.
    names.WriteLines(); // Execute query.
    // SELECT ([person].[FirstName] + N' ') + [person].[LastName]
    // FROM [Person].[Person] AS [person]
}
```

In EF/Core, Select also work with anonymous type. For example:

```sql
internal static void SelectAnonymousType(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var products = source.Select(product =>
        new { Name = product.Name, IsExpensive = product.ListPrice > 1_000 }); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name], CASE
    //    WHEN [product].[ListPrice] > 1000.0
    //    THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    // END
    // FROM [Production].[Product] AS [product]
}
```

In EF Core, Select supports entity type too:

```sql
internal static void SelectEntity(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<Product> products = source
        .Where(product => product.ListPrice > 1_000)
        .Select(product => new Product()
        {
            ProductID = product.ProductID,
            Name = product.Name
        }); // Define query.
    products.WriteLines(product => $"{product.ProductID}: {product.Name}"); // Execute query.
    // SELECT [product].[ProductID], [product].[Name]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] > 1000.0
}
```

> In EF, Select does not support entity type. The above query throws NotSupportedException: The entity or complex type 'Product' cannot be constructed in a LINQ to Entities query.

### Generation

As fore mentioned, DefaultIfEmpty is the only built-in generation method:

```sql
internal static void DefaultIfEmptyEntity(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source
        .Where(category => category.ProductCategoryID < 0)
        .DefaultIfEmpty(); // Define query.
    categories.ForEach( // Execute query.
        category => (category == null).WriteLine()); // True
    // SELECT [t].[ProductCategoryID], [t].[Name]
    // FROM (
    //    SELECT NULL AS [empty]
    // ) AS [empty]
    // LEFT JOIN (
    //    SELECT [category].[ProductCategoryID], [category].[Name]
    //    FROM [Production].[ProductCategory] AS [category]
    //    WHERE [category].[ProductCategoryID] < 0
    // ) AS [t] ON 1 = 1
}
```

In the above query, Where method is translated to SQL query with WHERE clause. Since DefaultIfEmpty should yield at least 1 entity, it is translated to LEFT JOIN with a single row table on a condition that always holds, so that the final query result is guaranteed to have at least 1 row. Here Where filters out all entities, in another word, the right table of LEFT JOIN has no rows, so the LEFT JOIN results 1 row, where all columns are NULL, including primary key. Therefore, DefaultIfEmpty yields a null entity. Besides entity type, DefaultIfEmpty works with primitive type in the same way.

The other DefaultIfEmpty overload accepts a specified default value. EF Core does not translate it to SQL, but execute the query logic locally. For example:

```sql
internal static void DefaultIfEmptyEntity(AdventureWorks adventureWorks)
{
    ProductCategory @default = new ProductCategory() { Name = nameof(ProductCategory) };
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    IQueryable<ProductCategory> categories = source
        .Where(category => category.ProductCategoryID < 0)
        .DefaultIfEmpty(@default); ; // Define query.
    categories.WriteLines( // Execute query.
        category => category?.Name); // ProductCategory
    // SELECT [category].[ProductCategoryID], [category].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // WHERE [category].[ProductCategoryID] < 0
}
```

Here the source query for DefaultIfEmpty is translated to SQL and executed, then EF Core reads the results to local, and detect the results locally. If there is no result row, the specified default value is yielded. DefaultIfEmpty works for specified default primitive value locally too.

> In EF, DefaultIfEmpty without default value works with entity type and primitive type. In both cases it is translated to a similar left outer join with a single row. Since EF executes query remotely, the overload with specified default value does not work with entity type, and throws NotSupportedException: Unable to create a constant value of type 'ProductCategory'. Only primitive types or enumeration types are supported in this context. This overload works with specified default primitive value:
> 
> ```sql
> internal static void DefaultIfEmptyWithDefaultPrimitive(AdventureWorks adventureWorks)
> {
>     IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
>     IQueryable<int> categories = source
>         .Where(category => category.ProductCategoryID < 0)
>         .Select(category => category.ProductCategoryID)
>         .DefaultIfEmpty(-1); // Define query.
>     categories.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    CASE WHEN ([Project1].[C1] IS NULL) THEN -1 ELSE [Project1].[ProductCategoryID] END AS [C1]
>     //    FROM   ( SELECT 1 AS X ) AS [SingleRowTable1]
>     //    LEFT OUTER JOIN  (SELECT 
>     //        [Extent1].[ProductCategoryID] AS [ProductCategoryID], 
>     //        cast(1 as tinyint) AS [C1]
>     //        FROM [Production].[ProductCategory] AS [Extent1]
>     //        WHERE [Extent1].[ProductCategoryID] < 0 ) AS [Project1] ON 1 = 1
> #else
>     // SELECT [category].[ProductCategoryID]
>     // FROM [Production].[ProductCategory] AS [category]
>     // WHERE [category].[ProductCategoryID] < 0
> #endif
> }
> ```
> 
> Notice the default value –1 is translated into the remote SQL query. It is the query result if the right table of left outer join is empty. So there is no local query or local detection executed.

Just like in LINQ to Objects, DefaultIfEmpty can also be used to implement outer join, which is discussed later.

### Grouping

EF Core execute grouping locally. For example. The following is a simple example that groups the subcategories by category:

```sql
internal static void GroupBy(AdventureWorks adventureWorks)
{
    IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
    IQueryable<IGrouping<int, string>> groups = source.GroupBy(
        keySelector: subcategory => subcategory.ProductCategoryID,
        elementSelector: subcategory => subcategory.Name); // Define query.
    groups.WriteLines(group => $"{group.Key}: {string.Join(", ", group)}"); // Execute query.
    // SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
    // FROM [Production].[ProductSubcategory] AS [subcategory]
    // ORDER BY [subcategory].[ProductCategoryID]
}
```

EF Core only translates GroupBy an additional ORDER BY clause with the grouping key, so that when reading the SQL execution results to local, the subcategories appears group by group.

> EF only supports remote grouping. In EF, the above GroupBy is fully translated to SQL:
> 
> ```sql
> SELECT 
>     [Project2].[ProductCategoryID] AS [ProductCategoryID], 
>     [Project2].[C1] AS [C1], 
>     [Project2].[Name] AS [Name]
>     FROM ( SELECT 
>         [Distinct1].[ProductCategoryID] AS [ProductCategoryID], 
>         [Extent2].[Name] AS [Name], 
>         CASE WHEN ([Extent2].[ProductCategoryID] IS NULL) THEN CAST(NULL AS int) ELSE 1 END AS [C1]
>         FROM   (SELECT DISTINCT 
>             [Extent1].[ProductCategoryID] AS [ProductCategoryID]
>             FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
>         LEFT OUTER JOIN [Production].[ProductSubcategory] AS [Extent2] ON [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
>     )  AS [Project2]
>     ORDER BY [Project2].[ProductCategoryID] ASC, [Project2].[C1] ASC
> ```
> 
> It is translated to LEFT OUTER JOIN instead of GROUP BY, because above GroupBy returns hierarchical results (a sequence of groups, where each group is a sequence of results). In the translated SQL, the distinct keys are queried with SELECT DISTINCT. Then these keys left outer joins the rows with LEFT OUTER JOIN, and results all available key-row pairs, which are sorted by key with ORDER BY. So eventually EF reads and yields the results group by group.
> 
> When GroupBy returns flattened results (sequence of results), it is translated to GROUP BY clause. This can be done with a GroupBy overload accepting a result selector, or equivalently an additional Select query. The following examples call aggregation query method Count to flatten the results, and they have identical translation:
> 
> ```sql
> internal static void GroupByWithResultSelector(AdventureWorks adventureWorks)
> {
>     IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
>     var groups = source.GroupBy(
>         keySelector: subcategory => subcategory.ProductCategoryID,
>         elementSelector: subcategory => subcategory.Name,
>         resultSelector: (key, group) => new { CategoryID = key, SubcategoryCount = group.Count() }); // Define query.
>     groups.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    [GroupBy1].[K1] AS [ProductCategoryID], 
>     //    [GroupBy1].[A1] AS [C1]
>     //    FROM ( SELECT 
>     //        [Extent1].[ProductCategoryID] AS [K1], 
>     //        COUNT(1) AS [A1]
>     //        FROM [Production].[ProductSubcategory] AS [Extent1]
>     //        GROUP BY [Extent1].[ProductCategoryID]
>     //    )  AS [GroupBy1]
> #else
>     // SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
>     // FROM [Production].[ProductSubcategory] AS [subcategory]
>     // ORDER BY [subcategory].[ProductCategoryID]
> #endif
> }
> 
> internal static void GroupByAndSelect(AdventureWorks adventureWorks)
> {
>     IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
>     var groups = source
>         .GroupBy(
>             keySelector: subcategory => subcategory.ProductCategoryID,
>             elementSelector: subcategory => subcategory.Name)
>         .Select(group => new { CategoryID = group.Key, SubcategoryCount = group.Count() }); // Define query.
>     groups.WriteLines(); // Execute query.
> }
> ```
> 
> SelectMany can flatten hierarchical results too. The following GroupBy example does not have aggregation subquery, so it cannot be translated to GROUP BY. It is translated to INNER JOIN::
> 
> ```sql
> internal static void GroupByAndSelectMany(AdventureWorks adventureWorks)
> {
>     IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
>     IQueryable<ProductSubcategory> distinct = source
>         .GroupBy(keySelector: subcategory => subcategory.ProductCategoryID)
>         .SelectMany(group => group); // Define query.
>     distinct.WriteLines(subcategory => subcategory.Name); // Execute query.
> #if EF
>     // SELECT 
>     //    [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID], 
>     //    [Extent2].[Name] AS [Name], 
>     //    [Extent2].[ProductCategoryID] AS [ProductCategoryID]
>     //    FROM   (SELECT DISTINCT 
>     //        [Extent1].[ProductCategoryID] AS [ProductCategoryID]
>     //        FROM [Production].[ProductSubcategory] AS [Extent1] ) AS [Distinct1]
>     //    INNER JOIN [Production].[ProductSubcategory] AS [Extent2] ON [Distinct1].[ProductCategoryID] = [Extent2].[ProductCategoryID]
> #else
>     // SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
>     // FROM [Production].[ProductSubcategory] AS [subcategory]
>     // ORDER BY [subcategory].[ProductCategoryID]
> #endif
> }
> ```

GroupBy’s key selector can return anonymous type to support grouping by multiple keys, still locally in EF Core:

```sql
internal static void GroupByMultipleKeys(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var groups = source.GroupBy(
        keySelector: product => new { ProductSubcategoryID = product.ProductSubcategoryID, ListPrice = product.ListPrice },
        resultSelector: (key, group) => new
        {
            ProductSubcategoryID = key.ProductSubcategoryID,
            ListPrice = key.ListPrice,
            Count = group.Count()
        }); // Define query.
    groups.WriteLines(); // Execute query.
    // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ProductSubcategoryID], [product].[ListPrice]
}
```

> EF properly translates the above query to GROUP BY:
> 
> ```sql
> SELECT 
>     1 AS [C1], 
>     [GroupBy1].[K2] AS [ProductSubcategoryID], 
>     [GroupBy1].[K1] AS [ListPrice], 
>     [GroupBy1].[A1] AS [C2]
>     FROM ( SELECT 
>         [Extent1].[ListPrice] AS [K1], 
>         [Extent1].[ProductSubcategoryID] AS [K2], 
>         COUNT(1) AS [A1]
>         FROM [Production].[Product] AS [Extent1]
>         GROUP BY [Extent1].[ListPrice], [Extent1].[ProductSubcategoryID]
>     )  AS [GroupBy1]
> ```

### Join

### Inner join

Similar to LINQ to Objects, Join is provided for inner join. The following example simply join the subcategories and categories with foreign key:

```sql
internal static void InnerJoinWithJoin(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer.Join(
        inner: inner,
        outerKeySelector: category => category.ProductCategoryID,
        innerKeySelector: subcategory => subcategory.ProductCategoryID,
        resultSelector: (category, subcategory) =>
            new { Category = category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    join subcategory in inner
    //    on category.ProductCategoryID equals subcategory.ProductCategoryID
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
    // SELECT [category].[Name], [subcategory].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // INNER JOIN [Production].[ProductSubcategory] AS [subcategory] ON [category].[ProductCategoryID] = [subcategory].[ProductCategoryID]
}
```

Join’s key selectors can return anonymous type to join with multiple keys:

```sql
internal static void InnerJoinWithMultipleKeys(AdventureWorks adventureWorks)
{
    IQueryable<Product> outer = adventureWorks.Products;
    IQueryable<TransactionHistory> inner = adventureWorks.Transactions;
    var transactions = outer.Join(
        inner: inner,
        outerKeySelector: product =>
            new { ProductID = product.ProductID, UnitPrice = product.ListPrice },
        innerKeySelector: transaction =>
            new { ProductID = transaction.ProductID, UnitPrice = transaction.ActualCost / transaction.Quantity },
        resultSelector: (product, transaction) =>
            new { Name = product.Name, Quantity = transaction.Quantity }); // Define query.
    // var transactions =
    //    from product in adventureWorks.Products
    //    join transaction in adventureWorks.Transactions
    //    on new { ProductID = product.ProductID, UnitPrice = product.ListPrice }
    //        equals new { ProductID = transaction.ProductID, UnitPrice = transaction.ActualCost / transaction.Quantity }
    //    select new { Name = product.Name, Quantity = transaction.Quantity };
    transactions.WriteLines(); // Execute query.
    // SELECT [product].[Name], [transaction].[Quantity]
    // FROM [Production].[Product] AS [product]
    // INNER JOIN [Production].[TransactionHistory] AS [transaction] ON ([product].[ProductID] = [transaction].[ProductID]) AND ([product].[ListPrice] = ([transaction].[ActualCost] / [transaction].[Quantity]))
}
```

Just like LINQ to Objects, inner join can be done by SelectMany, Select, and GroupJoin as well. In the following example, Select returns hierarchical data, so an additional SelectMany can flatten the result:

```sql
internal static void InnerJoinWithSelect(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .Select(category => new
        {
            Category = category,
            Subcategories = inner
                .Where(subcategory => category.ProductCategoryID == subcategory.ProductCategoryID)
                // LEFT OUTER JOIN if DefaultIfEmpty is called.
        })
        .SelectMany(
            collectionSelector: category => category.Subcategories,
            resultSelector: (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    select new
    //    {
    //        Category = category,
    //        Subcategories = from subcategory in inner
    //                        where category.ProductCategoryID == subcategory.ProductCategoryID
    //                        select subcategory
    //    } into category
    //    from subcategory in category.Subcategories
    //    select new { Category = category.Category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
    // SELECT [category].[Name], [subcategory].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // CROSS JOIN [Production].[ProductSubcategory] AS [subcategory]
    // WHERE [category].[ProductCategoryID] = [subcategory].[ProductCategoryID]
}
```

EF Core translates the above query to CROOS JOIN with WHERE clause, which is equivalent to the previous INNER JOIN query, with the same query plan.

> EF still translates above query to INNER JOIN.

The following example implement the same inner join directly with SelectMany. Its SQL translation is the same INNER JOIN as the first Join example:

```csharp
internal static void InnerJoinWithSelectMany(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .SelectMany(
            collectionSelector: category => inner
                .Where(subcategory => category.ProductCategoryID == subcategory.ProductCategoryID),
                // LEFT OUTER JOIN if DefaultIfEmpty is called.
            resultSelector: (category, subcategory) =>
                new { Category = category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //   from category in outer
    //   from subcategory in (from subcategory in inner
    //                        where category.ProductCategoryID == subcategory.ProductCategoryID
    //                        select subcategory)
    //   select new { Category = category.Name, Subcategory = subcategory.Name };
    // Or equivalently:
    // var categorySubcategories =
    //    from category in outer
    //    from subcategory in inner
    //    where category.ProductCategoryID == subcategory.ProductCategoryID
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
}
```

The above Select and SelectMany has a Where subquery to filter the related entities to join with. The Where subquery can be substituted by collection navigation property. After the substitution, the queries are translated to the same INNER JOIN as the first Join example:

```csharp
internal static void InnerJoinWithSelectAndRelationship(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    var categorySubcategories = outer
        .Select(category => new { Category = category, Subcategories = category.ProductSubcategories })
        .SelectMany(
            collectionSelector: category => category.Subcategories,
            // LEFT OUTER JOIN if DefaultIfEmpty is missing.
            resultSelector: (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    select new { Category = category, Subcategories = category.ProductSubcategories } into category
    //    from subcategory in category.Subcategories
    //    select new { Category = category.Category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
}

internal static void InnerJoinWithSelectManyAndRelationship(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    var categorySubcategories = outer.SelectMany(
        collectionSelector: category => category.ProductSubcategories,
        // LEFT OUTER JOIN if DefaultIfEmpty is missing.
        resultSelector: (category, subcategory) =>
            new { Category = category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    from subcategory in category.ProductSubcategories
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
}
```

GroupJoin also returns hierarchical result, so again an additional SelectMany can flatten the result. The following example still has the same INNER JOIN translation as the first Join example:

```csharp
internal static void InnerJoinWithGroupJoinAndSelectMany(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .GroupJoin(
            inner: inner,
            outerKeySelector: category => category.ProductCategoryID,
            innerKeySelector: subcategory => subcategory.ProductCategoryID,
            resultSelector: (category, subcategories) =>
                new { Category = category, Subcategories = subcategories })
        .SelectMany(
            collectionSelector: category => category.Subcategories,
            // LEFT OUTER JOIN if DefaultIfEmpty is called.
            resultSelector: (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    join subcategory in inner
    //    on category.ProductCategoryID equals subcategory.ProductCategoryID into subcategories
    //    from subcategory in subcategories
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
}
```

Navigation property makes it very easy to join entities with relationship. The following example inner joins 3 entity types, where 2 entity types have many-to-many relationship with a junction entity type:

```sql
internal static void MultipleInnerJoinsWithRelationship(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var productPhotos = source.SelectMany(
        collectionSelector: product => product.ProductProductPhotos,
        resultSelector: (product, productProductPhoto) => new
        {
            Product = product.Name,
            Photo = productProductPhoto.ProductPhoto.LargePhotoFileName
        }); // Define query.
    // var productPhotos =
    //    from product in source
    //    from productProductPhoto in product.ProductProductPhotos
    //    select new { Product = product.Name, Photo = productProductPhoto.ProductPhoto.LargePhotoFileName };
    productPhotos.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product.ProductProductPhotos.ProductPhoto].[LargePhotoFileName]
    // FROM [Production].[Product] AS [product]
    // INNER JOIN [Production].[ProductProductPhoto] AS [product.ProductProductPhotos] ON [product].[ProductID] = [product.ProductProductPhotos].[ProductID]
    // INNER JOIN [Production].[ProductPhoto] AS [product.ProductProductPhotos.ProductPhoto] ON [product.ProductProductPhotos].[ProductPhotoID] = [product.ProductProductPhotos.ProductPhoto].[ProductPhotoID]
}
```

### Left outer join

GroupJoin is provided for left outer join. The following example have categories to left outer join subcategories with foreign key, and the results have all categories with or without matching subcategories. It is translated to LEFT JOIN:

```sql
internal static void LeftOuterJoinWithGroupJoin(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .GroupJoin(
            inner: inner,
            outerKeySelector: category => category.ProductCategoryID,
            innerKeySelector: subcategory => subcategory.ProductCategoryID,
            resultSelector: (category, subcategories) =>
                new { Category = category, Subcategories = subcategories }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    join subcategory in inner
    //    on category.ProductCategoryID equals subcategory.ProductCategoryID into subcategories
    //    select new { Category = category, Subcategories = subcategories };
    categorySubcategories.WriteLines(categorySubcategory =>
        $@"{categorySubcategory.Category.Name}: {string.Join(
            ", ", categorySubcategory.Subcategories.Select(subcategory => subcategory.Name))}"); // Execute query.
    // SELECT [category].[ProductCategoryID], [category].[Name], [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
    // FROM [Production].[ProductCategory] AS [category]
    // LEFT JOIN [Production].[ProductSubcategory] AS [subcategory] ON [category].[ProductCategoryID] = [subcategory].[ProductCategoryID]
    // ORDER BY [category].[ProductCategoryID]
}
```

GroupJoin returns hierarchical results. So here the translated SQL also sorts the result by the key, so that EF/Core can read the query results group by group. To have flattened results from GroupJoin, SelectMany can be called. As discussed in the LINQ to Objects chapter, an DefaultIfEmpty subquery is required (It becomes inner join if DefaultIfEmpty is missing). The following example has the same SQL translation as above, it just yields result by result instead of group by group.

```csharp
internal static void LeftOuterJoinWithGroupJoinAndSelectMany(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .GroupJoin(
            inner: inner,
            outerKeySelector: category => category.ProductCategoryID,
            innerKeySelector: subcategory => subcategory.ProductCategoryID,
            resultSelector: (category, subcategories) =>
                new { Category = category, Subcategories = subcategories }) // Define query.
        .SelectMany(
            collectionSelector: category => category.Subcategories
                .DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
            resultSelector: (category, subcategory) =>
                new { Category = category.Category, Subcategory = subcategory }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    join subcategory in inner
    //    on category.ProductCategoryID equals subcategory.ProductCategoryID into subcategories
    //    from subcategory in subcategories.DefaultIfEmpty()
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(categorySubcategory =>
        $"{categorySubcategory.Category.Name} {categorySubcategory.Subcategory?.Name}"); // Execute query.
}
```

Similar to inner join, left outer join can be done with Select and SelectMany too, with a DefaultIfEmpty subquery. The following queries have the same SQL translation:

```sql
internal static void LeftOuterJoinWithSelect(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .Select(category => new
        {
            Category = category,
            Subcategories = inner
                .Where(subcategory => category.ProductCategoryID == subcategory.ProductCategoryID)
        })
        .SelectMany(
            collectionSelector: category => category.Subcategories
                .DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
            resultSelector: (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    select new
    //    {
    //        Category = category,
    //        Subcategories = from subcategory in inner
    //                        where subcategory.ProductCategoryID == category.ProductCategoryID
    //                        select subcategory
    //    } into category
    //    from subcategory in category.Subcategories.DefaultIfEmpty()
    //    select new { Category = category.Category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
    // SELECT [category].[Name], [t1].[Name]
    // FROM [Production].[ProductCategory] AS [category]
    // CROSS APPLY (
    //    SELECT [t0].*
    //    FROM (
    //        SELECT NULL AS [empty]
    //    ) AS [empty0]
    //    LEFT JOIN (
    //        SELECT [subcategory0].*
    //        FROM [Production].[ProductSubcategory] AS [subcategory0]
    //        WHERE [category].[ProductCategoryID] = [subcategory0].[ProductCategoryID]
    //    ) AS [t0] ON 1 = 1
    // ) AS [t1]
}

internal static void LeftOuterJoinWithSelectMany(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    IQueryable<ProductSubcategory> inner = adventureWorks.ProductSubcategories;
    var categorySubcategories = outer
        .SelectMany(
            collectionSelector: category => inner
                .Where(subcategory => category.ProductCategoryID == subcategory.ProductCategoryID)
                .DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
            resultSelector: (category, subcategory) =>
                new { Category = category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    from subcategory in (from subcategory in inner
    //                         where category.ProductCategoryID == subcategory.ProductCategoryID
    //                         select subcategory).DefaultIfEmpty()
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
}
```

In EF Core, the above 2 queries are both translated to CROSS APPLY, but this is logically equivalent to LEFT JOIN of the GroupJoin example.

> In EF, these translation are the same LEFT OUTER JOIN as previous GroupJoin.

As demonstrated for inner join, in the above Select and SelectMany queries, the Where subquery is equivalent to collection navigation property. EF/Core support collection navigation property for left outer join with Select and SelectMany. The following queries are translated to the same LEFT JOIN query:

```sql
internal static void LeftOuterJoinWithSelectAndRelationship(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    var categorySubcategories = outer
        .Select(category => new { Category = category, Subcategories = category.ProductSubcategories })
        .SelectMany(
            collectionSelector: category => category.Subcategories
                .DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
            resultSelector: (category, subcategory) =>
                new { Category = category.Category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    select new { Category = category, Subcategories = category.ProductSubcategories } into category
    //    from subcategory in category.Subcategories.DefaultIfEmpty()
    //    select new { Category = category.Category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
    // SELECT [category].[Name] AS [Category], [category.ProductSubcategories].[Name] AS [Subcategory]
    // FROM [Production].[ProductCategory] AS [category]
    // LEFT JOIN [Production].[ProductSubcategory] AS [category.ProductSubcategories] ON [category].[ProductCategoryID] = [category.ProductSubcategories].[ProductCategoryID]
}

internal static void LeftOuterJoinWithSelectManyAndRelationship(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> outer = adventureWorks.ProductCategories;
    var categorySubcategories = outer.SelectMany(
        collectionSelector: category => category.ProductSubcategories
            .DefaultIfEmpty(), // INNER JOIN if DefaultIfEmpty is missing.
        resultSelector: (category, subcategory) =>
            new { Category = category.Name, Subcategory = subcategory.Name }); // Define query.
    // var categorySubcategories =
    //    from category in outer
    //    from subcategory in category.ProductSubcategories.DefaultIfEmpty()
    //    select new { Category = category.Name, Subcategory = subcategory.Name };
    categorySubcategories.WriteLines(); // Execute query.
}
```

### Cross join

Just like LINQ to Objects, cross join can be done with SelectMany and Join. The following example queries the expensive products (list price greater than 2000) and cheap products (list price less than 100), and then cross join them to get all possible product bundles, where each bundle has one expensive product and one cheap product:

```sql
internal static void CrossJoinWithSelectMany(AdventureWorks adventureWorks)
{
    IQueryable<Product> outer = adventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<Product> inner = adventureWorks.Products.Where(product => product.ListPrice < 100);
    var bundles = outer.SelectMany(
        collectionSelector: expensiveProduct => inner,
        resultSelector: (expensiveProduct, cheapProduct) =>
            new { Expensive = expensiveProduct.Name, Cheap = cheapProduct.Name }); // Define query.
    // var bundles =
    //    from outerProduct in outer
    //    from innerProduct in inner
    //    select new { Expensive = outerProduct.Name, Cheap = innerProduct.Name };
    bundles.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product0].[Name]
    // FROM [Production].[Product] AS [product]
    // CROSS JOIN [Production].[Product] AS [product0]
    // WHERE ([product].[ListPrice] > 2000.0) AND ([product0].[ListPrice] < 100.0)
}
```

The following implementation with Join is equivalent, just have the 2 key selectors always return equal values:

```sql
internal static void CrossJoinWithJoin(AdventureWorks adventureWorks)
{
    IQueryable<Product> outer = adventureWorks.Products.Where(product => product.ListPrice > 2000);
    IQueryable<Product> inner = adventureWorks.Products.Where(product => product.ListPrice < 100);
    var bundles = outer.Join(
        inner: inner,
        outerKeySelector: product => 1,
        innerKeySelector: product => 1,
        resultSelector: (outerProduct, innerProduct) =>
            new { Expensive = outerProduct.Name, Cheap = innerProduct.Name }); // Define query.
    // var bundles =
    //    from outerProduct in outer
    //    join innerProduct in inner
    //    on 1 equals 1
    //    select new { Expensive = outerProduct.Name, Cheap = innerProduct.Name };
    bundles.WriteLines(); // Execute query.
    // SELECT [product].[Name], [t].[Name]
    // FROM [Production].[Product] AS [product]
    // INNER JOIN (
    //    SELECT [product1].*
    //    FROM [Production].[Product] AS [product1]
    //    WHERE [product1].[ListPrice] < 100.0
    // ) AS [t] ON 1 = 1
    // WHERE [product].[ListPrice] > 2000.0
}
```

It is translated to INNER JOIN, which is equivalent to previous CROSS JOIN, with the same query plan.

### Concatenation

EF Core does not support Concat for entity.

> EF translates Concat to UNION ALL. The following example concatenates the cheap products and the expensive products, and query the products’ names:
> 
> ```sql
> internal static void ConcatEntity(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> first = adventureWorks.Products.Where(product => product.ListPrice < 100);
>     IQueryable<Product> second = adventureWorks.Products.Where(product => product.ListPrice > 2000);
>     IQueryable<string> concat = first
>         .Concat(second)
>         .Select(product => product.Name); // Define query.
>     concat.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    [UnionAll1].[Name] AS [C1]
>     //    FROM  (SELECT 
>     //        [Extent1].[Name] AS [Name]
>     //        FROM [Production].[Product] AS [Extent1]
>     //        WHERE [Extent1].[ListPrice] < cast(100 as decimal(18))
>     //    UNION ALL
>     //        SELECT 
>     //        [Extent2].[Name] AS [Name]
>     //        FROM [Production].[Product] AS [Extent2]
>     //        WHERE [Extent2].[ListPrice] > cast(2000 as decimal(18))) AS [UnionAll1]
> #else
>     // ArgumentException: Expression of type 'System.Collections.Generic.IEnumerable`1[Product]' cannot be used for parameter of type 'System.Collections.Generic.IEnumerable`1[Microsoft.EntityFrameworkCore.Storage.ValueBuffer]' of method 'System.Collections.Generic.IEnumerable`1[Microsoft.EntityFrameworkCore.Storage.ValueBuffer] Concat[ValueBuffer](System.Collections.Generic.IEnumerable`1[Microsoft.EntityFrameworkCore.Storage.ValueBuffer], System.Collections.Generic.IEnumerable`1[Microsoft.EntityFrameworkCore.Storage.ValueBuffer])' Parameter name: arg1
> #endif
> }
> ```

EF Core supports Concat for primitive type, locally. In the above example, Select is called after Concat. It is logically equivalent to call Select before Concat, which works in EF Core:

```sql
internal static void ConcatPrimitive(AdventureWorks adventureWorks)
{
    IQueryable<string> first = adventureWorks.Products
        .Where(product => product.ListPrice < 100)
        .Select(product => product.Name);
    IQueryable<string> second = adventureWorks.Products
        .Where(product => product.ListPrice > 2000)
        .Select(product => product.Name);
    IQueryable<string> concat = first.Concat(second); // Define query.
    concat.WriteLines(); // Execute query.
    // SELECT [product].[Name]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] < 100.0

    // SELECT [product0].[Name]
    // FROM [Production].[Product] AS [product0]
    // WHERE [product0].[ListPrice] > 2000.0
}
```

EF Core translates Concat’s 2 data sources to 2 SQL queries, reads the query results to local, and concatenates them locally.

> In EF, this above query has identical UNION ALL translation as the first Concat example.

### Set

Distinct works with entity type and primitive type. It is translated to the DISTINCT keyword:

```sql
internal static void DistinctEntity(AdventureWorks adventureWorks)
{
    IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
    IQueryable<ProductCategory> distinct = source
        .Select(subcategory => subcategory.ProductCategory)
        .Distinct(); // Define query.
    distinct.WriteLines(category => $"{category.ProductCategoryID}: {category.Name}"); // Execute query.
    // SELECT DISTINCT [subcategory.ProductCategory].[ProductCategoryID], [subcategory.ProductCategory].[Name]
    // FROM [Production].[ProductSubcategory] AS [subcategory]
    // INNER JOIN [Production].[ProductCategory] AS [subcategory.ProductCategory] ON [subcategory].[ProductCategoryID] = [subcategory.ProductCategory].[ProductCategoryID]
}

internal static void DistinctPrimitive(AdventureWorks adventureWorks)
{    IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
    IQueryable<int> distinct = source
        .Select(subcategory => subcategory.ProductCategoryID)
        .Distinct(); // Define query.
    distinct.WriteLines(); // Execute query.
    // SELECT DISTINCT [subcategory].[ProductCategoryID]
    // FROM [Production].[ProductSubcategory] AS [subcategory]
}
```

GroupBy returns groups with distinct keys, so in theory it can be used to query the same result as Distinct:

```sql
internal static void DistinctWithGroupBy(AdventureWorks adventureWorks)
{
    IQueryable<ProductSubcategory> source = adventureWorks.ProductSubcategories;
    IQueryable<int> distinct = source.GroupBy(
        keySelector: subcategory => subcategory.ProductCategoryID,
        resultSelector: (key, group) => key); // Define query.
    distinct.WriteLines(); // Execute query.
    // SELECT [subcategory].[ProductSubcategoryID], [subcategory].[Name], [subcategory].[ProductCategoryID]
    // FROM [Production].[ProductSubcategory] AS [subcategory]
    // ORDER BY [subcategory].[ProductCategoryID]
}
```

However, as fore mentioned, in EF Core, GroupBy executes locally. The above example only queries grouping keys, however it reads all rows of the table to local, which can be a performance issue.

> EF always execute queries remotely, so above GroupBy is properly translated to SELECT DISATINCT query.

GroupBy can also be used for more complex scenarios. The following example queries the full product entities with distinct list price:

```sql
internal static void DistinctWithGroupByAndFirstOrDefault(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<Product> distinct = source.GroupBy(
        keySelector: product => product.ListPrice,
        resultSelector: (key, group) => group.FirstOrDefault()); // Define query.
    distinct.WriteLines(); // Execute query.
    // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ListPrice]
}
```

Again, EF Core does not translate grouping to SQL. In this example, only 1 entities for each key is queried, but EF Core reads all rows to local, and execute the grouping logic locally.

> EF properly translates the above query to SELECT DISTINCT to query the unique keys, then outer applies each key to one row with OUTER APPLY:
> 
> ```sql
> SELECT 
>     [Limit1].[ProductID] AS [ProductID], 
>     [Limit1].[Name] AS [Name], 
>     [Limit1].[ListPrice] AS [ListPrice], 
>     [Limit1].[ProductSubcategoryID] AS [ProductSubcategoryID]
>     FROM   (SELECT DISTINCT 
>         [Extent1].[ListPrice] AS [ListPrice]
>         FROM [Production].[Product] AS [Extent1] ) AS [Distinct1]
>     OUTER APPLY  (SELECT TOP (1) 
>         [Extent2].[ProductID] AS [ProductID], 
>         [Extent2].[Name] AS [Name], 
>         [Extent2].[ListPrice] AS [ListPrice], 
>         [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID]
>         FROM [Production].[Product] AS [Extent2]
>         WHERE [Distinct1].[ListPrice] = [Extent2].[ListPrice] ) AS [Limit1]
> ```

EF Core supports Union for entity and primitive types locally.

> EF translates Union to Union ALL with SELECT DISTINCT, so eventually each result is unique.
> 
> ```sql
> internal static void UnionEntity(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> first = adventureWorks.Products
>         .Where(product => product.ListPrice > 100);
>     IQueryable<Product> second = adventureWorks.Products
>         .Where(product => product.ProductSubcategoryID == 1);
>     IQueryable<Product> union = first.Union(second); // Define query.
>     union.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    [Distinct1].[C1] AS [C1], 
>     //    [Distinct1].[C2] AS [C2], 
>     //    [Distinct1].[C3] AS [C3], 
>     //    [Distinct1].[C4] AS [C4], 
>     //    [Distinct1].[C5] AS [C5]
>     //    FROM ( SELECT DISTINCT 
>     //        [UnionAll1].[ProductID] AS [C1], 
>     //        [UnionAll1].[Name] AS [C2], 
>     //        [UnionAll1].[ListPrice] AS [C3], 
>     //        [UnionAll1].[ProductSubcategoryID] AS [C4]
>     //        FROM  (SELECT 
>     //            [Extent1].[ProductID] AS [ProductID], 
>     //            [Extent1].[Name] AS [Name], 
>     //            [Extent1].[ListPrice] AS [ListPrice], 
>     //            [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID]
>     //            FROM [Production].[Product] AS [Extent1]
>     //            WHERE [Extent1].[ListPrice] > cast(100 as decimal(18))
>     //        UNION ALL
>     //            SELECT 
>     //            [Extent2].[ProductID] AS [ProductID], 
>     //            [Extent2].[Name] AS [Name], 
>     //            [Extent2].[ListPrice] AS [ListPrice], 
>     //            [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID]
>     //            FROM [Production].[Product] AS [Extent2]
>     //            WHERE 1 = [Extent2].[ProductSubcategoryID]) AS [UnionAll1]
>     //    )  AS [Distinct1]
> #else
>     // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
>     // FROM [Production].[Product] AS [product]
>     // WHERE [product].[ListPrice] > 100.0
> 
>     // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
>     // FROM [Production].[Product] AS [product]
>     // [product0].[ProductSubcategoryID] = 1
> #endif
> }
> 
> internal static void UnionPrimitive(AdventureWorks adventureWorks)
> {
>     var first = adventureWorks.Products
>         .Where(product => product.ListPrice > 100)
>         .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
>     var second = adventureWorks.Products
>         .Where(product => product.ProductSubcategoryID == 1)
>         .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
>     var union = first.Union(second); // Define query.
>     union.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    [Distinct1].[C1] AS [C1], 
>     //    [Distinct1].[C2] AS [C2], 
>     //    [Distinct1].[C3] AS [C3]
>     //    FROM ( SELECT DISTINCT 
>     //        [UnionAll1].[C1] AS [C1], 
>     //        [UnionAll1].[Name] AS [C2], 
>     //        [UnionAll1].[ListPrice] AS [C3]
>     //        FROM  (SELECT 
>     //            1 AS [C1], 
>     //            [Extent1].[Name] AS [Name], 
>     //            [Extent1].[ListPrice] AS [ListPrice]
>     //            FROM [Production].[Product] AS [Extent1]
>     //            WHERE [Extent1].[ListPrice] > cast(100 as decimal(18))
>     //        UNION ALL
>     //            SELECT 
>     //            1 AS [C1], 
>     //            [Extent2].[Name] AS [Name], 
>     //            [Extent2].[ListPrice] AS [ListPrice]
>     //            FROM [Production].[Product] AS [Extent2]
>     //            WHERE 1 = [Extent2].[ProductSubcategoryID]) AS [UnionAll1]
>     //    )  AS [Distinct1]
> #else
>     // SELECT [product].[Name], [product].[ListPrice]
>     // FROM [Production].[Product] AS [product]
>     // WHERE [product].[ListPrice] > 100.0
> 
>     // SELECT [product0].[Name], [product0].[ListPrice]
>     // FROM [Production].[Product] AS [product0]
>     // WHERE [product0].[ProductSubcategoryID] = 1
> #endif
> }
> ```

EF Core executes Intersect and Except locally as well.

> EF translates Intersect to INTERSECT operator, and translates Except to EXCEPT operator:
> 
> ```sql
> internal static void IntersectEntity(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> first = adventureWorks.Products
>         .Where(product => product.ListPrice > 100);
>     IQueryable<Product> second = adventureWorks.Products
>         .Where(product => product.ListPrice < 2000);
>     IQueryable<Product> intersect = first.Intersect(second); // Define query.
>     intersect.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    [Intersect1].[ProductID] AS [C1], 
>     //    [Intersect1].[Name] AS [C2], 
>     //    [Intersect1].[ListPrice] AS [C3]
>     //    FROM  (SELECT 
>     //        [Extent1].[ProductID] AS [ProductID], 
>     //        [Extent1].[Name] AS [Name], 
>     //        [Extent1].[ListPrice] AS [ListPrice], 
>     //        [Extent1].[ProductSubcategoryID] AS [ProductSubcategoryID]
>     //        FROM [Production].[Product] AS [Extent1]
>     //        WHERE [Extent1].[ListPrice] > cast(100 as decimal(18))
>     //    INTERSECT
>     //        SELECT 
>     //        [Extent2].[ProductID] AS [ProductID], 
>     //        [Extent2].[Name] AS [Name], 
>     //        [Extent2].[ListPrice] AS [ListPrice], 
>     //        [Extent2].[ProductSubcategoryID] AS [ProductSubcategoryID]
>     //        FROM [Production].[Product] AS [Extent2]
>     //        WHERE [Extent2].[ListPrice] < cast(2000 as decimal(18))) AS [Intersect1]
> #else
>     // SELECT [product0].[ProductID], [product0].[ListPrice], [product0].[Name], [product0].[ProductSubcategoryID]
>     // FROM [Production].[Product] AS [product0]
>     // WHERE [product0].[ListPrice] < 2000.0
> 
>     // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
>     // FROM [Production].[Product] AS [product]
>     // WHERE [product].[ListPrice] > 100.0
> #endif
> }
> 
> internal static void ExceptPrimitive(AdventureWorks adventureWorks)
> {
>     var first = adventureWorks.Products
>         .Where(product => product.ListPrice > 100)
>         .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
>     var second = adventureWorks.Products
>         .Where(product => product.ListPrice > 2000)
>         .Select(product => new { Name = product.Name, ListPrice = product.ListPrice });
>     var except = first.Except(second); // Define query.
>     except.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //    [Except1].[C1] AS [C1], 
>     //    [Except1].[Name] AS [C2], 
>     //    [Except1].[ListPrice] AS [C3]
>     //    FROM  (SELECT 
>     //        1 AS [C1], 
>     //        [Extent1].[Name] AS [Name], 
>     //        [Extent1].[ListPrice] AS [ListPrice]
>     //        FROM [Production].[Product] AS [Extent1]
>     //        WHERE [Extent1].[ListPrice] > cast(100 as decimal(18))
>     //    EXCEPT
>     //        SELECT 
>     //        1 AS [C1], 
>     //        [Extent2].[Name] AS [Name], 
>     //        [Extent2].[ListPrice] AS [ListPrice]
>     //        FROM [Production].[Product] AS [Extent2]
>     //        WHERE [Extent2].[ListPrice] > cast(2000 as decimal(18))) AS [Except1]
> #else
>     // SELECT [product0].[Name], [product0].[ListPrice]
>     // FROM [Production].[Product] AS [product0]
>     // WHERE [product0].[ListPrice] > 2000.0
> 
>     // SELECT [product].[Name], [product].[ListPrice]
>     // FROM [Production].[Product] AS [product]
>     // WHERE [product].[ListPrice] > 100.0
> #endif
> }
> ```

### Partitioning

Skip is translate to OFFSET filter:

```sql
internal static void Skip(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<string> names = source
        .Select(product => product.Name)
        .Skip(10); // Define query.
    names.WriteLines(); // Execute query.
    // exec sp_executesql N'SELECT [product].[Name]
    // FROM [Production].[Product] AS [product]
    // ORDER BY (SELECT 1)
    // OFFSET @__p_0 ROWS',N'@__p_0 int',@__p_0=10
}
```

In SQL, OFFSET is considered to be a part of the ORDER BY clause, so here EF Core generates ORDERBY (SELECT 1) clause.

> EF does not automatically generate ORDER BY clause, and the above query throws NotSupportedException: The method 'Skip' is only supported for sorted input in LINQ to Entities. The method 'OrderBy' must be called before the method 'Skip'. The following is the equivalent query works in both EF Core and EF:
> 
> ```csharp
> internal static void OrderByAndSkip(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> source = adventureWorks.Products;
>     IQueryable<string> names = source
>         .Select(product => product.Name)
>         .OrderBy(product => 1)
>         .Skip(10); // Define query.
>     names.WriteLines(); // Execute query.
> }
> ```

When Take is called without Skip, it is translate to TOP filter:

```sql
internal static void Take(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<string> products = source
        .Take(10)
        .Select(product => product.Name); // Define query.
    products.WriteLines(); // Execute query.
    // exec sp_executesql N'SELECT [t].[Name]
    // FROM (
    //    SELECT TOP(@__p_0) [p0].*
    //    FROM [Production].[Product] AS [p0]
    // ) AS [t]',N'@__p_0 int',@__p_0=10
}
```

When Take is called with Skip, they are translated to FETCH and OFFSET filters:

```sql
internal static void SkipAndTake(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<string> products = source
        .OrderBy(product => product.Name)
        .Skip(20)
        .Take(10)
        .Select(product => product.Name); // Define query.
    products.WriteLines(); // Execute query.
    // exec sp_executesql N'SELECT [t].[Name]
    // FROM (
    //    SELECT [product0].*
    //    FROM [Production].[Product] AS [product0]
    //    ORDER BY [product0].[Name]
    //    OFFSET @__p_0 ROWS FETCH NEXT @__p_1 ROWS ONLY
    // ) AS [t]',N'@__p_0 int,@__p_1 int',@__p_0=20,@__p_1=10
}
```

> The above OrderBy is required for Skip and Take only in EF.

### Ordering

OrderBy/OrderByDescending are translated to ORDER BY clause with without/with DESC, for example:

```sql
internal static void OrderBy(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var products = source
        .OrderBy(product => product.ListPrice)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ListPrice]
}

internal static void OrderByDescending(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var products = source
        .OrderByDescending(product => product.ListPrice)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ListPrice] DESC
}
```

To sort with multiple keys, call OrderBy/OrderByDescending and ThenBy/ThenByDescending:

```sql
internal static void OrderByAndThenBy(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var products = source
        .OrderBy(product => product.ListPrice)
        .ThenBy(product => product.Name)
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ListPrice], [product].[Name]
}
```

In EF Core, when the key selector returns anonymous type to sort by multiple keys, the sorting is executed locally:

```sql
internal static void OrderByMultipleKeys(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var products = source
        .OrderBy(product => new { ListPrice = product.ListPrice, Name = product.Name })
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // ORDER BY (SELECT 1)
}
```

> In EF, similar to GroupBy/Join/GroupJoin, the ordering query methods’ key selector returning anonymous type is properly translated. The above query is translated to:
> 
> ```sql
> SELECT 
>     [Project1].[C1] AS [C1], 
>     [Project1].[Name] AS [Name], 
>     [Project1].[ListPrice] AS [ListPrice]
>     FROM ( SELECT 
>         [Extent1].[Name] AS [Name], 
>         [Extent1].[ListPrice] AS [ListPrice], 
>         1 AS [C1]
>         FROM [Production].[Product] AS [Extent1]
>     )  AS [Project1]
>     ORDER BY [Project1].[ListPrice] ASC, [Project1].[Name] ASC
> ```

Multiple OrderBy/OrderByDescending calls are translated to SQL reversely. The following example sort all products by list price, then sort all products again by subcategory, which is equivalent to sort all products by subcategory first, then sort products in the same subcategory by list price:

```sql
internal static void OrderByAndOrderBy(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var products = source
        .OrderBy(product => product.ListPrice)
        .OrderBy(product => product.ProductSubcategoryID)
        .Select(product => new
        {
            Name = product.Name,
            ListPrice = product.ListPrice,
            Subcategory = product.ProductSubcategoryID
        }); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name], [product].[ListPrice], [product].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [product]
    // ORDER BY [product].[ProductSubcategoryID], [product].[ListPrice]
}
```

> In the above example, EF only translates the last OrderBy call, and ignore the others.

### Conversion

Cast can work with entity type. The following example casts base entity to derived entity:

```sql
internal static void CastEntity(AdventureWorks adventureWorks)
{
    IQueryable<TransactionHistory> source = adventureWorks.Transactions;
    IQueryable<TransactionHistory> transactions = source
        .Where(product => product.ActualCost > 500)
        .Cast<SalesTransactionHistory>(); // Define query.
    transactions.WriteLines(transaction =>
        $"{transaction.GetType().Name}: {transaction.TransactionDate}"); // Execute query.
    // SELECT [product].[TransactionID], [product].[ActualCost], [product].[ProductID], [product].[Quantity], [product].[TransactionDate], [product].[TransactionType]
    // FROM [Production].[TransactionHistory] AS [product]
    // WHERE [product].[TransactionType] IN (N'W', N'S', N'P') AND ([product].[ActualCost] > 500.0)
}
```

EF Core does not support Cast for primitive type.

> EF does not support casting entity type. The above query throws NotSupportedException: Unable to cast the type 'TransactionHistory' to type 'SalesTransactionHistory'. LINQ to Entities only supports casting EDM primitive or enumeration types. EF supports casting primitive type. The following example casts decimal to string, which is translated to CAST function call, casting money to (nvarchar(MAX)):
> 
> ```sql
> internal static void CastPrimitive(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> source = adventureWorks.Products;
>     IQueryable<string> listPrices = source
>         .Select(product => product.ListPrice)
>         .Cast<string>(); // Define query.
>     listPrices.WriteLines(); // Execute query.
> #if EF
>     // SELECT 
>     //     CAST( [Extent1].[ListPrice] AS nvarchar(max)) AS [C1]
>     //    FROM [Production].[Product] AS [Extent1]
> #else
>     // InvalidOperationException: No coercion operator is defined between types 'System.Decimal' and 'System.String'.
> #endif
> }
> ```

Queryable has a new query method, AsQueryable, which accepts IEnumerable<T> and returns IQueryable<T>. Remember Enumerable.AsEnumerable can convert more derived sequence (like List<T>, IQueryable<T>, etc.) to IEnumerable<T>. So the Queryable.AsQueryable/Eumerable.AsEnumerable methods look familiar to the ParallelEnumerable.AsParallel/ParallelEnumerable.AsSequential methods, which convert between sequential and parallel local queries at any point. However, AsQueryable/AsEnumerable usually do not convert freely between local and remote queries. The following is the implementation of AsEnumerable and AsQueryable:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> AsEnumerable<TSource>(this IEnumerable<TSource> source) => source;
    }

    public static class Queryable
    {
        public static IQueryable<TElement> AsQueryable<TElement>(this IEnumerable<TElement> source) =>
            source as IQueryable<TElement> ?? new EnumerableQuery<TElement>(source);
    }
}
```

AsQueryable accepts an IEnumerable<T> source. If the source is indeed an IQueryable<T> source, then do nothing and just return it; if not, wrap the source into an System.Linq.EnumerableQuery<T> instance, and return it. EnumerableQuery<T> is a special implementation of IQueryable<T>. If an IQueryable<T> query is an EnumerableQuery<T> instance, when this query is executed, it internally calls System.Linq.EnumerableRewriter to translate itself to local query, then execute the translated query locally. For example, AdventureWorks.Products return IQueryable<Product>, which is actually a DbSet<T> instance, so calling AsQueryable with AdventureWorks.Products does nothing and returns the DbSet<Product> instance itself, which can have its following query method calls to be translated to SQL by EF Core. In contrast, calling AsQueryable with a T\[\] array returns an EnumerableQuery<T> wrapper, which is a local mocking of remote query and can have its following query methods to be translated to local queries, As a result, AsEnumerable can always convert a remote LINQ to Entities query to local LINQ to Objects query, but AsQueryable cannot always convert arbitrary local LINQ to Objects query to a remote LINQ to Entities query (and logically, an arbitrary local .NET data source cannot be converted to a remote data source like SQL database). For example:

```sql
internal static void AsEnumerableAsQueryable(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var remoteAndLocal = source // DbSet<T>.
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }) // Return EntityQueryable<T>.
        .AsEnumerable() // Do nothing. Directly return the EntityQueryable<T> source.
        .Where(product => product.ListPrice > 0) // Enumerable.Where. Return a generator wrapping the EntityQueryable<T> source.
        .AsQueryable() // Return an EnumerableQuery<T> instance wrapping the source generator.
        .OrderBy(product => product.Name); // Queryable.OrderBy. Return EnumerableQuery<T>.
    remoteAndLocal.WriteLines();
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]

    var remote = source // DbSet<T>.
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice }) // Return EntityQueryable<T>.
        .AsEnumerable() // Do nothing. Directly return the EntityQueryable<T> source.
        .AsQueryable() // Do nothing. Directly return the EntityQueryable<T> source.
        .Where(product => product.ListPrice > 0) // Still LINQ to Entities. Return EntityQueryable<T>.
        .OrderBy(product => product.Name); // Still LINQ to Entities. Return EntityQueryable<T>.
    remote.WriteLines();
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] > 0.0
    // ORDER BY [product].[Name]
}
```

In the first query, the LINQ to Entities source is chained with Select, then AsEnumerable returns IEnumerable<T>, so the following Where is Enumerable.Where, and it returns a generator. Then AsQueryable detects if the generator is IQueryable<T>. Since the generator is not IQueryable<T>, AsQueryable returns a EnumerableQuery<T> wrapper, which can have the following OrderBy translated to local query. So in this entire query chaining, only Select, which is before AsEnumerable, can be translated to SQL and executed remotely, all the other query methods are executed locally.

-   The source is a DbSet<T> instance, which implements IQueryable<T> and represents the LINQ to Entities data source - rows in remote SQL database table.
-   Queryable.Select is called on DbSet<T> source, in this case it returns a Microsoft.EntityFrameworkCore.Query.Internal.EntityQueryable<T> instance in EF Core (System.Data.Entity.DbQuery<T> instance in EF), which implements IQueryable<T> and represents LINQ to Entities query.
-   Enumerable.AsEnumerable does nothing and directly returns its source, the EntityQueryable<T> (DbQuery<T> for EF) instance
-   Enumerable.Where is called, since AsEnumerable returns IEnumerable<T> type. Where returns a generator wrapping its source, the EntityQueryable<T> (DbQuery<T> for EF) instance.
-   Queryable.AsQueryable is called. Its source, the generator from Where, implements IEnumerable<T>, not IQueryable<T>, so AsQueryable return an EnumerableQuery<T> instance wrapping the generator. As fore mentioned, EnumerableQuery<T> has nothing to do with database.
-   Queryable.OrderBy is called with EnumerableQuery<T> instance, in this case it returns another EnumerableQuery<T> instance, which has nothing to do with database either.

So the first query is a hybrid query. When it is executed, only Select is remote LINQ to Entities query and is translated to SQL. After AsEnumerable, Where goes local, then AsQueryable cannot convert back to remote LINQ to Entities query anymore. So, Where and OrderBy are both local queries, and not translated to SQL.

The second query is a special case, where AsEnumerable is chained with AsQueryable right away. In this case, AsEnumerable and AsQueryable both do nothing at all. The following Where and OrderBy are both LINQ to Entities queries, and translated to SQL along with Select.

> In EF, AsEnumerable can be useful for special case. As fore mentioned, in EF, Select does not support entity type. With AsEnumerable, this can be done with LINQ to Objects:
> 
> ```sql
> internal static void SelectLocalEntity(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> source = adventureWorks.Products;
>     IEnumerable<Product> products = source
>         .Where(product => product.ListPrice > 1_000) // LINQ to Entities.
>         .AsEnumerable() // Do nothing.
>         .Select(product => new Product()
>         {
>             ProductID = product.ProductID,
>             Name = product.Name
>         }); // LINQ to Objects: Enumerable.Select>. Return a generator.
>     products.WriteLines(product => $"{product.ProductID}: {product.Name}"); // Execute query.
>     // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
>     // FROM [Production].[Product] AS [product]
>     // WHERE [product].[ListPrice] > 1000.0
> }
> ```

## Value query

Query methods in this category accepts an IQueryable<T> source and returns a single value. When they are called at the end of a LINQ to Entities query, they executes the query immediately.

> In EF, value queries can be used in the subqueries of the above sequence queries. For example, as demonstrated above, the aggregation subquery of GroupBy flattens hierarchical data, which is translated to SQL aggregation function with GROUP BY.

### Element

First and FirstOrDefault execute the LINQ to Entities queries immediately. They are translated to TOP(1) filter in the SELECT clause. If a predicate is provided, the predicate is translated to WHERE clause. For example:

```sql
internal static void First(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    string first = source
        .Select(product => product.Name)
        .First() // Execute query.
        .WriteLine();
    // SELECT TOP(1) [product].[Name]
    // FROM [Production].[Product] AS [product]
}

internal static void FirstOrDefault(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var firstOrDefault = source
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice })
        .FirstOrDefault(product => product.ListPrice > 5000); // Execute query.
    firstOrDefault?.Name.WriteLine();
    // SELECT TOP(1) [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] > 5000.0
}
```

As discussed in LINQ to Objects, Single and SingleOrDefault are more strict. They are translated to TOP(2) filter, so that, if there are 0 or more than 1 results, InvalidOperationException is thrown. Similar to First and FirstOrDefault, if a predicate is provided, it is translated to WHERE clause:

```sql
internal static void Single(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var single = source
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice })
        .Single(product => product.ListPrice < 50); // Execute query.
    $"{single.Name}: {single.ListPrice}".WriteLine();
    // SELECT TOP(2) [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] < 50.0
}

internal static void SingleOrDefault(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var singleOrDefault = source
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice })
        .SingleOrDefault(product => product.ListPrice < 1); // Execute query.
    singleOrDefault?.Name.WriteLine();
    // SELECT TOP(2) [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] < 1.0
}
```

EF Core supports Last and LastOrDefault, locally. Again, if a predicate is provided, it is translated to WHERE clause:

```sql
internal static void Last(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    Product last = source.Last(); // Execute query.
    // SELECT [p].[ProductID], [p].[ListPrice], [p].[Name], [p].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [p]
    $"{last.Name}: {last.ListPrice}".WriteLine();
}

internal static void LastOrDefault(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    var lastOrDefault = source
        .Select(product => new { Name = product.Name, ListPrice = product.ListPrice })
        .LastOrDefault(product => product.ListPrice <= 0); // Execute query.
    // SELECT [product].[Name], [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] <= 0.0
    (lastOrDefault == null).WriteLine(); // True
}
```

The above examples can read many results from remote database to locally, and try to query the last result locally, which can be a performance issue.

> EF does not support Last or LastOrDefault, and the above queries throw NotSupportedException.

### Aggregation

Count/LongCount are translated to SQL aggregate functions COUNT/COUNT\_BIG. if a is provided, it is translated to WHERE clause. The following examples query the System.Int32 count of categories, and the System.Int64 count of the products with list price greater than 0:

```sql
internal static void Count(AdventureWorks adventureWorks)
{
    IQueryable<ProductCategory> source = adventureWorks.ProductCategories;
    int count = source.Count().WriteLine(); // Execute query.
    // SELECT COUNT(*)
    // FROM [Production].[ProductCategory] AS [p]
}

internal static void LongCount(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    long longCount = source.LongCount(product => product.ListPrice > 0).WriteLine(); // Execute query.
    // SELECT COUNT_BIG(*)
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] > 0.0
}
```

Max/Min/Sum are translated to MAX/MIN/SUM functions. The following examples query the latest ModifiedDate of photos, the lowest list price of products, and the total cost of transactions:

```sql
internal static void Max(AdventureWorks adventureWorks)
{
    IQueryable<ProductPhoto> source = adventureWorks.ProductPhotos;
    DateTime max = source.Select(photo => photo.ModifiedDate).Max().WriteLine(); // Execute query.
    // SELECT MAX([photo].[ModifiedDate])
    // FROM [Production].[ProductPhoto] AS [photo]
}

internal static void Min(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    decimal min = source.Min(product => product.ListPrice).WriteLine(); // Execute query.
    // SELECT MIN([product].[ListPrice])
    // FROM [Production].[Product] AS [product]
}

internal static void Sum(AdventureWorks adventureWorks)
{
    IQueryable<TransactionHistory> source = adventureWorks.Transactions;
    decimal sum = source.Sum(transaction => transaction.ActualCost).WriteLine(); // Execute query.
    // SELECT SUM([transaction].[ActualCost])
    // FROM [Production].[TransactionHistory] AS [transaction]
    // WHERE ([transaction].[TransactionType] = N'W') OR (([transaction].[TransactionType] = N'S') OR ([transaction].[TransactionType] = N'P'))
}
```

EF Core support Average locally.

```sql
internal static void Average(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    decimal average = source.Select(product => product.ListPrice).Average().WriteLine(); // Execute query.
    // SELECT [product].[ListPrice]
    // FROM [Production].[Product] AS [product]
}
```

> EF translates Average to AVG function. In EF, the above query is translated to:
> 
> ```sql
> SELECT 
>     [GroupBy1].[A1] AS [C1]
>     FROM ( SELECT 
>         AVG([Extent1].[ListPrice]) AS [A1]
>         FROM [Production].[Product] AS [Extent1]
>     )  AS [GroupBy1]
> ```

### Quantifier

EF Core supports Contains for entity type, locally.

```sql
internal static void ContainsEntity(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    Product single = source.Single(product => product.ListPrice == 20.24M); // Execute query.
    // SELECT TOP(2) [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ListPrice] = 20.24
    bool contains = source
        .Where(product => product.ProductSubcategoryID == 7)
        .Contains(single).WriteLine(); // Execute query.
    // SELECT [product].[ProductID], [product].[ListPrice], [product].[Name], [product].[ProductSubcategoryID]
    // FROM [Production].[Product] AS [product]
    // WHERE [product].[ProductSubcategoryID] = 7
}
```

> EF does not support Contains for entity type. The above query throws NotSupportedException: Unable to create a constant value of type 'Product'. Only primitive types or enumeration types are supported in this context.

EF/Core both support Contains for primitive types. In this case, Contains is translated to EXISTS predicate:

```sql
internal static void ContainsPrimitive(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    bool contains = source
        .Select(product => product.ListPrice).Contains(100)
        .WriteLine(); // Execute query.
    // SELECT CASE
    //    WHEN EXISTS (
    //        SELECT 1
    //        FROM [Production].[Product] AS [product]
    //        WHERE [product].[ListPrice] = 100.0)
    //    THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    // END
}
```

Any is also translated to EXISTS. If predicate is provided, it is translated to WHERE clause:

```sql
internal static void Any(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    bool any = source.Any().WriteLine(); // Execute query.
    // SELECT CASE
    //    WHEN EXISTS (
    //        SELECT 1
    //        FROM [Production].[Product] AS [p])
    //    THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    // END
}

internal static void AnyWithPredicate(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    bool any = source.Any(product => product.ListPrice > 10).WriteLine(); // Execute query.
    // SELECT CASE
    //    WHEN EXISTS (
    //        SELECT 1
    //        FROM [Production].[Product] AS [product]
    //        WHERE [product].[ListPrice] > 10.0)
    //    THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    // END
}
```

All is translated to NOT EXISTS, with the predicate translated to reverted condition in WHERE clause:

```sql
internal static void AllWithPredicate(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    bool all = source.All(product => product.ListPrice > 10).WriteLine(); // Execute query.
    // SELECT CASE
    //    WHEN NOT EXISTS (
    //        SELECT 1
    //        FROM [Production].[Product] AS [product]
    //        WHERE [product].[ListPrice] <= 10.0)
    //    THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT)
    // END
}
```