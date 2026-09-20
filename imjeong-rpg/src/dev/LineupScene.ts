import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { figures } from '../data/figures';
import { createCharacter } from '../three/character';
import { groundMaterials } from '../three/materials';
import { CAMERA_DISTANCE, cameraPosition } from '../engine/isometric';

/**
 * 인물 전시장 — 개발·검수용 화면.
 *
 * 게임 안에서는 인물이 작게 보여서 옷의 고증이 맞는지 확인하기 어렵다.
 * 이 화면은 모든 인물을 줄 세워 크게 보여 준다.
 * 두루마기의 동정과 고름, 여성 한복의 치마 선, 광복군의 각반과 견장,
 * 갓·중절모·군모, 안경과 수염이 제대로 붙었는지 여기서 확인한다.
 *
 * 주소 끝에 `?lineup` 을 붙이면 열린다. (수업에서 쓰는 화면이 아니다)
 */
export function mountLineup(container: HTMLElement): () => void {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#c3cdd4');

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  container.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.domElement.style.position = 'absolute';
  labels.domElement.style.inset = '0';
  labels.domElement.style.pointerEvents = 'none';
  container.appendChild(labels.domElement);

  const camera = new THREE.OrthographicCamera();
  camera.near = -200;
  camera.far = 400;

  scene.add(new THREE.HemisphereLight(0xdfe6ea, 0x807663, 1.1));
  const sun = new THREE.DirectionalLight(0xfff2de, 2.3);
  sun.position.set(14, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.far = 80;
  sun.shadow.bias = -0.0009;
  scene.add(sun, sun.target);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 0.34;

  const disposables: Array<{ dispose(): void }> = [env, pmrem];

  // 바닥
  const groundGeo = new THREE.PlaneGeometry(60, 60);
  const uv = groundGeo.getAttribute('uv');
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * 20, uv.getY(i) * 20);
  const ground = new THREE.Mesh(groundGeo, groundMaterials.dirt());
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  disposables.push(groundGeo);

  // 인물을 줄 세운다
  const list = Object.values(figures);
  const perRow = 5;
  const gapX = 1.55;
  const gapZ = 3.0;
  const characters: Array<ReturnType<typeof createCharacter>> = [];

  list.forEach((figure, i) => {
    const built = createCharacter(figure, figure.id === 'player');
    const col = i % perRow;
    const row = Math.floor(i / perRow);
    built.group.position.set((col - (perRow - 1) / 2) * gapX, 0, row * gapZ);
    // 카메라 쪽(남동)을 바라보게
    built.group.rotation.y = Math.PI * 0.25;
    scene.add(built.group);
    characters.push(built);
    disposables.push(...built.geometries);

    const el = document.createElement('div');
    el.className = 'npc-label';
    const name = document.createElement('div');
    name.className = 'npc-name';
    name.textContent = `${figure.name}${figure.hanja ? `(${figure.hanja})` : ''}`;
    // 근거 문장은 화면을 덮으므로 이름만 띄운다 (근거는 figures.ts 에 있다)
    el.appendChild(name);
    const label = new CSS2DObject(el);
    label.position.set(0, 2.0, 0);
    built.group.add(label);
  });

  const rows = Math.ceil(list.length / perRow);
  const center = new THREE.Vector3(0, 0, ((rows - 1) * gapZ) / 2);
  let viewTiles = 6.5;
  let focusRow = 0;

  const resize = () => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    const aspect = w / h;
    const half = viewTiles / 2;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
  };

  const place = () => {
    const target = new THREE.Vector3(0, 0, focusRow * gapZ);
    const pos = cameraPosition({ x: target.x, y: 0, z: target.z }, CAMERA_DISTANCE);
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(target.x, 0.9, target.z);
    sun.position.set(target.x + 14, 22, target.z + 12);
    sun.target.position.copy(target);
    sun.target.updateMatrixWorld();
  };

  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    viewTiles = Math.min(30, Math.max(5, viewTiles + (e.deltaY > 0 ? 1 : -1)));
    resize();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') focusRow = Math.min(rows - 1, focusRow + 1);
    if (e.key === 'ArrowUp') focusRow = Math.max(0, focusRow - 1);
    place();
  };
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('resize', resize);
  resize();
  place();
  void center;

  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    const t = clock.elapsedTime;
    // 천천히 제자리 회전시켜 옆·뒤 모습까지 확인한다
    characters.forEach((c, i) => {
      c.group.rotation.y = Math.PI * 0.25 + Math.sin(t * 0.35 + i * 0.4) * 0.9;
    });
    renderer.render(scene, camera);
    labels.render(scene, camera);
  };
  loop();

  return () => {
    cancelAnimationFrame(raf);
    renderer.domElement.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('resize', resize);
    for (const d of disposables) d.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    labels.domElement.remove();
  };
}
