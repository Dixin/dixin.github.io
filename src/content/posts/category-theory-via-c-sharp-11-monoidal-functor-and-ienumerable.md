---
title: "Category Theory via C# (11) Monoidal Functor And IEnumerable<>"
published: 2018-12-12
description: "Given monoidal categories (C, ⊗, IC) and (D, ⊛, ID), a  (or lax monoidal functors) is a functor F: C → D equipped with:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor](/posts/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor "https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor")**

## Monoidal functor

Given monoidal categories (C, ⊗, IC) and (D, ⊛, ID), a [monoidal functor](http://en.wikipedia.org/wiki/Monoidal_functor) (or lax monoidal functors) is a functor F: C → D equipped with:

-   Monoid binary operation, which is a natural transformation φ: F(X) ⊛ F(Y) ⇒ F(X ⊗ Y)
-   Monoid unit, which is a morphism ι: ID → F(IC)

satisfying the monoid laws:

1.  Left unit law in D, denoted λD: [![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/c89f78dd27b4_ABC1/image_thumb.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/c89f78dd27b4_ABC1/image_2.png)
2.  Right unit law in D, denoted ρD: [![Untitled-3..fw](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/c89f78dd27b4_ABC1/Untitled-3..fw_thumb.png "Untitled-3..fw")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/c89f78dd27b4_ABC1/Untitled-3..fw_2.png)
3.  Associativity law in D, denoted αD: [![Untitled-4.fw](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/c89f78dd27b4_ABC1/Untitled-4.fw_thumb_1.png "Untitled-4.fw")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/c89f78dd27b4_ABC1/Untitled-4.fw_4.png)

The α, λ, ρ are the fore mentioned natural transformations of monoidal category D.

The definition of monoidal functor in pseudo C# is:

```typescript
// Cannot be compiled.
public interface IMonoidalFunctor<in TSourceCategory, out TTargetCategory, TSourceBinaryFunctor< , >, TTargetBinaryFunctor< , >, TSourceUnit, TTargetUnit, TMonoidalFunctor<>> 
    : IFunctor<TSourceCategory, TTargetCategory, TMonoidalFunctor<>>
    where TSourceCategory : ICategory<TSourceCategory>
    where TTargetCategory : ICategory<TTargetCategory>
    where TSourceBinaryFunctor< , > : IBinaryFunctor<TSourceCategory, TSourceCategory, TSourceCategory, TSourceBinaryFunctor< , >>
    where TTargetBinaryFunctor< , > : IBinaryFunctor<TTargetCategory, TTargetCategory, TTargetCategory, TTargetBinaryFunctor< , >>
    where TMonoidalFunctor<> : IMonoidalFunctor<TSourceCategory, TTargetCategory, TSourceBinaryFunctor< , >, TTargetBinaryFunctor< , >, TMonoidalFunctor<>>
{
    // φ: TTargetBinaryFunctor<TMonoidalFunctor<T1>, TMonoidalFunctor<T2>> => TMonoidalFunctor<TSourceBinaryFunctor<T1, T2>>
    TMonoidalFunctor<TSourceBinaryFunctor<T1, T2>> Binary<T1, T2>(
        TTargetBinaryFunctor<TMonoidalFunctor<T1>, TMonoidalFunctor<T2>> binaryFunctor);

    // ι: TTargetUnit -> TMonoidalFunctor<TSourceUnit>
    TMonoidalFunctor<TSourceUnit> Unit(TTargetUnit unit);
}
```

That’s a ton of type information.

Once again, the extension method approach will be used.

## C#/.NET lax monoidal endofunctors

Again, dealing with one single monoidal category - DotNet is much easier. According to the definition, A (lax) monoidal functor in monoidal category DotNet is a (lax) monoidal endofunctor F : DotNet → DotNet, equipped with:

-   Bifunctor Lazy< , > : DotNet → DotNet
-   Natural transformation (binary operation) φ: Lazy<F<X>, F<Y>> ⇒ F<Lazy<X, Y>>, since Lazy< , > is the bifunctor ⊗, and ⊛ too
-   Morphism (unit) ι: Unit → F<Unit>, since Unit is IDotNet

Lax monoidal endofunctor is a little long for a name. In the rest of this post, monoidal functor will be used for it.

So:

```typescript
// Cannot be compiled.
public interface IDotNetMonoidalFunctor<T> // F<>
    : IMonoidalFunctor<DotNet, DotNet, Lazy< , >, Lazy< , >, Unit, Unit, IDotNetMonoidalFunctor<>>
{
    // φ: Lazy<F<T1>, F<T2>> => F<Lazy<T1, T2>>
    // IDotNetMonoidalFunctor<Lazy<T1, T2>> Binary<T1, T2>(
    //     Lazy<IDotNetMonoidalFunctor<T1>, IDotNetMonoidalFunctor<T2>> binaryFunctor);

    // ι: Unit -> F<Unit>
    // IDotNetMonoidalFunctor<Unit> Unit(Unit unit);
}
```

Now the Binary operator becomes more intuitive, because Lazy< , > is just a (lazy) tuple. So above Binary function is close to:

```csharp
// φ: Lazy<F<T1>, F<T2>> => F<Lazy<T1, T2>>
// is equivalent to
// φ: (F<T1>, F<T2>>) => F<Lazy<T1, T2>>
IDotNetMonoidalFunctor<Lazy<T1, T2>> Binary<T1, T2>(
    IDotNetMonoidalFunctor<T1> functor1, IDotNetMonoidalFunctor<T2> functor2);
```

which clearly shows monoidal functor F<>’s monoidal structure: (F<X>, F<Y>>) ⇒ F<Z>.

## IEnumerable<> monoidal functor

To implement Binary for IEnumerable<>, just need to take values from each IEnumerable<> in the pair, and result a IEnumerable<> of the values’ Cartesian product:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    // φ: Lazy<IEnumerable<T1>, IEnumerable<T2>> => IEnumerable<Lazy<T1, T2>>
    public static IEnumerable<Lazy<T1, T2>> Binary<T1, T2>(
        this Lazy<IEnumerable<T1>, IEnumerable<T2>> binaryFunctor)
    {
        foreach (T1 value1 in binaryFunctor.Value1)
        {
            foreach (T2 value2 in binaryFunctor.Value2)
            {
                yield return new Lazy<T1, T2>(value1, value2);
            }
        }
    }

    // ι: Unit -> IEnumerable<Unit>
    public static IEnumerable<Unit> Unit(Unit unit)
    {
        yield return unit;
    }
}
```

### N-arity selector for functor

How can this be useful? Remember IEnumerable<>’s Select function:

```csharp
public static IEnumerable<TResult> Select<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    foreach (TSource item in source)
    {
        yield return selector(item);
    }
}
```

The selector takes a TSource parameter. What if selector is a N-arity function? For example:

```csharp
Func<int, int, int, int> selector = (x, y, z) => x + y + z;
```

Not a problem, because N-arity function can always be curried to 1-arity function:

```csharp
Func<int, Func<int, Func<int, int>>> selector = x => y => z => x + y + z;
```

So in scenario like:

```csharp
Func<int, Func<int, Func<int, int>>> selector = x => y => z => x + y + z;
IEnumerable<int> xs = Enumerable.Range(0, 2);
IEnumerable<int> ys = Enumerable.Range(2, 2);
IEnumerable<int> zs = Enumerable.Range(4, 2);
```

how selector’s add algorithm can be applied with these values in functors? Try starting from xs:

```csharp
var query1 = from x in xs select selector(x); // IEnumerable<Func<int, Func<int, int>>> query = xs.Select(selector);
```

Unfortunately, now query1’s type becomes IEnumerable<Func<int, Func<int, int>>>. The selector got wrapped in the functor. How to apply a function in functor with value(s) in functor? Now lax monoidal endofunctor can be useful. Its binary operator takes a pair of functors - here one functor wraps function, the other wraps argument, and returns another functor, which wraps a pair of function and argument together.

```csharp
IEnumerable<Func<int, Func<int, int>>> query1 = from x in xs select selector(x);
IEnumerable<Lazy<Func<int, Func<int, int>>, int>> query2 = new Lazy<IEnumerable<Func<int, Func<int, int>>>, IEnumerable<int>>(query1, ys).Binary();
IEnumerable<Func<int, int>> query3 = from pair in query2 select pair.Value1(pair.Value2);
// Continue with zs...
```

It works. And this approach can be more fluent.

First, replace T1 with Func<T2, T1>, since this is for applying functions wrapped in functor:

```csharp
public static IEnumerable<Lazy<Func<T2, T1>, T2>> Binary<T1, T2>(
    this Lazy<IEnumerable<Func<T2, T1>>, IEnumerable<T2>> binaryFunctor)
{
    // ...
}
```

Second, get rid of Lazy< , > in the parameter, it just pairs 2 parameters. “this” keyword remains for the first parameter.

```csharp
public static IEnumerable<Lazy<Func<T2, T1>, T2>> Binary<T1, T2>(
    this IEnumerable<Func<T2, T1>>, IEnumerable<T2> binaryFunctor)
{
    // ...
}
```

In the return type IEnumerable<Lazy<Func<T2, T1>, T2>>, Lazy<…> will be dismantled to Func<T2, T1> and T2, then Func<T2, T1> will be applied with T2 and return T1, so eventually the return type will be IEnumerable<T1>:

```csharp
public static IEnumerable<T1> Binary<T1, T2>(
    this IEnumerable<Func<T2, T1>>, IEnumerable<T2> binaryFunctor)
{
    // ...
}
```

Last step - rename T1 to TResult, T2 to TSource, Binary to Apply, so they make more sense than “general abstract”:

```csharp
public static IEnumerable<TResult> Apply<TSource, TResult>
    (this IEnumerable<Func<TSource, TResult>> selectorFunctor, IEnumerable<TSource> source) => 
        new Lazy<IEnumerable<Func<TSource, TResult>>, IEnumerable<TSource>>(selectorFunctor, source)
            .Binary().Select(pair => pair.Value1(pair.Value2));
```

Now it is easier to apply selector with xs, ys, and zs:

```csharp
IEnumerable<int> query = xs.Select(selector).Apply(ys).Apply(zs);
```

If selector can be wrapped in the IEnumerable<> functor from the beginning:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<T> Enumerable<T>(this T value)
    {
        yield return value;
    }
}
```

then the application becomes more consistent:

```csharp
IEnumerable<int> query = selector.Enumerable().Apply(xs).Apply(ys).Apply(zs);
```

Apply is also called Merge, because this function merges 2 monoidal functors into one. But in scenarios like above, Apply can be more intuitive.

### Binary vs. Apply

Actually, monoidal functor IEnumerable<T> is functor and already has a Select function, its (Apply + Enumerable) is equivalent to (Binary + Unit). These 2 groups of functions express each other.

This is how (Binary + Unit) can implement (Apply + Enumerable):

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<TResult> Apply<TSource, TResult>
        (this IEnumerable<Func<TSource, TResult>> selectorFunctor, IEnumerable<TSource> source) =>
            new Lazy<IEnumerable<Func<TSource, TResult>>, IEnumerable<TSource>>(selectorFunctor, source)
                .Binary().Select(pair => pair.Value1(pair.Value2));

    public static IEnumerable<T> Enumerable<T>
        (this T value) => Unit(null).Select(unit => value);
}
```

And this is how (Apply + Enumerable) implement (Binary + Unit):

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<TResult> Apply<TSource, TResult>(
        this IEnumerable<Func<TSource, TResult>> selectorFunctor, IEnumerable<TSource> source)
    {
        foreach (Func<TSource, TResult> selector in selectorFunctor)
        {
            foreach (TSource value in source)
            {
                yield return selector(value);
            }
        }
    }

    public static IEnumerable<T> Enumerable<T>(this T value)
    {
        yield return value;
    }

    // φ: Lazy<IEnumerable<T1>, IEnumerable<T2>> => IEnumerable<Lazy<T1, T2>>
    public static IEnumerable<Lazy<T1, T2>> Binary<T1, T2>
        (this Lazy<IEnumerable<T1>, IEnumerable<T2>> binaryFunctor) =>
            new Func<T1, Func<T2, Lazy<T1, T2>>>(x => y => new Lazy<T1, T2>(x, y))
                .Enumerable()
                .Apply(binaryFunctor.Value1)
                .Apply(binaryFunctor.Value2);

    // ι: Unit -> IEnumerable<Unit>
    public static IEnumerable<Unit> Unit
        (Unit unit) => unit.Enumerable();
}
```

In the future the latter style will be used, because (Apply + Enumerable) can be less general abstract.

## Monoidal functor and LINQ

The Binary/Apply function merges 2 IEnumerable<> functors into 1 IEnumerable<>, which is similar to the semantics of Enumerable.Zip and Enumerable.Join:

```csharp
[Pure]
public static partial class EnumerableExtensions2
{
    public static IEnumerable<TResult> ApplyWithZip<TSource, TResult>
        (this IEnumerable<Func<TSource, TResult>> selectorFunctor, IEnumerable<TSource> source) =>
            selectorFunctor
                .Aggregate(
                    Enumerable.Empty<Func<TSource, TResult>>(),
                    (current, selector) => current.Concat(source.Select(sourceValue => selector)))
                .Zip(
                    selectorFunctor.Aggregate(
                        Enumerable.Empty<TSource>(),
                        (current, selector) => current.Concat(source)),
                    (selector, value) => selector(value));

    public static IEnumerable<TResult> ApplyWithJoin<TSource, TResult>
        (this IEnumerable<Func<TSource, TResult>> selectorFunctor, IEnumerable<TSource> source) =>
            selectorFunctor.Join(
                source,
                selector => true,
                value => true,
                (selector, value) => selector(value),
                EqualityComparer<bool>.Default);
}
```

[Join has LINQ support](https://msdn.microsoft.com/en-us/library/bb311040.aspx), so:

```csharp
// [Pure]
public static partial class EnumerableExtensions2
{
    public static IEnumerable<TResult> ApplyWithLinqJoin<TSource, TResult>
        (this IEnumerable<Func<TSource, TResult>> selectorFunctor, IEnumerable<TSource> source) =>
            from selector in selectorFunctor
            join value in source on true equals true // Cross join.
            select selector(value);
}
```

Notice the tricky [cross join](https://msdn.microsoft.com/en-us/library/bb882533.aspx). It works but is not straightforward. Later code will keep using Apply function.

## Applicative functor

As above code demonstrated, besides the standard (Binary + Unit) definition, a monoidal functor MonoidalFunctor can also be defined by (Apply + MonoidalFunctor). Actually, in [Haskell](http://en.wikipedia.org/wiki/Haskell_\(programming_language\)), the latter way is used, and monoidal functor is called [applicative functor](https://wiki.haskell.org/Applicative_functor). The pseudo C# is:

```typescript
// Cannot be compiled.
public interface IApplicativeFunctor<TApplicativeFunctor<>> // Lax monoidal endofunctor in DotNet category.
    : IFunctor<DotNet, DotNet, TApplicativeFunctor<>>
    where TApplicativeFunctor<> : IApplicativeFunctor<TApplicativeFunctor<>>
{
    TApplicativeFunctor<TResult> Apply<TSource, TResult>(
        TApplicativeFunctor<Func<TSource, TResult>> selectorFunctor, TApplicativeFunctor<TSource> source);

    TApplicativeFunctor<T> Pure<T>(T value);
}
```

In applicative functor (monoidal functor) definition:

-   The first function the same Apply function.
-   The second function has a confusing name Pure. It does not indicate the purity. It is just the Enumerable function above. It can be read as Functor, or Wrap, which wraps a value into an applicative functor (monoidal functor).

## Applicative laws, and unit tests

IEnumerable<T> is like the [List Appliative in Haskell](https://hackage.haskell.org/package/base-4.8.0.0/docs/src/GHC-Base.html#line-717). The following unit tests are following the [applicative laws of Haskell](http://learnyouahaskell.com/functors-applicative-functors-and-monoids#applicative-functors):

-   f.Functor().Apply(F) == F.Select(f)
-   Id.Functor().Apply(F) == F
-   o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
-   f.Functor().Apply(a.Functor()) == f(a).Functor()
-   F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)

where f is a function, F, F1, F2, F3 are monoidal functors, o is the composition of functions.

```csharp
[TestClass()]
public partial class MonoidalFunctorTests
{
    [TestMethod()]
    public void EnumerableTest()
    {
        bool isExecuted1 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        IEnumerable<int> numbers = new int[] { 0, 1, 2 };
        IEnumerable<int> query = addOne.Enumerable().Apply(numbers);
        Assert.IsFalse(isExecuted1); // Laziness.
        EnumerableAssert.AreEqual(new int[] { 1, 2, 3 }, query); // Execution.
        Assert.IsTrue(isExecuted1);

        // f.Functor().Apply(F) == F.Select(f)
        EnumerableAssert.AreEqual(addOne.Enumerable().Apply(numbers), numbers.Select(addOne));
        // id.Functor().Apply(F) == F
        Func<int, int> id = Functions.Id;
        EnumerableAssert.AreEqual(id.Enumerable().Apply(numbers), numbers);
        // o.Functor().Apply(F1).Apply(F2).Apply(F3) == F1.Apply(F2.Apply(F3))
        Func<int, int> addTwo = x => x + 2;
        Func<Func<int, int>, Func<Func<int, int>, Func<int, int>>> o =
            new Func<Func<int, int>, Func<int, int>, Func<int, int>>(FuncExtensions.o).Curry();
        EnumerableAssert.AreEqual(
            o.Enumerable().Apply(addOne.Enumerable()).Apply(addTwo.Enumerable()).Apply(numbers), 
            addOne.Enumerable().Apply(addTwo.Enumerable().Apply(numbers)));
        // f.Functor().Apply(a.Functor()) == f(a).Functor()
        EnumerableAssert.AreEqual(addOne.Enumerable().Apply(1.Enumerable()), addOne(1).Enumerable());
        // F.Apply(a.Functor()) == (f => f(a)).Functor().Apply(F)
        EnumerableAssert.AreEqual(
            addOne.Enumerable().Apply(1.Enumerable()),
            new Func<Func<int, int>, int>(f => f(1)).Enumerable().Apply(addOne.Enumerable()));
    }

    [TestMethod()]
    public void EnumerableTest2()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        IEnumerable<int> numbers = new int[] { 0, 1, 2 };
        IEnumerable<Func<int, int>> addTwoAddOne = new Func<int, int>(
            x => { isExecuted2 = true; return x + 2; }).Enumerable().Concat(addOne.Enumerable());
        IEnumerable<int> query = addTwoAddOne.Apply(numbers);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        EnumerableAssert.AreEqual(new int[] { 2, 3, 4, 1, 2, 3 }, query); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
    }
}
```

And unit tests for LINQ implementations:

```csharp
public partial class MonoidalFunctorTests
{
    [TestMethod()]
    public void EnumerableApplyWithZipTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        IEnumerable<int> numbers = new int[] { 0, 1, 2, 3 };
        IEnumerable<Func<int, int>> addTwoAddOne = new Func<int, int>(
            x => { isExecuted2 = true; return x + 2; }).Enumerable().Concat(addOne.Enumerable());
        IEnumerable<int> query = addTwoAddOne.ApplyWithZip(numbers);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        EnumerableAssert.AreEqual(new int[] { 2, 3, 4, 5, 1, 2, 3, 4 }, query); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
    }

    [TestMethod()]
    public void EnumerableApplyWithJoinTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        IEnumerable<int> numbers = new int[] { 0, 1, 2 };
        IEnumerable<Func<int, int>> addTwoAddOne = new Func<int, int>(
            x => { isExecuted2 = true; return x + 2; }).Enumerable().Concat(addOne.Enumerable());
        IEnumerable<int> query = addTwoAddOne.ApplyWithJoin(numbers);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        EnumerableAssert.AreEqual(new int[] { 2, 3, 4, 1, 2, 3 }, query); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
    }

    [TestMethod()]
    public void EnumerableApplyWithLinqJoinTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        IEnumerable<int> numbers = new int[] { 0, 1, 2 };
        IEnumerable<Func<int, int>> functions = new Func<int, int>(
            x => { isExecuted2 = true; return x + 2; }).Enumerable().Concat(addOne.Enumerable());
        IEnumerable<int> query = functions.ApplyWithLinqJoin(numbers);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.
        EnumerableAssert.AreEqual(new int[] { 2, 3, 4, 1, 2, 3 }, query); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);
    }
}
```