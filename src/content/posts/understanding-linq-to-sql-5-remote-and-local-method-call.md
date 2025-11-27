---
title: "Understanding LINQ to SQL (5) Remote And Local Method Call"
published: 2010-04-18
description: "\\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to SQL", "LINQ via C# Series", "SQL Server", "TSQL"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

Since LINQ to SQL is translating C# methods into SQL, all the C# methods are required to make sense in SQL.

[According to MSDN](http://msdn.microsoft.com/en-us/library/bb882670.aspx):

> A local method call is one that is executed within the object model. A remote method call is one that LINQ to SQL translates to SQL and transmits to the database engine for execution.

As long as .NET method call can be recognized by LINQ to SQL, it is

-   translated to SQL, and
-   executed in SQL Server remotely.

Otherwise it is executed in CLR locally.

## Remote method call

In the previous post, remote method calls are everywhere. In the following code:

```csharp
IQueryable<Product> source = database.Products;
var results = source.Where(product => product.ReorderLevel > 20)
                    .Select(product => new
                        {
                            ProductName = string.Concat("@", product.ProductName),
                            UnitPrice = product.UnitPrice
                        });
```

method calls are:

-   Property access: product.get\_ReorderLevel
-   Numeric comparison: >
-   Method call: IEnumerable<Product>.Where()
-   Property access: product.get\_ProductName
-   Method call: string.Concat()
-   Property access: product.get\_UnitPrice
-   Constructor call: new AnonymousType()
-   Method call: IEnumerable<Product>.Select()

All of them can be recognized by LINQ to SQL, and they are translated:

-   product.get\_ReorderLevel –> \[dbo\].\[Products\].\[RecordLevel\]
-   \> –> >
-   IEnumerable<Product>.Where() –> WHERE
-   product.get\_ProductName –> \[dbo\].\[Products\].\[ProductName\]
-   string.Concat() –> +
-   product.get\_UnitPrice –> \[dbo\].\[Products\].\[UnitPrice\]
-   new AnonymousType(): AS \[ProductName\]
-   IEnumerable<Product>.Select() –> SELECT

So the final result is:

exec sp\_executesql N'SELECT @p1 + \[t0\].\[ProductName\] AS \[ProductName\], \[t0\].\[UnitPrice\] FROM \[dbo\].\[Products\] AS \[t0\] WHERE \[t0\].\[ReorderLevel\] > @p0',N'@p0 int,@p1 nvarchar(4000)',@p0\=20,@p1\=N'@'

As expected, method calls are not executed in CLR but in SQL Server.

## Local method call

The called methods above are call .NET built-in or BCL built-in, like numeric “>” comparison operator, property access, string.Concat(), etc. Now consider this custom .NET method:

```csharp
private static bool IsExpensive(decimal? price)
{
    return price < 10;
}
```

if it is used in:

```csharp
IQueryable<Product> source = database.Products;
IQueryable<Product> results = source.Where(product => IsExpensive(product.UnitPrice));
```

This custom method cannot be recognized and translated into SQL, so a NotSupportedException is thrown at runtime:

> Method 'Boolean IsExpensive(System.Nullable\`1\[System.Decimal\])' has no supported translation to SQL.

But it can work as a local method call in Select():

```csharp
var results = source.Where(product => product.ReorderLevel > 20)
                    .Select(product => new
                        {
                            ProductName = product.ProductName,
                            IsExpensive = IsExpensive(product.UnitPrice)
                        });
```

IsExpensive() cannot be recognized as a remote method call, and will not translated to SQL:

```sql
exec sp_executesql N'SELECT [t0].[ProductName], [t0].[UnitPrice] AS [price]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ReorderLevel] > @p0',N'@p0 int',@p0=20
```

After executing in SQL Server, CLR gets the results, and sends the results to the IsExpensive() method. Here IsExpensive() executes in CLR locally.

## Remote method recognition

As in the previous post, LINQ to SQL is so smart that many .NET methods can be translated to SQL, like IEnumerable<T>.Contains() is translated to IN, product.CategoryID != null is translated to IS NOT NULL, etc. The only thing need to do is to make sure the method call can make sense in SQL, so that it is able to be recognized and translated.

One example is the string equation:

```csharp
IQueryable<Category> source = database.Categories;
Category result = source.Single(category => category.CategoryName == "Beverage");
```

Usually, for string equation, the following looks better:

```csharp
IQueryable<Category> source = database.Categories;
Category result = source.Single(category => 
    category.CategoryName.Equals("Beverages", StringComparison.Ordinal));
```

But this throws an NotSupportedException:

> Method 'Boolean Equals(System.String, System.StringComparison)' has no supported translation to SQL.

The reason is, the StringComparison.Ordinal has no corresponding implementation in SQL so it cannot be translated. Please remember: the above lambda expression category => category.CategoryName == "Beverage" is [constructing an expression tree data structure](/posts/understanding-linq-to-sql-3-expression-tree), not [C# executable code](/posts/understanding-csharp-3-0-features-6-lambda-expression). So it is both unnecessary and incorrect to change it into category.CategoryName.Equals("Beverages", StringComparison.Ordinal).

Another overload of methods can make sense in SQL:

```csharp
Category result = source.Single(category => 
    category.CategoryName.Equals("Beverages"));
```

So it can also be recognized and translated.

Another example is, string.ToUpper() can be translated (because there is UPPER() in SQL), but string.ToUpper(CultureInfo) and string.ToUpperInvariant() cannot.

Generally speaking, these following method calls are supported:

-   Normal arithmetic and comparison operators
-   Part of methods of string, which do not involve .NET stuff like CultureInfo or StringComparison, etc.
    -   CompareTo()
    -   Concat()
    -   Contains()
    -   EndsWith()
    -   Equals()
    -   IndexOf()
    -   Insert()
    -   LastIndexOf()
    -   Length
    -   PadLeft()
    -   PadRight()
    -   Remove()
    -   Replace()
    -   StartsWith()
    -   String() constructor
    -   Substring()
    -   ToLower()
    -   ToUpper()
    -   Trim()
-   Most of methods of Math
-   Part of methods of Convert, which converts among:
    -   bool
    -   byte
    -   short
    -   int
    -   long
    -   float
    -   double
    -   decimal
    -   char
    -   string
    -   DateTime
-   Part of methods of DateTime
-   Part of methods of TimeSpan
-   All methods of SqlMethods
-   Part of methods of IEnumerable<T>, like Contians(), etc.
-   Part of methods of IQueryable<T>, listed in the beginning of [previous post](/posts/understanding-linq-to-sql-6-working-with-deferred-execution)

etc.

Here is [a great article from MSDN](http://msdn.microsoft.com/hi-in/library/bb425822\(en-us\).aspx#linqtosql_topic36) talking about the translation support in detail. But it is a little outdated. For example, it says:

> Shift operators: << and >>

is supported, but actually not in RTM.