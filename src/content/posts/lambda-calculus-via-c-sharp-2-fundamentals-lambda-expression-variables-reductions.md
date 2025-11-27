---
title: "Lambda Calculus via C# (2) Fundamentals - Lambda Expression, Variables, Reductions"
published: 2018-11-02
description: "The C# lambda expression . This post will explain lambda expression and other concepts in lambda calculus."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-c-1-fundamentals](/posts/lambda-calculus-via-c-1-fundamentals "https://weblogs.asp.net/dixin/lambda-calculus-via-c-1-fundamentals")**

The C# lambda expression [has been discussed in detail](/posts/understanding-csharp-3-0-features-6-lambda-expression). This post will explain lambda expression and other concepts in lambda calculus.

## Lambda expression

In [lambda calculus](/archive/?tag=Lambda%20Calculus), the [syntax](http://en.wikipedia.org/wiki/Lambda_calculus#Definition) of lambda expressions are:

-   Variables v1, v2, …, vN
-   The abstraction symbols lambda (λ) and dot (.)
    -   For example, the C# lambda expression x => x + 1 will be λx.x + 1 in lambda calculus, except the C# specific type system (Int32, Int 64, …) does not exist in λx.x + 1.
-   Parentheses (), meaning higher precedence

In lambda calculus, the set of lambda expressions Λ, can be [defined recursively](http://en.wikipedia.org/wiki/Recursive_definition):

-   If x is a variable, then x ∈ Λ
-   If x is a variable and E ∈ Λ, then (λx.E) ∈ Λ (called a lambda abstraction, which defines a anonymous function)
    -   As fore-mentioned, λx.E is like x => E in C#
-   If M, N ∈ Λ, then (E1 E2) ∈ Λ (called an application)
    -   The bigger difference is, while in lambda calculus, function application does not require parentheses () for parameter, it is just E1 E2; In C# it must be E1(E2)

In lambda calculus, there are the [conventions](http://en.wikipedia.org/wiki/Lambda_calculus#Notation):

-   Outermost parentheses are dropped: E1 E2 instead of (E1 E2)
-   Applications are left associative: E1 E2 P may be written instead of ((E1 E2) P)
    -   Again, E1 E2 P or ((E1 E2) P) will be E1(E2)(P) in C#
-   The body of an abstraction extends [as far right as possible](http://en.wikipedia.org/wiki/Regular_expression#Lazy_quantification): λx.E1 E2 means λx.(E1 E2) and not (λx.E1) E2
    -   Here λx.E1 E2 will be x => E1(E2) in C#
-   A sequence of abstractions is contracted: λx.λy.λz.E is abbreviated as λxyz.E
    -   λx.λy.λz.E is x => y => z => E in C#
    -   λxyz.E is (x, y, z) => E in C#

## Bound and free variables

In lambda expression, λ or => means to bind its variable wherever it occurs in the body. So:

-   Variables within the scope of an abstraction are [bound variables](http://en.wikipedia.org/wiki/Lambda_calculus#Free_and_bound_variables).
-   All other variables are [free variables](http://en.wikipedia.org/wiki/Lambda_calculus#Free_and_bound_variables).

For example, in the lambda expression from part 1 - λx.x + y or x => x + y, x is bound variable and y is free variable.

A variable is bound by its "nearest" abstraction. For example, in λx.y (λx.z x):

-   The single occurrence of x in the expression is bound by the second lambda.
-   In C#, x => y(x => z(x)) does not compile, because the outer x variable conflicts with the inner x variable. This lambda expression must be rewritten as x => y(a => z(a)). now clearly the single occurrence of xx is bound by the second lambda. Here alpha-conversion is used, which will be explained later.

Lambda expression without free variables are called closed lambda expression, or combinator, which will be discussed later.

## Reductions

In lambda calculus, there are 3 ways that lambda expressions can be [reduced](http://en.wikipedia.org/wiki/Lambda_calculus#Reduction).

### α-conversion / alpha-conversion

In lambda calculus, lambda expression’s bound variables can be renamed. This is called [alpha-conversion, or alpha-renaming](http://en.wikipedia.org/wiki/Lambda_calculus#.CE.B1-conversion). This is also a [perfectly nature normal thing](http://www.bbc.co.uk/films/2003/08/08/american_pie_the_wedding_2003_review.shtml), just like in C# function or lambda expression’s parameter can be renamed freely.

In the above example of λx.y (λx.z x), the inner lambda expression λx.z x can be alpha-converted to λa.z a. Apparently it has nothing to do with the outer x.

### β-reduction / beta-reduction

[Beta-reduction](http://en.wikipedia.org/wiki/Lambda_calculus#.CE.B2-reduction) of ((λV.E) R) is E\[V := R\], which means to [substitute](http://en.wikipedia.org/wiki/Lambda_calculus#Substitution) all free occurrences of the variable V in the expression E with expression R. It is just function application. For example, in C#, when applying this function x => x + 1 with argument 2:

-   First parameter name x and the => operator are ditched.
-   Then in the body x + 1, x will be replaced by 2. So the result of function application is 2 + 1.

### η-conversion / eta-conversion

[Eta-conversion](http://en.wikipedia.org/wiki/Lambda_calculus#.CE.B7-conversion) means 2 functions are the same [if and only if](http://en.wikipedia.org/wiki/If_and_only_if) they give the same result for all arguments. It converts between λx.(f x) and f whenever x does not appear free in f. Here is an example in C#:

```csharp
Func<int, bool> isEven = x => x % 2 == 0;
Enumerable.Range(0, 5).Where(x => isEven(x)).ForEach(x => Console.WriteLine(x));
```

It can be reduced to:

```csharp
Enumerable.Range(0, 5).Where(isEven).ForEach(Console.WriteLine);
```

Here x => isEven(x) and isEven are the same, and x => Console.WriteLine(x) and Console.WriteLine are the same too (C# compiler will pickup the right overload - Console.WriteLine(int value)).

[Different reduction order](http://en.wikipedia.org/wiki/Lambda_calculus#Reduction_strategies) can be applied to the same lambda expression and have [different impact](http://en.wikipedia.org/wiki/Evaluation_strategy). This will be demonstrated in [a later part](/posts/lambda-calculus-via-c-sharp-6-if-logic-and-reduction-strategies).

[![4889071497_7ee9f43a08_b](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Lambda-Calculus-via-C-1-Fundamental---Cl_1274C/4889071497_7ee9f43a08_b_3.jpg "4889071497_7ee9f43a08_b")](https://www.flickr.com/photos/52298759@N04/4889071497)