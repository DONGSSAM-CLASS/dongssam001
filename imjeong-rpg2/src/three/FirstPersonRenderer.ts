import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Figure, MapId, PropKind, TileChar, WorldMap } from '../types';
import {
  TILE_SPECS,
  buildWorldGrid,
  findPath,
  isWalkable,
  moveWithCollision,
  pathToNpc,
  type Grid,
  type Point,
} from '../engine/grid';
import { lerpAngle, yawToward } from '../engine/rules';
import { createBuilding } from './buildings';
import { createProp } from './props';
import { createFurniture } from './interior';
import { animateCharacter, createCharacter, createQuestMarker, type BuiltCharacter } from './character';
import { buildMaterials, disposeMaterials, glowMaterial, groundMaterials, setMaterialQuality, type Quality } from './materials';
import { disposeTextures } from './textures';
import { MOODS, createMotes, skyTexture, sunPosition, updateMotes, type Mood } from './atmosphere';
import { texturedBox } from './geom';

/**
 * 1인칭 3D 월드 렌더러 — 2탄의 심장.
 *
 * 1탄의 WorldRenderer(직교 쿼터뷰, 바닥 클릭 이동)를 1인칭으로 다시 짰다.
 * 학생은 **자기 눈높이(1.6 m)** 에서 임시의정원 회의실과 청사 복도를 걷는다.
 *
 * 조작은 세 갈래를 모두 받는다. 중1 교실에는 마우스·키보드·태블릿이 섞여 있기 때문이다.
 *  - 키보드: W A S D / 방향키로 걷기, Q·E 로 돌기, Shift 로 뛰기, 스페이스·엔터로 말 걸기
 *  - 마우스: 끌어서 둘러보기, 바닥을 누르면 그 자리까지 걷기, 사람을 누르면 앞까지 가서 말 걸기
 *  - 터치: 화면 왼쪽 아래 조이스틱으로 걷기(React 가 setMoveInput 으로 넘긴다), 끌어서 둘러보기
 *
 * React 는 HUD 만 그리고, 3D 는 이 클래스가 자체 루프로 돌린다. (1탄과 같은 분리)
 */

export interface Pose {
  x: number;
  z: number;
  yaw: number;
}

export type FocusTarget =
  | { kind: 'npc'; id: string }
  | { kind: 'plaque'; id: string }
  | null;

export interface FirstPersonOptions {
  container: HTMLElement;
  quality?: Quality;
  /** 사람에게 말을 걸었다 (가까이서 스페이스 · 눌러서 다가간 뒤) */
  onNpcActivate(figureId: string): void;
  /** 공훈 명패를 열었다 */
  onPlaqueActivate(figureId: string): void;
  /** 기록 조각을 주웠다 */
  onRelic(relicId: string): void;
  /** 시간의 문에 들어섰다 */
  onPortal(): void;
  /** 바라보는 대상이 바뀌었다 (「스페이스 — 말 걸기」 안내를 띄운다) */
  onFocus(target: FocusTarget): void;
  /** 방에 들어섰다 */
  onRoom(name: string | null): void;
  /** 위치·방향 (나침반·방위 표시용, 초당 약 10번) */
  onPose(pose: Pose): void;
}

interface NpcEntry {
  figureId: string;
  character: BuiltCharacter;
  cell: Point;
  baseFacing: number;
  label: CSS2DObject;
  bubble: HTMLElement | null;
  marker: THREE.Group;
}

interface RelicEntry {
  relicId: string;
  group: THREE.Group;
  cell: Point;
}

interface PlaqueEntry {
  figureId: string;
  group: THREE.Object3D;
  center: THREE.Vector3;
}

const EYE = 1.6;
const WALK = 3.1;
const RUN = 5.0;
const TURN_KEY = 2.1;
const INTERACT_RADIUS = 3.0;
const MAX_LIGHTS = 6;

/**
 * 1탄의 소품·건물은 쿼터뷰 비율(층 높이 1.2)로 만들어졌다.
 * 1인칭 눈높이에서 보면 장난감처럼 작으므로, 종류별로 키운다.
 */
const BUILDING_SCALE = 2.4;
const PROP_SCALE: Partial<Record<PropKind, number>> = {
  tree: 2.3,
  pine: 2.4,
  willow: 2.1,
  cherry: 2.1,
  bush: 1.3,
  reed: 1.2,
  lantern: 1.25,
  'stone-lantern': 1.2,
  streetlamp: 1.6,
  'flag-taegeuk': 1.2,
  'flag-plain': 1.2,
  banner: 1.3,
  signpost: 1.3,
  laundry: 1.2,
  monument: 1.4,
};

const FLOOR_MATERIAL: Partial<Record<TileChar, () => THREE.Material>> = {
  '.': groundMaterials.dirt,
  ',': groundMaterials.grass,
  T: groundMaterials.grass,
  '=': groundMaterials.pavement,
  S: groundMaterials.stone,
  '^': groundMaterials.stone,
  '+': groundMaterials.floor,
  D: groundMaterials.floor,
  C: () => buildMaterials.cloth('#8a3b35'),
  M: () => buildMaterials.ashlar('#e4ddcf'),
  W: groundMaterials.floor,
  K: groundMaterials.floor,
  B: groundMaterials.stone,
};

export class FirstPersonRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(70, 1, 0.05, 220);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly labelRenderer = new CSS2DRenderer();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly clock = new THREE.Clock();
  private readonly container: HTMLElement;
  private readonly options: FirstPersonOptions;
  private readonly vignette: HTMLDivElement;

  private readonly sun: THREE.DirectionalLight;
  private readonly hemi: THREE.HemisphereLight;
  private pmrem: THREE.PMREMGenerator | null = null;
  private envTexture: THREE.Texture | null = null;

  private world = new THREE.Group();
  private disposables: Array<{ dispose(): void }> = [];
  private grid: Grid | null = null;
  private map: WorldMap | null = null;
  private npcs: NpcEntry[] = [];
  private relics: RelicEntry[] = [];
  private plaques: PlaqueEntry[] = [];
  private signLabels: Array<{ label: CSS2DObject; x: number; z: number }> = [];
  private portalGroup: THREE.Group | null = null;
  private portalOpen = false;
  private portalCells: Point[] = [];
  private insidePortal = false;
  private swayers: THREE.Object3D[] = [];
  private motes: THREE.BufferGeometry | null = null;
  private motesPoints: THREE.Points | null = null;
  private guideMesh: THREE.InstancedMesh | null = null;
  private guideTarget: Point | null = null;
  private guideTick = 0;
  private mood: Mood = MOODS.memorial;
  private mapId: MapId = 'memorial';

  /* 플레이어 */
  private px = 0;
  private pz = 0;
  private yaw = 0;
  private pitch = 0;
  private bob = 0;
  private path: Point[] = [];
  private arriveNpc: string | null = null;
  private readonly keys = new Set<string>();
  private moveInput = { x: 0, z: 0 };
  private paused = false;
  private focus: FocusTarget = null;
  private roomName: string | null = null;
  private poseTick = 0;
  private sightTick = 0;

  /* 끌어서 둘러보기 */
  private drag: { id: number; x: number; y: number; startX: number; startY: number; t: number } | null = null;

  private quality: Quality;
  private animationId = 0;
  private disposed = false;
  private frameTimes: number[] = [];

  constructor(options: FirstPersonOptions) {
    this.options = options;
    this.container = options.container;
    this.quality = options.quality ?? (isLowEndDevice() ? 'low' : 'high');
    setMaterialQuality(this.quality);

    this.renderer = new THREE.WebGLRenderer({ antialias: this.quality === 'high', powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality === 'high' ? 1.6 : 1));
    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.tabIndex = 0;
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    this.vignette = document.createElement('div');
    this.vignette.className = 'world-vignette';
    this.container.appendChild(this.vignette);

    this.hemi = new THREE.HemisphereLight(0xdfe6ea, 0x6b6250, 1.2);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2de, 2.2);
    this.sun.castShadow = this.quality === 'high';
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 120;
    const s = 26;
    this.sun.shadow.camera.left = -s;
    this.sun.shadow.camera.right = s;
    this.sun.shadow.camera.top = s;
    this.sun.shadow.camera.bottom = -s;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);

    if (this.quality === 'high') {
      this.pmrem = new THREE.PMREMGenerator(this.renderer);
      const room = new RoomEnvironment();
      this.envTexture = this.pmrem.fromScene(room, 0.04).texture;
      this.scene.environment = this.envTexture;
      this.scene.environmentIntensity = 0.3;
      room.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }

    this.scene.add(this.world);
    this.camera.rotation.order = 'YXZ';

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
    this.animationId = requestAnimationFrame(this.animate);
  }

  /* ═════════════════════════ 맵 적재 ═════════════════════════ */

  loadMap(
    map: WorldMap,
    figureTable: Record<string, Figure>,
    state: { collectedRelics: string[]; portalOpen: boolean; donated: string[]; lettered: string[] },
  ): void {
    this.clearWorld();
    this.map = map;
    this.mapId = map.id;
    this.grid = buildWorldGrid(map);
    this.mood = MOODS[map.id];
    this.applyMood(map);

    this.buildFloors(map);
    this.buildWalls(map);
    this.buildCeiling(map);
    this.buildBuildings(map);
    this.buildProps(map);
    this.buildFurniture(map, figureTable);
    this.buildNpcs(map, figureTable);
    this.buildRelics(map, state.collectedRelics);
    this.buildPortal(map);
    this.buildGuide();
    this.buildMotes();

    // NPC 가 서 있는 칸도 걸어서 뚫고 지나가지 못하게 막는다
    for (const npc of map.npcs) this.grid.blocked[npc.z * this.grid.width + npc.x] = 1;

    this.px = map.spawn.x + 0.5;
    this.pz = map.spawn.z + 0.5;
    this.yaw = map.spawn.yaw;
    this.pitch = -0.04;
    this.path = [];
    this.arriveNpc = null;
    this.insidePortal = true; // 문 위에서 시작하면 바로 튕겨 나가지 않게
    this.roomName = null;
    this.setPortalOpen(state.portalOpen);
    this.setHonors(state.donated, state.lettered);
    this.updateCamera(0);
  }

  private applyMood(map: WorldMap): void {
    const mood = this.mood;
    const sky = skyTexture(mood);
    this.scene.background = sky;
    this.disposables.push(sky);
    this.scene.fog = new THREE.Fog(new THREE.Color(mood.fog), mood.fogNear, mood.fogFar);
    this.sun.color.set(mood.sun);
    this.sun.intensity = mood.sunIntensity;
    this.hemi.color.set(mood.skyLight);
    this.hemi.groundColor.set(mood.groundLight);
    this.hemi.intensity = mood.hemiIntensity;
    this.renderer.toneMappingExposure = mood.exposure;
    this.vignette.style.setProperty('--vignette', String(mood.vignette * 0.7));

    // 힉스필드로 만든 하늘 파노라마가 있으면 그것을 쓴다 (없으면 그라데이션 그대로)
    const url = `${import.meta.env.BASE_URL}assets/higgsfield/sky-${map.id}.jpg`;
    const mapId = map.id;
    new THREE.TextureLoader().load(
      url,
      (texture) => {
        if (this.disposed || this.mapId !== mapId) {
          texture.dispose();
          return;
        }
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        this.scene.background = texture;
        this.disposables.push(texture);
      },
      undefined,
      () => {
        /* 파일이 없으면 조용히 넘어간다 */
      },
    );
  }

  private wallHeight(ch: TileChar): number {
    if (ch === 'B') return 2.5;
    return this.map && this.map.ceiling > 0 ? this.map.ceiling : 3.2;
  }

  /** 같은 모양을 여러 칸에 찍는다 (그리기 호출 1번) */
  private instanced(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    matrices: THREE.Matrix4[],
    castShadow = true,
    receiveShadow = true,
  ): THREE.InstancedMesh | null {
    if (matrices.length === 0) {
      geometry.dispose();
      return null;
    }
    const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = castShadow && this.quality === 'high';
    mesh.receiveShadow = receiveShadow;
    this.world.add(mesh);
    this.disposables.push(geometry);
    this.disposables.push({ dispose: () => mesh.dispose() });
    return mesh;
  }

  private buildFloors(map: WorldMap): void {
    const grid = this.grid!;
    const byChar = new Map<TileChar, THREE.Matrix4[]>();
    const water: THREE.Matrix4[] = [];
    for (let z = 0; z < grid.height; z += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const ch = grid.cells[z * grid.width + x];
        if (ch === 'x') continue;
        if (ch === '~') {
          water.push(new THREE.Matrix4().makeTranslation(x + 0.5, -0.12, z + 0.5));
          continue;
        }
        const list = byChar.get(ch) ?? [];
        // 돌계단은 살짝 높여 층이 진 느낌만 준다
        const y = ch === '^' ? 0.04 : ch === 'C' ? 0.012 : 0;
        list.push(new THREE.Matrix4().makeTranslation(x + 0.5, y, z + 0.5));
        byChar.set(ch, list);
      }
    }
    for (const [ch, matrices] of byChar) {
      const factory = FLOOR_MATERIAL[ch] ?? groundMaterials.dirt;
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      // 1 m 칸마다 텍스처 1/2 장 — 바닥 무늬가 너무 잘게 반복되지 않게
      const uv = geo.getAttribute('uv');
      for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * 0.5, uv.getY(i) * 0.5);
      const mesh = this.instanced(geo, factory(), matrices, false, true);
      if (mesh && (ch === '+' || ch === 'D' || ch === 'M' || ch === 'C')) {
        // 칸마다 무늬가 똑같이 찍히지 않게 텍스처 위치를 살짝씩 비튼다 → 인스턴스라 불가, 대신 회전
        matrices.forEach((m, i) => {
          const pos = new THREE.Vector3().setFromMatrixPosition(m);
          const r = new THREE.Matrix4().makeRotationY(((Math.floor(pos.x) + Math.floor(pos.z)) % 2) * Math.PI);
          mesh.setMatrixAt(i, m.clone().multiply(r));
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    }
    if (water.length) {
      const geo = new THREE.PlaneGeometry(1, 1);
      geo.rotateX(-Math.PI / 2);
      this.instanced(geo, groundMaterials.water(), water, false, true);
    }

    // 맵 바깥 들판 + 클릭 판정용 평면
    const apronGeo = new THREE.PlaneGeometry(grid.width + 160, grid.height + 160);
    apronGeo.rotateX(-Math.PI / 2);
    const apronMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.mood.apron), roughness: 1 });
    const apron = new THREE.Mesh(apronGeo, apronMat);
    apron.position.set(grid.width / 2, -0.02, grid.height / 2);
    apron.receiveShadow = true;
    this.world.add(apron);
    this.disposables.push(apronGeo, apronMat);
    void map;
  }

  private buildWalls(map: WorldMap): void {
    const grid = this.grid!;
    const plaster: THREE.Matrix4[] = [];
    const brick: THREE.Matrix4[] = [];
    const winLow: THREE.Matrix4[] = [];
    const winHigh: THREE.Matrix4[] = [];
    const winGlass: THREE.Matrix4[] = [];
    const winFrame: THREE.Matrix4[] = [];
    const wainscot: THREE.Matrix4[] = [];
    const crown: THREE.Matrix4[] = [];
    const lintel: THREE.Matrix4[] = [];
    const H = this.wallHeight('W');
    const indoorMap = map.ceiling > 0;

    /** 벽 칸의 네 면 중 실내·실외 바닥에 닿은 면 — 면마다 붙일 마감재가 다르다 */
    const faces = (x: number, z: number) => {
      const out: Array<{ dx: number; dz: number; indoor: boolean }> = [];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ch = grid.cells[(z + dz) * grid.width + (x + dx)];
        if (!ch || TILE_SPECS[ch].wall || ch === 'x' || ch === '~') continue;
        out.push({ dx, dz, indoor: TILE_SPECS[ch].indoor });
      }
      return out;
    };
    /** 벽면에 얇은 판을 붙이는 행렬 (dx·dz 쪽 면) */
    const facePanel = (cx: number, cz: number, y: number, dx: number, dz: number) => {
      const m = new THREE.Matrix4().makeTranslation(cx + dx * 0.52, y, cz + dz * 0.52);
      if (dx !== 0) m.multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));
      return m;
    };
    const plinth: THREE.Matrix4[] = [];
    const addTrim = (x: number, z: number, cx: number, cz: number, withWainscot: boolean) => {
      for (const f of faces(x, z)) {
        if (f.indoor) {
          if (withWainscot) wainscot.push(facePanel(cx, cz, 0.46, f.dx, f.dz));
          crown.push(facePanel(cx, cz, H - 0.08, f.dx, f.dz));
        } else {
          plinth.push(facePanel(cx, cz, 0.3, f.dx, f.dz));
        }
      }
    };
    /** 창이 난 벽은 창이 어느 쪽을 향하는지 알아야 한다 (가로로 이어진 벽이면 z 방향) */
    const runsAlongX = (x: number, z: number) => {
      const l = grid.cells[z * grid.width + x - 1];
      const r = grid.cells[z * grid.width + x + 1];
      return (l && TILE_SPECS[l].wall) || (r && TILE_SPECS[r].wall);
    };

    for (let z = 0; z < grid.height; z += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const ch = grid.cells[z * grid.width + x];
        const cx = x + 0.5;
        const cz = z + 0.5;
        if (ch === 'W') {
          plaster.push(new THREE.Matrix4().makeTranslation(cx, H / 2, cz));
          addTrim(x, z, cx, cz, true);
        } else if (ch === 'B') {
          brick.push(new THREE.Matrix4().makeTranslation(cx, this.wallHeight('B') / 2, cz));
        } else if (ch === 'K') {
          const along = runsAlongX(x, z);
          const rot = new THREE.Matrix4().makeRotationY(along ? 0 : Math.PI / 2);
          winLow.push(new THREE.Matrix4().makeTranslation(cx, 0.45, cz));
          winHigh.push(new THREE.Matrix4().makeTranslation(cx, (2.45 + H) / 2, cz));
          winGlass.push(new THREE.Matrix4().makeTranslation(cx, 1.67, cz).multiply(rot));
          winFrame.push(new THREE.Matrix4().makeTranslation(cx, 1.67, cz).multiply(rot));
          addTrim(x, z, cx, cz, false);
        } else if (ch === 'D' && indoorMap) {
          lintel.push(new THREE.Matrix4().makeTranslation(cx, (2.35 + H) / 2, cz));
        }
      }
    }

    const wallColor = map.id === 'memorial' ? '#ece6da' : map.id === 'seoul' ? '#e6dccb' : '#dcd2bf';
    this.instanced(texturedBox(1, H, 1, 1.4), buildMaterials.interiorWall(wallColor), plaster);
    this.instanced(texturedBox(1, this.wallHeight('B'), 1, 0.7), buildMaterials.brick('#8c7f72'), brick);
    this.instanced(texturedBox(1, 0.9, 1, 1.4), buildMaterials.interiorWall(wallColor), winLow);
    this.instanced(texturedBox(1, H - 2.45, 1, 1.4), buildMaterials.interiorWall(wallColor), winHigh);
    // 창 — 바깥 빛이 들어오는 느낌을 주려고 조명의 영향을 받지 않는 밝은 유리로 둔다
    const glassMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(this.mood.skyBottom).lerp(new THREE.Color('#ffffff'), 0.35) });
    this.disposables.push(glassMat);
    this.instanced(new THREE.BoxGeometry(0.86, 1.36, 0.06), glassMat, winGlass, false, false);
    // 창틀과 창살 — 한 상자를 가로·세로로 눌러 여러 번 찍는다
    const frameMat = buildMaterials.wood('#4a3627');
    const bars: THREE.Matrix4[] = [];
    const piece = (m: THREE.Matrix4, tx: number, ty: number, sx: number, sy: number, sz = 1) =>
      bars.push(m.clone().multiply(new THREE.Matrix4().makeTranslation(tx, ty, 0)).multiply(new THREE.Matrix4().makeScale(sx, sy, sz)));
    for (const m of winFrame) {
      piece(m, 0, 0, 0.05, 1);
      piece(m, 0, 0.1, 1, 0.035);
      piece(m, -0.47, 0, 0.07, 1);
      piece(m, 0.47, 0, 0.07, 1);
      piece(m, 0, 0.72, 1, 0.07);
      piece(m, 0, -0.74, 1.04, 0.07, 1.6);
    }
    this.instanced(new THREE.BoxGeometry(1, 1.54, 0.12), frameMat, bars, false, true);
    this.instanced(texturedBox(1.0, 0.92, 0.05, 1.2), buildMaterials.wood('#5b4330'), wainscot, false, true);
    this.instanced(new THREE.BoxGeometry(1.0, 0.14, 0.07), buildMaterials.stoneTrim('#f1eadc'), crown, false, true);
    this.instanced(texturedBox(1.0, 0.6, 0.06, 1), buildMaterials.ashlar('#9d9384'), plinth, false, true);
    this.instanced(texturedBox(1, H - 2.35, 1, 1.4), buildMaterials.interiorWall(wallColor), lintel);
  }

  private buildCeiling(map: WorldMap): void {
    if (map.ceiling <= 0) return;
    const grid = this.grid!;
    const tiles: THREE.Matrix4[] = [];
    const beams: THREE.Matrix4[] = [];
    for (let z = 0; z < grid.height; z += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const ch = grid.cells[z * grid.width + x];
        if (!TILE_SPECS[ch].indoor && !TILE_SPECS[ch].wall) continue;
        if (TILE_SPECS[ch].wall && !this.hasIndoorNeighbour(x, z)) continue;
        tiles.push(new THREE.Matrix4().makeTranslation(x + 0.5, map.ceiling + (TILE_SPECS[ch].wall ? 0.001 : 0), z + 0.5));
        if (x % 3 === 0 && TILE_SPECS[ch].indoor) beams.push(new THREE.Matrix4().makeTranslation(x + 0.5, map.ceiling - 0.09, z + 0.5));
      }
    }
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(Math.PI / 2);
    const color = map.id === 'memorial' ? '#f3efe6' : '#e9e1cf';
    // 천장은 그림자를 드리우지 않는다 — 드리우면 방 안이 한밤처럼 어두워진다 (창으로 드는 빛을 흉내)
    // 천장은 아래를 보므로 하늘빛을 거의 받지 못해 어둡게 뜬다 — 스스로 은은히 밝게 한다
    const ceilingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      emissive: new THREE.Color(color),
      emissiveIntensity: map.id === 'memorial' ? 0.55 : 0.32,
      roughness: 0.95,
    });
    this.disposables.push(ceilingMat);
    this.instanced(geo, ceilingMat, tiles, false, true);
    if (map.id !== 'memorial') {
      this.instanced(new THREE.BoxGeometry(0.16, 0.18, 1.0), buildMaterials.wood('#5b4330'), beams, false, true);
    }
    // 바깥에서 보이는 지붕 — 천장 위를 기와빛 판으로 덮고, 벽 위에는 처마돌을 두른다
    const roof: THREE.Matrix4[] = [];
    const coping: THREE.Matrix4[] = [];
    for (let z = 0; z < grid.height; z += 1) {
      for (let x = 0; x < grid.width; x += 1) {
        const ch = grid.cells[z * grid.width + x];
        if (TILE_SPECS[ch].indoor) roof.push(new THREE.Matrix4().makeTranslation(x + 0.5, map.ceiling + 0.12, z + 0.5));
        else if (TILE_SPECS[ch].wall && ch !== 'B') coping.push(new THREE.Matrix4().makeTranslation(x + 0.5, map.ceiling + 0.2, z + 0.5));
      }
    }
    this.instanced(new THREE.BoxGeometry(1, 0.2, 1), buildMaterials.stoneTrim(map.id === 'memorial' ? '#8d8a84' : '#4f4a44'), roof, true, false);
    this.instanced(texturedBox(1.08, 0.36, 1.08, 1), buildMaterials.stoneTrim(map.id === 'memorial' ? '#d6d0c4' : '#6d6258'), coping, true, true);
  }

  private hasIndoorNeighbour(x: number, z: number): boolean {
    const grid = this.grid!;
    for (let dz = -1; dz <= 1; dz += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const ch = grid.cells[(z + dz) * grid.width + (x + dx)];
        if (ch && TILE_SPECS[ch].indoor) return true;
      }
    }
    return false;
  }

  private buildBuildings(map: WorldMap): void {
    for (const spec of map.buildings) {
      // 옆으로 돌려 세우는 건물은 가로·세로를 바꿔 만들어야 격자 발자국(w×d)과 맞는다
      const turned = Math.abs(Math.sin(spec.facing ?? 0)) > 0.5;
      const bw = (turned ? spec.d : spec.w) / BUILDING_SCALE;
      const bd = (turned ? spec.w : spec.d) / BUILDING_SCALE;
      const built = createBuilding({ ...spec, x: 0, z: 0, w: bw, d: bd });
      const outer = new THREE.Group();
      built.group.position.set(0, 0, 0);
      outer.add(built.group);
      outer.scale.setScalar(BUILDING_SCALE);
      outer.position.set(spec.x + spec.w / 2, 0, spec.z + spec.d / 2);
      outer.rotation.y = spec.facing ?? 0;
      this.world.add(outer);
      this.disposables.push(...built.geometries, ...built.textures);
      if (spec.sign) {
        const el = document.createElement('div');
        el.className = 'building-label';
        el.textContent = spec.sign;
        const label = new CSS2DObject(el);
        label.position.set(0, Math.min(built.labelHeight, 2.2), bd / 2 + 0.1);
        built.group.add(label);
        this.disposables.push({ dispose: () => el.remove() });
      }
    }
  }

  private buildProps(map: WorldMap): void {
    for (const spec of map.props) {
      const built = createProp(spec);
      const k = PROP_SCALE[spec.kind] ?? 1;
      built.group.scale.multiplyScalar(k);
      this.world.add(built.group);
      if (built.sway) this.swayers.push(built.sway);
      this.disposables.push(...built.geometries, ...built.textures);
    }
  }

  private buildFurniture(map: WorldMap, figureTable: Record<string, Figure>): void {
    let lights = 0;
    for (const spec of map.furniture) {
      const built = createFurniture(spec, figureTable, map.ceiling);
      this.world.add(built.group);
      this.disposables.push(...built.geometries, ...built.textures);
      if (spec.kind === 'honor-plaque' && spec.figureId) {
        const center = new THREE.Vector3(spec.x + 0.5, 1.2, spec.z + 0.5);
        this.plaques.push({ figureId: spec.figureId, group: built.group, center });
        const el = document.createElement('div');
        el.className = 'npc-label plaque-label';
        el.innerHTML = `<div class="npc-name">${figureTable[spec.figureId]?.name ?? ''}</div>`;
        const label = new CSS2DObject(el);
        label.position.set(0, 2.25, -0.2);
        built.group.add(label);
        this.disposables.push({ dispose: () => el.remove() });
      }
      if (spec.kind === 'signboard' && spec.label) {
        const el = document.createElement('div');
        el.className = 'signboard-label';
        el.textContent = spec.label;
        const label = new CSS2DObject(el);
        label.position.set(0, 0, -0.38);
        built.group.add(label);
        this.signLabels.push({ label, x: spec.x + 0.5, z: spec.z + 0.5 });
        this.disposables.push({ dispose: () => el.remove() });
      }
      // 천장등마다 점광원을 달면 무거우므로 몇 개만 켠다
      if (built.light && spec.kind === 'ceiling-lamp' && lights < MAX_LIGHTS) {
        const point = new THREE.PointLight(0xffdca8, map.id === 'memorial' ? 6 : 9, 9, 1.6);
        point.position.set(spec.x + 0.5, (map.ceiling || 3.2) - 1.0, spec.z + 0.5);
        this.world.add(point);
        lights += 1;
      }
    }
  }

  private buildNpcs(map: WorldMap, figureTable: Record<string, Figure>): void {
    for (const placement of map.npcs) {
      const figure = figureTable[placement.figureId];
      if (!figure) continue;
      const character = createCharacter(figure);
      character.group.position.set(placement.x + 0.5, 0, placement.z + 0.5);
      const facing = placement.facing ?? 0;
      character.group.rotation.y = facing;
      character.group.userData.figureId = placement.figureId;
      this.world.add(character.group);

      const wrap = document.createElement('div');
      wrap.className = 'npc-label';
      if (placement.bubble) {
        const b = document.createElement('div');
        b.className = 'npc-bubble';
        b.textContent = placement.bubble;
        wrap.appendChild(b);
      }
      const tag = document.createElement('div');
      tag.className = 'npc-name';
      tag.textContent = figure.name;
      wrap.appendChild(tag);
      const label = new CSS2DObject(wrap);
      label.position.set(0, 2.05, 0);
      character.group.add(label);

      const marker = createQuestMarker();
      marker.group.position.set(0, 2.5, 0);
      marker.group.visible = false;
      character.group.add(marker.group);
      this.disposables.push(...marker.geometries, ...character.geometries, { dispose: () => wrap.remove() });

      this.npcs.push({
        figureId: placement.figureId,
        character,
        cell: { x: placement.x, z: placement.z },
        baseFacing: facing,
        label,
        bubble: wrap.querySelector('.npc-bubble'),
        marker: marker.group,
      });
    }
  }

  private buildRelics(map: WorldMap, collected: string[]): void {
    for (const placement of map.relics) {
      if (collected.includes(placement.relicId)) continue;
      const group = new THREE.Group();
      group.position.set(placement.x + 0.5, 0, placement.z + 0.5);
      // 두루마리 + 빛기둥 + 바닥 고리 — 멀리서도 「주울 수 있는 것」으로 보이게
      const scrollGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12);
      const scroll = new THREE.Mesh(scrollGeo, buildMaterials.stoneTrim('#efe3c2'));
      scroll.rotation.z = Math.PI / 2;
      scroll.position.y = 1.0;
      const sealGeo = new THREE.TorusGeometry(0.055, 0.012, 6, 16);
      const seal = new THREE.Mesh(sealGeo, glowMaterial('#b33a3a'));
      seal.rotation.y = Math.PI / 2;
      seal.position.y = 1.0;
      const beamGeo = new THREE.CylinderGeometry(0.18, 0.3, 2.2, 16, 1, true);
      const beam = new THREE.Mesh(
        beamGeo,
        new THREE.MeshBasicMaterial({ color: '#ffd978', transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }),
      );
      beam.position.y = 1.1;
      const ringGeo = new THREE.RingGeometry(0.3, 0.42, 28);
      const ring = new THREE.Mesh(ringGeo, glowMaterial('#ffd978', 0.6));
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.03;
      group.add(scroll, seal, beam, ring);
      group.userData.relicId = placement.relicId;
      this.world.add(group);
      this.disposables.push(scrollGeo, sealGeo, beamGeo, ringGeo, beam.material as THREE.Material);
      this.relics.push({ relicId: placement.relicId, group, cell: { x: placement.x, z: placement.z } });
    }
  }

  private buildPortal(map: WorldMap): void {
    this.portalCells = map.portals.map((p) => ({ x: p.x, z: p.z }));
    if (map.portals.length === 0) return;
    const group = new THREE.Group();
    for (const p of map.portals) {
      const g = new THREE.Group();
      g.position.set(p.x + 0.5, 0, p.z + 0.5);
      g.rotation.y = p.rot ?? 0;
      // 돌로 된 문틀
      const post = texturedBox(0.3, 2.9, 0.4, 1);
      const top = texturedBox(2.2, 0.36, 0.44, 1);
      const stone = buildMaterials.ashlar('#b9b1a0');
      for (const sx of [-1, 1]) {
        const m = new THREE.Mesh(post, stone);
        m.position.set(sx * 0.95, 1.45, 0);
        m.castShadow = true;
        g.add(m);
      }
      const lintel = new THREE.Mesh(top, stone);
      lintel.position.set(0, 3.05, 0);
      g.add(lintel);
      // 빛의 막 — 열려 있을 때만 켠다
      const veilGeo = new THREE.PlaneGeometry(1.6, 2.8);
      const veil = new THREE.Mesh(
        veilGeo,
        new THREE.MeshBasicMaterial({ color: '#ffe6a6', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }),
      );
      veil.position.y = 1.42;
      veil.name = 'veil';
      g.add(veil);
      const el = document.createElement('div');
      el.className = 'building-label portal-label';
      el.textContent = '시간의 문';
      const label = new CSS2DObject(el);
      label.position.set(0, 3.5, 0);
      g.add(label);
      this.disposables.push(post, top, veilGeo, veil.material as THREE.Material, { dispose: () => el.remove() });
      group.add(g);
    }
    this.world.add(group);
    this.portalGroup = group;
  }

  private buildGuide(): void {
    const geo = new THREE.CircleGeometry(0.11, 12);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: '#ffd978', transparent: true, opacity: 0.85, depthWrite: false });
    const mesh = new THREE.InstancedMesh(geo, mat, 80);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.renderOrder = 3;
    this.world.add(mesh);
    this.guideMesh = mesh;
    this.disposables.push(geo, mat, { dispose: () => mesh.dispose() });
  }

  private buildMotes(): void {
    if (this.quality === 'low' || !this.grid) return;
    const motes = createMotes(this.mood, { width: this.grid.width, height: this.grid.height });
    if (!motes) return;
    this.world.add(motes.points);
    this.motes = motes.geometry;
    this.motesPoints = motes.points;
    this.disposables.push(motes.geometry, motes.material);
  }

  /* ═════════════════════════ 바깥에서 부르는 것 ═════════════════════════ */

  setQuestMarkers(figureIds: string[]): void {
    const set = new Set(figureIds);
    for (const npc of this.npcs) {
      npc.marker.visible = set.has(npc.figureId);
      npc.label.element.classList.toggle('has-quest', set.has(npc.figureId));
    }
  }

  setPortalOpen(open: boolean): void {
    this.portalOpen = open;
    this.portalGroup?.traverse((o) => {
      if (o.name === 'veil') o.visible = open;
    });
    this.portalGroup?.traverse((o) => {
      if (o instanceof CSS2DObject) {
        o.element.textContent = open ? '시간의 문 · 열림' : '시간의 문 · 닫힘';
        o.element.classList.toggle('open', open);
      }
    });
  }

  /** 기부·편지를 받은 명패에 국화와 봉투를 놓는다 */
  setHonors(donated: string[], lettered: string[]): void {
    for (const plaque of this.plaques) {
      const d = donated.includes(plaque.figureId);
      const l = lettered.includes(plaque.figureId);
      plaque.group.traverse((o) => {
        if (o.name === 'flowers') o.visible = d;
        if (o.name === 'halo') o.visible = d;
        if (o.name === 'envelope') o.visible = l;
      });
    }
  }

  removeRelic(relicId: string): void {
    const i = this.relics.findIndex((r) => r.relicId === relicId);
    if (i < 0) return;
    this.relics[i].group.removeFromParent();
    this.relics.splice(i, 1);
  }

  /** 대화창이 떠 있는 동안에는 걷지 않는다 */
  setPaused(paused: boolean): void {
    this.paused = paused;
    if (paused) {
      this.keys.clear();
      this.moveInput = { x: 0, z: 0 };
      this.drag = null;
    }
  }

  /** 터치 조이스틱 입력 (-1~1). x 는 오른쪽, z 는 앞쪽 */
  setMoveInput(x: number, z: number): void {
    this.moveInput = { x, z };
    if (x !== 0 || z !== 0) this.cancelWalk();
  }

  /** 화면 버튼으로 돌기 (터치용) */
  turn(radians: number): void {
    this.yaw += radians;
  }

  /** 길잡이 불빛을 켤 목표 (null 이면 끈다) */
  setGuideTarget(target: Point | null): void {
    this.guideTarget = target;
    this.guideTick = 999;
  }

  /** 그 사람 앞까지 걸어가서 말을 건다 */
  walkToNpc(figureId: string): void {
    const npc = this.npcs.find((n) => n.figureId === figureId);
    if (!npc || !this.grid) return;
    const from = this.cell;
    const d = Math.hypot(npc.cell.x + 0.5 - this.px, npc.cell.z + 0.5 - this.pz);
    if (d < 2.2) {
      this.faceNpcAndTalk(npc);
      return;
    }
    const path = pathToNpc(this.grid, from, npc.cell);
    if (path.length === 0) {
      this.faceNpcAndTalk(npc);
      return;
    }
    this.path = path;
    this.arriveNpc = figureId;
  }

  walkTo(point: Point): void {
    if (!this.grid) return;
    const path = findPath(this.grid, this.cell, point);
    this.path = path;
    this.arriveNpc = null;
  }

  cancelWalk(): void {
    this.path = [];
    this.arriveNpc = null;
  }

  get cell(): Point {
    return { x: Math.floor(this.px), z: Math.floor(this.pz) };
  }

  /** 바라보고 있는 대상에게 말을 건다 (스페이스·엔터·화면 버튼) */
  activateFocus(): void {
    const f = this.focus;
    if (!f) return;
    if (f.kind === 'npc') {
      const npc = this.npcs.find((n) => n.figureId === f.id);
      if (npc) this.faceNpcAndTalk(npc);
    } else {
      this.options.onPlaqueActivate(f.id);
    }
  }

  private faceNpcAndTalk(npc: NpcEntry): void {
    const nx = npc.cell.x + 0.5;
    const nz = npc.cell.z + 0.5;
    this.targetYaw = yawToward(nx - this.px, nz - this.pz);
    // 사람도 나를 돌아본다
    npc.character.group.rotation.y = Math.atan2(this.px - nx, this.pz - nz);
    this.options.onNpcActivate(npc.figureId);
  }

  private targetYaw: number | null = null;

  /* ═════════════════════════ 입력 ═════════════════════════ */

  private handleKeyDown = (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    if (this.paused) return;
    const key = event.key.toLowerCase();
    if ([' ', 'enter'].includes(key)) {
      if (this.focus) {
        event.preventDefault();
        this.activateFocus();
      }
      return;
    }
    if (['w', 'a', 's', 'd', 'q', 'e', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(key)) {
      if (key.startsWith('arrow')) event.preventDefault();
      this.keys.add(key);
      if (key !== 'shift') this.cancelWalk();
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.key.toLowerCase());
  };

  private handleBlur = () => {
    this.keys.clear();
  };

  private handlePointerDown = (event: PointerEvent) => {
    if (this.paused) return;
    this.renderer.domElement.focus({ preventScroll: true });
    this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY, t: performance.now() };
  };

  private handlePointerMove = (event: PointerEvent) => {
    if (!this.drag || event.pointerId !== this.drag.id || this.paused) return;
    const dx = event.clientX - this.drag.x;
    const dy = event.clientY - this.drag.y;
    this.drag.x = event.clientX;
    this.drag.y = event.clientY;
    const moved = Math.hypot(event.clientX - this.drag.startX, event.clientY - this.drag.startY);
    if (moved < 5) return;
    // 터치는 화면이 작아 같은 거리에 더 많이 돌린다
    const k = event.pointerType === 'touch' ? 0.006 : 0.0042;
    this.yaw -= dx * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.1, 1.0);
    this.targetYaw = null;
  };

  private handlePointerUp = (event: PointerEvent) => {
    const drag = this.drag;
    this.drag = null;
    if (!drag || event.pointerId !== drag.id || this.paused) return;
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (moved > 7 || performance.now() - drag.t > 450) return;
    // 끌지 않고 눌렀다 → 누른 것을 찾는다
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.raycaster.far = 60;

    const npcHit = this.raycaster.intersectObjects(this.npcs.map((n) => n.character.group), true)[0];
    if (npcHit) {
      let node: THREE.Object3D | null = npcHit.object;
      while (node && !node.userData.figureId) node = node.parent;
      if (node?.userData.figureId) {
        this.walkToNpc(node.userData.figureId as string);
        return;
      }
    }
    const plaqueHit = this.raycaster.intersectObjects(this.plaques.map((p) => p.group), true)[0];
    if (plaqueHit) {
      let node: THREE.Object3D | null = plaqueHit.object;
      while (node && !node.userData.plaqueFigureId) node = node.parent;
      const id = node?.userData.plaqueFigureId as string | undefined;
      if (id) {
        const p = this.plaques.find((q) => q.figureId === id)!;
        if (Math.hypot(p.center.x - this.px, p.center.z - this.pz) < 3.2) this.options.onPlaqueActivate(id);
        else this.walkTo({ x: Math.floor(p.center.x), z: Math.floor(p.center.z) + 1 });
        return;
      }
    }
    const relicHit = this.raycaster.intersectObjects(this.relics.map((r) => r.group), true)[0];
    if (relicHit) {
      let node: THREE.Object3D | null = relicHit.object;
      while (node && !node.userData.relicId) node = node.parent;
      const r = this.relics.find((q) => q.relicId === node?.userData.relicId);
      if (r) {
        this.walkTo(r.cell);
        return;
      }
    }
    // 벽·가구·바닥 중 가장 먼저 맞은 곳의 칸으로 걷는다
    const hits = this.raycaster.intersectObjects(this.world.children, true);
    const hit = hits.find((h) => h.object.visible && !(h.object instanceof THREE.Points));
    if (hit && this.grid) {
      const p = hit.point.clone().addScaledVector(this.raycaster.ray.direction, hit.point.y > 0.1 ? -0.3 : 0);
      this.walkTo({ x: Math.floor(p.x), z: Math.floor(p.z) });
    }
  };

  private handleResize = () => {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    this.camera.aspect = width / height;
    // 세로로 긴 화면(태블릿 세로)에서는 시야를 넓혀 답답하지 않게
    this.camera.fov = width < height ? 82 : 70;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);
  };

  /* ═════════════════════════ 루프 ═════════════════════════ */

  private animate = () => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.08);
    const time = this.clock.elapsedTime;
    this.watchPerformance(delta);

    const speed = this.map ? this.stepPlayer(delta) : 0;
    this.updateCamera(speed, delta);

    this.sightTick += delta;
    const checkSight = this.sightTick > 0.15;
    if (checkSight) this.sightTick = 0;
    for (const npc of this.npcs) {
      animateCharacter(npc.character, time + npc.cell.x * 0.7, 0);
      const d = Math.hypot(npc.cell.x + 0.5 - this.px, npc.cell.z + 0.5 - this.pz);
      if (checkSight) {
        // 벽 너머 사람의 이름표는 숨긴다 (1인칭에서 벽을 뚫고 글자가 보이면 헷갈린다)
        const seen = this.lineOfSight(npc.cell.x + 0.5, npc.cell.z + 0.5);
        if (npc.bubble) npc.bubble.style.display = d < 7 && seen ? '' : 'none';
        npc.label.element.style.opacity = seen && (d < 16 || npc.marker.visible) ? '1' : '0';
      }
      if (npc.marker.visible) {
        npc.marker.position.y = 2.5 + Math.sin(time * 3.2 + npc.cell.x) * 0.1;
        npc.marker.rotation.y = time * 1.6;
      }
    }
    for (const relic of this.relics) {
      relic.group.children[0].position.y = 1.0 + Math.sin(time * 2 + relic.cell.x) * 0.08;
      relic.group.children[1].position.y = relic.group.children[0].position.y;
      relic.group.rotation.y = time * 0.8;
    }
    if (this.portalGroup && this.portalOpen) {
      this.portalGroup.traverse((o) => {
        if (o.name === 'veil') ((o as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.42 + Math.sin(time * 2.4) * 0.15;
      });
    }
    for (const sway of this.swayers) sway.rotation.y = Math.sin(time * 1.25) * 0.2;
    if (this.motes && this.grid) {
      updateMotes(this.motes, delta, { width: this.grid.width, height: this.grid.height }, time);
      // 꽃잎·먼지는 바깥에서만 보인다
      const here = this.grid.cells[Math.floor(this.pz) * this.grid.width + Math.floor(this.px)];
      this.motesPoints!.visible = !(here && TILE_SPECS[here].indoor);
    }
    if (checkSight) {
      for (const sign of this.signLabels) {
        const d = Math.hypot(sign.x - this.px, sign.z - this.pz);
        sign.label.element.style.opacity = d < 22 && this.lineOfSight(sign.x, sign.z) ? '1' : '0';
      }
      for (const plaque of this.plaques) {
        const label = plaque.group.children.find((c) => c instanceof CSS2DObject) as CSS2DObject | undefined;
        if (label) label.element.style.opacity = this.lineOfSight(plaque.center.x, plaque.center.z) ? '1' : '0';
      }
    }

    this.updateGuide(delta);
    this.checkTriggers();

    const sun = sunPosition(this.mood, 46);
    this.sun.position.set(this.px + sun.x, sun.y, this.pz + sun.z);
    this.sun.target.position.set(this.px, 0, this.pz);
    this.sun.target.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  /** 한 프레임만큼 걷는다. 돌아온 값은 걷는 빠르기(0~1) */
  private stepPlayer(delta: number): number {
    if (!this.grid || this.paused) return 0;
    const k = this.keys;
    if (k.has('q')) this.yaw += TURN_KEY * delta;
    if (k.has('e')) this.yaw -= TURN_KEY * delta;
    if (k.has('arrowleft')) this.yaw += TURN_KEY * delta;
    if (k.has('arrowright')) this.yaw -= TURN_KEY * delta;

    let fwd = 0;
    let side = 0;
    if (k.has('w') || k.has('arrowup')) fwd += 1;
    if (k.has('s') || k.has('arrowdown')) fwd -= 1;
    if (k.has('d')) side += 1;
    if (k.has('a')) side -= 1;
    fwd += this.moveInput.z;
    side += this.moveInput.x;

    let dx = 0;
    let dz = 0;
    let pace = k.has('shift') ? RUN : WALK;

    if (fwd !== 0 || side !== 0) {
      this.targetYaw = null;
      const len = Math.min(1, Math.hypot(fwd, side));
      const nf = fwd / Math.max(1, Math.hypot(fwd, side));
      const ns = side / Math.max(1, Math.hypot(fwd, side));
      const sin = Math.sin(this.yaw);
      const cos = Math.cos(this.yaw);
      // yaw 0 = -z 방향
      dx = (-sin * nf + cos * ns) * pace * len * delta;
      dz = (-cos * nf - sin * ns) * pace * len * delta;
    } else if (this.path.length > 0) {
      // 자동 걷기 — 다음 칸 가운데로 가면서 그쪽을 바라본다
      pace = WALK * 1.15;
      const next = this.path[0];
      const tx = next.x + 0.5;
      const tz = next.z + 0.5;
      const ddx = tx - this.px;
      const ddz = tz - this.pz;
      const dist = Math.hypot(ddx, ddz);
      const step = pace * delta;
      this.yaw = lerpAngle(this.yaw, yawToward(ddx, ddz), Math.min(1, delta * 7));
      this.pitch += (-0.05 - this.pitch) * Math.min(1, delta * 4);
      if (dist <= step) {
        this.px = tx;
        this.pz = tz;
        this.path.shift();
        if (this.path.length === 0) this.onPathEnd();
        return 1;
      }
      dx = (ddx / dist) * step;
      dz = (ddz / dist) * step;
    } else if (this.targetYaw !== null) {
      this.yaw = lerpAngle(this.yaw, this.targetYaw, Math.min(1, delta * 8));
      this.pitch += (-0.06 - this.pitch) * Math.min(1, delta * 6);
      if (Math.abs(lerpAngle(this.yaw, this.targetYaw, 1) - this.yaw) < 0.01) this.targetYaw = null;
    }

    if (dx === 0 && dz === 0) return 0;
    const moved = moveWithCollision(this.grid, { x: this.px, z: this.pz }, dx, dz);
    const actual = Math.hypot(moved.x - this.px, moved.z - this.pz);
    this.px = moved.x;
    this.pz = moved.z;
    return Math.min(1.5, actual / Math.max(0.0001, WALK * delta));
  }

  /** 플레이어 자리에서 (tx, tz)까지 벽에 막히지 않고 보이는지 — 격자 위를 잘게 짚어 본다 */
  private lineOfSight(tx: number, tz: number): boolean {
    const grid = this.grid;
    if (!grid) return true;
    const dx = tx - this.px;
    const dz = tz - this.pz;
    const steps = Math.ceil(Math.hypot(dx, dz) / 0.25);
    for (let i = 1; i < steps; i += 1) {
      const x = Math.floor(this.px + (dx * i) / steps);
      const z = Math.floor(this.pz + (dz * i) / steps);
      const ch = grid.cells[z * grid.width + x];
      if (ch && TILE_SPECS[ch].wall) return false;
    }
    return true;
  }

  private onPathEnd(): void {
    const id = this.arriveNpc;
    this.arriveNpc = null;
    if (!id) return;
    const npc = this.npcs.find((n) => n.figureId === id);
    if (npc) this.faceNpcAndTalk(npc);
  }

  private updateCamera(speed: number, delta = 0): void {
    if (speed > 0.05) this.bob += delta * 9 * Math.min(1.4, speed);
    const bobY = speed > 0.05 ? Math.sin(this.bob) * 0.035 : 0;
    this.camera.position.set(this.px, EYE + bobY, this.pz);
    this.camera.rotation.set(this.pitch, this.yaw, 0);

    this.poseTick += delta;
    if (this.poseTick > 0.1) {
      this.poseTick = 0;
      this.options.onPose({ x: this.px, z: this.pz, yaw: this.yaw });
    }
  }

  private updateGuide(delta: number): void {
    if (!this.guideMesh || !this.grid) return;
    this.guideTick += delta;
    if (this.guideTick < 0.5) return;
    this.guideTick = 0;
    if (!this.guideTarget) {
      this.guideMesh.count = 0;
      return;
    }
    const path = pathToNpc(this.grid, this.cell, this.guideTarget);
    const m = new THREE.Matrix4();
    let n = 0;
    for (let i = 1; i < path.length && n < 80; i += 2) {
      m.makeTranslation(path[i].x + 0.5, 0.03, path[i].z + 0.5);
      this.guideMesh.setMatrixAt(n, m);
      n += 1;
    }
    this.guideMesh.count = n;
    this.guideMesh.instanceMatrix.needsUpdate = true;
  }

  private checkTriggers(): void {
    if (!this.grid || !this.map) return;
    // 기록 조각 줍기
    for (const relic of [...this.relics]) {
      if (Math.hypot(relic.cell.x + 0.5 - this.px, relic.cell.z + 0.5 - this.pz) < 0.9) {
        this.removeRelic(relic.relicId);
        this.options.onRelic(relic.relicId);
      }
    }
    // 시간의 문
    const onPortal = this.portalCells.some((p) => Math.hypot(p.x + 0.5 - this.px, p.z + 0.5 - this.pz) < 0.7);
    if (onPortal && !this.insidePortal && !this.paused) {
      this.insidePortal = true;
      this.cancelWalk();
      this.options.onPortal();
    } else if (!onPortal) {
      this.insidePortal = false;
    }
    // 바라보는 대상
    let best: FocusTarget = null;
    let bestScore = Infinity;
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    for (const npc of this.npcs) {
      const dx = npc.cell.x + 0.5 - this.px;
      const dz = npc.cell.z + 0.5 - this.pz;
      const d = Math.hypot(dx, dz);
      if (d > INTERACT_RADIUS) continue;
      const dot = (dx * fx + dz * fz) / Math.max(0.001, d);
      if (dot < 0.55) continue;
      const score = d * (2 - dot);
      if (score < bestScore) {
        bestScore = score;
        best = { kind: 'npc', id: npc.figureId };
      }
    }
    for (const plaque of this.plaques) {
      const dx = plaque.center.x - this.px;
      const dz = plaque.center.z - this.pz;
      const d = Math.hypot(dx, dz);
      if (d > 2.6) continue;
      const dot = (dx * fx + dz * fz) / Math.max(0.001, d);
      if (dot < 0.6) continue;
      const score = d * (2 - dot);
      if (score < bestScore) {
        bestScore = score;
        best = { kind: 'plaque', id: plaque.figureId };
      }
    }
    if (best?.kind !== this.focus?.kind || best?.id !== this.focus?.id) {
      this.focus = best;
      this.options.onFocus(best);
    }
    // 방 이름
    const room = this.map.rooms.find((r) => this.px >= r.x && this.px < r.x + r.w && this.pz >= r.z && this.pz < r.z + r.d);
    const name = room?.name ?? null;
    if (name !== this.roomName) {
      this.roomName = name;
      this.options.onRoom(name);
    }
  }

  /** 첫 몇 초 동안 프레임이 심하게 떨어지면 그림자를 끄고 해상도를 낮춘다 (학교 크롬북 대비) */
  private watchPerformance(delta: number): void {
    if (this.quality === 'low' || this.frameTimes.length > 240) return;
    this.frameTimes.push(delta);
    if (this.frameTimes.length === 240) {
      const avg = this.frameTimes.slice(60).reduce((a, b) => a + b, 0) / 180;
      if (avg > 1 / 26) {
        this.renderer.shadowMap.enabled = false;
        this.sun.castShadow = false;
        this.renderer.setPixelRatio(1);
        this.handleResize();
        this.scene.traverse((o) => {
          const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
          if (mat) mat.needsUpdate = true;
        });
      }
    }
  }

  /* ═════════════════════════ 정리 ═════════════════════════ */

  private clearWorld(): void {
    this.world.removeFromParent();
    this.world = new THREE.Group();
    this.scene.add(this.world);
    for (const item of this.disposables) item.dispose();
    this.disposables = [];
    this.npcs = [];
    this.relics = [];
    this.plaques = [];
    this.signLabels = [];
    this.swayers = [];
    this.portalGroup = null;
    this.portalCells = [];
    this.motes = null;
    this.motesPoints = null;
    this.guideMesh = null;
    this.focus = null;
    this.options.onFocus(null);
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
    this.clearWorld();
    disposeMaterials();
    disposeTextures();
    this.envTexture?.dispose();
    this.pmrem?.dispose();
    this.renderer.dispose();
    canvas.remove();
    this.labelRenderer.domElement.remove();
    this.vignette.remove();
  }

  /** 검사용 — 벽을 통과하지 않았는지 등 */
  isWalkableAt(x: number, z: number): boolean {
    return this.grid ? isWalkable(this.grid, x, z) : false;
  }
}

/** 코어 수가 적거나 메모리가 작은 기기(학교 크롬북 등)는 처음부터 가볍게 */
function isLowEndDevice(): boolean {
  const nav = navigator as Navigator & { deviceMemory?: number };
  if (new URLSearchParams(window.location.search).has('low')) return true;
  if (new URLSearchParams(window.location.search).has('high')) return false;
  return (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
}
