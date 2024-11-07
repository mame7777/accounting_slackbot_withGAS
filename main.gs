const doPost = e => {
  // checkAuthentication(e);

  const commandType = e.parameter.command
  const command = e.parameter.text;
  
  let returnMessage = ""
  switch ( commandType ) {
    case '/add':
      returnMessage = addData(command.trim());
      break;
    case '/list':
      returnMessage = showData();
      break;
    default:
      returnMessage = "コマンドが違うよ...:ぴえん:";
  }

  /* メッセージ返却 */
  const response = { text: returnMessage };
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);

}

const checkAuthentication = e => {
  const verificationToken = PropertiesService.getScriptProperties().getProperty("SLACK_VERIFICATION_TOKEN");

  if (verificationToken != e.parameter.token) {
    throw new Error('Invalid token');
  }
}

function slackPostChannel(message, channelId = "") {
  const token = PropertiesService.getScriptProperties().getProperty("BOT_AUTH_TOKEN")
  const channel = (channelId === "") ? PropertiesService.getScriptProperties().getProperty("CHANNEL_NAME") : channelId
  const message_options = {
    "method": "post",
    "contentType": "application/x-www-form-urlencoded",
    "payload": {
      "token": token,
      "channel": channel,
      "text": message
    }
  };

  UrlFetchApp.fetch("https://slack.com/api/chat.postMessage", message_options);
}

function addData(command) {
  const input = command.replace(/　/g, " ").split(" ");
  if (input.length != 3) {
    return "コマンド引数の数がおかしいよ...:ぴえん:"
  }

  const spreadSheetId = PropertiesService.getScriptProperties().getProperty("SPREAD_SHEET_ID");
  const spreadSheet = SpreadsheetApp.openById(spreadSheetId);

  // ユーザー一覧を取得
  const userArray = [];
  let spreadSheetSheetName = PropertiesService.getScriptProperties().getProperty("SPREAD_SHEET_SHEET_NAME_USER");
  let sheet = spreadSheet.getSheetByName(spreadSheetSheetName);
  let row = sheet.getLastRow();
  for (i=1; i<=row; i++) {
    userArray.push(sheet.getRange(i,1).getValue());
  };

  // ユーザーが存在するか確認
  if (!(userArray.includes(input[0]))) {
    return "1人目のユーザーが存在しないよ...:ぴえん:"
  }
  if (!(userArray.includes(input[1]))) {
    return "1人目のユーザーが存在しないよ...:ぴえん:"
  }

  // 金額を確認
  const money = Number.parseFloat(input[2])
  if (isNaN(money)) {
    return "金額がおかしいよ...:ぴえん:"
  }

  const today = new Date();
  const todayStr = Utilities.formatDate(today, 'JST', 'yyyy-MM-dd HH:mm:ss');
  
  // 情報登録
  spreadSheetSheetName = PropertiesService.getScriptProperties().getProperty("SPREAD_SHEET_SHEET_NAME_MONEY");
  sheet = spreadSheet.getSheetByName(spreadSheetSheetName);
  row = sheet.getLastRow() + 1;
  sheet.getRange(row, 1).setValue(todayStr);
  sheet.getRange(row, 2).setValue(input[0]);
  sheet.getRange(row, 3).setValue(input[1]);
  sheet.getRange(row, 4).setValue(money);

  print_message = `${input[0]}が${input[1]}に${money}円かしたよ！`
  slackPostChannel(print_message)
  const ok_message = "ok!";
  return ok_message;
}

function showData() {
  const spreadSheetId = PropertiesService.getScriptProperties().getProperty("SPREAD_SHEET_ID");
  const spreadSheetSheetName = PropertiesService.getScriptProperties().getProperty("SPREAD_SHEET_SHEET_NAME_SUM");
  const sheet = SpreadsheetApp.openById(spreadSheetId).getSheetByName(spreadSheetSheetName);

  const data = sheet.getRange("A2:B3").getValues();
  const message = `${data[0][0]}: ${data[0][1]}\n${data[1][0]}: ${data[1][1]}`;
  slackPostChannel(message);
  return "ok!"
}
