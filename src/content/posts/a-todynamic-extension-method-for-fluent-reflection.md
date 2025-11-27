---
title: "A ToDynamic() Extension Method For Fluent Reflection"
published: 2010-06-07
description: "Recently I needed to demonstrate some code with reflection, but I felt it inconvenient and tedious. To simplify the reflection coding, I created a ToDynamic() extension method. The source code can be"
image: ""
tags: [".NET", "C#", "C# 4.0", "Dynamic"]
category: ".NET"
draft: false
lang: ""
---

Recently I needed to demonstrate some code with reflection, but I felt it inconvenient and tedious. To simplify the reflection coding, I created a ToDynamic() extension method. The source code can be downloaded from [here](https://aspblogs.blob.core.windows.net/media/dixin/Media/DynamicWrapper.zip).

- [Problem](#problem)
- [C# 4.0 dynamic](#c-40-dynamic)
- [.NET 4.0 DynamicObject, and DynamicWrapper](#net-40-dynamicobject-and-dynamicwrapper)
- [ToDynamic() and fluent reflection](#todynamic-and-fluent-reflection)
- [Special scenarios](#special-scenarios)
  - [Access static members](#access-static-members)
  - [Change instances of value types](#change-instances-of-value-types)
- [Conclusions](#conclusions)

## Problem

One example for complex reflection is in LINQ to SQL. The DataContext class has a property Privider, and this Provider has an Execute() method, which executes the query expression and returns the result. Assume this Execute() needs to be invoked to query SQL Server database, then the following code will be expected:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    // Constructs the query.
    IQueryable<Product> query = database.Products.Where(product => product.ProductID > 0)
                                                 .OrderBy(product => product.ProductName)
                                                 .Take(2);

    // Executes the query. Here reflection is required,
    // because Provider, Execute(), and ReturnValue are not public members. The following code cannot compile.
    IEnumerable<Product> results = database.Provider.Execute(query.Expression).ReturnValue;

    // Processes the results. 
    foreach (Product product in results)
    {
        Console.WriteLine("{0}, {1}", product.ProductID, product.ProductName);
    }
}
```

Of course, this code cannot compile. And, no one wants to write code like this. Again, this is just an example of complex reflection.

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    // Constructs the query.
    IQueryable<Product> query = database.Products.Where(product => product.ProductID > 0)
                                                 .OrderBy(product => product.ProductName)
                                                 .Take(2);

    // database.Provider
    PropertyInfo providerProperty = database.GetType().GetProperty(
        "Provider", BindingFlags.NonPublic | BindingFlags.GetProperty | BindingFlags.Instance);
    object provider = providerProperty.GetValue(database, null);

    // database.Provider.Execute(query.Expression)
    // Here GetMethod() cannot be directly used,
    // because Execute() is a explicitly implemented interface method.
    Assembly assembly = Assembly.Load("System.Data.Linq");
    Type providerType = assembly.GetTypes().SingleOrDefault(
        type => type.FullName == "System.Data.Linq.Provider.IProvider");
    InterfaceMapping mapping = provider.GetType().GetInterfaceMap(providerType);
    MethodInfo executeMethod = mapping.InterfaceMethods.Single(method => method.Name == "Execute");
    IExecuteResult executeResult = 
        executeMethod.Invoke(provider, new object[] { query.Expression }) as IExecuteResult;

    // database.Provider.Execute(query.Expression).ReturnValue
    IEnumerable<Product> results = executeResult.ReturnValue as IEnumerable<Product>;

    // Processes the results.
    foreach (Product product in results)
    {
        Console.WriteLine("{0}, {1}", product.ProductID, product.ProductName);
    }
}
```

This may be not straight forward enough. So here is a solution implementing fluent reflection with a ToDynamic() extension method:

```csharp
IEnumerable<Product> results = database.ToDynamic() // Starts fluent reflection. 
                                       .Provider.Execute(query.Expression).ReturnValue;
```

## C# 4.0 dynamic

In this kind of scenarios, it is easy to have dynamic in mind, which enables developer to write whatever code after a dot:

```csharp
using (NorthwindDataContext database = new NorthwindDataContext())
{
    // Constructs the query.
    IQueryable<Product> query = database.Products.Where(product => product.ProductID > 0)
                                                 .OrderBy(product => product.ProductName)
                                                 .Take(2);

    // database.Provider
    dynamic dynamicDatabase = database;
    dynamic results = dynamicDatabase.Provider.Execute(query).ReturnValue;
}
```

This throws a RuntimeBinderException at runtime:

> 'System.Data.Linq.DataContext.Provider' is inaccessible due to its protection level.

Here dynamic is able find the specified member. So the next thing is just writing some custom code to access the found member.

## .NET 4.0 DynamicObject, and DynamicWrapper<T>

Where to put the custom code for dynamic? The answer is DynamicObject’s derived class. I first heard of DynamicObject from [Anders Hejlsberg's video in PDC2008](http://channel9.msdn.com/pdc2008/TL16/). It is very powerful, providing useful virtual methods to be overridden, like:

-   TryGetMember()
-   TrySetMember()
-   TryInvokeMember()

etc. (In 2008 they are called GetMember, SetMember, etc., with different signature.)

For example, if dynamicDatabase is a DynamicObject, then the following code:

```csharp
dynamicDatabase.Provider
```

will invoke dynamicDatabase.TryGetMember() to do the actual work, where custom code can be put into.

Now create a type to inherit DynamicObject:

```csharp
public class DynamicWrapper<T> : DynamicObject
{
    private readonly bool _isValueType;

    private readonly Type _type;

    private T _value; // Not readonly, for value type scenarios.

    public DynamicWrapper(ref T value) // Uses ref in case of value type.
    {
        if (value == null)
        {
            throw new ArgumentNullException("value");
        }

        this._value = value;
        this._type = value.GetType();
        this._isValueType = this._type.IsValueType;
    }

    public override bool TryGetMember(GetMemberBinder binder, out object result)
    {
        // Searches in current type's public and non-public properties.
        PropertyInfo property = this._type.GetTypeProperty(binder.Name);
        if (property != null)
        {
            result = property.GetValue(this._value, null).ToDynamic();
            return true;
        }

        // Searches in explicitly implemented properties for interface.
        MethodInfo method = this._type.GetInterfaceMethod(string.Concat("get_", binder.Name), null);
        if (method != null)
        {
            result = method.Invoke(this._value, null).ToDynamic();
            return true;
        }

        // Searches in current type's public and non-public fields.
        FieldInfo field = this._type.GetTypeField(binder.Name);
        if (field != null)
        {
            result = field.GetValue(this._value).ToDynamic();
            return true;
        }

        // Searches in base type's public and non-public properties.
        property = this._type.GetBaseProperty(binder.Name);
        if (property != null)
        {
            result = property.GetValue(this._value, null).ToDynamic();
            return true;
        }

        // Searches in base type's public and non-public fields.
        field = this._type.GetBaseField(binder.Name);
        if (field != null)
        {
            result = field.GetValue(this._value).ToDynamic();
            return true;
        }

        // The specified member is not found.
        result = null;
        return false;
    }

    // Other overridden methods are not listed.
}
```

In the above code, GetTypeProperty(), GetInterfaceMethod(), GetTypeField(), GetBaseProperty(), and GetBaseField() are extension methods for Type class. For example:

```csharp
internal static class TypeExtensions
{
    internal static FieldInfo GetBaseField(this Type type, string name)
    {
        Type @base = type.BaseType;
        if (@base == null)
        {
            return null;
        }

        return @base.GetTypeField(name) ?? @base.GetBaseField(name);
    }

    internal static PropertyInfo GetBaseProperty(this Type type, string name)
    {
        Type @base = type.BaseType;
        if (@base == null)
        {
            return null;
        }

        return @base.GetTypeProperty(name) ?? @base.GetBaseProperty(name);
    }

    internal static MethodInfo GetInterfaceMethod(this Type type, string name, params object[] args)
    {
        return
            type.GetInterfaces().Select(type.GetInterfaceMap).SelectMany(mapping => mapping.TargetMethods)
                .FirstOrDefault(
                    method =>
                    method.Name.Split('.').Last().Equals(name, StringComparison.Ordinal) &&
                    method.GetParameters().Count() == args.Length &&
                    method.GetParameters().Select(
                        (parameter, index) =>
                        parameter.ParameterType.IsAssignableFrom(args[index].GetType())).Aggregate(
                            true, (a, b) => a && b));
    }

    internal static FieldInfo GetTypeField(this Type type, string name)
    {
        return
            type.GetFields(
                BindingFlags.GetField | BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public |
                BindingFlags.NonPublic).FirstOrDefault(
                    field => field.Name.Equals(name, StringComparison.Ordinal));
    }

    internal static PropertyInfo GetTypeProperty(this Type type, string name)
    {
        return
            type.GetProperties(
                BindingFlags.GetProperty | BindingFlags.Instance | BindingFlags.Static |
                BindingFlags.Public | BindingFlags.NonPublic).FirstOrDefault(
                    property => property.Name.Equals(name, StringComparison.Ordinal));
    }

    // Other extension methods are not listed.
}
```

So now, when invoked, TryGetMember() searches the specified member and invoke it. The code can be written like this:

```csharp
dynamic dynamicDatabase = new DynamicWrapper<NorthwindDataContext>(ref database);
dynamic dynamicReturnValue = dynamicDatabase.Provider.Execute(query.Expression).ReturnValue;
```

This greatly simplified reflection.

## ToDynamic() and fluent reflection

To make it even more straight forward, A ToDynamic() method is provided:

```csharp
public static class DynamicWrapperExtensions
{
    public static dynamic ToDynamic<T>(this T value)
    {
        return new DynamicWrapper<T>(ref value);
    }
}
```

and a ToStatic() method is provided to unwrap the value:

```csharp
public class DynamicWrapper<T> : DynamicObject
{
    public T ToStatic()
    {
        return this._value;
    }
}
```

In the above TryGetMember() method, please notice it does not output the member’s value, but output a wrapped member value (that is, memberValue.ToDynamic()). This is very important to make the reflection fluent.

Now the code becomes:

```csharp
IEnumerable<Product> results = database.ToDynamic() // Here starts fluent reflection. 
                                       .Provider.Execute(query.Expression).ReturnValue
                                       .ToStatic(); // Unwraps to get the static value.
```

With the help of TryConvert():

```csharp
public class DynamicWrapper<T> : DynamicObject
{
    public override bool TryConvert(ConvertBinder binder, out object result)
    {
        result = this._value;
        return true;
    }
}
```

ToStatic() can be omitted:

```csharp
IEnumerable<Product> results = database.ToDynamic() 
                                       .Provider.Execute(query.Expression).ReturnValue;
                                       // Automatically converts to expected static value.
```

Take a look at the reflection code at the beginning of this post again. Now it is much much simplified!

## Special scenarios

In 90% of the scenarios ToDynamic() is enough. But there are some special scenarios.

### Access static members

Using extension method ToDynamic() for accessing static members does not make sense. Instead, DynamicWrapper<T> has a parameterless constructor to handle these scenarios:

```csharp
public class DynamicWrapper<T> : DynamicObject
{
    public DynamicWrapper() // For static.
    {
        this._type = typeof(T);
        this._isValueType = this._type.IsValueType;
    }
}
```

The reflection code should be like this:

```csharp
dynamic wrapper = new DynamicWrapper<StaticClass>();
int value = wrapper._value;
int result = wrapper.PrivateMethod();
```

So accessing static member is also simple, and fluent of course.

### Change instances of value types

Value type is much more complex. The main problem is, value type is copied when passing to a method as a parameter.

This is why ref keyword is used for the constructor. That is, if a value type instance is passed to DynamicWrapper<T>, the instance itself will be stored in this.\_value of DynamicWrapper<T>. Without the ref keyword, when this.\_value is changed, the value type instance itself does not change.

Consider FieldInfo.SetValue(). In the value type scenarios, invoking FieldInfo.SetValue(this.\_value, value) does not change this.\_value, because it changes the copy of this.\_value.

I searched the Web and found a solution for setting the value of field:

```csharp
internal static class FieldInfoExtensions
{
    internal static void SetValue<T>(this FieldInfo field, ref T obj, object value)
    {
        if (typeof(T).IsValueType)
        {
            field.SetValueDirect(__makeref(obj), value); // For value type. 
        }
        else
        {
            field.SetValue(obj, value); // For reference type.
        }
    }
}
```

Here \_\_makeref is a undocumented keyword of C#.

But method invocation has problem. This is the source code of TryInvokeMember():

```csharp
public override bool TryInvokeMember(InvokeMemberBinder binder, object[] args, out object result)
{
    if (binder == null)
    {
        throw new ArgumentNullException("binder");
    }

    MethodInfo method = this._type.GetTypeMethod(binder.Name, args) ??
                        this._type.GetInterfaceMethod(binder.Name, args) ??
                        this._type.GetBaseMethod(binder.Name, args);
    if (method != null)
    {
        // Oops!
        // If the returnValue is a struct, it is copied to heap.
        object resultValue = method.Invoke(this._value, args);
        // And result is a wrapper of that copied struct.
        result = new DynamicWrapper<object>(ref resultValue);
        return true;
    }

    result = null;
    return false;
}
```

If the returned value is of value type, it will definitely copied, because MethodInfo.Invoke() does return object. If changing the value of the result, the copied struct is changed instead of the original struct. And so is the property and index accessing. They are both actually method invocation. For less confusion, setting property and index are not allowed on struct.

## Conclusions

The DynamicWrapper<T> provides a simplified solution for reflection programming. It works for normal classes (reference types), accessing both instance and static members.

In most of the scenarios, just remember to invoke ToDynamic() method, and access whatever you want:

```csharp
StaticType result = someValue.ToDynamic()._field.Method().Property[index];
```

In some special scenarios which requires changing the value of a struct (value type), this DynamicWrapper<T> does not work perfectly. Only changing struct’s field value is supported.

The source code can be downloaded from [here](https://aspblogs.blob.core.windows.net/media/dixin/Media/DynamicWrapper.zip), including a few unit test code.