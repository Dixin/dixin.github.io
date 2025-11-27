---
title: "Parallel LINQ in Depth (3) Query Methods (Operators)"
published: 2019-09-23
description: "Most of the PLINQ standard queries are the parities with LINQ to Objects standard queries, with the same syntax and functionality. For the additional queries in PLINQ, AsParallel, AsSequential and For"
image: ""
tags: [".NET", "C#", "LINQ", "Parallel Computing", "Parallel LINQ", "PLINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

Most of the PLINQ standard queries are the parities with LINQ to Objects standard queries, with the same syntax and functionality. For the additional queries in PLINQ, AsParallel, AsSequential and ForAll has been discussed. The rest of this chapter discusses the other additional queries, overloads, and the ordering relevant queries that have different behaviour from LINQ to Objects.

### Query settings

PLINQ provides a few queries to configure the current cancellation token, degree of parallelism, execution mode, and merge options.

### Cancellation

PLINQ query execution can be cancelled by providing a System.Threading.CancellationToken instance:

public static ParallelQuery<TSource\> WithCancellation<TSource\>(

this ParallelQuery<TSource\> source, CancellationToken cancellationToken);

A CancellationToken instance can be created with System.Threading.CancellationTokenSource:

internal static void Cancel()

```csharp
{
```
```csharp
using (CancellationTokenSource cancellationTokenSource =
```
```csharp
new CancellationTokenSource(delay: TimeSpan.FromSeconds(1)))
```
```csharp
{
```
```csharp
CancellationToken cancellationToken = cancellationTokenSource.Token;
```
```csharp
try
```
```csharp
{
```
```csharp
ParallelEnumerable.Range(0, Environment.ProcessorCount * 10)
```
```csharp
.WithCancellation(cancellationToken)
```
```csharp
.Select(value => ComputingWorkload(value))
```
```csharp
.WiteLines();
```
```csharp
}
```
```csharp
catch (OperationCanceledException exception)
```
```csharp
{
```
```csharp
exception.WriteLine();
```
```csharp
// The query has been canceled via the token supplied to WithCancellation.
```
```csharp
}
```
```csharp
}
```

}

If the query executes for longer than 1 second, it is signalled to cancel, and throws an OperationCanceledException.

### Degree of parallelism

WithDegreeOfParallelism specifies the maximum number of concurrent executing tasks:

public static ParallelQuery<TSource\> WithDegreeOfParallelism<TSource\>(

this ParallelQuery<TSource\> source, int degreeOfParallelism);

For example:

internal static void DegreeOfParallelism()

```csharp
{
```
```csharp
int maxConcurrency = Environment.ProcessorCount * 10;
```
```csharp
ParallelEnumerable
```
```csharp
.Range(0, maxConcurrency)
```
```csharp
.WithDegreeOfParallelism(maxConcurrency)
```
```csharp
.Visualize(ParallelEnumerable.Select, value => value + ComputingWorkload())
```
```csharp
.WriteLines();
```

}

WithDegreeOfParallelism accepts any int value from 1 to 512 (System.Linq.Parallel.Scheduling’s MAX\_SUPPORTED\_DOP constant field). At runtime, the actual query execution thread count is less than or equal to the specified maximum count. In the above example, WithDegreeOfParallelism is called with 40. However, when executing above query on a quad core CPU, the visualization shows PLINQ only utilizes 6 threads.

[![clip_image002](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image002_thumb.gif "clip_image002")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image002_2.gif)

If WithDegreeOfParallelism is not called, the default degree of parallelism is the minimum value of current device’s processor count and 512:

namespace System.Linq.Parallel

```csharp
{
```
```csharp
internal static class Scheduling
```
```csharp
{
```
```csharp
internal const int MAX_SUPPORTED_DOP = 512;
```

```csharp
internal static int DefaultDegreeOfParallelism = Math.Min(Environment.ProcessorCount, MAX_SUPPORTED_DOP);
```

```csharp
internal static int GetDefaultDegreeOfParallelism() => DefaultDegreeOfParallelism;
```
```csharp
}
```

}

### Execution mode

WithExecutionMode specifies whether the query is allowed to execute sequentially or not:

public static ParallelQuery<TSource\> WithExecutionMode<TSource\>(

this ParallelQuery<TSource\> source, ParallelExecutionMode executionMode);

ParallelExecutionMode is an enumeration type with 2 members. The Default mode of PLINQ means PLINQ can detect the composition of the query and possibly decide to execute the query sequentially; And ForceParallelism requires the query to execute in parallel. For example:

internal static void ExecutionMode()

```csharp
{
```
```csharp
int count = Environment.ProcessorCount * 2;
```
```csharp
using (Markers.EnterSpan(-2, nameof(ParallelExecutionMode.Default)))
```
```csharp
{
```
```csharp
int result = ParallelEnumerable
```
```csharp
.Range(0, count)
```
```csharp
.SelectMany((value, index) => EnumerableEx.Return(value))
```
```csharp
.Visualize(ParallelEnumerable.Select, value => value + ComputingWorkload())
```
```csharp
.ElementAt(count - 1);
```
```csharp
}
```

```csharp
using (Markers.EnterSpan(-3, nameof(ParallelExecutionMode.ForceParallelism)))
```
```csharp
{
```
```csharp
int result = ParallelEnumerable
```
```csharp
.Range(0, count)
```
```csharp
.WithExecutionMode(ParallelExecutionMode.ForceParallelism)
```
```csharp
.SelectMany((value, index) => EnumerableEx.Return(value))
```
```csharp
.Visualize(ParallelEnumerable.Select, value => value + ComputingWorkload())
```
```csharp
.ElementAt(count - 1);
```
```csharp
}
```

}

[![clip_image004](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image004_thumb.jpg "clip_image004")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image004_2.jpg)

When PLINQ execute the above query composed with indexed SelectMany and ElementAt, in the default mode, it is the same sequential execution as LINQ to Objects. To have parallel query execution, the ForceParallelism mode has to be specified.

### Merging

PLINQ can partition the source values so that the query can be executed in parallel. To merge the results, WithMergeOptions can be used to suggest the strategy:

public static ParallelQuery<TSource\> WithMergeOptions<TSource\>(

this ParallelQuery<TSource\> source, ParallelMergeOptions mergeOptions);

ParallelMergeOptions is an enumeration with 4 members. NotBuffered means when each result value is available, it is yielded immediately without being buffered., which is similar to lazy evaluation in LINQ to Objects; FullyBuffered means all results are stored in the fully sized buffer, then, they are yielded, which is similar to eager evaluation in LINQ to Objects; AutoBuffered is between NotBuffered and FullyBuffered, means the buffer size is determined by PLINQ, some results are stored in the auto sized buffer, and ones the buffer is full, the results are yielded; And Default is the same as AutoBuffered. The following code demonstrates the difference of these options:

internal static void MergeForSelect()

```csharp
{
```
```csharp
int count = 10;
```
```csharp
Stopwatch stopwatch = Stopwatch.StartNew();
```
```csharp
ParallelQuery<int>notBuffered = ParallelEnumerable.Range(0, count)
```
```csharp
.WithMergeOptions(ParallelMergeOptions.NotBuffered)
```
```csharp
.Select(value => value + ComputingWorkload());
```
```csharp
notBuffered.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
```
```csharp
// 0:217 3:283 6:363 8:462 1:521 4:612 7:629 9:637 2:660 5:695
```

```csharp
stopwatch.Restart();
```
```csharp
ParallelQuery<int>autoBuffered = ParallelEnumerable.Range(0, count)
```
```csharp
.WithMergeOptions(ParallelMergeOptions.AutoBuffered)
```
```csharp
.Select(value => value + ComputingWorkload());
```
```csharp
autoBuffered.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
```
```csharp
// 6:459 8:493 7:498 9:506 0:648 1:654 2:656 3:684 4:686 5:688
```

```csharp
stopwatch.Restart();
```
```csharp
ParallelQuery<int>fullyBuffered = ParallelEnumerable.Range(0, count)
```
```csharp
.WithMergeOptions(ParallelMergeOptions.FullyBuffered)
```
```csharp
.Select(value => value + ComputingWorkload());
```
```csharp
fullyBuffered.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
```
```csharp
// 0:584 1:589 2:618 3:627 4:629 5:632 6:634 7:636 8:638 9:641
```

}

For above Select query execution, if NotBuffered is specified, the first result value is yielded faster; if FullyBuffered is specified, the last result value is yielded faster; if AutoBuffered is specified, the behaviour is between NotBuffered and FullyBuffered. Also, since FullyBuffered buffers all results, it can preserve their order, while NotBuffered and AutoBuffered cannot. When pulling the results, ForEach is used here instead of ForAll to demonstrate that ParallelMergeOptions also impact the ordering of PLINQ query. When everything is fully buffered, PLINQ can have the ability to merge everything as ordered.

WithMergeOptions just provides a suggestion to PLINQ, so PLINQ can still make its own decision. For example, ForAll is NotBuffered, and yields whatever is pulled. If above queries are executed with ForAll instead of ForEach, all queries’ results become unordered. Another example is, OrderBy has to evaluate all source values, fully buffer them, then sort them:

internal static void MergeForOrderBy()

```csharp
{
```
```csharp
int count = Environment.ProcessorCount * 2;
```
```csharp
Stopwatch stopwatch = Stopwatch.StartNew();
```
```csharp
ParallelEnumerable.Range(0, count)
```
```csharp
.WithMergeOptions(ParallelMergeOptions.NotBuffered)
```
```csharp
.Select(value => ComputingWorkload(value))
```
```csharp
.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
```
```csharp
// 0:132 2:273 1:315 4:460 3:579 6:611 5:890 7:1103
```

```csharp
stopwatch.Restart();
```
```csharp
ParallelEnumerable.Range(0, count)
```
```csharp
.WithMergeOptions(ParallelMergeOptions.NotBuffered)
```
```csharp
.Select(value => ComputingWorkload(value))
```
```csharp
.OrderBy(value => value) // Eager evaluation.
```
```csharp
.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
```
```csharp
// 0:998 1:999 2:999 3:1000 4:1000 5:1000 6:1001 7:1001
```

```csharp
stopwatch.Restart();
```
```csharp
ParallelEnumerable.Range(0, count)
```
```csharp
.WithMergeOptions(ParallelMergeOptions.FullyBuffered)
```
```csharp
.Select(value => ComputingWorkload(value))
```
```csharp
.OrderBy(value => value) // Eager evaluation.
```
```csharp
.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
```
```csharp
// 0:984 1:985 2:985 3:986 4:987 5:987 6:988 7:989
```

}

So OrderBy ignores the suggested ParallelMergeOptions and always fully buffer the results.

### Ordering

In PLINQ, it is more complex to control the order of values than in sequential LINQ to Objects. Apparently, the order of values may not be persisted when they are not sequentially processed. As demonstrated above, WithMergeOptions is one way to impact the order of query results, where ParallelMergeOptions.FullyBuffered can be specified to preserve the order. PLINQ also provides other APIs to control the order.

### Preserving the order

AsOrdered query can be called to specify the order in the source should be preserved for its subsequent queries:

public static ParallelQuery<TSource\> AsOrdered<TSource\>(

this ParallelQuery<TSource\> source);

AsOrdered can only be called on the ParallelQuery<T> instance which is the output of ParallelEnumerable.AsParallel, ParallelEnumerable.Range, or ParallelEnumerable.Repeat. It throws InvalidOperationException for ParallelQuery<T> instance output by any other queries.

internal static void AsOrdered()

```csharp
{
```
```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.Select(value => value + ComputingWorkload())
```
```csharp
.ForEach(value => value.WriteLine()); // 3 1 2 0 4 5 6 7
```

```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.AsOrdered()
```
```csharp
.Select(value => value + ComputingWorkload())
```
```csharp
.ForEach(value => value.WriteLine()); // 0 1 2 3 4 5 6 7
```

}

Here ForEach is used instead of ForAll again to demonstrate the order of query results. In contrast, AsUnordered is provided to ignore the order in the source for its subsequent queries:

public static ParallelQuery<TSource\> AsUnordered<TSource\>(

this ParallelQuery<TSource\> source);

Ignoring the order may improve the query performance. Take GroupBy as example, it can run faster if the PLINQ query is explicitly specified to be unordered. The following example uses a tuple of string and int to represent a product’s name and weight, and group many products by their weight:

internal static void AsUnordered()

```csharp
{
```
```csharp
Random random = new Random();
```
```csharp
(string Name, int Weight)[] products = ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 10_000)
```
```csharp
.Select(_ => (Name: Guid.NewGuid().ToString(), Weight: random.Next(1, 10)))
```
```csharp
.ToArray();
```

```csharp
Stopwatch stopwatch = Stopwatch.StartNew();
```
```csharp
products
```
```csharp
.AsParallel()
```
```csharp
.GroupBy(model => model.Weight)
```
```csharp
.ForEach(group => group.Key.WriteLine());
```
```csharp
stopwatch.Stop();
```
```csharp
stopwatch.ElapsedMilliseconds.WriteLine(); // 800.
```

```csharp
stopwatch.Restart();
```
```csharp
products
```
```csharp
.AsParallel()
```
```csharp
.AsUnordered()
```
```csharp
.GroupBy(model => model.Weight)
```
```csharp
.ForEach(group => group.Key.WriteLine());
```
```csharp
stopwatch.Stop();
```
```csharp
stopwatch.ElapsedMilliseconds.WriteLine(); // 103.
```

}

When ordering queries OrderBy, OrderByDescending, ThenBy, ThenByDescending and Reverse) are called, the order is introduced and preserved in the subsequent queries:

internal static void OrderBy()

```csharp
{
```
```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.Select(value => value) // Order is not preserved.
```
```csharp
.ForEach(value => value.WriteLine()); // 3 1 2 0 4 5 6 7
```

```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.Select(value => value) // Order is not preserved.
```
```csharp
.OrderBy(value => value) // Order is preserved.
```
```csharp
.Select(value => value) // Order is preserved.
```
```csharp
.ForEach(value => value.WriteLine()); // 0 1 2 3 4 5 6 7
```

}

### Order and correctness

In PLINQ, many queries are order sensitive. If the source is unordered, the following queries output indeterministic results:

· Sequence queries:

o Reverse: does nothing

o SequenceEqual: compares values in arbitrary order

o Skip: skips arbitrary values

o SkipWhile: skips arbitrary values

o Take: takes arbitrary values

o TakeWhile: takes arbitrary values with the predicate

o Zip: zips unordered values

· Value queries:

o ElementAt: returns arbitrary value

o ElementAtOrDefault: returns arbitrary value or default

o First: returns arbitrary value

o FirstOrDefault: returns arbitrary value or default

o Last: returns arbitrary value

o LastOrDefault: returns arbitrary value or default

These queries must be used with ordered source to have the correct query results.

And, once again, ForAll pulls values and calls the specified function in parallel, and does not maintain the order as well.

PLINQ also provides ordered partitioner for order preservation. The partitioner and ordered partitioner are discussed in the next chapter.

### Aggregation

In PLINQ, Aggregate query requires the provided accumulator functions to be both commutative and associative.

### Commutativity, associativity and correctness

Assume func is a function that accepts 2 parameters and returns a result, if func(a, b) ≡ func(b, a), then func is commutative; if func(func(a, b), c) ≡ func(a, func(b, c)), then func is associative. For example:

internal static void CommutativeAssociative()

```csharp
{
```
```csharp
Func<int, int, int> func1 = (a, b) => a + b;
```
```csharp
(func1(1, 2) == func1(2, 1)).WriteLine(); // True, commutative
```
```csharp
(func1(func1(1, 2), 3) == func1(1, func1(2, 3))).WriteLine(); // True, associative.
```

```csharp
Func<int, int, int> func2 = (a, b) => a * b + 1;
```
```csharp
(func2(1, 2) == func2(2, 1)).WriteLine(); // True, commutative
```
```csharp
(func2(func2(1, 2), 3) == func2(1, func2(2, 3))).WriteLine(); // False, not associative.
```

```csharp
Func<int, int, int> func3 = (a, b) => a;
```
```csharp
(func3(1, 2) == func3(2, 1)).WriteLine(); // False, not commutative
```
```csharp
(func3(func3(1, 2), 3) == func3(1, func3(2, 3))).WriteLine(); // True, associative.
```

```csharp
Func<int, int, int> func4 = (a, b) => a - b;
```
```csharp
(func4(1, 2) == func4(2, 1)).WriteLine(); // False, not commutative
```
```csharp
(func4(func4(1, 2), 3) == func4(1, func4(2, 3))).WriteLine(); // False, not associative.
```

}

To demonstrate how parallel aggregation is impacted by commutativity and associativity, it can be compared with sequential aggregation:

internal static void AggregateCorrectness()

```csharp
{
```
```csharp
int count = Environment.ProcessorCount * 2;
```
```csharp
int sequentialAdd = Enumerable.Range(0, count).Aggregate((a, b) => a + b);
```
```csharp
sequentialAdd.WriteLine(); // 28
```
```csharp
int parallelAdd = ParallelEnumerable.Range(0, count).Aggregate((a, b) => a + b);
```
```csharp
parallelAdd.WriteLine(); // 28
```

```csharp
int sequentialSubtract = Enumerable.Range(0, count).Aggregate((a, b) => a - b);
```
```csharp
sequentialSubtract.WriteLine(); // -28
```
```csharp
int parallelSubtract = ParallelEnumerable.Range(0, count).Aggregate((a, b) => a - b);
```
```csharp
parallelSubtract.WriteLine(); // 2
```

}

Apparently, parallelSubtract has incorrect result value, because the function provided to Aggregate is neither commutative nor associative. The following code visualizes the aggregation:

internal static void VisualizeAggregate()

```csharp
{
```
```csharp
int count = Environment.ProcessorCount * 2;
```
```csharp
using (Markers.EnterSpan(-1, "Sequential subtract"))
```
```csharp
{
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries("Sequential subtract");
```
```csharp
int sequentialSubtract = Enumerable.Range(0, count).Aggregate((a, b) =>
```
```csharp
{
```
```csharp
using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, $"{a}, {b} => {a - b}"))
```
```csharp
{
```
```csharp
return a - b + ComputingWorkload();
```
```csharp
}
```
```csharp
});
```
```csharp
}
```

```csharp
using (Markers.EnterSpan(-2, "Parallel subtract"))
```
```csharp
{
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries("Parallel subtract");
```
```csharp
int parallelSubtract = ParallelEnumerable.Range(0, count).Aggregate((a, b) =>
```
```csharp
{
```
```csharp
using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, $"{a}, {b} => {a - b}"))
```
```csharp
{
```
```csharp
return a - b + ComputingWorkload();
```
```csharp
}
```
```csharp
});
```
```csharp
}
```

}

The sequential aggregation has the expected process:

[![clip_image006](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image006_thumb.gif "clip_image006")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image006_2.gif)

The parallel aggregation has different behaviours:

[![clip_image008](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image008_thumb.gif "clip_image008")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_12942/clip_image008_2.gif)

It follows the pattern of parallel query methods. It first partitions the data. On this quad core CPU, it splits the 8 source values into 4 partitions, (0, 1), (2, 3), (4, 5), (6, 7). Then it execute the provided function for each parallel in parallel, the 4 partitions’ result values are –1, –1, –1, –1. And finally it merges the 4 result values with the provided function, so the final aggregation result is 2. This demonstrates that the accumulator function must be commutative and associative for the parallel aggregation.

### Merging

PLINQ provides 2 additional Aggregate overloads, where the seed for each partition is specified with either a value or a value factory function:

public static TResult Aggregate<TSource, TAccumulate, TResult\>(

```csharp
this ParallelQuery<TSource> source,
```
```csharp
TAccumulate seed,
```
```csharp
Func<TAccumulate, TSource, TAccumulate>updateAccumulatorFunc,
```
```csharp
Func<TAccumulate, TAccumulate, TAccumulate>combineAccumulatorsFunc,
```
```csharp
Func<TAccumulate, TResult> resultSelector);
```

```csharp
public static TResult Aggregate<TSource, TAccumulate, TResult>(
```
```csharp
this ParallelQuery<TSource> source,
```
```csharp
Func<TAccumulate>seedFactory,
```
```csharp
Func<TAccumulate, TSource, TAccumulate>updateAccumulatorFunc,
```
```csharp
Func<TAccumulate, TAccumulate, TAccumulate>combineAccumulatorsFunc,
```

Func<TAccumulate, TResult\> resultSelector);

They also both accept 2 accumulator functions. First, updateAccumulatorFunc can be read as “source value accumulator”, it accumulates the values within each partition to a partition result. Then, combineAccumulatorsFunc can be read as “partition result accumulator”, it accumulates all partitions’ results to a single final result. The following example calculates the sum of squares:

internal static void MergeForAggregate()

```csharp
{
```
```csharp
int count = Environment.ProcessorCount * 2;
```
```csharp
int parallelSumOfSquares1 = ParallelEnumerable
```
```csharp
.Range(0, count)
```
```csharp
.Aggregate(
```
```csharp
seed: 0, // Seed for each partition.
```
```csharp
updateAccumulatorFunc: (accumulation, value) => accumulation + value * value, // Source value accumulator for each partition's result.
```
```csharp
combineAccumulatorsFunc: (accumulation, partition) => accumulation + partition, // Partition result accumulator for final result.
```
```csharp
resultSelector: result => result);
```
```csharp
parallelSumOfSquares1.WriteLine(); // 140
```

```csharp
int parallelSumOfSquares2 = ParallelEnumerable
```
```csharp
.Range(0, count)
```
```csharp
.Aggregate(
```
```csharp
seedFactory: () => 0, // Seed factory for each partition.
```
```csharp
updateAccumulatorFunc: (accumulation, value) => accumulation + value * value, // Source value accumulator for each partition's result.
```
```csharp
combineAccumulatorsFunc: (accumulation, partition) => accumulation + partition, // Partition result accumulator for final result.
```
```csharp
resultSelector: result => result);
```
```csharp
parallelSumOfSquares2.WriteLine(); // 140
```

}

In the parallel aggregation, first the sum of squares is calculated for each partition. Then all partitions’ results are summed up to the final result.

## Summary

PLINQ is a parity with LINQ to Objects that supports parallel execution. The query execution can be rendered as intuitive charts with Microsoft’s Concurrency Visualizer tool. PLINQ provides parallel standard queries as parities with LINQ to Objects’ sequential standard queries. PLINQ also provides additional queries for conversion between sequential query and parallel query, configuring parallel query, etc. Some PLINQ queries require the source to be ordered to have accurate query results, and the Aggregate query requires the accumulator function to be commutative and associative to have accurate query result.