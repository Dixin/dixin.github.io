---
title: "Understanding LINQ to Objects (3) Iterator Pattern and foreach"
published: 2010-03-14
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[LINQ to Objects](/archive/?tag=LINQ%20to%20Objects)\]

LINQ to Objects provides fluent query methods in a functional paradigm. All these queries work with IEnumerable<T> sequence, and the values in the sequence will be processed with either deferred execution or immediate execution. To sequentially access the values in an IEnumerable<T> sequence, [iterator pattern](http://en.wikipedia.org/wiki/Iterator_pattern) is widely used in .NET and is also a built-in feature of C# language.

## Iteration pattern

Iteration pattern includes a sequence and an iterator. In .NET, they are like:

```csharp
public class Sequence
{
    public Iterator GetEnumerator() => new Iterator();
}

public class Iterator
{
    public bool MoveNext() => false;

    public object Current { get; }
}
```

And the generic version is:

```csharp
public class Sequence<T>
{
    public Iterator<T> GetEnumerator() => new Iterator<T>();
}

public class Iterator<T>
{
    public bool MoveNext() => false;

    public T Current { get; }
}
```

Above sequence/Iterator classes demonstrate the minimum requirements of using a foreach loop to iterate and access each value in the container:

-   The container should have
    -   a GetEnumerable method, which returns an iterator with:
        -   a MoveNext method returns a boolean value to indicate if there are still a value that can be puuled.
        -   a Current property with a getter, which returns the current value to be pulled from the container when MoveNext returns true.

## The foreach and in keywords

Now foreach loop can be compiled for above non-generic and generic containers:
```
public static partial class IteratorPattern
{
    public static void ForEach<T>(Sequence sequence, Action<T> processValue)
    {
        foreach (T value in sequence)
        {
            processValue(value);
        }
    }

    public static void ForEach<T>(Sequence<T> sequence, Action<T> processValue)
    {
        foreach (T value in sequence)
        {
            processValue(value);
        }
    }
}
```

These foreach loops are compiled to while loops, and GetEnumeraotor/MoveNext/Current calls:
```
public static void CompiledForEach<T>(Sequence sequence, Action<T> next)
{
    Iterator iterator = sequence.GetEnumerator();
    try
    {
        while (iterator.MoveNext())
        {
            T value = (T)iterator.Current;
            next(value);
        }
    }
    finally
    {
        (iterator as IDisposable)?.Dispose();
    }
}

public static void CompiledForEach<T>(Sequence<T> sequence, Action<T> next)
{
    Iterator<T> iterator = sequence.GetEnumerator();
    try
    {
        while (iterator.MoveNext())
        {
            T value = iterator.Current;
            next(value);
        }
    }
    finally
    {
        (iterator as IDisposable)?.Dispose();
    }
}
```

The difference is, the non-generic Iterator’s Current property returns an object, it has to be explicitly casted to type T specified in the foreach loop, which is a chance to fail.

## IEnumerable<T> and IEnumerator<T>

To implements iterator pattern, IEnumerable for sequence and IEnumerator for iterator are built in .NET from the beginning:

```csharp
namespace System.Collections
{
    public interface IEnumerable // Sequence.
    {
        IEnumerator GetEnumerator();
    }

    public interface IEnumerator // Iterator.
    {
        object Current { get; }

        bool MoveNext();

        void Reset(); // Only for COM interoperability.
    }
}
```

.NET 2.0 introduced generics, so IEnumerable<T> and IEnumerator<T> are added:

```csharp
namespace System
{
    public interface IDisposable
    {
        void Dispose();
    }
}

namespace System.Collections.Generic
{
    public interface IEnumerable<T> : IEnumerable // Sequence.
    {
        IEnumerator<T> GetEnumerator();
    }

    public interface IEnumerator<T> : IDisposable, IEnumerator // Iterator.
    {
        T Current { get; }
    }
}
```

Later, .NET 4.0 introduces covariance and contravariance. T is covariant for generic interfaces IEnumerable<T> and IEnumerable<T>. So they became:

```csharp
namespace System.Collections.Generic
{
    public interface IEnumerable<out T> : IEnumerable // Sequence.
    {
        IEnumerator<T> GetEnumerator();
    }

    public interface IEnumerator<out T> : IDisposable, IEnumerator // Iterator.
    {
        T Current { get; }
    }
}
```

When a type implements IEnumerable<T>, its instance is guaranteed to be able to work in foreach loop.

S0 there are quite a few terms around iterator pattern, and here is a summary:

-   IEnumerable/IEnumerable<T>: represents sequence, also called container, aggregate object, etc.
-   IEnumerator/IEnumerator<T>: represents iterator.

It might be more straightforward if these interfaces were named IItorable/IIterator, just like [in JavaScript](https://msdn.microsoft.com/en-us/library/dn858237.aspx). Just keep in mind C#’s foreach is a syntactic sugar for iterator pattern, or the enumerable/enumerator pattern (Actually, [C# 5.0’s async/await syntactic sugar follows a similar awaitable/awaitor pattern](/posts/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern)).

### foreach loop vs. for loop

As fore mentioned, array T\[\] implements IEnumerable<T> if it is single dimensional and zero–lower bound. foreach loop for array:
```
public static void ForEach<T>(T[] array, Action<T> next)
{
    foreach (T value in array)
    {
        next(value);
    }
}
```

will be compiled into a for loop for better performance:
```
public static void CompiledForEach<T>(T[] array, Action<T> next)
{
    for (int index = 0; index < array.Length; index++)
    {
        T value = array[index];
        next(value);
    }
}
```

And so is string:
```
public static void ForEach(string @string, Action<char> next)
{
    foreach (char value in @string)
    {
        next(value);
    }
}

public static void CompiledForEach(string @string, Action<char> next)
{
    for (int index = 0; index < @string.Length; index++)
    {
        char value = @string[index];
        next(value);
    }
}
```

### Non-generic vs. generic sequence

IEnumerable<T> is stronger-typed and should always be preferred. However, for above historical reason, some types in .NET only implement IEnumerable. To inspect these types, just need to query the IEnumerable types, and the IEnumerable<T> types, then use Except query method:
```
public static IEnumerable<Type> NonGenericSequences(Assembly assembly)
{
    Type nonGenericEnumerable = typeof(IEnumerable);
    Type genericEnumerable = typeof(IEnumerable<>);
    return assembly
        .ExportedTypes
        .Where(type => type != nonGenericEnumerable && nonGenericEnumerable.GetTypeInfo().IsAssignableFrom(type))
        .Except(assembly
            .ExportedTypes
            .Where(type => type != genericEnumerable && type.IsAssignableTo(genericEnumerable)))
        .OrderBy(type => type.FullName);
}
```

Here Type.IsAssignableFrom is a method provided by .NET. It only works for non-generic types, and closed generic types like typeof(IEnumerable<string>). So another IsAssignableTo extension method has to be created for open generic types like typeof(IEnumerable<>):
```
public static partial class TypeExtensions
{
    public static bool IsAssignableTo(this Type from, Type to)
    {
        if (to.GetTypeInfo().IsAssignableFrom(from))
        {
            return true;
        }

        if (!to.GetTypeInfo().IsGenericTypeDefinition)
        {
            return false;
        }

        if (from.GetTypeInfo().IsGenericType && from.GetGenericTypeDefinition() == to)
        {
            return true; // Collection<int> is assignable to Collection<>.
        }

        if (to.GetTypeInfo().IsInterface && from.GetTypeInfo().GetInterfaces().Any(
            @interface => @interface.GetTypeInfo().IsGenericType && @interface.GetGenericTypeDefinition() == to))
        {
            return true; // Collection<>/Collection<int> assignable to IEnumerable<>/ICollection<>.
        }

        Type baseOfFrom = from.GetTypeInfo().BaseType;
        return baseOfFrom != null && IsAssignableTo(baseOfFrom, to);
    }
}
```

The following code queries non-generic sequences in mscorlib.dll and System.dll:
```
public static void NonGenericSequences()
{
    foreach (Type nonGenericSequence in NonGenericSequences(typeof(object).GetTypeInfo().Assembly)) // mscorlib.dll.
    {
        Trace.WriteLine(nonGenericSequence.FullName);
    }
    // System.Array
    // System.Collections.ArrayList
    // System.Collections.BitArray
    // System.Collections.CollectionBase
    // System.Collections.DictionaryBase
    // System.Collections.Hashtable
    // System.Collections.ICollection
    // System.Collections.IDictionary
    // System.Collections.IList
    // System.Collections.Queue
    // System.Collections.ReadOnlyCollectionBase
    // System.Collections.SortedList
    // System.Collections.Stack
    // System.Resources.IResourceReader
    // System.Resources.ResourceReader
    // System.Resources.ResourceSet
    // System.Runtime.Remoting.Channels.BaseChannelObjectWithProperties
    // System.Runtime.Remoting.Channels.BaseChannelSinkWithProperties
    // System.Runtime.Remoting.Channels.BaseChannelWithProperties
    // System.Security.AccessControl.AuthorizationRuleCollection
    // System.Security.AccessControl.CommonAcl
    // System.Security.AccessControl.DiscretionaryAcl
    // System.Security.AccessControl.GenericAcl
    // System.Security.AccessControl.RawAcl
    // System.Security.AccessControl.SystemAcl
    // System.Security.NamedPermissionSet
    // System.Security.Permissions.KeyContainerPermissionAccessEntryCollection
    // System.Security.PermissionSet
    // System.Security.Policy.ApplicationTrustCollection
    // System.Security.Policy.Evidence
    // System.Security.ReadOnlyPermissionSet

    foreach (Type nonGenericSequence in NonGenericSequences(typeof(Uri).GetTypeInfo().Assembly)) // System.dll.
    {
        nonGenericSequence.FullName.WriteLine();
    }
    // System.CodeDom.CodeAttributeArgumentCollection
    // System.CodeDom.CodeAttributeDeclarationCollection
    // System.CodeDom.CodeCatchClauseCollection
    // System.CodeDom.CodeCommentStatementCollection
    // System.CodeDom.CodeDirectiveCollection
    // System.CodeDom.CodeExpressionCollection
    // System.CodeDom.CodeNamespaceCollection
    // System.CodeDom.CodeNamespaceImportCollection
    // System.CodeDom.CodeParameterDeclarationExpressionCollection
    // System.CodeDom.CodeStatementCollection
    // System.CodeDom.CodeTypeDeclarationCollection
    // System.CodeDom.CodeTypeMemberCollection
    // System.CodeDom.CodeTypeParameterCollection
    // System.CodeDom.CodeTypeReferenceCollection
    // System.CodeDom.Compiler.CompilerErrorCollection
    // System.CodeDom.Compiler.TempFileCollection
    // System.Collections.Specialized.HybridDictionary
    // System.Collections.Specialized.IOrderedDictionary
    // System.Collections.Specialized.ListDictionary
    // System.Collections.Specialized.NameObjectCollectionBase
    // System.Collections.Specialized.NameObjectCollectionBase + KeysCollection
    // System.Collections.Specialized.NameValueCollection
    // System.Collections.Specialized.OrderedDictionary
    // System.Collections.Specialized.StringCollection
    // System.Collections.Specialized.StringDictionary
    // System.ComponentModel.AttributeCollection
    // System.ComponentModel.ComponentCollection
    // System.ComponentModel.Design.DesignerCollection
    // System.ComponentModel.Design.DesignerOptionService + DesignerOptionCollection
    // System.ComponentModel.Design.DesignerVerbCollection
    // System.ComponentModel.EventDescriptorCollection
    // System.ComponentModel.IBindingList
    // System.ComponentModel.IBindingListView
    // System.ComponentModel.ListSortDescriptionCollection
    // System.ComponentModel.PropertyDescriptorCollection
    // System.ComponentModel.TypeConverter + StandardValuesCollection
    // System.Configuration.ConfigXmlDocument
    // System.Configuration.SchemeSettingElementCollection
    // System.Configuration.SettingElementCollection
    // System.Configuration.SettingsAttributeDictionary
    // System.Configuration.SettingsContext
    // System.Configuration.SettingsPropertyCollection
    // System.Configuration.SettingsPropertyValueCollection
    // System.Configuration.SettingsProviderCollection
    // System.Diagnostics.CounterCreationDataCollection
    // System.Diagnostics.EventLogEntryCollection
    // System.Diagnostics.EventLogPermissionEntryCollection
    // System.Diagnostics.InstanceDataCollection
    // System.Diagnostics.InstanceDataCollectionCollection
    // System.Diagnostics.PerformanceCounterPermissionEntryCollection
    // System.Diagnostics.ProcessModuleCollection
    // System.Diagnostics.ProcessThreadCollection
    // System.Diagnostics.TraceListenerCollection
    // System.Net.Configuration.AuthenticationModuleElementCollection
    // System.Net.Configuration.BypassElementCollection
    // System.Net.Configuration.ConnectionManagementElementCollection
    // System.Net.Configuration.WebRequestModuleElementCollection
    // System.Net.CookieCollection
    // System.Net.CredentialCache
    // System.Net.WebHeaderCollection
    // System.Security.Authentication.ExtendedProtection.Configuration.ServiceNameElementCollection
    // System.Security.Authentication.ExtendedProtection.ServiceNameCollection
    // System.Security.Cryptography.AsnEncodedDataCollection
    // System.Security.Cryptography.OidCollection
    // System.Security.Cryptography.X509Certificates.X509Certificate2Collection
    // System.Security.Cryptography.X509Certificates.X509CertificateCollection
    // System.Security.Cryptography.X509Certificates.X509ChainElementCollection
    // System.Security.Cryptography.X509Certificates.X509ExtensionCollection
    // System.Text.RegularExpressions.CaptureCollection
    // System.Text.RegularExpressions.GroupCollection
    // System.Text.RegularExpressions.MatchCollection
}
```

As fore mentioned, most of these types can be converted to generic sequence by OfType query method.

## EnumerableAssert class

In Microsoft’s unit test framework [MSTest](https://en.wikipedia.org/wiki/MSTest), there are only 3 [built-in assert classes](https://msdn.microsoft.com/en-us/library/ms182530.aspx) provided:

-   Assert: for general purpose.
-   StringAssert: for string.
-   CollectionAssert: for ICollection

After understanding the IEnumerable<T>/IEnumerator<T> pattern in .NET, an EnumerableAssert class can be defined for IEnumerable<T>.
```
public static partial class EnumerableAssert
{
    public static void AreSequentialEqual<T>(
        IEnumerable<T> expected,
        IEnumerable<T> actual,
        IEqualityComparer<T> comparer = null,
        string message = null,
        params object[] parameters)
    {
        if (expected == null && actual == null)
        {
            return;
        }

        message = string.IsNullOrEmpty(message) ? string.Empty : $"{message} ";
        if (expected == null)
        {
            Assert.IsNull(
                actual,
                $"{message}Expected sequence is null, but actual sequence is not null.",
                parameters);
            return;
        }

        Assert.IsNotNull(
            actual,
            $"{message}Expected sequence is not null, but actual sequence is null.",
            parameters);

        comparer = comparer ?? EqualityComparer<T>.Default;
        using (IEnumerator<T> expectedItorator = expected.GetEnumerator())
        using (IEnumerator<T> actualIterator = actual.GetEnumerator())
        {
            int expectedIndex = 0;
            for (; expectedItorator.MoveNext(); expectedIndex++)
            {
                Assert.IsTrue(
                    actualIterator.MoveNext(),
                    $"{message}Expected sequence has more than {expectedIndex} value(s), but actual sequence has {expectedIndex} value(s).",
                    parameters);

                T expectedValue = expectedItorator.Current;
                T actualValue = actualIterator.Current;
                Assert.IsTrue(
                    comparer.Equals(expectedValue, actualValue),
                    $"{message}Expected and actual sequences' values are not equal at index {expectedIndex}. Expected value is {expectedValue}, but actual value is {actualValue}.",
                    parameters);
            }

            Assert.IsFalse(
                actualIterator.MoveNext(),
                $"{message}Expected sequence has {expectedIndex} value(s), but actual sequence has more than {expectedIndex} value(s).",
                parameters);
        }
    }
}
```

And a few other assert methods:
```
public static void IsEmpty<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    Assert.IsTrue(actual.IsEmpty(), message, parameters);
}

public static void IsNullOrEmpty<T>
    (IEnumerable<T> actual, string message = null, params object[] parameters) =>
        Assert.IsTrue(actual.IsNullOrEmpty(), message, parameters);

public static void Any<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    Assert.IsTrue(actual.Any(), message, parameters);
}

public static void Single<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    Assert.AreEqual(1, actual.Count(), message, parameters);
}

public static void Multiple<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    using (IEnumerator<T> iterator = actual.GetEnumerator())
    {
        Assert.IsTrue(iterator.MoveNext() && iterator.MoveNext(), message, parameters);
    }
}

public static void Contains<T>(
    T expected,
    IEnumerable<T> actual,
    IEqualityComparer<T> comparer = null,
    string message = null,
    params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    Assert.IsTrue(actual.Contains(expected, comparer ?? EqualityComparer<T>.Default), message, parameters);
}

public static void DoesNotContain<T>(
    T expected,
    IEnumerable<T> actual,
    IEqualityComparer<T> comparer = null,
    string message = null,
    params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    Assert.IsFalse(actual.Contains(expected, comparer ?? EqualityComparer<T>.Default), message, parameters);
}

public static void Count<T>(
    int expected, IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    Assert.AreEqual(expected, actual.Count(), message, parameters);
}
```

These methods, especially AreSequentialEqual, will be used in this tutorial later.