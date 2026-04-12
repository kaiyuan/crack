# EZCut
![EZCut Icon](https://github.com/Kaiyuan/ezcut/blob/main/src-tauri/icons/icon.png)

`EZCut` is a lightweight desktop image editing tool for Windows 10+ (64-bit) and macOS 10.15+ .

![EZCut Screenshot](https://kaiyuan.github.io/ezcut/assets/EZCut-ui.avif)

Repository:

- [github.com/Kaiyuan/ezcut](https://github.com/Kaiyuan/ezcut)

## Overview

This project is built for fast startup and a small app size.

- Desktop runtime: Tauri
- Frontend: plain HTML, CSS, and JavaScript
- Image processing: Rust with the `image` crate

The interface uses a compact macOS-inspired layout:

- Left side: image preview and image list
- Right side: collapsible settings panel

## Features

- Batch import for multiple images
- Drag and drop support
- Real-time preview
- Resize
- Crop
- Text watermark
- Overlay image layer
- Custom output directory
- Optional clear-after-export behavior
- Custom filename template
- Regex-based rename rules
- Portable Windows build without installer

## Preview Interaction

- When crop is enabled, the preview shows a crop box
- The crop box can be moved and resized from the preview
- When text watermark is enabled, the watermark can be dragged in the preview
- The watermark size can be adjusted from the preview handle

## Run In Development

```bash
cargo tauri dev
```

## Build

```bash
cargo tauri build
```

## GitHub Releases

Pushing a tag like `v0.1.0` will trigger GitHub Actions to build and upload:

- `EZCut-v0.1.0-windows-x64.zip`
- `EZCut-v0.1.0-macos-x64.zip`
- `EZCut-v0.1.0-macos-arm64.zip`

## Main Files

- `src/index.html`
- `src/styles.css`
- `src/app.js`
- `src-tauri/src/main.rs`
- `src-tauri/tauri.conf.json`
- `docs/index.html`

## GitHub Pages

Enable GitHub Pages and set the publishing source to the `docs` folder on the `main` branch.

