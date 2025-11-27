---
title: "Understanding C# Covariance And Contravariance (2) Interfaces"
published: 2009-08-30
description: "Understanding C# Covariance And Conreavariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# Covariance And Conreavariance:

-   [Understanding C# Covariance And Contravariance (1) Delegates](/posts/understanding-csharp-covariance-and-contravariance-1-delegates)
-   Understanding C# Covariance And Contravariance (2) Interfaces
-   [Understanding C# Covariance And Contravariance (3) Samples](/posts/understanding-csharp-covariance-and-contravariance-3-samples)
-   [Understanding C# Covariance And Contravariance (4) Arrays](/posts/understanding-csharp-covariance-and-contravariance-4-arrays)
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

In C# 4.0+, covariance and contravariance are used for generic interfaces. Covariance and contravariance

An interface can be viewed as a set of method signatures, for example:
```
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

## Covariance

For interface IOut<TOut>, TOut is covariant for all members, so TOut can be made covariant at interface level:
```
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
```
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

## Covariance and contravariance

A generic interface can have both covariant and contravariance type parameters, for example:
```
public interface IIn_Out<in TIn, out TOut>
{
    void In(TIn @in);
    TOut Out();
}
```

Then:
```
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

## Invariance

In the following generic interface:
```
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

## Is-a relationship of generic interfaces

The “is-a” relationship can be promoted to generic interfaces (sets of method signatures):

-   Covariance: Derived is a Base => IOut<Derived> "is a" IOut<Base>;
-   Contravariance: Derived is a Base => IIn<Base> "is a" IIn<Derived>;
-   Covariance and contravariance: Derived is a Base => IIn\_Out<Base, Derived> "is a" IIn\_Out<Derived, Base>.