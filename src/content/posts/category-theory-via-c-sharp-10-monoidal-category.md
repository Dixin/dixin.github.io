---
title: "Category Theory via C# (10) Monoidal Category"
published: 2018-12-11
description: "A previous part demonstrated endofunctor category is monoidal. Now with the help of bifunctor, the general abstract  can be defined."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor](/posts/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor "https://weblogs.asp.net/dixin/category-theory-via-csharp-6-monoidal-functor-and-applicative-functor")**

## Monoidal category

A previous part demonstrated endofunctor category is monoidal. Now with the help of bifunctor, the general abstract [monoidal category](http://en.wikipedia.org/wiki/Monoidal_category) can be defined. A monoidal category is a category C equipped with:

-   A bifunctor ⊗: C ⊗ C → C, as the monoid binary operation, also called the [monoidal product](http://en.wikipedia.org/wiki/Tensor_product)
-   An unit object I ∈ C as the monoid unit
-   A natural transformation λX: I ⊗ X ⇒ X, called left unitor
-   A natural transformation ρX: X ⊗ I ⇒ X, called right unitor
-   A natural transformation αX, Y, Z: (X ⊗ Y) ⊗ Z ⇒ X ⊗ (Y ⊗ Z), called associator

so that C satisfies the monoid laws:

1.  Left unit law λX: I ⊗ X ⇒ X (according to definition)
2.  and right unit law ρX: X ⊗ I ⇒ X (definition)
3.  Associative law αX, Y, Z: (X ⊗ Y) ⊗ Z ⇒ X ⊗ (Y ⊗ Z) (definition)

The following triangle identity and pentagon identity diagrams copied from the monoid part still commute for monoidal category:

[![image_thumb1[2]](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/7dadeb2d634a_AAEC/image_thumb1%5B2%5D_thumb.png "image_thumb1[2]")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/7dadeb2d634a_AAEC/image_thumb1%5B2%5D.png)

[![Untitled-2.fw_thumb](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/7dadeb2d634a_AAEC/Untitled-2.fw_thumb_thumb.png "Untitled-2.fw_thumb")](https://mscblogs.blob.core.windows.net/media/dixin/Windows-Live-Writer/7dadeb2d634a_AAEC/Untitled-2.fw_thumb_2.png)

Just read the ⊙ (general binary operator) as ⊗ (bifunctor).

The existence of bifunctor ⊗ makes it possible to ⊗ (can be read as multiply) any 2 elements in the category, and get another element still in the category (the [Cartesian product](http://en.wikipedia.org/wiki/Cartesian_product) represented by that bifunctor). So, bifunctor ⊗ and unit I forms the monoid structure of the category, and the 3 natural transformations make sure this binary “multiply” operation satisfies the monoidal rules:

1.  left unit law: λX(I ⊗ X) ≌ X
2.  right unit law: ρX(X ⊗ I) ≌ X
3.  associative law: αX, Y, Z((X ⊗ Y) ⊗ Z) ≌ X ⊗ (Y ⊗ Z)

In pseudo C#:

```typescript
public interface IMonoidalCategory<TMonoidalCategory, out TBinaryFunctor< , >> 
    : ICategory<TMonoidalCategory>
    where TBinaryFunctor< , > : IBinaryFunctor<TMonoidalCategory, TMonoidalCategory, TMonoidalCategory, TBinaryFunctor< , >>
{
    TBinaryFunctor<T1, T2> x<T1, T2>(T1 value1, T2 value2);
}
```

## DotNet category is monoidal category

In above definition, x represents ⊗ (multiple). However, this cannot be expressed in real C# because IBinaryFunctor<…> is involved, which requires C# language to have higher-kinded polymorphism:

```typescript
// Cannot be compiled.
public interface IBinaryFunctor<in TSourceCategory1, in TSourceCategory2, out TTargetCategory, TBinaryFunctor< , >>
    where TSourceCategory1 : ICategory<TSourceCategory1>
    where TSourceCategory2 : ICategory<TSourceCategory2>
    where TTargetCategory : ICategory<TTargetCategory>
    where TBinaryFunctor< , > : IBinaryFunctor<TSourceCategory1, TSourceCategory2, TTargetCategory, TBinaryFunctor< , >>
{
    IMorphism<TBinaryFunctor<TSource1, TSource2>, TBinaryFunctor<TResult1, TResult2>, TTargetCategory> Select<TSource1, TSource2, TResult1, TResult2>(
        IMorphism<TSource1, TResult1, TSourceCategory1> selector1, IMorphism<TSource2, TResult2, TSourceCategory2> selector2);
}
```

So, just like the functor and bifunctor, go with the extension method approach.

For DotNet category, the bifunctor can be Lazy< , >. So:

```csharp
[Pure]
public static class DotNetExtensions
{
    public static Lazy<T1, T2> x<T1, T2>
        (this DotNet category, T1 value1, T2 value2) => new Lazy<T1, T2>(() => value1, () => value2);
}
```

To be more intuitive, the following “x” extension method can be created for elements in DotNet category:

```csharp
// [Pure]
public static partial class LazyExtensions
{
    public static Lazy<T1, T2> x<T1, T2>
        (this T1 value1, T2 value2) => new Lazy<T1, T2>(value1, value2);
}
```

so that the multiplication binary operation can be applied with any 2 elements in DotNet category, and result another element in DotNet category - the Cartesian product represented by Lazy< , > bifunctor:

```csharp
var x = 1.x(true);
var y = "abc".x(2).x(new HttpClient().x((Unit)null));
var z = y.x(typeof(Unit));
```

This demonstrates the monoidal structure of DotNet category.

Next, the 3 natural transformations can be implemented as bifunctor’s extension methods too, by borrowing [Microsoft.FSharp.Core.Unit](https://msdn.microsoft.com/en-us/library/ee370443.aspx) from F# as the unit:

```csharp
// [Pure]
public static partial class LazyExtensions
{
    public static T2 LeftUnit<T2>
        (this Lazy<Unit, T2> product) => product.Value2;

    public static T1 RightUnit<T1>
        (this Lazy<T1, Unit> product) => product.Value1;

    public static Lazy<T1, Lazy<T2, T3>> Associate<T1, T2, T3>
        (Lazy<Lazy<T1, T2>, T3> product) => 
            new Lazy<T1, Lazy<T2, T3>>(
                () => product.Value1.Value1,
                () => new Lazy<T2, T3>(() => product.Value1.Value2, () => product.Value2));
}
```

So, with Lazy< , > as bifunctor, [F# unit](https://msdn.microsoft.com/en-us/library/dd483472.aspx) as C# unit, plus above 3 natural transformations, DotNet category is a monoidal category (DotNet, Lazy< , >, Unit).