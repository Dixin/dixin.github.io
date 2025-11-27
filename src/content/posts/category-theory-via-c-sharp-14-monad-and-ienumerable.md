---
title: "Category Theory via C# (14) Monad And IEnumerable<>"
published: 2018-12-15
description: "A previous part showed endofunctor category is a monoid (the entire category itself). An endofunctor In the endofunctor category can be monoid too. This kind of endofunctor is called monad. Formally,"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads](/posts/category-theory-via-csharp-7-monad-and-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads")**

## Monad and monad laws

A previous part showed endofunctor category is a monoid (the entire category itself). An endofunctor In the endofunctor category can be monoid too. This kind of endofunctor is called monad. Formally, [monad](http://en.wikipedia.org/wiki/Monad_\(category_theory\)) is an endofunctor of category C, equipped with 2 natural transformations:

-   Monoid binary operation, which a natural transformation μ: F ◎ F ⇒ F, where
    -   (F ◎ F)(X) is F(F(X)), also denoted F2
    -   Similarly, (F ◎ F ◎ F)(X) is F(F(F(X))), also denoted F3
-   Monoid unit, which is a natural transformation η: Id(X) ⇒ F(X)
    -   Id (with an upper case I) is the Id endofunctor of C, not the id morphism
    -   Since functor Id(X) is merely a simple wrapper of X (e.g., in DotNet category, the Id endofunctor is just Lazy<X>), so in category C, the natural transformation η: Id(X) ⇒ F(X) is frequently simplified to morphism η: X → F(x)

satisfying the monoid laws:

1.  Left unit law λ: μ(η ◎ F) ≌ F
2.  Right unit law ρ: F ≌ μ(F ◎ η)
3.  Associative law α: μ(F ◎ F) ◎ F) ≌ F ◎ μ(F ◎ F)

so that, similar to Monoid diagrams, there are:

[![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Category-Theory-via-C-14-Monad_1276B/image_thumb_3.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Category-Theory-via-C-14-Monad_1276B/image_8.png)

and

[![Untitled-1.fw](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Category-Theory-via-C-14-Monad_1276B/Untitled-1.fw_thumb.png "Untitled-1.fw")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Category-Theory-via-C-14-Monad_1276B/Untitled-1.fw_2.png)

commute.

So, monad (F, μ, η) is monoid (M, ⊙, I). Its representation in pseudo C#:

```typescript
// Cannot be compiled.
public interface IMonad<TCategory, TBinaryFunctor< , >, TUnit, TMonad<>>
    : IMonoidalFunctor<TCategory, TCategory, TBinaryFunctor< , >, TBinaryFunctor< , >, TUnit, TUnit, TMonad<>>
    where TMonad<> : IMonad<TCategory, TBinaryFunctor< , >, TBinaryFunctor< , >, TMonad<>>
    where TCategory : IMonoidalCategory<TCategory, TBinaryFunctor< , >>
{
    // Select: (TSource -> TResult) -> (TMonad<TSource> -> TMonad<TResult>)

    // φ: TBinaryFunctor<TMonad<T1>, TMonad<T2>> => TMonad<TBinaryFunctor<T1, T2>>

    // ι: TUnit -> TMonad<TUnit>

    // μ: TMonad<> ◎ TMonad<> => TMonad<>
    TMonad<TSource> Flatten<TSource>(TMonad<TMonad<TSource>> source);

    // η: Id<T> => TMonad<T>, equivalent to T -> TMonad<T>
    TMonad<TSource> Monad<TSource>(TSource value);
}
```

μ is called flatten, and η is called Monad, since it is like a constructor of a monad.

Monad is monoidal functor, which will be explained later.

## C#/.NET monads

A previous part has explained DotNet category is monoid category. So monad in DotNet category will be like:

```typescript
// Cannot be compiled.
public interface IDotNetMonad<TDotNetMonad<>> 
    : IMonad<DotNet, Lazy< , >, Unit, TDotNetMonad<>>
    where TDotNetMonad<> : IDotNetMonad<TDotNetMonad<>>
{
    // Select: (TSource -> TResult) -> (TDotNetMonad<TSource> -> TDotNetMonad<TResult>)

    // φ: Lazy<TDotNetMonad<T1>, TDotNetMonad<T2>> => TDotNetMonad<Lazy<T1, T2>>

    // ι: TUnit -> TDotNetMonad<TUnit>

    // μ: TDotNetMonad<> ◎ TDotNetMonad<> => TDotNetMonad<>

    // η: Lazy<T> => TDotNetMonad<T>, equivalent to T -> TDotNetMonad<T>
}
```

As usual, Flatten and Monad will be implemented as extension methods.

## IEnumerable<> monad and SelectMany

IEnumerable<> is the built-in monad, which is similar to the [Haskell List monad](https://hackage.haskell.org/package/base-4.8.0.0/docs/src/GHC-Base.html#line-726). Its Flatten (μ) extension method easy to implement with the yield syntactic sugar:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<TSource> Flatten<TSource>(this IEnumerable<IEnumerable<TSource>> source)
    {
        foreach (IEnumerable<TSource> enumerable in source)
        {
            foreach (TSource value in enumerable)
            {
                yield return value;
            }
        }
    }

    public static IEnumerable<T> Enumerable<T>(this T value)
    {
        yield return value;
    }
}
```

And its Monad (η) extension method is called Enumerable instead of Monad, because Enumerable is more specific than the general abstract name Monad. The enumerable function here is exactly the same Enumerable for monoidal functor IEnumerable<>.

In C#/LINQ, monad is implemented as another extension method called SelectMany. As a functor, IEnumerable<> already has a Select extension method, now with Flatten and Select, SelectMany is easy to implement:

```csharp
public static IEnumerable<TResult> SelectMany<TSource, TSelector, TResult>
    (this IEnumerable<TSource> source, 
        Func<TSource, IEnumerable<TSelector>> selector, 
        Func<TSource, TSelector, TResult> resultSelector) =>
            // (from sourceItem in source
            //     select (from selectorItem in selector(sourceItem)
            //         select resultSelector(sourceItem, selectorItem))).Flatten();
            source.Select(sourceValue => selector(sourceValue)
                    .Select(selectorValue => resultSelector(sourceValue, selectorValue)))
                .Flatten();
```

Actually, (SelectMany + Enumerable) is equivalent to (Flatten + Enumerable), either pair makes IEnumerable<> a monad. That is, (SelectMany + Enumerable) and (Flatten + Enumerable) can replace each other. So above Flatten can be implemented by SelectMany too:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<TResult> SelectMany2<TSource, TSelector, TResult>(
        this IEnumerable<TSource> source,
        Func<TSource, IEnumerable<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector)
    {
        foreach (TSource sourceItem in source)
        {
            foreach (TSelector selectorItem in selector(sourceItem))
            {
                yield return resultSelector(sourceItem, selectorItem);
            }
        }
    }

    public static IEnumerable<TSource> Flatten2<TSource>
        (this IEnumerable<IEnumerable<TSource>> source) =>
            // source.SelectMany(enumerable => enumerable);
            source.SelectMany2(Functions.Id);
}
```

This shows SelectMany is more powerful than Flatten, because Flatten is just a special case of SelectMany - SelectMany(Functions.Id). The future monad posts will focus on SelectMany extension methods of the monads. In other languages, e.g. in Haskell, SelectMany is called Bind.

.NET also provide a SelectMany overload without the last parameter resultSelector, which is so easy to implement:

```csharp
public static IEnumerable<TResult> SelectMany<TSource, TResult>
    (this IEnumerable<TSource> source, Func<TSource, IEnumerable<TResult>> selector) => 
        source.SelectMany(selector, (sourceValue, selectorValue) => selectorValue);
```

The last lambda expression, (sourveValue, resultValue) => resultValue, is similar to [Church Boolean](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans)’s [generic version of False function](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans):

```csharp
public static partial class ChurchBoolean
{
    // False = @true => @false => @false
    public static Func<TFalse, object> False<TTrue, TFalse>
        (TTrue @true) => @false => @false;
}
```

So, if defining a uncurried version of above function:

```csharp
// [Pure]
public static partial class Functions
{
    public static TFalse False<TTrue, TFalse>
        (TTrue @true, TFalse @false) => @false;
}
```

then above SelectMany implementation can be even shorter:

```csharp
public static IEnumerable<TResult> SelectMany2<TSource, TResult>
    (this IEnumerable<TSource> source, Func<TSource, IEnumerable<TResult>> selector) => 
        source.SelectMany(selector, Functions.False);
```

### IEnumerable<> monad (SelectMany) is monoid

As above shown:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    // η: Lazy<T> => IEnumerable<T>
    // or
    // η: T -> IEnumerable<T>
    public static IEnumerable<T> Enumerable<T>(this T value)
    {
        yield return value;
    }

    // μ: IEnumerable<> ◎ IEnumerable<> => IEnumerable<>
    // or 
    // μ: IEnumerable<IEnumerable<T>> => IEnumerable<T>
    public static IEnumerable<TSource> Flatten<TSource>
        (this IEnumerable<IEnumerable<TSource>> source) => source.SelectMany(Functions.Id);
}
```

And it satisfies the monoid laws:

```csharp
[TestClass()]
public partial class MonadTests
{
    [TestMethod()]
    public void EnumerableMonoidTest()
    {
        // Left unit law: μ(η ∘ F) == F
        EnumerableAssert.AreEqual(
            new Enumerable<int>(1).Enumerable().Flatten(), 
            new Enumerable<int>(1));

        // Right unit law: F == μ(F ∘ η)
        EnumerableAssert.AreEqual(
            new Enumerable<int>(1), 
            new Enumerable<IEnumerable<int>>(1.Enumerable()).Flatten());

        // Associative law: μ(F ∘ F) ∘ F) == F ∘ μ(F ∘ F)
        IEnumerable<Enumerable<int>> left = new Enumerable<int>(1).Enumerable().Enumerable().Flatten();
        IEnumerable<IEnumerable<int>> right = new Enumerable<IEnumerable<int>>(new Enumerable<int>(1)).Flatten().Enumerable();
        Assert.AreEqual(left.Count(), right.Count());
        for (int i = 0; i < left.Count(); i++)
        {
            EnumerableAssert.AreEqual(left.Skip(i-1).Take(1).Single(), right.Skip(i - 1).Take(1).Single());
        }
    }
}
```

where:

-   μ is the Flatten function
-   η is the Enumerable function
-   ◎ can be read after
-   To distinguish from η, sometimes F is represented by following Enumerable class:

```csharp
public class Enumerable<T> : IEnumerable<T>
{
    private readonly T value;

    public Enumerable(T value)
    {
        this.value = value;
    }

    [Pure]
    public IEnumerator<T> GetEnumerator()
    {
        yield return this.value;
    }

    [Pure]
    IEnumerator IEnumerable.GetEnumerator
        () => this.GetEnumerator();
}
```

### IEnumerable<> monad (SelectMany) is monoidal functor

As a monad, IEnumerable can always implement (Binary + Unit) with (SelectMany + Enumerable):

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    // φ: Lazy<IEnumerable<T1>, IEnumerable<T2>> => IEnumerable<Lazy<T1, T2>>
    public static IEnumerable<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<IEnumerable<T1>, IEnumerable<T2>> binaryFunctor) => 
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: Unit -> IEnumerable<Unit>
    public static IEnumerable<Unit> Unit
        (Unit unit) => unit.Enumerable();
}
```

This ensures IEnumerable<> monad (SelectMany + Enumerable) is a monoidal functor.

### IEnumerable<> monad (SelectMany) is functor

As a monad, IEnumerable can always implement Select too, (SelectMany + Enumerable):

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    // Select: (TSource -> TResult) -> (TDotNetMonad<TSource> -> TDotNetMonad<TResult>)
    public static IEnumerable<TResult> Select<TSource, TResult>
        (this IEnumerable<TSource> source, Func<TSource, TResult> selector) => 
            source.SelectMany(sourceValue => selector(sourceValue).Enumerable(), Functions.False);
}
```

This ensures IEnumerable<> monad/monoidal functor (SelectMany + Enumerable) is a functor.

## Monad pattern of LINQ

Generally in .NET, if a generic type F<TSource>:

-   has a instance method or extension method SelectMany, which:
    -   takes a Func<TSource, F<TSelector>> parameter
    -   and a Func<TSource, TSelector, TResult> parameter
    -   and returns a F<TResult>

then:

-   F<> is a C#/LINQ monad, and its SelectMany method can be recognized by C# compiler, so the LINQ syntax can be used:

For example, with the built in System.Linq.Enumerable.SelectMany implementation, these “"compound “from” LINQ queries:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<TResult> Select3<TSource, TResult>
        (this IEnumerable<TSource> source, Func<TSource, TResult> selector) =>
            from sourceValue in source
            from selectorValue in selector(sourceValue).Enumerable()
            select selectorValue;

    public static IEnumerable<TSource> Flatten3<TSource>
        (this IEnumerable<IEnumerable<TSource>> source) =>
            from enumerable in source
            from value in enumerable
            select value;
}
```

can be compiled to SelectMany applications:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<TResult> Select4<TSource, TResult>
        (this IEnumerable<TSource> source, Func<TSource, TResult> selector) =>
            source.SelectMany(
                sourceValue => selector(sourceValue).Enumerable(),
                (sourceValue, selectorValue) => selectorValue);

    public static IEnumerable<TSource> Flatten4<TSource>
        (this IEnumerable<IEnumerable<TSource>> source) =>
            source.SelectMany(enumerable => enumerable);
}
```

For any .NET generic type F<> with such a SelectMany instance/extension method, if F<X> also satisfies:

-   F<T> can be constructed directly from T value(s)
-   its SelectMany method (either instance or extension) is pure

then F<> is a general abstract monad of category theory too.

Here an IEnumerable<T> can be constructed from 0 or more T values in many ways. And in NET, IEnumerable<T>’s built in SelectMany implementation is pure (yes, it is the same as the SelectMany2 function above):

```csharp
public static class Enumerable
{
    [Pure]
    public static IEnumerable<TResult> SelectMany2<TSource, TSelector, TResult>(
        this IEnumerable<TSource> source,
        Func<TSource, IEnumerable<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector)
    {
        foreach (TSource sourceItem in source)
        {
            foreach (TSelector selectorItem in selector(sourceItem))
            {
                yield return resultSelector(sourceItem, selectorItem);
            }
        }
    }
}
```

So finally, the essence of LINQ has been touched, as [Brian Beckman](https://www.linkedin.com/in/brianbeckman) said in [this Channel 9 video](http://channel9.msdn.com/Shows/Going+Deep/Brian-Beckman-Dont-fear-the-Monads):

> LINQ is monad. It is very carefully designed by [Erik Meijer](http://en.wikipedia.org/wiki/Erik_Meijer_\(computer_scientist\)) so that it is monad.

[Eric Lippert](http://ericlippert.com) also [mentioned](http://stackoverflow.com/questions/4683506/are-there-any-connections-between-haskell-and-linq):

> The LINQ syntax is designed specifically to make operations on the sequence monad feel natural, but in fact the implementation is more general; what C# calls "SelectMany" is a slightly modified form of the "Bind" operation on an arbitrary monad.

Because monad is such an important but psychedelic concept, later parts will continue to demystify other monads via C#: Lazy<>, Func<>, Null<>, ParallelQuery<>, IObservable<>, IO monad, state monad, reader monad, writer monad, continuation monad, and even more.

## Monad laws, and unit test

As fore mentioned, a monad is a monoid in the endofunctor category, so monad follows the monoid laws:

1.  Left unit law: μ(η ◎ T) ≌ T
2.  Right unit law: T ≌ μ(T ◎ η)
3.  Associative law: μ(T ◎ T) ◎ T) ≌ T ◎ μ(T ◎ T)

Now in C#, after introducing Monad (Here Enumerable) as η, SelectMany as a more powerful μ, above general monad law becomes following C# [monad laws](http://en.wikipedia.org/wiki/Monad_\(functional_programming\)#Monad_laws):

1.  Left unit law: m.Monad().SelectMany(f) == f(m)
2.  Right unit law: M.SelectMany(Monad) == M
3.  Associative law: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))

where M is a monad (here a IEnumerable<>), Monad is the “constructor” function (here Enumerable).

The following unit tests demonstrates how IEnumerable<> satisfies these laws:

```csharp
public partial class MonadTests
{
    [TestMethod()]
    public void EnumerableTest()
    {
        bool isExecuted1 = false;
        IEnumerable<int> enumerable1 = new int[] { 0, 1 };
        IEnumerable<int> enumerable2 = new int[] { 1, 2 };
        Func<int, Func<int, int>> f = x => y => { isExecuted1 = true; return x + y; };
        IEnumerable<int> query1 = from x in enumerable1
                                  from y in enumerable2
                                  let z = f(x)(y)
                                  where z > 1
                                  select z;
        Assert.IsFalse(isExecuted1); // Laziness.
        EnumerableAssert.AreEqual(new int[] { 2, 2, 3 }, query1); // Execution.
        Assert.IsTrue(isExecuted1);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, IEnumerable<int>> addOne = x => (x + 1).Enumerable();
        EnumerableAssert.AreEqual(1.Enumerable().SelectMany(addOne), addOne(1));
        // Monad law 2: M.SelectMany(Monad) == M
        EnumerableAssert.AreEqual(enumerable1.SelectMany(EnumerableExtensions.Enumerable), enumerable1);
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, IEnumerable<int>> addTwo = x => (x + 2).Enumerable();
        EnumerableAssert.AreEqual(
            enumerable2.SelectMany(addOne).SelectMany(addTwo), 
            enumerable2.SelectMany(x => addOne(x).SelectMany(addTwo)));
    }
}
```