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
    const andonSpDesigns = JSON.parse(localStorage.getItem("andonSpDesigns")) || {};

    // Şablonu ekrana çizen ana fonksiyon
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

            // 1. Önceki GridStack nesnelerini ve DOM'u temizle (Çakışmayı önler)
            Object.values(gridsMap).forEach(grid => grid.destroy(false));
            gridsMap = {};
            container.innerHTML = "";

            // 2. Ana Container'ın CSS Grid yapısını şablonun layout'una göre ayarla
            const dims = template.layout.split("x"); // Örn: "2x2" -> cols:2, rows:2
            const cols = parseInt(dims[0]) || 2;
            const rows = parseInt(dims[1]) || 2;

            container.style.display = "grid";
            container.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
            container.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
            container.style.height = "100%";
            container.style.gap = "1vw";
            container.style.boxSizing = "border-box";

            // GridStack iç tasarım oranları
            let designerCols = 12;
            let designerRows = template.layout === "4x3" ? 9 : 12;

            currentMapping = template.mapping; // Veri simülasyonu için global değişkene at

            // 3. Eşleştirilen (Makine - SP) verilerini döngüye al ve kartları oluştur
            template.mapping.forEach((mapObj, index) => {
                const machineId = mapObj.machineId;
                const spId = mapObj.spId;
                const spDesign = andonSpDesigns[spId] || (template.designs ? template.designs[spId] : []) || []; // SP'nin güncel veya kaydedilmiş tasarımı

                // Kart İskeleti
                const cardHtml = `
                <div class="machine-card" style="background: #0f1115; border: 0.1vw solid #1e222a; display:flex; flex-direction:column; overflow:hidden; border-radius: 1vw; box-shadow: 0 1vw 2vw rgba(0,0,0,0.8);">
                    <div class="machine-title" style="background: linear-gradient(90deg, #1e222a 0%, #252a34 100%); color: #38bdf8; padding: 0.8vw; text-align:center; font-weight: 800; font-size: 1.5vw; border-bottom: 0.2vw solid #0284c7; letter-spacing: 0.1vw; text-shadow: 0 0 0.5vw rgba(56,189,248,0.3);">
                        ${machineId} <span style="color: #94a3b8; font-size: 1vw; font-weight: 600; margin-left: 0.5vw; padding: 0.2vw 0.5vw; background: rgba(0,0,0,0.3); border-radius: 0.5vw;">${spId}</span>
                    </div>
                    <div class="grid-wrapper" data-grid-id="grid-${index}" style="flex-grow:1; position:relative; padding: 0.5vw; min-height:0;">
                        <div class="grid-stack" id="grid-${index}"></div>
                    </div>
                </div>
            `;
                container.insertAdjacentHTML("beforeend", cardHtml);

                // GridStack'i başlat
                const grid = GridStack.init({
                    column: designerCols,
                    maxRow: designerRows,
                    staticGrid: true, // Sürükle bırak kapalı
                    margin: 5,
                }, `#grid-${index}`);

                // Widgetları yükle
                const widgets = spDesign.map(widget => ({
                    x: widget.x, y: widget.y, w: widget.w, h: widget.h, id: widget.id,
                    content: `
                    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(145deg, #1a1c23 0%, #121418 100%); border: 0.1vw solid #2a2d35; border-radius: 0.8vw; box-shadow: inset 0 0.5vw 1vw rgba(0,0,0,0.5);">
                        <div style="font-size: 1vw; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1vw; margin-bottom: 0.5vw;">
                            ${widget.id}
                        </div>
                        <div class="metric-value" id="val-${machineId}-${widget.id}" style="font-size: 2.5vw; font-weight: 700; color: #e2e8f0; text-shadow: 0 0 1vw rgba(255,255,255,0.2);">
                            --
                        </div>
                    </div>
                `
                }));

                grid.load(widgets);
                gridsMap[`grid-${index}`] = grid;

                // Responsive hücre yüksekliği için ResizeObserver
                const wrapperElement = document.querySelector(`.grid-wrapper[data-grid-id="grid-${index}"]`);
                if (wrapperElement) {
                    const resizeObserver = new ResizeObserver((entries) => {
                        for (let entry of entries) {
                            const availableHeight = entry.contentRect.height;
                            if (availableHeight > 0) {
                                const dynamicCellHeight = Math.floor(availableHeight / designerRows);
                                grid.cellHeight(dynamicCellHeight + "px");
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

    // İLK ÇALIŞTIRMA (İlk şablonu yükle)
    renderTemplate(templates[currentIndex]);

    // ŞABLON DÖNGÜSÜ (Eğer 1'den fazla şablon seçildiyse 60 saniyede bir değiştir)
    if (templates.length > 1) {
        setInterval(() => {
            currentIndex = (currentIndex + 1) % templates.length;
            renderTemplate(templates[currentIndex]);
        }, 10000);
    }

    // VERİ SİMÜLASYONU (Her 2 saniyede bir o an ekranda olan eşleştirmeleri günceller)
    setInterval(() => {
        currentMapping.forEach(mapObj => {
            const machineId = mapObj.machineId;
            const spId = mapObj.spId;
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
                        // Tanımsız değerler için rastgele sayı
                        valElement.innerText = Math.floor(Math.random() * 100);
                    }
                }
            });
        });
    }, 2000);
});