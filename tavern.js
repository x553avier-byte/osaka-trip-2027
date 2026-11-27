// =============================================================================
// 🍺 家族冒險公會大酒館 (Three.js HD-2D 豪華寬敞版 38 × 26)
// - 採用 AI 生成星露谷木地板貼圖 (textures/floor.jpg) ＋ 家族大合照壁畫 (avatars/day1_group.jpg)
// - 高精細像素繪製貼圖：半木拱窗牆面、石砌大壁爐、紅金羅盤地毯、魔藥吧檯架、冒險書櫃、日本作戰地圖桌、大阪城鳥居傳送門、公會寶箱台、盆栽松樹與懸掛暖光燈籠
// - 全手機友善操作：隱形浮動搖桿拖曳 ＋ 點地板自動走路 ＋ 點家人頭上冒 😊 微笑氣泡 ＋ 點設施自動互動
// - 無障礙椅子，走道寬敞氣派，9 位成員自在分佈
// =============================================================================
(function () {
  const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

  // 超寬敞公會大廳活動範圍 (38 x 26)
  const ROOM_BOUNDS = { minX: -16.4, maxX: 16.4, minZ: -10.2, maxZ: 10.6 };
  const OBSTACLES = [
    // 西側酒館大吧檯
    { minX: -17.5, maxX: -12.6, minZ: -5.8, maxZ: 4.8 },
    // 中央偏南「日本作戰地圖桌」（無椅子）
    { minX: -2.6, maxX: 2.6, minZ: 4.0, maxZ: 6.4 },
    // 西南角燭光長桌（無椅子）
    { minX: -10.2, maxX: -7.2, minZ: 4.8, maxZ: 6.8 },
    // 東南角燭光長桌（無椅子）
    { minX: 7.4, maxX: 10.4, minZ: 4.8, maxZ: 6.8 },
    // 公會寶箱展示台（西北方）
    { minX: -10.8, maxX: -8.6, minZ: -8.6, maxZ: -6.8 },
    // 四根大廳立柱
    { minX: -6.9, maxX: -5.7, minZ: -3.9, maxZ: -2.7 },
    { minX:  5.7, maxX:  6.9, minZ: -3.9, maxZ: -2.7 },
    { minX: -6.9, maxX: -5.7, minZ:  2.4, maxZ:  3.6 },
    { minX:  5.7, maxX:  6.9, minZ:  2.4, maxZ:  3.6 }
  ];

  // 13 位家族成員在 38×26 大廳裡的寬敞站位（每個人都有超大活動空間！）
  const DEFAULT_SPOTS = (window.TRIP_CONFIG && window.TRIP_CONFIG.tavernSpots) || {
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
  };

  // 酒館內可互動據點＆冒險傳送門（未來新增新旅遊場景只需在這裡加一筆）
  const INTERACTABLES = [
    {
      id: "portal-osaka",
      type: "adventure",
      title: "🏯 2027 大阪關西冒險",
      actionLabel: "🚪 進入 2027 大阪冒險",
      x: 9.2,
      z: -9.8,
      walkX: 9.2,
      walkZ: -8.2,
      radius: 3.0,
      trigger: () => { if (window.openOsakaPortalDialog) window.openOsakaPortalDialog(); }
    },
    {
      id: "portal-future",
      type: "future",
      title: "🧭 未來新冒險傳送陣",
      actionLabel: "✨ 查看未來冒險傳送陣",
      x: 15.6,
      z: -0.6,
      walkX: 14.2,
      walkZ: -0.6,
      radius: 2.8,
      trigger: () => { if (window.openFuturePortalDialog) window.openFuturePortalDialog(); }
    },
    {
      id: "board-guild",
      type: "board",
      title: "📜 公會情報佈告欄",
      actionLabel: "📋 閱讀公會佈告欄",
      x: -5.2,
      z: -9.8,
      walkX: -5.2,
      walkZ: -8.4,
      radius: 2.8,
      trigger: () => { if (window.openGuildBoardDialog) window.openGuildBoardDialog(); }
    },
    {
      id: "guild-chest",
      type: "chest",
      title: "🧰 冒險者戰利品寶箱",
      actionLabel: "🧰 開啟我的寶箱＆行李重量",
      x: -9.7,
      z: -7.7,
      walkX: -9.7,
      walkZ: -5.8,
      radius: 2.7,
      trigger: () => { if (window.switchTab) window.switchTab("loot"); }
    },
    {
      id: "map-table",
      type: "map",
      title: "🗺️ 關西遠征作戰地圖桌",
      actionLabel: "📅 查看大阪 7 日冒險行程",
      x: 0.0,
      z: 5.2,
      walkX: 0.0,
      walkZ: 3.1,
      radius: 3.0,
      trigger: () => { if (window.switchTab) window.switchTab("quest"); }
    },
    {
      id: "tavern-bar",
      type: "bar",
      title: "🍻 冒險者酒館吧檯",
      actionLabel: "🍺 跟酒館老闆打招呼",
      x: -12.0,
      z: -0.6,
      walkX: -11.4,
      walkZ: -0.6,
      radius: 2.7,
      trigger: () => { if (window.openTavernBarDialog) window.openTavernBarDialog(); }
    }
  ];

  let scene, camera, renderer, raycaster, floorMesh;
  let initialized = false;
  let isActiveTab = false;
  let lastFrameTime = performance.now();
  let elapsed = 0;

  let fireLight = null;
  let fireParticles = [];
  let chestSparkles = [];
  let candleFlames = [];
  let lanternLights = [];
  let osakaRing = null;
  let osakaCurtain = null;
  let futureRing = null;
  let targetMarker = null;

  const clickableMeshes = [];
  const actorMap = {};
  let currentPlayerId = "yenting";
  let remotePositions = {};
  let lastSyncSent = 0;

  const keys = { up: false, down: false, left: false, right: false };
  const joyVec = { x: 0, z: 0 };
  let activePointer = null;
  let walkGoal = null;
  let nearestTarget = null;
  let smileTexCache = null;

  // ===========================================================================
  // 高精細像素美術貼圖工具 (256x256 精繪貼圖 + AI 圖片載入)
  // ===========================================================================
  function makePixelCanvasTexture(w, h, drawFn, repeatX = 1, repeatY = 1) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    if (repeatX > 1 || repeatY > 1) {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeatX, repeatY);
    }
    return tex;
  }

  // 半木結構純淨牆面貼圖（不含窗戶，避免跟掛畫／壁爐／佈告欄重疊！）
  function createRichWallTexture() {
    return makePixelCanvasTexture(256, 128, (ctx, w, h) => {
      // 上部溫暖奶油灰泥牆（細膩微粒光影）
      ctx.fillStyle = "#ebd19f";
      ctx.fillRect(0, 0, w, 78);
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = i % 2 ? "rgba(175,120,58,0.11)" : "rgba(255,248,224,0.18)";
        ctx.fillRect((i * 37) % w, (i * 19) % 76, 4, 3);
      }

      // 頂部橫向與垂直深橡木結構樑
      ctx.fillStyle = "#4d2109";
      ctx.fillRect(0, 0, w, 12);
      ctx.fillStyle = "#85451a";
      ctx.fillRect(0, 2, w, 6);
      ctx.fillStyle = "#a85f2b";
      ctx.fillRect(0, 2, w, 2);

      // 垂直半木立柱＋斜木撐飾
      [0, 124, 244].forEach(bx => {
        ctx.fillStyle = "#451d07";
        ctx.fillRect(bx, 0, 12, h);
        ctx.fillStyle = "#7a3b14";
        ctx.fillRect(bx + 2, 0, 7, h);
        ctx.fillStyle = "#9e5525";
        ctx.fillRect(bx + 3, 0, 2, h);
      });

      // 中段橫木飾條
      ctx.fillStyle = "#59280c";
      ctx.fillRect(0, 72, w, 8);
      ctx.fillStyle = "#9e5624";
      ctx.fillRect(0, 74, w, 3);

      // 下部雕花橡木護牆板 (Wainscoting)
      ctx.fillStyle = "#6b3311";
      ctx.fillRect(0, 80, w, 48);
      for (let x = 16; x < w - 12; x += 26) {
        if (Math.abs(x - 124) < 14) continue;
        ctx.fillStyle = "#4c2008";
        ctx.fillRect(x, 86, 20, 34);
        ctx.fillStyle = "#824119";
        ctx.fillRect(x + 2, 88, 16, 30);
        ctx.fillStyle = "#9c5325";
        ctx.fillRect(x + 4, 90, 12, 26);
        ctx.fillStyle = "#b56934";
        ctx.fillRect(x + 4, 90, 12, 2);
      }
      // 踢腳板
      ctx.fillStyle = "#3e1906";
      ctx.fillRect(0, 122, w, 6);
    }, 6, 1);
  }

  // 🪟 獨立冬夜星空拱窗高質感貼圖（僅裝在空白牆面，絕不撞畫！）
  function createArchWindowTexture() {
    return makePixelCanvasTexture(128, 160, (ctx, w, h) => {
      ctx.fillStyle = "#3b1806";
      ctx.fillRect(0, 0, w, h);
      // 深橡木雕花外窗框
      ctx.fillStyle = "#6e3613";
      ctx.fillRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = "#965122";
      ctx.fillRect(7, 7, w - 14, h - 14);
      // 拱形冬夜星空玻璃
      ctx.save();
      ctx.beginPath();
      ctx.arc(w / 2, 54, 46, Math.PI, 0);
      ctx.lineTo(w - 18, h - 18);
      ctx.lineTo(18, h - 18);
      ctx.closePath();
      ctx.clip();

      const sky = ctx.createLinearGradient(0, 8, 0, h - 18);
      sky.addColorStop(0, "#0e1d3b");
      sky.addColorStop(0.55, "#1f3e6e");
      sky.addColorStop(0.85, "#42709e");
      sky.addColorStop(1, "#7ca8c9");
      ctx.fillStyle = sky;
      ctx.fillRect(14, 8, w - 28, h - 26);

      // 發光彎月與星芒
      ctx.fillStyle = "rgba(255, 240, 168, 0.25)";
      ctx.beginPath(); ctx.arc(82, 42, 18, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff3b0";
      ctx.beginPath(); ctx.arc(82, 42, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#142a52";
      ctx.beginPath(); ctx.arc(87, 39, 9, 0, Math.PI * 2); ctx.fill();

      // 閃爍像素星與飄雪
      [[34, 34, 3], [56, 26, 2], [44, 58, 2], [96, 62, 3], [66, 70, 2], [38, 86, 2], [88, 92, 2]].forEach(([sx, sy, sz]) => {
        ctx.fillStyle = "#fffce0";
        ctx.fillRect(sx, sy, sz, sz);
      });

      // 遠方雪山與松林剪影
      ctx.fillStyle = "#223b5e";
      ctx.beginPath();
      ctx.moveTo(14, 142); ctx.lineTo(44, 96); ctx.lineTo(74, 128);
      ctx.lineTo(96, 102); ctx.lineTo(116, 142); ctx.closePath();
      ctx.fill();
      // 山頂積雪反光
      ctx.fillStyle = "#dceeff";
      ctx.beginPath(); ctx.moveTo(44, 96); ctx.lineTo(54, 108); ctx.lineTo(36, 108); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(96, 102); ctx.lineTo(104, 112); ctx.lineTo(89, 112); ctx.closePath(); ctx.fill();

      // 窗框木格與窗台積雪
      ctx.fillStyle = "#4d2109";
      ctx.fillRect(w / 2 - 3, 8, 6, h - 24);
      ctx.fillRect(14, 62, w - 28, 6);
      ctx.fillRect(14, 104, w - 28, 6);
      // 玻璃角落冰霜反光
      ctx.fillStyle = "rgba(235, 248, 255, 0.72)";
      ctx.fillRect(18, 134, w - 36, 8);
      ctx.restore();

      // 拱形外框描邊
      ctx.strokeStyle = "#3b1806";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, 54, 47, Math.PI, 0);
      ctx.lineTo(w - 17, h - 17);
      ctx.lineTo(17, h - 17);
      ctx.closePath();
      ctx.stroke();
    });
  }

  // 📜 冒險公會委託佈告欄高精細軟木塞貼圖
  function createQuestBoardTexture() {
    return makePixelCanvasTexture(256, 160, (ctx, w, h) => {
      // 軟木塞基底＋點狀木紋
      ctx.fillStyle = "#c99255";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 360; i++) {
        ctx.fillStyle = i % 2 ? "#b87f42" : "#dba668";
        ctx.fillRect((i * 41) % w, (i * 23) % h, 3, 2);
      }
      // 內陰影框
      ctx.strokeStyle = "#7a471b";
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, w - 6, h - 6);

      // 繪製 6 張細節滿滿的委託海報（帶折角、文字線、紅蠟封、小插畫！）
      function drawPoster(x, y, pw, ph, bg, accent, hasSketch) {
        ctx.fillStyle = "rgba(55, 25, 6, 0.35)";
        ctx.fillRect(x + 3, y + 3, pw, ph);
        ctx.fillStyle = bg;
        ctx.fillRect(x, y, pw, ph);
        ctx.strokeStyle = "#9c6b3b";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, pw, ph);
        // 頂部標題色條
        ctx.fillStyle = accent;
        ctx.fillRect(x + 4, y + 7, pw - 8, 6);
        // 文字模擬條紋
        ctx.fillStyle = "#5c3618";
        for (let ly = y + 18; ly < y + ph - 12; ly += 6) {
          ctx.fillRect(x + 5, ly, pw - 10 - ((ly * 7) % 10), 2);
        }
        if (hasSketch) {
          ctx.fillStyle = "#c9382b";
          ctx.beginPath(); ctx.arc(x + pw / 2, y + ph - 14, 7, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = "#ffe066";
          ctx.fillRect(x + pw / 2 - 3, y + ph - 16, 6, 3);
        }
        // 金色圖釘
        ctx.fillStyle = "#d92b2b";
        ctx.beginPath(); ctx.arc(x + pw / 2, y + 3, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe580";
        ctx.fillRect(x + pw / 2 - 1, y + 2, 2, 2);
      }

      drawPoster(14, 14, 58, 66, "#fff6d8", "#c9382b", true);
      drawPoster(82, 12, 74, 76, "#ffedc2", "#b87309", true);
      drawPoster(168, 16, 72, 62, "#eaf7d5", "#3f8a1e", false);
      drawPoster(22, 88, 66, 56, "#ffe4cc", "#3882b8", false);
      drawPoster(100, 94, 62, 52, "#fff9e6", "#991b1b", false);
      drawPoster(174, 86, 64, 58, "#e3f2fd", "#1d4e78", true);
    });
  }

  // 🍻 雕花酒館吧檯正面護板與黃銅腳踏桿貼圖
  function createBarFrontTexture() {
    return makePixelCanvasTexture(256, 96, (ctx, w, h) => {
      ctx.fillStyle = "#54260b";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#7a3b14";
      ctx.fillRect(0, 4, w, h - 14);
      // 雕花木框格板
      for (let x = 8; x < w - 12; x += 48) {
        ctx.fillStyle = "#421b06";
        ctx.fillRect(x, 12, 40, 62);
        ctx.fillStyle = "#8f491c";
        ctx.fillRect(x + 3, 15, 34, 56);
        ctx.fillStyle = "#a65b28";
        ctx.fillRect(x + 6, 18, 28, 50);
        // 中心菱形雕飾
        ctx.fillStyle = "#7a3b14";
        ctx.beginPath();
        ctx.moveTo(x + 20, 26); ctx.lineTo(x + 30, 43);
        ctx.lineTo(x + 20, 60); ctx.lineTo(x + 10, 43);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#d99b26";
        ctx.fillRect(x + 18, 41, 4, 4);
      }
      // 底部黃銅腳踏欄杆
      ctx.fillStyle = "#361605";
      ctx.fillRect(0, h - 14, w, 14);
      ctx.fillStyle = "#d99b26";
      ctx.fillRect(0, h - 10, w, 5);
      ctx.fillStyle = "#fff0a8";
      ctx.fillRect(0, h - 9, w, 2);
    });
  }

  // 🛢️ 橡木鍛鐵酒桶貼圖
  function createBarrelTexture() {
    return makePixelCanvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = "#7a4019";
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 8) {
        ctx.fillStyle = x % 16 === 0 ? "#8a4b20" : "#6e3714";
        ctx.fillRect(x, 0, 7, h);
        ctx.fillStyle = "#472008";
        ctx.fillRect(x + 7, 0, 1, h);
      }
      // 兩道鍛鐵箍
      [10, 46].forEach(hy => {
        ctx.fillStyle = "#2b2522";
        ctx.fillRect(0, hy, w, 8);
        ctx.fillStyle = "#544a45";
        ctx.fillRect(0, hy + 1, w, 2);
        for (let rx = 6; rx < w; rx += 16) {
          ctx.fillStyle = "#c9a255";
          ctx.fillRect(rx, hy + 3, 3, 3);
        }
      });
    });
  }

  // 🪵 精緻橡木長桌面（帶紅金桌巾！）貼圖
  function createFeastTableTexture() {
    return makePixelCanvasTexture(192, 128, (ctx, w, h) => {
      ctx.fillStyle = "#5c2b0e";
      ctx.fillRect(0, 0, w, h);
      const planks = ["#9c5928", "#8c4d20", "#a6622e", "#82451b"];
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = planks[r];
        ctx.fillRect(6, 6 + r * 29, w - 12, 27);
        ctx.fillStyle = "rgba(255,224,178,0.16)";
        ctx.fillRect(10, 9 + r * 29, w - 20, 4);
      }
      // 紅金繡邊桌巾 (Table runner)
      ctx.fillStyle = "#8e1c24";
      ctx.fillRect(w / 2 - 28, 2, 56, h - 4);
      ctx.fillStyle = "#f2c14e";
      ctx.fillRect(w / 2 - 24, 2, 4, h - 4);
      ctx.fillRect(w / 2 + 20, 2, 4, h - 4);
      ctx.fillStyle = "#ffd966";
      ctx.beginPath();
      ctx.moveTo(w / 2, h / 2 - 14); ctx.lineTo(w / 2 + 12, h / 2);
      ctx.lineTo(w / 2, h / 2 + 14); ctx.lineTo(w / 2 - 12, h / 2);
      ctx.closePath(); ctx.fill();
    });
  }

  // 豪華紅金羅盤公會大地毯貼圖
  function createGrandRugTexture() {
    return makePixelCanvasTexture(256, 160, (ctx, w, h) => {
      // 左右金色流蘇
      ctx.fillStyle = "#4a2008";
      ctx.fillRect(0, 0, w, h);
      for (let y = 6; y < h - 6; y += 6) {
        ctx.fillStyle = "#f2c14e";
        ctx.fillRect(0, y, 10, 3);
        ctx.fillRect(w - 10, y, 10, 3);
      }
      // 主地毯深紅底
      ctx.fillStyle = "#8a1c24";
      ctx.fillRect(10, 4, w - 20, h - 8);
      // 雙層金邊花紋
      ctx.strokeStyle = "#f5c542";
      ctx.lineWidth = 5;
      ctx.strokeRect(16, 10, w - 32, h - 20);
      ctx.strokeStyle = "#520d13";
      ctx.lineWidth = 3;
      ctx.strokeRect(24, 18, w - 48, h - 36);
      ctx.strokeStyle = "#e09f2b";
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 24, w - 60, h - 48);
      // 四角花飾
      [[28, 22], [w - 40, 22], [28, h - 34], [w - 40, h - 34]].forEach(([cx, cy]) => {
        ctx.fillStyle = "#ffd659";
        ctx.fillRect(cx, cy, 12, 12);
        ctx.fillStyle = "#8a1c24";
        ctx.fillRect(cx + 3, cy + 3, 6, 6);
      });
      // 中央八角冒險羅盤星芒
      const mx = w / 2, my = h / 2;
      ctx.fillStyle = "#5c0f15";
      ctx.beginPath(); ctx.arc(mx, my, 44, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#f5c542";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(mx, my, 42, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = "#ffd966";
      ctx.beginPath();
      ctx.moveTo(mx, my - 38); ctx.lineTo(mx + 12, my - 12);
      ctx.lineTo(mx + 38, my); ctx.lineTo(mx + 12, my + 12);
      ctx.lineTo(mx, my + 38); ctx.lineTo(mx - 12, my + 12);
      ctx.lineTo(mx - 38, my); ctx.lineTo(mx - 12, my - 12);
      ctx.closePath(); ctx.fill();

      ctx.fillStyle = "#b82934";
      ctx.beginPath(); ctx.arc(mx, my, 12, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff4c2";
      ctx.beginPath(); ctx.arc(mx, my, 5, 0, Math.PI * 2); ctx.fill();
    });
  }

  // 石砌大壁爐正面貼圖
  function createFireplaceTexture() {
    return makePixelCanvasTexture(160, 140, (ctx, w, h) => {
      // 灰石磚牆基底
      ctx.fillStyle = "#4d4a47";
      ctx.fillRect(0, 0, w, h);
      const stoneShades = ["#7d7872", "#6b6660", "#8c867f", "#5e5a55"];
      for (let row = 0; row < 10; row++) {
        const y = row * 14;
        const off = (row % 2) * 14;
        for (let x = -14; x < w; x += 28) {
          ctx.fillStyle = stoneShades[(row * 3 + Math.abs(x)) % stoneShades.length];
          ctx.fillRect(x + off + 1, y + 1, 26, 12);
          ctx.fillStyle = "rgba(255,250,240,0.16)";
          ctx.fillRect(x + off + 2, y + 2, 24, 2);
        }
      }
      // 橡木壁爐橫樑
      ctx.fillStyle = "#3e1b08";
      ctx.fillRect(0, 26, w, 16);
      ctx.fillStyle = "#8a481b";
      ctx.fillRect(4, 28, w - 8, 10);
      ctx.fillStyle = "#c97d3b";
      ctx.fillRect(6, 29, w - 12, 3);
      // 爐口黑洞與暖光餘燼
      ctx.fillStyle = "#26160e";
      ctx.fillRect(36, 54, 88, 76);
      ctx.fillStyle = "#3b1c0a";
      ctx.fillRect(42, 60, 76, 66);
      // 柴火木頭
      ctx.fillStyle = "#613012";
      ctx.fillRect(50, 112, 60, 10);
      ctx.fillStyle = "#ff5500";
      ctx.fillRect(56, 104, 48, 12);
      ctx.fillStyle = "#ffaa00";
      ctx.fillRect(64, 92, 32, 18);
      ctx.fillStyle = "#ffee66";
      ctx.fillRect(72, 84, 16, 16);
    });
  }

  // 吧檯後方魔藥瓶與橡木酒架貼圖
  function createBarShelfTexture() {
    return makePixelCanvasTexture(220, 128, (ctx, w, h) => {
      ctx.fillStyle = "#4d230b";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#693212";
      ctx.fillRect(6, 6, w - 12, h - 12);
      const bottleColors = ["#ff4d6d", "#4cc9f0", "#72efdd", "#ffd166", "#c77dff", "#80ed99", "#f77f00"];
      [28, 66, 104].forEach((sy, r) => {
        // 木層板
        ctx.fillStyle = "#3b1806";
        ctx.fillRect(6, sy + 14, w - 12, 8);
        ctx.fillStyle = "#9c5624";
        ctx.fillRect(8, sy + 15, w - 16, 4);
        // 瓶子與酒杯
        for (let bx = 18; bx < w - 24; bx += 18) {
          const col = bottleColors[(bx + r * 3) % bottleColors.length];
          ctx.fillStyle = "#2b1206";
          ctx.fillRect(bx - 1, sy - 4, 12, 18);
          ctx.fillStyle = col;
          ctx.fillRect(bx + 1, sy, 8, 13);
          ctx.fillStyle = "#fff9e6";
          ctx.fillRect(bx + 2, sy + 2, 2, 6); // 玻璃高光
          ctx.fillStyle = "#c98b49";
          ctx.fillRect(bx + 3, sy - 5, 4, 4); // 軟木塞
        }
      });
    });
  }

  // 冒險書櫃貼圖
  function createBookshelfTexture() {
    return makePixelCanvasTexture(128, 160, (ctx, w, h) => {
      ctx.fillStyle = "#3e1b08";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#6e3613";
      ctx.fillRect(6, 6, w - 12, h - 12);
      const bookCols = ["#c9382b", "#2d6fa0", "#468f24", "#d98e0e", "#7a3b8c", "#b54e28", "#2d8a7a"];
      for (let row = 0; row < 4; row++) {
        const y = 12 + row * 36;
        ctx.fillStyle = "#381808";
        ctx.fillRect(10, y, w - 20, 28);
        let x = 12;
        let idx = row * 5;
        while (x < w - 22) {
          const bw = 8 + (idx % 3) * 3;
          const bh = 20 + (idx % 4) * 2;
          ctx.fillStyle = bookCols[idx % bookCols.length];
          ctx.fillRect(x, y + (28 - bh), bw, bh);
          ctx.fillStyle = "#ffe699";
          ctx.fillRect(x + 1, y + (28 - bh) + 4, bw - 2, 2);
          x += bw + 2;
          idx++;
        }
        // 層板
        ctx.fillStyle = "#9e5624";
        ctx.fillRect(8, y + 28, w - 16, 6);
      }
    });
  }

  // 🏯 大阪城夕陽夜景鳥居傳送門主視覺貼圖
  function createOsakaPortalArtTexture() {
    return makePixelCanvasTexture(160, 180, (ctx, w, h) => {
      // 魔幻暮光星空漸層
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#1c1f4a");
      grad.addColorStop(0.5, "#6b2d5c");
      grad.addColorStop(0.85, "#e06d53");
      grad.addColorStop(1, "#ffbe5c");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // 金色星塵與滿月
      ctx.fillStyle = "#fff4bd";
      ctx.beginPath(); ctx.arc(118, 38, 18, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = i % 3 === 0 ? "#ffe066" : "#fff8e6";
        ctx.fillRect((i * 47) % w, (i * 23) % 100, 2, 2);
      }

      // 大阪城天守閣像素剪影
      ctx.fillStyle = "#261730";
      ctx.fillRect(36, 134, 88, 46); // 石垣
      ctx.fillStyle = "#f2ebd9";
      ctx.fillRect(48, 108, 64, 28);
      ctx.fillRect(58, 86, 44, 22);
      ctx.fillRect(68, 68, 24, 18);
      // 綠金屋簷
      ctx.fillStyle = "#24594a";
      ctx.fillRect(40, 104, 80, 7);
      ctx.fillRect(50, 82, 60, 7);
      ctx.fillRect(60, 64, 40, 7);
      ctx.fillRect(72, 54, 16, 10);
      // 金色鯱鉾與發光窗戶
      ctx.fillStyle = "#ffd447";
      ctx.fillRect(70, 50, 4, 5);
      ctx.fillRect(86, 50, 4, 5);
      ctx.fillRect(75, 73, 10, 6);
      ctx.fillRect(66, 93, 8, 6);
      ctx.fillRect(86, 93, 8, 6);

      // 兩側懸掛紅燈籠
      [18, 142].forEach(lx => {
        ctx.fillStyle = "#ff4433";
        ctx.fillRect(lx - 7, 118, 14, 22);
        ctx.fillStyle = "#ffe580";
        ctx.fillRect(lx - 4, 122, 8, 14);
      });
    });
  }

  // ===========================================================================
  // 豪華物件套件專用像素貼圖（寶箱、關西作戰地圖、雕花木柱、石底座、公會掛旗）
  // ===========================================================================
  function createChestWoodTexture() {
    return makePixelCanvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = "#5c2b0e";
      ctx.fillRect(0, 0, w, h);
      const planks = ["#8a4719", "#7a3d14", "#944f1e", "#703610"];
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = planks[r];
        ctx.fillRect(4, r * 32 + 2, w - 8, 28);
        ctx.fillStyle = "rgba(255,220,165,0.16)";
        ctx.fillRect(8, r * 32 + 5, w - 16, 4);
        ctx.fillStyle = "#3b1706";
        ctx.fillRect(0, r * 32 + 30, w, 2);
      }
      [8, w - 22].forEach(bx => {
        ctx.fillStyle = "#b87a14";
        ctx.fillRect(bx, 0, 14, h);
        ctx.fillStyle = "#ffe066";
        ctx.fillRect(bx + 2, 0, 4, h);
        for (let ry = 12; ry < h; ry += 28) {
          ctx.fillStyle = "#4d2804";
          ctx.fillRect(bx + 5, ry, 5, 5);
          ctx.fillStyle = "#fff5bd";
          ctx.fillRect(bx + 5, ry, 2, 2);
        }
      });
      ctx.fillStyle = "#d99b26";
      ctx.fillRect(0, 0, w, 8);
      ctx.fillRect(0, h - 8, w, 8);
    });
  }

  function createChestMatTexture() {
    return makePixelCanvasTexture(160, 128, (ctx, w, h) => {
      ctx.fillStyle = "#33123d";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#5c206b";
      ctx.fillRect(8, 8, w - 16, h - 16);
      ctx.strokeStyle = "#f2c14e";
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      ctx.strokeStyle = "#d48c24";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, w - 40, h - 40);
      for (let x = 14; x < w - 14; x += 8) {
        ctx.fillStyle = "#ffd659";
        ctx.fillRect(x, 2, 4, 6);
        ctx.fillRect(x, h - 8, 4, 6);
      }
      ctx.fillStyle = "#7a2c8e";
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#ffd659";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 28, 0, Math.PI * 2); ctx.stroke();
    });
  }

  function createDetailedKansaiMapTexture() {
    return makePixelCanvasTexture(384, 224, (ctx, w, h) => {
      ctx.fillStyle = "#4a2009";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#8a481c";
      ctx.fillRect(6, 6, w - 12, h - 12);
      ctx.strokeStyle = "#d99b26";
      ctx.lineWidth = 3;
      ctx.strokeRect(10, 10, w - 20, h - 20);

      ctx.fillStyle = "#f5dba4";
      ctx.fillRect(18, 16, w - 36, h - 32);
      ctx.fillStyle = "#aad4e6";
      ctx.fillRect(26, 24, w - 52, h - 48);
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      for (let wy = 34; wy < h - 32; wy += 18) {
        for (let wx = 34; wx < w - 44; wx += 36) {
          ctx.fillRect(wx + (wy % 36 === 0 ? 0 : 14), wy, 14, 2);
        }
      }

      ctx.fillStyle = "#5c9e47";
      ctx.fillRect(58, 134, 34, 38);
      ctx.fillRect(102, 136, 42, 26);
      ctx.fillRect(92, 92, 140, 40);
      ctx.fillRect(210, 60, 56, 60);
      ctx.fillRect(264, 34, 58, 36);
      ctx.fillStyle = "#7bc25d";
      ctx.fillRect(98, 98, 126, 26);
      ctx.fillRect(216, 66, 44, 46);
      ctx.fillRect(272, 40, 42, 24);
      ctx.fillStyle = "#aad4e6";
      ctx.fillRect(144, 120, 22, 18);

      ctx.strokeStyle = "#c92a22";
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.moveTo(40, 184);
      ctx.quadraticCurveTo(96, 174, 152, 126);
      ctx.lineTo(164, 108);
      ctx.lineTo(182, 102);
      ctx.lineTo(186, 118);
      ctx.stroke();
      ctx.setLineDash([]);

      const cx = w - 62, cy = h - 54;
      ctx.strokeStyle = "#6e3814";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = "#c9382b";
      ctx.beginPath(); ctx.moveTo(cx, cy - 20); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx - 6, cy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#d99b26";
      ctx.beginPath(); ctx.moveTo(cx, cy + 20); ctx.lineTo(cx + 6, cy); ctx.lineTo(cx - 6, cy); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 20, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx, cy - 5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx - 20, cy); ctx.lineTo(cx, cy + 5); ctx.lineTo(cx, cy - 5); ctx.closePath(); ctx.fill();

      [[24, 22], [w - 30, 22], [24, h - 28], [w - 30, h - 28]].forEach(([nx, ny]) => {
        ctx.fillStyle = "#d99b26";
        ctx.fillRect(nx, ny, 6, 6);
        ctx.fillStyle = "#fff4bd";
        ctx.fillRect(nx + 1, ny + 1, 2, 2);
      });
    });
  }

  function createPillarWoodTexture() {
    return makePixelCanvasTexture(64, 160, (ctx, w, h) => {
      ctx.fillStyle = "#6e3613";
      ctx.fillRect(0, 0, w, h);
      for (let x = 4; x < w - 4; x += 10) {
        ctx.fillStyle = "#52240a";
        ctx.fillRect(x, 0, 3, h);
        ctx.fillStyle = "#8a491d";
        ctx.fillRect(x + 3, 0, 4, h);
        ctx.fillStyle = "#a35b29";
        ctx.fillRect(x + 7, 0, 2, h);
      }
      [14, 76, 138].forEach(by => {
        ctx.fillStyle = "#2b2523";
        ctx.fillRect(0, by, w, 12);
        ctx.fillStyle = "#4d4440";
        ctx.fillRect(0, by + 2, w, 3);
        for (let rx = 8; rx < w - 6; rx += 16) {
          ctx.fillStyle = "#f2be42";
          ctx.fillRect(rx, by + 4, 4, 4);
        }
      });
    });
  }

  function createStoneBaseTexture() {
    return makePixelCanvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = "#4a4743";
      ctx.fillRect(0, 0, w, h);
      const shades = ["#7d7871", "#6b6660", "#8c867f", "#5e5a55"];
      for (let r = 0; r < 4; r++) {
        const off = (r % 2) * 16;
        for (let x = -16; x < w; x += 32) {
          ctx.fillStyle = shades[(r + Math.abs(x)) % shades.length];
          ctx.fillRect(x + off + 1, r * 16 + 1, 30, 14);
          ctx.fillStyle = "rgba(255,250,240,0.18)";
          ctx.fillRect(x + off + 2, r * 16 + 2, 28, 2);
        }
      }
    });
  }

  function createGuildBannerTexture() {
    return makePixelCanvasTexture(64, 128, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#8e1c24";
      ctx.beginPath();
      ctx.moveTo(4, 0); ctx.lineTo(w - 4, 0);
      ctx.lineTo(w - 4, h - 22);
      ctx.lineTo(w / 2, h - 4);
      ctx.lineTo(4, h - 22);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#f2c14e";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(8, 4); ctx.lineTo(w - 8, 4);
      ctx.lineTo(w - 8, h - 24);
      ctx.lineTo(w / 2, h - 9);
      ctx.lineTo(8, h - 24);
      ctx.closePath();
      ctx.stroke();
      const cx = w / 2, cy = 48;
      ctx.fillStyle = "#ffd966";
      ctx.beginPath();
      ctx.moveTo(cx, cy - 22); ctx.lineTo(cx + 6, cy - 6);
      ctx.lineTo(cx + 22, cy); ctx.lineTo(cx + 6, cy + 6);
      ctx.lineTo(cx, cy + 22); ctx.lineTo(cx - 6, cy + 6);
      ctx.lineTo(cx - 22, cy); ctx.lineTo(cx - 6, cy - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8e1c24";
      ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
    });
  }

  function createWarmHaloTexture() {
    const c = document.createElement("canvas");
    c.width = 64; c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    g.addColorStop(0, "rgba(255, 240, 168, 0.92)");
    g.addColorStop(0.45, "rgba(255, 190, 75, 0.35)");
    g.addColorStop(1, "rgba(255, 160, 40, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function createJapanMapTableTexture() {
    return createDetailedKansaiMapTexture();
  }

  function createSignSprite(text, bgColor = "#6e3412", borderColor = "#f5c556", textColor = "#fff8dc") {
    const c = document.createElement("canvas");
    c.width = 390;
    c.height = 82;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#2b1206";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = borderColor;
    ctx.fillRect(4, 4, c.width - 8, c.height - 8);
    ctx.fillStyle = bgColor;
    ctx.fillRect(9, 9, c.width - 18, c.height - 18);

    ctx.font = 'bold 30px "DotGothic16", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#240d04";
    ctx.fillText(text, c.width / 2 + 2, c.height / 2 + 3);
    ctx.fillStyle = textColor;
    ctx.fillText(text, c.width / 2, c.height / 2 + 1);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(4.1, 0.86, 1);
    sp.renderOrder = 20;
    return sp;
  }

  function createNameTagSprite(name, isOnline, isCurrent, inOsaka) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 68;
    const ctx = c.getContext("2d");

    const bg = isCurrent ? "rgba(180, 42, 28, 0.94)" : "rgba(44, 21, 9, 0.86)";
    const border = isCurrent ? "#ffd859" : (inOsaka ? "#d69449" : "#7cc6e8");

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(12, 10, 232, 48, 14);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = border;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(38, 34, 8, 0, Math.PI * 2);
    ctx.fillStyle = isOnline ? "#44e034" : "#9c8d7a";
    ctx.fill();

    ctx.font = 'bold 27px "DotGothic16", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8e6";
    ctx.fillText(name + (isCurrent ? " ★" : ""), 140, 35);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  function getSmileBubbleTexture() {
    if (smileTexCache) return smileTexCache;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#3b1908";
    ctx.beginPath(); ctx.roundRect(14, 10, 100, 86, 22); ctx.fill();
    ctx.beginPath(); ctx.moveTo(48, 92); ctx.lineTo(64, 118); ctx.lineTo(80, 92); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#fff9e6";
    ctx.beginPath(); ctx.roundRect(20, 16, 88, 74, 17); ctx.fill();
    ctx.beginPath(); ctx.moveTo(54, 88); ctx.lineTo(64, 108); ctx.lineTo(74, 88); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#ffd54f";
    ctx.beginPath(); ctx.arc(64, 53, 27, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3.5; ctx.strokeStyle = "#8a4b08"; ctx.stroke();

    ctx.fillStyle = "rgba(255, 110, 110, 0.55)";
    ctx.beginPath(); ctx.ellipse(47, 57, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(81, 57, 6, 4, 0, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#4a2206";
    ctx.lineWidth = 4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(53, 50, 5.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(75, 50, 5.5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(64, 56, 9, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();

    smileTexCache = new THREE.CanvasTexture(c);
    smileTexCache.colorSpace = THREE.SRGBColorSpace;
    return smileTexCache;
  }

  // ===========================================================================
  // 建立 38 × 26 豪華公會大酒館環境
  // ===========================================================================
  function buildTavernEnvironment() {
    const texLoader = new THREE.TextureLoader();

    // 共用材質（供壁爐、拱窗、佈告欄、寶箱、吧檯、長桌、立柱與植栽統一質感）
    const oakDark = new THREE.MeshStandardMaterial({ color: 0x5c2e12, roughness: 0.84 });
    const oakTop = new THREE.MeshStandardMaterial({ color: 0xa6622b, roughness: 0.68 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xffcf40, emissive: 0x5c3800, roughness: 0.3, metalness: 0.45 });
    const ironDarkMat = new THREE.MeshStandardMaterial({ color: 0x2d2724, roughness: 0.7, metalness: 0.5 });
    const toriiRed = new THREE.MeshStandardMaterial({ color: 0xc92a22, roughness: 0.6 });
    const toriiDark = new THREE.MeshStandardMaterial({ color: 0x26140d, roughness: 0.8 });
    const stoneBaseTex = createStoneBaseTexture();
    const stoneBaseMat = new THREE.MeshStandardMaterial({ map: stoneBaseTex, roughness: 0.92 });
    const haloTex = createWarmHaloTexture();

    // 1. 地板：套用 AI 精繪的星露谷橡木地板貼圖 (textures/floor.jpg)
    const floorTex = texLoader.load("textures/floor.jpg");
    floorTex.wrapS = THREE.RepeatWrapping;
    floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(9, 6);
    floorTex.magFilter = THREE.NearestFilter;
    floorTex.colorSpace = THREE.SRGBColorSpace;

    floorMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(38, 26),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.85, metalness: 0.05 })
    );
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0.2);
    scene.add(floorMesh);

    // 紅金羅盤公會大地毯（中央：套用 Canva 生成精美像素地毯 textures/rug.png）
    const rugTex = texLoader.load("textures/rug.png");
    rugTex.magFilter = THREE.NearestFilter;
    rugTex.colorSpace = THREE.SRGBColorSpace;
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(12.2, 6.4),
      new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.94 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.015, -0.4);
    scene.add(rug);

    // 迎賓地毯通道（通往大阪鳥居傳送門）
    const runner = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 5.2),
      new THREE.MeshStandardMaterial({ color: 0x992028, roughness: 0.95 })
    );
    runner.rotation.x = -Math.PI / 2;
    runner.position.set(9.2, 0.014, -6.2);
    scene.add(runner);

    // 2. 四周高質感純淨半木護牆板木牆（無內嵌窗戶，避免跟掛畫／壁爐重疊！）
    const wallTex = createRichWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(38.4, 6.2, 0.5), wallMat);
    backWall.position.set(0, 3.1, -12.4);
    scene.add(backWall);

    const sideWallTex = createRichWallTexture();
    sideWallTex.repeat.set(4, 1);
    const sideWallMat = new THREE.MeshStandardMaterial({ map: sideWallTex, roughness: 0.9 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 26.4), sideWallMat);
    leftWall.position.set(-18.8, 3.1, 0.4);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 26.4), sideWallMat);
    rightWall.position.set(18.8, 3.1, 0.4);
    scene.add(rightWall);

    // 🪟 獨立 3D 冬夜星空拱窗（只裝在純空白牆面，掛畫後方絕無窗戶！）
    const archWinTex = createArchWindowTexture();
    const archWinMat = new THREE.MeshBasicMaterial({ map: archWinTex });
    const snowTrimMat = new THREE.MeshStandardMaterial({ color: 0xe6f4ff, roughness: 0.7 });

    function addArchWindow(wx, wy, wz, rotY) {
      const wg = new THREE.Group();
      wg.position.set(wx, wy, wz);
      wg.rotation.y = rotY;
      scene.add(wg);

      // 厚實雕花橡木窗外框
      const frame = new THREE.Mesh(new THREE.BoxGeometry(2.38, 2.86, 0.24), oakDark);
      wg.add(frame);

      // 發光冬夜星空玻璃面
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 2.58), archWinMat);
      glass.position.z = 0.135;
      wg.add(glass);

      // 立體木窗台＋微積雪霜飾條＋托架
      const sill = new THREE.Mesh(new THREE.BoxGeometry(2.68, 0.18, 0.42), oakTop);
      sill.position.set(0, -1.48, 0.14);
      wg.add(sill);
      const sillSnow = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.05, 0.16), snowTrimMat);
      sillSnow.position.set(0, -1.37, 0.24);
      wg.add(sillSnow);

      // 頂部雕花窗楣與左右木托架
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.22, 0.34), oakDark);
      lintel.position.set(0, 1.48, 0.08);
      wg.add(lintel);
      [-1.08, 1.08].forEach(cx => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.28), oakDark);
        bracket.position.set(cx, -1.68, 0.08);
        wg.add(bracket);
      });

      // 柔和冬夜藍白月光映照
      const moonLight = new THREE.PointLight(0x8ec5ff, 0.65, 7.2);
      moonLight.position.set(0, 0.15, 0.85);
      wg.add(moonLight);
    }

    // 4 扇獨立冬夜拱窗：北牆最左空位、北牆最右空位、東牆南北兩側空位（掛畫 x=4.5 後方完全乾淨！）
    addArchWindow(-13.4, 3.4, -12.06, 0);
    addArchWindow(14.8, 3.4, -12.06, 0);
    addArchWindow(18.46, 3.4, -6.8, -Math.PI / 2);
    addArchWindow(18.46, 3.4, 5.6, -Math.PI / 2);

    // 3. 🔥 北牆正中央：深凹 3D 石砌雕花大壁爐套件（石砌壁爐柱＋石拱門＋立體柴薪火塘＋橡木壁爐台＋銅壺提燈！）
    const fpGroup = new THREE.Group();
    fpGroup.position.set(0, 0, -11.5);
    scene.add(fpGroup);

    const hearthDarkStone = new THREE.MeshStandardMaterial({ color: 0x3b3633, roughness: 0.95 });
    const sootInteriorMat = new THREE.MeshStandardMaterial({ color: 0x1e1714, roughness: 0.98 });
    const copperMat = new THREE.MeshStandardMaterial({ color: 0xd4713b, roughness: 0.32, metalness: 0.58 });
    const barkMat = new THREE.MeshStandardMaterial({ color: 0x4d2610, roughness: 0.92 });
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff5a1f });

    // 突出的石板火塘地台 (Flagstone apron)
    const fpApron = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.26, 2.05), stoneBaseMat);
    fpApron.position.set(0, 0.13, 0.25);
    fpGroup.add(fpApron);
    const fpApronRim = new THREE.Mesh(new THREE.BoxGeometry(4.92, 0.08, 1.88), hearthDarkStone);
    fpApronRim.position.set(0, 0.28, 0.22);
    fpGroup.add(fpApronRim);

    // 左右厚實石砌壁爐墩柱
    [-1.68, 1.68].forEach(px => {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(1.26, 2.48, 1.48), stoneBaseMat);
      pier.position.set(px, 1.48, 0);
      fpGroup.add(pier);
      const pierCap = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.18, 1.56), hearthDarkStone);
      pierCap.position.set(px, 2.62, 0.02);
      fpGroup.add(pierCap);
    });

    // 深凹火膛背牆與側壁＋炙熱炭火床
    const fpBack = new THREE.Mesh(new THREE.BoxGeometry(2.35, 2.25, 0.3), sootInteriorMat);
    fpBack.position.set(0, 1.38, -0.52);
    fpGroup.add(fpBack);
    const emberBed = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.14, 0.92), emberMat);
    emberBed.position.set(0, 0.34, 0.05);
    fpGroup.add(emberBed);

    // 石砌橫樑拱門與中央突出拱心石 (Keystone)
    const fpLintel = new THREE.Mesh(new THREE.BoxGeometry(4.72, 0.56, 1.52), stoneBaseMat);
    fpLintel.position.set(0, 2.46, 0.02);
    fpGroup.add(fpLintel);
    const keystone = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.66, 1.62), hearthDarkStone);
    keystone.position.set(0, 2.48, 0.06);
    fpGroup.add(keystone);

    // 鍛鐵薪架與立體交叉橡木柴薪
    [-0.68, 0.68].forEach(ax => {
      const andiron = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.44, 0.72), ironDarkMat);
      andiron.position.set(ax, 0.46, 0.16);
      fpGroup.add(andiron);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), brassMat);
      finial.position.set(ax, 0.74, 0.48);
      fpGroup.add(finial);
    });
    const grateBar = new THREE.Mesh(new THREE.BoxGeometry(1.56, 0.08, 0.58), ironDarkMat);
    grateBar.position.set(0, 0.44, 0.12);
    fpGroup.add(grateBar);

    [[-0.22, 0.54, 0.16, 0.25], [0.22, 0.54, 0.1, -0.28], [0, 0.64, 0.06, 0.05]].forEach(([lx, ly, lz, ry]) => {
      const log = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 1.32, 8), barkMat);
      log.rotation.z = Math.PI / 2;
      log.rotation.y = ry;
      log.position.set(lx, ly, lz);
      fpGroup.add(log);
    });

    // 厚重雕花橡木壁爐台 (Mantelpiece) ＋ 三支斜撐木托架
    const mantelBody = new THREE.Mesh(new THREE.BoxGeometry(5.18, 0.26, 1.72), oakDark);
    mantelBody.position.set(0, 2.86, 0.08);
    fpGroup.add(mantelBody);
    const mantelTop = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.1, 1.8), oakTop);
    mantelTop.position.set(0, 3.04, 0.1);
    fpGroup.add(mantelTop);
    [-1.7, 0, 1.7].forEach(cx => {
      const corbel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.36), oakDark);
      corbel.position.set(cx, 2.66, 0.76);
      fpGroup.add(corbel);
    });

    // 漸收式石砌大煙囪＋家族紅金徽章盾牌＋雙劍裝飾＋乾燥薰衣草束
    const chimneyLow = new THREE.Mesh(new THREE.BoxGeometry(3.45, 1.48, 1.28), stoneBaseMat);
    chimneyLow.position.set(0, 3.82, -0.06);
    fpGroup.add(chimneyLow);
    const chimneyHigh = new THREE.Mesh(new THREE.BoxGeometry(2.65, 1.72, 1.12), stoneBaseMat);
    chimneyHigh.position.set(0, 5.36, -0.1);
    fpGroup.add(chimneyHigh);
    const chimneyBeam = new THREE.Mesh(new THREE.BoxGeometry(3.58, 0.2, 1.38), oakDark);
    chimneyBeam.position.set(0, 4.56, -0.04);
    fpGroup.add(chimneyBeam);

    // 煙囪中央家族公會紋章盾牌
    const shieldRim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.45, 0.14, 6), brassMat);
    shieldRim.rotation.x = Math.PI / 2;
    shieldRim.position.set(0, 3.85, 0.6);
    fpGroup.add(shieldRim);
    const shieldCore = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.36, 0.16, 6), toriiRed);
    shieldCore.rotation.x = Math.PI / 2;
    shieldCore.position.set(0, 3.85, 0.62);
    fpGroup.add(shieldCore);
    const shieldStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), brassMat);
    shieldStar.position.set(0, 3.85, 0.72);
    fpGroup.add(shieldStar);

    // 煙囪左右懸掛乾燥香草與薰衣草束
    [-1.22, 1.22].forEach(hx => {
      const herbStem = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.56, 6), new THREE.MeshStandardMaterial({ color: 0x4f7a3c, roughness: 0.9 }));
      herbStem.rotation.z = Math.PI;
      herbStem.position.set(hx, 3.82, 0.64);
      fpGroup.add(herbStem);
      const lavender = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.32, 6), new THREE.MeshStandardMaterial({ color: 0x9b6bd4, roughness: 0.9 }));
      lavender.rotation.z = Math.PI;
      lavender.position.set(hx, 3.58, 0.66);
      fpGroup.add(lavender);
    });

    // 壁爐台上溫馨小擺件：左側像素提燈、銅製茶壺、右側精裝冒險書與搖曳蠟燭
    const mLanternBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.08, 6), ironDarkMat);
    mLanternBase.position.set(-1.85, 3.13, 0.48);
    fpGroup.add(mLanternBase);
    const mLanternGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.34, 6), new THREE.MeshBasicMaterial({ color: 0xffe484 }));
    mLanternGlass.position.set(-1.85, 3.34, 0.48);
    fpGroup.add(mLanternGlass);
    const mLanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.18, 6), ironDarkMat);
    mLanternCap.position.set(-1.85, 3.58, 0.48);
    fpGroup.add(mLanternCap);

    const kettleBody = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), copperMat);
    kettleBody.scale.set(1.1, 0.85, 1.1);
    kettleBody.position.set(-0.95, 3.28, 0.52);
    fpGroup.add(kettleBody);
    const kettleLid = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.08, 8), brassMat);
    kettleLid.position.set(-0.95, 3.48, 0.52);
    fpGroup.add(kettleLid);

    // 右側冒險精裝書疊＋搖曳蠟燭
    const book1 = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.38), toriiRed);
    book1.position.set(1.22, 3.15, 0.48);
    book1.rotation.y = 0.12;
    fpGroup.add(book1);
    const book2 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.11, 0.34), new THREE.MeshStandardMaterial({ color: 0x245435, roughness: 0.8 }));
    book2.position.set(1.24, 3.26, 0.48);
    book2.rotation.y = -0.18;
    fpGroup.add(book2);

    const mCandleHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.06, 8), brassMat);
    mCandleHolder.position.set(1.92, 3.12, 0.5);
    fpGroup.add(mCandleHolder);
    const mCandleWax = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.34, 8), new THREE.MeshStandardMaterial({ color: 0xfff5db }));
    mCandleWax.position.set(1.92, 3.32, 0.5);
    fpGroup.add(mCandleWax);
    const mCandleFlame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), new THREE.MeshBasicMaterial({ color: 0xffd24d }));
    mCandleFlame.position.set(1.92, 3.55, 0.5);
    fpGroup.add(mCandleFlame);
    candleFlames.push(mCandleFlame);

    // 壁爐右側牆邊整齊堆疊的備用橡木柴薪架
    [[2.55, 0.16], [2.85, 0.16], [2.7, 0.38], [2.58, 0.6], [2.82, 0.6]].forEach(([sx, sy]) => {
      const stackLog = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.82, 7), barkMat);
      stackLog.rotation.x = Math.PI / 2;
      stackLog.position.set(sx, sy, 0.05);
      fpGroup.add(stackLog);
    });

    // 北牆大合照金框畫廊（獨立於純淨木牆上，背後絕無窗戶，並加裝美術館級黃銅畫燈！）
    const groupPhotoTex = texLoader.load("avatars/day1_group.jpg");
    groupPhotoTex.colorSpace = THREE.SRGBColorSpace;
    const outerGalleryFrame = new THREE.Mesh(new THREE.BoxGeometry(3.86, 2.38, 0.14), oakDark);
    outerGalleryFrame.position.set(4.5, 3.6, -12.11);
    scene.add(outerGalleryFrame);
    const frameBox = new THREE.Mesh(new THREE.BoxGeometry(3.62, 2.16, 0.18), brassMat);
    frameBox.position.set(4.5, 3.6, -12.06);
    scene.add(frameBox);
    const photoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.32, 1.86),
      new THREE.MeshBasicMaterial({ map: groupPhotoTex })
    );
    photoPlane.position.set(4.5, 3.6, -11.96);
    scene.add(photoPlane);

    // 畫框上方黃銅畫廊壁燈
    const picLampBar = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.45, 8), brassMat);
    picLampBar.rotation.z = Math.PI / 2;
    picLampBar.position.set(4.5, 4.92, -11.65);
    scene.add(picLampBar);
    const picLampArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.48), brassMat);
    picLampArm.position.set(4.5, 4.92, -11.92);
    scene.add(picLampArm);
    const picLight = new THREE.PointLight(0xffe0a3, 1.0, 6.5);
    picLight.position.set(4.5, 4.65, -11.2);
    scene.add(picLight);

    // 壁爐深凹火膛內的跳動火焰與火星粒子
    const flameColors = [0xff4500, 0xff8800, 0xffd633, 0xfff099];
    for (let i = 0; i < 16; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.34, 0.28),
        new THREE.MeshBasicMaterial({ color: flameColors[i % flameColors.length] })
      );
      p.position.set((Math.random() - 0.5) * 1.45, 0.45 + Math.random() * 0.9, -11.35 + (Math.random() - 0.5) * 0.3);
      p.userData = { baseX: p.position.x, phase: Math.random() * Math.PI * 2, speed: 2.3 + Math.random() * 2.2 };
      scene.add(p);
      fireParticles.push(p);
    }
    fireLight = new THREE.PointLight(0xff842c, 3.8, 21);
    fireLight.position.set(0, 1.65, -9.8);
    scene.add(fireLight);

    // 4. 📚 壁爐左側高大冒險書櫃
    const shelfTex = createBookshelfTexture();
    const shelfMat = new THREE.MeshStandardMaterial({ map: shelfTex, roughness: 0.88 });
    [-3.2].forEach(bx => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.4, 0.75), shelfMat);
      shelf.position.set(bx, 1.7, -11.75);
      scene.add(shelf);
    });

    // 5. 📜 3D 木屋簷公會情報佈告欄套件（雙木支柱＋斜坡瓦片屋簷＋高精細委託海報＋黃銅照燈！）
    const boardGroup = new THREE.Group();
    boardGroup.position.set(-5.8, 0, -11.92);
    scene.add(boardGroup);

    // 左右落地橡木立柱＋石磚腳座
    [-1.72, 1.72].forEach(px => {
      const bFoot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.38), stoneBaseMat);
      bFoot.position.set(px, 0.13, 0);
      boardGroup.add(bFoot);
      const bPost = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.55, 0.22), oakDark);
      bPost.position.set(px, 1.85, 0);
      boardGroup.add(bPost);
    });

    // 雕花木框＋黃銅護角
    const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(3.62, 2.32, 0.24), oakDark);
    boardFrame.position.set(0, 2.32, 0.02);
    boardFrame.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(boardFrame);
    boardGroup.add(boardFrame);

    [[-1.72, 3.38], [1.72, 3.38], [-1.72, 1.26], [1.72, 1.26]].forEach(([bx, by]) => {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.28), brassMat);
      corner.position.set(bx, by, 0.04);
      boardGroup.add(corner);
    });

    // 高細節軟木塞委託海報板面
    const questBoardTex = createQuestBoardTexture();
    const cork = new THREE.Mesh(
      new THREE.BoxGeometry(3.22, 1.94, 0.12),
      new THREE.MeshStandardMaterial({ map: questBoardTex, roughness: 0.92 })
    );
    cork.position.set(0, 2.32, 0.12);
    cork.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(cork);
    boardGroup.add(cork);

    // 3D 立體微翹羊皮紙懸賞單＋紅蠟封印
    [[-0.95, 2.68, 0.06, 0xfff6d6], [0.02, 2.62, -0.04, 0xffedc2], [0.96, 2.65, 0.05, 0xebf7d8], [-0.45, 1.82, -0.05, 0xffe4cc], [0.58, 1.85, 0.04, 0xe3f2fd]].forEach(([nx, ny, rot, col]) => {
      const poster = new THREE.Mesh(
        new THREE.BoxGeometry(0.68, 0.62, 0.03),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.88 })
      );
      poster.position.set(nx, ny, 0.2);
      poster.rotation.z = rot;
      poster.userData = { clickType: "interactable", targetId: "board-guild" };
      clickableMeshes.push(poster);
      boardGroup.add(poster);

      const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 8), toriiRed);
      seal.rotation.x = Math.PI / 2;
      seal.position.set(nx, ny + 0.24, 0.22);
      boardGroup.add(seal);
    });

    // 斜坡木瓦遮雨屋簷＋脊樑
    const shingleMat = new THREE.MeshStandardMaterial({ color: 0x6e3112, roughness: 0.86 });
    const awning = new THREE.Mesh(new THREE.BoxGeometry(4.05, 0.16, 0.96), shingleMat);
    awning.position.set(0, 3.68, 0.22);
    awning.rotation.x = 0.32;
    boardGroup.add(awning);
    const awningRidge = new THREE.Mesh(new THREE.BoxGeometry(4.14, 0.14, 0.24), oakDark);
    awningRidge.position.set(0, 3.84, -0.14);
    boardGroup.add(awningRidge);

    // 屋簷下黃銅照明小燈＋暖光光暈
    const bLampCap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 8), brassMat);
    bLampCap.position.set(0, 3.52, 0.48);
    boardGroup.add(bLampCap);
    const bLampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe896 }));
    bLampBulb.position.set(0, 3.42, 0.48);
    boardGroup.add(bLampBulb);
    const bLampHalo = new THREE.Sprite(new THREE.SpriteMaterial({
      map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    bLampHalo.scale.set(1.25, 1.25, 1);
    bLampHalo.position.set(0, 3.42, 0.5);
    boardGroup.add(bLampHalo);
    const boardLight = new THREE.PointLight(0xffcf70, 1.0, 6.2);
    boardLight.position.set(0, 3.25, 0.72);
    boardGroup.add(boardLight);

    // 佈告欄下方置物木條（放著小卷軸）
    const boardLedge = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.34), oakTop);
    boardLedge.position.set(0, 1.12, 0.16);
    boardGroup.add(boardLedge);

    const boardSign = createSignSprite("📜 公會情報佈告欄", "#5c2b0e", "#e8b45a");
    boardSign.position.set(-5.8, 4.45, -11.5);
    boardSign.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(boardSign);
    scene.add(boardSign);

    // 6. 🧰 公會黃金寶箱展示台套件（圓拱金框寶箱＋皇家絨墊＋金幣寶石＋漂浮金光！）
    const chestGroup = new THREE.Group();
    chestGroup.position.set(-9.7, 0, -7.7);
    scene.add(chestGroup);

    const chestRugTex = createChestMatTexture();
    const chestMatMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 2.7),
      new THREE.MeshStandardMaterial({ map: chestRugTex, roughness: 0.95 })
    );
    chestMatMesh.rotation.x = -Math.PI / 2;
    chestMatMesh.position.y = 0.018;
    chestGroup.add(chestMatMesh);

    const chestWoodTex = createChestWoodTexture();
    const chestWoodMat = new THREE.MeshStandardMaterial({ map: chestWoodTex, roughness: 0.65 });

    // 寶箱木質基座＋四個鍍金護角
    const chestBase = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.78, 1.08), chestWoodMat);
    chestBase.position.y = 0.41;
    chestBase.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(chestBase);
    chestGroup.add(chestBase);

    // 圓弧拱形寶箱上蓋 (Barrel-top arched lid!)
    const archedLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 1.78, 12, 1, false, 0, Math.PI),
      chestWoodMat
    );
    archedLid.rotation.z = Math.PI / 2;
    archedLid.position.y = 0.80;
    archedLid.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(archedLid);
    chestGroup.add(archedLid);

    // 三道鍍金鐵箍環繞拱蓋
    [-0.78, 0, 0.78].forEach(sx => {
      const strap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.575, 0.575, 0.14, 12, 1, false, 0, Math.PI),
        brassMat
      );
      strap.rotation.z = Math.PI / 2;
      strap.position.set(sx, 0.80, 0);
      chestGroup.add(strap);
    });

    // 中央雕花金鎖牌＋發光綠寶石鎖扣
    const lockPlate = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.12), brassMat);
    lockPlate.position.set(0, 0.72, 0.54);
    lockPlate.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(lockPlate);
    chestGroup.add(lockPlate);

    const gemClasp = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.11, 0),
      new THREE.MeshBasicMaterial({ color: 0x3bf08a })
    );
    gemClasp.position.set(0, 0.74, 0.62);
    chestGroup.add(gemClasp);

    // 寶箱旁的閃亮金幣堆與紅藍寶石裝飾
    [[-1.15, 0.35, 3], [-1.02, 0.52, 2], [1.12, 0.25, 4], [1.24, 0.46, 2]].forEach(([cx, cz, count]) => {
      for (let i = 0; i < count; i++) {
        const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 10), brassMat);
        coin.position.set(cx, 0.04 + i * 0.045, cz);
        chestGroup.add(coin);
      }
    });
    const rubyGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.15, 0), new THREE.MeshStandardMaterial({ color: 0xff2e55, emissive: 0x6b081c, roughness: 0.2 }));
    rubyGem.position.set(1.06, 0.16, -0.35);
    chestGroup.add(rubyGem);
    const sapphGem = new THREE.Mesh(new THREE.OctahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0b4a6e, roughness: 0.2 }));
    sapphGem.position.set(-1.12, 0.14, -0.25);
    chestGroup.add(sapphGem);

    // 寶箱暖金光暈與漂浮金光微粒
    const chestLight = new THREE.PointLight(0xffcf40, 1.8, 7.5);
    chestLight.position.set(0, 1.55, 0.3);
    chestGroup.add(chestLight);

    for (let i = 0; i < 6; i++) {
      const sp = new THREE.Mesh(
        new THREE.BoxGeometry(0.09, 0.09, 0.09),
        new THREE.MeshBasicMaterial({ color: i % 2 ? 0xfff5a8 : 0xffcf40 })
      );
      sp.position.set((Math.random() - 0.5) * 1.6, 0.9 + Math.random() * 0.9, (Math.random() - 0.5) * 0.9);
      sp.userData = { baseX: sp.position.x, baseZ: sp.position.z, phase: Math.random() * Math.PI * 2, speed: 0.55 + Math.random() * 0.45 };
      chestGroup.add(sp);
      chestSparkles.push(sp);
    }

    const chestSign = createSignSprite("🧰 戰利品寶箱台", "#6b2d6b", "#ffd447");
    chestSign.position.set(-9.7, 2.55, -7.7);
    chestSign.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(chestSign);
    scene.add(chestSign);

    // 7. 🏯「2027 大阪關西冒險」鳥居傳送門（北牆右側＋大阪城暮光主視覺）
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0x6b4300, roughness: 0.35 });

    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.1, 10), toriiRed);
    leftPillar.position.set(7.5, 2.05, -11.2);
    scene.add(leftPillar);
    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.25, 4.1, 10), toriiRed);
    rightPillar.position.set(10.9, 2.05, -11.2);
    scene.add(rightPillar);

    const kasagiTop = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.28, 0.54), toriiDark);
    kasagiTop.position.set(9.2, 4.25, -11.2);
    scene.add(kasagiTop);
    const kasagiRed = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.24, 0.44), toriiRed);
    kasagiRed.position.set(9.2, 4.0, -11.2);
    scene.add(kasagiRed);
    const nukiBeam = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.22, 0.3), toriiRed);
    nukiBeam.position.set(9.2, 3.32, -11.2);
    scene.add(nukiBeam);
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.58, 0.2), goldMat);
    plaque.position.set(9.2, 3.65, -11.1);
    scene.add(plaque);

    // 鳥居門內：Canva 精繪雪夜大阪城鳥居畫作！(textures/osaka_portal.png)
    const osakaArtTex = texLoader.load("textures/osaka_portal.png");
    osakaArtTex.magFilter = THREE.NearestFilter;
    osakaArtTex.colorSpace = THREE.SRGBColorSpace;
    osakaCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(3.5, 3.5),
      new THREE.MeshBasicMaterial({ map: osakaArtTex, transparent: true, opacity: 0.96, side: THREE.DoubleSide })
    );
    osakaCurtain.position.set(9.2, 1.8, -11.35);
    osakaCurtain.userData = { clickType: "interactable", targetId: "portal-osaka" };
    clickableMeshes.push(osakaCurtain);
    scene.add(osakaCurtain);

    osakaRing = new THREE.Mesh(
      new THREE.RingGeometry(1.15, 1.68, 28),
      new THREE.MeshBasicMaterial({ color: 0xffcb3b, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    osakaRing.rotation.x = -Math.PI / 2;
    osakaRing.position.set(9.2, 0.03, -9.6);
    osakaRing.userData = { clickType: "interactable", targetId: "portal-osaka" };
    clickableMeshes.push(osakaRing);
    scene.add(osakaRing);

    const osakaLight = new THREE.PointLight(0xffbb33, 3.0, 14);
    osakaLight.position.set(9.2, 2.4, -9.5);
    scene.add(osakaLight);

    const osakaSign = createSignSprite("🏯 2027 大阪關西冒險", "#991b1b", "#ffd447", "#fffbe6");
    osakaSign.position.set(9.2, 5.1, -10.8);
    osakaSign.userData = { clickType: "interactable", targetId: "portal-osaka" };
    clickableMeshes.push(osakaSign);
    scene.add(osakaSign);

    // 8. 🧭 東側牆壁：未來新場景傳送陣（北海道／東京等）
    const stoneArchMat = new THREE.MeshStandardMaterial({ color: 0x4b627d, roughness: 0.72 });
    const fPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.6, 0.45), stoneArchMat);
    fPillar1.position.set(17.8, 1.8, -2.2);
    scene.add(fPillar1);
    const fPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.45, 3.6, 0.45), stoneArchMat);
    fPillar2.position.set(17.8, 1.8, 1.0);
    scene.add(fPillar2);
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.42, 3.9), stoneArchMat);
    fTop.position.set(17.8, 3.7, -0.6);
    scene.add(fTop);

    const futureCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(2.7, 3.3),
      new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.36, side: THREE.DoubleSide })
    );
    futureCurtain.rotation.y = Math.PI / 2;
    futureCurtain.position.set(17.8, 1.65, -0.6);
    futureCurtain.userData = { clickType: "interactable", targetId: "portal-future" };
    clickableMeshes.push(futureCurtain);
    scene.add(futureCurtain);

    futureRing = new THREE.Mesh(
      new THREE.RingGeometry(1.0, 1.48, 26),
      new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    futureRing.rotation.x = -Math.PI / 2;
    futureRing.position.set(15.8, 0.03, -0.6);
    futureRing.userData = { clickType: "interactable", targetId: "portal-future" };
    clickableMeshes.push(futureRing);
    scene.add(futureRing);

    const futureLight = new THREE.PointLight(0x4cc9f0, 2.5, 13);
    futureLight.position.set(16.0, 2.2, -0.6);
    scene.add(futureLight);

    const futureSign = createSignSprite("🧭 未來場景傳送陣", "#1c4b75", "#7dd3fc", "#e0f7ff");
    futureSign.position.set(16.6, 4.5, -0.6);
    futureSign.userData = { clickType: "interactable", targetId: "portal-future" };
    clickableMeshes.push(futureSign);
    scene.add(futureSign);

    // 9. 🍻 西側 3D 雕花橡木酒館大吧檯套件（雕花護板＋黃銅腳踏桿＋啤酒拉霸塔＋泡沫啤酒杯＋魔藥瓶＋鐵箍橡木酒桶＋三盞琥珀吊燈！）
    const barGroup = new THREE.Group();
    barGroup.position.set(-14.2, 0, -0.5);
    scene.add(barGroup);

    const barFrontTex = createBarFrontTexture();
    barFrontTex.wrapS = THREE.RepeatWrapping;
    barFrontTex.repeat.set(3, 1);
    const barFrontMat = new THREE.MeshStandardMaterial({ map: barFrontTex, roughness: 0.78 });

    const barBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 1.24, 9.8),
      [barFrontMat, oakDark, oakDark, oakDark, oakDark, oakDark]
    );
    barBody.position.y = 0.62;
    barBody.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barBody);
    barGroup.add(barBody);

    // 雙層厚實橡木吧檯桌面＋黃銅護角
    const barMolding = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.12, 10.0), oakDark);
    barMolding.position.y = 1.24;
    barGroup.add(barMolding);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.16, 10.22), oakTop);
    barTop.position.y = 1.36;
    barTop.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barTop);
    barGroup.add(barTop);

    [[-1.08, -5.02], [1.08, -5.02], [-1.08, 5.02], [1.08, 5.02]].forEach(([bx, bz]) => {
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.24), brassMat);
      cap.position.set(bx, 1.36, bz);
      barGroup.add(cap);
    });

    // 吧檯正面 3D 黃銅腳踏欄杆與固定支撐架
    const footRail = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 9.5, 8), brassMat);
    footRail.rotation.x = Math.PI / 2;
    footRail.position.set(1.12, 0.18, 0);
    barGroup.add(footRail);
    [-4.2, -2.1, 0, 2.1, 4.2].forEach(fz => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.06, 0.07), brassMat);
      post.position.set(1.02, 0.18, fz);
      barGroup.add(post);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.18, 6), brassMat);
      foot.position.set(1.12, 0.09, fz);
      barGroup.add(foot);
    });

    // 3D 黃銅三管精釀啤酒拉霸塔 (Draft Beer Tap Tower)
    const tapBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.07, 1.1), ironDarkMat);
    tapBase.position.set(0.22, 1.47, -1.6);
    barGroup.add(tapBase);
    const tapCol = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.72, 10), brassMat);
    tapCol.position.set(0.08, 1.84, -1.6);
    barGroup.add(tapCol);
    const tapHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.88), brassMat);
    tapHead.position.set(0.16, 2.22, -1.6);
    barGroup.add(tapHead);
    [[-0.28, 0xc92a22], [0, 0xf59e0b], [0.28, 0x2f855a]].forEach(([tz, handleCol]) => {
      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.02, 0.16, 6), brassMat);
      spout.position.set(0.32, 2.08, -1.6 + tz);
      barGroup.add(spout);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.022, 0.26, 6), new THREE.MeshStandardMaterial({ color: handleCol, roughness: 0.4 }));
      handle.position.set(0.32, 2.38, -1.6 + tz);
      handle.rotation.z = -0.22;
      barGroup.add(handle);
    });

    // 吧檯上的泡沫生啤酒木杯 (4 杯)
    const tankardMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.42 });
    const foamMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, roughness: 0.9 });
    [[0.48, -3.1], [0.52, -0.4], [0.46, 1.15], [0.5, 3.05]].forEach(([mx, mz]) => {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.115, 0.28, 8), tankardMat);
      mug.position.set(mx, 1.58, mz);
      barGroup.add(mug);
      const mugBand = new THREE.Mesh(new THREE.CylinderGeometry(0.134, 0.128, 0.05, 8), ironDarkMat);
      mugBand.position.set(mx, 1.54, mz);
      barGroup.add(mugBand);
      const foam = new THREE.Mesh(new THREE.SphereGeometry(0.135, 8, 6), foamMat);
      foam.scale.set(1, 0.55, 1);
      foam.position.set(mx, 1.73, mz);
      barGroup.add(foam);
    });

    // 吧檯發光冒險魔藥瓶組 (紅／藍／綠) ＋ 黃銅服務鈴 ＋ 打開的酒館帳本
    [[0.12, 1.95, 0xff3b5c, 0x700c1e], [0.36, 2.25, 0x38bdf8, 0x0b4a6e], [0.05, 2.42, 0x34d399, 0x065f46]].forEach(([px, pz, col, emi]) => {
      const flask = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 8, 8),
        new THREE.MeshStandardMaterial({ color: col, emissive: emi, roughness: 0.2 })
      );
      flask.position.set(px, 1.56, pz);
      barGroup.add(flask);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.12, 6), new THREE.MeshStandardMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.8 }));
      neck.position.set(px, 1.7, pz);
      barGroup.add(neck);
      const corkPlug = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.03, 0.05, 6), oakTop);
      corkPlug.position.set(px, 1.77, pz);
      barGroup.add(corkPlug);
    });

    // 黃銅服務鈴
    const bellBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.04, 10), ironDarkMat);
    bellBase.position.set(0.55, 1.46, 0.35);
    barGroup.add(bellBase);
    const bellDome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), brassMat);
    bellDome.position.set(0.55, 1.48, 0.35);
    barGroup.add(bellDome);

    // 吧檯後方魔藥瓶壁架（套用 Canva 精繪像素酒櫃 textures/bar_shelf.png ＋ 深橡木頂冠線板！）
    const barShelfTex = texLoader.load("textures/bar_shelf.png");
    barShelfTex.magFilter = THREE.NearestFilter;
    barShelfTex.colorSpace = THREE.SRGBColorSpace;
    const barShelfFront = new THREE.MeshStandardMaterial({ map: barShelfTex, roughness: 0.78 });
    const barShelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 4.1, 7.3),
      [barShelfFront, oakDark, oakDark, oakDark, oakDark, oakDark]
    );
    barShelf.position.set(-18.2, 2.8, -0.5);
    scene.add(barShelf);
    const shelfCrown = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.24, 7.7), oakDark);
    shelfCrown.position.set(-18.08, 4.92, -0.5);
    scene.add(shelfCrown);

    // 5 座高精細鍛鐵箍橡木大酒桶（含龍頭與上方小酒桶堆疊！）
    const barrelTex = createBarrelTexture();
    const barrelMat = new THREE.MeshStandardMaterial({ map: barrelTex, roughness: 0.82 });
    for (let i = 0; i < 5; i++) {
      const bz = -4.1 + i * 1.8;
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.5, 1.18, 12), barrelMat);
      barrel.position.set(-16.8, 0.59, bz);
      scene.add(barrel);
      const barrelRim = new THREE.Mesh(new THREE.TorusGeometry(0.51, 0.04, 6, 12), ironDarkMat);
      barrelRim.rotation.x = Math.PI / 2;
      barrelRim.position.set(-16.8, 1.15, bz);
      scene.add(barrelRim);
      const spigot = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 6), brassMat);
      spigot.rotation.z = Math.PI / 2;
      spigot.position.set(-16.24, 0.35, bz);
      scene.add(spigot);
    }
    // 疊放兩個橫躺精釀小酒桶
    [-3.2, 2.2].forEach(cz => {
      const cask = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.92, 10), barrelMat);
      cask.rotation.z = Math.PI / 2;
      cask.position.set(-16.8, 1.54, cz);
      scene.add(cask);
    });

    // 吧檯上方三盞懸掛式暖琥珀銅罩吊燈
    [-3.6, -0.5, 2.6].forEach(lz => {
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.8, 6), ironDarkMat);
      chain.position.set(-14.1, 5.1, lz);
      scene.add(chain);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 10), copperMat);
      shade.position.set(-14.1, 4.18, lz);
      scene.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe484 }));
      bulb.position.set(-14.1, 4.0, lz);
      scene.add(bulb);
      const pHalo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      pHalo.scale.set(1.6, 1.6, 1);
      pHalo.position.set(-14.1, 4.0, lz);
      scene.add(pHalo);
      const barLampLight = new THREE.PointLight(0xffbe55, 1.15, 9.5);
      barLampLight.position.set(-13.8, 3.85, lz);
      scene.add(barLampLight);
      lanternLights.push(barLampLight);
    });

    const barSign = createSignSprite("🍻 冒險者酒館吧檯", "#6e3814", "#f5be4f");
    barSign.position.set(-14.2, 3.25, -0.5);
    barSign.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barSign);
    scene.add(barSign);

    // 10. 🗺️ 中央偏南「關西遠征作戰地圖大桌套件」（雕花桌＋3D 圖釘＋捲軸＋羅盤＋羽筆＋燭台！）
    const mapGroup = new THREE.Group();
    mapGroup.position.set(0, 0, 5.2);
    scene.add(mapGroup);

    const mapTex = createDetailedKansaiMapTexture();
    const mapTableTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.1, 0.22, 2.5),
      [oakDark, oakDark, new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.72 }), oakDark, oakDark, oakDark]
    );
    mapTableTop.position.y = 0.94;
    mapTableTop.userData = { clickType: "interactable", targetId: "map-table" };
    clickableMeshes.push(mapTableTop);
    mapGroup.add(mapTableTop);

    // 雕花桌圍裙板與 H 型加固橫樑
    const apron = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.22, 2.05), oakDark);
    apron.position.y = 0.74;
    mapGroup.add(apron);

    const crossBar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 0.18), oakDark);
    crossBar.position.y = 0.26;
    mapGroup.add(crossBar);

    [[-2.1, -0.9], [2.1, -0.9], [-2.1, 0.9], [2.1, 0.9]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.88, 0.28), oakDark);
      leg.position.set(lx, 0.44, lz);
      mapGroup.add(leg);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.36), oakTop);
      foot.position.set(lx, 0.07, lz);
      mapGroup.add(foot);
      const cornerBrass = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.24, 0.26), brassMat);
      cornerBrass.position.set(lx * 1.17, 0.95, lz * 1.28);
      mapGroup.add(cornerBrass);
    });

    // 3D 桌上作戰道具：大阪／京都／奈良立體發光圖釘！
    [[-0.35, 0.05, 0xff3b30], [0.05, -0.18, 0xffcc00], [0.22, 0.12, 0x34c759]].forEach(([px, pz, col]) => {
      const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.28, 6), brassMat);
      needle.position.set(px, 1.18, pz);
      mapGroup.add(needle);
      const pinHead = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 8, 8),
        new THREE.MeshBasicMaterial({ color: col })
      );
      pinHead.position.set(px, 1.34, pz);
      mapGroup.add(pinHead);
    });

    // 迷你紅色小鳥居模型立在京都位置
    const miniToriiL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 6), toriiRed);
    miniToriiL.position.set(0.38, 1.22, -0.35);
    mapGroup.add(miniToriiL);
    const miniToriiR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.34, 6), toriiRed);
    miniToriiR.position.set(0.62, 1.22, -0.35);
    mapGroup.add(miniToriiR);
    const miniToriiTop = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.05, 0.07), toriiRed);
    miniToriiTop.position.set(0.5, 1.39, -0.35);
    mapGroup.add(miniToriiTop);

    // 兩卷紅緞帶羊皮紙捲軸（左側）
    const scrollMat = new THREE.MeshStandardMaterial({ color: 0xf7e3b5, roughness: 0.9 });
    [[-1.85, -0.45, 0.25], [-1.68, -0.25, -0.15]].forEach(([sx, sz, rot]) => {
      const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.78, 10), scrollMat);
      sc.rotation.z = Math.PI / 2;
      sc.rotation.y = rot;
      sc.position.set(sx, 1.14, sz);
      mapGroup.add(sc);
      const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.096, 0.096, 0.1, 10), toriiRed);
      rib.rotation.z = Math.PI / 2;
      rib.rotation.y = rot;
      rib.position.set(sx, 1.14, sz);
      mapGroup.add(rib);
    });

    // 黃銅探險羅盤（右前角）
    const compBody = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.08, 14), brassMat);
    compBody.position.set(1.65, 1.09, 0.58);
    mapGroup.add(compBody);
    const compFace = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.09, 14), new THREE.MeshBasicMaterial({ color: 0xfff8e6 }));
    compFace.position.set(1.65, 1.095, 0.58);
    mapGroup.add(compFace);

    // 墨水瓶與白色羽毛筆（左下角）
    const inkBottle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.18, 8), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }));
    inkBottle.position.set(-1.82, 1.14, 0.62);
    mapGroup.add(inkBottle);
    const quill = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.55, 5), new THREE.MeshBasicMaterial({ color: 0xfffdf5 }));
    quill.position.set(-1.72, 1.38, 0.58);
    quill.rotation.z = -0.35;
    mapGroup.add(quill);

    // 桌上黃銅燭台＋搖曳火光
    const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 10), brassMat);
    holder.position.set(1.92, 1.08, -0.58);
    mapGroup.add(holder);
    const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.32, 8), new THREE.MeshStandardMaterial({ color: 0xfff3d6 }));
    wax.position.set(1.92, 1.24, -0.58);
    mapGroup.add(wax);
    const mapFlame = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 6), new THREE.MeshBasicMaterial({ color: 0xffd24d }));
    mapFlame.position.set(1.92, 1.46, -0.58);
    mapGroup.add(mapFlame);
    candleFlames.push(mapFlame);

    const mapCandleLight = new THREE.PointLight(0xffbe55, 1.4, 7.5);
    mapCandleLight.position.set(1.92, 1.75, -0.58);
    mapGroup.add(mapCandleLight);
    lanternLights.push(mapCandleLight);

    const mapSign = createSignSprite("🗺️ 關西作戰地圖桌", "#245435", "#ffd447");
    mapSign.position.set(0, 2.65, 5.2);
    mapSign.userData = { clickType: "interactable", targetId: "map-table" };
    clickableMeshes.push(mapSign);
    scene.add(mapSign);

    // 11. 🍞 兩張角落 3D 雕花盛宴燭光長桌套件（紅金繡邊桌巾＋四柱雕花桌腳＋麵包蘋果盤＋泡沫杯＋搖曳燭光，無椅子！）
    const feastTableTex = createFeastTableTexture();
    const feastTopMat = new THREE.MeshStandardMaterial({ map: feastTableTex, roughness: 0.72 });
    const breadMat = new THREE.MeshStandardMaterial({ color: 0xd48b3b, roughness: 0.85 });
    const appleMat = new THREE.MeshStandardMaterial({ color: 0xd92626, roughness: 0.35 });
    const platterMat = new THREE.MeshStandardMaterial({ color: 0x733c17, roughness: 0.8 });

    function addFeastTable(tx, tz) {
      const tg = new THREE.Group();
      tg.position.set(tx, 0, tz);
      scene.add(tg);

      // 帶紅金桌巾的精繪橡木桌面
      const top = new THREE.Mesh(
        new THREE.BoxGeometry(2.76, 0.16, 1.66),
        [oakDark, oakDark, feastTopMat, oakDark, oakDark, oakDark]
      );
      top.position.y = 0.88;
      tg.add(top);

      // 桌下圍裙板與 H 型橫樑＋四隻雕花柱腳
      const tApron = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.18, 1.28), oakDark);
      tApron.position.y = 0.72;
      tg.add(tApron);
      const tBeam = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.1, 0.14), oakDark);
      tBeam.position.y = 0.24;
      tg.add(tBeam);

      [[-1.12, -0.58], [1.12, -0.58], [-1.12, 0.58], [1.12, 0.58]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.82, 0.2), oakDark);
        leg.position.set(lx, 0.41, lz);
        tg.add(leg);
        const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.28), oakTop);
        foot.position.set(lx, 0.05, lz);
        tg.add(foot);
      });

      // 中央黃銅燭台＋搖曳火光
      const cHolder = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.06, 10), brassMat);
      cHolder.position.set(0, 0.99, 0);
      tg.add(cHolder);
      const cWax = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0xfff3d6 }));
      cWax.position.set(0, 1.15, 0);
      tg.add(cWax);
      const cFlame = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.16, 6), new THREE.MeshBasicMaterial({ color: 0xffd24d }));
      cFlame.position.set(0, 1.36, 0);
      tg.add(cFlame);
      candleFlames.push(cFlame);

      const cLight = new THREE.PointLight(0xffbe55, 0.95, 6.2);
      cLight.position.set(0, 1.65, 0);
      tg.add(cLight);
      lanternLights.push(cLight);

      // 左側：木製點心托盤＋金黃歐式麵包＋紅蘋果
      const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.34, 0.05, 12), platterMat);
      platter.position.set(-0.78, 0.99, 0.12);
      tg.add(platter);
      const bread = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), breadMat);
      bread.scale.set(1.35, 0.72, 0.9);
      bread.position.set(-0.84, 1.09, 0.08);
      tg.add(bread);
      [[-0.58, 0.2], [-0.66, 0.04]].forEach(([ax, az]) => {
        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 8), appleMat);
        apple.position.set(ax, 1.08, az);
        tg.add(apple);
      });

      // 右側：兩杯泡沫蜂蜜啤酒＋敞開的冒險小筆記本
      [[0.72, -0.22], [0.95, 0.15]].forEach(([mx, mz]) => {
        const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.24, 8), tankardMat);
        mug.position.set(mx, 1.08, mz);
        tg.add(mug);
        const foam = new THREE.Mesh(new THREE.SphereGeometry(0.115, 8, 6), foamMat);
        foam.scale.set(1, 0.55, 1);
        foam.position.set(mx, 1.21, mz);
        tg.add(foam);
      });
      const noteBook = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.32), new THREE.MeshStandardMaterial({ color: 0xfff5db, roughness: 0.9 }));
      noteBook.position.set(0.62, 0.98, 0.36);
      noteBook.rotation.y = -0.28;
      tg.add(noteBook);
    }
    addFeastTable(-8.7, 5.8);
    addFeastTable(8.9, 5.8);

    // 12. 🏛️ 四根雕花橡木公會立柱套件（石磚雙層底座＋鍛鐵木柱＋燕尾公會旗＋鍛鐵暖光提燈！）
    const pillarWoodTex = createPillarWoodTexture();
    const pillarWoodMat = new THREE.MeshStandardMaterial({ map: pillarWoodTex, roughness: 0.82 });
    const bannerTex = createGuildBannerTexture();
    const bannerMat = new THREE.MeshBasicMaterial({ map: bannerTex, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });

    [[-6.3, -3.3], [6.3, -3.3], [-6.3, 3.0], [6.3, 3.0]].forEach(([px, pz]) => {
      const pg = new THREE.Group();
      pg.position.set(px, 0, pz);
      scene.add(pg);

      const inward = px < 0 ? 1 : -1;

      // 雙層石砌柱礎底座
      const baseBottom = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.28, 1.18), stoneBaseMat);
      baseBottom.position.y = 0.14;
      pg.add(baseBottom);
      const baseTop = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.28, 0.96), stoneBaseMat);
      baseTop.position.y = 0.42;
      pg.add(baseTop);

      // 雕花橡木鍛鐵主柱身
      const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.72, 5.1, 0.72), pillarWoodMat);
      shaft.position.y = 3.1;
      pg.add(shaft);

      // 頂部雕花柱頭與四向斜撐木托架 (Corbels)
      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.36, 1.08), oakDark);
      cap.position.y = 5.65;
      pg.add(cap);
      [[0.55, 0, -0.55], [-0.55, 0, 0.55], [0, 0.55, 0.55], [0, -0.55, -0.55]].forEach(([cx, cz, tilt]) => {
        const corbel = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.82, 0.24), oakTop);
        corbel.position.set(cx, 5.15, cz);
        if (cx !== 0) corbel.rotation.z = tilt;
        else corbel.rotation.x = tilt;
        pg.add(corbel);
      });

      // 紅金燕尾公會掛旗（垂掛於面向大廳中軸一側）
      const bannerRod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.88, 8), brassMat);
      bannerRod.rotation.z = Math.PI / 2;
      bannerRod.position.set(0, 4.35, 0.42);
      pg.add(bannerRod);
      const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 1.5), bannerMat);
      bannerMesh.position.set(0, 3.58, 0.41);
      pg.add(bannerMesh);

      // 鍛鐵彎臂＋懸掛式像素提燈＋柔和光暈
      const armBar = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.08, 0.08), ironDarkMat);
      armBar.position.set(inward * 0.62, 3.85, 0);
      pg.add(armBar);
      const armBrace = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.07, 0.07), ironDarkMat);
      armBrace.position.set(inward * 0.5, 3.65, 0);
      armBrace.rotation.z = inward * 0.68;
      pg.add(armBrace);
      const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.32, 6), ironDarkMat);
      chain.position.set(inward * 0.9, 3.66, 0);
      pg.add(chain);

      const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.18, 6), ironDarkMat);
      lanternCap.position.set(inward * 0.9, 3.48, 0);
      pg.add(lanternCap);
      const lanternGlass = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.15, 0.36, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe484 })
      );
      lanternGlass.position.set(inward * 0.9, 3.22, 0);
      pg.add(lanternGlass);
      const lanternBot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.1, 6), ironDarkMat);
      lanternBot.position.set(inward * 0.9, 3.0, 0);
      pg.add(lanternBot);

      const halo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
      }));
      halo.scale.set(1.85, 1.85, 1);
      halo.position.set(inward * 0.9, 3.22, 0);
      pg.add(halo);

      const ll = new THREE.PointLight(0xffbe55, 1.45, 12.5);
      ll.position.set(inward * 0.9, 3.15, 0);
      pg.add(ll);
      lanternLights.push(ll);
    });

    // 13. 🪴 四盆 3D 精雕陶盆常青植栽樹套件（石底托盤＋鍛鐵陶盆＋分枝木幹＋三層立體翠綠樹冠＋星光小燈串與冬果！）
    const potMat = new THREE.MeshStandardMaterial({ color: 0xa84b28, roughness: 0.78 });
    const potRimMat = new THREE.MeshStandardMaterial({ color: 0xbf5d36, roughness: 0.72 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3b2313, roughness: 0.96 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c3418, roughness: 0.9 });
    const leafDeep = new THREE.MeshStandardMaterial({ color: 0x1e5c24, roughness: 0.88 });
    const leafMid = new THREE.MeshStandardMaterial({ color: 0x328236, roughness: 0.86 });
    const leafBright = new THREE.MeshStandardMaterial({ color: 0x57ad44, roughness: 0.82 });
    const berryMat = new THREE.MeshBasicMaterial({ color: 0xe63946 });
    const fairyLightMat = new THREE.MeshBasicMaterial({ color: 0xffe885 });

    [[-16.4, -10.4], [16.2, -10.4], [-16.4, 9.6], [16.2, 9.6]].forEach(([tx, tz], idx) => {
      const pg = new THREE.Group();
      pg.position.set(tx, 0, tz);
      pg.rotation.y = idx * 1.1;
      scene.add(pg);

      // 石板托盤＋厚實滾邊紅陶大花盆＋黃銅箍帶
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 0.1, 10), stoneBaseMat);
      saucer.position.y = 0.05;
      pg.add(saucer);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.46, 0.84, 10), potMat);
      pot.position.y = 0.5;
      pg.add(pot);
      const potRim = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.66, 0.14, 10), potRimMat);
      potRim.position.y = 0.92;
      pg.add(potRim);
      const potBand = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.55, 0.09, 10), brassMat);
      potBand.position.y = 0.58;
      pg.add(potBand);

      // 深色沃土丘
      const soil = new THREE.Mesh(new THREE.SphereGeometry(0.56, 10, 6), soilMat);
      soil.scale.set(1, 0.25, 1);
      soil.position.y = 0.96;
      pg.add(soil);

      // 分枝自然木質主幹與側枝
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 1.35, 8), trunkMat);
      trunk.position.y = 1.52;
      pg.add(trunk);
      [[0.22, 1.85, 0.12, -0.45], [-0.2, 1.72, -0.1, 0.48]].forEach(([bx, by, bz, tilt]) => {
        const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.68, 6), trunkMat);
        br.position.set(bx, by, bz);
        br.rotation.z = tilt;
        pg.add(br);
      });

      // 多層立體翠綠樹冠球簇 (Dodecahedron 柔和像素風葉簇！)
      const puffs = [
        [0, 2.25, 0, 0.72, leafDeep],
        [-0.52, 2.08, 0.25, 0.54, leafDeep],
        [0.54, 2.12, -0.22, 0.52, leafDeep],
        [0.18, 2.16, 0.48, 0.5, leafMid],
        [-0.25, 2.45, -0.35, 0.52, leafMid],
        [0.36, 2.58, 0.18, 0.46, leafMid],
        [-0.18, 2.82, 0.12, 0.42, leafBright],
        [0.1, 3.05, -0.05, 0.34, leafBright]
      ];
      puffs.forEach(([fx, fy, fz, rad, mat]) => {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(rad, 0), mat);
        puff.position.set(fx, fy, fz);
        puff.scale.set(1.08, 0.88, 1.08);
        pg.add(puff);
      });

      // 樹冠上點綴暖金色微光燈珠與冬日小紅果
      [[0.48, 2.35, 0.38, true], [-0.46, 2.48, 0.26, false], [0.16, 2.86, 0.34, true], [-0.28, 2.12, 0.55, false], [0.42, 2.7, -0.22, true], [-0.1, 3.18, 0.16, true]].forEach(([dx, dy, dz, isLight]) => {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(isLight ? 0.06 : 0.055, 6, 6),
          isLight ? fairyLightMat : berryMat
        );
        dot.position.set(dx, dy, dz);
        pg.add(dot);
      });
    });

    // 14. 點地板目標光環
    targetMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.48, 18),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.position.set(0, 0.04, 0);
    targetMarker.visible = false;
    scene.add(targetMarker);

    // 15. 溫暖整體照明
    scene.add(new THREE.AmbientLight(0xffe6c2, 0.96));
    const dirLight = new THREE.DirectionalLight(0xffdfa8, 0.7);
    dirLight.position.set(5, 18, 12);
    scene.add(dirLight);
  }

  // ===========================================================================
  // 建立 9 位家族成員 4 方向精靈角色（含頭頂 😊 微笑氣泡）
  // ===========================================================================
  function buildActors(members) {
    const loader = new THREE.TextureLoader();
    const smileTex = getSmileBubbleTexture();

    members.forEach(m => {
      const group = new THREE.Group();
      const spot = DEFAULT_SPOTS[m.id] || { x: 0, z: 0, dir: "down" };

      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.5, 16),
        new THREE.MeshBasicMaterial({ color: 0x1e0e05, transparent: true, opacity: 0.36 })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.025;
      group.add(shadow);

      const playerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.58, 0.78, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd647, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
      );
      playerRing.rotation.x = -Math.PI / 2;
      playerRing.position.y = 0.032;
      playerRing.visible = (m.id === currentPlayerId);
      group.add(playerRing);

      const tex = loader.load(m.sheet, () => { tex.needsUpdate = true; });
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(0.25, 0.25);
      const initRow = DIR_ROW[spot.dir] || 0;
      tex.offset.set(0, (3 - initRow) * 0.25);

      const spriteMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(1.95, 1.95),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide })
      );
      spriteMesh.position.y = 0.98;
      spriteMesh.rotation.x = -0.22;
      spriteMesh.userData = { clickType: "member", memberId: m.id };
      clickableMeshes.push(spriteMesh);
      group.add(spriteMesh);

      const online = window.isMemberOnline ? window.isMemberOnline(m.id) : (m.id === currentPlayerId);
      const nameTex = createNameTagSprite(m.name, online, m.id === currentPlayerId, m.inOsakaTrip);
      const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true, depthTest: false }));
      nameSprite.scale.set(1.85, 0.49, 1);
      nameSprite.position.y = 2.25;
      nameSprite.renderOrder = 15;
      nameSprite.userData = { clickType: "member", memberId: m.id };
      clickableMeshes.push(nameSprite);
      group.add(nameSprite);

      const smileSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: smileTex, transparent: true, opacity: 0, depthTest: false
      }));
      smileSprite.scale.set(1.2, 1.2, 1);
      smileSprite.position.y = 3.05;
      smileSprite.visible = false;
      smileSprite.renderOrder = 25;
      group.add(smileSprite);

      group.position.set(spot.x, 0, spot.z);
      scene.add(group);

      actorMap[m.id] = {
        member: m,
        group,
        spriteMesh,
        tex,
        nameSprite,
        smileSprite,
        playerRing,
        x: spot.x,
        z: spot.z,
        dir: spot.dir,
        frame: 0,
        walkTimer: 0,
        moving: false,
        smileUntil: 0,
        smileStartedAt: 0,
        lastTagKey: `${online}_${m.id === currentPlayerId}`
      };
    });
  }

  function triggerSmileOnActor(memberId) {
    const actor = actorMap[memberId];
    if (!actor) return;
    const now = performance.now();
    actor.smileStartedAt = now;
    actor.smileUntil = now + 2600;
    actor.smileSprite.visible = true;
    actor.smileSprite.material.opacity = 1;
  }

  function setActorSpriteFrame(actor, dir, frame) {
    const row = DIR_ROW[dir] ?? 0;
    const col = frame % 4;
    actor.tex.offset.set(col * 0.25, (3 - row) * 0.25);
  }

  function collides(nx, nz) {
    const r = 0.48;
    if (nx < ROOM_BOUNDS.minX || nx > ROOM_BOUNDS.maxX || nz < ROOM_BOUNDS.minZ || nz > ROOM_BOUNDS.maxZ) {
      return true;
    }
    for (const o of OBSTACLES) {
      if (nx + r > o.minX && nx - r < o.maxX && nz + r > o.minZ && nz - r < o.maxZ) {
        return true;
      }
    }
    return false;
  }

  function updateNearbyPrompt() {
    const player = actorMap[currentPlayerId];
    if (!player) return;

    let best = null;
    let bestDist = Infinity;

    for (const obj of INTERACTABLES) {
      const d = Math.hypot(player.x - obj.x, player.z - obj.z);
      if (d <= obj.radius && d < bestDist) {
        bestDist = d;
        best = obj;
      }
    }

    if (!best) {
      Object.values(actorMap).forEach(other => {
        if (other.member.id === currentPlayerId) return;
        const d = Math.hypot(player.x - other.x, player.z - other.z);
        if (d <= 2.2 && d < bestDist) {
          bestDist = d;
          best = {
            id: "smile-" + other.member.id,
            type: "member",
            title: `${other.member.name}`,
            actionLabel: `😊 跟 ${other.member.name} 打招呼`,
            trigger: () => {
              triggerSmileOnActor(other.member.id);
              triggerSmileOnActor(currentPlayerId);
            }
          };
        }
      });
    }

    nearestTarget = best;
    const btn = document.getElementById("tavern-interact-btn");
    const hint = document.getElementById("tavern-nearby-hint");
    if (!btn || !hint) return;

    if (best) {
      btn.style.display = "inline-flex";
      btn.textContent = best.actionLabel;
      hint.textContent = `✨ 附近：${best.title}`;
    } else {
      btn.style.display = "none";
      hint.textContent = "🕹️ 拖曳滑動自由逛大廳 ｜ 點設施互動 ｜ 點家人微笑 😊";
    }
  }

  // ===========================================================================
  // 主迴圈 (60 FPS)
  // ===========================================================================
  function tick(now) {
    requestAnimationFrame(tick);
    if (!isActiveTab) {
      lastFrameTime = now;
      return;
    }

    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    elapsed += dt;

    if (fireLight) {
      fireLight.intensity = 3.4 + Math.sin(elapsed * 9.5) * 0.45 + Math.cos(elapsed * 15.2) * 0.22;
    }
    fireParticles.forEach(p => {
      const u = p.userData;
      p.position.y = 0.45 + ((elapsed * u.speed + u.phase) % 0.95);
      p.position.x = u.baseX + Math.sin(elapsed * 5 + u.phase) * 0.12;
      const s = 1 - ((p.position.y - 0.45) / 1.05);
      p.scale.setScalar(Math.max(0.25, s));
    });
    lanternLights.forEach((ll, i) => {
      ll.intensity = 1.35 + Math.sin(elapsed * 3.5 + i * 1.4) * 0.14;
    });
    chestSparkles.forEach(sp => {
      const u = sp.userData;
      sp.position.y = 0.95 + ((elapsed * u.speed + u.phase) % 1.15);
      sp.position.x = u.baseX + Math.sin(elapsed * 2.5 + u.phase) * 0.12;
      sp.rotation.y = elapsed * 3.0;
    });
    candleFlames.forEach((fl, i) => {
      fl.scale.set(1, 0.85 + Math.sin(elapsed * 12 + i) * 0.22, 1);
    });
    if (osakaRing) osakaRing.rotation.z = elapsed * 0.7;
    if (futureRing) futureRing.rotation.z = -elapsed * 0.6;
    if (targetMarker && targetMarker.visible) {
      const sc = 0.85 + Math.sin(elapsed * 8) * 0.15;
      targetMarker.scale.set(sc, sc, 1);
    }

    const player = actorMap[currentPlayerId];
    if (player) {
      let dx = 0, dz = 0;
      let speedScale = 1;

      if (keys.up) dz -= 1;
      if (keys.down) dz += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      if (dx !== 0 || dz !== 0) {
        walkGoal = null;
        if (targetMarker) targetMarker.visible = false;
      } else if (Math.abs(joyVec.x) > 0.04 || Math.abs(joyVec.z) > 0.04) {
        dx = joyVec.x;
        dz = joyVec.z;
        speedScale = Math.min(1, Math.hypot(dx, dz));
        walkGoal = null;
        if (targetMarker) targetMarker.visible = false;
      } else if (walkGoal) {
        const gx = walkGoal.x - player.x;
        const gz = walkGoal.z - player.z;
        const dist = Math.hypot(gx, gz);
        if (dist < 0.28) {
          const cb = walkGoal.onArrive;
          walkGoal = null;
          if (targetMarker) targetMarker.visible = false;
          if (typeof cb === "function") cb();
        } else {
          dx = gx / dist;
          dz = gz / dist;
        }
      }

      const moving = (dx !== 0 || dz !== 0);
      if (moving) {
        const len = Math.hypot(dx, dz);
        const speed = 5.4 * Math.max(0.35, speedScale);
        const stepX = (dx / len) * speed * dt;
        const stepZ = (dz / len) * speed * dt;

        const prevX = player.x;
        const prevZ = player.z;
        if (!collides(player.x + stepX, player.z)) player.x += stepX;
        if (!collides(player.x, player.z + stepZ)) player.z += stepZ;

        if (walkGoal && Math.hypot(player.x - prevX, player.z - prevZ) < 0.005) {
          walkGoal = null;
          if (targetMarker) targetMarker.visible = false;
        }

        if (Math.abs(dx) >= Math.abs(dz)) {
          player.dir = dx > 0 ? "right" : "left";
        } else {
          player.dir = dz > 0 ? "down" : "up";
        }

        player.walkTimer += dt;
        if (player.walkTimer >= 0.13) {
          player.walkTimer = 0;
          player.frame = (player.frame + 1) % 4;
        }
        player.moving = true;
      } else {
        if (player.moving) pushPositionToCloud(player, false);
        player.moving = false;
        player.frame = 0;
        player.walkTimer = 0;
      }

      player.group.position.set(player.x, 0, player.z);
      setActorSpriteFrame(player, player.dir, player.frame);

      if (player.moving && now - lastSyncSent > 250) {
        lastSyncSent = now;
        pushPositionToCloud(player, true);
      }

      // 攝影機平滑跟隨（寬敞大廳舒適視野）
      const camTargetX = player.x * 0.72;
      const camTargetZ = player.z * 0.72 + 12.6;
      camera.position.x += (camTargetX - camera.position.x) * Math.min(1, dt * 5);
      camera.position.z += (camTargetZ - camera.position.z) * Math.min(1, dt * 5);
      camera.lookAt(player.x * 0.8, 1.0, player.z * 0.8 - 1.0);
    }

    Object.values(actorMap).forEach(actor => {
      if (actor.member.id !== currentPlayerId) {
        const remote = remotePositions[actor.member.id];
        const isOnline = window.isMemberOnline ? window.isMemberOnline(actor.member.id) : false;

        if (remote && isOnline && (Date.now() - (remote.t || 0) < 600000)) {
          const ddx = remote.x - actor.x;
          const ddz = remote.z - actor.z;
          const dist = Math.hypot(ddx, ddz);
          if (dist > 0.08) {
            actor.x += ddx * Math.min(1, dt * 6);
            actor.z += ddz * Math.min(1, dt * 6);
            actor.dir = remote.dir || actor.dir;
            actor.walkTimer += dt;
            if (actor.walkTimer >= 0.16) {
              actor.walkTimer = 0;
              actor.frame = (actor.frame + 1) % 4;
            }
          } else {
            actor.dir = remote.dir || actor.dir;
            actor.frame = 0;
          }
          actor.group.position.set(actor.x, 0, actor.z);
          setActorSpriteFrame(actor, actor.dir, actor.frame);
        } else {
          actor.frame = 0;
          setActorSpriteFrame(actor, actor.dir, 0);
        }
      }

      if (actor.smileUntil > now) {
        const age = (now - actor.smileStartedAt) / 1000;
        const remain = (actor.smileUntil - now) / 1000;
        actor.smileSprite.visible = true;
        actor.smileSprite.position.y = 3.12 + Math.sin(age * 6) * 0.12;
        actor.smileSprite.material.opacity = remain < 0.45 ? Math.max(0, remain / 0.45) : 1;
        const hop = age < 0.35 ? Math.sin((age / 0.35) * Math.PI) * 0.25 : 0;
        actor.spriteMesh.position.y = 0.98 + hop;
      } else if (actor.smileSprite.visible) {
        actor.smileSprite.visible = false;
        actor.spriteMesh.position.y = 0.98;
      }
    });

    updateNearbyPrompt();
    renderer.render(scene, camera);
  }

  function pushPositionToCloud(player, moving) {
    if (window.syncTavernPosition) {
      window.syncTavernPosition(currentPlayerId, {
        x: Math.round(player.x * 100) / 100,
        z: Math.round(player.z * 100) / 100,
        dir: player.dir,
        moving: !!moving,
        t: Date.now()
      });
    }
  }

  function bindInputs(canvasEl) {
    function isTyping() {
      const tag = document.activeElement && document.activeElement.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }

    window.addEventListener("keydown", e => {
      if (!isActiveTab || isTyping()) return;
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") { keys.up = true; e.preventDefault(); }
      else if (k === "arrowdown" || k === "s") { keys.down = true; e.preventDefault(); }
      else if (k === "arrowleft" || k === "a") { keys.left = true; e.preventDefault(); }
      else if (k === "arrowright" || k === "d") { keys.right = true; e.preventDefault(); }
      else if ((k === "enter" || k === " ") && nearestTarget) {
        e.preventDefault();
        nearestTarget.trigger();
      }
    });

    window.addEventListener("keyup", e => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") keys.up = false;
      if (k === "arrowdown" || k === "s") keys.down = false;
      if (k === "arrowleft" || k === "a") keys.left = false;
      if (k === "arrowright" || k === "d") keys.right = false;
    });

    const interactBtn = document.getElementById("tavern-interact-btn");
    if (interactBtn) {
      interactBtn.addEventListener("click", () => {
        if (nearestTarget) nearestTarget.trigger();
      });
    }

    const shell = document.getElementById("tavern-stage-shell");
    const joyBase = document.getElementById("floating-joy-base");
    const joyKnob = document.getElementById("floating-joy-knob");
    const DRAG_THRESHOLD = 12;
    const JOY_MAX_RADIUS = 44;

    function hideJoystick() {
      joyVec.x = 0;
      joyVec.z = 0;
      activePointer = null;
      if (joyBase) joyBase.style.display = "none";
      if (joyKnob) joyKnob.style.transform = "translate(0px, 0px)";
    }

    function handleTapAt(clientX, clientY) {
      if (!isActiveTab || !renderer || !camera || !floorMesh) return;
      const rect = canvasEl.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);

      const objHits = raycaster.intersectObjects(clickableMeshes, false);
      if (objHits.length > 0) {
        const meta = objHits[0].object.userData;
        if (meta && meta.clickType === "member") {
          triggerSmileOnActor(meta.memberId);
          if (meta.memberId !== currentPlayerId) {
            const p = actorMap[currentPlayerId];
            const t = actorMap[meta.memberId];
            if (p && t && Math.hypot(p.x - t.x, p.z - t.z) < 5.0) {
              triggerSmileOnActor(currentPlayerId);
            }
          }
          return;
        }
        if (meta && meta.clickType === "interactable") {
          const obj = INTERACTABLES.find(i => i.id === meta.targetId);
          if (obj) {
            const p = actorMap[currentPlayerId];
            if (p && Math.hypot(p.x - obj.x, p.z - obj.z) <= obj.radius + 0.6) {
              obj.trigger();
            } else {
              walkGoal = { x: obj.walkX, z: obj.walkZ, onArrive: () => obj.trigger() };
              if (targetMarker) {
                targetMarker.position.set(obj.walkX, 0.04, obj.walkZ);
                targetMarker.visible = true;
              }
            }
          }
          return;
        }
      }

      const floorHits = raycaster.intersectObject(floorMesh);
      if (floorHits.length > 0) {
        const pt = floorHits[0].point;
        const gx = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, pt.x));
        const gz = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, pt.z));
        walkGoal = { x: gx, z: gz };
        if (targetMarker) {
          targetMarker.position.set(gx, 0.04, gz);
          targetMarker.visible = true;
        }
      }
    }

    canvasEl.addEventListener("pointerdown", e => {
      if (!isActiveTab || activePointer) return;
      e.preventDefault();
      activePointer = { id: e.pointerId, startX: e.clientX, startY: e.clientY, dragging: false };
      try { canvasEl.setPointerCapture(e.pointerId); } catch (_) {}
    });

    canvasEl.addEventListener("pointermove", e => {
      if (!activePointer || e.pointerId !== activePointer.id) return;
      const dx = e.clientX - activePointer.startX;
      const dy = e.clientY - activePointer.startY;
      const dist = Math.hypot(dx, dy);

      if (!activePointer.dragging && dist > DRAG_THRESHOLD) {
        activePointer.dragging = true;
        if (joyBase && shell) {
          const sRect = shell.getBoundingClientRect();
          joyBase.style.left = `${activePointer.startX - sRect.left}px`;
          joyBase.style.top = `${activePointer.startY - sRect.top}px`;
          joyBase.style.display = "block";
        }
      }

      if (activePointer.dragging) {
        const clamped = Math.min(dist, JOY_MAX_RADIUS);
        const angle = Math.atan2(dy, dx);
        const kx = Math.cos(angle) * clamped;
        const ky = Math.sin(angle) * clamped;
        if (joyKnob) joyKnob.style.transform = `translate(${kx}px, ${ky}px)`;
        joyVec.x = kx / JOY_MAX_RADIUS;
        joyVec.z = ky / JOY_MAX_RADIUS;
      }
    });

    canvasEl.addEventListener("pointerup", e => {
      if (!activePointer || e.pointerId !== activePointer.id) return;
      const wasDragging = activePointer.dragging;
      try { canvasEl.releasePointerCapture(e.pointerId); } catch (_) {}
      hideJoystick();
      if (!wasDragging) handleTapAt(e.clientX, e.clientY);
    });

    canvasEl.addEventListener("pointercancel", e => {
      if (!activePointer || e.pointerId !== activePointer.id) return;
      try { canvasEl.releasePointerCapture(e.pointerId); } catch (_) {}
      hideJoystick();
    });
  }

  function handleResize() {
    const wrap = document.getElementById("tavern-canvas-wrap");
    if (!wrap || !renderer || !camera) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    }
  }

  window.TavernEngine = {
    init(members, initialMemberId) {
      if (initialized) return;
      const wrap = document.getElementById("tavern-canvas-wrap");
      if (!wrap) return;

      if (typeof THREE === "undefined") {
        wrap.innerHTML = `<div style="padding:24px; text-align:center; color:#fce7b8;">⚠️ 無法載入 Three.js，請直接點下方按鈕進入大阪冒險！</div>`;
        return;
      }

      currentPlayerId = initialMemberId || "yenting";

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1b110b);
      scene.fog = new THREE.Fog(0x1b110b, 26, 54);

      const w = wrap.clientWidth || 640;
      const h = wrap.clientHeight || 450;
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
      camera.position.set(0, 11.4, 13.4);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      wrap.appendChild(renderer.domElement);

      raycaster = new THREE.Raycaster();

      buildTavernEnvironment();
      buildActors(members);
      bindInputs(renderer.domElement);

      window.addEventListener("resize", handleResize);
      initialized = true;
      lastFrameTime = performance.now();
      tick(lastFrameTime);
    },

    isInitialized() {
      return initialized;
    },

    setCurrentMember(memberId) {
      currentPlayerId = memberId;
      walkGoal = null;
      if (targetMarker) targetMarker.visible = false;
      this.refreshTags();
    },

    refreshTags() {
      if (!initialized) return;
      Object.values(actorMap).forEach(actor => {
        const m = actor.member;
        const isCurrent = m.id === currentPlayerId;
        const online = window.isMemberOnline ? window.isMemberOnline(m.id) : isCurrent;
        actor.playerRing.visible = isCurrent;
        const key = `${online}_${isCurrent}`;
        if (actor.lastTagKey !== key) {
          actor.lastTagKey = key;
          const oldMap = actor.nameSprite.material.map;
          actor.nameSprite.material.map = createNameTagSprite(m.name, online, isCurrent, m.inOsakaTrip);
          actor.nameSprite.material.needsUpdate = true;
          if (oldMap) oldMap.dispose();
        }
      });
    },

    updateRemotePositions(data) {
      remotePositions = data || {};
    },

    setActive(active) {
      isActiveTab = !!active;
      joyVec.x = 0;
      joyVec.z = 0;
      activePointer = null;
      const jb = document.getElementById("floating-joy-base");
      if (jb) jb.style.display = "none";
      if (active) {
        keys.up = keys.down = keys.left = keys.right = false;
        setTimeout(handleResize, 30);
      }
    },

    walkToPortal(portalId) {
      const obj = INTERACTABLES.find(i => i.id === portalId);
      if (!obj || !initialized) return;
      walkGoal = { x: obj.walkX, z: obj.walkZ, onArrive: () => obj.trigger() };
      if (targetMarker) {
        targetMarker.position.set(obj.walkX, 0.04, obj.walkZ);
        targetMarker.visible = true;
      }
    }
  };
})();
