---
title: "Lambda Calculus via C# (5) Boolean Logic"
published: 2018-11-05
description: "After defining Boolean values True and False with functions, now the Boolean logics can be encoded, by functions too."
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-c-2-boolean-and-logic](/posts/lambda-calculus-via-c-2-boolean-and-logic "https://weblogs.asp.net/dixin/lambda-calculus-via-c-2-boolean-and-logic")**

After defining Boolean values True and False with functions, now the Boolean logics can be encoded, by functions too.

## And

And can be defined by the following lambda:
```
And :=  λab.a b False
```

This is easy to understand. It is a function of 2 arity a and b and return a result:

-   When a is True, (True b False) returns True’s first argument b. This is correct, since in Boolean logic (And True b) ≡ b
-   When a is False, (False b False) returns False’s second argument False, This is also correct, since in Boolean logic, (And False b) ≡ False

The C# implementation will be a function of type Func<Boolean, Boolean, Boolean>:
```
public static partial class ChurchBoolean
{
    // And = a => b => a(b)(False)
    public static Boolean And
        (this Boolean a, Boolean b) =>
            // The casting to Boolean is safe, because b and False are both of type Boolean.
            (Boolean)a(b)(new Boolean(False));
}
```

This shows why the Boolean shortcut was created in previous part. Without this shortcut, above function declaration becomes more difficult to read: Func<object, Func<object, object>> And(this Func<object, Func<object, object>>n a, Func<object, Func<object, object>> b).

This also uses the name of the function False, for readability too. Otherwise the code becomes return (Boolean)a(b)(new Boolean(True => False => False));

Please also notice:

-   It is a extension method without currying, so the application can be more readable: a.And(b). The same style will be followed for the other of operators.
-   Function a’s application result is of type object, by definition. Here both arguments are Boolean, so the returned value will be guaranteed to be Boolean at runtime. This casting just tells the truth and does not introduce anything, so this is not cheating.
-   The constructor application new Boolean(…) is just a syntax for the compiler, it just tells the truth as well, and does not introduce anything.

## Or

Definition of Or is:
```
Or :=  λab.a True b
```

Proof:

-   When a is True, (Or True b) ≡ True
-   When a is False, (False True b) ≡ b

C#:
```
// Or = a => b => a(True)(b)
public static Boolean Or
    (this Boolean a, Boolean b) => (Boolean)a(new Boolean(True))(b);
```

## Not

Definition:
```
Not := λb.b False True
```

Proof:

-   When b is True, (True False True) ≡ False
-   When b is False, (False False True) ≡ True

C#:
```
// Not = boolean => boolean(False)(True)
public static Boolean Not
    (this Boolean boolean) => (Boolean)boolean(new Boolean(False))(new Boolean(True));
```

## Xor

Definition:
```
Xor := λa.λb.a (b False True) (b True False)
```

Proof:

-   When a is True, (True (b False True) (b True False)) ≡ (b False True)
    -   When b is True, (True False True) ≡ False
    -   When b is False, (False False True) ≡ True
-   When a is False, (False (b False True) (b True False)) ≡ (b True False)
    -   When b is True, (True True False) ≡ True
    -   When b is False, (False True False) ≡ False

C#:
```
// Xor = a => b => a(b(False)(True))(b(True)(False))
public static Boolean Xor
    (this Boolean a, Boolean b) =>
        (Boolean)a
            (b(new Boolean(False))(new Boolean(True)))
            (b(new Boolean(True))(new Boolean(False)));
```

## Conversion between Church Boolean and System.Boolean

The unit test can be easier if the Church Boolean can be directly compared with C#’s [Boolean](https://msdn.microsoft.com/en-us/library/system.boolean.aspx). To achieve this, 2 conversion methods can be created:
```
public static partial class ChurchEncoding
{
    // System.Boolean to Boolean
    public static Boolean _Church
        (this bool boolean) => boolean ? new Boolean(True) : False;

    // Boolean to System.Boolean
    public static bool _Unchurch
        (this Boolean boolean) => (bool)boolean(true)(false);
}
```

A underscore is used at the beginning of each method to highlight these are not part of the lambda calculus or Church encoding. They are C# specific.

A generic version of Church Boolean and its Boolean logic will be introduced later in the [Church pair part](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans).

## Unit Tests

With the above 2 helper methods, the unit tests become extremely easy:

```csharp
public class ChurchBooleanTests
{
    private static readonly Boolean True = ChurchBoolean.True;

    private static readonly Boolean False = ChurchBoolean.False;

    [TestMethod()]
    public void NotTest()
    {
        Assert.AreEqual(!true, True.Not()._Unchurch());
        Assert.AreEqual(!false, False.Not()._Unchurch());
    }

    [TestMethod()]
    public void AndTest()
    {
        Assert.AreEqual(true && true, True.And(True)._Unchurch());
        Assert.AreEqual(true && false, True.And(False)._Unchurch());
        Assert.AreEqual(false && true, False.And(True)._Unchurch());
        Assert.AreEqual(false && false, False.And(False)._Unchurch());
    }

    [TestMethod()]
    public void OrTest()
    {
        Assert.AreEqual(true || true, True.Or(True)._Unchurch());
        Assert.AreEqual(true || false, True.Or(False)._Unchurch());
        Assert.AreEqual(false || true, False.Or(True)._Unchurch());
        Assert.AreEqual(false || false, False.Or(False)._Unchurch());
    }

    [TestMethod()]
    public void XorTest()
    {
        Assert.AreEqual(true ^ true, True.Xor(True)._Unchurch());
        Assert.AreEqual(true ^ false, True.Xor(False)._Unchurch());
        Assert.AreEqual(false ^ true, False.Xor(True)._Unchurch());
        Assert.AreEqual(false ^ false, False.Xor(False)._Unchurch());
    }
}
```