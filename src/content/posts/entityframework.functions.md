---
title: "EntityFramework.Functions: Code First Functions for Entity Framework"
published: 2024-01-19
description: "EntityFramework.Functions library implements  code first support for:"
image: ""
tags: ["Code First", "Entity Framework", "LINQ", "LINQ to Entities", "SQL Functions", "SQL Server", "SQL Stored Procedure"]
category: "Code First"
draft: false
lang: ""
---

EntityFramework.Functions library implements [Entity Framework](https://en.wikipedia.org/wiki/Entity_Framework) code first support for:

-   Stored procedures, with:
    -   single result type
    -   multiple result types
    -   output parameter
-   Table-valued functions, returning

-   entity type
-   complex type

-   Scalar-valued functions
    -   composable
    -   non-composable
-   Aggregate functions
-   Built-in functions
-   Niladic functions
-   Model defined functions

EntityFramework.Functions library works on .NET Standard with Entity Framework 6.4.0. It also works on .NET 4.0, .NET 4.5, .NET 4.6, .NET 4.7, .NET 4.8 with [Entity Framework 6.1.0 and later](https://msdn.microsoft.com/en-us/data/jj574253.aspx). Entity Framework is the only dependency of this library.

It can be installed through [Nuget](https://www.nuget.org/packages/EntityFramework.Functions):

```csharp
dotnet add package EntityFramework.Functions
```

or:

```csharp
Install-Package EntityFramework.Functions -DependencyVersion Highest
```

See:

-   Document: [https://weblogs.asp.net/Dixin/EntityFramework.Functions](https://weblogs.asp.net/Dixin/EntityFramework.Functions "https://weblogs.asp.net/Dixin/EntityFramework.Functions")

-   [Source code](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Source_code)
-   [APIs](https://weblogs.asp.net/Dixin/EntityFramework.Functions#APIs)

-   [\[Function\]](https://weblogs.asp.net/Dixin/EntityFramework.Functions#[Function])
-   [\[Parameter\]](https://weblogs.asp.net/Dixin/EntityFramework.Functions#[Parameter])
-   [\[ResultType\]](https://weblogs.asp.net/Dixin/EntityFramework.Functions#[ResultType])
-   [FunctionConvention and FunctionConvention<TFunctions>](https://weblogs.asp.net/Dixin/EntityFramework.Functions#FunctionConvention_and_FunctionConvention<TFunctions>)

-   [Examples](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Examples)
    -   [Add functions to entity model](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Add_functions_to_entity_model)
    -   [Stored procedure, with single result type](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Stored procedure,_with_single_result_type)
    -   [Stored procedure, with output parameter](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Stored_procedure,_with_output_parameter)
    -   [Stored procedure, with multiple result types](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Stored_procedure,_with_multiple_result_types)
    -   [Table-valued function](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Table-valued_function)
    -   [Scalar-valued function, non-composable](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Scalar-valued_function,_non-composable)
    -   [Scalar-valued function, composable](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Scalar-valued_function,_composable)
    -   [Aggregate function](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Aggregate_function)
    -   [Built-in function](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Built-in_function)
    -   [Niladic function](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Niladic_function)
    -   [Model defined function](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Model_defined_function)
-   [Version history](https://weblogs.asp.net/Dixin/EntityFramework.Functions#Version_history)

-   Source code: [https://github.com/Dixin/EntityFramework.Functions](https://github.com/Dixin/EntityFramework.Functions "https://github.com/Dixin/EntityFramework.Functions")
-   Nuget package: [https://www.nuget.org/packages/EntityFramework.Functions](https://www.nuget.org/packages/EntityFramework.Functions "https://www.nuget.org/packages/EntityFramework.Functions")

## Source code

The source can be opened and built in Visual Studio 2015.

[Nuget package project](https://visualstudiogallery.msdn.microsoft.com/fbe9b9b8-34ae-47b5-a751-cb71a16f7e96) is used to build the [nuget package](https://www.nuget.org/packages/EntityFramework.Functions) from a [.nuproj](http://nuproj.net/). It is already included in the source.

To view [the sample database](https://github.com/Dixin/EntityFramework.Functions/tree/master/Data), or run the unit test against the sample database, please install [SQL Server 2014 LocalDB](https://www.microsoft.com/en-us/download/details.aspx?id=42299) or [SQL Server 2016 LocalDB](https://www.microsoft.com/en-us/download/details.aspx?id=52679).

## APIs

EntityFramework.Functions library provides a few simple APIs, following the pattern of Entity Framework and LINQ to SQL.

### \[Function\]

\[Function(FunctionType type, string name)\] attribute derives from [DbFunctionAttribute](https://msdn.microsoft.com/en-us/library/system.data.entity.dbfunctionattribute.aspx) provided in Entity Framework. It is also similar to [FunctionAttribute](https://msdn.microsoft.com/en-us/library/system.data.linq.mapping.functionattribute.aspx) in [LINQ to SQL](https://msdn.microsoft.com/en-us/library/bb386976.aspx). When a method is tagged with \[Function\], it maps to a database function or stored procedure. The FunctionType parameter is an enumeration, with the following members:

-   StoredProcedure
-   TableValuedFunction
-   ComposableScalarValuedFunction
-   NonComposableScalarValuedFunction
-   AggregateFunction
-   BuiltInFunction,
-   NiladicFunction,
-   ModelDefinedFunction

Examples for each function type can be found below.

The other name parameter specifies the database function/stored procedure that is mapped to. Even when C# method name is exactly the same as the mapped database function/stored procedure, this name string still has to be provided. This is required by Entity Framework.

\[Function\] has 2 settable properties:

-   Schema: It specifies the schema of the mapped database function/stored procedure, e.g. “dbo”.
-   ParameterTypeSemantics: It is of [ParameterTypeSemantics](https://msdn.microsoft.com/en-us/library/system.data.metadata.edm.parametertypesemantics.aspx) type provided in Entity Framework. It defines the type semantics used to resolve function overloads. ParameterTypeSemantics is an enumeration of 3 members:

-   AllowImplicitConversion (the default)
-   AllowImplicitPromotion
-   ExactMatchOnly

Besides general \[Function\] attribute, a specific attribute is also provided for each function type:

-   \[StoredProcedure\]
-   \[TableValuedFunction\]
-   \[ComposableScalarValuedFunction\]
-   \[NonComposableScalarValuedFunction\]
-   \[AggregateFunction\]
-   \[BuiltInFunction\]
-   \[NiladicFunction\]
-   \[ModelDefinedFunction\]

### \[Parameter\]

\[Parameter\] tags the function parameter to specify the mapped database function/stored procedure’s parameter name and type. It is similar to [ParameterAttribute](https://msdn.microsoft.com/en-us/library/system.data.linq.mapping.parameterattribute.aspx) in LINQ to SQL.

\[Parameter\] has 3 settable properties:

-   Name: the name of the mapped parameter in database.
-   DbType: the tyoe of the mapped parameter in database, like “money”
-   ClrType: the type of the mapping .NET parameter.

-   In Entity Framework, when a parameter is a output parameter, it has to be of ObjectParameter type. In this case, the mapping CLR type cannot be predicted and has to be provided by \[Parameter\]’s ClrType property.
-   In other cases, ClrType property can be omitted. At runtime, If ClrType conflicts with CLR parameter’s actual declaration CLR type, an exception will be thrown.

\[Parameter\] can be omitted. when:

-   the parameter is not an output parameter
-   and its name is the same as the mapped database parameter

\[Parameter\] can also be used to tag the return value of method, to specify the DbType of the mapped database function return value, which is also the same as LINQ to SQL. Please see examples below.

### \[ResultType\]

\[ResultType(Type type)\] is exactly the same as [ResultTypeAttribute](https://msdn.microsoft.com/en-us/library/system.data.linq.mapping.resulttypeattribute.aspx) in LINQ to SQL. Its constructor accepts a Type parameter to specify the return type of stored procedure. Typically, when the stored procedure has multiple result types, the mapping method can be tagged with multiple \[ResultType\]s.

\[ResultType\] cannot be used for functions.

### FunctionConvention and FunctionConvention<TFunctions>

FunctionConvention and FunctionConvention<TFunctions> implements Entity Framework’s [IStoreModelConvention](https://msdn.microsoft.com/en-us/library/dn338062.aspx)<[EntityContainer](https://msdn.microsoft.com/en-us/library/system.data.metadata.edm.entitycontainer.aspx)\> contract. They must be added to specify in what Type the mapping methods are located.

When the functions are added to entity model, the entity types and complex types used by functions should be added to entity model too. Entity Framework does not take care of types tagged with \[[ComplexType](https://msdn.microsoft.com/en-us/library/system.componentmodel.dataannotations.schema.complextypeattribute.aspx)\], so this library provides a AddComplexTypesFromAssembly extension method for this.

For convenience, 2 extension methods AddFunctions/AddFunction<TFunctions> are provided. When they are called:

-   FunctionConvention/FunctionConvention<TFunctions> is added to entity model.
-   AddComplexTypesFromAssembly is automatically called. In the assembly of TFunction, types tagged with \[ComplextType\] are added to entity model.

## Examples

The following examples uses Microsoft’s [AdventureWorks sample database](https://msftdbprodsamples.codeplex.com/) for SQL Server 2014. The database can also be found in this library’s [source repository](https://github.com/Dixin/EntityFramework.Functions/tree/master/Data) on [GitHub](https://github.com/Dixin/EntityFramework.Functions).

### Add functions to entity model

Before calling any code first function, FunctionConvention or FunctionConvention<TFunctions> must be added to DbModelBuilder of the DbContext, so are the complex types used by functions:

```csharp
public partial class AdventureWorks : DbContext
{
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Add functions on AdventureWorks to entity model.
        modelBuilder.Conventions.Add(new FunctionConvention<AdventureWorks>());

        // Add all complex types used by functions.
        modelBuilder.ComplexType<ContactInformation>();
        modelBuilder.ComplexType<ManagerEmployee>();
        // ...
    }
}
```

Here new FunctionConvention<T>() is equivalent to new FunctionConvention(typeof(T)). The non-generic version is provided because in C# static class cannot be used as type argument:

```csharp
public partial class AdventureWorks : DbContext
{
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Add functions on AdventureWorks and StaticClass to entity model.
        modelBuilder.Conventions.Add(new FunctionConvention<AdventureWorks>());
        modelBuilder.Conventions.Add(new FunctionConvention(typeof(StaticClass)));

        // Add all complex types in the assembly of AdventureWorks.
        modelBuilder.AddComplexTypesFromAssembly(typeof(AdventureWorks).Assembly);
    }
}
```

Also, AddFunctions/AddFunction<TFunctions> extension methods are provided as a shortcut, which automatically add all complex types in the assembly of TFunctions.

```csharp
public partial class AdventureWorks : DbContext
{
    protected override void OnModelCreating(DbModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Add functions and complex types to model.
        modelBuilder.AddFunctions<AdventureWorks>();
        modelBuilder.AddFunctions(typeof(AdventureWorksFunctions));
        modelBuilder.AddFunctions(typeof(BuiltInFunctions));
        modelBuilder.AddFunctions(typeof(NiladicFunctions));
    }
}
```

### Stored procedure, with single result type

The AdventureWorks database has a sample stored procedure uspGetManagerEmployees. Its return type can be viewed with [dm\_exec\_describe\_first\_result\_set](https://msdn.microsoft.com/en-us/library/ff878258.aspx):

```sql
SELECT *
FROM sys.dm_exec_describe_first_result_set(N'dbo.uspGetManagerEmployees', NULL, 0);
```

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framewotk_FE46/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Entity-Framewotk_FE46/image_5.png)

An entity type or a complex type can be defined to represent above return type:

```csharp
[ComplexType]
public class ManagerEmployee
{
    public int? RecursionLevel { get; set; }

    public string OrganizationNode { get; set; }

    public string ManagerFirstName { get; set; }

    public string ManagerLastName { get; set; }

    public int? BusinessEntityID { get; set; }

    public string FirstName { get; set; }

    public string LastName { get; set; }
}
```

It is tagged with \[[ComplexType](https://msdn.microsoft.com/en-us/library/system.componentmodel.dataannotations.schema.complextypeattribute.aspx)\], which is provided in System.ComponentModel.DataAnnotations.dll, and used by Entity Framework. When calling AddFunctions(typeof(TFunctions))/AddFunction<TFunctions>(), types tagged with \[ComplexType\] in the same assembly are added to entity model too.

Now the mapping method can be defined:

```csharp
public partial class AdventureWorks
{
    public const string dbo = nameof(dbo);

    // Defines stored procedure returning a single result type: 
    // - a ManagerEmployee sequence.
    [Function(FunctionType.StoredProcedure, nameof(uspGetManagerEmployees), Schema = dbo)]
    public ObjectResult<ManagerEmployee> uspGetManagerEmployees(int? BusinessEntityID)
    {
        ObjectParameter businessEntityIdParameter = BusinessEntityID.HasValue
            ? new ObjectParameter(nameof(BusinessEntityID), BusinessEntityID)
            : new ObjectParameter(nameof(BusinessEntityID), typeof(int));

        return this.ObjectContext().ExecuteFunction<ManagerEmployee>(
            nameof(this.uspGetManagerEmployees), businessEntityIdParameter);
    }
}
```

In its body, it should call ExecuteFunction on ObjectContext. Here ObjectContext method is an extension method provided by this library.

Then it can be called as following:

```csharp
[TestMethod]
public void CallStoredProcedureWithSingleResult()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        ObjectResult<ManagerEmployee> employees = database.uspGetManagerEmployees(2);
        Assert.IsTrue(employees.Any());
    }
}
```

The above call is translated to the following SQL, which can be viewed with SQL Server Profiler:

```csharp
exec [dbo].[uspGetManagerEmployees] @BusinessEntityID=2
```

### Stored procedure, with output parameter

As fore mentioned, stored procedure’s output parameter is represented by ObjectParameter and must be tagged with \[Parameter\], with ClrType provided:

```csharp
private const string uspLogError = nameof(uspLogError);

// Defines stored procedure accepting an output parameter.
// Output parameter must be ObjectParameter, with ParameterAttribute.ClrType provided.
[Function(FunctionType.StoredProcedure, uspLogError, Schema = dbo)]
public int LogError([Parameter(DbType = "int", ClrType = typeof(int))]ObjectParameter ErrorLogID) =>
    this.ObjectContext().ExecuteFunction(uspLogError, ErrorLogID);
```

Then it can be called as:

```csharp
[TestMethod]
public void CallStoreProcedureWithOutParameter()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        ObjectParameter errorLogId = new ObjectParameter("ErrorLogID", typeof(int)) { Value = 5 };
        int? rows = database.LogError(errorLogId);
        Assert.AreEqual(0, errorLogId.Value);
        Assert.AreEqual(typeof(int), errorLogId.ParameterType);
        Assert.AreEqual(-1, rows);
    }
}
```

The call is translated to:

```csharp
declare @p1 int
set @p1=0
exec [dbo].[uspLogError] @ErrorLogID=@p1 output
select @p1
```

### Stored procedure, with multiple result types

The following stored procedure returns 2 different types of results: a sequence of ProductCategory row(s), and a sequence of ProductSubcategory row(s).

```sql
CREATE PROCEDURE [dbo].[uspGetCategoryAndSubCategory]
    @CategoryID int
AS
BEGIN
    SELECT [Category].[ProductCategoryID], [Category].[Name]
        FROM [Production].[ProductCategory] AS [Category] 
        WHERE [Category].[ProductCategoryID] = @CategoryID;

    SELECT [Subcategory].[ProductSubcategoryID], [Subcategory].[Name], [Subcategory].[ProductCategoryID]
        FROM [Production].[ProductSubcategory] As [Subcategory]
        WHERE [Subcategory].[ProductCategoryID] = @CategoryID;
END
GO
```

The involved ProductCategory table and ProductSubcategory table can be represented as:

```csharp
public partial class AdventureWorks
{
    public const string Production = nameof(Production);

    public DbSet<ProductCategory> ProductCategories { get; set; }

    public DbSet<ProductSubcategory> ProductSubcategories { get; set; }
}

[Table(nameof(ProductCategory), Schema = AdventureWorks.Production)]
public partial class ProductCategory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductCategoryID { get; set; }

    [MaxLength(50)]
    public string Name { get; set; }
}

[Table(nameof(ProductSubcategory), Schema = AdventureWorks.Production)]
public partial class ProductSubcategory
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ProductSubcategoryID { get; set; }

    [MaxLength(50)]
    public string Name { get; set; }
}
```

Above ProductCategory and ProductSubcategory classes are tagged with \[Table\], so they will be added to entity model automatically by Entity Framework.

Multiple return types can be specified by \[ReturnType\]. The return type defined on the method will be merged into the return types from \[ReturnType\]s, and be at the first position:

```csharp
// Defines stored procedure returning multiple result types: 
// - a ProductCategory sequence.
// - a ProductSubcategory sequence.
[Function(FunctionType.StoredProcedure, nameof(uspGetCategoryAndSubCategory), Schema = dbo)]
[ResultType(typeof(ProductCategory))]
[ResultType(typeof(ProductSubcategory))]
public ObjectResult<ProductCategory> uspGetCategoryAndSubCategory(int CategoryID)
{
    ObjectParameter categoryIdParameter = new ObjectParameter(nameof(CategoryID), CategoryID);
    return this.ObjectContext().ExecuteFunction<ProductCategory>(
        nameof(this.uspGetCategoryAndSubCategory), categoryIdParameter);
}
```

Then it can be called to retrieve one ProductCategory sequence, and one ProductSubcategory sequence:

```csharp
[TestMethod]
public void CallStoreProcedureWithMultipleResults()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        // The first type of result type: a sequence of ProductCategory objects.
        ObjectResult<ProductCategory> categories = database.uspGetCategoryAndSubCategory(1);
        Assert.IsNotNull(categories.Single());
        // The second type of result type: a sequence of ProductCategory objects.
        ObjectResult<ProductSubcategory> subcategories = categories.GetNextResult<ProductSubcategory>();
        Assert.IsTrue(subcategories.Any());
    }
}
```

The SQL translation is normal:

```csharp
exec [dbo].[uspGetCategoryAndSubCategory] @CategoryID=1
```

### Table-valued function

The AdventureWorks sample database has a table-valued function, dbo.ufnGetContactInformation, its return type can be also represented as another complex type:

```csharp
[ComplexType]
public class ContactInformation
{
    public int PersonID { get; set; }

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string JobTitle { get; set; }

    public string BusinessEntityType { get; set; }
}
```

Then the ufnGetContactInformation function can be mapped by:

```csharp
// Defines table-valued function, which must return IQueryable<T>.
[Function(FunctionType.TableValuedFunction, nameof(ufnGetContactInformation), Schema = dbo)]
public IQueryable<ContactInformation> ufnGetContactInformation(
    [Parameter(DbType = "int", Name = "PersonID")]int? personId)
{
    ObjectParameter personIdParameter = personId.HasValue
        ? new ObjectParameter("PersonID", personId)
        : new ObjectParameter("PersonID", typeof(int));

    return this.ObjectContext().CreateQuery<ContactInformation>(
        $"[{nameof(this.ufnGetContactInformation)}](@{nameof(personId)})", personIdParameter);
}
```

Its return type should be IQueryable<T>, so that it is composable in LINQ to Entities. And it can be called:

```csharp
[TestMethod]
public void CallTableValuedFunction()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        IQueryable<ContactInformation> employees = database.ufnGetContactInformation(1).Take(2);
        Assert.IsNotNull(employees.Single());
    }
}
```

The above ufnGetContactInformation call and Take call will be translated to one single SQL query:

```sql
exec sp_executesql N'SELECT TOP (2) 
    [top].[C1] AS [C1], 
    [top].[PersonID] AS [PersonID], 
    [top].[FirstName] AS [FirstName], 
    [top].[LastName] AS [LastName], 
    [top].[JobTitle] AS [JobTitle], 
    [top].[BusinessEntityType] AS [BusinessEntityType]
    FROM ( SELECT TOP (2) 
        [Extent1].[PersonID] AS [PersonID], 
        [Extent1].[FirstName] AS [FirstName], 
        [Extent1].[LastName] AS [LastName], 
        [Extent1].[JobTitle] AS [JobTitle], 
        [Extent1].[BusinessEntityType] AS [BusinessEntityType], 
        1 AS [C1]
        FROM [dbo].[ufnGetContactInformation](@PersonID) AS [Extent1]
    )  AS [top]',N'@PersonID int',@PersonID=1
```

### Scalar-valued function, non-composable

For scalar-valued function. the return value becomes a primitive non-collection type.

```csharp
// Defines scalar-valued function (non-composable), 
// which cannot be used in LINQ to Entities queries;
// and can be called directly.
[Function(FunctionType.NonComposableScalarValuedFunction, nameof(ufnGetProductStandardCost), Schema = dbo)]
[return: Parameter(DbType = "money")]
public decimal? ufnGetProductStandardCost(
    [Parameter(DbType = "int")]int ProductID,
    [Parameter(DbType = "datetime")]DateTime OrderDate)
{
    ObjectParameter productIdParameter = new ObjectParameter(nameof(ProductID), ProductID);
    ObjectParameter orderDateParameter = new ObjectParameter(nameof(OrderDate), OrderDate);
    return this.ObjectContext().ExecuteFunction<decimal?>(
        nameof(this.ufnGetProductStandardCost), productIdParameter, orderDateParameter).SingleOrDefault();
}
```

In this case, \[Parameter\] can tag its return type.

It can be called directly just like other above methods:

```csharp
[TestMethod]
public void CallNonComposableScalarValuedFunction()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        decimal? cost = database.ufnGetProductStandardCost(999, DateTime.Now);
        Assert.IsNotNull(cost);
        Assert.IsTrue(cost > 1);
    }
}
```

And the translated SQL is:

```sql
exec sp_executesql N'SELECT [dbo].[ufnGetProductStandardCost](@ProductID, @OrderDate)',N'@ProductID int,@OrderDate datetime2(7)',@ProductID=999,@OrderDate='2015-12-28 02:22:53.0353800'
```

However, since it is specified to be non-composable, it cannot be translated by Entity Framework in LINQ to Entities queries:

```csharp
[TestMethod]
public void NonComposableScalarValuedFunctionInLinq()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        try
        {
            database
                .Products
                .Where(product => product.ListPrice >= database.ufnGetProductStandardCost(999, DateTime.Now))
                .ToArray();
            Assert.Fail();
        }
        catch (NotSupportedException)
        {
        }
    }
}
```

This is by design of Entity Framework.

### Scalar-valued function, composable

The composable scalar-valued function is very similar:

```csharp
// Defines scalar-valued function (composable),
// which can only be used in LINQ to Entities queries, where its body will never be executed;
// and cannot be called directly.
[Function(FunctionType.ComposableScalarValuedFunction, nameof(ufnGetProductListPrice), Schema = dbo)]
[return: Parameter(DbType = "money")]
public decimal? ufnGetProductListPrice(
    [Parameter(DbType = "int")] int ProductID,
    [Parameter(DbType = "datetime")] DateTime OrderDate) => 
        Function.CallNotSupported<decimal?>();
```

The difference is, it works in LINQ to Entities queries, but cannot be called directly. As a result, its body will never be executed. So in the body, it can just throw an exception. This library provides a Function.,CallNotSupported help methods for convenience, which just throws a NotSupportedException.

```csharp
[TestMethod]
public void ComposableScalarValuedFunctionInLinq()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        IQueryable<Product> products = database
            .Products
            .Where(product => product.ListPrice <= database.ufnGetProductListPrice(999, DateTime.Now));
        Assert.IsTrue(products.Any());
    }
}

[TestMethod]
public void CallComposableScalarValuedFunction()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        try
        {
            database.ufnGetProductListPrice(999, DateTime.Now);
            Assert.Fail();
        }
        catch (NotSupportedException)
        {
        }
    }
}
```

The above LINQ query, containing composable scalar-valued function, is translated to:

```sql
SELECT 
    CASE WHEN ( EXISTS (SELECT 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent1]
        WHERE [Extent1].[ListPrice] <= ([dbo].[ufnGetProductListPrice](999, SysDateTime()))
    )) THEN cast(1 as bit) WHEN ( NOT EXISTS (SELECT 
        1 AS [C1]
        FROM [Production].[Product] AS [Extent2]
        WHERE [Extent2].[ListPrice] <= ([dbo].[ufnGetProductListPrice](999, SysDateTime()))
    )) THEN cast(0 as bit) END AS [C1]
    FROM  ( SELECT 1 AS X ) AS [SingleRowTable1]
```

### Aggregate function

To demonstrate the mapping of user defined aggregate, the following aggregate function can be defined:

```csharp
[Serializable]
[SqlUserDefinedAggregate(
    Format.UserDefined,
    IsInvariantToNulls = true,
    IsInvariantToDuplicates = false,
    IsInvariantToOrder = false,
    MaxByteSize = 8000)]
public class Concat : IBinarySerialize
{
    private const string Separator = ", ";

    private StringBuilder concat;

    public void Init()
    {
    }

    public void Accumulate(SqlString sqlString) => this.concat = this.concat?
        .Append(Separator).Append(sqlString.IsNull ? null : sqlString.Value)
        ?? new StringBuilder(sqlString.IsNull ? null : sqlString.Value);

    public void Merge(Concat concat) => this.concat.Append(concat.concat);

    public SqlString Terminate() => new SqlString(this.concat?.ToString());

    public void Read(BinaryReader reader) => this.concat = new StringBuilder(reader.ReadString());

    public void Write(BinaryWriter writer) => writer.Write(this.concat?.ToString() ?? string.Empty);
}
```

Concat takes 1 parameter, just like COUNT(), SUM(), etc. The following ConcatWith aggregate function accepts 2 parameters, a value and a separator:

```csharp
[Serializable]
[SqlUserDefinedAggregate(
    Format.UserDefined,
    IsInvariantToNulls = true,
    IsInvariantToDuplicates = false,
    IsInvariantToOrder = false,
    MaxByteSize = 8000)]
public class ConcatWith : IBinarySerialize
{
    private StringBuilder concatWith;

    public void Init()
    {
    }

    public void Accumulate(SqlString sqlString, SqlString separator) => this.concatWith = this.concatWith?
        .Append(separator.IsNull ? null : separator.Value)
        .Append(sqlString.IsNull ? null : sqlString.Value)
        ?? new StringBuilder(sqlString.IsNull ? null : sqlString.Value);

    public void Merge(ConcatWith concatWith) => this.concatWith.Append(concatWith.concatWith);

    public SqlString Terminate() => new SqlString(this.concatWith?.ToString());

    public void Read(BinaryReader reader) => this.concatWith = new StringBuilder(reader.ReadString());

    public void Write(BinaryWriter writer) => writer.Write(this.concatWith?.ToString() ?? string.Empty);
}
```

Build these 2 classes into a .NET assembly, and add to database:

```sql
-- Create assembly.
CREATE ASSEMBLY [Dixin.Sql] 
FROM N'D:\OneDrive\Works\Drafts\CodeSnippets\Dixin.Sql\bin\Debug\Dixin.Sql.dll';
GO

-- Create aggregate from assembly.
CREATE AGGREGATE [Concat] (@value nvarchar(4000)) RETURNS nvarchar(max)
EXTERNAL NAME [Dixin.Sql].[Dixin.Sql.Concat];
GO

CREATE AGGREGATE [ConcatWith] (@value nvarchar(4000), @separator nvarchar(40)) RETURNS nvarchar(max)
EXTERNAL NAME [Dixin.Sql].[Dixin.Sql.ConcatWith];
GO
```

Now Concat and ConcatWith can be used in SQL:

```sql
SELECT [Subcategory].[ProductCategoryID], COUNT([Subcategory].[Name]), [dbo].[Concat]([Subcategory].[Name])
FROM [Production].[ProductSubcategory] AS [Subcategory]
GROUP BY [Subcategory].[ProductCategoryID];

SELECT [dbo].[Concat](Name) FROM Production.ProductCategory;

SELECT [Subcategory].[ProductCategoryID], COUNT([Subcategory].[Name]), [dbo].[ConcatWith]([Subcategory].[Name], N' | ')
FROM [Production].[ProductSubcategory] AS [Subcategory]
GROUP BY [Subcategory].[ProductCategoryID];

SELECT [dbo].[ConcatWith](Name, N' | ') FROM Production.ProductCategory;
```

To map them in C#, the following methods can be defined:

```csharp
public static class AdventureWorksFunctions
{
    // Defines aggregate function, which must have one singele IEnumerable<T> or IQueryable<T> parameter.
    // It can only be used in LINQ to Entities queries, where its body will never be executed;
    // and cannot be called directly.
    [Function(FunctionType.AggregateFunction, nameof(Concat), Schema = AdventureWorks.dbo)]
    public static string Concat(this IEnumerable<string> value) => Function.CallNotSupported<string>();

    // Aggregate function with more than more parameter is not supported by Entity Framework.
    // The following cannot to translated in LINQ queries.
    // [Function(FunctionType.AggregateFunction, nameof(ConcatWith), Schema = AdventureWorks.dbo)]
    // public static string ConcatWith(this IEnumerable<string> value, string separator) => 
    //    Function.CallNotSupported<string>();
}
```

Apparently, aggregate functions cannot be called directly, so their bodies just throw exception. Unfortunately, above ConcatWith cannot be translated, because currently Entity Framework does not support aggregate function with more than one parameters.

They are defined as extension methods of IEnumerable<T>, so that they can easily be used in LINQ to :

```csharp
[TestMethod]
public void AggregateFunctionInLinq()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        var categories = database.ProductSubcategories
            .GroupBy(subcategory => subcategory.ProductCategoryID)
            .Select(category => new
            {
                CategoryId = category.Key,
                SubcategoryNames = category.Select(subcategory => subcategory.Name).Concat()
            })
            .ToArray();
        Assert.IsTrue(categories.Length > 0);
        categories.ForEach(category =>
            {
                Assert.IsTrue(category.CategoryId > 0);
                Assert.IsFalse(string.IsNullOrWhiteSpace(category.SubcategoryNames));
            });
    }
}
```

Above query will be translated to SQL with Concat call:

```sql
SELECT 
    1 AS [C1], 
    [GroupBy1].[K1] AS [ProductCategoryID], 
    [GroupBy1].[A1] AS [C2]
    FROM ( SELECT 
        [Extent1].[ProductCategoryID] AS [K1], 
        [dbo].[Concat]([Extent1].[Name]) AS [A1]
        FROM [Production].[ProductSubcategory] AS [Extent1]
        GROUP BY [Extent1].[ProductCategoryID]
    )  AS [GroupBy1]
```

The reason is Entity Framework does not support aggregate function with more than one parameters.

### Built-in function

SQL Server provides a lot of [built-in functions](https://msdn.microsoft.com/en-US/library/ms174318.aspx). They can be easily represented with \[Function\] tag. Take [LEFT function](https://msdn.microsoft.com/en-us/library/ms177601.aspx) as example:

It is a [string function](https://msdn.microsoft.com/en-us/library/ms181984.aspx), returns the left part of a string with the specified number of characters. So, in C#, just defines a function accepting a string parameter and a int parameter, and returns a string:

```csharp
public static class BuiltInFunctions
{
    [Function(FunctionType.BuiltInFunction, "LEFT")]
    public static string Left(this string value, int count) => Function.CallNotSupported<string>();
}
```

Again, it can only be used in LINQ to Entities and cannot be called directly. So in its body, it just simply throw an exception. It is implemented as an extension method of string, for convenience.

```csharp
[TestMethod]
public void BuitInFunctionInLinq()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        var categories = database.ProductSubcategories
            .GroupBy(subcategory => subcategory.ProductCategoryID)
            .Select(category => new
            {
                CategoryId = category.Key,
                SubcategoryNames = category.Select(subcategory => subcategory.Name.Left(4)).Concat()
            })
            .ToArray();
        Assert.IsTrue(categories.Length > 0);
        categories.ForEach(category =>
        {
            Assert.IsTrue(category.CategoryId > 0);
            Assert.IsFalse(string.IsNullOrWhiteSpace(category.SubcategoryNames));
        });
    }
}
```

The above query is translated to SQL with LEFT call:

```sql
SELECT 
    1 AS [C1], 
    [GroupBy1].[K1] AS [ProductCategoryID], 
    [GroupBy1].[A1] AS [C2]
    FROM ( SELECT 
        [Extent1].[K1] AS [K1], 
        [dbo].[Concat]([Extent1].[A1]) AS [A1]
        FROM ( SELECT 
            [Extent1].[ProductCategoryID] AS [K1], 
            LEFT([Extent1].[Name], 4) AS [A1]
            FROM [Production].[ProductSubcategory] AS [Extent1]
        )  AS [Extent1]
        GROUP BY [K1]
    )  AS [GroupBy1]
```

### Niladic function

[Niladic functions](https://technet.microsoft.com/en-us/library/ms174979.aspx) are functions called without parentheses, e.g., these SQL-92 niladic functions:

-   CURRENT\_TIMESTAMP
-   CURRENT\_USER
-   SESSION\_USER
-   USER

In C#:

```csharp
public static class NiladicFunctions
{
    [Function(FunctionType.NiladicFunction, "CURRENT_TIMESTAMP")]
    public static DateTime? CurrentTimestamp() => Function.CallNotSupported<DateTime?>();

    [Function(FunctionType.NiladicFunction, "CURRENT_USER")]
    public static string CurrentUser() => Function.CallNotSupported<string>();

    [Function(FunctionType.NiladicFunction, "SESSION_USER")]
    public static string SessionUser() => Function.CallNotSupported<string>();

    [Function(FunctionType.NiladicFunction, "SYSTEM_USER")]
    public static string SystemUser() => Function.CallNotSupported<string>();

    [Function(FunctionType.NiladicFunction, "USER")]
    public static string User() => Function.CallNotSupported<string>();
}
```

When they are called:

```csharp
[TestMethod]
public void NiladicFunctionInLinq()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        var firstCategory = database.ProductSubcategories
            .GroupBy(subcategory => subcategory.ProductCategoryID)
            .Select(category => new
            {
                CategoryId = category.Key,
                SubcategoryNames = category.Select(subcategory => subcategory.Name.Left(4)).Concat(),
                CurrentTimestamp = NiladicFunctions.CurrentTimestamp(),
                CurrentUser = NiladicFunctions.CurrentUser(),
                SessionUser = NiladicFunctions.SessionUser(),
                SystemUser = NiladicFunctions.SystemUser(),
                User = NiladicFunctions.User()
            })
            .First();
        Assert.IsNotNull(firstCategory);
        Assert.IsNotNull(firstCategory.CurrentTimestamp);
        Assert.IsTrue(DateTime.Now >= firstCategory.CurrentTimestamp);
        Assert.AreEqual("dbo", firstCategory.CurrentUser, true, CultureInfo.InvariantCulture);
        Assert.AreEqual("dbo", firstCategory.SessionUser, true, CultureInfo.InvariantCulture);
        Assert.AreEqual($@"{Environment.UserDomainName}\{Environment.UserName}", firstCategory.SystemUser, true, CultureInfo.InvariantCulture);
        Assert.AreEqual("dbo", firstCategory.User, true, CultureInfo.InvariantCulture);
    }
}
```

They are translated to SQL calls without parentheses:

```sql
SELECT 
    [Limit1].[C2] AS [C1], 
    [Limit1].[ProductCategoryID] AS [ProductCategoryID], 
    [Limit1].[C1] AS [C2], 
    [Limit1].[C3] AS [C3], 
    [Limit1].[C4] AS [C4], 
    [Limit1].[C5] AS [C5], 
    [Limit1].[C6] AS [C6], 
    [Limit1].[C7] AS [C7]
    FROM ( SELECT TOP (1) 
        [GroupBy1].[A1] AS [C1], 
        [GroupBy1].[K1] AS [ProductCategoryID], 
        1 AS [C2], 
        CURRENT_TIMESTAMP AS [C3], 
        CURRENT_USER AS [C4], 
        SESSION_USER AS [C5], 
        SYSTEM_USER AS [C6], 
        USER AS [C7]
        FROM ( SELECT 
            [Extent1].[K1] AS [K1], 
            [dbo].[Concat]([Extent1].[A1]) AS [A1]
            FROM ( SELECT 
                [Extent1].[ProductCategoryID] AS [K1], 
                LEFT([Extent1].[Name], 4) AS [A1]
                FROM [Production].[ProductSubcategory] AS [Extent1]
            )  AS [Extent1]
            GROUP BY [K1]
        )  AS [GroupBy1]
    )  AS [Limit1]
```

### Model defined function

The following code defines a FormatName function for the Person model:

```csharp
public static class ModelDefinedFunctions
{
    [ModelDefinedFunction(nameof(FormatName), "EntityFramework.Functions.Tests.Examples",
        @"(CASE 
            WHEN [Person].[Title] IS NOT NULL
            THEN [Person].[Title] + N' ' 
            ELSE N'' 
        END) + [Person].[FirstName] + N' ' + [Person].[LastName]")]
    public static string FormatName(this Person person) =>
        $"{(person.Title == null ? string.Empty : person.Title + " ")}{person.FirstName} {person.LastName}";

    [ModelDefinedFunction(nameof(ParseDecimal), "EntityFramework.Functions.Tests.Examples", "cast([Person].[BusinessEntityID] as Decimal(20,8))")]
    public static decimal ParseDecimal(this Person person) => Convert.ToDecimal(person.BusinessEntityID);
}
```

When FormatName is called in LINQ to Entities query:

```csharp
[TestMethod]
public void ModelDefinedFunctionInLinqTest()
{
    using (AdventureWorks database = new AdventureWorks())
    {
        var employees = from employee in database.Persons
                        where employee.Title != null
                        let formatted = employee.FormatName()
                        select new
                        {
                            formatted,
                            employee
                        };
        var employeeData = employees.Take(1).ToList().FirstOrDefault();
        Assert.IsNotNull(employeeData);
        Assert.IsNotNull(employeeData.formatted);
        Assert.AreEqual(employeeData.employee.FormatName(), employeeData.formatted);
    }

    using (AdventureWorks database = new AdventureWorks())
    {
        var employees = from employee in database.Persons
                        where employee.Title != null
                        select new
                        {
                            Decimal = employee.ParseDecimal(),
                            Int32 = employee.BusinessEntityID
                        };
        var employeeData = employees.Take(1).ToList().FirstOrDefault();
        Assert.IsNotNull(employeeData);
        Assert.AreEqual(employeeData.Decimal, Convert.ToInt32(employeeData.Int32));
    }
}
```

The queries are translated to:

```sql
SELECT 
    [Limit1].[BusinessEntityID] AS [BusinessEntityID], 
    [Limit1].[C1] AS [C1], 
    [Limit1].[Title] AS [Title], 
    [Limit1].[FirstName] AS [FirstName], 
    [Limit1].[LastName] AS [LastName]
    FROM ( SELECT TOP (1) 
        [Extent1].[BusinessEntityID] AS [BusinessEntityID], 
        [Extent1].[Title] AS [Title], 
        [Extent1].[FirstName] AS [FirstName], 
        [Extent1].[LastName] AS [LastName], 
        CASE WHEN ([Extent1].[Title] IS NOT NULL) THEN [Extent1].[Title] + N' ' ELSE N'' END + [Extent1].[FirstName] + N' ' + [Extent1].[LastName] AS [C1]
        FROM [Person].[Person] AS [Extent1]
        WHERE [Extent1].[Title] IS NOT NULL
    )  AS [Limit1]

SELECT 
    [Limit1].[BusinessEntityID] AS [BusinessEntityID], 
    [Limit1].[C1] AS [C1]
    FROM ( SELECT TOP (1) 
        [Extent1].[BusinessEntityID] AS [BusinessEntityID], 
         CAST( [Extent1].[BusinessEntityID] AS decimal(20,8)) AS [C1]
        FROM [Person].[Person] AS [Extent1]
        WHERE [Extent1].[Title] IS NOT NULL
    )  AS [Limit1]
```

## Version history

This library adopts the [http://semver.org](http://semver.org/) standard for semantic versioning.

-   1.0.0: Initial release.
-   1.0.1: Bug fix.
-   1.1.0: [Bug fix](https://github.com/Dixin/EntityFramework.Functions/issues/1), and shortcut APIs for each function type:

-   \[StoredProcedure\]
-   \[TableValuedFunction\]
-   \[ComposableScalarValuedFunction\]
-   \[NonComposableScalarValuedFunction\]
-   \[AggregateFunction\]
-   \[BuiltInFunction\]
-   \[NiladicFunction\]

-   1.2.0: Support model defined function with \[ModelDefinedFunction\].
-   1.3.0: Support entity type and complex type defined in different assembly/namespace. Support table-valued function returning entity type or complex type.
-   1.3.1: Fix a [regression](https://github.com/Dixin/EntityFramework.Functions/commit/00a2212828825d874a502525e2fed52e700954a5#commitcomment-17750617) causing complex type not working properly with PostgreSQL.
-   1.4.0: Sign assembly with strong named key. Fix minor issues.
-   1.5.0: Support .NET Standard.