---
title: "Configure Git for Visual Studio 2015"
published: 2016-03-03
description: "After installing , the initial Git configurations can be viewed with git config –list:"
image: ""
tags: ["Git", "GitHub", "Visual Studio"]
category: "Git"
draft: false
lang: ""
---

After installing [Git](https://git-scm.com/download/win), the initial Git configurations can be viewed with git config –list:

> core.symlinks=false core.autocrlf=true color.diff=auto color.status=auto color.branch=auto color.interactive=true pack.packsizelimit=2g help.format=html http.sslcainfo=/bin/curl-ca-bundle.crt sendemail.smtpserver=/bin/msmtp.exe diff.astextplain.textconv=astextplain rebase.autosquash=true core.repositoryformatversion=0 core.filemode=false core.bare=false core.logallrefupdates=true core.symlinks=false core.ignorecase=true core.hidedotfiles=dotGitOnly remote.origin.url=[https://github.com/Dixin/CodeSnippets.git](https://github.com/Dixin/CodeSnippets.git) remote.origin.fetch=+refs/heads/\*:refs/remotes/origin/\* branch.master.remote=origin branch.master.merge=refs/heads/master

There is nothing for Visual Studio.

After installing [GitHub for Windows Desktop](https://desktop.github.com/), it provides 2 configurations for Visual Studio 2012 and 2013, but nothing for 2015:

> …
> 
> difftool.vs2012.cmd="c:/program files (x86)/microsoft visual studio 11.0/common7 /ide/devenv.exe" '//diff' "$LOCAL" "$REMOTE" difftool.vs2013.cmd="c:/program files (x86)/microsoft visual studio 12.0/common7 /ide/devenv.exe" '//diff' "$LOCAL" "$REMOTE"
> 
> …

The configurations for Visual Studio 2015 can be added to local repository/all repositories/all users with git config --edit –local/global/system:

```csharp
[diff]
    tool = vs2015
[difftool]
    prompt = true
[difftool "vs2015"]
    cmd = \"C:\\Program Files (x86)\\Microsoft Visual Studio 14.0\\Common7\\IDE\\vsdiffmerge.exe\" \"$LOCAL\" \"$REMOTE\" //t
    keepbackup = false
    trustexistcode = true
[merge]
    tool = vs2015
[mergetool]
    prompt = true
[mergetool "vs2015"]
    cmd = \"C:\\Program Files (x86)\\Microsoft Visual Studio 14.0\\Common7\\IDE\\vsdiffmerge.exe\" \"$REMOTE\" \"$LOCAL\" \"$BASE\" \"$MERGED\" //m
    keepbackup = false
    trustexistcode = true
```

After this, Git works correctly in Visual Studio 2015. The following is a screenshot of merging conflicts in Visual Studio 2015. The left panel is remote file, right panel is local file, and lower panel is merge result:

[![image](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/29e98b02b219_F192/image_thumb.png "image")](https://aspblogs.z22.web.core.windows.net/dixin/Windows-Live-Writer/29e98b02b219_F192/image_2.png)