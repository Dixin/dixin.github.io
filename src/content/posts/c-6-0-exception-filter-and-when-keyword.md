---
title: "C# 6.0 Exception Filter and when Keyword"
published: 2016-03-07
description: "C# 6.0 introduces a new feature exception filter and a new keyword when. , but exception filter/when keyword is not."
image: ""
tags: [".NET", "C#", "C# 6.0"]
category: ".NET"
draft: false
lang: ""
---

C# 6.0 introduces a new feature exception filter and a new keyword when. [Many C# features/keywords are syntactic sugars](/archive/?tag=C%23%20Features), but exception filter/when keyword is not.

To examine this feature, a few helper methods can be created:

```csharp
internal static partial class ExceptionFilter
{
    private static void A() => B();

    private static void B() => C();

    private static void C() => D();

    private static void D()
    {
        int localVariable1 = 1;
        int localVariable2 = 2;
        int localVariable3 = 3;
        int localVariable4 = 4;
        int localVariable5 = 5;
        throw new OperationCanceledException(nameof(ExceptionFilter));
    }

    private static bool Log(this object message, bool result = false)
    {
        Trace.WriteLine(message);
        return result;
    }
}
```

These methods can make up a call stack, with some local variables. The Log method can log a Exception object and return a specified bool value.

## Syntax

The when keyword works like if. A when condition is a predicate expression, which can be appended to a catch block. If the predicate expression is evaluated to be true, the associated catch block is executed; otherwise, the catch block is ignored.

```csharp
private static void Filter()
{
    try
    {
        A();
    }
    catch (OperationCanceledException exception) when (string.Equals(nameof(ExceptionFilter), exception.Message, StringComparison.Ordinal))
    {
    }
}
```

In the earlier preview of C# 6.0, the if keyword was used. In the final release, if is replaced by when, because some improper format can make catch-if confusing, e.g.:

```csharp
private static void Filter()
{
    try
    {
        A();
    }
    catch (OperationCanceledException exception) 
 // {
        if (string.Equals(nameof(ExceptionFilter), exception.Message, StringComparison.Ordinal))
        {
        }
 // }
}
```

The above code format looks just like a if statement inside the catch block.

Now it is already March 2016, the [MSDN document for C# exception filter](https://msdn.microsoft.com/en-us/library/0yd65esw.aspx) still uses the if keyword in the examples:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_2.png)

## Compilation

Before C# 6.0, it is very common to catch an exception, then log or filter it, and re-throw:

```csharp
private static void Catch()
{
    try
    {
        A();
    }
    catch (Exception exception)
    {
        exception.Log();
        throw;
    }
}
```

C# 6.0 provides a way to log or filter an exception before catching it:

```csharp
private static void When()
{
    try
    {
        A();
    }
    catch (Exception exception) when (exception.Log())
    {
    }
}
```

Here the Log method will log the exception, and return false. So the catch block will not be executed.

[ILSpy](https://github.com/icsharpcode/ILSpy) and ildasm (located in C:\\Program Files (x86)\\Microsoft SDKs\\Windows\\v10.0A\\bin\\NETFX 4.6.1 Tools\\) can be used to view the [compiled IL](https://en.wikipedia.org/wiki/List_of_CIL_instructions). In the Catch method, the catch-log-throw pattern will be compiled to:

```csharp
.method private hidebysig static void  Catch() cil managed
{
    .maxstack  2
    .locals init ([0] class [mscorlib]System.Exception exception)
    IL_0000:  nop
    .try
    {
        IL_0001:  nop
        IL_0002:  call       void Dixin.Console.Program::A()
        IL_0007:  nop
        IL_0008:  nop
        IL_0009:  leave.s    IL_0017
    }  // end .try
    catch [mscorlib]System.Exception 
    {
        IL_000b:  stloc.0
        IL_000c:  nop
        IL_000d:  ldloc.0
        IL_000e:  ldc.i4.0
        IL_000f:  call       bool Dixin.Console.Program::Log(object,
                                                            bool)
        IL_0014:  pop
        IL_0015:  rethrow
    }  // end handler
    IL_0017:  ret
} // end of method Program::Catch
```

There is nothing new or surprising. And When method is compiled to:

```csharp
.method private hidebysig static void  When() cil managed
{
    .maxstack  2
    .locals init ([0] class [mscorlib]System.Exception exception,
                [1] bool V_1)
    IL_0000:  nop
    .try
    {
        IL_0001:  nop
        IL_0002:  call       void Dixin.Console.Program::A()
        IL_0007:  nop
        IL_0008:  nop
        IL_0009:  leave.s    IL_002a

    }  // end .try
    filter
    {
        IL_000b:  isinst     [mscorlib]System.Exception
        IL_0010:  dup
        IL_0011:  brtrue.s   IL_0017

        IL_0013:  pop
        IL_0014:  ldc.i4.0
        IL_0015:  br.s       IL_0024

        IL_0017:  stloc.0
        IL_0018:  ldloc.0
        IL_0019:  ldc.i4.0
        IL_001a:  call       bool Dixin.Console.Program::Log(object,
                                                            bool)
        IL_001f:  stloc.1
        IL_0020:  ldloc.1
        IL_0021:  ldc.i4.0
        IL_0022:  cgt.un
        IL_0024:  endfilter
    }  // end filter
    {  // handler
        IL_0026:  pop
        IL_0027:  nop
        IL_0028:  rethrow
    }  // end handler
    IL_002a:  ret
} // end of method Program::When
```

The catch keyword is gone, and C# when condition is compiled to a IL filter block. In the filter block, it checks if the exception is of Exception type. If so, it calls the Log method. Apparently, exception filter is not syntactic sugar. It is a CLR feature.

## Runtime: stack unwinding

The catch block and when predicate refers to the same exception object. In the following example:

```csharp
internal static void Log()
{
    try
    {
        A();
    }
    catch (Exception exception) when (exception.Log(true))
    {
        exception.Log();
        throw;
    }
}
```

In the when predicate, the Log method returns true, so in the catch block, Log will be called again. These 2 Log calls print out exactly the same information:

> System.OperationCanceledException: ExceptionFilter at Dixin.Common.ExceptionFilter.D() in D:\\OneDrive\\Works\\Drafts\\CodeSnippets\\Dixin\\Common\\ExceptionFilter.cs:line 21 at Dixin.Common.ExceptionFilter.C() in D:\\OneDrive\\Works\\Drafts\\CodeSnippets\\Dixin\\Common\\ExceptionFilter.cs:line 12 at Dixin.Common.ExceptionFilter.B() in D:\\OneDrive\\Works\\Drafts\\CodeSnippets\\Dixin\\Common\\ExceptionFilter.cs:line 10 at Dixin.Common.ExceptionFilter.A() in D:\\OneDrive\\Works\\Drafts\\CodeSnippets\\Dixin\\Common\\ExceptionFilter.cs:line 8 at Dixin.Common.ExceptionFilter.Log() in D:\\OneDrive\\Works\\Drafts\\CodeSnippets\\Dixin\\Common\\ExceptionFilter.cs:line 91

Apparently, in both cases, the exception object’s StackTrace property has the call stack of A/B/C/D methods, as expected.

The real difference is the CLR stack (not the exception object’s StackTrace string property). To demonstrate this, set 2 breakpoints at 2 Log calls:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_thumb_5.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_12.png)

When the exception filter is executed:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_thumb_1.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_4.png)

The current stack (again, not the exception object’s StackTrace property) is:

> ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.Log() Line 93 \[Native to Managed Transition\] ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.D() Line 21 ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.C() Line 12 ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.B() Line 10 ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.A() Line 8 ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.Log() Line 91 ConsoleApplication2.exe!Dixin.Console.Program.Main() Line 110

Next, when the catch block is executed:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_thumb_2.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_6.png)

The current stack becomes:

> ConsoleApplication2.exe!Dixin.Common.ExceptionFilter.Log() Line 95 ConsoleApplication2.exe!Dixin.Console.Program.Main() Line 110

This magic here is called stack unwinding: exception filter does not unwind the stack, and catch block does unwind. When executing catch block, this catch block’s method becomes the top frame of the stack. As a result, all the methods called by current method are removed from the stack. In contrast, exception filter can be helpful for runtime debugging. For example, if above Catch method is executed:

```csharp
private static void Catch()
{
    try
    {
        A();
    }
    catch (Exception exception)
    {
        exception.Log();
        throw;
    }
}
```

at runtime the debugger breaks at the throw statement in the catch block:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_thumb_3.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_8.png)

The stack is unwound. As a result the debugger cannot see the exception is actually thrown by D.

When executing the other When method:

```csharp
private static void When()
{
    try
    {
        A();
    }
    catch (Exception exception) when (exception.Log())
    {
    }
}
```

The Log method always returns false, so that the stack will not be unwound by catch block. This time the debugger breaks in method D, where the exception is actually thrown:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_thumb_4.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/C-6.0-Exception-Filter_11DE8/image_10.png)

Notice in the Locals windows and Call Stack window, all information are available for debugger.

## Conclusion

C# 6.0 exception filter and when keyword is not a syntactic sugar. It is a CLR feature. Unlike catch block, exception filter does not unwind the call stack, which is helpful at runtime.