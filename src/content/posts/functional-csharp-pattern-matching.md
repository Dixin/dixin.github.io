---
title: "C# Functional Programming In-Depth (15) Pattern matching"
published: 2019-06-17
description: "Pattern matching is a common feature in functional languages. C# 7.0 introduces basic pattern matching in is expression and switch statement, including constant value as pattern and type as pattern, a"
image: ""
tags: [".NET", "C#", "C# 7.0", "LINQ", "LINQ via C#", "C# Features", "Functional Programming", "Functional C#"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[C# functional programming in-depth series](/archive/?tag=Functional%20C%23)\]

Pattern matching is a common feature in functional languages. C# 7.0 introduces basic pattern matching in is expression and switch statement, including constant value as pattern and type as pattern, and C# 7.1 supports generics in pattern matching.

## Pattern matching with is expression

Since C# 1.0, is expression (instance is Type) can be used to test whether the instance is compatible with the specified type. Since C# 7.0. the type can be followed by an optional pattern variable:

internal static void IsTypePattern(object @object)
```
{
```
```
if (@object is Uri reference)
```
```
{
```
```
reference.AbsolutePath.WriteLine();
```
```
}
```
```
if (@object is DateTime value)
```
```
{
```
```
value.ToString("o").WriteLine();
```
```
}
```

}

For reference type pattern, is expression is compiled to type conversion with as operation, and null check for the converted reference. The as operator only works for reference type and nullable value type. So, value type pattern matching is compiled to nullable value type conversion with as operator, and HasValue check for the converted nullable value:

internal static void CompiledIsTypePattern(object @object)
```
{
```
```
Uri reference = @object as Uri;
```
```
if (reference != null)
```
```
{
```
```
reference.AbsolutePath.WriteLine();
```
```
}
```
```
DateTime? nullableValue = @object as DateTime?;
```
```
DateTime value = nullableValue.GetValueOrDefault();
```
```
if (nullableValue.HasValue)
```
```
{
```
```
value.ToString("o").WriteLine();
```
```
}
```

}

It is also common to use pattern matching with additional test. The following example first uses pattern match to get string from input, then uses out variable to get TimeSpan value:

internal static void IsWithTest(object @object)
```
{
```
```
if (@object is string @string&& TimeSpan.TryParse(@string, out TimeSpan timeSpan))
```
```
{
```
```
timeSpan.TotalMilliseconds.WriteLine();
```
```
}
```

}

After compilation, the additional test goes after the null check:

internal static void CompiledIsWithTest(object @object)
```
{
```
```
string @string = @object as string;
```
```
if (@string != null &&TimeSpan.TryParse(@string, out TimeSpan timeSpan))
```
```
{
```
```
timeSpan.TotalMilliseconds.WriteLine();
```
```
}
```

}

Before pattern matching is introduced to is expression, the following test-type-then-convert-type syntax is commonly used:

namespace System
```
{
```
```
public readonly partial struct DateTime
```
```
{
```
```
public override bool Equals(object value)
```
```
{
```
```
if (value is DateTime)
```
```
{
```
```
return this.InternalTicks == ((DateTime)value).InternalTicks;
```
```
}
```
```
return false;
```
```
}
```
```
}
```
```
public struct TimeSpan
```
```
{
```
```
public override bool Equals(object value)
```
```
{
```
```
if (value is TimeSpan)
```
```
{
```
```
return this._ticks == ((TimeSpan)value)._ticks;
```
```
}
```
```
return false;
```
```
}
```
```
}
```

}

Here the input object’s type was detected twice. Now with the new syntax, the test and conversion can be merged:

namespace System
```
{
```
```
public readonly partial struct DateTime
```
```
{
```
```
public override bool Equals(object value) =>
```
```
value is DateTime dateTime && this.InternalTicks == dateTime.InternalTicks;
```
```
}
```
```
public struct TimeSpan
```
```
{
```
```
public override bool Equals(object value) =>
```
```
value is TimeSpan timeSpan && this._ticks == timeSpan._ticks;
```
```
}
```

}

C# 7.1 supports generics open type in pattern matching:

internal static void IsWithOpenType<TOpen1, TOpen2, TOpen3, TOpen4>(
```
IDisposable disposable, TOpen2 open2, TOpen3 open3)
```
```
{
```
```
if (disposable is TOpen1 open1)
```
```
{
```
```
open1.WriteLine();
```
```
}
```
```
if (open2 is FileInfo file)
```
```
{
```
```
file.WriteLine();
```
```
}
```
```
if (open3 is TOpen4 open4)
```
```
{
```
```
open4.WriteLine();
```
```
}
```

}

When open type is involved, the tested instance is boxed as object. When open type is the type pattern, it is unknow whether the open type is reference type or value type. Regarding as operator can only be used for reference type and nullable value type, so as operator cannot be used for the open type here. So, the pattern matching with open type is compiled to the basic is expression of type test.

internal static void CompiledIsWithOpenType<TOpen1, TOpen2, TOpen3, TOpen4>(
```
IDisposable disposable, TOpen2 open2, TOpen3 open3)
```
```
{
```
```
object disposableObject = (object)disposable;
```
```
if (disposableObject is TOpen1)
```
```
{
```
```
TOpen1 open1 = (TOpen1)disposableObject;
```
```
open1.WriteLine();
```
```
}
```
```
object open2Object = (object)open2;
```
```
FileInfo file = open2Object as FileInfo;
```
```
if (file != null)
```
```
{
```
```
file.WriteLine();
```
```
}
```
```
object open3Object = (object)open3;
```
```
if (open3Object is TOpen4)
```
```
{
```
```
TOpen4 open4 = (TOpen4)open3Object;
```
```
open4.WriteLine();
```
```
}
```

}

The var keyword can be used to represent the pattern of any type:

internal static void IsType(object @object)
```
{
```
```
if (@object is var match)
```
```
{
```
```
object.ReferenceEquals(@object, match).WriteLine();
```
```
}
```

}

Since the var pattern matching always works, it is compiled to constant value true in debug build:

internal static void CompiledIsAnyType(object @object)
```
{
```
```
object match = @object;
```
```
if (true)
```
```
{
```
```
object.ReferenceEquals(@object, match).WriteLine();
```
```
}
```

}

In release build, the above if (true) test is removed.

Since C# 7.0, is expression can also test constant pattern (instance is constant), where constant value and constant expression are supported, including primitive type, enumerations, decimal, string, and null for reference type:

internal static void IsConstantPattern(object @object)
```
{
```
```
bool test1 = @object is null;
```
```
bool test2 = @object is default(int);
```
```
bool test3 = @object is DayOfWeek.Saturday - DayOfWeek.Monday;
```
```
bool test4 = @object is "https://" + "flickr.com/dixin";
```
```
bool test5 = @object is nameof(test5);
```

}

The is expressions for null test is simply compiled to null check. the other cases are compiled to object.Equals static method calls, where the constant value is the first argument, and the tested instance is the second argument.

internal static void CompiledIsConstantPattern(object @object)
```
{
```
```
bool test1 = @object == null;
```
```
bool test2 = object.Equals(0, @object);
```
```
bool test3 = object.Equals(5, @object);
```
```
bool test4 = object.Equals("https://flickr.com/dixin", @object);
```
```
bool test5 = object.Equals("test5", @object);
```

}

Internally, object.Equals first does a few checks, then it calls Equals instance method of first argument, which is the constant value. Its implementation can be viewed as:

namespace System
```
{
```
```
[Serializable]
```
```csharp
public class Object
```
```
{
```
```
public static bool Equals(object objA, object objB) =>
```
```
objA == objB || (objA != null && objB != null && objA.Equals(objB));
```
```
// Other members.
```
```
}
```

}

The early version of C# 7.0 compiles the object.Equals static method call in different way. The tested instance is the first argument, and the constant value is the second argument. As a result, object.Equals then calls the tested instance’s Equals instance method. This is problematic, because the tested instance can be of any type, and it can override Equals instance with arbitrary implementation. In C# 7.0 GA release, this was fixed by having the constant value be the first argument of object.Equals static method call. The non-null constant value must be of primitive type, enumeration, decimal, or string, so a constant’s Equals instance method always has reliable built-in implementation. There is no arbitrary custom equality implementation involved in constant pattern matching.

C# uses default(Type) expression to represent the default value of the specified type since 1.0. Then C# 7.1 introduces default literal expression, which just uses the default keyword to represent a default value, with the type omitted and inferred from context. Since then, the default literal expression is also enabled for constant pattern matching:

internal static void IsConstantPatternWithDefault(object @object)
```
{
```
```
bool test6 = @object is default; // Cannot be compiled. use default(Type).
```

}

Shortly, this syntax is disabled after C# 7.2 is released, because it causes confusion with the default case in switch statement, which is discussed later in this chapter. For default value pattern matching, use the traditional default(Type) syntax as demonstrated in the first example.

## Pattern matching with switch statement and expression

Before C# 7.0, the switch statement only supports string, integral types (like bool, byte, char, int, long, etc.), and enumeration; and the case label only supports constant value. Since C# 7.0, switch supports any type and case label supports pattern matching for either constant value or type. The additional condition for the pattern matching can be specified with a when clause. The following example tries to convert object to DateTime:

internal static DateTime ToDateTime<TConvertible>(object @object)
```
where TConvertible : IConvertible
```
```
{
```
```
switch (@object)
```
```
{
```
```
// Match null reference.
```
```
case null:
```
```
throw new ArgumentNullException(nameof(@object));
```
```
// Match value type.
```
```
case DateTime dateTIme:
```
```
return dateTIme;
```
```
// Match value type with condition.
```
```
case long ticks when ticks >= 0:
```
```
return new DateTime(ticks);
```
```
// Match reference type with condition.
```
```
case string @string when DateTime.TryParse(@string, out DateTime dateTime):
```
```
return dateTime;
```
```
// Match reference type with condition.
```
```
case int[] date when date.Length == 3 && date[0] > 0 && date[1]> 0 && date[2] > 0:
```
```
return new DateTime(year: date[0], month: date[1], day: date[2]);
```
```
// Match generics open type.
```
```
case TConvertible convertible:
```
```
return convertible.ToDateTime(provider: null);
```
```
// Match anything else. Equivalent to default case.
```
```
case var _:
```
```
throw new ArgumentOutOfRangeException(nameof(@object));
```
```
}
```

}

The last pattern matches any type pattern, so it works equivalently to the default case of switch statement. The special \_ identifier is used to discard the pattern variable. In switch statement, each pattern matching is compiled similarly to is expression:

internal static DateTime CompiledToDateTime<TConvertible>(object @object)
```
where TConvertible : IConvertible
```
```
{
```
```
// case null:
```
```
if (@object == null)
```
```
{
```
```
throw new ArgumentNullException("object");
```
```
}
```
```
// case DateTime dateTIme:
```
```
DateTime? nullableDateTime = @object as DateTime?;
```
```
DateTime dateTime = nullableDateTime.GetValueOrDefault();
```
```
if (nullableDateTime.HasValue)
```
```
{
```
```
return dateTime;
```
```
}
```
```
// case long ticks:
```
```
long? nullableInt64 = @object as long?;
```
```
long ticks = nullableInt64.GetValueOrDefault();
```
```
if (nullableInt64.HasValue && ticks >= 0L) // when clause.
```
```
{
```
```
return new DateTime(ticks);
```
```
}
```
```
// case string text:
```
```
string @string = @object as string;
```
```
if (@string != null && DateTime.TryParse(@string, out DateTime parsedDateTime)) // when clause.
```
```
{
```
```
return parsedDateTime;
```
```
}
```
```
// case int[] date:
```
```
int[] date = @object as int[];
```
```
if (date != null && date.Length == 3 && date[0] >= 0 && date[1]> = 0 && date[2] >= 0) // when clause.
```
```
{
```
```
return new DateTime(date[0], date[1], date[2]);
```
```
}
```
```
// case TConvertible convertible:
```
```
object convertibleObject = (object)@object;
```
```
if (convertibleObject is TConvertible)
```
```
{
```
```
TConvertible convertible = (TConvertible)convertibleObject;
```
```
return convertible.ToDateTime(null);
```
```
}
```
```
// case var _:
```
```
throw new ArgumentOutOfRangeException("object");
```

}

C# 8.0 introduces switch expression syntacticsal sugar to simplify the switch statement:

internal static DateTime ToDateTime2(object @object) =>
```
@object switch
```
```
{
```
```
null => throw new ArgumentNullException(nameof(@object)),
```
```
DateTime dateTIme => dateTIme,
```
```
long ticks when ticks >= 0 => new DateTime(ticks),
```
```
string @string when DateTime.TryParse(@string, out DateTime dateTime) => dateTime,
```
```
int[] date when date.Length == 3 && date[0]> 0 && date[1] > 0 && date[2] > 0 => new DateTime(
```
```
year: date[0], month: date[1], day: date[2]),
```
```
IConvertible convertible => convertible.ToDateTime(provider: null),
```
```
_ => throw new ArgumentOutOfRangeException(nameof(@object))
```

};

## Summary

C# has basic pattern matching features. Type pattern (including generics open type) with pattern variable and constant pattern are supported in is expression and switch statement. The var keyword can be used as the pattern of any type, and \_ can be used to discard pattern variable. switch statement also supports when clause for each pattern matching for additional condition.