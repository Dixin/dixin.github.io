---
title: "C# Functional Programming In-Depth (6) Anonymous Function and Lambda Expression"
published: 2019-06-06
description: "Besides named function, C# also supports anonymous function, represented by anonymous method or lambda expression with no function name at design time. Lambda expression can also represent expression"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# 6.0", "C# Features", "Functional C#", "Functional Programming", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

Besides named function, C# also supports anonymous function, represented by anonymous method or lambda expression with no function name at design time. Lambda expression can also represent expression tree, This chapter discusses lambda expression as a functional feature of C# language. Lambda expression is also the core concept of lambda calculus, where functional programming originates. It is revisited in the Lambda Calculus chapters.

## Anonymous method

As discussed in the delegate chapter, a function can be represented by a delegate instance, and delegate instance can be initialized with a named function:

internal static bool IsPositive(int int32) { return int32 > 0; }

```csharp
internal static void NamedFunction()
```
```csharp
{
```
```csharp
Func<int, bool> isPositive = IsPositive;
```
```csharp
bool result = isPositive(0);
```

}

C# 2.0 introduces a syntactic sugar called anonymous method, enabling function to be defined inline with the delegate keyword. The above function can be inline as:

internal static void AnonymousMethod()

```csharp
{
```
```csharp
Func<int, bool> isPositive = delegate (int int32) { return int32 > 0; };
```
```csharp
bool result = isPositive(0);
```

}

This time delegate instance is initialized with an anonymous function, which does not have function name at design time. At compile time, a named function is generated. The above example is compiled to:

\[CompilerGenerated\]

```csharp
private static Func<int, bool> cachedIsPositive;
```

```csharp
[CompilerGenerated]
```
```csharp
private static bool CompiledIsPositive(int int32) { return int32 > 0; }
```

```csharp
internal static void CompiledAnonymousMethod()
```
```csharp
{
```
```csharp
Func<int, bool> isPositive;
```
```csharp
if (cachedIsPositive == null)
```
```csharp
{
```
```csharp
cachedIsPositive = new Func<int, bool>(CompiledIsPositive);
```
```csharp
}
```
```csharp
isPositive = cachedIsPositive;
```
```csharp
bool result = isPositive.Invoke(0);
```

}

Besides named function, C# compiler also generates a cache field for performance. As discussed in the delegate chapter, a delegate instance is actually an object with an Invoke method. When AnonymousMethod is called for the first time, the delegate instance is constructed with the generated named function, and stored in the static cache fieled forever. When AnonymousMethod is called again, the cached delegate instance is reused.

## Lambda expression as anonymous function

C# 3.0 introduces lambda expression syntactic sugar, which can define anonymous function with a lambda operator instead of delegate keyword:

internal static void AnonymousFunction()

```csharp
{
```
```csharp
Func<int, bool> isPositive = (int int32) => { return int32 > 0; };
```
```csharp
// Equivalent to: Func<int, bool> isPositive = int32 => int32 > 0;
```
```csharp
bool result = isPositive(0);
```

}

Its compilation is identical to above anonymous method example. The => operator is called lambda operator and reads “go to”. Lambda expression can be further shortened:

· if the type of parameter can be inferred (for example, from the specified function type), the type of parameter can be omitted. In above example, the lambda expression’s parameter type can be inferred to be int from the provided function type int –> bool, so it can be simplified to (int32) => { return int32 > 0; }.

· if lambda expression has one parameter, the parentheses for the parameter can be omitted. So, the above lambda expression can be simplified to int32 => { return int32 > 0; }.

· if the body of the lambda expression has only one statement, the curly brackets for the body and the return keyword can be omitted, which is call expression body syntax. So, the above lambda expression can be just int32 => int32 > 0.

Lambda expression with expression body are called expression lambda, for example:

internal static void ExpressionLambda()

```csharp
{
```
```csharp
Func<int, int, int> add = (int32A, int32B) => int32A + int32B;
```
```csharp
Func<int, bool>isPositive = int32 => int32 > 0;
```
```csharp
Action<int> traceLine = int32 => int32.WriteLine();
```

}

When a lambda expression having more than one statements in the body, its body has to be a block with curly brackets. It is called statement lambda:

internal static void StatementLambda()

```csharp
{
```
```csharp
Func<int, int, int> add = (int32A, int32B) =>
```
```csharp
{
```
```csharp
int sum = int32A + int32B;
```
```csharp
return sum;
```
```csharp
};
```
```csharp
Func<int, bool>isPositive = int32 =>
```
```csharp
{
```
```csharp
int32.WriteLine();
```
```csharp
return int32> 0;
```
```csharp
};
```
```csharp
Action<int> traceLine = int32 =>
```
```csharp
{
```
```csharp
int32.WriteLine();
```
```csharp
Trace.Flush();
```
```csharp
};
```

}

For delegate instantiation, lambda expression (both expression lambda and statement lambda) can also be used with the constructor call syntax and type conversion syntax, which is similar to using named function discussed in the delegate chapter:

internal static void Constructor()

```csharp
{
```
```csharp
Func<int, bool> isPositive = new Func<int, bool>(int32 => int32 > 0);
```
```csharp
bool result = isPositive(0);
```
```csharp
}
```

```csharp
internal static void Conversion()
```
```csharp
{
```
```csharp
Func<int, bool> isPositive = (Func<int, bool>)(int32 => int32 > 0);
```
```csharp
bool result = isPositive(0);
```
```csharp
}
```

```csharp
internal static void Simplified()
```
```csharp
{
```
```csharp
Func<int, bool> isPositive = int32 => int32 > 0;
```
```csharp
bool result = isPositive(0);
```

}

These 3 syntaxes are compiled identically.

### Immediately-invoked function expression

An anonymous function is not required to be assigned to a function variable. It can be used directly. The following example directly calls an anonymous function definition. Unfortunately, it cannot be compiled:

internal static void CallAnonymousFunction(int arg)

```csharp
{
```
```csharp
(int32 => int32 > 0)(arg); // Cannot be compiled..
```

}

The reason is, C# compiler cannot inter the type information of the lambda expression. The type information can be provided with the constructor call or type conversion syntax above code cannot be compiled because C# compiler cannot infer any type for the lambda expression. For this kind of IIFE (), the above constructor call syntax, or type conversion syntax can be used to provide type information to compiler:

internal static void CallLambdaExpressionWithConstructor(int arg)

```csharp
{
```
```csharp
bool result = new Func<int, bool>(int32 => int32 > 0)(arg);
```
```csharp
}
```

```csharp
internal static void CallLambdaExpressionWithConversion(int arg)
```
```csharp
{
```
```csharp
bool result = ((Func<int, bool>)(int32 => int32 > 0))(arg);
```

}

In functional programming, this pattern is called immediately-invoked function expression (IIFE). There is no function name or function variable (delegate instance) name involved at design time. At compile time, C# compiler generates identical code of named function for the above 2 syntaxes:

\[CompilerGenerated\]

```csharp
[Serializable]
```
```csharp
private sealed class Functions
```
```csharp
{
```
```csharp
public static readonly Functions Singleton = new Functions();
```

```csharp
public static Func<int, bool> cachedIsPositive;
```

```csharp
internal bool IsPositive(int int32) { return int32 > 0; }
```
```csharp
}
```

```csharp
internal static void CompiledCallLambdaExpressionWithConstructor()
```
```csharp
{
```
```csharp
Func<int, bool> isPositive;
```
```csharp
if (Functions.cachedIsPositive == null)
```
```csharp
{
```
```csharp
Functions.cachedIsPositive = new Func<int, bool>(Functions.Singleton.IsPositive);
```
```csharp
}
```
```csharp
isPositive = Functions.cachedIsPositive;
```
```csharp
bool result = isPositive.Invoke(1);
```

}

Here are a few more examples of IIFE:

internal static void ImmediatelyInvokedFunctionExpression()

```csharp
{
```
```csharp
new Func<int, int, int>((int32A, int32B) => int32A + int32B)(1, 2);
```
```csharp
new Action<int>(int32 => int32.WriteLine())(1);
```

```csharp
new Func<int, int, int>((int32A, int32B) =>
```
```csharp
{
```
```csharp
int sum = int32A + int32B;
```
```csharp
return sum;
```
```csharp
})(1, 2);
```
```csharp
new Func<int, bool>(int32 =>
```
```csharp
{
```
```csharp
int32.WriteLine();
```
```csharp
return int32> 0;
```
```csharp
})(1);
```
```csharp
new Action<int>(int32 =>
```
```csharp
{
```
```csharp
int32.WriteLine();
```
```csharp
Trace.Flush();
```
```csharp
})(1);
```

}

In some other strongly-typed functional languages, like F#, Haskell, etc. the type information can be omitted at design time and inferred at compile time the type information is also not needed for dynamic functional languages, like JavaScript. IIFE was commonly used in JavaScript to modularize or isolate code in the function scope, until the ECMAScript 2015 standard introduces module and block scope to JavaScript.

### Closure

Similar to local function, anonymous function also supports closure for capturing free variable:

internal static void AnonymousFunctionWithClosure()

```csharp
{
```
```csharp
int free = 1; // Outside anonynmous function.
```
```csharp
new Action(() =>
```
```csharp
{
```
```csharp
int local = 2; // Inside anonymous function.
```
```csharp
(local + free).WriteLine();
```
```csharp
})(); // 3
```

}

Its compilation is also similar to local function. The difference is, C# compiler generates closure structure for local function, while it generates closure class for anonymous function, which requires heap allocation and can be a performance overhead. The above code is compiled to:

\[CompilerGenerated\]

```csharp
private sealed class Closure1
```
```csharp
{
```
```csharp
public int Free;
```

```csharp
internal void Add()
```
```csharp
{
```
```csharp
int local = 2;
```
```csharp
(local + this.Free).WriteLine();
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void CompiledAnonymousFunctionWithClosure()
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
closure.Add(); // 3
```

}

Similar to local function, the closure of anonymous function may also introduce the same performance pitfall of memory leak. Closure must be used with caution for anonymous function too, whenever an anonymous function may live longer than the execution of outer function.

## Expression bodied function member

C# 6.0 and 7.0 introduce expression bodied function member of type. It enables anonymous function’s lambda operator and expression body syntactic sugar to simplify all kinds of named functions, including instance method, static method, extension method, as well as static constructor, constructor, conversion operator, operator overload, getter only property, property getter, property setter, getter only indexer, indexer getter, indexer setter. It also works for local function:

internal partial class Data

```csharp
{
```
```csharp
private int value;
```

```csharp
static Data() => MethodBase.GetCurrentMethod().Name.WriteLine(); // Static constructor.
```

```csharp
internal Data(int value) => this.value = value; // Constructor.
```

```csharp
~Data() => MethodBase.GetCurrentMethod().Name.WriteLine(); // Finalizer.
```

```csharp
internal bool InstanceEquals(Data other) => this.value == other?.value; // Instance method.
```

```csharp
internal static bool StaticEquals(Data @this, Data other) => @this?.value == other?.value; // Static method.
```

```csharp
public static Data operator +(Data data1, Data data2) => new Data(data1.value + data2.value); // Operator overload.
```

```csharp
public static explicit operator int(Data value) => value.value; // Explicit conversion operator.
```

```csharp
public static implicit operator Data(int value) => new Data(value); // Implicit conversion operator.
```

```csharp
internal int ReadOnlyValue => this.value; // Getter only property.
```

```csharp
internal int ReadWriteValue
```
```csharp
{
```
```csharp
get => this.value; // Property getter.
```
```csharp
set => this.value = value; // Property setter.
```
```csharp
}
```

```csharp
internal int this[long index] => throw new NotImplementedException(); // Getter only indexer.
```

```csharp
internal int this[int index]
```
```csharp
{
```
```csharp
get => throw new NotImplementedException(); // Indexer getter.
```
```csharp
set => throw new NotImplementedException(); // Indexer setter.
```
```csharp
}
```

```csharp
internal event EventHandler Created
```
```csharp
{
```
```csharp
add => MethodBase.GetCurrentMethod().Name.WriteLine(); // Event accessor.
```
```csharp
remove => MethodBase.GetCurrentMethod().Name.WriteLine(); // Event accessor.
```
```csharp
}
```

```csharp
internal int GetValue()
```
```csharp
{
```
```csharp
int LocalFunction() => this.value; // Local function.
```
```csharp
return LocalFunction();
```
```csharp
}
```

}

This syntax works for extension method and interface explicit implementation too:

internal internal static partial class DataExtensions

```csharp
{
```
```csharp
internal static bool ExtensionEquals(Data @this, Data other) => @this?.ReadOnlyValue == other?.ReadOnlyValue; // Extension method.
```
```csharp
}
```

```csharp
internal partial class Data : IEquatable<Data>
```
```csharp
{
```
```csharp
bool IEquatable<Data>.Equals(Data other) => this.value == other?.value; // Explicit interface implementation.
```

}

The expression body is just a syntactic sugar. Its compilation has no difference from the statement body with curly bracket.