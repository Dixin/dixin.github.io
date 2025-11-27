---
title: "Entity Framework/Core and LINQ to Entities (2) Modeling Database: Object-Relational Mapping"
published: 2019-03-12
description: ".NET and SQL database and have 2 different data type systems. For example, .NET has System.Int64 and System.String, while SQL database has bigint and nvarchar; .NET has sequences and objects, while SQ"
image: ""
tags: ["C#", ".NET", ".NET Core", "LINQ", ".NET Standard"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## Latest EF Core version of this article: [https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping](/posts/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-2-modeling-database-object-relational-mapping")

## **EF version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-3-logging**](/posts/entity-framework-and-linq-to-entities-3-logging "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-3-logging")

.NET and SQL database and have 2 different data type systems. For example, .NET has System.Int64 and System.String, while SQL database has bigint and nvarchar; .NET has sequences and objects, while SQL database has tables and rows;, etc. Object-relational mapping is a popular technology to map and convert between application data objects and database relational data. In LINQ to Entities, the queries are based on Object-relational mapping.

> EF provides [3 options](https://msdn.microsoft.com/en-us/library/ms178359.aspx#dbfmfcf) to build the mapping between C#/.NET and SQL database:
> 
> -   [Model first](https://msdn.microsoft.com/en-in/data/ff830362.aspx): The entity data models (a .edmx diagram consists of entities, entity properties, entity associations, etc.) are first created in EF, typically by the [ADO.NET Entity Data Model Designer](https://msdn.microsoft.com/en-us/library/cc716685.aspx) tool in Visual Studio. Then, EF can use the models to generate database and the mapping .NET types. [![image_thumb_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb_thumb_thumb.png "image_thumb_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb_thumb_2.png)
> -   [Database first](https://msdn.microsoft.com/en-us/data/jj206878.aspx): From an existing database, EF can generate the entity data models (.edmx diagram) and the mapping .NET types., typically by Entity Data Model Wizard too: [![image_thumb5_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb5_thumb_thumb.png "image_thumb5_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb5_thumb_2.png)
> -   Code first: The mapping .NET types are coded to enabled LINQ to Entities queries and other operations. EF generates the entity data models at runtime, so there is no .edmx diagram at design time in the code base. If the database exits, the .NET types are just mapped to the existing database; if not, EF can generate the database. [“Code first” is not an intuitive naming](http://blogs.msdn.com/b/adonet/archive/2014/10/21/ef7-what-does-code-first-only-really-mean.aspx). It does not mean code is created before the database. It is just code-based modeling for [existing database](https://msdn.microsoft.com/en-us/data/jj200620) or [new database](https://msdn.microsoft.com/en-us/data/jj193542).

Comparing to code generation from entity data models (.edmx), it is more intuitive and transparent to build code from scratch. Also, regarding EF Core does not support entity data models (.edmx) and only supports code first, this tutorial follows the code first approach.

## Data types

EF/Core can map most SQL data types to .NET types:

<table border="0" cellpadding="2" cellspacing="0" width="771"><tbody><tr><td width="151">SQL type category</td><td width="260">SQL type</td><td width="264">.NET type</td><td width="94">C# primitive</td></tr><tr><td width="151">Exact numeric</td><td width="260">bit</td><td width="264">System.Boolean</td><td width="94">bool</td></tr><tr><td width="151"></td><td width="260">tinyint</td><td width="264">System.Byte</td><td width="94">byte</td></tr><tr><td width="151"></td><td width="260">smallint</td><td width="264">System.Int16</td><td width="94">short</td></tr><tr><td width="151"></td><td width="260">int</td><td width="264">System.Int32</td><td width="94">int</td></tr><tr><td width="151"></td><td width="260">bigint</td><td width="264">System.Int64</td><td width="94">long</td></tr><tr><td width="151"></td><td width="260">smallmoney, money, decimal, numeric</td><td width="264">System.Decimal</td><td width="94">decimal</td></tr><tr><td width="151">Approximate numeric</td><td width="260">real</td><td width="264">System.Single</td><td width="94">float</td></tr><tr><td width="151"></td><td width="260">float</td><td width="264">System.Double</td><td width="94">double</td></tr><tr><td width="151">Character string</td><td width="260">char, varchar, text</td><td width="264">System.String</td><td width="94">string</td></tr><tr><td width="151"></td><td width="260">nchar, nvarchar, ntext</td><td width="264">System.String</td><td width="94">string</td></tr><tr><td width="151">Binary string</td><td width="260">binary, varbinary</td><td width="264">System.Byte[]</td><td width="94">byte[]</td></tr><tr><td width="151"></td><td width="260">image</td><td width="264">System.Byte[]</td><td width="94">byte[]</td></tr><tr><td width="151"></td><td width="260">rowversion (timestamp)</td><td width="264">System.Byte[]</td><td width="94">byte[]</td></tr><tr><td width="151">Date time</td><td width="260">date</td><td width="264">System.DateTime</td><td width="94"></td></tr><tr><td width="151"></td><td width="260">time</td><td width="264">System.TimeSpan</td><td width="94"></td></tr><tr><td width="151"></td><td width="260">smalldatetime, datetime, datetime2</td><td width="264">System.DateTime</td><td width="94"></td></tr><tr><td width="151"></td><td width="260">datetimeoffset</td><td width="264">System.DateTimeOffset</td><td width="94"></td></tr><tr><td width="151">Spatial type</td><td width="260">geography</td><td width="264">System.Data.Entity.Spatial.DbGeography*</td><td width="94"></td></tr><tr><td width="151"></td><td width="260">geometry</td><td width="264">System.Data.Entity.Spatial.DbGeometry*</td><td width="94"></td></tr><tr><td width="151">Other</td><td width="260">hierarchyid</td><td width="264">No built-in mapping or support</td><td width="94"></td></tr><tr><td width="151"></td><td width="260">xml</td><td width="264">System.String</td><td width="94">string</td></tr><tr><td width="151"></td><td width="260">uniqueidentifier</td><td width="264">System.Guid</td><td width="94"></td></tr><tr><td width="151"></td><td width="260">sql_variant</td><td width="264">No built-in mapping or support</td><td valign="top" width="94"></td></tr></tbody></table>

> Currently the spatial types marked with \* are only supported by EF.

## Database

A SQL database is mapped to a type derived from DbContext:
```
public partial class AdventureWorks : DbContext { }
```

DbContext is provided as:

```csharp
namespace Microsoft.EntityFrameworkCore
{
    public class DbContext : IDisposable, IInfrastructure<IServiceProvider>
    {
        public DbContext(DbContextOptions options);

        public virtual ChangeTracker ChangeTracker { get; }

        public virtual DatabaseFacade Database { get; }

        public virtual void Dispose();

        public virtual int SaveChanges();

        public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;

        protected internal virtual void OnModelCreating(ModelBuilder modelBuilder);

        // Other members.
    }
}
```

> In EF, the members of DbContext and DbContext have slightly different signatures::
> 
> ```csharp
> namespace System.Data.Entity
> {
>     public class DbContext : IDisposable, IObjectContextAdapter
>     {
>         public DbContext(DbConnection existingConnection, bool contextOwnsConnection);
> 
>         public DbChangeTracker ChangeTracker { get; }
> 
>         public Database Database { get; }
> 
>         public void Dispose();
> 
>         public virtual int SaveChanges();
> 
>         public virtual DbSet<TEntity> Set<TEntity>() where TEntity : class;
> 
>         protected virtual void OnModelCreating(DbModelBuilder modelBuilder);
> 
>         // Other members.
>     }
> }
> ```

DbContext implements IDisposable. Generally, a database instance should be constructed and disposed for each [unit of work](http://martinfowler.com/eaaCatalog/unitOfWork.html) - a collection of data operations that should succeed or fail as a unit:
```
internal static void Dispose()
{
    using (AdventureWorks adventureWorks = new AdventureWorks())
    {
        // Unit of work.
    }
}
```

In EF/Core, most of the object-relational mapping can be implemented declaratively, and the rest of the mapping can be implemented imperatively by overriding DbContext.OnModelCreating, which is called by EF/Core when initializing the entity models:

```csharp
public partial class AdventureWorks
{
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        MapCompositePrimaryKey(modelBuilder);
        MapManyToMany(modelBuilder);
        MapDiscriminator(modelBuilder);
    }
}
```

The above MapCompositePrimaryKey, MapManyToMany, MapDiscriminator methods are implemented soon later.

### Connection resiliency and execution retry strategy

As the mapping of the database, AdventureWorks also manages the connection to the database, which can be injected from the constructor:
```
public partial class AdventureWorks
{
    public AdventureWorks(DbConnection connection = null)
        : base(new DbContextOptionsBuilder<AdventureWorks>().UseSqlServer(
            connection: connection ?? new SqlConnection(ConnectionStrings.AdventureWorks),
            sqlServerOptionsAction: options => options.EnableRetryOnFailure(
                maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(30), errorNumbersToAdd: null)).Options) { }
}
```

Here when database connection is not provided to the constructor, a new database connection is created with the previously defined connection string. Also, regarding the connection between application and SQL database may be interrupted (because of network, etc.), EF/Core support connection resiliency for SQL database. This is especially helpful for Azure SQL database deployed in the cloud instead of local network. In the above example, EF Core is specified to automatically retries up to 5 times with the retry interval of 30 seconds.

> In EF, the database connection can be injected through constructor too:
> 
> ```
> public partial class AdventureWorks
> {
>     public AdventureWorks(DbConnection connection = null) : base(
>         existingConnection: connection ?? new SqlConnection(ConnectionStrings.AdventureWorks),
>         contextOwnsConnection: connection == null) { }
> }
> ```
> 
> The connection resiliency needs to be specified as part of the EF configuration, which must be a type derived from System.Data.Entity.DbConfiguration:
> 
> ```csharp
> public class RetryConfiguration : DbConfiguration
> {
>     public RetryConfiguration()
>     {
>         this.SetExecutionStrategy(
>             providerInvariantName: SqlProviderServices.ProviderInvariantName,
>             getExecutionStrategy: () => ExecutionStrategy.DisableExecutionStrategy
>                 ? new DefaultExecutionStrategy() : ExecutionStrategy.Create());
>     }
> }
> 
> public partial class ExecutionStrategy
> {
>     public static bool DisableExecutionStrategy
>     {
>         get => (bool?)CallContext.LogicalGetData(nameof(DisableExecutionStrategy)) ?? false;
>         set => CallContext.LogicalSetData(nameof(DisableExecutionStrategy), value);
>     }
> 
>     public static IDbExecutionStrategy Create() =>
>         new SqlAzureExecutionStrategy(maxRetryCount: 5, maxDelay: TimeSpan.FromSeconds(30));
> }
> ```
> 
> At runtime, EF discovers and instantiates the above RetryConfiguration type with reflection, so that RetryConfiguration constructor is called. Here ExecutionStrategy.DisableExecutionStrategy can be used to turn on/off the above default retry logic: when ExecutionStrategy.DisableExecutionStrategy is true, a System.Data.Entity.Infrastructure.DefaultExecutionStrategy instance specifies EF do not retry; when it is false, a System.Data.Entity.SqlServer.SqlAzureExecutionStrategy instance specified EF to retry up to 5 times with the retry interval of 30 seconds.
> 
> Why not simply leave the retry enabled all the time? The reason is, EF connection resiliency does not directly work with custom transactions. So this switch is introduced to disable default retry logic for custom transactions, which is discussed in the transaction part.

## Tables

There are tens of tables in the AdventureWorks database, but don’t panic, this tutorial only involves a few tables, and a few columns of these tables. In EF/Core, a table definition can be mapped to an entity type definition, where each column is mapped to a entity property. For example, the AdventureWorks database has a Production.ProductCategory table, which is defined as:

```sql
CREATE SCHEMA [Production];
GO

CREATE TYPE [dbo].[Name] FROM nvarchar(50) NULL;
GO

CREATE TABLE [Production].[ProductCategory](
    [ProductCategoryID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_ProductCategory_ProductCategoryID] PRIMARY KEY CLUSTERED,

    [Name] [dbo].[Name] NOT NULL, -- nvarchar(50).

    [rowguid] uniqueidentifier ROWGUIDCOL NOT NULL -- Ignored in mapping.
        CONSTRAINT [DF_ProductCategory_rowguid] DEFAULT (NEWID()),
    
    [ModifiedDate] datetime NOT NULL -- Ignored in mapping.
        CONSTRAINT [DF_ProductCategory_ModifiedDate] DEFAULT (GETDATE()));
GO
```

This table definition can be mapped to a ProductCategory entity definition:
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

The \[Table\] attribute specifies the table name and schema. \[Table\] can be omitted when the table name is the same as the entity name, and the table is under the default dbo schema. In the table-entity mapping:

-   The ProductCategoryID column of int type is mapped to a System.Int32 property with the same name. The \[Key\] attribute indicates it is a primary key. EF/Core requires a table to have primary key to be mapped. \[DatabaseGenerated\] indicates it is an identity column, with value generated by database.
-   The Name column is of dbo.Name type. which is actually nvarchar(50), so it is mapped to Name property of type System.String. The \[MaxLength\] attribute indicates the max length of the string value is 50. \[Required\] indicates it should not be null or empty string or whitespace string.
-   The other columns rowguid and ModifiedDate are not mapped. They are not used in this tutorial to keep the code examples simple.

At runtime, each row of Production.ProductCategory table is mapped to a ProductCategory instance.

> EF by default does not directly instantiate ProductCategory. It dynamically defines another proxy type derived from ProductCategory, with a name like System.Data.Entity.DynamicProxies.Product\_F84B0F952ED22479EF48782695177D770E63BC4D8771C9DF78343B4D95926AE8. This proxy type is where EF injects more logic like lazy loading, so that at design time the mapping entity type can be clean and declarative.

The rows of the entire table can be mapped to objects in an IQueryable<T> data source, exposed as a property of the database type. DbSet<T> implements IQueryable<T>, and is provided to represent a table data source:
```
public partial class AdventureWorks
{
    public DbSet<ProductCategory> ProductCategories { get; set; }
}
```

## Relationships

In SQL database, tables can have [foreign key relationships](https://msdn.microsoft.com/en-us/library/ms189049.aspx), including one-to-one, one-to-many, and many-to-many relationships.

### One-to-one

The following Person.Person table and HumanResources.Employee table has a one-to-one relationship:

[![image_thumb4](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb4_thumb.png "image_thumb4")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb4_2.png)

HumanResources.Employee table’s BusinessEntityID column is a foreign key that refers to Person.Person table’s primary key:
```
CREATE TABLE [Person].[Person](
    [BusinessEntityID] int NOT NULL
        CONSTRAINT [PK_Person_BusinessEntityID] PRIMARY KEY CLUSTERED,

    [FirstName] [dbo].[Name] NOT NULL,

    [LastName] [dbo].[Name] NOT NULL

    /* Other columns. */);
GO

CREATE TABLE [HumanResources].[Employee](
    [BusinessEntityID] int NOT NULL
        CONSTRAINT [PK_Employee_BusinessEntityID] PRIMARY KEY CLUSTERED
        CONSTRAINT [FK_Employee_Person_BusinessEntityID] FOREIGN KEY
        REFERENCES [Person].[Person] ([BusinessEntityID]),
    
    [JobTitle] nvarchar(50) NOT NULL,

    [HireDate] date NOT NULL

    /* Other columns. */);
GO
```

So each row in HumanResources.Employee table refers to one row in Person.Person table (an employee must be a person). On the other hand, each row in Person.Person table can be referred by 0 or 1 row in HumanResources.Employee table (a person can be an employee, or not). This relationship can be represented by navigation property of entity type:
```
public partial class AdventureWorks
{
    public const string Person = nameof(Person);

    public const string HumanResources = nameof(HumanResources);

    public DbSet<Person> People { get; set; }

    public DbSet<Employee> Employees { get; set; }
}

[Table(nameof(Person), Schema = AdventureWorks.Person)]
public partial class Person
{
    [Key]
    public int BusinessEntityID { get; set; }

    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; }

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; }

    public virtual Employee Employee { get; set; } // Reference navigation property.
}

[Table(nameof(Employee), Schema = AdventureWorks.HumanResources)]
public partial class Employee
{
    [Key]
    [ForeignKey(nameof(Person))]
    public int BusinessEntityID { get; set; }
        
    [Required]
    [MaxLength(50)]
    public string JobTitle { get; set; }

    public DateTime HireDate { get; set; }

    public virtual Person Person { get; set; } // Reference navigation property.
}
```

The \[ForeignKey\] attribute indicates Employee entity’s BusinessEntityID property is the foreign key for the relationship represented by navigation property. Here Person is called the primary entity, and Employee is called the dependent entity. Their navigation properties are called reference navigation properties, because each navigation property can refer to a single entity.

> For EF, the navigation property needs to be virtual to enable proxy entity to implement lazy loading. This will be discussed in the lazy loading part. EF Core does not support lazy loading, so the virtual keyword does not make difference for EF Core.

### One-to-many

The Production.ProductCategory and Production.ProductSubcategory tables have a one-to-many relationship, so are Production.ProductSubcategory and Production.Product:

[![image_thumb3](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb3_thumb.png "image_thumb3")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb3_2.png)

Each row in Production.ProductCategory table can refer to many rows in Production.ProductSubcategory table (category can have many subcategories), and each row in Production.ProductSubcategory table can refer to many rows in Production.Product table (ubcategory can have many products):
```
CREATE TABLE [Production].[ProductSubcategory](
    [ProductSubcategoryID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_ProductSubcategory_ProductSubcategoryID] PRIMARY KEY CLUSTERED,

    [Name] [dbo].[Name] NOT NULL, -- nvarchar(50).

    [ProductCategoryID] int NOT NULL
        CONSTRAINT [FK_ProductSubcategory_ProductCategory_ProductCategoryID] FOREIGN KEY
        REFERENCES [Production].[ProductCategory] ([ProductCategoryID]),

    /* Other columns. */)
GO

CREATE TABLE [Production].[Product](
    [ProductID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_Product_ProductID] PRIMARY KEY CLUSTERED,

    [Name] [dbo].[Name] NOT NULL, -- nvarchar(50).

    [ListPrice] money NOT NULL,

    [ProductSubcategoryID] int NULL
        CONSTRAINT [FK_Product_ProductSubcategory_ProductSubcategoryID] FOREIGN KEY
        REFERENCES [Production].[ProductSubcategory] ([ProductSubcategoryID])
    
    /* Other columns. */)
GO
```

These one-to-many relationships can be represented by navigation property of type ICollection<T>:
```
public partial class ProductCategory
{
    public virtual ICollection<ProductSubcategory> ProductSubcategories { get; set; } // Collection navigation property.
}

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

    public virtual ProductCategory ProductCategory { get; set; } // Reference navigation property.

    public virtual ICollection<Product> Products { get; set; } // Collection navigation property.
}

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

    public virtual ProductSubcategory ProductSubcategory { get; set; } // Reference navigation property.
}
```

Notice Production.Product table’s ProductSubcategoryID column is nullable, so it is mapped to a System.Nullable<int> property. Here \[ForeignKey\] attribute is omitted, because the dependent entities’ foreign keys are different from their primary keys, and each foreign key have the same name as its primary key, so they can be automatically discovered by EF/Core.

### Many-to-many

Production.Product and Production.ProductPhoto tables has many-to-many relationship.

[![image_thumb2](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb2_thumb.png "image_thumb2")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Entity-FrameworkCore-and-LINQ-to-Entitie_2797/image_thumb2_2.png)

This is implemented by 2 one-to-many relationships with another Production.ProductProductPhoto junction table:
```
CREATE TABLE [Production].[ProductPhoto](
    [ProductPhotoID] int IDENTITY(1,1) NOT NULL
        CONSTRAINT [PK_ProductPhoto_ProductPhotoID] PRIMARY KEY CLUSTERED,

    [LargePhotoFileName] nvarchar(50) NULL,
    
    [ModifiedDate] datetime NOT NULL 
        CONSTRAINT [DF_ProductPhoto_ModifiedDate] DEFAULT (GETDATE())

    /* Other columns. */)
GO

CREATE TABLE [Production].[ProductProductPhoto](
    [ProductID] int NOT NULL
        CONSTRAINT [FK_ProductProductPhoto_Product_ProductID] FOREIGN KEY
        REFERENCES [Production].[Product] ([ProductID]),

    [ProductPhotoID] int NOT NULL
        CONSTRAINT [FK_ProductProductPhoto_ProductPhoto_ProductPhotoID] FOREIGN KEY
        REFERENCES [Production].[ProductPhoto] ([ProductPhotoID]),

    CONSTRAINT [PK_ProductProductPhoto_ProductID_ProductPhotoID] PRIMARY KEY NONCLUSTERED ([ProductID], [ProductPhotoID])
    
    /* Other columns. */)
GO
```

So the many-to-many relationship can be mapped to 2 one-to-many relationships with the junction:
```
public partial class Product
{
    public virtual ICollection<ProductProductPhoto> ProductProductPhotos { get; set; } // Collection navigation property.
}

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

    public virtual ICollection<ProductProductPhoto> ProductProductPhotos { get; set; } // Collection navigation property.
}

[Table(nameof(ProductProductPhoto), Schema = AdventureWorks.Production)]
public partial class ProductProductPhoto
{
    [Key]
    [Column(Order = 0)]
    public int ProductID { get; set; }

    [Key]
    [Column(Order = 1)]
    public int ProductPhotoID { get; set; }

    public virtual Product Product { get; set; } // Reference navigation property.

    public virtual ProductPhoto ProductPhoto { get; set; } // Reference navigation property.
}
```

ProductPhoto.ModifiedDate has a \[ConcurrencyCheck\] attribute for concurrency conflict check, which is discussed in the concurrency part. Production.ProductProductPhoto table has a composite primary key. As a junction table, each row in the table has a unique combination of ProductID and ProductPhotoID. EF Core requires additional information for composite primary key, which can be provided as anonymous type in OnModelCreating:

```csharp
public partial class AdventureWorks
{
    private static void MapCompositePrimaryKey(ModelBuilder modelBuilder) // Called by OnModelCreating.
    {
        modelBuilder.Entity<ProductProductPhoto>()
            .HasKey(productProductPhoto => new
            {
                ProductID = productProductPhoto.ProductID,
                ProductPhotoID = productProductPhoto.ProductPhotoID
            });
    }
}
```

> EF does not require above anonymous type to represent composite primary key, but it requires the ordering, which can be simply provided by the \[Column\] attribute.

EF Core also requires additional information for many-to-many relationship represented by 2 one-to-many relationships, which can be provided in OnModelCreating as well:

```csharp
public partial class AdventureWorks
{
    private static void MapManyToMany(ModelBuilder modelBuilder) // Called by OnModelCreating.
    {
        modelBuilder.Entity<ProductProductPhoto>()
            .HasOne(productProductPhoto => productProductPhoto.Product)
            .WithMany(product => product.ProductProductPhotos)
            .HasForeignKey(productProductPhoto => productProductPhoto.ProductID);

        modelBuilder.Entity<ProductProductPhoto>()
            .HasOne(productProductPhoto => productProductPhoto.ProductPhoto)
            .WithMany(photo => photo.ProductProductPhotos)
            .HasForeignKey(productProductPhoto => productProductPhoto.ProductPhotoID);
    }
}
```

> The above code in MapCompositePrimaryKey and MapManyToMany methods are not needed by EF.
> 
> EF also provides another option to directly map the many-to-many relationship with API calls. With the this approach, the above ProductProductPhoto entity and one-to-many navigation properties are not needed. Just define 2 collection navigation properties, and specified the mapping in OnModelCreating:
> 
> ```csharp
> public partial class Product
> {
>     public virtual ICollection<ProductPhoto> ProductPhotos { get; set; }
> }
> 
> public partial class ProductPhoto
> {
>     public virtual ICollection<Product> Products { get; set; }
> }
> 
> public partial class AdventureWorks
> {
>     protected override void OnModelCreating(DbModelBuilder modelBuilder)
>     {
>         base.OnModelCreating(modelBuilder);
> 
>         modelBuilder
>             .Entity<Product>()
>             .HasMany(product => product.ProductPhotos)
>             .WithMany(photo => photo.Products)
>             .Map(mapping => mapping
>                 .ToTable(nameof(ProductProductPhoto), Production)
>                 .MapLeftKey(nameof(Product.ProductID))
>                 .MapRightKey(nameof(ProductPhoto.ProductPhotoID)));
>     }
> }
> ```

Finally, the rows of each above table can be expose as an IQueryable<T> data source:
```
public partial class AdventureWorks
{
    public DbSet<Person> People { get; set; }

    public DbSet<Employee> Employees { get; set; }

    public DbSet<ProductSubcategory> ProductSubcategories { get; set; }

    public DbSet<Product> Products { get; set; }

    public DbSet<ProductPhoto> ProductPhotos { get; set; }
}
```

## Inheritance

EF/Core also supports inheritance for entity types.

> EF supports 3 types of inheritance for the mapping:
> 
> -   [Table per hierarchy (TPH)](https://msdn.microsoft.com/en-us/data/jj591617#2.4): 1 table is mapped with each base entity type and derived entity type in the inheritance hierarchy.
> -   [Table per type (TPT)](https://msdn.microsoft.com/en-us/data/jj591617#2.5): 1 table is mapped with one single entity type in the hierarchy
> -   [Table per concrete type (TPC)](https://msdn.microsoft.com/en-us/data/jj591617#2.6): one table is mapped with one non-abstract entity type in the hierarchy.

EF Core supports table per hierarchy (TPH) inheritance, which is also the default strategy of EF. With TPH, rows in 1 table is mapped to many entities in the inheritance hierarchy, so a discriminator column is needed to identify each specific row’s mapping entity. Take the following Production.TransactionHistory table as example:
```
CREATE TABLE [Production].[TransactionHistory](
    [TransactionID] int IDENTITY(100000,1) NOT NULL
        CONSTRAINT [PK_TransactionHistory_TransactionID] PRIMARY KEY CLUSTERED,

    [ProductID] int NOT NULL
        CONSTRAINT [FK_TransactionHistory_Product_ProductID] FOREIGN KEY
        REFERENCES [Production].[Product] ([ProductID]),

    [TransactionDate] datetime NOT NULL,

    [TransactionType] nchar(1) NOT NULL
        CONSTRAINT [CK_Product_Style] 
        CHECK (UPPER([TransactionType]) = N'P' OR UPPER([TransactionType]) = N'S' OR UPPER([TransactionType]) = N'W'),

    [Quantity] int NOT NULL,

    [ActualCost] money NOT NULL

    /* Other columns. */);
GO
```

Its TransactionType column allows value “P”, “S”, or “W” to indicate each row representing a purchase transaction, sales transaction, or work transaction. So the mapping hierarchy can be:

```csharp
[Table(nameof(TransactionHistory), Schema = AdventureWorks.Production)]
public abstract class TransactionHistory
{
    [Key]
    public int TransactionID { get; set; }

    public int ProductID { get; set; }

    public DateTime TransactionDate { get; set; }

    public int Quantity { get; set; }

    public decimal ActualCost { get; set; }
}

public class PurchaseTransactionHistory : TransactionHistory { }

public class SalesTransactionHistory : TransactionHistory { }

public class WorkTransactionHistory : TransactionHistory { }
```

Then the discriminator must be specified via OnModelCreating. The EF and EF Core APIs are different:

```csharp
public enum TransactionType { P, S, W }

public partial class AdventureWorks
{
    private static void MapDiscriminator(ModelBuilder modelBuilder) // Called by OnModelCreating.
    {
#if EF
        modelBuilder
            .Entity<TransactionHistory>()
            .Map<PurchaseTransactionHistory>(mapping => mapping.Requires(nameof(TransactionType))
                .HasValue(nameof(TransactionType.P)))
            .Map<SalesTransactionHistory>(mapping => mapping.Requires(nameof(TransactionType))
                .HasValue(nameof(TransactionType.S)))
            .Map<WorkTransactionHistory>(mapping => mapping.Requires(nameof(TransactionType))
                .HasValue(nameof(TransactionType.W)));
#else
        modelBuilder.Entity<TransactionHistory>()
            .HasDiscriminator<string>(nameof(TransactionType))
            .HasValue<PurchaseTransactionHistory>(nameof(TransactionType.P))
            .HasValue<SalesTransactionHistory>(nameof(TransactionType.S))
            .HasValue<WorkTransactionHistory>(nameof(TransactionType.W));
#endif
    }
}
```

Now these entities can all be exposed as data sources:
```
public partial class AdventureWorks
{
    public DbSet<TransactionHistory> Transactions { get; set; }

    public DbSet<PurchaseTransactionHistory> PurchaseTransactions { get; set; }

    public DbSet<SalesTransactionHistory> SalesTransactions { get; set; }

    public DbSet<WorkTransactionHistory> WorkTransactions { get; set; }
}
```

## Views

A view can also be mapped as if it is a table, if the view has one or more columns which can be viewed as primary key. Take the Production.vEmployee view as example:

```sql
CREATE VIEW [HumanResources].[vEmployee] 
AS 
SELECT 
    e.[BusinessEntityID],
    p.[FirstName],
    p.[LastName],
    e.[JobTitle]  
    -- Other columns.
FROM [HumanResources].[Employee] e
    INNER JOIN [Person].[Person] p
    ON p.[BusinessEntityID] = e.[BusinessEntityID]
    /* Other tables. */;
GO
```

The BusinessEntityID is unique and can be viewed as primary key. So it can be mapped to the following entity:

```csharp
[Table(nameof(vEmployee), Schema = AdventureWorks.HumanResources)]
public class vEmployee
{
    [Key]
    public int BusinessEntityID { get; set; }

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string JobTitle { get; set; }
}
```

And then expose as data source:
```
public partial class AdventureWorks
{
    public DbSet<vEmployee> vEmployees { get; set; }
}
```

## Stored procedures and functions

> EF can also mapping stored procedures and functions in SQL database, including:
> 
> -   Stored procedures, with single result type, multiple result types, output parameter
> -   Table-valued functions
> -   Scalar-valued functions, composable or non-composable
> -   Aggregate functions
> -   Built-in functions
> -   Niladic functions
> -   Model defined functions
> 
> These contents are covered by a separate article: [EntityFramework.Functions: Code First Functions for Entity Framework](https://weblogs.asp.net/Dixin/EntityFramework.Functions).