---
title: "Lambda Calculus via C# (10) Church Numeral Arithmetic Operators"
published: 2018-11-10
description: "Another benefits of introducing (cheating with)  into lambda calculus is - it provides a place to define"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate")**

## Operators

Another benefits of introducing (cheating with) [\_Numeral class](/posts/lambda-calculus-via-c-sharp-9-wrapping-church-numerals-and-arithmetic) into lambda calculus is - it provides a place to define custom operators.

```csharp
public partial class _Numeral
{
    public static _Numeral operator +
        (_Numeral a, _Numeral b) => a.Add(b);

    public static _Numeral operator -
        (_Numeral a, _Numeral b) => a.Subtract(b);

    public static _Numeral operator *
        (_Numeral a, _Numeral b) => a.Multiply(b);

    public static _Numeral operator ^
        (_Numeral a, _Numeral b) => a.Pow(b);

    public static _Numeral operator ++
        (_Numeral numeral) => numeral.Increase();

    public static _Numeral operator --
        (_Numeral numeral) => numeral.Decrease();
}
```

This cannot be done to delegate type Numeral<T>. In C#, custom operators cannot be defined for delegates/functions/lambda expressions.

Now Church numerals and arithmetic operations are all implemented in C#. Now it’s time for testing.

## Conversion between Church numeral (now \_Numeral) and System.UInt32

Similar to Church Boolean <-> System.Boolean, some conversion helper methods can be created between \_Numeral and [System.UInt32](https://msdn.microsoft.com/en-us/library/system.uint32.aspx):

```csharp
public static partial class ChurchEncoding
{
    public static _Numeral _Church
        (this uint n) => n > 0 ? new _Numeral(_Church(n - 1)) : _Numeral.Zero;

    public static uint _Unchurch
        (this _Numeral numeral) => numeral.Numeral<uint>()(x => x + 1)(0);
}
```

Once again, these 2 methods are tagged with underscore because unit is C# specific.

In \_Unchurch, a Church numeral (now a \_Numeral) n is converted to natural number by “applying add 1” n times on 0.

Similarly to \_Unchurch, \_Numeral can be converted to string too:

```csharp
public static partial class ChurchEncoding
{
    public static string _Visualize(this _Numeral numeral)
    {
        return numeral.Numeral<string>()(x => string.Concat(x, "#"))(string.Empty);
    }
}
```

0 will be converted to empty string, 1 will be “#”, 2 will be “##”, etc.

## Compare \_Numeral and System.UInt32

Similar to above operators, == and != can be defined between Church numeral and System.UInt32:

```csharp
public partial class _Numeral
{
    public static bool operator ==
        (_Numeral a, uint b) => a._Unchurch() == b;

    public static bool operator ==
        (uint a, _Numeral b) => a == b._Unchurch();

    public static bool operator !=
        (_Numeral a, uint b) => a._Unchurch() != b;

    public static bool operator !=
        (uint a, _Numeral b) => a != b._Unchurch();
}
```

bool and uint - these are totally C# specific, and will be only used for unit tests.

## Unit tests

The last function needed is a Pow function for uint, because .NET only has a [Math.Pow](https://msdn.microsoft.com/en-us/library/system.math.pow.aspx) function for double.

```csharp
public static class UInt32Extensions
{
    public static uint Pow(this uint mantissa, uint exponent)
    {
        uint result = 1;
        for (int i = 0; i < exponent; i++)
        {
            result *= mantissa;
        }
        return result;
    }
}
```

The same way as [Church Boolean tests](/posts/lambda-calculus-via-c-sharp-5-boolean-logic), Church numeral and arithmetic operation can be unit tested by directly comparing results with System.UInt32’s arithmetic operation results:

```csharp
[TestClass()]
public class _NumeralExtensionsTests
{
    [TestMethod()]
    public void IncreaseTest()
    {
        _Numeral numeral = 0U._Church();
        Assert.IsTrue(0U + 1U == ++numeral);
        Assert.IsTrue(1U + 1U == ++numeral);
        Assert.IsTrue(2U + 1U == ++numeral);
        Assert.IsTrue(3U + 1U == ++numeral);
        numeral = 123U._Church();
        Assert.IsTrue(123U + 1U == ++numeral);
    }

    [TestMethod()]
    public void AddTest()
    {
        Assert.IsTrue(0U + 0U == 0U._Church() + 0U._Church());
        Assert.IsTrue(0U + 1U == 0U._Church() + 1U._Church());
        Assert.IsTrue(10U + 0U == 10U._Church() + 0U._Church());
        Assert.IsTrue(0U + 10U == 0U._Church() + 10U._Church());
        Assert.IsTrue(1U + 1U == 1U._Church() + 1U._Church());
        Assert.IsTrue(10U + 1U == 10U._Church() + 1U._Church());
        Assert.IsTrue(1U + 10U == 1U._Church() + 10U._Church());
        Assert.IsTrue(3U + 5U == 3U._Church() + 5U._Church());
        Assert.IsTrue(123U + 345U == 123U._Church() + 345U._Church());
    }

    [TestMethod()]
    public void DecreaseTest()
    {
        _Numeral numeral = 3U._Church();
        Assert.IsTrue(3U - 1U == --numeral);
        Assert.IsTrue(2U - 1U == --numeral);
        Assert.IsTrue(1U - 1U == --numeral);
        Assert.IsTrue(0U == --numeral);
        numeral = 123U._Church();
        Assert.IsTrue(123U - 1U == --numeral);
    }

    [TestMethod()]
    public void SubtractTest()
    {
        Assert.IsTrue(0U - 0U == 0U._Church() - 0U._Church());
        Assert.IsTrue(0U == 0U._Church() - 1U._Church());
        Assert.IsTrue(10U - 0U == 10U._Church() - 0U._Church());
        Assert.IsTrue(0U == 0U._Church() - 10U._Church());
        Assert.IsTrue(1U - 1U == 1U._Church() - 1U._Church());
        Assert.IsTrue(10U - 1U == 10U._Church() - 1U._Church());
        Assert.IsTrue(0U == 1U._Church() - 10U._Church());
        Assert.IsTrue(0U == 3U._Church() - 5U._Church());
        Assert.IsTrue(0U == 123U._Church() - 345U._Church());
    }

    [TestMethod()]
    public void MultiplyTest()
    {
        Assert.IsTrue(0U * 0U == 0U._Church() * 0U._Church());
        Assert.IsTrue(0U * 1U == 0U._Church() * 1U._Church());
        Assert.IsTrue(10U * 0U == 10U._Church() * 0U._Church());
        Assert.IsTrue(0U * 10U == 0U._Church() * 10U._Church());
        Assert.IsTrue(1U * 1U == 1U._Church() * 1U._Church());
        Assert.IsTrue(10U * 1U == 10U._Church() * 1U._Church());
        Assert.IsTrue(1U * 10U == 1U._Church() * 10U._Church());
        Assert.IsTrue(3U * 5U == 3U._Church() * 5U._Church());
        Assert.IsTrue(12U * 23U == 12U._Church() * 23U._Church());
    }

    [TestMethod()]
    public void PowTest()
    {
        Assert.IsTrue(0U.Pow(1U) == (0U._Church() ^ 1U._Church()));
        Assert.IsTrue(10U.Pow(0U) == (10U._Church() ^ 0U._Church()));
        Assert.IsTrue(0U.Pow(10U) == (0U._Church() ^ 10U._Church()));
        Assert.IsTrue(1U.Pow(1U) == (1U._Church() ^ 1U._Church()));
        Assert.IsTrue(10U.Pow(1U) == (10U._Church() ^ 1U._Church()));
        Assert.IsTrue(1U.Pow(10U) == (1U._Church() ^ 10U._Church()));
        Assert.IsTrue(3U.Pow(5U) == (3U._Church() ^ 5U._Church()));
        Assert.IsTrue(5U.Pow(3U) == (5U._Church() ^ 3U._Church()));
    }
}
```