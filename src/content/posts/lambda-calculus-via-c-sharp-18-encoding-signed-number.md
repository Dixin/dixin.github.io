---
title: "Lambda Calculus via C# (18) Encoding Signed Number"
published: 2018-11-18
description: "In lambda calculus, a signed number (integer) can be represented by a  of [Chur"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-4-tuple-and-signed-numeral](/posts/lambda-calculus-via-csharp-4-tuple-and-signed-numeral "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-4-tuple-and-signed-numeral")**

In lambda calculus, a signed number (integer) can be represented by a [Church pair (2-tuple)](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans) of [Church numerals](/posts/lambda-calculus-via-c-sharp-7-encoding-church-numerals) (natural numbers):

-   the first Church number represents the positive part
-   the second Church number represents the negative part
```
Signed := Tuple
```

So a signed number (npositive, negative) ≡ Subtract npositive nnegative.

## Create Signed number from Church numeral

Church numeral represents natural number and is always greater than or equal to 0. So Converting Church numeral to signed number is easy:
```
ToSigned := λn.CreateTuple n 0
```

It just need to append a negative part 0.

To create a negative signed number, just swap the Church numeral and 0:
```
Negate := Swap
```

And it is straightforward to get the positive part or negative part from a signed number:
```
Positive := Item1
Negative := Item2
```

C#:
```
// SignedNumeral is the alias of Tuple<_Numeral, _Numeral>
public delegate object SignedNumeral(Boolean<_Numeral, _Numeral> f);

public static partial class ChurchSignedNumeral
{
    public static _Numeral Zero { get; } = _Numeral.Zero;

    // Sign = numeral => ChurchTuple.Create(numeral, Zero)
    public static SignedNumeral Sign
        (this _Numeral numeral) => new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>(numeral)(Zero));

    // Negate = signed => signed.Swap()
    public static SignedNumeral Negate
        (this SignedNumeral signed) => new SignedNumeral(new Tuple<_Numeral, _Numeral>(signed).Swap());

    // Positive = signed => signed.Item1()
    public static _Numeral Positive
        (this SignedNumeral signed) => new Tuple<_Numeral, _Numeral>(signed).Item1();

    // Negative = signed => signed.Item2()
    public static _Numeral Negative
        (this SignedNumeral signed) => new Tuple<_Numeral, _Numeral>(signed).Item2();
}
```

## Format with 0

In this way, one signed number can have many representations. For example:
```
1  ≡ (1, 0) ≡ (2, 1) ≡ (3, 2) ≡ (4, 3) ≡ …
-1  ≡ (0, 1) ≡ (1, 2) ≡ (2, 3) ≡ (3, 4) ≡ …
```

So for convenience a format function can be create to consistently represent a signed number in (positive, 0) or (0, negative):
```
FormatWithZero = λs.If (IsEqual sp  sn) (λx.ToSigned 0) (λx.If (IsGreater sp sn) (λy.ToSigned (Subtract sp sn)) (λy.Negate (ToSigned (Subtract sn sp))))
```

where
```
sp ≡ Positive s
sn ≡ Negative s
```

C#:
```
// FormatWithZero = signed => If(positive == negative)(_ => Zero.Sign())(_ => If(positive > negative)(__ => (positive - negative).Sign())(__ => (negative - positive).Sign().Negate()))
public static SignedNumeral FormatWithZero(this SignedNumeral signed)
{
    // Just to make the code shorter.
    _Numeral positive = signed.Positive();
    _Numeral negative = signed.Negative();

    return ChurchBoolean.If<SignedNumeral>(positive == negative)
        (_ => Zero.Sign())
        (_ => ChurchBoolean.If<SignedNumeral>(positive > negative)
            (__ => (positive - negative).Sign())
            (__ => (negative - positive).Sign().Negate()));
}
```

## Arithmetic

Naturally, for signed numbers a, b:
```
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
```
AddSigned := λa.λb.FormatWithZero (CreateTuple (Add ap bp) (Add an bn))

SubtractSigned := λa.λb.FormatWithZero (CreateTuple (Add ap bn) (Add an bp))

MultiplySigned := λa.λb.FormatWithZero (CreateTuple (Add (Multiply ap bp) (Multiply an bn)) (Add (Multiply ap bn) (Multiply an bp)))

DivideBySigned := λa.λb.FormatWithZero (CreateTuple (Add (DivideByIgnoreZero ap bp) + (DivideByIgnoreZero an bn)) (Add (DivideByIgnoreZero ap bn) (DivideByIgnoreZero an bp))))
```

In DivideBySigned,
```
DivideByIgnoreZero = λa.λb.If (IsZero b) (λx.0) (λx._DivideBy a b)
```

When a Church numeral a is divided by Church numeral 0, just returns 0.

C#:
```
// Add = a => b => ChurchTuple.Create(a.Positive() + b.Positive())(a.Negative() + b.Negative()).FormatWithZero()
public static SignedNumeral Add
    (this SignedNumeral a, SignedNumeral b) => 
        new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>
            (a.Positive() + b.Positive())
            (a.Negative() + b.Negative()))
        .FormatWithZero();

// Subtract = a => b => ChurchTuple.Create(a.Positive() + b.Negative())(a.Negative() + b.Positive()).FormatWithZero()
public static SignedNumeral Subtract
    (this SignedNumeral a, SignedNumeral b) => 
        new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>
            (a.Positive() + b.Negative())
            (a.Negative() + b.Positive()))
        .FormatWithZero();

// Multiply = a => b => ChurchTuple.Create(a.Positive() * b.Positive() + a.Negative() + b.Negative())(a.Positive() * b.Negative() + a.Negative() * b.Positive()).FormatWithZero()
public static SignedNumeral Multiply
    (this SignedNumeral a, SignedNumeral b) => 
        new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>
            (a.Positive() * b.Positive() + a.Negative() * b.Negative())
            (a.Positive() * b.Negative() + a.Negative() * b.Positive()))
        .FormatWithZero();

// DivideBy = dividend => divisor => ChurchTuple.Create((dividend.Positive() | divisor.Positive()) + (dividend.Negative() | divisor.Negative()))((dividend.Positive() | divisor.Negative()) + (dividend.Negative() | divisor.Positive()))).FormatWithZero();
public static SignedNumeral DivideBy
    (this SignedNumeral dividend, SignedNumeral divisor) => 
        new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>
            ((dividend.Positive() | divisor.Positive()) + (dividend.Negative() | divisor.Negative()))
            ((dividend.Positive() | divisor.Negative()) + (dividend.Negative() | divisor.Positive())))
        .FormatWithZero();
```

In DivideBy, operator | is DivideByIgnoreZero, since it looks like /:
```
public static partial class _NumeralExtensions
{
    // DivideByIgnoreZero = dividend => divisor => If(divisor.IsZero())(_ => Zero)(_ => dividend._DivideBy(divisor))
    public static _Numeral DivideByIgnoreZero
        (this _Numeral dividend, _Numeral divisor) => 
            ChurchBoolean.If<_Numeral>(divisor.IsZero())
                (_ => Zero)
                (_ => dividend._DivideBy(divisor));
}

public partial class _Numeral
{
    public static _Numeral operator |
        (_Numeral dividend, _Numeral divisor) => dividend.DivideByIgnoreZero(divisor);
}
```

## Unit tests

```csharp
[TestClass()]
public class ChurchSignedNumeralTests
{
    [TestMethod()]
    public void SignNegatePositiveNegativeTest()
    {
        SignedNumeral signed = 0U._Church().Sign();
        Assert.IsTrue(0U == signed.Positive());
        Assert.IsTrue(0U == signed.Negative());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive());
        Assert.IsTrue(0U == signed.Negative());

        signed = 1U._Church().Sign();
        Assert.IsTrue(1U == signed.Positive());
        Assert.IsTrue(0U == signed.Negative());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive());
        Assert.IsTrue(1U == signed.Negative());

        signed = 2U._Church().Sign();
        Assert.IsTrue(2U == signed.Positive());
        Assert.IsTrue(0U == signed.Negative());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive());
        Assert.IsTrue(2U == signed.Negative());

        signed = 123U._Church().Sign();
        Assert.IsTrue(123U == signed.Positive());
        Assert.IsTrue(0U == signed.Negative());
        signed = signed.Negate();
        Assert.IsTrue(0U == signed.Positive());
        Assert.IsTrue(123U == signed.Negative());

        signed = new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>(12U._Church())(23U._Church()));
        Assert.IsTrue(12U == signed.Positive());
        Assert.IsTrue(23U == signed.Negative());
        signed = signed.Negate();
        Assert.IsTrue(23U == signed.Positive());
        Assert.IsTrue(12U == signed.Negative());
    }

    [TestMethod()]
    public void FormatWithZeroTest()
    {
        SignedNumeral signed = new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>(12U._Church())(23U._Church()));
        signed = signed.FormatWithZero();
        Assert.IsTrue(0U == signed.Positive());
        Assert.IsTrue(11U == signed.Negative());

        signed = new SignedNumeral(ChurchTuple.Create<_Numeral, _Numeral>(23U._Church())(12U._Church()));
        signed = signed.FormatWithZero();
        Assert.IsTrue(11U == signed.Positive());
        Assert.IsTrue(0U == signed.Negative());
    }

    [TestMethod()]
    public void AddTest()
    {
        SignedNumeral a = 0U._Church().Sign();
        SignedNumeral b = 0U._Church().Sign();
        SignedNumeral result = a.Add(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(0U == result.Negative());

        a = 1U._Church().Sign();
        b = 1U._Church().Sign().Negate();
        result = a.Add(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(0U == result.Negative());

        a = 3U._Church().Sign();
        b = 5U._Church().Sign().Negate();
        result = a.Add(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(2U == result.Negative());
    }

    [TestMethod()]
    public void SubtractTest()
    {
        SignedNumeral a = 0U._Church().Sign();
        SignedNumeral b = 0U._Church().Sign();
        SignedNumeral result = a.Subtract(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(0U == result.Negative());

        a = 1U._Church().Sign();
        b = 1U._Church().Sign().Negate();
        result = a.Subtract(b);
        Assert.IsTrue(2U == result.Positive());
        Assert.IsTrue(0U == result.Negative());

        a = 3U._Church().Sign();
        b = 5U._Church().Sign().Negate();
        result = a.Subtract(b);
        Assert.IsTrue(8U == result.Positive());
        Assert.IsTrue(0U == result.Negative());
    }

    [TestMethod()]
    public void MultiplyTest()
    {
        SignedNumeral a = 0U._Church().Sign();
        SignedNumeral b = 0U._Church().Sign();
        SignedNumeral result = a.Multiply(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(0U == result.Negative());

        a = 1U._Church().Sign();
        b = 1U._Church().Sign().Negate();
        result = a.Multiply(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(1U == result.Negative());

        a = 3U._Church().Sign();
        b = 5U._Church().Sign().Negate();
        result = a.Multiply(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(15U == result.Negative());
    }

    [TestMethod()]
    public void DivideByTest()
    {
        SignedNumeral a = 0U._Church().Sign();
        SignedNumeral b = 0U._Church().Sign();
        SignedNumeral result = a.DivideBy(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(0U == result.Negative());

        a = 1U._Church().Sign();
        b = 1U._Church().Sign().Negate();
        result = a.DivideBy(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(1U == result.Negative());

        a = 11U._Church().Sign();
        b = 5U._Church().Sign().Negate();
        result = a.DivideBy(b);
        Assert.IsTrue(0U == result.Positive());
        Assert.IsTrue(2U == result.Negative());
    }
}
```

## An alternative way to encode signed number

More intuitively, signed number can also be encoded by a Church pair of a Church Boolean and a Church numeral: (sign, absolute-value). For example, +1 will be (True, 1), -2 will be (False, 2), etc.

So:
```
Signed2 := Tuple
Sign := Item1
Absolute := Item2
```

Its arithmetic, for example, multiply, also becomes [intuitively](/posts/lambda-calculus-via-c-sharp-5-boolean-logic):
```
MultiplySigned2 = λa.λb.CreateTuple (Xor (Sign a) (Sign b)) (Multiply (Absolute a) (Absolute b))
```