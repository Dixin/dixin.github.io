---
title: "Customizing View Folder Path In ASP.NET MVC Beta"
published: 2008-11-18
description: "By default, in an ASP.NET MVC Web application, all ViewPages and ViewUserControls should be placed in the default ~/Vews/ directory. But today some one needs to place them into a custom location."
image: ""
tags: [".NET", "ASP.NET", "ASP.NET MVC", "C#", "Web"]
category: "ASP.NET"
draft: false
lang: ""
---

By default, in an ASP.NET MVC Web application, all ViewPages and ViewUserControls should be placed in the default ~/Vews/ directory. But today some one needs to place them into a custom location.

There are already some posts, like "[Retrieve Views from Different Folders](http://weblogs.asp.net/stephenwalther/archive/2008/07/23/asp-net-mvc-tip-24-retrieve-views-from-different-folders.aspx)" and "[Implementieren eines eigenen ViewLocators für ASP.Net MVC](http://blog.dotnet-expert.de/2008/07/22/ImplementierenEinesEigenenViewLocatorsF%c3%bcrASPNetMVC.aspx)". The former one specifies a view path in the controller action method:

```csharp
public class ProductController : Controller
{
    public ActionResult Index()
    {
        return this.View(@"~\CustomDirectory\Index.aspx");
    }
}
```

The problem is, a controller should not know how the views are placed.

The latter one does not work because it relies on an legacy version of ASP.NET MVC. But it makes more sense. It implements a customized controller factory. When controllers are created, a customized ViewLocator are also created and assigned to controller's ViewEngine property.

In the latest beta version of ASP.NET MVC, the ViewLocator is removed. Now a static class ViewEngines is used to manage the ViewEngine:

```csharp
public static class ViewEngines
{
    private readonly static ViewEngineCollection _engines = new ViewEngineCollection 
        {
            new WebFormViewEngine() 
        };

    private readonly static AutoViewEngine _defaultEngine = new AutoViewEngine(_engines);

    public static AutoViewEngine DefaultEngine
    {
        get
        {
            return _defaultEngine;
        }
    }

    public static ViewEngineCollection Engines
    {
        get
        {
            return _engines;
        }
    }
}
```

By default, we will have a instance of WebFormViewEngine, which implemented IViewEngine. Here is the definition of WebFormViewEngine, which looks clear:

```csharp
public class WebFormViewEngine : VirtualPathProviderViewEngine
{

    public WebFormViewEngine()
    {
        this.MasterLocationFormats = new string[] 
            {
                "~/Views/{1}/{0}.master",
                "~/Views/Shared/{0}.master"
            };

        this.ViewLocationFormats = new string[] 
            {
                "~/Views/{1}/{0}.aspx",
                "~/Views/{1}/{0}.ascx",
                "~/Views/Shared/{0}.aspx",
                "~/Views/Shared/{0}.ascx"
            };

        this.PartialViewLocationFormats = this.ViewLocationFormats;
    }

    protected override IView CreatePartialView(ControllerContext controllerContext, string partialPath)
    {
        return new WebFormView(partialPath, null);
    }

    protected override IView CreateView(
        ControllerContext controllerContext, string viewPath, string masterPath)
    {
        return new WebFormView(viewPath, masterPath);
    }
}
```

So what need to do is very simple: just add another customized IViewEngine object to the Engines property:

```csharp
ViewEngines.Engines.Add(new WebFormViewEngine()
    {
        MasterLocationFormats = new string[] 
            {
                "~/CustomDirectory/{1}/{0}.master",
                "~/CustomDirectory/Shared/{0}.master"
            },

        ViewLocationFormats = new string[] 
            {
                "~/CustomDirectory/{1}/{0}.aspx",
                "~/CustomDirectory/{1}/{0}.ascx",
                "~/CustomDirectory/Shared/{0}.aspx",
                "~/CustomDirectory/Shared/{0}.ascx"
            },

        PartialViewLocationFormats = new string[] 
            {
                "~/CustomDirectory/{1}/{0}.aspx",
                "~/CustomDirectory/{1}/{0}.ascx",
                "~/CustomDirectory/Shared/{0}.aspx",
                "~/CustomDirectory/Shared/{0}.ascx"
            }
    });
```

Now it rocks!