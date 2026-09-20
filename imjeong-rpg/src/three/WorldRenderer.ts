import * as THREE from 'three';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { Figure, MapId, WorldMap } from '../types';
import { buildWorldGrid, type Grid, type Point } from '../engine/grid';
import {
  CAMERA_DISTANCE,
  DEFAULT_VIEW_TILES,
  cameraPosition,
  clampViewTiles,
  facingAngle,
  lerpAngle,
} from '../engine/isometric';
import { createBuilding } from './buildings';
import { createProp } from './props';
import {
  animateCharacter,
  createCharacter,
  createQuestMarker,
  type BuiltCharacter,
} from './character';
import { buildSurroundings, buildTerrain, scatterGrassTufts, scatterPebbles } from './terrain';
import { disposeMaterials, setMaterialQuality, type Quality } from './materials';
import { disposeTextures, grassTuftTexture } from './textures';
import { MOODS, createMotes, skyTexture, sunPosition, updateMotes, type Mood } from './atmosphere';

/**
 * 아이소메트릭 3D 월드 렌더러.
 *
 * React 는 화면 밖(HUD·대화창)만 그리고, 3D 월드는 이 클래스가 직접 돌린다.
 * 매 프레임 React 를 다시 그리면 저사양 기기에서 프레임이 떨어지기 때문이다.
 */

export interface WorldRendererOptions {
  container: HTMLElement;
  quality?: Quality;
  onGroundClick(point: Point): void;
  onNpcClick(figureId: string): void;
  onArrive?(point: Point): void;
}

/** 플레이어를 가리는 동안 반투명해지는 물체 */
interface Occluder {
  group: THREE.Object3D;
  meshes: Array<{ mesh: THREE.Mesh; original: THREE.Material | THREE.Material[] }>;
  ghosted: boolean;
}

interface NpcEntry {
  figureId: string;
  character: BuiltCharacter;
  cell: Point;
  label: CSS2DObject;
  bubble: HTMLElement | null;
  /** 임무를 주는 사람 머리 위의 느낌표 */
  marker: THREE.Group | null;
}

const WALK_SPEED = 3.3;
const BUBBLE_RADIUS = 7.5;
/** 이 거리 안의 인물만 이름표를 띄운다 (임무를 주는 인물은 예외) */
const NAME_RADIUS = 13;

export class WorldRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly labelRenderer = new CSS2DRenderer();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly clock = new THREE.Clock();
  private readonly container: HTMLElement;
  private readonly options: WorldRendererOptions;
  private readonly vignette: HTMLDivElement;

  private worldGroup = new THREE.Group();
  private disposables: Array<{ dispose(): void }> = [];
  private npcs: NpcEntry[] = [];
  private buildingGroups: THREE.Object3D[] = [];
  private occluders: Occluder[] = [];
  private ghostMaterial: THREE.Material;
  private occlusionTick = 0;
  private buildingLabels: CSS2DObject[] = [];
  private swayers: THREE.Object3D[] = [];
  private groundPlane: THREE.Mesh | null = null;
  private water: THREE.Mesh | null = null;
  private motes: { points: THREE.Points; geometry: THREE.BufferGeometry } | null = null;
  private mapSize = { width: 32, height: 24 };

  private player: BuiltCharacter | null = null;
  private playerPos = new THREE.Vector3();
  private playerFacing = 0;
  private path: Point[] = [];
  private grid: Grid | null = null;

  private readonly sun: THREE.DirectionalLight;
  private readonly hemi: THREE.HemisphereLight;
  private readonly rim: THREE.DirectionalLight;
  private pmrem: THREE.PMREMGenerator | null = null;
  private envTexture: THREE.Texture | null = null;

  private currentMapId: MapId = 'shanghai';
  private viewTiles = DEFAULT_VIEW_TILES;
  private quality: Quality;
  private animationId = 0;
  private disposed = false;

  constructor(options: WorldRendererOptions) {
    this.options = options;
    this.container = options.container;
    this.quality = options.quality ?? 'high';
    setMaterialQuality(this.quality);

    this.renderer = new THREE.WebGLRenderer({
      antialias: this.quality === 'high',
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.quality === 'high' ? 2 : 1));
    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // 필름 톤 매핑 — 밝은 곳이 하얗게 날아가지 않고 색이 부드럽게 말린다.
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.touchAction = 'none';
    this.container.appendChild(this.renderer.domElement);

    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.inset = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    this.container.appendChild(this.labelRenderer.domElement);

    // 비네팅 — 화면 가장자리를 살짝 눌러 가운데로 시선을 모은다 (GPU 비용 0)
    this.vignette = document.createElement('div');
    this.vignette.className = 'world-vignette';
    this.container.appendChild(this.vignette);

    this.camera.near = -220;
    this.camera.far = 420;

    // 건물이 플레이어를 가릴 때 갈아 끼우는 반투명 재질.
    // 거상에서도 캐릭터가 건물 뒤로 들어가면 건물이 비쳐 보인다 —
    // 이게 없으면 쿼터뷰에서 내 캐릭터를 놓치기 십상이다.
    this.ghostMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#8fa2b2'),
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    });

    this.hemi = new THREE.HemisphereLight(0xdfe6ea, 0x6b6250, 1);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff2de, 2.2);
    this.sun.castShadow = this.quality === 'high';
    const shadowSize = this.quality === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(shadowSize, shadowSize);
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 140;
    this.sun.shadow.bias = -0.0009;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // 역광 — 인물과 건물의 윤곽을 살려 배경에 묻히지 않게 한다.
    this.rim = new THREE.DirectionalLight(0xbcd2e0, 0.45);
    this.rim.position.set(-20, 14, -18);
    this.scene.add(this.rim);

    if (this.quality === 'high') {
      this.pmrem = new THREE.PMREMGenerator(this.renderer);
      const room = new RoomEnvironment();
      this.envTexture = this.pmrem.fromScene(room, 0.04).texture;
      this.scene.environment = this.envTexture;
      this.scene.environmentIntensity = 0.34;
      room.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }

    this.scene.add(this.worldGroup);

    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('resize', this.handleResize);

    this.handleResize();
    this.animationId = requestAnimationFrame(this.animate);
  }

  /* ─────────────────────── 맵 적재 ─────────────────────── */

  loadMap(map: WorldMap, figureTable: Record<string, Figure>, playerFigure: Figure): void {
    this.clearWorld();
    this.currentMapId = map.id;
    this.grid = buildWorldGrid(map);
    this.mapSize = { width: this.grid.width, height: this.grid.height };

    const mood = MOODS[map.id as MapId] ?? MOODS.shanghai;
    this.applyMood(mood);

    this.buildTerrainMeshes(mood);
    this.buildBuildings(map);
    this.buildProps(map);
    this.buildNpcs(map, figureTable);
    this.buildPlayer(map, playerFigure);
    this.buildMotes(mood);

    const span = Math.max(this.grid.width, this.grid.height);
    const cam = this.sun.shadow.camera;
    cam.left = -span * 0.66;
    cam.right = span * 0.66;
    cam.top = span * 0.66;
    cam.bottom = -span * 0.66;
    cam.updateProjectionMatrix();

    this.updateCamera(true);
  }

  private applyMood(mood: Mood): void {
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
    this.vignette.style.setProperty('--vignette', String(mood.vignette));
  }

  private buildTerrainMeshes(mood: Mood): void {
    if (!this.grid) return;

    // 맵 바깥 여백과 먼 산 — 안개 색에 가깝게 칠해 자연스럽게 사라지게 한다.
    const surroundings = buildSurroundings(this.grid, {
      apron: mood.apron,
      hill: mood.hill,
    });
    this.worldGroup.add(surroundings.group);
    this.disposables.push(...surroundings.geometries, ...surroundings.materials);

    const terrain = buildTerrain(this.grid);
    this.worldGroup.add(terrain.group);
    this.disposables.push(...terrain.geometries);
    this.water = terrain.water;

    // 풀 술 — 풀밭에만 흩뿌린다
    if (this.quality === 'high') {
      const tuftTexture = grassTuftTexture();
      const tuftMaterial = new THREE.MeshStandardMaterial({
        map: tuftTexture,
        transparent: true,
        alphaTest: 0.42,
        side: THREE.DoubleSide,
        roughness: 1,
      });
      const tufts = scatterGrassTufts(this.grid, tuftMaterial);
      if (tufts) {
        this.worldGroup.add(tufts.mesh);
        this.disposables.push(tufts.geometry, tuftMaterial, tufts.mesh);
      } else {
        tuftMaterial.dispose();
      }

      // 흙길·돌바닥의 잔돌
      const pebbleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#8f8878'),
        roughness: 1,
        flatShading: true,
      });
      const pebbles = scatterPebbles(this.grid, pebbleMaterial);
      if (pebbles) {
        this.worldGroup.add(pebbles.mesh);
        this.disposables.push(pebbles.geometry, pebbleMaterial, pebbles.mesh);
      } else {
        pebbleMaterial.dispose();
      }
    }

    // 클릭 판정용 투명 평면
    const planeGeo = new THREE.PlaneGeometry(this.grid.width, this.grid.height);
    const planeMat = new THREE.MeshBasicMaterial({ visible: false });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.set(this.grid.width / 2, 0.02, this.grid.height / 2);
    this.worldGroup.add(plane);
    this.groundPlane = plane;
    this.disposables.push(planeGeo, planeMat);
  }

  private buildBuildings(map: WorldMap): void {
    for (const spec of map.buildings) {
      const built = createBuilding(spec);
      built.group.userData.buildingId = spec.id;
      this.worldGroup.add(built.group);
      this.buildingGroups.push(built.group);
      this.registerOccluder(built.group);
      this.disposables.push(...built.geometries, ...built.textures);

      if (spec.sign) {
        const element = document.createElement('div');
        element.className = 'building-label';
        element.textContent = spec.sign;
        const label = new CSS2DObject(element);
        label.position.set(0, built.labelHeight, 0);
        built.group.add(label);
        this.buildingLabels.push(label);
      }
    }
  }

  private buildProps(map: WorldMap): void {
    for (const spec of map.props) {
      const built = createProp(spec);
      this.worldGroup.add(built.group);
      // 키 큰 나무도 캐릭터를 가리므로 같이 비치게 한다.
      if (spec.kind === 'tree' || spec.kind === 'pine' || spec.kind === 'willow' || spec.kind === 'cherry') {
        this.registerOccluder(built.group);
      }
      if (built.sway) this.swayers.push(built.sway);
      this.disposables.push(...built.geometries, ...built.textures);
    }
  }

  private buildNpcs(map: WorldMap, figureTable: Record<string, Figure>): void {
    for (const placement of map.npcs) {
      const figure = figureTable[placement.figureId];
      if (!figure) continue;
      const character = createCharacter(figure);
      character.group.position.set(placement.x + 0.5, 0, placement.z + 0.5);
      character.group.rotation.y = placement.facing ?? Math.PI;
      character.group.userData.figureId = placement.figureId;
      this.worldGroup.add(character.group);

      const label = this.makeLabel(figure.name, placement.bubble);
      label.position.set(0, 1.98, 0);
      character.group.add(label);

      const marker = createQuestMarker();
      marker.group.position.set(0, 2.42, 0);
      marker.group.visible = false;
      character.group.add(marker.group);
      this.disposables.push(...marker.geometries, ...character.geometries);

      this.npcs.push({
        figureId: placement.figureId,
        character,
        cell: { x: placement.x, z: placement.z },
        label,
        bubble: label.element.querySelector('.npc-bubble'),
        marker: marker.group,
      });
    }
  }

  private registerOccluder(group: THREE.Object3D): void {
    const meshes: Occluder['meshes'] = [];
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push({ mesh: child, original: child.material });
    });
    this.occluders.push({ group, meshes, ghosted: false });
  }

  private setGhost(entry: Occluder, ghosted: boolean): void {
    if (entry.ghosted === ghosted) return;
    entry.ghosted = ghosted;
    for (const item of entry.meshes) {
      item.mesh.material = ghosted ? this.ghostMaterial : item.original;
      item.mesh.castShadow = !ghosted;
    }
  }

  /**
   * 카메라와 플레이어 사이에 낀 건물을 찾아 반투명으로 바꾼다.
   * 매 프레임 광선을 쏘면 낭비이므로 몇 프레임에 한 번만 검사한다.
   */
  private updateOcclusion(): void {
    if (this.occluders.length === 0) return;
    this.occlusionTick += 1;
    if (this.occlusionTick % 4 !== 0) return;

    const target = new THREE.Vector3(this.playerPos.x, 0.9, this.playerPos.z);
    const dir = target.clone().sub(this.camera.position).normalize();
    const origin = target.clone().addScaledVector(dir, -80);
    this.raycaster.set(origin, dir);
    const distanceToPlayer = origin.distanceTo(target);

    const blocking = new Set<THREE.Object3D>();
    const hits = this.raycaster.intersectObjects(this.buildingGroups.concat(
      this.occluders.filter((o) => !this.buildingGroups.includes(o.group)).map((o) => o.group),
    ), true);
    for (const hit of hits) {
      if (hit.distance >= distanceToPlayer - 0.4) break;
      let node: THREE.Object3D | null = hit.object;
      while (node && node.parent && node.parent !== this.worldGroup) node = node.parent;
      if (node) blocking.add(node);
    }

    for (const entry of this.occluders) this.setGhost(entry, blocking.has(entry.group));
    // 무언가에 가려졌을 때만 플레이어 실루엣을 켠다
    if (this.player?.xray) this.player.xray.visible = blocking.size > 0;
  }

  private buildPlayer(map: WorldMap, playerFigure: Figure): void {
    const character = createCharacter(playerFigure, true);
    character.group.position.set(map.spawn.x + 0.5, 0, map.spawn.z + 0.5);
    this.worldGroup.add(character.group);
    this.player = character;
    this.playerPos.copy(character.group.position);
    this.path = [];
    this.disposables.push(...character.geometries);
  }

  private buildMotes(mood: Mood): void {
    if (this.quality === 'low') return;
    const motes = createMotes(mood, this.mapSize);
    if (!motes) return;
    this.worldGroup.add(motes.points);
    this.motes = { points: motes.points, geometry: motes.geometry };
    this.disposables.push(motes.geometry, motes.material);
  }

  private makeLabel(name: string, bubble?: string): CSS2DObject {
    const wrap = document.createElement('div');
    wrap.className = 'npc-label';
    if (bubble) {
      const b = document.createElement('div');
      b.className = 'npc-bubble';
      b.textContent = bubble;
      wrap.appendChild(b);
    }
    const tag = document.createElement('div');
    tag.className = 'npc-name';
    tag.textContent = name;
    wrap.appendChild(tag);
    return new CSS2DObject(wrap);
  }

  /* ─────────────────────── 조작 ─────────────────────── */

  setPath(path: Point[]): void {
    this.path = [...path];
  }

  get playerCell(): Point {
    return { x: Math.floor(this.playerPos.x), z: Math.floor(this.playerPos.z) };
  }

  /** 임무를 받을 수 있는 인물 머리 위에 느낌표를 띄운다. */
  setQuestMarkers(figureIds: string[]): void {
    const set = new Set(figureIds);
    for (const npc of this.npcs) {
      if (npc.marker) npc.marker.visible = set.has(npc.figureId);
      npc.label.element.classList.toggle('has-quest', set.has(npc.figureId));
    }
  }

  lookAtNpc(figureId: string): void {
    const npc = this.npcs.find((n) => n.figureId === figureId);
    if (!npc || !this.player) return;
    const dx = this.playerPos.x - npc.character.group.position.x;
    const dz = this.playerPos.z - npc.character.group.position.z;
    npc.character.group.rotation.y = Math.atan2(dx, dz);
    this.playerFacing = Math.atan2(-dx, -dz);
  }

  zoomBy(delta: number): void {
    this.viewTiles = clampViewTiles(this.viewTiles + delta);
    this.handleResize();
  }

  private handleWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.zoomBy(event.deltaY > 0 ? 1.4 : -1.4);
  };

  private handlePointerDown = (event: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const npcTargets = this.npcs.map((n) => n.character.group);
    const npcHit = this.raycaster.intersectObjects(npcTargets, true)[0];
    if (npcHit) {
      let node: THREE.Object3D | null = npcHit.object;
      while (node && !node.userData.figureId) node = node.parent;
      if (node?.userData.figureId) {
        this.options.onNpcClick(node.userData.figureId as string);
        return;
      }
    }

    const buildingHit = this.raycaster.intersectObjects(this.buildingGroups, true)[0];
    if (buildingHit) {
      const point = buildingHit.point;
      this.options.onGroundClick({ x: Math.floor(point.x), z: Math.floor(point.z) });
      return;
    }

    if (this.groundPlane) {
      const hit = this.raycaster.intersectObject(this.groundPlane)[0];
      if (hit) {
        this.options.onGroundClick({ x: Math.floor(hit.point.x), z: Math.floor(hit.point.z) });
      }
    }
  };

  private handleResize = () => {
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;
    const aspect = width / height;
    const half = this.viewTiles / 2;
    this.camera.left = -half * aspect;
    this.camera.right = half * aspect;
    this.camera.top = half;
    this.camera.bottom = -half;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.labelRenderer.setSize(width, height);
  };

  /* ─────────────────────── 루프 ─────────────────────── */

  private updateCamera(snap = false): void {
    const target = this.playerPos;
    const pos = cameraPosition({ x: target.x, y: 0, z: target.z }, CAMERA_DISTANCE);
    if (snap) {
      this.camera.position.set(pos.x, pos.y, pos.z);
    } else {
      this.camera.position.lerp(new THREE.Vector3(pos.x, pos.y, pos.z), 0.11);
    }
    this.camera.lookAt(target.x, 0.7, target.z);
    // 그림자 카메라가 늘 플레이어를 따라다녀야 맵이 커도 그림자가 선명하다.
    this.sun.target.position.set(target.x, 0, target.z);
    this.sun.target.updateMatrixWorld();
  }

  /** 맵의 무드에 맞는 태양 위치를 플레이어 주변으로 옮긴다 */
  private placeSun(mapId: MapId): void {
    const mood = MOODS[mapId] ?? MOODS.shanghai;
    const offset = sunPosition(mood, 46);
    this.sun.position.set(
      this.playerPos.x + offset.x,
      offset.y,
      this.playerPos.z + offset.z,
    );
  }

  private animate = () => {
    if (this.disposed) return;
    this.animationId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.08);
    const time = this.clock.elapsedTime;

    let moving = 0;
    if (this.player) {
      moving = this.stepAlongPath(delta);
      this.player.group.position.copy(this.playerPos);
      this.player.group.rotation.y = this.playerFacing;
      animateCharacter(this.player, time, moving);
    }

    for (const npc of this.npcs) {
      animateCharacter(npc.character, time + npc.cell.x * 0.7, 0);
      const distance = Math.hypot(
        npc.cell.x + 0.5 - this.playerPos.x,
        npc.cell.z + 0.5 - this.playerPos.z,
      );
      if (npc.bubble) npc.bubble.style.display = distance < BUBBLE_RADIUS ? '' : 'none';
      // 이름표도 멀면 지운다. 다만 임무를 주는 인물은 길잡이 역할을 하므로 늘 보인다.
      const showName = distance < NAME_RADIUS || npc.marker?.visible === true;
      npc.label.element.style.opacity = showName ? '1' : '0';
      if (npc.marker?.visible) {
        // 느낌표가 위아래로 통통 튄다 — 멀리서도 눈에 띈다.
        npc.marker.position.y = 2.42 + Math.sin(time * 3.2 + npc.cell.x) * 0.13;
        npc.marker.rotation.y = Math.sin(time * 1.4) * 0.5;
      }
    }

    for (const sway of this.swayers) sway.rotation.y = Math.sin(time * 1.25) * 0.2;

    // 수면 — 아주 천천히 흐르게 텍스처를 민다
    if (this.water) {
      const material = this.water.material as THREE.MeshStandardMaterial;
      if (material.map) {
        material.map.offset.x = time * 0.012;
        material.map.offset.y = Math.sin(time * 0.24) * 0.01;
      }
    }

    if (this.motes) updateMotes(this.motes.geometry, delta, this.mapSize, time);

    this.placeSun(this.currentMapId);
    this.updateCamera();
    this.updateOcclusion();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  };

  private stepAlongPath(delta: number): number {
    if (this.path.length === 0) return 0;
    const next = this.path[0];
    const targetX = next.x + 0.5;
    const targetZ = next.z + 0.5;
    const dx = targetX - this.playerPos.x;
    const dz = targetZ - this.playerPos.z;
    const dist = Math.hypot(dx, dz);
    const step = WALK_SPEED * delta;

    this.playerFacing = lerpAngle(
      this.playerFacing,
      facingAngle(
        { x: this.playerPos.x, y: 0, z: this.playerPos.z },
        { x: targetX, y: 0, z: targetZ },
      ),
      0.3,
    );

    if (dist <= step) {
      this.playerPos.set(targetX, 0, targetZ);
      this.path.shift();
      if (this.path.length === 0) this.options.onArrive?.({ x: next.x, z: next.z });
      return 1;
    }
    this.playerPos.x += (dx / dist) * step;
    this.playerPos.z += (dz / dist) * step;
    return 1;
  }

  /* ─────────────────────── 정리 ─────────────────────── */

  private clearWorld(): void {
    for (const npc of this.npcs) {
      npc.label.removeFromParent();
      npc.label.element.remove();
    }
    for (const label of this.buildingLabels) {
      label.removeFromParent();
      label.element.remove();
    }
    this.npcs = [];
    this.buildingLabels = [];
    this.buildingGroups = [];
    this.occluders = [];
    this.swayers = [];
    this.player = null;
    this.groundPlane = null;
    this.water = null;
    this.motes = null;

    this.worldGroup.removeFromParent();
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    for (const item of this.disposables) item.dispose();
    this.disposables = [];
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.animationId);
    this.renderer.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('resize', this.handleResize);
    this.clearWorld();
    this.ghostMaterial.dispose();
    disposeMaterials();
    disposeTextures();
    this.envTexture?.dispose();
    this.pmrem?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.labelRenderer.domElement.remove();
    this.vignette.remove();
  }
}
