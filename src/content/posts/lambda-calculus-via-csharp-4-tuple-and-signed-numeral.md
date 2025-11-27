---
title: "Lambda Calculus via C# (4) Tuple and Signed Numeral"
published: 2024-11-10
description: "Besides modeling values like Boolean and numeral, anonymous function can also model data structures. In Church encoding, Church pair is an approach to use functions to represent a tuple of 2 items."
image: ""
tags: [".NET", "C#", "Church Encoding", "Church Pairs", "Functional Programming", "Lambda Calculus", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

Besides modeling values like Boolean and numeral, anonymous function can also model data structures. In Church encoding, Church pair is an approach to use functions to represent a tuple of 2 items.

## Church pair (2-tuple)

A tuple can be constructed with its first item x, its second item y, and a function f:

```csharp
CreateTuple := λx.λy.λf.f x y
```

So a tuple is can be created by partially applying CreateTuple with 2 items x and y:

```csharp
Tuple := CreateTuple x y
       ≡ (λx.λy.λf.f x y) x y
       ≡ λf.f x y
```

So a tuple is a higher-order function, which accept a function f, and apply it with its 2 items. So f accepts 2 arguments, it is in the form of λx.λy.E.

To get the tuple’s first item x, just apply the tuple function with a specific function f, where f simply accepts 2 items and returns the first item:

```csharp
Tuple (λx.λy.x)
≡ (λf.f x y) (λx.λy.x)
≡ (λx.λy.x) x y
≡ x
```

Similarly, to get the tuple’s second item y, just apply tuple function with a specific function f, where f simply accepts 2 items and returns the first item:

```csharp
Tuple (λx.λy.y)
≡ (λf.f x y) (λx.λy.y)
≡ (λx.λy.y) x y
≡ y
```

So the following Item1 function is defined to accept a tuple, apply the tuple function with function λx.λy.x, and return the tuple’s first item:

```csharp
Item1 := λt.t (λx.λy.x)
```

Again, this is how it works:

```csharp
Item1 (CreateTuple x y)
≡ (λt.t (λx.λy.x)) (CreateTuple x y)
≡ (λt.t (λx.λy.x)) (λf.f x y)
≡ (λf.f x y) (λx.λy.x)
≡ (λx.λy.x) x y
≡ x
```

And Item2 function can ne defined in the same way to get the tuple’s second item:

```csharp
Item2 := λt.t (λx.λy.y)
```

Notice functions λx.λy.x and λx.λy.y can be alpha converted to λt.λf.t and λt.λf.f, which are just Church Boolean True and False. So Item1 and Item2 can be defined as:

```csharp
Item1 := λt.t True
Item2 := λt.t False
```

To implement tuple in C#, its function type needs to be identified. The tuple function accepts argument f, which is either function True of function False, so f is of function type Boolean. In the body of tuple function, f is applied, and f returns dynamic. So tuple virtually is of function type Boolean -> dynamic:

```csharp
using static ChurchBoolean;

// Tuple is the alias of (dynamic -> dynamic -> dynamic) -> dynamic.
public delegate dynamic Tuple<out T1, out T2>(Boolean f);

public static partial class ChurchTuple<T1, T2>
{
    public static readonly Func<T1, Func<T2, Tuple<T1, T2>>> 
        Create = item1 => item2 => f => f(item1)(item2);

    // Item1 = tuple => tuple(True)
    public static readonly Func<Tuple<T1, T2>, T1> 
        Item1 = tuple => (T1)(object)tuple(True);

    // Item2 = tuple => tuple(False)
    public static readonly Func<Tuple<T1, T2>, T2> 
        Item2 = tuple => (T2)(object)tuple(False);
}
```

There are type conversions in Item1/Item2 functions. At compiled time, the tuple function returns dynamic, and at runtime it actually it calls True/False function to return either item1 or item2 . So the type conversions are always safe. Also notice here tuple function’s return value cannot be directly converted to T1 or T2, because of a [bug of C# runtime binding layer](http://stackoverflow.com/questions/37392566/). The workaround is to convert dynamic to object first, then convert to T1 or T2.

The following are the extension methods for convenience:

```csharp
public static partial class TupleExtensions
{
    public static T1 Item1<T1, T2>(this Tuple<T1, T2> tuple) => ChurchTuple<T1, T2>.Item1(tuple);

    public static T2 Item2<T1, T2>(this Tuple<T1, T2> tuple) => ChurchTuple<T1, T2>.Item2(tuple);
}
```

For example, a point can be a tuple of 2 numerals:

```csharp
internal static void Point(Numeral x, Numeral y)
{
    Tuple<Numeral, Numeral> point1 = ChurchTuple<Numeral, Numeral>.Create(x)(y);
    Numeral x1 = point1.Item1();
    Numeral y1 = point1.Item1();

    // Move up.
    Numeral y2 = y1.Increase();
    Tuple<Numeral, Numeral> point2 = ChurchTuple<Numeral, Numeral>.Create(x1)(y2);
}
```

### Tuple operators

The Swap function accepts a tuple (x, y), swaps its first item and second item, and returns a new tuple (y, x):

```csharp
Swap := λt.CreateTuple (Item2 t)(Item1 t)
```

Apparently, Swap is of function type Tuple<T1, T2> -> Tuple<T2, T1>:

```csharp
// Swap = tuple => Create(tuple.Item2())(tuple.Item1())
public static readonly Func<Tuple<T1, T2>, Tuple<T2, T1>>
    Swap = tuple => ChurchTuple<T2, T1>.Create(tuple.Item2())(tuple.Item1());
```

The Shift function accepts a tuple (x, y) and a function f, and returns a new tuple (y, f y):

```csharp
Shift := λf.λt.CreateTuple (Item2 t) (f (Item2 t))
```

Here assume the argument tuple (x, y) is of type Tuple<T1, T2>, regarding f is applied with y, assume f returns TResult type, then f is of function type T2 -> TResult, so that the returned new tuple (y, f y) is of type Tuple<T2, TResult>. As a result, Shift is of type Tuple<T1, T2> -> (T2 -> TResult) -> Tuple<T2, TResult>:

```csharp
public static partial class ChurchTuple<T1, T2, TResult>
{
    // Shift = f => tuple => Create(tuple.Item2())(f(tuple.Item1()))
    public static readonly Func<Func<T2, TResult>, Func<Tuple<T1, T2>, Tuple<T2, TResult>>>
        Shift = f => tuple => ChurchTuple<T2, TResult>.Create(tuple.Item2())(f(tuple.Item2()));
}
```

And their extension methods:

```csharp
public static Tuple<T2, T1> Swap<T1, T2>(this Tuple<T1, T2> tuple) => ChurchTuple<T1, T2>.Swap(tuple);

public static Tuple<T2, TResult> Shift<T1, T2, TResult>(this Tuple<T1, T2> tuple, Func<T2, TResult> f) => 
    ChurchTuple<T1, T2, TResult>.Shift(f)(tuple);
```

Here Shift function can be used to define the Subtract function for Church numerals. Remember a Church numeral n can be viewed as to apply Increase n times from 0:

```csharp
n Increase 0
≡ n
```

Applying Shift with Increase and a tuple of Church numerals, it returns a new tuple of Church numerals, so this application can repeat forever:

```csharp
Shift Increase (0, 0)
≡ (0, Increase 0)
≡ (0, 1)

  Shift Increase (0, 1)
≡ (1, Increase 1)
≡ (1, 2)

  Shift Increase (1, 2)
≡ (2, Increase 2)
≡ (2, 3)

...
```

In another word, partially applying Shift with Increase is a function that can be repeatedly applied with a tuple of Church numerals:

```csharp
(Shift Increase) (0, 0)                                       ≡ (Shift Increase)1 (0, 0) ≡ 1 (Shift Increase) (0, 0) 
≡ (0, 1)

  (Shift Increase) (0, 1)
≡ (Shift Increase) ((Shift Increase) (0, 0))
≡ (Shift Increase) ∘ (Shift Increase) (0, 0)                    ≡ (Shift Increase)2 (0, 0) ≡ 2 (Shift Increase) (0, 0) 
≡ (1, 2)

  (Shift Increase) (1, 2)
≡ (Shift Increase) ((Shift Increase) ∘ (Shift Increase) (0, 0))
≡ (Shift Increase) ∘ (Shift Increase) ∘ (Shift Increase) (0, 0) ≡ (Shift Increase)3 (0, 0) ≡ 3 (Shift Increase) (0, 0) 
≡ (2, 3)

...
```

So generally:

```csharp
n (Shift Increase) (0, 0)
≡ (n - 1, n)
```

As a result, to decrease n to n – 1, just apply n with function (Shift Increase) and tuple (0, 0), get the result tuple (n – 1, n), and return its first item:

```csharp
Item1 (n (Shift Increase) (0, 0))
≡ Item1 (n - 1, n)
≡ n - 1
```

So Decrease can be defined as:

```csharp
Decrease := λn.Item1 (n (Shift Increase) (CreateTuple 0 0))
```

And C#:

```csharp
// Decrease = n => n(tuple => tuple.Shift(Increase))(0, 0).Item1();
public static readonly Func<Numeral, Numeral> Decrease = n =>
    ((Tuple<Numeral, Numeral>)n
        (tuple => ((Tuple<Numeral, Numeral>)tuple).Shift(Increase))
        (ChurchTuple<Numeral, Numeral>.Create(Zero)(Zero)))
    .Item1();
```

## N-tuple

An easy way is to model n-tuple as a 2-tuple of the first value and a (n-1)-tuple of the rest values. A 3 tuple of values 1, 2, 3 can be represented by nested 2-tuples as (a, (b, c)), a 4-tuple of values 1, 2, 3, 4 can be represented by nested 2-tuples (1, (2, (3, 4))), etc., and a n tuple of values 1, 2, 3, …, n can be represented by nested 2 tuples (1, (2, (3, (…(n-1, n)…)))). For example, the following is the definition of 3 tuple:

```csharp
Create3Tuple := λx.λy.λz.CreateTuple x (CreateTuple y z)

3TupleItem1 := λt.Item1 t
3TupleItem2 := λt.Item1 (Item2 t)
3TupleItem3 := λt.Item2 (Item2 t)
```

And in C#:

```csharp
public delegate dynamic Tuple<out T1, out T2, out T3>(Boolean f);

public static partial class ChurchTuple<T1, T2, T3>
{
    // Create = item1 => item2 => item3 => Create(item1)(Create(item2)(item3))
    public static readonly Func<T1, Func<T2, Func<T3, Tuple<T1, T2, T3>>>>
        Create = item1 => item2 => item3 => new Tuple<T1, T2, T3>(ChurchTuple<T1, Tuple<T2, T3>>.Create(item1)(ChurchTuple<T2, T3>.Create(item2)(item3)));

    // Item1 = tuple.Item1()
    public static readonly Func<Tuple<T1, T2, T3>, T1>
        Item1 = tuple => new Tuple<T1, Tuple<T2, T3>>(tuple).Item1();

    // Item2 = tuple.Item2().Item1()
    public static readonly Func<Tuple<T1, T2, T3>, T2>
        Item2 = tuple => new Tuple<T1, Tuple<T2, T3>>(tuple).Item2().Item1();

    // Item3 = tuple.Item2().Item2()
    public static readonly Func<Tuple<T1, T2, T3>, T3>
        Item3 = tuple => new Tuple<T1, Tuple<T2, T3>>(tuple).Item2().Item2();
}

public static partial class TupleExtensions
{
    public static T1 Item1<T1, T2, T3>(this Tuple<T1, T2, T3> tuple) => ChurchTuple<T1, T2, T3>.Item1(tuple);

    public static T2 Item2<T1, T2, T3>(this Tuple<T1, T2, T3> tuple) => ChurchTuple<T1, T2, T3>.Item2(tuple);

    public static T3 Item3<T1, T2, T3>(this Tuple<T1, T2, T3> tuple) => ChurchTuple<T1, T2, T3>.Item3(tuple);
}
```

## Signed numeral

With tuple, a signed numeral (integer) can be modeled by a pair of Church numerals (natural numbers), where the first item represents the positive value, and the second item represents the negative value:

```csharp
SignedNumeral := Tuple
```

For example (1, 0) and (2, 1) models 1, (0, 2) and (1, 3) models –2, (0, 0) and (1, 1) models 0, etc.:

```csharp
1 := (1, 0) ≡ (2, 1) ≡ (3, 2) ≡ (4, 3) ≡ ...
 0 := (0, 0) ≡ (1, 1) ≡ (2, 2) ≡ (3, 3) ≡ ...
-2 := (0, 2) ≡ (1, 3) ≡ (2, 4) ≡ (3, 5) ≡ ...
```

In C#, the function type SignedNumeral is the same as Tuple, except SignedNumeral is not open generic type:

```csharp
// SignedNumeral is the alias of Tuple<Numeral, Numeral>.
public delegate dynamic SignedNumeral(Boolean f);
```

Church numeral represents natural number. So Converting a Church numeral n to signed number is easy, just make it a tuple (n, 0):

```csharp
Sign := λn.CreateTuple n 0
```

To negate a signed numeral, just swap its positive value and negative value:

```csharp
Negate := Swap
```

And it is straightforward to get the positive value and the negative value from a signed number:

```csharp
Positive := Item1
Negative := Item2
```

Signed numeral like (4, 3), (3, 3), (3, 5) can be formatted to have at least one 0: (1, 0), (0, 0), (0, 2). For a signed number s represented by (p, n), If p >= n, then it is (p - n, 0), otherwise it is (0, n – p):

```csharp
Format := λs.If (sp >=  sn) (λx.(sp - sn, 0)) (λx.(0, sn - sp))
```

Here Sp is the positive value of s, and sn the the negative value of s.

The following are these function’s C# implementation, and the extension methods:

```csharp
using static ChurchBoolean;
using static ChurchNumeral;

public static partial class ChurchSignedNumeral
{
    // Sign = n => (n, 0)
    public static readonly Func<Numeral, SignedNumeral>
        Sign = n => new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create(n)(Zero));

    // Negate = signed => signed.Swap()
    public static readonly Func<SignedNumeral, SignedNumeral>
        Negate = signed => new SignedNumeral(new Tuple<Numeral, Numeral>(signed).Swap());

    // Positive = signed => signed.Item1()
    public static readonly Func<SignedNumeral, Numeral>
        Positive = signed => new Tuple<Numeral, Numeral>(signed).Item1();

    // Negative = signed => signed.Item2()
    public static readonly Func<SignedNumeral, Numeral>
        Negative = signed => new Tuple<Numeral, Numeral>(signed).Item2();

    // Format = signed =>
    //    If(positive >= negative)
    //        (_ => (positive - negative, 0))
    //        (_ => (0, negative - positive))
    public static readonly Func<SignedNumeral, SignedNumeral>
        Format = signed =>
            If(signed.Positive().IsGreaterThanOrEqualTo(signed.Negative()))
                (_ => signed.Positive().Subtract(signed.Negative()).Sign())
                (_ => signed.Negative().Subtract(signed.Positive()).Sign().Negate());
}

public static partial class SignedNumeralExtensions
{
    public static SignedNumeral Sign(this Numeral n) => ChurchSignedNumeral.Sign(n);

    public static SignedNumeral Negate(this SignedNumeral signed) => ChurchSignedNumeral.Negate(signed);

    public static Numeral Positive(this SignedNumeral signed) => ChurchSignedNumeral.Positive(signed);

    public static Numeral Negative(this SignedNumeral signed) => ChurchSignedNumeral.Negative(signed);

    public static SignedNumeral Format(this SignedNumeral signed) => ChurchSignedNumeral.Format(signed);
}
```

### Arithmetic operators

Naturally, for signed numbers a, b:

```csharp
a + b
≡ (ap, an) + (bp, bn)
≡ (ap - an) + (bp - bn)
≡ (ap + bp, an + bn)

  a - b
≡ (ap, an) - (bp, bn)
≡ (ap - an) - (bp - bn)
≡ (ap + bn, an + bp)

  a * b
≡ (ap, an) * (bp, bn)
≡ (ap - an) * (bp - bn)
≡ (ap * bp + an * bn, ap * bn + an * bp)

  a / b
≡ (ap, an) / (bp, bn)
≡ (ap - an) / (bp - bn)
≡ (ap / bp + an / bn, ap / bn + an / bp)
```

So in lambda calculus:

```csharp
AddSigned := λa.λb.Format (CreateTuple (ap + bp) (an + bn))
SubtractSigned := λa.λb.Format (CreateTuple (ap + bn) (an + bp))
MultiplySigned := λa.λb.Format (CreateTuple (ap * bp + an * bn) (ap * bn + an * bp))
```

Division is more tricky because a and b’s positive and negative values can be 0. In this case, just return 0 when dividing by 0:

```csharp
DivideByIgnoreZero := λa.λb.If (IsZero b) (λx.0) (λx.DivideBy a b)
```

Here the DivideBy function for Church numeral is used. As fore mentioned, this DivideBy function is not well defined. It is temporarily used here and will be revisited later. So division can be defined as:

```csharp
DivideBySigned := λa.λb.Format (CreateTuple ((DivideByIgnoreZero ap bp) + (DivideByIgnoreZero an bn)) ((DivideByIgnoreZero ap bn) + (DivideByIgnoreZero an bp)))
```

The following are the C# implementations and the extension methods:

```csharp
public static partial class ChurchSignedNumeral
{
    // Add = a => b => (a.Positive() + b.Positive(), a.Negative() + b.Negative()).Format()
    public static readonly Func<SignedNumeral, Func<SignedNumeral, SignedNumeral>>
        Add = a => b => new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create
                (a.Positive().Add(b.Positive()))
                (a.Negative().Add(b.Negative())))
            .Format();

    // Subtract = a => b => (a.Positive() + b.Negative(), a.Negative() + b.Positive()).Format()
    public static readonly Func<SignedNumeral, Func<SignedNumeral, SignedNumeral>>
        Subtract = a => b => new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create
                (a.Positive().Add(b.Negative()))
                (a.Negative().Add(b.Positive())))
            .Format();

    // Multiply = a => b => (a.Positive() * b.Positive() + a.Negative() * b.Negative(), a.Positive() * b.Negative() + a.Negative() * b.Positive()).Format()
    public static readonly Func<SignedNumeral, Func<SignedNumeral, SignedNumeral>>
        Multiply = a => b => new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create
                (a.Positive().Multiply(b.Positive()).Add(a.Negative().Multiply(b.Negative())))
                (a.Positive().Multiply(b.Negative()).Add(a.Negative().Multiply(b.Positive()))))
            .Format();

    // / = dividend => divisor => If(divisor.IsZero())(_ => 0)(_ => dividend.DivideBy(divisor))
    private static readonly Func<Numeral, Func<Numeral, Numeral>> 
        DivideByIgnoreZero = dividend => divisor =>
            ChurchBoolean<Numeral>.If(divisor.IsZero())
                (_ => Zero)
                (_ => dividend.DivideBy(divisor));

    // DivideBy = dividend => divisor => (dividend.Positive() / divisor.Positive() + dividend.Negative() / divisor.Negative(), dividend.Positive() / divisor.Negative() + dividend.Negative() / divisor.Positive()).Format();
    public static readonly Func<SignedNumeral, Func<SignedNumeral, SignedNumeral>>
        DivideBy = dividend => divisor => new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create
                (DivideByIgnoreZero(dividend.Positive())(divisor.Positive()).Add(DivideByIgnoreZero(dividend.Negative())(divisor.Negative())))
                (DivideByIgnoreZero(dividend.Positive())(divisor.Negative()).Add(DivideByIgnoreZero(dividend.Negative())(divisor.Positive()))))
            .Format();
}

public static partial class SignedNumeralExtensions
{
    public static SignedNumeral Add(this SignedNumeral a, SignedNumeral b) => ChurchSignedNumeral.Add(a)(b);

    public static SignedNumeral Subtract(this SignedNumeral a, SignedNumeral b) => ChurchSignedNumeral.Subtract(a)(b);

    public static SignedNumeral Multiply(this SignedNumeral a, SignedNumeral b) => ChurchSignedNumeral.Multiply(a)(b);

    public static SignedNumeral DivideBy(this SignedNumeral dividend, SignedNumeral divisor) => ChurchSignedNumeral.DivideBy(dividend)(divisor);
}
```

And the following code demonstrate how these operators work:

```csharp
[TestClass]
public class ChurchSignedNumeralTests
{
    [TestMethod]
    public void SignNegatePositiveNegativeTest()
    {
        SignedNumeral signed = 0U.Church().Sign();
        Assert.IsTrue(0U == signed.Positive().Unchurch());
        Assert.IsTrue(0U == signed.Negative().Unchurch());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive().Unchurch());
        Assert.IsTrue(0U == signed.Negative().Unchurch());

        signed = 1U.Church().Sign();
        Assert.IsTrue(1U == signed.Positive().Unchurch());
        Assert.IsTrue(0U == signed.Negative().Unchurch());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive().Unchurch());
        Assert.IsTrue(1U == signed.Negative().Unchurch());

        signed = 2U.Church().Sign();
        Assert.IsTrue(2U == signed.Positive().Unchurch());
        Assert.IsTrue(0U == signed.Negative().Unchurch());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive().Unchurch());
        Assert.IsTrue(2U == signed.Negative().Unchurch());

        signed = 123U.Church().Sign();
        Assert.IsTrue(123U == signed.Positive().Unchurch());
        Assert.IsTrue(0U == signed.Negative().Unchurch());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive().Unchurch());
        Assert.IsTrue(123U == signed.Negative().Unchurch());

        signed = new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create(12U.Church())(23U.Church()));
        Assert.IsTrue(12U == signed.Positive().Unchurch());
        Assert.IsTrue(23U == signed.Negative().Unchurch());
        signed = signed.Negate();
        Assert.IsTrue(23U == signed.Positive().Unchurch());
        Assert.IsTrue(12U == signed.Negative().Unchurch());
    }

    [TestMethod]
    public void FormatWithZeroTest()
    {
        SignedNumeral signed = new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create(12U.Church())(23U.Church()));
        signed = signed.Format();
        Assert.IsTrue(0U == signed.Positive().Unchurch());
        Assert.IsTrue(11U == signed.Negative().Unchurch());

        signed = new SignedNumeral(ChurchTuple<Numeral, Numeral>.Create(23U.Church())(12U.Church()));
        signed = signed.Format();
        Assert.IsTrue(11U == signed.Positive().Unchurch());
        Assert.IsTrue(0U == signed.Negative().Unchurch());
    }

    [TestMethod]
    public void AddTest()
    {
        SignedNumeral a = 0U.Church().Sign();
        SignedNumeral b = 0U.Church().Sign();
        SignedNumeral result = a.Add(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());

        a = 1U.Church().Sign();
        b = 1U.Church().Sign().Negate();
        result = a.Add(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());

        a = 3U.Church().Sign();
        b = 5U.Church().Sign().Negate();
        result = a.Add(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(2U == result.Negative().Unchurch());
    }

    [TestMethod]
    public void SubtractTest()
    {
        SignedNumeral a = 0U.Church().Sign();
        SignedNumeral b = 0U.Church().Sign();
        SignedNumeral result = a.Subtract(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());

        a = 1U.Church().Sign();
        b = 1U.Church().Sign().Negate();
        result = a.Subtract(b);
        Assert.IsTrue(2U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());

        a = 3U.Church().Sign();
        b = 5U.Church().Sign().Negate();
        result = a.Subtract(b);
        Assert.IsTrue(8U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());
    }

    [TestMethod]
    public void MultiplyTest()
    {
        SignedNumeral a = 0U.Church().Sign();
        SignedNumeral b = 0U.Church().Sign();
        SignedNumeral result = a.Multiply(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());

        a = 1U.Church().Sign();
        b = 1U.Church().Sign().Negate();
        result = a.Multiply(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(1U == result.Negative().Unchurch());

        a = 3U.Church().Sign();
        b = 5U.Church().Sign().Negate();
        result = a.Multiply(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(15U == result.Negative().Unchurch());
    }

    [TestMethod]
    public void DivideByTest()
    {
        SignedNumeral a = 0U.Church().Sign();
        SignedNumeral b = 0U.Church().Sign();
        SignedNumeral result = a.DivideBy(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(0U == result.Negative().Unchurch());

        a = 1U.Church().Sign();
        b = 1U.Church().Sign().Negate();
        result = a.DivideBy(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(1U == result.Negative().Unchurch());

        a = 11U.Church().Sign();
        b = 5U.Church().Sign().Negate();
        result = a.DivideBy(b);
        Assert.IsTrue(0U == result.Positive().Unchurch());
        Assert.IsTrue(2U == result.Negative().Unchurch());
    }
}
```