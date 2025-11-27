---
title: "Lambda Calculus via C# (6) If Logic, And Reduction Strategies"
published: 2018-11-06
description: "The if logic is already built in ."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-c-2-boolean-and-logic](/posts/lambda-calculus-via-c-2-boolean-and-logic "https://weblogs.asp.net/dixin/lambda-calculus-via-c-2-boolean-and-logic")**

The if logic is already built in [Church Booleans](/posts/lambda-calculus-via-c-sharp-4-encoding-church-booleans).

## The first If

So naturedly, This is the first implementation of if based on Church Boolean:

```csharp
public static partial class ChurchBoolean
{
    // If1 = condition => then => @else => condition(then, @else)
    public static Func<T, Func<T, T>> If1<T>
        (Boolean condition) => then => @else =>
            (T)condition
                (then)
                (@else);
}
```

Straightforward:

-   When condition is True, if returns then
-   When condition is False, If returns @else.

It can be applied like this:

```csharp
ChurchBoolean
    .If1<Boolean>(True)
        (True.And(True))
        (True.Or(False));
```

Running this code will show a problem - And and Or are both triggered. However, when condition is either True or False, only one branch is expected to trigger. Here it is True.And(False) to be triggered, since condition is True.

## Reduction strategies

How does If work? There are 3 arguments to be applied: If(arg1)(arg2)(arg3).

The first application will be a beta-reduction:

```csharp
If (arg1) (arg2) (arg3)
≡ (condition => then => @else => condition (then) (@else)) (True) (arg2) (arg3)
≡ (then => @else => True (then) (@else)) (arg2) (arg3)
```

Since the second reduction, [it becomes tricky](http://en.wikipedia.org/wiki/Lambda_calculus#Reduction_strategies). Because now both lambda expression and arg2 can be reduced.

### Normal order

If the lambda expression is reduced before the arguments:

```csharp
(then => @else => True (then) (@else)) (arg2) (arg3)
≡ (then => @else => then) (arg2) (arg3).
≡ (@else => arg2) (arg3)
≡ arg2
≡ True.And(False)
≡ False
```

Eventually only arg2 need to be reduced. This is called normal order. The unreduced arguments are used for function reduction.

### Applicative order

However, C# has a different reduction strategy called applicative order. C# always first reduces a function's arguments, then use those reduced arguments to reduces the function itself:

```csharp
(then => @else => True (then) (@else)) (arg2) (arg3)
≡ (then => @else => True (then) (@else)) (True.And(False)) (arg3)
≡ (then => @else => True (then) (@else)) (False) (arg3)
≡ (@else => True (False) (@else)) (arg3)
≡ (@else => True (False) (@else)) (True.Or(False))
≡ (@else => True (False) (@else)) (True)
≡ True (False) (True)
≡ False
```

This is why both And and Or are triggered. This is an example that reduction order [matters](http://en.wikipedia.org/wiki/Evaluation_strategy).

## Make If lazy

Under the C# reduction order, can If function be lazy, and works just like the first reduction order above? In the above version of If, both then and @else are of type T. In C# the easiest to think about is, changing both parameters from T into a function - the simplest will be Func<T>, so that after the condition returns one of those 2 functions, then the returned Func<T> function can be applied to return a T value.

```csharp
public static partial class ChurchBoolean
{
    // If2 = condition => then => @else => condition(then, @else)()
    public static Func<Func<T>, Func<Func<T>, T>> If2<T>
        (Boolean condition) => then => @else =>
            ((Func<T>)condition
                (then)
                (@else))();
}
```

The application becomes:

```csharp
ChurchBoolean
    .If2<Boolean>(False)
        (() => True.And(True))
        (() => True.Or(False));
```

Now in If, only 1 “branch” will be applied. However, in lambda calculus, a lambda expression without variable - λ.E (corresponding to Func<T>) - does not exist. This is easy to resolve - just make up a variable for lambda expression/a parameter for C# function. So If can be refactored to:

```csharp
public static partial class ChurchBoolean
{
    public static Func<Func<Func<T, T>, T>, Func<Func<Func<T, T>, T>, T>> If<T>
        (Boolean condition) => then => @else => 
            ((Func<Func<T, T>, T>)condition
                (then)
                (@else))(_ => _);
}
```

And the application is almost the same:

```csharp
ChurchBoolean
    .If<Boolean>(True)
        (_ => True.And(True))
        (_ => True.Or(False));
```

In lambda calculus, If is much cleaner without type information:

```csharp
If := λc.λt.λf.c t f (λx.x)
```

## Unit tests

The following unit test verifies If’s correctness and laziness:

```csharp
[TestMethod()]
public void IfTest()
{
    Assert.AreEqual(
        true ? true && false : true || false,
        ChurchBoolean.If<Boolean>(True)(_ => True.And(False))(_ => True.Or(False))._Unchurch());
    Assert.AreEqual(
        false ? true && false : true || false,
        ChurchBoolean.If<Boolean>(False)(_ => True.And(False))(_ => True.Or(False))._Unchurch());

    bool isTrueBranchExecuted = false;
    bool isFalseBranchExecuted = false;
    ChurchBoolean.If<object>(True)
                    (_ => { isTrueBranchExecuted = true; return null; })
                    (_ => { isFalseBranchExecuted = true; return null; });
    Assert.IsTrue(isTrueBranchExecuted);
    Assert.IsFalse(isFalseBranchExecuted);

    isTrueBranchExecuted = false;
    isFalseBranchExecuted = false;
    ChurchBoolean.If<object>(False)
                    (_ => { isTrueBranchExecuted = true; return null; })
                    (_ => { isFalseBranchExecuted = true; return null; });
    Assert.IsFalse(isTrueBranchExecuted);
    Assert.IsTrue(isFalseBranchExecuted);
}
```

Finally, If is successfully encoded in lambda calculus, and it’s C# implementation is as lazy as real “if”.