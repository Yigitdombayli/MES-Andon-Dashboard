let dashboardGrid;

function initConfiguration() {
  const templates = serverTemplates;

  const savedMachines =
    JSON.parse(localStorage.getItem("savedMachineSelections")) || [];
  savedMachines.forEach((id) => {
    const checkbox = document.getElementById(id);
    if (checkbox) checkbox.checked = true;
  });

  const savedLayout = localStorage.getItem("selectedLayout");
  if (savedLayout) {
    const layoutRadio = document.querySelector(
      `.layout-radio[value="${savedLayout}"]`,
    );
    if (layoutRadio) layoutRadio.checked = true;
  }

  const savedTemplateId = localStorage.getItem("selectedTemplate");
  if (savedTemplateId) {
    const templateRadio = document.querySelector(
      `.template-radio[value="${savedTemplateId}"]`,
    );
    if (templateRadio) {
      templateRadio.checked = true;
    }
  }

  setupGridStack(savedLayout);

  if (savedTemplateId) {
    updateDataPool(savedTemplateId, templates);
  }

  validateSelections();

  document.querySelectorAll(".machine-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const selectedIds = Array.from(
        document.querySelectorAll(".machine-checkbox:checked"),
      ).map((cb) => cb.id);
      localStorage.setItem(
        "savedMachineSelections",
        JSON.stringify(selectedIds),
      );
      validateSelections();
    });
  });

  document.querySelectorAll(".layout-radio").forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const newLayout = e.target.value;
      localStorage.setItem("selectedLayout", newLayout);

      validateSelections();
      setupGridStack(newLayout);
    });
  });

  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("template-radio")) {
      const tId = e.target.value;
      localStorage.setItem("selectedTemplate", tId);

      if (dashboardGrid) dashboardGrid.removeAll();
      updateDataPool(tId, templates);
    }
  });
}

function setupGridStack(layoutValue) {
  const designerArea = document.getElementById("cardDesignerArea");

  if (dashboardGrid) {
    dashboardGrid.destroy(false);
    designerArea.innerHTML = "";
  }

  if (!layoutValue) return;

  let gridCols = 8;
  let gridRows = 8;
  let widthVal = 100;
  let heightVal = 100;

  if (layoutValue === "2x2") {
    gridCols = 12;
    gridRows = 12;
    widthVal = 50; 
    heightVal = 50; 
  } else if (layoutValue === "3x3") {
    gridCols = 12;
    gridRows = 12;
    widthVal = 33.33; 
    heightVal = 33.33; 
  } else if (layoutValue === "4x3") {
    gridCols = 12;
    gridRows = 9;
    widthVal = 25; 
    heightVal = 33.33; 
  } else if (layoutValue === "4x4") {
    gridCols = 12;
    gridRows = 12;
    widthVal = 25; 
    heightVal = 25; 
  }

  designerArea.style.width = widthVal + "vw";
  designerArea.style.height = heightVal + "vh";
  designerArea.style.maxWidth = "100%";
  designerArea.style.minHeight = heightVal + "vh";
  designerArea.style.border = "2px dashed #0d6efd";
  designerArea.style.backgroundColor = "#111";
  designerArea.style.overflow = "hidden";
  designerArea.style.boxSizing = "border-box"; 

  const calculatedCellHeight = (heightVal / gridRows) + "vh";

  dashboardGrid = GridStack.init(
    {
      column: gridCols,
      maxRow: gridRows,
      cellHeight: calculatedCellHeight, 
      acceptWidgets: ".grid-stack-item",
      removable: true,
      margin: '0.3vh',
      float: true,
      resizable: {
        handles: "e, se, s, sw, w",
      },
      dragInOptions: {
        revert: "invalid",
        scroll: false,
        appendTo: "body",
        helper: "clone",
      },
    },
    "#cardDesignerArea",
  );

 dashboardGrid.on("dropped", function (event, previousWidget, newWidget) {
    const el = newWidget.el;

    el.style.width = "";
    el.style.height = "";

    dashboardGrid.update(el, { w: 3, h: 3 });

    const metricId = newWidget.id || el.getAttribute("gs-id");
    if (metricId) {
      const poolItem = document.querySelector(`#incomingDataPool .grid-stack-item[gs-id="${metricId}"]`);
      if (poolItem) {
        poolItem.style.display = "none";
      }
    }
  });

  dashboardGrid.on("removed", function (event, items) {
    items.forEach((item) => {
      const metricId = item.id || (item.el ? item.el.getAttribute("gs-id") : null);
      
      if (metricId) {
        const poolItem = document.querySelector(`#incomingDataPool .grid-stack-item[gs-id="${metricId}"]`);
        if (poolItem) {
          poolItem.style.display = ""; 
        }
      }
    });
  });
}

function validateSelections() {
  const selectedMachines = document.querySelectorAll(
    ".machine-checkbox:checked",
  );
  const machineCount = selectedMachines.length;
  const layoutRadios = document.querySelectorAll(".layout-radio");

  layoutRadios.forEach((radio) => {
    const dims = radio.value.split("x");
    const capacity = parseInt(dims[0]) * parseInt(dims[1]);

    if (machineCount > capacity) {
      radio.disabled = true;
      if (radio.checked) {
        radio.checked = false;
        localStorage.removeItem("selectedLayout");
      }
    } else {
      radio.disabled = false;
    }
  });

  const allMachineCheckboxes = document.querySelectorAll(".machine-checkbox");
  const currentSelectedLayout = document.querySelector(".layout-radio:checked");

  if (currentSelectedLayout) {
    const dims = currentSelectedLayout.value.split("x");
    const maxCapacity = parseInt(dims[0]) * parseInt(dims[1]);

    allMachineCheckboxes.forEach((cb) => {
      if (machineCount >= maxCapacity && !cb.checked) {
        cb.disabled = true;
      } else {
        cb.disabled = false;
      }
    });
  } else {
    allMachineCheckboxes.forEach((cb) => (cb.disabled = false));
  }
}

function updateDataPool(templateId, templates) {
  const incomingDataPool = document.getElementById("incomingDataPool");
  const selectedTemplate = templates.find(
    (t) => t.id === templateId || t.Id === templateId,
  );

  incomingDataPool.innerHTML = "";
  const metricsArray = selectedTemplate
    ? selectedTemplate.metrics || selectedTemplate.Metrics
    : null;

  if (metricsArray) {
    metricsArray.forEach((metric) => {
      const widget = document.createElement("div");
      widget.className = "grid-stack-item text-center";

      widget.setAttribute("gs-w", "3"); 
      widget.setAttribute("gs-h", "3"); 
      widget.setAttribute("data-gs-width", "3"); 
      widget.setAttribute("data-gs-height", "3");

      widget.setAttribute("gs-id", metric);

      widget.innerHTML = `
        <div class="grid-stack-item-content" style="background-color: #2b3035; border: 1px solid #495057; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: grab; color: #fff; font-size: 1vw;">
            ${metric}
        </div>
      `;

      incomingDataPool.appendChild(widget);
    });

    GridStack.setupDragIn(".data-pool .grid-stack-item", {
      appendTo: "body",
      helper: function (event) {
        const original = event.target.closest(".grid-stack-item");
        const clone = original.cloneNode(true);

        clone.setAttribute("gs-w", "3");
        clone.setAttribute("gs-h", "3");

        clone.style.width = "10vw"; 
        clone.style.height = "10vh"; 

        return clone;
      },
      start: function (event, ui) {
        const el = ui.helper[0];
        console.log("Drag started:", {
          w: el.getAttribute("gs-w"),
          h: el.getAttribute("gs-h"),
        });
      },
    });
  } else {
    incomingDataPool.innerHTML =
      '<span class="text-muted small">Bu şablona ait veri bulunamadı.</span>';
  }
}

document.getElementById("btnSubmit").addEventListener("click", () => {
  const selectedMachines = Array.from(document.querySelectorAll(".machine-checkbox:checked")).map((cb) => cb.value);
  const selectedLayout = document.querySelector(".layout-radio:checked")?.value;
  const selectedTemplate = document.querySelector(".template-radio:checked")?.value;
  const arrangedWidgets = dashboardGrid.save();

  if (selectedMachines.length === 0 || !selectedLayout || !selectedTemplate || arrangedWidgets.length === 0) {
    alert("Lütfen makine, layout, şablon seçin ve en az bir veriyi tasarım alanına sürükleyin!");
    return;
  }

  const dims = selectedLayout.split("x");
  const requiredCapacity = parseInt(dims[0]) * parseInt(dims[1]);

  if (selectedMachines.length !== requiredCapacity) {
    alert(`Seçtiğiniz ${selectedLayout} layout'u için tam olarak ${requiredCapacity} makine seçmelisiniz!`);
    return;
  }

  let designerCols = 8;
  let designerRows = 8;
  if (selectedLayout === "2x2" || selectedLayout === "3x3" || selectedLayout === "4x4") {
    designerCols = 12;
    designerRows = 12;
  } else if (selectedLayout === "4x3") {
    designerCols = 12;
    designerRows = 9;
  }

  const configPayload = {
    machines: selectedMachines,
    layout: selectedLayout,
    template: selectedTemplate,
    cardDesignGrid: arrangedWidgets,
    designerCols: designerCols, 
    designerRows: designerRows  
  };

  localStorage.setItem("andonConfig", JSON.stringify(configPayload));

  window.location.href = "/Home/Dashboard";
});

initConfiguration();