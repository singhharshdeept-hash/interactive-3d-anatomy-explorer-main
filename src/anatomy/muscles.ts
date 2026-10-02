import * as THREE from 'three';

type Point = [number, number, number];

/** Deterministic fiber maps: shared by every bundle, no external texture request. */
function fiberMaps() {
  const size = 256;
  const color = new Uint8Array(size * size * 4);
  const bump = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const wave = v * Math.PI * 96 + Math.sin(u * Math.PI * 4) * .65;
      const fiber = Math.pow(.5 + .5 * Math.cos(wave), 8);
      const fine = Math.sin(wave * 3 + Math.sin(v * 37)) * .04;
      const grain = Math.sin(x * 127.1 + y * 311.7) * Math.sin(y * 91.3 + x * 17.8) * .04;
      const value = fiber * .23 + fine + grain;
      const i = (y * size + x) * 4;
      color.set([131 + value * 115, 62 + value * 78, 53 + value * 68, 255], i);
      const height = Math.round(90 + fiber * 105 + grain * 100);
      bump.set([height, height, height, 255], i);
    }
  }
  const map = new THREE.DataTexture(color, size, size);
  map.colorSpace = THREE.SRGBColorSpace;
  const bumpMap = new THREE.DataTexture(bump, size, size);
  for (const texture of [map, bumpMap]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  }
  return { map, bumpMap };
}

/** Illustrative muscle bundles and surface vessels, aligned to the study skeleton. */
export function createMuscleModel() {
  const root = new THREE.Group();
  const groups = new Map<string, THREE.Group>();
  const maps = fiberMaps();
  const tissue = new THREE.MeshPhysicalMaterial({
    ...maps, color: '#ffffff', vertexColors: true, roughness: .49,
    bumpScale: .012, metalness: 0, clearcoat: .16, clearcoatRoughness: .48,
  });
  const vein = new THREE.MeshPhysicalMaterial({ color: '#435d68', roughness: .52, clearcoat: .22, transparent: true, opacity: .78, depthWrite: false });
  const artery = new THREE.MeshPhysicalMaterial({ color: '#8d4741', roughness: .5, clearcoat: .2, transparent: true, opacity: .72, depthWrite: false });
  const fascia = new THREE.Color('#e4c5a1');
  const belly = new THREE.Color('#ffffff');

  const groupFor = (id: string) => {
    let group = groups.get(id);
    if (!group) { group = new THREE.Group(); group.name = id; groups.set(id, group); root.add(group); }
    return group;
  };

  const bundle = (id: string, start: Point, end: Point, width: number, depth: number, bend = 0, vessels = false) => {
    const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end);
    const axis = b.clone().sub(a).normalize();
    const lateral = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(0, 0, 1)).normalize();
    const forward = new THREE.Vector3().crossVectors(lateral, axis).normalize();
    const surface = (t: number, angle: number, lift = 0) => {
      // Narrow tendinous insertions and a full, slightly asymmetric muscle belly.
      const profile = .045 + .955 * Math.pow(Math.sin(Math.PI * t), .7) * (1 + .15 * Math.cos(Math.PI * t));
      return a.clone().lerp(b, t)
        .addScaledVector(lateral, bend * Math.sin(Math.PI * t) + (width * profile + lift) * Math.cos(angle))
        .addScaledVector(forward, (depth * profile + lift) * Math.sin(angle));
    };
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [], colors: number[] = [], indices: number[] = [];
    const rings = 40, sides = 32;
    for (let ring = 0; ring <= rings; ring++) {
      const t = ring / rings;
      const tendon = Math.pow(Math.abs(t * 2 - 1), 9);
      const color = belly.clone().lerp(fascia, tendon);
      for (let side = 0; side <= sides; side++) {
        const angle = side / sides * Math.PI * 2;
        const p = surface(t, angle);
        positions.push(p.x, p.y, p.z);
        normals.push(0, 0, 0);
        uvs.push(side / sides, t);
        colors.push(color.r, color.g, color.b);
        if (ring < rings && side < sides) {
          const i = ring * (sides + 1) + side;
          indices.push(i, i + sides + 1, i + 1, i + 1, i + sides + 1, i + sides + 2);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const muscleMaterial = tissue.clone();
    // Blend the fiber tint into ivory collagen at each attachment.
    muscleMaterial.onBeforeCompile = shader => {
      shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
        #include <map_fragment>
        float tendon = pow(abs(vMapUv.y * 2.0 - 1.0), 9.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.66, 0.52, 0.37), tendon * 0.88);
      `);
    };
    muscleMaterial.customProgramCacheKey = () => 'muscle-fiber-tendon-v1';
    const mesh = new THREE.Mesh(geometry, muscleMaterial);
    mesh.userData.partId = id;
    const group = groupFor(id);
    group.add(mesh);

    if (vessels) {
      const vessel = (from: number, to: number, angleStart: number, angleEnd: number, radius: number, material: THREE.MeshPhysicalMaterial) => {
        const phase = from * 17.3 + to * 8.1 + angleStart * 3.7;
        const points = Array.from({ length: 25 }, (_, i) => {
          const t = i / 24;
          const undulation = Math.sin(t * Math.PI * 2 + phase) * .025 + Math.sin(t * Math.PI * 5 + phase * .7) * .009;
          return surface(THREE.MathUtils.lerp(from, to, t), THREE.MathUtils.lerp(angleStart, angleEnd, t) + undulation, radius * .55);
        });
        const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', .45);
        const longitudinal = 36, radial = 7;
        const frames = curve.computeFrenetFrames(longitudinal, false);
        const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
        for (let ring = 0; ring <= longitudinal; ring++) {
          const t = ring / longitudinal;
          const center = curve.getPointAt(t);
          const endTaper = THREE.MathUtils.smoothstep(Math.min(t, 1 - t), 0, .1);
          const thickness = radius * (.12 + .88 * endTaper) * (1 + .035 * Math.sin(t * Math.PI * 5 + phase));
          for (let side = 0; side <= radial; side++) {
            const angle = side / radial * Math.PI * 2;
            const normal = frames.normals[ring].clone().multiplyScalar(Math.cos(angle));
            normal.addScaledVector(frames.binormals[ring], Math.sin(angle));
            const point = center.clone().addScaledVector(normal, thickness);
            vertices.push(point.x, point.y, point.z);
            uvs.push(side / radial, t);
            if (ring < longitudinal && side < radial) {
              const index = ring * (radial + 1) + side;
              indices.push(index, index + radial + 1, index + 1, index + 1, index + radial + 1, index + radial + 2);
            }
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        const tube = new THREE.Mesh(geometry, material.clone());
        tube.userData.partId = id;
        group.add(tube);
      };
      const angle = Math.PI * .48;
      vessel(.14, .87, angle - .16, angle + .24, .006, vein);
      for (let branch = 0; branch < 3; branch++) {
        const t = .3 + branch * .17;
        const baseAngle = THREE.MathUtils.lerp(angle - .16, angle + .24, (t - .14) / .73);
        const direction = branch % 2 ? -.68 : .62;
        vessel(t, t + .17, baseAngle, baseAngle + direction, .0028, vein);
        if (branch === 1) vessel(t + .06, t + .18, baseAngle + direction * .46, baseAngle + direction * .46 - .38, .0018, vein);
      }
      vessel(.2, .78, angle + .65, angle + .43, .0035, artery);
    }
  };

  for (const s of [-1, 1]) {
    const p = (x: number, y: number, z: number): Point => [s * x, y, z];
    // The shoulder is formed by overlapping anterior, middle and posterior heads.
    bundle('shoulders', p(.39, 1.4, .03), p(.56, .98, .04), .155, .14, s * .035, true);
    bundle('shoulders', p(.42, 1.35, -.08), p(.56, .94, -.045), .105, .105);
    // Fan-shaped fascicles converge at the upper arm rather than a round chest blob.
    for (let i = 0; i < 5; i++) {
      bundle('chest', p(.025, .83 + i * .115, .23), p(.46, 1.2, .115), .064, .073, s * -.025, i === 2);
    }
    bundle('biceps', p(.49, 1.15, .1), p(.59, .43, .11), .093, .11, s * .014, true);
    bundle('biceps', p(.54, 1.12, .08), p(.62, .46, .08), .056, .082);
    // Tendinous intersections divide the paired rectus abdominis.
    for (let i = 0; i < 4; i++) {
      bundle('abs', p(.09, .73 - i * .22, .235), p(.085, .535 - i * .22, .22), .088 - i * .005, .057, 0, i === 1);
    }
    // External oblique fascicles angle down toward the opposite side of the pelvis.
    bundle('abs', p(.32, .63, .135), p(.16, .02, .205), .068, .05, -s * .035, true);
    bundle('abs', p(.3, .02, .18), p(.2, -.39, .17), .063, .047, s * .025);
    // Three visible quadriceps bellies, tapering into the patellar tendon.
    bundle('quadriceps', p(.27, -.67, .1), p(.32, -1.47, .125), .105, .125, s * -.025, true);
    bundle('quadriceps', p(.38, -.7, .02), p(.365, -1.49, .1), .107, .11, s * -.023);
    bundle('quadriceps', p(.235, -.88, .055), p(.27, -1.49, .1), .075, .1, s * .018);
    // Twin calf heads continue into narrow Achilles insertions.
    bundle('calves', p(.285, -1.57, -.07), p(.32, -2.26, -.09), .082, .115, s * .014, true);
    bundle('calves', p(.405, -1.59, -.06), p(.34, -2.26, -.09), .073, .105, s * -.017);
    bundle('calves', p(.34, -1.78, -.135), p(.33, -2.25, -.09), .072, .075);
    // Posterior groups sit behind the skeleton and become visible on the flipped view.
    bundle('hamstrings', p(.27, -.72, -.16), p(.32, -1.46, -.14), .105, .11, s * .018, true);
    bundle('hamstrings', p(.34, -.76, -.125), p(.38, -1.42, -.12), .073, .09, -s * .02);
    bundle('hamstrings', p(.2, -.87, -.105), p(.28, -1.43, -.11), .067, .085, s * .015);
    bundle('back', p(.22, 1.13, -.24), p(.38, .22, -.2), .15, .08, s * .04, true);
    bundle('back', p(.07, 1.3, -.15), p(.085, -.34, -.14), .05, .055, s * .008, true);
    bundle('trapezius', p(.02, 1.55, -.2), p(.38, 1.08, -.2), .12, .07, s * .02, true);
    bundle('triceps', p(.55, 1.1, -.09), p(.62, .43, -.1), .1, .09, s * -.02, true);
    bundle('triceps', p(.48, 1.13, -.055), p(.57, .45, -.095), .067, .075, s * .014);
    bundle('triceps', p(.61, 1.01, -.06), p(.65, .47, -.08), .058, .064, -s * .01);
    bundle('forearms', p(.62, .37, -.05), p(.67, -.35, -.05), .07, .065, s * .01, true);
    bundle('forearms', p(.55, .34, .07), p(.6, -.32, .085), .047, .052, -s * .008, true);
  }
  tissue.dispose(); vein.dispose(); artery.dispose();
  return { root, groups };
}
