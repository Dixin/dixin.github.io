---
title: "Category Theory via C# (13) Monoidal Functor-like Tuple<> And Task<>"
published: 2018-12-14
description: "Theoretically, Tuple<> should be counted as the Id<> monoidal functor. However, as previously mentioned, it is lack of laziness."
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor](/posts/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor "https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor")**

## Tuple<>: lack of laziness

Theoretically, Tuple<> should be counted as the Id<> monoidal functor. However, as previously mentioned, it is lack of laziness.
```
// [Pure]
public static partial class TupleExtensions
{
    public static Tuple<TResult> Apply<TSource, TResult>
        (this Tuple<Func<TSource, TResult>> selectorFunctor, Tuple<TSource> source) =>
            new Tuple<TResult>(selectorFunctor.Item1(source.Item1));

    public static Tuple<T> Tuple<T>
        (this T value) => new Tuple<T>(value);

    // φ: Lazy<Tuple<T1>, Tuple<T2>> => Tuple<Lazy<T1, T2>>
    public static Tuple<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<Tuple<T1>, Tuple<T2>> binaryFunctor) =>
            new Func<T1, Func<T2, Lazy<T1, T2>>>(x => y => new Lazy<T1, T2>(x, y))
                .Tuple()
                .Apply(binaryFunctor.Value1)
                .Apply(binaryFunctor.Value2);

    // ι: Unit -> Tuple<Unit>
    public static Tuple<Unit> Unit
        (Unit unit) => unit.Tuple();
}
```

Tuple<> is most close to the [Haskell Id Applicative](https://hackage.haskell.org/package/base-4.8.0.0/docs/src/Data-Functor-Identity.html#line-85).

## Task<>: lack of purity

Task<> also seems monoidal functor, but is lack of purity:
```
// Impure.
public static partial class TaskExtensions
{
    public static async Task<TResult> Apply<TSource, TResult>
        (this Task<Func<TSource, TResult>> selectorFunctor, Task<TSource> source) =>
            (await selectorFunctor)(await source);

    public static Task<T> Task<T>
        (this T value) => System.Threading.Tasks.Task.FromResult(value);

    // φ: Lazy<Task<T1>, Task<T2>> => Task<Lazy<T1, T2>>
    public static Task<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<Task<T1>, Task<T2>> binaryFunctor) =>
            new Func<T1, Func<T2, Lazy<T1, T2>>>(x => y => new Lazy<T1, T2>(x, y))
                .Task()
                .Apply(binaryFunctor.Value1)
                .Apply(binaryFunctor.Value2);

    // ι: Unit -> Func<Unit>
    public static Task<Unit> Unit
        (Unit unit) => unit.Task();
}
```

## Unit tests

Following unit tests demonstrate the usage of Tuple<> and Task<>. Notice Tuple is lack of laziness, and Task<>’s extension methods work for both cold tasks and hot tasks.
```
public partial class MonoidalFunctorTests
{
    [TestMethod()]
    public void TupleTest()
    {
        bool isExecuted1 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Tuple<int> query1 = addOne.Tuple().Apply(2.Tuple());
        Assert.IsTrue(isExecuted1); // No laziness.
        Assert.AreEqual(2 + 1, query1.Item1); // Execution.
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        Assert.AreEqual(addOne.Tuple().Apply(1.Tuple()).Item1, 1.Tuple().Select(addOne).Item1);
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Assert.AreEqual(id.Tuple().Apply(1.Tuple()).Item1, 1.Tuple().Item1);
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<int, int> addTwo = x => x + 2;
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        Tuple<int> left1 = o.Tuple().Apply(addOne.Tuple()).Apply(addTwo.Tuple()).Apply(1.Tuple());
        Tuple<int> right1 = addOne.Tuple().Apply(addTwo.Tuple().Apply(1.Tuple()));
        Assert.AreEqual(left1.Item1, right1.Item1);
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        Assert.AreEqual(addOne.Tuple().Apply(1.Tuple()).Item1, addOne(1).Tuple().Item1);
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        Tuple<int> left2 = addOne.Tuple().Apply(1.Tuple());
        Tuple<int> right2 = new Func<Func<int, int>, int>(f => f(1)).Tuple().Apply(addOne.Tuple());
        Assert.AreEqual(left2.Item1, right2.Item1);
    }

    [TestMethod()]
    public void HotTaskTest()
    {
        bool isExecuted1 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Task<Func<int, int>> hotAddOne = Task.Run(() => addOne);
        Task<int> hotTwo = Task.Run(() => 2);
        Task<int> query1 = hotAddOne.Apply(hotTwo);
        Assert.AreEqual(2 + 1, query1.Result);
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        Assert.AreEqual(addOne.Task().Apply(1.Task()).Result, 1.Task().Select(addOne).Result);
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Assert.AreEqual(id.Task().Apply(1.Task()).Result, 1.Task().Result);
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<int, int> addTwo = x => x + 2;
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        Task<int> left1 = o.Task().Apply(addOne.Task()).Apply(addTwo.Task()).Apply(1.Task());
        Task<int> right1 = addOne.Task().Apply(addTwo.Task().Apply(1.Task()));
        Assert.AreEqual(left1.Result, right1.Result);
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        Assert.AreEqual(addOne.Task().Apply(1.Task()).Result, addOne(1).Task().Result);
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        Task<int> left2 = addOne.Task().Apply(1.Task());
        Task<int> right2 = new Func<Func<int, int>, int>(f => f(1)).Task().Apply(addOne.Task());
        Assert.AreEqual(left2.Result, right2.Result);
    }

    [TestMethod()]
    public void ColdTaskTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Task<Func<int, int>> coldAddOne = new Task<Func<int, int>>(() => addOne);
        Task<int> coldTwo = new Task<int>(() => { isExecuted2 = true; return 2; });
        Task<int> query2 = coldAddOne.Apply(coldTwo);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        coldAddOne.Start(); // Execution.
        coldTwo.Start(); // Execution.
        Assert.AreEqual(2 + 1, query2.Result);
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);

        // f.Functor().Apply(F) == F.Select(f)
        coldAddOne = new Task<Func<int, int>>(() => addOne);
        coldTwo = new Task<int>(() => 2);
        Task<int> left = coldAddOne.Apply(coldTwo);
        Task<int> right = coldTwo.Select(addOne);
        coldAddOne.Start();
        coldTwo.Start();
        Assert.AreEqual(left.Result, right.Result);
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        Task<Func<int, int>> coldId = new Task<Func<int, int>>(() => id);
        coldTwo = new Task<int>(() => 2);
        left = coldId.Apply(coldTwo);
        right = coldTwo;
        coldId.Start();
        coldTwo.Start();
        Assert.AreEqual(left.Result, right.Result);
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        coldAddOne = new Task<Func<int, int>>(() => addOne);
        Func<int, int> addTwo = x => x + 2;
        Task<Func<int, int>> coldAddTwo = new Task<Func<int, int>>(() => addTwo);
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        Task<Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>>> coldComposite =
            new Task<Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>>>(() => o);
        coldTwo = new Task<int>(() => 2);
        left = coldComposite.Apply(coldAddOne).Apply(coldAddTwo).Apply(coldTwo);
        right = coldAddOne.Apply(coldAddTwo.Apply(coldTwo));
        coldComposite.Start();
        coldAddOne.Start();
        coldAddTwo.Start();
        coldTwo.Start();
        Assert.AreEqual(left.Result, right.Result);
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        coldAddOne = new Task<Func<int, int>>(() => addOne);
        coldTwo = new Task<int>(() => 2);
        left = coldAddOne.Apply(coldTwo);
        right = new Task<int>(() => addOne(2));
        coldAddOne.Start();
        coldTwo.Start();
        right.Start();
        Assert.AreEqual(left.Result, right.Result);
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        coldAddOne = new Task<Func<int, int>>(() => addOne);
        coldTwo = new Task<int>(() => 2);
        left = coldAddOne.Apply(coldTwo);
        Task<Func<Func<int, int>, int>> coldApplyTwo =
            new Task<Func<Func<int, int>, int>>(() => f => f(2));
        right = coldApplyTwo.Apply(coldAddOne);
        coldAddOne.Start();
        coldTwo.Start();
        coldApplyTwo.Start();
        Assert.AreEqual(left.Result, right.Result);
    }
}
```