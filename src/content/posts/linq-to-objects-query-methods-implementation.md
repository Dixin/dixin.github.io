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

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```csharp
{
```
```csharp
if (source == null)
```
```csharp
{
```
```csharp
throw new ArgumentNullException(nameof(source));
```
```csharp
}
```
```csharp
if (selector == null)
```
```csharp
{
```
```csharp
throw new ArgumentNullException(nameof(selector));
```
```csharp
}
```

```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return selector(value); // Deferred execution.
```
```csharp
}
```

}

Its arguments are expected to be checked immediately when it is called. However, the check is deferred. When it is called, it only constructs the following generator:

internal static IEnumerable<TResult> CompiledSelectWithDeferredCheck<TSource, TResult>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```csharp
{
```
```csharp
IEnumerator<TSource> sourceIterator = null;
```
```csharp
return new Generator<TResult>(
```
```csharp
start: () =>
```
```csharp
{
```
```csharp
if (source == null)
```
```csharp
{
```
```csharp
throw new ArgumentNullException(nameof(source));
```
```csharp
}
```

```csharp
if (selector == null)
```
```csharp
{
```
```csharp
throw new ArgumentNullException(nameof(selector));
```
```csharp
}
```

```csharp
sourceIterator = source.GetEnumerator();
```
```csharp
},
```
```csharp
moveNext: () => sourceIterator.MoveNext(),
```
```csharp
getCurrent: () => selector(sourceIterator.Current),
```
```csharp
dispose: () => sourceIterator?.Dispose());
```

}

The argument check is deferred to execute when starting to pull the results from the output sequence. The easiest solution is simply isolating yield statement along with its iteration control flow, which is compiled to deferred execution, with a separate method or a local function:

internal static IEnumerable<TResult> SelectWithCheck<TSource, TResult>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```csharp
{
```
```csharp
if (source == null) // Immediate execution.
```
```csharp
{
```
```csharp
throw new ArgumentNullException(nameof(source));
```
```csharp
}
```
```csharp
if (selector == null) // Immediate execution.
```
```csharp
{
```
```csharp
throw new ArgumentNullException(nameof(selector));
```
```csharp
}
```

```csharp
IEnumerable<TResult> SelectGenerator()
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
yield return selector(value); // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
return SelectGenerator(); // Immediate execution.
```

}

As a result, the above outer function is no longer a generator function. When it is called, it immediately checks the arguments, then immediately calls the local function to construct a generator as output. As mentioned in the introduction chapter, this tutorial omits argument null checks and only demonstrate argument checks for other purposes .

### Collection queries

The collection queries are discussed first because they are relatively straightforward, and they are used to implement sequence queries:

### Conversion

ToArray is implemented by pulling all values from source sequence and store them to a new array. To create an array, its length has to be provided. However, the count of values in source is unknown when starting to pull the values. The easiest implementation is to create an empty array, when each value is pulled from source sequence, increase the array size by 1 to store that value:

internal static partial class EnumerableExtensions

```csharp
{
```
```csharp
public static TSource[] ToArray<TSource>(this IEnumerable<TSource> source)
```
```csharp
{
```
```csharp
TSource[] array = new TSource[0];
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
Array.Resize(ref array, array.Length + 1);
```
```csharp
array[array.Length - 1] = value;
```
```csharp
}
```
```csharp
return array;
```
```csharp
}
```

}

Actually, Microsoft’s built-in implementation has some performance improvement. First, if the source sequence implements ICollection<T>, then it already has a CopyTo method to store its values to an array:

namespace System.Collections.Generic

```csharp
{
```
```csharp
public interface ICollection<T> : IEnumerable<T>, IEnumerable
```
```csharp
{
```
```csharp
int Count { get; }
```

```csharp
bool IsReadOnly { get; }
```

```csharp
void Add(T item);
```

```csharp
void Clear();
```

```csharp
bool Contains(T item);
```

```csharp
void CopyTo(T[] array, int arrayIndex);
```

```csharp
bool Remove(T item);
```
```csharp
}
```

}

Also, the array does not need to be resized for each value. The built-in implementation has the arrays grow in the same way of List<T>. First, an initial length is used to construct the array; when pulling values from source and storing to array, if array gets full, then double its length; After all values are pulled, the array resized to the actual length. The following is an equivalent implementation, optimized for readability:

public static TSource\[\] ToArray<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
if (source is ICollection<TSource> genericCollection)
```
```csharp
{
```
```csharp
int length = genericCollection.Count;
```
```csharp
if (length > 0)
```
```csharp
{
```
```csharp
TSource[] array = new TSource[length];
```
```csharp
genericCollection.CopyTo(array, 0);
```
```csharp
return array;
```
```csharp
}
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
const int InitialLength = 4; // Initial array length.
```
```csharp
const int MaxLength = 0x7FEFFFFF; // Max array length: Array.MaxArrayLength.
```
```csharp
TSource[] array = new TSource[InitialLength];
```
```csharp
array[0] = iterator.Current;
```
```csharp
int usedLength = 1;
```

```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
if (usedLength == array.Length)
```
```csharp
{
```
```csharp
int increaseToLength = usedLength * 2; // Array is full, double its size.
```
```csharp
if ((uint)increaseToLength> MaxLength)
```
```csharp
{
```
```csharp
increaseToLength = usedLength> = MaxLength ? usedLength + 1 : MaxLength;
```
```csharp
}
```
```csharp
Array.Resize(ref array, increaseToLength);
```
```csharp
}
```
```csharp
array[usedLength++] = iterator.Current;
```
```csharp
}
```
```csharp
Array.Resize(ref array, usedLength); // Consolidate array to its actual size.
```
```csharp
return array;
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
return Array.Empty<TSource>();
```

}

ToList is much easier to implement, because List<T> has a constructor accepting an IEnumerable<T> source:

public static List<TSource\> ToList<TSource\>(this IEnumerable<TSource\> source) =>

new List<TSource\>(source);

ToDictionary is also easy, because Dictionary<TKey, TValue> has an Add method:

public static Dictionary<TKey, TSource\> ToDictionary<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IEqualityComparer<TKey>comparer = null) =>
```
```csharp
source.ToDictionary(keySelector, value => value, comparer);
```

```csharp
public static Dictionary<TKey, TElement> ToDictionary<TSource, TKey, TElement>(
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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```

```csharp
Dictionary<TKey, TElement> dictionary = new Dictionary<TKey, TElement>(comparer);
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
dictionary.Add(keySelector(value), elementSelector(value));
```
```csharp
}
```
```csharp
return dictionary;
```

}

As previously discussed, a lookup is a dictionary of key and sequence pairs, and each key and sequence pair are just a group represented by IGrouping<TKey, TElement>, which can be implemented as:

public class Grouping<TKey, TElement\> : IGrouping<TKey, TElement\>

```csharp
{
```
```csharp
private readonly List<TElement> values = new List<TElement>();
```

```csharp
public Grouping(TKey key) => this.Key = key;
```

```csharp
public TKey Key { get; }
```

```csharp
public IEnumerator<TElement> GetEnumerator() => this.values.GetEnumerator();
```

```csharp
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

```csharp
internal void Add(TElement value) => this.values.Add(value);
```

}

.NET provides a public lookup type, but there is no public API to instantiate it, except the ToLookup query itself. For demonstration purpose, based on the previous discussion of dictionary and lookup, a custom lookup can be quickly implemented with dictionary, where each dictionary value is a group, and each dictionary key is the hash code of group key:

public partial class Lookup<TKey, TElement> : ILookup<TKey, TElement>

```csharp
{
```
```csharp
private readonly Dictionary<int, Grouping<TKey, TElement>> groups =
```
```csharp
new Dictionary<int, Grouping<TKey, TElement>>();
```

```csharp
private readonly IEqualityComparer<TKey> equalityComparer;
```

```csharp
public Lookup(IEqualityComparer<TKey> equalityComparer = null) =>
```
```csharp
this.equalityComparer = equalityComparer ?? EqualityComparer<TKey>.Default;
```

```csharp
public int Count => this.groups.Count;
```

```csharp
private int GetHashCode(TKey key) => key == null
```
```csharp
? -1
```
```csharp
: this.equalityComparer.GetHashCode(key) & int.MaxValue;
```
```csharp
// int.MaxValue is 0b_01111111_11111111_11111111_11111111. So the hash code of non-null key is always > -1.
```

```csharp
public bool Contains(TKey key) => this.groups.ContainsKey(this.GetHashCode(key));
```

```csharp
public IEnumerable<TElement> this[TKey key] =>
```
```csharp
this.groups.TryGetValue(this.GetHashCode(key), out Grouping<TKey, TElement> group)
```
```csharp
? (IEnumerable<TElement>)group
```
```csharp
: Array.Empty<TElement>();
```

```csharp
public IEnumerator<IGrouping<TKey, TElement>> GetEnumerator() => this.groups.Values.GetEnumerator();
```

```csharp
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

}

The built-in API object.GetHashCode is not directly used to get each group key’s hash code, because it does not handle null value very well in some cases. System.Nullable<T>.GetHashCode is such an example. ((int?)0).GetHashCode() and ((int?)null).GetHashCode() both return 0. So, the above GetHashCode method reserves -1 for null. And any non-null value’s hash code is converted to a positive int by a bitwise and operation with int.MaxValue (0b\_01111111\_11111111\_11111111\_11111111). Also notice the indexer getter outputs an empty sequence when the specified key does not exist. Similar to Grouping<TKey, TElement>.Add, the following Lookup<TKey, TElement>.AddRange is defined to add data:

public partial class Lookup<TKey, TElement\>

```csharp
{
```
```csharp
public Lookup<TKey, TElement> AddRange<TSource>(
```
```csharp
IEnumerable<TSource>source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TSource, TElement> elementSelector,
```
```csharp
bool skipNullKey = false)
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
TKey key = keySelector(value);
```
```csharp
if (key == null &&skipNullKey)
```
```csharp
{
```
```csharp
continue;
```
```csharp
}
```
```csharp
int hashCode = this.GetHashCode(key);
```
```csharp
if (this.groups.TryGetValue(hashCode, out Grouping<TKey, TElement> group))
```
```csharp
{
```
```csharp
group.Add(elementSelector(value));
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
this.groups.Add(hashCode, new Grouping<TKey, TElement>(key) { elementSelector(value) });
```
```csharp
}
```
```csharp
}
```
```csharp
return this;
```
```csharp
}
```

}

Now, ToLookup can be implemented by creating a lookup and adding all data:

public static ILookup<TKey, TElement\> ToLookup<TSource, TKey, TElement\>(

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
IEqualityComparer<TKey>comparer = null) =>
```
```csharp
new Lookup<TKey, TElement>(comparer).AddRange(source, keySelector, elementSelector);
```

```csharp
public static ILookup<TKey, TSource> ToLookup<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
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

```csharp
{
```
```csharp
foreach (object value in source)
```
```csharp
{
```
```csharp
yield return (TResult)value; // Deferred execution.
```
```csharp
}
```

}

The built-in implementation does a little optimization. If the source is already a generic sequence of the specified result type, it can be directly returned. Logically it should be something like:

// Cannot be compiled.

```csharp
public static IEnumerable<TResult> Cast<TResult>(this IEnumerable source)
```
```csharp
{
```
```csharp
if (source is IEnumerable<TResult> genericSource)
```
```csharp
{
```
```csharp
return genericSource;
```
```csharp
}
```

```csharp
foreach (object value in source)
```
```csharp
{
```
```csharp
yield return (TResult)value; // Deferred execution.
```
```csharp
}
```

}

The above code cannot be compiled. The yield statement indicates the entire function body should be compiled to a generator, so the return statement cannot be used with yield statement. Similar to argument check, the solution is to isolate the iteration control flow with yield statement into another method or local function:

public static IEnumerable<TResult\> Cast<TResult\>(this IEnumerable source)

```csharp
{
```
```csharp
IEnumerable<TResult>CastGenerator()
```
```csharp
{
```
```csharp
foreach (object value in source)
```
```csharp
{
```
```csharp
yield return (TResult)value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
return source is IEnumerable<TResult> genericSource
```
```csharp
? genericSource
```
```csharp
: CastGenerator();
```

}

Cast also implements deferred execution. When it is called, its output is either the source sequence itself or a generator, without pulling values from source or execute the casting.

### Generation

Empty can be implemented with a single yield break statement, which is compiled to an empty generator:

public static IEnumerable<TResult\> EmptyGenerator<TResult\>()

```csharp
{
```
```csharp
yield break;
```

}

The built-in implementation actually uses an empty array, which has better performance than constructing a generator:

public static IEnumerable<TResult\> Empty<TResult\>() => Array.Empty<TResult\>();

Range can be simply implemented with a loop:

public static IEnumerable<int\> Range(int start, int count)

```csharp
{
```
```csharp
if (count < 0 || (((long)start) + count - 1L) > int.MaxValue)
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
IEnumerable<int>RangeGenerator()
```
```csharp
{
```
```csharp
int end = start + count;
```
```csharp
for (int value = start; value != end; value++)
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
return RangeGenerator();
```

}

And Repeat has been discussed. The built-in implementation also checks the count argument, and uses an empty array when count is 0:

public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count)

```csharp
{
```
```csharp
if (count< 0)
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
if (count == 0)
```
```csharp
{
```
```csharp
return Empty<TResult>();
```
```csharp
}
```

```csharp
IEnumerable<TResult> RepeatGenerator()
```
```csharp
{
```
```csharp
for (int index = 0; index < count; index++)
```
```csharp
{
```
```csharp
yield return element; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
return RepeatGenerator();
```

}

DefaultIfEmpty can be implemented with a desugared foreach loop to detect and iterate the source sequence:

public static IEnumerable<TSource\> DefaultIfEmpty<TSource\>(

```csharp
this IEnumerable<TSource> source, TSource defaultValue = default)
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
// source is not empty.
```
```csharp
do
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
while (iterator.MoveNext());
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
// source is empty.
```
```csharp
yield return defaultValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

The first MoveNext call detects if the source sequence is empty. If so, just yield the default value, otherwise yield all values in the source sequence.

### Filtering

Where is already discussed. The following are the non-indexed overload and index overload equivalent to the built-in implementation:

public static IEnumerable<TSource\> Where<TSource\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, bool> predicate)
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
if (predicate(value))
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
public static IEnumerable<TSource> Where<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate)
```
```csharp
{
```
```csharp
int index = -1;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
index = checked(index + 1);
```
```csharp
if (predicate(value, index))
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

Similarly, OfType has a type test to filter the source:

public static IEnumerable<TResult\> OfType<TResult\>(this IEnumerable source)

```csharp
{
```
```csharp
foreach (object value in source)
```
```csharp
{
```
```csharp
if (value is TResult)
```
```csharp
{
```
```csharp
yield return (TResult)value; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

### Mapping

Select has also been discussed. The following are the non-indexed overload and index overload equivalent to the built-in implementation:

public static IEnumerable<TResult\> Select<TSource, TResult\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult>selector)
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
yield return selector(value); // Deferred execution.
```
```csharp
}
```
```csharp
}
```

```csharp
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, int, TResult> selector)
```
```csharp
{
```
```csharp
int index = -1;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
index = checked(index + 1);
```
```csharp
yield return selector(value, index); // Deferred execution.
```
```csharp
}
```

}

The implementation of SelectMany is also straightforward:

public static IEnumerable<TResult\> SelectMany<TSource, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, IEnumerable<TResult>>selector)
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
foreach (TResult result in selector(value))
```
```csharp
{
```
```csharp
yield return result; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

Above code intuitively shows its capacity to flatten a hierarchical 2-level-sequence to a flat 1-level-sequence. The following is the overload with collection selector and result selector:

public static IEnumerable<TResult\> SelectMany<TSource, TCollection, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, IEnumerable<TCollection>> collectionSelector,
```
```csharp
Func<TSource, TCollection, TResult>resultSelector)
```
```csharp
{
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
foreach (TCollection collectionValue in collectionSelector(sourceValue))
```
```csharp
{
```
```csharp
yield return resultSelector(sourceValue, collectionValue); // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

And the following are the indexed overloads:

public static IEnumerable<TResult\> SelectMany<TSource, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, int, IEnumerable<TResult>> selector)
```
```csharp
{
```
```csharp
int index = -1;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
index = checked(index + 1);
```
```csharp
foreach (TResult result in selector(value, index))
```
```csharp
{
```
```csharp
yield return result; // Deferred execution.
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
public static IEnumerable<TResult> SelectMany<TSource, TCollection, TResult>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, int, IEnumerable<TCollection>> collectionSelector,
```
```csharp
Func<TSource, TCollection, TResult>resultSelector)
```
```csharp
{
```
```csharp
int index = -1;
```
```csharp
foreach (TSource sourceValue in source)
```
```csharp
{
```
```csharp
index = checked(index + 1);
```
```csharp
foreach (TCollection collectionValue in collectionSelector(sourceValue, index))
```
```csharp
{
```
```csharp
yield return resultSelector(sourceValue, collectionValue); // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

### Grouping

GroupBy’s work is similar to ToLookup, but with deferred execution. To implement deferred execution with ToLookup, the easiest way is to involve yield statement:

public static IEnumerable<IGrouping<TKey, TSource\>> GroupBy<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
ILookup<TKey, TSource> lookup = source.ToLookup(keySelector, comparer); // Eager evaluation.
```
```csharp
foreach (IGrouping<TKey, TSource> group in lookup)
```
```csharp
{
```
```csharp
yield return group; // Deferred execution.
```
```csharp
}
```

}

When starting to pull the first value from the returned generator, ToLookup is called to evaluate all source values and group them, so that the first group can be yielded. Apparently GroupBy implements eager evaluation. The overloads with element selector and resultSelector can all be implemented in the same pattern:

public static IEnumerable<IGrouping<TKey, TElement\>> GroupBy<TSource, TKey, TElement\>(

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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
ILookup<TKey, TElement> lookup = source.ToLookup(keySelector, elementSelector, comparer); // Eager evaluation.
```
```csharp
foreach (IGrouping<TKey, TElement> group in lookup)
```
```csharp
{
```
```csharp
yield return group; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

```csharp
public static IEnumerable<TResult> GroupBy<TSource, TKey, TResult>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
Func<TKey, IEnumerable<TSource>, TResult> resultSelector,
```
```csharp
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
ILookup<TKey, TSource> lookup = source.ToLookup(keySelector, comparer); // Eager evaluation.
```
```csharp
foreach (IGrouping<TKey, TSource> group in lookup)
```
```csharp
{
```
```csharp
yield return resultSelector(group.Key, group); // Deferred execution.
```
```csharp
}
```
```csharp
}
```

```csharp
public static IEnumerable<TResult> GroupBy<TSource, TKey, TElement, TResult>(
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
Func<TKey, IEnumerable<TElement>, TResult> resultSelector,
```
```csharp
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
ILookup<TKey, TElement> lookup = source.ToLookup(keySelector, elementSelector, comparer); // Eager evaluation.
```
```csharp
foreach (IGrouping<TKey, TElement> group in lookup)
```
```csharp
{
```
```csharp
yield return resultSelector(group.Key, group); // Deferred execution.
```
```csharp
}
```

}

### Join

Similar to GroupBy, GroupJoin for outer join can be simply implemented with the same pattern of ToLookup and yield:

public static IEnumerable<TResult\> GroupJoinWithLookup<TOuter, TInner, TKey, TResult\>(

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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
ILookup<TKey, TInner> innerLookup = inner.ToLookup(innerKeySelector, comparer); // Eager evaluation.
```
```csharp
foreach (TOuter outerValue in outer)
```
```csharp
{
```
```csharp
yield return resultSelector(outerValue, innerLookup[outerKeySelector(outerValue)]); // Deferred execution.
```
```csharp
}
```

}

When trying to pull the first value from the returned generator, the inner values are grouped by the keys, and stored in the inner lookup. Then, for each outer value, query the inner lookup by key. Remember when a lookup is queried with a key, it always outputs a sequence, even when the key does not exist, it returns an empty sequence. So that in GroupJoin, each outer value is always paired with a group of inner values. The above implementation is straightforward, but the inner source is always pulled, even when the outer source is empty. This can be avoided by a little optimization:

public static IEnumerable<TResult\> GroupJoin<TOuter, TInner, TKey, TResult\>(

```csharp
this IEnumerable<TOuter> outer,
```
```csharp
IEnumerable<TInner> inner,
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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
using (IEnumerator<TOuter> outerIterator = outer.GetEnumerator())
```
```csharp
{
```
```csharp
if (outerIterator.MoveNext())
```
```csharp
{
```
```csharp
Lookup<TKey, TInner> innerLookup = new Lookup<TKey, TInner>(comparer).AddRange(
```
```csharp
inner, innerKeySelector, innerValue => innerValue, skipNullKey: true); // Eager evaluation.
```
```csharp
do
```
```csharp
{
```
```csharp
TOuter outerValue = outerIterator.Current;
```
```csharp
yield return resultSelector(outerValue, innerLookup[outerKeySelector(outerValue)]); // Deferred execution.
```
```csharp
}
```
```csharp
while (outerIterator.MoveNext());
```
```csharp
}
```
```csharp
}
```

}

Similar to DefaultIfEmpty, the first MoveNext call detects if the outer source is empty. Only if not, the inner values are pulled and converted to a lookup.

Join for inner join can also be implemented with the similar pattern:

public static IEnumerable<TResult\> JoinWithToLookup<TOuter, TInner, TKey, TResult\>(

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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
ILookup<TKey, TInner> innerLookup = inner.ToLookup(innerKeySelector, comparer); // Eager evaluation.
```
```csharp
foreach (TOuter outerValue in outer)
```
```csharp
{
```
```csharp
TKey key = outerKeySelector(outerValue);
```
```csharp
if (innerLookup.Contains(key))
```
```csharp
{
```
```csharp
foreach (TInner innerValue in innerLookup[key])
```
```csharp
{
```
```csharp
yield return resultSelector(outerValue, innerValue); // Deferred execution.
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

It calls the ILookup<TKey, TElement>.Contains filter, because in inner join each outer value has to be paired with a matching inner value. Again, the above implementation can be optimized, so that the inner values are not pulled and converted to lookup when the outer source is empty:

public static IEnumerable<TResult\> Join<TOuter, TInner, TKey, TResult\>(

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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
using (IEnumerator<TOuter> outerIterator = outer.GetEnumerator())
```
```csharp
{
```
```csharp
if (outerIterator.MoveNext())
```
```csharp
{
```
```csharp
Lookup<TKey, TInner> innerLookup = new Lookup<TKey, TInner>(comparer).AddRange(
```
```csharp
inner, innerKeySelector, innerValue => innerValue, skipNullKey: true); // Eager evaluation.
```
```csharp
if (innerLookup.Count> 0)
```
```csharp
{
```
```csharp
do
```
```csharp
{
```
```csharp
TOuter outerValue = outerIterator.Current;
```
```csharp
TKey key = outerKeySelector(outerValue);
```
```csharp
if (innerLookup.Contains(key))
```
```csharp
{
```
```csharp
foreach (TInner innerValue in innerLookup[key])
```
```csharp
{
```
```csharp
yield return resultSelector(outerValue, innerValue); // Deferred execution.
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
while (outerIterator.MoveNext());
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

### Concatenation

Concat’s implementation is equivalent to yield values from the first source sequence, then yield values from the from the second:

public static IEnumerable<TSource\> Concat<TSource\>(

```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second)
```
```csharp
{
```
```csharp
foreach (TSource value in first)
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
foreach (TSource value in second)
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

Append and Prepend’s implementation is equivalent to the following, with similar pattern:

public static IEnumerable<TSource\> Append<TSource\>(this IEnumerable<TSource\> source, TSource element)

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
yield return value;
```
```csharp
}
```
```csharp
yield return element;
```
```csharp
}
```

```csharp
public static IEnumerable<TSource> Prepend<TSource>(this IEnumerable<TSource> source, TSource element)
```
```csharp
{
```
```csharp
yield return element;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
yield return value;
```
```csharp
}
```

}

### Set

All the set queries need to remove duplicate values in the result sequence. So, the following hash set is defined to represent a collection of distinct values. The duplication of values can be identified by their hash codes, so a dictionary can be used to store distinct hash code and value pairs:

public partial class HashSet<T\> : IEnumerable<T\>

```csharp
{
```
```csharp
private readonly IEqualityComparer<T> equalityComparer;
```

```csharp
private readonly Dictionary<int, T>dictionary = new Dictionary<int, T>();
```

```csharp
public HashSet(IEqualityComparer<T> equalityComparer = null) =>
```
```csharp
this.equalityComparer = equalityComparer ?? EqualityComparer<T>.Default;
```

```csharp
public IEnumerator<T> GetEnumerator() => this.dictionary.Values.GetEnumerator();
```

```csharp
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

}

Then, the following Add and AddRange methods can be defined:

public partial class HashSet<T\>

```csharp
{
```
```csharp
private int GetHashCode(T value) => value == null
```
```csharp
? -1
```
```csharp
: this.equalityComparer.GetHashCode(value) & int.MaxValue;
```
```csharp
// int.MaxValue is 0b_01111111_11111111_11111111_11111111, so the result of & is always > -1.
```

```csharp
public bool Add(T value)
```
```csharp
{
```
```csharp
int hashCode = this.GetHashCode(value);
```
```csharp
if (this.dictionary.ContainsKey(hashCode))
```
```csharp
{
```
```csharp
return false;
```
```csharp
}
```
```csharp
this.dictionary.Add(hashCode, value);
```
```csharp
return true;
```
```csharp
}
```

```csharp
public HashSet<T> AddRange(IEnumerable<T> values)
```
```csharp
{
```
```csharp
foreach (T value in values)
```
```csharp
{
```
```csharp
this.Add(value);
```
```csharp
}
```
```csharp
return this;
```
```csharp
}
```

}

When Add is called with a specified value, if there is already a duplicate hash code in the internal dictionary, the specified value is not stored in the dictionary and false is returned; otherwise, the specified value and its hash code are added to the internal dictionary, and true is returned. With above hash set, it is very easy to implement Distinct.

public static IEnumerable<TSource\> Distinct<TSource\>(

```csharp
this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer = null)
```
```csharp
{
```
```csharp
HashSet<TSource>hashSet = new HashSet<TSource>(comparer);
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (hashSet.Add(value))
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

Union can be implemented by filtering the first source sequence with HashSet<T>.Add, then filter the second source sequence with HashSet<T>.Add:

public static IEnumerable<TSource\> Union<TSource\>(

```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
IEqualityComparer<TSource>comparer = null)
```
```csharp
{
```
```csharp
HashSet<TSource>hashSet = new HashSet<TSource>(comparer);
```
```csharp
foreach (TSource firstValue in first)
```
```csharp
{
```
```csharp
if (hashSet.Add(firstValue))
```
```csharp
{
```
```csharp
yield return firstValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```
```csharp
foreach (TSource secondValue in second)
```
```csharp
{
```
```csharp
if (hashSet.Add(secondValue))
```
```csharp
{
```
```csharp
yield return secondValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

Except can be implemented with the same pattern of filtering with HashSet<T>.Add:

public static IEnumerable<TSource\> Except<TSource\>(

```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
IEqualityComparer<TSource>comparer = null)
```
```csharp
{
```
```csharp
HashSet<TSource>secondHashSet = new HashSet<TSource>(comparer).AddRange(second); // Eager evaluation.
```
```csharp
foreach (TSource firstValue in first)
```
```csharp
{
```
```csharp
if (secondHashSet.Add(firstValue))
```
```csharp
{
```
```csharp
yield return firstValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

When trying to pull the first value from the returned generator, values in the second sequence are eagerly evaluated and stored in a hash set, which is then used to filter the first sequence.

And Intersect can also be implemented with this pattern:

public static IEnumerable<TSource\> IntersectWithAdd<TSource\>(

```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
IEqualityComparer<TSource>comparer = null)
```
```csharp
{
```
```csharp
HashSet<TSource>secondHashSet = new HashSet<TSource>(comparer).AddRange(second); // Eager evaluation.
```
```csharp
HashSet<TSource> firstHashSet = new HashSet<TSource>(comparer);
```
```csharp
foreach (TSource firstValue in first)
```
```csharp
{
```
```csharp
if (secondHashSet.Add(firstValue))
```
```csharp
{
```
```csharp
firstHashSet.Add(firstValue);
```
```csharp
}
```
```csharp
else if (firstHashSet.Add(firstValue))
```
```csharp
{
```
```csharp
yield return firstValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

To simplify above implementation, A Remove method can be defined for hash set:

public partial class HashSet<T\>

```csharp
{
```
```csharp
public bool Remove(T value)
```
```csharp
{
```
```csharp
int hasCode = this.GetHashCode(value);
```
```csharp
if (this.dictionary.ContainsKey(hasCode))
```
```csharp
{
```
```csharp
this.dictionary.Remove(hasCode);
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

}

Similar to Add, here if a value is found and removed, Remove outputs true; otherwise, Remove outputs false. So, Intersect can be implemented by filtering with Remove:

public static IEnumerable<TSource\> Intersect<TSource\>(

```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
IEqualityComparer<TSource>comparer = null)
```
```csharp
{
```
```csharp
HashSet<TSource>secondHashSet = new HashSet<TSource>(comparer).AddRange(second); // Eager evaluation.
```
```csharp
foreach (TSource firstValue in first)
```
```csharp
{
```
```csharp
if (secondHashSet.Remove(firstValue))
```
```csharp
{
```
```csharp
yield return firstValue; // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

### Convolution

Zip is easy to implement with a desugared foreach:

public static IEnumerable<TResult\> Zip<TFirst, TSecond, TResult\>(

```csharp
this IEnumerable<TFirst> first,
```
```csharp
IEnumerable<TSecond>second,
```
```csharp
Func<TFirst, TSecond, TResult>resultSelector)
```
```csharp
{
```
```csharp
using (IEnumerator<TFirst> firstIterator = first.GetEnumerator())
```
```csharp
using (IEnumerator<TSecond> secondIterator = second.GetEnumerator())
```
```csharp
{
```
```csharp
while (firstIterator.MoveNext() && secondIterator.MoveNext())
```
```csharp
{
```
```csharp
yield return resultSelector(firstIterator.Current, secondIterator.Current); // Deferred execution.
```
```csharp
}
```
```csharp
}
```

}

It stops yielding result when one of those 2 source sequences reaches the end.

### Partitioning

Skip is easy to implement:

public static IEnumerable<TSource\> Skip<TSource\>(this IEnumerable<TSource\> source, int count)

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
if (count > 0)
```
```csharp
{
```
```csharp
count--;
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
yield return value;
```
```csharp
}
```
```csharp
}
```

}

It can be optimized a little bit by desugaring the foreach loop, so that when a value should be skipped, only the source iterator’s MoveNext method is called.

public static IEnumerable<TSource\> Skip<TSource\>(this IEnumerable<TSource\> source, int count)

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
while (count > 0 && iterator.MoveNext())
```
```csharp
{
```
```csharp
count--; // Comparing foreach loop, iterator.Current is not called.
```
```csharp
}
```
```csharp
if (count <= 0)
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
```csharp
}
```

}

In contrast, SkipWhile has to pull each value from source sequence to call predicate, so there is no need to desugar foreach. The following are the non-index overload and indexed overload:

public static IEnumerable<TSource\> SkipWhile<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```csharp
{
```
```csharp
bool skip = true;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (skip && !predicate(value))
```
```csharp
{
```
```csharp
skip = false;
```
```csharp
}
```
```csharp
if (!skip)
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
public static IEnumerable<TSource> SkipWhile<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate)
```
```csharp
{
```
```csharp
int index = -1;
```
```csharp
bool skip = true;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
index = checked(index + 1);
```
```csharp
if (skip && !predicate(value, index))
```
```csharp
{
```
```csharp
skip = false;
```
```csharp
}
```
```csharp
if (!skip)
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

Take is also straightforward:

public static IEnumerable<TSource\> Take<TSource\>(this IEnumerable<TSource\> source, int count)

```csharp
{
```
```csharp
if (count > 0)
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
if (--count == 0)
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
```csharp
}
```

}

And the following are TakeWhile’s non-indexed overload and indexed overload:

public static IEnumerable<TSource\> TakeWhile<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
if (!predicate(value))
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
public static IEnumerable<TSource> TakeWhile<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate)
```
```csharp
{
```
```csharp
int index = -1;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
index = checked(index + 1);
```
```csharp
if (!predicate(value, index))
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

}

### Ordering

Reverse has been discussed:

public static IEnumerable<TSource\> Reverse<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
TSource[] array = ToArray(source); // Eager evaluation.
```
```csharp
for (int index = array.Length - 1; index >= 0; index--)
```
```csharp
{
```
```csharp
yield return array[index]; // Deferred execution.
```
```csharp
}
```

}

The other ordering queries are implemented very differently because they involve the IOrderedEnumerable<T> interface. Again here are the signatures:

public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer);
```

```csharp
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```

this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer);

And once again the following is the definition of IOrderedEnumerable<T>:

namespace System.Linq

```csharp
{
```
```csharp
public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
```
```csharp
{
```
```csharp
IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(
```
```csharp
Func<TElement, TKey> keySelector, IComparer<TKey>comparer, bool descending);
```
```csharp
}
```

}

Its implementation is a little complex. The following is a simplified version but equivalent to the built-in implementation:

internal class OrderedSequence<TSource, TKey\> : IOrderedEnumerable<TSource\>

```csharp
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

```csharp
internal OrderedSequence(
```
```csharp
IEnumerable<TSource>source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IComparer<TKey>comparer,
```
```csharp
bool descending = false,
```
```csharp
// previousGetComparison is only specified in CreateOrderedEnumerable,
```
```csharp
// and CreateOrderedEnumerable is only called by ThenBy/ThenByDescending.
```
```csharp
// When OrderBy/OrderByDescending is called, previousGetComparison is not specified.
```
```csharp
Func<TSource[], Func<int, int, int>> previousGetComparison = null)
```
```csharp
{
```
```csharp
this.source = source;
```
```csharp
this.keySelector = keySelector;
```
```csharp
this.comparer = comparer ?? Comparer<TKey>.Default;
```
```csharp
this.descending = descending;
```
```csharp
this.previousGetComparison = previousGetComparison;
```
```csharp
}
```

```csharp
public IEnumerator<TSource> GetEnumerator()
```
```csharp
{
```
```csharp
TSource[] values = this.source.ToArray(); // Eager evaluation.
```
```csharp
int count = values.Length;
```
```csharp
if (count <= 0)
```
```csharp
{
```
```csharp
yield break;
```
```csharp
}
```

```csharp
int[] indexMap = new int[count];
```
```csharp
for (int index = 0; index < count; index++)
```
```csharp
{
```
```csharp
indexMap[index] = index;
```
```csharp
}
```
```csharp
// GetComparison is only called once for each generator instance.
```
```csharp
Func<int, int, int> comparison = this.GetComparison(values);
```
```csharp
Array.Sort(indexMap, (index1, index2) => // index1 < index2
```
```csharp
{
```
```csharp
// Format compareResult.
```
```csharp
// When compareResult is 0 (equal), return index1 - index2,
```
```csharp
// so that indexMap[index1] is before indexMap[index2],
```
```csharp
// 2 equal values' original order is preserved.
```
```csharp
int compareResult = comparison(index1, index2);
```
```csharp
return compareResult == 0 ? index1 - index2 : compareResult;
```
```csharp
}); // More eager evaluation.
```
```csharp
for (int index = 0; index < count; index++)
```
```csharp
{
```
```csharp
yield return values[indexMap[index]];
```
```csharp
}
```
```csharp
}
```

```csharp
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

```csharp
// Only called by ThenBy/ThenByDescending.
```
```csharp
public IOrderedEnumerable<TSource> CreateOrderedEnumerable<TNextKey>
```
```csharp
(Func<TSource, TNextKey> nextKeySelector, IComparer<TNextKey> nextComparer, bool nextDescending) =>
```
```csharp
new OrderedSequence<TSource, TNextKey>(
```
```csharp
this.source, nextKeySelector, nextComparer, nextDescending, this.GetComparison);
```

```csharp
private TKey[] GetKeys(TSource[] values)
```
```csharp
{
```
```csharp
int count = values.Length;
```
```csharp
TKey[] keys = new TKey[count];
```
```csharp
for (int index = 0; index < count; index++)
```
```csharp
{
```
```csharp
keys[index] = this.keySelector(values[index]);
```
```csharp
}
```
```csharp
return keys;
```
```csharp
}
```

```csharp
private Func<int, int, int> GetComparison(TSource[] values)
```
```csharp
{
```
```csharp
// GetComparison is only called once for each generator instance,
```
```csharp
// so GetKeys is only called once during the ordering query execution.
```
```csharp
TKey[] keys = this.GetKeys(values);
```
```csharp
if (this.previousGetComparison == null)
```
```csharp
{
```
```csharp
// In OrderBy/OrderByDescending.
```
```csharp
return (index1, index2) =>
```
```csharp
// OrderBy/OrderByDescending always need to compare keys of 2 values.
```
```csharp
this.CompareKeys(keys, index1, index2);
```
```csharp
}
```
```csharp
// In ThenBy/ThenByDescending.
```
```csharp
Func<int, int, int> previousComparison = this.previousGetComparison(values);
```
```csharp
return (index1, index2) =>
```
```csharp
{
```
```csharp
// Only when previousCompareResult is 0 (equal),
```
```csharp
// ThenBy/ThenByDescending needs to compare keys of 2 values.
```
```csharp
int previousCompareResult = previousComparison(index1, index2);
```
```csharp
return previousCompareResult == 0
```
```csharp
? this.CompareKeys(keys, index1, index2)
```
```csharp
: previousCompareResult;
```
```csharp
};
```
```csharp
}
```

```csharp
private int CompareKeys(TKey[] keys, int index1, int index2)
```
```csharp
{
```
```csharp
// Format compareResult to always be 0, -1, or 1.
```
```csharp
int compareResult = this.comparer.Compare(keys[index1], keys[index2]);
```
```csharp
return compareResult == 0
```
```csharp
? 0
```
```csharp
: (this.descending ? (compareResult > 0 ? -1 : 1) : (compareResult > 0 ? 1 : -1));
```
```csharp
}
```

}

Now the ordering queries can be implemented by constructing the above ordered sequence:

public static IOrderedEnumerable<TSource\> OrderBy<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<TSource, TKey> keySelector,
```
```csharp
IComparer<TKey>comparer = null) =>
```
```csharp
new OrderedSequence<TSource, TKey>(source, keySelector, comparer);
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
IComparer<TKey>comparer = null) =>
```
```csharp
new OrderedSequence<TSource, TKey>(source, keySelector, comparer, descending: true);
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
IComparer<TKey>comparer = null) =>
```
```csharp
source.CreateOrderedEnumerable(keySelector, comparer, descending: false);
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

```csharp
{
```
```csharp
public interface IList<T> : ICollection<T>, IEnumerable<T>, IEnumerable
```
```csharp
{
```
```csharp
T this[int index] { get; set; }
```

```csharp
int IndexOf(T item);
```

```csharp
void Insert(int index, T item);
```

```csharp
void RemoveAt(int index);
```
```csharp
}
```

}

As fore mentioned, IList<T> is implemented by T\[\] array, List<T>, and Collection<T>, etc. So, the following is an optimized implementation of First:

public static TSource First<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
if (list.Count > 0)
```
```csharp
{
```
```csharp
return list[0];
```
```csharp
}
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
foreach (TSource value in source)
```
```csharp
{
```
```csharp
return value;
```
```csharp
}
```
```csharp
}
```
```csharp
throw new InvalidOperationException("Sequence contains no elements.");
```

}

The other overload with predicate is also easy to implement:

public static TSource First<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate)

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
if (predicate(value))
```
```csharp
{
```
```csharp
return value;
```
```csharp
}
```
```csharp
}
```
```csharp
throw new InvalidOperationException("Sequence contains no matching element.");
```

}

The implementation of FirstOrDefault is very similar. When source is empty, just output the default value instead of throwing exception:

public static TSource FirstOrDefault<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
if (list.Count > 0)
```
```csharp
{
```
```csharp
return list[0];
```
```csharp
}
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
foreach (TSource value in source)
```
```csharp
{
```
```csharp
return value;
```
```csharp
}
```
```csharp
}
```
```csharp
return default;
```
```csharp
}
```

```csharp
public static TSource FirstOrDefault<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
if (predicate(value))
```
```csharp
{
```
```csharp
return value;
```
```csharp
}
```
```csharp
}
```
```csharp
return default;
```

}

Last and LastOrDefault can be implemented in the similar pattern, with desugared foreach loop:

public static TSource Last<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
int count = list.Count;
```
```csharp
if (count > 0)
```
```csharp
{
```
```csharp
return list[count - 1];
```
```csharp
}
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
TSource last;
```
```csharp
do
```
```csharp
{
```
```csharp
last = iterator.Current;
```
```csharp
}
```
```csharp
while (iterator.MoveNext());
```
```csharp
return last;
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```csharp
}
```

```csharp
public static TSource Last<TSource>(this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
for (int index = list.Count - 1; index >= 0; index--)
```
```csharp
{
```
```csharp
TSource value = list[index];
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
return value;
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
else
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
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
TSource last = iterator.Current;
```
```csharp
if (predicate(last))
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
TSource value = iterator.Current;
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
last = value;
```
```csharp
}
```
```csharp
}
```
```csharp
return last;
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
throw new InvalidOperationException("Sequence contains no matching element.");
```
```csharp
}
```

```csharp
public static TSource LastOrDefault<TSource>(this IEnumerable<TSource> source)
```
```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
int count = list.Count;
```
```csharp
if (count > 0)
```
```csharp
{
```
```csharp
return list[count - 1];
```
```csharp
}
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
TSource last;
```
```csharp
do
```
```csharp
{
```
```csharp
last = iterator.Current;
```
```csharp
}
```
```csharp
while (iterator.MoveNext());
```
```csharp
return last;
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
return default;
```
```csharp
}
```

```csharp
public static TSource LastOrDefault<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
for (int index = list.Count - 1; index >= 0; index--)
```
```csharp
{
```
```csharp
TSource value = list[index];
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
return value;
```
```csharp
}
```
```csharp
}
```
```csharp
return default;
```
```csharp
}
```
```csharp
TSource last = default;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
last = value;
```
```csharp
}
```
```csharp
}
```
```csharp
return last;
```

}

And ElementAt and ElementAtOrDefault too:

public static TSource ElementAt<TSource\>(this IEnumerable<TSource\> source, int index)

```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
return list[index];
```
```csharp
}
```

```csharp
if (index < 0)
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
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
if (index-- == 0)
```
```csharp
{
```
```csharp
return iterator.Current;
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
throw new ArgumentOutOfRangeException(nameof(index));
```
```csharp
}
```

```csharp
public static TSource ElementAtOrDefault<TSource>(this IEnumerable<TSource>source, int index)
```
```csharp
{
```
```csharp
if (index >= 0)
```
```csharp
{
```
```csharp
if (source is IList<TSource>list)
```

```csharp
{
```
```csharp
if (index < list.Count)
```
```csharp
{
```
```csharp
return list[index];
```
```csharp
}
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
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
if (index-- == 0)
```
```csharp
{
```
```csharp
return iterator.Current;
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
}
```
```csharp
return default;
```

}

Single and SingleOrDefault are stricter:

public static TSource Single<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
switch (list.Count)
```
```csharp
{
```
```csharp
case 0:
```
```csharp
throw new InvalidOperationException("Sequence contains no elements.");
```
```csharp
case 1:
```
```csharp
return list[0];
```
```csharp
}
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
using (IEnumerator<TSource> iterator = source.GetEnumerator())
```
```csharp
{
```
```csharp
if (!iterator.MoveNext()) // source is empty.
```
```csharp
{
```
```csharp
throw new InvalidOperationException("Sequence contains no elements.");
```
```csharp
}
```

```csharp
TSource first = iterator.Current;
```
```csharp
if (!iterator.MoveNext())
```
```csharp
{
```
```csharp
return first;
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
throw new InvalidOperationException("Sequence contains more than one element.");
```
```csharp
}
```

```csharp
public static TSource Single<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
TSource value = iterator.Current;
```
```csharp
if (predicate(value))
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
if (predicate(iterator.Current))
```
```csharp
{
```
```csharp
throw new InvalidOperationException("Sequence contains more than one matching element.");
```
```csharp
}
```
```csharp
}
```
```csharp
return value;
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
throw new InvalidOperationException("Sequence contains no matching element.");
```
```csharp
}
```

```csharp
public static TSource SingleOrDefault<TSource>(this IEnumerable<TSource>source)
```
```csharp
{
```
```csharp
if (source is IList<TSource>list)
```
```csharp
{
```
```csharp
switch (list.Count)
```
```csharp
{
```
```csharp
case 0:
```
```csharp
return default;
```
```csharp
case 1:
```
```csharp
return list[0];
```
```csharp
}
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
TSource first = iterator.Current;
```
```csharp
if (!iterator.MoveNext())
```
```csharp
{
```
```csharp
return first;
```
```csharp
}
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
return default;
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
throw new InvalidOperationException("Sequence contains more than one element.");
```
```csharp
}
```

```csharp
public static TSource SingleOrDefault<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
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
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
TSource value = iterator.Current;
```
```csharp
if (predicate(value))
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
if (predicate(iterator.Current))
```
```csharp
{
```
```csharp
throw new InvalidOperationException("Sequence contains more than one matching element.");
```
```csharp
}
```
```csharp
}
```

```csharp
return value;
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
return default;
```

}

### Aggregation

Aggregate pulls all values from source and accumulate them:

public static TResult Aggregate<TSource, TAccumulate, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
TAccumulate seed,
```
```csharp
Func<TAccumulate, TSource, TAccumulate>func,
```
```csharp
Func<TAccumulate, TResult> resultSelector)
```
```csharp
{
```
```csharp
TAccumulate accumulate = seed;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
accumulate = func(accumulate, value);
```
```csharp
}
```
```csharp
return resultSelector(accumulate);
```
```csharp
}
```

```csharp
public static TAccumulate Aggregate<TSource, TAccumulate>(
```
```csharp
this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func)
```
```csharp
{
```
```csharp
TAccumulate accumulate = seed;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
accumulate = func(accumulate, value);
```
```csharp
}
```
```csharp
return accumulate;
```
```csharp
}
```

```csharp
public static TSource Aggregate<TSource>(
```
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
throw new InvalidOperationException("Sequence contains no elements.");
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
accumulate = func(accumulate, iterator.Current);
```
```csharp
}
```
```csharp
return accumulate;
```
```csharp
}
```

}

Count can be implemented by iterating the source sequence. And if the source sequence is a collection, then it has a Count property:

public static int Count<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
switch (source)
```
```csharp
{
```
```csharp
case ICollection<TSource> genericCollection:
```
```csharp
return genericCollection.Count;
```
```csharp
case ICollection collection:
```
```csharp
return collection.Count;
```
```csharp
default:
```
```csharp
int count = 0;
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
count = checked(count + 1); // Comparing foreach loop, iterator.Current is never called.
```
```csharp
}
```
```csharp
}
```
```csharp
return count;
```
```csharp
}
```

}

And the overload with predicate can be implemented by filtering with the predicate function:

public static int Count<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```csharp
{
```
```csharp
int count = 0;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
count = checked(count + 1);
```
```csharp
}
```
```csharp
}
```
```csharp
return count;
```

}

LongCount cannot use collections’ Count property because it has int output. It simply counts the values:

public static long LongCount<TSource\>(this IEnumerable<TSource\> source)

```csharp
{
```
```csharp
long count = 0L;
```
```csharp
using (IEnumerator<TSource> iterator = source.GetEnumerator())
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
count = checked(count + 1L); // Comparing foreach loop, iterator.Current is never called.
```
```csharp
}
```
```csharp
}
```
```csharp
return count;
```
```csharp
}
```

```csharp
public static long LongCount<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate)
```
```csharp
{
```
```csharp
long count = 0L;
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
count = checked(count + 1L);
```
```csharp
}
```
```csharp
}
```
```csharp
return count;
```

}

Regarding the naming of LongCount .NET Framework Design Guidelines’ General Naming Conventions says:

DO use a generic CLR type name, rather than a language-specific name.

It would be more consistent if LongCount was named as Int64Count, just like Convert.ToInt64, etc.

Min has 22 overloads; the following is the overload for decimal:

public static decimal Min(this IEnumerable<decimal\> source)

```csharp
{
```
```csharp
decimal min;
```
```csharp
using (IEnumerator<decimal> iterator = source.GetEnumerator())
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```csharp
}
```
```csharp
min = iterator.Current;
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
decimal value = iterator.Current;
```
```csharp
if (value < min)
```
```csharp
{
```
```csharp
min = value;
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
return min;
```

}

And the decimal overload with selector can be implemented with Select:

public static decimal Min<TSource\>(

this IEnumerable<TSource\> source, Func<TSource, decimal\>selector) => source.Select(selector).Min();

Max also has 22 overloads. The overload for decimal without and with selector can be implemented with the same pattern:

public static decimal Max(this IEnumerable<decimal\> source)

```csharp
{
```
```csharp
decimal max;
```
```csharp
using (IEnumerator<decimal> iterator = source.GetEnumerator())
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```csharp
}
```

```csharp
max = iterator.Current;
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
decimal value = iterator.Current;
```
```csharp
if (value > max)
```
```csharp
{
```
```csharp
max = value;
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
return max;
```
```csharp
}
```

```csharp
public static decimal Max<TSource>(
```

this IEnumerable<TSource\> source, Func<TSource, decimal\>selector) => source.Select(selector).Max();

Sum/Average has 20 overloads each. Also take the decimal overloads as example:

public static decimal Sum(this IEnumerable<decimal\> source)

```csharp
{
```
```csharp
decimal sum = 0;
```
```csharp
foreach (decimal value in source)
```
```csharp
{
```
```csharp
sum += value;
```
```csharp
}
```
```csharp
return sum;
```
```csharp
}
```

```csharp
public static decimal Sum<TSource>(this IEnumerable<TSource> source, Func<TSource, decimal> selector) =>
```
```csharp
source.Select(selector).Sum();
```

```csharp
public static decimal Average<TSource>(this IEnumerable<TSource>source, Func<TSource, decimal> selector)
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
throw new InvalidOperationException("Sequence contains no elements.");
```
```csharp
}
```
```csharp
decimal sum = selector(iterator.Current);
```
```csharp
long count = 1L;
```
```csharp
while (iterator.MoveNext())
```
```csharp
{
```
```csharp
sum += selector(iterator.Current);
```
```csharp
count++;
```
```csharp
}
```
```csharp
return sum / count;
```
```csharp
}
```

}

### Quantifier

All, Any, and Contains has a bool output. They can be implemented in a similar foreach-if pattern:

public static bool All<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate)

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
if (!predicate(value))
```
```csharp
{
```
```csharp
return false;
```
```csharp
}
```
```csharp
}
```
```csharp
return true;
```
```csharp
}
```

```csharp
public static bool Any<TSource>(this IEnumerable<TSource>source, Func<TSource, bool> predicate)
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
if (predicate(value))
```
```csharp
{
```
```csharp
return true;
```
```csharp
}
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
public static bool Any<TSource>(this IEnumerable<TSource>source)
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
return iterator.MoveNext(); // Not needed to call iterator.Current.
```
```csharp
}
```
```csharp
}
```

```csharp
public static bool Contains<TSource>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
TSource value,
```
```csharp
IEqualityComparer<TSource>comparer = null)
```
```csharp
{
```
```csharp
if (comparer == null &&source is ICollection<TSource> collection)
```
```csharp
{
```
```csharp
return collection.Contains(value);
```
```csharp
}
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
if (comparer.Equals(sourceValue, value))
```
```csharp
{
```
```csharp
return true;
```
```csharp
}
```
```csharp
}
```
```csharp
return false;
```

}

Contains can be optimized a little bit because collection already has a Contains method.

### Equality

The implementation of SequenceEqual is a little similar to Zip, where 2 source sequences are iterated at the same time. They are equal only when their counts are equal, and their values at each index are equal:

public static bool SequenceEqual<TSource\>(

```csharp
this IEnumerable<TSource> first,
```
```csharp
IEnumerable<TSource>second,
```
```csharp
IEqualityComparer<TSource>comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TSource>.Default;
```
```csharp
if (first is ICollection<TSource> firstCollection && second is ICollection<TSource>secondCollection
```
```csharp
&& firstCollection.Count != secondCollection.Count)
```
```csharp
{
```
```csharp
return false;
```
```csharp
}
```
```csharp
using (IEnumerator<TSource> firstIterator = first.GetEnumerator())
```
```csharp
using (IEnumerator<TSource> secondIterator = second.GetEnumerator())
```
```csharp
{
```
```csharp
while (firstIterator.MoveNext())
```
```csharp
{
```
```csharp
if (!secondIterator.MoveNext() || !comparer.Equals(firstIterator.Current, secondIterator.Current))
```
```csharp
{
```
```csharp
return false;
```
```csharp
}
```
```csharp
}
```
```csharp
return !secondIterator.MoveNext();
```
```csharp
}
```

}

## Summary

This chapter discusses iterator pattern, and its implementation with the yield syntactic sugar. In LINQ to Objects, collection queries and value queries implements immediate execution, and sequence queries implements deferred execution following the iterator pattern, which is either lazy evaluation, or eager evaluation. Based on these concepts, this chapter demonstrates the implementation of LINQ to Objects queries in an equivalent and readable way. With the understanding of queries’ internal implementation, you should have a good understanding of LINQ to Objects standard queries, and be able to use them effectively.