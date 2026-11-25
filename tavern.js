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

  // 9 位家族成員在 38×26 大廳裡的寬敞站位（每個人都有超大活動空間！）
  const DEFAULT_SPOTS = {
    yenting:  { x:  0.0, z:  0.8, dir: "down" },
    chinghua: { x: -10.5, z: -2.4, dir: "right" },
    naichi:   { x: -4.2, z: -1.8, dir: "down" },
    tingyin:  { x: -10.2, z:  2.0, dir: "right" },
    qinyan:   { x:  0.0, z:  8.4, dir: "up" },
    qianyi:   { x:  4.2, z: -1.6, dir: "down" },
    chanchi:  { x: 11.4, z: -5.2, dir: "left" },
    yanyi:    { x: -2.4, z: -6.6, dir: "down" },
    beichen:  { x: 11.8, z:  3.8, dir: "left" }
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

  // 半木結構＋拱形星空冬夜窗＋壁燈牆面貼圖
  function createRichWallTexture() {
    return makePixelCanvasTexture(256, 128, (ctx, w, h) => {
      // 上部溫暖奶油灰泥（含微粒質感）
      ctx.fillStyle = "#ecd3a0";
      ctx.fillRect(0, 0, w, 78);
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = i % 2 ? "rgba(180,126,64,0.12)" : "rgba(255,248,224,0.18)";
        ctx.fillRect((i * 37) % w, (i * 19) % 76, 4, 3);
      }

      // 橫向與垂直深橡木樑
      ctx.fillStyle = "#5c2b0e";
      ctx.fillRect(0, 0, w, 10);
      ctx.fillStyle = "#8a481c";
      ctx.fillRect(0, 2, w, 5);
      // 垂直大樑
      [0, 124, 244].forEach(bx => {
        ctx.fillStyle = "#4d2109";
        ctx.fillRect(bx, 0, 12, h);
        ctx.fillStyle = "#7c3c14";
        ctx.fillRect(bx + 2, 0, 7, h);
        ctx.fillStyle = "#a15826";
        ctx.fillRect(bx + 3, 0, 2, h);
      });

      // 拱形冬夜星空窗（左、右各一扇）
      [34, 158].forEach(wx => {
        ctx.fillStyle = "#4a2009";
        ctx.fillRect(wx - 4, 20, 64, 52);
        ctx.fillStyle = "#192d4f";
        ctx.fillRect(wx, 24, 56, 44);
        // 漸層夜空
        ctx.fillStyle = "#244370";
        ctx.fillRect(wx, 44, 56, 24);
        // 像素星星與彎月
        ctx.fillStyle = "#fff5b8";
        ctx.fillRect(wx + 10, 30, 3, 3);
        ctx.fillRect(wx + 42, 34, 2, 2);
        ctx.fillRect(wx + 24, 42, 2, 2);
        ctx.fillRect(wx + 45, 50, 3, 3);
        ctx.fillStyle = "#ffe580";
        ctx.fillRect(wx + 36, 28, 7, 7);
        ctx.fillStyle = "#192d4f";
        ctx.fillRect(wx + 39, 28, 5, 5);
        // 窗格十字木條
        ctx.fillStyle = "#6e3412";
        ctx.fillRect(wx + 26, 24, 4, 44);
        ctx.fillRect(wx, 44, 56, 4);
        // 窗台
        ctx.fillStyle = "#8c4a1d";
        ctx.fillRect(wx - 6, 68, 68, 6);
      });

      // 中央暖光壁燈
      ctx.fillStyle = "rgba(255, 204, 82, 0.25)";
      ctx.beginPath(); ctx.arc(130, 36, 22, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#3e1c08";
      ctx.fillRect(126, 28, 8, 14);
      ctx.fillStyle = "#ffe47a";
      ctx.fillRect(128, 30, 4, 9);

      // 下部雕花橡木護牆板
      ctx.fillStyle = "#6b3311";
      ctx.fillRect(0, 78, w, 50);
      ctx.fillStyle = "#421b06";
      ctx.fillRect(0, 76, w, 4);
      ctx.fillStyle = "#b0652d";
      ctx.fillRect(0, 80, w, 3);
      for (let x = 16; x < w - 12; x += 26) {
        if (Math.abs(x - 124) < 14) continue;
        ctx.fillStyle = "#54250a";
        ctx.fillRect(x, 86, 20, 34);
        ctx.fillStyle = "#824119";
        ctx.fillRect(x + 2, 88, 16, 30);
        ctx.fillStyle = "#995124";
        ctx.fillRect(x + 4, 90, 12, 26);
      }
    }, 6, 1);
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

  // 🗺️ 日本關西冒險作戰地圖桌貼圖
  function createJapanMapTableTexture() {
    return makePixelCanvasTexture(220, 140, (ctx, w, h) => {
      // 深橡木桌邊框
      ctx.fillStyle = "#5c2b0e";
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#9c5624";
      ctx.fillRect(5, 5, w - 10, h - 10);
      // 羊皮紙海圖底色
      ctx.fillStyle = "#f7dfa8";
      ctx.fillRect(14, 14, w - 28, h - 28);
      ctx.strokeStyle = "#a65e26";
      ctx.lineWidth = 2;
      ctx.strokeRect(18, 18, w - 36, h - 36);
      // 淺藍海洋背景
      ctx.fillStyle = "#b9dff0";
      ctx.fillRect(22, 22, w - 44, h - 44);
      // 像素日本列島剪影（九州、四國、本州、北海道）
      ctx.fillStyle = "#76b852";
      ctx.fillRect(42, 82, 18, 22); // 九州
      ctx.fillRect(64, 84, 20, 14); // 四國
      ctx.fillRect(56, 62, 74, 20); // 西日本～中部
      ctx.fillRect(118, 42, 28, 34); // 關東～東北
      ctx.fillRect(148, 26, 30, 22); // 北海道
      // 關西大阪紅金星星標記！
      ctx.fillStyle = "#e03124";
      ctx.beginPath(); ctx.arc(88, 74, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffe066";
      ctx.beginPath(); ctx.arc(88, 74, 3.5, 0, Math.PI * 2); ctx.fill();
      // 虛線航線（台灣飛大阪）
      ctx.strokeStyle = "#c9382b";
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(28, 112); ctx.quadraticCurveTo(60, 102, 86, 76); ctx.stroke();
    });
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

    // 紅金羅盤公會大地毯（中央）
    const rugTex = createGrandRugTexture();
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 7.2),
      new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 })
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

    // 2. 四周高質感半木拱窗木牆
    const wallTex = createRichWallTexture();
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.88 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(38.4, 6.2, 0.5), wallMat);
    backWall.position.set(0, 3.1, -12.4);
    scene.add(backWall);

    const sideWallMat = new THREE.MeshStandardMaterial({ color: 0x693414, roughness: 0.92 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 26.4), sideWallMat);
    leftWall.position.set(-18.8, 3.1, 0.4);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 6.2, 26.4), sideWallMat);
    rightWall.position.set(18.8, 3.1, 0.4);
    scene.add(rightWall);

    // 3. 🔥 北牆正中央：石砌大壁爐 ＋ 家族遠征大合照壁畫！
    const fpTex = createFireplaceTexture();
    const hearth = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 3.8, 1.3),
      new THREE.MeshStandardMaterial({ map: fpTex, roughness: 0.92 })
    );
    hearth.position.set(0, 1.9, -11.5);
    scene.add(hearth);

    const chimney = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.6, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x69645e, roughness: 0.95 })
    );
    chimney.position.set(0, 4.9, -11.6);
    scene.add(chimney);

    // 壁爐上方懸掛「2027 家族機場大合照」金框畫！
    const groupPhotoTex = texLoader.load("avatars/day1_group.jpg");
    groupPhotoTex.colorSpace = THREE.SRGBColorSpace;
    const frameBox = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 2.0, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.45, metalness: 0.25 })
    );
    frameBox.position.set(0, 4.85, -10.95);
    scene.add(frameBox);

    const photoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 1.72),
      new THREE.MeshBasicMaterial({ map: groupPhotoTex })
    );
    photoPlane.position.set(0, 4.85, -10.86);
    scene.add(photoPlane);

    // 火焰發光粒子
    const flameColors = [0xff5500, 0xff9900, 0xffdd33];
    for (let i = 0; i < 12; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.34, 0.3),
        new THREE.MeshBasicMaterial({ color: flameColors[i % flameColors.length] })
      );
      p.position.set((Math.random() - 0.5) * 1.4, 0.45 + Math.random() * 0.85, -10.75);
      p.userData = { baseX: p.position.x, phase: Math.random() * Math.PI * 2, speed: 2.2 + Math.random() * 2.2 };
      scene.add(p);
      fireParticles.push(p);
    }
    fireLight = new THREE.PointLight(0xff842c, 3.8, 20);
    fireLight.position.set(0, 1.8, -9.6);
    scene.add(fireLight);

    // 4. 📚 壁爐兩側高大冒險書櫃
    const shelfTex = createBookshelfTexture();
    const shelfMat = new THREE.MeshStandardMaterial({ map: shelfTex, roughness: 0.88 });
    [-3.1, 3.1].forEach(bx => {
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 3.4, 0.75), shelfMat);
      shelf.position.set(bx, 1.7, -11.75);
      scene.add(shelf);
    });

    // 5. 📜 公會情報佈告欄（北牆偏左）
    const boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.3, 2.2, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x5c2b0e, roughness: 0.85 })
    );
    boardFrame.position.set(-5.8, 2.4, -12.05);
    boardFrame.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(boardFrame);
    scene.add(boardFrame);

    const cork = new THREE.Mesh(
      new THREE.BoxGeometry(2.9, 1.8, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xd4a46a, roughness: 0.95 })
    );
    cork.position.set(-5.8, 2.4, -12.04);
    cork.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(cork);
    scene.add(cork);

    const noteColors = [0xfff6d6, 0xffe4b3, 0xd8f5c4, 0xffd6cc, 0xd9f0ff];
    [[-6.5, 2.75], [-5.8, 2.65], [-5.0, 2.72], [-6.2, 2.02], [-5.3, 2.05]].forEach((pos, idx) => {
      const note = new THREE.Mesh(
        new THREE.BoxGeometry(0.54, 0.48, 0.05),
        new THREE.MeshStandardMaterial({ color: noteColors[idx % noteColors.length] })
      );
      note.position.set(pos[0], pos[1], -11.88);
      scene.add(note);
    });

    const boardSign = createSignSprite("📜 公會情報佈告欄", "#5c2b0e", "#e8b45a");
    boardSign.position.set(-5.8, 4.15, -11.6);
    boardSign.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(boardSign);
    scene.add(boardSign);

    // 6. 🧰 公會黃金寶箱展示台（西北角，點了直達寶箱頁！）
    const chestMat = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x5c2a6b, roughness: 0.95 })
    );
    chestMat.rotation.x = -Math.PI / 2;
    chestMat.position.set(-9.7, 0.016, -7.7);
    scene.add(chestMat);

    const chestBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.85, 1.0),
      new THREE.MeshStandardMaterial({ color: 0x8a481b, roughness: 0.7 })
    );
    chestBase.position.set(-9.7, 0.45, -7.7);
    chestBase.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(chestBase);
    scene.add(chestBase);

    const chestLid = new THREE.Mesh(
      new THREE.BoxGeometry(1.58, 0.34, 1.06),
      new THREE.MeshStandardMaterial({ color: 0xb05d22, roughness: 0.65 })
    );
    chestLid.position.set(-9.7, 1.0, -7.7);
    chestLid.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(chestLid);
    scene.add(chestLid);

    const chestGoldBand = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.2, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xffd147, emissive: 0x5c3a00, roughness: 0.35 })
    );
    chestGoldBand.position.set(-9.7, 0.84, -7.7);
    chestGoldBand.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(chestGoldBand);
    scene.add(chestGoldBand);

    const chestSign = createSignSprite("🧰 戰利品寶箱台", "#6b2d6b", "#ffd447");
    chestSign.position.set(-9.7, 2.35, -7.7);
    chestSign.userData = { clickType: "interactable", targetId: "guild-chest" };
    clickableMeshes.push(chestSign);
    scene.add(chestSign);

    // 7. 🏯「2027 大阪關西冒險」鳥居傳送門（北牆右側＋大阪城暮光主視覺）
    const toriiRed = new THREE.MeshStandardMaterial({ color: 0xc92a22, roughness: 0.6 });
    const toriiDark = new THREE.MeshStandardMaterial({ color: 0x26140d, roughness: 0.8 });
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

    // 鳥居門內：精繪大阪城暮光星空畫作！
    const osakaArtTex = createOsakaPortalArtTexture();
    osakaCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(3.0, 3.25),
      new THREE.MeshBasicMaterial({ map: osakaArtTex, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
    );
    osakaCurtain.position.set(9.2, 1.65, -11.25);
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

    // 9. 🍻 西側豪華酒館大吧檯 ＋ 魔藥酒瓶展示壁架 ＋ 橡木桶
    const oakDark = new THREE.MeshStandardMaterial({ color: 0x5c2e12, roughness: 0.85 });
    const oakTop = new THREE.MeshStandardMaterial({ color: 0xa6622b, roughness: 0.7 });

    const barBody = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.2, 9.8), oakDark);
    barBody.position.set(-14.2, 0.6, -0.5);
    barBody.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barBody);
    scene.add(barBody);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 10.1), oakTop);
    barTop.position.set(-14.2, 1.3, -0.5);
    barTop.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barTop);
    scene.add(barTop);

    // 吧檯後方魔藥瓶壁架
    const barShelfTex = createBarShelfTexture();
    const barShelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 3.2, 7.6),
      new THREE.MeshStandardMaterial({ map: barShelfTex, roughness: 0.85 })
    );
    barShelf.position.set(-18.2, 2.5, -0.5);
    scene.add(barShelf);

    for (let i = 0; i < 5; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.52, 0.52, 1.15, 10),
        new THREE.MeshStandardMaterial({ color: 0x7c431c, roughness: 0.85 })
      );
      barrel.position.set(-16.8, 0.58, -4.1 + i * 1.8);
      scene.add(barrel);
    }

    const mugMat = new THREE.MeshStandardMaterial({ color: 0xf6c453, roughness: 0.38 });
    [[-13.8, -3.2], [-13.9, -0.8], [-13.7, 1.2], [-13.8, 2.8]].forEach(([mx, mz]) => {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.28, 8), mugMat);
      mug.position.set(mx, 1.54, mz);
      scene.add(mug);
    });

    const barSign = createSignSprite("🍻 冒險者酒館吧檯", "#6e3814", "#f5be4f");
    barSign.position.set(-14.2, 3.2, -0.5);
    barSign.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barSign);
    scene.add(barSign);

    // 10. 🗺️ 中央偏南「日本關西作戰地圖大桌」（無椅子！點了看行程）
    const mapTex = createJapanMapTableTexture();
    const mapTableTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.8, 0.18, 2.2),
      [oakDark, oakDark, new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.78 }), oakDark, oakDark, oakDark]
    );
    mapTableTop.position.set(0, 0.92, 5.2);
    mapTableTop.userData = { clickType: "interactable", targetId: "map-table" };
    clickableMeshes.push(mapTableTop);
    scene.add(mapTableTop);

    [[-1.8, 4.5], [1.8, 4.5], [-1.8, 5.9], [1.8, 5.9]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.9, 0.24), oakDark);
      leg.position.set(lx, 0.45, lz);
      scene.add(leg);
    });

    const mapSign = createSignSprite("🗺️ 關西作戰地圖桌", "#245435", "#ffd447");
    mapSign.position.set(0, 2.35, 5.2);
    mapSign.userData = { clickType: "interactable", targetId: "map-table" };
    clickableMeshes.push(mapSign);
    scene.add(mapSign);

    // 11. 兩張角落燭光長桌（無椅子，清爽點綴）
    function addCandleTable(tx, tz) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.16, 1.6), oakTop);
      top.position.set(tx, 0.88, tz);
      scene.add(top);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.86, 0.65), oakDark);
      leg.position.set(tx, 0.43, tz);
      scene.add(leg);
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.09, 0.28, 6),
        new THREE.MeshBasicMaterial({ color: 0xffeb99 })
      );
      candle.position.set(tx, 1.1, tz);
      scene.add(candle);
    }
    addCandleTable(-8.7, 5.8);
    addCandleTable(8.9, 5.8);

    // 12. 🏮 四根公會大廳木柱＋暖光懸掛燈籠
    [[-6.3, -3.3], [6.3, -3.3], [-6.3, 3.0], [6.3, 3.0]].forEach(([px, pz]) => {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.65, 5.8, 0.65), oakDark);
      col.position.set(px, 2.9, pz);
      scene.add(col);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.35, 0.82), oakTop);
      trim.position.set(px, 0.2, pz);
      scene.add(trim);
      // 柱旁懸掛暖黃燈籠
      const lantern = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.44, 0.32),
        new THREE.MeshBasicMaterial({ color: 0xffe07a })
      );
      lantern.position.set(px + (px < 0 ? 0.55 : -0.55), 3.3, pz);
      scene.add(lantern);
      const ll = new THREE.PointLight(0xffbe55, 1.25, 11);
      ll.position.set(px + (px < 0 ? 0.7 : -0.7), 3.2, pz);
      scene.add(ll);
      lanternLights.push(ll);
    });

    // 13. 🪴 四盆室內大盆栽松樹（四角綠意點綴）
    const potMat = new THREE.MeshStandardMaterial({ color: 0x9e4c2a, roughness: 0.85 });
    const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2f7025, roughness: 0.9 });
    const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x459436, roughness: 0.9 });
    [[-16.4, -10.4], [16.2, -10.4], [-16.4, 9.6], [16.2, 9.6]].forEach(([tx, tz]) => {
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 0.75, 8), potMat);
      pot.position.set(tx, 0.38, tz);
      scene.add(pot);
      const cone1 = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.6, 7), leafMat1);
      cone1.position.set(tx, 1.45, tz);
      scene.add(cone1);
      const cone2 = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.3, 7), leafMat2);
      cone2.position.set(tx, 2.35, tz);
      scene.add(cone2);
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
      ll.intensity = 1.2 + Math.sin(elapsed * 3.5 + i * 1.4) * 0.12;
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
