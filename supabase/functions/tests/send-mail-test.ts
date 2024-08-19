import { assertEquals } from 'https://deno.land/std@0.192.0/testing/asserts.ts';
import supabase from '../_shared/supabase.ts';

const testSendMailFunction = async () => {
  const emailInfo = {
    to: 'recipient@example.com',
    subject: 'Test Subject',
    content: 'Test Content',
    html: '<p>Test HTML Content</p>',
  };

  const { data: func_data, error: func_error } = await supabase.functions.invoke('send-mail', {
    body: emailInfo,
  });

  if (func_error) {
    throw new Error('Invalid response: ' + func_error.message);
  }

  console.log(JSON.stringify(func_data, null, 2));

  assertEquals(func_data, {});
};

Deno.test('Send Mail Function Test', testSendMailFunction);
