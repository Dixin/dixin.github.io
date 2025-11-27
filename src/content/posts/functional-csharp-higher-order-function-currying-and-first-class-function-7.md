---
title: "C# Functional Programming In-Depth (8) Higher-order Function, Currying and First Class Function"
published: 2018-06-08
description: "is a function accepting one or more function parameters as input, or returning a function as output. The other functions are"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-higher-order-function-currying-and-first-class-function](/posts/functional-csharp-higher-order-function-currying-and-first-class-function "https://weblogs.asp.net/dixin/functional-csharp-higher-order-function-currying-and-first-class-function")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

## First order and higher-order function

[Higher-order function](http://en.wikipedia.org/wiki/Higher-order_function) is a function accepting one or more function parameters as input, or returning a function as output. The other functions are called first-order functions. C# supports higher-order function from the beginning. Generally, C# function can have almost any data type and function type as its input types and output type, except:

-   Static types, like System.Convert, System.Math, etc., because they cannot be instantiated.
-   Special types, like fore mentioned System.Void.

A first-order function can take normal data value as input and output:

```csharp
internal partial class Data { }

internal static partial class Functions
{
    internal static Data FirstOrder(Data value)
    {
        return value;
    }

    internal static void CallFirstOrder()
    {
        Data input = default;
        Data output = FirstOrder(input);
    }
}
```

A higher-order function can be defined by replacing above data type with a function type:

```csharp
internal delegate void Function();

internal static partial class Functions
{
    internal static Function NamedHigherOrder(Function value)
    {
        return value;
    }

    internal static void CallHigherOrder()
    {
        Function input = default;
        Function output = NamedHigherOrder(input);
    }
}
```

Above HigherOrder is a named higher-order function. Anonymous higher-order functions can also be easily represented with lambda expression:

```csharp
internal static void LambdaHigherOrder()
{
    Action firstOrder1 = () => nameof(LambdaHigherOrder).WriteLine();
    firstOrder1(); // LambdaHigherOrder

    // (() -> void) -> void
    // Input: function of type () -> void. Output: void.
    Action<Action> higherOrder1 = action => action();
    higherOrder1(firstOrder1); // firstOrder1
    higherOrder1(() => nameof(LambdaHigherOrder).WriteLine()); // LambdaHigherOrder

    Func<int> firstOrder2 = () => 1;
    firstOrder2().WriteLine(); // 1

    // () -> (() -> int)
    // Input: none. Output: function of type () -> int.
    Func<Func<int>> higherOrder2 = () => firstOrder2;
    Func<int> output2 = higherOrder2();
    output2().WriteLine(); // 1

    // int -> (() -> int)
    // Input: value of type int. Output: function of type () -> int.
    Func<int, Func<int>> higherOrder3 = int32 =>
        (() => int32 + 1);
    Func<int> output3 = higherOrder3(1);
    output3().WriteLine(); // 2

    // (() -> void, () -> int) -> (() -> bool)
    // Input: function of type () -> void, function of type () -> int. Output: function of type () -> bool.
    Func<Action, Func<int>, Func<bool>> higherOrder4 = (action, int32Factory) =>
    {
        action();
        return () => int32Factory() > 0;
    };
    Func<bool> output4 = higherOrder4(firstOrder1, firstOrder2); // LambdaHigherOrder
    output4().WriteLine(); // True
    output4 = higherOrder4(() => nameof(LambdaHigherOrder).WriteLine(), () => 0); // LambdaHigherOrder
    output4().WriteLine(); // False
}
```

These higher-order functions can be defined and called with IIFE syntax, without any function name involved:

```csharp
internal static void AnonymousHigherOrder()
{
    // (() -> void) -> void
    new Action<Action>(action => action())(
        () => nameof(AnonymousHigherOrder).WriteLine());

    // () -> (() -> int)
    Func<int> output2 = new Func<Func<int>>(() => (() => 1))();
    output2().WriteLine(); // 1

    // int -> (() -> int)
    Func<int> output3 = new Func<int, Func<int>>(int32 => (() => int32 + 1))(1);
    output3().WriteLine(); // 2

    // (() -> int, () -> string) -> (() -> bool)
    Func<bool> output4 = new Func<Action, Func<int>, Func<bool>>((action, int32Factory) =>
    {
        action();
        return () => int32Factory() > 0;
    })(() => nameof(LambdaHigherOrder).WriteLine(), () => 0);
    output4().WriteLine();
}
```

.NET provides many built in higher-order functions, like Array.FindAll:

```csharp
namespace System
{
    public abstract class Array : ICollection, IEnumerable, IList, IStructuralComparable, IStructuralEquatable
    {
        public static T[] FindAll<T>(T[] array, Predicate<T> match);
    }
}
```

It iterates all values in the input array, and call the match function for each value. If match function returns true, the value is added to the result array:

```csharp
internal static void FilterArray(Uri[] array)
{
    Uri[] notNull = Array.FindAll(array, uri => uri != null);
}
```

Many LINQ query methods are higher-order functions, like fore mentioned Where, OrderBy, Select:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Where<TSource>(
            this IEnumerable<TSource> source, Func<TSource, bool> predicate);

        public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
            this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IEnumerable<TResult> Select<TSource, TResult>(
            this IEnumerable<TSource> source, Func<TSource, TResult> selector);
    }
}
```

Again, LINQ query methods will be discussed in detail in the LINQ to Objects chapter.

## Curry function

In the following example, first order function add2 simply adds 2 int values. Compare this function with the other higher-order function higherOrderAdd2:

```csharp
internal static void FirstOrderHigherOrder()
{
    // (int, int) -> int
    Func<int, int, int> add2 = (a, b) => a + b;
    int add2Result = add2(1, 2);
    // int -> (int -> int)
    Func<int, Func<int, int>> higherOrderAdd2 = a => new Func<int, int>(b => a + b);
    Func<int, int> add1 = higherOrderAdd2(1); // Equivalent to: b => 1 + b.
    int curriedAdd2Result = add1(2);
}
```

The first order function of type (int, int) –> int is straightforward. It accepts the first and the second int values, and returns their sum. The higher-order function of type int –> (int –> int) accepts only the first int value, and returns another function of type int –> int, which accepts the second int value and return the sum. Calling these functions are different too. Calling the first order function requires providing the first and second int values, and the result is directly returned. Calling the higher-order function requires only the first int value, it returns function which is a closure of the that int value. Then, calling the returned function requires providing the second int value, and the result is returned.

Actually, for the higher-order function, its returned function type can be the inferred from the higher-order function type. So it can be simplified as:

```csharp
internal static void TypeInference()
{
    // (int, int) -> int
    Func<int, int, int> add2 = (a, b) => a + b;
    int add2Result = add2(1, 2);
    // int -> (int -> int)
    Func<int, Func<int, int>> curriedAdd2 = a => b => a + b;
    int curriedAdd2Result = curriedAdd2(1)(2);
}
```

These 2 functions represents the same algorithm but in different form. This kind of transformation from a 2-arity first order function of type (T1, T2) –> TResult) to a 1-arity higher-order function of type T1 –> (T2 –> TResult), is called [currying](http://en.wikipedia.org/wiki/Currying). The term "currying" is introduced by [Christopher Strachey](http://en.wikipedia.org/wiki/Christopher_Strachey) in 1967, which is the last name of mathematician and logician [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry).

Similarly, the following function with 3 parameters can be curried into a sequence of 3 1-arity functions:

```csharp
internal static void CurryFunc()
{
    // (int, int, int) -> int
    Func<int, int, int, int> add3 = (a, b, c) => a + b + c;
    int add3Result = add3(1, 2, 3);
    // int -> int -> int -> int
    Func<int, Func<int, Func<int, int>>> curriedAdd3 = a => b => c => a + b + c;
    int curriedAdd3Result = curriedAdd3(1)(2)(3);
}
```

Generally, any N-arity function returning a value can be curried into a sequence of N 1-arity functions:

```csharp
internal static void CurryFunc<T1, T2, T3, TN, TResult>()
{
    // (T1, T2, T3, ... TN) -> TResult
    Func<T1, T2, T3, /* T4, ... */ TN, TResult> function =
        (value1, value2, value3, /* ... */ valueN) => default;
    // T1 -> T2 -> T3 -> ... TN -> TResult
    Func<T1, Func<T2, Func<T3, /* Func<T4, ... */ Func<TN, TResult> /* ... */>>> curriedFunction =
        value1 => value2 => value3 => /* value4 => ... */ valueN => default;
}
```

The above transformation can be wrapped as the following Curry extension methods for all Func delegate types:

```csharp
public static partial class FuncExtensions
{
    // Transform (T1, T2) -> TResult
    // to T1 -> T2 -> TResult.
    public static Func<T1, Func<T2, TResult>> Curry<T1, T2, TResult>(
        this Func<T1, T2, TResult> function) => 
            value1 => value2 => function(value1, value2);

    // Transform (T1, T2, T3) -> TResult
    // to T1 -> T2 -> T3 -> TResult.
    public static Func<T1, Func<T2, Func<T3, TResult>>> Curry<T1, T2, T3, TResult>(
        this Func<T1, T2, T3, TResult> function) => 
            value1 => value2 => value3 => function(value1, value2, value3);

    // Transform (T1, T2, T3, T4) => TResult
    // to T1 -> T2 -> T3 -> T4 -> TResult.
    public static Func<T1, Func<T2, Func<T3, Func<T4, TResult>>>> Curry<T1, T2, T3, T4, TResult>(
        this Func<T1, T2, T3, T4, TResult> function) => 
            value1 => value2 => value3 => value4 => function(value1, value2, value3, value4);

    // ...
}
```

Now any function can be curried by just calling the Curry method:

```csharp
internal static void CallCurry()
{
    // (int, int) -> int
    Func<int, int, int> add2 = (a, b) => a + b;
    int add2Result = add2(1, 2);
    // int -> (int -> int)
    Func<int, Func<int, int>> curriedAdd2 = add2.Curry();
    int curriedAdd2Result = curriedAdd2(1)(2);

    // (int, int, int) -> int
    Func<int, int, int, int> add3 = (a, b, c) => a + b + c;
    int add3Result = add3(1, 2, 3);
    // int -> int -> int -> int
    Func<int, Func<int, Func<int, int>>> curriedAdd3 = add3.Curry();
    int curriedAdd3Result = curriedAdd3(1)(2)(3);
}
```

Function returning void can be curried too:

```csharp
internal static void CurryAction()
{
    // (int, int) -> void
    Action<int, int> traceAdd2 = (a, b) => (a + b).WriteLine();
    traceAdd2(1, 2);
    // int -> int -> void
    Func<int, Action<int>> curriedTraceAdd2 = a => b => (a + b).WriteLine();
    curriedTraceAdd2(1)(2);

    // (int, int, int) -> void
    Action<int, int, int> traceAdd3 = (a, b, c) => (a + b + c).WriteLine();
    traceAdd3(1, 2, 3);
    // int -> int -> int -> void
    Func<int, Func<int, Action<int>>> curriedTraceAdd3 = a => b => c => (a + b + c).WriteLine();
    curriedTraceAdd3(1)(2)(3);
}
```

Generally, any N-arity function returning void can be curried into a sequence of N 1-arity functions:

```csharp
internal static void CurryAction<T1, T2, T3, TN>()
{
    // (T1, T2, T3, ... TN) -> void
    Action<T1, T2, T3, /* T4, ... */ TN> function =
        (value1, value2, value3, /* ... */ valueN) => { };
    // T1 -> T2 -> T3 -> ... TN -> void
    Func<T1, Func<T2, Func<T3, /* Func<T4, ... */ Action<TN> /* ... */>>> curriedFunction =
        value1 => value2 => value3 => /* value4 => ... */ valueN => { };
}
```

Similarly, the above transformation can be wrapped as the following Curry extension methods for all Action delegate types:

```csharp
public static partial class ActionExtensions
{
    // Transform (T1, T2) -> void
    // to T1 => T2 -> void.
    public static Func<T1, Action<T2>> Curry<T1, T2>(
        this Action<T1, T2> function) =>
            value1 => value2 => function(value1, value2);

    // Transform (T1, T2, T3) -> void
    // to T1 -> T2 -> T3 -> void.
    public static Func<T1, Func<T2, Action<T3>>> Curry<T1, T2, T3>(
        this Action<T1, T2, T3> function) => value1 => value2 => value3 => function(value1, value2, value3);

    // Transform (T1, T2, T3, T4) -> void
    // to T1 -> T2 -> T3 -> T4 -> void.
    public static Func<T1, Func<T2, Func<T3, Action<T4>>>> Curry<T1, T2, T3, T4>(
        this Action<T1, T2, T3, T4> function) =>
            value1 => value2 => value3 => value4 => function(value1, value2, value3, value4);

    // ...
}
```

## Lambda operator associativity

As demonstrated above, in a lambda expression, if on the right side of the => operator there is another lambda expression, the parenthesis for the right side lambda expression can be omitted. For example:

```csharp
internal static void OperatorAssociativity()
{
    // int -> (int -> int)
    Func<int, Func<int, int>> curriedAdd2 = a => (b => a + b);
    // int -> (int -> (int -> int))
    Func<int, Func<int, Func<int, int>>> curriedAdd3 = a => (b => (c => a + b + c));
}
```

The above functions are identical to the following functions without parenthesis:

```csharp
internal static void OperatorAssociativity()
{
    // int -> int -> int
    Func<int, Func<int, int>> curriedAdd2 =  a => b => a + b;
    // int -> int -> int -> int
    Func<int, Func<int, Func<int, int>>> curriedAdd3 = a => b => c => a + b + c;
}
```

So that the => operator can be viewed as right associative.

In some other functional languages, functions are curried by default. For example, in F#, it is unnecessary to explicitly define a function as curried:

```csharp
let curriedAdd2: int -> (int -> int) = fun a -> (fun b -> a + b)
let add1: int -> int = curriedAdd2 1
let curriedAdd2esult: int = add1 2
```

The function is curried by default. The above code is equivalent to:

```csharp
let add2: int -> int -> int = fun a b -> a + b
let add2Result: int = add2 1 2
```

To explicitly define a uncurried function, tuple can be used to pass multiple values at one time:

```csharp
let add2Tuple: int * int -> int = fun (a, b) -> a + b
let add2TupleResult = add2Tuple (1, 2) // add2Tuple(Tuple.Create(1, 2)
```

[Haskell](http://en.wikipedia.org/wiki/Haskell_\(programming_language\)) (that is the first name of [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry)) works similarly as F#:

```csharp
-- curriedAdd2 :: Num a => a –> (a –> a)
curriedAdd2 = \a –> (\b -> a + b)
add1 = curriedAdd2 1
curriedAdd2Result = add1 2

-- add2 :: Num a => a -> a -> a
add2 a b = a + b
add2Result = add2 1 2

-- add2Tuple :: Num a => (a, a) -> a
add2Tuple (a, b) = a + b
add2TupleResult = add2Tuple (1, 2)
```

## Partial apply function

Calling (or applying) a curried function with one argument, is called [partial application](http://en.wikipedia.org/wiki/Partial_application). Since any N-arity function can be curried, any N-arity function can also be partial applied:

```csharp
public static partial class FuncExtensions
{
    public static Func<T2, TResult> Partial<T1, T2, TResult>(
        this Func<T1, T2, TResult> function, T1 value1) => 
            value2 => function(value1, value2);

    public static Func<T2, Func<T3, TResult>> Partial<T1, T2, T3, TResult>(
        this Func<T1, T2, T3, TResult> function, T1 value1) => 
            value2 => value3 => function(value1, value2, value3);

    public static Func<T2, Func<T3, Func<T4, TResult>>> Partial<T1, T2, T3, T4, TResult>(
        this Func<T1, T2, T3, T4, TResult> function, T1 value1) => 
            value2 => value3 => value4 => function(value1, value2, value3, value4);

    // ...
}

public static partial class ActionExtensions
{
    public static Action<T2> Partial<T1, T2>(
        this Action<T1, T2> function, T1 value1) =>
            value2 => function(value1, value2);

    public static Func<T2, Action<T3>> Partial<T1, T2, T3>(
        this Action<T1, T2, T3> function, T1 value1) =>
            value2 => value3 => function(value1, value2, value3);

    public static Func<T2, Func<T3, Action<T4>>> Partial<T1, T2, T3, T4>(
        this Action<T1, T2, T3, T4> function, T1 value1) =>
            value2 => value3 => value4 => function(value1, value2, value3, value4);

    // ...
}
```

For example:

```csharp
internal static void PartialApplication()
{
    Func<int, int, int> add2 = (a, b) => a + b;
    Func<int, int> add1 = add2.Partial(1);
    int add2Result = add1(2);

    Action<int, int> traceAdd2 = (a, b) => (a + b).WriteLine();
    Action<int> traceAdd1 = traceAdd2.Partial(1);
    traceAdd1(2);
}
```

In some other functional languages where functions are curried by default, functions are partially applied by default too.

## Uncurry function

A sequence of N 1-arity functions can also be transformed back to a N-arity function. This is called uncurrying, which can be generally implemented For Func and Action delegate types as:

```csharp
public static partial class FuncExtensions
{
    // Transform T1 -> T2 -> TResult
    // to (T1, T2) -> TResult.
    public static Func<T1, T2, TResult> Uncurry<T1, T2, TResult>(
        this Func<T1, Func<T2, TResult>> function) => 
            (value1, value2) => function(value1)(value2);

    // Transform T1 -> T2 -> T3 -> TResult
    // to (T1, T2, T3) -> TResult.
    public static Func<T1, T2, T3, TResult> Uncurry<T1, T2, T3, TResult>(
        this Func<T1, Func<T2, Func<T3, TResult>>> function) => 
            (value1, value2, value3) => function(value1)(value2)(value3);

    // Transform T1 -> T2 -> T3 -> T4 -> TResult
    // to (T1, T2, T3, T4) -> TResult.
    public static Func<T1, T2, T3, T4, TResult> Uncurry<T1, T2, T3, T4, TResult>(
        this Func<T1, Func<T2, Func<T3, Func<T4, TResult>>>> function) => 
            (value1, value2, value3, value4) => function(value1)(value2)(value3)(value4);

    // ...
}

public static partial class ActionExtensions
{
    // Transform T1 -> T2 -> void
    // to (T1, T2) -> void.
    public static Action<T1, T2> Uncurry<T1, T2>(
        this Func<T1, Action<T2>> function) => (value1, value2) =>
            function(value1)(value2);

    // Transform T1 -> T2 -> T3 -> void
    // to (T1, T2, T3) -> void.
    public static Action<T1, T2, T3> Uncurry<T1, T2, T3>(
        this Func<T1, Func<T2, Action<T3>>> function) =>
            (value1, value2, value3) => function(value1)(value2)(value3);

    // Transform T1 -> T2 -> T3 -> T4 -> void
    // to (T1, T2, T3, T4) -> void.
    public static Action<T1, T2, T3, T4> Uncurry<T1, T2, T3, T4>(
        this Func<T1, Func<T2, Func<T3, Action<T4>>>> function) =>
            (value1, value2, value3, value4) => function(value1)(value2)(value3)(value4);

    // ...
}
```

For example:

```csharp
internal static void CallUncurry()
{
    // int -> int -> int -> int
    Func<int, Func<int, Func<int, int>>> curriedAdd3 = a => (b => (c => a + b + c));
    // (int -> int -> int) -> int
    Func<int, int, int, int> add3 = curriedAdd3.Uncurry();
    int add3Result = add3(1, 2, 3);

    // int -> int -> int -> void
    Func<int, Func<int, Action<int>>> curriedTraceAdd3 = a => b => c => (a + b + c).WriteLine();
    // (int -> int -> int) -> void
    Action<int, int, int> traceAdd3 = curriedTraceAdd3.Uncurry();
    traceAdd3(1, 2, 3);
}
```

## First-class function

As demonstrated, C# treats function as first class citizen. This can be compared with C# object side by side. First of all, object and function both have type and instance, and instance can be assigned/bound to variable:

```csharp
internal static partial class Functions
{
    internal static void Object()
    {
        Data value = new Data(0);
    }

    internal static void Function()
    {
        Function value1 = Function; // Named function.
        Function value2 = () => { }; // Anonymous function.
    }
}
```

Object and function can both be stored as data field:

```csharp
internal static partial class Functions
{
    private static Data dataField = new Data(0);

    private static Function namedFunctionField = Function;

    private static Function anonymousFunctionField = () => { };
}
```

Object and function can both be input and output of function:

```csharp
internal static partial class Functions
{
    internal static Data Function(Data value) => value;

    internal static Function Function(Function value) => value;
}
```

Object and function can both access data out of the scope:

```csharp
internal class OuterClass
{
    const int Outer = 1;

    class AccessOuter
    {
        const int Local = 2;
        int sum = Local + Outer;
    }
}

internal static void OuterFunction()
{
    const int Outer = 1;

    void AccessOuter()
    {
        const int Local = 2;
        int sum = Local + Outer;
    }

    Function accessOuter = () =>
    {
        const int Local = 2;
        int sum = Local + Outer;
    };
}
```

Object and function can both be nested:

```csharp
internal partial class Data
{
    internal Data Inner { get; set; }
}

internal static partial class Functions
{
    internal static void NestedObject()
    {
        Data outer = new Data(0)
        {
            Inner = new Data(1)
        };
    }

    internal static void NestedFunction()
    {
        void Outer()
        {
            void Inner() { }
        }

        Function outer = () =>
        {
            Function inner = () => { };
        };
    }
}
```

Object and function can both be equality testable:

```csharp
internal static void ObjectEquality()
{
    Data value1;
    Data value2;
    value1 = value2 = new Data(0);
    object.ReferenceEquals(value1, value2).WriteLine(); // True
    object.Equals(value1, value2).WriteLine(); // True
    (value1 == value2).WriteLine(); // True

    value1 = new Data(1);
    value2 = new Data(1);
    object.ReferenceEquals(value1, value2).WriteLine(); // False
    object.Equals(value1, value2).WriteLine(); // True
    (value1 == value2).WriteLine(); // True
}

internal static void FunctionEquality()
{
    Function value1;
    Function value2;
    value1 = value2 = () => { };
    object.ReferenceEquals(value1, value2).WriteLine(); // True
    object.Equals(value1, value2).WriteLine(); // True
    (value1 == value2).WriteLine(); // True

    value1 = new Function(Function);
    value2 = new Function(Function);
    object.ReferenceEquals(value1, value2).WriteLine(); // False
    object.Equals(value1, value2).WriteLine(); // True
    (value1 == value2).WriteLine(); // True
}
```

So C# has [first class functions](https://en.wikipedia.org/wiki/First-class_function). Here is the summary:

<table border="0" cellpadding="0" cellspacing="0" width="636"><tbody><tr><td valign="top" width="124"></td><td valign="top" width="210">Object</td><td valign="top" width="300">Function</td></tr><tr><td valign="top" width="124">Type</td><td valign="top" width="210">Class</td><td valign="top" width="300">Delegate type</td></tr><tr><td valign="top" width="124">Instance</td><td valign="top" width="210">Class instance</td><td valign="top" width="300">Delegate instance</td></tr><tr><td valign="top" width="124">Variable</td><td valign="top" width="210">Can be assigned to variable</td><td valign="top" width="300">Can be assigned to variable</td></tr><tr><td valign="top" width="124">Field</td><td valign="top" width="210">Can be stored as data field</td><td valign="top" width="300">Can be stored as data field</td></tr><tr><td valign="top" width="124">Input</td><td valign="top" width="210">Can be function’s parameter</td><td valign="top" width="300">Can be higher-order function’s parameter</td></tr><tr><td valign="top" width="124">Output</td><td valign="top" width="210">Can be function’s return value</td><td valign="top" width="300">Can be higher-order function’s return value</td></tr><tr><td valign="top" width="124">Outer variable</td><td valign="top" width="210">Can access</td><td valign="top" width="300">Can access via closure</td></tr><tr><td valign="top" width="124">Nesting</td><td valign="top" width="210">Can be nested</td><td valign="top" width="300">Can be nested</td></tr><tr><td valign="top" width="124">Equality</td><td valign="top" width="210">Can be testable</td><td valign="top" width="300">Can be testable</td></tr></tbody></table>