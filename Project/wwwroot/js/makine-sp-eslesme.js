        document.addEventListener("DOMContentLoaded", () => {
            const proceduresDataEl = document.getElementById("procedures-data");
            const procedures = proceduresDataEl ? JSON.parse(proceduresDataEl.getAttribute("data-procedures")) : [];

            const draft = JSON.parse(sessionStorage.getItem("draftTemplate"));
            const andonSpDesigns = JSON.parse(localStorage.getItem("andonSpDesigns")) || {};
            
            if (!draft || !draft.selectedMachines || draft.selectedMachines.length === 0) {
                document.getElementById("noDraftAlert").classList.remove("d-none");
                return;
            }

            document.getElementById("mappingContent").classList.remove("d-none");
            document.getElementById("layoutBadge").innerText = `Layout: ${draft.layout}`;

            const mappingArea = document.getElementById("mappingArea");
            
            draft.selectedMachines.forEach((machine, idx) => {
                const slotId = idx + 1;
                
                // Önceden yapılmış eşleşme varsa onu bul
                let preSelectedSps = [];
                if (draft.mapping) {
                    const existingMap = draft.mapping.find(m => m.machineId === machine.id);
                    if (existingMap) {
                        preSelectedSps = existingMap.spIds || (existingMap.spId ? [existingMap.spId] : []);
                    }
                }

                let spCheckboxesHtml = ``;
                procedures.forEach(p => {
                    const isDesigned = andonSpDesigns[p.Id] || andonSpDesigns[p.Name] ? ` <span class="badge bg-success ms-2 text-white" style="font-size: 0.65em;">Tasarımı Var</span>` : "";
                    spCheckboxesHtml += `
                        <div class="form-check mb-2">
                            <input class="form-check-input mapping-sp-checkbox border-secondary" style="background-color: #2b3035; cursor: pointer;" type="checkbox" value="${p.Id}" id="sp_${p.Id}_slot_${slotId}" data-slot="${slotId}">
                            <label class="form-check-label text-light w-100" for="sp_${p.Id}_slot_${slotId}" style="cursor: pointer;">
                                ${p.Name}${isDesigned}
                            </label>
                        </div>
                    `;
                });

                const slotHtml = `
                    <div class="col-md-6">
                        <div class="p-3 border border-secondary rounded bg-dark h-100 d-flex flex-column">
                            <div class="mb-3 border-bottom border-secondary pb-2">
                                <h6 class="text-info mb-1"><i class="bi bi-display me-2"></i>${machine.name}</h6>
                                <small class="text-muted" style="font-size: 0.8rem;">Eşleştirilecek SP'leri seçin</small>
                            </div>
                            <input type="hidden" class="mapping-machine" data-slot="${slotId}" value="${machine.id}" />
                            <div class="sp-checkbox-container flex-grow-1" style="max-height: 250px; overflow-y: auto; padding-right: 10px;">
                                ${spCheckboxesHtml}
                            </div>
                        </div>
                    </div>
                `;
                mappingArea.insertAdjacentHTML('beforeend', slotHtml);
                
                // Set pre-selected value
                if (preSelectedSps.length > 0) {
                    const checkboxes = mappingArea.querySelectorAll(`.mapping-sp-checkbox[data-slot="${slotId}"]`);
                    checkboxes.forEach(cb => {
                        if (preSelectedSps.includes(cb.value)) {
                            cb.checked = true;
                        }
                    });
                }
            });

            document.getElementById("btnNext").addEventListener("click", () => {
                const mappings = [];
                let hasEmpty = false;

                document.querySelectorAll(".mapping-machine").forEach((machineInput) => {
                    const slotId = machineInput.getAttribute("data-slot");
                    const selectedCheckboxes = document.querySelectorAll(`.mapping-sp-checkbox[data-slot="${slotId}"]:checked`);
                    
                    const selectedSpIds = Array.from(selectedCheckboxes).map(cb => cb.value);
                    
                    if (selectedSpIds.length > 0) {
                        mappings.push({
                            slot: slotId,
                            machineId: machineInput.value,
                            spIds: selectedSpIds,
                            spId: selectedSpIds[0] // for backwards compatibility
                        });
                    } else {
                        hasEmpty = true;
                    }
                });

                if (mappings.length === 0) {
                    alert("Lütfen en az bir makine ile SP'yi eşleştirin.");
                    return;
                }
                
                if (hasEmpty) {
                    const confirmRes = confirm("Bazı makineler için SP seçmediniz. Devam etmek istiyor musunuz?");
                    if (!confirmRes) return;
                }

                // Taslağı güncelle
                draft.mapping = mappings;
                sessionStorage.setItem("draftTemplate", JSON.stringify(draft));
                
                window.location.href = "/Home/SablonKayit";
            });
        });
