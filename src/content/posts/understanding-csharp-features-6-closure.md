---
title: "Understanding C# Features (6) Closure"
published: 2016-01-18
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# Features", "Closure", "Functional Programming", "LINQ", "LINQ via C#"]
category: "C#"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

## Non-local variable

In a C# class, it is [perfectly nature normal thing](http://www.bbc.co.uk/films/2003/08/08/american_pie_the_wedding_2003_review.shtml) for a method to access a variable defined inside or outside its body, e.g.:

```csharp
public class DisplayClass
{
    int nonLocalVariable = 0; // Outside the scope of method Add.

    public int Add()
    {
        int localVariable = 1; // Inside the scope of method Add.
        return localVariable + nonLocalVariable; // 1.
    }
}
```

Here in DisplayClass, the field is defined outside the scope of the method, so that it can be viewed as a [non-local variable](https://en.wikipedia.org/wiki/Non-local_variable) of method, in contrast of the local variable defined inside method scope. Non-local variable is also called [captured variable](https://msdn.microsoft.com/en-us/library/0yw3tz5k.aspx). This tutorial uses term non-local variable, because it is more specific.

The concept of non-local variable also applies to lambda expression:

```csharp
public static partial class Closure
{
    public static void Outer()
    {
        int nonLocalVariable = 0; // Outside the scope of function add.
        Func<int> add = () =>
            {
                int localVariable = 1; // Inside the scope of function add.
                return localVariable + nonLocalVariable;
            };

        int result = add(); // 1;
    }
}
```

nonLocalVariable is defined outside the scope of function add, so it is a non-local variable of add, in contrast of the local variable defined inside add. This capability for a function or method to reference a non-local value, is called [closure](http://en.wikipedia.org/wiki/Closure_\(computer_programming\)).

## Compilation

In above lambda expression example, nonLocalVariable is created in the scope of outer method Lambda, and it does not exist at all in the scope of inner function add. How does this function access nonLocalVariable? Above DisplayClass example is the answer:

```csharp
public static class CompiledClosure
{
    [CompilerGenerated]
    private sealed class DisplayClass0
    {
        public int nonLocalVariable;

        internal int Add()
        {
            int localVariable = 1;
            return localVariable + this.nonLocalVariable;
        }
    }

    public static void Outer()
    {
        DisplayClass0 displayClass0 = new DisplayClass0();
        displayClass0.nonLocalVariable = 0;
        Func<int> add = displayClass0.Add;
        int result = add(); // 1.
    }
}
```

C# compiler generates:

-   A inner class (DisplayClass0) to host the lambda expression; if there are more lambda expressions accessing non-local variables, more inner classes (DisplayClass1, …) will be generated to host these lambda expressions.
-   A method (Add) to represent the function (add)
-   A field to represent the non-local variable (nonLocalVariable). If there are more non-local variables accessed by that lambda expression, more fields will be generated to represent each of these non-local variables.

The generated logic becomes exactly the same case as the initial example. Accessing non-local variable becomes accessing field of the same class, naturally.

In the Outer method, the inner add function creation becomes the instantiation of DisplayClass0. the non-local variable is passed by assigning it to the corresponding field. And, of course, the inner function call becomes a normal method call. C# closure is such a powerful syntactic sugar, which greatly simplifies the code.

## Non-local variable can change

In above examples, non-local variables does not change. But if they changes, of course the referencing functions will be impacted, e.g.:

```csharp
public static void ChangedNonLocal()
{
    int nonLocalVariable = 1; // Outside the scope of function add.
    Func<int> add = () =>
    {
        int localVariable = 0; // Inside the scope of function add.
        return localVariable + nonLocalVariable;
    };

    nonLocalVariable = 2; // Non-local variable can change.
    int result = add(); // 2 instead of 1.
}
```

Sometimes, this can be confusing:

```csharp
public static void MultipleReferences()
{
    List<Func<int>> functions = new List<Func<int>>(3);
    for (int nonLocalVariable = 0; nonLocalVariable < 3; nonLocalVariable++) // Outside the scope of function print.
    {
        Func<int> function = () => nonLocalVariable; // nonLocalVariable: 0, 1, 2.
        functions.Add(function);
    }

    // Now nonLocalVariable is 3.
    foreach (Func<int> function in functions)
    {
        int result = function();
        Trace.WriteLine(result); // 3, 3, 3 instead of 0, 1, 2.
    }
}
```

In this case, 3 functions are created by the for loop. The nonLocalVariable is 0, 1, 2, when each function is created. However, when the for loop finishes executing, nonLocalVariable becomes 3. So when calling each of these 3 functions, the output will be 3, 3, 3 instead of 0, 1, 2.

This can be resolved by copying the current value of nonLocalVariable:

```csharp
public static void CopyCurrent()
{
    List<Func<int>> functions = new List<Func<int>>(3);
    for (int nonLocalVariable = 0; nonLocalVariable < 3; nonLocalVariable++) // Outside the scope of function print.
    {
        int copyOfCurrentValue = nonLocalVariable; // nonLocalVariable: 0, 1, 2.
        // When nonLocalVariable changes, copyOfIntermediateState does not change.
        Func<int> function = () => copyOfCurrentValue; // copyOfCurrentValue: 0, 1, 2.
        functions.Add(function);
    }

    // Now nonLocalVariable is 3. Each copyOfCurrentValue does not change.
    foreach (Func<int> function in functions)
    {
        int result = function();
        Trace.WriteLine(result); // 0, 1, 2.
    }
}
```

## Hidden reference

The closure syntactic sugar enables direct access to non-local variable. This convenience has a price. Closure can also be performance pitfall, because a hidden reference is persisted by the generated DisplayClass’s field. As a result, the non-local variable’s lifetime can be extended by closure. In the last example, copyOfCurrentValue is a temporary variable inside the for loop block, but its value is not gone after each iteration. After 3 iterations, the 3 copyOfCurrentValue values are still persisted by 3 functions, so that later the functions can use each of the values.

Here is another intuitive example:

```csharp
public static partial class Closure
{
    private static Func<int> longLifeFunction;

    public static void Reference()
    {
        // https://msdn.microsoft.com/en-us/library/System.Array.aspx
        byte[] shortLifeVariable = new byte[0X7FFFFFC7];
        // Some code...
        longLifeFunction = () =>
        {
            // Some code...
            byte value = shortLifeVariable[0]; // Reference.
            // More code...
            return 0;
        };
        // More code...
    }
}
```

If Reference method is called, a closure will be created:

-   A lambda expression is created, and it persists a reference to its non-local variable shortLifeVariable.
-   Then the lambda expression is persisted by Closure class’s static field longLifeFunction

Here shortLifeVariable is no longer a short lifetime temporary variable inside method Reference. Its lifetime is extended to be the same as longLifeFunction, which can be forever. When Reference method finishes executing, the allocated memory for the big byte array cannot be garbage collected. In closure, the reference can be very unapparent and unobvious. Other languages with closure support, like VB, F#, [JavaScript](http://en.wikipedia.org/wiki/JavaScript), etc., have the same issue too. Closure must be used with caution.