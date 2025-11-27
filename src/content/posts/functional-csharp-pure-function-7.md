---
title: "C# Functional Programming In-Depth (13) Pure Function"
published: 2018-06-13
description: "Functional programming encourages modeling operations with pure functions."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-pure-function](/posts/functional-csharp-pure-function "https://weblogs.asp.net/dixin/functional-csharp-pure-function")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

Functional programming encourages modeling operations with pure functions.

## Referential transparency and side effect free

A function is [pure](http://en.wikipedia.org/wiki/Pure_function) if:

-   It gives the same output when given the same input. In another word, the function is [referentially transparent](https://en.wikipedia.org/wiki/Purely_functional).
-   It does not have obvious interaction with the caller function or the outside world, in another word, the function has no [side effect](http://en.wikipedia.org/wiki/Side_effect_\(computer_science\)). Here are some examples of side effect:

-   Changing state, like data mutation
-   Changing arguments, outer variable, or global variable
-   Producing I/O

So pure function is like mathematics function, which is is a simple relation between a set of input and a set of output, where each certain input is mapped to certain output. For example, the following functions are not referentially transparent:

-   Console.Read, Console.ReadLine, Console.ReadKey: gives unpredictable output when called each time
-   Random.Next, Guid.NewGuid: gives random output when called each time
-   DateTime.Now, DateTimeOffset.Now: gives different output when called at different time

And the following functions have side effects:

-   MutableDevice.Name’s setter, MutableDevice.Price’s setter in previous part: property setter usually changes state and interact with system.
-   In System.Threading namespace, Thread.Start, Thread.Abort: changes state
-   int.TryParse, Interlocked.Increase, and any method changes the ref/out argument
-   In System.Windows namespace, Application.SetExitCode: internally changes global variable Environment.ExitCode
-   Console.Read, Console.ReadLine, Console.ReadKey, Console.Write, Console.Write, Console.WriteLine: produces console I/O
-   In System.IO namespace, Directory.Create, Directory.Move, Directory.Delete, File.Create, File.Move, File.Delete, File.ReadAllBytes, File.WriteAllBytes: produces file system I/O
-   In System.Net namespace, WebRequest.GetRequestStreamAsync, WebRequest.GetResponseAsync, and in System.Net.Http namespace, HttpClient.GetAsync, HttpClient.PostAsync, HttpClinet.PutAsync, HttpClient.DeleteAsync: produces network I/O
-   IDisposable.Dispose: changes state to release unmanaged resources

Strictly speaking, any function can interact with the outside world. Usually, a function call can at least make the hardware work, which consumes electric energy, and heats the world. Here when identifying function’s purity, only explicit interactions are considered.

In contrast, the following functions are pure because they are both referentially transparent and side effect free:

-   Most mathematics functions, like decimal’s arithmetic operators, most of System.Math type’s static methods, etc. Take Math.Max and Math.Min as examples, their computed output only depends on the input, and they are residential transparency, they also produce no side effect, like state change, argument change, global variable change, I/O, etc.:
    ```csharp
    namespace System
    {
        public static class Math
        {
            public static int Max(int val1, int val2) => (val1 >= val2) ? val1 : val2;
    
            public static int Min(int val1, int val2) => (val1 <= val2) ? val1 : val2;
        }
    }
    ```
    

-   string.Concat, string.Substring, string.Insert, string.Replace, string.Trim, string.ToUpper, string.ToLower: accepts one or more strings as input, and output a new string, since string is immutable type.
-   string.Length, Nullable<T>.HasValue, Console.Error, or any property getter return a state. MutableDevice.Name’s getter and MutableDevice.Price’s getter are also pure. For a certain MutableDevice object, they return a predictable state, and during the getters’ execution, the getters do not change the state, or produce other side effect.
-   object’s methods, like GetHashCode, GetType, Equals, ReferenceEquals, ToString
-   System.Convert type’ conversion methods, like ToBoolean, ToInt32, etc.

Pure function has many benefits, for example:

-   it does not involve state change, which is a major source of code issues.
-   It is self contained, with greatly improves testability and maintainability.
-   If 2 pure function calls have no data dependency, the order the function calls does not matter, which greatly simplifies parallel computing, like Parallel LINQ.

As fore mentioned, there is also a specialized functional programming paradigm, called purely functional programming, where all operations are modeled as pure function calls. As a result, only immutable values and immutable data structures are allowed too. A few languages, like Haskell, are designed for this paradigm. In Haskell manages I/O with Monad, which is covered in the category theory chapter. The other functional languages, like C# and F#, are called impure functional language.

## PureAttribute and Code Contracts

.NET provides [System.Diagnostics.Contracts.PureAttribute](https://msdn.microsoft.com/en-us/library/system.diagnostics.contracts.pureattribute.aspx) to specify a named function member is pure:

```csharp
internal static partial class Purity
{
    [Pure]
    internal static bool IsPositive(int int32) => int32 > 0;

    internal static bool IsNegative(int int32) // Impure.
    {
        Console.WriteLine(int32.WriteLine()); // Side effect: console I/O.
        return int32 < 0;
    }
}
```

It can also be used for a type, to specify all its function members are pure:

```csharp
[Pure]
internal static class Pure
{
    internal static int Increase(int int32) => int32 + 1;

    internal static int Decrease(int int32) => int32 - 1;
}
```

Unfortunately, this attribute is not for general purpose and is only used by [.NET Code Contracts](https://msdn.microsoft.com/en-us/library/dd264808.aspx). Code Contracts is a Microsoft tool for .NET Framework. It consist of:

-   Code contract APIs under [System.Diagnostics.Contracts namespace](https://msdn.microsoft.com/en-us/library/system.diagnostics.contracts.aspx) to specify preconditions, post conditions, invariant, purity, etc., including the above [PureAttribute](https://msdn.microsoft.com/en-us/library/system.diagnostics.contracts.pureattribute.aspx).
-   Contracts assemblies for some .NET Framework assemblies
-   Compile time rewriter and analyzer
-   Runtime analyzer

To demonstrate how \[Pure\] works with Code Contracts, install the tool from [Visual Studio Gallery](https://visualstudiogallery.msdn.microsoft.com/1ec7db13-3363-46c9-851f-1ce455f66970), then in Visual Studio, go to project properties, add conditional compilation symbol CONTRACTS\_FULL:

[![image_thumb](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-Functional-Programming-In-Depth-13-Pur_865A/image_thumb_thumb.png "image_thumb")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-Functional-Programming-In-Depth-13-Pur_865A/image_thumb_2.png)

Notice there is a new tab Code Contract. Go to the tab and enable Perform Runtime Contract Checking:

[![image_thumb1](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-Functional-Programming-In-Depth-13-Pur_865A/image_thumb1_thumb.png "image_thumb1")](https://aspblogs.z22.web.core.windows.net/dixin/Open-Live-Writer/C-Functional-Programming-In-Depth-13-Pur_865A/image_thumb1_2.png)

Code Contracts can be specified with System.Diagnostics.Contracts.Contract type’s static methods. Only pure function calls are allowed to be used with Contract methods:

```csharp
internal static int PureContracts(int int32)
{
    Contract.Requires<ArgumentOutOfRangeException>(IsPositive(int32)); // Function precondition.
    Contract.Ensures(IsPositive(Contract.Result<int>())); // Function post condition.

    return int32 + 0; // Function logic.
}
```

For the caller of above function, Code Contract tool can check the specified precondition and post condition at compile time and runtime, if the check is enabled. And logically, the precondition and post condition check should be referential transparent and side effect free. In contrast, the following example calls impure function in precondition and post condition:

```csharp
internal static int ImpureContracts(int int32)
{
    Contract.Requires<ArgumentOutOfRangeException>(IsNegative(int32)); // Function precondition.
    Contract.Ensures(IsNegative(Contract.Result<int>())); // Function post condition.

    return int32 + 0; // Function logic.
}
```

At compile time, Code Contract gives a warning: Detected call to method IsNegative(System.Int32)' without \[Pure\] in contracts of method ‘ImpureContracts(System.Int32)'.

\[Pure\] cannot be used for anonymous function. And for any named function member, \[Pure\] must be used with caution. The following method is declared to be pure:

```csharp
[Pure] // Incorrect.
internal static ProcessStartInfo Initialize(ProcessStartInfo processStart)
{
    processStart.RedirectStandardInput = false;
    processStart.RedirectStandardOutput = false;
    processStart.RedirectStandardError = false;
    return processStart;
}
```

But actually it is impure at all, by changing state. There is no tool to check its internal code at compile time or runtime and give any warning or error. The purity can only be ensured artificially at design time.

## Purity in .NET

When code is compiled and built to assembly, its contracts can either be compiled to the same assembly, or to a separate contract assembly. For .NET Framework FCL assemblies already shipped, Microsoft provides separate contracts assembles for some most used assemblies:

-   Microsoft.VisualBasic.Compatibility.Contracts.dll
-   Microsoft.VisualBasic.Contracts.dll
-   mscorlib.Contracts.dll
-   PresentationCore.Contracts.dll
-   PresentationFramework.Contracts.dll
-   System.ComponentModel.Composition.Contracts.dll
-   System.Configuration.Contracts.dll
-   System.Configuration.Install.Contracts.dll
-   System.Contracts.dll
-   System.Core.Contracts.dll
-   System.Data.Contracts.dll
-   System.Data.Services.Contracts.dll
-   System.DirectoryServices.Contracts.dll
-   System.Drawing.Contracts.dll
-   System.Numerics.Contracts.dll
-   System.Runtime.Caching.Contracts.dll
-   System.Security.Contracts.dll
-   System.ServiceModel.Contracts.dll
-   System.ServiceProcess.Contracts.dll
-   System.Web.ApplicationServices.Contracts.dll
-   System.Web.Contracts.dll
-   System.Windows.Forms.Contracts.dll
-   System.Xml.Contracts.dll
-   System.Xml.Linq.Contracts.dll
-   WindowsBase.Contracts.dll

A contract assembly contains the contracts (precondition, post condition, invariant, etc.) for APIs in a certain FLC assemblies. For example, mscorlib.Contracts.dll provides the contracts for APIs in mscorlib.dll, System.ComponentModel.Composition.Contracts.dll provides the contracts fro APIs in System.ComponentModel.Composition.dll, etc. Above Math.Abs function is provided in mscorlib.dll, so its parity contract is provided in mscorlib.Contracts.dll, with the same signature but contains only contracts and no logic:

```csharp
namespace System
{
    public static class Math
    {
        [Pure]
        public static int Abs(int value)
        {
            Contract.Requires(value != int.MinValue);
            Contract.Ensures(Contract.Result<int>() >= 0);
            Contract.Ensures((value - Contract.Result<int>()) <= 0);

            return default;
        }
    }
}
```

For the caller of Math.Abs, Code Contract tool can load the above precondition and post condition from mscorlib.Contracts.dll, and run the check at compile time and runtime, if the check is enabled. C# language is not designed to be purely functional, neither are .NET APIs. So only a small percentage of built in functions are pure. To demonstrate this, reflection can be used to examine these assembly contracts. The .NET built in reflection APIs does not work well with these assembly contrast. For example, mscorlib.Contracts.dll contains type System.Void, which is considered to be a special type by .NET reflection, and causes crashes. The [Mono.Cecil](https://www.nuget.org/packages/Mono.Cecil/) NuGet package, a third party reflection library, can work here. The following LINQ to Objects example calls the Mono.Cecil APIs to query the contract assemblies for the public function members with \[Pure\], then query all .NET Framework FCL assemblies’ public function members:

```csharp
internal static void PureFunction(string contractsAssemblyDirectory, string gacDirectory = @"C:\Windows\Microsoft.NET\assembly")
{
    string[] contractAssemblyFiles = Directory
        .EnumerateFiles(contractsAssemblyDirectory, "*.dll")
        .ToArray();
    string pureAttribute = typeof(PureAttribute).FullName;
    // Query the count of all public function members with [Pure] in all public class in all contract assemblies.
    int pureFunctionCount = contractAssemblyFiles
        .Select(assemblyContractFile => AssemblyDefinition.ReadAssembly(assemblyContractFile))
        .SelectMany(assemblyContract => assemblyContract.Modules)
        .SelectMany(moduleContract => moduleContract.GetTypes())
        .Where(typeContract => typeContract.IsPublic)
        .SelectMany(typeContract => typeContract.Methods)
        .Count(functionMemberContract => functionMemberContract.IsPublic
            && functionMemberContract.CustomAttributes.Any(attribute =>
                attribute.AttributeType.FullName.Equals(pureAttribute, StringComparison.Ordinal)));
    pureFunctionCount.WriteLine(); // 2473

    string[] assemblyFiles = new string[] { "GAC_64", "GAC_MSIL" }
        .Select(platformDirectory => Path.Combine(gacDirectory, platformDirectory))
        .SelectMany(assemblyDirectory => Directory
            .EnumerateFiles(assemblyDirectory, "*.dll", SearchOption.AllDirectories))
        .ToArray();
    // Query the count of all public function members in all public class in all FCL assemblies.
    int functionCount = contractAssemblyFiles
        .Select(contractAssemblyFile => assemblyFiles.First(assemblyFile => Path.GetFileName(contractAssemblyFile)
            .Replace(".Contracts", string.Empty)
            .Equals(Path.GetFileName(assemblyFile), StringComparison.OrdinalIgnoreCase)))
        .Select(assemblyFile => AssemblyDefinition.ReadAssembly(assemblyFile))
        .SelectMany(assembly => assembly.Modules)
        .SelectMany(module => module.GetTypes())
        .Where(type => type.IsPublic)
        .SelectMany(type => type.Methods)
        .Count(functionMember => functionMember.IsPublic);
    functionCount.WriteLine(); // 83447
}
```

As a result, in the above mainstream FCL assemblies, there are only 2.96% public function members are pure.