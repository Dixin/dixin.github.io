---
title: "Confirmed by Microsoft: Cannot Install HD Audio Driver On Windows Server 2003 SP2 / R2"
published: 2007-10-14
description: "On Winodws Server 2003 SP2 / R2, HD (High Definition) audio driver cannot be installed. This happens for both 32 bit and 64 bit versions of Windows."
image: ""
tags: ["Hardware", "Windows"]
category: "Windows"
draft: false
lang: ""
---

On Winodws Server 2003 SP2 / R2, HD (High Definition) audio driver cannot be installed. This happens for both 32 bit and 64 bit versions of Windows.

Windows XP SP2 also has problem with HD audio. It can be resolved by installing the famous UAA (Universal Audio Architecture) fix [KB888111](http://support.microsoft.com/kb/888111/en-us). For Winodws Server 2003 SP1, just install the corresponding KB901105. However neither KB888111 nor KB901105 can be installed on Winodws Server 2003 SP2 / R2.

I search the Web. It is said that this way might work: On Windows Server 2003 SP1, install KB901105, then install HD audio driver, then install SP2. The problem is, my installer is R2, which integrates SP2 and cannot rollback to SP1.

I called Microsoft China (+86-800-820-3800) for support, the support engineer went and asked the author of KB888111. After several days, and the final answer is confirmed: no solution.

This problem does not exist in Windows Vista / Windows Server 2008.