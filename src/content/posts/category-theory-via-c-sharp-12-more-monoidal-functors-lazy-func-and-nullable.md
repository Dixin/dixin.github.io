---
title: "Category Theory via C# (12) More Monoidal Functors: Lazy<>, Func<> And Nullable<>"
published: 2018-12-13
description: "Lazy<> should be the simplest monoid functor - it is just the lazy version of Tuple<>. And in these posts it will be considered as the Id<> monoidal functor."
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor](/posts/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor "https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor")**

## Lazy<> monoidal functor

Lazy<> should be the simplest monoid functor - it is just the lazy version of Tuple<>. And in these posts it will be considered as the Id<> monoidal functor.
```
// [Pure]
public static partial class LazyExtensions
{
    public static Lazy<TResult> Apply<TSource, TResult>
        (this Lazy<Func<TSource, TResult>> selectorFunctor, Lazy<TSource> source) =>
            new Lazy<TResult>(() => selectorFunctor.Value(source.Value));

    public static Lazy<T> Lazy<T>
        (this T value) => new Lazy<T>(() => value);

    // φ: Lazy<Lazy<T1>, Lazy<T2>> => Lazy<Lazy<T1, T2>>
    public static Lazy<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<Lazy<T1>, Lazy<T2>> binaryFunctor) =>
            new Func<T1, Func<T2, Lazy<T1, T2>>>(x => y => new Lazy<T1, T2>(x, y))
                .Lazy()
                .Apply(binaryFunctor.Value1)
                .Apply(binaryFunctor.Value2);

    // ι: Unit -> Lazy<Unit>
    public static Lazy<Unit> Unit
        (Unit unit) => unit.Lazy();
}
```

Tuple<> is similar to the [Haskell Id Applicative](https://hackage.haskell.org/package/base-4.8.0.0/docs/src/Data-Functor-Identity.html#line-85). The usage will be demonstrated in later tests unit.

## Func<> monoidal functor

Func<> is also monoidal functor:
```
// [Pure]
public static partial class FuncExtensions
{
    public static Func<TResult> Apply<TSource, TResult>
        (this Func<Func<TSource, TResult>> selectorFunctor, Func<TSource> source) =>
            () => selectorFunctor()(source());

    public static Func<T> Func<T>
        (this T value) => () => value;

    // φ: Lazy<Func<T1>, Func<T2>> => Func<Lazy<T1, T2>>
    public static Func<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<Func<T1>, Func<T2>> binaryFunctor) =>
            FuncExtensions.Func(new Func<T1, Func<T2, Lazy<T1, T2>>>(x => y => new Lazy<T1, T2>(x, y)))
                .Apply(binaryFunctor.Value1)
                .Apply(binaryFunctor.Value2);

    // ι: Unit -> Func<Unit>
    public static Func<Unit> Unit
        (Unit unit) => unit.Func();
}
```

## Nullable<> monoidal functor

Nullable<> created previously is monoidal functor too:
```
// [Pure]
public static partial class NullableExtensions
{
    public static Nullable<TResult> Apply<TSource, TResult>
        (this Nullable<Func<TSource, TResult>> selectorFunctor, Nullable<TSource> source) =>
            new Nullable<TResult>(() => selectorFunctor.HasValue && source.HasValue ?
                new Tuple<bool, TResult>(true, selectorFunctor.Value(source.Value)) :
                new Tuple<bool, TResult>(false, default(TResult)));

    public static Nullable<T> Nullable<T>
        (this T value) => new Nullable<T>(() => Tuple.Create(true, value));

    // φ: Lazy<Nullable<T1>, Nullable<T2>> => Nullable<Lazy<T1, T2>>
    public static Nullable<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<Nullable<T1>, Nullable<T2>> binaryFunctor) =>
            new Func<T1, Func<T2, Lazy<T1, T2>>>(x => y => new Lazy<T1, T2>(x, y))
                .Nullable()
                .Apply(binaryFunctor.Value1)
                .Apply(binaryFunctor.Value2);

    // ι: Unit -> Nullable<Unit>
    public static Nullable<Unit> Unit
        (Unit unit) => unit.Nullable();
}
```

## Unit tests
```
public partial class MonoidalFunctorTests
{
    [TestMethod()]
    public void LazyTest()
    {
        bool isExecuted1 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Lazy<int> query1 = addOne.Lazy().Apply(2.Lazy());
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.AreEqual(2 + 1, query1.Value); // Execution.
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        Assert.AreEqual(addOne.Lazy().Apply(1.Lazy()).Value, 1.Lazy().Select(addOne).Value);
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Assert.AreEqual(id.Lazy().Apply(1.Lazy()).Value, 1.Lazy().Value);
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<int, int> addTwo = x => x + 2;
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        Lazy<int> left1 = o.Lazy().Apply(addOne.Lazy()).Apply(addTwo.Lazy()).Apply(1.Lazy());
        Lazy<int> right1 = addOne.Lazy().Apply(addTwo.Lazy().Apply(1.Lazy()));
        Assert.AreEqual(left1.Value, right1.Value);
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        Assert.AreEqual(addOne.Lazy().Apply(1.Lazy()).Value, addOne(1).Lazy().Value);
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        Lazy<int> left2 = addOne.Lazy().Apply(1.Lazy());
        Lazy<int> right2 = new Func<Func<int, int>, int>(f => f(1)).Lazy().Apply(addOne.Lazy());
        Assert.AreEqual(left2.Value, right2.Value);
    }

    [TestMethod()]
    public void FuncTest()
    {
        bool isExecuted1 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Func<int> query1 = FuncExtensions.Func(addOne).Apply(2.Func());
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.AreEqual(addOne(2), query1()); // Execution.
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        Assert.AreEqual(FuncExtensions.Func(addOne).Apply(1.Func())(), 1.Func().Select(addOne)());
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Assert.AreEqual(FuncExtensions.Func(id).Apply(1.Func())(), 1.Func()());
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<int, int> addTwo = x => x + 2;
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        Func<int> left1 = FuncExtensions.Func(o).Apply(FuncExtensions.Func(addOne)).Apply(FuncExtensions.Func(addTwo)).Apply(1.Func());
        Func<int> right1 = FuncExtensions.Func(addOne).Apply(FuncExtensions.Func(addTwo).Apply(1.Func()));
        Assert.AreEqual(left1(), right1());
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        Assert.AreEqual(FuncExtensions.Func(addOne).Apply(1.Func())(), addOne(1).Func()());
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        Func<int> left2 = FuncExtensions.Func(addOne).Apply(1.Func());
        Func<int> right2 = FuncExtensions.Func(new Func<Func<int, int>, int>(f => f(1))).Apply(FuncExtensions.Func(addOne));
        Assert.AreEqual(left2(), right2());
    }

    [TestMethod()]
    public void FuncTest2()
    {
        bool isExecuted1 = false;
        Func<int, Func<int, string>> add = x => y =>
            { isExecuted1 = true; return (x + y).ToString(CultureInfo.InvariantCulture); };
        Func<string> query2 = FuncExtensions.Func(add).Apply(1.Func()).Apply(2.Func());
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.AreEqual(add(1)(2), query2()); // Execution.
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        Assert.AreEqual(FuncExtensions.Func(add).Apply(1.Func())()(2), 1.Func().Select(add)()(2));
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Assert.AreEqual(FuncExtensions.Func(id).Apply(1.Func())(), 1.Func()());
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<Func<int, string>, Func<int, int>> length = f => x => f(x).Length;
        Func<Func<Func<int, string>, Func<int, int>>, Func<Func<int, Func<int, string>>, Func<int, Func<int, int>>>> o =
            new Func<Func<Func<int, string>, Func<int, int>>, Func<int, Func<int, string>>, Func<int, Func<int, int>>>(FuncExtensions.o).Curry();
        Func<Func<int, int>> left1 = FuncExtensions.Func(o).Apply(FuncExtensions.Func(length)).Apply(FuncExtensions.Func(add)).Apply(1.Func());
        Func<Func<int, int>> right1 = FuncExtensions.Func(length).Apply(FuncExtensions.Func(add).Apply(1.Func()));
        Assert.AreEqual(left1()(2), right1()(2));
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        Assert.AreEqual(FuncExtensions.Func(add).Apply(1.Func())()(2), FuncExtensions.Func(add(1))()(2));
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        Func<Func<int, string>> left2 = FuncExtensions.Func(add).Apply(1.Func());
        Func<Func<int, string>> right2 = FuncExtensions.Func(new Func<Func<int, Func<int, string>>, Func<int, string>>(
                f => f(1))).Apply(FuncExtensions.Func(add));
        Assert.AreEqual(left2()(2), right2()(2));

        bool isExecuted3 = false;
        Func<string> consoleReadLine1 = () => "a";
        Func<string> consoleReadLine2 = () => "b";
        Func<string, Func<string, string>> concat = x => y =>
            { isExecuted3 = true; return string.Concat(x, y); };
        Func<string> concatLines = FuncExtensions.Func(concat).Apply(consoleReadLine1).Apply(consoleReadLine2);
        Assert.IsFalse(isExecuted3); // Laziness.
        Assert.AreEqual(string.Concat(consoleReadLine1(), consoleReadLine2()), concatLines());
        Assert.IsTrue(isExecuted3);
    }

    [TestMethod()]
    public void NullableTest()
    {
        bool isExecuted1 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Nullable<int> query1 = addOne.Nullable().Apply(2.Nullable());
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsTrue(query1.HasValue); // Execution.
        Assert.AreEqual(addOne(2), query1.Value);
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        Assert.AreEqual(addOne.Nullable().Apply(1.Nullable()).Value, 1.Nullable().Select(addOne).Value);
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Assert.AreEqual(id.Nullable().Apply(1.Nullable()).Value, 1.Nullable().Value);
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<int, int> addTwo = x => x + 2;
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        Nullable<int> left1 = o.Nullable().Apply(addOne.Nullable()).Apply(addTwo.Nullable()).Apply(1.Nullable());
        Nullable<int> right1 = addOne.Nullable().Apply(addTwo.Nullable().Apply(1.Nullable()));
        Assert.AreEqual(left1.Value, right1.Value);
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        Assert.AreEqual(addOne.Nullable().Apply(1.Nullable()).Value, addOne(1).Nullable().Value);
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        Nullable<int> left2 = addOne.Nullable().Apply(1.Nullable());
        Nullable<int> right2 = new Func<Func<int, int>, int>(f => f(1)).Nullable().Apply(addOne.Nullable());
        Assert.AreEqual(left2.Value, right2.Value);

        bool isExecuted2 = false;
        Func<int, int> addTwo2 = x => { isExecuted2 = true; return x + 2; };
        Nullable<int> query2 = addTwo2.Nullable().Apply(new Nullable<int>());
        Assert.IsFalse(isExecuted2); // Laziness.
        Assert.IsFalse(query2.HasValue); // Execution.
        Assert.IsFalse(isExecuted2);
    }
}
```