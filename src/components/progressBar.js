let progressBarElement = null;
let isUsingExistingElement = false;
let fillElement = null;

export function showProgressBar(targetSelector = "body", text = "Loading...", isIndeterminate = false) {
    const existingElement = document.querySelector(targetSelector);

    if (existingElement && existingElement.classList.contains("status-bar")) {
        progressBarElement = existingElement;
        isUsingExistingElement = true;
        fillElement = existingElement.querySelector(".status-bar-fill");

        if (!fillElement) {
            fillElement = document.createElement("div");
            fillElement.className = "status-bar-fill";
            existingElement.insertBefore(fillElement, existingElement.firstChild);
        }

        const statusText = existingElement.querySelector("#status1") || existingElement.querySelector(".status-progress-percent");

        if (statusText) {
            statusText.textContent = text;
        }

        fillElement.style.width = "0%";

        return;
    }

    if (progressBarElement) {
        return;
    }

    const target = document.querySelector(targetSelector) || document.body;
    const isTargetBody = targetSelector === "body" || target === document.body;

    progressBarElement = document.createElement("div");
    progressBarElement.className = isTargetBody ? "progress-container" : "progress-container progress-container-inline";
    progressBarElement.innerHTML = `
        <div class="progress-wrapper">
            <div class="progress-bar ${isIndeterminate ? "indeterminate" : ""}" id="progress-bar">
                <div class="progress-fill">
                    <div class="progress-text">${text || "Loading..."}</div>
                </div>
            </div>
        </div>
    `;

    target.appendChild(progressBarElement);
    isUsingExistingElement = false;
    fillElement = null;
}

export function updateProgressBar(percentage, text = "") {
    if (!progressBarElement) {
        return;
    }

    if (isUsingExistingElement) {
        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }

        const statusText = progressBarElement.querySelector("#status1") || progressBarElement.querySelector(".status-progress-percent");

        if (statusText) {
            statusText.textContent = text || `${percentage}%`;
        }

        return;
    }

    const bar = progressBarElement.querySelector("#progress-bar");
    const fill = progressBarElement.querySelector(".progress-fill");
    const textElement = progressBarElement.querySelector(".progress-text");

    if (bar && fill) {
        bar.classList.remove("indeterminate");
        fill.style.width = `${percentage}%`;
    }

    if (textElement) {
        textElement.textContent = text || `${percentage}%`;
    }
}

function updateProgressWithState(percentage, state = "", item = "") {
    const text = state ? `${state}${item ? ` ${item}` : ""} - ${percentage}%` : `${percentage}%`;

    updateProgressBar(percentage, text);
}

export function hideProgressBar() {
    if (isUsingExistingElement) {
        if (fillElement) {
            fillElement.style.width = "0%";
        }

        const statusText = progressBarElement.querySelector("#status1");

        if (statusText) {
            statusText.textContent = "";
        }

        progressBarElement = null;
        fillElement = null;
        isUsingExistingElement = false;

        return;
    }

    if (progressBarElement && progressBarElement.parentNode) {
        progressBarElement.parentNode.removeChild(progressBarElement);
    }

    progressBarElement = null;
}