import { corsHeaders } from '../_shared/cors.ts';
import supabase from '../_shared/supabase.ts';
import { extractText, getDocumentProxy } from 'npm:unpdf@0.11.0';

interface Transcript {
  courseCode: string;
  mark: number;
}

type TranscriptJSON = Record<string, number>;

/**
 * Retrieve the transcript from user's storage bucket and download the transcript.
 * Convert the transcript to a buffer.
 *
 * @param id - Transcript owner's user id
 * @returns PDF content converted to a buffer
 */
const getTranscript = async (id: string): Promise<Uint8Array> => {
  try {
    const { data, error } = await supabase.storage.from('user').download(`${id}/transcript`);

    if (error) {
      throw error;
    }

    const arrayBuffer = await data.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('Error downloading transcript:', error);
    throw error;
  }
};

/**
 * Take the raw transcript marks and only retrieve the relevant COMP courses from the default value
 * specified in the 'students' table. Update the 'students' table with the relevant marks.
 *
 * @param id - Transcript owner's user id
 * @param transcript - Raw Transcript in JSON format
 */
const setStudentMarks = async (id: string, transcript: TranscriptJSON): Promise<void> => {
  try {
    const { data, error } = await supabase.from('students').select('transcript_data').eq('user_id', id).single();

    if (error) {
      throw error;
    }

    const currentTranscript = data.transcript_data as TranscriptJSON;
    const keys = Object.keys(currentTranscript);
    const result: TranscriptJSON = {};

    for (const key of keys) {
      result[key] = transcript[key] !== undefined ? transcript[key] : 0;
    }

    await supabase.from('students').update({ transcript_data: result }).eq('user_id', id);
  } catch (error) {
    console.error('Error setting student marks: ', error);
    throw error;
  }
};

/**
 * Convert an uploaded transcript to JSON format and store in the 'transcript_data'
 * column within the 'students' table in Supabase. Only take COMP courses.
 *
 * @param id - the transcript owner's user id
 */
const parseTranscript = async (id: string): Promise<void> => {
  try {
    const dataBuffer = await getTranscript(id);
    const pdf = await getDocumentProxy(dataBuffer);
    const { text } = await extractText(pdf, { mergePages: false });

    let courseArray: Transcript[] = [];

    // Retrieve COMP course data from each page of transcript
    for (const page of text) {
      const courses = page
        .split('\n')
        .filter((line) => line.startsWith('COMP'))
        .map((line) => {
          const regex = /^([A-Z]{4}\s\d{4}).*(\d{2})\s[A-Z]{2}$/g;
          const match = regex.exec(line);

          if (match) {
            const courseCode = match[1].replace(/\s/g, '');
            const mark = parseInt(match[2]);
            return { courseCode, mark };
          }
        })
        .filter(Boolean);
      courseArray = [...courseArray, ...(courses as Transcript[])];
    }

    const transcript: TranscriptJSON = {};
    for (const course of courseArray) {
      transcript[course.courseCode] = course.mark;
    }

    await setStudentMarks(id, transcript);
  } catch (error) {
    console.error('Error parsing transcript:', error);
    throw error;
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Extract token from header and retrieve user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    await parseTranscript(data.user.id);
    return new Response(JSON.stringify({}), {
      status: 200,
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
