---
title: "C# functional programming in-depth (4) Function input and output"
published: 2019-06-04
description: "The previous 2 chapters discuss all the named functions in C#. This chapter looks into the input and output features of C# function."
image: ""
tags: [".NET", "C#", "C# 4.0", "C# 5.0", "C# 7.0", "C# Features", "Functional C#", "Functional Programming", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

The previous 2 chapters discuss all the named functions in C#. This chapter looks into the input and output features of C# function.

## Input by copy vs. input by alias (ref parameter)

In C#, by default, arguments are passed to parameters by making a copy (also called passing by value). In the following example, the InputByCopy function has a Uri parameter and an int parameter. System.Uri is class so it is reference type, and int (System.Int32) is structure so it is value type:

internal static void InputByCopy(Uri reference, int value)

```csharp
{
```
```csharp
reference = new Uri("https://flickr.com/dixin");
```
```csharp
value = 10;
```
```csharp
}
```

```csharp
internal static void CallInputByCopy()
```
```csharp
{
```
```csharp
Uri reference = new Uri("https://weblogs.asp.net/dixin");
```
```csharp
int value = 1;
```
```csharp
InputByCopy(reference, value); // Copied.
```
```csharp
reference.WriteLine(); // https://weblogs.asp.net/dixin
```
```csharp
value.WriteLine(); // 1
```

}

Here a reference type variable and a value type variable are initialized and passed to InputByCopy as arguments. With the default behaviour, the reference and the value are both copied. Similar to local variable discussed in the C# language basics chapter, for reference type, another reference is created to point to the same instance, while for value type, another instance is allocated with copied data. Then the copied reference and value are passed into InputByCopy function, and mutated by the function. So, the original variables are not impacted.

Similar to ref local variable, parameter with a ref modifier means input by alias without copying (also called passing by reference):

internal static void InputByAlias(ref Uri reference, ref int value)

```csharp
{
```
```csharp
reference = new Uri("https://flickr.com/dixin");
```
```csharp
value = 10;
```
```csharp
}
```

```csharp
internal static void CallInputByAlias()
```
```csharp
{
```
```csharp
Uri reference = new Uri("https://weblogs.asp.net/dixin");
```
```csharp
int value = 1;
```
```csharp
InputByAlias(ref reference, ref value); // Not copied.
```
```csharp
reference.WriteLine(); // https://flickr.com/dixin
```
```csharp
value.WriteLine(); // 10
```

}

This time, a reference type variable and a value type variable are initialized and passed to InputByAlias. InputByAlias’s arguments are just aliases of the original variables. When InputByAlias is called to mutate the aliases, the original variables are mutated as well.

### Input by immutable alias (in parameter)

To prevent function from mutating the input by alias, in modifier can be used for the parameter since C# 7.2:

internal static void InputByImmutableAlias(in Uri reference, in int value)

```csharp
{
```
```csharp
reference = new Uri("https://flickr.com/dixin"); // Cannot be compiled.
```
```csharp
value = 10; // Cannot be compiled.
```

}

The in modifier for parameter is similar to the ref readonly modifiers for the local variable. Similarly, inside the function, trying to mutate the immutable alias causes compile time error.

## Output parameter (out parameter) and out variable

C# also supports output parameter, which has a out modifier. The output parameter is also input by alias just like ref parameter:

internal static bool OutputParameter(out Uri reference, out int value)

```csharp
{
```
```csharp
reference = new Uri("https://flickr.com/dixin");
```
```csharp
value = 10;
```
```csharp
return false;
```
```csharp
}
```

```csharp
internal static void CallOutputParameter()
```
```csharp
{
```
```csharp
Uri reference;
```
```csharp
int value;
```
```csharp
OutputParameter(out reference, out value); // Not copied.
```
```csharp
reference.WriteLine(); // https://flickr.com/dixin
```
```csharp
value.WriteLine(); // 10
```

}

The difference is, the ref parameter is input of the function, so a variable must be initialized before passed to the ref parameter. The out parameter can be viewed as output of the function, so a variable is not required to be initialized before being passed to the out parameter. Instead, out parameter must be initialized inside the function.

C# 7.0 introduces a convenient syntactic sugar called out variable, so that a variable can be declared inline without initialization when it is passed to an out parameter. The above example can be simplified as:

internal static void OutVariable()

```csharp
{
```
```csharp
OutputParameter(out Uri reference, out int value); // Not copied.
```
```csharp
reference.WriteLine(); // https://flickr.com/dixin
```
```csharp
value.WriteLine(); // 10
```

}

The out variable declaration is compiled to normal variable declaration

### Discard out variable

Since C# 7.0, if a out argument is not needed, it can be simply discarded with special character \_. This syntax works with local variable too.

internal static void Discard()

```csharp
{
```
```csharp
bool result = OutputParameter(out _, out _);
```
```csharp
OutputParameter(out _, out _);
```
```csharp
_ = OutputParameter(out _, out _);
```

}

## Parameter array

Array parameter with params modifier is called parameter array:

internal static int Sum(params int\[\] values)

```csharp
// Compiled to: Sum([ParamArray] int[] values)
```
```csharp
{
```
```csharp
int sum = 0;
```
```csharp
foreach (int value in values)
```
```csharp
{
```
```csharp
sum += value;
```
```csharp
}
```
```csharp
return sum;
```

}

The params modifier is compiled to System.ParamArrayAttribute. When calling above function, any number of arguments can be passed to its parameter array, and, of course, array can be passed to parameter array too:

internal static void CallSum()

```csharp
{
```
```csharp
int sum1 = Sum();
```
```csharp
int sum2 = Sum(0);
```
```csharp
int sum3 = Sum(0, 1, 2, 3, 4);
```
```csharp
int sum4 = Sum(new[] { 0, 1, 2, 3, 4 });
```

}

When passing argument list to parameter array, the argument list is always compiled to non-null array:

internal static void CompiledCallSum()

```csharp
{
```
```csharp
int sum1 = Sum(Array.Empty<int>());
```
```csharp
int sum2 = Sum(new int[] { 0 });
```
```csharp
int sum3 = Sum(new int[] { 0, 1, 2, 3, 4 });
```
```csharp
int sum4 = Sum(new int[] { 0, 1, 2, 3, 4 });
```

}

When function has multiple parameters, the parameter array must be the last:

internal static void MultipleParameters(bool required1, int required2, params string\[\] optional) { }

## Positional argument vs. named argument

By default, when calling a function, each argument must align with the parameter’s position. C# 4.0 introduces named argument, which enables specifying parameter name when passing an argument. Both positional argument and named argument can be used to call function:

internal static void PositionalArgumentAndNamedArgument()

```csharp
{
```
```csharp
InputByCopy(null, 0); // Positional arguments.
```
```csharp
InputByCopy(reference: null, value: 0); // Named arguments.
```
```csharp
InputByCopy(value: 0, reference: null); // Named arguments.
```
```csharp
InputByCopy(null, value: 0); // Positional argument followed by named argument.
```
```csharp
InputByCopy(reference: null, 0); // Named argument followed by positional argument.
```

}

When a function is called with positional arguments, the arguments must align with the parameters. When a function is called with named arguments, the named arguments can be in arbitrary order. And when using positional and named arguments together, before C# 7.2, positional arguments must be followed by named arguments. Since C# 7.2, when all arguments are in correct position, then named argument can precede positional argument. At compile time, all named arguments are compiled to positional arguments. The above InputByCopy calls are compiled to:

internal static void CompiledPositionalArgumentAndNamedArgument()

```csharp
{
```
```csharp
InputByCopy(null, 1);
```
```csharp
InputByCopy(null, 1);
```
```csharp
InputByCopy(null, 1);
```
```csharp
InputByCopy(null, 1);
```
```csharp
InputByCopy(null, 1);
```

}

If the named arguments are evaluated with inline function call, the order of evaluation is the same as their appearance:

internal static void NamedArgumentEvaluation()

```csharp
{
```
```csharp
InputByCopy(reference: GetUri(), value: GetInt32()); // Call GetUri then GetInt32.
```
```csharp
InputByCopy(value: GetInt32(), reference: GetUri()); // Call GetInt32 then GetUri.
```
```csharp
}
```

```csharp
internal static Uri GetUri() { return default; }
```

internal static int GetInt32() { return default; }

When the above InputByCopy calls are compiled, local variable is generated to ensure the arguments are evaluated in the specified order:

internal static void CompiledNamedArgumentEvaluation()

```csharp
{
```
```csharp
InputByCopy(GetUri(), GetInt32()); // Call GetUri then GetInt32.
```
```csharp
int value = GetInt32(); // Call GetInt32 then GetUri.
```
```csharp
InputByCopy(GetUri(), value);
```

}

In practice, this syntax should be used with cautious because it can generate local variable, which can be slight performance hit. This tutorial uses named argument syntax frequently for readability:

internal static void NamedArgument()

```csharp
{
```
```csharp
UnicodeEncoding unicodeEncoding1 = new UnicodeEncoding(true, true, true);
```
```csharp
UnicodeEncoding unicodeEncoding2 = new UnicodeEncoding(
```
```csharp
bigEndian: true, byteOrderMark: true, throwOnInvalidBytes: true);
```

}

## Required parameter vs. optional parameter

By default, function parameters require arguments. C# 4.0 also introduces optional parameter, with a default value specified:

internal static void OptionalParameter(

```csharp
bool required1, char required2,
```
```csharp
int optional1 = int.MaxValue, string optional2 = "Default value.",
```
```csharp
Uri optional3 = null, Guid optional4 = new Guid(),
```

Uri optional5 = default, Guid optional6 = default) { }

The default value for optional parameter must be compile time constant, or default value of the type (null for reference type, or default constructor call for value type, or default expression). If a function has both required parameters and optional parameters, the required parameters must be followed by optional parameters. Optional parameter is not a syntactic sugar. The above function is compiled as the following CIL:

.method assembly hidebysig static

```csharp
void OptionalParameter(
```
```csharp
bool required1,
```
```csharp
char required2,
```
```csharp
[opt] int32 optional1,
```
```csharp
[opt] string optional2,
```
```csharp
[opt] class [System]System.Uri optional3,
```
```csharp
[opt] valuetype [mscorlib]System.Guid optional4,
```
```csharp
[opt] class [System]System.Uri optional5,
```
```csharp
[opt] valuetype [mscorlib]System.Guid optional6
```
```csharp
) cil managed
```
```csharp
{
```
```csharp
.param [3] = int32(2147483647) // optional1 = int.MaxValue
```
```csharp
.param [4] = "Default value." // optional2 = "Default value."
```
```csharp
.param [5] = nullref // optional3 = null
```
```csharp
.param [6] = nullref // optional4 = new Guid()
```
```csharp
.param [7] = nullref // optional5 = default
```
```csharp
.param [8] = nullref // optional6 = default
```

```csharp
.maxstack 8
```

```csharp
IL_0000: nop
```
```csharp
IL_0001: ret
```

}

And function with optional parameters can be called with the named argument syntax too:

internal static void CallOptionalParameter()

```csharp
{
```
```csharp
OptionalParameter(true, '@');
```
```csharp
OptionalParameter(true, '@', 1);
```
```csharp
OptionalParameter(true, '@', 1, string.Empty);
```
```typescript
OptionalParameter(true, '@', optional2: string.Empty);
```
```csharp
OptionalParameter(
```
```csharp
optional6: Guid.NewGuid(), optional3: GetUri(), required1: false, optional1: GetInt32(),
```
```csharp
required2: Convert.ToChar(64)); // Call Guid.NewGuid, then GetUri, then GetInt32, then Convert.ToChar.
```

}

When calling function with optional parameter, if the argument is not provided, the specified default value is used. Also, local variables can be generated to ensure the argument evaluation order. The above Optional calls are compiled to:

internal static void CompiledCallOptionalParameter()

```csharp
{
```
```csharp
OptionalParameter(true, '@', 1, "Default value.", null, new Guid(), null, new Guid());
```
```csharp
OptionalParameter(true, '@', 1, "Default value.", null, new Guid(), null, new Guid());
```
```csharp
OptionalParameter(true, '@', 1, string.Empty, null, new Guid(), null, new Guid());
```
```csharp
OptionalParameter(true, '@', 1, string.Empty, null, new Guid(), null, new Guid());
```
```csharp
Guid optional6 = Guid.NewGuid(); // Call Guid.NewGuid, then GetUri, then GetInt32, then Convert.ToChar.
```
```csharp
Uri optional3 = GetUri();
```
```csharp
int optional1 = GetInt32();
```
```csharp
OptionalParameter(false, Convert.ToChar(64), optional1, "Default value.", optional3);
```

}

## Caller information parameter

C# 5.0 introduces caller information parameters. System.Runtime.CompilerServices.CallerMemberNameAttribute, System.Runtime.CompilerServices.CallerFilePathAttribute, System.Runtime.CompilerServices.CallerLineNumberAttribute can be used for optional parameters to obtain the caller function name, caller function file name, and line number:

internal static void TraceWithCaller(

```csharp
string message,
```
```csharp
[CallerMemberName] string callerMemberName = null,
```
```csharp
[CallerFilePath] string callerFilePath = null,
```
```csharp
[CallerLineNumber] int callerLineNumber = 0)
```
```csharp
{
```
```csharp
Trace.WriteLine($"[{callerMemberName}, {callerFilePath}, {callerLineNumber}]: {message}");
```

}

When calling function with caller information parameters, just omit those arguments:

internal static void CallTraceWithCaller()

```csharp
{
```
```csharp
TraceWithCaller("Message.");
```
```csharp
// Compiled to:
```
```csharp
// TraceWithCaller("Message.", "CompiledCallTraceWithCaller", @"D:\Data\GitHub\Tutorial\Tutorial.Shared\Functional\InputOutput.cs,", 219);
```

}

At compile time, these omitted arguments are generated for the caller.

## Output by copy vs. output by alias

By default, function return result by making a copy (also called returning by value). Which is similar to input by copy by default. The following functions retrieve the first item from the specified array:

internal static int FirstValueByCopy(int\[\] values)

```csharp
{
```
```csharp
return values[0];
```
```csharp
}
```

```csharp
internal static Uri FirstReferenceByCopy(Uri[] references)
```
```csharp
{
```
```csharp
return references[0];
```

}

When they return the first item to the caller, they return a copied of the reference or value. When the returned item mutates, the item in the array is not impacted:

internal static void OutputByCopy()

```csharp
{
```
```csharp
int[] values = new int[] { 0, 1, 2, 3, 4 };
```
```csharp
int firstValue = FirstValueByCopy(values); // Copy of values[0].
```
```csharp
firstValue = 10;
```
```csharp
values[0].WriteLine(); // 0
```

```csharp
Uri[] references = new Uri[] { new Uri("https://weblogs.asp.net/dixin") };
```
```csharp
Uri firstReference = FirstReferenceByCopy(references); // Copy of references[0].
```
```csharp
firstReference = new Uri("https://flickr.com/dixin");
```
```csharp
references[0].WriteLine(); // https://weblogs.asp.net/dixin
```

}

C# 7.0 introduces output by alias (also called returning by reference). Similar to input by alias, returned result with a ref modifier is not copied:

internal static ref int FirstValueByAlias(int\[\] values)

```csharp
{
```
```csharp
return ref values[0];
```
```csharp
}
```

```csharp
internal static ref Uri FirstReferenceByAlias(Uri[] references)
```
```csharp
{
```
```csharp
return ref references[0];
```

}

The above functions can be called with the ref modifier to avoid copying. This time, when the returned alias mutates, the item in the array mutates too:

internal static void OutputByAlias()

```csharp
{
```
```csharp
int[] values = new int[] { 0, 1, 2, 3, 4 };
```
```csharp
ref int firstValue = ref FirstValueByAlias(values); // Alias of values[0].
```
```csharp
firstValue = 10;
```
```csharp
values[0].WriteLine(); // 10
```

```csharp
Uri[] references = new Uri[] { new Uri("https://weblogs.asp.net/dixin") };
```
```csharp
ref Uri firstReference = ref FirstReferenceByAlias(references); // Alias of references[0].
```
```csharp
firstReference = new Uri("https://flickr.com/dixin");
```
```csharp
references[0].WriteLine(); // https://flickr.com/dixin
```

}

### Output by immutable alias

To prevent caller from modifying the returned alias, ref can be used with the readonly modifier since C# 7.2:

internal static ref readonly int FirstValueByImmutableAlias(int\[\] values)

```csharp
{
```
```csharp
return ref values[0];
```
```csharp
}
```

```csharp
internal static ref readonly Uri FirstReferenceByImmutableAlias(Uri[] references)
```
```csharp
{
```
```csharp
return ref references[0];
```

}

Now the above functions can be called with ref modifier, and the readonly modifier is required for the returned alias. Apparently, trying to mutate the returned immutable alias causes error at compile time:

internal static void OutputByImmutableAlias()

```csharp
{
```
```csharp
int[] values = new int[] { 0, 1, 2, 3, 4 };
```
```csharp
ref readonly int firstValue = ref FirstValueByImmutableAlias(values); // Immutable alias of values[0].
```
```csharp
#if DEMO
```
```csharp
firstValue = 10; // Cannot be compiled.
```
```csharp
#endif
```
```csharp
Uri[] references = new Uri[] { new Uri("https://weblogs.asp.net/dixin") };
```
```csharp
ref readonly Uri firstReference = ref FirstReferenceByImmutableAlias(references); // Immutable alias of references[0].
```
```csharp
#if DEMO
```
```csharp
firstReference = new Uri("https://flickr.com/dixin"); // Cannot be compiled.
```
```csharp
#endif
```

}}

## Summary

This chapter dicusses many input and output features of C# functions, including input by copy, input by alias (ref parameter), input by immutable alias (in parameter), output parameter, out variable, parameter array, named argument, optonal parameter, caller ingormation parameter, output by copy, output by alias, and output by immutable alias.