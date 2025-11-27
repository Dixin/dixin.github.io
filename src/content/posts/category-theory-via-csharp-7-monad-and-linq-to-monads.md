---
title: "Category Theory via C# (7) Monad and LINQ to Monads"
published: 2024-12-26
description: "As fore mentioned endofunctor category can be monoidal (the entire category. Actually, an endofunctor In the endofunctor category can be monoidal too. This kind of endofunctor is called monad. Monad i"
image: ""
tags: [".NET", "C#", "Category Theory", "Functional Programming", "LINQ", "LINQ via C#", "Monads"]
category: ".NET"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## Monad

As fore mentioned endofunctor category can be monoidal (the entire category. Actually, an endofunctor In the endofunctor category can be monoidal too. This kind of endofunctor is called monad. Monad is another important algebraic structure in category theory and LINQ. Formally, [monad](http://en.wikipedia.org/wiki/Monad_\(category_theory\)) is an endofunctor equipped with 2 natural transformations:

-   Monoid multiplication ◎ or μ, which a natural transformation ◎: F(F) ⇒ F, which means, for each object X, ◎ maps F(F(X)) to F(X). For convenience, this mapping operation is also denoted F ◎ F ⇒ F.
-   Monoid unit η, which is a natural transformation η: I ⇒ F. Here I is the identity functor, which maps each object X to X itself. For each X, there is η maps I(X) to F(X). Since I(X) is just X, η can also be viewed as mapping: X → F(X).

So monad F is a monoid (F, ◎, η) in the category of endofunctors. Apparently it must preserve the monoid laws:

-   Associativity preservation α: (F ◎ F) ◎ F ≡ F ◎ (F ◎ F)
-   Left unit preservation λ: η ◎ F ≡ F, and right unit preservation ρ: F ≡ F ◎ η

So that, the following diagram commutes:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-6-Monad-and-LINQ-t_1486B/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-6-Monad-and-LINQ-t_1486B/image_2.png)

In DotNet category, monad can be defined as:

```typescript
// Cannot be compiled.
public partial interface IMonad<TMonad<>> : IFunctor<TMonad<>> where TMonad<> : IMonad<TMonad<>>
{
    // From IFunctor<TMonad<>>:
    // Select: (TSource -> TResult) -> (TMonad<TSource> -> TMonad<TResult>)
    // Func<TMonad<TSource>, TMonad<TResult>> Select<TSource, TResult>(Func<TSource, TResult> selector);

    // Multiply: TMonad<TMonad<TSource>> -> TMonad<TSource>
    TMonad<TSource> Multiply<TSource>(TMonad<TMonad<TSource>> sourceWrapper);
        
    // Unit: TSource -> TMonad<TSource>
    TMonad<TSource> Unit<TSource>(TSource value);
}
```

## LINQ to Monads and monad laws

### Built-in IEnumerable<> monad

The previously discussed IEnumerable<> functor is a built-in monad, it is straightforward to implement its (Multiply, Unit) method pair:

```csharp
public static partial class EnumerableExtensions // IEnumerable<T> : IMonad<IEnumerable<>>
{
    // Multiply: IEnumerable<IEnumerable<TSource>> -> IEnumerable<TSource>
    public static IEnumerable<TSource> Multiply<TSource>(this IEnumerable<IEnumerable<TSource>> sourceWrapper)
    {
        foreach (IEnumerable<TSource> source in sourceWrapper)
        {
            foreach (TSource value in source)
            {
                yield return value;
            }
        }
    }

    // Unit: TSource -> IEnumerable<TSource>
    public static IEnumerable<TSource> Unit<TSource>(TSource value)
    {
        yield return value;
    }
}
```

The monoid unit η is exactly the same as the Wrap method for monoidal functor. It is easy to verify the above implementation preserves the monoid laws:

```csharp
internal static void MonoidLaws()
{
    IEnumerable<int> source = new int[] { 0, 1, 2, 3, 4 };

    // Associativity preservation: source.Wrap().Multiply().Wrap().Multiply() == source.Wrap().Wrap().Multiply().Multiply().
    source.Enumerable().Multiply().Enumerable().Multiply().WriteLines();
    // 0 1 2 3 4
    source.Enumerable().Enumerable().Multiply().Multiply().WriteLines();
    // 0 1 2 3 4
    // Left unit preservation: Unit(source).Multiply() == f.
    Unit(source).Multiply().WriteLines(); // 0 1 2 3 4
    // Right unit preservation: source == source.Select(Unit).Multiply().
    source.Select(Unit).Multiply().WriteLines(); // 0 1 2 3 4
}
```

As discussed in LINQ to Object chapter, for IEnumerable<>, there is already a query method SelectMany providing the same ability to flatten hierarchy an IEnumerable<IEnumerable<T>> sequence to an IEnumerable<T> sequence. Actually, monad can be alternatively defined with SelectMany and η/Wrap:

```typescript
public partial interface IMonad<TMonad> where TMonad<> : IMonad<TMonad<>>
{
    // SelectMany: (TMonad<TSource>, TSource -> TMonad<TSelector>, (TSource, TSelector) -> TResult) -> TMonad<TResult>
    TMonad<TResult> SelectMany<TSource, TSelector, TResult>(
        TMonad<TSource> source,
        Func<TSource, TMonad<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector);

    // Wrap: TSource -> IEnumerable<TSource>
    TMonad<TSource> Wrap<TSource>(TSource value);
}
```

And the alternative implementation is very similar:

```csharp
public static partial class EnumerableExtensions // IEnumerable<T> : IMonad<IEnumerable<>>
{
    // SelectMany: (IEnumerable<TSource>, TSource -> IEnumerable<TSelector>, (TSource, TSelector) -> TResult) -> IEnumerable<TResult>
    public static IEnumerable<TResult> SelectMany<TSource, TSelector, TResult>(
        this IEnumerable<TSource> source,
        Func<TSource, IEnumerable<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector)
    {
        foreach (TSource value in source)
        {
            foreach (TSelector result in selector(value))
            {
                yield return resultSelector(value, result);
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

The above 2 versions of monad definition are equivalent. First, the (SelectMany, Wrap) methods can be implemented with the (Select, Multiply, Unit) methods:

```csharp
public static partial class EnumerableExtensions // (Select, Multiply, Unit) implements (SelectMany, Wrap).
{
    // SelectMany: (IEnumerable<TSource>, TSource -> IEnumerable<TSelector>, (TSource, TSelector) -> TResult) -> IEnumerable<TResult>
    public static IEnumerable<TResult> SelectMany<TSource, TSelector, TResult>(
        this IEnumerable<TSource> source,
        Func<TSource, IEnumerable<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            (from value in source
             select (from result in selector(value)
                     select resultSelector(value, result))).Multiply();
            // Compiled to:
            // source.Select(value => selector(value).Select(result => resultSelector(value, result))).Multiply();

    // Wrap: TSource -> IEnumerable<TSource>
    public static IEnumerable<TSource> Enumerable<TSource>(this TSource value) => Unit(value);
}
```

And the (Select, Multiply, Unit) methods can be implemented with (SelectMany, Wrap) methods too:

```csharp
public static partial class EnumerableExtensions // (SelectMany, Wrap) implements (Select, Multiply, Unit).
{
    // Select: (TSource -> TResult) -> (IEnumerable<TSource> -> IEnumerable<TResult>).
    public static Func<IEnumerable<TSource>, IEnumerable<TResult>> Select<TSource, TResult>(
        Func<TSource, TResult> selector) => source =>
            from value in source
            from result in value.Enumerable()
            select result;
            // source.SelectMany(Enumerable, (result, value) => value);

    // Multiply: IEnumerable<IEnumerable<TSource>> -> IEnumerable<TSource>
    public static IEnumerable<TSource> Multiply<TSource>(this IEnumerable<IEnumerable<TSource>> sourceWrapper) =>
        from source in sourceWrapper
        from value in source
        select value;
        // sourceWrapper.SelectMany(source => source, (source, value) => value);

    // Unit: TSource -> IEnumerable<TSource>
    public static IEnumerable<TSource> Unit<TSource>(TSource value) => value.Enumerable();
}
```

So monad support is built-in in the C# language. As discussed in the LINQ query expression pattern part, SelectMany enables multiple from clauses, which can chain operations together to build a workflow, for example:

```csharp
internal static void Workflow<T1, T2, T3, T4>(
    Func<IEnumerable<T1>> source1,
    Func<IEnumerable<T2>> source2,
    Func<IEnumerable<T3>> source3,
    Func<T1, T2, T3, IEnumerable<T4>> source4)
{
    IEnumerable<T4> query = from value1 in source1()
                            from value2 in source2()
                            from value3 in source3()
                            from value4 in source4(value1, value2, value3)
                            select value4; // Define query.
    query.WriteLines(); // Execute query.
}
```

Here N + 1 from clauses are compiled to N SelectMany fluent calls:

```csharp
internal static void CompiledWorkflow<T1, T2, T3, T4>(
    Func<IEnumerable<T1>> source1,
    Func<IEnumerable<T2>> source2,
    Func<IEnumerable<T3>> source3,
    Func<T1, T2, T3, IEnumerable<T4>> source4)
{
    IEnumerable<T4> query = source1()
        .SelectMany(value1 => source2(), (value1, value2) => new { Value1 = value1, Value2 = value2 })
        .SelectMany(result2 => source3(), (result2, value3) => new { Result2 = result2, Value3 = value3 })
        .SelectMany(
            result3 => source4(result3.Result2.Value1, result3.Result2.Value2, result3.Value3),
            (result3, value4) => value4); // Define query.
    query.WriteLines(); // Execute query.
}
```

In LINQ, if monad’s SelectMany implements deferred execution, then monad enables imperative programming paradigm (a sequence of commands) in a purely functional way. In above LINQ query definition, the calls to the commands are not executed. When trying to pull results from the LINQ query, the workflow stars, and the commands executes sequentially.

### Monad law and Kleisli composition

Regarding monad (F, ◎, η) can be redefined as (F, SelectMany, Wrap), the monoid laws now can be expressed by SelectMany and Wrap too, which are called monad laws:

-   Associativity law: SelectMany is the associative operator, since it is equivalent to Multiply.
-   Left unit law and right unit law: Wrap is the unit η, since it is identical to Unit.

```csharp
internal static void MonadLaws()
{
    IEnumerable<int> source = new int[] { 0, 1, 2, 3, 4 };
    Func<int, IEnumerable<char>> selector = int32 => new string('*', int32);
    Func<int, IEnumerable<double>> selector1 = int32 => new double[] { int32 / 2D, Math.Sqrt(int32) };
    Func<double, IEnumerable<string>> selector2 =
        @double => new string[] { @double.ToString("0.0"), @double.ToString("0.00") };
    const int Value = 5;

    // Associativity: source.SelectMany(selector1).SelectMany(selector2) == source.SelectMany(value => selector1(value).SelectMany(selector2)).
    (from value in source
     from result1 in selector1(value)
     from result2 in selector2(result1)
     select result2).WriteLines();
    // 0.0 0.00 0.0 0.00
    // 0.5 0.50 1.0 1.00
    // 1.0 1.00 1.4 1.41
    // 1.5 1.50 1.7 1.73
    // 2.0 2.00 2.0 2.00
    (from value in source
     from result in (from result1 in selector1(value)
                     from result2 in selector2(result1)
                     select result2)
     select result).WriteLines();
    // 0.0 0.00 0.0 0.00
    // 0.5 0.50 1.0 1.00
    // 1.0 1.00 1.4 1.41
    // 1.5 1.50 1.7 1.73
    // 2.0 2.00 2.0 2.00
    // Left unit: value.Wrap().SelectMany(selector) == selector(value).
    (from value in Value.Enumerable()
     from result in selector(value)
     select result).WriteLines(); // * * * * *
    selector(Value).WriteLines(); // * * * * *
    // Right unit: source == source.SelectMany(Wrap).
    (from value in source
     from result in value.Enumerable()
     select result).WriteLines(); // 0 1 2 3 4
}
```

However, the monad laws are not intuitive. The Kleisli composition ∘ can help. For 2 monadic selector functions that can be passed to SelectMany,are also called Kleisli functions like s1: TSource –> TMonad<TMiddle> and s2: TMiddle –> TMonad<TResult>, their Kleisli composition is still a monadic selector (s2 ∘ s1): TSource –> TMonad<TResult>:

```csharp
public static Func<TSource, IEnumerable<TResult>> o<TSource, TMiddle, TResult>( // After.
    this Func<TMiddle, IEnumerable<TResult>> selector2,
    Func<TSource, IEnumerable<TMiddle>> selector1) =>
        value => selector1(value).SelectMany(selector2, (result1, result2) => result2);
        // Equivalent to:
        // value => selector1(value).Select(selector2).Multiply();
```

Or generally:

```csharp
// Cannot be compiled.
public static class FuncExtensions
{
    public static Func<TSource, TMonad<TResult>> o<TMonad<>, TSource, TMiddle, TResult>( // After.
        this Func<TMiddle, TMonad<TResult>> selector2,
        Func<TSource, TMonad<TMiddle>> selector1) where TMonad<> : IMonad<TMonad<>> =>
            value => selector1(value).SelectMany(selector2, (result1, result2) => result2);
            // Equivalent to:
            // value => selector1(value).Select(selector2).Multiply();
}
```

Now above monad laws can be expressed by monadic selectors and Kleisli composition:

-   Associativity law: the Kleisli composition of monadic selectors is now the monoid multiplication, it is associative. For monadic selectors s1, s2, s3, there is (s3 ∘ s2) ∘ s1 = s3 ∘ (s2 ∘ s1).
-   Left unit law and right unit law: Wrap is still the monoid unit η, it is of type TSource –> TMonad<TSource>, so it can also be viewed as a monadic selector too. For monadic selector s, there is η ∘ s = s and s = s ∘ η.

```csharp
internal static void KleisliComposition()
{
    Func<bool, IEnumerable<int>> selector1 =
        boolean => boolean ? new int[] { 0, 1, 2, 3, 4 } : new int[] { 5, 6, 7, 8, 9 };
    Func<int, IEnumerable<double>> selector2 = int32 => new double[] { int32 / 2D, Math.Sqrt(int32) };
    Func<double, IEnumerable<string>> selector3 =
        @double => new string[] { @double.ToString("0.0"), @double.ToString("0.00") };

    // Associativity: selector3.o(selector2).o(selector1) == selector3.o(selector2.o(selector1)).
    selector3.o(selector2).o(selector1)(true).WriteLines();
    // 0.0 0.00 0.0 0.00
    // 0.5 0.50 1.0 1.00
    // 1.0 1.00 1.4 1.41
    // 1.5 1.50 1.7 1.73
    // 2.0 2.00 2.0 2.00
    selector3.o(selector2.o(selector1))(true).WriteLines();
    // 0.0 0.00 0.0 0.00
    // 0.5 0.50 1.0 1.00
    // 1.0 1.00 1.4 1.41
    // 1.5 1.50 1.7 1.73
    // 2.0 2.00 2.0 2.00
    // Left unit: Unit.o(selector) == selector.
    Func<int, IEnumerable<int>> leftUnit = Enumerable;
    leftUnit.o(selector1)(true).WriteLines(); // 0 1 2 3 4
    selector1(true).WriteLines(); // 0 1 2 3 4
    // Right unit: selector == selector.o(Unit).
    selector1(false).WriteLines(); // 5 6 7 8 9
    Func<bool, IEnumerable<bool>> rightUnit = Enumerable;
    selector1.o(rightUnit)(false).WriteLines(); // 5 6 7 8 9
}
```

### Kleisli category

With monad and Kleisli composition, a new kind of category called Kleisli category can be defined. Given a monad (F, ◎, η) in category C, there is a Kleisli category of F, denoted CF:

-   Its objects ob(CF) are ob(C), all objects in C.
-   Its morphisms hom(CF) are Kleisli morphisms. A Kleisli morphisms m from object X to object Y is m: X → F(Y). In DotNet, the Kleisli morphisms are above monadic selector functions.
-   The composition of Kleisli morphisms is the above Kleisli composition.
-   The identity Kleisli morphism is η of the monad, so that ηX: X → F(X).

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-6-Monad-and-LINQ-t_1486B/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-6-Monad-and-LINQ-t_1486B/image_4.png)

As already demonstrated, Kleisli composition and η satisfy the category associativity law and identity law.

### Monad pattern of LINQ

So LINQ SelectMany query’s quintessential mathematics is monad. Generally, in DotNet category, a type is a monad if:

-   This type is an open generic type definition, which can be viewed as type constructor of kind \* –> \*, so that it maps a concrete type to another concrete monad-wrapped type.
-   It is equipped with the standard LINQ query method SelectMany, which can be either instance method or extension method.
-   The implementation of SelectMany satisfies the monad laws, so that the monad’s monoid structure is preserved.

As [Brian Beckman](https://www.linkedin.com/in/brianbeckman) said in [this Channel 9 video](http://channel9.msdn.com/Shows/Going+Deep/Brian-Beckman-Dont-fear-the-Monads):

> LINQ is monad. It is very carefully designed by [Erik Meijer](http://en.wikipedia.org/wiki/Erik_Meijer_\(computer_scientist\)) so that it is monad.

[Eric Lippert](http://ericlippert.com/) also [mentioned](http://stackoverflow.com/questions/4683506/are-there-any-connections-between-haskell-and-linq):

> The LINQ syntax is designed specifically to make operations on the sequence monad feel natural, but in fact the implementation is more general; what C# calls "SelectMany" is a slightly modified form of the "Bind" operation on an arbitrary monad.

On the other hand, to enable the monad LINQ query expression (multiple from clauses with select clause) for a type does not require that type to be strictly a monad. This LINQ workflow syntax can be enabled for any generic or non generic type as long as it has such a SelectMany method, which can be virtually demonstrated as:

```csharp
// Cannot be compiled.
internal static void Workflow<TMonad<>, T1, T2, T3, T4, TResult>( // Non generic TMonad can work too.
    Func<TMonad<T1>> operation1,
    Func<TMonad<T2>> operation2,
    Func<TMonad<T3>> operation3,
    Func<TMonad<T4>> operation4,
    Func<T1, T2, T3, T4, TResult> resultSelector) where TMonad<> : IMonad<TMonad<>>
{
    TMonad<TResult> query = from /* T1 */ value1 in /* TMonad<T1> */ operation1()
                            from /* T2 */ value2 in /* TMonad<T1> */ operation2()
                            from /* T3 */ value3 in /* TMonad<T1> */ operation3()
                            from /* T4 */ value4 in /* TMonad<T1> */ operation4()
                            select /* TResult */ resultSelector(value1, value2, value3, value4); // Define query.
}
```

## Monad vs. monoidal/applicative functor

Monad is monoidal functor and applicative functor. Monads’ (SelectMany, Wrap) methods implement monoidal functor’s Multiply and Unit methods, and applicative functor’s (Apply, Wrap) methods. This can be virtually demonstrated as:

```csharp
// Cannot be compiled.
public static partial class MonadExtensions // (SelectMany, Wrap) implements (Multiply, Unit).
{
    // Multiply: (TMonad<T1>, TMonad<T2>) => TMonad<(T1, T2)>
    public static TMonad<(T1, T2)> Multiply<TMonad<>, T1, T2>(
        this TMonad<T1> source1, TMonad<T2> source2) where TMonad<> : IMonad<TMonad<>> =>
            from value1 in source1
            from value2 in source2
            select (value1, value2);
            // source1.SelectMany(value1 => source2 (value1, value2) => value1.ValueTuple(value2));

    // Unit: Unit -> TMonad<Unit>
    public static TMonad<Unit> Unit<TMonad<>>(
        Unit unit = default) where TMonad<> : IMonad<TMonad<>> => unit.Wrap();
}

// Cannot be compiled.
public static partial class MonadExtensions // (SelectMany, Wrap) implements (Apply, Wrap).
{
    // Apply: (TMonad<TSource -> TResult>, TMonad<TSource>) -> TMonad<TResult>
    public static TMonad<TResult> Apply<TMonad<>, TSource, TResult>(
        this TMonad<Func<TSource, TResult>> selectorWrapper, 
        TMonad<TSource> source) where TMonad<> : IMonad<TMonad<>> =>
            from selector in selectorWrapper
            from value in source
            select selector(value);
            // selectorWrapper.SelectMany(selector => source, (selector, value) => selector(value));

    // Monad's Wrap is identical to applicative functor's Wrap.
}
```

If monad is defined with the (Multiply, Unit) methods, they implement monoidal functor’s Multiply and Unit methods, and applicative functor’s (Apply, Wrap) methods too:

```csharp
// Cannot be compiled.
public static class MonadExtensions // Monad (Multiply, Unit) implements monoidal functor (Multiply, Unit).
{
    // Multiply: (TMonad<T1>, TMonad<T2>) => TMonad<(T1, T2)>
    public static TMonad<(T1, T2)> Multiply<TMonad<>, T1, T2>(
        this TMonad<T1> source1, TMonad<T2> source2) where TMonad<> : IMonad<TMonad<>> =>
            (from value1 in source1
             select (from value2 in source2
                     select (value1, value2))).Multiply();
            // source1.Select(value1 => source2.Select(value2 => (value1, value2))).Multiply();

    // Unit: Unit -> TMonad<Unit>
    public static TMonad<Unit> Unit<TMonad>(Unit unit = default) where TMonad<>: IMonad<TMonad<>> => 
        TMonad<Unit>.Unit<Unit>(unit);
}

// Cannot be compiled.
public static partial class MonadExtensions // Monad (Multiply, Unit) implements applicative functor (Apply, Wrap).
{
    // Apply: (TMonad<TSource -> TResult>, TMonad<TSource>) -> TMonad<TResult>
    public static TMonad<TResult> Apply<TMonad<>, TSource, TResult>(
        this TMonad<Func<TSource, TResult>> selectorWrapper, 
        TMonad<TSource> source)  where TMonad<> : IMonad<TMonad<>> =>
            (from selector in selectorWrapper
             select (from value in source
                     select selector(value))).Multiply();
            // selectorWrapper.Select(selector => source.Select(value => selector(value))).Multiply();

    // Wrap: TSource -> TMonad<TSource>
    public static TMonad<TSource> Wrap<TMonad<>, TSource>(
        this TSource value) where TMonad<>: IMonad<TMonad<>> => TMonad<TSource>.Unit<TSource>(value);
}
```

So the monad definition can be updated to implement monoidal functor and applicative functor too:

```typescript
// Cannot be compiled.
public partial interface IMonad<TMonad<>> : IMonoidalFunctor<TMonad<>>, IApplicativeFunctor<TMonad<>>
{
}
```

## More LINQ to Monads

Many other open generic type definitions provided by .NET can be monad. Take Lazy<> functor as example, first, apparently it is a type constructor of kind \* –> \*. Then, its SelectMany query method can be defined as extension method:

```csharp
public static partial class LazyExtensions // Lazy<T> : IMonad<Lazy<>>
{
    // Multiply: Lazy<Lazy<TSource> -> Lazy<TSource>
    public static Lazy<TSource> Multiply<TSource>(this Lazy<Lazy<TSource>> sourceWrapper) =>
        sourceWrapper.SelectMany(Id, False);

    // Unit: TSource -> Lazy<TSource>
    public static Lazy<TSource> Unit<TSource>(TSource value) => Lazy(value);

    // SelectMany: (Lazy<TSource>, TSource -> Lazy<TSelector>, (TSource, TSelector) -> TResult) -> Lazy<TResult>
    public static Lazy<TResult> SelectMany<TSource, TSelector, TResult>(
        this Lazy<TSource> source,
        Func<TSource, Lazy<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) => 
            new Lazy<TResult>(() => resultSelector(source.Value, selector(source.Value).Value));
}
```

Its Wrap method has been implemented previously, as a requirement of applicative functor. The following is an example of chaining operations into a workflow with Lazy<> monad:

```csharp
internal static void Workflow()
{
    Lazy<string> query = from filePath in new Lazy<string>(Console.ReadLine)
                         from encodingName in new Lazy<string>(Console.ReadLine)
                         from encoding in new Lazy<Encoding>(() => Encoding.GetEncoding(encodingName))
                         from fileContent in new Lazy<string>(() => File.ReadAllText(filePath, encoding))
                         select fileContent; // Define query.
    string result = query.Value; // Execute query.
}
```

Since SelectMany implements deferred execution, the above LINQ query is pure and the workflow is deferred. When the query is executed by calling Lazy<>.Value, the workflow is started.

Func<> functor is also monad, with the following SelectMany:

```csharp
public static partial class FuncExtensions // Func<T> : IMonad<Func<>>
{
    // Multiply: Func<Func<T> -> Func<T>
    public static Func<TSource> Multiply<TSource>(this Func<Func<TSource>> sourceWrapper) => 
        sourceWrapper.SelectMany(source => source, (source, value) => value);

    // Unit: Unit -> Func<Unit>
    public static Func<TSource> Unit<TSource>(TSource value) => Func(value);

    // SelectMany: (Func<TSource>, TSource -> Func<TSelector>, (TSource, TSelector) -> TResult) -> Func<TResult>
    public static Func<TResult> SelectMany<TSource, TSelector, TResult>(
        this Func<TSource> source,
        Func<TSource, Func<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) => () =>
        {
            TSource value = source();
            return resultSelector(value, selector(value)());
        };
}
```

And the workflow is similar to Lazy<> monad’s workflow, because Lazy<T> is just a wrapper of Func<T> factory function:

```csharp
internal static void Workflow()
{
    Func<string> query = from filePath in new Func<string>(Console.ReadLine)
                         from encodingName in new Func<string>(Console.ReadLine)
                         from encoding in new Func<Encoding>(() => Encoding.GetEncoding(encodingName))
                         from fileContent in new Func<string>(() => File.ReadAllText(filePath, encoding))
                         select fileContent; // Define query.
    string result = query(); // Execute query.
}
```

The Optional<> monad is monad too, with the following SelectMany:

```csharp
public static partial class OptionalExtensions // Optional<T> : IMonad<Optional<>>
{
    // Multiply: Optional<Optional<TSource> -> Optional<TSource>
    public static Optional<TSource> Multiply<TSource>(this Optional<Optional<TSource>> sourceWrapper) =>
        sourceWrapper.SelectMany(source => source, (source, value) => value);

    // Unit: TSource -> Optional<TSource>
    public static Optional<TSource> Unit<TSource>(TSource value) => Optional(value);

    // SelectMany: (Optional<TSource>, TSource -> Optional<TSelector>, (TSource, TSelector) -> TResult) -> Optional<TResult>
    public static Optional<TResult> SelectMany<TSource, TSelector, TResult>(
        this Optional<TSource> source,
        Func<TSource, Optional<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) => new Optional<TResult>(() =>
            {
                if (source.HasValue)
                {
                    Optional<TSelector> result = selector(source.Value);
                    if (result.HasValue)
                    {
                        return (true, resultSelector(source.Value, result.Value));
                    }
                }
                return (false, default);
            });
}
```

The LINQ workflow of Optional<> monad is also pure and deferred, where each operation in the chaining is an Optional<T> instance:

```csharp
internal static void Workflow()
{
    string input;
    Optional<string> query =
        from filePath in new Optional<string>(() => string.IsNullOrWhiteSpace(input = Console.ReadLine())
            ? (false, default) : (true, input))
        from encodingName in new Optional<string>(() => string.IsNullOrWhiteSpace(input = Console.ReadLine())
            ? (false, default) : (true, input))
        from encoding in new Optional<Encoding>(() =>
            {
                try
                {
                    return (true, Encoding.GetEncoding(encodingName));
                }
                catch (ArgumentException)
                {
                    return (false, default);
                }
            })
        from fileContent in new Optional<string>(() => File.Exists(filePath)
            ? (true, File.ReadAllText(filePath, encoding)) : (false, default))
        select fileContent; // Define query.
    if (query.HasValue) // Execute query.
    {
        string result = query.Value;
    }
}
```

So Optional<> covers the scenario that each operation of the workflow may not have invalid result. When an operation has valid result (Optional<T>.HasValue returns true), its next operation executes. And when all all the operations have valid result, the entire workflow has a valid query result.

The ValueTuple<> functor is also monad. Again, its SelectMany cannot defer the call of selector, just like its Select:

```csharp
public static partial class ValueTupleExtensions // ValueTuple<T, TResult> : IMonad<ValueTuple<T,>>
{
    // Multiply: ValueTuple<T, ValueTuple<T, TSource> -> ValueTuple<T, TSource>
    public static (T, TSource) Multiply<T, TSource>(this (T, (T, TSource)) sourceWrapper) =>
        sourceWrapper.SelectMany(source => source, (source, value) => value); // Immediate execution.

    // Unit: TSource -> ValueTuple<T, TSource>
    public static (T, TSource) Unit<T, TSource>(TSource value) => ValueTuple<T, TSource>(value);

    // SelectMany: (ValueTuple<T, TSource>, TSource -> ValueTuple<T, TSelector>, (TSource, TSelector) -> TResult) -> ValueTuple<T, TResult>
    public static (T, TResult) SelectMany<T, TSource, TSelector, TResult>(
        this (T, TSource) source,
        Func<TSource, (T, TSelector)> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            (source.Item1, resultSelector(source.Item2, selector(source.Item2).Item2)); // Immediate execution.
}
```

So its workflow is the immediate execution version of Lazy<> monad’s workflow:

```csharp
public static partial class ValueTupleExtensions
{
    internal static void Workflow()
    {
        ValueTuple<string> query = from filePath in new ValueTuple<string>(Console.ReadLine())
                                   from encodingName in new ValueTuple<string>(Console.ReadLine())
                                   from encoding in new ValueTuple<Encoding>(Encoding.GetEncoding(encodingName))
                                   from fileContent in new ValueTuple<string>(File.ReadAllText(filePath, encoding))
                                   select fileContent; // Define and execute query.
        string result = query.Item1; // Query result.
    }
}
```

The Task<> functor is monad too. Once again, its SelectMany is immediate and impure, just like its Select:

```csharp
public static partial class TaskExtensions // Task<T> : IMonad<Task<>>
{
    // Multiply: Task<Task<T> -> Task<T>
    public static Task<TResult> Multiply<TResult>(this Task<Task<TResult>> sourceWrapper) =>
        sourceWrapper.SelectMany(source => source, (source, value) => value); // Immediate execution, impure.

    // Unit: TSource -> Task<TSource>
    public static Task<TSource> Unit<TSource>(TSource value) => Task(value);

    // SelectMany: (Task<TSource>, TSource -> Task<TSelector>, (TSource, TSelector) -> TResult) -> Task<TResult>
    public static async Task<TResult> SelectMany<TSource, TSelector, TResult>(
        this Task<TSource> source,
        Func<TSource, Task<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            resultSelector(await source, await selector(await source)); // Immediate execution, impure.
}
```

So the following LINQ workflow with Task<> monad is also immediate and impure:

```csharp
internal static async Task WorkflowAsync(string uri)
{
    Task<string> query = from response in new HttpClient().GetAsync(uri) // Return Task<HttpResponseMessage>.
                         from stream in response.Content.ReadAsStreamAsync() // Return Task<Stream>.
                         from text in new StreamReader(stream).ReadToEndAsync() // Return Task<string>.
                         select text; // Define and execute query.
    string result = await query; // Query result.
}
```

It is easy to verify all the above SelectMany methods satisfy the monad laws, and all the above (Multiply, Unit) methods preserve the monoid laws. However, not any SelectMany or (Multiply, Unit) methods can automatically satisfy those laws. Take the ValueTuple<T,> functor as example, here are its SelectMany and (Multiply, Unit):

```csharp
public static partial class ValueTupleExtensions // ValueTuple<T, TResult> : IMonad<ValueTuple<T,>>
{
    // Multiply: ValueTuple<T, ValueTuple<T, TSource> -> ValueTuple<T, TSource>
    public static (T, TSource) Multiply<T, TSource>(this (T, (T, TSource)) sourceWrapper) =>
        sourceWrapper.SelectMany(source => source, (source, value) => value); // Immediate execution.

    // Unit: TSource -> ValueTuple<T, TSource>
    public static (T, TSource) Unit<T, TSource>(TSource value) => ValueTuple<T, TSource>(value);

    // SelectMany: (ValueTuple<T, TSource>, TSource -> ValueTuple<T, TSelector>, (TSource, TSelector) -> TResult) -> ValueTuple<T, TResult>
    public static (T, TResult) SelectMany<T, TSource, TSelector, TResult>(
        this (T, TSource) source,
        Func<TSource, (T, TSelector)> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            (source.Item1, resultSelector(source.Item2, selector(source.Item2).Item2)); // Immediate execution.
}
```

The above (Multiply, Unit) implementations cannot preserve the monoid left unit law:

```csharp
internal static void MonoidLaws()
{
    (string, int) source = ("a", 1);

    // Associativity preservation: source.Wrap().Multiply().Wrap().Multiply() == source.Wrap().Wrap().Multiply().Multiply().
    source
        .ValueTuple<string, (string, int)>()
        .Multiply()
        .ValueTuple<string, (string, int)>()
        .Multiply()
        .WriteLine(); // (, 1)
    source
        .ValueTuple<string, (string, int)>()
        .ValueTuple<string, (string, (string, int))>()
        .Multiply()
        .Multiply()
        .WriteLine(); // (, 1)
    // Left unit preservation: Unit(f).Multiply() == source.
    Unit<string, (string, int)>(source).Multiply().WriteLine(); // (, 1)
    // Right unit preservation: source == source.Select(Unit).Multiply().
    source.Select(Unit<string, int>).Multiply().WriteLine(); // (a, 1)
}
```

And the above SelectMany implementation breaks the left unit monad law too:

```csharp
internal static void MonadLaws()
{
    ValueTuple<string, int> source = ("a", 1);
    Func<int, ValueTuple<string, char>> selector = int32 => ("b", '@');
    Func<int, ValueTuple<string, double>> selector1 = int32 => ("c", Math.Sqrt(int32));
    Func<double, ValueTuple<string, string>> selector2 = @double => ("d", @double.ToString("0.00"));
    const int Value = 5;

    // Associativity: source.SelectMany(selector1).SelectMany(selector2) == source.SelectMany(value => selector1(value).SelectMany(selector2)).
    (from value in source
        from result1 in selector1(value)
        from result2 in selector2(result1)
        select result2).WriteLine(); // (a, 1.00)
    (from value in source
        from result in (from result1 in selector1(value) from result2 in selector2(result1) select result2)
        select result).WriteLine(); // (a, 1.00)
    // Left unit: value.Wrap().SelectMany(selector) == selector(value).
    (from value in Value.ValueTuple<string, int>()
        from result in selector(value)
        select result).WriteLine(); // (, @)
    selector(Value).WriteLine(); // (b, @)
    // Right unit: source == source.SelectMany(Wrap).
    (from value in source
        from result in value.ValueTuple<string, int>()
        select result).WriteLine(); // (a, 1)
}
```