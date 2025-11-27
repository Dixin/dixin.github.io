---
title: "C# Coding Guidelines (2) Naming"
published: 2009-10-06
description: "C# Coding Guidelines:"
image: ""
tags: [".NET", "C#", "Coding Guidelines"]
category: "C#"
draft: false
lang: ""
---

C# Coding Guidelines:

-   [C# Coding Guidelines (1) Fundamentals](/posts/csharp-coding-guidelines-1-fundamentals)
-   C# Coding Guidelines (2) Naming
-   [C# Coding Guidelines (3) Members](/posts/csharp-coding-guidelines-3-members)
-   [C# Coding Guidelines (4) Types](/posts/csharp-coding-guidelines-4-types)
-   [C# Coding Guidelines (5) Exceptions](/posts/csharp-coding-guidelines-5-exceptions)
-   [C# Coding Guidelines (6) Documentation](/posts/csharp-coding-guidelines-6-documentation)
-   [C# Coding Guidelines (7) Tools](/posts/csharp-coding-guidelines-7-tools)

In this post topics like “whether we should use Chinese in the identifiers or not” will not discussed.

## Casing Conventions

**✔** Use PascalCasing for namespace, type, and member names, except fields.

-   Id
-   Ok
-   UIOption
-   XmlHelper

For acronyms with 2 letters, these 2 letters should be upper case; for acronyms with more than 2 letters, the first letter should be upper case.

Please notice Id is remembered rather than ID, Ok is remembered rather than OK. They are treated as words, not acronyms.

**✔** Use camelCasing for field, local variable and parameter names.

-   id
-   ok
-   uiOption
-   xmlHelper

One common discussion is the prefix of the names.

The Framework Design Guidelines said:

Names cannot defer by case only.

Sometimes we write code like this:

```csharp
internal class Person
{
    private string name;

    internal Person(string name)
    {
        this.name = name;
    }

    internal string Name
    {
        get
        {
            return name;
        }
    }
}
```

Actually this code is Ok even the name field and Name property defer by case only. Because Framework Design Guidelines is talking about exposed members. The name field is not exposed.

Personally I like to add an underscore before the fields, and always add “this.” before instance members:

```csharp
internal class Person
{
    private string _name;

    internal Person(string name)
    {
        this._name = name;
    }

    internal string Name
    {
        get
        {
            return this._name;
        }
    }
}
```

So it become very easy to distinguish:

-   static field: \_staticField
-   instance field: this.\_instanceField
-   static property: StaticProperty
-   instance property: this.InstanceProperty

Of course a lot of developers do not like the prefix. Whatever, the most important is to keep code consistent.

## Hungary Notation

**✘** Do not use [Hungarian notations](http://en.wikipedia.org/wiki/Hungarian_notation).

-   intCount
-   strName
-   btnOk
-   lblMessage

**✔** Use postfix when to identify the type / base type.

-   okButton
-   messageLabel
-   System.Exception and System.ArgumentException
-   System.IO.Stream and System.IO.FileStream

## Abbreviations And Acronyms

**✘** Do not use abbreviations and contractions as part of identifiers

-   sr (streamReader)
-   GetWnd (GetWindow)

**✔** Use acronym if it is widely accepted, and has only one single meaning.

-   System.Web.Mvc.HtmlHelper
-   Microsoft.VisualBasic.FileIO.UIOption

A obvious example is HTML: Almost everyone knows HTML, and HTML does not have multiple meanings. And also “HyperTextMarkupLanguageHelper” looks prolix. “HtmlHelper” is choice.

**✘** Do not use acronyms that are not widely accepted.

-   System.Drawing.Color.FromArgb()

This sample is from the book. Sometimes FromArgb is confusing because Argb looks like argument b. FromAlphaRgb could be better.

Another sample is “e”. Too many “e”s have been seen. Usually e should be only used for the EventArgs instance name:

```csharp
protected void Page_Load(object sender, EventArgs e)
{

}

protected override void OnLoad(EventArgs e)
{
    base.OnLoad(e);
}
```

For the other scenarios, like exception, error, element, event, … e should not be used:

```csharp
try
{ 
}
catch (InvalidOperationException exception)
{
}
```

## Special Names

**✘** Do not use language-specific names

-   System.NullReferenceException

This sample is also from the book. NullReferenceException is not perfect because VB uses Nothing.

Another sort of language-specific name is the primitive type name.

**✔** Use FCL type name instead of language-specific primitive type name.

-   System.Convert.ToInt32(), not ToInt()
-   System.Convert.ToInt64(), not ToLong()

A developer asked where to find a “ToFloat()” method. Actually it is “ToSingle()”.

**✘** Do not abuse .NET-specific names.

-   XxxHandler

“Handler” has specified meaning in .NET programming. When I was in [Microsoft Redmond](/posts/the-memory-of-programming-in-seattle-2-working), I was invited to review some code for a friend, which contained tons of “XxxHandler”s. Once something is related to Xxx, it is named “XxxHandler”. This cannot make sense.

**✔** Prefer .NET-recommended words.

For example:

-   Id (not ID)
-   Ok (not OK)
-   Canceled (not Cancelled)
-   Indexes (not Indices)
-   UserName (not Username)

But FCL itself is not 100% complying this rule, like:

```csharp
namespace System.Web.Security
{
    public abstract class MembershipProvider : ProviderBase
    {
        public abstract bool DeleteUser(string username, bool deleteAllRelatedData);

        public abstract MembershipUser GetUser(string username, bool userIsOnline);

        public abstract string ResetPassword(string username, string answer);

        public abstract bool UnlockUser(string userName);
    }
}
```

“userName” should be used for the parameter name.

## Symmetry

**✔** Use symmetric words in symmetric identifiers.

-   Add / Remove
-   Insert / Delete
-   Create / Destroy
-   Initialize / Finalize
-   Get / Set
-   LogOn / LogOff
-   Begin / End

## Consistency

Once I saw the source code of a website, where the verb Insert is used in the data access layer, while Add is used in the data models, while Create is used in the controllers.

In another website, many verbs for the membership: LogOn, LogOff, LogIn, LogOut, SignIn, SignOff, SignOut … This is unnecessary.

In a fantastic project, to identify one thing, 5 different names are used in

-   documents,
-   database table,
-   SQL stored procedure code,
-   C# code,
-   and UI message.

**✔** Again, Consistency of the naming should always be kept in mind.