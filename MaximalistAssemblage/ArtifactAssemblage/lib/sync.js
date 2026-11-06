// Sync: several windows of one page kept in step, with no server. A BroadcastChannel reaches every
// window and tab of the same origin on this machine. A message is { type, data, from, at }: `from`
// is the sender's id (a window ignores its own messages), `at` its Date.now(), which is the same clock
// in every window on one machine, so a follower can carry a motion forward from the moment it was
// sent instead of waiting for the next message.

export function createBus(name) {
  const channel = new BroadcastChannel(name)
  const id = Math.random().toString(36).slice(2, 8)
  const handlers = new Map()
  channel.onmessage = e => {
    const m = e.data
    if (!m || m.from === id) return
    handlers.get(m.type)?.forEach(fn => fn(m.data, m))
  }
  return {
    id,
    send(type, data = null) { channel.postMessage({ type, data, from: id, at: Date.now() }) },
    on(type, fn) {
      if (!handlers.has(type)) handlers.set(type, new Set())
      handlers.get(type).add(fn)
      return () => handlers.get(type).delete(fn)
    },
    close() { channel.close() },
  }
}

// Who else is on the bus. A window says hello (with `me`, whatever it wants known about itself) when
// it starts, everyone already there answers with `here`, and a window says bye as it closes; onChange
// gets the live list [{ id, ...said }] after every change.
export function trackPeers(bus, me, onChange) {
  const peers = new Map()
  const changed = () => onChange([...peers.entries()].map(([id, said]) => ({ id, ...said })))
  bus.on('hello', (said, m) => { peers.set(m.from, said); bus.send('here', me); changed() })
  bus.on('here', (said, m) => { peers.set(m.from, said); changed() })
  bus.on('bye', (_, m) => { peers.delete(m.from); changed() })
  bus.send('hello', me)
  window.addEventListener('pagehide', () => bus.send('bye'))
  return { peers }
}

// The leading side: send getState() `hz` times a second, and at once when someone new says hello.
// Returns a function that stops it.
export function publishState(bus, getState, hz = 20) {
  const tick = () => bus.send('state', getState())
  const timer = setInterval(tick, 1000 / hz)
  const off = bus.on('hello', tick)
  return () => { clearInterval(timer); off() }
}

// The following side: onState(data, at) for every state received, `at` being when it was sent.
export function followState(bus, onState) {
  return bus.on('state', (data, m) => onState(data, m.at))
}
