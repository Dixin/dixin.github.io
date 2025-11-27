---
title: "Entity Framework and LINQ to Entities (2) Object-Relational Mapping"
published: 2016-02-20
description: ".NET and SQL database and have 2 different data type systems. For example:"
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework", "LINQ to Entities", "SQL Server", "SQL", "Object-Relational Mapping"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## EF Core version of this article: [https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping](/posts/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping")

.NET and SQL database and have 2 different data type systems. For example:

-   .NET has System.Int64 and System.String, while SQL database has bigint and nvarchar;
-   .NET has collections and objects, while SQL database has tables and rows;

etc.. Object-relational mapping is a popular technology to map and convert between programming language data objects and database system relational data. In Entity Framework, the LINQ to Entities queries are all based on Object-relational mapping.

Entity Framework provides [3 options](https://msdn.microsoft.com/en-us/library/ms178359.aspx#dbfmfcf) to build the mapping between C#/.NET and SQL database:

-   [Model first](https://msdn.microsoft.com/en-in/data/ff830362.aspx): The entity data models (a .edmx diagram consists of entities, entity properties, entity associations, etc.) are created in Entity Framework., typically with the [ADO.NET Entity Data Model Designer](https://msdn.microsoft.com/en-us/library/cc716685.aspx) tool in Visual Studio. Then, Entity Framework can use the models to generate database and the mapping .NET classes. In the following entity data models (a .edmx diagram) looks, the options to generate database/code are available from the right click menu. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/a174a530a37c_12C6E/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/a174a530a37c_12C6E/image_2.png)
-   [Database first](https://msdn.microsoft.com/en-us/data/jj206878.aspx): From an existing database, Entity Framework generates the entity data models (.edmx diagram) and the mapping .NET classes. In Visual Studio, the following Entity Data Model Wizard enables developer to select tables and other objects to generate entity data models (.edmx diagram) and code: [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/a174a530a37c_12C6E/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/a174a530a37c_12C6E/image_12.png)
-   Code first: The mapping .NET classes can be coded first, then they can be immediately work with Entity Framework and LINQ to Entities queries. Entity Framework generates the entity data models at runtime, so that a static .edmx diagram is not visible at design time in code base. If the database exits, the .NET classes are just mapped to the existing database; if not, Entity Framework can generate the database. [“Code first” is a bad naming](http://blogs.msdn.com/b/adonet/archive/2014/10/21/ef7-what-does-code-first-only-really-mean.aspx). It does not mean code comes first before the database exists. It is actually code-based modeling for [existing database](https://msdn.microsoft.com/en-us/data/jj200620) or [new database](https://msdn.microsoft.com/en-us/data/jj193542).

Comparing to code generation, it is more intuitive to build some classes to work with database. It is also much easier if the entity data models (.edmx diagram) is not involved. So this tutorial follows the code first approach, with an existing AdventureWorks database – the sample database from Microsoft, which already has data for query.

## Data types

Entity Framework can map most SQL data types to .NET types:

<table border="0" cellpadding="2" cellspacing="0" width="629"><tbody><tr><td width="190">SQL type category</td><td width="200">SQL type</td><td width="300">.NET type</td><td width="150">C# primitive</td></tr><tr><td width="190">Exact numeric</td><td width="200">bit</td><td width="300">System.Boolean</td><td width="150">bool</td></tr><tr><td width="190"></td><td width="200">tinyint</td><td width="300">System.Byte</td><td width="150">byte</td></tr><tr><td width="190"></td><td width="200">smallint</td><td width="300">System.Int16</td><td width="150">short</td></tr><tr><td width="190"></td><td width="200">int</td><td width="300">System.Int32</td><td width="150">int</td></tr><tr><td width="190"></td><td width="200">bigint</td><td width="300">System.Int64</td><td width="150">long</td></tr><tr><td width="190"></td><td width="200">smallmoney, money, decimal, numeric</td><td width="300">System.Decimal</td><td width="150">decimal</td></tr><tr><td width="190">Approximate numeric</td><td width="200">real</td><td width="300">System.Single</td><td width="150">float</td></tr><tr><td width="190"></td><td width="200">float</td><td width="300">System.Double</td><td width="150">double</td></tr><tr><td width="190">Character string</td><td width="200">char, varchar, text</td><td width="300">System.String</td><td width="150">string</td></tr><tr><td width="190"></td><td width="200">nchar, nvarchar, ntext</td><td width="300">System.String</td><td width="150">string</td></tr><tr><td width="190">Binary string</td><td width="200">binary, varbinary</td><td width="300">System.Byte[]</td><td width="150">byte[]</td></tr><tr><td width="190"></td><td width="200">image</td><td width="300">System.Byte[]</td><td width="150">byte[]</td></tr><tr><td width="190"></td><td width="200">rowversion (timestamp)</td><td width="300">System.Byte[]</td><td width="150">byte[]</td></tr><tr><td width="190">Date time</td><td width="200">date</td><td width="300">System.DateTime</td><td width="150"></td></tr><tr><td width="190"></td><td width="200">time</td><td width="300">System.TimeSpan</td><td width="150"></td></tr><tr><td width="190"></td><td width="200">smalldatetime, datetime, datetime2</td><td width="300">System.DateTime</td><td width="150"></td></tr><tr><td width="190"></td><td width="200">datetimeoffset</td><td width="300">System.DateTimeOffset</td><td width="150"></td></tr><tr><td width="190">Spatial type</td><td width="200">geography</td><td width="300">System.Data.Entity.Spatial.DbGeography</td><td width="150"></td></tr><tr><td width="190"></td><td width="200">geometry</td><td width="300">System.Data.Entity.Spatial.DbGeometry</td><td width="150"></td></tr><tr><td width="190">Other</td><td width="200">hierarchyid</td><td width="300">No built-in mapping or support</td><td width="150"></td></tr><tr><td width="190"></td><td width="200">xml</td><td width="300">System.String</td><td width="150">string</td></tr><tr><td width="190"></td><td width="200">uniqueidentifier</td><td width="300">System.Guid</td><td width="150"></td></tr><tr><td width="190"></td><td width="200">sql_variant</td><td width="300">No built-in mapping or support</td><td valign="top" width="107"></td></tr></tbody></table>

## Database

A SQL database is mapped to a class that derives from System.Data.Entity.DbContext:
```
public partial class AdventureWorks : DbContext
{
    public AdventureWorks()
        : base(ConnectionStrings.AdventureWorks)
    {
    }
}
```

DbContext is defined as:

```csharp
namespace System.Data.Entity
{
    public class DbContext : IDisposable, IObjectContextAdapter
    {
        public DbContext(string nameOrConnectionString);

        public DbChangeTracker ChangeTracker { get; }

        public DbContextConfiguration Configuration { get; }

        public Database Database { get; }

        ObjectContext IObjectContextAdapter.ObjectContext { get; } // From IObjectContextAdapter.

        public void Dispose(); // From IDisposable.

        // Other members.
    }
}
```

The database is specified in the connection string provided to DbContext’s constructor:
```
internal static partial class ConnectionStrings
{
    internal const string AdventureWorks = @"Data Source=(LocalDB)\MSSQLLocalDB;AttachDbFilename=|DataDirectory|\AdventureWorks_Data.mdf;Integrated Security=True;Connect Timeout=30";
}
```

Please replace the application domain property |DataDirectory| to the actual directory of the database file, or initialize it for current application domain before it is used:
```
internal static partial class ConnectionStrings
{
    static ConnectionStrings()
    {
        AppDomain.CurrentDomain.SetData("DataDirectory", @"D:\GitHub\CodeSnippets\Data");
    }
}
```

Generally, a database object should be constructed and disposed for each [unit of work](http://martinfowler.com/eaaCatalog/unitOfWork.html):
```
internal static partial class Query
{
    internal static void Dispose()
    {
        using (AdventureWorks adventureWorks = new AdventureWorks())
        {
            // Unit of work.
        }
    }
}
```

## Tables

There are tens of tables in the AdventureWorks database, but don’t worry, this tutorial only involves 5 tables, and a few columns of these tables. In Entity Framework, a table definition can be mapped to an entity class definition, where each column is mapped to a entity property. For example, the AdventureWorks database has a Production.ProductCategory table, which is defined as:

```sql
CREATE SCHEMA [Production]
GO

CREATE TYPE [dbo].[Name] FROM nvarchar(50) NULL
GO

CREATE TABLE [Production].[ProductCategory](
    [ProductCategoryID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_ProductCategory_ProductCategoryID] PRIMARY KEY CLUSTERED,

    [Name] [dbo].[Name] NOT NULL, -- nvarchar(50).

    [rowguid] uniqueidentifier ROWGUIDCOL NOT NULL -- Ignored in mapping.
        CONSTRAINT [DF_ProductCategory_rowguid] DEFAULT (NEWID()),
    
    [ModifiedDate] datetime NOT NULL -- Ignored in mapping.
        CONSTRAINT [DF_ProductCategory_ModifiedDate] DEFAULT (GETDATE()))
GO
```

Above Production.ProductCategory table definition can be mapped to a ProductCategory entity class definition:
```
public partial class AdventureWorks
{
    public const string Production = nameof(Production); // Production schema.
}

[Table(nameof(ProductCategory), Schema = AdventureWorks.Production)]
public partial class ProductCategory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductCategoryID { get; set; }

    [MaxLength(50)]
    [Required]
    public string Name { get; set; }

    // Other columns are ignored.
}
```

The \[Table\] attribute specifies the table name of schema. \[Table\] can be omitted when the table name is identical with the entity class name, and the table is under the default dbo schema.

In the table-entity class mapping:

-   The int column ProductCategoryID is mapped to a System.Int32 property with the same name.

-   The \[Key\] attribute indicates it has a unique key
-   \[DatabaseGenerated\] indicates it is an identity column

-   The Name column is of dbo.Name type. dbo.Name just nvarchar(50), so the Name property is of type System.String.

-   The \[MaxLength\] attribute indicates the max length is 50
-   \[Required\] indicates it should not be null

-   The other columns rowguid and ModifiedDate are not mapped. They are ignored in this tutorial, which is allowed by Entity Framework.

In the Entity Framework code first approach for existing database, the mapping properties work without the \[DatabaseGenerated\] attribute. This tutorial keeps this attribute only for readability purpose.

As a result, each row of Production.ProductCategory table is mapped to a ProductCategory object. However, at runtime, Entity Framework by default does not directly instantiate ProductCategory. It dynamically defines another proxy class to derive from ProductCategory class, with a name looks like System.Data.Entity.DynamicProxies.Product\_F84B0F952ED22479EF48782695177D770E63BC4D8771C9DF78343B4D95926AE8. This proxy class is where Entity Framework injects more detailed logic, so that at design time, the mapping entity class can be clean and declarative.

The rows of the entire table can be mapped to objects in an IQueryable<T> data source, exposed as a property of the database class. Entity Framework provides System.Data.Entity.DbSet<T> class to represent a table data source:
```
public partial class AdventureWorks
{
    public DbSet<ProductCategory> ProductCategories { get; set; }
}
```

DbSet<T> implements IQueryable<T>, and is derived from System.Data.Entity.Infrastructure.DbQuery<T> class:

```csharp
namespace System.Data.Entity.Infrastructure
{
    public class DbQuery<TResult> : IOrderedQueryable<TResult>, IQueryable<TResult>,
        IOrderedQueryable, IQueryable, IEnumerable<TResult>, IEnumerable,
        IDbAsyncEnumerable<TResult>, IDbAsyncEnumerable, IListSource, IInternalQueryAdapter
    {
        Type IQueryable.ElementType { get; }

        Expression IQueryable.Expression { get; }

        IQueryProvider IQueryable.Provider { get; } // Return System.Data.Entity.Internal.Linq.DbQueryProvider object.

        // Other members.
    }
}

namespace System.Data.Entity
{
    public class DbSet<TEntity> : DbQuery<TEntity>, IDbSet<TEntity>, IQueryable<TEntity>, IQueryable,
        IEnumerable<TEntity>, IEnumerable, IInternalSetAdapter where TEntity : class
    {
        // Members.
    }
}
```

The next example is the Production.ProductSubcategory table:
```
CREATE TABLE [Production].[ProductSubcategory](
    [ProductSubcategoryID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_ProductSubcategory_ProductSubcategoryID] PRIMARY KEY CLUSTERED,

    [Name] [dbo].[Name] NOT NULL, -- nvarchar(50).

    [ProductCategoryID] int NOT NULL
        CONSTRAINT [FK_ProductSubcategory_ProductCategory_ProductCategoryID] FOREIGN KEY
        REFERENCES [Production].[ProductCategory] ([ProductCategoryID]),

    /* Other ignored columns. */)
GO
```

Similarly, it can be mapped to:
```
[Table(nameof(ProductSubcategory), Schema = AdventureWorks.Production)]
public partial class ProductSubcategory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductSubcategoryID { get; set; }

    [MaxLength(50)]
    [Required]
    public string Name { get; set; }

    public int ProductCategoryID { get; set; }
}
```

Here ProductCategoryID is a foreign key. It will be further discussed soon.

In this tutorial, a few more tables of AdventureWorks database will be involved. Here is the Production.Product table definition:
```
CREATE TABLE [Production].[Product](
    [ProductID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_Product_ProductID] PRIMARY KEY CLUSTERED,

    [Name] [dbo].[Name] NOT NULL, -- nvarchar(50).

    [ListPrice] money NOT NULL,

    [ProductSubcategoryID] int NULL
        CONSTRAINT [FK_Product_ProductSubcategory_ProductSubcategoryID] FOREIGN KEY
        REFERENCES [Production].[ProductSubcategory] ([ProductSubcategoryID]),

    [Style] nchar(2) NULL
        CONSTRAINT [CK_Product_Style] 
        CHECK (UPPER([Style]) = N'U' OR UPPER([Style]) = N'M' OR UPPER([Style]) = N'W' OR [Style] IS NULL),
    
    /* Other ignored columns. */)
GO
```

It can be mapped to following Product entity class definition
```
[Table(nameof(Product), Schema = AdventureWorks.Production)]
public partial class Product
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductID { get; set; }

    [MaxLength(50)]
    [Required]
    public string Name { get; set; }

    public decimal ListPrice { get; set; }

    public int? ProductSubcategoryID { get; set; }

    // public string Style { get; set; }
}
```

In the mapping:

-   The ProductSubcategoryID column can be null, so it is mapped to a System.Nullable<int> property.
-   The Style column can only have value U, M, W, or NULL. It does not have a property mapping, because it will be used to demonstrate conditional mapping in inheritance later in this part.

And this is the Production.ProductPhoto table definition:
```
CREATE TABLE [Production].[ProductPhoto](
    [ProductPhotoID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_ProductPhoto_ProductPhotoID] PRIMARY KEY CLUSTERED,

    [LargePhotoFileName] nvarchar(50) NULL,
    
    [ModifiedDate] datetime NOT NULL 
        CONSTRAINT [DF_ProductPhoto_ModifiedDate] DEFAULT (GETDATE())

    /* Other ignored columns. */)
GO
```

It can be mapped to the following ProductPhoto entity class definition:
```
[Table(nameof(ProductPhoto), Schema = AdventureWorks.Production)]
public partial class ProductPhoto
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductPhotoID { get; set; }

    [MaxLength(50)]
    public string LargePhotoFileName { get; set; }

    [ConcurrencyCheck]
    public DateTime ModifiedDate { get; set; }
}
```

ModifiedDate has a \[ConcurrencyCheck\] attribute for concurrency conflict check, which will be discussed later.

Again, the rows of each table can be expose as objects in IQueryable<T> data source:
```
public partial class AdventureWorks
{
    public DbSet<ProductSubcategory> ProductSubcategories { get; set; }

    public DbSet<Product> Products { get; set; }

    public DbSet<ProductPhoto> ProductPhotos { get; set; }
}
```

## Relationships

In SQL database, tables can have [foreign key relationships](https://msdn.microsoft.com/en-us/library/ms189049.aspx). The following diagram visualizes the foreign key relationships of above 5 tables:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/a174a530a37c_12C6E/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/a174a530a37c_12C6E/image_8.png)

### One-to-many

From top down, the Production.ProductCategory table and Production.ProductSubcategory has a one-to-many relationship. A row in Production.ProductCategory table can have many matching rows in Production.ProductSubcategory table. In Entity Framework, this relashionship is mapped to the associations between ProductCategory and ProductSubcategory entity classes:
```
public partial class ProductCategory
{
    public virtual ICollection<ProductSubcategory> ProductSubcategories { get; set; } 
        = new HashSet<ProductSubcategory>();
}

public partial class ProductSubcategory
{
    // public int? ProductCategoryID { get; set; }
    public virtual ProductCategory ProductCategory { get; set; }
}
```

One ProductCategory object can have many ProductSubcategory objects, and one ProductSubcategory object can have one ProductCategory object. These association properties are also called navigation properties. They are virtual properties, so that the association implementation details can be provided by the override of proxy class.

Production.ProductSubcategory table and Production.Product table has the same one-to-many relationship. So the mapping associations are:
```
public partial class ProductSubcategory
{
    public virtual ICollection<Product> Products { get; set; } = new HashSet<Product>();
}

public partial class Product
{
    // public int? ProductSubcategoryID { get; set; }
    public virtual ProductSubcategory ProductSubcategory { get; set; }
}
```

### Many-to-many

Production.Product table and Production.ProductPhoto table has many-to-many relationship. This is implemented by 2 one-to-many relationships with another Production.ProductProductPhoto junction table. In Entity Framework, there are 2 options to map this. The first option is to directly defined the to-many navigation properties for the entities:
```
public partial class Product
{
    public virtual ICollection<ProductPhoto> ProductPhotos { get; set; }
        = new HashSet<ProductPhoto>();
}

public partial class ProductPhoto
{
    public virtual ICollection<Product> Products { get; set; } = new HashSet<Product>();
}
```

Then specify the many-to-many association between them, and the junction table information for Entity Framework:

```csharp
public partial class AdventureWorks
{
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder
            .Entity<Product>()
            .HasMany(product => product.ProductPhotos)
            .WithMany(photo => photo.Products)
            .Map(mapping => mapping
                .ToTable("ProductProductPhoto", Production)
                .MapLeftKey("ProductID")
                .MapRightKey("ProductPhotoID"));
    }
}
```

The other options is to map whatever the database has. The junction table \[Production\].\[ProductProductPhoto\] is defined as:
```
CREATE TABLE [Production].[ProductProductPhoto](
    [ProductID] int NOT NULL
        CONSTRAINT [FK_ProductProductPhoto_Product_ProductID] FOREIGN KEY
        REFERENCES [Production].[Product] ([ProductID]),

    [ProductPhotoID] int NOT NULL
        CONSTRAINT [FK_ProductProductPhoto_ProductPhoto_ProductPhotoID] FOREIGN KEY
        REFERENCES [Production].[ProductPhoto] ([ProductPhotoID]),

    CONSTRAINT [PK_ProductProductPhoto_ProductID_ProductPhotoID] PRIMARY KEY NONCLUSTERED ([ProductID], [ProductPhotoID])
    
    /* Other ignored columns. */)
GO
```

It is mapped to ProductProductPhoto entity class:
```
[Table(nameof(ProductProductPhoto), Schema = AdventureWorks.Production)]
public partial class ProductProductPhoto
{
    [Key]
    [Column(Order = 0)]
    public int ProductID { get; set; }

    [Key]
    [Column(Order = 1)]
    public int ProductPhotoID { get; set; }
}
```

Production.ProductProductPhoto table’s primary key is defined on both 2 columns, so the ProductID and ProductPhotoID properties are both attributed as \[Key\]. And because of this, the \[Column\] attribute must be used to specify their orders.

The many-to-many relationship is implemented by a one-to-many relationship between Production.Product and junction table, and another one-to-many relationship between Production.Product and junction table. These relationships are mapped to the following navigation properties:
```
public partial class Product
{
    public virtual ICollection<ProductProductPhoto> ProductProductPhotos { get; set; } 
        = new HashSet<ProductProductPhoto>();
}

public partial class ProductPhoto
{
    public virtual ICollection<ProductProductPhoto> ProductProductPhotos { get; set; } 
        = new HashSet<ProductProductPhoto>();
}

public partial class ProductProductPhoto
{
    // public int ProductID { get; set; }
    public virtual Product Product { get; set; }

    // public int ProductPhotoID { get; set; }
    public virtual ProductPhoto ProductPhoto { get; set; }        
}
```

Following the KISS principle (keep it simple stupid), this tutorial uses the second mapping approach, so that the mapping is the same as database.

## Inheritance

Above 5 tables’ mapping classes are independent from each other. In Entity Framework, the table’s mapping classes can also be in base/derived class of each other. Entity framework supports 3 types of inheritance for the mapping classes:

-   [Table per hierarchy (TPH)](https://msdn.microsoft.com/en-us/data/jj591617#2.4): one table is mapped with each base entity class and derived entity class in the class inheritance hierarchy.
-   [Table per type (TPT)](https://msdn.microsoft.com/en-us/data/jj591617#2.5): one table is mapped with one single entity class in the hierarchy
-   [Table per concrete type (TPC)](https://msdn.microsoft.com/en-us/data/jj591617#2.6): one table is mapped with one non-abstract entity class in the hierarchy.

This tutorial demonstrates the table per hierarchy inheritance, which is the default strategy of Entity Framework. In this case, one table is mapped to many entity classes in inheritance hierarchy, so a discriminator column is needed to specify each row’s mapping entity type. Above Production.Product table has a Style column to identify each row represents a women’s product (W), men’s product (M), or universal product (U). So the mapping hierarchy can be:

```csharp
public class WomensProduct : Product
{
}

public class MensProduct : Product
{
}

public class UniversalProduct : Product
{
}
```

Next, tell Entity Framework to map a row with W Style to a WomensProduct object, map a row with M Style to a MensProduct object, and map a row with U Style to a UniversalProduct object:

```csharp
public enum Style
{
    W,
    M,
    U
}

public partial class AdventureWorks
{
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder
            .Entity<Product>()
            .Map<WomensProduct>(mapping => mapping.Requires(nameof(Style)).HasValue(nameof(Style.W)))
            .Map<MensProduct>(mapping => mapping.Requires(nameof(Style)).HasValue(nameof(Style.M)))
            .Map<UniversalProduct>(mapping => mapping.Requires(nameof(Style)).HasValue(nameof(Style.U)));
    }
}
```

Here Style column is used for conditional class mapping, so it was not used for property mapping in above Product entity class definition. Style column can also be NULL. When a row has NULL Style, it is mapped to a Product object.

## Views

A view definition are also be mapped to a entity class definition, as if it is a table. Take the Production.vProductAndDescription view as example:

```sql
CREATE VIEW [Production].[vProductAndDescription2] 
WITH SCHEMABINDING 
AS 
SELECT 
    [product].[ProductID],
    [product].[Name],
    [model].[Name] AS [ProductModel],
    [culture].[CultureID],
    [description].[Description] 
FROM [Production].[Product] [product]
    INNER JOIN [Production].[ProductModel] [model]
    ON [product].[ProductModelID] = model.[ProductModelID] 
    INNER JOIN [Production].[ProductModelProductDescriptionCulture] [culture]
    ON [model].[ProductModelID] = [culture].[ProductModelID] 
    INNER JOIN [Production].[ProductDescription] [description]
    ON [culture].[ProductDescriptionID] = [description].[ProductDescriptionID];
GO
```

The mapping is:

```csharp
[Table(nameof(vProductAndDescription), Schema = AdventureWorks.Production)]
public class vProductAndDescription
{
    [Key]
    public int ProductID { get; set; }

    public string Name { get; set; }

    public string ProductModel { get; set; }

    public string CultureID { get; set; }

    public string Description { get; set; }
}

public class vProductAndDescriptionMapping : EntityTypeConfiguration<vProductAndDescription>
{
    public vProductAndDescriptionMapping()
    {
        this.ToTable(nameof(vProductAndDescription));
    }
}
```

\[Table\] is required for the view’s entity class. Also, in SQL database, views cannot have unique keys, but in the entity class, \[Key\] is still required just like tables. An additional mapping class and ToTable call are needed to make the view mapping work. And, finally, the rows in the view can be exposed as IQueryable<T> data source, still represented by DbSet<T>:
```
public partial class AdventureWorks
{
    public DbSet<vProductAndDescription> ProductAndDescriptions { get; set; }
}
```

## Stored procedures and functions

Entity Framework code first does not have built-in support to map stored procedures and functions in SQL database. But the .NET mapping can still be implemented for:

-   Stored procedures, with:
    -   single result type
    -   multiple result types
    -   output parameter
-   Table-valued functions
-   Scalar-valued functions
    -   composable
    -   non-composable
-   Aggregate functions
-   Built-in functions
-   Niladic functions
-   Model defined functions

These contents are covered by a separate article: [EntityFramework.Functions: Code First Functions for Entity Framework](https://weblogs.asp.net/Dixin/EntityFramework.Functions).