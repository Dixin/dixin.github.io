---
title: "Lambda Calculus via C# (9) Wrapping Church Numerals And Arithmetic"
published: 2018-11-09
description: "In , the Decrease function was a Func<Numeral<Func<Func<T, T>, T>>, Numeral<T>>:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate")**

In [previous part](/posts/lambda-calculus-via-c-sharp-7-encoding-church-numerals), the Decrease function was a Func<Numeral<Func<Func<T, T>, T>>, Numeral<T>>:
```
// Decrease = n => f => x => n(g => h => h(g(f)))(_ => x)(_ => _)
public static Numeral<T> Decrease<T>
    (this Numeral<Func<Func<T, T>, T>> numeral) => 
            f => x => numeral(g => h => h(g(f)))(_ => x)(_ => _);
```

This is ok because in the definition of Numeral<T>:
```
public delegate Func<T, T> Numeral<T>(Func<T, T> f);
```

T can be anything. But on another hand, Decrease can be more useful, if its parameter and return value are exactly the same type. This can be done if in the definition of Numeral<T>, the type parameter can be hidden, so that Decrease can be something like a Func<Numeral, Numeral>.

## Non-generic wrapper for Numeral<T>, and Increase

One possible solution (inspired by [forall](https://wiki.haskell.org/Keywords#forall) in [Haskell](http://en.wikipedia.org/wiki/Haskell_\(programming_language\))) is to create a non-generic wrapper class without type parameter, and have Numeral<T> to be on that class’s member:
```
public partial class _Numeral
{
    public virtual Numeral<T> Numeral<T>()
    {
        …
    }
}
```

Once again, a underscore prefixes the class name to indicate this is cheating, because class exists in C# but not in [lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus) at all.

But how this class can be implemented? Remember:
```
Increase2 := λn.λf.f ∘ (n f)
```

So the \_Numeral class can be implemented from its previous Church numeral:

```csharp
public partial class _Numeral
{
    public _Numeral(_Numeral predecessor)
    {
        this.Predecessor = predecessor;
    }

    protected virtual _Numeral Predecessor { get; set; }

    public virtual Numeral<T> Numeral<T>
        () => 
            f => f.o(this.Predecessor.Numeral<T>()(f));
}
```

So an increased \_Numeral is constructed by using current \_Numeral as the predecessor:
```
public partial class _Numeral
{
    public _Numeral Increase
        () => new _Numeral(this);
}
```

As a special case, 0 does not apply f at all. It can be implemented as a sub class of \_Numeral so that the behavior can be overridden:

```csharp
public partial class _Numeral
{
    private _Numeral()
    {
    }

    private class _ZeroNumeral : _Numeral
    {
        protected override _Numeral Predecessor { get { return this; } set { } }

        public override Numeral<T> Numeral<T>
            () => 
                f => x => x;
    }

    public static _Numeral Zero { get; } = new _ZeroNumeral();
}
```

And that’s it. The [OOP](http://en.wikipedia.org/wiki/Object-oriented_programming) pollution for Church numerals (of lambda calculus) won’t go any further. Notice 0 does not have a previous Church numeral, so its predecessor is itself. A [later part](/posts/lambda-calculus-via-c-sharp-18-encoding-signed-number) will implement signed church numerals.

## Add

The other operators in previous part need to be refactored too. Naturally, Add will be:

```csharp
public static partial class _NumeralExtensions
{
    // Increase = n => n.Increase()
    private static _Numeral Increase
        (_Numeral numeral) => numeral.Increase();

    // Add = a => b => a(Increase)(b)
    public static _Numeral Add
        (this _Numeral a, _Numeral b) => a.Numeral<_Numeral>()(Increase)(b);
}
```

## Decrease and Subtract

Finally, Decrease and Subtract can be done nicely, because now Decrease is a Func<\_Numeral, \_Numeral>:
```
public static partial class _NumeralExtensions
{
    public static _Numeral Zero { get; } = _Numeral.Zero;

    public static _Numeral One { get; } = _Numeral.Zero.Increase();

    // ...

    // Decrease = n => f => x => n(g => h => h(g(f)))(_ => x)(_ => _)
    public static _Numeral Decrease
        (this _Numeral numeral) =>
            new Numeral<_Numeral>(f => x =>
                numeral.Numeral<Func<Func<_Numeral, _Numeral>, _Numeral>>()(g => h => h(g(f)))(_ => x)(_ => _))
                (Increase)(Zero);

    // Subtract = a => b => b(Decrease)(a)
    public static _Numeral Subtract
        (this _Numeral a, _Numeral b) => b.Numeral<_Numeral>()(Decrease)(a);
}
```

## Multiply and Pow

Similar to Add and Subtract, Multiply and Power can be defined as:
```
Multiply := λa.λb.a (λx.Add b x) 0
Pow := λm.λe.e (λx.Multiply m x) 1
```

(Multiply a b) means just to do “add b” a times on top of 0. (Power m e) is to do “multiply m” e times starting on 1.
```
public static partial class _NumeralExtensions
{
    // Multiply = a => b => a(x => b.Add(x))(Zero)
    public static _Numeral Multiply
            (this _Numeral a, _Numeral b) => a.Numeral<_Numeral>()(b.Add)(Zero);

    // Power = m => e => e(x => m.Multiply(x))(1)
    public static _Numeral Pow
        (this _Numeral mantissa, _Numeral exponent) => exponent.Numeral<_Numeral>()(mantissa.Multiply)(One);  
}
```

## Divide?

Divide will implemented in [another part](/posts/lambda-calculus-via-c-sharp-11-predicates-and-divide), after implementing predicates. And a [better version](/posts/lambda-calculus-via-c-sharp-23-y-combinator-and-divide) will be implemented after introducing Y combinator.