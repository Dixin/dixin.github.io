---
title: "Entity Framework Core and LINQ to Entities in Depth (5) Query Translation Implementation"
published: 2019-10-10
description: "Regarding different database systems can have different query languages or different query APIs, EF Core implement a provider model to work with different kinds of databases. In EF Core, the base libr"
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework Core", "LINQ to Entities", "SQL Server", "SQL", "EF Core", ".NET Core"]
category: "C#"
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
```
{
```
```
public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable
```
```
{
```
```
// IEnumerator<T> GetEnumerator(); from IEnumerable<T>.
```
```
// Type ElementType { get; } from IQueryable.
```
```
// Expression Expression { get; } from IQueryable.
```
```
// IQueryProvider Provider { get; } from IQueryable.
```
```
}
```

}

It is a wrapper of iterator factory, an element type, an expression tree representing the current query’s logic, and a query provider of IQueryProvider type:

namespace System.Linq
```
{
```
```
public interface IQueryProvider
```
```
{
```
```
IQueryable CreateQuery(Expression expression);
```
```
IQueryable<TElement> CreateQuery<TElement>(Expression expression);
```
```
object Execute(Expression expression);
```
```
TResult Execute<TResult>(Expression expression);
```
```
}
```

}

IQueryProvider has CreateQuery and Execute methods, all accepting a expression tree parameter. CreateQuery returns an IQueryable<T> query, and Execute returns a query result. These methods are called by the standard queries internally.

### Standard remote queries

Queryable provides 2 kinds of queries, sequence queries returning IQueryable<T> query, and value queries returning a query result. Take Where, Select, and First as examples, the following are their implementations:

namespace System.Linq
```
{
```
```
public static class Queryable
```
```
{
```
```
public static IQueryable<TSource> Where<TSource>(
```
```
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
```
```
{
```
```
Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, IQueryable<TSource>> currentMethod = Where;
```
```
MethodCallExpression whereCallExpression = Expression.Call(
```
```
method: currentMethod.Method,
```
```
arg0: source.Expression,
```
```
arg1: Expression.Quote(predicate));
```
```
return source.Provider.CreateQuery<TSource>(whereCallExpression);
```
```
}
```
```
public static IQueryable<TResult> Select<TSource, TResult>(
```
```
this IQueryable<TSource>source, Expression<Func<TSource, TResult>> selector)
```
```
{
```
```
Func<IQueryable<TSource>, Expression<Func<TSource, TResult>>, IQueryable<TResult>> currentMethod =
```
```
Select;
```
```
MethodCallExpression selectCallExpression = Expression.Call(
```
```
method: currentMethod.Method,
```
```
arg0: source.Expression,
```
```
arg1: Expression.Quote(selector));
```
```
return source.Provider.CreateQuery<TResult>(selectCallExpression);
```
```
}
```
```
public static TSource First<TSource>(
```
```
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
```
```
{
```
```
Func<IQueryable<TSource>, Expression<Func<TSource, bool>>, TSource>currentMethod = First;
```
```
MethodCallExpression firstCallExpression = Expression.Call(
```
```
method: currentMethod.Method,
```
```
arg0: source.Expression,
```
```
arg1: Expression.Quote(predicate));
```
```
return source.Provider.Execute<TSource>(firstCallExpression);
```
```
}
```
```
public static TSource First<TSource>(this IQueryable<TSource>source)
```
```
{
```
```
Func<IQueryable<TSource>, TSource>currentMethod = First;
```
```
MethodCallExpression firstCallExpression = Expression.Call(
```
```
method: currentMethod.Method,
```
```
arg0: source.Expression);
```
```
return source.Provider.Execute<TSource>(firstCallExpression);
```
```
}
```
```
// Other members.
```
```
}
```

}

They just build a MethodCallExpression expression, representing the current query is called. Then they obtain query provider from source’s Provider property. The sequence queries call query provider’s CreateQuery method to return IQueryable<T> query, and the value queries call query provider’s Execute method to return a query result. All standard queries are implemented in this pattern except AsQueryable.

### Build LINQ to Entities abstract syntax tree

With above Where and Select queries, a simple LINQ to Entities query can be implemented to return an IQueryable<T> of values:

internal static void WhereAndSelect(AdventureWorks adventureWorks)
```
{
```
```
// IQueryable<string> products = adventureWorks.Products
```
```
// .Where(product => product.Name.Length> 10)
```
```
// .Select(product => product.Name);
```
```
IQueryable<Product> sourceQueryable = adventureWorks.Products;
```
```
IQueryable<Product> whereQueryable = sourceQueryable.Where(product => product.Name.Length > 10);
```
```
IQueryable<string> selectQueryable = whereQueryable.Select(product => product.Name); // Define query.
```
```
foreach (string result in selectQueryable) // Execute query.
```
```
{
```
```
result.WriteLine();
```
```
}
```

}

The above example filters the products with Name longer than 10 characters, and queries the products’ Names. By desugaring the lambda expressions, and unwrapping the standard queries, the above LINQ to Entities query is equivalent to:

internal static void WhereAndSelectLinqExpressions(AdventureWorks adventureWorks)
```
{
```
```
IQueryable<Product>sourceQueryable = adventureWorks.Products; // DbSet<Product>.
```
```
ConstantExpression sourceConstantExpression = (ConstantExpression)sourceQueryable.Expression;
```
```
IQueryProvider sourceQueryProvider = sourceQueryable.Provider; // EntityQueryProvider.
```
```
// Expression<Func<Product, bool>> predicateExpression = product => product.Name.Length > 10;
```
```
ParameterExpression productParameterExpression = Expression.Parameter(typeof(Product), "product");
```
```
Expression<Func<Product, bool>>predicateExpression = Expression.Lambda<Func<Product, bool>>(
```
```
body: Expression.GreaterThan(
```
```
left: Expression.Property(
```
```
expression: Expression.Property(
```
```
expression: productParameterExpression, propertyName: nameof(Product.Name)),
```
```
propertyName: nameof(string.Length)),
```
```
right: Expression.Constant(10)),
```
```
parameters: productParameterExpression);
```
```
// IQueryable<Product> whereQueryable = sourceQueryable.Where(predicateExpression);
```
```
Func<IQueryable<Product>, Expression<Func<Product, bool>>, IQueryable<Product>>whereMethod = Queryable.Where;
```
```
MethodCallExpression whereCallExpression = Expression.Call(
```
```
method: whereMethod.Method,
```
```
arg0: sourceConstantExpression,
```
```
arg1: Expression.Quote(predicateExpression));
```
```
IQueryable<Product>whereQueryable = sourceQueryProvider
```
```
.CreateQuery<Product>(whereCallExpression); // EntityQueryable<Product>.
```
```
IQueryProvider whereQueryProvider = whereQueryable.Provider; // EntityQueryProvider.
```
```
// Expression<Func<Product, string>> selectorExpression = product => product.Name;
```
```
Expression<Func<Product, string>> selectorExpression = Expression.Lambda<Func<Product, string>>(
```
```
body: Expression.Property(productParameterExpression, nameof(Product.Name)),
```
```
parameters: productParameterExpression);
```
```
// IQueryable<string> selectQueryable = whereQueryable.Select(selectorExpression);
```
```
Func<IQueryable<Product>, Expression<Func<Product, string>>, IQueryable<string>>selectMethod = Queryable.Select;
```
```
MethodCallExpression selectCallExpression = Expression.Call(
```
```
method: selectMethod.Method,
```
```
arg0: whereCallExpression,
```
```
arg1: Expression.Quote(selectorExpression));
```
```
IQueryable<string>selectQueryable = whereQueryProvider
```
```
.CreateQuery<string>(selectCallExpression); // EntityQueryable<Product>.
```
```
using (IEnumerator<string>iterator = selectQueryable.GetEnumerator()) // Execute query.
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
iterator.Current.WriteLine();
```
```
}
```
```
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
```
|_Method = Queryable.Select<Product, string>
```
```
|_Object = null
```
```
|_Arguments
```
```
|_MethodCallExpression (NodeType = Call, Type = IQueryable<Product>)
```
```
| |_Method = Queryable.Where<Product>
```
```
| |_Object = null
```
```
| |_Arguments
```
```
| |_ConstantExpression (NodeType = Constant, Type = IQueryable<Product>)
```
```
| | |_Value = new EntityQueryable<Product>(adventureWorks.GetService<IAsyncQueryProvider>())
```
```
| |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, bool>>)
```
```
| |_Operand
```
```
| |_Expression<Func<Product, bool>> (NodeType = Lambda, Type = Func<Product, bool>)
```
```
| |_Parameters
```
```
| | |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```
| | |_Name = "product"
```
```
| |_Body
```
```
| |_BinaryExpression (NodeType = GreaterThan, Type = bool)
```
```
| |_Left
```
```
| | |_MemberExpression (NodeType = MemberAccess, Type = int)
```
```
| | |_Member = "Length"
```
```
| | |_Expression
```
```
| | |_MemberExpression (NodeType = MemberAccess, Type = string)
```
```
| | |_Member = "Name"
```
```
| | |_Expression
```
```
| | |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```
| | |_Name = "product"
```
```
| |_Right
```
```
| |_ConstantExpression (NodeType = Constant, Type = int)
```
```
| |_Value = 10
```
```
|_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
```
```
|_Operand
```
```
|_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
```
```
|_Parameters
```
```
| |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```
| |_Name = "product"
```
```
|_Body
```
```
|_MemberExpression (NodeType = MemberAccess, Type = string)
```
```
|_Member = "Name"
```
```
|_Expression
```
```
|_ParameterExpression (NodeType = Parameter, Type = Product)
```

|\_Name = "product"

This also demonstrates that lambda expression, extension methods, and LINQ query expression are powerful language features of C#. The above a rich abstract syntactic tree can be built by C# code as simple as:

internal static void WhereAndSelectQuery(AdventureWorks adventureWorks)
```
{
```
```
IQueryable<string>products = adventureWorks.Products
```
```
.Where(product => product.Name.Length > 10)
```
```
.Select(product => product.Name);
```
```
// Equivalent to:
```
```
// IQueryable<string> products =
```
```
// from product in adventureWorks.Products
```
```
// where product.Name.Length > 10
```
```
// select product.Name;
```

}

The other kind of query returning a single value works in the similar way. Take above First as example:

internal static void SelectAndFirst(AdventureWorks adventureWorks)
```
{
```
```
// string first = adventureWorks.Products.Select(product => product.Name).First();
```
```
IQueryable<Product> sourceQueryable = adventureWorks.Products;
```
```
IQueryable<string>selectQueryable = sourceQueryable.Select(product => product.Name);
```
```
string first = selectQueryable.First().WriteLine(); // Execute query.
```

}

Here the initial source and and Select query are the same as the previous example. So this time, just unwrap the First query. The above First query is equivalent to:

internal static void SelectAndFirstLinqExpressions(AdventureWorks adventureWorks)
```
{
```
```
IQueryable<Product>sourceQueryable = adventureWorks.Products;
```
```
IQueryable<string>selectQueryable = sourceQueryable.Select(product => product.Name);
```
```
MethodCallExpression selectCallExpression = (MethodCallExpression)selectQueryable.Expression;
```
```
IQueryProvider selectQueryProvider = selectQueryable.Provider; // DbQueryProvider.
```
```
// string first = selectQueryable.First();
```
```
Func<IQueryable<string>, string> firstMethod = Queryable.First;
```
```
MethodCallExpression firstCallExpression = Expression.Call(
```
```
method: firstMethod.Method, arg0: selectCallExpression);
```
```
string first = selectQueryProvider.Execute<string>(firstCallExpression).WriteLine(); // Execute query.
```

}

In First query, the MethodCallExpression expression is built to represent current First call. The difference is, then query provider’s Execute method is called instead of CreateQuery, so that a query result is returned instead of a query.

Similarly, the last expression tree built inside First, is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:

MethodCallExpression (NodeType = Call, Type = string)
```
|_Method = Queryable.First<string>
```
```
|_Object = null
```
```
|_Arguments
```
```
|_MethodCallExpression (NodeType = Call, Type = IQueryable<string>)
```
```
|_Method = Queryable.Select<Product, string>
```
```
|_Object = null
```
```
|_Arguments
```
```
|_ConstantExpression (NodeType = Constant, Type = IQueryable<Product>)
```
```
| |_Value = new EntityQueryable<Product>(adventureWorks.GetService<IAsyncQueryProvider>())
```
```
|_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
```
```
|_Operand
```
```
|_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
```
```
|_Parameters
```
```
| |_ParameterExpression (NodeType = Parameter, Type = Product)
```
```
| |_Name = "product"
```
```
|_Body
```
```
|_MemberExpression (NodeType = MemberAccess, Type = string)
```
```
|_Member = "Name"
```
```
|_Expression
```
```
|_ParameterExpression (NodeType = Parameter, Type = Product)
```

|\_Name = "product"

And again, the entire abstract syntactic tree can be built by C# code as simple as:

internal static void SelectAndFirstQuery(AdventureWorks adventureWorks)
```
{
```
```
string first = adventureWorks.Products.Select(product => product.Name).First();
```
```
// Equivalent to:
```
```
// string first = (from product in adventureWorks.Products select product.Name).First();
```

}

### .NET expression tree to database expression tree

When LINQ to Entities queries are executed by either pulling values from IQueryable<T>, or calling IQueryProvider.Execute, EF Core compiles .NET expression tree to database expression tree.

### Database query abstract syntax tree

The logic of LINQ to Entities can be represented by .NET expression tree, and EF Core also use expression tree to represent the database query logic. For example, EF Core base libraries provides the Microsoft.EntityFrameworkCore.Query.Expressions.SelectExpression type to represent a database SELECT query:

namespace Microsoft.EntityFrameworkCore.Query.Expressions
```
{
```
```csharp
public class SelectExpression : TableExpressionBase
```
```
{
```
```
public virtual IReadOnlyList<Expression> Projection { get; } // SELECT.
```
```
public virtual bool IsDistinct { get; set; } // DISTINCT.
```
```
public virtual Expression Limit { get; set; } // TOP.
```
```
public virtual IReadOnlyList<TableExpressionBase> Tables { get; } // FROM.
```
```
public virtual Expression Predicate { get; set; } // WHERE.
```
```
public virtual IReadOnlyList<Ordering> OrderBy { get; } // ORDER BY.
```
```
public virtual Expression Offset { get; set; } // OFFSET.
```
```
public override Type Type { get; }
```
```
// Other members.
```
```
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
```
{
```
```
QueryContext queryContext = dbContext
```
```
.GetService<IQueryContextFactory>()
```
```
.Create();
```
```
QueryCompilationContext compilationContext = dbContext
```
```
.GetService<IQueryCompilationContextFactory>()
```
```
.Create(async: false);
```
```
QueryCompiler queryCompiler = (QueryCompiler)dbContext.GetService<IQueryCompiler>();
```
```
linqExpression = queryCompiler.ExtractParameters(
```
```
linqExpression,
```
```
queryContext,
```
```
dbContext.GetService<IDiagnosticsLogger<DbLoggerCategory.Query>>());
```
```
linqExpression = dbContext
```
```
.GetService<IQueryTranslationPreprocessorFactory>()
```
```
.Create(compilationContext)
```
```
.Process(linqExpression);
```
```
ShapedQueryExpression queryExpression = (ShapedQueryExpression)dbContext
```
```
.GetService<IQueryableMethodTranslatingExpressionVisitorFactory>()
```
```
.Create(dbContext.Model)
```
```
.Visit(linqExpression);
```
```
queryExpression = (ShapedQueryExpression)dbContext
```
```
.GetService<IQueryTranslationPostprocessorFactory>()
```
```
.Create(compilationContext)
```
```
.Process(queryExpression);
```
```
return ((SelectExpression)queryExpression.QueryExpression, queryContext.ParameterValues);
```

}

So above Where and Select query’s expression tree can be compiled as:

internal static void CompileWhereAndSelectExpressions(AdventureWorks adventureWorks)
```
{
```
```
Expression linqExpression =adventureWorks.Products
```
```
.Where(product => product.Name.Length > 10)
```
```
.Select(product => product.Name).Expression;
```
```
(SelectExpression DatabaseExpression, IReadOnlyDictionary<string, object> Parameters) compilation =
```
```
adventureWorks.Compile(linqExpression);
```
```
compilation.DatabaseExpression.WriteLine();
```
```
compilation.Parameters.WriteLines(parameter => $"{parameter.Key}: {parameter.Value}");
```

}

The compiled SelectExpression is the same as the following SelectExpression built on the fly:

internal static SelectExpression WhereAndSelectDatabaseExpressions(AdventureWorks adventureWorks)
```
{
```
```
IQueryableMethodTranslatingExpressionVisitorFactory expressionVisitorFactory = adventureWorks
```
```
.GetService<IQueryableMethodTranslatingExpressionVisitorFactory>();
```
```
ISqlExpressionFactory expressionFactory = adventureWorks.GetService<ISqlExpressionFactory>();
```
```
IEntityType entityType = adventureWorks.Model.FindEntityType(typeof(Product));
```
```
SelectExpression databaseExpression = expressionFactory.Select(entityType);
```
```
EntityProjectionExpression projectionExpression = (EntityProjectionExpression)databaseExpression.GetMappedProjection(new ProjectionMember());
```
```
ColumnExpression columnExpression = projectionExpression.BindProperty(entityType.FindProperty(nameof(Product.Name)));
```
```
databaseExpression.ApplyPredicate(expressionFactory.MakeBinary(
```
```
ExpressionType.GreaterThan,
```
```
expressionFactory.Convert(
```
```
expressionFactory.Function("LEN", new SqlExpression[] { columnExpression }, typeof(long)),
```
```
typeof(int)),
```
```
new SqlConstantExpression(Expression.Constant(10), null),
```
```
null));
```
```
databaseExpression.AddToProjection(columnExpression);
```
```
return databaseExpression.WriteLine();
```

}

This abstract syntactic tree can be visualized as:

SelectExpression (NodeType = Extension, Type = string)
```
|_Porjection
```
```
| |_ColumnExpression (NodeType = Extension, Type = string)
```
```
| |_Name = "Name"
```
```
| |_Property = Product.Name
```
```
| |_Table
```
```
| |_TableExpression (NodeType = Extension, Type = object)
```
```
| |_Schema = "Production"
```
```
| |_Name = "Product"
```
```
| |_Alias = "product"
```
```
|_Tables
```
```
| |_TableExpression (NodeType = Extension, Type = object)
```
```
| |_Schema = "Production"
```
```
| |_Name = "Product"
```
```
| |_Alias = "product"
```
```
|_Predicate
```
```
|_BinaryExpression (NodeType = GreaterThan, Type = bool)
```
```
|_left
```
```
| |_ExplicitCastExpression (NodeType = Extension, Type = int)
```
```
| |_Operand
```
```
| |_SqlFunctionExpression (NodeType = Extension, Type = int)
```
```
| |_FunctionName = "LEN"
```
```
| |_Arguments
```
```
| |_ColumnExpression (NodeType = Extension, Type = string)
```
```
| |_Name = "Name"
```
```
| |_Property = Product.Name
```
```
| |_Table
```
```
| |_TableExpression (NodeType = Extension, Type = object)
```
```
| |_Schema = "Production"
```
```
| |_Name = "Product"
```
```
| |_Alias = "product"
```
```
|_Right
```
```
|_ConstantExpression (NodeType = Constant, Type = int)
```

|\_Value = 1

Similarly, the other Select and First query’s expression tree is compiled to abstract syntax tree the same as the following:

internal static SelectExpression SelectAndFirstDatabaseExpressions(AdventureWorks adventureWorks)
```
{
```
```
IQueryableMethodTranslatingExpressionVisitorFactory expressionVisitorFactory = adventureWorks
```
```
.GetService<IQueryableMethodTranslatingExpressionVisitorFactory>();
```
```
ISqlExpressionFactory expressionFactory = adventureWorks.GetService<ISqlExpressionFactory>();
```
```
IEntityType entityType = adventureWorks.Model.FindEntityType(typeof(Product));
```
```
SelectExpression databaseExpression = expressionFactory.Select(entityType);
```
```
EntityProjectionExpression projectionExpression = (EntityProjectionExpression)databaseExpression.GetMappedProjection(new ProjectionMember());
```
```
ColumnExpression columnExpression = projectionExpression.BindProperty(entityType.FindProperty(nameof(Product.Name)));
```
```
databaseExpression.AddToProjection(columnExpression);
```
```
databaseExpression.ApplyLimit(expressionFactory.ApplyDefaultTypeMapping(new SqlConstantExpression(Expression.Constant(1), null)));
```
```
return databaseExpression.WriteLine();
```

}

And this abstract syntactic tree can be visualized as:

SelectExpression (NodeType = Extension, Type = string)
```
|_Limit
```
```
| |_ConstantExpression (NodeType = Constant, Type = int)
```
```
| |_Value = 1
```
```
|_Porjection
```
```
| |_ColumnExpression (NodeType = Extension, Type = string)
```
```
| |_Name = "Name"
```
```
| |_Property = Product.Name
```
```
| |_Table
```
```
| |_TableExpression (NodeType = Extension, Type = object)
```
```
| |_Schema = "Production"
```
```
| |_Name = "Product"
```
```
| |_Alias = "product"
```
```
|_Tables
```
```
|_TableExpression (NodeType = Extension, Type = object)
```
```
|_Schema = "Production"
```
```
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
```
{
```
```csharp
public class SqlServerStringLengthTranslator : IMemberTranslator
```
```
{
```
```
public virtual Expression Translate(MemberExpression memberExpression) =>
```
```
memberExpression.Expression != null
```
```
&&memberExpression.Expression.Type == typeof(string)
```
```
&& memberExpression.Member.Name == nameof(string.Length)
```
```
? new SqlFunctionExpression("LEN", memberExpression.Type, new Expression[] { memberExpression.Expression })
```
```
: null;
```
```
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
```
internal static void WhereAndSelectWithCustomPredicate(AdventureWorks adventureWorks)
```
```
{
```
```
IQueryable<Product>source = adventureWorks.Products;
```
```
IQueryable<string>products = source
```
```
.Where(product => FilterName(product.Name))
```
```
.Select(product => product.Name); // Define query.
```
```
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
```
{
```
```
public static class EF
```
```
{
```
```
public static DbFunctions Functions { get; }
```
```
// Other members.
```
```
}
```

}

Extension methods are defined for the DbFunctions output type to represent database functions and operators. As fore mentioned, EF Core implements a provider model, so these mapping functions are provides in 2 levels. The EF Core base library provides mapping functions which should be supported by all database providers, like the LIKE operator:

namespace Microsoft.EntityFrameworkCore
```
{
```
```
public static class DbFunctionsExtensions
```
```
{
```
```
public static bool Like(this DbFunctions _, string matchExpression, string pattern);
```
```
// Other members.
```
```
}
```

}

These are also called canonical functions. The mapping funcions for specific database is provided by the database provider library. For example, Microsoft.EntityFrameworkCore.SqlServer.dll library provides DateDiffDay extension method to represent SQL database’s DATEDIFF function for day, and provides Contains extension method to represent SQL database’s CONTAINS function, etc.

namespace Microsoft.EntityFrameworkCore
```
{
```
```
public static class SqlServerDbFunctionsExtensions
```
```
{
```
```
public static bool Contains(this DbFunctions _, string propertyReference, string searchCondition);
```
```
public static int DateDiffDay(this DbFunctions _, DateTime startDate, DateTime endDate);
```
```
// Other members.
```
```
}
```

}

The following example filters the product’s names with a pattern. In the following LINQ to Entities query expression tree, the MethodCallExpression node representing Like call is compiled to a LikeExpression node representing the LIKE operator:

internal static void DatabaseOperator(AdventureWorks adventureWorks)
```
{
```
```
IQueryable<string>products = adventureWorks.Products
```
```
.Select(product => product.Name)
```
```
.Where(name => EF.Functions.Like(name, "%Touring%50%")); // Define query.
```
```
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
```
{
```
```
var photos = adventureWorks.ProductPhotos.Select(photo => new
```
```
{
```
```
LargePhotoFileName = photo.LargePhotoFileName,
```
```
UnmodifiedDays = EF.Functions.DateDiffDay(photo.ModifiedDate, DateTime.UtcNow)
```
```
}); // Define query.
```
```
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
```
{
```
```
public interface IQuerySqlGenerator
```
```
{
```
```
IRelationalCommand GenerateSql(
```
```
IReadOnlyDictionary<string, object>parameterValues);
```
```
// Other members.
```
```
}
```

}

It is implemented by Microsoft.EntityFrameworkCore.Query.Sql.Internal.SqlServerQuerySqlGenerator. SQL generator wraps a database expression tree inside, and provides a GenerateSql method, which returns Microsoft.EntityFrameworkCore.Storage.IRelationalCommand to represents generated SQL:

namespace Microsoft.EntityFrameworkCore.Storage
```
{
```
```
public interface IRelationalCommand
```
```
{
```
```
string CommandText { get; }
```
```
IReadOnlyList<IRelationalParameter> Parameters { get; }
```
```
RelationalDataReader ExecuteReader(
```
```
IRelationalConnection connection,
```
```
IReadOnlyDictionary<string, object>parameterValues);
```
```
// Other members.
```
```
}
```

}

It is implemented by Microsoft.EntityFrameworkCore.Storage.Internal.RelationalCommand in Microsoft.EntityFrameworkCore.Relational package.

### Generate SQL from database expression tree

The following extension method of DbContext can be defined to accepot a database command tree, and generate SQL:

public static IRelationalCommand Generate(this DbContext dbContext, SelectExpression databaseExpression)
```
{
```
```
IQuerySqlGeneratorFactory sqlGeneratorFactory = dbContext.GetService<IQuerySqlGeneratorFactory>();
```
```
QuerySqlGenerator sqlGenerator = sqlGeneratorFactory.Create();
```
```
return sqlGenerator.GetCommand(databaseExpression);
```

}

The above WhereAndSelectDatabaseExpressions and SelectAndFirstDatabaseExpressions functions build database expression trees from scratch. Take them as an example to generate SQL:

internal static void WhereAndSelectSql(AdventureWorks adventureWorks)
```
{
```
```
SelectExpression databaseExpression = WhereAndSelectDatabaseExpressions(
```
```
adventureWorks);
```
```
IRelationalCommand sql = adventureWorks.Generate(
```
```
databaseExpression: databaseExpression, parameters: null);
```
```
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
```
}
```
```
internal static void SelectAndFirstSql(AdventureWorks adventureWorks)
```
```
{
```
```
SelectExpression databaseExpression = SelectAndFirstDatabaseExpressions(adventureWorks);
```
```
IRelationalCommand sql = adventureWorks.Generate(databaseExpression: databaseExpression, parameters: null);
```
```
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