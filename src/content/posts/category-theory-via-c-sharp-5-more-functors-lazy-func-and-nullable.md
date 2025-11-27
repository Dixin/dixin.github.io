---
title: "Category Theory via C# (5) More Functors: Lazy<>, Func<> And Nullable<>"
published: 2018-12-06
description: "A simple functor in DotNet category is Lazy<>. Its Select functions can be easily implemented:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-3-functor-and-linq-to-functors](/posts/category-theory-via-csharp-3-functor-and-linq-to-functors "https://weblogs.asp.net/dixin/category-theory-via-csharp-3-functor-and-linq-to-functors")**

## Lazy<> functor

A simple functor in DotNet category is Lazy<>. Its Select functions can be easily implemented:

```csharp
[Pure]
public static partial class LazyExtensions
{
    // C# specific functor pattern.
    public static Lazy<TResult> Select<TSource, TResult>
        (this Lazy<TSource> source, Func<TSource, TResult> selector) => 
            new Lazy<TResult>(() => selector(source.Value));

    // General abstract functor definition of Lazy<>: DotNet -> DotNet.
    public static IMorphism<Lazy<TSource>, Lazy<TResult>, DotNet> Select<TSource, TResult>
        (/* this */ IMorphism<TSource, TResult, DotNet> selector) => 
            new DotNetMorphism<Lazy<TSource>, Lazy<TResult>>(source => source.Select(selector.Invoke));
}
```

As fore mentioned, above 2 Select functions are equivalent. The second one looks the same as IEnumerable<>’s: source => source.Select(selector.Invoke), except the type info IEnumerable<> are replaced by Lazy<>.

In LINQ:

```csharp
Lazy<int> lazyFunctor = new Lazy<int>(() => 0);
Lazy<int> query = from x in lazyFunctor select x + 1;
```

It is similar to the [Identity functor of Haskell](http://hackage.haskell.org/package/transformers-0.4.3.0/docs/Data-Functor-Identity.html).

In the second Select function, keyword “this” is commented out; otherwise, the EnumerableGeneralTest function in previous part cannot be compiled. In :

```csharp
EnumerableAssert.AreEqual(
    addTwoMorphism.o(addOneMorphism).Select().Invoke(functor), 
    addTwoMorphism.Select().o(addOneMorphism.Select()).Invoke(functor));
```

When compiling the Select function application, compiler will look for the Select extension method in the context. If looking at EnumerableExtensions.Select:

```csharp
public static IMorphism<IEnumerable<TSource>, IEnumerable<TResult>, DotNet> Select<TSource, TResult>
    (this IMorphism<TSource, TResult, DotNet> selector) => 
        new DotNetMorphism<IEnumerable<TSource>, IEnumerable<TResult>>(source => source.Select(selector.Invoke));
```
from previous part, and LazyExtensions.Select:
```csharp
public static IMorphism<Lazy<TSource>, Lazy<TResult>, DotNet> Select<TSource, TResult>
    (this IMorphism<TSource, TResult, DotNet> selector) => 
        new DotNetMorphism<Lazy<TSource>, Lazy<TResult>>(source => source.Select(selector.Invoke));
```

they have the same the same function parameter (this IMorphism<TSource, TResult, DotNet> selector), and type parameters<TSource, TResult> . The compiler will report an ambiguity error:

Error CS0121 The call is ambiguous between the following methods or properties: 'LazyExtensions.Select<TSource, TResult>(IMorphism<TSource, TResult, DotNet>)' and 'EnumerableExtensions.Select<TSource, TResult>(IMorphism<TSource, TResult, DotNet>)'

So above “this” keyword is commented out to make EnumerableExtensions.Select the only available extension method for IMorphism<TSource, TResult, DotNet>.

## Func<> functor

Func<> is a functor:

```csharp
[Pure]
public static partial class FuncExtensions
{
    public static Func<TResult> Select<TSource, TResult>
        (this Func<TSource> source, Func<TSource, TResult> selector) => () => selector(source());

    // General abstract functor definition of Func<>: DotNet -> DotNet.
    public static IMorphism<Func<TSource>, Func<TResult>, DotNet> Select<TSource, TResult>
        (/* this */ IMorphism<TSource, TResult, DotNet> selector) => 
            new DotNetMorphism<Func<TSource>, Func<TResult>>(source => source.Select(selector.Invoke));
}
```

Again, the general abstract version of Select is the same as IEnumerable<>’s and Lazy<>’s.

In LINQ:

```csharp
Func<int> functionFunctor = new Func<int>(() => 1);
Func<int> query = from x in functionFunctor select x + 1;
```

Actually any function can be Func<> (Func<T>):

-   Functions with N-arity can be transformed to Func<T> with closure.
-   Functions without return value like an Action, can be transformed to Func<Void>. In C# Func<Void> Be compiled, so they can be transformed to Func<Unit>, borrowed [unit from F#.](https://msdn.microsoft.com/en-us/library/dd483472.aspx)

For example:

```csharp
Func<int, bool> isPositive = x => x > 0;
Func<int, Func<bool>> isNegative = x => from y in isPositive.Partial(x) select !y;

Action<int> action = x => { int y = x + 1; };
Func<int, Unit> returnUnit = x => { action(x); return null; };
Func<int, Func<Unit>> query = x => from y in returnUnit.Partial(0) select y;
```

In last query expression, y’s type is [Microsoft.FSharp.Core.Unit](https://msdn.microsoft.com/en-us/library/ee370443.aspx), and it is always null.

### Fun< , > functor

Func<T, TResult> can also have its own Select function and becomes a natural functor:

```csharp
// [Pure]
public static partial class FuncExtensions
{
    public static Func<TSourceArg, TResult> Select<TSourceArg, TSource, TResult>
        (this Func<TSourceArg, TSource> source, Func<TSource, TResult> selector) => arg => selector(source(arg));
}
```

or equivalently:

```csharp
public static Func<TSource, TResult> Select2<TSource, TMiddle, TResult>
    (this Func<TSource, TMiddle> source, Func<TMiddle, TResult> selector) => selector.o(source);
```

Now LINQ syntax applies without closure:

```csharp
Func<int, bool> isPositive = x => x > 0;
Func<int, bool> isNegative = from x in isPositive select !x;

Action<int> action = x => { int y = x + 1; };
Func<int, Unit> returnUnit = x => { action(x); return null; };
Func<int, Unit> query = from x in returnUnit select x;
```

## Nullable<> functor

System.Nullable<> can be a functor too. To be more general, the Nullable<T> for any type will be used again.

Here are the Select functions:

```csharp
[Pure]
public static partial class NullableExtensions
{
    // C# specific functor pattern.
    public static Nullable<TResult> Select<TSource, TResult>
        (this Nullable<TSource> source, Func<TSource, TResult> selector) => 
            new Nullable<TResult>(() => source.HasValue
                    ? Tuple.Create(true, selector(source.Value))
                    : Tuple.Create(false, default(TResult)));

    // General abstract functor definition of Nullable<>: DotNet -> DotNet.
    public static IMorphism<Nullable<TSource>, Nullable<TResult>, DotNet> Select<TSource, TResult>
        (/* this */ IMorphism<TSource, TResult, DotNet> selector) => 
            new DotNetMorphism<Nullable<TSource>, Nullable<TResult>>(source => source.Select(selector.Invoke));
}
```

Once again, the general version of Select looks the same as the code for IEnumerable<>, Lazy<>, Func<>. As explained in previous part, C#/CLR does not support [higher-kinded polymorphism](http://en.wikipedia.org/wiki/Type_class#Higher-kinded_polymorphism), so the same algorithm has to repeat again and again.

And the LINQ syntax:

```csharp
Nullable<int> noValue = new Nullable<int>(); // or new Nullable<int>(() => Tuple.Create(false, default(int)))
Nullable<int> query1 = from x in noValue select x + 1;

Nullable<int> hasValue = new Nullable<int>(() => Tuple.Create(true, 0));
Nullable<int> query2 = from x in noValue select x + 1;
```

## Functor laws, laziness, and unit tests

All the above generics satisfy functor laws, and they have laziness in LINQ queries. These properties are demonstrated by the following unit tests:

```csharp
public partial class FunctorTests
{
    [TestMethod()]
    public void LazyTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Lazy<int> lazy = new Lazy<int>(() => { isExecuted1 = true; return 0; });
        Func<int, int> addOne = x => { isExecuted2 = true; return x + 1; };

        Lazy<int> query1 = from x in lazy select addOne(x);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.

        Assert.AreEqual(0 + 1, query1.Value); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(lazy.Select(Functions.Id).Value, Functions.Id(lazy).Value);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<int, string> addTwo = x => (x + 2).ToString(CultureInfo.InvariantCulture);
        Lazy<string> query2 = lazy.Select(addTwo.o(addOne));
        Lazy<string> query3 = lazy.Select(addOne).Select(addTwo);
        Assert.AreEqual(query2.Value, query3.Value);
    }

    [TestMethod()]
    public void FuncTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int> zero = () => { isExecuted1 = true; return 0; };
        Func<int, int> addOne = x => { isExecuted2 = true; return x + 1; };

        Func<int> query1 = from x in zero select addOne(x);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.

        Assert.AreEqual(0 + 1, query1()); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(zero.Select(Functions.Id)(), Functions.Id(zero)());
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<int, string> addTwo = x => (x + 2).ToString(CultureInfo.InvariantCulture);
        Func<string> query2 = zero.Select(addTwo.o(addOne));
        Func<string> query3 = zero.Select(addOne).Select(addTwo);
        Assert.AreEqual(query2(), query3());
    }

    [TestMethod()]
    public void Func2Test()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<int, int> addOne = x => { isExecuted1 = true; return x + 1; };
        Func<int, int> addTwo = x => { isExecuted2 = true; return x + 2; };

        Func<int, int> query1 = from x in addOne select addTwo(x);
        Assert.IsFalse(isExecuted1); // Laziness.
        Assert.IsFalse(isExecuted2); // Laziness.

        Assert.AreEqual(0 + 1 + 2, query1(0)); // Execution.
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(addOne.Select(Functions.Id)(1), Functions.Id(addOne)(1));
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<int, string> addThree = x => (x + 3).ToString(CultureInfo.InvariantCulture);
        Func<int, string> query2 = addOne.Select(addThree.o(addTwo));
        Func<int, string> query3 = addOne.Select(addTwo).Select(addThree);
        Assert.AreEqual(query2(2), query3(2));
    }

    [TestMethod()]
    public void NullableWithoutValueTest()
    {
        bool isExecuted1 = false;
        Func<int, string> append = x => { isExecuted1 = true; return x + "b"; };
        Nullable<int> nullable = new Nullable<int>();

        Nullable<string> query1 = from x in nullable select append(x);
        Assert.IsFalse(isExecuted1); // Laziness.

        Assert.IsFalse(query1.HasValue); // Execution.
        Assert.IsFalse(isExecuted1);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(query1.Select(Functions.Id).HasValue, Functions.Id(query1).HasValue);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<string, int> length = x => x.Length;
        Nullable<int> query2 = nullable.Select(length.o(append));
        Nullable<int> query3 = nullable.Select(append).Select(length);
        Assert.AreEqual(query2.HasValue, query3.HasValue);
    }

    [TestMethod()]
    public void NullableWithValueTest()
    {
        bool isExecuted1 = false;
        Func<int, string> append = x => { isExecuted1 = true; return x + "b"; };
        Nullable<int> nullable = new Nullable<int>(() => Tuple.Create(true, 1));

        Nullable<string> query1 = from x in nullable select append(x);
        Assert.IsFalse(isExecuted1); // Laziness.

        Assert.IsTrue(query1.HasValue); // Execution.
        Assert.AreEqual("1b", query1.Value);
        Assert.IsTrue(isExecuted1);

        // Functor law 1: F.Select(Id) == Id(F)
        Assert.AreEqual(query1.Select(Functions.Id).HasValue, Functions.Id(query1).HasValue);
        // Functor law 2: F.Select(f2.o(f1)) == F.Select(f1).Select(f2)
        Func<string, int> length = x => x.Length;
        Nullable<int> query2 = nullable.Select(length.o(append));
        Nullable<int> query3 = nullable.Select(append).Select(length);
        Assert.AreEqual(query2.Value, query3.Value);
    }
}
```

Tests for the general version of Select functions are not showing here, since they are equivalent with these C# specific Select functions.