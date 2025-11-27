---
title: "C# Functional Programming In-Depth (7) Expression Tree: Function as Data"
published: 2018-06-07
description: "C# lambda expression is a powerful syntactic sugar. Besides representing anonymous function, the same syntax can also represent expression tree."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "LINQ"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-function-as-data-and-expression-tree](/posts/functional-csharp-function-as-data-and-expression-tree "https://weblogs.asp.net/dixin/functional-csharp-function-as-data-and-expression-tree")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

C# lambda expression is a powerful syntactic sugar. Besides representing anonymous function, the same syntax can also represent expression tree.

## Lambda expression as expression tree

An expression tree can be created with the same lambda expression syntax for anonymous function:

```csharp
internal static partial class ExpressionTree
{
    internal static void ExpressionLambda()
    {
        // Func<int, bool> isPositive = int32 => int32 > 0;
        Expression<Func<int, bool>> isPositiveExpression = int32 => int32 > 0;
    }
}
```

This time, the expected type for the lambda expression is no longer a Func<int, bool> function type, but Expression<Func<int, bool>>. The lambda expression here is no longer compiled to executable anonymous function, but a tree data structure representing that function’s logic, which is called expression tree.

### Metaprogramming: function as data

The above lambda expression is compiled to expression tree building code:

```csharp
internal static void CompiledExpressionLambda()
{
    ParameterExpression parameterExpression = Expression.Parameter(typeof(int), "int32"); // int32 parameter.
    ConstantExpression constantExpression = Expression.Constant(0, typeof(int)); // 0
    BinaryExpression greaterThanExpression = Expression.GreaterThan(
        left: parameterExpression, right: constantExpression); // int32 > 0

    Expression<Func<int, bool>> isPositiveExpression = Expression.Lambda<Func<int, bool>>(
        body: greaterThanExpression, // ... => int32 > 0
        parameters: parameterExpression); // int32 => ...
}
```

Here the Expression<Func<int bool>> instance represents the entire tree, the ParameterExpression, ConstantExpression, BinaryExpression instances are nodes in that tree. And they are all derived from System.Linq.Expressions.Expression type:

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

The above expression tree data structure can be visualized as:

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

So this expression tree is an [abstract syntactic tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree), representing the abstract syntactic structure of C# function source code int32 => int32 > 0. Notice each node has NodeType property and Type property. NodeType returns the represented construct type in the tree, and Type returns the represented .NET type. For example, above ParameterExpression is parameter node representing an int parameter in the source code, so its NodeType is Parameter and its Type is int.

To summarize, the differences between

```csharp
Func<int, bool> isPositive = int32 => int32 > 0; // Code.
```

and

```csharp
Expression<Func<int, bool>> isPositiveExpression = int32 => int32 > 0; // Data.
```

are:

-   isPositive variable is a function represented by delegate instance, and can be called. The lambda expression int32 => int32 > 0 is compiled to executable code. When isPositive is called, this code is executed.
-   isPositiveExpression variable is an abstract syntactic tree data structure. So apparently it cannot be directly called like an executable function. The lambda expression int32 => int32 > 0 is compiled to the building of an expression tree, where each node is an Expression instance. This entire tree represents the syntactic structure and logic of function int32 => int32 > 0. This tree’s top node is a Expression<Func<int, bool>> instance, since this is a lambda expression. It has 2 child nodes:
    -   A ParameterExpression collection, representing all the parameters of the lambda expression. The lambda expression has 1 parameter, so this collection contains one node:
        -   A ParameterExpression instance, representing the int parameter named “int32”.
    -   A Body node representing the lambda expression’s body, which is a BinaryExpression instance, representing the body is a “>” (greater than) comparison of 2 operands. So it has 2 child nodes:
        -   A reference of above ParameterExpression instance, representing the left operand.
        -   A ConstantExpression instance, representing the right operand 0.

Because each node in expression tree is strong typed with rich information. The nodes can be traversed to obtain the represented function’s C# source code logic, and convert to the logic of another language. Here isPositiveExpression represents the function logic to predicate whether an int value is greater than a constant 0, and it can be converted to SQL query’s greater-than predicate in a SQL WHERE clause, etc.

### .NET expressions

Besides above ParameterExpression, ConstantExpression, BinaryExpression, LambdaExpression, .NET provides a rich collection of expressions nodes. The following is their inheritance hierarchy:

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

And, as demonstrated above, expression can be instantiated by calling the factory methods of Expression type:

```csharp
public abstract partial class Expression
{
    public static ParameterExpression Parameter(Type type, string name);

    public static ConstantExpression Constant(object value, Type type);

    public static BinaryExpression GreaterThan(Expression left, Expression right);

    public static Expression<TDelegate> Lambda<TDelegate>(Expression body, params ParameterExpression[] parameters);
}
```

Expression has many other factory methods to cover all the expression instantiation cases:

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

    // Other members.
}
```

Some expression node can have multiple possible NodeType values. For example:

-   UnaryExpression represents any unary operation with an operator and a operand. Its NodeType can be ArrayLength, Negate, Not, Convert, Decreament, Increment, Throw, UnaryPlus, etc.
-   BinaryExpression represents any binary operation with an operator, a left operand, and a right operand, its NodeType can be Add, And, Assign, Divide, Equal, .GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Modulo, Multiply, NotEqual, Or, Power, Subtract, etc.

So far C# compiler only implements this “function as data” syntactic sugar for expression lambda, and it is not available to statement lambda yet. The following code cannot be compiled:

```csharp
internal static void StatementLambda()
{
    Expression<Func<int, bool>> isPositiveExpression = int32 =>
    {
        Console.WriteLine(int32);
        return int32 > 0;
    };
}
```

It results a compiler error: A lambda expression with a statement body cannot be converted to an expression tree. The above expression tree has to be built manually:

```csharp
internal static void StatementLambda()
{
    ParameterExpression parameterExpression = Expression.Parameter(typeof(int), "int32"); // int32 parameter.
    Expression<Func<int, bool>> isPositiveExpression = Expression.Lambda<Func<int, bool>>(
        body: Expression.Block( // ... => {
            // Console.WriteLine(int32);
            Expression.Call(new Action<int>(Console.WriteLine).Method, parameterExpression),
            // return int32 > 0;
            Expression.GreaterThan(parameterExpression, Expression.Constant(0, typeof(int)))), // }
        parameters: parameterExpression); // int32 => ...
}
```

## Compile expression tree to CIL

Expression tree is data - abstract syntactic tree. In C# and LINQ, expression tree is usually used to represent the abstract syntactic structure of function, so that it can be compiled to other [domain-specific languages](https://en.wikipedia.org/wiki/Domain-specific_language), like SQL query, URI query, etc. To demonstrate this, take a simple mathematics function as example, which accepts double parameters and execute the 4 basic binary arithmetical calculation: add, subtract, multiply, divide:

```csharp
internal static void ArithmeticalExpression()
{
    Expression<Func<double, double, double, double, double, double>> expression =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
}
```

The entire tree can be visualized as:

```csharp
Expression<Func<double, double, double, double, double, double>> (NodeType = Lambda, Type = Func<double, double, double, double, double, double>)
|_Parameters
| |_ParameterExpression (NodeType = Parameter, Type = double)
| | |_Name = "a"
| |_ParameterExpression (NodeType = Parameter, Type = double)
| | |_Name = "b"
| |_ParameterExpression (NodeType = Parameter, Type = double)
| | |_Name = "c"
| |_ParameterExpression (NodeType = Parameter, Type = double)
| | |_Name = "d"
| |_ParameterExpression (NodeType = Parameter, Type = double)
|   |_Name = "e"
|_Body
  |_BinaryExpression (NodeType = Add, Type = double)
    |_Left
    | |_BinaryExpression (NodeType = Subtract, Type = double)
    |   |_Left
    |   | |_BinaryExpression (NodeType = Add, Type = double)
    |   |   |_Left
    |   |   | |_ParameterExpression (NodeType = Parameter, Type = double)
    |   |   |   |_Name = "a"
    |   |   |_Right
    |   |     |_ParameterExpression (NodeType = Parameter, Type = double)
    |   |       |_Name = "b"
    |   |_Right
    |     |_BinaryExpression (NodeType = Divide, Type = double)
    |       |_Left
    |       | |_BinaryExpression (NodeType = Multiply, Type = double)
    |       |   |_Left
    |       |   | |_ParameterExpression (NodeType = Parameter, Type = double)
    |       |   |   |_Name = "c"
    |       |   |_right
    |       |     |_ParameterExpression (NodeType = Parameter, Type = double)
    |       |       |_Name = "d"
    |       |_Right
    |         |_ConstantExpression (NodeType = Constant, Type = int)
    |           |_Value = 2
    |_Right
      |_BinaryExpression (NodeType = Multiply, Type = double)
        |_Left
        | |_ParameterExpression (NodeType = Parameter, Type = double)
        |   |_Name = "e"
        |_Right
          |_ConstantExpression (NodeType = Constant, Type = int)
            |_Value = 3
```

This is a very simple expression tree, where:

-   each internal node is a binary node (BinaryExpression instance) representing add, subtract, multiply, or divide binary operations;
-   each leaf node is either a parameter (ParameterExpression instance), or a constant (ConstantExpression instance).

In total there are 6 kinds of nodes in this tree:

-   add: BinaryExpression { NodeType = ExpressionType.Add }
-   subtract: BinaryExpression { NodeType = ExpressionType.Subtract }
-   multiply: BinaryExpression { NodeType = ExpressionType.Multiply }
-   divide: BinaryExpression { NodeType = ExpressionType.Divide}
-   constant: ParameterExpression { NodeType = ExpressionType.Constant }
-   parameter: ConstantExpression { NodeType = ExpressionType.Parameter }

### Traverse expression tree

Recursively traversing this tree is very easy. The following base type implements the basic logic of traversing:

```csharp
internal abstract class BinaryArithmeticExpressionVisitor<TResult>
{
    internal virtual TResult VisitBody(LambdaExpression expression) => this.VisitNode(expression.Body, expression);

    protected TResult VisitNode(Expression node, LambdaExpression expression)
    {
        // Processes the 6 types of node.
        switch (node.NodeType)
        {
            case ExpressionType.Add:
                return this.VisitAdd((BinaryExpression)node, expression);

            case ExpressionType.Constant:
                return this.VisitConstant((ConstantExpression)node, expression);

            case ExpressionType.Divide:
                return this.VisitDivide((BinaryExpression)node, expression);

            case ExpressionType.Multiply:
                return this.VisitMultiply((BinaryExpression)node, expression);

            case ExpressionType.Parameter:
                return this.VisitParameter((ParameterExpression)node, expression);

            case ExpressionType.Subtract:
                return this.VisitSubtract((BinaryExpression)node, expression);

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

The VisitNode method detects the node type, and dispatch to 6 abstract methods for all 6 kinds of nodes. The following type implements those 6 methods:

```csharp
internal class PrefixVisitor : BinaryArithmeticExpressionVisitor<string>
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

    private string VisitBinary( // Recursion: operator(left, right)
        BinaryExpression binary, string @operator, LambdaExpression expression) =>
            $"{@operator}({this.VisitNode(binary.Left, expression)}, {this.VisitNode(binary.Right, expression)})";
}
```

When visiting a binary node, it recursively outputs in prefix style operator(left, right). For example, the infix expression a + b is converted to add(a, b), which can be viewed as calling add function with arguments a and b. The following code outputs the function body’s logic in prefixed, function call style:

```csharp
internal static partial class ExpressionTree
{
    internal static void Prefix()
    {
        Expression<Func<double, double, double, double, double, double>> infix =
            (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
        PrefixVisitor prefixVisitor = new PrefixVisitor();
        string prefix = prefixVisitor.VisitBody(infix); // add(sub(add(a, b), div(mul(c, d), 2)), mul(e, 3))
    }
}
```

Actually .NET provides a built-in [System.Linq.Expressions.ExpressionVisitor](http://msdn.microsoft.com/en-us/library/system.linq.expressions.expressionvisitor.aspx) type. Here traversers are implemented from scratch just for demonstration purpose.

### Expression tree to CIL at runtime

If the output is in postfix style (a, b, add), then it can be viewed as: load a to stack, load b to stack, add 2 values on stack. This is how the stack based CIL language works. So a different visitor can be created to output [CIL instructions](https://en.wikipedia.org/wiki/List_of_CIL_instructions). CIL instructions can be represented by [System.Reflection.Emit.OpCode](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcode.aspx) structures. So the output can be a sequence of instruction-argument pairs, represented by a tuple of a OpCode value, and a double value (operand) or null (no operand):

```csharp
internal class PostfixVisitor : BinaryArithmeticExpressionVisitor<List<(OpCode, double?)>>
{
    protected override List<(OpCode, double?)> VisitAdd(
        BinaryExpression add, LambdaExpression expression) => this.VisitBinary(add, OpCodes.Add, expression);

    protected override List<(OpCode, double?)> VisitConstant(
        ConstantExpression constant, LambdaExpression expression) =>
            new List<(OpCode, double?)>() { (OpCodes.Ldc_R8, (double?)constant.Value) };

    protected override List<(OpCode, double?)> VisitDivide(
        BinaryExpression divide, LambdaExpression expression) =>
            this.VisitBinary(divide, OpCodes.Div, expression);

    protected override List<(OpCode, double?)> VisitMultiply(
        BinaryExpression multiply, LambdaExpression expression) =>
            this.VisitBinary(multiply, OpCodes.Mul, expression);

    protected override List<(OpCode, double?)> VisitParameter(
        ParameterExpression parameter, LambdaExpression expression)
    {
        int index = expression.Parameters.IndexOf(parameter);
        return new List<(OpCode, double?)>() { (OpCodes.Ldarg_S, (double?)index) };
    }

    protected override List<(OpCode, double?)> VisitSubtract(
        BinaryExpression subtract, LambdaExpression expression) =>
            this.VisitBinary(subtract, OpCodes.Sub, expression);

    private List<(OpCode, double?)> VisitBinary( // Recursion: left, right, operator
        BinaryExpression binary, OpCode postfix, LambdaExpression expression)
    {
        List<(OpCode, double?)> cils = this.VisitNode(binary.Left, expression);
        cils.AddRange(this.VisitNode(binary.Right, expression));
        cils.Add((postfix, (double?)null));
        return cils;
    }
}
```

The following code outputs a sequence of CIL code:

```csharp
internal static void Cil()
{
    Expression<Func<double, double, double, double, double, double>> infix =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;

    PostfixVisitor postfixVisitor = new PostfixVisitor();
    IEnumerable<(OpCode, double?)> postfix = postfixVisitor.VisitBody(infix);
    foreach ((OpCode Operator, double? Operand) code in postfix)
    {
        $"{code.Operator} {code.Operand}".WriteLine();
    }
    // ldarg.s 0
    // ldarg.s 1
    // add
    // ldarg.s 2
    // ldarg.s 3 
    // mul 
    // ldc.r8 2 
    // div 
    // sub 
    // ldarg.s 4 
    // ldc.r8 3 
    // mul 
    // add
}
```

So the C# logic represented in this expression tree is successfully compiled to CIL language.

### Expression tree to function at runtime

The above compiled CIL code is executable, so a function can be created at runtime, then the CIL code can be emitted into that function. This kind of function is call dynamic function, because it is not in a static assembly generated at compile time, but generated at runtime.

```csharp
internal static class BinaryArithmeticCompiler
{
    internal static TDelegate Compile<TDelegate>(Expression<TDelegate> expression)
    {
        DynamicMethod dynamicFunction = new DynamicMethod(
            name: string.Empty,
            returnType: expression.ReturnType,
            parameterTypes: expression.Parameters.Select(parameter => parameter.Type).ToArray(),
            m: typeof(BinaryArithmeticCompiler).Module);
        EmitIL(dynamicFunction.GetILGenerator(), new PostfixVisitor().VisitBody(expression));
        return (TDelegate)(object)dynamicFunction.CreateDelegate(typeof(TDelegate));
    }

    private static void EmitIL(ILGenerator ilGenerator, IEnumerable<(OpCode, double?)> il)
    {
        foreach ((OpCode Operation, double? Operand) code in il)
        {
            if (code.Operand == null)
            {
                ilGenerator.Emit(code.Operation); // add, sub, mul, div
            }
            else if (code.Operation == OpCodes.Ldarg_S)
            {
                ilGenerator.Emit(code.Operation, (int)code.Operand); // ldarg.s (int)index
            }
            else
            {
                ilGenerator.Emit(code.Operation, code.Operand.Value); // ldc.r8 (double)constant
            }
        }
        ilGenerator.Emit(OpCodes.Ret); // Returns the result.
    }
}
```

The following code demonstrate how to use it:

```csharp
internal static void Compile()
{
    Expression<Func<double, double, double, double, double, double>> expression =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
    Func<double, double, double, double, double, double> function = 
        BinaryArithmeticCompiler.Compile(expression);
    double result = function(1, 2, 3, 4, 5); // 12
}
```

.NET provides a built-in API, System.Linq.Expressions.Expression<TDelegate>’s Compile method, for this purpose - compile expression tree to executable function at runtime:

```csharp
internal static void BuiltInCompile()
{
    Expression<Func<double, double, double, double, double, double>> infix =
        (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
    Func<double, double, double, double, double, double> function = infix.Compile();
    double result = function(1, 2, 3, 4, 5); // 12
}
```

Internally, Expression<TDelegate>.Compile calls APIs of System.Linq.Expressions.Compiler.LambdaCompile, which is a complete expression tree to CIL compiler implementation.

## Expression tree and LINQ remote query

Expression tree is very important in LINQ remote query, because it is easy to build expression tree, especially with the lambda expression, and it is also easy to compile/convert/translate a C# expression tree’s logic to a different domain or different language. In above examples, expression tree is converted to executable CIL. As fore mentioned, there are local and remote LINQ queries, like relational database. The following examples are a local LINQ to Objects query for local in memory objects, and a remote LINQ to Entities query for relational database:

```csharp
internal static partial class ExpressionTree
{
    internal static void LinqToObjects(IEnumerable<Product> source)
    {
        IEnumerable<Product> query = source.Where(product => product.ListPrice > 0M); // Define query.
        foreach (Product result in query) // Execute query.
        {
            result.Name.WriteLine();
        }
    }

    internal static void LinqToEntities(IQueryable<Product> source)
    {
        IQueryable<Product> query = source.Where(product => product.ListPrice > 0M); // Define query.
        foreach (Product result in query) // Execute query.
        {
            result.Name.WriteLine();
        }
    }
}
```

The above LINQ to Objects query’s data source is a sequence of Product objects in current .NET application’s local memory. The LINQ to Entities query’s data source is Product table in remote relational database, which is not available in current local memory. In LINQ, local data source and query are represented by IEnumerable<T>, and remote data source and query are represented by IQueryable<T>. They have different LINQ query extension methods, table above Where as example:

```csharp
namespace System.Linq
{
    public static class Enumerable
    {
        public static IEnumerable<TSource> Where<TSource>(
            this IEnumerable<TSource> source, Func<TSource, bool> predicate);
    }

    public static class Queryable
    {
        public static IQueryable<TSource> Where<TSource>(
            this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate);
    }
}
```

As a result, the Where query and predicate lambda expression share identical syntax for local and remote LINQ queries, but their compilation is totally different. The local query’s predicate is compiled to function, and the remote query’s predicate is compiled to expression tree:

```csharp
internal static partial class CompiledExpressionTree
{
    [CompilerGenerated]
    private static Func<Product, bool> cachedPredicate;

    [CompilerGenerated]
    private static bool Predicate(Product product) => product.ListPrice > 0M;

    public static void LinqToObjects(IEnumerable<Product> source)
    {
        Func<Product, bool> predicate = cachedPredicate ?? (cachedPredicate = Predicate);
        IEnumerable<Product> query = Enumerable.Where(source, predicate);
        foreach (Product result in query) // Execute query.
        {
            TraceExtensions.WriteLine(result.Name);
        }
    }
}

internal static partial class CompiledExpressionTree
{
    internal static void LinqToEntities(IQueryable<Product> source)
    {
        ParameterExpression productParameter = Expression.Parameter(typeof(Product), "product");
        Expression<Func<Product, bool>> predicateExpression = Expression.Lambda<Func<Product, bool>>(
            Expression.GreaterThan(
                Expression.Property(productParameter, nameof(Product.ListPrice)),
                Expression.Constant(0M, typeof(decimal))),
            productParameter);

        IQueryable<Product> query = Queryable.Where(source, predicateExpression); // Define query.
        foreach (Product result in query) // Execute query.
        {
            TraceExtensions.WriteLine(result.Name);
        }
    }
}
```

At runtime, when the local query executes, the anonymous function is called for each local value in the source sequence, and the remote query is usually translated to a domain specific language, then submit to the remote data source and execute. Here in LINQ to Entities query, the predicate expression tree is translated to predicate in SQL query, and submitted to the database to execute. The translation from expression tree to SQL will be covered in LINQ to Entities chapter.