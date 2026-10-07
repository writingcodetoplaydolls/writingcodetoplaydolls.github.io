// A Mixamo character playing Mixamo animation clips. Click or tap the character
// to switch clips with a short crossfade.
//
// Getting the files (mixamo.com, free with an Adobe login):
//   1. Pick a character, pick an animation, press Download.
//      Format: FBX Binary   Skin: With Skin   Frames per second: 30   Keyframe reduction: none
//      Save it as  public/models/character.fbx   (character + its first clip)
//   2. For more moves: same character, another animation, Download with  Skin: Without Skin
//      Save as  public/models/<move>.fbx  and add the path to CLIPS below. Missing files are skipped.
//   3. For walk and run cycles tick "In Place" in Mixamo, or the character walks off the grid.
//
// GLB works too (convert FBX in Blender): use .glb paths and the loader is chosen by extension.

import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

// Your own library is at K:\Fodder\objects\pregnant\fbx. Two skeletons live there:
// the capoeira clips (animation only) fit pregnant4_14k.fbx and Capoeira(1).fbx;
// everything else (Dancing, Flying, Laying…) is a full character + clip on a larger rig
// and can stand on its own as CHARACTER, or feed CLIPS for a character from that same rig.
const CHARACTER = '/assets/models/pregnant_v2.fbx'                // the re-rigged rebuilt-arm model from Mixamo
const FALLBACK  = '/assets/models/pregnant.fbx'                   // the 2020 rig (pregnant4_14k.fbx), used until v2 exists
const CLIPS = [                                             // copied from the capoeira set, animation only
  '/assets/models/ginga.fbx',                                     // "ginga variation 1"
  '/assets/models/esquiva.fbx',                                   // "esquiva 1"
  '/assets/models/armada.fbx',
  '/assets/models/meia-lua-de-compasso.fbx',
  '/assets/models/martelo.fbx',
  '/assets/models/capoeira.fbx',
]
const FORCE_SCALE = 0                                      // 0 = measure the file and pick cm or m; or set e.g. 0.01
const FADE = 0.3                                           // seconds of crossfade when switching clips

let mixer, actions = [], current = 0, sayHint, clipControl
const params = { speed: 1, clip: '' }                      // bound to the panel's slider and dropdown

const nameOf = url => url.split('/').pop().replace(/\.\w+$/, '')
const isFBX = url => /\.fbx$/i.test(url)

async function load(url) {
  const loader = isFBX(url) ? new FBXLoader() : new GLTFLoader()
  const result = await loader.loadAsync(url)
  return { object: result.scene ?? result, animations: result.animations ?? [] }
}

export async function setup({ THREE, scene, selectable, hint, controls, gui }) {
  sayHint = hint
  scene.background = new THREE.Color(0x181a20)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.2))
  const sun = new THREE.DirectionalLight(0xffffff, 1.5)
  sun.position.set(3, 5, 2)
  scene.add(sun)
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a2d36, roughness: 0.9 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.005
  scene.add(floor)
  scene.add(new THREE.GridHelper(8, 16, 0x444a55, 0x30343d))
  controls.target.set(0, 1, 0)

  hint('loading character…')
  let character, used = CHARACTER
  try {
    character = await load(CHARACTER)
  } catch {
    try { character = await load(FALLBACK); used = FALLBACK }
    catch (err) {
      hint(`no character at public${CHARACTER.slice(1)} or public${FALLBACK.slice(1)}. See the notes in mixamo.js`)
      console.warn('character failed to load:', err)
      return
    }
  }
  console.log('character file:', used)

  const model = character.object

  // Clips and character can be in different units: Mixamo downloads are centimetres, this
  // library is metres. Compare hip heights and rescale a clip's position tracks to match,
  // otherwise a metre-unit clip drives a centimetre-unit rig into the floor.
  const hips = model.getObjectByName('mixamorigHips')
  const charHipY = hips ? Math.abs(hips.position.y) : 0
  const fitUnits = clip => {
    const hipTrack = clip.tracks.find(t => t.name.endsWith('Hips.position'))
    if (!hipTrack || !charHipY) return clip
    const ratio = charHipY / Math.abs(hipTrack.values[1])
    if (ratio > 0.5 && ratio < 2) return clip                       // already the same units
    for (const t of clip.tracks) if (t.name.endsWith('.position')) for (let i = 0; i < t.values.length; i++) t.values[i] *= ratio
    console.log(`clip ${clip.name}: position tracks scaled ×${ratio.toFixed(2)} to match the character's units`)
    return clip
  }
  // Mixamo FBX is usually centimetres, but a model uploaded in metres comes back in metres.
  // Measure the standing height and scale only if it is clearly centimetres.
  const height = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).y
  model.scale.setScalar(FORCE_SCALE || (height > 10 ? 0.01 : 1))
  console.log(`character: ${height.toFixed(1)} file units tall → scale ${model.scale.x} → ${(height * model.scale.x).toFixed(2)} m`)
  model.traverse(o => { if (o.isSkinnedMesh) o.frustumCulled = false })   // skinned bounds lag the pose; never cull
  scene.add(selectable(model))

  // The character file's own clip comes first, unless it is just a frozen bind pose
  // (a few hundredths of a second long), which is not worth a slot in the cycle.
  // Extra clips come from "Without Skin" files of the same rig, so their bone names
  // match and they drive this skeleton.
  const clips = character.animations.filter(c => c.duration > 0.1).slice(0, 1)
  if (clips[0]) clips[0].name = nameOf(used)
  for (const url of CLIPS) {
    try {
      const extra = await load(url)
      if (extra.animations[0]) { extra.animations[0].name = nameOf(url); clips.push(fitUnits(extra.animations[0])) }
    } catch (err) { console.warn('clip skipped:', url, err.message) }   // optional file, carry on
  }

  mixer = new THREE.AnimationMixer(model)
  actions = clips.map(clip => mixer.clipAction(clip))
  if (actions[0]) actions[0].play()

  // Panel: speed is the mixer's time scale (0 pauses, 1 is normal, 2 double).
  const names = clips.map(c => c.name)
  params.clip = names[current] ?? ''
  gui.add(params, 'speed', 0, 3, 0.05).onChange(v => { mixer.timeScale = v })
  clipControl = gui.add(params, 'clip', names).onChange(n => switchTo(names.indexOf(n)))
  showClip()
}

function showClip() {
  const names = actions.map((a, i) => i === current ? `[${a.getClip().name}]` : a.getClip().name)
  sayHint(actions.length > 1 ? `${names.join('  ')} · click the character to switch` : names.join(''))
}

function switchTo(i) {
  if (i === current || !actions[i]) return
  const from = actions[current]
  const to = actions[i]
  current = i
  to.enabled = true
  to.setEffectiveTimeScale(1).setEffectiveWeight(1)
  to.reset().play()
  from.crossFadeTo(to, FADE, true)
  params.clip = to.getClip().name
  clipControl?.updateDisplay()                 // keep the dropdown in step with a click
  showClip()
}

export function draw(ctx, dt) {
  mixer?.update(dt)
}

export function onSelect(hit) {
  if (!hit || actions.length < 2) return
  switchTo((current + 1) % actions.length)
}
