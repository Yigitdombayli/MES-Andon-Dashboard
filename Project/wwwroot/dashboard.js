document.addEventListener("DOMContentLoaded", () => {
    const savedConfig = localStorage.getItem("andonConfig");
    if (!savedConfig) {
        document.body.innerHTML = '<h1 style="color:red; text-align:center; margin-top:20vh; font-family:sans-serif;">Konfigürasyon Bulunamadı. Lütfen Tasarım Ekranından Ayar Gönderin.</h1>';
        return;
    }

    const config = JSON.parse(savedConfig);
    const container = document.getElementById("mainDashboardContainer");

    const dims = config.layout.split("x");
    const cols = dims[0];
    const rows = dims[1];

    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    container.style.height = "100vh";
    container.style.gap = "1vw";
    container.style.padding = "1vw";
    container.style.boxSizing = "border-box";

    const designerCols = config.designerCols || 12;
    const designerRows = config.designerRows || 12;

    const gridsMap = {};

    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const wrapper = entry.target;
            const gridId = wrapper.getAttribute("data-grid-id");
            const gridInstance = gridsMap[gridId];

            if (gridInstance) {
                const availableHeight = entry.contentRect.height;
                const dynamicCellHeight = Math.floor(availableHeight / designerRows);
                gridInstance.cellHeight(dynamicCellHeight + "px");
            }
        }
    });

    config.machines.forEach((machineId, index) => {
        const cardHtml = `
            <div class="machine-card">
                <div class="machine-title">${machineId}</div>
                <div class="grid-wrapper" data-grid-id="grid-${index}">
                    <div class="grid-stack" id="grid-${index}"></div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML("beforeend", cardHtml);

        const grid = GridStack.init({
            column: designerCols,
            maxRow: designerRows,
            staticGrid: true, 
            margin: 5,
            cellHeight: '50px'
        }, `#grid-${index}`);

        const widgetsForThisMachine = config.cardDesignGrid.map((widget) => {
            return {
                x: widget.x,
                y: widget.y,
                w: widget.w,
                h: widget.h,
                id: widget.id,
                content: `
                    <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; background: #1e1e1e; border: 1px solid #444; border-top: 0.2vw solid #00ff88; border-radius: 0.4vw;">
                        <div style="font-size: 1.1vw; font-weight: 500; color: #888; text-transform: uppercase; letter-spacing: 0.1vw; margin-bottom: 0.5vh;">
                            ${widget.id}
                        </div>
                        <div class="metric-value" id="val-${machineId}-${widget.id}" style="font-size: 2vw; font-weight: 700; color: #fff; line-height: 1;">
                            --
                        </div>
                    </div>
                `,
            };
        });

        grid.load(widgetsForThisMachine);

        gridsMap[`grid-${index}`] = grid;
        const wrapperElement = document.querySelector(`.grid-wrapper[data-grid-id="grid-${index}"]`);
        resizeObserver.observe(wrapperElement);
    });

    setInterval(() => {
        config.machines.forEach((machineId) => {
            config.cardDesignGrid.forEach((widget) => {
                const valElement = document.getElementById(`val-${machineId}-${widget.id}`);
                if (valElement) {
                    if (widget.id === "OEE Değeri") {
                        const oee = Math.floor(Math.random() * (100 - 60) + 60);
                        valElement.innerText = "%" + oee;
                        valElement.style.color = oee < 75 ? "#ff3333" : (oee < 85 ? "#ffaa00" : "#00ff88");
                    }
                    if (widget.id === "Üretim") valElement.innerText = Math.floor(Math.random() * 500);
                    if (widget.id === "Stok") valElement.innerText = Math.floor(Math.random() * 100);
                }
            });
        });
    }, 2000);
});