// ===== CONFIG =====
// Address of the FastAPI backend (uvicorn default port is 8000)
const API_URL = "http://127.0.0.1:8000";

// The temperature <select> uses c / f / k, but pint needs real unit names
// ("c" in pint is the speed of light!). Everything else is passed as is.
const UNIT_ALIASES = {
    c: "degC",
    f: "degF",
    k: "kelvin",
};

function toPintUnit(unit) {
    const clean = unit.trim();
    return UNIT_ALIASES[clean.toLowerCase()] ?? clean;
}

// ===== HELPERS =====
// Removes floating point noise: 0.30000000000000004 -> 0.3
function formatNumber(n) {
    return parseFloat(Number(n).toPrecision(10));
}

// Text of the chosen <option> (e.g. "C" instead of "c")
function selectedLabel(select) {
    return select.options[select.selectedIndex].text;
}

// Turns FastAPI's error response into a readable message
function extractError(data, status) {
    if (data && typeof data.detail === "string") return data.detail;
    if (data && Array.isArray(data.detail) && data.detail[0]?.msg) {
        return data.detail[0].msg;
    }
    return `Server error (${status})`;
}

// Sends JSON to the backend and returns the parsed answer
async function postJson(path, body) {
    let response;
    try {
        response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
    } catch (err) {
        throw new Error("Cannot reach the server. Is the backend running?");
    }

    let data = null;
    try {
        data = await response.json();
    } catch (err) {
        // response was not JSON (e.g. plain "Internal Server Error")
    }

    if (!response.ok) {
        throw new Error(extractError(data, response.status));
    }
    return data;
}

// Parses "12m 34in 56mi" into [{value: 12, unit: "m"}, ...]
function parseMulti(text) {
    const pattern = /(-?\d+(?:\.\d+)?)\s*([a-zA-Z]+)/g;
    const measures = [];

    const leftover = text.replace(pattern, (_, num, unit) => {
        measures.push({ value: parseFloat(num), unit: toPintUnit(unit) });
        return "";
    });

    if (measures.length === 0 || leftover.trim() !== "") {
        throw new Error("Could not read the input. Example: 12m 34in 56mi");
    }
    return measures;
}

// ===== FORM HANDLERS =====
// Top form: one value, one unit -> another unit  (POST /convert)
async function handleMain(form) {
    const value = parseFloat(form.elements["main-value"].value);
    const fromSelect = form.elements["main-inp-unit"];
    const toSelect = form.elements["main-out-unit"];

    const data = await postJson("/convert", {
        from_unit: toPintUnit(fromSelect.value),
        to_unit: toPintUnit(toSelect.value),
        value: value,
    });

    return `${value} ${selectedLabel(fromSelect)} = ${formatNumber(data.result)} ${selectedLabel(toSelect)}`;
}

// Bottom form: many values with units -> one unit  (POST /convertMulti)
async function handleMulti(form) {
    const text = form.elements["imp-value"].value;
    const toSelect = form.elements["imp-out-unit"];

    const data = await postJson("/convertMulti", {
        to_unit: toPintUnit(toSelect.value),
        measures: parseMulti(text),
    });

    return `${text.trim()} = ${formatNumber(data.result)} ${selectedLabel(toSelect)}`;
}

// ===== WIRING =====
// Connects a form to a handler and shows the result in the <label> under it
function setupForm(formId, handler) {
    const form = document.getElementById(formId);
    if (!form) return;

    const resultLabel = form.parentElement.querySelector("label");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); // stop the page from reloading
        resultLabel.textContent = "Converting...";

        try {
            resultLabel.textContent = await handler(form);
        } catch (err) {
            resultLabel.textContent = err.message;
        }
    });
}

setupForm("main-form", handleMain);
setupForm("imp-form", handleMulti);
