---
title: "Attach SQL Server 2000 database to SQL Server 2014"
published: 2015-04-10
description: "In the , the  is used. It"
image: ""
tags: ["SQL Server", "TSQL"]
category: "SQL Server"
draft: false
lang: ""
---

In the [MSDN introduction for LINQ to SQL](https://msdn.microsoft.com/en-us/library/bb399398.aspx), the [Northwind sample database](https://msdn.microsoft.com/en-us/library/bb399411.aspx) is used. It is a 15 years old database for SQL Server 2000. After [downloading](http://go.microsoft.com/fwlink?linkid=64296) the database files, it cannot be [attached](https://msdn.microsoft.com/en-us/library/ff851969\(v=vs.110\).aspx) to the latest SQL Server 2014 or 2016. trying to do so results an error:

> Database 'Northwind' cannot be upgraded because its non-release version (539) is not supported by this version of SQL Server. You cannot open a database that is incompatible with this version of sqlservr.exe. You must re-create the database.

The reason is, only the previous 2 version is supported to a SQL Server. For SQL Server 2014, this means only SQL Server 2008/2008R2 and 2012 database can be attached/restored. Northwind is a SQL Server 2000 database (version 539) so it does not work. There are 2 options to resolve this problem.

## Use SQL Server 2008

Since SQL Server 2000/2005 database is supported in SQL Server 2008. The Northwind database can be [attached](https://msdn.microsoft.com/en-us/library/ms176061.aspx) to a SQL Server 2008:
```
USE master;
GO
CREATE DATABASE [Northwind] ON PRIMARY 
    (FILENAME = N'D:\SqlServer\SQL Server 2000 Sample Databases\NORTHWND.MDF')
LOG ON 
    (FILENAME = N'D:\SqlServer\SQL Server 2000 Sample Databases\NORTHWND.LDF')
FOR ATTACH;
GO
```

or just:
```
USE master;
GO
CREATE DATABASE [Northwind] ON 
    (FILENAME = N'D:\SqlServer\SQL Server 2000 Sample Databases\NORTHWND.MDF'), 
    (FILENAME = N'D:\SqlServer\SQL Server 2000 Sample Databases\NORTHWND.LDF') 
FOR ATTACH;
GO
```

The database version will be upgraded from 539 to 655:

> Converting database 'Northwind' from version 539 to the current version 655. Database 'Northwind' running the upgrade step from version 539 to version 551. Database 'Northwind' running the upgrade step from version 551 to version 552. Database 'Northwind' running the upgrade step from version 552 to version 611. Database 'Northwind' running the upgrade step from version 611 to version 621. Database 'Northwind' running the upgrade step from version 621 to version 622. Database 'Northwind' running the upgrade step from version 622 to version 625. Database 'Northwind' running the upgrade step from version 625 to version 626. Database 'Northwind' running the upgrade step from version 626 to version 627. Database 'Northwind' running the upgrade step from version 627 to version 628. Database 'Northwind' running the upgrade step from version 628 to version 629. Database 'Northwind' running the upgrade step from version 629 to version 630. Database 'Northwind' running the upgrade step from version 630 to version 631. Database 'Northwind' running the upgrade step from version 631 to version 632. Database 'Northwind' running the upgrade step from version 632 to version 633. Database 'Northwind' running the upgrade step from version 633 to version 634. Database 'Northwind' running the upgrade step from version 634 to version 635. Database 'Northwind' running the upgrade step from version 635 to version 636. Database 'Northwind' running the upgrade step from version 636 to version 637. Database 'Northwind' running the upgrade step from version 637 to version 638. Database 'Northwind' running the upgrade step from version 638 to version 639. Database 'Northwind' running the upgrade step from version 639 to version 640. Database 'Northwind' running the upgrade step from version 640 to version 641. Database 'Northwind' running the upgrade step from version 641 to version 642. Database 'Northwind' running the upgrade step from version 642 to version 643. Database 'Northwind' running the upgrade step from version 643 to version 644. Database 'Northwind' running the upgrade step from version 644 to version 645. Database 'Northwind' running the upgrade step from version 645 to version 646. Database 'Northwind' running the upgrade step from version 646 to version 647. Database 'Northwind' running the upgrade step from version 647 to version 648. Database 'Northwind' running the upgrade step from version 648 to version 649. Database 'Northwind' running the upgrade step from version 649 to version 650. Database 'Northwind' running the upgrade step from version 650 to version 651. Database 'Northwind' running the upgrade step from version 651 to version 652. Database 'Northwind' running the upgrade step from version 652 to version 653. Database 'Northwind' running the upgrade step from version 653 to version 654. Database 'Northwind' running the upgrade step from version 654 to version 655.

Then call [sp\_detach\_db](https://msdn.microsoft.com/en-us/library/ms188031.aspx) to detach from SQL Server 2008:
```
USE master;
GO
EXEC sp_detach_db @dbname = N'Northwind', @skipchecks = N'true';
GO
```

Now NORTHWND.MDF can be attached to SQL Server 2014 successfully:

> Converting database 'Northwind' from version 655 to the current version 782. Database 'Northwind' running the upgrade step from version 655 to version 668. Database 'Northwind' running the upgrade step from version 668 to version 669. Database 'Northwind' running the upgrade step from version 669 to version 670. Database 'Northwind' running the upgrade step from version 670 to version 671. Database 'Northwind' running the upgrade step from version 671 to version 672. Database 'Northwind' running the upgrade step from version 672 to version 673. Database 'Northwind' running the upgrade step from version 673 to version 674. Database 'Northwind' running the upgrade step from version 674 to version 675. Database 'Northwind' running the upgrade step from version 675 to version 676. Database 'Northwind' running the upgrade step from version 676 to version 677. Database 'Northwind' running the upgrade step from version 677 to version 679. Database 'Northwind' running the upgrade step from version 679 to version 680. Database 'Northwind' running the upgrade step from version 680 to version 681. Database 'Northwind' running the upgrade step from version 681 to version 682. Database 'Northwind' running the upgrade step from version 682 to version 683. Database 'Northwind' running the upgrade step from version 683 to version 684. Database 'Northwind' running the upgrade step from version 684 to version 685. Database 'Northwind' running the upgrade step from version 685 to version 686. Database 'Northwind' running the upgrade step from version 686 to version 687. Database 'Northwind' running the upgrade step from version 687 to version 688. Database 'Northwind' running the upgrade step from version 688 to version 689. Database 'Northwind' running the upgrade step from version 689 to version 690. Database 'Northwind' running the upgrade step from version 690 to version 691. Database 'Northwind' running the upgrade step from version 691 to version 692. Database 'Northwind' running the upgrade step from version 692 to version 693. Database 'Northwind' running the upgrade step from version 693 to version 694. Database 'Northwind' running the upgrade step from version 694 to version 695. Database 'Northwind' running the upgrade step from version 695 to version 696. Database 'Northwind' running the upgrade step from version 696 to version 697. Database 'Northwind' running the upgrade step from version 697 to version 698. Database 'Northwind' running the upgrade step from version 698 to version 699. Database 'Northwind' running the upgrade step from version 699 to version 700. Database 'Northwind' running the upgrade step from version 700 to version 701. Database 'Northwind' running the upgrade step from version 701 to version 702. Database 'Northwind' running the upgrade step from version 702 to version 703. Database 'Northwind' running the upgrade step from version 703 to version 704. Database 'Northwind' running the upgrade step from version 704 to version 705. Database 'Northwind' running the upgrade step from version 705 to version 706. Database 'Northwind' running the upgrade step from version 706 to version 770. Database 'Northwind' running the upgrade step from version 770 to version 771. Database 'Northwind' running the upgrade step from version 771 to version 772. Database 'Northwind' running the upgrade step from version 772 to version 773. Database 'Northwind' running the upgrade step from version 773 to version 774. Database 'Northwind' running the upgrade step from version 774 to version 775. Database 'Northwind' running the upgrade step from version 775 to version 776. Database 'Northwind' running the upgrade step from version 776 to version 777. Database 'Northwind' running the upgrade step from version 777 to version 778. Database 'Northwind' running the upgrade step from version 778 to version 779. Database 'Northwind' running the upgrade step from version 779 to version 780. Database 'Northwind' running the upgrade step from version 780 to version 781. Database 'Northwind' running the upgrade step from version 781 to version 782.

Finally, Northwind database is upgraded from version 539 to 782.

## Execute instnwnd.sql

The downloaded sample database files also includes an instnwnd.sql installation script. [Executing the script](https://msdn.microsoft.com/en-us/library/8b6y4c7s.aspx) in SQL Server 2014 also results an error:

> Could not find stored procedure 'sp\_dboption'.

[sp\_dboption](https://msdn.microsoft.com/en-us/library/ms187310.aspx) is used at line 24 and 25:
```
exec sp_dboption 'Northwind','trunc. log on chkpt.','true'
exec sp_dboption 'Northwind','select into/bulkcopy','true'
GO
```

It is deprecated since SQL Server 2012. In SQL Server 2012/2014, [ALTER DATABASE](https://msdn.microsoft.com/en-us/library/bb522682.aspx) should be used. These 2 lines are equivalent to:
```
-- exec sp_dboption 'Northwind','trunc. log on chkpt.','true'
ALTER DATABASE Northwind SET RECOVERY SIMPLE
-- exec sp_dboption 'Northwind','select into/bulkcopy','true'
ALTER DATABASE Northwind SET RECOVERY BULK_LOGGED
GO
```

After the replacement, instnwnd.sql can execute successfully.