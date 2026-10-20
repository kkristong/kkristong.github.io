// All interactive views reuse saved experiment images; no model runs in the browser.
const dialog = document.querySelector('.lightbox');
const expanded = dialog.querySelector('img');
const closeButton = dialog.querySelector('button');
const stopPlayers = new Set();

function openImage(image) {
  expanded.src = image.src;
  expanded.alt = image.alt;
  if (!dialog.open) dialog.showModal();
}

function enableZoom(image) {
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', `Enlarge: ${image.alt}`);
  image.addEventListener('click', () => openImage(image));
  image.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openImage(image);
    }
  });
}

document.querySelectorAll('.result img').forEach(enableZoom);
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});

const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(src, new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Could not load ${src}`));
      image.src = src;
    }));
  }
  return imageCache.get(src);
}

function drawCrop(canvas, image, x, y, label, size = 374) {
  // Crop only saved image tiles, excluding collage titles and white margins.
  canvas.width = size;
  canvas.height = size;
  canvas.getContext('2d').drawImage(image, x, y, size, size, 0, 0, size, size);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', label);
}

function makePanel(label, markup) {
  const panel = document.createElement('section');
  panel.className = 'interactive-panel';
  panel.setAttribute('aria-label', label);
  panel.innerHTML = markup;
  return panel;
}

function archiveResults(nodes, label) {
  const archive = document.createElement('details');
  archive.className = 'result-archive';
  const summary = document.createElement('summary');
  summary.textContent = label;
  const content = document.createElement('div');
  content.className = 'archive-content';
  nodes[0].before(archive);
  archive.append(summary, content);
  content.append(...nodes);
  return archive;
}

async function initEditingViewer(sectionId, textGuided, panelTitle) {
  const section = document.querySelector(sectionId);
  const originals = section.querySelector(':scope > .feature-stack');
  const figures = [...originals.querySelectorAll('.result')];
  const images = await Promise.all(figures.map((figure) => loadImage(figure.querySelector('img').src)));
  const labels = figures.map((figure) => figure.querySelector('figcaption').textContent);
  const suffix = section.id;
  const times = ['0.02', '0.04', '0.06', '0.10', '0.14', '0.25', '0.50'];
  // The text-guided collages reserve additional space for the full prompt.
  const size = textGuided ? 361 : 374;
  const firstRow = textGuided ? 54 : 28;
  const secondRow = textGuided ? 441 : 428;
  const positions = [[410, firstRow], [810, firstRow], [1210, firstRow],
    [10, secondRow], [410, secondRow], [810, secondRow], [1210, secondRow]];
  const panel = makePanel(panelTitle || (textGuided ? 'Text-guided editing time explorer' : 'Image-to-image editing time explorer'), `
    <div class="interaction-heading"><p>choose how much to change</p></div>
    <div class="edit-source-control">
      <label class="control-label" for="edit-source-${suffix}">choose an example</label>
      <select id="edit-source-${suffix}" class="demo-select edit-source"></select>
    </div>
    <div class="interactive-grid">
      <div class="interactive-card"><h3>original</h3><canvas class="demo-square edit-original"></canvas></div>
      <div class="interactive-card"><h3>saved result</h3><canvas class="demo-square edit-result"></canvas></div>
    </div>
    <div class="edit-time-control">
      <label class="control-label" for="edit-time-${suffix}">starting time <output class="edit-time-readout" for="edit-time-${suffix}">t = 0.10</output></label>
      <input id="edit-time-${suffix}" class="demo-range edit-time-slider" type="range" min="0" max="6" step="1" value="3" aria-valuetext="t = 0.10">
      <div class="edit-time-ticks" aria-hidden="true">${times.map((time) => `<span>${time}</span>`).join('')}</div>
      <div class="range-ends"><span>more freedom</span><span>more source detail</span></div>
    </div>`);
  const select = panel.querySelector('.edit-source');
  labels.forEach((label, index) => select.add(new Option(label, String(index))));
  const slider = panel.querySelector('.edit-time-slider');
  function render() {
    const index = Number(select.value);
    const timeIndex = Number(slider.value);
    drawCrop(panel.querySelector('.edit-original'), images[index], 10, firstRow, `Original: ${labels[index]}`, size);
    drawCrop(panel.querySelector('.edit-result'), images[index], ...positions[timeIndex], `${labels[index]}, saved edit starting at t = ${times[timeIndex]}`, size);
    panel.querySelector('.edit-time-readout').value = `t = ${times[timeIndex]}`;
    slider.setAttribute('aria-valuetext', `t = ${times[timeIndex]}`);
    panel.querySelectorAll('.edit-time-ticks span').forEach((tick, i) => tick.classList.toggle('is-current', i === timeIndex));
  }
  select.addEventListener('change', render);
  slider.addEventListener('input', render);
  render();
  originals.before(panel);
  archiveResults([originals], 'view every example & all seven starting times');
}

async function initEuler() {
  const section = document.querySelector('#a-1-5');
  const originals = [...section.querySelectorAll(':scope > .result')];
  const [trajectory, methods] = await Promise.all([
    loadImage('assets/partA/1.5.1.png'), loadImage('assets/partA/1.5.2.png'),
  ]);
  const panel = makePanel('Interactive Euler denoising', `
    <div class="interaction-heading"><p>from noise to detail</p></div>
    <div class="interactive-grid">
      <div class="interactive-card">
        <h3>follow the trajectory</h3>
        <canvas class="demo-square euler-frame"></canvas>
        <div class="playback-bar"><button type="button" class="demo-button play-toggle" aria-pressed="false">play ▶</button><output class="time-readout" aria-live="off">t = 0.50</output></div>
        <label class="control-label" for="euler-time">saved time point</label>
        <input id="euler-time" class="demo-range" type="range" min="0" max="5" step="1" value="0" aria-valuetext="t = 0.50">
        <div class="range-ends"><span>0.50</span><span>1.00</span></div>
      </div>
      <div class="interactive-card">
        <h3>compare the recovery</h3>
        <div class="comparison-stage" style="--split:50%">
          <canvas class="compare-before"></canvas>
          <canvas class="compare-after"></canvas>
          <span class="compare-label label-before">noisy input</span><span class="compare-label label-after">Euler</span>
          <span class="comparison-divider" aria-hidden="true"><span>↔</span></span>
          <input class="comparison-slider" type="range" min="0" max="100" value="50" aria-label="Move comparison divider" aria-valuetext="50% noisy input, 50% Euler">
        </div>
        <label class="control-label" for="denoising-method">compare noisy input with</label>
        <select id="denoising-method" class="demo-select"><option value="gaussian">Gaussian blur</option><option value="one-step">one-step</option><option value="euler" selected>Euler</option></select>
      </div>
    </div>`);
  const frames = [[10, 28], [410, 28], [810, 28], [10, 428], [410, 428], [810, 428]];
  const slider = panel.querySelector('#euler-time');
  const output = panel.querySelector('.time-readout');
  const play = panel.querySelector('.play-toggle');
  const canvas = panel.querySelector('.euler-frame');
  let timer = null;
  function renderFrame() {
    const index = Number(slider.value);
    const time = (0.5 + index * 0.1).toFixed(2);
    drawCrop(canvas, trajectory, ...frames[index], `Saved Euler state at t = ${time}`);
    output.value = `t = ${time}`;
    slider.setAttribute('aria-valuetext', `t = ${time}`);
  }
  function pause() {
    clearInterval(timer);
    timer = null;
    play.textContent = 'play ▶';
    play.setAttribute('aria-pressed', 'false');
  }
  stopPlayers.add(pause);
  play.addEventListener('click', () => {
    if (timer) return pause();
    if (Number(slider.value) === 5) slider.value = '0';
    renderFrame();
    play.textContent = 'pause Ⅱ';
    play.setAttribute('aria-pressed', 'true');
    timer = setInterval(() => {
      slider.value = String(Number(slider.value) + 1);
      renderFrame();
      if (Number(slider.value) === 5) pause();
    }, 750);
  });
  slider.addEventListener('input', () => { pause(); renderFrame(); });
  renderFrame();

  const select = panel.querySelector('#denoising-method');
  const stage = panel.querySelector('.comparison-stage');
  const divider = panel.querySelector('.comparison-slider');
  const options = { gaussian: [410, 'Gaussian blur'], 'one-step': [810, 'one-step'], euler: [1210, 'Euler'] };
  drawCrop(panel.querySelector('.compare-before'), trajectory, 10, 28, 'Noisy input at t = 0.50');
  function renderDivider() {
    const split = Number(divider.value);
    stage.style.setProperty('--split', `${split}%`);
    divider.setAttribute('aria-valuetext', `${split}% noisy input, ${100 - split}% ${options[select.value][1]}`);
  }
  function renderMethod() {
    const [x, name] = options[select.value];
    drawCrop(panel.querySelector('.compare-after'), methods, x, 28, `${name} result from the same noisy input`);
    panel.querySelector('.label-after').textContent = name;
    renderDivider();
  }
  divider.addEventListener('input', renderDivider);
  select.addEventListener('change', renderMethod);
  renderMethod();
  originals[0].before(panel);
  archiveResults(originals, 'view the complete trajectory & method comparison');
}

async function initAnagrams() {
  const section = document.querySelector('#a-3-3');
  const gallery = section.querySelector('.gallery');
  const sources = [
    { src: 'assets/partA/3.3.1.png?v=fe645153fd', title: 'flower crown & vase', prompts: ['a woman wearing a flower crown', 'a vase of colorful flowers'] },
    { src: 'assets/partA/3.3.2.png?v=50dc2da17c', title: 'clown & circus tent', prompts: ["a clown's face", 'a circus tent'] },
  ];
  const images = await Promise.all(sources.map(({ src }) => loadImage(src)));
  const panel = makePanel('Rotate the visual anagrams', `
    <div class="interaction-heading"><p>one image, two stories</p></div>
    <div class="interactive-grid">${sources.map((source, i) => `
      <div class="interactive-card anagram-card" data-card="${i}">
        <h3>${source.title}</h3>
        <div class="anagram-stage"><canvas class="demo-square anagram-image"></canvas></div>
        <p class="anagram-prompt" aria-live="polite">${source.prompts[0]}</p>
        <button type="button" class="demo-button flip-button" aria-pressed="false" aria-label="Rotate ${source.title} anagram 180 degrees">rotate 180° ↻</button>
      </div>`).join('')}</div>`);
  panel.querySelectorAll('.anagram-card').forEach((card, i) => {
    const canvas = card.querySelector('canvas');
    const button = card.querySelector('button');
    let rotated = false;
    drawCrop(canvas, images[i], 10, 28, sources[i].prompts[0]);
    button.addEventListener('click', () => {
      rotated = !rotated;
      canvas.classList.toggle('is-rotated', rotated);
      canvas.setAttribute('aria-label', sources[i].prompts[Number(rotated)]);
      card.querySelector('.anagram-prompt').textContent = sources[i].prompts[Number(rotated)];
      button.setAttribute('aria-pressed', String(rotated));
      button.textContent = rotated ? 'back to 0° ↶' : 'rotate 180° ↻';
    });
  });
  gallery.before(panel);
  gallery.classList.add('anagram-print-results');
}

async function initHybrids() {
  const section = document.querySelector('#a-3-4');
  const gallery = section.querySelector('.gallery');
  const sources = [
    { src: 'assets/partA/3.4.1.png', near: 'waterfall', far: 'skull' },
    { src: 'assets/partA/3.4.3.png', near: 'forest', far: 'cat' },
    { src: 'assets/partA/3.4.5.png', near: 'bamboo forest', far: 'panda face' },
    { src: 'assets/partA/3.4.7.png', near: 'wheat field', far: 'lion face' },
  ];
  await Promise.all(sources.map(({ src }) => loadImage(src)));
  const panel = makePanel('Explore hybrid images at different sizes', `
    <div class="interaction-heading"><p>change the size, change what you see</p></div>
    <div class="interactive-grid">${sources.map((source, i) => `
      <div class="interactive-card hybrid-card">
        <h3>${source.near} ↔ ${source.far}</h3>
        <div class="hybrid-stage"><img src="${source.src}" alt="${source.near} and ${source.far} hybrid" width="512" height="512" style="width:240px"></div>
        <label class="control-label" for="hybrid-distance-${i}">viewing size <output class="size-readout">240 px</output></label>
        <input id="hybrid-distance-${i}" class="demo-range" type="range" min="64" max="280" value="240" aria-valuetext="240 pixels wide">
        <div class="range-ends"><span>far · ${source.far}</span><span>near · ${source.near}</span></div>
      </div>`).join('')}</div>`);
  panel.querySelectorAll('.hybrid-card').forEach((card) => {
    const slider = card.querySelector('input');
    slider.addEventListener('input', () => {
      card.querySelector('img').style.width = `${slider.value}px`;
      card.querySelector('output').value = `${slider.value} px`;
      slider.setAttribute('aria-valuetext', `${slider.value} pixels wide`);
    });
  });
  gallery.before(panel);
  archiveResults([gallery], 'view the original near & distant results');
}

async function initEpochViewer(sectionId, withScheduler) {
  const section = document.querySelector(sectionId);
  const originals = section.querySelector(':scope > .stacked-results');
  const files = withScheduler
    ? { 1: '2.6.1.png', 5: '2.6.2.png', 10: '2.6.3.png' }
    : { 1: '2.3.1.png?v=41a3edb270', 5: '2.3.2.png?v=aa129555aa', 10: '2.3.3.png?v=c8dc1b2fdb' };
  const fixedFiles = { 1: 'fixed_epoch1.png', 5: 'fixed_epoch5.png', 10: 'fixed_epoch10.png' };
  const paths = Object.values(files).map((file) => `assets/partB/${file}`);
  if (withScheduler) paths.push(...Object.values(fixedFiles).map((file) => `assets/partB/${file}`));
  await Promise.all(paths.map(loadImage));
  const panel = makePanel(withScheduler ? 'Class-conditioned checkpoint comparison' : 'Time-conditioned checkpoint comparison', `
    ${withScheduler ? '' : '<div class="interaction-heading"><p>watch the model learn</p></div>'}
    ${withScheduler ? `<div class="button-group scheduler-controls" role="group" aria-label="Learning rate schedule"><button type="button" class="demo-button" data-schedule="scheduled" aria-pressed="true">with scheduler</button><button type="button" class="demo-button" data-schedule="fixed" aria-pressed="false">fixed learning rate</button></div>` : ''}
    <div class="button-group epoch-controls" role="group" aria-label="Training epoch">${[1, 5, 10].map((epoch) => `<button type="button" class="demo-button" data-epoch="${epoch}" aria-pressed="${epoch === 10}">epoch ${epoch}</button>`).join('')}</div>
    <figure class="result epoch-result"><img class="epoch-image" src="assets/partB/${files[10]}" alt="${withScheduler ? 'Class' : 'Time'}-conditioned samples at epoch 10"><figcaption class="epoch-caption">epoch 10</figcaption></figure>`);
  let epoch = 10;
  let schedule = 'scheduled';
  const image = panel.querySelector('.epoch-image');
  enableZoom(image);
  const buttons = panel.querySelectorAll('[data-epoch]');
  const scheduleButtons = panel.querySelectorAll('[data-schedule]');
  function render() {
    const fixed = schedule === 'fixed';
    image.src = `assets/partB/${(fixed ? fixedFiles : files)[epoch]}`;
    image.alt = `${withScheduler ? 'Class' : 'Time'}-conditioned samples at epoch ${epoch}${withScheduler ? (fixed ? ', fixed learning rate 0.001' : ', with scheduler') : ''}`;
    image.setAttribute('aria-label', `Enlarge: ${image.alt}`);
    panel.querySelector('.epoch-caption').textContent = `epoch ${epoch}${withScheduler ? ` · ${fixed ? 'fixed lr = 0.001' : 'with scheduler'} · guidance γ = 5` : ''}`;
    buttons.forEach((button) => {
      const value = Number(button.dataset.epoch);
      button.setAttribute('aria-pressed', String(value === epoch));
    });
    scheduleButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.schedule === schedule)));
  }
  buttons.forEach((button) => button.addEventListener('click', () => {
    epoch = Number(button.dataset.epoch);
    render();
  }));
  scheduleButtons.forEach((button) => button.addEventListener('click', () => {
    schedule = button.dataset.schedule;
    render();
  }));
  render();
  originals.before(panel);
  if (withScheduler) {
    panel.classList.add('sampling-comparison');
    originals.classList.add('sampling-print-results');
    const experiment = section.querySelector('.experiment');
    experiment.querySelectorAll(':scope > .result.wide').forEach((figure) => figure.classList.add('sampling-print-results'));
  } else {
    archiveResults([originals], 'view all three saved checkpoints');
  }
}

// Progressive enhancement: an unavailable asset leaves the complete static results intact.
[
  initEuler,
  () => initEditingViewer('#a-3-1', false),
  () => initEditingViewer('#a-3-1-drawings', false, 'Hand-drawn and web image time explorer'),
  () => initEditingViewer('#a-3-2', true),
  initAnagrams,
  initHybrids,
  () => initEpochViewer('#b-2-3', false),
  () => initEpochViewer('#b-2-6', true),
].forEach((initialize) => initialize().catch((error) => console.warn('Interactive view unavailable:', error)));

let printState = [];
window.addEventListener('beforeprint', () => {
  stopPlayers.forEach((pause) => pause());
  // A repeated beforeprint event must not overwrite the user's original open states.
  if (printState.length) return;
  printState = [...document.querySelectorAll('.result-archive')].map((archive) => [archive, archive.open]);
  printState.forEach(([archive]) => { archive.open = true; });
});
window.addEventListener('afterprint', () => {
  printState.forEach(([archive, open]) => { archive.open = open; });
  printState = [];
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopPlayers.forEach((pause) => pause());
});
