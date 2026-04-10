# slot_money
AE 大獎數字計數器產生器 (AE Image Counter Generator)

這是一個為 Adobe After Effects 撰寫的自動化腳本 (ExtendScript)。它可以幫助動態設計師快速將「自訂的 0~9 數字圖片與逗號圖片」自動綁定成一個可以平滑跳動的計數器 (Counter)，
特別適合用在老虎機大獎、遊戲結算畫面或任何需要客製化數字字體的專案中。

✨ 核心功能 (Features)

全自動排版與置中：自動計算各個位數與逗號的總寬度，並完美置中於 1920x1080 畫面的正中央，節省大量手動對齊的時間。
自動隱藏開頭的零：具備智慧隱藏機制，當動畫在低位數跑動時（例如從 0 跑到 50），會自動將前面多餘的 0 和 逗號 隱藏，保持畫面乾淨。
自訂間距與秒數：可透過 UI 介面自由設定目標數字、動畫跑動秒數、數字間距與逗號間距。預設皆帶有平滑的緩速 (Ease In/Out) 效果。
靈活的素材對應：UI 介面支援手動輸入素材檔名，無縫接軌不同的專案素材命名習慣。

🚀 使用方法 (How to Use)

準備素材：
將你的 0~9 數字圖片以及逗號圖片匯入至 After Effects 專案面板中。
(預設檔名建議為 win_num_0.png ~ win_num_9.png 以及 win_num_Comma.png)

執行腳本：
在 AE 頂部選單選擇 File➔Scripts➔Run Script File，然後選擇本腳本 Image_Counter.jsx。

設定參數：
在彈出的 UI 視窗中設定：
目標數字 (預設: 12345)
跑動秒數 (預設: 3 秒)
間距設定 (預設數字間距 85px，逗號 30px)

確認下方圖層對應名稱與你專案面板中的素材名稱一致。

一鍵生成：
點擊「產生計數器 (Create Counter)」，腳本會自動為你建立所需的 Comp 與控制器！

🛠️ 架構與運作原理 (Under the Hood)

生成後，腳本會建立兩個主要的 Composition：

1,Digit_Precomp_Rig (素材整合 Comp)
將 0~9 及逗號依序排列在時間軸的 0~10 幀上。確保主場景只需調用單一 Comp，方便後續替換字體素材。

2.大獎計數器_Result (主場景 Comp)
生成一個名為 Controller_數字控制 的 Null 物件，並掛載 進度控制 Progress (%) 控制器 (已打好 0% 到 100% 的關鍵幀)。

所有位數圖層會綁定至該 Null，只需縮放或移動 Null 即可控制整體計數器的位置與大小。
圖層皆使用 Time Remapping (時間重映射) 與 Expressions (表達式)，即時讀取 Progress 進度來決定當下該顯示哪一個數字。
