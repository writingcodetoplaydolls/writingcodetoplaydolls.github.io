// floating-skin / skin.js
// Thesis drop-in body module: Amy's floating-skin figure (pregnant photogrammetry scan,
// skinned SMPL-X), drawn as a dense point cloud whose colour + displacement come from the
// embryo "Bubbles" image. Self-contained; it owns NO canvas/camera/lights/loop. The thesis
// world adds `object` to its scene, turns it to face the reader, and calls update(dt, info).
//
//   const body = await createBody({ THREE, assets, quiet });
//   scene.add(body.object);  // then each frame: body.update(dt, info)
//
// Conventions: metres, Y up, feet near y=0, facing +Z (Object3D.lookAt aims +Z at a target).
// rest() = standing, held, a barely-perceptible figure-8 gaze. go() = a slow travelling sway.
// Contract: createBody -> { object, height, update(dt, info), rest(), go(), dispose() }.
// info (optional 2nd arg to update): { pixels, devicePixels, state, inWindow } -> adaptive LOD.

const d2r = Math.PI / 180;
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);

export async function createBody({ THREE, assets, quiet = false } = {}) {
  // ---- locate + load the payload (relative to this module; works dev + published) ----
  let base;
  if (typeof assets === 'string') base = assets;
  else if (assets && assets.base) base = assets.base;
  else base = new URL('.', import.meta.url).href;
  const D = await loadPayload(new URL('skin-data.bin', base).href);

  // ---- unpack geometry + skinning ----
  const V = Float32Array.from(D.verts), F = Int32Array.from(D.faces);
  const N = D.norms ? Float32Array.from(D.norms) : null;
  const vtj = Int32Array.from(D.vtj), vtw = Float32Array.from(D.vtw), vk = D.vk;
  const Jrest = Float32Array.from(D.joints), parents = D.parents, JN = parents.length;
  const nV = V.length / 3, nF = F.length / 3;
  const Vp = new Float32Array(V.length);           // skinned vertex positions
  const Np = N ? new Float32Array(N.length) : null; // skinned normals

  // per-vertex UV: prefer the baked arms-down cylindrical UV, else a live pelvis-cylinder
  let uvV;
  if (D.uv) uvV = Float32Array.from(D.uv);
  else {
    uvV = new Float32Array(nV * 2);
    let ymin = 1e9, ymax = -1e9;
    for (let v = 0; v < nV; v++) { const y = V[3 * v + 1]; if (y < ymin) ymin = y; if (y > ymax) ymax = y; }
    const ax = Jrest[0], az = Jrest[2], hy = Math.max(ymax - ymin, 1e-6);
    for (let v = 0; v < nV; v++) {
      uvV[2 * v] = Math.atan2(V[3 * v] - ax, V[3 * v + 2] - az) / 6.2831853 + 0.5;
      uvV[2 * v + 1] = (V[3 * v + 1] - ymin) / hy;
    }
  }

  // ---- tuning (ported from the standalone bubbles embed viewer) ----
  const CFG = {
    MAXN: 160000,                    // max wrapper points; LOD scales the drawn count down
    MINN: 2500,
    pointsPerDevPx2: 0.45,           // drawn points ~ 0.45 * devicePixelHeight^2 (~1 pt/px of silhouette)
    dispMax: 0.060, dispMin: -0.016, baseOff: 0.000, hContrast: 1.35, invert: false,
    protAmount: 0.92, limbScale: 0.5, opacity: 0.95,
    headYaw: 18 * d2r, headPitch: 11 * d2r, headRoll: 7 * d2r, headSpeed: 0.11,
    pointSize: 0.0065,
  };

  // =====================================================================
  //  FK / linear-blend skinning (row-major 4x4), ported verbatim
  // =====================================================================
  function rotAxis(ax, ay, az, ang) {
    const n = Math.hypot(ax, ay, az) || 1; ax /= n; ay /= n; az /= n;
    const s = Math.sin(ang), c = Math.cos(ang), t = 1 - c;
    return [t*ax*ax+c, t*ax*ay-s*az, t*ax*az+s*ay, t*ax*ay+s*az, t*ay*ay+c, t*ay*az-s*ax, t*ax*az-s*ay, t*ay*az+s*ax, t*az*az+c];
  }
  const ID9 = [1,0,0,0,1,0,0,0,1];
  function mul(a, b, o) { for (let i=0;i<4;i++) for (let j=0;j<4;j++){ let s=0; for (let k=0;k<4;k++) s+=a[i*4+k]*b[k*4+j]; o[i*4+j]=s; } }
  function mat3(a, b) { const o=new Float64Array(9); for (let i=0;i<3;i++) for (let j=0;j<3;j++){ let s=0; for (let k=0;k<3;k++) s+=a[i*3+k]*b[k*3+j]; o[i*3+j]=s; } return o; }
  function setRT(m, R, tx, ty, tz) { m[0]=R[0];m[1]=R[1];m[2]=R[2];m[3]=tx;m[4]=R[3];m[5]=R[4];m[6]=R[5];m[7]=ty;m[8]=R[6];m[9]=R[7];m[10]=R[8];m[11]=tz;m[12]=0;m[13]=0;m[14]=0;m[15]=1; }
  const G = new Float64Array(JN*16), M = new Float64Array(JN*16), loc = new Float64Array(16), tmp = new Float64Array(16);
  function computeM(Rof) {
    setRT(G.subarray(0,16), Rof(0)||ID9, Jrest[0], Jrest[1], Jrest[2]);
    for (let j=1;j<JN;j++){ const p=parents[j];
      setRT(loc, Rof(j)||ID9, Jrest[3*j]-Jrest[3*p], Jrest[3*j+1]-Jrest[3*p+1], Jrest[3*j+2]-Jrest[3*p+2]);
      mul(G.subarray(p*16,p*16+16), loc, tmp); G.set(tmp, j*16); }
    for (let j=0;j<JN;j++){ const b=j*16, jx=Jrest[3*j], jy=Jrest[3*j+1], jz=Jrest[3*j+2];
      for (let i=0;i<12;i++) M[b+i]=G[b+i];
      M[b+3]=G[b]*-jx+G[b+1]*-jy+G[b+2]*-jz+G[b+3];
      M[b+7]=G[b+4]*-jx+G[b+5]*-jy+G[b+6]*-jz+G[b+7];
      M[b+11]=G[b+8]*-jx+G[b+9]*-jy+G[b+10]*-jz+G[b+11]; }
  }
  function skinVerts(upTo) {
    const n = upTo || nV;
    for (let v=0; v<n; v++){
      let m0=0,m1=0,m2=0,m3=0,m4=0,m5=0,m6=0,m7=0,m8=0,m9=0,m10=0,m11=0;
      for (let kk=0;kk<vk;kk++){ const w=vtw[v*vk+kk]; if(w===0) continue; const b=vtj[v*vk+kk]*16;
        m0+=w*M[b];m1+=w*M[b+1];m2+=w*M[b+2];m3+=w*M[b+3];m4+=w*M[b+4];m5+=w*M[b+5];m6+=w*M[b+6];m7+=w*M[b+7];m8+=w*M[b+8];m9+=w*M[b+9];m10+=w*M[b+10];m11+=w*M[b+11]; }
      const x=V[3*v],y=V[3*v+1],z=V[3*v+2];
      Vp[3*v]=m0*x+m1*y+m2*z+m3; Vp[3*v+1]=m4*x+m5*y+m6*z+m7; Vp[3*v+2]=m8*x+m9*y+m10*z+m11;
      if (Np){ const nx=N[3*v],ny=N[3*v+1],nz=N[3*v+2];
        let a=m0*nx+m1*ny+m2*nz, b=m4*nx+m5*ny+m6*nz, c=m8*nx+m9*ny+m10*nz; const il=1/(Math.hypot(a,b,c)||1);
        Np[3*v]=a*il; Np[3*v+1]=b*il; Np[3*v+2]=c*il; }
    }
  }

  // =====================================================================
  //  Pose: A-pose base; rest() adds the figure-8 gaze, go() a travelling sway
  // =====================================================================
  const JIDX = { L_SH:16, R_SH:17, L_EL:18, R_EL:19, SP1:3, SP2:6, SP3:9, L_HIP:1, R_HIP:2, L_KN:4, R_KN:5, NECK:12, HEAD:15 };
  const Rmap = new Map();
  const Rof = j => Rmap.get(j) || null;
  let mode = 'rest', clock = 0, headT = 0;
  function buildPose() {
    Rmap.clear(); const P = (j, R) => Rmap.set(j, R);
    // arms-down A-pose (avoids the open T-pose armpit)
    P(JIDX.L_SH, rotAxis(0,0,1,-70*d2r)); P(JIDX.R_SH, rotAxis(0,0,1,70*d2r));
    P(JIDX.L_EL, rotAxis(0,1,0,10*d2r));  P(JIDX.R_EL, rotAxis(0,1,0,-10*d2r));
    if (quiet) return;                                   // reduced motion: hold still
    if (mode === 'go') {
      const t = clock;
      const sway = 9*d2r*Math.sin(t*0.55);               // slow weight-shift through the spine
      P(JIDX.SP1, rotAxis(0,0,1, sway*0.35)); P(JIDX.SP2, rotAxis(0,0,1, sway*0.35)); P(JIDX.SP3, rotAxis(0,0,1, sway*0.30));
      P(JIDX.L_HIP, rotAxis(1,0,0, 6*d2r*Math.sin(t*0.55))); P(JIDX.R_HIP, rotAxis(1,0,0, -6*d2r*Math.sin(t*0.55)));
      const look = 26*d2r*Math.sin(t*0.37);              // she glances about while away
      P(JIDX.NECK, rotAxis(0,1,0, look*0.4)); P(JIDX.HEAD, rotAxis(0,1,0, look));
    } else {
      // rest: barely-perceptible lying-figure-8 gaze at the reader (yaw x sin t, pitch x sin 2t)
      const t = headT;
      const yaw = CFG.headYaw*Math.sin(t), pitch = CFG.headPitch*Math.sin(2*t), roll = CFG.headRoll*Math.sin(t);
      P(JIDX.NECK, rotAxis(0,1,0, yaw*0.35));
      P(JIDX.HEAD, mat3(rotAxis(0,1,0,yaw), mat3(rotAxis(1,0,0,pitch), rotAxis(0,0,1,roll))));
    }
  }

  // =====================================================================
  //  Head / limb masks (protect the face, calm the limbs)
  // =====================================================================
  const HEADJ = new Set([15,22,23,24]);
  const protect = new Float32Array(nV);
  for (let v=0;v<nV;v++){ let ph=0,pn=0; for (let k=0;k<vk;k++){ const j=vtj[v*vk+k], w=vtw[v*vk+k]; if (HEADJ.has(j)) ph+=w; else if (j===12) pn+=w; } const p=ph+0.6*pn; protect[v]=p>1?1:p; }
  const LIMBJ = new Set([1,2,4,5,7,8,10,11,16,17,18,19,20,21]);
  for (let j=25;j<JN;j++) LIMBJ.add(j);
  const limb = new Float32Array(nV);
  for (let v=0;v<nV;v++){ let p=0; for (let k=0;k<vk;k++){ if (LIMBJ.has(vtj[v*vk+k])) p+=vtw[v*vk+k]; } limb[v]=p>1?1:p; }

  // =====================================================================
  //  Area-weighted surface sampling (fixed MAX set; LOD varies the DRAWN count)
  // =====================================================================
  const triCdf = new Float32Array(nF);
  (function(){ let acc=0; for (let f=0;f<nF;f++){ const a=F[3*f]*3,b=F[3*f+1]*3,c=F[3*f+2]*3;
    const ux=V[b]-V[a],uy=V[b+1]-V[a+1],uz=V[b+2]-V[a+2],vx=V[c]-V[a],vy=V[c+1]-V[a+1],vz=V[c+2]-V[a+2];
    acc+=0.5*Math.hypot(uy*vz-uz*vy, uz*vx-ux*vz, ux*vy-uy*vx); triCdf[f]=acc; }
    const inv=1/(acc||1); for (let f=0;f<nF;f++) triCdf[f]*=inv; })();

  const M_ = CFG.MAXN;
  const sampF = new Int32Array(M_), sampB = new Float32Array(M_*3), sampUV = new Float32Array(M_*2);
  const sampProt = new Float32Array(M_), sampLimb = new Float32Array(M_);
  const ppos = new Float32Array(M_*3), pcol = new Float32Array(M_*3), psamp = new Float32Array(M_);
  const praw = new Float32Array(M_);   // the image's own luminance per sample, before contrast
  (function buildSamples(){
    let seed = 2246822519 >>> 0; const rnd = () => { seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296; };
    for (let i=0;i<M_;i++){
      const r=rnd(); let lo=0,hi=nF-1; while(lo<hi){ const mid=(lo+hi)>>1; if(triCdf[mid]<r) lo=mid+1; else hi=mid; } const f=lo;
      let a=rnd(),b=rnd(); if(a+b>1){a=1-a;b=1-b;} const b0=1-a-b,b1=a,b2=b;
      sampF[i]=f; sampB[3*i]=b0; sampB[3*i+1]=b1; sampB[3*i+2]=b2;
      const i0=F[3*f],i1=F[3*f+1],i2=F[3*f+2];
      sampProt[i]=b0*protect[i0]+b1*protect[i1]+b2*protect[i2];
      sampLimb[i]=b0*limb[i0]+b1*limb[i1]+b2*limb[i2];
      let u0=uvV[2*i0],u1=uvV[2*i1],u2=uvV[2*i2];
      if (Math.max(u0,u1,u2)-Math.min(u0,u1,u2)>0.5){ if(u0<0.5)u0+=1; if(u1<0.5)u1+=1; if(u2<0.5)u2+=1; }
      sampUV[2*i]=(b0*u0+b1*u1+b2*u2)%1;
      sampUV[2*i+1]=b0*uvV[2*i0+1]+b1*uvV[2*i1+1]+b2*uvV[2*i2+1];
    }
  })();

  // =====================================================================
  //  Bubbles image -> per-sample colour + height (computed once)
  // =====================================================================
  const wimg = (D.wrapImages && D.wrapImages[0]) ? await loadImageData(D.wrapImages[0].uri) : null;
  (function precompute(){
    if (!wimg) { for (let i=0;i<M_;i++){ pcol[3*i]=pcol[3*i+1]=pcol[3*i+2]=0.8; praw[i]=0.5; } return; }
    const { data, W, H } = wimg;
    // luminance field for height
    const L = new Float32Array(W*H);
    for (let p=0,q=0;p<L.length;p++,q+=4) L[p]=(0.299*data[q]+0.587*data[q+1]+0.114*data[q+2])/255;
    for (let i=0;i<M_;i++){
      const u=((sampUV[2*i]%1)+1)%1, v=clamp(sampUV[2*i+1],0,1);
      const cx=Math.min(W-1,Math.floor(u*W)), cy=Math.min(H-1,Math.floor((1-v)*H)), ci=(cy*W+cx)*4;
      pcol[3*i]=data[ci]/255; pcol[3*i+1]=data[ci+1]/255; pcol[3*i+2]=data[ci+2]/255;
      praw[i]=L[cy*W+cx];
    }
  })();

  // The black-and-white field read into heights: contrast about mid grey, and
  // which of black and white stands out. Kept apart from the sampling above so
  // it can be redone from the raw luminance whenever either is retuned.
  function applyHeights() {
    const ct = CFG.hContrast * (CFG.invert ? -1 : 1);
    for (let i=0;i<M_;i++){ const h = 0.5 + (praw[i]-0.5)*ct; psamp[i] = h<0?0:h>1?1:h; }
  }
  applyHeights();

  // =====================================================================
  //  Per-frame: displaced positions along the skinned normal (first `draw` samples)
  // =====================================================================
  function buildPoints(draw) {
    const span = CFG.dispMax - CFG.dispMin, dbase = CFG.baseOff + CFG.dispMin;
    for (let i=0;i<draw;i++){
      const f=sampF[i], i0=F[3*f]*3, i1=F[3*f+1]*3, i2=F[3*f+2]*3, b0=sampB[3*i], b1=sampB[3*i+1], b2=sampB[3*i+2];
      const px=b0*Vp[i0]+b1*Vp[i1]+b2*Vp[i2], py=b0*Vp[i0+1]+b1*Vp[i1+1]+b2*Vp[i2+1], pz=b0*Vp[i0+2]+b1*Vp[i1+2]+b2*Vp[i2+2];
      let nx,ny,nz;
      if (Np){ nx=b0*Np[i0]+b1*Np[i1]+b2*Np[i2]; ny=b0*Np[i0+1]+b1*Np[i1+1]+b2*Np[i2+1]; nz=b0*Np[i0+2]+b1*Np[i1+2]+b2*Np[i2+2]; }
      else { const ax=Vp[i1]-Vp[i0],ay=Vp[i1+1]-Vp[i0+1],az=Vp[i1+2]-Vp[i0+2],bx=Vp[i2]-Vp[i0],by=Vp[i2+1]-Vp[i0+1],bz=Vp[i2+2]-Vp[i0+2]; nx=ay*bz-az*by; ny=az*bx-ax*bz; nz=ax*by-ay*bx; }
      const il=1/(Math.hypot(nx,ny,nz)||1); nx*=il; ny*=il; nz*=il;
      const dsp=(dbase+psamp[i]*span)*(1-sampProt[i]*CFG.protAmount)*(1-sampLimb[i]*(1-CFG.limbScale));
      ppos[3*i]=px+nx*dsp; ppos[3*i+1]=py+ny*dsp; ppos[3*i+2]=pz+nz*dsp;
    }
  }

  // =====================================================================
  //  THREE objects
  // =====================================================================
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
  geo.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ size: CFG.pointSize, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: CFG.opacity });
  const points = new THREE.Points(geo, mat); points.frustumCulled = false;
  const object = new THREE.Group(); object.add(points);

  // initial rest skin so height can be measured and the first frame is correct
  let drawCount = Math.min(40000, M_);
  buildPose(); computeM(Rof); skinVerts(); buildPoints(drawCount);
  geo.setDrawRange(0, drawCount);
  geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
  geo.computeBoundingSphere();

  // height = skinned bbox Y extent (metres)
  let ymin=1e9, ymax=-1e9; for (let v=0; v<nV; v++){ const y=Vp[3*v+1]; if(y<ymin)ymin=y; if(y>ymax)ymax=y; }
  const height = ymax - ymin;

  // =====================================================================
  //  Public API
  // =====================================================================
  let lastDraw = drawCount, frozen = false;
  function targetDraw(info) {
    const inWin = info.inWindow !== false;             // default visible when no info
    const dp = info.devicePixels || info.pixels || 600;
    if (!inWin && info.state === 'away') return CFG.MINN;   // behind a page: cheapest
    let k = Math.round(CFG.pointsPerDevPx2 * dp * dp);
    if (!inWin) k = Math.min(k, 8000);
    return clamp(k, CFG.MINN, M_);
  }

  // =====================================================================
  //  Tuning: what a reading surface may put on a slider
  // =====================================================================
  // The displacement is the Bubbles image read as a height field: each point
  // is pushed out along its own skinned normal by an amount the image's
  // luminance picks, between `black in` and `white out`. The rest decides how
  // hard that reading is pushed (contrast, which end stands out) and where it
  // is held back (the face, the limbs). `params` describes each one well enough
  // for a host to draw a control without knowing anything about this module;
  // `set` is the only way in, and clamps.
  const PARAMS = [
    { key: 'dispMax',   label: 'white out',  group: 'topography', min: -0.02, max: 0.16, step: 0.002, unit: 'mm', scale: 1000, digits: 0 },
    { key: 'dispMin',   label: 'black in',   group: 'topography', min: -0.08, max: 0.04, step: 0.002, unit: 'mm', scale: 1000, digits: 0 },
    { key: 'baseOff',   label: 'lift',       group: 'topography', min: -0.03, max: 0.06, step: 0.002, unit: 'mm', scale: 1000, digits: 0 },
    { key: 'hContrast', label: 'contrast',   group: 'topography', min: 0,     max: 3,    step: 0.05,  unit: '×',  scale: 1, digits: 2 },
    { key: 'invert',    label: 'swap black and white', group: 'topography', kind: 'toggle' },
    { key: 'protAmount', label: 'spare the face', group: 'topography', min: 0, max: 1,   step: 0.02,  unit: '%',  scale: 100, digits: 0 },
    { key: 'limbScale', label: 'limbs',      group: 'topography', min: 0,     max: 1,    step: 0.02,  unit: '%',  scale: 100, digits: 0 },
    { key: 'pointSize', label: 'point size', group: 'texture',    min: 0.001, max: 0.02, step: 0.0005, unit: 'mm', scale: 1000, digits: 1 },
    { key: 'opacity',   label: 'opacity',    group: 'texture',    min: 0.15,  max: 1,    step: 0.01,  unit: '%',  scale: 100, digits: 0 },
    { key: 'pointsPerDevPx2', label: 'density', group: 'texture', min: 0.05,  max: 1.5,  step: 0.05,  unit: '×',  scale: 1, digits: 2 },
  ]
  const DEFAULTS = Object.fromEntries(PARAMS.map(p => [p.key, CFG[p.key]]))

  /** Set one tuning value. Returns what was actually taken. */
  function set(key, value) {
    const p = PARAMS.find(q => q.key === key)
    if (!p) return undefined
    if (p.kind === 'toggle') CFG[key] = !!value
    else {
      const v = +value
      if (!Number.isFinite(v)) return CFG[key]
      CFG[key] = clamp(v, p.min, p.max)
    }
    if (key === 'hContrast' || key === 'invert') applyHeights()
    if (key === 'pointSize') mat.size = CFG[key]
    if (key === 'opacity') mat.opacity = CFG[key]
    frozen = true                   // rebuild the points next frame, even at rest
    return CFG[key]
  }

  return {
    object,
    height,
    params: PARAMS.map(p => ({ ...p, get value() { return CFG[p.key] }, reset: DEFAULTS[p.key] })),
    get: key => CFG[key],
    set,
    reset() { for (const p of PARAMS) set(p.key, DEFAULTS[p.key]) },
    update(dt, info) {
      info = info || {};
      if (!Number.isFinite(dt)) dt = 1/60; if (dt > 0.1) dt = 0.1;
      // cheapest case: away and behind a page -> freeze pose, draw a sparse whisper
      if (info.inWindow === false && info.state === 'away') {
        if (lastDraw !== CFG.MINN) { geo.setDrawRange(0, CFG.MINN); lastDraw = CFG.MINN; }
        frozen = true; return;
      }
      clock += dt; if (mode === 'rest') headT += dt * CFG.headSpeed;
      const draw = targetDraw(info);
      // re-pose + re-skin (only when animating or just un-frozen or LOD grew)
      const animate = !quiet;
      if (animate || frozen || draw > lastDraw) {
        buildPose(); computeM(Rof); skinVerts(); buildPoints(draw);
        geo.attributes.position.needsUpdate = true;
      }
      if (draw !== lastDraw) { geo.setDrawRange(0, draw); lastDraw = draw; }
      frozen = false;
    },
    rest() { mode = 'rest'; },
    go()   { mode = 'go'; },
    dispose() { geo.dispose(); mat.dispose(); },
  };
}

// --- helpers -----------------------------------------------------------
async function loadPayload(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('floating-skin: cannot load ' + url + ' (' + res.status + ')');
  const u8 = new Uint8Array(await res.arrayBuffer());
  let text;
  if (u8[0] === 0x1f && u8[1] === 0x8b) {              // raw gzip -> inflate in-browser
    const ab = await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    text = new TextDecoder().decode(ab);
  } else {                                             // server already decoded Content-Encoding
    text = new TextDecoder().decode(u8);
  }
  return JSON.parse(text);
}

function loadImageData(uri) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const cx = c.getContext('2d', { willReadFrequently: true }); cx.drawImage(im, 0, 0);
      resolve({ data: cx.getImageData(0, 0, c.width, c.height).data, W: c.width, H: c.height });
    };
    im.onerror = () => resolve(null);
    im.src = uri;
  });
}
