/*
  Sora High enquiry receiver for Google Apps Script.

  1. Create a Google Sheet for enquiries and copy its ID from the URL.
  2. Replace the value below with that ID.
  3. Paste this file into script.google.com, then deploy as a Web app.
*/
const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Enquiries';

function doPost(e) {
  try {
    const enquiry = JSON.parse(e.postData.contents || '{}');
    const sheet = getSheet_();
    sheet.appendRow([
      new Date(),
      enquiry.name || '',
      enquiry.email || '',
      enquiry.trip || '',
      enquiry.timing || '',
      enquiry.group || '',
      enquiry.budget || '',
      enquiry.page || ''
    ]);
    return response_({ ok: true });
  } catch (error) {
    console.error(error);
    return response_({ ok: false, error: error.message });
  }
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Received at', 'Name', 'Email', 'Trip type', 'Travel timing', 'Group size', 'Budget', 'Page']);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function response_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
