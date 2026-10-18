# Spruce Inlay

By **SPRUCE KYBIT** · package `com.sprucekybit.spruceinlay` · Expo owner `894-895`.

A sliding-block puzzle for Android, set in an old puzzle box: slide the carved wooden pieces aside and free the jewel through the gap in the frame.

**How it plays.**
- Drag a piece to slide it. It moves as far as there is room, settles into place, and knocks against whatever stops it.
- One move is one piece slid any distance in a straight line. Bring the red jewel to the gap in the frame and it slips out.
- **Grain pieces** (in the last chapter) carry a brass arrow. They are cut along the grain and slide only the way it points.
- Stars: three for par moves, two for up to a quarter more. A hint shows the next move but caps the box at two stars. Undo and start again are always free.

**Content.**
- 24 boxes in three chapters:
  - **Walnut:** small boxes on green baize.
  - **Rosewood:** deeper trays on navy velvet.
  - **Ebony:** grain pieces on burgundy.
- Every box is generated and checked:
  - The generator searches every arrangement the pieces can reach and measures each one's distance from freedom.
  - It starts the box far from the gap, so par is the true fewest moves (up to 56).
  - Each box is mostly dominoes, with only a few small squares.

**Look and sound.**
- Visuals: a mitred frame with brass stringing, and pieces in maple, cherry, olive, satinwood and rosewood. Each piece has figured grain, bevelled edges and a marquetry motif (a flower, a compass rose or a vine). The jewel is red lacquer bound in gold, with a ruby at its heart.
- Sound: wood rubbing on wood as you drag, a hollow knock when a piece settles, and a marimba run when the jewel slips free. Behind it all are rain on the window and a slow, warm piano.

## Structure

| Path | What it is |
| --- | --- |
| `web/src/game/sim.ts` | Sliding, grain, the breadth-first solver |
| `web/src/game/boxes.json` | The 24 generated boxes, with par |
| `web/tools/gen.ts` | The box generator |
| `web/src/game/scene.ts` | The Phaser box: dragging, snapping, hints |
| `web/brand/` | Icon, splash and feature graphic |
| `Delivery/` | Play Store icon, feature graphic and screenshots |
| `src/native/` | Expo WebView shell |

```bash
npm install && npm run web:install
npm run web:test     # 31 tests
npm run build:game && npm run validate:assets && npm run android
```

## Release builds

The Android release is configured for Google Play: target and compile SDK 36, R8 minification and resource shrinking, a non-debuggable release build, no Internet permission, and the game served offline from the app's own assets. Builds run on EAS; `eas.json` has two profiles:

```bash
npm install -g eas-cli && eas login
eas init                     # once: links this folder to your Expo project
npm run eas:apk              # preview profile: a signed APK for testing on devices
npm run eas:aab              # production profile: an AAB for Google Play (versionCode auto-increments)
```
