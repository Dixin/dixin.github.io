---
title: "Category Theory via C# (17) Monad-like Tuple<>, Task<>, IQueryable<> And IQbservable<>"
published: 2018-12-18
description: "Theoretically, Tuple<> should be counted as the Id<> monad. However, it is lack of laziness. In the context of C# and LINQ, it is only monad-like."
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads](/posts/category-theory-via-csharp-7-monad-and-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads")**

## Tuple<>: lack of laziness

Theoretically, Tuple<> should be counted as the Id<> monad. However, it is lack of laziness. In the context of C# and LINQ, it is only monad-like.

This is its SelectMany:
```
// [Pure]
public static partial class TupleExtensions
{
    // Required by LINQ.
    public static Tuple<TResult> SelectMany<TSource, TSelector, TResult>
        (this Tuple<TSource> source,
         Func<TSource, Tuple<TSelector>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            new Tuple<TResult>(resultSelector(source.Item1, selector(source.Item1).Item1));

    // Not required, just for convenience.
    public static Tuple<TResult> SelectMany<TSource, TResult>
        (this Tuple<TSource> source, Func<TSource, Tuple<TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

which can implement μ, η, φ, ι, Select:
```
// [Pure]
public static partial class TupleExtensions
{
    // μ: Tuple<Tuple<T> => Tuple<T>
    public static Tuple<TResult> Flatten<TResult>
        (this Tuple<Tuple<TResult>> source) => source.SelectMany(Functions.Id);

    // η: T -> Tuple<T> is already implemented previously as TupleExtensions.Tuple.

    // φ: Lazy<Tuple<T1>, Tuple<T2>> => Tuple<Lazy<T1, T2>>
    public static Tuple<Lazy<T1, T2>> Binary2<T1, T2>
        (this Lazy<Tuple<T1>, Tuple<T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Tuple<TUnit> is already implemented previously with η: T -> Tuple<T>.

    // Select: (TSource -> TResult) -> (Tuple<TSource> -> Tuple<TResult>)
    public static Tuple<TResult> Select2<TSource, TResult>
        (this Tuple<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Tuple());
}
```

Tuple<> is most close to the [Haskell Id Monad](https://hackage.haskell.org/package/base-4.8.0.0/docs/src/Data-Functor-Identity.html#line-89).

## Task<>: lack of purity

Task<> also seems monadic, but is lack of purity. This is the SelectMany for Task<>:
```
// Impure.
public static partial class TaskExtensions
{
    // Required by LINQ.
    public static async Task<TResult> SelectMany<TSource, TSelector, TResult>
        (this Task<TSource> source,
         Func<TSource, Task<TSelector>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            resultSelector(await source, await selector(await source));

    // Not required, just for convenience.
    public static Task<TResult> SelectMany<TSource, TResult>
        (this Task<TSource> source, Func<TSource, Task<TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

which can implement μ, η, φ, ι, Select:
```
// Impure.
public static partial class TaskExtensions
{
    // μ: Task<Task<T> => Task<T>
    public static Task<TResult> Flatten<TResult>
        (this Task<Task<TResult>> source) => source.SelectMany(Functions.Id);

    // η: T -> Task<T> is already implemented previously as TaskExtensions.Task.

    // φ: Lazy<Task<T1>, Task<T2>> => Task<Lazy<T1, T2>>
    public static Task<Lazy<T1, T2>> Binary2<T1, T2>
        (this Lazy<Task<T1>, Task<T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Task<TUnit> is already implemented previously with η: T -> Task<T>.

    // Select: (TSource -> TResult) -> (Task<TSource> -> Task<TResult>)
    public static Task<TResult> Select2<TSource, TResult>
        (this Task<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Task());
}
```

### Task<> and LINQ

With above SelectMany, Task<> can be used in LINQ syntax:
```
Func<string, Task<string>> query = url =>
    from httpResponseMessage in new HttpClient().GetAsync(url) // Returns Task<HttpResponseMessage>
    from html in httpResponseMessage.Content.ReadAsStringAsync() // Returns Task<string>
    select html;
string result = await query("https://weblogs.asp.net/dixin");
```

### Non-generic Task

Task<T> is a wrapper of Func<T> and Task is a wrapper of Action. Actually Action can be viewed as Func<Void>, so that Task can be viewed as Task<Void>. Since C# compiler does not allow Void to be used in this way, Task can be just viewed as Task<Unit>. In this way, Task become like monad too.
```
// Impure.
public static partial class TaskExtensions
{
    // Required by LINQ.
    public static async Task<TResult> SelectMany<TSelector, TResult>(
        this Task source,
        Func<Unit, Task<TSelector>> selector,
        Func<Unit, TSelector, TResult> resultSelector)
    {
        await source;
        return resultSelector(null, await selector(null));
    }

    // Not required, just for convenience.
    public static Task<TResult> SelectMany<TResult>
        (this Task source, Func<Unit, Task<TResult>> selector) => source.SelectMany(selector, Functions.False);
}
```

so that
```
// Impure.
public static partial class TaskExtensions
{
    // η: Unit -> Task.
    public static Task Task(Unit unit) => System.Threading.Tasks.Task.Run(() => { });

    // ι: TUnit -> Task is already implemented previously with η: Unit -> Task.

    // Select: (Unit -> TResult) -> (Task -> Task<TResult>)
    public static Task<TResult> Select<TResult>
        (this Task source, Func<Unit, TResult> selector) => source.SelectMany(value => selector(value).Task());
}
```

## IQueryable<> is like a monad

[IQueryable<>](/posts/understanding-linq-to-sql-2-iqueryable-lt-t-gt) has been discussed a lot in [previous posts](/archive/?tag=LINQ%20to%20SQL). It looks like monad, with laziness and purity:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    var query = from category in database.Categories
                from product in category.Products
                select new { category.CategoryName, product.ProductName }; // Laziness

    query.ForEach(value => { }); // Execution.
}
```

Or equivalently:
```
using (NorthwindDataContext database = new NorthwindDataContext())
{
    var query = database.Categories.SelectMany(
        category => category.Products, 
        (category, product) => new { category.CategoryName, product.ProductName }); // Laziness

    query.ForEach(value => { }); // Execution.
}
```

However, this is its SelectMany implementation:
```
// [Pure]
public static partial class QueryableExtensions
{
    public static IQueryable<TResult> SelectMany<TSource, TCollection, TResult>
        (this IQueryable<TSource> source,
         Expression<Func<TSource, IEnumerable<TCollection>>> collectionSelector,
         Expression<Func<TSource, TCollection, TResult>> resultSelector) => 
            source.Provider.CreateQuery<TResult>(Expression.Call(
                null, 
                ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(
                    new Type[] { typeof(TSource), typeof(TCollection), typeof(TResult) }),
                new Expression[]
                    {
                        source.Expression,
                        Expression.Quote(collectionSelector),
                        Expression.Quote(resultSelector)
                    }));

    public static IQueryable<TResult> SelectMany<TSource, TResult>
        (this IQueryable<TSource> source,
         Expression<Func<TSource, IEnumerable<TResult>>> selector) => 
            source.Provider.CreateQuery<TResult>(Expression.Call(
                null, 
                ((MethodInfo)MethodBase.GetCurrentMethod()).MakeGenericMethod(
                    new Type[] { typeof(TSource), typeof(TResult) }),
                new Expression[] { source.Expression, Expression.Quote(selector) }));
}
```

As [discussed before](/posts/understanding-csharp-3-0-features-6-lambda-expression), when working with IQueryable<T>, the lambda expressions are not functions but [data structure - an abstract syntax tree](/posts/understanding-linq-to-sql-3-expression-tree). So that a lambda-like expression trees in the query can be compiled to something else - here a T-SQL query:

```sql
SELECT [t0].[CategoryName], [t1].[ProductName]
FROM [dbo].[Categories] AS [t0], [dbo].[Products] AS [t1]
WHERE [t1].[CategoryID] = [t0].[CategoryID]
```

This is a very powerful feature of C# language and LINQ.

## IQbservable<> is also like a monad

[IQbservable<>](https://msdn.microsoft.com/en-us/library/system.reactive.linq.iqbservable.aspx) is provided by [System.Reactive.Interfaces](http://www.nuget.org/packages/Rx-Interfaces/), a part of [Rx (Reactive Extensions)](https://msdn.microsoft.com/en-us/data/gg577609.aspx). It is the queryable version of [IObservable<>](https://msdn.microsoft.com/en-us/library/dd990377.aspx), works similarly with expression lambda-like expression trees.

Here are 2 samples of Qbservable providers:

-   [Qbservable provider for WMI events (LINQ to WQL)](https://social.msdn.microsoft.com/Forums/en-US/d459291a-4245-45ba-8888-35e07f7cf5b2/rx-sample-of-qbservable-provider-for-wmi-events-linq-to-wql?forum=rx)
-   [Qbservable provider for TCP](http://rxx.codeplex.com/wikipage?title=TCP%20Qbservable%20Provider)

## Unit tests

Following unit tests demonstrate the usage of monadic Tuple<> and Task<>. Notice Tuple is lack of laziness, and Task<>’s SelectMany extension method work for both cold tasks and hot tasks.
```
public partial class MonadTests
{
    [TestMethod()]
    public void TupleTest()
    {
        bool isExecuted = false;
        Tuple<int> one = new Tuple<int>(1);
        Tuple<int> two = new Tuple<int>(2);
        Func<int, Func<int, int>> add = x => y => { isExecuted = true; return x + y; };
        Tuple<int> query = from x in one
                            from y in two
                            from _ in one
                            select add(x)(y);
        Assert.IsTrue(isExecuted); // No laziness.
        Assert.AreEqual(1 + 2, query.Item1); // Execution.

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Tuple<int>> addOne = x => (x + 1).Tuple();
        Tuple<int> left = 1.Tuple().SelectMany(addOne);
        Tuple<int> right = addOne(1);
        Assert.AreEqual(left.Item1, right.Item1);
        // Monad law 2: M.SelectMany(Monad) == M
        Tuple<int> M = 1.Tuple();
        left = M.SelectMany(TupleExtensions.Tuple);
        right = M;
        Assert.AreEqual(left.Item1, right.Item1);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Tuple<int>> addTwo = x => (x + 2).Tuple();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Item1, right.Item1);
    }

    [TestMethod()]
    public void HotTaskTest()
    {
        Task<string> a = Task.Run(() => "a");
        Task<string> b = Task.Run(() => "b");
        Func<string, Func<string, string>> concat = x => y => x + y;
        Task<string> query1 = from x in a
                                from y in b
                                from _ in a
                                select concat(x)(y);
        Assert.AreEqual("a" + "b", query1.Result);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Task<int>> addOne = x => (x + 1).Task();
        Task<int> left = 1.Task().SelectMany(addOne);
        Task<int> right = addOne(1);
        Assert.AreEqual(left.Result, right.Result);
        // Monad law 2: M.SelectMany(Monad) == M
        Task<int> M = 1.Task();
        left = M.SelectMany(TaskExtensions.Task);
        right = M;
        Assert.AreEqual(left.Result, right.Result);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        M = 1.Task();
        Func<int, Task<int>> addTwo = x => (x + 2).Task();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Result, right.Result);
    }

    [TestMethod()]
    public void ColdTaskTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        bool isExecuted3 = false;
        Task<string> a = new Task<string>(() => { isExecuted1 = true; return "a"; });
        Task<string> b = new Task<string>(() => { isExecuted2 = true; return "b"; });
        Func<string, Func<string, string>> concat = x => y => { isExecuted3 = true; return x + y; };
        Task<string> query = from x in a
                                from y in b
                                from _ in a
                                select concat(x)(y);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        Assert.IsFalse(isExecuted3); // Laziness.
        a.Start(); // Execution.
        b.Start(); // Execution.
        Assert.AreEqual("a" + "b", query.Result);
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
        Assert.IsTrue(isExecuted3);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        List<Task<int>> addOneTasks = new List<Task<int>>();
        Func<int, Task<int>> addOne = x =>
        {
            Task<int> task = (x + 1).Task(true);
            addOneTasks.Add(task);
            return task;
        };
        Task<int> one = 1.Task(true);
        Task<int> left = one.SelectMany(addOne);
        Task<int> right = addOne(1);
        one.Start();
        while (addOneTasks.Count < 2) { }
        addOneTasks.ForEach(task => task.Start());
        Assert.AreEqual(left.Result, right.Result);
        // Monad law 2: M.SelectMany(Monad) == M
        Task<int> M = 1.Task(true);
        left = M.SelectMany(TaskExtensions.Task);
        right = M;
        M.Start();
        Assert.AreEqual(left.Result, right.Result);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        addOneTasks.Clear();
        List<Task<int>> addTwoTasks = new List<Task<int>>();
        M = 1.Task(true);
        Func<int, Task<int>> addTwo = x =>
        {
            Task<int> task = (x + 1).Task(true);
            addTwoTasks.Add(task);
            return task;
        };
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        M.Start();
        while (addOneTasks.Count < 2) { }
        addOneTasks.ForEach(task => task.Start());
        while (addTwoTasks.Count < 2) { }
        addTwoTasks.ForEach(task => task.Start());
        Assert.AreEqual(left.Result, right.Result);
    }
}
```