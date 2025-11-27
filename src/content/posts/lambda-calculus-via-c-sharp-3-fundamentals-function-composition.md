---
title: "Lambda Calculus via C# (3) Fundamentals - Function composition"
published: 2018-11-03
description: "It may not be the best place to discuss function composition in the lambda calculus series. However, function composition will be used a lot in later articles, so here is a brief introduction."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

## **Latest version: [https://weblogs.asp.net/dixin/lambda-calculus-via-c-1-fundamentals](/posts/lambda-calculus-via-c-1-fundamentals "https://weblogs.asp.net/dixin/lambda-calculus-via-c-1-fundamentals")**

It may not be the best place to discuss function composition in the lambda calculus series. However, function composition will be used a lot in later articles, so here is a brief introduction.

## Function composition

[Function composition](http://en.wikipedia.org/wiki/Function_composition_\(computer_science\)) means to combine simple functions into a more complicated function. The composition of f1 and f2 is defined as: f2 ∘ f1. This new function’s application is:

```csharp
(f2 ∘ f1) x := f2 (f1 x)
```

Here the function names f1 and f2 imply the order of being applied. f2 ∘ f1 can also be read as f2 after f1.

Again, it is [perfectly nature normal thing](http://www.bbc.co.uk/films/2003/08/08/american_pie_the_wedding_2003_review.shtml) to chain 2 function application together, by using the first function’s output as the second function’s input:

```csharp
double x = 1;
double y = Math.Sqrt(Math.Abs(x));
```

The following is a more complicated function, combined by 2 simple functions:

```csharp
Func<double, double> absAndSqrt = x => Math.Sqrt(Math.Abs(x));
```

So absAndSqrt is a composition of [Math.Abs](https://msdn.microsoft.com/en-us/library/system.math.abs.aspx) and [Math.Sqrt](https://msdn.microsoft.com/en-us/library/system.math.sqrt.aspx).

Generally, a function of type Func<T1, T2> and a function of type Func<T2, T3> can be composed to a new function of type Func<T1, T3>:

```csharp
public static partial class FuncExtensions
{
    public static Func<T1, T3> o<T1, T2, T3>
        (this Func<T2, T3> function2, Func<T1, T2> function1) => 
            arg => function2(function1(arg));
}
```

Unfortunately, in C# there is no place to define custom function operators, so extension method has to be used. This method is named o to mimic the ∘ operator. Also, in lambda calculus, functions are curried, so this one extension method is good enough.

### Built-in operator in other languages

It is common for other functional language to have a built in function composition operator. In Haskell, ∘ is just [dot (.):](https://wiki.haskell.org/Function_composition)

```csharp
(.) :: (b -> c) -> (a -> b) -> a -> c
f2 . f1 = \x -> f2 (f1 x)
```

And F# has [\>>](https://msdn.microsoft.com/en-us/library/dd233228.aspx):

```csharp
let inline (>>) f1 f2 x = f2 (f1 x)
```

It is called forward composition. So there is also a backward composition operator [<<](https://msdn.microsoft.com/en-us/library/dd233228.aspx):

```csharp
let inline (<<) f2 f1 x = f2 (f1 x)
```

## Properties

Function composition has 2 important properties

### Associativity

Function composition is [associative](http://en.wikipedia.org/wiki/Associative). That means (f3 ∘ f2) ∘ f1 and f3 ∘ (f2 ∘ f1) are the same.

When applying x to (f3 ∘ f2) ∘ f1, according to the definition of ∘:

```csharp
((f3 ∘ f2) ∘ f1) (x)
≡ (f3 ∘ f2) (f1 (x))
≡ f3 (f2 (f1 (x)))
```

And when applying x to f3 ∘ (f2 ∘ f1):

```csharp
f3 ∘ (f2 ∘ f1)
≡ f3 ∘ (f2 (f1 (x)))
≡ f3 (f2 (f1 (x)))
```

So they lead to identical result. In C#, this means f3.o(f2).o(f1) and f3.o(f2.o(f1)) are the same.

### Unit

There is a unit function for function composition:

```csharp
Id := λx.x
```

so that:

```csharp
f ∘ Id ≡ f
```

and

```csharp
Id ∘ f ≡ f
```

In C#, Id is:

```csharp
public static partial class FuncExtensions
{
    public static T Id<T>
        (T value) => value;
}
```