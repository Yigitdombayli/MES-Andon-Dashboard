        let currentSpId = null;
        let dashboardGrid;
        
        // Load global SP designs from localStorage
        let andonSpDesigns = JSON.parse(localStorage.getItem("andonSpDesigns")) || {};

        document.addEventListener("DOMContentLoaded", () => {
            const proceduresDataEl = document.getElementById("procedures-data");
            const procedures = proceduresDataEl ? JSON.parse(proceduresDataEl.getAttribute("data-procedures")) : [];

            setupGridStack();

            document.querySelectorAll(".procedure-radio").forEach((radio) => {
                radio.addEventListener("change", (e) => {
                    currentSpId = e.target.id;
                    
                    if (dashboardGrid) dashboardGrid.removeAll();
                    updateDataPool(currentSpId, procedures);

                    if (andonSpDesigns[currentSpId]) {
                        const savedWidgets = andonSpDesigns[currentSpId].map(w => ({
                            ...w,
                            content: `<div class="grid-stack-item-content p-2" style="height: 100%; width: 100%; background-color: #1f2937; border: 0.1vw solid #374151; border-radius: 0.4vw; display: flex; align-items: center; justify-content: center; cursor: grab; color: #f8fafc; font-weight: 500; font-size: 1vw; box-shadow: inset 0 0 0.5vw rgba(0,0,0,0.5);">${w.id}</div>`
                        }));
                        dashboardGrid.load(savedWidgets);
                        
                        // Hide items from pool that are already in grid
                        savedWidgets.forEach(item => {
                            togglePool(null, "none", item.id);
                        });
                    }
                });
            });

            document.getElementById("btnSaveSpDesign").addEventListener("click", () => {
                if (!currentSpId) {
                    alert("Lütfen önce listeden bir Prosedür seçin.");
                    return;
                }
                andonSpDesigns[currentSpId] = dashboardGrid.save();
                localStorage.setItem("andonSpDesigns", JSON.stringify(andonSpDesigns));
                alert(`"${currentSpId}" prosedürünün tasarımı tüm sistemde geçerli olacak şekilde kaydedildi!`);
            });
        });

        function setupGridStack() {
            const designerArea = document.getElementById("cardDesignerArea");
            
            designerArea.style.width = "100%";
            designerArea.style.height = "50vh";
            designerArea.style.minHeight = "50vh";
            designerArea.style.border = "0.15vw dashed #0d6efd";
            designerArea.style.backgroundColor = "#111";

            dashboardGrid = GridStack.init({
                column: 12, maxRow: 12, cellHeight: "4vh", 
                acceptWidgets: ".grid-stack-item", removable: true, float: true,
                dragInOptions: { revert: "invalid", scroll: false, appendTo: "body", helper: "clone" },
            }, "#cardDesignerArea");

            dashboardGrid.on("dropped", (e, p, newWidget) => {
                // Sürüklenen elementin üzerindeki havuzdan kalma sabit boyutları sil
                if (newWidget.el) {
                    newWidget.el.style.width = "";
                    newWidget.el.style.height = "";
                    newWidget.el.style.position = "";
                }
                dashboardGrid.update(newWidget.el, { w: 3, h: 3 });
                togglePool(newWidget.el, "none");
            });
            dashboardGrid.on("removed", (e, items) => {
                items.forEach(item => togglePool(item.el, ""));
            });
        }

        function togglePool(el, display, explicitId = null) {
            const metricId = explicitId || (el ? el.getAttribute("gs-id") : null);
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
                    // Inline styling to match the dashboard item style roughly
                    widget.innerHTML = `<div class="grid-stack-item-content p-2" style="height: 100%; width: 100%; background-color: #1f2937; border: 0.1vw solid #374151; border-radius: 0.4vw; display: flex; align-items: center; justify-content: center; cursor: grab; color: #f8fafc; font-weight: 500; font-size: 1vw; box-shadow: inset 0 0 0.5vw rgba(0,0,0,0.5);">${metric}</div>`;
                    widget.style.width = "8vw";
                    widget.style.height = "4vw";
                    widget.style.position = "relative";
                    pool.appendChild(widget);
                });

                GridStack.setupDragIn(".data-pool .grid-stack-item", {
                    appendTo: "body",
                    helper: (e) => {
                        const clone = e.target.closest(".grid-stack-item").cloneNode(true);
                        clone.style.width = "10vw"; clone.style.height = "10vw";
                        return clone;
                    }
                });
            } else {
                pool.innerHTML = '<span class="text-muted small">Bu prosedüre ait veri bulunamadı.</span>';
            }
        }
