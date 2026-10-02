# Anatomica

An interactive 3D anatomy explorer built with React, Vite, Three.js, React Three Fiber, Drei, GSAP, and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev
```

For a production build, run `npm run build`, then `npm run preview`.

## Explore

- Drag to orbit, scroll to zoom, and click an anatomical structure to isolate it.
- Use the anatomy index or Cmd/Ctrl+K search to focus a structure without clicking the model.
- Switch between skeleton, muscle visualization, and combined views; flip the view, auto-rotate, or explode the model using the bottom controls.
- On devices without WebGL, the anatomy index and descriptions remain usable.

The detailed skeleton is loaded from the [Open 3D Model / AnatomyTOOL collection](https://anatomytool.org/open3dmodel-create), licensed CC BY-SA. The model is served from the [anatomy-sculpt-3d repository](https://github.com/innalhy/anatomy-sculpt-3d). When the remote model cannot load, a locally generated, individually selectable skeletal visualization is shown. The muscle layer is an illustrative procedural overlay, not a clinically accurate model. An internet connection is required for the detailed model and web fonts.