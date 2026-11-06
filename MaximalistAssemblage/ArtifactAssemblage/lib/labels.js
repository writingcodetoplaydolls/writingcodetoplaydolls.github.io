// Text in the scene: a sprite per label, drawn on a canvas with a soft dark backing, sized in metres
// so it reads at a distance, always facing the camera. A second, smaller line is optional.
//
//   const label = makeLabel(THREE, 'new materialism', { sub: '1,245 hits', height: 0.22 })
//   label.position.set(x, y, z); scene.add(label); label.setText('…', '…'); label.dim(true)

export function makeLabel(THREE, text, { sub = '', height = 0.2, color = '#ffffff', subColor = '#c9d2e3', backing = 'rgba(8,10,16,0.62)', font = 'system-ui, sans-serif' } = {}) {
  const cv = document.createElement('canvas'), g = cv.getContext('2d')
  const mat = new THREE.SpriteMaterial({ transparent: true, depthWrite: false, depthTest: false })
  const sprite = new THREE.Sprite(mat); sprite.renderOrder = 10
  const draw = (main, small) => {
    const px = 40, sm = 26, pad = 14
    g.font = `600 ${px}px ${font}`; const w1 = g.measureText(main).width
    g.font = `${sm}px ${font}`; const w2 = small ? g.measureText(small).width : 0
    const w = Math.ceil(Math.max(w1, w2) + pad * 2), h = px + (small ? sm + 8 : 0) + pad * 2
    cv.width = w; cv.height = h
    g.fillStyle = backing; g.beginPath(); g.roundRect(0, 0, w, h, 12); g.fill()
    g.textBaseline = 'top'; g.fillStyle = color; g.font = `600 ${px}px ${font}`; g.fillText(main, pad, pad - 2)
    if (small) { g.fillStyle = subColor; g.font = `${sm}px ${font}`; g.fillText(small, pad, pad + px + 4) }
    if (mat.map) mat.map.dispose()
    mat.map = new THREE.CanvasTexture(cv); mat.map.colorSpace = THREE.SRGBColorSpace; mat.needsUpdate = true
    sprite.scale.set(height * w / h * (small ? 1 : 0.62 * h / px), height * (small ? 1 : 0.62), 1)   // height is the box height in metres
  }
  draw(text, sub)
  sprite.setText = (main, small = '') => draw(main, small)
  sprite.dim = on => { mat.opacity = on ? 0.35 : 1 }
  return sprite
}
