---
title: "LINQ to Objects in Depth (6) Advanced Queries in Interactive Extensions (Ix)"
published: 2019-07-06
description: "The previous 2 chapters discussed the LINQ to Objects standard queries. Besides these built-in queries provided by System.Linq.Enumerable type in .NET Standard, Microsoft also provides additional LINQ"
image: ""
tags: [".NET", "C#", "Functional Programming", "Iteractive Extensions", "Ix", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: "LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

The previous 2 chapters discussed the LINQ to Objects standard queries. Besides these built-in queries provided by System.Linq.Enumerable type in .NET Standard, Microsoft also provides additional LINQ to Objects queries through the System.Interactive NuGet package (aka Interactive Extensions library, or Ix). Ix has a System.Linq.EnumerableEx type with the following queries:

· Sequence queries: output a new IEnumerable<T> sequence (deferred execution)

o Generation: Defer, Create, Return, Repeat

o Filtering: IgnoreElements\*, DistinctUntilChanged

o Mapping: SelectMany, Scan, Expand

o Concatenation: Concat, StartWith

o Set: Distinct

o Partitioning: TakeLast\*, SkipLast\*\*

o Conversion: Hide

o Buffering: Buffer\*, Share, Publish, Memoize

o Exception handling: Throw, Catch, Finally, OnErrorResumeNext, Retry

o Control flow: If, Case, Using, While, DoWhile, Generate, For

o Iteration: Do

· Value queries: output a single value (immediate execution)

o Aggregation: Min, Max, MinBy, MaxBy

o Quantifiers: isEmpty

· Void queries: no output (immediate execution)

o Iteration: ForEach

Many of these queries are handy and useful. However, there is not much documentation provided from Microsoft, except the APIs’ XML comments. This chapter discusses these queries by either providing examples and/or demonstrating their internal implementation, whichever is more intuitive.

Similar to Enumerable queries, the EnumerableEx queries with a sequence output implements deferred execution, and the other queries implements immediate execution. For the sequence queries, the ones marked with \* implement eager evaluation, and the unmarked queries implements lazy evaluation. The SkipLast query marked with \*\* is slightly different, it can be fully eager evaluation or partially eager evaluation, which is discussed later.

## Sequence queries

Similar to the standard sequence queries, the Ix sequence queries follow iterator pattern to implement deferred execution. Many of them uses yield statement for generator, and some queries are implemented by the composition of other standard and Ix queries.

### Generation

Defer accepts a sequence factory function:

public static IEnumerable<TResult\> Defer<TResult\>(

```csharp
Func<IEnumerable<TResult>> enumerableFactory)
```
```csharp
{
```
```csharp
foreach (TResult value in enumerableFactory())
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```

}

And it defers the execution of the factory function:

internal static void Defer(IEnumerable<string> source)

```csharp
{
```
```csharp
IEnumerable<string> Distinct()
```
```csharp
{
```
```csharp
"Instantiate hash set.".WriteLine();
```
```csharp
HashSet<string> hashSet = new HashSet<string>();
```
```csharp
return source.Where(hashSet.Add); // Deferred execution.
```
```csharp
}
```

```csharp
IEnumerable<string> distinct1 = Distinct() // Hash set is instantiated.
```
```csharp
.Where(@string => @string.Length > 10);
```
```csharp
IEnumerable<string> distinct2 = EnumerableEx.Defer(Distinct) // Hash set is not instantiated.
```
```csharp
.Where(@string => @string.Length > 10);
```

}

Similarly, Create accepts an iterator factory function, and delays its execution:

public static IEnumerable<TResult\> Create<TResult\>(

```csharp
Func<IEnumerator<TResult>> getEnumerator)
```
```csharp
{
```
```csharp
using (IEnumerator<TResult> iterator = getEnumerator())
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
yield return iterator.Current; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

The other overload of Create is not so intuitive:

public static IEnumerable<T\> Create<T\>(Action<IYielder<T\>> create);

It accepts a callback function of type System.Linq.IYielder<T> –> void. IYielder<T> has 2 methods, Return and Break, representing the 2 forms of yield statement.

public interface IYielder<in T\>

```csharp
{
```
```csharp
IAwaitable Return(T value);
```

```csharp
IAwaitable Break();
```

}

In C#, lambda expression does not support yield statements, compiling the following code causes error CS1621: The yield statement cannot be used inside an anonymous method or lambda expression.

// Cannot be compiled.

```csharp
internal static void Create()
```
```csharp
{
```
```csharp
Func<IEnumerable<int>> sequenceFactory = () =>
```
```csharp
{
```
```csharp
yield return 0;
```
```csharp
yield return 1;
```
```csharp
yield break;
```
```csharp
yield return 2;
```
```csharp
};
```
```csharp
IEnumerable<int> sequence = sequenceFactory();
```
```csharp
sequence.WriteLines(); // 0 1
```

}

Here Create provides a way to virtually use the yield statements in lambda expression:

internal static void Create()

```csharp
{
```
```csharp
Action<IYielder<int>> sequenceFactory = async yield =>
```
```csharp
{
```
```csharp
await yield.Return(0); // yield return 0;
```
```csharp
await yield.Return(1); // yield return 1;
```
```csharp
await yield.Break(); // yield break;
```
```csharp
await yield.Return(2); // yield return 2;
```
```csharp
};
```
```csharp
IEnumerable<int>sequence = EnumerableEx.Create(sequenceFactory);
```
```csharp
sequence.WriteLines(); // 0 1
```

}

IYielder<T> is a good invention before C# 7.0 introduces local function, but at runtime, it can have unexpected iterator behaviour when used with more complex control flow, like try-catch statement. Please avoid using this query. In the above examples, define local function to use yield return statement:

internal static void Create()

```csharp
{
```
```csharp
IEnumerable<int>SequenceFactory()
```
```csharp
{
```
```csharp
yield return 0; // Deferred execution.
```
```csharp
yield return 1;
```
```csharp
yield break;
```
```csharp
yield return 2;
```
```csharp
}
```
```csharp
IEnumerable<int>sequence = SequenceFactory();
```
```csharp
sequence.WriteLines(); // 0 1
```

}

Return just wraps value in a singleton sequence:

public static IEnumerable<TResult\> Return<TResult\>(TResult value)

```csharp
{
```
```csharp
yield return value; // Deferred execution.
```

}

It is called Return, because “return” is a term used in functional languages like Haskell, which means to wrap something in a monad (Monad is discussed in detail in the Category Theory chapters). However, in C# “return” means the current function member gives control to its caller with an optional output. It could be more consistent with .NET naming convention if this function is named as FromValue, similar to Task.FromResult, Task.FromException, DateTime.FromBinary, DateTimeOffset.FromFileTime, TimeSpan.FromSeconds, RegistryKey.FromHandle, etc.

Repeat generates an infinite sequence by repeating a value forever:

public static IEnumerable<TResult\> Repeat<TResult\>(TResult value)

```csharp
{
```
```csharp
while (true)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```

}

Another overload repeats values in the specified sequence. Its implementation is equivalent to:

public static IEnumerable<TSource\> Repeat<TSource\>(this IEnumerable<TSource\> source, int? count = null)

```csharp
{
```
```csharp
if (count == null)
```
```csharp
{
```
```csharp
while (true)
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

```csharp
for (int i = 0; i< count; i++)
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

When count is not provided, it repeats the values of the source sequence forever.

### Filtering

IgnoreElements filters out all values from the source sequence:

public static IEnumerable<TSource\> IgnoreElements<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
foreach (TSource value in source) { } // Eager evaluation.
```
```csharp
yield break; // Deferred execution.
```

}

DistinctUntilChanged removes the continuous duplication:

public static IEnumerable<TSource\> DistinctUntilChanged<TSource\>(this IEnumerable<TSource\> source);

```csharp
public static IEnumerable<TSource> DistinctUntilChanged<TSource>(
```
```csharp
this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer);
```

```csharp
public static IEnumerable<TSource> DistinctUntilChanged<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IEnumerable<TSource> DistinctUntilChanged<TSource, TKey>(
```

this IEnumerable<TSource\> source, Func<TSource, TKey\>keySelector, IEqualityComparer<TKey\> comparer);

For example:

internal static void DistinctUntilChanged()

```csharp
{
```
```csharp
IEnumerable<int>source = new int[]
```
```csharp
{
```
```csharp
0, 0, 0, /* Change. */ 1, 1, /* Change. */ 0, 0, /* Change. */ 2, /* Change. */ 1, 1
```
```csharp
};
```
```csharp
source.DistinctUntilChanged().WriteLines(); // 0 1 0 2 1
```

}

### Mapping

A SelectMany overload is provided to map source sequence’s each value to the other sequence:

public static IEnumerable<TOther\> SelectMany<TSource, TOther\>(

```csharp
this IEnumerable<TSource> source, IEnumerable<TOther> other) =>
```

source.SelectMany(value => other);

Scan accepts the same parameters as Aggregate. The difference is, Aggregate outputs one final accumulation step’s result, Scan returns a sequence of all accumulation steps’ results. Its implementation is equivalent to:

public static IEnumerable<TSource\> Scan<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TSource, TSource> func)
```
```csharp
{
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```csharp
{
```
```csharp
if (!iterator.MoveNext())
```
```csharp
{
```
```csharp
yield break; // Deferred execution.
```
```csharp
}
```
```csharp
TSource accumulate = iterator.Current;
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
yield return accumulate = func(accumulate, iterator.Current); // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

```csharp
public static IEnumerable<TAccumulate> Scan<TSource, TAccumulate>(
```
```csharp
this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func) =>
```

source.Select(value => seed = func(seed, value));

For example:

internal static void Scan()

```csharp
{
```
```csharp
int finalProduct = Int32Source().Aggregate((product, int32) => product * int32).WriteLine();
```
```csharp
// ((((-1 * 1) * 2) * 3) * -4) => 24.
```

```csharp
IEnumerable<int> allProducts = Int32Source().Scan((product, int32) => product * int32).WriteLines();
```
```csharp
// ((((-1 * 1) * 2) * 3) * -4) => { -1, -2, -6, 24 }.
```

}

Expand maps source values with the selector, then maps the result values with the selector, and keeps going on.

public static IEnumerable<TSource\> Expand<TSource\>(this IEnumerable<TSource\> source, Func<TSource, IEnumerable<TSource\>> selector);

In the following example, selector maps each value to a singleton sequence:

internal static void ExpandSingle()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(0, 5)
```
```csharp
.Expand(int32 => EnumerableEx.Return(int32 * int32))
```
```csharp
.Take(25)
```
```csharp
.WriteLines();
```
```csharp
// 0 1 2 3 4, map each int32 to { int32 * int32 } =>
```
```csharp
// 0 1 4 9 16, map each int32 to { int32 * int32 }: =>
```
```csharp
// 0 1 16 81 256, map each int32 to { int32 * int32 } =>
```
```csharp
// 0 1 256 6561 65536, map each int32 to { int32 * int32 } =>
```
```csharp
// 0 1 65536 43046721 4294967296, ...
```

}

The mapping can go on forever and results an infinite sequence. If selector maps each value to a sequence with more than one values, then the result sequences grows rapidly:

internal static void ExpandMuliple()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(0, 5)
```
```csharp
.Expand(int32 => Enumerable.Repeat(int32, 2))
```
```csharp
.Take(75)
```
```csharp
.WriteLines();
```
```csharp
// 0 1 2 3 4 => map each int32 to { int32, int32 }:
```
```csharp
// 0 0 1 1 2 2 3 3 4 4 => map each int32 to { int32, int32 }:
```
```csharp
// 0 0 0 0 1 1 1 1 2 2 2 2 3 3 3 3 4 4 4 4 => map each int32 to { int32, int32 }:
```
```csharp
// 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 3 3 3 3 3 3 3 3 4 4 4 4 4 4 4 4 => ...
```

}

If selector maps each value to empty sequence, the expanding ends after all source values are iterated:

internal static void ExpandNone()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(0, 5)
```
```csharp
.Expand(int32 => Enumerable.Empty<int>())
```
```csharp
.Take(100)
```
```csharp
.WriteLines();
```
```csharp
// 0 1 2 3 4 => map each int32 to { }.
```

}

### Concatenation

2 more overloads of Concat is provided to concatenate any number of sequences:

public static IEnumerable<TSource\> Concat<TSource\>(

```csharp
this IEnumerable<IEnumerable<TSource>> sources) =>
```
```csharp
sources.SelectMany(source => source);
```

```csharp
public static IEnumerable<TSource> Concat<TSource>(
```

params IEnumerable<TSource\>\[\] sources) => sources.Concat();

By concatenating the sequences one after another, Concat flattens a hierarchical 2-level-sequence into a flat 1-level-sequence, which works the same as SelectMany.

StartWith prepend the specified values to the source sequence. It is similar to Prepend. Prepend accepts a single prefix value, but StartWith supports multiple prefix values:

public static IEnumerable<TSource\> StartWith<TSource\>(

this IEnumerable<TSource\> source, params TSource\[\] values) => values.Concat(source);

### Set

An overload of Distinct is provided to accept a key selector function:

public static IEnumerable<TSource\> Distinct<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IEqualityComparer<TKey> comparer = null)
```
```csharp
{
```
```csharp
HashSet<TKey>hashSet = new HashSet<TKey>(comparer);
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (hashSet.Add(keySelector(value)))
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

### Partitioning

Skip/Take skips/takes the specified number of values at the beginning of the source sequence. In contrast, SkipLast/TakeLast skips/takes the specified number of values at the end of the source sequence:

public static IEnumerable<TSource\> SkipLast<TSource\>(this IEnumerable<TSource\> source, int count);

public static IEnumerable<TSource\> TakeLast<TSource\>(this IEnumerable<TSource\> source, int count);

For example:

internal static void SkipLastTakeLast()

```csharp
{
```
```csharp
int[] skipFirst2 = Enumerable.Range(0, 5).Skip(2).ToArray(); // 2 3 4.
```
```csharp
int[] skipLast2 = Enumerable.Range(0, 5).SkipLast(2).ToArray(); // 0 1 2.
```
```csharp
int[] takeFirst2 = Enumerable.Range(0, 5).Take(2).ToArray(); // 0 1.
```
```csharp
int[] takeLast2 = Enumerable.Range(0, 5).TakeLast(2).ToArray(); // 3 4.
```

}

The implementation of SkipLast/TakeLast is very interesting. As already discussed, Take implements lazy evaluation. However, TakeLast has to pull all values to know which are the tail values of the source sequence. So TakeLast implements eager evaluation, and uses a queue to store the tail values:

public static IEnumerable<TSource\> TakeLast<TSource\>(this IEnumerable<TSource\> source, int count)

```csharp
{
```
```csharp
if (count < 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(count));
```
```csharp
}
```

```csharp
IEnumerable<TSource> TakeLastGGenerator()
```
```csharp
{
```
```csharp
if (count <= 0)
```
```csharp
{
```
```csharp
yield break; // Deferred execution.
```
```csharp
}
```
```csharp
Queue<TSource>lastValues = new Queue<TSource>(count);
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (lastValues.Count >= count)
```
```csharp
{
```
```csharp
lastValues.Dequeue();
```
```csharp
}
```

```csharp
lastValues.Enqueue(value);
```
```csharp
} // Eager evaluation.
```
```csharp
while (lastValues.Count> 0)
```
```csharp
{
```
```csharp
yield return lastValues.Dequeue(); // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
return TakeLastGGenerator();
```

}

SkipLast also uses a queue to store the tail values:

public static IEnumerable<TSource\> SkipLast<TSource\>(this IEnumerable<TSource\> source, int count)

```csharp
{
```
```csharp
if (count < 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(count));
```
```csharp
}
```

```csharp
IEnumerable<TSource> SkipLastGenerator()
```
```csharp
{
```
```csharp
Queue<TSource>lastValues = new Queue<TSource>();
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
lastValues.Enqueue(value);
```
```csharp
if (lastValues.Count > count) // Can be lazy, eager, or between.
```
```csharp
{
```
```csharp
yield return lastValues.Dequeue(); // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
return SkipLastGenerator();
```

}

It uses count as the max length of the queue. When SkipLast starts to execute, it evaluates values to fill the queue. When the queue is full, each new value is enqueued, and the head value of the queue is dequeued and yielded. So, at the end of query execution, the values still stored in the queue are exactly the last values to skip. If count is equal to or greater than the source sequence’s value count, when executing query, all values are pulled from the source sequence and stored in the queue, and nothing is yielded to the caller, which is fully eager evaluation similar to IgnoreElements. If count is less than the source’s value count, when executing query, some values are pulled from the source sequence to fill the queue, then values are yielded, which can be viewed as partially eager evaluation. When count is 0, it does not skip anything, just simply yield each source value, which is like lazy evaluation. So SkipLast’s eagerness/laziness depends on the count of values to skip.

### Conversion

Hide has the same signature as AsEnumerable. As previously demonstrated, AsEnumerable simply outputs the source sequence itself to caller. Hide returns a new generator to hide the source sequence from the caller:

public static IEnumerable<TSource\> Hide<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```

}

The difference is, the output sequence of AsEnumerable can be converted back to the original type, which the output sequence of Hide cannot, since it is a newly constructed generator:

internal static void Hide()

```csharp
{
```
```csharp
List<int>source = new List<int>() { 1, 2 };
```
```csharp
IEnumerable<int>readWrite = source.AsEnumerable();
```
```csharp
object.ReferenceEquals(source, readWrite).WriteLine(); // True
```
```csharp
((List<int>)readWrite).Reverse(); // List<T>.Reverse.
```
```csharp
((List<int>)readWrite).Add(3); // List<T>.Add.
```

```csharp
IEnumerable<int> readOnly = source.Hide();
```
```csharp
object.ReferenceEquals(source, readOnly).WriteLine(); // False
```

}

### Buffering

Buffer segments the source sequence into smaller lists:

public static IEnumerable<IList<TSource\>> Buffer<TSource\>(this IEnumerable<TSource\> source, int count, int skip);

Here count is the length of each smaller list, and skip is the offset to start the next list. For example:

internal static void Buffer()

```csharp
{
```
```csharp
IEnumerable<IList<int>> buffers1 = Enumerable.Range(0, 5).Buffer(2, 1);
```
```csharp
// {
```
```csharp
// { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 4 }, { 4 }
```
```csharp
// }
```

```csharp
IEnumerable<IList<int>> buffers2 = Enumerable.Range(0, 5).Buffer(2, 2); // Equivalent to Buffer(2).
```
```csharp
// {
```
```csharp
// { 0, 1 }, { 2, 3 }, { 4 }
```
```csharp
// }
```

```csharp
IEnumerable<IList<int>> buffers3 = Enumerable.Range(0, 5).Buffer(2, 3);
```
```csharp
// {
```
```csharp
// { 0, 1 }, { 3, 4 }
```
```csharp
// }
```

}

Buffer implements eager evaluation. it creates all the smaller lists when the first list is pulled.

The other overload without skip uses count as skip:

public static IEnumerable<IList<TSource\>> Buffer<TSource\>(this IEnumerable<TSource\> source, int count);

In above example, calling Buffer(2, 2) is equivalent to Buffer(2).

Share buffers the values of a sequence and share them with several iterators:

public static IBuffer<TSource\> Share<TSource\>(this IEnumerable<TSource\> source);

The output type System.Linq.IBuffer<T> is a composition of IEnumerable<T> and IDisposable:

namespace System.Linq

```csharp
{
```
```typescript
public interface IBuffer<out T> : IEnumerable<T>, IEnumerable, IDisposable { }
```

}

By default, an IEnumerable<T> sequence’s multiple iterators are independent from each other. When these iterators are called, callers pull independent values from each iterator. In contrast, multiple shared iterators work as if they are the same single iterator:

internal static void Share()

```csharp
{
```
```csharp
IEnumerable<int>sequence = Enumerable.Range(0, 5);
```
```csharp
IEnumerator<int>independentIteratorA = sequence.GetEnumerator();
```
```csharp
IEnumerator<int>independentIteratorB = sequence.GetEnumerator(); // A|B|C
```
```csharp
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 0| |
```
```csharp
independentIteratorB.MoveNext(); independentIteratorB.Current.WriteLine(); // |0|
```
```csharp
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 1| |
```
```csharp
IEnumerator<int> independentIteratorC = sequence.GetEnumerator(); // | |
```
```csharp
independentIteratorC.MoveNext(); independentIteratorC.Current.WriteLine(); // | |0
```
```csharp
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 2| |
```
```csharp
independentIteratorB.MoveNext(); independentIteratorB.Current.WriteLine(); // |1|
```
```csharp
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 3| |
```
```csharp
// ...
```

```csharp
IBuffer<int> share = Enumerable.Range(0, 5).Share();
```
```csharp
IEnumerator<int>sharedIterator1 = share.GetEnumerator();
```
```csharp
IEnumerator<int>sharedIterator2 = share.GetEnumerator(); // A|B|C
```
```csharp
sharedIterator1.MoveNext(); sharedIterator1.Current.WriteLine(); // 0| |
```
```csharp
sharedIterator2.MoveNext(); sharedIterator2.Current.WriteLine(); // |1|
```
```csharp
sharedIterator1.MoveNext(); sharedIterator1.Current.WriteLine(); // 2| |
```
```csharp
IEnumerator<int> sharedIterator3 = share.GetEnumerator(); // | |
```
```csharp
sharedIterator3.MoveNext(); sharedIterator3.Current.WriteLine(); // | |3
```

```csharp
share.Dispose();
```
```csharp
sharedIterator1.MoveNext(); // ObjectDisposedException.
```
```csharp
sharedIterator2.MoveNext(); // ObjectDisposedException.
```
```csharp
sharedIterator3.MoveNext(); // ObjectDisposedException.
```

}

When pulling values with multiple independent iterators, each value can be pulled multiple times. When pulling values with multiple shared iterators, each value can only be pulled once. And IBuffer<T>.Dispose terminates the sharing. After calling Dispose, all shared iterators’ MoveNext throws ObjectDisposedException.

The other overload accepts a selector function:

public static IEnumerable<TResult\> Share<TSource, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<IEnumerable<TSource>, IEnumerable<TResult>> selector) =>
```

Create(() => selector(source.Share()).GetEnumerator());

For example:

internal static void ConcatShared()

```csharp
{
```
```csharp
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```csharp
source1.Concat(source1).WriteLines(); // 0 1 2 3 4 0 1 2 3 4
```

```csharp
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```csharp
{
```
```csharp
source2.Concat(source2).WriteLines(); // 0 1 2 3 4
```
```csharp
}
```
```csharp
// Equivalent to:
```
```csharp
IEnumerable<int> source3 = Enumerable.Range(0, 5);
```
```csharp
source3.Share(source => source.Concat(source)).WriteLines(); // 0 1 2 3 4
```

}

The above 2 kinds of Share usage are equivalent. As already discussed, Concat can be desugared as:

public static IEnumerable<TSource\> Concat<TSource\>(

```csharp
IEnumerable<TSource>first, IEnumerable<TSource> second)
```
```csharp
{
```
```csharp
using (IEnumerator<TSource> iterator1 = first.GetEnumerator())
```
```csharp
{
```
```csharp
while (iterator1.MoveNext())
```
```csharp
{
```
```csharp
yield return iterator1.Current;
```
```csharp
}
```
```csharp
}
```
```csharp
using (IEnumerator<TSource> iterator2 = second.GetEnumerator())
```
```csharp
{
```
```csharp
while (iterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return iterator2.Current;
```
```csharp
}
```
```csharp
}
```

}

So that the above 3 Concat calls can be virtually viewed as:

internal static void DesugaredConcatShared()

```csharp
{
```
```csharp
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<int>Concat1() // source1.Concat(source1)
```
```csharp
{
```
```csharp
using (IEnumerator<int> independentIterator1 = source1.GetEnumerator())
```
```csharp
{
```
```csharp
while (independentIterator1.MoveNext())
```
```csharp
{
```
```csharp
yield return independentIterator1.Current; // Yield 0 1 2 3 4.
```
```csharp
}
```
```csharp
}
```
```csharp
using (IEnumerator<int> independentIterator2 = source1.GetEnumerator())
```
```csharp
{
```
```csharp
while (independentIterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return independentIterator2.Current; // Yield 0 1 2 3 4.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
Concat1().WriteLines();
```

```csharp
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```csharp
{
```
```csharp
IEnumerable<int>Concat2() // source2.Concat(source2)
```
```csharp
{
```
```csharp
using (IEnumerator<int> sharedIterator1 = source2.GetEnumerator())
```
```csharp
{
```
```csharp
while (sharedIterator1.MoveNext())
```
```csharp
{
```
```csharp
yield return sharedIterator1.Current; // Yield 0 1 2 3 4.
```
```csharp
}
```
```csharp
}
```
```csharp
using (IEnumerator<int> sharedIterator2 = source2.GetEnumerator())
```
```csharp
{
```
```csharp
while (sharedIterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return sharedIterator2.Current; // Yield nothing.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
Concat2().WriteLines();
```
```csharp
}
```

```csharp
IEnumerable<int>source3 = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<int>Concat3() // source3.Share(source => source.Concat(source))
```
```csharp
{
```
```csharp
using (IBuffer<int> source = source3.Share())
```
```csharp
{
```
```csharp
using (IEnumerator<int> sharedIterator1 = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (sharedIterator1.MoveNext())
```
```csharp
{
```
```csharp
yield return sharedIterator1.Current; // Yield 0 1 2 3 4.
```
```csharp
}
```
```csharp
}
```
```csharp
using (IEnumerator<int> sharedIterator2 = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (sharedIterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return sharedIterator2.Current; // Yield nothing.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
Concat3().WriteLines();
```

}

When Concat is executed, if values are pulled from 2 independent iterators, both iterators yield all source values; if values are pulled from 2 shared iterators. only the first iterator yields all source values, and the second iterator yields nothing. Another example is Zip:

internal static void ZipShared()

```csharp
{
```
```csharp
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```csharp
source1.Zip(source1, ValueTuple.Create).WriteLines(); // (0, 0) (1, 1) (2, 2) (3, 3) (4, 4)
```

```csharp
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```csharp
{
```
```csharp
source2.Zip(source2, ValueTuple.Create).WriteLines(); // (0, 1) (2, 3)
```
```csharp
}
```
```csharp
// Equivalent to:
```
```csharp
IEnumerable<int> source3 = Enumerable.Range(0, 5);
```
```csharp
source3.Share(source => source.Zip(source, ValueTuple.Create)).WriteLines(); // (0, 1) (2, 3).
```

}

Similarly, the above 3 Zip calls can be virtually viewed as:

internal static void DesugaredZipShared()

```csharp
{
```
```csharp
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<(int, int)> Zip1()
```
```csharp
{
```
```csharp
using (IEnumerator<int> independentIterator1 = source1.GetEnumerator())
```
```csharp
using (IEnumerator<int> independentIterator2 = source1.GetEnumerator())
```
```csharp
{
```
```csharp
while (independentIterator1.MoveNext() && independentIterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return (independentIterator1.Current, independentIterator2.Current);
```
```csharp
// Yield (0, 0) (1, 1) (2, 2) (3, 3) (4, 4).
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
Zip1().WriteLines();
```

```csharp
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```csharp
{
```
```csharp
IEnumerable<(int, int)> Zip2()
```
```csharp
{
```
```csharp
using (IEnumerator<int> sharedIterator1 = source2.GetEnumerator())
```
```csharp
using (IEnumerator<int> sharedIterator2 = source2.GetEnumerator())
```
```csharp
{
```
```csharp
while (sharedIterator1.MoveNext() && sharedIterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return (sharedIterator1.Current, sharedIterator2.Current);
```
```csharp
// Yield (0, 1) (2, 3).
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
Zip2().WriteLines();
```
```csharp
}
```

```csharp
IEnumerable<int>source3 = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<(int, int)> Zip3()
```
```csharp
{
```
```csharp
using (IBuffer<int> source = source3.Share())
```
```csharp
using (IEnumerator<int> sharedIterator1 = source.GetEnumerator())
```
```csharp
using (IEnumerator<int> sharedIterator2 = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (sharedIterator1.MoveNext() && sharedIterator2.MoveNext())
```
```csharp
{
```
```csharp
yield return (sharedIterator1.Current, sharedIterator2.Current);
```
```csharp
// yields (0, 1) (2, 3).
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
Zip3().WriteLines();
```

}

Publish has the same signatures as Share:

public static IBuffer<TSource\> Publish<TSource\>(this IEnumerable<TSource\> source);

```csharp
public static IEnumerable<TResult> Publish<TSource, TResult>(
```

this IEnumerable<TSource\> source, Func<IEnumerable<TSource\>, IEnumerable<TResult\>>selector);

It also buffers the values in a different way, so each iterator yields all remainder values:

internal static void Publish()

```csharp
{
```
```csharp
using (IBuffer<int> publish = Enumerable.Range(0, 5).Publish())
```
```csharp
{
```
```csharp
IEnumerator<int>remainderIteratorA = publish.GetEnumerator();
```
```csharp
// remainderIteratorA: 0 1 2 3 4. A|B|C
```
```csharp
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 0| |
```
```csharp
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 1| |
```
```csharp
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 2| |
```
```csharp
IEnumerator<int> remainderIteratorB = publish.GetEnumerator(); // | |
```
```csharp
// remainderIteratorB: 3 4. | |
```
```csharp
remainderIteratorB.MoveNext(); remainderIteratorB.Current.WriteLine(); // |3|
```
```csharp
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 3| |
```
```csharp
IEnumerator<int> remainderIteratorC = publish.GetEnumerator(); // | |
```
```csharp
// remainderIteratorC: 4. | |
```
```csharp
remainderIteratorB.MoveNext(); remainderIteratorB.Current.WriteLine(); // |4|
```
```csharp
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 4| |
```
```csharp
remainderIteratorC.MoveNext(); remainderIteratorC.Current.WriteLine(); // | |4
```
```csharp
}
```

}

Memoize (not Memorize) simply buffers all values:

public static IBuffer<TSource\> Memoize<TSource\>(this IEnumerable<TSource\> source);

```csharp
public static IEnumerable<TResult> Memoize<TSource, TResult>(
```

this IEnumerable<TSource\> source, Func<IEnumerable<TSource\>, IEnumerable<TResult\>>selector);

The term memoize/memoization means buffering the function call result, so that when the same call happens again, the buffered result can be returned. Its multiple iterators work like independent, but each value is only pulled once and is buffered for reuse:

internal static void Memoize()

```csharp
{
```
```csharp
using (IBuffer<int> memoize = Enumerable.Range(0, 5).Memoize())
```
```csharp
{
```
```csharp
IEnumerator<int>bufferIteratorA = memoize.GetEnumerator();
```
```csharp
// bufferIteratorA: 0 1 2 3 4. A|B|C
```
```csharp
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 0| |
```
```csharp
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 1| |
```
```csharp
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 2| |
```
```csharp
IEnumerator<int> bufferIteratorB = memoize.GetEnumerator(); // | |
```
```csharp
// bufferIteratorB: 0 1 2 3 4. | |
```
```csharp
bufferIteratorB.MoveNext(); bufferIteratorB.Current.WriteLine(); // |0|
```
```csharp
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 3| |
```
```csharp
IEnumerator<int> bufferIteratorC = memoize.GetEnumerator(); // | |
```
```csharp
// bufferIteratorC: 0 1 2 3 4. | |
```
```csharp
bufferIteratorB.MoveNext(); bufferIteratorB.Current.WriteLine(); // |1|
```
```csharp
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 4| |
```
```csharp
bufferIteratorC.MoveNext(); bufferIteratorC.Current.WriteLine(); // | |0
```
```csharp
bufferIteratorC.MoveNext(); bufferIteratorC.Current.WriteLine(); // | |1
```
```csharp
bufferIteratorB.MoveNext(); bufferIteratorB.Current.WriteLine(); // |2|
```
```csharp
// ...
```
```csharp
}
```

}

There 2 more overloads accept a readerCount to specify how many times can the buffered values be reused:

public static IBuffer<TSource\> Memoize<TSource\>(

```csharp
this IEnumerable<TSource> source, int readerCount);
```

```csharp
public static IEnumerable<TResult> Memoize<TSource, TResult>(
```

this IEnumerable<TSource\> source, int readerCount, Func<IEnumerable<TSource\>, IEnumerable<TResult\>> selector);

When exceeding the readerCount, an InvalidOperationException is thrown:

internal static void MemoizeWithReaderCount()

```csharp
{
```
```csharp
using (IBuffer<int> source1 = Enumerable.Range(0, 5).Memoize(2))
```
```csharp
{
```
```csharp
int[] reader1 = source1.ToArray(); // First full iteration.
```
```csharp
int[] reader2 = source1.ToArray(); // Second full iteration.
```
```csharp
int[] reader3 = source1.ToArray(); // Third full iteration: InvalidOperationException.
```
```csharp
}
```

```csharp
IEnumerable<int>source2 = Enumerable.Range(0, 5);
```
```csharp
source2
```
```csharp
.Memoize(
```
```csharp
readerCount: 2,
```
```csharp
selector: source => source // First full iteration.
```
```csharp
.Concat(source) // Second full iteration.
```
```csharp
.Concat(source)) // Third full iteration: InvalidOperationException.
```
```csharp
.WriteLines();
```

}

### Exception handling

The exception queries address some exception related scenarios for IEnumerable<T>. Throw query just throws the specified exception when executed:

public static IEnumerable<TResult\> Throw<TResult\>(Exception exception)

```csharp
{
```
```csharp
throw exception;
```
```csharp
yield break; // Deferred execution.
```

}

The yield break statement at the end is required for deferred execution. Without the yield break statement, the specified exception is thrown immediately when Throw is called. With the yield break statement, a generator is returned when Throw is called, and the specified exception is thrown when trying to pull value from the returned generator for the first time. For example:

internal static void Throw()

```csharp
{
```
```csharp
IEnumerable<int>@throw = EnumerableEx.Throw<int>(new OperationCanceledException());
```
```csharp
IEnumerable<int>query = Enumerable.Range(0, 5).Concat(@throw); // Define query.
```
```csharp
try
```
```csharp
{
```
```csharp
foreach (int value in query) // Execute query.
```
```csharp
{
```
```csharp
value.WriteLine();
```
```csharp
}
```
```csharp
}
```
```csharp
catch (OperationCanceledException exception)
```
```csharp
{
```
```csharp
exception.WriteLine();
```
```csharp
}
```
```csharp
// 0 1 2 3 4 System.OperationCanceledException: The operation was canceled.
```

}

Catch accepts a source sequence and an exception handler function. When the query is executed, it pulls and yields each value from source sequence. If there is no exception of the specified type thrown during the evaluation, the handler is not called. If any exception of the specified type is thrown, it calls the exception handler with the exception. The handler returns a sequence, whose values are then pulled and yielded. So, Catch’s concept can be virtually viewed as:

// Cannot be compiled.

```csharp
public static IEnumerable<TSource> CatchWithYield<TSource, TException>(
```
```csharp
this IEnumerable<TSource> source, Func<TException, IEnumerable<TSource>> handler)
```
```csharp
where TException : Exception
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
catch (TException exception)
```
```csharp
{
```
```csharp
foreach (TSource value in handler(exception) ?? Empty<TSource>())
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

However, C# does not support yield statement inside try-catch statement. The above code cannot be compiled. The solution is to desugar the foreach statement to a while loop for iterator. Then the try-catch statement can go inside the loop, and only contains iterator’s MoveNext and Current calls, and the yield statement can go outside the try-catch statement.

public static IEnumerable<TSource\> Catch<TSource, TException\>(

```csharp
this IEnumerable<TSource> source, Func<TException, IEnumerable<TSource>> handler)
```
```csharp
where TException : Exception
```
```csharp
{
```
```csharp
TException firstException = null;
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (true)
```
```csharp
{
```
```csharp
TSource value;
```
```csharp
try // Only MoveNext and Current are inside try-catch.
```
```csharp
{
```
```csharp
if (iterator.MoveNext())
```
```csharp
{
```
```csharp
value = iterator.Current;
```
```csharp
}
```
```csharp
else
```
```csharp
{
```
```csharp
break; // Stops while loop at the end of iteration.
```
```csharp
}
```
```csharp
}
```
```csharp
catch (TException exception)
```
```csharp
{
```
```csharp
firstException = exception;
```
```csharp
break; // Stops while loop if TException is thrown.
```
```csharp
}
```
```csharp
yield return value; // Deferred execution, outside try-catch.
```
```csharp
}
```
```csharp
}
```
```csharp
if (firstException != null)
```
```csharp
{
```
```csharp
foreach (TSource value in handler(firstException) ?? Empty<TSource>())
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

And here is a simple example:

internal static void CatchWithHandler()

```csharp
{
```
```csharp
IEnumerable<string> @throw = EnumerableEx.Throw<string>(
```
```csharp
new OperationCanceledException());
```
```csharp
IEnumerable<string>@catch = @throw.Catch<string, OperationCanceledException>(
```
```csharp
exception => EnumerableEx.Return($"Handled {exception.GetType().Name}: {exception.Message}"));
```
```csharp
@catch.WriteLines(); // Handled OperationCanceledException: The operation was canceled.
```

}

The other Catch overloads accepts multiple sequences, and outputs a single sequence. The idea is, when executed, it tries to pull and yield values of the first source sequence. if there is no exception, it stops execution; If any exception is thrown, it tries to pull and yield the values of the second source sequence, and so on; When stopping the evaluation, if there is any exception from the evaluation of the last sequence. If yes, it re-throws that exception. The concept is:

// Cannot be compiled.

```csharp
public static IEnumerable<TSource> CatchWithYield<TSource>(
```
```csharp
this IEnumerable<IEnumerable<TSource>> sources)
```
```csharp
{
```
```csharp
Exception lastException = null;
```
```csharp
foreach (IEnumerable<TSource> source in sources)
```
```csharp
{
```
```csharp
lastException = null;
```
```csharp
try
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
break; // Stops if no exception from current sequence.
```
```csharp
}
```
```csharp
catch (Exception exception)
```
```csharp
{
```
```csharp
lastException = exception;
```
```csharp
// Continue with next sequence if there is exception.
```
```csharp
}
```
```csharp
}
```
```csharp
if (lastException != null)
```
```csharp
{
```
```csharp
throw lastException;
```
```csharp
}
```

}

Again, the above code cannot be compiled because yield statement cannot be used with try-catch statement. So previous desugared while-try-catch-yield pattern can be used:

public static IEnumerable<TSource\> Catch<TSource\>(

```csharp
this IEnumerable<IEnumerable<TSource>> sources)
```
```csharp
{
```
```csharp
Exception lastException = null;
```
```csharp
foreach (IEnumerable<TSource> source in sources)
```
```csharp
{
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (true)
```
```csharp
{
```
```csharp
lastException = null;
```
```csharp
TSource value;
```
```csharp
try // Only MoveNext and Current are inside try-catch.
```
```csharp
{
```
```csharp
if (iterator.MoveNext())
```
```csharp
{
```
```csharp
value = iterator.Current;
```
```csharp
}
```
```csharp
else
```
```csharp
{
```
```csharp
break; // Stops while loop at the end of iteration.
```
```csharp
}
```
```csharp
}
```
```csharp
catch (Exception exception)
```
```csharp
{
```
```csharp
lastException = exception;
```
```csharp
break; // Stops while loop if TException is thrown.
```
```csharp
}
```
```csharp
yield return value; // Deferred execution, outside try-catch.
```
```csharp
}
```
```csharp
}
```
```csharp
if (lastException == null)
```
```csharp
{
```
```csharp
break; // If no exception, stops pulling the next source; otherwise, continue.
```
```csharp
}
```
```csharp
}
```
```csharp
if (lastException != null)
```
```csharp
{
```
```csharp
throw lastException;
```
```csharp
}
```
```csharp
}
```

```csharp
public static IEnumerable<TSource> Catch<TSource>(
```
```csharp
params IEnumerable<TSource>[] sources) => sources.Catch();
```

```csharp
public static IEnumerable<TSource> Catch<TSource>(
```
```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second) =>
```

new IEnumerable<TSource\>\[\] { first, second }.Catch();

For example:

internal static void Catch()

```csharp
{
```
```csharp
IEnumerable<int>scanWithException = Enumerable.Repeat(0, 5).Scan((a, b) => a / b); // Divide by 0.
```
```csharp
IEnumerable<int> range = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<int>castWithException = new object[] { 5, "a" }.Cast<int>();
```

```csharp
IEnumerable<IEnumerable<int>> source1 = new IEnumerable<int>[]
```
```csharp
{
```
```csharp
scanWithException, // Executed, with DivideByZeroException.
```
```csharp
range, // Executed, without exception.
```
```csharp
castWithException // Not executed.
```
```csharp
};
```
```csharp
source1.Catch().WriteLines(); // 0 1 2 3 4
```

```csharp
IEnumerable<IEnumerable<int>> source2 = new IEnumerable<int>[]
```
```csharp
{
```
```csharp
scanWithException, // Executed, with DivideByZeroException.
```
```csharp
castWithException // Executed, with InvalidCastException.
```
```csharp
};
```
```csharp
try
```
```csharp
{
```
```csharp
source2.Catch().WriteLines(); // 5
```
```csharp
}
```
```csharp
catch (InvalidCastException exception)
```
```csharp
{
```
```csharp
exception.WriteLine(); // System.InvalidCastException: Specified cast is not valid.
```
```csharp
}
```

}

Besides Throw and Catch, there is also Finally query. Finally is very intuitive:

public static IEnumerable<TSource\> Finally<TSource\>(this IEnumerable<TSource\> source, Action finalAction)

```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
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
finalAction();
```
```csharp
}
```

}

The above code can be compiled because yield statement is allowed in the try block of try-finally statement.

OnErrorResumeNext is similar to Concat, but it ignores any exception when evaluating values from each sequence. The idea is:

// Cannot be compiled.

```csharp
internal static IEnumerable<TSource> OnErrorResumeNextWithYield<TSource>(
```
```csharp
this IEnumerable<IEnumerable<TSource>> sources)
```
```csharp
{
```
```csharp
foreach (IEnumerable<TSource> source in sources)
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
catch { }
```
```csharp
}
```

}

Once again, this can be implemented with the desugared while-try-catch-yield pattern:

public static IEnumerable<TSource\> OnErrorResumeNext<TSource\>(

```csharp
this IEnumerable<IEnumerable<TSource>> sources)
```
```csharp
{
```
```csharp
foreach (IEnumerable<TSource> source in sources)
```
```csharp
{
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (true)
```
```csharp
{
```
```csharp
TSource value = default;
```
```csharp
try
```
```csharp
{
```
```csharp
if (!iterator.MoveNext())
```
```csharp
{
```
```csharp
break;
```
```csharp
}
```
```csharp
value = iterator.Current;
```
```csharp
}
```
```csharp
catch
```
```csharp
{
```
```csharp
break;
```
```csharp
}
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
}
```
```csharp
}
```

```csharp
public static IEnumerable<TSource> OnErrorResumeNext<TSource>(
```
```csharp
params IEnumerable<TSource>[] sources) => sources.OnErrorResumeNext();
```

```csharp
public static IEnumerable<TSource> OnErrorResumeNext<TSource>(
```
```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second) =>
```

new IEnumerable<TSource\>\[\] { first, second }.OnErrorResumeNext();

Retry query tries to yield the source values. If there is an exception thrown, it retries to yield the values again from the beginning of the source sequence. Its implementation is equivalent to:

public static IEnumerable<TSource\> Retry<TSource\>(

```csharp
this IEnumerable<TSource> source, int? retryCount = null) =>
```

Return(source).Repeat(retryCount).Catch();

If retryCount is not provided, it retries forever.

### Control flow

The If/Case/Using/While/DoWhile/Generate/For queries implements the control flows as fluent LINQ query. If represents the if-else statement. Its implementation is equivalent to:

public static IEnumerable<TResult\> If<TResult\>(

```csharp
Func<bool>condition, IEnumerable<TResult> thenSource, IEnumerable<TResult> elseSource = null) =>
```

Defer(() => condition() ? thenSource : elseSource ?? Enumerable.Empty<TResult\>());

Case represents the switch-case statement. It accepts a selector function as the key factory, and a dictionary of key-sequence pairs, where each key represents a case label of the switch statement. When Case query is executed, the selector function is called to get a key. If the dictionary contains that key, then the matching sequence is the query output; otherwise, a default sequence is the query output:

public static IEnumerable<TResult\> Case<TValue, TResult\>(

```csharp
Func<TValue>selector,
```
```csharp
IDictionary<TValue, IEnumerable<TResult>>sources,
```
```csharp
IEnumerable<TResult>defaultSource = null) =>
```
```csharp
Defer(() => sources.TryGetValue(selector(), out IEnumerable<TResult>result)
```
```csharp
? result
```

: (defaultSource ?? Enumerable.Empty<TResult\>()));

Using represents the using statement:

public static IEnumerable<TSource\> Using<TSource, TResource\>(

```csharp
Func<TResource>resourceFactory, Func<TResource, IEnumerable<TSource>> enumerableFactory)
```
```csharp
where TResource : IDisposable
```
```csharp
{
```
```csharp
using (TResource resource = resourceFactory())
```
```csharp
{
```
```csharp
foreach (TSource value in enumerableFactory(resource))
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

While represents the while loop:

public static IEnumerable<TResult\> While<TResult\>(Func<bool\> condition, IEnumerable<TResult\> source)

```csharp
{
```
```csharp
while (condition())
```
```csharp
{
```
```csharp
foreach (TResult value in source)
```
```csharp
{
```
```csharp
yield return value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

DoWhile represents the do-while loop:

public static IEnumerable<TResult\> DoWhile<TResult\>(

```csharp
this IEnumerable<TResult> source, Func<bool> condition) =>
```

source.Concat(While(condition, source));

Generate represents the for loop:

public static IEnumerable<TResult\> Generate<TState, TResult\>(

```csharp
TState initialState,
```
```csharp
Func<TState, bool> condition,
```
```csharp
Func<TState, TState> iterate,
```
```csharp
Func<TState, TResult> resultSelector)
```
```csharp
{
```
```csharp
for (TState state = initialState; condition(state); state = iterate(state))
```
```csharp
{
```
```csharp
yield return resultSelector(state); // Deferred execution.
```
```csharp
}
```

}

For also works the same as SelectMany. Its implementation is equivalent to:

public static IEnumerable<TResult\> For<TSource, TResult\>(

```csharp
IEnumerable<TSource>source, Func<TSource, IEnumerable<TResult>>resultSelector) =>
```

source.SelectMany(resultSelector);

It can be viewed as foreach statement – for each value in the source, call the resultSelector function and yields all results in the function’s output sequence. I am not sure why the 2 above queries are named as Generate and For.

### Iteration

Do does not transform the data in any way. It simply pulls source values just like Hide. It also accepts 3 callback functions, onNext, onError, and onCompleted. When each source value is pulled, onNext is called with the value. When exception is thrown for pulling source value, onError is called with the exception. After all source values are pulled successfully without exception, onCompleted is called. Its idea is:

public static IEnumerable<TSource> Do<TSource>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Action<TSource> onNext, Action<Exception> onError = null, Action onCompleted = null)
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
onNext(value);
```
```csharp
yield return value;
```
```csharp
}
```
```csharp
}
```
```csharp
catch (Exception exception)
```
```csharp
{
```
```csharp
onError?.Invoke(exception);
```
```csharp
throw;
```
```csharp
}
```
```csharp
onCompleted?.Invoke();
```

}

Once again, the yield statement does not work with try-catch statement. The above idea can be implemented with the desugared while-try-catch-yield pattern:

public static IEnumerable<TSource\> Do<TSource\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Action<TSource>onNext, Action<Exception>onError = null, Action onCompleted = null)
```
```csharp
{
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```csharp
{
```
```csharp
while (true)
```
```csharp
{
```
```csharp
TSource value;
```
```csharp
try
```
```csharp
{
```
```csharp
if (!iterator.MoveNext())
```
```csharp
{
```
```csharp
break;
```
```csharp
}
```
```csharp
value = iterator.Current;
```
```csharp
}
```
```csharp
catch (Exception exception)
```
```csharp
{
```
```csharp
onError?.Invoke(exception);
```
```csharp
throw;
```
```csharp
}
```
```csharp
onNext(value);
```
```csharp
yield return value; // Deferred execution, outside try-catch.
```
```csharp
}
```
```csharp
onCompleted?.Invoke();
```
```csharp
}
```

}

Do is very useful for logging and tracing LINQ queries, for example:

internal static void Do()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(-5, 10).Do(
```
```csharp
onNext: value => $"{nameof(Enumerable.Range)} yields {value}.".WriteLine(),
```
```csharp
onCompleted: () => $"{nameof(Enumerable.Range)} completes.".WriteLine())
```
```csharp
.Where(value => value > 0).Do(
```
```csharp
onNext: value => $"{nameof(Enumerable.Where)} yields {value}.".WriteLine(),
```
```csharp
onCompleted: () => $"{nameof(Enumerable.Where)} completes.".WriteLine())
```
```csharp
.TakeLast(2).Do(
```
```csharp
onNext: value => $"{nameof(EnumerableEx.TakeLast)} yields {value}.".WriteLine(),
```
```csharp
onCompleted: () => $"{nameof(EnumerableEx.TakeLast)} completes.".WriteLine())
```
```csharp
.WriteLines(value => $"Composited query yields result {value}.");
```
```csharp
// Range yields -5.
```
```csharp
// Range yields -4.
```
```csharp
// Range yields -3.
```
```csharp
// Range yields -2.
```
```csharp
// Range yields -1.
```
```csharp
// Range yields 0.
```
```csharp
// Range yields 1.
```
```csharp
// Where yields 1.
```
```csharp
// Range yields 2.
```
```csharp
// Where yields 2.
```
```csharp
// Range yields 3.
```
```csharp
// Where yields 3.
```
```csharp
// Range yields 4.
```
```csharp
// Where yields 4.
```
```csharp
// Range completes.
```
```csharp
// Where completes.
```
```csharp
// TakeLast yields 3.
```
```csharp
// Composited query yields result 3.
```
```csharp
// TakeLast yields 4.
```
```csharp
// Composited query yields result 4.
```
```csharp
// TakeLast completes.
```

}

Since System.IObserver<T> is the composition of above onNext, onError, onCompleted functions:

namespace System

```csharp
{
```
```csharp
public interface IObserver<in T>
```
```csharp
{
```
```csharp
void OnCompleted();
```

```csharp
void OnError(Exception error);
```

```csharp
void OnNext(T value);
```
```csharp
}
```

}

Do also has an overload accepting an observer:

public static IEnumerable<TSource\> Do<TSource\>(this IEnumerable<TSource\> source, IObserver<TSource\> observer) =>

Do(source, observer.OnNext, observer.OnError, observer.OnCompleted);

## Value queries

Ix provides a few queries for finding the extremum as well as empty test:

### Aggregation

The additional overloads of Max/Min accept a comparer function, and return the first maximum/minimum value:

public static TSource Max<TSource\>(

```csharp
this IEnumerable<TSource> source, IComparer<TSource> comparer);
```

```csharp
public static TSource Min<TSource>(
```

this IEnumerable<TSource\> source, IComparer<TSource\> comparer);

As fore mentioned, to use the standard Max/Min with a source sequence, exception is thrown if the source type does not implement IComparable or IComparable<T>, which is a problem when the source type cannot be modified to add IComparable or IComparable<T> implementation:

internal static void MaxMinGeneric()

```csharp
{
```
```csharp
Character maxCharacter = Characters().Max().WriteLine();
```
```csharp
Character minCharacter = Characters().Min().WriteLine();
```

}

The overloads with comparer does not have such requirement:

internal static void MaxMin()

```csharp
{
```
```csharp
Character maxCharacter = Characters()
```
```csharp
.Max(Comparer<Character>.Create((character1, character2) => string.Compare(
```
```csharp
character1.Name, character2.Name, StringComparison.OrdinalIgnoreCase)));
```
```csharp
Character minCharacter = Characters()
```
```csharp
.Max(Comparer<Character>.Create((character1, character2) => string.Compare(
```
```csharp
character1.Name, character2.Name, StringComparison.OrdinalIgnoreCase)));
```

}

MaxBy/MinBy accept key selector and key comparer functions, and their output is a list of all maximum/minimum values:

public static IList<TSource\> MaxBy<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IList<TSource> MaxBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IComparer<TKey> comparer);
```

```csharp
public static IList<TSource> MinBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IList<TSource> MinBy<TSource, TKey>(
```

this IEnumerable<TSource\> source, Func<TSource, TKey\>keySelector, IComparer<TKey\> comparer);

For example:

internal static void MaxByMinBy()

```csharp
{
```
```csharp
IList<Character>maxCharacters = Characters()
```
```csharp
.MaxBy(character => character.Name, StringComparer.OrdinalIgnoreCase);
```
```csharp
IList<Character>minCharacters = Characters()
```
```csharp
.MinBy(character => character.Name, StringComparer.OrdinalIgnoreCase);
```

}

The previous example of finding the maximum types in core library becomes easy with MaxBy:

internal static void MaxBy()

```csharp
{
```
```csharp
CoreLibrary.ExportedTypes
```
```csharp
.Select(type => (Type: type, MemberCount: type.GetDeclaredMembers().Length))
```
```csharp
.MaxBy(typeAndMemberCount => typeAndMemberCount.MemberCount)
```
```csharp
.WriteLines(max => $"{max.Type.FullName}:{max.MemberCount}"); // System.Convert:311
```

}

### Quantifiers

There is an IsEmpty query for convenience. It is just the opposite of Any:

public static bool IsEmpty<TSource\>(this IEnumerable<TSource\> source) => !source.Any();

## Void queries

Ix provides a ForEach query to iterate the source sequence, which is similar to List<T>.ForEach method.

### Iteration

ForEach represents the foreach loop, with a non-indexed overload and an indexed overload, which can be fluently used at the end of LINQ query. This is probably the handiest query in LINQ programming, because it executes the LINQ query and process the query results:

public static void ForEach<TSource\>(

```csharp
this IEnumerable<TSource> source, Action<TSource> onNext)
```
```csharp
{
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
onNext(value);
```
```csharp
}
```
```csharp
}
```

```csharp
public static void ForEach<TSource>(
```
```csharp
this IEnumerable<TSource> source, Action<TSource, int>onNext)
```
```csharp
{
```
```csharp
int index = 0;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
onNext(value, index);
```
```csharp
index = checked(index + 1);
```
```csharp
}
```

}

There was an issue with the indexed ForEach – the index increment was not checked. The issue was uncovered when writing this book and has been fixed.

## Summary

This chapter discusses the additional LINQ to Objects queries provided by Microsoft through Ix, including sequence queries for generation, filtering, mapping, concatenation, set, partitioning, conversion, buffering, exception, control flow, iteration, value queries for aggregation, quantifiers, and the handiest ForEach to execute LINQ query.