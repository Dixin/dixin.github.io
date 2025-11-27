---
title: "Parallel LINQ in Depth (2) Partitioning"
published: 2018-09-26
description: "The first step of Parallel LINQ is partitioning. The source values is split into several partitions, so that multiple threads can execute the query logic in parallel."
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

## **Latest version: [https://weblogs.asp.net/dixin/parallel-linq-2-partitioning](/posts/parallel-linq-2-partitioning "https://weblogs.asp.net/dixin/parallel-linq-2-partitioning")**

The first step of Parallel LINQ is partitioning. The source values is split into several partitions, so that multiple threads can execute the query logic in parallel.

## Partitioning algorithms and load balancing

In Parallel LINQ, there are 4 kinds of partitioning algorithms – range partitioning, chunk partitioning, strip partitioning, and hash partitioning.

### Range partitioning

Range partitioning works with indexed source sequence has known length, like T\[\] arrays with a Length property, and IList<T> lists with a Count property. Assume on a quad core CPU, if there are 12 values in the source, by default Parallel LINQ splits these 12 values (at indexes 0, 1, 2, …, 11) into 4 partition A, B, C, D:
```
Index:     0  1  2  3  4  5  6  7  8  9 10 11
Partition: A  A  A, B  B  B, C  C  C, D  D  D
```

If there are 13 source values, their are partitioned as: AAAA, BBB, CCC, DDD; 14 values are partitioned as AAAA, BBBB, CCC, DDD; 15 values are partitioned as AAAA, BBBB, CCCC, DDD; 16 values are partitioned as AAAA, BBBB, CCCC, DDDD; and so on.

With the Visualize and ComputingWorkload methods defined previously, the following code can visualize how an array is partitioned by range of index:
```
internal static partial class Partitioning
{
    internal static void Range()
    {
        int[] array = Enumerable.Range(0, Environment.ProcessorCount * 4).ToArray();
        array.AsParallel().Visualize(value => ComputingWorkload(value), nameof(Range));
    }
}
```

> Execute this method with Concurrency Visualizer for Visual Studio, the following chart is generated:
> 
> [![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb1_2.png)
> 
> Here the timespan of value 12 is longer than the timespan of 15, because CPU was fully used at the beginning. Regarding there are also other processes and thread running on the device, when processing value 12, the query thread cannot ideally utilize 25% of CPU (100% of one core). It also shows the threads do not balance the load very well. For example, thread 19140 is done with a partition (0, 1, 2, 3) quickly, then it becomes idle and just waits for other threads to be done with other partitions.

### Stripped partitioning

Stripped partitioning can work with non-indexed source. In this algorithm, each Parallel LINQ query thread pulls the first value from the source. when each thread is done with a done, it tried to pull the first value again, until the source becomes empty. Still assume a quad core CPU, and assume it costs about the same time for each thread to process each value, then the partitioning result is:
```
Index:     0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 ...
Partition: A  B  C  D  A  B  C  D  A  B  C  D  A  B  C  D ...
```

Take a simple IEnumerable<T> source as example:
```
internal static void Strip()
{
    IEnumerable<int> source = Enumerable.Range(0, Environment.ProcessorCount * 4);
    source.AsParallel().Visualize(ParallelEnumerable.Select, value => ComputingWorkload(value)).ForAll();
}
```

> The visualization is:
> 
> [![image_thumb2](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb2_thumb.png "image_thumb2")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb2_2.png)

A benefit of stripped partitioning is that threads can balance the load. To demonstrate this, just tweak above code a little bit:
```
internal static void StripLoadBalance()
{
    IEnumerable<int> source = Enumerable.Range(0, Environment.ProcessorCount * 4);
    source.AsParallel().Visualize(ParallelEnumerable.Select, value => ComputingWorkload(value % 2)).ForAll();
}
```

> [![image_thumb4](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb4_thumb.png "image_thumb4")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb4_2.png)

Firstly, the 4 query threads pulls 4 values 0, 1, 2, 3 to process. Apparently, threads processing 0 and 2 get the jobs done sooner. They are not idle, and immediately starts to pull the following values 4 and 5 to process. As a result, the load is better balanced, 4 threads finish the query with similar time.

To enable stripped partitioning for arrays and lists, call System.Collections.Concurrency.Partitioner’s Create method:
```
internal static void StripForArray()
{
    int[] array = Enumerable.Range(0, Environment.ProcessorCount * 4).ToArray();
    Partitioner.Create(array, loadBalance: true).AsParallel().Visualize(value => ComputingWorkload(value), nameof(Strip));
}
```

Here Partitioner.Create returns Partitioner<T> which implements load balanced strip partitioning. Then another ParallelEnumerable.AsParallel overload can be called on it:
```
public static ParallelQuery<TSource> AsParallel<TSource>(this Partitioner<TSource> source);
```

The Partitioner<TSource> type will be discussed later.

### Hash partitioning

When Parallel LINQ needs to compare values in the source, like GroupBy, Join, GroupJoin, etc., it partitions the values based on hash code. As a result, values with the same hash code are processed by the same thread. To demonstrate this behavior, a data structure with a custom hash algorithm can be defined:
```
internal readonly struct Data
{
    internal Data(int value) => this.Value = value;

    internal int Value { get; }

    public override int GetHashCode() => this.Value % Environment.ProcessorCount;

    public override bool Equals(object obj) => obj is Data && this.GetHashCode() == ((Data)obj).GetHashCode();

    public override string ToString() => this.Value.ToString();
}
```

It just wraps an Int32 value, but only produces 4 kinds of hash code on a quad core CPU.

GroupBy query can be visualized by the other Visualize overload from previous part:
```
internal static void HashInGroupBy()
{
    IEnumerable<Data> source = new int[] { 0, 1, 2, 2, 2, 2, 3, 4, 5, 6, 10 }.Select(value => new Data(value));
    source.AsParallel()
        .Visualize(
            (parallelQuery, elementSelector) => parallelQuery.GroupBy(
                keySelector: data => data, // Key instance's GetHashCode will be called.
                elementSelector: elementSelector),
            data => ComputingWorkload(data.Value)) // elementSelector.
        .ForAll();
    // Equivalent to:
    // MarkerSeries markerSeries = Markers.CreateMarkerSeries("Parallel");
    // source.AsParallel()
    //    .GroupBy(
    //        keySelector: data => data,
    //        elementSelector: data =>
    //        {
    //            using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, data.ToString()))
    //            {
    //                return ComputingWorkload(data.Value);
    //            }
    //        })
    //    .ForAll();
}
```

> [![image_thumb5](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb5_thumb.png "image_thumb5")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb5_2.png)

Here GroupBy uses Data instances as the keys, where Data.GetHashCode is called, and the returned hash codes are used for partitioning. Also, apparently there is no load balance. And the following the visualization of Join:
```
internal static void HashInJoin()
{
    IEnumerable<Data> outerSource = new int[] { 0, 1, 2, 2, 2, 2, 3, 6 }.Select(value => new Data(value));
    IEnumerable<Data> innerSource = new int[] { 4, 5, 6, 7 }.Select(value => new Data(value));
    outerSource.AsParallel()
        .Visualize(
            (parallelQuery, resultSelector) => parallelQuery
                .Join(
                    inner: innerSource.AsParallel(),
                    outerKeySelector: data => data, // Key instance's GetHashCode is called.
                    innerKeySelector: data => data, // Key instance's GetHashCode is called.
                    resultSelector: (outerData, innerData) => resultSelector(outerData)),
            data => ComputingWorkload(data.Value)) // resultSelector.
        .ForAll();
}
```

> [![image_thumb7](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb7_thumb.png "image_thumb7")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb7_2.png)

### Chunk partitioning

Parallel LINQ also implements chunk partitioning, where each thread pulls a chunk of values from the source. Initially the chunk size is 1, each thread pulls a chunk for 3 times; Then the chunk size increases to 2, and each thread pulls a chunk for 3 times; Then the chunk size increase to 3, and each thread pulls a chunk for 3 times again; and so on. On a quad core CPU, Parallel LINQ creates 4 partitions A, B, C, D by default, and the partitioning is: ABCD ABCD ABCD AABBCCDD AABBCCDD AABBCCDD AAABBBCCCDDD ... Another overload of Partitioner.Create can create such a chunk partitioner:
```
internal static void Chunk()
{
    IEnumerable<int> source = Enumerable.Range(0, (1 + 2) * 3 * Environment.ProcessorCount + 3);
    Partitioner.Create(source, EnumerablePartitionerOptions.None).AsParallel()
        .Visualize(ParallelEnumerable.Select, _ => ComputingWorkload())
        .ForAll();
}
```

Executing this query on a quad core CPU, the first 12 chunks have 1 value in each chunk, the next 12 chunks have 2 values in each chunk, then the 25th chunk has 3 values, and so on:

> [![image_thumb8](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb8_thumb.png "image_thumb8")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb8_2.png)

Stripped partitioning can be viewed as a special case of chunk partitioning, where chunk size is always 1. And for this reason, stripped partition can have better load balance.

## Implement custom partitioner

.NET also provides APIs to implement custom partitioning. The contract is the System.Collections.Partitioner<TSource> abstract class:

```csharp
namespace System.Collections.Concurrent
{
    public abstract class Partitioner<TSource>
    {
        protected Partitioner() { }

        public virtual bool SupportsDynamicPartitions => false;

        public abstract IList<IEnumerator<TSource>> GetPartitions(int partitionCount);

        public virtual IEnumerable<TSource> GetDynamicPartitions() =>
            throw new NotSupportedException("Dynamic partitions are not supported by this partitioner.");
    }
}
```

### Static partitioner

The GetPartitions method is used to return the specified number of partitions, and each partition is represented by an iterator, which yields the values of each partition. This design of having multiple IEnumerator<T> iterators to share one IEnumerable<T> sequence, is the same idea as the EnumerableEx.Share and IBuffer<T> from Interactive Extenson (Ix) library discussed in the LINQ to Objects chapter. So an simple static partitioner can be implemented as a wrapper of IBuffer<T> created by Share:

```csharp
public class StaticPartitioner<TSource> : Partitioner<TSource>
{
    protected readonly IBuffer<TSource> buffer;

    public StaticPartitioner(IEnumerable<TSource> source) => this.buffer = source.Share();

    public override IList<IEnumerator<TSource>> GetPartitions(int partitionCount)
    {
        if (partitionCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(partitionCount));
        }

        return Enumerable
            .Range(0, partitionCount)
            .Select(_ => this.buffer.GetEnumerator())
            .ToArray();
    }
}
```

As demonstrated above, now the AsParallel for partitioner can be called:
```
internal static void StaticPartitioner()
{
    IEnumerable<int> source = Enumerable.Range(0, Environment.ProcessorCount * 4);
    new StaticPartitioner<int>(source).AsParallel()
        .Visualize(ParallelEnumerable.Select, value => ComputingWorkload(value))
        .ForAll();
}
```

Parallel LINQ only calls the GetPartitions method, and start to query the returned partitions in parallel. Apparently IBuffer<T> implements stripped partitioning.

> [![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-2-Partitioning_8EAF/image_thumb_2.png)

### Dynamic partitioner

When a partitioner’s SupportsDynamicPartitions property returns true, it is a dynamic partitioner. Besides splitting source into a specified static number of iterators like above, dynamic partitioner’s GetDynamicPartitions can also split source into arbitrary number of partitions. GetDynamicPartitions returns a IEnumerable<T> sequence, whose GetEnumerator method can be called at any time, and can be called arbitrary times, to return arbitrary number of IEnumerator<T> iterators. This scenario is still supported by IBuffer<T>, so:

```csharp
public class DynamicPartitioner<TSource> : StaticPartitioner<TSource>
{
    public DynamicPartitioner(IEnumerable<TSource> source) : base(source) { }

    public override bool SupportsDynamicPartitions => true;

    public override IEnumerable<TSource> GetDynamicPartitions() => this.buffer;
}
```

Parallel LINQ only calls the GetPartitions method, so for sure above DynamicPartitioner can be used in Parallel LINQ. Dynamic partitioner can be also used for System.Threading.Tasks.Parallel’s ForEach method:

```csharp
namespace System.Threading.Tasks
{
    public static class Parallel
    {
        public static ParallelLoopResult ForEach<TSource>(Partitioner<TSource> source, Action<TSource> body);
    }
}
```

Parallel.ForEach first calls SupportsDynamicPartitions. If false is returned, it throws an InvalidOperationException: The Partitioner used here must support dynamic partitioning; If true is returned, it then calls GetDynamicPartitions to partition the values and call the specified callback function in parallel for each partition:
```
internal static void DynamicPartitioner()
{
    IEnumerable<int> source = Enumerable.Range(0, Environment.ProcessorCount * 4);
    Parallel.ForEach(new DynamicPartitioner<int>(source), value => ComputingWorkload(value));
}
```

Parallel.ForEach has another overload accepting an IEnumerable<T> sequence, which is more commonly used:
```
public static ParallelLoopResult ForEach<TSource>(IEnumerable<TSource> source, Action<TSource> body);
```

Internally, it calls the fore mentioned Partitioner.Create method to create a dynamic partitioner from the source sequence, then use the dynamic partitioner to call the specified callback function in parallel.