// AE Image Counter Generator Script
// 適用於 0-9 圖片與逗號圖片的自動計數器綁定 (支援文字輸入對應與單一 Precomp TimeRemap 架構)

(function() {
    // 建立 UI 視窗
    var win = new Window("palette", "AE 大獎數字計數器產生器", undefined);
    win.orientation = "column";
    win.alignChildren = ["left", "top"];

    var panel = win.add("panel", undefined, "計數器設定 (Settings)");
    panel.orientation = "column";
    panel.alignChildren = ["left", "top"];
    panel.margins = 15;
    panel.spacing = 10;

    var grpSettings = panel.add("group");
    grpSettings.orientation = "row";
    
    var colLeft = grpSettings.add("group");
    colLeft.orientation = "column"; colLeft.alignChildren = ["right", "center"];
    var grpNum = colLeft.add("group"); grpNum.add("statictext", undefined, "目標數字:"); var inpNum = grpNum.add("edittext", undefined, "12345"); inpNum.characters = 10;
    var grpDur = colLeft.add("group"); grpDur.add("statictext", undefined, "跑動秒數:"); var inpDur = grpDur.add("edittext", undefined, "3"); inpDur.characters = 10;

    var colRight = grpSettings.add("group");
    colRight.orientation = "column"; colRight.alignChildren = ["right", "center"];
    var grpSpace = colRight.add("group"); grpSpace.add("statictext", undefined, "數字間距(px):"); var inpSpace = grpSpace.add("edittext", undefined, "85"); inpSpace.characters = 5;
    var grpComma = colRight.add("group"); grpComma.add("statictext", undefined, "逗號間距(px):"); var inpComma = grpComma.add("edittext", undefined, "30"); inpComma.characters = 5;

    // --- 修改：改為文字輸入框 ---
    function createTextInput(parentGrp, label, defaultText) {
        var grp = parentGrp.add("group");
        grp.add("statictext", undefined, label).preferredSize.width = 45;
        var inp = grp.add("edittext", undefined, defaultText);
        inp.preferredSize.width = 130;
        return inp;
    }

    var pnlMap = win.add("panel", undefined, "圖層對應設定 (手動輸入素材名稱)");
    pnlMap.orientation = "row";
    pnlMap.margins = 15;
    pnlMap.spacing = 20;

    var mapCol1 = pnlMap.add("group"); mapCol1.orientation = "column"; mapCol1.alignChildren = ["right", "center"];
    var mapCol2 = pnlMap.add("group"); mapCol2.orientation = "column"; mapCol2.alignChildren = ["right", "center"];

    var txtItems = [];
    txtItems[0] = createTextInput(mapCol1, "數字 0:", "win_num_0.png");
    txtItems[1] = createTextInput(mapCol1, "數字 1:", "win_num_1.png");
    txtItems[2] = createTextInput(mapCol1, "數字 2:", "win_num_2.png");
    txtItems[3] = createTextInput(mapCol1, "數字 3:", "win_num_3.png");
    txtItems[4] = createTextInput(mapCol1, "數字 4:", "win_num_4.png");
    txtItems[5] = createTextInput(mapCol1, "數字 5:", "win_num_5.png");

    txtItems[6] = createTextInput(mapCol2, "數字 6:", "win_num_6.png");
    txtItems[7] = createTextInput(mapCol2, "數字 7:", "win_num_7.png");
    txtItems[8] = createTextInput(mapCol2, "數字 8:", "win_num_8.png");
    txtItems[9] = createTextInput(mapCol2, "數字 9:", "win_num_9.png");
    txtItems[10] = createTextInput(mapCol2, "逗號 (,):", "win_num_Comma.png");

    var btn = win.add("button", undefined, "產生計數器 (Create Counter)", {name: "ok"});
    btn.size = [200, 30];

    // 點擊按鈕執行主程式
    btn.onClick = function() {
        var targetNum = parseInt(inpNum.text, 10);
        var duration = parseFloat(inpDur.text);
        var spacing = parseFloat(inpSpace.text);
        var commaSpacing = parseFloat(inpComma.text);

        if (isNaN(targetNum) || isNaN(duration) || isNaN(spacing) || isNaN(commaSpacing)) {
            alert("請輸入有效的數字格式！");
            return;
        }

        // 檢查並搜尋專案中的素材名稱
        var itemsMap = [];
        var missing = [];
        for (var i = 0; i <= 10; i++) {
            var searchName = txtItems[i].text.toLowerCase();
            if (searchName === "") {
                missing.push("第 " + i + " 項未填寫");
                continue;
            }
            
            var foundItem = null;
            for (var j = 1; j <= app.project.numItems; j++) {
                var projItem = app.project.item(j);
                if (projItem instanceof FootageItem || projItem instanceof CompItem) {
                    var itemName = projItem.name.toLowerCase();
                    var itemNameNoExt = itemName.split(".")[0];
                    if (itemName === searchName || itemNameNoExt === searchName) {
                        foundItem = projItem;
                        break;
                    }
                }
            }
            
            if (foundItem) {
                itemsMap.push(foundItem);
            } else {
                missing.push(txtItems[i].text);
            }
        }

        if (missing.length > 0) {
            alert("找不到以下素材名稱，請確認輸入是否正確 (不用打副檔名)：\n" + missing.join("\n"));
            return;
        }

        app.beginUndoGroup("Create Image Counter");
        createCounter(targetNum, duration, spacing, commaSpacing, itemsMap);
        app.endUndoGroup();
    };

    win.center();
    win.show();

    // 主邏輯
    function createCounter(targetNum, duration, spacing, commaSpacing, itemsMap) {

        var maxDigits = targetNum.toString().length;
        var compDuration = Math.max(duration + 2, 5); // 總長度預設為目標秒數 + 多留2秒緩衝

        // 1. 建立 0-9 數字與逗號的預編排 (CompB / Digit_Precomp_Rig)
        var compName = "Digit_Precomp_Rig";
        var digitPrecomp = null;
        for(var i=1; i<=app.project.numItems; i++) {
            if(app.project.item(i).name === compName && app.project.item(i) instanceof CompItem) {
                digitPrecomp = app.project.item(i);
                // 確保如果之前建立的太短，會自動拉長到目前的秒數
                if (digitPrecomp.duration < compDuration) {
                    digitPrecomp.duration = compDuration;
                }
                break;
            }
        }

        // 如果還沒有建過 CompB，則建立一個等同於跑動秒數長度的 Precomp
        if (!digitPrecomp) {
            var item0 = itemsMap[0];
            var w = item0.width || 100;
            var h = item0.height || 100;
            // 建立長度與主場景相等的 Comp (幀率 30fps)
            digitPrecomp = app.project.items.addComp(compName, w, h, 1, compDuration, 30);
            
            // 為了讓圖層面板像你的截圖一樣，圖層 1 是 0、圖層 2 是 1...
            // 我們從後面加回來，因為 AE layers.add 總是加在最上面 (Layer 1)
            for (var i = 10; i >= 0; i--) {
                var imgItem = itemsMap[i];
                var l = digitPrecomp.layers.add(imgItem);
                l.startTime = i * (1/30);
                l.outPoint = (i+1) * (1/30);
            }
        }

        // 3. 建立主場景 (CompA / Main Comp)
        var mainComp = app.project.items.addComp("大獎計數器_Result", 1920, 1080, 1, compDuration, 30);
        mainComp.openInViewer();

        // 4. 建立控制器 Null (Master Controller)
        var controller = mainComp.layers.addNull();
        controller.name = "Controller_數字控制";
        controller.property("ADBE Transform Group").property("ADBE Position").setValue([1920/2, 1080/2]);

        var sliderEffect = controller.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
        // 改名為 Progress，因為 AE Slider 有 1百萬 的限制，我們改用 0~100% 來控制進度
        sliderEffect.name = "進度控制 Progress (%)"; 
        var sliderProp = sliderEffect.property("ADBE Slider Control-0001");

        // 設定關鍵幀 (0 秒為 0%，指定秒數為 100%)
        sliderProp.setValueAtTime(0, 0);
        sliderProp.setValueAtTime(duration, 100);

        // 加入緩速 (Ease In/Out) 讓數字停下來時更平滑自然
        var easeIn = new KeyframeEase(0, 33.3);
        var easeOut = new KeyframeEase(0, 33.3);
        sliderProp.setTemporalEaseAtKey(2, [easeIn], [easeOut]);

        // 5. 計算排列位置 (從右到左排列，確保整體置中)
        var numCommas = Math.floor((maxDigits - 1) / 3);
        var totalWidth = (maxDigits * spacing) + (numCommas * commaSpacing);
        var currentX = (totalWidth / 2) - (spacing / 2); // 相對於 Null 中心點的本地座標
        var startY = 0; 

        // 6. 依序生成位數圖層 (全部都套用 CompB)
        for (var i = 0; i < maxDigits; i++) {

            // 遇到千分位，先插入代表「逗號」的 CompB 實例
            if (i > 0 && i % 3 === 0) {
                var cLayer = mainComp.layers.add(digitPrecomp);
                cLayer.name = "Comma_" + i;
                
                // ★ 必須先綁定給 Null，再給定相對坐標 (currentX, startY)，這樣數字才會完美置中
                cLayer.parent = controller; 
                cLayer.property("ADBE Transform Group").property("ADBE Position").setValue([currentX, startY]);
                
                // 開啟 Time Remap，並將幀數指定為 10 (即逗號的所在幀)
                cLayer.timeRemapEnabled = true;
                cLayer.property("ADBE Time Remapping").expression = "framesToTime(10);";
                
                // 表達式：數字未達此位數時，隱藏逗號。用 progress 計算避免 Slider 100萬限制
                var exprCommaOp = "var target = " + targetNum + ";\n" +
                                  "var progress = thisComp.layer('Controller_數字控制').effect('進度控制 Progress (%)')(1);\n" +
                                  "var val = Math.round(progress * (target / 100));\n" +
                                  "if (val < Math.pow(10, " + i + ")) 0; else 100;";
                cLayer.property("ADBE Transform Group").property("ADBE Opacity").expression = exprCommaOp;
                
                currentX -= commaSpacing;
            }

            // 插入代表「數字」的 CompB 實例
            var dLayer = mainComp.layers.add(digitPrecomp);
            dLayer.name = "Digit_10^" + i;

            // ★ 先綁定給 Null，再給定相對坐標
            dLayer.parent = controller; 
            dLayer.property("ADBE Transform Group").property("ADBE Position").setValue([currentX, startY]);
            
            // 開啟 Time Remap
            dLayer.timeRemapEnabled = true;

            // 表達式：讀取 0~100% 進度並算出目標數值。為防小數點計算誤差，轉為字串 (String) 提取字元
            var exprTR = "var target = " + targetNum + ";\n" +
                         "var progress = thisComp.layer('Controller_數字控制').effect('進度控制 Progress (%)')(1);\n" +
                         "var valStr = Math.max(0, Math.round(progress * (target / 100))).toString();\n" +
                         "var digit = 0;\n" +
                         "if (valStr.length > " + i + ") {\n" +
                         "  digit = parseInt(valStr[valStr.length - 1 - " + i + "], 10);\n" +
                         "}\n" +
                         "framesToTime(digit);";
            dLayer.property("ADBE Time Remapping").expression = exprTR;

            // 表達式：隱藏開頭多餘的 0
            var exprOp = "var target = " + targetNum + ";\n" +
                         "var progress = thisComp.layer('Controller_數字控制').effect('進度控制 Progress (%)')(1);\n" +
                         "var val = Math.round(progress * (target / 100));\n" +
                         "if (val < Math.pow(10, " + i + ") && " + i + " > 0) 0; else 100;";
            dLayer.property("ADBE Transform Group").property("ADBE Opacity").expression = exprOp;

            currentX -= spacing;
        }
    }
})();