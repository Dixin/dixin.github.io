---
title: "Entity Framework and LINQ to Entities (5) Query Translation"
published: 2016-02-20
description: "The previous part discussed what SQL queries are the LINQ to Entities queries translated to. This part discusses how the LINQ to Entities queries are translated to SQL queries. As fore mentioned, IQue"
image: ""
tags: [".NET", "C#", "Entity Framework", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework series](/archive/?tag=Entity%20Framework)\]

## **EF Core version of this article:** [**https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-5-query-translation-implementation**](/posts/entity-framework-core-and-linq-to-entities-5-query-translation-implementation "https://weblogs.asp.net/dixin/entity-framework-core-and-linq-to-entities-5-query-translation-implementation")

The previous part discussed what SQL queries are the LINQ to Entities queries translated to. This part discusses how the LINQ to Entities queries are translated to SQL queries. As fore mentioned, IQueryable<T> query methods work with expression trees. Internally, these methods build expression trees too, then these expression trees are translated. In Entity Framework, .NET expression tree is not directly translated to SQL query. As mentioned at the beginning of this chapter, Entity Framework implements a provider model to work with different kinds of databases like Oracle, MySQL, PostgreSQL, etc., and different database system can have different query languages. So Entity Framework breaks the translation into 2 parts:

-   EntityFramework.dll translates .NET expression tree to generic, intermediate database command tree
-   The specific database provider (like EntityFramework.SqlServer.dll here) is responsible to generate database query specific to that kind of database.

## Code to expression tree

The first step of query translation is to build .NET expression tree. As fore mentioned, expression tree enables code as data. In C#, an expression tree shares the same syntax as functions, but C# code for expression tree is compiled to the building of an abstract syntactic tree, representing the abstract syntactic structure of the function’s source code. In LINQ, IQueryable<T> utilizes expression tree to represent the abstract syntactic structure of a remote query.

### IQueryable<T> and IQueryProvider

IQueryable<T> has been demonstrated:

```csharp
namespace System.Linq
{
    public interface IQueryable<out T> : IEnumerable<T>, IEnumerable, IQueryable
    {
        // Expression Expression { get; } from IQueryable.

        // Type ElementType { get; } from IQueryable.

        // IQueryProvider Provider { get; } from IQueryable.

        // IEnumerator<T> GetEnumerator(); from IEnumerable<T>.
    }
}
```

It is a wrapper of iterator getter, an expression tree representing the current query’s logic, and a query provider of IQueryProvider type:

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

It has CreateQuery and Execute methods, all accepting a expression tree parameter. CreateQuery methods return an IQueryable<T> of values, and Execute methods return a single value. These methods are called inside the Queryable methods.

### Queryable methods

As fore mentioned, Queryable also provides 2 kinds of query methods, which either return an IQueryable<T> of values, or return a single value. Take Where, Select, and First as example, here are their implementations:

```csharp
namespace System.Linq
{
    using System.Linq.Expressions;

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

        // Other methods...
    }
}
```

All the query methods are in the same pattern. They just build a MethodCallExpression expression, representing the current query method is called. Then they obtain query provider from source’s Provider property. When the query method returns another IQueryable<T>, it calls query provider’s CreateQuery method. When the query method return a single value, it calls query provider’s Execute method.

### Build LINQ to Entities queries and expressions

With above Where and Select query methods, a simple LINQ to Entities query can be implemented to return a IQueryable<T> of values:

```csharp
internal static partial class Translation
{
    private static readonly AdventureWorks AdventureWorks = new AdventureWorks();

    internal static void WhereAndSelect()
    {
        // IQueryable<string> products = AdventureWorks.Products
        //    .Where(product => product.Name.StartsWith("M")).Select(product => product.Name);
        IQueryable<Product> sourceQueryable = AdventureWorks.Products;
        IQueryable<Product> whereQueryable = sourceQueryable.Where(product => product.Name.StartsWith("M"));
        IQueryable<string> selectQueryable = whereQueryable.Select(product => product.Name); // Define query.
        selectQueryable.ForEach(product => Trace.WriteLine(product)); // Execute query.
    }
}
```

Once again, a static DbContext is reused in all queries here, to make code shorter. In reality, a DbContext object should always be constructed and disposed for each [unit of work](http://martinfowler.com/eaaCatalog/unitOfWork.html).

The above example queries products with Name starting with “M”, and returns the products’ Names. By deguaring the lambda expressions, and unwrapping the query methods, the above LINQ to Entities query is equivalent to:

```csharp
internal static void WhereAndSelectExpressions()
{
    IQueryable<Product> sourceQueryable = AdventureWorks.Products;

    // MethodCallExpression sourceMergeAsCallExpression = sourceQuery.Expression as MethodCallExpression;
    ObjectQuery<Product> objectQuery = new ObjectQuery<Product>(
        $"[{nameof(AdventureWorks)}].[{nameof(AdventureWorks.Products)}]",
        (AdventureWorks as IObjectContextAdapter).ObjectContext,
        MergeOption.AppendOnly);
    MethodInfo mergeAsMethod = typeof(ObjectQuery<Product>)
        .GetTypeInfo().GetDeclaredMethods("MergeAs").Single();
    MethodCallExpression sourceMergeAsCallExpression = Expression.Call(
        instance: Expression.Constant(objectQuery),
        method: mergeAsMethod,
        arguments: Expression.Constant(MergeOption.AppendOnly, typeof(MergeOption)));
    Trace.WriteLine(sourceQueryable.Expression);
    // value(System.Data.Entity.Core.Objects.ObjectQuery`1[Dixin.Linq.EntityFramework.Product])
    //    .MergeAs(AppendOnly)

    // Expression<Func<Product, bool>> predicateExpression = product => product.Name.StartsWith("M");
    ParameterExpression productParameterExpression = Expression.Parameter(typeof(Product), "product");
    Func<string, bool> startsWithMethod = string.Empty.StartsWith;
    Expression<Func<Product, bool>> predicateExpression =
        Expression.Lambda<Func<Product, bool>>(
            Expression.Call(
                instance: Expression.Property(productParameterExpression, nameof(Product.Name)),
                method: startsWithMethod.Method,
                arguments: Expression.Constant("M", typeof(string))),
            productParameterExpression);
    Trace.WriteLine(predicateExpression);
    // product => product.Name.StartsWith("M")

    // IQueryable<Product> whereQueryable = sourceQueryable.Where(predicateExpression);
    Func<IQueryable<Product>, Expression<Func<Product, bool>>, IQueryable<Product>> whereMethod =
        Queryable.Where;
    MethodCallExpression whereCallExpression = Expression.Call(
        method: whereMethod.Method,
        arg0: sourceMergeAsCallExpression,
        arg1: Expression.Quote(predicateExpression));
    IQueryable<Product> whereQueryable =
        sourceQueryable.Provider.CreateQuery<Product>(whereCallExpression);
    Trace.WriteLine(object.ReferenceEquals(whereCallExpression, whereQueryable.Expression)); // True.
    Trace.WriteLine(whereQueryable.Expression);
    // value(System.Data.Entity.Core.Objects.ObjectQuery`1[Dixin.Linq.EntityFramework.Product])
    //    .MergeAs(AppendOnly)
    //    .Where(product => product.Name.StartsWith("M"))

    // Expression<Func<Product, string>> selectorExpression = product => product.Name;
    Expression<Func<Product, string>> selectorExpression =
        Expression.Lambda<Func<Product, string>>(
            Expression.Property(productParameterExpression, nameof(Product.Name)),
            productParameterExpression);
    Trace.WriteLine(selectorExpression);
    // product => product.Name

    // IQueryable<string> selectQueryable = whereQueryable.Select(selectorExpression);
    Func<IQueryable<Product>, Expression<Func<Product, string>>, IQueryable<string>> selectMethod =
        Queryable.Select;
    MethodCallExpression selectCallExpression = Expression.Call(
        method: selectMethod.Method,
        arg0: whereCallExpression,
        arg1: Expression.Quote(selectorExpression));
    IQueryable<string> selectQueryable = whereQueryable.Provider.CreateQuery<string>(selectCallExpression);
    Trace.WriteLine(object.ReferenceEquals(selectCallExpression, selectQueryable.Expression)); // True.
    Trace.WriteLine(selectQueryable.Expression);
    // value(System.Data.Entity.Core.Objects.ObjectQuery`1[Dixin.Linq.EntityFramework.Product])
    //    .MergeAs(AppendOnly)
    //    .Where(product => product.Name.StartsWith("M"))
    //    .Select(product => product.Name)

    // selectQueryable.ForEach(product => Trace.WriteLine(product));
    using (IEnumerator<string> iterator = selectQueryable.GetEnumerator())
    {
        while (iterator.MoveNext()) // Execute query.
        {
            string product = iterator.Current;
            Trace.WriteLine(product);
        }
    }
}
```

Here are the steps how the fluent query builds expression tree:

-   Build data source:

-   The first/source IQueryable<T> object is the sourceQueryable variable. Entity Framework automatically constructs a DbSet<Product> to represent the data source, which implements IQueryable<Product>, and wraps:

-   A MethodCallExpression expression, which represents ObjectQuery<Product>.MergeAs method on an ObjectQuery<Product> object. By default, MergeAs is called with MergeOption.AppendOnly, which means append new entities to the entity cache, if any. Entity cache will be discussed in a later part.
-   A query provider, which is a DbQueryProvider object implementing IQueryProvider

-   Build Where query:

-   A predicate expression predicateExpression is built for Where,
-   Where continues the query based on sourceQueryable. But Where only needs sourceQueryable’s expression sourceMergeAsCallExpression and query provider sourceQueryProvider. As fore mentioned, a MethodCallExpression expression whereCallExpression is built, which represents a call to itself with sourceMergeAsCallExpression argument and predicateExpression argument. Then sourceQueryProvider’s CreateQuery method is called with whereCallExpression argument, and a IQueryable<Product> variable whereQueryable is returned for further query.. Here whereQueryable wraps:

-   The MethodCallExpression expression whereCallExpression
-   A query provider whereQueryProvider, which is another DbQueryProvider object

-   Build Select query:

-   A selector expression selectorExpression is built for Select
-   Select continues the query based on whereQueryable. Again, Select only needs whereQueryable’s expression whereCallExpression and query provider whereQueryProvider. A MethodCallExpression expression selectCallExpression is built, which represents a call to itself with whereCallExpression argument and selectorExpression argument. Then whereQueryProvider’s CreateQuery method is called with selectCallExpression, and a IQueryable<string> variable selectQueryable is returned. Once again selectQueryable wraps:

-   The MethodCallExpression expression selectCallExpression
-   A query provider, which is yet another DbQueryProvider object

So, the last IQueryable<T> variable selectQueryable’s Expression property (referencing to selectCallExpression), is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:

```csharp
MethodCallExpression (NodeType = Call, Type = IQueryable<string>)
|_Method = Queryable.Select<Product, string>
|_Object = null
|_Arguments
  |_MethodCallExpression (NodeType = Call, Type = IQueryable<Product>)
  | |_Method = Queryable.Where<Product>
  | |_Object = null
  | |_Arguments
  |   |_MethodCallExpression (NodeType = Call, Type = IQueryable<Product>)
  |   | |_Method = ObjectQuery<Product>.MergeAs
  |   | |_Object
  |   | | |_ConstantExpression (NodeType = Constant, Type = ObjectQuery<Product>)
  |   | |  |_Value = new ObjectQuery<Product>(...)
  |   | |_Arguments
  |   |   |_ConstantExpression (NodeType = Constant, Type = MergeOption)
  |   |     |_Value = MergeOption.AppendOnly
  |   |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, bool>>)
  |     |_Operand
  |       |_Expression<Func<Product, bool>> (NodeType = Lambda, Type = Func<Product, bool>)
  |         |_Parameters
  |         | |_ParameterExpression (NodeType = Parameter, Type = Product)
  |         |   |_Name = "product"
  |         |_Body
  |           |_MethodCallExpression (NodeType = Call, Type = bool)
  |             |_Method = string.StartsWith
  |             |_Object
  |             | |_PropertyExpression (NodeType = MemberAccess, Type = string)
  |             |   |_Expression
  |             |     |_ParameterExpression (NodeType = Parameter, Type = Product)
  |             |     | |_Name = "product"
  |             |     |_Member = "Name"
  |             |_Arguments
  |               |_ConstantExpression (NodeType = Constant, Type = string)
  |                 |_Value = "M"
  |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
    |_Operand
      |_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
        |_Parameters
        | |_ParameterExpression (NodeType = Parameter, Type = Product)
        |   |_Name = "product"
        |_Body
          |_PropertyExpression (NodeType = MemberAccess, Type = string)
            |_Expression
            | |_ParameterExpression (NodeType = Parameter, Type = Product)
            |   |_Name = "product"
            |_Member = "Name"
```

This also demonstrates that lambda expression, extension methods, and LINQ query are powerful features. Such a rich abstract syntactic tree can be built by C# code as simple as:

```csharp
IQueryable<string> products = AdventureWorks.Products
    .Where(product => product.Name.StartsWith("M")).Select(product => product.Name);
```

The other kind of query returning a single value, works in the same way. Take above First as example:

```csharp
internal static void SelectAndFirst()
{
    // string first = AdventureWorks.Products.Select(product => product.Name).First();
    IQueryable<Product> sourceQueryable = AdventureWorks.Products;
    IQueryable<string> selectQueryable = sourceQueryable.Select(product => product.Name);
    string first = selectQueryable.First();
    Trace.WriteLine(first);
}
```

Here the sourceQueryable and and Select query is the same as the previous example. So this time, just unwrap the First method. The above First query is equivalent to:

```csharp
internal static void SelectAndFirstExpressions()
{
    IQueryable<Product> sourceQueryable = AdventureWorks.Products;
    Trace.WriteLine(sourceQueryable.Expression);
    // value(System.Data.Entity.Core.Objects.ObjectQuery`1[Dixin.Linq.EntityFramework.Product])
    //    .MergeAs(AppendOnly)

    IQueryable<string> selectQueryable = sourceQueryable.Select(product => product.Name);
    Trace.WriteLine(selectQueryable.Expression);
    // value(System.Data.Entity.Core.Objects.ObjectQuery`1[Dixin.Linq.EntityFramework.Product])
    //    .MergeAs(AppendOnly)
    //    .Select(product => product.Name)

    // string first = selectQueryable.First();
    Func<IQueryable<string>, string> firstMethod = Queryable.First;
    MethodCallExpression firstCallExpression = Expression.Call(firstMethod.Method, selectQueryable.Expression);
    Trace.WriteLine(firstCallExpression);
    // value(System.Data.Entity.Core.Objects.ObjectQuery`1[Dixin.Linq.EntityFramework.Product])
    //    .MergeAs(AppendOnly)
    //    .Select(product => product.Name)
    //    .First()

    string first = selectQueryable.Provider.Execute<string>(firstCallExpression); // Execute query.
}
```

In First query, the MethodCallExpression expression is built in the same way. The difference is, IQueryableProvider.Execute is called instead of CreateQuery, so that a single value is returned. In Entity Framework, DbQueryProvider.CreateQuery and DbQueryProvider.Execute both internally call ObjectQueryProvider.CreateQuery to get a IQueryable<T>. So above Execute call is equivalent to:

```csharp
internal static void SelectAndFirstQuery()
{
    IQueryable<Product> sourceQueryable = AdventureWorks.Products;
    IQueryable<string> selectQueryable = sourceQueryable.Select(product => product.Name);

    Func<IQueryable<string>, string> firstMethod = Queryable.First;
    MethodCallExpression firstCallExpression = Expression.Call(firstMethod.Method, selectQueryable.Expression);
    // IQueryable<string> firstQueryable = selectQueryable.Provider._internalQuery.ObjectQueryProvider
    //    .CreateQuery<string>(firstCallExpression);
    // Above _internalQuery, ObjectQueryProvider and CreateQuery are not public. Reflection is needed:
    Assembly entityFrmaeworkAssembly = typeof(DbContext).Assembly;
    Type dbQueryProviderType = entityFrmaeworkAssembly.GetType(
        "System.Data.Entity.Internal.Linq.DbQueryProvider");
    FieldInfo internalQueryField = dbQueryProviderType.GetField(
        "_internalQuery", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.GetField);
    Type internalQueryType = entityFrmaeworkAssembly.GetType("System.Data.Entity.Internal.Linq.IInternalQuery");
    PropertyInfo objectQueryProviderProperty = internalQueryType.GetProperty("ObjectQueryProvider");
    Type objectQueryProviderType = entityFrmaeworkAssembly.GetType(
        "System.Data.Entity.Core.Objects.ELinq.ObjectQueryProvider");
    MethodInfo createQueryMethod = objectQueryProviderType
        .GetMethod(
            "CreateQuery",
            BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.InvokeMethod,
            null,
            new Type[] { typeof(Expression) },
            null)
        .MakeGenericMethod(typeof(string));
    object internalQuery = internalQueryField.GetValue(selectQueryable.Provider);
    object objectProvider = objectQueryProviderProperty.GetValue(internalQuery);
    IQueryable<string> firstQueryable = createQueryMethod.Invoke(
        objectProvider, new object[] { firstCallExpression }) as IQueryable<string>;

    Func<IEnumerable<string>, string> firstMappingMethod = Enumerable.First;
    string first = firstMappingMethod(firstQueryable); // Execute query.
    Trace.WriteLine(first);
}
```

Inside First:

-   DbQueryProvider.\_internalQuery.ObjectQueryProvider.CreateQuery is called to create an IQueryable<T> variable firstQueryable, which is the same as Where and Select
-   Queryable.First method is mapped to Enumerable.First method (Entity Framework internally maintains a map between Queryable methods and Enumerable methods)
-   finally Enumerable.First is called with firstQueryable, and pulls a single value from firstQueryable.

Similarly, the last IQueryable<T> variable firstQueryable’s Expression property (referencing to firstCallExpression), is the final abstract syntactic tree, which represents the entire LINQ to Entities query logic:

```csharp
MethodCallExpression (NodeType = Call, Type = string)
|_Method = Queryable.First<string>
|_Object = null
|_Arguments
  |_MethodCallExpression (NodeType = Call, Type = IQueryable<string>)
    |_Method = Queryable.Select<Product, string>
    |_Object = null
    |_Arguments
      |_MethodCallExpression (NodeType = Call, Type = IQueryable<Product>)
      | |_Method = ObjectQuery<Product>.MergeAs
      | |_Object
      | | |_ConstantExpression (NodeType = Constant, Type = ObjectQuery<Product>)
      | |  |_Value = new ObjectQuery<Product>(...)
      | |_Arguments
      |   |_ConstantExpression (NodeType = Constant, Type = MergeOption)
      |     |_Value = MergeOption.AppendOnly
      |_UnaryExpression (NodeType = Quote, Type = Expression<Func<Product, string>>)
       |_Operand
          |_Expression<Func<Product, string>> (NodeType = Lambda, Type = Func<Product, string>)
            |_Parameters
            | |_ParameterExpression (NodeType = Parameter, Type = Product)
            |   |_Name = "product"
            |_Body
              |_PropertyExpression (NodeType = MemberAccess, Type = string)
                |_Expression
                | |_ParameterExpression (NodeType = Parameter, Type = Product)
                |   |_Name = "product"
                |_Member = "Name"
```

And again, the entire abstract syntactic tree can be built by C# code as simple as:

```csharp
string first = AdventureWorks.Products.Select(product => product.Name).First();
```

## Expression tree to database command tree

In the next step, EntityFramework.dll translates .NET expression tree to database command tree.

### DbExpression and DbCommandTree

The logic of C# source code can be represented by .NET expression tree, and Entity Framework has a similar design. It defines database command tree, as the abstract syntactic tree of database query. In a .NET expression tree, each node derives from System.Linq.Expressions.Expression; Here in database command tree, each node derives from System.Data.Entity.Core.Common.CommandTrees.DbExpression:

```csharp
namespace System.Data.Entity.Core.Common.CommandTrees
{
    using System.Data.Entity.Core.Metadata.Edm;

    public abstract class DbExpression
    {
        public virtual DbExpressionKind ExpressionKind { get; }

        public virtual TypeUsage ResultType { get; }

        // Other members.
    }

    public sealed class DbFilterExpression : DbExpression
    {
        public DbExpressionBinding Input { get; }

        public DbExpression Predicate { get; }

        // Other members.
    }

    public sealed class DbProjectExpression : DbExpression
    {
        public DbExpressionBinding Input { get; }

        public DbExpression Projection { get; }

        // Other members.
    }

    public sealed class DbLimitExpression : DbExpression
    {
        public DbExpression Argument { get; }

        public DbExpression Limit { get; }

        // Other members.
    }
}
```

Here DbExpression.ExpressionKind is similar to Expression.NodeType, and DbExpression.ResultType is similar to Expression.Type. Here are all the DbExpressions:

-   DbExpression

-   DbApplyExpression
-   DbArithmeticExpression
-   DbBinaryExpression

-   DbAndExpression
-   DbComparisonExpression
-   DbExceptExpression
-   DbIntersectExpression
-   DbOrExpression
-   DbUnionAllExpression

-   DbCaseExpression
-   DbConstantExpression
-   DbCrossJoinExpression
-   DbFilterExpression
-   DbFunctionExpression
-   DbGroupByExpression
-   DbInExpression
-   DbJoinExpression
-   DbLambdaExpression
-   DbLikeExpression
-   DbLimitExpression
-   DbNewInstanceExpression
-   DbNullExpression
-   DbParameterReferenceExpression
-   DbProjectExpression
-   DbPropertyExpression
-   DbQuantifierExpression
-   DbRelationshipNavigationExpression
-   DbScanExpression
-   DbSkipExpression
-   DbSortExpression
-   DbUnaryExpression

-   DbCastExpression
-   DbDerefExpression
-   DbDistinctExpression
-   DbElementExpression
-   DbEntityRefExpression
-   DbIsEmptyExpression
-   DbIsNullExpression
-   DbIsOfExpression
-   DbNotExpression
-   DbOfTypeExpression
-   DbRefExpression
-   DbTreatExpression
-   DbRefKeyExpression

-   DbVariableReferenceExpression

When representing a complete database query, command tree’s top node is a DbQueryCommandTree object:

```csharp
namespace System.Data.Entity.Core.Common.CommandTrees
{
    public abstract class DbCommandTree
    {
        public IEnumerable<KeyValuePair<string, TypeUsage>> Parameters { get; }
    }
    
    public sealed class DbQueryCommandTree : DbCommandTree
    {
        public DbExpression Query { get; }
    }
}
```

DbQueryCommandTree’s Parameters property contains the parameters for the database query, and Query property is the top node of the DbExpression tree. They are similar to LambdaExpression’s Parameters and Body properties.

Similar to Expression class, in Entity Framework System.Data.Entity.Core.Common.CommandTrees.ExpressionBuilder.DbExpressionBuilder class provides factory methods to instantiate all kinds of DbExpressions:

```csharp
namespace System.Data.Entity.Core.Common.CommandTrees.ExpressionBuilder
{
    using System.Data.Entity.Core.Metadata.Edm;

    public static class DbExpressionBuilder
    {
        public static DbFilterExpression Filter(this DbExpressionBinding input, DbExpression predicate);

        public static DbProjectExpression Project(this DbExpressionBinding input, DbExpression projection);

        public static DbLimitExpression Limit(this DbExpression argument, DbExpression count);

        public static DbScanExpression Scan(this EntitySetBase targetSet);

        public static DbPropertyExpression Property(this DbExpression instance, string propertyName);

        public static DbVariableReferenceExpression Variable(this TypeUsage type, string name);

        public static DbConstantExpression Constant(object value);

        // Other methods...
    }
}
```

### Convert Expression to DbExpression

Entity Framework calls ExpressionConverter and PlanCompiler to convert expression tree to database command tree:

```csharp
public static partial class DbContextExtensions
{
    public static DbQueryCommandTree Convert(this IObjectContextAdapter context, Expression expression)
    {
        context.NotNull(nameof(context));

        ObjectContext objectContext = context.ObjectContext;

        // DbExpression dbExpression = new ExpressionConverter(
        //    Funcletizer.CreateQueryFuncletizer(objectContext), expression).Convert();
        // DbQueryCommandTree commandTree = objectContext.MetadataWorkspace.CreateQueryCommandTree(dbExpression);
        // List<ProviderCommandInfo> providerCommands;
        // PlanCompiler.Compile(
        //    commandTree, out providerCommands, out columnMap, out columnCount, out entitySets);
        // return providerCommands.Single().CommandTree as DbQueryCommandTree;
        // Above ExpressionConverter, Funcletizer and PlanCompiler are not public. Reflection is needed:
        Assembly entityFrmaeworkAssembly = typeof(DbContext).Assembly;
        Type funcletizerType = entityFrmaeworkAssembly.GetType(
            "System.Data.Entity.Core.Objects.ELinq.Funcletizer");
        MethodInfo createQueryFuncletizerMethod = funcletizerType.GetMethod(
            "CreateQueryFuncletizer", BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.InvokeMethod);
        Type expressionConverterType = entityFrmaeworkAssembly.GetType(
            "System.Data.Entity.Core.Objects.ELinq.ExpressionConverter");
        ConstructorInfo expressionConverterConstructor = expressionConverterType.GetConstructor(
            BindingFlags.NonPublic | BindingFlags.Instance, 
            null, 
            new Type[] { funcletizerType, typeof(Expression) }, 
            null);
        MethodInfo convertMethod = expressionConverterType.GetMethod(
            "Convert", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.InvokeMethod);
        object funcletizer = createQueryFuncletizerMethod.Invoke(null, new object[] { objectContext });
        object expressionConverter = expressionConverterConstructor.Invoke(
            new object[] { funcletizer, expression });
        DbExpression dbExpression = convertMethod.Invoke(expressionConverter, new object[0]) as DbExpression;
        DbQueryCommandTree commandTree = objectContext.MetadataWorkspace.CreateQueryCommandTree(dbExpression);
        Type planCompilerType = entityFrmaeworkAssembly.GetType(
            "System.Data.Entity.Core.Query.PlanCompiler.PlanCompiler");
        MethodInfo compileMethod = planCompilerType.GetMethod(
            "Compile", BindingFlags.NonPublic | BindingFlags.Static | BindingFlags.InvokeMethod);
        object[] arguments = new object[] { commandTree, null, null, null, null };
        compileMethod.Invoke(null, arguments);
        Type providerCommandInfoType = entityFrmaeworkAssembly.GetType(
            "System.Data.Entity.Core.Query.PlanCompiler.ProviderCommandInfo");
        PropertyInfo commandTreeProperty = providerCommandInfoType.GetProperty(
            "CommandTree", BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.GetProperty);
        object providerCommand = (arguments[1] as IEnumerable<object>).Single();
        return commandTreeProperty.GetValue(providerCommand) as DbQueryCommandTree;
    }
}
```

ExpressionConverter translates expression tree and outputs the command tree. PlanCompiler processes the command tree for object-relational mapping, like replacing the scan of AdventureWorks.Product to the scan of \[Production\].\[Product\] table, etc. So above Where and Select query’s expression tree can be converted as:

```csharp
internal static void WhereAndSelectExpressionsToDbExpressions()
{
    Expression expression = AdventureWorks.Products
        .Where(product => product.Name.StartsWith("M")).Select(product => product.Name).Expression;
    DbQueryCommandTree commandTree = AdventureWorks.Convert(expression);
    Trace.WriteLine(commandTree);
}
```

The converted command tree is equivalent to the command tree built below:

```csharp
internal static DbQueryCommandTree WhereAndSelectDbExpressions()
{
    MetadataWorkspace metadata = (AdventureWorks as IObjectContextAdapter).ObjectContext.MetadataWorkspace;
    TypeUsage stringTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
        .GetPrimitiveTypes(DataSpace.CSpace)
        .Single(type => type.ClrEquivalentType == typeof(string)));
    TypeUsage nameRowTypeUsage = TypeUsage.CreateDefaultTypeUsage(RowType.Create(
        Enumerable.Repeat(EdmProperty.Create(nameof(Product.Name), stringTypeUsage), 1),
        Enumerable.Empty<MetadataProperty>()));
    TypeUsage productTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
        .GetType(nameof(Product), "CodeFirstDatabaseSchema", DataSpace.SSpace));
    EntitySet productEntitySet = metadata
        .GetEntityContainer("CodeFirstDatabase", DataSpace.SSpace)
        .GetEntitySetByName(nameof(Product), false);

    DbProjectExpression query = DbExpressionBuilder.Project(
        DbExpressionBuilder.BindAs(
            DbExpressionBuilder.Filter(
                DbExpressionBuilder.BindAs(
                    DbExpressionBuilder.Scan(productEntitySet), "Extent1"),
                DbExpressionBuilder.Like(
                    DbExpressionBuilder.Property(
                        DbExpressionBuilder.Variable(productTypeUsage, "Extent1"), nameof(Product.Name)),
                    DbExpressionBuilder.Constant("M%"))),
            "Filter1"),
        DbExpressionBuilder.New(
            nameRowTypeUsage,
            DbExpressionBuilder.Property(
                DbExpressionBuilder.Variable(productTypeUsage, "Filter1"), nameof(Product.Name))));
    DbQueryCommandTree commandTree = new DbQueryCommandTree(metadata, DataSpace.SSpace, query);
    Trace.WriteLine(commandTree);
    return commandTree;
}
```

This abstract syntactic tree can be visualized as:

```csharp
DbQueryCommandTree
|_Parameters
|_Query
  |_DbProjectExpression (ExpressionKind = Project, ResultType = Collection(Row['Name' = Edm.String]))
    |_Input
    | |_DbExpressionBinding (VariableType = Product)
    |   |_VariableName = 'Filter1'
    |   |_Expression
    |     |_DbFilterExpression (ExpressionKind = Filter, ResultType = Product)
    |       |_Input
    |       | |_DbExpressionBinding (VariableType = Product)
    |       |   |_VariableName = 'Extent1'
    |       |   |_Expression
    |       |     |_DbScanExpression (ExpressionKind = Scan, ResultType = Collection(Product))
    |       |       |_Target = Products
    |       |_Predicate
    |         |_DbLikeExpression (ExpressionKind = Like, ResultType = Edm.Boolean)
    |           |_Argument
    |           | |_DbPropertyExpression (ExpressionKind = Property, ResultType = Edm.String)
    |           |   |_Property = Product.Name
    |           |   |_Instance
    |           |     |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Product)
    |           |       |_VariableName = 'Extent1'
    |           |_Pattern
    |             |_DbConstantExpression (ExpressionKind = Constant, ResultType = Edm.String)
    |               |_Value = 'M%'
    |_Projection
      |_DbNewInstanceExpression (ExpressionKind = NewInstance, ResultType = Row['Name' = Edm.String])
        |_Arguments
          |_DbPropertyExpression (ExpressionKind = Property, ResultType = Edm.String)
            |_Property = Product.Name
            |_Instance
              |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Product)
                |_VariableName = 'Filter1'
```

Similarly, the other Select and First query’s expression tree is converted to the equivalent command tree built-below:

```csharp
internal static DbQueryCommandTree SelectAndFirstDbExpressions()
{
    MetadataWorkspace metadata = (AdventureWorks as IObjectContextAdapter).ObjectContext.MetadataWorkspace;
    TypeUsage stringTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
        .GetPrimitiveTypes(DataSpace.CSpace)
        .Single(type => type.ClrEquivalentType == typeof(string)));
    TypeUsage nameRowTypeUsage = TypeUsage.CreateDefaultTypeUsage(RowType.Create(
        Enumerable.Repeat(EdmProperty.Create(nameof(Product.Name), stringTypeUsage), 1),
        Enumerable.Empty<MetadataProperty>()));
    TypeUsage productTypeUsage = TypeUsage.CreateDefaultTypeUsage(metadata
        .GetType(nameof(Product), "CodeFirstDatabaseSchema", DataSpace.SSpace));
    EntitySet productEntitySet = metadata
        .GetEntityContainer("CodeFirstDatabase", DataSpace.SSpace)
        .GetEntitySetByName(nameof(Product), false);

    DbProjectExpression query = DbExpressionBuilder.Project(
        DbExpressionBuilder.BindAs(
            DbExpressionBuilder.Limit(
                DbExpressionBuilder.Scan(productEntitySet),
                DbExpressionBuilder.Constant(1)),
            "Limit1"),
        DbExpressionBuilder.New(
            nameRowTypeUsage,
            DbExpressionBuilder.Property(
                DbExpressionBuilder.Variable(productTypeUsage, "Limit1"), nameof(Product.Name))));
    DbQueryCommandTree commandTree = new DbQueryCommandTree(metadata, DataSpace.SSpace, query);
    Trace.WriteLine(commandTree);
    return commandTree;
}
```

And this abstract syntactic tree can be visualized as:

```csharp
DbQueryCommandTree
|_Parameters
|_Query
  |_DbProjectExpression (ExpressionKind = Project, ResultType = Collection(Row['Name' = Edm.String]))
    |_Input
    | |_DbExpressionBinding (VariableType = Product)
    |   |_VariableName = 'Limit1'
    |   |_Expression
    |     |_DbLimitExpression (ExpressionKind = Limit, ResultType = Collection(Product))
    |       |_Argument
    |       | |_DbScanExpression (ExpressionKind = Scan, ResultType = Collection(Product))
    |       |   |_Target = Products
    |       |_Limit
    |         |_DbConstantExpression (ExpressionKind = Constant, ResultType = Edm.Int32)
    |           |_Value = 1
    |_Projection
      |_DbNewInstanceExpression (ExpressionKind = NewInstance, ResultType = Row['Name' = Edm.String])
        |_Arguments
          |_DbPropertyExpression (ExpressionKind = Property, ResultType = Edm.String)
            |_Property = Product.Name
            |_Instance
              |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Product)
                |_VariableName = 'Limit1'
```

### Query methods translation

The above ExpressionConverter class is a huge class. It has tons of nested translator classes for all supported expression tree nodes. For example, ObjectQueryCallTranslator’s derived classes translates ObjectQuery<T> query method calls:

-   ObjectQueryCallTranslator

-   ObjectQueryMergeAsTranslator
-   etc.

SequenceMethodTranslator class’ derived classes translates the Queryable method calls:

-   SequenceMethodTranslator

-   OneLambdaTranslator

-   WhereTranslator
-   SelectTranslator

-   FirstTranslatorBase

-   FirstTranslator

-   etc.

These translators cover all supported Queryable query methods (see previous part for the list). During the conversion, each node’s NodeType is checked. If its NodeType is MethodCall, then this node is a MethodCallExpression node. And if current MethodCallExpression node’s Method property a Queryable.Where method, then the conversion is dispatched to WhereTranslator, which can translate MethodCallExpression node representing Queryable.Where to FilterDbExpression node. Similarly, SelectTranslator can translate MethodCallExpression node representing Queryable.Select to ProjectDbExpression node, FirstTranslator can translate MethodCallExpression node representing Queryable.First to LimitDbExpression node, etc.

### .NET APIs translation

The above Where query’s predicate has a string.StartsWith logic. Entity Framework has a StartsWithTranslator to translate MethodCallExpression node representing string.StartsWith to a DbLikeExpression. node. There are also many other translators for many .NET methods can properties. It is important to know whether a .NET API can be used for LINQ to Entities query, so here is the list:

-   CallTranslator
    -   HasFlagTranslator
        -   Enum: HasFlag
    -   CanonicalFunctionDefaultTranslator
        -   Math: Ceiling, Floor, Round, Abs
        -   decimal: Floor, Ceiling, Round
        -   string: Replace, ToLower, Trim
    -   MathTruncateTranslator
        -   Math: Truncate
    -   MathPowerTranslator
        -   Math: Pow
    -   GuidNewGuidTranslator
        -   Guid: NewGuid
    -   StringContainsTranslator
        -   string: Contains
    -   IndexOfTranslator
        -   string: IndexOf
    -   StartsWithTranslator
        -   string: StartsWith
    -   EndsWithTranslator:
        -   string: EndsWith
    -   SubstringTranslator
        -   string: Substring
    -   RemoveTranslator
        -   string: Remove
    -   InsertTranslator
        -   string: Insert
    -   IsNullOrEmptyTranslator
        -   string: IsNullOrEmpty
    -   StringConcatTranslator
        -   string: Concat
    -   ToStringTranslator
        -   string, byte, sbyte, short, int, long, double, float, Guid, DateTime, DateTimeOffset, TimeSpan, decimal, bool, object: ToString
    -   TrimTranslator
        -   string: Trim
    -   TrimStartTranslator
        -   string: TrimStart
    -   TrimEndTranslator
        -   string: TrimEnd
    -   VBCanonicalFunctionDefaultTranslator
        -   Microsoft.VisualBasic.Strings: Trim, LTrim, RTrim, Left, Right
        -   Microsoft.VisualBasic.DateAndTime: Year, Month, Day, Hour, Minute, Second
    -   VBCanonicalFunctionRenameTranslator
        -   Microsoft.VisualBasic.Strings: Len, Mid, UCase, LCase
    -   VBDatePartTranslator
        -   Microsoft.VisualBasic.DateAndTime, Microsoft.VisualBasic.DateInterval, Microsoft.VisualBasic.FirstDayOfWeek, Microsoft.VisualBasic.FirstWeekOfYear: DatePart
    -   SpatialMethodCallTranslator
        -   DbGeography: FromText, PointFromText, LineFromText, PolygonFromText, MultiPointFromText, MultiLineFromText, MultiPolygonFromText, GeographyCollectionFromText, FromBinary, PointFromBinary, LineFromBinary, PolygonFromBinary, MultiPointFromBinary, MultiLineFromBinary, MultiPolygonFromBinary, GeographyCollectionFromBinary, FromGm, AsBinary, AsGml, AsText, SpatialEquals, Disjoint, Intersects, Buffer, Distance, Intersection, Union, Difference, SymmetricDifference, ElementAt, PointAt
        -   DbGeometry: FromText, PointFromText, LineFromText, PolygonFromText, MultiPointFromText, MultiLineFromText, MultiPolygonFromText, GeometryCollectionFromText, FromBinary, PointFromBinary, LineFromBinary, PolygonFromBinary, MultiPointFromBinary, MultiLineFromBinary, MultiPolygonFromBinary, GeometryCollectionFromBinary, FromGml, AsBinary, AsGml, AsText, SpatialEquals, Disjoint, Intersects, Touches, Crosses, Within, Contains, Overlaps, Relate, Buffer, Distance, Intersection, Union, Difference, SymmetricDifference, ElementAt, PointAt, InteriorRingAt
-   LinqExpressionNormalizer, MethodCallTranslator
    -   Enumerable: Contains
    -   List<T>: Contains
-   PropertyTranslator
    -   DefaultCanonicalFunctionPropertyTranslator
        -   string: Length
        -   DateTime: Year, Month, Day, Hour, Minute, Second, Millisecond
        -   DateTimeOffset: Year, Month, Day, Hour, Minute, Second, Millisecond
    -   RenameCanonicalFunctionPropertyTranslator
        -   DateTime: Now, UtcNow
        -   DateTimeOffset: Now
        -   TimeSpan: Hours, Minutes, Seconds, Milliseconds
    -   VBDateAndTimeNowTranslator
        -   Microsoft.VisualBasic.DateAndTime: Now
    -   EntityCollectionCountTranslator
        -   EntityCollection<TEntity>: Count
    -   NullableHasValueTranslator
        -   Nullable<T>: HasValue
    -   NullableValueTranslator
        -   Nullable<T>: Value
    -   GenericICollectionTranslator
        -   ICollection<T>: Count
    -   SpatialPropertyTranslator
        -   DbGeography: CoordinateSystemId, SpatialTypeName, Dimension, IsEmpty, ElementCount, Latitude, Longitude, Elevation, Measure, Length, StartPoint, EndPoint, IsClosed, PointCount, Area
        -   DbGeometry: CoordinateSystemId, SpatialTypeName, Dimension, Envelope, IsEmpty, IsSimple, Boundary, IsValid, ConvexHull, ElementCount, XCoordinate, YCoordinate, Elevation, Measure, Length, StartPoint, EndPoint, IsClosed, IsRing, PointCount, Area, Centroid, PointOnSurface, ExteriorRing, InteriorRingCount
-   EqualsTranslator
    -   Primitive, enum and entity types: static Equals method with more then 1 parameters
    -   Primitive, enum and entity types: instance Equals methodwith more than 0 parameters
-   LessThanTranslator, LessThanOrEqualsTranslator, GreaterThanTranslator, GreaterThanOrEqualsTranslator

-   Primitive and enum type: static Compare method with more than 1 parameters and returning int
-   Primitive and enum type: instance CompareTo method with more than 0 parameters and returning int

For example, when a LINQ to Entities query has the string.IsNullOrEmpty logic:

```csharp
internal static DbQueryCommandTree StringIsNullOrEmptyDbExpressions()
{
    IQueryable<string> products = AdventureWorks.Products
        .Select(product => product.Name)
        .Where(name => string.IsNullOrEmpty(name));
    return AdventureWorks.Convert(products.Expression);
}
```

The predicate’s body is a simple MethodCallExpression expression:

```csharp
MethodCallExpression (NodeType = Call, Type = bool)
|_Method = string.IsNullOrEmpty
|_Object = null
|_Arguments
  |_ParameterExpression (NodeType = Parameter, Type = string)
    |_Name = "name"
```

Its translation is dispatched to IsNullOrEmptyTranslator, and it is translate to a DbComparisonExpression, representing a logic that calling database’s Edm.Length function with string variable, and comparing if the result equals to 0:

```csharp
DbComparisonExpression (ExpressionKind = Equals, ResultType = Edm.Boolean)
|_Left
| |_DbFunctionExpression (ExpressionKind = Function, ResultType = Edm.Int32)
|   |_Function = Edm.Length
|    |_Arguments
|     |_DbVariableReferenceExpression (ExpressionKind = VariableReference, ResultType = Edm.String)
|       |_VariableName = 'LQ2'
|_Right
    |_DbConstantExpression (ExpressionKind = Constant, ResultType = Edm.Int32)
    |_Value = 0
```

### Remote method call vs. local method call

Apparently Entity Framework cannot translate arbitrary .NET method to DbExpression. For example:

```csharp
private static bool FilterName(string name) => string.IsNullOrEmpty(name);

internal static void MethodPredicate()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IQueryable<string> products = source
        .Select(product => product.Name)
        .Where(name => FilterName(name)); // Define query.
    products.ForEach(product => Trace.WriteLine(product)); // Execute query.
    // NotSupportedException: LINQ to Entities does not recognize the method 'Boolean FilterName(Dixin.Linq.EntityFramework.Product)' method, and this method cannot be translated into a store expression.
}
```

This time string.IsNullOrEmpty is wrapped in a FilterName method. As a result, Entity Framework cannot understand how to convert FilterName call, and throws NotSupportedException. If an API cannot be translated to remote database query it can be called locally with LINQ to Objects:

```csharp
internal static void LocalMethodCall()
{
    IQueryable<Product> source = AdventureWorks.Products;
    IEnumerable<string> products = source
        .Select(product => product.Name) // LINQ to Entities.
        .AsEnumerable() // LINQ to Objects.
        .Where(name => FilterName(name)); // Define query.
    products.ForEach(product => Trace.WriteLine(product)); // Execute query.
}
```

### Database functions translation

Some .NET APIs have database translations, but not all database APIs has .NET built-in APIs to translated from, for example, there is no mapping .NET API for SQL database DATEDIFF function. Entity Framework provides mapping methods to address these scenarios. As fore mentioned, Entity Framework implements a provider model, and these mapping methods are provides in 2 levels too:

-   In EntityFramework.dll, System.Data.Entity.DbFunctions class provides mapping methods supported by all database provides, like DbFunctions.Reverse to reverse a string, DbFunction.AsUnicode to ensure a string is treated as Unicode, etc. These common database functions are also called [canonical functions](https://msdn.microsoft.com/en-us/library/bb738626.aspx).
-   In EntityFramework.SqlServer.dll, System.Data.Entity.SqlServer.SqlFunctions class provides mapping methods from SQL database functions, like SqlFunctions.Checksum method for CHECKSUM function, SqlFunctions.CurrentUser for CURRENT\_USER function, etc.

The following LINQ to Entities query calculates the number of days between current date/time and photo’s last modified date/time. It includes a MethodCallExpression representing a DbFunctions.DiffDays method call:

```csharp
internal static DbQueryCommandTree DbFunctionDbExpressions()
{
    var photos = AdventureWorks.ProductPhotos.Select(photo => new
    {
        FileName = photo.LargePhotoFileName,
        UnmodifiedDays = DbFunctions.DiffDays(photo.ModifiedDate, DateTime.Now)
    });
    return AdventureWorks.Convert(photos.Expression);
}
```

This MethodCallExpression node of DbFunctions.DiffDays is translated to a DbFunctionExpression node of canonical function Edm.DiffDays.

The following LINQ to Entities query filters the product’s Names with a pattern:

```csharp
internal static DbQueryCommandTree SqlFunctionDbExpressions()
{
    IQueryable<string> products = AdventureWorks.Products
        .Select(product => product.Name)
        .Where(name => SqlFunctions.PatIndex(name, "%o%a%") > 0);
    return AdventureWorks.Convert(products.Expression);
}
```

Here the MethodCallExpression node of SqlFunctions.PatIndex is translated to a DbFunctionExpression node of SQL database function SqlServer.PATINDEX.

## Database command tree to SQL

### DbExpressionVisitor<TResultType> and SqlGenerator

.NET provides System.Linq.Expressions.ExpressionVisitor class to traverse expression tree. Similarly, EntityFramework.dll provides an System.Data.Entity.Core.Common.CommandTrees.DbExpressionVisitor<TResultType> to traverse database command tree nodes:

```csharp
namespace System.Data.Entity.Core.Common.CommandTrees
{
    public abstract class DbExpressionVisitor<TResultType>
    {
        public abstract TResultType Visit(DbFilterExpression expression);

        public abstract TResultType Visit(DbProjectExpression expression);

        public abstract TResultType Visit(DbLimitExpression expression);

        public abstract TResultType Visit(DbScanExpression expression);

        public abstract TResultType Visit(DbPropertyExpression expression);

        public abstract TResultType Visit(DbVariableReferenceExpression expression);

        public abstract TResultType Visit(DbConstantExpression expression);

        // Other methods.
    }
}
```

This abstract class is implemented by the SqlGenerator class in EntityFramework.SqlServer.dll:

```csharp
namespace System.Data.Entity.SqlServer.SqlGen
{
    internal class SqlGenerator : DbExpressionVisitor<ISqlFragment>
    {
        internal string GenerateSql(DbQueryCommandTree tree, out HashSet<string> paramsToForceNonUnicode);

        // Other members.
    }
}
```

Just like above ExpressionConverter class, SqlGenerator is also a huge class. It traverses and processes all types of nodes in command tree.

### Database command tree to SQL

The following method can take database command tree and generate SQL:

```csharp
public static partial class DbContextExtensions
{
    public static DbCommand Generate(this IObjectContextAdapter context, DbQueryCommandTree commandTree)
    {
        context.NotNull(nameof(context));

        MetadataWorkspace metadataWorkspace = context.ObjectContext.MetadataWorkspace;
        StoreItemCollection itemCollection = (StoreItemCollection)metadataWorkspace
            .GetItemCollection(DataSpace.SSpace);
        DbCommandDefinition commandDefinition = SqlProviderServices.Instance
            .CreateCommandDefinition(itemCollection.ProviderManifest, commandTree);
        return commandDefinition.CreateCommand();
        // SqlVersion sqlVersion = (itemCollection.ProviderManifest as SqlProviderManifest).SqlVersion;
        // SqlGenerator sqlGenerator = new SqlGenerator(sqlVersion);
        // HashSet<string> paramsToForceNonUnicode;
        // string sql = sqlGenerator.GenerateSql(commandTree, out paramsToForceNonUnicode)
    }
}
```

Inside the last method call of CreateCommand, a SqlGenerator object is constructed with SQL database’s version (detected with SqlConnection.ServerVersion), and its GenerateSql method is called to generate SQL query text, then the text and parameters (DbQueryCommandTree.Parameters) are wrapped into a DbCommand object, which is returned to caller.

The above WhereAndSelectDbExpressions methods build command tree from scratch. Take it as an example:

```sql
internal static void WhereAndSelectDbExpressionsToSql()
{
    DbQueryCommandTree commandTree = WhereAndSelectDbExpressions();
    string sql = AdventureWorks.Generate(commandTree).CommandText;
    Trace.WriteLine(sql);
    // SELECT 
    //    [Extent1].[Name] AS [Name]
    //    FROM [Production].[Product] AS [Extent1]
    //    WHERE [Extent1].[Name] LIKE N'M%'
}
```

SqlGenerator traverses the command tree nodes, a specific Visit overloads is called for each supported node type. It generates SELECT clause from DbProjectionExpression node, FROM clause from DbScanExpression node, WHERE clause from DbFilterExpression node, LIKE operator from DbLikeExpression, etc.

In the other example, SelectAndFirstDbExpressions also builds command tree, so:

```sql
internal static void SelectAndFirstDbExpressionsToSql()
{
    DbQueryCommandTree commandTree = SelectAndFirstDbExpressions();
    string sql = AdventureWorks.Generate(commandTree).CommandText;
    Trace.WriteLine(sql);
    // SELECT TOP (1) 
    //    [c].[Name] AS [Name]
    //    FROM [Production].[Product] AS [c]
}
```

SqlGenerator generates TOP expression from DbLimitExpression node. Here SQL database’s version matters. Inside SqlGenerator.Visit overload for DbLimitExpression, TOP 1 is generated for SQL Server 2000 (8.0), and TOP (1) is generated for later version.

Other command trees above can be used to generate SQL in the same way:

```sql
internal static void StringIsNullOrEmptySql()
{
    string sql = AdventureWorks.Generate(StringIsNullOrEmptyDbExpressions()).CommandText;
    Trace.WriteLine(sql);
    // SELECT 
    //    [Extent1].[Name] AS [Name]
    //    FROM [Production].[Product] AS [Extent1]
    //    WHERE (LEN([Extent1].[Name])) = 0
}

internal static void DbFunctionSql()
{
    string sql = AdventureWorks.Generate(DbFunctionDbExpressions()).CommandText;
    Trace.WriteLine(sql);
    // SELECT 
    //    1 AS [C1], 
    //    [Extent1].[LargePhotoFileName] AS [LargePhotoFileName], 
    //    DATEDIFF (day, [Extent1].[ModifiedDate], SysDateTime()) AS [C2]
    //    FROM [Production].[ProductPhoto] AS [Extent1]
}

internal static void SqlFunctionSql()
{
    string sql = AdventureWorks.Generate(SqlFunctionDbExpressions()).CommandText;
    Trace.WriteLine(sql);
    // SELECT 
    //    [Extent1].[Name] AS [Name]
    //    FROM [Production].[Product] AS [Extent1]
    //    WHERE ( CAST(PATINDEX([Extent1].[Name], N'%o%a%') AS int)) > 0
}
```

## Log the translation

As demonstrated above, it is easy to log .NET expression tree by calling ToString(). The final SQL can be also logged in several ways, which is discussed in a previous part. However, logging the intermediate database command tree is not very straightforward.

### DbProviderServices and SqlProviderServices

In EntityFramework.dll, the provider model’s contract is defined with System.Data.Entity.Core.Common.DbProviderServices class:

```csharp
namespace System.Data.Entity.Core.Common
{
    public abstract class DbProviderServices : IDbDependencyResolver
    {
        protected abstract DbCommandDefinition CreateDbCommandDefinition(
            DbProviderManifest providerManifest, DbCommandTree commandTree);

        // Other members.
    }
}
```

Then in EntityFramework.SqlServer.dll, System.Data.Entity.SqlServer.SqlProviderServices class derives from the above abstract class, and represents the SQL database provider:

```csharp
namespace System.Data.Entity.SqlServer
{
    public sealed class SqlProviderServices : DbProviderServices
    {
        protected override DbCommandDefinition CreateDbCommandDefinition(
            DbProviderManifest providerManifest, DbCommandTree commandTree);

        // Other members.
    }
}
```

After Entity Framework translated expression tree to database command tree, it calls the database provider’s CreateDbCommandDefinition method for further SQL generation. So this method is where database command tree can be logged.

### Log database command tree

It could be easy to define a derived class of SqlProviderServices, and override the CreateDbCommandDefinition method. Unfortunately, SqlProviderServices is a sealed class. So a proxy class can be created:

```csharp
public partial class LogProviderServices : DbProviderServices
{
    private static readonly SqlProviderServices Sql = SqlProviderServices.Instance;

    private static object RedirectCall(
        Type[] argumentTypes, object[] arguments, [CallerMemberName] string methodName = null)
        => typeof(SqlProviderServices)
            .GetMethod(
                methodName,
                BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.InvokeMethod,
                null,
                argumentTypes,
                null)
            .Invoke(Sql, arguments);

    private static object RedirectCall<T>(T arg, [CallerMemberName] string methodName = null)
        => RedirectCall(new Type[] { typeof(T) }, new object[] { arg }, methodName);

    private static object RedirectCall<T1, T2>(T1 arg1, T2 arg2, [CallerMemberName] string methodName = null)
        => RedirectCall(new Type[] { typeof(T1), typeof(T2) }, new object[] { arg1, arg2 }, methodName);

    private static object RedirectCall<T1, T2, T3>(
        T1 arg1, T2 arg2, T3 arg3, [CallerMemberName] string methodName = null) => RedirectCall(
            new Type[] { typeof(T1), typeof(T2), typeof(T3) }, new object[] { arg1, arg2, arg3 }, methodName);
}
```

The above RedirectCall methods redirects method calls to the SqlProviderServices singleton object, represented by SqlProviderServices.Instance. Now in CreateDbCommandDefinition, just log the DbCommandTree parameter, and redirect the call:

```csharp
protected override DbCommandDefinition CreateDbCommandDefinition(
    DbProviderManifest providerManifest, DbCommandTree commandTree)
{
    Trace.WriteLine(commandTree);
    return (DbCommandDefinition)RedirectCall(providerManifest, commandTree);
}
```

For the other methods, just redirect them:

```csharp
public override void RegisterInfoMessageHandler(DbConnection connection, Action<string> handler)
        => Sql.RegisterInfoMessageHandler(connection, handler);

protected override DbCommand CloneDbCommand(DbCommand fromDbCommand)
    => (DbCommand)RedirectCall(fromDbCommand);

protected override void SetDbParameterValue(DbParameter parameter, TypeUsage parameterType, object value)
    => RedirectCall(parameter, parameterType, value);

protected override string GetDbProviderManifestToken(DbConnection connection)
    => (string)RedirectCall(connection);

protected override DbProviderManifest GetDbProviderManifest(string manifestToken)
    => (DbProviderManifest)RedirectCall(manifestToken);

protected override DbSpatialDataReader GetDbSpatialDataReader(DbDataReader fromReader, string versionHint)
    => (DbSpatialDataReader)RedirectCall<DbDataReader, string>(fromReader, versionHint);

protected override DbSpatialServices DbGetSpatialServices(string versionHint)
    => (DbSpatialServices)RedirectCall(versionHint);

protected override string DbCreateDatabaseScript(
    string providerManifestToken, StoreItemCollection storeItemCollection)
    => (string)RedirectCall(providerManifestToken, storeItemCollection);

protected override void DbCreateDatabase(
    DbConnection connection, int? commandTimeout, StoreItemCollection storeItemCollection)
    => RedirectCall(connection, commandTimeout, storeItemCollection);

protected override bool DbDatabaseExists(
    DbConnection connection, int? commandTimeout, StoreItemCollection storeItemCollection)
    => (bool)RedirectCall(connection, commandTimeout, storeItemCollection);

protected override bool DbDatabaseExists(
    DbConnection connection, int? commandTimeout, Lazy<StoreItemCollection> storeItemCollection)
    => (bool)RedirectCall(connection, commandTimeout, storeItemCollection);

protected override void DbDeleteDatabase(
    DbConnection connection, int? commandTimeout, StoreItemCollection storeItemCollection)
    => RedirectCall(connection, commandTimeout, storeItemCollection);
```

The final step is to register this new database provider with Entity Framework:

```csharp
public class LogConfiguration : DbConfiguration
{
    public LogConfiguration()
    {
        this.SetProviderServices(SqlProviderServices.ProviderInvariantName, new LogProviderServices());
    }
}
```

From now on, all LINQ to Entities queries’ database command tree will be logged. For example, executing above Where and Select query logs the following database command tree:

```csharp
DbQueryCommandTree
|_Parameters
|_Query : Collection{Record['Name'=Edm.String]}
  |_Project
    |_Input : 'Filter1'
    | |_Filter
    |   |_Input : 'Extent1'
    |   | |_Scan : CodeFirstDatabase.Product
    |   |_Predicate
    |     |_Like
    |       |_Var(Extent1).Name
    |       |_'M%'
    |       |_null
    |_Projection
      |_NewInstance : Record['Name'=Edm.String]
        |_Column : 'Name'
          |_Var(Filter1).Name
```

And the Select and First query logs the following:

```csharp
DbQueryCommandTree
|_Parameters
|_Query : Collection{Record['Name'=Edm.String]}
  |_Project
    |_Input : 'Limit1'
    | |_Limit
    |   |_Scan : CodeFirstDatabase.Product
    |   |_1
    |_Projection
      |_NewInstance : Record['Name'=Edm.String]
        |_Column : 'Name'
          |_Var(Limit1).Name
```