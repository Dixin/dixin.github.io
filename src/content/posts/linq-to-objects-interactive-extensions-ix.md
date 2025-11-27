---
title: "LINQ to Objects in Depth (6) Advanced Queries in Interactive Extensions (Ix)"
published: 2019-07-06
description: "The previous 2 chapters discussed the LINQ to Objects standard queries. Besides these built-in queries provided by System.Linq.Enumerable type in .NET Standard, Microsoft also provides additional LINQ"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#", "Ix", "Iteractive Extensions"]
category: ".NET"
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
```
Func<IEnumerable<TResult>> enumerableFactory)
```
```
{
```
```
foreach (TResult value in enumerableFactory())
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```

}

And it defers the execution of the factory function:

internal static void Defer(IEnumerable<string> source)
```
{
```
```
IEnumerable<string> Distinct()
```
```
{
```
```
"Instantiate hash set.".WriteLine();
```
```
HashSet<string> hashSet = new HashSet<string>();
```
```
return source.Where(hashSet.Add); // Deferred execution.
```
```
}
```
```
IEnumerable<string> distinct1 = Distinct() // Hash set is instantiated.
```
```
.Where(@string => @string.Length > 10);
```
```
IEnumerable<string> distinct2 = EnumerableEx.Defer(Distinct) // Hash set is not instantiated.
```
```
.Where(@string => @string.Length > 10);
```

}

Similarly, Create accepts an iterator factory function, and delays its execution:

public static IEnumerable<TResult\> Create<TResult\>(
```
Func<IEnumerator<TResult>> getEnumerator)
```
```
{
```
```
using (IEnumerator<TResult> iterator = getEnumerator())
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
yield return iterator.Current; // Deferred execution.
```
```
}
```
```
}
```

}

The other overload of Create is not so intuitive:

public static IEnumerable<T\> Create<T\>(Action<IYielder<T\>> create);

It accepts a callback function of type System.Linq.IYielder<T> –> void. IYielder<T> has 2 methods, Return and Break, representing the 2 forms of yield statement.

public interface IYielder<in T\>
```
{
```
```
IAwaitable Return(T value);
```
```
IAwaitable Break();
```

}

In C#, lambda expression does not support yield statements, compiling the following code causes error CS1621: The yield statement cannot be used inside an anonymous method or lambda expression.

// Cannot be compiled.
```
internal static void Create()
```
```
{
```
```
Func<IEnumerable<int>> sequenceFactory = () =>
```
```
{
```
```
yield return 0;
```
```
yield return 1;
```
```
yield break;
```
```
yield return 2;
```
```
};
```
```
IEnumerable<int> sequence = sequenceFactory();
```
```
sequence.WriteLines(); // 0 1
```

}

Here Create provides a way to virtually use the yield statements in lambda expression:

internal static void Create()
```
{
```
```
Action<IYielder<int>> sequenceFactory = async yield =>
```
```
{
```
```
await yield.Return(0); // yield return 0;
```
```
await yield.Return(1); // yield return 1;
```
```
await yield.Break(); // yield break;
```
```
await yield.Return(2); // yield return 2;
```
```
};
```
```
IEnumerable<int>sequence = EnumerableEx.Create(sequenceFactory);
```
```
sequence.WriteLines(); // 0 1
```

}

IYielder<T> is a good invention before C# 7.0 introduces local function, but at runtime, it can have unexpected iterator behaviour when used with more complex control flow, like try-catch statement. Please avoid using this query. In the above examples, define local function to use yield return statement:

internal static void Create()
```
{
```
```
IEnumerable<int>SequenceFactory()
```
```
{
```
```
yield return 0; // Deferred execution.
```
```
yield return 1;
```
```
yield break;
```
```
yield return 2;
```
```
}
```
```
IEnumerable<int>sequence = SequenceFactory();
```
```
sequence.WriteLines(); // 0 1
```

}

Return just wraps value in a singleton sequence:

public static IEnumerable<TResult\> Return<TResult\>(TResult value)
```
{
```
```
yield return value; // Deferred execution.
```

}

It is called Return, because “return” is a term used in functional languages like Haskell, which means to wrap something in a monad (Monad is discussed in detail in the Category Theory chapters). However, in C# “return” means the current function member gives control to its caller with an optional output. It could be more consistent with .NET naming convention if this function is named as FromValue, similar to Task.FromResult, Task.FromException, DateTime.FromBinary, DateTimeOffset.FromFileTime, TimeSpan.FromSeconds, RegistryKey.FromHandle, etc.

Repeat generates an infinite sequence by repeating a value forever:

public static IEnumerable<TResult\> Repeat<TResult\>(TResult value)
```
{
```
```
while (true)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```

}

Another overload repeats values in the specified sequence. Its implementation is equivalent to:

public static IEnumerable<TSource\> Repeat<TSource\>(this IEnumerable<TSource\> source, int? count = null)
```
{
```
```
if (count == null)
```
```
{
```
```
while (true)
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```
```
}
```
```
for (int i = 0; i< count; i++)
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```

}

When count is not provided, it repeats the values of the source sequence forever.

### Filtering

IgnoreElements filters out all values from the source sequence:

public static IEnumerable<TSource\> IgnoreElements<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
foreach (TSource value in source) { } // Eager evaluation.
```
```
yield break; // Deferred execution.
```

}

DistinctUntilChanged removes the continuous duplication:

public static IEnumerable<TSource\> DistinctUntilChanged<TSource\>(this IEnumerable<TSource\> source);
```
public static IEnumerable<TSource> DistinctUntilChanged<TSource>(
```
```
this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer);
```
```
public static IEnumerable<TSource> DistinctUntilChanged<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IEnumerable<TSource> DistinctUntilChanged<TSource, TKey>(
```

this IEnumerable<TSource\> source, Func<TSource, TKey\>keySelector, IEqualityComparer<TKey\> comparer);

For example:

internal static void DistinctUntilChanged()
```
{
```
```
IEnumerable<int>source = new int[]
```
```
{
```
```
0, 0, 0, /* Change. */ 1, 1, /* Change. */ 0, 0, /* Change. */ 2, /* Change. */ 1, 1
```
```
};
```
```
source.DistinctUntilChanged().WriteLines(); // 0 1 0 2 1
```

}

### Mapping

A SelectMany overload is provided to map source sequence’s each value to the other sequence:

public static IEnumerable<TOther\> SelectMany<TSource, TOther\>(
```
this IEnumerable<TSource> source, IEnumerable<TOther> other) =>
```

source.SelectMany(value => other);

Scan accepts the same parameters as Aggregate. The difference is, Aggregate outputs one final accumulation step’s result, Scan returns a sequence of all accumulation steps’ results. Its implementation is equivalent to:

public static IEnumerable<TSource\> Scan<TSource\>(
```
this IEnumerable<TSource> source, Func<TSource, TSource, TSource> func)
```
```
{
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```
{
```
```
if (!iterator.MoveNext())
```
```
{
```
```
yield break; // Deferred execution.
```
```
}
```
```
TSource accumulate = iterator.Current;
```
```
while (iterator.MoveNext())
```
```
{
```
```
yield return accumulate = func(accumulate, iterator.Current); // Deferred execution.
```
```
}
```
```
}
```
```
}
```
```
public static IEnumerable<TAccumulate> Scan<TSource, TAccumulate>(
```
```
this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func) =>
```

source.Select(value => seed = func(seed, value));

For example:

internal static void Scan()
```
{
```
```
int finalProduct = Int32Source().Aggregate((product, int32) => product * int32).WriteLine();
```
```
// ((((-1 * 1) * 2) * 3) * -4) => 24.
```
```
IEnumerable<int> allProducts = Int32Source().Scan((product, int32) => product * int32).WriteLines();
```
```
// ((((-1 * 1) * 2) * 3) * -4) => { -1, -2, -6, 24 }.
```

}

Expand maps source values with the selector, then maps the result values with the selector, and keeps going on.

public static IEnumerable<TSource\> Expand<TSource\>(this IEnumerable<TSource\> source, Func<TSource, IEnumerable<TSource\>> selector);

In the following example, selector maps each value to a singleton sequence:

internal static void ExpandSingle()
```
{
```
```
Enumerable
```
```
.Range(0, 5)
```
```
.Expand(int32 => EnumerableEx.Return(int32 * int32))
```
```
.Take(25)
```
```
.WriteLines();
```
```
// 0 1 2 3 4, map each int32 to { int32 * int32 } =>
```
```
// 0 1 4 9 16, map each int32 to { int32 * int32 }: =>
```
```
// 0 1 16 81 256, map each int32 to { int32 * int32 } =>
```
```
// 0 1 256 6561 65536, map each int32 to { int32 * int32 } =>
```
```
// 0 1 65536 43046721 4294967296, ...
```

}

The mapping can go on forever and results an infinite sequence. If selector maps each value to a sequence with more than one values, then the result sequences grows rapidly:

internal static void ExpandMuliple()
```
{
```
```
Enumerable
```
```
.Range(0, 5)
```
```
.Expand(int32 => Enumerable.Repeat(int32, 2))
```
```
.Take(75)
```
```
.WriteLines();
```
```
// 0 1 2 3 4 => map each int32 to { int32, int32 }:
```
```
// 0 0 1 1 2 2 3 3 4 4 => map each int32 to { int32, int32 }:
```
```
// 0 0 0 0 1 1 1 1 2 2 2 2 3 3 3 3 4 4 4 4 => map each int32 to { int32, int32 }:
```
```
// 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 1 2 2 2 2 2 2 2 2 3 3 3 3 3 3 3 3 4 4 4 4 4 4 4 4 => ...
```

}

If selector maps each value to empty sequence, the expanding ends after all source values are iterated:

internal static void ExpandNone()
```
{
```
```
Enumerable
```
```
.Range(0, 5)
```
```
.Expand(int32 => Enumerable.Empty<int>())
```
```
.Take(100)
```
```
.WriteLines();
```
```
// 0 1 2 3 4 => map each int32 to { }.
```

}

### Concatenation

2 more overloads of Concat is provided to concatenate any number of sequences:

public static IEnumerable<TSource\> Concat<TSource\>(
```
this IEnumerable<IEnumerable<TSource>> sources) =>
```
```
sources.SelectMany(source => source);
```
```
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
```
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IEqualityComparer<TKey> comparer = null)
```
```
{
```
```
HashSet<TKey>hashSet = new HashSet<TKey>(comparer);
```
```
foreach (TSource value in source)
```
```
{
```
```
if (hashSet.Add(keySelector(value)))
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```

}

### Partitioning

Skip/Take skips/takes the specified number of values at the beginning of the source sequence. In contrast, SkipLast/TakeLast skips/takes the specified number of values at the end of the source sequence:

public static IEnumerable<TSource\> SkipLast<TSource\>(this IEnumerable<TSource\> source, int count);

public static IEnumerable<TSource\> TakeLast<TSource\>(this IEnumerable<TSource\> source, int count);

For example:

internal static void SkipLastTakeLast()
```
{
```
```
int[] skipFirst2 = Enumerable.Range(0, 5).Skip(2).ToArray(); // 2 3 4.
```
```
int[] skipLast2 = Enumerable.Range(0, 5).SkipLast(2).ToArray(); // 0 1 2.
```
```
int[] takeFirst2 = Enumerable.Range(0, 5).Take(2).ToArray(); // 0 1.
```
```
int[] takeLast2 = Enumerable.Range(0, 5).TakeLast(2).ToArray(); // 3 4.
```

}

The implementation of SkipLast/TakeLast is very interesting. As already discussed, Take implements lazy evaluation. However, TakeLast has to pull all values to know which are the tail values of the source sequence. So TakeLast implements eager evaluation, and uses a queue to store the tail values:

public static IEnumerable<TSource\> TakeLast<TSource\>(this IEnumerable<TSource\> source, int count)
```
{
```
```
if (count < 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(count));
```
```
}
```
```
IEnumerable<TSource> TakeLastGGenerator()
```
```
{
```
```
if (count <= 0)
```
```
{
```
```
yield break; // Deferred execution.
```
```
}
```
```
Queue<TSource>lastValues = new Queue<TSource>(count);
```
```
foreach (TSource value in source)
```
```
{
```
```
if (lastValues.Count >= count)
```
```
{
```
```
lastValues.Dequeue();
```
```
}
```
```
lastValues.Enqueue(value);
```
```
} // Eager evaluation.
```
```
while (lastValues.Count> 0)
```
```
{
```
```
yield return lastValues.Dequeue(); // Deferred execution.
```
```
}
```
```
}
```
```
return TakeLastGGenerator();
```

}

SkipLast also uses a queue to store the tail values:

public static IEnumerable<TSource\> SkipLast<TSource\>(this IEnumerable<TSource\> source, int count)
```
{
```
```
if (count < 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(count));
```
```
}
```
```
IEnumerable<TSource> SkipLastGenerator()
```
```
{
```
```
Queue<TSource>lastValues = new Queue<TSource>();
```
```
foreach (TSource value in source)
```
```
{
```
```
lastValues.Enqueue(value);
```
```
if (lastValues.Count > count) // Can be lazy, eager, or between.
```
```
{
```
```
yield return lastValues.Dequeue(); // Deferred execution.
```
```
}
```
```
}
```
```
}
```
```
return SkipLastGenerator();
```

}

It uses count as the max length of the queue. When SkipLast starts to execute, it evaluates values to fill the queue. When the queue is full, each new value is enqueued, and the head value of the queue is dequeued and yielded. So, at the end of query execution, the values still stored in the queue are exactly the last values to skip. If count is equal to or greater than the source sequence’s value count, when executing query, all values are pulled from the source sequence and stored in the queue, and nothing is yielded to the caller, which is fully eager evaluation similar to IgnoreElements. If count is less than the source’s value count, when executing query, some values are pulled from the source sequence to fill the queue, then values are yielded, which can be viewed as partially eager evaluation. When count is 0, it does not skip anything, just simply yield each source value, which is like lazy evaluation. So SkipLast’s eagerness/laziness depends on the count of values to skip.

### Conversion

Hide has the same signature as AsEnumerable. As previously demonstrated, AsEnumerable simply outputs the source sequence itself to caller. Hide returns a new generator to hide the source sequence from the caller:

public static IEnumerable<TSource\> Hide<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```

}

The difference is, the output sequence of AsEnumerable can be converted back to the original type, which the output sequence of Hide cannot, since it is a newly constructed generator:

internal static void Hide()
```
{
```
```
List<int>source = new List<int>() { 1, 2 };
```
```
IEnumerable<int>readWrite = source.AsEnumerable();
```
```
object.ReferenceEquals(source, readWrite).WriteLine(); // True
```
```
((List<int>)readWrite).Reverse(); // List<T>.Reverse.
```
```
((List<int>)readWrite).Add(3); // List<T>.Add.
```
```
IEnumerable<int> readOnly = source.Hide();
```
```
object.ReferenceEquals(source, readOnly).WriteLine(); // False
```

}

### Buffering

Buffer segments the source sequence into smaller lists:

public static IEnumerable<IList<TSource\>> Buffer<TSource\>(this IEnumerable<TSource\> source, int count, int skip);

Here count is the length of each smaller list, and skip is the offset to start the next list. For example:

internal static void Buffer()
```
{
```
```
IEnumerable<IList<int>> buffers1 = Enumerable.Range(0, 5).Buffer(2, 1);
```
```
// {
```
```
// { 0, 1 }, { 1, 2 }, { 2, 3 }, { 3, 4 }, { 4 }
```
```
// }
```
```
IEnumerable<IList<int>> buffers2 = Enumerable.Range(0, 5).Buffer(2, 2); // Equivalent to Buffer(2).
```
```
// {
```
```
// { 0, 1 }, { 2, 3 }, { 4 }
```
```
// }
```
```
IEnumerable<IList<int>> buffers3 = Enumerable.Range(0, 5).Buffer(2, 3);
```
```
// {
```
```
// { 0, 1 }, { 3, 4 }
```
```
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
```
{
```
```typescript
public interface IBuffer<out T> : IEnumerable<T>, IEnumerable, IDisposable { }
```

}

By default, an IEnumerable<T> sequence’s multiple iterators are independent from each other. When these iterators are called, callers pull independent values from each iterator. In contrast, multiple shared iterators work as if they are the same single iterator:

internal static void Share()
```
{
```
```
IEnumerable<int>sequence = Enumerable.Range(0, 5);
```
```
IEnumerator<int>independentIteratorA = sequence.GetEnumerator();
```
```
IEnumerator<int>independentIteratorB = sequence.GetEnumerator(); // A|B|C
```
```
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 0| |
```
```
independentIteratorB.MoveNext(); independentIteratorB.Current.WriteLine(); // |0|
```
```
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 1| |
```
```
IEnumerator<int> independentIteratorC = sequence.GetEnumerator(); // | |
```
```
independentIteratorC.MoveNext(); independentIteratorC.Current.WriteLine(); // | |0
```
```
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 2| |
```
```
independentIteratorB.MoveNext(); independentIteratorB.Current.WriteLine(); // |1|
```
```
independentIteratorA.MoveNext(); independentIteratorA.Current.WriteLine(); // 3| |
```
```
// ...
```
```
IBuffer<int> share = Enumerable.Range(0, 5).Share();
```
```
IEnumerator<int>sharedIterator1 = share.GetEnumerator();
```
```
IEnumerator<int>sharedIterator2 = share.GetEnumerator(); // A|B|C
```
```
sharedIterator1.MoveNext(); sharedIterator1.Current.WriteLine(); // 0| |
```
```
sharedIterator2.MoveNext(); sharedIterator2.Current.WriteLine(); // |1|
```
```
sharedIterator1.MoveNext(); sharedIterator1.Current.WriteLine(); // 2| |
```
```
IEnumerator<int> sharedIterator3 = share.GetEnumerator(); // | |
```
```
sharedIterator3.MoveNext(); sharedIterator3.Current.WriteLine(); // | |3
```
```
share.Dispose();
```
```
sharedIterator1.MoveNext(); // ObjectDisposedException.
```
```
sharedIterator2.MoveNext(); // ObjectDisposedException.
```
```
sharedIterator3.MoveNext(); // ObjectDisposedException.
```

}

When pulling values with multiple independent iterators, each value can be pulled multiple times. When pulling values with multiple shared iterators, each value can only be pulled once. And IBuffer<T>.Dispose terminates the sharing. After calling Dispose, all shared iterators’ MoveNext throws ObjectDisposedException.

The other overload accepts a selector function:

public static IEnumerable<TResult\> Share<TSource, TResult\>(
```
this IEnumerable<TSource> source,
```
```
Func<IEnumerable<TSource>, IEnumerable<TResult>> selector) =>
```

Create(() => selector(source.Share()).GetEnumerator());

For example:

internal static void ConcatShared()
```
{
```
```
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```
source1.Concat(source1).WriteLines(); // 0 1 2 3 4 0 1 2 3 4
```
```
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```
{
```
```
source2.Concat(source2).WriteLines(); // 0 1 2 3 4
```
```
}
```
```
// Equivalent to:
```
```
IEnumerable<int> source3 = Enumerable.Range(0, 5);
```
```
source3.Share(source => source.Concat(source)).WriteLines(); // 0 1 2 3 4
```

}

The above 2 kinds of Share usage are equivalent. As already discussed, Concat can be desugared as:

public static IEnumerable<TSource\> Concat<TSource\>(
```
IEnumerable<TSource>first, IEnumerable<TSource> second)
```
```
{
```
```
using (IEnumerator<TSource> iterator1 = first.GetEnumerator())
```
```
{
```
```
while (iterator1.MoveNext())
```
```
{
```
```
yield return iterator1.Current;
```
```
}
```
```
}
```
```
using (IEnumerator<TSource> iterator2 = second.GetEnumerator())
```
```
{
```
```
while (iterator2.MoveNext())
```
```
{
```
```
yield return iterator2.Current;
```
```
}
```
```
}
```

}

So that the above 3 Concat calls can be virtually viewed as:

internal static void DesugaredConcatShared()
```
{
```
```
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```
IEnumerable<int>Concat1() // source1.Concat(source1)
```
```
{
```
```
using (IEnumerator<int> independentIterator1 = source1.GetEnumerator())
```
```
{
```
```
while (independentIterator1.MoveNext())
```
```
{
```
```
yield return independentIterator1.Current; // Yield 0 1 2 3 4.
```
```
}
```
```
}
```
```
using (IEnumerator<int> independentIterator2 = source1.GetEnumerator())
```
```
{
```
```
while (independentIterator2.MoveNext())
```
```
{
```
```
yield return independentIterator2.Current; // Yield 0 1 2 3 4.
```
```
}
```
```
}
```
```
}
```
```
Concat1().WriteLines();
```
```
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```
{
```
```
IEnumerable<int>Concat2() // source2.Concat(source2)
```
```
{
```
```
using (IEnumerator<int> sharedIterator1 = source2.GetEnumerator())
```
```
{
```
```
while (sharedIterator1.MoveNext())
```
```
{
```
```
yield return sharedIterator1.Current; // Yield 0 1 2 3 4.
```
```
}
```
```
}
```
```
using (IEnumerator<int> sharedIterator2 = source2.GetEnumerator())
```
```
{
```
```
while (sharedIterator2.MoveNext())
```
```
{
```
```
yield return sharedIterator2.Current; // Yield nothing.
```
```
}
```
```
}
```
```
}
```
```
Concat2().WriteLines();
```
```
}
```
```
IEnumerable<int>source3 = Enumerable.Range(0, 5);
```
```
IEnumerable<int>Concat3() // source3.Share(source => source.Concat(source))
```
```
{
```
```
using (IBuffer<int> source = source3.Share())
```
```
{
```
```
using (IEnumerator<int> sharedIterator1 = source.GetEnumerator())
```
```
{
```
```
while (sharedIterator1.MoveNext())
```
```
{
```
```
yield return sharedIterator1.Current; // Yield 0 1 2 3 4.
```
```
}
```
```
}
```
```
using (IEnumerator<int> sharedIterator2 = source.GetEnumerator())
```
```
{
```
```
while (sharedIterator2.MoveNext())
```
```
{
```
```
yield return sharedIterator2.Current; // Yield nothing.
```
```
}
```
```
}
```
```
}
```
```
}
```
```
Concat3().WriteLines();
```

}

When Concat is executed, if values are pulled from 2 independent iterators, both iterators yield all source values; if values are pulled from 2 shared iterators. only the first iterator yields all source values, and the second iterator yields nothing. Another example is Zip:

internal static void ZipShared()
```
{
```
```
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```
source1.Zip(source1, ValueTuple.Create).WriteLines(); // (0, 0) (1, 1) (2, 2) (3, 3) (4, 4)
```
```
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```
{
```
```
source2.Zip(source2, ValueTuple.Create).WriteLines(); // (0, 1) (2, 3)
```
```
}
```
```
// Equivalent to:
```
```
IEnumerable<int> source3 = Enumerable.Range(0, 5);
```
```
source3.Share(source => source.Zip(source, ValueTuple.Create)).WriteLines(); // (0, 1) (2, 3).
```

}

Similarly, the above 3 Zip calls can be virtually viewed as:

internal static void DesugaredZipShared()
```
{
```
```
IEnumerable<int>source1 = Enumerable.Range(0, 5);
```
```
IEnumerable<(int, int)> Zip1()
```
```
{
```
```
using (IEnumerator<int> independentIterator1 = source1.GetEnumerator())
```
```
using (IEnumerator<int> independentIterator2 = source1.GetEnumerator())
```
```
{
```
```
while (independentIterator1.MoveNext() && independentIterator2.MoveNext())
```
```
{
```
```
yield return (independentIterator1.Current, independentIterator2.Current);
```
```
// Yield (0, 0) (1, 1) (2, 2) (3, 3) (4, 4).
```
```
}
```
```
}
```
```
}
```
```
Zip1().WriteLines();
```
```
using (IBuffer<int> source2 = Enumerable.Range(0, 5).Share())
```
```
{
```
```
IEnumerable<(int, int)> Zip2()
```
```
{
```
```
using (IEnumerator<int> sharedIterator1 = source2.GetEnumerator())
```
```
using (IEnumerator<int> sharedIterator2 = source2.GetEnumerator())
```
```
{
```
```
while (sharedIterator1.MoveNext() && sharedIterator2.MoveNext())
```
```
{
```
```
yield return (sharedIterator1.Current, sharedIterator2.Current);
```
```
// Yield (0, 1) (2, 3).
```
```
}
```
```
}
```
```
}
```
```
Zip2().WriteLines();
```
```
}
```
```
IEnumerable<int>source3 = Enumerable.Range(0, 5);
```
```
IEnumerable<(int, int)> Zip3()
```
```
{
```
```
using (IBuffer<int> source = source3.Share())
```
```
using (IEnumerator<int> sharedIterator1 = source.GetEnumerator())
```
```
using (IEnumerator<int> sharedIterator2 = source.GetEnumerator())
```
```
{
```
```
while (sharedIterator1.MoveNext() && sharedIterator2.MoveNext())
```
```
{
```
```
yield return (sharedIterator1.Current, sharedIterator2.Current);
```
```
// yields (0, 1) (2, 3).
```
```
}
```
```
}
```
```
}
```
```
Zip3().WriteLines();
```

}

Publish has the same signatures as Share:

public static IBuffer<TSource\> Publish<TSource\>(this IEnumerable<TSource\> source);
```
public static IEnumerable<TResult> Publish<TSource, TResult>(
```

this IEnumerable<TSource\> source, Func<IEnumerable<TSource\>, IEnumerable<TResult\>>selector);

It also buffers the values in a different way, so each iterator yields all remainder values:

internal static void Publish()
```
{
```
```
using (IBuffer<int> publish = Enumerable.Range(0, 5).Publish())
```
```
{
```
```
IEnumerator<int>remainderIteratorA = publish.GetEnumerator();
```
```
// remainderIteratorA: 0 1 2 3 4. A|B|C
```
```
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 0| |
```
```
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 1| |
```
```
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 2| |
```
```
IEnumerator<int> remainderIteratorB = publish.GetEnumerator(); // | |
```
```
// remainderIteratorB: 3 4. | |
```
```
remainderIteratorB.MoveNext(); remainderIteratorB.Current.WriteLine(); // |3|
```
```
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 3| |
```
```
IEnumerator<int> remainderIteratorC = publish.GetEnumerator(); // | |
```
```
// remainderIteratorC: 4. | |
```
```
remainderIteratorB.MoveNext(); remainderIteratorB.Current.WriteLine(); // |4|
```
```
remainderIteratorA.MoveNext(); remainderIteratorA.Current.WriteLine(); // 4| |
```
```
remainderIteratorC.MoveNext(); remainderIteratorC.Current.WriteLine(); // | |4
```
```
}
```

}

Memoize (not Memorize) simply buffers all values:

public static IBuffer<TSource\> Memoize<TSource\>(this IEnumerable<TSource\> source);
```
public static IEnumerable<TResult> Memoize<TSource, TResult>(
```

this IEnumerable<TSource\> source, Func<IEnumerable<TSource\>, IEnumerable<TResult\>>selector);

The term memoize/memoization means buffering the function call result, so that when the same call happens again, the buffered result can be returned. Its multiple iterators work like independent, but each value is only pulled once and is buffered for reuse:

internal static void Memoize()
```
{
```
```
using (IBuffer<int> memoize = Enumerable.Range(0, 5).Memoize())
```
```
{
```
```
IEnumerator<int>bufferIteratorA = memoize.GetEnumerator();
```
```
// bufferIteratorA: 0 1 2 3 4. A|B|C
```
```
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 0| |
```
```
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 1| |
```
```
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 2| |
```
```
IEnumerator<int> bufferIteratorB = memoize.GetEnumerator(); // | |
```
```
// bufferIteratorB: 0 1 2 3 4. | |
```
```
bufferIteratorB.MoveNext(); bufferIteratorB.Current.WriteLine(); // |0|
```
```
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 3| |
```
```
IEnumerator<int> bufferIteratorC = memoize.GetEnumerator(); // | |
```
```
// bufferIteratorC: 0 1 2 3 4. | |
```
```
bufferIteratorB.MoveNext(); bufferIteratorB.Current.WriteLine(); // |1|
```
```
bufferIteratorA.MoveNext(); bufferIteratorA.Current.WriteLine(); // 4| |
```
```
bufferIteratorC.MoveNext(); bufferIteratorC.Current.WriteLine(); // | |0
```
```
bufferIteratorC.MoveNext(); bufferIteratorC.Current.WriteLine(); // | |1
```
```
bufferIteratorB.MoveNext(); bufferIteratorB.Current.WriteLine(); // |2|
```
```
// ...
```
```
}
```

}

There 2 more overloads accept a readerCount to specify how many times can the buffered values be reused:

public static IBuffer<TSource\> Memoize<TSource\>(
```
this IEnumerable<TSource> source, int readerCount);
```
```
public static IEnumerable<TResult> Memoize<TSource, TResult>(
```

this IEnumerable<TSource\> source, int readerCount, Func<IEnumerable<TSource\>, IEnumerable<TResult\>> selector);

When exceeding the readerCount, an InvalidOperationException is thrown:

internal static void MemoizeWithReaderCount()
```
{
```
```
using (IBuffer<int> source1 = Enumerable.Range(0, 5).Memoize(2))
```
```
{
```
```
int[] reader1 = source1.ToArray(); // First full iteration.
```
```
int[] reader2 = source1.ToArray(); // Second full iteration.
```
```
int[] reader3 = source1.ToArray(); // Third full iteration: InvalidOperationException.
```
```
}
```
```
IEnumerable<int>source2 = Enumerable.Range(0, 5);
```
```
source2
```
```
.Memoize(
```
```
readerCount: 2,
```
```
selector: source => source // First full iteration.
```
```
.Concat(source) // Second full iteration.
```
```
.Concat(source)) // Third full iteration: InvalidOperationException.
```
```
.WriteLines();
```

}

### Exception handling

The exception queries address some exception related scenarios for IEnumerable<T>. Throw query just throws the specified exception when executed:

public static IEnumerable<TResult\> Throw<TResult\>(Exception exception)
```
{
```
```
throw exception;
```
```
yield break; // Deferred execution.
```

}

The yield break statement at the end is required for deferred execution. Without the yield break statement, the specified exception is thrown immediately when Throw is called. With the yield break statement, a generator is returned when Throw is called, and the specified exception is thrown when trying to pull value from the returned generator for the first time. For example:

internal static void Throw()
```
{
```
```
IEnumerable<int>@throw = EnumerableEx.Throw<int>(new OperationCanceledException());
```
```
IEnumerable<int>query = Enumerable.Range(0, 5).Concat(@throw); // Define query.
```
```
try
```
```
{
```
```
foreach (int value in query) // Execute query.
```
```
{
```
```
value.WriteLine();
```
```
}
```
```
}
```
```
catch (OperationCanceledException exception)
```
```
{
```
```
exception.WriteLine();
```
```
}
```
```
// 0 1 2 3 4 System.OperationCanceledException: The operation was canceled.
```

}

Catch accepts a source sequence and an exception handler function. When the query is executed, it pulls and yields each value from source sequence. If there is no exception of the specified type thrown during the evaluation, the handler is not called. If any exception of the specified type is thrown, it calls the exception handler with the exception. The handler returns a sequence, whose values are then pulled and yielded. So, Catch’s concept can be virtually viewed as:

// Cannot be compiled.
```
public static IEnumerable<TSource> CatchWithYield<TSource, TException>(
```
```
this IEnumerable<TSource> source, Func<TException, IEnumerable<TSource>> handler)
```
```
where TException : Exception
```
```
{
```
```
try
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```
```
catch (TException exception)
```
```
{
```
```
foreach (TSource value in handler(exception) ?? Empty<TSource>())
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```

}

However, C# does not support yield statement inside try-catch statement. The above code cannot be compiled. The solution is to desugar the foreach statement to a while loop for iterator. Then the try-catch statement can go inside the loop, and only contains iterator’s MoveNext and Current calls, and the yield statement can go outside the try-catch statement.

public static IEnumerable<TSource\> Catch<TSource, TException\>(
```
this IEnumerable<TSource> source, Func<TException, IEnumerable<TSource>> handler)
```
```
where TException : Exception
```
```
{
```
```
TException firstException = null;
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```
{
```
```
while (true)
```
```
{
```
```
TSource value;
```
```
try // Only MoveNext and Current are inside try-catch.
```
```
{
```
```
if (iterator.MoveNext())
```
```
{
```
```
value = iterator.Current;
```
```
}
```
```
else
```
```
{
```
```
break; // Stops while loop at the end of iteration.
```
```
}
```
```
}
```
```
catch (TException exception)
```
```
{
```
```
firstException = exception;
```
```
break; // Stops while loop if TException is thrown.
```
```
}
```
```
yield return value; // Deferred execution, outside try-catch.
```
```
}
```
```
}
```
```
if (firstException != null)
```
```
{
```
```
foreach (TSource value in handler(firstException) ?? Empty<TSource>())
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```

}

And here is a simple example:

internal static void CatchWithHandler()
```
{
```
```
IEnumerable<string> @throw = EnumerableEx.Throw<string>(
```
```
new OperationCanceledException());
```
```
IEnumerable<string>@catch = @throw.Catch<string, OperationCanceledException>(
```
```
exception => EnumerableEx.Return($"Handled {exception.GetType().Name}: {exception.Message}"));
```
```
@catch.WriteLines(); // Handled OperationCanceledException: The operation was canceled.
```

}

The other Catch overloads accepts multiple sequences, and outputs a single sequence. The idea is, when executed, it tries to pull and yield values of the first source sequence. if there is no exception, it stops execution; If any exception is thrown, it tries to pull and yield the values of the second source sequence, and so on; When stopping the evaluation, if there is any exception from the evaluation of the last sequence. If yes, it re-throws that exception. The concept is:

// Cannot be compiled.
```
public static IEnumerable<TSource> CatchWithYield<TSource>(
```
```
this IEnumerable<IEnumerable<TSource>> sources)
```
```
{
```
```
Exception lastException = null;
```
```
foreach (IEnumerable<TSource> source in sources)
```
```
{
```
```
lastException = null;
```
```
try
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
break; // Stops if no exception from current sequence.
```
```
}
```
```
catch (Exception exception)
```
```
{
```
```
lastException = exception;
```
```
// Continue with next sequence if there is exception.
```
```
}
```
```
}
```
```
if (lastException != null)
```
```
{
```
```
throw lastException;
```
```
}
```

}

Again, the above code cannot be compiled because yield statement cannot be used with try-catch statement. So previous desugared while-try-catch-yield pattern can be used:

public static IEnumerable<TSource\> Catch<TSource\>(
```
this IEnumerable<IEnumerable<TSource>> sources)
```
```
{
```
```
Exception lastException = null;
```
```
foreach (IEnumerable<TSource> source in sources)
```
```
{
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```
{
```
```
while (true)
```
```
{
```
```
lastException = null;
```
```
TSource value;
```
```
try // Only MoveNext and Current are inside try-catch.
```
```
{
```
```
if (iterator.MoveNext())
```
```
{
```
```
value = iterator.Current;
```
```
}
```
```
else
```
```
{
```
```
break; // Stops while loop at the end of iteration.
```
```
}
```
```
}
```
```
catch (Exception exception)
```
```
{
```
```
lastException = exception;
```
```
break; // Stops while loop if TException is thrown.
```
```
}
```
```
yield return value; // Deferred execution, outside try-catch.
```
```
}
```
```
}
```
```
if (lastException == null)
```
```
{
```
```
break; // If no exception, stops pulling the next source; otherwise, continue.
```
```
}
```
```
}
```
```
if (lastException != null)
```
```
{
```
```
throw lastException;
```
```
}
```
```
}
```
```
public static IEnumerable<TSource> Catch<TSource>(
```
```
params IEnumerable<TSource>[] sources) => sources.Catch();
```
```
public static IEnumerable<TSource> Catch<TSource>(
```
```
this IEnumerable<TSource> first, IEnumerable<TSource> second) =>
```

new IEnumerable<TSource\>\[\] { first, second }.Catch();

For example:

internal static void Catch()
```
{
```
```
IEnumerable<int>scanWithException = Enumerable.Repeat(0, 5).Scan((a, b) => a / b); // Divide by 0.
```
```
IEnumerable<int> range = Enumerable.Range(0, 5);
```
```
IEnumerable<int>castWithException = new object[] { 5, "a" }.Cast<int>();
```
```
IEnumerable<IEnumerable<int>> source1 = new IEnumerable<int>[]
```
```
{
```
```
scanWithException, // Executed, with DivideByZeroException.
```
```
range, // Executed, without exception.
```
```
castWithException // Not executed.
```
```
};
```
```
source1.Catch().WriteLines(); // 0 1 2 3 4
```
```
IEnumerable<IEnumerable<int>> source2 = new IEnumerable<int>[]
```
```
{
```
```
scanWithException, // Executed, with DivideByZeroException.
```
```
castWithException // Executed, with InvalidCastException.
```
```
};
```
```
try
```
```
{
```
```
source2.Catch().WriteLines(); // 5
```
```
}
```
```
catch (InvalidCastException exception)
```
```
{
```
```
exception.WriteLine(); // System.InvalidCastException: Specified cast is not valid.
```
```
}
```

}

Besides Throw and Catch, there is also Finally query. Finally is very intuitive:

public static IEnumerable<TSource\> Finally<TSource\>(this IEnumerable<TSource\> source, Action finalAction)
```
{
```
```
try
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```
```
finally
```
```
{
```
```
finalAction();
```
```
}
```

}

The above code can be compiled because yield statement is allowed in the try block of try-finally statement.

OnErrorResumeNext is similar to Concat, but it ignores any exception when evaluating values from each sequence. The idea is:

// Cannot be compiled.
```
internal static IEnumerable<TSource> OnErrorResumeNextWithYield<TSource>(
```
```
this IEnumerable<IEnumerable<TSource>> sources)
```
```
{
```
```
foreach (IEnumerable<TSource> source in sources)
```
```
{
```
```
try
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```
```
catch { }
```
```
}
```

}

Once again, this can be implemented with the desugared while-try-catch-yield pattern:

public static IEnumerable<TSource\> OnErrorResumeNext<TSource\>(
```
this IEnumerable<IEnumerable<TSource>> sources)
```
```
{
```
```
foreach (IEnumerable<TSource> source in sources)
```
```
{
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```
{
```
```
while (true)
```
```
{
```
```
TSource value = default;
```
```
try
```
```
{
```
```
if (!iterator.MoveNext())
```
```
{
```
```
break;
```
```
}
```
```
value = iterator.Current;
```
```
}
```
```
catch
```
```
{
```
```
break;
```
```
}
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```
```
}
```
```
}
```
```
public static IEnumerable<TSource> OnErrorResumeNext<TSource>(
```
```
params IEnumerable<TSource>[] sources) => sources.OnErrorResumeNext();
```
```
public static IEnumerable<TSource> OnErrorResumeNext<TSource>(
```
```
this IEnumerable<TSource> first, IEnumerable<TSource> second) =>
```

new IEnumerable<TSource\>\[\] { first, second }.OnErrorResumeNext();

Retry query tries to yield the source values. If there is an exception thrown, it retries to yield the values again from the beginning of the source sequence. Its implementation is equivalent to:

public static IEnumerable<TSource\> Retry<TSource\>(
```
this IEnumerable<TSource> source, int? retryCount = null) =>
```

Return(source).Repeat(retryCount).Catch();

If retryCount is not provided, it retries forever.

### Control flow

The If/Case/Using/While/DoWhile/Generate/For queries implements the control flows as fluent LINQ query. If represents the if-else statement. Its implementation is equivalent to:

public static IEnumerable<TResult\> If<TResult\>(
```
Func<bool>condition, IEnumerable<TResult> thenSource, IEnumerable<TResult> elseSource = null) =>
```

Defer(() => condition() ? thenSource : elseSource ?? Enumerable.Empty<TResult\>());

Case represents the switch-case statement. It accepts a selector function as the key factory, and a dictionary of key-sequence pairs, where each key represents a case label of the switch statement. When Case query is executed, the selector function is called to get a key. If the dictionary contains that key, then the matching sequence is the query output; otherwise, a default sequence is the query output:

public static IEnumerable<TResult\> Case<TValue, TResult\>(
```
Func<TValue>selector,
```
```
IDictionary<TValue, IEnumerable<TResult>>sources,
```
```
IEnumerable<TResult>defaultSource = null) =>
```
```
Defer(() => sources.TryGetValue(selector(), out IEnumerable<TResult>result)
```
```
? result
```

: (defaultSource ?? Enumerable.Empty<TResult\>()));

Using represents the using statement:

public static IEnumerable<TSource\> Using<TSource, TResource\>(
```
Func<TResource>resourceFactory, Func<TResource, IEnumerable<TSource>> enumerableFactory)
```
```
where TResource : IDisposable
```
```
{
```
```
using (TResource resource = resourceFactory())
```
```
{
```
```
foreach (TSource value in enumerableFactory(resource))
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```

}

While represents the while loop:

public static IEnumerable<TResult\> While<TResult\>(Func<bool\> condition, IEnumerable<TResult\> source)
```
{
```
```
while (condition())
```
```
{
```
```
foreach (TResult value in source)
```
```
{
```
```
yield return value; // Deferred execution.
```
```
}
```
```
}
```

}

DoWhile represents the do-while loop:

public static IEnumerable<TResult\> DoWhile<TResult\>(
```
this IEnumerable<TResult> source, Func<bool> condition) =>
```

source.Concat(While(condition, source));

Generate represents the for loop:

public static IEnumerable<TResult\> Generate<TState, TResult\>(
```
TState initialState,
```
```
Func<TState, bool> condition,
```
```
Func<TState, TState> iterate,
```
```
Func<TState, TResult> resultSelector)
```
```
{
```
```
for (TState state = initialState; condition(state); state = iterate(state))
```
```
{
```
```
yield return resultSelector(state); // Deferred execution.
```
```
}
```

}

For also works the same as SelectMany. Its implementation is equivalent to:

public static IEnumerable<TResult\> For<TSource, TResult\>(
```
IEnumerable<TSource>source, Func<TSource, IEnumerable<TResult>>resultSelector) =>
```

source.SelectMany(resultSelector);

It can be viewed as foreach statement – for each value in the source, call the resultSelector function and yields all results in the function’s output sequence. I am not sure why the 2 above queries are named as Generate and For.

### Iteration

Do does not transform the data in any way. It simply pulls source values just like Hide. It also accepts 3 callback functions, onNext, onError, and onCompleted. When each source value is pulled, onNext is called with the value. When exception is thrown for pulling source value, onError is called with the exception. After all source values are pulled successfully without exception, onCompleted is called. Its idea is:

public static IEnumerable<TSource> Do<TSource>(
```
this IEnumerable<TSource> source,
```
```
Action<TSource> onNext, Action<Exception> onError = null, Action onCompleted = null)
```
```
{
```
```
try
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
onNext(value);
```
```
yield return value;
```
```
}
```
```
}
```
```
catch (Exception exception)
```
```
{
```
```
onError?.Invoke(exception);
```
```
throw;
```
```
}
```
```
onCompleted?.Invoke();
```

}

Once again, the yield statement does not work with try-catch statement. The above idea can be implemented with the desugared while-try-catch-yield pattern:

public static IEnumerable<TSource\> Do<TSource\>(
```
this IEnumerable<TSource> source,
```
```
Action<TSource>onNext, Action<Exception>onError = null, Action onCompleted = null)
```
```
{
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```
{
```
```
while (true)
```
```
{
```
```
TSource value;
```
```
try
```
```
{
```
```
if (!iterator.MoveNext())
```
```
{
```
```
break;
```
```
}
```
```
value = iterator.Current;
```
```
}
```
```
catch (Exception exception)
```
```
{
```
```
onError?.Invoke(exception);
```
```
throw;
```
```
}
```
```
onNext(value);
```
```
yield return value; // Deferred execution, outside try-catch.
```
```
}
```
```
onCompleted?.Invoke();
```
```
}
```

}

Do is very useful for logging and tracing LINQ queries, for example:

internal static void Do()
```
{
```
```
Enumerable
```
```
.Range(-5, 10).Do(
```
```
onNext: value => $"{nameof(Enumerable.Range)} yields {value}.".WriteLine(),
```
```
onCompleted: () => $"{nameof(Enumerable.Range)} completes.".WriteLine())
```
```
.Where(value => value > 0).Do(
```
```
onNext: value => $"{nameof(Enumerable.Where)} yields {value}.".WriteLine(),
```
```
onCompleted: () => $"{nameof(Enumerable.Where)} completes.".WriteLine())
```
```
.TakeLast(2).Do(
```
```
onNext: value => $"{nameof(EnumerableEx.TakeLast)} yields {value}.".WriteLine(),
```
```
onCompleted: () => $"{nameof(EnumerableEx.TakeLast)} completes.".WriteLine())
```
```
.WriteLines(value => $"Composited query yields result {value}.");
```
```
// Range yields -5.
```
```
// Range yields -4.
```
```
// Range yields -3.
```
```
// Range yields -2.
```
```
// Range yields -1.
```
```
// Range yields 0.
```
```
// Range yields 1.
```
```
// Where yields 1.
```
```
// Range yields 2.
```
```
// Where yields 2.
```
```
// Range yields 3.
```
```
// Where yields 3.
```
```
// Range yields 4.
```
```
// Where yields 4.
```
```
// Range completes.
```
```
// Where completes.
```
```
// TakeLast yields 3.
```
```
// Composited query yields result 3.
```
```
// TakeLast yields 4.
```
```
// Composited query yields result 4.
```
```
// TakeLast completes.
```

}

Since System.IObserver<T> is the composition of above onNext, onError, onCompleted functions:

namespace System
```
{
```
```
public interface IObserver<in T>
```
```
{
```
```
void OnCompleted();
```
```
void OnError(Exception error);
```
```
void OnNext(T value);
```
```
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
```
this IEnumerable<TSource> source, IComparer<TSource> comparer);
```
```
public static TSource Min<TSource>(
```

this IEnumerable<TSource\> source, IComparer<TSource\> comparer);

As fore mentioned, to use the standard Max/Min with a source sequence, exception is thrown if the source type does not implement IComparable or IComparable<T>, which is a problem when the source type cannot be modified to add IComparable or IComparable<T> implementation:

internal static void MaxMinGeneric()
```
{
```
```
Character maxCharacter = Characters().Max().WriteLine();
```
```
Character minCharacter = Characters().Min().WriteLine();
```

}

The overloads with comparer does not have such requirement:

internal static void MaxMin()
```
{
```
```
Character maxCharacter = Characters()
```
```
.Max(Comparer<Character>.Create((character1, character2) => string.Compare(
```
```
character1.Name, character2.Name, StringComparison.OrdinalIgnoreCase)));
```
```
Character minCharacter = Characters()
```
```
.Max(Comparer<Character>.Create((character1, character2) => string.Compare(
```
```
character1.Name, character2.Name, StringComparison.OrdinalIgnoreCase)));
```

}

MaxBy/MinBy accept key selector and key comparer functions, and their output is a list of all maximum/minimum values:

public static IList<TSource\> MaxBy<TSource, TKey\>(
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IList<TSource> MaxBy<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IComparer<TKey> comparer);
```
```
public static IList<TSource> MinBy<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IList<TSource> MinBy<TSource, TKey>(
```

this IEnumerable<TSource\> source, Func<TSource, TKey\>keySelector, IComparer<TKey\> comparer);

For example:

internal static void MaxByMinBy()
```
{
```
```
IList<Character>maxCharacters = Characters()
```
```
.MaxBy(character => character.Name, StringComparer.OrdinalIgnoreCase);
```
```
IList<Character>minCharacters = Characters()
```
```
.MinBy(character => character.Name, StringComparer.OrdinalIgnoreCase);
```

}

The previous example of finding the maximum types in core library becomes easy with MaxBy:

internal static void MaxBy()
```
{
```
```
CoreLibrary.ExportedTypes
```
```
.Select(type => (Type: type, MemberCount: type.GetDeclaredMembers().Length))
```
```
.MaxBy(typeAndMemberCount => typeAndMemberCount.MemberCount)
```
```
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
```
this IEnumerable<TSource> source, Action<TSource> onNext)
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
onNext(value);
```
```
}
```
```
}
```
```
public static void ForEach<TSource>(
```
```
this IEnumerable<TSource> source, Action<TSource, int>onNext)
```
```
{
```
```
int index = 0;
```
```
foreach (TSource value in source)
```
```
{
```
```
onNext(value, index);
```
```
index = checked(index + 1);
```
```
}
```

}

There was an issue with the indexed ForEach – the index increment was not checked. The issue was uncovered when writing this book and has been fixed.

## Summary

This chapter discusses the additional LINQ to Objects queries provided by Microsoft through Ix, including sequence queries for generation, filtering, mapping, concatenation, set, partitioning, conversion, buffering, exception, control flow, iteration, value queries for aggregation, quantifiers, and the handiest ForEach to execute LINQ query.