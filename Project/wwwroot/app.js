        document.addEventListener("DOMContentLoaded", () => {
            const allTemplates = JSON.parse(localStorage.getItem("andonTemplates")) || [];
            const listArea = document.getElementById("templateListArea");

            if (allTemplates.length === 0) {
                listArea.innerHTML = '<div class="col-12"><div class="alert alert-warning">Henüz kaydedilmiş bir şablon yok. Önce sihirbazdan şablon oluşturun.</div></div>';
                return;
            }

            allTemplates.forEach((tpl, index) => {
                const card = `
                    <div class="col-md-6">
                        <div class="card bg-dark text-light border-secondary">
                            <div class="card-body">
                                <div class="form-check">
                                    <input class="form-check-input template-checkbox fs-5" type="checkbox" value="${index}" id="tpl_${index}">
                                    <label class="form-check-label fs-5 ms-2" for="tpl_${index}">
                                        ${tpl.templateName}
                                    </label>
                                </div>
                                <div class="mt-2 text-muted small">
                                    Layout: ${tpl.layout} | Eşleşen Makine: ${tpl.mapping.length}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                listArea.insertAdjacentHTML('beforeend', card);
            });

            document.getElementById("btnStartDashboard").addEventListener("click", () => {
                const selectedIndexes = Array.from(document.querySelectorAll(".template-checkbox:checked")).map(cb => cb.value);
                
                if (selectedIndexes.length === 0) {
                    alert("Lütfen yayına almak için en az bir şablon seçin!");
                    return;
                }

                const activeTemplates = selectedIndexes.map(idx => allTemplates[idx]);
                
                localStorage.setItem("activeDashboardTemplates", JSON.stringify(activeTemplates));
                
                window.location.href = "/Home/Dashboard"; 
            });
        });