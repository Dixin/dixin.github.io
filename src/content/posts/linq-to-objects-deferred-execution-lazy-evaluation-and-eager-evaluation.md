---
title: "LINQ to Objects in Depth (4) Deferred Execution, Lazy Evaluation and Eager Evaluation"
published: 2019-07-04
description: "As fore mentioned, when LINQ to Objects’ collection queries and value queries are called, they start to evaluate query result. When sequence queries are called, they do not evaluate any query result,"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: "LINQ"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

As fore mentioned, when LINQ to Objects’ collection queries and value queries are called, they start to evaluate query result. When sequence queries are called, they do not evaluate any query result, and can be viewed as defining a query.

### Immediate execution vs. deferred execution

Apparently, collection queries must pull all values from source sequence, store them to a collection in the specified way, and output the collection to caller. The value queries also must pull or detect values in the source sequence to have the query result available. This is called immediate execution of LINQ queries. These queries mutate their source sequence’s iterator state, and may cause side effect, so they are impure functions. The sequence queries are pure functions, implemented by following the above iteration pattern. So, when they are called, they only construct a generator. This is called deferred execution.

Generally, for LINQ query or any function with a sequence output, the yield syntactic sugar is a very handy tool to implement deferred execution. Tis can be intuitively demonstrated by the following 2 functions:

internal static IEnumerable<double> AbsAndSqrtArray(double @double) =>

```csharp
new double[]
```
```csharp
{
```
```csharp
Math.Abs(@double),
```
```csharp
Math.Sqrt(@double)
```
```csharp
};
```

```csharp
internal static IEnumerable<double> AbsAndSqrtGenerator(double @double)
```
```csharp
{
```
```csharp
yield return Math.Abs(@double);
```
```csharp
yield return Math.Sqrt(@double);
```

}

When the first function AbsAndSqrtArray is called, Math.Abs and Math.Sqrt are called immediately to evaluate 2 values, and these 2 values are stored in an array for output. To defer the execution of the Math.Abs and Math.Sqrt, the second function AbsAndSqrtGenerator uses the yield syntactic sugar. When it is called, it constructs a generator for output. Only when pulling the 2 values from the output generator, Math.Abs and Math.Sqrt are called.

The first function’s output sequence is a collection with actual values evaluated and stored, sometimes it is called a hot IEnumerable<T>, and the second function’s output sequence is called a cold IEnumerable<T>. Apparently, in LINQ to Objects, all sequence queries’ output are cold IEnumerable<T>.

### Lazy evaluation vs. eager evaluation

The Select and Where queries’ execution is deferred until values are pulled from the result sequence. When pulling the first result, the query executes, the selector function and predicate function are called until the first result is evaluated. At this moment the rest results are not evaluated. When pulling the second result, the query executes until the second result is evaluated, and so on. If pulling stops in the middle, the rest results are not evaluated. This behaviour is called lazy evaluation. To demonstrate the evaluation, add tracing to Select query’s iteration control flow:

internal static IEnumerable<TResult> SelectGenerator<TSource, TResult>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```csharp
{
```
```csharp
"Select query starts.".WriteLine();
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
$"Select query calls selector with {value}.".WriteLine();
```
```csharp
TResult result = selector(value);
```
```csharp
$"Select query yields {result}.".WriteLine();
```
```csharp
yield return result;
```
```csharp
}
```
```csharp
"Select query ends.".WriteLine();
```

}

The above foreach statement can be desugared as the following actual control flow:

internal static IEnumerable<TResult> DesugaredSelectGenerator<TSource, TResult>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```csharp
{
```
```csharp
"Select query starts.".WriteLine();
```
```csharp
IEnumerator<TSource> sourceIterator = null; // start.
```
```csharp
try
```
```csharp
{
```
```csharp
sourceIterator = source.GetEnumerator(); // start.
```
```csharp
while (sourceIterator.MoveNext()) // moveNext.
```
```csharp
{
```
```csharp
$"Select query calls selector with {sourceIterator.Current}.".WriteLine(); // getCurrent.
```
```csharp
TResult result = selector(sourceIterator.Current); // getCurrent.
```
```csharp
$"Select query yields {result}.".WriteLine(); // getCurrent.
```
```csharp
yield return result; // getCurrent.
```
```csharp
}
```
```csharp
}
```
```csharp
finally
```
```csharp
{
```
```csharp
sourceIterator?.Dispose(); // dispose.
```
```csharp
}
```
```csharp
"Select query ends.".WriteLine(); // end.
```

}

Its compilation is equivalent to the following generator construction:

internal static IEnumerable<TResult> CompiledSelectGenerator<TSource, TResult>(

```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```csharp
{
```
```csharp
IEnumerator<TSource> sourceIterator = null;
```
```csharp
return new Generator<TResult>(
```
```csharp
start: () =>
```
```csharp
{
```
```csharp
"Select query starts.".WriteLine();
```
```csharp
sourceIterator = source.GetEnumerator();
```
```csharp
},
```
```csharp
moveNext: () => sourceIterator.MoveNext(),
```
```csharp
getCurrent: () =>
```
```csharp
{
```
```csharp
$"Select query calls selector with {sourceIterator.Current}.".WriteLine();
```
```csharp
TResult result = selector(sourceIterator.Current);
```
```csharp
$"Select query yields {result}.".WriteLine();
```
```csharp
return result;
```
```csharp
},
```
```csharp
dispose: () => sourceIterator?.Dispose(),
```
```csharp
end: () => "Select query ends.".WriteLine());
```

}

Similarly, add tracing to Where query as well:

internal static IEnumerable<TSource> WhereGenerator<TSource>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```csharp
{
```
```csharp
"Where query starts.".WriteLine();
```
```csharp
foreach (TSource value in source)
```
```csharp
{
```
```csharp
$"Where query calls predicate with {value}.".WriteLine();
```
```csharp
if (predicate(value))
```
```csharp
{
```
```csharp
$"Where query yields {value}.".WriteLine();
```
```csharp
yield return value;
```
```csharp
}
```
```csharp
}
```
```csharp
"Where query ends.".WriteLine();
```

}

Its compilation is also a generator construction, equivalent to the following:

internal static IEnumerable<TSource> CompiledWhereGenerator<TSource>(

```csharp
this IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```csharp
{
```
```csharp
IEnumerator<TSource> sourceIterator = null;
```
```csharp
return new Generator<TSource>(
```
```csharp
start: () =>
```
```csharp
{
```
```csharp
"Where query starts.".WriteLine();
```
```csharp
sourceIterator = source.GetEnumerator();
```
```csharp
},
```
```csharp
moveNext: () =>
```
```csharp
{
```
```csharp
while (sourceIterator.MoveNext())
```
```csharp
{
```
```csharp
$"Where query calls predicate with {sourceIterator.Current}."
```
```csharp
.WriteLine();
```
```csharp
if (predicate(sourceIterator.Current))
```
```csharp
{
```
```csharp
return true;
```
```csharp
}
```
```csharp
}
```

```csharp
return false;
```
```csharp
},
```
```csharp
getCurrent: () =>
```
```csharp
{
```
```csharp
$"Where query yields {sourceIterator.Current}.".WriteLine();
```
```csharp
return sourceIterator.Current;
```
```csharp
},
```
```csharp
dispose: () => sourceIterator?.Dispose(),
```
```csharp
end: () => "Where query ends.".WriteLine());
```

}

The following LINQ query is a composition of Where and Select:

internal static void CallWhereAndSelect()

```csharp
{
```
```csharp
IEnumerable<int> source = Enumerable.Range(1, 5);
```
```csharp
IEnumerable<string> deferredQuery = source)
```
```csharp
.WhereGenerator(int32 => int32 > 2) // Deferred execution.
```
```csharp
.SelectGenerator(int32 => new string('*', int32)); // Deferred execution.
```
```csharp
foreach (string result in deferredQuery)
```
```csharp
{
```
```csharp
// Select query starts.
```
```csharp
// Where query starts.
```
```csharp
// Where query calls predicate with 1.
```
```csharp
// Where query calls predicate with 2.
```
```csharp
// Where query calls predicate with 3.
```
```csharp
// Where query yields 3.
```
```csharp
// Select query calls selector with 3.
```
```csharp
// Select query yields ***.
```
```csharp
// Where query calls predicate with 4.
```
```csharp
// Where query yields 4.
```
```csharp
// Select query calls selector with 4.
```
```csharp
// Select query yields ****.
```
```csharp
// Where query calls predicate with 5.
```
```csharp
// Where query yields 5.
```
```csharp
// Select query calls selector with 5.
```
```csharp
// Select query yields *****.
```
```csharp
// Where query ends.
```
```csharp
// Select query ends.
```
```csharp
}
```

}

The tracing messages shows how exactly the lazy evaluation works in deferred execution. When WhereGenerator and SelectGenerator are called, the mapping query and filtering query are not executed. The composited query is the output sequence of SelectGenerator. When pulling the first result, Select starts execution, Select pulls the first results from its source sequence, which is the output sequence of Where, so that Where query starts execution, and pulls its source sequence. Where first retrieves 1, and calls its predicate function with 1. In this case, the output of predicate is false, so Where does not yield 1, but pulls the next value 2 from its source sequence, and calls predicate with 2. Again, the output of predicate is false, so Where does not yield 2, but pulls the next value 3 from its source sequence. This time, the output of predicate function is true, so Where query yields 3 to Select query. Select retrieves 3 and calls its selector function with 3. Eventually Select yields selector output \*\*\* as the first result of composited query. Then Select query pulls the next value from Where query, Where query pulls the next value from source. Where query retrieves 4 and calls predicate with 4. The output of predicate is true, so Where query yields 4 to Select query. Select query retrieves 4 and calls selector with 4. Eventually Select yields selector output \*\*\*\* as the second result of the composited query, and so on.

The opposition of lazy evaluation is eager evaluation, where pulling the first result causes all results being evaluated. For example, Reverse query is a sequence query, and it implements deferred execution. When its result sequence is pulled for the first time, it starts execution. It has to evaluate and store all the values of source sequence, in order to yields the last source value as the first query result. The following is the equivalent implementation of Reverse. Again, to demonstrate the evaluation, tracing is added as well:

internal static IEnumerable<TSource> ReverseGenerator<TSource>(

```csharp
this IEnumerable<TSource> source)
```
```csharp
{
```
```csharp
"Reverse query starts.".WriteLine();
```
```csharp
TSource[] results = source.ToArray();
```
```csharp
$"Reverse query has all {results.Length} value(s) of source sequence.".WriteLine();
```
```csharp
for (int index = results.Length - 1; index >= 0; index--)
```
```csharp
{
```
```csharp
$"Reverse query yields index {index} of source sequence.".WriteLine();
```
```csharp
yield return results[index];
```
```csharp
}
```
```csharp
"Reverse query ends.".WriteLine();
```

}

Its compilation is equivalent to the following generator construction:

internal static IEnumerable<TSource> CompiledReverseGenerator<TSource>(this IEnumerable<TSource> source)

```csharp
{
```
```csharp
TSource[] results = null;
```
```csharp
int index = 0;
```
```csharp
return new Generator<TSource>(
```
```csharp
start: () =>
```
```csharp
{
```
```csharp
"Reverse query starts.".WriteLine();
```
```csharp
results = source.ToArray();
```
```csharp
$"Reverse query evaluated all {results.Length} value(s) of source sequence.".WriteLine();
```
```csharp
index = results.Length - 1;
```
```csharp
},
```
```csharp
moveNext: () => index >= 0,
```
```csharp
getCurrent: () =>
```
```csharp
{
```
```csharp
$"Reverse query yields index {index} of source source.".WriteLine();
```
```csharp
return results[index--];
```
```csharp
},
```
```csharp
end: () => "Reverse query ends.".WriteLine());
```

}

The following example is the composition of Select query and Reverse query:

internal static void CallSelectAndReverse()

```csharp
{
```
```csharp
IEnumerable<string> deferredQuery = Enumerable.Range(1, 5)
```
```csharp
.SelectGenerator(int32 => new string('*', int32)) // Deferred execution.
```
```csharp
.ReverseGenerator(); // Deferred execution.
```
```csharp
foreach (string result in deferredQuery)
```
```csharp
{
```
```csharp
// Reverse query starts.
```
```csharp
// Select query starts.
```
```csharp
// Select query calls selector with 1.
```
```csharp
// Select query yields *.
```
```csharp
// Select query calls selector with 2.
```
```csharp
// Select query yields **.
```
```csharp
// Select query calls selector with 3.
```
```csharp
// Select query yields ***.
```
```csharp
// Select query calls selector with 4.
```
```csharp
// Select query yields ****.
```
```csharp
// Select query calls selector with 5.
```
```csharp
// Select query yields *****.
```
```csharp
// Select query ends.
```
```csharp
// Reverse query has all 5 value(s) of source sequence.
```
```csharp
// Reverse query yields index 4 of source sequence.
```
```csharp
// Reverse query yields index 3 of source sequence.
```
```csharp
// Reverse query yields index 2 of source sequence.
```
```csharp
// Reverse query yields index 1 of source sequence.
```
```csharp
// Reverse query yields index 0 of source sequence.
```
```csharp
// Reverse query ends.
```
```csharp
}
```

}

The tracing messages shows how exactly the eager evaluation works in deferred execution. When pulling the first result, Reverse starts execution. Reverse pulls all values from its source sequence, which is the output generator of Select, so that Select query starts execution. Select pulls all values from its source sequence store them, calls selector function, and yields all results to Reverse query. Reverse retrieves and stores all values, and yields the last value as the first result. Then pulling the next query result causes Reverse direct yield the stored second last value, and so on.