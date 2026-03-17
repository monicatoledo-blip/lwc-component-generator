// Sync color pickers with hex inputs
document.addEventListener('DOMContentLoaded', () => {
    // Component Selector Logic
    const componentSelect = document.getElementById('componentSelect');
    const unifiedProfileContainer = document.getElementById('unified-profile-container');
    const agentforceBriefContainer = document.getElementById('agentforce-brief-container');
    const nextBestActionsContainer = document.getElementById('next-best-actions-container');
    const nextBestLeadsContainer = document.getElementById('next-best-leads-container');

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
            },
            'nextBestActionsLwc': {
                folder: 'nextBestActionsLwc',
                label: 'Next Best Actions (Custom)'
            },
            'nextBestLeadsLwc': {
                folder: 'nextBestLeadsLwc',
                label: 'Next Best Leads (Custom)'
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
            nextBestActionsContainer.style.display = 'none';
            nextBestLeadsContainer.style.display = 'none';
        } else if (selectedComponent === 'agentforceLeadBriefLwc') {
            unifiedProfileContainer.style.display = 'none';
            agentforceBriefContainer.style.display = 'block';
            nextBestActionsContainer.style.display = 'none';
            nextBestLeadsContainer.style.display = 'none';
        } else if (selectedComponent === 'nextBestActionsLwc') {
            unifiedProfileContainer.style.display = 'none';
            agentforceBriefContainer.style.display = 'none';
            nextBestActionsContainer.style.display = 'block';
            nextBestLeadsContainer.style.display = 'none';
        } else if (selectedComponent === 'nextBestLeadsLwc') {
            unifiedProfileContainer.style.display = 'none';
            agentforceBriefContainer.style.display = 'none';
            nextBestActionsContainer.style.display = 'none';
            nextBestLeadsContainer.style.display = 'block';
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

            // Determine which component is active
            const isAgentforceActive = agentforceBriefContainer.style.display !== 'none';
            const isNbaActive = nextBestActionsContainer.style.display !== 'none';
            const isNblActive = nextBestLeadsContainer.style.display !== 'none';

            // Map base IDs to component-specific IDs
            let actualTargetId = targetId;
            if (isAgentforceActive) {
                if (targetId === 'create') {
                    actualTargetId = 'agentforce-create';
                } else if (targetId === 'preview') {
                    actualTargetId = 'agentforce-preview';
                }
            } else if (isNbaActive) {
                if (targetId === 'create') {
                    actualTargetId = 'nba-create';
                } else if (targetId === 'preview') {
                    actualTargetId = 'nba-preview';
                }
            } else if (isNblActive) {
                if (targetId === 'create') {
                    actualTargetId = 'nbl-create';
                } else if (targetId === 'preview') {
                    actualTargetId = 'nbl-preview';
                }
            }

            const targetSection = document.getElementById(actualTargetId);

            if (targetSection && targetSection.offsetParent !== null) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Update active nav link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const isAgentforceActive = agentforceBriefContainer.style.display !== 'none';
        const isNbaActive = nextBestActionsContainer.style.display !== 'none';
        const isNblActive = nextBestLeadsContainer.style.display !== 'none';

        // Get visible sections only
        const visibleSections = Array.from(document.querySelectorAll('.page-section'))
            .filter(section => section.offsetParent !== null);

        visibleSections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= (sectionTop - 200)) {
                let sectionId = section.getAttribute('id');

                // Map component-specific IDs back to base IDs for navigation highlighting
                if (isAgentforceActive) {
                    if (sectionId === 'agentforce-create') {
                        current = 'create';
                    } else if (sectionId === 'agentforce-preview') {
                        current = 'preview';
                    } else {
                        current = sectionId;
                    }
                } else if (isNbaActive) {
                    if (sectionId === 'nba-create') {
                        current = 'create';
                    } else if (sectionId === 'nba-preview') {
                        current = 'preview';
                    } else {
                        current = sectionId;
                    }
                } else if (isNblActive) {
                    if (sectionId === 'nbl-create') {
                        current = 'create';
                    } else if (sectionId === 'nbl-preview') {
                        current = 'preview';
                    } else {
                        current = sectionId;
                    }
                } else {
                    current = sectionId;
                }
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

    // Setup NBA preview updates
    const nbaForm = document.getElementById('nbaForm');
    const nbaInputs = nbaForm.querySelectorAll('input, textarea');

    nbaInputs.forEach(input => {
        input.addEventListener('input', updateNbaPreview);

        // Prevent Enter key from submitting the form
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    });

    // Prevent Enter key from submitting NBA form at form level
    nbaForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // Initial NBA preview update
    updateNbaPreview();

    // Setup NBL preview updates
    const nblForm = document.getElementById('nblForm');
    const nblInputs = nblForm.querySelectorAll('input, textarea');

    nblInputs.forEach(input => {
        input.addEventListener('input', updateNblPreview);

        // Prevent Enter key from submitting the form
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
                e.preventDefault();
            }
        });
    });

    // Prevent Enter key from submitting NBL form at form level
    nblForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });

    // Initial NBL preview update
    updateNblPreview();
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

// Update NBA Preview
function updateNbaPreview() {
    const form = document.getElementById('nbaForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Update header icon
    const previewHeaderIcon = document.getElementById('previewNbaHeaderIcon');
    if (data.headerIcon && previewHeaderIcon) {
        previewHeaderIcon.src = data.headerIcon;
    }

    // Update header title and subtitle
    const previewHeaderTitle = document.getElementById('previewNbaHeaderTitle');
    const previewHeaderSubtitle = document.getElementById('previewNbaHeaderSubtitle');
    if (data.headerTitle && previewHeaderTitle) {
        previewHeaderTitle.textContent = data.headerTitle;
    }
    if (data.headerSubtitle && previewHeaderSubtitle) {
        previewHeaderSubtitle.textContent = data.headerSubtitle;
    }

    // Update Card 1
    const previewCard1Image = document.getElementById('previewNbaCard1Image');
    const previewCard1Title = document.getElementById('previewNbaCard1Title');
    const previewCard1Text = document.getElementById('previewNbaCard1Text');
    const previewCard1Primary = document.getElementById('previewNbaCard1Primary');
    const previewCard1Secondary = document.getElementById('previewNbaCard1Secondary');

    if (data.card1Image && previewCard1Image) {
        previewCard1Image.src = data.card1Image;
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
    const previewCard2Image = document.getElementById('previewNbaCard2Image');
    const previewCard2Title = document.getElementById('previewNbaCard2Title');
    const previewCard2Text = document.getElementById('previewNbaCard2Text');
    const previewCard2Primary = document.getElementById('previewNbaCard2Primary');
    const previewCard2Secondary = document.getElementById('previewNbaCard2Secondary');

    if (data.card2Image && previewCard2Image) {
        previewCard2Image.src = data.card2Image;
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
    const form = document.getElementById('nblForm');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Update header title and subtitle
    const previewHeaderTitle = document.getElementById('previewNblHeaderTitle');
    const previewHeaderSubtitle = document.getElementById('previewNblHeaderSubtitle');
    if (data.headerTitle && previewHeaderTitle) {
        previewHeaderTitle.textContent = data.headerTitle;
    }
    if (data.headerSubtitle && previewHeaderSubtitle) {
        previewHeaderSubtitle.textContent = data.headerSubtitle;
    }

    // Update Lead 1
    const previewLead1Name = document.getElementById('previewNblLead1Name');
    const previewLead1Role = document.getElementById('previewNblLead1Role');
    const previewLead1Match = document.getElementById('previewNblLead1Match');
    const previewLead1Context = document.getElementById('previewNblLead1Context');

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
    const previewLead2Name = document.getElementById('previewNblLead2Name');
    const previewLead2Role = document.getElementById('previewNblLead2Role');
    const previewLead2Match = document.getElementById('previewNblLead2Match');
    const previewLead2Context = document.getElementById('previewNblLead2Context');

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
    const previewLead3Name = document.getElementById('previewNblLead3Name');
    const previewLead3Role = document.getElementById('previewNblLead3Role');
    const previewLead3Match = document.getElementById('previewNblLead3Match');
    const previewLead3Context = document.getElementById('previewNblLead3Context');

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

// Download handler function
async function handleDownload(buttonElement) {
    const originalText = buttonElement.textContent;

    buttonElement.textContent = '⚡ Generating...';
    buttonElement.disabled = true;

    try {
        // Determine which form is active
        const componentSelect = document.getElementById('componentSelect');
        const selectedComponent = componentSelect.value;

        let form;
        if (selectedComponent === 'unifiedProfileLwc') {
            form = document.getElementById('lwcForm');
        } else if (selectedComponent === 'agentforceLeadBriefLwc') {
            form = document.getElementById('agentforceForm');
        } else if (selectedComponent === 'nextBestActionsLwc') {
            form = document.getElementById('nbaForm');
        } else if (selectedComponent === 'nextBestLeadsLwc') {
            form = document.getElementById('nblForm');
        }

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

// NBA form submission handler
document.getElementById('nbaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    await handleDownload(submitBtn);
});

// NBL form submission handler
document.getElementById('nblForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    await handleDownload(submitBtn);
});
