        document.addEventListener("DOMContentLoaded", () => {
            const layoutRadios = document.querySelectorAll(".layout-radio");
            const machineCheckboxes = document.querySelectorAll(".machine-checkbox");
            const capacityInfo = document.getElementById("capacityInfo");
            
            let selectedCapacity = 0;

            // Önceden kaydedilmiş taslak varsa yükle
            const draft = JSON.parse(sessionStorage.getItem("draftTemplate"));
            if (draft) {
                if (draft.layout) {
                    const r = document.querySelector(`.layout-radio[value="${draft.layout}"]`);
                    if (r) { r.checked = true; updateCapacity(draft.layout); }
                }
                if (draft.selectedMachines) {
                    draft.selectedMachines.forEach(m => {
                        const cb = document.querySelector(`.machine-checkbox[value="${m.id}"]`);
                        if (cb) cb.checked = true;
                    });
                }
            }

            layoutRadios.forEach(radio => {
                radio.addEventListener("change", (e) => {
                    updateCapacity(e.target.value);
                });
            });

            function updateCapacity(layoutStr) {
                const parts = layoutStr.split("x");
                selectedCapacity = parseInt(parts[0]) * parseInt(parts[1]);
                capacityInfo.innerText = `(Kapasite: ${selectedCapacity})`;
                checkSelectionLimit();
            }

            machineCheckboxes.forEach(cb => {
                cb.addEventListener("change", checkSelectionLimit);
            });

            document.getElementById("selectAllBtn").addEventListener("click", () => {
                if (selectedCapacity === 0) {
                    alert("Lütfen önce Layout seçin.");
                    return;
                }
                let count = 0;
                machineCheckboxes.forEach(cb => {
                    if (count < selectedCapacity) {
                        cb.checked = true;
                        count++;
                    } else {
                        cb.checked = false;
                    }
                });
            });

            function checkSelectionLimit() {
                if (selectedCapacity === 0) return;
                let checkedCount = document.querySelectorAll(".machine-checkbox:checked").length;
                if (checkedCount > selectedCapacity) {
                    alert(`Seçtiğiniz layout maksimum ${selectedCapacity} makine destekliyor.`);
                    // Son seçileni kaldır (basit yaklaşım)
                    this.checked = false; 
                }
            }

            document.getElementById("btnNext").addEventListener("click", () => {
                const layout = document.querySelector(".layout-radio:checked");
                if (!layout) {
                    alert("Lütfen bir Layout seçin!");
                    return;
                }

                const selectedMachines = Array.from(document.querySelectorAll(".machine-checkbox:checked")).map(cb => {
                    return { id: cb.value, name: cb.getAttribute("data-name") };
                });

                if (selectedMachines.length === 0) {
                    alert("Lütfen şablona dahil etmek için en az bir makine seçin.");
                    return;
                }

                if (selectedMachines.length > selectedCapacity) {
                    alert(`Layout kapasitesi ${selectedCapacity}, ancak ${selectedMachines.length} makine seçtiniz.`);
                    return;
                }

                // Taslağı kaydet
                let currentDraft = JSON.parse(sessionStorage.getItem("draftTemplate")) || {};
                currentDraft.layout = layout.value;
                currentDraft.capacity = selectedCapacity;
                currentDraft.selectedMachines = selectedMachines;
                
                sessionStorage.setItem("draftTemplate", JSON.stringify(currentDraft));
                window.location.href = "/Home/MakineSpEslesme";
            });
        });
