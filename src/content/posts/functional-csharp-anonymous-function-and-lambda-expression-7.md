---
title: "C# Functional Programming In-Depth (6) Anonymous Function and Lambda Expression"
published: 2018-06-06
description: "Besides named function represented by method members, C# also supports anonymous functions, represented by anonymous method or lambda expression with no name at design time. This part discussed lambda"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-anonymous-function-and-lambda-expression](/posts/functional-csharp-anonymous-function-and-lambda-expression "https://weblogs.asp.net/dixin/functional-csharp-anonymous-function-and-lambda-expression")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

Besides named function represented by method members, C# also supports anonymous functions, represented by anonymous method or lambda expression with no name at design time. This part discussed lambda expression as a functional feature of C# language. In the meanwhile, the general concept of lambda expression is the core of lambda calculus, where functional programming originates. General lambda expression and lambda calculus will be discussed in the Lambda Calculus chapter.

## Anonymous method

As fore mentioned, a function can be initialized from a named method:

```csharp
internal static partial class Functions
{
    internal static bool IsPositive(int int32)
    {
        return int32 > 0;
    }

    internal static void NamedFunction()
    {
        Func<int, bool> isPositive = IsPositive;
        bool result = isPositive(0);
    }
}
```

C# 2.0 introduces a syntactic sugar called anonymous method, enabling methods to be defined inline with the delegate keyword. The above named method can be inline as:

```csharp
internal static void AnonymousFunction()
{
    Func<int, bool> isPositive = delegate (int int32)
    {
        return int32 > 0;
    };
    bool result = isPositive(0);
}
```

There is no named method defined at design time. At compile time, compiler generates a normal named method. So the compilation is equivalent to the following:

```csharp
internal static partial class CompiledFunctions
{
    [CompilerGenerated]
    private static Func<int, bool> cachedIsPositive;

    [CompilerGenerated]
    private static bool IsPositive(int int32)
    {
        return int32 > 0;
    }

    internal static void AnonymousFunction()
    {
        Func<int, bool> isPositive;
        if (cachedIsPositive == null)
        {
            cachedIsPositive = new Func<int, bool>(IsPositive);
        }
        isPositive = cachedIsPositive;
        bool result = isPositive.Invoke(0);
    }
}
```

Besides named methods, C# compiler also generates a cache field for performance. When AnonymousMethod is called for the first time, the delegate instance is constructed, and stored in the cache filed. when AnonymousMethod is called again, the cache field is used and delegate instantiation does not execute again.

## Lambda expression

C# 3.0 introduces lambda expression syntactic sugar, so above anonymous method can be simplified as:

```csharp
internal static void Lambda()
{
    Func<int, bool> isPositive = (int int32) =>
    {
        return int32 > 0;
    };
    bool result = isPositive(0);
}
```

Its compilation is identical to above anonymous method with delegate keyword. The => operator is called lambda operator and reads “go to”. Lambda expression can be further shortened:

-   if the type of parameter can be inferred (for example, from the function type), the type declaration of parameter can be omitted. In above example, the lambda expression’s parameter type can be inferred to be int from function type int –> bool (Func<int, bool> delegate type).
-   if lambda expression has one parameter, the parentheses for the parameter can be omitted.
-   if the body of the lambda expression has only one statement, the expression body syntactic sugar applies, the curly brackets for the body and return keyword can be omitted,

Lambda expression with expression body are called expression lambda, for example:

```csharp
internal static void ExpressionLambda()
{
    Func<int, int, int> add = (int32A, int32B) => int32A + int32B;
    Func<int, bool> isPositive = int32 => int32 > 0;
    Action<int> traceLine = int32 => int32.WriteLine();
}
```

When a lambda expression having more than one statements in the body, its body has to be a block with curly brackets. It is called statement lambda:

```csharp
internal static void StatementLambda()
{
    Func<int, int, int> add = (int32A, int32B) =>
    {
        int sum = int32A + int32B;
        return sum;
    };
    Func<int, bool> isPositive = int32 =>
    {
        int32.WriteLine();
        return int32 > 0;
    };
    Action<int> traceLine = int32 =>
    {
        int32.WriteLine();
        Trace.Flush();
    };
}
```

Lambda expression (both expression lambda and statement lambda) can also be used with the constructor call syntax of delegate, or type conversion syntax:

```csharp
internal static void ConstructorCall()
{
    Func<int, int, int> add = new Func<int, int, int>((int32A, int32B) => int32A + int32B);
    Func<int, bool> isPositive = new Func<int, bool>(int32 =>
    {
        int32.WriteLine();
        return int32 > 0;
    });
}

internal static void TypeConversion()
{
    Func<int, int, int> add = (Func<int, int, int>)((int32A, int32B) => int32A + int32B));
    Func<int, bool> isPositive = (Func<int, bool>)(int32 =>
    {
        int32.WriteLine();
        return int32 > 0;
    });
}
```

## Call anonymous function

An anonymous function is not required to be assigned to a function variable. It can be used (called) directly. Unfortunately, the following syntax does not work in C#:

```csharp
internal static void CallLambdaExpression()
{
    (int32 => int32 > 0)(1); // Define an expression lambda and call.
}
```

The above code cannot be compiled because C# compiler cannot infer any type for the lambda expression. For this kind of IIFE ([immediately-invoked function expression](https://en.wikipedia.org/wiki/Immediately-invoked_function_expression)), the above constructor call syntax, or type conversion syntax can be used to provide type information to compiler:

```csharp
internal static void CallLambdaExpressionWithConstructor()
{
    bool result = new Func<int, bool>(int32 => int32 > 0)(1);
}

internal static void CallLambdaExpressionWithTypeConversion()
{
    bool result = ((Func<int, bool>)(int32 => int32 > 0))(1);
}
```

Here no function name or named function is involved at design time. At compile time, C# compiler generates identical code for the above 2 syntaxes:

```csharp
internal static partial class CompiledFunctions
{
    [CompilerGenerated]
    [Serializable]
    private sealed class Container
    {
        public static readonly Container Singleton = new Container();

        public static Func<int, bool> cachedIsPositive;

        internal bool IsPositive(int int32)
        {
            return int32 > 0;
        }
    }

    internal static void CallLambdaExpressionWithConstructor()
    {
        Func<int, bool> isPositive;
        if (Container.cachedIsPositive == null)
        {
            Container.cachedIsPositive = new Func<int, bool>(Container.Singleton.IsPositive);
        }
        isPositive = Container.cachedIsPositive;
        bool result = isPositive.Invoke(1);
    }
}
```

Here are more examples:

```csharp
internal static void CallAnonymousFunction()
{
    new Func<int, int, int>((int32A, int32B) => int32A + int32B)(1, 2);
    new Action<int>(int32 => int32.WriteLine())(1);

    new Func<int, int, int>((int32A, int32B) =>
    {
        int sum = int32A + int32B;
        return sum;
    })(1, 2);
    new Func<int, bool>(int32 =>
    {
        int32.WriteLine();
        return int32 > 0;
    })(1);
    new Action<int>(int32 =>
    {
        int32.WriteLine();
        Trace.Flush();
    })(1);
}
```

Some other functional languages support the IIFE syntax without type information. For example, F# compiler can infer the types in the following lambda expression:

```csharp
(fun value -> value > 0) 1
```

Regarding value is compared with int value 1 with the > operator, F# infers parameter value is of type int, and also infers return type is bool from the result type of the > operator for int. Similarly, the following lambda expression works in Haskell (named after [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry), mathematician and logician):

```csharp
(\value -> value > 0) 1
```

This can also work In some loosely typed languages, like JavaScript:

```csharp
(value => value > 0)(1);

(function(value) {
     return value > 0;
})(1);
```

## Closure

Anonymous function has the same closure capability as local function:

```csharp
internal static partial class Functions
{
    internal static void Closure()
    {
        int outer = 1; // Outside the scope of anonymous function.
        new Action(() =>
        {
            int local = 2; // Inside the scope of anonymous function.
            (local + outer).WriteLine();
        })();
    }
}
```

Its compilation is also similar to local function. The difference is, C# compiler generates display structure for local function, and generates display class for anonymous function. The above code is compiled to:

```csharp
[CompilerGenerated]
private sealed class DisplayClass0
{
    public int Outer;

    internal void Add()
    {
        int local = 2;
        (local + this.Outer).WriteLine();
    }
}

internal static void CompiledClosure()
{
    int outer = 1;
    DisplayClass0 display = new DisplayClass0(){ Outer = outer };
    display.Add(); // 3
}
```

Just like local function, the closure and display class of anonymous function can introduce the same implicit references. Closure must be used with caution for anonymous function too, to avoid the performance pitfall.

## Expression bodied function member

C# 6.0 and 7.0 introduce expression body syntax, which applies the above lambda syntax to simplify function member’s body to an expression. This syntax works for all named functions, including instance method, static method, extension method, as well as static constructor, constructor, conversion operator, operator overload, property, property getter, property setter, indexer, indexer getter, indexer setter. It also works for local function:

```csharp
internal partial class Data
{
    private int value;

    static Data() => MethodBase.GetCurrentMethod().Name.WriteLine(); // Static constructor.

    internal Data(int value) => this.value = value; // Constructor.

    ~Data() => Trace.WriteLine(MethodBase.GetCurrentMethod().Name); // Finalizer.

    internal bool Equals(Data other) => this.value == other.value; // Instance method.

    internal static bool Equals(Data @this, Data other) => @this.value == other.value; // Static method.

    public static Data operator +(Data data1, Data Data) => new Data(data1.value + Data.value); // Operator overload.

    public static explicit operator int(Data value) => value.value; // Conversion operator.

    public static implicit operator Data(int value) => new Data(value); // Conversion operator.

    internal int ReadOnlyValue => this.value; // Property.

    internal int ReadWriteValue
    {
        get => this.value; // Property getter.
        set => this.value = value; // Property setter.
    }

    internal int this[long index] => throw new NotImplementedException(); // Indexer.

    internal int this[int index]
    {
        get => throw new NotImplementedException(); // Indexer getter.
        set => throw new NotImplementedException(); // Indexer setter.
    }

    internal event EventHandler Created
    {
        add => Trace.WriteLine(MethodBase.GetCurrentMethod().Name); // Event accessor.
        remove => Trace.WriteLine(MethodBase.GetCurrentMethod().Name); // Event accessor.
    }

    internal int GetValue()
    {
        int LocalFunction() => this.value; // Local function.
        return LocalFunction();
    }
}

internal static partial class DataExtensions
{
    internal static bool Equals(Data @this, Data other) => @this.ReadOnlyValue == other.Value; // Extension method.
}
```

This syntax works for interface explicit implementation too:

```typescript
internal partial class Data : IComparable<Data>
{
    int IComparable<Data>.CompareTo(Data other) => this.value.CompareTo(other.value); // Explicit interface implementation.
}
```

The expression body is purely a syntactic sugar, it is compiled the same way as normal block body with curly bracket.