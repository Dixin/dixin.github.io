---
title: "Automated Web Testing (1) Using WatiN"
published: 2009-02-05
description: "(what-in), stands for Web Application Testing In .NET, is a very easy automated web application testing framework. WatiN is developed in C# for web testing with"
image: ""
tags: [".NET", "Testing", "Web"]
category: ".NET"
draft: false
lang: ""
---

[WatiN](http://watin.sourceforge.net/) (what-in), stands for Web Application Testing In .NET, is a very easy automated web application testing framework. WatiN is developed in C# for web testing with Internet Explorer and [FireFox](http://www.firefox.com). According to [Scott Guthrie](http://weblogs.asp.net/scottgu/):

> … it will give you exactly the experience that you'll have when a customer hits the site, which ends up being a far more accurate assessment of the application quality.

This tutorial shows how to use WatiN in [Visual Studio 2008](http://msdn.microsoft.com/en-us/visualc/aa700831.aspx), while it can also work with other popular test frameworks like [NUnit](http://www.nunit.org/).

## Preparation

The current RTM version of WatiN is [1.3](http://sourceforge.net/project/showfiles.php?group_id=167632&package_id=190606&release_id=633278), supporting only IE. The latest 2.0 CTP2 supports both IE and Firefox. Let’s go through 1.3 with IE first.

![webtest-watin1](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestwatin1_064284C9.gif "webtest-watin1")

After the installing, a couple of libraries should be found in the installation folder. Typically, it is C:\\Program Files\\WatiN\\1.3.0-net-2.0\\bin. In most of the scenarios we work with WatiN.Core.dll.

## Getting started with a console application

Create a console application project in Visual Studio, and add a reference to WatiN.Core.dll. Then copy and paste the following code and press F5. It should work immediately.

```csharp
using System;

using WatiN.Core;

internal class Program
{
    [STAThread]
    private static void Main()
    {
        // Opens an new Internet Explorer window and goto the Google website.
        IE ie = new IE("http://www.google.com");

        // Finds the search text field and type "WatiN" in it.
        ie.TextField(Find.ByName("q")).TypeText("Dixin");

        // Clicks the Google search button.
        ie.Button(Find.ByValue("Google Search")).Click();

        // Finds the <p> which shows the search result statistics.
        Div div = ie.Div(Find.ById("ssb"));
        Para p = div.Paras[0];
        string result = p.Text;

        // Closes Internet Explorer.
        ie.Close();

        // Writes the statistics text to the console window.
        Console.WriteLine(result);

        Console.Read();
    }
}
```

You can watch from your screen how the IE works. The related elements will be highlighted when being operated.

Pay attention to the STAThread attribute for the Main method. [It is requried](http://watin.sourceforge.net/apartmentstateinfo.html) because the Thread.Apartmentstate should be set to STA when using WatiN.

## Working in a Visual Studio test project

Now let’s write some real test code. Create a unit test project in Visual Studio; add a new test class "WatiNTest.cs".

![webtest-watin2](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestwatin2_43EF6C85.gif "webtest-watin2")

In this test class, write a test method like this:

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;

using WatiN.Core;

[TestClass]
public class WatiNTest
{
    [TestMethod]
    public void GoogleTest()
    {
        bool hasText;

        using (IE ie = new IE())
        {
            ie.GoTo("http://www.google.com");
            ie.TextField(Find.ByName("q")).TypeText("Dixin");
            ie.Button(Find.ByName("btnG")).Click();
            hasText = ie.ContainsText("Dixin");
        }

        Assert.IsTrue(hasText, @"The search result does not contain text ""Dixin"".");
    }
}
```

In this scenario, the STAThread attribute is not required for the test methods.

Run this unit test, and here is the result in my machine.

![webtest-watin3](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestwatin3_222393F4.gif "webtest-watin3")

Now we know how to write automated web testing code against web products, no matter the product is built with of ASP.NET Web Form, or it is a rich Ajax application.

## WatiN with Firefox

The 2.0 CTP2 supports Firefox, with a lot of problems of course.

First of all, download the 2.0 CTP2 package from [here](http://sourceforge.net/project/showfiles.php?group_id=167632&package_id=266951&release_id=654071), and extract the WatiN-2.0.1.754-net-2.0 folder to somewhere, like C:\\Program Files\\WatiN.

![webtest-watin4](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestwatin4_2072C820.gif "webtest-watin4")

Then, pay attention to the path of Firefox.exe. WatiN uses Firefox.GetExecutablePath() method to find Firefox.exe. For example, I am using a green version of Firefox, so I have to modify the source code to make it return "E:\\Software\\Firefox\\FireFox.exe", which is the path of my Firefox 3.0.6. If you installed your Firefox normally, you can just ignore this step.

And an [Firefox](http://www.firefox.com) add-on, [jssh](http://www.croczilla.com/jssh), need to be installed. It can be found in the WatiN-2.0.1.754-net-2.0\\Mozilla folder. For example, if using [Firefox](http://www.firefox.com) 3.0, I should install jssh-WINNT-3.x.xpi.

The last step is to close all instances of Firefox, or WatiN cannot start it.

Now create a new console application project, and add a reference to the new WatiN.Core.dll. Then run this test:

```csharp
using System;

using WatiN.Core;
using WatiN.Core.Mozilla;

internal class Program
{
    [STAThread]
    private static void Main()
    {
        // Opens an new Firefox window and goto the Google website.
        FireFox firefox = new FireFox("http://www.google.com");

        // Finds the search text field and type "WatiN" in it.
        firefox.TextField(Find.ByName("q")).Value = "Dixin";

        // Clicks the Google search button.
        firefox.Button(Find.ByValue("Google Search")).Click();

        // Finds the <p> which shows the search result statistics.
        string result = string.Empty;
        WatiN.Core.Mozilla.Element div = firefox.Element(Find.ById("ssb")) as WatiN.Core.Mozilla.Element;
        if (div != null)
        {
            result = div.ChildNodes[1].Text;
        }

        // Closes Firefox immediately.
        firefox.Dispose();

        // Writes the statistics text to the console window.
        Console.WriteLine(result);

        Console.Read();
    }
}
```

There is a sample folder in the WatiN-2.0.1.754-net-2.0. When trying, exceptions are thrown from CrossBrowserTest.ExecuteTest(). So a Thread.Sleep(5000) has to be added between two Firefox test cases, so that WatiN works.

```csharp
// Simple method
program.SearchForWatiNOnGoogleVerbose();

Thread.Sleep(5000);

// Generic method
program.ExecuteTest(program.SearchForWatiNOnGoogleUsingBaseTest);
```

## Tools for WatiN

[IE Developer Toolbar](http://www.microsoft.com/downloadS/details.aspx?familyid=E59C3964-672D-4511-BB3E-2D5E1DB91038&displaylang=en) should be very helpful to inspect the DOM and find the elements / attributes, like id, which makes coding easier.

![webtest-watin5](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestwatin5_1083835C.gif "webtest-watin5")

[WatiN Test Recorder](http://watintestrecord.sourceforge.net/) is another powerful tool. It runs an IE instance, records the actions, and generates C# test codes.

![webtest-watin6](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestwatin6_1C38CA8E.gif "webtest-watin6")

## WatiN best practices

This article, "[WATiN/R Testing Design Pattern](http://blogs.conchango.com/richardgriffin/archive/2006/11/14/Testing-Design-Pattern-for-using-WATiR_2F00_N.aspx)", described some patterns and practices of WatiN. Another one "[WatiN Testing Pattern](http://infozerk.com/averyblog/watin-testing-pattern/)" is simpler. Its basic idea is to encapsulate for each page like this:

```csharp
public class SomePage : IE
{
    // Uri of the page
    private const string Uri = "http://localhost";

    public SomePage()
        : base(Uri)
    {
    }

    // Elements of the page
    public TextField UserNameTextField
    {
        get
        {
            return this.TextField(Find.ByName("Username"));
        }
    }

    public TextField PasswordTextField
    {
        get
        {
            return this.TextField(Find.ByName("Password"));
        }
    }

    public Button LogOnButton
    {
        get
        {
            return this.Button(Find.ByName("LogOn"));
        }
    }

    // Action of the page
    public void LogOn(string userName, string password)
    {
        this.UserNameTextField.TypeText(userName);
        this.PasswordTextField.TypeText(password);
        this.LogOnButton.Click();
    }
}
```

Then testing code can be easy and clear:

```csharp
[TestMethod]
public void SomePageTest()
{
    bool hasText;

    using (SomePage somePage = new SomePage())
    {
        somePage.LogOn("Dixin", "Password");
        hasText = somePage.ContainsText("Dixin");
    }

    Assert.IsTrue(hasText, "Message");
}
```

## The future of WatiN

WatiN is one of the easiest web testing frameworks for .NET developers / testers. According to the [official blog](http://watinandmore.blogspot.com/), hopefully after finishing Firefox support, Chrome support will be there very quickly. But I am a little confused with the design of WatiN 2.0.