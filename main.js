// addProtocolの設定
let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", (request) => {
  return new Promise((resolve, reject) => {
    const callback = (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve({ data });
      }
    };
    protocol.tile(request, callback);
  });
});

// マップの初期化
const map = new maplibregl.Map({
  container: "map",
  style: "std.json",
  hash: true,
  zoom: 18.31,
  center: [139.114998, 36.08429],
  pitch: 67,
  maxPitch: 85,
  bearing: -137.1,
  attributionControl: false,
});

// ズーム・回転
map.addControl(new maplibregl.NavigationControl());

// フルスクリーンモードのオンオフ
map.addControl(new maplibregl.FullscreenControl());

// 現在位置表示
map.addControl(
  new maplibregl.GeolocateControl({
    positionOptions: {
      enableHighAccuracy: false,
    },
    fitBoundsOptions: { maxZoom: 18 },
    trackUserLocation: true,
    showUserLocation: true,
  })
);

// スケール表示
map.addControl(
  new maplibregl.ScaleControl({
    maxWidth: 200,
    unit: "metric",
  })
);

// Attributionを折りたたみ表示
map.addControl(
  new maplibregl.AttributionControl({
    compact: true,
    customAttribution:
      '<a href="https://twitter.com/shi__works" target="_blank">X(旧Twitter)</a> | <a href="" target="_blank">GitHub</a> | <a href="https://www.geospatial.jp/ckan/dataset/river-pointcloud-saitama" target="_blank">埼玉県 河川点群データを加工して作成</a> | <a href="https://sketchfab.com/3d-models/dji-tello-36365bad0ebd46428e6241676725dcec" target="_blank">Dji Tello</a> by <a href="https://sketchfab.com/Temooor" target="_blank">Temoor</a> licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>',
  })
);

// 3D地形コントロール表示
map.addControl(
  new maplibregl.TerrainControl({
    source: "gsidem-terrain-rgb",
    exaggeration: 1, // 標高を強調する倍率
  })
);

// 環境光を作成
const ambientLight = new deck.AmbientLight({
  color: [255, 255, 255],
  intensity: 3.0,
});

// ライティングエフェクトを作成
const lightingEffect = new deck.LightingEffect({ ambientLight });

// 3Dモデル
const MODEL_URL = "data/dji_tello_1.glb";

let overlay, tile3dLayer1, tile3dLayer2;

// マップをロード
map.on("load", () => {
  // 標高タイルソース
  map.addSource("gsidem-terrain-rgb", {
    type: "raster-dem",
    tiles: [
      "https://gbank.gsj.jp/seamless/elev/terrainRGB/land/{z}/{y}/{x}.png",
    ],
    attribution:
      '<a href="https://tiles.gsj.jp/tiles/elev/tiles.html" target="_blank">産総研シームレス標高タイル</a>',
    tileSize: 256,
  });

  // 標高タイルセット
  map.setTerrain({ source: "gsidem-terrain-rgb", exaggeration: 1 });

  // 最適化ベクトルタイル 送電線（PMTiles）ソース
  map.addSource("power-line", {
    type: "vector",
    url: "pmtiles://PwrTrnsmL.pmtiles",
    attribution: '<a href="">国土地理院最適化ベクトルタイル（送電線）</a>',
  });

  // 最適化ベクトルタイル 送電線ラインレイヤ
  map.addLayer({
    id: "power-line-1",
    type: "line",
    source: "power-line",
    "source-layer": "PwrTrnsmL",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "rgba(0, 112, 32, 0.3)",
      "line-width": 12,
      "line-blur": 0.8,
    },
  });

  // 最適化ベクトルタイル 送電線ラインレイヤ
  map.addLayer({
    id: "power-line-2",
    type: "line",
    source: "power-line",
    "source-layer": "PwrTrnsmL",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "rgba(0, 172, 64, 0.6)",
      "line-width": 6,
      "line-blur": 0.4,
    },
  });

  // 最適化ベクトルタイル 送電線ラインレイヤ
  map.addLayer({
    id: "power-line-3",
    type: "line",
    source: "power-line",
    "source-layer": "PwrTrnsmL",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "rgba(220, 236, 220, 1)",
      "line-width": 1.5,
    },
  });

  // Tile3DLayerの初期化
  tile3dLayer1 = new deck.Tile3DLayer({
    id: "tile3dlayer-1",
    pointSize: 1,
    data: "https://shiworks.xsrv.jp/3dtiles/shizuoka-pc/sunen-substation/tileset.json",
    loader: Tiles3DLoader,
    onTileLoad: (d) => {
      const { content } = d;
      content.cartographicOrigin.z -= 0;
    },
    _lighting: "pbr",
    opacity: 1,
  });

  // Tile3DLayerの初期化
  tile3dLayer2 = new deck.Tile3DLayer({
    id: "tile3dlayer-2",
    pointSize: 1,
    data: "https://shiworks2.xsrv.jp/3dtiles/pref-saitama/river-pointcloud/chichibu-railway-spot/tileset.json",
    loader: Tiles3DLoader,
    onTileLoad: (d) => {
      const { content } = d;
      content.cartographicOrigin.z -= 0;
    },
    _lighting: "pbr",
    opacity: 1,
  });

  // Skyレイヤ
  map.setSky({
    "sky-color": "#199EF3",
    "sky-horizon-blend": 0.7,
    "horizon-color": "#f0f8ff",
    "horizon-fog-blend": 0.8,
    "fog-color": "#2c7fb8",
    "fog-ground-blend": 0.9,
    "atmosphere-blend": ["interpolate", ["linear"], ["zoom"], 0, 1, 12, 0],
  });

  // map.on('idle'...だとレイヤが正常に読み込まれないため、setTimeoutで遅延実行
  setTimeout(() => {
    // タイルセットが読み込まれるのを待ってから実行
    const center = map.getCenter().toArray();
    const elevation = parseFloat(map.transform.elevation) || 0; // 標高が取得できない場合は0mとする

    const scenegraphLayer = new deck.ScenegraphLayer({
      id: "scenegraphLayer",
      data: [{}],
      getPosition: () => [center[0], center[1], elevation + 30],
      getOrientation: [0, -93, 90],
      scenegraph: MODEL_URL,
      sizeScale: 1,
      _animations: {
        "*": { speed: 10 },
      },
      _lighting: "pbr",
      pickable: true,
      opacity: 1,
    });

    // 現在のドローンの緯度経度、高さと現在のズームレベルを取得
    const droneData = {
      lng: center[0],
      lat: center[1],
      altitude: elevation + 30,
      zoom: Math.floor(map.getZoom()),
    };

    // 空間IDを取得
    const spatialID = calculateSpatialID(
      droneData.lng,
      droneData.lat,
      droneData.altitude,
      droneData.zoom
    );

    // ラベルを作成
    const label = `${spatialID.z}/${spatialID.f}/${spatialID.x}/${spatialID.y}`;

    const textLayer = new deck.TextLayer({
      id: "textLayer",
      data: [{}],
      getPosition: () => [center[0], center[1], elevation + 40],
      getText: () =>
        `elevation+30m: ${(elevation + 30).toFixed(1)}m\nspatialID: ${label}`,
      getSize: 14,
      getColor: [255, 255, 255, 255],
      sizeScale: 1,
      billboard: true,
      background: true,
      getBackgroundColor: [0, 0, 0, 128],
      backgroundPadding: [2, 2],
    });

    overlay = new deck.MapboxOverlay({
      interleaved: true,
      layers: [tile3dLayer1, tile3dLayer2, scenegraphLayer, textLayer],
      effects: [lightingEffect],
    });

    map.addControl(overlay);
  }, 1000); // 1秒の遅延を入れる

  map.showTileBoundaries = false;
});

// move イベントでレイヤーを更新
map.on("move", () => {
  const center = map.getCenter().toArray();
  const elevation = parseFloat(map.transform.elevation) || 0; // 標高が取得できない場合は0mとする

  const newScenegraphLayer = new deck.ScenegraphLayer({
    id: "scenegraphLayer",
    data: [{}],
    getPosition: () => [center[0], center[1], elevation + 30],
    getOrientation: [0, -93, 90],
    scenegraph: MODEL_URL,
    sizeScale: 1,
    _animations: {
      "*": { speed: 10 },
    },
    _lighting: "pbr",
    pickable: true,
    opacity: 1,
  });

  // 現在のドローンの緯度経度、高さと現在のズームレベルを取得
  const droneData = {
    lng: center[0],
    lat: center[1],
    altitude: elevation + 30,
    zoom: Math.floor(map.getZoom()),
  };

  // 空間IDを取得
  const spatialID = calculateSpatialID(
    droneData.lng,
    droneData.lat,
    droneData.altitude,
    droneData.zoom
  );

  // ラベルを作成
  const label = `${spatialID.z}/${spatialID.f}/${spatialID.x}/${spatialID.y}`;

  const newTextLayer = new deck.TextLayer({
    id: "textLayer",
    data: [{}],
    getPosition: () => [center[0], center[1], elevation + 40],
    getText: () =>
      `elevation+30m: ${(elevation + 30).toFixed(1)}m\nspatialID: ${label}`,
    getSize: 14,
    getColor: [255, 255, 255, 255],
    sizeScale: 1,
    billboard: true,
    background: true,
    getBackgroundColor: [0, 0, 0, 128],
    backgroundPadding: [2, 2],
  });

  overlay.setProps({
    layers: [tile3dLayer1, tile3dLayer2, newScenegraphLayer, newTextLayer],
  });
});

// 空間IDを取得する関数
function calculateSpatialID(lng, lat, altitude, zoom) {
  // 緯度を度からラジアンに変換
  const lat_rad = (lat * Math.PI) / 180;

  // n, Z, H を計算
  const n = Math.pow(2, zoom);
  const Z = 25; // ボクセルの高さが1mとなるズームレベル
  const H = Math.pow(2, Z);

  const z = zoom;

  // 標高インデックス（f）を計算
  const f = Math.floor((n * altitude) / H);

  // x座標インデックス（x）を計算
  const x = Math.floor(n * ((lng + 180) / 360));

  // y座標インデックス（y）を計算
  const y = Math.floor(
    (n / 2) *
      (1 - Math.log(Math.tan(lat_rad) + 1 / Math.cos(lat_rad)) / Math.PI)
  );

  // 空間IDをオブジェクトとして返す
  return { z, f, x, y };
}
