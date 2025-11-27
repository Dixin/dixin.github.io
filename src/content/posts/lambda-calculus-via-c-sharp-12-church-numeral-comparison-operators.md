---
title: "Lambda Calculus via C# (12) Church Numeral Comparison Operators"
published: 2018-11-12
description: "With the predicates defined in , operators can be defined in [\_Numeral class](/posts/lambda-calculus-via-c-sharp-9-wrapping"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate")**

## Church Numeral Comparison Operators

With the predicates defined in [previous part](/posts/lambda-calculus-via-c-sharp-11-predicates-and-divide), operators can be defined in [\_Numeral class](/posts/lambda-calculus-via-c-sharp-9-wrapping-church-numerals-and-arithmetic). Once again, class does not exist in lambda calculus, but C# class provides a place to define operators, which greatly improve the readability.

```csharp
public partial class _Numeral
{
    public static Boolean operator <=
        (_Numeral a, _Numeral b) => a.IsLessOrEqual(b);

    public static Boolean operator >=
        (_Numeral a, _Numeral b) => a.IsGreaterOrEqual(b);

    public static Boolean operator <
        (_Numeral a, _Numeral b) => a.IsLess(b);

    public static Boolean operator >
        (_Numeral a, _Numeral b) => a.IsGreater(b);

    public static Boolean operator ==
        (_Numeral a, _Numeral b) => a.AreEqual(b);

    public static Boolean operator !=
        (_Numeral a, _Numeral b) => a.AreNotEqual(b);
}
```

### C# object equality

This has nothing to do with lambda calculus and Church encoding. In C#, since == and != are customized, [Object.Equals](https://msdn.microsoft.com/en-us/library/bsc2ak47.aspx) and [Object.GetHashCode](https://msdn.microsoft.com/en-us/library/system.object.gethashcode.aspx) are required to be overridden too:

```csharp
public partial class _Numeral
{
    public override int GetHashCode
        () => this._Unchurch().GetHashCode();

    public override bool Equals(object obj)
    {
        if (obj == null)
        {
            return false;
        }

        _Numeral numeral = obj as _Numeral;
        if ((object)numeral == null)
        {
            return false;
        }

        return this.AreEqual(numeral)._Unchurch();
    }
}
```

These code are all C# specific requirement:

-   GetHashCode just returns current Church Numeral’s corresponding System.UInt32’s hash code
-   Equals just applies the AreEqual predicate, and coverts the returned [Church Boolean](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans) into [System.Boolean](https://msdn.microsoft.com/en-us/library/system.boolean.aspx).

## Unit tests

In the same (tedious) way as arithmetic operators:

```csharp
[TestClass()]
public class ChurchPredicatesTests
{
    private static readonly _Numeral Zero = _Numeral.Zero;

    [TestMethod()]
    public void IsZeroTest()
    {
        Assert.AreEqual(0U == 0U, Zero.IsZero()._Unchurch());
        Assert.AreEqual(1U == 0U, 1U._Church().IsZero()._Unchurch());
        Assert.AreEqual(2U == 0U, 2U._Church().IsZero()._Unchurch());
        Assert.AreEqual(123U == 0U, 123U._Church().IsZero()._Unchurch());
    }

    [TestMethod()]
    public void IsLessOrEqualTest()
    {
        Assert.AreEqual(0U <= 0U, (Zero <= Zero)._Unchurch());
        Assert.AreEqual(1U <= 0U, (1U._Church() <= Zero)._Unchurch());
        Assert.AreEqual(2U <= 0U, (2U._Church() <= Zero)._Unchurch());
        Assert.AreEqual(123U <= 0U, (123U._Church() <= Zero)._Unchurch());
        Assert.AreEqual(0U <= 2U, (Zero <= 2U._Church())._Unchurch());
        Assert.AreEqual(1U <= 2U, (1U._Church() <= 2U._Church())._Unchurch());
        Assert.AreEqual(2U <= 2U, (2U._Church() <= 2U._Church())._Unchurch());
        Assert.AreEqual(123U <= 2U, (123U._Church() <= 2U._Church())._Unchurch());
        Assert.AreEqual(0U <= 124U, (Zero <= 124U._Church())._Unchurch());
        Assert.AreEqual(1U <= 124U, (1U._Church() <= 124U._Church())._Unchurch());
        Assert.AreEqual(2U <= 124U, (2U._Church() <= 124U._Church())._Unchurch());
        Assert.AreEqual(123U <= 124U, (123U._Church() <= 124U._Church())._Unchurch());
    }

    [TestMethod()]
    public void IsGreaterOrEqualTest()
    {
        Assert.AreEqual(0U >= 0U, (Zero >= Zero)._Unchurch());
        Assert.AreEqual(1U >= 0U, (1U._Church() >= Zero)._Unchurch());
        Assert.AreEqual(2U >= 0U, (2U._Church() >= Zero)._Unchurch());
        Assert.AreEqual(123U >= 0U, (123U._Church() >= Zero)._Unchurch());
        Assert.AreEqual(0U >= 2U, (Zero >= 2U._Church())._Unchurch());
        Assert.AreEqual(1U >= 2U, (1U._Church() >= 2U._Church())._Unchurch());
        Assert.AreEqual(2U >= 2U, (2U._Church() >= 2U._Church())._Unchurch());
        Assert.AreEqual(123U >= 2U, (123U._Church() >= 2U._Church())._Unchurch());
        Assert.AreEqual(0U >= 124U, (Zero >= 124U._Church())._Unchurch());
        Assert.AreEqual(1U >= 124U, (1U._Church() >= 124U._Church())._Unchurch());
        Assert.AreEqual(2U >= 124U, (2U._Church() >= 124U._Church())._Unchurch());
        Assert.AreEqual(123U >= 124U, (123U._Church() >= 124U._Church())._Unchurch());
    }

    [TestMethod()]
    public void IsLessTest()
    {
        Assert.AreEqual(0U < 0U, (Zero < Zero)._Unchurch());
        Assert.AreEqual(1U < 0U, (1U._Church() < Zero)._Unchurch());
        Assert.AreEqual(2U < 0U, (2U._Church() < Zero)._Unchurch());
        Assert.AreEqual(123U < 0U, (123U._Church() < Zero)._Unchurch());
        Assert.AreEqual(0U < 2U, (Zero < 2U._Church())._Unchurch());
        Assert.AreEqual(1U < 2U, (1U._Church() < 2U._Church())._Unchurch());
        Assert.AreEqual(2U < 2U, (2U._Church() < 2U._Church())._Unchurch());
        Assert.AreEqual(123U < 2U, (123U._Church() < 2U._Church())._Unchurch());
        Assert.AreEqual(0U < 124U, (Zero < 124U._Church())._Unchurch());
        Assert.AreEqual(1U < 124U, (1U._Church() < 124U._Church())._Unchurch());
        Assert.AreEqual(2U < 124U, (2U._Church() < 124U._Church())._Unchurch());
        Assert.AreEqual(123U < 124U, (123U._Church() < 124U._Church())._Unchurch());
    }

    [TestMethod()]
    public void IsGreaterTest()
    {
        Assert.AreEqual(0U > 0U, (Zero > Zero)._Unchurch());
        Assert.AreEqual(1U > 0U, (1U._Church() > Zero)._Unchurch());
        Assert.AreEqual(2U > 0U, (2U._Church() > Zero)._Unchurch());
        Assert.AreEqual(123U > 0U, (123U._Church() > Zero)._Unchurch());
        Assert.AreEqual(0U > 2U, (Zero > 2U._Church())._Unchurch());
        Assert.AreEqual(1U > 2U, (1U._Church() > 2U._Church())._Unchurch());
        Assert.AreEqual(2U > 2U, (2U._Church() > 2U._Church())._Unchurch());
        Assert.AreEqual(123U > 2U, (123U._Church() > 2U._Church())._Unchurch());
        Assert.AreEqual(0U > 124U, (Zero > 124U._Church())._Unchurch());
        Assert.AreEqual(1U > 124U, (1U._Church() > 124U._Church())._Unchurch());
        Assert.AreEqual(2U > 124U, (2U._Church() > 124U._Church())._Unchurch());
        Assert.AreEqual(123U > 124U, (123U._Church() > 124U._Church())._Unchurch());
    }

    [TestMethod()]
    public void IsEqualTest()
    {
        Assert.AreEqual(0U == 0U, (Zero == Zero)._Unchurch());
        Assert.AreEqual(1U == 0U, (1U._Church() == Zero)._Unchurch());
        Assert.AreEqual(2U == 0U, (2U._Church() == Zero)._Unchurch());
        Assert.AreEqual(123U == 0U, (123U._Church() == Zero)._Unchurch());
        Assert.AreEqual(0U == 2U, (Zero == 2U._Church())._Unchurch());
        Assert.AreEqual(1U == 2U, (1U._Church() == 2U._Church())._Unchurch());
        Assert.AreEqual(2U == 2U, (2U._Church() == 2U._Church())._Unchurch());
        Assert.AreEqual(123U == 2U, (123U._Church() == 2U._Church())._Unchurch());
        Assert.AreEqual(0U == 124U, (Zero == 124U._Church())._Unchurch());
        Assert.AreEqual(1U == 124U, (1U._Church() == 124U._Church())._Unchurch());
        Assert.AreEqual(2U == 124U, (2U._Church() == 124U._Church())._Unchurch());
        Assert.AreEqual(123U == 124U, (123U._Church() == 124U._Church())._Unchurch());
    }

    [TestMethod()]
    public void IsNotEqualTest()
    {
        Assert.AreEqual(0U != 0U, (Zero != Zero)._Unchurch());
        Assert.AreEqual(1U != 0U, (1U._Church() != Zero)._Unchurch());
        Assert.AreEqual(2U != 0U, (2U._Church() != Zero)._Unchurch());
        Assert.AreEqual(123U != 0U, (123U._Church() != Zero)._Unchurch());
        Assert.AreEqual(0U != 2U, (Zero != 2U._Church())._Unchurch());
        Assert.AreEqual(1U != 2U, (1U._Church() != 2U._Church())._Unchurch());
        Assert.AreEqual(2U != 2U, (2U._Church() != 2U._Church())._Unchurch());
        Assert.AreEqual(123U != 2U, (123U._Church() != 2U._Church())._Unchurch());
        Assert.AreEqual(0U != 124U, (Zero != 124U._Church())._Unchurch());
        Assert.AreEqual(1U != 124U, (1U._Church() != 124U._Church())._Unchurch());
        Assert.AreEqual(2U != 124U, (2U._Church() != 124U._Church())._Unchurch());
        Assert.AreEqual(123U != 124U, (123U._Church() != 124U._Church())._Unchurch());
    }
}
```