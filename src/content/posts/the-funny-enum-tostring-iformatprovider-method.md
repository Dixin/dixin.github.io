---
title: "The Funny Enum.ToString(IFormatProvider) Method"
published: 2009-10-17
description: "Here is a ToString(IFormatProvider) method on the System.Enum type. It looks a IformatProvider (like CultureInfo) can be passed to this method:"
image: ""
tags: [".NET", "C#"]
category: ".NET"
draft: false
lang: ""
---

Here is a ToString(IFormatProvider) method on the System.Enum type. It looks a IformatProvider (like CultureInfo) can be passed to this method:

```csharp
someEnum.ToString(cultureInfo);
```

But this is the source code from .NET 1.1:

```csharp
/// <summary>
/// <para> Converts the value of this instance to 
/// its equivalent string representation using the specified
/// format information. </para>
/// </summary>
/// <param name=" provider">(Reserved) An <see cref="T:System.IFormatProvider" /> that supplies format information about this instance.</param>
/// <returns>
/// <para>The string 
/// representation of the name of the value of this instance as
/// specified by <paramref name="provider" />.</para>
/// </returns>
public string ToString(IFormatProvider provider)
{
    return this.ToString();
}
```

Inside this method, it does nothing with the IFormatProvider parameter. Actually it does not make any sense to specify such a parameter for a enum. Enum should be used for programming.

So since .NET 2.0, this method is marked as obsolete:

```csharp
[Obsolete("The provider argument is not used. Please use ToString().")]
public string ToString(IFormatProvider provider)
{
    return this.ToString();
}
```
