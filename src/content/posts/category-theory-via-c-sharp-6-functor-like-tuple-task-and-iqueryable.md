---
title: "Category Theory via C# (6) Functor-like Tuple<>, Task<> And IQueryable<>"
published: 2018-12-07
description: "Tuple<> looks like the simplest functor by just wrapping a value. It is most close to the [Identity functor of Haskell](http://hackage.haskell.org/package/transformers-0.4.3.0/docs/Data-Functor-Identi"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-3-functor-and-linq-to-functors](/posts/category-theory-via-csharp-3-functor-and-linq-to-functors "https://weblogs.asp.net/dixin/category-theory-via-csharp-3-functor-and-linq-to-functors")**

## Tuple<> is like a functor

Tuple<> looks like the simplest functor by just wrapping a value. It is most close to the [Identity functor of Haskell](http://hackage.haskell.org/package/transformers-0.4.3.0/docs/Data-Functor-Identity.html). Its Select functions are:

```csharp
[Pure]
public static partial class TupleExtensions
{
    // C# specific functor pattern.
    public static Tuple<TResult> Select<TSource, TResult>
        (this Tuple<TSource> source, Func<TSource, TResult> selector) =>
            new Tuple<TResult>(selector(source.Item1));

    // General abstract functor definition of Tuple<>: DotNet -> DotNet.
    public static IMorphism<Tuple<TSource>, Tuple<TResult>, DotNet> Select<TSource, TResult>
        (/* this */ IMorphism<TSource, TResult, DotNet> selector) => 
            new DotNetMorphism<Tuple<TSource>, Tuple<TResult>>(source => source.Select(selector.Invoke));
}
```

Now Tuple<> can be recognized functor by compiler, so the LINQ syntax applies:

```csharp
Tuple<int> tupleFunctor = new Tuple<int>(0);
Tuple<int> query = from x in tupleFunctor select x + 1;
```

### Tuple< , > is also like a functor

Tuple< , > can also be functor-like:

```csharp
// [Pure]
public static partial class TupleExtensions
{
    // C# specific functor pattern.
    public static Tuple<TResult, T2> Select<TSource, TResult, T2>
        (this Tuple<TSource, T2> source, Func<TSource, TResult> selector) => 
            new Tuple<TResult, T2>(selector(source.Item1), source.Item2);

    // General abstract functor definition of Tuple< , >: DotNet -> DotNet.
    public static IMorphism<Tuple<TSource, T2>, Tuple<TResult, T2>, DotNet> Select<TSource, TResult, T2>
        (this IMorphism<TSource, TResult, DotNet> selector) => 
            new DotNetMorphism<Tuple<TSource, T2>, Tuple<TResult, T2>>(source => source.Select(selector.Invoke));
}
```

The Select function just apply selector with the first value, and use the second value remains. In LINQ:

```csharp
Tuple<int, string> functor = new Tuple<int, string>(0, "text");
Tuple<bool, string> query = from x in functor select x > 0;
```

Similar Select functions can be implemented for Tuple< , ,>, Tuple< , , ,>, … too.

## Laziness vs. eagerness

Unlike previous Lazy, Func<>, Nullable<> functors, there is no laziness for these 2 LINQ queries above. When queries are constructed, selector functions (x + 1 and x > 0) are already applied. Again, a tuple is just a wrapper of value(s). Computing a immediate value is required to construct each query, which is a tuple.

The following unit tests demonstrates tuples fully satisfy functor laws but are lack of laziness.

```csharp
public partial class FunctorTests
{
    [TestMethod()]
    public void TupleTest()
    {
        bool isExecuted1 = false;
        Tuple<int> tuple = new Tuple<int>(0);
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };

        Tuple<int> query1 = from x in tuple select addOne(x); // Execution when constructing query.
        Assert.IsTrue(isExecuted1); // No laziness.

        Assert.AreEqual(0 + 1, query1.Item1);
        Assert.IsTrue(isExecuted1);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(tuple.Select(Functions.Id).Item1, Functions.Id(tuple).Item1);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<int, string> addTwo = x => (x + 2).ToString(CultureInfo.InvariantCulture);
        Tuple<string> query2 = tuple.Select(addTwo.o(addOne));
        Tuple<string> query3 = tuple.Select(addOne).Select(addTwo);
        Assert.AreEqual(query2.Item1, query3.Item1);
    }

    [TestMethod()]
    public void Tuple2Test()
    {
        bool isExecuted1 = false;
        Tuple<int, string> tuple = new Tuple<int, string>(0, "a");
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };

        Tuple<int, string> query1 = from x in tuple select addOne(x); // Execution.
        Assert.IsTrue(isExecuted1); // No laziness.

        Assert.AreEqual(0 + 1, query1.Item1);
        Assert.AreEqual("a", query1.Item2);
        Assert.IsTrue(isExecuted1);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(tuple.Select(Functions.Id).Item1, Functions.Id(tuple).Item1);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<int, string> addTwo = x => (x + 2).ToString(CultureInfo.InvariantCulture);
        Tuple<string, string> query2 = tuple.Select(addTwo.o(addOne));
        Tuple<string, string> query3 = tuple.Select(addOne).Select(addTwo);
        Assert.AreEqual(query2.Item1, query3.Item1);
    }
}
```

Comparing to functors in previous part, Lazy<T> is a lazy version of Tuple<T>.

## Task<T> is like a functor too

With the [async/await](/archive/?tag=Async) feature of C# 5.0, Select is easy to implement for Task<T>:

```csharp
// Impure.
public static partial class TaskExtensions
{
    public static async Task<TResult> Select<TSource, TResult>
        (this Task<TSource> source, Func<TSource, TResult> selector) => selector(await source);
}
```

Unlike any previous Select implementations, the \[Pure\] tag is missing. Yes, this Select is impure. As explained in [another post](/posts/understanding-c-sharp-async-await-1-compilation), the await keyword will be compiled to a state machine, and executing this Select function will start the state machine. This Select function cannot be considered to be a pure function.

## Purity vs. impurity

A function can be considered [pure](http://en.wikipedia.org/wiki/Pure_function) if:

-   It returns the same value when given the same argument(s).
-   It does not change state.
-   It does not cause semantically observable [side effect](http://en.wikipedia.org/wiki/Side_effect_\(computer_science\)). Every function application has side effect (like consuming certain amount of energy with the CPU), but here only semantically observable side effect matters.

Here are some examples of pure functions:

-   All functions/lambda expressions in the [lambda calculus](/archive/?tag=Lambda%20Calculus) posts.
-   [Math.Sin](https://msdn.microsoft.com/en-us/library/system.math.sin.aspx)
-   Func<int> zero = () => 0
-   Func<int, bool> isPositive = x => x > 0
-   The Select functions for IEnumerable<>, Tuple<>, Lazy<>, Func<>, Nullable<>
-   The [built-in query methods](/posts/understanding-linq-to-objects-3-query-methods) for IEnumerable<>

and examples of impure functions:

-   [Random.Next](https://msdn.microsoft.com/en-us/library/9b3ta19y.aspx), which may return different value for each application
-   IO: [File.ReadAllText](https://msdn.microsoft.com/en-us/library/ms143368.aspx)/[File.WriteAllText](https://msdn.microsoft.com/en-us/library/ms143375.aspx), [WebClient.DownloadStringTaskAsync](https://msdn.microsoft.com/en-us/library/hh138332.aspx). [Console.Write](https://msdn.microsoft.com/en-us/library/hebffx2d.aspx)/[Console.Read](https://msdn.microsoft.com/en-us/library/system.console.read.aspx) for console application, [MessageBox.Show](https://msdn.microsoft.com/en-us/library/ms598674.aspx) for WPF, …
-   async method with await keyword, which [creates a state machine and start it](/posts/understanding-c-sharp-async-await-1-compilation)
-   EnumerableEx.ForEach, and [foreach iteration](https://msdn.microsoft.com/en-us/library/vstudio/ttw7t8t6.aspx) on a IEnumerable<T>, which changes that IEnumerable<T>’s state.
-   [Task.Start](https://msdn.microsoft.com/en-us/library/dd270682.aspx)/[CancellationTokenSource.Cancel](https://msdn.microsoft.com/en-us/library/dd321703.aspx), which can change the state of Task.
    
-   [DataContext.SubmitChanges](https://msdn.microsoft.com/en-us/library/system.data.linq.datacontext.submitchanges.aspx) in [LINQ to SQL](/posts/understanding-linq-to-sql-7-data-changing)

### Purity and category theory

In a category, it does not make sense if a morphism (an arrow from one object to another object) becomes uncertain, or changes state, or causes side effects. So here in DotNet category, where morphisms becomes C#/.NET functions, these C#/.NET functions must be pure. Usually in C# programming, side effects and purity is not specially managed, but here in the category theory posts, function’s purity will be carefully taken care of.

### Purity and .NET

C# language is not designed to be purely functional, neither are .NET framework libraries. To demonstrate this, an easy way is to use [Mono.Cecil library](https://www.nuget.org/packages/Mono.Cecil/):

> Install-Package Mono.Cecil

Then the following function:

```csharp
public static partial class ReflectionHelper
{
    public static IEnumerable<MethodDefinition> GetMethods
        (string assemblyPath, bool isPublicOnly) =>
            from module in AssemblyDefinition.ReadAssembly(assemblyPath).Modules
            from type in module.Types
            from method in type.Methods
            where !isPublicOnly || method.IsPublic
            select method;
}
```

can be used to query the public methods in a library. Take mscorlib.dll as example:

```csharp
string mscorlib = new Uri(typeof(object).Assembly.GetName().EscapedCodeBase).AbsolutePath;
int methodsCount = ReflectionHelper.GetMethods(mscorlib, true).Count();
```

There are 15627 public methods in mscorlib.dll.

The following function:

```csharp
public static partial class ReflectionHelper
{
    public static IEnumerable<MethodDefinition> GetMethods<TAttribute>
        (string assemblyPath, bool isPublicOnly)
        where TAttribute : Attribute =>
            from method in GetMethods(assemblyPath, isPublicOnly)
            where method.CustomAttributes.Any(attribute => attribute.AttributeType.FullName.Equals(
                typeof (TAttribute).FullName, StringComparison.Ordinal))
            select method;
}
```

can be used to query pure methods of a library, that is, how many methods are tagged with \[Pure\] attribute in its contract reference assembly. For mscorlib.all, just query mscorlib.contracts.dll:

```csharp
const string mscorlibContracts = @"C:\Program Files (x86)\Microsoft\Contracts\Contracts\.NETFramework\v4.5\mscorlib.Contracts.dll";
int pureMethodsCount = ReflectionHelper.GetMethods<PureAttribute>(mscorlibContracts, true).Count();
```

The result is, in mscorlib.dll, only 1202 (about 8%) public methods are pure (attributed with \[Pure\] in mscorlib.contracts.dll).

Here Mono.Cecil’s AssemblyDefinition.ReadAssembly is used instead of .NET built in Assembly.Load:

```csharp
public static partial class ReflectionHelper
{
    public static IEnumerable<MethodInfo> _GetMethods<TAttribute>
        (string assemblyPath, bool isPublicOnly)
        where TAttribute : Attribute =>
            from type in Assembly.Load(AssemblyName.GetAssemblyName(assemblyPath)).GetTypes()
            from method in type.GetMethods()
            where (!isPublicOnly || method.IsPublic) 
                    && method.GetCustomAttributes(typeof (TAttribute), false).Any()
            select method;
}
```

because when getting types from special assemblies like mscorlib.contracts.dll:

```csharp
int pureMethodsCount = ReflectionHelper._GetMethods<PureAttribute>(mscorlibContracts, true).Count();
```

Assembly.GetTypes() throws exception:

> Could not load type 'System.Object' from assembly 'mscorlib.Contracts, Version=0.0.0.0, Culture=neutral, PublicKeyToken=188286aac86319f9' because the parent does not exist.

This is a demonstration of Linq to Object

One last thing to notice: in C#/.NET world, there is no analysis tools to identify the purity of any API. \[Pure\] is used based on manual analysis.

## Purity, laziness and LINQ

When working with LINQ to Objects, one great feature is LINQ query has no side effect:

```csharp
IEnumerable<int> functor = Enumerable.Range(0, 3);
Func<int, int> selector = x => x + 1;
IEnumerable<int> query = from x in functor where x > 0 select selector(x);
// At runtime, here execution of query is deferred, the selector function is guaranteed not applied.
```

Here the query is a cold IEnumerable<T>. selector’s application is guaranteed to be deferred because the query methods (Select/Where/… functions) are pure functions. Such purity and laziness are expected in LINQ query.

### Functor vs. functor-like

At compile time, C# compiler does not have knowledge about laziness. In the case of Tuple<>:

```csharp
Tuple<int> functor = new Tuple<int>(0);
Func<int, int> selector = x => x + 1;
Tuple<int> query = from x in functor select selector(x);
// At runtime, here the selector function is already applied.
```

Theoretically, Tuple<> is a functor (again, just like the Identity functor in Haskell). However, in these C# posts, because its unexpected behavior (lack of laziness) in LINQ query, it will only be called functor-like.

At compile time, C# compiler does not have knowledge about side effect or purity either. With the help of above (impure) Select extension method, the LINQ syntax still works with Task<T>:

```csharp
Task<int> functorial = Task.Run(() => 0);
Func<int, int> selector = x => x + 1;
Task<int> query = from x in functorial select selector(x);
// At runtime, here query is not used yet, but the selector function may be already applied, or not.
```

This usage looks as “functorial” as any other LINQ to Objects examples. The big difference is, this query can be a hot Task<int>, and the application of selector is unpredictable. When query is created, selector may be not applied, being applied, or already applied.

Also consider the equivalent selecting/mapping of morphisms in DotNet category:

```csharp
// General abstract functor definition is invalid.
public static IMorphism<Task<TSource>, Task<TResult>, DotNet> _Select<TSource, TResult>(
    this IMorphism<TSource, TResult, DotNet> selector)
{
    return new DotNetMorphism<Task<TSource>, Task<TResult>>(source => source.Select(selector.Invoke));
}
```

The new impure DotNetMorphism in DotNet category becomes an invalid morphism because of the impurity. So Task<T> is not a functor. Just like in the lambda calculus posts, this function is prefixed with a underscore, meaning it is syntactically legal in C#, but semantically invalid in category theory.

In these posts, the term “functor”, “functorial”, “functor-like” will be carefully used:

-   Something is functor/functorial: it is fully a functor and work with LINQ syntax. As fore mentioned, Lazy<>, Func<>, Nullable<> are all functors like the built-in IEnumerable<>.
-   Something is functor-like: it looks like functor and can be work with LINQ syntax for C# functor, but strictly it is not a functor. Tuple<>, Task<> are functor-like. When using them in LINQ, their behavior can be unexpected.

## IQueryable<> is also like a functor

In the LINQ to SQL part, IQueryable<>’s Select extension method is used a lot:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    var results = from product in source
                  select new
                      {
                          product.ProductName,
                          product.UnitPrice
                      }; // Laziness

    results.ForEach(value => { }); // Execution
}
```

Or equivalently:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    IQueryable<Product> source = database.Products;
    var results = source.Select(product => new
                    {
                        product.ProductName,
                        product.UnitPrice
                    }); // Laziness

    results.ForEach(value => { }); // Execution
}
```

If looking into the implementation of Select:

```csharp
[Pure]
public static partial class QueryableExtensions
{
    public static IQueryable<TResult> Select<TSource, TResult>
        (this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector) => 
            source.Provider.CreateQuery<TResult>(Expression.Call(
                null, 
                ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(
                    new Type[] { typeof(TSource), typeof(TResult) }),
                new Expression[] { source.Expression, Expression.Quote(selector) }));
}
```

As [discussed before](/posts/understanding-csharp-3-0-features-6-lambda-expression), when working with IQueryable<T>, the lambda expressions are not functions but [data structure - an abstract syntax tree](/posts/understanding-linq-to-sql-3-expression-tree). So that a lambda-like expression trees in the query can be compiled to something else - here a T-SQL query:

```sql
SELECT [t0].[ProductName], [t0].[UnitPrice]
FROM [dbo].[Products] AS [t0]
```

This is a very powerful feature of C# language and LINQ.

## Hot task vs. cold task, and unit tests

The following unit tests demonstrate above Select function for Task<T> works for both hot (already started) and cold (not yet started) tasks:

```csharp
[TestClass()]
public class FunctorialTests
{
    [TestMethod()]
    public void HotTaskTest()
    {
        bool isExecuted1 = false;
        Task<string> hotTask = System.Threading.Tasks.Task.Run(() => "a");
        Func<string, string> append = x => { isExecuted1 = true; return x + "b"; };

        Task<string> query1 = from x in hotTask select append(x);
        Assert.AreEqual("a" + "b", query1.Result);
        Assert.IsTrue(isExecuted1);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(hotTask.Select(Functions.Id).Result, Functions.Id(hotTask).Result);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<string, int> length = x => x.Length;
        Task<int> query2 = hotTask.Select(length.o(append));
        Task<int> query3 = hotTask.Select(append).Select(length);
        Assert.AreEqual(query2.Result, query3.Result);
    }

    [TestMethod()]
    public void ColdTaskTest()
    {
        bool isExecuted2 = false;
        bool isExecuted1 = false;
        Task<string> coldTask = new Task<string>(() => { isExecuted2 = true; return "c"; });
        Func<string, string> append = x => { isExecuted1 = true; return x + "d"; };

        Task<string> query1 = from x in coldTask select append(x);
        Assert.IsFalse(isExecuted2);
        Assert.IsFalse(isExecuted1);

        coldTask.Start();
        Assert.AreEqual("c" + "d", query1.Result);
        Assert.IsTrue(isExecuted2);
        Assert.IsTrue(isExecuted1);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(coldTask.Select(Functions.Id).Result, Functions.Id(coldTask).Result);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        coldTask = new Task<string>(() => "c");
        Func<string, int> length = x => x.Length;
        Task<int> query2 = coldTask.Select(length.o(append));
        Task<int> query3 = coldTask.Select(append).Select(length);
        coldTask.Start();
        Assert.AreEqual(query2.Result, query3.Result);
    }
}
```