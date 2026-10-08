// Port of DayNightController.cs (and the DayNightPointLight idea) from the Unity house scene.
//
// Unity version: the sun's rotation is Euler((time * 360) - 90, 170, 0); intensity is 0 at night,
// ramps up between time 0.23 and 0.25, down between 0.73 and 0.75; time 0 = midnight, 0.5 = noon,
// one full day every secondsInFullDay. This keeps exactly that, and additionally drives the Sky
// shader's sun, the hemisphere fill, and turns interior lights on at night.

import * as THREE from 'three'

export function createDayNight({
  sun, sky = null, hemisphere = null, interiorLights = [],
  secondsInFullDay = 60, time = 0.35, azimuthDeg = 170,
  sunIntensity = 2.5, hemisphereIntensity = 0.35, target = new THREE.Vector3(),
}) {
  const state = { time, speed: 1, paused: false, secondsInFullDay, azimuthDeg }
  const interiorBase = interiorLights.map(l => l.intensity)
  const dir = new THREE.Vector3()

  function daylight(t) {                       // the Unity intensityMultiplier curve
    if (t <= 0.23 || t >= 0.75) return 0
    if (t <= 0.25) return THREE.MathUtils.clamp((t - 0.23) / 0.02, 0, 1)
    if (t >= 0.73) return THREE.MathUtils.clamp(1 - (t - 0.73) / 0.02, 0, 1)
    return 1
  }

  function apply() {
    const t = state.time
    const pitch = THREE.MathUtils.degToRad(t * 360 - 90)
    const yaw = THREE.MathUtils.degToRad(state.azimuthDeg)
    // Unity forward of Euler(pitch, yaw, 0), then mirrored into Three's frame (z → -z)
    dir.set(Math.cos(pitch) * Math.sin(yaw), -Math.sin(pitch), -Math.cos(pitch) * Math.cos(yaw))
    const d = daylight(t)
    sun.position.copy(target).addScaledVector(dir, -80)
    sun.target.position.copy(target)
    sun.intensity = sunIntensity * d
    sun.visible = d > 0
    if (sky) sky.material.uniforms.sunPosition.value.copy(dir).negate()
    if (hemisphere) hemisphere.intensity = hemisphereIntensity * (0.12 + 0.88 * d)
    interiorLights.forEach((l, i) => { l.intensity = interiorBase[i] * (1 - d) })
    return d
  }

  return {
    state,
    get time() { return state.time },
    set time(v) { state.time = ((v % 1) + 1) % 1; apply() },
    get daylight() { return daylight(state.time) },
    update(dt) {
      if (!state.paused) state.time = (state.time + (dt / state.secondsInFullDay) * state.speed) % 1
      return apply()
    },
    // 24-hour clock string for the hint line
    clock() { const h = state.time * 24; return `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}` },
  }
}
