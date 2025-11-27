---
title: "Category Theory via C# (20) More Monad: Reader< , > Monad"
published: 2018-12-21
description: "Sometimes there are functions work with a shared environment. Typical examples are:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads](/posts/category-theory-via-csharp-8-more-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads")**

## Reader< , > Monad

Sometimes there are functions work with a shared environment. Typical examples are:

-   Environment variables
-   Application’s settings stored in App.config
-   web application’s configurations stored in Web.config

The Reader< , > monad is a specialized State< , > monad. It threads an environment parameter through a sequence of functions.

The definition is simple:
```
// Reader<TEnvironment, T> is alias of Func<TEnvironment, T>
public delegate T Reader<in TEnvironment, out T>(TEnvironment environment);
```

It is nothing but a Func< , >. This is its SelectMany:
```
[Pure]
public static partial class ReaderExtensions
{
    // Required by LINQ.
    public static Reader<TEnvironment, TResult> SelectMany<TEnvironment, TSource, TSelector, TResult>
        (this Reader<TEnvironment, TSource> source,
         Func<TSource, Reader<TEnvironment, TSelector>> selector,
         Func<TSource, TSelector, TResult> resultSelector) => 
            environment =>
                {
                    TSource sourceResult = source(environment);
                    return resultSelector(sourceResult, selector(sourceResult)(environment));
                };

    // Not required, just for convenience.
    public static Reader<TEnvironment, TResult> SelectMany<TEnvironment, TSource, TResult>
        (this Reader<TEnvironment, TSource> source,
            Func<TSource, Reader<TEnvironment, TResult>> selector) => 
            source.SelectMany(selector, Functions.False);
}
```

so that:
```
// [Pure]
public static partial class ReaderExtensions
{
    // μ: Reader<TEnvironment, Reader<TEnvironment, T>> => Reader<TEnvironment, T>
    public static Reader<TEnvironment, TResult> Flatten<TEnvironment, TResult>
        (Reader<TEnvironment, Reader<TEnvironment, TResult>> source) => source.SelectMany(Functions.Id);

    // η: T -> Reader<TEnvironment, T>
    public static Reader<TEnvironment, T> Reader<TEnvironment, T>
        (this T value) => environment => value;

    // φ: Lazy<Reader<TEnvironment, T1>, Reader<TEnvironment, T2>> => Reader<TEnvironment, Lazy<T1, T2>>
    public static Reader<TEnvironment, Lazy<T1, T2>> Binary<TEnvironment, T1, T2>
        (this Lazy<Reader<TEnvironment, T1>, Reader<TEnvironment, T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> Reader<TEnvironment, TUnit>
    public static Reader<TEnvironment, Unit> Unit<TEnvironment>
        (Unit unit) => unit.Reader<TEnvironment, Unit>();

    // Select: (TSource -> TResult) -> (Reader<TEnvironment, TSource> -> Reader<TEnvironment, TResult>)
    public static Reader<TEnvironment, TResult> Select<TEnvironment, TSource, TResult>
        (this Reader<TEnvironment, TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(value => selector(value).Reader<TEnvironment, TResult>());
}
```

Here is an example of the usage in a .NET application:
```
Reader<Settings, string> query =
    // 1. Use settings.
    from html in new Reader<Settings, string>(settings => DownloadString(settings.BlogUrl))
    // 2. Use settings.
    from _ in new Reader<Settings, Unit>(settings => SaveToDatabase(settings.ConnectionString, html))
    // 3. Update settings.
    from __ in new Reader<Settings, Settings>(settings => UpdateSettings(settings))
    // 4. Use settings. Here settings are updated.
    from ___ in new Reader<Settings, Unit>(settings => ListenToPort(settings.Port))
    select html;
string result = query(Settings.Default);
```

## Monad laws, and unit tests
```
public partial class MonadTests
{
    [TestMethod()]
    public void ReaderTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        bool isExecuted3 = false;
        bool isExecuted4 = false;
        Reader<int, int> f1 = x => { isExecuted1 = true; return x + 1; };
        Reader<int, string> f2 = x =>
            { isExecuted2 = true; return x.ToString(CultureInfo.InvariantCulture); };
        Func<string, Reader<int, int>> f3 = x => y => { isExecuted3 = true; return x.Length + y; };
        Func<int, Func<int, int>> f4 = x => y => { isExecuted4 = true; return x + y; };
        Reader<int, int> query1 = from x in f1
                                    from y in f2
                                    from z in f3(y)
                                    from _ in f1
                                    let f4x = f4(x)
                                    select f4x(z);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        Assert.IsFalse(isExecuted3); // Laziness.
        Assert.IsFalse(isExecuted4); // Laziness.
        Assert.AreEqual(1 + 1 + 1 + 1, query1(1)); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
        Assert.IsTrue(isExecuted3);
        Assert.IsTrue(isExecuted4);

        Tuple<bool, string> config = Tuple.Create(true, "abc");
        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, Reader<Tuple<bool, string>, int>> addOne = x => c => x + 1;
        Reader<Tuple<bool, string>, int> left = 1.Reader<Tuple<bool, string>, int>().SelectMany(addOne);
        Reader<Tuple<bool, string>, int> right = addOne(1);
        Assert.AreEqual(left(config), right(config));
        // Monad law 2: M.SelectMany(Monad) == M
        Reader<Tuple<bool, string>, int> M = c => 1 + c.Item2.Length;
        left = M.SelectMany(ReaderExtensions.Reader<Tuple<bool, string>, int>);
        right = M;
        Assert.AreEqual(left(config), right(config));
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, Reader<Tuple<bool, string>, int>> addLength = x => c => x + c.Item2.Length;
        left = M.SelectMany(addOne).SelectMany(addLength);
        right = M.SelectMany(x => addOne(x).SelectMany(addLength));
        Assert.AreEqual(left(config), right(config));
    }
}
```