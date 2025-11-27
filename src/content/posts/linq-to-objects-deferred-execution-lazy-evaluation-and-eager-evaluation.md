---
title: "LINQ to Objects in Depth (4) Deferred Execution, Lazy Evaluation and Eager Evaluation"
published: 2019-07-04
description: "As fore mentioned, when LINQ to Objects’ collection queries and value queries are called, they start to evaluate query result. When sequence queries are called, they do not evaluate any query result,"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to Objects", "LINQ via C#"]
category: ".NET"
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
```
new double[]
```
```
{
```
```
Math.Abs(@double),
```
```
Math.Sqrt(@double)
```
```
};
```
```
internal static IEnumerable<double> AbsAndSqrtGenerator(double @double)
```
```
{
```
```
yield return Math.Abs(@double);
```
```
yield return Math.Sqrt(@double);
```

}

When the first function AbsAndSqrtArray is called, Math.Abs and Math.Sqrt are called immediately to evaluate 2 values, and these 2 values are stored in an array for output. To defer the execution of the Math.Abs and Math.Sqrt, the second function AbsAndSqrtGenerator uses the yield syntactic sugar. When it is called, it constructs a generator for output. Only when pulling the 2 values from the output generator, Math.Abs and Math.Sqrt are called.

The first function’s output sequence is a collection with actual values evaluated and stored, sometimes it is called a hot IEnumerable<T>, and the second function’s output sequence is called a cold IEnumerable<T>. Apparently, in LINQ to Objects, all sequence queries’ output are cold IEnumerable<T>.

### Lazy evaluation vs. eager evaluation

The Select and Where queries’ execution is deferred until values are pulled from the result sequence. When pulling the first result, the query executes, the selector function and predicate function are called until the first result is evaluated. At this moment the rest results are not evaluated. When pulling the second result, the query executes until the second result is evaluated, and so on. If pulling stops in the middle, the rest results are not evaluated. This behaviour is called lazy evaluation. To demonstrate the evaluation, add tracing to Select query’s iteration control flow:

internal static IEnumerable<TResult> SelectGenerator<TSource, TResult>(
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
"Select query starts.".WriteLine();
```
```
foreach (TSource value in source)
```
```
{
```
```
$"Select query calls selector with {value}.".WriteLine();
```
```
TResult result = selector(value);
```
```
$"Select query yields {result}.".WriteLine();
```
```
yield return result;
```
```
}
```
```
"Select query ends.".WriteLine();
```

}

The above foreach statement can be desugared as the following actual control flow:

internal static IEnumerable<TResult> DesugaredSelectGenerator<TSource, TResult>(
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
"Select query starts.".WriteLine();
```
```
IEnumerator<TSource> sourceIterator = null; // start.
```
```
try
```
```
{
```
```
sourceIterator = source.GetEnumerator(); // start.
```
```
while (sourceIterator.MoveNext()) // moveNext.
```
```
{
```
```
$"Select query calls selector with {sourceIterator.Current}.".WriteLine(); // getCurrent.
```
```
TResult result = selector(sourceIterator.Current); // getCurrent.
```
```
$"Select query yields {result}.".WriteLine(); // getCurrent.
```
```
yield return result; // getCurrent.
```
```
}
```
```
}
```
```
finally
```
```
{
```
```
sourceIterator?.Dispose(); // dispose.
```
```
}
```
```
"Select query ends.".WriteLine(); // end.
```

}

Its compilation is equivalent to the following generator construction:

internal static IEnumerable<TResult> CompiledSelectGenerator<TSource, TResult>(
```
this IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
return new Generator<TResult>(
```
```
start: () =>
```
```
{
```
```
"Select query starts.".WriteLine();
```
```
sourceIterator = source.GetEnumerator();
```
```
},
```
```
moveNext: () => sourceIterator.MoveNext(),
```
```
getCurrent: () =>
```
```
{
```
```
$"Select query calls selector with {sourceIterator.Current}.".WriteLine();
```
```
TResult result = selector(sourceIterator.Current);
```
```
$"Select query yields {result}.".WriteLine();
```
```
return result;
```
```
},
```
```
dispose: () => sourceIterator?.Dispose(),
```
```
end: () => "Select query ends.".WriteLine());
```

}

Similarly, add tracing to Where query as well:

internal static IEnumerable<TSource> WhereGenerator<TSource>(
```
this IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```
{
```
```
"Where query starts.".WriteLine();
```
```
foreach (TSource value in source)
```
```
{
```
```
$"Where query calls predicate with {value}.".WriteLine();
```
```
if (predicate(value))
```
```
{
```
```
$"Where query yields {value}.".WriteLine();
```
```
yield return value;
```
```
}
```
```
}
```
```
"Where query ends.".WriteLine();
```

}

Its compilation is also a generator construction, equivalent to the following:

internal static IEnumerable<TSource> CompiledWhereGenerator<TSource>(
```
this IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
return new Generator<TSource>(
```
```
start: () =>
```
```
{
```
```
"Where query starts.".WriteLine();
```
```
sourceIterator = source.GetEnumerator();
```
```
},
```
```
moveNext: () =>
```
```
{
```
```
while (sourceIterator.MoveNext())
```
```
{
```
```
$"Where query calls predicate with {sourceIterator.Current}."
```
```
.WriteLine();
```
```
if (predicate(sourceIterator.Current))
```
```
{
```
```
return true;
```
```
}
```
```
}
```
```
return false;
```
```
},
```
```
getCurrent: () =>
```
```
{
```
```
$"Where query yields {sourceIterator.Current}.".WriteLine();
```
```
return sourceIterator.Current;
```
```
},
```
```
dispose: () => sourceIterator?.Dispose(),
```
```
end: () => "Where query ends.".WriteLine());
```

}

The following LINQ query is a composition of Where and Select:

internal static void CallWhereAndSelect()
```
{
```
```
IEnumerable<int> source = Enumerable.Range(1, 5);
```
```
IEnumerable<string> deferredQuery = source)
```
```
.WhereGenerator(int32 => int32 > 2) // Deferred execution.
```
```
.SelectGenerator(int32 => new string('*', int32)); // Deferred execution.
```
```
foreach (string result in deferredQuery)
```
```
{
```
```
// Select query starts.
```
```
// Where query starts.
```
```
// Where query calls predicate with 1.
```
```
// Where query calls predicate with 2.
```
```
// Where query calls predicate with 3.
```
```
// Where query yields 3.
```
```
// Select query calls selector with 3.
```
```
// Select query yields ***.
```
```
// Where query calls predicate with 4.
```
```
// Where query yields 4.
```
```
// Select query calls selector with 4.
```
```
// Select query yields ****.
```
```
// Where query calls predicate with 5.
```
```
// Where query yields 5.
```
```
// Select query calls selector with 5.
```
```
// Select query yields *****.
```
```
// Where query ends.
```
```
// Select query ends.
```
```
}
```

}

The tracing messages shows how exactly the lazy evaluation works in deferred execution. When WhereGenerator and SelectGenerator are called, the mapping query and filtering query are not executed. The composited query is the output sequence of SelectGenerator. When pulling the first result, Select starts execution, Select pulls the first results from its source sequence, which is the output sequence of Where, so that Where query starts execution, and pulls its source sequence. Where first retrieves 1, and calls its predicate function with 1. In this case, the output of predicate is false, so Where does not yield 1, but pulls the next value 2 from its source sequence, and calls predicate with 2. Again, the output of predicate is false, so Where does not yield 2, but pulls the next value 3 from its source sequence. This time, the output of predicate function is true, so Where query yields 3 to Select query. Select retrieves 3 and calls its selector function with 3. Eventually Select yields selector output \*\*\* as the first result of composited query. Then Select query pulls the next value from Where query, Where query pulls the next value from source. Where query retrieves 4 and calls predicate with 4. The output of predicate is true, so Where query yields 4 to Select query. Select query retrieves 4 and calls selector with 4. Eventually Select yields selector output \*\*\*\* as the second result of the composited query, and so on.

The opposition of lazy evaluation is eager evaluation, where pulling the first result causes all results being evaluated. For example, Reverse query is a sequence query, and it implements deferred execution. When its result sequence is pulled for the first time, it starts execution. It has to evaluate and store all the values of source sequence, in order to yields the last source value as the first query result. The following is the equivalent implementation of Reverse. Again, to demonstrate the evaluation, tracing is added as well:

internal static IEnumerable<TSource> ReverseGenerator<TSource>(
```
this IEnumerable<TSource> source)
```
```
{
```
```
"Reverse query starts.".WriteLine();
```
```
TSource[] results = source.ToArray();
```
```
$"Reverse query has all {results.Length} value(s) of source sequence.".WriteLine();
```
```
for (int index = results.Length - 1; index >= 0; index--)
```
```
{
```
```
$"Reverse query yields index {index} of source sequence.".WriteLine();
```
```
yield return results[index];
```
```
}
```
```
"Reverse query ends.".WriteLine();
```

}

Its compilation is equivalent to the following generator construction:

internal static IEnumerable<TSource> CompiledReverseGenerator<TSource>(this IEnumerable<TSource> source)
```
{
```
```
TSource[] results = null;
```
```
int index = 0;
```
```
return new Generator<TSource>(
```
```
start: () =>
```
```
{
```
```
"Reverse query starts.".WriteLine();
```
```
results = source.ToArray();
```
```
$"Reverse query evaluated all {results.Length} value(s) of source sequence.".WriteLine();
```
```
index = results.Length - 1;
```
```
},
```
```
moveNext: () => index >= 0,
```
```
getCurrent: () =>
```
```
{
```
```
$"Reverse query yields index {index} of source source.".WriteLine();
```
```
return results[index--];
```
```
},
```
```
end: () => "Reverse query ends.".WriteLine());
```

}

The following example is the composition of Select query and Reverse query:

internal static void CallSelectAndReverse()
```
{
```
```
IEnumerable<string> deferredQuery = Enumerable.Range(1, 5)
```
```
.SelectGenerator(int32 => new string('*', int32)) // Deferred execution.
```
```
.ReverseGenerator(); // Deferred execution.
```
```
foreach (string result in deferredQuery)
```
```
{
```
```
// Reverse query starts.
```
```
// Select query starts.
```
```
// Select query calls selector with 1.
```
```
// Select query yields *.
```
```
// Select query calls selector with 2.
```
```
// Select query yields **.
```
```
// Select query calls selector with 3.
```
```
// Select query yields ***.
```
```
// Select query calls selector with 4.
```
```
// Select query yields ****.
```
```
// Select query calls selector with 5.
```
```
// Select query yields *****.
```
```
// Select query ends.
```
```
// Reverse query has all 5 value(s) of source sequence.
```
```
// Reverse query yields index 4 of source sequence.
```
```
// Reverse query yields index 3 of source sequence.
```
```
// Reverse query yields index 2 of source sequence.
```
```
// Reverse query yields index 1 of source sequence.
```
```
// Reverse query yields index 0 of source sequence.
```
```
// Reverse query ends.
```
```
}
```

}

The tracing messages shows how exactly the eager evaluation works in deferred execution. When pulling the first result, Reverse starts execution. Reverse pulls all values from its source sequence, which is the output generator of Select, so that Select query starts execution. Select pulls all values from its source sequence store them, calls selector function, and yields all results to Reverse query. Reverse retrieves and stores all values, and yields the last value as the first result. Then pulling the next query result causes Reverse direct yield the stored second last value, and so on.