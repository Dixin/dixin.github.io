---
title: "Understanding LINQ to SQL (7) Data Changing"
published: 2010-04-20
description: "\\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to SQL", "LINQ via C# Series", "TSQL", "Visual Studio"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

After understanding how to retrieve data with LINQ to SQL, now take a look at data change (create (insert) / update / delete).

## Object Identity

When changing data queried by LINQ to SQL, one common confusion for LINQ to SQL beginners is the object identity.

### Identity of entity objects

The models working in LINQ to SQL are mappings of SQL Server database stuff, like one .NET entity object in the mummery is the mapping of one record in the database table, etc. Generally speaking, within the scope of one DataContext:

-   When one query retrieves one record, a mapping entity is created, referring to an object in the memory.
-   Later if another query executes, retrieving the same one record again, the newly created entity will refer to the same one object.

This default behavior ensures the consistency of mapping: one unique record in database table <-> one unique entity object in application memory.

For example:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    Product[] queryResults1 = source.Where(product => product.ProductID < 4)
                                    .ToArray();
    Product[] queryResults2 = source.Where(product => product.CategoryID == 1)
                                    .OrderBy(product => product.UnitPrice)
                                    .ToArray();

    Console.WriteLine(
        "queryResults1[0]: ProductID = {0}, ProductName = {1}, ...",
        queryResults1[0].ProductID,
        queryResults1[0].ProductName);
    Console.WriteLine(
        "queryResults2[7]: ProductID = {0}, ProductName = {1}, ...",
        queryResults2[7].ProductID,
        queryResults2[7].ProductName);

    Console.WriteLine(
        "queryResults1[0] == queryResults2[7]: {0}",
        object.ReferenceEquals(queryResults1[0], queryResults2[7]));
}
```

prints:

> queryResults1\[0\]: ProductID = 1, ProductName = Chai, ... queryResults2\[7\]: ProductID = 1, ProductName = Chai, ... queryResults1\[0\] == queryResults2\[7\]: True

So once queryResults1\[0\] is changed later, queryResults2\[7\] will also be changed!
```
Console.WriteLine(queryResults2[7].ProductName); // Chai.
queryResults1[0].ProductName = "Test";
Console.WriteLine(queryResults2[7].ProductName); // Test.
```

Too many people are confused by this default behavior.

Because this feature relies on the uniqueness of record in SQL Server, LINQ to SQL requires a primary key on the table. Otherwise, because there is no way to check the uniqueness of record, any newly created entity always refer to a new object in memory. Fortunately, table has a primary key in most of the scenarios.

### Identity and DataContext

Since query relies on DataContext, identity works within the scope of DataContext:
```
Product[] queryResults1;
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    queryResults1 = source.Where(product => product.ProductID < 4)
                          .ToArray();

}

Product[] queryResults2;
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    queryResults2 = source.Where(product => product.CategoryID == 1)
                          .OrderBy(product => product.UnitPrice)
                          .ToArray();
}
```

In this sample, entity objects in queryResults1 have nothing to do with entity objects in queryResults2, because two queries’ results come out from tow different DataContexts.

### Identity of projected objects (non-entity objects)

The above feature is designed only for the entity objects mapped to SQL data items, and does not work on projected objects:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    var queryResults1 = source.Where(product => product.ProductID < 4)
                              .Select(product => new
                              {
                                  ProductID = product.ProductID,
                                  ProductName = product.ProductName
                              }) // Projection.
                              .ToArray();
    var queryResults2 = source.Where(product => product.CategoryID == 1)
                              .OrderBy(product => product.UnitPrice)
                              .Select(product => new
                              {
                                  ProductID = product.ProductID,
                                  ProductName = product.ProductName
                              }) // Projection.
                              .ToArray();

    Console.WriteLine(
        "queryResults1[0]: ProductID = {0}, ProductName = {1}",
        queryResults1[0].ProductID,
        queryResults1[0].ProductName);
    Console.WriteLine(
        "queryResults2[7]: ProductID = {0}, ProductName = {1}",
        queryResults2[7].ProductID,
        queryResults2[7].ProductName);

    Console.WriteLine(
        "queryResults1[0] == queryResults2[7]: {0}",
        object.ReferenceEquals(queryResults1[0], queryResults2[7]));
}
```

prints:

> queryResults1\[0\]: ProductID = 1, ProductName = Chai queryResults2\[7\]: ProductID = 1, ProductName = Chai queryResults1\[0\] == queryResults2\[7\]: False

And changing a projected object of one query has nothing to do with a projected object of another query:
```
Console.WriteLine(queryResults2[7].ProductName); // Chai.
queryResults1[0] = new
    {
        ProductID = 0,
        ProductName = "Test"
    };
Console.WriteLine(queryResults2[7].ProductName); // Chai.
```

The reason is projecting is different from mapping. The above projection always creates an new object in memory while working.

## Track changes

By default, when state change happens to entity, it is not reflected to the database immediately, so the state of the entity object and the state of the mapped record become different. The change is deferred and tracked by DataContext. This tracking is possible because the auto-generated entities all implement INotifyPropertyChanging and INotifyPropertyChanged interfaced, which have been explained in [this post](/posts/understanding-linq-to-sql-1-object-relational-mapping).

### State changes

The following example shows the state change is tracked:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Table<Product> source = database.Products;
    Product result = source.First();
    Console.WriteLine(result.ProductName); // Original state: Chai

    result.ProductName = "Transformer"; // Updating property (field) is tracked.
    Console.WriteLine(result.ProductName); // Changed state: Transformer

    Product original = source.GetOriginalEntityState(result);
    Console.WriteLine(original.ProductName); // Original state: Chai
}
```

Please notice it is tracking the object state change, not object change:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Table<Product> source = database.Products;
    Product result = source.First();
    result = new Product() 
        { 
            ProductName = "Transformer" 
        }; // result now refer to an custom object not created by DataContext.

    // DataContext tracks change of query results created by itself, 
    // and does not know about the state of this offline object. 
    Product original = source.GetOriginalEntityState(result);
    // So original is null.
}
```

To track the change of an entity object not created by current DataContext (also called offline entity), this entity object is required to be explicitly attached to the current DataConetxt:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Table<Product> source = database.Products;
    Product offline = new Product()
        {
            ProductName = "Autobots"
        }; // Offline object from custom code or another DataContext.

    Console.WriteLine(offline.ProductName); // Original state: Autobots

    source.Attach(offline);
    offline.ProductName = "Decipticons";
    Console.WriteLine(offline.ProductName); // Updated state: Decipticons

    Product original = source.GetOriginalEntityState(offline);
    Console.WriteLine(original.ProductName); // Original state: Autobots
}
```

### Association change

The association is not tracked:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Category category = database.Categories.Single(item => item.CategoryID == 1);
    Console.WriteLine(category.Products.Count()); // 12.

    category.Products.Clear();
    Console.WriteLine(category.Products.Count()); // 0.

    Category original = database.Categories.GetOriginalEntityState(category);
    Console.WriteLine(original.Products.Count()); // 0 (Not original value 12).
}
```

but synchronized:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Category category = database.Categories.Single(item => item.CategoryID == 1);
    Product product = category.Products[0];
    Console.WriteLine(
        "Product: ProductID = {0}, CategoryID = {1}", 
        product.ProductID, // 1.
        product.CategoryID); // 1.

    // Deletes the association on Category object.
    category.Products.Clear();
    // Associated Product objects should be synchronized.

    product = database.Products.Single(item => item.ProductID == 1);
    Console.WriteLine(
        "Product: ProductID = {0}, CategoryID = {1}",
        product.ProductID, // 1.
        product.CategoryID); // null, becuase of category.Products.Clear().
}
```

Sine there is an association (foreign key) between Product and Category, when one side of the association is changed, the other side is also changed to ensure the consistency:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Category category = new Category(); // category.Products is empty.

    IQueryable<Product> productsOfCategory2 = database.Products.Where(
        item => item.CategoryID == 2);

    // Updates the association on each Product object.
    foreach (Product item in productsOfCategory2)
    {
        item.Category = category;
    }
    // Associated Category object should be synchronized.

    foreach (Product item in category.Products)
    {
        Console.WriteLine(item.ProductName);
    }
}
```

### Change set

The tracked changes can be retrieved by DataContext.GetChangeSet():
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Product product = database.Products.First();
    Category category = database.Categories.Single(item => item.CategoryID == 5);

    // Changes state.
    product.UnitPrice++;
                
    // Changes association.
    category.Products.Add(product);

    ChangeSet changeSet = database.GetChangeSet();
    Console.WriteLine("{0} updated entitie(s):", changeSet.Updates.Count); // 1.
    foreach (object updated in changeSet.Updates)
    {
        Console.WriteLine(updated.GetType().Name); // Product.
    }
}
```

Here it looks two entities are updated, but actually one, because of the association.

## Submit changes

After changes (create / update / delete) on entities / entity states / associations are made with the caution of object identity and change tracking, and association synchronization, these changed need to be submitted to the database to take effect by invoking the SubmitChanges() method on DataContext:
```
database.SubmitChanges();
```

which is very simple.

### INSERT

INSERT can be done by invoking DataContext.InsertOnsubmit() and DataContext.InsertAllOnsubmit().

### Work with IDENTITY field

The most common scenarios for table primary key is IDENTITY and GUID.

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_041BD433.png "image")

If the table has a IDENTITY primary key, SQL Server just ignores this field when inserting.
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Category category = new Category() // CategoryID is default(int)
        {
            CategoryName = "Transformers",
        };
    Product product = new Product() // ProductID is default(int)
        {
            ProductName = "OptimusPrime"
        };
    category.Products.Add(product);
    // Inserts category, as well as the associated product.
    database.Categories.InsertOnSubmit(category); 

    Console.WriteLine(category.CategoryID); // 0.
    Console.WriteLine(product.ProductID); // 0.

    database.SubmitChanges();

    Console.WriteLine(category.CategoryID); // 9.
    Console.WriteLine(product.ProductID); // 78.
    Console.WriteLine(product.CategoryID); // 9.
}
```

The translated SQL is:

```sql
BEGIN TRANSACTION

-- Inserts category, ignoring provided CategoryID (0).
exec sp_executesql N'INSERT INTO [dbo].[Categories]([CategoryName], [Description], [Picture])
VALUES (@p0, @p1, @p2)

SELECT CONVERT(Int,SCOPE_IDENTITY()) AS [value]',N'@p0 nvarchar(4000),@p1 ntext,@p2 image',@p0=N'Transformers',@p1=NULL,@p2=NULL
-- Returns the last IDENTITY value(9) inserted into an IDENTITY column in the current scope.

-- Inserts product with the foreign key (the CategoryID(9) just generated), ignoring provided ProductID (0).
exec sp_executesql N'INSERT INTO [dbo].[Products]([ProductName], [SupplierID], [CategoryID], [QuantityPerUnit], [UnitPrice], [UnitsInStock], [UnitsOnOrder], [ReorderLevel], [Discontinued])
VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8)

SELECT CONVERT(Int,SCOPE_IDENTITY()) AS [value]',N'@p0 nvarchar(4000),@p1 int,@p2 int,@p3 nvarchar(4000),@p4 money,@p5 smallint,@p6 smallint,@p7 smallint,@p8 bit',@p0=N'OptimusPrime',@p1=NULL,@p2=9,@p3=NULL,@p4=NULL,@p5=NULL,@p6=NULL,@p7=NULL,@p8=0
-- Returns the last IDENTITY value(78).

COMMIT TRANSACTION
```

There are several interesting things to notice:

-   The first thing is, LINQ to SQL determines to first INSERT category, then product, because of the foreign key (product.CategoryID);
-   When translating the SQL for inserting category, the value of CategoryID (0) provided by entity is ignored, because the CategoryID column has an IDENTITY primary key;
-   After executing INSERT, the inserted record has a CategoryID value (9) generated by SQL Server, it is returned to LINQ to SQL by invoking SCOPE\_IDENTITY();
-   In LINQ to SQL, this CategoryID value is set back to category.CategoryID to ensure the consistency of between entity and record;
-   This value is also provided to product.CategoryID, because there is an association (foreign key);
-   By inserting category, the associated product is also inserted (with the CategoryID value just generated) to ensure the consistency of mapping;
-   Similar with CategoryID, LINQ to SQL gets ProductID for product after INSERT executed;

This feature of synchronizing value back to entity is very useful. It is specified in the \[Column\] attribute of property:
```
[Column(Storage = "_CategoryID", AutoSync = AutoSync.OnInsert, 
    DbType = "Int NOT NULL IDENTITY", IsPrimaryKey = true, IsDbGenerated = true)]
public int CategoryID
{
    get
    {
        return this._CategoryID;
    }
    set
    {
        if ((this._CategoryID != value))
        {
            this.OnCategoryIDChanging(value);
            this.SendPropertyChanging();
            this._CategoryID = value;
            this.SendPropertyChanged("CategoryID");
            this.OnCategoryIDChanged();
        }
    }
}
```

And it can be changed in the O/R designer:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_35E57BAF.png "image")

### UPDATE

Updating is straight foreword:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Product product = database.Products.First();
    product.UnitPrice++;
    database.SubmitChanges();
}
```

The translated SQL is:

```sql
SELECT TOP (1) [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]

BEGIN TRANSACTION 

exec sp_executesql N'UPDATE [dbo].[Products]
SET [UnitPrice] = @p9
WHERE ([ProductID] = @p0) AND ([ProductName] = @p1) AND ([SupplierID] = @p2) AND ([CategoryID] = @p3) AND ([QuantityPerUnit] = @p4) AND ([UnitPrice] = @p5) AND ([UnitsInStock] = @p6) AND ([UnitsOnOrder] = @p7) AND ([ReorderLevel] = @p8) AND (NOT ([Discontinued] = 1))',N'@p0 int,@p1 nvarchar(4000),@p2 int,@p3 int,@p4 nvarchar(4000),@p5 money,@p6 smallint,@p7 smallint,@p8 smallint,@p9 money',@p0=1,@p1=N'Chai',@p2=1,@p3=1,@p4=N'10 boxes x 20 bags',@p5=$18.0000,@p6=39,@p7=0,@p8=10,@p9=$19.0000

COMMIT TRANSACTION
```

Take a look at the following code:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Product product = database.Products.First();
    product.UnitPrice++; // State change is deferred. 
    product.UnitPrice—; // State change is deferred.

    // At this point, product’s current state is the same as original state.
    database.SubmitChanges(); // No change is submitted.
}
```

and guess what happens to database?

Since the change is tracked, so when invoking SubmitChanges(), there is no state change requiring submitting, because the entity’s current state is the same as its original state. Here LINQ to SQL submit nothing to database:

```sql
SELECT TOP (1) [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]

BEGIN TRANSACTION 
-- No change is executed.
COMMIT TRANSACTION
```

### DELETE

Similar with INSERT, DELETE can be implemented by DataContext.DeleteOnsubmit() and DataContext.DeleteAllOnsubmit().

Just like fore mentioned, since all data change are deferred and tracked, when submitting all these change, order of performing these changes need to be figured out. Again, foreign key is very important for this order.
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    database.Categories.DeleteAllOnSubmit(database.Categories.Where(
        item => item.CategoryName == "Transformers"));
    database.Products.DeleteAllOnSubmit(database.Products.Where(
        item => item.ProductName == "OptimusPrime"));
    database.SubmitChanges();
}
```

The C# code changes the data by:

-   first delete products,
-   then delete categories

But when executing SubmitChanges(), LINQ to SQL translates SQL to:

-   first DELETE products,
-   then DELETE the categories

because there is a dependency (association in LINQ to SQL / foreign key in database) between those products and categories. So the transalted SQL is:

```sql
-- Retrieves categories. Actual result is one category.
exec sp_executesql N'SELECT [t0].[CategoryID], [t0].[CategoryName], [t0].[Description], [t0].[Picture]
FROM [dbo].[Categories] AS [t0]
WHERE [t0].[CategoryName] = @p0',N'@p0 nvarchar(4000)',@p0=N'Transformers'

-- Retrieves products. Actual result is one category.
exec sp_executesql N'SELECT [t0].[ProductID], [t0].[ProductName], [t0].[SupplierID], [t0].[CategoryID], [t0].[QuantityPerUnit], [t0].[UnitPrice], [t0].[UnitsInStock], [t0].[UnitsOnOrder], [t0].[ReorderLevel], [t0].[Discontinued]
FROM [dbo].[Products] AS [t0]
WHERE [t0].[ProductName] = @p0',N'@p0 nvarchar(4000)',@p0=N'OptimusPrime'

BEGIN TRANSACTION 

-- Deletes category first.
exec sp_executesql N'DELETE FROM [dbo].[Products] WHERE ([ProductID] = @p0) AND ([ProductName] = @p1) AND ([SupplierID] IS NULL) AND ([CategoryID] = @p2) AND ([QuantityPerUnit] IS NULL) AND ([UnitPrice] IS NULL) AND ([UnitsInStock] IS NULL) AND ([UnitsOnOrder] IS NULL) AND ([ReorderLevel] IS NULL) AND (NOT ([Discontinued] = 1))',N'@p0 int,@p1 nvarchar(4000),@p2 int',@p0=78,@p1=N'OptimusPrime',@p2=9

-- Deletes product then.
exec sp_executesql N'DELETE FROM [dbo].[Categories] WHERE ([CategoryID] = @p0) AND ([CategoryName] = @p1)',N'@p0 int,@p1 nvarchar(4000)',@p0=9,@p1=N'Transformers'

COMMIT TRANSACTION
```

It is clear LINQ to SQL uses TRANSACTION to implement data changing. This is will be talked in detail in the next post.

## Read-only DataContext

DataContext becomes read-only if tracking is disabled:
```
database.ObjectTrackingEnabled = false;
```

After this:

-   Object identity is disabled. each query always create a new entity.
-   State change will not tracked.
-   Association change will not be synchronized.
-   Invoking SubmitChanges() throws an InvalidOperationException, because it becomes impossible.

Internally, ObjectTrackingEnabled is checked at the beginning of SubmitChanges():
```
if (!this.ObjectTrackingEnabled)
{
    throw new InvalidOperationException(
        "Object tracking is not enabled for the current data context instance.");
}
```

The last thing is, ObjectTrackingEnabled must be set false before any query execution. Otherwise, after query execution, the tracking is already started and cannot be disabled.