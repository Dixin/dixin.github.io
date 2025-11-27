---
title: "C# Functional Programming In-Depth (7) Expression Tree: Function as Data"
published: 2019-06-07
description: "C# lambda expression is a powerful syntactic sugar. Besides representing anonymous function, the same syntax can also represent expression tree. An expression tree is an immutable tree data structure"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# 6.0", "C# Features", "Functional C#", "Functional Programming", "LINQ", "LINQ via C#"]
category: "Functional Programming"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## Lambda expression as expression tree

C# lambda expression is a powerful syntactic sugar. Besides representing anonymous function, the same syntax can also represent expression tree. An expression tree is an immutable tree data structure that represents structure of code. For example:

internal static void ExpressionLambda()

```csharp
{
```
```csharp
Expression<Func<int, bool>> isPositiveExpression = int32 => int32 > 0;
```
```csharp
// Compare to: Func<int, bool> isPositive = int32 => int32 > 0;
```

}

This time, the expected type for the lambda expression is no longer a Func<int, bool> function type, but Expression<Func<int, bool>> data type. The lambda expression here is no longer compiled to executable anonymous function code, but an expression tree data structure representing that function’s code logic.

### Metaprogramming: function as abstract syntax tree

The above lambda expression has exactly the same syntax as anonymous function, but it is compiled to code that builds expression tree:

internal static void CompiledExpressionLambda()

```csharp
{
```
```csharp
ParameterExpression parameterExpression = Expression.Parameter(type: typeof(int), name: "int32"); // int32 parameter.
```
```csharp
ConstantExpression constantExpression = Expression.Constant(value: 0, type: typeof(int)); // 0
```
```csharp
BinaryExpression greaterThanExpression = Expression.GreaterThan(
```
```csharp
left: parameterExpression, right: constantExpression); // int32 > 0
```

```csharp
Expression<Func<int, bool>> isPositiveExpression = Expression.Lambda<Func<int, bool>>(
```
```csharp
body: greaterThanExpression, // ... => int32 > 0
```
```csharp
parameters: parameterExpression); // int32 => ...
```

}

Here the Expression<Func<int bool>> instance represents the entire tree, the ParameterExpression, ConstantExpression, BinaryExpression instances are nodes in that tree. And they are all derived from System.Linq.Expressions.Expression type:

namespace System.Linq.Expressions

```csharp
{
```
```csharp
public abstract class Expression
```
```csharp
{
```
```csharp
public virtual ExpressionType NodeType { get; }
```

```csharp
public virtual Type Type { get; }
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public class ParameterExpression : Expression
```
```csharp
{
```
```csharp
public string Name { get; }
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public class ConstantExpression : Expression
```
```csharp
{
```
```csharp
public object Value { get; }
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public class BinaryExpression : Expression
```
```csharp
{
```
```csharp
public Expression Left { get; }
```

```csharp
public Expression Right { get; }
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public abstract class LambdaExpression : Expression
```
```csharp
{
```
```csharp
public Expression Body { get; }
```

```csharp
public ReadOnlyCollection<ParameterExpression> Parameters { get; }
```

```csharp
// Other members.
```
```csharp
}
```

```csharp
public sealed class Expression<TDelegate> : LambdaExpression
```
```csharp
{
```
```csharp
public TDelegate Compile();
```

```csharp
// Other members.
```
```csharp
}
```

}

The above expression tree data structure can be visualized as:

Expression<Func<int, bool>> (NodeType = Lambda, Type = Func<int, bool>)

```csharp
|_Parameters
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = int)
```
```csharp
| |_Name = "int32"
```
```csharp
|_Body
```
```csharp
|_BinaryExpression (NodeType = GreaterThan, Type = bool)
```
```csharp
|_Left
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = int)
```
```csharp
| |_Name = "int32"
```
```csharp
|_Right
```
```csharp
|_ConstantExpression (NodeType = Constant, Type = int)
```

|\_Value = 0

So, this expression tree is an abstract syntax tree (AST), representing the abstract syntactic structure of C# function (int32 => int32 > 0)’s source code. Notice each node has NodeType property and Type property. NodeType returns the syntax type in the tree, and Type returns the represented .NET type. For example, above ParameterExpression represents parameter node of int type in the source code, so its NodeType is Parameter and its Type is int.

To summarize, the differences between

Func<int, bool\>isPositive = int32 => int32 > 0;// Code.

and

Expression<Func<int, bool\>> isPositiveExpression = int32 => int32> 0;// Data.

are:

· isPositive variable is a function represented by delegate instance, and can be called. The lambda expression int32 => int32 > 0 is compiled to executable code. When isPositive is called, this code is executed.

· isPositiveExpression variable is an abstract syntax tree data structure. So apparently it cannot be called like an executable function. The lambda expression int32 => int32 > 0 is compiled to the building of an expression tree, where each node is an Expression instance. This entire tree represents the syntactic structure and logic of function int32 => int32 > 0. This tree’s top node is an Expression<Func<int, bool>> instance, since this is a lambda expression. It has 2 child nodes:

o A Parameters node which is a ParameterExpression collection, representing all the parameters of the lambda expression. The above lambda expression has 1 parameter, so this collection contains one node:

§ A ParameterExpression instance, representing the int parameter named “int32”.

o A Body node representing the lambda expression’s body, which is a BinaryExpression instance, representing the body is a “>” (greater than) comparison operation of 2 operands. So it has 2 child nodes:

§ Its Left child node is a reference of above ParameterExpression instance, representing the left operand of > operator.

§ Its Right child node is a ConstantExpression instance with value 0, representing the right operand of > operator.

Automatically generating expression tree from function-like code provides great convenience for metaprogramming in C#. As mentioned in the introduction chapter, metaprogramming is to generate or manipulate program code as data. With the generated expression tree, since each node is strong typed with rich information, the nodes can be traversed to obtain the information of the represented function’s C# source code, and process the information, like generating code of the same logic in another language. Here isPositiveExpression represents the function logic to predicate whether an int value is greater than a constant 0, and it can be used to generate equivalent CIL code, or a WHERE clause with greater-than-0 predicate in SQL code, etc.

### .NET expressions

Besides above ParameterExpression, ConstantExpression, BinaryExpression, LambdaExpression, .NET Standard provides a rich collection of expressions nodes. The following is their inheritance hierarchy:

· Expression

o BinaryExpression

o BlockExpression

o ConditionalExpression

o ConstantExpression

o DebugInfoExpression

o DefaultExpression

o DynamicExpression

o GotoExpression

o IndexExpression

o InvocationExpression

o LabelExpression

o LambdaExpression

§ Expression<TDelegate>

o ListInitExpression

o LoopExpression

o MemberExpression

o MemberInitExpression

o MethodCallExpression

o NewArrayExpression

o NewExpression

o ParameterExpression

o RuntimeVariablesExpression

o SwitchExpression

o TryExpression

o TypeBinaryExpression

o UnaryExpression

And, as demonstrated above, expression can be instantiated by calling the factory methods of Expression type:

public abstract partial class Expression

```csharp
{
```
```csharp
public static ParameterExpression Parameter(Type type, string name);
```

```csharp
public static ConstantExpression Constant(object value, Type type);
```

```csharp
public static BinaryExpression GreaterThan(Expression left, Expression right);
```

```csharp
public static Expression<TDelegate> Lambda<TDelegate>(Expression body, params ParameterExpression[] parameters);
```

}

Expression has many other factory methods to cover all the expression instantiation cases:

public abstract partial class Expression

```csharp
{
```
```csharp
public static BinaryExpression Add(Expression left, Expression right);
```

```csharp
public static BinaryExpression Subtract(Expression left, Expression right);
```

```csharp
public static BinaryExpression Multiply(Expression left, Expression right);
```

```csharp
public static BinaryExpression Divide(Expression left, Expression right);
```

```csharp
public static BinaryExpression Equal(Expression left, Expression right);
```

```csharp
public static UnaryExpression ArrayLength(Expression array);
```

```csharp
public static UnaryExpression Not(Expression expression);
```

```csharp
public static ConditionalExpression Condition(Expression test, Expression ifTrue, Expression ifFalse);
```

```csharp
public static NewExpression New(ConstructorInfo constructor, params Expression[] arguments);
```

```csharp
public static MethodCallExpression Call(MethodInfo method, params Expression[] arguments);
```

```csharp
public static BlockExpression Block(params Expression[] expressions);
```

```csharp
// Other members.
```

}

One expression node type can have different possible NodeType values. For example:

· UnaryExpression represents any unary operation with an operator and an operand. Its NodeType can be ArrayLength, Negate, Not, Convert, Decrement, Increment, Throw, UnaryPlus, etc.

· BinaryExpression represents any binary operation with an operator, a left operand, and a right operand, its NodeType can be Add, And, Assign, Divide, Equal, .GreaterThan, GreaterThanOrEqual, LessThan, LessThanOrEqual, Modulo, Multiply, NotEqual, Or, Power, Subtract, etc.

So far C# compiler only implements this “function as data” syntactic sugar for expression lambda, and it is not available to statement lambda yet. The following code cannot be compiled:

internal static void StatementLambda()

```csharp
{
```
```csharp
Expression<Func<int, bool>>isPositiveExpression = int32 =>
```
```csharp
{
```
```csharp
Console.WriteLine(int32);
```
```csharp
return int32 > 0;
```
```csharp
}; // Cannot be compiled.
```

}

The above expression tree has to be built manually:

internal static void StatementLambda()

```csharp
{
```
```csharp
ParameterExpression parameterExpression = Expression.Parameter(type: typeof(int), name: "int32"); // int32 parameter.
```
```csharp
Expression<Func<int, bool>> isPositiveExpression = Expression.Lambda<Func<int, bool>>(
```
```csharp
body: Expression.Block( // ... => {
```
```csharp
// Console.WriteLine(int32);
```
```csharp
arg0: Expression.Call(method: new Action<int>(Console.WriteLine).Method, arg0: parameterExpression),
```
```csharp
// return int32 > 0;
```
```csharp
arg1: Expression.GreaterThan(left: parameterExpression, right: Expression.Constant(value: 0, type: typeof(int)))), // }
```
```csharp
parameters: parameterExpression); // int32 => ...
```

}

## Compile expression tree to CIL

Expression tree is not executable code but data - abstract syntax tree. In C# and LINQ, expression tree is usually used to represent the abstract syntactic structure of function’s source code, so that it can be compiled or translated to other domain-specific languages, like SQL query, HTTP request, etc. To demonstrate this, take the following simple mathematics function as example, which accepts double parameters, then executes the 4 basic binary arithmetical calculation: add, subtract, multiply, divide, and returns double return:

internal static void Infix()

```csharp
{
```
```csharp
Expression<Func<double, double, double, double, double, double>>expression =
```
```csharp
(a, b, c, d, e) => a + b - c * d / 2D + e * 3D;
```

}

The entire tree can be visualized as:

Expression<Func<double, double, double, double, double, double>> (NodeType = Lambda, Type = Func<double, double, double, double, double, double>)

```csharp
|_Parameters
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | |_Name = "a"
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | |_Name = "b"
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | |_Name = "c"
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | |_Name = "d"
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| |_Name = "e"
```
```csharp
|_Body
```
```csharp
|_BinaryExpression (NodeType = Add, Type = double)
```
```csharp
|_Left
```
```csharp
| |_BinaryExpression (NodeType = Subtract, Type = double)
```
```csharp
| |_Left
```
```csharp
| | |_BinaryExpression (NodeType = Add, Type = double)
```
```csharp
| | |_Left
```
```csharp
| | | |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | | |_Name = "a"
```
```csharp
| | |_Right
```
```csharp
| | |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | |_Name = "b"
```
```csharp
| |_Right
```
```csharp
| |_BinaryExpression (NodeType = Divide, Type = double)
```
```csharp
| |_Left
```
```csharp
| | |_BinaryExpression (NodeType = Multiply, Type = double)
```
```csharp
| | |_Left
```
```csharp
| | | |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | | |_Name = "c"
```
```csharp
| | |_right
```
```csharp
| | |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| | |_Name = "d"
```
```csharp
| |_Right
```
```csharp
| |_ConstantExpression (NodeType = Constant, Type = double)
```
```csharp
| |_Value = 2
```
```csharp
|_Right
```
```csharp
|_BinaryExpression (NodeType = Multiply, Type = double)
```
```csharp
|_Left
```
```csharp
| |_ParameterExpression (NodeType = Parameter, Type = double)
```
```csharp
| |_Name = "e"
```
```csharp
|_Right
```
```csharp
|_ConstantExpression (NodeType = Constant, Type = double)
```

|\_Value = 3

This is a very simple syntax tree, where:

· each internal node is a binary node (BinaryExpression instance) representing add, subtract, multiply, or divide binary operations;

· each leaf node is either a parameter (ParameterExpression instance), or a constant (ConstantExpression instance).

In total there are 6 kinds of nodes in this tree:

· add: BinaryExpression { NodeType = ExpressionType.Add }

· subtract: BinaryExpression { NodeType = ExpressionType.Subtract }

· multiply: BinaryExpression { NodeType = ExpressionType.Multiply }

· divide: BinaryExpression { NodeType = ExpressionType.Divide}

· constant: ParameterExpression { NodeType = ExpressionType.Constant }

· parameter: ConstantExpression { NodeType = ExpressionType.Parameter }

### Traverse expression tree

The above expression is an infix expression, where each operator is in the middle of its 2 operands. It is very easy to traverse the expression tree and convert it to a prefix form (also called Polish notation), where each operator precedes its operands, just like a function to be called:

internal static string PreOrderOutput(this LambdaExpression expression)

```csharp
{
```
```csharp
string VisitNode(Expression node)
```
```csharp
{
```
```csharp
switch (node.NodeType)
```
```csharp
{
```
```csharp
case ExpressionType.Add:
```
```csharp
case ExpressionType.Subtract:
```
```csharp
case ExpressionType.Multiply:
```
```csharp
case ExpressionType.Divide:
```
```csharp
BinaryExpression binary = (BinaryExpression)node;
```
```csharp
// Pre-order output: current node, left child, right child.
```
```csharp
return $"{binary.NodeType}({VisitNode(binary.Left)}, {VisitNode(binary.Right)})";
```

```csharp
case ExpressionType.Constant:
```
```csharp
return ((ConstantExpression)node).Value.ToString();
```

```csharp
case ExpressionType.Parameter:
```
```csharp
return ((ParameterExpression)node).Name;
```

```csharp
default:
```
```csharp
throw new ArgumentOutOfRangeException(nameof(expression));
```
```csharp
}
```
```csharp
}
```

```csharp
return VisitNode(expression.Body);
```

}

It calls a local function to recursively visit each node in lambda expression’s body. If the current node is a BinaryExpression, it recursively visits the Left and Right child nodes, and outputs string representation in pre-order: Operator(Left, Right). If the current node is a ConstantExpression or ParameterExpression, it output the string representation of current node, and terminates the recursion. The above function can convert the infix expression to a prefix expression in function call style:

internal static void Prefix()

```csharp
{
```
```csharp
Expression<Func<double, double, double, double, double, double>> infix =
```
```csharp
(a, b, c, d, e) => a + b - c * d / 2D + e * 3D;
```
```csharp
string prefix = infix.PreOrderOutput();
```
```csharp
prefix.WriteLine(); // Add(Subtract(Add(a, b), Divide(Multiply(c, d), 2)), Multiply(e, 3))
```

}

Actually, .NET Standard provides a built-in System.Linq.Expressions.ExpressionVisitor type with an object-oriented design to traverse general expression trees. This book traverses expression tree in functional paradigm because it is very intuitive for simple arithmetic expression with small code.

### Expression tree to CIL at runtime

If the output is in post-order, where operands are followed by operator, then it can be viewed as the stack operations: push operands to stack, then execute the operator with the operands and push the result on the stack. This is how the evaluation stack based CIL language works. So, a different traversal output in post-order can represent executable CIL instructions. An CIL instruction can be represented by System.Reflection.Emit.OpCode structures with optional argument. So, the output can be a list of instruction-argument pairs (Here a pair is represented by a 2-tuple of OpCode and object. C#’s tuple is discussed in detail in the immutability chapter):

internal static List<(OpCode, object)> PostOrderOutput(this LambdaExpression expression)

```csharp
{
```
```csharp
List<(OpCode, object)> VisitNode(Expression node)
```
```csharp
{
```
```csharp
switch (node.NodeType)
```
```csharp
{
```
```csharp
case ExpressionType.Add:
```
```csharp
return VisitBinary((BinaryExpression)node, OpCodes.Add);
```

```csharp
case ExpressionType.Subtract:
```
```csharp
return VisitBinary((BinaryExpression)node, OpCodes.Sub);
```

```csharp
case ExpressionType.Multiply:
```
```csharp
return VisitBinary((BinaryExpression)node, OpCodes.Mul);
```

```csharp
case ExpressionType.Divide:
```
```csharp
return VisitBinary((BinaryExpression)node, OpCodes.Div);
```

```csharp
case ExpressionType.Constant:
```
```csharp
return new List<(OpCode, object)>()
```
```csharp
{
```
```csharp
(OpCodes.Ldc_R8, ((ConstantExpression)node).Value) // Push constant to stack.
```
```csharp
};
```

```csharp
case ExpressionType.Parameter:
```
```csharp
int parameterIndex = expression.Parameters.IndexOf((ParameterExpression)node);
```
```csharp
return new List<(OpCode, object)>()
```
```csharp
{
```
```csharp
(OpCodes.Ldarg_S, parameterIndex) // Push parameter of the specified index to stack.
```
```csharp
};
```

```csharp
default:
```
```csharp
throw new ArgumentOutOfRangeException(nameof(expression));
```
```csharp
}
```
```csharp
}
```

```csharp
List<(OpCode, object)> VisitBinary(BinaryExpression binary, OpCode postfix)
```
```csharp
{
```
```csharp
// Post-order output: left child, right child, current node.
```
```csharp
List<(OpCode, object)> instructions = VisitNode(binary.Left);
```
```csharp
instructions.AddRange(VisitNode(binary.Right));
```
```csharp
instructions.Add((postfix, null)); // Operate and push the result to stack.
```
```csharp
return instructions;
```
```csharp
}
```

```csharp
return VisitNode(expression.Body);
```

}

The following code outputs a list of converted CIL instruction:

internal static void Postfix()

```csharp
{
```
```csharp
Expression<Func<double, double, double, double, double, double>> infix =
```
```csharp
(a, b, c, d, e) => a + b - c * d / 2D + e * 3D;
```
```csharp
List<(OpCode, object)> postfix = infix.PostOrderOutput();
```
```csharp
foreach ((OpCode instruction, object argument) in postfix)
```
```csharp
{
```
```csharp
$"{instruction} {argument}".WriteLine();
```
```csharp
}
```
```csharp
// ldarg.s 0
```
```csharp
// ldarg.s 1
```
```csharp
// add
```
```csharp
// ldarg.s 2
```
```csharp
// ldarg.s 3
```
```csharp
// mul
```
```csharp
// ldc.r8 2
```
```csharp
// div
```
```csharp
// sub
```
```csharp
// ldarg.s 4
```
```csharp
// ldc.r8 3
```
```csharp
// mul
```
```csharp
// add
```

}

So, the source code in C# language represented by this expression tree is successfully converted to instructions CIL language. In another word, C# is compiled to CIL with the help of expression tree.

### Expression tree to function at runtime

The above compiled CIL code is executable. With C#’s metaprogramming capability, a function can be generated at runtime (instead of compiled time), where the compiled CIL code can be emitted into:

internal static TDelegate CompileToCil<TDelegate>(this Expression<TDelegate> expression)

```csharp
{
```
```csharp
DynamicMethod dynamicFunction = new DynamicMethod(
```
```typescript
name: string.Empty,
```
```csharp
returnType: expression.ReturnType,
```
```csharp
parameterTypes: expression.Parameters.Select(parameter => parameter.Type).ToArray(),
```
```csharp
m: MethodBase.GetCurrentMethod().Module);
```
```csharp
EmitCil(dynamicFunction.GetILGenerator(), expression.PostOrderOutput());
```
```csharp
return (TDelegate)(object)dynamicFunction.CreateDelegate(typeof(TDelegate));
```

```csharp
void EmitCil(ILGenerator generator, List<(OpCode, object)> cil)
```
```csharp
{
```
```csharp
foreach ((OpCode instruction, object argument) in cil)
```
```csharp
{
```
```csharp
if (argument == null)
```
```csharp
{
```
```csharp
generator.Emit(instruction); // add, sub, mul, div has no argument.
```
```csharp
}
```
```csharp
else if (argument is int)
```
```csharp
{
```
```csharp
generator.Emit(instruction, (int)argument); // ldarg.s has int argument of parameter index.
```
```csharp
}
```
```csharp
else if (argument is double)
```
```csharp
{
```
```csharp
generator.Emit(instruction, (double)argument); // ldc.r8 has double argument of constant.
```
```csharp
}
```
```csharp
}
```
```csharp
generator.Emit(OpCodes.Ret); // Return the result.
```
```csharp
}
```

}

The following code demonstrate how to use it to compile C# expression tree of C# code into CIL code encapsulated by a function, then call the function to execute the compiled CIL code, and finally get the result:

internal static void CompileAndRun()

```csharp
{
```
```csharp
Expression<Func<double, double, double, double, double, double>> expression =
```
```csharp
(a, b, c, d, e) => a + b - c * d / 2D + e * 3D;
```
```csharp
Func<double, double, double, double, double, double> function = expression.CompileToCil();
```
```csharp
double result = function(1D, 2D, 3D, 4D, 5D);
```
```csharp
result.WriteLine(); // 12
```

}

.NET provides a built-in API, System.Linq.Expressions.Expression<TDelegate>’s Compile method, for this purpose - compile expression tree to executable function at runtime:

internal static void BuiltInCompile()

```csharp
{
```
```csharp
Expression<Func<double, double, double, double, double, double>>infix =
```
```csharp
(a, b, c, d, e) => a + b - c * d / 2D + e * 3D;
```
```csharp
Func<double, double, double, double, double, double> function = infix.Compile();
```
```csharp
double result = function(1D, 2D, 3D, 4D, 5D
```

}

Internally, Expression<TDelegate>.Compile calls APIs of System.Linq.Expressions.Compiler.LambdaCompile, which is a complete compiler implementation for general expression tree to CIL (not just for simple expression in the above example).

## Lambda expression and LINQ query

As such a powerful syntactic sugar, lambda expression is very important in LINQ query. In local LINQ query for data in memory, lambda expression is compiled as anonymous function. In remote LINQ query for data in a different data domain, lambda expression is compiled as expression tree, which can be compiled or translated from C# language to that domain’s specific language. In above examples, expression tree is compiled to executable CIL. In other scenarios of LINQ remote query, like LINQ to Entities, expression tree can be translated to a part of SQL query that can be executed in database The following examples are a typical LINQ to Objects query (for local data in-memory) and a similar LINQ to Entities query (for remote data in database):

internal static void LocalLinqToObjectsQuery(IEnumerable<Product> source) // Get source.

```csharp
{
```
```csharp
IEnumerable<Product> query = source.Where(product => product.ListPrice > 0M); // Define query.
```
```csharp
foreach (Product result in query) // Execute query.
```
```csharp
{
```
```csharp
result.Name.WriteLine();
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void RemoteLinqToEntitiesQuery(IQueryable<Product> source) // Get source.
```
```csharp
{
```
```csharp
IQueryable<Product> query = source.Where(product => product.ListPrice > 0M); // Define query.
```
```csharp
foreach (Product result in query) // Execute query.
```
```csharp
{
```
```csharp
result.Name.WriteLine();
```
```csharp
}
```

}

As mentioned in the introduction chapter, local LINQ query is represented by IEnumerable<T>, and remote LINQ query is represented by IQueryable<T>. They have different LINQ query methods, take above Where as example:

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
}
```

}

Where query filters the local/remote data source with the specified predicate as anonymous function/expression tree. For each value in the data source, if the predicate evaluates to true, the data value should be in the query results; otherwise, the data value should be ignored. In the above LINQ to Object/LINQ to Entities queries, the Where query and predicate has exactly the same logic and syntax (filter the source of products, and only keep the products with list price greater than 0), but they are compiled totally differently:

internal static void EquivalentLinqToObjectsQuery(IEnumerable<Product> source) // Get source.

```csharp
{
```
```csharp
Func<Product, bool> predicateFunction = product => product.ListPrice > 0M;
```
```csharp
// Compiled to named function with cache field.
```

```csharp
IEnumerable<Product> query = Enumerable.Where(source, predicateFunction); // Define query.
```

```csharp
foreach (Product result in query) // Execute query.
```
```csharp
{
```
```csharp
result.Name.WriteLine();
```
```csharp
}
```
```csharp
}
```

```csharp
internal static void EquivalentLinqToEntitiesQuery(IQueryable<Product> source) // Get source.
```
```csharp
{
```
```csharp
Expression<Func<Product, bool>> predicateExpression = product => product.ListPrice > 0M;
```
```csharp
// Compiled to:
```
```csharp
// ParameterExpression productParameter = Expression.Parameter(type: typeof(Product), name: "product");
```
```csharp
// Expression<Func<Product, bool>> predicateExpression = Expression.Lambda<Func<Product, bool>>(
```
```csharp
// body: Expression.GreaterThan(
```
```csharp
// left: Expression.Property(expression: productParameter, propertyName: nameof(Product.ListPrice)),
```
```csharp
// right: Expression.Constant(value: 0M, type: typeof(decimal))),
```
```csharp
// productParameter);
```

```csharp
IQueryable<Product> query = Queryable.Where(source, predicateExpression); // Define query.
```

```csharp
foreach (Product result in query) // Execute query.
```
```csharp
{
```
```csharp
result.Name.WriteLine();
```
```csharp
}
```

}

At runtime, when the local query executes, the anonymous function is called to predict each local value in the local data source, and the remote query is translated to a WHERE clause in SQL query, then submit to the remote data source and execute. The local query’s usage, execution, and implementation is discussed in the LINQ to Objects chapters. The remote query’s usage, execution and the translation from expression tree to SQL will be discussed in LINQ to Entities chapters.

## Summary

This chapter discusses C#’s lambda expression, a very powerful syntactic sugar that is very useful in functional programming and LINQ. Lambda expression can be used to define anonymous function. C# implements this by compiling lambda expression to named function. C# also implements lambda expression’s expression body syntax for all kinds of named functions. Lambda expression can also be used to build expression tree, which is a data structure of abstract syntax tree. This chapter also demonstrates how to traverse expression tree and convert C# code to another language, as well as how LINQ implement local query and remote query with one syntax for different query methods and lambda expressions.