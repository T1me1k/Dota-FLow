import { GepDiagnosticSession } from './gep-diagnostics.mjs';

export function serializeJsonl(records = []) {
  return records.map((record) => JSON.stringify(record)).join('\n') + (records.length ? '\n' : '');
}

export function parseJsonl(text, { allowBlankLines = true } = {}) {
  const records = [];
  const errors = [];
  const source = typeof text === 'string' ? text : String(text ?? '');

  const lines = source.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    if (!line.trim()) {
      if (!allowBlankLines) errors.push({ lineNumber, line, message: 'Blank line is not allowed' });
      return;
    }
    try {
      records.push({ lineNumber, value: JSON.parse(line) });
    } catch (error) {
      errors.push({ lineNumber, line, message: error instanceof Error ? error.message : String(error) });
    }
  });

  return { records, errors, lineCount: lines.length };
}

export function diagnoseJsonlRecording(text, options = {}) {
  const parsed = parseJsonl(text, options);
  const session = new GepDiagnosticSession(options);
  for (const record of parsed.records) session.ingestEnvelope(record.value);
  for (const error of parsed.errors) {
    session.addExternalIssue({
      code: 'JSONL_PARSE_ERROR',
      message: `Line ${error.lineNumber}: ${error.message}`,
      lineNumber: error.lineNumber,
      rawLine: error.line
    });
  }
  return {
    recording: {
      lineCount: parsed.lineCount,
      parsedRecordCount: parsed.records.length,
      parseErrorCount: parsed.errors.length,
      parseErrors: parsed.errors
    },
    ...session.snapshot()
  };
}
