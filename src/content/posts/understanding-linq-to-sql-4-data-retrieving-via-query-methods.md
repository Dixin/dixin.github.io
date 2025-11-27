---
title: "Understanding LINQ to SQL (4) Data Retrieving Via Query Methods"
published: 2010-04-14
description: "\\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to SQL", "SQL Server", "TSQL", "Visual Studio", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

After understanding:

-   object model generating from SQL Server schema
-   query method chaining on IQueryable<T>
-   SQL are translated from expression tree, which is required by IQueryable<T>

now it is time to take a deeper look at the detail of SQL Server data [CRUD](http://en.wikipedia.org/wiki/Create,_read,_update_and_delete) manipulation. This post will focus on how to retrieve (SELECT) data from SQL Server via LINQ to SQL.

Since IQueryable<T> has extension methods which looks similar with IEnumerable<T>, queries in [this LINQ to Objects post](/posts/understanding-linq-to-objects-3-query-methods) can be applied in LINQ to SQL. Here the word “looks” is used because IQueryable<T>’s and IEnumerable<T>’s extension methods have the same name, and they all take lambda expressions as parameters; the difference is, the lambda expression syntactic sugar is compiled into anonymous method when token by IEnumerable<T>’s extension methods, and it is compiled into expression tree when token by IEnumerable<T>’s extension methods.

The previous post has listed all the IQueryable<T> standard query methods:

-   Restriction: Where, OfType
-   Projection: Select, SelectMany
-   Ordering: OrderBy, ThenBy, OrderByDescending, ThenByDescending, Reverse
-   Join: Join, GroupJoin
-   Grouping: GroupBy
-   Set: Zip, Distinct, Union, Intersect, Except
-   Aggregation: Aggregate, Count, LongCount, Sum, Min, Max, Average
-   Partitioning: Take, Skip, TakeWhile, SkipWhile
-   Cancatening: Concat
-   Conversion: Cast
-   Equality: SequenceEqual
-   Elements: First, FirstOrDefault, Last, LastOrDefault, Single, SingleOrDefault, ElementAt, ElementAtOrDefault, DefaultIfEmpty
-   Qualifiers: Any, All, Contains

The underlined methods are not supported in LINQ to SQL, because SQL does not have the corresponding implementation.

Again, please remember IQueryable<T> implements IEnumerable<T>. All IEnumerable<T> standard query methods remain on IQueryable<T>, like ToArray().

## Restriction (WHERE, AND, OR, NOT, LIKE, IN, IS, NULL)

Take the Products table as example:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_25B63014.png "image")

Where() query method is used to filter the items in the IQueryable<T> collection:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    IQueryable<Product> results = source.Where(product => product.UnitPrice > 100);

    foreach (Product item in results)
    {
        Console.WriteLine("{0}: {1}", item.ProductName, item.UnitPrice);
    }
}
```

This will prints:

> Thüringer Rostbratwurst: 123.7900 Côte de Blaye: 263.5000

The above query will be translated to:

```sql
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[UnitPrice] > @p0',N'@p0 decimal(33,4)',@p0=100.0000
```

This can be traced by [SQL Server Profiler](http://msdn.microsoft.com/en-us/library/ms181091.aspx).

The other overload of Where():
```
IQueryable<TSource> Where<TSource>(
    this IQueryable<TSource> source, 
    Expression<Func<TSource, int, bool>> predicate)
```

is not supported in LINQ to SQL.

### AND / OR

&& / || can be used in Where():
```
IQueryable<Product> results = source.Where(
    product => product.UnitPrice < 20 || product.UnitPrice > 90);
```

This is translated to:

```sql
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE ([t0].[UnitPrice] < @p0) OR ([t0].[UnitPrice] > @p1)',N'@p0 decimal(33,4),@p1 decimal(33,4)',@p0=20.0000,@p1=90.0000
```

Or Where() can be invoked for multiple times:
```
IQueryable<Product> results = source.Where(product => product.UnitPrice < 20)
                                    .Where(product => product.ReorderLevel > 10);
```

This is translated to:

```sql
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE ([t0].[ReorderLevel] > @p0) AND ([t0].[UnitPrice] < @p1)',N'@p0 int,@p1 decimal(33,4)',@p0=10,@p1=20.0000
```

### LIKE

.NET API can be used for constructing query. Typically, when working with character data, string.StartsWith() can be used
```
IQueryable<Product> results = source.Where(product => product.ProductName.StartsWith("B"));
```

string.StartsWith(“x”) is recognized and translated to LIKE N’x%’:

```sql
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] LIKE @p0',N'@p0 nvarchar(4000)',@p0=N'B%'
```

The same for string.EndsWith(“y”) and string.Contains(“z”). They are translated LIKE N’%y’ and LIKE N’%z%’.

Generally, SqlMethods.Like() can be used for LIKE operation:
```
IQueryable<Product> results = source.Where(
    product => SqlMethods.Like(product.ProductName, "%st%"));
```

It can be recognized and translated to LIKE.

For the detail of wildcards, please check [MSDN](http://msdn.microsoft.com/en-us/library/ms179859.aspx).

### IN

When IEnumerable<T>.Contains() is used:
```
IEnumerable<string> names = new string[] { "Chai", "Chang", "Tofu" };
IQueryable<Product> results = source.Where(product => names.Contains(product.ProductName));
```

it is translated to IN:

```sql
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] IN (@p0, @p1, @p2)',N'@p0 nvarchar(4000),@p1 nvarchar(4000),@p2 nvarchar(4000)',@p0=N'Chai',@p1=N'Chang',@p2=N'Tofu'
```

### IS / NOT / NULL

The following code:
```
IQueryable<Product> results = source.Where(product => product.CategoryID != null);
```

is translated to:

```sql
SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[CategoryID] IS NOT NULL
```

The predicate “product.CategoryID != null” is not executed in CLR but translated to SQL and remotely executed in SQL Server.

## Projection (SELECT, CASE)

If querying all fields is not necessary, Select() can be used to specify the fields:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    var results = source.Where(product => product.UnitPrice > 100)
                        .Select(product => new 
                            { 
                                product.ProductName, 
                                product.UnitPrice 
                            });

    foreach (var item in results)
    {
        Console.WriteLine("{0}: {1}", item.ProductName, item.UnitPrice);
    }
}
```

Here [var](/posts/understanding-csharp-3-0-features-3-type-inference) must be used because [anonymous type](/posts/understanding-csharp-3-0-features-4-anonymous-type) is created.

It is translated to:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t0].[UnitPrice]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[UnitPrice] > @p0',N'@p0 decimal(33,4)',@p0=100.0000
```

Only explicitly required fields (ProductName and UnitPrice) are queried.

### Explicitly construct entity

In the above sample, constructing an object of anonymous type looks unnecessary. It should be Ok to use the Product type directly:
```
IQueryable<Product> results = source.Where(product => product.UnitPrice > 100)
                                    .Select(product => new Product()
                                        {
                                            ProductName = product.ProductName,
                                            UnitPrice = product.UnitPrice
                                        });

foreach (Product item in results)
{
    Console.WriteLine("{0}: {1}", item.ProductName, item.UnitPrice);
}
```

But this code throws an NotSupportedException at runtime:

> Explicit construction of entity type 'Product' in query is not allowed.

Explicit construction of entity type is not allowed after .NET 3.5 Beta2. [According to Microsoft](http://social.msdn.microsoft.com/Forums/en-US/linqprojectgeneral/thread/1ce25da3-44c6-407d-8395-4c146930004b), this is because:

> This check was added because it was supposed to be there from the beginning and was missing. Constructing entity instances manually as a projection pollutes the cache with potentially malformed objects, leading to confused programmers and lots of bug reports for us. In addition, it is ambiguous whether projected entities should be in the cache or changed tracked at all. The usage pattern for entities is that they are created outside of queries and inserted into tables via the DataContext and then later retrieved via queries, never created by queries.

To explicitly construct entity, there are several ways to work around. One way is construct object of anonymous type, then use LINQ to Objects to construct entity:
```
IEnumerable<Product> results = source.Where(product => product.UnitPrice > 100)
                                     .Select(product => new
                                         {
                                             product.ProductName,
                                             product.UnitPrice
                                         })
                                     .AsEnumerable() // Converts to IEnumerable<T>
                                     .Select(item => new Product() 
                                         { 
                                             ProductName = item.ProductName, 
                                             UnitPrice = item.UnitPrice
                                         }); // Uses IEnumerable<T>.Select()
```

### CASE

The following query:
```
var results = source.Where(product => product.ReorderLevel > 20)
                    .Select(product => new
                        {
                            ProductName = product.ProductName,
                            IsExpensive = product.UnitPrice < 10
                        });
```

is translated to CASE:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], 
    (CASE 
        WHEN [t0].[UnitPrice] < @p1 THEN 1
        WHEN NOT ([t0].[UnitPrice] < @p1) THEN 0
        ELSE NULL
     END) AS [IsExpensive]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ReorderLevel] > @p0',N'@p0 int,@p1 decimal(33,4)',@p0=20,@p1=10.0000
```

## Ordering (ORDER BY, ASC, DESC)

The query methods OrderBy(), OrderByDescending(), ThenBy(), ThenByDescending() work similarly with LINQ to Objects.

The following OrderBy(A).OrderBy(B):
```
var results = source.Where(product => product.ReorderLevel > 20)
                    .OrderBy(product => product.ProductName)
                    .OrderBy(product => product.UnitPrice)
                    .Select(product => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice
                        });
```

is translated to ORDER BY B, A:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t0].[UnitPrice]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ReorderLevel] > @p0
ORDER BY [t0].[UnitPrice], [t0].[ProductName]',N'@p0 int',@p0=20
```

While OrderBy(A).ThenBy(B):
```
var results = source.Where(product => product.ReorderLevel > 20)
                    .OrderBy(product => product.ProductName)
                    .ThenBy(product => product.UnitPrice)
                    .Select(product => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice
                        });
```

is translated to ORDER BY A, B:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t0].[UnitPrice]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ReorderLevel] > @p0
ORDER BY [t0].[ProductName], [t0].[UnitPrice]',N'@p0 int',@p0=20
```

## Join (JOIN, INNER JOIN, OUTER JOIN, CROSS JOIN)

LINQ to SQL can implement all kinds of SQL join. But this is not easy enough. In the following samples, query methods and query expressions will be both provided for contrast.

### Natural join

Natural JOIN is typically applied in one-to-one scenarios. But [natural join is not supported](http://database.blogs.webucator.com/2010/03/31/why-sql-server-doesnt-support-natural-join-syntax/) by either SQL Server or LINQ to SQL. Natural join should be implemented via INNER JOIN.

The interesting thing is, there are some posts talking about SQL Server natural join, like [this one](http://www.c-sharpcorner.com/UploadFile/raj1979/SqlJoins10012008164642PM/SqlJoins.aspx) from [C# Corner](http://www.c-sharpcorner.com/), and [this one](http://blogs.msdn.com/vbteam/archive/2007/12/31/converting-sql-to-linq-part-6-joins-bill-horst.aspx) from [Microsoft VB team](http://blogs.msdn.com/vbteam/).

### INNER JOIN

INNER JOIN is very typically applied one-to-many scenarios (One-to-one natural join can be considered as a special one-to-many scenario, where “many” consists of “one”.).

Take the Products table and Categories table as an example. This is the model of both tables, and the foreign key is mapped as an association:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_42DBD81E.png "image")

Similar with LINQ to Objects queries, INNER JOIN can be implemented by Join().
```
IQueryable<Product> outer = database.Products;
IQueryable<Category> inner = database.Categories;
var results = outer.Where(product => product.UnitPrice > 100)
                   .Join(
                        inner,
                        product => product.CategoryID,
                        category => category.CategoryID,
                        (product, category) => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice,
                            CategoryName = category.CategoryName
                        });
```

is translated into:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t0].[UnitPrice], [t1].[CategoryName]
FROM [dbo].[Products] AS [t0]
INNER JOIN [dbo].[Categories] AS [t1] ON [t0].[CategoryID] = ([t1].[CategoryID])
WHERE [t0].[UnitPrice] > @p0',N'@p0 decimal(33,4)',@p0=100.0000
```

Here, in C#, Where() is before Join(). This is Ok for translating to SQL, where Join() should come before Where().

The above query can be implemented by query expression:
```
var results = from product in outer
              where product.UnitPrice > 100
              join category in inner on product.CategoryID equals category.CategoryID
              select new
                  {
                      ProductName = product.ProductName,
                      UnitPrice = product.UnitPrice,
                      CategoryName = category.CategoryName
                  };
```

which looks a little easier.

INNER JOIN can also be done by SelectMany():
```
IQueryable<Category> source = database.Categories;
var results = source.Where(category => category.CategoryName == "Beverages")
                    .SelectMany(
                        category => category.Products,
                        (category, product) => new 
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice,
                            CategoryName = category.CategoryName
                        });
```

This is translated to:

```sql
exec sp_executesql N'SELECT [t1].[ProductName], [t1].[UnitPrice], [t0].[CategoryName]
FROM [dbo].[Categories] AS [t0], [dbo].[Products] AS [t1]
WHERE ([t0].[CategoryName] = @p0) AND ([t1].[CategoryID] = [t0].[CategoryID])',N'@p0 nvarchar(4000)',@p0=N'Beverages'
```

### OUTER JOIN

OUTER JOIN is also typically applied one-to-many scenarios. OUTER JOIN can be implemented by GroupJoin().
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> outer = database.Products;
    IQueryable<Category> inner = database.Categories;
    var results = outer.Where(product => product.UnitPrice < 10)
                       .OrderBy(product => product.ProductName)
                       .GroupJoin(
                            inner,
                            product => product.CategoryID,
                            category => category.CategoryID,
                            (product, categories) => new
                                {
                                    Product = product,
                                    Categories = categories
                                })
                       .SelectMany( // Flattens the data after outer join.
                            item => item.Categories.DefaultIfEmpty(),
                            (item, category) => new
                                {
                                    ProductName = item.Product.ProductName,
                                    CategoryName = category.CategoryName
                                });

    foreach (var item in results)
    {
        Console.WriteLine("{0} <- {1}", item.ProductName, item.CategoryName);
    }
}
```

is translated to:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t1].[CategoryName] AS [CategoryName]
FROM [dbo].[Products] AS [t0]
LEFT OUTER JOIN [dbo].[Categories] AS [t1] ON [t0].[CategoryID] = ([t1].[CategoryID])
WHERE [t0].[UnitPrice] < @p0
ORDER BY [t0].[ProductName]',N'@p0 decimal(33,4)',@p0=10.0000
```

and prints:

> Filo Mix <- Grains/Cereals Geitost <- Dairy Products Guaraná Fantástica <- Beverages Jack's New England Clam Chowder <- Seafood Konbu <- Seafood Rhönbräu Klosterbier <- Beverages Rogede sild <- Seafood Teatime Chocolate Biscuits <- Confections Tourtière <- Meat/Poultry Tunnbröd <- Grains/Cereals Zaanse koeken <- Confections

This looks a little tough. Query expression is a little easier:
```
var results = from product in outer
              where product.UnitPrice < 10
              orderby product.ProductName
              join category in inner on product.CategoryID equals category.CategoryID
              into categories
              from item in categories.DefaultIfEmpty()
              select new
                  {
                      ProductName = product.ProductName,
                      CategoryName = item.CategoryName
                  };
```

Notice the second from. 2 “from”s will be compiled into SelectMany().

For consistency, it is recommended to always use query methods.

One thing need to pay attention is, do not forget the DefaultIfEmpty() invocation, because one Product object is OUTER JOINed with a group of Category objects, and that group might be null. Without DefaultIfEmpty(), OUTER JOIN cannot be applied, and the query will be translated into INNER JOIN.

### Association (OUTER JOIN)

A simpler implementation of OUTER JOIN is using the table association. For example,
```
IQueryable<Product> source = database.Products;
var results = source.Where(product => product.UnitPrice < 10)
                    .OrderBy(product => product.ProductName)
                    .Select(product => new 
                        { 
                            ProductName = product.ProductName, 
                            CategoryName = product.Category.CategoryName 
                        });
```

This is translated to the same SQL above.

Here is another sample using table association to implement OUTER JOIN:
```
IQueryable<Product> source = database.Products;
var results = source.Where(product => product.Category.CategoryName == "Beverages")
                    .Select(product => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice
                        });
```

It is translated to:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t0].[UnitPrice]
FROM [dbo].[Products] AS [t0]
LEFT OUTER JOIN [dbo].[Categories] AS [t1] ON [t1].[CategoryID] = [t0].[CategoryID]
WHERE [t1].[CategoryName] = @p0',N'@p0 nvarchar(4000)',@p0=N'Beverages'
```

### CROSS JOIN

A typical usage of CROSS JOIN is in many-to-many scenarios. Many-to-many scenarios usually involves 3 table: 2 tables are associated related through a relationship table. For example, below Employees table and Territories table’s relationship are represented by the EmployeeTerritories relationship table:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_26EAA326.png "image")

CROSS JOIN can be implemented by SelectMany(). The following query:
```
IQueryable<Category> source = database.Employees;
var results = source.SelectMany(
    employee => employee.EmployeeTerritories,
    (employee, employeeTerritory) => new
        {
            FirstName = employee.FirstName,
            LastName = employee.LastName,
            TerritoryDescription = employeeTerritory.Territory.TerritoryDescription
        });
```

is equal to:
```
var results = from employee in source
              from territory in employee.EmployeeTerritories
              select new
              {
                  FirstName = employee.FirstName,
                  LastName = employee.LastName,
                  TerritoryDescription = territory.Territory.TerritoryDescription
              };
```

because, as fore mentioned, 2 “from”s will be compiled into SelectMany().

So it is translated to:

```sql
SELECT [t0].[FirstName], [t0].[LastName], [t2].[TerritoryDescription]
FROM [dbo].[Employees] AS [t0]
CROSS JOIN [dbo].[EmployeeTerritories] AS [t1]
INNER JOIN [dbo].[Territories] AS [t2] ON [t2].[TerritoryID] = [t1].[TerritoryID]
WHERE [t1].[EmployeeID] = [t0].[EmployeeID]
```

Firstly Employees table CROSS JOINs the relationship table EmployeeTerritories, then INNER JOINs the Territories.

### Self JOIN

Self JOIN is somehow more interesting. Take a look at the above Employees table:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_58959AAE.png "image")

There is a foreign key within this table, from EmployeeID to ReportTo:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_7A31C37F.png "image")

This is the model of Employee table:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_134D1DB8.png "image")

The above foreign key is mapped as an association:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_424F598F.png "image")

So a self JOIN can be performed on Employees table and Employees table through this foreign key:
```
IQueryable<Employee> source = database.Employees;
var results = source.SelectMany(
    manager => manager.Employees, 
    (manager, employee) => new
        {
            Manager = manager.FirstName + " " + manager.LastName,
            Employee = employee.FirstName + " " + employee.LastName
        });
```

This is translated to:

```sql
exec sp_executesql N'SELECT ([t0].[FirstName] + @p0) + [t0].[LastName] AS [Manager], ([t1].[FirstName] + @p1) + [t1].[LastName] AS [Employee]
FROM [dbo].[Employees] AS [t0], [dbo].[Employees] AS [t1]
WHERE [t1].[ReportsTo] = [t0].[EmployeeID]',N'@p0 nvarchar(4000),@p1 nvarchar(4000)',@p0=N' ',@p1=N' '
```

## Grouping and aggregation (GROUP BY / aggregate functions / HAVING )

In SQL, GROUP BY works with aggregation. However, the concept of grouping is different in LINQ to SQL, and aggregating is optional. LINQ to SQL grouping just reorganize items into IGrouping<Tkey, TElement>s, which is the same as LINQ to Objects grouping:

```csharp
namespace System.Linq
{
    public interface IGrouping<out TKey, out TElement> : IEnumerable<TElement>, 
                                                         IEnumerable
    {
        TKey Key { get; }
    }
}
```

Grouping can be implemented by GroupBy():
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    IQueryable<IGrouping<string, string>> groups = source.GroupBy(
        product => product.ProductName.Substring(0, 1), // For TKey of IGrouping.
        product => product.ProductName); // For TElement of IGrouping.

    foreach (IGrouping<string, string> group in groups)
    {
        Console.Write("Group {0}: ", group.Key);
        foreach (string productName in group) // Iterates items in the group.
        {
            Console.Write("[{0}] ", productName);
        }

        Console.WriteLine();
    }
}
```

This prints:

> Group A: \[Alice Mutton\] \[Aniseed Syrup\] Group B: \[Boston Crab Meat\] Group C: \[Camembert Pierrot\] \[Carnarvon Tigers\] \[Chai\] \[Chang\] \[Chartreuse verte\] \[Chef Anton's Cajun Seasoning\] \[Chef Anton's Gumbo Mix\] \[Chocolade\] \[Côte de Blaye\] Group E: \[Escargots de Bourgogne\] Group F: \[Filo Mix\] \[Flotemysost\] Group G: \[Geitost\] \[Genen Shouyu\] \[Gnocchi di nonna Alice\] \[Gorgonzola Telino\] \[Grandma's Boysenberry Spread\] \[Gravad lax\] \[Guaraná Fantástica\] \[Gudbrandsdalsost\] \[Gula Malacca\] \[Gumbär Gummibärchen\] \[Gustaf's Knäckebröd\] Group I: \[Ikura\] \[Inlagd Sill\] \[Ipoh Coffee\] Group J: \[Jack's New England Clam Chowder\] Group K: \[Konbu\] Group L: \[Lakkalikööri\] \[Laughing Lumberjack Lager\] \[Longlife Tofu\] \[Louisiana Fiery Hot Pepper Sauce\] \[Louisiana Hot Spiced Okra\] Group M: \[Manjimup Dried Apples\] \[Mascarpone Fabioli\] \[Maxilaku\] \[Mishi Kobe Niku\] \[Mozzarella di Giovanni\] Group N: \[Nord-Ost Matjeshering\] \[Northwoods Cranberry Sauce\] \[NuNuCa Nuß-Nougat-Creme\] Group O: \[Original Frankfurter grüne Soße\] \[Outback Lager\] Group P: \[Pâté chinois\] \[Pavlova\] \[Perth Pasties\] Group Q: \[Queso Cabrales\] \[Queso Manchego La Pastora\] Group R: \[Raclette Courdavault\] \[Ravioli Angelo\] \[Rhönbräu Klosterbier\] \[Röd Kaviar\] \[Rogede sild\] \[Rössle Sauerkraut\] Group S: \[Sasquatch Ale\] \[Schoggi Schokolade\] \[Scottish Longbreads\] \[Singaporean Hokkien Fried Mee\] \[Sir Rodney's Marmalade\] \[Sir Rodney's Scones\] \[Sirop d'érable\] \[Spegesild\] \[Steeleye Stout\] Group T: \[Tarte au sucre\] \[Teatime Chocolate Biscuits\] \[Thüringer Rostbratwurst\] \[Tofu\] \[Tourtière\] \[Tunnbröd\] Group U: \[Uncle Bob's Organic Dried Pears\] Group V: \[Valkoinen suklaa\] \[Vegie-spread\] Group W: \[Wimmers gute Semmelknödel\] Group Z: \[Zaanse koeken\]

This query produces a simple grouping in LINQ to SQL. Obviously, there is no aggregating, so there is no way to translate the query into GROUP BY. Here LINQ to SQL does the 2 things:

-   queries all keys (CategoryIDs), each key stands for one group;
-   for each key (CategoryID), queries the items Products table, and put the queried items into an IGrouping<Tkey, TElement>.

So the final query result is a collection of groups.

This is translated to the following tens of SQL queries:

```sql
-- Queries all keys, each key stands for a group
exec sp_executesql N'SELECT [t1].[value] AS [Key]
FROM (
    SELECT SUBSTRING([t0].[ProductName], @p0 + 1, @p1) AS [value]
    FROM [dbo].[Products] AS [t0]
    ) AS [t1]
GROUP BY [t1].[value]',N'@p0 int,@p1 int',@p0=0,@p1=1

-- Queries the items for the first key 'A'.
exec sp_executesql N'SELECT [t0].[ProductName]
FROM [dbo].[Products] AS [t0]
WHERE ((@x1 IS NULL) AND (SUBSTRING([t0].[ProductName], @p0 + 1, @p1) IS NULL)) OR ((@x1 IS NOT NULL) AND (SUBSTRING([t0].[ProductName], @p0 + 1, @p1) IS NOT NULL) AND (@x1 = SUBSTRING([t0].[ProductName], @p0 + 1, @p1)))',N'@p0 int,@p1 int,@x1 nvarchar(4000)',@p0=0,@p1=1,@x1=N'A'

-- Queries the items for the second key 'B'.
exec sp_executesql N'SELECT [t0].[ProductName]
FROM [dbo].[Products] AS [t0]
WHERE ((@x1 IS NULL) AND (SUBSTRING([t0].[ProductName], @p0 + 1, @p1) IS NULL)) OR ((@x1 IS NOT NULL) AND (SUBSTRING([t0].[ProductName], @p0 + 1, @p1) IS NOT NULL) AND (@x1 = SUBSTRING([t0].[ProductName], @p0 + 1, @p1)))',N'@p0 int,@p1 int,@x1 nvarchar(4000)',@p0=0,@p1=1,@x1=N'B'

-- ...

-- Queries the items for the last key 'Z'.
exec sp_executesql N'SELECT [t0].[ProductName]
FROM [dbo].[Products] AS [t0]
WHERE ((@x1 IS NULL) AND (SUBSTRING([t0].[ProductName], @p0 + 1, @p1) IS NULL)) OR ((@x1 IS NOT NULL) AND (SUBSTRING([t0].[ProductName], @p0 + 1, @p1) IS NOT NULL) AND (@x1 = SUBSTRING([t0].[ProductName], @p0 + 1, @p1)))',N'@p0 int,@p1 int,@x1 nvarchar(4000)',@p0=0,@p1=1,@x1=N'Z'
```

### GROUP BY / aggregate functions

When [aggregate function](http://msdn.microsoft.com/en-us/library/ms173454.aspx) is provided in grouping, it is able to translate the query to GROUP BY. Take COUNT as example:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    var groups = source.GroupBy(
        // The key of each group.
        product => product.CategoryID,

        // Count() aggregates items of each group into one single value.
        (key, products) => new 
            { 
                Key = key, 
                Count = products.Count() 
            });

    foreach (var group in groups)
    {
        Console.WriteLine("Category {0}: {1} Products", group.Key, group.Count);
    }
}
```

is translated to:

```sql
SELECT COUNT(*) AS [Count], [t0].[CategoryID] AS [Key]
FROM [dbo].[Products] AS [t0]
GROUP BY [t0].[CategoryID]
```

and prints:

> Category 1: 12 Products Category 2: 12 Products Category 3: 13 Products Category 4: 10 Products Category 5: 7 Products Category 6: 6 Products Category 7: 5 Products Category 8: 12 Products

### HAVING

When filtering a GROUP BY:
```
var groups = source.GroupBy(
                        product => product.CategoryID,
                        (key, products) => new 
                            { 
                                Key = key, 
                                Count = products.Count() 
                            })
                   .Where(group => group.Count > 10);
```

It is translated to a WHERE query, which wraps the GROUP BY query inside:

```sql
exec sp_executesql N'SELECT [t1].[CategoryID] AS [Key], [t1].[value] AS [Count]
FROM (
    SELECT COUNT(*) AS [value], [t0].[CategoryID]
    FROM [dbo].[Products] AS [t0]
    GROUP BY [t0].[CategoryID]
    ) AS [t1]
WHERE [t1].[value] > @p0',N'@p0 int',@p0=10
```

which works the same as HAVING:

```sql
SELECT COUNT(*) AS value, CategoryID
FROM Products AS t0
GROUP BY CategoryID
HAVING (COUNT(*) > 10)
```

There are a lot of interesting posts on the Internet talking about translating LINQ to SQL queries into HAVING, like [this one](http://blogs.msdn.com/vbteam/archive/2007/12/18/converting-sql-to-linq-part-5-group-by-and-having-bill-horst.aspx) from [Microsoft VB team](http://blogs.msdn.com/vbteam/default.aspx), [this one](http://weblogs.asp.net/vikram/archive/2009/09/17/linq-having-clause-and-group-by-with-condition.aspx), [this one](http://www.aspfree.com/c/a/.NET/Grouping-and-Aggregating-When-Querying-LINQ-to-SQL/4/), and [this one](http://www.aspfree.com/c/a/.NET/Grouping-and-Aggregating-When-Querying-LINQ-to-SQL/4/), etc. Actually, none of the queries they provided is translated to HAVING.

## Set (DISTINCT / UNION / EXISTS)

In the 5 set query method of IQueryable<T>, Zip() is not supported in LINQ to SQL. The other 4 works.

### DISTINCT

DISTINCT can be implemented by invoking Distinct() query method. For example:
```
IQueryable<Product> source = database.Products;
IQueryable<int?> results = source.Where(product => product.UnitPrice > 100)
                                    .Select(product => product.CategoryID)
                                    .Distinct();
```

is translated to:

```sql
exec sp_executesql N'SELECT DISTINCT [t0].[CategoryID]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[UnitPrice] > @p0',N'@p0 decimal(33,4)',@p0=100.0000
```

### UNION

UNION can be implemented by Union(). Please notice UNION includes a DISTINCT calculation in SQL and so that the same in LINQ to SQL. For example:
```
IQueryable<Supplier> source = database.Suppliers;
IQueryable<Order> source2 = database.Orders;

Console.WriteLine(source.Count()); // 29

Console.WriteLine(source2.Count()); // 830

IQueryable<string> results = source.Select(supplier => supplier.City)
                                   .Union(source2.Select(order => order.ShipCity));
Console.WriteLine(results.Count()); // 94
```

is translated to:

```sql
SELECT COUNT(*) AS [value]
FROM [dbo].[Suppliers] AS [t0]

SELECT COUNT(*) AS [value]
FROM [dbo].[Orders] AS [t0]

SELECT COUNT(*) AS [value]
FROM (
    SELECT [t0].[City]
    FROM [dbo].[Suppliers] AS [t0]
    UNION
    SELECT [t1].[ShipCity]
    FROM [dbo].[Orders] AS [t1]
    ) AS [t2]
```

### EXISTS

EXISTS can be implemented by Intersect().
```
IQueryable<Customer> source = database.Customers;
IQueryable<Supplier> source2 = database.Suppliers;
IQueryable<string> results = source.Select(customer => customer.CompanyName)
                                    .Intersect(source2.Select(
                                        supplier => supplier.CompanyName));
```

is translated to:

```sql
SELECT DISTINCT [t0].[CompanyName]
FROM [dbo].[Customers] AS [t0]
WHERE EXISTS(
    SELECT NULL AS [EMPTY]
    FROM [dbo].[Suppliers] AS [t1]
    WHERE [t0].[CompanyName] = [t1].[CompanyName]
    )
```

### NOT EXISTS

Except() is opposite of Intersect().
```
IQueryable<string> results = source.Select(customer => customer.CompanyName)
                                    .Except(source2.Select(
                                        supplier => supplier.CompanyName));
```

is translated to:

```sql
SELECT DISTINCT [t0].[CompanyName]
FROM [dbo].[Customers] AS [t0]
WHERE NOT (EXISTS(
    SELECT NULL AS [EMPTY]
    FROM [dbo].[Suppliers] AS [t1]
    WHERE [t0].[CompanyName] = [t1].[CompanyName]
    ))
```

## Partitioning (TOP / ROW\_NUMBER() / BETWEEN AND)

The partitioning is very simple via LINQ to SQL.

### TOP

The following code queries the most expensive 10 products:
```
IQueryable<Product> source = database.Products;
var results = source.Select(product => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice
                        })
                    .OrderByDescending(item => item.UnitPrice)
                    .Take(10);
```

And it is translated to:

```sql
SELECT TOP (10) [t0].[ProductName], [t0].[UnitPrice]
FROM [dbo].[Products] AS [t0]
ORDER BY [t0].[UnitPrice] DESC
```

### ROW\_NUMBER()

The Skip() is implemented by generating an extra ROW\_NUMBER field. The following query:
```
var results = source.Select(product => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice
                        })
                    .OrderByDescending(item => item.UnitPrice)
                    .Skip(10);
```

is translated to:

```sql
exec sp_executesql N'SELECT [t1].[ProductName], [t1].[UnitPrice]
FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY [t0].[UnitPrice] DESC) AS [ROW_NUMBER], [t0].[ProductName], [t0].[UnitPrice]
    FROM [dbo].[Products] AS [t0]
    ) AS [t1]
WHERE [t1].[ROW_NUMBER] > @p0
ORDER BY [t1].[ROW_NUMBER]',N'@p0 int',@p0=10
```

### BETWEEN AND

Skip().Take() immediately implements pagination:
```
var results = source.Select(product => new
                        {
                            ProductName = product.ProductName,
                            UnitPrice = product.UnitPrice
                        })
                    .OrderByDescending(item => item.UnitPrice)
                    .Skip(20).Take(10);
```

It is translated to:

```sql
exec sp_executesql N'SELECT [t1].[ProductName], [t1].[UnitPrice]
FROM (
    SELECT ROW_NUMBER() OVER (ORDER BY [t0].[UnitPrice] DESC) AS [ROW_NUMBER], [t0].[ProductName], [t0].[UnitPrice]
    FROM [dbo].[Products] AS [t0]
    ) AS [t1]
WHERE [t1].[ROW_NUMBER] BETWEEN @p0 + 1 AND @p0 + @p1
ORDER BY [t1].[ROW_NUMBER]',N'@p0 int,@p1 int',@p0=20,@p1=10
```

A Page() method is implemented in another post: [C# Coding Guidelines (6) Documentation](/posts/csharp-coding-guidelines-6-documentation).

## Concatenation (UNION ALL)

There is only one concatenation query method, Concat().

### UNION ALL

The UNION ALL can be implemented by Concate().
```
IQueryable<Customer> source = database.Customers;
IQueryable<Supplier> source2 = database.Suppliers;
IQueryable<string> results = source.Select(customer => customer.CompanyName)
                                   .Concat(source2.Select(
                                       supplier => supplier.CompanyName));
```

is translated to:

```sql
SELECT [t2].[CompanyName]
FROM (
    SELECT [t0].[CompanyName]
    FROM [dbo].[Customers] AS [t0]
    UNION ALL
    SELECT [t1].[CompanyName]
    FROM [dbo].[Suppliers] AS [t1]
    ) AS [t2]
```

## Qualifiers (CASE / EXISTS)

The qualifiers are all translated to CASE and EXISTS.

### CASE / EXISTS

This is an All() example:
```
IQueryable<Product> source = database.Products;
bool result = source.All(product => product.UnitPrice < 300);
```

It is translated to:

```sql
exec sp_executesql N'SELECT 
    (CASE 
        WHEN NOT (EXISTS(
            SELECT NULL AS [EMPTY]
            FROM [dbo].[Products] AS [t1]
            WHERE (
                (CASE 
                    WHEN [t1].[UnitPrice] < @p0 THEN 1
                    ELSE 0
                 END)) = 0
            )) THEN 1
        WHEN NOT NOT (EXISTS(
            SELECT NULL AS [EMPTY]
            FROM [dbo].[Products] AS [t1]
            WHERE (
                (CASE 
                    WHEN [t1].[UnitPrice] < @p0 THEN 1
                    ELSE 0
                 END)) = 0
            )) THEN 0
        ELSE NULL
     END) AS [value]',N'@p0 decimal(33,4)',@p0=300.0000
```

This is an Any() example:
```
bool result = source.Any(product => product.UnitPrice < 300);
```

And this one is translated to:

```sql
exec sp_executesql N'SELECT 
    (CASE 
        WHEN EXISTS(
            SELECT NULL AS [EMPTY]
            FROM [dbo].[Products] AS [t0]
            WHERE [t0].[UnitPrice] < @p0
            ) THEN 1
        ELSE 0
     END) AS [value]',N'@p0 decimal(33,4)',@p0=300.0000
```

The other overload of Any()
```
bool result = source.Any();
```

is translated to:

```sql
SELECT 
    (CASE 
        WHEN EXISTS(
            SELECT NULL AS [EMPTY]
            FROM [dbo].[Products] AS [t0]
            ) THEN 1
        ELSE 0
     END) AS [value]
```

And Contains():
```
bool result = source.Select(product=>product.ProductID).Contains(1);
```

is translated to:

```sql
exec sp_executesql N'SELECT 
    (CASE 
        WHEN EXISTS(
            SELECT NULL AS [EMPTY]
            FROM [dbo].[Products] AS [t0]
            WHERE [t0].[ProductID] = @p0
            ) THEN 1
        ELSE 0
     END) AS [value]',N'@p0 int',@p0=1
```

## Other queries

The other queries, OfType() and Cast() are not covered in detail. Because they are more like LINQ to Objects calculation when translated to SQL.