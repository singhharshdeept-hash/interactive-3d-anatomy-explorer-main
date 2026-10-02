import type { Object3D } from 'three';
import { Box3, Vector3 } from 'three';
import { partById, type SystemMode } from './data';

/** Visibility alone does not exclude Three.js objects from raycasting. */
export function selectablePart(object: Object3D, mode: SystemMode): string | null {
  for (let ancestor: Object3D | null = object; ancestor; ancestor = ancestor.parent) {
    if (!ancestor.visible) return null;
  }
  const id = object.userData.partId as string | undefined;
  const part = id ? partById[id] : undefined;
  if (!part || (mode === 'skeleton' && part.category !== 'Bone') ||
    (mode === 'muscles' && part.category !== 'Muscle')) return null;
  return id!;
}

/** The source atlas combines the ilium and pubis as one mesh; use their real surface regions. */
export function partAtSurface(object: Object3D, point: Vector3, mode: SystemMode): string | null {
  const id = selectablePart(object, mode);
  if (id !== 'ilium') return id;
  const name = `${object.name} ${object.userData.name || ''}`.toLowerCase();
  if (!name.includes('hip bone')) return id;
  const bounds = new Box3().setFromObject(object);
  const center = bounds.getCenter(new Vector3());
  const medial = Math.abs(point.x) < Math.abs(center.x) * .72;
  const anterior = point.z > bounds.max.z - bounds.getSize(new Vector3()).z * .42;
  return medial && anterior ? 'pubis' : id;
}
