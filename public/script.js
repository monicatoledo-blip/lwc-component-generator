// Check Salesforce authentication status
let isAuthenticated = false;
let instanceUrl = null;

// Form state management
const FORM_STATE_KEY = "lwc_generator_form_state";
const AUTH_PENDING_KEY = "lwc_generator_auth_pending";

function saveFormState() {
  try {
    const componentSelect = document.getElementById("componentSelect");
    const selectedComponent = componentSelect.value;

    let form;
    if (selectedComponent === "unifiedProfileLwc") {
      form = document.getElementById("lwcForm");
    } else if (selectedComponent === "agentforceLeadBriefLwc") {
      form = document.getElementById("agentforceForm");
    } else if (selectedComponent === "nextBestActionsLwc") {
      form = document.getElementById("nbaForm");
    } else if (selectedComponent === "nextBestLeadsLwc") {
      form = document.getElementById("nblForm");
    } else if (selectedComponent === "engagementHistoryLwc") {
      form = document.getElementById("engagementHistoryForm");
    }

    if (!form) return;

    const formData = new FormData(form);
    const formState = {
      componentType: selectedComponent,
      fields: Object.fromEntries(formData.entries()),
      timestamp: Date.now()
    };

    sessionStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
    console.log("✅ Form state saved to sessionStorage");
  } catch (error) {
    console.error("Error saving form state:", error);
  }
}

function restoreFormState() {
  try {
    const savedState = sessionStorage.getItem(FORM_STATE_KEY);
    if (!savedState) return false;

    const formState = JSON.parse(savedState);

    // Check if state is too old (older than 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - formState.timestamp > oneHour) {
      sessionStorage.removeItem(FORM_STATE_KEY);
      return false;
    }

    // Switch to the correct component
    const componentSelect = document.getElementById("componentSelect");
    if (componentSelect.value !== formState.componentType) {
      componentSelect.value = formState.componentType;
      componentSelect.dispatchEvent(new Event("change"));
    }

    // Wait a brief moment for the component switch to complete
    setTimeout(() => {
      let form;
      if (formState.componentType === "unifiedProfileLwc") {
        form = document.getElementById("lwcForm");
      } else if (formState.componentType === "agentforceLeadBriefLwc") {
        form = document.getElementById("agentforceForm");
      } else if (formState.componentType === "nextBestActionsLwc") {
        form = document.getElementById("nbaForm");
      } else if (formState.componentType === "nextBestLeadsLwc") {
        form = document.getElementById("nblForm");
      } else if (formState.componentType === "engagementHistoryLwc") {
        form = document.getElementById("engagementHistoryForm");
      }

      if (!form) return;

      // Restore all form field values
      let restoredCount = 0;
      Object.entries(formState.fields).forEach(([name, value]) => {
        const input = form.querySelector(`[name="${name}"]`);
        if (input) {
          input.value = value;
          // Trigger input event to update preview
          input.dispatchEvent(new Event("input", { bubbles: true }));
          restoredCount++;
        }
      });

      console.log(
        `✅ Form state restored from sessionStorage (${restoredCount} fields restored)`
      );

      // Show notification if this was after OAuth
      if (sessionStorage.getItem(AUTH_PENDING_KEY) === "true") {
        sessionStorage.removeItem(AUTH_PENDING_KEY);
        showNotification(
          "✅ Connected to Salesforce! Your form data has been restored.",
          "success"
        );
      }
    }, 100);

    return true;
  } catch (error) {
    console.error("Error restoring form state:", error);
    return false;
  }
}

function clearFormState() {
  sessionStorage.removeItem(FORM_STATE_KEY);
  sessionStorage.removeItem(AUTH_PENDING_KEY);
  console.log("✅ Form state cleared from sessionStorage");
}

function showNotification(message, type = "info") {
  // Remove any existing notifications first
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((n) => n.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  const bgColors = {
    success: "#00ac5b",
    error: "#c23934",
    info: "#2a94d6"
  };

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${bgColors[type]};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
        font-family: 'Open Sans', 'Salesforce Sans', Arial, sans-serif;
    `;

  document.body.appendChild(notification);

  // Auto-remove after 4 seconds (6 seconds for errors)
  const duration = type === "error" ? 6000 : 4000;
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

async function checkAuthStatus() {
  try {
    const response = await fetch("/auth/status");
    const data = await response.json();
    isAuthenticated = data.authenticated;
    instanceUrl = data.instanceUrl;
    updateAuthUI();
    return data.authenticated;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
}

function updateAuthUI() {
  const authButtons = document.querySelectorAll(".deploy-btn");
  authButtons.forEach((btn) => {
    if (isAuthenticated) {
      btn.innerHTML = "☁️ Deploy to Salesforce";
      btn.classList.remove("not-authenticated");
      btn.classList.add("authenticated");
      btn.title = "Deploy this component directly to your Salesforce org";
    } else {
      btn.innerHTML = "🔐 Connect to Salesforce";
      btn.classList.add("not-authenticated");
      btn.classList.remove("authenticated");
      btn.title = "Connect to your Salesforce org to enable deployment";
    }
  });

  // Update auth status indicator in control bar
  const authStatusIndicator = document.getElementById("auth-status-indicator");
  if (authStatusIndicator) {
    const statusText = authStatusIndicator.querySelector(".auth-status-text");
    if (isAuthenticated) {
      authStatusIndicator.classList.add("connected");
      authStatusIndicator.classList.remove("disconnected");
      if (statusText) {
        statusText.textContent = "Connected to Salesforce";
      }
    } else {
      authStatusIndicator.classList.add("disconnected");
      authStatusIndicator.classList.remove("connected");
      if (statusText) {
        statusText.textContent = "Not connected";
      }
    }
  }

  // Update legacy auth status indicator if it exists
  const authStatus = document.getElementById("auth-status");
  if (authStatus) {
    if (isAuthenticated) {
      authStatus.innerHTML = `<span style="color: #00ac5b;">✓ Connected to Salesforce</span>`;
    } else {
      authStatus.innerHTML = "";
    }
  }

  // Show/hide authentication notice banners
  const authNotices = document.querySelectorAll(".auth-notice");
  authNotices.forEach((notice) => {
    if (isAuthenticated) {
      notice.style.display = "none";
    } else {
      notice.style.display = "flex";
    }
  });
}

/** Palette label shown in Lightning / Experience Builder (not the LWC folder name). */
const SALESFORCE_COMPONENT_PALETTE_LABELS = {
  unifiedProfileLwc: "Unified Profile",
  agentforceLeadBriefLwc: "Agentforce Lead Brief (Custom)",
  nextBestActionsLwc: "Next Best Actions (Custom)",
  nextBestLeadsLwc: "Next Best Leads (Custom)",
  engagementHistoryLwc: "Engagement History"
};

// Handle deployment
async function handleDeploy(buttonElement) {
  // Check if authenticated
  if (!isAuthenticated) {
    // Save form state before redirecting to OAuth
    saveFormState();
    sessionStorage.setItem(AUTH_PENDING_KEY, "true");

    showNotification(
      "Redirecting to Salesforce for authentication... Note: Any uploaded images will need to be re-selected after authentication.",
      "info"
    );

    // Small delay to ensure storage is written
    setTimeout(() => {
      window.location.href = "/auth/salesforce";
    }, 100);
    return;
  }

  const originalText = buttonElement.innerHTML;

  try {
    buttonElement.innerHTML = "⚡ Deploying...";
    buttonElement.disabled = true;

    // Determine which form is active
    const componentSelect = document.getElementById("componentSelect");
    const selectedComponent = componentSelect.value;

    let form;
    if (selectedComponent === "unifiedProfileLwc") {
      form = document.getElementById("lwcForm");
    } else if (selectedComponent === "agentforceLeadBriefLwc") {
      form = document.getElementById("agentforceForm");
    } else if (selectedComponent === "nextBestActionsLwc") {
      form = document.getElementById("nbaForm");
    } else if (selectedComponent === "nextBestLeadsLwc") {
      form = document.getElementById("nblForm");
    } else if (selectedComponent === "engagementHistoryLwc") {
      form = document.getElementById("engagementHistoryForm");
    }

    const formData = processFormData(form, selectedComponent);

    const response = await fetch("/deploy", {
      method: "POST",
      body: formData // Send as multipart/form-data
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let result;

    if (contentType && contentType.includes("application/json")) {
      result = await response.json();
    } else {
      // Server returned HTML or other non-JSON response
      const textResponse = await response.text();
      console.error("Server returned non-JSON response:", textResponse);
      throw new Error(
        "Server returned an unexpected response. Please check the server logs."
      );
    }

    if (response.ok && result.success) {
      buttonElement.innerHTML = "✅ Deployed!";

      // Clear saved form state after successful deployment
      clearFormState();

      const paletteLabel =
        SALESFORCE_COMPONENT_PALETTE_LABELS[result.componentName] ||
        result.componentName;
      showNotification(
        `✅ Success! In Salesforce, look for "${paletteLabel}" under Custom in App Builder (not the technical name ${result.componentName}).`,
        "success"
      );

      setTimeout(() => {
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
      }, 3000);
    } else {
      // Handle errors
      if (response.status === 401) {
        // Session expired - save form state and re-authenticate
        saveFormState();
        sessionStorage.setItem(AUTH_PENDING_KEY, "true");
        isAuthenticated = false;
        updateAuthUI();

        showNotification(
          "Session expired. Redirecting to re-authenticate...",
          "info"
        );

        setTimeout(() => {
          window.location.href = "/auth/salesforce";
        }, 1500);
      } else {
        throw new Error(result.message || "Deployment failed");
      }
    }
  } catch (error) {
    console.error("Deployment error:", error);
    showNotification(`❌ Deployment failed: ${error.message}`, "error");
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
  }
}

// Helper function to get image URL (from file or text input)
function getImageUrl(fieldName, form) {
  const fileInput = form.querySelector(
    `input[name="${fieldName}"][type="file"]`
  );
  const urlInput = form.querySelector(`input[name="${fieldName}_url"]`);

  if (fileInput && fileInput.files && fileInput.files[0]) {
    // File was uploaded - create object URL for preview
    return URL.createObjectURL(fileInput.files[0]);
  } else if (urlInput && urlInput.value) {
    // URL was provided
    return urlInput.value;
  }

  return null;
}

// Setup file input preview handlers
function setupImagePreviewHandlers() {
  const imageFields = [
    "avatarUrl",
    "astroIconUrl",
    "headerIcon",
    "card1Image",
    "card2Image"
  ];

  imageFields.forEach((fieldName) => {
    const fileInputs = document.querySelectorAll(
      `input[name="${fieldName}"][type="file"]`
    );

    fileInputs.forEach((fileInput) => {
      fileInput.addEventListener("change", (e) => {
        // Clear the URL input when file is selected
        const form = fileInput.closest("form");
        const urlInput = form.querySelector(`input[name="${fieldName}_url"]`);
        if (urlInput && fileInput.files.length > 0) {
          urlInput.value = "";
          // Also clear from saved form state
          saveFormState();
        }

        // Trigger preview update
        const componentSelect = document.getElementById("componentSelect");
        const selectedComponent = componentSelect.value;

        if (selectedComponent === "unifiedProfileLwc") {
          updatePreview();
        } else if (selectedComponent === "agentforceLeadBriefLwc") {
          updateAgentforcePreview();
        } else if (selectedComponent === "nextBestActionsLwc") {
          updateNbaPreview();
        }
      });
    });

    // Also handle URL input changes
    const urlInputs = document.querySelectorAll(
      `input[name="${fieldName}_url"]`
    );
    urlInputs.forEach((urlInput) => {
      urlInput.addEventListener("input", (e) => {
        // Clear file input when URL is typed
        const form = urlInput.closest("form");
        const fileInput = form.querySelector(
          `input[name="${fieldName}"][type="file"]`
        );
        if (fileInput && urlInput.value) {
          fileInput.value = "";
        }
      });
    });
  });
}

// Validate file size on upload (10MB limit)
function setupFileSizeValidation() {
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  const fileInputs = document.querySelectorAll(
    'input[type="file"][accept="image/*"]'
  );

  fileInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        showNotification(
          `❌ File "${file.name}" is ${sizeMB}MB. Please select an image under 10MB or use a URL instead.`,
          "error"
        );
        // Clear the file input
        e.target.value = "";
      }
    });
  });
}

// Sync color pickers with hex inputs
document.addEventListener("DOMContentLoaded", () => {
  // Setup image preview handlers
  setupImagePreviewHandlers();

  // Setup file size validation
  setupFileSizeValidation();

  // Check auth status on page load
  checkAuthStatus();

  // Check for OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("auth") === "success") {
    checkAuthStatus().then(() => {
      // Restore form state after successful authentication
      restoreFormState();
    });
    // Clean up URL
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (urlParams.get("auth") === "error") {
    showNotification("❌ Authentication failed. Please try again.", "error");
    sessionStorage.removeItem(AUTH_PENDING_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);
  } else {
    // Try to restore form state on normal page load (page refresh, etc.)
    restoreFormState();
  }

  // Auto-save form state periodically while user is typing
  let saveTimeout;
  document.addEventListener("input", (e) => {
    // Only save for form inputs
    if (e.target.matches("input, select, textarea")) {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => {
        saveFormState();
      }, 1000); // Save after 1 second of inactivity
    }
  });
  // Component Selector Logic
  const componentSelect = document.getElementById("componentSelect");
  const unifiedProfileContainer = document.getElementById(
    "unified-profile-container"
  );
  const agentforceBriefContainer = document.getElementById(
    "agentforce-brief-container"
  );
  const nextBestActionsContainer = document.getElementById(
    "next-best-actions-container"
  );
  const nextBestLeadsContainer = document.getElementById(
    "next-best-leads-container"
  );
  const engagementHistoryContainer = document.getElementById(
    "engagement-history-container"
  );

  // Update deployment instructions based on selected component
  function updateDeploymentInstructions(componentType) {
    // No longer needed - deployment instructions are now generic
    // Old folder name references removed since we use direct deployment now
  }

  componentSelect.addEventListener("change", (e) => {
    const selectedComponent = e.target.value;

    if (selectedComponent === "unifiedProfileLwc") {
      unifiedProfileContainer.style.display = "block";
      agentforceBriefContainer.style.display = "none";
      nextBestActionsContainer.style.display = "none";
      nextBestLeadsContainer.style.display = "none";
      engagementHistoryContainer.style.display = "none";
    } else if (selectedComponent === "agentforceLeadBriefLwc") {
      unifiedProfileContainer.style.display = "none";
      agentforceBriefContainer.style.display = "block";
      nextBestActionsContainer.style.display = "none";
      nextBestLeadsContainer.style.display = "none";
      engagementHistoryContainer.style.display = "none";
    } else if (selectedComponent === "nextBestActionsLwc") {
      unifiedProfileContainer.style.display = "none";
      agentforceBriefContainer.style.display = "none";
      nextBestActionsContainer.style.display = "block";
      nextBestLeadsContainer.style.display = "none";
      engagementHistoryContainer.style.display = "none";
    } else if (selectedComponent === "nextBestLeadsLwc") {
      unifiedProfileContainer.style.display = "none";
      agentforceBriefContainer.style.display = "none";
      nextBestActionsContainer.style.display = "none";
      nextBestLeadsContainer.style.display = "block";
      engagementHistoryContainer.style.display = "none";
    } else if (selectedComponent === "engagementHistoryLwc") {
      unifiedProfileContainer.style.display = "none";
      agentforceBriefContainer.style.display = "none";
      nextBestActionsContainer.style.display = "none";
      nextBestLeadsContainer.style.display = "none";
      engagementHistoryContainer.style.display = "block";
      updateEngagementHistoryPreview();
    }

    // Update deployment instructions
    updateDeploymentInstructions(selectedComponent);
  });

  // Initialize deployment instructions on page load
  updateDeploymentInstructions("unifiedProfileLwc");

  // Trigger component display on page load based on dropdown value
  componentSelect.dispatchEvent(new Event("change"));

  // Smooth scroll for navigation links
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);

      // Determine which component is active
      const isAgentforceActive =
        agentforceBriefContainer.style.display !== "none";
      const isNbaActive = nextBestActionsContainer.style.display !== "none";
      const isNblActive = nextBestLeadsContainer.style.display !== "none";
      const isEhActive = engagementHistoryContainer.style.display !== "none";

      // Map base IDs to component-specific IDs
      let actualTargetId = targetId;
      if (isAgentforceActive) {
        if (targetId === "create") {
          actualTargetId = "agentforce-create";
        } else if (targetId === "preview") {
          actualTargetId = "agentforce-preview";
        }
      } else if (isNbaActive) {
        if (targetId === "create") {
          actualTargetId = "nba-create";
        } else if (targetId === "preview") {
          actualTargetId = "nba-preview";
        }
      } else if (isNblActive) {
        if (targetId === "create") {
          actualTargetId = "nbl-create";
        } else if (targetId === "preview") {
          actualTargetId = "nbl-preview";
        }
      } else if (isEhActive) {
        if (targetId === "create") {
          actualTargetId = "eh-create";
        } else if (targetId === "preview") {
          actualTargetId = "eh-preview";
        }
      }

      const targetSection = document.getElementById(actualTargetId);

      if (targetSection && targetSection.offsetParent !== null) {
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // Update active nav link on scroll
  window.addEventListener("scroll", () => {
    let current = "";
    const isAgentforceActive =
      agentforceBriefContainer.style.display !== "none";
    const isNbaActive = nextBestActionsContainer.style.display !== "none";
    const isNblActive = nextBestLeadsContainer.style.display !== "none";
    const isEhActiveScroll =
      engagementHistoryContainer.style.display !== "none";

    // Get visible sections only
    const visibleSections = Array.from(
      document.querySelectorAll(".page-section")
    ).filter((section) => section.offsetParent !== null);

    visibleSections.forEach((section) => {
      const sectionTop = section.offsetTop;
      if (scrollY >= sectionTop - 200) {
        let sectionId = section.getAttribute("id");

        // Map component-specific IDs back to base IDs for navigation highlighting
        if (isAgentforceActive) {
          if (sectionId === "agentforce-create") {
            current = "create";
          } else if (sectionId === "agentforce-preview") {
            current = "preview";
          } else {
            current = sectionId;
          }
        } else if (isNbaActive) {
          if (sectionId === "nba-create") {
            current = "create";
          } else if (sectionId === "nba-preview") {
            current = "preview";
          } else {
            current = sectionId;
          }
        } else if (isNblActive) {
          if (sectionId === "nbl-create") {
            current = "create";
          } else if (sectionId === "nbl-preview") {
            current = "preview";
          } else {
            current = sectionId;
          }
        } else if (isEhActiveScroll) {
          if (sectionId === "eh-create") {
            current = "create";
          } else if (sectionId === "eh-preview") {
            current = "preview";
          } else {
            current = sectionId;
          }
        } else {
          current = sectionId;
        }
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });

  // Setup color picker synchronization
  const colorPickers = document.querySelectorAll(".color-picker");

  colorPickers.forEach((picker) => {
    const hexInputId = picker.getAttribute("data-hex");
    const hexInput = document.getElementById(hexInputId);

    if (hexInput) {
      function onColorPickerValueChange(e) {
        hexInput.value = e.target.value.toUpperCase();

        const selectedComponent = componentSelect.value;
        if (selectedComponent === "unifiedProfileLwc") {
          updatePreview();
        } else if (selectedComponent === "agentforceLeadBriefLwc") {
          updateAgentforcePreview();
        } else if (selectedComponent === "nextBestActionsLwc") {
          updateNbaPreview();
        } else if (selectedComponent === "nextBestLeadsLwc") {
          updateNblPreview();
        } else if (selectedComponent === "engagementHistoryLwc") {
          updateEngagementHistoryPreview();
        }
      }

      // `input` while dragging; `change` when released (some browsers / mobile)
      picker.addEventListener("input", onColorPickerValueChange);
      picker.addEventListener("change", onColorPickerValueChange);

      // Update color picker when hex input changes
      hexInput.addEventListener("input", (e) => {
        let value = e.target.value.trim();
        // Ensure # prefix
        if (value && !value.startsWith("#")) {
          value = "#" + value;
        }
        // Validate and update
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
          picker.value = value;

          const selectedComponent = componentSelect.value;
          if (selectedComponent === "unifiedProfileLwc") {
            updatePreview();
          } else if (selectedComponent === "agentforceLeadBriefLwc") {
            updateAgentforcePreview();
          } else if (selectedComponent === "nextBestActionsLwc") {
            updateNbaPreview();
          } else if (selectedComponent === "nextBestLeadsLwc") {
            updateNblPreview();
          }
        }
        // Engagement History: refresh on every keystroke (uses picker as fallback
        // while hex is incomplete)
        if (componentSelect.value === "engagementHistoryLwc") {
          updateEngagementHistoryPreview();
        }
        // Force uppercase
        e.target.value = value.toUpperCase();
      });
    }
  });

  // Setup preview updates for all inputs
  const form = document.getElementById("lwcForm");
  const inputs = form.querySelectorAll("input, select, textarea");

  console.log(
    "Setting up Unified Profile preview listeners for",
    inputs.length,
    "inputs"
  );

  inputs.forEach((input) => {
    input.addEventListener("input", () => {
      console.log("Unified Profile input changed:", input.name);
      updatePreview();
    });

    // Prevent Enter key from submitting the form
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  });

  // Prevent Enter key from submitting form at form level
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  });

  // Initial preview update
  updatePreview();

  // Setup Agentforce preview updates
  const agentforceForm = document.getElementById("agentforceForm");
  const agentforceInputs = agentforceForm.querySelectorAll("input, textarea");

  agentforceInputs.forEach((input) => {
    input.addEventListener("input", updateAgentforcePreview);

    // Prevent Enter key from submitting the form
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    });
  });

  // Prevent Enter key from submitting Agentforce form at form level
  agentforceForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  // Initial Agentforce preview update
  updateAgentforcePreview();

  // Setup NBA preview updates
  const nbaForm = document.getElementById("nbaForm");
  const nbaInputs = nbaForm.querySelectorAll("input, textarea");

  nbaInputs.forEach((input) => {
    input.addEventListener("input", updateNbaPreview);

    // Prevent Enter key from submitting the form
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    });
  });

  // Prevent Enter key from submitting NBA form at form level
  nbaForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  // Initial NBA preview update
  updateNbaPreview();

  // Setup NBL preview updates
  const nblForm = document.getElementById("nblForm");
  const nblInputs = nblForm.querySelectorAll("input, textarea");

  nblInputs.forEach((input) => {
    input.addEventListener("input", updateNblPreview);

    // Prevent Enter key from submitting the form
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    });
  });

  // Prevent Enter key from submitting NBL form at form level
  nblForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  // Initial NBL preview update
  updateNblPreview();

  // Setup Engagement History preview updates
  const engagementHistoryForm = document.getElementById(
    "engagementHistoryForm"
  );
  const ehInputs = engagementHistoryForm.querySelectorAll("input, textarea");

  ehInputs.forEach((input) => {
    input.addEventListener("input", updateEngagementHistoryPreview);

    // Prevent Enter key from submitting the form
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.tagName !== "TEXTAREA") {
        e.preventDefault();
      }
    });
  });

  // Prevent Enter key from submitting Engagement History form at form level
  engagementHistoryForm.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  });

  // Initial Engagement History preview update
  updateEngagementHistoryPreview();
});

function updatePreview() {
  console.log("updatePreview() called");
  const form = document.getElementById("lwcForm");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());
  console.log("Preview data:", data);

  // Update card background and text color
  const previewCard = document.getElementById("previewCard");
  if (data.bgColor) {
    previewCard.style.background = data.bgColor;
  }
  if (data.textColor) {
    previewCard.style.color = data.textColor;
  }

  // Update avatar (handle file or URL)
  const previewAvatar = document.getElementById("previewAvatar");
  const avatarUrl = getImageUrl("avatarUrl", form);
  if (avatarUrl) {
    previewAvatar.src = avatarUrl;
  }

  // Update name and title
  const previewName = document.getElementById("previewName");
  const previewTitle = document.getElementById("previewTitle");
  if (data.contactName) previewName.textContent = data.contactName;
  if (data.contactTitle) previewTitle.textContent = data.contactTitle;

  // Update badge
  const previewBadge = document.getElementById("previewBadge");
  if (data.badgeText) previewBadge.textContent = data.badgeText;
  if (data.badgeBgColor) previewBadge.style.background = data.badgeBgColor;
  if (data.badgeTextColor) previewBadge.style.color = data.badgeTextColor;

  // Update field labels and values (Details Section 1 & 2)
  for (let i = 1; i <= 8; i++) {
    const previewLabel = document.getElementById(`previewField${i}Label`);
    const previewValue = document.getElementById(`previewField${i}Value`);
    const fieldLabel = data[`field${i}Label`];
    const fieldValue = data[`field${i}Value`];

    if (previewLabel && fieldLabel) {
      previewLabel.textContent = fieldLabel;
    }
    if (previewValue && fieldValue) {
      previewValue.textContent = fieldValue;
    }
  }

  // Update slider
  const sliderFill = document.getElementById("previewSliderFill");
  const sliderPercentage = data.sliderPercentage || 85;
  if (sliderFill) {
    sliderFill.style.width = sliderPercentage + "%";
    if (data.sliderFillColor)
      sliderFill.style.background = data.sliderFillColor;

    const sliderBg = sliderFill.parentElement;
    if (data.sliderBgColor) sliderBg.style.background = data.sliderBgColor;

    const knob = sliderFill.querySelector(".preview-slider-knob");
    if (knob && data.sliderKnobColor) {
      knob.style.background = data.sliderKnobColor;
    }
  }

  // Update ring
  const ringPercentage = data.ringPercentage || 84;
  const ringText = document.getElementById("previewRingText");
  const ringCircle = document.getElementById("previewRingCircle");

  if (ringText) {
    ringText.textContent = ringPercentage + "%";
    if (data.ringTextColor) ringText.style.color = data.ringTextColor;
  }

  if (ringCircle) {
    const circumference = 2 * Math.PI * 30; // radius is 30
    const offset = circumference - (circumference * ringPercentage) / 100;
    ringCircle.setAttribute("stroke-dashoffset", offset);

    if (data.ringProgressColor)
      ringCircle.setAttribute("stroke", data.ringProgressColor);

    // Update background circle
    const bgCircle = ringCircle.previousElementSibling;
    if (bgCircle && data.ringBgColor) {
      bgCircle.setAttribute("stroke", data.ringBgColor);
    }
  }

  // Update engagement text
  const engagementTitle = document.getElementById("previewEngagementTitle");
  const engagementDesc = document.getElementById("previewEngagementDesc");
  if (data.engagementTitle && engagementTitle)
    engagementTitle.textContent = data.engagementTitle;
  if (data.engagementDescription && engagementDesc)
    engagementDesc.textContent = data.engagementDescription;
}

// Update Agentforce Lead Brief Preview
function updateAgentforcePreview() {
  const form = document.getElementById("agentforceForm");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Update Astro icon (handle file or URL)
  const previewAstroIcon = document.getElementById("previewAstroIcon");
  const astroIconUrl = getImageUrl("astroIconUrl", form);
  if (astroIconUrl && previewAstroIcon) {
    previewAstroIcon.src = astroIconUrl;
  }

  // Update title
  const previewBriefTitle = document.getElementById("previewBriefTitle");
  if (data.title && previewBriefTitle) {
    previewBriefTitle.textContent = data.title;
  }

  // Update timestamp
  const previewTimestamp = document.getElementById("previewTimestamp");
  if (data.timestampText && previewTimestamp) {
    previewTimestamp.textContent = data.timestampText;
  }

  // Update intent section
  const previewIntentHeading = document.getElementById("previewIntentHeading");
  const previewIntentText = document.getElementById("previewIntentText");
  if (data.intentHeading && previewIntentHeading) {
    previewIntentHeading.textContent = data.intentHeading;
  }
  if (data.intentText && previewIntentText) {
    previewIntentText.textContent = data.intentText;
  }

  // Update context section
  const previewContextHeading = document.getElementById(
    "previewContextHeading"
  );
  const previewContextText = document.getElementById("previewContextText");
  if (data.contextHeading && previewContextHeading) {
    previewContextHeading.textContent = data.contextHeading;
  }
  if (data.contextText && previewContextText) {
    previewContextText.textContent = data.contextText;
  }

  // Update opener section
  const previewOpenerHeading = document.getElementById("previewOpenerHeading");
  const previewOpenerText = document.getElementById("previewOpenerText");
  if (data.openerHeading && previewOpenerHeading) {
    previewOpenerHeading.textContent = data.openerHeading;
  }
  if (data.openerText && previewOpenerText) {
    previewOpenerText.textContent = data.openerText;
  }

  // Update button text
  const previewSecondaryBtn = document.getElementById("previewSecondaryBtn");
  const previewPrimaryBtn = document.getElementById("previewPrimaryBtn");
  if (data.secondaryButtonText && previewSecondaryBtn) {
    const btnText =
      previewSecondaryBtn.childNodes[previewSecondaryBtn.childNodes.length - 1];
    if (btnText && btnText.nodeType === Node.TEXT_NODE) {
      btnText.textContent = data.secondaryButtonText;
    }
  }
  if (data.primaryButtonText && previewPrimaryBtn) {
    const btnText =
      previewPrimaryBtn.childNodes[previewPrimaryBtn.childNodes.length - 1];
    if (btnText && btnText.nodeType === Node.TEXT_NODE) {
      btnText.textContent = data.primaryButtonText;
    }
  }
}

// Update NBA Preview
function updateNbaPreview() {
  const form = document.getElementById("nbaForm");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Update header icon (handle file or URL)
  const previewHeaderIcon = document.getElementById("previewNbaHeaderIcon");
  const headerIconUrl = getImageUrl("headerIcon", form);
  if (headerIconUrl && previewHeaderIcon) {
    previewHeaderIcon.src = headerIconUrl;
  }

  // Update header title and subtitle
  const previewHeaderTitle = document.getElementById("previewNbaHeaderTitle");
  const previewHeaderSubtitle = document.getElementById(
    "previewNbaHeaderSubtitle"
  );
  if (data.headerTitle && previewHeaderTitle) {
    previewHeaderTitle.textContent = data.headerTitle;
  }
  if (data.headerSubtitle && previewHeaderSubtitle) {
    previewHeaderSubtitle.textContent = data.headerSubtitle;
  }

  // Update Card 1
  const previewCard1Image = document.getElementById("previewNbaCard1Image");
  const previewCard1Title = document.getElementById("previewNbaCard1Title");
  const previewCard1Text = document.getElementById("previewNbaCard1Text");
  const previewCard1Primary = document.getElementById("previewNbaCard1Primary");
  const previewCard1Secondary = document.getElementById(
    "previewNbaCard1Secondary"
  );

  const card1ImageUrl = getImageUrl("card1Image", form);
  if (card1ImageUrl && previewCard1Image) {
    previewCard1Image.src = card1ImageUrl;
  }
  if (data.card1Title && previewCard1Title) {
    previewCard1Title.textContent = data.card1Title;
  }
  if (data.card1Text && previewCard1Text) {
    previewCard1Text.textContent = data.card1Text;
  }
  if (data.card1PrimaryBtn && previewCard1Primary) {
    previewCard1Primary.textContent = data.card1PrimaryBtn;
  }
  if (data.card1SecondaryBtn && previewCard1Secondary) {
    previewCard1Secondary.textContent = data.card1SecondaryBtn;
  }

  // Update Card 2
  const previewCard2Image = document.getElementById("previewNbaCard2Image");
  const previewCard2Title = document.getElementById("previewNbaCard2Title");
  const previewCard2Text = document.getElementById("previewNbaCard2Text");
  const previewCard2Primary = document.getElementById("previewNbaCard2Primary");
  const previewCard2Secondary = document.getElementById(
    "previewNbaCard2Secondary"
  );

  const card2ImageUrl = getImageUrl("card2Image", form);
  if (card2ImageUrl && previewCard2Image) {
    previewCard2Image.src = card2ImageUrl;
  }
  if (data.card2Title && previewCard2Title) {
    previewCard2Title.textContent = data.card2Title;
  }
  if (data.card2Text && previewCard2Text) {
    previewCard2Text.textContent = data.card2Text;
  }
  if (data.card2PrimaryBtn && previewCard2Primary) {
    previewCard2Primary.textContent = data.card2PrimaryBtn;
  }
  if (data.card2SecondaryBtn && previewCard2Secondary) {
    previewCard2Secondary.textContent = data.card2SecondaryBtn;
  }
}

// Update NBL Preview
function updateNblPreview() {
  const form = document.getElementById("nblForm");
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Update header title and subtitle
  const previewHeaderTitle = document.getElementById("previewNblHeaderTitle");
  const previewHeaderSubtitle = document.getElementById(
    "previewNblHeaderSubtitle"
  );
  if (data.headerTitle && previewHeaderTitle) {
    previewHeaderTitle.textContent = data.headerTitle;
  }
  if (data.headerSubtitle && previewHeaderSubtitle) {
    previewHeaderSubtitle.textContent = data.headerSubtitle;
  }

  // Update Lead 1
  const previewLead1Name = document.getElementById("previewNblLead1Name");
  const previewLead1Role = document.getElementById("previewNblLead1Role");
  const previewLead1Match = document.getElementById("previewNblLead1Match");
  const previewLead1Context = document.getElementById("previewNblLead1Context");

  if (data.lead1Name && previewLead1Name) {
    previewLead1Name.textContent = data.lead1Name;
  }
  if (data.lead1Role && previewLead1Role) {
    previewLead1Role.textContent = data.lead1Role;
  }
  if (data.lead1Match && previewLead1Match) {
    previewLead1Match.textContent = data.lead1Match;
  }
  if (data.lead1Context && previewLead1Context) {
    previewLead1Context.textContent = data.lead1Context;
  }

  // Update Lead 2
  const previewLead2Name = document.getElementById("previewNblLead2Name");
  const previewLead2Role = document.getElementById("previewNblLead2Role");
  const previewLead2Match = document.getElementById("previewNblLead2Match");
  const previewLead2Context = document.getElementById("previewNblLead2Context");

  if (data.lead2Name && previewLead2Name) {
    previewLead2Name.textContent = data.lead2Name;
  }
  if (data.lead2Role && previewLead2Role) {
    previewLead2Role.textContent = data.lead2Role;
  }
  if (data.lead2Match && previewLead2Match) {
    previewLead2Match.textContent = data.lead2Match;
  }
  if (data.lead2Context && previewLead2Context) {
    previewLead2Context.textContent = data.lead2Context;
  }

  // Update Lead 3
  const previewLead3Name = document.getElementById("previewNblLead3Name");
  const previewLead3Role = document.getElementById("previewNblLead3Role");
  const previewLead3Match = document.getElementById("previewNblLead3Match");
  const previewLead3Context = document.getElementById("previewNblLead3Context");

  if (data.lead3Name && previewLead3Name) {
    previewLead3Name.textContent = data.lead3Name;
  }
  if (data.lead3Role && previewLead3Role) {
    previewLead3Role.textContent = data.lead3Role;
  }
  if (data.lead3Match && previewLead3Match) {
    previewLead3Match.textContent = data.lead3Match;
  }
  if (data.lead3Context && previewLead3Context) {
    previewLead3Context.textContent = data.lead3Context;
  }
}

function escapeHtmlEh(value) {
  if (value == null) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Read a 6-digit hex color from the named hex field or its paired color picker. */
function readEngagementHexColor(hexInputId, fallback) {
  const hexEl = document.getElementById(hexInputId);
  const picker = document.querySelector(
    `.color-picker[data-hex="${hexInputId}"]`
  );
  let hexVal = hexEl?.value?.trim() || "";
  if (hexVal && !hexVal.startsWith("#")) {
    hexVal = `#${hexVal}`;
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(hexVal)) {
    return hexVal.toUpperCase();
  }
  const pv = (picker?.value || "").trim();
  if (/^#[0-9A-Fa-f]{6}$/i.test(pv)) {
    return pv.toUpperCase();
  }
  return fallback;
}

// Update Engagement History Preview
function updateEngagementHistoryPreview() {
  const form = document.getElementById("engagementHistoryForm");
  if (!form) return;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // Update card title
  const previewCardTitle = document.getElementById("previewEhCardTitle");
  if (data.cardTitle && previewCardTitle) {
    previewCardTitle.textContent = data.cardTitle;
  }

  // Header icon (accent) — was hardcoded; must match accentColor input
  const headerIcon = document.getElementById("previewEhHeaderIcon");
  const accentColor = readEngagementHexColor("ehAccentColorHex", "#0176D3");
  if (headerIcon) {
    headerIcon.setAttribute("fill", accentColor);
  }

  // Update filter labels
  const previewDateRange = document.getElementById("previewEhDateRange");
  const previewCampaign = document.getElementById("previewEhCampaign");
  const previewContentType = document.getElementById("previewEhContentType");
  if (data.dateRangeLabel && previewDateRange)
    previewDateRange.textContent = data.dateRangeLabel;
  if (data.campaignLabel && previewCampaign)
    previewCampaign.textContent = data.campaignLabel;
  if (data.contentTypeLabel && previewContentType)
    previewContentType.textContent = data.contentTypeLabel;

  const lineColor = readEngagementHexColor("ehLineChartColorHex", "#1B96FF");
  const barColor = readEngagementHexColor("ehBarChartColorHex", "#0D9DDA");
  const assetColor = readEngagementHexColor("ehAssetBarColorHex", "#04844B");
  const linkColor = readEngagementHexColor("ehTableLinkColorHex", "#0070D2");

  // Render line chart
  renderEhLineChart(lineColor);

  // Render campaign bars
  const campaignBarsEl = document.getElementById("previewEhCampaignBars");
  if (campaignBarsEl) {
    const campaigns = [];
    for (let i = 1; i <= 3; i++) {
      const name = data["campaign" + i + "Name"] || "";
      const value = parseInt(data["campaign" + i + "Value"]) || 0;
      if (name) campaigns.push({ name, value });
    }
    const maxCampaign = Math.max(...campaigns.map((c) => c.value), 1);
    campaignBarsEl.innerHTML = campaigns
      .map(
        (c) => `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="flex: 0 0 46%; max-width: 46%; font-size: 11px; color: #181818; line-height: 1.35; word-break: break-word; overflow-wrap: anywhere;">${escapeHtmlEh(c.name)}</span>
        <div style="flex: 1; min-width: 0; background: #e5e5e5; border-radius: 4px; height: 16px; position: relative;">
          <div style="background: ${barColor}; border-radius: 4px; height: 100%; width: ${(c.value / maxCampaign) * 100}%;"></div>
        </div>
        <span style="font-size: 11px; font-weight: 700; color: #181818; flex: 0 0 28px; text-align: right;">${escapeHtmlEh(String(c.value))}</span>
      </div>`
      )
      .join("");
  }

  // Render asset bars
  const assetBarsEl = document.getElementById("previewEhAssetBars");
  if (assetBarsEl) {
    const assets = [];
    for (let i = 1; i <= 4; i++) {
      const name = data["asset" + i + "Name"] || "";
      const value = parseInt(data["asset" + i + "Value"]) || 0;
      if (name) assets.push({ name, value });
    }
    const maxAsset = Math.max(...assets.map((a) => a.value), 1);
    assetBarsEl.innerHTML = assets
      .map(
        (a) => `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="flex: 0 0 46%; max-width: 46%; font-size: 11px; color: #181818; line-height: 1.35; word-break: break-word; overflow-wrap: anywhere;">${escapeHtmlEh(a.name)}</span>
        <div style="flex: 1; min-width: 0; background: #e5e5e5; border-radius: 4px; height: 16px; position: relative;">
          <div style="background: ${assetColor}; border-radius: 4px; height: 100%; width: ${(a.value / maxAsset) * 100}%;"></div>
        </div>
        <span style="font-size: 11px; font-weight: 700; color: #181818; flex: 0 0 28px; text-align: right;">${escapeHtmlEh(String(a.value))}</span>
      </div>`
      )
      .join("");
  }

  // Render table rows
  const tableBody = document.getElementById("previewEhTableBody");
  if (tableBody) {
    let rows = "";
    for (let i = 1; i <= 5; i++) {
      const asset = data["row" + i + "Asset"] || "";
      const contentType = data["row" + i + "ContentType"] || "";
      const activityType = data["row" + i + "ActivityType"] || "";
      const campaign = data["row" + i + "Campaign"] || "";
      const date = data["row" + i + "Date"] || "";
      if (asset) {
        rows += `<tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: ${linkColor};">${asset}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #181818;">${contentType}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #181818;">${activityType}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: ${linkColor};">${campaign}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #f0f0f0; color: #181818;">${date}</td>
        </tr>`;
      }
    }
    tableBody.innerHTML = rows;
  }
}

function ehHexToRgba(hex, alpha) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) {
    return `rgba(27, 150, 255, ${alpha})`;
  }
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

// Render engagement history line chart on canvas
function renderEhLineChart(color) {
  const canvas = document.getElementById("previewEhLineChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Mock data points for line chart
  const points = [2, 3, 4, 5, 6, 8, 10, 12];
  const maxVal = Math.max(...points);
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = w - padding.left - padding.right;
  const chartH = h - padding.top - padding.bottom;

  // Draw axes
  ctx.strokeStyle = "#e5e5e5";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, h - padding.bottom);
  ctx.lineTo(w - padding.right, h - padding.bottom);
  ctx.stroke();

  // Draw Y axis labels
  ctx.fillStyle = "#706e6b";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "right";
  for (let i = 0; i <= 4; i++) {
    const yVal = Math.round((maxVal / 4) * i);
    const y = h - padding.bottom - (i / 4) * chartH;
    ctx.fillText(yVal, padding.left - 4, y + 3);
    // Grid line
    ctx.strokeStyle = "#f0f0f0";
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(w - padding.right, y);
    ctx.stroke();
  }

  // Draw line
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((val, i) => {
    const x = padding.left + (i / (points.length - 1)) * chartW;
    const y = h - padding.bottom - (val / maxVal) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Fill area under line
  ctx.lineTo(padding.left + chartW, h - padding.bottom);
  ctx.lineTo(padding.left, h - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = ehHexToRgba(color, 0.12);
  ctx.fill();

  // Draw dots
  ctx.fillStyle = color;
  points.forEach((val, i) => {
    const x = padding.left + (i / (points.length - 1)) * chartW;
    const y = h - padding.bottom - (val / maxVal) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // X axis label
  ctx.fillStyle = "#706e6b";
  ctx.font = "9px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Activity Date", w / 2, h - 2);
}

// Helper function to process form data for image uploads
function processFormData(form, componentType) {
  const formData = new FormData(form);

  // Add component type
  formData.append("componentType", componentType);

  // Process image fields: if file is uploaded, use file; otherwise use URL
  const imageFields = [
    "avatarUrl",
    "astroIconUrl",
    "headerIcon",
    "card1Image",
    "card2Image"
  ];

  imageFields.forEach((fieldName) => {
    const fileInput = form.querySelector(
      `input[name="${fieldName}"][type="file"]`
    );
    const urlInput = form.querySelector(`input[name="${fieldName}_url"]`);

    if (fileInput && urlInput) {
      const file = fileInput.files[0];

      if (file) {
        // File was uploaded - remove the URL field and keep file
        console.log(
          `📁 Using file for ${fieldName}:`,
          file.name,
          file.size,
          "bytes"
        );
        formData.delete(`${fieldName}_url`);
        // Also ensure URL field is completely cleared
        urlInput.value = "";
      } else if (urlInput.value && urlInput.value.trim() !== "") {
        // No file uploaded, use URL instead
        console.log(`🔗 Using URL for ${fieldName}:`, urlInput.value);
        formData.delete(fieldName); // Remove empty file field
        formData.set(fieldName, urlInput.value); // Add URL as the field value
        formData.delete(`${fieldName}_url`); // Remove the _url suffix field
      } else {
        // Neither file nor URL provided - remove both
        console.log(`⚠️ No file or URL for ${fieldName}`);
        formData.delete(fieldName);
        formData.delete(`${fieldName}_url`);
      }
    }
  });

  return formData;
}

// Download handler function
async function handleDownload(buttonElement) {
  const originalText = buttonElement.textContent;

  buttonElement.textContent = "⚡ Generating...";
  buttonElement.disabled = true;

  try {
    // Determine which form is active
    const componentSelect = document.getElementById("componentSelect");
    const selectedComponent = componentSelect.value;

    let form;
    if (selectedComponent === "unifiedProfileLwc") {
      form = document.getElementById("lwcForm");
    } else if (selectedComponent === "agentforceLeadBriefLwc") {
      form = document.getElementById("agentforceForm");
    } else if (selectedComponent === "nextBestActionsLwc") {
      form = document.getElementById("nbaForm");
    } else if (selectedComponent === "nextBestLeadsLwc") {
      form = document.getElementById("nblForm");
    } else if (selectedComponent === "engagementHistoryLwc") {
      form = document.getElementById("engagementHistoryForm");
    }

    const formData = processFormData(form, selectedComponent);

    const response = await fetch("/generate", {
      method: "POST",
      body: formData // Send as multipart/form-data (no Content-Type header needed)
    });

    if (!response.ok) {
      throw new Error("Generation failed");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedComponent + ".zip";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    buttonElement.textContent = "✅ Downloaded!";
    setTimeout(() => {
      buttonElement.textContent = originalText;
      buttonElement.disabled = false;
    }, 2000);
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to generate LWC. Please try again.");
    buttonElement.textContent = originalText;
    buttonElement.disabled = false;
  }
}

// Prevent form submissions (forms now only use deploy buttons)
document.getElementById("lwcForm").addEventListener("submit", (e) => {
  e.preventDefault();
});

document.getElementById("agentforceForm").addEventListener("submit", (e) => {
  e.preventDefault();
});

document.getElementById("nbaForm").addEventListener("submit", (e) => {
  e.preventDefault();
});

document.getElementById("nblForm").addEventListener("submit", (e) => {
  e.preventDefault();
});

document
  .getElementById("engagementHistoryForm")
  .addEventListener("submit", (e) => {
    e.preventDefault();
  });

// Deploy button handlers
document.querySelectorAll(".deploy-btn").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.preventDefault();
    await handleDeploy(e.target);
  });
});

// Bottom deploy button handler
document
  .getElementById("deploy-btn-bottom")
  .addEventListener("click", async () => {
    const bottomBtn = document.getElementById("deploy-btn-bottom");
    await handleDeploy(bottomBtn);
  });
