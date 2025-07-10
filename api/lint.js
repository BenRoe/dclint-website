import tmp from 'tmp';
import fs from 'fs';
import path from 'path';
import { DCLinter } from 'dclint';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const code = req.body.code;
  const fix = req.body.fix;
  if (!code) return res.status(400).json({ error: 'No code provided' });

  // Write code to a temp file
  const tmpFile = tmp.fileSync({ postfix: '.yml' });
  fs.writeFileSync(tmpFile.name, code);

  try {
    // Load rules from .dclintrc
    let config = { exclude: [] };
    try {
      const rcPath = path.join(process.cwd(), '.dclintrc');
      const rcContent = fs.readFileSync(rcPath, 'utf8');
      const rcJson = JSON.parse(rcContent);
      if (rcJson.rules) config.rules = rcJson.rules;
    } catch (e) {
      config.rules = {};
    }
    const linter = new DCLinter(config);
    let lintResults;
    let fixedCode;
    if (fix) {
      // Run fixFiles to auto-fix issues
      linter.fixFiles([tmpFile.name], false);
      // Read the fixed YAML
      try {
        fixedCode = fs.readFileSync(tmpFile.name, 'utf8');
      } catch (e) {}
      // Lint again to get updated results
      lintResults = linter.lintFiles([tmpFile.name], false);
    } else {
      lintResults = linter.lintFiles([tmpFile.name], false);
    }
    // Format results and remove temp file path from output
    let formattedResults = await linter.formatResults(lintResults, 'compact');
    const tmpFilePathPattern = new RegExp(
      '^' + tmpFile.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*',
      'gm'
    );
    formattedResults = formattedResults.replace(tmpFilePathPattern, '');
    formattedResults = formattedResults
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => line + '\n') // add an empty line after each result
      .join('\n');
    tmpFile.removeCallback();
    res.status(200).json({ result: formattedResults, fixedCode: fix ? fixedCode : undefined });
  } catch (error) {
    tmpFile.removeCallback();
    res.status(500).json({ error: error.message });
  }
}
