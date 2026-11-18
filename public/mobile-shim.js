/* LYRICX mobile shim.
 * Loaded on every platform, but only activates inside the Capacitor Android WebView.
 * The renderer already guards most Electron calls; this covers the few unguarded ones so a
 * desktop-only API can never take the phone app down. */
(function () {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
    return;
  }

  if (window.electron) {
    return;
  }

  var syncValues = {
    platform: 'android',
    hifi: false,
    mods: [],
    sceneAcoustics: {},
    webUtils: {},
    isWindowMaximized: function () { return Promise.resolve(false); },
    isWindowFullscreen: function () { return Promise.resolve(false); },
  };

  function noop() {
    return Promise.resolve(undefined);
  }

  window.electron = new Proxy({}, {
    get: function (_target, prop) {
      if (typeof prop !== 'string') return undefined;
      if (prop in syncValues) return syncValues[prop];
      if (prop.indexOf('on') === 0) return function () { return function () {}; };
      return noop;
    },
    has: function () { return true; },
  });
})();
