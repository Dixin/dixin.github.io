---
title: "Category Theory via C# (7) Natural Transformation"
published: 2018-12-08
description: "If F: C -> D and G: C -> D are both functors from categories C to category D, a mapping can be constructed between F and G, called [natural transformation](http://en.wikipedia.org/wiki/Natural_transfo"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-4-natural-transformation](/posts/category-theory-via-csharp-4-natural-transformation "https://weblogs.asp.net/dixin/category-theory-via-csharp-4-natural-transformation")**

## Natural transformation

If F: C -> D and G: C -> D are both functors from categories C to category D, a mapping can be constructed between F and G, called [natural transformation](http://en.wikipedia.org/wiki/Natural_transformation) and denoted η : F ⇒ G.

[![image_thumb](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Category-Theory-via-C-5-Functorial-Task-_1256F/image_thumb_thumb.png "image_thumb")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/Category-Theory-via-C-5-Functorial-Task-_1256F/image_thumb_2.png)

η: F ⇒ G is a family of morphisms from F to G, satisfying:

-   ∀ X ∈ ob(C), there is a morphism ηX: F(X) → G(X) associated to X, called the component of η at X.
-   ∀ m: X → Y ∈ hom(C), there is ηY ∘ F(m) ≌ G(m) ∘ ηX

## Natural transformations for LINQ

Previous parts demonstrated IEnumerable<> is the built-in functor, and Tuple<>, Lazy<>, Func<>, Nullable<> are functors too. C# has full LINQ support for IEnumerable<> because all the required extension methods are built-in in .NET. In other functors, taking the simplest Id<> as example:
```
// Cannot be compiled.
Nullable<int> query = from x in nullable
                      where x > 0
                      select x + 1;
```

This cannot be compiled. Apparently C# compiler does not know how to handle “where”. The [C# language spec](https://msdn.microsoft.com/en-us/library/ms228593.aspx) requires a list query methods to be implemented for corresponding LINQ syntax support, like Where is required for the above query to be compiled. It would be nice if the other functors can be mapped to IEnumerable<> by some natural transformations, so that the built in IEnumerable<> query methods can be leveraged. Actually, with the [yield syntactic sugar](/posts/understanding-linq-to-objects-5-implementing-iterator), these natural transformations are really easy to implement:
```
[Pure]
public static partial class NaturalTransformations
{
    // Lazy<> => IEnumerable<>
    public static IEnumerable<T> ToEnumerable<T>(this Lazy<T> lazy)
    {
        yield return lazy.Value;
    }

    // Func<> => IEnumerable<>
    public static IEnumerable<T> ToEnumerable<T>(this Func<T> function)
    {
        yield return function();
    }

    // Nullable<> => IEnumerable<>
    public static IEnumerable<T> ToEnumerable<T>(this Nullable<T> nullable)
    {
        if (nullable.HasValue)
        {
            yield return nullable.Value;
        }
    }
}
```

Now full LINQ support are available for all those functors too, with the laziness remains.
```
IEnumerable<int> query = from x in function.ToEnumerable() 
                         where x > 0 
                         select x + 1;
```

## Unit tests

Please notice the query itself becomes IEnumerbale<> too, either empty or containing 1 item.

```csharp
[TestClass()]
public class NaturalTransformationsTests
{
    [TestMethod()]
    public void LazyToEnumerableTest()
    {
        Lazy<int> functor = new Lazy<int>(() => 1);
        IEnumerable<int> query1 = from x in functor.ToEnumerable()
                                  where x > 0
                                  select x;
        Assert.IsTrue(query1.Any());
        Assert.AreEqual(1, query1.Single());
        IEnumerable<int> query2 = from x in functor.ToEnumerable()
                                  where x < 0
                                  select x;
        Assert.IsFalse(query2.Any());
    }

    [TestMethod()]
    public void FuncToEnumerableTest()
    {
        Func<int> functor = () => 1;
        IEnumerable<int> query1 = from x in functor.ToEnumerable()
                                  where x > 0
                                  select x;
        Assert.IsTrue(query1.Any());
        Assert.AreEqual(1, query1.Single());
        IEnumerable<int> query2 = from x in functor.ToEnumerable()
                                  where x < 0
                                  select x;
        Assert.IsFalse(query2.Any());
    }

    [TestMethod()]
    public void NullableToEnumerableTest()
    {
        Nullable<int> functor = new Nullable<int>(() => Tuple.Create(true, 1));
        IEnumerable<int> query1 = from x in functor.ToEnumerable()
                                  where x > 0
                                  select x;
        Assert.IsTrue(query1.Any());
        Assert.AreEqual(1, query1.Single());
        IEnumerable<int> query2 = from x in functor.ToEnumerable()
                                  where x < 0
                                  select x;
        Assert.IsFalse(query2.Any());

        IEnumerable<int> query3 = from x in new Nullable<int>().ToEnumerable()
                                  select x;
        Assert.IsFalse(query3.Any());
    }
}
```