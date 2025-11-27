---
title: "Understanding C# Covariance And Contravariance (8) Struct And Void"
published: 2009-10-04
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
-   [Understanding C# Covariance And Contravariance (4) Arrays](/posts/understanding-csharp-covariance-and-contravariance-4-arrays)
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   Understanding C# Covariance And Contravariance (8) Struct And Void

[Part 1](/posts/understanding-csharp-covariance-and-contravariance-1-delegates) mentioned that variances do not work with struct and void.

## Struct

When we say Derived object “is a” Base object, it means the reference to a Derived object can be considered as a reference to a Base object.

But struct is value type. On the virtual machine described by CLI, when passing a struct value to a method receiving struct parameter, that value is copied and pushed to the stack. When returning a struct value from a method, that item is placed on the stack. We are not working with references.

## Void

The scenario of void looks special. On [Microsoft Connect](http://connect.microsoft.com/default.aspx). Someone is asking for “[Covariant return types should include void –> anything](http://connect.microsoft.com/VisualStudio/feedback/ViewFeedback.aspx?FeedbackID=90909)”.

It looks like anything can be covariant to void:

```csharp
internal delegate void VoidOut();

internal delegate object ObjectOut();

internal class Program
{
    private static void Main()
    {
        VoidOut voidOut = () => { };
        ObjectOut objectOut = () => new object();

        // It looks like covariance is Ok here.
        voidOut = objectOut;

        // Because when we invoke [void voidOut()], we are invoking [object objectOut()]. 
        // The return value of [object objectOut()] can be just ignored.
        voidOut();
    }
}
```

There are also some people asking about the parameter:

```csharp
internal delegate void NoParameterIn();

internal delegate void ObjectIn(object @object);

internal class Program
{
    private static void Main()
    {
        NoParameterIn noParameterIn = () => { };
        ObjectIn objectIn = (@object) => { };

        // It looks like contravariance is Ok here.
        objectIn = noParameterIn;

        // Because when we invoke [void objectIn(object)], we are invoking [void noParameterIn()].
        // The parameter of [void objectIn(object)] can be just ignored.
        objectIn(new object());
    }
}
```
[](http://11011.net/software/vspaste)[](http://11011.net/software/vspaste)

Both of the above variance code cannot be compiled in C# 2.0 / 3.0 / 4.0. The reason is, on the virtual machine described by CLI, function with return value and function without return value work differently. If the variant is allowed, according to [Eric Lippert](http://blogs.msdn.com/ericlippert/archive/2009/06/29/the-void-is-invariant.aspx):

> we would be allowing you to misalign the IL stack!