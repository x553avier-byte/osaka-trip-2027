// =============================================================================
// 🍺 冒險者酒館交誼廳 (Three.js HD-2D 互動場景引擎)
// 支援：四方向像素精靈移動 (WASD / 方向鍵 / 手機虛擬十字鍵 / 點地板自動走路)
//       多冒險傳送門 (目前開放：2027 大阪關西遠征；預留未來日本/各地場景入口)
//       Firebase 即時多人同屏走動同步
// =============================================================================
(function () {
  const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

  // 房間可活動範圍與家具碰撞盒 (AABB: minX, maxX, minZ, maxZ)
  const ROOM_BOUNDS = { minX: -7.2, maxX: 7.2, minZ: -3.9, maxZ: 4.9 };
  const OBSTACLES = [
    // 左側木頭吧檯
    { minX: -7.6, maxX: -4.4, minZ: -3.2, maxZ: 2.3 },
    // 中央偏左酒館方桌
    { minX: -2.4, maxX: -0.5, minZ: 1.0, maxZ: 2.7 },
    // 右下方圓桌
    { minX: 2.4, maxX: 4.5, minZ: 1.5, maxZ: 3.3 }
  ];

  // 非在線成員在酒館內的預設休息站位（避開家具與傳送門）
  const DEFAULT_SPOTS = {
    yenting:  { x:  0.0, z:  0.4, dir: "down" },
    chinghua: { x: -3.5, z: -0.8, dir: "right" },
    naichi:   { x: -1.4, z:  0.2, dir: "down" },
    tingyin:  { x: -3.4, z:  1.8, dir: "right" },
    qinyan:   { x:  1.4, z:  1.9, dir: "left" },
    qianyi:   { x:  2.2, z: -1.3, dir: "down" },
    chanchi:  { x:  3.6, z: -1.1, dir: "left" },
    yanyi:    { x: -1.4, z: -2.4, dir: "down" },
    beichen:  { x:  4.9, z:  2.2, dir: "left" }
  };

  // 酒館內可互動據點＆冒險傳送門（未來新增東京／北海道只需在這裡加一筆！）
  const INTERACTABLES = [
    {
      id: "portal-osaka",
      type: "adventure",
      title: "🏯 2027 大阪關西冒險",
      actionLabel: "🚪 進入 2027 大阪冒險",
      x: 2.6,
      z: -3.6,
      radius: 2.15,
      trigger: () => {
        if (window.openOsakaPortalDialog) window.openOsakaPortalDialog();
      }
    },
    {
      id: "portal-future",
      type: "future",
      title: "🧭 未來新冒險傳送陣",
      actionLabel: "✨ 查看未來冒險傳送門",
      x: 6.4,
      z: -0.5,
      radius: 2.0,
      trigger: () => {
        if (window.openFuturePortalDialog) window.openFuturePortalDialog();
      }
    },
    {
      id: "board-guild",
      type: "board",
      title: "📜 公會情報佈告欄",
      actionLabel: "📋 閱讀公會佈告欄",
      x: -2.6,
      z: -3.6,
      radius: 2.0,
      trigger: () => {
        if (window.openGuildBoardDialog) window.openGuildBoardDialog();
      }
    },
    {
      id: "tavern-bar",
      type: "bar",
      title: "🍻 冒險者酒館吧檯",
      actionLabel: "🍺 跟酒館老闆打招呼",
      x: -3.8,
      z: -0.2,
      radius: 1.9,
      trigger: () => {
        if (window.openTavernBarDialog) window.openTavernBarDialog();
      }
    }
  ];

  let scene, camera, renderer, raycaster, floorMesh;
  let initialized = false;
  let isActiveTab = true;
  let animId = null;
  let lastFrameTime = performance.now();
  let elapsed = 0;

  // 動畫燈光與特效參考
  let fireLight = null;
  let fireParticles = [];
  let osakaRing = null;
  let osakaCurtain = null;
  let futureRing = null;
  let targetMarker = null;

  // 所有 9 位成員的 3D 精靈節點
  const actorMap = {}; // id -> { group, spriteMesh, tex, nameSprite, playerRing, x, z, targetX, targetZ, dir, frame, walkTimer, moving, isRemoteMoving }
  let currentPlayerId = "yenting";
  let remotePositions = {}; // id -> { x, z, dir, moving, t }
  let lastSyncSent = 0;

  // 移動輸入狀態
  const keys = { up: false, down: false, left: false, right: false };
  let walkGoal = null; // { x, z } 點地板自動走路目標
  let nearestTarget = null; // 目前靠近的互動據點或角色

  // ===========================================================================
  // 像素質感程序化貼圖工具 (Crisp Pixel Canvas Textures)
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

  function createWoodFloorTexture() {
    return makePixelCanvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = "#8a5228";
      ctx.fillRect(0, 0, w, h);
      const plankColors = ["#985c2f", "#874e24", "#9e6234", "#7e4820"];
      for (let row = 0; row < 4; row++) {
        const y = row * 16;
        ctx.fillStyle = plankColors[row % plankColors.length];
        ctx.fillRect(0, y, w, 15);
        // 木板水平縫隙
        ctx.fillStyle = "#542c11";
        ctx.fillRect(0, y + 15, w, 1);
        // 木板垂直接縫（交錯）
        const seamX = (row % 2 === 0) ? 28 : 52;
        ctx.fillRect(seamX, y, 1, 15);
        // 細微木紋
        ctx.fillStyle = "rgba(255, 224, 178, 0.12)";
        ctx.fillRect(4, y + 4, 18, 2);
        ctx.fillRect(36, y + 9, 20, 2);
        // 釘子
        ctx.fillStyle = "#3f1d09";
        ctx.fillRect(seamX - 3, y + 3, 2, 2);
        ctx.fillRect(seamX + 3, y + 11, 2, 2);
      }
    }, 8, 6);
  }

  function createWallTexture() {
    return makePixelCanvasTexture(64, 64, (ctx, w, h) => {
      // 上半部溫暖奶油灰泥牆
      ctx.fillStyle = "#e8cf9d";
      ctx.fillRect(0, 0, w, 40);
      ctx.fillStyle = "#dec08a";
      ctx.fillRect(0, 0, w, 4);
      // 垂直木樑
      ctx.fillStyle = "#6e3814";
      ctx.fillRect(0, 0, 5, h);
      ctx.fillRect(w - 5, 0, 5, h);
      ctx.fillStyle = "#914d1f";
      ctx.fillRect(1, 0, 2, h);
      // 下半部護牆木板 (Wainscoting)
      ctx.fillStyle = "#7a4018";
      ctx.fillRect(0, 40, w, 24);
      ctx.fillStyle = "#4d220a";
      ctx.fillRect(0, 39, w, 2);
      for (let x = 8; x < w - 5; x += 10) {
        ctx.fillStyle = "#633110";
        ctx.fillRect(x, 42, 1, 22);
      }
    }, 6, 1);
  }

  function createRugTexture() {
    return makePixelCanvasTexture(96, 64, (ctx, w, h) => {
      ctx.fillStyle = "#8e2424";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "#f2be42";
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.strokeStyle = "#5c1313";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, w - 20, h - 20);
      // 中央星芒菱形紋
      ctx.fillStyle = "#f4c85b";
      ctx.beginPath();
      ctx.moveTo(w / 2, 16);
      ctx.lineTo(w / 2 + 16, h / 2);
      ctx.lineTo(w / 2, h - 16);
      ctx.lineTo(w / 2 - 16, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a82c2c";
      ctx.beginPath();
      ctx.moveTo(w / 2, 23);
      ctx.lineTo(w / 2 + 9, h / 2);
      ctx.lineTo(w / 2, h - 23);
      ctx.lineTo(w / 2 - 9, h / 2);
      ctx.closePath();
      ctx.fill();
    });
  }

  function createSignSprite(text, bgColor = "#6e3412", borderColor = "#f5c556", textColor = "#fff8dc") {
    const c = document.createElement("canvas");
    c.width = 360;
    c.height = 76;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "#2b1206";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = borderColor;
    ctx.fillRect(4, 4, c.width - 8, c.height - 8);
    ctx.fillStyle = bgColor;
    ctx.fillRect(9, 9, c.width - 18, c.height - 18);

    ctx.font = 'bold 28px "DotGothic16", "Microsoft JhengHei", sans-serif';
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
    sp.scale.set(3.2, 0.68, 1);
    sp.renderOrder = 20;
    return sp;
  }

  function createNameTagSprite(name, isOnline, isCurrent, inOsaka) {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 68;
    const ctx = c.getContext("2d");

    const bg = isCurrent ? "rgba(180, 42, 28, 0.92)" : "rgba(44, 21, 9, 0.85)";
    const border = isCurrent ? "#ffd859" : (inOsaka ? "#d69449" : "#7cc6e8");

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(14, 10, 228, 48, 14);
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = border;
    ctx.stroke();

    // 上線綠點 / 離線灰點
    ctx.beginPath();
    ctx.arc(40, 34, 8, 0, Math.PI * 2);
    ctx.fillStyle = isOnline ? "#44e034" : "#9c8d7a";
    ctx.fill();

    ctx.font = 'bold 26px "DotGothic16", "Microsoft JhengHei", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff8e6";
    ctx.fillText(name + (isCurrent ? " ★" : ""), 140, 35);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // ===========================================================================
  // 建立 3D 酒館場景佈置
  // ===========================================================================
  function buildTavernEnvironment() {
    // 1. 地板
    const floorGeo = new THREE.PlaneGeometry(18, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createWoodFloorTexture(),
      roughness: 0.88,
      metalness: 0.05
    });
    floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0.4);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // 中央紅金地毯
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(5.8, 3.6),
      new THREE.MeshStandardMaterial({ map: createRugTexture(), roughness: 0.95 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.3, 0.015, 0.5);
    scene.add(rug);

    // 2. 後牆與左右牆
    const wallMat = new THREE.MeshStandardMaterial({ map: createWallTexture(), roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(18.4, 4.6, 0.4), wallMat);
    backWall.position.set(0, 2.3, -5.2);
    scene.add(backWall);

    const sideWallMat = new THREE.MeshStandardMaterial({ color: 0x733b18, roughness: 0.92 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.6, 12.2), sideWallMat);
    leftWall.position.set(-8.8, 2.3, 0.7);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.6, 12.2), sideWallMat);
    rightWall.position.set(8.8, 2.3, 0.7);
    scene.add(rightWall);

    // 3. 石頭壁爐（北牆正中央）
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b6763, roughness: 0.95 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 1 });
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 1.0), stoneMat);
    hearth.position.set(0, 1.2, -4.65);
    scene.add(hearth);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.85), stoneMat);
    chimney.position.set(0, 3.4, -4.7);
    scene.add(chimney);

    const firePit = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.1, 0.35), darkStoneMat);
    firePit.position.set(0, 0.65, -4.2);
    scene.add(firePit);

    // 火焰發光方塊粒子
    const flameColors = [0xff5500, 0xff9900, 0xffdd33];
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.28, 0.24),
        new THREE.MeshBasicMaterial({ color: flameColors[i % flameColors.length] })
      );
      p.position.set((Math.random() - 0.5) * 0.85, 0.35 + Math.random() * 0.6, -4.05);
      p.userData = { baseX: p.position.x, phase: Math.random() * Math.PI * 2, speed: 2.2 + Math.random() * 2.0 };
      scene.add(p);
      fireParticles.push(p);
    }

    fireLight = new THREE.PointLight(0xff842c, 2.6, 11);
    fireLight.position.set(0, 1.2, -3.5);
    scene.add(fireLight);

    // 4. 公會情報佈告欄（北牆左側）
    const boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(2.3, 1.65, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x5c2b0e, roughness: 0.85 })
    );
    boardFrame.position.set(-3.0, 2.0, -4.92);
    scene.add(boardFrame);

    const cork = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 1.35, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xd4a46a, roughness: 0.95 })
    );
    cork.position.set(-3.0, 2.0, -4.91);
    scene.add(cork);

    // 貼在佈告欄上的小紙條
    const noteColors = [0xfff6d6, 0xffe4b3, 0xd8f5c4, 0xffd6cc];
    [[-3.55, 2.25], [-2.95, 2.15], [-2.38, 2.22], [-3.25, 1.65], [-2.58, 1.68]].forEach((pos, idx) => {
      const note = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.38, 0.04),
        new THREE.MeshStandardMaterial({ color: noteColors[idx % noteColors.length] })
      );
      note.position.set(pos[0], pos[1], -4.79);
      scene.add(note);
    });

    const boardSign = createSignSprite("📜 公會佈告欄", "#5c2b0e", "#e8b45a");
    boardSign.position.set(-3.0, 3.25, -4.6);
    scene.add(boardSign);

    // 5. 🏯「2027 大阪關西冒險」鳥居傳送門（北牆右側）
    const toriiRed = new THREE.MeshStandardMaterial({ color: 0xc92a22, roughness: 0.65 });
    const toriiDark = new THREE.MeshStandardMaterial({ color: 0x26140d, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0x6b4300, roughness: 0.4 });

    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.1, 8), toriiRed);
    leftPillar.position.set(1.65, 1.55, -4.45);
    scene.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 3.1, 8), toriiRed);
    rightPillar.position.set(3.95, 1.55, -4.45);
    scene.add(rightPillar);

    const kasagiTop = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 0.42), toriiDark);
    kasagiTop.position.set(2.8, 3.2, -4.45);
    scene.add(kasagiTop);

    const kasagiRed = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.18, 0.35), toriiRed);
    kasagiRed.position.set(2.8, 3.02, -4.45);
    scene.add(kasagiRed);

    const nukiBeam = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.16, 0.24), toriiRed);
    nukiBeam.position.set(2.8, 2.52, -4.45);
    scene.add(nukiBeam);

    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.16), goldMat);
    plaque.position.set(2.8, 2.77, -4.38);
    scene.add(plaque);

    // 傳送門金色光幕
    osakaCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(1.95, 2.45),
      new THREE.MeshBasicMaterial({ color: 0xffd15c, transparent: true, opacity: 0.36, side: THREE.DoubleSide })
    );
    osakaCurtain.position.set(2.8, 1.25, -4.45);
    scene.add(osakaCurtain);

    // 地板旋轉光環
    osakaRing = new THREE.Mesh(
      new THREE.RingGeometry(0.75, 1.12, 24),
      new THREE.MeshBasicMaterial({ color: 0xffcb3b, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
    );
    osakaRing.rotation.x = -Math.PI / 2;
    osakaRing.position.set(2.8, 0.03, -3.55);
    scene.add(osakaRing);

    const osakaLight = new THREE.PointLight(0xffbb33, 2.2, 8);
    osakaLight.position.set(2.8, 1.8, -3.6);
    scene.add(osakaLight);

    const osakaSign = createSignSprite("🏯 2027 大阪冒險", "#991b1b", "#ffd447", "#fffbe6");
    osakaSign.position.set(2.8, 3.85, -4.2);
    scene.add(osakaSign);

    // 6. 🧭「未來新冒險傳送陣」（東側牆壁，預留北海道／東京等新場景！）
    const stoneArchMat = new THREE.MeshStandardMaterial({ color: 0x4b627d, roughness: 0.75 });
    const fPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.7, 0.32), stoneArchMat);
    fPillar1.position.set(8.2, 1.35, -1.5);
    scene.add(fPillar1);
    const fPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.32, 2.7, 0.32), stoneArchMat);
    fPillar2.position.set(8.2, 1.35, 0.5);
    scene.add(fPillar2);
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.32, 2.6), stoneArchMat);
    fTop.position.set(8.2, 2.78, -0.5);
    scene.add(fTop);

    const futureCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 2.45),
      new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
    );
    futureCurtain.rotation.y = Math.PI / 2;
    futureCurtain.position.set(8.2, 1.25, -0.5);
    scene.add(futureCurtain);

    futureRing = new THREE.Mesh(
      new THREE.RingGeometry(0.65, 0.98, 24),
      new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    futureRing.rotation.x = -Math.PI / 2;
    futureRing.position.set(6.9, 0.03, -0.5);
    scene.add(futureRing);

    const futureLight = new THREE.PointLight(0x4cc9f0, 1.8, 7);
    futureLight.position.set(7.1, 1.6, -0.5);
    scene.add(futureLight);

    const futureSign = createSignSprite("🧭 未來場景傳送陣", "#1c4b75", "#7dd3fc", "#e0f7ff");
    futureSign.position.set(7.6, 3.45, -0.5);
    scene.add(futureSign);

    // 7. 🍻 左側酒館木吧檯、橡木酒桶與酒杯
    const oakDark = new THREE.MeshStandardMaterial({ color: 0x5c2e12, roughness: 0.85 });
    const oakTop = new THREE.MeshStandardMaterial({ color: 0xa6622b, roughness: 0.72 });

    const barBody = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.05, 4.9), oakDark);
    barBody.position.set(-5.4, 0.52, -0.45);
    scene.add(barBody);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.16, 5.15), oakTop);
    barTop.position.set(-5.4, 1.12, -0.45);
    scene.add(barTop);

    // 吧檯後方酒桶
    for (let i = 0; i < 3; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.95, 10),
        new THREE.MeshStandardMaterial({ color: 0x7c431c, roughness: 0.85 })
      );
      barrel.position.set(-7.6, 0.48, -2.0 + i * 1.4);
      scene.add(barrel);
    }

    // 吧檯上溫暖小燈與啤酒杯
    const mugMat = new THREE.MeshStandardMaterial({ color: 0xf6c453, roughness: 0.4 });
    [[-5.0, -1.4], [-5.2, 0.6], [-4.95, 1.2]].forEach(([mx, mz]) => {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.24, 8), mugMat);
      mug.position.set(mx, 1.32, mz);
      scene.add(mug);
    });

    const barSign = createSignSprite("🍻 家族酒館吧檯", "#6e3814", "#f5be4f");
    barSign.position.set(-5.4, 2.55, -0.45);
    scene.add(barSign);

    // 8. 兩張酒館木桌與凳子
    function addTable(tx, tz) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.14, 1.3), oakTop);
      top.position.set(tx, 0.82, tz);
      scene.add(top);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.8, 0.45), oakDark);
      leg.position.set(tx, 0.4, tz);
      scene.add(leg);
      // 桌上溫暖小蠟燭
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.07, 0.22, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe999 })
      );
      candle.position.set(tx, 1.0, tz);
      scene.add(candle);
      // 凳子
      [[-1.1, 0], [1.1, 0]].forEach(([ox, oz]) => {
        const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.24, 0.46, 8), oakDark);
        stool.position.set(tx + ox, 0.23, tz + oz);
        scene.add(stool);
      });
    }
    addTable(-1.45, 1.85);
    addTable(3.45, 2.4);

    // 9. 點地板走路的目標光環
    targetMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.22, 0.36, 16),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
    );
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.position.set(0, 0.04, 0);
    targetMarker.visible = false;
    scene.add(targetMarker);

    // 10. 環境照明
    scene.add(new THREE.AmbientLight(0xffe6c2, 0.92));
    const dirLight = new THREE.DirectionalLight(0xffdfa8, 0.72);
    dirLight.position.set(3, 12, 8);
    scene.add(dirLight);
  }

  // ===========================================================================
  // 建立 9 位家族成員 4 方向精靈角色
  // ===========================================================================
  function buildActors(members) {
    const loader = new THREE.TextureLoader();

    members.forEach(m => {
      const group = new THREE.Group();
      const spot = DEFAULT_SPOTS[m.id] || { x: 0, z: 0, dir: "down" };

      // 腳底陰影
      const shadow = new THREE.Mesh(
        new THREE.CircleGeometry(0.46, 16),
        new THREE.MeshBasicMaterial({ color: 0x1e0e05, transparent: true, opacity: 0.38 })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.025;
      group.add(shadow);

      // 當前操作角色的金色腳底光環
      const playerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.52, 0.68, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd647, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
      );
      playerRing.rotation.x = -Math.PI / 2;
      playerRing.position.y = 0.032;
      playerRing.visible = (m.id === currentPlayerId);
      group.add(playerRing);

      // 4x4 精靈表材質
      const tex = loader.load(m.sheet, () => {
        tex.needsUpdate = true;
      });
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(0.25, 0.25);
      // 初始面對方向 (Three.js flipY=true -> row 0=0.75, 1=0.5, 2=0.25, 3=0)
      const initRow = DIR_ROW[spot.dir] || 0;
      tex.offset.set(0, (3 - initRow) * 0.25);

      const spriteMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide
      });
      const spriteMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 1.75), spriteMat);
      spriteMesh.position.y = 0.88;
      // 微微向攝影機傾斜，呈現 HD-2D 最佳立體感
      spriteMesh.rotation.x = -0.22;
      group.add(spriteMesh);

      // 頭頂名牌
      const online = window.isMemberOnline ? window.isMemberOnline(m.id) : (m.id === currentPlayerId);
      const nameTex = createNameTagSprite(m.name, online, m.id === currentPlayerId, m.inOsakaTrip);
      const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true, depthTest: false }));
      nameSprite.scale.set(1.65, 0.44, 1);
      nameSprite.position.y = 2.02;
      nameSprite.renderOrder = 15;
      group.add(nameSprite);

      group.position.set(spot.x, 0, spot.z);
      scene.add(group);

      actorMap[m.id] = {
        member: m,
        group,
        spriteMesh,
        tex,
        nameSprite,
        playerRing,
        x: spot.x,
        z: spot.z,
        dir: spot.dir,
        frame: 0,
        walkTimer: 0,
        moving: false,
        lastTagKey: `${online}_${m.id === currentPlayerId}`
      };
    });
  }

  function setActorSpriteFrame(actor, dir, frame) {
    const row = DIR_ROW[dir] ?? 0;
    const col = frame % 4;
    actor.tex.offset.set(col * 0.25, (3 - row) * 0.25);
  }

  function collides(nx, nz) {
    const r = 0.42;
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

  // ===========================================================================
  // 互動偵測（附近傳送門、佈告欄、吧檯或其他家族成員）
  // ===========================================================================
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

    // 也檢查是否靠近其他家族成員
    if (!best) {
      Object.values(actorMap).forEach(other => {
        if (other.member.id === currentPlayerId) return;
        const d = Math.hypot(player.x - other.x, player.z - other.z);
        if (d <= 1.65 && d < bestDist) {
          bestDist = d;
          best = {
            id: "npc-" + other.member.id,
            type: "member",
            title: `${other.member.name}（${other.member.role}）`,
            actionLabel: `💬 跟 ${other.member.name} 聊聊天`,
            trigger: () => {
              if (window.openMemberTalkDialog) window.openMemberTalkDialog(other.member.id);
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
      hint.textContent = `✨ 附近：${best.title}（按空白鍵或點右側按鈕互動）`;
    } else {
      btn.style.display = "none";
      hint.textContent = "🧭 方向鍵 / WASD / 虛擬鍵盤，或直接點擊酒館地板自由逛逛！";
    }
  }

  // ===========================================================================
  // 主迴圈 (60 FPS)
  // ===========================================================================
  function tick(now) {
    animId = requestAnimationFrame(tick);
    if (!isActiveTab) {
      lastFrameTime = now;
      return;
    }

    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;
    elapsed += dt;

    // 1. 壁爐閃爍與傳送門旋轉特效
    if (fireLight) {
      fireLight.intensity = 2.35 + Math.sin(elapsed * 9.5) * 0.35 + Math.cos(elapsed * 15.2) * 0.18;
    }
    fireParticles.forEach(p => {
      const u = p.userData;
      p.position.y = 0.35 + ((elapsed * u.speed + u.phase) % 0.72);
      p.position.x = u.baseX + Math.sin(elapsed * 5 + u.phase) * 0.08;
      const s = 1 - ((p.position.y - 0.35) / 0.8);
      p.scale.setScalar(Math.max(0.25, s));
    });
    if (osakaRing) osakaRing.rotation.z = elapsed * 0.7;
    if (osakaCurtain) osakaCurtain.material.opacity = 0.28 + Math.sin(elapsed * 3.2) * 0.1;
    if (futureRing) futureRing.rotation.z = -elapsed * 0.6;
    if (targetMarker && targetMarker.visible) {
      const sc = 0.85 + Math.sin(elapsed * 8) * 0.15;
      targetMarker.scale.set(sc, sc, 1);
    }

    // 2. 更新玩家操作移動
    const player = actorMap[currentPlayerId];
    if (player) {
      let dx = 0, dz = 0;
      if (keys.up) dz -= 1;
      if (keys.down) dz += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      if (dx !== 0 || dz !== 0) {
        // 手動鍵盤／十字鍵優先，取消點擊地板目標
        walkGoal = null;
        if (targetMarker) targetMarker.visible = false;
      } else if (walkGoal) {
        const gx = walkGoal.x - player.x;
        const gz = walkGoal.z - player.z;
        const dist = Math.hypot(gx, gz);
        if (dist < 0.22) {
          walkGoal = null;
          if (targetMarker) targetMarker.visible = false;
        } else {
          dx = gx / dist;
          dz = gz / dist;
        }
      }

      const moving = (dx !== 0 || dz !== 0);
      if (moving) {
        const len = Math.hypot(dx, dz);
        const speed = 4.2;
        const stepX = (dx / len) * speed * dt;
        const stepZ = (dz / len) * speed * dt;

        // 分軸滑動碰撞，靠牆走也能順暢滑動
        const tryX = player.x + stepX;
        if (!collides(tryX, player.z)) player.x = tryX;
        const tryZ = player.z + stepZ;
        if (!collides(player.x, tryZ)) player.z = tryZ;

        if (Math.abs(dx) >= Math.abs(dz)) {
          player.dir = dx > 0 ? "right" : "left";
        } else {
          player.dir = dz > 0 ? "down" : "up";
        }

        player.walkTimer += dt;
        if (player.walkTimer >= 0.14) {
          player.walkTimer = 0;
          player.frame = (player.frame + 1) % 4;
        }
        player.moving = true;
      } else {
        if (player.moving) {
          // 剛停下時推送一次靜止位置給 Firebase
          pushPositionToCloud(player, false);
        }
        player.moving = false;
        player.frame = 0;
        player.walkTimer = 0;
      }

      player.group.position.set(player.x, 0, player.z);
      setActorSpriteFrame(player, player.dir, player.frame);

      // 節流推送移動位置到 Firebase（每 250ms）
      if (player.moving && now - lastSyncSent > 250) {
        lastSyncSent = now;
        pushPositionToCloud(player, true);
      }

      // 攝影機平滑跟隨
      const camTargetX = player.x * 0.42;
      const camTargetZ = player.z * 0.42 + 10.6;
      camera.position.x += (camTargetX - camera.position.x) * Math.min(1, dt * 5);
      camera.position.z += (camTargetZ - camera.position.z) * Math.min(1, dt * 5);
      camera.lookAt(player.x * 0.55, 0.85, player.z * 0.55 - 0.6);
    }

    // 3. 更新其他 8 位家族成員（線上同步平滑移動／離線安靜休息）
    Object.values(actorMap).forEach(actor => {
      if (actor.member.id === currentPlayerId) return;
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
        // 離線成員停在酒館溫馨位置，偶爾呼吸微動
        actor.frame = 0;
        setActorSpriteFrame(actor, actor.dir, 0);
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

  // ===========================================================================
  // 輸入事件（鍵盤、手機虛擬鍵盤、點擊地板自動走動）
  // ===========================================================================
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

    // 虛擬十字鍵（支援觸控與滑鼠長按）
    document.querySelectorAll(".tavern-dpad button[data-dir]").forEach(btn => {
      const dir = btn.dataset.dir;
      const start = (ev) => { ev.preventDefault(); keys[dir] = true; };
      const stop = () => { keys[dir] = false; };
      btn.addEventListener("pointerdown", start);
      btn.addEventListener("pointerup", stop);
      btn.addEventListener("pointerleave", stop);
      btn.addEventListener("pointercancel", stop);
    });

    // 互動按鈕
    const interactBtn = document.getElementById("tavern-interact-btn");
    if (interactBtn) {
      interactBtn.addEventListener("click", () => {
        if (nearestTarget) nearestTarget.trigger();
      });
    }

    // 點擊地板自動走過去（手機單指超好用！）
    canvasEl.addEventListener("pointerdown", e => {
      if (!isActiveTab || !renderer || !camera || !floorMesh) return;
      const rect = canvasEl.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObject(floorMesh);
      if (hits.length > 0) {
        const pt = hits[0].point;
        const gx = Math.max(ROOM_BOUNDS.minX, Math.min(ROOM_BOUNDS.maxX, pt.x));
        const gz = Math.max(ROOM_BOUNDS.minZ, Math.min(ROOM_BOUNDS.maxZ, pt.z));
        walkGoal = { x: gx, z: gz };
        if (targetMarker) {
          targetMarker.position.set(gx, 0.04, gz);
          targetMarker.visible = true;
        }
      }
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

  // ===========================================================================
  // 對外 API（供 index.html 呼叫）
  // ===========================================================================
  window.TavernEngine = {
    init(members, initialMemberId) {
      if (initialized) return;
      const wrap = document.getElementById("tavern-canvas-wrap");
      if (!wrap) return;

      if (typeof THREE === "undefined") {
        wrap.innerHTML = `<div style="padding:24px; text-align:center; color:#fce7b8;">⚠️ 無法載入 Three.js（可能處於完全離線環境），請直接點下方按鈕進入大阪冒險！</div>`;
        return;
      }

      currentPlayerId = initialMemberId || "yenting";

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1f140e);
      scene.fog = new THREE.Fog(0x1f140e, 18, 32);

      const w = wrap.clientWidth || 640;
      const h = wrap.clientHeight || 420;
      camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 60);
      camera.position.set(0, 8.8, 10.6);

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
      if (active) {
        keys.up = keys.down = keys.left = keys.right = false;
        setTimeout(handleResize, 30);
      }
    },

    walkToPortal(portalId) {
      const obj = INTERACTABLES.find(i => i.id === portalId);
      if (!obj || !initialized) return;
      walkGoal = { x: obj.x, z: Math.min(ROOM_BOUNDS.maxZ, obj.z + 0.6) };
      if (targetMarker) {
        targetMarker.position.set(walkGoal.x, 0.04, walkGoal.z);
        targetMarker.visible = true;
      }
    }
  };
})();
