// =============================================================================
// 🗺️ 2027 關西家族冒險手冊 — 獨立設定與行程資料檔 (trip-data.js)
// =============================================================================
// 💡 以後討論修改行程、增減天數、調整分組、改飯店或新增成員，
//    都只需要修改這個檔案，完全不會影響主程式 (index.html) 或酒館引擎 (tavern.js)！
// =============================================================================

window.TRIP_CONFIG = {
  // 1. 旅程基本資訊
  tripTitle: "2027 關西家族冒險手冊｜1/21 - 1/27",
  tripSubtitle: "2027/1/21 - 1/27",
  tripStartDate: "2027-01-21T00:00:00+08:00",
  tripYear: "2027",
  jpyToTwd: 0.215,
  criticalCheckIds: ["c1", "c2", "c3", "c5", "c6"],

  // 2. 🔥 跨裝置多人即時連線設定 (Firebase Realtime Database)
  firebaseConfig: {
    apiKey: "AIzaSyAuap2NHMM2cdFvezvcD7rjYusuomjMQCg",
    authDomain: "osaka-trip-2027-4279b.firebaseapp.com",
    databaseURL: "https://osaka-trip-2027-4279b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "osaka-trip-2027-4279b",
    storageBucket: "osaka-trip-2027-4279b.firebasestorage.app",
    messagingSenderId: "914880571912",
    appId: "1:914880571912:web:668c775ac609fcf9fb7fbd",
    measurementId: "G-61RBNPM9C7"
  },

  // 3. 👥 13 位家族成員資料（7 位大阪遠征團 ＋ 6 位台灣本營應援團）
  //    💡 要新增成員：複製其中一筆並修改 id、name、avatar/sprite/sheet，再於下方 tavernSpots 補站位即可。
  members: [
    {
      id: "yenting",
      name: "劉晏廷",
      en: "LIU YENTING",
      role: "勇者領隊",
      isCaptain: true,
      inOsakaTrip: true,
      avatar: "avatars/yenting.jpg",
      sprite: "sprites/yenting.gif",
      sheet: "sheets/yenting_4x4.png",
      quote: "「指南針與地圖都校準完畢，全隊出發攻略關西冬日副本！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI157 (12:45 ➔ 桃園 T2｜可託運 2 件 23kg)",
      day4Group: "自由彈性支援組（12:15 梅田會合）",
      day6Group: "🏺 看土偶／埴輪專線（堺市博物館＆百舌鳥八幡宮）"
    },
    {
      id: "chinghua",
      name: "劉慶華",
      en: "LIU CHINGHUA",
      role: "達摩武士",
      isCaptain: false,
      inOsakaTrip: true,
      avatar: "avatars/chinghua.jpg",
      sprite: "sprites/chinghua.gif",
      sheet: "sheets/chinghua_4x4.png",
      quote: "「勝尾寺的滿滿達摩與岸和田城，就交給我這位武士來探路吧！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI167 (11:45 ➔ 高雄)",
      day4Group: "🔴 勝尾寺滿滿達摩不倒翁專線（08:15 難波搭紅線往箕面萱野）",
      day6Group: "🏯 岸和田城＆岸城神社散步（臨空城搭南海電鐵 11 分鐘直達）"
    },
    {
      id: "naichi",
      name: "郭乃綺",
      en: "LIUKUO NAICHI",
      role: "購物狂戰士",
      isCaptain: false,
      inOsakaTrip: true,
      avatar: "avatars/naichi.jpg",
      sprite: "sprites/naichi.gif",
      sheet: "sheets/naichi_4x4.png",
      quote: "「偵測到前方高能藥妝與 Outlet 戰利品，戰鬥鏡片已鎖定目標！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI167 (11:45 ➔ 高雄)",
      day4Group: "🟡 輕鬆早餐 ➔ 12:15 梅田百貨會合",
      day6Group: "🛍️ 臨空城 Outlet ＆ 藥妝採買組"
    },
    {
      id: "tingyin",
      name: "郭亭吟",
      en: "KUO TINGYIN",
      role: "美食獵人",
      isCaptain: false,
      inOsakaTrip: true,
      avatar: "avatars/tingyin.jpg",
      sprite: "sprites/tingyin.gif",
      sheet: "sheets/tingyin_4x4.png",
      quote: "「從黑門市場烤干貝到伏見鰻魚飯，關西美食通通收入冒險圖鑑！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI167 (11:45 ➔ 高雄)",
      day4Group: "🟡 輕鬆早餐 ➔ 12:15 梅田百貨會合",
      day6Group: "🛍️ 臨空城 Outlet ＆ 藥妝採買組"
    },
    {
      id: "qinyan",
      name: "郭芩言",
      en: "KUO QINYAN",
      role: "千手觀音",
      isCaptain: false,
      inOsakaTrip: true,
      avatar: "avatars/qinyan.jpg",
      sprite: "sprites/qinyan.gif",
      sheet: "sheets/qinyan_4x4.png",
      quote: "「箭袋已滿、步調從容，這趟關西之旅也要優雅地滿載而歸！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI167 (11:45 ➔ 高雄)",
      day4Group: "🟡 輕鬆早餐 ➔ 12:15 梅田百貨會合",
      day6Group: "🛍️ 臨空城 Outlet ＆ 藥妝採買組"
    },
    {
      id: "qianyi",
      name: "郭粁邑",
      en: "KUO QIANYI",
      role: "吉伊卡哇騎士",
      isCaptain: false,
      inOsakaTrip: true,
      avatar: "avatars/qianyi.jpg",
      sprite: "sprites/qianyi.gif",
      sheet: "sheets/qianyi_4x4.png",
      quote: "「戴上吉伊卡哇髮夾與幸運藥水，錦市場迷你蜂蜜蛋糕我來了！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI167 (11:45 ➔ 高雄)",
      day4Group: "🟡 京都錦市場「ちいかわベビーカステラ」迷你蜂蜜蛋糕（09:05 出發，全店無現金支付！）",
      day6Group: "🛍️ 臨空城 Outlet ／ 🏺 土偶專線自由選"
    },
    {
      id: "chanchi",
      name: "郭粁圻",
      en: "KUO CHANCHI",
      role: "三麗鷗戰士",
      isCaptain: false,
      inOsakaTrip: true,
      avatar: "avatars/chanchi.jpg",
      sprite: "sprites/chanchi.gif",
      sheet: "sheets/chanchi_4x4.png",
      quote: "「背好冒險背包與凱蒂貓髮夾，出發收集最可愛的大阪戰利品！」",
      flightGo: "1/21 華航 CI176 (15:25 高雄 ➔ 19:10 關西)",
      flightBack: "1/27 華航 CI167 (11:45 ➔ 高雄)",
      day4Group: "🟡 京都錦市場「ちいかわベビーカステラ」迷你蜂蜜蛋糕（09:05 出發，全店無現金支付！）",
      day6Group: "🛍️ 臨空城 Outlet ／ 🏺 土偶專線自由選"
    },
    // --- 台灣本營應援團（6 位：無大阪行，但可瀏覽全員行程、定位與戰利品＆登記代購願望！） ---
    {
      id: "yanyi",
      name: "劉晏伊",
      en: "LIU YANYI",
      role: "留守軍師",
      isCaptain: false,
      inOsakaTrip: false,
      avatar: "avatars/yanyi.jpg",
      sprite: "sprites/yanyi.gif",
      sheet: "sheets/yanyi_4x4.png",
      quote: "「在台灣本營幫大家遠端應援！大阪的行程、定位與戰利品我都會隨時關注喔～」",
      flightGo: "本次未隨行大阪（台灣本營遠端應援）",
      flightBack: "歡迎使用寶箱許願伴手禮清單！",
      day4Group: "",
      day6Group: ""
    },
    {
      id: "beichen",
      name: "郭倍辰",
      en: "KUO BEICHEN",
      role: "本營應援長",
      isCaptain: false,
      inOsakaTrip: false,
      avatar: "avatars/beichen.jpg",
      sprite: "sprites/beichen.gif",
      sheet: "sheets/beichen_4x4.png",
      quote: "「雖然這次沒去大阪，但在酒館隨時追蹤你們的冒險動態，記得多買伴手禮回來！」",
      flightGo: "本次未隨行大阪（台灣本營遠端應援）",
      flightBack: "歡迎使用寶箱許願伴手禮清單！",
      day4Group: "",
      day6Group: ""
    },
    {
      id: "hongzhong",
      name: "陳鴻忠",
      en: "CHEN HONGZHONG",
      role: "港灣領航員",
      isCaptain: false,
      inOsakaTrip: false,
      avatar: "avatars/hongzhong.jpg",
      sprite: "sprites/hongzhong.gif",
      sheet: "sheets/hongzhong_4x4.png",
      quote: "「在高雄港灣遠端守候大家！祝關西遠征隊一路順風、平安滿載而歸！」",
      flightGo: "本次未隨行大阪（台灣本營遠端應援）",
      flightBack: "歡迎使用寶箱許願伴手禮清單！",
      day4Group: "",
      day6Group: ""
    },
    {
      id: "anghsien",
      name: "郭昂憲",
      en: "KUO ANGHSIEN",
      role: "機甲工匠",
      isCaptain: false,
      inOsakaTrip: false,
      avatar: "avatars/anghsien.jpg",
      sprite: "sprites/anghsien.gif",
      sheet: "sheets/anghsien_4x4.png",
      quote: "「工坊裝備都檢修完畢！大家在大阪盡情玩樂，後勤支援就交給本營吧！」",
      flightGo: "本次未隨行大阪（台灣本營遠端應援）",
      flightBack: "歡迎使用寶箱許願伴手禮清單！",
      day4Group: "",
      day6Group: ""
    },
    {
      id: "yiping",
      name: "陳依萍",
      en: "CHEN YIPING",
      role: "花田守護者",
      isCaptain: false,
      inOsakaTrip: false,
      avatar: "avatars/yiping.jpg",
      sprite: "sprites/yiping.gif",
      sheet: "sheets/yiping_4x4.png",
      quote: "「一月關西很冷要記得多穿點保暖喔！每天都會來酒館看看大家的冒險動態～」",
      flightGo: "本次未隨行大阪（台灣本營遠端應援）",
      flightBack: "歡迎使用寶箱許願伴手禮清單！",
      day4Group: "",
      day6Group: ""
    },
    {
      id: "jiahao",
      name: "吳家豪",
      en: "WU JIAHAO",
      role: "夜市美食家",
      isCaptain: false,
      inOsakaTrip: false,
      avatar: "avatars/jiahao.jpg",
      sprite: "sprites/jiahao.gif",
      sheet: "sheets/jiahao_4x4.png",
      quote: "「道頓堀跟黑門市場記得多拍點美食照回來，我在酒館隨時幫大家加油打氣！」",
      flightGo: "本次未隨行大阪（台灣本營遠端應援）",
      flightBack: "歡迎使用寶箱許願伴手禮清單！",
      day4Group: "",
      day6Group: ""
    }
  ],

  // 4. 🍺 3D 公會大酒館內每位成員的初始站位
  tavernSpots: {
    yenting:   { x:   0.0, z:  0.8, dir: "down" },
    chinghua:  { x: -10.5, z: -2.4, dir: "right" },
    naichi:    { x:  -4.2, z: -1.8, dir: "down" },
    tingyin:   { x: -10.2, z:  2.0, dir: "right" },
    qinyan:    { x:   0.0, z:  8.4, dir: "up" },
    qianyi:    { x:   4.2, z: -1.6, dir: "down" },
    chanchi:   { x:  11.4, z: -5.2, dir: "left" },
    yanyi:     { x:  -2.4, z: -6.6, dir: "down" },
    beichen:   { x:  11.8, z:  3.8, dir: "left" },
    hongzhong: { x:   3.4, z: -6.8, dir: "down" },
    anghsien:  { x:  -4.6, z:  8.2, dir: "up" },
    yiping:    { x:   4.8, z:  8.0, dir: "up" },
    jiahao:    { x:  12.6, z: -0.6, dir: "left" }
  },

  // 5. 🎒 預設隨身行李檢查清單
  defaultChecklist: [
    { id: "c1", text: "🛂 有效護照（確認效期大於 6 個月）", done: false },
    { id: "c2", text: "📱 Visit Japan Web 入境＆退稅 QR Code 截圖", done: false },
    { id: "c3", text: "💳 退稅綁定信用卡 ＋ 海外高回饋實體卡", done: false },
    { id: "c4", text: "💴 日圓現鈔（神社御守、市場小吃、寄物櫃用）", done: false },
    { id: "c5", text: "📶 日本 eSIM / 實體網卡（已確認開通方式）", done: false },
    { id: "c6", text: "🔋 行動電源 ＋ 充電線（⚠️ 務必放隨身手提，禁託運！）", done: false },
    { id: "c7", text: "🧥 1月關西防風保暖外套、圍巾、暖暖包", done: false },
    { id: "c8", text: "👟 好走的運動鞋（每天平均走 1.5 萬步）", done: false },
    { id: "c9", text: "💊 個人常備藥、腸胃藥、OK繃", done: false },
    { id: "c10", text: "🛍️ 摺疊購物袋（日本塑膠袋要收費）", done: false }
  ],

  // 6. 📅 7 天每日冒險行程與必帶裝備（討論改行程直接編輯這裡！）
  itineraryDays: [
    {
      day: 1,
      date: "1/21 (四)",
      title: "高雄出發 ➔ 關西機場 ➔ 入住日本橋",
      hotel: "日本橋 ASOBO 公寓（〒556-0005 日本橋 3-1-17）",
      items: ["🛂 護照", "📱 Visit Japan Web QR Code", "✈️ 華航 CI176 登機證", "💳 ICOCA / 西瓜卡"],
      photo: "avatars/day1_group.jpg",
      photoCaption: "✈️ 2027 關西家族冒險・7 位勇者出發大合照！",
      events: [
        { time: "12:25 - 12:55", desc: "高雄小港機場 (KHH 國際航廈 I) 華航櫃檯報到託運（每人 1 件 23kg）" },
        { time: "15:25 ➔ 19:10", desc: "搭乘中華航空 CI176 直飛大阪關西機場 (KIX 第 1 航廈)" },
        { time: "20:05 / 20:35", desc: "搭南海電鐵（特急 Rapi:t 或空港急行）至「南海難波站」，南口步行 7 分鐘" },
        { time: "21:15 - 21:30", desc: "入住 ASOBO OSAKA Nipponbashi 公寓，附近超市買隔天早餐與草莓" }
      ]
    },
    {
      day: 2,
      date: "1/22 (五)",
      title: "八阪神社 ➔ 黑門市場 ➔ 魔物獵人 ➔ 寶可夢 DX",
      hotel: "日本橋 ASOBO 公寓",
      items: ["🛂 護照（滿 ¥5,500 退稅用）", "💴 日圓現金（黑門市場小吃）", "📱 魔物獵人餐廳訂位紀錄", "🛍️ 環保購物袋"],
      events: [
        { time: "10:00 - 11:00", desc: "難波八阪神社（巨型獅子殿拍照，步行約 13 分鐘）" },
        { time: "11:15 - 12:15", desc: "黑門市場散步嚐鮮（烤干貝、海膽、水果，留肚子給午餐）" },
        { time: "12:30 - 14:00", desc: "🍖 午餐：魔物獵人餐廳「モンハン酒場 WEST」（道頓堀 Pasela 4F，限時 90 分）" },
        { time: "14:15 - 16:45", desc: "道頓堀 ➔ 心齋橋筋 ➔ 大丸心齋橋 9F「寶可夢中心 DX」＆ Jump Shop" },
        { time: "17:15 - 20:00", desc: "🎮 日本橋動漫電器街（Animate、壽屋、駿河屋 20:00 打烊先逛！）" },
        { time: "20:00 - 22:30", desc: "晚餐 ＆ 日本橋夾娃娃（GiGO / Taito Station / Namco）" }
      ]
    },
    {
      day: 3,
      date: "1/23 (六)",
      title: "京都奈良包車一日遊・若草山燒山祭 🎆（09:00 出發）",
      hotel: "日本橋 ASOBO 公寓",
      items: ["🧥 最強保暖衣物＋暖暖包（晚上奈良極冷）", "🔋 行動電源", "💴 參拜零錢＆小吃現金"],
      events: [
        { time: "09:00", desc: "🚐 大阪日本橋 ASOBO 公寓門口專車出發（10 人座海獅包車，浪速区日本橋 3-1-17）" },
        { time: "10:00 - 11:20", desc: "⛩️ 伏見稻荷大社（千本鳥居、參道旁有吉伊卡哇本舖伏見店）" },
        { time: "11:25 - 12:25", desc: "🍱 伏見鰻魚飯午餐（從神社直接步行 4 分鐘，京都市伏見区深草鈴塚町 2-2 1F，12:25 上車）" },
        { time: "12:50 - 14:30", desc: "🏯 清水寺（茶碗坂或高台寺下車減少爬坡）" },
        { time: "15:10 - 15:55", desc: "🌟 金閣寺（鹿苑寺）" },
        { time: "17:05 - 19:30", desc: "🎆 奈良若草山燒山祭（18:15 煙火、18:30 點火！交管需步行 25 分至春日野園地）" },
        { time: "19:30 - 20:45", desc: "🚗 專車返抵大阪日本橋 ASOBO 公寓門口" }
      ]
    },
    {
      day: 4,
      date: "1/24 (日)",
      title: "早鳥分組行動 ➔ 12:15 梅田百貨會合",
      hotel: "日本橋 ASOBO 公寓",
      useBranch: "day4Group",
      items: ["💳 ICOCA（儲值至少 ¥2,000）", "💳 信用卡/Apple Pay（錦市場吉伊卡哇全店無現金！）", "🛂 護照（梅田百貨退稅）"],
      events: [
        { time: "08:15 / 09:05", desc: "分組各自出發（詳細路線見上方你的專屬綠色任務框）" },
        { time: "12:15", desc: "🤝 全員於「大阪梅田站」會合吃午餐" },
        { time: "13:30 - 16:45", desc: "梅田百貨輕鬆逛：大丸梅田 13F（寶可夢中心＋Nintendo OSAKA 任天堂旗艦店＋航海王）、LUCUA、阪急百貨" }
      ]
    },
    {
      day: 5,
      date: "1/25 (一)",
      title: "日本環球影城 (USJ) — 已買妥 6 人份「一日門票＋快速通關 5：礦車＆賽車」！",
      hotel: "日本橋 ASOBO 公寓",
      items: ["🎟️ USJ 一日門票 QR Code (6張)", "⚡ 快速通關 5～礦車＆賽車～ QR Code (6張)", "📱 USJ 官方 APP", "🔋 滿電行動電源", "⏰ 11:45 / 12:45 華航線上報到提醒"],
      events: [
        { time: "07:00 ➔ 07:45", desc: "🎉 已有 10:50 超級任天堂世界保證入場快通，免搭 05:34 首班車！睡飽吃早餐再出門（⚠️ 禁帶外食與可伸縮自拍棒）" },
        { time: "07:45 ➔ 08:15", desc: "「近鐵日本橋站」搭阪神難波線至「西九條站」（11分）➔ 轉 JR 夢咲線抵「環球影城站」（5分）" },
        { time: "08:15 - 08:40", desc: "🛡️ 安檢＆刷一日門票 QR Code 入園（⚠️ 口袋清空放包包托盤，水壺/寶特瓶須手持舉高過頭過安檢門）" },
        { time: "08:40 - 10:40", desc: "🪄 【快通・不限時段】先去「哈利波特魔法世界」拍城堡、刷快通玩「哈利波特禁忌之旅™」" },
        { time: "⏰ 10:50 - 11:50", desc: "🏰 【快通・指定時段】準時刷快通進入「超級任天堂世界™」（⚠️ 離開園區即不可再進）" },
        { time: "⏰ 10:50 - 11:20", desc: "🏎️ 【快通・指定時段】瑪利歐賽車：庫巴的挑戰書™（Mario Kart: Koopa's Challenge™）" },
        { time: "⏰ 11:20 - 11:50", desc: "🦍 【快通・指定時段】咚奇剛的瘋狂礦車™（Mine Cart Madness™）➔ 玩完逛任天堂園區＆午餐" },
        { time: "11:45 / 12:45", desc: "📌 【重要】用手機辦理 1/27 華航回程線上網路報到（11:45 高雄組 CI167 ／ 12:45 桃園組 CI157）" },
        { time: "13:30 - 16:30", desc: "🦖 【快通・不限時段二選一 B】飛天翼龍 或 侏羅紀公園・乘船遊 ＋ 🕵️ 【快通・不限時段二選一 A】名偵探柯南 4-D 現場表演：星空下的寶石 或 太空幻想列車 ➔ 15:30~17:00 回日本橋休息" }
      ]
    },
    {
      day: 6,
      date: "1/26 (二)",
      title: "退房早午餐 ➔ 臨空城放行李 ➔ 三路解散 ➔ 溫泉",
      hotel: "臨空城 海茵娜溫泉度假村（〒598-0048）",
      useBranch: "day6Group",
      items: ["🧳 全部大件行李（10:00 退房）", "💴 ¥800 零錢/ICOCA（南海難波站寄物櫃）", "🛂 護照（Outlet/藥妝退稅）", "♨️ 換洗衣物（晚上泡泉州溫泉）"],
      events: [
        { time: "09:50 - 10:00", desc: "ASOBO 日本橋公寓退房 ➔ 走 7 分鐘到南海難波站寄放行李" },
        { time: "10:10 - 11:25", desc: "☕ 全員難波早午餐（丸福珈琲店 / 星乃珈琲店 / Komeda's）" },
        { time: "11:35 - 12:35", desc: "搭南海電鐵直達「臨空城站」➔ 先去「海茵娜度假村」免費寄放行李" },
        { time: "12:35 - 17:30", desc: "三路解散自由行動（見上方你的專屬分組路線）" },
        { time: "20:00 - 22:30", desc: "♨️ 免費泡「泉州溫泉」海景天然溫泉 ＋ 打包戰利品＆秤行李重量（退稅品不可拆封）" }
      ]
    },
    {
      day: 7,
      date: "1/27 (三)",
      title: "關西機場先刷 KIOSK 退稅機台 ➔ 平安返台",
      hotel: "溫暖的家 🇹🇼",
      items: ["🛂 護照", "📱 Visit Japan Web 退稅 QR Code", "🛍️ 所有未拆封退稅商品（先隨身推去刷機台）", "✈️ 華航電子登機證"],
      events: [
        { time: "08:30 ➔ 08:50", desc: "飯店退房 ➔ 臨空城站搭車 1 站（6 分鐘）抵達關西機場第 1 航廈" },
        { time: "08:55", desc: "🚨 【第一步】行李先別託運！先推去出境大廳「稅關 KIOSK 退稅機台」刷護照確認綠燈！" },
        { time: "11:45 起飛", desc: "✈️ 高雄組 6 人搭乘華航 CI167（14:25 抵達高雄小港機場）" },
        { time: "12:45 起飛", desc: "✈️ 桃園組 1 人（劉晏廷）搭乘華航 CI157（15:00 抵達桃園機場 T2）" }
      ]
    }
  ],

  // 7. 🧭 迷路求救頁一鍵導航據點（Google Maps 連結）
  sosPlaces: [
    {
      title: "🚉 南海難波車站 (Namba Sta.)",
      badge: "交通樞紐",
      badgeStyle: "",
      desc: "往返關西機場、臨空城、日本橋公寓最近大站",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Nankai+Namba+Station+Osaka&travelmode=transit",
      btnLabel: "🚶/🚆 導航去難波車站",
      btnClass: "sdv-btn-green"
    },
    {
      title: "🚉 大阪梅田車站 (Osaka-Umeda)",
      badge: "Day 4 會合點",
      badgeStyle: "",
      desc: "大丸梅田 13F 寶可夢/任天堂、阪急電車總站",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Osaka-Umeda+Station&travelmode=transit",
      btnLabel: "🚶/🚆 導航去梅田車站",
      btnClass: "sdv-btn-green"
    },
    {
      title: "🏠 Day 1~5 飯店：日本橋 ASOBO 公寓",
      badge: "1/21 - 1/26",
      badgeStyle: "background:#b86f09;",
      cardBorder: "var(--gold-deep)",
      desc: "📍 〒556-0005 大阪府大阪市浪速區日本橋 3-1-17<br/><span style=\"color:var(--ink-muted);\">ASOBO OSAKA Nipponbashi Apartment｜TEL: +81-6-6649-3888</span>",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=3-1-17+Nipponbashi,+Naniwa+Ward,+Osaka&travelmode=walking",
      btnLabel: "🏠 帶我回日本橋公寓",
      btnClass: "sdv-btn-gold"
    },
    {
      title: "♨️ Day 6 飯店：臨空城海茵娜溫泉度假村",
      badge: "1/26 - 1/27",
      badgeStyle: "background:var(--leaf-dark);",
      cardBorder: "var(--leaf-green)",
      desc: "📍 〒598-0048 大阪府泉佐野市臨空往來北 1-23<br/><span style=\"color:var(--ink-muted);\">Henn na Resort & Spa Kansai Airport｜TEL: +81-50-5210-5300</span>",
      mapUrl: "https://www.google.com/maps/dir/?api=1&destination=Henn+na+Resort+%26+Spa+Kansai+Airport&travelmode=transit",
      btnLabel: "♨️ 帶我回臨空城飯店",
      btnClass: "sdv-btn-gold"
    }
  ],

  // 8. ✈️ 退稅頁航班與訂位摘要
  flightNotes: [
    "<b>1/21 去程</b>：全體華航 <b>CI176</b>（15:25 高雄 ➔ 19:10 關西 T1）",
    "<b>1/27 回程（高雄組 6 人）</b>：華航 <b>CI167</b>（11:45 關西 ➔ 14:25 高雄）",
    "<b>1/27 回程（桃園組 1 人：劉晏廷）</b>：華航 <b>CI157</b>（12:45 關西 ➔ 15:00 桃園 T2，可託運 2 件 23kg）",
    "<b>1/25 環球影城票券（已開票 6 人份）</b>：KKday <code>26KK228734858</code>｜一日門票 × 6 張 ＋ 快速通關 5（礦車＆賽車）× 6 張（10:50 保證進瑪利歐）"
  ]
};
