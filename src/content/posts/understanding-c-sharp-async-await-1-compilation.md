---
title: "Understanding C# async / await (1) Compilation"
published: 2012-11-03
description: "Understanding C# async / await:"
image: ""
tags: [".NET", "Async", "Await", "C#", "C# 5.0"]
category: ".NET"
draft: false
lang: ""
---

Understanding C# async / await:

-   Understanding C# async / await (1) Compilation
-   [Understanding C# async / await (2) Awaitable-Awaiter Pattern](/posts/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern)
-   [Understanding C# async / await (3) Runtime Context](/posts/understanding-c-sharp-async-await-3-runtime-context)

Now the [async / await keywords are in C#.](http://msdn.microsoft.com/en-us/library/vstudio/hh191443.aspx) Just like [the async and ! in F#](http://msdn.microsoft.com/en-us/library/dd233250.aspx), this new C# feature provides great convenience. There are many nice documents talking about how to use async / await in specific scenarios, like [using async methods in ASP.NET 4.5](http://www.asp.net/web-forms/tutorials/aspnet-45/using-asynchronous-methods-in-aspnet-45) and [in ASP.NET MVC 4](http://www.asp.net/mvc/tutorials/mvc-4/using-asynchronous-methods-in-aspnet-mvc-4), etc. This article will look at the real code working behind the syntax sugar.

As [MSDN stated](http://msdn.microsoft.com/en-us/library/hh156513.aspx):

> The async modifier indicates that the method, lambda expression, or anonymous method that it modifies is asynchronous.

Also since [lambda expression / anonymous method will be compiled to normal method](/posts/understanding-csharp-3-0-features-6-lambda-expression), this article will focus on normal async method.

## Preparation

First of all, Some helper methods need to be made up.

```csharp
internal class HelperMethods
{
    private static void IO()
    {
        using (WebClient client = new WebClient())
        {
            Enumerable.Repeat("http://weblogs.asp.net/dixin", 10).Select(client.DownloadString).ToArray();
        }
    }

    internal static int Method(int arg0, int arg1)
    {
        int result = arg0 + arg1;
        IO(); // Do some long running IO.
        return result;
    }

    internal static Task<int> MethodTask(int arg0, int arg1)
    {
        Task<int> task = new Task<int>(() => Method(arg0, arg1));
        task.Start(); // Hot task (started task) should always be returned.
        return task;
    }

    internal static void Before()
    {
    }

    internal static void Continuation1(int arg)
    {
    }

    internal static void Continuation2(int arg)
    {
    }
}
```

Here Method() is a long running method doing some IO. Then MethodTask() wraps it into a Task and return that Task. Nothing special here.

## Await something in async method

Since MethodTask() returns Task, let’s try to await it:
```
internal class AsyncMethods
{
    internal static async Task<int> MethodAsync(int arg0, int arg1)
    {
        int result = await HelperMethods.MethodTask(arg0, arg1);
        return result;
    }
}
```

Because the await keyword is used in the body, the async keyword must be put on the method. Now the first async method is here. According to the [naming convenience](http://msdn.microsoft.com/en-us/library/vstudio/hh191443.aspx#BKMK_NamingConvention), it has postfix Async. Of course as an async method, itself can be awaited. So here comes a CallMethodAsync() to call MethodAsync():
```
internal class AsyncMethods
{
    internal static async Task<int> CallMethodAsync(int arg0, int arg1)
    {
        int result = await MethodAsync(arg0, arg1);
        return result;
    }
}
```

After compilation, MethodAsync() and CallMethodAsync() will have the same logic. This is the code of MethodAsyc():
```
internal class CompiledAsyncMethods
{
    [DebuggerStepThrough]
    [AsyncStateMachine(typeof(MethodAsyncStateMachine))] // async
    internal static /*async*/ Task<int> MethodAsync(int arg0, int arg1)
    {
        MethodAsyncStateMachine methodAsyncStateMachine = new MethodAsyncStateMachine()
            {
                Arg0 = arg0,
                Arg1 = arg1,
                Builder = AsyncTaskMethodBuilder<int>.Create(),
                State = -1
            };
        methodAsyncStateMachine.Builder.Start(ref methodAsyncStateMachine);
        return methodAsyncStateMachine.Builder.Task;
    }
}
```

The async keyword is gone. It only creates and starts a state machine MethodAsyncStateMachine, and all actual logic are moved to that state machine:

```csharp
[CompilerGenerated]
[StructLayout(LayoutKind.Auto)]
internal struct MethodAsyncStateMachine : IAsyncStateMachine
{
    public int State;
    public AsyncTaskMethodBuilder<int> Builder;
    public int Arg0;
    public int Arg1;
    public int Result;
    private TaskAwaiter<int> awaitor;

    void IAsyncStateMachine.MoveNext()
    {
        try
        {
            if (this.State != 0)
            {
                this.awaitor = HelperMethods.MethodTask(this.Arg0, this.Arg1).GetAwaiter();
                if (!this.awaitor.IsCompleted)
                {
                    this.State = 0;
                    this.Builder.AwaitUnsafeOnCompleted(ref this.awaitor, ref this);
                    return;
                }
            }
            else
            {
                this.State = -1;
            }

            this.Result = this.awaitor.GetResult();
        }
        catch (Exception exception)
        {
            this.State = -2;
            this.Builder.SetException(exception);
            return;
        }

        this.State = -2;
        this.Builder.SetResult(this.Result);
    }

    [DebuggerHidden]
    void IAsyncStateMachine.SetStateMachine(IAsyncStateMachine param0)
    {
        this.Builder.SetStateMachine(param0);
    }
}
```

The generated code has been cleaned up so it is readable and can be compiled. Several things can be observed here:

-   The async modifier is gone, which shows, unlike other modifiers (e.g. static), there is no such IL/CLR level “async” stuff. It becomes a [AsyncStateMachineAttribute](http://msdn.microsoft.com/en-us/library/system.runtime.compilerservices.asyncstatemachineattribute.aspx). This is similar to [the compilation of extension method](/posts/understanding-csharp-3-0-features-5-extension-method).
-   The generated state machine is very similar to [the state machine of C# yield syntax sugar](/posts/understanding-linq-to-objects-5-implementing-iterator).
-   The local variables (arg0, arg1, result) are compiled as the fields of the state machine.
-   The real code (await HelperMethods.MethodTask(arg0, arg1)) is compiled into MoveNext() as: HelperMethods.MethodTask(this.Arg0, this.Arg1).GetAwaiter().

CallMethodAsync() will create and start its own state machine CallMethodAsyncStateMachine:
```
internal class CompiledAsyncMethods
{
    [DebuggerStepThrough]
    [AsyncStateMachine(typeof(CallMethodAsyncStateMachine))] // async
    internal static /*async*/ Task<int> CallMethodAsync(int arg0, int arg1)
    {
        CallMethodAsyncStateMachine callMethodAsyncStateMachine = new CallMethodAsyncStateMachine()
            {
                Arg0 = arg0,
                Arg1 = arg1,
                Builder = AsyncTaskMethodBuilder<int>.Create(),
                State = -1
            };
        callMethodAsyncStateMachine.Builder.Start(ref callMethodAsyncStateMachine);
        return callMethodAsyncStateMachine.Builder.Task;
    }
}
```

CallMethodAsyncStateMachine has the same logic as MethodAsyncStateMachine above. The detail of the state machine will be discussed soon. Now it is clear that:

-   async /await is a C# level syntax sugar.
-   There is no difference between awaiting a async method or awaiting a normal method. Any method returning Task will be awaitable, or – to be precise – Task objects can be awaited. What can be [awaitable will be explained in part 2](/posts/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern).

## State machine and continuation

To demonstrate more details in the state machine, a more complex method can be created:
```
internal class AsyncMethods
{
    internal static async Task<int> MultiCallMethodAsync(int arg0, int arg1, int arg2, int arg3)
    {
        HelperMethods.Before();
        int resultOfAwait1 = await MethodAsync(arg0, arg1);
        HelperMethods.Continuation1(resultOfAwait1);
        int resultOfAwait2 = await MethodAsync(arg2, arg3);
        HelperMethods.Continuation2(resultOfAwait2);
        int resultToReturn = resultOfAwait1 + resultOfAwait2;
        return resultToReturn;
    }
}
```

In this method:

-   There are multiple awaits.
-   There are code before the awaits, and continuation code after each await

After compilation, this multi-await method becomes the same as above single-await methods:
```
internal class CompiledAsyncMethods
{
    [DebuggerStepThrough]
    [AsyncStateMachine(typeof(MultiCallMethodAsyncStateMachine))] // async
    internal static /*async*/ Task<int> MultiCallMethodAsync(int arg0, int arg1, int arg2, int arg3)
    {
        MultiCallMethodAsyncStateMachine multiCallMethodAsyncStateMachine = new MultiCallMethodAsyncStateMachine()
            {
                Arg0 = arg0,
                Arg1 = arg1,
                Arg2 = arg2,
                Arg3 = arg3,
                Builder = AsyncTaskMethodBuilder<int>.Create(),
                State = -1
            };
        multiCallMethodAsyncStateMachine.Builder.Start(ref multiCallMethodAsyncStateMachine);
        return multiCallMethodAsyncStateMachine.Builder.Task;
    }
}
```

It also creates and starts one single state machine, MultiCallMethodAsyncStateMachine, with more logic:

```csharp
[CompilerGenerated]
[StructLayout(LayoutKind.Auto)]
internal struct MultiCallMethodAsyncStateMachine : IAsyncStateMachine
{
    public int State;
    public AsyncTaskMethodBuilder<int> Builder;
    public int Arg0;
    public int Arg1;
    public int Arg2;
    public int Arg3;
    public int ResultOfAwait1;
    public int ResultOfAwait2;
    public int ResultToReturn;
    private TaskAwaiter<int> awaiter;

    void IAsyncStateMachine.MoveNext()
    {
        try
        {
            switch (this.State)
            {
                case -1:
                    HelperMethods.Before();
                    this.awaiter = AsyncMethods.MethodAsync(this.Arg0, this.Arg1).GetAwaiter();
                    if (!this.awaiter.IsCompleted)
                    {
                        this.State = 0;
                        this.Builder.AwaitUnsafeOnCompleted(ref this.awaiter, ref this);
                    }
                    break;
                case 0:
                    this.ResultOfAwait1 = this.awaiter.GetResult();
                    HelperMethods.Continuation1(this.ResultOfAwait1);
                    this.awaiter = AsyncMethods.MethodAsync(this.Arg2, this.Arg3).GetAwaiter();
                    if (!this.awaiter.IsCompleted)
                    {
                        this.State = 1;
                        this.Builder.AwaitUnsafeOnCompleted(ref this.awaiter, ref this);
                    }
                    break;
                case 1:
                    this.ResultOfAwait2 = this.awaiter.GetResult();
                    HelperMethods.Continuation2(this.ResultOfAwait2);
                    this.ResultToReturn = this.ResultOfAwait1 + this.ResultOfAwait2;
                    this.State = -2;
                    this.Builder.SetResult(this.ResultToReturn);
                    break;
            }
        }
        catch (Exception exception)
        {
            this.State = -2;
            this.Builder.SetException(exception);
        }
    }

    [DebuggerHidden]
    void IAsyncStateMachine.SetStateMachine(IAsyncStateMachine stateMachine)
    {
        this.Builder.SetStateMachine(stateMachine);
    }
}
```

The above code is already cleaned up, but there are still a lot of things. To [keep it simple stupid](http://en.wikipedia.org/wiki/KISS_principle), the state machine can be rewritten as:

```csharp
[CompilerGenerated]
[StructLayout(LayoutKind.Auto)]
internal struct MultiCallMethodAsyncStateMachine : IAsyncStateMachine
{
    // State:
    // -1: Begin
    //  0: 1st await is done
    //  1: 2nd await is done
    //     ...
    // -2: End
    public int State;
    public TaskCompletionSource<int> ResultToReturn; // int resultToReturn ...
    public int Arg0; // int Arg0
    public int Arg1; // int arg1
    public int Arg2; // int arg2
    public int Arg3; // int arg3
    public int ResultOfAwait1; // int resultOfAwait1 ...
    public int ResultOfAwait2; // int resultOfAwait2 ...
    private Task<int> currentTaskToAwait;

    /// <summary>
    /// Moves the state machine to its next state.
    /// </summary>
    void IAsyncStateMachine.MoveNext()
    {
        try
        {
            switch (this.State)
            {
                IAsyncStateMachine that = this; // Cannot use "this" in lambda so create a local copy. 
                // Orginal code is splitted by "case"s:
                // case -1:
                //      HelperMethods.Before();
                //      MethodAsync(Arg0, arg1);
                // case 0:
                //      int resultOfAwait1 = await ...
                //      HelperMethods.Continuation1(resultOfAwait1);
                //      MethodAsync(arg2, arg3);
                // case 1:
                //      int resultOfAwait2 = await ...
                //      HelperMethods.Continuation2(resultOfAwait2);
                //      int resultToReturn = resultOfAwait1 + resultOfAwait2;
                //      return resultToReturn;
                case -1: // -1 is begin.
                    HelperMethods.Before(); // Code before 1st await.
                    this.currentTaskToAwait = AsyncMethods.MethodAsync(this.Arg0, this.Arg1); // 1st task to await
                    // When this.currentTaskToAwait is done, run this.MoveNext() and go to case 0.
                    this.State = 0;
                    this.currentTaskToAwait.ContinueWith(_ => that.MoveNext()); // Callback
                    break;
                case 0: // Now 1st await is done.
                    this.ResultOfAwait1 = this.currentTaskToAwait.Result; // Get 1st await's result.
                    HelperMethods.Continuation1(this.ResultOfAwait1); // Code after 1st await and before 2nd await.
                    this.currentTaskToAwait = AsyncMethods.MethodAsync(this.Arg2, this.Arg3); // 2nd task to await
                    // When this.currentTaskToAwait is done, run this.MoveNext() and go to case 1.
                    this.State = 1;
                    this.currentTaskToAwait.ContinueWith(_ => that.MoveNext()); // Callback
                    break;
                case 1: // Now 2nd await is done.
                    this.ResultOfAwait2 = this.currentTaskToAwait.Result; // Get 2nd await's result.
                    HelperMethods.Continuation2(this.ResultOfAwait2); // Code after 2nd await.
                    int resultToReturn = this.ResultOfAwait1 + this.ResultOfAwait2; // Code after 2nd await.
                    // End with resultToReturn. No more invocation of MoveNext().
                    this.State = -2; // -2 is end.
                    this.ResultToReturn.SetResult(resultToReturn);
                    break;
            }
        }
        catch (Exception exception)
        {
            // End with exception.
            this.State = -2; // -2 is end. Exception will also when the execution of state machine.
            this.ResultToReturn.SetException(exception);
        }
    }

    /// <summary>
    /// Configures the state machine with a heap-allocated replica.
    /// </summary>
    /// <param name="stateMachine">The heap-allocated replica.</param>
    [DebuggerHidden]
    void IAsyncStateMachine.SetStateMachine(IAsyncStateMachine stateMachine)
    {
        // No core logic.
    }
}
```

Only Task and TaskCompletionSource are involved in this revised version. And MultiCallMethodAsync() can be also simplified to:
```
[DebuggerStepThrough]
[AsyncStateMachine(typeof(MultiCallMethodAsyncStateMachine))] // async
internal static /*async*/ Task<int> MultiCallMethodAsync_(int arg0, int arg1, int arg2, int arg3)
{
    MultiCallMethodAsyncStateMachine multiCallMethodAsyncStateMachine = new MultiCallMethodAsyncStateMachine()
        {
            Arg0 = arg0,
            Arg1 = arg1,
            Arg2 = arg2,
            Arg3 = arg3,
            ResultToReturn = new TaskCompletionSource<int>(),
            // -1: Begin
            //  0: 1st await is done
            //  1: 2nd await is done
            //     ...
            // -2: End
            State = -1
        };
    (multiCallMethodAsyncStateMachine as IAsyncStateMachine).MoveNext(); // Original code are in this method.
    return multiCallMethodAsyncStateMachine.ResultToReturn.Task;
}
```

Now the entire state machine becomes very clear - it is about callback:

-   Original code are split into pieces by “await”s, and each piece is put into each “case” in the state machine. Here the 2 awaits split the code into 3 pieces, so there are 3 “case”s.
-   The “piece”s are chained by callback, that is done by Builder.AwaitUnsafeOnCompleted(callback), or currentTaskToAwait.ContinueWith(callback) in the simplified code.
-   A previous “piece” will end with a Task (which is to be awaited), when the task is done, it will callback the next “piece”.
-   The state machine’s state works with the “case”s to ensure the code “piece”s executes one after another.

## It is like callbacks

Since it is like callbacks, the simplification can go even further – the entire state machine can be completely replaced by Task.ContinueWith(). Now MultiCallMethodAsync() becomes:
```
internal static Task<int> MultiCallMethodAsync(int arg0, int arg1, int arg2, int arg3)
{
    TaskCompletionSource<int> taskCompletionSource = new TaskCompletionSource<int>();
    try
    {
        HelperMethods.Before();
        MethodAsync(arg0, arg1).ContinueWith(await1 =>
            {
                try
                {
                    int resultOfAwait1 = await1.Result;
                    HelperMethods.Continuation1(resultOfAwait1);
                    MethodAsync(arg2, arg3).ContinueWith(await2 =>
                        {
                            try
                            {
                                int resultOfAwait2 = await2.Result;
                                HelperMethods.Continuation2(resultOfAwait2);
                                int resultToReturn = resultOfAwait1 + resultOfAwait2;
                                taskCompletionSource.SetResult(resultToReturn);
                            }
                            catch (Exception exception)
                            {
                                taskCompletionSource.SetException(exception);
                            }
                        });
                }
                catch (Exception exception)
                {
                    taskCompletionSource.SetException(exception);
                }
            });
    }
    catch (Exception exception)
    {
        taskCompletionSource.SetException(exception);
    }
    return taskCompletionSource.Task;
}
```

In order to compare with the original async / await code:
```
internal static async Task<int> MultiCallMethodAsync(int arg0, int arg1, int arg2, int arg3)
{
    HelperMethods.Before();
    int resultOfAwait1 = await MethodAsync(arg0, arg1);
    HelperMethods.Continuation1(resultOfAwait1);
    int resultOfAwait2 = await MethodAsync(arg2, arg3);
    HelperMethods.Continuation2(resultOfAwait2);
    int resultToReturn = resultOfAwait1 + resultOfAwait2;
    return resultToReturn;
}
```

the above code can be reformatted for easier reading:
```
internal static Task<int> MultiCallMethodAsync(int arg0, int arg1, int arg2, int arg3)
{
    TaskCompletionSource<int> taskCompletionSource = new TaskCompletionSource<int>(); try {

    // Original code begins.
    HelperMethods.Before();
    // int resultOfAwait1 = await MethodAsync(arg0, arg1);
    MethodAsync(arg0, arg1).ContinueWith(await1 => { try { int resultOfAwait1 = await1.Result;
    HelperMethods.Continuation1(resultOfAwait1);
    // int resultOfAwait2 = await MethodAsync(arg2, arg3);
    MethodAsync(arg2, arg3).ContinueWith(await2 => { try { int resultOfAwait2 = await2.Result;
    HelperMethods.Continuation2(resultOfAwait2);
    int resultToReturn = resultOfAwait1 + resultOfAwait2;
    // return resultToReturn;
    taskCompletionSource.SetResult(resultToReturn);
    // Original code ends.

    } catch (Exception exception) { taskCompletionSource.SetException(exception); }});
    } catch (Exception exception) { taskCompletionSource.SetException(exception); }});
    } catch (Exception exception) { taskCompletionSource.SetException(exception); }
    return taskCompletionSource.Task;
}
```

Yeah that is the magic of C# async / await:

-   Await is literally pretending to wait. In a await expression, a Task object will be return immediately so that calling thread is not blocked. The continuation code is compiled as that Task’s callback code.
-   When that task is done, continuation code will execute.

However, the above callback code has a context handling issue at runtime, which will be explained and fixed in [part 3](/posts/understanding-c-sharp-async-await-3-runtime-context).

### Use Task.Yeild()

[Task.Yeild()](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.yield.aspx) is an interesting built-in API:

> You can use await Task.Yield(); in an asynchronous method to force the method to complete asynchronously.

For example:
```
internal static void NoYeild()
{
    HelperMethods.Before();
    HelperMethods.Continuation(0);
    // Returns after HelperMethods.Continuation(0) finishes execution.
}

internal static async Task YeildAsync()
{
    HelperMethods.Before();
    await Task.Yield(); // Returns without waiting for continuation code to execute.
    HelperMethods.Continuation(0);
}
```

Here await Task.Yield(); indicates to compile the following HelperMethods.Continuation(0); like a callback. So, similarly, it can be rewritten as:
```
internal static Task YeildAsync()
{
    TaskCompletionSource<object> taskCompletionSource = new TaskCompletionSource<object>();
    try
    {
        HelperMethods.Before();
        Task yeild = new Task(() => { });
        yeild.Start();
        yeild.ContinueWith(await =>
            {
                try
                {
                    HelperMethods.Continuation(0);
                    taskCompletionSource.SetResult(null);
                }
                catch (Exception exception)
                {
                    taskCompletionSource.SetException(exception);
                }
            });
    }
    catch (Exception exception)
    {
        taskCompletionSource.SetException(exception);
    }

    return taskCompletionSource.Task;
}
```

Here TaskCompletionSource<object> is used, since [.NET does not provided a non-generic TaskCompletionSource class](https://social.msdn.microsoft.com/Forums/vstudio/en-US/f6ee1462-d3ef-40ed-801a-76bdfaf01e1e/feedback-taskcompletionsourcet-used-with-task?forum=parallelextensions).

Similarly, this can be reformatted to:
```
internal static Task YeildAsync()
{
    TaskCompletionSource<object> taskCompletionSource = new TaskCompletionSource<object>(); try {

    // Original code begins.
    HelperMethods.Before();
    // await Task.Yeild();
    Task yeild = new Task(() => { }); yeild.Start(); yeild.ContinueWith(await => { try {
    HelperMethods.Continuation(0);
    // Original code ends.

    taskCompletionSource.SetResult(null);
    } catch (Exception exception) { taskCompletionSource.SetException(exception); }});
    } catch (Exception exception) { taskCompletionSource.SetException(exception); }
    return taskCompletionSource.Task;
}
```

In another word, [Task.Yeild()](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.yield.aspx) makes the method returns right there immediately, and schedule its continuation code to CPU asynchromously, which creates a chance for other tasks to be scheduled to CPU first. This is similar concept to the setTimeout() approach in [JavaScript](http://en.wikipedia.org/wiki/JavaScript):
```
var sync = function () {
    before();
    continuation();
    // Returns after continuation finishes execution.
};
var async = function () {
    before();
    setTimeout(continuation, 0);
    // Returns immediately (after setTimeout finishes execution).
};
```

except JavaScript has a single threading model.

Again, the above ContinueWith() callback code has the same context handling issue at runtime, which will be explained and fixed in [part 3](/posts/understanding-c-sharp-async-await-3-runtime-context).