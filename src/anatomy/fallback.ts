import * as THREE from 'three';

  const bone = new THREE.MeshPhysicalMaterial({ color: '#d9c9ac', roughness: 0.58, metalness: 0.01, clearcoat: .12, clearcoatRoughness: .5 });
const socket = new THREE.MeshStandardMaterial({ color: '#292c2a', roughness: 1 });

export function createFallbackSkeleton() {
  const root = new THREE.Group();
  const groups = new Map<string, THREE.Group>();
  const group = (id: string) => {
    if (!groups.has(id)) {
      const item = new THREE.Group();
      item.name = id;
      groups.set(id, item);
      root.add(item);
    }
    return groups.get(id)!;
  };
  const add = (id: string, geometry: THREE.BufferGeometry, position: [number, number, number], scale: [number, number, number] = [1, 1, 1], material: THREE.Material = bone) => {
    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.userData.partId = id;
    group(id).add(mesh);
    return mesh;
  };
  const ball = (id: string, p: [number, number, number], s: [number, number, number], material: THREE.Material = bone) =>
    add(id, new THREE.SphereGeometry(1, 16, 12), p, s, material);
  const line = (id: string, points: [number, number, number][], radius: number, material: THREE.Material = bone) =>
    add(id, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), Math.max(12, points.length * 6), radius, 7, false), [0, 0, 0], [1, 1, 1], material);
  const shaft = (id: string, a: [number, number, number], b: [number, number, number], r1: number, r2 = r1) => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const mesh = add(id, new THREE.CylinderGeometry(r2, r1, start.distanceTo(end), 12, 6), [0, 0, 0]);
    mesh.position.copy(start.clone().add(end).multiplyScalar(.5));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    ball(id, a, [r1 * 1.25, r1 * 1.25, r1 * 1.25]);
    ball(id, b, [r2 * 1.35, r2 * 1.25, r2 * 1.35]);
  };

  // The fallback is deliberately made from separately addressable anatomical pieces.
  ball('skull', [0, 2.05, 0], [.285, .36, .25]);
  ball('skull', [0, 1.83, .17], [.205, .16, .145]);
  for (const s of [-1, 1]) {
    ball('orbital', [s * .118, 1.99, .228], [.092, .105, .033], socket);
    line('orbital', [[s * .04, 2.075, .24], [s * .2, 2.055, .235], [s * .22, 1.95, .24], [s * .14, 1.91, .25], [s * .055, 1.95, .25], [s * .04, 2.075, .24]], .012);
    line('skull', [[s * .21, 1.89, .13], [s * .13, 1.86, .25], [s * .055, 1.88, .26]], .029);
  }
  line('nasal-cavity', [[-.035, 2.005, .258], [-.03, 1.92, .292], [0, 1.86, .3], [.03, 1.92, .292], [.035, 2.005, .258]], .017);
  line('skull', [[-.17, 1.85, .15], [-.16, 1.69, .23], [0, 1.66, .24], [.16, 1.69, .23], [.17, 1.85, .15]], .036);
  for (let i = -4; i <= 4; i++) ball('skull', [i * .037, 1.71, .272], [.016, .024, .018]);

  for (let i = 0; i < 24; i++) {
    const y = 1.54 - i * .079;
    const r = i < 7 ? .057 : i < 19 ? .078 : .095;
    const part = i < 7 ? 'cervical' : i >= 19 ? 'lumbar' : 'thoracic-context';
    ball(part, [0, y, -.105 - Math.sin(i * .23) * .025], [r, .042, r * .78]);
    line(part, [[-.055, y, -.14], [0, y + .026, -.22], [.055, y, -.14]], .018);
  }
  ball('sacrum', [0, -.44, -.07], [.115, .15, .09]);
  ball('coccyx', [0, -.59, -.01], [.047, .08, .045]);
  shaft('sternum-body', [0, 1.22, .19], [0, .67, .21], .045, .037);
  ball('manubrium', [0, 1.36, .19], [.085, .065, .055]);
  ball('xiphoid', [0, .54, .21], [.04, .07, .035]);

  for (let i = 0; i < 12; i++) {
    const y = 1.34 - i * .079;
    const span = .2 + Math.sin((i + 1) / 13 * Math.PI) * .25;
    for (const s of [-1, 1]) {
      line('ribs', [[s * .07, y, -.12], [s * span * .73, y + .025, -.12], [s * span, y - .025, -.005], [s * span * .8, y - .082, .15], [s * .07, y - .095, .2]], i < 2 ? .024 : .021);
    }
  }
  for (const s of [-1, 1]) {
    line('clavicle', [[s * .055, 1.39, .2], [s * .22, 1.43, .22], [s * .42, 1.36, .05]], .038);
    line('scapula', [[s * .32, 1.35, -.19], [s * .46, 1.16, -.21], [s * .26, .76, -.15], [s * .32, 1.35, -.19]], .038);
    ball('scapula', [s * .39, 1.3, -.16], [.09, .08, .045]);
    line('ilium', [[s * .07, -.42, -.08], [s * .25, -.42, -.09], [s * .42, -.48, .005], [s * .39, -.7, .13], [s * .23, -.83, .16], [s * .08, -.78, .11]], .065);
    ball('ilium', [s * .3, -.52, -.04], [.17, .15, .085]);
    shaft('humerus', [s * .48, 1.29, -.015], [s * .59, .42, .005], .068, .052);
    ball('humerus', [s * .49, 1.28, .01], [.103, .095, .098]);
    shaft('radius', [s * .61, .35, .04], [s * .67, -.35, .105], .044, .038);
    shaft('ulna', [s * .55, .35, -.04], [s * .59, -.36, -.015], .047, .031);
    ball('carpus', [s * .635, -.44, .07], [.09, .095, .05]);
    for (let f = 0; f < 5; f++) {
      const x = s * (.55 + f * .045);
      shaft('metacarpus', [x, -.49, .085], [x + s * .008, -.67 - (f === 0 ? -.07 : 0), .095], .017, .013);
      shaft('finger-phalanges', [x + s * .008, -.68 - (f === 0 ? -.07 : 0), .095], [x + s * .013, -.78 - (f === 0 ? -.07 : 0), .095], .012, .009);
    }
    shaft('femur', [s * .29, -.69, .055], [s * .33, -1.48, .055], .092, .065);
    ball('femur', [s * .28, -.73, .07], [.1, .095, .095]);
    ball('patella', [s * .33, -1.52, .155], [.075, .088, .045]);
    shaft('tibia', [s * .32, -1.56, .035], [s * .32, -2.27, .055], .065, .044);
    shaft('fibula', [s * .425, -1.59, -.035], [s * .42, -2.26, -.015], .029, .023);
    ball('tarsus', [s * .34, -2.33, .065], [.105, .075, .115]);
    for (let f = 0; f < 5; f++) {
      const x = s * (.25 + f * .045);
      shaft('metatarsus', [s * .34, -2.34, .12], [x, -2.37, .31], .022, .014);
      shaft('toe-phalanges', [x, -2.37, .31], [x, -2.37, .41], .012, .009);
    }
  }
  line('pubis', [[-.22, -.52, .045], [-.16, -.69, .14], [-.08, -.77, .17], [0, -.79, .18], [.08, -.77, .17], [.16, -.69, .14], [.22, -.52, .045]], .037);
  return { root, groups };
}


