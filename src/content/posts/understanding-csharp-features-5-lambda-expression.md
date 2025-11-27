---
title: "Understanding C# Features (5) Lambda Expression, Anonymous Function and Expression Tree"
published: 2009-11-29
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# Features", "F#", "Functional Programming", "Haskell", "JavaScript", "LINQ", "LINQ via C#"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

C# [lambda expression](http://msdn.microsoft.com/en-us/library/bb397687.aspx) is a syntax to create delegates or expression trees. It is a very powerful syntactic sugar making C# functional. In this part, “Lambda expression” simply means “C# lambda expression”. The native concept of lambda expression will be fully covered in later chapter.

At syntax level, a lambda expression can be simply viewed as a function or method without name, which looks like method parameter(s) => method body, or method parameter(s) => method return value. the => operator is called lambda operator and reads “go to”.

## Lambda expression as anonymous function

### Delegate and named method

In C#, a delegate definition can be viewed as a method type definition (method signature):

```csharp
namespace System
{
    public delegate TResult Func<in T, out TResult>(T arg);
}
```

If a named method (either static or instance method) has exactly the same signature as above Func<int, bool>, e.g.:

```csharp
public static bool IsPositive(int int32)
{
    return int32 > 0;
}
```

then delegate can be instantiated by calling the constructor with the named method:

```csharp
Func<int, bool> isPositive = new Func<int, bool>(IsPositive);
```

In this tutorial, to avoid confusion, above Func<int, bool> is called delegate type, and the isPositive variable is called delegate instance.

The above constructor call syntax new Func<int, bool>(…) can be omitted, so that:

```csharp
Func<int, bool> isPositive = IsPositive;
```

which is as nature as defining any other variable with a value, like:

```csharp
Type instanceVariable = value;
```

This is an example of function’s [first-class citizenship](https://en.wikipedia.org/wiki/First-class_citizen) in C# language.

### Anonymous method

C# 2.0 introduced a syntactic sugar, anonymous method, enabling methods to be defined inline, e.g.:

```csharp
public static partial class Anonymous
{
    public static void AnonymousMethod()
    {
        Func<int, bool> isPositive = delegate(int int32)
            {
                return int32 > 0;
            };

        AppDomain.CurrentDomain.UnhandledException += delegate(object sender, UnhandledExceptionEventArgs e)
            {
                Trace.WriteLine(e.ExceptionObject);
            };
    }
}
```

No named static method or named instance method is defined at design time. But at compile time, above anonymous delegates will be compiled to named methods:

```csharp
internal static class CompiledAnonymous
{
    [CompilerGenerated]
    private static Func<int, bool> cachedAnonymousMethodDelegate0;

    [CompilerGenerated]
    private static UnhandledExceptionEventHandler cachedAnonymousMethodDelegate1;

    [CompilerGenerated]
    private static bool AnonymousMethod0(int int32)
    {
        return int32 > 0;
    }

    [CompilerGenerated]
    private static void AnonymousMethod1(object sender, UnhandledExceptionEventArgs e)
    {
        Trace.WriteLine(e.ExceptionObject);
    }

    internal static void AnonymousMethod()
    {
        Func<int, bool> isPositive = cachedAnonymousMethodDelegate0
            ?? (cachedAnonymousMethodDelegate0 = new Func<int, bool>(AnonymousMethod0));
        AppDomain.CurrentDomain.UnhandledException += cachedAnonymousMethodDelegate1
            ?? (cachedAnonymousMethodDelegate1 = new UnhandledExceptionEventHandler(AnonymousMethod1));
    }
}
```

Besides named methods, C# compiler also generates cache fields for the delegate instance, so that if AnonymousMethod is called multiple times, the delegate instantiation happens only once.

### Lambda expression

In C# 3.0+, above anonymous method’s inline definition can be further simplified with lambda expression syntax:

```csharp
public static void Lambda()
{
    Func<int, bool> isPositive = (int int32) =>
        {
            return int32 > 0;
        };

    AppDomain.CurrentDomain.UnhandledException += (object sender, UnhandledExceptionEventArgs e) =>
        {
            Trace.WriteLine(e.ExceptionObject);
        };
}
```

Lambda expression can be further shortened:

-   When the type of parameter can be inferred (for example, from Func<int, bool>), the type declaration of parameter (int) can be omitted;
-   When lambda expression has one parameter, the parentheses ( ) can be omitted;
-   When the body of the lambda expression has only one return statement, the brackets { } and “return” keyword can be omitted.

So the above lambda expressions can be:

```csharp
public static void ExpressionLambda()
{
    Func<int, bool> isPositive = int32 => int32 > 0;

    AppDomain.CurrentDomain.UnhandledException += (sender, e) => Trace.WriteLine(e.ExceptionObject);
}
```

These lambda expressions are also called expression lambda.

When having more than one statements in the body, the the brackets { } and “return” are required:

```csharp
public static void StatementLambda()
{
    Func<int, bool> isPositive = int32 =>
        {
            Console.WriteLine(int32);
            return int32 > 0;
        };
}
```

This is called statement lambda.

In C#, anonymous method and lambda expression can be also called [anonymous function](https://msdn.microsoft.com/en-us/library/bb882516.aspx). C# usually uses the term [method](https://msdn.microsoft.com/en-us/library/ms173114.aspx) instead of function, but this does not matter. Method and function are identical concepts in C#.

### Anonymous function

Generally, [anonymous function](https://en.wikipedia.org/wiki/Anonymous_function) is a function not bound to an identifier. The C# anonymous function is just an alias term for anonymous method and lambda expression. Either anonymous method or lambda expression can be used directly, without being bound to any delegate instance, or involving any named method:

```csharp
public static void CallAnonymousMethod()
{
    bool positive = new Func<int, bool>(delegate (int int32) { return int32 > 0; })(1);

    new Action<bool>(delegate (bool value) { Trace.WriteLine(value); })(positive);
}

public static void CallLambda()
{
    bool positive = new Func<int, bool>(int32 => int32 > 0)(1);

    new Action<bool>(value => Trace.WriteLine(value))(positive);
}
```

where Action<T> delegate type is defined as:

```csharp
namespace System
{
    public delegate void Action<T>(T obj);
}
```

These function are anonymous and inline at design time. As fore mentioned, at compile time, they all become named methods. And these calls become normal calls to the compiler generated delegate cache fields.

Here, The new Func<int, bool>(…) and new Action<bool>(…) constructor call syntax surrounding the anonymous functions are required by compiler. The following code cannot be compiled:

```csharp
(int32 => int32 > 0)(1);
```

In C# compiler’s perspective, there is no type information for the parameter(s) and return value at all.

In loosely typed languages like JavaScript, this kind of code definitely works:

```csharp
(function (number) { return number > 0; })(1)
```

This is a very common pattern in client [JavaScript](http://en.wikipedia.org/wiki/JavaScript) - isolate some code by surrounding the code with a anonymous function call:

```csharp
(function (global, undefined) {
    "use strict";

    // code.
}(this));
```

In other strongly typed languages (typically functional programming languages), like F#, this kind of type inference is supported, so the following F# code works:

```csharp
(fun int32 -> int32 > 0) 1
```

and similarly, in Haskell, the following works:

```csharp
(\number -> number > 0) 1
```

## Expression bodied method-like member

Similar to fore mentioned expression bodied property-like function member, C# 6.0 also introduced syntax called expression bodied method-like member. Now lambda expression syntactic sugar can be applied on:

-   static method
-   instant method
-   extension method
-   operator override method

etc., as long as it has 1 single statement.

These are the sample extension methods from previous part:

```csharp
public static class StringExtensions
{
    public static bool ContainsIgnoreCase(this string value, string substring)
    {
        Contract.Requires<ArgumentNullException>(value != null);

        return value.IndexOf(substring, StringComparison.OrdinalIgnoreCase) >= 0;
    }

    public static bool EqualsIgnoreCase(this string a, string b)
    {
        return string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
    }

    public static string With(this string format, params object[] args)
    {
        return string.Format(CultureInfo.InvariantCulture, format, args);
    }
}
```

Now these can be simplified to:

```csharp
public static class StringExtensions
{
    public static bool ContainsIgnoreCase(this string value, string substring)
    {
        Contract.Requires<ArgumentNullException>(value != null);

        return value.IndexOf(substring, StringComparison.OrdinalIgnoreCase) >= 0;
    }

    public static bool EqualsIgnoreCase(this string a, string b)
        => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    public static string With(this string format, params object[] args)
        => string.Format(CultureInfo.InvariantCulture, format, args);
}
```

The 2 versions are identical. This syntax does not apply to ContainsIgnoreCase method, because its body has more than 1 statement.

In this tutorial, to emphasize the functional paradigm, lambda bodied methods will be in the following style:

```csharp
public static class StringExtensions
{
    public static bool EqualsIgnoreCase
        (this string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

    public static string With
        (this string format, params object[] args) => string.Format(CultureInfo.InvariantCulture, format, args);
}
```

So that EqualsIgnoreCase method can be viewed as a Func<string, string, bool> lambda expression.

## Func and Action generic delegate types

The above System.Func<T, TResult> and Action<T> delegate type definition is introduced in .NET 3.5.

In .NET 3.5, this generic delegate type defined in mscorlib.dll:

And these are defined in System.Core.dll:

```csharp
namespace System
{
    public delegate void Action();

    public delegate void Action<in T>(T obj);

    public delegate void Action<in T1, in T2>(T1 arg1, T2 arg2);

    public delegate void Action<in T1, in T2, in T3>(T1 arg1, T2 arg2, T3 arg3);

    public delegate void Action<in T1, in T2, in T3, in T4>(T1 arg1, T2 arg2, T3 arg3, T4 arg4);

    public delegate TResult Func<out TResult>();

    public delegate TResult Func<in T, out TResult>(T arg);

    public delegate TResult Func<in T1, in T2, out TResult>(T1 arg1, T2 arg2);

    public delegate TResult Func<in T1, in T2, in T3, out TResult>(T1 arg1, T2 arg2, T3 arg3);

    public delegate TResult Func<in T1, in T2, in T3, in T4, out TResult>(T1 arg1, T2 arg2, T3 arg3, T4 arg4);
}
```

They will be used again and again in LINQ programming.

In .NET 4.0 FCL, more Action and Func generic delegate types are provided:

-   mscorlib.dll
    -   Action with 0 - 8 type parameters (Action, Action\`1 to Action\`8)
    -   Func with 1 - 9 type parameters (Func\`1 to Func\`9)
-   System.Core.dll
    -   Action\`9 to Action\`16
    -   Func\`10 to Func\`17

## Lambda expression as expression tree

An expression tree object can be created with lambda expression:

```csharp
internal static partial class ExpressionTree
{
    internal static void ExpressionLambda()
    {
        Expression<Func<int, bool>> isPositiveExpression = int32 => int32 > 0;
    }
}
```

In the above assignment statement, the right side is a lambda expression, which literally the same as the above lambda expression as anonymous method. But this time the isPositiveExpression is of type Expression<Func<int, bool>> instead of Func<int, bool>. An Expression<T> object is called an expression tree instead of an anonymous method.

### Code as data

Above lambda expression has exactly the same syntax as anonymous function. However, its type is specified to bee Expression<Func<int, bool>> instead of Func<int, boll> delegate type. As a result, the lambda expression is not compiled to executable code. It is compiled to the build of a data structure called expression tree:

```csharp
internal static void CompiledExpressionLambda()
{
    ParameterExpression parameterExpression = Expression.Parameter(typeof(int), "int32"); // int32
    ConstantExpression constantExpression = Expression.Constant(0, typeof(int)); // 0
    BinaryExpression greaterThanExpression = Expression.GreaterThan(
        left: parameterExpression, right: constantExpression); // int32 > 0

    Expression<Func<int, bool>> isPositiveExpression = Expression.Lambda<Func<int, bool>>(
        body: greaterThanExpression, // => int32 > 0
        parameters: parameterExpression); // int32 =>
}
```

Here the Expression<Func<int bool>> object represents an expression tree, the ParameterExpression, ConstantExpression, BinaryExpression objects are nodes in that tree. And they are all derived from System.Linq.Expressions.Expression class:

```csharp
namespace System.Linq.Expressions
{
    public abstract partial class Expression
    {
        public virtual ExpressionType NodeType { get; }

        public virtual Type Type { get; }

        // Other members.
    }

    public class ParameterExpression : Expression
    {
        public string Name { get; }

        // Other members.
    }

    public class ConstantExpression : Expression
    {
        public object Value { get; }

        // Other members.
    }

    public class BinaryExpression : Expression
    {
        public Expression Left { get; }

        public Expression Right { get; }

        // Other members.
    }

    public abstract class LambdaExpression : Expression
    {
        public Expression Body { get; }

        public ReadOnlyCollection<ParameterExpression> Parameters { get; }

        // Other members.
    }

    public sealed class Expression<TDelegate> : LambdaExpression
    {
        public TDelegate Compile();

        // Other members.
    }
}
```

Each expression object is a node in the expression tree, representing a construct in the source code int32 => int32 > 0:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_140B654C.png "image")

```csharp
Expression<Func<int, bool>> (NodeType = Lambda, Type = Func<int, bool>)
|_Parameters
| |_ParameterExpression (NodeType = Parameter, Type = int)
|   |_Name = "int32"
|_Body
  |_BinaryExpression (NodeType = GreaterThan, Type = bool)
    |_Left
    | |_ParameterExpression (NodeType = Parameter, Type = int)
    |   |_Name = "int32"
    |_Right
      |_ConstantExpression (NodeType = Constant, Type = int)
        |_Value = 0
```

So .NET expression tree is a [abstract syntactic tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree), representing the abstract syntactic structure of C# source code. Notice each Expression object has a NodeType property and a Type property. NodeType identifies in the tree what construct this node is, and Type is the represented .NET type. For example, above ParameterExpression is parameter node representing an int parameter in the source code, so its NodeType is Parameter and its Type is int.

To summarize, the differences between

```csharp
Func<int, bool> isPositive = int32 => int32 > 0; // Code.
```

and

```csharp
Expression<Func<int, bool>> isPositiveExpression = int32 => int32 > 0; // Data.
```

are:

-   isPositive variable is a delegate instance, and can be called just like calling a method. The lambda expression int32 => int32 > 0 is compiled as code. When isPositive is called, this code is executed.
-   isPositiveExpression variable is an abstract syntactic tree data structure. So apparently it cannot be called like a method. The lambda expression int32 => int32 > 0 is compiled to the building of an expression tree, where each node is a expression object. This entire tree represents the syntactic structure of anonymous function int32 => int32 > 0. This tree’s top node is a Expression<Func<int, bool>> object, representing this is a lambda expression. It has 2 child nodes:
    -   A ParameterExpression collection object, representing all the parameters of code the lambda expression. The lambda expression has 1 parameter, so this collection object contains one node:
        -   A ParameterExpression object, representing the int parameter named “int32”.
    -   A Body node representing the lambda expression’s body, which is a BinaryExpression object, representing the body is a “>” (greater than) comparison of 2 operands. So it has 2 child nodes:
        -   A reference of above ParameterExpression object, representing the left operand, the int32 parameter.
        -   A ConstantExpression object, representing the right operand 0.

Because each node of expression tree is strong typed with rich information. it is very feasible to traverse the nodes to obtain the represented C# source code logic, and convert to the logic of another language. Here isPositiveExpression represents the C# logic to predict whether an int value is greater than a constant, and it can be converted to IL code with a [cgt](https://msdn.microsoft.com/library/system.reflection.emit.opcodes.cgt.aspx) instruction that compares 2 values, or SQL query’s greater-than predicate in a WHERE clause, etc..

### .NET expressions

Besides above ParameterExpression, ConstantExpression, etc., .NET provides a collection of expressions:

-   Expression

-   BinaryExpression
-   BlockExpression
-   ConditionalExpression
-   ConstantExpression
-   DebugInfoExpression
-   DefaultExpression
-   DynamicExpression
-   GotoExpression
-   IndexExpression
-   InvocationExpression
-   LabelExpression
-   LambdaExpression

-   Expression<TDelegate>

-   ListInitExpression
-   LoopExpression
-   MemberExpression
-   MemberInitExpression
-   MethodCallExpression
-   NewArrayExpression
-   NewExpression
-   ParameterExpression
-   RuntimeVariablesExpression
-   SwitchExpression
-   TryExpression
-   TypeBinaryExpression
-   UnaryExpression

And, as demonstrated above, expression can be instantiated by calling the factory methods of Expression class:

```csharp
public abstract partial class Expression
{
    public static ParameterExpression Parameter(Type type, string name);

    public static ConstantExpression Constant(object value, Type type);

    public static BinaryExpression GreaterThan(Expression left, Expression right);

    public static Expression<TDelegate> Lambda<TDelegate>(Expression body, params ParameterExpression[] parameters);
}
```

Expression has a lot more factory methods to cover all the expression instantiation cases:

```csharp
public abstract partial class Expression
{
    public static BinaryExpression Add(Expression left, Expression right);

    public static BinaryExpression Subtract(Expression left, Expression right);

    public static BinaryExpression Multiply(Expression left, Expression right);

    public static BinaryExpression Divide(Expression left, Expression right);

    public static BinaryExpression Equal(Expression left, Expression right);

    public static UnaryExpression ArrayLength(Expression array);

    public static UnaryExpression Not(Expression expression);

    public static ConditionalExpression Condition(Expression test, Expression ifTrue, Expression ifFalse);

    public static NewExpression New(ConstructorInfo constructor, params Expression[] arguments);

    public static MethodCallExpression Call(MethodInfo method, params Expression[] arguments);

    public static BlockExpression Block(params Expression[] expressions);

    // Other methods.
}
```

Some expression can have multiple possible NodeType values. For example:

-   UnaryExpression represents any unary operation with an operator and a operand. Its NodeType can be ArrayLength, Negate, Not, Convert, Decreament, Increment, Throw, UnaryPlus, etc.
-   BinaryExpression represents any binary operation with an operator, a left operand, and a right operand, its NodeType can be Add, And, Assign, Divide, Equal, .GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Modulo, Multiply, NotEqual, Or, Power, Subtract, etc.

So far C# compiler only implements this “code as data” syntactic sugar for expression lambda, and it is not available to statement lambda yet. The following code:

```csharp
internal static void StatementLambda()
{
    Expression<Func<int, bool>> statementLambda1 = int32 => { return int32 > 0; };

    Expression<Func<int, bool>> statementLambda2 = int32 =>
        {
            Console.WriteLine(int32);
            return int32 > 0;
        };
}
```

results a compiler error:

> A lambda expression with a statement body cannot be converted to an expression tree

These 2 expression trees has to be coded as manual building:

```csharp
internal static void StatementLambda()
{
    // For single statement, syntactic sugar works.
    Expression<Func<int, bool>> statementLambda1 = int32 => int32 > 0;

    // Above lambda expression is compiled to:
    ParameterExpression int32Parameter = Expression.Parameter(typeof(int), "int32");
    Expression<Func<int, bool>> compiledStatementLambda1 = Expression.Lambda<Func<int, bool>>(
        Expression.GreaterThan(int32Parameter, Expression.Constant(0, typeof(int))), // int32 > 0
        int32Parameter); // int32 =>

    // For multiple statements, syntactic sugar is not available. The expression tree has to be built manually.
    Expression<Func<int, bool>> statementLambda2 = Expression.Lambda<Func<int, bool>>(
        // {
        Expression.Block(
            // Console.WriteLine(int32);
            Expression.Call(new Action<int>(Console.WriteLine).Method, int32Parameter),
            // return int32 > 0;
            Expression.GreaterThan(int32Parameter, Expression.Constant(0, typeof(int)))),
        // }
        int32Parameter); // int32 =>
}
```

## Convert expression tree to IL

Expression tree is data - abstract syntatic tree. In C# and LINQ, expression tree is usually used to represent the abstract syntactic structure of some C# code, so that it can be compiled to some other [domain-specific languages](https://en.wikipedia.org/wiki/Domain-specific_language), like SQL query, URI query, etc. To demonstrate this, a simple kind of expression tree will be used - expression tree only contains the 4 basic binary arithmetical calculation

-   add
-   subtract
-   multiply
-   divide

For example:

```csharp
Expression<Func<double, double, double, double, double, double>> infix = 
    (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
```

This is a abstract syntactic tree representing the structure of a Func<double, double, double, double, double, double> algorithm (a, b, c, d, e) => a + b - c \* d / 2 + e \* 2. It is a very simple binary tree, where:

-   each internal node is a binary node (BinaryExpression object) representing add, subtract, multiply, or divide calculation;
-   each leaf node is either a parameter (ParameterExpression object), or a constant (ConstantExpression object).

In C#/.NET:

-   Above binary calculations are represented by [System.Linq.Expressions.BinaryExpression](https://msdn.microsoft.com/en-us/library/system.linq.expressions.binaryexpression.aspx) objects.
-   Parameters are represented by [System.Linq.Expressions.ParameterExpression](https://msdn.microsoft.com/en-us/library/system.linq.expressions.parameterexpression.aspx) objects.
-   Constants are represented by [System.Linq.Expressions.ConstantExpression](https://msdn.microsoft.com/en-us/library/system.linq.expressions.constantexpression.aspx) objects.

So in total there are 6 possible kinds of nodes in this kind of expression tree:

-   add: BinaryExpression { NodeType = ExpressionType.Add }
-   subtract: BinaryExpression { NodeType = ExpressionType.Subtract }
-   multiply: BinaryExpression { NodeType = ExpressionType.Multiply }
-   divide: BinaryExpression { NodeType = ExpressionType.Divide}
-   constant: ParameterExpression { NodeType = ExpressionType.Constant }
-   parameter: ConstantExpression { NodeType = ExpressionType.Parameter }

Each node has a NodeType property representing the node type.

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_4C2406F2.png "image")

### Traverse expression tree

Recursively traversing this tree is very easy. The following base class constructs the basic logic of traversing:

```csharp
public abstract class BinaryArithmeticExpressionVisitor<TResult>
{
    public TResult VisitBody(LambdaExpression expression)
    {
        return this.VisitNode(expression.Body, expression);
    }

    protected TResult VisitNode(Expression node, LambdaExpression expression)
    {
        // Processes the 6 types of node.
        switch (node.NodeType)
        {
            case ExpressionType.Add:
                return this.VisitAdd(node as BinaryExpression, expression);

            case ExpressionType.Constant:
                return this.VisitConstant(node as ConstantExpression, expression);

            case ExpressionType.Divide:
                return this.VisitDivide(node as BinaryExpression, expression);

            case ExpressionType.Multiply:
                return this.VisitMultiply(node as BinaryExpression, expression);

            case ExpressionType.Parameter:
                return this.VisitParameter(node as ParameterExpression, expression);

            case ExpressionType.Subtract:
                return this.VisitSubtract(node as BinaryExpression, expression);

            default:
                throw new ArgumentOutOfRangeException(nameof(node));
        }
    }

    protected abstract TResult VisitAdd(BinaryExpression add, LambdaExpression expression);

    protected abstract TResult VisitConstant(ConstantExpression constant, LambdaExpression expression);

    protected abstract TResult VisitDivide(BinaryExpression divide, LambdaExpression expression);

    protected abstract TResult VisitMultiply(BinaryExpression multiply, LambdaExpression expression);

    protected abstract TResult VisitParameter(ParameterExpression parameter, LambdaExpression expression);

    protected abstract TResult VisitSubtract(BinaryExpression subtract, LambdaExpression expression);
}
```

The following class implements the traversal. When visiting a binary node, it logs a prefix style string “operator(left, right)”. For example, a + b will be logged as add(a, b), which can be viewed as calling add method with argument a and b.

```csharp
public class PrefixVisitor : BinaryArithmeticExpressionVisitor<string>
{
    protected override string VisitAdd
        (BinaryExpression add, LambdaExpression expression) => this.VisitBinary(add, "add", expression);

    protected override string VisitConstant
        (ConstantExpression constant, LambdaExpression expression) => constant.Value.ToString();

    protected override string VisitDivide
        (BinaryExpression divide, LambdaExpression expression) => this.VisitBinary(divide, "div", expression);

    protected override string VisitMultiply
        (BinaryExpression multiply, LambdaExpression expression) => 
            this.VisitBinary(multiply, "mul", expression);

    protected override string VisitParameter
        (ParameterExpression parameter, LambdaExpression expression) => parameter.Name;

    protected override string VisitSubtract
        (BinaryExpression subtract, LambdaExpression expression) => 
            this.VisitBinary(subtract, "sub", expression);

    private string VisitBinary // Recursive: operator(left, right)
        (BinaryExpression binary, string @operator, LambdaExpression expression) =>
            $"{@operator}({this.VisitNode(binary.Left, expression)}, {this.VisitNode(binary.Right, expression)})";
}
```

Executing the following code:

```csharp
Expression<Func<double, double, double, double, double, double>> infix =
    (a, b, c, d, e) => a + b - c * d / 2 + e * 3;

PrefixVisitor prefixVisitor = new PrefixVisitor();
string prefix = prefixVisitor.VisitBody(infix); // "add(sub(add(a, b), div(mul(c, d), 2)), mul(e, 3))"
```

The value of prefix is add(sub(add(a, b), div(mul(c, d), 2)), mul(e, 3)), which represents the semantics of expression a + b - c \* d / 2 + e \* 3 in a method call style.

### .NET built-in expression tree traverser

.NET 4.0+ provides a built-in [System.Linq.Expressions.ExpressionVisitor](http://msdn.microsoft.com/en-us/library/system.linq.expressions.expressionvisitor.aspx) class in System.Core.dll. Here traversers are built from scratch for demonstration purpose.

### Compile expression tree to IL at runtime

How about postfix? In postfix style, switching add(a, b) to (a, b)add looks a little less intuitive. Actually, (a, b)add can be viewed as: load a to stack, load b to stack, add 2 values on stack.

Yes, this demonstrates how the computer works. The entire postfix style expression: “(((a, b)add, ((c, d)mul, 2)div)sub, (e, 3)mul)add” can be viewed as a sequence of operations:

> a // Load a to stack. b // Load b to stack. add // Add 2 values. c // … d mul 2 div sub e 3 mul add

It is very easy to produce this postfix style by tweaking 1 line of code from PrefixVisitor class. It is also easy to go a little further, just change the output from a string log (a, b)add to a sequence of [IL instructions](https://en.wikipedia.org/wiki/List_of_CIL_instructions):

-   Load a to stack to the evaluation stack
-   Load b to stack to the evaluation stack
-   Adds two values, and pushes the result to the evaluation stack

IL instructions can be represented by [System.Reflection.Emit.OpCode](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcode.aspx) structs. So the output can be a sequence of instruction-argument pairs:

```csharp
public class PostfixVisitor : BinaryArithmeticExpressionVisitor<IEnumerable<Tuple<OpCode, double?>>>
{
    protected override IEnumerable<Tuple<OpCode, double?>> VisitAdd
        (BinaryExpression add, LambdaExpression expression) => this.VisitBinary(add, OpCodes.Add, expression);

    protected override IEnumerable<Tuple<OpCode, double?>> VisitConstant(
        ConstantExpression constant, LambdaExpression expression)
    {
        yield return Tuple.Create(OpCodes.Ldc_R8, (double?)constant.Value);
    }

    protected override IEnumerable<Tuple<OpCode, double?>> VisitDivide
        (BinaryExpression divide, LambdaExpression expression) => 
            this.VisitBinary(divide, OpCodes.Div, expression);

    protected override IEnumerable<Tuple<OpCode, double?>> VisitMultiply
        (BinaryExpression multiply, LambdaExpression expression) => 
            this.VisitBinary(multiply, OpCodes.Mul, expression);

    protected override IEnumerable<Tuple<OpCode, double?>> VisitParameter(
        ParameterExpression parameter, LambdaExpression expression)
    {
        int index = expression.Parameters.IndexOf(parameter);
        yield return Tuple.Create(OpCodes.Ldarg_S, (double?)index);
    }

    protected override IEnumerable<Tuple<OpCode, double?>> VisitSubtract
        (BinaryExpression subtract, LambdaExpression expression) => 
            this.VisitBinary(subtract, OpCodes.Sub, expression);

    private IEnumerable<Tuple<OpCode, double?>> VisitBinary // Recursive: left, right, operator
        (BinaryExpression binary, OpCode postfix, LambdaExpression expression) =>
            this.VisitNode(binary.Left, expression)
                .Concat(this.VisitNode(binary.Right, expression))
                .Concat(EnumerableEx.Return(Tuple.Create(postfix, (double?)null))); // left, right, postfix
}
```

So data becomes code. The following code:

```csharp
public static void IL()
{
    Expression<Func<double, double, double, double, double, double>> infix =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;

    PostfixVisitor postfixVisitor = new PostfixVisitor();
    IEnumerable<Tuple<OpCode, double?>> postfix = postfixVisitor.VisitBody(infix);
    foreach (Tuple<OpCode, double?> code in postfix)
    {
        Trace.WriteLine($"{code.Item1} {code.Item2}");
    }
}
```

prints:

> ldarg.s 0 ldarg.s 1 add ldarg.s 2 ldarg.s 3 mul ldc.r8 2 div sub ldarg.s 4 ldc.r8 3 mul add

The expression tree’s semantics is successfully represented by IL code.

### Compile expression tree to executable method at runtime

To truly compile expression tree to executable code, the rest of the work is:

-   Create a dynamic method
-   Emit the IL code into that dynamic method
-   Return that dynamic method

This method is called dynamic because it is generated at runtime, In contrast of a method compiled into static IL code in a static assembly.

The following class implements the compilation:

```csharp
public static class BinaryArithmeticCompiler
{
    private static readonly PostfixVisitor postfixVisitor = new PostfixVisitor();

    public static TDelegate Compile<TDelegate>(Expression<TDelegate> expression)
        where TDelegate : class
    {
        DynamicMethod dynamicMethod = new DynamicMethod(
            string.Empty,
            expression.ReturnType,
            expression.Parameters.Select(parameter => parameter.Type).ToArray(),
            typeof(BinaryArithmeticCompiler).Module);
        EmitIL(dynamicMethod.GetILGenerator(), postfixVisitor.VisitBody(expression));
        return dynamicMethod.CreateDelegate(typeof(TDelegate)) as TDelegate;
    }

    private static void EmitIL(ILGenerator ilGenerator, IEnumerable<Tuple<OpCode, double?>> codes)
    {
        foreach (Tuple<OpCode, double?> code in codes)
        {
            if (code.Item2.HasValue)
            {
                if (code.Item1 == OpCodes.Ldarg_S)
                {
                    ilGenerator.Emit(code.Item1, (int)code.Item2.Value); // ldarg.s (int)index
                }
                else
                {
                    ilGenerator.Emit(code.Item1, code.Item2.Value); // ldc.r8 (double)constant
                }
            }
            else
            {
                ilGenerator.Emit(code.Item1); // add, sub, mul, div
            }
        }

        ilGenerator.Emit(OpCodes.Ret); // Returns the result.
    }
}
```

The following code shows how to compile the expression tree into a .NET method:

```csharp
Expression<Func<double, double, double, double, double, double>> infix =
    (a, b, c, d, e) => a + b - c * d / 2 + e * 3;

Func<double, double, double, double, double, double> method = BinaryArithmeticCompiler.Compile(infix);
double result = method(1, 2, 3, 4, 5); // 12
```

This is very powerful. By traversing a abstract syntactic tree, a .NET method is created at runtime.

### .NET built-in compiler

.NET provides a built in API [System.Linq.Expressions.Expression<TDelegate>.Compile()](https://msdn.microsoft.com/en-us/library/Bb345362.aspx) to compile expression tree to executable method at runtime:

```csharp
Expression<Func<double, double, double, double, double, double>> infix =
    (a, b, c, d, e) => a + b - c * d / 2 + e * 3;

Func<double, double, double, double, double, double> method = infix.Compile();
double result = method(1, 2, 3, 4, 5); // 12
```

Expression<TDelegate>.Compile() calls internal API System.Linq.Expressions.Compiler.LambdaCompiler.Compile(). There is a complete expression-tree-to-IL compiler implementation under System.Linq.Expressions.Compiler namespace.

### Convert expression tree to other languages

Here expression tree is compiled to description string, and IL instructions. Later, the LINQ to Entities and LINQ to SQL chapters will revisit expression tree, where expression tree is translated to SQL queries.

### Decompile anonymous method to expression tree?

Regarding:

-   At compile time, anonymous method and expression tree can share the same syntax sugar
-   At runtime, expression tree can be converted to method, by just calling Expression<TDelegate>.Compile()

So, can a method be converted to expression tree at runtime?

Theoretically, yes; practically, difficult. At runtime, when looking at a compiled method, it contains a sequence of IL instructions. It is possible to decompile IL to C# source, then use the C# source to construct expression tree. Apparently this is much more complicated.

## Type inference of lambda expression

In C# lambda syntax, the parameter type(s), return type, and lambda expression type should be all inferable from the context:

```csharp
// Anonymous method with a int parameter, and returns a bool value.
Func<int, bool> isPositive = int32 => int32 > 0;

// Expression tree with a int parameter, and returns a bool value.
Expression<Func<int, bool>> isPositiveExpression = int32 => int32 > 0;
```

So the var keyword cannot be used to define lambda expression. The following code cannot be compiled:

```csharp
var isPositive = int32 => int32 > 0;
```

The compiler does not know:

-   is predicate3 a anonymous method (System.Delegate), or an expression tree (System.Linq.Expressions.Expression<TDelegate>)
-   the type of parameter, return value, etc.

dynamic cannot be used either. The following code cannot be compiled:

```csharp
dynamic isPositive = int32 => int32 > 0;
```

Again, dynamic is just System.Object. It does not provide any information for inference.