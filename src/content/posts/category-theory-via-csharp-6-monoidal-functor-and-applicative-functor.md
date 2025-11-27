---
title: "Category Theory via C# (6) Monoidal Functor and Applicative Functor"
published: 2024-12-25
description: "Given monoidal categories (C, ⊗, IC) and (D, ⊛, ID), a strong lax monoidal functor is a functor F: C → D equipped with:"
image: ""
tags: [".NET", "Applicative Functors", "C#", "Category Theory", "Functional Programming", "LINQ", "LINQ via C#", "Monadal Functors"]
category: ".NET"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## Monoidal functor

Given monoidal categories (C, ⊗, IC) and (D, ⊛, ID), a strong lax monoidal functor is a functor F: C → D equipped with:

-   Monoid binary multiplication operation, which is a natural transformation φ: F(X) ⊛ F(Y) ⇒ F(X ⊗ Y)
-   Monoid unit, which is a morphism ι: ID → F(IC)

F preserves the monoid laws in D:

-   Associativity law is preserved with D’s associator αD: [![Untitled-4.fw_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/8aeb52ea4130_CA43/Untitled-4.fw_thumb1_thumb_1.png "Untitled-4.fw_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/8aeb52ea4130_CA43/Untitled-4.fw_thumb1_4.png)
-   Left unit law is preserved with D’s left unitor λD: [![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/8aeb52ea4130_CA43/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/8aeb52ea4130_CA43/image_thumb_2.png) and right unit law is preserved with D’s right unitor ρD: [![Untitled-3..fw_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/8aeb52ea4130_CA43/Untitled-3..fw_thumb_thumb.png "Untitled-3..fw_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/8aeb52ea4130_CA43/Untitled-3..fw_thumb_2.png)

In this tutorial, strong lax monoidal functor is called monoidal functor for short. In DotNet category, monoidal functors are monoidal endofunctors. In the definition, (C, ⊗, IC) and (D, ⊛, ID) are both (DotNet, ValueTuple<,>, Unit), so monoidal functor can be IEnumerable<T1>, IEnumerable<T2>defined as:

```typescript
public interface IMonoidalFunctor<TMonoidalFunctor<>> : IFunctor<TMonoidalFunctor<>>
    where TMonoidalFunctor : IMonoidalFunctor<TMonoidalFunctor<>>
{
    // From IFunctor<TMonoidalFunctor<>>:
    // Select: (TSource -> TResult) -> (TMonoidalFunctor<TSource> -> TMonoidalFunctor<TResult>)
    // Func<TMonoidalFunctor<TSource>, TMonoidalFunctor<TResult>> Select<TSource, TResult>(Func<TSource, TResult> selector);

    // Multiply: TMonoidalFunctor<T1> x TMonoidalFunctor<T2> -> TMonoidalFunctor<T1 x T2>
    // Multiply: ValueTuple<TMonoidalFunctor<T1>, TMonoidalFunctor<T2>> -> TMonoidalFunctor<ValueTuple<T1, T2>>
    TMonoidalFunctor<ValueTuple<T1, T2>> Multiply<T1, T2>(
        ValueTuple<TMonoidalFunctor<T1>, TMonoidalFunctor<T2>> bifunctor);

    // Unit: Unit -> TMonoidalFunctor<Unit>
    TMonoidalFunctor<Unit> Unit(Unit unit);
}
```

Multiply accepts a ValueTuple<IEnumerable<T1>, IEnumerable<T2>> bifunctor, which is literally a 2-tuple (IEnumerable<T1>, IEnumerable<T2>). For convenience, the explicit ValueTuple<,> parameter can be represented by an implicit tuple, a pair of parameters. So the monoidal functor definition is equivalent to:

```typescript
public interface IMonoidalFunctor<TMonoidalFunctor<>> : IFunctor<TMonoidalFunctor<>>
    where TMonoidalFunctor : IMonoidalFunctor<TMonoidalFunctor<>>
{
    // Multiply: TMonoidalFunctor<T1> x TMonoidalFunctor<T2> -> TMonoidalFunctor<T1 x T2>
    // Multiply: (TMonoidalFunctor<T1>, TMonoidalFunctor<T2>) -> TMonoidalFunctor<(T1, T2)>
    TMonoidalFunctor<(T1, T2)> Multiply<T1, T2>(
        TMonoidalFunctor<T1> source1, TMonoidalFunctor<T2>> source2); // Unit: Unit

    // Unit: Unit -> TMonoidalFunctor<Unit>
    TMonoidalFunctor<Unit> Unit(Unit unit);
}
```

### IEnumerable<> monoidal functor

IEnumerable<> functor is a monoidal functor. Its Multiply method can be implemented as its extension method:

```csharp
public static partial class EnumerableExtensions // IEnumerable<T> : IMonoidalFunctor<IEnumerable<>>
{
    // Multiply: IEnumerable<T1> x IEnumerable<T2> -> IEnumerable<T1 x T2>
    // Multiply: ValueTuple<IEnumerable<T1>, IEnumerable<T2>> -> IEnumerable<ValueTuple<T1, T2>>
    // Multiply: (IEnumerable<T1>, IEnumerable<T2>) -> IEnumerable<(T1, T2)>
    public static IEnumerable<(T1, T2)> Multiply<T1, T2>(
        this IEnumerable<T1> source1, IEnumerable<T2> source2) // Implicit tuple.
    {
        foreach (T1 value1 in source1)
        {
            foreach (T2 value2 in source2)
            {
                yield return (value1, value2);
            }
        }
    }

    // Unit: Unit -> IEnumerable<Unit>
    public static IEnumerable<Unit> Unit(Unit unit = default)
    {
        yield return unit;
    }
}
```

Now extension method Multiply can be used as a infix operator. It can be verified that the above Multiply and Unit implementations preserve the monoid laws by working with associator, left unitor and right unitor of DotNet monoidal category:

```csharp
// using static Dixin.Linq.CategoryTheory.DotNetCategory;
internal static void MonoidalFunctorLaws()
{
    IEnumerable<Unit> unit = Unit();
    IEnumerable<int> source1 = new int[] { 0, 1 };
    IEnumerable<char> source2 = new char[] { '@', '#' };
    IEnumerable<bool> source3 = new bool[] { true, false };
    IEnumerable<int> source = new int[] { 0, 1, 2, 3, 4 };

    // Associativity preservation: source1.Multiply(source2).Multiply(source3).Select(Associator) == source1.Multiply(source2.Multiply(source3)).
    source1.Multiply(source2).Multiply(source3).Select(Associator).WriteLines();
        // (0, (@, True)) (0, (@, False)) (0, (#, True)) (0, (#, False))
        // (1, (@, True)) (1, (@, False)) (1, (#, True)) (1, (#, False))
    source1.Multiply(source2.Multiply(source3)).WriteLines();
        // (0, (@, True)) (0, (@, False)) (0, (#, True)) (0, (#, False))
        // (1, (@, True)) (1, (@, False)) (1, (#, True)) (1, (#, False))
    // Left unit preservation: unit.Multiply(source).Select(LeftUnitor) == source.
    unit.Multiply(source).Select(LeftUnitor).WriteLines(); // 0 1 2 3 4
    // Right unit preservation: source == source.Multiply(unit).Select(RightUnitor).
    source.Multiply(unit).Select(RightUnitor).WriteLines(); // 0 1 2 3 4
}
```

How could these methods be useful? Remember functor’s Select method enables selector working with value(s) wrapped by functor:

```csharp
internal static void Selector1Arity(IEnumerable<int> xs)
{
    Func<int, bool> selector = x => x > 0;
    // Apply selector with xs.
    IEnumerable<bool> applyWithXs = xs.Select(selector);
}
```

So Select can be viewed as applying 1 arity selector (a TSource –> TResult function) with TFunctor<TSource>. For a N arity selector, to have it work with value(s) wrapped by functor, first curry it, so that it can be viewed as 1 arity function. In the following example, the (T1, T2, T3) –> TResult selector is curried to T1 –> (T2 –> T3 –> TResult) function, so that it can be viewed as only have 1 parameter, and can work with TFunctor<T1>:

```csharp
internal static void SelectorNArity(IEnumerable<int> xs, IEnumerable<long> ys, IEnumerable<double> zs)
{
    Func<int, long, double, bool> selector = (x, y, z) => x + y + z > 0;

    // Curry selector.
    Func<int, Func<long, Func<double, bool>>> curriedSelector = 
        selector.Curry(); // 1 arity: x => (y => z => x + y + z > 0)
    // Partially apply selector with xs.
    IEnumerable<Func<long, Func<double, bool>>> applyWithXs = xs.Select(curriedSelector);
```

So partially applying the T1 –> (T2 –> T3 –> TResult) selector with TFunctor<T1> returns TFunctor<T2 –> T3 –> TResult>, where the T2 –> T3 –> TResult function is wrapped by the TFunctor<> functor. To further apply TFunctor<T2 –> T3 –> TResult> with TFunctor<T2>, Multiply can be called:

```csharp
// Partially apply selector with ys.
    IEnumerable<(Func<long, Func<double, bool>>, long)> multiplyWithYs = applyWithXs.Multiply(ys);
    IEnumerable<Func<double, bool>> applyWithYs = multiplyWithYs.Select(product =>
    {
        Func<long, Func<double, bool>> partialAppliedSelector = product.Item1;
        long y = product.Item2;
        return partialAppliedSelector(y);
    });
```

The result of Multiply is TFunctor<(T2 –> T3 –> TResult, T2)>, where each T2 –> T3 –> TResult function is paired with each T2 value, so that each function can be applied with each value, And TFunctor<(T2 –> T3 –> TResult, T2)> is mapped to TFunctor<(T3 –> TResult)>, which can be applied with TFunctor<T3> in the same way:

```csharp
// Partially apply selector with zs.
    IEnumerable<(Func<double, bool>, double)> multiplyWithZs = applyWithYs.Multiply(zs);
    IEnumerable<bool> applyWithZs = multiplyWithZs.Select(product =>
    {
        Func<double, bool> partialAppliedSelector = product.Item1;
        double z = product.Item2;
        return partialAppliedSelector(z);
    });
}
```

So Multiply enables applying functor-wrapped functions (TFunctor<T –> TResult>) with functor-wrapped values (TFunctor<TSource>), which returns functor-wrapped results (TFunctor<TResult>). Generally, the Multiply and Select calls can be encapsulated as the following Apply method:

```csharp
// Apply: (IEnumerable<TSource -> TResult>, IEnumerable<TSource>) -> IEnumerable<TResult>
public static IEnumerable<TResult> Apply<TSource, TResult>(
    this IEnumerable<Func<TSource, TResult>> selectorWrapper, IEnumerable<TSource> source) =>
        selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));
```

So that the above N arity selector application becomes:

```csharp
internal static void Apply(IEnumerable<int> xs, IEnumerable<long> ys, IEnumerable<double> zs)
{
    Func<int, long, double, bool> selector = (x, y, z) => x + y + z > 0;
    // Partially apply selector with xs.
    IEnumerable<Func<long, Func<double, bool>>> applyWithXs = xs.Select(selector.Curry());
    // Partially apply selector with ys.
    IEnumerable<Func<double, bool>> applyWithYs = applyWithXs.Apply(ys);
    // Partially apply selector with zs.
    IEnumerable<bool> applyWithZs = applyWithYs.Apply(zs);
}
```

## Applicative functor

A functor, with the above ability to apply functor-wrapped functions with functor-wrapped values, is also called applicative functor. The following is the definition of applicative functor:

```typescript
// Cannot be compiled.
public interface IApplicativeFunctor<TApplicativeFunctor<>> : IFunctor<TApplicativeFunctor<>>
    where TApplicativeFunctor<> : IApplicativeFunctor<TApplicativeFunctor<>>
{
    // From: IFunctor<TApplicativeFunctor<>>:
    // Select: (TSource -> TResult) -> (TApplicativeFunctor<TSource> -> TApplicativeFunctor<TResult>)
    // Func<TApplicativeFunctor<TSource>, TApplicativeFunctor<TResult>> Select<TSource, TResult>(Func<TSource, TResult> selector);

    // Apply: (TApplicativeFunctor<TSource -> TResult>, TApplicativeFunctor<TSource> -> TApplicativeFunctor<TResult>
    TApplicativeFunctor<TResult> Apply<TSource, TResult>(
        TApplicativeFunctor<Func<TSource, TResult>> selectorWrapper, TApplicativeFunctor<TSource> source);

    // Wrap: TSource -> TApplicativeFunctor<TSource>
    TApplicativeFunctor<TSource> Wrap<TSource>(TSource value);
}
```

And applicative functor must satisfy the applicative laws:

-   Functor preservation: applying function is equivalent to applying functor-wrapped function
-   Identity preservation: applying functor-wrapped identity function, is equivalent to doing nothing.
-   Composition preservation: functor-wrapped functions can be composed by applying.
-   Homomorphism: applying functor-wrapped function with functor-wrapped value, is equivalent to functor-wrapping the result of applying that function with that value.
-   Interchange: when applying functor-wrapped functions with a functor-wrapped value, the functor-wrapped functions and the functor-wrapped value can interchange position.

### IEnumerable<> applicative functor

IEnumerable<> functor is a applicative functor. Again, these methods are implemented as extension methods. And for IEnumerable<>, the Wrap method is called Enumerable to be intuitive:

```csharp
public static partial class EnumerableExtensions // IEnumerable<T> : IApplicativeFunctor<IEnumerable<>>
{
    // Apply: (IEnumerable<TSource -> TResult>, IEnumerable<TSource>) -> IEnumerable<TResult>
    public static IEnumerable<TResult> Apply<TSource, TResult>(
        this IEnumerable<Func<TSource, TResult>> selectorWrapper, IEnumerable<TSource> source)
    {
        foreach (Func<TSource, TResult> selector in selectorWrapper)
        {
            foreach (TSource value in source)
            {
                yield return selector(value);
            }
        }
    }

    // Wrap: TSource -> IEnumerable<TSource>
    public static IEnumerable<TSource> Enumerable<TSource>(this TSource value)
    {
        yield return value;
    }
}
```

It can be verified that the above Apply and Wrap (Enumerable) implementations satisfy the applicative laws:

```csharp
internal static void ApplicativeLaws()
{
    IEnumerable<int> source = new int[] { 0, 1, 2, 3, 4 };
    Func<int, double> selector = int32 => Math.Sqrt(int32);
    IEnumerable<Func<int, double>> selectorWrapper1 =
        new Func<int, double>[] { int32 => int32 / 2D, int32 => Math.Sqrt(int32) };
    IEnumerable<Func<double, string>> selectorWrapper2 =
        new Func<double, string>[] { @double => @double.ToString("0.0"), @double => @double.ToString("0.00") };
    Func<Func<double, string>, Func<Func<int, double>, Func<int, string>>> o =
        new Func<Func<double, string>, Func<int, double>, Func<int, string>>(Linq.FuncExtensions.o).Curry();
    int value = 5;

    // Functor preservation: source.Select(selector) == selector.Wrap().Apply(source).
    source.Select(selector).WriteLines(); // 0 1 1.4142135623731 1.73205080756888 2
    selector.Enumerable().Apply(source).WriteLines(); // 0 1 1.4142135623731 1.73205080756888 2
    // Identity preservation: Id.Wrap().Apply(source) == source.
    new Func<int, int>(Functions.Id).Enumerable().Apply(source).WriteLines(); // 0 1 2 3 4
    // Composition preservation: o.Wrap().Apply(selectorWrapper2).Apply(selectorWrapper1).Apply(source) == selectorWrapper2.Apply(selectorWrapper1.Apply(source)).
    o.Enumerable().Apply(selectorWrapper2).Apply(selectorWrapper1).Apply(source).WriteLines();
        // 0.0  0.5  1.0  1.5  2.0
        // 0.0  1.0  1.4  1.7  2.0 
        // 0.00 0.50 1.00 1.50 2.00
        // 0.00 1.00 1.41 1.73 2.00
    selectorWrapper2.Apply(selectorWrapper1.Apply(source)).WriteLines();
        // 0.0  0.5  1.0  1.5  2.0
        // 0.0  1.0  1.4  1.7  2.0 
        // 0.00 0.50 1.00 1.50 2.00
        // 0.00 1.00 1.41 1.73 2.00
    // Homomorphism: selector.Wrap().Apply(value.Wrap()) == selector(value).Wrap().
    selector.Enumerable().Apply(value.Enumerable()).WriteLines(); // 2.23606797749979
    selector(value).Enumerable().WriteLines(); // 2.23606797749979
    // Interchange: selectorWrapper.Apply(value.Wrap()) == (selector => selector(value)).Wrap().Apply(selectorWrapper).
    selectorWrapper1.Apply(value.Enumerable()).WriteLines(); // 2.5 2.23606797749979
    new Func<Func<int, double>, double>(function => function(value)).Enumerable().Apply(selectorWrapper1)
        .WriteLines(); // 2.5 2.23606797749979
}
```

## Monoidal functor vs. applicative functor

The applicative functor definition is actually equivalent to above monoidal functor definition. First, applicative functor’s Apply and Wrap methods can be implemented by monoidal functor’s Multiply and Unit methods:

```csharp
public static partial class EnumerableExtensions // IEnumerable<T> : IApplicativeFunctor<IEnumerable<>>
{
    // Apply: (IEnumerable<TSource -> TResult>, IEnumerable<TSource>) -> IEnumerable<TResult>
    public static IEnumerable<TResult> Apply<TSource, TResult>(
        this IEnumerable<Func<TSource, TResult>> selectorWrapper, IEnumerable<TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));

    // Wrap: TSource -> IEnumerable<TSource>
    public static IEnumerable<TSource> Enumerable<TSource>(this TSource value) => Unit().Select(unit => value);
}
```

On the other hand, monoidal functor’s Multiply and Unit methods can be implemented by applicative functor’s Apply and Wrap methods:

```csharp
public static partial class EnumerableExtensions // IEnumerable<T> : IMonoidalFunctor<IEnumerable<>>
{
    // Multiply: IEnumerable<T1> x IEnumerable<T2> -> IEnumerable<T1 x T2>
    // Multiply: (IEnumerable<T1>, IEnumerable<T2>) -> IEnumerable<(T1, T2)>
    public static IEnumerable<(T1, T2)> Multiply<T1, T2>(
        this IEnumerable<T1> source1, IEnumerable<T2> source2) =>
            new Func<T1, T2, (T1, T2)>(ValueTuple.Create).Curry().Enumerable().Apply(source1).Apply(source2);

    // Unit: Unit -> IEnumerable<Unit>
    public static IEnumerable<Unit> Unit(Unit unit = default) => unit.Enumerable();
}
```

Generally, for any applicative functor, its (Apply, Wrap) method pair can implement the (Multiply, Unit) method pair required as monoidal functor, and vice versa. This can be virtually demonstrated as:

```csharp
// Cannot be compiled.
public static class MonoidalFunctorExtensions // (Multiply, Unit) implements (Apply, Wrap).
{
    // Apply: (TMonoidalFunctor<TSource -> TResult>, TMonoidalFunctor<TSource>) -> TMonoidalFunctor<TResult>
    public static TMonoidalFunctor<TResult> Apply<TMonoidalFunctor<>, TSource, TResult>(
        this TMonoidalFunctor<Func<TSource, TResult>> selectorWrapper, TMonoidalFunctor<TSource> source) 
        where TMonoidalFunctor<> : IMonoidalFunctor<TMonoidalFunctor<>> =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));

    // Wrap: TSource -> TMonoidalFunctor<TSource>
    public static TMonoidalFunctor<TSource> Wrap<TMonoidalFunctor<>, TSource>(this TSource value) 
        where TMonoidalFunctor<> : IMonoidalFunctor<TMonoidalFunctor<>> =>TMonoidalFunctor<TSource>
            TMonoidalFunctor<TSource>.Unit().Select(unit => value);
}

// Cannot be compiled.
public static class ApplicativeFunctorExtensions // (Apply, Wrap) implements (Multiply, Unit).
{
    // Multiply: TApplicativeFunctor<T1> x TApplicativeFunctor<T2> -> TApplicativeFunctor<T1 x T2>
    // Multiply: (TApplicativeFunctor<T1>, TApplicativeFunctor<T2>) -> TApplicativeFunctor<(T1, T2)>
    public static TApplicativeFunctor<(T1, T2)> Multiply<TApplicativeFunctor<>, T1, T2>(
        this TApplicativeFunctor<T1> source1, TApplicativeFunctor<T2> source2) 
        where TApplicativeFunctor<> : IApplicativeFunctor<TApplicativeFunctor<>> =>
            new Func<T1, T2, (T1, T2)>(ValueTuple.Create).Curry().Wrap().Apply(source1).Apply(source2);

    // Unit: Unit -> TApplicativeFunctor<Unit>
    public static TApplicativeFunctor<Unit> Unit<TApplicativeFunctor<>>(Unit unit = default)
        where TApplicativeFunctor<> : IApplicativeFunctor<TApplicativeFunctor<>> => unit.Wrap();
}
```

## More Monoidal functors and applicative functors

The Lazy<>, Func<>, Func<T,> functors are also monoidal/applicative functors:

```csharp
public static partial class LazyExtensions // Lazy<T> : IMonoidalFunctor<Lazy<>>
{
    // Multiply: Lazy<T1> x Lazy<T2> -> Lazy<T1 x T2>
    // Multiply: (Lazy<T1>, Lazy<T2>) -> Lazy<(T1, T2)>
    public static Lazy<(T1, T2)> Multiply<T1, T2>(this Lazy<T1> source1, Lazy<T2> source2) =>
        new Lazy<(T1, T2)>(() => (source1.Value, source2.Value));

    // Unit: Unit -> Lazy<Unit>
    public static Lazy<Unit> Unit(Unit unit = default) => new Lazy<Unit>(() => unit);
}

public static partial class LazyExtensions // Lazy<T> : IApplicativeFunctor<Lazy<>>
{
    // Apply: (Lazy<TSource -> TResult>, Lazy<TSource>) -> Lazy<TResult>
    public static Lazy<TResult> Apply<TSource, TResult>(
        this Lazy<Func<TSource, TResult>> selectorWrapper, Lazy<TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));

    // Wrap: TSource -> Lazy<TSource>
    public static Lazy<T> Lazy<T>(this T value) => Unit().Select(unit => value);
}

public static partial class FuncExtensions // Func<T> : IMonoidalFunctor<Func<>>
{
    // Multiply: Func<T1> x Func<T2> -> Func<T1 x T2>
    // Multiply: (Func<T1>, Func<T2>) -> Func<(T1, T2)>
    public static Func<(T1, T2)> Multiply<T1, T2>(this Func<T1> source1, Func<T2> source2) =>
        () => (source1(), source2());

    // Unit: Unit -> Func<Unit>
    public static Func<Unit> Unit(Unit unit = default) => () => unit;
}

public static partial class FuncExtensions // Func<T> : IApplicativeFunctor<Func<>>
{
    // Apply: (Func<TSource -> TResult>, Func<TSource>) -> Func<TResult>
    public static Func<TResult> Apply<TSource, TResult>(
        this Func<Func<TSource, TResult>> selectorWrapper, Func<TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));

    // Wrap: TSource -> Func<TSource>
    public static Func<T> Func<T>(this T value) => Unit().Select(unit => value);
}

public static partial class FuncExtensions // Func<T, TResult> : IMonoidalFunctor<Func<T,>>
{
    // Multiply: Func<T, T1> x Func<T, T2> -> Func<T, T1 x T2>
    // Multiply: (Func<T, T1>, Func<T, T2>) -> Func<T, (T1, T2)>
    public static Func<T, (T1, T2)> Multiply<T, T1, T2>(this Func<T, T1> source1, Func<T, T2> source2) =>
        value => (source1(value), source2(value));

    // Unit: Unit -> Func<T, Unit>
    public static Func<T, Unit> Unit<T>(Unit unit = default) => _ => unit;
}

public static partial class FuncExtensions // Func<T, TResult> : IApplicativeFunctor<Func<T,>>
{
    // Apply: (Func<T, TSource -> TResult>, Func<T, TSource>) -> Func<T, TResult>
    public static Func<T, TResult> Apply<T, TSource, TResult>(
        this Func<T, Func<TSource, TResult>> selectorWrapper, Func<T, TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));

    // Wrap: TSource -> Func<T, TSource>
    public static Func<T, TSource> Func<T, TSource>(this TSource value) => Unit<T>().Select(unit => value);
}

public static partial class OptionalExtensions // Optional<T> : IMonoidalFunctor<Optional<>>
{
    // Multiply: Optional<T1> x Optional<T2> -> Optional<T1 x T2>
    // Multiply: (Optional<T1>, Optional<T2>) -> Optional<(T1, T2)>
    public static Optional<(T1, T2)> Multiply<T1, T2>(this Optional<T1> source1, Optional<T2> source2) =>
        new Optional<(T1, T2)>(() => source1.HasValue && source2.HasValue
            ? (true, (source1.Value, source2.Value))
            : (false, (default, default)));

    // Unit: Unit -> Optional<Unit>
    public static Optional<Unit> Unit(Unit unit = default) =>
        new Optional<Unit>(() => (true, unit));
}

public static partial class OptionalExtensions // Optional<T> : IApplicativeFunctor<Optional<>>
{
    // Apply: (Optional<TSource -> TResult>, Optional<TSource>) -> Optional<TResult>
    public static Optional<TResult> Apply<TSource, TResult>(
        this Optional<Func<TSource, TResult>> selectorWrapper, Optional<TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2));

    // Wrap: TSource -> Optional<TSource>
    public static Optional<T> Optional<T>(this T value) => Unit().Select(unit => value);
}
```

The ValueTuple<> and Task<> functors are monoidal/applicative functors too. Notice their Multiply/Apply methods cannot defer the execution, and Task<>’s Multiply/Apply methods are impure.

```csharp
public static partial class ValueTupleExtensions // ValueTuple<T> : IMonoidalFunctor<ValueTuple<>>
{
    // Multiply: ValueTuple<T1> x ValueTuple<T2> -> ValueTuple<T1 x T2>
    // Multiply: (ValueTuple<T1>, ValueTuple<T2>) -> ValueTuple<(T1, T2)>
    public static ValueTuple<(T1, T2)> Multiply<T1, T2>(this ValueTuple<T1> source1, ValueTuple<T2> source2) =>
        new ValueTuple<(T1, T2)>((source1.Item1, source2.Item1)); // Immediate execution.

    // Unit: Unit -> ValueTuple<Unit>
    public static ValueTuple<Unit> Unit(Unit unit = default) => new ValueTuple<Unit>(unit);
}

public static partial class ValueTupleExtensions // ValueTuple<T> : IApplicativeFunctor<ValueTuple<>>
{
    // Apply: (ValueTuple<TSource -> TResult>, ValueTuple<TSource>) -> ValueTuple<TResult>
    public static ValueTuple<TResult> Apply<TSource, TResult>(
        this ValueTuple<Func<TSource, TResult>> selectorWrapper, ValueTuple<TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2)); // Immediate execution.

    // Wrap: TSource -> ValueTuple<TSource>
    public static ValueTuple<T> ValueTuple<T>(this T value) => Unit().Select(unit => value);
}

public static partial class TaskExtensions // Task<T> : IMonoidalFunctor<Task<>>
{
    // Multiply: Task<T1> x Task<T2> -> Task<T1 x T2>
    // Multiply: (Task<T1>, Task<T2>) -> Task<(T1, T2)>
    public static async Task<(T1, T2)> Multiply<T1, T2>(this Task<T1> source1, Task<T2> source2) =>
        ((await source1), (await source2)); // Immediate execution, impure.

    // Unit: Unit -> Task<Unit>
    public static Task<Unit> Unit(Unit unit = default) => System.Threading.Tasks.Task.FromResult(unit);
}

public static partial class TaskExtensions // Task<T> : IApplicativeFunctor<Task<>>
{
    // Apply: (Task<TSource -> TResult>, Task<TSource>) -> Task<TResult>
    public static Task<TResult> Apply<TSource, TResult>(
        this Task<Func<TSource, TResult>> selectorWrapper, Task<TSource> source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2)); // Immediate execution, impure.

    // Wrap: TSource -> Task<TSource>
    public static Task<T> Task<T>(this T value) => Unit().Select(unit => value);
}
```

It is easy to verify all the above (Multiply, Unit) method pairs preserve the monoid laws, and all the above (Apply, Wrap) method pairs satisfy the applicative laws. However, not any (Multiply, Unit) or any (Apply, Wrap) can automatically satisfy the laws. Take the ValueTuple<T,> functor as example:

```csharp
public static partial class ValueTupleExtensions // ValueTuple<T1, T2 : IMonoidalFunctor<ValueTuple<T,>>
{
    // Multiply: ValueTuple<T, T1> x ValueTuple<T, T2> -> ValueTuple<T, T1 x T2>
    // Multiply: (ValueTuple<T, T1>, ValueTuple<T, T2>) -> ValueTuple<T, (T1, T2)>
    public static (T, (T1, T2)) Multiply<T, T1, T2>(this (T, T1) source1, (T, T2) source2) =>
        (source1.Item1, (source1.Item2, source2.Item2)); // Immediate execution.

    // Unit: Unit -> ValueTuple<Unit>
    public static (T, Unit) Unit<T>(Unit unit = default) => (default, unit);
}

public static partial class ValueTupleExtensions // ValueTuple<T, TResult> : IApplicativeFunctor<ValueTuple<T,>>
{
    // Apply: (ValueTuple<T, TSource -> TResult>, ValueTuple<T, TSource>) -> ValueTuple<T, TResult>
    public static (T, TResult) Apply<T, TSource, TResult>(
        this (T, Func<TSource, TResult>) selectorWrapper, (T, TSource) source) =>
            selectorWrapper.Multiply(source).Select(product => product.Item1(product.Item2)); // Immediate execution.

    // Wrap: TSource -> ValueTuple<T, TSource>
    public static (T, TSource) ValueTuple<T, TSource>(this TSource value) => Unit<T>().Select(unit => value);
}
```

The above (Multiply, Unit) implementations cannot preserve the left unit law:

```csharp
internal static void MonoidalFunctorLaws()
{
    (string, int) source = ("a", 1);
    (string, Unit) unit = Unit<string>();
    (string, int) source1 = ("b", 2);
    (string, char) source2 = ("c", '@');
    (string, bool) source3 = ("d", true);

    // Associativity preservation: source1.Multiply(source2).Multiply(source3).Select(Associator) == source1.Multiply(source2.Multiply(source3)).
    source1.Multiply(source2).Multiply(source3).Select(Associator).WriteLine(); // (b, (2, (@, True)))
    source1.Multiply(source2.Multiply(source3)).WriteLine(); // (b, (2, (@, True)))
    // Left unit preservation: unit.Multiply(source).Select(LeftUnitor) == source.
    unit.Multiply(source).Select(LeftUnitor).WriteLine(); // (, 1)
    // Right unit preservation: source == source.Multiply(unit).Select(RightUnitor).
    source.Multiply(unit).Select(RightUnitor).WriteLine(); // (a, 1)
}
```

And the above (Apply, Wrap) implementation breaks all applicative laws:

```csharp
internal static void ApplicativeLaws()
{
    (string, int) source = ("a", 1);
    Func<int, double> selector = int32 => Math.Sqrt(int32);
    (string, Func<int, double>) selectorWrapper1 = 
        ("b", new Func<int, double>(int32 => Math.Sqrt(int32)));
    (string, Func<double, string>) selectorWrapper2 =
        ("c", new Func<double, string>(@double => @double.ToString("0.00")));
    Func<Func<double, string>, Func<Func<int, double>, Func<int, string>>> o = 
        new Func<Func<double, string>, Func<int, double>, Func<int, string>>(Linq.FuncExtensions.o).Curry();
    int value = 5;

    // Functor preservation: source.Select(selector) == selector.Wrap().Apply(source).
    source.Select(selector).WriteLine(); // (a, 1)
    selector.ValueTuple<string, Func<int, double>>().Apply(source).WriteLine(); // (, 1)
    // Identity preservation: Id.Wrap().Apply(source) == source.
    new Func<int, int>(Functions.Id).ValueTuple<string, Func<int, int>>().Apply(source).WriteLine(); // (, 1)
    // Composition preservation: o.Curry().Wrap().Apply(selectorWrapper2).Apply(selectorWrapper1).Apply(source) == selectorWrapper2.Apply(selectorWrapper1.Apply(source)).
    o.ValueTuple<string, Func<Func<double, string>, Func<Func<int, double>, Func<int, string>>>>()
        .Apply(selectorWrapper2).Apply(selectorWrapper1).Apply(source).WriteLine(); // (, 1.00)
    selectorWrapper2.Apply(selectorWrapper1.Apply(source)).WriteLine(); // (c, 1.00)
    // Homomorphism: selector.Wrap().Apply(value.Wrap()) == selector(value).Wrap().
    selector.ValueTuple<string, Func<int, double>>().Apply(value.ValueTuple<string, int>()).WriteLine(); // (, 2.23606797749979)
    selector(value).ValueTuple<string, double>().WriteLine(); // (, 2.23606797749979)
    // Interchange: selectorWrapper.Apply(value.Wrap()) == (selector => selector(value)).Wrap().Apply(selectorWrapper).
    selectorWrapper1.Apply(value.ValueTuple<string, int>()).WriteLine(); // (b, 2.23606797749979)
    new Func<Func<int, double>, double>(function => function(value))
        .ValueTuple<string, Func<Func<int, double>, double>>().Apply(selectorWrapper1).WriteLine(); // (, 2.23606797749979)
}
```