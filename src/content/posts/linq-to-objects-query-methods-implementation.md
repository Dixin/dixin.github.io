---
title: "LINQ to Objects in Depth (5) Query Methods Implementation"
published: 2019-07-05
description: "Understanding of internal implementation of LINQ to Objects queries is the ultimate way to master them and use them accurately and effectively, and is also helpful for defining custom query methods, w"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

Understanding of internal implementation of LINQ to Objects queries is the ultimate way to master them and use them accurately and effectively, and is also helpful for defining custom query methods, which is discussed later in the custom queries chapter. Just like the usage discussion part, here query methods are still categorized by output type, but in a different order:

1. Collection queries: output a new collection (immediate execution):

o Conversion: ToArray, ToList, ToDictionary, ToLookup

2. Sequence queries: output a new IEnumerable<T> sequence (deferred execution, underlined are eager evaluation):

o Conversion: Cast, AsEnumerable

o Generation: Empty, Range, Repeat, DefaultIfEmpty

o Filtering (restriction): Where, OfType

o Mapping (projection): Select, SelectMany

o Grouping: GroupBy\*

o Join: SelectMany, Join\*, GroupJoin\*

o Concatenation: Concat

o Set: Distinct, Union, Intersect\*, Except\*

o Convolution: Zip

o Partitioning: Take, Skip, TakeWhile, SkipWhile

o Ordering: OrderBy\*, ThenBy\*, OrderByDescending\*, ThenByDescending\*, Reverse\*

3. Value queries: output a single value (immediate execution):

o Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault

o Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average

o Quantifier: All, Any, Contains

o Equality: SequenceEqual

The LINQ to Objects queries are functional as APIs, but their implementation is imperative. Again, the collection queries and value queries implement immediate execution, and the sequence queries implements deferred execution. For the sequential queries, the ones marked with \* implements eager evaluation, and the other ones without mark implements lazy evaluation.

### Argument check and deferred execution

As fore mentioned, all sequence queries implement deferred execution, mostly by following iterator pattern, which can be easily implemented with yield statement. For a generator function with the yield syntactic sugar, its arguments check cannot be directly added to the function body, because the execution of all code in the body is deferred. For example, assuming arguments check is added to Select query as the following:

internal static IEnumerable<TResult> SelectWithDeferredCheck<TSource, TResult>(
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
if (source == null)
```
```
{
```
```
throw new ArgumentNullException(nameof(source));
```
```
}
```
```
if (selector == null)
```
```
{
```
```
throw new ArgumentNullException(nameof(selector));
```
```
}
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return selector(value); // Deferred execution.
```
```
}
```

}

Its arguments are expected to be checked immediately when it is called. However, the check is deferred. When it is called, it only constructs the following generator:

internal static IEnumerable<TResult> CompiledSelectWithDeferredCheck<TSource, TResult>(
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
return new Generator<TResult>(
```
```
start: () =>
```
```
{
```
```
if (source == null)
```
```
{
```
```
throw new ArgumentNullException(nameof(source));
```
```
}
```
```
if (selector == null)
```
```
{
```
```
throw new ArgumentNullException(nameof(selector));
```
```
}
```
```
sourceIterator = source.GetEnumerator();
```
```
},
```
```
moveNext: () => sourceIterator.MoveNext(),
```
```
getCurrent: () => selector(sourceIterator.Current),
```
```
dispose: () => sourceIterator?.Dispose());
```

}

The argument check is deferred to execute when starting to pull the results from the output sequence. The easiest solution is simply isolating yield statement along with its iteration control flow, which is compiled to deferred execution, with a separate method or a local function:

internal static IEnumerable<TResult> SelectWithCheck<TSource, TResult>(
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
if (source == null) // Immediate execution.
```
```
{
```
```
throw new ArgumentNullException(nameof(source));
```
```
}
```
```
if (selector == null) // Immediate execution.
```
```
{
```
```
throw new ArgumentNullException(nameof(selector));
```
```
}
```
```
IEnumerable<TResult> SelectGenerator()
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
yield return selector(value); // Deferred execution.
```
```
}
```
```
}
```
```
return SelectGenerator(); // Immediate execution.
```

}

As a result, the above outer function is no longer a generator function. When it is called, it immediately checks the arguments, then immediately calls the local function to construct a generator as output. As mentioned in the introduction chapter, this tutorial omits argument null checks and only demonstrate argument checks for other purposes .

### Collection queries

The collection queries are discussed first because they are relatively straightforward, and they are used to implement sequence queries:

### Conversion

ToArray is implemented by pulling all values from source sequence and store them to a new array. To create an array, its length has to be provided. However, the count of values in source is unknown when starting to pull the values. The easiest implementation is to create an empty array, when each value is pulled from source sequence, increase the array size by 1 to store that value:

internal static partial class EnumerableExtensions
```
{
```
```
public static TSource[] ToArray<TSource>(this IEnumerable<TSource> source)
```
```
{
```
```
TSource[] array = new TSource[0];
```
```
foreach (TSource value in source)
```
```
{
```
```
Array.Resize(ref array, array.Length + 1);
```
```
array[array.Length - 1] = value;
```
```
}
```
```
return array;
```
```
}
```

}

Actually, Microsoft’s built-in implementation has some performance improvement. First, if the source sequence implements ICollection<T>, then it already has a CopyTo method to store its values to an array:

namespace System.Collections.Generic
```
{
```
```
public interface ICollection<T> : IEnumerable<T>, IEnumerable
```
```
{
```
```
int Count { get; }
```
```
bool IsReadOnly { get; }
```
```
void Add(T item);
```
```
void Clear();
```
```
bool Contains(T item);
```
```
void CopyTo(T[] array, int arrayIndex);
```
```
bool Remove(T item);
```
```
}
```

}

Also, the array does not need to be resized for each value. The built-in implementation has the arrays grow in the same way of List<T>. First, an initial length is used to construct the array; when pulling values from source and storing to array, if array gets full, then double its length; After all values are pulled, the array resized to the actual length. The following is an equivalent implementation, optimized for readability:

public static TSource\[\] ToArray<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
if (source is ICollection<TSource> genericCollection)
```
```
{
```
```
int length = genericCollection.Count;
```
```
if (length > 0)
```
```
{
```
```
TSource[] array = new TSource[length];
```
```
genericCollection.CopyTo(array, 0);
```
```
return array;
```
```
}
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
const int InitialLength = 4; // Initial array length.
```
```
const int MaxLength = 0x7FEFFFFF; // Max array length: Array.MaxArrayLength.
```
```
TSource[] array = new TSource[InitialLength];
```
```
array[0] = iterator.Current;
```
```
int usedLength = 1;
```
```
while (iterator.MoveNext())
```
```
{
```
```
if (usedLength == array.Length)
```
```
{
```
```
int increaseToLength = usedLength * 2; // Array is full, double its size.
```
```
if ((uint)increaseToLength> MaxLength)
```
```
{
```
```
increaseToLength = usedLength> = MaxLength ? usedLength + 1 : MaxLength;
```
```
}
```
```
Array.Resize(ref array, increaseToLength);
```
```
}
```
```
array[usedLength++] = iterator.Current;
```
```
}
```
```
Array.Resize(ref array, usedLength); // Consolidate array to its actual size.
```
```
return array;
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
return Array.Empty<TSource>();
```

}

ToList is much easier to implement, because List<T> has a constructor accepting an IEnumerable<T> source:

public static List<TSource\> ToList<TSource\>(this IEnumerable<TSource\> source) =>

new List<TSource\>(source);

ToDictionary is also easy, because Dictionary<TKey, TValue> has an Add method:

public static Dictionary<TKey, TSource\> ToDictionary<TSource, TKey\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IEqualityComparer<TKey>comparer = null) =>
```
```
source.ToDictionary(keySelector, value => value, comparer);
```
```
public static Dictionary<TKey, TElement> ToDictionary<TSource, TKey, TElement>(
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
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
Dictionary<TKey, TElement> dictionary = new Dictionary<TKey, TElement>(comparer);
```
```
foreach (TSource value in source)
```
```
{
```
```
dictionary.Add(keySelector(value), elementSelector(value));
```
```
}
```
```
return dictionary;
```

}

As previously discussed, a lookup is a dictionary of key and sequence pairs, and each key and sequence pair are just a group represented by IGrouping<TKey, TElement>, which can be implemented as:

public class Grouping<TKey, TElement\> : IGrouping<TKey, TElement\>
```
{
```
```csharp
private readonly List<TElement> values = new List<TElement>();
```
```
public Grouping(TKey key) => this.Key = key;
```
```
public TKey Key { get; }
```
```
public IEnumerator<TElement> GetEnumerator() => this.values.GetEnumerator();
```
```
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```
```
internal void Add(TElement value) => this.values.Add(value);
```

}

.NET provides a public lookup type, but there is no public API to instantiate it, except the ToLookup query itself. For demonstration purpose, based on the previous discussion of dictionary and lookup, a custom lookup can be quickly implemented with dictionary, where each dictionary value is a group, and each dictionary key is the hash code of group key:

public partial class Lookup<TKey, TElement> : ILookup<TKey, TElement>
```
{
```
```csharp
private readonly Dictionary<int, Grouping<TKey, TElement>> groups =
```
```
new Dictionary<int, Grouping<TKey, TElement>>();
```

```csharp
private readonly IEqualityComparer<TKey> equalityComparer;
```
```
public Lookup(IEqualityComparer<TKey> equalityComparer = null) =>
```
```
this.equalityComparer = equalityComparer ?? EqualityComparer<TKey>.Default;
```
```
public int Count => this.groups.Count;
```

```csharp
private int GetHashCode(TKey key) => key == null
```
```
? -1
```
```
: this.equalityComparer.GetHashCode(key) & int.MaxValue;
```
```
// int.MaxValue is 0b_01111111_11111111_11111111_11111111. So the hash code of non-null key is always > -1.
```
```
public bool Contains(TKey key) => this.groups.ContainsKey(this.GetHashCode(key));
```
```
public IEnumerable<TElement> this[TKey key] =>
```
```
this.groups.TryGetValue(this.GetHashCode(key), out Grouping<TKey, TElement> group)
```
```
? (IEnumerable<TElement>)group
```
```
: Array.Empty<TElement>();
```
```
public IEnumerator<IGrouping<TKey, TElement>> GetEnumerator() => this.groups.Values.GetEnumerator();
```
```
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

}

The built-in API object.GetHashCode is not directly used to get each group key’s hash code, because it does not handle null value very well in some cases. System.Nullable<T>.GetHashCode is such an example. ((int?)0).GetHashCode() and ((int?)null).GetHashCode() both return 0. So, the above GetHashCode method reserves -1 for null. And any non-null value’s hash code is converted to a positive int by a bitwise and operation with int.MaxValue (0b\_01111111\_11111111\_11111111\_11111111). Also notice the indexer getter outputs an empty sequence when the specified key does not exist. Similar to Grouping<TKey, TElement>.Add, the following Lookup<TKey, TElement>.AddRange is defined to add data:

public partial class Lookup<TKey, TElement\>
```
{
```
```
public Lookup<TKey, TElement> AddRange<TSource>(
```
```
IEnumerable<TSource>source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TSource, TElement> elementSelector,
```
```
bool skipNullKey = false)
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
TKey key = keySelector(value);
```
```
if (key == null &&skipNullKey)
```
```
{
```
```
continue;
```
```
}
```
```
int hashCode = this.GetHashCode(key);
```
```
if (this.groups.TryGetValue(hashCode, out Grouping<TKey, TElement> group))
```
```
{
```
```
group.Add(elementSelector(value));
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
this.groups.Add(hashCode, new Grouping<TKey, TElement>(key) { elementSelector(value) });
```
```
}
```
```
}
```
```
return this;
```
```
}
```

}

Now, ToLookup can be implemented by creating a lookup and adding all data:

public static ILookup<TKey, TElement\> ToLookup<TSource, TKey, TElement\>(
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
IEqualityComparer<TKey>comparer = null) =>
```
```
new Lookup<TKey, TElement>(comparer).AddRange(source, keySelector, elementSelector);
```
```
public static ILookup<TKey, TSource> ToLookup<TSource, TKey>(
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IEqualityComparer<TKey>comparer = null) =>
```

source.ToLookup(keySelector, value => value, comparer);

### Sequence queries

All sequence queries implement deferred execution. Most of them use follows the iterator pattern with a generator. For these queries, some are implemented with the yield syntactic sugar, and some are implemented with custom defined generator for performance improvement. Here, to make it intuitive and readable, all those queries’ implementation is demonstrated with yield.

### Conversion

AsEnumerable does nothing:

public static IEnumerable<TSource\> AsEnumerable<TSource\>(this IEnumerable<TSource\> source) =>

source; // Deferred execution.

With an IEnumerable<T> output, it just makes the source’s non-sequence methods (if any) not available. It also implements deferred execution, because calling AsEnumerable does not pull any value from source sequence.

Cast is very easy to implement with the generator syntactic sugar. Just yield each cast value:

public static IEnumerable<TResult\> Cast<TResult\>(this IEnumerable source)
```
{
```
```
foreach (object value in source)
```
```
{
```
```
yield return (TResult)value; // Deferred execution.
```
```
}
```

}

The built-in implementation does a little optimization. If the source is already a generic sequence of the specified result type, it can be directly returned. Logically it should be something like:

// Cannot be compiled.
```
public static IEnumerable<TResult> Cast<TResult>(this IEnumerable source)
```
```
{
```
```
if (source is IEnumerable<TResult> genericSource)
```
```
{
```
```
return genericSource;
```
```
}
```
```
foreach (object value in source)
```
```
{
```
```
yield return (TResult)value; // Deferred execution.
```
```
}
```

}

The above code cannot be compiled. The yield statement indicates the entire function body should be compiled to a generator, so the return statement cannot be used with yield statement. Similar to argument check, the solution is to isolate the iteration control flow with yield statement into another method or local function:

public static IEnumerable<TResult\> Cast<TResult\>(this IEnumerable source)
```
{
```
```
IEnumerable<TResult>CastGenerator()
```
```
{
```
```
foreach (object value in source)
```
```
{
```
```
yield return (TResult)value; // Deferred execution.
```
```
}
```
```
}
```
```
return source is IEnumerable<TResult> genericSource
```
```
? genericSource
```
```
: CastGenerator();
```

}

Cast also implements deferred execution. When it is called, its output is either the source sequence itself or a generator, without pulling values from source or execute the casting.

### Generation

Empty can be implemented with a single yield break statement, which is compiled to an empty generator:

public static IEnumerable<TResult\> EmptyGenerator<TResult\>()
```
{
```
```
yield break;
```

}

The built-in implementation actually uses an empty array, which has better performance than constructing a generator:

public static IEnumerable<TResult\> Empty<TResult\>() => Array.Empty<TResult\>();

Range can be simply implemented with a loop:

public static IEnumerable<int\> Range(int start, int count)
```
{
```
```
if (count < 0 || (((long)start) + count - 1L) > int.MaxValue)
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
IEnumerable<int>RangeGenerator()
```
```
{
```
```
int end = start + count;
```
```
for (int value = start; value != end; value++)
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
return RangeGenerator();
```

}

And Repeat has been discussed. The built-in implementation also checks the count argument, and uses an empty array when count is 0:

public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count)
```
{
```
```
if (count< 0)
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
if (count == 0)
```
```
{
```
```
return Empty<TResult>();
```
```
}
```
```
IEnumerable<TResult> RepeatGenerator()
```
```
{
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
yield return element; // Deferred execution.
```
```
}
```
```
}
```
```
return RepeatGenerator();
```

}

DefaultIfEmpty can be implemented with a desugared foreach loop to detect and iterate the source sequence:

public static IEnumerable<TSource\> DefaultIfEmpty<TSource\>(
```
this IEnumerable<TSource> source, TSource defaultValue = default)
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
// source is not empty.
```
```
do
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
while (iterator.MoveNext());
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
// source is empty.
```
```
yield return defaultValue; // Deferred execution.
```
```
}
```
```
}
```

}

The first MoveNext call detects if the source sequence is empty. If so, just yield the default value, otherwise yield all values in the source sequence.

### Filtering

Where is already discussed. The following are the non-indexed overload and index overload equivalent to the built-in implementation:

public static IEnumerable<TSource\> Where<TSource\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, bool> predicate)
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
if (predicate(value))
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
public static IEnumerable<TSource> Where<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate)
```
```
{
```
```
int index = -1;
```
```
foreach (TSource value in source)
```
```
{
```
```
index = checked(index + 1);
```
```
if (predicate(value, index))
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

Similarly, OfType has a type test to filter the source:

public static IEnumerable<TResult\> OfType<TResult\>(this IEnumerable source)
```
{
```
```
foreach (object value in source)
```
```
{
```
```
if (value is TResult)
```
```
{
```
```
yield return (TResult)value; // Deferred execution.
```
```
}
```
```
}
```

}

### Mapping

Select has also been discussed. The following are the non-indexed overload and index overload equivalent to the built-in implementation:

public static IEnumerable<TResult\> Select<TSource, TResult\>(
```
this IEnumerable<TSource> source, Func<TSource, TResult>selector)
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
yield return selector(value); // Deferred execution.
```
```
}
```
```
}
```
```
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```
this IEnumerable<TSource> source, Func<TSource, int, TResult> selector)
```
```
{
```
```
int index = -1;
```
```
foreach (TSource value in source)
```
```
{
```
```
index = checked(index + 1);
```
```
yield return selector(value, index); // Deferred execution.
```
```
}
```

}

The implementation of SelectMany is also straightforward:

public static IEnumerable<TResult\> SelectMany<TSource, TResult\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, IEnumerable<TResult>>selector)
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
foreach (TResult result in selector(value))
```
```
{
```
```
yield return result; // Deferred execution.
```
```
}
```
```
}
```

}

Above code intuitively shows its capacity to flatten a hierarchical 2-level-sequence to a flat 1-level-sequence. The following is the overload with collection selector and result selector:

public static IEnumerable<TResult\> SelectMany<TSource, TCollection, TResult\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, IEnumerable<TCollection>> collectionSelector,
```
```
Func<TSource, TCollection, TResult>resultSelector)
```
```
{
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
foreach (TCollection collectionValue in collectionSelector(sourceValue))
```
```
{
```
```
yield return resultSelector(sourceValue, collectionValue); // Deferred execution.
```
```
}
```
```
}
```

}

And the following are the indexed overloads:

public static IEnumerable<TResult\> SelectMany<TSource, TResult\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, int, IEnumerable<TResult>> selector)
```
```
{
```
```
int index = -1;
```
```
foreach (TSource value in source)
```
```
{
```
```
index = checked(index + 1);
```
```
foreach (TResult result in selector(value, index))
```
```
{
```
```
yield return result; // Deferred execution.
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
public static IEnumerable<TResult> SelectMany<TSource, TCollection, TResult>(
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, int, IEnumerable<TCollection>> collectionSelector,
```
```
Func<TSource, TCollection, TResult>resultSelector)
```
```
{
```
```
int index = -1;
```
```
foreach (TSource sourceValue in source)
```
```
{
```
```
index = checked(index + 1);
```
```
foreach (TCollection collectionValue in collectionSelector(sourceValue, index))
```
```
{
```
```
yield return resultSelector(sourceValue, collectionValue); // Deferred execution.
```
```
}
```
```
}
```

}

### Grouping

GroupBy’s work is similar to ToLookup, but with deferred execution. To implement deferred execution with ToLookup, the easiest way is to involve yield statement:

public static IEnumerable<IGrouping<TKey, TSource\>> GroupBy<TSource, TKey\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
ILookup<TKey, TSource> lookup = source.ToLookup(keySelector, comparer); // Eager evaluation.
```
```
foreach (IGrouping<TKey, TSource> group in lookup)
```
```
{
```
```
yield return group; // Deferred execution.
```
```
}
```

}

When starting to pull the first value from the returned generator, ToLookup is called to evaluate all source values and group them, so that the first group can be yielded. Apparently GroupBy implements eager evaluation. The overloads with element selector and resultSelector can all be implemented in the same pattern:

public static IEnumerable<IGrouping<TKey, TElement\>> GroupBy<TSource, TKey, TElement\>(
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
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
ILookup<TKey, TElement> lookup = source.ToLookup(keySelector, elementSelector, comparer); // Eager evaluation.
```
```
foreach (IGrouping<TKey, TElement> group in lookup)
```
```
{
```
```
yield return group; // Deferred execution.
```
```
}
```
```
}
```
```
public static IEnumerable<TResult> GroupBy<TSource, TKey, TResult>(
```
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
Func<TKey, IEnumerable<TSource>, TResult> resultSelector,
```
```
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
ILookup<TKey, TSource> lookup = source.ToLookup(keySelector, comparer); // Eager evaluation.
```
```
foreach (IGrouping<TKey, TSource> group in lookup)
```
```
{
```
```
yield return resultSelector(group.Key, group); // Deferred execution.
```
```
}
```
```
}
```
```
public static IEnumerable<TResult> GroupBy<TSource, TKey, TElement, TResult>(
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
Func<TKey, IEnumerable<TElement>, TResult> resultSelector,
```
```
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
ILookup<TKey, TElement> lookup = source.ToLookup(keySelector, elementSelector, comparer); // Eager evaluation.
```
```
foreach (IGrouping<TKey, TElement> group in lookup)
```
```
{
```
```
yield return resultSelector(group.Key, group); // Deferred execution.
```
```
}
```

}

### Join

Similar to GroupBy, GroupJoin for outer join can be simply implemented with the same pattern of ToLookup and yield:

public static IEnumerable<TResult\> GroupJoinWithLookup<TOuter, TInner, TKey, TResult\>(
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
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
ILookup<TKey, TInner> innerLookup = inner.ToLookup(innerKeySelector, comparer); // Eager evaluation.
```
```
foreach (TOuter outerValue in outer)
```
```
{
```
```
yield return resultSelector(outerValue, innerLookup[outerKeySelector(outerValue)]); // Deferred execution.
```
```
}
```

}

When trying to pull the first value from the returned generator, the inner values are grouped by the keys, and stored in the inner lookup. Then, for each outer value, query the inner lookup by key. Remember when a lookup is queried with a key, it always outputs a sequence, even when the key does not exist, it returns an empty sequence. So that in GroupJoin, each outer value is always paired with a group of inner values. The above implementation is straightforward, but the inner source is always pulled, even when the outer source is empty. This can be avoided by a little optimization:

public static IEnumerable<TResult\> GroupJoin<TOuter, TInner, TKey, TResult\>(
```
this IEnumerable<TOuter> outer,
```
```
IEnumerable<TInner> inner,
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
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
using (IEnumerator<TOuter> outerIterator = outer.GetEnumerator())
```
```
{
```
```
if (outerIterator.MoveNext())
```
```
{
```
```
Lookup<TKey, TInner> innerLookup = new Lookup<TKey, TInner>(comparer).AddRange(
```
```
inner, innerKeySelector, innerValue => innerValue, skipNullKey: true); // Eager evaluation.
```
```
do
```
```
{
```
```
TOuter outerValue = outerIterator.Current;
```
```
yield return resultSelector(outerValue, innerLookup[outerKeySelector(outerValue)]); // Deferred execution.
```
```
}
```
```
while (outerIterator.MoveNext());
```
```
}
```
```
}
```

}

Similar to DefaultIfEmpty, the first MoveNext call detects if the outer source is empty. Only if not, the inner values are pulled and converted to a lookup.

Join for inner join can also be implemented with the similar pattern:

public static IEnumerable<TResult\> JoinWithToLookup<TOuter, TInner, TKey, TResult\>(
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
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
ILookup<TKey, TInner> innerLookup = inner.ToLookup(innerKeySelector, comparer); // Eager evaluation.
```
```
foreach (TOuter outerValue in outer)
```
```
{
```
```
TKey key = outerKeySelector(outerValue);
```
```
if (innerLookup.Contains(key))
```
```
{
```
```
foreach (TInner innerValue in innerLookup[key])
```
```
{
```
```
yield return resultSelector(outerValue, innerValue); // Deferred execution.
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

It calls the ILookup<TKey, TElement>.Contains filter, because in inner join each outer value has to be paired with a matching inner value. Again, the above implementation can be optimized, so that the inner values are not pulled and converted to lookup when the outer source is empty:

public static IEnumerable<TResult\> Join<TOuter, TInner, TKey, TResult\>(
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
IEqualityComparer<TKey>comparer = null)
```
```
{
```
```
using (IEnumerator<TOuter> outerIterator = outer.GetEnumerator())
```
```
{
```
```
if (outerIterator.MoveNext())
```
```
{
```
```
Lookup<TKey, TInner> innerLookup = new Lookup<TKey, TInner>(comparer).AddRange(
```
```
inner, innerKeySelector, innerValue => innerValue, skipNullKey: true); // Eager evaluation.
```
```
if (innerLookup.Count> 0)
```
```
{
```
```
do
```
```
{
```
```
TOuter outerValue = outerIterator.Current;
```
```
TKey key = outerKeySelector(outerValue);
```
```
if (innerLookup.Contains(key))
```
```
{
```
```
foreach (TInner innerValue in innerLookup[key])
```
```
{
```
```
yield return resultSelector(outerValue, innerValue); // Deferred execution.
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
while (outerIterator.MoveNext());
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

### Concatenation

Concat’s implementation is equivalent to yield values from the first source sequence, then yield values from the from the second:

public static IEnumerable<TSource\> Concat<TSource\>(
```
this IEnumerable<TSource> first, IEnumerable<TSource> second)
```
```
{
```
```
foreach (TSource value in first)
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
foreach (TSource value in second)
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

Append and Prepend’s implementation is equivalent to the following, with similar pattern:

public static IEnumerable<TSource\> Append<TSource\>(this IEnumerable<TSource\> source, TSource element)
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
yield return value;
```
```
}
```
```
yield return element;
```
```
}
```
```
public static IEnumerable<TSource> Prepend<TSource>(this IEnumerable<TSource> source, TSource element)
```
```
{
```
```
yield return element;
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return value;
```
```
}
```

}

### Set

All the set queries need to remove duplicate values in the result sequence. So, the following hash set is defined to represent a collection of distinct values. The duplication of values can be identified by their hash codes, so a dictionary can be used to store distinct hash code and value pairs:

public partial class HashSet<T\> : IEnumerable<T\>
```
{
```
```csharp
private readonly IEqualityComparer<T> equalityComparer;
```

```csharp
private readonly Dictionary<int, T>dictionary = new Dictionary<int, T>();
```
```
public HashSet(IEqualityComparer<T> equalityComparer = null) =>
```
```
this.equalityComparer = equalityComparer ?? EqualityComparer<T>.Default;
```
```
public IEnumerator<T> GetEnumerator() => this.dictionary.Values.GetEnumerator();
```
```
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

}

Then, the following Add and AddRange methods can be defined:

public partial class HashSet<T\>
```
{
```
```csharp
private int GetHashCode(T value) => value == null
```
```
? -1
```
```
: this.equalityComparer.GetHashCode(value) & int.MaxValue;
```
```
// int.MaxValue is 0b_01111111_11111111_11111111_11111111, so the result of & is always > -1.
```
```
public bool Add(T value)
```
```
{
```
```
int hashCode = this.GetHashCode(value);
```
```
if (this.dictionary.ContainsKey(hashCode))
```
```
{
```
```
return false;
```
```
}
```
```
this.dictionary.Add(hashCode, value);
```
```
return true;
```
```
}
```
```
public HashSet<T> AddRange(IEnumerable<T> values)
```
```
{
```
```
foreach (T value in values)
```
```
{
```
```
this.Add(value);
```
```
}
```
```
return this;
```
```
}
```

}

When Add is called with a specified value, if there is already a duplicate hash code in the internal dictionary, the specified value is not stored in the dictionary and false is returned; otherwise, the specified value and its hash code are added to the internal dictionary, and true is returned. With above hash set, it is very easy to implement Distinct.

public static IEnumerable<TSource\> Distinct<TSource\>(
```
this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer = null)
```
```
{
```
```
HashSet<TSource>hashSet = new HashSet<TSource>(comparer);
```
```
foreach (TSource value in source)
```
```
{
```
```
if (hashSet.Add(value))
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

Union can be implemented by filtering the first source sequence with HashSet<T>.Add, then filter the second source sequence with HashSet<T>.Add:

public static IEnumerable<TSource\> Union<TSource\>(
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
IEqualityComparer<TSource>comparer = null)
```
```
{
```
```
HashSet<TSource>hashSet = new HashSet<TSource>(comparer);
```
```
foreach (TSource firstValue in first)
```
```
{
```
```
if (hashSet.Add(firstValue))
```
```
{
```
```
yield return firstValue; // Deferred execution.
```
```
}
```
```
}
```
```
foreach (TSource secondValue in second)
```
```
{
```
```
if (hashSet.Add(secondValue))
```
```
{
```
```
yield return secondValue; // Deferred execution.
```
```
}
```
```
}
```

}

Except can be implemented with the same pattern of filtering with HashSet<T>.Add:

public static IEnumerable<TSource\> Except<TSource\>(
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
IEqualityComparer<TSource>comparer = null)
```
```
{
```
```
HashSet<TSource>secondHashSet = new HashSet<TSource>(comparer).AddRange(second); // Eager evaluation.
```
```
foreach (TSource firstValue in first)
```
```
{
```
```
if (secondHashSet.Add(firstValue))
```
```
{
```
```
yield return firstValue; // Deferred execution.
```
```
}
```
```
}
```

}

When trying to pull the first value from the returned generator, values in the second sequence are eagerly evaluated and stored in a hash set, which is then used to filter the first sequence.

And Intersect can also be implemented with this pattern:

public static IEnumerable<TSource\> IntersectWithAdd<TSource\>(
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
IEqualityComparer<TSource>comparer = null)
```
```
{
```
```
HashSet<TSource>secondHashSet = new HashSet<TSource>(comparer).AddRange(second); // Eager evaluation.
```
```
HashSet<TSource> firstHashSet = new HashSet<TSource>(comparer);
```
```
foreach (TSource firstValue in first)
```
```
{
```
```
if (secondHashSet.Add(firstValue))
```
```
{
```
```
firstHashSet.Add(firstValue);
```
```
}
```
```
else if (firstHashSet.Add(firstValue))
```
```
{
```
```
yield return firstValue; // Deferred execution.
```
```
}
```
```
}
```

}

To simplify above implementation, A Remove method can be defined for hash set:

public partial class HashSet<T\>
```
{
```
```
public bool Remove(T value)
```
```
{
```
```
int hasCode = this.GetHashCode(value);
```
```
if (this.dictionary.ContainsKey(hasCode))
```
```
{
```
```
this.dictionary.Remove(hasCode);
```
```
return true;
```
```
}
```
```
return false;
```
```
}
```

}

Similar to Add, here if a value is found and removed, Remove outputs true; otherwise, Remove outputs false. So, Intersect can be implemented by filtering with Remove:

public static IEnumerable<TSource\> Intersect<TSource\>(
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
IEqualityComparer<TSource>comparer = null)
```
```
{
```
```
HashSet<TSource>secondHashSet = new HashSet<TSource>(comparer).AddRange(second); // Eager evaluation.
```
```
foreach (TSource firstValue in first)
```
```
{
```
```
if (secondHashSet.Remove(firstValue))
```
```
{
```
```
yield return firstValue; // Deferred execution.
```
```
}
```
```
}
```

}

### Convolution

Zip is easy to implement with a desugared foreach:

public static IEnumerable<TResult\> Zip<TFirst, TSecond, TResult\>(
```
this IEnumerable<TFirst> first,
```
```
IEnumerable<TSecond>second,
```
```
Func<TFirst, TSecond, TResult>resultSelector)
```
```
{
```
```
using (IEnumerator<TFirst> firstIterator = first.GetEnumerator())
```
```
using (IEnumerator<TSecond> secondIterator = second.GetEnumerator())
```
```
{
```
```
while (firstIterator.MoveNext() && secondIterator.MoveNext())
```
```
{
```
```
yield return resultSelector(firstIterator.Current, secondIterator.Current); // Deferred execution.
```
```
}
```
```
}
```

}

It stops yielding result when one of those 2 source sequences reaches the end.

### Partitioning

Skip is easy to implement:

public static IEnumerable<TSource\> Skip<TSource\>(this IEnumerable<TSource\> source, int count)
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
if (count > 0)
```
```
{
```
```
count--;
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
yield return value;
```
```
}
```
```
}
```

}

It can be optimized a little bit by desugaring the foreach loop, so that when a value should be skipped, only the source iterator’s MoveNext method is called.

public static IEnumerable<TSource\> Skip<TSource\>(this IEnumerable<TSource\> source, int count)
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
while (count > 0 && iterator.MoveNext())
```
```
{
```
```
count--; // Comparing foreach loop, iterator.Current is not called.
```
```
}
```
```
if (count <= 0)
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
```
}
```

}

In contrast, SkipWhile has to pull each value from source sequence to call predicate, so there is no need to desugar foreach. The following are the non-index overload and indexed overload:

public static IEnumerable<TSource\> SkipWhile<TSource\>(
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```
{
```
```
bool skip = true;
```
```
foreach (TSource value in source)
```
```
{
```
```
if (skip && !predicate(value))
```
```
{
```
```
skip = false;
```
```
}
```
```
if (!skip)
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
public static IEnumerable<TSource> SkipWhile<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate)
```
```
{
```
```
int index = -1;
```
```
bool skip = true;
```
```
foreach (TSource value in source)
```
```
{
```
```
index = checked(index + 1);
```
```
if (skip && !predicate(value, index))
```
```
{
```
```
skip = false;
```
```
}
```
```
if (!skip)
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

Take is also straightforward:

public static IEnumerable<TSource\> Take<TSource\>(this IEnumerable<TSource\> source, int count)
```
{
```
```
if (count > 0)
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
if (--count == 0)
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
```
}
```

}

And the following are TakeWhile’s non-indexed overload and indexed overload:

public static IEnumerable<TSource\> TakeWhile<TSource\>(
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
if (!predicate(value))
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
public static IEnumerable<TSource> TakeWhile<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate)
```
```
{
```
```
int index = -1;
```
```
foreach (TSource value in source)
```
```
{
```
```
index = checked(index + 1);
```
```
if (!predicate(value, index))
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

}

### Ordering

Reverse has been discussed:

public static IEnumerable<TSource\> Reverse<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
TSource[] array = ToArray(source); // Eager evaluation.
```
```
for (int index = array.Length - 1; index >= 0; index--)
```
```
{
```
```
yield return array[index]; // Deferred execution.
```
```
}
```

}

The other ordering queries are implemented very differently because they involve the IOrderedEnumerable<T> interface. Again here are the signatures:

public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer);
```
```
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```

this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer);

And once again the following is the definition of IOrderedEnumerable<T>:

namespace System.Linq
```
{
```
```
public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
```
```
{
```
```
IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(
```
```
Func<TElement, TKey> keySelector, IComparer<TKey>comparer, bool descending);
```
```
}
```

}

Its implementation is a little complex. The following is a simplified version but equivalent to the built-in implementation:

internal class OrderedSequence<TSource, TKey\> : IOrderedEnumerable<TSource\>
```
{
```
```csharp
private readonly IEnumerable<TSource> source;
```

```csharp
private readonly IComparer<TKey> comparer;
```

```csharp
private readonly bool descending;
```

```csharp
private readonly Func<TSource, TKey> keySelector;
```

```csharp
private readonly Func<TSource[], Func<int, int, int>> previousGetComparison;
```
```
internal OrderedSequence(
```
```
IEnumerable<TSource>source,
```
```
Func<TSource, TKey> keySelector,
```
```
IComparer<TKey>comparer,
```
```
bool descending = false,
```
```
// previousGetComparison is only specified in CreateOrderedEnumerable,
```
```
// and CreateOrderedEnumerable is only called by ThenBy/ThenByDescending.
```
```
// When OrderBy/OrderByDescending is called, previousGetComparison is not specified.
```
```
Func<TSource[], Func<int, int, int>> previousGetComparison = null)
```
```
{
```
```
this.source = source;
```
```
this.keySelector = keySelector;
```
```
this.comparer = comparer ?? Comparer<TKey>.Default;
```
```
this.descending = descending;
```
```
this.previousGetComparison = previousGetComparison;
```
```
}
```
```
public IEnumerator<TSource> GetEnumerator()
```
```
{
```
```
TSource[] values = this.source.ToArray(); // Eager evaluation.
```
```
int count = values.Length;
```
```
if (count <= 0)
```
```
{
```
```
yield break;
```
```
}
```
```
int[] indexMap = new int[count];
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
indexMap[index] = index;
```
```
}
```
```
// GetComparison is only called once for each generator instance.
```
```
Func<int, int, int> comparison = this.GetComparison(values);
```
```
Array.Sort(indexMap, (index1, index2) => // index1 < index2
```
```
{
```
```
// Format compareResult.
```
```
// When compareResult is 0 (equal), return index1 - index2,
```
```
// so that indexMap[index1] is before indexMap[index2],
```
```
// 2 equal values' original order is preserved.
```
```
int compareResult = comparison(index1, index2);
```
```
return compareResult == 0 ? index1 - index2 : compareResult;
```
```
}); // More eager evaluation.
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
yield return values[indexMap[index]];
```
```
}
```
```
}
```
```
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```
```
// Only called by ThenBy/ThenByDescending.
```
```
public IOrderedEnumerable<TSource> CreateOrderedEnumerable<TNextKey>
```
```
(Func<TSource, TNextKey> nextKeySelector, IComparer<TNextKey> nextComparer, bool nextDescending) =>
```
```
new OrderedSequence<TSource, TNextKey>(
```
```
this.source, nextKeySelector, nextComparer, nextDescending, this.GetComparison);
```

```csharp
private TKey[] GetKeys(TSource[] values)
```
```
{
```
```
int count = values.Length;
```
```
TKey[] keys = new TKey[count];
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
keys[index] = this.keySelector(values[index]);
```
```
}
```
```
return keys;
```
```
}
```

```csharp
private Func<int, int, int> GetComparison(TSource[] values)
```
```
{
```
```
// GetComparison is only called once for each generator instance,
```
```
// so GetKeys is only called once during the ordering query execution.
```
```
TKey[] keys = this.GetKeys(values);
```
```
if (this.previousGetComparison == null)
```
```
{
```
```
// In OrderBy/OrderByDescending.
```
```
return (index1, index2) =>
```
```
// OrderBy/OrderByDescending always need to compare keys of 2 values.
```
```
this.CompareKeys(keys, index1, index2);
```
```
}
```
```
// In ThenBy/ThenByDescending.
```
```
Func<int, int, int> previousComparison = this.previousGetComparison(values);
```
```
return (index1, index2) =>
```
```
{
```
```
// Only when previousCompareResult is 0 (equal),
```
```
// ThenBy/ThenByDescending needs to compare keys of 2 values.
```
```
int previousCompareResult = previousComparison(index1, index2);
```
```
return previousCompareResult == 0
```
```
? this.CompareKeys(keys, index1, index2)
```
```
: previousCompareResult;
```
```
};
```
```
}
```

```csharp
private int CompareKeys(TKey[] keys, int index1, int index2)
```
```
{
```
```
// Format compareResult to always be 0, -1, or 1.
```
```
int compareResult = this.comparer.Compare(keys[index1], keys[index2]);
```
```
return compareResult == 0
```
```
? 0
```
```
: (this.descending ? (compareResult > 0 ? -1 : 1) : (compareResult > 0 ? 1 : -1));
```
```
}
```

}

Now the ordering queries can be implemented by constructing the above ordered sequence:

public static IOrderedEnumerable<TSource\> OrderBy<TSource, TKey\>(
```
this IEnumerable<TSource> source,
```
```
Func<TSource, TKey> keySelector,
```
```
IComparer<TKey>comparer = null) =>
```
```
new OrderedSequence<TSource, TKey>(source, keySelector, comparer);
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
IComparer<TKey>comparer = null) =>
```
```
new OrderedSequence<TSource, TKey>(source, keySelector, comparer, descending: true);
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
IComparer<TKey>comparer = null) =>
```
```
source.CreateOrderedEnumerable(keySelector, comparer, descending: false);
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
IComparer<TKey>comparer = null) =>
```

source.CreateOrderedEnumerable(keySelector, comparer, descending: true);

They implement deferred execution since constructing ordered sequence does not pull any value from the source. The OrderedSequence<T> type wraps the source data and iteration algorithm of ordering, including:

· the source sequence,

· the keySelector function,

· a bool value indicating the ordering should be descending or ascending

· a previousGetComparison function, which identifies whether current OrderedSequence<T> is created by OrderBy/OrderByDescending, or by ThenBy/ThenByDescending

o When OrderBy/OrderByDescending are called, they directly instantiate an OrderedSequence<T> with a null previousGetComparison function.

o When ThenBy/ThenByDescending are called, they call CreateOrderedEnumerable to instantiate OrderedSequence<T>, and pass its OrderedSequence<T>’s GetComparison method as the previousGetComparison function for the new OrderedSequence<T>.

OrderedSequence<T>’s GetEnumerator method uses yield statement to return an iterator (not generator this time). Eager evaluation is implemented, because it has to pull all values in the source sequence and sort them, in order to know which value is the first one to yield. For performance consideration, instead of sorting the values from source sequence, here the indexes of values are sorted. For example, in the values array, if indexes { 0, 1, 2 } become { 2, 0, 1 } after sorting, then the values are yielded in the order of { values\[2\], values\[0\], values\[1\] }.

When the eager evaluation starts, GetComparison is called. It evaluates all keys of the values, and returns a comparison function:

· If previousGetComparison function is null, it returns a comparison function to represent an OrderBy/OrderByDescending query, which just compares the keys.

· if previousGetComparison function is not null, it returns a comparison function to represent a ThenBy/ThenByDescending query, which first check the previous compare result, and only compare the keys when previous compare result is equal.

· In both cases, comparison function calls CompareKeys to compare 2 keys. CompareKeys calls IComparer<TKey>.Compare, and format the compare result to 0, -1, or 1 to represent less then, equal to, greater than. If the descending field is true, 1 and -1 are swapped.

Eventually, the returned comparison function is used during GetEnumerator’s eager evaluation, to sort the indexes of values. When comparing keys for index1 and index2, index1 is always less than index2. In another word, values\[index1\] is before values\[index2\] before the ordering query execution. If the result from comparison function is equal, index1 - index2 is used instead of 0. So that the relative positions of values at index1 and index2 are preserved, values\[index1\] is still before values\[index2\] after the ordering query execution.

### Value queries

This category of queries iterate the source sequence. They apparently implement immediate execution.

### Element

First can be implemented by pulling the source sequence once. The built-in implementation has some optimization. If the source already supports index, then source\[0\] can be pulled directly. The index support can be identified by testing if source also implements IList<T>:

namespace System.Collections.Generic
```
{
```
```
public interface IList<T> : ICollection<T>, IEnumerable<T>, IEnumerable
```
```
{
```
```
T this[int index] { get; set; }
```
```
int IndexOf(T item);
```
```
void Insert(int index, T item);
```
```
void RemoveAt(int index);
```
```
}
```

}

As fore mentioned, IList<T> is implemented by T\[\] array, List<T>, and Collection<T>, etc. So, the following is an optimized implementation of First:

public static TSource First<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
if (list.Count > 0)
```
```
{
```
```
return list[0];
```
```
}
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
foreach (TSource value in source)
```
```
{
```
```
return value;
```
```
}
```
```
}
```
```
throw new InvalidOperationException("Sequence contains no elements.");
```

}

The other overload with predicate is also easy to implement:

public static TSource First<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate)
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
if (predicate(value))
```
```
{
```
```
return value;
```
```
}
```
```
}
```
```
throw new InvalidOperationException("Sequence contains no matching element.");
```

}

The implementation of FirstOrDefault is very similar. When source is empty, just output the default value instead of throwing exception:

public static TSource FirstOrDefault<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
if (list.Count > 0)
```
```
{
```
```
return list[0];
```
```
}
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
foreach (TSource value in source)
```
```
{
```
```
return value;
```
```
}
```
```
}
```
```
return default;
```
```
}
```
```
public static TSource FirstOrDefault<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
if (predicate(value))
```
```
{
```
```
return value;
```
```
}
```
```
}
```
```
return default;
```

}

Last and LastOrDefault can be implemented in the similar pattern, with desugared foreach loop:

public static TSource Last<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
int count = list.Count;
```
```
if (count > 0)
```
```
{
```
```
return list[count - 1];
```
```
}
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
TSource last;
```
```
do
```
```
{
```
```
last = iterator.Current;
```
```
}
```
```
while (iterator.MoveNext());
```
```
return last;
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```
}
```
```
public static TSource Last<TSource>(this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
for (int index = list.Count - 1; index >= 0; index--)
```
```
{
```
```
TSource value = list[index];
```
```
if (predicate(value))
```
```
{
```
```
return value;
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
else
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
while (iterator.MoveNext())
```
```
{
```
```
TSource last = iterator.Current;
```
```
if (predicate(last))
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
TSource value = iterator.Current;
```
```
if (predicate(value))
```
```
{
```
```
last = value;
```
```
}
```
```
}
```
```
return last;
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
throw new InvalidOperationException("Sequence contains no matching element.");
```
```
}
```
```
public static TSource LastOrDefault<TSource>(this IEnumerable<TSource> source)
```
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
int count = list.Count;
```
```
if (count > 0)
```
```
{
```
```
return list[count - 1];
```
```
}
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
TSource last;
```
```
do
```
```
{
```
```
last = iterator.Current;
```
```
}
```
```
while (iterator.MoveNext());
```
```
return last;
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
return default;
```
```
}
```
```
public static TSource LastOrDefault<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
for (int index = list.Count - 1; index >= 0; index--)
```
```
{
```
```
TSource value = list[index];
```
```
if (predicate(value))
```
```
{
```
```
return value;
```
```
}
```
```
}
```
```
return default;
```
```
}
```
```
TSource last = default;
```
```
foreach (TSource value in source)
```
```
{
```
```
if (predicate(value))
```
```
{
```
```
last = value;
```
```
}
```
```
}
```
```
return last;
```

}

And ElementAt and ElementAtOrDefault too:

public static TSource ElementAt<TSource\>(this IEnumerable<TSource\> source, int index)
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
return list[index];
```
```
}
```
```
if (index < 0)
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
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
if (index-- == 0)
```
```
{
```
```
return iterator.Current;
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
throw new ArgumentOutOfRangeException(nameof(index));
```
```
}
```
```
public static TSource ElementAtOrDefault<TSource>(this IEnumerable<TSource>source, int index)
```
```
{
```
```
if (index >= 0)
```
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
if (index < list.Count)
```
```
{
```
```
return list[index];
```
```
}
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
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
if (index-- == 0)
```
```
{
```
```
return iterator.Current;
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
}
```
```
return default;
```

}

Single and SingleOrDefault are stricter:

public static TSource Single<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
switch (list.Count)
```
```
{
```
```
case 0:
```
```
throw new InvalidOperationException("Sequence contains no elements.");
```
```
case 1:
```
```
return list[0];
```
```
}
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
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```
{
```
```
if (!iterator.MoveNext()) // source is empty.
```
```
{
```
```
throw new InvalidOperationException("Sequence contains no elements.");
```
```
}
```
```
TSource first = iterator.Current;
```
```
if (!iterator.MoveNext())
```
```
{
```
```
return first;
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
throw new InvalidOperationException("Sequence contains more than one element.");
```
```
}
```
```
public static TSource Single<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
while (iterator.MoveNext())
```
```
{
```
```
TSource value = iterator.Current;
```
```
if (predicate(value))
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
if (predicate(iterator.Current))
```
```
{
```
```
throw new InvalidOperationException("Sequence contains more than one matching element.");
```
```
}
```
```
}
```
```
return value;
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
throw new InvalidOperationException("Sequence contains no matching element.");
```
```
}
```
```
public static TSource SingleOrDefault<TSource>(this IEnumerable<TSource>source)
```
```
{
```
```
if (source is IList<TSource>list)
```
```
{
```
```
switch (list.Count)
```
```
{
```
```
case 0:
```
```
return default;
```
```
case 1:
```
```
return list[0];
```
```
}
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
TSource first = iterator.Current;
```
```
if (!iterator.MoveNext())
```
```
{
```
```
return first;
```
```
}
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
return default;
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
throw new InvalidOperationException("Sequence contains more than one element.");
```
```
}
```
```
public static TSource SingleOrDefault<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
while (iterator.MoveNext())
```
```
{
```
```
TSource value = iterator.Current;
```
```
if (predicate(value))
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
if (predicate(iterator.Current))
```
```
{
```
```
throw new InvalidOperationException("Sequence contains more than one matching element.");
```
```
}
```
```
}
```
```
return value;
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
return default;
```

}

### Aggregation

Aggregate pulls all values from source and accumulate them:

public static TResult Aggregate<TSource, TAccumulate, TResult\>(
```
this IEnumerable<TSource> source,
```
```
TAccumulate seed,
```
```
Func<TAccumulate, TSource, TAccumulate>func,
```
```
Func<TAccumulate, TResult> resultSelector)
```
```
{
```
```
TAccumulate accumulate = seed;
```
```
foreach (TSource value in source)
```
```
{
```
```
accumulate = func(accumulate, value);
```
```
}
```
```
return resultSelector(accumulate);
```
```
}
```
```
public static TAccumulate Aggregate<TSource, TAccumulate>(
```
```
this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func)
```
```
{
```
```
TAccumulate accumulate = seed;
```
```
foreach (TSource value in source)
```
```
{
```
```
accumulate = func(accumulate, value);
```
```
}
```
```
return accumulate;
```
```
}
```
```
public static TSource Aggregate<TSource>(
```
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
throw new InvalidOperationException("Sequence contains no elements.");
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
accumulate = func(accumulate, iterator.Current);
```
```
}
```
```
return accumulate;
```
```
}
```

}

Count can be implemented by iterating the source sequence. And if the source sequence is a collection, then it has a Count property:

public static int Count<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
switch (source)
```
```
{
```
```
case ICollection<TSource> genericCollection:
```
```
return genericCollection.Count;
```
```
case ICollection collection:
```
```
return collection.Count;
```
```
default:
```
```
int count = 0;
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
count = checked(count + 1); // Comparing foreach loop, iterator.Current is never called.
```
```
}
```
```
}
```
```
return count;
```
```
}
```

}

And the overload with predicate can be implemented by filtering with the predicate function:

public static int Count<TSource\>(
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```
{
```
```
int count = 0;
```
```
foreach (TSource value in source)
```
```
{
```
```
if (predicate(value))
```
```
{
```
```
count = checked(count + 1);
```
```
}
```
```
}
```
```
return count;
```

}

LongCount cannot use collections’ Count property because it has int output. It simply counts the values:

public static long LongCount<TSource\>(this IEnumerable<TSource\> source)
```
{
```
```
long count = 0L;
```
```
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
count = checked(count + 1L); // Comparing foreach loop, iterator.Current is never called.
```
```
}
```
```
}
```
```
return count;
```
```
}
```
```
public static long LongCount<TSource>(
```
```
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```
{
```
```
long count = 0L;
```
```
foreach (TSource value in source)
```
```
{
```
```
if (predicate(value))
```
```
{
```
```
count = checked(count + 1L);
```
```
}
```
```
}
```
```
return count;
```

}

Regarding the naming of LongCount .NET Framework Design Guidelines’ General Naming Conventions says:

DO use a generic CLR type name, rather than a language-specific name.

It would be more consistent if LongCount was named as Int64Count, just like Convert.ToInt64, etc.

Min has 22 overloads; the following is the overload for decimal:

public static decimal Min(this IEnumerable<decimal\> source)
```
{
```
```
decimal min;
```
```
using (IEnumerator<decimal> iterator = source.GetEnumerator())
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```
}
```
```
min = iterator.Current;
```
```
while (iterator.MoveNext())
```
```
{
```
```
decimal value = iterator.Current;
```
```
if (value < min)
```
```
{
```
```
min = value;
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
return min;
```

}

And the decimal overload with selector can be implemented with Select:

public static decimal Min<TSource\>(

this IEnumerable<TSource\> source, Func<TSource, decimal\>selector) => source.Select(selector).Min();

Max also has 22 overloads. The overload for decimal without and with selector can be implemented with the same pattern:

public static decimal Max(this IEnumerable<decimal\> source)
```
{
```
```
decimal max;
```
```
using (IEnumerator<decimal> iterator = source.GetEnumerator())
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```
}
```
```
max = iterator.Current;
```
```
while (iterator.MoveNext())
```
```
{
```
```
decimal value = iterator.Current;
```
```
if (value > max)
```
```
{
```
```
max = value;
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
return max;
```
```
}
```
```
public static decimal Max<TSource>(
```

this IEnumerable<TSource\> source, Func<TSource, decimal\>selector) => source.Select(selector).Max();

Sum/Average has 20 overloads each. Also take the decimal overloads as example:

public static decimal Sum(this IEnumerable<decimal\> source)
```
{
```
```
decimal sum = 0;
```
```
foreach (decimal value in source)
```
```
{
```
```
sum += value;
```
```
}
```
```
return sum;
```
```
}
```
```
public static decimal Sum<TSource>(this IEnumerable<TSource> source, Func<TSource, decimal> selector) =>
```
```
source.Select(selector).Sum();
```
```
public static decimal Average<TSource>(this IEnumerable<TSource>source, Func<TSource, decimal> selector)
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```
}
```
```
decimal sum = selector(iterator.Current);
```
```
long count = 1L;
```
```
while (iterator.MoveNext())
```
```
{
```
```
sum += selector(iterator.Current);
```
```
count++;
```
```
}
```
```
return sum / count;
```
```
}
```

}

### Quantifier

All, Any, and Contains has a bool output. They can be implemented in a similar foreach-if pattern:

public static bool All<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate)
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
if (!predicate(value))
```
```
{
```
```
return false;
```
```
}
```
```
}
```
```
return true;
```
```
}
```
```
public static bool Any<TSource>(this IEnumerable<TSource>source, Func<TSource, bool> predicate)
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
if (predicate(value))
```
```
{
```
```
return true;
```
```
}
```
```
}
```
```
return false;
```
```
}
```
```
public static bool Any<TSource>(this IEnumerable<TSource>source)
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
return iterator.MoveNext(); // Not needed to call iterator.Current.
```
```
}
```
```
}
```
```
public static bool Contains<TSource>(
```
```
this IEnumerable<TSource> source,
```
```
TSource value,
```
```
IEqualityComparer<TSource>comparer = null)
```
```
{
```
```
if (comparer == null &&source is ICollection<TSource> collection)
```
```
{
```
```
return collection.Contains(value);
```
```
}
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
if (comparer.Equals(sourceValue, value))
```
```
{
```
```
return true;
```
```
}
```
```
}
```
```
return false;
```

}

Contains can be optimized a little bit because collection already has a Contains method.

### Equality

The implementation of SequenceEqual is a little similar to Zip, where 2 source sequences are iterated at the same time. They are equal only when their counts are equal, and their values at each index are equal:

public static bool SequenceEqual<TSource\>(
```
this IEnumerable<TSource> first,
```
```
IEnumerable<TSource>second,
```
```
IEqualityComparer<TSource>comparer = null)
```
```
{
```
```
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```
if (first is ICollection<TSource> firstCollection && second is ICollection<TSource>secondCollection
```
```
&& firstCollection.Count != secondCollection.Count)
```
```
{
```
```
return false;
```
```
}
```
```
using (IEnumerator<TSource> firstIterator = first.GetEnumerator())
```
```
using (IEnumerator<TSource> secondIterator = second.GetEnumerator())
```
```
{
```
```
while (firstIterator.MoveNext())
```
```
{
```
```
if (!secondIterator.MoveNext() || !comparer.Equals(firstIterator.Current, secondIterator.Current))
```
```
{
```
```
return false;
```
```
}
```
```
}
```
```
return !secondIterator.MoveNext();
```
```
}
```

}

## Summary

This chapter discusses iterator pattern, and its implementation with the yield syntactic sugar. In LINQ to Objects, collection queries and value queries implements immediate execution, and sequence queries implements deferred execution following the iterator pattern, which is either lazy evaluation, or eager evaluation. Based on these concepts, this chapter demonstrates the implementation of LINQ to Objects queries in an equivalent and readable way. With the understanding of queries’ internal implementation, you should have a good understanding of LINQ to Objects standard queries, and be able to use them effectively.