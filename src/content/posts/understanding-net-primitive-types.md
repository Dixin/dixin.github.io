---
title: "Understanding .NET Primitive Types"
published: 2007-12-20
description: "Sometimes symbols like “int” and “Int32” can be confusing for developers beginning to use C# / .NET."
image: ""
tags: [".NET", "C#"]
category: ".NET"
draft: false
lang: ""
---

Sometimes symbols like “int” and “Int32” can be confusing for developers beginning to use C# / .NET.

## int vs. System.Int32

Several years ago, I started to learn C# programming. Like many other people, I read some FCL source code from [Reflector](http://www.red-gate.com/products/reflector/) in C#. The code of System.Int32 looks confusing:
```
public struct Int32
{
    internal int m_value;

    // Other members.
}
```
[](http://11011.net/software/vspaste)

Because [MSDN](http://msdn.microsoft.com/) said that [in C#, int is just an alias of System.Int32](http://msdn.microsoft.com/en-us/library/s1ax56ch\(VS.80\).aspx), the above code should be equal to:
```
public struct Int32
{
    internal Int32 m_value;

    // Other members.
}
```
[](http://11011.net/software/vspaste)

The confusion is, the fore mentioned code cannot be compiled. As we know, when defining an instance field of a class, the type of the field can be the class itself:
```
class Class
{
    Class _instanceField;
}
```
[](http://11011.net/software/vspaste)

However for a struct:
```
struct Struct
{
    Struct _instanceField;
}
```
[](http://11011.net/software/vspaste)

The above code cannot be compiled and causes this error message: “Struct member 'Struct.\_instanceField' of type 'Struct' causes a cycle in the struct layout”. It looks obvious that the above System.Int32 code should not be compiled.

Actually, if switching to IL code insteading of C#, or just checking the code with [IL Disassembler](http://msdn.microsoft.com/en-us/library/f7dy01k1\(VS.80\).aspx), we can see another stuff: int32.
```
.class public sequential ansi serializable sealed beforefieldinit Int32
    extends System.ValueType
    implements System.IComparable, System.IFormattable, System.IConvertible, System.IComparable`1, System.IEquatable`1
{
    .field assembly int32 m_value

    // Other members.
}
```

So what is the relationship among int32 (IL), int (C#) and System.Int32 (C#)?

## How does the integer work

int32 is a CLR primitive. Then in FCL, it is represented by System.Int32 struct. The integer value of System.Int32 is persisted on its m\_value filed, and a lot of integer-related methods are defined on System.Int32.

In C#, int is just an alias for System.Int32, supported by the C# compiler. So there is no dependency between int and System.Int32, they are not like [chicken and egg](http://www.cnblogs.com/happyhippy/archive/2007/04/12/710928.aspx). These following code are exactly the same:
```
int integer = new int();
System.Int32 integer = new System.Int32();
```
[](http://11011.net/software/vspaste)

So in the first and second code snippet of this post, the actual type of m\_value field is not System.Int32 or int, but the int32 CLR primitive type. “int” appears there because [Reflector](http://www.red-gate.com/products/reflector/) tries to use a C# symbol to represent the CLR symbol**.** So only the third code snippet of System.Int32 is telling the truth.

In C#, there are two kinds of scenarios to use integer:

-   When it is presenting a value, like a local variable, it is compiled into CLR int32 primitive;
-   When invoking integer-related method (like int.Parse(), int.ToString(), etc.) on it, it is compiled into the FCL System.Int32 struct (Int32.Parse(), Int32.ToString() are invoked).

## Primitive type

Now the concept of primitive type should be clearer. In C#, there are byte (alias of System.Byte, its value is represented by uint8 in CLR), short (System.Int16), int (System.Int32), long (System.Int64), char, float, double, bool, decimal, object, string…. they are specially treated and because they are so frequently used.

For example, one special scenario is, in C#, [when defining an enum, only primitive is allowed](http://www.cnblogs.com/AndersLiu/archive/2007/12/20/1007668.html):
```
public enum Status : int
{
}
```
[](http://11011.net/software/vspaste)

The corresponding FCL type cannot be used:
```
public enum Status : Int32
{
}
```
[](http://11011.net/software/vspaste)

## More confusions from primitive type and FCL type

Actually, all we need to know is that the primitive keyword and FCL type name are representing the same thing.

Sometimes, I ask questions about primitive types during the [interview](http://www.cnblogs.com/TeamOne/archive/2009/06/14/csharp_int32.html). One typical question is, in C# what is the difference between int and System.Int32? The expected answer is just “The same”. But a lot of people, including some senior guys, told me that:

-   System.Int32 is 32 bit, while int is 64 bit;
-   int is 32 bit integer on 32 bit platform, while it is 64 bit on 64 bit platform;
-   int is value type, while System.Int32 is reference type;
-   int is allocated in the stack, while System.Int32 is allocated in the heap;

etc.

Another similar question is, what is the difference between string and String in C#? There are answers like:

-   string is value type, while String is reference type;
-   string is immutable, while String is mutable;

etc.

Maybe some people think these knowledge are not important, I insist understanding basic concepts of programming language should be the first step of professional coding.

## Related resources

-   [Boolean和bool VS 鸡蛋和鸡](http://www.cnblogs.com/happyhippy/archive/2007/04/12/710928.aspx)
-   [为《理解C#中的System.In32和int：并非鸡和鸡蛋 》做个续](http://www.cnblogs.com/szw/archive/2007/12/20/1007493.html)
-   [也说System.Int32和int](http://www.cnblogs.com/AndersLiu/archive/2007/12/20/1007668.html)
-   [int与System.Int32有什么区别](http://www.cnblogs.com/TeamOne/archive/2009/06/14/csharp_int32.html)