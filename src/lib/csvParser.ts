export interface CsvParseResultError {
  error: string;
}

export function parseCsv(csvText: string): Array<Record<string, string>> | CsvParseResultError {
  if (!csvText || csvText.trim() === "") {
    return { error: "CSV data cannot be empty." };
  }

  // Normalize line endings and then split
  const lines = csvText.trim().replace(/\r\n?/g, '\n').split('\n');
  
  if (lines.length < 1) {
     return { error: "CSV data must have at least a header row." };
  }
  if (lines.length === 1 && lines[0].trim() === "") {
     return { error: "CSV data cannot be empty after trimming." };
  }
   if (lines.length < 2 && lines[0].trim() !== "") {
    // Only headers, no data rows
    // Depending on requirements, this could be an error or an empty data array.
    // For this app, we expect at least one data row to generate an image.
    return { error: "CSV data must have at least one data row after the header." };
  }


  // Basic CSV parsing: split by comma. Does not handle commas within quotes.
  const headers = lines[0].split(',').map(header => header.trim());
  if (headers.some(header => header === "")) {
    return { error: "CSV headers cannot be empty." };
  }

  const data: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // Skip empty lines

    const values = lines[i].split(',').map(value => value.trim());
    if (values.length !== headers.length) {
      return { 
        error: `Row ${i + 1} (1-indexed) has ${values.length} columns, but header has ${headers.length}. Please ensure consistent column counts.` 
      };
    }
    
    const rowObject: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObject[header] = values[index];
    });
    data.push(rowObject);
  }

  if (data.length === 0 && lines.length > 1) { // Headers existed, but all data rows were empty or invalid
     return { error: "No valid data rows found after parsing headers." };
  }

  return data;
}
