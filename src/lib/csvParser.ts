
export interface ParseResultError {
  error: string;
}

export function parseDelimitedText(
  text: string,
  delimiter: "," | "\t"
): Array<Record<string, string>> | ParseResultError {
  if (!text || text.trim() === "") {
    return { error: `Input data cannot be empty.` };
  }

  // Normalize line endings and then split
  const lines = text.trim().replace(/\r\n?/g, '\n').split('\n');
  
  if (lines.length < 1) {
     return { error: `Input data must have at least a header row.` };
  }
  if (lines.length === 1 && lines[0].trim() === "") {
     return { error: `Input data cannot be empty after trimming.` };
  }
   if (lines.length < 2 && lines[0].trim() !== "") {
    return { error: `Input data must have at least one data row after the header.` };
  }

  const headers = lines[0].split(delimiter).map(header => header.trim());
  if (headers.some(header => header === "")) {
    return { error: `Headers cannot be empty. Please check your ${delimiter === ',' ? 'CSV' : 'TSV'} file.` };
  }

  const data: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") continue; // Skip empty lines

    const values = lines[i].split(delimiter).map(value => value.trim());
    if (values.length !== headers.length) {
      return { 
        error: `Row ${i + 1} (1-indexed) has ${values.length} columns, but header has ${headers.length}. Please ensure consistent column counts in your ${delimiter === ',' ? 'CSV' : 'TSV'} file.` 
      };
    }
    
    const rowObject: Record<string, string> = {};
    headers.forEach((header, index) => {
      rowObject[header] = values[index];
    });
    data.push(rowObject);
  }

  if (data.length === 0 && lines.length > 1) {
     return { error: `No valid data rows found after parsing headers in your ${delimiter === ',' ? 'CSV' : 'TSV'} file.` };
  }

  return data;
}
