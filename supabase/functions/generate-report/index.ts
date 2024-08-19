import { corsHeaders } from '../_shared/cors.ts';

type Format = 'csv'; /* Add other report formats here */

type Report = Record<string, string>;

interface Body {
  format: Format;
  allocationReport?: Report[];
  projectReport?: Report[];
  individualReport?: Report[];
  individualGroupReport?: Report[];
  /* Add other report types here */
}

/**
 * Generates a CSV string from a report array.
 * @param {Report[]} report - The report data to convert to CSV.
 * @returns {string} - The generated CSV content as a string.
 */
const generateCSV = (report: Report[]): string => {
  if (report.length === 0) return '';

  const headers = Object.keys(report[0]);
  const rows = report.map((item) => headers.map((header) => item[header]));

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

  return csvContent;
};

/**
 * Checks if exactly one report array is set in the request body.
 * @param {Body} body - The request body.
 * @returns {boolean} - True if exactly one report array is set, otherwise false.
 */
const isExactlyOneReportSet = (body: Body): boolean => {
  const reportArrays = [body.allocationReport, body.projectReport, body.individualReport, body.individualGroupReport];
  const setReportArrays = reportArrays.filter((report) => report !== undefined);
  return setReportArrays.length === 1;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Body;
    const { format, allocationReport, projectReport, individualReport, individualGroupReport } = body;

    if (!isExactlyOneReportSet(body)) {
      return new Response(JSON.stringify({ error: 'Exactly one report must be set' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (format === 'csv') {
      let csvContent = '';
      if (allocationReport) {
        csvContent = generateCSV(allocationReport);
      } else if (projectReport) {
        csvContent = generateCSV(projectReport);
      } else if (individualReport) {
        csvContent = generateCSV(individualReport);
      } else if (individualGroupReport) {
        csvContent = generateCSV(individualGroupReport);
      }

      return new Response(csvContent, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="report.csv"',
        },
      });
    }

    /* Add other formats here */
    return new Response(JSON.stringify({ error: 'Invalid format or missing allocation report' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Request processing error:', error);
    return new Response(JSON.stringify({ error: 'Failed to parse transcript' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
