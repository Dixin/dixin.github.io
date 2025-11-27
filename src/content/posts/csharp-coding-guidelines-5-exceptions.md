---
title: "C# Coding Guidelines (5) Exceptions"
published: 2009-10-11
description: "C# Coding Guidelines:"
image: ""
tags: [".NET", "C#", "Coding Guidelines"]
category: ".NET"
draft: false
lang: ""
---

C# Coding Guidelines:

-   [C# Coding Guidelines (1) Fundamentals](/posts/csharp-coding-guidelines-1-fundamentals)
-   [C# Coding Guidelines (2) Naming](/posts/csharp-coding-guidelines-2-naming)
-   [C# Coding Guidelines (3) Members](/posts/csharp-coding-guidelines-3-members)
-   [C# Coding Guidelines (4) Types](/posts/csharp-coding-guidelines-4-types)
-   C# Coding Guidelines (5) Exceptions
-   [C# Coding Guidelines (6) Documentation](/posts/csharp-coding-guidelines-6-documentation)
-   [C# Coding Guidelines (7) Tools](/posts/csharp-coding-guidelines-7-tools)

Here is a true story. Once a developer wrote a bunch of code, which crashed frequently:
```
Action1();
Action2();
// ...
ActionN();
```
[](http://11011.net/software/vspaste)

So he was asked to fix the code, and his solution is:
```
try
{
    Action1();
    Action2();
    // ...
    ActionN();
}
catch
{
    // Fails silently.
}
```

Other developers became crazy when they saw this “Fails silently.” comment during debugging.

## Throw exceptions

**✔** Throw an exception if something goes unexpectedly, so that the code will not continue executing in a corrupted or unpredictable status, and report this to the upper code in the call stack.

An exception is not equal to an error. An exception is thrown means something unexpected happens. For example, there a correct function executing. But if the memory is exhausted, an OutOfMemoryException will be thrown. This memory-exhausted situation is something unexpected by the code.

A very frequently asked question is, “When we cannot find something, should we return null or throw an exception?”. According to this rule, it is clear that logically exception has nothing to do with the return value. Once something goes unexpectedly, throw an exception to stop executing, and report to the upper code in the call stack.

A typical usage of the exception is the parameter checking. Just as [part 3](/posts/csharp-coding-guidelines-3-members) mentioned, when writing public methods, the first thing is to check the parameters. If the parameters are unexpected, throw an exception:

-   System.ArgumentException,
-   System.ArgumentNullException,
-   System.ArgumentOutOfRangeException

etc.
```
public void GetTaxonomy(Uri uri)
{
    if (uri == null)
    {
        // The null URI is unexpected.
        throw new ArgumentNullException("uri", message);
    }

    // Works with the URI.
}
```

After an exception is thrown, the thread is suspended, and the upper code in the call stack has got a chance to handle it. If no code is going to handling that exception, the program is terminated. Just like [Jeffrey Richter](http://www.wintellect.com/cs/blogs/jeffreyr/default.aspx) said,

> It is much better for a program to crash than to continue running with unpredictable behavior and potential security vulnerabilities.

**✔** Consistently use exceptions instead of return value based reporting.

One simple reason is, in some scenarios it is impossible to report with the return value, like in the constructor. For the consistency consideration, exception should always be used.

If something fails, It could bring a lot of issues if the code continue running. The choice is throw an exception and stop right away.

But in FCL, there are some return value based reporting, like

```csharp
namespace System.Web.Security
{
    public abstract class MembershipProvider : ProviderBase
    {
        public abstract MembershipUser CreateUser(
            string username,
            string password,
            string email,
            string passwordQuestion,
            string passwordAnswer,
            bool isApproved,
            object providerUserKey,
            out MembershipCreateStatus status);
    }
}
```
[](http://11011.net/software/vspaste)

It outputs a MembershipCreateStatus enum to report the status:

```csharp
namespace System.Web.Security
{
    public enum MembershipCreateStatus
    {
        Success,
        InvalidUserName,
        InvalidPassword,
        InvalidQuestion,
        InvalidAnswer,
        InvalidEmail,
        DuplicateUserName,
        DuplicateEmail,
        UserRejected,
        InvalidProviderUserKey,
        DuplicateProviderUserKey,
        ProviderError
    }
}
```

**✔** In a fatal situation, call Environment.FailFast() to terminate the process instead of throwing an exception.

**✘** Do not throw nonspecific exceptions:

-   System.Exception
-   System.SystemException
-   System.ApplicationException

**✘** Do not throw CLR exceptions.

These are explicitly enumerated by [Framework Design Guidelines](http://www.amazon.com/Framework-Design-Guidelines-Conventions-Libraries/dp/0321545613/ref=dp_ob_title_bk):

-   System.AccessViolationException
-   System.ExecutionEngineException
-   System.IndexOutOfRangeException
-   System.NullReferenceException
-   System.OutOfMemoryException
-   System.StackOverflowException
-   System.Runtime.InteropServices.COMException
-   System.Runtime.InteropServices.SEHException

etc.

## Handle exceptions

**✔** Consider catching an exception when knowing about how to recover from that exception.

**✘** Avoid catching a nonspecific exception, and swallowing it.

These code are unprofessional:
```
try
{
    Action1();
    Action2();
    // ...
    ActionN();
}
catch
{
    // Fails silently.
}
```

Or:
```
try
{
    Action1();
    Action2();
    // ...
    ActionN();
}
catch (Exception)
{
}
```
[](http://11011.net/software/vspaste)Or:
```
try
{
    Action1();
    Action2();
    // ...
    ActionN();
}
catch (Exception exception)
{
}
```

But it is Ok if catching a nonspecific exception, then do something (like logging, etc.) and re-throw it.

**✔** Catch exception for specific execution.

Do not lazily put a big bunch of code into a try block. It is necessary to figure out where exactly the exceptions are throw, and how to exactly recover from those exceptions:
```
Action1();

try
{
    Action2();
}
catch (FileNotFoundException exception)
{
    // Recover.
}
catch (InvalidOperationException exception)
{
    // Recover.
}

Action3();
```

**✘** Do not catch and swallow CLR exceptions.

Actually, even if code is written to catch some CLR critical exception, usually it will not work. A typical sample is StackOverflowException thrown by CLR. Once stack overflow happens, program will be terminated. the code in the catch block and finally block will never execute.

Take a look at the following Fibonacci function:

```csharp
private static long Fibonacci(int value)
{
    if (value < 0)
    {
        throw new ArgumentOutOfRangeException("value");
    }

    if (value == 0)
    {
        return 0;
    }

    if (value == 1)
    {
        return 1;
    }

    return Fibonacci(value - 1) + Fibonacci(value - 2);
}
```
[](http://11011.net/software/vspaste)

The above function is very ineffective with a recursive computing. Write some experimental stack overflow code:

```csharp
internal class Program
{
    private static void Main()
    {
        long result = 0;
        try
        {
            result = Fibonacci(int.MaxValue);
        }
        catch (StackOverflowException)
        {
            // Never execute.
            Console.WriteLine("Inside catch.");
        }
        finally
        {
            // Never execute.
            Console.WriteLine("Inside finally.");
        }

        // Never execute.
        Console.WriteLine(result);
    }
}
```
[](http://11011.net/software/vspaste)

The above code demonstrates writing code to catch CLR exceptions like StackOverflowException is useless.

## Effectively work with exceptions

**✔** Reuse FCL exception when possible, create a new exception when needed.

In 80%+ of the scenarios, creating a customized exception type is not needed.

**✔** Consider using exception helper for uniformed exception handling in the application.
```
internal static class ExceptionHelper
{
    internal static void ThrowInvalidOperationException(parameters)
    {
        // Build message.
        // Write log.
        throw new InvalidOperationException(message);
    }
}
```

[](http://11011.net/software/vspaste)This is very useful for [DRY](http://en.wikipedia.org/wiki/Don't_repeat_yourself) and standardization consideration. Another example is the [Exception Handling Application Block](http://msdn.microsoft.com/en-us/library/dd203116.aspx) of Microsoft [Enterprise Library](http://msdn.microsoft.com/en-us/library/cc467894.aspx):
```
try
{
    // ...
}
catch (Exception exception)
{
    if (ExceptionPolicy.HandleException(exception, "PolicyName"))
    {
        throw;
    }

    // ...
}
```
[](http://11011.net/software/vspaste)

**✔** Consider Trier-Doer Pattern for the API which frequently throw exceptions.

```csharp
namespace System
{
    public struct Int32
    {
        public static int Parse(string s)
        {
        }

        public static bool TryParse(string s, out int result)
        {
        }
    }
}
```
[](http://11011.net/software/vspaste)

When there a Do() method which frequently throw exceptions, provide a TryDo() method which is not likely to throw exceptions but using a bool to indicate the success.

By the way, the above parameter name “s” does not make sense. “value” should be better. See [part 2](/posts/csharp-coding-guidelines-2-naming) for naming.