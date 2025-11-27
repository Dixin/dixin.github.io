---
title: "C# 8.0 in-depth: Understanding index and range, and working with LINQ and IEnumerable<T>"
published: 2019-02-24
description: "C# 8.0 introduces index and range for array. This part discussed the index and range types, syntax, compilation, and how to apply them with LINQ for any type that implements IEnumerable<T>."
image: ""
tags: ["C#", "C# 8.0", ".NET", ".NET Core"]
category: "C#"
draft: false
lang: ""
---

C# 8.0 introduces index and range for array. This part discussed the index and range types, syntax, compilation, and how to apply them with LINQ for any type that implements IEnumerable<T>.

## Index and Range types and C# syntax

The System.Index and System.Range structures are introduced to the new .NET Standard. Index is a wrapper of int index value (non-negative int means index from start, negative int means index from the end), and Range is a tuple of start Index and end Index:

```csharp
public readonly struct Index : IEquatable<Index>
{
    private readonly int _value;

    public Index(int value, bool fromEnd)
    {
        if (value < 0)
        {
            ThrowHelper.ThrowValueArgumentOutOfRange_NeedNonNegNumException();
        }
        this._value = fromEnd ? ~value : value;
    }

    public int Value => this._value >= 0 ? this._value : ~this._value;

    public bool FromEnd => _value < 0;

    public static implicit operator Index(int value) => new Index(value, false);

    // Other members.
}

public readonly struct Range : IEquatable<Range>
{
    private Range(Index start, Index end)
    {
        this.Start = start; this.End = end;
    }

    public Index Start { get; }

    public Index End { get; }

    public static Range Create(Index start, Index end) => 
        new Range(start, end);
    
    public static Range All() => 
        new Range(new Index(0, false), new Index(0, true));

    // Other members.
}
```

C# 8.0 introduces the index and range syntax:
```
Index index1 = 1; // Index 1 from start.
Index index2 = ^2; // Index 2 from end.
Range range1 = 1..10; // Start index is 1 from start, end index is 10 from start.
Range range2 = 10..^5; // Start index is 1 from start, end index is 5 from end.
Range range3 = ^10..; // Start index is 10 from end, end index is 0 from end.
Range range4 = ..; // Start index is 0 from start, end index is 0 from end.
```

These are syntactic sugars, which are compiled to:
```
Index index3 = 1;
Index index2 = new Index(2, true);
Range range5 = Range.Create(1, 10);
Range range4 = Range.Create(10, new Index(5, true));
Range range3 = Range.FromStart(new Index(10, true));
Range range2 = Range.All();
```

## Index and Range for array

C# introduces syntactic sugars to enable Index with array:
```
int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
int value = array[^1];
```

It is compiled to normal int indexer access:
```
int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
Index index = new Index(1, true);
int value = index.FromEnd ? array[array.Length - index.Value] : array[index.Value];
```

And this is the range syntactic sugar for array slice:
```
int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
int[] slice = array[^9..7];
```

It is compiled to array copy:
```
int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
Range range = Range.Create(new Index(9, true), 7);
int startIndex = range.Start.FromEnd ? array.Length - range.Start.Value : range.Start.Value;
int rangeLength = (range.End.FromEnd ? array.Length - range.End.Value : range.End.Value) - startIndex;
int[] slice = new int[rangeLength];
Array.Copy(sourceArray: array, sourceIndex: startIndex, destinationArray: slice, destinationIndex: 0, length: rangeLength);
```

## LINQ queries - Index and Range for IEnumerable<T>

Currently (v3.0.0-preview2/SDK 3.0.100-preview-010184), the index and range work with array, and do not work with other types, like List<T>. It is natural and convenient to support index and range in LINQ, so they can work with any type that implements IEnumerable<T>. The goals of these LINQ APIs are:

-   Use index to locate an element in sequence, use range to slice sequence. The usage is the same as index/range for array, but with deferred execution for slice with range.
-   Use range to start fluent LINQ query.

This enables the index and range to work with any type that implements IEnumerable<T>.

LINQ already has ElementAt(int index) and ElementOrDefault(int index) query operator. It would be natural to have a overload for System.Index: ElementAt(Index index) and ElementOrDefault(Index index), and a new method ElementsIn(Range range), so that LINQ can seamlessly work with C# 8.0:
```
Index index = ...;
var element1 = source1.ElementAt(index);
var element2 = source2.ElementAtOrDefault(^ 5);
Range range = ...;
var slice1 = source3.ElementsIn(range);
var slice2 = source4.ElementsIn(2..^ 2)
var slice2 = source5.ElementsIn(^ 10..);
```

The following Range overload and AsEnumerable overload for System.Range convert it to a sequence, so that LINQ query can be started fluently from c# range:
```
Index index = ...;
var element1 = source1.ElementAt(index);
var element2 = source2.ElementAtOrDefault(^ 5);
Range range = ...;
var slice1 = source3.ElementsIn(range);
var slice2 = source4.ElementsIn(2..^ 2)
var slice2 = source5.ElementsIn(^ 10..);
```

### APIs

For LINQ to Objects, ideally:

```csharp
namespace System.Linq
{
    public static partial class Queryable
    {
        public static TSource ElementAt<TSource>(this IEnumerable<TSource> source, Index index) { throw null; }

        public static TSource ElementAtOrDefault<TSource>(this IEnumerable<TSource> source, Index index) { throw null; }

        public static IEnumerable<TSource> ElementsIn<TSource>(this IEnumerable<TSource> source, Range range) { throw null; }

        public static IEnumerable<TSource> Range<TSource>(Range range) { throw null; }

        public static IEnumerable<TSource> AsEnumerable<TSource>(this Range source) { throw null; }
    }
}
```

For remote LINQ, ideally:

```csharp
namespace System.Linq
{
    public static partial class Queryable
    {
        public static TSource ElementAt<TSource>(this IQueryable<TSource> source, Index index) { throw null; }

        public static TSource ElementAtOrDefault<TSource>(this IQueryable<TSource> source, Index index) { throw null; }

        public static IQueryable<TSource> ElementsIn<TSource>(this IQueryable<TSource> source, Range range) { throw null; }
    }
}
```

### Implementation details

These APIs' implementation is self-contained so that the code can be just copied to use.

The implementation of ElementAt(Index), ElementOrDefault(Index) and ElementsIn(Range) for IQueryable<T> is straightforward. They just create an expression tree.

```csharp
internal static class QueryableExtensions
{
    public static TSource ElementAt<TSource>(this IQueryable<TSource> source, Index index)
    {
        if (source == null)
            // throw Error.ArgumentNull(nameof(source));
            throw new ArgumentNullException(nameof(source));
        return source.Provider.Execute<TSource>(
            Expression.Call(
                null,
                CachedReflectionInfo.ElementAt_TSource_2(typeof(TSource)),
                source.Expression, Expression.Constant(index)
                ));
    }

    public static TSource ElementAtOrDefault<TSource>(this IQueryable<TSource> source, Index index)
    {
        if (source == null)
            // throw Error.ArgumentNull(nameof(source));
            throw new ArgumentNullException(nameof(source));
        return source.Provider.Execute<TSource>(
            Expression.Call(
                null,
                CachedReflectionInfo.ElementAtOrDefault_TSource_2(typeof(TSource)),
                source.Expression, Expression.Constant(index)
                ));
    }

    public static IQueryable<TSource> ElementsIn<TSource>(this IQueryable<TSource> source, Range range)
    {
        if (source == null)
            // throw Error.ArgumentNull(nameof(source));
            throw new ArgumentNullException(nameof(source));

        return source.Provider.CreateQuery<TSource>(
            Expression.Call(
                null,
                CachedReflectionInfo.ElementsIn_TSource_2(typeof(TSource)),
                source.Expression, Expression.Constant(range)));
    }
}

internal static class CachedReflectionInfo
{
    private static MethodInfo s_ElementAt_TSource_2;

    public static MethodInfo ElementAt_TSource_2(Type TSource) =>
         (s_ElementAt_TSource_2 ??
         (s_ElementAt_TSource_2 = new Func<IQueryable<object>, Index, object>(QueryableExtensions.ElementAt).GetMethodInfo().GetGenericMethodDefinition()))
          .MakeGenericMethod(TSource);

    private static MethodInfo s_ElementAtOrDefault_TSource_2;

    public static MethodInfo ElementAtOrDefault_TSource_2(Type TSource) =>
         (s_ElementAtOrDefault_TSource_2 ??
         (s_ElementAtOrDefault_TSource_2 = new Func<IQueryable<object>, Index, object>(QueryableExtensions.ElementAtOrDefault).GetMethodInfo().GetGenericMethodDefinition()))
          .MakeGenericMethod(TSource);

    private static MethodInfo s_ElementsIn_TSource_2;

    public static MethodInfo ElementsIn_TSource_2(Type TSource) =>
         (s_ElementsIn_TSource_2 ??
         (s_ElementsIn_TSource_2 = new Func<IQueryable<object>, Range, IQueryable<object>>(QueryableExtensions.ElementsIn).GetMethodInfo().GetGenericMethodDefinition()))
          .MakeGenericMethod(TSource);
}
```

These methods for IEnumerable<T> are straightforward as well, I just followed the behavior and exceptions of array with range. See unit tests [https://github.com/Dixin/CodeSnippets/blob/master/Linq.Range/Linq.Range.Tests/ElementsInTests.cs](https://github.com/Dixin/CodeSnippets/blob/master/Linq.Range/Linq.Range.Tests/ElementsInTests.cs).

ElementAt(Index) and ElementAtOrDefault(Index):
```
public static TSource ElementAt<TSource>(this IEnumerable<TSource> source, Index index)
{
    if (source == null)
    {
        // ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
        throw new ArgumentNullException(nameof(source));
    }

    if (!index.FromEnd)
    {
        return source.ElementAt(index.Value);
    }

    int indexFromEnd = index.Value;
    if (indexFromEnd > 0)
    {
        if (source is IList<TSource> list)
        {
            return list[list.Count - indexFromEnd];
        }

        using (IEnumerator<TSource> e = source.GetEnumerator())
        {
            if (e.MoveNext())
            {
                Queue<TSource> queue = new Queue<TSource>();
                queue.Enqueue(e.Current);
                while (e.MoveNext())
                {
                    if (queue.Count == indexFromEnd)
                    {
                        queue.Dequeue();
                    }

                    queue.Enqueue(e.Current);
                }

                if (queue.Count == indexFromEnd)
                {
                    return queue.Dequeue();
                }
            }
        }
    }

    // ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.index);
    throw new ArgumentOutOfRangeException(nameof(index));
    return default!;
}

public static TSource ElementAtOrDefault<TSource>(this IEnumerable<TSource> source, Index index)
{
    if (source == null)
    {
        // ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
        throw new ArgumentNullException(nameof(source));

    }

    if (!index.FromEnd)
    {
        return source.ElementAtOrDefault(index.Value);
    }

    int indexFromEnd = index.Value;
    if (indexFromEnd > 0)
    {
        if (source is IList<TSource> list)
        {
            int count = list.Count;
            if (count >= indexFromEnd)
            {
                return list[count - indexFromEnd];
            }
        }

        using (IEnumerator<TSource> e = source.GetEnumerator())
        {
            if (e.MoveNext())
            {
                Queue<TSource> queue = new Queue<TSource>();
                queue.Enqueue(e.Current);
                while (e.MoveNext())
                {
                    if (queue.Count == indexFromEnd)
                    {
                        queue.Dequeue();
                    }

                    queue.Enqueue(e.Current);
                }

                if (queue.Count == indexFromEnd)
                {
                    return queue.Dequeue();
                }
            }
        }
    }

    return default!;
}
```

ElementsIn(Range):

```csharp
public static IEnumerable<TSource> ElementsIn<TSource>(this IEnumerable<TSource> source, Range range)
{
    if (source == null)
    {
        // ThrowHelper.ThrowArgumentNullException(ExceptionArgument.source);
        throw new ArgumentNullException(nameof(source));
    }

    return ElementsInIterator(source, range);
}

private static IEnumerable<TSource> ElementsInIterator<TSource>(IEnumerable<TSource> source, Range range)
{
    Index start = range.Start;
    Index end = range.End;

    if (source is IList<TSource> list)
    {
        int count = list.Count;
        if (count == 0 && range.Equals(System.Range.All()))
        {
            yield break;
        }

        int firstIndex = start.FromEnd ? count - start.Value : start.Value;
        int lastIndex = (end.FromEnd ? count - end.Value : end.Value) - 1;
        if (lastIndex < firstIndex - 1)
        {
            // ThrowHelper.ThrowOverflowException();
            throw new OverflowException(); // Following the behavior of array with range.
        }

        if (firstIndex < 0 || lastIndex < 0)
        {
            // ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.range);
            throw new ArgumentOutOfRangeException(nameof(range)); // Following the behavior of array with range.
        }

        if (firstIndex >= count || lastIndex >= count)
        {
            // ThrowHelper.ThrowArgumentException(ExceptionArgument.range);
            throw new ArgumentException(nameof(range)); // Following the behavior of array with range.
        }

        for (int currentIndex = firstIndex; currentIndex <= lastIndex; currentIndex++)
        {
            yield return list[currentIndex];
        }
        yield break;
    }

    using (IEnumerator<TSource> e = source.GetEnumerator())
    {
        int currentIndex = -1;
        if (start.FromEnd)
        {
            if (!e.MoveNext())
            {
                const int count = 0;
                int firstIndex = count - start.Value;
                int lastIndex = (end.FromEnd ? count - end.Value : end.Value) - 1;
                if (lastIndex < firstIndex - 1)
                {
                    // ThrowHelper.ThrowOverflowException();
                    throw new OverflowException(); // Following the behavior of array with range.
                }

                // ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.range);
                throw new ArgumentOutOfRangeException(nameof(range));
            }
            else
            {
                Queue<TSource> queue = new Queue<TSource>();
                queue.Enqueue(e.Current);
                currentIndex++;

                int takeLastCount = start.Value;
                while (e.MoveNext())
                {
                    if (queue.Count == takeLastCount)
                    {
                        queue.Dequeue();
                    }

                    queue.Enqueue(e.Current);
                    currentIndex++;
                }

                if (queue.Count < takeLastCount)
                {
                    // ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.range);
                    throw new ArgumentOutOfRangeException(nameof(range));
                }

                int firstIndex = currentIndex + 1 - takeLastCount;
                int lastIndex = end.FromEnd ? currentIndex - end.Value : end.Value - 1;
                if (lastIndex < firstIndex - 1)
                {
                    // ThrowHelper.ThrowOverflowException();
                    throw new OverflowException(); // Following the behavior of array with range.
                }

                for (int index = firstIndex; index <= lastIndex; index++)
                {
                    yield return queue.Dequeue();
                }
            }
        }
        else
        {
            int firstIndex = start.Value;
            if (!e.MoveNext())
            {
                if (range.Equals(System.Range.All()))
                {
                    yield break;
                }

                const int count = 0;
                int lastIndex = (end.FromEnd ? count - end.Value : end.Value) - 1;
                if (lastIndex < firstIndex - 1)
                {
                    // ThrowHelper.ThrowOverflowException();
                    throw new OverflowException(); // Following the behavior of array with range.
                }
                // ThrowHelper.ThrowArgumentException(ExceptionArgument.range);
                throw new ArgumentException(nameof(range)); // Following the behavior of array with range.
            }

            currentIndex++;
            while (currentIndex < firstIndex && e.MoveNext())
            {
                currentIndex++;
            }

            if (currentIndex != firstIndex)
            {
                // ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.range);
                throw new ArgumentOutOfRangeException(nameof(range));
            }

            if (end.FromEnd)
            {
                int skipLastCount = end.Value;
                if (skipLastCount > 0)
                {
                    Queue<TSource> queue = new Queue<TSource>();
                    do
                    {
                        if (queue.Count == skipLastCount)
                        {
                            yield return queue.Dequeue();
                        }

                        queue.Enqueue(e.Current);
                        currentIndex++;
                    }
                    while (e.MoveNext());
                }
                else
                {
                    do
                    {
                        yield return e.Current;
                        currentIndex++;
                    }
                    while (e.MoveNext());
                }

                if (firstIndex + skipLastCount > currentIndex)
                {
                    // ThrowHelper.ThrowOverflowException();
                    throw new OverflowException(); // Following the behavior of array with range.
                }
            }
            else
            {
                int lastIndex = end.Value - 1;
                if (lastIndex < firstIndex - 1)
                {
                    // ThrowHelper.ThrowOverflowException();
                    throw new OverflowException(); // Following the behavior of array with range.
                }

                if (lastIndex == firstIndex - 1)
                {
                    yield break;
                }

                yield return e.Current;
                while (currentIndex < lastIndex && e.MoveNext())
                {
                    currentIndex++;
                    yield return e.Current;
                }

                if (currentIndex != lastIndex)
                {
                    // ThrowHelper.ThrowArgumentOutOfRangeException(ExceptionArgument.range);
                    throw new ArgumentOutOfRangeException(nameof(range));
                }
            }
        }
    }
}
```

For Range(Range) and AsEnumerable(Range), the question is: what does Range's start Index and end Index mean when the index is from the end? For example, 10..20 can be easily converted to a sequence of 10, 11,12, ... 19, but how about ^20...^10? In my current implementation, regarding Index's value can be from 0 to int.MaxValue, I assume a virtual "full range" 0..2147483648, and any Range instance is a slice of that "full range". So:

-   Ranges .. and 0.. and ..^0 and 0..^0 are converted to "full sequence" 0, 1, .. 2147483647
-   Range 100..^47 is converted to sequence 100, 101, .. 2147483600
-   Range ^48..^40 is converted to sequence 2147483600, 2147483601 .. 2147483607
-   Range 10..10 is converted to empty sequence

etc.

```csharp
public static IEnumerable<int> Range(Range range)
{
    Index startIndex = range.Start;
    Index endIndex = range.End;
    int firstValue = startIndex.FromEnd ? int.MaxValue - startIndex.Value + 1 : startIndex.Value;
    int lastValue = endIndex.FromEnd ? int.MaxValue - endIndex.Value : endIndex.Value - 1;
    if (lastValue < firstValue - 1)
    {
        // ThrowHelper.ThrowOverflowException();
        throw new OverflowException(); // Following the behavior of array with range.
    }

    if (lastValue == firstValue - 1)
    {
        return Enumerable.Empty<int>();
    }

    return RangeIterator(firstValue, lastValue);
}

private static IEnumerable<int> RangeIterator(int firstValue, int lastValue)
{
    for (int value = firstValue; value <= lastValue; value = checked(value + 1))
    {
        yield return value;
        if (value == int.MaxValue)
        {
            yield break;
        }
    }
}

public static IEnumerable<int> AsEnumerable(this Range range)
{
    int[] array = { 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    int[] slice = array[^ 9..7];
    return Range(range);
}
```

See unit tests of AsEnumerable(Range) [https://github.com/Dixin/CodeSnippets/blob/master/Linq.Range/Linq.Range.Tests/AsEnumerableTests.cs](https://github.com/Dixin/CodeSnippets/blob/master/Linq.Range/Linq.Range.Tests/AsEnumerableTests.cs).