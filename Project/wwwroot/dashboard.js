document.addEventListener("DOMContentLoaded", () => {
  const savedTemplatesJSON = localStorage.getItem("activeDashboardTemplates");
  if (!savedTemplatesJSON) {
    document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:20vh; font-family:sans-serif;">Aktif Şablon Bulunamadı. Lütfen Ana Sayfadan Seçim Yapın.</h1>';
    return;
  }

  const templates = JSON.parse(savedTemplatesJSON);
  if (templates.length === 0) return;

  const container = document.getElementById("mainDashboardContainer");
  let currentIndex = 0;
  let gridsMap = {};
  let currentMapping = [];
  let spTimers = [];
  let activeSpMap = {};
  const andonSpDesigns = JSON.parse(localStorage.getItem("andonSpDesigns")) || {};
  const rotationInterval = parseInt(localStorage.getItem("dashboardRotationInterval")) || 30000;

  function renderTemplate(template) {
    try {
      if (!template) {
        container.innerHTML = '<h3 style="color:red; text-align:center;">Hata: Geçersiz şablon verisi.</h3>';
        return;
      }

      const topbarName = document.getElementById("templateNameDisplay");
      if (topbarName) {
        topbarName.innerText = `Aktif Şablon: ${template.templateName || "İsimsiz Şablon"}`;
      }

      if (!template.layout) template.layout = "2x2";
      if (!template.mapping) template.mapping = [];

      // Önceki GridStack nesnelerini ve DOM'u temizle (Çakışmayı önler)
      Object.values(gridsMap).forEach(grid => grid.destroy(false));
      gridsMap = {};
      spTimers.forEach(t => clearInterval(t));
      spTimers = [];
      activeSpMap = {};
      container.innerHTML = "";

      // CSS Grid Yapısı
      const dims = template.layout.split("x");
      const cols = parseInt(dims[0]) || 2;
      const rows = parseInt(dims[1]) || 2;

      container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
      container.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;

      let designerCols = 12;
      let designerRows = 12;

      currentMapping = template.mapping;

      template.mapping.forEach((mapObj, index) => {
        const machineId = mapObj.machineId;
        const spIds = mapObj.spIds || (mapObj.spId ? [mapObj.spId] : []);

        if (spIds.length === 0) return;

        // Kart İskeleti (Flexbox esneme problemi ve yükseklik çökmesi çözüldü)
        const cardHtml = `
                <div class="machine-card" style="height: 100%;">
                    <div class="machine-title" id="title-${machineId}" style="flex-shrink: 0;">
                        ${machineId} <span style="color: #94a3b8; font-size: 0.4vw; font-weight: bold; margin-left: 1vw; padding: 0.2vw 0.5vw; background: rgba(0,0,0,0.3); border-radius: 0.5vw;">...</span>
                    </div>
                    <div class="grid-wrapper" data-grid-id="grid-${index}" style="padding: 0.4vw; box-sizing: border-box; container-type: size; flex: 1; display: flex; flex-direction: column; min-height: 0;">
                        <div class="grid-stack" id="grid-${index}" style="flex: 1; width: 100%;"></div>
                    </div>
                </div>
            `;
        container.insertAdjacentHTML("beforeend", cardHtml);

        const gridMarginValue = 2;
        const grid = GridStack.init({
          column: designerCols,
          maxRow: designerRows,
          staticGrid: true,
          margin: gridMarginValue,
          disableOneColumnMode: true,
          float: true // Widget'ların X ve Y eksenine sadık kalmasını sağlar
        }, `#grid-${index}`);

        gridsMap[`grid-${index}`] = grid;
        let currentSpIndex = 0;

        function showSp(spIndex) {
          const spId = spIds[spIndex];
          activeSpMap[machineId] = spId;

          const titleEl = document.getElementById(`title-${machineId}`);
          if (titleEl) {
            titleEl.innerHTML = `${machineId} <span style="color: #94a3b8; font-size: 0.4vw; font-weight: bold; margin-left: 1vw; padding: 0.2vw 0.5vw; background: rgba(0,0,0,0.3); border-radius: 0.5vw;">${spId}</span>`;
          }

          const spDesign = andonSpDesigns[spId] || (template.designs ? template.designs[spId] : []) || [];

          grid.removeAll();

          const widgets = spDesign.map(widget => ({
            x: parseInt(widget.x) || 0,
            y: parseInt(widget.y) || 0,
            w: parseInt(widget.w) || 2,
            h: parseInt(widget.h) || 2,
            id: widget.id,
            content: `
                        <div style="height: 100%; width: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(145deg, #1a1c23 0%, #121418 100%); border: 0.1vw solid #2a2d35; border-radius: 0.4vw; box-shadow: inset 0 0.5vw 1vw rgba(0,0,0,0.5); box-sizing: border-box; overflow: hidden;">
                            <div style="font-size: 6cqmin; font-weight: bold; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1vw; margin-bottom: 2cqmin; text-align: center; width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${widget.id}
                            </div>
                            <div class="metric-value" id="val-${machineId}-${widget.id}" style="font-size: 11cqmin; font-weight: bold; color: #e2e8f0; text-shadow: 0 0 1vw rgba(255,255,255,0.2); text-align: center; width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                --
                            </div>
                        </div>
                    `
          }));

          grid.load(widgets);
        }

        // İlk SP'yi göster
        showSp(0);

        // Birden fazla SP varsa rotasyon başlat
        if (spIds.length > 1) {
          const spDuration = rotationInterval / spIds.length;
          const timer = setInterval(() => {
            currentSpIndex = (currentSpIndex + 1) % spIds.length;
            showSp(currentSpIndex);
          }, spDuration);
          spTimers.push(timer);
        }

        // --- MİLİMETRİK YÜKSEKLİK HESAPLAYICI (Boşlukları Kapatan Kısım) ---
        const wrapperElement = document.querySelector(`.grid-wrapper[data-grid-id="grid-${index}"]`);
        if (wrapperElement) {
          const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
              const availableHeight = entry.contentRect.height;

              if (availableHeight > 20) {
                // Küsüratlı matematik, float problemi giderildi.
                const cellH = (availableHeight - ((designerRows - 1) * gridMarginValue)) / designerRows;
                grid.cellHeight(cellH);
              }
            }
          });
          resizeObserver.observe(wrapperElement);
        }
      });
    } catch (error) {
      console.error("Dashboard render error:", error);
      container.innerHTML = `<h3 style="color:red; text-align:center; margin-top:20vh;">Şablon oluşturulurken bir hata oluştu: ${error.message}</h3>`;
    }
  }

  // İlk Çalıştırma
  renderTemplate(templates[currentIndex]);

  // Şablon Döngüsü
  if (templates.length > 1) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % templates.length;
      renderTemplate(templates[currentIndex]);
    }, rotationInterval);
  }

  // Veri Simülasyonu
  setInterval(() => {
    currentMapping.forEach(mapObj => {
      const machineId = mapObj.machineId;
      const spId = activeSpMap[machineId];
      if (!spId) return;

      const currentTemplate = templates[currentIndex];
      const spDesign = andonSpDesigns[spId] || (currentTemplate.designs ? currentTemplate.designs[spId] : []) || [];

      spDesign.forEach(widget => {
        const valElement = document.getElementById(`val-${machineId}-${widget.id}`);
        if (valElement) {
          if (widget.id === "OEE Değeri") {
            const oee = Math.floor(Math.random() * (100 - 60) + 60);
            valElement.innerText = "%" + oee;
            valElement.style.color = oee < 75 ? "#ff3333" : (oee < 85 ? "#ffaa00" : "#00ff88");
          } else if (widget.id === "Üretim") {
            valElement.innerText = Math.floor(Math.random() * 500);
          } else if (widget.id === "Stok") {
            valElement.innerText = Math.floor(Math.random() * 100);
          } else {
            // Tanımsız değerler için
            valElement.innerText = Math.floor(Math.random() * 100);
          }
        }
      });
    });
  }, 2000);
});
