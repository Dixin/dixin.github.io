---
title: "LINQ to Objects in Depth (2) Query Methods (Operators) and Query Expressions"
published: 2018-07-03
description: "This part discusses the usages of built-in LINQ to Objects query methods and query expressions. As fore mentioned, these query methods (also called [standard query operators](http://msdn.microsoft.com"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-objects-query-methods-operators-and-query-expressions](/posts/linq-to-objects-query-methods-operators-and-query-expressions "https://weblogs.asp.net/dixin/linq-to-objects-query-methods-operators-and-query-expressions")**

This part discusses the usages of built-in LINQ to Objects query methods and query expressions. As fore mentioned, these query methods (also called [standard query operators](http://msdn.microsoft.com/en-us/library/bb397896.aspx)) are provided in System.Linq.Enumerable type, most of which are IEnumerable<T> extension methods. They can be categorized by return type:

1.  Sequence queries: return a new IEnumerable<T> sequence:
    -   Generation: Empty , Range, Repeat, DefaultIfEmpty
    -   Filtering (restriction): Where\*, OfType
    -   Mapping (projection): Select\*, SelectMany\*
    -   Grouping: GroupBy\*
    -   Join: SelectMany, Join\*, GroupJoin\*
    -   Concatenation: Concat, Append, Prepend
    -   Set: Distinct, Union, Intersect, Except
    -   Convolution: Zip
    -   Partitioning: Take, Skip, TakeWhile, SkipWhile
    -   Ordering: OrderBy\*, ThenBy\*, OrderByDescending\*, ThenByDescending\*, Reverse\*
    -   Conversion: Cast\*, AsEnumerable
2.  Collection queries: return a new collection:
    -   Conversion: ToArray, ToList, ToDictionary, ToLookup
3.  Value queries: return a single value:
    -   Element: First, FirstOrDefault, Last, LastOrDefault, ElementAt, ElementAtOrDefault, Single, SingleOrDefault
    -   Aggregation: Aggregate, Count, LongCount, Min, Max, Sum, Average
    -   Quantifier: All, Any, Contains
    -   Equality: SequenceEqual

These LINQ query methods are very functional. They are functions that can be composed by fluent chaining. Many of them are higher-order functions accepting function parameters, so that anonymous functions (lambda expressions) or named functions can be passed to them. The query methods returning IEnumerable<T> are pure functions. They are referential transparency and side effect free. When they are called, they only create and return a new sequence wrapping the input sequence and the query logic, with the query logic not executed, so there is no state changes, data mutation, I/O, etc. The query logic execution is deferred until the result values are pulled from the returned sequence. The other query methods (returning a new collection or a single value) are impure functions. When they are called, they immediately evaluate the values of the input source sequence, and execute the query logic.

As discussed in the Functional Programming chapter, The query methods marked with \* are supported with query expressions syntax.

<table border="0" cellpadding="2" cellspacing="0" width="577"><tbody><tr><td valign="top" width="297">Query expression</td><td valign="top" width="278">Query method</td></tr><tr><td valign="top" width="297">single from clause with select clause</td><td valign="top" width="278">Select</td></tr><tr><td valign="top" width="297">multiple from clauses with select clause</td><td valign="top" width="278">SelectMany</td></tr><tr><td valign="top" width="297">Type in from/join clauses</td><td valign="top" width="278">Cast</td></tr><tr><td valign="top" width="297">join clause without into</td><td valign="top" width="278">Join</td></tr><tr><td valign="top" width="297">join clause with into</td><td valign="top" width="278">GroupJoin</td></tr><tr><td valign="top" width="297">let clause</td><td valign="top" width="278">Select</td></tr><tr><td valign="top" width="297">where clauses</td><td valign="top" width="278">Where</td></tr><tr><td valign="top" width="297">orderby clause with or without ascending</td><td valign="top" width="278">OrderBy, ThenBy</td></tr><tr><td valign="top" width="297">orderby clause with descending</td><td valign="top" width="278">OrderByDescending, ThenByDescending</td></tr><tr><td valign="top" width="297">group clause</td><td valign="top" width="278">GroupBy</td></tr><tr><td valign="top" width="297">into with continuation</td><td valign="top" width="278">Nested query</td></tr></tbody></table>

## Sequence queries

### Generation

Enumerable type’s Empty , Range, Repeat methods can generate an IEnumerable<T> sequence. They are just normal static methods instead of extension methods:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TResult> Empty<TResult>();

        public static IEnumerable<int> Range(int start, int count);

        public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count);
    }
}
```

Empty just generates an IEnumerable<T> sequence, which contains no value:

```csharp
internal static partial class QueryMethods
{
    internal static void Empty()
    {
        IEnumerable<string> empty = Enumerable.Empty<string>(); // Define query.
        int count = 0;
        foreach (string result in empty) // Execute query by pulling the results.
        {
            count++; // Not executed.
        }
        count.WriteLine(); // 0
    }
}
```

Range generates an int sequence with the specified initial int value and range:

```csharp
internal static void Range()
{
    IEnumerable<int> range = Enumerable.Range(-1, 5); // Define query.
    range.WriteLines(); // Execute query. -1 0 1 2 3
    // Equivalent to:
    // foreach (int int32 in range)
    // {
    //    int32.WriteLine();
    // }
}
```

The following example creates a sequence with large number of int values:

```csharp
internal static void MaxRange()
{
    IEnumerable<int> range = Enumerable.Range(1, int.MaxValue); // Define query.
}
```

As just mentioned, calling above MaxRange just defines a query. A large sequence is created, but each actual value in the large sequence is not generated.

```csharp
internal static void Repeat()
{
    IEnumerable<string> repeat = Enumerable.Repeat("*", 5); // Define query.
    repeat.WriteLines(); // Execute query. * * * * *
}
```

DefaultIfEmpty generates a sequence based on the source sequence. If the source sequence is not empty, the returned sequence contains the same values from the source sequence. If the source sequence is empty, the returned sequence contains a single value, which is the default value of TSource type:

```csharp
public static IEnumerable<TSource> DefaultIfEmpty<TSource>(this IEnumerable<TSource> source);
```

The other overload of DefaultIfEmpty allows to specify what default value to use if the source sequence is empty:

```csharp
public static IEnumerable<TSource> DefaultIfEmpty<TSource>(
    this IEnumerable<TSource> source, TSource defaultValue);
```

For example:

```csharp
internal static void DefaultIfEmpty()
{
    IEnumerable<int> souce = Enumerable.Empty<int>();
    IEnumerable<int> singletonIfEmpty = souce.DefaultIfEmpty(); // Define query.
    singletonIfEmpty.WriteLines(); // Execute query: 0
}

internal static void DefaultIfEmptyWithDefaultValue()
{
    IEnumerable<int> souce = Enumerable.Empty<int>();
    IEnumerable<int> singletonIfEmpty = souce.DefaultIfEmpty(1);
    singletonIfEmpty.WriteLines(); // Execute query. 1
}
```

DefaultIfEmpty is also commonly used in left outer join, which will be discussed later.

### Filtering (restriction)

As demonstrated earlier, Where filters the values in the source sequence:

```csharp
public static IEnumerable<TSource> Where<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

The other predicate parameter is a callback function. When the query is executed, predicate is called with each value in the source sequence, and return a bool value. If true is returned, this value is in the query result sequence; if false is returned, this value is filtered out. For example, the following query filters all types in .NET core library to get all primitive type:

```csharp
private static readonly Assembly CoreLibrary = typeof(object).Assembly;

internal static void Where()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<Type> primitives = source.Where(type => type.IsPrimitive); // Define query.
    primitives.WriteLines(); // Execute query. System.Boolean System.Byte System.Char System.Double ...
}
```

And the equivalent query expression has a where clause:

```csharp
internal static void Where()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<Type> primitives = from type in source
                                   where type.IsPrimitive
                                   select type;
}
```

The other overload of Where has a indexed predicate function:

```csharp
public static IEnumerable<TSource> Where<TSource>(
    this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
```

Here each time predicate is called with 2 parameters, the current value in source sequence, and the current value’s index in source sequence. For example:

```csharp
internal static void WhereWithIndex()
{
    IEnumerable<string> source = new string[] { "zero", "one", "two", "three", "four" };
    IEnumerable<string> even = source.Where((value, index) => index % 2 == 0); // Define query.
    even.WriteLines(); // Execute query. zero two four
}
```

The indexed Where overload is not supported in query expression syntax.

The other filtering query method is OfType. It filters values by type:

```csharp
internal static void OfType()
{
    IEnumerable<object> source = new object[] { 1, 2, 'a', 'b', "aa", "bb", new object() };
    IEnumerable<string> strings = source.OfType<string>();  // Define query.
    strings.WriteLines(); // Execute query. aa bb
}
```

OfType is not supported in query expression either.

### Mapping (projection)

Similar to Where, Select has 2 overloads:

```csharp
IEnumerable<TResult> Select<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector);

IEnumerable<TResult> Select<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, int, TResult> selector);
```

When the query is executed, the selector function is called with each TSource value, and map it to a TResult result in the returned sequence. And in the indexed overload, selector is also called with TSource value’s index. For example, the following Select query maps each integer to a formatted string representing the integer’s square root:

```csharp
internal static void Select()
{
    IEnumerable<int> source = Enumerable.Range(0, 5);
    IEnumerable<string> squareRoots = source.Select(int32 => $"{Math.Sqrt(int32):0.00}"); // Define query.
    squareRoots.WriteLines(); // Execute query. 0.00 1.00 1.41 1.73 2.00
}
```

The equivalent query expression is a select clause with a single from clause:

```csharp
internal static void Select()
{
    IEnumerable<int> source = Enumerable.Range(0, 5);
    IEnumerable<string> squareRoots = from int32 in source
                                      select $"{Math.Sqrt(int32):0.00}";
}
```

Query expression must end with either a select clause, or group clause (will be discussed below). If there are other clauses between the starting from clause and the ending select clause, and the ending select clause simply has the value from the source sequencce, then that ending select clause is ignored and is not compiled to a Select query method call. Above where query expression is such an example.

The following is an example of the indexed overload:

```csharp
internal static IEnumerable<string> Words() => new string[] { "Zero", "one", "Two", "three", "four" };

[SuppressMessage("Microsoft.Globalization", "CA1308:NormalizeStringsToUppercase")]
internal static void SelectWithIndex()
{
    IEnumerable<string> source = Words();
    var mapped = source.Select((value, index) => new
    {
        Index = index,
        Word = value.ToLowerInvariant()
    }); // Define query: IEnumerable<(string Word, int Index)>
    mapped.WriteLines(result => $"{result.Index}:{result.Word}"); // Execute query. 
    // 0:zero 1:one 2:two 3:three 4:four
}
```

Here selector returns anonymous type. As a result, Select returns a sequence of anonymous type, and var has to be used.

As discussed in the Functional Programming chapter, let clause is also compiled to Select query with a selector function returning anonymous type:

```csharp
internal static void Let()
{
    IEnumerable<int> source = Enumerable.Range(-2, 5);
    IEnumerable<string> absoluteValues = from int32 in source
                                         let abs = Math.Abs(int32)
                                         where abs > 0
                                         select $"Math.Abs({int32}) == {abs}";
}
```

The compiled Select query returns a (int int32, int abs) anonymous type:

```csharp
internal static void CompiledLet()
{
    IEnumerable<int> source = Enumerable.Range(-2, 5);
    IEnumerable<string> absoluteValues = source
        .Select(int32 => new { int32 = int32, abs = Math.Abs(int32) })
        .Where(anonymous => anonymous.abs > 0)
        .Select(anonymous => $"Math.Abs({anonymous.int32}):{anonymous.abs}"); // Define query.
    absoluteValues.WriteLines(); // Execute query.
    // Math.Abs(-2):2 Math.Abs(-1):1 Math.Abs(1):1 Math.Abs(2):2
}
```

SelectMany has 4 overloads. Similar to Where and Select, the following 2 overloads accept unindexed and indexed selector:

```csharp
public static IEnumerable<TResult> SelectMany<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, IEnumerable<TResult>> selector);

public static IEnumerable<TResult> SelectMany<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, int, IEnumerable<TResult>> selector);
```

In contrast with Select, SelectMany’s selector is a one to many mapping. If there are N values from the source sequence, then they are mapped to N sequences. And eventually, SelectMany concatenates these N sequences into one single sequence. The following example calls SelectMany to query all members of all types in .NET core library, then filter the obsolete members (members with \[Obsolete\]):

```csharp
internal static MemberInfo[] GetDeclaredMembers(this Type type) =>
    type.GetMembers(
        BindingFlags.Public | BindingFlags.Static | BindingFlags.Instance | BindingFlags.DeclaredOnly);

internal static bool IsObsolete(this MemberInfo member) =>
    member.IsDefined(attributeType: typeof(ObsoleteAttribute), inherit: false);

internal static void SelectMany()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<MemberInfo> oneToManymapped = source.SelectMany(type => type.GetDeclaredMembers()); // Define query.
    IEnumerable<MemberInfo> filtered = oneToManymapped.Where(member => member.IsObsolete()); // Define query.
    filtered.WriteLines(obsoleteMember => $"{obsoleteMember.DeclaringType}:{obsoleteMember}"); // Execute query.
    // Equivalent to:
    // foreach (MemberInfo obsoleteMember in filtered)
    // {
    //    Trace.WriteLine($"{obsoleteMember.DeclaringType}:{obsoleteMember}");
    // }
    // ...
    // System.Enum:System.String ToString(System.String, System.IFormatProvider)
    // System.Enum:System.String ToString(System.IFormatProvider)
    // ...
}
```

Apparently, the above SelectMany, Where, and are both extension methods for IEnumerable<T>, and they both return IEnumerable<T>, so that above LINQ query can be fluent, as expected:

```csharp
internal static void FluentSelectMany()
{
    IEnumerable<MemberInfo> mappedAndFiltered = CoreLibrary
        .GetExportedTypes()
        .SelectMany(type => type.GetDeclaredMembers())
        .Where(member => member.IsObsolete()); // Define query.
    mappedAndFiltered.WriteLines(obsoleteMember => $"{obsoleteMember.DeclaringType}:{obsoleteMember}"); // Execute query.
}
```

And the equivalent query expression has 2 from clauses:

```csharp
internal static void SelectMany()
{
    IEnumerable<MemberInfo> mappedAndFiltered =
        from type in CoreLibrary.GetExportedTypes()
        from member in type.GetPublicDeclaredMembers()
        where member.IsObsolete()
        select member;
}
```

Generally, SelectMany can flatten a hierarchical 2-level-sequence into a flat 1-level-sequence. In these examples, the source sequence is hierarchical – it has many types, and each type can have a sequence of many members. SelectMany flattens the hierarchy, and concatenates many sequences of members into a single sequence of members.

The other 2 SelectMany overloads accept 2 selector functions:

```csharp
public static IEnumerable<TResult> SelectMany<TSource, TCollection, TResult>(
    this IEnumerable<TSource> source, Func<TSource,
    IEnumerable<TCollection>> collectionSelector,
    Func<TSource, TCollection, TResult> resultSelector);

public static IEnumerable<TResult> SelectMany<TSource, TCollection, TResult>(
    this IEnumerable<TSource> source, 
    Func<TSource, int, IEnumerable<TCollection>> collectionSelector, 
    Func<TSource, TCollection, TResult> resultSelector);
```

They accept 2 selector functions. The collection selector (non indexed and index) maps source sequence’s each TSource value to many TCollection values (a IEnumerable<TCollection> sequence), and the result selector maps each TCollection value and its original TSource value to a TResult value. So eventually they still return a sequence of TResult values. For example, the following example use result selector to map type and member to string representation:

```csharp
internal static void SelectManyWithResultSelector()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<string> obsoleteMembers = source
        .SelectMany(
            collectionSelector: type => type.GetDeclaredMembers(),
            resultSelector: (type, member) => new { Type = type, Member = member })
        .Where(typeAndMember => typeAndMember.Member.IsObsolete())
        .Select(typeAndMember => $"{typeAndMember.Type}:{typeAndMember.Member}");
}
```

The equivalent query expression has 2 from clauses for the SelectMany query, a where clause for Where, and 1 select query for Select:

```csharp
internal static void SelectManyWithResultSelector()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<string> obsoleteMembers =
        from type in source
        from member in type.GetDeclaredMembers()
        where member.IsObsolete()
        select $"{type}:{member}";
}
```

The collection selector function returns a sequence, which can be queried too. Here the Where query logically filters the obsolete member can be equivalently applied to the collection selector, which is called a subquery:

```csharp
internal static void SelectManyWithResultSelectorAndSubquery()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<string> obsoleteMembers = source.SelectMany(
        collectionSelector: type => type.GetDeclaredMembers().Where(member => member.IsObsolete()),
        resultSelector: (type, obsoleteMember) => $"{type}:{obsoleteMember}"); // Define query.
    obsoleteMembers.WriteLines(); // Execute query.
}
```

The equivalent query expression has a sub query expression for Where:

```csharp
internal static void SelectManyWithResultSelectorAndSubquery()
{
    IEnumerable<Type> source = CoreLibrary.GetExportedTypes();
    IEnumerable<string> obsoleteMembers =
        from type in source
        from obsoleteMember in (from member in type.GetDeclaredMembers()
                                where member.IsObsolete()
                                select member)
        select $"{type}:{obsoleteMember}"; // Define query.
    obsoleteMembers.WriteLines(); // Execute query.
}
```

SelectMany is a very powerful query method, and the multiple from clauses is also a powerful syntax to build a functional workflow. This will be discussed in the Category Theory chapter.

### Grouping

The GroupBy method has 8 overloads. The minimum requirement is to specified a key selector function, which is called with each value in the source sequence, and return a key:

```csharp
public static IEnumerable<IGrouping<TKey, TSource>> GroupBy<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

Each value from he source sequence is mapped to a key by calling the keys elector. If 2 keys are equal, these 2 source values are in the same group. Take the following persons as example:

```csharp
internal class Person
{
    internal Person(string name, string placeOfBirth)
    {
        this.Name = name;
        this.PlaceOfBirth = placeOfBirth;
    }

    internal string Name { get; }

    internal string PlaceOfBirth { get; }
}

internal static partial class QueryMethods
{
    internal static IEnumerable<Person> Persons() => new Person[]
    {
        new Person(name: "Robert Downey Jr.", placeOfBirth: "US"),
        new Person(name:  "Tom Hiddleston", placeOfBirth: "UK"),
        new Person(name: "Chris Hemsworth", placeOfBirth: "AU"),
        new Person(name: "Chris Evans", placeOfBirth: "US"),
        new Person(name: "Paul Bettany", placeOfBirth:  "UK")
    };
}
```

These Person instances represents actors of [Marvel Cinematic Universe](https://en.wikipedia.org/wiki/Marvel_Cinematic_Universe). They can be simply grouped by their place of birth:

```csharp
internal static void GroupBy()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<IGrouping<string, Person>> groups = source.GroupBy(person => person.PlaceOfBirth); // Define query.
    foreach (IGrouping<string, Person> group in groups) // Execute query.
    {
        $"{group.Key}: ".Write();
        foreach (Person person in group)
        {
            $"{person.Name}, ".Write();
        }
        Environment.NewLine.Write();
    }
    // US: Robert Downey Jr., Chris Evans,
    // UK: Tom Hiddleston, Paul Bettany,
    // AU: Chris Hemsworth,
}
```

GroupBy returns IEnumerable<IGrouping<TKey, TSource>>. The following is the definition of IGrouping<TKey, TElement> interface:

```csharp
namespace System.Linq
{
    public interface IGrouping<out TKey, out TElement> : IEnumerable<TElement>, IEnumerable
    {
        TKey Key { get; }
    }
}
```

It is just an IEnumerable<T> sequence with an additional Key property. So, above GroupBy returns a hierarchical sequence. It is a sequence of groups, where each group is a sequence of values. The equivalent query expression is a group clause:

```csharp
internal static void GroupBy()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<IGrouping<string, Person>> groups = from person in source
                                                    group person by person.PlaceOfBirth;
}
```

GroupBy can also accepts a result selector function to map each group and its key to a result in the returned sequence:

```csharp
public static IEnumerable<TResult> GroupBy<TSource, TKey, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector,
    Func<TKey, IEnumerable<TSource>, TResult> resultSelector);
```

This overload, does not return of hierarchical sequence of groups, but flattened sequence of result values:

```csharp
internal static void GroupByWithResultSelector()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<string> groups = source
        .GroupBy(
            keySelector: person => person.PlaceOfBirth,
            resultSelector: (key, group) => $"{key}:{group.Count()}"); // Define query.
    groups.WriteLines(); // Execute query. US:2 UK:2 AU:1
}
```

This overload is directly not supported by query expression. However, its result selector can be equivalently applied with an additional Select query:

```csharp
internal static void GroupByAndSelect()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<IGrouping<string, Person>> groups = source.GroupBy(person => person.PlaceOfBirth);
    IEnumerable<string> mapped = groups.Select(group => $"{group.Key}: {group.Count()}"); // Define query.
    groups.WriteLines(); // Execute query. US:2 UK:2 AU:1
}
```

As just demonstrated, this GroupBy overload is equivalent to query expression with a group clause, and Select can be compiled from a select clause:

```csharp
internal static void GroupByAndSelect()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<IGrouping<string, Person>> groups = from person in source
                                                    group person by person.PlaceOfBirth;
    IEnumerable<string> mapped = from @group in groups
                                 select $"{@group.Key}: {@group.Count()}";
}
```

Here @ is prepended to the @group identifier, because group is a query keyword. By removing the groups variable, the first query expression becomes the second query expression’s subquery:

```csharp
internal static void FluentGroupByAndSelect()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<string> mapped = from @group in (from person in source
                                                 group person by person.PlaceOfBirth)
                                 select $"{@group.Key}: {@group.Count()}";
}
```

The above expression is nested rather than fluent. So a into query keyword is provided for continuation like this:

```csharp
internal static void GroupByAndSelectWithInto()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<string> mapped = from person in source
                                 group person by person.PlaceOfBirth into @group
                                 select $"{@group.Key}: {@group.Count()}";
}
```

The compilation of the above 2 query expressions are identical.

GroupBy can also accept an element selector function to map each value in he source sequence in the source sequence to a result value in the group:

```csharp
public static IEnumerable<IGrouping<TKey, TElement>> GroupBy<TSource, TKey, TElement>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector);
```

For example:

```csharp
internal static void GroupByWithElementSelector()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<IGrouping<string, string>> groups = source
        .GroupBy(
            keySelector: person => person.PlaceOfBirth,
            elementSelector: person => person.Name); // Define query.
    foreach (IGrouping<string, string> group in groups) // Execute query.
    {
        $"{group.Key}: ".Write();
        foreach (string name in group)
        {
            $"{name}, ".Write();
        }
        Environment.NewLine.Write();
    }
    // US: Robert Downey Jr., Chris Evans,
    // UK: Tom Hiddleston, Paul Bettany,
    // AU: Chris Hemsworth,
}
```

In query expression, the element selector can be specified after the group keyword:

```csharp
internal static void GroupByWithElementSelector()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<IGrouping<string, string>> groups = from person in source
                                                    group person.Name by person.PlaceOfBirth;
}
```

And element selector can be used with result selector:

```csharp
public static IEnumerable<TResult> GroupBy<TSource, TKey, TElement, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    Func<TKey, IEnumerable<TElement>, TResult> resultSelector);
```

Again, result selector can flatten the hierarchical sequence:

```csharp
internal static void GroupByWithElementAndResultSelector()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<string> groups = source.GroupBy(
        keySelector: person => person.PlaceOfBirth,
        elementSelector: person => person.Name,
        resultSelector: (key, group) => $"{key}: {string.Join(", ", group)}"); // Define query.
    groups.WriteLines(); // Execute query.
    // US: Robert Downey Jr., Chris Evans
    // UK: Tom Hiddleston, Paul Bettany
    // AU: Chris Hemsworth
}
```

Similar to SelectMany, GroupBy with both element selector and result selector is not directly supported in query expression. The result selector logic can be done with a select continuation:

```csharp
internal static void GroupByWithElementSelectorAndSelect()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<string> groups = from person in source
                                 group person.Name by person.PlaceOfBirth into @group
                                 select $"{@group.Key}: {string.Join(",", @group)}";
}
```

The rest 4 overloads accept an IEqualityComparer<TKey> interface:

```csharp
public static IEnumerable<IGrouping<TKey, TSource>> GroupBy<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IEqualityComparer<TKey> comparer);

public static IEnumerable<TResult> GroupBy<TSource, TKey, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector,
    Func<TKey, IEnumerable<TSource>, TResult> resultSelector,
    IEqualityComparer<TKey> comparer);

public static IEnumerable<IGrouping<TKey, TElement>> GroupBy<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    IEqualityComparer<TKey> comparer);

public static IEnumerable<TResult> GroupBy<TSource, TKey, TElement, TResult>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    Func<TKey, IEnumerable<TElement>, TResult> resultSelector,
    IEqualityComparer<TKey> comparer);
```

IEqualityComparer<TKey> provides the methods to determine whether 2 keys are equal when grouping all keys:

```csharp
namespace System.Collections.Generic
{
    public interface IEqualityComparer<in T>
    {
        bool Equals(T x, T y);

        int GetHashCode(T obj);
    }
}
```

For example:

```csharp
internal static void GroupByWithEqualityComparer()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<string> groups = source.GroupBy(
        keySelector: person => person.PlaceOfBirth,
        elementSelector: person => person.Name,
        resultSelector: (key, group) => $"{key}:{string.Join(",", group)}",
        comparer: StringComparer.OrdinalIgnoreCase); // Define query.
    groups.WriteLines(); // Execute query. US:2 UK: 2 AU: 1
}
```

These 4 overloads is not supported by query expression.

### Join

### Inner join

Join is designed for [inner join](http://en.wikipedia.org/wiki/Inner_join#Inner_join):

```csharp
IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, 
    Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, 
    Func<TOuter, TInner, TResult> resultSelector)

IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, 
    Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, 
    Func<TOuter, TInner, TResult> resultSelector, 
    IEqualityComparer<TKey> comparer)
```

Each outer value from the outer source is mapped to an outer key by calling the outer key selector, and each inner value from the inner source is mapped to an inner key. When a outer key is equal to an inner key, the source outer value and the matching source inner value are paired, and mapped to a result by calling the result selector. So each outer value with a matching inner value is mapped to a result in the returned sequence, and each outer value without a matching inner value is ignored. Take the following characters as example:

```csharp
internal partial class Character
{
    internal Character(string name, string placeOfBirth, string starring)
    {
        this.Name = name;
        this.PlaceOfBirth = placeOfBirth;
        this.Starring = starring;
    }

    internal string Name { get; }

    internal string PlaceOfBirth { get; }

    internal string Starring { get; }
}

internal static partial class QueryMethods
{
    internal static IEnumerable<Character> Characters() => new Character[]
    {
        new Character(name: "Tony Stark", placeOfBirth: "US", starring: "Robert Downey Jr."),
        new Character(name: "Thor", placeOfBirth: "Asgard", starring: "Chris Hemsworth"),
        new Character(name: "Steve Rogers", placeOfBirth: "US", starring: "Chris Evans"),
        new Character(name: "Vision", placeOfBirth: "KR", starring: "Paul Bettany"),
        new Character(name: "JARVIS", placeOfBirth: "US", starring: "Paul Bettany")
    };
}
```

These Character instances represents characters in the movie [Avengers 2](https://en.wikipedia.org/wiki/Avengers:_Age_of_Ultron), and can be joined with actors. When a character from outer sequence matches an actor from inner sequence by [cast](https://en.wikipedia.org/wiki/Avengers:_Age_of_Ultron#Cast), these 2 values are paired and mapped to the result sequence:

```csharp
internal static void InnerJoin()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    IEnumerable<string> innerJoin = outer.Join(
        inner: inner,
        outerKeySelector: person => person.Name,
        innerKeySelector: character => character.Starring,
        resultSelector: (person, character) => $"{person.Name} ({person.PlaceOfBirth}): {character.Name}"); // Define query.
    innerJoin.WriteLines(); // Execute query.
    // Robert Downey Jr. (US): Tony Stark
    // Chris Hemsworth (AU): Thor
    // Chris Evans (US): Steve Rogers
    // Paul Bettany (UK): Vision
    // Paul Bettany (UK): JARVIS
}
```

In the inner join results, the name “Tom Hiddleston” does not exist in the results, because the person with this name cannot match with any character’s starring ([Tom Hiddleston](https://en.wikipedia.org/wiki/Tom_Hiddleston) is the actor of [Loki](https://en.wikipedia.org/wiki/Loki_\(comics\)), who is in [Avengers 1](https://en.wikipedia.org/wiki/The_Avengers_\(2012_film\)) but not in Avengers 2). And the name “Paul Bettany” appears twice in the results, because the person with this name matches 2 characters’ starring ([Paul Bettany](https://en.wikipedia.org/wiki/Paul_Bettany) is the voice of [JARVIS](https://en.wikipedia.org/wiki/Edwin_Jarvis#J.A.R.V.I.S.) and the actor of [Vision](https://en.wikipedia.org/wiki/Vision_\(Marvel_Comics\))). The equivalent query expression has a join clause:

```csharp
internal static void InnerJoin()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    IEnumerable<string> innerJoin =
        from person in outer
        join character in inner on person.Name equals character.Starring
        select $"{person.Name} ({person.PlaceOfBirth}): {character.Name}";
}
```

In the above example, the outer value and the inner value are matched with a single key - Person.Name property and Character.Starring property. To match with multiple keys, just have both outer key selector and inner key selector return the same anonymous type with multiple properties:

```csharp
internal static void InnerJoinWithMultipleKeys()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    IEnumerable<string> innerJoin = outer.Join(
        inner: inner,
        outerKeySelector: person => new { Starring = person.Name, PlaceOfBirth = person.PlaceOfBirth },
        innerKeySelector: character => new { Starring = character.Starring, PlaceOfBirth = character.PlaceOfBirth },
        resultSelector: (person, character) =>
            $"{person.Name} ({person.PlaceOfBirth}): {character.Name} ({character.PlaceOfBirth})"); // Define query.
    innerJoin.WriteLines(); // Execute query.
    // Robert Downey Jr. (US): Tony Stark (US)
    // Chris Evans (US): Steve Rogers (US)
}
```

Anonymous type can be also used with join clause in query expression:

```csharp
internal static void InnerJoinWithMultiKeys()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    IEnumerable<string> innerJoin =
        from person in outer
        join character in inner
            on new { Starring = person.Name, PlaceOfBirth = person.PlaceOfBirth }
            equals new { Starring = character.Starring, PlaceOfBirth = character.PlaceOfBirth }
        select $"{person.Name} ({person.PlaceOfBirth}): {character.Name} ({character.PlaceOfBirth})";
}
```

### Left outer join

GroupJoin is designed for [left outer join](https://en.wikipedia.org/wiki/Join_\(SQL\)#Left_outer_join):

```csharp
IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, 
    Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, 
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector)

IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer, IEnumerable<TInner> inner, 
    Func<TOuter, TKey> outerKeySelector, Func<TInner, TKey> innerKeySelector, 
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector, 
    IEqualityComparer<TKey> comparer)
```

Each outer value from the outer source is mapped to an outer key by calling the outer key selector, and each inner value from the inner source is mapped to an inner key. When a outer key is equal to zero, one, or more inner key, the source outer value and all the matching source inner values are paired, and mapped to a result by calling the result selector. So each outer value with or without matching inner values is mapped to a result in the returned sequence. It is called GroupJoin, because each outer value is paired with a group of matching inner values. If there is no matching inner values, the outer value is paired with an empty group:

```csharp
internal static void LeftOuterJoin()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    var leftOuterJoin = outer.GroupJoin(
        inner: inner,
        outerKeySelector: person => person.Name,
        innerKeySelector: character => character.Starring,
        resultSelector: (person, charactersGroup) => 
            new { Person = person, Characters = charactersGroup }); // Define query.
    foreach (var result in leftOuterJoin) // Execute query.
    {
        $"{result.Person.Name} ({result.Person.PlaceOfBirth}): ".Write();
        foreach (Character character in result.Characters)
        {
            $"{character.Name} ({character.PlaceOfBirth}), ".Write();
        }
        Environment.NewLine.Write();
    }
    // Robert Downey Jr. (US): Tony Stark (US),
    // Tom Hiddleston (UK):
    // Chris Hemsworth (AU): Thor (Asgard),
    // Chris Evans (US): Steve Rogers (US),
    // Paul Bettany (UK): Vision (KR), JARVIS (US),
}
```

Here result selector is called with each actor, and a group of matching characters, then it returns anonymous type consists of both the actor and the matching characters. So eventually GroupJoin returns a hierarchical sequence. In the results, the person with name “Tom Hiddleston” matches no character, so it is paired with an empty Character group, and each other person matches 1 or more characters, so is paired with a non-empty Character group. In query expression, GroupJoin is equivalent to join clause with the into keyword:

```csharp
internal static void LeftOuterJoin()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    var leftOuterJoin =
        from person in outer
        join character in inner on person.Name equals character.Starring into charactersGroup
        select new { Person = person, Characters = charactersGroup };
}
```

In the join clause, into does not mean a continuation. it is a a part of the join.

The hierarchical sequence returned by GroupJoin can be flattened by SelectMany. In this kind of flatenning scenario, DefaultIfEmpty is usually used:

```csharp
internal static void LeftOuterJoinWithDefaultIfEmpty()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    var leftOuterJoin = outer
        .GroupJoin(
            inner: inner,
            outerKeySelector: person => person.Name,
            innerKeySelector: character => character.Starring,
            resultSelector: (person, charactersGroup) => new { Person = person, Characters = charactersGroup })
        .SelectMany(
            collectionSelector: group => group.Characters.DefaultIfEmpty(),
            resultSelector: (group, character) => new { Person = group.Person, Character = character }); // Define query.
    leftOuterJoin.WriteLines(result => $"{result.Person.Name}: {result.Character?.Name}");
    // Robert Downey Jr.: Tony Stark
    // Tom Hiddleston:
    // Chris Hemsworth: Thor
    // Chris Evans: Steve Rogers
    // Paul Bettany: Vision
    // Paul Bettany: JARVIS
}
```

Without the DefaultIfEmpty call, the second result “Tom Hiddleston” is ignored in the result sequence. The equivalent query expression has 2 from clauses for SelectMany:

```csharp
internal static void LeftOuterJoinWithDefaultIfEmpty()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    var leftOuterJoin =
        from person in outer
        join character in inner on person.Name equals character.Starring into charactersGroup
        from character in charactersGroup.DefaultIfEmpty()
        select new { Person = person, Character = character };
}
```

There is already a from clause before join clause, so, just add one more from clause after join clause.

Left outer join can also implement by mapping each outer value with all filtered matching inner values:

```csharp
internal static void LeftOuterJoinWithSelect()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    var leftOuterJoin = outer.Select(person => new
    {
        Person = person,
        Characters = inner.Where(character =>
            EqualityComparer<string>.Default.Equals(person.Name, character.Starring))
    }); // Define query.
    foreach (var result in leftOuterJoin) // Execute query.
    {
        $"{result.Person.Name} ({result.Person.PlaceOfBirth}): ".Write();
        foreach (Character character in result.Characters)
        {
            $"{character.Name} ({character.PlaceOfBirth}), ".Write();
        }
        Environment.NewLine.Write();
    }
    // Robert Downey Jr. (US): Tony Stark (US),
    // Tom Hiddleston (UK):
    // Chris Hemsworth (AU): Thor (Asgard),
    // Chris Evans (US): Steve Rogers (US),
    // Paul Bettany (UK): Vision (KR), JARVIS (US),
}
```

Notice here the Where subquery filters all inner values for each outer value. Generally, left outer join can be implemented with mapping query and filtering subquery:

```csharp
internal static IEnumerable<TResult> LeftOuterJoinWithSelect<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
    IEqualityComparer<TKey> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TKey>.Default;
    return outer.Select(outerValue => resultSelector(
        outerValue,
        inner.Where(innerValue => comparer.Equals(outerKeySelector(outerValue), innerKeySelector(innerValue)))));
}
```

In query expression, it just a simple query expression with a select clause containing a subquery with a where clause:

```csharp
internal static void LeftOuterJoinWithSelect()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    var leftOuterJoin =
        from person in outer
        select new
        {
            Person = person,
            Characters = from character in inner
                         where EqualityComparer<string>.Default.Equals(person.Name, character.Starring)
                         select character
        };
}

internal static IEnumerable<TResult> LeftOuterJoinWithSelect<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
    IEqualityComparer<TKey> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TKey>.Default;
    return from outerValue in outer
           select resultSelector(
                outerValue,
                (from innerValue in inner
                 where comparer.Equals(outerKeySelector(outerValue), innerKeySelector(innerValue))
                 select innerValue));
}
```

The difference is, for N outer values, GroupJoin pull all inner values once and cache them, Select and Where does not cache anything and pull all inner values N times. The internal implementation of these query methods are discussed later in this chapter.

### Cross Join

[Cross join](https://en.wikipedia.org/wiki/Join_\(SQL\)#Cross_join) 2 sequences is to return the [Cartesian product](https://en.wikipedia.org/wiki/Cartesian_product) of values in those 2 sequences. The easiest way for cross join is SelectMany:

```csharp
private static readonly int[] rows = { 1, 2, 3 };

private static readonly string[] columns = { "A", "B", "C", "D" };

internal static void CrossJoin()
{
    IEnumerable<string> cells = rows
        .SelectMany(row => columns, (row, column) => $"{column}{row}"); // Define query.

    int cellIndex = 0;
    int columnCount = columns.Length;
    foreach (string cell in cells) // Execute query.
    {
        $"{cell} ".Write();
        if (++cellIndex % columnCount == 0)
        {
            Environment.NewLine.Write();
        }
    }
    // A1 B1 C1 D1
    // A2 B2 C2 D2
    // A3 B3 C3 D3
}
```

Notice here all inner values are pulled for each outer value. If outer sequence has N outer values, then the inner sequence are iterated N times. In query expression, as fore mentioned, 2 from clauses are compiled to SelectMany:

```csharp
internal static void CrossJoin()
{
    IEnumerable<string> cells = from row in rows
                                from column in columns
                                select $"{column}{row}";
}
```

A general CrossJoin query method can be implemented as:

```csharp
internal static IEnumerable<TResult> CrossJoin<TOuter, TInner, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TInner, TResult> resultSelector) =>
        outer.SelectMany(outerValue => inner, resultSelector);
        // Equivalent to:
        // from outerValue in outer
        // from innerValue in inner
        // select resultSelector(outerValue, innerValue);
```

Cross join can also be done with Join, with inner key always equal to outer key, so that each outer value matches all inner values:

```csharp
internal static void CrossJoinWithJoin()
{
    IEnumerable<string> cells = rows.Join(
        inner: columns,
        outerKeySelector: row => true,
        innerKeySelector: column => true,
        resultSelector: (row, column) => $"{column}{row}"); // Define query.
    int cellIndex = 0;
    int columnCount = columns.Length;
    foreach (string cell in cells) // Execute query.
    {
        $"{cell} ".Write();
        if (++cellIndex % columnCount == 0)
        {
            Environment.NewLine.Write();
        }
    }
}
```

And generally, cross join can be implemented by Join as:

```csharp
internal static IEnumerable<TResult> CrossJoinWithJoin<TOuter, TInner, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TInner, TResult> resultSelector) =>
        outer.Join(
            inner: inner,
            outerKeySelector: outerValue => true,
            innerKeySelector: innerValue => true,
            resultSelector: resultSelector); // Equivalent to:
        // Equivalent to:
        // from outerValue in outer
        // join innerValue in inner on true equals true
        // select resultSelector(outerValue, innerValue);
```

In query expression, again, Join is just a join clause without into:

```csharp
internal static void CrossJoinWithJoin()
{
    IEnumerable<string> cells = from row in rows
                                join column in columns on true equals true
                                select $"{column}{row}";
}

internal static IEnumerable<TResult> CrossJoinWithJoin<TOuter, TInner, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TInner, TResult> resultSelector) =>
        from outerValue in outer
        join innerValue in inner on true equals true
        select resultSelector(outerValue, innerValue);
```

The above inner join can be logically viewed as cross join with filtering the matching outer value and inner value. The above inner join of persons and characters can be implemented with SelectMany and Where as:

```csharp
internal static void InnerJoinWithSelectMany()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    IEnumerable<string> innerJoin = outer
        .SelectMany(
            collectionSelector: person => inner,
            resultSelector: (person, character) => new { Person = person, Character = character })
        .Where(crossJoinValue => EqualityComparer<string>.Default.Equals(
            crossJoinValue.Person.Name, crossJoinValue.Character.Starring))
        .Select(innerJoinValue =>
            $"{innerJoinValue.Person.Name} ({innerJoinValue.Person.PlaceOfBirth}): {innerJoinValue.Character.Name}");
    // Define query.
    innerJoin.WriteLines(); // Execute query.
    // Robert Downey Jr. (US): Tony Stark
    // Chris Hemsworth (AU): Thor
    // Chris Evans (US): Steve Rogers
    // Paul Bettany (UK): Vision
    // Paul Bettany (UK): JARVIS
}
```

Generally, inner join and be implemented with cross join and filtering:

```csharp
internal static IEnumerable<TResult> InnerJoinWithSelectMany<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, TInner, TResult> resultSelector,
    IEqualityComparer<TKey> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TKey>.Default;
    return outer
        .SelectMany(
            collectionSelector: outerValue => inner,
            resultSelector: (outerValue, innerValue) => new { OuterValue = outerValue, InnerValue = innerValue })
        .Where(
            crossJoinValue => comparer.Equals(
                outerKeySelector(crossJoinValue.OuterValue),
                innerKeySelector(crossJoinValue.InnerValue)))
        .Select(innerJoinValue => resultSelector(innerJoinValue.OuterValue, innerJoinValue.InnerValue));
}
```

In query expression, as fore mentioned, SelectMany is 2 from clauses:

```csharp
internal static void InnerJoinWithSelectMany()
{
    IEnumerable<Person> outer = Persons();
    IEnumerable<Character> inner = Characters();
    IEnumerable<string> innerJoin =
        from person in outer
        from character in inner
        where EqualityComparer<string>.Default.Equals(person.Name, character.Starring)
        select $"{person.Name} ({person.PlaceOfBirth}): {character.Name}";
}

internal static IEnumerable<TResult> InnerJoinWithSelectMany<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, TInner, TResult> resultSelector,
    IEqualityComparer<TKey> comparer = null)
{
    comparer = comparer ?? EqualityComparer<TKey>.Default;
    return from outerValue in outer, 
           from innerValue in inner
           where comparer.Equals(outerKeySelector(outerValue), innerKeySelector(innerValue))
           select resultSelector(outerValue, innerValue);
}
```

The difference is, for N outer values, Join pull all inner values once and cache them, SelectMany does not cache anything and pull all inner values N times. Again the internal implementation of these query methods are discussed later in this chapter.

### Concatenation

Concat merges 2 sequences by putting the second sequence’s values after the first sequence’s values:

```csharp
public static IEnumerable<TSource> Concat<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second);
```

For example:

```csharp
internal static int[] First() => new int[] { 1, 2, 3, 4, 4 };

internal static int[] Second() => new int[] { 3, 4, 5, 6 };

internal static void Concat()
{
    IEnumerable<int> first = First();
    IEnumerable<int> second = Second();
    IEnumerable<int> concat = first.Concat(second); // Define query.
    concat.WriteLines(); // Execute query. 1 2 3 4 4 3 4 5 6
}
```

.NET Core provides Prepend/Append, which merge the specified value to the beginning/end of the source sequence:

```csharp
public static IEnumerable<TSource> Prepend<TSource>(this IEnumerable<TSource> source, TSource element);

public static IEnumerable<TSource> Append<TSource>(this IEnumerable<TSource> source, TSource element);
```

For example:

```csharp
internal static void AppendPrepend()
{
    IEnumerable<int> prepend = Enumerable.Range(0, 5).Prepend(-1); // Define query.
    prepend.WriteLines(); // Execute query. -1 0 1 2 3 4

    IEnumerable<int> append = Enumerable.Range(0, 5).Append(-1); // Define query.
    append.WriteLines(); // Execute query. 0 1 2 3 4 -1
}
```

### Set

Distinct accepts a source sequence, and returns a [set](https://en.wikipedia.org/wiki/Set_\(mathematics\)), where duplicate values are removed:

```csharp
public static IEnumerable<TSource> Distinct<TSource>(this IEnumerable<TSource> source);
```

For example:

```csharp
internal static void Distinct()
{
    IEnumerable<int> first = First();
    IEnumerable<int> distinct = first.Distinct(); // Define query.
    distinct.WriteLines(); // Execute query. 1 2 3 4
}
```

The following query methods accepts 2 sequences and returns a set:

```csharp
public static IEnumerable<TSource> Union<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second);

public static IEnumerable<TSource> Intersect<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second);

public static IEnumerable<TSource> Except<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second);
```

In contrast to Concat, Union adds 2 sequences as if they are sets, and returns their [set union](https://en.wikipedia.org/wiki/Union_\(set_theory\)), which is equivalent to concatenating 2 sequences with duplicate values removed:

```csharp
internal static void Union()
{
    IEnumerable<int> first = First();
    IEnumerable<int> second = Second();
    IEnumerable<int> union = first.Union(second); // Define query.
    union.WriteLines(); // Execute query. 1 2 3 4 5 6
}
```

Intersect returns 2 sequences’ [set intersection](https://en.wikipedia.org/wiki/Intersection_\(set_theory\)), the distinct values that 2 sequences have in common:

```csharp
internal static void Intersect()
{
    IEnumerable<int> first = First();
    IEnumerable<int> second = Second();
    IEnumerable<int> intersect = first.Intersect(second); // Define query.
    intersect.WriteLines(); // Execute query. 3 4
}
```

Except returns the [set complement](https://en.wikipedia.org/wiki/Complement_\(set_theory\)) of 2 sequences, by subtracting the second sequence from the first one:

```csharp
internal static void Except()
{
    IEnumerable<int> first = First();
    IEnumerable<int> second = Second();
    IEnumerable<int> except = first.Except(second); // Define query.
    except.WriteLines(); // Execute query. 1 2
}
```

There are other overloads that accepts a comparer:

```csharp
public static IEnumerable<TSource> Distinct<TSource>(
    this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer);

public static IEnumerable<TSource> Union<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer);

public static IEnumerable<TSource> Intersect<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer);

public static IEnumerable<TSource> Except<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer);
```

For example:

```csharp
internal static void DistinctWithComparer()
{
    IEnumerable<string> source = new string[] { "aa", "AA", "Aa", "aA", "bb" };
    IEnumerable<string> distinctWithComparer = source.Distinct(StringComparer.OrdinalIgnoreCase); // Define query.
    distinctWithComparer.WriteLines(); // Execute query. aa bb
}
```

### Convolution

Zip is provided since .NET Framework 4.0. It accepts 2 sequences and returns their [convolution](https://en.wikipedia.org/wiki/Convolution_\(computer_science\)):

```csharp
public static IEnumerable<TResult> Zip<TFirst, TSecond, TResult>(
    this IEnumerable<TFirst> first, IEnumerable<TSecond> second, Func<TFirst, TSecond, TResult> resultSelector);
```

It calls result selector to map 2 values (each value from each sequence) to a result in the returned sequence:

```csharp
internal static void Zip()
{
    IEnumerable<int> first = First();
    IEnumerable<int> second = Second();
    IEnumerable<int> zip = first.Zip(second, (a, b) => a + b); // Define query.
    zip.WriteLines(); // Execute query. 4 6 8 10
}
```

When one input sequence has more values than the other, those values are ignored. Here the first sequence { 1, 2, 3, 4, 4 } and second sequence { 3, 4, 5, 6 } are zipped to a new sequence { 1 + 3, 2 + 4, 3 + 5, 4 + 6 }. The first sequence has one more value than the second, so its last value 4 is ignored.

### Partitioning

Partitioning query methods are straightforward. Skip/Take simply skips/takes the specified number of values in the source sequence:

```csharp
public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count);

public static IEnumerable<TSource> Take<TSource>(this IEnumerable<TSource> source, int count);
```

For example:

```csharp
internal static void SkipTake()
{
    IEnumerable<int> source = Enumerable.Range(0, 5);

    IEnumerable<int> partition1 = source.Skip(2); // Define query.
    partition1.WriteLines(); // Execute query. 2 3 4

    IEnumerable<int> partition2 = source.Take(2); // Define query.
    partition2.WriteLines(); // Execute query. 0 1
}
```

SkipWhile/TakeWhile accept a predicate function:

```csharp
public static IEnumerable<TSource> SkipWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate);

public static IEnumerable<TSource> TakeWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

SkipWhile/TakeWhile skips/takes values while predicate is called with each value and returns true. Once predicate is called with a value and returns false, SkipWhile/TakeWhile stop partitioning:

```csharp
internal static void TakeWhileSkipWhile()
{
    IEnumerable<int> source = new int[] { 1, 2, 3, -1, 4, 5 };

    IEnumerable<int> partition1 = source.TakeWhile(int32 => int32 > 0); // Define query.
    partition1.WriteLines(); // Execute query. 1 2 3

    IEnumerable<int> partition2 = source.SkipWhile(int32 => int32 > 0); // Define query.
    partition2.WriteLines(); // Execute query. -1 4 5
}
```

Just like Where and Select, SkipWhile/TakeWhile also have the indexed overload:

```csharp
public static IEnumerable<TSource> SkipWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);

public static IEnumerable<TSource> TakeWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, int, bool> predicate);
```

For example:

```csharp
internal static void TakeWhileSkipWhileWithIndex()
{
    IEnumerable<int> source = new int[] { 4, 3, 2, 1, 5 };

    IEnumerable<int> partition1 = source.TakeWhile((int32, index) => int32 >= index); // Define query.
    partition1.WriteLines();  // Execute query. 4 3 2

    IEnumerable<int> partition2 = source.SkipWhile((int32, index) => int32 >= index); // Define query.
    partition2.WriteLines();  // Execute query. 1 5
}
```

### Ordering

The ordering methods are OrderBy and OrderByDescending:

```csharp
IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)

IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)

IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)

IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)
```

The key selector specifies what should be compared to determine the order of values in the result sequence:

```csharp
internal static void OrderBy()
{
    IEnumerable<string> source = Words();
    IEnumerable<string> ordered = source.OrderBy(word => word); // Define query.
    ordered.WriteLines(); // Execute query. four one three Two Zero
    source.WriteLines(); // Original sequence. Zero one Two three four
}

internal static void OrderByDescending()
{
    IEnumerable<string> source = Words();
    IEnumerable<string> ordered = source.OrderByDescending(word => word); // Define query.
    ordered.WriteLines(); // Execute query. Zero Two three one four
    source.WriteLines(); // Original sequence. Zero one Two three four
}
```

Here each value from the source sequence uses itself as the key for ordering. Also, as demonstrated above, OrderBy returns a new sequence, so OrderBy/OrderByDescending does not impact the source sequence. The equivalent query expression has a orderby clause:

```csharp
internal static void OrderBy()
{
    IEnumerable<string> source = Words();
    IEnumerable<string> ordered = from word in source
                                  orderby word ascending // ascending can be omitted.
                                  select word;
}

internal static void OrderByDescending()
{
    IEnumerable<string> source = Words();
    IEnumerable<string> ordered = from word in source
                                  orderby word descending
                                  select word;
}
```

The comparer can be specified to provides the method to compare 2 keys:

```csharp
namespace System.Collections.Generic
{
    public interface IComparer<in T>
    {
        int Compare(T x, T y);
    }
}
```

Compare returns an integer to determine the 2 values’ relative position in the ordered sequence. If x is less than y, Compare returns negative int value; If x is equal to y, Compare returns 0; If x is greater than y, Compare returns positive int value. For example:

```csharp
internal static void OrderByWithComparer()
{
    IEnumerable<string> source = Words();
    IEnumerable<string> ordered = source.OrderBy(
        keySelector: word => word, comparer: StringComparer.Ordinal); // Define query.
    ordered.WriteLines(); // Execute query. Two Zero four one three
}
```

Here StringComparer.Ordinal provides a case-sensitive comparison. “Zero” comes to the first position of the result sequence, because upper case letter is less than lower case letter. This overload with comparer is not supported in query expression. When using the other overload without comparer, OrderBy/OrderByDescending uses System.Collections.Generic.Comparer<TKey>.Default. In the first OrderBy example, Comparer<string>.Default is used, which is equivalent to StringComparer.CurrentCulture.

As fore mentioned, ThenBy/ThenByDescending are extension methods of IOrderedEnumerable<T>, not IEnumerable<T>:

```csharp
IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
    this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector)

IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
    this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)

IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
    this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector)

IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
    this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector, IComparer<TKey> comparer)
```

So they can be composed right after OrderBy/OrderByDescending:

```csharp
internal static void ThenBy()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<Person> ordered = source // IEnumerable<Person>
        .OrderBy(person => person.PlaceOfBirth) // IOrderedEnumerable<Person>
        .ThenBy(person => person.Name); // IOrderedEnumerable<Person>
    ordered.WriteLines(person => $"{person.PlaceOfBirth}: {person.Name}"); // Execute query.
    // AU: Chris Hemsworth
    // UK: Paul Bettany
    // UK: Tom Hiddleston
    // US: Chris Evans
    // US: Robert Downey Jr.
}
```

In the above example, persons are ordered by place of birth. If there are Person objects with the same PlaceOfBirth, they are ordered by Name. The query expression can have multiple key selectors in the orderby clause:

```csharp
internal static void ThenBy()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<Person> ordered = from person in source
                                  orderby person.PlaceOfBirth, person.Name
                                  select person;
}
```

Notice OrderBy can also be called after calling OrderBy:

```csharp
internal static void OrderByAndOrderBy()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<Person> ordered = source
        .OrderBy(person => person.PlaceOfBirth)
        .OrderBy(person => person.Name); // Define query.
    ordered.WriteLines(person => $"{person.PlaceOfBirth}: {person.Name}"); // Execute query.
    // US: Chris Evans
    // AU: Chris Hemsworth
    // UK: Paul Bettany
    // US: Robert Downey Jr.
    // UK: Tom Hiddleston
}
```

OrderBy with OrderBy is totally different from OrderBy with ThenBy. Here persons are ordered by place of birth. Then, all persons are ordered again by name. The equivalent query expression is:

```csharp
internal static void OrderByOrderBy1()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<Person> ordered = from person in source
                                  orderby person.PlaceOfBirth

                                  orderby person.Name
                                  select person;
}
```

To makes it more intuitive, it can be separated to 2 query expressions:

```csharp
internal static void OrderByOrderBy2()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<Person> ordered1 = from person in source
                                   orderby person.PlaceOfBirth
                                   select person;
    IEnumerable<Person> ordered2 = from person in ordered1
                                   orderby person.Name
                                   select person;
}
```

Apparently, both orderby clauses work on the entire input sequence. As fore mentioned, the into query keyword is for this kind scenario of continuation:

```csharp
internal static void OrderByOrderBy3()
{
    IEnumerable<Person> source = Persons();
    IEnumerable<Person> ordered = from person in source
                                  orderby person.PlaceOfBirth
                                  select person into person
                                  orderby person.Name
                                  select person;
}
```

The compilation of the above 3 queries are identical.

Reverse simply reverses the positions of values:

```csharp
public static IEnumerable<TSource> Reverse<TSource>(this IEnumerable<TSource> source)
```

For example:

```csharp
internal static void Reverse()
{
    IEnumerable<int> source = Enumerable.Range(0, 5);
    IEnumerable<int> reversed = source.Reverse(); // Define query.
    reversed.WriteLines(); // Execute query. 4 3 2 1 0
}
```

### Conversion

Cast converts each value in source sequence to the specified type:

```csharp
public static IEnumerable<TResult> Cast<TResult>(this IEnumerable source);
```

Unlike other query methods, Cast is an extension method of non-generic sequence, so it can work with types implementing either IEnumerable or IEnumerable<T>. So it can enable LINQ query for legacy types. The following example calls Microsoft Team Foundation Service (TFS) client APIs to query work items, where Microsoft.TeamFoundation.WorkItemTracking.Client.WorkItemCollection is returned. WorkItemCollection is a collection of Microsoft.TeamFoundation.WorkItemTracking.Client.WorkItem, but it only implements IEnumerable, so it can be casted to a generic IEnumerable<WorkItem> safely, and further LINQ query can be applied. The following example execute a WIQL (Work Item Query Language of TFS) statement to query work items from TFS. Since WIQL does not support GROUP BY clause, the work items can be grouped locally with LINQ:

```sql
#if NETFX
internal static void CastNonGeneric(VssCredentials credentials)
{
    using (TfsTeamProjectCollection projectCollection = new TfsTeamProjectCollection(
        new Uri("https://dixin.visualstudio.com/DefaultCollection"), credentials))
    {
        // WorkItemCollection implements IEnumerable.
        const string Wiql = "SELECT * FROM WorkItems WHERE [Work Item Type] = 'Bug' AND State != 'Closed'"; // WIQL does not support GROUP BY.
        WorkItemStore workItemStore = (WorkItemStore)projectCollection.GetService(typeof(WorkItemStore));
        WorkItemCollection workItems = workItemStore.Query(Wiql);

        IEnumerable<WorkItem> genericWorkItems = workItems.Cast<WorkItem>(); // Define query.
        IEnumerable<IGrouping<string, WorkItem>> workItemGroups = genericWorkItems
            .GroupBy(workItem => workItem.CreatedBy); // Group work items locally.
        // ...
    }
}
#endif
```

The other non-generic sequences, like System.Resources.ResourceSet, System.Resources.ResourceReader, can be casted in the same way:

```csharp
internal static void CastMoreNonGeneric()
{
    // ResourceSet implements IEnumerable.
    ResourceSet resourceSet = new ResourceManager(typeof(Resources))
        .GetResourceSet(CultureInfo.CurrentCulture, createIfNotExists: true, tryParents: true);
    IEnumerable<DictionaryEntry> entries1 = resourceSet.Cast<DictionaryEntry>();

    // ResourceReader implements IEnumerable.
    Assembly assembly = typeof(QueryMethods).Assembly;
    using (Stream stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames()[0]))
    using (ResourceReader resourceReader = new ResourceReader(stream))
    {
        IEnumerable<DictionaryEntry> entries2 = resourceReader.Cast<DictionaryEntry>();
    }
}
```

In query expression syntax, just specify the type in from clause before the value name:

```sql
#if NETFX
internal static void CastNonGeneric(VssCredentials credentials)
{
    // WorkItemCollection implements IEnumerable.
    using (TfsTeamProjectCollection projectCollection = new TfsTeamProjectCollection(
        new Uri("https://dixin.visualstudio.com/DefaultCollection"), credentials))
    {
        const string Wiql = "SELECT * FROM WorkItems WHERE [Work Item Type] = 'Bug' AND State != 'Closed'"; // WIQL does not support GROUP BY.
        WorkItemStore workItemStore = (WorkItemStore)projectCollection.GetService(typeof(WorkItemStore));
        WorkItemCollection workItems = workItemStore.Query(Wiql);

        IEnumerable<IGrouping<string, WorkItem>> workItemGroups =
            from WorkItem workItem in workItems // Cast.
            group workItem by workItem.CreatedBy; // Group work items in local memory.
        // ...
    }
}
#endif

internal static void CastMoreNonGenericI()
{
    // ResourceSet implements IEnumerable.
    ResourceSet resourceSet = new ResourceManager(typeof(Resources))
        .GetResourceSet(CultureInfo.CurrentCulture, createIfNotExists: true, tryParents: true);
    IEnumerable<DictionaryEntry> entries1 =
        from DictionaryEntry entry in resourceSet // Cast.
        select entry;

    // ResourceReader implements IEnumerable.
    Assembly assembly = typeof(QueryMethods).Assembly;
    using (Stream stream = assembly.GetManifestResourceStream(assembly.GetManifestResourceNames()[0]))
    using (ResourceReader resourceReader = new ResourceReader(stream))
    {
        IEnumerable<DictionaryEntry> entries2 =
            from DictionaryEntry entry in resourceReader // Cast.
            select entry;
    }
}
```

And of course Cast can be used to generic IEnumerable<T>:

```csharp
internal static void CastGenericIEnumerable()
{
    IEnumerable<Base> source = new Base[] { new Derived(), new Derived() };
    IEnumerable<Derived> casted = source.Cast<Derived>(); // Define query.
    casted.WriteLines(result => result.GetType().Name); // Execute query. Derived Derived
}
```

And the query expression syntax is the same:

```csharp
internal static void CastGenericIEnumerable()
{
    IEnumerable<Base> source = new Base[] { new Derived(), new Derived() };
    IEnumerable<Derived> casted = from Derived derived in source
                                  select derived;
}
```

Cast must be used with caution, because type conversion can fail at runtime, for example:

```csharp
internal static void CastGenericIEnumerableWithException()
{
    IEnumerable<Base> source = new Base[] { new Derived(), new Base() };
    IEnumerable<Derived> casted = source.Cast<Derived>(); // Define query.
    casted.WriteLines(result => result.GetType().Name); // Execute query. Derived InvalidCastException
}
```

An InvalidCastException is thrown because the second value is of Base type, and cannot be casted to Derived.

The same query expression cast syntax can also be used in join clause:

```csharp
internal static void CastWithJoin()
{
    IEnumerable outer = new int[] { 1, 2, 3 };
    IEnumerable inner = new string[] { "a", "bb", "ccc" };
    IEnumerable<string> innerJoin = from int int32 in outer
                                    join string @string in inner on int32 equals @string.Length
                                    select $"{int32}: {@string}";
}
```

It is compiled to:

```csharp
internal static void CastWithJoin()
{
    IEnumerable outer = new int[] { 1, 2, 3 };
    IEnumerable inner = new string[] { string.Empty, "a", "bb", "ccc", "dddd" };
    IEnumerable<string> innerJoin = outer.Cast<int>().Join(
        inner: inner.Cast<string>(),
        outerKeySelector: int32 => int32,
        innerKeySelector: @string => @string.Length, // on int32 equal @string.Length
        resultSelector: (int32, @string) => $"{int32}:{@string}"); // Define query.
    innerJoin.WriteLines(); // Execute query. 1:a 2:bb 3:ccc
}
```

Cast looks similar to the fore mentioned OfType method, which also can have the result type specified. However, they are very different, OfType filters the values of the specified type. If there are values not of the specified type, they are simply ignored. There no conversion so there is no chance of InvalidCastException.

AsEnumerable is a query method doing nothing. It accepts a source sequence, then return the source sequence itself:

```csharp
public static IEnumerable<TSource> AsEnumerable<TSource>(this IEnumerable<TSource> source);
```

Its purpose is to make more derived type be visible only as IEnumerable<T>, and hide additional members of that more derived type:

```csharp
internal static void AsEnumerable()
{
    List<int> list = new List<int>();
    list.Add(0);
    IEnumerable<int> sequence = list.AsEnumerable(); // Add method is no longer available.
}
```

If the more derived source has method with the same signature as IEnumerable<T>’s extension method, after calling AsEnumerable, that IEnumerable<T> extension method is called:

```csharp
internal static void AsEnumerableReverse()
{
    List<int> list = new List<int>();
    list.Reverse(); // List<T>.Reverse.
    list
        .AsEnumerable() // IEnumerable<T>.
        .Reverse(); // Enumerable.Reverse.

    SortedSet<int> sortedSet = new SortedSet<int>();
    sortedSet.Reverse(); // SortedSet<T>.Reverse.
    sortedSet.AsEnumerable().Reverse(); // Enumerable.Reverse.

    ReadOnlyCollectionBuilder<int> readOnlyCollection = new ReadOnlyCollectionBuilder<int>();
    readOnlyCollection.Reverse(); // ReadOnlyCollectionBuilder<T>.Reverse.
    readOnlyCollection.AsEnumerable().Reverse(); // Enumerable.Reverse.

    IQueryable<int> queryable = new EnumerableQuery<int>(Enumerable.Empty<int>());
    queryable.Reverse(); // Queryable.Reverse.
    queryable.AsEnumerable().Reverse(); // Enumerable.Reverse.

    ImmutableList<int> immutableList = ImmutableList.Create(0);
    immutableList.Reverse(); // ImmutableSortedSet<T>.Reverse.
    immutableList.AsEnumerable().Reverse(); // Enumerable.Reverse.

    ImmutableSortedSet<int> immutableSortedSet = ImmutableSortedSet.Create(0);
    immutableSortedSet.Reverse(); // ImmutableSortedSet<T>.Reverse.
    immutableSortedSet.AsEnumerable().Reverse(); // Enumerable.Reverse.
}
```

AsEnumerable will be revisited when introducing IQueryable<T> in the LINQ to Entities chapter.

As fore mentioned, local parallel LINQ queries are represented by ParallelQuery<T> and remote LINQ queries are represented by IQueryable<T>. They both implement IEnumerable<T>, so they both have AsEnumerable available. Since AsEnumerable returns IEnumerable<T>, it opt-out local parallel query and remote query back to local sequential query. These scenarios are discussed in Parallel LINQ chapter and LINQ to Entities chapter.

## Collection queries

### Conversion

The collection query methods convert source sequence to a collection by pulling all the values from the source sequence. ToArray and ToList are straightforward:

```csharp
public static TSource[] ToArray<TSource>(this IEnumerable<TSource> source);

public static List<TSource> ToList<TSource>(this IEnumerable<TSource> source);
```

They pull all values from the source sequence, and simply store them into a new array/list:

```csharp
internal static void ToArrayToList()
{
    int[] array = Enumerable
        .Range(0, 5) // Define query, return IEnumerable<T>.
        .ToArray(); // Execute query.

    List<int> list = Enumerable
        .Range(0, 5) // Define query, return IEnumerable<T>.
        .ToList(); // Execute query.
}
```

Apparently, when collection query methods are called for an IEnumerable<T> sequence representing LINQ query, that LINQ query is executed immediately. Similarly, ToDictionary/ToLookup also pulls all values from source sequence, and store those values into a new dictionary/lookup:

```csharp
public static Dictionary<TKey, TSource> ToDictionary<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

public static ILookup<TKey, TSource> ToLookup<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

public static Dictionary<TKey, TElement> ToDictionary<TSource, TKey, TElement>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, Func<TSource, TElement> elementSelector);

public static ILookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, Func<TSource, TElement> elementSelector);
```

Here are the definition of dictionary and lookup:

```csharp
namespace System.Collections.Generic
{
    public class Dictionary<TKey, TValue> : IEnumerable<KeyValuePair<TKey, TValue>>, IEnumerable, 
        IDictionary<TKey, TValue>, IDictionary, ICollection<KeyValuePair<TKey, TValue>>, ICollection, 
        IReadOnlyDictionary<TKey, TValue>, IReadOnlyCollection<KeyValuePair<TKey, TValue>>, 
        ISerializable, IDeserializationCallback { }
}

namespace System.Linq
{
    public interface ILookup<TKey, TElement> : IEnumerable<IGrouping<TKey, TElement>>, IEnumerable
    {
        IEnumerable<TElement> this[TKey key] { get; }

        int Count { get; }

        bool Contains(TKey key);
    }
}
```

The difference between dictionary and lookup is, a dictionary is a flatten collection of key-value pairs, where each key is paired with one single value, and a lookup is a hierarchical collection of key-sequence pairs, where each key is a sequence of paired with one or more values.

```csharp
internal static void ToDictionaryToLookup()
{
    Dictionary<int, string> dictionary = Enumerable
        .Range(0, 5) // Define query.
        .ToDictionary(
            keySelector: int32 => int32,
            elementSelector: int32 => Math.Sqrt(int32).ToString("F", CultureInfo.InvariantCulture)); // Execute query.
    foreach (KeyValuePair<int, string> squareRoot in dictionary)
    {
        $"√{squareRoot.Key}:{squareRoot.Value}".WriteLine();
    }
    // √0: 0.00
    // √1: 1.00
    // √2: 1.41
    // √3: 1.73
    // √4: 2.00

    ILookup<int, int> lookup = Enumerable
        .Range(-2, 5) // Define query.
        .ToLookup(int32 => int32 * int32); // Execute query.
    foreach (IGrouping<int, int> squareRoots in lookup)
    {
        $"√{squareRoots.Key}: ".Write();
        foreach (int squareRoot in squareRoots)
        {
            $"{squareRoot}, ".Write();
        }
        Environment.NewLine.Write();
    }
    // √4: -2, 2,
    // √1: -1, 1,
    // √0: 0,
}
```

Each value from source sequence is mapped to a key by calling the key selector function. If element selector is provided, each value from source sequence is mapped to a value in the result dictionary/lookup. In above example, if ToDictionary is called in the second query, an ArgumentException is thrown because dictionary cannot have multiple key and single value pairs with the same key:

```csharp
internal static void ToDictionaryWithException()
{
    Dictionary<int, int> lookup = Enumerable
        .Range(-2, 5) // Define query.
        .ToDictionary(int32 => int32 * int32); // Execute query.
    // ArgumentException: An item with the same key has already been added.
}
```

Another difference between dictionary and lookup is, at runtime, if querying a dictionary with a non-existing key, dictionary throws KeyNotFoundException, but if querying a lookup with a non-existing key, lookup returns a empty sequence peacefully.

```csharp
internal static void LookupDictionary()
{
    ILookup<int, int> lookup = Enumerable
        .Range(0, 5) // Define query.
        .ToLookup(int32 => int32); // Execute query.
    int count = 0;
    IEnumerable<int> group = lookup[10];
    foreach (int value in group)
    {
        count++;
    }
    count.WriteLine(); // 0

    Dictionary<int, int> dictionary = Enumerable
        .Range(0, 5) // Define query.
        .ToDictionary(int32 => int32); // Execute query.
    int result = dictionary[10];
    // KeyNotFoundException: The given key was not present in the dictionary.
}
```

The last difference is dictionary cannot have null key, while lookup can:

```csharp
internal static void LookupDictionaryNullKey()
{
    ILookup<string, string> lookup = new string[] { "a", "b", null }.ToLookup(@string => @string);
    int count = 0;
    IEnumerable<string> group = lookup[null];
    foreach (string value in group)
    {
        count++;
    }
    count.WriteLine(); // 1

    Dictionary<string, string> dictionary = new string[] { "a", "b", null }
        .ToDictionary(@string => @string);
    // ArgumentNullException: Value cannot be null. Parameter name: key.
}
```

ToDictionary/ToLookup has other overloads to accept a key comparer:

```csharp
public static Dictionary<TKey, TSource> ToDictionary<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IEqualityComparer<TKey> comparer);

public static ILookup<TKey, TSource> ToLookup<TSource, TKey>(
    this IEnumerable<TSource> source, Func<TSource, TKey> keySelector, IEqualityComparer<TKey> comparer);

public static Dictionary<TKey, TElement> ToDictionary<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    IEqualityComparer<TKey> comparer);

public static ILookup<TKey, TElement> ToLookup<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    IEqualityComparer<TKey> comparer);
```

For example:

```csharp
internal static void ToLookupWithComparer()
{
    ILookup<string, string> lookup = new string[] { "aa", "AA", "Aa", "aA", "bb" }
        .ToLookup(@string => @string, StringComparer.OrdinalIgnoreCase);
    foreach (IGrouping<string, string> group in lookup)
    {
        $"{group.Key}: ".Write();
        foreach (string @string in group)
        {
            $"{@string}, ".Write();
        }
        Environment.NewLine.Write();
        // aa: aa, AA, Aa, aA,
        // bb: bb,
    }
}
```

## Value queries

### Element

Element query methods returns a single value from the source sequence. When they are called, they immediately execute the query, trying to pull values until the expected value is pulled. First/Last immediately pulls the first/last value of the source sequence.

```csharp
public static TSource First<TSource>(this IEnumerable<TSource> source);

public static TSource Last<TSource>(this IEnumerable<TSource> source);
```

And InvalidOperationException is thrown if the source sequence is empty.

```csharp
internal static IEnumerable<int> Int32Source() => new int[] { -1, 1, 2, 3, -4 };

internal static IEnumerable<int> SingleInt32Source() => Enumerable.Repeat(5, 1);

internal static IEnumerable<int> EmptyInt32Source() => Enumerable.Empty<int>();

internal static void FirstLast()
{
    int firstOfSource = Int32Source().First().WriteLine(); // -1
    int lastOfSource = Int32Source().Last().WriteLine(); // -4

    int firstOfSingleSOurce = SingleInt32Source().First().WriteLine(); // 5
    int lastOfSingleSOurce = SingleInt32Source().Last().WriteLine(); // 5

    int firstOfEmptySOurce = EmptyInt32Source().First(); // InvalidOperationException.
    int lastOfEmptySOurce = EmptyInt32Source().Last(); // InvalidOperationException.
}
```

The other First/Last overload accept a predicate function. They immediately call the predicate function immediately with the values, and return the first/last value where predicate function returns true:

```csharp
public static TSource First<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);

public static TSource Last<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

Logically, source.First(predicate) is equivalent to source.Where(predicate).First(), and source.Last(predicate) is equivalent to source.Where(predicate).Last():

```csharp
internal static void FirstLastWithPredicate()
{
    int firstPositiveOfSource = Int32Source().First(int32 => int32 > 0).WriteLine(); // 1
    int lastNegativeOfSource = Int32Source().Last(int32 => int32 < 0).WriteLine(); // -4

    int firstPositiveOfSingleSOurce = SingleInt32Source().First(int32 => int32 > 0).WriteLine(); // 1
    int lastNegativeOfSingleSOurce = SingleInt32Source().Last(int32 => int32 < 0); // InvalidOperationException.

    int firstPositiveOfEmptySOurce = EmptyInt32Source().First(int32 => int32 > 0); // InvalidOperationException.
    int lastNegativeOfEmptySOurce = EmptyInt32Source().Last(int32 => int32 < 0); // InvalidOperationException.
}
```

There are also FirstOrDefault/LastOrDefault methods:

```csharp
public static TSource FirstOrDefault<TSource>(this IEnumerable<TSource> source);

public static TSource FirstOrDefault<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);

public static TSource LastOrDefault<TSource>(this IEnumerable<TSource> source);

public static TSource LastOrDefault<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

When there is no first/last value available, these methods return a default value instead of throwing exception:

```csharp
internal static void FirstOrDefaultLastOrDefault()
{
    int firstOrDefaultOfEmptySOurce = EmptyInt32Source().FirstOrDefault().WriteLine(); // 0
    int lastOrDefaultOfEmptySOurce = EmptyInt32Source().LastOrDefault().WriteLine(); // 0

    int lastNegativeOrDefaultOfSingleSOurce = SingleInt32Source().LastOrDefault(int32 => int32 < 0).WriteLine(); // 0

    int firstPositiveOrDefaultOfEmptySOurce = EmptyInt32Source().FirstOrDefault(int32 => int32 > 0).WriteLine(); // 0
    int lastNegativeOrDefaultOfEmptySOurce = EmptyInt32Source().LastOrDefault(int32 => int32 < 0).WriteLine(); // 0

    Character lokiOrDefault = Characters()
        .FirstOrDefault(character => "Loki".Equals(character.Name, StringComparison.Ordinal));
    (lokiOrDefault == null).WriteLine(); // True
}
```

ElementAt returns the value at the specified index:

```csharp
public static TSource ElementAt<TSource>(this IEnumerable<TSource> source, int index);
```

When the specified index is out of range, ArgumentOutOfRangeException is thrown.

```csharp
internal static void ElementAt()
{
    int elementAt2OfSource = Int32Source().ElementAt(2).WriteLine(); // 2
    int elementAt9OfSource = Int32Source().ElementAt(9); // ArgumentOutOfRangeException.
    int elementAtNegativeIndex = Int32Source().ElementAt(-5); // ArgumentOutOfRangeException.

    int elementAt0OfSingleSource = SingleInt32Source().ElementAt(0).WriteLine(); // 5
    int elementAt1OfSingleSource = SingleInt32Source().ElementAt(1); // ArgumentOutOfRangeException.

    int elementAt0OfEmptySource = EmptyInt32Source().ElementAt(0); // ArgumentOutOfRangeException.
}
```

Similarly, there is ElementAtOrDefault:

```csharp
public static TSource ElementAtOrDefault<TSource>(this IEnumerable<TSource> source, int index);
```

When there is no value available at the specified index, a default value is returned:

```csharp
internal static void ElementAtOrDefault()
{
    int elementAt9OrDefaultOfSource = Int32Source().ElementAtOrDefault(9).WriteLine(); // 0
    int elementAtNegativeIndexOrDefault = Int32Source().ElementAtOrDefault(-5).WriteLine(); // 0

    int elementAt1OrDefaultOfSingleSource = SingleInt32Source().ElementAtOrDefault(1).WriteLine(); // 0

    int elementAt0OrDefaultOfEmptySource = EmptyInt32Source().ElementAtOrDefault(0).WriteLine(); // 0

    Character characterAt5OrDefault = Characters().ElementAtOrDefault(5);
    (characterAt5OrDefault == null).WriteLine(); // True
}
```

Single is more strict. It pulls the single value from a singleton sequence.

```csharp
public static TSource Single<TSource>(this IEnumerable<TSource> source);

public static TSource Single<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

If source sequence has no value or has more than one values, InvalidOperationException is thrown:

```csharp
internal static void Single()
{
    int singleOfSource = Int32Source().Single(); // InvalidOperationException.
    int singleGreaterThan2OfSource = Int32Source().Single(int32 => int32 > 2).WriteLine(); // 3
    int singleNegativeOfSource = Int32Source().Single(int32 => int32 < 0); // InvalidOperationException.

    int singleOfSingleSource = SingleInt32Source().Single().WriteLine(); // 5
    int singleNegativeOfSingleSource = SingleInt32Source().Single(int32 => int32 < 0); // InvalidOperationException.

    int singleOfEmptySource = EmptyInt32Source().Single(); // InvalidOperationException.
    int singlePositiveOfEmptySource = EmptyInt32Source().Single(int32 => int32 == 0);  // InvalidOperationException.

    Character singleCharacter = Characters().Single(); // InvalidOperationException.
    Character fromAsgard = Characters()
        .Single(character => "Asgard".Equals(character.PlaceOfBirth, StringComparison.Ordinal))
        .WriteLine();  // Thor

    Character loki = Characters().Single(
        character => "Loki".Equals(character.Name, StringComparison.Ordinal)); // InvalidOperationException.
}
```

SingleOrDefault is just slightly less strict than Single:

```csharp
public static TSource SingleOrDefault<TSource>(this IEnumerable<TSource> source);

public static TSource SingleOrDefault<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

When source sequence has no value, it returns a default value. When source sequence has more than one values, it still throws InvalidOperationException:

```csharp
internal static void SingleOrDefault()
{
    int singleOrDefaultOfSource = Int32Source().SingleOrDefault(); // InvalidOperationException.
    int singleNegativeOrDefaultOfSource = Int32Source().SingleOrDefault(int32 => int32 < 0); // InvalidOperationException.

    int singleNegativeOrDefaultOfSingleSource = SingleInt32Source().SingleOrDefault(int32 => int32 < 0).WriteLine(); // 0

    int singleOrDefaultOfEmptySource = EmptyInt32Source().SingleOrDefault().WriteLine(); // 0
    int singlePositiveOrDefaultOfEmptySource = EmptyInt32Source().SingleOrDefault(int32 => int32 == 0); // 0

    Character singleCharacterOrDefault = Characters().SingleOrDefault(); // InvalidOperationException.
    Character lokiOrDefault = Characters()
        .SingleOrDefault(character => "Loki".Equals(character.Name, StringComparison.Ordinal));
    (lokiOrDefault == null).WriteLine(); // True
}
```

### Aggregation

Aggregate query methods pull all values from source sequence, and repeatedly call a function to accumulate those value. The easiest overload accepts a accumulator function:

```csharp
public static TSource Aggregate<TSource>(this IEnumerable<TSource> source, Func<TSource, TSource, TSource> func);
```

Aggregate requires the source sequence to be not empty. When the source sequence is empty, it throws InvalidOperationException. When there is only 1 single value in he source sequence, it returns that value. When there are more than 1 values, it calls the accumulator function to accumulate the first and second values to a result, and then call the accumulator function again to accumulate the previous result and the the third value to another result, and so on, until all values are accumulated, eventually it returns the result of the last accumulator function call.

```csharp
internal static void Aggregate()
{
    int productOfSource = Int32Source()
        .Aggregate((currentProduct, int32) => currentProduct * int32)
        .WriteLine(); // ((((-1 * 1) * 2) * 3) * -4) = 24.
    int productOfSingleSource = SingleInt32Source()
        .Aggregate((currentProduct, int32) => currentProduct * int32).WriteLine(); // 5
    int productOfEmptySource = EmptyInt32Source()
        .Aggregate((currentProduct, int32) => currentProduct * int32); // InvalidOperationException.
}
```

There is another overload accepts a seed:

```csharp
public static TAccumulate Aggregate<TSource, TAccumulate>(this IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func);
```

With the seed provided, Aggregate does not require the source sequence to be not empty. When the source sequence is empty, it returns the seed. When the source sequence is not empty, it calls the accumulator function to accumulate the seed value and the first values to a result, and then call the accumulator function again to accumulate the previous result and the second to another result, and so on, until all values are accumulated, eventually it also returns the result of the last accumulator function call.

```csharp
internal static void AggregateWithSeed()
{
    int sumOfSquaresOfSource = Int32Source()
        .Aggregate(
            seed: 0,
            func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32)
        .WriteLine(); // 31
    int sumOfSquaresOfSingleSource = SingleInt32Source()
        .Aggregate(
            seed: 0,
            func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32)
        .WriteLine(); // 25
    int sumOfSquaresOfEmptySource = EmptyInt32Source()
        .Aggregate(
            seed: 0,
            func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32)
        .WriteLine(); // 0
}
```

The last overload accepts an additional result selector function, which is called with the last result of accumulate function:

```csharp
internal static TResult Aggregate<TSource, TAccumulate, TResult>(
    this IEnumerable<TSource> source, 
    TAccumulate seed, 
    Func<TAccumulate, TSource, TAccumulate> func, Func<TAccumulate, TResult> resultSelector);
```

So source.Aggregate(seed, accumulation, resultSelector) is equivalent to resultSelector(source.Aggregate(seed, accumulation)):

```csharp
internal static void AggregateWithSeedAndResultSelector()
{
    string sumOfSquaresMessage = Int32Source()
        .Aggregate(
            seed: 0,
            func: (currentSumOfSquares, int32) => currentSumOfSquares + int32 * int32,
            resultSelector: result => $"Sum of squares: {result}")
        .WriteLine(); // Sum of squares: 31
}
```

Count returns the number of values in source sequence:

```csharp
public static int Count<TSource>(this IEnumerable<TSource> source);
```

It is one of the most intuitive query methods:

```csharp
internal static void Count()
{
    int countOfSource = Int32Source().Count().WriteLine(); // 5
    int countOfSingleSource = SingleInt32Source().Count().WriteLine(); // 1
    int countOfEmptySource = EmptyInt32Source().Count().WriteLine(); // 0
    int countOfCharacters = Characters().Count().WriteLine(); // 5
    int countOfTypesInCoreLibrary = CoreLibrary.GetExportedTypes().Count().WriteLine(); // 1523
}
```

The other overload accepts a predicate:

```csharp
public static int Count<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

Similar to First/Last, source.Count(predicate) is equivalent to ource.Where(predicate).Count():

```csharp
internal static void CountWithPredicate()
{
    int positiveCountOfSource = Int32Source().Count(int32 => int32 > 0).WriteLine(); // 3
    int positiveCountOfSingleSource = SingleInt32Source().Count(int32 => int32 > 0).WriteLine(); // 1
    int positiveCountOfEmptySource = EmptyInt32Source().Count(int32 => int32 > 0).WriteLine(); // 0
    int countOfConcat = Enumerable
        .Repeat(0, int.MaxValue)
        .Concat(Enumerable.Repeat(0, int.MaxValue))
        .Count(); // OverflowException.
    int countOfCharactersFromUS = Characters()
        .Count(character => "US".Equals(character.PlaceOfBirth))
        .WriteLine(); // 3
}
```

LongCount is similar to Count. It can be used for large sequence, and returns a long (System.Int64) value instead of int (System.Int32):

```csharp
public static long LongCount<TSource>(this IEnumerable<TSource> source);

public static long LongCount<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

For example:

```csharp
internal static void LongCount()
{
    long longCountOfSource = Int32Source().LongCount().WriteLine(); // 5L
    long countOfConcat = Enumerable
        .Repeat(0, int.MaxValue)
        .Concat(Enumerable.Repeat(0, int.MaxValue))
        .LongCount()
        .WriteLine(); // int.MaxValue + int.MaxValue = 4294967294L
}
```

Max/Min also pulls all values from the source sequence of int values, and returns the minimum/maximum value:

```csharp
public static int Max(this IEnumerable<int> source);

public static int Min(this IEnumerable<int> source);
```

Max/Min throw InvalidOperationException if the source sequence is empty:

```csharp
internal static void MinMax()
{
    int minOfSource = Int32Source().Min().WriteLine(); // -4
    int maxOfSource = Int32Source().Max().WriteLine(); // 3

    int minOfSingleSource = SingleInt32Source().Min().WriteLine(); // 5
    int maxOfSingleSource = SingleInt32Source().Max().WriteLine(); // 5

    int minOfEmptySource = EmptyInt32Source().Min(); // InvalidOperationException.
    int maxOfEmptySource = EmptyInt32Source().Max(); // InvalidOperationException.
}
```

The other overload accepts a sequence of arbitrary type, and a selector function which maps each value to a int value for comparison:

```csharp
public static int Max<TSource>(this IEnumerable<TSource> source, Func<TSource, int> selector);

public static int Min<TSource>(this IEnumerable<TSource> source, Func<TSource, int> selector);
```

The following example queries the maximum type (type with the largest number of public members declared) in the .NET core library:

```csharp
internal static void MaxWithSelector()
{
    int mostDeclaredMembers = CoreLibrary.GetExportedTypes()
        .Max(type => type.GetDeclaredMembers().Length).WriteLine(); // 311
}
```

Here each public type is mapped the count of its public members’ count number. The maximum type in .NET core library has 311 public members. Here Max returns the maximum count of members, but does not tell which type is that count from. To query the maximum type along with the the member count, Aggregate can be used to pull all types and accumulate by the maximum member count:

```csharp
internal static void AggregateWithAnonymousTypeSeed()
{
    (List<Type> Types, int MaxMemberCount) maxTypes = CoreLibrary.GetExportedTypes().Aggregate(
        seed: (Types: new List<Type>(), MaxMemberCount: 0),
        func: (currentMax, type) =>
        {
            List<Type> currentMaxTypes = currentMax.Types;
            int currentMaxMemberCount = currentMax.MaxMemberCount;
            int memberCount = type.GetDeclaredMembers().Length;
            if (memberCount > currentMaxMemberCount)
            {
                currentMaxTypes.Clear();
                currentMaxTypes.Add(type);
                currentMaxMemberCount = memberCount;
            }
            else if (memberCount == currentMaxMemberCount)
            {
                // If multiple types have the same maximum member count, take all those types.
                currentMaxTypes.Add(type);
            }
            return (Types: currentMaxTypes, MaxMemberCount: currentMaxMemberCount);
        }); // Define query.
    maxTypes.Types.WriteLines(maxType => $"{maxType.FullName}:{maxTypes.MaxMemberCount}"); 
    // Execute query. System.Convert:311
}
```

In the core library, System.Convert is the winner, with 311 public members declared.

Besides int, Max/Min has overloads for int?, long, long?, double, double?, float, float?, decimal, decimal?. There are also overloads for arbitrary comparable type:

```csharp
public static TSource Max<TSource>(this IEnumerable<TSource> source);

public static TSource Min<TSource>(this IEnumerable<TSource> source);
```

They use Comparer<TSource>.Default to compare values in source sequence to determine the minimum/maximum value. Comparer<TSource>.Default requires TSource to implement at least one of IComparable and IComparable<TSource>; otherwise ArgumentException is thrown at runtime. Still take Character type as example:

```csharp
internal partial class Character : IComparable<Character>
{
    public int CompareTo(Character other) =>
        string.Compare(this.Name, other.Name, StringComparison.Ordinal);
}
```

Now Max/Min can be used with character sequence:

```csharp
internal static void MaxMinGeneric()
{
    Character maxCharacter = Characters().Max().WriteLine(); // Vision
    Character minCharacter = Characters().Min().WriteLine(); // JAVIS
}
```

Max/Min also have overload for arbitrary type, with a selector function to maps each value to a comparable result:

```csharp
public static TResult Max<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector);

public static TResult Min<TSource, TResult>(this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```

For example:

```csharp
internal static void MaxMinGenericWithSelector()
{
    string maxName = Characters().Max(character => character.Name).WriteLine(); // Vision
    string minName = Characters().Min(character => character.Name).WriteLine(); // JAVIS
}
```

Apparently, source.Max(selector) is equivalent to source.Select(selector),Max, and source.Min(selector) is equivalent to source.Select(selector).Min().

Sum/Average pulls all int values from the source sequence, and calculate the sum/average of all the values. The signatures are similar to Max/Min:

```csharp
public static int Sum(this IEnumerable<int> source);

public static double Average(this IEnumerable<int> source);
```

Here Average returns double instead of int. Also, when called with empty source sequence, Sum returns 0, while Average throws InvalidOperationException:

```csharp
internal static void SumAverage()
{
    int sumOfSource = Int32Source().Sum().WriteLine(); // 1
    double averageOfSource = Int32Source().Average().WriteLine(); // 0.2

    int sumOfSingleSource = SingleInt32Source().Sum().WriteLine(); // 5
    double averageOfSingleSource = SingleInt32Source().Average().WriteLine(); // 5.0

    int sumOfEmptySource = EmptyInt32Source().Sum().WriteLine(); // 0
    double averageOfEmptySource = EmptyInt32Source().Average().WriteLine(); // InvalidOperationException.
}
```

Sum/Average has overload for arbitrary type, with a selector function to map each value to int value for calculation:

```csharp
public static int Sum<TSource>(this IEnumerable<TSource> source, Func<TSource, int> selector);

public static double Average<TSource>(this IEnumerable<TSource> source, Func<TSource, int> selector);
```

The following example calculate the average count of public members declared on types in the core library, and the average count of all public members.

```csharp
internal static void AverageWithSelector()
{
    double averageMemberCount = CoreLibrary.GetExportedTypes()
        .Average(type => type.GetMembers().Length)
        .WriteLine(); // 22.0766378244747
    double averageDeclaredMemberCount = CoreLibrary.GetExportedTypes()
        .Average(type => type.GetDeclaredMembers().Length)
        .WriteLine(); // 11.7527812113721
}
```

Similarly, Sum/Average also has overloads for int?, long, long?, double, double?, float, float?, decimal, decimal?.

### Quantifier

Any determines whether the source sequence is not empty, by immediately trying to pull the first value from source sequence:

```csharp
public static bool Any<TSource>(this IEnumerable<TSource> source);
```

For example.

```csharp
internal static void Any()
{
    bool anyInSource = Int32Source().Any().WriteLine(); // True
    bool anyInSingleSource = SingleInt32Source().Any().WriteLine(); // True
    bool anyInEmptySource = EmptyInt32Source().Any().WriteLine(); // False
}
```

The other overload accepts a predicate function.

```csharp
public static bool Any<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

Logically, source.Any(predicate) is equivalent to source.Where(predicate).Any().

```csharp
internal static void AnyWithPredicate()
{
    bool anyNegative = Int32Source().Any(int32 => int32 < 0).WriteLine(); // True
    bool anyPositive = SingleInt32Source().Any(int32 => int32 > 0).WriteLine(); // True
    bool any0 = EmptyInt32Source().Any(_ => true).WriteLine(); // False
}
```

All accepts a predicate. It also tries to pull values from the source sequence, and calls predicate function with each value. It returns true if predicate returns true for all values; otherwise, it returns false:

```csharp
public static bool All<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

All always returns true for empty source.

```csharp
internal static void All()
{
    bool allNegative = Int32Source().All(int32 => int32 < 0).WriteLine(); // False
    bool allPositive = SingleInt32Source().All(int32 => int32 > 0).WriteLine(); // True
    bool allGreaterThanMax = EmptyInt32Source().All(int32 => int32 > int.MaxValue).WriteLine(); // True
}
```

Contains determines whether source sequence contains the specified value:

```csharp
public static bool Contains<TSource>(this IEnumerable<TSource> source, TSource value);
```

For example:

```csharp
internal static void Contains()
{
    bool contains5InSource = Int32Source().Contains(5).WriteLine(); // False
    bool contains5InSingleSource = SingleInt32Source().Contains(5).WriteLine(); // True
    bool contains5InEmptySource = EmptyInt32Source().Contains(5).WriteLine(); // False
}
```

The other overload of Contains accepts a comparer:

```csharp
public static bool Contains<TSource>(
    this IEnumerable<TSource> source, TSource value, IEqualityComparer<TSource> comparer);
```

For example:

```csharp
internal static void ContainsWithComparer()
{
    bool containsTwo = Words().Contains("two", StringComparer.Ordinal).WriteLine(); // False
    bool containsTwoIgnoreCase = Words().Contains("two", StringComparer.OrdinalIgnoreCase).WriteLine(); // True
}
```

Similar to other query methods, the first overload without comparer uses EqualityComparer<TSource>.Default.

### Equality

.NET has many ways to determine equality for objects:

-   [Reference equality](https://msdn.microsoft.com/en-us/library/dd183759.aspx)/identity: object.ReferenceEquals, == operator without override
-   [Value equality](https://msdn.microsoft.com/en-us/library/dd183755.aspx)/equivalence: static object.Equals, instance object.Equals, object.GetHashCode, overridden == operator, IEquatable<T>.Equals, IEqualityComparer.Equals, IEqualityComparer<T>.Equals, IComparable.Compare, IComparable<T>.Compare, IComparer.Compare, IComparer<T>.Compare
-   Sequential equality: Enumerable.SequentialEqual

SequentialEqual query method is provided to compares the sequential equality of 2 IEnumerable<T> sequences:

```csharp
public static bool SequenceEqual<TSource>(this IEnumerable<TSource> first, IEnumerable<TSource> second);
```

2 sequences are sequentially equal if their length are equal, and for each index, 2 values from both sequences are equal (determined by EqualityComparer<TSource>.Default).

```csharp
internal static void SequentialEqual()
{
    IEnumerable<object> first = new object[] { null, 1, "2", CoreLibrary };
    IEnumerable<object> second = new List<object>() { null, 1, $"{1 + 1}", CoreLibrary };
    bool valueEqual = first.Equals(second).WriteLine(); // False
    bool referenceEqual = object.ReferenceEquals(first, second).WriteLine(); // False
    bool sequentialEqual = first.SequenceEqual(second.Concat(Enumerable.Empty<object>())).WriteLine(); // True
}
```

Empty sequences with the same TSource type are sequentially equal:

```csharp
internal static void SequentialEqualOfEmpty()
{
    IEnumerable<Derived> emptyfirst = new ConcurrentQueue<Derived>();
    IEnumerable<Base> emptysecond = ImmutableHashSet.Create<Base>();
    bool sequentialEqual = emptyfirst.SequenceEqual(emptysecond).WriteLine(); // True
}
```

The other overload accepts a comparer:

```csharp
public static bool SequenceEqual<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer);
```

For example:

```csharp
internal static void SequentialEqualWithComparer()
{
    IEnumerable<string> first = new string[] { null, string.Empty, "ss", };
    IEnumerable<string> second = new string[] { null, string.Empty, "ß", };
    CultureInfo.CurrentCulture = new CultureInfo("en-US");
    bool sequentialEqual1 = first.SequenceEqual(second, StringComparer.CurrentCulture).WriteLine(); // True
    bool sequentialEqual2 = first.SequenceEqual(second, StringComparer.Ordinal).WriteLine(); // False
}
```

Again, the first overload without comparer uses EqualityComparer<TSource>.Default.

## Queries in other languages

The following table compares similar APIs/language features of

-   LINQ to Objects query methods in [System.Linq.Enumerable](https://msdn.microsoft.com/en-us/library/system.linq.enumerable.aspx)
-   C# [query keywords](https://msdn.microsoft.com/en-us/library/bb310804.aspx)
-   F# [Seq Module](https://msdn.microsoft.com/en-us/library/ee353635.aspx) and [QueryBuilder](https://github.com/fsharp/fsharp/blob/master/src/fsharp/FSharp.Core/Query.fsi)
-   Haskell [Data.List](https://www.haskell.org/hugs/pages/libraries/base/Data-List.html)
-   JavaScript [Array.prototype](https://msdn.microsoft.com/en-us/LIBRary/k4h76zbx.aspx)

Please notice JavaScript methods are not deferred.

<table border="0" cellpadding="0" cellspacing="0" width="922"><tbody><tr><td valign="top" width="135">Enumerable</td><td valign="top" width="165">C#</td><td valign="top" width="150">F# Seq</td><td valign="top" width="183">F# query builder</td><td valign="top" width="179">Haskell</td><td valign="top" width="108">JavaScript</td></tr><tr><td valign="top" width="135">Aggregate</td><td valign="top" width="165"></td><td valign="top" width="150">fold, reduce</td><td valign="top" width="183"></td><td valign="top" width="179">foldl</td><td valign="top" width="108">reduce</td></tr><tr><td valign="top" width="135"></td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179">foldr</td><td valign="top" width="108">reduceRight</td></tr><tr><td valign="top" width="135">All</td><td valign="top" width="165"></td><td valign="top" width="150">forAll</td><td valign="top" width="183">all</td><td valign="top" width="179">all</td><td valign="top" width="108">every</td></tr><tr><td valign="top" width="135">Any</td><td valign="top" width="165"></td><td valign="top" width="150">exists</td><td valign="top" width="183">exists</td><td valign="top" width="179">null, any</td><td valign="top" width="108">some</td></tr><tr><td valign="top" width="135">Average</td><td valign="top" width="165"></td><td valign="top" width="150">average, averageBy</td><td valign="top" width="183">averageBy</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Cast</td><td valign="top" width="165">from/join T … in …</td><td valign="top" width="150">cast</td><td valign="top" width="183"></td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Concat</td><td valign="top" width="165"></td><td valign="top" width="150">append</td><td valign="top" width="183"></td><td valign="top" width="179">++</td><td valign="top" width="108">concat</td></tr><tr><td valign="top" width="135">Contains</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183">contains</td><td valign="top" width="179">elem</td><td valign="top" width="108">includes</td></tr><tr><td valign="top" width="135">Count</td><td valign="top" width="165"></td><td valign="top" width="150">length</td><td valign="top" width="183">count</td><td valign="top" width="179">length</td><td valign="top" width="108">length</td></tr><tr><td valign="top" width="135">Distinct</td><td valign="top" width="165"></td><td valign="top" width="150">dictinct, dictinctBy</td><td valign="top" width="183">distinct</td><td valign="top" width="179">nub, nubBy</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">ElementAt</td><td valign="top" width="165"></td><td valign="top" width="150">nth</td><td valign="top" width="183">nth</td><td valign="top" width="179">!!</td><td valign="top" width="108">[]</td></tr><tr><td valign="top" width="135">Empty</td><td valign="top" width="165"></td><td valign="top" width="150">empty</td><td valign="top" width="183"></td><td valign="top" width="179">[]</td><td valign="top" width="108">[]</td></tr><tr><td valign="top" width="135">Except</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179">\\</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">First</td><td valign="top" width="165"></td><td valign="top" width="150">find, head, pick</td><td valign="top" width="183">find, head</td><td valign="top" width="179">head</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">FirstOrDefault</td><td valign="top" width="165"></td><td valign="top" width="150">tryFind, tryPick</td><td valign="top" width="183">headOrDefault</td><td valign="top" width="179">find</td><td valign="top" width="108">find</td></tr><tr><td valign="top" width="135">GroupBy</td><td valign="top" width="165">group … by</td><td valign="top" width="150">groupBy</td><td valign="top" width="183">groupBy, groupValBy</td><td valign="top" width="179">groupBy</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">GroupJoin</td><td valign="top" width="165">join … into</td><td valign="top" width="150"></td><td valign="top" width="183">groupJoin, leftOuterJoin</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Intersect</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179">intersect, intersectBy</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Join</td><td valign="top" width="165">join</td><td valign="top" width="150"></td><td valign="top" width="183">join</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Last</td><td valign="top" width="165"></td><td valign="top" width="150">last</td><td valign="top" width="183">last</td><td valign="top" width="179">last</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">LastOrDefault</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183">lastOrDefault</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Max</td><td valign="top" width="165"></td><td valign="top" width="150">max, maxBy</td><td valign="top" width="183">maxBy</td><td valign="top" width="179">maximum, maximumBy</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Min</td><td valign="top" width="165"></td><td valign="top" width="150">min, minBy</td><td valign="top" width="183">minBy</td><td valign="top" width="179">minimum, minimumBy</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">OrderBy</td><td valign="top" width="165">orderby … (ascending)</td><td valign="top" width="150">sort, sortBy</td><td valign="top" width="183">sortBy</td><td valign="top" width="179">sort, sortOn, sortBy</td><td valign="top" width="108">sort</td></tr><tr><td valign="top" width="135">OrferByDescending</td><td valign="top" width="165">orderby … descending</td><td valign="top" width="150"></td><td valign="top" width="183">sortByDescending</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Range</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183">..</td><td valign="top" width="179">…</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Repeat</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179">replicate</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Reverse</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179">reverse</td><td valign="top" width="108">reverse</td></tr><tr><td valign="top" width="135">Select</td><td valign="top" width="165">from … select, let</td><td valign="top" width="150">map</td><td valign="top" width="183">select</td><td valign="top" width="179">map</td><td valign="top" width="108">map</td></tr><tr><td valign="top" width="135">SelectMany</td><td valign="top" width="165">from … from … select</td><td valign="top" width="150">collect</td><td valign="top" width="183"></td><td valign="top" width="179">bind, &gt;&gt;=</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">SequenceEqual</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Single</td><td valign="top" width="165"></td><td valign="top" width="150">exactlyOne</td><td valign="top" width="183">exactlyOne</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">SingleOrDefault</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183">exactlyOneOrDefault</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Skip</td><td valign="top" width="165"></td><td valign="top" width="150">skip</td><td valign="top" width="183">skip</td><td valign="top" width="179">drop</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">SkipWhile</td><td valign="top" width="165"></td><td valign="top" width="150">skipWhile</td><td valign="top" width="183">skipWhile</td><td valign="top" width="179">dropWhile</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Sum</td><td valign="top" width="165"></td><td valign="top" width="150">sum, sumBy</td><td valign="top" width="183"></td><td valign="top" width="179">sum</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Take</td><td valign="top" width="165"></td><td valign="top" width="150">take, truncate</td><td valign="top" width="183">take</td><td valign="top" width="179">take</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">TakeWhile</td><td valign="top" width="165"></td><td valign="top" width="150">takeWhile</td><td valign="top" width="183">takeWhile</td><td valign="top" width="179">takeWhile</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">ThenBy</td><td valign="top" width="165">orderby … (ascending)</td><td valign="top" width="150"></td><td valign="top" width="183">thenBy</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">ThenByDescending</td><td valign="top" width="165">orderby … descending</td><td valign="top" width="150"></td><td valign="top" width="183">thenByDescending</td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">ToArray</td><td valign="top" width="165"></td><td valign="top" width="150">toArray</td><td valign="top" width="183"></td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">ToDictionary</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179"></td><td valign="top" width="108">entries</td></tr><tr><td valign="top" width="135">ToList</td><td valign="top" width="165"></td><td valign="top" width="150">toList</td><td valign="top" width="183"></td><td valign="top" width="179"></td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Union</td><td valign="top" width="165"></td><td valign="top" width="150"></td><td valign="top" width="183"></td><td valign="top" width="179">union, unionBy</td><td valign="top" width="108"></td></tr><tr><td valign="top" width="135">Where</td><td valign="top" width="165">where</td><td valign="top" width="150">filter, where</td><td valign="top" width="183">where</td><td valign="top" width="179">filter</td><td valign="top" width="108">filter</td></tr><tr><td valign="top" width="135">Zip</td><td valign="top" width="165"></td><td valign="top" width="150">zip</td><td valign="top" width="183"></td><td valign="top" width="179">zipWith</td><td valign="top" width="108"></td></tr></tbody></table>

There are connections among LINQ, C#, F#, and Haskell. As [Eric Lippert](http://ericlippert.com/) [said](http://stackoverflow.com/questions/4683506/are-there-any-connections-between-haskell-and-linq):

> Yes, the design of LINQ query comprehensions was heavily influenced by the design of Haskell.

For F# and C#/Haskell, [Don Syme](https://en.wikipedia.org/wiki/Don_Syme) (designer and architect of F#) [said](https://www.simple-talk.com/opinion/geek-of-the-week/don-syme-geek-of-the-week/):

> As it developed, F# borrowed more ideas from other languages: Haskell was influential in many ways, from basic syntax elements such as the ‘light’ syntax, to rich constructs such as sequence expressions and computation expressions, which are ways of generating and composing data structures.

Microsoft also directly experimented Haskell on .NET. In [an interview](http://www.infoq.com/interviews/F-Sharp-Don-Syme), Don Syme mentioned:

> During this time we had a go doing Haskell for .NET, we actually got a long way in doing that, but in the end there is quite a lot of dissonance between Haskell and .NET.