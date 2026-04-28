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

    // Şablonu ekrana çizen ana fonksiyon
    function renderTemplate(template) {
        // 1. Önceki GridStack nesnelerini ve DOM'u temizle (Çakışmayı önler)
        Object.values(gridsMap).forEach(grid => grid.destroy(false));
        gridsMap = {};
        container.innerHTML = "";

        // 2. Ana Container'ın CSS Grid yapısını şablonun layout'una göre ayarla
        const dims = template.layout.split("x"); // Örn: "2x2" -> cols:2, rows:2
        container.style.display = "grid";
        container.style.gridTemplateColumns = `repeat(${dims[0]}, 1fr)`;
        container.style.gridTemplateRows = `repeat(${dims[1]}, 1fr)`;
        container.style.height = "100vh";
        container.style.gap = "1vw";
        container.style.padding = "1vw";
        container.style.boxSizing = "border-box";

        // GridStack iç tasarım oranları
        let designerCols = 12;
        let designerRows = template.layout === "4x3" ? 9 : 12;

        currentMapping = template.mapping; // Veri simülasyonu için global değişkene at

        // 3. Eşleştirilen (Makine - SP) verilerini döngüye al ve kartları oluştur
        template.mapping.forEach((mapObj, index) => {
            const machineId = mapObj.machineId;
            const spId = mapObj.spId;
            const spDesign = template.designs[spId] || []; // SP'nin kaydedilmiş tasarımı

            // Kart İskeleti
            const cardHtml = `
                <div class="machine-card" style="background:#111; border: 1px solid #333; display:flex; flex-direction:column; overflow:hidden; border-radius: 0.5vw;">
                    <div class="machine-title" style="background:#222; color:#fff; padding:0.5vw; text-align:center; font-weight:bold; font-size: 1.5vw; border-bottom: 1px solid #444;">
                        ${machineId} <span style="color:#0d6efd; font-size:1vw;">(${spId})</span>
                    </div>
                    <div class="grid-wrapper" data-grid-id="grid-${index}" style="flex-grow:1; position:relative;">
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
                    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #1e1e1e; border: 1px solid #444; border-top: 0.2vw solid #00ff88; border-radius: 0.4vw;">
                        <div style="font-size: 1.1vw; font-weight: 500; color: #888; text-transform: uppercase;">
                            ${widget.id}
                        </div>
                        <div class="metric-value" id="val-${machineId}-${widget.id}" style="font-size: 2.2vw; font-weight: 700; color: #fff;">
                            --
                        </div>
                    </div>
                `
            }));

            grid.load(widgets);
            gridsMap[`grid-${index}`] = grid;

            // Responsive hücre yüksekliği için ResizeObserver
            const wrapperElement = document.querySelector(`.grid-wrapper[data-grid-id="grid-${index}"]`);
            const resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const availableHeight = entry.contentRect.height;
                    const dynamicCellHeight = Math.floor(availableHeight / designerRows);
                    grid.cellHeight(dynamicCellHeight + "px");
                }
            });
            resizeObserver.observe(wrapperElement);
        });
    }

    // İLK ÇALIŞTIRMA (İlk şablonu yükle)
    renderTemplate(templates[currentIndex]);

    // ŞABLON DÖNGÜSÜ (Eğer 1'den fazla şablon seçildiyse 60 saniyede bir değiştir)
    if (templates.length > 1) {
        setInterval(() => {
            currentIndex = (currentIndex + 1) % templates.length;
            renderTemplate(templates[currentIndex]);
        }, 60000); 
    }

    // VERİ SİMÜLASYONU (Her 2 saniyede bir o an ekranda olan eşleştirmeleri günceller)
    setInterval(() => {
        currentMapping.forEach(mapObj => {
            const machineId = mapObj.machineId;
            const spId = mapObj.spId;
            const currentTemplate = templates[currentIndex];
            const spDesign = currentTemplate.designs[spId] || [];

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