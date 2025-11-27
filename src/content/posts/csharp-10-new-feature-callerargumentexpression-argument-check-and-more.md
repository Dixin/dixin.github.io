---
title: "C# 10 new feature CallerArgumentExpression, argument check and more"
published: 2021-11-14
description: "The CallerArgumentExpression has been discussed for years, it was supposed to a part of C# 8.0 but got delayed. Finally this month it is delivered along with C# 10 and .NET 6."
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C# Features", "C# 10.0"]
category: ".NET"
draft: false
lang: ""
---

The CallerArgumentExpression has been discussed for years, it was supposed to a part of C# 8.0 but got delayed. Finally this month it is delivered along with C# 10 and .NET 6.

## CallerArgumentExpressionAttribute and argument compilation

In C# 10, \[CallerArgumentExpression(parameterName)\] can be used to direct the compiler to capture the specified argument’s expression as text. For example:

```csharp
using System.Runtime.CompilerServices;

void Function(int a, TimeSpan b, [CallerArgumentExpression("a")] string c = "", [CallerArgumentExpression("b")] string d = "")
{
    Console.WriteLine($"Called with value {a} from expression '{c}'");
    Console.WriteLine($"Called with value {b} from expression '{d}'");
}
```

When calling above function, The magic happens at compile time:
```
Function(1, default);
// Compiled to: 
Function(1, default, "1", "default");

int x = 1;
TimeSpan y = TimeSpan.Zero;
Function(x, y);
// Compiled to:
Function(x, y, "x", "y");

Function(int.Parse("2") + 1 + Math.Max(2, 3), TimeSpan.Zero - TimeSpan.MaxValue);
// Compiled to:
Function(int.Parse("2") + 1 + Math.Max(2, 3), TimeSpan.Zero - TimeSpan.MaxValue, "int.Parse(\"2\") + 1 + Math.Max(2, 3)", "TimeSpan.Zero - TimeSpan.MaxValue");
```

Function’s parameter c is decorated with \[CallerArgumentExpression("a")\]. So when calling Function, C# compiler will pickup whatever expression passed to a, and use that expression’s text for c. Similarly, whatever expression is used for b, that expression’s text is used for d.

## Argument check

The most useful scenario of this feature is argument check. In the past, a lot of argument check utility methods are created like this:
```
public static partial class Argument
{
    public static void NotNull<T>([NotNull] T? value, string name) where T : class
    {
        if (value is null)
        {
            throw new ArgumentNullException(name);
        }
    }

    public static void NotNullOrWhiteSpace([NotNull] string? value, string name)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException(string.Format(CultureInfo.CurrentCulture, Resources.StringCannotBeEmpty, name));
        }
    }

    public static void NotNegative(int value, string name)
    {
        if (value < 0)
        {
            throw new ArgumentOutOfRangeException(name, value, string.Format(CultureInfo.CurrentCulture, Resources.ArgumentCannotBeNegative, name));
        }
    }
}
```

So they can be used as:
```
public partial record Person
{
    public Person(string name, int age, Uri link)
    {
        Argument.NotNullOrWhiteSpace(name, nameof(name));
        Argument.NotNegative(age, nameof(age));
        Argument.NotNull(link, nameof(link));

        this.Name = name;
        this.Age = age;
        this.Link = link.ToString();
    }

    public string Name { get; }
    public int Age { get; }
    public string Link { get; }
}
```

The problem is, it is very annoying to pass argument name every time. There are some ways to get rid of manually passing argument name, but these approaches introduces other issues. For example, a lambda expression with closure can be used:
```
public partial record Person
{
    public Person(Uri link)
    {
        Argument.NotNull(() => link);

        this.Link = link.ToString();
    }
}
```

And this version of NotNull can take a function:

```csharp
public static partial class Argument
{
    public static void NotNull<T>(Func<T> value)
    {
        if (value() is null)
        {
            throw new ArgumentNullException(GetName(value));
        }
    }

    private static string GetName<T>(Func<T> func)
    {
        // func: () => arg is compiled to DisplayClass with a field and a method. That method is func.
        object displayClassInstance = func.Target!;
        FieldInfo closure = displayClassInstance.GetType()
            .GetFields(BindingFlags.NonPublic | BindingFlags.Public | BindingFlags.Instance)
            .Single();
        return closure.Name;
    }
}
```

See my post on [what is closure and how C# compiles closure](/posts/functional-csharp-local-function-and-closure).

Lambda expression can be also compiled to expression tree. So NotNull can be implemented to take an expression too (See my post on [what is expression tree and how C# compiles expression tree](/posts/functional-csharp-function-as-data-and-expression-tree)):

```csharp
public static partial class Argument
{
    public static void NotNull<T>(Expression<Func<T>> value)
    {
        if (value.Compile().Invoke() is null)
        {
            throw new ArgumentNullException(GetName(value));
        }
    }

    private static string GetName<T>(Expression<Func<T>> expression)
    {
        // expression: () => arg is compiled to DisplayClass with a field. Here expression body is to access DisplayClass instance's field.
        MemberExpression displayClassInstance = (MemberExpression)expression.Body;
        MemberInfo closure = displayClassInstance.Member;
        return closure.Name;
    }
}
```

These approaches introduce the lambda syntax and performance overhead at runtime. And they are extremely fragile too. Now C# 10’s CallerArgumentExpression finally provides a cleaner solution:
```
public static partial class Argument
{
    public static T NotNull<T>([NotNull] this T? value, [CallerArgumentExpression("value")] string name = "")
        where T : class =>
        value is null ? throw new ArgumentNullException(name) : value;

    public static string NotNullOrWhiteSpace([NotNull] this string? value, [CallerArgumentExpression("value")] string name = "") =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException(string.Format(CultureInfo.CurrentCulture, Resources.StringCannotBeEmpty, name), name)
            : value;

    public static int NotNegative(this int value, [CallerArgumentExpression("value")] string name = "") =>
        value < 0
            ? throw new ArgumentOutOfRangeException(name, value, string.Format(CultureInfo.CurrentCulture, Resources.ArgumentCannotBeNegative, name))
            : value;
}
```

Now the argument check can be shorter and fluent:
```
public record Person
{
    public Person(string name, int age, Uri link) => 
        (this.Name, this.Age, this.Link) = (name.NotNullOrWhiteSpace(), age.NotNegative(), link.NotNull().ToString());
        // Compiled to:
        // this.Name = Argument.NotNullOrWhiteSpace(name, "name");
        // this.Age = Argument.NotNegative(age, "age");
        // this.Link = Argument.NotNull(link, "link").ToString();

    public string Name { get; }
    public int Age { get; }
    public string Link { get; }
}
```

The argument name is generated at compile time and there is no performance overhead at runtime at all.

## Assertion and logging

The other useful scenarios could be assertion and logging:
```
[Conditional("DEBUG")]
static void Assert(bool condition, [CallerArgumentExpression("condition")] string expression = "")
{
    if (!condition)
    {
        Environment.FailFast($"'{expression}' is false and should be true.");
    }
}

Assert(y > TimeSpan.Zero);
// Compiled to:
Assert(y > TimeSpan.Zero, "y > TimeSpan.Zero");

[Conditional("DEBUG")]
static void Log<T>(T value, [CallerArgumentExpression("value")] string expression = "")
{
    Trace.WriteLine($"'{expression}' has value '{value}'");
}

Log(Math.Min(Environment.ProcessorCount, x));
// Compiled to:
Log(Math.Min(Environment.ProcessorCount, x), "Math.Min(Environment.ProcessorCount, x)");
```

## Use for older projects

If .NET 6.0 SDK is installed, C# 10 is available, where CallerArgumentExpression can be used targeting to .NET 5 and .NET 6. For older project targeting older .NET or .NET Standard, CallerArgumentExpressionAttribute is not available. Fortunately C# 10 and this feature can still be used with them, as long as .NET 6.0 SDK is installed. Just manually add the CallerArgumentExpressionAttribute class to your project and use it like the built-in attribute:

```csharp
#if !NET5_0 && !NET6_0
namespace System.Runtime.CompilerServices;

/// <summary>
/// Allows capturing of the expressions passed to a method.
/// </summary>
[AttributeUsage(AttributeTargets.Parameter, AllowMultiple = false, Inherited = false)]
internal sealed class CallerArgumentExpressionAttribute : Attribute
{
    /// <summary>
    /// Initializes a new instance of the <see cref="T:System.Runtime.CompilerServices.CallerArgumentExpressionAttribute" /> class.
    /// </summary>
    /// <param name="parameterName">The name of the targeted parameter.</param>
    public CallerArgumentExpressionAttribute(string parameterName) => this.ParameterName = parameterName;

    /// <summary>
    /// Gets the target parameter name of the <c>CallerArgumentExpression</c>.
    /// </summary>
    /// <returns>
    /// The name of the targeted parameter of the <c>CallerArgumentExpression</c>.
    /// </returns>
    public string ParameterName { get; }
}
#endif
```

It should be internal so that when this assembly is referenced by another assembly, there won’t conflict with the built-in version of \[CallerArgumentExpression\]. Then C# 10‘s compiler will pick it up and the above magic will happen.