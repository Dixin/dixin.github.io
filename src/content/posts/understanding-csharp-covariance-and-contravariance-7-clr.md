---
title: "Understanding C# Covariance And Contravariance (7) CLR"
published: 2009-09-08
description: "Understanding C# Covariance And Conreavariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# Covariance And Conreavariance:

-   [Understanding C# Covariance And Contravariance (1) Delegates](/posts/understanding-csharp-covariance-and-contravariance-1-delegates)
-   [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces)
-   [Understanding C# Covariance And Contravariance (3) Samples](/posts/understanding-csharp-covariance-and-contravariance-3-samples)
-   [Understanding C# Covariance And Contravariance (4) Arrays](/posts/understanding-csharp-covariance-and-contravariance-4-arrays)
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   Understanding C# Covariance And Contravariance (7) CLR
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

## Variances in CLR

Unlike C# 3.0 features are mostly C# level syntactical sugars, the variance feature of C# 4.0 is not just a CLR level feature.

Take a look at the definition of System.Func<in T, out TResult>:

```csharp
.class public auto ansi sealed System.Func`2<- T,+ TResult>
       extends System.MulticastDelegate
{
}
```

and the definition of System.IComparable<in T>:

```csharp
.class interface public abstract auto ansi System.IComparable`1<- T>
{
}
```

CLR introduces the “-” operator to express the same meaning of “in” in C#, while “+” for “out”. The “in” and “out” keywords are introduced in [part three](http://www.cnblogs.com/dixin/archive/2009/08/30/understanding-csharp-covariance-and-contravariance-2-interfaces.html).

Obviously, without the CLR supporting, those implicit type conversions in C# can never happen.

## The + and – operators

Once again, take a look at these guys:

```csharp
internal class Base
{
}

internal class Derived : Base
{
}

internal class AnotherDerived : Base
{
}
```


Many materials from Internet start variances from the relationship of type A and type B:

-   A is bigger than B: for example, Base is bigger than Derived;
-   A is smaller than B: for example, Derived is smaller than Base;
-   A is equal to B: for example, Derived is equal to Derived, which is very simple;
-   A is not related to B: for example, Derived is not related to AnotherDerived.

Think about the first two relationships. For the interfaces in [part 2](http://www.cnblogs.com/dixin/archive/2009/08/30/understanding-csharp-covariance-and-contravariance-2-interfaces.html):

-   Covariance of output: Derived is a Base => for IOut<out T>, we have IOut<Derived> "is a" IOut<Base>;
-   Contravariance of input: Derived is a Base => for IIn<in T>, we have IIn<Base> "is a" IIn<Derived>.

Now with the “bigger and smaller concepts:

-   Covariance of output: Base is bigger than Derived => for IOut<+ T>, we have IOut<Derived> "is a" IOut<Base>;
-   Contravariance of input: Derived is smaller than Base => for IIn<- T>, we have IIn<Base> "is a" IIn<Derived>.

So for the + and - operators:

-   For covariance, + is used, which means can be bigger;
-   For contravariance, – is used, which means can be smaller.

They look confusing, and it is hard to remember which is which, [even for the members of the C# design committee](http://blogs.msdn.com/ericlippert/archive/2007/10/31/covariance-and-contravariance-in-c-part-eight-syntax-options.aspx).