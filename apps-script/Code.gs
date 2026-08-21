function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}

function properties_() {
  return PropertiesService.getScriptProperties();
}

function normalizedSecret_(value) {
  return String(value || "").trim();
}

function spreadsheet_(requestedId) {
  var configuredId = String(properties_().getProperty("SPREADSHEET_ID") || "").trim();
  if (!configuredId || String(requestedId || "").trim() !== configuredId) {
    throw new Error("Planilha não autorizada.");
  }
  return SpreadsheetApp.openById(configuredId);
}

function dispatch_(workbook, action, data) {
  if (action === "readSelected") return readSelected_(workbook, data);
  if (action === "appendRows") return appendRows_(workbook, data);
  if (action === "updateRow") return updateRow_(workbook, data);
  if (action === "ensureSchema") return ensureSchema_(workbook, data);
  throw new Error("Ação não permitida.");
}

function doGet() {
  return json_({ ok: true, service: "suape-sheets-bridge", version: "2.0.0" });
}

function doPost(e) {
  try {
    var request = JSON.parse((e.postData && e.postData.contents) || "{}");
    var expectedSecret = normalizedSecret_(properties_().getProperty("API_SECRET"));
    var receivedSecret = normalizedSecret_(request.secret);
    if (!expectedSecret || receivedSecret !== expectedSecret) throw new Error("Acesso não autorizado.");
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
