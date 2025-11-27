---
title: "Entity Framework Core and LINQ to Entities in Depth (3) Logging and Tracing Queries"
published: 2019-10-05
description: "As fore mentioned, LINQ to Entities queries are translated to database queries. To understand how EF Core work with databases, it is important to uncover the actual underlying operations to the SQL da"
image: ""
tags: ["C#", ".NET", "LINQ", "Entity Framework Core", "LINQ to Entities", "SQL Server", "SQL", ".NET Core", "EF Core"]
category: "C#"
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
```
{
```
```csharp
private readonly string categoryName;
```
```
public TraceLogger(string categoryName) => this.categoryName = categoryName;
```
```
public bool IsEnabled(LogLevel logLevel) => true;
```
```
public void Log<TState>(
```
```
LogLevel logLevel,
```
```
EventId eventId,
```
```
TState state,
```
```
Exception exception,
```
```
Func<TState, Exception, string> formatter)
```
```
{
```
```
Trace.WriteLine($"{DateTime.Now.ToString("o")} {logLevel} {eventId.Id} {this.categoryName}");
```
```
Trace.WriteLine(formatter(state, exception));
```
```
}
```
```
public IDisposable BeginScope<TState>(TState state) => null;
```
```
}
```

```csharp
public class TraceLoggerProvider : ILoggerProvider
```
```
{
```
```
public ILogger CreateLogger(string categoryName) => new TraceLogger(categoryName);
```
```
public void Dispose() { }
```

}

Now the logger provider can be hooked up with EF Core:

public partial class AdventureWorks
```
{
```
```csharp
protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
```
```
{
```
```
LoggerFactory loggerFactory = new LoggerFactory();
```
```
loggerFactory.AddProvider(new TraceLoggerProvider());
```
```
optionsBuilder.UseLoggerFactory(loggerFactory);
```
```
}
```

}

The following is a simple example of LINQ to Entities query. It pulls all ProductCategory entities from AdventureWorks.ProductCategories data source:

internal static void Logger()
```
{
```
```
using (AdventureWorks adventureWorks = new AdventureWorks())
```
```
{
```
```
IQueryable<ProductCategory> source = adventureWorks.ProductCategories; // Define query.
```
```
source.WriteLines(category => category.Name); // Execute query.
```
```
}
```
```
// 2017-01-11T22:15:43.4625876-08:00 Debug 2 Microsoft.EntityFrameworkCore.Query.Internal.SqlServerQueryCompilationContextFactory
```
```
// Compiling query model:
```
```
// 'from ProductCategory <generated>_0 in DbSet<ProductCategory>
```
```
// select < generated>_0'
```
```
// 2017-01-11T22:15:43.4932882-08:00 Debug 3 Microsoft.EntityFrameworkCore.Query.Internal.SqlServerQueryCompilationContextFactory
```
```
// Optimized query model:
```
```
// 'from ProductCategory <generated>_0 in DbSet<ProductCategory>
```
```
// select < generated>_0'
```
```
// 2017-01-11T22:15:43.6179834-08:00 Debug 5 Microsoft.EntityFrameworkCore.Query.Internal.SqlServerQueryCompilationContextFactory
```
```
// TRACKED: True
```
```
// (QueryContext queryContext) => IEnumerable<ProductCategory> _ShapedQuery(
```
```
// queryContext: queryContext,
```
```
// shaperCommandContext: SelectExpression:
```
```sql
// SELECT [p].[ProductCategoryID], [p].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [p]
```
```
// ,
```
```
// shaper: UnbufferedEntityShaper<ProductCategory>
```
```
// )
```
```
// 2017-01-11T22:15:43.7272876-08:00 Debug 3 Microsoft.EntityFrameworkCore.Storage.Internal.SqlServerConnection
```
```
// Opening connection to database 'AdventureWorks' on server 'tcp:dixin.database.windows.net,1433'.
```
```
// 2017-01-11T22:15:44.1024201-08:00 Information 1 Microsoft.EntityFrameworkCore.Storage.IRelationalCommandBuilderFactory
```
```
// Executed DbCommand (66ms) [Parameters=[], CommandType='Text', CommandTimeout='30']
```
```sql
// SELECT [p].[ProductCategoryID], [p].[Name]
```
```sql
// FROM [Production].[ProductCategory] AS [p]
```
```
// 2017-01-11T22:15:44.1505353-08:00 Debug 4 Microsoft.EntityFrameworkCore.Storage.Internal.SqlServerConnection
```
```
// Closing connection to database 'AdventureWorks' on server 'tcp:dixin.database.windows.net,1433'.
```

}

The logs uncovers that a SELECT statement is executed in database to query all categories. The logs also uncovers how exactly EF Core execute the operation – it compiles LINQ to Entities query and generates SQL, then opens a connection to SQL database, execute the generated SQL in database, and close the connection. This mechanism is discussed in the query translation part.

EF Core also provides a TagWith query to annotate the translated database query:

internal static void TagWith(AdventureWorks adventureWorks)
```
{
```
```
IQueryable<ProductCategory> source = adventureWorks.ProductCategories
```
```
.TagWith("Query categories with id greater than 1.")
```
```
.Where(category => category.ProductCategoryID > 1); // Define query.
```
```
source.WriteLines(category => category.Name); // Execute query.
```
```
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
```
ADD EVENT sqlserver.begin_tran_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.commit_tran_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.error_reported(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.rollback_tran_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.rpc_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.sp_statement_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.sql_batch_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text)),
```
```
ADD EVENT sqlserver.sql_statement_completed(
```
```
ACTION(sqlserver.client_app_name, sqlserver.client_connection_id, sqlserver.client_hostname, sqlserver.client_pid, sqlserver.database_name, sqlserver.request_id, sqlserver.session_id, sqlserver.sql_text))
```
```
ADD TARGET package0.ring_buffer(SET max_events_limit = (100)) -- Most recent 100 events.
```
```
WITH (STARTUP_STATE = OFF);
```

GO

It traces the transactions, SQL executions, and errors, etc. To start the session and collect events, execute the following SQL:

ALTER EVENT SESSION \[Queries\] ON DATABASE \-- ON SERVER for SQL Server on-premise database.
```
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
```
INNER JOIN sys.dm_xe_database_sessions AS [sessions] -- sys.dm_xe_sessions for SQL Server on-premise database.
```
```
ON [sessions].[address] = [targets].[event_session_address]
```
```sql
WHERE [sessions].[name] = N'Queries');
```
```
SELECT
```
```
@target_data.value('(RingBufferTarget/@truncated)[1]', 'bigint') AS [truncated],
```
```
@target_data.value('(RingBufferTarget/@processingTime)[1]', 'bigint') AS [processingTime],
```
```
@target_data.value('(RingBufferTarget/@totalEventsProcessed)[1]', 'bigint') AS [totalEventsProcessed],
```
```
@target_data.value('(RingBufferTarget/@eventCount)[1]', 'bigint') AS [eventCount],
```
```
@target_data.value('(RingBufferTarget/@droppedCount)[1]', 'bigint') AS [droppedCount],
```
```
@target_data.value('(RingBufferTarget/@memoryUsed)[1]', 'bigint') AS [memoryUsed];
```
```
SELECT
```
```
[event].value('@timestamp[1]', 'datetime') AS [timestamp],
```
```
[event].value('(action[@name="client_hostname"]/value)[1]', 'nvarchar(MAX)') AS [client_hostname],
```
```
[event].value('(action[@name="client_pid"]/value)[1]', 'bigint') AS [client_pid],
```
```
[event].value('(action[@name="client_connection_id"]/value)[1]', 'uniqueidentifier') AS [client_connection_id],
```
```
[event].value('(action[@name="session_id"]/value)[1]', 'bigint') AS [session_id],
```
```
[event].value('(action[@name="request_id"]/value)[1]', 'bigint') AS [request_id],
```
```
[event].value('(action[@name="database_name"]/value)[1]', 'nvarchar(MAX)') AS [database_name],
```
```
[event].value('@name[1]', 'nvarchar(MAX)') AS [name],
```
```
[event].value('(data[@name="duration"]/value)[1]', 'bigint') AS [duration],
```
```
[event].value('(data[@name="result"]/text)[1]', 'nvarchar(MAX)') AS [result],
```
```
[event].value('(data[@name="row_count"]/value)[1]', 'bigint') AS [row_count],
```
```
[event].value('(data[@name="cpu_time"]/value)[1]', 'bigint') as [cpu_time],
```
```
[event].value('(data[@name="logical_reads"]/value)[1]', 'bigint') as [logical_reads],
```
```
[event].value('(data[@name="physical_reads"]/value)[1]', 'bigint') as [physical_reads],
```
```
[event].value('(data[@name="writes"]/value)[1]', 'bigint') as [writes],
```
```
[event].value('(action[@name="sql_text"]/value)[1]', 'nvarchar(MAX)') AS [sql_text],
```
```
[event].value('(data[@name="statement"]/value)[1]', 'nvarchar(MAX)') AS [statement],
```
```
[event].value('(data[@name="error_number"]/value)[1]', 'bigint') AS [error_number],
```
```
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