---
title: "Category Theory via C# (8) Functor Category"
published: 2018-12-09
description: "Given 2 categories C and D, functors C → D forms a , denoted DC:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-3-functor-and-linq-to-functors](/posts/category-theory-via-csharp-3-functor-and-linq-to-functors "https://weblogs.asp.net/dixin/category-theory-via-csharp-3-functor-and-linq-to-functors")**

## Functor Category

Given 2 categories C and D, functors C → D forms a [functor category](http://en.wikipedia.org/wiki/Functor_category), denoted DC:

-   ob(DC): those functors C → D
-   hom(DC): natural transformations between those functors
-   ∘: natural transformations F ⇒ G and G ⇒ H compose to natural transformations F ⇒ H

[![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/3e08057eb6f3_80DE/image_thumb.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/3e08057eb6f3_80DE/image_2.png)

Here is an example of natural transformations composition:
```
// [Pure]
public static partial class NaturalTransformations
{
    // Lazy<> => Func<>
    public static Func<T> ToFunc<T>
        (this Lazy<T> lazy) => () => lazy.Value;

    // Func<> => Nullable<>
    public static Nullable<T> ToNullable<T>
        (this Func<T> function) => new Nullable<T>(() => Tuple.Create(true, function()));
}
```

These 2 natural transformation Lazy<> ⇒ Func<> and Func<> ⇒ Nullable<> can compose to a new natural transformation Lazy<> ⇒ Nullable<>:
```
// Lazy<> => Nullable<>
public static Nullable<T> ToNullable<T>
    (this Lazy<T> lazy) =>
        // new Func<Func<T>, Nullable<T>>(ToNullable).o(new Func<Lazy<T>, Func<T>>(ToFunc))(lazy);
        lazy.ToFunc().ToNullable();
```

## Endofunctor category

Given category C, endofunctors C → C forms an endofunctor category, denoted CC, or End(C):

-   ob(End(C)): the endofunctors C → C
-   hom(End(C)): the natural transformations between endofunctors: C → C
-   ∘: 2 natural transformations F ⇒ G and G ⇒ H can composte to natural transformation F ⇒ H

[![image](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/3e08057eb6f3_80DE/image3_thumb.png "image")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/3e08057eb6f3_80DE/image3.png)

Actually, all the above C# code examples are endofunctors DotNet → DotNet. They form the endofunctor category DotNetDotNet or End(DotNet).

## Monoid laws for endofunctor category, and unit tests

An endofunctor category C is a monoid (C, ∘, Id):

-   Binary operator is ∘: the composition of 2 natural transformations F ⇒ G and G ⇒ H is still a natural transformation F ⇒ H
-   Unit element: the Id natural transformation, which transforms any endofunctor X to itself - IdX: X ⇒ X

Apparently, Monoid (hom(CC), ∘, Id) satisfies the monoid laws:

1.  left unit law: IdF: F ⇒ F ∘ T: F ⇒ G ≌ T: F ⇒ G, T ∈ ob(End(C))
2.  right unit law: T: F ⇒ G ≌ T: F ⇒ G ∘ IdG: G ⇒ G, T ∈ ob(End(C))
3.  associative law: (T1 ∘ T2) ∘ T3 ≌ T1 ∘ (T2 ∘ T3)

Take the transformations above and in previous part as example, the following test shows how natural transformations Lazy<> ⇒ Func<>, Func<> ⇒ Nullable<>, Nullable<> ⇒ => IEnumerable<> composite associatively:

```csharp
[TestClass()]
public partial class NaturalTransformationsTests
{
    [TestMethod()]
    public void CompositionTest()
    {
        Lazy<int> functor = new Lazy<int>(() => 1);
        Tuple<Func<Lazy<int>, IEnumerable<int>>, Func<Lazy<int>, IEnumerable<int>>> compositions = Compositions<int>();
        IEnumerable<int> x = compositions.Item1(functor);
        IEnumerable<int> y = compositions.Item2(functor);
        Assert.AreEqual(x.Single(), y.Single());
    }

    private Tuple<Func<Lazy<T>, IEnumerable<T>>, Func<Lazy<T>, IEnumerable<T>>> Compositions<T>()
    {
        Func<Lazy<T>, Func<T>> t1 = NaturalTransformations.ToFunc;
        Func<Func<T>, Nullable<T>> t2 = NaturalTransformations.ToNullable;
        Func<Nullable<T>, IEnumerable<T>> t3 = NaturalTransformations.ToEnumerable;
        Func<Lazy<T>, IEnumerable<T>> x = t3.o(t2).o(t1);
        Func<Lazy<T>, IEnumerable<T>> y = t3.o(t2.o(t1));
        return Tuple.Create(x, y);
    }
}
```