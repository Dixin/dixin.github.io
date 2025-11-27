---
title: "C# functional programming in-depth (5) Delegate: Function type, instance and group"
published: 2019-06-05
description: "C#’s delegate is an important feature to make function first class citizen just like object. C# is a strongly-typed language, where any value and any expression that evaluates to a value has a type. I"
image: ""
tags: [".NET", "C#", "C# 2.0", "LINQ", "LINQ via C#", "C# Features", "Functional Programming", "Functional C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

C#’s delegate is an important feature to make function first class citizen just like object. C# is a strongly-typed language, where any value and any expression that evaluates to a value has a type. In C#, a value can be an object, which has type represented by class; a value can also be a function, which has type represented by delegate type. Delegate type can be instantiated to represent a single function instance, or a group of functions.

## Delegate type as function type

C# supports delegate since the beginning to represent function. In many C# documents, the term “a delegate” could be confusing. It can refer to a delegate type, or an instance of some delegate type. So, this book always uses specific term “delegate type” or “delegate instance” when mentioning a delegate.

### Function type

Function’s type can be determined by its input types (0, 1, or more types in specific order) and an output type (void which can be represented by System.Void structure, or another type). This book uses notation input types –> output type for function type. For example, the simplest function type has no input and no output. In another word, it is parameterless, and it returns void. Such function type is denoted () –> void. In C#, a delegate type is defined like a method signature with the delegate keyword prepended:

// () -> void

internal delegate void FuncToVoid();

FuncToVoid can be viewed as an alias of function type () –> void. The following functions are all parameterless, and returning void:

namespace System.Diagnostics
```
{
```
```
public sealed class Trace
```
```
{
```
```
public static void Close();
```
```
public static void Flush();
```
```
public static void Indent();
```
```
}
```

}

These functions are all of function type () –> void; in another word, these functions are all of FuncToVoid type.

The following delegate type represents the string –> void function type, which accepts a string parameter, and returns void:

// string -> void

internal delegate void FuncStringToVoid(string @string);

The following functions are all of FuncStringToVoid type:

namespace System.Diagnostics
```
{
```
```
public sealed class Trace
```
```
{
```
```
public static void TraceInformation(string message);
```
```
public static void Write(string message);
```
```
public static void WriteLine(string message);
```
```
}
```

}

These functions’ parameter names are different from the delegate type definition. In C#/.NET, parameter names are ignored when the compiler identifies function types, only parameter types, their order, and return type matter.

The following delegate type represents the () –> int function type that is parameterless, and returns int:

// () -> int

internal delegate int FuncToInt32();

The following functions are all of FuncToInt32 type:

namespace System.Runtime.InteropServices
```
{
```
```
public static class Marshal
```
```
{
```
```
public static int GetExceptionCode();
```
```
public static int GetHRForLastWin32Error();
```
```
public static int GetLastWin32Error();
```
```
}
```

}

And the following delegate type represents the (string, int) –> int function type that accepts a string parameter, then an int parameter, and returns int:

// (string, int) -> int

internal delegate int FuncStringInt32ToInt32(string @string, int int32);

It is the type of the following functions (Again, the parameter names are ignored.):

namespace System.Globalization
```
{
```
```
public static class CharUnicodeInfo
```
```
{
```
```
public static int GetDecimalDigitValue(string s, int index);
```
```
public static int GetDigitValue(string s, int index);
```
```
}
```

}

The following delegate type represents the string –> bool function type that accepts a string parameter, and returns bool:

// string –> bool

internal delegate bool FuncStringToBoolean(string @string);

The following functions are all of FuncStringToBoolean type:

namespace System
```
{
```
```
[DefaultMember("Chars")]
```
```
public sealed class String : IEnumerable<char>, IEnumerable, IComparable, IComparable<String>, IConvertible, IEquatable<String>
```
```
{
```
```
public static bool IsNullOrEmpty(String value);
```
```
public static bool IsNullOrWhiteSpace(String value);
```
```
public bool Contains(String value);
```
```
public bool Equals(String value);
```
```
public bool StartsWith(String value);
```
```
public bool EndsWith(String value);
```
```
}
```

}

### Generic delegate type

Above FuncToInt32 represents the () –> int function type that is parameterless and return int. Similarly, for parameterless functions returning bool, string, or object result, the following delegate types can be defined:

// () -> bool
```
internal delegate bool FuncToBoolean();
```
```
// () -> string
```
```
internal delegate string FuncToString();
```
```
// () -> object
```

internal delegate object FuncToObject();

More similar function type definitions can go forever for functions parameterless with different output types. Since C# 2.0 introduces generics, these types can be represented with one single generic delegate type with a type parameter of any name, like TResult:

// () -> TResult

internal delegate TResult Func<TResult\>();

Similar to generic interface/class/structure/method syntax, here type parameter TResult is defined in angle brackets following type name, and it is used as the return type. It is just a placeholder to be specified with concrete type argument later. When TResult is int, Func<int> represents the () –> int function type, which is equivalent to FuncToInt32, and Func<bool> is equivalent to FuncToBoolean, Func<string> is equivalent to FuncToString, Func<object> is equivalent to FuncToObject, etc. All the parameterless function types with an output can be represented by Func<TResult>.

Here is another example of generic delegate type:

// (T1, T2) -> TResult

internal delegate TResult Func<T1, T2, TResult\>(T1 value1, T2 value2);

The above generic delegate type can represent any function type with 2 parameters and a return result. For example, Func<string, int, int> is equivalent to above FuncStringInt32ToInt32, so the above CharUnicodeInfo.GetDecimalDigitValue and CharUnicodeInfo.GetDigitalValue functions are of Func<string, int, int> type too. The following are more functions with 2 parameters and a return result:

namespace System
```
{
```
```
public static class Math
```
```
{
```
```
// (double, double) -> double
```
```
public static double Log(double a, double newBase);
```
```
// (int, int) -> int
```
```
public static int Max(int val1, int val2);
```
```
// (double, int) -> double
```
```
public static double Round(double value, int digits);
```
```
// (decimal, MidpointRounding) -> decimal
```
```
public static decimal Round(decimal d, MidpointRounding mode);
```
```
}
```

}

These functions’ types can be represented with Func<double, double, double>, Func<int, int, int>, Func<double, int, double> and Func<decimal, MidpointRounding, decimal>.

### Unified built-in delegate types

As fore mentioned, delegate types can be defined with duplicate, like Func<int> and FuncToInt32 are equivalent, Func<string, int, int> and FuncStringInt32ToInt32 are equivalent, etc. For example, since .NET Framework 2.0, the following delegate type is provided:

namespace System
```
{
```
```
// (T, T) -> int
```
```
public delegate int Comparison<in T>(T x, T y);
```

}

The following custom delegate types can be defined too:

// (T, T) -> int
```
internal delegate int NewComparison<in T>(T x, T y);
```
```
// (string, string) -> TResult
```
```
internal delegate TResult FuncStringString<TResult>(string value1, string value2);
```
```
// (T1, T2) -> int
```
```
internal delegate int FuncToInt32<T1, T2>(T1 value1, T2 value2);
```
```
// (string, string) -> int
```

internal delegate int FuncStringStringToInt32(string value1, string value2);

As a result, Func<string, string, int>, Comparison<string>, NewComparison<int>, FuncStringString<int>, FuncToInt32<string, string>, FuncStringStringToInt32 all represent (string, string) –> int function type. They are all equivalent.

Even .NET built-in delegate types can duplicate. For example, .NET Framework 2.0 also provides the following delegate types, which all represent object –> void function type, and are now in .NET Standard:

namespace System.Threading
```
{
```
```
// object -> void
```
```
public delegate void SendOrPostCallback(object state);
```
```
// object -> void
```
```
public delegate void ContextCallback(object state);
```
```
// object -> void
```
```
public delegate void ParameterizedThreadStart(object obj);
```
```
// object -> void
```
```
public delegate void WaitCallback(object state);
```
```
// object -> void
```
```
public delegate void TimerCallback(object state);
```

}

To avoid this kind of duplication, since .NET Framework 3.5, 2 series of built-in delegate types are provided to unify all the function types. The following generic Func delegate types can represent any function type with 0 ~ 16 parameters and a return result:

namespace System
```
{
```
```
// () -> TResult
```
```
public delegate TResult Func<out TResult>();
```
```
// T -> TResult
```
```
public delegate TResult Func<in T, out TResult>(T arg);
```
```
// (T1, T2) -> TResult
```
```
public delegate TResult Func<in T1, in T2, out TResult>(T1 arg1, T2 arg2);
```
```
// (T1, T2, T3) -> TResult
```
```
public delegate TResult Func<in T1, in T2, in T3, out TResult>(T1 arg1, T2 arg2, T3 arg3);
```
```
// (T1, T2, T3, T4) -> TResult
```
```
public delegate TResult Func<in T1, in T2, in T3, in T4, out TResult>(T1 arg1, T2 arg2, T3 arg3, T4 arg4);
```
```
// ...
```
```
// (T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16) -> TResult
```
```
public delegate TResult Func<in T1, in T2, in T3, in T4, in T5, in T6, in T7, in T8, in T9, in T10, in T11, in T12, in T13, in T14, in T15, in T16, out TResult>(T1 arg1, T2 arg2, T3 arg3, T4 arg4, T5 arg5, T6 arg6, T7 arg7, T8 arg8, T9 arg9, T10 arg10, T11 arg11, T12 arg12, T13 arg13, T14 arg14, T15 arg15, T16 arg16);
```

}

The in/out modifiers for the type parameter specifies that type parameter is variant, which are discussed in detail in the covariant and contravariant chapter. Unfortunately, above Func types cannot represent any function types returning void. Function type Func<void> or Func<System.Void> cannot be compiled, because C# complier does not allow generic’s type argument to be the void keyword or the System.Void type. So, the following generic Action delegate types are provided to represent all function types with 0 ~ 16 parameters, and no return result:

namespace System
```
{
```
```
// () -> void
```
```
public delegate void Action();
```
```
// T -> void
```
```
public delegate void Action<in T>(T obj);
```
```
// (T1, T2) -> void
```
```
public delegate void Action<in T1, in T2>(T1 arg1, T2 arg2);
```
```
// (T1, T2, T3) -> void
```
```
public delegate void Action<in T1, in T2, in T3>(T1 arg1, T2 arg2, T3 arg3);
```
```
// (T1, T2, T3, T4) -> void
```
```
public delegate void Action<in T1, in T2, in T3, in T4>(T1 arg1, T2 arg2, T3 arg3, T4 arg4);
```
```
// ...
```
```
// (T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16) -> void
```
```
public delegate void Action<in T1, in T2, in T3, in T4, in T5, in T6, in T7, in T8, in T9, in T10, in T11, in T12, in T13, in T14, in T15, in T16>(T1 arg1, T2 arg2, T3 arg3, T4 arg4, T5 arg5, T6 arg6, T7 arg7, T8 arg8, T9 arg9, T10 arg10, T11 arg11, T12 arg12, T13 arg13, T14 arg14, T15 arg15, T16 arg16);
```

}

For consistency, this book always uses the above Func and Action delegate types to represent function types.

## Delegate instance as function instance

Just like object can be instantiated from class, delegate instance can be instantiated from delegate type too. A delegate instance can represent a function, or a group of functions of the same function type.

To represent a single function, a delegate instance can be constructed by passing the specified function to constructor call syntax, which is similar to the syntax of constructing an object:

internal static void InstantiationWithConstructor()
```
{
```
```
Func<int, int, int> func = new Func<int, int, int>(Math.Max);
```
```
int result1 = func(1, 2);
```
```
result.WriteLine(); // 2
```

}

The constructor call syntax can be omitted:

internal static void Instantiation()
```
{
```
```
Func<int, int, int> func = Math.Max;
```
```
int result = func(1, 2);
```
```
result.WriteLine(); // 2
```

}

With this syntax, above paradigm looks functional. Func<int, int, int> is the function type, func variable is the function (instance), and func variable’s value is initialized with the Math.Max function. And naturally, function func can be called. When func is called, Math.Max executes and returns the result.

The above functional paradigm is actually implemented by wrapping imperative object-oriented programming. For each delegate type definition, C# compiler generates a class definition. For example, System.Func<T1, T2, TResult> delegate type is compiled to the following class derived from System.MulticastDelegate class:

public sealed class CompiledFunc<in T1, in T2, out TResult\> : MulticastDelegate
```
{
```
```
public CompiledFunc(object @object, IntPtr method);
```
```
public virtual TResult Invoke(T1 arg1, T2 arg2);
```
```
public virtual IAsyncResult BeginInvoke(T1 arg1, T2 arg2, AsyncCallback callback, object @object);
```
```
public virtual void EndInvoke(IAsyncResult result);
```

}

And MulticastDelegate derives System.Delegate class:

namespace System
```
{
```
```
public abstract class Delegate
```
```
{
```
```
public object Target { get; }
```
```
public MethodInfo Method { get; }
```
```
public static Delegate Combine(params Delegate[] delegates);
```
```
public static Delegate Combine(Delegate a, Delegate b);
```
```
public static Delegate Remove(Delegate source, Delegate value);
```
```
public static bool operator ==(Delegate d1, Delegate d2);
```
```
public static bool operator !=(Delegate d1, Delegate d2);
```
```
// Other members.
```
```
}
```
```
public abstract class MulticastDelegate : Delegate
```
```
{
```
```
public static bool operator ==(MulticastDelegate d1, MulticastDelegate d2);
```
```
public static bool operator !=(MulticastDelegate d1, MulticastDelegate d2);
```
```
}
```

}

The generated delegate class has an Invoke method, with the same signature as the delegate type itself. The above delegate instantiation code is a syntactic sugar compiled to normal object instantiation, and the function call is also a syntactic sugar compiled to above Invoke method call:

internal static void CompiledInstantiation()
```
{
```
```
CompiledFunc<int, int, int>func = new CompiledFunc<int, int, int>(null, Math.Max); // object is null for static method.
```
```
int result = func.Invoke(1, 2);
```
```
result.WriteLine(); // 2
```

}

The generated Invoke method can be useful along with null conditional operator to call a delegate instance if it is not null:

internal static void Invoke<T>(Action<T> action, T arg)
```
{
```
```
action?.Invoke(arg); // if (action != null) { action(arg); }
```

}

Each delegate instance inherits Target/Method properties, and ==/!= operators from Delegate and MulticastDelegate. The following example demonstrates these members work for delegate instance representing static method:

internal static void StaticMethod()
```
{
```
```
Func<int, int, int> func1 = Math.Max;
```
```
int result1 = func1(1, 2); // func1.Invoke(1, 2);;
```
```
(func1.Target is null).WriteLine(); // True
```
```
MethodInfo method1 = func1.Method;
```
```
$"{method1.DeclaringType}: {method1}".WriteLine(); // System.Math: Int32 Max(Int32, Int32)
```
```
Func<int, int, int> func2 = Math.Max;
```
```
object.ReferenceEquals(func1, func2).WriteLine(); // False
```
```
(func1 == func2).WriteLine(); // True
```

}

As fore mentioned, delegate instance func1 looks like a function and works like a function with syntactic sugar, but it is essentially an instance of a generated delegate class. It has an Invoke method accepting 2 int parameters and returning int. Its Target property returns the underlying object which has the represented method. When the underlying method is a static method, Target returns null. Its Method property returns a MethodInfo instance that represents the underlying method, Math.Max. Then delegate instance func2 is instantiated with the same static method, and apparently it is another different instance from func1, so object.ReferenceEquals returns false. However, func1 and func2 wraps the same underlying static method, and the == operator returns true.

In contrast, the following delegate instances represent instance methods:

internal static void InstanceMethod()
```
{
```
```
object instance1 = new object();
```
```
Func<object, bool> func1 = instance1.Equals;
```
```
object.ReferenceEquals(func1.Target, instance1).WriteLine(); // True
```
```
MethodInfo method2 = func1.Method;
```
```
$"{method2.DeclaringType}: {method2}".WriteLine(); // System.Object: Boolean Equals(System.Object)
```
```
object instance2 = new object();
```
```
Func<object, bool> func2 = instance2.Equals;
```
```
object.ReferenceEquals(func2.Target, instance2).WriteLine(); // True
```
```
object.ReferenceEquals(func1, func2).WriteLine(); // False
```
```
(func1 == func2).WriteLine(); // False
```
```
Func<object, bool> func3 = instance1.Equals;
```
```
object.ReferenceEquals(func1, func3).WriteLine(); // False
```
```
(func1 == func3).WriteLine(); // True
```

}

Here func1’s Target property returns instance1, which has the underlying instance method. When 2 delegate instance have the same underlying instance method from the same target, the == operator returns true.

The BeginInvoke and EndInvoke methods are provided for asynchrony:

internal static void TraceAllTextAsync(string path)
```
{
```
```
Func<string, string> func = File.ReadAllText;
```
```
func.BeginInvoke(path, TraceAllTextCallback, func);
```
```
}
```
```
internal static void TraceAllTextCallback(IAsyncResult asyncResult)
```
```
{
```
```
Func<string, string> func = (Func<string, string>)asyncResult.AsyncState;
```
```
string allText = func.EndInvoke(asyncResult);
```
```
allText.WriteLine();
```

}

C# asynchronous programming should follow the async/await pattern introduced in C# 5.0 instead of the above BeginInvoke/EndInvoke pattern. The async/await pattern is discussed in the asynchronous function chapter.

## Delegate instance as function group

Besides a single function, delegate instance can also represent a group of function of the same type. The following functions are all of () –> string type:

internal static string A() { return MethodBase.GetCurrentMethod().Name.WriteLine(); }
```
internal static string B() { return MethodBase.GetCurrentMethod().Name.WriteLine(); }
```
```
internal static string C() { return MethodBase.GetCurrentMethod().Name.WriteLine(); }
```

internal static string D() { return MethodBase.GetCurrentMethod().Name.WriteLine(); }

Functions can be combined to a group with + operator, and function can be removed from a group with - operator:

internal static void FunctionGroup()
```
{
```
```
Func<string> a = A;
```
```
Func<string> b = B;
```
```
Func<string> functionGroup1 = a + b;
```
```
functionGroup1 += C;
```
```
functionGroup1 += D;
```
```
string lastResult1 = functionGroup1(); // A B C D
```
```
lastResult1.WriteLine(); // D
```
```
Func<string> functionGroup2 = functionGroup1 - a;
```
```
functionGroup2 -= D;
```
```
string lastResult2 = functionGroup2(); // B C
```
```
lastResult2.WriteLine(); // C
```
```
Func<string> functionGroup3 = functionGroup1 - functionGroup2 + a + A;
```
```
string lastResult3 = functionGroup3(); // A D A A
```
```
lastResult3.WriteLine(); // A
```

}

Here functionGroup1 is combination of A + B + C + D. When functionGroup1 is called, the 4 internal functions are called one by one, and functionGroup1’s returns the last combined function’s result “D”. functionGroup2 is functionGroup1 – A – D, which is B + C, so functionGroup2’s return value is “C”. functionGroup3 is functionGroup1 – functionGroup2 + a + A, which is A + B + A + A, so its return result is “A”. Actually, + is compiled to Delegate.Combine call and – is compiled to Delegate.Remove call:

internal static void CompiledFunctionGroup()
```
{
```
```
Func<string> a = A;
```
```
Func<string> b = B;
```
```
Func<string> functionGroup1 = (Func<string>)Delegate.Combine(a, b); // = A + B
```
```
functionGroup1 = (Func<string>)Delegate.Combine(functionGroup1, new Func<string>(C)); // += C
```
```
functionGroup1 = (Func<string>)Delegate.Combine(functionGroup1, new Func<string>(D)); // += D
```
```
string lastResult1 = functionGroup1.Invoke(); // A B C D
```
```
lastResult1.WriteLine(); // D
```
```
Func<string> functionGroup2 = (Func<string>)Delegate.Remove(functionGroup1, a); // = functionGroup1 - A
```
```
functionGroup2 = (Func<string>)Delegate.Remove(functionGroup2, new Func<string>(D)); // -= D
```
```
string lastResult2 = functionGroup2.Invoke(); // B C
```
```
lastResult2.WriteLine(); // C
```
```
Func<string> functionGroup3 = (Func<string>)Delegate.Combine((Func<string>)Delegate.Combine((Func<string>)Delegate.Remove(functionGroup1, functionGroup2), a), new Func<string>(A)); // = functionGroup1 - functionGroup2 + a + A
```
```
string lastResult3 = functionGroup3(); // A D A A
```
```
lastResult3.WriteLine(); // A
```

}

C# language implements event with delegate instance as function. To keep it simple and consistent, this book always use delegate instance to represent single function in all non-event scenarios.

### Event and event handler

C# event implements the observer pattern of object-oriented programming. After learning how delegate instance as group works, it is very easy to understand event from a functional programming perspective – an event member is virtually a delegate instance as function group. The following Downloader type can download string from the specified URI, with a Completed event defined:

internal class DownloadEventArgs : EventArgs
```
{
```
```
internal DownloadEventArgs(string content) { this.Content = content; }
```
```
internal string Content { get; }
```
```
}
```
```
internal class Downloader
```
```
{
```
```
internal event EventHandler<DownloadEventArgs> Completed;
```

```csharp
private void OnCompleted(DownloadEventArgs args)
```
```
{
```
```
EventHandler<DownloadEventArgs> functionGroup = this.Completed;
```
```
functionGroup?.Invoke(this, args);
```
```
}
```
```
internal void Start(string uri)
```
```
{
```
```
using (WebClient webClient = new WebClient())
```
```
{
```
```
string content = webClient.DownloadString(uri);
```
```
this.OnCompleted(new DownloadEventArgs(content));
```
```
}
```
```
}
```

}

It has a Start method to start downloading. When the downloading is done, Start calls OnCompleted, and OnCompleted raises the Completed event member by calling the Completed event as if it is a delegate instance. The type of event member is EventHandler<TEventArgs> generic delegate type:

namespace System
```
{
```
```
// (object, TEventArgs) -> void
```
```
public delegate void EventHandler<TEventArgs>(object sender, TEventArgs e);
```

}

So EventHandler<DownloadEventArgs> represents (object, DownloadEventArgs) –> void function type, where the object argument is the Downloader instance which raises the event, and the DownloadEventArgs argument is the event data, which wraps the downloaded string. The Completed event’s handler must be function of the same (object, DownloadEventArgs) –> void type. The following are 2 examples:

// (object, DownloadEventArgs) -> void: EventHandler<DownloadEventArgs> or Action<object, DownloadEventArgs>
```
internal static void TraceContent(object sender, DownloadEventArgs args)
```
```
{
```
```
args.Content.WriteLine();
```
```
}
```
```
// (object, DownloadEventArgs) -> void: EventHandler<DownloadEventArgs> or Action<object, DownloadEventArgs>
```
```
internal static void SaveContent(object sender, DownloadEventArgs args)
```
```
{
```
```
File.WriteAllText(Path.GetTempFileName(), args.Content);
```

}

Now the += operator can be used to add an event handler function to the event function group, and –= operator can be used to remove the event handler function from the event function group:

internal static void Event()
```
{
```
```
Downloader downloader = new Downloader();
```
```
downloader.Completed += SaveContent;
```
```
downloader.Completed += TraceContent;
```
```
downloader.Completed -= SaveContent;
```
```
downloader.Start("https://weblogs.asp.net/dixin");
```

}

When the Start method is called, it downloads the string. Once the download is completed, it raises the Completed event, which is virtually calling a function group. So that the event handler function in the group is called. To be accurately understand this mechanism, the Completed event member of type (object, DownloadEventArgs) –> void is compiled to 3 members: a delegate instance field, an add\_Completed method, and a remove\_Completed method:

internal class CompiledDownloader
```
{
```
```csharp
private EventHandler<DownloadEventArgs> completedGroup;
```
```
internal void add_Completed(EventHandler<DownloadEventArgs> function)
```
```
{
```
```
EventHandler<DownloadEventArgs> oldGroup;
```
```
EventHandler<DownloadEventArgs> group = this.completedGroup;
```
```
do
```
```
{
```
```
oldGroup = group;
```
```
EventHandler<DownloadEventArgs> newGroup = (EventHandler<DownloadEventArgs>)Delegate.Combine(oldGroup, function);
```
```
group = Interlocked.CompareExchange(ref this.completedGroup, newGroup, oldGroup);
```
```
} while (group != oldGroup);
```
```
}
```
```
internal void remove_Completed(EventHandler<DownloadEventArgs> function)
```
```
{
```
```
EventHandler<DownloadEventArgs> oldGroup;
```
```
EventHandler<DownloadEventArgs> group = this.completedGroup;
```
```
do
```
```
{
```
```
oldGroup = group;
```
```
EventHandler<DownloadEventArgs> newGroup = (EventHandler<DownloadEventArgs>)Delegate.Remove(oldGroup, function);
```
```
group = Interlocked.CompareExchange(ref this.completedGroup, newGroup, oldGroup);
```
```
} while (group != oldGroup);
```
```
}
```

}

The generated delegate instance field is the function group to store the event handler functions. The add\_Completed and remove\_Completed methods adds and removes event handler functions by calling Delegate.Combine and Delegate.Remove, in a in a thread safe approach. It can be simplified by deleting the Interlocked method calls for thread safety, and representing the (object, DownloadEventArgs) –> void delegate type with the normal unified delegate type Action<object, DownloadEventArgs>. The following code shows the essentials after compilation:

internal class SimplifiedDownloader
```
{
```
```csharp
private Action<object, DownloadEventArgs> completedGroup;
```
```
internal void add_Completed(Action<object, DownloadEventArgs> function)
```
```
{
```
```
this.completedGroup += function;
```
```
}
```
```
internal void remove_Completed(Action<object, DownloadEventArgs> function)
```
```
{
```
```
this.completedGroup -= function;
```
```
}
```

```csharp
private void OnCompleted(DownloadEventArgs args)
```
```
{
```
```
Action<object, DownloadEventArgs> functionGroup = this.completedGroup;
```
```
functionGroup?.Invoke(this, args);
```
```
}
```
```
internal void Start(string uri)
```
```
{
```
```
using (WebClient webClient = new WebClient())
```
```
{
```
```
string content = webClient.DownloadString(uri);
```
```
this.OnCompleted(new DownloadEventArgs(content));
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
internal static void CompiledHandleEvent()
```
```
{
```
```
SimplifiedDownloader downloader = new SimplifiedDownloader();
```
```
downloader.add_Completed(SaveContent);
```
```
downloader.add_Completed(TraceContent);
```
```
downloader.remove_Completed(SaveContent);
```
```
downloader.Start("https://weblogs.asp.net/dixin");
```

}

So, the C# event/event handler model is quite straightforward from functional programming perspective. It is all about function type, function, and function group:

· An event is a member of class or structure, as a C#/.NET programming convention, it should be of function type (object, TEventArgs) –> void. If the event is an instance member of a class or structure, the object parameter is the instance of that class or structure which raises the event; if the event is static member, the object parameter should be null. The other TEventArgs parameter should derive from System.EventArgs class, and wraps the information of the event, like the downloaded content of a download complete event, the cursor’s position for a mouse click event, etc.

· As a convention, event member’s type is usually represented by EventHandler<TEventArgs> delegate type, which is equivalent to Action<object, TEventArgs>.

· Compiler generates 3 members for an event member: a field member, which is a delegate instance as function group to store event handler function, along with 2 helper method members to add/remove event handler function.

· An event’s event handler is a function of the same (object, TEventArgs) –> void type.

· To handle an event, use the += operator to add the event handler function to the event function group.

· To raise an event, just call the function group, as a result, all the event handler functions stored in the group are called to handle the event.

This compilation of event member is similar to an auto property member, which can be compiled to a backing field, a getter and a setter. Actually, C# has an event add/remove accessor syntax similar to property getter/setter:

internal class DownloaderWithEventAccessor
```
{
```
```
internal event EventHandler<DownloadEventArgs> Completed
```
```
{
```
```
add { this.Completed += value; }
```
```
remove { this.Completed -= value; }
```
```
}
```

}

The add/remove accessors are compiled to above add\_Event/remove\_Event helper methods.

## Summary

This chapter discusses delegate, an important functional feature of C#. Delegate type represents function type, and .NET Standard provides unified delegate types. Delegate type can be instantiated to represent a single function, or a function group. C#’s event is implemented by delegate instance as function group. Delegate is the foundation of C# functional programming to enable first class function.