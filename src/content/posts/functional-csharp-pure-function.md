---
title: "C# Functional Programming In-Depth (13) Pure Function"
published: 2019-06-13
description: "The previous chapter discusses that functional programming encourages modelling data as immutable. Functional programming also encourages modelling operations as pure functions. The encouraged purity"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# Features", "Functional C#", "Functional Programming", "LINQ", "LINQ via C#"]
category: "Functional Programming"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

The previous chapter discusses that functional programming encourages modelling data as immutable. Functional programming also encourages modelling operations as pure functions. The encouraged purity for function is the significant difference from method and procedure in imperative programming.

## Pure function and impure function

A function is pure if:

· Its output only depends on input, and does not depend on anything outside the function, like global variable, input from outside world to the hardware, etc. In another word, given the same input, it always gives the same output.

· It does not have obvious interaction with the environment outside the function or the world outside the hardware when it is called. In another word, the function has no side effect. Here are some examples of side effect:

o Mutate state

o Mutate arguments, free variable, or global variable, etc.

o Produce I/O (input/output between the hardware running the function and the outside world of that hardware)

So pure function is like mathematics function, which is a deterministic mapping between a set of input and a set of output. Other functions are called impure functions.

For example, the following functions are not deterministic, and they are impure:

· Console.Read, Console.ReadLine, Console.ReadKey: give unpredictable output when called each time, since the functions’ output totally depends on the input from outside world to the hardware.

· Random.Next, Guid.NewGuid, System.IO.Path.GetRandomFileName: give random output when called each time.

· DateTime.Now, DateTimeOffset.Now: give different output when called at different time.

And the following functions have side effects and they are impure:

· Property setter: usually mutate state.

· System.Threading.Thread.Start, Thread.Abort: mutate thread state and hardware state.

· int.TryParse, Interlocked.Increase: mutate argument through out/ref parameter.

· Console.Read, Console.ReadLine, Console.ReadKey, Console.Write, Console.WriteLine: produce console I/O.

· System.IO.Directory.Create, Directory.Move, Directory.Delete, File.Create, File.Move, File.Delete, File.ReadAllBytes, File.WriteAllBytes: produce file system I/O.

· System.Net.Http.HttpClient.GetAsync, HttpClient.PostAsync, HttpClinet.PutAsync, HttpClient.DeleteAsync: produce network I/O.

· IDisposable.Dispose: interact with environment to release unmanaged resources, and usually mutate the current state to disposed.

Strictly speaking, any function can interact with the outside world. A function call can at least have the hardware consuming electric energy from outside world and producing heat to outside world. When identifying function’s purity, only explicit interactions are considered.

In contrast, the following examples are pure functions because they are both deterministic and side effect free:

· Most mathematics functions, like numeric primitive types and decimal’s arithmetic operators, most of System.Math type’s static methods, etc. Take Math.Max and Math.Min as examples, their computed output only depends on the input, and they do not produce any side effect, like mutating state/argument/global variable, producing I/O, etc.:

namespace System

```csharp
{
```
```csharp
public static class Math
```
```csharp
{
```
```csharp
public static int Max(int val1, int val2) => (val1 >= val2) ? val1 : val2;
```

```csharp
public static int Min(int val1, int val2) => (val1 <= val2) ? val1 : val2;
```
```csharp
}
```

}

· object’s methods, like GetHashCode, GetType, Equals, ReferenceEquals, ToString, etc.

· System.Convert type’ conversion methods, like ToBoolean, ToInt32, etc.

· Property getter to simply output a state without mutating any state or producing other side effect, like string.Length, Nullable<T>.HasValue, Console.Error, etc.

· Immutable type’s function members for transformation, like string.Concat, string.Substring, string.Insert, string.Replace, string.Trim, string.ToUpper, string.ToLower, etc.

Since pure function is deterministic and side effect free, a pure function call expression and a constant expression of the result can always replace each other. This is called referential transparency.

Similar to immutable data, pure function can make code easier to write, test, and maintain in many cases. Pure function does not involve state mutation, and brings all benefits of immutability. Pure function is self-contained without external dependency or interaction, which greatly improves testability and maintainability. If 2 pure function calls have no input/output dependency, the function calls’ order does not matter, which greatly simplifies parallel computing. For example, purity is important in Parallel LINQ query, which is discussed in Parallel LINQ chapters.

As mentioned in the introduction chapter, there is a specialized functional programming paradigm called purely functional programming, which only allows immutable data and pure function. A few languages, like Haskell, are designed for this paradigm only, and they are called purely functional language. Other functional languages, like C#, F#, allows immutable data and mutable data, pure function and impure function, and they are called impure functional language. In purely functional programming, side effects can be managed by monad, like I/O monad, etc. Monad is discussed in the category theory chapters.

## Purity in .NET

.NET Standard provides System.Diagnostics.Contracts.PureAttribute. It can be used for a function member to specify that function is pure, or be used for a type to specify all function members of that type are pure:

\[Pure\]

```csharp
internal static bool IsPositive(int int32) => int32 > 0;
```

```csharp
internal static bool IsNegative(int int32) // Impure.
```
```csharp
{
```
```csharp
Console.WriteLine(int32); // Side effect: console I/O.
```
```csharp
return int32 < 0;
```
```csharp
}
```

```csharp
[Pure]
```
```csharp
internal static class AllFunctionsArePure
```
```csharp
{
```
```csharp
internal static int Increase(int int32) => int32 + 1; // Pure.
```

```csharp
internal static int Decrease(int int32) => int32 - 1; // Pure.
```

}

Looks great. Unfortunately, this attribute is provided not for general purpose but only for Code Contracts, a .NET tool provided (and now discontinued) by Microsoft. Code Contracts tool consists of:

· Code contracts APIs under System.Diagnostics.Contracts namespace to specify preconditions, post conditions, invariant, purity, etc., including the above PureAttribute.

· Contracts assemblies for most commonly used FCL assemblies

· Compile time rewriter and analyzer

· Runtime analyzer

In a function member, the contracts for its code can be specified declaratively with System.Diagnostics.Contracts.Contract type’s static methods. These contracts can be analysed at compile time and runtime. Apparently, they must be referential transparent and cannot rely on any side effect. So, only pure function (function with \[Pure\] contract) are allowed to be called with contracts APIs, like the above IsPositive function:

internal static int DoubleWithPureContracts(int int32)

```csharp
{
```
```csharp
Contract.Requires<ArgumentOutOfRangeException>(IsPositive(int32)); // Function precondition.
```
```csharp
Contract.Ensures(IsPositive(Contract.Result<int>())); // Function post condition.
```

```csharp
return int32 + int32; // Function body.
```

}

In contrast, the following example calls impure function (function without \[Pure\] contract) in contracts:

internal static int DoubleWithImpureContracts(int int32)

```csharp
{
```
```csharp
Contract.Requires<ArgumentOutOfRangeException>(IsNegative(int32)); // Function precondition.
```
```csharp
Contract.Ensures(IsNegative(Contract.Result<int>())); // Function post condition.
```

```csharp
return int32 + int32; // Function body.
```

}

At compile time, Code Contracts gives a warning: Detected call to method IsNegative(System.Int32)' without \[Pure\] in contracts of method ‘DoubleWithImpureContracts(System.Int32)'.

Code Contracts has been a very useful code tool for compile time and runtime, but Microsoft has discontinued this tool, so it only works for .NET Framework 4.0 and 4.5 on Windows. As a result, \[Pure\] attribute is actually obsolete.

When code is compiled and built to assembly, its contracts can either be compiled to the same assembly, or to a separate contracts assembly. Since .NET Framework FCL assemblies are already shipped, Microsoft provides 25 contracts assemblies separately for 25 most commonly used assemblies, including mscorlib.Contracts.dll (contracts for mscorlib.dll core library), System.Core.Contracts.dll (contracts for System.Core.dll assembly of LINQ to Objects and LINQ to Parallel, and remote LINQ APIs), System.Xml.Linq.Contracts.dll (contracts for System.Xml.Linq.dll assembly of LINQ to XML), etc. For example, Math.Abs function is provided in mscorlib.dll, so its contracts are provided in mscorlib.Contracts.dll as empty function with the same signature, with only contracts:

namespace System

```csharp
{
```
```csharp
public static class Math
```
```csharp
{
```
```csharp
[Pure]
```
```csharp
public static int Abs(int value)
```
```csharp
{
```
```csharp
Contract.Requires(value != int.MinValue);
```
```csharp
Contract.Ensures(Contract.Result<int>() >= 0);
```
```csharp
Contract.Ensures((value - Contract.Result<int>()) <= 0);
```

```csharp
return default;
```
```csharp
}
```
```csharp
}
```

}

C# and .NET Standard are designed in impure paradigm to allow immutability and mutability, purity and impurity. As a result, only a small percentage of the provided functions are pure. This can be demonstrated by utilizing above contracts assemblies and \[Pure\] contract. The following example has 2 LINQ to Objects queries. The first query counts all pure public functions in the contract assemblies. As fore mentioned, if a function has \[Pure\] attribute, it is pure; if a type has \[Pure\] attribute, its functions are all pure. Then the second query counts all public functions in corresponding library assemblies. In both queries, Mono’s reflection library, Mono.Cecil NuGet package, is used, because it can load .NET Framework assemblies and contracts assemblies correctly from different platforms, including Linux/Mac/Windows.

internal internal static void FunctionCount(

```csharp
string contractsAssemblyDirectory, string assemblyDirectory)
```
```csharp
{
```
```csharp
bool HasPureAttribute(ICustomAttributeProvider member) =>
```
```csharp
member.CustomAttributes.Any(attribute =>
```
```csharp
attribute.AttributeType.FullName.Equals(typeof(PureAttribute).FullName, StringComparison.Ordinal));
```

```csharp
string[] contractsAssemblyPaths = Directory
```
```csharp
.EnumerateFiles(contractsAssemblyDirectory, "*.Contracts.dll")
```
```csharp
.ToArray();
```
```csharp
// Query the count of pure functions in all contracts assemblies, including all public functions in public type with [Pure], and all public function members with [Pure] in public types.
```
```csharp
int pureFunctionCount = contractsAssemblyPaths
```
```csharp
.Select(AssemblyDefinition.ReadAssembly)
```
```csharp
.SelectMany(contractsAssembly => contractsAssembly.Modules)
```
```csharp
.SelectMany(contractsModule => contractsModule.GetTypes())
```
```csharp
.Where(contractsType => contractsType.IsPublic)
```
```csharp
.SelectMany(contractsType => HasPureAttribute(contractsType)
```
```csharp
? contractsType.Methods.Where(contractsFunction => contractsFunction.IsPublic)
```
```csharp
: contractsType.Methods.Where(contractsFunction =>
```
```csharp
contractsFunction.IsPublic && HasPureAttribute(contractsFunction)))
```
```csharp
.Count();
```
```csharp
pureFunctionCount.WriteLine(); // 2223
```

```csharp
// Query the count of all public functions in public types in all FCL assemblies.
```
```csharp
int functionCount = contractsAssemblyPaths
```
```csharp
.Select(contractsAssemblyPath => Path.Combine(
```
```csharp
assemblyDirectory,
```
```csharp
Path.ChangeExtension(Path.GetFileNameWithoutExtension(contractsAssemblyPath), "dll")))
```
```csharp
.Select(AssemblyDefinition.ReadAssembly)
```
```csharp
.SelectMany(assembly => assembly.Modules)
```
```csharp
.SelectMany(module => module.GetTypes())
```
```csharp
.Where(type => type.IsPublic)
```
```csharp
.SelectMany(type => type.Methods)
```
```csharp
.Count(function => function.IsPublic);
```
```csharp
functionCount.WriteLine(); // 82566
```

}

As a result, in the 25 most commonly used FCL assemblies, there are only 2.69% public function members are pure.

## Purity in LINQ

All built-in LINQ query methods have 3 kinds of output: a queryable source, a collection, and a single value. All query methods with queryable source output type are pure functions, the other query methods are impure. For example, the fore mentioned Where, Select, OrderBy query methods of local and remote LINQ are pure:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static IEnumerable<TSource> Where<TSource>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

```csharp
public static IEnumerable<TResult> Select<TSource, TResult>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TResult> selector);
```

```csharp
public static IOrderedEnumerable<TSource> OrderBy<TSource, TKey>(
```
```csharp
this IEnumerable<TSource> source, Func<TSource, TKey> keySelector);
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static IQueryable<TSource> Where<TSource>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate);
```

```csharp
public static IQueryable<TResult> Select<TSource, TResult>(
```
```csharp
this IQueryable<TSource> source, Expression<Func<TSource, TResult>> selector);
```

```csharp
public static IOrderedQueryable<TSource> ThenBy<TSource, TKey>(
```
```csharp
this IOrderedQueryable<TSource> source, Expression<Func<TSource, TKey>> keySelector);
```

```csharp
// Other members.
```
```csharp
}
```

}

The following ToArray, ToList query methods of local LINQ output collection, and they are impure:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static TSource[] ToArray<TSource>(this IEnumerable<TSource> source);
```

```csharp
public static List<TSource> ToList<TSource>(this IEnumerable<TSource> source);
```
```csharp
}
```

}

The following First query methods of local and remote LINQ output a single value, and they are also impure:

namespace System.Linq

```csharp
{
```
```csharp
public static class Enumerable
```
```csharp
{
```
```csharp
public static TSource First<TSource>(this IEnumerable<TSource> source);
```
```csharp
}
```

```csharp
public static class Queryable
```
```csharp
{
```
```csharp
public static TSource First<TSource>(this IQueryable<TSource> source);
```
```csharp
}
```

}

The query methods with queryable source output are implemented as pure function by simply constructing a new source instance with the input source. Calling these query methods only deterministically defines a new query and the query execution is deferred, so there is no state mutation or side effect. The output new query can be executed by pulling the results, which can mutate the query’s state and can produce side effect. The other query methods with collection or single value output are different. They immediately execute the pulling from their input source, which can mutate state and can produce side effect, so they are impure. The internal implementation of these methods is covered in the LINQ chapters.

## Summary

Pure function is important in functional programming. Pure function is deterministic and side effect free, so they are easy to write, test, maintain and parallelize. In LINQ, all query methods with queryable source output are pure functions.