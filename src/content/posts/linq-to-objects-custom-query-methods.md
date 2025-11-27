---
title: "LINQ to Objects in Depth (7) Building Custom Query Methods"
published: 2019-07-07
description: "With the understanding of standard queries in .NET Standard and the additional queries provided by Microsoft, it is easy to define custom LINQ queries for objects. This chapter demonstrates how to def"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: "LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

With the understanding of standard queries in .NET Standard and the additional queries provided by Microsoft, it is easy to define custom LINQ queries for objects. This chapter demonstrates how to define the following useful LINQ to Object queries:

· Sequence queries: output a new IEnumerable<T> sequence (deferred execution)

o Generation: Create, Guid, RandomInt32, RandomDouble, FromValue, EmptyIfNull

o Concatenation: ConcatJoin

o Partitioning: Subsequence, Pagination

o Ordering: OrderBy\*, OrderByDescending\*, ThenBy\*, ThenByDescending\*

o Grouping, Join, Set: GroupBy\*, Join\*, GroupJoin\*, Distinct, Union, Intersect\*, Except\*

o List: Insert, Remove, RemoveAll, RemoveAt

· Collection queries: output a new collection (immediate execution)

o Conversion: ToDictionary, ToLookup

· Value queries: output a single value (immediate execution)

o Aggregation: PercentileExclusive, PercentileInclusive, Percentile

o Quantifiers: IsNullOrEmpty, Contains

o Equality: SequenceEqual

o List: IndexOf, LastIndexOf

· Void queries: no output (immediate execution)

o Iteration: ForEach

Just like the standard and Ix queries, all the above sequence queries implement deferred execution, where the sequence queries marked with \* implements eager evaluation, and other unmarked sequence queries implements lazy evaluation. All the other collection queries, value queries, and void queries implement immediate execution.

These queries can be defined in the following static class EnumerableX:

public static partial class EnumerableX { }

## Sequence queries

### Generation

Ix provides a Create query to execute sequence factory function once. In contrast, the following Create overload is defined to generate a sequence of values by repeatedly calling a value factory:

public static IEnumerable<TResult\> Create<TResult\>(

```csharp
Func<TResult>valueFactory, int? count = null)
```
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
IEnumerable<TResult>CreateGenerator()
```
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
yield return valueFactory(); // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
for (int index = 0; index < count; index++)
```
```csharp
{
```
```csharp
yield return valueFactory(); // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
return CreateGenerator();
```

}

When count is not provided, an infinite sequence is generated. For example, the following Guid query uses Create to repeatedly call Guid.NewGuid, so that it generates a sequence of new GUIDs:

public static IEnumerable<Guid\> NewGuid(int? count) => Create(Guid.NewGuid, count);

The following queries generate a sequence of random numbers:

public static IEnumerable<int> RandomInt32(

```csharp
int min, int max, int? count = null, int? seed = null) =>
```
```csharp
EnumerableEx.Defer(() =>
```
```csharp
{
```
```csharp
Random random = new Random(seed ?? Environment.TickCount);
```
```csharp
return Create(() => random.Next(min, max), count);
```
```csharp
});
```

```csharp
public static IEnumerable<double> RandomDouble(int? count = null, int ? seed = null) =>
```
```csharp
EnumerableEx.Defer(() =>
```
```csharp
{
```
```csharp
Random random = new Random(seed ?? Environment.TickCount);
```
```csharp
return Create(random.NextDouble, count);
```

});

Here Defer is called to defer the instantiation of Random.

The following EmptyIfNull can be used to omit null checks:

public static IEnumerable<TSource\> EmptyIfNull<TSource\>(this IEnumerable<TSource\> source) =>

source ?? Enumerable.Empty<TSource\>();

For example:

internal static void EmptyIfNull(IEnumerable<int\> source1, IEnumerable<int\> source2)

```csharp
{
```
```csharp
IEnumerable<int>positive = source1.EmptyIfNull()
```
```csharp
.Union(source2.EmptyIfNull())
```
```csharp
.Where(int32 => int32 > 0);
```

}

### Concatenation

string has a useful method Join:

namespace System

```csharp
{
```
```csharp
public class String
```
```csharp
{
```
```csharp
public static string Join(string separator, IEnumerable<string> values);
```
```csharp
}
```

}

It concatenates the string values with a single separator between each 2 adjacent string values. Similarly, a general ConcatJoin query can be defined as:

public static IEnumerable<TSource\> ConcatJoin<TSource\>(

```csharp
this IEnumerable<TSource> source, TSource separator)
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
if (iterator.MoveNext())
```
```csharp
{
```
```csharp
yield return iterator.Current; // Deferred execution.
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
yield return separator; // Deferred execution.
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
```csharp
}
```

}

The built-in Append/Prepend can append/prepend 1 value to the source sequence. So the following overloads can be defined to support multiple values:

public static IEnumerable<TSource> Append<TSource>(

```csharp
this IEnumerable<TSource> source, params TSource[] values) =>
```
```csharp
source.Concat(values);
```

```csharp
public static IEnumerable<TSource> Prepend<TSource>(
```
```csharp
this IEnumerable<TSource> source, params TSource[] values) =>
```

values.Concat(source);

The following AppendTo/PrependTo extension method are defined for single value, which canto make code more fluent:

public static IEnumerable<TSource> AppendTo<TSource>(

```csharp
this TSource value, IEnumerable<TSource> source) =>
```
```csharp
source.Append(value);
```

```csharp
public static IEnumerable<TSource> PrependTo<TSource>(
```
```csharp
this TSource value, IEnumerable<TSource> source) =>
```

source.Prepend(value);

### Partitioning

Similar to string.Substring, a general Subsequence query can be defined as:

public static IEnumerable<TSource\> Subsequence<TSource\>(

```csharp
this IEnumerable<TSource> source, int startIndex, int count) =>
```

source.Skip(startIndex).Take(count);

The following Pagination query is useful to paginate a sequence of values:

public static IEnumerable<TSource> Pagination<TSource>(

```csharp
this IEnumerable<TSource> source, int pageIndex, int countPerPage) =>
```

source.Skip(pageIndex \* countPerPage).Take(countPerPage);

### Ordering

In LINQ to Objects, the ordering queries must compare objects to determine their order, so they all have overload to accept IComparer<T> parameter. This interface can be viewed as a wrapper of a simple comparison functions:

namespace System.Collections.Generic

```csharp
{
```
```csharp
public interface IComparer<in T>
```
```csharp
{
```
```csharp
int Compare(T x, T y);
```
```csharp
}
```

```csharp
public interface IEqualityComparer<in T>
```
```csharp
{
```
```csharp
bool Equals(T x, T y);
```

```csharp
int GetHashCode(T obj);
```
```csharp
}
```

}

In C#, interfaces are less convenient then functions. C# supports lambda expression to define anonymous functions inline, but does not support anonymous class to enable inline interface. For the LINQ queries accepting interface parameter, they are easier to be called if they can accept function parameter instead. To Implement this, the following ToComparer function can be defined to convert a compare functions to an IComparer<T\> interface:

private static IComparer<T\> ToComparer<T\>(Func<T, T, int\> compare) =>

Comparer<T\>.Create(new Comparison<T\>(compare));

It simply calls a .NET Standard built-in API Comparer<T>.Create for the IComparer<T\> instantiation. Now the ordering queries’ overloads can be defined as a higher-order functions to accept a (T, T) –> int function instead of IComparer<T> interface:

public static IOrderedEnumerable<TSource\> OrderBy<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TKey, TKey, int>compare) =>
```
```csharp
source.OrderBy(keySelector, ToComparer(compare));
```

```csharp
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TKey, TKey, int>compare) =>
```
```csharp
source.OrderByDescending(keySelector, ToComparer(compare));
```

```csharp
public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TKey, TKey, int>compare) =>
```
```csharp
source.ThenBy(keySelector, ToComparer(compare));
```

```csharp
public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TKey, TKey, int>compare) =>
```

source.ThenByDescending(keySelector, ToComparer(compare));

### Grouping, join, and set

In LINQ to Objects, there are also queries need to compare objects’ equality to determine the grouping, join, and set operation, so they all have overload to accept IEqualityComparer<T> parameter. .NET Standard does not provide a built-in API for IEqualityComparer<T> instantiation from functions (F# core library provides a Microsoft.FSharp.Collections.HashIdentity type to wrap functions for IEqualityComparer<T>, but it is not easy to use in C#). So first, a EqualityComparerWrapper<T> type can be defined to implement IEqualityComparer<T>, then a higher-order function ToEqualityComparer can be defined to convert a equals functions and a getHashCode function to an IEqualityComparer<T\> interface:

internal class EqualityComparerWrapper<T\> : IEqualityComparer<T\>

```csharp
{
```
```csharp
private readonly Func<T, T, bool> equals;
```

```csharp
private readonly Func<T, int> getHashCode;
```

```csharp
public EqualityComparerWrapper(Func<T, T, bool> equals, Func<T, int> getHashCode = null) =>
```
```csharp
(this.equals, this.getHashCode) = (@equals, getHashCode ?? (value => value.GetHashCode()));
```

```csharp
public bool Equals(T x, T y) => this.equals(x, y);
```

```csharp
public int GetHashCode(T obj) => this.getHashCode(obj);
```
```csharp
}
```

```csharp
private static IEqualityComparer<T> ToEqualityComparer<T>(
```
```csharp
Func<T, T, bool> equals, Func<T, int> getHashCode = null) =>
```

new EqualityComparerWrapper<T>(equals, getHashCode);

The getHashCode function is optional, because any type already inherits a GetHashCode method from object. Similar to ordering queries, the following functional overloads can be defined for GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except:

public static IEnumerable<TResult\> GroupBy<TSource, TKey, TElement, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TSource, TElement> elementSelector,
```
```csharp
Func<TKey, IEnumerable<TElement>, TResult> resultSelector,
```
```csharp
Func<TKey, TKey, bool>equals,
```
```csharp
Func<TKey, int> getHashCode = null) =>
```
```csharp
source.GroupBy(keySelector, elementSelector, resultSelector, ToEqualityComparer(equals, getHashCode));
```

```csharp
public static IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
```
```csharp
this IEnumerable<TOuter> outer,
```
```csharp
IEnumerable<TInner>inner,
```
```csharp
Func<TOuter, TKey> outerKeySelector,
```
```csharp
Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<TOuter, TInner, TResult>resultSelector,
```
```csharp
Func<TKey, TKey, bool>equals,
```
```csharp
Func<TKey, int> getHashCode = null) =>
```
```csharp
outer.Join(
```
```csharp
inner,
```
```csharp
outerKeySelector,
```
```csharp
innerKeySelector,
```
```csharp
resultSelector,
```
```csharp
ToEqualityComparer(equals, getHashCode));
```

```csharp
public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
```
```csharp
this IEnumerable<TOuter> outer,
```
```csharp
IEnumerable<TInner>inner,
```
```csharp
Func<TOuter, TKey> outerKeySelector,
```
```csharp
Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
```
```csharp
Func<TKey, TKey, bool>equals,
```
```csharp
Func<TKey, int> getHashCode = null) =>
```
```csharp
outer.GroupJoin(
```
```csharp
inner,
```
```csharp
outerKeySelector,
```
```csharp
innerKeySelector,
```
```csharp
resultSelector,
```
```csharp
ToEqualityComparer(equals, getHashCode));
```

```csharp
public static IEnumerable<TSource> Distinct<TSource>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TSource, bool>equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```
```csharp
source.Distinct(ToEqualityComparer(equals, getHashCode));
```

```csharp
public static IEnumerable<TSource> Union<TSource>(
```
```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
Func<TSource, TSource, bool>equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```
```csharp
first.Union(second, ToEqualityComparer(equals, getHashCode));
```

```csharp
public static IEnumerable<TSource> Intersect<TSource>(
```
```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
Func<TSource, TSource, bool>equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```
```csharp
first.Intersect(second, ToEqualityComparer(equals, getHashCode));
```

```csharp
public static IEnumerable<TSource> Except<TSource>(
```
```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
Func<TSource, TSource, bool>equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```

first.Except(second, ToEqualityComparer(equals, getHashCode));

### List

The List<T> type provides handy methods, which can be implemented for sequence too. The following Insert query is similar to List<T>.Insert, it outputs a new sequence with the specified value is inserted at the specified index:

public static IEnumerable<TSource\> Insert<TSource\>(

```csharp
this IEnumerable<TSource> source, int index, TSource value)
```
```csharp
{
```
```csharp
if (index< 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(index));
```
```csharp
}
```

```csharp
IEnumerable<TSource> InsertGenerator()
```
```csharp
{
```
```csharp
int currentIndex = 0;
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
if (currentIndex == index)
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
yield return sourceValue; // Deferred execution.
```
```csharp
currentIndex = checked(currentIndex + 1);
```
```csharp
}
```
```csharp
if (index == currentIndex)
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
else if (index> currentIndex)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(
```
```csharp
nameof(index),
```
```csharp
$"{nameof(index)} must be within the bounds of {nameof(source)}.");
```
```csharp
}
```
```csharp
}
```
```csharp
return InsertGenerator();
```

}

The above Insert query is more functional than List<T>.Insert. List<T>.Insert has no output, so it is not fluent and it implements immediate execution. It is also impure by mutating the list in place. The above Insert query follows the iterator pattern, and uses yield statement to implement deferred execution. It outputs a new sequence, so it is fluent, and it is a pure function since it does not mutate the source sequence.

RemoveAt outputs a new sequence with a value removed at the specified index:

public static IEnumerable<TSource\> RemoveAt<TSource\>(

```csharp
this IEnumerable<TSource> source, int index)
```
```csharp
{
```
```csharp
if (index< 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(index));
```
```csharp
}
```

```csharp
IEnumerable<TSource> RemoveAtGenerator()
```
```csharp
{
```
```csharp
int currentIndex = 0;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (currentIndex != index)
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
currentIndex = checked(currentIndex + 1);
```
```csharp
}
```
```csharp
if (index> = currentIndex)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(index));
```
```csharp
}
```
```csharp
}
```
```csharp
return RemoveAtGenerator();
```

}

Remove outputs a new sequence with the first occurrence of the specified value removed. Besides being deferred and lazy, it also accepts an optional equality comparer:

public static IEnumerable<TSource\> Remove<TSource\>(

```csharp
this IEnumerable<TSource>source,
```
```csharp
TSource value,
```
```csharp
IEqualityComparer<TSource> comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```csharp
bool isRemoved = false;
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
if (!isRemoved&& comparer.Equals(sourceValue, value))
```
```csharp
{
```
```csharp
isRemoved = true;
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
yield return sourceValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

RemoveAll outputs a new sequence with all occurrences of the specified value removed:

public static IEnumerable<TSource\> RemoveAll<TSource\>(

```csharp
this IEnumerable<TSource>source,
```
```csharp
TSource value,
```
```csharp
IEqualityComparer<TSource> comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
if (!comparer.Equals(sourceValue, value))
```
```csharp
{
```
```csharp
yield return sourceValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

Since Remove and RemoveAll tests the equality of objects to determine which objects to remove, the following higher-order function overloads can be defined for convenience:

public static IEnumerable<TSource> Remove<TSource>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
TSource value,
```
```csharp
Func<TSource, TSource, bool> equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```
```csharp
source.Remove(value, ToEqualityComparer(@equals, getHashCode));
```

```csharp
public static IEnumerable<TSource> RemoveAll<TSource>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
TSource value,
```
```csharp
Func<TSource, TSource, bool> equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```

source.RemoveAll(value, ToEqualityComparer(@equals, getHashCode));

## Collection queries

### Conversion

ToDictionary and ToLookup accept IEqualityComparer<T> parameter to test the equality of keys. Their functional overloads can be defined:

public static Dictionary<TKey, TElement\> ToDictionary<TSource, TKey, TElement\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TSource, TElement> elementSelector,
```
```csharp
Func<TKey, TKey, bool>equals,
```
```csharp
Func<TKey, int> getHashCode = null) =>
```
```csharp
source.ToDictionary(keySelector, elementSelector, ToEqualityComparer(equals, getHashCode));
```

```csharp
public static ILookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TSource, TElement> elementSelector,
```
```csharp
Func<TKey, TKey, bool>equals,
```
```csharp
Func<TKey, int> getHashCode = null) =>
```

source.ToLookup(keySelector, elementSelector, ToEqualityComparer(equals, getHashCode));

## Value queries

### Aggregation

.NET provides basic aggregation queries, including Sum/Average/Max/Min queries. In reality, it is also common to calculate the variance, standard deviation, and percentile. The following VariancePopulation/VarianceSample/Variance queries are equivalent to Excel VAR.P/VAR.S/VAR functions:

public static double VariancePopulation<TSource, TKey\>( // Excel VAR.P function.

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible
```
```csharp
{
```
```csharp
double[] keys = source.Select(key => keySelector(key).ToDouble(formatProvider)).ToArray();
```
```csharp
double mean = keys.Average();
```
```csharp
return keys.Sum(key => (key - mean) * (key - mean)) / keys.Length;
```
```csharp
}
```

```csharp
public static double VarianceSample<TSource, TKey>( // Excel VAR.S function.
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible
```
```csharp
{
```
```csharp
double[] keys = source.Select(key => keySelector(key).ToDouble(formatProvider)).ToArray();
```
```csharp
double mean = keys.Average();
```
```csharp
return keys.Sum(key => (key - mean) * (key - mean)) / (keys.Length - 1);
```
```csharp
}
```

```csharp
public static double Variance<TSource, TKey>( // Excel VAR function.
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible =>
```

source.VarianceSample(keySelector, formatProvider);

And the following StandardDeviationPopulation/StabdardDeviationSample/StabdardDeviation queries implements Excel STDEV.P/STDEV.S/STDEV functions:

public static double StandardDeviationPopulation<TSource, TKey\>( // Excel STDEV.P function.

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible =>
```
```csharp
Math.Sqrt(source.VariancePopulation(keySelector, formatProvider));
```

```csharp
public static double StandardDeviationSample<TSource, TKey>( // Excel STDEV.S function.
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible =>
```
```csharp
Math.Sqrt(source.VarianceSample(keySelector, formatProvider));
```

```csharp
public static double StandardDeviation<TSource, TKey>( // Excel STDEV function.
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible =>
```

Math.Sqrt(source.Variance(keySelector, formatProvider));

And the following PercentileExclusive/PercentileInclusive/Percentile implement Excel PERCENTILE.EXC/PERCENTILE.INC/PERCENTILE functions:

public static double PercentileExclusive<TSource, TKey\>( // Excel PERCENTILE.EXC function.

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
double percentile,
```
```csharp
IComparer<TKey> comparer = null,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible
```
```csharp
{
```
```csharp
if (percentile < 0 || percentile > 1)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
```
```csharp
}
```

```csharp
comparer = comparer ?? Comparer<TKey>.Default;
```
```csharp
TKey[] orderedKeys = source.Select(keySelector).OrderBy(key => key, comparer).ToArray();
```
```csharp
int length = orderedKeys.Length;
```
```csharp
if (percentile < (double)1 / length || percentile > 1 - (double)1 / (length + 1))
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(
```
```csharp
nameof(percentile),
```
```csharp
$"{nameof(percentile)} must be in the range between (1 / source.Count()) and (1 - 1 / source.Count()).");
```
```csharp
}
```

```csharp
double index = percentile * (length + 1) - 1;
```
```csharp
int integerComponentOfIndex = (int)index;
```
```csharp
double decimalComponentOfIndex = index - integerComponentOfIndex;
```
```csharp
double keyAtIndex = orderedKeys[integerComponentOfIndex].ToDouble(formatProvider);
```

```csharp
double keyAtNextIndex = orderedKeys[integerComponentOfIndex + 1].ToDouble(formatProvider);
```
```csharp
return keyAtIndex + (keyAtNextIndex - keyAtIndex) * decimalComponentOfIndex;
```
```csharp
}
```

```csharp
public static double PercentileInclusive<TSource, TKey>( // Excel PERCENTILE.INC function.
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
double percentile,
```
```csharp
IComparer<TKey> comparer = null,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible
```
```csharp
{
```
```csharp
if (percentile < 0 || percentile > 1)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
```
```csharp
}
```

```csharp
comparer = comparer ?? Comparer<TKey>.Default;
```
```csharp
TKey[] orderedKeys = source.Select(keySelector).OrderBy(key => key, comparer).ToArray();
```
```csharp
int length = orderedKeys.Length;
```

```csharp
double index = percentile * (length - 1);
```
```csharp
int integerComponentOfIndex = (int)index;
```
```csharp
double decimalComponentOfIndex = index - integerComponentOfIndex;
```
```csharp
double keyAtIndex = orderedKeys[integerComponentOfIndex].ToDouble(formatProvider);
```

```csharp
if (integerComponentOfIndex >= length - 1)
```
```csharp
{
```
```csharp
return keyAtIndex;
```
```csharp
}
```

```csharp
double keyAtNextIndex = orderedKeys[integerComponentOfIndex + 1].ToDouble(formatProvider);
```
```csharp
return keyAtIndex + (keyAtNextIndex - keyAtIndex) * decimalComponentOfIndex;
```
```csharp
}
```

```csharp
public static double Percentile<TSource, TKey>( // Excel PERCENTILE function.
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
double percentile,
```
```csharp
IComparer<TKey> comparer = null,
```
```csharp
IFormatProvider formatProvider = null)
```
```csharp
where TKey : IConvertible
```
```csharp
{
```
```csharp
if (percentile < 0 || percentile > 1)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
```
```csharp
}
```

```csharp
return PercentileInclusive(source, keySelector, percentile, comparer, formatProvider);
```

}

### Quantifiers

string has a very useful IsNullOrEmpty method, and here is the LINQ version:

public static bool IsNullOrEmpty<TSource\>(this IEnumerable<TSource\> source) =>

source == null || !source.Any();

Contains compares the objects to determine the existance, so it can accept IEqualityComparer<T> parameter. It can be overloaded with functions for convenience:

public static bool Contains<TSource\>(

```csharp
this IEnumerable<TSource>source,
```
```csharp
TSource value,
```
```csharp
Func<TSource, TSource, bool> equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```

source.Contains(value, ToEqualityComparer(equals, getHashCode));

### Equality

SequentialEqual compares the objects as well, so it also accepts IEqualityComparer<T>. It can be overloaded with functions:

public static bool SequenceEqual<TSource\>(

```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
Func<TSource, TSource, bool>equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```

first.SequenceEqual(second, ToEqualityComparer(equals, getHashCode));

### List

IndexOf is similar to List<T>.IndexOf. It finds the index of first occurrence of the specified value. –1 is returned if the specified value is not found:

public static int IndexOf<TSource\>(

```csharp
this IEnumerable<TSource>source,
```
```csharp
TSource value,
```
```csharp
IEqualityComparer<TSource> comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```csharp
int index = 0;
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
if (comparer.Equals(sourceValue, value))
```
```csharp
{
```
```csharp
return index;
```
```csharp
}
```
```csharp
index = checked(index + 1);
```
```csharp
}
```
```csharp
return -1;
```

}

LastIndexOf is similar to List<T>.LastIndexOf. It finds the index of last occurrence of the specified value:

public static int LastIndexOf<TSource\>(

```csharp
this IEnumerable<TSource>source,
```
```csharp
TSource value,
```
```csharp
IEqualityComparer<TSource> comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```csharp
int lastIndex = -1;
```
```csharp
int index = 0;
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
if (comparer.Equals(sourceValue, value))
```
```csharp
{
```
```csharp
lastIndex = index;
```
```csharp
}
```
```csharp
index = checked(index + 1);
```
```csharp
}
```
```csharp
return lastIndex;
```

}

Again, here are the functional overloads of IndexOf and LastIndexOf:

public static int IndexOf<TSource>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
TSource value,
```
```csharp
Func<TSource, TSource, bool> equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```
```csharp
source.IndexOf(value, ToEqualityComparer(equals, getHashCode));
```

```csharp
public static int LastIndexOf<TSource>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
TSource value,
```
```csharp
Func<TSource, TSource, bool> equals,
```
```csharp
Func<TSource, int> getHashCode = null) =>
```

source.LastIndexOf(value, ToEqualityComparer(equals, getHashCode));

## Void queries

### Iteration

EnumerableEx.ForEach from Ix is very handy. It can fluently execute the query and process the results. It works like foreach statement, but it does not support breaking the iterations like the break statement in foreach statement. So here is an improved EnumerableX.ForEach, with a slightly different callback function:

public static void ForEach<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool> onNext)
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
if (!onNext(value))
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
}
```

}

The callback function is of type TSource -> bool. When its output is true, the iteration continues; when its output is false, ForEach stops execution. And the indexed overload is:

public static void ForEach<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, int, bool> onNext)
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
if (!onNext(value, index))
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
index = checked(index + 1);
```
```csharp
}
```

}

The last overload does not accept the callback function. It just iterates the source sequence:

public static void ForEach(this IEnumerable source)

```csharp
{
```
```csharp
IEnumerator iterator = source.GetEnumerator();
```
```csharp
try
```
```csharp
{
```
```csharp
while (iterator.MoveNext()) { }
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

It can be used to just execute a LINQ query and ignore all query results.

## Summary

This chapter demonstrates how to implement custom LINQ to Objects queries, including generation queries, list-API-like queries, aggregation queries to compute variance, standard deviation, and percentile, and also functional overloads for the standard ordering, grouping, join, set, conversion, quantifier, and equality queries that compares objects, and many more.