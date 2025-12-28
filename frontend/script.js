const API_URL = "http://localhost:3000/llm/query";

async function runAnalysis() {
  const query = document.getElementById("queryInput").value.trim();
  if (!query) return;

  setStatus("Running analysis...", false);

  clearSections();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    setStatus("Analysis complete ✅", true);

    renderAIAnalysis(data.analysis);
    if (data.results.crawl) renderCrawl(data.results.crawl);
    if (data.results.axe) renderAxe(data.results.axe);
    if (data.results.keyboard) renderKeyboard(data.results.keyboard);

  } catch (err) {
    setStatus("Error running analysis ❌", false);
    console.error(err);
  }
}

function setStatus(text, success) {
  const el = document.getElementById("status");
  el.textContent = text;
  el.className = success ? "success" : "issue";
}

function clearSections() {
  ["analysis", "crawl", "axe", "keyboard"].forEach(id => {
    document.getElementById(id).innerHTML = "";
  });
}



function formatAIText(text) {
  // 1. Remove all markdown bold markers (**)
  text = text.replace(/\*\*/g, "");

  const lines = text.split("\n");

  let html = "<div class='ai-text'>";
  let inList = false;

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // Handle numbered headings like "1. Keyboard Issues"
    if (/^\d+\.\s/.test(line)) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p class="section-title">${line}</p>`;
      continue;
    }

    // Handle bullet points
    if (line.startsWith("* ") || line.startsWith("• ")) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      html += `<li>${line.replace(/^(\*|•)\s*/, "")}</li>`;
      continue;
    }

    // Normal paragraph
    if (inList) {
      html += "</ul>";
      inList = false;
    }

    html += `<p>${line}</p>`;
  }

  if (inList) html += "</ul>";

  html += "</div>";
  return html;
}


function renderAIAnalysis(text) {
  document.getElementById("analysis").innerHTML = `
    <h2>AI Analysis</h2>
    ${formatAIText(text)}
  `;
}


function renderCrawl(crawl) {
  let html = `
    <h2>Page Crawl</h2>
    <p><b>URL:</b> ${crawl.url}</p>
    <p><b>DOM Length:</b> ${crawl.domLength}</p>
    <p><b>Total Links:</b> ${crawl.totalLinks}</p>
    <h3>Sample Links</h3>
    <ul>
  `;

  crawl.links.slice(0, 5).forEach(link => {
    html += `<li><a href="${link.href}" target="_blank">${link.text || link.href}</a></li>`;
  });

  html += `</ul>`;
  document.getElementById("crawl").innerHTML = html;
}



function renderAxe(axe) {
  let html = `
    <h2>Axe Accessibility</h2>
    <p><b>Violations:</b> ${axe.summary.violations}</p>
    <p><b>Passes:</b> ${axe.summary.passes}</p>
    <p><b>Incomplete:</b> ${axe.summary.incomplete}</p>
  `;

  if (axe.violations.length > 0) {
    html += `<h3 class="issue">Violations</h3><ul>`;
    axe.violations.forEach(v => {
      html += `<li><b>${v.id}</b> — ${v.description}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<p class="success">No accessibility violations found ✅</p>`;
  }

  document.getElementById("axe").innerHTML = html;
}


function renderKeyboard(kb) {
  let html = `
    <h2>Keyboard Accessibility</h2>
    <p><b>Total interactive elements:</b> ${kb.totalInteractiveElements}</p>
    <p><b>Reachable:</b> ${kb.keyboardReachableElements}</p>
  `;

  if (kb.unreachableElements.length > 0) {
    html += `<h3 class="issue">Unreachable elements</h3><ul>`;
    kb.unreachableElements.forEach(el => {
      html += `
        <li>
          <b>${el.tag}</b>
          ${el.text ? ` — "${el.text}"` : ""}
          ${el.id ? `(id: ${el.id})` : ""}
        </li>
      `;
    });
    html += `</ul>`;
  } else {
    html += `<p class="success">All elements are keyboard accessible ✅</p>`;
  }

  document.getElementById("keyboard").innerHTML = html;
}
