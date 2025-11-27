---
title: "C# 6.0 String Interpolation, FormattableString, and Code Analysis CA1305: Specify IFormatProvider"
published: 2016-01-26
description: "C# 6.0 introduces a syntactic sugar , it is safer and more readable than [composite formatting](https://msdn.microsof"
image: ""
tags: ["C#", "C# 6.0", "Code Analysis", "Coding Guidelines", "FxCop", "String Interpolation"]
category: "C#"
draft: false
lang: ""
---

C# 6.0 introduces a syntactic sugar [string interpolation](https://en.wikipedia.org/wiki/String_interpolation#C.23.NET), it is safer and more readable than [composite formatting](https://msdn.microsoft.com/en-us/library/txafckwd.aspx). Here is a small example:

```csharp
using System;
using System.Diagnostics;

internal static class Program
{
    private static void Main() => Trace.WriteLine($"Machine name: {Environment.MachineName}.");
}
```

However, string interpolation does not get along with code analysis. By default, the $ syntax will be compiled to composite formatting, by calling the string.Format overload without IFormatProvider parameter:

```csharp
using System;
using System.Diagnostics;

internal static class Program
{
    private static void Main() => Trace.WriteLine(string.Format("Machine name: {0}.", Environment.MachineName));
}
```

As a result, Code Analysis/FxCop issues a CA1305 warning for every interpolated string: Specify IFormatProvider. This is very annoying.

Interpolated string has a infamous feature, it can be also compiled to System.FormattableString:

```csharp
namespace System
{
    using System.Globalization;

    public abstract class FormattableString : IFormattable
    {
        protected FormattableString() { }

        public abstract string Format { get; }

        public abstract int ArgumentCount { get; }

        public abstract object[] GetArguments();

        public abstract object GetArgument(int index);

        public abstract string ToString(IFormatProvider formatProvider);

        string IFormattable.ToString(string ignored, IFormatProvider formatProvider) => this.ToString(formatProvider);

        public static string Invariant(FormattableString formattable)
        {
            if (formattable == null)
            {
                throw new ArgumentNullException(nameof(formattable));
            }

            return formattable.ToString(CultureInfo.InvariantCulture);
        }

        public override string ToString() => this.ToString(CultureInfo.CurrentCulture);
    }
}
```

Here FormattableString.Invariant seems to be a solution. Notice FormattableString is an abstract class. It is inherited by System.Runtime.CompilerServices.FormattableStringFactory.ConcreteFormattableString:

```csharp
namespace System.Runtime.CompilerServices
{
    public static class FormattableStringFactory
    {
        private sealed class ConcreteFormattableString : FormattableString
        {
            private readonly string _format;

            private readonly object[] _arguments;

            public override string Format => this._format;

            public override int ArgumentCount => this._arguments.Length;

            internal ConcreteFormattableString(string format, object[] arguments)
            {
                this._format = format;
                this._arguments = arguments;
            }

            public override object[] GetArguments() => this._arguments;

            public override object GetArgument(int index) => this._arguments[index];

            public override string ToString
                (IFormatProvider formatProvider) => string.Format(formatProvider, this._format, this._arguments);
        }

        public static FormattableString Create(string format, params object[] arguments)
        {
            if (format == null)
            {
                throw new ArgumentNullException(nameof(format));
            }

            if (arguments == null)
            {
                throw new ArgumentNullException(nameof(arguments));
            }

            return new ConcreteFormattableString(format, arguments);
        }
    }
}
```

So that, FormattableString.Invariant calls ConcreteFormattableString.ToString, which then calls string.Format, the overload with IFormatProvider. Code Analysis warning CA1305: Specify IFormatProvider can be fixed as:

```csharp
using System;
using System.Diagnostics;

using static System.FormattableString;

internal static class Program
{
    private static void Main() => Trace.WriteLine(Invariant($"Machine name: {Environment.MachineName}."));
}
```

Above interpolated string is compiled to composite formatting call to FormattableStringFactory.Create:

```csharp
using System;
using System.Diagnostics;
using System.Runtime.CompilerServices;

using static System.FormattableString;
internal static class Program
{
    private static void Main() => Trace.WriteLine(Invariant(
        // $"Machine name: {Environment.MachineName}." is compiled to:
        FormattableStringFactory.Create("Machine name: {0}.", Environment.MachineName)));
}
```

So the conclusion is, to fix Code Analysis CA1305 for C# 6.0 string interpolation, FormattableString.Invariant has to be called for every occurrence of $ syntax. This is still very annoying. Hope there can be another syntactic sugar for this, for example, a $$ prefix to call FormattableString.Invariant.

Also, MSDN and many other articles are inaccurate about interpolated string and FormattableString. [MSDN says](https://msdn.microsoft.com/en-us/library/dn961160.aspx):

> There are implicit type conversions from an interpolated string

In .NET, the term “[implicit type conversion](https://msdn.microsoft.com/en-us/library/ms173105.aspx)” is usually about runtime behavior, implemented by calling a type conversion operator defined with the [implicit keyword](https://msdn.microsoft.com/en-us/library/z5z9kes2.aspx). However, as demonstrated above, interpolated string becomes FormattableString/IFormattable at compile time.