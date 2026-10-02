import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import * as THREE from 'three';
import { createFallbackSkeleton } from '../anatomy/fallback';
import { createMuscleModel } from '../anatomy/muscles';
import { partAtSurface } from '../anatomy/picking';
import { partFromMeshName, SystemMode } from '../anatomy/data';

const MODEL_URL = 'https://raw.githubusercontent.com/innalhy/anatomy-sculpt-3d/main/public/models/overview-skeleton.glb';
type Asset = { root: THREE.Group; groups: Map<string, THREE.Object3D[]>; originals: Map<THREE.Object3D, THREE.Vector3> };

function addAnatomyPickTargets(asset: Asset): Asset {
  const skull = asset.groups.get('skull');
  if (!skull?.length) return asset;
  const skullBounds = new THREE.Box3();
  skull.forEach(object => skullBounds.expandByObject(object));
  const size = skullBounds.getSize(new THREE.Vector3());
  const center = skullBounds.getCenter(new THREE.Vector3());
  const targetMaterial = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0, colorWrite: false, depthWrite: false, side: THREE.DoubleSide });
  const addTarget = (id: string, geometry: THREE.BufferGeometry, position: THREE.Vector3, visibleGeometry?: THREE.BufferGeometry) => {
    const target = new THREE.Mesh(geometry, targetMaterial);
    target.position.copy(position);
    target.userData.partId = id;
    target.userData.side = null;
    asset.root.add(target);
    asset.groups.set(id, [...(asset.groups.get(id) || []), target]);
    asset.originals.set(target, target.position.clone());
    if (visibleGeometry) {
      const marker = new THREE.Mesh(visibleGeometry, new THREE.MeshStandardMaterial({ color: '#d9c9ac', roughness: .6 }));
      marker.position.copy(position);
      marker.userData.partId = id;
      asset.root.add(marker);
      asset.groups.set(id, [...(asset.groups.get(id) || []), marker]);
      asset.originals.set(marker, marker.position.clone());
    }
  };

  for (const side of [-1, 1]) {
    const x = center.x + side * size.x * .22;
    addTarget('orbital', new THREE.SphereGeometry(size.x * .12, 16, 12), new THREE.Vector3(x, center.y - size.y * .05, skullBounds.max.z + size.z * .11), new THREE.TorusGeometry(size.x * .083, .008, 8, 28));
  }
  addTarget('nasal-cavity', new THREE.CapsuleGeometry(size.x * .055, size.y * .13, 4, 10), new THREE.Vector3(center.x, center.y - size.y * .23, skullBounds.max.z + size.z * .12));

  const sternum = asset.groups.get('sternum-body');
  if (sternum?.length) {
    const bounds = new THREE.Box3();
    sternum.forEach(object => bounds.expandByObject(object));
    const markerPosition = new THREE.Vector3(bounds.getCenter(new THREE.Vector3()).x, bounds.min.y + bounds.getSize(new THREE.Vector3()).y * .025, bounds.max.z + .01);
    addTarget('xiphoid', new THREE.SphereGeometry(.045, 16, 12), markerPosition, new THREE.SphereGeometry(.025, 12, 8));
  }
  return asset;
}

function makeAsset(root: THREE.Group, provided?: Map<string, THREE.Group>): Asset {
  const groups = new Map<string, THREE.Object3D[]>();
  if (provided) {
    provided.forEach((group, id) => groups.set(id, [group]));
  } else {
    root.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const id = partFromMeshName(object.userData.name || object.name);
      if (!id) return;
      object.userData.partId = id;
      const name = object.name.toLowerCase();
      object.userData.side = /(?:\.r\.?$|_r$|\bright$)/.test(name) ? 'right' : /(?:\.l\.?$|_l$|\bleft$)/.test(name) ? 'left' : null;
      const material = object.material as THREE.MeshStandardMaterial;
      object.material = material.clone();
      (object.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      groups.set(id, [...(groups.get(id) || []), object]);
    });
  }
  const originals = new Map<THREE.Object3D, THREE.Vector3>();
  groups.forEach(items => items.forEach(item => originals.set(item, item.position.clone())));
  return { root, groups, originals };
}

function ViewController({ selected, asset, view, rotate, mobile }: {
  selected: string | null; asset: Asset; view: number; rotate: boolean; mobile: boolean;
}) {
  const { camera } = useThree();
  const controls = useRef<any>(null);
  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    let focus = new THREE.Vector3(0, -.02, 0);
    if (selected) {
      const [id, side] = selected.split(':');
      const focusId = id === 'pubis' ? 'ilium' : id;
      const objects = asset.groups.get(focusId)?.filter(object => !side || object.userData.side === side);
      if (objects?.length) {
        const box = new THREE.Box3();
        objects.forEach(object => box.expandByObject(object));
        box.getCenter(focus);
        if (id === 'pubis') { focus.x *= .68; focus.y -= .14; focus.z = box.max.z; }
      }
    }
    const isDetail = Boolean(selected);
    // Aim the selected structure just left of center so the fixed detail card has room on the right.
    const xOffset = isDetail && !mobile ? .82 : 0;
    const distance = isDetail ? (mobile ? 7.5 : 6.5) : (mobile ? 8.75 : 8.35);
    const dest = { x: focus.x + xOffset, y: focus.y + (isDetail ? .04 : 0), z: (view % 2 === 0 ? 1 : -1) * distance };
    const cameraTween = gsap.to(camera.position, { ...dest, duration: 1.2, ease: 'power2.inOut', overwrite: true });
    const targetTween = gsap.to(target, { x: focus.x + xOffset, y: focus.y, z: focus.z, duration: 1.2, ease: 'power2.inOut', overwrite: true, onUpdate: () => { if (controls.current) controls.current.target.copy(target); } });
    return () => { cameraTween.kill(); targetTween.kill(); };
  }, [selected, asset, view, mobile, camera, target]);

  return <OrbitControls ref={controls} enablePan={false} enableDamping dampingFactor={.07} minDistance={3.8} maxDistance={12} minPolarAngle={.2} maxPolarAngle={Math.PI - .2} autoRotate={rotate && !selected} autoRotateSpeed={.48} />;
}

function Model({ selected, hovered, setHovered, onSelect, mode, exploded, view, rotate, mobile, onReady }: {
  selected: string | null; hovered: string | null; setHovered: (id: string | null) => void; onSelect: (id: string) => void;
  mode: SystemMode; exploded: boolean; view: number; rotate: boolean; mobile: boolean; onReady: (ready: boolean) => void;
}) {
  const fallback = useMemo(() => { const built = createFallbackSkeleton(); return makeAsset(built.root, built.groups); }, []);
  const muscles = useMemo(() => { const built = createMuscleModel(); return makeAsset(built.root, built.groups); }, []);
  const [loaded, setLoaded] = useState<Asset | null>(null);
  const asset = loaded || fallback;

  useEffect(() => {
    let mounted = true;
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(MODEL_URL, gltf => {
      if (!mounted) return;
      const model = gltf.scene;
      model.traverse(object => { if (object.userData?.name) object.name = object.userData.name; });
      for (const suffix of ['Bones_right', 'Cartilages_right']) {
        const right = model.getObjectByName(suffix);
        if (right?.parent) {
          const left = right.clone(true);
          left.scale.x *= -1;
          left.name = suffix.replace('_right', '_left');
          left.traverse(object => { if (object instanceof THREE.Mesh) object.name = object.name.replace(/\.r\.?$/, '.l'); });
          right.parent.add(left);
        }
      }
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 4.8 / bounds.getSize(new THREE.Vector3()).y;
      const root = new THREE.Group();
      model.scale.setScalar(scale);
      model.position.copy(center.multiplyScalar(-scale));
      root.add(model);
      root.updateMatrixWorld(true);
      setLoaded(addAnatomyPickTargets(makeAsset(root)));
      onReady(true);
    }, undefined, () => { if (mounted) onReady(false); });
    return () => { mounted = false; draco.dispose(); };
  }, [onReady]);

  useEffect(() => {
    const animate = (item: THREE.Object3D, origin: THREE.Vector3, id: string, muscle = false) => {
      const isSelected = selected === id || selected === `${id}:${item.userData.side}` || (id === 'ilium' && selected === 'pubis');
      let offset = new THREE.Vector3();
      const center = new THREE.Box3().setFromObject(item).getCenter(new THREE.Vector3());
      if (exploded) {
        offset.set(Math.sign(center.x || .1) * (.28 + Math.abs(center.x) * .12), center.y * .12, center.z * .12);
      } else if (isSelected) {
        offset.set(Math.sign(center.x || .1) * .36, .04, .32);
      }
      if (item.parent) {
        const inverse = item.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
        offset.applyQuaternion(inverse);
        const parentScale = item.parent.getWorldScale(new THREE.Vector3());
        offset.divide(parentScale);
      }
      gsap.to(item.position, { x: origin.x + offset.x, y: origin.y + offset.y, z: origin.z + offset.z, duration: .95, ease: 'power3.out', overwrite: true });
      item.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        const material = object.material as THREE.MeshStandardMaterial;
        if (!material || !('opacity' in material)) return;
        const dimmed = selected && !isSelected;
        const opacity = dimmed ? (muscle ? .16 : .2) : muscle ? (mode === 'combined' ? .48 : 1) : mode === 'muscles' ? .18 : mode === 'combined' ? .83 : 1;
        material.transparent = opacity < 1;
        material.depthWrite = opacity >= 1;
        gsap.to(material, { opacity, duration: .72, overwrite: true });
        if (material.emissive) {
          gsap.to(material.emissive, { r: isSelected || hovered === id ? .12 : 0, g: isSelected || hovered === id ? .075 : 0, b: isSelected || hovered === id ? .035 : 0, duration: .4, overwrite: true });
        }
      });
    };
    asset.groups.forEach((objects, id) => objects.forEach(object => animate(object, asset.originals.get(object)!, id)));
    muscles.groups.forEach((objects, id) => objects.forEach(object => animate(object, muscles.originals.get(object)!, id, true)));
  }, [asset, muscles, selected, hovered, exploded, mode]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    const id = partAtSurface(event.object, event.point, mode);
    if (!id || event.delta > 5) return;
    event.stopPropagation();
    onSelect(event.object.userData.side ? `${id}:${event.object.userData.side}` : id);
  };
  const handleMove = (event: ThreeEvent<PointerEvent>) => {
    const id = partAtSurface(event.object, event.point, mode);
    if (id) { event.stopPropagation(); setHovered(id); document.body.style.cursor = 'pointer'; }
  };
  const handlers = { onClick: handleClick, onPointerOver: handleMove, onPointerOut: () => { setHovered(null); document.body.style.cursor = ''; } };
  return <>
    <ViewController selected={selected} asset={muscles.groups.has(selected?.split(':')[0] || '') ? muscles : asset} view={view} rotate={rotate} mobile={mobile} />
    <primitive object={asset.root} {...(mode === 'muscles' ? {} : handlers)} />
    {mode !== 'skeleton' && <primitive object={muscles.root} {...handlers} />}
  </>;
}

export function AnatomyScene(props: {
  selected: string | null; hovered: string | null; setHovered: (id: string | null) => void; onSelect: (id: string) => void;
  mode: SystemMode; exploded: boolean; view: number; rotate: boolean; mobile: boolean; onReady: (ready: boolean) => void;
}) {
  return <Canvas camera={{ position: [0, 0, 8.5], fov: 38, near: .1, far: 100 }} dpr={[1, 1.8]} gl={{ antialias: true, powerPreference: 'high-performance' }} onPointerMissed={() => props.setHovered(null)}>
    <color attach="background" args={['#101818']} />
    <fog attach="fog" args={['#101818', 11, 24]} />
    <ambientLight intensity={.56} color="#bec8bd" />
    <hemisphereLight args={['#e9e4ce', '#354844', 1.35]} />
    <directionalLight position={[3, 5, 6]} intensity={2.3} color="#f5e6ca" />
    <directionalLight position={[-4, 2, -4]} intensity={2.6} color="#c0d7c9" />
    <directionalLight position={[-5, -2, 3]} intensity={.7} color="#d8a783" />
    <Model {...props} />
  </Canvas>;
}
