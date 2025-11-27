---
title: "Category Theory via C# (23) Performance"
published: 2018-12-24
description: "In functional programming, there are many powerful tools and patterns, like lambda expression, purity, deferred execution, immutability, fluent LINQ query composition, … But everything has a cost. As"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

In functional programming, there are many powerful tools and patterns, like lambda expression, purity, deferred execution, immutability, fluent LINQ query composition, … But everything has a cost. As [Alan Perlis](http://en.wikiquote.org/wiki/Alan_Perlis) [said](http://en.wikiquote.org/wiki/Alan_Perlis):

> LISP programmers know the value of everything and the cost of nothing.

For C#/.NET, the major cost of functional programming paradigm is performance. A very simple example is immutable typing. If a Product entity with many properties are designed to be an immutable type, then updating a ListPrice property requires constructing a new Product entity and copying all the other properties, which is a performance overhead.

## Functional and purely functional

### Sort array

The built-in LINQ query methods for IEnumerable<T>, are implemented in imperative algorithms for a lower performance cost. Take the sorting method as example:
```
public static class Enumerable
{
    [Pure]
    public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>
        (this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
}
```

Apparently, this API itself is functional, fluent, deferred, and higher-order so that lambda expression can be used for great convenience, and most important, it is pure. Calling OrderBy has no side effect. When when pulling the returned IOrderedEnumerable<TSource>, this is what happens internally:

-   The source, an IEnumerable<TSource>, is converted to a Buffer<TSource>, which is just a wrapper of TSource\[\] array.
-   [Quick sort](http://en.wikipedia.org/wiki/Quicksort) algorithm is applied to that wrapped TSource\[\] array.

Here is the core implementation of OrderBy:

```csharp
namespace System.Linq
{
    internal abstract class EnumerableSorter<TElement>
    {
        internal abstract void ComputeKeys(TElement[] elements, int count);

        internal abstract int CompareKeys(int index1, int index2);

        internal int[] Sort(TElement[] elements, int count)
        {
            this.ComputeKeys(elements, count);
            int[] map = new int[count];
            for (int i = 0; i < count; i++)
            {
                map[i] = i;
            }

            this.QuickSort(map, 0, count - 1);
            return map;
        }

        private void QuickSort(int[] map, int left, int right)
        {
            do
            {
                int i = left;
                int j = right;
                int x = map[i + ((j - i) >> 1)];
                do
                {
                    while (i < map.Length && this.CompareKeys(x, map[i]) > 0)
                    {
                        i++;
                    }

                    while (j >= 0 && this.CompareKeys(x, map[j]) < 0)
                    {
                        j--;
                    }

                    if (i > j)
                    {
                        break;
                    }

                    if (i < j)
                    {
                        int temp = map[i];
                        map[i] = map[j];
                        map[j] = temp;
                    }

                    i++;
                    j--;
                } while (i <= j);

                if (j - left <= right - i)
                {
                    if (left < j)
                    {
                        this.QuickSort(map, left, j);
                    }

                    left = i;
                }
                else
                {
                    if (i < right)
                    {
                        this.QuickSort(map, i, right);
                    }

                    right = j;
                }
            } while (left < right);
        }
    }
}
```

OrderBy, OrderByDescending, ThenBy all calls above QuickSort, which is completely imperative, for the lowest performance overhead.

If above quick sort is implemented in purely functional manner, it will be like:
```
// [Pure]
public static partial class EnumerableExtensions
{
    public static IEnumerable<T> QuickSort<T>(this IEnumerable<T> source, Comparer<T> comparer = null)
    {
        if (!source.Any())
        {
            return source; // End of recursion.
        }

        comparer = comparer ?? Comparer<T>.Default;
        T head = source.First();
        IEnumerable<T> tail = source.Skip(1);
        IEnumerable<T> smallerThanHead = (from value in tail
                                            where comparer.Compare(value, head) <= 0
                                            select value).QuickSort();
        IEnumerable<T> greaterThanHead = (from value in tail
                                            where comparer.Compare(value, head) > 0
                                            select value).QuickSort();
        return smallerThanHead.Concat(head.Enumerable()).Concat(greaterThanHead);
    }
}
```

In .NET, there are other built-in sorting functions, like Array.Sort. The following code roughly demonstrates its implementation:

```csharp
public abstract class Array
{
    public static void Sort<T>(T[] array, int index, int length, IComparer<T> comparer)
    {
        if (length <= 1)
        {
            return;
        }

        if (comparer == null || comparer == Comparer<T>.Default)
        {
            if (TrySZSort(array, null, index, index + length - 1))
            {
                return;
            }

            if (BinaryCompatibility.TargetsAtLeast_Desktop_V4_5)
            {
                GenericArraySortHelper<T>.IntrospectiveSort(array, index, length);
            }
            else
            {
                GenericArraySortHelper<T>.DepthLimitedQuickSort(array, index, length + index - 1, 32);
            }
        }
        else
        {
            if (BinaryCompatibility.TargetsAtLeast_Desktop_V4_5)
            {
                ArraySortHelper<T>.IntrospectiveSort(array, index, length, comparer);
            }
            else
            {
                ArraySortHelper<T>.DepthLimitedQuickSort(array, index, length + index - 1, comparer, 32);
            }
        }
    }

    [MethodImpl(MethodImplOptions.InternalCall)]
    private static extern bool TrySZSort(Array keys, Array items, int left, int right);
}
```

Also, the LINQ to Objects chapter has implemented an OrderBy query method with an OrderedSequence class, which is just for demonstration purpose. Now, the above 4 C# functions’ performance of sorting array will be compared.

### Prepare to test

First some help functions are needed. The following ForEach is from the EnumerableX class in the LINQ to Objects chapter:
```
// [Pure]
public static partial class EnumerableX
{
    public static void ForEach<T>(this IEnumerable<T> source)
    {
        foreach (T value in source)
        {
        }
    }
}
```

And the following Stopwatch helper methods will be used to call methods repeatedly to measure the performance:

```csharp
// Impure.
public static class StopwatchHelper
{
    public const int DefaultCount = 100;

    private static readonly Stopwatch DefaultStopwatch = new Stopwatch();

    public static long Run(this Action action, int count = DefaultCount, Stopwatch stopwatch = null)
    {
        stopwatch = stopwatch ?? DefaultStopwatch;
        stopwatch.Reset();
        action(); // Warm up.
        GC.Collect();
        GC.WaitForPendingFinalizers();
        GC.Collect();
        stopwatch.Start();

        for (int index = 0; index < count; index++)
        {
            action();
        }

        stopwatch.Stop();
        return stopwatch.ElapsedMilliseconds;
    }

    public static long RunEach<T>
        (this IEnumerable<T> args, Func<T, T> action, int count = DefaultCount, Stopwatch stopwatch = null) =>
            Run(() => args.ForEach(arg => action(arg)), count);

    public static long RunEach<T1, T2>
        (this IEnumerable<IEnumerable<T1>> args1,
        Func<IEnumerable<T1>, Func<T1, T2>, IEnumerable<T1>> action,
        Func<T1, T2> arg2,
        int count = DefaultCount,
        Stopwatch stopwatch = null)
            => Run(() => args1.ForEach(arg1 => action(arg1, arg2).ForEach()), count);

    public static long Run<T>(this T arg, Func<T, T> action, int count = DefaultCount, Stopwatch stopwatch = null) =>
        Run(() => action(arg), count);

    public static long Run<T1, T2>
        (this IEnumerable<T1> arg1,
        Func<IEnumerable<T1>, Func<T1, T2>, IEnumerable<T1>> action,
        Func<T1, T2> arg2,
        int count = DefaultCount,
        Stopwatch stopwatch = null)
            => Run(() => action(arg1, arg2).ForEach(), count);
}
```

The performance tests will be done by sorting:

-   Int32 (primitive value type) array
-   String, (primitive reference type) array (To get random strings, Guid can be used.)
-   Struct (custom value type) array
-   Class (custom reference type) array

So these functions are created to generate random arrays:
```
[Pure]
public static class ArrayHelper
{
    public static int[][] RandomArrays(int minValue, int maxValue, int minLength, int maxLength, int count)
        => Enumerable
            .Range(0, count)
            .Select(_ => RandomArray(minValue, maxValue, minLength, maxLength))
            .ToArray();

    public static int[] RandomArray(int minValue, int maxValue, int minLength, int maxLength)
    {
        Random random = new Random();
        return EnumerableX
            .RandomInt32(minValue, maxValue, random).Take(random.Next(minLength, maxLength))
            .ToArray();
    }
}
```

EnumerableX.Random is defined in the LINQ to Objects chapter to generate a sequence of random int values.

A struct and a class has to be created too:

```csharp
public class PersonReferenceType : IComparable<PersonReferenceType>
{
    public string Name { [Pure] get; private set; }

    public int Age { [Pure] get; private set; }

    public string Description { [Pure] get; private set; }

    [Pure]
    public int CompareTo(PersonReferenceType other)
    {
        int nameCompare = string.Compare(this.Name, other.Name, StringComparison.OrdinalIgnoreCase);
        return nameCompare != 0 ? nameCompare : this.Age.CompareTo(other.Age);
    }

    private static readonly string longString =
        Enumerable.Range(0, 10000).Select(_ => Guid.NewGuid().ToString()).Aggregate(string.Concat);

    private static readonly Random random = new Random();

    [Pure]
    public static IEnumerable<PersonReferenceType> Random
        (int count) => 
            Enumerable.Range(1, count).Select(_ => new PersonReferenceType()
                {
                    Name = Guid.NewGuid().ToString(),
                    Age = random.Next(0, 100),
                    Description = longString
                });
}

public struct PersonValueType : IComparable<PersonValueType>
{
    public string Name { [Pure] get; private set; }

    public int Age { [Pure] get; private set; }
         
    public string Description { [Pure] get; private set; }

    [Pure]
    public int CompareTo(PersonValueType other)
    {
        int nameCompare = string.Compare(this.Name, other.Name, StringComparison.OrdinalIgnoreCase);
        return nameCompare != 0 ? nameCompare : this.Age.CompareTo(other.Age);
    }

    private static readonly string longString =
        Enumerable.Range(0, 10000).Select(_ => Guid.NewGuid().ToString()).Aggregate(string.Concat);

    private static readonly Random random = new Random();

    [Pure]
    public static IEnumerable<PersonValueType> Random
        (int count) =>
            Enumerable.Range(1, count).Select(_ => new PersonValueType()
            {
                Name = Guid.NewGuid().ToString(),
                Age = random.Next(0, 100),
                Description = longString
            });
}
```

### Performance tests

Above 4 kinds of sorting will be compared:

-   Array.Sort: Imperative API with imperative implementation
-   Enumerable.OrderBy: Functional API with imperative implementation and imperative optimization
-   EnumerableExtensions.OrderBy: Functional API with imperative implementation without optimization
-   EnumerableExtensions.QuickSort: Functional API with functional implementation
```
using CustomLinq = Dixin.Linq.LinqToObjects.EnumerableExtensions;
    
// Impure.
internal static partial class Sort
{
    internal static T[] ArraySort<T>(T[] array)
    {
        Array.Sort(array);
        return array;
    }

    internal static T[] LinqOrderBy<T>(T[] array) => array.OrderBy(value => value).ToArray();

    internal static T[] CustomLinqOrderBy<T>(T[] array) => CustomLinq.OrderBy(array, value => value).ToArray();

    internal static T[] FunctionalQuickSort<T>(T[] array) => array.QuickSort().ToArray();
}
```

Here are the tests:
```
// Impure.
internal static partial class Sort
{
    internal static void Int32Array()
    {
        int[][] arrays1 = ArrayHelper.RandomArrays(int.MinValue, int.MaxValue, 0, 100, 100);
        int[][] arrays2 = arrays1.Select(array => array.ToArray()).ToArray(); // Copy.
        int[][] arrays3 = arrays1.Select(array => array.ToArray()).ToArray(); // Copy.
        int[][] arrays4 = arrays1.Select(array => array.ToArray()).ToArray(); // Copy.
        Trace.WriteLine($"{nameof(ArraySort)}: {arrays1.RunEach(ArraySort)}");
        Trace.WriteLine($"{nameof(LinqOrderBy)}: {arrays2.RunEach(LinqOrderBy)}");
        Trace.WriteLine($"{nameof(CustomLinqOrderBy)}: {arrays4.RunEach(CustomLinqOrderBy)}");
        Trace.WriteLine($"{nameof(FunctionalQuickSort)}: {arrays3.RunEach(FunctionalQuickSort)}");
    }

    internal static void StringArray()
    {
        string[] array1 = Enumerable.Range(0, 100).Select(_ => Guid.NewGuid().ToString()).ToArray();
        string[] array2 = array1.ToArray(); // Copy.
        string[] array3 = array1.ToArray(); // Copy.
        string[] array4 = array1.ToArray(); // Copy.
        Trace.WriteLine($"{nameof(ArraySort)}: {array1.Run(ArraySort)}");
        Trace.WriteLine($"{nameof(LinqOrderBy)}: {array2.Run(LinqOrderBy)}");
        Trace.WriteLine($"{nameof(CustomLinqOrderBy)}: {array4.Run(CustomLinqOrderBy)}");
        Trace.WriteLine($"{nameof(FunctionalQuickSort)}: {array3.Run(FunctionalQuickSort)}");
    }

    internal static void ValueTypeArray()
    {
        PersonValueType[] array1 = PersonValueType.Random(100).ToArray();
        PersonValueType[] array2 = array1.ToArray(); // Copy.
        PersonValueType[] array3 = array1.ToArray(); // Copy.
        PersonValueType[] array4 = array1.ToArray(); // Copy.
        Trace.WriteLine($"{nameof(ArraySort)}: {array1.Run(ArraySort)}");
        Trace.WriteLine($"{nameof(LinqOrderBy)}: {array2.Run(LinqOrderBy)}");
        Trace.WriteLine($"{nameof(CustomLinqOrderBy)}: {array4.Run(CustomLinqOrderBy)}");
        Trace.WriteLine($"{nameof(FunctionalQuickSort)}: {array3.Run(FunctionalQuickSort)}");
    }

    internal static void ReferenceTypeArray()
    {
        PersonReferenceType[] array1 = PersonReferenceType.Random(100).ToArray();
        PersonReferenceType[] array2 = array1.ToArray(); // Copy.
        PersonReferenceType[] array3 = array1.ToArray(); // Copy.
        PersonReferenceType[] array4 = array1.ToArray(); // Copy.
        Trace.WriteLine($"{nameof(ArraySort)}: {array1.Run(ArraySort)}");
        Trace.WriteLine($"{nameof(LinqOrderBy)}: {array2.Run(LinqOrderBy)}");
        Trace.WriteLine($"{nameof(CustomLinqOrderBy)}: {array4.Run(CustomLinqOrderBy)}");
        Trace.WriteLine($"{nameof(FunctionalQuickSort)}: {array3.Run(FunctionalQuickSort)}");
    }
}
```

Applying these 4 functions (Release build, optimize code, x64) gives following numbers on a PC:

<table border="0" cellpadding="0" cellspacing="0" width="790"><tbody><tr><td valign="top" width="234">(Millisecond, the smaller the better)</td><td valign="top" width="108">ArraySort</td><td valign="top" width="114">LinqOrderBy</td><td valign="top" width="171">CustomLinqOrderBy</td><td valign="top" width="161">FunctionalQuickSort</td></tr><tr><td valign="top" width="234">Sort.Int32Array</td><td valign="top" width="108">4</td><td valign="top" width="114">44</td><td valign="top" width="171">214</td><td valign="top" width="161">6195</td></tr><tr><td valign="top" width="234">Sort.StringArray</td><td valign="top" width="108">7</td><td valign="top" width="114">11</td><td valign="top" width="171">14</td><td valign="top" width="161">891</td></tr><tr><td valign="top" width="234">Sort.ValueTypeArray</td><td valign="top" width="108">3</td><td valign="top" width="114">6</td><td valign="top" width="171">8</td><td valign="top" width="161">664</td></tr><tr><td valign="top" width="234">Sort.ReferenceTypeArray</td><td valign="top" width="112">2</td><td valign="top" width="120">3</td><td valign="top" width="171">6</td><td valign="top" width="161">424</td></tr></tbody></table>

FunctionalQuickSort function demonstrates the significant performance cost of functional paradigm for sorting array in C#/.NET.

## Cost of functional and monad

### Filter IEnumerable<T>

Filtering an IEnumerable<T> can be done in several different ways:
```
// Impure.
internal static partial class Filter
{
    [Pure]
    internal static T[] EagerForEach<T>(IEnumerable<T> source, Func<T, bool> predicate)
    {
        T[] result = new T[4];
        int count = 0;
        foreach (T value in source)
        {
            if (predicate(value))
            {
                if (result.Length == count)
                {
                    T[] newValues = new T[checked(count * 2)];
                    Array.Copy(result, 0, newValues, 0, count);
                    result = newValues;
                }

                result[count] = value;
                count++;
            }
        }

        return result;
    }

    [Pure]
    internal static IEnumerable<T> LazyForEach<T>(IEnumerable<T> source, Func<T, bool> predicate)
    {
        foreach (T value in source)
        {
            if (predicate(value))
            {
                yield return value;
            }
        }
    }

    [Pure]
    internal static IEnumerable<T> Linq<T>
        (IEnumerable<T> source, Func<T, bool> predicate)
            => from value in source
                where predicate(value)
                select value;

    [Pure]
    internal static IEnumerable<T> Monad<T>
        (IEnumerable<T> source, Func<T, bool> predicate)
            => from value in source
                from result in predicate(value) ? Enumerable.Empty<T>() : value.Enumerable()
                select result;
}
```

The first EagerForEach function uses the same algorithm as System.Linq. Buffer<TElement>.

### Performance tests
```
// Impure.
internal static partial class Filter
{
    internal static void Int32Sequence()
    {
        IEnumerable<int>[] arrays1 = ArrayHelper.RandomArrays(int.MinValue, int.MaxValue, 0, 100, 100);
        IEnumerable<int>[] arrays2 = arrays1.Select(array => array.ToArray()).ToArray(); // Copy.
        IEnumerable<int>[] arrays3 = arrays1.Select(array => array.ToArray()).ToArray(); // Copy.
        IEnumerable<int>[] arrays4 = arrays1.Select(array => array.ToArray()).ToArray(); // Copy.
        Func<int, bool> predicate = value => value > 0;
        Trace.WriteLine($"{nameof(Linq)}: {arrays1.RunEach(Linq, predicate)}");
        Trace.WriteLine($"{nameof(EagerForEach)}: {arrays2.RunEach(EagerForEach, predicate)}");
        Trace.WriteLine($"{nameof(LazyForEach)}: {arrays3.RunEach(LazyForEach, predicate)}");
        Trace.WriteLine($"{nameof(Monad)}: {arrays4.RunEach(Monad, predicate)}");
    }

    internal static void StringSequence()
    {
        IEnumerable<string> array1 = Enumerable.Range(0, 1000).Select(_ => Guid.NewGuid().ToString()).ToArray();
        IEnumerable<string> array2 = array1.ToArray(); // Copy.
        IEnumerable<string> array3 = array1.ToArray(); // Copy.
        IEnumerable<string> array4 = array1.ToArray(); // Copy.
        Func<string, bool> predicate = value => string.Compare(value, "x", StringComparison.OrdinalIgnoreCase) > 0;
        Trace.WriteLine($"{nameof(Linq)}: {array1.Run(Linq, predicate)}");
        Trace.WriteLine($"{nameof(EagerForEach)}: {array2.Run(EagerForEach, predicate)}");
        Trace.WriteLine($"{nameof(LazyForEach)}: {array3.Run(LazyForEach, predicate)}");
        Trace.WriteLine($"{nameof(Monad)}: {array4.Run(Monad, predicate)}");
    }

    internal static void ValueTypeSequence()
    {
        IEnumerable<PersonValueType> array1 = PersonValueType.Random(1000).ToArray();
        IEnumerable<PersonValueType> array2 = array1.ToArray(); // Copy.
        IEnumerable<PersonValueType> array3 = array1.ToArray(); // Copy.
        IEnumerable<PersonValueType> array4 = array1.ToArray(); // Copy.
        Func<PersonValueType, bool> predicate = value => value.Age > 18;
        Trace.WriteLine($"{nameof(Linq)}: {array1.Run(Linq, predicate)}");
        Trace.WriteLine($"{nameof(EagerForEach)}: {array2.Run(EagerForEach, predicate)}");
        Trace.WriteLine($"{nameof(LazyForEach)}: {array3.Run(LazyForEach, predicate)}");
        Trace.WriteLine($"{nameof(Monad)}: {array4.Run(Monad, predicate)}");
    }

    internal static void ReferenceTypeSequence()
    {
        IEnumerable<PersonReferenceType> array1 = PersonReferenceType.Random(1000).ToArray();
        IEnumerable<PersonReferenceType> array2 = array1.ToArray(); // Copy.
        IEnumerable<PersonReferenceType> array3 = array1.ToArray(); // Copy.
        IEnumerable<PersonReferenceType> array4 = array1.ToArray(); // Copy.
        Func<PersonReferenceType, bool> predicate = value => value.Age > 18;
        Trace.WriteLine($"{nameof(Linq)}: {array1.Run(Linq, predicate)}");
        Trace.WriteLine($"{nameof(EagerForEach)}: {array2.Run(EagerForEach, predicate)}");
        Trace.WriteLine($"{nameof(LazyForEach)}: {array3.Run(LazyForEach, predicate)}");
        Trace.WriteLine($"{nameof(Monad)}: {array4.Run(Monad, predicate)}");
    }
}
```

Applying these 4 functions (Release build, optimize code, x64) gives following numbers:

<table border="0" cellpadding="0" cellspacing="0" width="677"><tbody><tr><td valign="top" width="266">(Milliseconds, the smaller the better)</td><td valign="top" width="134">EagerForEach</td><td valign="top" width="97">LazyForEach</td><td valign="top" width="87">Linq</td><td valign="top" width="91">Monad</td></tr><tr><td valign="top" width="266">Filter.Int32Sequence</td><td valign="top" width="134">4</td><td valign="top" width="97">7</td><td valign="top" width="87">7</td><td valign="top" width="91">82</td></tr><tr><td valign="top" width="266">Filter.StringSequence</td><td valign="top" width="134">2</td><td valign="top" width="97">2</td><td valign="top" width="87">3</td><td valign="top" width="91">36</td></tr><tr><td valign="top" width="266">Filter.ValueTypeSequence</td><td valign="top" width="134">2</td><td valign="top" width="97">3</td><td valign="top" width="87">4</td><td valign="top" width="91">20</td></tr><tr><td valign="top" width="266">Filter.ReferenceTypeSequence</td><td valign="top" width="134">1</td><td valign="top" width="97">2</td><td valign="top" width="87">3</td><td valign="top" width="91">20</td></tr></tbody></table>

Monad implementation runs slower in all cases.

## Cost of lambda

### Filter array

Filtering an array can be done imperatively without any lambda expression, and functionally with lambda expression:
```
// Impure.
internal static partial class Filter
{
    internal static PersonReferenceType[] WithoutLambda(
        this PersonReferenceType[] source,
        int minAge1, int maxAge1, int minAge2, int maxAge2,
        string minName1, string maxName1, string minName2, string maxName2)
    {
        PersonReferenceType[] result = new PersonReferenceType[source.Length];
        int resultIndex = 0;
        foreach (PersonReferenceType person in source)
        {
            if ((person.Age >= minAge1 && person.Age <= maxAge2
                    || person.Age >= minAge2 && person.Age <= maxAge2)
                && (string.Compare(person.Name, minName1, StringComparison.OrdinalIgnoreCase) >= 0
                        && string.Compare(person.Name, maxName1, StringComparison.OrdinalIgnoreCase) <= 0
                    || string.Compare(person.Name, minName2, StringComparison.OrdinalIgnoreCase) >= 0
                        && string.Compare(person.Name, maxName2, StringComparison.OrdinalIgnoreCase) <= 0))
            {
                result[resultIndex++] = person;
            }
        }

        Array.Resize(ref result, resultIndex);
        return result;
    }

    internal static PersonReferenceType[] WithLambda(
        this PersonReferenceType[] source,
        int minAge1, int maxAge1, int minAge2, int maxAge2,
        string minName1, string maxName1, string minName2, string maxName2)
            => source
                .Where(person =>
                    (person.Age >= minAge1 && person.Age <= maxAge2
                        || person.Age >= minAge2 && person.Age <= maxAge2)
                    && (string.Compare(person.Name, minName1, StringComparison.OrdinalIgnoreCase) >= 0
                            && string.Compare(person.Name, maxName1, StringComparison.OrdinalIgnoreCase) <= 0
                        || string.Compare(person.Name, minName2, StringComparison.OrdinalIgnoreCase) >= 0
                            && string.Compare(person.Name, maxName2, StringComparison.OrdinalIgnoreCase) <= 0))
                .ToArray();
}
```

### Performance tests
```
internal static partial class Filter
{
    internal static PersonReferenceType[] WithoutLambda(
        this PersonReferenceType[] source,
        int minAge1, int maxAge1, int minAge2, int maxAge2,
        string minName1, string maxName1, string minName2, string maxName2)
    {
        PersonReferenceType[] result = new PersonReferenceType[source.Length];
        int resultIndex = 0;
        foreach (PersonReferenceType person in source)
        {
            if ((person.Age >= minAge1 && person.Age <= maxAge2 || person.Age >= minAge2 && person.Age <= maxAge2)
                && (string.Compare(person.Name, minName1, StringComparison.OrdinalIgnoreCase) >= 0
                    && string.Compare(person.Name, maxName1, StringComparison.OrdinalIgnoreCase) <= 0
                    || string.Compare(person.Name, minName2, StringComparison.OrdinalIgnoreCase) >= 0
                    && string.Compare(person.Name, maxName2, StringComparison.OrdinalIgnoreCase) <= 0))
            {
                result[resultIndex++] = person;
            }
        }

        Array.Resize(ref result, resultIndex);
        return result;
    }

    internal static PersonReferenceType[] WithLambda(
        this PersonReferenceType[] source,
        int minAge1, int maxAge1, int minAge2, int maxAge2,
        string minName1, string maxName1, string minName2, string maxName2)
        => source.Where(person =>
            (person.Age >= minAge1 && person.Age <= maxAge2 || person.Age >= minAge2 && person.Age <= maxAge2)
            && (string.Compare(person.Name, minName1, StringComparison.OrdinalIgnoreCase) >= 0
                && string.Compare(person.Name, maxName1, StringComparison.OrdinalIgnoreCase) <= 0
                || string.Compare(person.Name, minName2, StringComparison.OrdinalIgnoreCase) >= 0
                && string.Compare(person.Name, maxName2, StringComparison.OrdinalIgnoreCase) <= 0)).ToArray();
}
```

Applying this function (Release build, optimize code, x64) gives following numbers:
```
// Impure.
internal static partial class Filter
{
    internal static void ByPredicate()
    {
        PersonReferenceType[] array1 = PersonReferenceType.Random(10000).ToArray();
        PersonReferenceType[] array2 = array1.ToArray(); // Copy.
        string minName1 = Guid.NewGuid().ToString();
        string maxName1 = Guid.NewGuid().ToString();
        string minName2 = Guid.NewGuid().ToString();
        string maxName2 = Guid.NewGuid().ToString();
        Trace.WriteLine(
            $@"{nameof(WithoutLambda)}: {array1.Run(values =>
                WithoutLambda(values, 10, 20, 30, 40, minName1, maxName1, minName2, maxName2))}");
        Trace.WriteLine(
            $@"{nameof(WithLambda)}: {array2.Run(values =>
                WithLambda(values, 10, 20, 30, 40, minName1, maxName1, minName2, maxName2))}");
    }
}
```

<table border="0" cellpadding="0" cellspacing="0" width="595"><tbody><tr><td valign="top" width="321">(Milliseconds, the smaller the better)</td><td valign="top" width="148">WithoutLambda</td><td valign="top" width="124">Lambda</td></tr><tr><td valign="top" width="321">Filter.ByPredicate</td><td valign="top" width="148">183</td><td valign="top" width="124">830</td></tr></tbody></table>

Here lambda expression causes performance overhead because of closure. In above Lambda function, the lambda expression is compiled to a class:

```csharp
internal static partial class Filter
{
    [CompilerGenerated]
    private sealed class Predicate
    {
        public int minAge1; public int minAge2; public int maxAge1; public int maxAge2;

        public string minName1; public string maxName1; public string minName2; public string maxName2;

        public bool WithLambda(PersonReferenceType person)
            => ((person.Age >= this.minAge1 && person.Age <= this.maxAge1)
                    || (person.Age >= this.minAge2 && person.Age <= this.maxAge2))
                && ((string.Compare(person.Name, this.minName1, StringComparison.OrdinalIgnoreCase) >= 0
                        && string.Compare(person.Name, this.maxName1, StringComparison.OrdinalIgnoreCase) <= 0)
                    || (string.Compare(person.Name, this.minName2, StringComparison.OrdinalIgnoreCase) >= 0
                        && string.Compare(person.Name, this.maxName2, StringComparison.OrdinalIgnoreCase) <= 0));
    }

    internal static PersonReferenceType[] CompiledWithLambda(
        this PersonReferenceType[] source,
        int minAge1, int maxAge1, int minAge2, int maxAge2,
        string minName1, string maxName1, string minName2, string maxName2)
            => source.Where(new Predicate
                {
                    minAge1 = minAge1, minAge2 = minAge2, maxAge1 = maxAge1, maxAge2 = maxAge2,
                    minName1 = minName1, maxName1 = maxName1, minName2 = minName2, maxName2 = maxName2
                }.WithLambda).ToArray();
}
```

Each reference to non-local variable becomes a field of the generated class, and the lambda expression (anonymous function) becomes a instance method. So every time Lambda function is applied, a Predicate class will be instantiated.

## Conclusion

After understanding aspects and powerful features of category theory and purely/impurely functional programming in C# and LINQ, it is also important to understand the cost of the value. Not all programs should be written in functional paradigm or in LINQ query style. These tests above demonstrated that some certain algorithm implemented in functional paradigm could run significantly slower than in imperative paradigm. Laziness, LINQ query, lambda with closure in LINQ can all cause performance overhead. In real world programming, knowing these cost helps making the right decision for each case.