---
title: "Category Theory via C# (8) Advanced LINQ to Monads"
published: 2024-12-31
description: "Monad is a powerful structure, with the LINQ support in C# language, monad enables chaining operations to build fluent workflow, which can be pure. With these features, monad can be used to manage I/O"
image: ""
tags: [".NET", "C#", "Category Theory", "Functional Programming", "LINQ", "LINQ via C#", "Monads"]
category: ".NET"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

Monad is a powerful structure, with the LINQ support in C# language, monad enables chaining operations to build fluent workflow, which can be pure. With these features, monad can be used to manage I/O, state changes, exception handling, shared environment, logging/tracing, and continuation, etc., in the functional paradigm.

## IO monad

IO is impure. As already demonstrated, the Lazy<> and Func<> monads can build purely function workflows consists of I/O operations. The I/O is produced only when the workflows is started. So the Func<> monad is also called IO monad (Again, Lazy<T> is just a wrapper of Func<T> factory function, so Lazy<> and Func<> can be viewed as equivalent.). Here, to be more intuitive, rename Func<> to IO<>:

```csharp
// IO: () -> T
public delegate T IO<out T>();
```

Func<T> or IO<T> is just a wrapper of T. Generally, the difference is, if a value T is obtained, effect is already produced; and if a Func<T> or IO<T> function wrapper is obtained, the effect can be delayed to produce, until explicitly calling this function to pull the wrapped T value. The following example is a simple comparison:

```csharp
public static partial class IOExtensions
{
    internal static string Impure()
    {
        string filePath = Console.ReadLine();
        string fileContent = File.ReadAllText(filePath);
        return fileContent;
    }

    internal static IO<string> Pure()
    {
        IO<string> filePath = () => Console.ReadLine();
        IO<string> fileContent = () => File.ReadAllText(filePath());
        return fileContent;
    }

    internal static void IO()
    {
        string ioResult1 = Impure(); // IO is produced.
        IO<string> ioResultWrapper = Pure(); // IO is not produced.

        string ioResult2 = ioResultWrapper(); // IO is produced.
    }
}
```

IO<> monad is just Func<> monad:

```csharp
public static partial class IOExtensions
{
    // SelectMany: (IO<TSource>, TSource -> IO<TSelector>, (TSource, TSelector) -> TResult) -> IO<TResult>
    public static IO<TResult> SelectMany<TSource, TSelector, TResult>(
        this IO<TSource> source,
        Func<TSource, IO<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            () =>
            {
                TSource value = source();
                return resultSelector(value, selector(value)());
            };

    // Wrap: TSource -> IO<TSource>
    public static IO<TSource> IO<TSource>(this TSource value) => () => value;

    // Select: (IO<TSource>, TSource -> TResult) -> IO<TResult>
    public static IO<TResult> Select<TSource, TResult>(
        this IO<TSource> source, Func<TSource, TResult> selector) =>
            source.SelectMany(value => selector(value).IO(), (value, result) => result);
}
```

The (SelectMany, Wrap, Select) operations are defined so that the LINQ functor syntax (single from clause) and monad syntax (multiple from clauses) are enabled. The let clause is also enabled by Select, which provides great convenience.

Some I/O operations, like above Console.ReadLine: () –> string, and File.ReadAllText: string –> string, returns a value T that can be wrapped IO<T>. There are other I/O operations that return void, like Console.WriteLine: string –> void, etc. Since C# compiler does not allow void to be used as type argument of IO<void>, these operations can be viewed as returning a Unit value, which can be wrapped as IO<Uint>. The following methods help wrap IO<T> functions from I/O operations with or without return value:

```csharp
public static IO<TResult> IO<TResult>(Func<TResult> function) =>
    () => function();

public static IO<Unit> IO(Action action) =>
    () =>
    {
        action();
        return default;
    };
```

Now the I/O workflow can be build as purely function LINQ query:

```csharp
internal static void Workflow()
{
    IO<int> query = from unit1 in IO(() => Console.WriteLine("File path:")) // IO<Unit>.
                    from filePath in IO(Console.ReadLine) // IO<string>.
                    from unit2 in IO(() => Console.WriteLine("File encoding:")) // IO<Unit>.
                    from encodingName in IO(Console.ReadLine) // IO<string>.
                    let encoding = Encoding.GetEncoding(encodingName)
                    from fileContent in IO(() => File.ReadAllText(filePath, encoding)) // IO<string>.
                    from unit3 in IO(() => Console.WriteLine("File content:")) // IO<Unit>.
                    from unit4 in IO(() => Console.WriteLine(fileContent)) // IO<Unit>.
                    select fileContent.Length; // Define query.
    int result = query(); // Execute query.
}
```

IO<> monad works with both synchronous and asynchronous I/O operations. The async version of IO<T> is just IO<Task<T>>, and the async version of IO<Unit> is just IO<Task>:

```csharp
internal static async Task WorkflowAsync()
{
    using (HttpClient httpClient = new HttpClient())
    {
        IO<Task> query = from unit1 in IO(() => Console.WriteLine("URI:")) // IO<Unit>. 
                            from uri in IO(Console.ReadLine) // IO<string>.
                            from unit2 in IO(() => Console.WriteLine("File path:")) // IO<Unit>.
                            from filePath in IO(Console.ReadLine) // IO<string>.
                            from downloadStreamTask in IO(async () =>
                                await httpClient.GetStreamAsync(uri)) // IO<Task<Stream>>.
                            from writeFileTask in IO(async () => 
                                await (await downloadStreamTask).CopyToAsync(File.Create(filePath))) // IO<Task>.
                            from messageTask in IO(async () =>
                                {
                                    await writeFileTask;
                                    Console.WriteLine($"Downloaded {uri} to {filePath}");
                                }) // IO<Task>.
                            select messageTask; // Define query.
        await query(); // Execute query.
    }
}
```

## State monad

In object-oriented programming, there is the state pattern to handle state changes. In functional programming, state change can be modeled with pure function. For pure function TSource –> TResult, its state-involved version can be represented as a Tuple<TSource, TState> –> Tuple<TResult, TState> function, which accepts some input value along with some input state, and returns some output value and some output state. This function can remains pure, because it can leave the input state unchanged, then either return the same old state, or create a new state and return it. To make this function monadic, break up the input tuple and curry the function to TSource –> (TState –> Tuple<TResult, TState>). Now the returned TState –> Tuple<TResult, TState> function type can be given an alias called State:

```csharp
// State: TState -> ValueTuple<T, TState>
public delegate (T Value, TState State) State<TState, T>(TState state);
```

Similar to fore mentioned Tuple<,> and Func<,> types, the above open generic type State<,> can be viewed as a type constructor of kind \* –> \* –> \*. After partially applied with a first type argument TState, State<TState,> becomes a \* –> \* type constructor. If it can be a functor and monad, then above stateful function becomes a monadic selector TSource –> State<TState, TResult>. So the following (SelectMany, Wrap, Select) methods can be defined for State<TState,>:

```csharp
public static partial class StateExtensions
{
    // SelectMany: (State<TState, TSource>, TSource -> State<TState, TSelector>, (TSource, TSelector) -> TResult) -> State<TState, TResult>
    public static State<TState, TResult> SelectMany<TState, TSource, TSelector, TResult>(
        this State<TState, TSource> source,
        Func<TSource, State<TState, TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            oldState =>
            {
                (TSource Value, TState State) value = source(oldState);
                (TSelector Value, TState State) result = selector(value.Value)(value.State);
                TState newState = result.State;
                return (resultSelector(value.Value, result.Value), newState); // Output new state.
            };

    // Wrap: TSource -> State<TState, TSource>
    public static State<TState, TSource> State<TState, TSource>(this TSource value) =>
        oldState => (value, oldState); // Output old state.

    // Select: (State<TState, TSource>, TSource -> TResult) -> State<TState, TResult>
    public static State<TState, TResult> Select<TState, TSource, TResult>(
        this State<TState, TSource> source,
        Func<TSource, TResult> selector) =>
            oldState =>
            {
                (TSource Value, TState State) value = source(oldState);
                TState newState = value.State;
                return (selector(value.Value), newState); // Output new state.
            };
            // Equivalent to:            
            // source.SelectMany(value => selector(value).State<TState, TResult>(), (value, result) => result);
}
```

SelectMany and Select return a function that accepts an old state and outputs new state, State method returns a function that outputs the old state. Now this State<TState,> delegate type is the state monad, so a State<TState, T> function can be viewed as a wrapper of a T value, and this T value can be unwrapped in the monad workflow, with the from value in source syntax. State<TState, T> function also wraps the state information. To get/set the TState state in the monad workflow, the following GetState/SetState functions can be defined:

```csharp
// GetState: () -> State<TState, TState>
public static State<TState, TState> GetState<TState>() =>
    oldState => (oldState, oldState); // Output old state.

// SetState: TState -> State<TState, Unit>
public static State<TState, Unit> SetState<TState>(TState newState) =>
    oldState => (default, newState); // Output new state.
```

Here GetState returns a State<TState, TState> function wrapping the state as value, so that the state can be extracted in the monad workflow with the same syntax that unwraps the value. SetState returns a State<TState, Unit> function, which ignores the old state, and wrap no value (represented by Unit) and outputs the the specified new value to the monad workflow. Generally, the state monad workflow can be demonstrated as:

```csharp
internal static void Workflow()
{
    string initialState = nameof(initialState);
    string newState = nameof(newState);
    string resetState = nameof(resetState);
    State<string, int> source1 = oldState => (1, oldState);
    State<string, bool> source2 = oldState => (true, newState);
    State<string, char> source3 = '@'.State<string, char>(); // oldState => 2, oldState).

    State<string, string[]> query =
        from value1 in source1 // source1: State<string, int> = initialState => (1, initialState).
        from state1 in GetState<string>() // GetState<int>(): State<string, string> = initialState => (initialState, initialState).
        from value2 in source2 // source2: State<string, bool>3 = initialState => (true, newState).
        from state2 in GetState<string>() // GetState<int>(): State<string, string> = newState => (newState, newState).
        from unit in SetState(resetState) // SetState(resetState): State<string, Unit> = newState => (default, resetState).
        from state3 in GetState<string>() // GetState(): State<string, string> = resetState => (resetState, resetState).
        from value3 in source3 // source3: State<string, char> = resetState => (@, resetState).
        select new string[] { state1, state2, state3 }; // Define query.
    (string[] Value, string State) result = query(initialState); // Execute query with initial state.
    result.Value.WriteLines(); // initialState newState resetState
    result.State.WriteLine(); // Final state: resetState
}
```

The state monad workflow is a State<TState, T> function, which is of type TState –> Tuple<T, TState>. To execute the workflow, it must be called with a TState initial state. At runtime, when the workflow executes, the first operation in the workflow, also a TState –> Tuple<T, TState> function, is called with the workflow’s initial state, and returns a output value and a output state; then the second operation, once again another TState –> Tuple<T, TState> function, is called with the first operation’s output state, and outputs another output value and another output state; and so on. In this chaining, each operation function can wither return its original input state, or return a new state. This is how state changes through a workflow of pure functions.

Take the factorial function as example. The factorial function can be viewed as a recursive function with a state – the current product of the current recursion step, and apparently take the initial state (product) is 1. To calculate the factorial of 5, the recursive steps can be modeled as:

-   (Value: 5, State: 1) => (Value: 4, State: 1 \* 5)
-   (Value: 4, State: 1 \* 5) => (Value: 3, State: 1 \* 5 \* 4)
-   (Value: 3, State: 1 \* 5 \* 4) => (Value: 3, State: 1 \* 5 \* 4)
-   (Value: 2, State: 1 \* 5 \* 4 \* 3) => (Value: 2, State: 1 \* 5 \* 4 \* 3)
-   (Value: 1, State: 1 \* 5 \* 4 \* 3 \* 2) => (Value: 1, State: 1 \* 5 \* 4 \* 3 \* 2)
-   (Value: 0, State: 1 \* 5 \* 4 \* 3 \* 2 \* 1) => (Value: 0, State: 1 \* 5 \* 4 \* 3 \* 2 \* 1)

When the current integer becomes 0, the recursion terminates, and the final state (product) is the factorial result. So this recursive function is of type Tuple<int, int> –> Tuple<int, int>. As fore mentioned, it can be curried to int –> (int –> Tuple<int, int>), which is equivalent to int –> State<int, int>:

```csharp
// FactorialState: uint -> (uint -> (uint, uint))
// FactorialState: uint -> State<unit, uint>
private static State<uint, uint> FactorialState(uint current) =>
    from state in GetState<uint>() // State<uint, uint>.
    let product = state
    let next = current - 1U
    from result in current > 0U
        ? (from unit in SetState(product * current) // State<unit, Unit>.
            from value in FactorialState(next) // State<uint, uint>.
            select next)
        : next.State<uint, uint>() // State<uint, uint>.
    select result;

public static uint Factorial(uint uInt32)
{
    State<uint, uint> query = FactorialState(uInt32); // Define query.
    return query(1).State; // Execute query, with initial state: 1.
}
```

Another example is Enumerable.Aggregate query method, which accepts an IEnumerable<TSource> sequence, a TAccumulate seed, and a TAccumulate –> TSource –> TAccumulate function. Aggregate calls the accumulation function over the seed and all the values in the sequence. The aggregation steps can also be modeled as recursive steps, where each step’s state is the current accumulate result and the unused source values. Take source sequence { 1, 2, 3, 4, 5 }, seed 0, and function + as example:

-   (Value: +, State: (0, { 1, 2, 3, 4 })) => (Value: +, State: (0 + 1, { 2, 3, 4 }))
-   (Value: +, State: (0 + 1, { 2, 3, 4 })) => (Value: +, State: (0 + 1 + 2, { 3, 4 }))
-   (Value: +, State: (0 + 1 + 2, { 3, 4 })) => (Value: +, State: (0 + 1 + 2 + 3, { 4 }))
-   (Value: +, State: (0 + 1 + 2 + 3, { 4 })) => (Value: +, State: (0 + 1 + 2 + 3 + 4, { }))
-   (Value: +, State: (0 + 1 + 2 + 3 + 4, { })) => (Value: +, State: (0 + 1 + 2 + 3 + 4, { }))

When the current source sequence in the state is empty, all source values are applied to the accumulate function, the recursion terminates, and the aggregation result in in the final state. So the recursive function is of type Tuple<TAccumulate –> TSource –> TAccumulate, Tuple<TAccumulate, IEnumerable<TSource>>> –> Tuple<TAccumulate –> TSource –> TAccumulate, Tuple<TAccumulate, IEnumerable<TSource>>>. Again, it can be curried to (TAccumulate –> TSource –> TAccumulate) –> (Tuple<TAccumulate, IEnumerable<TSource>> –> Tuple<TAccumulate –> TSource –> TAccumulate, Tuple<TAccumulate, IEnumerable<TSource>>>), which is equivalent to (TAccumulate –> TSource –> TAccumulate) –> State<Tuple<TAccumulate, IEnumerable<TSource>>, TAccumulate –> TSource –> TAccumulate>:

```csharp
// AggregateState: (TAccumulate -> TSource -> TAccumulate) -> ((TAccumulate, IEnumerable<TSource>) -> (TAccumulate -> TSource -> TAccumulate, (TAccumulate, IEnumerable<TSource>)))
// AggregateState: TAccumulate -> TSource -> TAccumulate -> State<(TAccumulate, IEnumerable<TSource>), TAccumulate -> TSource -> TAccumulate>
private static State<(TAccumulate, IEnumerable<TSource>), Func<TAccumulate, TSource, TAccumulate>> AggregateState<TSource, TAccumulate>(
    Func<TAccumulate, TSource, TAccumulate> func) =>
        from state in GetState<(TAccumulate, IEnumerable<TSource>)>() // State<(TAccumulate, IEnumerable<TSource>), (TAccumulate, IEnumerable<TSource>)>.
        let accumulate = state.Item1 // TAccumulate.
        let source = state.Item2.Share() // IBuffer<TSource>.
        let sourceIterator = source.GetEnumerator() // IEnumerator<TSource>.
        from result in sourceIterator.MoveNext()
            ? (from unit in SetState((func(accumulate, sourceIterator.Current), source.AsEnumerable())) // State<(TAccumulate, IEnumerable<TSource>), Unit>.
                from value in AggregateState(func) // State<(TAccumulate, IEnumerable<TSource>), Func<TAccumulate, TSource, TAccumulate>>.
                select func)
            : func.State<(TAccumulate, IEnumerable<TSource>), Func<TAccumulate, TSource, TAccumulate>>() // State<(TAccumulate, IEnumerable<TSource>), Func<TAccumulate, TSource, TAccumulate>>.
        select result;

public static TAccumulate Aggregate<TSource, TAccumulate>(
    IEnumerable<TSource> source, TAccumulate seed, Func<TAccumulate, TSource, TAccumulate> func)
{
    State<(TAccumulate, IEnumerable<TSource>), Func<TAccumulate, TSource, TAccumulate>> query =
        AggregateState(func); // Define query.
    return query((seed, source)).State.Item1; // Execute query, with initial state (seed, source).
}
```

In each recursion step, if the source sequence in the current state in not empty, the source sequence needs to be split. The first value is used to call the accumulation function, and the other values are put into output state, which is passed to the next recursion step. So there are multiple pulling operations for the source sequence: detecting if it is empty detection, pulling first value, and pulling the rest values. To avoid multiple iterations for the same source sequence, here the Share query method from Microsoft Ix (Interactive Extensions) library is called, so that all the pulling operations share the same iterator.

The stack’s Pop and Push operation can be also viewed as state processing. The Pop method of stack requires no input, and out put the stack’s top value T, So Pop can be viewed of type Unit –> T. In contrast, stack’s Push method accepts a value, set the value to the top of the stack, and returns no output, so Push can be viewed of type T –> Unit. The stack’s values are different before and after the Pop and Push operations, so the stack itself can be viewed as the state of the Pop and Push operation. If the values in a stack is represented as a IEnumerable<T> sequence, then Pop can be remodeled as Tuple<Unit, IEnumerable<T>> –> Tuple<Unit, IEnumerable<T>>, which can be curried to Unit –> State<IEnumerable<T>, T>; and Push can be remodeled as Tuple<T, IEnumerable<T>> –> Tuple<Unit, IEnumerable<T>>:

```csharp
// PopState: Unit -> (IEnumerable<T> -> (T, IEnumerable<T>))
// PopState: Unit -> State<IEnumerable<T>, T>
internal static State<IEnumerable<T>, T> PopState<T>(Unit unit = null) =>
    oldStack =>
    {
        IEnumerable<T> newStack = oldStack.Share();
        return (newStack.First(), newStack); // Output new state.
    };

// PushState: T -> (IEnumerable<T> -> (Unit, IEnumerable<T>))
// PushState: T -> State<IEnumerable<T>, Unit>
internal static State<IEnumerable<T>, Unit> PushState<T>(T value) =>
    oldStack =>
    {
        IEnumerable<T> newStack = oldStack.Concat(value.Enumerable());
        return (default, newStack); // Output new state.
    };
```

Now the stack operations can be a state monad workflow. Also, GetState can get the current values of the stack, and SetState can reset the values of stack:

```csharp
internal static void Stack()
{
    IEnumerable<int> initialStack = Enumerable.Repeat(0, 5);
    State<IEnumerable<int>, IEnumerable<int>> query =
        from value1 in PopState<int>() // State<IEnumerable<int>, int>.
        from unit1 in PushState(1) // State<IEnumerable<int>, Unit>.
        from unit2 in PushState(2) // State<IEnumerable<int>, Unit>.
        from stack in GetState<IEnumerable<int>>() // State<IEnumerable<int>, IEnumerable<int>>.
        from unit3 in SetState(Enumerable.Range(0, 5)) // State<IEnumerable<int>, Unit>.
        from value2 in PopState<int>() // State<IEnumerable<int>, int>.
        from value3 in PopState<int>() // State<IEnumerable<int>, int>.
        from unit4 in PushState(5) // State<IEnumerable<int>, Unit>.
        select stack; // Define query.
    (IEnumerable<int> Value, IEnumerable<int> State) result = query(initialStack); // Execute query with initial state.
    result.Value.WriteLines(); // 0 0 0 0 1 2
    result.State.WriteLines(); // 0 1 2 5
}
```

## Exception monad

As previously demonstrated, the Optional<> monad can handle the case that any operation of the workflow may not produce a valid result, in a . When an operation succeeds to return a valid result, the next operation executes. If all operations succeed, the entire workflow has a valid result. Option<> monad’s handling is based on operation’s return result. What if the operation fails with exception? To work with operation exceptions in a purely functional paradigm, the following Try<> structure can be defined, which is just Optional<> plus exception handling and store:

```csharp
public readonly struct Try<T>
{
    private readonly Lazy<(T, Exception)> factory;

    public Try(Func<(T, Exception)> factory) =>
        this.factory = new Lazy<(T, Exception)>(() =>
        {
            try
            {
                return factory();
            }
            catch (Exception exception)
            {
                return (default, exception);
            }
        });

    public T Value
    {
        get
        {
            if (this.HasException)
            {
                throw new InvalidOperationException($"{nameof(Try<T>)} object must have a value.");
            }
            return this.factory.Value.Item1;
        }
    }

    public Exception Exception => this.factory.Value.Item2;

    public bool HasException => this.Exception != null;

    public static implicit operator Try<T>(T value) => new Try<T>(() => (value, (Exception)null));
}
```

Try<T> represents an operation, which either succeeds with a result, or fail with an exception. Its SelectMany method is also in the same pattern as Optional<>’s SelectMany, so that when an operation (source) succeeds without exception, the next operation (returned by selector) executes:

```csharp
public static partial class TryExtensions
{
    // SelectMany: (Try<TSource>, TSource -> Try<TSelector>, (TSource, TSelector) -> TResult) -> Try<TResult>
    public static Try<TResult> SelectMany<TSource, TSelector, TResult>(
        this Try<TSource> source,
        Func<TSource, Try<TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            new Try<TResult>(() =>
            {
                if (source.HasException)
                {
                    return (default, source.Exception);
                }
                Try<TSelector> result = selector(source.Value);
                if (result.HasException)
                {
                    return (default, result.Exception);
                }
                return (resultSelector(source.Value, result.Value), (Exception)null);
            });

    // Wrap: TSource -> Try<TSource>
    public static Try<TSource> Try<TSource>(this TSource value) => value;

    // Select: (Try<TSource>, TSource -> TResult) -> Try<TResult>
    public static Try<TResult> Select<TSource, TResult>(
        this Try<TSource> source, Func<TSource, TResult> selector) =>
            source.SelectMany(value => selector(value).Try(), (value, result) => result);
}
```

The operation of throwing an exception can be represented with a Try<T> with the specified exception:

```csharp
public static Try<T> Throw<T>(this Exception exception) => new Try<T>(() => (default, exception));
```

For convenience, Try<T> instance can be implicitly wrapped from a T value. And the following method also helps wrap a Func<T> operation:

```csharp
public static Try<T> Try<T>(Func<T> function) =>
    new Try<T>(() => (function(), (Exception)null));
```

Similar to IO<> monad, an function operation (() –> void) without return result can be viewed as a function returning Unit (() –> Unit):

```csharp
public static Try<Unit> Try(Action action) =>
    new Try<Unit>(() =>
    {
        action();
        return (default, (Exception)null);
    });
```

To handle the exception from an operation represented by Try<T>, just check the HasException property, filter the exception, and process it. The following Catch method handles the specified exception type:

```csharp
public static Try<T> Catch<T, TException>(
    this Try<T> source, Func<TException, Try<T>> handler, Func<TException, bool> when = null)
    where TException : Exception => 
        new Try<T>(() =>
        {
            if (source.HasException && source.Exception is TException exception && exception != null
                && (when == null || when(exception)))
            {
                source = handler(exception);
            }
            return source.HasException ? (default, source.Exception) : (source.Value, (Exception)null);
        });
```

The evaluation of the Try<T> source, and the execution of handler, are both deferred. And the following Catch overload handles all exception types:

```csharp
public static Try<T> Catch<T>(
    this Try<T> source, Func<Exception, Try<T>> handler, Func<Exception, bool> when = null) =>
        Catch<T, Exception>(source, handler, when);
```

And the Finally method just call a function to process the Try<T>:

```csharp
public static TResult Finally<T, TResult>(
    this Try<T> source, Func<Try<T>, TResult> finally) => finally(source);

public static void Finally<T>(
    this Try<T> source, Action<Try<T>> finally) => finally(source);
```

The operation of throwing an exception can be represented with a Try<T> instance wrapping the specified exception:

```csharp
public static partial class TryExtensions
{
    public static Try<T> Throw<T>(this Exception exception) => new Try<T>(() => (default, exception));
}
```

The following is an example of throwing exception:

```csharp
internal static Try<int> TryStrictFactorial(int? value)
{
    if (value == null)
    {
        return Throw<int>(new ArgumentNullException(nameof(value)));
    }
    if (value <= 0)
    {
        return Throw<int>(new ArgumentOutOfRangeException(nameof(value), value, "Argument should be positive."));
    }

    if (value == 1)
    {
        return 1;
    }
    return value.Value * TryStrictFactorial(value - 1).Value;
}
```

And the the following is an example of handling exception:

```csharp
internal static string Factorial(string value)
{
    Func<string, int?> stringToNullableInt32 = @string =>
        string.IsNullOrEmpty(@string) ? default : Convert.ToInt32(@string);
    Try<int> query = from nullableInt32 in Try(() => stringToNullableInt32(value)) // Try<int32?>
                        from result in TryStrictFactorial(nullableInt32) // Try<int>.
                        from unit in Try(() => result.WriteLine()) // Try<Unit>.
                        select result; // Define query.
    return query
        .Catch(exception => // Catch all and rethrow.
        {
            exception.WriteLine();
            return Throw<int>(exception);
        })
        .Catch<int, ArgumentNullException>(exception => 1) // When argument is null, factorial is 1.
        .Catch<int, ArgumentOutOfRangeException>(
            when: exception => object.Equals(exception.ActualValue, 0),
            handler: exception => 1) // When argument is 0, factorial is 1.
        .Finally(result => result.HasException // Execute query.
            ? result.Exception.Message : result.Value.ToString());
}
```

## Reader monad

The Func<T,> functor is also monad. In contrast to Func<> monad, a factory function that only outputs a value, Func<T,> can also read input value from the environment. So Fun<T,> monad is also called reader monad, or environment monad. To be intuitive, rename Func<T,> to Reader<TEnvironment,>:

```csharp
// Reader: TEnvironment -> T
public delegate T Reader<in TEnvironment, out T>(TEnvironment environment);
```

And its (SelectMany, Wrap, Select) methods are straightforward:

```csharp
public static partial class ReaderExtensions
{
    // SelectMany: (Reader<TEnvironment, TSource>, TSource -> Reader<TEnvironment, TSelector>, (TSource, TSelector) -> TResult) -> Reader<TEnvironment, TResult>
    public static Reader<TEnvironment, TResult> SelectMany<TEnvironment, TSource, TSelector, TResult>(
        this Reader<TEnvironment, TSource> source,
        Func<TSource, Reader<TEnvironment, TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            environment =>
            {
                TSource value = source(environment);
                return resultSelector(value, selector(value)(environment));
            };

    // Wrap: TSource -> Reader<TEnvironment, TSource>
    public static Reader<TEnvironment, TSource> Reader<TEnvironment, TSource>(this TSource value) => 
        environment => value;

    // Select: (Reader<TEnvironment, TSource>, TSource -> TResult) -> Reader<TEnvironment, TResult>
    public static Reader<TEnvironment, TResult> Select<TEnvironment, TSource, TResult>(
        this Reader<TEnvironment, TSource> source, Func<TSource, TResult> selector) =>
            source.SelectMany(value => selector(value).Reader<TEnvironment, TResult>(), (value, result) => result);
}
```

There are scenarios of accessing input value from shared environment, like reading the configurations, dependency injection, etc. In the following example, the operations are dependents of the configurations, so these operations can be modeled using Reader<ICongiguration,> monad:

```csharp
private static Reader<IConfiguration, FileInfo> DownloadHtml(Uri uri) =>
    configuration => default;

private static Reader<IConfiguration, FileInfo> ConverToWord(FileInfo htmlDocument, FileInfo template) =>
    configuration => default;

private static Reader<IConfiguration, Unit> UploadToOneDrive(FileInfo file) =>
    configuration => default;

internal static void Workflow(IConfiguration configuration, Uri uri, FileInfo template)
{
    Reader<IConfiguration, (FileInfo, FileInfo)> query =
        from htmlDocument in DownloadHtml(uri) // Reader<IConfiguration, FileInfo>.
        from wordDocument in ConverToWord(htmlDocument, template) // Reader<IConfiguration, FileInfo>.
        from unit in UploadToOneDrive(wordDocument) // Reader<IConfiguration, Unit>.
        select (htmlDocument, wordDocument); // Define query.
    (FileInfo, FileInfo) result = query(configuration); // Execute query.
}
```

The workflow is also a Reader<ICongiguration, T> function. To execute the workflow, it must read the required configuration input. Then all operation in the workflow execute sequentially by reading the same configuration input.

## Writer monad

Writer is a function that returns a computed value along with a stream of additional content, so this function is of type () –> Tuple<T, TContent>. In the writer monad workflow, each operation’s additional output content is merged with the next operation’s additional output content, so that when the entire workflow is executed, all operations’ additional output content are merged as the workflow’s final additional output content. Each merge operation accepts 2 TContent instances, and result another TContent instance. It is a binary operation and can be implemented by monoid’s multiplication: TContent ⊙ TContent –> TContent. So writer can be represented by a () –> Tuple<T, TContent> function along with a IMonoid<TContent> monoid:

```csharp
public abstract class WriterBase<TContent, T, TContentMonoid> : IMonoid<TContent> where TContentMonoid : IMonoid<TContent>
{
    private readonly Lazy<(TContent, T)> lazy;

    protected WriterBase(Func<(TContent, T)> writer)
    {
        this.lazy = new Lazy<(TContent, T)>(writer);
    }

    public TContent Content => this.lazy.Value.Item1;

    public T Value => this.lazy.Value.Item2;

    public static TContent Multiply(TContent value1, TContent value2) => TContentMonoid.Multiply(value1, value2);

    public static TContent Unit => TContentMonoid.Unit;
}
```

The most common scenario of outputting additional content, is tracing and logging, where the TContent is a sequence of log entries. A sequence of log entries can be represented as IEnumerable<T>, so the fore mentioned (IEnumerable<T>, Enumerable.Concat<T>, Enumerable.Empty<T>()) monoid can be used:

```csharp
public class Writer<TEntry, T> : WriterBase<IEnumerable<TEntry>, T, EnumerableConcatMonoid<TEntry>>
{
    public Writer(Func<(IEnumerable<TEntry>, T)> writer) : base(writer) { }

    public Writer(T value) : base(() => (Unit, value)) { }
}
```

Similar to State<TState,> and Reader<TEnvironment,>, here Writer<TEntry,> can be monad with the following (SelectMany, Wrap, Select) methods:

```csharp
public static partial class WriterExtensions
{
    // SelectMany: (Writer<TEntry, TSource>, TSource -> Writer<TEntry, TSelector>, (TSource, TSelector) -> TResult) -> Writer<TEntry, TResult>
    public static Writer<TEntry, TResult> SelectMany<TEntry, TSource, TSelector, TResult>(
        this Writer<TEntry, TSource> source,
        Func<TSource, Writer<TEntry, TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            new Writer<TEntry, TResult>(() =>
            {
                Writer<TEntry, TSelector> result = selector(source.Value);
                return (Tutorial.CategoryTheory.Writer<TEntry, TSource>.Multiply(source.Content, result.Content),
                    resultSelector(source.Value, result.Value));
            });

    // Wrap: TSource -> Writer<TEntry, TSource>
    public static Writer<TEntry, TSource> Writer<TEntry, TSource>(this TSource value) =>
        new Writer<TEntry, TSource>(value);

    // Select: (Writer<TEnvironment, TSource>, TSource -> TResult) -> Writer<TEnvironment, TResult>
    public static Writer<TEntry, TResult> Select<TEntry, TSource, TResult>(
        this Writer<TEntry, TSource> source, Func<TSource, TResult> selector) =>
            source.SelectMany(value => selector(value).Writer<TEntry, TResult>(), (value, result) => result);
}
```

Most commonly, each operation in the workflow logs string message. So the following method is defined to construct a writer instance from a value and a string log factory:

```csharp
public static Writer<string, TSource> LogWriter<TSource>(this TSource value, Func<TSource, string> logFactory) =>
    new Writer<string, TSource>(() => (logFactory(value).Enumerable(), value));
```

The previous Fun<> monad workflow now can output logs for each operation:

```csharp
internal static void Workflow()
{
    Writer<string, string> query = from filePath in Console.ReadLine().LogWriter(value =>
                                        $"File path: {value}") // Writer<string, string>.
                                   from encodingName in Console.ReadLine().LogWriter(value =>
                                        $"Encoding name: {value}") // Writer<string, string>.
                                   from encoding in Encoding.GetEncoding(encodingName).LogWriter(value =>
                                        $"Encoding: {value}") // Writer<string, Encoding>.
                                   from fileContent in File.ReadAllText(filePath, encoding).LogWriter(value =>
                                        $"File content length: {value.Length}") // Writer<string, string>.
                                   select fileContent; // Define query.
    string result = query.Value; // Execute query.
    query.Content.WriteLines();
    // File path: D:\File.txt
    // Encoding name: utf-8
    // Encoding: System.Text.UTF8Encoding
    // File content length: 76138
}
```

## Continuation monad

In program, a function can return the result value, so that some other continuation function can use that value; or a function can take a continuation function as parameter, after it computes the result value, it calls back the continuation function with that value:

```csharp
public static partial class CpsExtensions
{
    // Sqrt: int -> double
    internal static double Sqrt(int int32) => Math.Sqrt(int32);

    // SqrtWithCallback: (int, double -> TContinuation) -> TContinuation
    internal static TContinuation SqrtWithCallback<TContinuation>(
        int int32, Func<double, TContinuation> continuation) =>
            continuation(Math.Sqrt(int32));
}
```

The former is style is called direct style, and the latter is called continuation-passing style (CPS). Generally, for a TSource –> TResult function, its CPS version can accept a TResult –> TContinuation continuation function, so the CPS function is of type (TSource, TResult –> TContinuation) –> TContinuation. Again, just like the state monad, the CPS function can be curried to TSource –> ((TResult –> TContinuation) –> TContinuation)

```csharp
// SqrtWithCallback: int -> (double -> TContinuation) -> TContinuation
internal static Func<Func<double, TContinuation>, TContinuation> SqrtWithCallback<TContinuation>(int int32) =>
    continuation => continuation(Math.Sqrt(int32));
```

Now the returned (TResult –> TContinuation) –> TContinuation function type can be given an alias Cps:

```csharp
// Cps: (T -> TContinuation>) -> TContinuation
public delegate TContinuation Cps<TContinuation, out T>(Func<T, TContinuation> continuation);
```

So that the above function can be renamed as:

```csharp
// SqrtCps: int -> Cps<TContinuation, double>
internal static Cps<TContinuation, double> SqrtCps<TContinuation>(int int32) =>
    continuation => continuation(Math.Sqrt(int32));
```

The CPS function becomes TSource –> Cps<TContinuation, TResult>, which is a monadic selector function. Just like State<TState,>, here Cps<TContinuation,> is the continuation monad. Its (SelectMany, Wrap, Select) methods can be implemented as:

```csharp
public static partial class CpsExtensions
{
    // SelectMany: (Cps<TContinuation, TSource>, TSource -> Cps<TContinuation, TSelector>, (TSource, TSelector) -> TResult) -> Cps<TContinuation, TResult>
    public static Cps<TContinuation, TResult> SelectMany<TContinuation, TSource, TSelector, TResult>(
        this Cps<TContinuation, TSource> source,
        Func<TSource, Cps<TContinuation, TSelector>> selector,
        Func<TSource, TSelector, TResult> resultSelector) =>
            continuation => source(value =>
                selector(value)(result =>
                    continuation(resultSelector(value, result))));

    // Wrap: TSource -> Cps<TContinuation, TSource>
    public static Cps<TContinuation, TSource> Cps<TContinuation, TSource>(this TSource value) =>
        continuation => continuation(value);

    // Select: (Cps<TContinuation, TSource>, TSource -> TResult) -> Cps<TContinuation, TResult>
    public static Cps<TContinuation, TResult> Select<TContinuation, TSource, TResult>(
        this Cps<TContinuation, TSource> source, Func<TSource, TResult> selector) =>
            source.SelectMany(value => selector(value).Cps<TContinuation, TResult>(), (value, result) => result);
            // Equivalent to:
            // continuation => source(value => continuation(selector(value)));
            // Or:
            // continuation => source(continuation.o(selector));
}
```

A more complex example is sum of squares. The CPS version of sum and square are straightforward. If direct style of square operation of type int –> int, and the direct style of sum operation is (int, int) –> int, then their CPS versions are just of type int –> Cps<TContinuation, int>, and (int, int) –> Cps<TContinuation, int>:

```csharp
// SquareCps: int -> Cps<TContinuation, int>
internal static Cps<TContinuation, int> SquareCps<TContinuation>(int x) =>
    continuation => continuation(x * x);

// SumCps: (int, int) -> Cps<TContinuation, int>
internal static Cps<TContinuation, int> SumCps<TContinuation>(int x, int y) =>
    continuation => continuation(x + y);
```

Then CPS version of sum of square can be implemented with them:

```csharp
// SumOfSquaresCps: (int, int) -> Cps<TContinuation, int>
internal static Cps<TContinuation, int> SumOfSquaresCps<TContinuation>(int a, int b) =>
    continuation =>
        SquareCps<TContinuation>(a)(squareOfA =>
        SquareCps<TContinuation>(b)(squareOfB =>
        SumCps<TContinuation>(squareOfA, squareOfB)(continuation)));
```

This is not intuitive. But the continuation monad can help. A Cps<TContinuation, T> function can be viewed as a monad wrapper of T value. So T value can be unwrapped from Cps<TContinuation, T> with the LINQ from clause:

```csharp
internal static Cps<TContinuation, int> SumOfSquaresCpsLinq<TContinuation>(int a, int b) =>
    from squareOfA in SquareCps<TContinuation>(a) // Cps<TContinuation, int>.
    from squareOfB in SquareCps<TContinuation>(b) // Cps<TContinuation, int>.
    from sum in SumCps<TContinuation>(squareOfA, squareOfB) // Cps<TContinuation, int>.
    select sum;
```

And the following is a similar example of fibonacci:

```csharp
internal static Cps<TContinuation, uint> FibonacciCps<TContinuation>(uint uInt32) =>
    uInt32 > 1
        ? (from a in FibonacciCps<TContinuation>(uInt32 - 1U)
            from b in FibonacciCps<TContinuation>(uInt32 - 2U)
            select a + b)
        : uInt32.Cps<TContinuation, uint>();
    // Equivalent to:
    // continuation => uInt32 > 1U
    //    ? continuation(FibonacciCps<int>(uInt32 - 1U)(Id) + FibonacciCps<int>(uInt32 - 2U)(Id))
    //    : continuation(uInt32);
```

Generally, a direct style function can be easily converted to CPS function – just pass the direct style function’s return value to a continuation function:

```csharp
public static Cps<TContinuation, T> Cps<TContinuation, T>(Func<T> function) =>
    continuation => continuation(function());
```

Now the previous workflows can be represented in CPS too:

```csharp
internal static void Workflow<TContinuation>(Func<string, TContinuation> continuation)
{
    Cps<TContinuation, string> query =
        from filePath in Cps<TContinuation, string>(Console.ReadLine) // Cps<TContinuation, string>.
        from encodingName in Cps<TContinuation, string>(Console.ReadLine) // Cps<TContinuation, string>.
        from encoding in Cps<TContinuation, Encoding>(() => Encoding.GetEncoding(encodingName)) // Cps<TContinuation, Encoding>.
        from fileContent in Cps<TContinuation, string>(() => File.ReadAllText(filePath, encoding)) // Cps<TContinuation, string>.
        select fileContent; // Define query.
    TContinuation result = query(continuation); // Execute query.
}
```

In the workflow, each operation’s continuation function is its next operation. When the workflow executes, each operation computes its return value, then calls back its next operation with its return value. When the last operation executes, it calls back the workflow’s continuation function.