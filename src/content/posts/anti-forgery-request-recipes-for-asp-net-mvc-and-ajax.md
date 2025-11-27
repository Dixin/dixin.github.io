---
title: "Anti-Forgery Request Recipes For ASP.NET MVC And AJAX"
published: 2010-05-22
description: "This post discusses solutions for anti-forgery request scenarios in ASP.NET MVC and AJAX:"
image: ""
tags: [".NET", "ASP.NET MVC", "JavaScript", "jQuery", "Web"]
category: ".NET"
draft: false
lang: ""
---

This post discusses solutions for anti-forgery request scenarios in ASP.NET MVC and AJAX:

-   How to enable validation on controller, instead of on each action;
-   How to specify non-constant token salt in runtime;
-   How to work with the server side validation in AJAX scenarios.

## Background (Normal scenario of form submitting)

To secure websites from [cross-site request forgery](http://en.wikipedia.org/wiki/Cross-site_request_forgery) (CSRF, or XSRF) attack, ASP.NET MVC provides an excellent mechanism:

-   The server prints tokens to cookie and inside the form;
-   When the form is submitted to server, token in cookie and token inside the form are sent in the HTTP request;
-   Server validates the tokens.

To print tokens to browser, just invoke HtmlHelper.AntiForgeryToken():

```csharp
<% using (Html.BeginForm())
   { %>
    <%: this.Html.AntiForgeryToken(Constants.AntiForgeryTokenSalt)%>

    <%-- Other fields. --%>

    <input type="submit" value="Submit" />
<% } %>
```

This invocation generates a token and writes it inside the form:

```csharp
<form action="..." method="post">
    <input name="__RequestVerificationToken" type="hidden" value="J56khgCvbE3bVcsCSZkNVuH9Cclm9SSIT/ywruFsXEgmV8CL2eW5C/gGsQUf/YuP" />
 
    <!-- Other fields. -->
 
    <input type="submit" value="Submit" />
</form>
```

and also writes it into the cookie:

> `__RequestVerificationToken_Lw__= J56khgCvbE3bVcsCSZkNVuH9Cclm9SSIT/ywruFsXEgmV8CL2eW5C/gGsQUf/YuP`

When the above form is submitted, they are both sent to server.

In the server side, \[ValidateAntiForgeryToken\] attribute is used to specify the controllers or actions to validate them:

```csharp
[HttpPost]
[ValidateAntiForgeryToken(Salt = Constants.AntiForgeryTokenSalt)]
public ActionResult Action(/* ... */)
{
    // ...
}
```

This is very productive for form scenarios. But recently, when resolving security vulnerabilities for Web products, problems are encountered.

## Turn on validation on controller (not on each action)

The server side problem is, one single \[ValidateAntiForgeryToken\] attribute is expected to declare on controller, but actually a lot of attributes have be to declared on controller's each POST actions. Because POST actions are usually much more then controllers, the work would be a little crazy.

### Problem

Usually a controller contains both actions for HTTP GET requests and actions for POST, and, usually validations are expected for only HTTP POST requests. So, if the \[ValidateAntiForgeryToken\] is declared on the controller, the HTTP GET requests become invalid:

```csharp
[ValidateAntiForgeryToken(Salt = Constants.AntiForgeryTokenSalt)]
public class ProductController : Controller // One [ValidateAntiForgeryToken] attribute. 
{
    [HttpGet]
    public ActionResult Index() // Index() cannot work.
    {
        // ...
    }

    [HttpPost]
    public ActionResult PostAction1(/* ... */)
    { 
        // ...
    }

    [HttpPost]
    public ActionResult PostAction2(/* ... */)
    {
        // ...
    }

    // Other actions.
}
```

If browser sends an HTTP GET request by clicking a link: http://Site/Product/Index, validation definitely fails, because no token is provided (by http://Site/Product/Index?\_\_RequestVerificationToken=???, for example).

As a result, many \[ValidateAntiForgeryToken\] attributes have be distributed to each POST action:

```csharp
public class ProductController : Controller // Many [ValidateAntiForgeryToken] attributes.
{
    [HttpGet]
    public ActionResult Index() // Works.
    {
        // ...
    }

    [HttpPost]
    [ValidateAntiForgeryToken(Salt = Constants.AntiForgeryTokenSalt)]
    public ActionResult PostAction1(/* ... */)
    { 
        // ...
    }

    [HttpPost]
    [ValidateAntiForgeryToken(Salt = Constants.AntiForgeryTokenSalt)]
    public ActionResult PostAction2(/* ... */)
    {
        // ...
    }

    // Other actions.
}
```

This would be a little bit crazy, because one Web product can have a lot of POST actions.

### Solution

To avoid a large number of \[ValidateAntiForgeryToken\] attributes (one for each POST action), the following ValidateAntiForgeryTokenWrapperAttribute wrapper class can be helpful, where HTTP verbs can be specified:

```csharp
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method,
    AllowMultiple = false, Inherited = true)]
public class ValidateAntiForgeryTokenWrapperAttribute : FilterAttribute, IAuthorizationFilter
{
    private readonly ValidateAntiForgeryTokenAttribute _validator;

    private readonly AcceptVerbsAttribute _verbs;

    public ValidateAntiForgeryTokenWrapperAttribute(HttpVerbs verbs)
        : this(verbs, null)
    {
    }

    public ValidateAntiForgeryTokenWrapperAttribute(HttpVerbs verbs, string salt)
    {
        this._verbs = new AcceptVerbsAttribute(verbs);
        this._validator = new ValidateAntiForgeryTokenAttribute()
            {
                Salt = salt
            };
    }

    public void OnAuthorization(AuthorizationContext filterContext)
    {
        string httpMethodOverride = filterContext.HttpContext.Request.GetHttpMethodOverride();
        if (this._verbs.Verbs.Contains(httpMethodOverride, StringComparer.OrdinalIgnoreCase))
        {
            this._validator.OnAuthorization(filterContext);
        }
    }
}
```

Here only HTTP requests of the specified verbs are validated:

```csharp
[ValidateAntiForgeryTokenWrapper(HttpVerbs.Post, Constants.AntiForgeryTokenSalt)]
public class ProductController : Controller
{
    // GET actions are not affected.
    // Only HTTP POST requests are validated.
}
```

Now one single attribute on a controller turns on validation for all POST actions in that controller.

It would be nice if HTTP verbs can be specified on the built-in \[ValidateAntiForgeryToken\] attribute. And, this is very easy to implement.

## Specify non-constant salt in runtime

By default, the salt should be a compile time constant, so it can be used for the \[ValidateAntiForgeryToken\] or \[ValidateAntiForgeryTokenWrapper\] attribute.

### Problem

One Web product might be sold to many clients. If a constant salt is evaluated in compile time, after the product is built and deployed to many clients, they all have the same salt. Of course, clients do not like this. Even some clients might expect a configurable custom salt. In these scenarios, salt is required to be a runtime value.

### Solution

In the above \[ValidateAntiForgeryToken\] and \[ValidateAntiForgeryTokenWrapper\] attributes, the salt is passed through constructor. So one solution is to remove that parameter:

```csharp
public class ValidateAntiForgeryTokenWrapperAttribute : FilterAttribute, IAuthorizationFilter
{
    public ValidateAntiForgeryTokenWrapperAttribute(HttpVerbs verbs)
    {
        this._verbs = new AcceptVerbsAttribute(verbs);
        this._validator = new ValidateAntiForgeryTokenAttribute()
            {
                Salt = Configurations.AntiForgeryTokenSalt
            };
    }

    // Other members.
}
```

But this smells bad because the injected dependency becomes a hard dependency. So the other solution to work around the limitation of attributes, is moving validation code into controller:

```csharp
public abstract class AntiForgeryControllerBase : Controller
{
    private readonly ValidateAntiForgeryTokenAttribute _validator;

    private readonly AcceptVerbsAttribute _verbs;

    protected AntiForgeryControllerBase(HttpVerbs verbs, string salt)
    {
        this._verbs = new AcceptVerbsAttribute(verbs);
        this._validator = new ValidateAntiForgeryTokenAttribute()
            {
                Salt = salt
            };
    }

    protected override void OnAuthorization(AuthorizationContext filterContext)
    {
        base.OnAuthorization(filterContext);

        string httpMethodOverride = filterContext.HttpContext.Request.GetHttpMethodOverride();
        if (this._verbs.Verbs.Contains(httpMethodOverride, StringComparer.OrdinalIgnoreCase))
        {
            this._validator.OnAuthorization(filterContext);
        }
    }
}
```

Then just make controller classes inheriting from this AntiForgeryControllerBase class. Now the salt is no long required to be a compile time constant.

## Submit token via AJAX

For browser side, once server side turns on anti-forgery validation for HTTP POST, all AJAX POST requests will fail by default.

### Problem

In AJAX scenarios, the HTTP POST request is not sent by form. Take jQuery as an example:

```csharp
$.post(url, {
    productName: "Tofu",
    categoryId: 1 // Token is not posted.
}, callback);
```

This kind of AJAX POST requests will always be invalid, because server side code cannot see the token in the posted data.

### Solution

Basically, the tokens must be printed to browser then sent back to server. So first of all, HtmlHelper.AntiForgeryToken() need to be called somewhere. Now the browser has token in both HTML and cookie.

Then jQuery must find the printed token in the HTML, and append token to the data before sending:

```csharp
$.post(url, {
    productName: "Tofu",
    categoryId: 1,
    __RequestVerificationToken: getToken() // Token is posted.
}, callback);
```

To be reusable, this can be encapsulated into a tiny jQuery plugin:

```csharp
/// <reference path="jquery-1.4.2.js" />

(function ($) {
    $.getAntiForgeryToken = function (tokenWindow, appPath) {
        // HtmlHelper.AntiForgeryToken() must be invoked to print the token.
        tokenWindow = tokenWindow && typeof tokenWindow === typeof window ? tokenWindow : window;

        appPath = appPath && typeof appPath === "string" ? "_" + appPath.toString() : "";
        // The name attribute is either __RequestVerificationToken,
        // or __RequestVerificationToken_{appPath}.
        var tokenName = "__RequestVerificationToken" + appPath;

        // Finds the <input type="hidden" name={tokenName} value="..." /> from the specified window.
        // var inputElements = tokenWindow.$("input[type='hidden'][name=' + tokenName + "']");
        var inputElements = tokenWindow.document.getElementsByTagName("input");
        for (var i = 0; i < inputElements.length; i++) {
            var inputElement = inputElements[i];
            if (inputElement.type === "hidden" && inputElement.name === tokenName) {
                return {
                    name: tokenName,
                    value: inputElement.value
                };
            }
        }
    };

    $.appendAntiForgeryToken = function (data, token) {
        // Converts data if not already a string.
        if (data && typeof data !== "string") {
            data = $.param(data);
        }

        // Gets token from current window by default.
        token = token ? token : $.getAntiForgeryToken(); // $.getAntiForgeryToken(window).

        data = data ? data + "&" : "";
        // If token exists, appends {token.name}={token.value} to data.
        return token ? data + encodeURIComponent(token.name) + "=" + encodeURIComponent(token.value) : data;
    };

    // Wraps $.post(url, data, callback, type) for most common scenarios.
    $.postAntiForgery = function (url, data, callback, type) {
        return $.post(url, $.appendAntiForgeryToken(data), callback, type);
    };

    // Wraps $.ajax(settings).
    $.ajaxAntiForgery = function (settings) {
        // Supports more options than $.ajax(): 
        // settings.token, settings.tokenWindow, settings.appPath.
        var token = settings.token ? settings.token : $.getAntiForgeryToken(settings.tokenWindow, settings.appPath);
        settings.data = $.appendAntiForgeryToken(settings.data, token);
        return $.ajax(settings);
    };
})(jQuery);
```

In most of the scenarios, it is Ok to just replace $.post() invocation with $.postAntiForgery(), and replace $.ajax() with $.ajaxAntiForgery():

```csharp
$.postAntiForgery(url, {
    productName: "Tofu",
    categoryId: 1
}, callback); // The same usage as $.post(), but token is posted.
```

There might be some scenarios of custom token, where $.appendAntiForgeryToken() is useful:

```csharp
data = $.appendAntiForgeryToken(data, token);
// Token is already in data. No need to invoke $.postAntiForgery().
$.post(url, data, callback);
```

or $.ajaxAntiForgery() can be used:

```csharp
$.ajaxAntiForgery({
    type: "POST",
    url: url,
    data: {
        productName: "Tofu",
        categoryId: 1
    },
    success: callback, // The same usage as $.ajax(), supporting more options.
    token: token // Custom token.
});
```

And there are special scenarios that the token is not in the current window. For example:

-   An HTTP POST request can be sent from an iframe, while the token is in the parent window or top window;
-   An HTTP POST request can be sent from an popup window or a dialog, while the token is in the opener window;

etc. Here, token's container window can be specified for $.getAntiForgeryToken():

```csharp
data = $.appendAntiForgeryToken(data, $.getAntiForgeryToken(window.parent));
// Token is already in data. No need to invoke $.postAntiForgery().
$.post(url, data, callback);
```

or $.ajaxAntiForgery() can be used:

```csharp
$.ajaxAntiForgery({
    type: "POST",
    url: url,
    data: {
        productName: "Tofu",
        categoryId: 1
    },
    success: callback, // The same usage as $.ajax(), supporting more options.
    tokenWindow: window.parent // Token is in another window.
});
```

If you have better solution, please do tell me.