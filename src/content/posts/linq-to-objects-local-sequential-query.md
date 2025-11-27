---
title: "LINQ to Objects in Depth (1) Local Sequential Query"
published: 2019-07-01
description: "LINQ to Objects queries .NET objects in local memory of current application or service. Its data source and the queries are represented by IEnumerable<T> interface, and it is executed sequentially. Th"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: "LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

LINQ to Objects queries .NET objects in local memory of current application or service. Its data source and the queries are represented by IEnumerable<T> interface, and it is executed sequentially. This chapter introduces IEnumerable<T> interface, and discusses how to use LINQ to Object to query objects in query method syntax and query expression syntax.

## Local sequential LINQ query

LINQ to Objects is local, sequential query. Local means it queries data is instances of .NET types available in the memory of current .NET application or service, not remote data like rows in a data table managed by a separate database. In .NET, IEnumerable<T> interface represents a sequence of instances of T type, so when LINQ is introduced to .NET, IEnumerable<T> is naturally reused to represent LINQ to Objects data source and query. Sequential means when LINQ to Objects query is executed, the instances from data source are processed one after another in a single threading manner instead of parallelism. In another word, LINQ to Objects query results can be pulled from IEnumerable<T> one by one.

### Iterator pattern and foreach statement

If a sequence type is defined following the standard iterator pattern of object-oriented programming, the objects in the sequence can be pulled by C# foreach statement. Iterator pattern consists of a sequence (also called container of items, or aggregate of elements) and an iterator:

internal abstract class Sequence

```csharp
{
```
```csharp
public abstract Iterator GetEnumerator(); // Must be public.
```
```csharp
}
```

```csharp
internal abstract class Iterator
```
```csharp
{
```
```csharp
public abstract bool MoveNext(); // Must be public.
```

```csharp
public abstract object Current { get; } // Must be public.
```

}

And their generic version is:

internal abstract class GenericSequence<T\>

```csharp
{
```
```csharp
public abstract GenericIterator<T>GetEnumerator(); // Must be public.
```
```csharp
}
```

```csharp
internal abstract class GenericIterator<T>
```
```csharp
{
```
```csharp
public abstract bool MoveNext(); // Must be public.
```

```csharp
public abstract T Current { get; } // Must be public.
```

}

The above types and members demonstrate the minimum requirements of iterator pattern for foreach statement. The sequence must have a GetEnumerator factory method to output an iterator (It can be virtually read as GetIterator). And iterator must have a MoveNext method to output a bool value to indicate whether there is a value that can be pulled. If the output is true, iterator’s Current property getter can be called to pull that value. Now the values in above non-generic and generic sequences can be access with C# foreach statement:

internal static void ForEach<T\>(Sequence sequence, Action<T\> process)

```csharp
{
```
```csharp
foreach (T value in sequence)
```
```csharp
{
```
```csharp
process(value);
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void ForEach<T>(GenericSequence<T> sequence, Action<T> process)
```
```csharp
{
```
```csharp
foreach (T value in sequence)
```
```csharp
{
```
```csharp
process(value);
```
```csharp
}
```

}

The foreach statement is declarative syntactic sugar. It is compiled to the following imperative control flow to get iterator from sequence, and poll iterator until there is no value available:

internal static void CompiledForEach<T\>(Sequence sequence, Action<T\> process)

```csharp
{
```
```csharp
Iterator iterator = sequence.GetEnumerator();
```
```csharp
try
```
```csharp
{
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
T value = (T)iterator.Current;
```
```csharp
process(value);
```
```csharp
}
```
```csharp
}
```
```csharp
finally
```
```csharp
{
```
```csharp
(iterator as IDisposable)?.Dispose();
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void CompiledForEach<T>(GenericSequence<T> sequence, Action<T> process)
```
```csharp
{
```
```csharp
GenericIterator<T>iterator = sequence.GetEnumerator();
```
```csharp
try
```
```csharp
{
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
T value = iterator.Current;
```
```csharp
process(value);
```
```csharp
}
```
```csharp
}
```
```csharp
finally
```
```csharp
{
```
```csharp
(iterator as IDisposable)?.Dispose();
```
```csharp
}
```

}

Apparently, the generic version of definition is preferred, because the non-generic iterator’s Current property outputs object type, which has to be explicitly cast to the expected type specified in the foreach statement and could be a chance of failure. To demonstrate the iterator pattern implementation, a sequence of values can be defined as a singly linked list, where each value is stored in a linked list node:

internal class LinkedListNode<T\>

```csharp
{
```
```csharp
internal LinkedListNode(T value, LinkedListNode<T> next = null) =>
```
```csharp
(this.Value, this.Next) = (value, next);
```

```csharp
public T Value { get; }
```

```csharp
public LinkedListNode<T> Next { get; }
```

}

Then iterator can be implemented to traverse along the linked list nodes. When there is a next node, MoveNext outputs true, and Current can output the next value. Notice the iterator is stateful:

internal class LinkedListIterator<T\> : GenericIterator<T\>

```csharp
{
```
```csharp
private LinkedListNode<T> node; // State.
```

```csharp
internal LinkedListIterator(LinkedListNode<T>head) =>
```
```csharp
this.node = new LinkedListNode<T>(default, head);
```

```csharp
public override bool MoveNext()
```
```csharp
{
```
```csharp
if (this.node.Next != null)
```
```csharp
{
```
```csharp
this.node = this.node.Next; // State change.
```
```csharp
return true;
```
```csharp
}
```
```csharp
return false;
```
```csharp
}
```

```csharp
public override T Current => this.node.Value;
```

}

Finally, the sequence can be simply implemented as an iterator factory:

internal class LinkedListSequence<T\> : GenericSequence<T\>

```csharp
{
```
```csharp
private readonly LinkedListNode<T> head;
```

```csharp
internal LinkedListSequence(LinkedListNode<T> head) => this.head = head;
```

```csharp
public override GenericIterator<T> GetEnumerator() => new LinkedListIterator<T>(this.head);
```

}

Now the values in the linked list sequence can be sequentially pulled with the foreach syntactic sugar, which is declarative and there is no need to specify the control flow or handle the state:

internal static void ForEach()

```csharp
{
```
```csharp
LinkedListNode<int> node3 = new LinkedListNode<int>(3, null);
```
```csharp
LinkedListNode<int> node2 = new LinkedListNode<int>(2, node3);
```
```csharp
LinkedListNode<int> node1 = new LinkedListNode<int>(1, node2);
```
```csharp
LinkedListSequence<int> sequence = new LinkedListSequence<int>(node1);
```
```csharp
foreach (int value in sequence)
```
```csharp
{
```
```csharp
value.WriteLine(); // 1 2 3
```
```csharp
}
```

}

A general implementation of iterator pattern is discussed later in the LINQ to Objects query implementation chapter.

### IEnumerable<T> and IEnumerator<T> interfaces

Initially, .NET Framework 1.0 provides IEnumerable and IEnumerator interfaces as the contract of iterator pattern:

namespace System.Collections

```csharp
{
```
```csharp
public interface IEnumerable // Sequence.
```
```csharp
{
```
```csharp
IEnumerator GetEnumerator();
```
```csharp
}
```

```csharp
public interface IEnumerator // Iterator.
```
```csharp
{
```
```csharp
object Current { get; }
```

```csharp
bool MoveNext();
```

```csharp
void Reset(); // For COM interoperability.
```
```csharp
}
```

}

They can be virtually read as iteratable sequence and iterator. .NET Framework’s sequence and collection types implement IEnumerable so that they can be used with foreach statement, like array, ArrayList, Queue, Stack, SortedList, etc. Then .NET Framework 2.0 was released with generics support. So IEnumerable<T> and IEnumerator<T> interfaces are provided as the generic version of iterator pattern contract.

namespace System.Collections.Generic

```csharp
{
```
```csharp
public interface IEnumerable<T> : IEnumerable // Sequence.
```
```csharp
{
```
```csharp
IEnumerator<T> GetEnumerator();
```
```csharp
}
```

```csharp
public interface IEnumerator<T> : IDisposable, IEnumerator // Iterator.
```
```csharp
{
```
```csharp
T Current { get; }
```
```csharp
}
```

}

Since .NET Framework 2.0, sequence and collection types are usually provided as generic types, with IEnumerable<T> implemented, like array, List<T>, Queue<T>, Stack<T>, SortedList<T>, etc.

Later, .NET Framework 4.0 introduces covariance and contravariance for generic interface. As discussed in the covariance and contravariance chapter, T is covariant for both IEnumerable<T> and IEnumerable<T>. So, their definitions are updated with the out modifier for type parameter:

namespace System.Collections.Generic

```csharp
{
```
```csharp
public interface IEnumerable<out T> : IEnumerable // Sequence.
```
```csharp
{
```
```csharp
IEnumerator<T> GetEnumerator();
```
```csharp
}
```

```csharp
public interface IEnumerator<out T> : IDisposable, IEnumerator // Iterator.
```
```csharp
{
```
```csharp
T Current { get; }
```
```csharp
}
```

}

This is how they are defined in .NET Standard.

### foreach statement vs. for statement

Array is a special type. A concrete array T\[\] inherits System.Array type, which does not implement IEnumerable<T> but IEnumerable:

namespace System

```csharp
{
```
```csharp
public abstract class Array : ICollection, IEnumerable, IList, IStructuralComparable, IStructuralEquatable
```
```csharp
{
```
```csharp
}
```

}

Instead, T\[\] directly implements IEnumerable<T>, ICollection<T>, and IList<T>, as long as T\[\] is single dimensional and zero–lower bound. So, array T\[\] can be used with foreach loop:

internal static void ForEach<T\>(T\[\] array, Action<T\> process)

```csharp
{
```
```csharp
foreach (T value in array)
```
```csharp
{
```
```csharp
process(value);
```
```csharp
}
```

}

foreach statement with array is compiled into a for loop, accessing each value with index, which has better performance than the above control flow of getting iterator and polling its MoveNext method and Current property:

internal static void CompiledForEach<T\>(T\[\] array, Action<T\> process)

```csharp
{
```
```csharp
for (int index = 0; index < array.Length; index++)
```
```csharp
{
```
```csharp
T value = array[index];
```
```csharp
process(value);
```
```csharp
}
```

}

And so is string. Since string is a sequence of characters, it implements IEnumerable<char>. Foreach statement with string is also compiled to index access for better performance:

internal static void ForEach(string @string, Action<char\> process)

```csharp
{
```
```csharp
foreach (char value in @string)
```
```csharp
{
```
```csharp
process(value);
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void CompiledForEach(string @string, Action<char> action)
```
```csharp
{
```
```csharp
for (int index = 0; index < @string.Length; index++)
```
```csharp
{
```
```csharp
char value = @string[index];
```
```csharp
action(value);
```
```csharp
}
```

}

### LINQ to Objects queryable types

As discussed, most LINQ to Objects queries are extension methods for IEnumerable<T>. Since most of.NET sequence and collection types implements IEnumerable<T>, LINQ to Object queries are available for these types, and foreach statement is also available for these type to pull results. The following list is the commonly used interfaces and types that implement IEnumerable<T>:

· System.Collections.Generic.IEnumerable<T>

o Microsoft.Collections.Immutable.IImmutableQueue<T>

§ Microsoft.Collections.Immutable.ImmutableQueue<T>

o Microsoft.Collections.Immutable.IImmutableStack<T>

§ Microsoft.Collections.Immutable.ImmutableStack<T>

o Microsoft.Collections.Immutable.IOrderedCollection<T>

§ Microsoft.Collections.Immutable.ImmutableList<T>

o System.Collections.Concurrent.IProducerConsumerCollection<T>

§ System.Collections.Concurrent.ConcurrentBag<T>

§ System.Collections.Concurrent.ConcurrentQueue<T>

§ System.Collections.Concurrent.ConcurrentStack<T>

o System.Collections.Concurrent.BlockingCollection<T>

o System.Collections.Generic.ICollection<T>

§ System.Collections.Generic.IDictionary<TKey, TValue>

§ System.Collections.Concurrent.ConcurrentDictionary<TKey, TValue>

§ System.Collections.Generic.Dictionary<TKey, TValue>

§ System.Collections.ObjectModel.ReadOnlyDictionary<TKey, TValue>

§ System.Dynamic.ExpandoObject

§ System.Collections.Generic.IList<T>

§ System.ArraySegment<T>

§ System.Collections.Generic.List<T>

§ System.Collections.ObjectModel.Collection<T>

§ System.Collections.ObjectModel.ObservableCollection<T>

§ System.Collections.ObjectModel.KeyedCollection<TKey, TItem>

§ System.Collections.ObjectModel.ReadOnlyCollection<T>

§ System.Collections.Generic.ISet<T>

§ System.Collections.Generic.HashSet<T>

§ System.Collections.Generic.SortedSet<T>

o System.Collections.Generic.IReadOnlyCollection<T>

§ System.Collections.Generic.IReadOnlyDictionary<TKey, TValue>

§ System.Collections.Generic.Dictionary<TKey, TValue>

§ System.Collections.ObjectModel.ReadOnlyDictionary<TKey, TValue>

§ Microsoft.Collections.Immutable.IImmutableDictionary<TKey, TValue>

§ Microsoft.Collections.Immutable.ImmutableDictionary<TKey, TValue>

§ Microsoft.Collections.Immutable.ImmutableSortedDictionary<TKey, TValue>

§ System.Collections.Generic.Dictionary<TKey, TValue>

§ System.Collections.ObjectModel.ReadOnlyDictionary<TKey, TValue>

§ System.Collections.Generic.IReadOnlyList<T>

§ Microsoft.Collections.Immutable.IImmutableList<T>

§ Microsoft.Collections.Immutable.ImmutableList<T>

§ System.Collections.Generic.List<T>

§ System.Collections.ObjectModel.Collection<T>

§ System.Collections.ObjectModel.ReadOnlyCollection<T>

§ Microsoft.Collections.Immutable.IImmutableSet<T>

§ Microsoft.Collections.Immutable.IImmutableHashSet<T>

§ Microsoft.Collections.Immutable.ImmutableHashSet<T>

§ Microsoft.Collections.Immutable.IImmutableSortedSet<T>

§ Microsoft.Collections.Immutable.ImmutableSortedSet<T>

o System.Collections.Generic.LinkedList<T>

o System.Collections.Generic.Queue<T>

o System.Collections.Generic.SortedList<TKey, TValue>

o System.Collections.Generic.Stack<T>

o System.Linq.IGrouping<TKey, TElement>

o System.Linq.ILookup<TKey, TElement>

§ System.Linq.Lookup<TKey, TElement>

o System.Linq.IOrderedEnumerable<TElement>

o System.Linq.ParallelQuery<TSource>\*

§ System.Linq.OrderedParallelQuery<TSource>

o System.Linq.IQueryable<T>\*

§ System.Linq.IOrderedQueryable<T>

§ System.Linq.EnumerableQuery<T>

§ System.Data.Linq.ITable<TEntity>

§ System.Data.Linq.Table<TEntity>

§ Microsoft.EntityFrameworkCore.DbSet<TEntity>

o System.String (implements IEnumerable<char>)

o T\[\] (array of T)

In the above list, LINQ to Objects queries cannot be directly used for ParallelQuery<T>, IQueryable<T>, and their subtypes. As fore mentioned, ParallelQuery<T> is defined for parallel LINQ, and IQueryable<T> is defined for remote LINQ, LINQ query methods are also defined for them, like Where extension method for ParallelQuery<T>, and Where extension method for IQueryable<T>, etc. When calling Where for IQueryable<T>, apparently the call is compiled to the Where extension method for IQueryable<T>, not the Enumerable.Where extension method for IEnumerable<T>. To use LINQ to Objects’ Enumerable.Where method for ParallelQuery<T> and IQueryable<T>, AsEnumerable query method can be used, which is discussed later in this chapter. ParallelQuery<T> is covered in the Parallel LINQ chapters, and IQueryable<T> is covered in the LINQ to Entities chapters.

For history reason, there are some types may only implement IEnumerable, but not implement IEnumerable<T>. A Cast query method is provided to cast non-generic sequence to generic sequence for further LINQ to Objects query, which is discussed later.