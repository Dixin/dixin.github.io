---
title: "LINQ to Objects in Depth (7) Building Custom Query Methods"
published: 2019-07-07
description: "With the understanding of standard queries in .NET Standard and the additional queries provided by Microsoft, it is easy to define custom LINQ queries for objects. This chapter demonstrates how to def"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: ".NET"
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
```
Func<TResult>valueFactory, int? count = null)
```
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
IEnumerable<TResult>CreateGenerator()
```
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
yield return valueFactory(); // Deferred execution.
```
```
}
```
```
}
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
yield return valueFactory(); // Deferred execution.
```
```
}
```
```
}
```
```
return CreateGenerator();
```

}

When count is not provided, an infinite sequence is generated. For example, the following Guid query uses Create to repeatedly call Guid.NewGuid, so that it generates a sequence of new GUIDs:

public static IEnumerable<Guid\> NewGuid(int? count) => Create(Guid.NewGuid, count);

The following queries generate a sequence of random numbers:

public static IEnumerable<int> RandomInt32(
```
int min, int max, int? count = null, int? seed = null) =>
```
```
EnumerableEx.Defer(() =>
```
```
{
```
```
Random random = new Random(seed ?? Environment.TickCount);
```
```
return Create(() => random.Next(min, max), count);
```
```
});
```
```
public static IEnumerable<double> RandomDouble(int? count = null, int ? seed = null) =>
```
```
EnumerableEx.Defer(() =>
```
```
{
```
```
Random random = new Random(seed ?? Environment.TickCount);
```
```
return Create(random.NextDouble, count);
```

});

Here Defer is called to defer the instantiation of Random.

The following EmptyIfNull can be used to omit null checks:

public static IEnumerable<TSource\> EmptyIfNull<TSource\>(this IEnumerable<TSource\> source) =>

source ?? Enumerable.Empty<TSource\>();

For example:

internal static void EmptyIfNull(IEnumerable<int\> source1, IEnumerable<int\> source2)
```
{
```
```
IEnumerable<int>positive = source1.EmptyIfNull()
```
```
.Union(source2.EmptyIfNull())
```
```
.Where(int32 => int32 > 0);
```

}

### Concatenation

string has a useful method Join:

namespace System
```
{
```
```csharp
public class String
```
```
{
```
```
public static string Join(string separator, IEnumerable<string> values);
```
```
}
```

}

It concatenates the string values with a single separator between each 2 adjacent string values. Similarly, a general ConcatJoin query can be defined as:

public static IEnumerable<TSource\> ConcatJoin<TSource\>(
```
this IEnumerable<TSource> source, TSource separator)
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
if (iterator.MoveNext())
```
```
{
```
```
yield return iterator.Current; // Deferred execution.
```
```
while (iterator.MoveNext())
```
```
{
```
```
yield return separator; // Deferred execution.
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
```
}
```

}

The built-in Append/Prepend can append/prepend 1 value to the source sequence. So the following overloads can be defined to support multiple values:

public static IEnumerable<TSource> Append<TSource>(
```
this IEnumerable<TSource> source, params TSource[] values) =>
```
```
source.Concat(values);
```
```
public static IEnumerable<TSource> Prepend<TSource>(
```
```
this IEnumerable<TSource> source, params TSource[] values) =>
```

values.Concat(source);

The following AppendTo/PrependTo extension method are defined for single value, which canto make code more fluent:

public static IEnumerable<TSource> AppendTo<TSource>(
```
this TSource value, IEnumerable<TSource> source) =>
```
```
source.Append(value);
```
```
public static IEnumerable<TSource> PrependTo<TSource>(
```
```
this TSource value, IEnumerable<TSource> source) =>
```

source.Prepend(value);

### Partitioning

Similar to string.Substring, a general Subsequence query can be defined as:

public static IEnumerable<TSource\> Subsequence<TSource\>(
```
this IEnumerable<TSource> source, int startIndex, int count) =>
```

source.Skip(startIndex).Take(count);

The following Pagination query is useful to paginate a sequence of values:

public static IEnumerable<TSource> Pagination<TSource>(
```
this IEnumerable<TSource> source, int pageIndex, int countPerPage) =>
```

source.Skip(pageIndex \* countPerPage).Take(countPerPage);

### Ordering

In LINQ to Objects, the ordering queries must compare objects to determine their order, so they all have overload to accept IComparer<T> parameter. This interface can be viewed as a wrapper of a simple comparison functions:

namespace System.Collections.Generic
```
{
```
```
public interface IComparer<in T>
```
```
{
```
```
int Compare(T x, T y);
```
```
}
```
```
public interface IEqualityComparer<in T>
```
```
{
```
```
bool Equals(T x, T y);
```
```
int GetHashCode(T obj);
```
```
}
```

}

In C#, interfaces are less convenient then functions. C# supports lambda expression to define anonymous functions inline, but does not support anonymous class to enable inline interface. For the LINQ queries accepting interface parameter, they are easier to be called if they can accept function parameter instead. To Implement this, the following ToComparer function can be defined to convert a compare functions to an IComparer<T\> interface:

private static IComparer<T\> ToComparer<T\>(Func<T, T, int\> compare) =>

Comparer<T\>.Create(new Comparison<T\>(compare));

It simply calls a .NET Standard built-in API Comparer<T>.Create for the IComparer<T\> instantiation. Now the ordering queries’ overloads can be defined as a higher-order functions to accept a (T, T) –> int function instead of IComparer<T> interface:

public static IOrderedEnumerable<TSource\> OrderBy<TSource, TKey\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TKey, TKey, int>compare) =>
```
```
source.OrderBy(keySelector, ToComparer(compare));
```
```
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TKey, TKey, int>compare) =>
```
```
source.OrderByDescending(keySelector, ToComparer(compare));
```
```
public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
```
```
this IOrderedEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TKey, TKey, int>compare) =>
```
```
source.ThenBy(keySelector, ToComparer(compare));
```
```
public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```
```
this IOrderedEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TKey, TKey, int>compare) =>
```

source.ThenByDescending(keySelector, ToComparer(compare));

### Grouping, join, and set

In LINQ to Objects, there are also queries need to compare objects’ equality to determine the grouping, join, and set operation, so they all have overload to accept IEqualityComparer<T> parameter. .NET Standard does not provide a built-in API for IEqualityComparer<T> instantiation from functions (F# core library provides a Microsoft.FSharp.Collections.HashIdentity type to wrap functions for IEqualityComparer<T>, but it is not easy to use in C#). So first, a EqualityComparerWrapper<T> type can be defined to implement IEqualityComparer<T>, then a higher-order function ToEqualityComparer can be defined to convert a equals functions and a getHashCode function to an IEqualityComparer<T\> interface:

internal class EqualityComparerWrapper<T\> : IEqualityComparer<T\>
```
{
```
```csharp
private readonly Func<T, T, bool> equals;
```

```csharp
private readonly Func<T, int> getHashCode;
```
```
public EqualityComparerWrapper(Func<T, T, bool> equals, Func<T, int> getHashCode = null) =>
```
```
(this.equals, this.getHashCode) = (@equals, getHashCode ?? (value => value.GetHashCode()));
```
```
public bool Equals(T x, T y) => this.equals(x, y);
```
```
public int GetHashCode(T obj) => this.getHashCode(obj);
```
```
}
```

```csharp
private static IEqualityComparer<T> ToEqualityComparer<T>(
```
```
Func<T, T, bool> equals, Func<T, int> getHashCode = null) =>
```

new EqualityComparerWrapper<T>(equals, getHashCode);

The getHashCode function is optional, because any type already inherits a GetHashCode method from object. Similar to ordering queries, the following functional overloads can be defined for GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except:

public static IEnumerable<TResult\> GroupBy<TSource, TKey, TElement, TResult\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TSource, TElement> elementSelector,
```
```
Func<TKey, IEnumerable<TElement>, TResult> resultSelector,
```
```
Func<TKey, TKey, bool>equals,
```
```
Func<TKey, int> getHashCode = null) =>
```
```
source.GroupBy(keySelector, elementSelector, resultSelector, ToEqualityComparer(equals, getHashCode));
```
```
public static IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
```
```
this IEnumerable<TOuter> outer,
```
```
IEnumerable<TInner>inner,
```
```
Func<TOuter, TKey> outerKeySelector,
```
```
Func<TInner, TKey> innerKeySelector,
```
```
Func<TOuter, TInner, TResult>resultSelector,
```
```
Func<TKey, TKey, bool>equals,
```
```
Func<TKey, int> getHashCode = null) =>
```
```
outer.Join(
```
```
inner,
```
```
outerKeySelector,
```
```
innerKeySelector,
```
```
resultSelector,
```
```
ToEqualityComparer(equals, getHashCode));
```
```
public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
```
```
this IEnumerable<TOuter> outer,
```
```
IEnumerable<TInner>inner,
```
```
Func<TOuter, TKey> outerKeySelector,
```
```
Func<TInner, TKey> innerKeySelector,
```
```
Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
```
```
Func<TKey, TKey, bool>equals,
```
```
Func<TKey, int> getHashCode = null) =>
```
```
outer.GroupJoin(
```
```
inner,
```
```
outerKeySelector,
```
```
innerKeySelector,
```
```
resultSelector,
```
```
ToEqualityComparer(equals, getHashCode));
```
```
public static IEnumerable<TSource> Distinct<TSource>(
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TSource, bool>equals,
```
```
Func<TSource, int> getHashCode = null) =>
```
```
source.Distinct(ToEqualityComparer(equals, getHashCode));
```
```
public static IEnumerable<TSource> Union<TSource>(
```
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
Func<TSource, TSource, bool>equals,
```
```
Func<TSource, int> getHashCode = null) =>
```
```
first.Union(second, ToEqualityComparer(equals, getHashCode));
```
```
public static IEnumerable<TSource> Intersect<TSource>(
```
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
Func<TSource, TSource, bool>equals,
```
```
Func<TSource, int> getHashCode = null) =>
```
```
first.Intersect(second, ToEqualityComparer(equals, getHashCode));
```
```
public static IEnumerable<TSource> Except<TSource>(
```
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
Func<TSource, TSource, bool>equals,
```
```
Func<TSource, int> getHashCode = null) =>
```

first.Except(second, ToEqualityComparer(equals, getHashCode));

### List

The List<T> type provides handy methods, which can be implemented for sequence too. The following Insert query is similar to List<T>.Insert, it outputs a new sequence with the specified value is inserted at the specified index:

public static IEnumerable<TSource\> Insert<TSource\>(
```
this IEnumerable<TSource> source, int index, TSource value)
```
```
{
```
```
if (index< 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(index));
```
```
}
```
```
IEnumerable<TSource> InsertGenerator()
```
```
{
```
```
int currentIndex = 0;
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
if (currentIndex == index)
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
yield return sourceValue; // Deferred execution.
```
```
currentIndex = checked(currentIndex + 1);
```
```
}
```
```
if (index == currentIndex)
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
else if (index> currentIndex)
```
```
{
```
```
throw new ArgumentOutOfRangeException(
```
```
nameof(index),
```
```
$"{nameof(index)} must be within the bounds of {nameof(source)}.");
```
```
}
```
```
}
```
```
return InsertGenerator();
```

}

The above Insert query is more functional than List<T>.Insert. List<T>.Insert has no output, so it is not fluent and it implements immediate execution. It is also impure by mutating the list in place. The above Insert query follows the iterator pattern, and uses yield statement to implement deferred execution. It outputs a new sequence, so it is fluent, and it is a pure function since it does not mutate the source sequence.

RemoveAt outputs a new sequence with a value removed at the specified index:

public static IEnumerable<TSource\> RemoveAt<TSource\>(
```
this IEnumerable<TSource> source, int index)
```
```
{
```
```
if (index< 0)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(index));
```
```
}
```
```
IEnumerable<TSource> RemoveAtGenerator()
```
```
{
```
```
int currentIndex = 0;
```
```
foreach (TSource value in source)
```
```
{
```
```
if (currentIndex != index)
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
currentIndex = checked(currentIndex + 1);
```
```
}
```
```
if (index> = currentIndex)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(index));
```
```
}
```
```
}
```
```
return RemoveAtGenerator();
```

}

Remove outputs a new sequence with the first occurrence of the specified value removed. Besides being deferred and lazy, it also accepts an optional equality comparer:

public static IEnumerable<TSource\> Remove<TSource\>(
```
this IEnumerable<TSource>source,
```
```
TSource value,
```
```
IEqualityComparer<TSource> comparer = null)
```
```
{
```
```
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```
bool isRemoved = false;
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
if (!isRemoved&& comparer.Equals(sourceValue, value))
```
```
{
```
```
isRemoved = true;
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
yield return sourceValue; // Deferred execution.
```
```
}
```
```
}
```

}

RemoveAll outputs a new sequence with all occurrences of the specified value removed:

public static IEnumerable<TSource\> RemoveAll<TSource\>(
```
this IEnumerable<TSource>source,
```
```
TSource value,
```
```
IEqualityComparer<TSource> comparer = null)
```
```
{
```
```
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
if (!comparer.Equals(sourceValue, value))
```
```
{
```
```
yield return sourceValue; // Deferred execution.
```
```
}
```
```
}
```

}

Since Remove and RemoveAll tests the equality of objects to determine which objects to remove, the following higher-order function overloads can be defined for convenience:

public static IEnumerable<TSource> Remove<TSource>(
```
this IEnumerable<TSource> source,
```
```
TSource value,
```
```
Func<TSource, TSource, bool> equals,
```
```
Func<TSource, int> getHashCode = null) =>
```
```
source.Remove(value, ToEqualityComparer(@equals, getHashCode));
```
```
public static IEnumerable<TSource> RemoveAll<TSource>(
```
```
this IEnumerable<TSource> source,
```
```
TSource value,
```
```
Func<TSource, TSource, bool> equals,
```
```
Func<TSource, int> getHashCode = null) =>
```

source.RemoveAll(value, ToEqualityComparer(@equals, getHashCode));

## Collection queries

### Conversion

ToDictionary and ToLookup accept IEqualityComparer<T> parameter to test the equality of keys. Their functional overloads can be defined:

public static Dictionary<TKey, TElement\> ToDictionary<TSource, TKey, TElement\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TSource, TElement> elementSelector,
```
```
Func<TKey, TKey, bool>equals,
```
```
Func<TKey, int> getHashCode = null) =>
```
```
source.ToDictionary(keySelector, elementSelector, ToEqualityComparer(equals, getHashCode));
```
```
public static ILookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TSource, TElement> elementSelector,
```
```
Func<TKey, TKey, bool>equals,
```
```
Func<TKey, int> getHashCode = null) =>
```

source.ToLookup(keySelector, elementSelector, ToEqualityComparer(equals, getHashCode));

## Value queries

### Aggregation

.NET provides basic aggregation queries, including Sum/Average/Max/Min queries. In reality, it is also common to calculate the variance, standard deviation, and percentile. The following VariancePopulation/VarianceSample/Variance queries are equivalent to Excel VAR.P/VAR.S/VAR functions:

public static double VariancePopulation<TSource, TKey\>( // Excel VAR.P function.
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible
```
```
{
```
```
double[] keys = source.Select(key => keySelector(key).ToDouble(formatProvider)).ToArray();
```
```
double mean = keys.Average();
```
```
return keys.Sum(key => (key - mean) * (key - mean)) / keys.Length;
```
```
}
```
```
public static double VarianceSample<TSource, TKey>( // Excel VAR.S function.
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible
```
```
{
```
```
double[] keys = source.Select(key => keySelector(key).ToDouble(formatProvider)).ToArray();
```
```
double mean = keys.Average();
```
```
return keys.Sum(key => (key - mean) * (key - mean)) / (keys.Length - 1);
```
```
}
```
```
public static double Variance<TSource, TKey>( // Excel VAR function.
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible =>
```

source.VarianceSample(keySelector, formatProvider);

And the following StandardDeviationPopulation/StabdardDeviationSample/StabdardDeviation queries implements Excel STDEV.P/STDEV.S/STDEV functions:

public static double StandardDeviationPopulation<TSource, TKey\>( // Excel STDEV.P function.
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible =>
```
```
Math.Sqrt(source.VariancePopulation(keySelector, formatProvider));
```
```
public static double StandardDeviationSample<TSource, TKey>( // Excel STDEV.S function.
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible =>
```
```
Math.Sqrt(source.VarianceSample(keySelector, formatProvider));
```
```
public static double StandardDeviation<TSource, TKey>( // Excel STDEV function.
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible =>
```

Math.Sqrt(source.Variance(keySelector, formatProvider));

And the following PercentileExclusive/PercentileInclusive/Percentile implement Excel PERCENTILE.EXC/PERCENTILE.INC/PERCENTILE functions:

public static double PercentileExclusive<TSource, TKey\>( // Excel PERCENTILE.EXC function.
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
double percentile,
```
```
IComparer<TKey> comparer = null,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible
```
```
{
```
```
if (percentile < 0 || percentile > 1)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
```
```
}
```
```
comparer = comparer ?? Comparer<TKey>.Default;
```
```
TKey[] orderedKeys = source.Select(keySelector).OrderBy(key => key, comparer).ToArray();
```
```
int length = orderedKeys.Length;
```
```
if (percentile < (double)1 / length || percentile > 1 - (double)1 / (length + 1))
```
```
{
```
```
throw new ArgumentOutOfRangeException(
```
```
nameof(percentile),
```
```
$"{nameof(percentile)} must be in the range between (1 / source.Count()) and (1 - 1 / source.Count()).");
```
```
}
```
```
double index = percentile * (length + 1) - 1;
```
```
int integerComponentOfIndex = (int)index;
```
```
double decimalComponentOfIndex = index - integerComponentOfIndex;
```
```
double keyAtIndex = orderedKeys[integerComponentOfIndex].ToDouble(formatProvider);
```
```
double keyAtNextIndex = orderedKeys[integerComponentOfIndex + 1].ToDouble(formatProvider);
```
```
return keyAtIndex + (keyAtNextIndex - keyAtIndex) * decimalComponentOfIndex;
```
```
}
```
```
public static double PercentileInclusive<TSource, TKey>( // Excel PERCENTILE.INC function.
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
double percentile,
```
```
IComparer<TKey> comparer = null,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible
```
```
{
```
```
if (percentile < 0 || percentile > 1)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
```
```
}
```
```
comparer = comparer ?? Comparer<TKey>.Default;
```
```
TKey[] orderedKeys = source.Select(keySelector).OrderBy(key => key, comparer).ToArray();
```
```
int length = orderedKeys.Length;
```
```
double index = percentile * (length - 1);
```
```
int integerComponentOfIndex = (int)index;
```
```
double decimalComponentOfIndex = index - integerComponentOfIndex;
```
```
double keyAtIndex = orderedKeys[integerComponentOfIndex].ToDouble(formatProvider);
```
```
if (integerComponentOfIndex >= length - 1)
```
```
{
```
```
return keyAtIndex;
```
```
}
```
```
double keyAtNextIndex = orderedKeys[integerComponentOfIndex + 1].ToDouble(formatProvider);
```
```
return keyAtIndex + (keyAtNextIndex - keyAtIndex) * decimalComponentOfIndex;
```
```
}
```
```
public static double Percentile<TSource, TKey>( // Excel PERCENTILE function.
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
double percentile,
```
```
IComparer<TKey> comparer = null,
```
```
IFormatProvider formatProvider = null)
```
```
where TKey : IConvertible
```
```
{
```
```
if (percentile < 0 || percentile > 1)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
```
```
}
```
```
return PercentileInclusive(source, keySelector, percentile, comparer, formatProvider);
```

}

### Quantifiers

string has a very useful IsNullOrEmpty method, and here is the LINQ version:

public static bool IsNullOrEmpty<TSource\>(this IEnumerable<TSource\> source) =>

source == null || !source.Any();

Contains compares the objects to determine the existance, so it can accept IEqualityComparer<T> parameter. It can be overloaded with functions for convenience:

public static bool Contains<TSource\>(
```
this IEnumerable<TSource>source,
```
```
TSource value,
```
```
Func<TSource, TSource, bool> equals,
```
```
Func<TSource, int> getHashCode = null) =>
```

source.Contains(value, ToEqualityComparer(equals, getHashCode));

### Equality

SequentialEqual compares the objects as well, so it also accepts IEqualityComparer<T>. It can be overloaded with functions:

public static bool SequenceEqual<TSource\>(
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
Func<TSource, TSource, bool>equals,
```
```
Func<TSource, int> getHashCode = null) =>
```

first.SequenceEqual(second, ToEqualityComparer(equals, getHashCode));

### List

IndexOf is similar to List<T>.IndexOf. It finds the index of first occurrence of the specified value. –1 is returned if the specified value is not found:

public static int IndexOf<TSource\>(
```
this IEnumerable<TSource>source,
```
```
TSource value,
```
```
IEqualityComparer<TSource> comparer = null)
```
```
{
```
```
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```
int index = 0;
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
if (comparer.Equals(sourceValue, value))
```
```
{
```
```
return index;
```
```
}
```
```
index = checked(index + 1);
```
```
}
```
```
return -1;
```

}

LastIndexOf is similar to List<T>.LastIndexOf. It finds the index of last occurrence of the specified value:

public static int LastIndexOf<TSource\>(
```
this IEnumerable<TSource>source,
```
```
TSource value,
```
```
IEqualityComparer<TSource> comparer = null)
```
```
{
```
```
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```
int lastIndex = -1;
```
```
int index = 0;
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
if (comparer.Equals(sourceValue, value))
```
```
{
```
```
lastIndex = index;
```
```
}
```
```
index = checked(index + 1);
```
```
}
```
```
return lastIndex;
```

}

Again, here are the functional overloads of IndexOf and LastIndexOf:

public static int IndexOf<TSource>(
```
this IEnumerable<TSource> source,
```
```
TSource value,
```
```
Func<TSource, TSource, bool> equals,
```
```
Func<TSource, int> getHashCode = null) =>
```
```
source.IndexOf(value, ToEqualityComparer(equals, getHashCode));
```
```
public static int LastIndexOf<TSource>(
```
```
this IEnumerable<TSource> source,
```
```
TSource value,
```
```
Func<TSource, TSource, bool> equals,
```
```
Func<TSource, int> getHashCode = null) =>
```

source.LastIndexOf(value, ToEqualityComparer(equals, getHashCode));

## Void queries

### Iteration

EnumerableEx.ForEach from Ix is very handy. It can fluently execute the query and process the results. It works like foreach statement, but it does not support breaking the iterations like the break statement in foreach statement. So here is an improved EnumerableX.ForEach, with a slightly different callback function:

public static void ForEach<TSource\>(
```
this IEnumerable<TSource> source, Func<TSource, bool> onNext)
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
if (!onNext(value))
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
}
```

}

The callback function is of type TSource -> bool. When its output is true, the iteration continues; when its output is false, ForEach stops execution. And the indexed overload is:

public static void ForEach<TSource\>(
```
this IEnumerable<TSource> source, Func<TSource, int, bool> onNext)
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
if (!onNext(value, index))
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
index = checked(index + 1);
```
```
}
```

}

The last overload does not accept the callback function. It just iterates the source sequence:

public static void ForEach(this IEnumerable source)
```
{
```
```
IEnumerator iterator = source.GetEnumerator();
```
```
try
```
```
{
```
```
while (iterator.MoveNext()) { }
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
(iterator as IDisposable)?.Dispose();
```
```
}
```

}

It can be used to just execute a LINQ query and ignore all query results.

## Summary

This chapter demonstrates how to implement custom LINQ to Objects queries, including generation queries, list-API-like queries, aggregation queries to compute variance, standard deviation, and percentile, and also functional overloads for the standard ordering, grouping, join, set, conversion, quantifier, and equality queries that compares objects, and many more.