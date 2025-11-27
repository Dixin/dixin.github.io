---
title: "Lambda Calculus via C# (4) Encoding Church Booleans"
published: 2018-11-04
description: "After clarifying the concepts and terms, a lot of implementation coding starts from this part."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-c-2-boolean-and-logic](/posts/lambda-calculus-via-c-2-boolean-and-logic "https://weblogs.asp.net/dixin/lambda-calculus-via-c-2-boolean-and-logic")**

After clarifying the concepts and terms, a lot of implementation coding starts from this part.

## Church encoding

The following several parts will look at [Church encoding](http://en.wikipedia.org/wiki/Church_encoding). Church encoding is an approach to represent data structures and operators just with lambdas, so that those data structures and operators form a mathematical structure embedded in the lambda calculus. Church is the last name of [Alonzo Church](http://en.wikipedia.org/wiki/Alonzo_Church) who was mentioned in part 1. He first encoded data structures with lambdas. Also, the [Church-Turing thesis](http://en.wikipedia.org/wiki/Church-Turing_thesis) asserts that any computable operator (and its operands) can be represented under Church encoding.

This and the next few articles will demonstrate how to us one primitive, lambda, to construct:

-   other data structures like Boolean, unsigned integer. signed integer, pairs (tuples in C#), lists, etc.
-   operators like if, predicates, arithmetic, etc..

## Church Booleans - True and False

[Church Booleans](http://en.wikipedia.org/wiki/Church_encoding#Church_Booleans) are the Church encoding of the Boolean values true and false. Again, lambda is the only primitive here in [lambda calculus](/archive/?tag=Lambda%20Calculus) and church encoding. So how the true and false can be represented by functions?

The story starts with the most familiar if-then-else logic:

if (Boolean)

-   then (this branch is executed when Boolean is true)
-   else (this branch is executed when Boolean is false)

So True and False can be presented in similar way, but in form of functions:

```csharp
True := λtf.t
False := λtf.f
```

They are both functions with 2 parameters.

So when a Boolean function is applied with 2 arguments, t and f:

-   the first parameter t is returned, when this function represents the Boolean value of true
-   the second parameter f is returned, when this function represents the Boolean value of false

Straightforward. But remember, in lambda calculus, functions are curried, so True and False become:

```csharp
True := λt.λf.t
False := λt.λf.f
```

The C# implementation is easy:

```csharp
// Curried from: object Boolean(object @true, object @false)
public delegate Func<object, object> Boolean(object @true);
// Boolean is just an alias for Func<object, Func<object, object>>

public static partial class ChurchBoolean
{
    public static Boolean True = 
        @true => @false => @true;

    public static Boolean False = 
        @true => @false => @false;

}
```

Several things need to be noticed here:

-   System.Object is used.
    -   It is emphasized function, or lambda expression, is the only primitive type. So, in strong-typing language C#, what should be the type of t and f of lambda expression λt.λf.t? Here object is used. It does not mean cheating by introducing another primitive System.Object. It means “do not care” - t and f can be anything.
-   C# delegate is used too.
    -   This is not cheating either. Since t and f will be of type object, then λtf.t and λt.λf.f will be of type Func<object, Func<object, object>>. the only purpose of delegate type Boolean is to be a shortcut for improving readability, so that Func<object, Func<object, object>> won’t be repeating everywhere.
-   Names are used.
    -   It was also emphasized lambda expression is anonymous function. Above lambda expressions are named as True and False also for shortcut and reuse, so that later when they are used, new Func<object, Func<object, object>>(@true => @false => @true) won’t be repeating everywhere.

Also in C#, function/lambda expressions cannot be created globally. So here they have to stay as a member of a class. In F#, this is allowed:

```csharp
let True t f = t
let False t f = f
```

No noise and automatically curried. Then this will compile to IL code similar to above C# structure (static member of a class).

And finally, to highlight True and False are functions, here and following parts will stick with the tradition C# function declaration:

```csharp
public static partial class ChurchBoolean
{
    public static Func<object, object> True
        (object @true) => @false => @true;

    public static Func<object, object> False
        (object @true) => @false => @false;

    // Not preferred:
    [Obsolete] public static Boolean False2 =
        @true => @false => @false;

    [Obsolete] public static Boolean True2 =
        @true => @false => @true;
}
```

A generic version of Church Boolean will be introduced later in the Church pair part.

## Unit test

True and False are just 2 C# functions. They can be verified in unit tests:

```csharp
[TestClass()]
public class ChurchBooleanTests
{
    [TestMethod()]
    public void TrueTest()
    {
        Assert.AreEqual(1, ChurchBoolean.True(1)("2"));
        Assert.AreEqual("a", ChurchBoolean.True("a")(null));
        Assert.AreEqual(null, ChurchBoolean.True(null)(1));
        object @object = new object();
        Assert.AreEqual(@object, ChurchBoolean.True(@object)(null));
    }

    [TestMethod()]
    public void FalseTest()
    {
        Assert.AreEqual(1, ChurchBoolean.False("2")(1));
        Assert.AreEqual("a", ChurchBoolean.False(null)("a"));
        Assert.AreEqual(null, ChurchBoolean.False(1)(null));
        object @object = new object();
        Assert.AreEqual(@object, ChurchBoolean.False(null)(@object));
    }
}
```