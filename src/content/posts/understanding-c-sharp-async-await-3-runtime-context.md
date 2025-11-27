---
title: "Understanding C# async / await (3) Runtime Context"
published: 2015-01-01
description: "Understanding C# async / await:"
image: ""
tags: [".NET", "Async", "Await", "C#", "C# 5.0"]
category: "C#"
draft: false
lang: ""
---

Understanding C# async / await:

-   [Understanding C# async / await (1) Compilation](/posts/understanding-c-sharp-async-await-1-compilation)
-   [Understanding C# async / await (2) Awaitable-Awaiter Pattern](/posts/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern)
-   Understanding C# async / await (3) Runtime Context

[Part 1](/posts/understanding-c-sharp-async-await-1-compilation) explained the compilation of await:

-   In a async method with await keyword, all the code are compiled into a state machine’s MoveNext() method.
-   When this async method is called, the state machine is started. Along with the change of the state, MoveNext() will be called in a callback-like style.

```csharp
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

To demonstrate the callback-like mechanism, part 1 simply used Task.ContinueWith():

```csharp
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

Actually, the await infrastructure is [more than meets the eye](http://tfwiki.net/wiki/The_Transformers:_More_than_Meets_the_Eye).

## Threading issue

A simple experiment can be done with a tiny WPF application. It has a window with a TextBox and a Button:

```csharp
<Window x:Class="WpfAsync.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="MainWindow" Height="350" Width="525">
    <Grid>
        <TextBox x:Name="TextBox" HorizontalAlignment="Left" Height="274" Margin="10,10,0,0" TextWrapping="Wrap" Text="TextBox" VerticalAlignment="Top" Width="497"/>
        <Button x:Name="Button" Content="Button" HorizontalAlignment="Left" Margin="432,289,0,0" VerticalAlignment="Top" Width="75"/>
    </Grid>
</Window>
```

And the code-behind is straightforward:

```csharp
namespace WpfAsync
{
    using System.Net;

    public partial class MainWindow
    {
        public MainWindow()
        {
            this.InitializeComponent();
            this.Button.Click += async (sender, e) =>
            {
                string html = await new WebClient().DownloadStringTaskAsync("https://weblogs.asp.net/dixin");
                this.TextBox.Text = html;
            };
        }
    }
}
```

When the Button is clicked, a string will be downloaded asynchronously. When the download is completed, the string will be displayed in the TextBox.

Of course this code works. But if it is rewritten in callback style with Task.ContinueWith():

```csharp
this.Button.Click += (sender, e) =>
{
    // string html = await new WebClient().DownloadStringTaskAsync("https://weblogs.asp.net/dixin");
    new WebClient().DownloadStringTaskAsync("https://weblogs.asp.net/dixin").ContinueWith(await => { string html = await.Result;
    this.TextBox.Text = html; });
};
```

running the rewritten code, the continuation (this.TextBox.Text = html;) may throw an InvalidOperationException:

> The calling thread cannot access this object because a different thread owns it.

The reason is, when the callback code is scheduled to a non-UI thread in the thread pool, it cannot access the UI controls, like changing TextBox’s Text property. In the first async/await version, the await infrastructure resolves the cross-thread issue, majorly by [marshaling the continuation code back to the initially captured ExecutionContext and SynchronizationContext](http://blogs.msdn.com/b/pfxteam/archive/2012/06/15/executioncontext-vs-synchronizationcontext.aspx).

## Marshal to ExecutionContext

When reschedule a bunch of code to thread pool - potentially on another thread - await’s state machine invocation mechanism transfers initial calling thread’s ExecutionContext to each next call of MoveNext(). As [MSDN explained](http://msdn.microsoft.com/en-us/library/system.threading.executioncontext.aspx):

> The ExecutionContext class provides a single container for all information relevant to a logical thread of execution. This includes security context, call context, and synchronization context.
> 
> The ExecutionContext class provides the functionality for user code to capture and transfer this context across user-defined asynchronous points. The common language runtime ensures that the ExecutionContext is consistently transferred across runtime-defined asynchronous points within the managed process.

This is the public API to capture current thread’s ExecutionContext:

```csharp
// See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.GetCompletionAction()
ExecutionContext executionContext = ExecutionContext.Capture();
```

And this extension method demonstrates how to invoke a function with a specified ExecutionContext (typically, captured from another thread):

```csharp
public static class FuncExtensions
{
    public static TResult InvokeWith<TResult>(this Func<TResult> function, ExecutionContext executionContext)
    {
        Contract.Requires<ArgumentNullException>(function != null);

        if (executionContext == null)
        {
            return function();
        }

        TResult result = default(TResult);
        // See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.MoveNextRunner.Run()
        ExecutionContext.Run(executionContext, _ => result = function(), null);
        return result;
    }
}
```

## Marshal to SynchronizationContext

The await’s infrastructure also takes care of [SynchronizationContext](http://msdn.microsoft.com/en-us/library/system.threading.synchronizationcontext.aspx):

> The SynchronizationContext class is a base class that provides a free-threaded context with no synchronization.
> 
> The purpose of the synchronization model implemented by this class is to allow the internal asynchronous/synchronous operations of the common language runtime to behave properly with different synchronization models.

In different environment, [SynchronizationContext has different implementations](http://msdn.microsoft.com/en-us/magazine/gg598924.aspx). In .NET there are:

-   WPF: System.Windows.Threading.[DispatcherSynchronizationContext](http://msdn.microsoft.com/en-us/library/system.windows.threading.dispatchersynchronizationcontext.aspx) (the case of this article)
-   WinForms: System.Windows.Forms.[WindowsFormsSynchronizationContext](http://msdn.microsoft.com/en-us/library/system.windows.forms.windowsformssynchronizationcontext.aspx)
-   WinRT: System.Threading.WinRTSynchronizationContext
-   ASP.NET: System.Web.[AspNetSynchronizationContext](http://referencesource.microsoft.com/#System.Web/AspNetSynchronizationContext.cs)

etc.

Similar to ExecutionContext, the state machine invocation mechanism captures the initial SynchronizationContext, and post each call of MoveNext() to that SynchronizationContext.

This is the public API to capture current thread’s SynchronizationContext:

```csharp
// See: System.Runtime.CompilerServices.AsyncVoidMethodBuilder.Create()
// See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.MoveNextRunner.Run()
SynchronizationContext synchronizationContext = SynchronizationContext.Current;
```

And this extension method demonstrates how to invoke a function with a specified SynchronizationContext and ExecutionContext:

```csharp
public static class FuncExtensions
{
    public static Task<TResult> InvokeWith<TResult>(this Func<TResult> function, SynchronizationContext synchronizationContext, ExecutionContext executionContext)
    {
        Contract.Requires<ArgumentNullException>(function != null);

        TaskCompletionSource<TResult> taskCompletionSource = new TaskCompletionSource<TResult>();
        try
        {
            if (synchronizationContext == null)
            {
                TResult result = function.InvokeWith(executionContext);
                taskCompletionSource.SetResult(result);
            }
            else
            {
                // See: System.Runtime.CompilerServices.AsyncVoidMethodBuilder.Create()
                synchronizationContext.OperationStarted();
                // See: System.Threading.Tasks.SynchronizationContextAwaitTaskContinuation.PostAction()
                synchronizationContext.Post(_ =>
                {
                    try
                    {
                        TResult result = function.InvokeWith(executionContext);
                        // See: System.Runtime.CompilerServices.AsyncVoidMethodBuilder.NotifySynchronizationContextOfCompletion()
                        synchronizationContext.OperationCompleted();
                        taskCompletionSource.SetResult(result);
                    }
                    catch (Exception exception)
                    {
                        taskCompletionSource.SetException(exception);
                    }
                }, null);
            }
        }
        catch (Exception exception)
        {
            taskCompletionSource.SetException(exception);
        }

        return taskCompletionSource.Task;
    }
}
```

And this is the version for action:

```csharp
public static class ActionExtensions
{
    public static Task InvokeWith(this Action action, SynchronizationContext synchronizationContext, ExecutionContext executionContext)
    {
        Contract.Requires<ArgumentNullException>(action != null);

        return new Func<object>(() =>
        {
            action();
            return null;
        }).InvokeWith(synchronizationContext, executionContext);
    }
}
```

## Callback with ExecutionContext and SynchronizationContext

With the above extension methods, some enhanced methods can be created for Task.ContinueWith() callback mechanism. Here it is called ContinueWithContext() because it [takes care of ExecutionContext and SynchronizationContext](http://blogs.msdn.com/b/pfxteam/archive/2012/06/15/executioncontext-vs-synchronizationcontext.aspx) for ContinueWith(). This version is to continue with function:

```csharp
public static class TaskExtensions
{
    public static Task<TNewResult> ContinueWithContext<TResult, TNewResult>(this Task<TResult> task, Func<Task<TResult>, TNewResult> continuation)
    {
        Contract.Requires<ArgumentNullException>(task != null);
        Contract.Requires<ArgumentNullException>(continuation != null);

        // See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.GetCompletionAction()
        ExecutionContext executionContext = ExecutionContext.Capture();
        // See: System.Runtime.CompilerServices.AsyncVoidMethodBuilder.Create()
        // See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.MoveNextRunner.Run()
        SynchronizationContext synchronizationContext = SynchronizationContext.Current;
        return task.ContinueWith(t =>
                new Func<TNewResult>(() => continuation(t)).InvokeWith(synchronizationContext, executionContext))
            .Unwrap();
    }

    public static Task<TNewResult> ContinueWithContext<TNewResult>(this Task task, Func<Task, TNewResult> continuation)
    {
        Contract.Requires<ArgumentNullException>(task != null);
        Contract.Requires<ArgumentNullException>(continuation != null);

        // See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.GetCompletionAction()
        ExecutionContext executionContext = ExecutionContext.Capture();
        // See: System.Runtime.CompilerServices.AsyncVoidMethodBuilder.Create()
        // See: System.Runtime.CompilerServices.AsyncMethodBuilderCore.MoveNextRunner.Run()
        SynchronizationContext synchronizationContext = SynchronizationContext.Current;
        return task.ContinueWith(t => 
                new Func<TNewResult>(() => continuation(t)).InvokeWith(synchronizationContext, executionContext))
            .Unwrap();
    }
}
```

And this is the version to continue with action:

```csharp
public static class TaskExtensions
{
    public static Task ContinueWithContext<TResult>(this Task<TResult> task, Action<Task<TResult>> continuation)
    {
        Contract.Requires<ArgumentNullException>(task != null);
        Contract.Requires<ArgumentNullException>(continuation != null);

        return task.ContinueWithContext(new Func<Task<TResult>, object>(t =>
        {
            continuation(t);
            return null;
        }));
    }

    public static Task ContinueWithContext(this Task task, Action<Task> continuation)
    {
        Contract.Requires<ArgumentNullException>(task != null);
        Contract.Requires<ArgumentNullException>(continuation != null);

        return task.ContinueWithContext(new Func<Task, object>(t =>
        {
            continuation(t);
            return null;
        }));
    }
}
```

So the above WPF code can be easily fixed as:

```csharp
this.Button.Click += (sender, e) =>
{
    // string html = await new WebClient().DownloadStringTaskAsync("https://weblogs.asp.net/dixin");
    new WebClient().DownloadStringTaskAsync("https://weblogs.asp.net/dixin").ContinueWithContext(await => { string html = await.Result;
    this.TextBox.Text = html; });
};
```

Just replace ContinueWith() with ContinueWithContext(), the continuation (this.TextBox.Text = html;) works.

### Use Task.ConfigureAwait()

[Task.ConfigureAwait()](http://msdn.microsoft.com/en-us/library/system.threading.tasks.task.configureawait.aspx) is another interesting API provided by .NET:

-   When calling Task.ConfigureAwait(continueOnCapturedContext: true), the initial ExecutionContext and SynchronizationContext will both be captured for the continuation code, which is the default behavior explained above.
-   When calling Task.ConfigureAwait(continueOnCapturedContext: false), only the initial ExecutionContext is captured for the continuation code:, not the initial SynchronizationContext.

For example, in the above WPF application:

```csharp
this.Button.Click += async (sender, e) =>
{
    await Task.Run(() => { }).ConfigureAwait(false);
    this.TextBox.Text = string.Empty; // Will not work.
};
```

This continuation code will throw the same InvalidOperationException as above Task.ContinueWith() version:

> The calling thread cannot access this object because a different thread owns it.

## Conclusion

[At compile time](/posts/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern):

-   Complier decides an object is awaitable if
    -   It has a GetAwaiter() method (instance method or extension method);
    -   Its GetAwaiter() method returns an awaiter. Complier decides an object is an awaiter if:
        -   It implements INotifyCompletion or ICriticalNotifyCompletion interface;
        -   It has an IsCompleted poroperty, which has a getter and returns a Boolean;
        -   it has a GetResult() method, which returns void, or a result.

[During compilation](/posts/understanding-c-sharp-async-await-1-compilation):

-   The async decorator is gone
-   The await keyword is gone too. The entire async method body is compiled into a state machine with a MoveNext() method
-   This MoveNext() method can be called multiple times in a callback style, and each call can be scheduled to different thread in thread pool.

At runtime:

-   The await’s initial ExecutionContext is always captured, and its continuation code is marshaled to this captured ExecutionContext.
-   The await’s initial SynchronizationContext is captured by default, and its continuation code is marshaled to this captured SynchronizationContext, unless explicitly supressed like calling Task.ConfigureAwait(false).