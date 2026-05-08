  document.addEventListener("DOMContentLoaded", () => {
    const draft = JSON.parse(sessionStorage.getItem("draftTemplate"));

    if (!draft || !draft.mapping || draft.mapping.length === 0) {
      document.getElementById("noDraftAlert").classList.remove("d-none");
      return;
    }

    document.getElementById("saveContent").classList.remove("d-none");

    document.getElementById("summaryLayout").innerText = draft.layout;
    document.getElementById("summaryMachineCount").innerText = draft.selectedMachines ? draft.selectedMachines.length : 0;
    document.getElementById("summaryMappingCount").innerText = draft.mapping.length;

    if (draft.templateName) {
      document.getElementById("templateNameInput").value = draft.templateName;
    }

    document.getElementById("btnSaveFinalTemplate").addEventListener("click", () => {
      const templateName = document.getElementById("templateNameInput").value.trim();
      if (!templateName) {
        alert("Lütfen şablon için bir isim girin.");
        return;
      }

      // Global tasarımlar SP Tasarım menüsünde yapılıyor ve andonSpDesigns'a kaydoluyor.
      // Bu yüzden şablonda sadece eşleştirmeleri (hangi makinede hangi spId var) tutmak yeterli.
      // İhtiyaç halinde Dashboard bu spId'yi kullanarak global tasarımlardan render edecek.

      let allTemplates = JSON.parse(localStorage.getItem("andonTemplates")) || [];

      const newTemplate = {
        templateName: templateName,
        layout: draft.layout,
        mapping: draft.mapping,
        createdAt: new Date().toISOString()
      };

      if (draft.editIndex !== undefined && draft.editIndex !== null) {
        // Update existing template
        allTemplates[draft.editIndex] = newTemplate;
      } else {
        // Add new template
        allTemplates.push(newTemplate);
      }

      localStorage.setItem("andonTemplates", JSON.stringify(allTemplates));

      // Taslağı temizle
      sessionStorage.removeItem("draftTemplate");

      alert("Şablon başarıyla kaydedildi! Dashboarda Aktar ekranına yönlendiriliyorsunuz.");
      window.location.href = "/Home/DashboardaAktar";
    });
  });
