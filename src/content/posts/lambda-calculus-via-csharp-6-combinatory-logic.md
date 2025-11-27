---
title: "Lambda Calculus via C# (6) Combinatory Logic"
published: 2024-11-19
description: "In lambda calculus, the primitive is function, which can have free variables and bound variables.  was introduced by [Moses Schönfink"
image: ""
tags: ["LINQ via C#", "C#", ".NET", "Lambda Calculus", "Functional Programming", "Combinators", "Combinatory Logic", "SKI", "Iota"]
category: "LINQ via C#"
draft: false
lang: ""
---

## \[[FP & LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Lambda Calculus via C# series](/archive/?tag=Lambda%20Calculus)\]

In lambda calculus, the primitive is function, which can have free variables and bound variables. [Combinatory logic](http://en.wikipedia.org/wiki/Combinatory_logic) was introduced by [Moses Schönfinkel](http://en.wikipedia.org/wiki/Moses_Sch%C3%B6nfinkel) and [Haskell Curry](http://en.wikipedia.org/wiki/Haskell_Curry) in 1920s. It is equivalent variant lambda calculus, with combinator as primitive. A combinator can be viewed as an expression with no free variables in its body.

## Combinator

The following is the simplest function definition expression, with only bound variable and no free variable:
```
I := λx.x
```

In combinatory logic it is called I (Id) combinator. The following functions are combinators too:
```
S := λx.λy.λz.x z (y z)
K := λx.λy.x
```

Here S (Slider) combinator slides z to between x and y (In some materials S is called Substitution; In [presentation](https://www.youtube.com/watch?v=7cPtCpyBPNI) of [Dana Scott](http://en.wikipedia.org/wiki/Dana_Scott) S is called Slider), and K (Killer) combinator kills y.

In C#, just leave the each combinator’s variables as dynamic:
```
public static partial class SkiCombinators
{
    public static readonly Func<dynamic, Func<dynamic, Func<dynamic, dynamic>>>
        S = x => y => z => x(z)(y(z));

    public static readonly Func<dynamic, Func<dynamic, dynamic>>
        K = x => y => x;

    public static readonly Func<dynamic, dynamic>
        I = x => x;
}
```

ω is the self application combinator. It applies variable f to f itself:
```
ω := λf.f f
```

Just like above f, ω can also be applied with ω itself, which is the definition of Ω:
```
Ω := ω ω ≡ (λf.f f) (λf.f f)
```

Here ω is a function definition expression without free variables, and Ω is a function application expression, which contains no free variables. For Ω, its function application can be beta reduced forever:
```
(λf.f f) (λf.f f)
≡ (λf.f f) (λf.f f)
≡ (λf.f f) (λf.f f)
≡ ...
```

So ω ω is an infinite application. Ω is called the looping combinator.

In C#, it is easy to define the type of self applicable function, like above f. Assume the function’s return type is TResult, then this function is of type input –> TResult:
```
public delegate TResult Func<TResult>(?);
```

The input type is the function type itself, so it is:
```
public delegate TResult Func<TResult>(Func<TResult> self)
```

Above Func<TResult> is the self applicable function type. To be unambiguous with System.Func<TResult>, it can be renamed to SelfApplicableFunc<TResult>:
```
public delegate TResult SelfApplicableFunc<TResult>(SelfApplicableFunc<TResult> self);
```

So SelfApplicableFunc<TResult> is equivalent to SelfApplicableFunc<TResult> -> TResult. Since f is of type SelfApplicableFunc<TResult>, f(f) returns TResult. And since ω accept f and returns TResult. ω is of type SelfApplicableFunc<TResult> -> TResult, which is the definition of SelfApplicableFunc<TResult>, so ω is still of type SelfApplicableFunc<TResult>, ω(ω) is still of type TResult:
```
public static class OmegaCombinators<TResult>
{
    public static readonly SelfApplicableFunc<TResult>
        ω = f => f(f);

    public static readonly TResult
        Ω = ω(ω);
}
```

## SKI combinator calculus

The [SKI combinator calculus](http://en.wikipedia.org/wiki/SKI_combinator_calculus) is a kind of combinatory logic. As a variant of lambda calculus, SKI combinatory logic has no general expression definition rules, or general expression reduction rules. It only has the above S, K, I combinators as the only 3 primitives, and the only 3 function application rules. It can be viewed as a reduced version of lambda calculus, and an extremely simple Turing complete language with only 3 elements: S, K, I.

Take the Boolean values as a simple example. Remember in lambda calculus, True and False are defined as:
```
True := λt.λf.t
False := λt.λf.f
```

So that when they are applied:
```
True t f
≡ (λt.λf.t) t f
≡ t

  False t f
≡ (λt.λf.f) t f
≡ f
```

Here in SKI combinator calculus, SKI combinators are the only primitives, so True and False can be defined as:
```
True := K
False := S K
```

So that when they are applied, they return the same result as the lambda calculus definition:
```
True t f
≡ K t f
≡ t

  False t f
≡ S K t f
≡ K f (t f) 
≡ f
```

Remember function composition is defined as:
```
(f2 ∘ f1) x := f2 (f1 x)
```

In SKI, the composition operator can be equivalently defined as:
```
Compose := S (K S) K
```

And this is how it works:
```
Compose f2 f1 x
≡ S (K S) K f2 f1 x
≡ (K S) f2 (K f2) f1 x
≡ S (K f2) f1 x
≡ (K f2) x (f1 x)
≡ f2 (f1 x)
```

In lambda calculus, numerals are defined as:
```
0 := λf.λx.x
1 := λf.λx.f x
2 := λf.λx.f (f x)
3 := λf.λx.f (f (f x))
...
```

In SKI, numerals are equivalently defined as:
```
0 := K I                     ≡ K I
1 := I                       ≡ I
2 := S Compose I             ≡ S (S (K S) K) I
3 := S Compose (S Compose I) ≡ S (S (K S) K) (S (S (K S) K) I)
...
```

When these numerals are applied, they return the same results as lambda calculus definition:
```
0 f x
≡ K I f x
≡ I x
≡ x

  1 f x
≡ I f x
≡ f x

  2 f x
≡ S Compose I f x
≡ Compose f (I f) x
≡ Compose f f x
≡ f (f x)

  3 f x
≡ S Compose (S Compose I) f x
≡ Compose f (S Compose I f) x
≡ Compose f (Compose f f) x
≡ f (f (f x))

...
```

In SKI, the self application combinator ω is:
```
ω := S I I
```

When it is applied with f, it returns f f:
```
S I I f
≡ I x (I f) 
≡ f f
```

So naturally, Ω is defined as:
```
Ω := (S I I) (S I I)
```

And it is infinite as in lambda calculus:
```
S I I (S I I)
≡ I (S I I) (I (S I I)) 
≡ I (S I I) (S I I) 
≡ S I I (S I I)
...
```

Actually, I combinator can be defined with S and K in either of the following ways:
```
I := S K K
I := S K S
```

And they work the same:
```
I x
≡ S K K x
≡ K x (K x)
≡ x

  I x
≡ S K S x
≡ K x (S x)
≡ x
```

So I is just a syntactic sugar in SKI calculus.

In C#, these combinators can be implemented as:
```
using static SkiCombinators;

public static partial class SkiCalculus
{
    public static readonly Boolean
        True = new Boolean(K);

    public static readonly Boolean
        False = new Boolean(S(K));

    public static readonly Func<dynamic, dynamic>
        Compose = S(K(S))(K);

    public static readonly Func<dynamic, dynamic>
        Zero = K(I);

    public static readonly Func<dynamic, dynamic>
        One = I;

    public static readonly Func<dynamic, dynamic>
        Two = S(Compose)(I);

    public static readonly Func<dynamic, dynamic>
        Three = S(Compose)(S(Compose)(I));

    // ...

    public static readonly Func<dynamic, Func<dynamic, dynamic>>
        Increase = S(Compose);

    public static readonly Func<dynamic, dynamic>
        ω = S(I)(I);

    public static readonly Func<dynamic, dynamic>
        Ω = S(I)(I)(S(I)(I));

    public static readonly Func<dynamic, dynamic>
        IWithSK = S(K)(K); // Or S(K)(S).
}
```

### SKI compiler: compile lambda calculus expression to SKI calculus combinator

The S, K, I combinators can be composed to new combinator that equivalent to any lambda calculus expression. An arbitrary expression in lambda calculus can be converted to combinator in SKI calculus. Assume v is a variable in lambda calculus, and E is an expression in lambda calculus, the conversion ToSki is defined as:

1.  ToSki (v) => v
2.  ToSki (E1 E2) => (ToSki (E1) (ToSki (E2)))
3.  ToSki (λv.E) => (K (ToSki (E))), if x does not occur free in E
4.  ToSki (λv.v) => I
5.  ToSki (λv1.λv2.E) => ToSki (λv1.ToSki (λv2.E))
6.  ToSki (λv.(E1 E2)) => (S (ToSki (λ.v.E1)) (ToSki (λv.E2)))

Based on these rules, a compiler can be implemented to compile a expression in lambda calculus to combinator in SKI calculus. As mentioned before, the C# lambda expression can be compiled as function, and also expression tree data representing the logic of that function:
```
internal static void FunctionAsData<T>()
{
    Func<T, T> idFunction = value => value;
    Expression<Func<T, T>> idExpression = value => value;
}
```

The above idFunction and idExpression shares the same lambda expression syntax, but is executable function, while the idExpression is a abstract syntax tree data structure, representing the logic of idFunction:
```
Expression<Func<T, T>> (NodeType = Lambda, Type = Func<T, T>)
|_Parameters
| |_ParameterExpression (NodeType = Parameter, Type = T)
|   |_Name = "value"
|_Body
  |_ParameterExpression (NodeType = Parameter, Type = T)
    |_Name = "value"
```

This metaprogramming feature provides great convenience for the conversion – just build the lambda calculus expression as .NET expression tree, traverse the tree and apply the above rules, and convert the tree to another tree representing the SKI calculus combinator.

A SKI calculus combinator, like above Ω combinator (S I I) (S I I), is a composition of S, K, I. The S, K, I primitives can be represented with a constant expression:

```csharp
public class CombinatorExpression : Expression
{
    private CombinatorExpression(string name) => this.Name = name;

    public static CombinatorExpression S { get; } = new CombinatorExpression(nameof(S));

    public static CombinatorExpression K { get; } = new CombinatorExpression(nameof(K));

    public static CombinatorExpression I { get; } = new CombinatorExpression(nameof(I));

    public string Name { get; }

    public override ExpressionType NodeType { get; } = ExpressionType.Constant;

    public override Type Type { get; } = typeof(object);
}
```

The composition can be represented with a function application expression:

```csharp
public class ApplicationExpression : Expression
{
    internal ApplicationExpression(Expression function, Expression variable)
    {
        this.Function = function;
        this.Variable = variable;
    }

    public Expression Function { get; }

    public Expression Variable { get; }

    public override ExpressionType NodeType { get; } = ExpressionType.Invoke;

    public override Type Type { get; } = typeof(object);
}
```

So the above Ω combinator (S I I) (S I I) can be represented by the following expression tree:
```
ApplicationExpression (NodeType = Invoke, Type = object)
|_Function
| |_ApplicationExpression (NodeType = Invoke, Type = object)
|   |_Function
|   | |_ApplicationExpression (NodeType = Invoke, Type = object)
|   |   |_Function
|   |   | |_CombinatorExpression (NodeType = Constant, Type = object)
|   |   |   |_Name = "S"
|   |   |_Variable
|   |     |_CombinatorExpression (NodeType = Constant, Type = object)
|   |       |_Name = "I"
|   |_Variable
|     |_CombinatorExpression (NodeType = Constant, Type = object)
|       |_Name = "I"
|_Variable
  |_ApplicationExpression (NodeType = Invoke, Type = object)
    |_Function
    | |_ApplicationExpression (NodeType = Invoke, Type = object)
    |   |_Function
    |   | |_CombinatorExpression (NodeType = Constant, Type = object)
    |   |   |_Name = "S"
    |   |_Variable
    |     |_CombinatorExpression (NodeType = Constant, Type = object)
    |       |_Name = "I"
    |_Variable
      |_CombinatorExpression (NodeType = Constant, Type = object)
        |_Name = "I"
```

So in the following SkiCompiler type, the ToSki is implemented to traverse the input abstract syntax tree recursively, and apply the above conversion rules:
```
public static partial class SkiCompiler
{
    public static Expression ToSki(this Expression lambdaCalculus)
    {
        // Ignore type convertion specified in code or generated by C# compiler.
        lambdaCalculus = lambdaCalculus.IgnoreTypeConvertion();

        switch (lambdaCalculus.NodeType)
        {
            case ExpressionType.Constant:
                // 0. ToSki(S) = S, ToSki(K) = K, ToSki(I) = I.
                if (lambdaCalculus is CombinatorExpression)
                {
                    return lambdaCalculus;
                }
                break;

            case ExpressionType.Parameter:
                // 1. ToSki(v) = v.
                return lambdaCalculus;

            case ExpressionType.Invoke:
                // 2. ToSki(E1(E2)) = ToSki(E1)(ToSKi(E2)).
                ApplicationExpression application = lambdaCalculus.ToApplication();
                return new ApplicationExpression(ToSki(application.Function), ToSki(application.Variable));

            case ExpressionType.Lambda:
                LambdaExpression function = (LambdaExpression)lambdaCalculus;
                ParameterExpression variable = function.Parameters.Single();
                Expression body = function.Body.IgnoreTypeConvertion();

                // 3. ToSki(v => E) = K(ToSki(E)), if v does not occur free in E.
                if (!variable.IsFreeIn(body))
                {
                    return new ApplicationExpression(CombinatorExpression.K, ToSki(body));
                }

                switch (body.NodeType)
                {
                    case ExpressionType.Parameter:
                        // 4. ToSki(v => v) = I
                        if (variable == (ParameterExpression)body)
                        {
                            return CombinatorExpression.I;
                        }
                        break;

                    case ExpressionType.Lambda:
                        // 5. ToSki(v1 => v2 => E) = ToSki(v1 => ToSki(v2 => E)), if v1 occurs free in E.
                        LambdaExpression bodyFunction = (LambdaExpression)body;
                        if (variable.IsFreeIn(bodyFunction.Body))
                        {
                            return ToSki(Expression.Lambda(ToSki(bodyFunction), variable));
                        }
                        break;

                    case ExpressionType.Invoke:
                        // 6. ToSki(v => E1(E2)) = S(ToSki(v => E1))(ToSki(v => E2)).
                        ApplicationExpression bodyApplication = body.ToApplication();
                        return new ApplicationExpression(
                            new ApplicationExpression(
                                CombinatorExpression.S,
                                ToSki(Expression.Lambda(bodyApplication.Function, variable))),
                            ToSki(Expression.Lambda(bodyApplication.Variable, variable)));
                }
                break;
        }
        throw new ArgumentOutOfRangeException(nameof(lambdaCalculus));
    }
}
```

It calls a few helper functions:

```csharp
private static Expression IgnoreTypeConvertion(this Expression lambdaCalculus) =>
    lambdaCalculus.NodeType == ExpressionType.Convert
        ? ((UnaryExpression)lambdaCalculus).Operand
        : lambdaCalculus;

private static ApplicationExpression ToApplication(this Expression expression)
{
    switch (expression)
    {
        case ApplicationExpression application:
            return application;
        case InvocationExpression invocation:
            return new ApplicationExpression(invocation.Expression, invocation.Arguments.Single());
    }
    throw new ArgumentOutOfRangeException(nameof(expression));
}

private static bool IsFreeIn(this ParameterExpression variable, Expression lambdaCalculus)
{
    // Ignore type convertion specified in code or generated by C# compiler.
    lambdaCalculus = lambdaCalculus.IgnoreTypeConvertion();

    switch (lambdaCalculus.NodeType)
    {
        case ExpressionType.Invoke:
            ApplicationExpression application = lambdaCalculus.ToApplication();
            return variable.IsFreeIn(application.Function) || variable.IsFreeIn(application.Variable);
        case ExpressionType.Lambda:
            LambdaExpression function = (LambdaExpression)lambdaCalculus;
            return variable != function.Parameters.Single() && variable.IsFreeIn(function.Body);
        case ExpressionType.Parameter:
            return variable == (ParameterExpression)lambdaCalculus;
        case ExpressionType.Constant:
            return false;
    }
    throw new ArgumentOutOfRangeException(nameof(lambdaCalculus));
}
```

Sometimes, in order to make the lambda calculus expression be compiled, some type information has to be added manually or automatically by C# compiler. These type conversion information is not needed, and can be removed by IgnoreTypeConvertion. In lambda expression, function invocation is compiled as InvocationExpression node with node type Invoke, which is the same as ApplicationExpression. For convenience, ToApplication unifies all Invoke nodes to ApplicationExpression. And IsFreeIn recursively test whether the specified variable occurs free in the specified lambda calculus expression.

Finally, for readability, the following ToSkiString method Converts the compiled SKI calculus expression to string representation:

```csharp
public static string ToSkiString(this Expression skiCalculus) => skiCalculus.ToSkiString(false);

private static string ToSkiString(this Expression skiCalculus, bool parentheses)
{
    switch (skiCalculus.NodeType)
    {
        case ExpressionType.Invoke:
            ApplicationExpression application = (ApplicationExpression)skiCalculus;
            return parentheses
                ? $"({application.Function.ToSkiString(false)} {application.Variable.ToSkiString(true)})"
                : $"{application.Function.ToSkiString(false)} {application.Variable.ToSkiString(true)}";
        case ExpressionType.Parameter:
            return ((ParameterExpression)skiCalculus).Name;
        case ExpressionType.Constant:
            return ((CombinatorExpression)skiCalculus).Name;
    }
    throw new ArgumentOutOfRangeException(nameof(skiCalculus));
}
```

The following example demonstrates how to represent 2-tuple in SKI calculus combinator:
```
internal static void Tuple<T1, T2>()
{
    Expression<Func<T1, Func<T2, Tuple<T1, T2>>>>
        createTupleLambda = item1 => item2 => f => f(item1)(item2);
    Expression createTupleSki = createTupleLambda.ToSki();
    createTupleSki.ToSkiString().WriteLine();
    // S (S (K S) (S (K K) (S (K S) (S (K (S I)) (S (K K) I))))) (K (S (K K) I))
}
```

To verify the result, a tuple can be created with x as first item, and y as the second item:
```
CreateTuple x y
≡ S (S (K S) (S (K K) (S (K S) (S (K (S I)) (S (K K) I))))) (K (S (K K) I)) x y
≡ S (K S) (S (K K) (S (K S) (S (K (S I)) (S (K K) I)))) x (K (S (K K) I) x) y
≡ K S x (S (K K) (S (K S) (S (K (S I)) (S (K K) I))) x) (K (S (K K) I) x) y
≡ S (S (K K) (S (K S) (S (K (S I)) (S (K K) I))) x) (K (S (K K) I) x) y
≡ S (K K) (S (K S) (S (K (S I)) (S (K K) I))) x y (K (S (K K) I) x y)
≡ K K x (S (K S) (S (K (S I)) (S (K K) I)) x) y (K (S (K K) I) x y)
≡ K (S (K S) (S (K (S I)) (S (K K) I)) x) y (K (S (K K) I) x y)
≡ S (K S) (S (K (S I)) (S (K K) I)) x (K (S (K K) I) x y)
≡ K S x (S (K (S I)) (S (K K) I) x) (K (S (K K) I) x y)
≡ S (S (K (S I)) (S (K K) I) x) (K (S (K K) I) x y)
≡ S (K (S I) x (S (K K) I x)) (K (S (K K) I) x y)
≡ S (S I (S (K K) I x)) (K (S (K K) I) x y)
≡ S (S I ((K K) x (I x))) (K (S (K K) I) x y)
≡ S (S I (K (I x))) (K (S (K K) I) x y)
≡ S (S I (K x)) (K (S (K K) I) x y)
≡ S (S I (K x)) (S (K K) I y)
≡ S (S I (K x)) (K K y (I y))
≡ S (S I (K x)) (K (I y))
≡ S (S I (K x)) (K y)
```

To get the first/second item of the above tuple, apply it with True/False:
```
Item1 (CreateTuple x y)
≡ (CreateTuple x y) True
≡ S (S I (K x)) (K y) True
≡ S (S I (K x)) (K y) K
≡ S I (K x) K (K y K)
≡ I K (K x K) (K y K)
≡ K (K x K) (K y K)
≡ K x K
≡ x

  Item2 (CreateTuple x y)
≡ (CreateTuple x y) False
≡ S (S I (K x)) (K y) False
≡ S (S I (K x)) (K y) (S K)
≡ S I (K x) (S K) (K y (S K))
≡ I (S K) (K x (S K)) (K y (S K))
≡ S K (K x (S K)) (K y (S K))
≡ K y (K x (S K) y)
≡ y
```

So the compiled 2-tuple SKI calculus combinator is equivalent to the lambda calculus expression.

Another example is the logic operator And:
```
And := λa.λb.a b False ≡ λa.λb.a b (λt.λf.f)
```

So in C#:
```
internal static void And()
{
    Expression<Func<Boolean, Func<Boolean, Boolean>>>
        andLambda = a => b => a(b)((Boolean)(@true => @false => @false));
    Expression andSki = andLambda.ToSki();
    andSki.ToSkiString().WriteLine();;
}
```

Unfortunately, above expression tree cannot be compiled, with error CS1963: An expression tree may not contain a dynamic operation. The reason is, Boolean is the alias of Func<dynamic, Func<dynamic, dynamic>>, and C# compiler does not support dynamic operations in expression tree, like calling a(b) here. At compile time, dynamic is just object, so the solution is to replace dynamic with object, and replace Boolean with object –> object -> object, then the following code can be compiled:
```
internal static void And()
{
    Expression<Func<Func<object, Func<object, object>>, Func<Func<object, Func<object, object>>, Func<object, Func<object, object>>>>>
        andLambda = a => b => (Func<object, Func<object, object>>)a(b)((Func<object, Func<object, object>>)(@true => @false => @false));
    Expression andSki = andLambda.ToSki();
    andSki.ToSkiString().WriteLine();
    // S (S (K S) (S (S (K S) (S (K K) I)) (K I))) (K (K (K I)))
}
```

The compilation result can be verified in similar way:
```
And True True
≡ S (S (K S) (S (S (K S) (S (K K) I)) (K I))) (K (K (K I))) True True
≡ S (S (K S) (S (S (K S) (S (K K) I)) (K I))) (K (K (K I))) K K
≡ S (K S) (S (S (K S) (S (K K) I)) (K I)) K (K (K (K I)) K) K
≡ K S K (S (S (K S) (S (K K) I)) (K I) K) (K (K (K I)) K) K
≡ S (S (S (K S) (S (K K) I)) (K I) K) (K (K (K I)) K) K
≡ S (S (K S) (S (K K) I)) (K I) K K (K (K (K I)) K K)
≡ S (K S) (S (K K) I) K (K I K) K (K (K (K I)) K K)
≡ K S K (S (K K) I K) (K I K) K (K (K (K I)) K K)
≡ S (S (K K) I K) (K I K) K (K (K (K I)) K K)
≡ S (K K) I K K (K I K K) (K (K (K I)) K K)
≡ K K K (I K) K (K I K K) (K (K (K I)) K K)
≡ K (I K) K (K I K K) (K (K (K I)) K K)
≡ I K (K I K K) (K (K (K I)) K K)
≡ K (K I K K) (K (K (K I)) K K)
≡ K I K K
≡ I K
≡ K
≡ True

  And True False
≡ S (S (K S) (S (S (K S) (S (K K) I)) (K I))) (K (K (K I))) True False
≡ S (S (K S) (S (S (K S) (S (K K) I)) (K I))) (K (K (K I))) K (S K)
≡ (S (K S)) (S (S (K S) (S (K K) I)) (K I)) K (K (K (K I)) K) (S K)
≡ K S K (S (S (K S) (S (K K) I)) (K I) K) (K (K (K I)) K) (S K)
≡ S (S (S (K S) (S (K K) I)) (K I) K) (K (K (K I)) K) (S K)
≡ S (S (K S) (S (K K) I)) (K I) K (S K) (K (K (K I)) K (S K))
≡ S (K S) (S (K K) I) K (K I K) (S K) (K (K (K I)) K (S K))
≡ K S K (S (K K) I K) (K I K) (S K) (K (K (K I)) K (S K))
≡ S (S (K K) I K) (K I K) (S K) (K (K (K I)) K (S K))
≡ S (K K) I K (S K) (K I K (S K)) (K (K (K I)) K (S K))
≡ K K K (I K) (S K) (K I K (S K)) (K (K (K I)) K (S K))
≡ K (I K) (S K) (K I K (S K)) (K (K (K I)) K (S K))
≡ I K (K I K (S K)) (K (K (K I)) K (S K))
≡ K (K I K (S K)) (K (K (K I)) K (S K))
≡ K I K (S K)
≡ I (S K)
≡ S K
≡ False

...
```

## Iota combinator calculus

Another interesting example of combinator logic is [Iota](http://en.wikipedia.org/wiki/Iota_and_Jot) combinator calculus. It has only one combinator:
```
ι := λf.f S K ≡ λf.f (λx.λy.λz.x z (y z)) (λx.λy.x)
```

That’s [the whole combinatory logic](https://web.archive.org/web/20150121065142/http://semarch.linguistics.fas.nyu.edu/barker/Iota/). It is an [esoteric programming language](http://en.wikipedia.org/wiki/Esoteric_programming_language) with minimum element – only 1 single element, but still [Turing-complete](http://en.wikipedia.org/wiki/Turing-complete). With Iota combinator, SKI can be implemented as:
```
S := ι (ι (ι (ι ι)))
K := ι (ι (ι ι))
I := ι ι
```

So Iota is as Turing-complete as SKI. For example:
```
I x
≡ ι ι x
≡ (λf.f S K) (λf.f S K) x
≡ (λf.f S K) S K x
≡ (S S K) K x
≡ S K (K K) x
≡ K x ((K K) x)
≡ x
```

In C#, these combinators can be implemented as:
```
public static partial class IotaCombinator
{
    public static readonly Func<dynamic, dynamic>
        ι = f => f
            (new Func<dynamic, Func<dynamic, Func<dynamic, dynamic>>>(x => y => z => x(z)(y(z)))) // S
            (new Func<dynamic, Func<dynamic, dynamic>>(x => y => x)); // K
}

public static class IotaCalculus
{
    public static readonly Func<dynamic, Func<dynamic, Func<dynamic, dynamic>>>
        S = ι(ι(ι(ι(ι))));

    public static readonly Func<dynamic, Func<dynamic, dynamic>>
        K = ι(ι(ι(ι)));

    public static readonly Func<dynamic, dynamic>
        I = ι(ι);
}
```