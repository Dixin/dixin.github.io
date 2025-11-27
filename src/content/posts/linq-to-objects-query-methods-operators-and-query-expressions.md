---
title: "LINQ to Objects in Depth (2) Query Methods (Operators) and Query Expressions"
published: 2019-07-02
description: "As fore mentioned, LINQ to Objects standard query methods (also called standard query operators) are provided as static methods of System.Linq.Enumerable type, most of which are IEnumerable<T> extensi"
image: ""
tags: [".NET", "C#", "F#", "Functional Programming", "Haskell", "JavaScript", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: "LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

As fore mentioned, LINQ to Objects standard query methods (also called standard query operators) are provided as static methods of System.Linq.Enumerable type, most of which are IEnumerable<T> extension methods. They can be categorized by output type:

1. Sequence queries: output a new IEnumerable<T> sequence:

o Generation: Empty , Range, Repeat, DefaultIfEmpty

o Filtering (restriction): Where\*, OfType

o Mapping (projection): Select\*, SelectMany\*

o Grouping: GroupBy\*

o Join: SelectMany, Join\*, GroupJoin\*

o Concatenation: Concat, Append, Prepend

o Set: Distinct, Union, Intersect, Except

o Convolution: Zip

o Partitioning: Take, Skip, TakeWhile, SkipWhile

o Ordering: OrderBy\*, ThenBy\*, OrderByDescending\*, ThenByDescending\*, Reverse\*

o Conversion: Cast\*, AsEnumerable

2. Collection queries: output a new collection:

o Conversion: ToArray, ToList, ToDictionary, ToLookup

3. Value queries: output a single value:

o Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault

o Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average

o Quantifier: All, Any, Contains

o Equality: SequenceEqual

These LINQ query methods are very functional. They are functions that can be composed by fluent chaining. Many of them are higher-order functions accepting function parameters, so anonymous functions (lambda expressions) or named functions can be passed to them. The query methods with IEnumerable<T> output are pure functions. They are referential transparency and side effect free. When they are called, they only create and output a new sequence wrapping the input sequence and the query logic, with the query logic not executed, so there are no state changes, data mutation, I/O, etc. The query logic execution is deferred until the result values are pulled from the output sequence. The other query methods that output a new collection or a single value are impure functions. When they are called, they immediately execute the query and pull the results.

### Sequence queries

As discussed in the Function composition and LINQ queries chapter, some query methods in this category can be written with query expressions syntax. In above query method list, these query methods are marked with \*.

### Generation

Enumerable type’s Empty, Range, Repeat methods can generate an IEnumerable<T> sequence. They are just normal static methods instead of extension methods:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TResult> Empty<TResult>();
```

```csharp
public static IEnumerable<int> Range(int start, int count);
```

```csharp
public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count);
```
```csharp
}
```

}

Empty just generates an IEnumerable<T> sequence, which contains no value:

internal static void Empty()

```csharp
{
```
```csharp
IEnumerable<string> empty = Enumerable.Empty<string>(); // Define query.
```
```csharp
int count = 0;
```
```csharp
foreach (string result in empty) // Execute query by pulling the results.
```
```csharp
{
```
```csharp
count++; // Not executed.
```
```csharp
}
```
```csharp
count.WriteLine(); // 0
```

}

Range generates an int sequence with the specified initial value and count of values:

internal static void Range()

```csharp
{
```
```csharp
IEnumerable<int>range = Enumerable.Range(-1, 5); // Define query.
```
```csharp
foreach (int int32 in range) // Execute query.
```
```csharp
{
```
```csharp
int32.WriteLine();
```
```csharp
}
```

}

To trace all values in a sequence, the following WriteLines extension method can be defined for IEnumerable<T>:

public static partial class TraceExtensions

```csharp
{
```
```csharp
public static void WriteLines<T>(this IEnumerable<T> values, Func<T, string> messageFactory = null)
```
```csharp
{
```
```csharp
if (messageFactory != null)
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
Trace.WriteLine(messageFactory(value));
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
foreach (T value in values)
```
```csharp
{
```
```csharp
Trace.WriteLine(value);
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

So, the above example can be simplified as:

internal static void Range()

```csharp
{
```
```csharp
IEnumerable<int> range = Enumerable.Range(-1, 5); // Define query.
```
```csharp
range.WriteLines(); // Execute query. -1 0 1 2 3
```

}

The following example creates a sequence with large number of int values:

internal static void LargeRange()

```csharp
{
```
```csharp
IEnumerable<int>range = Enumerable.Range(1, int.MaxValue); // Define query.
```

}

As just mentioned, calling above LargeRange just defines a query. A large sequence is created, but each actual value in the large sequence is not generated.

internal static void Repeat()

```csharp
{
```
```csharp
IEnumerable<string>repeat = Enumerable.Repeat("*", 5); // Define query.
```
```csharp
repeat.WriteLines(); // Execute query. * * * * *
```

}

DefaultIfEmpty generates a sequence based on the source sequence. If the source sequence is not empty, the returned sequence contains the same values from the source sequence. If the source sequence is empty, the returned sequence contains a single value, which is the default value of TSource type:

public static IEnumerable<TSource\> DefaultIfEmpty<TSource\>(this IEnumerable<TSource\> source);

The other overload of DefaultIfEmpty allows to specify what default value to use if the source sequence is empty:

public static IEnumerable<TSource\> DefaultIfEmpty<TSource\>(

this IEnumerable<TSource\> source, TSource defaultValue);

For example:

internal static void DefaultIfEmpty()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Empty<int>();
```
```csharp
IEnumerable<int>singletonIfEmpty = source.DefaultIfEmpty(); // Define query.
```
```csharp
singletonIfEmpty.WriteLines(); // Execute query: 0
```
```csharp
}
```

```csharp
internal static void DefaultIfEmptyWithDefaultValue()
```
```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Empty<int>();
```
```csharp
IEnumerable<int>singletonIfEmpty = source.DefaultIfEmpty(1);
```
```csharp
singletonIfEmpty.WriteLines(); // Execute query. 1
```

}

DefaultIfEmpty is also commonly used in left outer join, which is discussed later.

### Filtering (restriction)

As demonstrated earlier, Where filters the values in the source sequence:

public static IEnumerable<TSource> Where<TSource>(

this IEnumerable<TSource> source, Func<TSource, bool\> predicate);

Its predicate parameter is a callback function. When the query is executed, predicate is called with each value in the source sequence, and output a bool value. If output is true, this value is kept in the query result sequence; if output is false, this value is ignored. For example, the following query filters all types in .NET core library to get all primitive type:

private static readonly Assembly CoreLibrary = typeof(object).Assembly;

```csharp
internal static void Where()
```
```csharp
{
```
```csharp
IEnumerable<Type> source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<Type> primitives = source.Where(type => type.IsPrimitive); // Define query.
```
```csharp
primitives.WriteLines(); // Execute query. System.Boolean System.Byte System.Char System.Double ...
```

}

And the equivalent query expression has a where clause:

internal static void Where()

```csharp
{
```
```csharp
IEnumerable<Type>source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<Type>primitives = from type in source
```
```csharp
where type.IsPrimitive
```
```csharp
select type;
```

}

The other overload of Where accepts an indexed predicate function:

public static IEnumerable<TSource> Where<TSource>(

this IEnumerable<TSource> source, Func<TSource, int, bool\> predicate);

Here each time predicate is called with 2 parameters, a value in source sequence, and this value’s index in source sequence. For example:

internal static void WhereWithIndex()

```csharp
{
```
```csharp
IEnumerable<string>source = new string[] { "zero", "one", "two", "three", "four" };
```
```csharp
IEnumerable<string>even = source.Where((value, index) => index % 2 == 0); // Define query.
```
```csharp
even.WriteLines(); // Execute query. zero two four
```

}

The indexed Where overload is not supported in query expression syntax.

The other filtering query method is OfType. OfType is not supported in query expression either. It simply filters values by the specified type parameter:

internal static void OfType()

```csharp
{
```
```csharp
IEnumerable<object>source = new object[] { 1, 2, 'a', 'b', "aa", "bb", new object() };
```
```csharp
IEnumerable<string>strings = source.OfType<string>(); // Define query.
```
```csharp
strings.WriteLines(); // Execute query. aa bb
```

}

### Mapping (projection)

Similar to Where, Select has 2 overloads, one accepts a selector function, the other one has an indexed selector function:

IEnumerable<TResult> Select<TSource, TResult>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```

```csharp
IEnumerable<TResult> Select<TSource, TResult>(
```

this IEnumerable<TSource> source, Func<TSource, int, TResult> selector);

When the query is executed, the selector function is called with each TSource value, and map it to a TResult result in the output sequence. In the indexed overload, selector is also called with TSource value’s index. For example, the following Select query maps each integer to a formatted string that represents the integer’s square root:

internal static void Select()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<string>squareRoots = source.Select(int32 => $"{Math.Sqrt(int32):0.00}"); // Define query.
```
```csharp
squareRoots.WriteLines(); // Execute query. 0.00 1.00 1.41 1.73 2.00
```

}

The equivalent query expression is a select clause with a single from clause:

internal static void Select()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<string>squareRoots = from int32 in source
```
```csharp
select $"{Math.Sqrt(int32):0.00}";
```

}

Query expression must end with either a select clause, or group clause (discussed below). If there are other clauses between the starting from clause and the ending select clause, and the ending select clause simply has the value from the source sequence, then that ending select clause is ignored and is not compiled to a Select query method call. Above where query expression is such an example.

The following is an example of the indexed overload:

internal static IEnumerable<string\> Words() => new string\[\] { "Zero", "one", "Two", "three", "four" };

```csharp
internal static void SelectWithIndex()
```
```csharp
{
```
```csharp
IEnumerable<string>source = Words();
```
```csharp
var mapped = source.Select((value, index) => new
```
```csharp
{
```
```csharp
Index = index,
```
```csharp
Word = value.ToLowerInvariant()
```
```csharp
}); // Define query: IEnumerable<(string Word, int Index)>
```
```csharp
mapped.WriteLines(result => $"{result.Index}:{result.Word}"); // Execute query.
```
```csharp
// 0:zero 1:one 2:two 3:three 4:four
```

}

Here selector returns anonymous type. As a result, Select returns a sequence of anonymous type, and var has to be used.

As discussed in the Immutability chapter, let clause is also compiled to Select query with a selector function returning anonymous type:

internal static void Let()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(-2, 5);
```
```csharp
IEnumerable<string>absoluteValues = from int32 in source
```
```csharp
let abs = Math.Abs(int32)
```
```csharp
where abs > 0
```
```csharp
select $"Math.Abs({int32}) == {abs}";
```

}

The compiled Select query returns a (int int32, int abs) anonymous type:

internal static void CompiledLet()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(-2, 5);
```
```csharp
IEnumerable<string>absoluteValues = source
```
```csharp
.Select(int32 => new { int32 = int32, abs = Math.Abs(int32) })
```
```csharp
.Where(anonymous => anonymous.abs > 0)
```
```csharp
.Select(anonymous => $"Math.Abs({anonymous.int32}):{anonymous.abs}"); // Define query.
```
```csharp
absoluteValues.WriteLines(); // Execute query.
```
```csharp
// Math.Abs(-2):2 Math.Abs(-1):1 Math.Abs(1):1 Math.Abs(2):2
```

}

SelectMany has 4 overloads. Similar to Where and Select, the following 2 overloads accept unindexed and indexed selector:

public static IEnumerable<TResult\> SelectMany<TSource, TResult\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, IEnumerable<TResult>> selector);
```

```csharp
public static IEnumerable<TResult> SelectMany<TSource, TResult>(
```

this IEnumerable<TSource\> source, Func<TSource, int, IEnumerable<TResult\>>selector);

In contrast with Select, SelectMany’s selector is a one to many mapping. If there are N values from the source sequence, then they are mapped to N sequences. And eventually, SelectMany concatenates these N sequences into one single sequence. The following example calls SelectMany to query all members of all types in .NET core library, then filter the obsolete members (members with \[Obsolete\]):

internal static MemberInfo\[\] GetDeclaredMembers(this Type type) =>

```csharp
type.GetMembers(
```
```csharp
BindingFlags.Public | BindingFlags.Static | BindingFlags.Instance | BindingFlags.DeclaredOnly);
```

```csharp
internal static bool IsObsolete(this MemberInfo member) =>
```
```csharp
member.IsDefined(attributeType: typeof(ObsoleteAttribute), inherit: false);
```

```csharp
internal static void SelectMany()
```
```csharp
{
```
```csharp
IEnumerable<Type>source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<MemberInfo>oneToManyMapped = source.SelectMany(type => type.GetDeclaredMembers()); // Define query.
```
```csharp
IEnumerable<MemberInfo> filtered = oneToManyMapped.Where(member => member.IsObsolete()); // Define query.
```
```csharp
filtered.WriteLines(obsoleteMember => $"{obsoleteMember.DeclaringType}:{obsoleteMember}"); // Execute query.
```
```csharp
// Equivalent to:
```
```csharp
// foreach (MemberInfo obsoleteMember in filtered)
```
```csharp
// {
```
```csharp
// Trace.WriteLine($"{obsoleteMember.DeclaringType}:{obsoleteMember}");
```
```csharp
// }
```
```csharp
// ...
```
```csharp
// System.Enum:System.String ToString(System.String, System.IFormatProvider)
```
```csharp
// System.Enum:System.String ToString(System.IFormatProvider)
```
```csharp
// ...
```

}

Apparently, the above SelectMany, Where, and are both extension methods for IEnumerable<T>, and they both return IEnumerable<T>, so that above LINQ query can be fluent, as expected:

internal static void FluentSelectMany()

```csharp
{
```
```csharp
IEnumerable<MemberInfo> mappedAndFiltered = CoreLibrary
```
```csharp
.ExportedTypes
```
```csharp
.SelectMany(type => type.GetDeclaredMembers())
```
```csharp
.Where(member => member.IsObsolete()); // Define query.
```
```csharp
mappedAndFiltered.WriteLines(obsoleteMember => $"{obsoleteMember.DeclaringType}:{obsoleteMember}"); // Execute query.
```

}

And the equivalent query expression has 2 from clauses:

internal static void SelectMany()

```csharp
{
```
```csharp
IEnumerable<MemberInfo>mappedAndFiltered =
```
```csharp
from type in CoreLibrary.ExportedTypes
```
```csharp
from member in type.GetPublicDeclaredMembers()
```
```csharp
where member.IsObsolete()
```
```csharp
select member;
```

}

Generally, SelectMany can flatten a hierarchical 2-level-sequence into a flat 1-level-sequence. In these examples, the source sequence is hierarchical – it has many types, and each type can have a sequence of many members. SelectMany flattens the hierarchy, and concatenates many sequences of members into a single sequence of members.

The other 2 SelectMany overloads accept 2 selector functions:

public static IEnumerable<TResult\> SelectMany<TSource, TCollection, TResult\>(

```csharp
this IEnumerable<TSource> source, Func<TSource,
```
```csharp
IEnumerable<TCollection>> collectionSelector,
```
```csharp
Func<TSource, TCollection, TResult>resultSelector);
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

Func<TSource, TCollection, TResult\>resultSelector);

They accept 2 selector functions. The collection selector (non-indexed and index) maps source sequence’s each TSource value to many TCollection values (an IEnumerable<TCollection> sequence), and the result selector maps each TCollection value and its original TSource value to a TResult value. So eventually they still return a sequence of TResult values. For example, the following example use result selector to map type and member to string representation:

internal static void SelectManyWithResultSelector()

```csharp
{
```
```csharp
IEnumerable<Type> source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<string> obsoleteMembers = source
```
```csharp
.SelectMany(
```
```csharp
collectionSelector: type => type.GetDeclaredMembers(),
```
```csharp
resultSelector: (type, member) => new { Type = type, Member = member })
```
```csharp
.Where(typeAndMember => typeAndMember.Member.IsObsolete())
```
```csharp
.Select(typeAndMember => $"{typeAndMember.Type}:{typeAndMember.Member}");
```

}

The equivalent query expression has 2 from clauses for the SelectMany query, a where clause for Where, and 1 select query for Select:

internal static void SelectManyWithResultSelector()

```csharp
{
```
```csharp
IEnumerable<Type>source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<string>obsoleteMembers =
```
```csharp
from type in source
```
```csharp
from member in type.GetDeclaredMembers()
```
```csharp
where member.IsObsolete()
```
```csharp
select $"{type}:{member}";
```

}

The collection selector function returns a sequence, which can be queried too. Here the Where query logically filters the obsolete member can be equivalently applied to the collection selector, which is called a subquery:

internal static void SelectManyWithResultSelectorAndSubquery()

```csharp
{
```
```csharp
IEnumerable<Type> source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<string> obsoleteMembers = source.SelectMany(
```
```csharp
collectionSelector: type => type.GetDeclaredMembers().Where(member => member.IsObsolete()),
```
```csharp
resultSelector: (type, obsoleteMember) => $"{type}:{obsoleteMember}"); // Define query.
```
```csharp
obsoleteMembers.WriteLines(); // Execute query.
```

}

The equivalent query expression has a sub query expression for Where:

internal static void SelectManyWithResultSelectorAndSubquery()

```csharp
{
```
```csharp
IEnumerable<Type>source = CoreLibrary.ExportedTypes;
```
```csharp
IEnumerable<string>obsoleteMembers =
```
```csharp
from type in source
```
```csharp
from obsoleteMember in (from member in type.GetDeclaredMembers()
```
```csharp
where member.IsObsolete()
```
```csharp
select member)
```
```csharp
select $"{type}:{obsoleteMember}"; // Define query.
```
```csharp
obsoleteMembers.WriteLines(); // Execute query.
```

}

SelectMany is a very powerful query method, and the multiple from clauses is also a powerful syntax to build a functional workflow. This is discussed in the Category Theory chapters.

### Grouping

The GroupBy method has 8 overloads. The minimum requirement is to specified a key selector function, which is called with each value in the source sequence, and return a key:

public static IEnumerable<IGrouping<TKey, TSource\>> GroupBy<TSource, TKey\>(

this IEnumerable<TSource\> source, Func<TSource, TKey\> keySelector);

Each value from the source sequence is mapped to a key by calling the keys elector. If 2 keys are equal, these 2 source values are in the same group. Take the following persons as example:

internal class Person

```csharp
{
```
```csharp
internal Person(string name, string placeOfBirth)
```
```csharp
{
```
```csharp
this.Name = name;
```
```csharp
this.PlaceOfBirth = placeOfBirth;
```
```csharp
}
```

```csharp
internal string Name { get; }
```

```csharp
internal string PlaceOfBirth { get; }
```
```csharp
}
```

```csharp
internal static partial class QueryMethods
```
```csharp
{
```
```csharp
internal static IEnumerable<Person> Persons() => new Person[]
```
```csharp
{
```
```csharp
new Person(name: "Robert Downey Jr.", placeOfBirth: "US"),
```
```csharp
new Person(name: "Tom Hiddleston", placeOfBirth: "UK"),
```
```csharp
new Person(name: "Chris Hemsworth", placeOfBirth: "AU"),
```
```csharp
new Person(name: "Chris Evans", placeOfBirth: "US"),
```
```csharp
new Person(name: "Paul Bettany", placeOfBirth: "UK")
```
```csharp
};
```

}

These Person instances represent actors of Marvel Cinematic Universe. They can be simply grouped by their place of birth:

internal static void GroupBy()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<IGrouping<string, Person>>groups = source.GroupBy(person => person.PlaceOfBirth); // Define query.
```
```csharp
foreach (IGrouping<string, Person> group in groups) // Execute query.
```
```csharp
{
```
```csharp
$"{group.Key}: ".Write();
```
```csharp
foreach (Person person in group)
```
```csharp
{
```
```csharp
$"{person.Name}, ".Write();
```
```csharp
}
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
// US: Robert Downey Jr., Chris Evans,
```
```csharp
// UK: Tom Hiddleston, Paul Bettany,
```
```csharp
// AU: Chris Hemsworth,
```

}

GroupBy returns IEnumerable<IGrouping<TKey, TSource>>. The following is the definition of IGrouping<TKey, TElement> interface:

namespace System.Linq

```csharp
{
```
```csharp
public interface IGrouping<out TKey, out TElement> : IEnumerable<TElement>, IEnumerable
```
```csharp
{
```
```csharp
TKey Key { get; }
```
```csharp
}
```

}

It is just an IEnumerable<T> sequence with an additional Key property. So, above GroupBy returns a hierarchical sequence. It is a sequence of groups, where each group is a sequence of values. The equivalent query expression is a group clause:

internal static void GroupBy()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<IGrouping<string, Person>>groups = from person in source
```
```csharp
group person by person.PlaceOfBirth;
```

}

GroupBy can also accepts a result selector function to map each group and its key to a result in the returned sequence:

public static IEnumerable<TResult\> GroupBy<TSource, TKey, TResult\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector,
```

Func<TKey, IEnumerable<TSource\>, TResult\> resultSelector);

This overload, does not return of hierarchical sequence of groups, but flattened sequence of result values:

internal static void GroupByWithResultSelector()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<string>groups = source
```
```csharp
.GroupBy(
```
```csharp
keySelector: person => person.PlaceOfBirth,
```
```csharp
resultSelector: (key, group) => $"{key}:{group.Count()}"); // Define query.
```
```csharp
groups.WriteLines(); // Execute query. US:2 UK:2 AU:1
```

}

This overload is directly not supported by query expression. However, its result selector can be equivalently applied with an additional Select query:

internal static void GroupByAndSelect()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<IGrouping<string, Person>>groups = source.GroupBy(person => person.PlaceOfBirth);
```
```csharp
IEnumerable<string>mapped = groups.Select(group => $"{group.Key}: {group.Count()}"); // Define query.
```
```csharp
groups.WriteLines(); // Execute query. US:2 UK:2 AU:1
```

}

As just demonstrated, this GroupBy overload is equivalent to query expression with a group clause, and Select can be compiled from a select clause:

internal static void GroupByAndSelect()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<IGrouping<string, Person>>groups = from person in source
```
```csharp
group person by person.PlaceOfBirth;
```
```csharp
IEnumerable<string>mapped = from @group in groups
```
```csharp
select $"{@group.Key}: {@group.Count()}";
```

}

Here @ is prepended to the @group identifier, because group is a query keyword. By removing the groups variable, the first query expression becomes the second query expression’s subquery:

internal static void FluentGroupByAndSelect()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<string>mapped = from @group in (from person in source
```
```csharp
group person by person.PlaceOfBirth)
```
```csharp
select $"{@group.Key}: {@group.Count()}";
```

}

The above expression is nested rather than fluent. So, the into query keyword is provided for continuation like this:

internal static void GroupByAndSelectWithInto()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<string>mapped = from person in source
```
```csharp
group person by person.PlaceOfBirth into @group
```
```csharp
select $"{@group.Key}: {@group.Count()}";
```

}

The compilation of the above 2 query expressions are identical.

GroupBy can also accept an element selector function to map each value in the source sequence in the source sequence to a result value in the group:

public static IEnumerable<IGrouping<TKey, TElement\>> GroupBy<TSource, TKey, TElement\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector,
```

Func<TSource, TElement\> elementSelector);

For example:

internal static void GroupByWithElementSelector()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<IGrouping<string, string>>groups = source
```
```csharp
.GroupBy(
```
```csharp
keySelector: person => person.PlaceOfBirth,
```
```csharp
elementSelector: person => person.Name); // Define query.
```
```csharp
foreach (IGrouping<string, string> group in groups) // Execute query.
```
```csharp
{
```
```csharp
$"{group.Key}: ".Write();
```
```csharp
foreach (string name in group)
```
```csharp
{
```
```csharp
$"{name}, ".Write();
```
```csharp
}
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
// US: Robert Downey Jr., Chris Evans,
```
```csharp
// UK: Tom Hiddleston, Paul Bettany,
```
```csharp
// AU: Chris Hemsworth,
```

}

In query expression, the element selector can be specified after the group keyword:

internal static void GroupByWithElementSelector()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<IGrouping<string, string>>groups = from person in source
```
```csharp
group person.Name by person.PlaceOfBirth;
```

}

And element selector can be used with result selector:

public static IEnumerable<TResult\> GroupBy<TSource, TKey, TElement, TResult\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector,
```
```csharp
Func<TSource, TElement> elementSelector,
```

Func<TKey, IEnumerable<TElement\>, TResult\> resultSelector);

Again, result selector can flatten the hierarchical sequence:

internal static void GroupByWithElementAndResultSelector()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<string>groups = source.GroupBy(
```
```csharp
keySelector: person => person.PlaceOfBirth,
```
```csharp
elementSelector: person => person.Name,
```
```csharp
resultSelector: (key, group) => $"{key}: {string.Join(", ", group)}"); // Define query.
```
```csharp
groups.WriteLines(); // Execute query.
```
```csharp
// US: Robert Downey Jr., Chris Evans
```
```csharp
// UK: Tom Hiddleston, Paul Bettany
```
```csharp
// AU: Chris Hemsworth
```

}

Similar to SelectMany, GroupBy with both element selector and result selector is not directly supported in query expression. The result selector logic can be done with a select continuation:

internal static void GroupByWithElementSelectorAndSelect()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<string>groups = from person in source
```
```csharp
group person.Name by person.PlaceOfBirth into @group
```
```csharp
select $"{@group.Key}: {string.Join(",", @group)}";
```

}

The rest 4 overloads accept an IEqualityComparer<TKey> interface:

public static IEnumerable<IGrouping<TKey, TSource\>> GroupBy<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IEqualityComparer<TKey> comparer);
```

```csharp
public static IEnumerable<TResult> GroupBy<TSource, TKey, TResult>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector,
```
```csharp
Func<TKey, IEnumerable<TSource>, TResult> resultSelector,
```
```csharp
IEqualityComparer<TKey>comparer);
```

```csharp
public static IEnumerable<IGrouping<TKey, TElement>>GroupBy<TSource, TKey, TElement>(
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
IEqualityComparer<TKey>comparer);
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

IEqualityComparer<TKey\>comparer);

IEqualityComparer<TKey> provides the methods to determine whether 2 keys are equal when grouping all keys:

namespace System.Collections.Generic

```csharp
{
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

For example:

internal static void GroupByWithEqualityComparer()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<string>groups = source.GroupBy(
```
```csharp
keySelector: person => person.PlaceOfBirth,
```
```csharp
elementSelector: person => person.Name,
```
```csharp
resultSelector: (key, group) => $"{key}:{string.Join(",", group)}",
```
```csharp
comparer: StringComparer.OrdinalIgnoreCase); // Define query.
```
```csharp
groups.WriteLines(); // Execute query. US:2 UK: 2 AU: 1
```

}

These 4 overloads are not supported by query expression.

### Join

The most common join operations are inner join, left outer join and cross join. LINQ provides Join query method for inner join, and provides GroupJoin for left outer join. Cross join can be easily done with SelectMany or Join.

#### Inner join

Join is designed for inner join:

IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(

```csharp
this IEnumerable<TOuter> outer, IEnumerable<TInner> inner,
```
```csharp
Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<TOuter, TInner, TResult> resultSelector)
```

```csharp
IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
```
```csharp
this IEnumerable<TOuter> outer, IEnumerable<TInner> inner,
```
```csharp
Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<TOuter, TInner, TResult> resultSelector,
```

IEqualityComparer<TKey> comparer)

Each outer value from the outer source is mapped to an outer key by calling the outer key selector, and each inner value from the inner source is mapped to an inner key. When an outer key is equal to an inner key, the source outer value and the matching source inner value are paired, and mapped to a result by calling the result selector. So each outer value with a matching inner value is mapped to a result in the returned sequence, and each outer value without a matching inner value is ignored. Take the following characters as example:

internal partial class Character

```csharp
{
```
```csharp
internal Character(string name, string placeOfBirth, string starring)
```
```csharp
{
```
```csharp
this.Name = name;
```
```csharp
this.PlaceOfBirth = placeOfBirth;
```
```csharp
this.Starring = starring;
```
```csharp
}
```

```csharp
internal string Name { get; }
```

```csharp
internal string PlaceOfBirth { get; }
```

```csharp
internal string Starring { get; }
```
```csharp
}
```

```csharp
internal static partial class QueryMethods
```
```csharp
{
```
```csharp
internal static IEnumerable<Character> Characters() => new Character[]
```
```csharp
{
```
```csharp
new Character(name: "Tony Stark", placeOfBirth: "US", starring: "Robert Downey Jr."),
```
```csharp
new Character(name: "Thor", placeOfBirth: "Asgard", starring: "Chris Hemsworth"),
```
```csharp
new Character(name: "Steve Rogers", placeOfBirth: "US", starring: "Chris Evans"),
```
```csharp
new Character(name: "Vision", placeOfBirth: "KR", starring: "Paul Bettany"),
```
```csharp
new Character(name: "JARVIS", placeOfBirth: "US", starring: "Paul Bettany")
```
```csharp
};
```

}

These Character instances represent characters in the movie Avengers 2, and can be joined with actors. When a character from outer sequence matches an actor from inner sequence by cast, these 2 values are paired and mapped to the result sequence:

internal static void InnerJoin()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
IEnumerable<string>innerJoin = outer.Join(
```
```csharp
inner: inner,
```
```csharp
outerKeySelector: person => person.Name,
```
```csharp
innerKeySelector: character => character.Starring,
```
```csharp
resultSelector: (person, character) => $"{person.Name} ({person.PlaceOfBirth}): {character.Name}"); // Define query.
```
```csharp
innerJoin.WriteLines(); // Execute query.
```
```csharp
// Robert Downey Jr. (US): Tony Stark
```
```csharp
// Chris Hemsworth (AU): Thor
```
```csharp
// Chris Evans (US): Steve Rogers
```
```csharp
// Paul Bettany (UK): Vision
```
```csharp
// Paul Bettany (UK): JARVIS
```

}

In the inner join results, the name “Tom Hiddleston” does not exist in the results, because the person with this name cannot match with any character’s starring (Tom Hiddleston is the actor of Loki, who is in Avengers 1 but not in Avengers 2). And the name “Paul Bettany” appears twice in the results, because the person with this name matches 2 characters’ starring (Paul Bettany is the voice of JARVIS and the actor of Vision). The equivalent query expression has a join clause:

internal static void InnerJoin()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
IEnumerable<string>innerJoin =
```
```csharp
from person in outer
```
```csharp
join character in inner on person.Name equals character.Starring
```
```csharp
select $"{person.Name} ({person.PlaceOfBirth}): {character.Name}";
```

}

In the above example, the outer value and the inner value are matched with a single key - Person.Name property and Character.Starring property. To match with multiple keys, just have both outer key selector and inner key selector return the same anonymous type with multiple properties:

internal static void InnerJoinWithMultipleKeys()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
IEnumerable<string>innerJoin = outer.Join(
```
```csharp
inner: inner,
```
```csharp
outerKeySelector: person => new { Starring = person.Name, PlaceOfBirth = person.PlaceOfBirth },
```
```csharp
innerKeySelector: character => new { Starring = character.Starring, PlaceOfBirth = character.PlaceOfBirth },
```
```csharp
resultSelector: (person, character) =>
```
```csharp
$"{person.Name} ({person.PlaceOfBirth}): {character.Name} ({character.PlaceOfBirth})"); // Define query.
```
```csharp
innerJoin.WriteLines(); // Execute query.
```
```csharp
// Robert Downey Jr. (US): Tony Stark (US)
```
```csharp
// Chris Evans (US): Steve Rogers (US)
```

}

Anonymous type can be also used with join clause in query expression:

internal static void InnerJoinWithMultiKeys()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character> inner = Characters();
```
```csharp
IEnumerable<string>innerJoin =
```
```csharp
from person in outer
```
```csharp
join character in inner
```
```csharp
on new { Starring = person.Name, PlaceOfBirth = person.PlaceOfBirth }
```
```csharp
equals new { Starring = character.Starring, PlaceOfBirth = character.PlaceOfBirth }
```
```csharp
select $"{person.Name} ({person.PlaceOfBirth}): {character.Name} ({character.PlaceOfBirth})";
```

}

#### Left outer join

GroupJoin is designed for left outer join:

IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(

```csharp
this IEnumerable<TOuter> outer, IEnumerable<TInner> inner,
```
```csharp
Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<TOuter, IEnumerable<TInner>, TResult> resultSelector)
```

```csharp
IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
```
```csharp
this IEnumerable<TOuter> outer, IEnumerable<TInner> inner,
```
```csharp
Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector,
```
```csharp
Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
```

IEqualityComparer<TKey> comparer)

Each outer value from the outer source is mapped to an outer key by calling the outer key selector, and each inner value from the inner source is mapped to an inner key. When an outer key is equal to zero, one, or more inner key, the source outer value and all the matching source inner values are paired, and mapped to a result by calling the result selector. So each outer value with or without matching inner values is mapped to a result in the returned sequence. It is called GroupJoin, because each outer value is paired with a group of matching inner values. If there is no matching inner value, the outer value is paired with an empty group:

internal static void LeftOuterJoin()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
var leftOuterJoin = outer.GroupJoin(
```
```csharp
inner: inner,
```
```csharp
outerKeySelector: person => person.Name,
```
```csharp
innerKeySelector: character => character.Starring,
```
```csharp
resultSelector: (person, charactersGroup) =>
```
```csharp
new { Person = person, Characters = charactersGroup }); // Define query.
```
```csharp
foreach (var result in leftOuterJoin) // Execute query.
```
```csharp
{
```
```csharp
$"{result.Person.Name} ({result.Person.PlaceOfBirth}): ".Write();
```
```csharp
foreach (Character character in result.Characters)
```
```csharp
{
```
```csharp
$"{character.Name} ({character.PlaceOfBirth}), ".Write();
```
```csharp
}
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
// Robert Downey Jr. (US): Tony Stark (US),
```
```csharp
// Tom Hiddleston (UK):
```
```csharp
// Chris Hemsworth (AU): Thor (Asgard),
```
```csharp
// Chris Evans (US): Steve Rogers (US),
```
```csharp
// Paul Bettany (UK): Vision (KR), JARVIS (US),
```

}

Here result selector is called with each actor, and a group of matching characters, then it returns anonymous type consists of both the actor and the matching characters. So eventually GroupJoin returns a hierarchical sequence. In the results, the person with name “Tom Hiddleston” matches no character, so it is paired with an empty Character group, and each other person matches 1 or more characters, so is paired with a non-empty Character group. In query expression, GroupJoin is equivalent to join clause with the into keyword:

internal static void LeftOuterJoin()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
var leftOuterJoin =
```
```csharp
from person in outer
```
```csharp
join character in inner on person.Name equals character.Starring into charactersGroup
```
```csharp
select new { Person = person, Characters = charactersGroup };
```

}

In the join clause, into does not mean a continuation. it is a part of the join.

The hierarchical sequence returned by GroupJoin can be flattened by SelectMany. In this kind of flattening scenario, DefaultIfEmpty is usually used:

internal static void LeftOuterJoinWithDefaultIfEmpty()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
var leftOuterJoin = outer
```
```csharp
.GroupJoin(
```
```csharp
inner: inner,
```
```csharp
outerKeySelector: person => person.Name,
```
```csharp
innerKeySelector: character => character.Starring,
```
```csharp
resultSelector: (person, charactersGroup) => new { Person = person, Characters = charactersGroup })
```
```csharp
.SelectMany(
```
```csharp
collectionSelector: group => group.Characters.DefaultIfEmpty(),
```
```csharp
resultSelector: (group, character) => new { Person = group.Person, Character = character }); // Define query.
```
```csharp
leftOuterJoin.WriteLines(result => $"{result.Person.Name}: {result.Character?.Name}");
```
```csharp
// Robert Downey Jr.: Tony Stark
```
```csharp
// Tom Hiddleston:
```
```csharp
// Chris Hemsworth: Thor
```
```csharp
// Chris Evans: Steve Rogers
```
```csharp
// Paul Bettany: Vision
```
```csharp
// Paul Bettany: JARVIS
```

}

Without the DefaultIfEmpty call, the second result “Tom Hiddleston” is ignored in the result sequence. The equivalent query expression has 2 from clauses for SelectMany:

internal static void LeftOuterJoinWithDefaultIfEmpty()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
var leftOuterJoin =
```
```csharp
from person in outer
```
```csharp
join character in inner on person.Name equals character.Starring into charactersGroup
```
```csharp
from character in charactersGroup.DefaultIfEmpty()
```
```csharp
select new { Person = person, Character = character };
```

}

There is already a from clause before join clause, so, just add one more from clause after join clause.

Left outer join can also implement by mapping each outer value with all filtered matching inner values:

internal static void LeftOuterJoinWithSelect()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
var leftOuterJoin = outer.Select(person => new
```
```csharp
{
```
```csharp
Person = person,
```
```csharp
Characters = inner.Where(character =>
```
```csharp
EqualityComparer<string>.Default.Equals(person.Name, character.Starring))
```
```csharp
}); // Define query.
```
```csharp
foreach (var result in leftOuterJoin) // Execute query.
```
```csharp
{
```
```csharp
$"{result.Person.Name} ({result.Person.PlaceOfBirth}): ".Write();
```
```csharp
foreach (Character character in result.Characters)
```
```csharp
{
```
```csharp
$"{character.Name} ({character.PlaceOfBirth}), ".Write();
```
```csharp
}
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
// Robert Downey Jr. (US): Tony Stark (US),
```
```csharp
// Tom Hiddleston (UK):
```
```csharp
// Chris Hemsworth (AU): Thor (Asgard),
```
```csharp
// Chris Evans (US): Steve Rogers (US),
```
```csharp
// Paul Bettany (UK): Vision (KR), JARVIS (US),
```

}

Notice here the Where subquery filters all inner values for each outer value. Generally, left outer join can be implemented with mapping query and filtering subquery:

internal static IEnumerable<TResult\> LeftOuterJoinWithSelect<TOuter, TInner, TKey, TResult\>(

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
comparer = comparer ?? EqualityComparer<TKey>.Default;
```
```csharp
return outer.Select(outerValue => resultSelector(
```
```csharp
outerValue,
```
```csharp
inner.Where(innerValue => comparer.Equals(outerKeySelector(outerValue), innerKeySelector(innerValue)))));
```

}

In query expression, it just a simple query expression with a select clause containing a subquery with a where clause:

internal static void LeftOuterJoinWithSelect()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
var leftOuterJoin =
```
```csharp
from person in outer
```
```csharp
select new
```
```csharp
{
```
```csharp
Person = person,
```
```csharp
Characters = from character in inner
```
```csharp
where EqualityComparer<string>.Default.Equals(person.Name, character.Starring)
```
```csharp
select character
```
```csharp
};
```
```csharp
}
```

```csharp
internal static IEnumerable<TResult> LeftOuterJoinWithSelect<TOuter, TInner, TKey, TResult>(
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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TKey>.Default;
```
```csharp
return from outerValue in outer
```
```csharp
select resultSelector(
```
```csharp
outerValue,
```
```csharp
(from innerValue in inner
```
```csharp
where comparer.Equals(outerKeySelector(outerValue), innerKeySelector(innerValue))
```
```csharp
select innerValue));
```

}

The difference is, for N outer values, GroupJoin pull all inner values once and cache them, Select and Where does not cache anything and pull all inner values N times. The internal implementation of these query methods are discussed later in this chapter.

#### Cross Join

Cross join 2 sequences is to return the Cartesian product of values in those 2 sequences. The easiest way for cross join is SelectMany:

private static readonly int\[\] Rows = { 1, 2, 3 };

```csharp
private static readonly string[] Columns = { "A", "B", "C", "D" };
```

```csharp
internal static void CrossJoin()
```
```csharp
{
```
```csharp
IEnumerable<string>cells = Rows
```
```csharp
.SelectMany(row => Columns, (row, column) => $"{column}{row}"); // Define query.
```

```csharp
int cellIndex = 0;
```
```csharp
int columnCount = Columns.Length;
```
```csharp
foreach (string cell in cells) // Execute query.
```
```csharp
{
```
```csharp
$"{cell} ".Write();
```
```csharp
if (++cellIndex % columnCount == 0)
```
```csharp
{
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
}
```
```csharp
// A1 B1 C1 D1
```
```csharp
// A2 B2 C2 D2
```
```csharp
// A3 B3 C3 D3
```

}

Notice here all inner values are pulled for each outer value. If outer sequence has N outer values, then the inner sequence are iterated N times. In query expression, as fore mentioned, 2 from clauses are compiled to SelectMany:

internal static void CrossJoin()

```csharp
{
```
```csharp
IEnumerable<string>cells = from row in Rows
```
```csharp
from column in Columns
```
```csharp
select $"{column}{row}";
```

}

A general CrossJoin query method can be implemented as:

internal static IEnumerable<TResult\> CrossJoin<TOuter, TInner, TResult\>(

```csharp
this IEnumerable<TOuter> outer,
```
```csharp
IEnumerable<TInner>inner,
```
```csharp
Func<TOuter, TInner, TResult>resultSelector) =>
```
```csharp
outer.SelectMany(outerValue => inner, resultSelector);
```
```csharp
// Equivalent to:
```
```csharp
// from outerValue in outer
```
```csharp
// from innerValue in inner
```

// select resultSelector(outerValue, innerValue);

Cross join can also be done with Join, with inner key always equal to outer key, so that each outer value matches all inner values:

internal static void CrossJoinWithJoin()

```csharp
{
```
```csharp
IEnumerable<string>cells = Rows.Join(
```
```csharp
inner: Columns,
```
```csharp
outerKeySelector: row => true,
```
```csharp
innerKeySelector: column => true,
```
```csharp
resultSelector: (row, column) => $"{column}{row}"); // Define query.
```
```csharp
int cellIndex = 0;
```
```csharp
int columnCount = Columns.Length;
```
```csharp
foreach (string cell in cells) // Execute query.
```
```csharp
{
```
```csharp
$"{cell} ".Write();
```
```csharp
if (++cellIndex % columnCount == 0)
```
```csharp
{
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
}
```

}

And generally, cross join can be implemented by Join as:

internal static IEnumerable<TResult\> CrossJoinWithJoin<TOuter, TInner, TResult\>(

```csharp
this IEnumerable<TOuter> outer,
```
```csharp
IEnumerable<TInner>inner,
```
```csharp
Func<TOuter, TInner, TResult>resultSelector) =>
```
```csharp
outer.Join(
```
```csharp
inner: inner,
```
```csharp
outerKeySelector: outerValue => true,
```
```csharp
innerKeySelector: innerValue => true,
```
```csharp
resultSelector: resultSelector); // Equivalent to:
```
```csharp
// Equivalent to:
```
```csharp
// from outerValue in outer
```
```csharp
// join innerValue in inner on true equals true
```

// select resultSelector(outerValue, innerValue);

In query expression, again, Join is just a join clause without into:

internal static void CrossJoinWithJoin()

```csharp
{
```
```csharp
IEnumerable<string>cells = from row in Rows
```
```csharp
join column in Columns on true equals true
```
```csharp
select $"{column}{row}";
```
```csharp
}
```

```csharp
internal static IEnumerable<TResult> CrossJoinWithJoin<TOuter, TInner, TResult>(
```
```csharp
this IEnumerable<TOuter> outer,
```
```csharp
IEnumerable<TInner>inner,
```
```csharp
Func<TOuter, TInner, TResult>resultSelector) =>
```
```csharp
from outerValue in outer
```
```csharp
join innerValue in inner on true equals true
```

select resultSelector(outerValue, innerValue);

The above inner join can be logically viewed as cross join with filtering the matching outer value and inner value. The above inner join of persons and characters can be implemented with SelectMany and Where as:

internal static void InnerJoinWithSelectMany()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
IEnumerable<string>innerJoin = outer
```
```csharp
.SelectMany(
```
```csharp
collectionSelector: person => inner,
```
```csharp
resultSelector: (person, character) => new { Person = person, Character = character })
```
```csharp
.Where(crossJoinValue => EqualityComparer<string>.Default.Equals(
```
```csharp
crossJoinValue.Person.Name, crossJoinValue.Character.Starring))
```
```csharp
.Select(innerJoinValue =>
```
```csharp
$"{innerJoinValue.Person.Name} ({innerJoinValue.Person.PlaceOfBirth}): {innerJoinValue.Character.Name}");
```
```csharp
// Define query.
```
```csharp
innerJoin.WriteLines(); // Execute query.
```
```csharp
// Robert Downey Jr. (US): Tony Stark
```
```csharp
// Chris Hemsworth (AU): Thor
```
```csharp
// Chris Evans (US): Steve Rogers
```
```csharp
// Paul Bettany (UK): Vision
```
```csharp
// Paul Bettany (UK): JARVIS
```

}

Generally, inner join and be implemented with cross join and filtering:

internal static IEnumerable<TResult\> InnerJoinWithSelectMany<TOuter, TInner, TKey, TResult\>(

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
comparer = comparer ?? EqualityComparer<TKey>.Default;
```
```csharp
return outer
```
```csharp
.SelectMany(
```
```csharp
collectionSelector: outerValue => inner,
```
```csharp
resultSelector: (outerValue, innerValue) => new { OuterValue = outerValue, InnerValue = innerValue })
```
```csharp
.Where(
```
```csharp
crossJoinValue => comparer.Equals(
```
```csharp
outerKeySelector(crossJoinValue.OuterValue),
```
```csharp
innerKeySelector(crossJoinValue.InnerValue)))
```
```csharp
.Select(innerJoinValue => resultSelector(innerJoinValue.OuterValue, innerJoinValue.InnerValue));
```

}

In query expression, as fore mentioned, SelectMany is 2 from clauses:

internal static void InnerJoinWithSelectMany()

```csharp
{
```
```csharp
IEnumerable<Person>outer = Persons();
```
```csharp
IEnumerable<Character>inner = Characters();
```
```csharp
IEnumerable<string>innerJoin =
```
```csharp
from person in outer
```
```csharp
from character in inner
```
```csharp
where EqualityComparer<string>.Default.Equals(person.Name, character.Starring)
```
```csharp
select $"{person.Name} ({person.PlaceOfBirth}): {character.Name}";
```
```csharp
}
```

```csharp
internal static IEnumerable<TResult> InnerJoinWithSelectMany<TOuter, TInner, TKey, TResult>(
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
IEqualityComparer<TKey>comparer = null)
```
```csharp
{
```
```csharp
comparer = comparer ?? EqualityComparer<TKey>.Default;
```
```csharp
return from outerValue in outer,
```
```csharp
from innerValue in inner
```
```csharp
where comparer.Equals(outerKeySelector(outerValue), innerKeySelector(innerValue))
```
```csharp
select resultSelector(outerValue, innerValue);
```

}

The difference is, for N outer values, Join pull all inner values once and cache them, SelectMany does not cache anything and pull all inner values N times. Again, the internal implementation of these query methods is discussed later in this chapter.

### Concatenation

Concat merges 2 sequences by putting the second sequence’s values after the first sequence’s values:

public static IEnumerable<TSource\> Concat<TSource\>(

this IEnumerable<TSource\> first, IEnumerable<TSource\> second);

For example:

internal static int\[\] First() => new int\[\] { 1, 2, 3, 4, 4 };

```csharp
internal static int[] Second() => new int[] { 3, 4, 5, 6 };
```

```csharp
internal static void Concat()
```
```csharp
{
```
```csharp
IEnumerable<int>first = First();
```
```csharp
IEnumerable<int>second = Second();
```
```csharp
IEnumerable<int>concat = first.Concat(second); // Define query.
```
```csharp
concat.WriteLines(); // Execute query. 1 2 3 4 4 3 4 5 6
```

}

.NET Core provides Prepend/Append, which merge the specified value to the beginning/end of the source sequence:

public static IEnumerable<TSource\> Prepend<TSource\>(this IEnumerable<TSource\> source, TSource element);

public static IEnumerable<TSource\> Append<TSource\>(this IEnumerable<TSource\> source, TSource element);

For example:

internal static void AppendPrepend()

```csharp
{
```
```csharp
IEnumerable<int>prepend = Enumerable.Range(0, 5).Prepend(-1); // Define query.
```
```csharp
prepend.WriteLines(); // Execute query. -1 0 1 2 3 4
```

```csharp
IEnumerable<int> append = Enumerable.Range(0, 5).Append(-1); // Define query.
```
```csharp
append.WriteLines(); // Execute query. 0 1 2 3 4 -1
```

}

### Set

Distinct accepts a source sequence, and returns a set, where duplicate values are removed:

public static IEnumerable<TSource\> Distinct<TSource\>(this IEnumerable<TSource\> source);

For example:

internal static void Distinct()

```csharp
{
```
```csharp
IEnumerable<int>first = First();
```
```csharp
IEnumerable<int>distinct = first.Distinct(); // Define query.
```
```csharp
distinct.WriteLines(); // Execute query. 1 2 3 4
```

}

The following query methods accepts 2 sequences and returns a set:

public static IEnumerable<TSource\> Union<TSource\>(

```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second);
```

```csharp
public static IEnumerable<TSource> Intersect<TSource>(
```
```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second);
```

```csharp
public static IEnumerable<TSource> Except<TSource>(
```

this IEnumerable<TSource\> first, IEnumerable<TSource\> second);

In contrast to Concat, Union adds 2 sequences as if they are sets, and returns their set union, which is equivalent to concatenating 2 sequences with duplicate values removed:

internal static void Union()

```csharp
{
```
```csharp
IEnumerable<int>first = First();
```
```csharp
IEnumerable<int>second = Second();
```
```csharp
IEnumerable<int>union = first.Union(second); // Define query.
```
```csharp
union.WriteLines(); // Execute query. 1 2 3 4 5 6
```

}

Intersect returns 2 sequences’ set intersection, the distinct values that 2 sequences have in common:

internal static void Intersect()

```csharp
{
```
```csharp
IEnumerable<int>first = First();
```
```csharp
IEnumerable<int>second = Second();
```
```csharp
IEnumerable<int>intersect = first.Intersect(second); // Define query.
```
```csharp
intersect.WriteLines(); // Execute query. 3 4
```

}

Except returns the set complement of 2 sequences, by subtracting the second sequence from the first one:

internal static void Except()

```csharp
{
```
```csharp
IEnumerable<int>first = First();
```
```csharp
IEnumerable<int>second = Second();
```
```csharp
IEnumerable<int>except = first.Except(second); // Define query.
```
```csharp
except.WriteLines(); // Execute query. 1 2
```

}

There are other overloads that accepts a comparer:

public static IEnumerable<TSource\> Distinct<TSource\>(

```csharp
this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer);
```

```csharp
public static IEnumerable<TSource> Union<TSource>(
```
```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer);
```

```csharp
public static IEnumerable<TSource> Intersect<TSource>(
```
```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer);
```

```csharp
public static IEnumerable<TSource> Except<TSource>(
```

this IEnumerable<TSource\> first, IEnumerable<TSource\> second, IEqualityComparer<TSource\> comparer);

For example:

internal static void DistinctWithComparer()

```csharp
{
```
```csharp
IEnumerable<string>source = new string[] { "aa", "AA", "Aa", "aA", "bb" };
```
```csharp
IEnumerable<string>distinctWithComparer = source.Distinct(StringComparer.OrdinalIgnoreCase); // Define query.
```
```csharp
distinctWithComparer.WriteLines(); // Execute query. aa bb
```

}

### Convolution

Zip is provided since .NET Framework 4.0. It accepts 2 sequences and returns their convolution:

public static IEnumerable<TResult\> Zip<TFirst, TSecond, TResult\>(

this IEnumerable<TFirst\> first, IEnumerable<TSecond\> second, Func<TFirst, TSecond, TResult\> resultSelector);

It calls result selector to map 2 values (each value from each sequence) to a result in the returned sequence:

internal static void Zip()

```csharp
{
```
```csharp
IEnumerable<int>first = First();
```
```csharp
IEnumerable<int>second = Second();
```
```csharp
IEnumerable<int>zip = first.Zip(second, (a, b) => a + b); // Define query.
```
```csharp
zip.WriteLines(); // Execute query. 4 6 8 10
```

}

When one input sequence has more values than the other, those values are ignored. Here the first sequence { 1, 2, 3, 4, 4 } and second sequence { 3, 4, 5, 6 } are zipped to a new sequence { 1 + 3, 2 + 4, 3 + 5, 4 + 6 }. The first sequence has one more value than the second, so its last value 4 is ignored.

### Partitioning

Partitioning query methods are straightforward. Skip/Take simply skips/takes the specified number of values in the source sequence:

public static IEnumerable<TSource\> Skip<TSource\>(this IEnumerable<TSource\> source, int count);

public static IEnumerable<TSource\> Take<TSource\>(this IEnumerable<TSource\> source, int count);

For example:

internal static void SkipTake()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(0, 5);
```

```csharp
IEnumerable<int> partition1 = source.Skip(2); // Define query.
```
```csharp
partition1.WriteLines(); // Execute query. 2 3 4
```

```csharp
IEnumerable<int> partition2 = source.Take(2); // Define query.
```
```csharp
partition2.WriteLines(); // Execute query. 0 1
```

}

SkipWhile/TakeWhile accept a predicate function:

public static IEnumerable<TSource\> SkipWhile<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool>predicate);
```

```csharp
public static IEnumerable<TSource> TakeWhile<TSource>(
```

this IEnumerable<TSource\> source, Func<TSource, bool\>predicate);

SkipWhile/TakeWhile skips/takes values while predicate is called with each value and returns true. Once predicate is called with a value and returns false, SkipWhile/TakeWhile stop partitioning:

internal static void TakeWhileSkipWhile()

```csharp
{
```
```csharp
IEnumerable<int>source = new int[] { 1, 2, 3, -1, 4, 5 };
```

```csharp
IEnumerable<int>partition1 = source.TakeWhile(int32 => int32 > 0); // Define query.
```
```csharp
partition1.WriteLines(); // Execute query. 1 2 3
```

```csharp
IEnumerable<int> partition2 = source.SkipWhile(int32 => int32 > 0); // Define query.
```
```csharp
partition2.WriteLines(); // Execute query. -1 4 5
```

}

Just like Where and Select, SkipWhile/TakeWhile also have the indexed overload:

public static IEnumerable<TSource\> SkipWhile<TSource\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
```

```csharp
public static IEnumerable<TSource> TakeWhile<TSource>(
```

this IEnumerable<TSource\> source, Func<TSource, int, bool\> predicate);

For example:

internal static void TakeWhileSkipWhileWithIndex()

```csharp
{
```
```csharp
IEnumerable<int>source = new int[] { 4, 3, 2, 1, 5 };
```

```csharp
IEnumerable<int>partition1 = source.TakeWhile((int32, index) => int32 >= index); // Define query.
```
```csharp
partition1.WriteLines(); // Execute query. 4 3 2
```

```csharp
IEnumerable<int> partition2 = source.SkipWhile((int32, index) => int32 >= index); // Define query.
```
```csharp
partition2.WriteLines(); // Execute query. 1 5
```

}

### Ordering

The ordering methods are OrderBy and OrderByDescending:

IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)
```

```csharp
IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)
```

```csharp
IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)
```

```csharp
IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```

this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)

The key selector specifies what should be compared to determine the order of values in the result sequence:

internal static void OrderBy()

```csharp
{
```
```csharp
IEnumerable<string>source = Words();
```
```csharp
IEnumerable<string>ordered = source.OrderBy(word => word); // Define query.
```
```csharp
ordered.WriteLines(); // Execute query. four one three Two Zero
```
```csharp
source.WriteLines(); // Original sequence. Zero one Two three four
```
```csharp
}
```

```csharp
internal static void OrderByDescending()
```
```csharp
{
```
```csharp
IEnumerable<string>source = Words();
```
```csharp
IEnumerable<string>ordered = source.OrderByDescending(word => word); // Define query.
```
```csharp
ordered.WriteLines(); // Execute query. Zero Two three one four
```
```csharp
source.WriteLines(); // Original sequence. Zero one Two three four
```

}

Here each value from the source sequence uses itself as the key for ordering. Also, as demonstrated above, OrderBy returns a new sequence, so OrderBy/OrderByDescending does not impact the source sequence. The equivalent query expression has an orderby clause:

internal static void OrderBy()

```csharp
{
```
```csharp
IEnumerable<string>source = Words();
```
```csharp
IEnumerable<string>ordered = from word in source
```
```csharp
orderby word ascending // ascending can be omitted.
```
```csharp
select word;
```
```csharp
}
```

```csharp
internal static void OrderByDescending()
```
```csharp
{
```
```csharp
IEnumerable<string>source = Words();
```
```csharp
IEnumerable<string>ordered = from word in source
```
```csharp
orderby word descending
```
```csharp
select word;
```

}

The comparer can be specified to provides the method to compare 2 keys:

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

}

Compare returns an integer to determine the 2 values’ relative position in the ordered sequence. If x is less than y, Compare returns negative int value; If x is equal to y, Compare returns 0; If x is greater than y, Compare returns positive int value. For example:

internal static void OrderByWithComparer()

```csharp
{
```
```csharp
IEnumerable<string>source = Words();
```
```csharp
IEnumerable<string>ordered = source.OrderBy(
```
```csharp
keySelector: word => word, comparer: StringComparer.Ordinal); // Define query.
```
```csharp
ordered.WriteLines(); // Execute query. Two Zero four one three
```

}

Here StringComparer.Ordinal provides a case-sensitive comparison. “Zero” comes to the first position of the result sequence, because upper case letter is less than lower case letter. This overload with comparer is not supported in query expression. When using the other overload without comparer, OrderBy/OrderByDescending uses System.Collections.Generic.Comparer<TKey>.Default. In the first OrderBy example, Comparer<string>.Default is used, which is equivalent to StringComparer.CurrentCulture.

As fore mentioned, ThenBy/ThenByDescending are extension methods of IOrderedEnumerable<T>, not IEnumerable<T>:

IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(

```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector)
```

```csharp
IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)
```

```csharp
IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector)
```

```csharp
IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```

this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)

So they can be composed right after OrderBy/OrderByDescending:

internal static void ThenBy()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<Person>ordered = source // IEnumerable<Person>
```
```csharp
.OrderBy(person => person.PlaceOfBirth) // IOrderedEnumerable<Person>
```
```csharp
.ThenBy(person => person.Name); // IOrderedEnumerable<Person>
```
```csharp
ordered.WriteLines(person => $"{person.PlaceOfBirth}: {person.Name}"); // Execute query.
```
```csharp
// AU: Chris Hemsworth
```
```csharp
// UK: Paul Bettany
```
```csharp
// UK: Tom Hiddleston
```
```csharp
// US: Chris Evans
```
```csharp
// US: Robert Downey Jr.
```

}

In the above example, persons are ordered by place of birth. If there are Person objects with the same PlaceOfBirth, they are ordered by Name. The query expression can have multiple key selectors in the orderby clause:

internal static void ThenBy()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<Person>ordered = from person in source
```
```csharp
orderby person.PlaceOfBirth, person.Name
```
```csharp
select person;
```

}

Notice OrderBy can also be called after calling OrderBy:

internal static void OrderByAndOrderBy()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<Person>ordered = source
```
```csharp
.OrderBy(person => person.PlaceOfBirth)
```
```csharp
.OrderBy(person => person.Name); // Define query.
```
```csharp
ordered.WriteLines(person => $"{person.PlaceOfBirth}: {person.Name}"); // Execute query.
```
```csharp
// US: Chris Evans
```
```csharp
// AU: Chris Hemsworth
```
```csharp
// UK: Paul Bettany
```
```csharp
// US: Robert Downey Jr.
```
```csharp
// UK: Tom Hiddleston
```

}

OrderBy with OrderBy is totally different from OrderBy with ThenBy. Here persons are ordered by place of birth. Then, all persons are ordered again by name. The equivalent query expression is:

internal static void OrderByOrderBy1()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<Person>ordered = from person in source
```
```csharp
orderby person.PlaceOfBirth
```

```csharp
orderby person.Name
```
```csharp
select person;
```

}

To makes it more intuitive, it can be separated to 2 query expressions:

internal static void OrderByOrderBy2()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<Person>ordered1 = from person in source
```
```csharp
orderby person.PlaceOfBirth
```
```csharp
select person;
```
```csharp
IEnumerable<Person>ordered2 = from person in ordered1
```
```csharp
orderby person.Name
```
```csharp
select person;
```

}

Apparently, both orderby clauses work on the entire input sequence. As fore mentioned, the into query keyword is for this kind scenario of continuation:

internal static void OrderByOrderBy3()

```csharp
{
```
```csharp
IEnumerable<Person>source = Persons();
```
```csharp
IEnumerable<Person>ordered = from person in source
```
```csharp
orderby person.PlaceOfBirth
```
```csharp
select person into person
```
```csharp
orderby person.Name
```
```csharp
select person;
```

}

The compilation of the above 3 queries are identical.

Reverse simply reverses the positions of values:

public static IEnumerable<TSource\> Reverse<TSource\>(this IEnumerable<TSource\> source)

For example:

internal static void Reverse()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(0, 5);
```
```csharp
IEnumerable<int>reversed = source.Reverse(); // Define query.
```
```csharp
reversed.WriteLines(); // Execute query. 4 3 2 1 0
```

}

### Conversion

Cast converts each value in source sequence to the specified type:

public static IEnumerable<TResult\> Cast<TResult\>(this IEnumerable source);

Unlike other query methods, Cast is an extension method of non-generic sequence, so it can work with types implementing either IEnumerable or IEnumerable<T>. So it can enable LINQ query for legacy types. The following example calls Microsoft Team Foundation Service (TFS) client APIs to query work items, where Microsoft.TeamFoundation.WorkItemTracking.Client.WorkItemCollection is returned. WorkItemCollection is a collection of Microsoft.TeamFoundation.WorkItemTracking.Client.WorkItem, but it only implements IEnumerable, so it can be cast to a generic IEnumerable<WorkItem> safely, and further LINQ query can be applied. The following example execute a WIQL (Work Item Query Language of TFS) statement to query work items from TFS. Since WIQL does not support GROUP BY clause, the work items can be grouped locally with LINQ:

#if NETFX

```csharp
internal static void CastNonGeneric(VssCredentials credentials)
```
```csharp
{
```
```csharp
using (TfsTeamProjectCollection projectCollection = new TfsTeamProjectCollection(
```
```csharp
new Uri("https://dixin.visualstudio.com/DefaultCollection"), credentials))
```
```csharp
{
```
```csharp
// WorkItemCollection implements IEnumerable.
```
```sql
const string Wiql = "SELECT * FROM WorkItems WHERE [Work Item Type] = 'Bug' AND State != 'Closed'"; // WIQL does not support GROUP BY.
```
```csharp
WorkItemStore workItemStore = (WorkItemStore)projectCollection.GetService(typeof(WorkItemStore));
```
```csharp
WorkItemCollection workItems = workItemStore.Query(Wiql);
```

```csharp
IEnumerable<WorkItem>genericWorkItems = workItems.Cast<WorkItem>(); // Define query.
```
```csharp
IEnumerable<IGrouping<string, WorkItem>> workItemGroups = genericWorkItems
```
```csharp
.GroupBy(workItem => workItem.CreatedBy); // Group work items locally.
```
```csharp
// ...
```
```csharp
}
```
```csharp
}
```

#endif

The other non-generic sequences, like System.Resources.ResourceSet, System.Resources.ResourceReader, can be cast in the same way:

internal static void CastMoreNonGeneric()

```csharp
{
```
```csharp
// ResourceSet implements IEnumerable.
```
```csharp
ResourceSet resourceSet = new ResourceManager(typeof(Resources))
```
```csharp
.GetResourceSet(CultureInfo.CurrentCulture, createIfNotExists: true, tryParents: true);
```
```csharp
IEnumerable<DictionaryEntry>entries1 = resourceSet.Cast<DictionaryEntry>();
```

```csharp
// ResourceReader implements IEnumerable.
```
```csharp
Assembly assembly = typeof(QueryMethods).Assembly;
```
```csharp
using (Stream stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames()[0]))
```
```csharp
using (ResourceReader resourceReader = new ResourceReader(stream))
```
```csharp
{
```
```csharp
IEnumerable<DictionaryEntry>entries2 = resourceReader.Cast<DictionaryEntry>();
```
```csharp
}
```

}

In query expression syntax, just specify the type in from clause before the value name:

#if NETFX

```csharp
internal static void CastNonGeneric(VssCredentials credentials)
```
```csharp
{
```
```csharp
// WorkItemCollection implements IEnumerable.
```
```csharp
using (TfsTeamProjectCollection projectCollection = new TfsTeamProjectCollection(
```
```csharp
new Uri("https://dixin.visualstudio.com/DefaultCollection"), credentials))
```
```csharp
{
```
```sql
const string Wiql = "SELECT * FROM WorkItems WHERE [Work Item Type] = 'Bug' AND State != 'Closed'"; // WIQL does not support GROUP BY.
```
```csharp
WorkItemStore workItemStore = (WorkItemStore)projectCollection.GetService(typeof(WorkItemStore));
```
```csharp
WorkItemCollection workItems = workItemStore.Query(Wiql);
```

```csharp
IEnumerable<IGrouping<string, WorkItem>>workItemGroups =
```
```csharp
from WorkItem workItem in workItems // Cast.
```
```csharp
group workItem by workItem.CreatedBy; // Group work items in local memory.
```
```csharp
// ...
```
```csharp
}
```
```csharp
}
```
```csharp
#endif
```

```csharp
internal static void CastMoreNonGenericI()
```
```csharp
{
```
```csharp
// ResourceSet implements IEnumerable.
```
```csharp
ResourceSet resourceSet = new ResourceManager(typeof(Resources))
```
```csharp
.GetResourceSet(CultureInfo.CurrentCulture, createIfNotExists: true, tryParents: true);
```
```csharp
IEnumerable<DictionaryEntry>entries1 =
```
```csharp
from DictionaryEntry entry in resourceSet // Cast.
```
```csharp
select entry;
```

```csharp
// ResourceReader implements IEnumerable.
```
```csharp
Assembly assembly = typeof(QueryMethods).Assembly;
```
```csharp
using (Stream stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames()[0]))
```
```csharp
using (ResourceReader resourceReader = new ResourceReader(stream))
```
```csharp
{
```
```csharp
IEnumerable<DictionaryEntry>entries2 =
```
```csharp
from DictionaryEntry entry in resourceReader // Cast.
```
```csharp
select entry;
```
```csharp
}
```

}

And of course Cast can be used to generic IEnumerable<T>:

internal static void CastGenericIEnumerable()

```csharp
{
```
```csharp
IEnumerable<Base>source = new Base[] { new Derived(), new Derived() };
```
```csharp
IEnumerable<Derived>cast = source.Cast<Derived>(); // Define query.
```
```csharp
cast.WriteLines(result => result.GetType().Name); // Execute query. Derived Derived
```

}

And the query expression syntax is the same:

internal static void CastGenericIEnumerable()

```csharp
{
```
```csharp
IEnumerable<Base>source = new Base[] { new Derived(), new Derived() };
```
```csharp
IEnumerable<Derived>cast = from Derived derived in source
```
```csharp
select derived;
```

}

Cast must be used with caution, because type conversion can fail at runtime, for example:

internal static void CastGenericIEnumerableWithException()

```csharp
{
```
```csharp
IEnumerable<Base>source = new Base[] { new Derived(), new Base() };
```
```csharp
IEnumerable<Derived>cast = source.Cast<Derived>(); // Define query.
```
```csharp
cast.WriteLines(result => result.GetType().Name); // Execute query. Derived InvalidCastException
```

}

An InvalidCastException is thrown because the second value is of Base type, and cannot be cast to Derived.

The same query expression cast syntax can also be used in join clause:

internal static void CastWithJoin()

```csharp
{
```
```csharp
IEnumerable outer = new int[] { 1, 2, 3 };
```
```csharp
IEnumerable inner = new string[] { "a", "bb", "ccc" };
```
```csharp
IEnumerable<string>innerJoin = from int int32 in outer
```
```csharp
join string @string in inner on int32 equals @string.Length
```
```csharp
select $"{int32}: {@string}";
```

}

It is compiled to:

internal static void CastWithJoin()

```csharp
{
```
```csharp
IEnumerable outer = new int[] { 1, 2, 3 };
```
```csharp
IEnumerable inner = new string[] { string.Empty, "a", "bb", "ccc", "dddd" };
```
```csharp
IEnumerable<string>innerJoin = outer.Cast<int>().Join(
```
```csharp
inner: inner.Cast<string>(),
```
```csharp
outerKeySelector: int32 => int32,
```
```csharp
innerKeySelector: @string => @string.Length, // on int32 equal @string.Length
```
```csharp
resultSelector: (int32, @string) => $"{int32}:{@string}"); // Define query.
```
```csharp
innerJoin.WriteLines(); // Execute query. 1:a 2:bb 3:ccc
```

}

Cast looks similar to the fore mentioned OfType method, which also can have the result type specified. However, they are very different, OfType filters the values of the specified type. If there are values not of the specified type, they are simply ignored. There no conversion so there is no chance of InvalidCastException.

AsEnumerable is a query method doing nothing. It accepts a source sequence, then return the source sequence itself:

public static IEnumerable<TSource\> AsEnumerable<TSource\>(this IEnumerable<TSource\> source);

Its purpose is to make more derived type be visible only as IEnumerable<T>, and hide additional members of that more derived type:

internal static void AsEnumerable()

```csharp
{
```
```csharp
List<int>list = new List<int>();
```
```csharp
list.Add(0);
```
```csharp
IEnumerable<int>sequence = list.AsEnumerable(); // Add method is no longer available.
```

}

If the more derived source has method with the same signature as IEnumerable<T>’s extension method, after calling AsEnumerable, that IEnumerable<T> extension method is called:

internal static void AsEnumerableReverse()

```csharp
{
```
```csharp
List<int>list = new List<int>();
```
```csharp
list.Reverse(); // List<T>.Reverse.
```
```csharp
list
```
```csharp
.AsEnumerable() // IEnumerable<T>.
```
```csharp
.Reverse(); // Enumerable.Reverse.
```

```csharp
SortedSet<int> sortedSet = new SortedSet<int>();
```
```csharp
sortedSet.Reverse(); // SortedSet<T>.Reverse.
```
```csharp
sortedSet.AsEnumerable().Reverse(); // Enumerable.Reverse.
```

```csharp
ReadOnlyCollectionBuilder<int> readOnlyCollection = new ReadOnlyCollectionBuilder<int>();
```
```csharp
readOnlyCollection.Reverse(); // ReadOnlyCollectionBuilder<T>.Reverse.
```
```csharp
readOnlyCollection.AsEnumerable().Reverse(); // Enumerable.Reverse.
```

```csharp
IQueryable<int> queryable = new EnumerableQuery<int>(Enumerable.Empty<int>());
```
```csharp
queryable.Reverse(); // Queryable.Reverse.
```
```csharp
queryable.AsEnumerable().Reverse(); // Enumerable.Reverse.
```

```csharp
ImmutableList<int> immutableList = ImmutableList.Create(0);
```
```csharp
immutableList.Reverse(); // ImmutableSortedSet<T>.Reverse.
```
```csharp
immutableList.AsEnumerable().Reverse(); // Enumerable.Reverse.
```

```csharp
ImmutableSortedSet<int> immutableSortedSet = ImmutableSortedSet.Create(0);
```
```csharp
immutableSortedSet.Reverse(); // ImmutableSortedSet<T>.Reverse.
```
```csharp
immutableSortedSet.AsEnumerable().Reverse(); // Enumerable.Reverse.
```

}

As fore mentioned, local parallel LINQ queries are represented by ParallelQuery<T> and remote LINQ queries are represented by IQueryable<T>. They both implement IEnumerable<T>, so they both have AsEnumerable available. Since AsEnumerable returns IEnumerable<T>, it opt-out local parallel query and remote query back to local sequential query. These scenarios are discussed in Parallel LINQ chapter and LINQ to Entities chapter.

### Collection queries

The collection query methods all convert source sequence to a collection by pulling all the values from the source sequence and store them in array, list, dictionary, or lookup.

### Conversion

ToArray and ToList are straightforward:

public static TSource\[\] ToArray<TSource\>(this IEnumerable<TSource\> source);

public static List<TSource\> ToList<TSource\>(this IEnumerable<TSource\> source);

They pull all values from the source sequence, and simply store them into a new array/list:

internal static void ToArrayToList()

```csharp
{
```
```csharp
int[] array = Enumerable
```
```csharp
.Range(0, 5) // Define query, return IEnumerable<T>.
```
```csharp
.ToArray(); // Execute query.
```

```csharp
List<int> list = Enumerable
```
```csharp
.Range(0, 5) // Define query, return IEnumerable<T>.
```
```csharp
.ToList(); // Execute query.
```

}

Apparently, when collection query methods are called for an IEnumerable<T> sequence representing LINQ query, that LINQ query is executed immediately. Similarly, ToDictionary/ToLookup also pulls all values from source sequence, and store those values into a new dictionary/lookup:

public static Dictionary<TKey, TSource\> ToDictionary<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static ILookup<TKey, TSource> ToLookup<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static Dictionary<TKey, TElement> ToDictionary<TSource, TKey, TElement>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, Func<TSource, TElement> elementSelector);
```

```csharp
public static ILookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
```

this IEnumerable<TSource\> source, Func<TSource, TKey\>keySelector, Func<TSource, TElement\> elementSelector);

Here are the definition of dictionary and lookup:

namespace System.Collections.Generic

```csharp
{
```
```csharp
public class Dictionary<TKey, TValue>: IEnumerable<KeyValuePair<TKey, TValue>>, IEnumerable,
```
```csharp
IDictionary<TKey, TValue>, IDictionary, ICollection<KeyValuePair<TKey, TValue>>, ICollection,
```
```csharp
IReadOnlyDictionary<TKey, TValue>, IReadOnlyCollection<KeyValuePair<TKey, TValue>>,
```
```csharp
ISerializable, IDeserializationCallback { }
```
```csharp
}
```

```csharp
namespace System.Linq
```
```csharp
{
```
```csharp
public interface ILookup<TKey, TElement>: IEnumerable<IGrouping<TKey, TElement>>, IEnumerable
```
```csharp
{
```
```csharp
IEnumerable<TElement> this[TKey key] { get; }
```

```csharp
int Count { get; }
```

```csharp
bool Contains(TKey key);
```
```csharp
}
```

}

The difference between dictionary and lookup is, a dictionary is a flatten collection of key-value pairs, where each key is paired with one single value, and a lookup is a hierarchical collection of key-sequence pairs, where each key is a sequence of paired with one or more values.

internal static void ToDictionaryToLookup()

```csharp
{
```
```csharp
Dictionary<int, string> dictionary = Enumerable
```
```csharp
.Range(0, 5) // Define query.
```
```csharp
.ToDictionary(
```
```csharp
keySelector: int32 => int32,
```
```csharp
elementSelector: int32 => Math.Sqrt(int32).ToString("F", CultureInfo.InvariantCulture)); // Execute query.
```
```csharp
foreach (KeyValuePair<int, string> squareRoot in dictionary)
```
```csharp
{
```
```csharp
$"√{squareRoot.Key}:{squareRoot.Value}".WriteLine();
```
```csharp
}
```
```csharp
// √0: 0.00
```
```csharp
// √1: 1.00
```
```csharp
// √2: 1.41
```
```csharp
// √3: 1.73
```
```csharp
// √4: 2.00
```

```csharp
ILookup<int, int> lookup = Enumerable
```
```csharp
.Range(-2, 5) // Define query.
```
```csharp
.ToLookup(int32 => int32 * int32); // Execute query.
```
```csharp
foreach (IGrouping<int, int> squareRoots in lookup)
```
```csharp
{
```
```csharp
$"√{squareRoots.Key}: ".Write();
```
```csharp
foreach (int squareRoot in squareRoots)
```
```csharp
{
```
```csharp
$"{squareRoot}, ".Write();
```
```csharp
}
```
```csharp
Environment.NewLine.Write();
```
```csharp
}
```
```csharp
// √4: -2, 2,
```
```csharp
// √1: -1, 1,
```
```csharp
// √0: 0,
```

}

Each value from source sequence is mapped to a key by calling the key selector function. If element selector is provided, each value from source sequence is mapped to a value in the result dictionary/lookup. In above example, if ToDictionary is called in the second query, an ArgumentException is thrown because dictionary cannot have multiple key and single value pairs with the same key:

internal static void ToDictionaryWithException()

```csharp
{
```
```csharp
Dictionary<int, int> lookup = Enumerable
```
```csharp
.Range(-2, 5) // Define query.
```
```csharp
.ToDictionary(int32 => int32 * int32); // Execute query.
```
```csharp
// ArgumentException: An item with the same key has already been added.
```

}

Another difference between dictionary and lookup is, at runtime, if querying a dictionary with a non-existing key, dictionary throws KeyNotFoundException, but if querying a lookup with a non-existing key, lookup returns an empty sequence peacefully.

internal static void LookupDictionary()

```csharp
{
```
```csharp
ILookup<int, int> lookup = Enumerable
```
```csharp
.Range(0, 5) // Define query.
```
```csharp
.ToLookup(int32 => int32); // Execute query.
```
```csharp
int count = 0;
```
```csharp
IEnumerable<int>group = lookup[10];
```
```csharp
foreach (int value in group)
```
```csharp
{
```
```csharp
count++;
```
```csharp
}
```
```csharp
count.WriteLine(); // 0
```

```csharp
Dictionary<int, int> dictionary = Enumerable
```
```csharp
.Range(0, 5) // Define query.
```
```csharp
.ToDictionary(int32 => int32); // Execute query.
```
```csharp
int result = dictionary[10];
```
```csharp
// KeyNotFoundException: The given key was not present in the dictionary.
```

}

The last difference is dictionary cannot have null key, while lookup can:

internal static void LookupDictionaryNullKey()

```csharp
{
```
```csharp
ILookup<string, string> lookup = new string[] { "a", "b", null }.ToLookup(@string => @string);
```
```csharp
int count = 0;
```
```csharp
IEnumerable<string>group = lookup[null];
```
```csharp
foreach (string value in group)
```
```csharp
{
```
```csharp
count++;
```
```csharp
}
```
```csharp
count.WriteLine(); // 1
```

```csharp
Dictionary<string, string>dictionary = new string[] { "a", "b", null }
```
```csharp
.ToDictionary(@string => @string);
```
```csharp
// ArgumentNullException: Value cannot be null. Parameter name: key.
```

}

ToDictionary/ToLookup has other overloads to accept a key comparer:

public static Dictionary<TKey, TSource\> ToDictionary<TSource, TKey\>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IEqualityComparer<TKey> comparer);
```

```csharp
public static ILookup<TKey, TSource> ToLookup<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey>keySelector, IEqualityComparer<TKey> comparer);
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
IEqualityComparer<TKey>comparer);
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

IEqualityComparer<TKey\>comparer);

For example:

internal static void ToLookupWithComparer()

```csharp
{
```
```csharp
ILookup<string, string> lookup = new string[] { "aa", "AA", "Aa", "aA", "bb" }
```
```csharp
.ToLookup(@string => @string, StringComparer.OrdinalIgnoreCase);
```
```csharp
foreach (IGrouping<string, string> group in lookup)
```
```csharp
{
```
```csharp
$"{group.Key}: ".Write();
```
```csharp
foreach (string @string in group)
```
```csharp
{
```
```csharp
$"{@string}, ".Write();
```
```csharp
}
```
```csharp
Environment.NewLine.Write();
```
```csharp
// aa: aa, AA, Aa, aA,
```
```csharp
// bb: bb,
```
```csharp
}
```

}

### Value queries

These query methods pull single, partial, or all values of the source sequence to output a specified value or calculate a result with the pulled values.

### Element

Element query methods returns a single value from the source sequence. When they are called, they immediately execute the query, trying to pull values until the expected value is pulled. First/Last immediately pulls the first/last value of the source sequence.

public static TSource First<TSource\>(this IEnumerable<TSource\> source);

public static TSource Last<TSource\>(this IEnumerable<TSource\> source);

And InvalidOperationException is thrown if the source sequence is empty.

internal static IEnumerable<int\> Int32Source() => new int\[\] { -1, 1, 2, 3, -4 };

```csharp
internal static IEnumerable<int>SingleInt32Source() => Enumerable.Repeat(5, 1);
```

```csharp
internal static IEnumerable<int>EmptyInt32Source() => Enumerable.Empty<int>();
```

```csharp
internal static void FirstLast()
```
```csharp
{
```
```csharp
int firstOfSource = Int32Source().First().WriteLine(); // -1
```
```csharp
int lastOfSource = Int32Source().Last().WriteLine(); // -4
```

```csharp
int firstOfSingleSource = SingleInt32Source().First().WriteLine(); // 5
```
```csharp
int lastOfSingleSource = SingleInt32Source().Last().WriteLine(); // 5
```

```csharp
int firstOfEmptySource = EmptyInt32Source().First(); // InvalidOperationException.
```
```csharp
int lastOfEmptySource = EmptyInt32Source().Last(); // InvalidOperationException.
```

}

The other First/Last overload accept a predicate function. They immediately call the predicate function immediately with the values, and return the first/last value where predicate function returns true:

public static TSource First<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate);

public static TSource Last<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\>predicate);

Logically, source.First(predicate) is equivalent to source.Where(predicate).First(), and source.Last(predicate) is equivalent to source.Where(predicate).Last():

internal static void FirstLastWithPredicate()

```csharp
{
```
```csharp
int firstPositiveOfSource = Int32Source().First(int32 => int32 > 0).WriteLine(); // 1
```
```csharp
int lastNegativeOfSource = Int32Source().Last(int32 => int32 < 0).WriteLine(); // -4
```

```csharp
int firstPositiveOfSingleSource = SingleInt32Source().First(int32 => int32 > 0).WriteLine(); // 1
```
```csharp
int lastNegativeOfSingleSource = SingleInt32Source().Last(int32 => int32 < 0); // InvalidOperationException.
```

```csharp
int firstPositiveOfEmptySource = EmptyInt32Source().First(int32 => int32 > 0); // InvalidOperationException.
```
```csharp
int lastNegativeOfEmptySource = EmptyInt32Source().Last(int32 => int32 < 0); // InvalidOperationException.
```

}

There are also FirstOrDefault/LastOrDefault methods:

public static TSource FirstOrDefault<TSource\>(this IEnumerable<TSource\> source);

```csharp
public static TSource FirstOrDefault<TSource>(this IEnumerable<TSource> source, Func<TSource, bool>predicate);
```

```csharp
public static TSource LastOrDefault<TSource>(this IEnumerable<TSource> source);
```

public static TSource LastOrDefault<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\>predicate);

When there is no first/last value available, these methods return a default value instead of throwing exception:

internal static void FirstOrDefaultLastOrDefault()

```csharp
{
```
```csharp
int firstOrDefaultOfEmptySource = EmptyInt32Source().FirstOrDefault().WriteLine(); // 0
```
```csharp
int lastOrDefaultOfEmptySource = EmptyInt32Source().LastOrDefault().WriteLine(); // 0
```

```csharp
int lastNegativeOrDefaultOfSingleSource = SingleInt32Source().LastOrDefault(int32 => int32 < 0).WriteLine(); // 0
```

```csharp
int firstPositiveOrDefaultOfEmptySource = EmptyInt32Source().FirstOrDefault(int32 => int32 > 0).WriteLine(); // 0
```
```csharp
int lastNegativeOrDefaultOfEmptySource = EmptyInt32Source().LastOrDefault(int32 => int32 < 0).WriteLine(); // 0
```

```csharp
Character lokiOrDefault = Characters()
```
```csharp
.FirstOrDefault(character => "Loki".Equals(character.Name, StringComparison.Ordinal));
```
```csharp
(lokiOrDefault == null).WriteLine(); // True
```

}

ElementAt returns the value at the specified index:

public static TSource ElementAt<TSource\>(this IEnumerable<TSource\> source, int index);

When the specified index is out of range, ArgumentOutOfRangeException is thrown.

internal static void ElementAt()

```csharp
{
```
```csharp
int elementAt2OfSource = Int32Source().ElementAt(2).WriteLine(); // 2
```
```csharp
int elementAt9OfSource = Int32Source().ElementAt(9); // ArgumentOutOfRangeException.
```
```csharp
int elementAtNegativeIndex = Int32Source().ElementAt(-5); // ArgumentOutOfRangeException.
```

```csharp
int elementAt0OfSingleSource = SingleInt32Source().ElementAt(0).WriteLine(); // 5
```
```csharp
int elementAt1OfSingleSource = SingleInt32Source().ElementAt(1); // ArgumentOutOfRangeException.
```

```csharp
int elementAt0OfEmptySource = EmptyInt32Source().ElementAt(0); // ArgumentOutOfRangeException.
```

}

Similarly, there is ElementAtOrDefault:

public static TSource ElementAtOrDefault<TSource\>(this IEnumerable<TSource\> source, int index);

When there is no value available at the specified index, a default value is returned:

internal static void ElementAtOrDefault()

```csharp
{
```
```csharp
int elementAt9OrDefaultOfSource = Int32Source().ElementAtOrDefault(9).WriteLine(); // 0
```
```csharp
int elementAtNegativeIndexOrDefault = Int32Source().ElementAtOrDefault(-5).WriteLine(); // 0
```

```csharp
int elementAt1OrDefaultOfSingleSource = SingleInt32Source().ElementAtOrDefault(1).WriteLine(); // 0
```

```csharp
int elementAt0OrDefaultOfEmptySource = EmptyInt32Source().ElementAtOrDefault(0).WriteLine(); // 0
```

```csharp
Character characterAt5OrDefault = Characters().ElementAtOrDefault(5);
```
```csharp
(characterAt5OrDefault == null).WriteLine(); // True
```

}

Single is more strict. It pulls the single value from a singleton sequence.

public static TSource Single<TSource\>(this IEnumerable<TSource\> source);

public static TSource Single<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\>predicate);

If source sequence has no value or has more than one values, InvalidOperationException is thrown:

internal static void Single()

```csharp
{
```
```csharp
int singleOfSource = Int32Source().Single(); // InvalidOperationException.
```
```csharp
int singleGreaterThan2OfSource = Int32Source().Single(int32 => int32 > 2).WriteLine(); // 3
```
```csharp
int singleNegativeOfSource = Int32Source().Single(int32 => int32 < 0); // InvalidOperationException.
```

```csharp
int singleOfSingleSource = SingleInt32Source().Single().WriteLine(); // 5
```
```csharp
int singleNegativeOfSingleSource = SingleInt32Source().Single(int32 => int32 < 0); // InvalidOperationException.
```

```csharp
int singleOfEmptySource = EmptyInt32Source().Single(); // InvalidOperationException.
```
```csharp
int singlePositiveOfEmptySource = EmptyInt32Source().Single(int32 => int32 == 0); // InvalidOperationException.
```

```csharp
Character singleCharacter = Characters().Single(); // InvalidOperationException.
```
```csharp
Character fromAsgard = Characters()
```
```csharp
.Single(character => "Asgard".Equals(character.PlaceOfBirth, StringComparison.Ordinal))
```
```csharp
.WriteLine(); // Thor
```

```csharp
Character loki = Characters().Single(
```
```csharp
character => "Loki".Equals(character.Name, StringComparison.Ordinal)); // InvalidOperationException.
```

}

SingleOrDefault is just slightly less strict than Single:

public static TSource SingleOrDefault<TSource\>(this IEnumerable<TSource\> source);

public static TSource SingleOrDefault<TSource\>(this IEnumerable<TSource\>source, Func<TSource, bool\> predicate);

When source sequence has no value, it returns a default value. When source sequence has more than one values, it still throws InvalidOperationException:

internal static void SingleOrDefault()

```csharp
{
```
```csharp
int singleOrDefaultOfSource = Int32Source().SingleOrDefault(); // InvalidOperationException.
```
```csharp
int singleNegativeOrDefaultOfSource = Int32Source().SingleOrDefault(int32 => int32 < 0); // InvalidOperationException.
```

```csharp
int singleNegativeOrDefaultOfSingleSource = SingleInt32Source().SingleOrDefault(int32 => int32 < 0).WriteLine(); // 0
```

```csharp
int singleOrDefaultOfEmptySource = EmptyInt32Source().SingleOrDefault().WriteLine(); // 0
```
```csharp
int singlePositiveOrDefaultOfEmptySource = EmptyInt32Source().SingleOrDefault(int32 => int32 == 0); // 0
```

```csharp
Character singleCharacterOrDefault = Characters().SingleOrDefault(); // InvalidOperationException.
```
```csharp
Character lokiOrDefault = Characters()
```
```csharp
.SingleOrDefault(character => "Loki".Equals(character.Name, StringComparison.Ordinal));
```
```csharp
(lokiOrDefault == null).WriteLine(); // True
```

}

### Aggregation

Aggregate query methods pull all values from source sequence, and repeatedly call a function to accumulate those value. The easiest overload accepts an accumulator function:

public static TSource Aggregate<TSource\>(this IEnumerable<TSource\> source, Func<TSource, TSource, TSource\> func);

Aggregate requires the source sequence to be not empty. When the source sequence is empty, it throws InvalidOperationException. When there is only 1 single value in the source sequence, it returns that value. When there are more than 1 values, it calls the accumulator function to accumulate the first and second values to a result, and then call the accumulator function again to accumulate the previous result and the third value to another result, and so on, until all values are accumulated, eventually it returns the result of the last accumulator function call.

internal static void Aggregate()

```csharp
{
```
```csharp
int productOfSource = Int32Source()
```
```csharp
.Aggregate((currentProduct, int32) => currentProduct * int32)
```
```csharp
.WriteLine(); // ((((-1 * 1) * 2) * 3) * -4) = 24.
```
```csharp
int productOfSingleSource = SingleInt32Source()
```
```csharp
.Aggregate((currentProduct, int32) => currentProduct * int32).WriteLine(); // 5
```
```csharp
int productOfEmptySource = EmptyInt32Source()
```
```csharp
.Aggregate((currentProduct, int32) => currentProduct * int32); // InvalidOperationException.
```

}

There is another overload accepts a seed:

public static TAccumulate Aggregate<TSource, TAccumulate\>(this IEnumerable<TSource\> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate\> func);

With the seed provided, Aggregate does not require the source sequence to be not empty. When the source sequence is empty, it returns the seed. When the source sequence is not empty, it calls the accumulator function to accumulate the seed value and the first values to a result, and then call the accumulator function again to accumulate the previous result and the second to another result, and so on, until all values are accumulated, eventually it also returns the result of the last accumulator function call.

internal static void AggregateWithSeed()

```csharp
{
```
```csharp
int sumOfSquaresOfSource = Int32Source()
```
```csharp
.Aggregate(
```
```csharp
seed: 0,
```
```csharp
func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32)
```
```csharp
.WriteLine(); // 31
```
```csharp
int sumOfSquaresOfSingleSource = SingleInt32Source()
```
```csharp
.Aggregate(
```
```csharp
seed: 0,
```
```csharp
func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32)
```
```csharp
.WriteLine(); // 25
```
```csharp
int sumOfSquaresOfEmptySource = EmptyInt32Source()
```
```csharp
.Aggregate(
```
```csharp
seed: 0,
```
```csharp
func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32)
```
```csharp
.WriteLine(); // 0
```

}

The last overload accepts an additional result selector function, which is called with the last result of accumulate function:

internal static TResult Aggregate<TSource, TAccumulate, TResult\>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
TAccumulate seed,
```

Func<TAccumulate, TSource, TAccumulate\>func, Func<TAccumulate, TResult\> resultSelector);

So, source.Aggregate(seed, accumulation, resultSelector) is equivalent to resultSelector(source.Aggregate(seed, accumulation)):

internal static void AggregateWithSeedAndResultSelector()

```csharp
{
```
```csharp
string sumOfSquaresMessage = Int32Source()
```
```csharp
.Aggregate(
```
```csharp
seed: 0,
```
```csharp
func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32,
```
```csharp
resultSelector: result => $"Sum of squares: {result}")
```
```csharp
.WriteLine(); // Sum of squares: 31
```

}

Count returns the number of values in source sequence:

public static int Count<TSource\>(this IEnumerable<TSource\> source);

It is one of the most intuitive query methods:

internal static void Count()

```csharp
{
```
```csharp
int countOfSource = Int32Source().Count().WriteLine(); // 5
```
```csharp
int countOfSingleSource = SingleInt32Source().Count().WriteLine(); // 1
```
```csharp
int countOfEmptySource = EmptyInt32Source().Count().WriteLine(); // 0
```
```csharp
int countOfCharacters = Characters().Count().WriteLine(); // 5
```
```csharp
int countOfTypesInCoreLibrary = CoreLibrary.ExportedTypes.Count().WriteLine(); // 1523
```

}

The other overload accepts a predicate:

public static int Count<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate);

Similar to First/Last, source.Count(predicate) is equivalent to ource.Where(predicate).Count():

internal static void CountWithPredicate()

```csharp
{
```
```csharp
int positiveCountOfSource = Int32Source().Count(int32 => int32 > 0).WriteLine(); // 3
```
```csharp
int positiveCountOfSingleSource = SingleInt32Source().Count(int32 => int32 > 0).WriteLine(); // 1
```
```csharp
int positiveCountOfEmptySource = EmptyInt32Source().Count(int32 => int32 > 0).WriteLine(); // 0
```
```csharp
int countOfConcat = Enumerable
```
```csharp
.Repeat(0, int.MaxValue)
```
```csharp
.Concat(Enumerable.Repeat(0, int.MaxValue))
```
```csharp
.Count(); // OverflowException.
```
```csharp
int countOfCharactersFromUS = Characters()
```
```csharp
.Count(character => "US".Equals(character.PlaceOfBirth, StringComparison.Ordinal))
```
```csharp
.WriteLine(); // 3
```

}

LongCount is similar to Count. It can be used for large sequence, and returns a long (System.Int64) value instead of int (System.Int32):

public static long LongCount<TSource\>(this IEnumerable<TSource\> source);

public static long LongCount<TSource\>(this IEnumerable<TSource\>source, Func<TSource, bool\> predicate);

For example:

internal static void LongCount()

```csharp
{
```
```csharp
long longCountOfSource = Int32Source().LongCount().WriteLine(); // 5L
```
```csharp
long countOfConcat = Enumerable
```
```csharp
.Repeat(0, int.MaxValue)
```
```csharp
.Concat(Enumerable.Repeat(0, int.MaxValue))
```
```csharp
.LongCount()
```
```csharp
.WriteLine(); // int.MaxValue + int.MaxValue = 4294967294L
```

}

Max/Min also pulls all values from the source sequence of int values, and returns the minimum/maximum value:

public static int Max(this IEnumerable<int\> source);

public static int Min(this IEnumerable<int\> source);

Max/Min throw InvalidOperationException if the source sequence is empty:

internal static void MinMax()

```csharp
{
```
```csharp
int minOfSource = Int32Source().Min().WriteLine(); // -4
```
```csharp
int maxOfSource = Int32Source().Max().WriteLine(); // 3
```

```csharp
int minOfSingleSource = SingleInt32Source().Min().WriteLine(); // 5
```
```csharp
int maxOfSingleSource = SingleInt32Source().Max().WriteLine(); // 5
```

```csharp
int minOfEmptySource = EmptyInt32Source().Min(); // InvalidOperationException.
```
```csharp
int maxOfEmptySource = EmptyInt32Source().Max(); // InvalidOperationException.
```

}

The other overload accepts a sequence of arbitrary type, and a selector function which maps each value to an int value for comparison:

public static int Max<TSource\>(this IEnumerable<TSource\> source, Func<TSource, int\> selector);

public static int Min<TSource\>(this IEnumerable<TSource\>source, Func<TSource, int\> selector);

The following example queries the maximum type (type with the largest number of public members declared) in the .NET core library:

internal static void MaxWithSelector()

```csharp
{
```
```csharp
int mostDeclaredMembers = CoreLibrary.ExportedTypes
```
```csharp
.Max(type => type.GetDeclaredMembers().Length).WriteLine(); // 311
```

}

Here each public type is mapped the count of its public members’ count number. The maximum type in .NET core library has 311 public members. Here Max returns the maximum count of members, but does not tell which type is that count from. To query the maximum type along with the member count, Aggregate can be used to pull all types and accumulate by the maximum member count:

internal static void AggregateWithAnonymousTypeSeed()

```csharp
{
```
```csharp
(List<Type>Types, int MaxMemberCount) maxTypes = CoreLibrary.ExportedTypes.Aggregate(
```
```csharp
seed: (Types: new List<Type>(), MaxMemberCount: 0),
```
```csharp
func: (currentMax, type) =>
```
```csharp
{
```
```csharp
List<Type>currentMaxTypes = currentMax.Types;
```
```csharp
int currentMaxMemberCount = currentMax.MaxMemberCount;
```
```csharp
int memberCount = type.GetDeclaredMembers().Length;
```
```csharp
if (memberCount > currentMaxMemberCount)
```
```csharp
{
```
```csharp
currentMaxTypes.Clear();
```
```csharp
currentMaxTypes.Add(type);
```
```csharp
currentMaxMemberCount = memberCount;
```
```csharp
}
```
```csharp
else if (memberCount == currentMaxMemberCount)
```
```csharp
{
```
```csharp
// If multiple types have the same maximum member count, take all those types.
```
```csharp
currentMaxTypes.Add(type);
```
```csharp
}
```
```csharp
return (Types: currentMaxTypes, MaxMemberCount: currentMaxMemberCount);
```
```csharp
}); // Define query.
```
```csharp
maxTypes.Types.WriteLines(maxType => $"{maxType.FullName}:{maxTypes.MaxMemberCount}");
```
```csharp
// Execute query. System.Convert:311
```

}

In the core library, System.Convert is the winner, with 311 public members declared.

Besides int, Max/Min has overloads for int?, long, long?, double, double?, float, float?, decimal, decimal?. There are also overloads for arbitrary comparable type:

public static TSource Max<TSource\>(this IEnumerable<TSource\> source);

public static TSource Min<TSource\>(this IEnumerable<TSource\> source);

They use Comparer<TSource>.Default to compare values in source sequence to determine the minimum/maximum value. Comparer<TSource>.Default requires TSource to implement at least one of IComparable and IComparable<TSource>; otherwise ArgumentException is thrown at runtime. Still take Character type as example:

internal partial class Character : IComparable<Character\>

```csharp
{
```
```csharp
public int CompareTo(Character other) =>
```
```csharp
string.Compare(this.Name, other.Name, StringComparison.Ordinal);
```

}

Now Max/Min can be used with character sequence:

internal static void MaxMinGeneric()

```csharp
{
```
```csharp
Character maxCharacter = Characters().Max().WriteLine(); // Vision
```
```csharp
Character minCharacter = Characters().Min().WriteLine(); // JAVIS
```

}

Max/Min also have overload for arbitrary type, with a selector function to maps each value to a comparable result:

public static TResult Max<TSource, TResult\>(this IEnumerable<TSource\> source, Func<TSource, TResult\> selector);

public static TResult Min<TSource, TResult\>(this IEnumerable<TSource\>source, Func<TSource, TResult\> selector);

For example:

internal static void MaxMinGenericWithSelector()

```csharp
{
```
```csharp
string maxName = Characters().Max(character => character.Name).WriteLine(); // Vision
```
```csharp
string minName = Characters().Min(character => character.Name).WriteLine(); // JAVIS
```

}

Apparently, source.Max(selector) is equivalent to source.Select(selector),Max, and source.Min(selector) is equivalent to source.Select(selector).Min().

Sum/Average pulls all int values from the source sequence, and calculate the sum/average of all the values. The signatures are similar to Max/Min:

public static int Sum(this IEnumerable<int\> source);

public static double Average(this IEnumerable<int\> source);

Here Average returns double instead of int. Also, when called with empty source sequence, Sum returns 0, while Average throws InvalidOperationException:

internal static void SumAverage()

```csharp
{
```
```csharp
int sumOfSource = Int32Source().Sum().WriteLine(); // 1
```
```csharp
double averageOfSource = Int32Source().Average().WriteLine(); // 0.2
```

```csharp
int sumOfSingleSource = SingleInt32Source().Sum().WriteLine(); // 5
```
```csharp
double averageOfSingleSource = SingleInt32Source().Average().WriteLine(); // 5.0
```

```csharp
int sumOfEmptySource = EmptyInt32Source().Sum().WriteLine(); // 0
```
```csharp
double averageOfEmptySource = EmptyInt32Source().Average().WriteLine(); // InvalidOperationException.
```

}

Sum/Average has overload for arbitrary type, with a selector function to map each value to int value for calculation:

public static int Sum<TSource\>(this IEnumerable<TSource\> source, Func<TSource, int\> selector);

public static double Average<TSource\>(this IEnumerable<TSource\>source, Func<TSource, int\> selector);

The following example calculate the average count of public members declared on types in the core library, and the average count of all public members.

internal static void AverageWithSelector()

```csharp
{
```
```csharp
double averageMemberCount = CoreLibrary.ExportedTypes
```
```csharp
.Average(type => type.GetMembers().Length)
```
```csharp
.WriteLine(); // 22.0766378244747
```
```csharp
double averageDeclaredMemberCount = CoreLibrary.ExportedTypes
```
```csharp
.Average(type => type.GetDeclaredMembers().Length)
```
```csharp
.WriteLine(); // 11.7527812113721
```

}

Similarly, Sum/Average also has overloads for int?, long, long?, double, double?, float, float?, decimal, decimal?.

### Quantifier

Any determines whether the source sequence is not empty, by immediately trying to pull the first value from source sequence:

public static bool Any<TSource\>(this IEnumerable<TSource\> source);

For example.

internal static void Any()

```csharp
{
```
```csharp
bool anyInSource = Int32Source().Any().WriteLine(); // True
```
```csharp
bool anyInSingleSource = SingleInt32Source().Any().WriteLine(); // True
```
```csharp
bool anyInEmptySource = EmptyInt32Source().Any().WriteLine(); // False
```

}

The other overload accepts a predicate function.

public static bool Any<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate);

Logically, source.Any(predicate) is equivalent to source.Where(predicate).Any().

internal static void AnyWithPredicate()

```csharp
{
```
```csharp
bool anyNegative = Int32Source().Any(int32 => int32 < 0).WriteLine(); // True
```
```csharp
bool anyPositive = SingleInt32Source().Any(int32 => int32 > 0).WriteLine(); // True
```
```csharp
bool any0 = EmptyInt32Source().Any(_ => true).WriteLine(); // False
```

}

All accepts a predicate. It also tries to pull values from the source sequence, and calls predicate function with each value. It returns true if predicate returns true for all values; otherwise, it returns false:

public static bool All<TSource\>(this IEnumerable<TSource\> source, Func<TSource, bool\> predicate);

All always returns true for empty source.

internal static void All()

```csharp
{
```
```csharp
bool allNegative = Int32Source().All(int32 => int32 < 0).WriteLine(); // False
```
```csharp
bool allPositive = SingleInt32Source().All(int32 => int32 > 0).WriteLine(); // True
```
```csharp
bool allGreaterThanMax = EmptyInt32Source().All(int32 => int32 > int.MaxValue).WriteLine(); // True
```

}

Contains determines whether source sequence contains the specified value:

public static bool Contains<TSource\>(this IEnumerable<TSource\> source, TSource value);

For example:

internal static void Contains()

```csharp
{
```
```csharp
bool contains5InSource = Int32Source().Contains(5).WriteLine(); // False
```
```csharp
bool contains5InSingleSource = SingleInt32Source().Contains(5).WriteLine(); // True
```
```csharp
bool contains5InEmptySource = EmptyInt32Source().Contains(5).WriteLine(); // False
```

}

The other overload of Contains accepts a comparer:

public static bool Contains<TSource\>(

this IEnumerable<TSource\> source, TSource value, IEqualityComparer<TSource\> comparer);

For example:

internal static void ContainsWithComparer()

```csharp
{
```
```csharp
bool containsTwo = Words().Contains("two", StringComparer.Ordinal).WriteLine(); // False
```
```csharp
bool containsTwoIgnoreCase = Words().Contains("two", StringComparer.OrdinalIgnoreCase).WriteLine(); // True
```

}

Similar to other query methods, the first overload without comparer uses EqualityComparer<TSource>.Default.

### Equality

.NET has many ways to determine equality for objects:

· [Reference equality](https://msdn.microsoft.com/en-us/library/dd183759.aspx)/identity: object.ReferenceEquals, == operator without override

· [Value equality](https://msdn.microsoft.com/en-us/library/dd183755.aspx)/equivalence: static object.Equals, instance object.Equals, object.GetHashCode, overridden == operator, IEquatable<T>.Equals, IEqualityComparer.Equals, IEqualityComparer<T>.Equals, IComparable.Compare, IComparable<T>.Compare, IComparer.Compare, IComparer<T>.Compare

· Sequential equality: Enumerable.SequentialEqual

SequentialEqual query method is provided to compares the sequential equality of 2 IEnumerable<T> sequences:

public static bool SequenceEqual<TSource\>(this IEnumerable<TSource\> first, IEnumerable<TSource\> second);

2 sequences are sequentially equal if their length is equal, and for each index, 2 values from both sequences are equal (determined by EqualityComparer<TSource>.Default).

internal static void SequentialEqual()

```csharp
{
```
```csharp
IEnumerable<object>first = new object[] { null, 1, "2", CoreLibrary };
```
```csharp
IEnumerable<object>second = new List<object>() { null, 1, $"{1 + 1}", CoreLibrary };
```
```csharp
bool valueEqual = first.Equals(second).WriteLine(); // False
```
```csharp
bool referenceEqual = object.ReferenceEquals(first, second).WriteLine(); // False
```
```csharp
bool sequentialEqual = first.SequenceEqual(second.Concat(Enumerable.Empty<object>())).WriteLine(); // True
```

}

Empty sequences with the same TSource type are sequentially equal:

internal static void SequentialEqualOfEmpty()

```csharp
{
```
```csharp
IEnumerable<Derived>emptyFirst = new ConcurrentQueue<Derived>();
```
```csharp
IEnumerable<Base>emptySecond = ImmutableHashSet.Create<Base>();
```
```csharp
bool sequentialEqual = emptyFirst.SequenceEqual(emptySecond).WriteLine(); // True
```

}

The other overload accepts a comparer:

public static bool SequenceEqual<TSource\>(

this IEnumerable<TSource\> first, IEnumerable<TSource\> second, IEqualityComparer<TSource\> comparer);

For example:

internal static void SequentialEqualWithComparer()

```csharp
{
```
```csharp
IEnumerable<string>first = new string[] { null, string.Empty, "ss", };
```
```csharp
IEnumerable<string>second = new string[] { null, string.Empty, "ß", };
```
```csharp
CultureInfo.CurrentCulture = new CultureInfo("en-US");
```
```csharp
bool sequentialEqual1 = first.SequenceEqual(second, StringComparer.CurrentCulture).WriteLine(); // True
```
```csharp
bool sequentialEqual2 = first.SequenceEqual(second, StringComparer.Ordinal).WriteLine(); // False
```

}

Again, the first overload without comparer uses EqualityComparer<TSource>.Default.

## Summary

This chapter discusses IEnumerable<T> interface, which represents LINQ to Objects source or query, then discusses each standard query in query method syntax and query expression syntax if applicable. With this detailed tutorial, reader should be able to master how to use LINQ to Objects to query data objects in memory.