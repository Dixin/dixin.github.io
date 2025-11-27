---
title: "Understanding C# Covariance And Contravariance (6) Typing issues"
published: 2009-09-01
description: "Understanding C# covariance and contravariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: "C#"
draft: false
lang: ""
---

Understanding C# covariance and contravariance:

-   [Understanding C# Covariance And Contravariance (1) Delegates](/posts/understanding-csharp-covariance-and-contravariance-1-delegates)
-   [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces)
-   [Understanding C# Covariance And Contravariance (3) Samples](/posts/understanding-csharp-covariance-and-contravariance-3-samples)
-   Understanding C# Covariance And Contravariance (4) Arrays
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

In each previous part, type implicit conversion is dicussed, which happen during the variances, like

-   function (method / delegate) conversion, as well as higher-order function conversion;
-   generic interface conversion;
-   array conversion.

Since C# 4.0 introduces new variance rules, which means in C# 4.0, types could be more convertible than C# 2.0 / 3.0, there could be potential typing issues for C# 4.0. If comparing some code between Visual Studio 2008 (C# 2.0 / 3.0) and Visual Studio 2010 Beta2 (C# 4.0), you can find that is true.

## Delegate covariance / contravariance issues

Take a look at this covariance sample:

```csharp
Func<Base> baseFunc = () => new Base();
Func<Derived> derivedFunc = () => new Derived();

// This always prints "True".
Console.WriteLine(derivedFunc is Func<Derived>);
// Covariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(derivedFunc is Func<Base>);
```

And this contravariance sample:

```csharp
Action<Base> baseAction = arg => { };
Action<Derived> derivedAction = arg => { };

// This always prints "True".
Console.WriteLine(baseAction is Action<Base>);
// Contravariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(baseAction is Action<Derived>);
```

Yes, in C# 4.0, delegate types are more convertable.

## Interface covariance / contravariance issues

This is the interface covariance on IEnumerator<out T>:

```csharp
IEnumerator<Base> baseEnumerator = new BaseEnumerator();
IEnumerator<Derived> derivedEnumerator = new DerivedEnumerator();

// This always prints "True".
Console.WriteLine(derivedEnumerator is IEnumerator<Derived>);
// Covariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(derivedEnumerator is IEnumerator<Base>);
```

It looks acceptable.

Then this is covariance on IEnumerable<out T>:

```csharp
IEnumerable<Base> bases = new Base[0];
IEnumerable<Derived> deriveds = new Derived[0];

// This always prints "True".
Console.WriteLine(deriveds is IEnumerable<Derived>);
// Covariance is supported by C# 4.0.
// This prints "True" in C# 2.0 / 3.0 / 4.0.
Console.WriteLine(deriveds is IEnumerable<Base>);
```

Looks like a big mess.

To try interface contravariance, IComparable<in T> can be used as an example:

```csharp
internal class Base : IComparable<Base>
{
    public int CompareTo(Base other)
    {
        throw new NotImplementedException();
    }
}

internal class Derived : Base
{
}
```

Then:

```csharp
IComparable<Base> baseComparable = new Base();
// This cannot compile in C# 2.0 / 3.0,
// because Derived does not implement IComparable<Derived>.
IComparable<Derived> derivedComparable = new Derived();

// This always prints "True".
Console.WriteLine(baseComparable is IComparable<Base>);
// Contravariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(baseComparable is IComparable<Derived>);
```

The interface variances are also confusing.

## Conclusion

C# 4.0 introduces new variance rules, so in C# 4.0, types becomes more convertible than C# 2.0 / 3.0. And this makes the same code work differently between C# 2.0 / 3.0 and C# 4.0.