let currentLayout = null;
let currentSpId = null;
let dashboardGrid;
let tempSpDesigns = {}; 

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const step3 = document.getElementById("step3");


document.getElementById("btnNext1").addEventListener("click", () => {
    const layoutRadio = document.querySelector(".layout-radio:checked");
    if (!layoutRadio) {
        alert("Lütfen bir Layout seçiniz!");
        return;
    }
    
    currentLayout = layoutRadio.value;
    document.getElementById("selectedLayoutDisplay").innerText = "Seçilen Layout: " + currentLayout;
    
    setupGridStack(currentLayout);
    step1.classList.add("d-none");
    step2.classList.remove("d-none");
});

document.getElementById("btnBack1").addEventListener("click", () => {
    step2.classList.add("d-none");
    step1.classList.remove("d-none");
});

document.getElementById("btnNext2").addEventListener("click", () => {
    if (Object.keys(tempSpDesigns).length === 0) {
        alert("Lütfen eşleştirme aşamasına geçmeden önce en az 1 tane SP tasarlayıp 'Hafızaya Al' butonuna basın.");
        return;
    }

    generateMappingArea(currentLayout);
    step2.classList.add("d-none");
    step3.classList.remove("d-none");
});

document.getElementById("btnBack2").addEventListener("click", () => {
    step3.classList.add("d-none");
    step2.classList.remove("d-none");
});



document.querySelectorAll(".procedure-radio").forEach((radio) => {
    radio.addEventListener("change", (e) => {
        currentSpId = e.target.id;
        
        if (dashboardGrid) dashboardGrid.removeAll();
        updateDataPool(currentSpId, procedures);

        if (tempSpDesigns[currentSpId]) {
            dashboardGrid.load(tempSpDesigns[currentSpId]);
        }
    });
});

document.getElementById("btnSaveSpDesign").addEventListener("click", () => {
    if (!currentSpId) {
        alert("Lütfen önce listeden bir Prosedür seçin.");
        return;
    }
    tempSpDesigns[currentSpId] = dashboardGrid.save();
    alert(`"${currentSpId}" prosedürünün tasarımı hafızaya alındı!`);
});



function generateMappingArea(layout) {
    const mappingArea = document.getElementById("mappingArea");
    mappingArea.innerHTML = ""; 

    const dims = layout.split("x");
    const capacity = parseInt(dims[0]) * parseInt(dims[1]); 

    let machineOptions = `<option value="">Makine Seçin...</option>`;
    machines.forEach(m => machineOptions += `<option value="${m.Id}">${m.Name}</option>`);

    let spOptions = `<option value="">SP Seçin...</option>`;
    Object.keys(tempSpDesigns).forEach(spId => spOptions += `<option value="${spId}">${spId} Tasarımı</option>`);

    for (let i = 1; i <= capacity; i++) {
        const slotHtml = `
            <div class="col-md-6 mb-3">
                <div class="p-3 border border-secondary rounded bg-dark">
                    <h6>Slot ${i} Eşleştirmesi</h6>
                    <select class="form-select bg-dark text-light border-secondary mb-2 mapping-machine" data-slot="${i}">
                        ${machineOptions}
                    </select>
                    <select class="form-select bg-dark text-light border-secondary mapping-sp" data-slot="${i}">
                        ${spOptions}
                    </select>
                </div>
            </div>
        `;
        mappingArea.insertAdjacentHTML('beforeend', slotHtml);
    }
}

document.getElementById("btnSaveFinalTemplate").addEventListener("click", () => {
    const templateName = document.getElementById("templateNameInput").value.trim();
    if (!templateName) {
        alert("Lütfen şablon için bir isim girin.");
        return;
    }

    const mappings = [];
    let hasError = false;

    document.querySelectorAll(".mapping-machine").forEach((machineSelect) => {
        const slotId = machineSelect.getAttribute("data-slot");
        const spSelect = document.querySelector(`.mapping-sp[data-slot="${slotId}"]`);
        
        if (machineSelect.value !== "" && spSelect.value !== "") {
            mappings.push({
                slot: slotId,
                machineId: machineSelect.value,
                spId: spSelect.value
            });
        }
    });

    if (mappings.length === 0) {
        alert("Lütfen en az bir makine ile SP'yi eşleştirin.");
        return;
    }

    const newTemplate = {
        templateName: templateName,
        layout: currentLayout,
        designs: tempSpDesigns,
        mapping: mappings
    };

    let allTemplates = JSON.parse(localStorage.getItem("andonTemplates")) || [];
    allTemplates.push(newTemplate);
    localStorage.setItem("andonTemplates", JSON.stringify(allTemplates));

    alert("Şablon başarıyla oluşturuldu! Ana ekrana yönlendiriliyorsunuz.");
    
    window.location.href = "/Home/Index"; 
});



function setupGridStack(layoutValue) {
    const designerArea = document.getElementById("cardDesignerArea");
    if (dashboardGrid) {
        dashboardGrid.destroy(false);
        designerArea.innerHTML = "";
    }
    
    let gridCols = 12, gridRows = 12, widthVal = 100, heightVal = 100;
    if (layoutValue === "2x2") { widthVal = 50; heightVal = 50; } 
    else if (layoutValue === "3x3") { widthVal = 33.33; heightVal = 33.33; } 
    else if (layoutValue === "4x3") { gridRows = 9; widthVal = 25; heightVal = 33.33; } 
    else if (layoutValue === "4x4") { widthVal = 25; heightVal = 25; }

    designerArea.style.width = widthVal + "vw";
    designerArea.style.height = heightVal + "vh";
    designerArea.style.minHeight = heightVal + "vh";
    designerArea.style.border = "2px dashed #0d6efd";
    designerArea.style.backgroundColor = "#111";

    dashboardGrid = GridStack.init({
        column: gridCols, maxRow: gridRows, cellHeight: (heightVal / gridRows) + "vh", 
        acceptWidgets: ".grid-stack-item", removable: true, float: true,
        dragInOptions: { revert: "invalid", scroll: false, appendTo: "body", helper: "clone" },
    }, "#cardDesignerArea");

    dashboardGrid.on("dropped", (e, p, newWidget) => {
        dashboardGrid.update(newWidget.el, { w: 3, h: 3 });
        togglePool(newWidget.el, "none");
    });
    dashboardGrid.on("removed", (e, items) => {
        items.forEach(item => togglePool(item.el, ""));
    });
}

function togglePool(el, display) {
    const metricId = el ? el.getAttribute("gs-id") : null;
    if (metricId) {
        const poolItem = document.querySelector(`#incomingDataPool .grid-stack-item[gs-id="${metricId}"]`);
        if (poolItem) poolItem.style.display = display;
    }
}

function updateDataPool(templateId, templates) {
    const pool = document.getElementById("incomingDataPool");
    pool.innerHTML = "";
    const selectedTemplate = templates.find(t => t.Id === templateId || t.id === templateId);
    const metricsArray = selectedTemplate ? (selectedTemplate.Metrics || selectedTemplate.metrics) : null;

    if (metricsArray) {
        metricsArray.forEach(metric => {
            const widget = document.createElement("div");
            widget.className = "grid-stack-item text-center";
            widget.setAttribute("gs-w", "3"); widget.setAttribute("gs-h", "3");
            widget.setAttribute("gs-id", metric);
            widget.innerHTML = `<div class="grid-stack-item-content" style="background-color: #2b3035; border: 1px solid #495057; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: grab; color: #fff; font-size: 1vw;">${metric}</div>`;
            pool.appendChild(widget);
        });

        GridStack.setupDragIn(".data-pool .grid-stack-item", {
            appendTo: "body",
            helper: (e) => {
                const clone = e.target.closest(".grid-stack-item").cloneNode(true);
                clone.style.width = "10vw"; clone.style.height = "10vh";
                return clone;
            }
        });
    } else {
        pool.innerHTML = '<span class="text-muted small">Bu prosedüre ait veri bulunamadı.</span>';
    }
}