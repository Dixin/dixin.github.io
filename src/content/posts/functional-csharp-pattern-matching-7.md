---
title: "C# Functional Programming In-Depth (15) Pattern matching"
published: 2018-06-15
description: "Pattern matching is a common feature in functional languages. C# 7.0 introduces basic pattern matching, including constant value as pattern and type as pattern, and C# 7.1 supports generics in pattern"
image: ""
tags: ["C#", ".NET", ".NET Core", ".NET Standard", "LINQ"]
category: "C#"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

## **Latest version: [https://weblogs.asp.net/dixin/functional-csharp-pattern-matching](/posts/functional-csharp-pattern-matching "https://weblogs.asp.net/dixin/functional-csharp-pattern-matching")**[](/posts/functional-csharp-fundamentals "https://weblogs.asp.net/dixin/functional-csharp-fundamentals")

Pattern matching is a common feature in functional languages. C# 7.0 introduces basic pattern matching, including constant value as pattern and type as pattern, and C# 7.1 supports generics in pattern matching.

## Pattern matching with is expression

Before C# 7.0, is keyword is used in the instance is Type expression to test whether the instance is compatible with the specified type. Since C# 7.0, is can test constant pattern, including null, constant value, enumeration:
```
internal static partial class PatternMatching
{
    internal static void IsConstantValue(object @object)
    {
        // Type test:
        bool test1 = @object is string;
        // Constant pattern test:
        bool test5 = @object is null; // Compiled to: @object == null
        bool test6 = @object is default; // Compiled to: @object == null
        bool test2 = @object is int.MinValue; // Compiled to: object.Equals(int.MinValue, @object)
        bool test3 = @object is DayOfWeek.Monday; // Compiled to: object.Equals(DayOfWeek.Monday, @object)
        bool test4 = @object is "test"; // Compiled to: object.Equals("test", @object)
    }
}
```

The is expressions for null test is simply compiled to null check. the other cases are compiled to object.Equal static method calls, where the constant value is the first argument, and the tested instance is the second argument. Internally, object.Equals first does a few checks, then it could call the first argument’s Equals instance method:

```csharp
namespace System
{
    [Serializable]
    public class Object
    {
        public static bool Equals(object objA, object objB) =>
            objA == objB || (objA != null && objB != null && objA.Equals(objB));

        public virtual bool Equals(object obj) =>
            RuntimeHelpers.Equals(this, obj);

        // Other members.
    }
}
```

The early versions of C# 7.0 compiler takes the tested instance as the first argument of object.Equals call, and the constant value as the second argument. This can have issues. In this way, the generated static object.Equals calls the tested instance’s Equals instance method. Since the tested instance can be any custom type, and its Equals instance method can be overridden with arbitrary custom implementation. In C# 7.0 GA release, this was [fixed](https://github.com/dotnet/roslyn/issues/16710) by having the constant value becomes the first argument of object.Equals, so that calling the constant value’s Equals instance method, which has more predictable behavior, could be called.

The pattern can also be a type, followed by a pattern variable of that type:
```
internal static void IsReferenceType(object @object)
{
    if (@object is Uri uri)
    {
        uri.AbsoluteUri.WriteLine();
    }
}
```

The type in above pattern is a reference type (class), so the is expression is compiled to as type conversion and null check:
```
internal static void CompiledIsReferenceType(object @object)
{
    Uri uri = @object as Uri;
    if (uri != null)
    {
        uri.AbsoluteUri.WriteLine();
    }
}
```

This syntactic sugar also works for value type:
```
internal static void IsValueType(object @object)
{
    if (@object is DateTime dateTime)
    {
        dateTime.ToString("o").WriteLine();
    }
}
```

The as operator cannot be used for value type. Type cast (ValueType)instance can work, but when the cast fails it throws exception. So pattern matching for value type is compiled to nullable value type conversion with as operator, and HasValue check:
```
internal static void CompiledIsValueType(object @object)
{
    DateTime? nullableDateTime = @object as DateTime?;
    DateTime dateTime = nullableDateTime.GetValueOrDefault();
    if (nullableDateTime.HasValue)
    {
        dateTime.ToString("o").WriteLine();
    }
}
```

It is also common to use pattern matching with additional conditions:
```
internal static void IsWithCondition(object @object)
{
    if (@object is string @string && TimeSpan.TryParse(@string, out TimeSpan timeSpan))
    {
        timeSpan.TotalMilliseconds.WriteLine();
    }
}
```

After compilation, the condition is additional to the null check:
```
internal static void CompiledIsWithCondition(object @object)
{
    string @string = @object as string;
    if (@string != null && TimeSpan.TryParse(@string, out TimeSpan timeSpan))
    {
        timeSpan.TotalMilliseconds.WriteLine();
    }
}
```

The previously discussed Data type override the Equals method of object:
```
internal partial class Data : IEquatable<Data>
{
    public override bool Equals(object obj)
    {
        return obj is Data && this.Equals((Data)obj);
    }

    public bool Equals(Data other) // Member of IEquatable<T>.
    {
        return this.value == other.value;
    }
}
```

With the traditional syntax, the object parameter’s type was detected twice. In .NET Framework, the Code Analysis tool issues warning CA1800 for this: 'obj', a parameter, is cast to type 'Data' multiple times in method 'Data.Equals(object)'. Cache the result of the 'as' operator or direct cast in order to eliminate the redundant castclass instruction. Now with the new syntax, this can be simplified as following without warning:
```
internal partial class Data : IEquatable<Data>
{
    public override bool Equals(object obj) => 
        obj is Data data && this.Equals(data);
}
```

C# 7.1 supports generics open type in pattern matching:
```
internal static void OpenType<T1, T2>(object @object, T1 open1)
{
    if (@object is T1 open) { }
    if (open1 is Uri uri) { }
    if (open1 is T2 open2) { }
}
```

The var keyword can be the pattern of any type:
```
internal static void IsType(object @object)
{
    if (@object is var match)
    {
        object.ReferenceEquals(@object, match).WriteLine();
    }
}
```

Since the var pattern matching always works, it is compiled to true in debug build:
```
internal static void CompiledIsAnyType(object @object)
{
    object match = @object;
    if (true)
    {
        object.ReferenceEquals(@object, match).WriteLine();
    }
}
```

In release build, the above if (true) test is simply removed.

## Pattern matching with switch statement

Before C# 7.0, the switch statement only supports string, integral types (like bool, byte, char, int, long, etc.), and enumeration; and the case label only supports constant value. Since C# 7.0, switch supports any type and case label supports pattern matching for either constant value or type. The additional condition for the pattern matching can be specified with a when clause. The following example tries to convert object to DateTime:
```
internal static DateTime ToDateTime(object @object)
{
    switch (@object)
    {
        // Match constant @object.
        case null:
            throw new ArgumentNullException(nameof(@object));
        // Match value type.
        case DateTime dateTIme:
            return dateTIme;
        // Match value type with condition.
        case long ticks when ticks >= 0:
            return new DateTime(ticks);
        // Match reference type with condition.
        case string @string when DateTime.TryParse(@string, out DateTime dateTime):
            return dateTime;
        // Match reference type with condition.
        case int[] date when date.Length == 3 && date[0] > 0 && date[1] > 0 && date[2] > 0:
            return new DateTime(year: date[0], month: date[1], day: date[2]);
        // Match reference type.
        case IConvertible convertible:
            return convertible.ToDateTime(provider: null);
        case var _: // default:
            throw new ArgumentOutOfRangeException(nameof(@object));
    }
}
```

The last section with with any type pattern is equivalent to the default section, because it always matches. Each pattern matching is compiled in the similar ways as is expression:
```
internal static DateTime CompiledToDateTime(object @object)
{
    // case null:
    if (@object == null)
    {
        throw new ArgumentNullException("@object");
    }

    // case DateTime dateTIme:
    DateTime? nullableDateTime = @object as DateTime?;
    DateTime dateTime = nullableDateTime.GetValueOrDefault();
    if (nullableDateTime.HasValue)
    {
        return dateTime;
    }

    // case long ticks
    long? nullableInt64 = @object as long?;
    long ticks = nullableInt64.GetValueOrDefault();
    // when ticks >= 0:
    if (nullableInt64.HasValue && ticks >= 0L)
    {
        return new DateTime(ticks);
    }

    // case string text 
    string @string = @object as string;
    // when DateTime.TryParse(text, out DateTime dateTime):
    if (@string != null && DateTime.TryParse(@string, out DateTime parsedDateTime))
    {
        return parsedDateTime;
    }

    // case int[] date
    int[] date = @object as int[];
    // when date.Length == 3 && date[0] >= 0 && date[1] >= 0 && date[2] >= 0:
    if (date != null && date.Length == 3 && date[0] >= 0 && date[1] >= 0 && date[2] >= 0)
    {
        return new DateTime(date[0], date[1], date[2]);
    }

    // case IConvertible convertible:
    IConvertible convertible = @object as IConvertible;
    if (convertible != null)
    {
        return convertible.ToDateTime(null);
    }

    // case var _:
    // or
    // default:
    throw new ArgumentOutOfRangeException("@object");
}
```