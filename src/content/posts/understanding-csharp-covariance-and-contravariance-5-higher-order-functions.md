---
title: "Understanding C# Covariance And Contravariance (5) Higher-order functions"
published: 2009-08-31
description: "Understanding C# Covariance And Conreavariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: "C#"
draft: false
lang: ""
---

Understanding C# Covariance And Conreavariance:

-   [Understanding C# Covariance And Contravariance (1) Delegates](/posts/understanding-csharp-covariance-and-contravariance-1-delegates)
-   [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces)
-   [Understanding C# Covariance And Contravariance (3) Samples](/posts/understanding-csharp-covariance-and-contravariance-3-samples)
-   [Understanding C# Covariance And Contravariance (4) Arrays](/posts/understanding-csharp-covariance-and-contravariance-4-arrays)
-   Understanding C# Covariance And Contravariance (5) Higher-order Functions
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

[Higher-order functions](http://en.wikipedia.org/wiki/Higher-order_function) are functions which either take one or more functions as input, or output a function. The other functions are called first-order functions.

```csharp
public static partial class HigherOrder
{
    public static void FirstOrderAndHigherOrder()
    {
        { Action action = () => { }; } // First-order function.
        Action<Action> actionIn = action => action(); // Higher-order function

        Func<object> func = () => new object(); // First-order function.
        Func<Func<object>> funcOut = () => func; // Higher-order function
    }
}
```

So far, all the covariance/contravariance demonstrations are using first-order functions. For example:

```csharp
public static partial class HigherOrder
{
    // System.Action<T>.
    public delegate void Action<in TIn>(TIn @in);

    public static void ContravarianceForFirstOrder()
    {
        // First-order functions.
        Action<Derived> derivedIn = (Derived @in) => { };
        Action<Base> baseIn = (Base @in) => { };

        // Contravariance of input: Action<Base> "is a" Action<Derived>.
        // Or: T is contravariant for Action<in T>.
        derivedIn = baseIn;
    }
}
```

Most LINQ query methods are higher-order functions. In the fore mentioned example:

```csharp
public static partial class LinqToObjects
{
    public static IEnumerable<int> Positive(IEnumerable<int> source)
    {
        return source.Where(value => value > 0);
    }
}
```

the lambda expression is a anonymous first-order function, and Where is a higher-order function.

## Variance of input

The following delegate type:

```csharp
public delegate void ActionIn<T>(Action<T> action);
```

can represent a higher-order function type, which take a function as parameter.

Regarding T for Action<T> is contravariant, is T still contravariant for ActionIn<T>? The answer is no. The following code cannot be compiled:

```csharp
public static partial class HigherOrder
{
#if Uncompilable
    public delegate void ActionIn<in T>(Action<T> action);

    public static void ContravarianceOfInput()
    {
        // Higher-order funcitons:
        ActionIn<Derived> derivedInIn = (Action<Derived> derivedIn) => derivedIn(new Derived());
        ActionIn<Base> baseInIn = (Action<Base> baseIn) => baseIn(new Base());

        // Regarding Action<Base> "is a" ActionIn<Derived>,
        // assumes there is still contravariance of input,
        // which is, ActionIn<Base> "is a" ActionIn<Derived>
        derivedInIn = baseInIn;

        // When calling baseInIn, derivedInIn executes.
        // baseInIn should have a Action<Base> input, while derivedInIn requires a Action<Derived> input.
        // The actual Action<Base> "is a" required Action<Derived>. This binding should always works.
        baseInIn(new Action<Base>((Base @in) => { }));
    }
#endif
}
```

What is the problem here? And how to fix?

## Revisit covariance and contravariance

First, covariance/contravariance can be viewed in another way:

-   Func<T>: Derived “is a” Base => Func<Derived> “is a” Func<Base>. This is named covariance (not out-variance) because the direction of “is a” relationship remains.
-   Action<T>: Derived “is a” Base => Action<Base> “is a” Action<Derived>. This is named contravariance (not in-variance) because the direction of “is a” relationship reverses.
    -   In the original “is a” relationship, Derived is on the left side, Base is on the right side
    -   In the new “is a” relationship, Derived goes to the right, and Base goes to the left

To examine the variance for higher-order functions:

-   Func<T> can be made higher order, by just replacing T with Func<T>. Then:
    1.  Derived “is a” Base
    2.  \=> Func<Derived> “is a” Func<Base> (In Func<T>, replaces T with Derived/Base. Comparing to 1, T is covariant for Func<T>.)
    3.  \=> Func<Func<Derived>> “is a” Func<Func<Derived>> (In Func<T>, replaces T with Func<Derived>/Func<Base>. Comparing to 1, T is covariant for Func<Func<T>>.)
    4.  \=> Func<Func<Func<Derived>>> “is a” Func<Func<Func<Base>>> (In Func<T>, replaces T with Func<Func<Derived>> /Func<Func<Base>> . Comparing to 1, T is covariant for Func<Func<Func<T>>>.)
    5.  \=> …
-   Action<T> can be made higher order, by just replacing T with Action<T>. Then:
    1.  Derived “is a” Base
    2.  \=> Action<Base> “is a” Action<Derived> (In Action<T>, replaces T with Base/Derived. the direction of “Is-a” relationship reverses. Comparing to 1, T is contravariant for Action<T>.)
    3.  \=> Action<Action<Derived>> “is a” Action<Action<Base>> (In Action<T>, replaces T with Action<Derived>/Action<Base>. the direction of “Is-a” relationship reverses again, so that Derived goes back to left, and Base goes back to right. Comparing to 1, T is covariant for Action<Action<T>>.)
    4.  \=> Action<Action<Action<Base>>> “is a” Action<Action<Action<Derived>>> (In Action<T>, replaces T with Action<Action<Base>> /Action<Action<Derived>>. Comparing to 1, T is contravariant for Action<Action<Action<T>>>.)
    5.  \=> …

In above code, ActionIn<T> is equivalent to Action<Action<T>>. So, T is covariant for Action<Action<T>>/ActionIn<T>, not contravariant. The fix is to use out keyword to decorate T, and swap the binding:

```csharp
public static partial class HigherOrder
{
    // Action<Action<T>>
    public delegate void ActionIn<out T>(Action<T> action);

    public static void CovarianceOfInput() // Not contravariance.
    {
        // Higher-order funcitons:
        ActionIn<Derived> derivedInIn = (Action<Derived> derivedIn) => derivedIn(new Derived());
        ActionIn<Base> baseInIn = (Action<Base> baseIn) => baseIn(new Base());

        // Not derivedInIn = baseInIn;
        baseInIn = derivedInIn;

        // When calling baseInIn, derivedInIn executes.
        // baseInIn should have a Action<Base> input, while derivedInIn requires a Action<Derived> input.
        // The actual Action<Base> "is a" required Action<Derived>. This binding always works.
        baseInIn(new Action<Base>((Base @in) => { }));
    }
}
```

The other case, type parameter as output, is straightforward, because the type parameter is always covariant for any first-order/higher-order function:

```csharp
public static partial class HigherOrder
{
    public delegate Func<TOut> FuncOut<out TOut>();

    public static void CovarianceOfOutput()
    {
        // First order functions.
        Func<Base> baseOut = () => new Base();
        Func<Derived> derivedOut = () => new Derived();
        // T is covarianct for Func<T>.
        baseOut = derivedOut;

        // Higher-order funcitons:
        FuncOut<Base> baseOutOut = () => baseOut;
        FuncOut<Derived> derivedOutOut = () => derivedOut;

        // Covariance of output: FuncOut<Derived> "is a" FuncOut<Base>
        baseOutOut = derivedOutOut;

        // When calling baseOutOut, derivedOutOut executes.
        // baseOutOut should output a Func<Base>, while derivedOutOut outputs a Func<Derived>.
        // The actual Func<Derived> "is a" required Func<Base>. This binding always works.
        baseOut = baseOutOut();
    }
}
```

## Variances for higher-order function

Variances are straightforward for first-order functions:

-   Covariance of output (out keyword): Derived “is a” Base => Func<Derived> “is a” Func<Base> (“Is-a” remains.)
-   Contravariance of input (in keyword): Derived “is a” Base => Action<Base> “is a” Action<Derived> (“Is-a” reverses.)

For higher-order functions:

-   Output is always covariant:
    -   Derived “is a” Base
    -   \=> Func<Derived> “is a” Func<Base>
    -   \=> Func<Func<Derived>> “is a” Func<Func<Derived>>
    -   \=> …
-   Input can be either contravariant or covariant, depends on how many times the direction of “is-a” relationship reverses:
    1.  Derived “is a” Base
    2.  \=> Action<Base> “is a” Action<Derived> (contravariance)
    3.  \=> Action<Action<Derived>> “is a” Action<Action<Base>> (covariance)
    4.  \=> Action<Action<Action<Base>>> “is a” Action<Action<Action<Derived>>> (contravariance)
    5.  \=> …

```csharp
public static class OutputCovarianceForHigherOrder
{
    public delegate T Func<out T>(); // Covariant T as output.

    // Func<Func<T>>
    public delegate Func<T> FuncOut<out T>(); // Covariant T as output.

    // Func<Func<Func<T>>>
    public delegate FuncOut<T> FuncOutOut<out T>(); // Covariant T as output.

    // Func<Func<Func<Func<T>>>>
    public delegate FuncOutOut<T> FuncOutOutOut<out T>(); // Covariant T as output.

    // ...
}

public static class InputVarianceReversalForHigherOrder
{
    public delegate void Action<in T>(T @in); // Contravariant T as input.

    // Action<Action<T>>
    public delegate void ActionIn<out T>(Action<T> action); // Covariant T as input.

    // Action<Action<Action<T>>>
    public delegate void ActionInIn<in T>(ActionIn<T> actionIn); // Contravariant T as input.

    // Action<Action<Action<Action<T>>>>
    public delegate void ActionInInIn<out T>(ActionInIn<T> actionInIn); // Covariant T as input.

    // ...
}
```