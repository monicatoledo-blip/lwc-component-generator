// Sync color pickers with hex inputs
document.addEventListener('DOMContentLoaded', () => {
    // Component Selector Logic
    const componentSelect = document.getElementById('componentSelect');
    const unifiedProfileContainer = document.getElementById('unified-profile-container');
    const agentforceBriefContainer = document.getElementById('agentforce-brief-container');

    // Update deployment instructions based on selected component
    function updateDeploymentInstructions(componentType) {
        const folderNames = {
            'unifiedProfileLwc': {
                folder: 'unifiedProfileLwc',
                label: 'Unified Profile Mock'
            },
            'agentforceLeadBriefLwc': {
                folder: 'agentforceLeadBriefLwc',
                label: 'Agentforce Lead Brief (Custom)'
            }
        };

        const config = folderNames[componentType];

        // Update all folder name references
        document.getElementById('folderName1').textContent = config.folder + '-1';
        document.getElementById('folderName2').textContent = config.folder + ' (1)';
        document.getElementById('folderName3').textContent = config.folder;
        document.getElementById('folderName4').textContent = config.folder;
        document.getElementById('folderName5').textContent = config.folder;

        // Update component label
        document.getElementById('componentLabel').textContent = config.label;
    }

    componentSelect.addEventListener('change', (e) => {
        const selectedComponent = e.target.value;

        if (selectedComponent === 'unifiedProfileLwc') {
            unifiedProfileContainer.style.display = 'block';
            agentforceBriefContainer.style.display = 'none';
        } else if (selectedComponent === 'agentforceLeadBriefLwc') {
            unifiedProfileContainer.style.display = 'none';
            agentforceBriefContainer.style.display = 'block';
        }

        // Update deployment instructions
        updateDeploymentInstructions(selectedComponent);
    });

    // Initialize deployment instructions on page load
    updateDeploymentInstructions('unifiedProfileLwc');

    // Smooth scroll for navigation links
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Update active nav link on scroll
    const sections = document.querySelectorAll('.page-section');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    // Setup color picker synchronization
    const colorPickers = document.querySelectorAll('.color-picker');

    colorPickers.forEach(picker => {
        const hexInputId = picker.getAttribute('data-hex');
        const hexInput = document.getElementById(hexInputId);

        if (hexInput) {
            // Update hex input when color picker changes
            picker.addEventListener('input', (e) => {
                hexInput.value = e.target.value.toUpperCase();
                updatePreview();
            });

            // Update color picker when hex input changes
            hexInput.addEventListener('input', (e) => {
                let value = e.target.value.trim();
                // Ensure # prefix
                if (value && !value.startsWith('#')) {
                    value = '#' + value;
                }
                // Validate and update
                if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    picker.value = value;
                    updatePreview();
                }
                // Force uppercase
                e.target.value = value.toUpperCase();
            });
        }
    });

    // Setup preview updates for all inputs
    const form = document.getElementById('lwcForm');
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        input.addEventListener('input', updatePreview);

        // Prevent Enter key from submitting the form
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
        });
    });

    // Prevent Enter key from submitting form at form level
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
        }
    });

    // Initial preview update
    updatePreview();

    // Setup Agentforce preview updates
    const agentforceForm = document.getElementById('agentforceForm');
    const agentforceInputs = agentforceForm.querySelectorAll('input, textarea');

    agentforceInputs.forEach(input => {
        input.addEventListener('input', updateAgentforcePreview);

        // Prevent Enter key from submitting the form
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    });

    // Prevent Enter key from submitting Agentforce form at form level
    agentforceForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // Initial Agentforce preview update
    updateAgentforcePreview();
});

function updatePreview() {
    const form = document.getElementById('lwcForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Update card background
    const previewCard = document.getElementById('previewCard');
    if (data.bgColor) {
        previewCard.style.background = data.bgColor;
    }

    // Update avatar
    const previewAvatar = document.getElementById('previewAvatar');
    if (data.avatarUrl) {
        previewAvatar.src = data.avatarUrl;
    }

    // Update name and title
    const previewName = document.getElementById('previewName');
    const previewTitle = document.getElementById('previewTitle');
    if (data.contactName) previewName.textContent = data.contactName;
    if (data.contactTitle) previewTitle.textContent = data.contactTitle;

    // Update badge
    const previewBadge = document.getElementById('previewBadge');
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
    const sliderFill = document.getElementById('previewSliderFill');
    const sliderPercentage = data.sliderPercentage || 85;
    if (sliderFill) {
        sliderFill.style.width = sliderPercentage + '%';
        if (data.sliderFillColor) sliderFill.style.background = data.sliderFillColor;

        const sliderBg = sliderFill.parentElement;
        if (data.sliderBgColor) sliderBg.style.background = data.sliderBgColor;

        const knob = sliderFill.querySelector('.preview-slider-knob');
        if (knob && data.sliderKnobColor) {
            knob.style.background = data.sliderKnobColor;
        }
    }

    // Update ring
    const ringPercentage = data.ringPercentage || 84;
    const ringText = document.getElementById('previewRingText');
    const ringCircle = document.getElementById('previewRingCircle');

    if (ringText) {
        ringText.textContent = ringPercentage + '%';
        if (data.ringTextColor) ringText.style.color = data.ringTextColor;
    }

    if (ringCircle) {
        const circumference = 2 * Math.PI * 30; // radius is 30
        const offset = circumference - (circumference * ringPercentage / 100);
        ringCircle.setAttribute('stroke-dashoffset', offset);

        if (data.ringProgressColor) ringCircle.setAttribute('stroke', data.ringProgressColor);

        // Update background circle
        const bgCircle = ringCircle.previousElementSibling;
        if (bgCircle && data.ringBgColor) {
            bgCircle.setAttribute('stroke', data.ringBgColor);
        }
    }

    // Update engagement text
    const engagementTitle = document.getElementById('previewEngagementTitle');
    const engagementDesc = document.getElementById('previewEngagementDesc');
    if (data.engagementTitle && engagementTitle) engagementTitle.textContent = data.engagementTitle;
    if (data.engagementDescription && engagementDesc) engagementDesc.textContent = data.engagementDescription;
}

// Update Agentforce Lead Brief Preview
function updateAgentforcePreview() {
    const form = document.getElementById('agentforceForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Update Astro icon
    const previewAstroIcon = document.getElementById('previewAstroIcon');
    if (data.astroIconUrl && previewAstroIcon) {
        previewAstroIcon.src = data.astroIconUrl;
    }

    // Update title
    const previewBriefTitle = document.getElementById('previewBriefTitle');
    if (data.title && previewBriefTitle) {
        previewBriefTitle.textContent = data.title;
    }

    // Update timestamp
    const previewTimestamp = document.getElementById('previewTimestamp');
    if (data.timestampText && previewTimestamp) {
        previewTimestamp.textContent = data.timestampText;
    }

    // Update intent section
    const previewIntentHeading = document.getElementById('previewIntentHeading');
    const previewIntentText = document.getElementById('previewIntentText');
    if (data.intentHeading && previewIntentHeading) {
        previewIntentHeading.textContent = data.intentHeading;
    }
    if (data.intentText && previewIntentText) {
        previewIntentText.textContent = data.intentText;
    }

    // Update context section
    const previewContextHeading = document.getElementById('previewContextHeading');
    const previewContextText = document.getElementById('previewContextText');
    if (data.contextHeading && previewContextHeading) {
        previewContextHeading.textContent = data.contextHeading;
    }
    if (data.contextText && previewContextText) {
        previewContextText.textContent = data.contextText;
    }

    // Update opener section
    const previewOpenerHeading = document.getElementById('previewOpenerHeading');
    const previewOpenerText = document.getElementById('previewOpenerText');
    if (data.openerHeading && previewOpenerHeading) {
        previewOpenerHeading.textContent = data.openerHeading;
    }
    if (data.openerText && previewOpenerText) {
        previewOpenerText.textContent = data.openerText;
    }

    // Update button text
    const previewSecondaryBtn = document.getElementById('previewSecondaryBtn');
    const previewPrimaryBtn = document.getElementById('previewPrimaryBtn');
    if (data.secondaryButtonText && previewSecondaryBtn) {
        const btnText = previewSecondaryBtn.childNodes[previewSecondaryBtn.childNodes.length - 1];
        if (btnText && btnText.nodeType === Node.TEXT_NODE) {
            btnText.textContent = data.secondaryButtonText;
        }
    }
    if (data.primaryButtonText && previewPrimaryBtn) {
        const btnText = previewPrimaryBtn.childNodes[previewPrimaryBtn.childNodes.length - 1];
        if (btnText && btnText.nodeType === Node.TEXT_NODE) {
            btnText.textContent = data.primaryButtonText;
        }
    }
}

// Download handler function
async function handleDownload(buttonElement) {
    const originalText = buttonElement.textContent;

    buttonElement.textContent = '⚡ Generating...';
    buttonElement.disabled = true;

    try {
        // Determine which form is active
        const componentSelect = document.getElementById('componentSelect');
        const selectedComponent = componentSelect.value;

        const form = selectedComponent === 'unifiedProfileLwc'
            ? document.getElementById('lwcForm')
            : document.getElementById('agentforceForm');

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Add component type to data
        data.componentType = selectedComponent;

        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Generation failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedComponent + '.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        buttonElement.textContent = '✅ Downloaded!';
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to generate LWC. Please try again.');
        buttonElement.textContent = originalText;
        buttonElement.disabled = false;
    }
}

// Form submission handler
document.getElementById('lwcForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    await handleDownload(submitBtn);
});

// Bottom download button handler
document.getElementById('download-btn-bottom').addEventListener('click', async () => {
    const bottomBtn = document.getElementById('download-btn-bottom');
    await handleDownload(bottomBtn);
});

// Agentforce form submission handler
document.getElementById('agentforceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    await handleDownload(submitBtn);
});
