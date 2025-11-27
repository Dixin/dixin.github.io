---
title: "Lambda Calculus via C# (20) Combinators"
published: 2018-11-20
description: "As mentioned in , combinator is a special kind of lambda expression without free variables"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-6-combinatory-logic](/posts/lambda-calculus-via-csharp-6-combinatory-logic "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-6-combinatory-logic")**

As mentioned in [a fundamental part](/posts/lambda-calculus-via-c-sharp-2-fundamentals-lambda-expression-variables-reductions), combinator is a special kind of lambda expression without free variables. So [combinatory logic](http://en.wikipedia.org/wiki/Combinatory_logic) (introduced by [Moses Schönfinkel](http://en.wikipedia.org/wiki/Moses_Sch%C3%B6nfinkel) and [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry)) can be viewed as a variant of lambda calculus.

## I combinator

The following simplest lambda expression:

```csharp
I := λx.x
```

is an example of combinator. In combinatory logic, λx.x is called I (Id), because it just returns the parameter itself.

## BCKW combinators

Also:

```csharp
B := λx.λy.λz.x (y z)
C := λx.λy.λz.x z y
K := λx.λy.   x
W := λx.λy.   x y y
```

where:

-   B composes x and y
-   C swaps y and z
-   K discards y
-   W duplicates y

Only bound variables appear in the body of the lambda expressions. So apparently these are combinators.

C# version:

```csharp
public static class BckwCombinators
{
    // B = x => => z => x(y(z))
    public static Func<Func<T1, T2>, Func<T1, TResult>> B<T1, T2, TResult>
        (Func<T2, TResult> x) => y => z => x(y(z));

    // C = f => x => y => f(y)(z)
    public static Func<T2, Func<T1, TResult>> C<T1, T2, TResult>
        (Func<T1, Func<T2, TResult>> x) => y => z => x(z)(y);

    // K = x => _ => x
    public static Func<T2, T1> K<T1, T2>
        (T1 x) => _ => x;

    // W = x => y => x(y)(y)
    public static Func<T, TResult> W<T, TResult>
        (Func<T, Func<T, TResult>> x) => y => x(y)(y);
}
```

The [BCKW system](http://en.wikipedia.org/wiki/B,C,K,W_system) is a variant of combinatory logic that takes the BCKW combinators as primitives.

## ω combinator

ω is the self application combinator:

```csharp
ω := λx.x x
```

And Ω is to apply ω to itself:

```csharp
Ω := ω ω
```

The interesting property of Ω is - it’s irreducible:

```csharp
ω ω
≡ (λx.x x) (λx.x x)
≡ (λx.x x) (λx.x x)
...
```

C#:

```csharp
public delegate T ω<T>(ω<T> ω);

public static class OmegaCombinators
{
    // ω = x => x(x)
    public static T ω<T>
        (ω<T> x) => x(x);

    // Ω = ω(ω)
    public static T Ω<T>
        () => ω<T>(ω); // Ω<T> = ω<T>(ω) throws exception.
}
```

Apparently, applying Ω will throw an exception:

> System.StackOverflowException was unhandled.

## SKI combinators

The more interested combinators are:

```csharp
S := λx.λy.λz.x z (y z)
K := λx.λy.   x
I := λx.      x
```

where:

-   S (Slider) slides z to between x and y (In most materials S is called Substitution, but in [Dana Scott](http://en.wikipedia.org/wiki/Dana_Scott)’s [presentation](https://www.youtube.com/watch?v=7cPtCpyBPNI) he called it Slider)
-   K (Killer) discards y (The same K in BCKW)
-   I (Id) returns x

Naturally, this is the C#, strongly typed:

```csharp
public static partial class SkiCombinators
{
    // S = x => y => z = x(z)(y(z))
    public static Func<Func<T1, T2>, Func<T1, TResult>> S<T1, T2, TResult>
        (Func<T1, Func<T2, TResult>> x) => y => z => x(z)(y(z));

    // K = x => _ => x
    public static Func<T2, T1> K<T1, T2>
        (T1 x) => _ => x;

    // I = x => x
    public static T I<T>
        (T x) => x;
}
```

Just like above BCKW system, the [SKI combinator calculus](http://en.wikipedia.org/wiki/SKI_combinator_calculus) takes the SKI combinators as primitives. It can be viewed as a reduced version of untyped [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus), and an extremely simple [Turing complete](http://en.wikipedia.org/wiki/Turing_complete) language.

### Boolean in SKI, and type issue

The same as lambda calculus, [Boolean](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans) would be the simplest thing to try first. Remember in lambda calculus:

```csharp
True := λt.λf.t
False := λt.λf.f
```

Here with SKI:

```csharp
K t f
≡ t

  S K t f
≡ K f (t f) 
≡ f
```

So in SKI calculus, True and False can be defined as:

```csharp
True := K
False := S K
```

If above C# SKI is used to implement True and False:

```csharp
// True = K
public static Func<object, object> True
    (object @true) => K<object, object>(@true);

// Cannot be compiled.
// False = S(K)
public static Func<object, object> False
    (object /* Func<object, object> */ @true) => @false => 
        S<object, object, object>(K<object, object>)(/* Func<object, object> */ @true)(@false);
```

False does not compile. Because in the strongly typed implementation, @true is expected to be a Func<object, object>, so that it can be applied to S as S’s second argument.

Again, as fore mentioned, SKI calculus is untyped. To “make” the above code compile, something is needed to have C# compiler forget @true’s type:

```csharp
// False = S(K)
public static Func<object, object> False
    (dynamic @true) => @false => S<object, object, object>(K<object, object>)(@true)(@false);
```

So, [dynamic](https://msdn.microsoft.com/en-us/library/dd264741.aspx) is the (untyped) way to [go](/posts/lambda-calculus-via-c-sharp-21-ski-combinator-calculus).