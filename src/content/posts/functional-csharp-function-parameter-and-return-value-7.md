---
title: "C# functional programming in-depth (4) Function input and output"
published: 2018-06-04
description: "In C#, by default, arguments are passed to parameters by value. In the following example, the PassByValue function has a Uri parameter and a int type parameter. Uri is class so it is reference type, a"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-function-parameter-and-return-value](/posts/functional-csharp-function-parameter-and-return-value "https://weblogs.asp.net/dixin/functional-csharp-function-parameter-and-return-value")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

## Pass by value vs. pass by reference (ref parameter)

In C#, by default, arguments are passed to parameters by value. In the following example, the PassByValue function has a Uri parameter and a int type parameter. Uri is class so it is reference type, and int is structure so it is value type:

```csharp
internal static partial class Functions
{
    internal static void PassByValue(Uri reference, int value)
    {
        reference = new Uri("https://flickr.com/dixin");
        value = 10;
    }

    internal static void CallPassByValue()
    {
        Uri reference = new Uri("https://weblogs.asp.net/dixin");
        int value = 1;
        PassByValue(reference, value); // Copied.
        reference.WriteLine(); // https://weblogs.asp.net/dixin
        value.WriteLine(); // 1
    }
}
```

PassByValue is called with a reference type variable and a value type variable. With the default passing by value behavior, the reference and the value are both copied, then the copied reference and the copied value are passed to PassByValue. Inside PassByValue, it changes the reference and the value, but indeed it changes the copy of the outer variables. So after the execution of PassByValue, the outer variables passed to PassByValue remain unchanged.

Parameter with a ref modifier is passed by reference, which means passed directly without being copied:

```csharp
internal static void PassByReference(ref Uri reference, ref int value)
{
    reference = new Uri("https://flickr.com/dixin");
    value = 10;
}

internal static void CallPassByReference()
{
    Uri reference = new Uri("https://weblogs.asp.net/dixin");
    int value = 1;
    PassByReference(ref reference, ref value); // Not copied.
    reference.WriteLine(); // https://flickr.com/dixin
    value.WriteLine(); // 10
}
```

This time, when PassByReference is called, the reference type variable and value type variable are both directly passed without being copied. After calling PassByReference, the outer variables are also changed.

### Pass by read only reference (in parameter)

To prevent called function from modifying the argument passed by reference, in modifier can be used for the parameter since C# 7.2:

```csharp
internal static void PassByReadOnlyReference(in Uri reference, in int value)
{
    reference = new Uri("https://flickr.com/dixin"); // Cannot be compiled.
    value = 10; // Cannot be compiled.
}
```

Trying to modify the parameter passed by read only reference causes error at compile time.

## Output parameter (out parameter) and out variable

C# also supports output parameter, which has a out modifier. The output parameter is also passed by reference, just like ref parameter:

```csharp
internal static bool Output(out Uri reference, out int value)
{
    reference = new Uri("https://flickr.com/dixin");
    value = 10;
    return false;
}

internal static void CallOutput()
{
    Uri reference;
    int value;
    Output(out reference, out value); // Not copied.
    reference.WriteLine(); // https://flickr.com/dixin
    value.WriteLine(); // 10
}
```

The difference is, the ref parameter can be viewed as input of the function, so a variable must be initialized before passed to the ref parameter. The output parameter can be viewed as output of the function, so a variable is not required to be initialized before it is passed to the output parameter. Instead, output parameter must be initialized inside the function before returning.

C# 7.0 introduces a convenient syntactic sugar called out variable, so that a variable can be declared inline when it is passed to an output parameter:

```csharp
internal static void OutVariable()
{
    Output(out Uri reference, out int value);
    reference.WriteLine(); // https://flickr.com/dixin
    value.WriteLine(); // 10
}
```

The compilation of OutVariable is exactly the same as above CallOutput.

### Discard out variable

Since C# 7.0, if a out argument is not needed, it can be simply discarded with special character \_. This syntax works with local variable too.

```csharp
internal static void Discard()
{
    bool result = Output(out _, out _);
    _ = Output(out _, out _);
}
```

## Parameter array

Array parameter with params modifier is called parameter array:

```csharp
internal static int Sum(params int[] values)
{
    int sum = 0;
    foreach (int value in values)
    {
        sum += value;
    }
    return sum;
}
```

When calling above function, any number of arguments can be passed to its parameter array, and, of course, array can be passed to parameter array too:

```csharp
internal static void CallSum(int[] array)
{
    int sum1 = Sum();
    int sum2 = Sum(1);
    int sum3 = Sum(1, 2, 3, 4, 5);
    int sum4 = Sum(array);
}
```

The params modifier is compiled to System.ParamArrayAttribute:

```csharp
internal static int CompiledSum([ParamArray] int[] values)
{
    int sum = 0;
    foreach (int value in values)
    {
        sum += value;
    }
    return sum;
}
```

When passing argument list to parameter array, the argument list is compiled to array:

```csharp
internal static void CompiledCallSum(int[] array)
{
    int sum1 = Sum(Array.Empty<int>());
    int sum2 = Sum(new int[] { 1 });
    int sum3 = Sum(new int[] { 1, 2, 3, 4, 5 });
    int sum4 = Sum(array);
}
```

When function has multiple parameters, the parameter array must be the last:

```csharp
internal static void ParameterArray(bool required1, int required2, params string[] optional) { }
```

## Positional argument vs. named argument

By default, when calling a function, each argument must align with the parameter’s position. C# 4.0 introduces named argument, which enables specifying parameter name when passing an argument. Both positional argument and named argument can be used to call function:

```csharp
internal static void PositionalAndNamed()
{
    PassByValue(null, 0); // Positional arguments.
    PassByValue(reference: null, value: 0); // Named arguments.
    PassByValue(value: 0, reference: null); // Named arguments.
    PassByValue(null, value: 0); // Positional argument followed by named argument.
    PassByValue(reference: null, 0); // Named argument followed by positional argument.
}
```

When a function is called with positional arguments, the arguments must align with the parameters. When a function is called with named arguments, the named arguments can be in arbitrary order. And when using positional and named arguments together, before C# 7.2, positional arguments must be followed by named arguments. Since C# 7.2, when all arguments are in correct position, then named argument can precede positional argument. At compile time, all named arguments are compiled to positional arguments. The above PassByValue calls are compiled to:

```csharp
internal static void CompiledPositionalAndNamed()
{
    PassByValue(null, 1);
    PassByValue(null, 1);
    PassByValue(null, 1);
    PassByValue(null, 1);
    PassByValue(null, 1);
}
```

If the named arguments are evaluated inline with the function call, the order of evaluation is the same as their appearance:

```csharp
internal static void NamedEvaluation()
{
    PassByValue(reference: GetUri(), value: GetInt32()); // Call GetUri then GetInt32.
    PassByValue(value: GetInt32(), reference: GetUri()); // Call GetInt32 then GetUri.
}

internal static Uri GetUri() { return default; }

internal static int GetInt32() { return default; }
```

When the above PassByValue calls are compiled, local variable is generated to ensure the arguments are evaluated in the specified order:

```csharp
internal static void CompiledNamedArgument()
{
    PassByValue(GetUri(), GetInt32()); // Call GetUri then GetInt32.
    int value = GetInt32(); // Call GetInt32 then GetUri.
    PassByValue(GetUri(), value);
}
```

In practice, this syntax should be used with cautious because it can generate local variable, which can be slight performance hit. This tutorial uses named argument syntax frequently for readability:

```csharp
internal static void Named()
{
    UnicodeEncoding unicodeEncoding1 = new UnicodeEncoding(true, true, true);
    UnicodeEncoding unicodeEncoding2 = new UnicodeEncoding(
        bigEndian: true, byteOrderMark: true, throwOnInvalidBytes: true);
}
```

## Required parameter vs. optional parameter

By default, function parameters requires arguments. C# 4.0 also introduces optional parameter, with a default value specified:

```csharp
internal static void Optional(
    bool required1, char required2,
    int optional1 = int.MaxValue, string optional2 = "Default value.",
    Uri optional3 = null, Guid optional4 = new Guid(),
    Uri optional5 = default, Guid optional6 = default) { }
```

The default value for optional parameter must be compile time constant, or default value of the type (null for reference type, or default constructor call for value type, or default expression). If a function has both required parameters and optional parameters, the required parameters must be followed by optional parameters. Optional parameter is not a syntactic sugar. The above function is compiled as the following CIL:

```csharp
.method assembly hidebysig static 
    void Optional (
        bool required1,
        char required2,
        [opt] int32 optional1,
        [opt] string optional2,
        [opt] class [System]System.Uri optional3,
        [opt] valuetype [mscorlib]System.Guid optional4,
        [opt] class [System]System.Uri optional5,
        [opt] valuetype [mscorlib]System.Guid optional6
    ) cil managed 
{
    .param [3] = int32(2147483647) // optional1 = int.MaxValue
    .param [4] = "Default value." // optional2 = "Default value."
    .param [5] = nullref // optional3 = null
    .param [6] = nullref // optional4 = new Guid()
    .param [7] = nullref // optional5 = default
    .param [8] = nullref // optional6 = default

    .maxstack 8

    IL_0000: nop
    IL_0001: ret
}
```

And function with optional parameters can be called with the named argument syntax too:

```typescript
internal static void CallOptional()
{
    Optional(true, '@');
    Optional(true, '@', 1);
    Optional(true, '@', 1, string.Empty);
    Optional(true, '@', optional2: string.Empty);
    Optional(
        optional6: Guid.NewGuid(), optional3: GetUri(), required1: false, optional1: GetInt32(), 
        required2: Convert.ToChar(64)); // Call Guid.NewGuid, then GetUri, then GetInt32, then Convert.ToChar.
}
```

When calling function with optional parameter, if the argument is not provided, the specified default value is used. Also, local variables can be generated to ensure the argument evaluation order. The above Optional calls are compiled to:

```csharp
internal static void CompiledCallOptional()
{
    Optional(true, '@', 1, "Default value.", null, new Guid(), null, new Guid());
    Optional(true, '@', 1, "Default value.", null, new Guid(), null, new Guid());
    Optional(true, '@', 1, string.Empty, null, new Guid(), null, new Guid());
    Optional(true, '@', 1, string.Empty, null, new Guid(), null, new Guid());
    Guid optional6 = Guid.NewGuid(); // Call Guid.NewGuid, then GetUri, then GetInt32, then Convert.ToChar.
    Uri optional3 = GetUri();
    int optional1 = GetInt32();
    Optional(false, Convert.ToChar(64), optional1, "Default value.", optional3);
}
```

## Caller information parameter

C# 5.0 introduces caller information parameters. System.Runtime.CompilerServices.CallerMemberNameAttribute, System.Runtime.CompilerServices.CallerFilePathAttribute, System.Runtime.CompilerServices.CallerLineNumberAttribute can be used for optional parameters to obtain the caller function name, caller function file name, and line number:

```csharp
internal static void TraceWithCaller(
    string message,
    [CallerMemberName] string callerMemberName = null,
    [CallerFilePath] string callerFilePath = null,
    [CallerLineNumber] int callerLineNumber = 0)
{
    Trace.WriteLine($"[{callerMemberName}, {callerFilePath}, {callerLineNumber}]: {message}");
}
```

When calling function with caller information parameters, just omit those arguments:

```csharp
internal static void CallTraceWithCaller()
{
    TraceWithCaller("Message.");
    // [CallTraceWithCaller, /home/dixin/CodeSnippets/Tutorial.Shared/Functional/Parameters.cs, 242]: Message.
}
```

At compile time, the caller information arguments are generated. The above TraceWithCaller call is compiled to:

```csharp
internal static void CompiledCallTraceWithCaller()
{
    TraceWithCaller("Message.", "CompiledCallTraceWithCaller", @"/home/dixin/CodeSnippets/Tutorial.Shared/Functional/Parameters.cs", 242);
}
```

## Return by value vs. return by reference

By default, function return result by value. Similar to passing argument by value, returning by value means the returned reference or value is copied. The following functions retrieve the last item from the specified array:

```csharp
internal static int LastValue(int[] values)
{
    int length = values.Length;
    if (length > 0)
    {
        return values[length - 1];
    }
    throw new ArgumentException("Array is empty.", nameof(values));
}

internal static Uri LastReference(Uri[] references)
{
    int length = references.Length;
    if (length > 0)
    {
        return references[length - 1];
    }
    throw new ArgumentException("Array is empty.", nameof(references));
}
```

When they returns the last item to the caller, they return a copied of the reference or value. When the returned item is changed, the item in the array remain unchanged:

```csharp
internal static void ReturnByValue()
{
    int[] values = new int[] { 0, 1, 2, 3, 4 };
    int lastValue = LastValue(values); // Copied.
    lastValue = 10;
    Trace.WriteLine(values[values.Length - 1]); // 4

    Uri[] references = new Uri[] { new Uri("https://weblogs.asp.net/dixin") };
    Uri lastReference = LastReference(references); // Copied.
    lastReference = new Uri("https://flickr.com/dixin");
    Trace.WriteLine(references[references.Length - 1]); // https://weblogs.asp.net/dixin
}
```

C# 7.0 introduces returning by reference. Return result with a ref modifier is not copied:

```csharp
internal static ref int RefLastValue(int[] values)
{
    int length = values.Length;
    if (length > 0)
    {
        return ref values[length - 1];
    }
    throw new ArgumentException("Array is empty.", nameof(values));
}

internal static ref Uri RefLastReference(Uri[] references)
{
    int length = references.Length;
    if (length > 0)
    {
        return ref references[length - 1];
    }
    throw new ArgumentException("Array is empty.", nameof(references));
}
```

Function returning ref result can be called with the ref modifier. This time, when the returned item is changed, the item in the array is changed too:

```csharp
internal static void ReturnByReference()
{
    int[] values = new int[] { 0, 1, 2, 3, 4 };
    ref int lastValue = ref RefLastValue(values); // Not copied.
    lastValue = 10;
    Trace.WriteLine(values[values.Length - 1]); // 10

    Uri[] references = new Uri[] { new Uri("https://weblogs.asp.net/dixin") };
    ref Uri lastReference = ref RefLastReference(references); // Not copied.
    lastReference = new Uri("https://flickr.com/dixin");
    Trace.WriteLine(references[references.Length - 1]); // https://flickr.com/dixin
}
```

### Return by read only reference

To prevent caller from modifying the returned result by reference, ref can be used with the readonly modifier since C# 7.2:

```csharp
internal static ref readonly int RefReadOnlyLastValue(int[] values)
{
    int length = values.Length;
    if (length > 0)
    {
        return ref values[length - 1];
    }
    throw new ArgumentException("Array is empty.", nameof(values));
}

internal static ref readonly Uri RefReadOnlyLastReference(Uri[] references)
{
    int length = references.Length;
    if (length > 0)
    {
        return ref references[length - 1];
    }
    throw new ArgumentException("Array is empty.", nameof(references));
}
```

Now the returned result by reference becomes read only. Trying to modify it causes error at compile time:

```csharp
internal static void ReturnByRedOnlyReference()
{
    int[] values = new int[] { 0, 1, 2, 3, 4 };
    ref readonly int lastValue = ref RefReadOnlyLastValue(values); // Not copied.
    lastValue = 10; // Cannot be compiled.
    Trace.WriteLine(values[values.Length - 1]); // 10

    Uri[] references = new Uri[] { new Uri("https://weblogs.asp.net/dixin") };
    ref readonly Uri lastReference = ref RefReadOnlyLastReference(references); // Not copied.
    lastReference = new Uri("https://flickr.com/dixin"); // Cannot be compiled.
    Trace.WriteLine(references[references.Length - 1]); // https://flickr.com/dixin
}
```