---
title: "LINQ to Objects in Depth (3) Generator"
published: 2018-07-05
description: "After understanding how to use LINQ to Objects, starting from this part, the implementation of query methods is discussed. Most LINQ to Object query methods are implemented with iteration pattern and"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[LINQ to Objects in Depth series](/archive/?tag=LINQ%20to%20Objects)\]

## **Latest version: [https://weblogs.asp.net/dixin/linq-to-objects-generator](/posts/linq-to-objects-generator "https://weblogs.asp.net/dixin/linq-to-objects-generator")**

After understanding how to use LINQ to Objects, starting from this part, the implementation of query methods is discussed. Most LINQ to Object query methods are implemented with iteration pattern and generators.

## Implement iterator pattern

The iterator pattern can decouple data can algorithm, where the sequence (also called container of items, or aggregate of elements) encapsulates the data to iterate, and the iterator encapsulates the algorithms of iterating the data, and return each value to the caller. As fore mentioned, iterator is imperative and stateful. The following is a general purpose iterator implemented as an [finite-state machine](https://en.wikipedia.org/wiki/Finite-state_machine):

```csharp
public enum IteratorState
{
    Create = -2,
    Start = 0,
    MoveNext = 1,
    End = -1,
    Error = -3
}

public class Iterator<T> : IEnumerator<T>
{
    private readonly Action start;

    private readonly Func<bool> moveNext;

    private readonly Func<T> getCurrent;

    private readonly Action dispose;

    private readonly Action end;

    public Iterator(
        Action start = null,
        Func<bool> moveNext = null,
        Func<T> getCurrent = null,
        Action dispose = null,
        Action end = null)
    {
        this.start = start;
        this.moveNext = moveNext;
        this.getCurrent = getCurrent;
        this.dispose = dispose;
        this.end = end;
    }

    public T Current { get; private set; }

    object IEnumerator.Current => this.Current;

    internal IteratorState State { get; private set; } = IteratorState.Create; // IteratorState: Create.

    internal Iterator<T> Start()
    {
        this.State = IteratorState.Start;  // IteratorState: Create => Start.
        return this;
    }

    public bool MoveNext()
    {
        try
        {
            switch (this.State)
            {
                case IteratorState.Start:
                    this.start?.Invoke();
                    this.State = IteratorState.MoveNext; // IteratorState: Start => MoveNext.
                    goto case IteratorState.MoveNext;
                case IteratorState.MoveNext:
                    if (this.moveNext?.Invoke() ?? false)
                    {
                        this.Current = this.getCurrent != null ? this.getCurrent() : default;
                        return true; // IteratorState: MoveNext => MoveNext.
                    }
                    this.State = IteratorState.End; // IteratorState: MoveNext => End.
                    this.dispose?.Invoke();
                    this.end?.Invoke();
                    break;
            }
            return false;
        }
        catch
        {
            this.State = IteratorState.Error; // IteratorState: Start, MoveNext, End => Error.
            this.Dispose();
            throw;
        }
    }

    public void Dispose()
    {
        if (this.State == IteratorState.Error || this.State == IteratorState.MoveNext)
        {
            try { }
            finally
            {
                // Unexecuted finally blocks are executed before the thread is aborted.
                this.State = IteratorState.End; // IteratorState: Error => End.
                this.dispose?.Invoke();
            }
        }
    }

    public void Reset() => throw new NotSupportedException();
}
```

The following is a general purpose sequence implementation as above iterator’s factory:

```csharp
public class Sequence<T, TData> : IEnumerable<T>
{
    private readonly TData data;

    private readonly Func<TData, Iterator<T>> iteratorFactory;

    public Sequence(TData data, Func<TData, Iterator<T>> iteratorFactory)
    {
        this.data = data;
        this.iteratorFactory = iteratorFactory;
    }

    public IEnumerator<T> GetEnumerator() =>
        this.iteratorFactory(this.data).Start(); // IteratorState: Create => Start.

    IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();
}
```

The above iterator encapsulates traversal algorithm represented by 5 functions: start, moveNext, getCurrent, end, dispose, and manages 5 states:

-   Create: if a iterator is constructed on the fly, its initial state is Create.
-   Start: if an iterator is created by sequence’s factory method, its state is Start. Later, if its MoveNext is called for the first time, the start function is called to do the initialization work. Then, the state changes to MoveNext
-   MoveNext: After its MoveNext method being called for the first time, its state is MoveNext. Each time its MoveNext method is called, the moveNext function is called to return a bool value
    -   If true is returned, there is a value available, and getCurrent function can be called through its Current property to pull that value; The state remains MoveNext.
    -   If false, there is no value available to pull from its Current property. The state changes to End, and the dispose function is called to release resources, then end functions is called to do the cleanup work;
-   End: if its MoveNext method is called and the state is End, false is directly returned to indicate caller that the sequential traversal ended, there is no value available to pull.
-   Error: if its MoveNext method throws an exception, the state changes to Error. Then its Dispose method is called to do the cleanup work, and eventually its state is changed to End.

[![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/LINQ-to-Objects-3-Generator_891E/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/LINQ-to-Objects-3-Generator_891E/image_thumb1_2.png)

The above sequence encapsulates the data to generate the values from, and also provides the iterator factory method. When its GetEnumerator method is called, an iterator is created with state changes from Create to Start.

## Generate sequence and iterator

Now the Sequence<T> and Iterator<T> types can be used to create sequence with specific data and specific iteration algorithm. A simple example is to create a singleton sequence with only 1 value:
```
internal static partial class IteratorPattern
{
    internal static IEnumerable<TSource> FromValue<TSource>(TSource value) =>
        new Sequence<TSource, bool>(
            data: false, // bool isValueIterated = false;
            iteratorFactory: isValueIterated => new Iterator<TSource>(
                moveNext: () =>
                    {
                        while (!isValueIterated)
                        {
                            isValueIterated = true;
                            return true;
                        }
                        return false;
                    },
                getCurrent: () => value));
}
```

Here a bool flag is used to indicate if the value is already iterated. The iterator’s moveNext function checks that bool flag and updates it, so that the value is made available only once. The created sequence can be consumed by foreach loop:
```
internal static void ForEachFromValue<TSource>(TSource value)
{
    foreach (TSource result in FromValue(value)) { }
}
```

As fore mentioned, foreach loop is compiled to while loop. The following code demonstrates the underlying imperative control flow of iteration:
```
internal static void CompiledForEachFromValue<TSource>(TSource value)
{
    using (IEnumerator<TSource> iterator = FromValue(value).GetEnumerator())
    {
        // bool isValueIterated = false;
        while (iterator.MoveNext()) // moveNext: while (!isValueIterated)
        {
            // moveNext: isValueIterated = true;
            TSource result = iterator.Current; // getCurrent: TSource result = value;
        }
    }

    // Virtual control flow when iterating the returned sequence:
    // bool isValueIterated = false;
    // try
    // {
    //    while (!isValueIterated)
    //    {
    //        isValueIterated = true;
    //        TSource result = value;
    //    }
    // }
    // finally { }
}
```

Another example is to create a sequence by repeating a specified value for specified times, which is the Repeat query method:
```
internal static IEnumerable<TSource> Repeat<TSource>(TSource value, int count) => 
    new Sequence<TSource, int>(
        data: 0, // int index = 0;
        iteratorFactory: index => new Iterator<TSource>(
            moveNext: () => index++ < count,
            getCurrent: () => value));
```

Similarly, the sequence created by Repeat can be consumed by foreach loop, which can be desugared to while loop:
```
internal static void CompiledForEachRepeat<TSource>(TSource value, int count)
{
    using (IEnumerator<TSource> iterator = Repeat(value, count).GetEnumerator())
    {
        // int index = 0;
        while (iterator.MoveNext()) // moveNext: while (index++ < count)
        {
            TSource result = iterator.Current; // getCurrent: TSource result = value;
        }
    }

    // Virtual control flow when iterating the returned sequence:
    // int index = 0;
    // try
    // {
    //    while (index++ < count)
    //    {
    //        TSource result = value; 
    //    }
    // }
    // finally { }
}
```

The following example creates a new sequence from another source sequence, by mapping each value to another result with a selector function, which is the Select query method:
```
internal static IEnumerable<TResult> Select<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector) =>
        new Sequence<TResult, IEnumerator<TSource>>(
            data: null, // IEnumerator<TSource> sourceIterator = null;
            iteratorFactory: sourceIterator => new Iterator<TResult>(
                start: () => sourceIterator = source.GetEnumerator(),
                moveNext: () => sourceIterator.MoveNext(),
                getCurrent: () => selector(sourceIterator.Current),
                dispose: () => sourceIterator?.Dispose()));
```

Again, the sequence created by Select can be consumed by foreach loop, which can be desugared to while loop:
```
internal static void CompiledForEachSelect<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    using (IEnumerator<TResult> iterator = Select(source, selector).GetEnumerator())
    {
        // IEnumerator<TSource> sourceIterator = null;
        // start: sourceIterator = source.GetEnumerator();
        while (iterator.MoveNext()) // moveNext: while (sourceIterator.MoveNext())
        {
            TResult result = iterator.Current; // getCurrent: TResult result = selector(sourceIterator.Current);
        }
    } // dispose: sourceIterator?.Dispose();

    // Virtual control flow when iterating the returned sequence:
    // IEnumerator<TSource> sourceIterator = null;
    // try
    // {
    //    sourceIterator = source.GetEnumerator();
    //    while (sourceIterator.MoveNext())
    //    {
    //        TResult result = selector(sourceIterator.Current);
    //    }
    // }
    // finally
    // {
    //    sourceIterator?.Dispose();
    // }
}
```

Here iterator’s start function retrieves source sequence’s iterator, and moveNext function use that source iterator to determine whether there is a next value from the source sequence. If yes, getCurrent function calls selector function to map each source value to a result value.

The last example is to create a sequence by filtering another source sequence with a predicate function, which is the Where query method:
```
internal static IEnumerable<TSource> Where<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate) =>
        new Sequence<TSource, IEnumerator<TSource>>(
            data: null, // IEnumerator<TSource> sourceIterator = null;
            iteratorFactory: sourceIterator => new Iterator<TSource>(
                start: () => sourceIterator = source.GetEnumerator(),
                moveNext: () =>
                {
                    while (sourceIterator.MoveNext())
                    {
                        if (predicate(sourceIterator.Current))
                        {
                            return true;
                        }
                    }
                    return false;
                },
                getCurrent: () => sourceIterator.Current,
                dispose: () => sourceIterator?.Dispose()));
```

Once again, the sequence created by Where can be consumed by foreach loop, which can be desugared to while loop:
```
internal static void CompiledForEachWhere<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    using (IEnumerator<TSource> iterator = Where(source, predicate).GetEnumerator())
    { // IEnumerator<TSource> sourceIterator = null;
        // start: sourceIterator = source.GetEnumerator();
        while (iterator.MoveNext()) // moveNext: while (sourceIterator.MoveNext())
        { // moveNext: if (predicate(sourceIterator.Current))
            TSource result = iterator.Current; // getCurrent: TResult result = sourceIterator.Current;
        }
    } // dispose: sourceIterator?.Dispose();

    // Virtual control flow when iterating the returned sequence:
    // IEnumerator<TSource> sourceIterator = null;
    // try
    // {
    //    sourceIterator = source.GetEnumerator();
    //    while (sourceIterator.MoveNext())
    //    {
    //        if (predicate(sourceIterator.Current))
    //        {
    //            TResult result = selector(sourceIterator.Current);
    //        }
    //    }
    // }
    // finally
    // {
    //    sourceIterator?.Dispose();
    // }
}
```

As demonstrated, following the iterator pattern, it is not that straightforward to create sequences and iterators from scratch. To simplify the work, C# provides a yield keyword.

## Yield statement and generator

C# 2.0 introduces the yield keyword to simplify the creation of sequence and iterator. The following example create an sequence equivalent to above FromValue method:
```
internal static IEnumerable<TSource> FromValueGenerator<TSource>(TSource value)
{
    // Virtual control flow when iterating the returned sequence:
    // bool isValueIterated = false;
    // try
    // {
    //    while (!isValueIterated)
    //    {
    //        isValueIterated = true;
    //        TSource result = value;
    //    }
    // }
    // finally { }

    bool isValueIterated = false;
    try
    {
        while (!isValueIterated) // moveNext.
        {
            isValueIterated = true; // moveNext.
            yield return value; // getCurrent.
        }
    }
    finally { }
}
```

The start, moveNext, getCurrent, end, dispose functions are merged into a natural and intuitive control flow. Similarly, the above Repeat, Select, Where can be implemented with yield following the control flow too:
```
internal static IEnumerable<TSource> RepeatGenerator<TSource>(TSource value, int count)
{
    // Virtual control flow when iterating the returned sequence:
    // int index = 0;
    // try
    // {
    //    while (index++ < count)
    //    {
    //        TSource result = value; 
    //    }
    // }
    // finally { }

    int index = 0;
    try
    {
        while (index++ < count) // moveNext.
        {
            yield return value; // getCurrent.
        }
    }
    finally { }
}

internal static IEnumerable<TResult> SelectGenerator<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    // Virtual control flow when iterating the returned sequence:
    // IEnumerator<TSource> sourceIterator = null;
    // try
    // {
    //    sourceIterator = source.GetEnumerator();
    //    while (sourceIterator.MoveNext())
    //    {
    //        TResult result = selector(sourceIterator.Current);
    //    }
    // }
    // finally
    // {
    //    sourceIterator?.Dispose();
    // }

    IEnumerator<TSource> sourceIterator = null;
    try
    {
        sourceIterator = source.GetEnumerator(); // start.
        while (sourceIterator.MoveNext()) // moveNext.
        {
            yield return selector(sourceIterator.Current); // getCurrent.
        }
    }
    finally
    {
        sourceIterator?.Dispose(); // dispose.
    }
}

internal static IEnumerable<TSource> WhereGenerator<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    // Virtual control flow when iterating the returned sequence:
    // IEnumerator<TSource> sourceIterator = null;
    // try
    // {
    //    sourceIterator = source.GetEnumerator();
    //    while (sourceIterator.MoveNext())
    //    {
    //        if (predicate(sourceIterator.Current))
    //        {
    //            TResult result = selector(sourceIterator.Current);
    //        }
    //    }
    // }
    // finally
    // {
    //    sourceIterator?.Dispose();
    // }

    IEnumerator<TSource> sourceIterator = null;
    try
    {
        sourceIterator = source.GetEnumerator(); // start.
        while (sourceIterator.MoveNext()) // moveNext.
        {
            if (predicate(sourceIterator.Current)) // moveNext.
            {
                yield return sourceIterator.Current; // getCurrent.
            }
        }
    }
    finally
    {
        sourceIterator?.Dispose(); // dispose.
    }
}
```

So yield statement simplified the implementation of iterator pattern, it enables describing the algorithm that how the values are iterated (yielded), without explicitly creating a sequence or iterator. Actually, above control flow can be further simplified. In FromValueGenerator, the bool state is unnecessary. All needed is to yield a single value to the caller. So FromValueGenerator is equivalent to:
```
internal static IEnumerable<TSource> FromValueGenerator<TSource>(TSource value)
{
    yield return value;
}
```

In RepeatGenerator, the while loop can be replaced by a for loop to improve the readability a little bit:
```
internal static IEnumerable<TSource> RepeatGenerator<TSource>(TSource value, int count)
{
    for (int index = 0; index < count; index++)
    {
        yield return value;
    }
}
```

In SelectGenerator and WhereGenerator, the using statement and while loop can be replaced by the foreach syntactic sugar:
```
internal static IEnumerable<TResult> SelectGenerator<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    foreach (TSource value in source)
    {
        yield return selector(value);
    }
}

internal static IEnumerable<TSource> WhereGenerator<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    foreach (TSource value in source)
    {
        if (predicate(value))
        {
            yield return value;
        }
    }
}
```

The C# compiler actually goes a little further when compiling function with yield syntactic sugar. Such a function with yield statement must return either sequence (represented by IEnumerable or IEnumerable<T>) or iterator (represented by IEnumerator or IEnumerator<T>). When such function returns IEnumerable<T> sequence, the entire function body is compiled to [generator](https://en.wikipedia.org/wiki/Generator_\(computer_programming\)) creation. A generator is both a sequence and a iterator:

```typescript
public interface IGenerator<out T> : IEnumerable<T>, IEnumerator<T> { }
```

With above sequence and iterator definition, a general purpose generator can be implemented easily:

```csharp
public class Generator<T, TData> : IGenerator<T>
{
    private readonly int initialThreadId = Environment.CurrentManagedThreadId;

    private readonly TData data;

    private readonly Func<TData, Iterator<T>> iteratorFactory;

    private readonly Iterator<T> initialIterator;

    public Generator(TData data, Func<TData, Iterator<T>> iteratorFactory)
    {
        this.data = data;
        this.iteratorFactory = iteratorFactory;
        this.initialIterator = iteratorFactory(data);
    }

    public IEnumerator<T> GetEnumerator()
    {
        if (this.initialThreadId == Environment.CurrentManagedThreadId
            && this.initialIterator.State == IteratorState.Create)
        {
            // When called by the same initial thread and iteration is not started, reuse self with initial iterator.
            this.initialIterator.Start();
            return this;
        }
        // If the iteration is already started, or the iteration is requested from a different thread, create new generator with new iterator.
        Generator<T, TData> generator = new Generator<T, TData>(this.data, this.iteratorFactory);
        generator.initialIterator.Start();
        return generator;
    }

    IEnumerator IEnumerable.GetEnumerator() => this.GetEnumerator();

    public void Dispose() => this.initialIterator.Dispose();

    public bool MoveNext() => this.initialIterator.MoveNext();

    public void Reset() => this.initialIterator.Reset();

    public T Current => this.initialIterator.Current;

    object IEnumerator.Current => this.Current;
}
```

The above FromValueGenerator, RepeatGenerator, SelectGenerator, WhereGenerator methods return IEnumerable<T> sequence, their compilation are equivalent to the following methods, where sequence creation is replaced by generator creation:
```
internal static IEnumerable<TSource> CompiledFromValueGenerator<TSource>(TSource value) =>
    new Generator<TSource, bool>(
        data: false, // bool isValueIterated = false;
        iteratorFactory: isValueIterated => new Iterator<TSource>(
            moveNext: () =>
            {
                while (!isValueIterated)
                {
                    isValueIterated = true;
                    return true;
                }
                return false;
            },
            getCurrent: () => value));

internal static IEnumerable<TSource> CompiledRepeatGenerator<TSource>(TSource value, int count) =>
    new Generator<TSource, int>(
        data: 0, // int index = 0;
        iteratorFactory: index => new Iterator<TSource>(
            moveNext: () => index++ < count,
            getCurrent: () => value));

internal static IEnumerable<TResult> CompiledSelectGenerator<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector) =>
        new Generator<TResult, IEnumerator<TSource>>(
            data: null, // IEnumerator<TSource> sourceIterator = null;
            iteratorFactory: sourceIterator => new Iterator<TResult>(
                start: () => sourceIterator = source.GetEnumerator(),
                moveNext: () => sourceIterator.MoveNext(),
                getCurrent: () => selector(sourceIterator.Current),
                dispose: () => sourceIterator?.Dispose()));

internal static IEnumerable<TSource> CompiledWhereGenerator<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate) =>
        new Generator<TSource, IEnumerator<TSource>>(
            data: null, // IEnumerator<TSource> sourceIterator = null;
            iteratorFactory: sourceIterator => new Iterator<TSource>(
                start: () => sourceIterator = source.GetEnumerator(),
                moveNext: () =>
                {
                    while (sourceIterator.MoveNext())
                    {
                        if (predicate(sourceIterator.Current))
                        {
                            return true;
                        }
                    }
                    return false;
                },
                getCurrent: () => sourceIterator.Current,
                dispose: () => sourceIterator?.Dispose()));
```

These methods can also return IEnumerator<T> iterator instead:
```
internal static IEnumerator<TSource> FromValueIterator<TSource>(TSource value)
{
    yield return value;
}

internal static IEnumerator<TSource> RepeatIterator<TSource>(TSource value, int count)
{
    for (int index = 0; index < count; index++)
    {
        yield return value;
    }
}

internal static IEnumerator<TResult> SelectIterator<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    foreach (TSource value in source)
    {
        yield return selector(value);
    }
}

internal static IEnumerator<TSource> WhereIterator<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    foreach (TSource value in source)
    {
        if (predicate(value))
        {
            yield return value;
        }
    }
}
```

Now the above methods are compiled to iterator creation, which are equivalent to:
```
internal static IEnumerator<TSource> CompiledFromValueIterator<TSource>(TSource value)
{
    bool isValueIterated = false;
    return new Iterator<TSource>(
        moveNext: () =>
        {
            while (!isValueIterated)
            {
                isValueIterated = true;
                return true;
            }
            return false;
        },
        getCurrent: () => value).Start();
}

internal static IEnumerator<TSource> CompiledRepeatIterator<TSource>(TSource value, int count)
{
    int index = 0;
    return new Iterator<TSource>(
        moveNext: () => index++ < count,
        getCurrent: () => value).Start();
}

internal static IEnumerator<TResult> CompiledSelectIterator<TSource, TResult>(
    IEnumerable<TSource> source, Func<TSource, TResult> selector)
{
    IEnumerator<TSource> sourceIterator = null;
    return new Iterator<TResult>(
        start: () => sourceIterator = source.GetEnumerator(),
        moveNext: () => sourceIterator.MoveNext(),
        getCurrent: () => selector(sourceIterator.Current),
        dispose: () => sourceIterator?.Dispose()).Start();
}

internal static IEnumerator<TSource> CompiledWhereIterator<TSource>(
    IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    IEnumerator<TSource> sourceIterator = null;
    return new Iterator<TSource>(
        start: () => sourceIterator = source.GetEnumerator(),
        moveNext: () =>
        {
            while (sourceIterator.MoveNext())
            {
                if (predicate(sourceIterator.Current))
                {
                    return true;
                }
            }
            return false;
        },
        getCurrent: () => sourceIterator.Current,
        dispose: () => sourceIterator?.Dispose()).Start();
}
```

## Iterator and generator in other languages

Other languages also have similar design for iterator pattern and generator. The following table compares similar APIs/language features of C#, F#, [Haskell](https://hackage.haskell.org/package/base-4.8.1.0/docs/Data-Foldable.html) and [JavaScript](https://msdn.microsoft.com/en-us/library/dn858237.aspx) ([ECMAScript 2015, 6th](http://www.ecma-international.org/ecma-262/6.0/#sec-iteration)):

<table border="0" cellpadding="0" cellspacing="0" width="692"><tbody><tr><td valign="top" width="158"></td><td valign="top" width="137">C#</td><td valign="top" width="130">F#</td><td valign="top" width="125">Haskell</td><td valign="top" width="140">JavaScript</td></tr><tr><td valign="top" width="158">Sequence/Container</td><td valign="top" width="137">IEnumerable&lt;T&gt;</td><td valign="top" width="130">seq&lt;'T&gt;</td><td valign="top" width="125">Foldable t</td><td valign="top" width="140">Iterable protocol</td></tr><tr><td valign="top" width="158">Get iterator</td><td valign="top" width="137">GetEnumerator</td><td valign="top" width="130">GetEnumerator</td><td valign="top" width="125"></td><td valign="top" width="140">Symbol.iterator</td></tr><tr><td valign="top" width="158">Iterator</td><td valign="top" width="137">IEnumerator&lt;T&gt;</td><td valign="top" width="130">IEnumerator&lt;T&gt;</td><td valign="top" width="125"></td><td valign="top" width="140">iterator protocol</td></tr><tr><td valign="top" width="158">Has next value</td><td valign="top" width="137">MoveNext</td><td valign="top" width="130">MoveNext</td><td valign="top" width="125"></td><td valign="top" width="140">next().done</td></tr><tr><td valign="top" width="158">Get value</td><td valign="top" width="137">Current</td><td valign="top" width="130">Current</td><td valign="top" width="125"></td><td valign="top" width="140">next().value</td></tr><tr><td valign="top" width="158">Iteration</td><td valign="top" width="137">foeach…in</td><td valign="top" width="130">for…in</td><td valign="top" width="125">for_, traverse_, forM_, mapM_</td><td valign="top" width="140">for…of</td></tr><tr><td valign="top" width="158">Generator</td><td valign="top" width="137">yield return</td><td valign="top" width="130">yield</td><td valign="top" width="125"></td><td valign="top" width="140">yield</td></tr><tr><td valign="top" width="158">Merge</td><td valign="top" width="137"></td><td valign="top" width="130">yield!</td><td valign="top" width="125"></td><td valign="top" width="140">yield*</td></tr></tbody></table>

As fore mentioned, iterator pattern involves an iterator with mutable states, so it is more suitable for OOP languages, like C#. F# is a functional language but impure, so it gets along with mutable states, and has all the facilities for iterator and generator. In contrast, Haskell is a [purely functional](https://en.wikipedia.org/wiki/Purely_functional) language, and does not support mutable states. Haskell just has a few APIs that might look similar to C#’s foreach. For example, In [Data.Foldable module](https://hackage.haskell.org/package/base-4.8.1.0/docs/Data-Foldable.html), there are a few iteration functions for Foldable type class:

-   Applicative functions for\_ and traverse\_: map each element of a Foldable to an function, evaluate and ignore the results.
-   Monadic functions: forM\_ and mapM\_: map each element of a Foldable to a monadic function, evaluate and ignore the results.

Haskell list is [an instance of Foldable type class](https://hackage.haskell.org/package/base-4.8.1.0/docs/src/Data.Foldable.html#line-225), its design and implementation is different from iterator pattern. For iterator in functional programming, please see this paper: [The Essence of the Iterator Pattern](http://www.cs.ox.ac.uk/jeremy.gibbons/publications/iterator.pdf).