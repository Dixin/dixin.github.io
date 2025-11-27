---
title: "Parallel LINQ in Depth (4) Performance"
published: 2018-09-30
description: "Parallel LINQ is powerful, but also can be more complex. This part discusses Parallel LINQ query performance in different cases."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

## **Latest version: [https://weblogs.asp.net/dixin/parallel-linq-4-performance](/posts/parallel-linq-4-performance "https://weblogs.asp.net/dixin/parallel-linq-4-performance")**

Parallel LINQ is powerful, but also can be more complex. This part discusses Parallel LINQ query performance in different cases.

## Sequential query vs. parallel query

Parallel LINQ query can be faster than the parity sequential LINQ to Objects query, but not always. Take OrderBy as example, the following method compares the query execution duration of sequential OrderBy and parallel OrderBy:

```csharp
private static void OrderByTest(Func<int, int> keySelector, int count, int run)
{
    $"Sort {count} values.".WriteLine();
    int[] source = EnumerableX.RandomInt32(count: count).ToArray();
    Stopwatch stopwatch = Stopwatch.StartNew();
    Enumerable.Range(0, run).ForEach(_ =>
    {
        int[] sequential = source.OrderBy(keySelector).ToArray();
    });
    stopwatch.Stop();
    $"Sequential:{stopwatch.ElapsedMilliseconds}".WriteLine();

    stopwatch.Restart();
    Enumerable.Range(0, run).ForEach(_ =>
    {
        int[] parallel1 = source.AsParallel().OrderBy(keySelector).ToArray();
    });
    stopwatch.Stop();
    $"Parallel:{stopwatch.ElapsedMilliseconds}".WriteLine();
}
```

It calls the RandomInt32 method, which was defined in the LINQ to Objects chapter, to generate an array of random int values with the specified length. Then it executes the sequential and parallel OrderBy methods for the specified times, so that the total execution time can be controlled, The following code compares the sequential/parallel OrderBy execution on small/medium/large size array, with the same simple key selector:

```csharp
internal static void OrderByTestForCount()
{
    OrderByTest(keySelector: value => value, count: 5, run: 10_000);    
    // Sequential:11    Parallel:1422
    OrderByTest(keySelector: value => value, count: 5_000, run: 100);
    // Sequential:114   Parallel:107
    OrderByTest(keySelector: value => value, count: 500_000, run: 100);
    // Sequential:18210 Parallel:8204
}
```

The following method compares the sequential/parallel OrderBy execution on the same size array, with different key selector of light/medium/heavy workload:

```csharp
internal static void OrderByTestForKeySelector()
{
    OrderByTest(
        keySelector: value => value + ComputingWorkload(iteration: 1), 
        count: Environment.ProcessorCount, run: 100_000);
    // Sequential:37   Parallel:2218
    OrderByTest(
        keySelector: value => value + ComputingWorkload(iteration: 10_000), 
        count: Environment.ProcessorCount, run: 1_000);
    // Sequential:115  Parallel:125
    OrderByTest(
        keySelector: value => value + ComputingWorkload(iteration: 100_000), 
        count: Environment.ProcessorCount, run: 100);
    // Sequential:1240 Parallel:555
}
```

It turns out sequential LINQ to Object can be faster than Parallel LINQ in some cases. Here, sequential OrderBy can execute faster for smaller source/lighter key selector, and parallel OrderBy can execute faster for larger source/more expensive key selector

## CPU bound operation vs. I/O bound operation

So far, all the examples are CPU bound operations. In many cases, Parallel LINQ by default takes the logic processor count as the degree of parallelism. This makes sense for CPU bound operations, but may not for I/O bound operations. For example, when downloading files from Internet with parallel threads, it could be nice if the worker thread count can be controlled accurately, and independently from CPU core count. The following ForceParallel method can be implementation for this purpose:

```csharp
public static partial class ParallelEnumerableX
{
    public static void ForceParallel<TSource>(
        this IEnumerable<TSource> source, Action<TSource> action, int forcedDegreeOfParallelism)
    {
        if (forcedDegreeOfParallelism <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(forcedDegreeOfParallelism));
        }

        IList<IEnumerator<TSource>> partitions = Partitioner
            .Create(source, EnumerablePartitionerOptions.NoBuffering) // Stripped partitioning.
            .GetPartitions(forcedDegreeOfParallelism);
        using (CountdownEvent countdownEvent = new CountdownEvent(forcedDegreeOfParallelism))
        {
            partitions.ForEach(partition => new Thread(() =>
            {
                try
                {
                    using (partition)
                    {
                        while (partition.MoveNext())
                        {
                            action(partition.Current);
                        }
                    }
                }
                finally 
                {
                    countdownEvent.Signal();
                }
            }).Start());
            countdownEvent.Wait();
        }
    }
}
```

It creates the specified number of partitions from the source, then start one threads to work with each partition. Also, by calling Partitioner.Create with EnumerablePartitionerOptions.NoBuffering, stripped partitioning is enabled for better load balance.

To demonstrate the I/O bound operation, define the following network I/O method to download file synchronously from the the specified URI:

```csharp
internal static partial class Functions
{
    internal static string Download(string uri)
    {
        WebRequest request = WebRequest.Create(uri);
        using (WebResponse response = request.EndGetResponse(request.BeginGetResponse(null, null)))
        using (Stream downloadStream = response.GetResponseStream())
        using (StreamReader streamReader = new StreamReader(downloadStream))
        {
            return streamReader.ReadToEnd();
        }
    }
}
```

The following method compares and visualizes sequential download, parallel download with Parallel LINQ, and parallel download with above ForceParallel method:

```csharp
private static void DownloadTest(string[] uris)
{
    uris.Visualize(uri => Functions.Download(uri)); // Sequential with no concurrency.

    uris.AsParallel()
        .WithDegreeOfParallelism(10) // Parallel with max concurrency.
        .Visualize(uri => Functions.Download(uri));

    using (Markers.EnterSpan(-3, nameof(ParallelEnumerableX.ForceParallel)))
    {
        MarkerSeries markerSeries = Markers.CreateMarkerSeries(nameof(ParallelEnumerableX.ForceParallel));
        uris.ForceParallel(
            uri =>
            {
                using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, uri))
                {
                    Functions.Download(uri);
                }
            },
            forcedDegreeOfParallelism: 10); // Parallel with forced concurrency.
    }
}
```

The following code queries some some thumbnail picture file URIs from the Flickr RSS feed with LINQ to XML, then compares the performance of downloading those small files:

```csharp
internal static void RunDownloadSmallFilesTest()
{
    string[] thumbnails = 
        XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2")
        .Descendants((XNamespace)"http://search.yahoo.com/mrss/" + "thumbnail")
        .Attributes("url")
        .Select(uri => (string)uri)
        .ToArray();
    DownloadTest(thumbnails);
}
```

> [![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-in-Depth-4-Performance_8FF0/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-in-Depth-4-Performance_8FF0/image_thumb_2.png)

Here sequential downloading takes longer time, which totally makes sense. The Parallel LINQ query is specified with a max degree of parallelism 10, but it decides to utilize 5 threads. ForceParallel starts 10 threads exactly as specified, and its execution time is about half of Parallel LINQ.

The following code queries for the same Flickr RSS feed for large picture file URIs, and compares the performance of downloading those large files:

```csharp
internal static void RunDownloadLargeFilesTest()
{
    string[] contents = 
        XDocument.Load("https://www.flickr.com/services/feeds/photos_public.gne?id=64715861@N07&format=rss2")
        .Descendants((XNamespace)"http://search.yahoo.com/mrss/" + "content")
        .Attributes("url")
        .Select(uri => (string)uri)
        .ToArray();
    DownloadTest(contents);
}
```

> [![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-in-Depth-4-Performance_8FF0/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-in-Depth-4-Performance_8FF0/image_thumb1_2.png)

This time Parallel LINQ still utilizes 5 threads from the beginning, then decides to start 2 more threads a while later. ForceParallel simply start 10 threads since the beginning. However, the execution time of sequential download, Parallel LINQ download, and ForceParallel download are about the same. This is because when downloading larger files, the network bandwidth becomes the performance bottleneck, and the degree of parallelization does not make much difference.

## Summary

This part and the previous parts has demonstrated many aspects that can have performance impact for Parallel LINQ, and here is a summary:

-   The partitioning strategy can impact performance, because different partitioning algorithms introduce different synchronization and load balance.
-   The degree of parallelism can impact performance, when degree of parallelism is set to 1, Parallel LINQ works like sequential LINQ to Object.
-   The 2 execution modes, Default (sequential/parallel) and ForceParallel, can result different performance
-   The merge option can also impact performance, smaller buffer size can have the early value results available faster, but can also make the query execute longer
-   The order preservation can impact the performance, query as unordered can have better performance, but can also have incorrect results.
-   The source size can impact performance, for source with smaller size, the overhead of parallelization can be more significant, and result even lower performance than sequential query
-   The callback function provided to query methods can impact performance, more expensive callback functions can have better performance with parallel queries
-   The type of operation can impact performance, utilize more CPU cores can improve the performance of compute bound operation, but I/O bound operations can depend on the I/O hardware.

Parallel LINQ is provided for performance. In the real world, the performance of each Parallel LINQ query has to be measured and optimized accordingly.