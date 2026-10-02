export type SystemMode = 'skeleton' | 'muscles' | 'combined';
export type AnatomyPart = { id: string; name: string; category: 'Bone' | 'Muscle'; region: string; description: string; function: string; connects: string; search: string[]; posterior?: boolean; source: string };

const textbook = 'https://openstax.org/books/anatomy-and-physiology-2e/pages/';
const boneRefs: Record<string, string> = { 'Head & neck': '7-2-the-skull', Torso: '7-4-the-thoracic-cage', 'Upper limb': '8-2-bones-of-the-upper-limb', 'Lower limb': '8-4-bones-of-the-lower-limb' };
const muscleRefs: Record<string, string> = { Torso: '11-5-muscles-of-the-pectoral-girdle-and-upper-limbs', 'Upper limb': '11-5-muscles-of-the-pectoral-girdle-and-upper-limbs', 'Lower limb': '11-6-appendicular-muscles-of-the-pelvic-girdle-and-lower-limbs' };
const bone = (id: string, name: string, region: string, description: string, fn: string, connects: string, search: string[], posterior = false): AnatomyPart => ({ id, name, category: 'Bone', region, description, function: fn, connects, search, posterior, source: textbook + (id === 'cervical' || id === 'lumbar' || id === 'sacrum' || id === 'coccyx' ? '7-3-the-vertebral-column' : id === 'ilium' || id === 'pubis' ? '8-3-the-pelvic-girdle-and-pelvis' : id === 'clavicle' || id === 'scapula' ? '8-1-the-pectoral-girdle' : boneRefs[region]) });
const muscle = (id: string, name: string, region: string, description: string, fn: string, connects: string, search: string[], posterior = false): AnatomyPart => ({ id, name, category: 'Muscle', region, description, function: fn, connects, search, posterior, source: textbook + (id === 'abs' ? '11-4-axial-muscles-of-the-abdominal-wall-and-thorax' : id === 'back' || id === 'trapezius' ? '11-3-axial-muscles-of-the-head-neck-and-back' : muscleRefs[region]) });

export const parts: AnatomyPart[] = [
  bone('skull', 'Skull', 'Head & neck', 'The cranium and facial bones form the head and protect the brain.', 'Protects the brain and supports the face.', 'Cervical vertebrae; facial bones', ['cranium', 'frontal', 'parietal', 'occipital', 'temporal', 'maxilla', 'zygomatic', 'sphenoid', 'ethmoid', 'mandible', 'palatine', 'lacrimal', 'vomer', 'nasal', 'tooth', 'teeth', 'canine', 'incisor', 'premolar', 'molar']),
  bone('cervical', 'Cervical vertebrae', 'Head & neck', 'Seven neck vertebrae, C1–C7; the atlas and axis enable head movement.', 'Supports the head and protects the spinal cord.', 'Skull; first thoracic vertebra', ['cervical', 'atlas', 'axis', 'c1', 'c2'], true),
  bone('manubrium', 'Manubrium sterni', 'Torso', 'The broad upper part of the sternum above the sternal angle.', 'Anchors the clavicles and upper ribs.', 'Clavicles; first and second ribs; sternal body', ['manubrium']),
  bone('sternum-body', 'Body of the sternum', 'Torso', 'The elongated middle part of the breastbone.', 'Supports the chest wall and protects thoracic organs.', 'Manubrium; xiphoid; costal cartilages', ['body of sternum', 'sternal body', 'sternum']),
  bone('xiphoid', 'Xiphoid process', 'Torso', 'The small inferior tip of the sternum.', 'Provides attachment for diaphragm and abdominal tissues.', 'Sternal body; diaphragm; rectus abdominis', ['xiphoid']),
  bone('lumbar', 'Lumbar vertebrae', 'Torso', 'Five large vertebrae, L1–L5, occupy the lower back.', 'Bears trunk weight and permits lower-back movement.', 'Thoracic spine; sacrum; discs', ['lumbar'], true),
  bone('ilium', 'Ilium', 'Torso', 'The broad upper part of each hip bone, including the iliac crest.', 'Transfers weight and anchors trunk and hip muscles.', 'Sacrum; pubis; ischium', ['ilium', 'iliac', 'hip bone']),
  bone('sacrum', 'Sacrum', 'Torso', 'Five fused vertebrae form this triangular bone at the spine base.', 'Transfers spinal load to the pelvic girdle.', 'L5; iliac bones; coccyx', ['sacrum'], true),
  bone('coccyx', 'Coccyx', 'Torso', 'The tailbone below the sacrum usually has four fused vertebrae.', 'Anchors pelvic-floor muscles and ligaments.', 'Sacrum; pelvic floor', ['coccyx'], true),
  bone('pubis', 'Pubis', 'Torso', 'The anterior region of each hip bone meets at the pubic symphysis.', 'Supports the anterior pelvis and muscle attachments.', 'Opposite pubis; ilium; ischium', ['pubis', 'pubic']),
  bone('femur', 'Femur', 'Lower limb', 'The thigh bone extends from the hip to the knee.', 'Carries body weight and provides movement leverage.', 'Hip socket; tibia; patella', ['femur']),
  bone('patella', 'Patella', 'Lower limb', 'The kneecap lies within the quadriceps tendon.', 'Protects the knee and improves extension leverage.', 'Femur; quadriceps tendon; tibia', ['patella']),
  bone('tarsus', 'Tarsus', 'Lower limb', 'Seven tarsal bones form the ankle and hindfoot.', 'Supports weight and foot motion.', 'Tibia; fibula; metatarsals', ['tarsal', 'calcaneus', 'talus', 'navicular', 'cuboid', 'cuneiform']),
  bone('metatarsus', 'Metatarsus', 'Lower limb', 'Five metatarsals span the forefoot.', 'Supports the arches and push-off.', 'Tarsals; toe phalanges', ['metatarsal', 'metatarsus']),
  bone('toe-phalanges', 'Phalanges (toes)', 'Lower limb', 'Fourteen toe bones: two in the great toe and three in each other toe.', 'Assists balance and push-off.', 'Metatarsals; toe joints', ['toe', 'foot phalan']),
  bone('orbital', 'Orbital cavity', 'Head & neck', 'A bony socket formed by seven skull bones that houses the eye.', 'Protects the eye and associated tissues.', 'Frontal; sphenoid; zygomatic; maxilla', ['orbit', 'eye socket']),
  bone('nasal-cavity', 'Nasal cavity', 'Head & neck', 'The septum and conchae form the bony walls of the nasal airway.', 'Helps warm, humidify and filter air.', 'Nasal septum; conchae; sinuses', ['nasal cavity', 'nasal concha']),
  bone('clavicle', 'Clavicle', 'Upper limb', 'The S-shaped collarbone links the shoulder girdle with the sternum.', 'Holds the shoulder laterally and transmits arm forces.', 'Manubrium; scapular acromion', ['clavicle', 'collarbone']),
  bone('scapula', 'Shoulder blade', 'Upper limb', 'A triangular bone behind the upper ribs.', 'Provides shoulder attachments and the arm socket.', 'Clavicle; humerus', ['scapula', 'shoulder blade'], true),
  bone('ribs', 'Rib', 'Torso', 'Twelve pairs of curved ribs form the thoracic cage.', 'Protects chest organs and supports breathing.', 'Thoracic vertebrae; costal cartilage', ['rib', 'costal cart']),
  bone('humerus', 'Humerus', 'Upper limb', 'The upper-arm bone runs from shoulder to elbow.', 'Provides leverage for arm movement.', 'Scapula; radius; ulna', ['humerus']),
  bone('ulna', 'Ulna', 'Upper limb', 'The medial forearm bone forms the elbow hinge.', 'Stabilizes the forearm.', 'Humerus; radius', ['ulna']),
  bone('radius', 'Radius', 'Upper limb', 'The thumb-side forearm bone rotates around the ulna.', 'Allows palm rotation and transmits wrist forces.', 'Humerus; ulna; wrist', ['radius']),
  bone('carpus', 'Carpus', 'Upper limb', 'Eight small bones form the wrist in two rows.', 'Provides wrist mobility.', 'Radius; metacarpals', ['carpal', 'scaphoid', 'lunate', 'triquetrum', 'pisiform', 'trapezium', 'trapezoid', 'capitate', 'hamate']),
  bone('metacarpus', 'Metacarpus', 'Upper limb', 'Five metacarpal bones form the palm.', 'Supports grip and positions fingers.', 'Carpals; finger phalanges', ['metacarpal', 'metacarpus']),
  bone('finger-phalanges', 'Phalanges (fingers)', 'Upper limb', 'Fourteen finger bones: two in the thumb and three in each other digit.', 'Enables grasping and precise hand movement.', 'Metacarpals; finger joints', ['finger', 'hand phalan']),
  bone('fibula', 'Fibula', 'Lower limb', 'The slender lateral lower-leg bone forms the outer ankle.', 'Anchors muscles and stabilizes the ankle.', 'Tibia; talus', ['fibula']),
  bone('tibia', 'Tibia', 'Lower limb', 'The shinbone is the principal weight-bearing bone below the knee.', 'Transmits weight from knee to ankle.', 'Femur; fibula; talus', ['tibia']),
  muscle('quadriceps', 'Quadriceps', 'Lower limb', 'Four anterior thigh muscles converge into the quadriceps tendon.', 'Extends the knee; rectus femoris also flexes the hip.', 'Femur and pelvis → patella and tibia', ['quadriceps', 'rectus femoris', 'vastus']),
  muscle('hamstrings', 'Hamstrings', 'Lower limb', 'Biceps femoris, semitendinosus and semimembranosus occupy the posterior thigh.', 'Flexes the knee; most heads extend the hip.', 'Pelvis and femur → tibia and fibula', ['hamstring', 'biceps femoris', 'semitendinosus', 'semimembranosus'], true),
  muscle('calves', 'Calves', 'Lower limb', 'Gastrocnemius and soleus form the calf and share the Achilles tendon.', 'Plantarflexes the ankle for push-off.', 'Femur, tibia and fibula → calcaneus', ['calf', 'calves', 'gastrocnemius', 'soleus'], true),
  muscle('chest', 'Chest', 'Torso', 'Pectoralis major forms the superficial chest over pectoralis minor.', 'Moves the arm inward and supports shoulder movement.', 'Sternum, clavicle and ribs → humerus', ['chest', 'pectoral', 'pectoralis']),
  muscle('back', 'Back', 'Torso', 'Latissimus dorsi and spinal extensors form this posterior group.', 'Draws the arm backward and supports trunk extension.', 'Spine, pelvis and ribs → humerus and vertebrae', ['back', 'latissimus', 'erector spinae'], true),
  muscle('shoulders', 'Shoulders', 'Upper limb', 'Three deltoid regions cover each shoulder joint.', 'Raises the arm and assists forward and backward movement.', 'Clavicle and scapula → humerus', ['shoulder', 'deltoid']),
  muscle('triceps', 'Triceps', 'Upper limb', 'Three triceps brachii heads lie behind the upper arm.', 'Extends the elbow.', 'Scapula and humerus → ulna', ['triceps'], true),
  muscle('biceps', 'Biceps', 'Upper limb', 'Two biceps brachii heads run along the anterior upper arm.', 'Flexes the elbow and supinates the forearm.', 'Scapula → radius', ['biceps', 'biceps brachii']),
  muscle('forearms', 'Forearms', 'Upper limb', 'Flexors and extensors act through long wrist and finger tendons.', 'Moves the wrist and fingers.', 'Humerus, radius and ulna → hand', ['forearm', 'flexor', 'extensor', 'brachioradialis']),
  muscle('trapezius', 'Trapezius', 'Torso', 'A broad superficial muscle spans the posterior neck and upper back.', 'Elevates, retracts and rotates the scapula.', 'Occipital bone and spine → clavicle and scapula', ['trapezius', 'traps'], true),
  muscle('abs', 'Abs', 'Torso', 'Rectus abdominis and obliques form the abdominal wall.', 'Flexes and rotates the trunk; compresses abdominal contents.', 'Ribs and sternum → pelvis', ['abs', 'abdominal', 'rectus abdominis', 'oblique']),
];

export const partById = Object.fromEntries(parts.map(part => [part.id, part])) as Record<string, AnatomyPart>;
export const regions = ['Head & neck', 'Torso', 'Upper limb', 'Lower limb'];
export const skeletalParts = parts.filter(part => part.category === 'Bone');
export const muscleParts = parts.filter(part => part.category === 'Muscle');
export function partMatchesQuery(part: AnatomyPart, query: string): boolean { const q = query.trim().toLowerCase(); return !q || [part.name, part.category, part.region, ...part.search].join(' ').toLowerCase().includes(q); }

export function partFromMeshName(name: string): string | null {
  const lower = name.toLowerCase().replace(/_/g, ' ');
  if (/phalan/.test(lower)) return /foot|toe/.test(lower) ? 'toe-phalanges' : 'finger-phalanges';
  if (/metatars/.test(lower)) return 'metatarsus';
  if (/metacarp/.test(lower)) return 'metacarpus';
  if (/cervical|atlas|axis/.test(lower)) return 'cervical';
  if (/lumbar/.test(lower)) return 'lumbar';
  if (/sacrum/.test(lower)) return 'sacrum';
  if (/coccyx/.test(lower)) return 'coccyx';
  if (/manubrium/.test(lower)) return 'manubrium';
  if (/body of sternum|sternum/.test(lower)) return 'sternum-body';
  if (/rib/.test(lower)) return 'ribs';
  if (/hip bone|ilium/.test(lower)) return 'ilium';
  if (/pubis/.test(lower)) return 'pubis';
  if (/scapula/.test(lower)) return 'scapula';
  if (/clavicle/.test(lower)) return 'clavicle';
  if (/femur|patella|tibia|fibula|humerus|ulna|radius/.test(lower)) {
    for (const id of ['femur', 'patella', 'tibia', 'fibula', 'humerus', 'ulna', 'radius']) if (lower.includes(id)) return id;
  }
  if (/carpal|scaphoid|lunate|triquetrum|pisiform|trapezium|trapezoid|capitate|hamate/.test(lower)) return 'carpus';
  if (/tarsal|calcaneus|talus|navicular|cuboid|cuneiform/.test(lower)) return 'tarsus';
  if (/orbit|orbital/.test(lower)) return 'orbital';
  if (/nasal concha|nasal cavity/.test(lower)) return 'nasal-cavity';
  if (/thoracic vertebra|ischium|sesamoid|mandible/.test(lower)) return null;
  if (lower.includes('skull') || /frontal|parietal|occipital|temporal|sphenoid|ethmoid|vomer|maxilla|zygomatic|nasal|tooth|canine|incisor|premolar|molar/.test(lower)) return 'skull';
  return null;
}
