---
title: "Understanding LINQ to SQL (1) Object-Relational Mapping"
published: 2010-03-28
description: "\\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to SQL", "LINQ via C#", "SQL Server", "Visual Studio"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

According to [Wikipedia](http://en.wikipedia.org/wiki/Object-relational_mapping), Object-relational mapping is:

> a [programming](http://en.wikipedia.org/wiki/Computer_programming) technique for converting data between incompatible [type systems](http://en.wikipedia.org/wiki/Type_system) in [relational databases](http://en.wikipedia.org/wiki/Relational_database) and [object-oriented](http://en.wikipedia.org/wiki/Object-oriented) programming languages.

This is the LINQ to SQL sample code at the beginning of this series:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    var results = from product in database.Products
                  where product.Category.CategoryName == "Beverages"
                  select new
                  {
                      product.ProductName,
                      product.UnitPrice
                  };
    foreach (var item in results)
    {
        Console.WriteLine(
            "{0}: {1}", 
            item.ProductName, 
            item.UnitPrice.ToString(CultureInfo.InvariantCulture));
    }
}
```

According to [this post](/posts/understanding-csharp-3-0-features-7-query-expression), the above query expression will be compiled to query methods:

```csharp
var results = database.Products.Where(product => product.Category.CategoryName == "Beverages")
                               .Select(product => new
                                                      {
                                                          product.ProductName,
                                                          product.UnitPrice
                                                      });
```

It is querying the ProductName and UnitPrice fields of the Products table in the Northwind database, which belong to the specified CategoryName. To work with SQL Server representations (fields, tables, databases) in C# representations (object models), the mappings between SQL representations and C# representations need to be created. LINQ to SQL provides an Object-relational mapping designer tool to create those objects models automatically.

## Create C# models from SQL schema

The easiest way of modeling is to use Visual Studio IDE. This way works with:

-   SQL Server 2000
-   SQL Server 2005
-   SQL Server 2008
-   SQL Server 2008 R2

Take the [Northwind database](http://go.microsoft.com/fwlink/?linkid=30196) as an example. First, setup a data connection to the Northwind database:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_16BE86DC.png "image")

Then, create a “LINQ to SQL Classes” item to the project:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_32AC45F9.png "image")

By creating a Northwind.dbml file, the O/R designer is opened:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_057A836C.png "image")

Since the above query works with the Products table and the Categories table, just drag the 2 tables and drop to the O/R designer:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_00D452E5.png "image")

In the designer, the modeling is done. Please notice that the foreign key between Categories table and Products table is recognized, and the corresponding association is created in the designer.

Now the object models are ready to rock. Actually the designer has automatically created the following C# code:

-   Category class: represents each record in Categories table;
    -   CategoryID property (an int): represents the CategoryID field; So are the other properties shown above;
    -   Products propery (a collection of Product object): represents the associated many records in Products table
-   Product class: represents each record in Products table;
    -   ProductID property (an int): represents the ProductID field; So are the other properties shown above;
    -   Category propery (a Category object): represents the associated one records in Products table;
-   NorthwindDataContext class: represents the Northwind database;
    -   Categories property (a collection of the Category objects): represents the Categories table;
    -   Products property (a collection of the Product objects): represents the Products table;

Besides, database, tables, fields, other SQL stuff can also be modeled by this O/R designer:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_7380D056.png "image")

<table border="0" cellpadding="2" cellspacing="0" width="732"><tbody><tr><td valign="top" width="191">SQL representation</td><td valign="top" width="253">C# representation</td><td valign="top" width="286">Sample</td></tr><tr><td valign="top" width="191">Database</td><td valign="top" width="253">DataContext derived class</td><td valign="top" width="286">NothwindDataContext</td></tr><tr><td valign="top" width="191">Table, View</td><td valign="top" width="253">DataContext derived class’s property</td><td valign="top" width="286">NothwindDataContext.Categories</td></tr><tr><td valign="top" width="191">Record</td><td valign="top" width="253">Entity class</td><td valign="top" width="286">Category</td></tr><tr><td valign="top" width="191">Field</td><td valign="top" width="253">Entity class’s property</td><td valign="top" width="286">Category.CategoryName</td></tr><tr><td valign="top" width="191">Foreign key</td><td valign="top" width="253">Association between entity classes</td><td valign="top" width="286">Category.Products</td></tr><tr><td valign="top" width="191">Stored procedure, function</td><td valign="top" width="253">DataContext derived class’s method</td><td valign="top" width="286">NothwindDataContext.SalesByCategory()</td></tr></tbody></table>

Another way to generate the models is to use the command line tool [SqlMetal.exe](http://msdn.microsoft.com/en-us/library/bb386987.aspx). Please check MSDN for [details of code generation](http://msdn.microsoft.com/en-us/library/bb399400.aspx).

And, please notice that, the Category entity class is generated from the Categories table. Here plural name is renamed to singular name, because a Category object is the mapping of one record of Categories table. This can be configured in Visual Studio:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_406769FD.png "image")

## Implement the mapping

Now take a look at how the SQL representations are mapped to C# representations.

The Northwind.dbml is nothing but an XML file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- [Northwind] database is mapped to NorthwindDataContext class. -->
<Database Name="Northwind" Class="NorthwindDataContext" xmlns="http://schemas.microsoft.com/linqtosql/dbml/2007">
    <!-- Connection string -->
    <Connection Mode="WebSettings" ConnectionString="Data Source=localhost;Initial Catalog=Northwind;Integrated Security=True" SettingsObjectName="System.Configuration.ConfigurationManager.ConnectionStrings" SettingsPropertyName="NorthwindConnectionString" Provider="System.Data.SqlClient" />

    <!-- Categories property is a member of NorthwindDataContext class. -->
    <Table Name="dbo.Categories" Member="Categories">
        <!-- [Categories] table is mapped to Category class. -->
        <Type Name="Category">
            <!-- [CategoryID] (SQL Int) field is mapped to CategoryID property (C# int). -->
            <Column Name="CategoryID" Type="System.Int32" DbType="Int NOT NULL IDENTITY" IsPrimaryKey="true" IsDbGenerated="true" CanBeNull="false" />
            <!-- [CategoryName] (SQL NVarChar(15)) field is mapped to CategoryName property (C# string). -->
            <Column Name="CategoryName" Type="System.String" DbType="NVarChar(15) NOT NULL" CanBeNull="false" />
            <!-- Other fields. -->
            <Column Name="Description" Type="System.String" DbType="NText" CanBeNull="true" UpdateCheck="Never" />
            <Column Name="Picture" Type="System.Data.Linq.Binary" DbType="Image" CanBeNull="true" UpdateCheck="Never" />
            <!-- [Categories] is associated with [Products] table via a foreign key.
            So Category class has a Products peoperty to represent the associated many Product objects. -->
            <Association Name="Category_Product" Member="Products" ThisKey="CategoryID" OtherKey="CategoryID" Type="Product" />
        </Type>
    </Table>

    <!-- Products property is a member of NorthwindDataContext class. -->
    <Table Name="dbo.Products" Member="Products">
        <!-- [Products] table is mapped to Product class. -->
        <Type Name="Product">
            <!-- Fields. -->
            <Column Name="ProductID" Type="System.Int32" DbType="Int NOT NULL IDENTITY" IsPrimaryKey="true" IsDbGenerated="true" CanBeNull="false" />
            <Column Name="ProductName" Type="System.String" DbType="NVarChar(40) NOT NULL" CanBeNull="false" />
            <Column Name="SupplierID" Type="System.Int32" DbType="Int" CanBeNull="true" />
            <Column Name="CategoryID" Type="System.Int32" DbType="Int" CanBeNull="true" />
            <Column Name="QuantityPerUnit" Type="System.String" DbType="NVarChar(20)" CanBeNull="true" />
            <Column Name="UnitPrice" Type="System.Decimal" DbType="Money" CanBeNull="true" />
            <Column Name="UnitsInStock" Type="System.Int16" DbType="SmallInt" CanBeNull="true" />
            <Column Name="UnitsOnOrder" Type="System.Int16" DbType="SmallInt" CanBeNull="true" />
            <Column Name="ReorderLevel" Type="System.Int16" DbType="SmallInt" CanBeNull="true" />
            <Column Name="Discontinued" Type="System.Boolean" DbType="Bit NOT NULL" CanBeNull="false" />
            <!-- [Products] is associated with [Products] table via a foreign key.
            So Product class has a Category peoperty to represent the associated one Category object. -->
            <Association Name="Category_Product" Member="Category" ThisKey="CategoryID" OtherKey="CategoryID" Type="Category" IsForeignKey="true" />
        </Type>
    </Table>
</Database>
```

It describes how the SQL stuff are mapped to C# stuff.

A Northwind.dbml.layout file is created along with the dbml. It is also an XML, describing how the O/R designer should visualize the objects models:

```xml
<?xml version="1.0" encoding="utf-8"?>
<ordesignerObjectsDiagram dslVersion="1.0.0.0" absoluteBounds="0, 0, 11, 8.5" name="Northwind">
    <DataContextMoniker Name="/NorthwindDataContext" />
    <nestedChildShapes>
        <!-- Category class -->
        <classShape Id="81d67a31-cd80-4a91-84fa-5d4dfa2e8694" absoluteBounds="0.75, 1.5, 2, 1.5785953776041666">
            <DataClassMoniker Name="/NorthwindDataContext/Category" />
            <nestedChildShapes>
                <!-- Properties -->
                <elementListCompartment Id="a261c751-8ff7-471e-9545-cb385708d390" absoluteBounds="0.765, 1.96, 1.9700000000000002, 1.0185953776041665" name="DataPropertiesCompartment" titleTextColor="Black" itemTextColor="Black" />
            </nestedChildShapes>
        </classShape>
        
        <!-- Product class -->
        <classShape Id="59f11c67-f9d4-4da9-ad0d-2288402ec016" absoluteBounds="3.5, 1, 2, 2.7324039713541666">
            <DataClassMoniker Name="/NorthwindDataContext/Product" />
            <nestedChildShapes>
                <!-- Properties -->
                <elementListCompartment Id="6c1141a2-f9a9-4660-8730-bed7fa15bc27" absoluteBounds="3.515, 1.46, 1.9700000000000002, 2.1724039713541665" name="DataPropertiesCompartment" titleTextColor="Black" itemTextColor="Black" />
            </nestedChildShapes>
        </classShape>
        
        <!-- Association arrow -->
        <associationConnector edgePoints="[(2.75 : 2.28929768880208); (3.5 : 2.28929768880208)]" fixedFrom="Algorithm" fixedTo="Algorithm">
            <AssociationMoniker Name="/NorthwindDataContext/Category/Category_Product" />
            <nodes>
                <!-- From Category class -->
                <classShapeMoniker Id="81d67a31-cd80-4a91-84fa-5d4dfa2e8694" />
                <!-- To Product class -->
                <classShapeMoniker Id="59f11c67-f9d4-4da9-ad0d-2288402ec016" />
            </nodes>
        </associationConnector>
    </nestedChildShapes>
</ordesignerObjectsDiagram>
```

A Northwind.designer.cs is also created, containing the auto generated C# code.

This is how the NorthwindDataContext looks like:

```csharp
[Database(Name = "Northwind")]
public partial class NorthwindDataContext : DataContext
{
    public Table<Category> Categories
    {
        get
        {
            return this.GetTable<Category>();
        }
    }

    public Table<Product> Products
    {
        get
        {
            return this.GetTable<Product>();
        }
    }
}
```

And this is the Category class:[](http://11011.net/software/vspaste)

```csharp
[Table(Name = "dbo.Categories")]
public partial class Category : INotifyPropertyChanging, INotifyPropertyChanged
{
    private int _CategoryID;

    private EntitySet<Product> _Products;

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

    // Other properties.

    [Association(Name = "Category_Product", Storage = "_Products", 
        ThisKey = "CategoryID", OtherKey = "CategoryID")]
    public EntitySet<Product> Products
    {
        get
        {
            return this._Products;
        }
        set
        {
            this._Products.Assign(value);
        }
    }
}
```

The Products looks similar.

## Customize the mapping

Since the mapping info are simply stored in the XML file and C# code, they can be customized in the O/R designer easily:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_02E12BE1.png "image")

After renaming Category class to CategoryEntity, the XML and C# is refined automatically:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Database Name="Northwind" Class="NorthwindDataContext" xmlns="http://schemas.microsoft.com/linqtosql/dbml/2007">
    <Table Name="dbo.Categories" Member="CategoryEntities">
        <Type Name="CategoryEntity">
            <!-- Fields -->
        </Type>
    </Table>
    <Table Name="dbo.Products" Member="Products">
        <Type Name="Product">
            <!-- Fields -->
            <Association Name="Category_Product" Member="CategoryEntity" Storage="_Category" ThisKey="CategoryID" OtherKey="CategoryID" Type="CategoryEntity" IsForeignKey="true" />
        </Type>
    </Table>
</Database>
```

and[](http://11011.net/software/vspaste)

```csharp
[Database(Name = "Northwind")]
public partial class NorthwindDataContext : DataContext
{
    public Table<CategoryEntity> CategoryEntities { get; }
}

[Table(Name = "dbo.Categories")]
public partial class CategoryEntity : INotifyPropertyChanging, INotifyPropertyChanged
{
}

[Table(Name = "dbo.Products")]
public partial class Product : INotifyPropertyChanging, INotifyPropertyChanged
{
    [Association(Name = "Category_Product", Storage = "_Category",
        ThisKey = "CategoryID", OtherKey = "CategoryID", IsForeignKey = true)]
    public CategoryEntity CategoryEntity { get; set; }
}
```

Properties, associations, and inheritances and also be customized:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_59F616D7.png "image")

For example, The ProductID property can be renamed to ProductId to [be compliant to .NET Framework Design Guidelines](/posts/csharp-coding-guidelines-2-naming).

More options are available to customize the data context, entities, and properties:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_504DA8A1.png "image")

Please notice this mapping is one way mapping, from SQL Server to C#. When the mapping information is changed in O/R designer, SQL Server is not affected at all.

And, LINQ to SQL is designed to provide a simple O/R mapping, not supporting advenced functionalities, like [multi-table inheritance](http://connect.microsoft.com/VisualStudio/feedback/details/299807/single-table-inheritance-in-the-linq-to-sql-is-a-poor-option), etc. [According to MSDN](http://msdn.microsoft.com/en-us/library/bb386919.aspx):

> The single-table mapping strategy is the simplest representation of inheritance and provides good performance characteristics for many different categories of queries.

Please check [this link](http://msdn.microsoft.com/en-us/library/bb399352.aspx) for more details.

## Work with the models

The auto generated models are very easy and extensible.

### Partial class

All the generated C# classes are partial classes. For example, it is very easy to add a NorthwindDataContext,cs file and a Category.cs file to the project, and write the extension code.

### Partial method

There are also a lot of partial method in the generated code:

```csharp
[Database(Name = "Northwind")]
public partial class NorthwindDataContext : DataContext
{
    #region Extensibility Method Definitions

    partial void OnCreated();
    partial void InsertCategory(Category instance);
    partial void UpdateCategory(Category instance);
    partial void DeleteCategory(Category instance);
    partial void InsertProduct(Product instance);
    partial void UpdateProduct(Product instance);
    partial void DeleteProduct(Product instance);

    #endregion
}
```

For example, the OnCreated() can be implemented in the NorthwindDataContext,cs:

```csharp
public partial class NorthwindDataContext
{
    // OnCreated will be invoked by constructors.
    partial void OnCreated()
    {
        // The default value is 30 seconds.
        this.CommandTimeout = 40;
    }
}
```

When the Northwind is constructed, the OnCreated() is invoked, and the custom code is executed.

So are the entities:

```csharp
[Table(Name = "dbo.Categories")]
public partial class Category : INotifyPropertyChanging, INotifyPropertyChanged
{
    #region Extensibility Method Definitions

    partial void OnLoaded();
    partial void OnValidate(ChangeAction action);
    partial void OnCreated();
    partial void OnCategoryIDChanging(int value);
    partial void OnCategoryIDChanged();
    partial void OnCategoryNameChanging(string value);
    partial void OnCategoryNameChanged();
    partial void OnDescriptionChanging(string value);
    partial void OnDescriptionChanged();
    partial void OnPictureChanging(Binary value);
    partial void OnPictureChanged();

    #endregion
}
```

For example, the OnValidated() is very useful for the data correction:

```csharp
[Table(Name = "dbo.Categories")]
public partial class Category
{
    partial void OnValidate(ChangeAction action)
    {
        switch (action)
        {
            case ChangeAction.Delete:
                // Validates the object when deleted.
                break;
            case ChangeAction.Insert:
                // Validates the object when inserted.
                break;
            case ChangeAction.None:
                // Validates the object when not submitted.
                break;
            case ChangeAction.Update:
                // Validates the object when updated.
                if (string.IsNullOrWhiteSpace(this._CategoryName))
                {
                    throw new ValidationException("CategoryName is invalid.");
                }
                break;
            default:
                break;
        }
    }
}
```

When the category object (representing a record in Categories table) is updated, the custom code checking the CategoryName will be executed.

And, because each entity class’s Xxx property’s setter involves OnXxxChanging() partial method:

```csharp
[Table(Name = "dbo.Categories")]
public partial class CategoryEntity : INotifyPropertyChanging, INotifyPropertyChanged
{
    [Column(Storage = "_CategoryName", DbType = "NVarChar(15) NOT NULL", CanBeNull = false)]
    public string CategoryName
    {
        get
        {
            return this._CategoryName;
        }
        set
        {
            if ((this._CategoryName != value))
            {
                this.OnCategoryNameChanging(value);
                this.SendPropertyChanging();
                this._CategoryName = value;
                this.SendPropertyChanged("CategoryName");
                this.OnCategoryNameChanged();
            }
        }
    }
}
```

Validation can be also done in this way:

```csharp
public partial class CategoryEntity
{
    partial void OnCategoryNameChanging(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentOutOfRangeException("value");
        }
    }
}
```

### INotifyPropertyChanging and INotifyPropertyChanged interfaces

Each auto generated entity class implements INotifyPropertyChanging and INotifyPropertyChanged interfaces:

```csharp
namespace System.ComponentModel
{
    public interface INotifyPropertyChanging
    {
        event PropertyChangingEventHandler PropertyChanging;
    }

    public interface INotifyPropertyChanged
    {
        event PropertyChangedEventHandler PropertyChanged;
    }
}
```

For example, in the above auto generated CategoryName code, after setting the CategoryName, SendPropertyChanged() is invoked, passing the propery name “CategoryName” as argument:

```csharp
[Table(Name = "dbo.Categories")]
public partial class CategoryEntity : INotifyPropertyChanging, INotifyPropertyChanged
{
    public event PropertyChangedEventHandler PropertyChanged;

    protected virtual void SendPropertyChanged(String propertyName)
    {
        if (this.PropertyChanged != null)
        {
            this.PropertyChanged(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
```

This is very useful to track changes of the entity object:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Category category = database.Categories.Single(item => item.CategoryName = "Beverages");
    category.PropertyChanged += (_, e) =>
        {
            Console.Write("Propery {0} is changed", e.PropertyName);
        };

    // Work with the category object.
    category.CategoryID = 100;
    // ...
}
```

And this is used for change tracking by DataContext, which will be explained later.

## Programmatically access the mapping information

The mapping information is stored in DataContext.Mapping as a MetaModel object. Here is an example:

```csharp
public static class DataContextExtensions
{
    public static Type GetEntityType(this DataContext database, string tableName)
    {
        return database.Mapping.GetTables()
                               .Single(table => table.TableName.Equals(
                                   tableName, StringComparison.Ordinal))
                               .RowType
                               .Type;
    }
}
```

The method queries the mapping information with the table name, and returns the entity type:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    Type categoryType = database.GetEntityType("dbo.Categories");
}
```

## Create SQL schema from C# models

Usually, many people design the SQL database first, then model it with the O/R designer, and write code to work with the C# object models. But this is not required. It is totally Ok to create [POCO](http://en.wikipedia.org/wiki/Plain_Old_CLR_Object) models first without considering the SQL stuff:

```csharp
public partial class Category
{
    public int CategoryID { get; set; }

    public string CategoryName { get; set; }

    public EntitySet<Product> Products { get; set; }
}
```

Now it is already able to start coding with this kind of models.

Later, there are 2 ways to integrate the C# program with SQL Server database:

-   Generate object models from designed SQL Server database;
-   Decorate POCO models with mapping attributes, Invoke CreateDatabase() method of DataContext to create the expected database schema in SQL Server.

For example, the C# models can be polluted with O/R mapping knowledge like this:

```csharp
[Table(Name = "Categories")]
public class Category
{
    [Column(DbType = "Int NOT NULL IDENTITY", IsPrimaryKey = true)]
    public int CategoryId { get; set; }

    [Column(DbType = "NVarChar(15) NOT NULL")]
    public string CategoryName { get; set; }

    [Association(Name = "Category_Products",
        ThisKey = "CategoryId", OtherKey = "CategoryId")]
    public EntitySet<Product> Products { get; set; }
}

[Table(Name = "Products")]
public class Product
{
    [Column(DbType = "Int NOT NULL IDENTITY", IsPrimaryKey = true)]
    public int ProductId { get; set; }

    [Column(DbType = "NVarChar(40) NOT NULL")]
    public string ProductName { get; set; }

    [Column(DbType = "Int")]
    public int CategoryId { get; set; }

    [Association(Name = "Category_Products", IsForeignKey = true,
        ThisKey = "CategoryId", OtherKey = "CategoryId")]
    public Category Category { get; set; }
}

[Database(Name = "SimpleNorthwind")]
public class SimpleNorthwindDataContext : DataContext
{
    public SimpleNorthwindDataContext(IDbConnection connection)
        : base(connection)
    {
    }

    public Table<Category> Categories { get; set; }

    public Table<Product> Products { get; set; }
}
```

Now it is ready to create database schema in SQL server:

```csharp
using (SimpleNorthwindDataContext database = new SimpleNorthwindDataContext(new SqlConnection(
    @"Data Source=localhost;Initial Catalog=SimpleNorthwind;Integrated Security=True")))
{
    if (database.DatabaseExists())
    {
        database.DeleteDatabase();
    }

    database.CreateDatabase();
}
```

Isn’t this easy? This is the generated SimpleNorthwind database in SQL Server:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_6265F3DC.png "image")