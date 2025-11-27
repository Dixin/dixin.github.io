---
title: "C# Functional Programming In-Depth (8) Higher-order Function, Currying and First Class Function"
published: 2019-06-08
description: "The delegate chapter and other previous chapters have demonstrated that in C#, function supports many operations that are available for object. This chapter discusses one more aspect, higher-order fun"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# 6.0", "C# Features", "Functional C#", "Functional Programming", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

The delegate chapter and other previous chapters have demonstrated that in C#, function supports many operations that are available for object. This chapter discusses one more aspect, higher-order function, and how it and other functional features make function the first-class citizen in C# language.

## First-order function and higher-order function

Higher-order function is a function that accept one or more function parameters as input, or output a function. In contrast, function does not input or output any function is called first-order function. C# supports higher-order function from the beginning, because C# function can have almost any data type and function type as its input and output, except:

· Static classes, like System.Convert, System.Math, etc., because they cannot be instantiated.

· Special type System.Void.

This chapter use the following simple data type and simple function type for demonstration:

internal partial class Data

```csharp
{
```
```csharp
internal Data(int value) => this.Value = value;
```

```csharp
internal int Value { get; }
```
```csharp
}
```

```csharp
// () -> void.
```

internal delegate void Function();

A first-order function can have normal data value as input and output:

internal static void CallFirstOrderFunction()

```csharp
{
```
```csharp
Data FirstOrderFunction(Data value) { return value; }
```

```csharp
Data input = default;
```
```csharp
Data output = FirstOrderFunction(input);
```

}

If a function has function as input and output, it is a higher-order function:

internal static void CallNamedHigherOrderFunction()

```csharp
{
```
```csharp
Function NamedHigherOrderFunction(Function value) { return value; }
```

```csharp
Function input = default;
```
```csharp
Function output = NamedHigherOrderFunction(input);
```

}

Above example is a named higher-order function. Anonymous higher-order functions can also be easily defined with lambda expression:

internal static void CallAnonymousHigherOrderFunction()

```csharp
{
```
```csharp
Action firstOrder1 = () => nameof(firstOrder1).WriteLine();
```
```csharp
Func<int> firstOrder2 = () => 1;
```

```csharp
// (() -> void) -> void
```
```csharp
// Input: function of type () -> void. Output: void.
```
```csharp
Action<Action> higherOrder1 = action => action();
```
```csharp
higherOrder1(firstOrder1); // firstOrder1
```
```csharp
higherOrder1(() => nameof(higherOrder1).WriteLine()); // higherOrder1
```

```csharp
// () -> (() -> int)
```
```csharp
// Input: none. Output: function of type () -> int.
```
```csharp
Func<Func<int>> higherOrder2 = () => firstOrder2;
```
```csharp
Func<int> output2 = higherOrder2();
```
```csharp
output2().WriteLine(); // 1
```

```csharp
// int -> (() -> int)
```
```csharp
// Input: value of type int. Output: function of type () -> int.
```
```csharp
Func<int, Func<int>> higherOrder3 = int32 => new Func<int>(() => int32 + 1);
```
```csharp
Func<int> output3 = higherOrder3(1);
```
```csharp
output3().WriteLine(); // 2
```

```csharp
// (() -> void, () -> int) -> (() -> bool)
```
```csharp
// Input: function of type () -> void, function of type () -> int. Output: function of type () -> bool.
```
```csharp
Func<Action, Func<int>, Func<bool>> higherOrder4 = (action, int32Factory) =>
```
```csharp
{
```
```csharp
action();
```
```csharp
return () => int32Factory() > 0;
```
```csharp
};
```
```csharp
Func<bool> output4 = higherOrder4(firstOrder1, firstOrder2); // firstOrder1
```
```csharp
output4().WriteLine(); // True
```
```csharp
Func<bool> output5 = higherOrder4(() => nameof(higherOrder4).WriteLine(), () => 0); // higherOrder4
```
```csharp
output5().WriteLine(); // False
```

}

These higher-order functions can be defined and called with IIFE syntax, without any function name or function variable name involved:

internal static void AnonymousHigherOrderIife()

```csharp
{
```
```csharp
// (() -> void) -> void
```
```csharp
new Action<Action>(action => action())(
```
```csharp
() => nameof(AnonymousHigherOrderIife).WriteLine()); // AnonymousHigherOrderIife
```

```csharp
// () -> (() -> int)
```
```csharp
Func<int> output2 = new Func<Func<int>>(() => (() => 1))();
```
```csharp
output2().WriteLine(); // 1
```

```csharp
// int -> (() -> int)
```
```csharp
Func<int> output3 = new Func<int, Func<int>>(int32 => (() => int32 + 1))(1);
```
```csharp
output3().WriteLine(); // 2
```

```csharp
// (() -> int, () -> string) ->(() -> bool)
```
```csharp
Func<bool> output4 = new Func<Action, Func<int>, Func<bool>>((action, int32Factory) =>
```
```csharp
{
```
```csharp
action();
```
```csharp
return () => int32Factory() > 0;
```
```csharp
})(arg1: () => nameof(AnonymousHigherOrderIife).WriteLine(), arg2: () => 0); // AnonymousHigherOrderIife
```
```csharp
output4().WriteLine();
```

}

.NET Standard has many built in higher-order functions, like Array.FindAll:

namespace System

```csharp
{
```
```csharp
public abstract class Array : ICloneable, IList, ICollection, IEnumerable, IStructuralComparable, IStructuralEquatable
```
```csharp
{
```
```csharp
public static T[] FindAll<T>(T[] array, Predicate<T>match);
```
```csharp
}
```

}

It iterates all values in the input array, and call the match function for each value. If match function returns true, the value is added to the result array:

internal static void FilterArray(Data\[\] array)

```csharp
{
```
```csharp
Data[] filtered = Array.FindAll(array, data => data != null);
```

}

Many LINQ query methods are higher-order functions, take the fore mentioned Where, OrderBy, Select as example:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TSource> Where<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

```csharp
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```
```csharp
}
```

```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static IQueryable<TSource> Where<TSource>(
```
```csharp
this IQueryable<TSource> source, Func<TSource, bool> predicate);
```

```csharp
public static IOrderedQueryable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IQueryable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IQueryable<TResult> Select<TSource, TResult>(
```
```csharp
this IQueryable<TSource> source, Func<TSource, TResult> selector);
```
```csharp
}
```

}

The Where, OrderBy, Select query methods for local LINQ query are higher-order functions, since they accept an IEnumerable<T> local data source and a function as input. The query methods for remote LINQ query are first-order functions, since they accept an IQueryable<T> remote data source and an expression tree data structure. These LINQ query methods will be discussed in detail in the LINQ to Objects chapters and LINQ to Entities chapters.

### Convert first-order function to higher-order function

It is possible to convert a first-order to higher-order function. In the following example, function add2Args and higherOrderAdd2Args do the same work – add 2 int values and output the sum:

internal static void Add2ArgsFirstOrderToHigherOrder()

```csharp
{
```
```csharp
// (int, int) -> int
```
```csharp
Func<int, int, int> add2Args = (a, b) => a + b;
```
```csharp
int result = add2Args(1, 2); // 3
```

```csharp
// int -> (int -> int)
```
```csharp
// Input: value of type int. output: function of type int -> int.
```
```csharp
Func<int, Func<int, int>> higherOrderAdd2Args = a =>
```
```csharp
new Func<int, int>(b => a + b);
```
```csharp
Func<int, int> add1ArgAnd1Variable = higherOrderAdd2Args(1); // Equivalent to: b => 1 + b.
```
```csharp
int higherOrderResult = add1ArgAnd1Variable(2); // 3
```

}

Apparently, add2Args is first-order function of type (int, int) –> int. It accepts the first and the second int values as input, and outputs their sum. In contrast, higherOrderAdd2Args is higher-order function of type int –> (int –> int). It accepts only the first int value as input, and outputs a function of type int –> int. This new function accepts the second int value as input, adds with the first int value as free variable captured by closure: b => 1 + b, and outputs their sum. When using add2Args, there is 1 call, where both the first and second int values must be provided, and the result is directly returned. When using higherOrderAdd2Args, there are 2 calls and an intermediate function involved, where only 1 int value is required for each call.

Similarly, a first-order function with 3 parameters can be converted to higher-order function with the same pattern:

internal static void Add3ArgsFirstOrderToHigherOrder()

```csharp
{
```
```csharp
// (int, int, int) -> int
```
```csharp
Func<int, int, int, int> add3Args = (a, b, c) => a + b + c;
```
```csharp
int result = add3Args(1, 2, 3); // 6
```

```csharp
// int ->(int -> (int -> int))
```
```csharp
// Input: value of type int. output: function of type int -> (int -> int), the same as above higherOrderSumOfTwoIntegers.
```
```csharp
Func<int, Func<int, Func<int, int>>> higherOrderAdd3Args = a =>
```
```csharp
new Func<int, Func<int, int>>(b =>
```
```csharp
new Func<int, int>(c => a + b + c));
```
```csharp
Func<int, Func<int, int>> higherOrderAdd2ArgsAnd1Variable = higherOrderAdd3Args(1); // Equivalent to: b => (c => 1 + b + c).
```
```csharp
Func<int, int> add1ArgAnd2Variables = higherOrderAdd2ArgsAnd1Variable(2); // Equivalent to: c => 1 + 2 + c.
```
```csharp
int higherOrderResult = add1ArgAnd2Variables(3); // 6
```

}

Again, when using first-order function, there is only 1 call, where all 3 arguments must be provided. This time, when using the higher-order function, there are 3 calls, and 2 intermediate functions, where only 1 argument is required for each call.

In the above examples, since the higher-order functions’ type is provided, C# can infer the returned intermediate functions’ type information. So, the lambda expressions can be simplified:

internal static void TypeInference()

```csharp
{
```
```csharp
// int -> (int -> int)
```
```csharp
Func<int, Func<int, int>> higherOrderAdd2Args = a => (b => a + b);
```

```csharp
// int -> (int -> (int -> int))
```
```csharp
Func<int, Func<int, Func<int, int>>> higherOrderAdd3Args = a => (b => (c => a + b + c));
```

}

### Lambda operator associativity

In C#, the lambda operator can be viewed as right associative. For the above higher-order functions, the above parenthesis on the right side of lambda operator can be omitted. Now compare the first-order functions and the converted higher-order functions:

internal static void LambdaOperatorAssociativity()

```csharp
{
```
```csharp
// (int, int) -> int
```
```csharp
Func<int, int, int> add2Args = (a, b) => a + b;
```

```csharp
// int ->int -> int
```
```csharp
Func<int, Func<int, int>> higherOrderAdd2Args = a => b => a + b;
```

```csharp
// (int, int, int) -> int
```
```csharp
Func<int, int, int, int> add3Args = (a, b, c) => a + b + c;
```

```csharp
// int ->int -> int -> int
```
```csharp
Func<int, Func<int, Func<int, int>>> higherOrderAdd3Args = a => b => c => a + b + c;
```

}

In C#, for a function with 2 or more arguments, it is really easy to convert to equivalent higher-order function. Following this syntax, in this book, the function type notation’s -> operator is also right associative, parenthesis on the right side of -> can also be omitted. So int -> (int -> int) is identical to int -> int -> int. Since ->is not left associative, they are different from (int -> int) -> int, which accepts a function of int -> int as input, and outputs int. Similarly, int -> (int -> (int -> int)) is identical to int -> int -> int -> int.

## Curry function

As demonstrated above, with higher-order function and closure, a function with 2 or more parameters can be easily converted to a sequence of nested single parameter functions, and single function call is also converted to a chain of function calls. This transformation is called currying. The term "currying" is introduced by Christopher Strachey in 1967, which is the last name of mathematician and logician Haskell Curry.

Generally, a function with N parameters can be curried to a sequence of N nested functions with single parameter:

internal static void CurryFunc<T1, T2, T3, TN, TResult>()

```csharp
{
```
```csharp
// (T1, T2, T3, T4, ... TN) -> TResult
```
```csharp
Func<T1, T2, T3, /* T4, ... */ TN, TResult> function =
```
```csharp
(value1, value2, value3, /* value4, ... */ valueN) => default;
```
```csharp
// T1 -> T2 -> T3 -> ... TN ->TResult
```
```csharp
Func<T1, Func<T2, Func<T3, /* Func<T4, ... */ Func<TN, TResult> /* ...> */>>> curriedFunction =
```
```csharp
value1 => value2 => value3 => /* value4 => ... */ valueN => default;
```

}

The above transformation can be implemented as the following Curry extension methods for Func generic delegate types:

// Transform (T1, T2) ->TResult

```csharp
// to T1 -> T2 -> TResult.
```
```csharp
public static Func<T1, Func<T2, TResult>> Curry<T1, T2, TResult>(
```
```csharp
this Func<T1, T2, TResult> function) =>
```
```csharp
value1 => value2 => function(value1, value2);
```

```csharp
// Transform (T1, T2, T3) -> TResult
```
```csharp
// to T1 -> T2 -> T3 -> TResult.
```
```csharp
public static Func<T1, Func<T2, Func<T3, TResult>>> Curry<T1, T2, T3, TResult>(
```
```csharp
this Func<T1, T2, T3, TResult> function) =>
```
```csharp
value1 => value2 => value3 => function(value1, value2, value3);
```

```csharp
// Transform (T1, T2, T3, T4) => TResult
```
```csharp
// to T1 -> T2 -> T3 -> T4 -> TResult.
```
```csharp
public static Func<T1, Func<T2, Func<T3, Func<T4, TResult>>>> Curry<T1, T2, T3, T4, TResult>(
```
```csharp
this Func<T1, T2, T3, T4, TResult> function) =>
```
```csharp
value1 => value2 => value3 => value4 => function(value1, value2, value3, value4);
```

// ...

Now function can be curried by just calling its Curry extension method:

internal static void CurryFunction()

```csharp
{
```
```csharp
// (int, int) -> int
```
```csharp
Func<int, int, int> add2Args = (a, b) => a + b;
```
```csharp
int add2ArgsResult = add2Args(1, 2);
```

```csharp
// int -> int -> int
```
```csharp
Func<int, Func<int, int>> curriedAdd2Args = add2Args.Curry();
```
```csharp
int curriedAdd2ArgsResult = curriedAdd2Args(1)(2);
```

```csharp
// (int, int, int) -> int
```
```csharp
Func<int, int, int, int> add3Args = (a, b, c) => a + b + c;
```
```csharp
int add3ArgsResult = add2Args(1, 2);
```

```csharp
// int -> int -> int -> int
```
```csharp
Func<int, Func<int, Func<int, int>>> curriedAdd3Args = add3Args.Curry();
```
```csharp
int curriedAdd3ArgsResult = curriedAdd3Args(1)(2)(3);
```

}

Function without output can be curried in the same way:

internal static void CurryAction<T1, T2, T3, TN>()

```csharp
{
```
```csharp
// (T1, T2, T3, ... TN) -> void
```
```csharp
Action<T1, T2, T3, /* T4, ... */ TN> function =
```
```csharp
(value1, value2, value3, /* value4, ... */ valueN) => { };
```
```csharp
// T1 -> T2 -> T3 -> ... TN ->void
```
```csharp
Func<T1, Func<T2, Func<T3, /* Func<T4, ... */ Action<TN>/* ...> */>>> curriedFunction =
```
```csharp
value1 => value2 => value3 => /* value4 => ... */ valueN => { };
```

}

Similarly, the above transformation can be implemented as the following Curry extension methods for Action generic delegate types:

// Transform (T1, T2) ->void

```csharp
// to T1 => T2 -> void.
```
```csharp
public static Func<T1, Action<T2>> Curry<T1, T2>(
```
```csharp
this Action<T1, T2> function) =>
```
```csharp
value1 => value2 => function(value1, value2);
```

```csharp
// Transform (T1, T2, T3) -> void
```
```csharp
// to T1 -> T2 -> T3 -> void.
```
```csharp
public static Func<T1, Func<T2, Action<T3>>> Curry<T1, T2, T3>(
```
```csharp
this Action<T1, T2, T3> function) =>
```
```csharp
value1 => value2 => value3 => function(value1, value2, value3);
```

```csharp
// Transform (T1, T2, T3, T4) -> void
```
```csharp
// to T1 -> T2 -> T3 -> T4 -> void.
```
```csharp
public static Func<T1, Func<T2, Func<T3, Action<T4>>>> Curry<T1, T2, T3, T4>(
```
```csharp
this Action<T1, T2, T3, T4> function) =>
```
```csharp
value1 => value2 => value3 => value4 => function(value1, value2, value3, value4);
```

// ...

Now function without output can also be curried by just calling its Curry extension method:

Internal static void CurryAction()

```csharp
{
```
```csharp
// (int, int) -> void
```
```csharp
Action<int, int> add2Args = (a, b) => (a + b).WriteLine();
```
```csharp
add2Args(1, 2);
```

```csharp
// int -> int -> void
```
```csharp
Func<int, Action<int>> curriedAdd2Args = add2Args.Curry();
```
```csharp
curriedAdd2Args(1)(2);
```

```csharp
// (int, int, int) -> void
```
```csharp
Action<int, int, int> add3Args = (a, b, c) => (a + b + c).WriteLine();
```
```csharp
add2Args(1, 2);
```

```csharp
// int -> int -> int -> void
```
```csharp
Func<int, Func<int, Action<int>>> curriedAdd3Args = add3Args.Curry();
```
```csharp
curriedAdd3Args(1)(2)(3);
```

}

### Uncurry function

The opposite transformation from a sequence of nested single parameter functions to a function with multiple parameters is called uncurrying. Uncurry extension methods implemented for higher-order functions with a chain of calls:

// Transform T1 -> T2 ->TResult

```csharp
// to (T1, T2) -> TResult.
```
```csharp
public static Func<T1, T2, TResult> Uncurry<T1, T2, TResult>(
```
```csharp
this Func<T1, Func<T2, TResult>> function) =>
```
```csharp
(value1, value2) => function(value1)(value2);
```

```csharp
// Transform T1 -> T2 ->T3 -> TResult
```
```csharp
// to (T1, T2, T3) -> TResult.
```
```csharp
public static Func<T1, T2, T3, TResult> Uncurry<T1, T2, T3, TResult>(
```
```csharp
this Func<T1, Func<T2, Func<T3, TResult>>> function) =>
```
```csharp
(value1, value2, value3) => function(value1)(value2)(value3);
```

```csharp
// Transform T1 -> T2 ->T3 -> T4 -> TResult
```
```csharp
// to (T1, T2, T3, T4) ->TResult.
```
```csharp
public static Func<T1, T2, T3, T4, TResult> Uncurry<T1, T2, T3, T4, TResult>(
```
```csharp
this Func<T1, Func<T2, Func<T3, Func<T4, TResult>>>> function) =>
```
```csharp
(value1, value2, value3, value4) => function(value1)(value2)(value3)(value4);
```

```csharp
// ...
```

```csharp
// Transform T1 -> T2 ->void
```
```csharp
// to (T1, T2) -> void.
```
```csharp
public static Action<T1, T2> Uncurry<T1, T2>(
```
```csharp
this Func<T1, Action<T2>> function) => (value1, value2) =>
```
```csharp
function(value1)(value2);
```

```csharp
// Transform T1 -> T2 ->T3 -> void
```
```csharp
// to (T1, T2, T3) -> void.
```
```csharp
public static Action<T1, T2, T3> Uncurry<T1, T2, T3>(
```
```csharp
this Func<T1, Func<T2, Action<T3>>> function) =>
```
```csharp
(value1, value2, value3) => function(value1)(value2)(value3);
```

```csharp
// Transform T1 -> T2 ->T3 -> T4 -> void
```
```csharp
// to (T1, T2, T3, T4) ->void.
```
```csharp
public static Action<T1, T2, T3, T4> Uncurry<T1, T2, T3, T4>(
```
```csharp
this Func<T1, Func<T2, Func<T3, Action<T4>>>> function) =>
```
```csharp
(value1, value2, value3, value4) => function(value1)(value2)(value3)(value4);
```

// ...

The usage of Uncurry is also straightforward:

internal static void Uncurry()

```csharp
{
```
```csharp
// int ->int -> int
```
```csharp
Func<int, Func<int, int>> curriedAdd2Args = a => b => a + b;
```
```csharp
// (int ->int) -> int
```
```csharp
Func<int, int, int> add2Args = curriedAdd2Args.Uncurry();
```
```csharp
int add2ArgsResult = add2Args(1, 2);
```

```csharp
// int ->int -> int -> void
```
```csharp
Func<int, Func<int, Action<int>>> curriedAdd3Args = a => b => c => (a + b + c).WriteLine();
```
```csharp
// (int ->int -> int) -> void
```
```csharp
Action<int, int, int> add3Args = curriedAdd3Args.Uncurry();
```
```csharp
add3Args(1, 2, 3);
```

}

### Partially apply function

Another function transformation similar to function currying is function partial application. Function application is just another word for function call. For function with multiple parameters, function partial application means to call that function with partial arguments (typically, a single argument) instead of all arguments. Similar to currying, the implementation of function partial application also involves higher-order function and closure. The difference is, partial application does not result a single function with fewer parameters, not a sequence of nested single parameter functions. For example, a first-order function of type (int, int) -> int can be partially applied with 1 argument and transformed to another first-order function of type int ->int, a first-order function of type (int, int, int) -> void can be partially applied with 1 argument and transformed to another first-order function of type (int, int) -> void:

internal static void FirstOrderToFirstOrder()

```csharp
{
```
```csharp
// (int, int) -> int
```
```csharp
Func<int, int, int> add2Args = (a, b) => a + b;
```

```csharp
// int -> int
```
```csharp
Func<int, int> add1ArgAnd1Variable = b => 1 + b; // Partially apply add2Args with a = 1.
```

```csharp
// (int, int, int) -> void
```
```csharp
Action<int, int, int> add3Args = (a, b, c) => (a + b + c).WriteLine();
```
```csharp
add2Args(1, 2);
```

```csharp
// (int, int) -> void
```
```csharp
Action<int, int> add2ArgsAnd1Variable = (b, c) => (1 + b + c).WriteLine(); // Partially apply add2Args with a = 1.
```
```csharp
// add2ArgsAnd1Variable can be called with 2 arguments, or be partially applied again with b = 2:
```
```csharp
// int -> void
```
```csharp
Action<int> add1ArgsAnd2Variable = c => (1 + 2 + c).WriteLine();
```

}

Generally, following Partial extension methods for Func and Action generic delegate types are higher-order functions. When Partial is used for a function with 2 or more parameters, it accepts the first parameter of that function, and outputs another function that accepts the rest of parameters of the original function:

// Input: function of type (T1, T2) -> TResult, first parameter of type T1.

```csharp
// Output: function of type T2 -> TResult.
```
```csharp
public static Func<T2, TResult> Partial<T1, T2, TResult>(
```
```csharp
this Func<T1, T2, TResult> function, T1 value1) =>
```
```csharp
value2 => function(value1, value2);
```

```csharp
// Input: function of type (T1, T2, T3) -> TResult, first parameter of type T1.
```
```csharp
// Output: function of type (T2, T3) -> TResult.
```
```csharp
public static Func<T2, T3, TResult> Partial<T1, T2, T3, TResult>(
```
```csharp
this Func<T1, T2, T3, TResult> function, T1 value1) =>
```
```csharp
(value2, value3) => function(value1, value2, value3);
```

```csharp
// Input: function of type (T1, T2, T3, T4) -> TResult, first parameter of type T1.
```
```csharp
// Output: function of type (T2, T3, T4) -> TResult.
```
```csharp
public static Func<T2, T3, T4, TResult> Partial<T1, T2, T3, T4, TResult>(
```
```csharp
this Func<T1, T2, T3, T4, TResult> function, T1 value1) =>
```
```csharp
(value2, value3, value4) => function(value1, value2, value3, value4);
```

```csharp
// ...
```

```csharp
// Input: function of type (T1, T2) -> void, first parameter of type T1.
```
```csharp
// Output: function of type T2 -> void.
```
```csharp
public static Action<T2> Partial<T1, T2>(
```
```csharp
this Action<T1, T2> function, T1 value1) =>
```
```csharp
value2 => function(value1, value2);
```

```csharp
// Input: function of type (T1, T2, T3) -> void, first parameter of type T1.
```
```csharp
// Output: function of type (T2, T3) -> void.
```
```csharp
public static Action<T2, T3> Partial<T1, T2, T3>(
```
```csharp
this Action<T1, T2, T3> function, T1 value1) =>
```
```csharp
(value2, value3) => function(value1, value2, value3);
```

```csharp
// Input: function of type (T1, T2, T3, T4) -> void, first parameter of type T1.
```
```csharp
// Output: function of type (T2, T3, T4) -> void.
```
```csharp
public static Action<T2, T3, T4> Partial<T1, T2, T3, T4>(
```
```csharp
this Action<T1, T2, T3, T4> function, T1 value1) =>
```
```csharp
(value2, value3, value4) => function(value1, value2, value3, value4);
```

// ...

The following example demonstrates how to call Partial for partial application of functions with multiple parameters:

internal static void PartiallyApply()

```csharp
{
```
```csharp
// (int, int) -> int
```
```csharp
Func<int, int, int> add2Args = (a, b) => a + b;
```
```csharp
// int -> int
```
```csharp
Func<int, int> add1ArgAnd1Variable = add2Args.Partial(1);
```
```csharp
int add1ArgAnd1VariableResult = add1ArgAnd1Variable(2);
```

```csharp
// (int, int, int) -> void
```
```csharp
Action<int, int, int> add3Args = (a, b, c) => (a + b + c).WriteLine();
```
```csharp
// (int, int) -> void
```
```csharp
Action<int, int> add2ArgsAnd1Variable = add3Args.Partial(1);
```
```csharp
add2ArgsAnd1Variable(2, 3);
```

}

For curried function, partial application means a chain of calls with fewer arguments than total:

internal static void PartiallyApplyCurriedFunction()

```csharp
{
```
```csharp
// int -> int -> int
```
```csharp
Func<int, Func<int, int>> curriedAdd2Args = a => b => a + b;
```
```csharp
// int -> int
```
```csharp
Func<int, int> partiallyAppliedCurriedAdd2Args = curriedAdd2Args(1);
```

```csharp
// int -> int -> int -> void
```
```csharp
Func<int, Func<int, Action<int>>> curriedAdd3Args = a => b => c => (a + b + c).WriteLine();
```
```csharp
// int -> void
```
```csharp
Action<int> partiallyAppliedCurriedAdd3Args = curriedAdd3Args(1)(2);
```

}

## First-class function

Higher-order function enables function to be function’s input and output, which is an important aspect of be first-class citizenship in language. First-class function means in C# function supports all the generally available operations for other entities like object. These operations include being a variable, being a type’s field, being a function’s input, being a function’s output, being equality testable, etc. This can be demonstrated by comparing C# function with C# object side by side. First of all, with delegate type and delegate instance, function and object both have type and instance, and an instance can be variable, can have alias and immutable alias:

internal static void Object()

```csharp
{
```
```csharp
Data value = new Data(0);
```
```csharp
ref Data alias = ref value;
```
```csharp
ref readonly Data immutableAlias = ref value;
```
```csharp
}
```

```csharp
internal static void Function()
```
```csharp
{
```
```csharp
Function value1 = Function; // Named function.
```
```csharp
Function value2 = () => { }; // Anonymous function.
```
```csharp
ref Function alias = ref value1;
```
```csharp
ref readonly Function immutableAlias = ref value2;
```

}

With delegate type and delegate instance, function and object can both be stored with static and instance field of type:

internal class Fields

```csharp
{
```
```csharp
private static Data staticDataField = new Data(0);
```

```csharp
private static Function staticNamedFunctionField = Function;
```

```csharp
private static Function staticAnonymousFunctionField = () => { };
```

```csharp
private Data instanceDataField = new Data(0);
```

```csharp
private Function instanceNamedFunctionField = Function;
```

```csharp
private Function instanceAnonymousFunctionField = () => { };
```

}

With local function and lambda expression, function and object can both be nested:

internal partial class Data

```csharp
{
```
```csharp
internal Data Inner { get; set; }
```
```csharp
}
```

```csharp
internal static void NestedObject()
```
```csharp
{
```
```csharp
Data outer = new Data(1)
```
```csharp
{
```
```csharp
Inner = new Data(2)
```
```csharp
};
```
```csharp
}
```

```csharp
internal static void NestedFunction()
```
```csharp
{
```
```csharp
void Outer()
```
```csharp
{
```
```csharp
void Inner() { }
```
```csharp
}
```

```csharp
Function outer = () =>
```
```csharp
{
```
```csharp
Function inner = () => { };
```
```csharp
};
```

}

With closure to capture free variable, function and object can both access data out of the scope:

internal class OuterClass

```csharp
{
```
```csharp
const int Outer = 1;
```

```csharp
class InnerClass
```
```csharp
{
```
```csharp
const int Inner = 2;
```
```csharp
int sum = Inner + Outer;
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void OuterFunction()
```
```csharp
{
```
```csharp
const int Outer = 1;
```

```csharp
void InnerFunction()
```
```csharp
{
```
```csharp
const int Inner = 2;
```
```csharp
int sum = Inner + Outer;
```
```csharp
}
```

```csharp
new Function(() =>
```
```csharp
{
```
```csharp
const int Inner = 2;
```
```csharp
int sum = Inner + Outer;
```
```csharp
})();
```

}

With higher-order function, function and object can both be input and output of function:

internal static Data Function(Data value) => value;

internal static Function Function(Function value) => value;

With delegate type and delegate instance, function and object can both be equality testable:

internal partial class Data

```csharp
{
```
```csharp
public override bool Equals(object obj) =>
```
```csharp
object.ReferenceEquals(this, obj) || this.Value == (obj as Data)?.Value;
```

```csharp
public override int GetHashCode() => this.Value.GetHashCode();
```

```csharp
public static bool operator ==(Data data1, Data data2) => data1?.Value == data2?.Value;
```

```csharp
public static bool operator !=(Data data1, Data data2) => !(data1 == data2);
```
```csharp
}
```

```csharp
internal static void ObjectEquality()
```
```csharp
{
```
```csharp
Data value1 = new Data(1);
```
```csharp
Data value2 = new Data(1);
```
```csharp
object.ReferenceEquals(value1, value2).WriteLine(); // False
```
```csharp
object.Equals(value1, value2).WriteLine(); // True
```
```csharp
value1.Equals(value2).WriteLine(); // True
```
```csharp
(value1 == value2).WriteLine(); // True
```
```csharp
(value1.GetHashCode() == value2.GetHashCode()).WriteLine(); // True.
```
```csharp
EqualityComparer<Data>.Default.Equals(value1, value2).WriteLine(); // True
```
```csharp
}
```

```csharp
internal static void FunctionEquality()
```
```csharp
{
```
```csharp
Function value1 = Function;
```
```csharp
Function value2 = Function;
```
```csharp
object.ReferenceEquals(value1, value2).WriteLine(); // False
```
```csharp
object.Equals(value1, value2).WriteLine(); // True
```
```csharp
value1.Equals(value2).WriteLine(); // True
```
```csharp
(value1 == value2).WriteLine(); // True
```
```csharp
(value1.GetHashCode() == value2.GetHashCode()).WriteLine(); // True.
```
```csharp
EqualityComparer<Function>.Default.Equals(value1, value2).WriteLine(); // True
```

}

Here Data type overrides object type’s Equals method as well as the == and != operators, so that, 2 Data instances considered logically equal if they encapsulate the same int value. It also overrides object type’s GetHashCode, so that 2 equal Data instances have the same hash code. If 2 variables are 2 Data instances encapsulating the same int value, apparently these 2 variables are not reference equal, but logically equal with the same hash code. C# provides these equality APIs through System.Delegate and System.MulticastDelegate. So similarly, if 2 variables are 2 delegate instances representing the same function, they are not reference equal, but logically equal with the same hash code as well.

So, with rich functional features including delegate, local function, lambda expression, closure and higher-order function, C#’s named function and anonymous function are first-class citizens, and C# is a functional language. Besides these aspects, C# functions can be composed just like object composition. Function composition is discussed in the next chapter.

## Summary

This chapter discussed higher-order function, and its related concepts, including first-order function, currying function, uncurrying function, partially applying function, and lambda operator’s associativity. Higher-order function works with other C# features, and enables first-class functions in C#.