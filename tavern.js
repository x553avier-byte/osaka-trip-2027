// =============================================================================
// 🍺 冒險者酒館交誼廳 (Three.js HD-2D 寬敞版・全點擊手機友善操作)
// - 寬敞大廳 (28 × 20)，9 位家族成員分佈舒適不擁擠
// - 全部用點的：點地板自動走路、點傳送門／佈告欄／吧檯自動走去互動
// - 點擊任何家人頭上會冒出可愛 😊 微笑氣泡＋開心彈跳（不含角色切換）
// - 無障礙物椅子，走道寬敞順暢；鍵盤 WASD/方向鍵在電腦上依然可用
// =============================================================================
(function () {
  const DIR_ROW = { down: 0, left: 1, right: 2, up: 3 };

  // 寬敞酒館活動範圍 (28 x 20 大廳)
  const ROOM_BOUNDS = { minX: -11.8, maxX: 11.8, minZ: -7.4, maxZ: 7.8 };
  const OBSTACLES = [
    // 最左側橡木吧檯
    { minX: -12.6, maxX: -8.6, minZ: -4.8, maxZ: 3.4 },
    // 左下寬敞酒館木桌（無椅子）
    { minX: -5.4, maxX: -2.8, minZ: 2.6, maxZ: 4.5 },
    // 右下寬敞酒館木桌（無椅子）
    { minX: 3.2, maxX: 5.8, minZ: 2.8, maxZ: 4.7 }
  ];

  // 9 位家族成員在寬敞酒館內的分散站位（彼此保持舒適距離、不擋走道與傳送門）
  const DEFAULT_SPOTS = {
    yenting:  { x:  0.0, z:  1.2, dir: "down" },
    chinghua: { x: -6.8, z: -2.2, dir: "right" },
    naichi:   { x: -4.2, z: -1.6, dir: "down" },
    tingyin:  { x: -6.8, z:  2.4, dir: "right" },
    qinyan:   { x:  0.2, z:  5.2, dir: "up" },
    qianyi:   { x:  2.2, z: -2.0, dir: "down" },
    chanchi:  { x:  7.8, z: -4.2, dir: "left" },
    yanyi:    { x: -1.6, z: -4.4, dir: "down" },
    beichen:  { x:  8.4, z:  4.2, dir: "left" }
  };

  // 酒館內可互動據點＆冒險傳送門（未來新增日本／各地場景直接加一筆）
  const INTERACTABLES = [
    {
      id: "portal-osaka",
      type: "adventure",
      title: "🏯 2027 大阪關西冒險",
      actionLabel: "🚪 進入 2027 大阪冒險",
      x: 5.0,
      z: -6.8,
      walkX: 5.0,
      walkZ: -5.5,
      radius: 2.6,
      trigger: () => {
        if (window.openOsakaPortalDialog) window.openOsakaPortalDialog();
      }
    },
    {
      id: "portal-future",
      type: "future",
      title: "🧭 未來新冒險傳送陣",
      actionLabel: "✨ 查看未來冒險傳送陣",
      x: 10.6,
      z: -0.6,
      walkX: 9.6,
      walkZ: -0.6,
      radius: 2.5,
      trigger: () => {
        if (window.openFuturePortalDialog) window.openFuturePortalDialog();
      }
    },
    {
      id: "board-guild",
      type: "board",
      title: "📜 公會情報佈告欄",
      actionLabel: "📋 閱讀公會佈告欄",
      x: -5.2,
      z: -6.8,
      walkX: -5.2,
      walkZ: -5.6,
      radius: 2.5,
      trigger: () => {
        if (window.openGuildBoardDialog) window.openGuildBoardDialog();
      }
    },
    {
      id: "tavern-bar",
      type: "bar",
      title: "🍻 冒險者酒館吧檯",
      actionLabel: "🍺 跟酒館老闆打招呼",
      x: -7.8,
      z: -0.6,
      walkX: -7.4,
      walkZ: -0.6,
      radius: 2.4,
      trigger: () => {
        if (window.openTavernBarDialog) window.openTavernBarDialog();
      }
    }
  ];

  let scene, camera, renderer, raycaster, floorMesh;
  let initialized = false;
  let isActiveTab = true;
  let lastFrameTime = performance.now();
  let elapsed = 0;

  let fireLight = null;
  let fireParticles = [];
  let osakaRing = null;
  let osakaCurtain = null;
  let futureRing = null;
  let targetMarker = null;

  // 可點擊的 3D 物件列表（用於精準點擊角色或傳送門）
  const clickableMeshes = [];
  const actorMap = {};
  let currentPlayerId = "yenting";
  let remotePositions = {};
  let lastSyncSent = 0;

  const keys = { up: false, down: false, left: false, right: false };
  let walkGoal = null; // { x, z, onArrive?: Function }
  let nearestTarget = null;
  let smileTexCache = null;

  // ===========================================================================
  // 像素質感貼圖工具
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
        ctx.fillStyle = "#542c11";
        ctx.fillRect(0, y + 15, w, 1);
        const seamX = (row % 2 === 0) ? 28 : 52;
        ctx.fillRect(seamX, y, 1, 15);
        ctx.fillStyle = "rgba(255, 224, 178, 0.12)";
        ctx.fillRect(4, y + 4, 18, 2);
        ctx.fillRect(36, y + 9, 20, 2);
        ctx.fillStyle = "#3f1d09";
        ctx.fillRect(seamX - 3, y + 3, 2, 2);
        ctx.fillRect(seamX + 3, y + 11, 2, 2);
      }
    }, 12, 9);
  }

  function createWallTexture() {
    return makePixelCanvasTexture(64, 64, (ctx, w, h) => {
      ctx.fillStyle = "#e8cf9d";
      ctx.fillRect(0, 0, w, 40);
      ctx.fillStyle = "#dec08a";
      ctx.fillRect(0, 0, w, 4);
      ctx.fillStyle = "#6e3814";
      ctx.fillRect(0, 0, 5, h);
      ctx.fillRect(w - 5, 0, 5, h);
      ctx.fillStyle = "#914d1f";
      ctx.fillRect(1, 0, 2, h);
      ctx.fillStyle = "#7a4018";
      ctx.fillRect(0, 40, w, 24);
      ctx.fillStyle = "#4d220a";
      ctx.fillRect(0, 39, w, 2);
      for (let x = 8; x < w - 5; x += 10) {
        ctx.fillStyle = "#633110";
        ctx.fillRect(x, 42, 1, 22);
      }
    }, 9, 1);
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
      ctx.fillStyle = "#f4c85b";
      ctx.beginPath();
      ctx.moveTo(w / 2, 14);
      ctx.lineTo(w / 2 + 18, h / 2);
      ctx.lineTo(w / 2, h - 14);
      ctx.lineTo(w / 2 - 18, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a82c2c";
      ctx.beginPath();
      ctx.moveTo(w / 2, 22);
      ctx.lineTo(w / 2 + 10, h / 2);
      ctx.lineTo(w / 2, h - 22);
      ctx.lineTo(w / 2 - 10, h / 2);
      ctx.closePath();
      ctx.fill();
    });
  }

  function createSignSprite(text, bgColor = "#6e3412", borderColor = "#f5c556", textColor = "#fff8dc") {
    const c = document.createElement("canvas");
    c.width = 380;
    c.height = 80;
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
    sp.scale.set(3.8, 0.8, 1);
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

  // 可愛像素風「😊 微笑氣泡」貼圖
  function getSmileBubbleTexture() {
    if (smileTexCache) return smileTexCache;
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 128;
    const ctx = c.getContext("2d");

    // 氣泡外框
    ctx.fillStyle = "#3b1908";
    ctx.beginPath();
    ctx.roundRect(14, 10, 100, 86, 22);
    ctx.fill();
    // 氣泡尾巴外框
    ctx.beginPath();
    ctx.moveTo(48, 92);
    ctx.lineTo(64, 118);
    ctx.lineTo(80, 92);
    ctx.closePath();
    ctx.fill();

    // 奶油白氣泡底色
    ctx.fillStyle = "#fff9e6";
    ctx.beginPath();
    ctx.roundRect(20, 16, 88, 74, 17);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(54, 88);
    ctx.lineTo(64, 108);
    ctx.lineTo(74, 88);
    ctx.closePath();
    ctx.fill();

    // 微笑臉蛋（暖黃圓臉＋彎彎笑眼＋紅暈＋微笑嘴）
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(64, 53, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "#8a4b08";
    ctx.stroke();

    // 腮紅
    ctx.fillStyle = "rgba(255, 110, 110, 0.55)";
    ctx.beginPath();
    ctx.ellipse(47, 57, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(81, 57, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 彎彎笑眼 ^_^
    ctx.strokeStyle = "#4a2206";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(53, 50, 5.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(75, 50, 5.5, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();

    // 微笑嘴巴
    ctx.beginPath();
    ctx.arc(64, 56, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    smileTexCache = new THREE.CanvasTexture(c);
    smileTexCache.colorSpace = THREE.SRGBColorSpace;
    return smileTexCache;
  }

  // ===========================================================================
  // 建立寬敞 3D 酒館環境 (28 × 20，移除所有椅子！)
  // ===========================================================================
  function buildTavernEnvironment() {
    // 1. 寬敞橡木地板
    const floorGeo = new THREE.PlaneGeometry(28, 20);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createWoodFloorTexture(),
      roughness: 0.88,
      metalness: 0.05
    });
    floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(0, 0, 0.2);
    scene.add(floorMesh);

    // 中央大型紅金地毯
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 5.4),
      new THREE.MeshStandardMaterial({ map: createRugTexture(), roughness: 0.95 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.2, 0.015, 0.2);
    scene.add(rug);

    // 2. 四周木牆
    const wallMat = new THREE.MeshStandardMaterial({ map: createWallTexture(), roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(28.4, 5.4, 0.5), wallMat);
    backWall.position.set(0, 2.7, -9.2);
    scene.add(backWall);

    const sideWallMat = new THREE.MeshStandardMaterial({ color: 0x733b18, roughness: 0.92 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.4, 20.4), sideWallMat);
    leftWall.position.set(-13.8, 2.7, 0.5);
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5.4, 20.4), sideWallMat);
    rightWall.position.set(13.8, 2.7, 0.5);
    scene.add(rightWall);

    // 3. 石頭大壁爐（北牆正中央）
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x6b6763, roughness: 0.95 });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x2a1d17, roughness: 1 });
    const hearth = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.7, 1.2), stoneMat);
    hearth.position.set(0, 1.35, -8.5);
    scene.add(hearth);

    const chimney = new THREE.Mesh(new THREE.BoxGeometry(2.1, 2.8, 1.0), stoneMat);
    chimney.position.set(0, 4.0, -8.6);
    scene.add(chimney);

    const firePit = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.25, 0.4), darkStoneMat);
    firePit.position.set(0, 0.72, -7.95);
    scene.add(firePit);

    const flameColors = [0xff5500, 0xff9900, 0xffdd33];
    for (let i = 0; i < 10; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.32, 0.28),
        new THREE.MeshBasicMaterial({ color: flameColors[i % flameColors.length] })
      );
      p.position.set((Math.random() - 0.5) * 1.1, 0.4 + Math.random() * 0.7, -7.8);
      p.userData = { baseX: p.position.x, phase: Math.random() * Math.PI * 2, speed: 2.2 + Math.random() * 2.0 };
      scene.add(p);
      fireParticles.push(p);
    }

    fireLight = new THREE.PointLight(0xff842c, 3.2, 16);
    fireLight.position.set(0, 1.5, -7.0);
    scene.add(fireLight);

    // 4. 📜 公會情報佈告欄（北牆左側）
    const boardGroup = new THREE.Group();
    const boardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 2.0, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x5c2b0e, roughness: 0.85 })
    );
    boardFrame.position.set(-5.2, 2.2, -8.85);
    boardFrame.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(boardFrame);
    scene.add(boardFrame);

    const cork = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.65, 0.24),
      new THREE.MeshStandardMaterial({ color: 0xd4a46a, roughness: 0.95 })
    );
    cork.position.set(-5.2, 2.2, -8.84);
    cork.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(cork);
    scene.add(cork);

    const noteColors = [0xfff6d6, 0xffe4b3, 0xd8f5c4, 0xffd6cc];
    [[-5.9, 2.5], [-5.2, 2.4], [-4.5, 2.48], [-5.55, 1.82], [-4.75, 1.85]].forEach((pos, idx) => {
      const note = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.44, 0.05),
        new THREE.MeshStandardMaterial({ color: noteColors[idx % noteColors.length] })
      );
      note.position.set(pos[0], pos[1], -8.7);
      scene.add(note);
    });

    const boardSign = createSignSprite("📜 公會佈告欄", "#5c2b0e", "#e8b45a");
    boardSign.position.set(-5.2, 3.75, -8.4);
    boardSign.userData = { clickType: "interactable", targetId: "board-guild" };
    clickableMeshes.push(boardSign);
    scene.add(boardSign);

    // 5. 🏯「2027 大阪關西冒險」鳥居傳送門（北牆右側）
    const toriiRed = new THREE.MeshStandardMaterial({ color: 0xc92a22, roughness: 0.65 });
    const toriiDark = new THREE.MeshStandardMaterial({ color: 0x26140d, roughness: 0.8 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, emissive: 0x6b4300, roughness: 0.4 });

    const leftPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 3.6, 8), toriiRed);
    leftPillar.position.set(3.6, 1.8, -8.2);
    scene.add(leftPillar);

    const rightPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 3.6, 8), toriiRed);
    rightPillar.position.set(6.4, 1.8, -8.2);
    scene.add(rightPillar);

    const kasagiTop = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.26, 0.48), toriiDark);
    kasagiTop.position.set(5.0, 3.7, -8.2);
    scene.add(kasagiTop);

    const kasagiRed = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.22, 0.4), toriiRed);
    kasagiRed.position.set(5.0, 3.48, -8.2);
    scene.add(kasagiRed);

    const nukiBeam = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.2, 0.28), toriiRed);
    nukiBeam.position.set(5.0, 2.9, -8.2);
    scene.add(nukiBeam);

    const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.54, 0.18), goldMat);
    plaque.position.set(5.0, 3.2, -8.12);
    scene.add(plaque);

    osakaCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.85),
      new THREE.MeshBasicMaterial({ color: 0xffd15c, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
    );
    osakaCurtain.position.set(5.0, 1.45, -8.2);
    osakaCurtain.userData = { clickType: "interactable", targetId: "portal-osaka" };
    clickableMeshes.push(osakaCurtain);
    scene.add(osakaCurtain);

    osakaRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.4, 24),
      new THREE.MeshBasicMaterial({ color: 0xffcb3b, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
    );
    osakaRing.rotation.x = -Math.PI / 2;
    osakaRing.position.set(5.0, 0.03, -6.9);
    osakaRing.userData = { clickType: "interactable", targetId: "portal-osaka" };
    clickableMeshes.push(osakaRing);
    scene.add(osakaRing);

    const osakaLight = new THREE.PointLight(0xffbb33, 2.6, 11);
    osakaLight.position.set(5.0, 2.1, -6.9);
    scene.add(osakaLight);

    const osakaSign = createSignSprite("🏯 2027 大阪冒險", "#991b1b", "#ffd447", "#fffbe6");
    osakaSign.position.set(5.0, 4.45, -7.8);
    osakaSign.userData = { clickType: "interactable", targetId: "portal-osaka" };
    clickableMeshes.push(osakaSign);
    scene.add(osakaSign);

    // 6. 🧭「未來新冒險傳送陣」（東側牆壁）
    const stoneArchMat = new THREE.MeshStandardMaterial({ color: 0x4b627d, roughness: 0.75 });
    const fPillar1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.2, 0.38), stoneArchMat);
    fPillar1.position.set(13.0, 1.6, -1.9);
    scene.add(fPillar1);
    const fPillar2 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 3.2, 0.38), stoneArchMat);
    fPillar2.position.set(13.0, 1.6, 0.7);
    scene.add(fPillar2);
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.38, 3.2), stoneArchMat);
    fTop.position.set(13.0, 3.3, -0.6);
    scene.add(fTop);

    const futureCurtain = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 2.9),
      new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.34, side: THREE.DoubleSide })
    );
    futureCurtain.rotation.y = Math.PI / 2;
    futureCurtain.position.set(13.0, 1.45, -0.6);
    futureCurtain.userData = { clickType: "interactable", targetId: "portal-future" };
    clickableMeshes.push(futureCurtain);
    scene.add(futureCurtain);

    futureRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.25, 24),
      new THREE.MeshBasicMaterial({ color: 0x56ccf2, transparent: true, opacity: 0.68, side: THREE.DoubleSide })
    );
    futureRing.rotation.x = -Math.PI / 2;
    futureRing.position.set(11.2, 0.03, -0.6);
    futureRing.userData = { clickType: "interactable", targetId: "portal-future" };
    clickableMeshes.push(futureRing);
    scene.add(futureRing);

    const futureLight = new THREE.PointLight(0x4cc9f0, 2.2, 10);
    futureLight.position.set(11.4, 1.9, -0.6);
    scene.add(futureLight);

    const futureSign = createSignSprite("🧭 未來場景傳送陣", "#1c4b75", "#7dd3fc", "#e0f7ff");
    futureSign.position.set(12.0, 4.1, -0.6);
    futureSign.userData = { clickType: "interactable", targetId: "portal-future" };
    clickableMeshes.push(futureSign);
    scene.add(futureSign);

    // 7. 🍻 最左側酒館橡木吧檯與酒桶
    const oakDark = new THREE.MeshStandardMaterial({ color: 0x5c2e12, roughness: 0.85 });
    const oakTop = new THREE.MeshStandardMaterial({ color: 0xa6622b, roughness: 0.72 });

    const barBody = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.15, 7.2), oakDark);
    barBody.position.set(-9.7, 0.58, -0.7);
    barBody.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barBody);
    scene.add(barBody);

    const barTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.18, 7.5), oakTop);
    barTop.position.set(-9.7, 1.24, -0.7);
    barTop.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barTop);
    scene.add(barTop);

    for (let i = 0; i < 4; i++) {
      const barrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.48, 0.48, 1.05, 10),
        new THREE.MeshStandardMaterial({ color: 0x7c431c, roughness: 0.85 })
      );
      barrel.position.set(-12.2, 0.53, -3.1 + i * 1.6);
      scene.add(barrel);
    }

    const mugMat = new THREE.MeshStandardMaterial({ color: 0xf6c453, roughness: 0.4 });
    [[-9.3, -2.1], [-9.4, 0.4], [-9.2, 1.4]].forEach(([mx, mz]) => {
      const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.11, 0.26, 8), mugMat);
      mug.position.set(mx, 1.46, mz);
      scene.add(mug);
    });

    const barSign = createSignSprite("🍻 家族酒館吧檯", "#6e3814", "#f5be4f");
    barSign.position.set(-9.7, 2.85, -0.7);
    barSign.userData = { clickType: "interactable", targetId: "tavern-bar" };
    clickableMeshes.push(barSign);
    scene.add(barSign);

    // 8. 兩張清爽酒館木桌（已移除所有不能坐的凳子！）
    function addTableNoChairs(tx, tz) {
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 1.5), oakTop);
      top.position.set(tx, 0.86, tz);
      scene.add(top);
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.84, 0.55), oakDark);
      leg.position.set(tx, 0.42, tz);
      scene.add(leg);
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.07, 0.08, 0.26, 6),
        new THREE.MeshBasicMaterial({ color: 0xffe999 })
      );
      candle.position.set(tx, 1.06, tz);
      scene.add(candle);
    }
    addTableNoChairs(-4.1, 3.55);
    addTableNoChairs(4.5, 3.75);

    // 9. 點地板走路的目標光環
    targetMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.28, 0.46, 18),
      new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    targetMarker.rotation.x = -Math.PI / 2;
    targetMarker.position.set(0, 0.04, 0);
    targetMarker.visible = false;
    scene.add(targetMarker);

    // 10. 溫暖酒館照明
    scene.add(new THREE.AmbientLight(0xffe6c2, 0.95));
    const dirLight = new THREE.DirectionalLight(0xffdfa8, 0.74);
    dirLight.position.set(4, 15, 10);
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
        new THREE.CircleGeometry(0.48, 16),
        new THREE.MeshBasicMaterial({ color: 0x1e0e05, transparent: true, opacity: 0.36 })
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = 0.025;
      group.add(shadow);

      const playerRing = new THREE.Mesh(
        new THREE.RingGeometry(0.56, 0.74, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd647, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
      );
      playerRing.rotation.x = -Math.PI / 2;
      playerRing.position.y = 0.032;
      playerRing.visible = (m.id === currentPlayerId);
      group.add(playerRing);

      const tex = loader.load(m.sheet, () => {
        tex.needsUpdate = true;
      });
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(0.25, 0.25);
      const initRow = DIR_ROW[spot.dir] || 0;
      tex.offset.set(0, (3 - initRow) * 0.25);

      const spriteMat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        alphaTest: 0.15,
        side: THREE.DoubleSide
      });
      const spriteMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9), spriteMat);
      spriteMesh.position.y = 0.95;
      spriteMesh.rotation.x = -0.22;
      spriteMesh.userData = { clickType: "member", memberId: m.id };
      clickableMeshes.push(spriteMesh);
      group.add(spriteMesh);

      // 頭頂名牌
      const online = window.isMemberOnline ? window.isMemberOnline(m.id) : (m.id === currentPlayerId);
      const nameTex = createNameTagSprite(m.name, online, m.id === currentPlayerId, m.inOsakaTrip);
      const nameSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: nameTex, transparent: true, depthTest: false }));
      nameSprite.scale.set(1.8, 0.48, 1);
      nameSprite.position.y = 2.18;
      nameSprite.renderOrder = 15;
      nameSprite.userData = { clickType: "member", memberId: m.id };
      clickableMeshes.push(nameSprite);
      group.add(nameSprite);

      // 頭頂 😊 微笑氣泡（點擊後顯示）
      const smileSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: smileTex,
        transparent: true,
        opacity: 0,
        depthTest: false
      }));
      smileSprite.scale.set(1.15, 1.15, 1);
      smileSprite.position.y = 2.95;
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
    const r = 0.45;
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
  // 互動偵測（附近傳送門／佈告欄／吧檯，或附近家人點了微笑）
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

    if (!best) {
      Object.values(actorMap).forEach(other => {
        if (other.member.id === currentPlayerId) return;
        const d = Math.hypot(player.x - other.x, player.z - other.z);
        if (d <= 2.1 && d < bestDist) {
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
      hint.textContent = "👆 點地板走動 ｜ 點傳送門進入 ｜ 點家人送微笑 😊";
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

    // 1. 壁爐與傳送門特效
    if (fireLight) {
      fireLight.intensity = 2.9 + Math.sin(elapsed * 9.5) * 0.4 + Math.cos(elapsed * 15.2) * 0.2;
    }
    fireParticles.forEach(p => {
      const u = p.userData;
      p.position.y = 0.4 + ((elapsed * u.speed + u.phase) % 0.85);
      p.position.x = u.baseX + Math.sin(elapsed * 5 + u.phase) * 0.1;
      const s = 1 - ((p.position.y - 0.4) / 0.95);
      p.scale.setScalar(Math.max(0.25, s));
    });
    if (osakaRing) osakaRing.rotation.z = elapsed * 0.7;
    if (osakaCurtain) osakaCurtain.material.opacity = 0.28 + Math.sin(elapsed * 3.2) * 0.1;
    if (futureRing) futureRing.rotation.z = -elapsed * 0.6;
    if (targetMarker && targetMarker.visible) {
      const sc = 0.85 + Math.sin(elapsed * 8) * 0.15;
      targetMarker.scale.set(sc, sc, 1);
    }

    // 2. 更新玩家操作移動（全點擊自動走動＋電腦鍵盤相容）
    const player = actorMap[currentPlayerId];
    if (player) {
      let dx = 0, dz = 0;
      if (keys.up) dz -= 1;
      if (keys.down) dz += 1;
      if (keys.left) dx -= 1;
      if (keys.right) dx += 1;

      if (dx !== 0 || dz !== 0) {
        walkGoal = null;
        if (targetMarker) targetMarker.visible = false;
      } else if (walkGoal) {
        const gx = walkGoal.x - player.x;
        const gz = walkGoal.z - player.z;
        const dist = Math.hypot(gx, gz);
        if (dist < 0.26) {
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
        const speed = 5.0;
        const stepX = (dx / len) * speed * dt;
        const stepZ = (dz / len) * speed * dt;

        const prevX = player.x;
        const prevZ = player.z;
        if (!collides(player.x + stepX, player.z)) player.x += stepX;
        if (!collides(player.x, player.z + stepZ)) player.z += stepZ;

        // 若被障礙物完全卡住且是點擊尋路，則平滑結束尋路
        if (walkGoal && Math.hypot(player.x - prevX, player.z - prevZ) < 0.005) {
          const cb = walkGoal.onArrive;
          walkGoal = null;
          if (targetMarker) targetMarker.visible = false;
          if (typeof cb === "function" && Math.hypot(player.x - prevX, player.z - prevZ) < 1) {
            // 若已經很接近目的地就觸發
          }
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
        if (player.moving) {
          pushPositionToCloud(player, false);
        }
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

      // 攝影機平滑跟隨（更寬廣舒適的俯視角）
      const camTargetX = player.x * 0.62;
      const camTargetZ = player.z * 0.62 + 11.8;
      camera.position.x += (camTargetX - camera.position.x) * Math.min(1, dt * 5);
      camera.position.z += (camTargetZ - camera.position.z) * Math.min(1, dt * 5);
      camera.lookAt(player.x * 0.72, 0.9, player.z * 0.72 - 0.8);
    }

    // 3. 更新其他成員位置與所有人的 😊 微笑動畫
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

      // 更新 😊 微笑氣泡彈跳與淡出
      if (actor.smileUntil > now) {
        const age = (now - actor.smileStartedAt) / 1000;
        const remain = (actor.smileUntil - now) / 1000;
        actor.smileSprite.visible = true;
        // 氣泡輕輕上下浮動
        actor.smileSprite.position.y = 3.05 + Math.sin(age * 6) * 0.12;
        actor.smileSprite.material.opacity = remain < 0.45 ? Math.max(0, remain / 0.45) : 1;
        // 被點到前 0.35 秒小人開心微跳一下！
        const hop = age < 0.35 ? Math.sin((age / 0.35) * Math.PI) * 0.24 : 0;
        actor.spriteMesh.position.y = 0.95 + hop;
      } else if (actor.smileSprite.visible) {
        actor.smileSprite.visible = false;
        actor.spriteMesh.position.y = 0.95;
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
  // 全點擊互動（點角色微笑、點傳送門走過去互動、點地板自動走過去）
  // ===========================================================================
  function bindInputs(canvasEl) {
    function isTyping() {
      const tag = document.activeElement && document.activeElement.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    }

    // 電腦版仍支援鍵盤 WASD／方向鍵／空白鍵
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

    // 單指點擊（手機與電腦滑鼠都超順！）
    canvasEl.addEventListener("pointerdown", e => {
      if (!isActiveTab || !renderer || !camera || !floorMesh) return;
      const rect = canvasEl.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);

      // 1. 先檢查是否點到「某位家人」或「傳送門／佈告欄／吧檯」
      const objHits = raycaster.intersectObjects(clickableMeshes, false);
      if (objHits.length > 0) {
        const meta = objHits[0].object.userData;
        if (meta && meta.clickType === "member") {
          // 點任何家人：頭上冒出 😊 微笑氣泡！（不切換角色）
          triggerSmileOnActor(meta.memberId);
          if (meta.memberId !== currentPlayerId) {
            const p = actorMap[currentPlayerId];
            const t = actorMap[meta.memberId];
            if (p && t && Math.hypot(p.x - t.x, p.z - t.z) < 4.5) {
              triggerSmileOnActor(currentPlayerId);
            }
          }
          return;
        }
        if (meta && meta.clickType === "interactable") {
          const obj = INTERACTABLES.find(i => i.id === meta.targetId);
          if (obj) {
            const p = actorMap[currentPlayerId];
            if (p && Math.hypot(p.x - obj.x, p.z - obj.z) <= obj.radius + 0.5) {
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

      // 2. 點到地板：直接走到該位置
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
      scene.background = new THREE.Color(0x1c120c);
      scene.fog = new THREE.Fog(0x1c120c, 22, 42);

      const w = wrap.clientWidth || 640;
      const h = wrap.clientHeight || 440;
      camera = new THREE.PerspectiveCamera(44, w / h, 0.1, 80);
      camera.position.set(0, 10.6, 12.6);

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
      walkGoal = { x: obj.walkX, z: obj.walkZ, onArrive: () => obj.trigger() };
      if (targetMarker) {
        targetMarker.position.set(obj.walkX, 0.04, obj.walkZ);
        targetMarker.visible = true;
      }
    }
  };
})();
