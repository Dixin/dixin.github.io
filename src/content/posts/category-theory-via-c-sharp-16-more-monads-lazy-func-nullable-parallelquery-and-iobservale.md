---
title: "Category Theory via C# (16) More Monads: Lazy<>, Func<>, Nullable<>, ParallelQuery<> And IObservale<>"
published: 2018-12-17
description: "Again, Lazy<> is the simplest monad, it is just the lazy version of Tuple<>, and should be considered as the Id<> monad. This is the implementation of its SelectMany:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads](/posts/category-theory-via-csharp-7-monad-and-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads")**

## Lazy<> monad

Again, Lazy<> is the simplest monad, it is just the lazy version of Tuple<>, and should be considered as the Id<> monad. This is the implementation of its SelectMany:
```
// [Pure]
public static partial class LazyExtensions
{
    // Required by LINQ.
    public static Lazy<TResult> SelectMany<TSource, TSelector, TResult>
        (this Lazy<TSource> source, 
         Func<TSource, Lazy<TSelector>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            new Lazy<TResult>(() => resultSelector(source.Value, selector(source.Value).Value));

    // Not required, just for convenience.
    public static Lazy<TResult> SelectMany<TSource, TResult>
        (this Lazy<TSource> source, Func<TSource, Lazy<TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

So that Lazy<> is a monad, a monoidal functor, and a functor:
```
// [Pure]
public static partial class LazyExtensions
{
    // μ: Lazy<Lazy<T> => Lazy<T>
    public static Lazy<TResult> Flatten<TResult>
        (this Lazy<Lazy<TResult>> source) => source.SelectMany(Functions.Id);

    // η: T -> Lazy<T> is already implemented previously as LazyExtensions.Lazy.

    // φ: Lazy<Lazy<T1>, Lazy<T2>> => Lazy<Lazy<T1, T2>>
    public static Lazy<Lazy<T1, T2>> Binary2<T1, T2>
        (this Lazy<Lazy<T1>, Lazy<T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Lazy<TUnit> is already implemented previously with η: T -> Lazy<T>.

    // Select: (TSource -> TResult) -> (Lazy<TSource> -> Lazy<TResult>)
    public static Lazy<TResult> Select2<TSource, TResult>
        (this Lazy<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Lazy());
}
```

Lazy<> is similar to the [Haskell Id Monad](https://hackage.haskell.org/package/base-4.8.0.0/docs/src/Data-Functor-Identity.html#line-89). The usage will be demonstrated in unit tests later.

## Func<> monad

SelectMany can be implemented for Func<> too:
```
// [Pure]
public static partial class FuncExtensions
{
    // Required by LINQ.
    public static Func<TResult> SelectMany<TSource, TSelector, TResult>
        (this Func<TSource> source,
         Func<TSource, Func<TSelector>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            () =>
                {
                    TSource sourceValue = source();
                    return resultSelector(sourceValue, selector(sourceValue)());
                };

    // Not required, just for convenience.
    public static Func<TResult> SelectMany<TSource, TResult>
        (this Func<TSource> source, Func<TSource, Func<TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

So that Func<> is a monad, a monoidal functor, and a functor:
```
// [Pure]
public static partial class FuncExtensions
{
    // μ: Func<Func<T> => Func<T>
    public static Func<TResult> Flatten<TResult>
        (this Func<Func<TResult>> source) => source.SelectMany(Functions.Id);

    // η: T -> Func<T> is already implemented previously as FuncExtensions.Func.

    // φ: Lazy<Func<T1>, Func<T2>> => Func<Lazy<T1, T2>>
    public static Func<Lazy<T1, T2>> Binary2<T1, T2>
        (this Lazy<Func<T1>, Func<T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Func<TUnit> is already implemented previously with η: T -> Func<T>.

    // Select: (TSource -> TResult) -> (Func<TSource> -> Func<TResult>)
    public static Func<TResult> Select2<TSource, TResult>
        (this Func<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Func());
}
```

## Nullable<> monad

And this is the SelectMany for Nullable<>:
```
// [Pure]
public static partial class NullableExtensions
{
    // Required by LINQ.
    public static Nullable<TResult> SelectMany<TSource, TSelector, TResult>
        (this Nullable<TSource> source,
         Func<TSource, Nullable<TSelector>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            new Nullable<TResult>(() =>
                {
                    if (source.HasValue)
                    {
                        Nullable<TSelector> selectorResult = selector(source.Value);
                        if (selectorResult.HasValue)
                        {
                            return Tuple.Create(true, resultSelector(source.Value, selectorResult.Value));
                        }
                    }

                    return Tuple.Create(false, default(TResult));
                });

    // Not required, just for convenience.
    public static Nullable<TResult> SelectMany<TSource, TResult>
        (this Nullable<TSource> source, Func<TSource, Nullable<TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

So that Nullable<> is a monad, a monoidal functor, and a functor:
```
// [Pure]
public static partial class NullableExtensions
{
    // μ: Nullable<Nullable<T> => Nullable<T>
    public static Nullable<TResult> Flatten<TResult>
        (this Nullable<Nullable<TResult>> source) => source.SelectMany(Functions.Id);

    // η: T -> Nullable<T> is already implemented previously as NullableExtensions.Nullable.

    // φ: Lazy<Nullable<T1>, Nullable<T2>> => Nullable<Lazy<T1, T2>>
    public static Nullable<Lazy<T1, T2>> Binary2<T1, T2>
        (this Lazy<Nullable<T1>, Nullable<T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Nullable<TUnit> is already implemented previously with η: T -> Nullable<T>.

    // Select: (TSource -> TResult) -> (Nullable<TSource> -> Nullable<TResult>)
    public static Nullable<TResult> Select2<TSource, TResult>
        (this Nullable<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Nullable());
}
```

## ParallelQuery<> monad

Parallel LINQ provides ParallelQuery<> monad. This is its SelectMany:
```
[Pure]
public static class ParallelEnumerable
{
    public static ParallelQuery<TResult> SelectMany<TSource, TCollection, TResult>
        (this ParallelQuery<TSource> source,
         Func<TSource, IEnumerable<TCollection>> collectionSelector,
         Func<TSource, TCollection, TResult> resultSelector) =>
            new SelectManyQueryOperator<TSource, TCollection, TResult>(
                source, collectionSelector, null, resultSelector);
}
```

The implementation of System.Linq.Parallel.SelectManyQueryOperator<TLeftInput, TRightInput, TOutput> class is a big parallel computing topic and will be skipped in these category theory posts.

ParallelQuery<> can be used with laziness and purity:
```
ParallelQuery<int> query = from value in Enumerable.Range(0, 1000).AsParallel()
                           from repeat in Enumerable.Repeat(value, 2)
                           select repeat; // Laziness.

query.ForAll(Console.WriteLine); // Execution.
```

Above code is just an example of using ParallelQuery<> monad with LINQ syntax. In real world parallel query, [some performance pitfalls](https://msdn.microsoft.com/en-us/library/dd997403.aspx) has to be noticed.

## IObservable<> monad

[IObservable<>](https://msdn.microsoft.com/en-us/library/dd990377.aspx) is built-in in mscorlib. Then [Rx (Reactive Extensions)](https://msdn.microsoft.com/en-us/data/gg577609.aspx) makes IObservable<> a monad. In [System.Reactive.Linq.dll](http://www.nuget.org/packages/Rx-Linq/), [SelectMany](https://msdn.microsoft.com/en-us/library/system.reactive.linq.observable.selectmany.aspx) is implemented for IObservable<>:
```
public static class Observable
{
    public static IObservable<TResult> SelectMany<TSource, TCollection, TResult>
        (this IObservable<TSource> source,
         Func<TSource, IObservable<TCollection>> collectionSelector,
         Func<TSource, TCollection, TResult> resultSelector) =>
            new SelectMany<TSource, TCollection, TResult>(
                source, collectionSelector, resultSelector);
}
```

System.Reactive.Linq.ObservableImpl.SelectMany<TSource, TCollection, TResult> class’s source code can be viewed [on github here](https://github.com/Reactive-Extensions/Rx.NET/blob/master/Rx.NET/Source/System.Reactive.Linq/Reactive/Linq/Observable/SelectMany.cs).

So IObservable becomes a monad andcan be used in LINQ with laziness and purity:
```
IObservable<int> query = from value in Observable.Range(0, 1000)
                         from repeat in Observable.Repeat(value, 2)
                         select repeat; // Laziness.
query = query.Do(value => Console.WriteLine("Do")); // Laziness.

query.Subscribe(Console.WriteLine); // Execution.
```

Another example is the MouseDrag event implementation in WPF:
```
[Pure]
public static class UIElementExtensions
{
    public static IObservable<EventPattern<MouseEventArgs>> MouseDrag
        (this UIElement element) =>
            from _ in Observable.FromEventPattern<MouseEventArgs>(element, nameof(element.MouseDown))
            from @event in Observable.FromEventPattern<MouseEventArgs>(element, nameof(element.MouseMove))
                .TakeUntil(Observable.FromEventPattern<MouseEventArgs>(element, nameof(element.MouseUp)))
            select @event;
}
```

The observing starts from MouseDown event, then keep taking MouseMove event, until MouseUp event is observed. So that:
```
element.MouseDrag()
    .Subscribe(@event => OnMouseDrag(@event.EventArgs));
```

## Unit tests
```
public partial class MonadTests
{
    [TestMethod()]
    public void LazyTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        bool isExecuted3 = false;
        Lazy<int> one = new Lazy<int>(() => { isExecuted1 = true; return 1; });
        Lazy<int> two = new Lazy<int>(() => { isExecuted2 = true; return 2; });
        Func<int, Func<int, int>> add = x => y => { isExecuted3 = true; return x + y; };
        Lazy<int> query = from x in one
                            from y in two
                            from _ in one
                            select add(x)(y);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        Assert.IsFalse(isExecuted3); // Laziness.
        Assert.AreEqual(1 + 2, query.Value); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
        Assert.IsTrue(isExecuted3);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Lazy<int>> addOne = x => (x + 1).Lazy();
        Lazy<int> left = 1.Lazy().SelectMany(addOne);
        Lazy<int> right = addOne(1);
        Assert.AreEqual(left.Value, right.Value);
        // Monad law 2: M.SelectMany(Monad) == M
        Lazy<int> M = 1.Lazy();
        left = M.SelectMany(LazyExtensions.Lazy);
        right = M;
        Assert.AreEqual(left.Value, right.Value);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Lazy<int>> addTwo = x => (x + 2).Lazy();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Value, right.Value);
    }

    [TestMethod()]
    public void FuncTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        bool isExecuted3 = false;
        bool isExecuted4 = false;
        Func<int> f1 = () => { isExecuted1 = true; return 1; };
        Func<int> f2 = () => { isExecuted2 = true; return 2; };
        Func<int, int> f3 = x => { isExecuted3 = true; return x + 1; };
        Func<int, Func<int, int>> f4 = x => y => { isExecuted4 = true; return x + y; };
        Func<int> query1 = from x in f1
                            from y in f2
                            from z in f3.Partial(y)
                            from _ in "abc".Func()
                            let f4x = f4(x)
                            select f4x(z);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        Assert.IsFalse(isExecuted3); // Laziness.
        Assert.IsFalse(isExecuted4); // Laziness.
        Assert.AreEqual(1 + 2 + 1, query1()); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
        Assert.IsTrue(isExecuted3);
        Assert.IsTrue(isExecuted4);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Func<int>> addOne = x => (x + 1).Func();
        Func<int> left = 1.Func().SelectMany(addOne);
        Func<int> right = addOne(1);
        Assert.AreEqual(left(), right());
        // Monad law 2: M.SelectMany(Monad) == M
        Func<int> M = 1.Func();
        left = M.SelectMany(FuncExtensions.Func);
        right = M;
        Assert.AreEqual(left(), right());
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Func<int>> addTwo = x => (x + 2).Func();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left(), right());

        bool isExecuted5 = false;
        bool isExecuted6 = false;
        bool isExecuted7 = false;
        Func<int, int> f5 = x => { isExecuted5 = true; return x + 1; };
        Func<string, int> f6 = x => { isExecuted6 = true; return x.Length; };
        Func<int, Func<int, string>> f7 = x => y =>
        { isExecuted7 = true; return new string('a', x + y); };
        Func<int, Func<string, string>> query2 = a => b =>
            (from x in f5(a).Func()
                from y in f6(b).Func()
                from z in 0.Func()
                select f7(x)(y))();
        Assert.IsFalse(isExecuted5); // Laziness.
        Assert.IsFalse(isExecuted6); // Laziness.
        Assert.IsFalse(isExecuted7); // Laziness.
        Assert.AreEqual(new string('a', 1 + 1 + "abc".Length), query2(1)("abc")); // Execution.
        Assert.IsTrue(isExecuted5);
        Assert.IsTrue(isExecuted6);
        Assert.IsTrue(isExecuted7);
    }

    [TestMethod()]
    public void NullableTest()
    {
        bool isExecuted1 = false;
        Func<int, Func<int, string>> add = x => y =>
        { isExecuted1 = true; return (x + y).ToString(CultureInfo.InvariantCulture); };
        Nullable<int> nullable1 = new Nullable<int>();
        Nullable<int> nullable2 = new Nullable<int>();
        Nullable<string> query1 = from x in nullable1
                                    from y in nullable2
                                    from _ in nullable1
                                    select add(x)(y);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(query1.HasValue); // Execution.
        Assert.IsFalse(isExecuted1);

        bool isExecuted3 = false;
        bool isExecuted4 = false;
        bool isExecuted5 = false;
        add = x => y =>
        { isExecuted3 = true; return (x + y).ToString(CultureInfo.InvariantCulture); };
        Nullable<int> one = new Nullable<int>(() =>
        { isExecuted4 = true; return Tuple.Create(true, 1); });
        Nullable<int> two = new Nullable<int>(() =>
        { isExecuted5 = true; return Tuple.Create(true, 2); });
        Nullable<string> query2 = from x in one
                                    from y in two
                                    from _ in one
                                    select add(x)(y);
        Assert.IsFalse(isExecuted3); // Laziness.
        Assert.IsFalse(isExecuted4); // Laziness.
        Assert.IsFalse(isExecuted5); // Laziness.
        Assert.IsTrue(query2.HasValue); // Execution.
        Assert.AreEqual("3", query2.Value);
        Assert.IsTrue(isExecuted3);
        Assert.IsTrue(isExecuted4);
        Assert.IsTrue(isExecuted5);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Nullable<int>> addOne = x => (x + 1).Nullable();
        Nullable<int> left = 1.Nullable().SelectMany(addOne);
        Nullable<int> right = addOne(1);
        Assert.AreEqual(left.Value, right.Value);
        // Monad law 2: M.SelectMany(Monad) == M
        Nullable<int> M = 1.Nullable();
        left = M.SelectMany(NullableExtensions.Nullable);
        right = M;
        Assert.AreEqual(left.Value, right.Value);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Nullable<int>> addTwo = x => (x + 2).Nullable();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Value, right.Value);
    }
}
```