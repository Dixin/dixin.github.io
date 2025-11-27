---
title: "Lambda Calculus via C# (11) Predicates, And Divide"
published: 2018-11-11
description: "A  is a function that returns a Boolean value. In Church encoding of lambda calculus, a predicate is a lambda expression that return"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate")**

A [predicate](http://en.wikipedia.org/wiki/Church_encoding#Predicates) is a function that returns a Boolean value. In Church encoding of lambda calculus, a predicate is a lambda expression that returns a Church Boolean.

## Predicates

The is the most fundamental predicate:

```csharp
IsZero := λn.n (λx.False) True
```

When it is applied, it will do (λx.False) n times based on True:

-   When n is 0, it will “apply (λx.False)” 0 time and just returns True
-   When n is not 0, it will “apply (λx.False)” 1 or more times, so returns False

In C#:

```csharp
public static partial class ChurchPredicates
{
    // IsZero = n => n(_ => False)(True)
    public static Boolean IsZero
        (this _Numeral numeral) =>
            numeral.Numeral<Boolean>()(_ => ChurchBoolean.False)(ChurchBoolean.True);
}
```

With IsZero, it will be easy to define other predicates for Church numeral:

```csharp
IsLessOrEqual := λa.λb.IsZero (Subtract a b)
IsGreaterOrEqual := λa.λb.IsZero (Subtract b a)
```

They are very simple and speak for themselves.

Then these 2 predicates lead to:

```csharp
AreEqual := λa.λb.And (IsLessOrEqual a b) (IsGreaterOrEqual a b)
```

Their oppositions will be just applications of Not:

```csharp
IsLess := λa.λb.Not (IsGreaterOrEqual a b)
IsGreater := λa.λb.Not (IsLessOrEqual a b)
AreNotEqual := λa.λb.Not (AreEqual a b)
```

This is the C# implementation of these 6 predicates:

```csharp
public static partial class ChurchPredicates
{
    // IsLessOrEqual = a => b => a.Subtract(b).IsZero()
    public static Boolean IsLessOrEqual
        (this _Numeral a, _Numeral b) => a.Subtract(b).IsZero();

    // IsGreaterOrEqual = a => b => b.Subtract(a).IsZero()
    public static Boolean IsGreaterOrEqual
        (this _Numeral a, _Numeral b) => b.Subtract(a).IsZero();

    // IsLess = a => b => a.IsGreaterOrEqual(b).Not()
    public static Boolean IsLess
        (this _Numeral a, _Numeral b) => a.IsGreaterOrEqual(b).Not();

    // IsGreater = a => b => a.IsLessOrEqual(b).Not()
    public static Boolean IsGreater
        (this _Numeral a, _Numeral b) => a.IsLessOrEqual(b).Not();

    // AreEqual = a => b => a.Subtract(b).IsZero().And(a.Subtract(b).IsZero())
    // Or:
    // AreEqual = a => b => a.IsLessOrEqual(b).And(a.IsGreaterOrEqual(b))
    public static Boolean AreEqual
        (this _Numeral a, _Numeral b) => a.IsLessOrEqual(b).And(a.IsGreaterOrEqual(b));

    // AreNotEqual = a => b => a.AreEqual(b).Not()
    public static Boolean AreNotEqual
        (this _Numeral a, _Numeral b) => a.AreEqual(b).Not();
}
```

## Divide

With IsZero, now Divide can be finally defined.

The division of natural numbers can be defined as:

```csharp
a/b := If a >= b then 1+ (a-b)/b else 0
```

So maybe Divide can be:

```csharp
_DivideBy := λa.λb.If (IsGreaterOrEqual a b) (λx.Add One (_DivideBy (Subtract a b) b)) (λx.Zero)
```

Here is the problem: This above 2 definitions are both [recursive](http://en.wikipedia.org/wiki/Recursion). Each uses itself in the definition.

In lambda calculus, lambda expressions are anonymous functions without names. And so far in all parts, all the other names are just shortcuts for readability. For example, IsZero use the function name of True and False - to make IsZero shorter and more readable; And it is totally ok not to use those names:

```csharp
IsZero := λn.n (λx.False) True
        ≡ λn.n (λx.λt.λf.f) (λt.λf.t)

  IsZero 5
≡ (λn.n (λx.λt.λf.f) (λt.λf.t)) 5
≡ ...
```

In contrast to \_DivideBy - for example, \_DivideBy 10 3:

```csharp
(λa.λb.If (IsGreaterOrEqual a b) (λx.Add One (Self (Subtract a b) b)) (λx.Zero)) 10 3
```

So a underscore is tagged to the name. \_DivideBy seems more C# specific rather than lambda calculus. But the corresponding C# function below will be temporarily used from now on, since it is very easy to understand. So here comes the recursive C# function:

```csharp
public static partial class _NumeralExtensions
{
    // _DivideBy = dividend => divisor => 
    // If(dividend.IsGreaterOrEqual(divisor))
    //    (_ => One + (dividend - divisor)._DivideBy(divisor))
    //    (_ => Zero);
    public static _Numeral _DivideBy
        (this _Numeral dividend, _Numeral divisor) => 
            ChurchBoolean.If<_Numeral>(dividend >= divisor)
                (_ => One + (dividend - divisor)._DivideBy(divisor))
                (_ => Zero);
}
```

And the / operator:

```csharp
public partial class _Numeral
{
    public static _Numeral operator /
        (_Numeral a, _Numeral b) => a._DivideBy(b);
}
```

Divide will be revisited in a [later part](/posts/lambda-calculus-via-c-sharp-23-y-combinator-and-divide), after introducing Y combinator for recursion.