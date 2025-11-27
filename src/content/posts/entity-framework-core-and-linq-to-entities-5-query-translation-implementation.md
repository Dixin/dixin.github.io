---
title: "Entity Framework Core and LINQ to Entities in Depth (5) Query Translation Implementation"
published: 2019-10-10
description: "Regarding different database systems can have different query languages or different query APIs, EF Core implement a provider model to work with different kinds of databases. In EF Core, the base libr"
image: ""
tags: [".NET", ".NET Core", "C#", "EF Core", "Entity Framework Core", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core (EF Core) series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework (EF) series](/archive/?tag=Entity%20Framework)\]

Regarding different database systems can have different query languages or different query APIs, EF Core implement a provider model to work with different kinds of databases. In EF Core, the base libraries are the Microsoft.EntityFrameworkCore and Microsoft.EntityFrameworkCore.Relational NuGet packages. Microsoft.EntityFrameworkCore provides the database provider contracts as Microsoft.EntityFrameworkCore.Storage.IDatabaseProviderServices interface. And the SQL database support is implemented by the Microsoft.EntityFrameworkCore,SqlServer NuGet package, which provides Microsoft.EntityFrameworkCore.Storage.Internal.SqlServerDatabaseProviderServices type to implement IDatabaseProviderServices. There are other libraries for different databases, like Microsoft.EntityFrameworkCore.SQLite NuGet package for SQLite, etc.

With this provider model, EF Core breaks the translation into 2 parts. First, IQueryable<T> queries work with expression trees, and EF Core base libraries translate these .NET expression tree to generic, intermediate database expression tree; Then the specific EF Core database provider is responsible to generate query language for the specific database.

### Code to LINQ expression tree

Before translation, .NET expression tree must be built to represent the query logic. As fore mentioned, expression tree enables function as data. In C#, an expression tree shares the same lambda expression syntax as anonymous functions, but is compiled to abstract syntactic tree representing function’s source code. In LINQ, IQueryable<T> utilizes expression tree to represent the abstract syntactic structure of a remote query.

### IQueryable<T> and IQueryProvider

IQueryable<T> has been demonstrated:

namespace System.Linq

```csharp
{
```
```csharp
public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable
```
```csharp
{
```
```csharp
// IEnumerator<T> GetEnumerator(); from IEnumerable<T>.
```

```csharp
// Type ElementType { get; } from IQueryable.
```

```csharp
// Expression Expression { get; } from IQueryable.
```

```csharp
// IQueryProvider Provider { get; } from IQueryable.
```
```csharp
}
```

}

It is a wrapper of iterator factory, an element type, an expression tree representing the current query’s logic, and a query provider of IQueryProvider type:

namespace System.Linq

```csharp
{
```
```csharp
public interface IQueryProvider
```
```csharp
{
```
```csharp
IQueryable CreateQuery(Expression expression);
```

```csharp
IQueryable<TElement> CreateQuery<TElement>(Expression expression);
```

```csharp
object Execute(Expression expression);
```

```csharp
TResult Execute<TResult>(Expression expression);
```
```csharp
}
```

}

IQueryProvider has CreateQuery and Execute methods, all accepting a expression tree parameter. CreateQuery returns an IQueryable<T> query, and Execute returns a query result. These methods are called by the standard queries internally.

### Standard remote queries

Queryable provides 2 kinds of queries, sequence queries returning IQueryable<T> query, and value queries returning a query result. Take Where, Select, and First as examples, the following are their implementations:

namespace System.Linq

```csharp
{
```
```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static IQueryable<TSource> Where<TSource>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
```
```csharp
{
```
```csharp
Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, IQueryable<TSource>> currentMethod = Where;
```
```csharp
MethodCallExpression whereCallExpression = Expression.Call(
```
```csharp
method: currentMethod.Method,
```
```csharp
arg0: source.Expression,
```
```csharp
arg1: Expression.Quote(predicate));
```
```csharp
return source.Provider.CreateQuery<TSource>(whereCallExpression);
```
```csharp
}
```

```csharp
public static IQueryable<TResult> Select<TSource, TResult>(
```
```csharp
this IQueryable<TSource>source, Expression<Func<TSource, TResult>> selector)
```
```csharp
{
```
```csharp
Func<IQueryable<TSource>, Expression<Func<TSource, TResult>>, IQueryable<TResult>> currentMethod =
```
```csharp
Select;
```
```csharp
MethodCallExpression selectCallExpression = Expression.Call(
```
```csharp
method: currentMethod.Method,
```
```csharp
arg0: source.Expression,
```
```csharp
arg1: Expression.Quote(selector));
```
```csharp
return source.Provider.CreateQuery<TResult>(selectCallExpression);
```
```csharp
}
```

```csharp
public static TSource First<TSource>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
```
```csharp
{
```
```csharp
Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, TSource>currentMethod = First;
```
```csharp
MethodCallExpression firstCallExpression = Expression.Call(
```
```csharp
method: currentMethod.Method,
```
```csharp
arg0: source.Expression,
```
```csharp
arg1: Expression.Quote(predicate));
```
```csharp
return source.Provider.Execute<TSource>(firstCallExpression);
```
```csharp
}
```

```csharp
public static TSource First<TSource>(this IQueryable<TSource>source)
```
```csharp
{
```
```csharp
Func<IQueryable<TSource>, TSource>currentMethod = First;
```
```csharp
MethodCallExpression firstCallExpression = Expression.Call(
```
```csharp
method: currentMethod.Method,
```
```csharp
arg0: source.Expression);
```
```csharp
return source.Provider.Execute<TSource>(firstCallExpression);
```
```csharp
}
```

```csharp
// Other members.
```
```csharp
}
```

}

They just build a MethodCallExpression expression, representing the current query is called. Then they obtain query provider from source’s Provider property. The sequence queries call query provider’s CreateQuery method to return IQueryable<T> query, and the value queries call query provider’s Execute method to return a query result. All standard queries are implemented in this pattern except AsQueryable.

### Build LINQ to Entities abstract syntax tree

With above Where and Select queries, a simple LINQ to Entities query can be implemented to return an IQueryable<T> of values:

internal static void WhereAndSelect(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
// IQueryable<string> products = adventureWorks.Products
```
```csharp
// .Where(product => product.Name.Length> 10)
```
```csharp
// .Select(product => product.Name);
```
```csharp
IQueryable<Product> sourceQueryable = adventureWorks.Products;
```
```csharp
IQueryable<Product> whereQueryable = sourceQueryable.Where(product => product.Name.Length > 10);
```
```csharp
IQueryable<string> selectQueryable = whereQueryable.Select(product => product.Name); // Define query.
```
```csharp
foreach (string result in selectQueryable) // Execute query.
```
```csharp
{
```
```csharp
result.WriteLine();
```
```csharp
}
```

}

The above example filters the products with Name longer than 10 characters, and queries the products’ Names. By desugaring the lambda expressions, and unwrapping the standard queries, the above LINQ to Entities query is equivalent to:

internal static void WhereAndSelectLinqExpressions(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<Product>sourceQueryable = adventureWorks.Products; // DbSet<Product>.
```
```csharp
ConstantExpression sourceConstantExpression = (ConstantExpression)sourceQueryable.Expression;
```
```csharp
IQueryProvider sourceQueryProvider = sourceQueryable.Provider; // EntityQueryProvider.
```

```csharp
// Expression<Func<Product, bool>> predicateExpression = product => product.Name.Length > 10;
```
```csharp
ParameterExpression productParameterExpression = Expression.Parameter(typeof(Product), "product");
```
```csharp
Expression<Func<Product, bool>>predicateExpression = Expression.Lambda<Func<Product, bool>>(
```
```csharp
body: Expression.GreaterThan(
```
```csharp
left: Expression.Property(
```
```csharp
expression: Expression.Property(
```
```csharp
expression: productParameterExpression, propertyName: nameof(Product.Name)),
```
```csharp
propertyName: nameof(string.Length)),
```
```csharp
right: Expression.Constant(10)),
```
```csharp
parameters: productParameterExpression);
```

```csharp
// IQueryable<Product> whereQueryable = sourceQueryable.Where(predicateExpression);
```
```csharp
Func<IQueryable<Product>, Expression<Func<Product, bool>>, IQueryable<Product>>whereMethod = Queryable.Where;
```
```csharp
MethodCallExpression whereCallExpression = Expression.Call(
```
```csharp
method: whereMethod.Method,
```
```csharp
arg0: sourceConstantExpression,
```
```csharp
arg1: Expression.Quote(predicateExpression));
```
```csharp
IQueryable<Product>whereQueryable = sourceQueryProvider
```
```csharp
.CreateQuery<Product>(whereCallExpression); // EntityQueryable<Product>.
```
```csharp
IQueryProvider whereQueryProvider = whereQueryable.Provider; // EntityQueryProvider.
```

```csharp
// Expression<Func<Product, string>> selectorExpression = product => product.Name;
```
```csharp
Expression<Func<Product, string>> selectorExpression = Expression.Lambda<Func<Product, string>>(
```
```csharp
body: Expression.Property(productParameterExpression, nameof(Product.Name)),
```
```csharp
parameters: productParameterExpression);
```

```csharp
// IQueryable<string> selectQueryable = whereQueryable.Select(selectorExpression);
```
```csharp
Func<IQueryable<Product>, Expression<Func<Product, string>>, IQueryable<string>>selectMethod = Queryable.Select;
```
```csharp
MethodCallExpression selectCallExpression = Expression.Call(
```
```csharp
method: selectMethod.Method,
```
```csharp
arg0: whereCallExpression,
```
```csharp
arg1: Expression.Quote(selectorExpression));
```
```csharp
IQueryable<string>selectQueryable = whereQueryProvider
```
```csharp
.CreateQuery<string>(selectCallExpression); // EntityQueryable<Product>.
```

```csharp
using (IEnumerator<string>iterator = selectQueryable.GetEnumerator()) // Execute query.
```
```csharp
{
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
iterator.Current.WriteLine();
```
```csharp
}
```
```csharp
}
```

}

Here are the steps how the fluent query builds its query expression tree:

· Build data source:

o The initial source IQueryable<T> is a DbSet<T> instance given by EF Core. It wraps an expression and a query provider:

§ The expression is a ConstantExpression expression representing the data source.

§ The query provider is an EntityQueryProvider instance automatically created by EF Core.

· Build Where query:

o A predicate expression is built for Where,

o Where accepts the IQueryable<T> source. But actually Where only needs the source’s expression and query provider. A MethodCallExpression expression is built to represent a call of Where itself with 2 arguments, the source and the predicate expression. Then source query provider’s CreateQuery method is called with the MethodCallExpression expression just built, and return an IQueryable<T> query, which wraps:

§ The MethodCallExpression expression representing current Where call

§ The same query privider from its source.

· Build Select query:

o A selector expression is built for Select

o Select accepts the IQueryable<T> returned by Where as source. Again, Select only needs the expression and query provider from source. A MethodCallExpression expression is built to represent a call to Select itself with 2 arguments, the source and the selector expression. Then source query provider’s CreateQuery method is called with the MethodCallExpression expression just built, and return an IQueryable<T> query, which wraps:

§ The MethodCallExpression expression representing current Select call

§ The same query privider from its source.

So, the final IQueryable<T> query’s Expression property is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:

MethodCallExpression (NodeType = Call, Type = IQueryable<string>)

```csharp
|_Method = Queryable.Select<Product, string>
```
```csharp
|_Object = null
```
```csharp
|_Arguments
```
```csharp
|_MethodCallExpression (NodeType = Call, Type = IQueryable<Product>)
```
```csharp
| |_Method = Queryable.Where<Product>
```
```csharp
| |_Object = null
```
```csharp
| |_Arguments
```
```csharp
| |_ConstantExpression (NodeType = Constant, Type = IQueryable<Product>)
```
```csharp
| | |_Value = new EntityQueryable<Product>(adventureWorks.GetService<IAsyncQueryProvider>())
```
```csharp
| |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, bool>>)
```
```csharp
| |_Operand
```
```csharp
| |_Expression<Func<Product, bool>> (NodeType = Lambda, Type = Func<Product, bool>)
```
```csharp
| |_Parameters
```
```csharp
| | |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```csharp
| | |_Name = "product"
```
```csharp
| |_Body
```
```csharp
| |_BinaryExpression (NodeType = GreaterThan, Type = bool)
```
```csharp
| |_Left
```
```csharp
| | |_MemberExpression (NodeType = MemberAccess, Type = int)
```
```csharp
| | |_Member = "Length"
```
```csharp
| | |_Expression
```
```csharp
| | |_MemberExpression (NodeType = MemberAccess, Type = string)
```
```csharp
| | |_Member = "Name"
```
```csharp
| | |_Expression
```
```csharp
| | |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```csharp
| | |_Name = "product"
```
```csharp
| |_Right
```
```csharp
| |_ConstantExpression (NodeType = Constant, Type = int)
```
```csharp
| |_Value = 10
```
```csharp
|_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
```
```csharp
|_Operand
```
```csharp
|_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
```
```csharp
|_Parameters
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```csharp
| |_Name = "product"
```
```csharp
|_Body
```
```csharp
|_MemberExpression (NodeType = MemberAccess, Type = string)
```
```csharp
|_Member = "Name"
```
```csharp
|_Expression
```
```csharp
|_ParameterExpression (NodeType = Parameter, Type = Product)
```

|\_Name = "product"

This also demonstrates that lambda expression, extension methods, and LINQ query expression are powerful language features of C#. The above a rich abstract syntactic tree can be built by C# code as simple as:

internal static void WhereAndSelectQuery(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<string>products = adventureWorks.Products
```
```csharp
.Where(product => product.Name.Length > 10)
```
```csharp
.Select(product => product.Name);
```
```csharp
// Equivalent to:
```
```csharp
// IQueryable<string> products =
```
```csharp
// from product in adventureWorks.Products
```
```csharp
// where product.Name.Length > 10
```
```csharp
// select product.Name;
```

}

The other kind of query returning a single value works in the similar way. Take above First as example:

internal static void SelectAndFirst(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
// string first = adventureWorks.Products.Select(product => product.Name).First();
```
```csharp
IQueryable<Product> sourceQueryable = adventureWorks.Products;
```
```csharp
IQueryable<string>selectQueryable = sourceQueryable.Select(product => product.Name);
```
```csharp
string first = selectQueryable.First().WriteLine(); // Execute query.
```

}

Here the initial source and and Select query are the same as the previous example. So this time, just unwrap the First query. The above First query is equivalent to:

internal static void SelectAndFirstLinqExpressions(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<Product>sourceQueryable = adventureWorks.Products;
```

```csharp
IQueryable<string>selectQueryable = sourceQueryable.Select(product => product.Name);
```
```csharp
MethodCallExpression selectCallExpression = (MethodCallExpression)selectQueryable.Expression;
```
```csharp
IQueryProvider selectQueryProvider = selectQueryable.Provider; // DbQueryProvider.
```

```csharp
// string first = selectQueryable.First();
```
```csharp
Func<IQueryable<string>, string> firstMethod = Queryable.First;
```
```csharp
MethodCallExpression firstCallExpression = Expression.Call(
```
```csharp
method: firstMethod.Method, arg0: selectCallExpression);
```

```csharp
string first = selectQueryProvider.Execute<string>(firstCallExpression).WriteLine(); // Execute query.
```

}

In First query, the MethodCallExpression expression is built to represent current First call. The difference is, then query provider’s Execute method is called instead of CreateQuery, so that a query result is returned instead of a query.

Similarly, the last expression tree built inside First, is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:

MethodCallExpression (NodeType = Call, Type = string)

```csharp
|_Method = Queryable.First<string>
```
```csharp
|_Object = null
```
```csharp
|_Arguments
```
```csharp
|_MethodCallExpression (NodeType = Call, Type = IQueryable<string>)
```
```csharp
|_Method = Queryable.Select<Product, string>
```
```csharp
|_Object = null
```
```csharp
|_Arguments
```
```csharp
|_ConstantExpression (NodeType = Constant, Type = IQueryable<Product>)
```
```csharp
| |_Value = new EntityQueryable<Product>(adventureWorks.GetService<IAsyncQueryProvider>())
```
```csharp
|_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
```
```csharp
|_Operand
```
```csharp
|_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
```
```csharp
|_Parameters
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```csharp
| |_Name = "product"
```
```csharp
|_Body
```
```csharp
|_MemberExpression (NodeType = MemberAccess, Type = string)
```
```csharp
|_Member = "Name"
```
```csharp
|_Expression
```
```csharp
|_ParameterExpression (NodeType = Parameter, Type = Product)
```

|\_Name = "product"

And again, the entire abstract syntactic tree can be built by C# code as simple as:

internal static void SelectAndFirstQuery(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
string first = adventureWorks.Products.Select(product => product.Name).First();
```
```csharp
// Equivalent to:
```
```csharp
// string first = (from product in adventureWorks.Products select product.Name).First();
```

}

### .NET expression tree to database expression tree

When LINQ to Entities queries are executed by either pulling values from IQueryable<T>, or calling IQueryProvider.Execute, EF Core compiles .NET expression tree to database expression tree.

### Database query abstract syntax tree

The logic of LINQ to Entities can be represented by .NET expression tree, and EF Core also use expression tree to represent the database query logic. For example, EF Core base libraries provides the Microsoft.EntityFrameworkCore.Query.Expressions.SelectExpression type to represent a database SELECT query:

namespace Microsoft.EntityFrameworkCore.Query.Expressions

```csharp
{
```
```csharp
public class SelectExpression : TableExpressionBase
```
```csharp
{
```
```csharp
public virtual IReadOnlyList<Expression> Projection { get; } // SELECT.
```

```csharp
public virtual bool IsDistinct { get; set; } // DISTINCT.
```

```csharp
public virtual Expression Limit { get; set; } // TOP.
```

```csharp
public virtual IReadOnlyList<TableExpressionBase> Tables { get; } // FROM.
```

```csharp
public virtual Expression Predicate { get; set; } // WHERE.
```

```csharp
public virtual IReadOnlyList<Ordering> OrderBy { get; } // ORDER BY.
```

```csharp
public virtual Expression Offset { get; set; } // OFFSET.
```

```csharp
public override Type Type { get; }
```

```csharp
// Other members.
```
```csharp
}
```

}

The following are are all the database expressions provided by EF Core and the Remotion.Linq library used by EF Core, which are all derived from the Expression type:

· AggregateExpression

o MaxExpression

o MinExpression

o SumExpression

· AliasExpression

· ColumnExpression

· CountExpression

· DatePartExpression

· DiscriminatorPredicateExpression

· ExistsExpression

· ExplicitCastExpression

· InExpression

· IsNullExpression

· LikeExpression

· NotNullableExpression

· NullConditionalExpression

· PartialEvaluationExceptionExpression

· PropertyParameterExpression

· QuerySourceReferenceExpression

· RowNumberExpression

· SqlFunctionExpression

· StringCompareExpression

· SubQueryExpression

· TableExpressionBase

o CrossJoinExpression

o FromSqlExpression

o JoinExpressionBase

§ InnerJoinExpression

§ LeftOuterJoinExpression

o LateralJoinExpression

o SelectExpression

o TableExpression

· VBStringComparisonExpression

### Compile LINQ expressions to database expressions

EF Core calls the third party library Remotion.Linq to compile LINQ expression tree to a query model, then EF Core compiles the query model to database expression tree, which is a SelectExpression instance. The following Compile function demonstrates how the compilation can be done. It accepts a LINQ expression tree, and returns a tuple of SelectExpression, and its parameters if any:

public static (SelectExpression, IReadOnlyDictionary<string, object>) Compile(this DbContext dbContext, Expression linqExpression)

```csharp
{
```
```csharp
QueryContext queryContext = dbContext
```
```csharp
.GetService<IQueryContextFactory>()
```
```csharp
.Create();
```
```csharp
QueryCompilationContext compilationContext = dbContext
```
```csharp
.GetService<IQueryCompilationContextFactory>()
```
```csharp
.Create(async: false);
```
```csharp
QueryCompiler queryCompiler = (QueryCompiler)dbContext.GetService<IQueryCompiler>();
```
```csharp
linqExpression = queryCompiler.ExtractParameters(
```
```csharp
linqExpression,
```
```csharp
queryContext,
```
```csharp
dbContext.GetService<IDiagnosticsLogger<DbLoggerCategory.Query>>());
```
```csharp
linqExpression = dbContext
```
```csharp
.GetService<IQueryTranslationPreprocessorFactory>()
```
```csharp
.Create(compilationContext)
```
```csharp
.Process(linqExpression);
```
```csharp
ShapedQueryExpression queryExpression = (ShapedQueryExpression)dbContext
```
```csharp
.GetService<IQueryableMethodTranslatingExpressionVisitorFactory>()
```
```csharp
.Create(dbContext.Model)
```
```csharp
.Visit(linqExpression);
```
```csharp
queryExpression = (ShapedQueryExpression)dbContext
```
```csharp
.GetService<IQueryTranslationPostprocessorFactory>()
```
```csharp
.Create(compilationContext)
```
```csharp
.Process(queryExpression);
```
```csharp
return ((SelectExpression)queryExpression.QueryExpression, queryContext.ParameterValues);
```

}

So above Where and Select query’s expression tree can be compiled as:

internal static void CompileWhereAndSelectExpressions(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
Expression linqExpression =adventureWorks.Products
```
```csharp
.Where(product => product.Name.Length > 10)
```
```csharp
.Select(product => product.Name).Expression;
```
```csharp
(SelectExpression DatabaseExpression, IReadOnlyDictionary<string, object> Parameters) compilation =
```
```csharp
adventureWorks.Compile(linqExpression);
```
```csharp
compilation.DatabaseExpression.WriteLine();
```
```csharp
compilation.Parameters.WriteLines(parameter => $"{parameter.Key}: {parameter.Value}");
```

}

The compiled SelectExpression is the same as the following SelectExpression built on the fly:

internal static SelectExpression WhereAndSelectDatabaseExpressions(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryableMethodTranslatingExpressionVisitorFactory expressionVisitorFactory = adventureWorks
```
```csharp
.GetService<IQueryableMethodTranslatingExpressionVisitorFactory>();
```
```csharp
ISqlExpressionFactory expressionFactory = adventureWorks.GetService<ISqlExpressionFactory>();
```
```csharp
IEntityType entityType = adventureWorks.Model.FindEntityType(typeof(Product));
```
```csharp
SelectExpression databaseExpression = expressionFactory.Select(entityType);
```
```csharp
EntityProjectionExpression projectionExpression = (EntityProjectionExpression)databaseExpression.GetMappedProjection(new ProjectionMember());
```
```csharp
ColumnExpression columnExpression = projectionExpression.BindProperty(entityType.FindProperty(nameof(Product.Name)));
```
```csharp
databaseExpression.ApplyPredicate(expressionFactory.MakeBinary(
```
```csharp
ExpressionType.GreaterThan,
```
```csharp
expressionFactory.Convert(
```
```csharp
expressionFactory.Function("LEN", new SqlExpression[] { columnExpression }, typeof(long)),
```
```csharp
typeof(int)),
```
```csharp
new SqlConstantExpression(Expression.Constant(10), null),
```
```csharp
null));
```
```csharp
databaseExpression.AddToProjection(columnExpression);
```
```csharp
return databaseExpression.WriteLine();
```

}

This abstract syntactic tree can be visualized as:

SelectExpression (NodeType = Extension, Type = string)

```csharp
|_Porjection
```
```csharp
| |_ColumnExpression (NodeType = Extension, Type = string)
```
```csharp
| |_Name = "Name"
```
```csharp
| |_Property = Product.Name
```
```csharp
| |_Table
```
```csharp
| |_TableExpression (NodeType = Extension, Type = object)
```
```csharp
| |_Schema = "Production"
```
```csharp
| |_Name = "Product"
```
```csharp
| |_Alias = "product"
```
```csharp
|_Tables
```
```csharp
| |_TableExpression (NodeType = Extension, Type = object)
```
```csharp
| |_Schema = "Production"
```
```csharp
| |_Name = "Product"
```
```csharp
| |_Alias = "product"
```
```csharp
|_Predicate
```
```csharp
|_BinaryExpression (NodeType = GreaterThan, Type = bool)
```
```csharp
|_left
```
```csharp
| |_ExplicitCastExpression (NodeType = Extension, Type = int)
```
```csharp
| |_Operand
```
```csharp
| |_SqlFunctionExpression (NodeType = Extension, Type = int)
```
```csharp
| |_FunctionName = "LEN"
```
```csharp
| |_Arguments
```
```csharp
| |_ColumnExpression (NodeType = Extension, Type = string)
```
```csharp
| |_Name = "Name"
```
```csharp
| |_Property = Product.Name
```
```csharp
| |_Table
```
```csharp
| |_TableExpression (NodeType = Extension, Type = object)
```
```csharp
| |_Schema = "Production"
```
```csharp
| |_Name = "Product"
```
```csharp
| |_Alias = "product"
```
```csharp
|_Right
```
```csharp
|_ConstantExpression (NodeType = Constant, Type = int)
```

|\_Value = 1

Similarly, the other Select and First query’s expression tree is compiled to abstract syntax tree the same as the following:

internal static SelectExpression SelectAndFirstDatabaseExpressions(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryableMethodTranslatingExpressionVisitorFactory expressionVisitorFactory = adventureWorks
```
```csharp
.GetService<IQueryableMethodTranslatingExpressionVisitorFactory>();
```
```csharp
ISqlExpressionFactory expressionFactory = adventureWorks.GetService<ISqlExpressionFactory>();
```
```csharp
IEntityType entityType = adventureWorks.Model.FindEntityType(typeof(Product));
```
```csharp
SelectExpression databaseExpression = expressionFactory.Select(entityType);
```
```csharp
EntityProjectionExpression projectionExpression = (EntityProjectionExpression)databaseExpression.GetMappedProjection(new ProjectionMember());
```
```csharp
ColumnExpression columnExpression = projectionExpression.BindProperty(entityType.FindProperty(nameof(Product.Name)));
```
```csharp
databaseExpression.AddToProjection(columnExpression);
```
```csharp
databaseExpression.ApplyLimit(expressionFactory.ApplyDefaultTypeMapping(new SqlConstantExpression(Expression.Constant(1), null)));
```
```csharp
return databaseExpression.WriteLine();
```

}

And this abstract syntactic tree can be visualized as:

SelectExpression (NodeType = Extension, Type = string)

```csharp
|_Limit
```
```csharp
| |_ConstantExpression (NodeType = Constant, Type = int)
```
```csharp
| |_Value = 1
```
```csharp
|_Porjection
```
```csharp
| |_ColumnExpression (NodeType = Extension, Type = string)
```
```csharp
| |_Name = "Name"
```
```csharp
| |_Property = Product.Name
```
```csharp
| |_Table
```
```csharp
| |_TableExpression (NodeType = Extension, Type = object)
```
```csharp
| |_Schema = "Production"
```
```csharp
| |_Name = "Product"
```
```csharp
| |_Alias = "product"
```
```csharp
|_Tables
```
```csharp
|_TableExpression (NodeType = Extension, Type = object)
```
```csharp
|_Schema = "Production"
```
```csharp
|_Name = "Product"
```

|\_Alias = "product"

### Compile LINQ queries

EF Core first calls Remotion.Linq library to compile LINQ query function call nodes to QueryModel. Under Remotion.Linq.Parsing.Structure.IntermediateModel namespace, Remotion.Linq provides IExpressionNode interface, and many types implementing that interface, where each type can process a certain kind of query function call, for example:

· MethodCallExpression node representing Queryable.Where call is processed by WhereExpressionNode, and converted to Remotion.Linq.Clauses.WhereClause, which is a part of QueryModel

· MethodCallExpression node representing Queryable.Select call is processed by SelectExpressionNode, and converted to Remotion.Linq.Clauses.SelectClause, which is a part of QueryModel

· MethodCallExpression node representing Queryable.First or Queryable.FirstOrDefault call is processed by FirstExpressionNode, and converted to Remotion.Linq.Clauses.ResultOperators.FirstResultOperator, which is a part of QueryModel

etc. Then EF Core continues to compile QueryModel to SelectExpression. For example:

· WhereClause is converted to predicate child nodes of the SelectExpression

· SelectClause is converted to projection child nodes of the SelectExpression

· FirstResultOperator is converted to limit child node of the SelectExpression

etc.

### Compile .NET API calls

The above Where query’s predicate has a logic to call string.Length and compare the result to a constant. EF Core provides translator types under Microsoft.EntityFrameworkCore.Query.ExpressionTranslators.Internal namespace to translate these .NET API calls. Here MemberExpression node representing string.Length call is processed by SqlServerStringLengthTranslator, and converted to a SqlFunctionExpression node representing SQL database function LEN call:

namespace Microsoft.EntityFrameworkCore.Query.ExpressionTranslators.Internal

```csharp
{
```
```csharp
public class SqlServerStringLengthTranslator : IMemberTranslator
```
```csharp
{
```
```csharp
public virtual Expression Translate(MemberExpression memberExpression) =>
```
```csharp
memberExpression.Expression != null
```
```csharp
&&memberExpression.Expression.Type == typeof(string)
```
```csharp
&& memberExpression.Member.Name == nameof(string.Length)
```
```csharp
? new SqlFunctionExpression("LEN", memberExpression.Type, new Expression[] { memberExpression.Expression })
```
```csharp
: null;
```
```csharp
}
```

}

There are many other translators to cover other basic .NET APIs of System.String, System.Enum, System.DateTime, System.Guid, System.Math, for example:

· MethodCallExpression node representing string.Contains call (e.g. product.Name.Contains(“M”)) is processed by SqlServerContainsOptimizedTranslator, and converted to a BinaryExpression node representing SQL database int comparison, where the left child node is a SqlFunctionExpression node representing SQL database function CHARINDEX call, and the right child node is a ConstantExpression node representing 0 (e.g. CHARINDEX(N'M', product.Name) > 0)

· MethodCallExpression node representing Math.Ceiling call is processed by SqlServerMathCeilingTranslator, and converted to SqlFunctionExpression node representing SQL database function CEILING call

· MemberExpression node representing DateTime.Now or DateTime.UtcNow property access, is processed by SqlServerDateTimeNowTranslator, and converted to SqlFunctionExpression node representing SQL database function GETDATE or GETUTCDATE call

· The extension methods for EF.Functions are also translated to SQL database function calls or operators. For example, EF.Functions.Like is processed by LikeTranslator, and converted to LikeExpression node representing LIKE operator.

etc.

There are also a few other APIs covered with other EF Core components. For example, In Remotion.Linq, MethodCallExpression node representing Enumerable.Contains or List<T>.Contains call is converted to to Remotion.Linq.Clauses.ResultOperators.ContainsResultOperator. Then in EF Core, ContainsResultOperator is processed by Microsoft.EntityFrameworkCore.Query.ExpressionVisitors.SqlTranslatingExpressionVisitor. and converted to InExpression node representing SQL database IN operation.

### Remote API call vs. local API call

Apparently EF Core can only compile the supported .NET API calls, like the above string.Length call. It cannot compile arbitrary API calls. The following example wraps the string.Length call and result comparison with constant into a custom predicate:

private static bool FilterName(string name) => name.Length > 10;

```csharp
internal static void WhereAndSelectWithCustomPredicate(AdventureWorks adventureWorks)
```
```csharp
{
```
```csharp
IQueryable<Product>source = adventureWorks.Products;
```
```csharp
IQueryable<string>products = source
```
```csharp
.Where(product => FilterName(product.Name))
```
```csharp
.Select(product => product.Name); // Define query.
```
```csharp
products.WriteLines(); // Execute query.
```
```sql
// SELECT [product].[Name]
```
```sql
// FROM [Production].[Product] AS [product]
```

}

At compile time, the predicate expression tree has a MethodCallExpression node representing FilterName call, which apparently cannot be compiled to SQL by EF Core. In this case, EF Core execute FilterName locally.

### Compile database functions and operators

Some database APIs cannot be translated from .NET Standard APIs. For example, there is no mapping .NET API for SQL database LIKE operator, DATEDIFF function, etc. EF Core defines mapping functions to address these scenarios. These functions can be used through Microsoft.EntityFrameworkCore.EF type’s Functions property:

namespace Microsoft.EntityFrameworkCore

```csharp
{
```
```csharp
public static class EF
```
```csharp
{
```
```csharp
public static DbFunctions Functions { get; }
```

```csharp
// Other members.
```
```csharp
}
```

}

Extension methods are defined for the DbFunctions output type to represent database functions and operators. As fore mentioned, EF Core implements a provider model, so these mapping functions are provides in 2 levels. The EF Core base library provides mapping functions which should be supported by all database providers, like the LIKE operator:

namespace Microsoft.EntityFrameworkCore

```csharp
{
```
```csharp
public static class DbFunctionsExtensions
```
```csharp
{
```
```csharp
public static bool Like(this DbFunctions _, string matchExpression, string pattern);
```

```csharp
// Other members.
```
```csharp
}
```

}

These are also called canonical functions. The mapping funcions for specific database is provided by the database provider library. For example, Microsoft.EntityFrameworkCore.SqlServer.dll library provides DateDiffDay extension method to represent SQL database’s DATEDIFF function for day, and provides Contains extension method to represent SQL database’s CONTAINS function, etc.

namespace Microsoft.EntityFrameworkCore

```csharp
{
```
```csharp
public static class SqlServerDbFunctionsExtensions
```
```csharp
{
```
```csharp
public static bool Contains(this DbFunctions _, string propertyReference, string searchCondition);
```

```csharp
public static int DateDiffDay(this DbFunctions _, DateTime startDate, DateTime endDate);
```

```csharp
// Other members.
```
```csharp
}
```

}

The following example filters the product’s names with a pattern. In the following LINQ to Entities query expression tree, the MethodCallExpression node representing Like call is compiled to a LikeExpression node representing the LIKE operator:

internal static void DatabaseOperator(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<string>products = adventureWorks.Products
```
```csharp
.Select(product => product.Name)
```
```csharp
.Where(name => EF.Functions.Like(name, "%Touring%50%")); // Define query.
```
```csharp
products.WriteLines(); // Execute query.
```
```sql
// SELECT [product].[Name]
```
```sql
// FROM [Production].[Product] AS [product]
```
```sql
// WHERE [product].[Name] LIKE N'%Touring%50%'
```

}

The following LINQ to Entities query calculates the number of days between current time and photo’s last modified time. In the following LINQ to Entities query expression tree, the MethodCallExpression node representing DateDiffDay call can be compiled to a SqlFunctionExpression node representing DATEDIFF call:

internal static void DatabaseFunction(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
var photos = adventureWorks.ProductPhotos.Select(photo => new
```
```csharp
{
```
```csharp
LargePhotoFileName = photo.LargePhotoFileName,
```
```csharp
UnmodifiedDays = EF.Functions.DateDiffDay(photo.ModifiedDate, DateTime.UtcNow)
```
```csharp
}); // Define query.
```
```csharp
photos.WriteLines(); // Execute query.
```
```sql
// SELECT [photo].[LargePhotoFileName], DATEDIFF(DAY, [photo].[ModifiedDate], GETUTCDATE()) AS [UnmodifiedDays]
```
```sql
// FROM [Production].[ProductPhoto] AS [photo]
```

}

### Database expression tree to database query

With database expression tree, EF can traverse and compile it to SQL query.

### SQL generator and SQL command

The SQL database provider of EF Core provides a SQL generator to traverse the compiled database query abstract syntactic tree, and generate SQL database specific remote SQL query. EF Core defines SQL generator as Microsoft.EntityFrameworkCore.Query.Sql.IQuerySqlGenerator interface:

namespace Microsoft.EntityFrameworkCore.Query.Sql

```csharp
{
```
```csharp
public interface IQuerySqlGenerator
```
```csharp
{
```
```csharp
IRelationalCommand GenerateSql(
```
```csharp
IReadOnlyDictionary<string, object>parameterValues);
```

```csharp
// Other members.
```
```csharp
}
```

}

It is implemented by Microsoft.EntityFrameworkCore.Query.Sql.Internal.SqlServerQuerySqlGenerator. SQL generator wraps a database expression tree inside, and provides a GenerateSql method, which returns Microsoft.EntityFrameworkCore.Storage.IRelationalCommand to represents generated SQL:

namespace Microsoft.EntityFrameworkCore.Storage

```csharp
{
```
```csharp
public interface IRelationalCommand
```
```csharp
{
```
```csharp
string CommandText { get; }
```

```csharp
IReadOnlyList<IRelationalParameter> Parameters { get; }
```

```csharp
RelationalDataReader ExecuteReader(
```
```csharp
IRelationalConnection connection,
```
```csharp
IReadOnlyDictionary<string, object>parameterValues);
```

```csharp
// Other members.
```
```csharp
}
```

}

It is implemented by Microsoft.EntityFrameworkCore.Storage.Internal.RelationalCommand in Microsoft.EntityFrameworkCore.Relational package.

### Generate SQL from database expression tree

The following extension method of DbContext can be defined to accepot a database command tree, and generate SQL:

public static IRelationalCommand Generate(this DbContext dbContext, SelectExpression databaseExpression)

```csharp
{
```
```csharp
IQuerySqlGeneratorFactory sqlGeneratorFactory = dbContext.GetService<IQuerySqlGeneratorFactory>();
```
```csharp
QuerySqlGenerator sqlGenerator = sqlGeneratorFactory.Create();
```
```csharp
return sqlGenerator.GetCommand(databaseExpression);
```

}

The above WhereAndSelectDatabaseExpressions and SelectAndFirstDatabaseExpressions functions build database expression trees from scratch. Take them as an example to generate SQL:

internal static void WhereAndSelectSql(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
SelectExpression databaseExpression = WhereAndSelectDatabaseExpressions(
```
```csharp
adventureWorks);
```
```csharp
IRelationalCommand sql = adventureWorks.Generate(
```
```csharp
databaseExpression: databaseExpression, parameters: null);
```
```csharp
sql.CommandText.WriteLine();
```
```sql
// SELECT [product].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [product]
```
```sql
// WHERE CAST(LEN([product].[Name]) AS int)> 10
```
```csharp
}
```

```csharp
internal static void SelectAndFirstSql(AdventureWorks adventureWorks)
```
```csharp
{
```
```csharp
SelectExpression databaseExpression = SelectAndFirstDatabaseExpressions(adventureWorks);
```
```csharp
IRelationalCommand sql = adventureWorks.Generate(databaseExpression: databaseExpression, parameters: null);
```
```csharp
sql.CommandText.WriteLine();
```
```sql
// SELECT TOP(1) [product].[Name]
```
```sql
// FROM [Production].[Product] AS [product]
```

}

SQL generator traverses the command tree nodes, a specific Visit overloads is called for each supported node type. It generates SELECT clause from DbProjectionExpression node, FROM clause from DbScanExpression node, WHERE clause from DbFilterExpression node, LIKE operator from DbLikeExpression, etc.

So finally LINQ to Entities queries are translated to remote SQL database queries. The next part discusses the query execution and data loading.