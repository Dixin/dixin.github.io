---
title: "Category Theory via C# (1) Fundamentals - Category, Object And Morphism"
published: 2018-12-01
description: "This post and the following posts will introduce category theory and its important concepts via C# and LINQ, including functor, applicative functor, monoid, monad, etc. Categories were first introduce"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-1-fundamentals](/posts/category-theory-via-csharp-1-fundamentals "https://weblogs.asp.net/dixin/category-theory-via-csharp-1-fundamentals")**

This post and the following posts will introduce category theory and its important concepts via C# and LINQ, including functor, applicative functor, monoid, monad, etc. Categories were first introduced by [Samuel Eilenberg](http://en.wikipedia.org/wiki/Samuel_Eilenberg) and [Saunders Mac Lane](http://en.wikipedia.org/wiki/Saunders_Mac_Lane) in 1942–45. It might be tedious, as Wikipedia pointed:

> A term dating from the 1940s, "[general abstract nonsense](http://en.wikipedia.org/wiki/Abstract_nonsense)", refers to its high level of abstraction.

so these posts will have minimum theory, and a lot of C#/LINQ code to make some “specific intuitive sense”.

## Category and category laws

A [category](http://en.wikipedia.org/wiki/Category_\(mathematics\)) C consists of:

-   A collection of objects, denoted ob(C). This is not the [objects](http://en.wikipedia.org/wiki/Object_\(computer_science\)) in [OOP](http://en.wikipedia.org/wiki/Object-oriented_programming).
-   A collection of morphisms between objects, denoted hom(C).
    -   A morphism m from object A to object B is denoted m: X → Y:
        -   X is called source object.
        -   Y is called target object. To align to C# terms, Y will be called result object in these posts.
-   Composition operation of morphisms, denoted ∘. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_2.png)
    -   For objects X,Y, Z, and morphisms m1: X → Y, m2: Y → Z, m1 and m2 can compose as m2 ∘ m1: X → Z.
    -   The name of m1 of m2 also implies the order. m2 ∘ m1 can be read as m2 after m1.

and satisfies 2 category laws:

1.  The ability to compose the morphisms [associatively](http://en.wikipedia.org/wiki/Associativity): For m1: W → X, m2: X → Y and m3: Y → Z, there is (m3 ∘ m2) ∘ m1 ≌ m3 ∘ (m2 ∘ m1). [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_4.png)
2.  The existence of an [identity](http://en.wikipedia.org/wiki/Identity_function) morphism for each object: idx : X → X. For m: X → Y, there is idY ∘ m ≌ m ≌ m ∘ idX. [![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_9.png)

To make above general definitions more intuitive, category and its morphism can be represented by:

```typescript
public interface ICategory<TCategory> where TCategory : ICategory<TCategory>
{
    // o = (m2, m1) -> composition
    [Pure]
    IMorphism<TSource, TResult, TCategory> o<TSource, TMiddle, TResult>(
        IMorphism<TMiddle, TResult, TCategory> m2, IMorphism<TSource, TMiddle, TCategory> m1);

    [Pure]
    IMorphism<TObject, TObject, TCategory> Id<TObject>();
}

public interface IMorphism<in TSource, out TResult, out TCategory> where TCategory : ICategory<TCategory>
{
    [Pure]
    TCategory Category { get; }

    [Pure]
    TResult Invoke(TSource source);
}
```

For convenience, the composition function is uncurried with 2 arity. But this is no problem, because any function cannot [curried or uncurried](/posts/lambda-calculus-via-c-sharp-1-fundamentals-closure-currying-and-partial-application).

All members in above interfaces are tagged as [\[Pure\]](https://msdn.microsoft.com/en-us/library/system.diagnostics.contracts.pureattribute.aspx) to indicate all their are all pure functions (C# property will be compiled to get/set functions too). The [purity](http://en.wikipedia.org/wiki/Pure_function) will be explained later.

## The .NET category and morphism

Instead of general abstraction, in C#, the main category to play with is the .NET category:

-   ob(DotNet) are .NET types, like int (System.Int32), bool (System.Boolean), etc.
-   hom(DotNet) are C# pure functions, like f : int → bool, etc.
-   Composition operation of morphisms is the composition of C# functions introduced in previous lambda calculus part.

Now it starts to make more sense:

```csharp
public class DotNet : ICategory<DotNet>
{
    [Pure]
    public IMorphism<TObject, TObject, DotNet> Id<TObject>
        () => new DotNetMorphism<TObject, TObject>(@object => @object);

    [Pure]
    public IMorphism<TSource, TResult, DotNet> o<TSource, TMiddle, TResult>
        (IMorphism<TMiddle, TResult, DotNet> m2, IMorphism<TSource, TMiddle, DotNet> m1) =>
            new DotNetMorphism<TSource, TResult>(@object => m2.Invoke(m1.Invoke(@object)));

    private DotNet()
    {
    }

    public static DotNet Category {[Pure] get; } = new DotNet();
}

public class DotNetMorphism<TSource, TResult> : IMorphism<TSource, TResult, DotNet>
{
    private readonly Func<TSource, TResult> function;

    public DotNetMorphism(Func<TSource, TResult> function)
    {
        this.function = function;
    }

    public DotNet Category
    {
        [Pure]get {return DotNet.Category;}
    }

    [Pure]
    public TResult Invoke
        (TSource source) => this.function(source);
}
```

As expected, DotNetMorphism<TSource, TResult> become just a wrapper of Func<TSource, TResult> function.

And the DotNet category satisfies the category laws:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Category-Theory-via-C-1-Fundamentals_6A3A/image_11.png)

1.  The associativity of morphisms’ (C# functions’) composition is already [proven before](/posts/lambda-calculus-via-c-sharp-3-fundamentals-function-composition).
2.  The morphism returned by Id() is a wrapper of generic function (@object => @object), but it can be compiled to a copy for each closed type (each object ∈ ob(DotNet)), like Id<string>, Id<int>(), id<bool>(), etc. (This is also called [code explosion](https://www.safaribooksonline.com/library/view/clr-via-c/9780735668737/ch12.html#code_explosion) in .NET):