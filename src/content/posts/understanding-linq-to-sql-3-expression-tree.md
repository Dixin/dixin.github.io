---
title: "Understanding LINQ to SQL (3) Expression Tree"
published: 2010-04-06
description: "\\]"
image: ""
tags: [".NET", "C#", "Functional Programming", "LINQ", "LINQ to SQL", "LINQ via C# Series", "SQL Server", "TSQL", "Visual Studio"]
category: ".NET"
draft: false
lang: ""
---

\[[LINQ via C# series](/posts/linq-via-csharp)\]

In LINQ to Objects, lamda expressions are used everywhere as anonymous method, like Where():
```
public static IEnumerable<TSource> Where<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
```

while in LINQ to SQL, mostly lambda expressions are used as expression tree:
```
public static IQueryable<TSource> Where<TSource>(
    this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate)
```

## Anonymous method vs. expression tree

A [previous post](/posts/understanding-csharp-3-0-features-6-lambda-expression) explained that the same lambda expression (like “number => number > 0") can be compiled into anonymous method, or expression tree. When invoking the second Where() above, if a lambda expression is passed:
```
IQueryable<Product> source = database.Products; // Products table of Northwind database.
// Queryable.Where() is choosed by compiler.
IQueryable<Product> products = source.Where(
    product => product.Category.CategoryName == "Beverages");
```

obviously it is compiled into an expression tree.

## Expression tree for LINQ to SQL

Why expression tree is needed in LINQ to SQL? To understand this, check LINQ to Objects first. LINQ to Objects query methods always require anonymous method. For example:
```
public static IEnumerable<TSource> Where<TSource>(
    this IEnumerable<TSource> source, Func<TSource, bool> predicate)
{
    foreach (TSource item in source)
    {
        if (predicate(item))
        {
            yield return item;
        }
    }
}
```

When a Func<TSource, bool> anonymous method is passed in, it can be applied on each TSource item of the data source, and returns a bool value indicating this item should be yielded (true) or should be dropped (false).

However, if such a method is passed to LINQ to SQL query method, it cannot mean anything for SQL Server. A .NET method (a bunch of IL code) cannot directly work on any data item stored in SQL Server database. Instead, domain-specified code, T-SQL, are required to manipulate data in SQL Server.

How about passing a expression tree? This [previous post](/posts/understanding-csharp-3-0-features-6-lambda-expression) explained that expression tree is a abstract syntax tree representing the structure of some C# code, so it is able to:

-   traverse the tree to get the represented algorithm (like predicting whether the data item is greater than a constant 0, etc.),
-   then translate the algorithm into some SQL-domain-specific operation, like a T-SQL query statement.

So this is the power of C# lambda expression:

-   It can be C# anonymous method, which is able to work on .NET data, like in LINQ to Objects scenarios;
-   It can be expression tree, representing the structure of C# code, which is able to traversed, understood, and translated into another domain-specific code:
    -   In LINQ to SQL, the expression trees are translated to specific T-SQL code, which work on SQL data;
    -   In LINQ to Wikipedia, the expression trees are translated to specific HTTP request of a specific Web service URI, which work on Wikipedia data;
    -   etc.

This is why expression tree is required in LINQ to SQL, and all the other scenarios of using LINQ query against non-.NET data.

## Translate expression tree to T-SQL code

How to write LINQ to SQL queries? How does LINQ to SQL queries implemented? [This post](/posts/understanding-csharp-3-0-features-6-lambda-expression) has explained how to traverse and translate the following simple expression trees with basic arithmetical calculations:
```
Expression<Func<double, double, double, double, double, double>> infixExpression =
    (a, b, c, d, e) => a + b - c * d / 2 + e * 3;
```

By modify the traverse code and translate code a little bit, it can be easily translated to T-SQL and executed in SQL Server.

In T-SQL, arithmetical calculations are infix expressions:

```csharp
public class InorderVisitor : SimpleExpressionVisitor<char>
{
    public InorderVisitor(LambdaExpression expression)
        : base(expression)
    {
    }

    protected override IEnumerable<char> VisitAdd(BinaryExpression add)
    {
        return this.VisitBinary(add, "+"); // (left + right)
    }

    protected override IEnumerable<char> VisitConstant(ConstantExpression constant)
    {
        return constant.Value.ToString();
    }

    protected override IEnumerable<char> VisitDivide(BinaryExpression divide)
    {
        return this.VisitBinary(divide, "/"); // (left / right)
    }

    protected override IEnumerable<char> VisitMultiply(BinaryExpression multiply)
    {
        return this.VisitBinary(multiply, "*"); // (left * right)
    }

    protected override IEnumerable<char> VisitParameter(ParameterExpression parameter)
    {
        // parameterName -> @parameterName
        return string.Format(CultureInfo.InvariantCulture, "@{0}", parameter.Name);
    }

    protected override IEnumerable<char> VisitSubtract(BinaryExpression subtract)
    {
        return this.VisitBinary(subtract, "-"); // (left - right)
    }

    private IEnumerable<char> VisitBinary(BinaryExpression binary, string infix)
    {
        return string.Format(
            CultureInfo.InvariantCulture,
            "({0} {1} {2})", // (left infix right)
            this.VisitNode(binary.Left),
            infix,
            this.VisitNode(binary.Right));
    }
}
```

The above inorder traversing just replaces parameterName with @parameterName, which is required by SQL Server.

Now emit a method to open the SQL connection, execute translated T-SQL, and return the result from SQL Server:

```csharp
public class SqlTranslator<TDelegate> : SimpleExpressionTranslator<TDelegate, char>
    where TDelegate : class
{
    private string _connection;

    public SqlTranslator(Expression<TDelegate> expression, string connection)
        : base(expression, () => new InorderVisitor(expression))
    {
        this._connection = connection;
    }

    protected override void Emit(ILGenerator ilGenerator)
    {
        // Dictionary<string, double> dictionary = new Dictionary<string, double>();
        ilGenerator.DeclareLocal(typeof(Dictionary<string, double>));
        ilGenerator.Emit(
            OpCodes.Newobj,
            typeof(Dictionary<string, double>).GetConstructor(new Type[0]));
        ilGenerator.Emit(OpCodes.Stloc_0);

        for (int i = 0; i < this._expression.Parameters.Count; i++)
        {
            // dictionary.Add("@" + this._expression.Parameters[i].Name, args[i]);
            ilGenerator.Emit(OpCodes.Ldloc_0);
            ilGenerator.Emit(
                OpCodes.Ldstr, 
                string.Format(
                    CultureInfo.InvariantCulture, 
                    "@{0}", this._expression.Parameters[i].Name));
            ilGenerator.Emit(OpCodes.Ldarg_S, i);
            ilGenerator.Emit(
                OpCodes.Callvirt,
                typeof(Dictionary<string, double>).GetMethod(
                    "Add", 
                    new Type[] { typeof(string), typeof(double) }));
        }

        // SqlTranslator<TDelegate>.Query(connection, sql, dictionary);
        ilGenerator.Emit(OpCodes.Ldstr, this._connection);
        ilGenerator.Emit(
            OpCodes.Ldstr, 
            string.Format(
                CultureInfo.InvariantCulture, 
                "SELECT {0}", this._visitor.VisitBody()));
        ilGenerator.Emit(OpCodes.Ldloc_0);
        ilGenerator.Emit(
            OpCodes.Call,
            this.GetType().GetMethod(
                "Query", 
                BindingFlags.Static | BindingFlags.NonPublic, 
                null, 
                new Type[] { typeof(string), typeof(string), 
                    typeof(IEnumerable<KeyValuePair<string, double>>) }, 
                null));

        // Returns the result.
        ilGenerator.Emit(OpCodes.Ret);
    }

    internal static double Query(
        string connection, 
        string sql, 
        IEnumerable<KeyValuePair<string, double>> parameters)
    {
        using (SqlConnection sqlConnection = new SqlConnection(connection))
        using (SqlCommand command = new SqlCommand(sql, sqlConnection))
        {
            sqlConnection.Open();
            foreach (KeyValuePair<string, double> parameter in parameters)
            {
                command.Parameters.AddWithValue(parameter.Key, parameter.Value);
            }

            return (double)command.ExecuteScalar();
        }
    }
}
```

Now it is ready to rock:
```
Expression<Func<double, double, double, double, double, double>> infixExpression =
    (a, b, c, d, e) => a + b - c * d / 2 + e * 3;

SqlTranslator<Func<double, double, double, double, double, double>> sqlTranslator =
    new SqlTranslator<Func<double, double, double, double, double, double>>(
        infixExpression,
        @"Data Source=localhost;Integrated Security=True");
Func<double, double, double, double, double, double> sqlQueryMethod = 
    sqlTranslator.GetExecutor();
double sqlResult = sqlQueryMethod(1, 2, 3, 4, 5);
Console.WriteLine(sqlResult); // 12
```

If the SQL Server profiler is tracing, it shows this T-SQL executed:

```sql
EXEC sp_executesql N'SELECT (((@a + @b) - ((@c * @d) / 2)) + (@e * 3))', N'@a float, @b float, @c float, @d float, @e float', @a = 1, @b = 2, @c = 3, @d = 4, @e = 5
```

Again, please notice what happened is: some program written by C# is easily translated into another domain-specific language (T-SQL), which executes in that specific domain (SQL Server), and returns result to C# code.

## Expression tree types

The following extension method DerivedIn() for System.Type uses LINQ to Objects to query derived types in specified assemblies:
```
public static class TypeExtensions
{
    public static IEnumerable<Type> DerivedIn(this Type type, params string[] assemblyStrings)
    {
        if (type == null)
        {
            throw new ArgumentNullException("type");
        }

        if (assemblyStrings == null || assemblyStrings.Length < 1)
        {
            throw new ArgumentNullException("assemblyStrings");
        }

        return type.DerivedIn(assemblyStrings.Select(
            assemblyString => Assembly.Load(assemblyString)).ToArray());
    }

    public static IEnumerable<Type> DerivedIn(this Type type, params Assembly[] assemblies)
    {
        if (type == null)
        {
            throw new ArgumentNullException("type");
        }

        if (assemblies == null || assemblies.Length < 1)
        {
            throw new ArgumentNullException("assemblies");
        }

        if (type.IsValueType)
        {
            return Enumerable.Empty<Type>();
        }

        return assemblies
            .SelectMany(assembly => assembly.GetExportedTypes())
            .Where(item => item != type && item.IsAssingableTo(type));
    }

    public static bool IsAssingableTo(this Type from, Type to)
    {
        if (from == null)
        {
            throw new ArgumentNullException("from");
        }

        if (to == null)
        {
            throw new ArgumentNullException("to");
        }

        if (!to.IsGenericTypeDefinition)
        {
            // to is not generic type definition.
            return to.IsAssignableFrom(from);
        }

        if (to.IsInterface)
        {
            // type is generic interface definition.
            return from.GetInterfaces().Any(
                        @interface => @interface.IsGenericType &&
                            @interface.GetGenericTypeDefinition() == to);
        }

        // to is generic class definition.
        if (!from.IsClass || from == typeof(object) || from.BaseType == typeof(object))
        {
            return false;
        }

        for (Type current = from; current != typeof(object); current = current.BaseType)
        {
            if (current.IsGenericType && current.GetGenericTypeDefinition() == to)
            {
                return true;
            }
            else if (current.IsGenericTypeDefinition && current == to)
            {
                return true;
            }
        }

        return false;
    }
}
```

The following code invokes this DerivedIn() method to print derived types of System.Linq.Expresions.Expression types:
```
foreach (Type item in typeof(System.Linq.Expressions.Expression)
    .DerivedIn("System.Core"))
{
    Console.WriteLine(item.FullName);
}
```

There are 26 Expression derived types in .NET:

-   System.Linq.Expressions.Expression
    -   System.Linq.Expressions.BinaryExpression
    -   System.Linq.Expressions.BlockExpression
    -   System.Linq.Expressions.ConditionalExpression
    -   System.Linq.Expressions.ConstantExpression
    -   System.Linq.Expressions.DebugInfoExpression
    -   System.Linq.Expressions.DefaultExpression
    -   System.Linq.Expressions.DynamicExpression
    -   System.Linq.Expressions.GotoExpression
    -   System.Linq.Expressions.IndexExpression
    -   System.Linq.Expressions.InvocationExpression
    -   System.Linq.Expressions.LabelExpression
    -   System.Linq.Expressions.LambdaExpression
        -   System.Linq.Expressions.Expression\`1
    -   System.Linq.Expressions.ListInitExpression
    -   System.Linq.Expressions.LoopExpression
    -   System.Linq.Expressions.MemberExpression
    -   System.Linq.Expressions.MemberInitExpression
    -   System.Linq.Expressions.MethodCallExpression
    -   System.Linq.Expressions.NewArrayExpression
    -   System.Linq.Expressions.NewExpression
    -   System.Linq.Expressions.ParameterExpression
    -   System.Linq.Expressions.RuntimeVariablesExpression
    -   System.Linq.Expressions.SwitchExpression
    -   System.Linq.Expressions.TryExpression
    -   System.Linq.Expressions.TypeBinaryExpression
    -   System.Linq.Expressions.UnaryExpression

The underlined types are delivered with Expression Trees v1 in .NET 3.5.

## Expression tree for DLR

Actually, expression related APIs in [DLR](http://en.wikipedia.org/wiki/Dynamic_Language_Runtime) is even much richer. The above CLR stuff can be considered a implementation of subset of DLR expression trees.

Currently, DLR involves only 2 dynamic language:

-   Python ([IronPython](http://en.wikipedia.org/wiki/IronPython))
-   Ruby ([IronRuby](http://en.wikipedia.org/wiki/IronRuby))

The other languages are dropped / removed, like [Managed JSCript](http://dlr.codeplex.com/Thread/View.aspx?ThreadId=58121), [IronScheme](http://en.wikipedia.org/wiki/IronScheme), [VBx](http://en.wikipedia.org/wiki/Visual_Basic_.NET#Visual_Basic_.27VBx.27_.28VB_10.0.29), etc.

Very typically, in IronRuby (Click [here](http://ironruby.codeplex.com/releases/view/41854) to download IronRuby.dll, or click [here](http://dlr.codeplex.com/releases/view/34834) to download the source code and build IronRuby.dll 0.9.1.0):
```
int count = typeof(IronRuby.Compiler.Ast.Expression).DerivedIn("IronRuby").Count();
Console.WriteLine(count); // 64.
```

These 60+ IronRuby 0.9.1.0 expression trees are:

-   IronRuby.Compiler.Ast.Expression
    -   IronRuby.Compiler.Ast.AliasStatement
    -   IronRuby.Compiler.Ast.AndExpression
    -   IronRuby.Compiler.Ast.ArrayConstructor
    -   IronRuby.Compiler.Ast.AssignmentExpression
        -   IronRuby.Compiler.Ast.MemberAssignmentExpression
        -   IronRuby.Compiler.Ast.ParallelAssignmentExpression
        -   IronRuby.Compiler.Ast.SimpleAssignmentExpression
    -   IronRuby.Compiler.Ast.BlockExpression
    -   IronRuby.Compiler.Ast.Body
    -   IronRuby.Compiler.Ast.CallExpression
        -   IronRuby.Compiler.Ast.MethodCall
        -   IronRuby.Compiler.Ast.SuperCall
        -   IronRuby.Compiler.Ast.YieldCall
    -   IronRuby.Compiler.Ast.CaseExpression
    -   IronRuby.Compiler.Ast.ConditionalExpression
    -   IronRuby.Compiler.Ast.ConditionalJumpExpression
    -   IronRuby.Compiler.Ast.ConditionalStatement
    -   IronRuby.Compiler.Ast.DeclarationExpression
        -   IronRuby.Compiler.Ast.MethodDeclaration
        -   IronRuby.Compiler.Ast.ModuleDeclaration
            -   IronRuby.Compiler.Ast.ClassDeclaration
            -   IronRuby.Compiler.Ast.SingletonDeclaration
    -   IronRuby.Compiler.Ast.EncodingExpression
    -   IronRuby.Compiler.Ast.ErrorExpression
    -   IronRuby.Compiler.Ast.Finalizer
    -   IronRuby.Compiler.Ast.ForLoopExpression
    -   IronRuby.Compiler.Ast.HashConstructor
    -   IronRuby.Compiler.Ast.IfExpression
    -   IronRuby.Compiler.Ast.Initializer
    -   IronRuby.Compiler.Ast.IsDefinedExpression
    -   IronRuby.Compiler.Ast.JumpStatement
        -   IronRuby.Compiler.Ast.BreakStatement
        -   IronRuby.Compiler.Ast.NextStatement
        -   IronRuby.Compiler.Ast.RedoStatement
        -   IronRuby.Compiler.Ast.RetryStatement
        -   IronRuby.Compiler.Ast.ReturnStatement
    -   IronRuby.Compiler.Ast.LeftValue
        -   IronRuby.Compiler.Ast.ArrayItemAccess
        -   IronRuby.Compiler.Ast.AttributeAccess
        -   IronRuby.Compiler.Ast.CompoundLeftValue
        -   IronRuby.Compiler.Ast.Variable
            -   IronRuby.Compiler.Ast.ClassVariable
            -   IronRuby.Compiler.Ast.ConstantVariable
            -   IronRuby.Compiler.Ast.GlobalVariable
            -   IronRuby.Compiler.Ast.InstanceVariable
            -   IronRuby.Compiler.Ast.LocalVariable
            -   IronRuby.Compiler.Ast.Placeholder
    -   IronRuby.Compiler.Ast.Literal
    -   IronRuby.Compiler.Ast.MatchExpression
    -   IronRuby.Compiler.Ast.NotExpression
    -   IronRuby.Compiler.Ast.OrExpression
    -   IronRuby.Compiler.Ast.RangeCondition
    -   IronRuby.Compiler.Ast.RangeExpression
    -   IronRuby.Compiler.Ast.RegexMatchReference
    -   IronRuby.Compiler.Ast.RegularExpression
    -   IronRuby.Compiler.Ast.RegularExpressionCondition
    -   IronRuby.Compiler.Ast.RescueExpression
    -   IronRuby.Compiler.Ast.SelfReference
    -   IronRuby.Compiler.Ast.StringConstructor
    -   IronRuby.Compiler.Ast.StringLiteral
        -   IronRuby.Compiler.Ast.SymbolLiteral
    -   IronRuby.Compiler.Ast.UndefineStatement
    -   IronRuby.Compiler.Ast.UnlessExpression
    -   IronRuby.Compiler.Ast.WhileLoopExpression

What the DLR languages’ compilers do is:

-   compile the dynamic language code into abstract syntax tree (AST) as data structure, which is represented by the above Expression-derived types;
-   based on the abstract syntax tree, generate IL code which runs on CLR.

For example, the following IronPython code ([copied from MSDN](http://msdn.microsoft.com/en-us/magazine/cc163344.aspx)):

```python
def yo(yourname):
   text = "hello, "
   return text + yourname

print yo("bill")
```

is compiled into such AST data structure:

![ironpython-ast](https://aspblogs.z22.web.core.windows.net/dixin/Media/ironpythonast_6DDD856C.gif "ironpython-ast")

Now it is Ok to use fore mentioned technology to emit IL and execute.

Just like [Jim Hugunin](http://blogs.msdn.com/hugunin/) said in [his post](http://blogs.msdn.com/hugunin/archive/2007/05/15/dlr-trees-part-1.aspx),

> The key implementation trick in the DLR is using these kinds of trees to pass code around as data and to keep code in an easily analyzable and mutable form as long as possible.

Now expression trees, provided in LINQ, build up a bridge to dynamic programming and metaprogramming:

> Much more recently, this idea has resurfaced as one of the central features in C# 3 and VB.NET 9 that enable LINQ. Linq uses these "expression trees" to capture the semantics of a given block of code in a sufficiently abstract way that it can be optimized to run in different contexts. For example, the DLINQ SQL interfaces can convert that code into a SQL query that will be optimized by the database engine on the back-end. More radical projects like PLINQ are exploring how to take these same kinds of trees and rearrange the code to execute in parallel and on multiple cores when possible.

As noticeable, different expression tree systems are built for CLR languages (like C#, etc.) and DLR languages (like Ruby, etc). The reason is:

> Because our trees were untyped, we didn't believe that they shared much in common with the always strongly typed expression trees in C# 3 and we went about designing these trees as something completely independent.

For more detail of expression trees in .NET 4.0, please [download](http://dlr.codeplex.com/releases/view/34834) this document “Expression Trees v2 Spec”.

## Visualize expression tree while debugging

Since expression tree is required by LINQ to SQL and LINQ to AnyDomainOtherThanDotNet, so the question is, how to debug expression tree?

### Text Visualizer

Visual Studio 2010 has a built-in Text Visualizer for expression tree:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_65A97777.png "image")

Please check MSDN for [the meanings of symbols](http://msdn.microsoft.com/en-us/library/ee725345\(VS.100\).aspx), like $, etc.

### LINQ to SQL query visualizer

In the Visual Studio 2010 local samples, typically:

> C:\\Program Files (x86)\\Microsoft Visual Studio 10.0\\Samples\\1033\\CSharpSamples.zip\\LinqSamples\\QueryVisualizer\\

there is the source code of a LINQ to SQL query visualizer. Build it into LinqToSqlQueryVisualizer.dll, and copy it to the Visual Studio 2010 visualizers folder, typically:

> Documents\\Visual Studio 2010\\Visualizers\\

Then it can be used while debugging LINQ to SQL:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_430538FC.png "image")

The expression and translated T-SQL are both displayed, and the T-SQL can be executed just-in-time by clicking the “Execute” button. This is very useful for debugging expression trees in LINQ to SQL.