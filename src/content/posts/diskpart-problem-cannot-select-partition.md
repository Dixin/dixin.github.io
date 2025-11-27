---
title: "DiskPart Problem: Cannot Select Partition"
published: 2016-01-19
description: "When working with USB drive, the DiskPart command cannot select the partition of the USB disk:"
image: ""
tags: ["Storage", "Windows"]
category: "Windows"
draft: false
lang: ""
---

When working with USB drive, the DiskPart command cannot select the partition of the USB disk:

> C:\\Users\\Administrator>diskpart
> 
> Microsoft DiskPart version 6.1.7601 Copyright (C) 1999-2008 Microsoft Corporation. On computer: DIXINYAN-M17X
> 
> DISKPART> list disk
> 
> Disk ### Status Size Free Dyn Gpt -------- ------------- ------- ------- --- --- Disk 0 Online 931 GB 3072 KB Disk 1 Online 3726 GB 0 B \* Disk 2 Online 1901 MB 0 B
> 
> DISKPART> select disk 2
> 
> Disk 2 is now the selected disk.

Disk 2 is a USD drive, select it:

> DISKPART> list part
> 
> Partition ### Type Size Offset ------------- ---------------- ------- ------- \* Partition 1 Primary 1901 MB 0 B
> 
> DISKPART> select part 1
> 
> There is no partition selected.

Somehow the partition cannot be selected and manipulated. After searching around, it seems the only solution to to recreate the partition with DiskPart:

> DISKPART> clean
> 
> DiskPart succeeded in cleaning the disk.
> 
> DISKPART> create part primary
> 
> DiskPart succeeded in creating the specified partition.
> 
> DISKPART> list part
> 
> Partition ### Type Size Offset ------------- ---------------- ------- ------- \* Partition 1 Primary 1901 MB 64 KB

Now Partition 1 can be selected:

> DISKPART> select part 1
> 
> Partition 1 is now the selected partition.
> 
> DISKPART> active
> 
> DiskPart marked the current partition as active.
> 
> DISKPART> format fs=fat32 quick
> 
> 100 percent completed
> 
> DiskPart successfully formatted the volume.