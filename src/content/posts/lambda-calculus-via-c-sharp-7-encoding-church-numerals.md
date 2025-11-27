---
title: "Lambda Calculus via C# (7) Encoding Church Numerals"
published: 2018-11-07
description: "Previous parts showed that , , and [if logic](/posts/l"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate")**

Previous parts showed that [Boolean values](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans), [Boolean logic](/posts/lambda-calculus-via-c-sharp-5-boolean-logic), and [if logic](/posts/lambda-calculus-via-c-sharp-6-if-logic-and-reduction-strategies) can all be encoded by lambda expressions. This and next few articles will focus on [natural numbers](http://en.wikipedia.org/wiki/Natural_number). [Signed number](/posts/lambda-calculus-via-c-sharp-18-encoding-signed-number) will be encoded after introducing [Church pairs (2-tuples)](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans).

## Church numerals

Church numerals are representations of natural numbers with lambda expressions under Church encoding. Church numerals are defined as:

```csharp
0 := λfx.x                  ≡ λf.λx.x
1 := λfx.f x                ≡ λf.λx.f x
2 := λfx.f (f x)            ≡ λf.λx.f (f x)
3 := λfx.f (f (f x))        ≡ λf.λx.f (f (f x))
...
n := λfx.f (f ... (f x)...) ≡ λf.λx.f (f ... (f x)...)
```

So a Church numeral n is a [higher order function](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions):

-   It takes a function f and x
-   then it applies f n times by starting with x, and returns the result.

When applying f and x to Church numeral, which is a function just like other lambda expressions, there are:

```csharp
0 f x ≡ x
1 f x ≡ f x
2 f x ≡ f (f x)
3 f x ≡ f (f (f x))
...
n f x ≡ f (f (... (f x)...))
```

According to the definition of function composition:

```csharp
f (f x) 
≡ (f ∘ f) x
```

So above definition becomes:

```csharp
0 := λfx.x                  ≡ λf.λx.x                   ≡ λf.λx.f0 x
1 := λfx.f x                ≡ λf.λx.f x                 ≡ λf.λx.f1 x
2 := λfx.f (f x)            ≡ λf.λx.(f ∘ f) x           ≡ λf.λx.f2 x
3 := λfx.f (f (f x))        ≡ λf.λx.(f ∘ f ∘ f) x       ≡ λf.λx.f3 x
...
n := λfx.f (f ... (f x)...) ≡ λf.λx.(f ∘ f ∘ ... ∘ f) x ≡ λf.λx.fn x
```

The partial application will be:

```csharp
0 f ≡ f0
1 f ≡ f1
2 f ≡ f2
3 f ≡ f3
...
n f ≡ fn
```

So Church numeral n can be simply read as - do “something” n times.

## C# Implementation - starting from 0

Similar to the C# implementation of Church Boolean, first a shortcut will be useful:

```csharp
// Curried from: T Numeral<T>(Func<T, T> f, T x)
public delegate Func<T, T> Numeral<T>(Func<T, T> f);
// Numeral<T> is just an alias of Func<Func<T, T>, Func<T, T>>
```

Based on the definition:

```csharp
public static partial class ChurchNumeral
{
    // Zero = f => x => x
    public static Func<T, T> Zero<T>
        (Func<T, T> f) => x => x;

    // One = f => x => f(x)
    public static Func<T, T> One<T>
        (Func<T, T> f) => x => f(x);
}
```

Also since 1 f ≡ f1, One can be also implemented as:

```csharp
// One2 = f => f ^ 1
public static Func<T, T> One2<T>
    (Func<T, T> f) => f;
```

And here are 2 and 3 in the same ways:

```csharp
// Two = f => x => f(f(x))
public static Func<T, T> Two<T>
    (Func<T, T> f) => x => f(f(x));

// Two2 = f => f ^ 2
public static Func<T, T> Two2<T>
    (Func<T, T> f) => f.o(f);

// Three = f => x => f(f(f(x)))
public static Func<T, T> Three<T>
    (Func<T, T> f) => x => f(f(f(x)));

// Three2 = f => f ^ 3
public static Func<T, T> Three2<T>
    (Func<T, T> f) => f.o(f).o(f);

// ...
```

Here the o function is the compose extension method defined in previous part.

Four, Five, … can be defined in these 2 ways too. This part will stop here. The next several parts will try to create arithmetic operators, and use them to construct any other numbers.