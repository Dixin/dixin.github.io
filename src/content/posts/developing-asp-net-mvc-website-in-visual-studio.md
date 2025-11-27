---
title: "Developing ASP.NET MVC Website in Visual Studio"
published: 2009-06-14
description: "Sometimes I send ASP.NET MVC project to some senior friends, and ask them for code review. But some of them do not have the Visual Studio ASP.NET MVC add-on installed. So I tried to develop MVC websit"
image: ""
tags: ["ASP.NET", "ASP.NET MVC", "C#", "Visual Studio", "Web"]
category: "ASP.NET"
draft: false
lang: ""
---

## Developing ASP.NET MVC website in normal Web project

Sometimes I send ASP.NET MVC project to some senior friends, and ask them for code review. But some of them do not have the Visual Studio ASP.NET MVC add-on installed. So I tried to develop MVC websites in a normal Web application project, so Visual Studio can run the project without installing ASP.NET MVC add-on.

The difference is, when removing the code-behind file of ViewPage, the C# generic syntax cannot work:
```
<%@ Page Language="C#" Inherits="WebOS.Website.Views.ViewPageBase<DesktopViewModel>" %>
```
[](http://11011.net/software/vspaste)

The above code only works in ASP.NET MVC project. In normal web application project, the CLR syntax is needed:
```
<%@ Page Language="C#" Inherits="WebOS.Website.Views.ViewPageBase`1[[WebOS.Website.ViewModels.DesktopViewModel, WebOS.Website]]" %>
```
[](http://11011.net/software/vspaste)

This way works for developing, debugging, and deploy. And the intellisense also works. [CoolWebOS.com](http://www.coolwebos.com) has being developed in this way.

[](http://www.coolwebos.com/)

Please do notice that, this way works in Visual Studio 2008 and Visual Studio 2008 SP1, but in some builds of 2010, when you press F5, your Visual Studio crashes. To resolve this, in your Web project properties, click the “Web” tab, and choose “Use Local IIS Web server”.

## Web application project vs. ASP.NET MVC project

In the .csproj project files of normal Web project and MVC project, the different is the <ProjectTypeGuids> node.

In normal Web application project, it is:
```
<ProjectTypeGuids>{349c5851-65df-11da-9384-00065b846f21};{fae04ec0-301f-11d3-bf4b-00c04f79efbc}</ProjectTypeGuids>
```
[](http://11011.net/software/vspaste)

While in MVC project, it is:
```
<ProjectTypeGuids>{603c0e0b-db56-11dc-be95-000d561079b0};{349c5851-65df-11da-9384-00065b846f21};{fae04ec0-301f-11d3-bf4b-00c04f79efbc}</ProjectTypeGuids>
```
[](http://11011.net/software/vspaste)

An extra GUID {603c0e0b-db56-11dc-be95-000d561079b0} is added to indicate this is an ASP.NET MVC project. So when ASP.NET MVC add-on is not installed for Visual Studio , Visual Studio cannot recognize ASP.NET MVC project.

## Developing ASP.NET MVC website in Visual Studio 2010

ASP.NET MVC is not included in Beta 1 because Beta 1 started locking down before MVC 1.0 shipped. The fore mentioned way can be used to develop ASP.NET MVC website, or you can install [this add-on](http://aspnet.codeplex.com/Release/ProjectReleases.aspx?ReleaseId=28527).