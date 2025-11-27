---
title: "Understanding C# async / await (2) The Awaitable-Awaiter Pattern"
published: 2012-12-29
description: "Understanding C# async / await:"
image: ""
tags: [".NET", "Async", "Await", "C#", "C# 5.0", "Rx", "Reactive Extensions", "Observable"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# async / await:

-   [Understanding C# async / await (1) Compilation](/posts/understanding-c-sharp-async-await-1-compilation)
-   Understanding C# async / await (2) Awaitable-Awaiter Pattern
-   [Understanding C# async / await (3) Runtime Context](/posts/understanding-c-sharp-async-await-3-runtime-context)

## What is awaitable

[Part 1](/posts/understanding-c-sharp-async-await-1-compilation) shows that any Task is awaitable. Actually there are other awaitable types. Here is an example:
```
Task<int> task = new Task<int>(() => 0);
int result = await task.ConfigureAwait(false); // Returns a ConfiguredTaskAwaitable<TResult>.
```

The returned ConfiguredTaskAwaitable<TResult> struct is awaitable. And it is not Task at all:

```csharp
public struct ConfiguredTaskAwaitable<TResult>
{
    private readonly ConfiguredTaskAwaiter m_configuredTaskAwaiter;

    internal ConfiguredTaskAwaitable(Task<TResult> task, bool continueOnCapturedContext)
    {
        this.m_configuredTaskAwaiter = new ConfiguredTaskAwaiter(task, continueOnCapturedContext);
    }

    public ConfiguredTaskAwaiter GetAwaiter()
    {
        return this.m_configuredTaskAwaiter;
    }
}
```

It has one GetAwaiter() method. Actually in [part 1](/posts/understanding-c-async-await-1-compilation) we have seen that Task has GetAwaiter() method too:

```csharp
public class Task
{
    public TaskAwaiter GetAwaiter()
    {
        return new TaskAwaiter(this);
    }
}

public class Task<TResult> : Task
{
    public new TaskAwaiter<TResult> GetAwaiter()
    {
        return new TaskAwaiter<TResult>(this);
    }
}
```

Task.Yield() is another example:
```
await Task.Yield(); // Returns a YieldAwaitable.
```

The returned YieldAwaitable is not Task either:
```
public struct YieldAwaitable
{
    public YieldAwaiter GetAwaiter()
    {
        return default(YieldAwaiter);
    }
}
```

Again, it just has one GetAwaiter() method. This article will look at what is awaitable.

## The awaitable-awaiter pattern

By observing different awaitable / awaiter types, we can tell that an object is awaitable if

-   It has a GetAwaiter() method (instance method or extension method);
-   Its GetAwaiter() method returns an awaiter. An object is an awaiter if:
    -   It implements INotifyCompletion or ICriticalNotifyCompletion interface;
    -   It has an IsCompleted, which has a getter and returns a Boolean;
    -   it has a GetResult() method, which returns void, or a result.

So apparently this awaitable-awaiter pattern is very similar to [the iteratable-iterator pattern](/posts/understanding-linq-to-objects-4-iterator-pattern). Here is the interface definitions of iteratable / iterator:

```typescript
public interface IEnumerable
{
    IEnumerator GetEnumerator();
}

public interface IEnumerator
{
    object Current { get; }

    bool MoveNext();

    void Reset();
}

public interface IEnumerable<out T> : IEnumerable
{
    IEnumerator<T> GetEnumerator();
}

public interface IEnumerator<out T> : IDisposable, IEnumerator
{
    T Current { get; }
}
```

In case the out keyword does not sound familiar, please find detailed explanation in another article [Understanding C# Covariance And Contravariance (2) Interfaces](/posts/understanding-csharp-covariance-and-contravariance-2-interfaces).

## The “missing” IAwaitable / IAwaiter interfaces

Similar to IEnumerable and IEnumerator interfaces, awaitable / awaiter can be visualized by IAwaitable / IAwaiter interfaces too. This is the non-generic version:

```typescript
public interface IAwaitable
{
    IAwaiter GetAwaiter();
}

public interface IAwaiter : INotifyCompletion // or ICriticalNotifyCompletion
{
    // INotifyCompletion has one method: void OnCompleted(Action continuation);

    // ICriticalNotifyCompletion implements INotifyCompletion,
    // also has this method: void UnsafeOnCompleted(Action continuation);

    bool IsCompleted { get; }

    void GetResult();
}
```

Please notice GetResult() returns void here. Task.GetAwaiter() / TaskAwaiter.GetResult() is of such case.

And here comes the generic version:

```typescript
public interface IAwaitable<out TResult>
{
    IAwaiter<TResult> GetAwaiter();
}

public interface IAwaiter<out TResult> : INotifyCompletion // or ICriticalNotifyCompletion
{
    bool IsCompleted { get; }

    TResult GetResult();
}
```

Here the only difference is, GetResult() return a result. Task<TResult>.GetAwaiter() / TaskAwaiter<TResult>.GetResult() is of this case.

Please notice .NET core does not define these IAwaitable / IAwaiter interfaces at all. IAwaitable interface will constraint GetAwaiter() to be instance method. Actually C# supports both GetAwaiter() instance method and GetAwaiter() extension method.

Here these interfaces are used only for better visualizing what is awaitable / awaiter. Now, if looking at above ConfiguredTaskAwaitable / ConfiguredTaskAwaiter, YieldAwaitable / YieldAwaiter, Task / TaskAwaiter pairs again, they all “implicitly” implement these “missing” IAwaitable / IAwaiter interfaces. The rest part of this article will show how to implement awaitable / awaiter.

## Await any function / action

In C# await cannot be used with lambda. This code:
```
int result = await (() => 0);
```

will cause a compiler error:

> Cannot await 'lambda expression'

This is easy to understand because this [lambda expression](/posts/understanding-csharp-3-0-features-6-lambda-expression) (() => 0) [may be a function or a expression tree](/posts/understanding-linq-to-sql-3-expression-tree). Obviously we mean function here, and we can tell compiler in this way:
```
int result = await new Func<int>(() => 0);
```

It causes an different error:

> Cannot await 'System.Func<int>'

OK, now the compiler is complaining the type instead of syntax. With the understanding of the awaitable / awaiter pattern, Func<TResult> type can be easily made into awaitable.

### GetAwaiter() instance method, using IAwaitable and IAwaiter interfaces

First, similar to above ConfiguredTaskAwaitable<TResult>, a FuncAwaitable<TResult> can be implemented to wrap Func<TResult>:

```csharp
internal struct FuncAwaitable<TResult> : IAwaitable<TResult>
{
    private readonly Func<TResult> function;

    public FuncAwaitable(Func<TResult> function)
    {
        this.function = function;
    }

    public IAwaiter<TResult> GetAwaiter()
    {
        return new FuncAwaiter<TResult>(this.function);
    }
}
```

FuncAwaitable<TResult> wrapper is used to implement IAwaitable<TResult>, so it has one instance method, GetAwaiter(), which returns a IAwaiter<TResult>, which wraps that Func<TResult> too. FuncAwaiter<TResult> is used to implement IAwaiter<TResult>:

```csharp
public struct FuncAwaiter<TResult> : IAwaiter<TResult>
{
    private readonly Task<TResult> task;

    public FuncAwaiter(Func<TResult> function)
    {
        this.task = new Task<TResult>(function);
        this.task.Start();
    }

    bool IAwaiter<TResult>.IsCompleted
    {
        get
        {
            return this.task.IsCompleted;
        }
    }

    TResult IAwaiter<TResult>.GetResult()
    {
        return this.task.Result;
    }

    void INotifyCompletion.OnCompleted(Action continuation)
    {
        new Task(continuation).Start();
    }
}
```

Now a function can be awaited in this way:
```
int result = await new FuncAwaitable<int>(() => 0);
```

### GetAwaiter() extension method, without IAwaitable interfaces

As IAwaitable shows, all that an awaitable needs is just a GetAwaiter() method. In above code, FuncAwaitable<TResult> is created as a wrapper of Func<TResult> and implements IAwaitable<TResult>, so that there is a GetAwaiter() instance method. If a GetAwaiter() extension method can be defined for Func<TResult>, then FuncAwaitable<TResult> is no longer needed:
```
public static class FuncExtensions
{
    public static IAwaiter<TResult> GetAwaiter<TResult>(this Func<TResult> function)
    {
        return new FuncAwaiter<TResult>(function);
    }
}
```

So a Func<TResult> function can be directly awaited:
```
int result = await new Func<int>(() => 0);
```

### Use the built-in awaitable and awaiter: Task and TaskAwaiter

Remember the most frequently used awaitable / awaiter - Task / TaskAwaiter. With Task / TaskAwaiter, FuncAwaitable / FuncAwaiter are no longer needed:
```
public static class FuncExtensions
{
    public static TaskAwaiter<TResult> GetAwaiter<TResult>(this Func<TResult> function)
    {
        Task<TResult> task = new Task<TResult>(function);
        task.Start();
        return task.GetAwaiter(); // Returns a TaskAwaiter<TResult>.
    }
}
```

Similarly, with this extension method:
```
public static class ActionExtensions
{
    public static TaskAwaiter GetAwaiter(this Action action)
    {
        Task task = new Task(action);
        task.Start();
        return task.GetAwaiter(); // Returns a TaskAwaiter.
    }
}
```

an action can be awaited as well:
```
await new Action(() => { });
```

Now any function / action can be awaited:
```
await new Action(() => HelperMethods.IO()); // or: await new Action(HelperMethods.IO);
```

If function / action has parameter(s), closure can be used:
```
int arg0 = 0;
int arg1 = 1;
int result = await new Action(() => HelperMethods.IO(arg0, arg1));
```

### Use Task.Run()

The above code is used to demonstrate how awaitable / awaiter can be implemented. As it is common scenario to await a function / action, .NET provides a built-in API: Task.Run(). Their implementations are similar to:

```csharp
public class Task
{
    public static Task Run(Action action)
    {
        // The implementation is similar to:
        Task task = new Task(action);
        task.Start();
        return task;
    }

    public static Task<TResult> Run<TResult>(Func<TResult> function)
    {
        // The implementation is similar to:
        Task<TResult> task = new Task<TResult>(function);
        task.Start();
        return task;
    }
}
```

In reality, this is how to await a function:
```
int result = await Task.Run(() => HelperMethods.IO(arg0, arg1));
```

and await a action:
```
await Task.Run(HelperMethods.IO);
```

## Await IObservable<T>

[IObservable<T>](https://msdn.microsoft.com/en-us/library/dd990377.aspx) and [IConnectableObservable<T>](https://msdn.microsoft.com/en-us/library/hh211887.aspx) become awaitable too, if a reference is added for [System.Reactive.Linq.dll](http://www.nuget.org/packages/Rx-Linq/), a part of [Rx (Reactive Extensions)](https://msdn.microsoft.com/en-us/data/gg577609.aspx). In this library, the GetAwaiter() extension methods are provided:
```
public static class Observable
{
    public static AsyncSubject<TSource> GetAwaiter<TSource>(this IObservable<TSource> source);

    public static AsyncSubject<TSource> GetAwaiter<TSource>(this IConnectableObservable<TSource> source);
}
```

Each method returns a AsyncSubject<T>, which is an awaiter:
```
public sealed class AsyncSubject<T> : INotifyCompletion, ISubject<T>, ISubject<T, T>, IObserver<T>, IObservable<T>, IDisposable
{
    public bool IsCompleted { get; }
    
    public void OnCompleted();

    // ...
}
```

So that can be used with the await keyword. Take IObservable<T> as example:

```csharp
private static async Task AwaitObservable1()
{
    IObservable<int> observable = Observable.Range(0, 3).Do(Console.WriteLine);
    await observable;
}
```

This outputs:

> 0 1 2

Another example:

```csharp
private static async Task<string> AwaitObservable2()
{
    IObservable<string> observable = new string[]
        {
            "https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-1-compilation",
            "https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern",
            "https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-3-runtime-context",
        }
        .ToObservable<string>()
        .SelectMany(async url => await new WebClient().DownloadStringTaskAsync(url))
        .Select(StringExtensions.GetTitleFromHtml)
        .Do(Console.WriteLine);

    return await observable;
}
```

where the GetTitleFromHtml is:
```
public static string GetTitleFromHtml(this string html)
{
    Match match = new Regex(
        @".*<head>.*<title>(.*)</title>.*</head>.*",
        RegexOptions.IgnoreCase | RegexOptions.Singleline).Match(html);
    return match.Success ? match.Groups[1].Value : null;
}
```

Executing above AwaitObservable2 method will output the title of each page:

> Dixin&#39;s Blog - Understanding C# async / await (1) Compilation Dixin&#39;s Blog - Understanding C# async / await (3) Runtime Context Dixin&#39;s Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern

which is exactly what’s between <tile> and </title>.