---
title: "Parallel LINQ in Depth (4) Performance"
published: 2019-09-24
description: "The purpose of PLINQ is to utilize multiple CPUs for better performance than LINQ to Objects However, PLINQ can also introduces performance overhead, like source partitioning and result merging. There"
image: ""
tags: ["C#", ".NET", "LINQ", "PLINQ", "Parallel LINQ", "Parallel Computing"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

The purpose of PLINQ is to utilize multiple CPUs for better performance than LINQ to Objects However, PLINQ can also introduces performance overhead, like source partitioning and result merging. There are many aspects that impact PLINQ query performance.

### Sequential query vs. parallel query

To compare the performance of sequential and parallel query, take OrderBy query as example. PLINQ’s OrderBy requires partitioning the source, as well as buffering and merging the results. The following function compares the query execution duration of sequential OrderBy and parallel OrderBy:

internal static void OrderByTest(
```
Func<int, int> keySelector, int sourceCount, int testRepeatCount)
```
```
{
```
```
int[] source = EnumerableX
```
```
.RandomInt32(min: int.MinValue, max: int.MaxValue, count: sourceCount)
```
```
.ToArray();
```
```
Stopwatch stopwatch = Stopwatch.StartNew();
```
```
Enumerable.Range(0, testRepeatCount).ForEach(_ =>
```
```
{
```
```
int[] sequentialResults = source.OrderBy(keySelector).ToArray();
```
```
});
```
```
stopwatch.Stop();
```
```
$"Sequential:{stopwatch.ElapsedMilliseconds}".WriteLine();
```
```
stopwatch.Restart();
```
```
Enumerable.Range(0, testRepeatCount).ForEach(_ =>
```
```
{
```
```
int[] parallel1Results = source.AsParallel().OrderBy(keySelector).ToArray();
```
```
});
```
```
stopwatch.Stop();
```
```
$"Parallel:{stopwatch.ElapsedMilliseconds}".WriteLine();
```

}

It calls the RandomInt32 query, which is defined in the LINQ to Objects custom queries chapter, to generate an array of random int values with the specified length. Then it executes the sequential and parallel OrderBy queries repeatedly for the specified times, so that the total execution time can be controlled in a reasonable range, the following code calls the OrderByTest function compares the sequential/parallel OrderBy execution on arrays of small/medium/large size, with the same simple key selector:

internal static void OrderByTestForSourceCount()
```
{
```
```
OrderByTest(keySelector: value => value, sourceCount: 5, testRepeatCount: 10_000);
```
```
// Sequential:11 Parallel:1422
```
```
OrderByTest(keySelector: value => value, sourceCount: 5_000, testRepeatCount: 100);
```
```
// Sequential:114 Parallel:107
```
```
OrderByTest(keySelector: value => value, sourceCount: 500_000, testRepeatCount: 100);
```
```
// Sequential:18210 Parallel:8204
```

}

The following code compares the sequential/parallel OrderBy execution on arrays of the same size, with different key selector of light/medium/heavy workload:

internal static void OrderByTestForKeySelector()
```
{
```
```
OrderByTest(
```
```
keySelector: value => value + ComputingWorkload(baseIteration: 1),
```
```
sourceCount: Environment.ProcessorCount, testRepeatCount: 100_000);
```
```
// Sequential:37 Parallel:2218
```
```
OrderByTest(
```
```
keySelector: value => value + ComputingWorkload(baseIteration: 10_000),
```
```
sourceCount: Environment.ProcessorCount, testRepeatCount: 1_000);
```
```
// Sequential:115 Parallel:125
```
```
OrderByTest(
```
```
keySelector: value => value + ComputingWorkload(baseIteration: 100_000),
```
```
sourceCount: Environment.ProcessorCount, testRepeatCount: 100);
```
```
// Sequential:1240 Parallel:555
```

}

It turns out PLINQ has better performance than LINQ to Objects with larger source and expensive iteratee function, which has a better chance to offset the overhead of partitioning and buffering/merging.

### CPU bound operation vs. I/O bound operation

So far, all the examples are CPU bound operations. In most cases, PLINQ by default takes the logic processor count as the degree of parallelism. This makes sense for CPU bound operations, but may be not ideal for I/O bound operations. For example, when downloading files from Internet with parallel threads, it could be nice if the worker thread count can be controlled accurately disregarding the CPU core count. The following ForceParallel extension method can be implementation for this purpose:

internal static void ForceParallel<TSource>(
```
this IEnumerable<TSource> source, Action<TSource> iteratee, int degreeOfParallelism)
```
```
{
```
```
if (degreeOfParallelism <= 1)
```
```
{
```
```
throw new ArgumentOutOfRangeException(nameof(degreeOfParallelism));
```
```
}
```
```
IList<IEnumerator<TSource>> partitions = Partitioner
```
```
.Create(source, EnumerablePartitionerOptions.NoBuffering) // Stripped partitioning.
```
```
.GetPartitions(degreeOfParallelism);
```
```
ConcurrentBag<Exception> exceptions = new ConcurrentBag<Exception>();
```
```
void IteratePartition(IEnumerator<TSource> partition)
```
```
{
```
```
try
```
```
{
```
```
using (partition)
```
```
{
```
```
while (partition.MoveNext())
```
```
{
```
```
iteratee(partition.Current);
```
```
}
```
```
}
```
```
}
```
```
catch (Exception exception)
```
```
{
```
```
exceptions.Add(exception);
```
```
}
```
```
}
```
```
Thread[] threads = partitions
```
```
.Skip(1)
```
```
.Select(partition => new Thread(() => IteratePartition(partition)))
```
```
.ToArray();
```
```
threads.ForEach(thread => thread.Start());
```
```
IteratePartition(partitions[0]);
```
```
threads.ForEach(thread => thread.Join());
```
```
if (!exceptions.IsEmpty)
```
```
{
```
```
throw new AggregateException(exceptions);
```
```
}
```

}

It calls Partitioner.Create with EnumerablePartitionerOptions.NoBuffering, to enable stripped partitioning for better load balance. It then calls the created partitioner to create the specified number of partitions, and uses current thread and additional threads to simultaneously pull each partition and call the iterate function.

To demonstrate the I/O bound operation, the following function first visualizes sequential download, then visualizes parallel download with PLINQ, and finally visualizes parallel download with above ForceParallel function. Again, assuming a quad core CPU, the degree of parallelism is specified as 10, which is higher than the core count:

internal static void DownloadTest(string\[\] uris)
```
{
```
```
byte[] Download(string uri)
```
```
{
```
```
using (WebClient webClient = new WebClient())
```
```
{
```
```
return webClient.DownloadData(uri);
```
```
}
```
```
}
```
```
uris.Visualize(EnumerableEx.ForEach, uri => Download(uri).Length.WriteLine());
```
```
const int DegreeOfParallelism = 10;
```
```
uris.AsParallel()
```
```
.WithDegreeOfParallelism(DegreeOfParallelism)
```
```
.Visualize(ParallelEnumerable.ForAll, uri => Download(uri).Length.WriteLine());
```
```
uris.Visualize(
```
```
query: (source, iteratee) => source.ForceParallel(iteratee, DegreeOfParallelism),
```
```
iteratee: uri => Download(uri).Length.WriteLine());
```

}

The following code queries some thumbnail picture file URIs from the Flickr RSS feed with LINQ to XML, then pass the URIs to above function to visualize the download:

internal static void RunDownloadTestWithSmallFiles()
```
{
```
```
string[] smallThumbnailUris = XDocument
```
```
.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2")
```
```
.Descendants((XNamespace)"http://search.yahoo.com/mrss/" + "thumbnail")
```
```
.Attributes("url")
```
```
.Select(uri => (string)uri)
```
```
.ToArray();
```
```
DownloadTest(smallThumbnailUris);
```

}

Here sequential download takes longer time, as expected. The PLINQ query is specified with a max degree of parallelism 10, but it decides to utilize 5 threads. ForceParallel starts 10 threads exactly as specified, and its execution time is about half of PLINQ.

The following code queries for the same Flickr RSS feed, but for large picture file URIs, and visualize the download:

internal static void RunDownloadTestWithLargeFiles()
```
{
```
```
string[] largePictureUris = XDocument
```
```
.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2")
```
```
.Descendants((XNamespace)"http://search.yahoo.com/mrss/" + "content")
```
```
.Attributes("url")
```
```
.Select(uri => (string)uri)
```
```
.ToArray();
```
```
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