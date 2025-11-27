---
title: "C# Functional Programming In-Depth (9) Function Composition and Chaining"
published: 2018-06-09
description: "In object-oriented programming, objects can be composed to build more complex object. Similarly, in functional programming. functions can be composed to build more complex function."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-function-composition-and-method-chaining](/posts/functional-csharp-function-composition-and-method-chaining "https://weblogs.asp.net/dixin/functional-csharp-function-composition-and-method-chaining")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

In object-oriented programming, objects can be composed to build more complex object. Similarly, in functional programming. functions can be composed to build more complex function.

## Forward and backward composition

It is very common to pass a function’s output to another function as input:

```csharp
internal static void OutputAsInput()
{
    string input = "-2.0";
    int output1 = int.Parse(input); // string -> int
    int output2 = Math.Abs(output1); // int -> int
    double output3 = Convert.ToDouble(output2); // int -> double
    double output4 = Math.Sqrt(output3); // double -> double
}
```

So above Abs function and Sqrt function can be combined:

```csharp
// string -> double
internal static double Composition(string input) => 
    Math.Sqrt(Convert.ToDouble(Math.Abs(int.Parse(input))));
```

The above function is the composition of int.Parse, Math.Abs Convert.ToDouble, and Math.Sqrt. Its return value is the last function Math.Sqrt’s return value. Generally, a forward composition operator and a backward composition operator can be defined as extension method:

```csharp
public static partial class FuncExtensions
{
    public static Func<T, TResult2> After<T, TResult1, TResult2>(
        this Func<TResult1, TResult2> function2, Func<T, TResult1> function1) =>
            value => function2(function1(value));

    public static Func<T, TResult2> Then<T, TResult1, TResult2>( // Before.
        this Func<T, TResult1> function1, Func<TResult1, TResult2> function2) =>
            value => function2(function1(value));
}
```

The above functions can be composed by calling either After or Then:

```csharp
internal static void Compose()
{
    Func<string, int> parse = int.Parse; // string -> int
    Func<int, int> abs = Math.Abs; // int -> int
    Func<int, double> convert = Convert.ToDouble; // int -> double
    Func<double, double> sqrt = Math.Sqrt; // double -> double

    // string -> double
    Func<string, double> composition1 = sqrt.After(convert).After(abs).After(parse);
    composition1("-2.0").WriteLine(); // 1.4142135623731

    // string -> double
    Func<string, double> composition2 = parse.Then(abs).Then(convert).Then(sqrt);
    composition2("-2.0").WriteLine(); // 1.4142135623731
}
```

The LINQ query methods, like Where, Skip, Take, cannot be directly composed like this:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        // (IEnumerable<TSource>, TSource -> bool) -> IEnumerable<TSource>
        public static IEnumerable<TSource> Where<TSource>(
            this IEnumerable<TSource> source, Func<TSource, bool> predicate);

        // (IEnumerable<TSource>, int) -> IEnumerable<TSource>
        public static IEnumerable<TSource> Skip<TSource>(
            this IEnumerable<TSource> source, int count);

        // (IEnumerable<TSource>, int) -> IEnumerable<TSource>
        public static IEnumerable<TSource> Take<TSource>(
            this IEnumerable<TSource> source, int count);

        // Other members.
    }
}
```

They all return IEnumerable<T>, but they are all 2-arity, so one function cannot be called directly with another function’s output. To compose these functions, they need to be partially applied (called) with the parameter other than IEnumerable<T>, so that they become 1-arity functions, which can be composed. To do this, create the following helper functions:

```csharp
// Func<TSource, bool> -> IEnumerable<TSource> -> IEnumerable<TSource>
internal static Func<IEnumerable<TSource>, IEnumerable<TSource>> Where<TSource>(
    Func<TSource, bool> predicate) => source => Enumerable.Where(source, predicate);

// int -> IEnumerable<TSource> -> IEnumerable<TSource>
internal static Func<IEnumerable<TSource>, IEnumerable<TSource>> Skip<TSource>(
    int count) => source => Enumerable.Skip(source, count);

// int -> IEnumerable<TSource> -> IEnumerable<TSource>
internal static Func<IEnumerable<TSource>, IEnumerable<TSource>> Take<TSource>(
    int count) => source => Enumerable.Take(source, count);
```

They are curried from the original query methods, with the first parameter and second parameter swapped. After being called with a argument, they return IEnumerable<TSource> –> IEnumerable<TSource> functions:

```csharp
internal static void LinqWithPartialApplication()
{
    // IEnumerable<TSource> -> IEnumerable<TSource>
    Func<IEnumerable<int>, IEnumerable<int>> where = Where<int>(int32 => int32 > 0);
    Func<IEnumerable<int>, IEnumerable<int>> skip = Skip<int>(1);
    Func<IEnumerable<int>, IEnumerable<int>> take = Take<int>(2);

    IEnumerable<int> query = take(skip(where(new int[] { 4, 3, 2, 1, 0, -1 })));
    foreach (int result in query) // Execute query.
    {
        result.WriteLine();
    }
}
```

So these LINQ query methods can be composed through the curried helper functions:

```csharp
internal static void ComposeLinqWithPartialApplication()
{
    Func<IEnumerable<int>, IEnumerable<int>> composition =
        Where<int>(int32 => int32 > 0)
        .Then(Skip<int>(1))
        .Then(Take<int>(2));

    IEnumerable<int> query = composition(new int[] { 4, 3, 2, 1, 0, -1 });
    foreach (int result in query) // Execute query.
    {
        result.WriteLine();
    }
}
```

## Forward pipeline

The forward pipe operator, which forwards argument to call function, can also help function composition. It can also be defined as extension method:

```csharp
public static partial class FuncExtensions
{
    public static TResult Forward<T, TResult>(this T value, Func<T, TResult> function) =>
        function(value);
}

public static partial class ActionExtensions
{
    public static void Forward<T>(this T value, Action<T> function) =>
        function(value);
}
```

The following example demonstrates how to use it:

```csharp
internal static void Forward()
{
    "-2"
        .Forward(int.Parse) // string -> int
        .Forward(Math.Abs) // int -> int
        .Forward(Convert.ToDouble) // int -> double
        .Forward(Math.Sqrt) // double -> double
        .Forward(Console.WriteLine); // double -> void

    // Equivalent to:
    Console.WriteLine(Math.Sqrt(Convert.ToDouble(Math.Abs(int.Parse("-2")))));
}
```

The Forward extension method can be useful with the null conditional operator to simplify the code, for example:

```csharp
internal static void ForwardAndNullConditional(IDictionary<string, object> dictionary, string key)
{
    object value = dictionary[key];
    DateTime? dateTime1;
    if (value != null)
    {
        dateTime1 = Convert.ToDateTime(value);
    }
    else
    {
        dateTime1 = null;
    }

    // Equivalent to:
    DateTime? dateTime2 = dictionary[key]?.Forward(Convert.ToDateTime);
}
```

This operator can alkso help composing LINQ query methods:

```csharp
internal static void ForwardLinqWithPartialApplication()
{
    IEnumerable<int> source = new int[] { 4, 3, 2, 1, 0, -1 };
    IEnumerable<int> query = source
        .Forward(Where<int>(int32 => int32 > 0))
        .Forward(Skip<int>(1))
        .Forward(Take<int>(2));
    foreach (int result in query) // Execute query.
    {
        result.WriteLine();
    }
}
```

## Fluent method chaining

In contrast of static method, instance methods can be easily composed by just chaining the calls, for example:

```csharp
internal static void InstanceMethodChaining(string @string)
{
    string result = @string.TrimStart().Substring(1, 10).Replace("a", "b").ToUpperInvariant();
}
```

The above functions are fluently composed because each of them returns an instance of that type, so that another instance method can be called fluently. Unfortunately, many APIs are not designed following this pattern. Take List<T> as example, here are some of its methods:

```csharp
namespace System.Collections.Generic
{
    public class List<T> : IList<T>, IList, IReadOnlyList<T>
    {
        public void Add(T item);

        public void Clear();

        public void ForEach(Action<T> action);

        public void Insert(int index, T item);

        public void RemoveAt(int index);

        public void Reverse();

        // Other members.
    }
}
```

These methods return void, so they cannot be composed by chaining. These existing APIs cannot be changed, but the extension method syntactic sugar enables virtually adding new methods to an existing type. So fluent methods can be “added” to List<T> by defining extension methods:

```csharp
public static class ListExtensions
{
    public static List<T> FluentAdd<T>(this List<T> list, T item)
    {
        list.Add(item);
        return list;
    }

    public static List<T> FluentClear<T>(this List<T> list)
    {
        list.Clear();
        return list;
    }

    public static List<T> FluentForEach<T>(this List<T> list, Action<T> action)
    {
        list.ForEach(action);
        return list;
    }

    public static List<T> FluentInsert<T>(this List<T> list, int index, T item)
    {
        list.Insert(index, item);
        return list;
    }

    public static List<T> FluentRemoveAt<T>(this List<T> list, int index)
    {
        list.RemoveAt(index);
        return list;
    }

    public static List<T> FluentReverse<T>(this List<T> list)
    {
        list.Reverse();
        return list;
    }
}
```

By always returning the first parameter, these extension methods can be composed by fluent chaining, as if they are instance methods:

```csharp
internal static void ListFluentExtensions()
{
    List<int> list = new List<int>() { 1, 2, 3, 4, 5 }
        .FluentAdd(1)
        .FluentInsert(0, 0)
        .FluentRemoveAt(1)
        .FluentReverse()
        .FluentForEach(value => value.WriteLine())
        .FluentClear();
}
```

As fore mentioned, these extension method calls are compiled to normal static method calls:

```csharp
public static void CompiledListExtensions()
{
    List<int> list = 
        ListExtensions.FluentClear(
            ListExtensions.FluentForEach(
                ListExtensions.FluentReverse(
                    ListExtensions.FluentRemoveAt(
                        ListExtensions.FluentInsert(
                            ListExtensions.FluentAdd(
                                new List<int>() { 1, 2, 3, 4, 5 }, 1), 
                            0, 0), 
                        1)
                    ), 
                value => value).WriteLine()
            );
}
```

### LINQ query methods composition

In C#, LINQ query methods are composed better with this fluent method chaining approach. IEnumerable<T> is provided by .NET Framework 2.0 to represent a sequence of values. It only has a GetEnumerator method, and another version of GetEnumerator method inherited from IEnumerable:

```csharp
namespace System.Collections
{
    public interface IEnumerable
    {
        IEnumerator GetEnumerator();
    }
}

namespace System.Collections.Generic
{
    public interface IEnumerable<out T> : IEnumerable
    {
        IEnumerator<T> GetEnumerator();
    }
}
```

When .NET Framework 3.5 introduces LINQ, IEnumerable<T> is used to represent local LINQ data source and query. All the query methods except Empty, Range, Repeat, are defined as extension methods in System.Linq.Enumerable type. Many query methods, like fore mentioned Where, Skip, Take, Select, returns IEnumerable<T>, so that the query methods can be composed by fluent chaining.

The fore mentioned OrderBy method is slightly different. It accepts IEnumerable<T> but returns IOrderedEnumerable<T>. There are 4 ordering query methods relevant to IOrderedEnumerable<T>:

```csharp
namespace System.Linq
{
    public interface IOrderedEnumerable<TElement> : IEnumerable<TElement>, IEnumerable
    {
        IOrderedEnumerable<TElement> CreateOrderedEnumerable<TKey>(
            Func<TElement, TKey> keySelector, IComparer<TKey> comparer, bool descending);
    }

    public static class Enumerable
    {
        public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
            this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
            this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
            this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);

        public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
            this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
    }
}
```

IOrderedEnumerable<T>is derived from IEnumerable<T>, so ThenBy and ThenByDescending can only be composed after OrderBy and OrderByDescending, which logically makes sense.

There are also a few methods returning a single value instead of IEnumerable<T>, like First, Last, etc.:

```csharp
public static class Enumerable
{
    public static TSource First<TSource>(this IEnumerable<TSource> source);

    public static TSource Last<TSource>(this IEnumerable<TSource> source);
}
```

Usually they terminate the LINQ query, since other query methods cannot be composed after these methods, unless the returned single value is still a IEnumerable<T> instance.

There are other parities of LINQ to Objects query represented by IEnumerable<T>, like Parallel LINQ to Objects query represented by ParallelQuery<T>, the remote LINQ query represented by IQueryable<T>, their query methods all follow this pattern:

```csharp
namespace System.Linq
{
    public static class ParallelEnumerable
    {
        public static ParallelQuery<TSource> Where<TSource>(
            this ParallelQuery<TSource> source, Func<TSource, bool> predicate);

        public static OrderedParallelQuery<TSource> OrderBy<TSource, TKey>(
            this ParallelQuery<TSource> source, Func<TSource, TKey> keySelector);

        public static ParallelQuery<TResult> Select<TSource, TResult>(
            this ParallelQuery<TSource> source, Func<TSource, TResult> selector);

        // Other members.
    }

    public static class Queryable
    {
        public static IQueryable<TSource> Where<TSource>(
            this IQueryable<TSource> source, Func<TSource, bool> predicate);

        public static IOrderedQueryable<TSource> OrderBy<TSource, TKey>(
            this IQueryable<TSource> source, Func<TSource, TKey> keySelector);

        public static IQueryable<TResult> Select<TSource, TResult>(
            this IQueryable<TSource> source, Func<TSource, TResult> selector);

        // Other members.
    }
}
```

The details of IEnumerable<T> queries are covered by the LINQ to Objects chapter, ParallelQuery<T> queries are covered by the Parallel LINQ chapter, and IQueryable<T> queries are covered by the LINQ to Entities chapter.