'use strict';

// Self-contained interactive dependency graph: nodes = modules, edges = module dependsOn.
// Deliberately does NOT depend on a CDN (e.g. vis.js) so this works fully offline on a
// locked-down enterprise machine - it's a small vanilla-JS force-directed layout on <canvas>.
function renderCodemapHtml(codemap) {
  const { meta, modules } = codemap;
  const moduleNames = Object.keys(modules);
  const nodes = moduleNames.map((name, i) => ({
    id: name,
    label: `${name} (${modules[name].fileCount})`,
    group: i,
  }));
  const edges = [];
  for (const [name, m] of Object.entries(modules)) {
    for (const dep of m.dependsOn) {
      if (moduleNames.includes(dep)) edges.push({ from: name, to: dep });
    }
  }

  const dataJson = JSON.stringify({ nodes, edges, meta: { generatedAt: meta.generatedAt, repoRoot: meta.repoRoot } });

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Codemap — ${escapeHtml(meta.repoRoot)}</title>
<style>
  html,body{margin:0;height:100%;background:#0b0e14;color:#e6e6e6;font-family:system-ui,sans-serif;}
  #info{position:fixed;top:8px;left:8px;font-size:13px;opacity:.85;max-width:60ch;}
  #canvas{display:block;width:100%;height:100%;}
  .node-label{pointer-events:none;}
</style>
</head>
<body>
<div id="info">
  <strong>Module dependency graph</strong><br>
  Generated ${escapeHtml(meta.generatedAt)}<br>
  ${nodes.length} modules, ${edges.length} dependency edges. Drag nodes; scroll to zoom.
</div>
<canvas id="canvas"></canvas>
<script>
const DATA = ${dataJson};
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
window.addEventListener('resize', resize); resize();

const W = canvas.width, H = canvas.height;
const nodes = DATA.nodes.map((n, i) => ({
  ...n,
  x: W/2 + Math.cos(i / DATA.nodes.length * Math.PI * 2) * 250,
  y: H/2 + Math.sin(i / DATA.nodes.length * Math.PI * 2) * 250,
  vx: 0, vy: 0,
}));
const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
const edges = DATA.edges.map(e => ({ from: nodeById[e.from], to: nodeById[e.to] }));

function colorForGroup(g) {
  const hue = (g * 47) % 360;
  return 'hsl(' + hue + ', 65%, 60%)';
}

let panX = 0, panY = 0, zoom = 1;
let dragNode = null, dragOffsetX = 0, dragOffsetY = 0;
let panning = false, panStartX = 0, panStartY = 0;

function screenToWorld(sx, sy) {
  return { x: (sx - panX) / zoom, y: (sy - panY) / zoom };
}

canvas.addEventListener('mousedown', (e) => {
  const { x, y } = screenToWorld(e.offsetX, e.offsetY);
  const hit = nodes.find(n => Math.hypot(n.x - x, n.y - y) < 40);
  if (hit) { dragNode = hit; dragOffsetX = x - hit.x; dragOffsetY = y - hit.y; }
  else { panning = true; panStartX = e.offsetX - panX; panStartY = e.offsetY - panY; }
});
window.addEventListener('mousemove', (e) => {
  if (dragNode) {
    const { x, y } = screenToWorld(e.offsetX, e.offsetY);
    dragNode.x = x - dragOffsetX; dragNode.y = y - dragOffsetY;
    dragNode.vx = 0; dragNode.vy = 0;
  } else if (panning) {
    panX = e.offsetX - panStartX; panY = e.offsetY - panStartY;
  }
});
window.addEventListener('mouseup', () => { dragNode = null; panning = false; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  zoom = Math.max(0.2, Math.min(4, zoom * factor));
}, { passive: false });

function tick() {
  // simple repulsion + edge-spring force layout
  for (const a of nodes) {
    let fx = 0, fy = 0;
    for (const b of nodes) {
      if (a === b) continue;
      let dx = a.x - b.x, dy = a.y - b.y;
      let d2 = dx*dx + dy*dy || 0.01;
      let f = 4000 / d2;
      fx += dx * f; fy += dy * f;
    }
    a.vx = (a.vx + fx * 0.01) * 0.9;
    a.vy = (a.vy + fy * 0.01) * 0.9;
  }
  for (const e of edges) {
    const dx = e.to.x - e.from.x, dy = e.to.y - e.from.y;
    const dist = Math.hypot(dx, dy) || 0.01;
    const targetLen = 180;
    const f = (dist - targetLen) * 0.01;
    const fx = dx / dist * f, fy = dy / dist * f;
    if (e.from !== dragNode) { e.from.vx += fx; e.from.vy += fy; }
    if (e.to !== dragNode) { e.to.vx -= fx; e.to.vy -= fy; }
  }
  for (const n of nodes) {
    if (n === dragNode) continue;
    n.x += n.vx; n.y += n.vy;
  }
}

function draw() {
  ctx.save();
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  ctx.strokeStyle = 'rgba(230,230,230,0.35)';
  ctx.lineWidth = 1.5 / zoom;
  for (const e of edges) {
    ctx.beginPath();
    ctx.moveTo(e.from.x, e.from.y);
    ctx.lineTo(e.to.x, e.to.y);
    ctx.stroke();
    // arrowhead
    const angle = Math.atan2(e.to.y - e.from.y, e.to.x - e.from.x);
    const ax = e.to.x - Math.cos(angle) * 34, ay = e.to.y - Math.sin(angle) * 34;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - Math.cos(angle - 0.4) * 8, ay - Math.sin(angle - 0.4) * 8);
    ctx.lineTo(ax - Math.cos(angle + 0.4) * 8, ay - Math.sin(angle + 0.4) * 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(230,230,230,0.35)';
    ctx.fill();
  }

  for (const n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, 30, 0, Math.PI * 2);
    ctx.fillStyle = colorForGroup(n.group);
    ctx.fill();
    ctx.strokeStyle = '#0b0e14';
    ctx.lineWidth = 2 / zoom;
    ctx.stroke();
    ctx.fillStyle = '#0b0e14';
    ctx.font = 'bold ' + (12) + 'px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.id, n.x, n.y - 4);
    ctx.font = (10) + 'px system-ui';
    ctx.fillText(n.label.match(/\\(([^)]+)\\)/)?.[0] || '', n.x, n.y + 10);
  }
  ctx.restore();
}

function loop() { tick(); draw(); requestAnimationFrame(loop); }
loop();
</script>
</body>
</html>
`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = { renderCodemapHtml };
