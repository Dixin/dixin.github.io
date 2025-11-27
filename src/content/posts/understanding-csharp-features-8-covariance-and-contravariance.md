---
title: "Understanding C# Features (8) Covariance and Contravariance"
published: 2016-02-06
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 4.0", "C# Features", "Covariance And Contravariance", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

In [covariance/contravariance](https://en.wikipedia.org/wiki/Covariance_and_contravariance_\(computer_science\)), variance is the capability to replace a type with a less-derived type or a more-derived type in a context. C# 4.0 and CLR 4 introduced covariance and contravariance for generics.

## Is-a relationship for inheritance

Since covariance and contravariance is about deriving, the following [inheritance hierarchy](https://msdn.microsoft.com/en-us/library/27db6csx.aspx) is defined:

```csharp
public class Base
{
}

public class Derived : Base
{
}
```

Apparently, a Derived object “[is a](https://en.wikipedia.org/wiki/Is-a)” Base object.

## Non-generic delegate

By using above Base/Derived as input/output of method, there are 4 combinations:

```csharp
public static class Methods
{
    public static Base DerivedIn_BaseOut(Derived @in)
    {
        return new Base();
    }

    public static Derived DerivedIn_DerivedOut(Derived @in)
    {
        return new Derived();
    }

    public static Base BaseIn_BaseOut(Base @in)
    {
        return new Base();
    }

    public static Derived BaseIn_DerivedOut(Base @in)
    {
        return new Derived();
    }
}
```

### Bind method to a delegate

Before C# 4.0, C# already supported covariance and contravariance for delegates without generics. Consider the following delegate type:

```csharp
public delegate Base DerivedIn_BaseOut(Derived @in);
```

Above Methods.DerivedIn\_BaseOut’s signature matches this delegate type, so Methods.DerivedIn\_BaseOut can be bound to its delegate instance:

```csharp
public static partial class NonGenericDelegate
{
    public static void Bind()
    {
        // Binding: DerivedIn_BaseOut delegate type and DerivedIn_BaseOut method have exactly the same signature.
        DerivedIn_BaseOut derivedIn_BaseOut = Methods.DerivedIn_BaseOut;

        // When calling derivedIn_BaseOut delegate instance, DerivedIn_BaseOut method executes.
        Base @out = derivedIn_BaseOut(@in: new Derived());
    }
}
```

### Covariance

Methods.DerivedIn\_DerivedOut has a different signature from DerivedIn\_BaseOut delegate type. The former returns a more derived type. There is a “is-a” relationship between their return types, but there is no intuitive relationship between the two signatures.

However, C# compiler and the CLR both allow the following binding (assignment) before C# 4.0:

```csharp
public static partial class NonGenericDelegate
{
    public static void Covariance()
    {
        // Covariance: Derived "is a" Base => DerivedIn_DerivedOut "is a" DerivedIn_BaseOut.
        DerivedIn_BaseOut derivedIn_DerivedOut = Methods.DerivedIn_DerivedOut;

        // When calling derivedIn_BaseOut delegate instance, DerivedIn_DerivedOut method executes.
        // derivedIn_BaseOut should output a Base object, while DerivedIn_DerivedOut outputs a Derived object.
        // The actual Derived object "is a" required Base output. This binding always works.
        Base @out = derivedIn_DerivedOut(@in: new Derived());
    }
}
```

Here a bound method can return a more derived type than the delegate type. This is called covariance.

### Contravariance

Methods.BaseIn\_BaseOut required a less-derived parameter then DerivedIn\_BaseOut delegate type. The following binding also works before C# 4.0:

```csharp
public static partial class NonGenericDelegate
{
    public static void Contravariance()
    {
        // Contravariance: Derived is a Base => BaseIn_BaseOut is a DerivedIn_BaseOut.
        DerivedIn_BaseOut derivedIn_BaseOut = Methods.BaseIn_BaseOut;

        // When calling derivedIn_BaseOut delegate instance, BaseIn_BaseOut method executes.
        // derivedIn_BaseOut should have a Derived input, while BaseIn_BaseOut requires a Base input.
        // The actual Derived object "is a" required Base input. This binding always works.
        Base @out = derivedIn_BaseOut(@in: new Derived());
    }
}
```

Here a method can have less derived parameter type than the delegate type. This is called contravariance.

### Covariance and contravariance

It is easy to predict, Methods.BaseIn\_DerivedOut, with more derived parameter type and less derived return type, can be also bound to DerivedIn\_BaseOut:

```csharp
public static partial class NonGenericDelegate
{

    public static void CovarianceAndContravariance()
    {
        // Covariance and contravariance: Derived is a Base => BaseIn_DerivedOut is a DerivedIn_BaseOut. 
        DerivedIn_BaseOut derivedIn_BaseOut = Methods.BaseIn_DerivedOut;

        // When calling derivedInBaseOut delegate instance, BaseIn_DerivedOut method executes.
        // derivedIn_BaseOut should have a Derived input, while BaseIn_DerivedOut requires a Base input.
        // derivedIn_BaseOut should output a Base object, while BaseIn_DerivedOut outputs a Derived object. 
        // This binding always works.
        Base @out = derivedIn_BaseOut(@in: new Derived());
    }
}
```

Here covariance and contravariance both happen for the same binding.

### Invalid variance

In the following bindings, there is no valid variance, so they cannot be compiled:

```csharp
public static partial class NonGenericDelegate
{
    public delegate Derived BaseIn_DerivedOut(Base @base);

    public static void InvalidVariance()
    {
#if ERROR
        // baseIn_DerivedOut should output a Derived object, while BaseIn_DerivedOut outputs a Base object. 
        // Base is not Derived, the following binding cannot be compiled.
        BaseIn_DerivedOut baseIn_DerivedOut1 = Methods.BaseIn_BaseOut;

        // baseIn_DerivedOut should have a Base input, while DerivedIn_BaseOut required a Derived output.
        // Base is not a Derived, the following binding cannot be compiled.
        BaseIn_DerivedOut baseIn_DerivedOut2 = Methods.DerivedIn_BaseOut;

        // baseIn_DerivedOut should have a Base input, while DerivedIn_DerivedOut required a Derived input.
        // baseIn_DerivedOut should output a Derived object, while derivedIn_DerivedOut outputs a Base object. 
        // Base is not a Derived, the following binding cannot be compiled.
        BaseIn_DerivedOut baseIn_DerivedOut3 = Methods.DerivedIn_DerivedOut;
#endif
    }
}
```

### Is-a relationship of delegates

The root of variances is that, in inheritance hierarchy, derived object “is a” base object. This “is-a” relationship can be promoted to a relationship between method and delegate types:

-   Covariance of output: Derived is a Base => DerivedIn\_DerivedOut is a DerivedIn\_BaseOut;
-   Contravariance of input: Derived is a Base => BaseIn\_BaseOut is a DerivedIn\_BaseOut;
-   Covariance of output and contravariance of input: Derived is a Base => BaseIn\_DerivedOut is a DerivedIn\_BaseOut.

Please notice these rules does not apply to value types. Basically value types has nothing to do with covariance/contravariance.

## Generic delegate

With C# 2.0 generic delegate, the above XxxIn\_XxxOut delegate types can be represented by the following:

```csharp
public delegate TOut Func<TIn, TOut>(TIn @in);
```

Then above method bindings become:

```csharp
public static partial class GenericDelegateWithVariances
{
    public static void BindMethods()
    {
        // Bind.
        Func<Derived, Base> derivedIn_BaseOut1 = Methods.DerivedIn_BaseOut;

        // Covariance.
        Func<Derived, Base> derivedIn_BaseOut2 = Methods.DerivedIn_DerivedOut;

        // Contravariance.
        Func<Derived, Base> derivedIn_BaseOut3 = Methods.BaseIn_BaseOut;

        // Covariance and contravariance.
        Func<Derived, Base> derivedIn_BaseOut4 = Methods.BaseIn_DerivedOut;
    }
}
```

C# 3.0 introduced lambda expression. However, the above bindings cannot be used for lambda expression:

```csharp
public static partial class GenericDelegate
{
    public static void BindLambdas()
    {
        Func<Derived, Base> derivedIn_BaseOut = (Derived @in) => new Base();
        Func<Derived, Derived> derivedIn_DerivedOut = (Derived @in) => new Derived();
        Func<Base, Base> baseIn_BaseOut = (Base @in) => new Base();
        Func<Base, Derived> baseIn_DerivedOut = (Base @in) => new Derived();

#if ERROR
        // Covariance.
        derivedIn_BaseOut = derivedIn_DerivedOut;

        // Contravariance.
        derivedIn_BaseOut = baseIn_BaseOut;

        // Covariance and contravariance.
        derivedIn_BaseOut = baseIn_DerivedOut;
#endif
    }
}
```

### The out and in keywords

C# 4.0 uses the in/out keywords to specify a type parameter is contravariant/covariant. So above generic delegate can be defined as:

```csharp
public delegate TOut Func<in TIn, out TOut>(TIn @in);
```

Now the bindings work for both methods and lambda expressions:

```csharp
public static partial class GenericDelegateWithVariances
{
    public static void BindMethods()
    {
        // Bind.
        Func<Derived, Base> derivedIn_BaseOut1 = Methods.DerivedIn_BaseOut;

        // Covariance.
        Func<Derived, Base> derivedIn_BaseOut2 = Methods.DerivedIn_DerivedOut;

        // Contravariance.
        Func<Derived, Base> derivedIn_BaseOut3 = Methods.BaseIn_BaseOut;

        // Covariance and contravariance.
        Func<Derived, Base> derivedIn_BaseOut4 = Methods.BaseIn_DerivedOut;
    }

    public static void BindLambdas()
    {
        Func<Derived, Base> derivedIn_BaseOut = (Derived @in) => new Base();
        Func<Derived, Derived> derivedIn_DerivedOut = (Derived @in) => new Derived();
        Func<Base, Base> baseIn_BaseOut = (Base @in) => new Base();
        Func<Base, Derived> baseIn_DerivedOut = (Base @in) => new Derived();

        // Covariance.
        derivedIn_BaseOut = derivedIn_DerivedOut;

        // Contravariance.
        derivedIn_BaseOut = baseIn_BaseOut;

        // Covariance and ontravariance.
        derivedIn_BaseOut = baseIn_DerivedOut;
    }
}
```

The in/out keywords also constrains the usage of the decorated type parameter to guarantee the variances. The following generic delegate types are invalid and cannot be compiled:

```csharp
public static partial class GenericDelegateWithVariances
{
#if ERROR
    // CS1961 Invalid variance: The type parameter 'TOut' must be covariantly valid on 'GenericDelegateWithVariances.Func<TOut>.Invoke()'. 'TOut' is contravariant.
    public delegate TOut Func<in TOut>();

    // CS1961 Invalid variance: The type parameter 'TIn' must be contravariantly valid on 'GenericDelegateWithVariances.Action<TIn>.Invoke(TIn)'. 'TIn' is covariant.
    public delegate void Action<out TIn>(TIn @in);

    // CS1961 Invalid variance: The type parameter 'TOut' must be covariantly valid on 'GenericDelegateWithVariances.Func<TIn, TOut>.Invoke(TIn)'. 'TOut' is contravariant.
    // CS1961 Invalid variance: The type parameter 'TIn' must be contravariantly valid on 'GenericDelegateWithVariances.Func<TIn, TOut>.Invoke(TIn)'. 'TIn' is covariant.
    public delegate TOut Func<out TIn, in TOut>(TIn @in);
#endif
}
```

So far, it looks in is only for input, and out is only for output. In .NET 4.0+:

```csharp
namespace System
{
    public delegate TOut Func<out TOut>();

    public delegate TOut Func<out TOut, in TIn>(TIn @in);

    public delegate TOut Func<out TOut, in TIn1, in TIn2>(TIn1 in1, TIn2 in2);

    public delegate TOut Func<out TOut, in TIn1, in TIn2, in TIn3>(TIn1 in1, TIn2 in2, TIn3 in3);
    
    // ...

    public delegate void Action<in TIn>(TIn @in);

    public delegate void Action<in TIn1, in TIn2>(TIn1 in1, TIn2 in2);

    public delegate void Action<in TIn1, in TIn2, in TIn3>(TIn1 in1, TIn2 in2, TIn3 in3);

    // ...
}
```

The type parameter is renamed to be more intuitive.

## Higher-order function

So far all the discussion are about first-order function. The variances of higher-order function could be more interesting.

### Variance of input

The following delegate type:

```csharp
public delegate void ActionIn<T>(Action<T> action);
```

can represent a higher-order function type, which take a function as parameter.

Regarding T for Action<T> is contravariant, is T still contravariant for ActionIn<T>? The answer is no. The following code cannot be compiled:

```csharp
public static partial class HigherOrderFunction
{
#if ERROR
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

### Revisit covariance and contravariance

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
public static partial class HigherOrderFunction
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
public static partial class HigherOrderFunction
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

### Variances for higher-order function

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

## Generic interface

In C# 4.0+, covariance and contravariance are used for generic interfaces. Covariance and contravariance

An interface can be viewed as a set of method signatures, for example:

```csharp
public interface IOut<TOut> // TOut is only used as output.
{
    TOut Out1(); // TOut is covariant for Out1 (Func<TOut>).

    TOut Out2(object @in); // TOut is covariant for Out2 (Func<object, TOut>).

    TOut Out3 { get; } // TOut is covariant for Out3's getter (Func<object, TOut>).
}

public interface IIn<TIn> // TIn is only used as input.
{
    void In1(TIn @in); // TIn is contravariant for In1 (Action<TIn>).

    object In2(TIn @in); // TIn is contravariant for In2 (Func<TIn, object>).

    TIn In3 { set; } // TIn is contravariant for In3's setter (Action<TIn>).
}
```

### Covariance

For interface IOut<TOut>, TOut is covariant for all members, so TOut can be made covariant at interface level:

```csharp
public interface IOut<out TOut> // TOut is covariant for all members of interface.
{
    TOut Out1();

    TOut Out2(object @in);

    TOut Out3 { get; } // TOut get_Out3();
}
```

Then the following interface binding (assignment) works:

```typescript
public static partial class GenericInterfaceWithVariances
{
    public static void Covariance()
    {
        IOut<Base> baseOut = default(IOut<Base>);
        IOut<Derived> derivedOut = default(IOut<Derived>);

        // Covariance: Derived "is a" Base => IOut<Derived> "is a" IOut<Base>.
        baseOut = derivedOut;

        // So that, when calling baseOut.Out1, the underlying derivedOut.Out1 executes.
        // derivedOut.Out1 method (Func<Derived>) "is a" baseOut.Out1 method (Func<Base>).
        Base out1 = baseOut.Out1();

        // When calling baseOut.Out2, the underlying derivedOut.Out2 executes.
        // derivedOut.Out2 (Func<object, Derived>) "is a" baseOut.Out2 (Func<object, Base>).
        Base out2 = baseOut.Out2(@in: new object());

        // Out3 property is getter only. The getter is a get_Out3 method (Func<TOut>).
        // derivedOut.Out3 getter (Func<Derived>) "is a" baseOut.Out3 getter (Func<Base>).
        Base out3 = baseOut.Out3;

        // So, IOut<Derived> interface "is an" IOut<Base> interface. Above binding always works.
    }
}
```

In .NET 4.0+, System.Collections.Generic.IEnumerator<T> is such an interface:

```csharp
namespace System.Collections.Generic
{
    /// <summary>Supports a simple iteration over a generic collection.</summary>
    /// <typeparam name="T">The type of objects to enumerate.This type parameter is covariant. That is, you can use either the type you specified or any type that is more derived. For more information about covariance and contravariance, see Covariance and Contravariance in Generics.</typeparam>
    public interface IEnumerator<out T> : IDisposable, IEnumerator
    {
        T Current { get; }
    }
}
```

### Contravariance

For interface IIn<TIn>, TIn is contravariant for all members, so TIn can be made contravariant at interface level:

```csharp
public interface IIn<in TIn> // TIn is contravariant for all members of interface.
{
    void In1(TIn @in);

    object In2(TIn @in);

    TIn In3 { set; } // void set_In3(TIn @in);
}
```

Then the following interface binding works:

```typescript
public static partial class GenericInterfaceWithVariances
{
    public static void Contravariance()
    {
        IIn<Derived> derivedIn = default(IIn<Derived>);
        IIn<Base> baseIn = default(IIn<Base>);

        // Contravariance: Derived "is a" Base => IIn<Base> "is a" IIn<Derived>.
        derivedIn = baseIn;

        // When calling derivedIn.In1, the underlying baseIn.In1 executes.
        // baseIn.In1 method (Action<Base>) "is a" derivedIn.In1 method (Action<Derived>).
        derivedIn.In1(new Derived());

        // When calling derivedIn.In2, the underlying baseIn.In2 executes.
        // baseIn.In2 (Func<Base, object>) "is a" derivedIn.In2 (Func<Derived, object>).
        object @out = derivedIn.In2(new Derived());

        // In3 property is setter only. The setter is a set_In3 method (Action<TOut>).
        // baseIn.In3 setter (Action<Base>) "is a" derivedIn.In3 setter (Action<Base>).
        derivedIn.In3 = new Derived();

        // So, IIn<Base> interface "is an" IIn<Derived> interface. Above binding always works.
    }
}
```

In .NET 4.0+, System.IComparable<T> is such an interface:

```csharp
namespace System
{
    /// <summary>Defines a generalized comparison method that a value type or class implements to create a type-specific comparison method for ordering instances.</summary>
    /// <typeparam name="T">The type of objects to compare.This type parameter is contravariant. That is, you can use either the type you specified or any type that is less derived. For more information about covariance and contravariance, see Covariance and Contravariance in Generics.</typeparam>
    public interface IComparable<in T>
    {
        int CompareTo(T other);
    }
}
```

### Covariance and contravariance

A generic interface can have both covariant and contravariance type parameters, for example:

```csharp
public interface IIn_Out<in TIn, out TOut>
{
    void In(TIn @in);
    TOut Out();
}
```

Then:

```csharp
public static partial class GenericInterfaceWithVariances
{
    public static void CovarianceAndContravariance()
    {
        IIn_Out<Derived, Base> derivedIn_BaseOut = default(IIn_Out<Derived, Base>);
        IIn_Out<Base, Derived> baseIn_DerivedOut = default(IIn_Out<Base, Derived>);

        // Covariance and contravariance: IIn_Out<Base, Derived> "is a" IIn_Out<Derived, Base>.
        derivedIn_BaseOut = baseIn_DerivedOut;
    }
}
```

### Invariance

In the following generic interface:

```csharp
public interface IIn_Out<T>
{
    T Out(); // T is covariant for Out (Func<T>).

    void In(T @in); // T is contravaraint for In (Action<T>).
}
```

T is not covariant for some member, and not contravariant for some other member. So, T cannot be variant at the interface level. In .NET, System.Collections.Generic.IList<T> is such an interface:

```csharp
namespace System.Collections.Generic
{
    public interface IList<T> : ICollection<T>, IEnumerable<T>, IEnumerable
    {
        T this[int index]
        {
            get; // T is covariant.
            set; // T is contravariant.
        }

        // Other members.
    }
}
```

### Is-a relationship of generic interfaces

The “is-a” relationship can be promoted to generic interfaces (sets of method signatures):

-   Covariance: Derived is a Base => IOut<Derived> "is a" IOut<Base>;
-   Contravariance: Derived is a Base => IIn<Base> "is a" IIn<Derived>;
-   Covariance and contravariance: Derived is a Base => IIn\_Out<Base, Derived> "is a" IIn\_Out<Derived, Base>.

## Array

An array T\[\] can be viewed as an IList<T>. As fore mentioned, T is invariant for IList<T>.

### Covariance

C# unexpectedly support covariance for array:

```csharp
public static partial class Array
{
    public static void Covariance()
    {
        // IList<Base> baseArray = new Base[2];
        Base[] baseArray = new Base[2];

        // IList<Derived> derivedArray = new Derived[3];
        Derived[] derivedArray = new Derived[2];

        // T of IList<T> is invariant,
        // so logically binding IList<derivedArray> to IList<Base> could not be compiled.
        // But C# compiles it, to be compliant with Java :(
        baseArray = derivedArray; // Array covariance.

        // At runtime, baseArray refers to a Derived array.
        // So A Derived object can be an element of baseArray[0].
        baseArray[0] = new Derived();

        // At runtime, baseArray refers to a Derived array.
        // A Base object "is not a" Derivd object.
        // And ArrayTypeMismatchException is thrown at runtime.
        baseArray[1] = new Base();
    }
}
```

The above code can be compiled but throws ArrayTypeMismatchException at runtime. In some scenarios, this can be confusing and makes code buggy. For example, when using array as parameter:

```csharp
public static partial class Array
{
    public static void ProcessArray(Base[] array)
    {
        array[0] = new Base(); // ArrayTypeMismatchException.
        }

    public static void CallProcessArray()
    {
        Derived[] array = new Derived[1];
        ProcessArray(array); // Array covariance. Compliable.
    }
}
```

As fore mentioned, value type has nothing to do with variances, the following code cannot be compiled:

```csharp
public static partial class Array
{
    public static void ValueType()
    {
        object[] objectArray = new object[1];
        int[] int32Array = new int[1];
#if ERROR
        // No covariance.
        objectArray = int32Array;
#endif
    }
}
```

### Comments

Here are some comments for array covariance:

-   [Jonathan Allen said](http://www.infoq.com/news/2008/08/GenericVariance),
    
    > On a historical note, C# and VB both support array covariance ([out/IEnumerable scenario](http://www.cnblogs.com/dixin/archive/2009/09/01/understanding-csharp-covariance-and-contravariance-6-typing-issues.html)) even though it can lead to runtime errors in contravariant situations (in/IWriter scenario). This was done in order to make C# more compatible with Java. This is generally considered a poor decision, but it cannot be undone at this time.
    
-   In the book “[The Common Language Infrastructure Annotated Standard](http://www.amazon.com/exec/obidos/tg/detail/-/0321154932)”, Jim Miller said,
    
    > The decision to support covariant arrays was primarily to allow Java to run on the VES. The covariant design is not thought to be the best design in general, but it was chosen in the interest of broad reach.
    
-   [Rick Byers said](http://blogs.msdn.com/rmbyers/archive/2005/02/16/375079.aspx),
    
    > I've heard that Bill Joy, one of the original Java designers, has since said that he tried to remove array covariance in 1995 but wasn't able to do it in time, and has regretted having it in Java ever since.
    
-   Anders Hejlsberg ([chief architect](http://en.wikipedia.org/wiki/Anders_Hejlsberg) of C#) [said in this video](http://channel9.msdn.com/shows/Going+Deep/Expert-to-Expert-Anders-Hejlsberg-The-Future-of-C/),
    
    > This isn't type safe. A lot of people maybe don't even realize that there's a hole there.
    
-   [Eric Lippert](http://ericlippert.com/) (member of C# design team) [put array covariance the top 1 of 10 worst C# features](http://www.informit.com/articles/article.aspx?p=2425867)
    
    > C# 1.0 has unsafe array covariance not because the designers of C# thought that the scenario was particularly compelling, but rather because the Common Language Runtime (CLR) has the feature in its type system, so C# gets it "for free." The CLR has it because Java has this feature; the CLR team wanted to design a runtime that could implement Java efficiently, should that become necessary.
    

This is a C# feature that should never be used.

## Compilation

C# 3.0 features are C# level syntactical sugars provided by C# compiler, but the covariance/contravariance is a feature of C# 4.0/CLR 4. The ore mentioned System.Func<in TIn, out TOut> generic delegate is compiled to following IL:

```csharp
.class public auto ansi sealed System.Func`2<-TIn, +TOut>
       extends System.MulticastDelegate
{
}
```

and the definition of System.IComparable<in T>:

```csharp
.class interface public abstract auto ansi System.IComparable`1<-T>
{
}
```

C#’s out/in decorators is compiled to CLR’s +/- operators, which is more difficult to remember, [even for the members of the C# design committee](http://blogs.msdn.com/ericlippert/archive/2007/10/31/covariance-and-contravariance-in-c-part-eight-syntax-options.aspx). +/- can be read as “’is-a’ direction remains/reverses”.

## Variances in .NET

Not many generic types in .NET have variant type parameter(s). LINQ can be uses to query these generic types from .NET libraries.

The following method queries a specified directory, and retrieve all .NET assemblies:

```csharp
public static partial class ReflectionHelper
{
    public static IEnumerable<Assembly> GetAssemblies(string directory)
    {
        return Directory.EnumerateFiles(directory, "*.dll")
            .Select(file =>
                {
                    try
                    {
                        return Assembly.LoadFrom(file);
                    }
                    catch (BadImageFormatException)
                    {
                        return null;
                    }
                })
            .Where(assembly => assembly != null);
    }
}
```

The following method queries one specified assembly, and filter generic types with any variant type parameter:

```csharp
public static partial class ReflectionHelper
{
    public static IEnumerable<Type> GetTypesWithVariance(Assembly assembly)
    {
        try
        {
            return assembly.ExportedTypes.Where(type =>
                type.IsGenericTypeDefinition && type.GetGenericArguments().Any(argument =>
                    (argument.GenericParameterAttributes & GenericParameterAttributes.Covariant)
                    == GenericParameterAttributes.Covariant
                    ||
                    (argument.GenericParameterAttributes & GenericParameterAttributes.Contravariant)
                    == GenericParameterAttributes.Contravariant));
        }
        catch (TypeLoadException)
        {
            return Enumerable.Empty<Type>();
        }
    }
}
```

The last method queries the assemblies in the same directory of mscorlib.dll, and retrieves the wanted types, and orders them by name:

```csharp
public static partial class ReflectionHelper
{
    public static IEnumerable<Type> GetTypesWithVariance()
    {
        string mscorlibPath = typeof(object).Assembly.Location;
        string gacPath = Path.GetDirectoryName(mscorlibPath);
        return GetAssemblies(gacPath)
            .SelectMany(GetTypesWithVariance)
            .OrderBy(type => type.Name);
    }
}
```

Here is the result of executing the last method:

-   System namespace:
    -   Action\`1 to Action\`16, Func\`1 to Func\`17
    -   Comparison<T>
    -   Converter\`2
    -   IComparable<T>,
    -   IObservable<T>, IObserver<T>
    -   IProgress<T>
    -   Predicate<T>
-   System.Collections.Generic namespace:
    -   IComparer<T>, IEqualityComparer<T>
    -   IEnumerable<T>, IEnumerator<T>
    -   IReadOnlyCollection<T>, IReadOnlyList<T>
-   System.Linq namespace:
    -   IGrouping\`2
    -   IOrderedQueryable<T>, IQueryable<T>

MSDN has a [List of Variant Generic Interface and Delegate Types](https://msdn.microsoft.com/en-us/library/dd799517#VariantList), but it is inaccurate. For example, it says TElement is covariant for IOrderedEnumerable<TElement>, but actually not:

```csharp
namespace System.Linq
{
    public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
    {
        IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(Func<TElement, TKey> keySelector, IComparer<TKey> comparer, bool descending);
    }
}
```

### LINQ

As fore mentioned, T is covariant for IEnumerator<T>. As a result:

```csharp
namespace System.Collections.Generic
{
    /// <summary>Exposes the enumerator, which supports a simple iteration over a collection of a specified type.</summary>
    /// <typeparam name="T">The type of objects to enumerate.This type parameter is covariant. That is, you can use either the type you specified or any type that is more derived. For more information about covariance and contravariance, see Covariance and Contravariance in Generics.</typeparam>
    public interface IEnumerable<out T> : IEnumerable
    {
        IEnumerator<T> GetEnumerator(); // T is covariant.
    }
}
```

T is also covariant for IEnumerable<T>, since T is covariant for all member(s). In another word: Derived “is a” Base => IEnumerable<Derived> “is an” IEnumerable<Base>.

```csharp
public static partial class GenericInterfaceWithVariances
{
    public static void Linq()
    {
        IEnumerable<Derived> derivedEnumerable = Enumerable.Empty<Derived>();
        IEnumerable<Base> baseEnumerable = Enumerable.Empty<Base>();

        // IEnumerable<TSource> Concat<TSource>(this IEnumerable<TSource> first, IEnumerable<TSource> second);
        baseEnumerable = baseEnumerable.Concat(derivedEnumerable);
    }
}
```

Before C# 4.0, IEnumerable<Derived> is not an IEnumerable<Base>, above code cannot be compiled, unless explicitly telling compiler derivedEnumerable is an IEnumerable<Base>:

```csharp
baseEnumerable = baseEnumerable.Concat(derivedEnumerable.Cast<Base>());
```