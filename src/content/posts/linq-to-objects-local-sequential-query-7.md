---
title: "LINQ to Objects in Depth (1) Local Sequential Query"
published: 2018-07-01
description: "LINQ to Objects queries sequences of .NET objects in local memory of current .NET application or service. Its data source and the queries are represented by IEnumerable<T>."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-objects-local-sequential-query](/posts/linq-to-objects-local-sequential-query "https://weblogs.asp.net/dixin/linq-to-objects-local-sequential-query")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

LINQ to Objects queries sequences of .NET objects in local memory of current .NET application or service. Its data source and the queries are represented by IEnumerable<T>.

## Iteration pattern and foreach statement

C#/.NET follows [iterator pattern](http://en.wikipedia.org/wiki/Iterator_pattern) to define sequence of values, and implement sequential access to the values in sequence in a unified approach. Iteration pattern consists of a sequence (also called container of items, or aggregate of elements) and an iterator:

```csharp
internal abstract class Sequence
{
    public abstract Iterator GetEnumerator(); // Must be public.
}

internal abstract class Iterator
{
    public abstract bool MoveNext(); // Must be public.

    public abstract object Current { get; } // Must be public.
}
```

And their generic version is:

```csharp
internal abstract class GenericSequence<T>
{
    public abstract GenericIterator<T> GetEnumerator(); // Must be public.
}

internal abstract class GenericIterator<T>
{
    public abstract bool MoveNext(); // Must be public.

    public abstract T Current { get; } // Must be public.
}
```

These types and members demonstrate the minimum requirements for iteration pattern:

-   The sequence is the container of sequential values, it has a GetEnumerator factory method returning an iterator
-   Iterator traverses all values in the sequence. Its MoveNext method returns a bool value to indicate whether there is still a next value that can be pulled. If true is returned, its Current property can be called to pull that value.

Then the values in above non-generic and generic sequences can be access with C# foreach statement:

```csharp
internal static partial class IteratorPattern
{
    internal static void ForEach<T>(Sequence sequence, Action<T> processNext)
    {
        foreach (T value in sequence)
        {
            processNext(value);
        }
    }

    internal static void ForEach<T>(GenericSequence<T> sequence, Action<T> processNext)
    {
        foreach (T value in sequence)
        {
            processNext(value);
        }
    }
}
```

The above foreach loops are compiled to while loops:

```csharp
internal static void CompiledForEach<T>(Sequence sequence, Action<T> processNext)
{
    Iterator iterator = sequence.GetEnumerator();
    try
    {
        while (iterator.MoveNext())
        {
            T value = (T)iterator.Current;
            processNext(value);
        }
    }
    finally
    {
        (iterator as IDisposable)?.Dispose();
    }
}

internal static void CompiledForEach<T>(GenericSequence<T> sequence, Action<T> processNext)
{
    GenericIterator<T> iterator = sequence.GetEnumerator();
    try
    {
        while (iterator.MoveNext())
        {
            T value = iterator.Current;
            processNext(value);
        }
    }
    finally
    {
        (iterator as IDisposable)?.Dispose();
    }
}
```

So the foreach loops is syntactic sugar to make above imperative control flow declarative. The generic version is always preferred, becuase the non-generic Iterator’s Current property returns object, it has to be explicitly casted to the expected type specified in the foreach statement, which could be a chance of failure.

To demonstrate the iterator pattern implementation, a sequence of values can be stored with a singly linked list, with one value in each node:

```csharp
internal class SinglyLinkedListNode<T>
{
    internal SinglyLinkedListNode(T value, SinglyLinkedListNode<T> next = null)
    {
        this.Value = value;
        this.Next = next;
    }

    public T Value { get; }

    public SinglyLinkedListNode<T> Next { get; }
}
```

Then iterator can be implemented to traverse along the linked list nodes. Iterator pattern is imperative, and iterator can change its state during the iteration. When MoveNext is called and returns true, it have Current to return a different next value:

```csharp
internal class LinkedListIterator<T> : GenericIterator<T>
{
    private SinglyLinkedListNode<T> node; // State.

    internal LinkedListIterator(SinglyLinkedListNode<T> head) =>
        this.node = new SinglyLinkedListNode<T>(default, head);

    public override bool MoveNext()
    {
        if (this.node.Next != null)
        {
            this.node = this.node.Next; // State change.
            return true;
        }
        return false;
    }

    public override T Current => this.node.Value;
}
```

And the sequence can be simply implemented as a iterator factory:

```csharp
internal class LinkedListSequence<T> : GenericSequence<T>
{
    private readonly SinglyLinkedListNode<T> head;

    internal LinkedListSequence(SinglyLinkedListNode<T> head) => this.head = head;

    public override GenericIterator<T> GetEnumerator() => new LinkedListIterator<T>(this.head);
}
```

Now the values in the linked list sequence can be sequentially pulled with the foreach syntactic sugar:

```csharp
internal static void ForEach(SinglyLinkedListNode<int> head)
{
    LinkedListSequence<int> sequence = new LinkedListSequence<int>(head);
    foreach (int value in sequence)
    {
        value.WriteLine();
    }
}
```

A general implementation of iterator pattern will be discussed later in this chapter.

## IEnumerable<T> and IEnumerator<T>

Initially, .NET Framework 1.0 provides IEnumerable and IEnumerator interfaces to represent iterator pattern:

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

        void Reset(); // For COM interoperability.
    }
}
```

Many sequence and collection types implement IEnumerable so that they can be used with foreach, like ArrayList, Queue, Stack, etc. Then .NET Framework 2.0 supports generics, where the generic version, IEnumerable<T> and IEnumerator<T>, are provided:

```csharp
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

Since then the sequence and collection types are provided with IEnumerable<T> implemented by default, like List<T>, Queue<T>, Stack<T>, etc.

Later, .NET Framework 4.0 introduces covariance and contravariance for generic interface. As discussed in the Functional Programming chapter, T is covariant for both IEnumerable<T> and IEnumerable<T>. So their definitions are updated to:

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

### EnumerableAssert utility

In Microsoft’s unit test framework [MSTest](https://en.wikipedia.org/wiki/MSTest), there are [built-in assertion utility types](https://msdn.microsoft.com/en-us/library/ms182530.aspx) provided:

-   Assert to check general conditions, providing methods like IsTrue, IsNotNull, AreEqual, etc.
-   StringAssert to check conditions for string, providing methods like Contains, StartsWith, EndsWith, etc.
-   CollectionAssert to check conditions for ICollection, providing methods like AllItemsAreInstancesOfType, AllItemsAreNotNull, IsSubsetOf, etc.

To demonstrate how to consume IEnumerator<T> and IEnumerator<T> with the iterator pattern, an EnumerableAssert utility type can be defined to check conditions for sequence. For example, the following assertion methods check whether the specified sequence is not null and is empty/is not null and is not empty/is null or is empty:

```csharp
public static partial class EnumerableAssert
{
    public static void IsEmpty<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
    {
        Assert.IsNotNull(actual, message, parameters);
        using (IEnumerator<T> iterator = actual.GetEnumerator())
        {
            Assert.IsFalse(iterator.MoveNext(), message, parameters);
        }
    }

    public static void Any<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
    {
        Assert.IsNotNull(actual, message, parameters);
        using (IEnumerator<T> iterator = actual.GetEnumerator())
        {
            Assert.IsTrue(iterator.MoveNext(), message, parameters);
        }
    }
    
    public static void IsNullOrEmpty<T>(
        IEnumerable<T> actual, string message = null, params object[] parameters)
    {
        using (IEnumerator<T> iterator = actual?.GetEnumerator())
        {
            Assert.IsFalse(iterator?.MoveNext() ?? false, message, parameters);
        }
    }
}
```

The following methods check whether the specified sequence contains one single value/contains more then one values:

```csharp
public static void Single<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    using (IEnumerator<T> iterator = actual.GetEnumerator())
    {
        Assert.IsTrue(iterator.MoveNext() && !iterator.MoveNext(), message, parameters);
    }
}

public static void Multiple<T>(IEnumerable<T> actual, string message = null, params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    using (IEnumerator<T> iterator = actual.GetEnumerator())
    {
        Assert.IsTrue(iterator.MoveNext() && iterator.MoveNext(), message, parameters);
    }
}
```

The following methods check whether the specified sequence contains/does not contain the specified value:

```csharp
public static void Contains<T>(
    T expected,
    IEnumerable<T> actual,
    IEqualityComparer<T> comparer = null,
    string message = null,
    params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    comparer = comparer ?? EqualityComparer<T>.Default;
    foreach (T value in actual)
    {
        if (comparer.Equals(expected, value))
        {
            return;
        }
    }
    Assert.Fail(message, parameters);
}

public static void DoesNotContain<T>(
    T expected, IEnumerable<T> actual, 
    IEqualityComparer<T> comparer = null,
    string message = null,
    params object[] parameters)
{
    Assert.IsNotNull(actual, message, parameters);
    comparer = comparer ?? EqualityComparer<T>.Default;
    foreach (T value in actual)
    {
        if (comparer.Equals(expected, value))
        {
            Assert.Fail(message, parameters);
        }
    }
}
```

The following AreSequentialEqual method checks whether 2 sequences’ values are sequentially equal:

```csharp
public static void AreSequentialEqual<T>(
    IEnumerable<T> expected,
    IEnumerable<T> actual,
    IEqualityComparer<T> comparer = null,
    string message = null,
    params object[] parameters)
{
    Assert.IsNotNull(expected, message ?? $"Expected sequence is null.", parameters);
    Assert.IsNotNull(actual, message ?? $"Actual sequence is null.", parameters);

    comparer = comparer ?? EqualityComparer<T>.Default;
    using (IEnumerator<T> expectedItorator = expected.GetEnumerator())
    using (IEnumerator<T> actualIterator = actual.GetEnumerator())
    {
        int expectedIndex = 0;
        for (; expectedItorator.MoveNext(); expectedIndex++)
        {
            Assert.IsTrue(
                actualIterator.MoveNext(),
                message ?? $"Expected sequence has more than {expectedIndex} value(s), actual sequence has {expectedIndex} value(s).",
                parameters);
            T expectedValue = expectedItorator.Current;
            T actualValue = actualIterator.Current;
            Assert.IsTrue(
                comparer.Equals(expectedValue, actualValue),
                message ?? $"Expected and actual sequences' values are not equal at index {expectedIndex}. Expected value is {expectedValue}, actual value is {actualValue}.",
                parameters);
        }
        Assert.IsFalse(
            actualIterator.MoveNext(),
            message ?? $"Expected sequence has {expectedIndex} value(s), actual sequence has more than {expectedIndex} value(s).",
            parameters);
    }
}
```

### foreach loop vs. for loop

Array is a special type. A concrete array T\[\] inherits System.Array type, which does not implement IEnumerable<T> but IEnumerable:

```csharp
namespace System
{
    public abstract class Array : ICollection, IEnumerable, IList, IStructuralComparable, IStructuralEquatable
    {
    }
}
```

Instead, T\[\] directly implements IEnumerable<T>, ICollection<T>, and IList<T>, as long as T\[\] is single dimensional, and zero–lower bound. So array T\[\] can be used with foreach loop:

```csharp
internal static void ForEach<T>(T[] array, Action<T> action)
{
    foreach (T value in array)
    {
        action(value);
    }
}
```

For better performance, it is compiled into a for loop, accessing each value with index. For array, this is cheaper than calling MoveNext method and Current getter:

```csharp
internal static void CompiledForEach<T>(T[] array, Action<T> action)
{
    for (int index = 0; index < array.Length; index++)
    {
        T value = array[index];
        action(value);
    }
}
```

And so is string. Since string is a sequence of characters, it implements IEnumerable<char>. When string is used with foreach loop, it is also compiled to for loop for better performance:

```csharp
internal static void ForEach(string @string, Action<char> action)
{
    foreach (char value in @string)
    {
        action(value);
    }
}

internal static void CompiledForEach(string @string, Action<char> action)
{
    for (int index = 0; index < @string.Length; index++)
    {
        char value = @string[index];
        action(value);
    }
}
```

## LINQ to Objects queryable types

Most of pull-based .NET sequence and collection types implements IEnumerable<T>, like T\[\], List<T>, Dictionary<TKey, TValue>, HashSet<T>, Collection<T>, Stack<T>, Queue<T>, etc. Here is a detailed list of .NET types implemented IEnumerable<T>:

-   System.Collections.Generic.IEnumerable<T>

-   Microsoft.Collections.Immutable.IImmutableQueue<T>
    -   Microsoft.Collections.Immutable.ImmutableQueue<T>
-   Microsoft.Collections.Immutable.IImmutableStack<T>
    -   Microsoft.Collections.Immutable.ImmutableStack<T>
-   Microsoft.Collections.Immutable.IOrderedCollection<T>
    -   Microsoft.Collections.Immutable.ImmutableList<T>
-   System.Collections.Concurrent.IProducerConsumerCollection<T>
    -   System.Collections.Concurrent.ConcurrentBag<T>
    -   System.Collections.Concurrent.ConcurrentQueue<T>
    -   System.Collections.Concurrent.ConcurrentStack<T>
-   System.Collections.Concurrent.BlockingCollection<T>
-   System.Collections.Generic.ICollection<T>
-   -   System.Collections.Generic.IDictionary<TKey, TValue>
        -   System.Collections.Concurrent.ConcurrentDictionary<TKey, TValue>
        -   System.Collections.Generic.Dictionary<TKey, TValue>
        -   System.Collections.ObjectModel.ReadOnlyDictionary<TKey, TValue>
        -   System.Dynamic.ExpandoObject
    -   System.Collections.Generic.IList<T>
    -   -   System.ArraySegment<T>
        -   System.Collections.Generic.List<T>
        -   System.Collections.ObjectModel.Collection<T>
        -   -   System.Collections.ObjectModel.ObservableCollection<T>
            -   System.Collections.ObjectModel.KeyedCollection<TKey, TItem>
        -   System.Collections.ObjectModel.ReadOnlyCollection<T>
    -   System.Collections.Generic.ISet<T>
        -   System.Collections.Generic.HashSet<T>
        -   System.Collections.Generic.SortedSet<T>
-   System.Collections.Generic.IReadOnlyCollection<T>
    -   System.Collections.Generic.IReadOnlyDictionary<TKey, TValue>
        -   System.Collections.Generic.Dictionary<TKey, TValue>
        -   System.Collections.ObjectModel.ReadOnlyDictionary<TKey, TValue>
        -   Microsoft.Collections.Immutable.IImmutableDictionary<TKey, TValue>
        -   -   Microsoft.Collections.Immutable.ImmutableDictionary<TKey, TValue>
            -   Microsoft.Collections.Immutable.ImmutableSortedDictionary<TKey, TValue>
        -   System.Collections.Generic.Dictionary<TKey, TValue>
        -   System.Collections.ObjectModel.ReadOnlyDictionary<TKey, TValue>
    -   System.Collections.Generic.IReadOnlyList<T>
        -   Microsoft.Collections.Immutable.IImmutableList<T>
            -   Microsoft.Collections.Immutable.ImmutableList<T>
        -   System.Collections.Generic.List<T>
        -   System.Collections.ObjectModel.Collection<T>
        -   System.Collections.ObjectModel.ReadOnlyCollection<T>
    -   Microsoft.Collections.Immutable.IImmutableSet<T>
        -   Microsoft.Collections.Immutable.IImmutableHashSet<T>
            -   Microsoft.Collections.Immutable.ImmutableHashSet<T>
        -   Microsoft.Collections.Immutable.IImmutableSortedSet<T>
            -   Microsoft.Collections.Immutable.ImmutableSortedSet<T>
-   System.Collections.Generic.LinkedList<T>
-   System.Collections.Generic.Queue<T>
-   System.Collections.Generic.SortedList<TKey, TValue>
-   System.Collections.Generic.Stack<T>
-   System.Linq.IGrouping<TKey, TElement>
-   System.Linq.ILookup<TKey, TElement>
    -   System.Linq.Lookup<TKey, TElement>
-   System.Linq.IOrderedEnumerable<TElement>
-   System.Linq.ParallelQuery<TSource>\*
    -   System.Linq.OrderedParallelQuery<TSource>
-   System.Linq.IQueryable<T>\*
-   -   System.Linq.IOrderedQueryable<T>
        -   System.Linq.EnumerableQuery<T>
        -   System.Data.Objects.ObjectQuery<T>
        -   System.Data.Entity.Core.Objects.ObjectQuery<T>
            -   System.Data.Entity.Core.Objects.ObjectSet<TEntity>
        -   System.Data.Entity.Infrastructure.DbQuery<TResult>
        -   -   System.Data.Entity.DbSet<TEntity>
        -   Microsoft.EntityFrameworkCore.Query.Internal.EntityQueryable<TResult>
    -   System.Data.Linq.ITable<TEntity>
    -   -   System.Data.Linq.Table<TEntity>
    -   Microsoft.EntityFrameworkCore.DbSet<TEntity>
-   T\[\] (not System.Array)

So the LINQ to Objects query methods and query expression are available for to all the above types. Please notice ParallelQuery<T> represents local sequence where values can be pulled in parallel. It implements IEnumerable<T>, so it also supports pulling values sequentially. IQueryable<T> represents remote sequence of values. It also implements IEnumerable<T>, which its values can be loaded to local memory of current .NET application or service, and be queried locally and sequentially. This chapter covers LINQ to Objects queries for IEnumerable<T>. ParallelQuery<T> is covered in the Parallel LINQ chapter, and IQueryable<T> is covered in the LINQ to Entities chapter.

### Non-generic sequence

For historical reason, there are a number of .NET early built-in types only implement IEnumerable. The following example queries these types from the core library:

```csharp
internal static void NonGenericSequences()
{
    Type nonGenericEnumerable = typeof(IEnumerable);
    Type genericEnumerable = typeof(IEnumerable<>);
    IEnumerable<Type> nonGenericSequences = typeof(object).Assembly // Core library.
        .GetExportedTypes()
        .Where(type =>
        {
            if (type == nonGenericEnumerable || type == genericEnumerable)
            {
                return false;
            }
            Type[] interfaces = type.GetInterfaces();
            return interfaces.Any(@interface => @interface == nonGenericEnumerable)
                && !interfaces.Any(@interface =>
                    @interface.IsGenericType
                    && @interface.GetGenericTypeDefinition() == genericEnumerable);
        })
        .OrderBy(type => type.FullName); // Define query.
    foreach (Type nonGenericSequence in nonGenericSequences) // Execute query.
    {
        nonGenericSequence.FullName.WriteLine();
    }
#if NETFX
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
#else
    // System.Array
    // System.Collections.BitArray
    // System.Collections.CollectionBase
    // System.Collections.ICollection
    // System.Collections.IDictionary
    // System.Collections.IList
    // System.Resources.IResourceReader
    // System.Resources.ResourceSet
#endif
}
```

.NET Core’s core library has less types, because many types are moved to separate NuGet packages. For example, in .NET Core, ArrayList, DictionaryBase, Hashtable, Queue, ReadOnlyCollectionBase, SortedList, Stack are moved to NuGet package System.Collections.NonGeneric. A Cast query method is provided to cast non-generic sequence can be casted to generic sequence for further LINQ to Objects query, which will be discussed later.