QQ-Telegram-IRC
===

[简体中文版](https://github.com/yangchuansheng/LilyWhiteBot/blob/master/README-hans.md)

在三個（或以上）群組間傳話的機器人。

## 如何安裝
目前支援QQ、Telegram和IRC三種群組互聯，不過亦可以選擇兩群互聯或三個以上群互聯。

### 必需步驟
* 根據實際需要準備機器人帳號（具體方法見後面）
* 安裝Node.js，版本要求：>=7.x
* 下載原始碼
* 執行
```
npm install
node main.js
```
* 如果擔心crash的話請直接寫個無窮迴圈，例如`while true; do node main.js; done`或者
```batch
:a
node main.js
goto a
```
* 根據實際需要修改 config.example.js，並改名為 config.js。
* QQ群格式`qq/QQ群號`；Telegram群格式`telegram/一串數字`（該數字可透過`/thisgroupid`取得，後面有說明，而且請注意該數字是**負數**；IRC頻道格式`irc/#頻道名`，別忘了`#`。

### 設定QQ機器人
1. 在正式啟用互聯之前，建議提前註冊一個QQ馬甲，掛機掛到一定等級，並往錢包裡塞一點錢，以減小被騰訊封殺的可能性。不過從實踐情況來看，只有一顆星或不塞錢也無妨。
2. **下載[酷Q](https://cqp.cc/)**，啟動一下以便完成安裝。
3. 進入[yukixz/cqsocketapi](https://github.com/yukixz/cqsocketapi/releases)，下載org.dazzyd.cqsocketapi.cpk，並放到酷Q的app目錄中。
4. 再次啟動酷Q，登入機器人帳號，然後在插件設定中啟用「cqsocket」。
5. 根據實際需要修改 badwords.example.js，並改名為 badwords.js。「敏感詞」功能僅對QQ機器人有效。
6. 請記得定期清除快取。
7. 因為目前沒做監控功能，所以還請自己盯一下酷Q的狀態。

注意：
1. 本程式需要酷Q Air/Pro和這個專門的cqsocketapi才能收發QQ群訊息。
2. 在伺服器執行程式時，酷Q會有很大機率要求你開啟QQ的設備鎖，因此註冊馬甲時請不要亂填電話號。
3. 酷Q模擬的是安卓QQ，而且QQ不允許多個手機同時登入。如果已經開啟酷Q，而且需要直接操作機器人帳號，請用電腦登入。
4. 酷Q是私有軟體，和我沒關係。
5. 酷Q可以透過wine在Linux/Mac系統中執行，可以參考[這篇教程](https://cqp.cc/t/30970)進行設定。

### 設定Telegram機器人
@BotFather，與其交互，按照熒幕提示進行操作，建立一個機器人帳號。設定完成後，BotFather會給一個Token，你需要把這個Token填到config.js中。

之後請記得執行`/setprivacy`命令，將機器人的私隱模式設為DISABLED以便於讓它看到群組內的訊息。

在剛開始的時候，可以保留config.js之內「plugins」中的「groupid-tg」，然後執行程式，並且在群組中輸入`/thisgroupid`，這樣機器人會自動給出群組ID以便設定互聯。如果沒看懂前面那句話，你也可以把@combot拉進群中，然後輸入`/stat`，看機器人給出的數字是多少。注意，數字是負數。

### 設定IRC機器人
IRC沒有什麼特別之處。如果你有Cloak，請在config.js中輸入正確的userName、sasl_password，並將sasl設為true。

## 提示

1. 如果把config.json中的`paeeye`設為`//`，那麼在訊息之前加入`//`（例如「//隱藏」）可防止被其他群組看見。
2. 如果允許IRC接受命令（plugins中有「irccommand」），那麼可在Telegram和QQ中使用`/command 命令`。該命令並非IRC命令，而是為配合IRC頻道中的機器人而設。
3. 如果允許查詢IRC的情況（plugins中有「ircquery」），那麼可在Telegram和QQ中使用`/names`（取得在線用戶清單）、`/whois 暱稱`（whois）和`/topic`（取得Topic）。
4. 「敏感詞」功能僅在QQ有效，而且僅對機器人自己「張嘴」有效。啟用之後，程式會自動把敏感詞清單中的詞語轉為「*」，可使用正規表示式。具體的政治敏感詞彙可參照中文維基百科「中華人民共和國審查辭彙列表」條目製作，本專案不再提供。詳情見badwords.example.js。

### 其他功能
以下各功能的設定方法均為改config.js。
* [filter](https://github.com/yangchuansheng/LilyWhiteBot/blob/master/plugins/filter.js)：過濾符合指定規則的訊息。
* [qqxiaoice](https://github.com/yangchuansheng/LilyWhiteBot/blob/master/plugins/qqxiaoice.js)：召喚QQ群的小冰（備註：需要QQ群群主開啟小冰/BabyQ功能）
