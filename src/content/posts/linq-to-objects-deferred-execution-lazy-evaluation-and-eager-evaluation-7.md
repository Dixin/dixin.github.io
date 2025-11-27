---
title: "LINQ to Objects in Depth (4) Deferred Execution, Lazy Evaluation and Eager Evaluation"
published: 2018-07-07
description: "As fore mentioned, when a generator method (method contains yield statement and returns IEnumerable<T>) is compiled to a pure function, which constructs a generator and return it to caller. So at runt"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-objects-deferred-execution-lazy-evaluation-and-eager-evaluation](/posts/linq-to-objects-deferred-execution-lazy-evaluation-and-eager-evaluation "https://weblogs.asp.net/dixin/linq-to-objects-deferred-execution-lazy-evaluation-and-eager-evaluation")**

As fore mentioned, when a generator method (method contains yield statement and returns IEnumerable<T>) is compiled to a pure function, which constructs a generator and return it to caller. So at runtime, when a generator method is called, the values in output sequence is not pulled or evaluated. This is called deferred execution.

## Deferred execution vs. immediate execution

To demonstrate how the deferred execution work, take the Select query method as example, with tracing of the control flow:

```csharp
internal static partial class DeferredExecution
{
    internal static IEnumerable<TResult> SelectGenerator<TSource, TResult>(
        this IEnumerable<TSource> source, Func<TSource, TResult> selector)
    {
        "Select query starts.".WriteLine();
        foreach (TSource value in source)
        {
            $"Select query is calling selector with {value}.".WriteLine();
            TResult result = selector(value);
            $"Select query is yielding {result}.".WriteLine();
            yield return result;
        }
        "Select query ends.".WriteLine();
    }
}
```

The foreach loop can be desugared:

```csharp
internal static IEnumerable<TResult> DesugaredSelectGenerator<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    "Select query starts.".WriteLine();
    IEnumerator<TSource> sourceIterator = null; // start.
    try
    {
        sourceIterator = source.GetEnumerator(); // start.
        while (sourceIterator.MoveNext()) // moveNext.
        {
            $"Select query is calling selector with {sourceIterator.Current}.".WriteLine(); // getCurrent.
            TResult result = selector(sourceIterator.Current); // getCurrent.
            $"Select query is yielding {result}.".WriteLine(); // getCurrent.
            yield return result; // getCurrent.
        }
    }
    finally
    {
        sourceIterator?.Dispose(); // dispose.
    }
    "Select query ends.".WriteLine(); // end.
}
```

After compilation, it is equivalent to the following generator creation and return:

```csharp
internal static IEnumerable<TResult> CompiledSelectGenerator<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector) =>
        new Generator<TResult, IEnumerator<TSource>>(
            data: null, // IEnumerator<TSource> sourceIterator = null;
            iteratorFactory: sourceIterator => new Iterator<TResult>(
                start: () =>
                {
                    "Select query starts.".WriteLine();
                    sourceIterator = source.GetEnumerator();
                },
                moveNext: () => sourceIterator.MoveNext(),
                getCurrent: () =>
                {
                    $"Select query is calling selector with {sourceIterator.Current}.".WriteLine();
                    TResult result = selector(sourceIterator.Current);
                    $"Select query is yielding {result}.".WriteLine();
                    return result;
                },
                dispose: () => sourceIterator?.Dispose(),
                end: () => "Select query ends.".WriteLine()));
```

This also demonstrates how the tracing is triggered. The returned generator represents the output sequence and wraps the the data and algorithm of query. When SelectGenerator is called, the output sequence is returned to caller, the query logic is not executed, and the values in the output sequence are not evaluated.

In contrast, the following query is implemented with traditional collection instead of generator:

```csharp
internal static IEnumerable<TResult> SelectList<TSource, TResult>(
    this IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    "Select query starts.".WriteLine();
    List<TResult> resultSequence = new List<TResult>();
    foreach (TSource value in source)
    {
        $"Select query is calling selector with {value}.".WriteLine();
        TResult result = selector(value);
        $"Select query is storing {result}.".WriteLine();
        resultSequence.Add(result);
    }

    "Select query ends.".WriteLine();
    return resultSequence;
}
```

The output sequence is represented by a list with known values. So when the output sequence is returned to caller, the query algorithm of mapping is already executed, and the values in the output sequence are evaluated. This is immediate execution. Calling these 2 methods shows the difference at runtime:

```csharp
internal static void ForEachSelect()
{
    IEnumerable<string> deferredQuery = Enumerable.Range(1, 5)
        .SelectGenerator(int32 => new string('*', int32));
    foreach (string result in deferredQuery) // Execute query.
    {
        // Select query starts.
        // Select query is calling selector with 1.
        // Select query is yielding *.
        // Select query is calling selector with 2.
        // Select query is yielding **.
        // Select query is calling selector with 3.
        // Select query is yielding ***.
        // Select query is calling selector with 4.
        // Select query is yielding ****.
        // Select query is calling selector with 5.
        // Select query is yielding *****.
        // Select query ends.
    }

    IEnumerable<string> immediateQuery = Enumerable.Range(1, 5)
        .SelectList(int32 => new string('*', int32)); // Execute query.
    // Select query starts.
    // Select query is calling selector with 1.
    // Select query is storing *.
    // Select query is calling selector with 2.
    // Select query is storing **.
    // Select query is calling selector with 3.
    // Select query is storing ***.
    // Select query is calling selector with 4.
    // Select query is storing ****.
    // Select query is calling selector with 5.
    // Select query is storing *****.
    // Select query ends.
    foreach (string result in immediateQuery) { }
}
```

When SelectorGenerator is called, its query logic of mapping is not executed, and its result values are not available yet. Later when trying to pull result values from the returned sequence, the query logic of mapping is executed, and each result value is evaluated sequentially. When SelectList is called, its query logic of mapping is executed, and its result values are evaluated and stored in the returned sequence, which is a list. Since any method with yield statement is compiled to construct and return a generator, any method with yield statement implements deferred execution.

In LINQ to Objects, the query methods returning IEnumerable<T> sequence all implement deferred execution. Apparently, the other query methods returning a collection (like ToArray, ToList, etc.) or a single value (like Single, First, etc.) must implement immediate execution to start result value evaluation All the query methods implementation will be discussed later in this chapter.

### Cold sequence vs. hot sequence

In above examples, one function returns a generator, which is a sequence wraps data and iteration algorithms instead of evaluated values. This kind of sequence is called cold sequence. The other method returns a collection, which is is a sequence wraps values already evaluated from data and iteration algorithms. This kind of sequence is called hot sequence. For example:

```csharp
internal static IEnumerable<double> AbsAndSqrtGenerator(double @double)
{
    yield return Math.Abs(@double);
    yield return Math.Sqrt(@double);
}

internal static IEnumerable<double> AbsAndSqrtArray(double @double) => new double[]
{
    Math.Abs(@double),
    Math.Sqrt(@double)
};

internal static void Sequences(double @double)
{
    IEnumerable<double> cold = AbsAndSqrtGenerator(@double); // Deferred execution.
    // Math.Abs and Math.Sqrt are not executed.
    foreach (double result in cold) { }
    // Math.Abs and Math.Sqrt are executed.

    IEnumerable<double> hot = AbsAndSqrtArray(@double); // Immediate execution.
    // Math.Abs and Math.Sqrt are executed.
}
```

In .NET, the convention is that all sequences returned by query methods (like Select, Where, etc.) are cold.

## Lazy evaluation vs. eager evaluation

There are 2 types of deferred execution. Take Select as example, the query execution is deferred until values are pulled from the result sequence. When trying to pull the first result value, the query executes until the first result value is evaluated, at this moment the rest result values remain not evaluated. When trying to pull the second result value, the query executes until the second result value is evaluated, and at this moment the rest result values remain not evaluated, and so on. If the pulling stops in the middle, the rest result values remain not evaluated. This behavior is called lazy evaluation. Besides above Select query, Where query is also an example of lazy evaluation:

```csharp
internal static IEnumerable<TSource> WhereGenerator<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    "Where query starts.".WriteLine();
    foreach (TSource value in source)
    {
        $"Where query is calling predicate with {value}.".WriteLine();
        if (predicate(value))
        {
            $"Where query is yielding {value}.".WriteLine();
            yield return value;
        }
    }
    "Where query ends.".WriteLine();
}
```

Its compilation is equivalent to:

```csharp
internal static IEnumerable<TSource> CompiledWhereGenerator<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate) =>
        new Generator<TSource, IEnumerator<TSource>>(
            data: null, // IEnumerator<TSource> sourceIterator = null;
            iteratorFactory: sourceIterator => new Iterator<TSource>(
                start: () =>
                {
                    "Where query starts.".WriteLine();
                    sourceIterator = source.GetEnumerator();
                },
                moveNext: () =>
                {
                    while (sourceIterator.MoveNext())
                    {
                        $"Where query is calling predicate with {sourceIterator.Current}.".WriteLine();
                        if (predicate(sourceIterator.Current))
                        {
                            return true;
                        }
                    }
                    return false;
                },
                getCurrent: () =>
                {
                    $"Where query is yielding {sourceIterator.Current}.".WriteLine();
                    return sourceIterator.Current;
                },
                dispose: () => sourceIterator?.Dispose(),
                end: () => "Where query ends.".WriteLine()));
```

The following example pulls values from the composition of Where and Select queries, to demonstrate how the lazy evaluation works for each result value:

```csharp
internal static void ForEachWhereAndSelect()
{
    IEnumerable<string> deferredQuery = Enumerable.Range(1, 5)
        .WhereGenerator(int32 => int32 > 2) // Deferred execution.
        .SelectGenerator(int32 => new string('*', int32)); // Deferred execution.
    foreach (string result in deferredQuery)
    {
        // Select query starts.
        // Where query starts.
        // Where query is calling predicate with 1.
        // Where query is calling predicate with 2.
        // Where query is calling predicate with 3.
        // Where query is yielding 3.
        // Select query is calling selector with 3.
        // Select query is yielding ***.
        // Where query is calling predicate with 4.
        // Where query is yielding 4.
        // Select query is calling selector with 4.
        // Select query is yielding ****.
        // Where query is calling predicate with 5.
        // Where query is yielding 5.
        // Select query is calling selector with 5.
        // Select query is yielding *****.
        // Where query ends.
        // Select query ends.
    }
}
```

The final query is a generator created by Select query, when foreach loop pulls the first result value, the Select query starts execution and pulls the first value from its source sequence, which is another generator created by Where query. So Where query starts execution too. Where query pulls values from its source sequence, until its first result value 3 is yielded. Therefore, Select pulls the first value 3, and yields its first result value \*\*\*. Then, the pulling and evaluation continues. The foreach loop pulls the next result value from generator created by Select, which pulls the next result value from generator created by Where, and the generator created by Where yields its next result value 4 to the generator created by Select, which yields its next value \*\*\*\* to the foreach loop. This goes on, and when there is no result value to pull, the query execution ends.

The opposition of lazy evaluation, is eager evaluation, where trying to pull a result value for the first time causes all result values evaluated. For example, Reverse query implements deferred execution. When its result sequence is pulled for the first time, it stars execution. It has to evaluate all the result values, in order to know what is the last source value, and yield it as its first result value. The following code demonstrates how Reserve is implemented::

```csharp
internal static IEnumerable<TSource> ReverseGenerator<TSource>(this IEnumerable<TSource> source)
{
    "Reverse query starts.".WriteLine();
    TSource[] values = source.ToArray();
    $"Reverse query evaluated all {values.Length} value(s) in source sequence.".WriteLine();
    for (int index = values.Length - 1; index >= 0; index--)
    {
        $"Reverse query is yielding index {index} of input sequence.".WriteLine();
        yield return values[index];
    }
    "Reverse query ends.".WriteLine();
}
```

Its compilation is equivalent to:

```csharp
internal static IEnumerable<TSource> CompiledReverseGenerator<TSource>(this IEnumerable<TSource> source) =>
    new Generator<TSource, (TSource[] Values, int Index)>(
        data: default, // (TSource[] Values, int Index) data = default;
        iteratorFactory: data => new Iterator<TSource>(
            start: () =>
            {
                "Reverse query starts.".WriteLine();
                TSource[] values = source.ToArray();
                $"Reverse query evaluated all {values.Length} value(s) in input sequence.".WriteLine();
                data = (values, values.Length);
            },
            moveNext: () =>
            {
                data = (data.Values, data.Index - 1);
                return data.Index >= 0;
            },
            getCurrent: () =>
            {
                $"Reverse query is yielding index {data.Index} of input sequence.".WriteLine();
                return data.Values[data.Index];
            },
            end: () => "Reverse query ends.".WriteLine()));
```

The following example pulls values from the composition of Select and Reverse queries:

```csharp
internal static void ForEachSelectAndReverse()
{
    IEnumerable<string> deferredQuery = Enumerable.Range(1, 5)
        .SelectGenerator(int32 => new string('*', int32)) // Deferred execution.
        .ReverseGenerator(); // Deferred execution.
    using (IEnumerator<string> reverseIterator = deferredQuery.GetEnumerator())
    {
        if (reverseIterator.MoveNext()) // Eager evaluation.
        {
            // Reverse query starts.
            // Select query starts.
            // Select query is calling selector with 1.
            // Select query is yielding *.
            // Select query is calling selector with 2.
            // Select query is yielding **.
            // Select query is calling selector with 3.
            // Select query is yielding ***.
            // Select query is calling selector with 4.
            // Select query is yielding ****.
            // Select query is calling selector with 5.
            // Select query is yielding *****.
            // Select query ends.
            // Reverse query evaluated all 5 value(s) in source sequence.
            // Reverse query is yielding index 4 of source sequence.
            reverseIterator.Current.WriteLine();
            while (reverseIterator.MoveNext())
            {
                // Reverse query is yielding index 3 of source sequence.
                // Reverse query is yielding index 2 of source sequence.
                // Reverse query is yielding index 1 of source sequence.
                // Reverse query is yielding index 0 of source sequence.
                reverseIterator.Current.WriteLine();
            } // Reverse query ends.
        }
    }
}
```

The final query is a generator created by Reverse query, when foreach loop pulls the first result value, the Reverse query starts execution and pulls the all values from its source sequence, which is a generator created by Select query. So Select query starts execution too. Therefore, all its result values are yielded to the generator created by Reverse, which then yield its first result (its last source value). Then, the pulling continues. The foreach loop pulls the next result value from generator created by Reverse, which directly yields its next result value (its second last source value). This goes on, and when there is no result value to pull, the query execution ends.