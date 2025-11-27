---
title: "Category Theory via C# (15) IEnumerable<> Monad And LINQ: SelectMany For All"
published: 2018-12-16
description: "Previous part introduced SelectMany for monad IEnumerable<>. Actually SelectMany is more than meets the eye, and can be used to implement other LINQ queries."
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads](/posts/category-theory-via-csharp-7-monad-and-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-7-monad-and-linq-to-monads")**

Previous part introduced SelectMany for monad IEnumerable<>. Actually SelectMany is more than meets the eye, and can be used to implement other LINQ queries.

## Query methods implemented by SelectMany

This part will demonstrate how to use SelectMany to implement following LINQ query methods:

-   Restriction: Where
-   Projection: Select
-   Join: Join, GroupJoin
-   Grouping: GroupBy
-   Set: Zip, Distinct, Union, Intersect, Except
-   Partitioning: Take, Skip, TakeWhile, SkipWhile
-   Cancatening: Concat

First, create a help method to make the code shorter:
```
[Pure]
public static partial class EnumerableSelectManyExtensions
{
    // value.Enumerable(isNotEmpty) is the alias of (isNotEmpty ? value.Enumerable() : Enumerable.Empty<TSource>())
    public static IEnumerable<TSource> Enumerable<TSource>(this TSource value, bool isNotEmpty = false)
    {
        // return isNotEmpty ? EnumerableEx.Return(value) : Enumerable.Empty<TSource>();
        if (isNotEmpty)
        {
            yield return value;
        }
    }
}
```

And here comes this long list of 15 methods:
```
public static IEnumerable<TSource> Concat<TSource>(this IEnumerable<TSource> first, IEnumerable<TSource> second)
{
    return new IEnumerable<TSource>[] { first, second }
        .SelectMany(Functions.Id);
}

public static IEnumerable<TSource> Distinct<TSource>(
    this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(comparer);
    return source
        .SelectMany(value => value.Enumerable(hashSet.Add(value)));
}

public static IEnumerable<TSource> Except<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(second, comparer);
    return first
        .SelectMany(firstValue => firstValue.Enumerable(hashSet.Add(firstValue)));
}

public static IEnumerable<IGrouping<TKey, TElement>> GroupBy<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    IEqualityComparer<TKey> comparer)
{
    // return source.ToLookup(keySelector, elementSelector, comparer);
    HashSet<TKey> hashSet = new HashSet<TKey>(comparer);
    return source
        .SelectMany(value => keySelector(value).Enumerable())
        .SelectMany(key => key.Enumerable(hashSet.Add(key)))
        // Microsoft.FSharp.Linq.RuntimeHelpers.Grouping<K, T>
        .SelectMany(key => new Grouping<TKey, TElement>(key, source
            // SelectMany inside SelectMany. Time complexity is O(N * N).
            .SelectMany(value => elementSelector(value).Enumerable(comparer.Equals(key, keySelector(value))))).Enumerable());
}

public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
    IEqualityComparer<TKey> comparer)
{
    ILookup<TKey, TInner> lookup = inner.ToLookup(innerKeySelector, comparer); // Lookup<TKey, TInner> cannot be created by public API.
    return outer
        .SelectMany(outerValue => resultSelector(outerValue, lookup[outerKeySelector(outerValue)]).Enumerable());
}

public static IEnumerable<TSource> Intersect<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(second, comparer);
    return first
        .SelectMany(firstValue => firstValue.Enumerable(hashSet.Remove(firstValue)));
}

public static IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, TInner, TResult> resultSelector,
    IEqualityComparer<TKey> comparer)
{
    ILookup<TKey, TInner> lookup = inner.ToLookup(innerKeySelector, comparer); // Lookup<TKey, TInner> cannot be created by public API.
    return outer
        .SelectMany(outerValue => lookup[outerKeySelector(outerValue)]
            .SelectMany(innerValue => resultSelector(outerValue, innerValue).Enumerable()));
}

public static IEnumerable<TResult> Select<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    return source.SelectMany(
        sourceValue => selector(sourceValue).Enumerable());
}

public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count)
{
    return source
        .SelectMany((value, index) => value.Enumerable(index >= count));
}

public static IEnumerable<TSource> SkipWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    bool flag = false;
    return source
        .SelectMany(value =>
        {
            if (!flag && !predicate(value))
            {
                flag = true; // Imperative.
            }

            return value.Enumerable(flag);
        });
}

public static IEnumerable<TSource> Take<TSource>(this IEnumerable<TSource> source, int count)
{
    return source
        .SelectMany((value, index) => value.Enumerable(index < count));
}

public static IEnumerable<TSource> TakeWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    bool flag = true;
    return source
        .SelectMany(value =>
        {
            if (!predicate(value))
            {
                flag = false; // Imperative.
            }

            return value.Enumerable(flag);
        });
}

public static IEnumerable<TSource> Union<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(comparer);
    return new IEnumerable<TSource>[] { first, second }
        .SelectMany(Functions.Id)
        .SelectMany(value => value.Enumerable(hashSet.Add(value)));
}

public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    return source
        .SelectMany(value => value.Enumerable(predicate(value)));
}

public static IEnumerable<TResult> Zip<TFirst, TSecond, TResult>(
    this IEnumerable<TFirst> first, IEnumerable<TSecond> second, Func<TFirst, TSecond, TResult> resultSelector)
{
    return first
        .SelectMany((firstValue, index) => second
            // SelectMany inside SelectMany. Time complexity is O(N * N).
            .SelectMany((value, index2) => value.Enumerable(index2 == index)), resultSelector);
}
```

Again these code are just for demonstration purpose. The performance of above code is no better than the built-in implementation in System.Linq.Enumerable. Also, some of above SelectMany code is imperative, for example:

-   Skip, Take, Zip use the index
-   SkipWhile and TakeWhile use a variable

So these SelectMany usages are not authentically functional.

### Query methods in LINQ syntax

Above implementations in LINQ syntax:
```
public static IEnumerable<TSource> Concat<TSource>(this IEnumerable<TSource> first, IEnumerable<TSource> second)
{
    return from enumerable in new IEnumerable<TSource>[] { first, second }
           from value in enumerable
           select value;
}

public static IEnumerable<TSource> Distinct<TSource>(
    this IEnumerable<TSource> source, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(comparer);
    return from value in source
           // where hashSet.Add(value)
           from distinct in value.Enumerable(hashSet.Add(value))
           select distinct;
}

public static IEnumerable<TSource> Except<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(second, comparer);
    return from value in first
           // where hashSet.Add(value)
           from except in value.Enumerable(hashSet.Add(value))
           select except;
}

public static IEnumerable<IGrouping<TKey, TElement>> GroupBy<TSource, TKey, TElement>(
    this IEnumerable<TSource> source,
    Func<TSource, TKey> keySelector,
    Func<TSource, TElement> elementSelector,
    IEqualityComparer<TKey> comparer)
{
    HashSet<TKey> hashSet = new HashSet<TKey>(comparer);
    return from value in source
           let key = keySelector(value)
           // where hashSet.Add(key)
           from distinctKey in key.Enumerable(hashSet.Add(key))
           select new Grouping<TKey, TElement>(
               distinctKey,
               from value2 in source
               // where comparer.Equals(distinctKey, keySelector(value2))
               from element in elementSelector(value).Enumerable(comparer.Equals(key, keySelector(value2)))
               select elementSelector(value2));
}

public static IEnumerable<TResult> GroupJoin<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, IEnumerable<TInner>, TResult> resultSelector,
    IEqualityComparer<TKey> comparer)
{
    ILookup<TKey, TInner> lookup = inner.ToLookup(innerKeySelector, comparer);
    return from outerValue in outer
           // select resultSelector(outerValue, lookup[outerKeySelector(outerValue)])
           from result in resultSelector(outerValue, lookup[outerKeySelector(outerValue)]).Enumerable()
           select result;
}

public static IEnumerable<TSource> Intersect<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(second, comparer);
    return from firstValue in first
           // where hashSet.Remove(firstValue)
           from intersect in firstValue.Enumerable(hashSet.Remove(firstValue))
           select intersect;
}

public static IEnumerable<TResult> Join<TOuter, TInner, TKey, TResult>(
    this IEnumerable<TOuter> outer,
    IEnumerable<TInner> inner,
    Func<TOuter, TKey> outerKeySelector,
    Func<TInner, TKey> innerKeySelector,
    Func<TOuter, TInner, TResult> resultSelector,
    IEqualityComparer<TKey> comparer)
{
    ILookup<TKey, TInner> lookup = inner.ToLookup(innerKeySelector, comparer); // Lookup<TKey, TInner> cannot be created by public API.
    return from outerValue in outer
           from result in
               (from innerValue in lookup[outerKeySelector(outerValue)]
               // select resultSelector(outerValue, innerValue)
               from result2 in resultSelector(outerValue, innerValue).Enumerable()
               select result2)
           select result;
}

public static IEnumerable<TResult> Select<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    return from value in source
           // select selector(value)
           from result in selector(value).Enumerable()
           select result;
}

public static IEnumerable<TSource> Skip<TSource>(this IEnumerable<TSource> source, int count)
{
    int index = 0;
    return from value in source
           // where index++ >= count
           from result in value.Enumerable(index++ >= count)
           select result;
}

public static IEnumerable<TSource> SkipWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    bool flag = false;
    return from value in source
           let _ = (!flag && !predicate(value)) && (flag = true)
           from result in value.Enumerable(flag)
           select result;
}

public static IEnumerable<TSource> Take<TSource>(this IEnumerable<TSource> source, int count)
{
    int index = 0;
    return from value in source
           // where index++ < count
           from result in value.Enumerable(index++ < count)
           select result;
}

public static IEnumerable<TSource> TakeWhile<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    bool flag = true;
    return from value in source
           let _ = (predicate(value)) || (flag = false)
           from result in value.Enumerable(flag)
           select result;
}

public static IEnumerable<TSource> Union<TSource>(
    this IEnumerable<TSource> first, IEnumerable<TSource> second, IEqualityComparer<TSource> comparer)
{
    HashSet<TSource> hashSet = new HashSet<TSource>(comparer);
    return from enumerable in new IEnumerable<TSource>[] { first, second }
           from value in enumerable
           // where hashSet.Add(value)
           from result in value.Enumerable(hashSet.Add(value))
           select result;
}

public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    return from value in source
           from result in value.Enumerable(predicate(value))
           select result;
}

public static IEnumerable<TResult> Zip<TFirst, TSecond, TResult>(
    this IEnumerable<TFirst> first, IEnumerable<TSecond> second, Func<TFirst, TSecond, TResult> resultSelector)
{
    int firstIndex = 0;
    int secondIndex = 0;
    return from firstValue in first
           let currentFirstIndex = firstIndex++
           let _ = secondIndex = 0
           from secondResult in
               (from secondValue in second
               // where firstIndex2 == secondIndex++
               // let secondIndex3 = secondIndex++
               from secondResult in secondValue.Enumerable(currentFirstIndex == secondIndex++)
               select secondResult)
           select resultSelector(firstValue, secondResult);
}
```

Please notice that Skip, Take, Zip, SkipWhile and TakeWhile uses [let clause](https://msdn.microsoft.com/en-us/library/bb383976.aspx) as trick.

## Unit tests

Once again, a long tedious list of test code:

```csharp
[TestClass()]
public class EnumerableSelectManyExtensionsTests
{
    [TestMethod()]
    public void ConcatTest()
    {
        int[] first = new int[] { 0, 1, 2 };
        int[] second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Concat(first, second), 
            EnumerableSelectManyExtensions.Concat(first, second));

        first = new int[] { };
        second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Concat(first, second), 
            EnumerableSelectManyExtensions.Concat(first, second));

        first = new int[] { 0, 1, 2 };
        second = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Concat(first, second), 
            EnumerableSelectManyExtensions.Concat(first, second));
    }

    [TestMethod()]
    public void DistinctTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Distinct(enumerable), 
            EnumerableSelectManyExtensions.Distinct(enumerable, EqualityComparer<int>.Default));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Distinct(enumerable), 
            EnumerableSelectManyExtensions.Distinct(enumerable, EqualityComparer<int>.Default));
    }

    [TestMethod()]
    public void ExceptTest()
    {
        int[] first = new int[] { 0, 1, 2 };
        int[] second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Except(first, second), 
            EnumerableSelectManyExtensions.Except(first, second, EqualityComparer<int>.Default));

        first = new int[] { 0, 1, 2 };
        second = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Except(first, second), 
            EnumerableSelectManyExtensions.Except(first, second, EqualityComparer<int>.Default));

        first = new int[] { };
        second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Except(first, second), 
            EnumerableSelectManyExtensions.Except(first, second, EqualityComparer<int>.Default));

        first = new int[] { 0, 1, 2 };
        second = new int[] { 2, 3, 4 };
        EnumerableAssert.AreEqual(
            Enumerable.Except(first, second), 
            EnumerableSelectManyExtensions.Except(first, second, EqualityComparer<int>.Default));
    }

    [TestMethod()]
    public void GroupByTest()
    {
        int[] enumerable = new int[] { 0, 1, 2, 4, 5, 6 };
        IGrouping<int, int>[] expected = Enumerable.GroupBy(enumerable, value => value % 3, value => value).ToArray();
        IGrouping<int, int>[] actual = EnumerableSelectManyExtensions.GroupBy(enumerable, value => value % 3, value => value, EqualityComparer<int>.Default).ToArray();
        Assert.AreEqual(expected.Count(), actual.Count());
        expected.ForEach((group, index) =>
            {
                Assert.AreEqual(group.Key, actual[index].Key);
                EnumerableAssert.AreEqual(group, actual[index]);
            });

        enumerable = new int[] { };
        expected = Enumerable.GroupBy(enumerable, value => value % 3, value => value).ToArray();
        actual = EnumerableSelectManyExtensions.GroupBy(enumerable, value => value % 3, value => value, EqualityComparer<int>.Default).ToArray();
        Assert.AreEqual(expected.Count(), actual.Count());
        expected.ForEach((group, index) =>
            {
                Assert.AreEqual(group.Key, actual[index].Key);
                EnumerableAssert.AreEqual(group, actual[index]);
            });
    }

    [TestMethod()]
    public void GroupJoinTest()
    {
        Tuple<int, string>[] categories = new Tuple<int, string>[]
                                            {
                                                new Tuple<int, string>(1, "A"), 
                                                new Tuple<int, string>(2, "B"), 
                                                new Tuple<int, string>(3, "C"), 
                                            };
        Tuple<int, string, int>[] products = new Tuple<int, string, int>[]
                                                {
                                                    new Tuple<int, string, int>(1, "aa", 1), 
                                                    new Tuple<int, string, int>(2, "bb", 1), 
                                                    new Tuple<int, string, int>(3, "cc", 2), 
                                                    new Tuple<int, string, int>(4, "dd", 2), 
                                                    new Tuple<int, string, int>(5, "ee", 2), 
                                                };
        Tuple<string, int>[] expected = Enumerable.GroupJoin(
            categories,
            products,
            category => category.Item1,
            product => product.Item3,
            (category, categoryProducts) => new Tuple<string, int>(category.Item2, categoryProducts.Count())).ToArray();
        Tuple<string, int>[] actual = EnumerableSelectManyExtensions.GroupJoin(
            categories,
            products,
            category => category.Item1,
            product => product.Item3,
            (category, categoryProducts) => new Tuple<string, int>(category.Item2, categoryProducts.Count()),
            EqualityComparer<int>.Default).ToArray();
        Assert.AreEqual(expected.Count(), actual.Count());
        expected.ForEach((product, index) =>
            {
                Assert.AreEqual(product.Item1, actual[index].Item1);
                Assert.AreEqual(product.Item2, actual[index].Item2);
            });
    }

    [TestMethod()]
    public void IntersectTest()
    {
        int[] first = new int[] { 0, 1, 2 };
        int[] second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Intersect(first, second), 
            EnumerableSelectManyExtensions.Intersect(first, second, EqualityComparer<int>.Default));

        first = new int[] { 0, 1, 2 };
        second = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Intersect(first, second), 
            EnumerableSelectManyExtensions.Intersect(first, second, EqualityComparer<int>.Default));

        first = new int[] { };
        second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Intersect(first, second), 
            EnumerableSelectManyExtensions.Intersect(first, second, EqualityComparer<int>.Default));

        first = new int[] { 0, 1, 2 };
        second = new int[] { 2, 3, 4 };
        EnumerableAssert.AreEqual(
            Enumerable.Intersect(first, second), 
            EnumerableSelectManyExtensions.Intersect(first, second, EqualityComparer<int>.Default));
    }

    [TestMethod()]
    public void JoinTest()
    {
        Tuple<int, string, int>[] products = new Tuple<int, string, int>[]
                                                {
                                                    new Tuple<int, string, int>(1, "aa", 1), 
                                                    new Tuple<int, string, int>(2, "bb", 1), 
                                                    new Tuple<int, string, int>(3, "cc", 2), 
                                                    new Tuple<int, string, int>(4, "dd", 2), 
                                                    new Tuple<int, string, int>(5, "ee", 2), 
                                                };
        Tuple<int, string>[] categories = new Tuple<int, string>[]
                                            {
                                                new Tuple<int, string>(1, "A"), 
                                                new Tuple<int, string>(2, "B"), 
                                                new Tuple<int, string>(3, "C"), 
                                            };
        Tuple<string, string>[] expected = Enumerable.Join(
            products,
            categories,
            product => product.Item3,
            category => category.Item1,
            (product, category) => new Tuple<string, string>(category.Item2, product.Item2)).ToArray();
        Tuple<string, string>[] actual = EnumerableSelectManyExtensions.Join(
            products,
            categories,
            product => product.Item3,
            category => category.Item1,
            (product, category) => new Tuple<string, string>(category.Item2, product.Item2),
            EqualityComparer<int>.Default).ToArray();
        Assert.AreEqual(expected.Count(), actual.Count());
        expected.ForEach((product, index) =>
            {
                Assert.AreEqual(product.Item1, actual[index].Item1);
                Assert.AreEqual(product.Item2, actual[index].Item2);
            });

        products = new Tuple<int, string, int>[]
                                                {
                                                    new Tuple<int, string, int>(1, "aa", 1), 
                                                    new Tuple<int, string, int>(2, "bb", 1), 
                                                    new Tuple<int, string, int>(3, "cc", 2), 
                                                    new Tuple<int, string, int>(4, "dd", 2), 
                                                    new Tuple<int, string, int>(5, "ee", 2), 
                                                };
        categories = new Tuple<int, string>[] { };
        expected = Enumerable.Join(
            products,
            categories,
            product => product.Item3,
            category => category.Item1,
            (product, category) => new Tuple<string, string>(category.Item2, product.Item2)).ToArray();
        actual = EnumerableSelectManyExtensions.Join(
            products,
            categories,
            product => product.Item3,
            category => category.Item1,
            (product, category) => new Tuple<string, string>(category.Item2, product.Item2),
            EqualityComparer<int>.Default).ToArray();
        Assert.AreEqual(expected.Count(), actual.Count());
        expected.ForEach((product, index) =>
            {
                Assert.AreEqual(product.Item1, actual[index].Item1);
                Assert.AreEqual(product.Item2, actual[index].Item2);
            });

        products = new Tuple<int, string, int>[] { };
        categories = new Tuple<int, string>[]
                                            {
                                                new Tuple<int, string>(1, "A"), 
                                                new Tuple<int, string>(1, "B"), 
                                                new Tuple<int, string>(1, "C"), 
                                            };
        expected = Enumerable.Join(
            products,
            categories,
            product => product.Item3,
            category => category.Item1,
            (product, category) => new Tuple<string, string>(category.Item2, product.Item2)).ToArray();
        actual = EnumerableSelectManyExtensions.Join(
            products,
            categories,
            product => product.Item3,
            category => category.Item1,
            (product, category) => new Tuple<string, string>(category.Item2, product.Item2),
            EqualityComparer<int>.Default).ToArray();
        Assert.AreEqual(expected.Count(), actual.Count());
        expected.ForEach((product, index) =>
            {
                Assert.AreEqual(product.Item1, actual[index].Item1);
                Assert.AreEqual(product.Item2, actual[index].Item2);
            });
    }

    [TestMethod()]
    public void SelectTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Select(enumerable, x => x.ToString()), 
            EnumerableSelectManyExtensions.Select4(enumerable, x => x.ToString()));

        enumerable = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Select(enumerable, x => x.ToString()), 
            EnumerableSelectManyExtensions.Select4(enumerable, x => x.ToString()));
    }

    [TestMethod()]
    public void SkipTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Skip(enumerable, 2), 
            EnumerableSelectManyExtensions.Skip(enumerable, 2));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Skip(enumerable, 0), 
            EnumerableSelectManyExtensions.Skip(enumerable, 0));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Skip(enumerable, -1), 
            EnumerableSelectManyExtensions.Skip(enumerable, -1));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Skip(enumerable, 100), 
            EnumerableSelectManyExtensions.Skip(enumerable, 100));

        enumerable = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Skip(enumerable, 100), 
            EnumerableSelectManyExtensions.Skip(enumerable, 100));
    }

    [TestMethod()]
    public void SkipWhileTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.SkipWhile(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.SkipWhile(enumerable, x => x > 0));

        enumerable = new int[] { 2, 1, 0, -1 };
        EnumerableAssert.AreEqual(
            Enumerable.SkipWhile(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.SkipWhile(enumerable, x => x > 0));

        enumerable = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.SkipWhile(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.SkipWhile(enumerable, x => x > 0));
    }

    [TestMethod()]
    public void TakeTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Take(enumerable, 2), 
            EnumerableSelectManyExtensions.Take(enumerable, 2));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Take(enumerable, 0), 
            EnumerableSelectManyExtensions.Take(enumerable, 0));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Take(enumerable, -1), 
            EnumerableSelectManyExtensions.Take(enumerable, -1));

        enumerable = new int[] { 0, 1, 1, 1, 2, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Take(enumerable, 100), 
            EnumerableSelectManyExtensions.Take(enumerable, 100));

        enumerable = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Take(enumerable, 100), 
            EnumerableSelectManyExtensions.Take(enumerable, 100));
    }

    [TestMethod()]
    public void TakeWhileTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.TakeWhile(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.TakeWhile(enumerable, x => x > 0));

        enumerable = new int[] { 2, 1, 0, -1 };
        EnumerableAssert.AreEqual(
            Enumerable.TakeWhile(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.TakeWhile(enumerable, x => x > 0));

        enumerable = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.TakeWhile(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.TakeWhile(enumerable, x => x > 0));
    }

    [TestMethod()]
    public void UnionTest()
    {
        int[] first = new int[] { 0, 1, 2 };
        int[] second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Union(first, second), 
            EnumerableSelectManyExtensions.Union(first, second, EqualityComparer<int>.Default));

        first = new int[] { 0, 1, 2 };
        second = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Union(first, second), 
            EnumerableSelectManyExtensions.Union(first, second, EqualityComparer<int>.Default));

        first = new int[] { };
        second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Union(first, second), 
            EnumerableSelectManyExtensions.Union(first, second, EqualityComparer<int>.Default));

        first = new int[] { 0, 1, 2 };
        second = new int[] { 2, 3, 4 };
        EnumerableAssert.AreEqual(
            Enumerable.Union(first, second), 
            EnumerableSelectManyExtensions.Union(first, second, EqualityComparer<int>.Default));
    }

    [TestMethod()]
    public void WhereTest()
    {
        int[] enumerable = new int[] { 0, 1, 2 };
        EnumerableAssert.AreEqual(
            Enumerable.Where(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.Where(enumerable, x => x > 0));

        enumerable = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Where(enumerable, x => x > 0), 
            EnumerableSelectManyExtensions.Where(enumerable, x => x > 0));
    }

    [TestMethod()]
    public void ZipTest()
    {
        int[] first = new int[] { 0, 1, 2 };
        int[] second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Zip(first, second, (x, y) => x * y), 
            EnumerableSelectManyExtensions.Zip(first, second, (x, y) => x * y));

        first = new int[] { 0, 1, 2 };
        second = new int[] { };
        EnumerableAssert.AreEqual(
            Enumerable.Zip(first, second, (x, y) => x * y), 
            EnumerableSelectManyExtensions.Zip(first, second, (x, y) => x * y));

        first = new int[] { };
        second = new int[] { 3, 4, 5 };
        EnumerableAssert.AreEqual(
            Enumerable.Zip(first, second, (x, y) => x * y), 
            EnumerableSelectManyExtensions.Zip(first, second, (x, y) => x * y));

        first = new int[] { 0, 1, 2 };
        second = new int[] { 2, 3, 4 };
        EnumerableAssert.AreEqual(
            Enumerable.Zip(first, second, (x, y) => x * y), 
            EnumerableSelectManyExtensions.Zip(first, second, (x, y) => x * y));

        first = new int[] { 0, 1 };
        second = new int[] { 2, 3, 4 };
        EnumerableAssert.AreEqual(
            Enumerable.Zip(first, second, (x, y) => x * y), 
            EnumerableSelectManyExtensions.Zip(first, second, (x, y) => x * y));

        first = new int[] { 0, 1, 2 };
        second = new int[] { 2, 3 };
        EnumerableAssert.AreEqual(
            Enumerable.Zip(first, second, (x, y) => x * y), 
            EnumerableSelectManyExtensions.Zip(first, second, (x, y) => x * y));
    }
}
```