/* =========================================================
   UniCV Caruaru — Pré-venda
   Backend do formulário (Google Apps Script → Google Sheets)

   Como publicar:
   1) Crie uma Planilha Google e abra Extensões → Apps Script.
   2) Cole este código, salve.
   3) Implantar → Nova implantação → Tipo: App da Web.
      - Executar como: Eu
      - Quem pode acessar: Qualquer pessoa
   4) Copie a URL (/exec) e cole em SHEET_URL no script.js.
   ========================================================= */

function doPost(e) {
  try {
    const dados    = JSON.parse(e.postData.contents);
    const planilha = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (planilha.getLastRow() === 0) {
      planilha.appendRow(["Data e Hora", "Nome", "E-mail", "Telefone", "Escolaridade"]);
      const h = planilha.getRange(1, 1, 1, 5);
      h.setFontWeight("bold");
      h.setBackground("#4f7129"); // verde UniCV
      h.setFontColor("#ffffff");
      planilha.setColumnWidth(1, 160);
      planilha.setColumnWidth(2, 220);
      planilha.setColumnWidth(3, 250);
      planilha.setColumnWidth(4, 180);
      planilha.setColumnWidth(5, 240);
      planilha.setFrozenRows(1);
    }

    const agora = Utilities.formatDate(new Date(), "America/Recife", "dd/MM/yyyy HH:mm:ss");

    planilha.appendRow([
      agora,
      dados.nome || "",
      dados.email || "",
      dados.telefone || "",
      dados.escolaridade || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "erro", mensagem: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput("UniCV Pré-venda — Sheets funcionando.");
}
