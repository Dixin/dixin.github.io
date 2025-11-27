---
title: "Understanding C# Features (9) Partial Method"
published: 2009-12-16
description: "\\] - \\]"
image: ""
tags: [".NET", "C#", "C# 3.0", "C# Features", "LINQ", "LINQ via C#"]
category: "C#"
draft: false
lang: ""
---

\[[LINQ via C#](/posts/linq-via-csharp)\] - \[[C# Features](/archive/?tag=C%23%20Features)\]

## The partial keyword

The partial keyword is introduced since C# 2.0. It enables class/struct/interface definition to be split to multiple code files at design time. For example, When creating a WinForm application project in VisualStudio, a form definition is typically like this:

```csharp
public partial class MainForm : Form
{
    public MainForm()
    {
        this.InitializeComponent();
    }
}
```

The InitializeCompoment method is auto generated in the MainForm.Designer.cs file:

```csharp
partial class MainForm
{
    #region Windows Form Designer generated code

    private void InitializeComponent()
    {
        this.SuspendLayout();
        // 
        // MainForm
        // 
        this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
        this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
        this.ClientSize = new System.Drawing.Size(282, 255);
        this.Name = "MainForm";
        this.Text = "Form1";
        this.ResumeLayout(false);
    }

    #endregion
}
```

The partial class improves the productivity when a type has some code implemented by developer, some other code auto generated.

C# 3.0 introduces partial methods. For example, In LINQ to SQL dbml, The MSLinqToSQLGenerator generates definition like this:

```csharp
public partial class WebOSUser : INotifyPropertyChanging, INotifyPropertyChanged
{
    partial void OnValidate(ChangeAction action);
}
```

Here partial method OnValidate can be optionally implemented by developer in another place:

```csharp
public partial class WebOSUser
{
    partial void OnValidate(ChangeAction action)
    {
        switch (action)
        {
            case ChangeAction.Delete:
                // Validates object when deleting.
                break;

            case ChangeAction.Insert:
                // Validates object when inserting.
                break;
        }
    }
}
```

If implemented this OnValidate method will be invoked when the WebOSUser entity instance is being validated.

## Compilation

Apparently partial method must be declared within a partial class/struct, which can have a method implementation.

Partial method consists of a declaration and an optional implementation. At compile time:

-   If the implementation is not provided, compiler removes the definition declaration, and all the invocations;
-   If the implementation is provided, this partial method is compiled into a normal private method.

For the above reasons, access modifiers and attributes are not allow on partial method.

For the same reason, partial method must return void. Otherwise, when implementing declaration is not provided, there is no way to compile or remove the partial method declaration and invocation:

```csharp
partial int PartialMethod();

private static void Main()
{
    int result = PartialMethod();
    Console.WriteLine(result);
}
```