---
title: "Lambda Calculus via C# (1) Fundamentals - Closure, Currying and Partial Application"
published: 2018-11-01
description: "C#  is discussed in detail used everywhere in the . This post and the follo"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-c-1-fundamentals](/posts/lambda-calculus-via-c-1-fundamentals "https://weblogs.asp.net/dixin/lambda-calculus-via-c-1-fundamentals")**

C# [lambda expression](/posts/understanding-csharp-3-0-features-6-lambda-expression) is discussed in detail used everywhere in the [LINQ via C# series](/posts/linq-via-csharp). This post and the following few posts will focus on functions and disregard lambda expression for [expression tree](/posts/understanding-linq-to-sql-3-expression-tree). These articles will be a deeper dive about [lambda expression](/posts/understanding-csharp-3-0-features-6-lambda-expression) and [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus) - how it comes, what it does, and [why it matters](http://www.cs.kent.ac.uk/people/staff/dat/miranda/whyfp90.pdf). And - functions and anonymous functions will always be the only primitive.

## About lambda calculus (λ-calculus)

[![Lambda-Calculus](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Lambda-Calculus-via-C-1_CA43/Lambda-Calculus_3.png "Lambda-Calculus")](http://www.spreadshirt.com/lambda-calculus-college-t-shirt-C3376A5017163#/detail/5017163T812A231PC121706255PA1663)

[Lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus) is a formal system to use functions and function application to express computation. Lambda calculus is [Turing complete](http://en.wikipedia.org/wiki/Turing_completeness).

In C#, lambda is a fancy feature introduced in 3.0. Actually it is introduced as early as 1930s by [Alonzo Church](http://en.wikipedia.org/wiki/Alonzo_Church), the doctoral advisor of [Alan Turing](http://en.wikipedia.org/wiki/Alan_Turing). Later Alan Turing showed Turing machines equated the lambda calculus in expressiveness. This series will try to use C# functions to demonstrate how lambda expressions model the computation.

[![4889071497_7ee9f43a08_b](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Lambda-Calculus-via-C-1-Fundamental---Cl_1274C/4889071497_7ee9f43a08_b_3.jpg "4889071497_7ee9f43a08_b")](https://www.flickr.com/photos/52298759@N04/4889071497)

## Closure

All stories can start with a simple concept, [closure](http://en.wikipedia.org/wiki/Closure_\(computer_programming\)). Closure has been explained when discussing C# features in a previous chapter. It is actually a general concept that, in lambda calculus, any function can reference a [non-local variable](https://en.wikipedia.org/wiki/Non-local_variable),

## Currying and partial application

Looking at this simple function:
```
Func<int, int, int> add = 
    (x, y) => x + y;
```

Straightforward. It represents an algorithm to add 2 integers. In C#, it is a function of type Func<int, int, int>.

-   The function takes 2 integer parameters as input (on the left side of =>)
-   The function returns the sum of those 2 integers as output (on the right side of =>).

Since C# supports closure and higher-order function, above function can be tweaked a little bit:
```
Func<int, Func<int, int>> curriedAdd =
    x => new Func<int, int>(y => x + y);
```

It represents an algorithm which eventually still adds 2 integers. The different is:

-   The function takes 1 integer parameter as input (on the left side of first =>)
-   The function returns a function as output (on the right side of first =>).
    -   The returned function takes 1 integer parameter as input (on the left side of second =>)
    -   The returned function the sum of those 2 integers as output (on the left side of second =>). Here x + y uses closure to reference x, which is out of the returned function (y => x + y).

In C# the returned function’s type declaration, new Func<int, int>(…), can be inferred by compiler. So it can be written cleaner:
```
Func<int, Func<int, int>> curriedAdd =
    x => y => x + y;
```

The add function’s application is also straightforward :
```
int result = add(1, 2);
```

or just keep the code in lambda style - function should be anonymous without name:
```
result = new Func<int, int, int>((x, y) => x + y)(1, 2);
```

The second function’s application is different:
```
Func<int, int> add1 = curriedAdd(1); // Or: new Func<int, Func<int, int>>(x => y => x + y)(1);
// Now add1 is s closure: y => 1 + y.
result = add1(2);
```

So after the function transforming, the function application add(1, 2) becomes curriedAdd(1)(2). This approach, to transform a function with 2 parameters into a sequence of 2 functions where each function has 1 parameter, is called [currying](http://en.wikipedia.org/wiki/Currying). The application of one argument to a curried function, is called [partial application](http://en.wikipedia.org/wiki/Partial_application).

Similarly, the following function with 3 parameters:
```
Func<int, int, int, int> add = (x, y, z) => x + y + z;
int result = add(1, 2, 3);
```

can be curried as:
```
Func<int, Func<int, Func<int, int>>> curriedAdd = x => y => z => x + y + z;
```

and the curried function can be partially applied:
```
Func<int, Func<int, int>> add1 = curriedAdd(1); // add1 is a closure: y => z => 1 + y + z
Func<int, int> add3 = add1(2); // add3 is a closure: z => 1 + 2 + z
result = add3(3);
// Or just:
result = curriedAdd(1)(2)(3);
```

More generally, any function with N parameters:
```
Func<T1, T2, …, TN, TResult> function = (arg1, arg2, …, argN) => result;
```

can be curried into a function sequence of N functions, and each function has 1 parameter:
```
Func<T1, Func<T2, …, Func<TN, TResult>…>> curriedFunction = arg1 => arg2 => … => argN => result;
```

This can be implemented with some Curry() extension methods:
```
public static partial class FuncExtensions
{
    // from arg => result
    // to () => arg => result
    public static Func<Func<T, TResult>> Curry<T, TResult>
        (this Func<T, TResult> function) => 
            () => arg => function(arg);

    // from (arg1, arg2) => result
    // to arg1 => arg2 => result
    public static Func<T1, Func<T2, TResult>> Curry<T1, T2, TResult>
        (this Func<T1, T2, TResult> function) => 
            arg1 => arg2 => function(arg1, arg2);

    // from (arg1, arg2, arg3) => result
    // to arg1 => arg2 => arg3 => result
    public static Func<T1, Func<T2, Func<T3, TResult>>> Curry<T1, T2, T3, TResult>
        (this Func<T1, T2, T3, TResult> function) => 
            arg1 => arg2 => arg3 => function(arg1, arg2, arg3);

    // from (arg1, arg2, arg3, arg4) => result
    // to arg1 => arg2 => arg3 => arg4 => result
    public static Func<T1, Func<T2, Func<T3, Func<T4, TResult>>>> Curry<T1, T2, T3, T4, TResult>
        (this Func<T1, T2, T3, T4, TResult> function) => 
            arg1 => arg2 => arg3 => arg4 => function(arg1, arg2, arg3, arg4);

    // ...
}
```

With the same idea as currying, we can also partially apply a function with multiple parameters:
```
public static partial class FuncExtensions
{
    public static Func<TResult> Partial<T, TResult>(
        this Func<T, TResult> function, T arg)
    {
        return () => function(arg);
    }

    public static Func<T2, TResult> Partial<T1, T2, TResult>(
        this Func<T1, T2, TResult> function, T1 arg1)
    {
        return arg2 => function(arg1, arg2);
    }

    public static Func<T2, Func<T3, TResult>> Partial<T1, T2, T3, TResult>(
        this Func<T1, T2, T3, TResult> function, T1 arg1)
    {
        return arg2 => arg3 => function(arg1, arg2, arg3);
    }

    public static Func<T2, Func<T3, Func<T4, TResult>>> Partial<T1, T2, T3, T4, TResult>(
        this Func<T1, T2, T3, T4, TResult> function, T1 arg1)
    {
        return arg2 => arg3 => arg4 => function(arg1, arg2, arg3, arg4);
    }

    // ...
}
```

For example:
```
Func<int, int, int, int> add = (x, y, z) => x + y + z;
var add4 = add.Partial(4); // add4 is a closure: y => z => 4 + y + z
int result = add.Partial(1)(2)(3);
// is a short cut of:
result = add.Curry()(1)(2)(3);
```

The name "currying" is introduced by [Christopher Strachey](http://en.wikipedia.org/wiki/Christopher_Strachey) in 1967. It is the last name of [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry).

All the later parts of lambda calculus will focus on curried functions (1 parameter function or function sequence). Currying may cause some noise for [type inference in C#](/posts/understanding-csharp-3-0-features-3-type-inference), which will be demonstrated in a later part of Church pair (2-tuple).

## Uncurry

Just for fun purpose - a sequence of 1 parameter functions can also be uncurried to a function with multiple parameters too:
```
public static partial class FuncExtensions
{
    // from () => arg => result
    // to arg => result
    public static Func<T, TResult> Uncurry<T, TResult>
        (this Func<Func<T, TResult>> function) => 
            arg => function()(arg);

    // from arg1 => arg2 => result
    // to (arg1, arg2) => result
    public static Func<T1, T2, TResult> Uncurry<T1, T2, TResult>
        (this Func<T1, Func<T2, TResult>> function) => 
            (arg1, arg2) => function(arg1)(arg2);

    // from arg1 => arg2 => arg3 => result
    // to (arg1, arg2, arg3) => result
    public static Func<T1, T2, T3, TResult> Uncurry<T1, T2, T3, TResult>
        (this Func<T1, Func<T2, Func<T3, TResult>>> function) => 
            (arg1, arg2, arg3) => function(arg1)(arg2)(arg3);

    // from arg1 => arg2 => arg3 => arg4 => result
    // to (arg1, arg2, arg3, arg4) => result
    public static Func<T1, T2, T3, T4, TResult> Uncurry<T1, T2, T3, T4, TResult>
        (this Func<T1, Func<T2, Func<T3, Func<T4, TResult>>>> function) => 
            (arg1, arg2, arg3, arg4) => function(arg1)(arg2)(arg3)(arg4);

    // ...
}
```

## \=> associativity

From above code, the C# lambda operator (=>) is apparently [right-associative](http://en.wikipedia.org/w/index.php?title=Right-associative&redirect=no):
```
x => y => x + y
```

is identical to:
```
x => (y => x + y)
```

Or generally:
```
Func<T1, Func<T2, …, Func<TN, TResult>…>> curriedFunction = arg1 => arg2 => … => argN => result;
```

is identical to:
```
Func<T1, Func<T2, …, Func<TN, TResult>…>> curriedFunction = arg1 => (arg2 => … => (argN => result)…);
```

This is the same associativity as the [type constructor →](http://en.wikipedia.org/wiki/Type_constructor) in [typed lambda calculus](http://en.wikipedia.org/wiki/Simply_typed_lambda_calculus).

In some functional languages, functions are curried by default, like F#:
```
let f1: int -> int -> int = fun x y -> x + y
```

fun x y -> … looks like a function definition with multiple parameters, but it is curried as int -> int -> int. This function works similar as:
```
let f2: int -> (int -> int) = fun x -> fun y -> x + y
```

And this is how to create an uncurried function with multiple parameters in F#:
```
let f3: int * int -> int = fun (x, y) -> x + y
```

Here multiple parameters are implemented with a tuple of int and int.

In other functional languages, like [Haskell](http://en.wikipedia.org/wiki/Haskell_\(programming_language\)) (that is the first name of [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry)), functions are always curried.