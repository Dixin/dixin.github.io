---
title: "Lambda Calculus via C# (14) Church Pair (2-Tuple) and Church Numeral Decrease"
published: 2018-11-14
description: "In the  part, the Decrease was defined as:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-4-tuple-and-signed-numeral](/posts/lambda-calculus-via-csharp-4-tuple-and-signed-numeral "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-4-tuple-and-signed-numeral")**

In the [Church numeral arithmetic](/posts/lambda-calculus-via-c-sharp-9-wrapping-church-numerals-and-arithmetic) part, the Decrease was defined as:
```
Decrease := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
```

This is complex. Now with Church pair (called tuple here to align to C# terms), Decrease can be defined in a easier way.

## Shift a Church Pair (2-Tuple)

First, a function is needed to shift a tuple:
```
Shift = λf.λt.CreateTuple (Item2 t) (f (Item1 t))
```

It takes a tuple (x, y) and a function f, then returns a new tuple (y, f y).

C# implementation is:
```
// (x, y) -> (y, f(y))
// Shift = tuple => f => Create(tuple.Item2())(f(tuple.Item1()))
public static Tuple<T, T> Shift<T>
    (this Tuple<T, T> tuple, Func<T, T> f) => Create<T, T>(tuple.Item2())(f(tuple.Item2()));
```

Again, the implementation is uncurried extension method for convenience of application, and readability.

## Decrease a Church numeral

Remember a Church numeral n can be considered to do “Increase” n times from 0:
```
n Increase Zero
≡ n
```

What if doing “Shift” n times base on (0, 0)?
```
3 (Shift Increase) (0, 0)
≡ (Shift Increase) ∘ (Shift Increase) ∘ (Shift Increase) (0, 0)
≡ (Shift Increase) ∘ (Shift Increase) (0, Increase 0)
≡ (Shift Increase) ∘ (Shift Increase) (0, 1)
≡ (Shift Increase) ∘ (1, Increase 1)
≡ (Shift Increase) ∘ (1, 2)
≡ (2, Increase 2)
≡ (2, 3)
```

And generally:
```
n (Shift Increase (0, 0))
≡ (n - 1, n)
```

This turns out a way to get the predecessor of n. So:
```
Decrease2 := λn.Item1 (n (Shift Increase) (CreateTuple 0 0))
```

And C#:
```
public static partial class _NumeralExtensions
{
    // Decrease2 = n => n(tuple => tuple.Shift(Increase))(ChurchTuple.Create(Zero)(Zero)).Item1();
    public static _Numeral Decrease2
        (this _Numeral numeral) => 
            numeral.Numeral<Tuple<_Numeral, _Numeral>>()
                (tuple => tuple.Shift(Increase)) // (x, y) -> (y, y + 1)
                (ChurchTuple.Create<_Numeral, _Numeral>(Zero)(Zero))
            .Item1();
}
```

## Unit tests

The following unit tests also shows how to apply the [uncurried](/posts/lambda-calculus-via-c-sharp-1-fundamentals-closure-currying-and-partial-application) methods Swap, Shift, \_Create:

```csharp
[TestClass()]
public class ChurchTupleTests
{
    [TestMethod()]
    public void CreateItem1Item2Test()
    {
        Tuple<int, string> tuple1 = ChurchTuple.Create<int, string>(1)("a");
        Assert.AreEqual(1, tuple1.Item1());
        Assert.AreEqual("a", tuple1.Item2());
        Tuple<string, int> tuple2 = ChurchTuple.Create<string, int>("a")(1);
        Assert.AreEqual("a", tuple2.Item1());
        Assert.AreEqual(1, tuple2.Item2());
        object @object = new object();
        Tuple<object, int> tuple3 = ChurchTuple.Create<object, int>(@object)(1);
        Assert.AreEqual(@object, tuple3.Item1());
        Assert.AreEqual(1, tuple3.Item2());
    }

    [TestMethod()]
    public void ShiftTest()
    {
        Tuple<int, int> tuple1 = ChurchTuple.Create<int, int>(1)(2).Shift(_ => _);
        Assert.AreEqual(2, tuple1.Item1());
        Assert.AreEqual(2, tuple1.Item2());
        Tuple<int, int> tuple2 = ChurchTuple.Create<int, int>(2)(3).Shift(value => value * 2);
        Assert.AreEqual(3, tuple2.Item1());
        Assert.AreEqual(6, tuple2.Item2());
        Tuple<string, string> tuple3 = ChurchTuple.Create<string, string>("a")("b").Shift(value => value + "c");
        Assert.AreEqual("b", tuple3.Item1());
        Assert.AreEqual("bc", tuple3.Item2());
    }

    [TestMethod()]
    public void SwapTest()
    {
        Tuple<int, string> tuple1 = ChurchTuple.Create<string, int>("a")(1).Swap();
        Assert.AreEqual(1, tuple1.Item1());
        Assert.AreEqual("a", tuple1.Item2());
        Tuple<string, int> tuple2 = ChurchTuple.Create<int, string>(1)("a").Swap();
        Assert.AreEqual("a", tuple2.Item1());
        Assert.AreEqual(1, tuple2.Item2());
        object @object = new object();
        Tuple<object, int> tuple3 = ChurchTuple.Create<int, object>(1)(@object).Swap();
        Assert.AreEqual(@object, tuple3.Item1());
        Assert.AreEqual(1, tuple3.Item2());
    }

    [TestMethod()]
    public void _CreateTest()
    {
        Tuple<int, string> tuple1 = ChurchTuple._Create(1, "a");
        Assert.AreEqual(1, tuple1.Item1());
        Assert.AreEqual("a", tuple1.Item2());
        Tuple<string, int> tuple2 = ChurchTuple._Create("a", 1);
        Assert.AreEqual("a", tuple2.Item1());
        Assert.AreEqual(1, tuple2.Item2());
        object @object = new object();
        Tuple<object, int> tuple3 = ChurchTuple._Create(@object, 1);
        Assert.AreEqual(@object, tuple3.Item1());
        Assert.AreEqual(1, tuple3.Item2());
    }
}
```