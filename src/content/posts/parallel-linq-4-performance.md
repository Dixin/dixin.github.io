---
title: "Parallel LINQ in Depth (4) Performance"
published: 2019-09-24
description: "The purpose of PLINQ is to utilize multiple CPUs for better performance than LINQ to Objects However, PLINQ can also introduces performance overhead, like source partitioning and result merging. There"
image: ""
tags: [".NET", "C#", "LINQ", "Parallel Computing", "Parallel LINQ", "PLINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

The purpose of PLINQ is to utilize multiple CPUs for better performance than LINQ to Objects However, PLINQ can also introduces performance overhead, like source partitioning and result merging. There are many aspects that impact PLINQ query performance.

### Sequential query vs. parallel query

To compare the performance of sequential and parallel query, take OrderBy query as example. PLINQ’s OrderBy requires partitioning the source, as well as buffering and merging the results. The following function compares the query execution duration of sequential OrderBy and parallel OrderBy:

internal static void OrderByTest(

```csharp
Func<int, int> keySelector, int sourceCount, int testRepeatCount)
```
```csharp
{
```
```csharp
int[] source = EnumerableX
```
```csharp
.RandomInt32(min: int.MinValue, max: int.MaxValue, count: sourceCount)
```
```csharp
.ToArray();
```
```csharp
Stopwatch stopwatch = Stopwatch.StartNew();
```
```csharp
Enumerable.Range(0, testRepeatCount).ForEach(_ =>
```
```csharp
{
```
```csharp
int[] sequentialResults = source.OrderBy(keySelector).ToArray();
```
```csharp
});
```
```csharp
stopwatch.Stop();
```
```csharp
$"Sequential:{stopwatch.ElapsedMilliseconds}".WriteLine();
```

```csharp
stopwatch.Restart();
```
```csharp
Enumerable.Range(0, testRepeatCount).ForEach(_ =>
```
```csharp
{
```
```csharp
int[] parallel1Results = source.AsParallel().OrderBy(keySelector).ToArray();
```
```csharp
});
```
```csharp
stopwatch.Stop();
```
```csharp
$"Parallel:{stopwatch.ElapsedMilliseconds}".WriteLine();
```

}

It calls the RandomInt32 query, which is defined in the LINQ to Objects custom queries chapter, to generate an array of random int values with the specified length. Then it executes the sequential and parallel OrderBy queries repeatedly for the specified times, so that the total execution time can be controlled in a reasonable range, the following code calls the OrderByTest function compares the sequential/parallel OrderBy execution on arrays of small/medium/large size, with the same simple key selector:

internal static void OrderByTestForSourceCount()

```csharp
{
```
```csharp
OrderByTest(keySelector: value => value, sourceCount: 5, testRepeatCount: 10_000);
```
```csharp
// Sequential:11 Parallel:1422
```
```csharp
OrderByTest(keySelector: value => value, sourceCount: 5_000, testRepeatCount: 100);
```
```csharp
// Sequential:114 Parallel:107
```
```csharp
OrderByTest(keySelector: value => value, sourceCount: 500_000, testRepeatCount: 100);
```
```csharp
// Sequential:18210 Parallel:8204
```

}

The following code compares the sequential/parallel OrderBy execution on arrays of the same size, with different key selector of light/medium/heavy workload:

internal static void OrderByTestForKeySelector()

```csharp
{
```
```csharp
OrderByTest(
```
```csharp
keySelector: value => value + ComputingWorkload(baseIteration: 1),
```
```csharp
sourceCount: Environment.ProcessorCount, testRepeatCount: 100_000);
```
```csharp
// Sequential:37 Parallel:2218
```
```csharp
OrderByTest(
```
```csharp
keySelector: value => value + ComputingWorkload(baseIteration: 10_000),
```
```csharp
sourceCount: Environment.ProcessorCount, testRepeatCount: 1_000);
```
```csharp
// Sequential:115 Parallel:125
```
```csharp
OrderByTest(
```
```csharp
keySelector: value => value + ComputingWorkload(baseIteration: 100_000),
```
```csharp
sourceCount: Environment.ProcessorCount, testRepeatCount: 100);
```
```csharp
// Sequential:1240 Parallel:555
```

}

It turns out PLINQ has better performance than LINQ to Objects with larger source and expensive iteratee function, which has a better chance to offset the overhead of partitioning and buffering/merging.

### CPU bound operation vs. I/O bound operation

So far, all the examples are CPU bound operations. In most cases, PLINQ by default takes the logic processor count as the degree of parallelism. This makes sense for CPU bound operations, but may be not ideal for I/O bound operations. For example, when downloading files from Internet with parallel threads, it could be nice if the worker thread count can be controlled accurately disregarding the CPU core count. The following ForceParallel extension method can be implementation for this purpose:

internal static void ForceParallel<TSource>(

```csharp
this IEnumerable<TSource> source, Action<TSource> iteratee, int degreeOfParallelism)
```
```csharp
{
```
```csharp
if (degreeOfParallelism <= 1)
```
```csharp
{
```
```csharp
throw new ArgumentOutOfRangeException(nameof(degreeOfParallelism));
```
```csharp
}
```

```csharp
IList<IEnumerator<TSource>> partitions = Partitioner
```
```csharp
.Create(source, EnumerablePartitionerOptions.NoBuffering) // Stripped partitioning.
```
```csharp
.GetPartitions(degreeOfParallelism);
```
```csharp
ConcurrentBag<Exception> exceptions = new ConcurrentBag<Exception>();
```
```csharp
void IteratePartition(IEnumerator<TSource> partition)
```
```csharp
{
```
```csharp
try
```
```csharp
{
```
```csharp
using (partition)
```
```csharp
{
```
```csharp
while (partition.MoveNext())
```
```csharp
{
```
```csharp
iteratee(partition.Current);
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
catch (Exception exception)
```
```csharp
{
```
```csharp
exceptions.Add(exception);
```
```csharp
}
```
```csharp
}
```

```csharp
Thread[] threads = partitions
```
```csharp
.Skip(1)
```
```csharp
.Select(partition => new Thread(() => IteratePartition(partition)))
```
```csharp
.ToArray();
```
```csharp
threads.ForEach(thread => thread.Start());
```
```csharp
IteratePartition(partitions[0]);
```
```csharp
threads.ForEach(thread => thread.Join());
```
```csharp
if (!exceptions.IsEmpty)
```
```csharp
{
```
```csharp
throw new AggregateException(exceptions);
```
```csharp
}
```

}

It calls Partitioner.Create with EnumerablePartitionerOptions.NoBuffering, to enable stripped partitioning for better load balance. It then calls the created partitioner to create the specified number of partitions, and uses current thread and additional threads to simultaneously pull each partition and call the iterate function.

To demonstrate the I/O bound operation, the following function first visualizes sequential download, then visualizes parallel download with PLINQ, and finally visualizes parallel download with above ForceParallel function. Again, assuming a quad core CPU, the degree of parallelism is specified as 10, which is higher than the core count:

internal static void DownloadTest(string\[\] uris)

```csharp
{
```
```csharp
byte[] Download(string uri)
```
```csharp
{
```
```csharp
using (WebClient webClient = new WebClient())
```
```csharp
{
```
```csharp
return webClient.DownloadData(uri);
```
```csharp
}
```
```csharp
}
```

```csharp
uris.Visualize(EnumerableEx.ForEach, uri => Download(uri).Length.WriteLine());
```

```csharp
const int DegreeOfParallelism = 10;
```
```csharp
uris.AsParallel()
```
```csharp
.WithDegreeOfParallelism(DegreeOfParallelism)
```
```csharp
.Visualize(ParallelEnumerable.ForAll, uri => Download(uri).Length.WriteLine());
```

```csharp
uris.Visualize(
```
```csharp
query: (source, iteratee) => source.ForceParallel(iteratee, DegreeOfParallelism),
```
```csharp
iteratee: uri => Download(uri).Length.WriteLine());
```

}

The following code queries some thumbnail picture file URIs from the Flickr RSS feed with LINQ to XML, then pass the URIs to above function to visualize the download:

internal static void RunDownloadTestWithSmallFiles()

```csharp
{
```
```csharp
string[] smallThumbnailUris = XDocument
```
```csharp
.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2")
```
```csharp
.Descendants((XNamespace)"http://search.yahoo.com/mrss/" + "thumbnail")
```
```csharp
.Attributes("url")
```
```csharp
.Select(uri => (string)uri)
```
```csharp
.ToArray();
```
```csharp
DownloadTest(smallThumbnailUris);
```

}

Here sequential download takes longer time, as expected. The PLINQ query is specified with a max degree of parallelism 10, but it decides to utilize 5 threads. ForceParallel starts 10 threads exactly as specified, and its execution time is about half of PLINQ.

The following code queries for the same Flickr RSS feed, but for large picture file URIs, and visualize the download:

internal static void RunDownloadTestWithLargeFiles()

```csharp
{
```
```csharp
string[] largePictureUris = XDocument
```
```csharp
.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2")
```
```csharp
.Descendants((XNamespace)"http://search.yahoo.com/mrss/" + "content")
```
```csharp
.Attributes("url")
```
```csharp
.Select(uri => (string)uri)
```
```csharp
.ToArray();
```
```csharp
DownloadTest(largePictureUris);
```

}

This time PLINQ still utilizes 5 threads from the beginning, then decides to start 2 more threads a while later. ForceParallel simply start 10 threads since the beginning. However, the duration of sequential download, PLINQ download, and ForceParallel download are about the same. This is because when downloading larger files, the network bandwidth is fully occupied and becomes the performance bottleneck, so the degree of parallelism does not make much difference.

### Factors to impact performance

This part and the previous parts have demonstrated many aspects that can have performance impact for PLINQ, and here is a summary:

· The partitioning strategy can impact performance, because different partitioning algorithms introduce different synchronization and load balance.

· The 2 execution modes, Default (sequential or parallel) and ForceParallel, can result different performance

· The degree of parallelism can impact performance, when degree of parallelism is set to 1, PLINQ works like sequential LINQ to Object.

· The merge option can also impact performance, smaller buffer size can have the early value results available faster, but can also make the query execute longer.

· The order preservation can impact the performance, query as unordered can have better performance, but can lead to incorrect results.

· The source size can impact performance, for source with smaller size, the overhead of parallelization can be more significant, and result even lower performance than sequential query.

· The iteratee function provided to query can impact performance, more expensive iteratee functions can have better performance with parallel queries.

· The type of operation can impact performance, utilize more CPU cores can improve the performance of compute bound operation, but I/O bound operations can also depend on the I/O hardware.

In the real world, the performance of each PLINQ query has to be measured and optimized accordingly.

## Summary

PLINQ’s query execution performance is impacted by many aspects. First PLINQ partitions source for parallel query. PLINQ implements range partitioning, chuck partitioning, hash partitioning, and stripped partitioning. These partitioning algorithms require different synchronization, and result different load balance among the query threads to impact the overall performance. .NET Standard also provides APIs to define custom static, dynamic, and orderable partitioners. To utilize multi-processor and offset the overhead of partitioning and merging, PLINQ can have better performance with larger size source and more expensive iteratee function. PLINQ’s query performance also should be optimized according to the type of operation.