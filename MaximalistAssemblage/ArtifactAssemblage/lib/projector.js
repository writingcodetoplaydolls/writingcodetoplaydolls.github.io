// Projectors, two kinds, matching what the Unity scene did:
//
//   createScreen()    the VideoPlayer-on-a-Plane approach: a flat surface with the picture on it.
//   createProjector() the ProjectorSimulator prefab approach: a projector body at a position and
//                     orientation, a throw ratio and aspect that fix the image size at the wall it
//                     hits, the picture laid onto that wall as a decal, a translucent light-path cone,
//                     and a soft spotlight so the beam actually lights the room.
//
// Video is muted until the viewer asks for sound; browsers insist on that.

import * as THREE from 'three'
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js'

export function createMedia(src, { loop = true } = {}) {
  const isVideo = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src)
  let video = null, texture
  if (isVideo) {
    video = document.createElement('video')
    Object.assign(video, { src, loop, muted: true, playsInline: true, crossOrigin: 'anonymous', preload: 'auto' })
    texture = new THREE.VideoTexture(video)
  } else {
    texture = new THREE.TextureLoader().load(src)
  }
  texture.colorSpace = THREE.SRGBColorSpace
  const media = {
    src, video, texture,
    play() { return video?.play().catch(err => console.warn('video play blocked until a click:', err.message)) },
    pause() { video?.pause() },
    toggle() { video && (video.paused ? media.play() : media.pause()) },
    get muted() { return video ? video.muted : true },
    set muted(v) { if (video) video.muted = v },
    get playing() { return !!video && !video.paused },
  }
  if (video) media.play()
  return media
}

// A flat picture surface. geometry is any plane; transform is {position, quaternion, scale}.
export function createScreen({ scene, media, geometry, transform, brightness = 1.0 }) {
  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
    map: media.texture, emissiveMap: media.texture, emissive: 0xffffff, emissiveIntensity: brightness, roughness: 0.6, side: THREE.DoubleSide,
  }))
  if (transform?.position) mesh.position.fromArray(transform.position)
  if (transform?.quaternion) mesh.quaternion.fromArray(transform.quaternion)
  if (transform?.scale) mesh.scale.fromArray(transform.scale)
  mesh.castShadow = true
  scene.add(mesh)
  return { mesh, media, set visible(v) { mesh.visible = v }, get visible() { return mesh.visible } }
}

// A thrown image. position/quaternion are the projector's (Three frame, forward = local -Z).
export function createProjector({
  scene, media, position, quaternion,
  throwRatio = 1.0, aspect = 1.6, brightness = 1.0, range = 20,
  surfaces = [],            // meshes the beam can land on (walls, floor…)
  showLightPath = true, lightPathExtra = 0, name = 'projector',
}) {
  const group = new THREE.Group(); group.name = name
  group.position.fromArray(position); group.quaternion.fromArray(quaternion)
  scene.add(group)

  // body + lens
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.13, 0.3), new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.55 }))
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.04, 24).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8fb4ff, emissive: 0x6c9bff, emissiveIntensity: 1.5, roughness: 0.2 }))
  lens.position.set(0.08, 0.02, -0.16)
  group.add(body, lens)

  // the beam's light in the room; the Unity prefab used three coloured spots of this angle
  const halfAngle = Math.atan(0.5 / throwRatio)
  const spot = new THREE.SpotLight(0xffffff, 30 * brightness, range, Math.atan(Math.hypot(0.5, 0.5 / aspect) / throwRatio), 0.35, 1.2)
  spot.position.copy(lens.position)
  spot.target.position.set(lens.position.x, lens.position.y, -range)
  group.add(spot, spot.target)

  let decal = null, cone = null
  const raycaster = new THREE.Raycaster()
  const origin = new THREE.Vector3(), forward = new THREE.Vector3()

  // Aim at whatever is in front, lay the picture on it, draw the light path to it.
  function aim() {
    if (decal) { group.parent?.remove(decal); decal.geometry.dispose(); decal = null }
    if (cone) { group.remove(cone); cone.geometry.dispose(); cone = null }
    group.updateMatrixWorld(true)
    lens.getWorldPosition(origin)
    forward.set(0, 0, -1).applyQuaternion(group.getWorldQuaternion(new THREE.Quaternion()))
    raycaster.set(origin, forward); raycaster.far = range
    const hit = raycaster.intersectObjects(surfaces, true)[0]
    const d = hit ? hit.distance : range
    const w = d / throwRatio, h = w / aspect
    if (hit) {
      const orientation = new THREE.Euler().setFromQuaternion(group.getWorldQuaternion(new THREE.Quaternion()))
      // The decal box must be deep enough, along the beam, to reach the whole picture: square on to a
      // wall that is a sliver, but a beam skimming a floor spreads its picture a long way along it.
      const worldNormal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : forward.clone().negate()
      const grazing = Math.min(1, Math.abs(forward.dot(worldNormal)))        // 1 = square on, → 0 = skimming along the surface
      const depth = Math.max(0.3, d * 0.05, grazing > 0.02 ? h * Math.sqrt(1 - grazing * grazing) / grazing * 1.1 : range)
      decal = new THREE.Mesh(
        new DecalGeometry(hit.object, hit.point, orientation, new THREE.Vector3(w, h, depth)),
        new THREE.MeshStandardMaterial({
          map: media.texture, emissiveMap: media.texture, emissive: 0xffffff, emissiveIntensity: 0.9 * brightness, roughness: 1,
          transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
        }),
      )
      decal.name = name + ' image'
      scene.add(decal)
    }
    if (showLightPath) {
      const L = d + lightPathExtra
      const geo = new THREE.BufferGeometry()
      const v = [0, 0, 0,  -w / 2 * (L / d), -h / 2 * (L / d), -L,   w / 2 * (L / d), -h / 2 * (L / d), -L,   w / 2 * (L / d), h / 2 * (L / d), -L,   -w / 2 * (L / d), h / 2 * (L / d), -L]
      geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
      geo.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1])
      geo.computeVertexNormals()
      cone = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xbfd9ff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }))
      cone.raycast = () => {}                   // light is not something you click on
      cone.position.copy(lens.position)
      group.add(cone)
    }
    return { distance: d, width: w, height: h, hit: hit?.object?.name ?? null }
  }

  const api = {
    group, spot, media, aim,
    get visible() { return group.visible },
    set visible(v) { group.visible = v; if (decal) decal.visible = v },
    get lightPath() { return !!cone?.visible },
    set lightPath(v) { if (cone) cone.visible = v },
    dispose() { if (decal) { scene.remove(decal); decal.geometry.dispose() } scene.remove(group) },
  }
  return api
}
