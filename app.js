/**
 * SkiaBoard — Canvas2D-based professional drawing board
 * Implements Figma-like features using HTML5 Canvas2D
 * (No WASM dependency required — pure browser compatible)
 */

class SkiaBoard {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.mainCanvas = document.getElementById('main-canvas');
    this.overlayCanvas = document.getElementById('overlay-canvas');
    this.interactionCanvas = document.getElementById('interaction-canvas');

    this.ctx = this.mainCanvas.getContext('2d');
    this.overlayCtx = this.overlayCanvas.getContext('2d');
    this.iCtx = this.interactionCanvas.getContext('2d');

    // State
    this.tool = 'select';
    this.objects = [];
    this.selectedIds = new Set();
    this.undoStack = [];
    this.redoStack = [];

    this.fillColor = '#7c6fcd';
    this.strokeColor = '#4ecdc4';
    this.fillEnabled = true;
    this.strokeEnabled = true;
    this.strokeWidth = 2;
    this.opacity = 1;
    this.brushSize = 8;
    this.brushType = 'round';

    // Camera
    this.viewX = 0;
    this.viewY = 0;
    this.scale = 1;

    // Interaction state
    this.isDrawing = false;
    this.isDragging = false;
    this.isResizing = false;
    this.isPanning = false;
    this.dragStart = null;
    this.dragOffset = [];
    this.resizeHandle = null;
    this.currentPath = null;
    this.previewShape = null;
    this.textInputActive = false;
    this.spaceDown = false;
    this.panStart = null;
    this.panViewStart = null;

    this.idCounter = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    const ic = this.interactionCanvas;
    ic.addEventListener('mousedown', e => this.onMouseDown(e));
    ic.addEventListener('mousemove', e => this.onMouseMove(e));
    ic.addEventListener('mouseup', e => this.onMouseUp(e));
    ic.addEventListener('dblclick', e => this.onDblClick(e));
    ic.addEventListener('wheel', e => this.onWheel(e), { passive: false });

    document.addEventListener('keydown', e => this.onKeyDown(e));
    document.addEventListener('keyup', e => this.onKeyUp(e));

    // Touch support
    ic.addEventListener('touchstart', e => this.onTouchStart(e), { passive: false });
    ic.addEventListener('touchmove', e => this.onTouchMove(e), { passive: false });
    ic.addEventListener('touchend', e => this.onTouchEnd(e));

    this.render();
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const dpr = window.devicePixelRatio || 1;

    [this.mainCanvas, this.overlayCanvas, this.interactionCanvas].forEach(c => {
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      c.getContext('2d').scale(dpr, dpr);
    });

    this.canvasW = w;
    this.canvasH = h;
    this.render();
  }

  /* ── ID & SERIALIZATION ── */
  genId() { return ++this.idCounter; }

  /* ── COORDINATE TRANSFORMS ── */
  screenToWorld(sx, sy) {
    return {
      x: (sx - this.viewX) / this.scale,
      y: (sy - this.viewY) / this.scale
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: wx * this.scale + this.viewX,
      y: wy * this.scale + this.viewY
    };
  }

  getMousePos(e) {
    const rect = this.interactionCanvas.getBoundingClientRect();
    return {
      sx: e.clientX - rect.left,
      sy: e.clientY - rect.top,
      ...this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top)
    };
  }

  /* ── TOOL MANAGEMENT ── */
  setTool(t) {
    this.tool = t;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-tool="${t}"]`);
    if (btn) btn.classList.add('active');
    document.getElementById('stat-tool').textContent = `工具: ${this.toolName(t)}`;

    const brushSettings = document.getElementById('brush-settings');
    brushSettings.style.opacity = (t === 'brush' || t === 'pen' || t === 'eraser') ? '1' : '0.5';

    const cursorMap = {
      select: 'default', pen: 'crosshair', brush: 'crosshair',
      eraser: 'cell', rect: 'crosshair', circle: 'crosshair',
      line: 'crosshair', triangle: 'crosshair', text: 'text'
    };
    this.interactionCanvas.style.cursor = cursorMap[t] || 'crosshair';
  }

  toolName(t) {
    const m = { select: '选择', pen: '钢笔', brush: '画笔', eraser: '橡皮擦', rect: '矩形', circle: '圆形', line: '直线', triangle: '三角形', text: '文字' };
    return m[t] || t;
  }

  /* ── COLOR / STYLE SETTERS ── */
  setFillColor(v) {
    this.fillColor = v;
    document.getElementById('fill-swatch').style.background = v;
    this.updateSelectedStyle();
  }
  setStrokeColor(v) {
    this.strokeColor = v;
    document.getElementById('stroke-swatch').style.background = v;
    this.updateSelectedStyle();
  }
  setFillEnabled(v) { this.fillEnabled = v; this.updateSelectedStyle(); }
  setStrokeEnabled(v) { this.strokeEnabled = v; this.updateSelectedStyle(); }
  setStrokeWidth(v) {
    this.strokeWidth = parseFloat(v);
    this.updateSelectedStyle();
  }
  setOpacity(v) {
    this.opacity = v / 100;
    document.getElementById('opacity-val').textContent = v + '%';
    this.updateSelectedStyle();
  }
  setBrushSize(v) {
    this.brushSize = parseInt(v);
    document.getElementById('brush-size-val').textContent = v + 'px';
  }
  setBrushType(v) { this.brushType = v; }

  updateSelectedStyle() {
    if (this.selectedIds.size === 0) return;
    this.saveUndo();
    this.selectedIds.forEach(id => {
      const obj = this.objects.find(o => o.id === id);
      if (!obj) return;
      obj.fillColor = this.fillColor;
      obj.strokeColor = this.strokeColor;
      obj.fillEnabled = this.fillEnabled;
      obj.strokeEnabled = this.strokeEnabled;
      obj.strokeWidth = this.strokeWidth;
      obj.opacity = this.opacity;
    });
    this.render();
  }

  /* ── OBJECT CREATION HELPERS ── */
  makeShape(type, x, y, w, h) {
    return {
      id: this.genId(),
      type,
      x, y, w, h,
      rotation: 0,
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      fillEnabled: this.fillEnabled,
      strokeEnabled: this.strokeEnabled,
      strokeWidth: this.strokeWidth,
      opacity: this.opacity,
      name: `${type} ${this.idCounter}`
    };
  }

  makePath(points) {
    return {
      id: this.genId(),
      type: 'path',
      points: [...points],
      fillColor: this.fillColor,
      strokeColor: this.strokeColor,
      fillEnabled: false,
      strokeEnabled: true,
      strokeWidth: this.strokeWidth,
      brushSize: this.brushSize,
      brushType: this.brushType,
      opacity: this.opacity,
      name: `路径 ${this.idCounter}`
    };
  }

  /* ── DRAWING ON CANVAS ── */
  applyStyle(ctx, obj) {
    ctx.globalAlpha = obj.opacity ?? 1;
    if (obj.fillEnabled && obj.fillColor) ctx.fillStyle = obj.fillColor;
    if (obj.strokeEnabled && obj.strokeColor) {
      ctx.strokeStyle = obj.strokeColor;
      ctx.lineWidth = obj.strokeWidth ?? 1;
    }
  }

  drawObject(ctx, obj, forHitTest = false) {
    ctx.save();
    this.applyStyle(ctx, obj);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (obj.rotation) {
      const cx = obj.x + (obj.w || 0) / 2;
      const cy = obj.y + (obj.h || 0) / 2;
      ctx.translate(cx, cy);
      ctx.rotate(obj.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }

    switch (obj.type) {
      case 'rect':
        ctx.beginPath();
        ctx.rect(obj.x, obj.y, obj.w, obj.h);
        if (obj.fillEnabled) ctx.fill();
        if (obj.strokeEnabled) ctx.stroke();
        break;

      case 'circle': {
        const rx = Math.abs(obj.w) / 2, ry = Math.abs(obj.h) / 2;
        const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (obj.fillEnabled) ctx.fill();
        if (obj.strokeEnabled) ctx.stroke();
        break;
      }

      case 'triangle': {
        const tx = obj.x, ty = obj.y, tw = obj.w, th = obj.h;
        ctx.beginPath();
        ctx.moveTo(tx + tw / 2, ty);
        ctx.lineTo(tx + tw, ty + th);
        ctx.lineTo(tx, ty + th);
        ctx.closePath();
        if (obj.fillEnabled) ctx.fill();
        if (obj.strokeEnabled) ctx.stroke();
        break;
      }

      case 'line':
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x + obj.w, obj.y + obj.h);
        ctx.stroke();
        break;

      case 'path':
        this.drawPath(ctx, obj);
        break;

      case 'text':
        ctx.font = `${obj.fontSize || 18}px Sora, sans-serif`;
        ctx.fillStyle = obj.fillColor || '#e8e8f0';
        ctx.globalAlpha = obj.opacity ?? 1;
        ctx.fillText(obj.text || '', obj.x, obj.y);
        // compute bounding box
        const metrics = ctx.measureText(obj.text || '');
        obj.w = metrics.width;
        obj.h = (obj.fontSize || 18) * 1.4;
        break;
    }

    ctx.restore();
  }

  drawPath(ctx, obj) {
    const pts = obj.points;
    if (!pts || pts.length < 2) return;

    ctx.save();
    ctx.globalAlpha = obj.opacity ?? 1;
    ctx.strokeStyle = obj.strokeColor || '#fff';
    ctx.fillStyle = obj.fillColor || 'transparent';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (obj.brushType === 'spray') {
      // Spray effect
      pts.forEach(pt => {
        const r = obj.brushSize || 8;
        for (let i = 0; i < 15; i++) {
          const dx = (Math.random() - 0.5) * r * 2;
          const dy = (Math.random() - 0.5) * r * 2;
          ctx.beginPath();
          ctx.arc(pt.x + dx, pt.y + dy, 0.8, 0, Math.PI * 2);
          ctx.fillStyle = obj.strokeColor || '#fff';
          ctx.globalAlpha = (obj.opacity ?? 1) * 0.5;
          ctx.fill();
        }
      });
    } else if (obj.brushType === 'marker') {
      ctx.lineWidth = obj.brushSize || 8;
      ctx.globalAlpha = (obj.opacity ?? 1) * 0.6;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    } else if (obj.brushType === 'flat') {
      ctx.lineWidth = obj.brushSize || 8;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.stroke();
    } else {
      // Smooth round brush
      ctx.lineWidth = obj.brushSize || 4;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2;
        const my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      }
      if (pts.length > 1) ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ── MAIN RENDER ── */
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);

    ctx.save();
    ctx.translate(this.viewX, this.viewY);
    ctx.scale(this.scale, this.scale);

    // Draw all objects
    for (const obj of this.objects) {
      this.drawObject(ctx, obj);
    }

    ctx.restore();

    // Overlay: selection boxes, handles
    this.renderOverlay();
    this.updateLayersList();
    this.updateStatusBar();
  }

  renderOverlay() {
    const ctx = this.overlayCtx;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);

    if (this.selectedIds.size === 0) return;

    const selected = this.objects.filter(o => this.selectedIds.has(o.id));

    selected.forEach(obj => {
      const bounds = this.getObjectBounds(obj);
      if (!bounds) return;

      const { x, y, w, h } = bounds;
      const s1 = this.worldToScreen(x, y);
      const s2 = this.worldToScreen(x + w, y + h);
      const sw = s2.x - s1.x, sh = s2.y - s1.y;

      ctx.save();
      ctx.strokeStyle = '#7c6fcd';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(s1.x - 2, s1.y - 2, sw + 4, sh + 4);
      ctx.setLineDash([]);
      ctx.restore();

      // Resize handles
      const corners = [
        [x, y], [x + w, y], [x, y + h], [x + w, y + h],
        [x + w / 2, y], [x + w / 2, y + h],
        [x, y + h / 2], [x + w, y + h / 2]
      ];
      corners.forEach(([cx, cy]) => {
        const sp = this.worldToScreen(cx, cy);
        ctx.beginPath();
        ctx.rect(sp.x - 4, sp.y - 4, 8, 8);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.strokeStyle = '#7c6fcd';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    });

    // Multi-selection bounding box
    if (this.selectedIds.size > 1) {
      const allBounds = selected.map(o => this.getObjectBounds(o)).filter(Boolean);
      if (allBounds.length) {
        const minX = Math.min(...allBounds.map(b => b.x));
        const minY = Math.min(...allBounds.map(b => b.y));
        const maxX = Math.max(...allBounds.map(b => b.x + b.w));
        const maxY = Math.max(...allBounds.map(b => b.y + b.h));
        const s1 = this.worldToScreen(minX, minY);
        const s2 = this.worldToScreen(maxX, maxY);
        ctx.save();
        ctx.strokeStyle = '#4ecdc4';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(s1.x - 4, s1.y - 4, s2.x - s1.x + 8, s2.y - s1.y + 8);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    // Preview shape while drawing
    if (this.previewShape) {
      ctx.save();
      ctx.translate(this.viewX, this.viewY);
      ctx.scale(this.scale, this.scale);
      ctx.globalAlpha = 0.7;
      this.drawObject(ctx, this.previewShape);
      ctx.restore();
    }

    // Selection rubber band
    if (this.selectBand) {
      const { x1, y1, x2, y2 } = this.selectBand;
      ctx.save();
      ctx.strokeStyle = '#7c6fcd';
      ctx.fillStyle = 'rgba(124,111,205,0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 3]);
      const rx = Math.min(x1, x2), ry = Math.min(y1, y2);
      const rw = Math.abs(x2 - x1), rh = Math.abs(y2 - y1);
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  getObjectBounds(obj) {
    if (obj.type === 'path') {
      if (!obj.points || obj.points.length === 0) return null;
      const xs = obj.points.map(p => p.x);
      const ys = obj.points.map(p => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x || 1, h: Math.max(...ys) - y || 1 };
    }
    if (obj.type === 'text') {
      return { x: obj.x, y: obj.y - (obj.fontSize || 18), w: obj.w || 50, h: obj.h || 24 };
    }
    if (obj.type === 'line') {
      const x = Math.min(obj.x, obj.x + obj.w);
      const y = Math.min(obj.y, obj.y + obj.h);
      return { x, y, w: Math.abs(obj.w) || 1, h: Math.abs(obj.h) || 1 };
    }
    return { x: obj.x, y: obj.y, w: obj.w || 1, h: obj.h || 1 };
  }

  /* ── HIT TESTING ── */
  hitTest(x, y, obj) {
    const bounds = this.getObjectBounds(obj);
    if (!bounds) return false;
    const margin = 5 / this.scale;

    if (obj.type === 'path') {
      const pts = obj.points;
      if (!pts) return false;
      for (let i = 1; i < pts.length; i++) {
        if (this.pointToSegDist(x, y, pts[i - 1], pts[i]) < (obj.brushSize || 4) / 2 + margin)
          return true;
      }
      return false;
    }

    if (obj.type === 'circle') {
      const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
      const rx = Math.abs(obj.w) / 2, ry = Math.abs(obj.h) / 2;
      if (rx === 0 || ry === 0) return false;
      const dx = (x - cx) / rx, dy = (y - cy) / ry;
      return dx * dx + dy * dy <= 1.05;
    }

    return x >= bounds.x - margin && x <= bounds.x + bounds.w + margin &&
      y >= bounds.y - margin && y <= bounds.y + bounds.h + margin;
  }

  pointToSegDist(px, py, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - a.x, py - a.y);
    let t = ((px - a.x) * dx + (py - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
  }

  getResizeHandle(sx, sy, obj) {
    const bounds = this.getObjectBounds(obj);
    if (!bounds) return null;
    const { x, y, w, h } = bounds;
    const corners = [
      { id: 'tl', wx: x, wy: y },
      { id: 'tr', wx: x + w, wy: y },
      { id: 'bl', wx: x, wy: y + h },
      { id: 'br', wx: x + w, wy: y + h },
      { id: 'tm', wx: x + w / 2, wy: y },
      { id: 'bm', wx: x + w / 2, wy: y + h },
      { id: 'ml', wx: x, wy: y + h / 2 },
      { id: 'mr', wx: x + w, wy: y + h / 2 },
    ];
    for (const c of corners) {
      const sp = this.worldToScreen(c.wx, c.wy);
      if (Math.abs(sp.x - sx) < 6 && Math.abs(sp.y - sy) < 6) return c;
    }
    return null;
  }

  /* ── MOUSE EVENTS ── */
  onMouseDown(e) {
    const pos = this.getMousePos(e);
    document.getElementById('stat-pos').textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;

    if (e.button === 1 || (e.button === 0 && this.spaceDown)) {
      this.isPanning = true;
      this.panStart = { x: e.clientX, y: e.clientY };
      this.panViewStart = { x: this.viewX, y: this.viewY };
      this.interactionCanvas.style.cursor = 'grabbing';
      return;
    }

    if (this.tool === 'select') {
      this.handleSelectDown(e, pos);
    } else if (this.tool === 'brush' || this.tool === 'pen') {
      this.startBrushStroke(pos);
    } else if (this.tool === 'eraser') {
      this.startErase(pos);
    } else if (this.tool === 'text') {
      this.startTextInput(pos, e);
    } else {
      this.startShapeDraw(pos);
    }
  }

  onMouseMove(e) {
    const pos = this.getMousePos(e);
    document.getElementById('stat-pos').textContent = `X: ${Math.round(pos.x)}, Y: ${Math.round(pos.y)}`;

    if (this.isPanning) {
      this.viewX = this.panViewStart.x + (e.clientX - this.panStart.x);
      this.viewY = this.panViewStart.y + (e.clientY - this.panStart.y);
      this.render();
      return;
    }

    if (this.tool === 'select') {
      this.handleSelectMove(e, pos);
    } else if ((this.tool === 'brush' || this.tool === 'pen') && this.isDrawing) {
      this.continueBrushStroke(pos);
    } else if (this.tool === 'eraser' && this.isDrawing) {
      this.continueErase(pos);
    } else if (this.isDrawing) {
      this.updateShapePreview(pos);
    }
  }

  onMouseUp(e) {
    if (this.isPanning) {
      this.isPanning = false;
      this.interactionCanvas.style.cursor = this.spaceDown ? 'grab' : (this.tool === 'select' ? 'default' : 'crosshair');
      return;
    }

    const pos = this.getMousePos(e);

    if (this.tool === 'select') {
      this.handleSelectUp(e, pos);
    } else if ((this.tool === 'brush' || this.tool === 'pen') && this.isDrawing) {
      this.endBrushStroke();
    } else if (this.tool === 'eraser' && this.isDrawing) {
      this.endErase();
    } else if (this.isDrawing) {
      this.endShapeDraw(pos);
    }

    this.isDrawing = false;
    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = null;
    this.selectBand = null;
    this.previewShape = null;
    this.render();
  }

  onDblClick(e) {
    if (this.tool === 'select') {
      const pos = this.getMousePos(e);
      // Double click to enter text editing or rename
      for (let i = this.objects.length - 1; i >= 0; i--) {
        if (this.hitTest(pos.x, pos.y, this.objects[i])) {
          if (this.objects[i].type === 'text') {
            this.editText(this.objects[i], e);
          }
          return;
        }
      }
    }
  }

  onWheel(e) {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const rect = this.interactionCanvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      this.viewX = mx - (mx - this.viewX) * delta;
      this.viewY = my - (my - this.viewY) * delta;
      this.scale *= delta;
      this.scale = Math.max(0.05, Math.min(50, this.scale));
      document.getElementById('zoom-label').textContent = Math.round(this.scale * 100) + '%';
      this.render();
    } else {
      this.viewX -= e.deltaX;
      this.viewY -= e.deltaY;
      this.render();
    }
  }

  /* ── SELECT TOOL LOGIC ── */
  handleSelectDown(e, pos) {
    // Check resize handles first
    if (this.selectedIds.size === 1) {
      const obj = this.objects.find(o => o.id === [...this.selectedIds][0]);
      if (obj) {
        const handle = this.getResizeHandle(pos.sx, pos.sy, obj);
        if (handle) {
          this.isResizing = true;
          this.resizeHandle = handle;
          this.resizeObj = obj;
          this.resizeStartBounds = { ...this.getObjectBounds(obj) };
          this.resizeStartPos = { x: pos.x, y: pos.y };
          this.saveUndo();
          return;
        }
      }
    }

    // Hit test from top
    let hit = null;
    for (let i = this.objects.length - 1; i >= 0; i--) {
      if (this.hitTest(pos.x, pos.y, this.objects[i])) {
        hit = this.objects[i];
        break;
      }
    }

    if (hit) {
      if (e.shiftKey) {
        if (this.selectedIds.has(hit.id)) this.selectedIds.delete(hit.id);
        else this.selectedIds.add(hit.id);
      } else {
        if (!this.selectedIds.has(hit.id)) this.selectedIds = new Set([hit.id]);
      }
      this.isDragging = true;
      this.dragStart = { x: pos.x, y: pos.y };
      this.dragOffset = [...this.selectedIds].map(id => {
        const o = this.objects.find(o => o.id === id);
        if (!o) return null;
        const b = this.getObjectBounds(o);
        return { id, dx: pos.x - (o.x ?? b.x), dy: pos.y - (o.y ?? b.y) };
      }).filter(Boolean);
      this.saveUndo();
    } else {
      if (!e.shiftKey) this.selectedIds.clear();
      this.selectBand = { x1: pos.sx, y1: pos.sy, x2: pos.sx, y2: pos.sy };
    }

    this.updateObjProps();
    this.render();
  }

  handleSelectMove(e, pos) {
    if (this.isResizing) {
      this.doResize(pos);
      this.render();
      return;
    }
    if (this.isDragging) {
      this.dragOffset.forEach(({ id, dx, dy }) => {
        const obj = this.objects.find(o => o.id === id);
        if (!obj) return;
        if (obj.type === 'path') {
          const dx2 = pos.x - this.dragStart.x;
          const dy2 = pos.y - this.dragStart.y;
          // handled after
        } else {
          obj.x = pos.x - dx;
          obj.y = pos.y - dy;
        }
      });
      // Handle path drag separately
      if (this._pathDragInited !== this.dragStart) {
        this._pathDragLastPos = { ...this.dragStart };
        this._pathDragInited = this.dragStart;
      }
      const ddx = pos.x - (this._pathDragLastPos?.x ?? pos.x);
      const ddy = pos.y - (this._pathDragLastPos?.y ?? pos.y);
      this._pathDragLastPos = { x: pos.x, y: pos.y };
      this.dragOffset.forEach(({ id }) => {
        const obj = this.objects.find(o => o.id === id);
        if (obj && obj.type === 'path' && obj.points) {
          obj.points = obj.points.map(p => ({ x: p.x + ddx, y: p.y + ddy }));
        }
      });
      this.updateObjProps();
      this.render();
      return;
    }
    if (this.selectBand) {
      this.selectBand.x2 = pos.sx;
      this.selectBand.y2 = pos.sy;
      // rubber-band select
      const w1 = this.screenToWorld(this.selectBand.x1, this.selectBand.y1);
      const w2 = this.screenToWorld(this.selectBand.x2, this.selectBand.y2);
      const rx = Math.min(w1.x, w2.x), ry = Math.min(w1.y, w2.y);
      const rw = Math.abs(w2.x - w1.x), rh = Math.abs(w2.y - w1.y);
      this.selectedIds = new Set(
        this.objects.filter(o => {
          const b = this.getObjectBounds(o);
          if (!b) return false;
          return b.x >= rx && b.y >= ry && b.x + b.w <= rx + rw && b.y + b.h <= ry + rh;
        }).map(o => o.id)
      );
      this.renderOverlay();
    }
  }

  handleSelectUp(e, pos) {
    this._pathDragInited = null;
    this._pathDragLastPos = null;
    this.updateObjProps();
  }

  doResize(pos) {
    const obj = this.resizeObj;
    const h = this.resizeHandle;
    const b = this.resizeStartBounds;
    const dx = pos.x - this.resizeStartPos.x;
    const dy = pos.y - this.resizeStartPos.y;

    if (obj.type === 'path') return;

    let nx = b.x, ny = b.y, nw = b.w, nh = b.h;

    if (h.id.includes('r')) nw = b.w + dx;
    if (h.id.includes('l')) { nx = b.x + dx; nw = b.w - dx; }
    if (h.id.includes('b')) nh = b.h + dy;
    if (h.id.includes('t') && h.id !== 'text') { ny = b.y + dy; nh = b.h - dy; }

    obj.x = nx; obj.y = ny;
    if (obj.type !== 'line') {
      obj.w = nw || 1; obj.h = nh || 1;
    } else {
      obj.w = nw; obj.h = nh;
    }
    this.updateObjProps();
  }

  /* ── BRUSH STROKES ── */
  startBrushStroke(pos) {
    this.isDrawing = true;
    this.currentPath = { points: [{ x: pos.x, y: pos.y }] };
  }

  continueBrushStroke(pos) {
    if (!this.currentPath) return;
    this.currentPath.points.push({ x: pos.x, y: pos.y });

    // Live draw on interaction canvas
    const ctx = this.iCtx;
    ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    ctx.save();
    ctx.translate(this.viewX, this.viewY);
    ctx.scale(this.scale, this.scale);
    const tempObj = {
      type: 'path',
      points: this.currentPath.points,
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      brushSize: this.brushSize,
      brushType: this.brushType,
      opacity: this.opacity
    };
    this.drawPath(ctx, tempObj);
    ctx.restore();
  }

  endBrushStroke() {
    if (!this.currentPath || this.currentPath.points.length < 2) {
      this.iCtx.clearRect(0, 0, this.canvasW, this.canvasH);
      return;
    }
    this.saveUndo();
    const obj = this.makePath(this.currentPath.points);
    this.objects.push(obj);
    this.iCtx.clearRect(0, 0, this.canvasW, this.canvasH);
    this.currentPath = null;
    this.render();
    this.updateLayersList();
  }

  /* ── ERASER ── */
  startErase(pos) {
    this.isDrawing = true;
    this.erasePos = pos;
  }

  continueErase(pos) {
    const r = this.brushSize;
    const toRemove = [];
    this.objects.forEach(obj => {
      if (obj.type === 'path' && obj.points) {
        const filtered = obj.points.filter(p =>
          Math.hypot(p.x - pos.x, p.y - pos.y) > r / this.scale
        );
        if (filtered.length < obj.points.length) {
          if (filtered.length < 2) toRemove.push(obj.id);
          else obj.points = filtered;
        }
      } else {
        const bounds = this.getObjectBounds(obj);
        if (bounds) {
          const cx = bounds.x + bounds.w / 2, cy = bounds.y + bounds.h / 2;
          if (Math.hypot(cx - pos.x, cy - pos.y) < r / this.scale + Math.max(bounds.w, bounds.h) / 2) {
            // Don't remove shapes with eraser unless ctrl
          }
        }
      }
    });
    if (toRemove.length) {
      this.saveUndo();
      this.objects = this.objects.filter(o => !toRemove.includes(o.id));
    }
    this.render();
  }

  endErase() {}

  /* ── SHAPE DRAWING ── */
  startShapeDraw(pos) {
    this.isDrawing = true;
    this.drawStart = { x: pos.x, y: pos.y };
  }

  updateShapePreview(pos) {
    let x = Math.min(pos.x, this.drawStart.x);
    let y = Math.min(pos.y, this.drawStart.y);
    let w = Math.abs(pos.x - this.drawStart.x);
    let h = Math.abs(pos.y - this.drawStart.y);

    if (this.tool === 'line') {
      this.previewShape = {
        id: -1, type: 'line',
        x: this.drawStart.x, y: this.drawStart.y,
        w: pos.x - this.drawStart.x, h: pos.y - this.drawStart.y,
        fillEnabled: false, strokeEnabled: true,
        strokeColor: this.strokeColor, strokeWidth: this.strokeWidth, opacity: this.opacity
      };
    } else {
      this.previewShape = this.makeShape(this.tool, x, y, w, h);
    }
    this.renderOverlay();
  }

  endShapeDraw(pos) {
    if (!this.drawStart) return;
    let x = Math.min(pos.x, this.drawStart.x);
    let y = Math.min(pos.y, this.drawStart.y);
    let w = Math.abs(pos.x - this.drawStart.x);
    let h = Math.abs(pos.y - this.drawStart.y);

    if (w < 2 && h < 2) { this.drawStart = null; return; }

    this.saveUndo();
    let obj;
    if (this.tool === 'line') {
      obj = this.makeShape('line', this.drawStart.x, this.drawStart.y, pos.x - this.drawStart.x, pos.y - this.drawStart.y);
    } else {
      obj = this.makeShape(this.tool, x, y, w, h);
    }
    this.objects.push(obj);
    this.selectedIds = new Set([obj.id]);
    this.drawStart = null;
    this.previewShape = null;
    this.render();
    this.updateLayersList();
    this.updateObjProps();
  }

  /* ── TEXT TOOL ── */
  startTextInput(pos, e) {
    const wrapper = document.getElementById('text-input-wrapper');
    const input = document.getElementById('text-input');
    const sp = this.worldToScreen(pos.x, pos.y);
    const rect = this.interactionCanvas.getBoundingClientRect();

    wrapper.style.display = 'block';
    wrapper.style.left = (rect.left + sp.x) + 'px';
    wrapper.style.top = (rect.top + sp.y - 20) + 'px';
    input.value = '';
    input.focus();
    this.textInputPos = { x: pos.x, y: pos.y };

    input.onkeydown = (ev) => {
      if (ev.key === 'Enter' || ev.key === 'Escape') {
        const text = input.value.trim();
        if (text && ev.key === 'Enter') {
          this.saveUndo();
          const obj = {
            id: this.genId(), type: 'text',
            x: this.textInputPos.x, y: this.textInputPos.y,
            text, fontSize: 18 * (1 / this.scale),
            fillColor: this.fillColor, opacity: this.opacity,
            fillEnabled: true, strokeEnabled: false,
            w: 50, h: 24, rotation: 0,
            name: `文字 ${this.idCounter}`
          };
          this.objects.push(obj);
          this.render();
          this.updateLayersList();
        }
        wrapper.style.display = 'none';
        ev.preventDefault();
      }
    };
  }

  editText(obj, e) {
    const wrapper = document.getElementById('text-input-wrapper');
    const input = document.getElementById('text-input');
    const sp = this.worldToScreen(obj.x, obj.y);
    const rect = this.interactionCanvas.getBoundingClientRect();
    wrapper.style.display = 'block';
    wrapper.style.left = (rect.left + sp.x) + 'px';
    wrapper.style.top = (rect.top + sp.y - 20) + 'px';
    input.value = obj.text;
    input.focus();

    input.onkeydown = (ev) => {
      if (ev.key === 'Enter' || ev.key === 'Escape') {
        const text = input.value.trim();
        if (text) {
          this.saveUndo();
          obj.text = text;
          this.render();
        }
        wrapper.style.display = 'none';
        ev.preventDefault();
      }
    };
  }

  /* ── BOOLEAN OPS ── */
  boolOp(op) {
    const selected = this.objects.filter(o => this.selectedIds.has(o.id));
    if (selected.length < 2) {
      this.toast('请先选择 2 个以上形状进行路径运算');
      return;
    }

    // Use canvas-based pixel boolean ops
    const offA = document.createElement('canvas');
    const offB = document.createElement('canvas');
    const bounds = this.getMultiBounds(selected);
    const pad = 10;
    const W = Math.ceil(bounds.w) + pad * 2;
    const H = Math.ceil(bounds.h) + pad * 2;
    offA.width = offB.width = W;
    offA.height = offB.height = H;

    const ctxA = offA.getContext('2d');
    const ctxB = offB.getContext('2d');

    const offsetX = -bounds.x + pad;
    const offsetY = -bounds.y + pad;

    // Draw shape A (first selected)
    ctxA.save();
    ctxA.translate(offsetX, offsetY);
    const objA = { ...selected[0] };
    objA.fillEnabled = true; objA.fillColor = '#fff';
    objA.strokeEnabled = false;
    this.drawObject(ctxA, objA);
    ctxA.restore();

    // Draw shape B (remaining)
    ctxB.save();
    ctxB.translate(offsetX, offsetY);
    for (let i = 1; i < selected.length; i++) {
      const objB = { ...selected[i] };
      objB.fillEnabled = true; objB.fillColor = '#fff';
      objB.strokeEnabled = false;
      this.drawObject(ctxB, objB);
    }
    ctxB.restore();

    const dataA = ctxA.getImageData(0, 0, W, H).data;
    const dataB = ctxB.getImageData(0, 0, W, H).data;

    // Generate result path using marching squares approximation
    // For simplicity, we'll create a canvas result and convert to image
    const result = document.createElement('canvas');
    result.width = W; result.height = H;
    const rCtx = result.getContext('2d');
    const rImg = rCtx.createImageData(W, H);

    for (let i = 0; i < dataA.length; i += 4) {
      const a = dataA[i + 3] > 128;
      const b = dataB[i + 3] > 128;
      let fill = false;
      if (op === 'union') fill = a || b;
      else if (op === 'intersect') fill = a && b;
      else if (op === 'difference') fill = a && !b;
      else if (op === 'xor') fill = (a || b) && !(a && b);

      if (fill) {
        rImg.data[i] = 124;
        rImg.data[i + 1] = 111;
        rImg.data[i + 2] = 205;
        rImg.data[i + 3] = 220;
      }
    }
    rCtx.putImageData(rImg, 0, 0);

    // Create a new image object
    this.saveUndo();
    const newObj = {
      id: this.genId(),
      type: 'bitmap',
      x: bounds.x - pad,
      y: bounds.y - pad,
      w: W,
      h: H,
      imageData: result.toDataURL(),
      opacity: 1,
      fillEnabled: true,
      strokeEnabled: false,
      fillColor: 'transparent',
      strokeColor: 'transparent',
      strokeWidth: 0,
      rotation: 0,
      name: `${op} 结果 ${this.idCounter}`
    };

    // Load image
    const img = new Image();
    img.onload = () => {
      newObj._img = img;
      this.render();
    };
    img.src = newObj.imageData;

    this.objects = this.objects.filter(o => !this.selectedIds.has(o.id));
    this.objects.push(newObj);
    this.selectedIds = new Set([newObj.id]);

    this.render();
    this.updateLayersList();
    this.toast(`${op === 'union' ? '并集' : op === 'intersect' ? '交集' : op === 'difference' ? '差集' : '异或'} 完成`);
  }

  drawObject(ctx, obj) {
    if (obj.type === 'bitmap') {
      if (obj._img) {
        ctx.save();
        ctx.globalAlpha = obj.opacity ?? 1;
        ctx.drawImage(obj._img, obj.x, obj.y, obj.w, obj.h);
        ctx.restore();
      }
      return;
    }
    ctx.save();
    this.applyStyle(ctx, obj);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (obj.rotation) {
      const cx = obj.x + (obj.w || 0) / 2;
      const cy = obj.y + (obj.h || 0) / 2;
      ctx.translate(cx, cy);
      ctx.rotate(obj.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }

    switch (obj.type) {
      case 'rect':
        ctx.beginPath();
        ctx.rect(obj.x, obj.y, obj.w, obj.h);
        if (obj.fillEnabled) ctx.fill();
        if (obj.strokeEnabled) ctx.stroke();
        break;
      case 'circle': {
        const rx = Math.abs(obj.w) / 2, ry = Math.abs(obj.h) / 2;
        const cx = obj.x + obj.w / 2, cy = obj.y + obj.h / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        if (obj.fillEnabled) ctx.fill();
        if (obj.strokeEnabled) ctx.stroke();
        break;
      }
      case 'triangle': {
        ctx.beginPath();
        ctx.moveTo(obj.x + obj.w / 2, obj.y);
        ctx.lineTo(obj.x + obj.w, obj.y + obj.h);
        ctx.lineTo(obj.x, obj.y + obj.h);
        ctx.closePath();
        if (obj.fillEnabled) ctx.fill();
        if (obj.strokeEnabled) ctx.stroke();
        break;
      }
      case 'line':
        ctx.beginPath();
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x + obj.w, obj.y + obj.h);
        ctx.stroke();
        break;
      case 'path':
        this.drawPath(ctx, obj);
        break;
      case 'text':
        ctx.font = `${obj.fontSize || 18}px Sora, sans-serif`;
        ctx.fillStyle = obj.fillColor || '#e8e8f0';
        ctx.globalAlpha = obj.opacity ?? 1;
        ctx.fillText(obj.text || '', obj.x, obj.y);
        const m = ctx.measureText(obj.text || '');
        obj.w = m.width; obj.h = (obj.fontSize || 18) * 1.4;
        break;
    }
    ctx.restore();
  }

  getMultiBounds(objs) {
    const bounds = objs.map(o => this.getObjectBounds(o)).filter(Boolean);
    if (!bounds.length) return { x: 0, y: 0, w: 100, h: 100 };
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxX = Math.max(...bounds.map(b => b.x + b.w));
    const maxY = Math.max(...bounds.map(b => b.y + b.h));
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  /* ── ALIGN ── */
  align(dir) {
    const selected = this.objects.filter(o => this.selectedIds.has(o.id));
    if (selected.length < 2) { this.toast('请选择 2 个以上对象进行对齐'); return; }
    this.saveUndo();

    const allBounds = selected.map(o => ({ obj: o, b: this.getObjectBounds(o) })).filter(x => x.b);
    const minX = Math.min(...allBounds.map(x => x.b.x));
    const minY = Math.min(...allBounds.map(x => x.b.y));
    const maxX = Math.max(...allBounds.map(x => x.b.x + x.b.w));
    const maxY = Math.max(...allBounds.map(x => x.b.y + x.b.h));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    allBounds.forEach(({ obj, b }) => {
      if (obj.type === 'path' || obj.type === 'line') return; // skip
      if (dir === 'left') obj.x = minX;
      else if (dir === 'right') obj.x = maxX - b.w;
      else if (dir === 'top') obj.y = minY;
      else if (dir === 'bottom') obj.y = maxY - b.h;
      else if (dir === 'centerH') obj.x = centerX - b.w / 2;
      else if (dir === 'centerV') obj.y = centerY - b.h / 2;
    });
    this.render();
  }

  /* ── UNDO / REDO ── */
  saveUndo() {
    this.undoStack.push(JSON.stringify(this.objects));
    this.redoStack = [];
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  undo() {
    if (!this.undoStack.length) { this.toast('没有可撤销的操作'); return; }
    this.redoStack.push(JSON.stringify(this.objects));
    this.objects = JSON.parse(this.undoStack.pop());
    // Restore bitmap images
    this.objects.forEach(obj => {
      if (obj.type === 'bitmap' && obj.imageData && !obj._img) {
        const img = new Image();
        img.onload = () => { obj._img = img; this.render(); };
        img.src = obj.imageData;
      }
    });
    this.selectedIds.clear();
    this.render();
    this.updateLayersList();
    this.toast('已撤销');
  }

  redo() {
    if (!this.redoStack.length) { this.toast('没有可重做的操作'); return; }
    this.undoStack.push(JSON.stringify(this.objects));
    this.objects = JSON.parse(this.redoStack.pop());
    this.objects.forEach(obj => {
      if (obj.type === 'bitmap' && obj.imageData && !obj._img) {
        const img = new Image();
        img.onload = () => { obj._img = img; this.render(); };
        img.src = obj.imageData;
      }
    });
    this.selectedIds.clear();
    this.render();
    this.updateLayersList();
    this.toast('已重做');
  }

  clearAll() {
    if (!this.objects.length) return;
    this.saveUndo();
    this.objects = [];
    this.selectedIds.clear();
    this.render();
    this.updateLayersList();
    this.toast('已清空画布');
  }

  /* ── ZOOM ── */
  zoom(delta) {
    const cx = this.canvasW / 2, cy = this.canvasH / 2;
    this.viewX = cx - (cx - this.viewX) * (1 + delta);
    this.viewY = cy - (cy - this.viewY) * (1 + delta);
    this.scale *= (1 + delta);
    this.scale = Math.max(0.05, Math.min(50, this.scale));
    document.getElementById('zoom-label').textContent = Math.round(this.scale * 100) + '%';
    this.render();
  }

  resetZoom() {
    this.scale = 1;
    this.viewX = 0;
    this.viewY = 0;
    document.getElementById('zoom-label').textContent = '100%';
    this.render();
  }

  /* ── EXPORT ── */
  exportPNG() {
    const exp = document.createElement('canvas');
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.objects.forEach(o => {
      const b = this.getObjectBounds(o);
      if (!b) return;
      minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.w); maxY = Math.max(maxY, b.y + b.h);
    });
    if (!isFinite(minX)) { this.toast('画布为空'); return; }
    const pad = 20;
    exp.width = maxX - minX + pad * 2;
    exp.height = maxY - minY + pad * 2;
    const ec = exp.getContext('2d');
    ec.fillStyle = '#111113';
    ec.fillRect(0, 0, exp.width, exp.height);
    ec.translate(-minX + pad, -minY + pad);
    this.objects.forEach(o => this.drawObject(ec, o));
    const link = document.createElement('a');
    link.download = 'skiaboard.png';
    link.href = exp.toDataURL('image/png');
    link.click();
    this.toast('已导出 PNG');
  }

  /* ── LAYER MANAGEMENT ── */
  updateLayersList() {
    const list = document.getElementById('layers-list');
    list.innerHTML = '';
    [...this.objects].reverse().forEach(obj => {
      const item = document.createElement('div');
      item.className = 'layer-item' + (this.selectedIds.has(obj.id) ? ' selected' : '');
      const colors = { rect: '#7c6fcd', circle: '#4ecdc4', triangle: '#ff6b6b', path: '#ffd93d', line: '#aaaacc', text: '#ff9ff3', bitmap: '#cccccc' };
      const dot = `<span class="layer-dot" style="background:${colors[obj.type] || '#888'}"></span>`;
      item.innerHTML = `${dot}<span class="layer-name">${obj.name || obj.type}</span><span class="layer-del" onclick="app.deleteObject(${obj.id},event)">×</span>`;
      item.onclick = (e) => {
        if (e.shiftKey) this.selectedIds.has(obj.id) ? this.selectedIds.delete(obj.id) : this.selectedIds.add(obj.id);
        else this.selectedIds = new Set([obj.id]);
        this.updateObjProps();
        this.render();
      };
      list.appendChild(item);
    });
    document.getElementById('stat-count').textContent = `对象: ${this.objects.length}`;
  }

  deleteObject(id, e) {
    e.stopPropagation();
    this.saveUndo();
    this.objects = this.objects.filter(o => o.id !== id);
    this.selectedIds.delete(id);
    this.render();
    this.updateLayersList();
  }

  moveLayer(dir) {
    if (this.selectedIds.size !== 1) { this.toast('请选择一个对象'); return; }
    const id = [...this.selectedIds][0];
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx === -1) return;
    const newIdx = idx - dir; // dir=-1 = up in render (lower index = bottom)
    if (newIdx < 0 || newIdx >= this.objects.length) return;
    this.saveUndo();
    const tmp = this.objects[idx];
    this.objects[idx] = this.objects[newIdx];
    this.objects[newIdx] = tmp;
    this.render();
    this.updateLayersList();
  }

  /* ── OBJECT PROPS PANEL ── */
  updateObjProps() {
    const panel = document.getElementById('obj-props');
    if (this.selectedIds.size !== 1) { panel.style.display = 'none'; return; }
    panel.style.display = 'block';
    const obj = this.objects.find(o => o.id === [...this.selectedIds][0]);
    if (!obj) return;
    const b = this.getObjectBounds(obj);
    if (!b) return;
    document.getElementById('prop-x').value = Math.round(b.x);
    document.getElementById('prop-y').value = Math.round(b.y);
    document.getElementById('prop-w').value = Math.round(b.w);
    document.getElementById('prop-h').value = Math.round(b.h);
    document.getElementById('prop-r').value = Math.round(obj.rotation || 0);
    document.getElementById('stat-selected').textContent = obj.name || obj.type;
  }

  updateSelectedProp(prop, val) {
    if (this.selectedIds.size !== 1) return;
    const obj = this.objects.find(o => o.id === [...this.selectedIds][0]);
    if (!obj) return;
    const v = parseFloat(val);
    if (prop === 'x') obj.x = v;
    else if (prop === 'y') obj.y = v;
    else if (prop === 'w') obj.w = v;
    else if (prop === 'h') obj.h = v;
    else if (prop === 'r') obj.rotation = v;
    this.render();
  }

  /* ── STATUS BAR ── */
  updateStatusBar() {
    const s = this.selectedIds.size;
    document.getElementById('stat-selected').textContent =
      s === 0 ? '未选择' : s === 1 ? (this.objects.find(o => o.id === [...this.selectedIds][0])?.name || '选中 1') : `选中 ${s} 个`;
  }

  /* ── KEYBOARD ── */
  onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    if (e.code === 'Space') {
      e.preventDefault();
      this.spaceDown = true;
      this.interactionCanvas.style.cursor = 'grab';
    }

    const keyMap = { v: 'select', p: 'pen', b: 'brush', e: 'eraser', r: 'rect', c: 'circle', l: 'line', t: 'triangle', x: 'text' };
    if (keyMap[e.key.toLowerCase()] && !e.ctrlKey && !e.metaKey) {
      this.setTool(keyMap[e.key.toLowerCase()]);
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) this.redo(); else this.undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      this.selectedIds = new Set(this.objects.map(o => o.id));
      this.render();
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selectedIds.size > 0) {
        this.saveUndo();
        this.objects = this.objects.filter(o => !this.selectedIds.has(o.id));
        this.selectedIds.clear();
        this.render();
        this.updateLayersList();
      }
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      this.duplicate();
    }
    if (e.key === 'Escape') {
      this.selectedIds.clear();
      this.render();
    }
    // Arrow keys nudge
    const nudge = e.shiftKey ? 10 : 1;
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault();
      this.selectedIds.forEach(id => {
        const obj = this.objects.find(o => o.id === id);
        if (!obj) return;
        if (e.key === 'ArrowLeft') obj.x -= nudge;
        else if (e.key === 'ArrowRight') obj.x += nudge;
        else if (e.key === 'ArrowUp') obj.y -= nudge;
        else if (e.key === 'ArrowDown') obj.y += nudge;
      });
      this.render();
    }
  }

  onKeyUp(e) {
    if (e.code === 'Space') {
      this.spaceDown = false;
      this.interactionCanvas.style.cursor = this.tool === 'select' ? 'default' : 'crosshair';
    }
  }

  duplicate() {
    if (!this.selectedIds.size) return;
    this.saveUndo();
    const newIds = new Set();
    [...this.selectedIds].forEach(id => {
      const obj = this.objects.find(o => o.id === id);
      if (!obj) return;
      const copy = JSON.parse(JSON.stringify(obj));
      copy.id = this.genId();
      copy.name = (copy.name || copy.type) + ' 副本';
      copy.x = (copy.x || 0) + 20;
      copy.y = (copy.y || 0) + 20;
      if (copy.points) copy.points = copy.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
      if (copy.type === 'bitmap' && copy.imageData) {
        const img = new Image();
        img.onload = () => { copy._img = img; this.render(); };
        img.src = copy.imageData;
      }
      this.objects.push(copy);
      newIds.add(copy.id);
    });
    this.selectedIds = newIds;
    this.render();
    this.updateLayersList();
    this.toast('已复制');
  }

  /* ── TOUCH ── */
  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.onMouseDown({ button: 0, clientX: t.clientX, clientY: t.clientY, shiftKey: false });
    }
  }
  onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.onMouseMove({ clientX: t.clientX, clientY: t.clientY });
    }
  }
  onTouchEnd(e) {
    const t = e.changedTouches[0];
    this.onMouseUp({ clientX: t.clientX, clientY: t.clientY });
  }

  /* ── TOAST ── */
  toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }
}

// ── BOOT ──
window.app = new SkiaBoard();
