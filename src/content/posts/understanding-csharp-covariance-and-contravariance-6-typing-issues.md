---
title: "Understanding C# Covariance And Contravariance (6) Typing issues"
published: 2009-09-01
description: "Understanding C# covariance and contravariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# covariance and contravariance:

-   [Understanding C# covariance and contravariance (1) Delegates](http://www.cnblogs.com/dixin/archive/2009/08/29/understanding-csharp-covariance-and-contravariance-1-delegates.html)
-   [Understanding C# covariance and contravariance (2) Interfaces](http://www.cnblogs.com/dixin/archive/2009/08/30/understanding-csharp-covariance-and-contravariance-2-interfaces.html)
-   [Understanding C# covariance and contravariance (3) Samples](http://www.cnblogs.com/dixin/archive/2009/08/31/understanding-csharp-covariance-and-contravariance-3-samples.html)
-   [Understanding C# covariance and contravariance (4) Arrays](http://www.cnblogs.com/dixin/archive/2009/08/31/understanding-csharp-covariance-and-contravariance-4-arrays.html)
-   [Understanding C# covariance and contravariance (5) Higher-order functions](http://www.cnblogs.com/dixin/archive/2009/08/31/understanding-csharp-covariance-and-contravariance-5-higher-order-functions.html)
-   Understanding C# covariance and contravariance (6) Typing issues
-   [Understanding C# covariance and contravariance (7) CLR](http://www.cnblogs.com/dixin/archive/2009/09/08/understanding-csharp-covariance-and-contravariance-7-clr.html)
-   [Understanding C# covariance and contravariance (8) Void](http://www.cnblogs.com/dixin/archive/2009/10/04/understanding-csharp-covariance-and-contravariance-8-void.html)

In each previous part, type implicit conversion is dicussed, which happen during the variances, like

-   function (method / delegate) conversion, as well as higher-order function conversion;
-   generic interface conversion;
-   array conversion.

Since C# 4.0 introduces new variance rules, which means in C# 4.0, types could be more convertible than C# 2.0 / 3.0, there could be potential typing issues for C# 4.0. If comparing some code between Visual Studio 2008 (C# 2.0 / 3.0) and Visual Studio 2010 Beta2 (C# 4.0), you can find that is true.

## Delegate covariance / contravariance issues

Take a look at this covariance sample:
```
Func<Base> baseFunc = () => new Base();
Func<Derived> derivedFunc = () => new Derived();

// This always prints "True".
Console.WriteLine(derivedFunc is Func<Derived>);
// Covariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(derivedFunc is Func<Base>);
```
[](http://11011.net/software/vspaste)

And this contravariance sample:
```
Action<Base> baseAction = arg => { };
Action<Derived> derivedAction = arg => { };

// This always prints "True".
Console.WriteLine(baseAction is Action<Base>);
// Contravariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(baseAction is Action<Derived>);
```
[](http://11011.net/software/vspaste)

Yes, in C# 4.0, delegate types are more convertable.

## Interface covariance / contravariance issues

This is the interface covariance on IEnumerator<out T>:
```
IEnumerator<Base> baseEnumerator = new BaseEnumerator();
IEnumerator<Derived> derivedEnumerator = new DerivedEnumerator();

// This always prints "True".
Console.WriteLine(derivedEnumerator is IEnumerator<Derived>);
// Covariance is supported by C# 4.0.
// This prints "False" in C# 2.0 / 3.0, prints "True" in C# 4.0.
Console.WriteLine(derivedEnumerator is IEnumerator<Base>);
```
[](http://11011.net/software/vspaste)

It looks acceptable.

Then this is covariance on IEnumerable<out T>:
```
IEnumerable<Base> bases = new Base[0];
IEnumerable<Derived> deriveds = new Derived[0];

// This always prints "True".
Console.WriteLine(deriveds is IEnumerable<Derived>);
// Covariance is supported by C# 4.0.
// This prints "True" in C# 2.0 / 3.0 / 4.0.
Console.WriteLine(deriveds is IEnumerable<Base>);
```
[](http://11011.net/software/vspaste)

Looks like a big mess.

To try interface contravariance, IComparable<in T> can be used as an example:
```
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
[](http://11011.net/software/vspaste)

Then:
```
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
[](http://11011.net/software/vspaste)

The interface variances are also confusing.

## Conclusion

C# 4.0 introduces new variance rules, so in C# 4.0, types becomes more convertible than C# 2.0 / 3.0. And this makes the same code work differently between C# 2.0 / 3.0 and C# 4.0.