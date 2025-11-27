---
title: "The Order Issue of XAML Attributes"
published: 2009-12-17
description: "When programming Silverlight, it is neccessary to pay attention to the order of the XAML element’s attributes. Here is a simple example."
image: ""
tags: ["Silverlight", "Web"]
category: "Silverlight"
draft: false
lang: ""
---

When programming Silverlight, it is neccessary to pay attention to the order of the XAML element’s attributes. Here is a simple example.

Here is the ListBox in the XAML:

```csharp
<ListBox SelectedItem="{Binding SelectedItem}" ItemsSource="{Binding Items}" x:Name="listBox">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding}" />
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```
[](http://11011.net/software/vspaste)

and the the data binding in the code-behind:

```csharp
public MainPage()
{
    this.InitializeComponent();

    this.listBox.DataContext = new Data();
}

public class Data
{
    public int[] Items
    {
        get
        {
            return new int[] { 0, 1, 2, 3 };
        }
    }

    public int SelectedItem
    {
        get
        {
            return 2;
        }
    }
}
```
[](http://11011.net/software/vspaste)

We hope 4 items appear in this ListBox, and the third one is selected. But it won’t work as expected:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_4C692BD9.png "image")

The third item is not selected because the SelectedItem attribute is binded before ItemsSource. So when SelectedItem is set, there is no ItemsSource to check.

The solution is to swap the two attributes, put ItemsSource before SelectedItem:

```csharp
<ListBox ItemsSource="{Binding Items}" SelectedItem="{Binding SelectedItem}" x:Name="listBox">
```
[](http://11011.net/software/vspaste)

Now the control works:

![image](https://aspblogs.z22.web.core.windows.net/dixin/Media/image_78A5B2BD.png "image")

The conclusion is, the XAML attributes are order-sensitive. I am wondering whether this is by design…