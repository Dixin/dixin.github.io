---
title: "Understanding C# Features (7) Higher-Order Function"
published: 2016-01-18
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ via C#", "C# Features", "Higher-Order"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

## Function as input/output

[Higher-order function](http://en.wikipedia.org/wiki/Higher-order_function) is a function taking one or more function parameters as input, or returning a function as output. The other functions are called first-order functions. (Again, in C#, the term function and the term method are identical.) C# supports higher-order function from the beginning, since a C# function can use almost anything as its input/output, except:

-   Static types, like System.Convert, System.Math, etc., because there cannot be a value (instance) of a static type.
-   Special types in .NET framework, like System.Void.

A first-order function can take some data value as input and output:

```csharp
public class DataType { }

public static DataType FirstOrder(DataType dataValue)
{
    return dataValue;
}

public static void CallFirstOrder()
{
    DataType inputValue = default(DataType);
    DataType outputValue = FirstOrder(inputValue);
}
```

To get a higher-order function, just replace above DataType/dataValue with a function type/function value. In C#, delegate type can be viewed as function type, and delegate instance can be viewed as function value (instance). So:
```
public delegate void FunctionType();

public static FunctionType HigherOrder(FunctionType functionValue)
{
    return functionValue;
}

public static void CallHigherOrder()
{
    FunctionType inputValue = default(FunctionType);
    FunctionType outputValue = HigherOrder(inputValue);
}
```

Above HigherOrder becomes a higher-order function takes function as input and output.

Besides named function, anonymous first-order/higher-order functions can be easily expressed with lambda expression:
```
public static partial class HigherOrderFunction
{
    public static void Lambda()
    {
        Action firstOrder1 = () => { };
        Action<Action> higherOrder1 = action => action();

        Func<int> firstOrder2 = () => default(int);
        Func<Func<int>> higherOrder2 = () => firstOrder2;
    }
}
```

Higher-order functions are everywhere in .NET framework, like fore mentioned Sort method of List<T>. It’s signature is:

```csharp
namespace System.Collections.Generic
{
    public class List<T>
    {
        public void Sort(Comparison<T> comparison);
    }
}
```

Its comparison parameter is a function value of Comparison<T> function type:

```csharp
namespace System
{
    public delegate int Comparison<in T>(T x, T y);
}
```

Most LINQ query methods are higher-order functions, like Where. Its signature is:
```
public static IEnumerable<TSource> Where<TSource>(this IEnumerable<TSource> source, Func<TSource, bool> predicate);
```

Its predicate parameter is a function value of function type Func<TSource, bool>:
```
public static partial class LinqToObjects
{
    public static IEnumerable<int> Positive(IEnumerable<int> source)
    {
        return source.Where(value => value > 0);
    }
}
```

## First-class function

So far C# has been demonstrated to have [first class functions](https://en.wikipedia.org/wiki/First-class_function). C# function can be compared to C# object side by side:

<table border="0" cellpadding="0" cellspacing="0" width="767"><tbody><tr><td valign="top" width="87"></td><td valign="top" width="236">Data (object)</td><td valign="top" width="442">Function (method)</td></tr><tr><td valign="top" width="87">Type</td><td valign="top" width="236">Object type: class</td><td valign="top" width="442">Function type: delegate type</td></tr><tr><td valign="top" width="87">Value</td><td valign="top" width="236">Object: class instance</td><td valign="top" width="442">Function value: delegate instance</td></tr><tr><td valign="top" width="87">Assignment</td><td valign="top" width="236">Can be assigned to variable</td><td valign="top" width="442">Can be assigned to variable</td></tr><tr><td valign="top" width="87">Storage</td><td valign="top" width="236">Can be stored in data structure</td><td valign="top" width="442">Can be stored in data structure</td></tr><tr><td valign="top" width="87">Input</td><td valign="top" width="236">Can be function’s parameter</td><td valign="top" width="442">Can be higher-order function’s parameter</td></tr><tr><td valign="top" width="87">Output</td><td valign="top" width="236">Can be function’s return value</td><td valign="top" width="442">Can be higher-order function’s return value</td></tr><tr><td valign="top" width="87">Nesting</td><td valign="top" width="236">Can be nested (e.g. Exception.InnerException)</td><td valign="top" width="442">Can be nested (function in function): anonymous function, lambda expression, closure with non-local variable access</td></tr><tr><td valign="top" width="87">Equality</td><td valign="top" width="236">Reference equality testable</td><td valign="top" width="442">Reference equality testable</td></tr></tbody></table>

They can have type and instance:

```csharp
public static partial class FirstClass
{
    public class ObjectType
    {
        public ObjectType InnerObject { get; set; }
    }

    public delegate void FunctionType();

    public static void ObjectInstance()
    {
        ObjectType objectValue = new ObjectType();
    }

    public static void FunctionInstance()
    {
        FunctionType functionValue1 = FunctionInstance; // Named function.
        FunctionType functionValue2 = () => { }; // Anonymous function.
    }
}
```

They can be stored in data structure:
```
public static partial class FirstClass
{
    public static ObjectType objectField = new ObjectType();

    public static FunctionType functionField1 = FunctionInstance; // Named function.

    public static FunctionType functionField2 = () => { }; // Anonymous function.
}
```

They can be function parameter and return value:
```
public static partial class FirstClass
{
    public static ObjectType InputOutputObject(ObjectType objectValue) => objectValue;

    public static FunctionType InputOutputFunction(FunctionType functionValue) => functionValue;
}
```

They can be nested:
```
public static partial class FirstClass
{
    public static void NestedObject()
    {
        ObjectType outerObject = new ObjectType()
        {
            InnerObject = new ObjectType()
        };
    }

    public static void NestedFunction()
    {
        object nonLocalVariable = new object();
        FunctionType outerFunction = () =>
            {
                object outerLocalVariable = nonLocalVariable;
                FunctionType innerFunction = () =>
                    {
                        object innerLocalVariable = nonLocalVariable;
                    };
            };
    }
}
```

They are reference equality testable:
```
public static partial class FirstClass
{
    public static void ObjectEquality()
    {
        ObjectType objectValue1;
        ObjectType objectValue2;
        objectValue1 = objectValue2 = new ObjectType();
        bool areEqual1 = objectValue1 == objectValue2; // true.

        ObjectType objectValue3 = null;
        bool areEqual2 = objectValue2 == objectValue3; // false.
    }

    public static void FunctionEquality()
    {
        FunctionType functionValue1;
        FunctionType functionValue2;
        functionValue1 = functionValue2 = () => { };
        bool areEqual1 = functionValue1 == functionValue2; // true.

        FunctionType functionValue3 = null;
        bool areEqual2 = functionValue2 == functionValue3; // false.
    }
}
```

Apparently, C# treats functions as [first-class citizen](https://en.wikipedia.org/wiki/First-class_citizen), just like C# objects.