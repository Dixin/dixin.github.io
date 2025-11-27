---
title: "C# functional programming in-depth (3) Local Function and Closure"
published: 2018-06-03
description: "C# 7.0 introduces local function, which allows defining and calling a named, inline function inside a function member’s body. Unlike a local variable, which has to be used after being defined, a local"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-local-function-and-closure](/posts/functional-csharp-local-function-and-closure "https://weblogs.asp.net/dixin/functional-csharp-local-function-and-closure")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

## Local function

C# 7.0 introduces local function, which allows defining and calling a named, inline function inside a function member’s body. Unlike a local variable, which has to be used after being defined, a local function can be called before or after it is defined:

```csharp
internal static partial class Functions
{
    internal static void MethodWithLocalFunction()
    {
        void LocalFunction() // Define local function.
        {
            nameof(LocalFunction).WriteLine();
        }
        LocalFunction(); // Call local function.
    }

    internal static int PropertyWithLocalFunction
    {
        get
        {
            LocalFunction(); // Call local function.
            void LocalFunction() // Define local function.
            {
                nameof(LocalFunction).WriteLine();
            }
            LocalFunction(); // Call local function.
            return 0;
        }
    }
}
```

Besides function members, local function can also have local function:

```csharp
internal static void FunctionMember()
{
    void LocalFunction()
    {
        void LocalFunctionInLocalFunction() { }
    }
}
```

Unlike other named methods, local function does not support ad hoc polymorphism (overload). The following code cannot be compiled:

```csharp
// Cannot be compiled.
internal static void LocalFunctionOverload()
{
    void LocalFunction() { }
    void LocalFunction(int int32) { } // Cannot be compiled.
}
```

This syntax is useful when a function is only used by another specific function. For example, the following binary search function wraps the algorithm in a helper function to for recursion:

```csharp
internal static int BinarySearch<T>(this IList<T> source, T value, IComparer<T> comparer = null)
{
    return BinarySearch(source, value, comparer ?? Comparer<T>.Default, 0, source.Count - 1);
}

private static int BinarySearch<T>(IList<T> source, T value, IComparer<T> comparer, int startIndex, int endIndex)
{
    if (startIndex > endIndex) { return -1; }
    int middleIndex = startIndex + (endIndex - startIndex) / 2;
    int compare = comparer.Compare(source[middleIndex], value);
    if (compare == 0) { return middleIndex; }
    return compare > 0
        ? BinarySearch(source, value, comparer, startIndex, middleIndex - 1)
        : BinarySearch(source, value, comparer, middleIndex + 1, endIndex);
}
```

The helper function is only used by this binary search function, so it can be defined locally:

```csharp
internal static int BinarySearchWithLocalFunction<T>(this IList<T> source, T value, IComparer<T> comparer = null)
{
    int BinarySearch(
        IList<T> localSource, T localValue, IComparer<T> localComparer, int startIndex, int endIndex)
    {
        if (startIndex > endIndex) { return -1; }
        int middleIndex = startIndex + (endIndex - startIndex) / 2;
        int compare = localComparer.Compare(localSource[middleIndex], localValue);
        if (compare == 0) { return middleIndex; }
        return compare > 0
            ? BinarySearch(localSource, localValue, localComparer, startIndex, middleIndex - 1)
            : BinarySearch(localSource, localValue, localComparer, middleIndex + 1, endIndex);
    }
    return BinarySearch(source, value, comparer ?? Comparer<T>.Default, 0, source.Count - 1);
}
```

Local function is just a syntactic sugar. The above code is compiled to the previous implementation, where the local function is compiled to a normal method. C# local function supports closure, so above local function can be further simplified.

## Closure

In object-oriented programming, it is [perfectly nature normal thing](http://www.bbc.co.uk/films/2003/08/08/american_pie_the_wedding_2003_review.shtml) for a method to access data inside or outside its body:

```csharp
internal class Display
{
    int outer = 1; // Outside the scope of method Add.

    internal void Add()
    {
        int local = 2; // Inside the scope of method Add.
        (local + outer).WriteLine(); // this.outer field.
    }
}
```

Here in Display type, a field is defined outside the scope of the method, so that it can be viewed as an outer variable accessed by the method, in contrast of the local variable defined inside method scope. Outer variable is also called [non-local variable](https://en.wikipedia.org/wiki/Non-local_variable) or [captured variable](https://msdn.microsoft.com/en-us/library/0yw3tz5k.aspx).

Local function supports accessing outer variable too:

```csharp
internal static void LocalFunctionClosure()
{
    int outer = 1; // Outside the scope of function Add.
    void Add()
    {
        int local = 2; // Inside the scope of function Add.
        (local + outer).WriteLine();
    }
    Add(); // 3
}
```

This capability for a function or method to access an outer value, is called [closure](http://en.wikipedia.org/wiki/Closure_\(computer_programming\)). C# closure is a syntactic sugar. Above local function example is compiled to:

```csharp
[CompilerGenerated]
[StructLayout(LayoutKind.Auto)]
private struct Display0
{
    public int Outer;
}

private static void Add(ref Display0 display)
{
    int local = 2;
    (local + display.Outer).WriteLine();
}

internal static void CompiledLocalFunctionClosure()
{
    int outer = 1; // Outside the scope of function Add.
    Display0 display = new Display0() { Outer = outer };
    Add(ref display); // 3
}
```

C# compiler generates:

-   A Display0 structure as a container. It has filed to store the outer variables; if there are more local functions accessing outer variables, more display structures Display1, Display2, … are generated for each of those local functions.
-   A normal named method to represent the local function
-   A display structure parameter to the generated method, so that the accessed outer variables are stored in the display structure and passed to the method. In the method body, the reference to outer variable is compiled to reference to the display structure parameter’s field.

So C# compiler implements closure, a functional feature, by generating object-oriented code.

With closure, the above binary search’s local function can be simplified as:

```csharp
internal static int BinarySearchWithClosure<T>(this IList<T> source, T value, IComparer<T> comparer = null)
{
    int BinarySearch(int startIndex, int endIndex)
    {
        if (startIndex > endIndex) { return -1; }
        int middleIndex = startIndex + (endIndex - startIndex) / 2;
        int compare = comparer.Compare(source[middleIndex], value);
        if (compare == 0) { return middleIndex; }
        return compare > 0
            ? BinarySearch(startIndex, middleIndex - 1)
            : BinarySearch(middleIndex + 1, endIndex);
    }
    comparer = comparer ?? Comparer<T>.Default;
    return BinarySearch(0, source.Count - 1);
}
```

It is compiled to the same display structure and named method pattern:

```csharp
[CompilerGenerated]
[StructLayout(LayoutKind.Auto)]
private struct Display1<T>
{
    public IComparer<T> Comparer;

    public IList<T> Source;

    public T Value;
}

[CompilerGenerated]
private static int CompiledLocalBinarySearch<T>(int startIndex, int endIndex, ref Display1<T> display)
{
    if (startIndex > endIndex) { return -1; }
    int middleIndex = startIndex + (endIndex - startIndex) / 2;
    int compare = display.Comparer.Compare(display.Source[middleIndex], display.Value);
    if (compare == 0) { return middleIndex; }
    return compare <= 0
        ? CompiledLocalBinarySearch(middleIndex + 1, endIndex, ref display)
        : CompiledLocalBinarySearch(startIndex, middleIndex - 1, ref display);
}

internal static int CompiledBinarySearchWithClosure<T>(IList<T> source, T value, IComparer<T> comparer = null)
{
    Display1<T> display = new Display1<T>()
    {
        Source = source,
        Value = value,
        Comparer = comparer
    };
    return CompiledLocalBinarySearch(0, source.Count - 1, ref display);
}
```

### Outer variable

Apparently, outer variable can change, when this happens, the accessing local functions can be impacted. In the previous example, if the outer variable changes, the sum of outer variable and local variable is apparently different:

```csharp
internal static void Outer()
{
    int outer = 1; // Outside the scope of function Add.
    void Add()
    {
        int local = 2; // Inside the scope of function Add.
        (local + outer).WriteLine();
    }
    Add(); // 3
    outer = 3; // Outer variable can change.
    Add(); // 5
}
```

Sometimes, this can be source of problems:

```csharp
internal static void OuterReference()
{
    List<Action> localFunctions = new List<Action>();
    for (int outer = 0; outer < 3; outer++)
    {
        void LocalFunction()
        {
            (outer).WriteLine(); // outer is 0, 1, 2.
        }
        localFunctions.Add(LocalFunction);
    } // outer is 3.
    foreach (Action localFunction in localFunctions)
    {
        localFunction(); // 3 3 3 (instead of 0 1 2)
    }
}
```

In this case, the for loop has 3 iterations. In the first iteration, outer is 0, a local function is defined to write this value, and stored in a function list. In the second iteration, outer is 1, a local function is repeatedly defined to write that value and stored, and so on. Later, when calling these 3 functions, they do not output 0, 1, 2, but 3, 3, 3, because the 3 iterations of for loop share the same outer variable, when the for loop is done, the value of outer becomes 3. Calling these 3 functions outputs the latest value of outer for 3 times, so it is 3, 3, 3.

This can be resolved by taking a snapshot of shared outer variable’s current value, and store it in another variable that does not change:

```csharp
internal static void CopyOuterReference()
{
    List<Action> localFunctions = new List<Action>();
    for (int outer = 0; outer < 3; outer++)
    {
        int copyOfOuter = outer; // outer is 0, 1, 2.
        // When outer changes, copyOfOuter does not change.
        void LocalFunction()
        {
            copyOfOuter.WriteLine();
        }
        localFunctions.Add(LocalFunction);
    } // copyOfOuter is 0, 1, 2.
    foreach (Action localFunction in localFunctions)
    {
        localFunction(); // 0 1 2
    }
}
```

In each iteration of for loop, outer variable changes, but each iteration copies its current value to a variable that is not shared cross local functions, and does not change value. When the for loop is done, 3 local function calls write the values of 3 independent variables, so it is 0, 1, 2 this time. Above code is compiled to:

```csharp
[CompilerGenerated]
private sealed class Display2
{
    public int CopyOfOuter;

    internal void LocalFunction()
    {
        this.CopyOfOuter..WriteLine();
    }
}

internal static void CompiledCopyOuterReference()
{
    List<Action> localFunctions = new List<Action>();
    for (int outer = 0; outer < 3; outer++)
    {
        Display2 display = new Display2() { CopyOfOuter = outer }; // outer is 0, 1, 2.
        // When outer changes, display.CopyOfOuter does not change.
        localFunctions.Add(display.LocalFunction);
    } // display.CcopyOfOuter is 0, 1, 2.
    foreach (Action localFunction in localFunctions)
    {
        localFunction(); // 0 1 2
    }
}
```

As expected, copyOfOuter variable becomes the field of display structure. And this time the local function is compiled to be a instance method of the display structure to access that field. In 3 iterations of the for loop, 3 independent instances of the display structure are constructed. When the for loop is done, each structure’s instance methods is called to write its own field value.

### Implicit reference

C# closure is a powerful syntactic sugar to enable local function to directly access outer variable. However, it comes with a price. Closure can also be performance pitfall, because a hidden reference is persisted by the generated display structure’s field. As a result, closure extends the outer variable’s lifetime to the display structure’ lifetime, but the display structure is invisible at design time, so its life time is not intuitive. In the last example, copyOfOuter is a temporary variable inside the for loop block, but its value is persisted after for loop finishes executing all iterations. After 3 iterations, in total there are 3 copyOfOuter values still persisted as field by 3 structure instances. The following is another example of implicit reference:

```csharp
internal static partial class Functions
{

    internal static void Reference()
    {
        byte[] shortLife = new byte[0X7FFFFFC7]; // Local variable of large array (Array.MaxByteArrayLength).
        // ...
        void LocalFunction()
        {
            // ...
            byte @byte = shortLife[0]; // Closure.
            // ...
        }
        // ...
        LocalFunction();
        // ...
        longLife = LocalFunction; // Reference from longLife to shortLife.
    }
}
```

The large byte array is a temp variable supposed to have a short life, but it is accessed by local function as an outer variable, and the local function is stored with a static field with a long life. The compiler generates a display structure:

```csharp
internal static partial class Functions
{
    [CompilerGenerated]
    private sealed class Display3
    {
        public byte[] ShortLife;

        internal void LocalFunction()
        {
            // ...
            byte @byte = this.ShortLife[0];
            // ...
        }
    }

    internal static void CompiledReference()
    {
        byte[] shortLife = new byte[0X7FFFFFC7]; // Local variable of large array (Array.MaxByteArrayLength).
        // ...
        Display3 display = new Display3();
        display.ShortLife = shortLife;
        display.LocalFunction();
        // ...
        longLife = display.LocalFunction;
        // Now longLife.ShortLife holds the reference to the huge large array.
    }
}
```

The large temp array, accessed as a outer variable, becomes a filed of the display structure, and the local function becomes a method of the display structure. When the local function is stored, actually it is a member of the display structure instance stored. So the display structure or its field cannot be garbage collected by runtime. As a result, this extended the shortLife variable’s life to the longLife static field’s life. Implicit reference problem exists in C#. Other languages supporting closure, like VB, F#, JavaScript, etc., have the same pitfall too. Closure must be used with caution.