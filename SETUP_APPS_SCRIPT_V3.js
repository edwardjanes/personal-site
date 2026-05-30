// Google Apps Script - Handles both reading and writing metrics data
// Deploy as "New deployment" > "Web app"

function doGet(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Find the header row
  let headerRow = -1;
  for (let i = 0; i < Math.min(data.length, 200); i++) {
    const rowStr = data[i].join('|').toLowerCase();
    if (rowStr.includes('investors approached') ||
        (rowStr.includes('cascade tasks completed') && rowStr.includes('weight') && rowStr.includes('sleep'))) {
      headerRow = i;
      break;
    }
  }

  if (headerRow === -1) {
    return ContentService.createTextOutput(JSON.stringify({error: "Header row not found"}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const headers = data[headerRow];
  const headerMap = {};
  for (let j = 0; j < headers.length; j++) {
    const h = headers[j] ? headers[j].toString().trim().toLowerCase() : '';
    headerMap[h] = j;
  }

  const json = [];
  for (let i = headerRow + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const firstCell = row[0] ? row[0].toString().trim() : '';

    if (!firstCell || firstCell.includes('Week') || firstCell.includes('Average') ||
        firstCell.includes('Target') || firstCell.includes('NO_HEADER') ||
        firstCell.includes('Belly') || firstCell === '| :-:') {
      continue;
    }

    let dateStr = '';
    if (row[1]) {
      const dateVal = row[1];
      try {
        dateStr = Utilities.formatDate(dateVal, SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'd/M/yy');
      } catch(e) {
        try {
          if (typeof dateVal.getDate === 'function') {
            const d = dateVal.getDate();
            const m = dateVal.getMonth() + 1;
            const y = dateVal.getFullYear() % 100;
            dateStr = d + '/' + m + '/' + y;
          } else {
            dateStr = dateVal.toString().trim();
          }
        } catch(e2) {
          dateStr = dateVal.toString().trim();
        }
      }
    }

    const obj = { day: firstCell, date: dateStr };

    for (const [headerKey, colIndex] of Object.entries(headerMap)) {
      const value = row[colIndex];

      if (headerKey.includes('focus') && !headerKey.includes('secondary') && !headerKey.includes('primary focus score')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.focus = num;
      }
      if (headerKey.includes('primary focus score')) {
        const num = parseFloat(value);
        if (!isNaN(num)) obj.primaryFocusScore = num;
      }
      if (headerKey.includes('secondary focus')) {
        const num = parseFloat(value);
        if (!isNaN(num)) obj.secondaryFocus = num;
      }
      if (headerKey.includes('primary focus start')) {
        const str = value ? value.toString().trim() : '';
        if (str) obj.primaryFocusStart = str;
      }
      if (headerKey.includes('primary focus end')) {
        const str = value ? value.toString().trim() : '';
        if (str) obj.primaryFocusEnd = str;
      }
      if (headerKey.includes('weight') && !headerKey.includes('belly')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.weight = num;
      }
      if (headerKey.includes('belly')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.belly = num;
      }
      if (headerKey.includes('side') && !headerKey.includes('secondary')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.side = num;
      }
      if (headerKey.includes('love handle')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.loveHandle = num;
      }
      if (headerKey.includes('fat') && !headerKey.includes('defecit')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.fat = num;
      }
      if (headerKey.includes('thin')) {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.thin = num;
      }
      if (headerKey === 'average') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.average = num;
      }
      if (headerKey.includes('steps')) {
        const num = parseFloat(value);
        if (!isNaN(num)) obj.steps = num;
      }
      if (headerKey.includes('sleep')) {
        let hours = parseFloat(value);
        if (isNaN(hours) && typeof value === 'string' && value.includes(':')) {
          const parts = value.split(':');
          hours = parseInt(parts[0]) + parseInt(parts[1])/60;
        }
        if (!isNaN(hours) && hours > 0) obj.sleep = parseFloat(hours.toFixed(2));
      }
      if (headerKey.includes('cascade tasks completed')) {
        const num = parseFloat(value);
        if (!isNaN(num)) obj.blocks = num;
      }
      if (headerKey.includes('investors')) {
        const num = parseFloat(value);
        if (!isNaN(num)) obj.investors = num;
      }
      if (headerKey === 'cals out') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.calsOut = num;
      }
      if (headerKey === 'cals in') {
        const num = parseFloat(value);
        if (!isNaN(num) && num > 0) obj.calsIn = num;
      }
      if (headerKey.includes('cal defecit')) {
        const str = value ? value.toString().replace(/,/g, '') : '';
        const num = parseFloat(str);
        if (!isNaN(num)) obj.calories = num;
      }
    }

    if (obj.date || obj.day) {
      json.push(obj);
    }
  }

  Logger.log('Returning ' + json.length + ' rows');
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    Logger.log('=== doPost START ===');
    const data = JSON.parse(e.postData.contents);
    Logger.log('Parsed data: ' + JSON.stringify(data));

    const sheet = SpreadsheetApp.getActiveSheet();
    Logger.log('Sheet name: ' + sheet.getName());
    Logger.log('Last row before: ' + sheet.getLastRow());

    const sheetData = sheet.getDataRange().getValues();
    Logger.log('Sheet data rows: ' + sheetData.length);

    // Find header row
    let headerRow = -1;
    for (let i = 0; i < Math.min(sheetData.length, 200); i++) {
      const rowStr = sheetData[i].join('|').toLowerCase();
      if (rowStr.includes('investors approached') ||
          (rowStr.includes('cascade tasks completed') && rowStr.includes('weight') && rowStr.includes('sleep'))) {
        headerRow = i;
        break;
      }
    }

    if (headerRow === -1) {
      return createResponse({success: false, error: "Header row not found"});
    }

    const headers = sheetData[headerRow];
    const headerMap = {};
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j] ? headers[j].toString().trim().toLowerCase() : '';
      headerMap[h] = j;
    }

    // Check if date already exists
    const dateStr = data.date; // Format: "01/04/2026" (D/M/YYYY)
    const incomingDateParts = dateStr.split('/');
    const incomingDay = parseInt(incomingDateParts[0]);
    const incomingMonth = parseInt(incomingDateParts[1]);
    const incomingYear = parseInt(incomingDateParts[2]);

    let existingRowIndex = -1;

    for (let i = headerRow + 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!row || row.length === 0) continue;

      if (!row[1]) continue; // No date in this row

      let rowDay, rowMonth, rowYear;
      try {
        const dateVal = row[1];
        rowDay = dateVal.getDate();
        rowMonth = dateVal.getMonth() + 1;
        rowYear = dateVal.getFullYear();
      } catch(e) {
        continue; // Skip rows with invalid dates
      }

      // Compare date components
      if (rowDay === incomingDay && rowMonth === incomingMonth && rowYear === incomingYear) {
        existingRowIndex = i;
        break;
      }
    }

    // Handle update vs. new row
    let newRow;

    if (existingRowIndex !== -1) {
      // Updating existing row - preserve all existing data
      Logger.log('Updating existing row at index: ' + existingRowIndex);
      newRow = sheetData[existingRowIndex].slice(); // Copy existing row
    } else {
      // Creating new row - fill with empty strings (should not happen per current logic)
      newRow = new Array(headers.length).fill('');
    }

    // Set day name
    const dateParts = data.date.split('/');
    const dateNum = parseInt(dateParts[0]);
    const monthNum = parseInt(dateParts[1]);
    const yearNum = 2000 + parseInt(dateParts[2]);
    const dateObj = new Date(yearNum, monthNum - 1, dateNum);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dateObj.getDay()];

    // Always set day name at column 0 (first column)
    newRow[0] = dayName;

    // Also set at 'day' header column if it exists (for redundancy)
    if (headerMap['day'] !== undefined && headerMap['day'] !== 0) {
      newRow[headerMap['day']] = dayName;
    }

    // Set date
    if (headerMap['date'] !== undefined) {
      newRow[headerMap['date']] = dateObj;
    }

    // Map and set data - only update fields provided in the request
    const fieldMap = {
      'weight': 'weight',
      'belly': 'belly',
      'side': 'side',
      'loveHandle': 'love handle',
      'fat': 'fat',
      'thin': 'thin',
      'average': 'average',
      'focus': 'focus (1-10)',
      'steps': 'steps',
      'sleep': 'sleep',
      'blocks': 'cascade tasks completed',
      'investors': 'investors approached',
      'calsIn': 'cals in',
      'calsOut': 'cals out',
      'calories': 'cal defecit',
      'primaryFocusScore': 'primary focus score',
      'secondaryFocus': 'secondary focus (1-10)',
      'primaryFocusStart': 'primary focus start',
      'primaryFocusEnd': 'primary focus end'
    };

    for (const [dataKey, headerKey] of Object.entries(fieldMap)) {
      if (data[dataKey] !== undefined && data[dataKey] !== null && data[dataKey] !== '') {
        for (let j = 0; j < headers.length; j++) {
          const h = headers[j] ? headers[j].toString().trim().toLowerCase() : '';
          if (h.includes(headerKey.toLowerCase())) {
            newRow[j] = data[dataKey];
            break;
          }
        }
      }
    }

    Logger.log('newRow length: ' + newRow.length);
    Logger.log('newRow sample: ' + newRow.slice(0, 5).join('|'));

    if (existingRowIndex !== -1) {
      const valueArray = newRow.map(v => v === '' ? '' : v);
      const range = sheet.getRange(existingRowIndex + 1, 1, 1, valueArray.length);
      Logger.log('Setting range: row ' + (existingRowIndex + 1) + ', cols 1-' + valueArray.length);
      range.setValues([valueArray]);
      Logger.log('Row updated successfully');
      return createResponse({success: true, message: "Data updated", dateStr: dateStr, rowIndex: existingRowIndex});
    } else {
      return createResponse({success: false, error: "Date not found in sheet. Please add the date to an existing row first.", dateStr: dateStr});
    }

  } catch(error) {
    return createResponse({success: false, error: error.toString()});
  }
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
