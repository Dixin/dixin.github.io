---
title: "Lambda Calculus via C# (23) Y Combinator, And Divide"
published: 2018-11-23
description: "p is the ) of function F :"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-7-fixed-point-combinator-and-recursion](/posts/lambda-calculus-via-csharp-7-fixed-point-combinator-and-recursion "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-7-fixed-point-combinator-and-recursion")**

## Fix point

p is the [fixed point](http://en.wikipedia.org/wiki/Fixed_point_\(mathematics\)) of function F [if and only if](http://en.wikipedia.org/wiki/If_and_only_if):
```
p
≡ F p
```

The following picture is stolen from [Wikipedia](http://en.wikipedia.org/wiki/Fixed_point_\(mathematics\)#mediaviewer/File:Fixed_point_example.svg):

![](http://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Fixed_point_example.svg/220px-Fixed_point_example.svg.png)

A simple example:

F := 0 - x

has a fixed point 0:
```
0
≡ F 0
```

The above fixed point definition also leads to:
```
p
≡ F p
≡ F (F p)
≡ ...
≡ F (F (F … (F p) …))
```

## Fixed point combinator

In lambda calculus and combinatory logic, [Y combinator](http://en.wikipedia.org/wiki/Fixed-point_combinator#Fixed_point_combinators_in_lambda_calculus) is a [fixed point combinator](http://en.wikipedia.org/wiki/Fixed_point_combinator):
```
Y := λf.(λx.f (x x)) (λx.f (x x))
```

It is called so because it calculates a function F’s fixed point Y F.

According to the above definition of fixed point p ≡ F p, there is:
```
(Y F)
≡ F (Y F)
```

Proof:
```
Y F
≡ (λf.(λx.f (x x)) (λx.f (x x))) F
≡ (λx.F (x x)) (λx.F (x x))
≡ F ((λx.F (x x)) (λx.F (x x)))
≡ F (Y F)
```

Y combinator was discovered by [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry).

[![y_combinator](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3c3b4cb86227_12489/y_combinator_1.jpg "y_combinator")](http://matt.might.net/articles/compiling-up-to-lambda-calculus/)

As a fixed point combinator, Y also has the same property of:
```
Y F
≡ F (Y F)
≡ F (F (Y F))
≡ ...
≡ F (F (F … (F (Y F)) …))
```

So Y can be used to implement [recursion](http://en.wikipedia.org/wiki/Recursion_\(computer_science\)).

[![390px-Knights_of_the_Lambda_Calculus.svg](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/3c3b4cb86227_12489/390px-Knights_of_the_Lambda_Calculus.svg_3.png "390px-Knights_of_the_Lambda_Calculus.svg")](http://en.wikipedia.org/wiki/Knights_of_the_Lambda_Calculus)

And this is Y in SKI:
```
Y2 := S (K (S I I)) (S (S (K S) K) (K (S I I)))
```

or just in SK:
```
Y3 := S S K (S (K (S S (S (S S K)))) K)
```

And in C#:
```
public delegate Func<T, TResult> Recursion<T, TResult>(Recursion<T, TResult> f);

public static class YCombinator
{
    // Y = λf.(λx.f(x x)) (λx.f(x x))
    // Y = f => (λx.f(x x)) (λx.f(x x))
    // Y = f => (x => f(x(x)))(x => f(x(x)))
    // Y = (x => arg => f(x(x))(arg))(x => arg => f(x(x))(arg))
    public static Func<T, TResult> Y<T, TResult>
        (Func<Func<T, TResult>, Func<T, TResult>> f) => 
            new Recursion<T, TResult>(x => arg => f(x(x))(arg))(x => arg => f(x(x))(arg));
}
```

## Recursion

As explaned in [the part of Church numeral arithmetic](/posts/lambda-calculus-via-c-sharp-11-predicates-and-divide), recursion cannot be implemented directly in lambda calculus.

### Example - factorial

The [factorial](http://en.wikipedia.org/wiki/Factorial) function can be intuitively implemented by recursion. In C#:
```
Func<uint, uint> factorial = null; // Must have. So that factorial can recursively refer itself.
factorial = x => x == 0U ? 1U : factorial(x - 1U);
```

But in lambda calculus:
```
λn.If (IsZero n) (λx.1) (λx.Self (Decrease n))
```

An anonymous function cannot directly refer itself by its name in the body.

With Y, the solution is to create a helper to pass “the algorithm itself” as a parameter. So:
```
FactorialHelper := λf.λn.If (IsZero n) (λx.1) (λx.f (Decrease n))
```

Now Y can be applied with the helper:
```
Y FactorialHelper n
```

So:
```
Factorial := Y FactorialHelper
           ≡ Y (λf.λn.If (IsZero n) (λx.1) (λx.f (Decrease n)))
```

In C# lambda calculus:
```
public static partial class _NumeralExtensions
{
    // Factorial = factorial => numeral => If(numeral.IsZero())(_ => One)(_ => factorial(numeral.Decrease()));
    public static Func<_Numeral, _Numeral> Factorial
        (Func<_Numeral, _Numeral> factorial) => numeral =>
            ChurchBoolean.If<_Numeral>(numeral.IsZero())
                (_ => One)
                (_ => factorial(numeral.Decrease()));

    public static _Numeral Factorial
        (this _Numeral numeral) => YCombinator.Y<_Numeral, _Numeral>(Factorial)(numeral);
}
```

### Example - Fibonacci

Another recursion example is [Fibonacci](http://en.wikipedia.org/wiki/Fibonacci_number):
```
Func<uint, uint> fibonacci = null; // Must have. So that fibonacci can recursively refer itself.
fibonacci = x => x > 1U ? fibonacci(x - 1U) + fibonacci(x - 2U) : x;
```

The recursion cannot be done in anonymous function either:
```
λn.If (IsGreater n 1) (λx.Add (Self (Subtract n 1)) (Self (Subtract n 2))) (λx.n)
```

The same solution can be used - create a helper to pass “the algorithm itself” as a parameter:
```
FibonacciHelper := λf.λn.If (IsGreater n 1) (λx.Add (f (Subtract n 1)) (f (Subtract n 2))) (λx.n)
```

Application to Y will be the same way too:
```
Y FibonacciHelper n
```

So:
```
Fibonacci := Y FibonacciHelper
           ≡ Y (λf.λn.If (IsGreater n 1) (λx.Add (f (Subtract n 1)) (f (Subtract n 2))) (λx.n))
```

C#:
```
public static partial class _NumeralExtensions
{
    // Fibonacci  = fibonacci  => numeral => If(numeral > One)(_ => fibonacci(numeral - One) + fibonacci(numeral - One - One))(_ => numeral);
    public static Func<_Numeral, _Numeral> Fibonacci
        (Func<_Numeral, _Numeral> fibonacci) => numeral =>
            ChurchBoolean.If<_Numeral>(numeral > One)
                (_ => fibonacci(numeral - One) + fibonacci(numeral - One - One))
                (_ => numeral);

    public static _Numeral Fibonacci
        (this _Numeral numeral) => YCombinator.Y<_Numeral, _Numeral>(Fibonacci)(numeral);
}
```

## DivideBy

In the [Church numeral arithmetic](/posts/lambda-calculus-via-c-sharp-11-predicates-and-divide), this (cheating) recursive \_DivideBy was temporarily used:
```
_DivideBy := λa.λb.If (IsGreaterOrEqual a b) (λx.Add One (_DivideBy (Subtract a b) b)) (λx.Zero)
```

Finally, with Y, a real DivideBy in lambda calculus can be defined:
```
DivideByHelper := λf.λa.λb.If (IsGreaterOrEqual a b) (λx.Add One (f (Subtract a b) b)) (λx.Zero)

DivideBy := Y DivideByHelper
          ≡ Y (λf.λa.λb.If (IsGreaterOrEqual a b) (λx.Add One (f (Subtract a b) b)) (λx.Zero))
```

Once again, just create a helper to pass itself as a parameter to implement recursion, as easy as Factorial and Fibonacci.

C#:
```
public static partial class _NumeralExtensions
{
    // DivideBy = divideBy => dividend => divisor => If(dividend >= divisor)(_ => One + divideBy(dividend - divisor)(divisor))(_ => Zero)
    public static Func<_Numeral, Func<_Numeral, _Numeral>> DivideBy
        (Func<_Numeral, Func<_Numeral, _Numeral>> divideBy) => dividend => divisor =>
            ChurchBoolean.If<_Numeral>(dividend >= divisor)
                (_ => One + divideBy(dividend - divisor)(divisor))
                (_ => Zero);

    public static _Numeral DivideBy
        (this _Numeral dividend, _Numeral divisor) =>
            YCombinator.Y<_Numeral, Func<_Numeral, _Numeral>>(DivideBy)(dividend)(divisor);
}
```

Notice a difference here: Factorial and Fibonacci both takes 1 parameter, but DivideBy takes 2 parameters - dividend, divisor. However, with [currying](/posts/lambda-calculus-via-c-sharp-1-fundamentals-closure-currying-and-partial-application), Y<T, TResult> can just be closed type Y<X, Func<Y, Z>>, so that this difference is nicely and easily handled.

## Unit tests

```csharp
[TestClass()]
public class _NumeralExtensionsTests
{
    [TestMethod()]
    public void FactorialTest()
    {
        Func<uint, uint> factorial = null; // Must have. So that factorial can recursively refer itself.
        factorial = x => x == 0U ? 1U : factorial(x - 1U);

        Assert.IsTrue(factorial(0U) == 0U._Church().Factorial());
        Assert.IsTrue(factorial(1U) == 1U._Church().Factorial());
        Assert.IsTrue(factorial(2U) == 2U._Church().Factorial());
        Assert.IsTrue(factorial(3U) == 3U._Church().Factorial());
        Assert.IsTrue(factorial(10U) == 10U._Church().Factorial());
    }

    [TestMethod()]
    public void FibonacciTest()
    {
        Func<uint, uint> fibonacci = null; // Must have. So that fibonacci can recursively refer itself.
        fibonacci = x => x > 1U ? fibonacci(x - 1U) + fibonacci(x - 2U) : x;

        Assert.IsTrue(fibonacci(0U) == 0U._Church().Fibonacci());
        Assert.IsTrue(fibonacci(1U) == 1U._Church().Fibonacci());
        Assert.IsTrue(fibonacci(2U) == 2U._Church().Fibonacci());
        Assert.IsTrue(fibonacci(3U) == 3U._Church().Fibonacci());
        Assert.IsTrue(fibonacci(10U) == 10U._Church().Fibonacci());
    }

    [TestMethod()]
    public void DivideByTest()
    {
        Assert.IsTrue(1U / 1U == (1U._Church().DivideBy(1U._Church())));
        Assert.IsTrue(1U / 2U == (1U._Church().DivideBy(2U._Church())));
        Assert.IsTrue(2U / 2U == (2U._Church().DivideBy(2U._Church())));
        Assert.IsTrue(2U / 1U == (2U._Church().DivideBy(1U._Church())));
        Assert.IsTrue(10U / 3U == (10U._Church().DivideBy(3U._Church())));
        Assert.IsTrue(3U / 10U == (3U._Church().DivideBy(10U._Church())));
    }
}
```