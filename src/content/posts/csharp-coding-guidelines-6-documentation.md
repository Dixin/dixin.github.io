---
title: "C# Coding Guidelines (6) Documentation"
published: 2009-10-13
description: "C# Coding Guidelines:"
image: ""
tags: [".NET", "C#", "Coding Guidelines"]
category: ".NET"
draft: false
lang: ""
---

C# Coding Guidelines:

-   [C# Coding Guidelines (1) Fundamentals](/posts/csharp-coding-guidelines-1-fundamentals)
-   [C# Coding Guidelines (2) Naming](/posts/csharp-coding-guidelines-2-naming)
-   [C# Coding Guidelines (3) Members](/posts/csharp-coding-guidelines-3-members)
-   [C# Coding Guidelines (4) Types](/posts/csharp-coding-guidelines-4-types)
-   [C# Coding Guidelines (5) Exceptions](/posts/csharp-coding-guidelines-5-exceptions)
-   C# Coding Guidelines (6) Documentation
-   [C# Coding Guidelines (7) Tools](/posts/csharp-coding-guidelines-7-tools)

In this post topics like “whether we should use Chinese in the C# comment documentation or not” will not be discussed.

It is difficult to find detailed articles on how to write comments for C# code in a professional way. If you find anything incorrect, or if you have any better ideas, please do reply me.

## Fundamentals

This sample code is from my [so called WebOS](http://www.cnblogs.com/dixin/archive/2009/09/20/introducing-coolwebos-com.html) ([http://www.CoolWebOS.com/](http://www.coolwebos.com/)):

```csharp
namespace WebOS.Common
{
    using System;
    using System.Linq;

    using Properties;

    /// <summary>
    /// Provides extension methods for the <see cref="T:System.Linq.IQueryable`1"/> interface.
    /// </summary>
    public static class QueryableExtensions
    {
        #region Public Methods

        /// <summary>
        /// Gets a collection of elemets in the data source in pages of a sequence.
        /// </summary>
        /// <typeparam name="TSource">
        /// The type of the source.
        /// </typeparam>
        /// <param name="source">
        /// The <see cref="T:System.Linq.IQueryable`1"/> for pagination.
        /// </param>
        /// <param name="pageIndex">
        /// The index of the page of results to return. <paramref name="pageIndex"/> is zero-based.
        /// </param>
        /// <param name="pageSize">
        /// The size of the page of results to return.
        /// </param>
        /// <returns>
        /// An <see cref="T:System.Linq.IQueryable`1"/> that contains elements in the specified page of the input sequence.
        /// </returns>
        /// <exception cref="T:System.ArgumentNullException">
        /// <paramref name="source"/> is null.
        /// </exception>
        /// <exception cref="T:System.ArgumentOutOfRangeException">
        /// <paramref name="pageIndex"/> is less than zero or <paramref name="pageSize"/> is less than zero.
        /// </exception>
        public static IQueryable<TSource> Page<TSource>(this IQueryable<TSource> source, int pageIndex, int pageSize)
        {
            if (source == null)
            {
                throw new ArgumentNullException("source");
            }

            if (pageIndex < 0)
            {
                throw new ArgumentOutOfRangeException("pageIndex", Resource.PageIndexShouldNotBeNegative);
            }

            if (pageSize < 0)
            {
                throw new ArgumentOutOfRangeException("pageSize", Resource.PageSizeShouldNotBeNegative);
            }

            // Deferred execution works here.
            return source.Skip(pageIndex * pageSize).Take(pageSize);
        }

        #endregion
    }
}
```
[](http://11011.net/software/vspaste)[](http://11011.net/software/vspaste)[](http://11011.net/software/vspaste)

**✔** Use Microsoft XML documentation tags to write the comments.

You can see the list of [recommended xml tags for documentation comments](http://msdn.microsoft.com/en-us/library/5ast78ax.aspx) from MSDN, as well as the [basic usage](http://msdn.microsoft.com/en-us/magazine/cc302121.aspx).

**✔** Use <see> when referring to a type / member in the comments.

This rule is specially mentioned because I saw a lot people incorrectly using <c>.

Here is a sample of referring to property:

```csharp
/// <exception cref="T:System.Runtime.Serialization.SerializationException">
/// The class name is null or <see cref="P:System.Exception.HResult"/> is zero (0).
/// </exception>
```
[](http://11011.net/software/vspaste)

and a sample of referring to a generic interface:

```csharp
/// <returns>
/// An <see cref="T:System.Linq.IQueryable`1"/> that contains elements in the specified page of the input sequence.
/// </returns>
```
[](http://11011.net/software/vspaste)

**✔** Use one space between “///” or “//” and your comments.

This is easy but a lot of developers writing comment immediately after the slash.

**✔** Use a capitalized letter to start the comment, unless it is a specified identifier.

**✔** Use a punctuation to end the comment.

The above two rules are too easy to forgot.

**✔** Use a blank line before a single line comment, unless this single line comment is after another single line comment, or it is the fist line of the scope.

**✘** Do not use a blank line after a single line comment.

**✔** Consider writing comment document for all non-private members and types.

The word “consider” is used because this is too hard or unnecessary for most projects.

## Members

**✔** Consider using third person singular verb to start the summary of members.

Here are some samples:

-   For methods:
    -   Gets xxx with the specified xxx.
    -   Applies xxx over xxx.
    -   Converts xxx to xxx.
    -   Computes xxx of xxx.
    -   Returns xxx of xxx.
    -   Invokes xxx on xxx.
    -   Sorts the elements of xxx in ascending order according to xxx.
    -   Create xxx.
-   For properties:
    -   Gets xxx.
    -   Gets or sets xxx.
-   For events:
    -   Occurs when xxx.
    -   Occurs before xxx.
    -   Occurs after xxx.
    -   Occurs at the beginning of xxx.
    -   Occurs at the end of xxx.
-   etc.

**✔** Use “Initializes a new instance of the xxx class.” for the summary of constructors.

**✔** Use “Gets” to start the summary on read only property, and use “Gets or sets” to start the summary of read write property.

Write only property is not preferred just as [part 3](/posts/csharp-coding-guidelines-3-members) said.

**✔** Use “Gets a value indicating whether xxx” or “Gets or sets a value indicating whether xxx” to start the summary of methods / properties returning a bool value.

**✔** Use “<c>true</c> if xxx; otherwise, <c>false</c>.” for the comment on bool return value.

Here is a sample:

```csharp
/// <summary>
/// Gets a value indicating whether the user can be authenticated.
/// </summary>
/// <returns>
/// <c>true</c> if the user can be authenticated; otherwise, <c>false</c>.
/// </returns>
public bool IsApproved
{
    get;
    private set;
}
```

**✔** Use “Finalizes an instance of the xxx class.” for the summary of finalizers.

## Types

**✔** Consider using third person singular verb to start the summary of types, except it is an exception.

Here are some samples:

-   For normal classes / structs:
    -   Represents xxx as xxx.
    -   Provides xxx for xxx.
    -   Provides the base class from which the classes that represent xxx are derived.
-   For attributes:
    -   Instructs xxx.
    -   Specifies xxx.
    -   Defines xxx.
    -   Indicates xxx.
-   For delegates:
    -   Represents the method that xxx.
    -   Encapsulates a method that xxx.
-   For interfaces:
    -   Defines methods to xxx.
    -   Provides a mechanism for xxx / functionality to xxx.
    -   Represents xxx.
-   For enums:
    -   Describes xxx.
    -   Defines xxx.
    -   Identifies xxx.
    -   Specifies flags for xxx.
-   etc.

**✔** Use “The exception that is thrown when xxx.” for the summary of exceptions.

## Generate documents

If you use those Microsoft xml documentation correctly, your code document could be generated correctly.

This is the intellisense when writing code with the API at the beginning of this article:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_thumb_3.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_8.png)

and this is the hint parameter:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_thumb_1.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_4.png)

You can also use [Sandcastle](http://sandcastle.codeplex.com/) to generate MSDN-like documentation:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_thumb_5.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_12.png)

This is the document for the code at the beginning of this article:

[![image](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_thumb_6.png "image")](http://images.cnblogs.com/cnblogs_com/dixin/WindowsLiveWriter/CCodingGuidelines6Documentation_C8DF/image_14.png)

Sandcastle will be introduced in [part 7](/posts/csharp-coding-guidelines-7-tools).