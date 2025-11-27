---
title: "Understanding C# Covariance And Contravariance (4) Arrays"
published: 2009-08-31
description: "Understanding C# Covariance And Conreavariance:"
image: ""
tags: [".NET", "C#", "C# 4.0", "Covariance And Contravariance"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# Covariance And Conreavariance:

-   [Understanding C# Covariance And Contravariance (1) Delegates](/posts/understanding-csharp-covariance-and-contravariance-1-delegates)
-   [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces)
-   [Understanding C# Covariance And Contravariance (3) Samples](/posts/understanding-csharp-covariance-and-contravariance-3-samples)
-   Understanding C# Covariance And Contravariance (4) Arrays
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

An array T\[\] can be viewed as an IList<T>. As fore mentioned, T is invariant for IList<T>.

## Covariance

C# unexpectedly support covariance for array:
```
public static partial class Array
{
    public static void Covariance()
    {
        // IList<Base> baseArray = new Base[2];
        Base[] baseArray = new Base[2];

        // IList<Derived> derivedArray = new Derived[3];
        Derived[] derivedArray = new Derived[2];

        // T of IList<T> is invariant,
        // so logically binding IList<derivedArray> to IList<Base> could not be compiled.
        // But C# compiles it, to be compliant with Java :(
        baseArray = derivedArray; // Array covariance.

        // At runtime, baseArray refers to a Derived array.
        // So A Derived object can be an element of baseArray[0].
        baseArray[0] = new Derived();

        // At runtime, baseArray refers to a Derived array.
        // A Base object "is not a" Derivd object.
        // And ArrayTypeMismatchException is thrown at runtime.
        baseArray[1] = new Base();
    }
}
```

The above code can be compiled but throws ArrayTypeMismatchException at runtime. In some scenarios, this can be confusing and makes code buggy. For example, when using array as parameter:
```
public static partial class Array
{
    public static void ProcessArray(Base[] array)
    {
        array[0] = new Base(); // ArrayTypeMismatchException.
        }

    public static void CallProcessArray()
    {
        Derived[] array = new Derived[1];
        ProcessArray(array); // Array covariance. Compliable.
    }
}
```

As fore mentioned, value type has nothing to do with variances, the following code cannot be compiled:
```
public static partial class Array
{
    public static void ValueType()
    {
        object[] objectArray = new object[1];
        int[] int32Array = new int[1];
#if Uncompilable
        // No covariance.
        objectArray = int32Array;
#endif
    }
}
```

## Comments

Here are some comments for array covariance:

-   [Jonathan Allen said](http://www.infoq.com/news/2008/08/GenericVariance),
    
    > On a historical note, C# and VB both support array covariance ([out/IEnumerable scenario](http://www.cnblogs.com/dixin/archive/2009/09/01/understanding-csharp-covariance-and-contravariance-6-typing-issues.html)) even though it can lead to runtime errors in contravariant situations (in/IWriter scenario). This was done in order to make C# more compatible with Java. This is generally considered a poor decision, but it cannot be undone at this time.
    
-   In the book “[The Common Language Infrastructure Annotated Standard](http://www.amazon.com/exec/obidos/tg/detail/-/0321154932)”, Jim Miller said,
    
    > The decision to support covariant arrays was primarily to allow Java to run on the VES. The covariant design is not thought to be the best design in general, but it was chosen in the interest of broad reach.
    
-   [Rick Byers said](http://blogs.msdn.com/rmbyers/archive/2005/02/16/375079.aspx),
    
    > I've heard that Bill Joy, one of the original Java designers, has since said that he tried to remove array covariance in 1995 but wasn't able to do it in time, and has regretted having it in Java ever since.
    
-   Anders Hejlsberg ([chief architect](http://en.wikipedia.org/wiki/Anders_Hejlsberg) of C#) [said in this video](http://channel9.msdn.com/shows/Going+Deep/Expert-to-Expert-Anders-Hejlsberg-The-Future-of-C/),
    
    > This isn't type safe. A lot of people maybe don't even realize that there's a hole there.
    

This is a C# feature that should never be used.