---
title: "Entity Framework Core and LINQ to Entities in Depth (3) Logging and Tracing Queries"
published: 2019-10-05
description: "As fore mentioned, LINQ to Entities queries are translated to database queries. To understand how EF Core work with databases, it is important to uncover the actual underlying operations to the SQL da"
image: ""
tags: [".NET", ".NET Core", "C#", "EF Core", "Entity Framework Core", "LINQ", "LINQ to Entities", "SQL", "SQL Server"]
category: ".NET"
draft: false
lang: ""
---

## \[[LINQ via C# series](/posts/linq-via-csharp)\]

## \[[Entity Framework Core (EF Core) series](/archive/?tag=Entity%20Framework%20Core)\]

## \[[Entity Framework (EF) series](/archive/?tag=Entity%20Framework)\]

As fore mentioned, LINQ to Entities queries are translated to database queries. To understand how EF Core work with databases, it is important to uncover the actual underlying operations to the SQL database, which can be traced or logged in C# application side and in SQL database.

### Application side logging

EF Core follows the ASP.NET Core logging infrastructure. To log EF Core operations, a logger (implementing Microsoft.Extensions.Logging.ILogger) and a logger provider (implementing Microsoft.Extensions.Logging.ILoggerProvider) can be defined. The following is a simple example to simply trace everything:

public class TraceLogger : ILogger

```csharp
{
```
```csharp
private readonly string categoryName;
```

```csharp
public TraceLogger(string categoryName) => this.categoryName = categoryName;
```

```csharp
public bool IsEnabled(LogLevel logLevel) => true;
```

```csharp
public void Log<TState>(
```
```csharp
LogLevel logLevel,
```
```csharp
EventId eventId,
```
```csharp
TState state,
```
```csharp
Exception exception,
```
```csharp
Func<TState, Exception, string> formatter)
```
```csharp
{
```
```csharp
Trace.WriteLine($"{DateTime.Now.ToString("o")} {logLevel} {eventId.Id} {this.categoryName}");
```
```csharp
Trace.WriteLine(formatter(state, exception));
```
```csharp
}
```

```csharp
public IDisposable BeginScope<TState>(TState state) => null;
```
```csharp
}
```

```csharp
public class TraceLoggerProvider : ILoggerProvider
```
```csharp
{
```
```csharp
public ILogger CreateLogger(string categoryName) => new TraceLogger(categoryName);
```

```csharp
public void Dispose() { }
```

}

Now the logger provider can be hooked up with EF Core:

public partial class AdventureWorks

```csharp
{
```
```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
```
```csharp
{
```
```csharp
LoggerFactory loggerFactory = new LoggerFactory();
```
```csharp
loggerFactory.AddProvider(new TraceLoggerProvider());
```
```csharp
optionsBuilder.UseLoggerFactory(loggerFactory);
```
```csharp
}
```

}

The following is a simple example of LINQ to Entities query. It pulls all ProductCategory entities from AdventureWorks.ProductCategories data source:

internal static void Logger()

```csharp
{
```
```csharp
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```csharp
{
```
```csharp
IQueryable<ProductCategory> source = adventureWorks.ProductCategories; // Define query.
```
```csharp
source.WriteLines(category => category.Name); // Execute query.
```
```csharp
}
```
```csharp
// 2017-01-11T22:15:43.4625876-08:00 Debug 2 Microsoft.EntityFrameworkCore.Query.Internal.SqlServerQueryCompilationContextFactory
```
```csharp
// Compiling query model:
```
```csharp
// 'from ProductCategory <generated>_0 in DbSet<ProductCategory>
```
```csharp
// select < generated>_0'
```

```csharp
// 2017-01-11T22:15:43.4932882-08:00 Debug 3 Microsoft.EntityFrameworkCore.Query.Internal.SqlServerQueryCompilationContextFactory
```
```csharp
// Optimized query model:
```
```csharp
// 'from ProductCategory <generated>_0 in DbSet<ProductCategory>
```
```csharp
// select < generated>_0'
```

```csharp
// 2017-01-11T22:15:43.6179834-08:00 Debug 5 Microsoft.EntityFrameworkCore.Query.Internal.SqlServerQueryCompilationContextFactory
```
```csharp
// TRACKED: True
```
```csharp
// (QueryContext queryContext) => IEnumerable<ProductCategory> _ShapedQuery(
```
```csharp
// queryContext: queryContext,
```
```csharp
// shaperCommandContext: SelectExpression:
```
```sql
// SELECT [p].[ProductCategoryID], [p].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [p]
```
```csharp
// ,
```
```csharp
// shaper: UnbufferedEntityShaper<ProductCategory>
```
```csharp
// )
```

```csharp
// 2017-01-11T22:15:43.7272876-08:00 Debug 3 Microsoft.EntityFrameworkCore.Storage.Internal.SqlServerConnection
```
```csharp
// Opening connection to database 'AdventureWorks' on server 'tcp:dixin.database.windows.net,1433'.
```

```csharp
// 2017-01-11T22:15:44.1024201-08:00 Information 1 Microsoft.EntityFrameworkCore.Storage.IRelationalCommandBuilderFactory
```
```csharp
// Executed DbCommand (66ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
```
```sql
// SELECT [p].[ProductCategoryID], [p].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [p]
```

```csharp
// 2017-01-11T22:15:44.1505353-08:00 Debug 4 Microsoft.EntityFrameworkCore.Storage.Internal.SqlServerConnection
```
```csharp
// Closing connection to database 'AdventureWorks' on server 'tcp:dixin.database.windows.net,1433'.
```

}

The logs uncovers that a SELECT statement is executed in database to query all categories. The logs also uncovers how exactly EF Core execute the operation – it compiles LINQ to Entities query and generates SQL, then opens a connection to SQL database, execute the generated SQL in database, and close the connection. This mechanism is discussed in the query translation part.

EF Core also provides a TagWith query to annotate the translated database query:

internal static void TagWith(AdventureWorks adventureWorks)

```csharp
{
```
```csharp
IQueryable<ProductCategory> source = adventureWorks.ProductCategories
```
```csharp
.TagWith("Query categories with id greater than 1.")
```
```csharp
.Where(category => category.ProductCategoryID > 1); // Define query.
```
```csharp
source.WriteLines(category => category.Name); // Execute query.
```
```csharp
// -- Query categories with id greater than 1.
```
```sql
// SELECT [category].[ProductCategoryID], [category].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [category]
```
```sql
// WHERE [category].[ProductCategoryID]> 1
```

}

### Database side tracing with Extended Events

SQL database provides variant mechanisms to collect the information of executed operations. Extended Events is such a feature available in all cloud and on-premise SQL database editions. For Windows, SQL Server Management Studio is a rich tools to setup and views the event tracing. And this can also be done from other platform. In any SQL tool (like mssql extension for Visual Studio Code, which works on Linux, Mac, and Windows), connect to the Azure SQL database (or SQL Server on-premise database), and execute the following SQL to create an Extended Events session called Queries:

CREATE EVENT SESSION \[Queries\] ON DATABASE \-- ON SERVER for SQL Server on-premise database.

```csharp
ADD EVENT sqlserver.begin_tran_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.commit_tran_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.error_reported(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.rollback_tran_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.rpc_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.sp_statement_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.sql_batch_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```csharp
ADD EVENT sqlserver.sql_statement_completed(
```
```csharp
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text))
```
```csharp
ADD TARGET package0.ring_buffer(SET max_events_limit = (100)) -- Most recent 100 events.
```
```csharp
WITH (STARTUP_STATE = OFF);
```

GO

It traces the transactions, SQL executions, and errors, etc. To start the session and collect events, execute the following SQL:

ALTER EVENT SESSION \[Queries\] ON DATABASE \-- ON SERVER for SQL Server on-premise database.

```csharp
STATE = START;
```

GO

The collected events data is stored as XML, the following query formats the XML data to a statistics table, along with an event table which has the operations requested by .NET Core (or .NET Framework) application:

DECLARE @target\_data XML \=

```sql
(SELECT CONVERT(XML, [targets].[target_data])
```
```sql
FROM sys.dm_xe_database_session_targets AS [targets] -- sys.dm_xe_session_targets for SQL Server on-premise database.
```
```csharp
INNER JOIN sys.dm_xe_database_sessions AS [sessions] -- sys.dm_xe_sessions for SQL Server on-premise database.
```
```csharp
ON [sessions].[address] = [targets].[event_session_address]
```
```sql
WHERE [sessions].[name] = N'Queries');
```

```csharp
SELECT
```
```csharp
@target_data.value('(RingBufferTarget/@truncated)[1]', 'bigint') AS [truncated],
```
```csharp
@target_data.value('(RingBufferTarget/@processingTime)[1]', 'bigint') AS [processingTime],
```
```csharp
@target_data.value('(RingBufferTarget/@totalEventsProcessed)[1]', 'bigint') AS [totalEventsProcessed],
```
```csharp
@target_data.value('(RingBufferTarget/@eventCount)[1]', 'bigint') AS [eventCount],
```
```csharp
@target_data.value('(RingBufferTarget/@droppedCount)[1]', 'bigint') AS [droppedCount],
```
```csharp
@target_data.value('(RingBufferTarget/@memoryUsed)[1]', 'bigint') AS [memoryUsed];
```

```csharp
SELECT
```
```csharp
[event].value('@timestamp[1]', 'datetime') AS [timestamp],
```
```csharp
[event].value('(action[@name="client_hostname"]/value)[1]', 'nvarchar(MAX)') AS [client_hostname],
```
```csharp
[event].value('(action[@name="client_pid"]/value)[1]', 'bigint') AS [client_pid],
```
```csharp
[event].value('(action[@name="client_connection_id"]/value)[1]', 'uniqueidentifier') AS [client_connection_id],
```
```csharp
[event].value('(action[@name="session_id"]/value)[1]', 'bigint') AS [session_id],
```
```csharp
[event].value('(action[@name="request_id"]/value)[1]', 'bigint') AS [request_id],
```
```csharp
[event].value('(action[@name="database_name"]/value)[1]', 'nvarchar(MAX)') AS [database_name],
```
```csharp
[event].value('@name[1]', 'nvarchar(MAX)') AS [name],
```
```csharp
[event].value('(data[@name="duration"]/value)[1]', 'bigint') AS [duration],
```
```csharp
[event].value('(data[@name="result"]/text)[1]', 'nvarchar(MAX)') AS [result],
```
```csharp
[event].value('(data[@name="row_count"]/value)[1]', 'bigint') AS [row_count],
```
```csharp
[event].value('(data[@name="cpu_time"]/value)[1]', 'bigint') as [cpu_time],
```
```csharp
[event].value('(data[@name="logical_reads"]/value)[1]', 'bigint') as [logical_reads],
```
```csharp
[event].value('(data[@name="physical_reads"]/value)[1]', 'bigint') as [physical_reads],
```
```csharp
[event].value('(data[@name="writes"]/value)[1]', 'bigint') as [writes],
```
```csharp
[event].value('(action[@name="sql_text"]/value)[1]', 'nvarchar(MAX)') AS [sql_text],
```
```csharp
[event].value('(data[@name="statement"]/value)[1]', 'nvarchar(MAX)') AS [statement],
```
```csharp
[event].value('(data[@name="error_number"]/value)[1]', 'bigint') AS [error_number],
```
```csharp
[event].value('(data[@name="message"]/value)[1]', 'nvarchar(MAX)') AS [message]
```
```sql
FROM @target_data.nodes('//RingBufferTarget/event') AS [Rows]([event])
```
```sql
WHERE [event].value('(action[@name="client_app_name"]/value)[1]', 'nvarchar(MAX)') = N'Core .Net SqlClient Data Provider' -- N'.Net SqlClient Data Provider' for .NET Framework.
```

ORDER BY \[timestamp\];

The following is an example of how the traced database operations look like: