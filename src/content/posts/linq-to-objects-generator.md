---
title: "LINQ to Objects in Depth (3) Generator"
published: 2019-07-03
description: "After understanding how to use LINQ to Objects queries, this chapter starts to discuss how these queries work internally, including how they execute and how they are implemented. These insights help d"
image: ""
tags: [".NET", "C#", "LINQ", "LINQ to Objects", "LINQ via C#", "Haskell", "F#", "JavaScript"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

After understanding how to use LINQ to Objects queries, this chapter starts to discuss how these queries work internally, including how they execute and how they are implemented. These insights help developer mastering LINQ to Objects.

## Generator

Most LINQ to Objects queries has an IEnumerable<T> output. They can be easily implemented with “brute force”. Take the simple query Repeat as example:

internal static IEnumerable<TSource> RepeatArray<TSource>(TSource value, int count)
```
{
```
```
TSource[] results = new TSource[count];
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
results[index] = value;
```
```
}
```
```
return results;
```

}

The problem is, when the above Repeat query is called, it immediately generates all query results, stores them in an array, and outputs to the caller. When the count argument is large, this implementation consumes large memory. This can be resolved by properly following the iterator pattern.

### Implement iterator pattern

The iterator pattern is imperative and object-oriented. It has a sequence represented by IEnumerable<T>, and an iterator represented by IEnumerator<T>. According to the definition of IEnumerator<T>, apparently the iterator is stateful. The following is a general-purpose iterator implemented as a finite-state machine:

public enum IteratorState
```
{
```
```
Create = -2,
```
```
Start = 0,
```
```
MoveNext = 1,
```
```
End = -1,
```
```
Error = -3
```
```
}
```

```csharp
public class Iterator<T> : IEnumerator<T>
```
```
{
```
```csharp
protected readonly Action start;
```

```csharp
protected readonly Func<bool> moveNext;
```

```csharp
protected readonly Func<T> getCurrent;
```

```csharp
protected readonly Action dispose;
```

```csharp
protected readonly Action end;
```
```
public Iterator(
```
```
Action start = null,
```
```
Func<bool> moveNext = null,
```
```
Func<T> getCurrent = null,
```
```
Action dispose = null,
```
```
Action end = null)
```
```
{
```
```
this.start = start;
```
```
this.moveNext = moveNext;
```
```
this.getCurrent = getCurrent;
```
```
this.dispose = dispose;
```
```
this.end = end;
```
```
}
```

```csharp
public T Current { get; private set; }
```
```
object IEnumerator.Current => this.Current;
```

```csharp
internal IteratorState State { get; private set; } = IteratorState.Create; // IteratorState: Create.
```
```
internal Iterator<T> Start()
```
```
{
```
```
this.State = IteratorState.Start; // IteratorState: Create => Start.
```
```
return this;
```
```
}
```
```
public bool MoveNext()
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
switch (this.State)
```
```
{
```
```
case IteratorState.Start:
```
```
this.start?.Invoke();
```
```
this.State = IteratorState.MoveNext; // IteratorState: Start => MoveNext.
```
```
goto case IteratorState.MoveNext;
```
```
case IteratorState.MoveNext:
```
```
if (this.moveNext?.Invoke() ?? false)
```
```
{
```
```
this.Current = this.getCurrent != null ? this.getCurrent() : default;
```
```
return true; // IteratorState: MoveNext => MoveNext.
```
```
}
```
```
this.State = IteratorState.End; // IteratorState: MoveNext => End.
```
```
this.dispose?.Invoke();
```
```
this.end?.Invoke();
```
```
break;
```
```
}
```
```
return false;
```
```
}
```
```
catch
```
```
{
```
```
this.State = IteratorState.Error; // IteratorState: Start, MoveNext, End => Error.
```
```
this.Dispose();
```
```
throw;
```
```
}
```
```
}
```
```
public void Dispose()
```
```
{
```
```
if (this.State == IteratorState.Error || this.State == IteratorState.MoveNext)
```
```
{
```
```
try { }
```
```
finally
```
```
{
```
```
// Unexecuted finally blocks are executed before the thread is aborted.
```
```
this.State = IteratorState.End; // IteratorState: Error => End.
```
```
this.dispose?.Invoke();
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
public void Reset() => throw new NotSupportedException();
```

}

The sequence can be simply viewed as an iterator factory:

public class Sequence<T> : IEnumerable<T>
```
{
```
```csharp
private readonly Func<Iterator<T>> iteratorFactory;
```
```
public Sequence(Func<Iterator<T>> iteratorFactory) =>
```
```
this.iteratorFactory = iteratorFactory;
```
```
public IEnumerator<T> GetEnumerator() =>
```
```
this.iteratorFactory().Start(); // IteratorState: Create => Start.
```
```
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

}

The above iterator encapsulates 5 functions (start, moveNext, getCurrent, end, dispose) in the iteration control flow, and manages 5 states:

· Create: if an iterator is constructed on the fly, its initial state is Create.

· Start: if an iterator is created by sequence’s factory method, its state is Start. Later, if its MoveNext is called for the first time, the start function is called to do the initialization work. Then, the state changes to MoveNext

· MoveNext: After its MoveNext method being called for the first time, its state is MoveNext. Each time its MoveNext method is called, the moveNext function is called to output a bool value

o If the output is true, the iterator has a value available for the caller, and getCurrent function can be called through its Current property to pull that value; The state remains MoveNext.

o If false, there is no value available. The state changes to End, and the dispose function is called to release resources, then end functions is called to do the cleanup work;

· End: if its MoveNext method is called and the state is End, false is directly returned to indicate caller that the sequential traversal ended, there is no value available to pull.

· Error: if its MoveNext method throws an exception, the state changes to Error. Then its Dispose method is called to do the cleanup work, and eventually its state is changed to End.

Now Sequence<T> and Iterator<T> can be used to implement Repeat with improved performance:

internal static IEnumerable<TSource> RepeatSequence<TSource>(
```
TSource value, int count) =>
```
```
new Sequence<TSource>(() =>
```
```
{
```
```
int index = 0;
```
```
return new Iterator<TSource>(
```
```
moveNext: () => index++ < count,
```
```
getCurrent: () => value);
```

});

When the above RepeatSequence is called, it does not generate and store all repeated values. It only constructs a sequence instance with an iterator factory function, which then can be consumed by caller with a foreach statement:

internal static void CallRepeatSequence<TSource>(TSource value, int count)
```
{
```
```
foreach (TSource result in RepeatSequence(value, count)) { }
```
```
// Compiled to:
```
```
using (IEnumerator<TSource> iterator = RepeatSequence(value, count).GetEnumerator())
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
TSource result = iterator.Current;
```
```
}
```
```
// Virtual control flow inside iterator:
```
```
int index = 0;
```
```
try
```
```
{
```
```
while (index++ < count)
```
```
{
```
```
TSource result = value;
```
```
}
```
```
}
```
```
finally { }
```
```
}
```

}

The foreach statement is compiled to a call to the sequence’s GetEnumerator method to get an iterator, and a while loop to poll iterator’s MoveNext method and Current property getter. The iterator’s state is an int value to indicate current result’ index in all results. When MoveNext is called, it checks and mutates the state. If the state is valid, a result is available be pulled from Current. With iterator pattern, RepeatSequence is improved from RepeatArray. The results now are on-demand, they are not generated and stored in advance.

Another example is Select query. It accepts an input source sequence and constructs a new result sequence, by mapping each source value to another result with a selector function. It can be implemented following iterator pattern:

internal static IEnumerable<TResult> SelectSequence<TSource, TResult>(
```
IEnumerable<TSource> source, Func<TSource, TResult> selector) =>
```
```
new Sequence<TResult>(() =>
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
return new Iterator<TResult>(
```
```
start: () => sourceIterator = source.GetEnumerator(),
```
```
moveNext: () => sourceIterator.MoveNext(),
```
```
getCurrent: () => selector(sourceIterator.Current),
```
```
dispose: () => sourceIterator?.Dispose());
```

});

So that, Select dos not map or store any query result. It only constructs a sequence and never calls the selector function. When caller pulls each result from the output sequence, the selector function is called and result is evaluated:

internal static void CallSelectSequence<TSource, TResult>(
```
IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
foreach (TResult result in SelectSequence(source, selector)) { }
```
```
// Compiled to:
```
```
using (IEnumerator<TResult> iterator = SelectSequence(source, selector).GetEnumerator())
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
TResult result = iterator.Current;
```
```
}
```
```
// Virtual control flow inside iterator:
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
try
```
```
{
```
```
sourceIterator = source.GetEnumerator();
```
```
while (sourceIterator.MoveNext())
```
```
{
```
```
TResult result = selector(sourceIterator.Current);
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
sourceIterator?.Dispose();
```
```
}
```
```
}
```

}

Similarly, Where can be implemented with this pattern to filter the source sequence with a predicate function:

internal static IEnumerable<TSource> WhereSequence<TSource>(
```
IEnumerable<TSource> source, Func<TSource, bool> predicate) =>
```
```
new Sequence<TSource>(() =>
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
return new Iterator<TSource>(
```
```
start: () => sourceIterator = source.GetEnumerator(),
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
getCurrent: () => sourceIterator.Current,
```
```
dispose: () => sourceIterator?.Dispose());
```

});

Again, Where does not filter the source or store the filtering results. It only constructs a sequence and never calls predicate function. When caller starts to pull a result from the output sequence, the predicate function is called:

internal static void CallWhereSequence<TSource>(
```
IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```
{
```
```
foreach (TSource result in WhereSequence(source, predicate)) { }
```
```
// Compiled to:
```
```
using (IEnumerator<TSource> iterator = WhereSequence(source, predicate).GetEnumerator())
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
TSource result = iterator.Current;
```
```
}
```
```
// Virtual control flow inside iterator:
```
```
IEnumerator<TSource> sourceIterator = null;
```
```
try
```
```
{
```
```
sourceIterator = source.GetEnumerator();
```
```
while (sourceIterator.MoveNext())
```
```
{
```
```
if (predicate(sourceIterator.Current))
```
```
{
```
```
TSource result = sourceIterator.Current;
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
finally
```
```
{
```
```
sourceIterator?.Dispose();
```
```
}
```
```
}
```

}

With sequence and iterator, the LINQ sequential queries can be correctly implemented with expected performance. However, since the iterator pattern is imperative and stateful, it is not straightforward to specify how to construct sequence and how to construct iterator, and the actual iteration workflow is not intuitive as well. Another example is to define a custom FromValue query to generate a sequence from a single value, following the iterator pattern:

internal static IEnumerable<TSource> FromValueSequence<TSource>(TSource value) =>
```
new Sequence<TSource>(() =>
```
```
{
```
```
bool isValueIterated = false;
```
```
return new Iterator<TSource>(
```
```
moveNext: () =>
```
```
{
```
```
if (!isValueIterated)
```
```
{
```
```
isValueIterated = true;
```
```
return true;
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
getCurrent: () => value);
```

});

It uses a bool value as iterator state, so that the value cam be pulled only once:

internal static void CallFromValueSequence<TSource>(TSource value)
```
{
```
```
foreach (TSource result in FromValueSequence(value)) { }
```
```
// Compiled to:
```
```
using (IEnumerator<TSource> iterator = FromValueSequence(value).GetEnumerator())
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
TSource result = iterator.Current;
```
```
}
```
```
// Virtual control flow inside iterator:
```
```
bool isValueIterated = false;
```
```
try
```
```
{
```
```
while (!isValueIterated)
```
```
{
```
```
isValueIterated = true;
```
```
TSource result = value;
```
```
}
```
```
}
```
```
finally { }
```
```
}
```

}

To simplify the coding, C# provides yield statement.

### yield statement

C# 2.0 introduces the yield statement for named functions to implement iterator pattern, without defining and constructing sequence and iterator. The following example is equivalent to above RepeatSequence:

internal static IEnumerable<TSource> RepeatYield<TSource>(TSource value, int count)
```
{
```
```
// Virtual control flow when iterating the results:
```
```
// int index = 0;
```
```
// try
```
```
// {
```
```
// while (index++ < count)
```
```
// {
```
```
// TSource result = value;
```
```
// }
```
```
// }
```
```
// finally { }
```
```
int index = 0;
```
```
try
```
```
{
```
```
while (index++ < count)
```
```
{
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
finally { }
```

}

With the yield statement, the start, moveNext, getCurrent, end, dispose functions for iteration are merged into a fluent and intuitive control flow. The yield statement is a syntactic sugar. The compilation of RepeatYield is just slightly different from the previous RepeatSequence implementation with the standard iteration pattern. C# compiler generates a generator type for each named function with yield statement and IEnumerable/IEnumerable<T> output. A generator is both a sequence and an iterator, which can be virtually viewed as:

public interface IGenerator<out T\> : IEnumerable<T\>, IEnumerator<T\> { }

In another word, a generator is an iterator with an additional factory method GetEnumerator, which does a little more work:

public class Generator<T> : Iterator<T>, IGenerator<T>
```
{
```
```csharp
private readonly int initialThreadId = Environment.CurrentManagedThreadId;
```
```
public Generator(
```
```
Action start = null,
```
```
Func<bool> moveNext = null,
```
```
Func<T> getCurrent = null,
```
```
Action dispose = null,
```
```
Action end = null) : base(start, moveNext, getCurrent, dispose, end)
```
```
{ }
```
```
public IEnumerator<T> GetEnumerator() =>
```
```
this.initialThreadId == Environment.CurrentManagedThreadId
```
```
&& this.State == IteratorState.Create
```
```
// Called by the same initial thread and iteration is not started.
```
```
? this.Start()
```
```
// If the iteration is already started, or the iteration is requested from a different thread, create new generator with new iterator.
```
```
: new Generator<T>(this.start, this.moveNext, this.getCurrent, this.dispose, this.end).Start();
```
```
IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
```

}

When generator is constructed, it remembers the thread id. Later, if its factory method is called by the same thread and the generator’s state has not been mutated, the output is itself; if the its factory is called again by the same thread after its state is mutated, or called by another thread, the output is a new generator. So, the compilation of RepeatYield is equivalent to:

internal static IEnumerable<TSource> RepeatGenerator<TSource>(TSource value, int count)
```
{
```
```
int index = 0;
```
```
return new Generator<TSource>(
```
```
moveNext: () => index++ < count,
```
```
getCurrent: () => value);
```

}

The control flow with yield statement can be viewed as normal control flow, so the above control flows can be further simplified, with the same way of simplifying normal C# code. Here the try-finally statement is not needed, so can be removed. And the while loop is equivalent to the following for loop:

internal static IEnumerable<TSource> Repeat<TSource>(TSource value, int count)
```
{
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
yield return value;
```
```
}
```

}

So, yield statement greatly simplifies the implementation of iterator pattern. Again, the above for loop is a virtual control flow. At compile time, a generator type is generated to do the real work, and Repeat is compiled to just construct and output a generator. At runtime, when Repeat is called, the for loop is not executed and no query result is evaluated or stored; only when the caller pulls result, the generator yields repeated query results with the specified count.

Similarly, Select and Where standard queries can also be implemented with yield statement following their iteration control flows:

internal static IEnumerable<TResult> SelectYield<TSource, TResult>(
```
IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
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
yield return selector(sourceIterator.Current); // getCurrent.
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
// Compiled to:
```
```
// IEnumerator<TSource> sourceIterator = null;
```
```
// return new Generator<TResult>(
```
```
// start: () => sourceIterator = source.GetEnumerator(),
```
```
// moveNext: () => sourceIterator.MoveNext(),
```
```
// getCurrent: () => selector(sourceIterator.Current),
```
```
// dispose: () => sourceIterator?.Dispose());
```
```
}
```
```
internal static IEnumerable<TSource> WhereYield<TSource>(
```
```
IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```
{
```
```
IEnumerator<TSource> sourceIterator = null;
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
if (predicate(sourceIterator.Current)) // moveNext.
```
```
{
```
```
yield return sourceIterator.Current; // getCurrent.
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
// Compiled to:
```
```
// IEnumerator<TSource> sourceIterator = null;
```
```
// return new Generator<TSource>(
```
```
// start: () => sourceIterator = source.GetEnumerator(),
```
```
// moveNext: () =>
```
```
// {
```
```
// while (sourceIterator.MoveNext())
```
```
// {
```
```
// if (predicate(sourceIterator.Current))
```
```
// {
```
```
// return true;
```
```
// }
```
```
// }
```
```
//
```
```
// return false;
```
```
// },
```
```
// getCurrent: () => sourceIterator.Current,
```
```
// dispose: () => sourceIterator?.Dispose());
```

}

These control flows can be simplified with a foreach statement:

internal static IEnumerable<TResult> Select<TSource, TResult>(
```
IEnumerable<TSource> source, Func<TSource, TResult> selector)
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
yield return selector(value);
```
```
}
```
```
}
```
```
internal static IEnumerable<TSource> Where<TSource>(
```
```
IEnumerable<TSource> source, Func<TSource, bool> predicate)
```
```
{
```
```
foreach (TSource value in source)
```
```
{
```
```
if (predicate(value))
```
```
{
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

}

The FromValue custom query can be implemented with yield statement too:

internal static IEnumerable<TSource> FromValueYield<TSource>(TSource value)
```
{
```
```
bool isValueIterated = false;
```
```
try
```
```
{
```
```
while (!isValueIterated) // moveNext.
```
```
{
```
```
isValueIterated = true; // moveNext.
```
```
yield return value; // getCurrent.
```
```
}
```
```
}
```
```
finally { }
```
```
// Compiled to:
```
```
// bool isValueIterated = false;
```
```
// return new Generator<TSource>(
```
```
// moveNext: () =>
```
```
// {
```
```
// while (!isValueIterated)
```
```
// {
```
```
// isValueIterated = true;
```
```
// return true;
```
```
// }
```
```
//
```
```
// return false;
```
```
// },
```
```
// getCurrent: () => value);
```

}

The above try-finally statement, state checking and mutation are not needed. It is the same control flow as the following:

internal static IEnumerable<TSource\> FromValue<TSource\>(TSource value)
```
{
```
```
yield return value;
```

}

A named function with yield statement must have an IEnumerable/IEnumerable<T> output, or an IEnumerator/IEnumerator<T> output. As demonstrated above, when it outputs a sequence, it is compiled to generator construction. When it outputs an iterator, it is compiled to iterator construction. Take Repeat as example, its output can also be IEnumerator<T>:

internal static IEnumerator<TSource> RepeatIterator<TSource>(TSource value, int count)
```
{
```
```
for (int index = 0; index < count; index++)
```
```
{
```
```
yield return value;
```
```
}
```
```
// Compiled to:
```
```
// int index = 0;
```
```
// return new Iterator<TSource>(
```
```
// moveNext: () => index++ < count,
```
```
// getCurrent: () => value).Start();
```
```
}
```
```
internal static void CallRepeatIterator<TSource>(TSource value, int count)
```
```
{
```
```
using (IEnumerator<TSource> iterator = RepeatIterator(value, count))
```
```
{
```
```
while (iterator.MoveNext())
```
```
{
```
```
TSource result = iterator.Current;
```
```
}
```
```
}
```

}

The yield statement has another form as yield break, which means to end the iteration. For example, the following function outputs a sequence of 0, 1, 2:

internal static IEnumerable<int> YieldBreak()
```
{
```
```
yield return 1;
```
```
yield return 2;
```
```
yield return 3;
```
```
yield break;
```
```
yield return 4;
```

}

The Repeat query can be implemented with the following equivalent control flow and yield break:

internal static IEnumerable<TSource> RepeatYieldBreak<TSource>(TSource value, int count)
```
{
```
```
int index = 0;
```
```
while (true)
```
```
{
```
```
if (index++ < count)
```
```
{
```
```
yield return value;
```
```
}
```
```
else
```
```
{
```
```
yield break;
```
```
}
```
```
}
```

}