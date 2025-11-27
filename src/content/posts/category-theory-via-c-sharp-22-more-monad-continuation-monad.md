---
title: "Category Theory via C# (22) More Monad: Continuation Monad"
published: 2018-12-23
description: "In C#, callback is frequently used. For example, a very simple Add function, without asynchrony:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads](/posts/category-theory-via-csharp-8-more-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads")**

## Continuation and continuation-passing style

In C#, callback is frequently used. For example, a very simple Add function, without asynchrony:

```csharp
// [Pure]
public static partial class Cps
{
    // Add = (x, y) => x + y
    public static int Add
        (int x, int y) => x + y;
}
```

With a callback, it becomes:

```csharp
// AddWithCallback = (x, y, callback) => callback(x + y)
public static TCallback AddWithCallback<TCallback>
    (int x, int y, Func<int, TCallback> callback) => callback(x + y);
```

In functional programming, a continuation is like a callback. [Continuation-passing style (CPS)](http://en.wikipedia.org/wiki/Continuation-passing_style) is a style of programming to pass the control to a [continuation](http://en.wikipedia.org/wiki/Continuation), just like in above example, (x + y) is calculated then passed to the callback.

For convenience, AddWithCallback can be curried a little bit:

```csharp
// AddWithCallback = (x, y) => callback => callback(x + y)
public static Func<Func<int, TCallback>, TCallback> AddWithCallback<TCallback>
    (int x, int y) => callback => callback(x + y);
```

So that all the apperances of TCallback are in the return type Func<Func<int, TCallback>, TCallback>, then an alias Cps can be defined to make the code shorter:

```csharp
// Cps<T, TContinuation> is alias of Func<Func<T, TContinuation>, TContinuation>
public delegate TContinuation Cps<out T, TContinuation>(Func<T, TContinuation> continuation);
```

Now a continuation-passing style function AddCps can be defined, which is exactly the same as above:

```csharp
// AddCps = (x, y) => continuation => continuation(x + y)
public static Cps<int, TContinuation> AddCps<TContinuation>
    (int x, int y) => continuation => continuation(x + y);
```

Other examples are the SquareCps and SumOfSquareCps functions:

```csharp
// SquareCps = x => continuation => continuation(x * x)
public static Cps<int, TContinuation> SquareCps<TContinuation>
    (int x) => continuation => continuation(x * x);

// SumOfSquaresCps = (x, y) => continuation => SquareCps(x)(xx => SquareCps(y)(yy => AddCps(xx)(yy)(continuation)));
public static Cps<int, TContinuation> SumOfSquaresCps<TContinuation>
    (int x, int y) => continuation =>
        SquareCps<TContinuation>(x)(xx =>
            SquareCps<TContinuation>(y)(yy =>
                AddCps<TContinuation>(xx, yy)(continuation)));
```

In this case, CPS makes code and algorithms harder to understand and maintain.

## Continuation monad

SelectMany can be implemented for Cps<T, TContinuation>:

```csharp
[Pure]
public static partial class CpsExtensions
{
    // Required by LINQ.
    public static Cps<TResult, TContinuation> SelectMany<TSource, TSelector, TResult, TContinuation>
        (this Cps<TSource, TContinuation> source,
         Func<TSource, Cps<TSelector, TContinuation>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            continuation => source(sourceArg =>
                selector(sourceArg)(selectorArg => 
                    continuation(resultSelector(sourceArg, selectorArg))));

    // Not required, just for convenience.
    public static Cps<TResult, TContinuation> SelectMany<TSource, TResult, TContinuation>
        (this Cps<TSource, TContinuation> source, Func<TSource, Cps<TResult, TContinuation>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

so that:

```csharp
// [Pure]
public static partial class CpsExtensions
{
    // η: T -> Cps<T, TContinuation>
    public static Cps<T, TContinuation> Cps<T, TContinuation>
        (this T arg) => continuation => continuation(arg);

    // φ: Lazy<Cps<T1, TContinuation>, Cps<T2, TContinuation>> => Cps<Lazy<T1, T2>, TContinuation>
    public static Cps<Lazy<T1, T2>, TContinuation> Binary<T1, T2, TContinuation>
        (this Lazy<Cps<T1, TContinuation>, Cps<T2, TContinuation>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Cps<TUnit, TContinuation>
    public static Cps<Unit, TContinuation> Unit<TContinuation>
        (Unit unit) => unit.Cps<Unit, TContinuation>();

    // Select: (TSource -> TResult) -> (Cps<TSource, TContinuation> -> Cps<TResult, TContinuation>)
    public static Cps<TResult, TContinuation> Select<TSource, TResult, TContinuation>
        (this Cps<TSource, TContinuation> source, Func<TSource, TResult> selector) =>
            // continuation => source(sourceArg => continuation(selector(sourceArg)));
            // continuation => source(continuation.o(selector));
            source.SelectMany(value => selector(value).Cps<TResult, TContinuation>());
}
```

Cps< , > is a monad, monoidal functor, and functor.

## Monad laws, and unit tests

2 helper functions can be created:

```csharp
// [Pure]
public static partial class CpsExtensions
{
    public static Func<T, TContinuation> NoCps<T, TContinuation>
        (this Func<T, Cps<TContinuation, TContinuation>> cps) => arg => cps(arg)(Functions.Id);

    public static T Invoke<T>
        (this Cps<T, T> cps) => cps(Functions.Id);
}
```

So the unit test becomes easy:

```csharp
public partial class MonadTests
{
    [TestMethod()]
    public void ContinuationTest()
    {
        bool isExecuted1 = false;
        Func<int, Func<int, Func<string, string>>> f = x => y => z =>
            {
                isExecuted1 = true;
                return (x + y + z.Length).ToString(CultureInfo.InstalledUICulture);
            };
        Cps<string, int> query = from x in 1.Cps<int, int>()
                                    from y in 2.Cps<int, int>()
                                    from z in "abc".Cps<string, int>()
                                    select f(x)(y)(z);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.AreEqual((1 + 2 + "abc".Length).ToString(CultureInfo.InstalledUICulture).Length, query(x => x.Length)); // Execution.
        Assert.IsTrue(isExecuted1);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Cps<int, int>> addOne = x => (x + 1).Cps<int, int>();
        Cps<int, int> left = 1.Cps<int, int>().SelectMany(addOne);
        Cps<int, int> right = addOne(1);
        Assert.AreEqual(left.Invoke(), right.Invoke());
        // Monad law 2: M.SelectMany(Monad) == M
        Cps<int, int> M = 1.Cps<int, int>();
        left = M.SelectMany(CpsExtensions.Cps<int, int>);
        right = M;
        Assert.AreEqual(left.Invoke(), right.Invoke());
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Cps<int, int>> addTwo = x => (x + 2).Cps<int, int>();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Invoke(), right.Invoke());
    }
}
```

And following is unit test for continuation functor, which also demonstrate the CPS version of [factorial](http://en.wikipedia.org/wiki/Factorial):

```csharp
public partial class FunctorTests
{
    [TestMethod()]
    public void ContinuationTest()
    {
        Func<int, Cps<int, int>> factorialCps = null; // Must have.
        factorialCps = x => x == 0
            ? 1.Cps<int, int>()
            : (from y in factorialCps(x - 1)
               select x * y);
        Func<int, int> factorial = factorialCps.NoCps();
        Assert.AreEqual(3 * 2 * 1, factorial(3));

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(factorialCps(3).Select(Functions.Id).Invoke(), Functions.Id(factorialCps(3)).Invoke());
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<int, int> addOne = x => x + 1;
        Func<int, int> addTwo = x => x + 2;
        Cps<int, int> cps1 = factorialCps(3).Select(addTwo.o(addOne));
        Cps<int, int> cps2 = factorialCps(3).Select(addOne).Select(addTwo);
        Assert.AreEqual(cps1.Invoke(), cps2.Invoke());
    }
}
```