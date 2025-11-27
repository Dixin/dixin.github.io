---
title: "Category Theory via C# (2) Monoid"
published: 2018-12-03
description: "A ), denoted a 3-tuple (M, ⊙, I), is a set M with"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-2-monoid](/posts/category-theory-via-csharp-2-monoid)**

## Monoid and monoid laws

A [monoid](http://en.wikipedia.org/wiki/Monoid_\(category_theory\)), denoted a 3-tuple (M, ⊙, I), is a set M with

-   a binary operator ⊙ : M ⊙ M → M
    -   This operation M ⊙ M → M is denoted μ
-   and a special element unit, denoted I, I ∈ M
    -   I → M is denoted η

satisfying:

1.  left unit law λX: I ⊙ X ≌ X
2.  right unit law ρX: X ≌ X ⊙ I
3.  associative law αX, Y, Z: (X ⊙ Y) ⊙ Z ≌ X ⊙ (Y ⊙ Z)

so that:

-   the triangle identity commutes: [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/LINQ-via-C-Series-C-Functional-Programmi_921F/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/LINQ-via-C-Series-C-Functional-Programmi_921F/image_6.png)
-   and the pentagon identity commutes:: [![Untitled-2.fw](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/LINQ-via-C-Series-C-Functional-Programmi_921F/Untitled-2.fw_thumb.png "Untitled-2.fw")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/LINQ-via-C-Series-C-Functional-Programmi_921F/Untitled-2.fw_2.png)
-   and apparently: [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/LINQ-via-C-Series-C-Functional-Programmi_921F/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/LINQ-via-C-Series-C-Functional-Programmi_921F/image_8.png)

This is quite general and abstract. A intuitive example is the set of all integers, with operator + and unit 0. So this 3-tuple (integer, +, 0) satisfies:

1.  0 + x ≌ x
2.  x ≌ x + 0
3.  (x + y) + z ≌ x + (y + z)

where x, y, z are elements of the set of integers. Therefore (integer, +, 0) is a monoid.

A monoid can be represented in C# as:

```csharp
public partial interface IMonoid<T>
{
    T Unit { [Pure] get; }

    Func<T, T, T> Binary { [Pure] get; }
}
```

A default implementation is straight forward:

```csharp
public partial class Monoid<T> : IMonoid<T>
{
    public Monoid(T unit, [Pure] Func<T, T, T> binary)
    {
        this.Unit = unit;
        this.Binary = binary;
    }

    public T Unit { [Pure] get; }

    public Func<T, T, T> Binary { [Pure] get; }
}
```

## C#/.NET monoids

First of all, an extension method is created for convenience:

```csharp
[Pure]
public static class MonoidExtensions
{
    public static IMonoid<T> Monoid<T>(this T unit, Func<T, T, T> binary)
    {
        return new Monoid<T>(unit, binary);
    }
}
```

### Void and Unit monoids

Theoretically [System.Void](https://msdn.microsoft.com/en-us/library/system.void.aspx) can be a monoid. Its source code is:

```csharp
public struct Void
{
}
```

which leads to only one way to get the Void value:

```csharp
Void value = new Void();
```

So a monoid can be constructed as:

```csharp
IMonoid<Void> voidMonoid = new Void().Monoid((a, b) => new Void());
```

However, C# compiler does not allow System.Void to be used like this. There are 2 workarounds:

-   Copy above Void definition to local
-   Use [Microsoft.FSharp.Core.Unit](https://msdn.microsoft.com/en-us/library/ee370443.aspx) to replace System.Void

[F#’s unit](https://msdn.microsoft.com/en-us/library/dd483472.aspx) is equivalent to [C#’s void](https://msdn.microsoft.com/en-us/library/yah0tteb.aspx), and Microsoft.FSharp.Core.Unit is semantically close to System.Void. Unit’s [source code](https://github.com/fsharp/fsharp/blob/master/src/fsharp/FSharp.Core/prim-types.fs) is:

```csharp
type Unit() =
    override x.GetHashCode() = 0
    override x.Equals(obj:obj) = 
        match obj with null -> true | :? Unit -> true | _ -> false
    interface System.IComparable with 
        member x.CompareTo(_obj:obj) = 0
        
and unit = Unit
```

The difference is, Unit is a class, and its only possible value is null.

```csharp
Unit unit = null;
```

So a monoid can be constructed by Unit too:

```csharp
IMonoid<Unit> unitMonoid = ((Unit)null).Monoid((a, b) => null);
```

### More examples

As fore mentioned, (int, +, 0) is a monoid:

```csharp
IMonoid<int> addInt32 = 0.Monoid((a, b) => a + b);
Assert.AreEqual(0, addInt32.Unit);
Assert.AreEqual(1 + 2, addInt32.Binary(1, 2));

// Monoid law 1: Unit Binary m == m
Assert.AreEqual(1, addInt32.Binary(addInt32.Unit, 1));
// Monoid law 2: m Binary Unit  == m
Assert.AreEqual(1, addInt32.Binary(1, addInt32.Unit));
// Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
Assert.AreEqual(addInt32.Binary(addInt32.Binary(1, 2), 3), addInt32.Binary(1, addInt32.Binary(2, 3)));
```

[Brian Beckman](https://www.linkedin.com/in/brianbeckman) had a clock monoid [in a video](http://channel9.msdn.com/Shows/Going+Deep/Brian-Beckman-Dont-fear-the-Monads) - consider numbers on the clock:

[![](http://www.ikea.com/PIAimages/0175112_PE332983_S5.JPG)](http://www.ikea.com/PIAimages/0175112_PE332983_S5.JPG)

If a ⊙ b is defined as a => b => (a + b) % 12, then 12 becomes the unit. So:

```csharp
IMonoid<int> clock = 12.Monoid((a, b) => (a + b) % 12);
```

Here are more similar examples:

-   (int, \*, 1)
-   (string, string.Concat, string.Empty)
-   (bool, ||, false)
-   (bool, &&, true)
-   (IEnumerable<T>, Enumerable.Concat, Enumerable.Empty<T>())

### Nullable<T> monoid

And monoid (Nullable<T>, ⊙, I) is interesting.

First of all, the built-in System.Nullable<> only works for value type, since reference type can naturally be null. Here for the category theory discussion, a Nullable<T> for any type can be reinvented:

```csharp
public class Nullable<T>
{
    private readonly Lazy<Tuple<bool, T>> factory;

    public Nullable(Func<Tuple<bool, T>> factory = null)
    {
        this.factory = factory == null ? null : new Lazy<Tuple<bool, T>>(factory);
    }

    public bool HasValue
    {
        [Pure]
        get
        {
            return this.factory?.Value != null && this.factory.Value.Item1 && this.factory.Value.Item2 != null;
        }
    }

    public T Value
    {
        [Pure]
        get
        {
            // Message is copied from mscorlib.dll string table, where key is InvalidOperation_NoValue.
            Contract.Requires<InvalidOperationException>(this.HasValue, "Nullable object must have a value.");

            return this.factory.Value.Item2;
        }
    }
}
```

This Nullable<T>’s constructor takes a factory function which returns a tuple of bool and T value:

-   When factory function is not provided (null), Nullable<T> does not have value.
-   When factory function is provided, the function returns a tuple if executed.
    -   The tuple’s bool value indicates there is a value available (because when T is a value type, the other item in the tuple cannot be null).
    -   When the bool is true and the other T value is not null, Nullable<T> has a value.

Below is one way to define the binary operator ⊙, taking new Nullable<T>() - a Nullable<T> has no value - as the unit:

```csharp
[Pure]
public static partial class MonoidExtensions
{
    public static IMonoid<T> Monoid<T>
        (this T unit, Func<T, T, T> binary) => new Monoid<T>(unit, binary);

    public static IMonoid<Nullable<TSource>> MonoidOfNullable<TSource>
        (this IMonoid<TSource> monoid) => 
            new Monoid<Nullable<TSource>>(
                new Nullable<TSource>(),
                (a, b) => new Nullable<TSource>(() =>
                    {
                        if (a.HasValue && b.HasValue)
                        {
                            return Tuple.Create(true, monoid.Binary(a.Value, b.Value));
                        }

                        if (a.HasValue)
                        {
                            return Tuple.Create(true, a.Value);
                        }

                        if (b.HasValue)
                        {
                            return Tuple.Create(true, b.Value);
                        }

                        return Tuple.Create(false, default(TSource));
                    }));
}
```

So that (Nullable<T>, ⊙, Nullable<T>()) becomes a monoid.

## Unit tests

These unit tests demonstrate how the monoids are constructed and how the monoid laws are satisfied:

```csharp
[TestClass]
public class MonoidTests
{
    [TestMethod()]
    public void StringTest()
    {
        IMonoid<string> concatString = string.Empty.Monoid((a, b) => string.Concat(a, b));
        Assert.AreEqual(string.Empty, concatString.Unit);
        Assert.AreEqual("ab", concatString.Binary("a", "b"));

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual("ab", concatString.Binary(concatString.Unit, "ab"));
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual("ab", concatString.Binary("ab", concatString.Unit));
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Assert.AreEqual(concatString.Binary(concatString.Binary("a", "b"), "c"), concatString.Binary("a", concatString.Binary("b", "c")));
    }

    [TestMethod()]
    public void Int32Test()
    {
        IMonoid<int> addInt32 = 0.Monoid((a, b) => a + b);
        Assert.AreEqual(0, addInt32.Unit);
        Assert.AreEqual(1 + 2, addInt32.Binary(1, 2));

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual(1, addInt32.Binary(addInt32.Unit, 1));
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual(1, addInt32.Binary(1, addInt32.Unit));
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Assert.AreEqual(addInt32.Binary(addInt32.Binary(1, 2), 3), addInt32.Binary(1, addInt32.Binary(2, 3)));

        IMonoid<int> multiplyInt32 = 1.Monoid((a, b) => a * b);
        Assert.AreEqual(1, multiplyInt32.Unit);
        Assert.AreEqual(1 * 2, multiplyInt32.Binary(1, 2));

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual(2, multiplyInt32.Binary(multiplyInt32.Unit, 2));
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual(2, multiplyInt32.Binary(2, multiplyInt32.Unit));
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Assert.AreEqual(multiplyInt32.Binary(multiplyInt32.Binary(1, 2), 3), multiplyInt32.Binary(1, multiplyInt32.Binary(2, 3)));
    }

    [TestMethod()]
    public void ClockTest()
    {
        // Stolen from: http://channel9.msdn.com/Shows/Going+Deep/Brian-Beckman-Dont-fear-the-Monads
        IMonoid<int> clock = 12.Monoid((a, b) => (a + b) % 12);
        Assert.AreEqual(12, clock.Unit);
        Assert.AreEqual((7 + 10) % 12, clock.Binary(7, 10));

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual(111 % 12, clock.Binary(clock.Unit, 111));
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual(111 % 12, clock.Binary(111, clock.Unit));
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Assert.AreEqual(clock.Binary(clock.Binary(11, 22), 33), clock.Binary(11, clock.Binary(22, 33)));
    }

    [TestMethod()]
    public void BooleanTest()
    {
        IMonoid<bool> orBoolean = false.Monoid((a, b) => a || b);
        Assert.IsFalse(orBoolean.Unit);
        Assert.AreEqual(true || false, orBoolean.Binary(true, false));

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual(true, orBoolean.Binary(orBoolean.Unit, true));
        Assert.AreEqual(false, orBoolean.Binary(orBoolean.Unit, false));
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual(true, orBoolean.Binary(true, orBoolean.Unit));
        Assert.AreEqual(false, orBoolean.Binary(false, orBoolean.Unit));
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Assert.AreEqual(orBoolean.Binary(orBoolean.Binary(true, false), true), orBoolean.Binary(true, orBoolean.Binary(false, true)));

        IMonoid<bool> andBoolean = true.Monoid((a, b) => a && b);
        Assert.IsTrue(andBoolean.Unit);
        Assert.AreEqual(true && false, andBoolean.Binary(true, false));

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual(true, andBoolean.Binary(andBoolean.Unit, true));
        Assert.AreEqual(false, andBoolean.Binary(andBoolean.Unit, false));
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual(true, andBoolean.Binary(true, andBoolean.Unit));
        Assert.AreEqual(false, andBoolean.Binary(false, andBoolean.Unit));
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Assert.AreEqual(andBoolean.Binary(andBoolean.Binary(true, false), true), andBoolean.Binary(true, andBoolean.Binary(false, true)));
    }

    [TestMethod()]
    public void EnumerableTest()
    {
        IMonoid<IEnumerable<int>> concatEnumerable = Enumerable.Empty<int>().Monoid((a, b) => a.Concat(b));
        Assert.IsFalse(concatEnumerable.Unit.Any());
        int[] x = new int[] { 0, 1, 2 };
        int[] y = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(concatEnumerable.Binary(x, y), x.Concat(y));

        // Monoid law 1: Unit Binary m == m
        EnumerableAssert.AreEqual(concatEnumerable.Binary(concatEnumerable.Unit, x), x);
        // Monoid law 2: m Binary Unit == m
        EnumerableAssert.AreEqual(concatEnumerable.Binary(x, concatEnumerable.Unit), x);
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        EnumerableAssert.AreEqual(
            concatEnumerable.Binary(concatEnumerable.Binary(x, y), x),
            concatEnumerable.Binary(x, concatEnumerable.Binary(y, x)));
    }

    [TestMethod()]
    public void NullableTest()
    {
        IMonoid<int> addInt32 = 0.Monoid((a, b) => a + b);
        IMonoid<Nullable<int>> addNullable = addInt32.MonoidOfNullable();
        Assert.IsFalse(addNullable.Unit.HasValue);
        Assert.AreEqual(addInt32.Binary(1, 2), addNullable.Binary(1.Nullable(), 2.Nullable()).Value);
        Assert.AreEqual(1, addNullable.Binary(1.Nullable(), new Nullable<int>()).Value);
        Assert.AreEqual(2, addNullable.Binary(new Nullable<int>(), 2.Nullable()).Value);
        Assert.IsFalse(addNullable.Binary(new Nullable<int>(), new Nullable<int>()).HasValue);

        // Monoid law 1: Unit Binary m == m
        Assert.AreEqual(1, addNullable.Binary(addNullable.Unit, 1.Nullable()).Value);
        // Monoid law 2: m Binary Unit == m
        Assert.AreEqual(1, addNullable.Binary(1.Nullable(), addNullable.Unit).Value);
        // Monoid law 3: (m1 Binary m2) Binary m3 == m1 Binary (m2 Binary m3)
        Nullable<int> left = addNullable.Binary(addNullable.Binary(1.Nullable(), 2.Nullable()), 3.Nullable());
        Nullable<int> right = addNullable.Binary(1.Nullable(), addNullable.Binary(2.Nullable(), 3.Nullable()));
        Assert.AreEqual(left.Value, right.Value);
    }
}
```