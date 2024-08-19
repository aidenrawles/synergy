import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import supabase from '../_shared/supabase.ts';

const testGenerateReportFunction = async () => {
  const requestBody = {
    format: 'csv',
    allocationReport: [
      { header1: 'value1', header2: 'value2' },
      { header1: 'value3', header2: 'value4' },
    ],
  };

  const { data: func_data, error: func_error } = await supabase.functions.invoke('generate-report', {
    body: requestBody,
  });

  if (func_error) {
    throw new Error('Invalid response: ' + func_error.message);
  }

  const expectedCsvContent = 'header1,header2\nvalue1,value2\nvalue3,value4';
  assertEquals(func_data, expectedCsvContent);
};

Deno.test('Generate Report Function Test', testGenerateReportFunction);
