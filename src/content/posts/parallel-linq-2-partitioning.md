---
title: "Parallel LINQ in Depth (2) Partitioning"
published: 2019-09-22
description: "The previous chapter discussed what is PLINQ and how to use PLINQ. This chapter looks into PLINQ’s internals and execution, including data processing and query performance."
image: ""
tags: [".NET", "C#", "LINQ", "Parallel Computing", "Parallel LINQ", "PLINQ"]
category: "Parallel LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

The previous chapter discussed what is PLINQ and how to use PLINQ. This chapter looks into PLINQ’s internals and execution, including data processing and query performance.

## Internal partitioning and load balancing

To execute query with multithreading, PLINQ must split the data source’s values for those query threads as the first step. Internally, PLINQ has 4 different data partitioning algorithms – range partitioning, chunk partitioning, strip partitioning, and hash partitioning. These partitioning algorithms lead to different load balancing among the multiple query threads, and impact the overall performance.

### Range partitioning

Range partitioning works with indexed source with a known length, such as T \[\] arrays with an indexer and Length property, and IList<T> lists with an indexer and Count property. Assume on a quad core CPU, there are 12 values in the source array, by default PLINQ splits these 12 values (at indexes 0, 1, 2, …, 11) into 4 partition A, B, C, D as the following:

Index: 0 1 2 3 4 5 6 7 8 9 10 11

Partition: A A A B B B C C C D D D

If there are 13 source values, there are partitioned as: AAAA, BBB, CCC, DDD; 14 values are partitioned as AAAA, BBBB, CCC, DDD; 15 values are partitioned as AAAA, BBBB, CCCC, DDD; 16 values are partitioned as AAAA, BBBB, CCCC, DDDD; and so on.

With the Visualize and ComputingWorkload functions defined in the previous chapter, the following code can visualize how an array is partitioned by range of index:

internal static void RangePartitioningForArray()

```csharp
{
```
```csharp
int[] array = Enumerable.Range(0, Environment.ProcessorCount * 4).ToArray();
```
```csharp
array.AsParallel()
```
```csharp
.Visualize(ParallelEnumerable.Select, value => ComputingWorkload(value))
```
```csharp
.WriteLines();
```

}

Execute the above code with Concurrency Visualizer for Visual Studio, the following chart is rendered:

Here the timespan of processing value 12 is longer than the timespan of processing value 15, because CPU was fully utilized at the beginning. Regarding there are also other processes and threads running on the device, when processing value 12, the query thread cannot ideally utilize 25% of CPU (100% of one core). In range partitioning, since each value of the source goes to a deterministic partition based on the value’s index, synchronization is not required for multiple query threads to simultaneously pull values from a shared source. This algorithm does not consider the actual work of the query threads, so it does not balance the load very well. For example, the partition (0, 1, 2, 3) is quickly processed by a query thread, then that thread becomes idle and just waits for other threads to be done with other partitions.

### Chunk partitioning

Chunk partitioning can be used for sequence without index, where each thread pulls a chunk of values at a time. The chunk size starts from 1, and increases to 2, 4, 8, 16, …. Initially the chunk size is 1, each thread repeatedly pulls N chunks; Then the chunk size increases to 2, and each thread repeatedly pulls N chunks again; Then the chunk size increase to 4, and each thread repeatedly pulls another N chunk again; and so on. For a sequence, the chunk repeat count N is implemented as 8. Assume a quad core CPU, PLINQ split values in source into 4 partitions A, B, C, D by default, then the partitioning for source values is: ABCD, ABCD, …, AABBCCDD, AABBCCDD, …, AAAABBBBCCCCDDDD, AAAABBBBCCCCDDDD, ..., assuming each value’s processing cost the same time. The following code visualizes the chunk partitioning for a sequence without index:

internal static void ChunkPartitioningForSequence()

```csharp
{
```
```csharp
const int ChunkRepeatCount = 8;
```
```csharp
IEnumerable<int> sequence = Enumerable.Range(
```
```csharp
0, (1 + 2) * ChunkRepeatCount * Environment.ProcessorCount + 4);
```
```csharp
sequence.AsParallel()
```
```csharp
.Visualize(ParallelEnumerable.Select, value => value + ComputingWorkload())
```
```csharp
.WriteLines();
```

}

When executing this query on a quad core CPU, for each query thread, the first 8 chunks have 1 value in each chunk, the next 8 chunks have 2 continuous values in each chunk, the last chunk has 4 continuous values, and they are all partitioned to one thread:

With chuck partitioning, synchronization is required for multiple query threads to access the shared source, so that each chunk of values is exclusively pulled by one thread. Internally, PLINQ utilizes C# lock statement with a synchronization object to synchronize the query threads. This approach can balance the load at chunk level, which has an incremental size.

When chunk partitioning is used for partitioner, the chunk repeat count N is implemented as 3. The easiest way to create a partitioner is to call Partitioner.Create with a sequence:

internal static void ChunkPartitioningForPartitioner()

```csharp
{
```
```csharp
const int ChunkRepeatCount = 3;
```
```csharp
Partitioner<int> partitioner = Partitioner.Create(
```
```csharp
Enumerable.Range(0, (1 + 2) * ChunkRepeatCount * Environment.ProcessorCount + 4));
```
```csharp
partitioner.AsParallel()
```
```csharp
.Visualize(ParallelEnumerable.Select, value => value + ComputingWorkload())
```
```csharp
.WriteLines();
```

}

Here Partitioner.Create has a Partitioner<T> output. The Partitioner<TSource> type is the contract to implement partitioning, which is discussed later in this chapter. Then the ParallelEnumerable.AsParallel overload for Partitioner<T> can be called:

public static ParallelQuery<TSource> AsParallel<TSource>(

this Partitioner<TSource> source);

From there the PLINQ queries can be used subsequently. With a smaller repeat count, the chunks are more intuitive:

### Hash partitioning

When PLINQ query needs to compare and group values in the source, like GroupBy, Join, GroupJoin, etc., it partitions the values based on hash code. To demonstrate this behaviour, a data structure with a custom hash algorithm can be defined:

internal readonly struct Data

```csharp
{
```
```csharp
internal Data(int value) => this.Value = value;
```

```csharp
internal int Value { get; }
```

```csharp
public override int GetHashCode() => this.Value % Environment.ProcessorCount;
```

```csharp
public override string ToString() => this.Value.ToString(); // For span label.
```

}

It just wraps an int value, but only produces 4 different hash code on a quad core CPU. The following code visualize how GroupBy query executes its elementSelector function:

internal static void HashPartitioningForGroupBy()

```csharp
{
```
```csharp
IEnumerable<Data> sequence = new int[] { 0, 1, 2, 2, 2, 2, 3, 4, 5, 6, 10 }
```
```csharp
.Select(value => new Data(value));
```
```csharp
sequence.AsParallel()
```
```csharp
.Visualize(
```
```csharp
(source, elementSelector) => source.GroupBy(
```
```csharp
keySelector: data => data, // Key's GetHashCode is called.
```
```csharp
elementSelector: elementSelector),
```
```csharp
data => ComputingWorkload(data.Value).ToString()) // elementSelector.
```
```csharp
.WriteLines(group => string.Join(", ", group));
```
```csharp
// Equivalent to:
```
```csharp
// MarkerSeries markerSeries = Markers.CreateMarkerSeries("Parallel");
```
```csharp
// source.AsParallel()
```
```csharp
// .GroupBy(
```
```csharp
// keySelector: data => data,
```
```csharp
// elementSelector: data =>
```
```csharp
// {
```
```csharp
// using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, data.ToString()))
```
```csharp
// {
```
```csharp
// return ComputingWorkload(data.Value);
```
```csharp
// }
```
```csharp
// })
```
```csharp
// .WriteLines(group => string.Join(", ", group));
```

}

Here GroupBy uses Data instances as the keys, it internally calls each Data instance’s GetHashCode method, and uses the output hash codes for equality comparison and grouping, then it processes the Data instances group by group with multiple query threads. As a result, Data instances with the same hash code is partitioned together and processed by the same query thread. Apparently, hash partitioning balances the load at group level. The synchronization work is required when pulling each group exclusively.

Similarly, the following example visualizes how Join query executes its resultSelector function:

internal static void HashPartitioningForJoin()

```csharp
{
```
```csharp
IEnumerable<Data> outerSource = new int[] { 0, 1, 2, 2, 2, 2, 3, 6 }.Select(value => new Data(value));
```
```csharp
IEnumerable<Data> innerSource = new int[] { 4, 5, 6, 7 }.Select(value => new Data(value));
```
```csharp
outerSource.AsParallel()
```
```csharp
.Visualize(
```
```csharp
(source, resultSelector) => source
```
```csharp
.Join(
```
```csharp
inner: innerSource.AsParallel(),
```
```csharp
outerKeySelector: data => data, // Key's GetHashCode is called.
```
```csharp
innerKeySelector: data => data, // Key's GetHashCode is called.
```
```csharp
resultSelector: (outerData, innerData) => resultSelector(outerData)),
```
```csharp
data => ComputingWorkload(data.Value)) // resultSelector.
```
```csharp
.WriteLines();
```

}

Again, Data instances with the same hash code are partitioned together and processed by the same query thread:

### Stripped partitioning

Stripped partitioning can work with source with or without index. In this algorithm, each PLINQ query thread just pulls one value from the source each time. when the thread finishes processing that value, it pulls another one value again, until the source has no value available. Still assume a quad core CPU, and assume it costs the same time for to process each value, then the partitioning result is:

Index: 0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 ...

Partition: A B C D A B C D A B C D A B C D ...

Partitioner.Create has an overload for sequence source to create partitioner that implements stripped partitioning:

internal static void StrippedPartitioningForPartitionerWithSequence()

```csharp
{
```
```csharp
Partitioner<int> partitioner = Partitioner.Create(
```
```csharp
Enumerable.Range(0, Environment.ProcessorCount * 10),
```
```csharp
EnumerablePartitionerOptions.NoBuffering);
```
```csharp
partitioner.AsParallel()
```
```csharp
.Visualize(ParallelEnumerable.Select, value => ComputingWorkload())
```
```csharp
.WriteLines();
```

}

Patitioner.Create’s EnumerablePartitionerOptions parameter has 2 members, None and NoBuffering. If None is specified, a partitioner is created to implement chunk partitioning; If NoBuffering is specified, a partitioner is created to implement stripped partitioning. The above code renders the following chart:

Partitioner.Create also provides similar overloads for array and list. Take the previous array as example:

internal static void StrippedPartitioningForPartitionerWithArray()

```csharp
{
```
```csharp
int[] array = Enumerable.Range(0, Environment.ProcessorCount * 4).ToArray();
```
```csharp
Partitioner<int> partitioner = Partitioner.Create(array, loadBalance: true);
```
```csharp
partitioner.AsParallel()
```
```csharp
.Visualize(ParallelEnumerable.Select, value => ComputingWorkload(value))
```
```csharp
.WriteLines();
```

}

Partitioner.Create’s loadBalance parameter is a bool value. If false is specified, a partitioner is created to implement range partitioning; If true is specified, a partitioner is created to implement stripped partitioning. The above code renders the following chart:

## Implementing custom partitioner

.NET Standard also provides APIs to implement custom partitioning. The contract is the System.Collections.Partitioner<TSource> abstract class:

namespace System.Collections.Concurrent

```csharp
{
```
```csharp
public abstract class Partitioner<TSource>
```
```csharp
{
```
```csharp
protected Partitioner() { }
```

```csharp
public virtual bool SupportsDynamicPartitions => false;
```

```csharp
public abstract IList<IEnumerator<TSource>> GetPartitions(int partitionCount);
```

```csharp
public virtual IEnumerable<TSource> GetDynamicPartitions() =>
```
```csharp
throw new NotSupportedException("Dynamic partitions are not supported by this partitioner.");
```
```csharp
}
```

}

### Static partitioner

A partitioner’s SupportsDynamicPartitions property has a bool output. When it is false, the partitioner is a static partitioner, which means its GetPartitions method is available. To call GetPartitions, the partition count must be specified at the beginning, so the partition count is static and cannot be changed once partitioning is started. The output of GetPartitions method is a list of iterators, where each iterator is used to yield the values of a partition. This design of having multiple IEnumerator<T> iterators to share one IEnumerable<T> sequence, is the same idea as the EnumerableEx.Share and IBuffer<T> from Ix library discussed in the Ix chapter. So a simple static partitioner can be implemented as a wrapper of IBuffer<T> created by Share:

internal class StaticPartitioner<TSource\> : Partitioner<TSource\>

```csharp
{
```
```csharp
protected readonly IBuffer<TSource> Buffer;
```

```csharp
internal StaticPartitioner(IEnumerable<TSource> source) => this.Buffer = source.Share();
```

```csharp
public override IList<IEnumerator<TSource>> GetPartitions(int partitionCount)
```
```csharp
{
```
```csharp
if (partitionCount <= 0)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(partitionCount));
```
```csharp
}
```

```csharp
return Enumerable
```
```csharp
.Range(0, partitionCount)
```
```csharp
.Select(_ => this.Buffer.GetEnumerator())
```
```csharp
.ToArray();
```
```csharp
}
```

}

As demonstrated above, AsParallel can be called with partitioner:

internal static void QueryStaticPartitioner()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(0, Environment.ProcessorCount * 4);
```
```csharp
new StaticPartitioner<int>(source).AsParallel()
```
```csharp
.Visualize(ParallelEnumerable.Select, value => ComputingWorkload(value))
```
```csharp
.WriteLines();
```

}

The output IBuffer<T> of EnumerableEx.Share implements stripped partitioning. Similar to PLINQ, it internally also utilizes C# lock statement with a synchronization object to make sure each value is exclusively pulled by one thread. The above code renders the following chart:

### Dynamic partitioner

When the output of SupportsDynamicPartitions property is true, the partitioner is a dynamic partitioner. Besides GetPartitions that splits source into specified number of partitions, dynamic partitioner’s GetDynamicPartitions is also available to split source into arbitrary number of partitions. The output of GetDynamicPartitions is a IEnumerable<T> sequence, whose GetEnumerator method can be called to output a IEnumerator<T> iterator that represents a partition. After partitioning is started, the output IEnumerable<T> sequence’s GetEnumerator method can be called again for arbitrary times, so the caller can have dynamic number of partitions. This scenario is still supported by IBuffer<T> from EnumerableEx.Share:

internal class DynamicPartitioner<TSource\> : StaticPartitioner<TSource\>

```csharp
{
```
```csharp
internal DynamicPartitioner(IEnumerable<TSource> source) : base(source) { }
```

```csharp
public override bool SupportsDynamicPartitions => true;
```

```csharp
public override IEnumerable<TSource> GetDynamicPartitions() => this.Buffer;
```

}

Besides PLINQ queries, dynamic partitioner can also be used with System.Threading.Tasks.Parallel’s ForEach function:

namespace System.Threading.Tasks

```csharp
{
```
```csharp
public static class Parallel
```
```csharp
{
```
```csharp
public static ParallelLoopResult ForEach<TSource>(Partitioner<TSource> source, Action<TSource> body);
```
```csharp
}
```

}

Parallel.ForEach first checks SupportsDynamicPartitions. If it gets false, it throws an InvalidOperationException: The Partitioner used here must support dynamic partitioning; If it gets true, it then calls GetDynamicPartitions to partition the values and call the specified iteratee function in parallel for each partition:

internal static void QueryDynamicPartitioner()

```csharp
{
```
```csharp
IEnumerable<int>source = Enumerable.Range(0, Environment.ProcessorCount * 4);
```
```csharp
Parallel.ForEach(
```
```csharp
new DynamicPartitioner<int>(source), value => ComputingWorkload(value));
```

}

Parallel.ForEach has another overload accepting an IEnumerable<T> sequence, which is more commonly used:

public static ParallelLoopResult ForEach<TSource\>(

IEnumerable<TSource\> source, Action<TSource\> body);

Internally, it calls the fore mentioned Partitioner.Create to create a dynamic partitioner from the source sequence.

### Orderable partitioner

.NET also provides APIs for partitioning with order control. The contract is the System.Collections.OrderablePartitioner<TSource> abstract class, which is a subtype of Partitioner<TSource>. The following are the members of OrderablePartitioner<TSource>:

namespace System.Collections.Concurrent

```csharp
{
```
```csharp
public abstract class OrderablePartitioner<TSource> : Partitioner<TSource>
```
```csharp
{
```
```csharp
protected OrderablePartitioner(bool keysOrderedInEachPartition, bool keysOrderedAcrossPartitions, bool keysNormalized)
```
```csharp
{
```
```csharp
this.KeysOrderedInEachPartition = keysOrderedInEachPartition;
```
```csharp
this.KeysOrderedAcrossPartitions = keysOrderedAcrossPartitions;
```
```csharp
this.KeysNormalized = keysNormalized;
```
```csharp
}
```

```csharp
public bool KeysNormalized { get; }
```

```csharp
public bool KeysOrderedInEachPartition { get; }
```

```csharp
public bool KeysOrderedAcrossPartitions { get; }
```

```csharp
public abstract IList<IEnumerator<KeyValuePair<long, TSource>>>GetOrderablePartitions(int partitionCount);
```

```csharp
public virtual IEnumerable<KeyValuePair<long, TSource>>GetOrderableDynamicPartitions() =>
```
```csharp
throw new NotSupportedException("Dynamic partitions are not supported by this partitioner.");
```
```csharp
}
```

}

Instead of providing partitions of values, orderable partitioner provides partitions of key-value pairs, where key is the index of the value. Its GetOrderablePartitions method is the orderable parity with Partitioner<TSource>.GetPartitions, which gives a static count of partitions represented by iterators of index-value pairs; Its GetOrderableDynamicPartitions method is the orderable parity with Partitioner<TSource>.GetDynamicPartitions, which gives a sequence, where GetEnumerator can be called arbitrary times to get dynamic count of partitions; Its KeysNormalized property outputs a bool value to indicate whether the indexes increase from 0; Its KeysOrderedInEachPartition property indicates whether inside each partition, the indexes always increase, so that a later value’s index is always greater than an former value’s index; And its KeysOrderedAcrossPartitions property indicates whether indexes increase partition by partition, so that a later partition’s indexes are all greater than an former partition’s indexes. Once again, it is easy to implement orderable partitioner with EnumerableEx.Share and IBuffer<T>:

internal class OrderableDynamicPartitioner<TSource\> : OrderablePartitioner<TSource\>

```csharp
{
```
```csharp
private readonly IBuffer<KeyValuePair<long, TSource>> buffer;
```

```csharp
internal OrderableDynamicPartitioner(IEnumerable<TSource> source)
```
```csharp
: base(keysOrderedInEachPartition: true, keysOrderedAcrossPartitions: true, keysNormalized: true)
```
```csharp
{
```
```csharp
long index = -1;
```
```csharp
this.buffer = source
```
```csharp
.Select(value => new KeyValuePair<long, TSource>(Interlocked.Increment(ref index), value))
```
```csharp
.Share();
```
```csharp
}
```

```csharp
public override bool SupportsDynamicPartitions => true;
```

```csharp
public override IList<IEnumerator<KeyValuePair<long, TSource>>>GetOrderablePartitions(
```
```csharp
int partitionCount) => Enumerable
```
```csharp
.Range(0, partitionCount)
```
```csharp
.Select(_ => this.buffer.GetEnumerator())
```
```csharp
.ToArray();
```

```csharp
public override IEnumerable<KeyValuePair<long, TSource>>GetOrderableDynamicPartitions() => this.buffer;
```

}

Once orderable partitioner is converted with AsParallel, AsOrdered can be used to preserve the order:

internal static partial class Partitioning

```csharp
{
```
```csharp
internal static void QueryOrderablePartitioner()
```
```csharp
{
```
```csharp
int[] source = Enumerable.Range(0, Environment.ProcessorCount * 2).ToArray();
```
```csharp
new OrderableDynamicPartitioner<int>(source)
```
```csharp
.AsParallel()
```
```csharp
.Select(value => value + ComputingWorkload())
```
```csharp
.WriteLines(); // 1 0 5 3 4 6 2 7
```

```csharp
new OrderableDynamicPartitioner<int>(source)
```
```csharp
.AsParallel()
```
```csharp
.AsOrdered()
```
```csharp
.Select(value => value + ComputingWorkload())
```
```csharp
.WriteLines(); // 0 1 2 3 4 5 6 7
```

```csharp
new DynamicPartitioner<int>(source)
```
```csharp
.AsParallel()
```
```csharp
.AsOrdered()
```
```csharp
.Select(value => value + ComputingWorkload())
```
```csharp
.WriteLines();
```
```csharp
// InvalidOperationException: AsOrdered may not be used with a partitioner that is not orderable.
```
```csharp
}
```

}