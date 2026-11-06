// Screens: the displays this computer has, and a window placed on one of them.
//
// The Window Management API (Chrome and Edge 100+; Firefox and Safari have not shipped it) lists the
// screens with their positions in the desktop's coordinate space, behind a permission the browser asks
// for on the first call, which must come from a click. Without it a page knows only its own screen
// (window.screen), plus window.screen.isExtended, which says whether there are more without asking.
//
// A window is put on a screen with window.open(): its left/top features are desktop coordinates, so
// a screen's position puts the window there. Chrome 123+ also honours 'fullscreen' in the features once
// the permission is granted (a "fullscreen popup"); other browsers ignore the word and the opened page
// goes fullscreen itself on its first click (fullscreenHere). Both calls must happen inside a click,
// or the popup is blocked and open() returns null.

export const hasMoreScreens = () => window.screen.isExtended === true

export async function listScreens() {
  if ('getScreenDetails' in window) {
    try {
      const details = await window.getScreenDetails()
      return details.screens.map(s => describe(s, s === details.currentScreen))
    } catch (err) { console.warn('screens: ' + err.message) }   // refused: fall through to the one screen we know
  }
  return [describe(window.screen, true)]
}

function describe(s, current) {
  return {
    label: s.label || (current ? 'this screen' : 'screen'),
    left: s.availLeft ?? s.left ?? 0, top: s.availTop ?? s.top ?? 0,
    width: s.availWidth ?? s.width, height: s.availHeight ?? s.height,
    isPrimary: s.isPrimary ?? true, isInternal: s.isInternal ?? false, current, raw: s,
  }
}

// Open url as its own window on the given screen; null when the browser blocked it.
export function openOnScreen(url, screen, { fullscreen = true, name = '_blank' } = {}) {
  const features = ['popup=1', `left=${screen.left}`, `top=${screen.top}`, `width=${screen.width}`, `height=${screen.height}`]
  if (fullscreen) features.push('fullscreen')
  return window.open(url, name, features.join(','))
}

// Fullscreen this page (on a given screen when the API allows), or leave fullscreen if it is already.
export async function fullscreenHere(element = document.documentElement, screen = null) {
  if (document.fullscreenElement) return document.exitFullscreen()
  if (!element.requestFullscreen) throw new Error('this browser has no fullscreen API')
  return element.requestFullscreen(screen?.raw && 'getScreenDetails' in window ? { screen: screen.raw } : undefined)
}

// Call fn when screens are plugged in or unplugged (needs the permission; silent otherwise).
export async function onScreensChange(fn) {
  if (!('getScreenDetails' in window)) return
  try { (await window.getScreenDetails()).addEventListener('screenschange', fn) } catch {}
}
