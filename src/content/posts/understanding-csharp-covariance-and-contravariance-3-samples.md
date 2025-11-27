---
title: "Understanding C# Covariance And Contravariance (3) Variances in .NET"
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
-   Understanding C# Covariance And Contravariance (3) Samples
-   [Understanding C# Covariance And Contravariance (4) Arrays](/posts/understanding-csharp-covariance-and-contravariance-4-arrays)
-   [Understanding C# Covariance And Contravariance (5) Higher-order Functions](/posts/understanding-csharp-covariance-and-contravariance-5-higher-order-functions)
-   [Understanding C# Covariance And Contravariance (6) Typing Issues](/posts/understanding-csharp-covariance-and-contravariance-6-typing-issues)
-   [Understanding C# Covariance And Contravariance (7) CLR](/posts/understanding-csharp-covariance-and-contravariance-7-clr)
-   [Understanding C# Covariance And Contravariance (8) Struct And Void](/posts/understanding-csharp-covariance-and-contravariance-8-struct-and-void)

Not many generic types in .NET have variant type parameter(s). LINQ can be uses to query these generic types from .NET libraries.

The following method queries a specified directory, and retrieve all .NET assemblies:
```
public static partial class ReflectionHelper
{
    public static IEnumerable<Assembly> GetAssemblies(string directory)
    {
        return Directory.EnumerateFiles(directory, "*.dll")
            .Select(file =>
                {
                    try
                    {
                        return Assembly.LoadFrom(file);
                    }
                    catch (BadImageFormatException)
                    {
                        return null;
                    }
                })
            .Where(assembly => assembly != null);
    }
}
```

The following method queries one specified assembly, and filter generic types with any variant type parameter:
```
public static partial class ReflectionHelper
{
    public static IEnumerable<Type> GetTypesWithVariance(Assembly assembly)
    {
        try
        {
            return assembly.ExportedTypes.Where(type =>
                type.IsGenericTypeDefinition && type.GetGenericArguments().Any(argument =>
                    (argument.GenericParameterAttributes & GenericParameterAttributes.Covariant)
                    == GenericParameterAttributes.Covariant
                    ||
                    (argument.GenericParameterAttributes & GenericParameterAttributes.Contravariant)
                    == GenericParameterAttributes.Contravariant));
        }
        catch (TypeLoadException)
        {
            return Enumerable.Empty<Type>();
        }
    }
}
```

The last method queries the assemblies in the same directory of mscorlib.dll, and retrieves the wanted types, and orders them by name:
```
public static partial class ReflectionHelper
{
    public static IEnumerable<Type> GetTypesWithVariance()
    {
        string mscorlibPath = typeof(object).Assembly.GetName().CodeBase;
        string directory = Path.GetDirectoryName(new Uri(mscorlibPath).AbsolutePath);
        return GetAssemblies(directory)
            .SelectMany(GetTypesWithVariance)
            .OrderBy(type => type.Name);
    }
}
```

Here is the result of executing the last method:

-   System namespace:
    -   Action\`1 to Action\`16, Func\`1 to Func\`17
    -   Comparison<T>
    -   Converter\`2
    -   IComparable<T>,
    -   IObservable<T>, IObserver<T>
    -   IProgress<T>
    -   Predicate<T>
-   System.Collections.Generic namespace:
    -   IComparer<T>, IEqualityComparer<T>
    -   IEnumerable<T>, IEnumerator<T>
    -   IReadOnlyCollection<T>, IReadOnlyList<T>
-   System.Linq namespace:
    -   IGrouping\`2
    -   IOrderedQueryable<T>, IQueryable<T>

MSDN has a [List of Variant Generic Interface and Delegate Types](https://msdn.microsoft.com/en-us/library/dd799517#VariantList), but it is inaccurate. For example, it says TElement is covariant for IOrderedEnumerable<TElement>, but actually not:

```csharp
namespace System.Linq
{
    public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
    {
        IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(Func<TElement, TKey> keySelector, IComparer<TKey> comparer, bool descending);
    }
}
```