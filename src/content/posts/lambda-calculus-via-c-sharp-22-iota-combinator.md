---
title: "Lambda Calculus via C# (22) Iota Combinator and Jot Combinators"
published: 2018-11-22
description: "is an  with minimum elements but still [Turing-complete](ht"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-6-combinatory-logic](/posts/lambda-calculus-via-csharp-6-combinatory-logic "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-6-combinatory-logic")**

## Language with 1 element

[Iota](http://en.wikipedia.org/wiki/Iota_and_Jot) is an [esoteric programming language](http://en.wikipedia.org/wiki/Esoteric_programming_language) with minimum elements but still [Turing-complete](http://en.wikipedia.org/wiki/Turing-complete). Iota's universal combinator is:
```
ι := λf.f S K ≡ λf.f (λx.λy.λz.x z (y z)) (λx.λy.x)
```

That’s [the whole language](https://web.archive.org/web/20150121065142/http://semarch.linguistics.fas.nyu.edu/barker/Iota/).

## Completeness

In Iota, [SKI](/posts/lambda-calculus-via-c-sharp-21-ski-combinator-calculus) can be implemented as:
```
S := ι (ι (ι (ι ι)))
K := ι (ι (ι ι))
ι := ι ι
```

For example:
```
ι ι x
≡ (λf.f S K) (λf.f S K) x
≡ (λf.f S K) S K x
≡ (S S K) K x
≡ S K (K K) x
≡ K x ((K K) x)
≡ x
≡ ι x
```

So Iota is also Turing-complete as SKI.

In C#:
```
public static class IotaCombinator
{
    public static Func<dynamic, dynamic>
        ι = f => f
            (new Func<dynamic, Func<dynamic, Func<dynamic, dynamic>>>(x => y => z => x(z)(y(z)))) // S
            (new Func<dynamic, Func<dynamic, dynamic>>(x => y => x)); // K

    public static Func<dynamic, Func<dynamic, Func<dynamic, dynamic>>>
        S = ι(ι(ι(ι(ι))));

    public static Func<dynamic, Func<dynamic, dynamic>>
        K = ι(ι(ι(ι)));

    public static Func<dynamic, dynamic>
        I = ι(ι);
}
```

## Unit tests

```csharp
[TestClass]
public class IotaCombinatorTests
{
    [TestMethod]
    public void SkiTests()
    {
        Func<int, Func<int, int>> x1 = a => b => a + b;
        Func<int, int> y1 = a => a + 1;
        int z1 = 1;
        Assert.AreEqual((int)SkiCombinators.S(x1)(y1)(z1), (int)IotaCombinator.S(x1)(y1)(z1));
        Assert.AreEqual((Func<int, Func<int, int>>)SkiCombinators.K(x1)(y1), (Func<int, Func<int, int>>)IotaCombinator.K(x1)(y1));
        Assert.AreEqual((Func<int, Func<int, int>>)SkiCombinators.I(x1), (Func<int, Func<int, int>>)IotaCombinator.I(x1));
        Assert.AreEqual((Func<int, int>)SkiCombinators.I(y1), (Func<int, int>)IotaCombinator.I(y1));
        Assert.AreEqual((int)SkiCombinators.I(z1), (int)IotaCombinator.I(z1));

        string x2 = "a";
        int y2 = 1;
        Assert.AreEqual((string)SkiCombinators.K(x2)(y2), (string)IotaCombinator.K(x2)(y2));
        Assert.AreEqual((string)SkiCombinators.I(x2), (string)IotaCombinator.I(x2));
        Assert.AreEqual((int)SkiCombinators.I(y2), (int)IotaCombinator.I(y2));
    }
}
```