---
title: "Parallel LINQ in Depth (1) Local Parallel Query and Visualization"
published: 2019-09-20
description: "LINQ to Objects and LINQ to XML queries are designed to work sequentially, and do not involve multi-threading, concurrency, or parallel computing. To scale LINQ query in multi-processor environment, ."
image: ""
tags: [".NET", "C#", "Concurrency VIsualizer", "LINQ", "Parallel Computing", "Parallel LINQ", "PLINQ"]
category: "Parallel LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Parallel LINQ in Depth series](/archive/?tag=Parallel%20LINQ)\]

LINQ to Objects and LINQ to XML queries are designed to work sequentially, and do not involve multi-threading, concurrency, or parallel computing. To scale LINQ query in multi-processor environment, .NET Standard provides parallel version of LINQ to Objects, called Parallel LINQ or PLINQ.

## Parallel LINQ query

Parallel LINQ (to Objects) APIs are provided as a parity with (sequential) LINQ to Objects APIs:

<table border="1" cellpadding="0" cellspacing="0" class="MsoNormalTable" style="border: currentcolor; border-image: none; border-collapse: collapse; mso-border-alt: solid black .75pt; mso-yfti-tbllook: 1184;"><tbody><tr style="mso-yfti-irow: 0; mso-yfti-firstrow: yes;"><td style="padding: 0.75pt; border: 1pt solid black; border-image: none; mso-border-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">LINQ to Objects types</p><font style="font-size: 12pt;"></font></td><td style="border-width: 1pt 1pt 1pt medium; border-style: solid solid solid none; border-color: black black black currentcolor; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableHead" style="margin: 3pt 0in; page-break-after: avoid;">PLINQ types</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 1;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">System.Collections.IEnumerable</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Linq.ParallelQuery</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 2;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">System.Collections.Generic.IEnumerable&lt;T&gt;</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Linq.ParallelQuery&lt;T&gt;</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 3;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">System.Linq.IOrderedEnumerable&lt;T&gt;</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Linq.OrderedParallelQuery&lt;T&gt;</p><font style="font-size: 12pt;"></font></td></tr><tr style="mso-yfti-irow: 4; mso-yfti-lastrow: yes;"><td style="border-width: medium 1pt 1pt; border-style: none solid solid; border-color: currentcolor black black; padding: 0.75pt; border-image: none; mso-border-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpFirst" style="margin: 8pt 0in 0pt; line-height: 17pt;">System.Linq.Enumerable</p><font style="font-size: 12pt;"></font></td><td style="border-width: medium 1pt 1pt medium; border-style: none solid solid none; border-color: currentcolor black black currentcolor; padding: 0.75pt; mso-border-alt: solid black .75pt; mso-border-left-alt: solid black .75pt; mso-border-top-alt: solid black .75pt;"><font style="font-size: 12pt;"></font><p class="TableTextCxSpLast" style="margin: 0in 0in 8pt; line-height: 17pt;">System.Linq.ParallelEnumerable</p><font style="font-size: 12pt;"></font></td></tr></tbody></table>

As the parity with System.Linq.Enumerable, System.Linq.ParallelEnumerable static type provides the parallel version of standard queries. For example, the following is the comparison of the Range/Repeat generation queries’ sequential and parallel versions:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<int> Range(int start, int count);
```

```csharp
public static IEnumerable<TResult> Repeat<TResult>(TResult element, int count);
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public static class ParallelEnumerable
```
```csharp
{
```
```csharp
public static ParallelQuery<int> Range(int start, int count);
```

```csharp
public static ParallelQuery<TResult> Repeat<TResult>(TResult element, int count);
```

```csharp
// Other members.
```
```csharp
}
```

}

And the following are the sequential and parallel Where/Select/Concat/Cast queries side by side:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TSource> Where<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

```csharp
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```

```csharp
public static IEnumerable<TSource> Concat<TSource>(
```
```csharp
this IEnumerable<TSource> first, IEnumerable<TSource> second);
```

```csharp
public static IEnumerable<TResult> Cast<TResult>(this IEnumerable source);
```
```csharp
}
```

```csharp
public static class ParallelEnumerable
```
```csharp
{
```
```csharp
public static ParallelQuery<TSource> Where<TSource>(
```
```csharp
this ParallelQuery<TSource> source, Func<TSource, bool> predicate);
```

```csharp
public static ParallelQuery<TResult> Select<TSource, TResult>(
```
```csharp
this ParallelQuery<TSource> source, Func<TSource, TResult> selector);
```

```csharp
public static ParallelQuery<TSource> Concat<TSource>(
```
```csharp
this ParallelQuery<TSource> first, ParallelQuery<TSource> second);
```

```csharp
public static ParallelQuery<TResult> Cast<TResult>(this ParallelQuery source);
```
```csharp
}
```

}

When defining each standard query in PLINQ, the generic source and generic output are represented by ParallelQuery<T> instead of IEnumerable<T>, and the non-generic source is represented by ParallelQuery instead of IEnumerable. The other parameter types remain the same. Similarly, the following are the ordering queries side by side, where the ordered source and ordered output are represented by OrderedParallelQuery<T> instead of IOrderedEnumerable<T>:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> ThenBy<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static IOrderedEnumerable<TSource> ThenByDescending<TSource, TKey>(
```
```csharp
this IOrderedEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```
```csharp
}
```

```csharp
public static class ParallelEnumerable
```
```csharp
{
```
```csharp
public static OrderedParallelQuery<TSource> OrderBy<TSource, TKey>(
```
```csharp
this ParallelQuery<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static OrderedParallelQuery<TSource> OrderByDescending<TSource, TKey>(
```
```csharp
this ParallelQuery<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static OrderedParallelQuery<TSource> ThenBy<TSource, TKey>(
```
```csharp
this OrderedParallelQuery<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
public static OrderedParallelQuery<TSource> ThenByDescending<TSource, TKey>(
```
```csharp
this OrderedParallelQuery<TSource> source, Func<TSource, TKey> keySelector);
```
```csharp
}
```

}

With this design, the fluent function chaining and the LINQ query expression pattern are automatically enabled for PLINQ queries. It is the same syntax to write LINQ to Objects query and PLINQ query.

Besides the parities with Enumerable queries, ParallelEnumerable also provides additional queries and additional overloads for Aggregate query:

· Sequence queries

o Conversion: AsParallel, AsSequential

o Query settings: WithCancellation, WithDegreeOfParallelism, WithExecutionMode, WithMergeOptions

o Ordering: AsOrdered, AsUnordered

· Value queries

o Aggregation: Aggregate

· Void queries

o Iteration: ForAll

### Parallel query vs. sequential query

A ParallelQuery<T> source can be created by calling generation queries provided by ParallelEnumerable, like Range, Repeat, etc., then the other parallel queries can be used subsequently:

internal static void Generation()

```csharp
{
```
```csharp
IEnumerable<double>sequentialQuery = Enumerable
```
```csharp
.Repeat(0, 5) // Output IEnumerable<int>.
```
```csharp
.Concat(Enumerable.Range(0, 5)) // Call Enumerable.Concat.
```
```csharp
.Where(int32 => int32 > 0) // Call Enumerable.Where.
```
```csharp
.Select(int32 => Math.Sqrt(int32)); // Call Enumerable.Select.
```

```csharp
ParallelQuery<double> parallelQuery = ParallelEnumerable
```
```csharp
.Repeat(0, 5) // Output ParallelQuery<int>.
```
```csharp
.Concat(ParallelEnumerable.Range(0, 5)) // Call ParallelEnumerable.Concat.
```
```csharp
.Where(int32 => int32 > 0) // Call ParallelEnumerable.Where.
```
```csharp
.Select(int32 => Math.Sqrt(int32)); // Call ParallelEnumerable.Select.
```

}

A PLINQ query can also be started by calling ParallelEnumerable.AsParallel to convert IEnumerable<T>/IEnumerable to ParallelQuery<T>/ParallelQuery:

public static ParallelQuery AsParallel(this IEnumerable source);

public static ParallelQuery<TSource\> AsParallel<TSource\>(this IEnumerable<TSource\> source);

For example,

internal static void AsParallel(IEnumerable<int\> source1, IEnumerable source2)

```csharp
{
```
```csharp
ParallelQuery<int>parallelQuery1 = source1 // IEnumerable<int>.
```
```csharp
.AsParallel(); // Output ParallelQuery<int>.
```

```csharp
ParallelQuery<int> parallelQuery2 = source2 // IEnumerable.
```
```csharp
.AsParallel() // Output ParallelQuery.
```
```csharp
.Cast<int>(); // Call ParallelEnumerable.Cast.
```

}

AsParallel also has an overload accepting a partitioner. Partitioner is discussed in the next chapter.

To use sequential queries for a ParallelQuery<T> source, just call ParallelEnumerable.AsSequential or ParallelEnumerable.AsEnumerable to convert ParallelQuery<T> to IEnumerable<T>, then the sequential queries can be used subsequently:

public static IEnumerable<TSource> AsSequential<TSource>(

```csharp
this ParallelQuery<TSource> source);
```

```csharp
public static IEnumerable<TSource> AsEnumerable<TSource>(
```

this ParallelQuery<TSource> source);

ParallelEnumerable.AsEnumerable simply calls AsSequential internally, so they are identical. For example:

internal static partial class QueryMethods

```csharp
{
```
```csharp
private static readonly Assembly CoreLibrary = typeof(object).Assembly;
```

```csharp
internal static void SequentialParallel()
```
```csharp
{
```
```csharp
IEnumerable<string> obsoleteTypes = CoreLibrary.GetExportedTypes() // Output IEnumerable<Type>.
```
```csharp
.AsParallel() // Output ParallelQuery<Type>.
```
```csharp
.Where(type => type.GetCustomAttribute<ObsoleteAttribute>() != null) // Call ParallelEnumerable.Where.
```
```csharp
.Select(type => type.FullName) // Call ParallelEnumerable.Select.
```
```csharp
.AsSequential() // Output IEnumerable<Type>.
```
```csharp
.OrderBy(name => name); // Call Enumerable.OrderBy.
```
```csharp
obsoleteTypes.WriteLines();
```
```csharp
}
```

}

The above query can be written in query expression syntax:

internal static void QueryExpression()

```csharp
{
```
```csharp
IEnumerable<string>obsoleteTypes =
```
```csharp
from name in
```
```csharp
(from type in CoreLibrary.GetExportedTypes().AsParallel()
```
```csharp
where type.GetCustomAttribute<ObsoleteAttribute>() != null
```
```csharp
select type.FullName).AsSequential()
```
```csharp
orderby name
```
```csharp
select name;
```
```csharp
obsoleteTypes.WriteLines();
```

}

### Parallel query execution

The foreach statement or the EnumerableEx.ForEach query provided by Ix can be used to sequentially pull the results and start LINQ to Objects query execution. Their parallel version is the ParallelEnumerable.ForAll query.

namespace System.Linq

```csharp
{
```
```csharp
public static class EnumerableEx
```
```csharp
{
```
```csharp
public static void ForEach<TSource>(
```
```csharp
this IEnumerable<TSource>source, Action<TSource>onNext);
```
```csharp
}
```

```csharp
public static class ParallelEnumerable
```
```csharp
{
```
```csharp
public static void ForAll<TSource>(
```
```csharp
this ParallelQuery<TSource>source, Action<TSource>action);
```
```csharp
}
```

}

ForAll can simultaneously pull results from ParallelQuery<T> source with multiple threads, and simultaneously call the specified function on those threads:

internal static void ForEachForAll()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.ForEach(value => value.WriteLine()); // 0 1 2 3 4 5 6 7
```

```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.ForAll(value => value.WriteLine()); // 2 6 4 0 5 3 7 1
```

}

Above is the output after executing the code in a quad core CPU, Unlike ForEach, the values pulled and traced by ForAll is unordered. And if this code runs multiple times, the values can be in different order from time to time. This indeterministic order is the consequence of parallel pulling. The order preservation in parallel query execution is discussed in detail later.

Earlier a WriteLines extension method is defined for IEnumerable<T> as a shortcut to call EnumerableEx.ForEach to pull all values and trace them. The following WriteLines overload can be defined for ParallelQuery<T> to call ParallelEnumerable.ForAll to simply execute parallel query without calling a function for each query result:

public static void WriteLines<TSource>(

```csharp
this ParallelQuery<TSource> source, Func<TSource, string> messageFactory = null)
```
```csharp
{
```
```csharp
if (messageFactory == null)
```
```csharp
{
```
```csharp
source.ForAll(value => Trace.WriteLine(value));
```
```csharp
}
```
```csharp
else
```
```csharp
{
```
```csharp
source.ForAll(value => Trace.WriteLine(messageFactory(value)));
```
```csharp
}
```

}

## Visualizing parallel query execution

It would be nice if the internal execution of sequential/parallel LINQ queries can be visualized with charts. On Windows, Microsoft provides a tool called Concurrency Visualizer for this purpose. It consists of a library of APIs to trace the execution information, and a Visual Studio extension to render the execution information to chart. This tool is very easy and intuitive. Unfortunately, it only renders chart on Windows along with Visual Studio.

### Using Concurrency Visualizer

To install the Visual Studio extension, just launch Visual Studio, go to Tools => extensions and Updates… => Online, search “Concurrency Visualizer”, and install. Then restart Visual Studio to complete the installation, and go to Analyze => Concurrency Visualizer => Advanced Settings. In the Filter tab, check Sample Events only:

[![clip_image002](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image002_thumb.jpg "clip_image002")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image002_2.jpg)

Then go to Markers tab, check ConcurrencyVisualizer.Markers only:

[![clip_image004](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image004_thumb.jpg "clip_image004")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image004_2.jpg)

In Files tab, specified a proper directory for trace files. Notice the trace files can be very large, which depends on how much information is collected.

[![clip_image006](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image006_thumb.jpg "clip_image006")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image006_2.jpg)

Next, a reference to Concurrency Visualizer library need to be added to project. Microsoft provides this library as a binary on its web page. For convenience, I have created a NuGet package ConcurrencyVisualizer for .NET Framework and .NET Standard. The library provides the following APIs to render timespans on the time line:

namespace Microsoft.ConcurrencyVisualizer.Instrumentation

```csharp
{
```
```csharp
public static class Markers
```
```csharp
{
```
```csharp
public static Span EnterSpan(int category, string text);
```

```csharp
public static MarkerSeries CreateMarkerSeries(string markSeriesName);
```
```csharp
}
```

```csharp
public class MarkerSeries
```
```csharp
{
```
```csharp
public static Span EnterSpan(int category, string text);
```
```csharp
}
```

}

The category parameter is used to determine the color of the rendered timespan, and the text parameter is the label for the rendered timespan.

For Linux and macOS, where Visual Studio is not available, the above Marker, MarkerSeries, and Span types can be manually defined to trace text information:

public class Markers

```csharp
{
```
```csharp
public static Span EnterSpan(int category, string spanName) =>
```
```csharp
new Span(category, spanName);
```

```csharp
public static MarkerSeries CreateMarkerSeries(string markSeriesName) =>
```
```csharp
new MarkerSeries(markSeriesName);
```
```csharp
}
```

```csharp
public class Span : IDisposable
```
```csharp
{
```
```csharp
private readonly int category;
```

```csharp
private readonly string spanName;
```

```csharp
private readonly DateTime start;
```

```csharp
public Span(int category, string spanName, string markSeriesName = null)
```
```csharp
{
```
```csharp
this.category = category;
```
```csharp
this.spanName = string.IsNullOrEmpty(markSeriesName)
```
```csharp
? spanName : $"{markSeriesName}/{spanName}";
```
```csharp
this.start = DateTime.Now;
```
```csharp
$"{this.start.ToString("o")}: thread id: {Thread.CurrentThread.ManagedThreadId}, category: {this.category}, span: {this.spanName}".WriteLine();
```
```csharp
}
```

```csharp
public void Dispose()
```
```csharp
{
```
```csharp
DateTime end = DateTime.Now;
```
```csharp
$"{end.ToString("o")}: thread id: {Thread.CurrentThread.ManagedThreadId}, category: {this.category}, span: {this.spanName}, duration: {end – this.start}".WriteLine();
```
```csharp
}
```
```csharp
}
```

```csharp
public class MarkerSeries
```
```csharp
{
```
```csharp
private readonly string markSeriesName;
```

```csharp
public MarkerSeries(string markSeriesName) => this.markSeriesName = markSeriesName;
```

```csharp
public Span EnterSpan(int category, string spanName) =>
```
```csharp
new Span(category, spanName, this.markSeriesName);
```

}

If a lot of information is traced, more trace listeners can be optionally added to save the information to file or print to console:

public partial class Markers

```csharp
{
```
```csharp
static Markers()
```
```csharp
{
```
```csharp
// Trace to file:
```
```csharp
Trace.Listeners.Add(new TextWriterTraceListener(@"D:\Temp\Trace.txt"));
```
```csharp
// Trace to console:
```
```csharp
Trace.Listeners.Add(new TextWriterTraceListener(Console.Out));
```
```csharp
}
```

}

### Visualizing sequential and parallel query execution

Now, the Marker, MarkerSeries, and Span types can be used with LINQ queries and ForEach/ForAll to visualize the sequence/parallel execution on Windows, or trace the execution on Linux and macOS:

internal static void RenderForEachForAllSpans()

```csharp
{
```
```csharp
const string SequentialSpan = nameof(EnumerableEx.ForEach);
```
```csharp
// Render a timespan for the entire sequential LINQ query execution, with text label "ForEach".
```
```csharp
using (Markers.EnterSpan(-1, SequentialSpan))
```
```csharp
{
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries(SequentialSpan);
```
```csharp
Enumerable.Range(0, Environment.ProcessorCount * 2).ForEach(value =>
```
```csharp
{
```
```csharp
// Render a sub timespan for each iteratee execution, with each value as text label.
```
```csharp
using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
```
```csharp
{
```
```csharp
// Add workload to extend the iteratee execution to a more visible timespan.
```
```csharp
for (int i = 0; i < 10_000_000; i++) { }
```
```csharp
value.WriteLine(); // 0 1 2 3 4 5 6 7
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
const string ParallelSpan = nameof(ParallelEnumerable.ForAll);
```
```csharp
// Render a timespan for the entire parallel LINQ query execution, with text label "ForAll".
```
```csharp
using (Markers.EnterSpan(-2, ParallelSpan))
```
```csharp
{
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries(ParallelSpan);
```
```csharp
ParallelEnumerable.Range(0, Environment.ProcessorCount * 2).ForAll(value =>
```
```csharp
{
```
```csharp
// Render a sub timespan for each iteratee execution, with each value as text label.
```
```csharp
using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
```
```csharp
{
```
```csharp
// Add workload to extends the iteratee execution to a more visible timespan.
```
```csharp
for (int i = 0; i < 10_000_000; i++) { }
```
```csharp
value.WriteLine(); // 2 6 4 0 5 3 7 1
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

In ForEach and ForAll’s iteratee functions, a for loop of 10 million iterations is executed to add some CPU computing workload to make the function call take longer time, otherwise the rendered timespan of function call can be too small to read. On Windows, click Visual Studio => Analyze => Concurrency Visualizer => Start with Current Project. When the code finishes running, a rich UI is generated. The first tab Utilization shows that the CPU usage was about 25% for a while, which is the sequential LINQ query executing on the quad core CPU. Then the CPU usage became almost 100%, which is the PLINQ execution.

[![clip_image008](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image008_thumb.gif "clip_image008")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image008_2.gif)

The second tab Threads has the chart of timespans. In the thread list on the left, right click the threads not working on LINQ queries and hide them, so that the chart only has the rendered timespans:

[![clip_image010](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image010_thumb.gif "clip_image010")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image010_2.gif)

It uncovers how the LINQ queries execute on this quad core CPU. ForEach query pulls the values and call the specified function sequentially with the main thread. ForAll query does the work with 4 threads (main threads and 3 other worker threads), each thread processed 2 values. The values 6, 0, 4, 2 are processed before 7, 1, 5, 3, which leads to the trace output: 2 6 4 0 5 3 7 1.

Click the ForEach timespan, the Current panel shows the execution duration is 4750 milliseconds. Click ForAll, it shows 1314 milliseconds:

[![clip_image012](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image012_thumb.gif "clip_image012")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image012_2.gif)

This is about 27% of ForEach execution time, which is close to a quarter as expected. It cannot be exactly 25%, because on the device, there are other running processes and threads using CPU, the parallel query also has extra work to manage multithreading, which is covered later in this chapter.

In the last tab Cores, select the LINQ query threads (main thread and other 3 worker thread), and 6760. It shows how the workload is distributed in the 4 cores:

[![clip_image014](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image014_thumb.gif "clip_image014")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image014_2.gif)

Above LINQ visualization code looks noisy, because it mixes the LINQ query code and the visualization code. Following the Single Responsibility Principle, the visualization can be encapsulated for IEnumerable<T> and ParallelQuery<T>:

internal const string ParallelSpan = "Parallel";

```csharp
internal const string SequentialSpan = "Sequential";
```

```csharp
internal static void Visualize<TSource>(
```
```csharp
this IEnumerable<TSource> source,
```
```csharp
Action<IEnumerable<TSource>, Action<TSource>> query,
```
```csharp
Action<TSource> iteratee, string span = SequentialSpan, int category = -1)
```
```csharp
{
```
```csharp
using (Markers.EnterSpan(category, span))
```
```csharp
{
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
```
```csharp
query(
```
```csharp
source,
```
```csharp
value =>
```
```csharp
{
```
```csharp
using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
```
```csharp
{
```
```csharp
iteratee(value);
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
}
```

```csharp
internal static void Visualize<TSource>(
```
```csharp
this ParallelQuery<TSource> source,
```
```csharp
Action<ParallelQuery<TSource>, Action<TSource>> query,
```
```csharp
Action<TSource> iteratee, string span = ParallelSpan, int category = -2)
```
```csharp
{
```
```csharp
using (Markers.EnterSpan(category, span))
```
```csharp
{
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
```
```csharp
query(
```
```csharp
source,
```
```csharp
value =>
```
```csharp
{
```
```csharp
using (markerSeries.EnterSpan(Thread.CurrentThread.ManagedThreadId, value.ToString()))
```
```csharp
{
```
```csharp
iteratee(value);
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

And the additional CPU computing workload can also be defined as a function:

internal static int ComputingWorkload(int value = 0, int baseIteration = 10\_000\_000)

```csharp
{
```
```csharp
for (int i = 0; i < baseIteration * (value + 1); i++) { }
```
```csharp
return value;
```

}

When it is called as ComputingWorkload() or ComputingWorkload(0), it runs 10 million iterations and output 0; when it is called as ComputingWorkload(1), it runs 20 million iterations and output 1; and so on.

Now the LINQ queries can be visualized in a much cleaner way:

internal static void VisualizeForEachForAll()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.Visualize(
```
```csharp
EnumerableEx.ForEach,
```
```csharp
value => (value + ComputingWorkload()).WriteLine());
```

```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.Visualize(
```
```csharp
ParallelEnumerable.ForAll,
```
```csharp
value => (value + ComputingWorkload()).WriteLine());
```

}

### Visualizing chaining queries

Besides visualizing query execution with ForEach and ForAll, the following Visualize overloads can be defined to visualize sequential and parallel queries and render their iteratee function execution as timespans, like Select’s selector, Where’s predicate, etc.:

internal static TResult Visualize<TSource, TMiddle, TResult>(

```csharp
this IEnumerable<TSource> source,
```
```csharp
Func<IEnumerable<TSource>, Func<TSource, TMiddle>, TResult> query,
```
```csharp
Func<TSource, TMiddle> iteratee,
```
```csharp
Func<TSource, string> spanFactory = null,
```
```csharp
string span = SequentialSpan)
```
```csharp
{
```
```csharp
spanFactory = spanFactory ?? (value => value.ToString());
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
```
```csharp
return query(
```
```csharp
source,
```
```csharp
value =>
```
```csharp
{
```
```csharp
using (markerSeries.EnterSpan(
```
```csharp
Thread.CurrentThread.ManagedThreadId, spanFactory(value)))
```
```csharp
{
```
```csharp
return iteratee(value);
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
internal static TResult Visualize<TSource, TMiddle, TResult>(
```
```csharp
this ParallelQuery<TSource> source,
```
```csharp
Func<ParallelQuery<TSource>, Func<TSource, TMiddle>, TResult> query,
```
```csharp
Func<TSource, TMiddle> iteratee,
```
```csharp
Func<TSource, string> spanFactory = null,
```
```csharp
string span = ParallelSpan)
```
```csharp
{
```
```csharp
spanFactory = spanFactory ?? (value => value.ToString());
```
```csharp
MarkerSeries markerSeries = Markers.CreateMarkerSeries(span);
```
```csharp
return query(
```
```csharp
source,
```
```csharp
value =>
```
```csharp
{
```
```csharp
using (markerSeries.EnterSpan(
```
```csharp
Thread.CurrentThread.ManagedThreadId, spanFactory(value)))
```
```csharp
{
```
```csharp
return iteratee(value);
```
```csharp
}
```
```csharp
});
```

}

Take a simple Where and Select query chaining as example,

internal static void VisualizeWhereSelect()

```csharp
{
```
```csharp
Enumerable
```
```csharp
.Range(0, 2)
```
```csharp
.Visualize(
```
```csharp
Enumerable.Where,
```
```csharp
value => ComputingWorkload() >= 0, // Where's predicate.
```
```csharp
value => $"{nameof(Enumerable.Where)} {value}")
```
```csharp
.Visualize(
```
```csharp
Enumerable.Select,
```
```csharp
value => ComputingWorkload(), // Select's selector.
```
```csharp
value => $"{nameof(Enumerable.Select)} {value}")
```
```csharp
.WriteLines();
```

```csharp
ParallelEnumerable
```
```csharp
.Range(0, Environment.ProcessorCount * 2)
```
```csharp
.Visualize(
```
```csharp
ParallelEnumerable.Where,
```
```csharp
value => ComputingWorkload() >= 0, // Where's predicate.
```
```csharp
value => $"{nameof(ParallelEnumerable.Where)} {value}")
```
```csharp
.Visualize(
```
```csharp
ParallelEnumerable.Select,
```
```csharp
value => ComputingWorkload(), // Select's selector.
```
```csharp
value => $"{nameof(ParallelEnumerable.Select)} {value}")
```
```csharp
.WriteLines();
```

}

The sequential and parallel queries are visualized as:

[![clip_image016](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image016_thumb.gif "clip_image016")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/Parallel-LINQ-1_B83B/clip_image016_2.gif)