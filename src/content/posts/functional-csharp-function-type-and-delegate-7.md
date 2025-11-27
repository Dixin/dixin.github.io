---
title: "C# functional programming in-depth (5) Delegate: Function type, instance and group"
published: 2018-06-05
description: "In C#, functions are represented by methods of types, and other function members of types. In C#, just like just objects have types, methods/functions have types too, which are represented by delegate"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-function-type-and-delegate](/posts/functional-csharp-function-type-and-delegate "https://weblogs.asp.net/dixin/functional-csharp-function-type-and-delegate")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

## Delegate type as function type

In C#, functions are represented by methods of types, and other function members of types. In C#, just like just objects have types, methods/functions have types too, which are represented by delegate type.

### Function type

This tutorial uses notation input parameter types –> output return type for function type. For example, the simplest function type is parameterless, and returning void. Such function type is denoted () –> void. In C#, a delegate type can defined like a method signature with the delegate keyword:

```csharp
// () -> void
internal delegate void FuncToVoid();
```

FuncToVoid can be viewed as an alias of function type () –> void. The following functions are all parameterless, and returning void:

```csharp
namespace System.Diagnostics
{
    public sealed class Trace
    {
        public static void Close();

        public static void Flush();

        public static void Indent();
    }
}
```

So these functions are all of function type () –> void; in another word, of FuncToVoid type.

The following delegate type represents the string –> void function type, which accepts a string parameter, and returns void:

```csharp
// string -> void
internal delegate void FuncStringToVoid(string @string);
```

The following functions are all of FuncStringToVoid type:

```csharp
namespace System.Diagnostics
{
    public sealed class Trace
    {
        public static void TraceInformation(string message);

        public static void Write(string message);

        public static void WriteLine(string message);
    }
}
```

These functions’ parameter names are different from the delegate type definition. In C#/.NET, parameter names are ignored when the compiler identifies function types, only parameter types, their order, and return type matter.

The following delegate type represents the () –> int function type that is parameterless, and returns int:

```csharp
// () -> int
internal delegate int FuncToInt32();
```

The following functions are all of FuncToInt32 type:

```csharp
namespace System.Runtime.InteropServices
{
    public static class Marshal
    {
        public static int GetExceptionCode();

        public static int GetHRForLastWin32Error();

        public static int GetLastWin32Error();
    }
}
```

And the following delegate type represents the (string, int) –> int function type that accepts a string parameter, then a int parameter, and returns int:

```csharp
// (string, int) -> int
internal delegate int FuncStringInt32ToInt32(string @string, int int32);
```

It is the type of the following functions (Again, the parameter names are ignored.):

```csharp
namespace System.Globalization
{
    public static class CharUnicodeInfo
    {
        public static int GetDecimalDigitValue(string s, int index);

        public static int GetDigitValue(string s, int index);
    }
}
```

The following delegate type represents the string –> bool function type that accepts a string parameter, and returns bool:

```csharp
// string –> bool
internal delegate bool FuncStringToBoolean(string @string);
```

The following functions are all of FuncStringToBoolean type:

```csharp
namespace System
{
    [DefaultMember("Chars")]
    public sealed class String : IEnumerable<char>, IEnumerable, IComparable, IComparable<String>, IConvertible, IEquatable<String>
    {
        public static bool IsNullOrEmpty(String value);

        public static bool IsNullOrWhiteSpace(String value);

        public bool Contains(String value);

        public bool Equals(String value);

        public bool StartsWith(String value);

        public bool EndsWith(String value);
    }
}
```

### Generic delegate type

Above FuncToInt32 represents the () –> int function type that is parameterless and return int. Similarly, for parameterless functions returning bool, string, or object, the following delegate types can be defined:

```csharp
// () -> bool
internal delegate bool FuncToBoolean();

// () -> string
internal delegate string FuncToString();

// () -> object
internal delegate object FuncToObject();
```

More similar definitions can go forever for different return types. Since C# 2.0. they can be replaced with one single generic delegate type. In the above series of delegate type defections, the return type varies, so the return type can be represented with a type parameter of any name, like TResult:

```csharp
// () -> TResult
internal delegate TResult Func<TResult>();
```

Similar to generic interface/class/structure, here type parameter TResult is also defined in angle brackets following type name, and it is used as the return type. It is just a placeholder to be specified with concrete type later. When TResult is int, Func<int> represents the () –> int function type, which is equivalent to FuncToInt32, and Func<bool> is equivalent to FuncToBoolean, and Func<string> is equivalent to FuncToString, Func<object> is equivalent to FuncToObject, etc. All the delegate types in this () –> TResult pattern can be represented by Func<TResult>.

Since Func<int> and FuncToInt32 are equivalent, The above Marshal.GetExceptionCode, Marshal.HRForLastWin32Error, Marsha.GetLastWin32Error functions are of Func<int> type too.

Here is another example:

```csharp
// (T1, T2) -> TResult
internal delegate TResult Func<T1, T2, TResult>(T1 value1, T2 value2);
```

The above generic delegate type can represent any function type that accepts 2 parameters and return a result. For example, Func<string, int, int> is equivalent to above FuncStringInt32ToInt32, so the above CharUnicodeInfo.GetDecimalDigitValue and CharUnicodeInfo.GetDigitalValue functions are of Func<string, int, int> type too. The following are more examples:

```csharp
namespace System
{
    public static class Math
    {
        // (double, double) -> double
        public static double Log(double a, double newBase);

        // (int, int) -> int
        public static int Max(int val1, int val2);

        // (double, int) -> double
        public static double Round(double value, int digits);

        // (decimal, MidpointRounding) -> decimal
        public static decimal Round(decimal d, MidpointRounding mode);
    }
}
```

These functions’ types: can be represented with Func<double, double, double>, Func<int, int, int>, Func<double, int, double> and Func<decimal, MidpointRounding, decimal>.

### Unified built-in delegate types

As fore mentioned, delegate types can be defined with duplicate, like Func<int> and FuncToInt32 are equivalent, Func<string, int, int> and FuncStringInt32ToInt32are equivalent, etc. Since .NET Framework 2.0, the following delegate type is provided:

```csharp
namespace System
{
    // (T, T) -> int
    public delegate int Comparison<in T>(T x, T y);
}
```

The following custom delegate types can be defined too:

```csharp
// (T, T) -> int
internal delegate int NewComparison<in T>(T x, T y);

// (string, string) -> TResult
internal delegate TResult FuncStringString<TResult>(string value1, string value2);

// (T1, T2) -> int
internal delegate int FuncToInt32<T1, T2>(T1 value1, T2 value2);

// (string, string) -> int
internal delegate int FuncStringStringToInt32(string value1, string value2);
```

As a result, Func<string, string, int>, Comparison<string>, NewComparison<int>, FuncStringString<int>, FuncToInt32<string, string>, FuncStringStringToInt32 all represent (string, string) –> int function type. They are all equivalent.

Even built-in delegate types can duplicate. For example, .NET Framework 2.0 also provides the following delegate types, which all represent object –> void function type:

```csharp
namespace System.Threading
{
    // object -> void
    public delegate void SendOrPostCallback(object state);

    // object -> void
    public delegate void ContextCallback(object state);

    // object -> void
    public delegate void ParameterizedThreadStart(object obj);

    // object -> void
    public delegate void WaitCallback(object state);

    // object -> void
    public delegate void TimerCallback(object state);
}
```

To avoid this kind of duplication, since .NET Framework 3.5, 2 series of built-in delegate types are provided to unify all the function types. The following generic Func delegate types can represent any function type that accepts 0 ~ 16 parameters, and returns a result:

```csharp
namespace System
{
    // () -> TResult
    public delegate TResult Func<out TResult>();

    // T -> TResult
    public delegate TResult Func<in T, out TResult>(T arg);

    // (T1, T2) -> TResult
    public delegate TResult Func<in T1, in T2, out TResult>(T1 arg1, T2 arg2);

    // (T1, T2, T3) -> TResult
    public delegate TResult Func<in T1, in T2, in T3, out TResult>(T1 arg1, T2 arg2, T3 arg3);

    // (T1, T2, T3, T4) -> TResult
    public delegate TResult Func<in T1, in T2, in T3, in T4, out TResult>(T1 arg1, T2 arg2, T3 arg3, T4 arg4);

    // ...

    // (T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16) -> TResult
    public delegate TResult Func<in T1, in T2, in T3, in T4, in T5, in T6, in T7, in T8, in T9, in T10, in T11, in T12, in T13, in T14, in T15, in T16, out TResult>(T1 arg1, T2 arg2, T3 arg3, T4 arg4, T5 arg5, T6 arg6, T7 arg7, T8 arg8, T9 arg9, T10 arg10, T11 arg11, T12 arg12, T13 arg13, T14 arg14, T15 arg15, T16 arg16);
}
```

The in/out modifiers for the type parameter specifies that type parameter is contravariant/covariant, which will be discussed in detail later. However, above Func types cannot represent any function types returning void. Function type Func<void> or Func<System.Void> cannot be compiled, because C# complier does not allow generic’s type argument to be the void keyword or the System.Void type. So following generic Action delegate types are provided to represent all function types that accept 0 ~ 16 parameters, and return void:

```csharp
namespace System
{
    // () -> void
    public delegate void Action();

    // T -> void
    public delegate void Action<in T>(T obj);

    // (T1, T2) -> void
    public delegate void Action<in T1, in T2>(T1 arg1, T2 arg2);

    // (T1, T2, T3) -> void
    public delegate void Action<in T1, in T2, in T3>(T1 arg1, T2 arg2, T3 arg3);

    // (T1, T2, T3, T4) -> void
    public delegate void Action<in T1, in T2, in T3, in T4>(T1 arg1, T2 arg2, T3 arg3, T4 arg4);

    // ...

    // (T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16) -> void
    public delegate void Action<in T1, in T2, in T3, in T4, in T5, in T6, in T7, in T8, in T9, in T10, in T11, in T12, in T13, in T14, in T15, in T16>(T1 arg1, T2 arg2, T3 arg3, T4 arg4, T5 arg5, T6 arg6, T7 arg7, T8 arg8, T9 arg9, T10 arg10, T11 arg11, T12 arg12, T13 arg13, T14 arg14, T15 arg15, T16 arg16);
}
```

For consistency, this tutorial always uses the above Func and Action delegate types to represent function types.

## Delegate instance as function instance

Just like object can be instantiated from class, delegate instance can be instantiated from delegate type too. A delegate instance can represent a function, or a group of functions of the same function type.

When delegate instance is used to represent a specified function, the instantiation syntax is similar to the constructor call when instantiating an object:

```csharp
internal static partial class Functions
{
    internal static void Constructor()
    {
        Func<int, int, int> func = new Func<int, int, int>(Math.Max);
        int result = func(1, 2);
        Trace.WriteLine(result); // 2
    }
}
```

The constructor call syntax can be omitted:

```csharp
internal static void Instantiate()
{
    Func<int, int, int> func = Math.Max;
    int result = func(1, 2);
    Trace.WriteLine(result); // 2
}
```

With this syntax, above paradigm looks functional. Func<int, int, int> is the function type, func variable is the function (instance), and func variable’s value is initialized with the Math.Max function. And naturally, function func can be called. When it is called, Math.Max executes and return the result.

### Delegate class and delegate instance

The above functional paradigm is actually implemented by wrapping imperative object-oriented programming. For each delegate type definition, C# compiler generates a class definition. For example, System.Func<T1, T2, TResult> delegate type is compiled to the following class:

```csharp
public sealed class CompiledFunc<in T1, in T2, out TResult> : MulticastDelegate
{
    public CompiledFunc(object @object, IntPtr method);

    public virtual TResult Invoke(T1 arg1, T2 arg2);

    public virtual IAsyncResult BeginInvoke(T1 arg1, T2 arg2, AsyncCallback callback, object @object);

    public virtual void EndInvoke(IAsyncResult result);
}
```

The generated class has a Invoke method, with the same signature as the delegate type itself. So above delegate instantiation code is a syntactic sugar compiled to normal object instantiation, and the function call is also a syntactic sugar compiled to above Invoke method call:

```csharp
internal static void CompiledInstantiate()
{
    CompiledFunc<int, int, int> func = new CompiledFunc<int, int, int>(null, Math.Max);
    int result = func.Invoke(1, 2);
    Trace.WriteLine(result); // 2
}
```

The generated Invoke method can be useful along with null conditional operator:

```csharp
internal static void Invoke(Action<int> action)
{
    action?.Invoke(0); // if (action != null) { action(0); }
}
```

The BeginInvoke and EndInvoke methods are for asynchronous programming:

```csharp
internal static void TraceAllTextAsync(string path)
{
    Func<string, string> func = File.ReadAllText;
    func.BeginInvoke(path, TraceAllTextCallback, func);
}

internal static void TraceAllTextCallback(IAsyncResult asyncResult)
{
    Func<string, string> func = (Func<string, string>)asyncResult.AsyncState;
    string text = func.EndInvoke(asyncResult);
    Trace.WriteLine(text);
}
```

C# 5.0 introduces the async and await keywords. Since then, C# asynchronous programming should follow the async/await pattern instead of using above BeginInvoke/EndInvoke pattern. The async/await asynchronous programming is discussed later in this chapter.

All delegate types are automatically derived from System.MulticastDelegate, and MulticastDelegate is derived from System.Delegate:

```csharp
namespace System
{
    public abstract class Delegate
    {
        public object Target { get; }

        public MethodInfo Method { get; }

        public static bool operator ==(Delegate d1, Delegate d2);

        public static bool operator !=(Delegate d1, Delegate d2);

        // Other members.
    }
}
```

So each delegate instance has Target/Method properties, and ==/!= operators. The following example demonstrates these members of delegate instance:

```csharp
internal static void Static()
{
    Func<int, int, int> func1 = Math.Max; // new Func<int, int, int>(Math.Max);
    int result1 = func1(1, 2); // func1.Invoke(1, 2);;
    Trace.WriteLine(func1.Target == null); // True
    MethodInfo method1 = func1.Method();
    Trace.WriteLine($"{method1.DeclaringType}: {method1}"); // System.Math: Int32 Max(Int32, Int32)

    Func<int, int, int> func2 = Math.Max; // new Func<int, int, int>(Math.Max);
    Trace.WriteLine(object.ReferenceEquals(func1, func2)); // False
    Trace.WriteLine(func1 == func2); // True
}
```

As fore mentioned, func1 looks like a function and works like a function, but it is essentially an instance of the generated class. It has an Invoke method accepting 2 int parameters and return int. Its Target property inherited from Delegate returns the underlying object which has this method. Since the underlying method is a static method, Target returns null. Its Method property returns the underlying method, Math.Max. Then delegate instance func2 is instantiated with the same static method, and apparently it is another different instance from func1. However, func1 and func2 have the same underlying static method, so the == operator returns true.

In contrast, take instance method object.Equals as example:

```csharp
internal static void Instance()
{
    object object1 = new object();
    Func<object, bool> func1 = object1.Equals; // new Func<object, bool>(object1.Equals);
    Trace.WriteLine(ReferenceEquals(func1.Target, object1)); // True
    MethodInfo method2 = func1.Method();
    Trace.WriteLine($"{method2.DeclaringType}: {method2}"); // System.Object: Boolean Equals(System.Object)

    object object2 = new object();
    Func<object, bool> func2 = object2.Equals; // new Func<object, bool>(object2.Equals);
    Trace.WriteLine(ReferenceEquals(func2.Target, object2)); // True
    Trace.WriteLine(object.ReferenceEquals(func1, func2)); // False
    Trace.WriteLine(func1 == func2); // False

    Func<object, bool> func3 = object1.Equals; // new Func<object, bool>(object1.Equals);
    Trace.WriteLine(object.ReferenceEquals(func1, func3)); // False
    Trace.WriteLine(func1 == func3); // True
}
```

Apparently, func1’s Target property returns object1, which has the underlying instance method. Only when 2 delegate instance have the same underlying instance method from the same target, the == operator returns true.

## Delegate instance as function group

Besides function, delegate instance can also represent function groups. The following methods are all of () –> string type:

```csharp
internal static string A()
{
    Trace.WriteLine(nameof(A));
    return nameof(A);
}

internal static string B()
{
    Trace.WriteLine(nameof(B));
    return nameof(B);
}

internal static string C()
{
    Trace.WriteLine(nameof(C));
    return nameof(C);
}

internal static string D()
{
    Trace.WriteLine(nameof(D));
    return nameof(D);
}
```

They can be combined/uncombined with the +/- operators:

```csharp
internal static void FunctionGroup()
{
    Func<string> a = A;
    Func<string> b = B;
    Func<string> functionGroup1 = a + b;
    functionGroup1 += C;
    functionGroup1 += D;
    string lastResult1 = functionGroup1(); // A(); B(); C(); D();
    Trace.WriteLine(lastResult1); // D

    Func<string> functionGroup2 = functionGroup1 - a;
    functionGroup2 -= D;
    string lastResult2 = functionGroup2(); // B(); C();
    Trace.WriteLine(lastResult2); // C

    Func<string> functionGroup3 = functionGroup1 - functionGroup2 + a;
    string lastResult3 = functionGroup3(); // A(); D(); A();
    Trace.WriteLine(lastResult3); // 8
}
```

Here functionGroup1 is combination of A + B + C + D. When functionGroup1 is called, the 4 internal functions are called one by one, so functionGroup1’s return value is the last function D’s return value “D”. functionGroup2 is functionGroup1 – A – D, which is B + C, so functionGroup2’s return value is “C”. functionGroup3 is functionGroup1 – functionGroup2 + A, which is A + B + A, so its return value is “A”. Actually, + is compiled to Delegate.Combine call and – is compiled to Delegate.Remove call:

```csharp
internal static void CompiledFunctionGroup()
{
    Func<string> a = A;
    Func<string> b = B;
    Func<string> functionGroup1 = (Func<string>)Delegate.Combine(a, b); // = A + B;
    functionGroup1 = (Func<string>)Delegate.Combine(functionGroup1, new Func<string>(C)); // += C;
    functionGroup1 = (Func<string>)Delegate.Combine(functionGroup1, new Func<string>(D)); // += D;
    string lastResult1 = functionGroup1.Invoke(); // A(); B(); C(); D();
    Trace.WriteLine(lastResult1); // D

    Func<string> functionGroup2 = (Func<string>)Delegate.Remove(functionGroup1, a); // = functionGroup1 - A;
    functionGroup2 = (Func<string>)Delegate.Remove(functionGroup2, new Func<string>(D)); //  -= D;
    string lastResult2 = functionGroup2.Invoke(); // B(); C();
    Trace.WriteLine(lastResult2); // C

    Func<string> functionGroup3 = (Func<string>)Delegate.Combine( // = functionGroup1 - functionGroup2 + A;
        (Func<string>)Delegate.Remove(functionGroup1, functionGroup2), a);
    string lastResult3 = functionGroup3(); // A(); D(); A();
    Trace.WriteLine(lastResult3); // A
}
```

C# language utilizes delegate instance as function group to implement event. To keep it simple and consistent, this tutorial always use delegate instance to represent single function in all non-event scenarios,.

### Event and event handler

C# event follows the observer pattern of object-oriented programming. After learning how delegate instance as group works, it is very easy to understand event from a functional programming perspective – a event is virtually a delegate instance as function group. The following Downloader type can download string from the specified URI, with a Completed event defined:

```csharp
internal class DownloadEventArgs : EventArgs
{
    internal DownloadEventArgs(string content)
    {
        this.Content = content;
    }

    internal string Content { get; }
}

internal class Downloader
{
    internal event EventHandler<DownloadEventArgs> Completed;

    private void OnCompleted(DownloadEventArgs args)
    {
        EventHandler<DownloadEventArgs> functionGroup = this.Completed;
        functionGroup?.Invoke(this, args);
    }

    internal void Start(string uri)
    {
        using (WebClient webClient = new WebClient())
        {
            string content = webClient.DownloadString(uri);
            this.OnCompleted(new DownloadEventArgs(content));
        }
    }
}
```

It has a Start method to start downloading. When the downloading is done, Start calls OnCompleted, and OnCompleted raises the Completed event by calling the Completed event as if it is a delegate instance. The type of event is EventHandler<TEventArgs> generic delegate type:

```csharp
namespace System
{
    // (object, TEventArgs) -> void
    public delegate void EventHandler<TEventArgs>(object sender, TEventArgs e);
}
```

So EventHandler<DownloadEventArgs> represents (object, DownloadEventArgs) –> void function type, where the object argument is the Downloader instance which raises the event, and the DownloadEventArgs argument is the event info, the downloaded string. The Completed event’s handler must be function of the same (object, DownloadEventArgs) –> void type. The following are 2 examples:

```csharp
// EventHandler<DownloadEventArgs>: (object, DownloadEventArgs) -> void
internal static void TraceContent(object sender, DownloadEventArgs args)
{
    Trace.WriteLine(args.Content);
}

// EventHandler<DownloadEventArgs>: (object, DownloadEventArgs) -> void
internal static void SaveContent(object sender, DownloadEventArgs args)
{
    File.WriteAllText(Path.GetTempFileName(), args.Content);
}
```

Now the += operator can be used to add a event handler function to the event function group, and –= operator can be used to remove the event handler function from the event function group:

```csharp
internal static void HandleEvent()
{
    Downloader downloader = new Downloader();
    downloader.Completed += TraceContent;
    downloader.Completed += SaveContent;
    downloader.Start("https://weblogs.asp.net/dixin");
}
```

when the Start method is called, it downloads the string. When done, it raises the Completed event, which is virtually calling a function group. So that the 2 event handler functions in the group are called. To be accurately understand this mechanism, the Completed event member of type (object, EventArgs) –> void is compiled into 3 members: a delegate instance field of the same type, a add\_Completed method, and a remove\_Completed method:

```csharp
internal class CompiledDownloader
{
    private EventHandler<DownloadEventArgs> completedGroup;

    internal void add_Completed(EventHandler<DownloadEventArgs> function)
    {
        EventHandler<DownloadEventArgs> oldGroup;
        EventHandler<DownloadEventArgs> group = this.completedGroup;
        do
        {
            oldGroup = group;
            EventHandler<DownloadEventArgs> newGroup = (EventHandler<DownloadEventArgs>)Delegate.Combine(oldGroup, function);
            group = Interlocked.CompareExchange(ref this.completedGroup, newGroup, oldGroup);
        } while (group != oldGroup);
    }

    internal void remove_Completed(EventHandler<DownloadEventArgs> function)
    {
        EventHandler<DownloadEventArgs> oldGroup;
        EventHandler<DownloadEventArgs> group = this.completedGroup;
        do
        {
            oldGroup = group;
            EventHandler<DownloadEventArgs> newGroup = (EventHandler<DownloadEventArgs>)Delegate.Remove(oldGroup, function);
            group = Interlocked.CompareExchange(ref this.completedGroup, newGroup, oldGroup);
        } while (group != oldGroup);
    }
}
```

The generated delegate instance field is the function group to store the event handler functions. The add\_Completed and remove\_Completed methods adds and removes event handler functions by calling Delegate.Combine and Delegate.Remove, in a in a thread safe approach. It can be simplified by deleting the Interlocked method calls for thread safety, and representing the (object, DownloadEventArgs) –> void delegate type with the normal unified Action<object, DownloadEventArgs>. The following code shows the the essentials after compilation:

```csharp
internal class SimplifiedDownloader
{
    private Action<object, DownloadEventArgs> completedGroup;

    internal void add_Completed(Action<object, DownloadEventArgs> function)
    {
        this.completedGroup += function;
    }

    internal void remove_Completed(Action<object, DownloadEventArgs> function)
    {
        this.completedGroup -= function;
    }

    private void OnCompleted(DownloadEventArgs args)
    {
        Action<object, DownloadEventArgs> functionGroup = this.completedGroup;
        functionGroup?.Invoke(this, args);
    }

    internal void Start(string uri)
    {
        using (WebClient webClient = new WebClient())
        {
            string content = webClient.DownloadString(uri);
            this.OnCompleted(new DownloadEventArgs(content));
        }
    }
}

internal static void CompiledHandleEvent()
{
    SimplifiedDownloader downloader = new SimplifiedDownloader();
    downloader.add_Completed(TraceContent);
    downloader.add_Completed(SaveContent);
    downloader.Start("https://weblogs.asp.net/dixin");
}
```

So the C# event/event handler model is quite straight forward from functional programming perspective. It is all about function type, function group, and function:

-   A event is a member of class or structure, as a C#/.NET programming convention, it should be of function type (object, TEventArgs) –> void. If the event is a instance member of a class or structure, the object parameter is the instance of that class or structure which raises the event; if the event is static member, the object parameter should be null. The other TEventArgs parameter should derive from System.EventArgs class, and wraps the information of the event, like the downloaded content of a download complete event, the cursor’s position for a mouse click event, etc..
-   As a convention, event member’s type is usually represented by EventHandler<TEventArgs> delegate type, which is equivalent to Action<object, TEventArgs>.
-   Compiler generates 3 members for a event member: a field member, which is a delegate instance as function group to store event handler function, along with 2 helper method members to add/remove event handler function.
-   A event’s event handler is a function of the same (object, TEventArgs) –> void type.
-   To handle a event, use the += operator to add the event handler function to the event function group.
-   To raise a event, just call the function group, as a result, all the event handler functions stored in the group are called to handle the event.

This compilation of event member is similar to a auto property member, which can be compiled to a backing field, a getter and a setter. Actually C# has a event add/remove accessor syntax similar to property getter/setter:

```csharp
internal class DownloaderWithEventAccessor
{
    internal event EventHandler<DownloadEventArgs> Completed
    {
        add { this.Completed += value; }
        remove { this.Completed -= value; }
    }
}
```

The add/remove accessors are compiled to above add/remove helper methods.