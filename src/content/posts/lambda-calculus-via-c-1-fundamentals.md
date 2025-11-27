---
title: "Lambda Calculus via C# (1) Fundamentals"
published: 2024-11-01
description: "Lambda calculus (aka λ-calculus) is a theoretical framework to describe function definition, function application, function recursion, and uses functions and function application to express computatio"
image: ""
tags: ["LINQ via C#", "C#", ".NET", "Lambda Calculus", "Functional Programming"]
category: "LINQ via C#"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

Lambda calculus (aka λ-calculus) is a theoretical framework to describe function definition, function application, function recursion, and uses functions and function application to express computation. It is a mathematics formal system, but can also be viewed as a smallest programming language that can express and evaluate any computable function. As an universal model of computation, lambda calculus is important in programming language theory, and especially it is the foundation of functional programming. The knowledge of lambda calculus greatly helps understanding functional programming, LINQ, C# and other functional languages.

[![Lambda-Calculus](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Lambda-Calculus-via-C-1_CA43/Lambda-Calculus_3.png "Lambda-Calculus")](http://www.spreadshirt.com/lambda-calculus-college-t-shirt-C3376A5017163#/detail/5017163T812A231PC121706255PA1663)

## Expression

The core concept of lambda calculus is expression. There are 3 kinds of expressions in lambda calculus: variable, function, application. Expression can be [defined recursively](http://en.wikipedia.org/wiki/Recursive_definition):

-   If v is a variable, then v is expression
-   If v is a variable and E is expression, then function λv.E is expression. The function syntax λv.E can be viewed as the the C# anonymous function syntax v => E, where v is the parameter and E is the function body expression.
-   If E1 is expression and E2 is expression, then E1 E2 is expression, which is called application. The application syntax E1 E2 can be viewed as C# function call syntax E1(E2), where E1 is the function definition expression and E2 is the argument expression.

By default, lambda calculus treat function anonymously. There is only variable name in lambda calculus. There is no function name involved in function definition expression. In C# language, lambda expression representing anonymous function is a feature introduced in C# 3.0 with .NET Framework 3.5 years back. Actually the theory of lambda expression and lambda calculus were introduced as early as 1930s by [Alonzo Church](http://en.wikipedia.org/wiki/Alonzo_Church), a mathematician and the doctoral advisor of [Alan Turing](http://en.wikipedia.org/wiki/Alan_Turing).

The following are [conventions](http://en.wikipedia.org/wiki/Lambda_calculus#Notation) of expression:

-   Outermost parentheses can be dropped, e.g. E1 E2 means (E1 E2), in C# it can be viewed as (E1(E2)): call function E1 with argument E2
-   A sequence of functions is contracted: , e.g. sequence of function λx.(λy.(λz.E)) is contracted as λxyz.E, in another word, expression λxyz.E actually means λx.(λy.(λz.E)), which is identical to λx.λy.λz.E because the parentheses are not required. In C# it can be viewed that (x, y, z) => E is always curried to x => (y => (z => E)), which is identical to x => y => z => E because => operator is right associative
-   Application is left associative, e.g. E1 E2 E3 means ((E1 E2) E3), in C# it can be viewed as ((E1(E2))(E3)): call function E1 with argument E2, then call the returned function with argument E3

### Bound variable vs. free variable

In function, its body expression can use variables. There are 2 kinds of variables used in function body expression, [bound variable and free variable](http://en.wikipedia.org/wiki/Lambda_calculus#Free_and_bound_variables):

-   When function’s variable (variables before . symbol) occurs in the function body expression, these these variable occurrences (after the . symbol) are bound variables. In C# this can be viewed as declared function parameter’s occurrences in function body.
-   All other variables are free variables, in C# it can be viewed as outer variable or closure.

For example, for function λx.f x, its body expression f x has bound variable x, and free variable f. This can be viewed as x => f(x) in C# syntax, in the body x is parameter and f is closure.

A variable is bound by its "nearest" function. For example, in λx.g x (λx.h x), the first occurrence of x in the body expression is bound by the outer function, and the second occurrence of x is bound by the inner function. In C#, x => g(x)(x => h(x)) cannot be compiled for this reason - the outer function parameter has the same name as the inner function parameter, which is disallowed by C# compiler:
```
internal static class Expression
{
    internal static Func<T, T> Variable<T>(Func<T, Func<Func<T, T>, T>> g, Func<T, T> h) => 
        x => g(x)(x => h(x));
}
```

Expression without free variables are also called combinator, which will be discussed later.

## Reduction

In lambda calculus, there are 3 substitution rules for expression to be [reduced](http://en.wikipedia.org/wiki/Lambda_calculus#Reduction).

### α-conversion

In lambda calculus, lambda expression’s bound variables can be substituted with different name. This is called [alpha-conversion, or alpha-renaming](http://en.wikipedia.org/wiki/Lambda_calculus#.CE.B1-conversion). In C#, this can be viewed as function parameter can be renamed, for example, x => f(x) is equivalent to y => f(y).

In the above example of λx.g x (λx.h x), the inner function λx.h x has variable x, which can be substituted with a different name y, along with its appearance in the body h x. Then the inner function becomes λy.h y, so the outer function becomes λx.g x (λy.h y). Now it becomes intuitive how x and y are bound by the “nearest” function. In C#, x => g(x)(y => h(y)) can be compiled:
```
internal static Func<T, T> Variable<T>(Func<T, Func<Func<T, T>, T>> g, Func<T, T> h) => 
    x => g(x)(y => h(y));
```

### β-reduction

[Beta-reduction](http://en.wikipedia.org/wiki/Lambda_calculus#.CE.B2-reduction) of function application expression (λv.E) R is denoted E\[v := R\]. It means to [substitute](http://en.wikipedia.org/wiki/Lambda_calculus#Substitution) all free occurrences of the variable v in the expression E with expression R. In C#, this can be viewed as when function is called with argument, in the body all parameter occurrences are substituted by argument. For Example, when function x => x + 2 is called with 1, in the body x + 2, parameter x is substituted with argument 1, so the function is evaluated to 1 + 2.

### η-conversion

[Eta-conversion](http://en.wikipedia.org/wiki/Lambda_calculus#.CE.B7-conversion) means 2 functions are the same [if and only if](http://en.wikipedia.org/wiki/If_and_only_if) they always give the same result for the same argument. For example λx.f x can be substituted with f, if x does not appear free in f. In C#, this can be viewed as that function x => f(x) is equivalent to function f. For example:
```
internal static void LinqQuery()
{
    Func<int, bool> isEven = value => value % 2 == 0;
    Enumerable.Range(0, 5).Where(value => isEven(value)).ForEach(value => Console.WriteLine(value));
}
```

Here function value => isEven(value) and function isEven always have the same result for the same argument, so value=> isEven(value) can be substituted with isEven. Similarly value => Console.WriteLine(value) can be substituted by Console.WriteLine. The above LINQ query is equivalent to:
```
internal static void EtaConvertion()
{
    Func<int, bool> isEven = value => value % 2 == 0;
    Enumerable.Range(0, 5).Where(isEven).ForEach(Console.WriteLine);
}
```

[![4889071497_7ee9f43a08_b](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Lambda-Calculus-via-C-1-Fundamental---Cl_1274C/4889071497_7ee9f43a08_b_3.jpg "4889071497_7ee9f43a08_b")](https://www.flickr.com/photos/52298759@N04/4889071497)

### Normal order

The above reduction rules can be applied to expression with different order. With normal order, the leftmost, outermost expression is reduced first. For function application expression, this means the function is beta reduced first, then the arguments are reduced, for example:
```
(λx.λy.y) ((λa.λb.a) (λv.v))
≡ λy.λy
```

In this expression, function (λx.λy.y) is applied with argument, expression ((λa.λb.a) (λv.v)). The leftmost, outermost expression is the function expression (λx.λy.y). So in its body λy.y, all free occurrences of x should be substituted by ((λa.λb.a) (λv.v)). And since there is no any occurrences of x, the substitution result is still λy.y. In normal order reduction, the argument expression ((λa.λb.a) (λv.v)) is not reduced at all.

Here λy.y cannot be further reduced. An expression that cannot be reduced any further with above 3 rules is called in normal form. Here λy.λy is the normal form of (λx.λy.y) ((λa.λb.a) (λv.v)). Some lambda expressions can be reduced infinitely so does not have normal form, which will be discussed later.

### Applicative order

With applicative order, the rightmost, innermost expression is reduced first. For function application expression, this means the arguments are reduced first, then the function is beta reduced. Take the above expression as example again:
```
(λx.λy.y) ((λa.λb.a) (λv.v))
≡ (λx.λy.y) (λb.λv.v)
≡ λy.λy
```

The argument expression ((λa.λb.a) (λv.v)) is righter than the function definition expression (λx.λy.y), so ((λa.λb.a) (λv.v)) is reduced first. It can be beta reduced to normal form (λb.λv.v), which cannot be further reduced. Then (λx.λy.y) is applied with (λb.λv.v), which can be beta reduced to normal form λy.λy. In application order reduction, argument must be reduced before function application. This is the strategy of C#.

In lambda calculus, reducing expression in any order produces the same result, which is the [Church–Rosser theorem](https://en.wikipedia.org/wiki/Church%E2%80%93Rosser_theorem).

## Function composition

In lambda calculus [function composition](http://en.wikipedia.org/wiki/Function_composition_\(computer_science\)) means to combine simple functions into a more complicated function, which can be viewed the same as fore mentioned C# function composition. The composition of f1 and f2 is denoted f2 ∘ f1. This new function (f2 ∘ f1)’s application is defined as:
```
(f2 ∘ f1) x := f2 (f1 x)
```

Here the function names f1 and f2 indicate the order of being applied. f2 ∘ f1 can also be read as f2 after f1. in C#, this can be viewed as the forward composition discussed before:
```
public static partial class FuncExtensions
{
    public static Func<T, TResult2> After<T, TResult1, TResult2>(
        this Func<TResult1, TResult2> function2, Func<T, TResult1> function1) =>
            value => function2(function1(value));
}
```

As fore mentioned, some other functional languages have built in composition operator for functions, like >> in F#, . in Haskell, etc. C# does not support defining custom operators for functions. As a workaround, an extension method o can be defined to represent this ∘ operator:
```
public static Func<T, TResult2> o<T, TResult1, TResult2>(
    this Func<TResult1, TResult2> function2, Func<T, TResult1> function1) =>
        value => function2(function1(value));
```

So that f3 ∘ f2 ∘ f1 becomes f3.o(f2).o(f1) in C#, which is more intuitive, for example:
```
internal static void Compose()
{
    Func<double, double> sqrt = Math.Sqrt;
    Func<double, double> abs = Math.Abs;

    Func<double, double> absSqrt1 = sqrt.o(abs); // Composition: sqrt after abs.
    absSqrt1(-2D).WriteLine(); // 1.4142135623731
}
```

### Associativity

Function composition is [associative](http://en.wikipedia.org/wiki/Associative). That means (f3 ∘ f2) ∘ f1 and f3 ∘ (f2 ∘ f1) are equivalent.

When applying x to (f3 ∘ f2) ∘ f1, according to the definition of ∘:
```
((f3 ∘ f2) ∘ f1) x
≡ (f3 ∘ f2) (f1 x)
≡ f3 (f2 (f1 x))
```

And when applying x to f3 ∘ (f2 ∘ f1):
```
f3 ∘ (f2 ∘ f1) x
≡ f3 ∘ (f2 (f1 x))
≡ f3 (f2 (f1 x))
```

In C#, this means f3.o(f2).o(f1) and f3.o(f2.o(f1)) are equivalent:’
```
internal static void Associativity()
{
    Func<double, double> sqrt = Math.Sqrt;
    Func<double, double> abs = Math.Abs;
    Func<double, double> log = Math.Log;

    Func<double, double> absSqrtLog1 = log.o(sqrt).o(abs); // Composition: (log o sqrt) o abs.
    absSqrtLog1(-2D).WriteLine(); // 0.34642256747438094
    Func<double, double> absSqrtLog2 = log.o(sqrt.o(abs)); // Composition: log o (sqrt o abs).
    absSqrtLog2(-2D).WriteLine(); // 0.34642256747438094
}
```

### Unit

There is a unit function Id for function composition:
```
Id := λx.x
```

so that f ∘ Id and Id ∘ f are both equivalent to f:
```
f ∘ Id = f
Id ∘ f = f
```

According to the definition of ∘ and Id:
```
(f ∘ Id) x
≡ f (Id x)
≡ f x

  (Id ∘ f) x
≡ Id (f x)
≡ f x
```

In C#, Id can be defined as:
```
// Unit<T> is the alias of Func<T, T>.
public delegate T Unit<T>(T value);

public static partial class Functions<T>
{
    public static readonly Unit<T>
        Id = x => x;
}
```

Here function expression (λx.x) is given a name Id, this is only for readability. Later, when refereeing to this function, its name Id will used, which is more intuitive than the lambda expression.