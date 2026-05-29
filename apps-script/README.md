# Apps Script

This folder contains the Google Apps Script web app used by the scheduler.

Use `Code.gs` as a spreadsheet-bound Apps Script.
It reads and writes the first sheet in the active spreadsheet: `SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]`.

Expected sheet headers:

```text
name, shop, registrant, duration, slots, updatedAt
```

If an old `dayType` column exists, `Code.gs` removes it from the first sheet on startup because the app no longer uses weekday/weekend data.

Do not commit local clasp credentials. `Code.gs` is ignored by git in this repo in case local deployment details are added later.
