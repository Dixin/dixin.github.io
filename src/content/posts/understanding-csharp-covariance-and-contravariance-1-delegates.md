---
title: "Understanding C# Covariance and Contravariance (1) Delegates"
published: 2009-08-29
description: "Understanding C# Covariance And Conreavariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# Covariance And Conreavariance:

-   Understanding C# Covariance And Contravariance (1) Delegates
-   [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces)
-   [Understanding C# Covariance And Contravariance (3) Samples](/posts/understanding-csharp-covariance-and-contravariance-3-samples)
-   [Understanding C# Covariance And Contravariance (4) Arrays](/posts/understanding-csharp-covariance-and-contravariance-4-arrays)
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

In [Covariance/contravariance](https://en.wikipedia.org/wiki/Covariance_and_contravariance_\(computer_science\)), variance is the capability to replace a type with a less-derived type or a more-derived type in a context. C# 4.0 and CLR 4 introduced covariance and contravariance for generics.

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
```
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
```
public delegate Base DerivedIn_BaseOut(Derived @in);
```

Above Methods.DerivedIn\_BaseOut’s signature matches this delegate type, so Methods.DerivedIn\_BaseOut can be bound to its delegate instance:
```
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
```
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
```
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
```
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
```
public static partial class NonGenericDelegate
{
    public delegate Derived BaseIn_DerivedOut(Base @base);

    public static void InvalidVariance()
    {
#if Uncompilable
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
```
public delegate TOut Func<TIn, TOut>(TIn @in);
```

Then above method bindings become:
```
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
```
public static partial class GenericDelegate
{
    public static void BindLambdas()
    {
        Func<Derived, Base> derivedIn_BaseOut = (Derived @in) => new Base();
        Func<Derived, Derived> derivedIn_DerivedOut = (Derived @in) => new Derived();
        Func<Base, Base> baseIn_BaseOut = (Base @in) => new Base();
        Func<Base, Derived> baseIn_DerivedOut = (Base @in) => new Derived();

#if Uncompilable
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
```
public delegate TOut Func<in TIn, out TOut>(TIn @in);
```

Now the bindings work for both methods and lambda expressions:
```
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
```
public static partial class GenericDelegateWithVariances
{
#if Uncompilable
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