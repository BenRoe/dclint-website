// main.js
// This file will handle the textarea, button, and show results.
// It will call a backend endpoint to lint the docker-compose code.

// Replace textarea with Monaco Editor
window.addEventListener('DOMContentLoaded', function () {
  // Monaco loader
  require.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs' } });
  require(['vs/editor/editor.main'], function () {
    var editorContainer = document.getElementById('monaco-editor');
    window.monacoEditor = monaco.editor.create(editorContainer, {
      value: '',
      language: 'yaml',
      theme: 'vs-dark',
      fontSize: 16,
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
    });
    // Make editor resizable
    var resizer = document.getElementById('monaco-editor-resize');
    var isResizing = false;
    var startY, startHeight;
    resizer.addEventListener('mousedown', function (e) {
      isResizing = true;
      startY = e.clientY;
      startHeight = editorContainer.offsetHeight;
      document.body.style.cursor = 'ns-resize';
    });
    document.addEventListener('mousemove', function (e) {
      if (!isResizing) return;
      var newHeight = Math.max(100, startHeight + (e.clientY - startY));
      editorContainer.style.height = newHeight + 'px';
      window.monacoEditor.layout();
    });
    document.addEventListener('mouseup', function () {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
    // Lint button event
    document.getElementById('lintBtn').addEventListener('click', async function () {
      const resultsDiv = document.getElementById('results');
      const code = window.monacoEditor.getValue();
      resultsDiv.style.display = 'block';
      resultsDiv.textContent = 'Linting...';
      try {
        const res = await fetch('/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (data.error) {
          resultsDiv.textContent = 'Error: ' + data.error;
        } else {
          resultsDiv.textContent = data.result;
        }
      } catch (e) {
        resultsDiv.textContent = 'Failed to lint: ' + e.message;
      }
    });
    // Fix button event
    document.getElementById('fixBtn').addEventListener('click', async function () {
      const resultsDiv = document.getElementById('results');
      const code = window.monacoEditor.getValue();
      resultsDiv.style.display = 'block';
      resultsDiv.textContent = 'Fixing...';
      try {
        const res = await fetch('/lint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, fix: true }),
        });
        const data = await res.json();
        if (data.fixedCode) {
          window.monacoEditor.setValue(data.fixedCode);
        }
        if (data.error) {
          resultsDiv.textContent = 'Error: ' + data.error;
        } else {
          resultsDiv.textContent = data.result || 'No issues found.';
        }
      } catch (e) {
        resultsDiv.textContent = 'Failed to fix: ' + e.message;
      }
    });
    // Copy All button event
    document.getElementById('copyAllBtn').addEventListener('click', function () {
      const code = window.monacoEditor.getValue();
      navigator.clipboard.writeText(code).then(function () {
        const btn = document.getElementById('copyAllBtn');
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1200);
      });
    });
    // Clear button event
    document.getElementById('clearBtn').addEventListener('click', function () {
      window.monacoEditor.setValue('');
      document.getElementById('results').style.display = 'none';
    });
  });
});
