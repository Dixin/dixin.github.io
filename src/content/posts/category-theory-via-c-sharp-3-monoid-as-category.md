---
title: "Category Theory via C# (3) Monoid as Category"
published: 2018-12-04
description: "An individual monoid (T, ⊙, I) can be a category M:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-2-monoid](/posts/category-theory-via-csharp-2-monoid)**

## One monoid, one category

An individual monoid (T, ⊙, I) can be a category M:

-   ob(M) ≌ { T } - yes, a one-object category
-   hom(M) are morphisms from source object T to result object (target object) T, since there is only one object in category M.
-   ∘, composition of morphisms, is just ⊙

Representing a monoid itself as category is straightforward:

```typescript
public partial interface IMonoid<T> : ICategory<IMonoid<T>>
{
}
```

Its morphism is quite different from DotNetMorphism<TSource, TResult> previously implemented:

```csharp
public class MonoidMorphism<T> : IMorphism<T, T, IMonoid<T>>
{
    private readonly Func<T, T> function;

    public MonoidMorphism(IMonoid<T> category, Func<T, T> function)
    {
        this.function = function;
        this.Category = category;
    }

    public IMonoid<T> Category { [Pure] get; }

    [Pure]
    public T Invoke
        (T source) => this.function(source);
}
```

Since there is only 1 object in the category, the source object and result object are always the same object. So MonoidMorphism<T> only take one type parameter. And apparently, its category is IMonoid<T> instead of DotNet.

The implementation of Monoid<T> for ICategory<IMonoid<T>> is a little tricky:
```
public partial class Monoid<T>
{
    [Pure]
    public IMorphism<TSource, TResult, IMonoid<T>> o<TSource, TMiddle, TResult>(
        IMorphism<TMiddle, TResult, IMonoid<T>> m2, IMorphism<TSource, TMiddle, IMonoid<T>> m1)
    {
        if (!(typeof(T).IsAssignableFrom(typeof(TSource)) && typeof(T).IsAssignableFrom(typeof(TMiddle))
            && typeof(T).IsAssignableFrom(typeof(TResult))))
        {
            throw new InvalidOperationException($"Category {nameof(Monoid<T>)} has only 1 object {nameof(T)}.");
        }

        return new MonoidMorphism<T>(
            this,
            _ => this.Binary(
                (T)(object)m1.Invoke((TSource)(object)this.Unit),
                (T)(object)m2.Invoke((TMiddle)(object)this.Unit)))
            as IMorphism<TSource, TResult, IMonoid<T>>;
    }

    [Pure]
    public IMorphism<TObject, TObject, IMonoid<T>> Id<TObject>()
    {
        if (!typeof(T).IsAssignableFrom(typeof(TObject)))
        {
            throw new InvalidOperationException($"Category {nameof(Monoid<T>)} has only 1 object {nameof(T)}.");
        }

        return new MonoidMorphism<T>(this, value => value) as IMorphism<TObject, TObject, IMonoid<T>>;
    }
}
```

As a category, it expects all the type parameters are the same as T, because - once again - T is the only object in it. Then it uses the ⊙ operator (this.Binary) to compose morphisms.

## Category laws, and unit tests

The following unit test shows how it works:
```
public partial class MonoidTests
{
    [TestMethod()]
    public void CategoryTest()
    {
        IMonoid<int> addInt32Monoid = 0.Monoid(a => b => a + b);

        // Category law 1: ability to compose
        IMorphism<int, int, IMonoid<int>> m1 = addInt32Monoid.MonoidMorphism(unit => 1);
        IMorphism<int, int, IMonoid<int>> m2 = addInt32Monoid.MonoidMorphism(unit => 2);
        IMorphism<int, int, IMonoid<int>> m3 = addInt32Monoid.MonoidMorphism(unit => 3);
        Assert.AreEqual(
            1 + 2 + 3,
            // (m1 ∘ m2) ∘ m3
            addInt32Monoid.o<int, int, int>(addInt32Monoid.o<int, int, int>(m1, m2), m3).Invoke(0));
        Assert.AreEqual(
            1 + 2 + 3,
            // m1 ∘ (m2 ∘ m3)
            addInt32Monoid.o<int, int, int>(m1, addInt32Monoid.o<int, int, int>(m2, m3)).Invoke(0));
        // Category law 2: existence of an identity morphism
        Assert.AreEqual(1, addInt32Monoid.Id<int>().Invoke(1));
        Assert.AreEqual(addInt32Monoid.Unit, addInt32Monoid.Id<int>().Invoke(addInt32Monoid.Unit));
    }
}
```

Here monoid (T, ⊙, I), as a category now, has 2 kinds of morphisms

1.  Each element of T can be associated with a morphism: ∀ x ∈ T, there is a mx: I → T
    -   For example, in (int, +, 0) or addInt32Monoid implementation, it has a family of η morphisms (functions) - from unit to each element of int, apparently those morphisms (+ arithmetic) can be composited.
2.  id: the normal IdT morphism.

Thus it satisfies the category laws.