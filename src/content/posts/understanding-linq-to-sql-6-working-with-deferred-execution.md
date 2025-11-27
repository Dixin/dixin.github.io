---
title: "Understanding LINQ to SQL (6) Working With Deferred Execution"
published: 2010-04-19
description: "\\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to SQL", "LINQ via C# Series", "SQL Server", "TSQL"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

Similar with LINQ to Objects, LINQ to SQL supports deferred execution when possible. For example:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Category> source = database.Categories;

    // Query is deferred.
    IQueryable<Category> results = source.Where(category => category.CategoryID < 5);

    // Foreaches the IQueryable<Category> object, which implements IEnumerable<Category>.
    // Query is starting translaion and execution.
    using (IEnumerator<Category> iterator = results.GetEnumerator())
    {
        // The data is pulled from SQL Server to memory.
        while (iterator.MoveNext()) // Iterats the data.
        {
            Category item = iterator.Current;
            Console.WriteLine("Category {0}: {1}", item.CategoryID, item.CategoryName);
        }
    }
}
```

The execution can be traced in SQL Server Profiler.

When a query is impossible to be deferred, the eager execution is applied, like aggregation, etc.:
```
IQueryable<Category> source = database.Categories;

// It is impossible to defer the execution.
Category result = source.Single(category => category.CategoryID == 1);
```

The above code results a single item from the source, which cannot be deferred.

## Deferred execution and DataContext

Since LINQ to SQL queries work against Table<T>s on DataContext, DataContext affects the execution of queries a lot.

While designing applications, the data access and UI code are usually separated:
```
internal static class DataAccess
{
    internal static IEnumerable<string> GetCategoryNames(params int[] ids)
    {
        using (NorthwindDataContext database = new NorthwindDataContext())
        {
            IQueryable<Category> source = database.Categories;
            return source.Where(category => ids.Contains(category.CategoryID))
                         .Select(category => category.CategoryName);
        }
    }
}

internal static class UI
{
    internal static void Print()
    {
        IEnumerable<string> names = DataAccess.GetCategoryNames(1, 2, 3);
        foreach (string name in names)
        {
            Console.WriteLine(name);
        }
    }
}
```

Here the LINQ to SQL data access code and UI interactive code are decoupled, which looks very nice. But invoking UI.Print() always throws an ObjectDisposedException:

> Cannot access a disposed object. Object name: 'DataContext accessed after Dispose.'.

This is because, when DataAccess.GetCategoryNames() returns, the query is not executed yet, but the DataContext object within the method is disposed. Later, when iterating the names, trying to execute the query definitely fails because there is no DataContext available.

Logically there are 2 ways to avoid this kind of problem:

-   either always execute the query before DataContext object is disposed;
-   or always the DataContext object is disposed after the query execution.

Here the first way is the simplest:
```
internal static IEnumerable<string> GetCategoryNames(params int[] ids)
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        IQueryable<Category> source = database.Categories;
        return source.Where(category => ids.Contains(category.CategoryID))
                     .Select(category => category.CategoryName)
                     .ToArray(); // Eager execution before disposing.
    }
}
```

Here the LINQ to Objects query method ToArray() [converts the cold IEnumerable<T> to a hot IEnumerable<T>](/posts/understanding-linq-to-objects-7-query-methods-internals), so that the query is executed immediately.

The other solutions will be explained in later posts.

## Deferred execution and eager loading

I saw the following kind of design from some production code:
```
internal static class DataAccess
{
    internal static IQueryable<Category> GetCategories()
    {
        NorthwindDataContext database = new NorthwindDataContext();
        return database.Categories;
        // DataContext is not disposed
        // to make the returned IQueryable<Category> still available
        // outside the scope of this method.
    }
}

internal static class UI
{
    internal static void Print()
    {
        IQueryable<Category> categories = DataAccess.GetCategories();

        foreach (Category category in categories)
        // This foreach cause the query executed.
        // Now the data of categories are pulled from SQL Server to memory.
        {
            Console.WriteLine(
                "Category {0}: {1}", 
                category.CategoryID, 
                category.CategoryName);
            
            // Eagerly loads the associated data through the foreign key.
            foreach (Product product in category.Products)
            // This foreach causes a new query executed through the association.
            // Now the data of products are pulled.
            {
                Console.WriteLine(
                    "    Product {0}: {1}",
                    product.ProductID,
                    product.ProductName);
            }
        }
    }
}
```

Invoking UI.Print() prints:

> Category 1: Beverages Product 1: Chai Product 2: Chang Product 24: Guaraná Fantástica Product 34: Sasquatch Ale Product 35: Steeleye Stout Product 38: Côte de Blaye Product 39: Chartreuse verte Product 43: Ipoh Coffee Product 67: Laughing Lumberjack Lager Product 70: Outback Lager Product 75: Rhönbräu Klosterbier Product 76: Lakkalikööri Category 2: Condiments Product 3: Aniseed Syrup Product 4: Chef Anton's Cajun Seasoning Product 5: Chef Anton's Gumbo Mix Product 6: Grandma's Boysenberry Spread Product 8: Northwoods Cranberry Sauce Product 15: Genen Shouyu Product 44: Gula Malacca Product 61: Sirop d'érable Product 63: Vegie-spread Product 65: Louisiana Fiery Hot Pepper Sauce Product 66: Louisiana Hot Spiced Okra Product 77: Original Frankfurter grüne Soße Category 3: Confections Product 16: Pavlova Product 19: Teatime Chocolate Biscuits Product 20: Sir Rodney's Marmalade Product 21: Sir Rodney's Scones Product 25: NuNuCa Nuß-Nougat-Creme
> 
> …

which looks well. But profiling shows N + 1 translated SQLs, where N is the number of categories. This is so horrible:

```sql
-- Queries categories.
SELECT [t0].[CategoryID], [t0].[CategoryName], [t0].[Description], [t0].[Picture]
FROM [dbo].[Categories] AS [t0]

-- Queries products of the first category through the association (foreign key).
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] = @p0',N'@p0 int',@p0=1

-- Queries products of the second category.
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] = @p0',N'@p0 int',@p0=2

-- ...

-- Queries products of the last category.
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] = @p0',N'@p0 int',@p0=8
```

So improper usage of deferred execution also causes performance issues:

-   When DataAccess.GetCategories() returns, the execution of query (return database.Categories) is deferred;
-   The outer foreach cause the query executed. But at this point LINQ to SQL cannot know products of each category are also expected to query through the association (foreign key);
-   Each inner foreach causes one query executed for current category’s products.

One possible solution is, make up a LEFT JOIN query to retrieve all the data, and use LINQ to Objects to project the items to a Category collection:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    return database.Products
                   // Queries all needed data with one single LEFT JOIN.
                   .Select(product => new
                        {
                            Product = new
                                {
                                    ProductID = product.ProductID,
                                    ProductName = product.ProductName
                                    // Other fields, if needed.
                                },
                            Category = new
                                {
                                    CategoryID = product.Category.CategoryID,
                                    CategoryName = product.Category.CategoryName
                                    // Other fields, if needed.
                                }
                        })
                   // Then goes to LINQ to Objects for projection.
                   .AsEnumerable() 
                   .GroupBy(item => item.Category)
                   .Select(group =>
                        {
                            Category category = new Category()
                                {
                                    CategoryID = group.Key.CategoryID,
                                    CategoryName = group.Key.CategoryName
                                };
                            category.Products.AddRange(group.Select(item => new Product()
                                {
                                    ProductID = item.Product.ProductID,
                                    ProductName = item.Product.ProductName
                                }));
                            return category;
                        })
                   .ToArray(); // Eager execution before disposing.
}
```

The translated SQL is a clean LEFT JOIN as expected:

```sql
SELECT [t0].[ProductID], [t0].[ProductName], [t1].[CategoryID], [t1].[CategoryName]
FROM [dbo].[Products] AS [t0]
LEFT OUTER JOIN [dbo].[Categories] AS [t1] ON [t1].[CategoryID] = [t0].[CategoryID]
```

But this kind of code is horribly noisy. For example, in the above LEFT JOIN query, when constructing the anonymous type its properties (fields) should be specified one by one. If 50 fields are needed to query, the coding will be crazy!

### DataLoadOptions.LoadWith()

The easiest solution for this kind of eager loading is using DataLoadOptions and its LoadWith() method:
```
internal static IEnumerable<Category> GetCategories()
{
    using (NorthwindDataContext database = new NorthwindDataContext())
    {
        DataLoadOptions options = new DataLoadOptions();
        options.LoadWith<Category>(category => category.Products);
        database.LoadOptions = options;
        return database.Categories.ToArray(); // Eager execution before disposing. 
    }
}
```

After refactoring, the query execution is only translated to one single SQL:

```sql
SELECT [t0].[CategoryID], [t0].[CategoryName], [t0].[Description], [t0].[Picture], [t1].[ProductID], [t1].[ProductName], [t1].[SupplierID], [t1].[CategoryID] AS [CategoryID2], [t1].[QuantityPerUnit], [t1].[UnitPrice], [t1].[UnitsInStock], [t1].[UnitsOnOrder], [t1].[ReorderLevel], [t1].[Discontinued], (
    SELECT COUNT(*)
    FROM [dbo].[Products] AS [t2]
    WHERE [t2].[CategoryID] = [t0].[CategoryID]
    ) AS [value]
FROM [dbo].[Categories] AS [t0]
LEFT OUTER JOIN [dbo].[Products] AS [t1] ON [t1].[CategoryID] = [t0].[CategoryID]
ORDER BY [t0].[CategoryID], [t1].[ProductID]
```

### DataLoadOptions.AssociateWith()

There is another useful method on DataLoadOptions, AssociateWith(). It specifies further query conditions on the eager-loaded associated objects, like restriction, ordering, etc.:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    DataLoadOptions options = new DataLoadOptions();
    options.AssociateWith<Category>(category => category.Products.Where(product => product.UnitPrice < 10));
    options.LoadWith<Category>(category => category.Products);
    database.LoadOptions = options;
    return database.Categories.ToArray(); // Eager execution before disposing. 
}
```

This time the translated SQL is:

```sql
exec sp_executesql N'SELECT [t0].[CategoryID], [t0].[CategoryName], [t0].[Description], [t0].[Picture], [t1].[ProductID], [t1].[ProductName], [t1].[SupplierID], [t1].[CategoryID] AS [CategoryID2], [t1].[QuantityPerUnit], [t1].[UnitPrice], [t1].[UnitsInStock], [t1].[UnitsOnOrder], [t1].[ReorderLevel], [t1].[Discontinued], (
    SELECT COUNT(*)
    FROM [dbo].[Products] AS [t2]
    WHERE ([t2].[UnitPrice] < @p0) AND ([t2].[CategoryID] = ([t0].[CategoryID]))
    ) AS [value]
FROM [dbo].[Categories] AS [t0]
LEFT OUTER JOIN [dbo].[Products] AS [t1] ON ([t1].[UnitPrice] < @p0) AND ([t1].[CategoryID] = ([t0].[CategoryID]))
ORDER BY [t0].[CategoryID], [t1].[ProductID]',N'@p0 decimal(33,4)',@p0=10.0000
```

### DataContext.DeferredLoadingEnabled

As fore mentioned, deferred loading is enabled by default:

-   When accessing one entity, its associated entities are not loaded.
-   When accessing its associated entities, they are loaded.
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    database.DeferredLoadingEnabled = true; // By default and not needed.
    Product product = database.Products.First(); // product.Category is not loaded.
    Console.WriteLine(product.Category.CategoryName); // product.Category is loaded.
}
```

It can be turned off by setting DataContext.DeferredLoadingEnabled to false:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    database.DeferredLoadingEnabled = false;
    Product product = database.Products.First();
    Console.WriteLine(product.Category.CategoryName); // NullReferenceException.
}
```

This time when accessing product.Category, it will not be loaded so it is null.

Please notice that, DataContext.DeferredLoadingEnabled will be affected by DataContext.ObjectTrackingEnabled, just as [MSDN said](http://msdn.microsoft.com/en-us/library/system.data.linq.datacontext.deferredloadingenabled.aspx), when DataContext.ObjectTrackingEnabled is false:

> DeferredLoadingEnabled is ignored and inferred to be false.

Object tracking will be explained in the next post.