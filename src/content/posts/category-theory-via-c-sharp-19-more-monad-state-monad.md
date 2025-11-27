---
title: "Category Theory via C# (19) More Monad: State< , > Monad"
published: 2018-12-20
description: "represents a abstract machine with one state or a number of state. C# use state machine a lot. For example:"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Category Theory via C# series](/archive/?tag=Category%20Theory)\]

## **Latest version: [https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads](/posts/category-theory-via-csharp-8-more-linq-to-monads "https://weblogs.asp.net/dixin/category-theory-via-csharp-8-more-linq-to-monads")**

## C#/.NET state machines

[State machine (or finite state machine)](http://en.wikipedia.org/wiki/Finite-state_machine) represents a abstract machine with one state or a number of state. C# use state machine a lot. For example:

-   C# yield keyword [compiles to a state machine that implements IEnumerable<T>](/posts/understanding-linq-to-objects-5-implementing-iterator)
-   C# await keyword [compiles to a state machine that implements IAsyncStateMachine](/posts/understanding-c-sharp-async-await-1-compilation)

.NET has a lot of built-in state machines too:

-   [System.Activities.Statements.StateMachine](https://msdn.microsoft.com/en-us/library/system.activities.statements.statemachine.aspx)
-   [System.Web.Razor.StateMachine<TReturn>](https://msdn.microsoft.com/en-us/library/hh414263.aspx)
-   System.Xml.Xsl.XsltOld.StateMachine
-   Microsoft.Transactions.Bridge.Dtc.StateMachine, and its 6 derived classes
-   Microsoft.Transactions.Wsat.StateMachines.StateMachine, and its 9 derived classes

etc.

## State pattern in object-oriented programming

State pattern is a typical way to implement state machine. The following picture is stolen from Wikipedia:

![](/dixin/category-theory-via-c-sharp-19-more-monad-state-monad/images/400px-State_Design_Pattern_UML_Class_Diagram.svg.png)

### Traffic light state machine

A very simple example of (finite) state machine is traffic light. Assume a traffic light state machine has 3 state:

-   It starts with green state, and stays green for 3 seconds
-   Then it mutates to yellow state for 1 second
-   Then it mutates to red state, for 2 seconds

The code will just follow above diagram. Here are the states’ definitions:

```csharp
public interface ITrafficLightState // State
{
    Task Handle(TrafficLightStateMachine light);
}

public class GreenState : ITrafficLightState // ConcreteStateA
{
    public async Task Handle(TrafficLightStateMachine light)
    {
        TraceHelper.TypeName(typeof(GreenState));
        await Task.Delay(3000);
        await light.MoveNext(new YellowState());
    }
}

public class YellowState : ITrafficLightState // ConcreteStateB
{
    public async Task Handle(TrafficLightStateMachine light)
    {
        TraceHelper.TypeName(typeof(YellowState));
        await Task.Delay(1000);
        await light.MoveNext(new RedState());
    }
}

public class RedState : ITrafficLightState // ConcreteStateC
{
    public async Task Handle(TrafficLightStateMachine light)
    {
        TraceHelper.TypeName(typeof(RedState));
        await Task.Delay(2000);
        // await light.MoveNext(new GreenState());
    }
}
```

where TraceHelper.TypeName is just:

```csharp
public static partial class TraceHelper
{
    public static Unit TypeName(Type type)
    {
        Trace.WriteLine($"{DateTime.Now.ToString("o", CultureInfo.InvariantCulture)}: {type.Name}");
        return null;
    }
}
```

Notice Trace.TypeName and all Handle method implementations have side effects (write trace messages). And, in typical C# programming and OOP, side effect is not specially managed.

The state machine will be:

```csharp
public class TrafficLightStateMachine
{
    public ITrafficLightState State { get; private set; }

    public async Task MoveNext(ITrafficLightState state = null)
    {
        this.State = state ?? new GreenState();
        await this.State.Handle(this);
    }
}
```

Notice the state machine is mutable. The underlined code updates the state of the state machine.

Running the state machine:

```csharp
new TrafficLightStateMachine().MoveNext().Wait();
```

can result the following trace message:

> 2015-05-24T16:19:08.2431705-07:00 - GreenState 2015-05-24T16:19:11.2530920-07:00 - YellowState 2015-05-24T16:19:12.2549302-07:00 - RedState

## State<> monad

In purely functional programming, objects are immutable, state cannot just be updated when changing. State monad can be used to thread a state parameter through a sequence of functions to represent the state updating.

This is the definition of state monad:

```csharp
// State<T, TState> is alias of Func<TState, Lazy<T, TState>>
public delegate Lazy<T, TState> State<T, TState>(TState state);
```

As usual, its SelectMany will be defined firstly:

```csharp
[Pure]
public static partial class StateExtensions
{
    // Required by LINQ.
    public static State<TResult, TState> SelectMany<TSource, TState, TSelector, TResult>
        (this State<TSource, TState> source,
         Func<TSource, State<TSelector, TState>> selector,
         Func<TSource, TSelector, TResult> resultSelector) =>
            state => new Lazy<TResult, TState>(() =>
                {
                    Lazy<TSource, TState> sourceResult = source(state);
                    Lazy<TSelector, TState> selectorResult = selector(sourceResult.Value1)(sourceResult.Value2);
                    return Tuple.Create(
                        resultSelector(sourceResult.Value1, selectorResult.Value1),
                        selectorResult.Value2);
                });

    // Not required, just for convenience.
    public static State<TResult, TState> SelectMany<TSource, TState, TResult>
        (this State<TSource, TState> source, Func<TSource, State<TResult, TState>> selector) =>
            source.SelectMany(selector, Functions.False);
}
```

so that:

```csharp
// [Pure]
public static partial class StateExtensions
{
    // η: T -> State<T, TState>
    public static State<T, TState> State<T, TState>
        (this T value) => state => new Lazy<T, TState>(value, state);

    // η: T -> State<T, TState>
    public static State<T, TState> State<T, TState>
        (this T value, Func<TState, TState> newState) =>
            oldState => new Lazy<T, TState>(value, newState(oldState));

    // φ: Lazy<State<T1, TState>, State<T2, TState>> => State<Defer<T1, T2>, TState>
    public static State<Lazy<T1, T2>, TState> Binary<T1, T2, TState>
        (this Lazy<State<T1, TState>, State<T2, TState>> binaryFunctor) =>
            binaryFunctor.Value1.SelectMany(
                value1 => binaryFunctor.Value2,
                (value1, value2) => new Lazy<T1, T2>(value1, value2));

    // ι: TUnit -> State<TUnit, TState>
    public static State<Unit, TState> Unit<TState>
        (Unit unit) => unit.State<Unit, TState>();

    // Select: (TSource -> TResult) -> (State<TSource, TState> -> State<TResult, TState>)
    public static State<TResult, TState> Select<TSource, TResult, TState>
        (this State<TSource, TState> source, Func<TSource, TResult> selector) =>
            source.SelectMany(value => selector(value).State<TResult, TState>());
}
```

State<> is monad, monoidal functor, and functor.

Also a few other helper functions:

```csharp
// [Pure]
public static partial class StateExtensions
{
    public static TSource Value<TSource, TState>
        (this State<TSource, TState> source, TState state) => source(state).Value1;

    public static TState State<T, TState>
        (this State<T, TState> source, TState state) => source(state).Value2;
}

[Pure]
public static class State
{
    public static State<TState, TState> Get<TState>
        () => state => new Lazy<TState, TState>(state, state);

    public static State<TState, TState> Set<TState>
        (TState newState) => oldState => new Lazy<TState, TState>(oldState, newState);

    public static State<TState, TState> Set<TState>
        (Func<TState, TState> newState) => oldState => new Lazy<TState, TState>(oldState, newState(oldState));
}
```

### Traffic light state machine with State<> monad and LINQ

Now everything becomes functions. This is the definition of the traffic light state:

```csharp
public delegate IO<Task<TrafficLightState>> TrafficLightState();
```

Not interface any more.

And each state is a pure function of above type:

```csharp
// Impure.
public static partial class StateQuery
{
    [Pure]
    public static IO<Task<TrafficLightState>> GreenState
        () =>
            from _ in TraceHelper.Log(nameof(GreenState))
            select (from __ in Task.Delay(TimeSpan.FromSeconds(3))
                    select new TrafficLightState(YellowState));

    [Pure]
    public static IO<Task<TrafficLightState>> YellowState
        () =>
            from _ in TraceHelper.Log(nameof(YellowState))
            select (from __ in Task.Delay(TimeSpan.FromSeconds(1))
                    select new TrafficLightState(RedState));

    [Pure]
    public static IO<Task<TrafficLightState>> RedState
        () =>
            from _ in TraceHelper.Log(nameof(RedState))
            select (from __ in Task.Delay(TimeSpan.FromSeconds(2))
                    select default(TrafficLightState));
}
```

where Trace.Log is a pure function too:

```csharp
[Pure]
public static partial class TraceHelper
{
    public static IO<Unit> Log
        (string log) =>
            () =>
                {
                    Trace.WriteLine($"{DateTime.Now.ToString("o", CultureInfo.InvariantCulture)} - {log}");
                    return null;
                };
}
```

Please also notice Task.Delay returns a Task (not Task<>). As mentioned in an earlier part, Task can be viewed as Task<Unit>, a special case of Task<>. So the LINQ syntax works for Task.

The state machine is also pure function:

```csharp
// Impure.
public static partial class StateQuery
{
    [Pure]
    public static State<Unit, IO<Task<TrafficLightState>>> MoveNext
        () =>
            ((Unit)null).State<Unit, IO<Task<TrafficLightState>>>(state => async () =>
                {
                    TrafficLightState next = await (state ?? GreenState())();
                    return next == null ? null : await next()();
                });

    [Pure]
    public static IO<Task<TrafficLightState>> TrafficLight(IO<Task<TrafficLightState>> state = null)
    {
        State<Unit, IO<Task<TrafficLightState>>> query =
            from green in MoveNext()
            from yellow in MoveNext()
            from red in MoveNext()
            select (Unit)null; // Deferred and lazy.
        return query.State(state); // Final state.
    }
}
```

Running this state machine with State<> monad:

```csharp
// Impure.
public static partial class StateQuery
{
    public static async void ExecuteTrafficLight() => await TrafficLight()();
}
```

will result similar trace message:

> 04/02/2015 20:44:30 - GreenState 04/02/2015 20:44:33 - YellowState 04/02/2015 20:44:34 - RedState

### Immutable IEnumerable<T> stack

An easier example could be using a immutable IEnumerable<T> to simulate a mutable stack. Firstly, a Pop and a Push function can be implemented:

```csharp
// [Pure]
public static partial class EnumerableExtensions
{
    public static Lazy<T, IEnumerable<T>> Pop<T>
        (this IEnumerable<T> source) =>
            // The execution of First is deferred, so that Pop is still pure.
            new Lazy<T, IEnumerable<T>>(source.First, () => source.Skip(1));

    public static Lazy<T, IEnumerable<T>> Push<T>
        (this IEnumerable<T> source, T value) =>
            new Lazy<T, IEnumerable<T>>(value, source.Concat(value.Enumerable()));
}
```

So a stateful stack can be implemented as:

```csharp
// Impure.
public static partial class StateQuery
{
    [Pure]
    public static State<T, IEnumerable<T>> Pop<T>
        () => source => source.Pop();

    [Pure]
    public static State<T, IEnumerable<T>> Push<T>
        (T value) => source => source.Push(value);

    [Pure]
    public static IEnumerable<int> Stack(IEnumerable<int> state = null)
    {
        state = state ?? Enumerable.Empty<int>();
        State<IEnumerable<int>, IEnumerable<int>> query =
            from value1 in Push(1)
            from value2 in Push(2)
            from value3 in Pop<int>()
            from stack1 in State.Set(Enumerable.Range(0, 3))
            from value4 in Push(4)
            from value5 in Pop<int>()
            from stack2 in State.Get<IEnumerable<int>>()
            select stack2;
        return query.Value(state);
    }
}
```

The above functions are all pure functions, and IEnumerable<int> is immutable. They clearly demonstrated how State<> monad simulates the state updating - after each call of Push, Pop, or Set, a new IEnumerable<T> is created to pass to the next function in the sequence.

```csharp
[TestClass]
public class StackTests
{
    [TestMethod]
    public void StateMachineTest()
    {
        IEnumerable<int> expected = Enumerable.Range(0, 3).Push(4).Value2.Pop().Value2;
        IEnumerable<int> actual = StateQuery.Stack();
        EnumerableAssert.AreEqual(expected, actual);
    }
}
```

## Monad laws, and unit tests

```csharp
public partial class MonadTests
{
    [TestMethod]
    public void StateTest()
    {
        bool isExecuted1 = false;
        bool isExecuted2 = false;
        Func<State<int, string>> f1 = () => 1.State<int, string>(
            state => { isExecuted1 = true; return state + "a"; });
        Func<int, Func<int, Func<string, int>>> f2 =
            x => y => z => { isExecuted2 = true; return x + y + z.Length; };
        State<int, string> query1 = from x in f1()
                                    from _ in State.Set(x.ToString(CultureInfo.InvariantCulture))
                                    from y in 2.State<int, string>(state => "b" + state)
                                    from z in State.Get<string>()
                                    select f2(x)(y)(z);
        Assert.IsFalse(isExecuted1); // Deferred and lazy.
        Assert.IsFalse(isExecuted2); // Deferred and lazy.
        Lazy<int, string> result1 = query1("state"); // Execution.
        Assert.AreEqual(1 + 2 + ("b" + "1").Length, result1.Value1);
        Assert.AreEqual("b" + "1", result1.Value2);
        Assert.IsTrue(isExecuted1);
        Assert.IsTrue(isExecuted2);

        // Monad law 1: m.Monad().SelectMany(f) == f(m)
        Func<int, State<int, string>> addOne = x => (x + 1).State<int, string>();
        State<int, string> left = 1.State<int, string>().SelectMany(addOne);
        State<int, string> right = addOne(1);
        Assert.AreEqual(left.Value("a"), right.Value("a"));
        Assert.AreEqual(left.State("a"), right.State("a"));
        // Monad law 2: M.SelectMany(Monad) == M
        State<int, string> M = 1.State<int, string>();
        left = M.SelectMany(StateExtensions.State<int, string>);
        right = M;
        Assert.AreEqual(left.Value("a"), right.Value("a"));
        Assert.AreEqual(left.State("a"), right.State("a"));
        // Monad law 3: M.SelectMany(f1).SelectMany(f2) == M.SelectMany(x => f1(x).SelectMany(f2))
        Func<int, State<int, string>> addTwo = x => (x + 2).State<int, string>();
        left = M.SelectMany(addOne).SelectMany(addTwo);
        right = M.SelectMany(x => addOne(x).SelectMany(addTwo));
        Assert.AreEqual(left.Value("a"), right.Value("a"));
        Assert.AreEqual(left.State("a"), right.State("a"));
    }
}
```