---
title: "Lambda Calculus via C# (8) Undecidability of Equivalence"
published: 2024-11-28
description: "All the previous parts demonstrated what  can do – defining functions to model the computing, applying functions to execute the computing"
image: ""
tags: ["C#", "C# 3.0", "Functional Programming", "Lambda Calculus", "LINQ via C# Series"]
category: "C#"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

All the previous parts demonstrated what [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus) can do – defining functions to model the computing, applying functions to execute the computing, implementing recursion, encoding data types and data structures, etc. Lambda calculus is a powerful tool, and it is Turing complete. This part discuss some interesting problem that cannot be done with lambda calculus – asserting whether 2 lambda expressions are equivalent.

Assuming f1 and f2 are 2 functions, they are equivalent if for ∀x, there is f1 x ≡ f2 x. For example, the following 2 functions can [alpha-convert](/posts/lambda-calculus-via-c-sharp-2-fundamentals-lambda-expression-variables-reductions) to each other:

```csharp
f1 := λx.Add x 1
f2 := λy.Add y 1
```

Apparently they are equivalent. And they are both equivalent to:

```csharp
f3 := λx.Add 1 x
```

because Add is commutative. [Undecidability of equivalence](http://en.wikipedia.org/wiki/Lambda_calculus#Undecidability_of_equivalence) means, in lambda calculus, there is no function can takes 2 lambda expressions as input, and returns True/False to indicate whether those 2 lambda expressions are equivalent or not. [Alonzo Church has a proof](http://www.joachim-breitner.de/various/ChurchTalk2011.pdf) using [normal form](http://en.wikipedia.org/wiki/Lambda_calculus#Normal_forms_and_confluence). An intuitive proof can be done by viewing equivalence problem as another version of [halting problem](http://en.wikipedia.org/wiki/Halting_problem). Actually, Alonzo Church’s publish on equivalence is earlier (April 1936) than Alan Turing’s publish on halting problem (May 1936). To make it simple, this part discusses the undecidability of halting problem first, then discuss the undecidability of equivalence.

## Halting problem

The halting problem is the problem of determining, when running an arbitrary program with an input, whether the program halts (finish running) or does not halt (run forever). For example:

-   Function Increase halts (finish running) with argument x, and returns x + 1.
-   Function [ω does not halt with argument ω](/posts/lambda-calculus-via-c-sharp-20-combinators), [Ω := ω ω reduces (runs) forever](/posts/lambda-calculus-via-c-sharp-20-combinators).

No general algorithm can solve the halting problem for all possible program-input pairs. To prove this, first define a simple function Sequence.

```csharp
Sequence := λa.λb.b
```

When applying Sequence, the [reduction strategy](http://en.wikipedia.org/wiki/Lambda_calculus#Reduction_strategies) matters. In normal order, both its first argument is never reduced. In this part, applicative order is always assumed - the same reduction strategy as C#. So Sequence can be viewed as - reduce (run) a then reduce (run) b sequentially, and return the reduction result of b. When applying Sequence with Ω and another lambda expression. It reduces forever in applicative order:

```csharp
Sequence Ω x
≡ Sequence (ω ω) x
≡ Sequence ((λx.x x) (λx.x x)) x
≡ Sequence ((λx.x x) (λx.x x)) x
≡ ...
```

Because Ω does not halt, Sequence Ω does not halt either. In C#:

```csharp
public static partial class Functions<T1, T2>
{
    public static readonly Func<T1, Func<T2, T2>> 
        Sequence = value1 => value2 => value2;
}
```

Assume an IsHalting function exists, which takes 2 parameters f and x, and returns True/False if function f halts/does not halt with parameter x:

```csharp
IsHalting := λf.λx.If (/* f halts with x */) (λx.True) (λx.False)
```

Then an IsNotHalting function can be defined to test whether function f does not halt with argument f (itself):

```csharp
IsNotHalting := λf.If (IsHalting f f) (λx.Sequence Ω False) (λx.True)
```

When a certain function f does not halt with itself, by definition IsNotHalting f returns True:

```csharp
IsNotHalting f
≡ If (IsHalting f f) (λx.Sequence Ω False) (λx.True))
≡ If (False) (λx.Sequence Ω False) (λx.True))
≡ True
```

Remember the If function is lazy, here λx.Sequence Ω False is never reduced. When f halts with itself, the application reduces to Sequence Ω False:

```csharp
IsNotHalting f
≡ If (IsHalting f f) (λx.Sequence Ω False) (λx.True))
≡ If (True) (λx.Sequence Ω False) (λx.True))
≡ Sequence Ω False
≡ Sequence (ω ω) False
≡ Sequence ((λx.x x) (λx.x x)) False
≡ Sequence ((λx.x x) (λx.x x)) False
≡ ...
```

As fore mentioned, Sequence Ω does not halt. So in this case, IsNotHalting f never returns False.

In C# IsHalting and IsNotHalting functions can be represented as:

```csharp
internal static class Halting<T, TResult>
{
    // IsHalting = f => x => True if f halts with x; otherwise, False
    internal static readonly Func<Func<T, TResult>, Func<T, Boolean>>
        IsHalting = f => x => throw new NotImplementedException();

    // IsNotHalting = f => If(IsHalting(f)(f))(_ => Sequence(Ω)(False))(_ => True)
    internal static readonly Func<SelfApplicableFunc<TResult>, Boolean>
        IsNotHalting = f =>
            If(Halting<SelfApplicableFunc<TResult>, TResult>.IsHalting(new Func<SelfApplicableFunc<TResult>, TResult>(f))(f))
                (_ => Functions<TResult, Boolean>.Sequence(OmegaCombinators<TResult>.Ω)(False))
                (_ => True);
}
```

Here since f can be applied with itself, it is represented with the SelfApplicableFunc<TResult> function type.

It is interesting when IsNotHalting is applied with argument IsNotHalting (itself). Assume IsNotHalting halts with IsNotHalting, in another word:

```csharp
IsHalting IsNotHalting IsNotHalting
≡ True
```

then there is:

```csharp
IsNotHalting IsNotHalting
≡ If (IsHalting IsNotHalting IsNotHalting) (λx.Sequence Ω False) (λx.True)
≡ If (True) (λx.Sequence Ω False) (λx.True)
≡ Sequence Ω False
≡ Sequence (ω ω) False
≡ Sequence ((λx.x x) (λx.x x)) False
≡ Sequence ((λx.x x) (λx.x x)) False
≡ ...
```

So IsNotHalting IsNotHalting is reduced to Sequence Ω False, and is then reduced forever, which means actually IsNotHalting does not halt with IsNotHalting.

On the other hand, Assume IsNotHalting does not halt with IsNotHalting, in another word:

```csharp
IsHalting IsNotHalting IsNotHalting
≡ False
```

then there is:

```csharp
IsNotHalting IsNotHalting
≡ If (IsHalting IsNotHalting IsNotHalting) (λx.Sequence Ω False) (λx.True)
≡ If (False) (λx.Sequence Ω False) (λx.True)
≡ True
```

So IsNotHalting IsNotHalting is reduced to True, which means IsNotHalting halts with IsNotHalting.

Therefore, if IsHalting exists, it leads to IsNotHalting with the following properties:

-   If IsNotHalting halts with IsNotHalting, then IsNotHalting does not halt with IsNotHalting
-   If IsNotHalting does not halt with IsNotHalting, then IsNotHalting halts with IsNotHalting.

This proves IsNotHalting and IsHalting cannot exist.

## Equivalence problem

After understanding the halting problem, the equivalence problem becomes very easy to prove. Assume an AreEquivalent function exists:

```csharp
AreEquivalent := λa.λb.If (/* a and b are equivalent */) (λx.True) (λx.False)
```

which takes 2 lambda expression as parameter, and returns True/False if they are/are not equivalent. Now define the following 2 functions:

```csharp
GetTrue1 := λf.λx.λy.Sequence (f x) True
GetTrue2 := λf.λx.λy.True
```

Given arbitrary function f and its argument x:

```csharp
GetTrue1 f x
≡ λy.Sequence (f x) True

  GetTrue2 f x
≡ λy.True
```

For specified f and x:

-   if f halts with x, then, ∀y, (GetTrue1 f x y) and (GetTrue2 f x y) both always returns True. That is, partially applied functions GetTrue1 f x and GetTrue2 f x are equivalent.
-   if f does not halt with x, then, ∀y, (GetTrue1 f x y) never returns True, and (GetTrue2 f x y) always returns True. That is, partially applied functions (GetTrue1 f x) and (GetTrue2 f x) are not equivalent.

Now halting problem and equivalence problem are connected. IsHalting function can be directly defined by AreEquivalent function:

```csharp
IsHalting := λf.λx.AreEquivalent (GetTrue1 f x) (GetTrue2 f x)
```

The partial application (GetTrue1 f x) and (GetTrue2 f x) can be substituted as:

```csharp
IsHalting := λf.λx.AreEquivalent (λy.Sequence (f x) True) (λy.True)
```

In C#:

```csharp
internal static class Equivalence<T, TResult>
{
    // IsEquivalent = f1 => f2 => True if f1 and f2 are equivalent; otherwise, False
    internal static readonly Func<Func<T, TResult>, Func<Func<T, TResult>, Boolean>>
        IsEquivalent = f1 => f2 => throw new NotImplementedException();

    // IsHalting = f => x => IsEquivalent(_ => Sequence(f(x))(True))(_ => True)
    internal static readonly Func<Func<T, TResult>, Func<T, Boolean>>
        IsHalting = f => x => Equivalence<T, Boolean>.IsEquivalent(_ => Functions<TResult, Boolean>.Sequence(f(x))(True))(_ => True);
}
```

If the above AreEquivalent function can be defined, then IsHalting can be defined. It is already approved that IsHalting cannot exist, so AreEquivalent cannot exist either. This demonstrates equivalence problem is just another version of halting problem. So, lambda expressions’ equivalence is undecidable. The undecidability is actually a very general topic in computability theory and mathematical logic. The undecidability of halting problem and lambda calculus’ undecidability of equivalence are examples of [Rice's theorem](http://en.wikipedia.org/wiki/Rice%27s_theorem), and also examples of [Kurt Gödel](http://en.wikipedia.org/wiki/Kurt_G%C3%B6del)'s [incompleteness theorems](http://en.wikipedia.org/wiki/G%C3%B6del's_incompleteness_theorems).