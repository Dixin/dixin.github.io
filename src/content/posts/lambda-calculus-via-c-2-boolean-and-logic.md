---
title: "Lambda Calculus via C# (2) Church Encoding: Boolean and Logic"
published: 2024-11-04
description: "Lambda calculus is a formal system for function definition and function application, so in lambda calculus, the only primitive is anonymous function. Anonymous function is actually very powerful. With"
image: ""
tags: ["LINQ via C#", "C#", ".NET", "Lambda Calculus", "Functional Programming", "Church Encoding", "Church Booleans"]
category: "LINQ via C#"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

Lambda calculus is a formal system for function definition and function application, so in lambda calculus, the only primitive is anonymous function. Anonymous function is actually very powerful. With an approach called Church encoding. data and operation can be modeled by higher-order anonymous functions and their application. Church encoding is named after [Alonzo Church](http://en.wikipedia.org/wiki/Alonzo_Church), who first discovered this approach. This part discusses Church Boolean - modeling Boolean values and logic operators with functions.

## Church Boolean

Boolean values True and False can be both represented by anonymous function with 2 parameters. True function simply output the first parameter, and False function output the second parameter:
```
True := λtf.t
False := λtf.f
```

As fore mentioned, λtf.E is just the abbreviation of λt.λf.E, so these definitions actually are:
```
True := λt.λf.t
False := λt.λf.f
```

In this tutorial, for consistency and intuition, function definition with multiple variables is always represented in the latter curried form. In C#, they can be viewed as t => f => t and t => f => f, which are curried from (t, f) => t and (t, f) => f. Here t and f can be of any type, so leave their types as dynamic for convenience. In C#, at compile time dynamic is viewed as object and also supports any operation; at runtime if the operation is actually not supported, an exception is thrown. So, the function type of t => f => t and t => f => f is dynamic –> dynamic –> dynamic, which is represented as Func<dynamic, Func<dynamic, dynamic>> in C#. For convenience, an alias Boolean can be defined for such function type:
```
// Curried from (dynamic, dynamic) -> dynamic.
// Boolean is the alias of dynamic -> dynamic -> dynamic.
public delegate Func<dynamic, dynamic> Boolean(dynamic @true);
```

So that True and False can be defined with lambda expression:
```
public static partial class ChurchBoolean
{
    public static readonly Boolean
        True = @true => @false => @true;

    public static readonly Boolean
        False = @true => @false => @false;
}
```

C# does not support defining function directly in the global scope, so True and False are defined as static filed member of a type. In other functional languages like F#, functions can directly defined:
```
let True t f = t
let False t f = f
```

There is no noise and the function currying is default. Actually this F# code is compiled to CIL code similar to above C# structure (static member of a type).

## Logical operators

After defining Boolean values True and False with functions, now the Boolean logics can be represented by functions too. And can be defined by the following function:
```
And := λa.λb.a b False
```

Applying function True with Boolean a and b:

-   When a is True, the application is beta reduced to True b False, which applies True function with b and False, and the first argument b is returned. In C#, this can be viewed that true && b is the same as b.
-   When a is False, the application is beta reduced to False b False, which applies False function with b and False, and the second argument False is returned. In C#, this can be viewed as false && b is always false.
```
And True b
≡ (λa.λb.a b False) True b
≡ (λb.True b False) b
≡ True b False
≡ b

  And False b
≡ (λa.λb.a b False) False b
≡ (λb.False b False) b
≡ False b False
≡ False
```

In C#, And can be viewed as a => b => a(b)(False), it is of curried function type Boolean –> Boolean -> Boolean:
```
public static partial class ChurchBoolean
{
    public static readonly Func<Boolean, Func<Boolean, Boolean>>
        And = a => b => a(b)(False);
}
```

This demonstrates that the Boolean alias improves the readability. Without this alias, the type of And becomes (dynamic –> dynamic –> dynamic) –> (dynamic –> dynamic –> dynamic) –> (dynamic –> dynamic –> dynamic), which is Func<Func<dynamic, Func<dynamic, dynamic>>, Func<Func<dynamic, Func<dynamic, dynamic>>, Func<dynamic, Func<dynamic, dynamic>>>> in C#.

This also demonstrates that dynamic type simplifies type conversion. If Boolean is defined as object –> object -> object:
```
public delegate Func<object, object> Boolean(object @true);

public static partial class ChurchBoolean
{
    public static readonly Func<Boolean, Func<Boolean, Boolean>>
        And = a => b => (Boolean)a(b)(False);
}
```

And must return Boolean, but a(b)(False) returns object, so a type conversion is required. Here a is either True or False, according to the definition of True and False, a(b)(False) returns either b or False. Since b and False are both of type Boolean, so here it is safe to convert a(b)(False) to Boolean. In contrast, when Boolean is defined as dynamic –> dynamic -> dynamic, a(b)(False) returns dynamic, which is viewed as supporting any operation at compile time, including implicitly conversion to Boolean, so the explicit type conversion is not required. At run time, a(b)(False) always return Boolean, and converting Boolean to Boolean always succeeds, so And works smoothly without any exception.

In the above lambda function and C# function, a function name False is referenced. Again, function is anonymous by default in lambda calculus. This tutorial uses function name only for for readability. By substituting function name, And can be defined as:
```
And := λa.λb.a b (λt.λf.f)
```

And the C# implementation becomes:
```
public static Func<Boolean, Func<Boolean, Boolean>>
    And = a => b => a(b)(new Boolean(@true => @false => @false));
```

The function body is longer and less readable. Also, a is of type dynamic –> dynamic -> dynamic, the second argument of a is expected to be object. When function reference False is given, False is a Boolean delegate instance, apparently it is an object and works there, However, when an inline C# lambda expression is given. C# compiler cannot infer the the type of this lambda expression – it could be anonymous function, or expression tree, and the type information of @true and @false cannot be inferred either. So here the constructor syntax is used to indicate this inline lambda expression is a function of type dynamic –> dynamic -> dynamic.

Again, C# does not support defining custom operators for functions, so a && operator cannot be defined for Boolean type. However, extension method can be defined for Boolean type, also And can be implemented as:
```
public static partial class BooleanExtensions
{
    public static Boolean And(this Boolean a, Boolean b) => ChurchBoolean.And(a)(b);
}
```

Now And can be used fluently like an infix operator:
```
internal static void CallAnd()
{
    Boolean result1 = True.And(True);

    Boolean x = True;
    Boolean y = False;
    Boolean result2 = x.And(y);
}
```

Once again, the function name And is only for readability, without refereeing to the function name., the function application (And x y) has to be written as (λa.λb.a b (λt.λf.f)) x y, and in C#, calling And anonymously works but is also less readable:
```
internal static void CallAnonymousAnd()
{
    Boolean result1 = new Func<Boolean, Func<Boolean, Boolean>>(a => b => (Boolean)a(b)(False))(True)(True);

    Boolean x = True;
    Boolean y = False;
    Boolean result2 = new Func<Boolean, Func<Boolean, Boolean>>(a => b => (Boolean)a(b)(False))(x)(y);
}
```

Or is defined as:
```
Or :=  λa.λb.a True b
```

When a is True, True True b returns the first argument True; When a is False, False True b returns the second argument b. In C#, this can be viewed as true || b is always true, and false || b is the same as b.
```
Or True b
≡ (λa.λb.a True b) True b
≡ (λb.True True b) b
≡ True True b
≡ True
 
  Or False b
≡ (λa.λb.a True b) False b
≡ (λb.False True b) b
≡ False True b
≡ b
```

Not is defined as:
```
Not := λa.a False True
```

When a is True, True False True returns the first argument False; when a is False, False False True returns the second argument True:
```
Not True
≡ (λa.a False True) True
≡ True False True
≡ False
 
  Not False
≡ (λa.a False True) False
≡ False False True
≡ True
```

Xor is defined as:
```
Xor := λa.λb.a (Not b) b
```

When a is True, True (Not b) b returns the first argument Not b; when a is False, True (Not b) b returns the second argument b:
```
Xor True b
≡ (λa.λb.a (Not b) b) True b
≡ (λb.True (Not b) b) b
≡ True (Not b) b
≡ Not b
 
  Xor False b
≡ (λa.λb.a (Not b) b) True b
≡ (λb.False (Not b) b) b
≡ False (Not b) b
≡ b
```

These 3 operators can be simply implemented as:
```
public static Func<Boolean, Func<Boolean, Boolean>> 
    Or = a => b => a(True)(b);

public static Func<Boolean, Boolean> 
    Not = boolean => boolean(False)(True);

public static Func<Boolean, Func<Boolean, Boolean>>
    Xor = a => b => a(Not(b))(b);
```

Again, they can be wrapped as extension methods too:
```
public static Boolean Or(this Boolean a, Boolean b) => ChurchBoolean.Or(a)(b);

public static Boolean Not(this Boolean a) => ChurchBoolean.Not(a);

public static Boolean Xor(this Boolean a, Boolean b) => ChurchBoolean.Xor(a)(b);
```

## Conversion between Church Boolean and System.Boolean

It could be intuitive if the Church Boolean function can be directly compared with .NET bool value. The following methods can be defined to convert between them:
```
public static partial class ChurchEncoding
{
    // System.Boolean structure to Boolean function.
    public static Boolean Church(this bool boolean) => boolean ? True : False;

    // Boolean function to System.Boolean structure.
    public static bool Unchurch(this Boolean boolean) => boolean(true)(false);
}
```

With the help of conversion, the following code demonstrate how to use the logical operators:
```
[TestClass]
public partial class ChurchBooleanTests
{
    [TestMethod]
    public void NotTest()
    {
        Assert.AreEqual((!true).Church(), True.Not());
        Assert.AreEqual((!false).Church(), False.Not());
    }

    [TestMethod]
    public void AndTest()
    {
        Assert.AreEqual((true && true).Church(), True.And(True));
        Assert.AreEqual((true && false).Church(), True.And(False));
        Assert.AreEqual((false && true).Church(), False.And(True));
        Assert.AreEqual((false && false).Church(), False.And(False));
    }

    [TestMethod]
    public void OrTest()
    {
        Assert.AreEqual((true || true).Church(), True.Or(True));
        Assert.AreEqual((true || false).Church(), True.Or(False));
        Assert.AreEqual((false || true).Church(), False.Or(True));
        Assert.AreEqual((false || false).Church(), False.Or(False));
    }

    [TestMethod]
    public void XorTest()
    {
        Assert.AreEqual((true ^ true).Church(), True.Xor(True));
        Assert.AreEqual((true ^ false).Church(), True.Xor(False));
        Assert.AreEqual((false ^ true).Church(), False.Xor(True));
        Assert.AreEqual((false ^ false).Church(), False.Xor(False));
    }
}
```

## If

The if logic is already built in Church Booleans. Church Booleans is a function that can be applied with 2 argument. If this Church Boolean function is True, the first argument is returned, else the second argument is returned. So naturedly, the following is the If function, which is just a wrapper of Church Boolean function application:
```
If := λb.λt.λf.b t f
```

The first argument b is a Church Boolean. when b is True, If returns second argument t. When b is False, If returns third argument f. In C#:
```
// EagerIf = condition => then => @else => condition(then)(@else)
public static readonly Func<Boolean, Func<dynamic, Func<dynamic, dynamic>>>
    EagerIf = condition => then => @else =>
        condition    // if (condition)
            (then)   // then { ... }
            (@else); // else { ... }
```

There is one issue with this C# implementation. As fore mentioned, C#’s reduction strategy is applicative order, when C# function is called, arguments are evaluated, then function is called:
```
internal static void CallEagerIf(Boolean condition, Boolean a, Boolean b)
{
    Boolean result = EagerIf(condition)
        (a.And(b)) // then branch.
        (a.Or(b)); // else branch.
}
```

In this example, disregarding condition is True or False, the then branch a.And(b) and else branch a.Or(b) are both executed. If would be better if one branch is executed for a certain condition. The solution is to make If’s second and third arguments of type T to a factory of type Unit<T> –> T:
```
// If = condition => thenFactory => elseFactory => condition(thenFactory, elseFactory)(Id)
public static readonly Func<Boolean, Func<Func<Unit<dynamic>, dynamic>, Func<Func<Unit<dynamic>, dynamic>, dynamic>>>
    If = condition => thenFactory => elseFactory =>
        condition
            (thenFactory)
            (elseFactory)(Functions<dynamic>.Id);
```

In lambda calculus this is equivalent to:
```
If := λb.λt.λf.b t f Id
```

Now calling If becomes:
```
internal static void CallLazyIf(Boolean condition, Boolean a, Boolean b)
{
    Boolean result = If(condition)
        (id => a.And(b)) // then.
        (id => a.Or(b)); // else.
}
```

When condition is True, only a.And(b) is executed. When condition is False, only a.Or(b) is executed. Now the then and else branches are represented by factory functions id => a.And(b) and id => a.Or(b), where the id argument is the Id function. This argument usually is not used by the function body, it can be named as \_ to indicate “don’t care”:
```
internal static void CallLazyIf(Boolean condition, Boolean a, Boolean b)
{
    Boolean result = If(condition)
        (_ => a.And(b)) // then.
        (_ => a.Or(b)); // else.
}
```