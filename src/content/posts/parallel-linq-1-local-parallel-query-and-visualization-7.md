---
title: "Parallel LINQ in Depth (1) Local Parallel Query and Visualization"
published: 2018-09-01
description: "So far, all the discussion for LINQ to Objects/XML does not involve multi-threading, concurrency, or parallel computing. This is by design, because pulling values from an IEnumerable<T> sequence is no"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

## **Latest version: [https://weblogs.asp.net/dixin/parallel-linq-1-local-parallel-query-and-visualization](/posts/parallel-linq-1-local-parallel-query-and-visualization "https://weblogs.asp.net/dixin/parallel-linq-1-local-parallel-query-and-visualization")**

So far, all the discussion for LINQ to Objects/XML does not involve multi-threading, concurrency, or parallel computing. This is by design, because pulling values from an IEnumerable<T> sequence is not thread-safe.When multiple threads simultaneously access one IEnumerable<T> sequence, race condition can occur and lead to unpredictable consequence. As a result, all the LINQ to Objects/XML queries are implemented in a sequential manner with a single thread. To scale LINQ in multi-processor environment, Since .NET Framework4.0, a parallel version of LINQ to Objects is also provided, called Parallel LINQ or PLINQ.

## Parallel LINQ types and methods

Parallel LINQ types are provided as a parity with LINQ to Objects:

<table cellpadding="2" cellspacing="0" width="531"><tbody><tr><td valign="top" width="278">Sequential LINQ</td><td valign="top" width="251">Parallel LINQ</td></tr><tr><td valign="top" width="278">System.Collections.IEnumerable</td><td valign="top" width="251">System.Linq.ParallelQuery</td></tr><tr><td valign="top" width="278">System.Collections.Generic.IEnumerable&lt;T&gt;</td><td valign="top" width="251">System.Linq.ParallelQuery&lt;T&gt;</td></tr><tr><td valign="top" width="278">System.Linq.IOrderedEnumerable&lt;T&gt;</td><td valign="top" width="251">System.Linq.OrderedParallelQuery&lt;T&gt;</td></tr><tr><td valign="top" width="278">System.Linq.Enumerable</td><td valign="top" width="251">System.Linq.ParallelEnumerable</td></tr></tbody></table>

As the parity, System.Linq.ParallelEnumerable provides the parallel version of System.Linq.Enumerable query methods. For example, the following is the comparison of the sequential and parallel generation query methods Range/Repeat:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<int> Range(int start, int count);

        public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count);

        // Other members.
    }

    public static class ParallelEnumerable
    {
        public static ParallelQuery<int> Range(int start, int count);

        public static ParallelQuery<TResult> Repeat<TResult>(TResult element, int count);

        // Other members.
    }
}
```

And the following are the sequential and parallel Where/Select/Concat/Cast methods side by side:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Where<TSource>(
            this IEnumerable<TSource> source, Func<TSource, bool> predicate);

        public static IEnumerable<TResult> Select<TSource, TResult>(
            this IEnumerable<TSource> source, Func<TSource, TResult> selector);

        public static IEnumerable<TSource> Concat<TSource>(
            this IEnumerable<TSource> first, IEnumerable<TSource> second);

        public static IEnumerable<TResult> Cast<TResult>(this IEnumerable source);
    }

    public static class ParallelEnumerable
    {
        public static ParallelQuery<TSource> Where<TSource>(
            this ParallelQuery<TSource> source, Func<TSource, bool> predicate);

        public static ParallelQuery<TResult> Select<TSource, TResult>(
            this ParallelQuery<TSource> source, Func<TSource, TResult> selector);

        public static ParallelQuery<TSource> Concat<TSource>(
            this ParallelQuery<TSource> first, ParallelQuery<TSource> second);

        public static ParallelQuery<TResult> Cast<TResult>(this ParallelQuery source);
    }
}
```

For each query method, the type of generic source sequence and result sequence is simply replaced by ParallelQuery<T>, the type of non-generic sequence is replaced by ParallelQuery, and other parameter types remain the same. Similarly, the following are the ordering methods side by side, where the type of ordered source sequence and result sequence is replaced by IOrderedQueryable<T>, and, again, the key selector callback function is replaced by expression tree:

```csharp
namespace System.Linq
{
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

    public static class ParallelEnumerable
    {
        public static OrderedParallelQuery<TSource> OrderBy<TSource, TKey>(
            this ParallelQuery<TSource> source, Func<TSource, TKey> keySelector);

        public static OrderedParallelQuery<TSource> OrderByDescending<TSource, TKey>(
            this ParallelQuery<TSource> source, Func<TSource, TKey> keySelector);

        public static OrderedParallelQuery<TSource> ThenBy<TSource, TKey>(
            this OrderedParallelQuery<TSource> source, Func<TSource, TKey> keySelector);

        public static OrderedParallelQuery<TSource> ThenByDescending<TSource, TKey>(
            this OrderedParallelQuery<TSource> source, Func<TSource, TKey> keySelector);
    }
}
```

With this design, the fluent method chaining, and the LINQ query expression pattern is implemented for Parallel LINQ queries.

Besides Enumerable parities, ParallelEnumerable also provides additional methods and additional overrides for Aggregate method:

-   Sequence queries

-   Ordering: AsOrdered, AsUnordered
-   Conversion: AsParallel, AsSequential
-   Settings: WithCancellation, WithDegreeOfParallelism, WithExecutionMode, WithMergeOptions

-   Value queries

-   Aggregation: Aggregate

-   Void queries

-   Iteration: ForAll

They are covered in this part and the next parts.

## Parallel vs. sequential query

A ParallelQuery<T> instance can be created by calling generation methods of ParallelEnumerable, like Range, Repeat, etc., then the parallel query methods can be called fluently:

```csharp
internal static void Generation()
{
    IEnumerable<double> sequentialQuery = Enumerable
        .Repeat(0, 5) // Return IEnumerable<int>.
        .Concat(Enumerable.Range(0, 5)) // Enumerable.Concat.
        .Where(int32 => int32 > 0) // Enumerable.Where.
        .Select(int32 => Math.Sqrt(int32)); //  Enumerable.Select.

    ParallelQuery<double> parallelQuery = ParallelEnumerable
        .Repeat(0, 5) // Return ParallelQuery<int>.
        .Concat(ParallelEnumerable.Range(0, 5)) // ParallelEnumerable.Concat.
        .Where(int32 => int32 > 0) // ParallelEnumerable.Where.
        .Select(int32 => Math.Sqrt(int32)); // ParallelEnumerable.Select.
}
```

It can also be created by calling ParallelEnumerable.AsParallel for IEnumerable<T> or IEnumerable:

```csharp
public static ParallelQuery AsParallel(this IEnumerable source);

public static ParallelQuery<TSource> AsParallel<TSource>(this IEnumerable<TSource> source);
```

For example,

```csharp
internal static void AsParallel(IEnumerable<int> source1, IEnumerable source2)
{
    ParallelQuery<int> parallelQuery1 = source1 // IEnumerable<int>.
        .AsParallel(); // Return ParallelQuery<int>.

    ParallelQuery<int> parallelQuery2 = source2 // IEnumerable.
        .AsParallel() // Return ParallelQuery.
        .Cast<int>(); // ParallelEnumerable.Cast.
}
```

AsParallel also has a overload accepting a partitioner, which is discussed later in this chapter.

To apply sequential query methods to a ParallelQuery<T> instance, just call ParallelEnumerable.AsSequential method, which returns \]IEnumerable<T>, from where the sequential query methods can be called:

```csharp
public static IEnumerable<TSource> AsSequential<TSource>(this ParallelQuery<TSource> source);
```

For example:

```csharp
internal static partial class QueryMethods
{
    private static readonly Assembly CoreLibrary = typeof(object).Assembly;

    internal static void SequentialParallel()
    {
        IEnumerable<string> obsoleteTypes = CoreLibrary.GetExportedTypes() // Return IEnumerable<Type>.
            .AsParallel() // Return ParallelQuery<Type>.
            .Where(type => type.GetCustomAttribute<ObsoleteAttribute>() != null) // ParallelEnumerable.Where.
            .Select(type => type.FullName) // ParallelEnumerable.Select.
            .AsSequential() // Return IEnumerable<Type>.
            .OrderBy(name => name); // Enumerable.OrderBy.
        obsoleteTypes.WriteLines();
    }
}
```

The query expression version of the above query is:

```csharp
internal static void QueryExpression()
{
    IEnumerable<string> obsoleteTypes =
        from name in
            (from type in CoreLibrary.GetExportedTypes().AsParallel()
             where type.GetCustomAttribute<ObsoleteAttribute>() != null
             select type.FullName).AsSequential()
        orderby name
        select name;
    obsoleteTypes.WriteLine();
}
```

In Parallel LINQ, ParallelEnumerable.AsEnumerable calls AsSequential to do the same work.

## Execute parallel query

As demonstrated in LINQ to Objects chapter, Interactive Extension (Ix) provides a useful EnumerableEx.ForEach method, which pulls values from the source sequence, and execute the specified function for each value sequentially. Its parallel version is ParallelEnumerable.ForAll method.

```csharp
namespace System.Linq
{
    public static class EnumerableEx
    {
        public static void ForEach<TSource>(this IEnumerable<TSource> source, Action<TSource> onNext);
    }

    public static class ParallelEnumerable
    {
        public static void ForAll<TSource>(this ParallelQuery<TSource> source, Action<TSource> action);
    }
}
```

FoAll can pull values from ParallelQuery<T> source with multiple threads simultaneously, and call function on those threads in parallel:

```csharp
internal static void ForEachForAll()
{
    Enumerable
        .Range(0, Environment.ProcessorCount * 2)
        .ForEach(value => value.WriteLine()); // 0 1 2 3 4 5 6 7

    ParallelEnumerable
        .Range(0, Environment.ProcessorCount * 2)
        .ForAll(value => value.WriteLine()); // 2 6 4 0 5 3 7 1
}
```

Above is the output after executing the code in a quad core CPU, ForAll can output the values in different order from ForEach. And if this code is executed multiple times, the order can be different from time to time. Apparently, this is the consequence of parallel pulling. The parallel query execution and values’ order preservation is discussed in detail later.

The following ForAll overload can be defined to simply execute parallel query without calling a function for each query result:

```csharp
public static partial class ParallelEnumerableX
{
    public static void ForAll<TSource>(this ParallelQuery<TSource> source) => source.ForAll(value => { });
}
```

## Visualize parallel query execution

### Install and configure Concurrency Visualizer

> It would be nice if the internal execution of sequential/parallel LINQ queries can be visualized. This can be done in variant ways. On Windows, Microsoft has released a tool [Concurrency Visualizer](https://msdn.microsoft.com/en-us/library/dd537632.aspx) for this purpose. It is an extension of Visual Studio. It provides APIs to trace the execution information at the runtime. When the execution is done, it generates charts and diagrams with the collected tracing. After the installation, restart Visual Studio, go to Analyze => Concurrency Visualizer => Advanced Settings:
> 
> [![image_thumb4](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb4_thumb.png "image_thumb4")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb4_2.png)
> 
> In the Filter tab, check Sample Events only:
> 
> [![image_thumb8](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb8_thumb.png "image_thumb8")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb8_2.png)
> 
> Then go to Markers tab, check ConcurrencyVisualizer.Markers only:
> 
> [![image_thumb9](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb9_thumb.png "image_thumb9")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb9_2.png)
> 
> In Files tab, specified a proper directory for trace files. Notice the trace files can be very large, depends on how much information is collected.
> 
> [![image_thumb10](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb10_thumb.png "image_thumb10")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb10_2.png)

### Visualize sequential and parallel LINQ queries

> Next, add a reference to Concurrency Visualizer library. which is a [binary for downloading](https://www.microsoft.com/en-in/download/details.aspx?id=49103). For convenience, a NuGget package ConcurrencyVisualizer has been created for this tutorial. The following APIs are provided to draw timespans on the time line:
> 
> ```csharp
> namespace Microsoft.ConcurrencyVisualizer.Instrumentation
> {
>     public static class Markers
>     {
>         public static Span EnterSpan(int category, string text);
>     }
> 
>     public class MarkerSeries
>     {
>         public static Span EnterSpan(int category, string text);
>     }
> }
> ```
> 
> The category parameter is used to determine the color of the timespan, and the span parameter becomes the text label for the timespan.

In .NET Core, this tool and SDK library are not available, so manually define these APIs to trace text information:

```csharp
public class Markers
{
    public static Span EnterSpan(int category, string spanName) => new Span(category, spanName);

    public static MarkerSeries CreateMarkerSeries(string markSeriesName) => new MarkerSeries(markSeriesName);
}

public class Span : IDisposable
{
    private readonly int category;

    private readonly string spanName;

    private readonly DateTime start;

    public Span(int category, string spanName, string markSeriesName = null)
    {
        this.category = category;
        this.spanName = string.IsNullOrEmpty(markSeriesName) ? spanName : $@"{markSeriesName}/{spanName}";
        this.start = DateTime.Now;
        $"{this.start.ToString("o")}: thread id: {Thread.CurrentThread.ManagedThreadId}, category: {this.category}, span: {this.spanName}"
            .WriteLine();
    }

    public void Dispose()
    {
        DateTime end = DateTime.Now;
        $"{end.ToString("o")}: thread id: {Thread.CurrentThread.ManagedThreadId}, category: {this.category}, span: {this.spanName}, duration: {end - start}"
            .WriteLine();
    }
}

public class MarkerSeries
{
    private readonly string markSeriesName;

    public MarkerSeries(string markSeriesName) => this.markSeriesName = markSeriesName;

    public Span EnterSpan(int category, string spanName) => new Span(category, spanName, markSeriesName);
}
```

The following example calls these APIs to trace/visualize the sequence and parallel LINQ query execution:

```csharp
internal static void ForEachForAllTimeSpans()
{
    string sequentialTimeSpanName = nameof(EnumerableEx.ForEach);
    // Render a timespan for the entire sequential LINQ query execution, with text label "ForEach".
    using (Markers.EnterSpan(-1, sequentialTimeSpanName))
    {
        MarkerSeries markerSeries = Markers.CreateMarkerSeries(sequentialTimeSpanName);
        Enumerable.Range(0, Environment.ProcessorCount * 2).ForEach(value =>
        {
            // Render a sub timespan for each action execution, with each value as text label.
            using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
            {
                // Add workload to extend the action execution to a more visible timespan.
                Enumerable.Range(0, 10_000_000).ForEach();
                value.WriteLine();
            }
        });
    }

    string parallelTimeSpanName = nameof(ParallelEnumerable.ForAll);
    // Render a timespan for the entire parallel LINQ query execution, with text label "ForAll".
    using (Markers.EnterSpan(-2, parallelTimeSpanName))
    {
        MarkerSeries markerSeries = Markers.CreateMarkerSeries(parallelTimeSpanName);
        ParallelEnumerable.Range(0, Environment.ProcessorCount * 2).ForAll(value =>
        {
            // Render a sub timespan for each action execution, with each value as text label.
            using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
            {
                // Add workload to extends the action execution to a more visible timespan.
                Enumerable.Range(0, 10_000_000).ForEach();
                value.WriteLine();
            }
        });
    }
}
```

In the functions which are passed to ForEach and ForAll, a foreach loop over a sequence with 10 million values adds some workload to make the function call take longer time, otherwise the function execution timespan looks too tiny in the visualization. Now, setup a trace listener and call the above method to visualize the execution:

```csharp
internal static void TraceToFile()
{
    // Trace to file:
    string file = Path.Combine(Path.GetTempPath(), "Trace.txt");
    using (TextWriterTraceListener traceListener = new TextWriterTraceListener(file))
    // Or trace to console:
    // using (TextWriterTraceListener traceListener = new TextWriterTraceListener(Console.Out))
    {
        Trace.Listeners.Add(traceListener);
        QueryMethods.ForEachForAllTimeSpans();
    }
}
```

> On Windows, click Visual Studio => Analyze => Concurrency Visualizer => Start with Current Project. When the console application finishes running, a rich trace UI is generated. The first tab Utilization shows that the CPU usage was about 25% for a while, which seems to be the sequential LINQ query executing on the quad core CPU. Then the CPU usage became almost 100%, which seems to be the Parallel LINQ execution.
> 
> [![image_thumb3](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb3_thumb.png "image_thumb3")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb3_2.png)
> 
> The second tab Threads proves this. In the thread list on the left, right click the threads not working on LINQ queries and hide them, the view becomes:
> 
> [![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb_2.png)

It uncovers how the LINQ queries execute on this quad core CPU. ForEach query pulls the values and call the specified function sequentially, with the main thread. ForAll query does the work with 4 threads (main threads and 3 other threads), each thread processed 2 values. The values 6, 0, 4, 2 is processed before 7, 1, 5, 3, which leads to the trace output: 2 6 4 0 5 3 7 1.

> Click the ForEach timespan, the Current panel shows the execution duration is 4750 milliseconds. Click ForAll, it shows 1314 milliseconds:
> 
> [![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb1_2.png)

This is about 27% of ForEach execution time, close a quarter, as expected. It cannot be exactly 25%, because On the device, there are other running processes and threads using CPU, also the parallel query has extra work to manage multithreading, which is covered later in this chapter.

> In the last tab Cores, select the LINQ query threads 9884, 12360, 11696, and 6760. It shows how the workload is distributed in the 4 cores:
> 
> [![image_thumb41](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb41_thumb.png "image_thumb41")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb41_2.png)

Above LINQ visualization code looks noisy, because it mixes the LINQ query and the tracing/visualizing. Regarding the Single Responsibility Principle, the tracing/visualizing logics can be encapsulated for reuse. The following methods wraps the tracing calls:

```csharp
public static partial class Visualizer
{
    internal const string Parallel = nameof(Parallel);

    internal const string Sequential = nameof(Sequential);

    internal static void Visualize<TSource>(
        this IEnumerable<TSource> source, Action<TSource> action, string span = Sequential, int category = -1)
    {
        using (Markers.EnterSpan(category, span))
        {
            MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
            source.ForEach(value =>
            {
                using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
                {
                    action(value);
                }
            });
        }
    }

    internal static void Visualize<TSource>(
        this ParallelQuery<TSource> source, Action<TSource> action, string span = Parallel, int category = -2)
    {
        using (Markers.EnterSpan(category, span))
        {
            MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
            source.ForAll(value =>
            {
                using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
                {
                    action(value);
                }
            });
        }
    }
}
```

Now the LINQ queries can be visualized in a much cleaner way:

```csharp
internal static void VisualizeForEachForAll()
{
    Enumerable
        .Range(0, Environment.ProcessorCount * 2)
        .Visualize(value =>
        {
            Enumerable.Range(0, 10_000_000).ForEach(); // Workload.
            value.WriteLine();
        });

    ParallelEnumerable
        .Range(0, Environment.ProcessorCount * 2)
        .Visualize(value =>
        {
            Enumerable.Range(0, 10_000_000).ForEach(); // Workload.
            value.WriteLine();
        });
}
```

### Visualize chaining query methods

Besides visualizing function calls for ForEach and ForAll, the following Visualize overloads can be defined to visualize sequential and parallel query methods:

```csharp
internal static IEnumerable<TResult> Visualize<TSource, TMiddle, TResult>(
    this IEnumerable<TSource> source,
    Func<IEnumerable<TSource>, Func<TSource, TMiddle>, IEnumerable<TResult>> query,
    Func<TSource, TMiddle> func,
    Func<TSource, string> spanFactory = null,
    string span = Sequential)
{
    MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
    return query(
        source,
        value =>
        {
            using (markerSeries.EnterSpan(
                Thread.CurrentThread.ManagedThreadId, spanFactory?.Invoke(value) ?? value.ToString()))
            {
                return func(value);
            }
        });
}

internal static ParallelQuery<TResult> Visualize<TSource, TMiddle, TResult>(
    this ParallelQuery<TSource> source,
    Func<ParallelQuery<TSource>, Func<TSource, TMiddle>, ParallelQuery<TResult>> query,
    Func<TSource, TMiddle> func,
    Func<TSource, string> spanFactory = null,
    string span = Parallel)
{
    MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
    return query(
        source,
        value =>
        {
            using (markerSeries.EnterSpan(
                Thread.CurrentThread.ManagedThreadId, spanFactory?.Invoke(value) ?? value.ToString()))
            {
                return func(value);
            }
        });
}
```

And the following method encapsulates the workload generation according to the input value:

```csharp
internal static partial class Functions
{
    internal static int ComputingWorkload(int value = 0, int iteration = 10_000_000)
    {
        Enumerable.Range(0, iteration * (value + 1)).ForEach();
        return value;
    }
}
```

Take a simple Where and Select query chaining as example,

```csharp
// using static Functions;
internal static void WhereSelect()
{
    Enumerable
        .Range(0, 2)
        .Visualize(Enumerable.Where, _ => ComputingWorkload() >= 0, value => $"{nameof(Enumerable.Where)} {value}")
        .Visualize(Enumerable.Select, _ => ComputingWorkload(), value => $"{nameof(Enumerable.Select)} {value}")
        .ForEach();

    ParallelEnumerable
        .Range(0, Environment.ProcessorCount * 2)
        .Visualize(
            ParallelEnumerable.Where,
            _ => ComputingWorkload() >= 0,
            value => $"{nameof(ParallelEnumerable.Where)} {value}")
        .Visualize(
            ParallelEnumerable.Select,
            _ => ComputingWorkload(),
            value => $"{nameof(ParallelEnumerable.Select)} {value}")
        .ForAll();
}
```

> The sequential and parallel queries are visualized as:
> 
> [![image_thumb11](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb11_thumb.png "image_thumb11")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1-Local-Parallel-Query-and_8DE9/image_thumb11_2.png)

This visualizing approach will be used for the entire chapter to demonstrate parallel LINQ queries.