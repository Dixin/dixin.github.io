---
title: "Lambda Calculus via C# (21) SKI Combinator Calculus"
published: 2018-11-21
description: "The  shows SKI calculus is untyped and strongly typed C# implementation does not work. So here comes the SKI in untyped C#:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-6-combinatory-logic](/posts/lambda-calculus-via-csharp-6-combinatory-logic "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-6-combinatory-logic")**

The [previous part](/posts/lambda-calculus-via-c-sharp-20-combinators) shows SKI calculus is untyped and strongly typed C# implementation does not work. So here comes the SKI in untyped C#:

```csharp
public static partial class SkiCombinators
{
    public static Func<dynamic, Func<dynamic, Func<dynamic, dynamic>>>
        S = x => y => z => x(z)(y(z));

    public static Func<dynamic, Func<dynamic, dynamic>>
        K = x => _ => x;

    public static Func<dynamic, dynamic>
        I = x => x;
}
```

Notice closed types (Func<dynamic, …>) are used instead of open type (Func<T, …>) in previous part. So S, K and I do not have to be in the form of C# methods.

## I Combinator

Actually I can be defined with S and K:

```csharp
S K K x
≡ K x (K x)
≡ x

  S K S x
≡ K x (S x)
≡ x
```

So I is merely [syntactic sugar](http://en.wikipedia.org/wiki/Syntactic_sugar):

```csharp
I2 := S K K
I3 := S K S
```

And C#:

```csharp
public static partial class SkiCombinators
{
    public static Func<dynamic, dynamic>
        I2 = S(K)(K);
        
    public static Func<dynamic, dynamic>
        I3 = S(K)(S);
}
```

## BCKW combinators

BCKW and SKI can define each other:

```csharp
B := S (K S) K
C := S (S (K (S (K S) K)) S) (K K)
K := K
W := S S (S K)

S := B (B (B W) C) (B B) ≡ B (B W) (B B C)
K := K
I := W K
```

## ω combinator

In SKI, the self application combinator ω is:

```csharp
ω := S I I
```

This is easy to understand:

```csharp
S I I x
≡ I x (I x) 
≡ x x
```

Then

```csharp
Ω := S I I (S I I) 
   ≡ I (S I I) (I (S I I)) 
   ≡ (S I I) (S I I) 
   ≡ S I I (S I I)
   ...
```

C#:

```csharp
public static partial class SkiCombinators
{
    public static Func<dynamic, dynamic> 
        ω = S(I)(I);

    public static Func<dynamic, dynamic>
        Ω = _ => ω(ω); // Ω = ω(ω) throws exception.
}
```

## Function composition

Remember function composition:

```csharp
(f2 ∘ f1) x := f2 (f1 x)
```

In SKI:

```csharp
S (K S) K f1 f2 x
≡ (K S) f1 (K f1) f2 x
≡ S (K f1) f2 x
≡ (K f1) x (f2 x)
≡ f1 (f2 x)
```

So:

```csharp
Compose := S (K S) K
```

In C#:

```csharp
public static partial class SkiCombinators
{
    public static Func<dynamic, dynamic> 
        Compose = S(K(S))(K);
}
```

## Booleans

From previous part:

```csharp
True := K
False := S K
```

So:

```csharp
public static partial class SkiCombinators
{
    public static Boolean
        True = new Boolean(K);
        
    public static Boolean
        False = new Boolean(S(K));
}
```

## Numerals

Remember:

```csharp
0 := λf.λx.x
1 := λf.λx.f x
2 := λf.λx.f (f x)
3 := λf.λx.f (f (f x))
...
```

In SKI:

```csharp
K I f x
≡ I x
≡ x

  I f x
≡ f x

  S Compose I f x
≡ Compose f (I f) x
≡ Compose f f x
≡ f (f x)

  S Compose (S Compose I) f x
≡ Compose f (S Compose I f) x
≡ Compose f (Compose f f) x
≡ f (f (f x))

...
```

So:

```csharp
0 := K I                     ≡ K I
1 := I                       ≡ I
2 := S Compose I             ≡ S (S (K S) K) I
3 := S Compose (S Compose I) ≡ S (S (K S) K) (S (S (K S) K) I)
...
```

In C#:

```csharp
public static partial class SkiCombinators
{
    public static Func<dynamic, dynamic> 
        Zero = K(I);

    public static Func<dynamic, dynamic> 
        One = I;

    public static Func<dynamic, dynamic> 
        Two = S(Compose)(I);

    public static Func<dynamic, dynamic> 
        Three = S(Compose)(S(Compose)(I));
}
```

And generally:

```csharp
Increase := S Compose ≡ S (S (K S) K)
```

C#:

```csharp
public static partial class SkiCombinators
{
    public static Func<dynamic, Func<dynamic, dynamic>> 
        Increase = S(Compose);
}
```

The encoding can keep going, but this post stops here. Actually, S and K can be composed to combinators that are extensionally equal to any lambda term. The proof can be found here - [Completeness of the S-K basis](http://en.wikipedia.org/wiki/Combinatory_logic#Completeness_of_the_S-K_basis).

## Unit tests

```csharp
[TestClass]
public class SkiCombinatorsTests
{
    [TestMethod]
    public void SkiTests()
    {
        Func<int, Func<int, int>> x1 = a => b => a + b;
        Func<int, int> y1 = a => a + 1;
        int z1 = 1;
        Assert.AreEqual(x1(z1)(y1(z1)), (int)SkiCombinators.S(x1)(y1)(z1));
        Assert.AreEqual(x1, (Func<int, Func<int, int>>)SkiCombinators.K(x1)(y1));
        Assert.AreEqual(x1, (Func<int, Func<int, int>>)SkiCombinators.I(x1));
        Assert.AreEqual(y1, (Func<int, int>)SkiCombinators.I(y1));
        Assert.AreEqual(z1, (int)SkiCombinators.I(z1));

        string x2 = "a";
        int y2 = 1;
        Assert.AreEqual(x2, (string)SkiCombinators.K(x2)(y2));
        Assert.AreEqual(x2, (string)SkiCombinators.I(x2));
        Assert.AreEqual(y2, (int)SkiCombinators.I(y2));
    }

    [TestMethod]
    public void BooleanTests()
    {
        Assert.AreEqual(true, (bool)SkiCombinators.True(true)(false));
        Assert.AreEqual(false, (bool)SkiCombinators.False(new Func<dynamic, dynamic>(_ => true))(false));
    }

    [TestMethod]
    public void NumeralTests()
    {
        Assert.AreEqual(0U, SkiCombinators._UnchurchNumeral(SkiCombinators.Zero));
        Assert.AreEqual(1U, SkiCombinators._UnchurchNumeral(SkiCombinators.One));
        Assert.AreEqual(2U, SkiCombinators._UnchurchNumeral(SkiCombinators.Two));
        Assert.AreEqual(3U, SkiCombinators._UnchurchNumeral(SkiCombinators.Three));
        Assert.AreEqual(4U, SkiCombinators._UnchurchNumeral(SkiCombinators.Increase(SkiCombinators.Three)));
    }
}
```