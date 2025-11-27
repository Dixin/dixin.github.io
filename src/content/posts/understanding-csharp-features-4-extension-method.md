---
title: "Understanding C# Features (4) Extension Method"
published: 2009-11-28
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# Features", "Functional Programming", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

Extension method is a powerful syntactic sugar in C# 3.0+, which enables fluent LINQ query.

## Define and use extension method

When an extension method is defined for a type, this extension method must:

-   be a static method
-   be defined in a static class
-   have the first parameter to be that type, and add a this keyword preceded

For example, here are some useful extension methods for string:

```csharp
public static class StringExtensions
{
    public static bool ContainsIgnoreCase(this string value, string substring)
    {
        Contract.Requires<ArgumentNullException>(value != null);

        return value.IndexOf(substring, StringComparison.OrdinalIgnoreCase) >= 0;
    }

    public static bool EqualsIgnoreCase(this string a, string b)
    {
        return string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
    }

    public static string With(this string format, params object[] args)
    {
        return string.Format(CultureInfo.InvariantCulture, format, args);
    }
}
```

So that

```csharp
bool contains = text.ToUpperInvariant().Contains(value.ToUpperInvariant());
bool areEqual = string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
string fullName = string.Format(CultureInfo.InvariantCulture, "Full name: {0} {1}.", firstName, lastName);
```

can be simplified to:

```csharp
bool contains = text.ContainsIgnoreCase(value);
bool areEqual = a.EqualsIgnoreCase(b);
string fullName = "Full name: {0} {1}.".With(firstName, lastName);
```

It looks like some instance methods are extended to a string object.

## Compilation

Extension method is just a syntactic sugar. It will be compiled to normal static method. Take above With as an example, it is compiled to:

```csharp
[Extension]
public static string With(string format, params object[] args)
{
    return string.Format(CultureInfo.InvariantCulture, format, args);
}
```

Then, when compiler compiles With() method invocation on the string object:

```csharp
string fullName = "Full name: {0} {1}.".With(firstName, lastName);
```

it looks up for an available With() in the context. The order to look up is:

-   instance method in the type definition
-   extension method in the current namespace
-   extension method in the current namespace’s parents namespaces
-   extension method in the other namespaces imported by “using”

Once compiler finds a first match - in this case it is the extension method StringExtensions.With(), it compiles extension method call to normal static method call:

```csharp
string fullName = StringExtensions.With("Full name: {0} {1}.", firstName, lastName);
```

## Static method vs. instance method

The extension method is about turning static method into instance method at design time, then turning instance method into static method at compile time. This is actually very natural. For better understanding, take a look at the following static method and instance method:

```csharp
public class Methods
{
    public static bool Same(Methods @this, Methods other)
    {
        return @this == other;
    }

    public bool SameTo(Methods other)
    {
        return this == other;
    }
}
```

After compilation, the IL is:

```csharp
.class public auto ansi beforefieldinit Dixin.Linq.LinqToObjects.Methods
    extends [mscorlib]System.Object
{
    .method public hidebysig static 
        bool Same (
            class LinqToObjects.Methods this,
            class LinqToObjects.Methods other
        ) cil managed 
    {
        .maxstack 2
        .locals init (
            [0] bool CS$1$0000
        )

        IL_0000: nop
        IL_0001: ldarg.0 // Loads the first argument this.
        IL_0002: ldarg.1 // Loads the second argument other.
        IL_0003: ceq
        IL_0005: stloc.0
        IL_0006: br.s IL_0008

        IL_0008: ldloc.0
        IL_0009: ret
    }

    .method public hidebysig 
        instance bool SameTo (
            class LinqToObjects.Methods other
        ) cil managed 
    {
        .maxstack 2
        .locals init (
            [0] bool CS$1$0000
        )

        IL_0000: nop
        IL_0001: ldarg.0 // Loads the first argument this.
        IL_0002: ldarg.1 // Loads the second argument other.
        IL_0003: ceq
        IL_0005: stloc.0
        IL_0006: br.s IL_0008

        IL_0008: ldloc.0
        IL_0009: ret
    }
}
```

The static method and instance method has exactly the same method body:

-   for a static method, the arguments are exactly the parameters declared;
-   for a instance method, the actual first argument is the this reference, and the first parameter becomes the second argument, and so on.

In other words, above Methods class can be viewed as:

```csharp
public class Methods
{
    public static bool Same(Methods @this, Methods other)
    {
        Methods arg0 = @this;
        Methods arg1 = other;
        return arg0 == arg1;
    }

    public bool SameTo(Methods other)
    {
        Methods arg0 = this;
        Methods arg1 = other;
        return arg0 == arg1;
    }
}
```

So, it is [perfectly natural normal thing](http://www.imdb.com/title/tt0328828/) that in extension method, this keyword is used for the first parameter, then this method can be used as the first parameter’s instance method.

## Extension method for other types

Besides classes, extension method can be created by for structs, interfaces, delegates, etc. This is an intuitive example for interface:

```csharp
namespace System.Linq
{
    public static class EnumerableEx
    {
        public static void ForEach<TSource>(this IEnumerable<TSource> source, Action<TSource> onNext)
        {
            if (source == null)
            {
                throw new ArgumentNullException("source");
            }

            if (onNext == null)
            {
                throw new ArgumentNullException("onNext");
            }

            foreach (TSource current in source)
            {
                onNext(current);
            }
        }
    }
}
```

With this extension method,

```csharp
foreach (string message in messages)
{
    Console.WriteLine(message);
}
```

can be simplified to:

```csharp
messages.ForEach(Console.WriteLine);
```

In LINQ, most of the query methods are extension methods for interfaces. Extension method for delegates will also be used a lot in later chapters.