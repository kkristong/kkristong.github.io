// Progressive enhancement only: every report figure is already visible in HTML.
const dialog = document.querySelector('.lightbox');
const expanded = dialog.querySelector('img');
const close = dialog.querySelector('button');

function openFigure(image) {
  const lens = document.querySelector('.detail-lens');
  if (lens) lens.hidden = true;
  expanded.src = image.src;
  expanded.alt = image.alt;
  if (!dialog.open) dialog.showModal();
}

function makeZoomable(image) {
  image.draggable = false;
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Enlarge: ${image.alt}`);
  image.addEventListener('click', () => openFigure(image));
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openFigure(image);
    }
  });
}
document.querySelectorAll('.result img').forEach(makeZoomable);

close.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

// These viewers use the saved experiment outputs. The original figures remain
// available below each viewer, and are expanded automatically for printing.
const outputBase = '../pics/part%20A%20output/';
const pointSets = [
  {names:[3,4],size:[640,480],left:[[383,149],[382,193],[416,149],[418,189],[537,143],[537,189],[514,237],[618,251],[380,331],[406,329],[343,219],[374,129]],right:[[83,97],[79,144],[121,105],[119,147],[239,124],[239,166],[216,210],[297,227],[72,305],[100,303],[25,175],[70,70]]},
  {names:[1,2],size:[1280,960],left:[[913,507],[912,564],[1111,488],[1116,558],[964,380],[1213,273],[1223,370],[1124,628],[1130,744],[1187,619],[1194,446],[1202,529]],right:[[133,466],[133,529],[342,459],[340,522],[201,337],[433,275],[435,360],[342,587],[340,693],[397,576],[412,425],[413,495]]},
  {names:[5,6],size:[1280,960],left:[[631,377],[765,380],[628,525],[854,344],[1086,420],[1161,422],[660,802],[1178,467],[1169,338],[874,542],[655,425],[691,426]],right:[[40,393],[218,407],[37,579],[318,375],[531,457],[590,462],[90,907],[603,497],[593,388],[342,577],[74,455],[126,458]]}
];

function makePanel(label, markup) {
  const panel = document.createElement('section');
  panel.className = 'interactive-panel';
  panel.setAttribute('aria-label', label);
  panel.innerHTML = markup;
  return panel;
}

function archiveFigures(nodes, label) {
  const archive = document.createElement('details');
  archive.className = 'result-archive';
  const summary = document.createElement('summary');
  summary.textContent = label;
  archive.append(summary);
  nodes[0].before(archive);
  nodes.forEach(node => archive.append(node));
  return archive;
}

function selectButton(buttons, selected) {
  buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === selected)));
}

function initCorrespondences() {
  document.querySelectorAll('.homography-case').forEach((article, scene) => {
    const pair = article.querySelector('.correspondence-pair');
    const data = pointSets[scene];
    const panel = makePanel(`Scene ${scene + 1} linked correspondence points`, `
      <div class="point-pair">${['left', 'right'].map((side, view) => `
        <figure class="point-view">
          <div class="point-stage">
            <img src="${outputBase}A1_scene${scene + 1}_source_${side}.png" width="${data.size[0]}" height="${data.size[1]}" alt="Scene ${scene + 1}, image ${data.names[view]}, with interactive matching points">
            ${data[side].map(([x,y], point) => `<button type="button" class="point-marker" data-point="${point}" style="left:${100*x/data.size[0]}%;top:${100*y/data.size[1]}%" aria-label="Image ${data.names[view]}, matching point ${point}" aria-pressed="false">${point}</button>`).join('')}
          </div>
        </figure>`).join('')}
      </div>
      <div class="point-toolbar" role="group" aria-label="Select a matching point">${data.left.map((_,point) => `<button type="button" class="demo-button" data-point="${point}" aria-label="Select matching point ${point}" aria-pressed="false">${point}</button>`).join('')}</div>
      <p class="sr-only" data-point-status aria-live="polite"></p>`);
    const controls = [...panel.querySelectorAll('[data-point]')];
    function activate(point) {
      controls.forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.point) === point)));
      panel.querySelector('[data-point-status]').textContent = `point ${point} · ${data.left.length} matches`;
    }
    controls.forEach(button => {
      const activateThis = () => activate(Number(button.dataset.point));
      button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') activateThis(); });
      button.addEventListener('focus', activateThis);
      button.addEventListener('click', activateThis);
    });
    activate(0);
    const matrix = article.querySelector('.matrix-result');
    panel.append(matrix);
    pair.before(panel);
    pair.remove();
  });
}

function initMosaic() {
  const article = document.querySelector('.mosaic-case');
  if (!article) return;
  const sources = article.querySelector('.mosaic-sources');
  const originalProcess = article.querySelector('.process-grid');
  if (originalProcess) {
    const originalComparison = originalProcess.nextElementSibling;
    originalProcess.remove();
    if (originalComparison) originalComparison.remove();
  }
  const steps = [
    ['reference', 'reference_on_canvas'], ['warped image', 'warped_image_on_canvas'],
    ['equal weights', 'equal_weight_mosaic'], ['feathering', 'feather_mosaic']
  ];
  const panel = makePanel('Mosaic construction and blending comparison', `
    <div class="demo-controls mosaic-options" role="group" aria-label="Mosaic construction and comparison">
      ${steps.map(([label],index) => `<button class="demo-button" type="button" data-mosaic-step="${index}" aria-pressed="false">${label}</button>`).join('')}
      <button class="demo-button" type="button" data-compare aria-pressed="false">compare blending</button>
    </div>
    <div class="demo-mode-view mosaic-steps">
      <figure class="mosaic-step-view"><img width="1595" height="1164" alt=""><figcaption class="sr-only" aria-live="polite"></figcaption></figure>
    </div>
    <div class="demo-mode-view mosaic-compare" hidden>
      <div class="wipe-stage" style="--split:50%">
        <img src="${outputBase}A4_scene1_feather_mosaic.png" width="1595" height="1164" alt="Feather-blended storefront mosaic">
        <img class="wipe-before" src="${outputBase}A4_scene1_equal_weight_mosaic.png" width="1595" height="1164" alt="Equal-weight storefront mosaic, revealed to the left of the divider">
        <span class="wipe-label wipe-label-left">equal weights</span><span class="wipe-label wipe-label-right">feathering</span>
        <span class="wipe-divider" aria-hidden="true"><span>↔</span></span>
        <input class="wipe-range" type="range" min="0" max="100" value="50" aria-label="Move the blending comparison divider" aria-valuetext="50% equal weights, 50% feathering">
      </div>
    </div>`);
  panel.id = 'mosaic-viewer';
  let step = steps.length - 1;
  const stepButtons = [...panel.querySelectorAll('[data-mosaic-step]')];
  const image = panel.querySelector('.mosaic-step-view img');
  function render() {
    image.src = `${outputBase}A4_scene1_${steps[step][1]}.png`;
    image.alt = `Storefront mosaic · ${steps[step][0]}`;
    image.setAttribute('aria-label', `Enlarge: ${image.alt}`);
    panel.querySelector('.mosaic-step-view figcaption').textContent = `${step + 1} / 4 · ${steps[step][0]}`;
    selectButton(stepButtons, step);
    panel.querySelector('[data-compare]').setAttribute('aria-pressed','false');
    panel.querySelector('.mosaic-steps').hidden = false;
    panel.querySelector('.mosaic-compare').hidden = true;
  }
  stepButtons.forEach(button => button.addEventListener('click', () => { step = Number(button.dataset.mosaicStep); render(); }));
  panel.querySelector('[data-compare]').addEventListener('click', () => {
    selectButton(stepButtons, -1);
    panel.querySelector('[data-compare]').setAttribute('aria-pressed','true');
    panel.querySelector('.mosaic-steps').hidden = true;
    panel.querySelector('.mosaic-compare').hidden = false;
  });
  const range = panel.querySelector('.wipe-range');
  range.addEventListener('input', () => {
    panel.querySelector('.wipe-stage').style.setProperty('--split', `${range.value}%`);
    range.setAttribute('aria-valuetext', `${range.value}% equal weights, ${100 - Number(range.value)}% feathering`);
  });
  if (sources) {
    sources.after(panel);
  } else {
    article.append(panel);
  }
  makeZoomable(image);
  render();
}

function initDetailLens() {
  const lens = document.createElement('div');
  lens.className = 'detail-lens';
  lens.hidden = true;
  lens.setAttribute('aria-hidden', 'true');
  lens.innerHTML = '<canvas width="480" height="320"></canvas>';
  document.body.append(lens);
  const canvas = lens.querySelector('canvas');
  const context = canvas.getContext('2d');
  function hide() { lens.hidden = true; }
  document.querySelectorAll('main .result img, .mosaic-step-view img').forEach(image => {
    let position = {x:.5, y:.5};
    function imageBounds() {
      const box = image.getBoundingClientRect();
      const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      return {left:box.left + (box.width-width)/2, top:box.top + (box.height-height)/2, width, height};
    }
    function render(clientX, clientY) {
      if (!image.complete || !image.naturalWidth || dialog.open) return;
      const cropWidth = Math.min(140, image.naturalWidth * .2);
      const cropHeight = cropWidth * 2 / 3;
      const x = Math.max(0, Math.min(image.naturalWidth-cropWidth, position.x*image.naturalWidth-cropWidth/2));
      const y = Math.max(0, Math.min(image.naturalHeight-cropHeight, position.y*image.naturalHeight-cropHeight/2));
      context.imageSmoothingEnabled = false;
      context.drawImage(image, x, y, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
      lens.hidden = false;
      const width = lens.offsetWidth, height = lens.offsetHeight;
      const left = clientX + 24 + width <= innerWidth ? clientX + 24 : clientX - width - 24;
      const top = clientY + 24 + height <= innerHeight ? clientY + 24 : clientY - height - 24;
      lens.style.left = `${Math.max(8, Math.min(innerWidth-width-8, left))}px`;
      lens.style.top = `${Math.max(8, Math.min(innerHeight-height-8, top))}px`;
    }
    image.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
      const bounds = imageBounds();
      position = {x:(event.clientX-bounds.left)/bounds.width, y:(event.clientY-bounds.top)/bounds.height};
      if (position.x<0 || position.x>1 || position.y<0 || position.y>1) return hide();
      render(event.clientX,event.clientY);
    });
    image.addEventListener('pointerleave',hide);
    image.addEventListener('blur',hide);
    image.addEventListener('keydown',event => {
      const direction = {ArrowLeft:[-.05,0],ArrowRight:[.05,0],ArrowUp:[0,-.05],ArrowDown:[0,.05]}[event.key];
      if (!direction) return;
      event.preventDefault();
      position = {x:Math.max(0,Math.min(1,position.x+direction[0])),y:Math.max(0,Math.min(1,position.y+direction[1]))};
      const bounds = imageBounds();
      render(bounds.left+bounds.width*position.x,bounds.top+bounds.height*position.y);
    });
  });
  window.addEventListener('scroll',hide,true);
  window.addEventListener('resize',hide);
  window.addEventListener('beforeprint',hide);
}

initCorrespondences();
initMosaic();
initDetailLens();

let printArchives = [];
window.addEventListener('beforeprint', () => {
  if (dialog.open) dialog.close();
  if (!printArchives.length) printArchives = [...document.querySelectorAll('.result-archive')].map(archive => [archive, archive.open]);
  printArchives.forEach(([archive]) => { archive.open = true; });
});
window.addEventListener('afterprint', () => {
  printArchives.forEach(([archive, wasOpen]) => { archive.open = wasOpen; });
  printArchives = [];
});
