// Phase information data
const phaseData = {
    content: {
        title: "Content Platform Phase",
        description: "Initial content ingestion and metadata management",
        steps: [
            "Content Ingestion: Upload and validate source content files (video, audio, images)",
            "Metadata Creation: Define title, description, genre, cast, ratings, release dates",
            "Rights Management: Configure geographic availability and licensing windows",
            "Asset Management: Organize source files and related materials",
            "Localization: Add subtitles, dubbed audio tracks, and regional metadata"
        ],
        testPoints: [
            "Validate content file formats and specifications",
            "Verify metadata completeness and accuracy",
            "Check rights and availability rules",
            "Test localization asset associations"
        ]
    },
    media: {
        title: "Media Platform Phase",
        description: "Content transformation and preparation for delivery",
        steps: [
            "Content Transformation: Convert source files to streaming-ready formats",
            "Encoding & Packaging: Create multiple bitrate variants (ABR) for adaptive streaming",
            "DRM Application: Apply digital rights management (Widevine, PlayReady, FairPlay)",
            "Quality Control: Automated checks for audio/video sync, artifacts, compliance",
            "CDN Preparation: Package content for content delivery network distribution"
        ],
        testPoints: [
            "Verify encoding quality across all bitrates",
            "Test DRM encryption and key delivery",
            "Validate packaging formats (HLS, DASH)",
            "Check subtitle and audio track synchronization",
            "Performance testing for encoding pipelines"
        ]
    },
    data: {
        title: "Data Layer Phase",
        description: "Data aggregation and API exposure",
        steps: [
            "Data Aggregation: Collect content metadata from multiple sources",
            "Catalog Sync: Maintain synchronized content catalog across systems",
            "Search Indexing: Build and update search indices for content discovery",
            "API Gateway: Expose RESTful/GraphQL APIs for client consumption",
            "Recommendation Engine: Generate personalized content suggestions",
            "Analytics Integration: Track content performance and user engagement"
        ],
        testPoints: [
            "API endpoint functionality and response validation",
            "Data consistency across systems",
            "Search accuracy and performance",
            "API rate limiting and security",
            "Cache invalidation and refresh cycles"
        ]
    },
    streaming: {
        title: "Streaming/Client Phase",
        description: "End-user content delivery and playback",
        steps: [
            "Content Discovery: Browse, search, and recommendation interfaces",
            "Playback Engine: Video player with adaptive bitrate streaming",
            "Multi-device Support: Web, mobile, TV, gaming consoles",
            "Offline Playback: Download and local playback capabilities",
            "Analytics & Monitoring: Real-time playback quality and error tracking",
            "CDN Integration: Optimized content delivery from edge locations"
        ],
        testPoints: [
            "Playback functionality across all devices and browsers",
            "Adaptive bitrate switching behavior",
            "DRM playback and license acquisition",
            "Offline download and playback",
            "Error handling and recovery",
            "Performance metrics (startup time, buffering, quality)"
        ]
    },
    qa: {
        title: "QA & Testing Layer",
        description: "Comprehensive testing across all integration phases",
        steps: [
            "Content Validation: Verify source content meets specifications",
            "Media Quality Check: Automated and manual quality assurance",
            "API Testing: Functional, integration, and contract testing",
            "E2E Playback Testing: Full user journey validation",
            "Performance Testing: Load, stress, and scalability testing",
            "Regression Testing: Ensure new changes don't break existing functionality",
            "Security Testing: Vulnerability scanning and penetration testing",
            "Accessibility Testing: WCAG compliance and assistive technology support"
        ],
        testTypes: [
            "Functional Tests: Feature-level validation",
            "Integration Tests: Cross-system interaction verification",
            "Performance Tests: Response time, throughput, resource usage",
            "Regression Tests: Automated suite for continuous validation",
            "Manual Tests: Exploratory and user experience testing",
            "Smoke Tests: Quick validation of critical paths"
        ],
        deliverables: [
            "Test Plans: Comprehensive testing strategy and scope",
            "Test Cases: Detailed step-by-step test scenarios",
            "Test Execution Reports: Results, pass/fail rates, defects",
            "Bug Reports: Detailed defect documentation and tracking",
            "Coverage Reports: Code and feature coverage metrics",
            "Sign-off Documentation: Approval for production release"
        ]
    }
};

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Zoom functionality
    let currentZoom = 1;
    const zoomStep = 0.2;
    const minZoom = 0.5;
    const maxZoom = 2;

    const flowchart = document.getElementById('flowchart');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const resetZoomBtn = document.getElementById('resetZoom');
    const toggleLabelsBtn = document.getElementById('toggleLabels');

    // Check if elements exist
    if (!flowchart || !zoomInBtn || !zoomOutBtn || !resetZoomBtn || !toggleLabelsBtn) {
        console.error('Some required elements not found');
        return;
    }

    zoomInBtn.addEventListener('click', () => {
        if (currentZoom < maxZoom) {
            currentZoom += zoomStep;
            updateZoom();
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (currentZoom > minZoom) {
            currentZoom -= zoomStep;
            updateZoom();
        }
    });

    resetZoomBtn.addEventListener('click', () => {
        currentZoom = 1;
        updateZoom();
    });

    function updateZoom() {
        flowchart.style.transform = `scale(${currentZoom})`;
    }

    // Toggle detail labels
    let labelsVisible = true;
    toggleLabelsBtn.addEventListener('click', () => {
        console.log('Toggle button clicked, current state:', labelsVisible);
        labelsVisible = !labelsVisible;
        const detailBoxes = document.querySelectorAll('.detail-box, .detail-text');
        console.log('Found detail boxes:', detailBoxes.length);
        
        detailBoxes.forEach(box => {
            box.style.display = labelsVisible ? 'block' : 'none';
        });
        
        // Update button text and icon based on current state
        if (labelsVisible) {
            toggleLabelsBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06L17.94 17.94Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M1 1L23 23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M8.21 8.21A3 3 0 1 0 15.79 15.79" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>Hide Details`;
        } else {
            toggleLabelsBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>Show Details`;
        }
        
        console.log('New state:', labelsVisible);
    });

    // Phase interaction
    const phases = document.querySelectorAll('.phase');
    const phaseInfo = document.getElementById('phaseInfo');

    phases.forEach(phase => {
        phase.addEventListener('click', () => {
            const phaseType = phase.getAttribute('data-phase');
            displayPhaseInfo(phaseType);
            
            // Highlight active phase
            phases.forEach(p => p.classList.remove('active'));
            phase.classList.add('active');
        });
    });

    function displayPhaseInfo(phaseType) {
        const data = phaseData[phaseType];
        
        let html = `
            <h4>${data.title}</h4>
            <p><strong>${data.description}</strong></p>
            
            <h4>Key Steps:</h4>
            <ul>
                ${data.steps.map(step => `<li>${step}</li>`).join('')}
            </ul>
        `;
        
        if (data.testPoints) {
            html += `
                <h4>Testing Focus Areas:</h4>
                <ul>
                    ${data.testPoints.map(point => `<li>${point}</li>`).join('')}
                </ul>
            `;
        }
        
        if (data.testTypes) {
            html += `
                <h4>Test Types:</h4>
                <ul>
                    ${data.testTypes.map(type => `<li>${type}</li>`).join('')}
                </ul>
            `;
        }
        
        if (data.deliverables) {
            html += `
                <h4>QA Deliverables:</h4>
                <ul>
                    ${data.deliverables.map(item => `<li>${item}</li>`).join('')}
                </ul>
            `;
        }
        
        phaseInfo.innerHTML = html;
    }

    // Initialize with content phase info
    displayPhaseInfo('content');

    // Add hover effects
    phases.forEach(phase => {
        phase.addEventListener('mouseenter', () => {
            phase.style.opacity = '0.8';
        });
        
        phase.addEventListener('mouseleave', () => {
            phase.style.opacity = '1';
        });
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === '+' || e.key === '=') {
            zoomInBtn.click();
        } else if (e.key === '-') {
            zoomOutBtn.click();
        } else if (e.key === '0') {
            resetZoomBtn.click();
        }
    });

    // Export functionality (optional)
    function exportDiagram() {
        const svg = document.getElementById('flowchart');
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'content-integration-flow.svg';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    console.log('Content Integration Flow App Loaded');
    console.log('Reference: Epic CPTR-68587');
    console.log('Click on any phase to see detailed information');
});
