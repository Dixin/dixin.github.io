---
title: "C# functional programming in-depth (3) Local Function and Closure"
published: 2019-06-03
description: "The previous chapter discussed named function. There is one more special kind of named function. local function. Local function can be nested in another function, and it supports an important feature"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# 6.0", "C# Features", "Functional C#", "Functional Programming", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

The previous chapter discussed named function. There is one more special kind of named function. local function. Local function can be nested in another function, and it supports an important feature closure, the ability access variable outside the local function itself.

## Local function

C# 7.0 introduces local function, which allows defining and calling a named, nested function inside a function. Unlike a local variable, which has to be used after being defined, a local function can be called before or after it is defined:

internal static void MethodWithLocalFunction()

```csharp
{
```
```csharp
void LocalFunction() // Define local function.
```
```csharp
{
```
```csharp
MethodBase.GetCurrentMethod().Name.WriteLine();
```
```csharp
}
```
```csharp
LocalFunction(); // Call local function.
```
```csharp
}
```

```csharp
internal static int PropertyWithLocalFunction
```
```csharp
{
```
```csharp
get
```
```csharp
{
```
```csharp
LocalFunction(); // Call local function.
```
```csharp
void LocalFunction() // Define local function.
```
```csharp
{
```
```csharp
MethodBase.GetCurrentMethod().Name.WriteLine();
```
```csharp
}
```
```csharp
LocalFunction(); // Call local function.
```
```csharp
return 0;
```
```csharp
}
```

}

Local function is a syntactic sugar. Its definition is compiled to normal method definition, and its call is compiled to method call. For example, the above method with local function is compiled to:

\[CompilerGenerated\]

```csharp
internal static void CompiledLocalFunction()
```
```csharp
{
```
```csharp
MethodBase.GetCurrentMethod().Name.WriteLine();
```
```csharp
}
```

```csharp
internal static void CompiledMethodWithLocalFunction()
```
```csharp
{
```
```csharp
CompiledLocalFunction();
```

}

Besides method members, local function can also be nested inside local function:

internal static void LocalFunctionWithLocalFunction()

```csharp
{
```
```csharp
void LocalFunction()
```
```csharp
{
```
```csharp
void NestedLocalFunction() { }
```
```csharp
NestedLocalFunction();
```
```csharp
}
```
```csharp
LocalFunction();
```

}

Anonymous function can have local function as well (Anonymous function is discussed in an individual chapter):

internal static Action AnonymousFunctionWithLocalFunction()

```csharp
{
```
```csharp
return () => // Return an anonymous function of type Action.
```
```csharp
{
```
```csharp
void LocalFunction() { }
```
```csharp
LocalFunction();
```
```csharp
};
```

}

Unlike other named functions, local function does not support ad hoc polymorphism (overload). The following code cannot be compiled:

internal static void LocalFunctionOverload()

```csharp
{
```
```csharp
void LocalFunction() { }
```
```csharp
void LocalFunction(int int32) { } // Cannot be compiled.
```

}

Local function is useful to encapsulate code execution in a function. For example, the following binary search function encapsulate the main algorithm in a local function, and execute it recursively:

internal static int BinarySearchWithLocalFunction<T\>(this IList<T\> source, T value, IComparer<T\> comparer = null)

```csharp
{
```
```csharp
int BinarySearch(
```
```csharp
IList<T>localSource, T localValue, IComparer<T>localComparer, int startIndex, int endIndex)
```
```csharp
{
```
```csharp
if (startIndex > endIndex) { return -1; }
```
```csharp
int middleIndex = startIndex + (endIndex - startIndex) / 2;
```
```csharp
int compare = localComparer.Compare(localSource[middleIndex], localValue);
```
```csharp
if (compare == 0) { return middleIndex; }
```
```csharp
return compare > 0
```
```csharp
? BinarySearch(localSource, localValue, localComparer, startIndex, middleIndex - 1)
```
```csharp
: BinarySearch(localSource, localValue, localComparer, middleIndex + 1, endIndex);
```
```csharp
}
```
```csharp
return BinarySearch(source, value, comparer ?? Comparer<T>.Default, 0, source.Count - 1);
```

}

C# local function supports closure, so above local function can be further simplified, which is discussed later in this chapter.

Local function is also useful with asynchronous function and generator function to isolate the asynchronous execution and deferred execution, which are discussed in the asynchronous function and LINQ to Objects chapters.

## Closure

In object-oriented programming, it is “perfectly nature normal thing” for a type’s method member to use local variable and field member:

internal class Closure

```csharp
{
```
```csharp
int field = 1; // Outside function Add.
```

```csharp
internal void Add()
```
```csharp
{
```
```csharp
int local = 2; // Inside function Add.
```
```csharp
(local + field).WriteLine(); // local + this.field.
```
```csharp
}
```

}

Here in Closure type, its method accesses data inside and outside its definition. Similarly, local function can access variable inside and outside its definition as well:

internal static void LocalFunctionWithClosure()

```csharp
{
```
```csharp
int free = 1; // Outside local function Add.
```
```csharp
void Add()
```
```csharp
{
```
```csharp
int local = 2; // Inside local function Add.
```
```csharp
(local + free).WriteLine();
```
```csharp
}
```
```csharp
Add();
```

}

Here free is a variable defined by outer function and is outside the local function. In C# it can be accessed by both the outer function and the local function. It is the local variable of the outer function, and it is called free variable of the local function. In another word, for a local function, if a variable is neither its local variable, nor its parameter, then this variable is its free variable. Free variable is also called outer variable, non-local variable, or captured variable. This capability for local function to access a free variable, is called closure. C# closure is also a syntactic sugar. The above example is compiled to a closure structure:

\[CompilerGenerated\]

```csharp
[StructLayout(LayoutKind.Auto)]
```
```csharp
private struct Closure1
```
```csharp
{
```
```csharp
public int Free;
```
```csharp
}
```

```csharp
[CompilerGenerated]
```
```csharp
private static void CompiledAdd(ref Closure1 closure)
```
```csharp
{
```
```csharp
int local = 2;
```
```csharp
(local + closure.Free).WriteLine();
```
```csharp
}
```

```csharp
internal static void CompiledLocalFunctionWithClosure()
```
```csharp
{
```
```csharp
int free = 1;
```
```csharp
Closure1 closure = new Closure1() { Free = free };
```
```csharp
CompiledAdd(ref closure);
```

}

C# compiler generates:

· A closure structure to capture the free variable as field.

· A normal method member definition to represent the local function, with a closure parameter. In its body, the reference to free variable is compiled to reference to closure’s field.

· A normal method member call with a closure argument, whose field is initialized with the free variable. The instantiated closure is passed to the generated method member as alias to avoid copying the closure instance, since it is a structure. Function input as alias is discussed in the function input and output chapter.

So, C# compiler implements closure, a functional feature, by generating object-oriented code.

The above binary search function’s local function accesses the source to search, target value, and comparer through parameter. With closure, the local function does not need these parameters. It can directly access them as free variable:

internal static int BinarySearchWithClosure<T\>(this IList<T\> source, T value, IComparer<T\> comparer = null)

```csharp
{
```
```csharp
int BinarySearch(int startIndex, int endIndex)
```
```csharp
{
```
```csharp
if (startIndex > endIndex) { return -1; }
```
```csharp
int middleIndex = startIndex + (endIndex - startIndex) / 2;
```
```csharp
int compare = comparer.Compare(source[middleIndex], value);
```
```csharp
if (compare == 0) { return middleIndex; }
```
```csharp
return compare > 0
```
```csharp
? BinarySearch(startIndex, middleIndex - 1)
```
```csharp
: BinarySearch(middleIndex + 1, endIndex);
```
```csharp
}
```
```csharp
comparer = comparer ?? Comparer<T>.Default;
```
```csharp
return BinarySearch(0, source.Count - 1);
```

}

It is compiled to the same closure structure and method member pattern:

\[CompilerGenerated\]

```csharp
[StructLayout(LayoutKind.Auto)]
```
```csharp
private struct Closure2<T>
```
```csharp
{
```
```csharp
public IComparer<T> Comparer;
```

```csharp
public IList<T> Source;
```

```csharp
public T Value;
```
```csharp
}
```

```csharp
[CompilerGenerated]
```
```csharp
private static int CompiledLocalBinarySearch<T>(int startIndex, int endIndex, ref Closure2<T> closure)
```
```csharp
{
```
```csharp
if (startIndex > endIndex) { return -1; }
```
```csharp
int middleIndex = startIndex + (endIndex - startIndex) / 2;
```
```csharp
int compare = closure.Comparer.Compare(closure.Source[middleIndex], closure.Value);
```
```csharp
if (compare == 0) { return middleIndex; }
```
```csharp
return compare <= 0
```
```csharp
? CompiledLocalBinarySearch(middleIndex + 1, endIndex, ref closure)
```
```csharp
: CompiledLocalBinarySearch(startIndex, middleIndex - 1, ref closure);
```
```csharp
}
```

```csharp
internal static int CompiledBinarySearchWithClosure<T>(IList<T> source, T value, IComparer<T> comparer = null)
```
```csharp
{
```
```csharp
Closure2<T> closure = new Closure2<T>()
```
```csharp
{
```
```csharp
Source = source,
```
```csharp
Value = value,
```
```csharp
Comparer = comparer
```
```csharp
};
```
```csharp
return CompiledLocalBinarySearch(0, source.Count - 1, ref closure);
```

}

As demonstrated above, when the local function has multiple free variables, it still has 1 closure parameter. The closure structure defines multiple fields to capture all free variable and pass to the local function as parameter.

### Free variable mutation

Apparently, free variable is variable and it can mutate. When mutation happens, the accessing local functions can be impacted. In the previous example, if the free variable mutates, the local function apparently outputs different sum of local variable and free variable:

internal static void FreeVariableMutation()

```csharp
{
```
```csharp
int free = 1;
```

```csharp
void Add()
```
```csharp
{
```
```csharp
int local = 2;
```
```csharp
(local + free).WriteLine();
```
```csharp
}
```

```csharp
Add(); // 3
```
```csharp
free = 3; // Free variable mutates.
```
```csharp
Add(); // 5
```

}

Sometimes, this can be source of problems.

internal static void FreeVariableReference()

```csharp
{
```
```csharp
List<Action> localFunctions = new List<Action>();
```
```csharp
for (int free = 0; free < 3; free++) // free is 0, 1, 2.
```
```csharp
{
```
```csharp
void LocalFunction() { free.WriteLine(); }
```
```csharp
localFunctions.Add(LocalFunction);
```
```csharp
} // free is 3.
```
```csharp
foreach (Action localFunction in localFunctions)
```
```csharp
{
```
```csharp
localFunction(); // 3 3 3 (instead of 0 1 2)
```
```csharp
}
```

}

In this case, the for loop has 3 iterations. In the first iteration, free is 0, a local function is defined to output free’s value, and the local function is stored to a function list. In the second iteration, free becomes 1, a local function is repeatedly defined to write free’s value, and stored in function list, and so on. Later, when calling these stored local functions, they do not output 0, 1, 2, but 3, 3, 3. The reason is, the 3 iterations of for loop share the same free variable, when the for loop is done, the free’s value becomes 3. Then, calling these 3 functions outputs the latest value of outer for 3 times, so it is 3, 3, 3. The compiled code is more intuitive. Notice the local function is compiled to a method member of closure structure, since it is stored:

\[CompilerGenerated\]

```csharp
private struct Closure3
```
```csharp
{
```
```csharp
public int Free;
```

```csharp
internal void LocalFunction() { this.Free.WriteLine(); }
```
```csharp
}
```

```csharp
internal static void CompiledFreeVariableReference()
```
```csharp
{
```
```csharp
List<Action> localFunctions = new List<Action>();
```
```csharp
Closure3 closure = new Closure3();
```
```csharp
for (closure.Free = 0; closure.Free < 3; closure.Free++) // free is 0, 1, 2.
```
```csharp
{
```
```csharp
localFunctions.Add(closure.LocalFunction);
```
```csharp
} // closure.Free is 3.
```
```csharp
foreach (Action localFunction in localFunctions)
```
```csharp
{
```
```csharp
localFunction(); // 3 3 3 (instead of 0 1 2)
```
```csharp
}
```

}

This can be resolved by capture a snapshot of shared free’s current value in each iteration, and store it in another variable that does not mutate:

internal static void CopyFreeVariableReference()

```csharp
{
```
```csharp
List<Action> localFunctions = new List<Action>();
```
```csharp
for (int free = 0; free < 3; free++) // free is 0, 1, 2.
```
```csharp
{
```
```csharp
int copyOfFree = free;
```
```csharp
// When free mutates, copyOfFree does not mutate.
```
```csharp
void LocalFunction() { copyOfFree.WriteLine(); }
```
```csharp
localFunctions.Add(LocalFunction);
```
```csharp
} // free is 3. copyOfFree is 0, 1, 2.
```
```csharp
foreach (Action localFunction in localFunctions)
```
```csharp
{
```
```csharp
localFunction(); // 0 1 2
```
```csharp
}
```

}

In each iteration of for loop, free is copied to copyOfFree. copyOfFree is not shared cross the iterations and does not mutate. When the for loop is done, 3 local function calls output the values of 3 snapshot values 0, 1, 2.. Above code is compiled to:

\[CompilerGenerated\]

```csharp
private sealed class Closure4
```
```csharp
{
```
```csharp
public int CopyOfFree;
```

```csharp
internal void LocalFunction() { this.CopyOfFree.WriteLine(); }
```
```csharp
}
```

```csharp
internal static void CompiledCopyFreeVariableReference()
```
```csharp
{
```
```csharp
List<Action> localFunctions = new List<Action>();
```
```csharp
for (int free = 0; free < 3; free++)
```
```csharp
{
```
```csharp
Closure4 closure = new Closure4() { CopyOfFree = free }; // free is 0, 1, 2.
```
```csharp
// When free changes, closure.CopyOfFree does not change.
```
```csharp
localFunctions.Add(closure.LocalFunction);
```
```csharp
} // free is 3. closure.CopyOfFree is 0, 1, 2.
```
```csharp
foreach (Action localFunction in localFunctions)
```
```csharp
{
```
```csharp
localFunction(); // 0 1 2
```
```csharp
}
```

}

Each iteration of the for loop instantiate an independent closure, which captures copyOfFree instead of free. When the for loop is done, each closure’s instance method is called to output its own captured value.

### Performance

C# closure provides great convenience to enable local function to directly access free variable. Besides allocating structure on stack, closure may also lead to performance pitfall, because it generates closure structure with reference to the accessed free variable, and that reference is not intuitive at all for developers at design time. The following is a closure example with large free variable:

internal static partial class LocalFunctions

```csharp
{
```
```csharp
private static Action persisted;
```

```csharp
internal static void FreeVariableLifetime()
```
```csharp
{
```
```csharp
byte[] tempLargeInstance = new byte[0x_7FFF_FFC7]; // Temp variable of large instance, Array.MaxByteArrayLength is 0x_7FFF_FFC7.
```
```csharp
// ...
```
```csharp
void LocalFunction()
```
```csharp
{
```
```csharp
// ...
```
```csharp
int length = tempLargeInstance.Length; // Reference to free variable.
```
```csharp
// ...
```
```csharp
length.WriteLine();
```
```csharp
// …
```
```csharp
}
```
```csharp
// ...
```
```csharp
LocalFunction();
```
```csharp
// ...
```
```csharp
persisted = LocalFunction; // Reference to local function.
```
```csharp
}
```

}

Here temp is a large instance of byte array. It is a temporary local variable of the outer function, and free variable of the local function. It is not explicitly stored to any other variable or field, and supposed to have a short lifetime along with the execution of outer function. However, this temporary variable cannot be garbage collected after the execution of outer function and local function. The reason is, the local function is stored to a static field, and persisted to a long lifetime, so that its free variable should has the same lifetime. The problem is not intuitive at design time. At compile time, the following closure is generated:

\[CompilerGenerated\]

```csharp
private sealed class Closure5
```
```csharp
{
```
```csharp
public byte[] TempLargeInstance;
```

```csharp
internal void LocalFunction()
```
```csharp
{
```
```csharp
int length = this.TempLargeInstance.Length;
```
```csharp
length.WriteLine();
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void CompiledFreeVariableLifetime()
```
```csharp
{
```
```csharp
byte[] tempLargeInstance = new byte[0X7FFFFFC7];
```
```csharp
Closure5 closure = new Closure5() { TempLargeInstance = tempLargeInstance };
```
```csharp
closure.LocalFunction();
```
```csharp
persisted = closure.LocalFunction;
```
```csharp
// closure's lifetime is bound to persisted, so is closure.TempLargeInstance.
```

}

The large array is captured as a field of the closure structure, which is expected since it is the free variable of the local function. Since the local function is stored, it is also compiled to be a method member of the closure structure. Here comes the problem. When the outer function stores the local function to the static field, it actually instantiates the closure, and stores closure’s instance method to the static field. Since the instance method’s lifetime is persisted, the entire closure instance is persisted with a long lifetime. after the execution of outer function and local function, the closure along cannot be deallocated, with its field of large array not able to be garbage collected, which causes memory leak issue. To fix the issue, consider a different design where local function is not persisted, or local function does not access large instance through free variable.

Multiple local functions in one function may share the same closure, which may also lead to memory leak. The following example’s problem is even more obscure:

internal static Action SharedClosure()

```csharp
{
```
```csharp
byte[] tempLargeInstance = new byte[0x_7FFF_FFC7];
```
```csharp
void LocalFunction1() { int length = tempLargeInstance.Length; }
```
```csharp
LocalFunction1();
```

```csharp
bool tempSmallInstance = false;
```
```csharp
void LocalFunction2() { tempSmallInstance = true; }
```
```csharp
LocalFunction2();
```

```csharp
return LocalFunction2; // Return a function of Action type.
```
```csharp
}
```

```csharp
internal static void CallSharedClosure()
```
```csharp
{
```
```csharp
persisted = SharedClosure(); // Returned LocalFunction2 is persisted.
```

}

Here LocalFunction2 only accesses free variable tempSmallInstance, and has nothing to do with tempLargeInstance. However, if SharedClosure is called and the returned LocalFunction2 is persisted, tempLargeInstance is still leaked and cannot be garbage collected. Again, the problem is invisible at design time, but intuitive at compile time:

\[CompilerGenerated\]

```csharp
private struct Closure6
```
```csharp
{
```
```csharp
public byte[] TempLargeInstance;
```

```csharp
internal void LocalFunction1() { int length = this.TempLargeInstance.Length; }
```

```csharp
public bool TempSmallInstance;
```

```csharp
internal void LocalFunction2() { this.TempSmallInstance = true; }
```
```csharp
}
```

```csharp
internal static Action CompiledSharedClosure()
```
```csharp
{
```
```csharp
Closure6 closure = new Closure6();
```
```csharp
closure.TempLargeInstance = new byte[0x_7FFF_FFC7];
```
```csharp
closure.LocalFunction1();
```

```csharp
closure.TempSmallInstance = false;
```
```csharp
closure.LocalFunction2();
```

```csharp
return closure.LocalFunction2; // Return a function of Action type.
```

}

C# compiler can generate one shared closure structure for multiple local functions and their free variables. If one local function is persisted, the shared closure is persisted, along with all captured free variables of all local functions. Besides a different design not persisting local function or not accessing large free variable, another possible improvement is to separate local functions to different lexical scopes:

internal static Action SeparatedClosures()

```csharp
{
```
```csharp
{ // Lexical scope has its own closure.
```
```csharp
byte[] tempLargeInstance = new byte[0x_7FFF_FFC7];
```
```csharp
void LocalFunction1() { int length = tempLargeInstance.Length; }
```
```csharp
LocalFunction1();
```
```csharp
}
```

```csharp
bool tempSmallInstance = false;
```
```csharp
void LocalFunction2() { tempSmallInstance = true; }
```
```csharp
LocalFunction2();
```

```csharp
return LocalFunction2; // Return a function of Action type.
```

}

C# compiler generates an individual closure for each lexical scopes, so the above 2 local function are compiled to 2 separated closures. If the returned LocalFunction2 is persisted, only tempSmallInstance is persisted along with LocalFunction2’s closure.

So, whenever a local function may live longer than the execution of outer function, free variable must be used with caution. Other languages supporting closure in similar way, like JavaScript, etc., has the same pitfall.

## Static local function

C# 8.0 introduces static local function. Closure is disabled when static keyword is used to define local function.

## Summary

This chapter explains what is local function, how to define and use it, and its underlying compilation. This chapter also discusses local function’s important feature closure, including the concept, usage, compilation, and analyzed possible performance pitfall of memory leak.