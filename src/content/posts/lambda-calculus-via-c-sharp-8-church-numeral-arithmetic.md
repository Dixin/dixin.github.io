---
title: "Lambda Calculus via C# (8) Church Numeral Arithmetic"
published: 2018-11-08
description: "The previous part defined Church numerals in  and implemented 0, 1, 2, 3 in 2 different ways. By observing the definition and code, there are some pat"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate](/posts/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate "https://weblogs.asp.net/dixin/lambda-calculus-via-csharp-3-numeral-arithmetic-and-predicate")**

The previous part defined Church numerals in [lambda calculus](/archive/?tag=Lambda%20Calculus) and implemented 0, 1, 2, 3 in 2 different ways. By observing the definition and code, there are some patterns when the Church numeral increases from 0 to 3.

## Increase

In the definitions of Church numerals:

```csharp
0 := λf.λx.x
1 := λf.λx.f (x)
2 := λf.λx.f (f x)
3 := λf.λx.f (f (f x))
...
```

The underlined parts can be substituted by the following underlined parts in the applications:

```csharp
0 f x ≡ x
1 f x ≡ f x
2 f x ≡ f (f x)
...
```

Then Church numerals’ definition become:

```csharp
0 := λf.λx.x
1 := λf.λx.f (0 f x)
2 := λf.λx.f (1 f x)
3 := λf.λx.f (2 f x)
...
```

which shows how the the Church numerals increases. Generally, for a Church numeral n, the next numeral will be λf.λx.f (n f x). So:

```csharp
Increase := λn.λf.λx.f (n f x)
```

The C# implementation is:

```csharp
// Increase = n => f => x => f(n(f)(x))
public static Numeral<T> Increase<T>
    (this Numeral<T> numeral) => f => x => f(numeral(f)(x));
```

In the other way, Church numeral N can be read as do something N times:

```csharp
n f ≡ fn
```

So increasing n means to do something one more time:

```csharp
Increase2 := λn.λf.f ∘ fn ≡ λn.λf.f ∘ (n f)
```

And in C#:

```csharp
// Increase2 = n => f => f ^ (n + 1)
public static Numeral<T> Increase2<T>
    (this Numeral<T> numeral) => f => f.o(numeral(f));
```

Just like the [previous part of Church Boolean operators](/posts/lambda-calculus-via-c-sharp-5-boolean-logic), here extension methods are used for convenience and readability, e.g.: n.Increase().

## Add

Again, from the definition, Church numeral a adding b means to “apply f” b times then “apply f” a times:

```csharp
Add := λa.λb.λf.λx.a f (b f x)
```

Also it means to do something a times then b times:

```csharp
Add2 := λa.λb.λf.fa ∘ fb ≡ λa.λb.λf.(a f) ∘ (b f)
```

So in C#:

```csharp
// Add = a => b => f => x => a(f)(b(f)(x))
public static Numeral<T> Add<T>
    (this Numeral<T> a, Numeral<T> b) => f => x => a(f)(b(f)(x));

// Add2 = a => b => f => f ^ (a + b)
public static Numeral<T> Add2<T>
    (this Numeral<T> a, Numeral<T> b) => f => a(f).o(b(f));
```

There is also a third way to understand a adding b - “apply Increase” a times based on b:

```csharp
Add3 := λa.λb.a Increase b
```

And C#:

```csharp
// Add3 = a => b => a(Increase)(b)
public static Numeral<T> Add3<T>
    (this Numeral<Numeral<T>> a, Numeral<T> b) => a(Increase)(b);
```

## Decrease and subtract

Similarly, once Decrease is defined, Subtract can be defined easily:

```csharp
Decrease := λn.λf.λx.n (λg.λh.h (g f)) (λu.x) (λu.u)
Subtract := λa.λb.b Decrease a
```

This definition of Decrease is complex and the [explanation](http://en.wikipedia.org/wiki/Church_encoding#Derivation_of_predecessor_function) will be skipped. Later after defining [Church pairs (2-tuples)](/posts/lambda-calculus-via-c-sharp-13-encoding-church-pairs-2-tuples-and-generic-church-booleans), a [more intuitive version](/posts/lambda-calculus-via-c-sharp-14-church-pair-2-tuple-and-church-numeral-decrease) will be defined.

C# code will be:

```csharp
// Decrease = n => f => x => n(g => h => h(g(f)))(_ => x)(_ => _)
public static Numeral<T> Decrease<T>
    (this Numeral<Func<Func<T, T>, T>> numeral) => 
            f => x => numeral(g => h => h(g(f)))(_ => x)(_ => _);

// Cannot be compiled.
// Subtract = a => b => b(Decrease)(a)
public static Numeral<T> Subtract<T>
    (Numeral<T> a, Numeral<Numeral<Func<Func<T, T>, T>>> b) => b(Decrease)(a);
```

However, Subtract cannot be compiled. The reason is, as a Church numeral, b requires the first parameter to be Func<TSomething, TSomething>, but Decrease becomes Func<TSomething, TSomethingElse>. [The next part](/posts/lambda-calculus-via-c-sharp-9-wrapping-church-numerals-and-arithmetic) will show how to work with this paradox in C#.