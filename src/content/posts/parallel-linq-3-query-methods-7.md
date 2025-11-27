---
title: "Parallel LINQ in Depth (3) Query Methods (Operators)"
published: 2018-09-29
description: "Parallel LINQ provides additional query methods and additional overrides for Aggregate method:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

## **Latest version: [https://weblogs.asp.net/dixin/parallel-linq-3-query-methods](/posts/parallel-linq-3-query-methods "https://weblogs.asp.net/dixin/parallel-linq-3-query-methods")**

Parallel LINQ provides additional query methods and additional overrides for Aggregate method:

-   Sequence queries

-   Ordering: AsOrdered, AsUnordered
-   Conversion: AsParallel\*, AsSequential\*
-   Settings: WithCancellation, WithDegreeOfParallelism, WithExecutionMode, WithMergeOptions

-   Value queries

-   Aggregation: Aggregate

-   Void queries

-   Iteration: ForAll\*

The methods marked with \* are already discussed in previous parts. This part covers the unmarked query methods, and also other query methods with different behaviors from LINQ to Objects.

## Query settings

### Cancellation

Parallel LINQ query execution can be cancelled by specifying a System.Threading.CancellationToken instance for the query:

```csharp
public static ParallelQuery<TSource> WithCancellation<TSource>(this ParallelQuery<TSource> source, CancellationToken cancellationToken);
```

CancellationToken can be created with System.Threading.CancellationTokenSource:

```csharp
internal static void Cancel()
{
    using (CancellationTokenSource cancellationTokenSource = new CancellationTokenSource(
        delay: TimeSpan.FromSeconds(1)))
    {
        CancellationToken cancellationToken = cancellationTokenSource.Token;
        try
        {
            ParallelEnumerable.Range(0, Environment.ProcessorCount * 10)
                .WithCancellation(cancellationToken)
                .Select(value => ComputingWorkload(value))
                .ForAll(value => value.WriteLine());
        }
        catch (OperationCanceledException exception)
        {
            exception.WriteLine();
            // OperationCanceledException: The query has been canceled via the token supplied to WithCancellation.
        }
    }
}
```

After 1 second delay, If the query is still executing, is signaled to cancel, and throws an OperationCanceledException.

### Degree of parallelism

WithDegreeOfParallelism specifies the maximum number of concurrent executing tasks:

```csharp
public static ParallelQuery<TSource> WithDegreeOfParallelism<TSource>(this ParallelQuery<TSource> source, int degreeOfParallelism);
```

For example:

```csharp
internal static void DegreeOfParallelism()
{
    int maxConcurrency = Environment.ProcessorCount * 10;
    ParallelEnumerable
        .Range(0, maxConcurrency)
        .WithDegreeOfParallelism(maxConcurrency)
        .Visualize(value => ComputingWorkload());
}
```

WithDegreeOfParallelism accepts any int value from 1 to 512 (System.Linq.Parallel.Scheduling’s MAX\_SUPPORTED\_DOP constant field). At runtime, the actual query thread count is less than or equal to the specified count. When executing above query on a quad core CPU, WithDegreeOfParallelism is called with 40. However the visualization shows Parallel LINQ only utilizes 6 threads.

> [![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb_2.png)

If WithDegreeOfParallelism is not called, the default degree of parallelism is the minimum value of current device’s processor count and 512:

```csharp
namespace System.Linq.Parallel
{
    internal static class Scheduling
    {
        internal const int MAX_SUPPORTED_DOP = 512;

        internal static int DefaultDegreeOfParallelism = Math.Min(Environment.ProcessorCount, MAX_SUPPORTED_DOP);

        internal static int GetDefaultDegreeOfParallelism() => DefaultDegreeOfParallelism;
    }
}
```

### Execution mode

WithExecutionMode specifies allowing the query to execute sequentially or not:

```csharp
public static ParallelQuery<TSource> WithExecutionMode<TSource>(this ParallelQuery<TSource> source, ParallelExecutionMode executionMode);
```

ParallelExecutionMode is an enumeration type with 2 members. Default means Parallel LINQ can possibly [decide to execute the query sequentially](http://blogs.msdn.com/b/pfxteam/archive/2009/10/31/9915569.aspx); And ForceParallelism: the query is execute in parallel. For example:

```csharp
public static void ExecutionMode()
{
    int count = Environment.ProcessorCount * 10_000;
    using (Markers.EnterSpan(-1, nameof(Enumerable)))
    {
        Enumerable
            .Range(0, count)
            .ToArray();
    }

    using (Markers.EnterSpan(-2, nameof(ParallelExecutionMode.Default)))
    {
        ParallelEnumerable
            .Range(0, count)
            .ToArray();
    }

    using (Markers.EnterSpan(-3, nameof(ParallelExecutionMode.ForceParallelism)))
    {
        ParallelEnumerable
            .Range(0, count)
            .WithExecutionMode(ParallelExecutionMode.ForceParallelism)
            .ToArray();
    }
}
```

> [![image_thumb21](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb21_thumb.png "image_thumb21")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb21_2.png)

When Parallel LINQ execute ToArray query in the default mode, it is the same sequential execution as LINQ to Objects, with no additional thread involved. When execution mode is specified to ForceParallelism, Parallel LINQ executes ToArray in parallel with additional thread.

### Merge the values

Parallel LINQ can partition the source values and process the partitions in parallel. After the processing, the result values may need to be merged, e.g., when the result values are consumed by a single thread foreach loop/ForEach method. WithMergeOptions suggests Parallel LINQ how to merge the data:

```csharp
public static ParallelQuery<TSource> WithMergeOptions<TSource>(this ParallelQuery<TSource> source, ParallelMergeOptions mergeOptions);
```

ParallelMergeOptions is an enumeration with 4 members. NotBuffered means when each result value is available, it is yielded to consumer immediately without being buffered., which is similar to lazy evaluation in LINQ to Objects; FullyBuffered means all result values are stored in the full size buffer, then, they are yielded to the consumer, which is similar to eager evaluation in LINQ to Objects; AutoBuffered is between NotBuffered and FullyBuffered, means the buffer size is determined by Parallel LINQ, result values are stored in the auto sized buffer, and when the buffer is full, the result values are yielded to consumer; And Default is the same as AutoBuffered. The following code demonstrates the difference of these options:

```csharp
internal static void MergeForSelect()
{
    int count = 10;
    Stopwatch stopwatch = Stopwatch.StartNew();
    ParallelQuery<int> notBuffered = ParallelEnumerable.Range(0, count)
        .WithMergeOptions(ParallelMergeOptions.NotBuffered)
        .Select(value => value + ComputingWorkload(0, 10_000_000));
    notBuffered.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
    // 0:217 3:283 6:363 8:462 1:521 4:612 7:629 9:637 2:660 5:695

    stopwatch.Restart();
    ParallelQuery<int> autoBuffered = ParallelEnumerable.Range(0, count)
        .WithMergeOptions(ParallelMergeOptions.AutoBuffered)
        .Select(value => value + ComputingWorkload(0, 10_000_000));
    autoBuffered.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
    // 6:459 8:493 7:498 9:506 0:648 1:654 2:656 3:684 4:686 5:688

    stopwatch.Restart();
    ParallelQuery<int> fullyBuffered = ParallelEnumerable.Range(0, count)
        .WithMergeOptions(ParallelMergeOptions.FullyBuffered)
        .Select(value => value + ComputingWorkload(0, 10_000_000));
    fullyBuffered.ForEach(value => $"{value}:{stopwatch.ElapsedMilliseconds}".WriteLine());
    // 0:584 1:589 2:618 3:627 4:629 5:632 6:634 7:636 8:638 9:641
}
```

For above Select query execution, if NotBuffered is specified, the first result value is yielded faster; if FullyBuffered is specified, the last result value is yielded faster; if AutoBuffered is specified, the behavior is between NotBuffered and FullyBuffered. Also, since FullyBuffered buffers all result values, it can persist their order, while NotBuffered and AutoBuffered cannot.

WithMergeOptions just provides a suggestion to Parallel LINQ, so Parallel LINQ can still make its own decision. For example, OrderBy has to evaluate all source values, fully buffer them, then sort them:

```csharp
internal static void MergeForOrderBy()
{
    int count = Environment.ProcessorCount * 2;
    Stopwatch stopwatch = Stopwatch.StartNew();
    ParallelEnumerable.Range(0, count)
        .WithMergeOptions(ParallelMergeOptions.NotBuffered)
        .Select(value => ComputingWorkload(value))
        .WriteLines(value => $"{value}:{stopwatch.ElapsedMilliseconds}");
    // 0:132 2:273 1:315 4:460 3:579 6:611 5:890 7:1103

    stopwatch.Restart();
    ParallelEnumerable.Range(0, count)
        .WithMergeOptions(ParallelMergeOptions.NotBuffered)
        .Select(value => ComputingWorkload(value))
        .OrderBy(value => value) // Eager evaluation.
        .WriteLines(value => $"{value}:{stopwatch.ElapsedMilliseconds}");
    // 0:998 1:999 2:999 3:1000 4:1000 5:1000 6:1001 7:1001

    stopwatch.Restart();
    ParallelEnumerable.Range(0, count)
        .WithMergeOptions(ParallelMergeOptions.FullyBuffered)
        .Select(value => ComputingWorkload(value))
        .OrderBy(value => value) // Eager evaluation.
        .WriteLines(value => $"{value}:{stopwatch.ElapsedMilliseconds}");
    // 0:984 1:985 2:985 3:986 4:987 5:987 6:988 7:989
}
```

So OrderBy ignores the suggested ParallelMergeOptions and always fully buffer the values, then yield the buffered values.

## Ordering

In Parallel LINQ, it is more complex to control the order of values than in sequential LINQ to Objects. Apparently, the order of values may not be persisted when they are not sequentially processed. Take the indexed Select as example:

```csharp
internal static void SelectWithIndex() => 
    new StaticPartitioner<int>(Enumerable.Range(0, Environment.ProcessorCount * 2))
        .AsParallel()
        .Select((value, index) => $"[{index}]={value}")
        .WriteLines(); // [0]=0 [1]=2 [2]=4 [3]=5 [4]=6 [5]=1 [6]=3 [7]=7
```

As demonstrated above, WithMergeOptions can impact the order of query results, where ParallelMergeOptions.FullyBuffered can be specified to preserve the order. Parallel LINQ also provides other APIs to control the order.

### Control the order

AsOrdered method can be called to specify the order of values should be preserved for its following query method calls:

```csharp
public static ParallelQuery<TSource> AsOrdered<TSource>(this ParallelQuery<TSource> source);
```

AsOrdered can only be called on the ParallelQuery<T> instance returned by ParallelEnumerable.AsParallel, ParallelEnumerable.Range, and ParallelEnumerable.Repeat. It throws InvalidOperationException for ParallelQuery<T> instance returned by any other methods.

```csharp
internal static void AsOrdered()
{
    Enumerable
        .Range(0, Environment.ProcessorCount * 2)
        .AsParallel()
        .Select(value => value + ComputingWorkload())
        .WriteLines(); // 3 1 2 0 4 5 6 7

    Enumerable
        .Range(0, Environment.ProcessorCount * 2)
        .AsParallel()
        .AsOrdered()
        .Select(value => value + ComputingWorkload())
        .WriteLines(); // 0 1 2 3 4 5 6 7
}
```

Preserving the order means additional work. So AsUnordered method is provided to ignore the order of values for its following query method calls:

```csharp
public static ParallelQuery<TSource> AsUnordered<TSource>(this ParallelQuery<TSource> source);
```

It can improve the query performance. Take GroupBy as example, it can execute faster if the source values are explicitly specified to be unordered:

```csharp
internal static void AsUnordered()
{
    Random random = new Random();
    Model[] source = Enumerable
        .Range(0, Environment.ProcessorCount * 10_000)
        .Select(_ => new Model(name: Guid.NewGuid().ToString(), weight: random.Next(1, 100)))
        .ToArray();

    Stopwatch stopwatch = Stopwatch.StartNew();
    source
        .AsParallel()
        .GroupBy(model => model.Weight, model => model.Name)
        .ForAll();
    stopwatch.Stop();
    stopwatch.ElapsedMilliseconds.WriteLine(); // 35.

    stopwatch.Restart();
    source
        .AsParallel()
        .AsUnordered()
        .GroupBy(model => model.Weight, model => model.Name)
        .ForAll();
    stopwatch.Stop();
    stopwatch.ElapsedMilliseconds.WriteLine(); // 2.
}
```

And the order introduced by OrderBy/OrderByDescending/ThenBy/ThenByDescending/Reverse is preserved in their following query method calls:

```csharp
internal static void OrderBy()
{
    Enumerable
        .Range(0, Environment.ProcessorCount * 2)
        .AsParallel()
        .Select(value => value) // Order is not preserved.
        .WriteLines(); // 3 1 2 0 4 5 6 7

    Enumerable
        .Range(0, Environment.ProcessorCount * 2)
        .AsParallel()
        .Select(value => value) // Order is not preserved.
        .OrderBy(value => value) // Order is introduced.
        .Select(value => value) // Order is preserved.
        .WriteLines(); // 3 1 2 0 4 5 6 7
}
```

### Order and correctness

In Parallel LINQ, many methods are order sensitive. If the source values are unordered:

-   ElementAt: returns arbitrary value
-   ElementAtOrDefault: returns arbitrary value or default
-   First: returns arbitrary value
-   FirstOrDefault: returns arbitrary value or default
-   Last: returns arbitrary value
-   LastOrDefault: returns arbitrary value or default
-   Reverse: does nothing
-   SequenceEqual: compares values in arbitrary order
-   Skip: skips arbitrary values
-   SkipWhile: skips arbitrary values
-   Take: takes arbitrary values
-   TakeWhile: takes arbitrary values with the predicate
-   Zip: zips unordered values

```csharp
internal static void Correctness()
{
    int count = Environment.ProcessorCount * 4;
    int[] source = Enumerable.Range(0, count).ToArray(); // 0 ... 15.

    int elementAt = new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .ElementAt(count / 2).WriteLine() // Expected: 8, 
        .WriteLine(); // Actual: 2.

    int first = new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .First() // Expected: 0.
        .WriteLine(); // Actual: 3.

    int last = new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .Last() // Expected: 15.
        .WriteLine(); // Actual: 13.

    new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .Take(count / 2) // Expected: 0 ... 7.
        .WriteLines(); // Actual: 3 2 5 7 10 11 14 15.

    new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .Skip(count / 2) // Expected: 8 ... 15.
        .WriteLines(); // Actual: 3 0 7 5 11 10 15 14.

    new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .TakeWhile(value => value <= count / 2) // Expected: 0 ... 7.
        .WriteLines(); // Actual: 3 5 8.

    new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .SkipWhile(value => value <= count / 2) // Expected: 9 ... 15.
        .WriteLines(); // Actual: 1 3 2 13 5 7 6 11 9 10 15 12 14.

    new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .Reverse() // Expected: 15 ... 0.
        .WriteLines(); // Actual: 12 8 4 2 13 9 5 1 14 10 6 0 15 11 7 3.

    bool sequentialEqual = new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .SequenceEqual(new StaticPartitioner<int>(source).AsParallel()); // Expected: True.
    sequentialEqual.WriteLine(); // Actual: False.

    new StaticPartitioner<int>(source).AsParallel().Select(value => value + ComputingWorkload())
        .Zip(
            second: new StaticPartitioner<int>(source).AsParallel(),
            resultSelector: (a, b) => $"({a}, {b})") // Expected: (0, 0) ... (15, 15).
        .WriteLines(); // Actual: (3, 8) (0, 12) (1, 0) (2, 4) (6, 9) (7, 13) ...
}
```

So they must be used with ordered source to return the correct query results.

And, once again, ForAll pulls values and calls the specified function in parallel, and does not maintain the order as well.

### Orderable partitioner

.NET also provides APIs for partitioning with order control. The contract is the the System.Collections.OrderablePartitioner<TSource> abstract class, which inherits the fore mentioned Partitioner<TSource> type. The following are the new members in OrderablePartitioner<TSource>:

```csharp
namespace System.Collections.Concurrent
{
    public abstract class OrderablePartitioner<TSource> : Partitioner<TSource>
    {
        protected OrderablePartitioner(bool keysOrderedInEachPartition, bool keysOrderedAcrossPartitions, bool keysNormalized)
        {
            this.KeysOrderedInEachPartition = keysOrderedInEachPartition;
            this.KeysOrderedAcrossPartitions = keysOrderedAcrossPartitions;
            this.KeysNormalized = keysNormalized;
        }

        public bool KeysNormalized { get; }

        public bool KeysOrderedInEachPartition { get; }

        public bool KeysOrderedAcrossPartitions { get; }

        public abstract IList<IEnumerator<KeyValuePair<long, TSource>>> GetOrderablePartitions(int partitionCount);

        public virtual IEnumerable<KeyValuePair<long, TSource>> GetOrderableDynamicPartitions() =>
            throw new NotSupportedException("Dynamic partitions are not supported by this partitioner.");
    }
}
```

Instead of providing partitions of values, orderable partitioner provides partitions of key value pairs, where key is the index of source value. Its GetOrderablePartitions is the parity with Partitioner<TSource>.GetPartitions, return a list of iterators that yield values with keys; GetOrderableDynamicPartitions is the parity with Partitioner<TSource>.GetDynamicPartitions, also yields values with keys; Its KeysNormalized property returns a bool value to indicate whether the keys increase from 0; Its KeysOrderedInEachPartition indicates whether in each partition, keys increase, so that a later value’s key is greater then an former value’s key; And its KeysOrderedAcrossPartitions indicates whether keys increase partition by partition, so that a later partition’s keys are greater then an former partition’s keys. Orderable partitioner is also easy to implement with EnumerableEx.Share and IBuffer<T>:

```csharp
public class OrderableDynamicPartitioner<TSource> : OrderablePartitioner<TSource>
{
    private readonly IBuffer<KeyValuePair<long, TSource>> buffer;

    public OrderableDynamicPartitioner(IEnumerable<TSource> source)
        : base(keysOrderedInEachPartition: true, keysOrderedAcrossPartitions: true, keysNormalized: true)
    {
        long index = -1;
        this.buffer = source
            .Select(value => new KeyValuePair<long, TSource>(Interlocked.Increment(ref index), value))
            .Share();
    }

    public override bool SupportsDynamicPartitions => true;

    public override IList<IEnumerator<KeyValuePair<long, TSource>>> GetOrderablePartitions(
        int partitionCount) => Enumerable
            .Range(0, partitionCount)
            .Select(_ => this.buffer.GetEnumerator())
            .ToArray();

    public override IEnumerable<KeyValuePair<long, TSource>> GetOrderableDynamicPartitions() => this.buffer;
}
```

Orderable partitioner can be used with AsOrdered:

```csharp
internal static partial class Partitioning
{
    internal static void PartitionerAsOrdered()
    {
        int[] source = Enumerable.Range(0, Environment.ProcessorCount * 2).ToArray();
        new OrderableDynamicPartitioner<int>(source)
            .AsParallel()
            .Select(value => value + ComputingWorkload())
            .WriteLines(); // 1 0 5 3 4 6 2 7

        new OrderableDynamicPartitioner<int>(source)
            .AsParallel()
            .AsOrdered()
            .Select(value => value + ComputingWorkload())
            .WriteLines(); // 0 ... 7

        new DynamicPartitioner<int>(source)
            .AsParallel()
            .AsOrdered()
            .Select(value => value + ComputingWorkload())
            .WriteLines();
        // InvalidOperationException: AsOrdered may not be used with a partitioner that is not orderable.
    }
}
```

## Aggregation

Parallel LINQ’s Aggregate methods are more sensitive than LINQ to Object.

### Commutativity, associativity and correctness

In Parallel LINQ, Aggregate methods require the provided accumulator functions to be both commutative and associative. Assume func is a function that accepts 2 parameters and returns a result, if func(a, b) ≡ func(b, a), then func is commutative; if func(func(a, b), c) ≡ func(a, func(b, c)), then func is associative. For example:

```csharp
internal static void CommutativeAssociative()
{
    Func<int, int, int> func1 = (a, b) => a + b;
    (func1(1, 2) == func1(2, 1)).WriteLine(); // True, commutative
    (func1(func1(1, 2), 3) == func1(1, func1(2, 3))).WriteLine(); // True, associative.

    Func<int, int, int> func2 = (a, b) => a * b + 1;
    (func2(1, 2) == func2(2, 1)).WriteLine(); // True, commutative
    (func2(func2(1, 2), 3) == func2(1, func2(2, 3))).WriteLine(); // False, not associative.

    Func<int, int, int> func3 = (a, b) => a;
    (func3(1, 2) == func3(2, 1)).WriteLine(); // False, not commutative
    (func3(func3(1, 2), 3) == func3(1, func3(2, 3))).WriteLine(); // True, associative.

    Func<int, int, int> func4 = (a, b) => a - b;
    (func4(1, 2) == func4(2, 1)).WriteLine(); // False, not commutative
    (func4(func4(1, 2), 3) == func4(1, func4(2, 3))).WriteLine(); // False, not associative.
}
```

To demonstrate how parallel aggregation is impacted by commutativity and associativity, it can be compared with sequential aggregation:

```csharp
internal static void AggregateCorrectness()
{
    int count = Environment.ProcessorCount * 2;
    int sequentialAdd = Enumerable.Range(0, count).Aggregate((a, b) => a + b);
    sequentialAdd.WriteLine(); // 28
    int parallelAdd = ParallelEnumerable.Range(0, count).Aggregate((a, b) => a + b);
    parallelAdd.WriteLine(); // 28

    int sequentialSubtract = Enumerable.Range(0, count).Aggregate((a, b) => a - b);
    sequentialSubtract.WriteLine(); // -28
    int parallelSubtract = ParallelEnumerable.Range(0, count).Aggregate((a, b) => a - b);
    parallelSubtract.WriteLine(); // 2
}
```

Apparently, parallelSubtract has incorrect result value, because the function provided to Aggregate is neither commutative nor associative. The following code visualizes the aggregation:

```csharp
internal static void VisualizeAggregate()
{
    int count = Environment.ProcessorCount * 2;
    using (Markers.EnterSpan(-1, "Sequential subtract"))
    {
        MarkerSeries markerSeries = Markers.CreateMarkerSeries("Sequential subtract");
        int sequentialSubtract = Enumerable.Range(0, count).Aggregate((a, b) =>
        {
            using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, $"{a}, {b} => {a - b}"))
            {
                return a - b + ComputingWorkload();
            }
        });
    }

    using (Markers.EnterSpan(-2, "Parallel subtract"))
    {
        MarkerSeries markerSeries = Markers.CreateMarkerSeries("Parallel subtract");
        int parallelSubtract = ParallelEnumerable.Range(0, count).Aggregate((a, b) =>
        {
            using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, $"{a}, {b} => {a - b}"))
            {
                return a - b + ComputingWorkload();
            }
        });
    }
}
```

> The sequential aggregation has the expected process:
> 
> [![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb1_2.png)
> 
> The parallel aggregation has different behavior:
> 
> [![image_thumb2](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb2_thumb.png "image_thumb2")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-3-Query-Methods-Operators_8F49/image_thumb2_2.png)

It follows the pattern of parallel query methods. It first partitions the data. On this quad core CPU, it splits the 8 source values into 4 partitions, (0, 1), (2, 3), (4, 5), (6, 7). Then it execute the provided function for each parallel in parallel, the 4 partitions’ result values are –1, –1, –1, –1. And finally it merges the 4 result values with the provided function, so the final aggregation result is 2. This demonstrates that the accumulator function must be commutative and associative for the parallel aggregation.

### Partition and merge

Parallel LINQ provides 2 additional Aggregate overloads, where the seed for each partition be specified with either a value or a value factory function:

```csharp
public static TResult Aggregate<TSource, TAccumulate, TResult>(
    this ParallelQuery<TSource> source, 
    TAccumulate seed, 
    Func<TAccumulate, TSource, TAccumulate> updateAccumulatorFunc, 
    Func<TAccumulate, TAccumulate, TAccumulate> combineAccumulatorsFunc, 
    Func<TAccumulate, TResult> resultSelector);

public static TResult Aggregate<TSource, TAccumulate, TResult>(
    this ParallelQuery<TSource> source, 
    Func<TAccumulate> seedFactory, 
    Func<TAccumulate, TSource, TAccumulate> updateAccumulatorFunc, 
    Func<TAccumulate, TAccumulate, TAccumulate> combineAccumulatorsFunc, 
    Func<TAccumulate, TResult> resultSelector);
```

They also both accept 2 accumulator functions. First, updateAccumulatorFunc can be read as “source value accumulator”, it accumulates the values within each partition to a partition result. So if there are N partitions, there are N partition results. Then, combineAccumulatorsFunc can be read as “partition result accumulator”, it accumulates all partitions’ results to a single final result. The following example calculates the sum of squares:

```csharp
internal static void MergeForAggregate()
{
    int count = Environment.ProcessorCount * 2;
    int sequentialSumOfSquares = Enumerable
        .Range(0, count)
        .Aggregate(seed: 0, func: (accumulate, value) => accumulate + value * value);
    sequentialSumOfSquares.WriteLine(); // 140

    int parallelSumOfSquares1 = ParallelEnumerable
        .Range(0, Environment.ProcessorCount * 2)
        .Aggregate(
            seed: 0, // Seed for each partition.
            updateAccumulatorFunc: (accumulation, value) => accumulation + value * value, // Source value accumulator for each partition's result.
            combineAccumulatorsFunc: (accumulation, partition) => accumulation + partition, // Partition result accumulator for final result.
            resultSelector: result => result);
    parallelSumOfSquares1.WriteLine(); // 140

    int parallelSumOfSquares2 = ParallelEnumerable
        .Range(0, Environment.ProcessorCount * 2)
        .Aggregate(
            seedFactory: () => 0, // Seed factory for each partition.
            updateAccumulatorFunc: (accumulation, value) => accumulation + value * value, // Source value accumulator for each partition's result.
            combineAccumulatorsFunc: (accumulation, partition) => accumulation + partition, // Partition result accumulator for final result.
            resultSelector: result => result);
    parallelSumOfSquares2.WriteLine(); // 140
}
```

In the parallel aggregation, first the sum of squares are calculated for each partition. Then all partitions’ results are merged by summing up.