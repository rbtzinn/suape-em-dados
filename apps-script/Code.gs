function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function properties_() {
  return PropertiesService.getScriptProperties();
}

function spreadsheet_(requestedId) {
  var configuredId = properties_().getProperty("SPREADSHEET_ID");
  if (!configuredId || requestedId !== configuredId) throw new Error("Planilha não autorizada.");
  return SpreadsheetApp.openById(configuredId);
}

function sheet_(workbook, name) {
  if (!name || !/^[A-Za-z0-9_]+$/.test(name)) throw new Error("Nome de aba inválido.");
  var sheet = workbook.getSheetByName(name);
  if (!sheet) throw new Error("Aba não encontrada: " + name);
  return sheet;
}

function readSelected_(workbook, data) {
  var names = Array.isArray(data.names) ? data.names : [];
  var result = {};
  names.forEach(function (name) {
    var sheet = sheet_(workbook, name);
    var lastRow = sheet.getLastRow();
    var lastColumn = sheet.getLastColumn();
    result[name] = lastRow && lastColumn
      ? sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues()
      : [];
  });
  return { workbook: result };
}

function appendRows_(workbook, data) {
  var rows = Array.isArray(data.rows) ? data.rows : [];
  if (!rows.length) return { appended: 0 };
  if (rows.length > 500 || !Array.isArray(rows[0]) || rows[0].length > 100) {
    throw new Error("Lote de escrita acima do limite.");
  }
  var width = rows[0].length;
  if (!width || rows.some(function (row) { return !Array.isArray(row) || row.length !== width; })) {
    throw new Error("Linhas com largura inconsistente.");
  }
  var sheet = sheet_(workbook, data.name);
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, width).setValues(rows);
  return { appended: rows.length };
}

function updateRow_(workbook, data) {
  var values = Array.isArray(data.values) ? data.values : [];
  var rowNumber = Number(data.rowNumber);
  if (rowNumber < 2 || !values.length || values.length > 100) throw new Error("Atualização inválida.");
  sheet_(workbook, data.name).getRange(rowNumber, 1, 1, values.length).setValues([values]);
  return { updated: 1 };
}

function ensureSchema_(workbook, data) {
  var definitions = Array.isArray(data.sheets) ? data.sheets : [];
  var created = [];
  var existing = [];
  definitions.forEach(function (definition) {
    var name = String(definition.name || "");
    var headers = Array.isArray(definition.headers) ? definition.headers : [];
    if (!/^[A-Za-z0-9_]+$/.test(name) || !headers.length || headers.length > 100) {
      throw new Error("Definição de aba inválida.");
    }
    var sheet = workbook.getSheetByName(name);
    if (!sheet) {
      sheet = workbook.insertSheet(name);
      created.push(name);
    } else {
      existing.push(name);
    }
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setBackground("#0B2239")
      .setFontColor("#FFFFFF")
      .setFontWeight("bold")
      .setWrap(true);
    sheet.setFrozenRows(1);
  });
  return { created: created, existing: existing };
}

function dispatch_(workbook, action, data) {
  if (action === "readSelected") return readSelected_(workbook, data);
  if (action === "appendRows") return appendRows_(workbook, data);
  if (action === "updateRow") return updateRow_(workbook, data);
  if (action === "ensureSchema") return ensureSchema_(workbook, data);
  throw new Error("Ação não permitida.");
}

function doGet() {
  return json_({ ok: true, service: "suape-sheets-bridge" });
}

function doPost(e) {
  try {
    var request = JSON.parse((e.postData && e.postData.contents) || "{}");
    var expectedSecret = properties_().getProperty("API_SECRET");
    if (!expectedSecret || request.secret !== expectedSecret) throw new Error("Acesso não autorizado.");
    var workbook = spreadsheet_(request.spreadsheetId);
    var action = String(request.action || "");
    var writeAction = action !== "readSelected";
    var lock = writeAction ? LockService.getScriptLock() : null;
    if (lock) lock.waitLock(30000);
    try {
      var result = dispatch_(workbook, action, request.data || {});
      if (writeAction) SpreadsheetApp.flush();
      return json_({ ok: true, result: result });
    } finally {
      if (lock) lock.releaseLock();
    }
  } catch (error) {
    return json_({ ok: false, error: String(error && error.message || error).slice(0, 240) });
  }
}
