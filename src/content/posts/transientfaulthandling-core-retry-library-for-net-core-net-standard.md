---
title: "TransientFaultHandling.Core: Retry library for .NET Core/.NET Standard"
published: 2025-01-22
description: "TransientFaultHandling.Core is retry library for transient error handling. It is ported from Microsoft Enterprise Library’s TransientFaultHandling library, a library widely used with .NET Framework. T"
image: ""
tags: [".NET", ".NET Core", ".NET Standard", "C#", "Exception Handling", "Functional Programming", "Retry"]
category: ".NET"
draft: false
lang: ""
---

TransientFaultHandling.Core is retry library for transient error handling. It is ported from Microsoft Enterprise Library’s TransientFaultHandling library, a library widely used with .NET Framework. The retry pattern APIs are ported to .NET Core/.NET Standard, with outdated configuration API updated, and new retry APIs added for convenience.

## Introduction

With this library, the old code of retry logic based on Microsoft Enterprise Library can be ported to .NET Core/.NET Standard without modification:

```csharp
ITransientErrorDetectionStrategy transientExceptionDetection = new MyDetection();
RetryStrategy retryStrategy = new FixedInterval(retryCount: 5, retryInterval: TimeSpan.FromSeconds(1));
RetryPolicy retryPolicy = new RetryPolicy(transientExceptionDetection, retryStrategy);
string result = retryPolicy.ExecuteAction(() => webClient.DownloadString("https://DixinYan.com"));
```

With this library, it is extremely easy to detect transient exception and implement retry logic. For example, the following code downloads a string, if the exception thrown is transient (a WebException), it retries up to 5 times, and it waits for 1 second between retries:

```csharp
Retry.FixedInterval(
    () => webClient.DownloadString("https://DixinYan.com"),
    isTransient: exception => exception is WebException,
    retryCount: 5, retryInterval: TimeSpan.FromSeconds(1));
```

Fluent APIs are also provided for even better readability:

```csharp
Retry
    .WithIncremental(retryCount: 5, initialInterval: TimeSpan.FromSeconds(1),
        increment: TimeSpan.FromSeconds(1))
    .Catch<OperationCanceledException>()
    .Catch<WebException>(exception =>
        exception.Response is HttpWebResponse response && response.StatusCode == HttpStatusCode.RequestTimeout)
    .ExecuteAction(() => webClient.DownloadString("https://DixinYan.com"));
```

It also supports JSON/XML/INI configuration:

```csharp
{
  "retryStrategy": {
    "name1": {
      "fastFirstRetry": "true",
      "retryCount": 5,
      "retryInterval": "00:00:00.1"
    },
    "name2": {
      "fastFirstRetry": "true",
      "retryCount": 55,
      "initialInterval": "00:00:00.2",
      "increment": "00:00:00.3"
    }
  }
}
```

## Document

[https://weblogs.asp.net/dixin/transientfaulthandling-core-retry-library-for-net-core-net-standard](/posts/transientfaulthandling-core-retry-library-for-net-core-net-standard "https://weblogs.asp.net/dixin/transientfaulthandling-core-retry-library-for-net-core-net-standard")

## Source

[https://github.com/Dixin/EnterpriseLibrary.TransientFaultHandling.Core](https://github.com/Dixin/EnterpriseLibrary.TransientFaultHandling.Core "https://github.com/Dixin/EnterpriseLibrary.TransientFaultHandling.Core") (Partially ported from [Topaz](https://github.com/MicrosoftArchive/transient-fault-handling-application-block), with additional new APIs and updated configuration APIs).

## NuGet installation

It can be installed through [NuGet](https://www.nuget.org/packages/EntityFramework.Functions) using .NET CLI:

> dotnet add package EnterpriseLibrary.TransientFaultHandling.Core
> 
> dotnet add package TransientFaultHandling.Caching
> 
> dotnet add package TransientFaultHandling.Configuration
> 
> dotnet add package TransientFaultHandling.Data

Or in Visual Studio NuGet Package Manager Console:

> Install-Package EnterpriseLibrary.TransientFaultHandling.Core
> 
> Install-Package TransientFaultHandling.Caching
> 
> Install-Package TransientFaultHandling.Configuration
> 
> Install-Package TransientFaultHandling.Data

## Backward compatibility with Enterprise Library

This library provides maximum backward compatibility with Microsoft Enterprise Library’s TransientFaultHandling (aka Topaz) for .NET Framework:

-   If you have code using EnterpriseLibrary.TransientFaultHandling, you can port your code to use EnterpriseLibrary.TransientFaultHandling.Core, without any modification.
-   If you have code using EnterpriseLibrary.TransientFaultHandling.Caching, you can port your code to use TransientFaultHandling.Caching, without any modification.
-   If you have code using EnterpriseLibrary.TransientFaultHandling.Data, you can port your code to use TransientFaultHandling.Data, without any modification.
-   If you have code and configuration based on EnterpriseLibrary.TransientFaultHandling.Configuration, you have to change your code and configuration to use TransientFaultHandling.Configuration. The old XML configuration infrastructure based on .NET Framework is outdated. You need to replace the old XML format with new XML/JSON/INI format configuration supported by .NET Core/.NET Standard.

## How to use the APIs

For retry pattern, please read Microsoft’s [introduction in Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/retry). For the introduction of transient fault handling, read Microsoft’s [Perseverance, Secret of All Triumphs: Using the Transient Fault Handling Application Block](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/dn440719\(v=pandp.60\)) and Microsoft Azure Architecture Center’s [Best practice - Transient fault handling](https://docs.microsoft.com/en-us/azure/architecture/best-practices/transient-faults).

### Object-oriented APIs from Enterprise Library

Enterprise Library existing APIs follows an object-oriented design. For the details, please see Microsoft’s [API reference](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/dn170426\(v=pandp.60\)) and ebook [Developer's Guide to Microsoft Enterprise Library](http://go.microsoft.com/fwlink/p/?linkid=290904)‘s Chapter 4, Using the Transient Fault Handling Application Block. Here is a brief introduction.

First, ITransientErrorDetectionStrategy interface must be implemented. It has a single method IsTransient to detected if the thrown exception is transient and retry should be executed.

```csharp
internal class MyDetection : ITransientErrorDetectionStrategy
{
    bool IsTransient(Exception exception) => 
        exception is OperationCanceledException;
}
```

Second, a retry strategy must be defined to specify how the retry is executed, like retry count, retry interval, etc.. a retry strategy must inherit RetryStrategy abstract class. There are 3 built-in retry strategies: FixedInterval, Incremental, ExponentialBackoff.

Then a retry policy (RetryPolicy class) must be instantiated with a retry strategy and an ITransientErrorDetectionStrategy interface. a retry policy has an ExecuteAction method to execute the specified synchronous function, and an ExecuteAsync method to execute a\\the specified async function. It also has a Retrying event. When the executed sync/async function throws an exception, if the exception is detected to be transient and max retry count is not reached, then it waits for the specified retry interval, and then it fires the Retrying event, and execute the specified sync/async function again.

```csharp
RetryStrategy retryStrategy = new FixedInterval(retryCount: 5, retryInterval: TimeSpan.FromSeconds(1));

RetryPolicy retryPolicy = new RetryPolicy(new MyDetection(), retryStrategy);
retryPolicy.Retrying += (sender, args) =>
    Console.WriteLine($@"{args.CurrentRetryCount}: {args.LastException}");

using (WebClient webClient = new WebClient())
{
    string result1 = retryPolicy.ExecuteAction(() => webClient.DownloadString("https://DixinYan.com"));
    string result2 = await retryPolicy.ExecuteAsync(() => webClient.DownloadStringTaskAsync("https://DixinYan.com"));
}
```

### New functional APIs: single function call for retry

The above object-oriented API design is very inconvenient. New static functions Retry.FixedInterval, Retry.Incremental, Retry.ExponentialBackoff are added to implement retry with a single function call. For example:

```csharp
Retry.FixedInterval(
    () => webClient.DownloadString("https://DixinYan.com"),
    isTransient: exception => exception is OperationCanceledException,
    retryCount: 5, retryInterval: TimeSpan.FromSeconds(1),
    retryingHandler: (sender, args) =>
        Console.WriteLine($@"{args.CurrentRetryCount}: {args.LastException}"));

await Retry.IncrementalAsync(
    () => webClient.DownloadStringTaskAsync("https://DixinYan.com"),
    isTransient: exception => exception is OperationCanceledException,
    retryCount: 5, initialInterval: TimeSpan.FromSeconds(1), increment: TimeSpan.FromSeconds(2));
```

These sync and async functions are very convenient because only the first argument (action to execute) is required. All the other arguments are optional. And a function can be defined inline to detect transient exception, instead of defining a type to implement an interface:

```csharp
// Treat any exception as transient. Use default retry count, default interval. No event handler.
Retry.FixedInterval(() => webClient.DownloadString("https://DixinYan.com"));

// Treat any exception as transient. Specify retry count. Use default initial interval, default increment. No event handler.
await Retry.IncrementalAsync(
    () => webClient.DownloadStringTaskAsync("https://DixinYan.com"),
    retryCount: 10);
```

### New fluent APIs for retry

For better readability, new fluent APIs are provided:

```csharp
Retry
    .WithFixedInterval(retryCount: 5, retryInterval: TimeSpan.FromSeconds(1))
    .Catch(exception =>
        exception is OperationCanceledException ||
        exception is HttpListenerException httpListenerException && httpListenerException.ErrorCode == 404)
    .HandleWith((sender, args) =>
        Console.WriteLine($@"{args.CurrentRetryCount}: {args.LastException}"))
    .ExecuteAction(() => MyTask());
```

The HandleWith call adds an event handler to the Retying event. It is optional:

```csharp
Retry
    .WithFixedInterval(retryCount: 5, retryInterval: TimeSpan.FromSeconds(1))
    .Catch(exception =>
        exception is OperationCanceledException ||
        exception is HttpListenerException httpListenerException && httpListenerException.ErrorCode == 404)
    .ExecuteAction(() => MyTask());
```

Catch method has a generic overload. The above code is equivalent to:

```csharp
Retry
    .WithFixedInterval(retryCount: 5, retryInterval: TimeSpan.FromSeconds(1))
    .Catch<OperationCanceledException>()
    .Catch<HttpListenerException>(exception => exception.ErrorCode == 404)
    .ExecuteAction(() => MyTask());
```

The following code “catches” any exception as transient:

```csharp
Retry
    .WithIncremental(retryCount: 5, increment: TimeSpan.FromSeconds(1)) // Use default initial interval.
    .Catch() // Equivalent to: .Catch<Exception>()
    .ExecuteAction(() => MyTask());
```

### Old XML configuration for retry

Ditched the following old XML format from .NET Framework:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <configSections>
    <section name="RetryPolicyConfiguration" type="Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.Configuration.RetryPolicyConfigurationSettings, Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.Configuration" />
  </configSections>
  <RetryPolicyConfiguration>
    <fixedInterval name="FixedIntervalDefault" maxRetryCount="10" retryInterval="00:00:00.1" />
    <incremental name="IncrementalIntervalDefault" maxRetryCount="10" initialInterval="00:00:00.01" retryIncrement="00:00:00.05" />
    <exponentialBackoff name="ExponentialIntervalDefault" maxRetryCount="10" minBackoff="100" maxBackoff="1000" deltaBackoff="100" />
  </RetryPolicyConfiguration>
</configuration>
```

These old XML infrastructures are outdated. Use new XML/JSON/INI format configuration supported by .NET Standard/.NET Core.

### New XML/JSON/INI configuration for retry

Please install TransientFaultHandling.Configuration package. The following is an example JSON configuration file app.json. It has 3 retry strategies, a FixedInterval retry strategy, a Incremental retry strategy, and an ExponentialBackoff retry strategy:

```csharp
{
  "retryStrategy": {
    "name1": {
      "fastFirstRetry": "true",
      "retryCount": 5,
      "retryInterval": "00:00:00.1"
    },
    "name2": {
      "fastFirstRetry": "true",
      "retryCount": 55,
      "initialInterval": "00:00:00.2",
      "increment": "00:00:00.3"
    },
    "name3": {
      "fastFirstRetry": "true",
      "retryCount": 555,
      "minBackoff": "00:00:00.4",
      "maxBackoff": "00:00:00.5",
      "deltaBackoff": "00:00:00.6"
    }
  }
}
```

The same configuration file app.xml in XML format:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <retryStrategy name="name1">
    <fastFirstRetry>true</fastFirstRetry>
    <retryCount>5</retryCount>
    <retryInterval>00:00:00.1</retryInterval>
  </retryStrategy>
  <retryStrategy name="name2">
    <fastFirstRetry>true</fastFirstRetry>
    <retryCount>55</retryCount>
    <initialInterval>00:00:00.2</initialInterval>
    <increment>00:00:00.3</increment>
  </retryStrategy>
  <retryStrategy name="name3">
    <fastFirstRetry>true</fastFirstRetry>
    <retryCount>555</retryCount>
    <minBackoff>00:00:00.4</minBackoff>
    <maxBackoff>00:00:00.5</maxBackoff>
    <deltaBackoff>00:00:00.6</deltaBackoff>
  </retryStrategy>
</configuration>
```

And app.ini file in INI format:

```csharp
[retryStrategy:name1]
fastFirstRetry=true
retryCount=5
retryInterval=00:00:00.1

[retryStrategy:name2]
fastFirstRetry=true
retryCount=55
initialInterval=00:00:00.2
increment=00:00:00.3

[retryStrategy:name3]
fastFirstRetry=true
retryCount=5555
minBackoff=00:00:00.4
maxBackoff=00:00:00.5
deltaBackoff=00:00:00.6
```

These configurations can be easily loaded and deserialized into retry strategy instances:

```csharp
IConfiguration configuration = new ConfigurationBuilder()
    .AddJsonFile("app.json") // or AddXml("app.xml") or AddIni("app.ini")
    .Build();

IDictionary<string, RetryStrategy> retryStrategies = configuration.GetRetryStrategies();
// or retryStrategies = configuration.GetRetryStrategies("yourConfigurationSectionKey");
// The default configuration section key is "retryStrategy".
```

The GetRetryStrategies extension method returns a dictionary of key value pairs, where each key is the specified name of retry strategy, and each value is the retry strategy instance. Here the first key is “name1”, the first value is a FixedInterval retry strategy instance. The second key is “anme2”, the second value is Incremental retry strategy instance. The third key is “name3”, the third value is ExponentialBackoff retry strategy instance. This extension method can also accept custom configuration section key, and a function to create instance of custom retry strategy type.

```csharp
retryStrategies = configuration.GetRetryStrategies(
    key: "yourConfigurationSectionKey",
    getCustomRetryStrategy: configurationSection => new MyRetryStrategyType(...));
```

The other generic overload can filter the specified retry strategy type:

```csharp
FixedInterval retryStrategy = configuration.GetRetryStrategies<FixedInterval>().Single().Value;
```

It still returns a dictionary, which only has the specified type of retry strategies.

## TransientFaultHandling.Data.Core: SQL Server support

Since 2.1.0, both Microsoft.Data.SqlClient and System.Data.SqlClient are supported. A API breaking change is introduced for this. If you are using the latest Microsoft.Data.SqlClient, no code change is needed. If you are using the legacy System.Data.SqlClient, the following types are renamed with a Legacy suffix:

-   ReliableSqlConnection –> ReliableSqlConnection**Legacy**
-   SqlDatabaseTransientErrorDetectionStrategy –> SqlDatabaseTransientErrorDetectionStrategy**Legacy**
-   SqlAzureTransientErrorDetectionStrategy –> SqlAzureTransientErrorDetectionStrategy**Legacy**

You can either rename these types or add the using directives:

```csharp
using ReliableSqlConnection = Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.ReliableSqlConnectionLegacy;
using SqlDatabaseTransientErrorDetectionStrategy = Microsoft.Practices.EnterpriseLibrary.TransientFaultHandling.SqlDatabaseTransientErrorDetectionStrategyLegacy;
using SqlAzureTransientErrorDetectionStrategy = Microsoft.Practices.EnterpriseLibrary.WindowsAzure.TransientFaultHandling.SqlAzure.SqlAzureTransientErrorDetectionStrategyLegacy;
```

## History

This library follows the [http://semver.org](http://semver.org/) standard for semantic versioning.

-   1.0.0: Initial release. Ported EnterpriseLibrary.TransientFaultHandling from .NET Framework to .NET Core/.NET Standard.

-   1.1.0: Add functional APIs for retry.
-   1.2.0: Add functional APIs for retry.

-   2.0.0: Add fluent APIs for retry. Ported EnterpriseLibrary.TransientFaultHandling.Caching from .NET Framework to .NET Core/.NET Standard. Ported EnterpriseLibrary.TransientFaultHandling.Data from .NET Framework to .NET Core/.NET Standard. Redesigned/reimplemented EnterpriseLibrary.TransientFaultHandling.Configuration with JSON in .NET Core/.NET Standard.
-   2.1.0: Add support for Microsoft.Data.SqlClient. Now both Microsoft.Data.SqlClient and System.Data.SqlClient are supported.