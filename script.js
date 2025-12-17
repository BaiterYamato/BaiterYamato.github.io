const A_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
};

const mmPerPx = 25.4 / 96;
let stickers = [];
let pages = [{ placements: [], sheetWidth: A_SIZES.A4.width, sheetHeight: A_SIZES.A4.height, margin: 5 }];
let currentPageIndex = 0;
let currentUnit = 'mm';

const sheetCanvas = document.getElementById('sheetCanvas');
const stickerList = document.getElementById('stickerList');
const marginInput = document.getElementById('marginInput');
const gapInput = document.getElementById('gapInput');
const sheetSizeSelect = document.getElementById('sheetSize');
const orientationSelect = document.getElementById('orientation');
const unitSelect = document.getElementById('unitSelect');
const previewUnit = document.getElementById('previewUnit');
const pageIndicator = document.getElementById('pageIndicator');
const summaryBadges = document.getElementById('summaryBadges');
const defaultContourColor = document.getElementById('defaultContourColor');

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

document.getElementById('repack').addEventListener('click', packAndRender);
document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
document.getElementById('nextPage').addEventListener('click', () => changePage(1));
document.getElementById('clearBoard').addEventListener('click', () => {
  stickers = [];
  pages = [emptyPage()];
  renderStickerList();
  renderPreview();
});

[sheetSizeSelect, orientationSelect, marginInput, gapInput].forEach((el) => {
  el.addEventListener('input', packAndRender);
});

unitSelect.addEventListener('change', (e) => {
  currentUnit = e.target.value;
  renderStickerList();
});

previewUnit.addEventListener('change', () => {
  renderStickerList();
  renderPreview();
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragging');
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragging'));

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragging');
  handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function emptyPage() {
  const { width, height } = getSheetSize();
  return { placements: [], sheetWidth: width, sheetHeight: height, margin: toMm(parseFloat(marginInput.value) || 0, currentUnit) };
}

function toMm(value, unit = currentUnit) {
  if (Number.isNaN(value)) return 0;
  switch (unit) {
    case 'cm':
      return value * 10;
    case 'px':
      return value * mmPerPx;
    default:
      return value;
  }
}

function fromMm(value, unit = currentUnit) {
  switch (unit) {
    case 'cm':
      return value / 10;
    case 'px':
      return value / mmPerPx;
    default:
      return value;
  }
}

function getSheetSize() {
  const base = A_SIZES[sheetSizeSelect.value] || A_SIZES.A4;
  const portrait = orientationSelect.value === 'portrait';
  return portrait
    ? { width: base.width, height: base.height }
    : { width: base.height, height: base.width };
}

function handleFiles(fileList) {
  const files = Array.from(fileList);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const naturalWidthMm = img.naturalWidth * mmPerPx;
        const naturalHeightMm = img.naturalHeight * mmPerPx;
        const targetWidth = Math.min(60, naturalWidthMm || 40);
        const targetHeight = (targetWidth / naturalWidthMm) * naturalHeightMm || 40;
        stickers.push({
          id: crypto.randomUUID(),
          name: file.name,
          src: ev.target.result,
          widthMm: targetWidth,
          heightMm: targetHeight,
          quantity: 1,
          contourMm: 0,
          contourColor: defaultContourColor.value,
          allowRotation: true,
          extraGapMm: 0,
        });
        renderStickerList();
        packAndRender();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderStickerList() {
  stickerList.innerHTML = '';
  const unitLabel = previewUnit.value;

  stickers.forEach((sticker) => {
    const card = document.createElement('div');
    card.className = 'sticker-card';

    const img = document.createElement('img');
    img.src = sticker.src;
    img.alt = sticker.name;
    card.appendChild(img);

    const panel = document.createElement('div');

    const meta = document.createElement('div');
    meta.className = 'sticker-meta';
    meta.innerHTML = `<span>${sticker.name}</span><span>x${sticker.quantity}</span>`;
    panel.appendChild(meta);

    const fields = document.createElement('div');
    fields.className = 'sticker-fields';

    fields.appendChild(buildNumberField('Largura', fromMm(sticker.widthMm, unitLabel), unitLabel, (val) => {
      sticker.widthMm = toMm(parseFloat(val) || 0, unitLabel);
      packAndRender();
    }));

    fields.appendChild(buildNumberField('Altura', fromMm(sticker.heightMm, unitLabel), unitLabel, (val) => {
      sticker.heightMm = toMm(parseFloat(val) || 0, unitLabel);
      packAndRender();
    }));

    fields.appendChild(buildNumberField('Quantidade', sticker.quantity, '', (val) => {
      sticker.quantity = Math.max(parseInt(val, 10) || 0, 0);
      packAndRender();
    }));

    fields.appendChild(buildNumberField('Contorno', fromMm(sticker.contourMm, unitLabel), unitLabel, (val) => {
      sticker.contourMm = toMm(parseFloat(val) || 0, unitLabel);
      packAndRender();
    }));

    fields.appendChild(buildNumberField('Margem extra', fromMm(sticker.extraGapMm, unitLabel), unitLabel, (val) => {
      sticker.extraGapMm = toMm(parseFloat(val) || 0, unitLabel);
      packAndRender();
    }));

    const colorField = document.createElement('label');
    colorField.className = 'field';
    colorField.innerHTML = '<span>Cor do contorno</span>';
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = sticker.contourColor;
    colorInput.addEventListener('input', (e) => {
      sticker.contourColor = e.target.value;
      renderPreview();
    });
    colorField.appendChild(colorInput);
    fields.appendChild(colorField);

    const rotationField = document.createElement('label');
    rotationField.className = 'field';
    rotationField.innerHTML = '<span>Permitir rotação</span>';
    const rotationToggle = document.createElement('input');
    rotationToggle.type = 'checkbox';
    rotationToggle.checked = sticker.allowRotation;
    rotationToggle.addEventListener('change', (e) => {
      sticker.allowRotation = e.target.checked;
      packAndRender();
    });
    rotationField.appendChild(rotationToggle);
    fields.appendChild(rotationField);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'ghost';
    removeBtn.textContent = 'Remover';
    removeBtn.addEventListener('click', () => {
      stickers = stickers.filter((s) => s.id !== sticker.id);
      packAndRender();
      renderStickerList();
    });

    panel.appendChild(fields);
    panel.appendChild(removeBtn);
    card.appendChild(panel);

    stickerList.appendChild(card);
  });
}

function buildNumberField(label, value, unitLabel, onChange) {
  const wrapper = document.createElement('label');
  wrapper.className = 'field';
  const span = document.createElement('span');
  span.textContent = unitLabel ? `${label} (${unitLabel})` : label;
  const input = document.createElement('input');
  input.type = 'number';
  input.min = '0';
  input.step = '0.5';
  input.value = Number(value || 0).toFixed(1);
  input.addEventListener('input', (e) => onChange(e.target.value));
  wrapper.append(span, input);
  return wrapper;
}

async function packAndRender() {
  const payload = buildPayload();
  try {
    const response = await fetch('/pack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Erro ao comunicar com o planejador');
    const data = await response.json();
    pages = data.pages || [emptyPage()];
  } catch (err) {
    pages = fallbackPack(payload);
  }
  currentPageIndex = 0;
  renderPreview();
  updateSummary();
}

function buildPayload() {
  const { width, height } = getSheetSize();
  const marginMm = toMm(parseFloat(marginInput.value) || 0, currentUnit);
  const gapMm = toMm(parseFloat(gapInput.value) || 0, currentUnit);

  return {
    sheetWidthMm: width,
    sheetHeightMm: height,
    marginMm,
    gapMm,
    stickers: stickers.map((sticker) => ({
      id: sticker.id,
      name: sticker.name,
      widthMm: sticker.widthMm,
      heightMm: sticker.heightMm,
      quantity: sticker.quantity,
      contourMm: sticker.contourMm,
      contourColor: sticker.contourColor,
      allowRotation: sticker.allowRotation,
      extraGapMm: sticker.extraGapMm,
    })),
  };
}

function fallbackPack(payload) {
  const { sheetWidthMm: sheetWidth, sheetHeightMm: sheetHeight, marginMm: margin, gapMm: gap } = payload;
  const placements = [];
  let x = margin;
  let y = margin;
  let rowHeight = 0;
  let pagesLocal = [];

  const expand = [];
  payload.stickers.forEach((sticker) => {
    const qty = Math.max(sticker.quantity, 0);
    for (let i = 0; i < qty; i += 1) {
      expand.push({ ...sticker });
    }
  });

  const startPage = () => {
    placements.length = 0;
    x = margin;
    y = margin;
    rowHeight = 0;
    pagesLocal.push({ placements: [], sheetWidth, sheetHeight, margin });
  };

  startPage();

  expand.forEach((item) => {
    let placed = false;
    const tryPlace = (w, h, rotated) => {
      const innerGap = gap + (item.extraGapMm || 0);
      if (x + w <= sheetWidth - margin && y + h <= sheetHeight - margin) {
        pagesLocal[pagesLocal.length - 1].placements.push({
          ...item,
          x,
          y,
          width: w,
          height: h,
          rotated,
        });
        x += w + innerGap;
        rowHeight = Math.max(rowHeight, h);
        return true;
      }
      const newRowY = y + rowHeight + innerGap;
      if (w <= sheetWidth - margin * 2 && newRowY + h <= sheetHeight - margin) {
        x = margin;
        y = newRowY;
        rowHeight = h;
        pagesLocal[pagesLocal.length - 1].placements.push({
          ...item,
          x,
          y,
          width: w,
          height: h,
          rotated,
        });
        x += w + innerGap;
        return true;
      }
      return false;
    };

    const orientations = item.allowRotation ? [false, true] : [false];
    orientations.some((rotated) => {
      const w = rotated ? item.heightMm + item.contourMm * 2 : item.widthMm + item.contourMm * 2;
      const h = rotated ? item.widthMm + item.contourMm * 2 : item.heightMm + item.contourMm * 2;
      if (tryPlace(w, h, rotated)) {
        placed = true;
        return true;
      }
      return false;
    });

    if (!placed) {
      startPage();
      const w = item.widthMm + item.contourMm * 2;
      const h = item.heightMm + item.contourMm * 2;
      pagesLocal[pagesLocal.length - 1].placements.push({ ...item, x: margin, y: margin, width: w, height: h, rotated: false });
      x = margin + w + gap;
      rowHeight = h;
    }
  });

  return pagesLocal;
}

function renderPreview() {
  const page = pages[currentPageIndex] || pages[0];
  if (!page) return;
  const { sheetWidth, sheetHeight, placements, margin } = page;
  sheetCanvas.innerHTML = '';
  sheetCanvas.setAttribute('viewBox', `0 0 ${sheetWidth} ${sheetHeight}`);
  sheetCanvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');

  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  outline.setAttribute('x', 0);
  outline.setAttribute('y', 0);
  outline.setAttribute('width', sheetWidth);
  outline.setAttribute('height', sheetHeight);
  outline.setAttribute('fill', '#fff');
  outline.setAttribute('stroke', '#d1e7d5');
  outline.setAttribute('stroke-width', 1);
  sheetCanvas.appendChild(outline);

  const marginRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  marginRect.setAttribute('x', margin);
  marginRect.setAttribute('y', margin);
  marginRect.setAttribute('width', sheetWidth - margin * 2);
  marginRect.setAttribute('height', sheetHeight - margin * 2);
  marginRect.setAttribute('fill', 'none');
  marginRect.setAttribute('stroke-dasharray', '8 4');
  marginRect.setAttribute('stroke', '#a0d7ad');
  marginRect.setAttribute('stroke-width', 0.8);
  sheetCanvas.appendChild(marginRect);

  placements.forEach((item) => {
    const contour = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    contour.setAttribute('x', item.x);
    contour.setAttribute('y', item.y);
    contour.setAttribute('width', item.width);
    contour.setAttribute('height', item.height);
    contour.setAttribute('rx', 2);
    contour.setAttribute('fill', `${item.contourColor || '#22c55e'}22`);
    contour.setAttribute('stroke', item.contourColor || '#22c55e');
    contour.setAttribute('stroke-width', Math.max(item.contourMm || 0.5, 0.5));
    sheetCanvas.appendChild(contour);

    const padding = (item.contourMm || 0) * 2;
    const innerW = Math.max(item.width - padding, 1);
    const innerH = Math.max(item.height - padding, 1);
    const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', item.src || findSticker(item.id)?.src || '');
    image.setAttribute('x', item.x + (padding / 2));
    image.setAttribute('y', item.y + (padding / 2));
    image.setAttribute('width', innerW);
    image.setAttribute('height', innerH);
    image.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    sheetCanvas.appendChild(image);
  });

  pageIndicator.textContent = `Página ${currentPageIndex + 1} de ${pages.length}`;
}

function findSticker(id) {
  return stickers.find((s) => s.id === id);
}

function changePage(delta) {
  if (!pages.length) return;
  currentPageIndex = (currentPageIndex + delta + pages.length) % pages.length;
  renderPreview();
  updateSummary();
}

function updateSummary() {
  const unitLabel = previewUnit.value;
  const page = pages[currentPageIndex] || pages[0];
  summaryBadges.innerHTML = '';
  if (!page) return;
  const totalStickers = stickers.reduce((acc, s) => acc + (s.quantity || 0), 0);
  const areaSheet = page.sheetWidth * page.sheetHeight;
  const areaUsed = page.placements.reduce((acc, p) => acc + p.width * p.height, 0);
  const usage = ((areaUsed / areaSheet) * 100).toFixed(1);

  const badges = [
    `${totalStickers} adesivos no lote`,
    `${pages.length} página(s)`,
    `Uso da folha: ${usage}%`,
    `Margem: ${fromMm(page.margin, unitLabel).toFixed(1)} ${unitLabel}`,
  ];

  badges.forEach((text) => {
    const span = document.createElement('span');
    span.textContent = text;
    summaryBadges.appendChild(span);
  });
}

// bootstrap
renderStickerList();
renderPreview();
updateSummary();
