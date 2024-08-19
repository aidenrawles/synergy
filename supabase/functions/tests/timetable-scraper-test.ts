import { assert } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import supabase from '../_shared/supabase.ts';

const testTimetableScraperFunction = async () => {
  const { data: func_data, error: func_error } = await supabase.functions.invoke('timetable-scraper');

  if (func_error) {
    throw new Error('Invalid response: ' + func_error.message);
  }

  const validateClassFormat = (classes: string[]) => {
    const pattern = /^[A-Z][0-9][0-9][A-Z]$/;
    classes.forEach((className) => {
      assert(pattern.test(className), `Class name ${className} does not match the pattern`);
    });
  };

  validateClassFormat(func_data['COMP3900'])
  validateClassFormat(func_data['COMP9900']);
};

Deno.test('Timetable Scraper Function Test', testTimetableScraperFunction);
