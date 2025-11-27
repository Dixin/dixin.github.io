---
title: "Automated Web Testing (2) Using Selenium"
published: 2009-02-07
description: "is another automated web application testing framework. Unlike ,"
image: ""
tags: ["JavaScript", "Testing", "Web"]
category: "JavaScript"
draft: false
lang: ""
---

[Selenium](http://seleniumhq.org/) is another automated web application testing framework. Unlike [WatiN](http://www.cnblogs.com/dixin/archive/2009/02/07/Automated-web-testing-2-Using-Selenium.html), which has only 3 developers, Selenium is developed by a team of programmers and testers in [ThoughtWorks](http://www.thoughtworks.com/), so that it could be more powerful:

-   The tests can be written as HTML tables or coded in a number of popular programming languages, including C#, Perl, Java, PHP, Python, and Ruby;
-   The tests can be run in most modern web browsers, including IE, Firefox, Safari, Opera, Chrome;
-   Selenium can be deployed on Windows, Linux, and Macintosh.

Last year, I was using Selenium 1.0 beta1 with a lot of issues found, and sometimes the Java source code has to be manually modified. Now the beta2 is released, working much better than before, with a few issues in [Safari](http://www.apple.com/safari/).

## Preparation

Selenium has a couple of components. The [remote control](http://seleniumhq.org/download/) is going to be used.

In the downloaded package, two folders are needed:

-   selenium-server-1.0-beta-2 is the remote control, which is a server written in Java. It simulates a web server to drive the tested page in order to satisfies the JavaScript [same-origin policy](http://en.wikipedia.org/wiki/Same_origin_policy). And the commands for the tested page are received via Http;
-   selenium-dotnet-client-driver-1.0-beta-2 is the client driver containing the .NET assemblies we are going to refer.

![webtest-selenium1](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestselenium1_44889169.gif "webtest-selenium1")

Extract these 2 folders to somewhere, like E:\\Software\\Selenium.

Since the remote control is written in Java. We also need to install JRE from [here](http://www.java.com/).

## Getting started

First of all, start up server, the remote control. We can create a batch file like this:

```csharp
java -jar E:\Software\selenium\selenium-server-1.0-beta-2\selenium-server.jar
```

Sometimes the java command does not work in Windows Server 2008. To resolve this, please:

-   use the full path of your java.exe, like C:\\Program Files\\Java\\jre6\\bin\\java;
-   or add the folder path of java.exe to your PATH environment variable.

After the server is started, we can see its information:

![webtest-selenium2](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestselenium2_53DBF378.gif "webtest-selenium2")

Then in Visual Studio, add a reference to selenium-dotnet-client-driver-1.0-beta-2\\ ThoughtWorks.Selenium.Core.dll, and add a test class “SeleniumTest.cs” to our test project. So that we can write a test:

```csharp
using Microsoft.VisualStudio.TestTools.UnitTesting;

using Selenium;

[TestClass]
public class SeleniumTest
{
    private DefaultSelenium _firefox;

    [ClassInitialize]
    public void StartSelenium(TestContext testContext)
    {
        this._firefox = new DefaultSelenium("localhost", 4444, @"*firefox", "http://localhost:4444");
        this._firefox.Start();
    }

    [TestMethod]
    public void GoogleTest()
    {
        bool hasText;

        this._firefox.Open("http://www.google.com");
        this._firefox.Type("name=q", "Dixin");
        this._firefox.Click("name=btnG");
        this._firefox.WaitForPageToLoad("10000");
        hasText = this._firefox.IsTextPresent("Dixin");

        Assert.IsTrue(hasText, @"The search result does not contain text ""Dixin"".");
    }

    [TestCleanup]
    public void CloseBrowser()
    {
        this._firefox.Close();
    }

    [ClassCleanup]
    public void StopSelenium()
    {
        this._firefox.Stop();
    }
}
```
[](http://11011.net/software/vspaste)

Please notice the port used by the remote control is 4444.

If the browser does not work, add the path of its folder to the PATH environment viarable, and restart the server.

You can watch how the remote control and the browser work.

![webtest-selenium3](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestselenium3_1FC75425.gif "webtest-selenium3")

## More about Selenium

Selenium works very differently from WatiN. [Here](http://seleniumhq.org/projects/core/reference.html) is the detailed introduction of Selenium, and [here](http://release.seleniumhq.org/selenium-remote-control/0.9.2/doc/dotnet/index.html) is the document for the client .NET library.

[Here](http://www.hanselman.com/blog/UnitTestingSilverlightWithSelenium.aspx) is another article on writing unit test for Silverlight using Selenium.

## Tools for Selenium

![webtest-selenium4](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestselenium4_7D8F489E.gif "webtest-selenium4")

[Selenium IDE](http://seleniumhq.org/projects/ide/) can be used to record, edit, and debug tests. Selenium IDE includes the entire Selenium Core, can be used to easily record and play back tests in the actual environment that they will run. Selenium IDE is not only recording tool, but a complete IDE.

![webtest-selenium5](https://aspblogs.z22.web.core.windows.net/dixin/Media/webtestselenium5_6D33D0E5.gif "webtest-selenium5")

It can be downloaded from [here](http://seleniumhq.org/download/).

## WatiN vs. Selenium

[WatiN](http://www.cnblogs.com/dixin/archive/2009/02/07/Automated-web-testing-2-Using-Selenium.html) is easy to use and lightweight enough for .NET developers, while its current problem is to cross browsers. But for Selenium, a Java server has to be used. [Here](http://www.51testing.com/?146934/action_viewspace_itemid_78808.html) is a detailed table for the comparison.