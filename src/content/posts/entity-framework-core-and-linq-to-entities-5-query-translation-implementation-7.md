---
title: "Entity Framework/Core and LINQ to Entities (5) Query Translation Implementation"
published: 2019-03-25
description: "The previous part demonstrated what are the SQL translations of the LINQ to Entities queries. This part discusses how the translation is implemented. Regarding different database systems can have diff"
image: ""
tags: ["C#", ".NET", ".NET Core", "LINQ", ".NET Standard"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **Latest EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-5-query-translation-implementation**](/posts/entity-framework-core-and-linq-to-entities-5-query-translation-implementation "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-5-query-translation-implementation")

## **EF version of this article:** [https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-5-query-translation](/posts/entity-framework-and-linq-to-entities-5-query-translation "https://weblogs.asp.net/dixin/entity-framework-and-linq-to-entities-5-query-translation")

The previous part demonstrated what are the SQL translations of the LINQ to Entities queries. This part discusses how the translation is implemented. Regarding different database systems can have different query languages or different query APIs, EF/Core implement a provider model to work with different kinds of databases. In EF Core, the base libraries are the Microsoft.EntityFrameworkCore and Microsoft.EntityFrameworkCore.Relational NuGet packages. Microsoft.EntityFrameworkCore provides the database provider contracts as Microsoft.EntityFrameworkCore.Storage.IDatabaseProviderServices interface. And the SQL database support is implemented by the Microsoft.EntityFrameworkCore,SqlServer NuGet package, which provides Microsoft.EntityFrameworkCore.Storage.Internal.SqlServerDatabaseProviderServices type to implement IDatabaseProviderServices. There are other libraries for different databases, like Microsoft.EntityFrameworkCore.SQLite NuGet package for SQLite, etc.

> In EF, the EntityFramework NuGet package contains 2 assemblies, EntityFramework.dll and EntityFramework.SqlServer.dll. The base library EntityFramework.dll provides database provider contracts as System.Data.Entity.Core.Common.DbProviderServices abstract class, and the SQL database provider library EntityFramework.SqlServer.dll provides System.Data.Entity.SqlServer.SqlProviderServices to implement DbProviderServices

With this provider model, EF/Core breaks the translation into 2 parts. First, IQueryable<T> query methods work with expression trees, and EF/Core base libraries translate these .NET expression tree to generic, intermediate database expression tree; Then the specific EF/Core database provider is responsible to generate query language for the specific database.

## Code to LINQ expression tree

Before translation, .NET expression tree must be built to represent the query logic. As fore mentioned, expression tree enables function as data. In C#, an expression tree shares the same syntax as functions, but is compiled to abstract syntactic tree representing function’s source code. In LINQ, IQueryable<T> utilizes expression tree to represent the abstract syntactic structure of a remote query.

### IQueryable<T> and IQueryProvider

IQueryable<T> has been demonstrated:

```csharp
namespace System.Linq
{
    public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable
    {
        // IEnumerator<T> GetEnumerator(); from IEnumerable<T>.

        // Type ElementType { get; } from IQueryable.

        // Expression Expression { get; } from IQueryable.

        // IQueryProvider Provider { get; } from IQueryable.
    }
}
```

It is a wrapper of iterator factory, an element type, an expression tree representing the current query’s logic, and a query provider of IQueryProvider type:

```csharp
namespace System.Linq
{
    public interface IQueryProvider
    {
        IQueryable CreateQuery(Expression expression);

        IQueryable<TElement> CreateQuery<TElement>(Expression expression);

        object Execute(Expression expression);

        TResult Execute<TResult>(Expression expression);
    }
}
```

IQueryProvider has CreateQuery and Execute methods, all accepting a expression tree parameter. CreateQuery methods return an IQueryable<T> query, and Execute methods return a query result. These methods are called inside the Queryable methods.

### Queryable methods

As fore mentioned, Queryable also provides 2 kinds of query methods, sequence queries returning IQueryable<T> query, and value queries returning a query result. Take Where, Select, and First as examples, the following are their implementations:

```csharp
namespace System.Linq
{
    public static class Queryable
    {
        public static IQueryable<TSource> Where<TSource>(
            this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
        {
            Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, IQueryable<TSource>> currentMethod = 
                Where;
            MethodCallExpression whereCallExpression = Expression.Call(
                method: currentMethod.Method,
                arg0: source.Expression,
                arg1: Expression.Quote(predicate));
            return source.Provider.CreateQuery<TSource>(whereCallExpression);
        }

        public static IQueryable<TResult> Select<TSource, TResult>(
            this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector)
        {
            Func<IQueryable<TSource>, Expression<Func<TSource, TResult>>, IQueryable<TResult>> currentMethod = 
                Select;
            MethodCallExpression selectCallExpression = Expression.Call(
                method: currentMethod.Method,
                arg0: source.Expression,
                arg1: Expression.Quote(selector));
            return source.Provider.CreateQuery<TResult>(selectCallExpression);
        }

        public static TSource First<TSource>(
            this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
        {
            Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, TSource> currentMethod = First;
            MethodCallExpression firstCallExpression = Expression.Call(
                method: currentMethod.Method,
                arg0: source.Expression,
                arg1: Expression.Quote(predicate));
            return source.Provider.Execute<TSource>(firstCallExpression);
        }

        public static TSource First<TSource>(this IQueryable<TSource> source)
        {
            Func<IQueryable<TSource>, TSource> currentMethod = First;
            MethodCallExpression firstCallExpression = Expression.Call(
                method: currentMethod.Method,
                arg0: source.Expression);
            return source.Provider.Execute<TSource>(firstCallExpression);
        }

        // Other members.
    }
}
```

They just build a MethodCallExpression expression, representing the current query method is called. Then they obtain query provider from source’s Provider property. The sequence query methods call query provider’s CreateQuery method to return IQueryable<T> query, and the value query methods call query provider’s Execute method to return a query result. All Queryable methods are implemented in this pattern, except AsQueryable, which is discussed in the previous part.

### Build LINQ to Entities abstract syntax tree

With above Where and Select query methods, a simple LINQ to Entities query can be implemented to return an IQueryable<T> of values:
```
internal static partial class Translation
{
    internal static void WhereAndSelect(AdventureWorks adventureWorks)
    {
        // IQueryable<string> products = adventureWorks.Products
        //    .Where(product => product.Name.Length > 10)
        //    .Select(product => product.Name);
        IQueryable<Product> sourceQueryable = adventureWorks.Products;
        IQueryable<Product> whereQueryable = sourceQueryable.Where(product => product.Name.Length > 10);
        IQueryable<string> selectQueryable = whereQueryable.Select(product => product.Name); // Define query.
        foreach (string result in selectQueryable) // Execute query.
        {
            result.WriteLine();
        }
    }
}
```

The above example filters the products with Name longer than 10 characters, and queries the products’ Names. By desugaring the lambda expressions, and unwrapping the query methods, the above LINQ to Entities query is equivalent to:
```
internal static void WhereAndSelectLinqExpressions(AdventureWorks adventureWorks)
{
    IQueryable<Product> sourceQueryable = adventureWorks.Products; // DbSet<Product>.
    ConstantExpression sourceConstantExpression = (ConstantExpression)sourceQueryable.Expression;
    IQueryProvider sourceQueryProvider = sourceQueryable.Provider; // EntityQueryProvider.

    // Expression<Func<Product, bool>> predicateExpression = product => product.Name.Length > 10;
    ParameterExpression productParameterExpression = Expression.Parameter(typeof(Product), "product");
    Expression<Func<Product, bool>> predicateExpression = Expression.Lambda<Func<Product, bool>>(
        body: Expression.GreaterThan(
            left: Expression.Property(
                expression: Expression.Property(
                    expression: productParameterExpression, propertyName: nameof(Product.Name)), 
                propertyName: nameof(string.Length)),
            right: Expression.Constant(10)),
        parameters: productParameterExpression);

    // IQueryable<Product> whereQueryable = sourceQueryable.Where(predicateExpression);
    Func<IQueryable<Product>, Expression<Func<Product, bool>>, IQueryable<Product>> whereMethod =
        Queryable.Where;
    MethodCallExpression whereCallExpression = Expression.Call(
        method: whereMethod.Method,
        arg0: sourceConstantExpression,
        arg1: Expression.Quote(predicateExpression));
    IQueryable<Product> whereQueryable = sourceQueryProvider
        .CreateQuery<Product>(whereCallExpression); // EntityQueryable<Product>.
    IQueryProvider whereQueryProvider = whereQueryable.Provider; // EntityQueryProvider.

    // Expression<Func<Product, string>> selectorExpression = product => product.Name;
    Expression<Func<Product, string>> selectorExpression = Expression.Lambda<Func<Product, string>>(
        body: Expression.Property(productParameterExpression, nameof(Product.Name)),
        parameters: productParameterExpression);

    // IQueryable<string> selectQueryable = whereQueryable.Select(selectorExpression);
    Func<IQueryable<Product>, Expression<Func<Product, string>>, IQueryable<string>> selectMethod =
        Queryable.Select;
    MethodCallExpression selectCallExpression = Expression.Call(
        method: selectMethod.Method,
        arg0: whereCallExpression,
        arg1: Expression.Quote(selectorExpression));
    IQueryable<string> selectQueryable = whereQueryProvider
        .CreateQuery<string>(selectCallExpression); // EntityQueryable<Product>/DbQuery<Product>.

    using (IEnumerator<string> iterator = selectQueryable.GetEnumerator()) // Execute query.
    {
        while (iterator.MoveNext())
        {
            iterator.Current.WriteLine();
        }
    }
}
```

Here are the steps how the fluent query builds its query expression tree:

-   Build data source:

-   The initial source IQueryable<T> is a DbSet<T> instance automatically created by EF/Core. It wraps:

-   A ConstantExpression expression representing the data source.
-   A query provider that implements IQueryProvider. In EF Core it is an automatically created EntityQueryProvider instance, and in EF it is DbQueryProvider.

-   Build Where query:

-   A predicate expression is built for Where,
-   Where accepts the IQueryable<T> source. But actually Where only needs the source’s expression and query provider. A MethodCallExpression expression is built to represent a call of Where itself with 2 arguments, the source and the predicate expression. Then source query provider’s CreateQuery method is called with the MethodCallExpression expression just built, and return an IQueryable<T> query, which wraps:

-   The MethodCallExpression expression representing current Where call
-   A query provider, which is the same one from the source.

-   Build Select query:

-   A selector expression is built for Select
-   Select accepts the IQueryable<T> returned by Where as source. Again, Select only needs the expression and query provider from source. A MethodCallExpression expression is built to represent a call to Select itself with 2 arguments, the source and the selector expression. Then source query provider’s CreateQuery method is called with the MethodCallExpression expression just built, and return an IQueryable<T> query, which wraps:

-   The MethodCallExpression expression representing current Select call
-   A query provider, which is the same one from the source.

So, the final IQueryable<T> query’s Expression property is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:
```
MethodCallExpression (NodeType = Call, Type = IQueryable<string>)
|_Method = Queryable.Select<Product, string>
|_Object = null
|_Arguments
  |_MethodCallExpression (NodeType = Call, Type = IQueryable<Product>)
  | |_Method = Queryable.Where<Product>
  | |_Object = null
  | |_Arguments
  |   |_ConstantExpression (NodeType = Constant, Type = IQueryable<Product>)
  |   | |_Value = new EntityQueryable<Product>(adventureWorks.GetService<IAsyncQueryProvider>())
  |   |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, bool>>)
  |     |_Operand
  |       |_Expression<Func<Product, bool>> (NodeType = Lambda, Type = Func<Product, bool>)
  |         |_Parameters
  |         | |_ParameterExpression (NodeType = Parameter, Type = Product)
  |         |   |_Name = "product"
  |         |_Body
  |           |_BinaryExpression (NodeType = GreaterThan, Type = bool)
  |             |_Left
  |             | |_MemberExpression (NodeType = MemberAccess, Type = int)
  |             |   |_Member = "Length"
  |             |   |_Expression
  |             |     |_MemberExpression (NodeType = MemberAccess, Type = string)
  |             |       |_Member = "Name"
  |             |       |_Expression
  |             |         |_ParameterExpression (NodeType = Parameter, Type = Product)
  |             |           |_Name = "product"
  |             |_Right
  |               |_ConstantExpression (NodeType = Constant, Type = int)
  |                 |_Value = 10
  |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
    |_Operand
      |_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
        |_Parameters
        | |_ParameterExpression (NodeType = Parameter, Type = Product)
        |   |_Name = "product"
        |_Body
          |_MemberExpression (NodeType = MemberAccess, Type = string)
            |_Member = "Name"
            |_Expression
              |_ParameterExpression (NodeType = Parameter, Type = Product)
                |_Name = "product"
```

> In FE, the difference is, the original IQueryable<T> data source wraps a MethodCallExpression expression, which represents an ObjectQuery<T> instance’s MergeAs instance method call with 1 argument, the MergeOption.AppendOnly enumeration. It means append new entities to the entity cache if any entity is constructed by the query. Entity cache will be discussed in a later part.

This also demonstrates that lambda expression, extension methods, and LINQ query expression are powerful language features of C#. Such a rich abstract syntactic tree can be built by C# code as simple as:
```
internal static void WhereAndSelectQuery(AdventureWorks adventureWorks)
{
    IQueryable<string> products = adventureWorks.Products
        .Where(product => product.Name.Length > 10)
        .Select(product => product.Name);
    // Equivalent to:
    // IQueryable<string> products =
    //    from product in adventureWorks.Products
    //    where product.Name.Length > 10
    //    select product.Name;
}
```

The other kind of query returning a single value works in the similar way. Take above First as example:
```
internal static void SelectAndFirst(AdventureWorks adventureWorks)
{
    // string first = adventureWorks.Products.Select(product => product.Name).First();
    IQueryable<Product> sourceQueryable = adventureWorks.Products;
    IQueryable<string> selectQueryable = sourceQueryable.Select(product => product.Name);
    string first = selectQueryable.First().WriteLine(); // Execute query.
}
```

Here the initial source and and Select query are the same as the previous example. So this time, just unwrap the First method. The above First query is equivalent to:
```
internal static void SelectAndFirstLinqExpressions(AdventureWorks adventureWorks)
{
    IQueryable<Product> sourceQueryable = adventureWorks.Products;

    IQueryable<string> selectQueryable = sourceQueryable.Select(product => product.Name);
    MethodCallExpression selectCallExpression = (MethodCallExpression)selectQueryable.Expression;
    IQueryProvider selectQueryProvider = selectQueryable.Provider; // DbQueryProvider.

    // string first = selectQueryable.First();
    Func<IQueryable<string>, string> firstMethod = Queryable.First;
    MethodCallExpression firstCallExpression = Expression.Call(
        method: firstMethod.Method, arg0: selectCallExpression);

    string first = selectQueryProvider.Execute<string>(firstCallExpression).WriteLine(); // Execute query.
}
```

In First query, the MethodCallExpression expression is built in the same way to represent current First call. The difference is, query provider’s Execute method is called instead of CreateQuery, so that a query result is returned instead of a query.

Similarly, the last expression tree built inside First, is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:
```
MethodCallExpression (NodeType = Call, Type = string)
|_Method = Queryable.First<string>
|_Object = null
|_Arguments
  |_MethodCallExpression (NodeType = Call, Type = IQueryable<string>)
    |_Method = Queryable.Select<Product, string>
    |_Object = null
    |_Arguments
      |_ConstantExpression (NodeType = Constant, Type = IQueryable<Product>)
      | |_Value = new EntityQueryable<Product>(adventureWorks.GetService<IAsyncQueryProvider>())
      |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
       |_Operand
          |_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
            |_Parameters
            | |_ParameterExpression (NodeType = Parameter, Type = Product)
            |   |_Name = "product"
            |_Body
              |_MemberExpression (NodeType = MemberAccess, Type = string)
                |_Member = "Name"
                |_Expression
                  |_ParameterExpression (NodeType = Parameter, Type = Product)
                    |_Name = "product"
```

> Again, in FE, the original IQueryable<Product> data source wraps a MethodCallExpression expression, instead of ConstantExpression.

And again, the entire abstract syntactic tree can be built by C# code as simple as:
```
internal static void SelectAndFirstQuery(AdventureWorks adventureWorks)
{
    string first = adventureWorks.Products.Select(product => product.Name).First();
    // Equivalent to:
    // string first = (from product in adventureWorks.Products select product.Name).First();
}
```

## .NET expression tree to database expression tree

When LINQ to Entities queries are executed by either pulling values from IQueryable<T>, or calling IQueryProvider.Execute, EF/Core compiles .NET expression tree to database expression tree.

### Database query abstract syntax tree

The logic of LINQ to Entities can be represented by .NET expression tree, and EF/Core also use expression tree to represent the database query logic. For example, EF Core base libraries provides the Microsoft.EntityFrameworkCore.Query.Expressions.SelectExpression represents a database SELECT query:

```csharp
namespace Microsoft.EntityFrameworkCore.Query.Expressions
{
    public class SelectExpression : TableExpressionBase
    {
        public virtual IReadOnlyList<Expression> Projection { get; } // SELECT.

        public virtual bool IsDistinct { get; set; } // DISTINCT.

        public virtual Expression Limit { get; set; } // TOP.

        public virtual IReadOnlyList<TableExpressionBase> Tables { get; } // FROM.

        public virtual Expression Predicate { get; set; } // WHERE.

        public virtual IReadOnlyList<Ordering> OrderBy { get; } // ORDER BY.

        public virtual Expression Offset { get; set; } // OFFSET.

        public override Type Type { get; }

        // Other members.
    }
}
```

Here are all the database expressions provided by EF Core, and the Remotion.Linq library used by EF Core:

Expression

-   AggregateExpression

-   MaxExpression
-   MinExpression
-   SumExpression

-   AliasExpression
-   ColumnExpression
-   CountExpression
-   DatePartExpression
-   DiscriminatorPredicateExpression
-   ExistsExpression
-   ExplicitCastExpression
-   InExpression
-   IsNullExpression
-   LikeExpression
-   NotNullableExpression
-   NullConditionalExpression
-   PartialEvaluationExceptionExpression
-   PropertyParameterExpression
-   QuerySourceReferenceExpression
-   RowNumberExpression
-   SqlFunctionExpression
-   StringCompareExpression
-   SubQueryExpression
-   TableExpressionBase

-   CrossJoinExpression
-   FromSqlExpression
-   JoinExpressionBase

-   InnerJoinExpression
-   LeftOuterJoinExpression

-   LateralJoinExpression
-   SelectExpression
-   TableExpression

-   VBStringComparisonExpression

> EF provides database command tree, where each node derives from System.Data.Entity.Core.Common.CommandTrees.DbExpression:
> 
> -   DbExpression
> 
> -   DbApplyExpression
> -   DbArithmeticExpression
> -   DbBinaryExpression
> 
> -   DbAndExpression
> -   DbComparisonExpression
> -   DbExceptExpression
> -   DbIntersectExpression
> -   DbOrExpression
> -   DbUnionAllExpression
> 
> -   DbCaseExpression
> -   DbConstantExpression
> -   DbCrossJoinExpression
> -   DbFilterExpression
> -   DbFunctionExpression
> -   DbGroupByExpression
> -   DbInExpression
> -   DbJoinExpression
> -   DbLambdaExpression
> -   DbLikeExpression
> -   DbLimitExpression
> -   DbNewInstanceExpression
> -   DbNullExpression
> -   DbParameterReferenceExpression
> -   DbProjectExpression
> -   DbPropertyExpression
> -   DbQuantifierExpression
> -   DbRelationshipNavigationExpression
> -   DbScanExpression
> -   DbSkipExpression
> -   DbSortExpression
> -   DbUnaryExpression
> 
> -   DbCastExpression
> -   DbDerefExpression
> -   DbDistinctExpression
> -   DbElementExpression
> -   DbEntityRefExpression
> -   DbIsEmptyExpression
> -   DbIsNullExpression
> -   DbIsOfExpression
> -   DbNotExpression
> -   DbOfTypeExpression
> -   DbRefExpression
> -   DbTreatExpression
> -   DbRefKeyExpression
> 
> -   DbVariableReferenceExpression
> 
> When representing a complete database query, command tree’s top node is a DbQueryCommandTree instance:
> 
> ```csharp
> namespace System.Data.Entity.Core.Common.CommandTrees
> {
>     public abstract class DbCommandTree
>     {
>         public IEnumerable<KeyValuePair<string, TypeUsage>> Parameters { get; }
> 
>         // Other members.
>     }
>     
>     public sealed class DbQueryCommandTree : DbCommandTree
>     {
>         public DbExpression Query { get; }
> 
>         // Other members.
>     }
> }
> ```
> 
> DbQueryCommandTree’s Parameters property contains the parameters for the database query, and Query property is the top node of the DbExpression tree. They are similar to LambdaExpression’s Parameters and Body properties.

### Compile LINQ expressions to database expressions

EF Core calls the third party library Remotion.Linq to compile LINQ expression tree to a query model, then EF Core compiles the query model to database expression tree, which is a SelectExpression instance. The following Compile method demonstrates how the compilation can be done. It accepts a LINQ expression tree, and returns a tuple of SelectExpression and its parameters, if any:
```
public static partial class DbContextExtensions
{
    public static (SelectExpression, IReadOnlyDictionary<string, object>) Compile(
        this DbContext dbContext, Expression linqExpression)
    {
        QueryContext queryContext = dbContext.GetService<IQueryContextFactory>().Create();
        IEvaluatableExpressionFilter evaluatableExpressionFilter = dbContext.GetService<IEvaluatableExpressionFilter>();
        linqExpression = new ParameterExtractingExpressionVisitor(
            evaluatableExpressionFilter: evaluatableExpressionFilter,
            parameterValues: queryContext,
            logger: dbContext.GetService<IDiagnosticsLogger<DbLoggerCategory.Query>>(),
            parameterize: true).ExtractParameters(linqExpression);
        QueryParser queryParser = new QueryParser(new ExpressionTreeParser(
            nodeTypeProvider: dbContext.GetService<INodeTypeProviderFactory>().Create(),
            processor: new CompoundExpressionTreeProcessor(new IExpressionTreeProcessor[]
            {
                new PartialEvaluatingExpressionTreeProcessor(evaluatableExpressionFilter),
                new TransformingExpressionTreeProcessor(ExpressionTransformerRegistry.CreateDefault())
            })));
        QueryModel queryModel = queryParser.GetParsedQuery(linqExpression);

        Type resultType = queryModel.GetResultType();
        if (resultType.IsConstructedGenericType && resultType.GetGenericTypeDefinition() == typeof(IQueryable<>))
        {
            resultType = resultType.GenericTypeArguments.Single();
        }

        QueryCompilationContext compilationContext = dbContext.GetService<IQueryCompilationContextFactory>()
            .Create(async: false);
        RelationalQueryModelVisitor queryModelVisitor = (RelationalQueryModelVisitor)compilationContext
            .CreateQueryModelVisitor();
        queryModelVisitor.GetType()
            .GetMethod(nameof(RelationalQueryModelVisitor.CreateQueryExecutor))
            .MakeGenericMethod(resultType)
            .Invoke(queryModelVisitor, new object[] { queryModel });
        SelectExpression databaseExpression = queryModelVisitor.TryGetQuery(queryModel.MainFromClause);
        databaseExpression.QuerySource = queryModel.MainFromClause;
        return (databaseExpression, queryContext.ParameterValues);
    }
}
```

> EF calls ExpressionConverter, PlanCompiler and other components to convert expression tree to database command tree. These APIs are not public.

So above Where and Select query’s expression tree can be converted as:
```
internal static void CompileWhereAndSelectExpressions(AdventureWorks adventureWorks)
{
    Expression linqExpression =adventureWorks.Products
        .Where(product => product.Name.Length > 10)
        .Select(product => product.Name).Expression;
    (SelectExpression DatabaseExpression, IReadOnlyDictionary<string, object> Parameters) compilation =
        adventureWorks.Compile(linqExpression);
    compilation.DatabaseExpression.WriteLine();
    compilation.Parameters.WriteLines(parameter => $"{parameter.Key}: {parameter.Value}");
}
```

The compiled SelectExpression is the same as the following SelectExpression built on the fly:
```
internal static SelectExpression WhereAndSelectDatabaseExpressions(AdventureWorks adventureWorks)
{
    QueryCompilationContext compilationContext = adventureWorks.GetService<IQueryCompilationContextFactory>()
        .Create(async: false);
    SelectExpression databaseExpression = new SelectExpression(
        dependencies: new SelectExpressionDependencies(adventureWorks.GetService<IQuerySqlGeneratorFactory>()),
        queryCompilationContext: (RelationalQueryCompilationContext)compilationContext);
    MainFromClause querySource = new MainFromClause(
        itemName: "product",
        itemType: typeof(Product),
        fromExpression: Expression.Constant(adventureWorks.ProductCategories));
    TableExpression tableExpression = new TableExpression(
        table: nameof(Product),
        schema: AdventureWorks.Production,
        alias: querySource.ItemName,
        querySource: querySource);
    databaseExpression.AddTable(tableExpression);
    IEntityType productEntityType = adventureWorks.Model.FindEntityType(typeof(Product));
    IProperty nameProperty = productEntityType.FindProperty(nameof(Product.Name));
    ColumnExpression nameColumn = new ColumnExpression(
        name: nameof(Product.Name), property: nameProperty, tableExpression: tableExpression);
    databaseExpression.AddToProjection(nameColumn);
    databaseExpression.AddToPredicate(Expression.GreaterThan(
        left: new ExplicitCastExpression(
            operand: new SqlFunctionExpression(
                functionName: "LEN",
                returnType: typeof(int),
                arguments: new Expression[] { nameColumn }),
            type: typeof(int)),
        right: Expression.Constant(10)));
    return databaseExpression.WriteLine();
}
```

This compiled abstract syntactic tree can be visualized as:
```
SelectExpression (NodeType = Extension, Type = string)
|_Porjection
| |_ColumnExpression (NodeType = Extension, Type = string)
|   |_Name = "Name"
|   |_Property = Product.Name
|   |_Table
|     |_TableExpression (NodeType = Extension, Type = object)
|     |_Schema = "Production"
|     |_Name = "Product"
|     |_Alias = "product"
|_Tables
| |_TableExpression (NodeType = Extension, Type = object)
|   |_Schema = "Production"
|   |_Name = "Product"
|   |_Alias = "product"
|_Predicate
  |_BinaryExpression (NodeType = GreaterThan, Type = bool)
  |_left
  | |_ExplicitCastExpression (NodeType = Extension, Type = int)
  |   |_Operand
  |     |_SqlFunctionExpression (NodeType = Extension, Type = int)
  |       |_FunctionName = "LEN"
  |       |_Arguments
  |         |_ColumnExpression (NodeType = Extension, Type = string)
  |           |_Name = "Name"
  |           |_Property = Product.Name
  |           |_Table
  |             |_TableExpression (NodeType = Extension, Type = object)
  |               |_Schema = "Production"
  |               |_Name = "Product"
  |               |_Alias = "product"
  |_Right
    |_ConstantExpression (NodeType = Constant, Type = int)
    |_Value = 1
```

> In EF, the compiled command tree above is equivalent to the command tree built below:
> 
> ```
> internal static DbQueryCommandTree WhereAndSelectDatabaseExpressions(AdventureWorks adventureWorks)
> {
>     MetadataWorkspace metadata = ((IObjectContextAdapter)adventureWorks).ObjectContext.MetadataWorkspace;
>     TypeUsage stringTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
>         .GetPrimitiveTypes(DataSpace.CSpace)
>         .Single(type => type.ClrEquivalentType == typeof(string)));
>     TypeUsage nameRowTypeUsage = TypeUsage.CreateDefaultTypeUsage(RowType.Create(
>         EnumerableEx.Return(EdmProperty.Create(nameof(Product.Name), stringTypeUsage)),
>         Enumerable.Empty<MetadataProperty>()));
>     TypeUsage productTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
>         .GetType(nameof(Product), "CodeFirstDatabaseSchema", DataSpace.SSpace));
>     EntitySet productEntitySet = metadata
>         .GetEntityContainer("CodeFirstDatabase", DataSpace.SSpace)
>         .GetEntitySetByName(nameof(Product), false);
> 
>     DbProjectExpression query = DbExpressionBuilder.Project(
>         DbExpressionBuilder.BindAs(
>             DbExpressionBuilder.Filter(
>                 DbExpressionBuilder.BindAs(
>                     DbExpressionBuilder.Scan(productEntitySet), "Extent1"),
>                 DbExpressionBuilder.GreaterThan(
>                     DbExpressionBuilder.Invoke(
>                         ((IObjectCOntextAdapter)adventureWorks).ObjectContext.MetadataWorkspace
>                             .GetFunctions("LEN", "SqlServer", DataSpace.SSpace).First(),
>                         DbExpressionBuilder.Property(
>                             DbExpressionBuilder.Variable(productTypeUsage, "Extent1"), nameof(Product.Name))),
>                     DbExpressionBuilder.Constant(10))),
>             "Filter1"),
>         DbExpressionBuilder.New(
>             nameRowTypeUsage,
>             DbExpressionBuilder.Property(
>                 DbExpressionBuilder.Variable(productTypeUsage, "Filter1"), nameof(Product.Name))));
>     DbQueryCommandTree result = new DbQueryCommandTree(metadata, DataSpace.SSpace, query);
>     return result.WriteLine();
> }
> ```
> 
> This abstract syntactic tree can be visualized as:
> 
> ```
> DbQueryCommandTree
> |_Parameters
> |_Query
>   |_DbProjectExpression (ExpressionKind = Project, ResultType = Collection(Row['Name' = Edm.String]))
>     |_Input
>     | |_DbExpressionBinding (VariableType = Product)
>     |   |_VariableName = 'Filter1'
>     |   |_Expression
>     |     |_DbFilterExpression (ExpressionKind = Filter, ResultType = Product)
>     |       |_Input
>     |       | |_DbExpressionBinding (VariableType = Product)
>     |       |   |_VariableName = 'Extent1'
>     |       |   |_Expression
>     |       |     |_DbScanExpression (ExpressionKind = Scan, ResultType = Collection(Product))
>     |       |       |_Target = Products
>     |       |_Predicate
>     |         |_DbComparisonExpression (ExpressionKind = GreaterThan, ResultType = Edm.Boolean)
>     |           |_Left
>     |           | |_DbFunctionExpression (ExpressionKind = Function, ResultType = Edm.Int32)
>     |           |   |_Function = Edm.Length
>     |           |   |_Arguments
>     |           |     |_DbPropertyExpression (ExpressionKind = Property, ResultType = Edm.String)
>     |           |       |_Property = ‘Name’
>     |           |       |_Instance
>     |           |         |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Product)
>     |           |           |_VariableName = 'Extent1'
>     |           |_Right
>     |             |_DbConstantExpression (ExpressionKind = Constant, ResultType = Edm.Int32)
>     |               |_Value = 10
>     |_Projection
>       |_DbNewInstanceExpression (ExpressionKind = NewInstance, ResultType = Row['Name' = Edm.String])
>         |_Arguments
>           |_DbPropertyExpression (ExpressionKind = Property, ResultType = Edm.String)
>             |_Property = "Name"
>             |_Instance
>               |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Product)
>                 |_VariableName = 'Filter1'
> ```

Similarly, the other Select and First query’s expression tree is compiled to abstract syntax tree the same as the following:
```
internal static SelectExpression SelectAndFirstDatabaseExpressions(AdventureWorks adventureWorks)
{
    QueryCompilationContext compilationContext = adventureWorks.GetService<IQueryCompilationContextFactory>()
        .Create(async: false);
    SelectExpression selectExpression = new SelectExpression(
        dependencies: new SelectExpressionDependencies(adventureWorks.GetService<IQuerySqlGeneratorFactory>()),
        queryCompilationContext: (RelationalQueryCompilationContext)compilationContext);
    MainFromClause querySource = new MainFromClause(
        itemName: "product",
        itemType: typeof(Product),
        fromExpression: Expression.Constant(adventureWorks.ProductCategories));
    TableExpression tableExpression = new TableExpression(
        table: nameof(Product),
        schema: AdventureWorks.Production,
        alias: querySource.ItemName,
        querySource: querySource);
    selectExpression.AddTable(tableExpression);
    IEntityType productEntityType = adventureWorks.Model.FindEntityType(typeof(Product));
    IProperty nameProperty = productEntityType.FindProperty(nameof(Product.Name));
    selectExpression.AddToProjection(new ColumnExpression(
        name: nameof(Product.Name), property: nameProperty, tableExpression: tableExpression));
    selectExpression.Limit = Expression.Constant(1);
    return selectExpression.WriteLine();
}
```

And this abstract syntactic tree can be visualized as:
```
SelectExpression (NodeType = Extension, Type = string)
|_Limit
| |_ConstantExpression (NodeType = Constant, Type = int)
|   |_Value = 1
|_Porjection
|   |_ColumnExpression (NodeType = Extension, Type = string)
|   |_Name = "Name"
|   |_Property = Product.Name
|   |_Table
|     |_TableExpression (NodeType = Extension, Type = object)
|     |_Schema = "Production"
|     |_Name = "Product"
|     |_Alias = "product"
|_Tables
  |_TableExpression (NodeType = Extension, Type = object)
    |_Schema = "Production"
    |_Name = "Product"
    |_Alias = "product"
```

> In EF, the compiled command tree above is equivalent to the command tree built below:
> 
> ```
> internal static DbQueryCommandTree SelectAndFirstDatabaseExpressions(AdventureWorks adventureWorks)
> {
>     MetadataWorkspace metadata = ((IObjectContextAdapter)adventureWorks).ObjectContext.MetadataWorkspace;
>     TypeUsage stringTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
>         .GetPrimitiveTypes(DataSpace.CSpace)
>         .Single(type => type.ClrEquivalentType == typeof(string)));
>     TypeUsage nameRowTypeUsage = TypeUsage.CreateDefaultTypeUsage(RowType.Create(
>         EnumerableEx.Return(EdmProperty.Create(nameof(Product.Name), stringTypeUsage)),
>         Enumerable.Empty<MetadataProperty>()));
>     TypeUsage productTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
>         .GetType(nameof(Product), "CodeFirstDatabaseSchema", DataSpace.SSpace));
>     EntitySet productEntitySet = metadata
>         .GetEntityContainer("CodeFirstDatabase", DataSpace.SSpace)
>         .GetEntitySetByName(nameof(Product), false);
> 
>     DbProjectExpression query = DbExpressionBuilder.Project(
>         DbExpressionBuilder.BindAs(
>             DbExpressionBuilder.Limit(
>                 DbExpressionBuilder.Scan(productEntitySet),
>                 DbExpressionBuilder.Constant(1)),
>             "Limit1"),
>         DbExpressionBuilder.New(
>             nameRowTypeUsage,
>             DbExpressionBuilder.Property(
>                 DbExpressionBuilder.Variable(productTypeUsage, "Limit1"), nameof(Product.Name))));
>     DbQueryCommandTree commandTree = new DbQueryCommandTree(metadata, DataSpace.SSpace, query);
>     return commandTree.WriteLine();
> }
> ```
> 
> And this abstract syntactic tree can be visualized as:
> 
> ```
> DbQueryCommandTree
> |_Parameters
> |_Query
>   |_DbProjectExpression (ExpressionKind = Project, ResultType = Collection(Row['Name' = Edm.String]))
>     |_Input
>     | |_DbExpressionBinding (VariableType = Product)
>     |   |_VariableName = 'Limit1'
>     |   |_Expression
>     |     |_DbLimitExpression (ExpressionKind = Limit, ResultType = Collection(Product))
>     |       |_Argument
>     |       | |_DbScanExpression (ExpressionKind = Scan, ResultType = Collection(Product))
>     |       |   |_Target = Products
>     |       |_Limit
>     |         |_DbConstantExpression (ExpressionKind = Constant, ResultType = Edm.Int32)
>     |           |_Value = 1
>     |_Projection
>       |_DbNewInstanceExpression (ExpressionKind = NewInstance, ResultType = Row['Name' = Edm.String])
>         |_Arguments
>           |_DbPropertyExpression (ExpressionKind = Property, ResultType = Edm.String)
>             |_Property = ‘Name’
>             |_Instance
>               |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Product)
>                 |_VariableName = 'Limit1'
> ```

### Compile LINQ query method calls

EF Core first calls Remotion.Linq library to compile LINQ query method call nodes to QueryModel. Under Remotion.Linq.Parsing.Structure.IntermediateModel namespace, Remotion.Linq provides IExpressionNode interface, and many types implementing that interface, where each type can process a certain kind of query method call, for example:

-   MethodCallExpression node representing Queryable.Where call is processed by WhereExpressionNode, and converted to Remotion.Linq.Clauses.WhereClause, which is a part of QueryModel
-   MethodCallExpression node representing Queryable.Select call is processed by SelectExpressionNode, and converted to Remotion.Linq.Clauses.SelectClause, which is a part of QueryModel
-   MethodCallExpression node representing Queryable.First or Queryable.FirstOrDefault call is processed by FirstExpressionNode, and converted to Remotion.Linq.Clauses.ResultOperators.FirstResultOperator, which is a part of QueryModel

etc. Then EF Core continues to compile QueryModel to SelectExpression. For example:

-   WhereClause is converted to predicate child nodes of the SelectExpression
-   SelectClause is converted to projection child nodes of the SelectExpression
-   FirstResultOperator is converted to limit child node of the SelectExpression

etc.

> In EF, the fore mentioned ExpressionConverter is a huge type. It has tons of nested translator types for all supported expression tree nodes. For example
> 
> -   WhereTranslator compiles Queryable.Where node to FilterDbExpression node
> -   SelectTranslator compiles Queryable.Select node to ProjectDbExpression node
> -   FirstTranslator compiles Queryable.First or Queryable.FirstOrDefault to LimitDbExpression node
> 
> etc.

### Compile .NET API calls

The above Where query’s predicate has a logic to call string.Length and compare the result to a constant. EF Core provides translator types under Microsoft.EntityFrameworkCore.Query.ExpressionTranslators.Internal namespace to translate these .NET API calls. Here MemberExpression node representing string.Length call is processed by SqlServerStringLengthTranslator, and converted to a SqlFunctionExpression node representing SQL database function LEN call:

```csharp
namespace Microsoft.EntityFrameworkCore.Query.ExpressionTranslators.Internal
{
    public class SqlServerStringLengthTranslator : IMemberTranslator
    {
        public virtual Expression Translate(MemberExpression memberExpression) => 
            memberExpression.Expression != null
            && memberExpression.Expression.Type == typeof(string)
            && memberExpression.Member.Name == nameof(string.Length)
                ? new SqlFunctionExpression("LEN", memberExpression.Type, new Expression[] { memberExpression.Expression })
                : null;
    }
}
```

There are many other translators to cover other basic .NET APIs of System.String, System.Enum, System.DateTime, System.Guid, System.Math, for example:

-   MethodCallExpression node representing string.Contains call (e.g. product.Name.Contains(“M”)) is processed by SqlServerContainsOptimizedTranslator, and converted to a BinaryExpression node representing SQL database int comparison, where the left child node is a SqlFunctionExpression node representing SQL database function CHARINDEX call, and the right child node is a ConstantExpression node representing 0 (e.g. CHARINDEX(N'M', product.Name) > 0)
-   MethodCallExpression node representing Math.Ceiling call is processed by SqlServerMathCeilingTranslator, and converted to SqlFunctionExpression node representing SQL database function CEILING call
-   MemberExpression node representing DateTime.Now or DateTime.UtcNow property access, is processed by SqlServerDateTimeNowTranslator, and converted to SqlFunctionExpression node representing SQL database function GETDATE or GETUTCDATE call

etc.

There are also a few other APIs covered with other EF Core components. For example, In Remotion.Linq, MethodCallExpression node representing Enumerable.Contains or List<T>.Contains call is converted to to Remotion.Linq.Clauses.ResultOperators.ContainsResultOperator. Then in EF Core, ContainsResultOperator is processed by Microsoft.EntityFrameworkCore.Query.ExpressionVisitors.SqlTranslatingExpressionVisitor. and converted to InExpression node representing SQL database IN operation.

> As fore mentioned, EF provides nested translator types inside ExpressionConverter.There are also many other translators covering .NET APIs of System.String, Microsoft.VisualBasic.Strings, System.Decimal, System.Enum, System.DateTime, System.DateTimeOffset, Microsoft.VisualBasic.DateAndTime, System.Math, System.Guid, System.Nullable<T>, System.Data.Spatial.DbGeography, System.Data.Spatial.DbGeometry, etc.For example,
> 
> -   MethodCallExpression node representing string.Contains call (e.g. product.Name.Contains(“M”)) is processed by StringContainsTranslator, and converted to a DbLikeExpression node representing SQL database LIKE operation (e.g. product.Name LIKE N'%M%').
> -   MethodCallExpression node representing Math.Ceiling call is processed by CanonicalFunctionDefaultTranslator, and converted to DbFunctionExpression node representing SQL database function CEILING call
> -   MemberExpression node representing DateTime.Now or DateTime.UtcNow property access, is processed by SqlServerDateTimeNowTranslator, and converted to DbFunctionExpression node representing SQL database function SYSDATETIME or SYSUTCDATETIME call
> 
> Similar to EF Core, in EF MethodCallExpression node representing Enumerable.Contains or List<T>.Contains call is not processed by translators, but by System.Data.Entity.Core.Objects.ELinq.LinqExpressionNormalizer.

### Remote API call vs. local API call

Apparently EF/Core can only compile the supported .NET API calls, like the above string.Length call. It cannot compile arbitrary API calls. The following example wraps the string.Length call and result comparison with constant into a custom predicate:

```csharp
private static bool FilterName(string name) => name.Length > 10;

internal static void WhereAndSelectWithCustomPredicate(AdventureWorks adventureWorks)
{
    IQueryable<Product> source = adventureWorks.Products;
    IQueryable<string> products = source
        .Where(product => FilterName(product.Name))
        .Select(product => product.Name); // Define query.
    products.WriteLines(); // Execute query.
    // SELECT [product].[Name]
    // FROM [Production].[Product] AS [product]
}
```

At compile time, the predicate expression tree has a MethodCallExpression node representing FilterName call, which apparently cannot be compiled to SQL by EF/Core. In this case, EF Core execute FilterName locally.

> When EF fails to compile query, it throws exception. So in EF, the above example throws NotSupportedException: LINQ to Entities does not recognize the method 'Boolean FilterName(System.String)' method, and this method cannot be translated into a store expression. To make it work, the Where query has to be manually specified as local LINQ to Objects query:
> 
> ```
> internal static void WhereAndSelectWithLocalPredicate(AdventureWorks adventureWorks)
> {
>     IQueryable<Product> source = adventureWorks.Products;
>     IEnumerable<string> products = source
>         .Select(product => product.Name) // LINQ to Entities.
>         .AsEnumerable() // LINQ to Objects.
>         .Where(name => FilterName(name)); // Define query, IEnumerable<string> instead of IQueryable<string>.
>     products.WriteLines(); // Execute query.
> }
> ```

### Compile database function call

EF Core does not support database function call.

> Not all database APIs has .NET built-in APIs to translated from, for example, there is no mapping .NET API for SQL database DATEDIFF function. EF provides mapping methods to address these scenarios. As fore mentioned, EF implements a provider model, and these mapping methods are provides in 2 levels too:
> 
> -   In EntityFramework.dll, System.Data.Entity.DbFunctions provides mapping methods supported by all database providers, like DbFunctions.Reverse to reverse a string, DbFunction.AsUnicode to ensure a string is treated as Unicode, etc. These common database functions are also called [canonical functions](https://msdn.microsoft.com/en-us/library/bb738626.aspx).
> -   In EntityFramework.SqlServer.dll, System.Data.Entity.SqlServer.SqlFunctions provides mapping methods from SQL database functions, like SqlFunctions.Checksum method for CHECKSUM function, SqlFunctions.CurrentUser for CURRENT\_USER function, etc.
> 
> The following LINQ to Entities query calculates the number of days between current time and photo’s last modified time. In the following LINQ to Entities query expression tree, the MethodCallExpression node representing DbFunctions.DiffDays call can be compiled by EF, and is converted to a DbFunctionExpression node representing canonical function Edm.DiffDays call:
> 
> ```sql
> internal static void DbFunction(AdventureWorks adventureWorks)
> {
>     var photos = adventureWorks.ProductPhotos.Select(photo => new
>     {
>         LargePhotoFileName = photo.LargePhotoFileName,
>         UnmodifiedDays = DbFunctions.DiffDays(photo.ModifiedDate, DateTime.UtcNow)
>     });
>     adventureWorks.Compile(photos.Expression).WriteLine();
>     photos.WriteLines();
>     // SELECT 
>     //    1 AS [C1], 
>     //    [Extent1].[LargePhotoFileName] AS [LargePhotoFileName], 
>     //    DATEDIFF (day, [Extent1].[ModifiedDate], SysUtcDateTime()) AS [C2]
>     //    FROM [Production].[ProductPhoto] AS [Extent1]
> }
> ```
> 
> The following example filters the product’s names with a pattern. The SqlFunction.PatIndex call is compiled by EF, and converted to SQL database function SqlServer.PATINDEX call:
> 
> ```sql
> internal static void SqlFunction(AdventureWorks adventureWorks)
> {
>     IQueryable<string> products = adventureWorks.Products
>         .Select(product => product.Name)
>         .Where(name => SqlFunctions.PatIndex(name, "%Touring%50%") > 0); // Define query.
>     products.WriteLines(); // Execute query.
>     // SELECT 
>     //    [Extent1].[Name] AS [Name]
>     //    FROM [Production].[Product] AS [Extent1]
>     //    WHERE ( CAST(PATINDEX([Extent1].[Name], N'%Touring%50%') AS int)) > 0
> }
> ```

## Database expression tree to SQL

### SQL generator and SQL command

The SQL database provider of EF/Core provides a SQL generator to traverse the compiled database query abstract syntactic tree, and generate SQL database specific remote SQL query. EF Core provides SQL generator as Microsoft.EntityFrameworkCore.Query.Sql.IQuerySqlGenerator interface:

```csharp
namespace Microsoft.EntityFrameworkCore.Query.Sql
{
    public interface IQuerySqlGenerator
    {
        IRelationalCommand GenerateSql(IReadOnlyDictionary<string, object> parameterValues);

        // Other members.
    }
}
```

It is implemented by Microsoft.EntityFrameworkCore.Query.Sql.Internal.SqlServerQuerySqlGenerator. SQL generator wraps a database expression tree inside, and provides a GenerateSql method, which returns Microsoft.EntityFrameworkCore.Storage.IRelationalCommand to represents generated SQL:

```csharp
namespace Microsoft.EntityFrameworkCore.Storage
{
    public interface IRelationalCommand
    {
        string CommandText { get; }

        IReadOnlyList<IRelationalParameter> Parameters { get; }

        RelationalDataReader ExecuteReader(
            IRelationalConnection connection, IReadOnlyDictionary<string, object> parameterValues);

        // Other members.
    }
}
```

It is generated by Microsoft.EntityFrameworkCore.Storage.Internal.RelationalCommand in Microsoft.EntityFrameworkCore.Relational package.

> Similarly, EF also provides SQL generator with a GenerateSql method:
> 
> ```csharp
> namespace System.Data.Entity.SqlServer.SqlGen
> {
>     internal class SqlGenerator : DbExpressionVisitor<ISqlFragment>
>     {
>         internal string GenerateSql(DbQueryCommandTree tree, out HashSet<string> paramsToForceNonUnicode);
> 
>         // Other members.
>     }
> }
> ```
> 
> And EF represents the generated SQL with System.Data.Common.DbCommand in ADO.NET:
> 
> ```csharp
> namespace System.Data.Common
> {
>     public abstract class DbCommand : Component, IDbCommand, IDisposable
>     {
>         public abstract string CommandText { get; set; }
> 
>         public DbParameterCollection Parameters { get; }
> 
>         public DbDataReader ExecuteReader();
> 
>         // Other members.
>     }
> }
> ```
> 
> And EF’s SQL database provider uses ADO.NET type System.Data.SqlClient.SqlCommand, which is derived from DbCommand.

### Generate SQL from database expression tree

The following extension method of DbContext can take database command tree, and generate SQL:
```
public static IRelationalCommand Generate(
    this DbContext dbContext, 
    SelectExpression databaseExpression, 
    IReadOnlyDictionary<string, object> parameters = null)
{
    IQuerySqlGeneratorFactory sqlGeneratorFactory = dbContext.GetService<IQuerySqlGeneratorFactory>();
    IQuerySqlGenerator sqlGenerator = sqlGeneratorFactory.CreateDefault(databaseExpression);
    return sqlGenerator.GenerateSql(parameters ?? new Dictionary<string, object>());
}
```

> In EF:
> 
> ```
> public static DbCommand Generate(this DbContext context, DbQueryCommandTree commandTree)
> {
>     MetadataWorkspace metadataWorkspace = ((IObjectContextAdapter)context).ObjectContext.MetadataWorkspace;
>     StoreItemCollection itemCollection = (StoreItemCollection)metadataWorkspace
>         .GetItemCollection(DataSpace.SSpace);
>     DbCommandDefinition commandDefinition = SqlProviderServices.Instance
>         .CreateCommandDefinition(itemCollection.ProviderManifest, commandTree);
>     return commandDefinition.CreateCommand();
> }
> ```
> 
> Inside the last DbCommandDefinition.CreateCommand call, a SqlGenerator instance is constructed with SQL database’s version (detected with ADO.NET API SqlConnection.ServerVersion), and its GenerateSql method is called to generate SQL, then the generated SQL and parameters (provided by DbQueryCommandTree.Parameters) are wrapped into a DbCommand instance.

The above WhereAndSelectDatabaseExpressions and SelectAndFirstDatabaseExpressions method builds database expression trees from scratch. Take them as an example to generate SQL:

```sql
internal static void WhereAndSelectSql(AdventureWorks adventureWorks)
{
    SelectExpression databaseExpression = WhereAndSelectDatabaseExpressions(adventureWorks);
    IRelationalCommand sql = adventureWorks.Generate(databaseExpression: databaseExpression, parameters: null);
    sql.CommandText.WriteLine();
    // SELECT [product].[Name]
    // FROM [Production].[ProductCategory] AS [product]
    // WHERE CAST(LEN([product].[Name]) AS int) > 10
}

internal static void SelectAndFirstSql(AdventureWorks adventureWorks)
{
    SelectExpression databaseExpression = SelectAndFirstDatabaseExpressions(adventureWorks);
    IRelationalCommand sql = adventureWorks.Generate(databaseExpression: databaseExpression, parameters: null);
    sql.CommandText.WriteLine();
    // SELECT TOP(1) [product].[Name]
    // FROM [Production].[Product] AS [product]
}
```

SQL generator traverses the command tree nodes, a specific Visit overloads is called for each supported node type. It generates SELECT clause from DbProjectionExpression node, FROM clause from DbScanExpression node, WHERE clause from DbFilterExpression node, LIKE operator from DbLikeExpression, etc.

> In EF, SQL can be generated in similar way:
> 
> ```sql
> internal static void WhereAndSelectSql(AdventureWorks adventureWorks)
> {
>     DbQueryCommandTree databaseExpressionAndParameters = WhereAndSelectDatabaseExpressions(adventureWorks);
>     DbCommand sql = adventureWorks.Generate(databaseExpressionAndParameters);
>     sql.CommandText.WriteLine();
>     // SELECT 
>     //    [Extent1].[Name] AS [Name]
>     //    FROM [Production].[Product] AS [Extent1]
>     //    WHERE [Extent1].[Name] LIKE N'M%'
> }
>         
> internal static void SelectAndFirstSql(AdventureWorks adventureWorks)
> {
>     DbQueryCommandTree databaseExpressionAndParameters = SelectAndFirstDatabaseExpressions(adventureWorks);
>     DbCommand sql = adventureWorks.Generate(databaseExpressionAndParameters);
>     sql.CommandText.WriteLine();
>     // SELECT TOP (1) 
>     //    [c].[Name] AS [Name]
>     //    FROM [Production].[Product] AS [c]
> }
> ```
> 
> SQL generator generates TOP expression from DbLimitExpression node, which is an example where SQL database’s version matters. Inside the SqlGenerator.Visit overload for DbLimitExpression, TOP 1 is generated for SQL Server 2000 (8.0), and TOP(1) is generated for later version.

So finally LINQ to Entities queries are translated to remote SQL database queries. The next part discusses the query execution and data loading.