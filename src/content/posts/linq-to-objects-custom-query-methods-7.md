---
title: "LINQ to Objects in Depth (7) Custom Query Methods"
published: 2018-07-20
description: "After discussing the query methods provided by .NET, this part demonstrates how to define custom query methods:"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-objects-custom-query-methods](/posts/linq-to-objects-custom-query-methods "https://weblogs.asp.net/dixin/linq-to-objects-custom-query-methods")**

After discussing the query methods provided by .NET, this part demonstrates how to define custom query methods:

-   Sequence queries: return a new IEnumerable<T> sequence (deferred execution)
    -   Generation: Create, Guid, RandomInt32, RandomDouble, FromValue, FromValues, EmptyIfNull
    -   Concatenation: Join
    -   Partitioning: Subsequence
    -   Comparison: OrderBy\*, OrderByDescending\*, ThenBy\*, ThenByDescending\*, GroupBy\*, Join\*, GroupJoin\*, Distinct, Union, Intersect\*, Except\*
    -   List: Insert, Remove, RemoveAll, RemoveAt
-   Collection queries: return a new collection (immediate execution)
    -   Comparison: ToDictionary, ToLookup
-   Value queries: return a single value (immediate execution)
    -   List: IndexOf, LastIndexOf
    -   Aggregation: PercentileExclusive, PercentileInclusive, Percentile
    -   Quantifiers: IsNullOrEmpty, IsNotNullOrEmpty
    -   Comparison: Contains, SequenceEqual
-   Void queries: return void (immediate execution)
    -   Iteration: ForEach

The sequence queries all implement deferred execution, where the sequence queries marked with \* implements eager evaluation, and other unmarked sequence queries implements lazy evaluation. The collection queries, value queries, and void queries all implements immediate execution.

These query methods can be defined in the following static class:
```
public static partial class EnumerableX { }
```

## Returns a new IEnumerable<T> sequence

### Generation

The previous part discussed the Defer query method a sequence factory, and the Create query method accepting a iterator factory. The following Create method is defined to generate a sequence of values by repeatedly calling a value factory:
```
public static IEnumerable<TResult> Create<TResult>(Func<TResult> valueFactory, int? count = null)
{
    if (count < 0)
    {
        throw new ArgumentOutOfRangeException(nameof(count));
    }

    IEnumerable<TResult> CreateGenerator()
    {
        if (count == null)
        {
            while (true)
            {
                yield return valueFactory(); // Deferred execution.
            }
        }
        for (int index = 0; index < count; index++)
        {
            yield return valueFactory(); // Deferred execution.
        }
    }
    return CreateGenerator();
}
```

When count is not provided, an infinite sequence is generated. For example, the following Guid query method calls Create repeatedly with Guid.NewGuid to generate a sequence of new GUIDs:
```
public static IEnumerable<Guid> NewGuid(int? count) => Create(Guid.NewGuid, count);
```

The following methods generate a sequence of random numbers:
```
public static IEnumerable<int> RandomInt32(
    int min = int.MinValue, int max = int.MaxValue, int? seed = null, int? count = null) =>
        EnumerableEx.Defer(() =>
        {
            Random random = new Random(seed ?? Environment.TickCount);
            return Create(() => random.Next(min, max), count);
        });

public static IEnumerable<double> RandomDouble(int? seed = null, int? count = null) =>
    EnumerableEx.Defer(() => Create(new Random(seed ?? Environment.TickCount).NextDouble, count));
```

Here Defer is called to defer the instantiation of Random.

The following EmptyIfNull can be used to replace null check and null coalescing:
```
public static IEnumerable<TSource> EmptyIfNull<TSource>(this IEnumerable<TSource> source) =>
    source ?? Enumerable.Empty<TSource>();
```

For example:
```
internal static void EmptyIfNull(IEnumerable<int> source1, IEnumerable<int> source2)
{
    IEnumerable<int> positive = source1.EmptyIfNull()
        .Union(source2.EmptyIfNull())
        .Where(int32 => int32 > 0);
}
```

### Concatenation

string has a useful method Join:

```csharp
namespace System
{
    using System.Collections.Generic;

    public class String
    {
        public static string Join(string separator, IEnumerable<string> values);
    }
}
```

It concatenates the values with a single separator between each 2 adjacent string values. A general Join query method can be defined as:
```
public static IEnumerable<TSource> Join<TSource>(this IEnumerable<TSource> source, TSource separator)
{
    using (IEnumerator<TSource> iterator = source.GetEnumerator())
    {
        if (iterator.MoveNext())
        {
            yield return iterator.Current; // Deferred execution.
            while (iterator.MoveNext())
            {
                yield return separator; // Deferred execution.
                yield return iterator.Current; // Deferred execution.
            }
        }
    }
}
```

The following overload accepting a sequence of multiple separators:
```
public static IEnumerable<TSource> Join<TSource>(
    this IEnumerable<TSource> source, IEnumerable<TSource> separators)
{
    using (IEnumerator<TSource> iterator = source.GetEnumerator())
    {
        if (iterator.MoveNext())
        {
            yield return iterator.Current; // Deferred execution.
            while (iterator.MoveNext())
            {
                foreach (TSource separator in separators)
                {
                    yield return separator; // Deferred execution.
                }
                yield return iterator.Current; // Deferred execution.
            }
        }
    }
}
```

### Partitioning

Similar to string.Substring, a general Subsequence method can be defined as:
```
public static IEnumerable<TSource> Subsequence<TSource>(
    this IEnumerable<TSource> source, int startIndex, int count) => 
        source.Skip(startIndex).Take(count);
```

### Comparison

The IComparer<T> and IEqualityComparer<T> interfaces are involved a lot in LINQ query methods:

```csharp
namespace System.Collections.Generic
{
    public interface IComparer<in T>
    {
        int Compare(T x, T y);
    }

    public interface IEqualityComparer<in T>
    {
        bool Equals(T x, T y);

        int GetHashCode(T obj);
    }
}
```

They are wrappers of simple functions. However, in C#, interfaces are less convenient then functions. C# supports lambda expression define anonymous functions inline, but does not support [anonymous class](https://en.wikipedia.org/wiki/Closure_\(computer_programming\)#Local_classes_and_Lambda_functions_.28Java.29) to enable inline interface. It could be convenient if query methods can accept functions instead of interfaces. To Iplement this, the following helper methods can be defined to convert functions to the above interfaces:

```csharp
private static IComparer<T> ToComparer<T>(Func<T, T, int> compare) =>
    Comparer<T>.Create(new Comparison<T>(compare));

private static IEqualityComparer<T> ToEqualityComparer<T>(
    Func<T, T, bool> equals, Func<T, int> getHashCode = null) =>
        new EqualityComparerWrapper<T>(equals, getHashCode);
```

.NET provides a built-in API Comparer<T>.Create to convert function to IComparer<T>, which can be directly used. F#’s core library provides a Microsoft.FSharp.Collections.HashIdentity type to wrap functions for IEqualityComparer<T>, but it is not easy to use in C#. So the EqualityComparerWrapper<T> wrapper can be defined:

```csharp
public class EqualityComparerWrapper<T> : IEqualityComparer<T>
{
    private readonly Func<T, T, bool> equals;

    private readonly Func<T, int> getHashCode;

    public EqualityComparerWrapper(Func<T, T, bool> equals, Func<T, int> getHashCode = null)
    {
        this.equals = equals;
        this.getHashCode = getHashCode ?? (value => value.GetHashCode());
    }

    public bool Equals(T x, T y) => this.equals(x, y);

    public int GetHashCode(T obj) => this.getHashCode(obj);
}
```

The getHashCode function is optional, because any type inherits a GetHashCode method from object. Take the ordering query methods as example, now overloads can be defined to accept a (T, T) –> int function instead of IComparer<T> interface:
```
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TKey, TKey, int> compare) =>
        source.OrderBy(keySelector, ToComparer(compare));

public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TKey, TKey, int> compare) =>
        source.OrderByDescending(keySelector, ToComparer(compare));

public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
    this IOrderedEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TKey, TKey, int> compare) =>
        source.ThenBy(keySelector, ToComparer(compare));

public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
    this IOrderedEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TKey, TKey, int> compare) =>
        source.ThenByDescending(keySelector, ToComparer(compare));
```

Similar overloads can be defined for GroupBy, Join, GroupJoin, Distinct, Union, Intersect, Except:
```
public static IEnumerable<TResult> GroupBy<TSource, TKey, TElement, TResult>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    Func<TKey, IEnumerable<TElement>, TResult> resultSelector,
    Func<TKey, TKey, bool> equals,
    Func<TKey, int> getHashCode = null) =>
        source.GroupBy(keySelector, elementSelector, resultSelector, ToEqualityComparer(equals, getHashCode));

public static IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, TInner, TResult> resultSelector,
    Func<TKey, TKey, bool> equals,
    Func<TKey, int> getHashCode = null) =>
        outer.Join(
            inner, 
            outerKeySelector, 
            innerKeySelector, 
            resultSelector, 
            ToEqualityComparer(equals, getHashCode));

public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
    Func<TKey, TKey, bool> equals,
    Func<TKey, int> getHashCode = null) =>
        outer.GroupJoin(
            inner,
            outerKeySelector,
            innerKeySelector,
            resultSelector,
            ToEqualityComparer(equals, getHashCode));

public static IEnumerable<TSource> Distinct<TSource>(
    this IEnumerable<TSource> source,
    Func<TSource, TSource, bool> equals,
    Func<TSource, int> getHashCode = null) =>
        source.Distinct(ToEqualityComparer(equals, getHashCode));

public static IEnumerable<TSource> Union<TSource>(
    this IEnumerable<TSource> first,
    IEnumerable<TSource> second,
    Func<TSource, TSource, bool> equals,
    Func<TSource, int> getHashCode = null) =>
        first.Union(second, ToEqualityComparer(equals, getHashCode));

public static IEnumerable<TSource> Intersect<TSource>(
    this IEnumerable<TSource> first,
    IEnumerable<TSource> second,
    Func<TSource, TSource, bool> equals,
    Func<TSource, int> getHashCode = null) =>
        first.Intersect(second, ToEqualityComparer(equals, getHashCode));

public static IEnumerable<TSource> Except<TSource>(
    this IEnumerable<TSource> first,
    IEnumerable<TSource> second,
    Func<TSource, TSource, bool> equals,
    Func<TSource, int> getHashCode = null) =>
        first.Except(second, ToEqualityComparer(equals, getHashCode));
```

### List

The List<T> type provides handy methods, which can be implemented for sequence too. The Insert query method return a new sequence with the specified value inserted at the specified index:
```
public static IEnumerable<TSource> Insert<TSource>(this IEnumerable<TSource> source, int index, TSource value)
{
    if (index < 0)
    {
        throw new ArgumentOutOfRangeException(nameof(index));
    }

    IEnumerable<TSource> InsertGenerator()
    {
        int currentIndex = 0;
        foreach (TSource sourceValue in source)
        {
            if (currentIndex == index)
            {
                yield return value; // Deferred execution.
            }
            yield return sourceValue; // Deferred execution.
            currentIndex = checked(currentIndex + 1);
        }
        if (index == currentIndex)
        {
            yield return value; // Deferred execution.
        }
        else if (index > currentIndex)
        {
            throw new ArgumentOutOfRangeException(
                nameof(index),
                $"{nameof(index)} must be within the bounds of {nameof(source)}.");
        }
    }
    return InsertGenerator();
}
```

There are some difference between the above Insert query method and List<T>.Insert. The above Insert is fluent by returning IEnumerable<T>, while List<T>.Insert returns void so is not fluent. The above Insert creates a new sequence with the specified value inserted, while List<T>.Insert directly changes the original list. The above Insert also implements deferred execution and lazy evaluation with generator, while List<T>.Insert executes immediately.

RemoveAt returns a new sequence with a value removed at the specified index:
```
public static IEnumerable<TSource> RemoveAt<TSource>(this IEnumerable<TSource> source, int index)
{
    if (index < 0)
    {
        throw new ArgumentOutOfRangeException(nameof(index));
    }

    IEnumerable<TSource> RemoveAtGenerator()
    {
        int currentIndex = 0;
        foreach (TSource value in source)
        {
            if (currentIndex != index)
            {
                yield return value; // Deferred execution.
            }
            currentIndex = checked(currentIndex + 1);
        }
        if (index >= currentIndex)
        {
            throw new ArgumentOutOfRangeException(nameof(index));
        }
    }
    return RemoveAtGenerator();
}
```

Remove returns a new sequence with the first occurrence of the specified value removed. Besides being deferred and lazy, it also accepts an optional equality comparer:
```
public static IEnumerable<TSource> Remove<TSource>(
    this IEnumerable<TSource> source,
    TSource value,
    IEqualityComparer<TSource> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TSource>.Default;
    bool isRemoved = false;
    foreach (TSource sourceValue in source)
    {
        if (!isRemoved && comparer.Equals(sourceValue, value))
        {
            isRemoved = true;
        }
        else
        {
            yield return sourceValue; // Deferred execution.
        }
    }
}
```

RemoveAll return a new sequence with all occurrences of the specified value removed:
```
public static IEnumerable<TSource> RemoveAll<TSource>(
    this IEnumerable<TSource> source,
    TSource value,
    IEqualityComparer<TSource> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TSource>.Default;
    foreach (TSource sourceValue in source)
    {
        if (!comparer.Equals(sourceValue, value))
        {
            yield return sourceValue; // Deferred execution.
        }
    }
}
```

## Collection queries

### Comparison

ToDictionary and ToLookup accept IEqualityComparer<T> too. Their overloads for functions can be defined:
```
public static Dictionary<TKey, TElement> ToDictionary<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    Func<TKey, TKey, bool> equals,
    Func<TKey, int> getHashCode = null) =>
        source.ToDictionary(keySelector, elementSelector, ToEqualityComparer(equals, getHashCode));

public static ILookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    Func<TKey, TKey, bool> equals,
    Func<TKey, int> getHashCode = null) =>
        source.ToLookup(keySelector, elementSelector, ToEqualityComparer(equals, getHashCode));
```

## Returns a single value

### List

IndexOf is similar to List<T>.IndexOf. It finds the index of first occurrence of the specified value. –1 is returned id the specified value is not found:
```
public static int IndexOf<TSource>(
    this IEnumerable<TSource> source,
    TSource value,
    int startIndex = 0,
    int? count = null,
    IEqualityComparer<TSource> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TSource>.Default;
    source = source.Skip(startIndex);
    if (count != null)
    {
        source = source.Take(count.Value);
    }
    int index = checked(0 + startIndex);
    foreach (TSource sourceValue in source)
    {
        if (comparer.Equals(sourceValue, value))
        {
            return index;
        }
        index = checked(index + 1);
    }
    return -1;
}
```

LastIndexOf finds the index of last occurrence of the specified value:
```
public static int LastIndexOf<TSource>(
    this IEnumerable<TSource> source,
    TSource value,
    int startIndex = 0,
    int? count = null,
    IEqualityComparer<TSource> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TSource>.Default;
    source = source.Skip(startIndex);
    if (count != null)
    {
        source = source.Take(count.Value);
    }
    int lastIndex = -1;
    int index = checked(0 + startIndex);
    foreach (TSource sourceValue in source)
    {
        if (comparer.Equals(sourceValue, value))
        {
            lastIndex = index;
        }
        index = checked(index + 1);
    }
    return lastIndex;
}
```

### Aggregation

.NET provides basic aggregation queries, including Sum/Average/Max/Min queries. In reality, it is also common to calculate the variance, standard deviation, and percentile. The following VariancePopulation/VarianceSample/Variance query methods are equivalent to Excel [VAR.P](https://support.office.com/en-us/article/VAR-P-function-73d1285c-108c-4843-ba5d-a51f90656f3a)/[VAR.S](https://support.office.com/en-us/article/VAR-S-function-913633de-136b-449d-813e-65a00b2b990b)/[VAR](https://support.office.com/en-us/article/VAR-function-270da762-03d5-4416-8503-10008194458a) functions:
```
public static double VariancePopulation<TSource, TKey>( // Excel VAR.P function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible
{
    double[] keys = source.Select(key => keySelector(key).ToDouble(formatProvider)).ToArray();
    double mean = keys.Average();
    return keys.Sum(key => (key - mean) * (key - mean)) / keys.Length;
}

public static double VarianceSample<TSource, TKey>( // Excel VAR.S function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible
{
    double[] keys = source.Select(key => keySelector(key).ToDouble(formatProvider)).ToArray();
    double mean = keys.Average();
    return keys.Sum(key => (key - mean) * (key - mean)) / (keys.Length - 1);
}

public static double Variance<TSource, TKey>( // Excel VAR function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible =>
        source.VarianceSample(keySelector, formatProvider);
```

And the following StandardDeviationPopulation/StabdardDeviationSample/StabdardDeviation query methods implements Excel [STDEV.P](https://support.office.com/en-us/article/STDEV-P-function-6e917c05-31a0-496f-ade7-4f4e7462f285)/[STDEV.S](https://support.office.com/en-us/article/STDEV-S-function-7d69cf97-0c1f-4acf-be27-f3e83904cc23)/[STDEV](https://support.office.com/en-us/article/STDEV-function-51fecaaa-231e-4bbb-9230-33650a72c9b0) functions:
```
public static double StandardDeviationPopulation<TSource, TKey>( // Excel STDEV.P function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible =>
        Math.Sqrt(source.VariancePopulation(keySelector, formatProvider));

public static double StandardDeviationSample<TSource, TKey>( // Excel STDEV.S function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible =>
        Math.Sqrt(source.VarianceSample(keySelector, formatProvider));

public static double StandardDeviation<TSource, TKey>( // Excel STDDEV.P function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible =>
        Math.Sqrt(source.Variance(keySelector, formatProvider));
```

And the following PercentileExclusive/PercentileInclusive/Percentile implement Excel [PERCENTILE.EXC](https://support.office.com/en-us/article/PERCENTILE-EXC-function-bbaa7204-e9e1-4010-85bf-c31dc5dce4ba)/[PERCENTILE.INC](https://support.office.com/en-us/article/PERCENTILE-INC-Function-DAX-15f69af8-1588-4863-9acf-2acc00384ffd)/[PERCENTILE](https://support.office.com/en-us/article/PERCENTILE-function-91b43a53-543c-4708-93de-d626debdddca) functions:
```
public static double PercentileExclusive<TSource, TKey>( // Excel PERCENTILE.EXC function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    double percentile,
    IComparer<TKey> comparer = null,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible
{
    if (percentile < 0 || percentile > 1)
    {
        throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
    }

    comparer = comparer ?? Comparer<TKey>.Default;
    TKey[] orderedKeys = source.Select(keySelector).OrderBy(key => key, comparer).ToArray();
    int length = orderedKeys.Length;
    if (percentile < (double)1 / length || percentile > 1 - (double)1 / (length + 1))
    {
        throw new ArgumentOutOfRangeException(
            nameof(percentile),
            $"{nameof(percentile)} must be in the range between (1 / source.Count()) and (1 - 1 / source.Count()).");
    }

    double index = percentile * (length + 1) - 1;
    int integerComponentOfIndex = (int)index;
    double decimalComponentOfIndex = index - integerComponentOfIndex;
    double keyAtIndex = orderedKeys[integerComponentOfIndex].ToDouble(formatProvider);

    double keyAtNextIndex = orderedKeys[integerComponentOfIndex + 1].ToDouble(formatProvider);
    return keyAtIndex + (keyAtNextIndex - keyAtIndex) * decimalComponentOfIndex;
}

public static double PercentileInclusive<TSource, TKey>( // Excel PERCENTILE.INC function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    double percentile,
    IComparer<TKey> comparer = null,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible
{
    if (percentile < 0 || percentile > 1)
    {
        throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
    }

    comparer = comparer ?? Comparer<TKey>.Default;
    TKey[] orderedKeys = source.Select(keySelector).OrderBy(key => key, comparer).ToArray();
    int length = orderedKeys.Length;

    double index = percentile * (length - 1);
    int integerComponentOfIndex = (int)index;
    double decimalComponentOfIndex = index - integerComponentOfIndex;
    double keyAtIndex = orderedKeys[integerComponentOfIndex].ToDouble(formatProvider);

    if (integerComponentOfIndex >= length - 1)
    {
        return keyAtIndex;
    }

    double keyAtNextIndex = orderedKeys[integerComponentOfIndex + 1].ToDouble(formatProvider);
    return keyAtIndex + (keyAtNextIndex - keyAtIndex) * decimalComponentOfIndex;
}

public static double Percentile<TSource, TKey>( // Excel PERCENTILE function.
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    double percentile,
    IComparer<TKey> comparer = null,
    IFormatProvider formatProvider = null)
    where TKey : IConvertible
{
    if (percentile < 0 || percentile > 1)
    {
        throw new ArgumentOutOfRangeException(nameof(percentile), $"{nameof(percentile)} must be between 0 and 1.");
    }

    return PercentileInclusive(source, keySelector, percentile, comparer, formatProvider);
}
```

### Quantifiers

string has a very useful IsNullOrEmpty method, and here is the LINQ version:
```
public static bool IsNullOrEmpty<TSource>(this IEnumerable<TSource> source) => source == null || !source.Any();
```

### Comparison

Contains and SequentialEqual also accepts IEqualityComparer<T>. They can be overloaded with functions:
```
public static bool Contains<TSource>(
    this IEnumerable<TSource> source,
    TSource value,
    Func<TSource, TSource, bool> equals,
    Func<TSource, int> getHashCode = null) => 
        source.Contains(value, ToEqualityComparer(equals, getHashCode));

public static bool SequenceEqual<TSource>(
    this IEnumerable<TSource> first,
    IEnumerable<TSource> second,
    Func<TSource, TSource, bool> equals,
    Func<TSource, int> getHashCode = null) => 
        first.SequenceEqual(second, ToEqualityComparer(equals, getHashCode));
```

## Void queries

### Iteration

EnumerableEx.ForEach from Ix is very handy. However, in contrast of foreach statement, it does not support breaking the loop. So here is an improved EnumerableX.ForEach:
```
public static void ForEach<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> onNext)
{
    foreach (TSource value in source)
    {
        if (!onNext(value))
        {
            break;
        }
    }
}
```

It follows the same convention of [jQuery.each](http://api.jquery.com/jquery.each/). When onNext function returns false, ForEach stops execution. And the indexed overload is:
```
public static void ForEach<TSource>(this IEnumerable<TSource> source, Func<TSource, int, bool> onNext)
{
    int index = 0;
    foreach (TSource value in source)
    {
        if (!onNext(value, index))
        {
            break;
        }
        index = checked(index + 1);
    }
}
```

The last overload just iterate the source sequence and pull all values:
```
public static void ForEach(this IEnumerable source)
{
    IEnumerator iterator = source.GetEnumerator();
    try
    {
        while (iterator.MoveNext()) { }
    }
    finally
    {
        (iterator as IDisposable)?.Dispose();
    }
}
```

It is useful to just execute a LINQ query and ignore all query results.