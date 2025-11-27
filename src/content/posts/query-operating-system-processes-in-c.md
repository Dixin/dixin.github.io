---
title: "Query Operating System Processes in C#"
published: 2016-04-02
description: ".NET framework provides some process APIs in  class. Only some basic information of process can be"
image: ""
tags: ["C#", "Process", "Windows", "WMI"]
category: "C#"
draft: false
lang: ""
---

.NET framework provides some process APIs in [System.Diagnostics.Process](https://msdn.microsoft.com/en-us/library/system.diagnostics.process.aspx) class. Only some basic information of process can be queried with these APIs. .NET does not have APIS for other information, for example, a process’s parent process/child processes. There are some options to query process informations, like performance counter, P/Invoke, etc. Querying [Win32\_Process](// https://msdn.microsoft.com/en-us/library/windows/desktop/aa394372.aspx) class of [WMI](https://en.wikipedia.org/wiki/Windows_Management_Instrumentation) could be an easier way.

The definition of Win32\_Process class can be translated to C# class:

```csharp
public partial class Win32Process
{
    public const string WmiClassName = "Win32_Process";
}
```

And these are all the properties:

```csharp
[DebuggerDisplay("Name = {Name}; Id = {ProcessId}")]
public partial class Win32Process
{
    public string Caption { get; }

    public string CommandLine { get; }

    public string CreationClassName { get; }

    public DateTime? CreationDate { get; }

    public string CSCreationClassName { get; }

    public string CSName { get; }

    public string Description { get; }

    public string ExecutablePath { get; }

    public ushort? ExecutionState { get; }

    public string Handle { get; }

    public uint? HandleCount { get; }

    public DateTime? InstallDate { get; }

    public ulong? KernelModeTime { get; }

    public uint? MaximumWorkingSetSize { get; }

    public uint? MinimumWorkingSetSize { get; }

    public string Name { get; }

    public string OSCreationClassName { get; }

    public string OSName { get; }

    public ulong? OtherOperationCount { get; }

    public ulong? OtherTransferCount { get; }

    public uint? PageFaults { get; }

    public uint? PageFileUsage { get; }

    public uint? ParentProcessId { get; }

    public uint? PeakPageFileUsage { get; }

    public ulong? PeakVirtualSize { get; }

    public uint? PeakWorkingSetSize { get; }

    public uint? Priority { get; }

    public ulong? PrivatePageCount { get; }

    public uint? ProcessId { get; }

    public uint? QuotaNonPagedPoolUsage { get; }

    public uint? QuotaPagedPoolUsage { get; }

    public uint? QuotaPeakNonPagedPoolUsage { get; }

    public uint? QuotaPeakPagedPoolUsage { get; }

    public ulong? ReadOperationCount { get; }

    public ulong? ReadTransferCount { get; }

    public uint? SessionId { get; }

    public string Status { get; }

    public DateTime? TerminationDate { get; }

    public uint? ThreadCount { get; }

    public ulong? UserModeTime { get; }

    public ulong? VirtualSize { get; }

    public string WindowsVersion { get; }

    public ulong? WorkingSetSize { get; }

    public ulong? WriteOperationCount { get; }

    public ulong? WriteTransferCount { get; }
}
```

This is much more information then .NET built-in Process class. It is tagged with \[[DebuggerDisplay](https://msdn.microsoft.com/en-us/library/ms228992.aspx)\] attribute to be friendly at debugging time:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Query-Operating-System-Processes-in-C_9DCE/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/Query-Operating-System-Processes-in-C_9DCE/image_2.png)

To query Win32\_Process class from WMI, the following Wmi.Query method can be defined:

```csharp
public static class Wmi
{
    public static ManagementObject[] Query(ObjectQuery objectQuery, ManagementScope managementScope = null)
    {
        Contract.Requires<ArgumentNullException>(objectQuery != null);

        using (ManagementObjectSearcher searcher = new ManagementObjectSearcher(
            managementScope ?? new ManagementScope(), // Default ManagementPath: \\.\root\cimv2.
            objectQuery)) // Default QueryLangauge: WQL.
        using (ManagementObjectCollection processes = searcher.Get())
        {
            return processes.OfType<ManagementObject>().ToArray();
        }
    }

    public static ManagementObject[] Query
        (string query, ManagementScope managementScope = null) => Query(new ObjectQuery(query), managementScope);
}
```

2 overloads are provided for Query method, one general version accepts a WMI ObjectQuery, the other accepts a string query. The string version will be used in the example in this post. The ManagementScope parameter will be useful, for example, when querying another computer. By default it is null, and the query will work in local machine.

The Query method returns general ManagementObject, which can be converted to a Win32Process object:

```csharp
public partial class Win32Process
{
    public Win32Process(ManagementObject process)
    {
        Contract.Requires<ArgumentNullException>(process != null);

        this.Caption = process[nameof(this.Caption)] as string;
        this.CommandLine = process[nameof(this.CommandLine)] as string;
        this.CreationClassName = process[nameof(this.CreationClassName)] as string;
        this.CreationDate =
            (process[nameof(this.CreationDate)] as string)?.Forward(ManagementDateTimeConverter.ToDateTime);
        this.CSCreationClassName = process[nameof(this.CSCreationClassName)] as string;
        this.CSName = process[nameof(this.CSName)] as string;
        this.Description = process[nameof(this.Description)] as string;
        this.ExecutablePath = process[nameof(this.ExecutablePath)] as string;
        this.ExecutionState = (ushort?)process[nameof(this.ExecutionState)];
        this.Handle = process[nameof(this.Handle)] as string;
        this.HandleCount = (uint?)process[nameof(this.HandleCount)];
        this.InstallDate =
            (process[nameof(this.InstallDate)] as string)?.Forward(ManagementDateTimeConverter.ToDateTime);
        this.KernelModeTime = (ulong?)process[nameof(this.KernelModeTime)];
        this.MaximumWorkingSetSize = (uint?)process[nameof(this.MaximumWorkingSetSize)];
        this.MinimumWorkingSetSize = (uint?)process[nameof(this.MinimumWorkingSetSize)];
        this.Name = process[nameof(this.Name)] as string;
        this.OSCreationClassName = process[nameof(this.OSCreationClassName)] as string;
        this.OSName = process[nameof(this.OSName)] as string;
        this.OtherOperationCount = (ulong?)process[nameof(this.OtherOperationCount)];
        this.OtherTransferCount = (ulong?)process[nameof(this.OtherTransferCount)];
        this.PageFaults = (uint?)process[nameof(this.PageFaults)];
        this.PageFileUsage = (uint?)process[nameof(this.PageFileUsage)];
        this.ParentProcessId = (uint?)process[nameof(this.ParentProcessId)];
        this.PeakPageFileUsage = (uint?)process[nameof(this.PeakPageFileUsage)];
        this.PeakVirtualSize = (ulong?)process[nameof(this.PeakVirtualSize)];
        this.PeakWorkingSetSize = (uint?)process[nameof(this.PeakWorkingSetSize)];
        this.Priority = (uint?)process[nameof(this.Priority)];
        this.PrivatePageCount = (ulong?)process[nameof(this.PrivatePageCount)];
        this.ProcessId = (uint?)process[nameof(this.ProcessId)];
        this.QuotaNonPagedPoolUsage = (uint?)process[nameof(this.QuotaNonPagedPoolUsage)];
        this.QuotaPagedPoolUsage = (uint?)process[nameof(this.QuotaPagedPoolUsage)];
        this.QuotaPeakNonPagedPoolUsage = (uint?)process[nameof(this.QuotaPeakNonPagedPoolUsage)];
        this.QuotaPeakPagedPoolUsage = (uint?)process[nameof(this.QuotaPeakPagedPoolUsage)];
        this.ReadOperationCount = (ulong?)process[nameof(this.ReadOperationCount)];
        this.ReadTransferCount = (ulong?)process[nameof(this.ReadTransferCount)];
        this.SessionId = (uint?)process[nameof(this.SessionId)];
        this.Status = process[nameof(this.Status)] as string;
        this.TerminationDate =
            (process[nameof(this.TerminationDate)] as string)?.Forward(ManagementDateTimeConverter.ToDateTime);
        this.ThreadCount = (uint?)process[nameof(this.ThreadCount)];
        this.UserModeTime = (ulong?)process[nameof(this.UserModeTime)];
        this.VirtualSize = (ulong?)process[nameof(this.VirtualSize)];
        this.WindowsVersion = process[nameof(this.WindowsVersion)] as string;
        this.WorkingSetSize = (ulong?)process[nameof(this.WorkingSetSize)];
        this.WriteOperationCount = (ulong?)process[nameof(this.WriteOperationCount)];
        this.WriteTransferCount = (ulong?)process[nameof(this.WriteTransferCount)];
    }
}
```

[](http://11011.net/software/vspaste)

Now it is to define methods to query process information from MWI:

```sql
public static partial class ProcessHelper
{
    public static IEnumerable<Win32Process> All
        (ManagementScope managementScope = null) => Wmi
            .Query($"SELECT * FROM {Win32Process.WmiClassName}", managementScope)
            .Select(process => new Win32Process(process));

    public static Win32Process ById
        (uint processId, ManagementScope managementScope = null) => Wmi
            .Query(
                $"SELECT * FROM {Win32Process.WmiClassName} WHERE {nameof(Win32Process.ProcessId)} = {processId}",
                managementScope)
            .Select(process => new Win32Process(process)).FirstOrDefault();

    public static IEnumerable<Win32Process> ByName
        (string name, ManagementScope managementScope = null) => Wmi
            .Query(
                $"SELECT * FROM {Win32Process.WmiClassName} WHERE {nameof(Win32Process.Name)} = '{name}'",
                managementScope)
            .Select(process => new Win32Process(process));
}
```

[](http://11011.net/software/vspaste)

The All method queries all processes in the specified ManagementScope. ById/ByName queries by process id/name.

Besides querying rich information of processes, with these methods it is easy to traverse the process tree. The following ParentProcess method queries the direct parent process, if there is one. And the AllParentProcesses method queries all the parent processes in the tree:

```csharp
public static partial class ProcessHelper
{
    public static Win32Process ParentProcess(uint childProcessId, ManagementScope managementScope = null)
        => ById(childProcessId)?.ParentProcessId?.Forward(parentProcessId => ById(parentProcessId));

    public static IEnumerable<Win32Process> AllParentProcess(
        uint childProcessId,
        ManagementScope managementScope = null)
    {
        Win32Process parentProcess =
            ById(childProcessId)?.ParentProcessId?.Forward(parentProcessId => ById(parentProcessId));
        return parentProcess == null
            ? Enumerable.Empty<Win32Process>()
            : Enumerable.Repeat(parentProcess, 1).Concat(parentProcess.ProcessId.HasValue
                ? AllParentProcess(parentProcess.ProcessId.Value)
                : Enumerable.Empty<Win32Process>());
    }
}
```

The following ChildProcesses method queries the direct child processes. And the AllChildProcesses method queries all child processes in the tree:

```sql
public static partial class ProcessHelper
{
    public static IEnumerable<Win32Process> ChildProcesses
        (uint parentProcessId, ManagementScope managementScope = null) => Wmi
            .Query(
                $"SELECT * FROM {Win32Process.WmiClassName} WHERE {nameof(Win32Process.ParentProcessId)} = {parentProcessId}",
                managementScope)
            .Select(process => new Win32Process(process));

    public static IEnumerable<Win32Process> AllChildProcesses
        (uint parentProcessId, ManagementScope managementScope = null)
    {
        IEnumerable<Win32Process> childProcesses = Wmi
            .Query(
                $"SELECT * FROM {Win32Process.WmiClassName} WHERE {nameof(Win32Process.ParentProcessId)} = {parentProcessId}",
                managementScope).Select(process => new Win32Process(process));
        return childProcesses.Concat(childProcesses.SelectMany(process => process.ProcessId.HasValue
            ? AllChildProcesses(process.ProcessId.Value, managementScope)
            : Enumerable.Empty<Win32Process>()));
    }
}
```

The [Wmi and Win32Process](https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Management) classes are uploaded to [GitHub](https://github.com/Dixin/CodeSnippets), so is the [ProcessHelper](https://github.com/Dixin/CodeSnippets/tree/master/Dixin/Diagnostics) class. The [unit tests](https://github.com/Dixin/CodeSnippets/tree/master/Dixin.Tests/Diagnostics) can be also found here.