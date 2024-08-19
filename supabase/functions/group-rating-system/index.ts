import supabase from '../_shared/supabase.ts';
import { corsHeaders } from '../_shared/cors.ts';

const calculateRatings = (ratings) => {
  const ai = [0, 0];
  const dsa = [0, 0];
  const backend = [0, 0];
  const database = [0, 0];
  const frontendUI = [0, 0];
  const cyberSec = [0, 0];
  for (const r in ratings) {
    const student = ratings[r].student_ratings;
    for (const skill in student) {
      switch (skill) {
        case 'AI': {
          if (student[skill] > ai[0]) {
            ai[1] = ai[0];
            ai[0] = student[skill];
          } else if (student[skill] > ai[1]) {
            ai[1] = student[skill];
          }
          break;
        }
        case 'DSA': {
          if (student[skill] > dsa[0]) {
            dsa[1] = dsa[0];
            dsa[0] = student[skill];
          } else if (student[skill] > dsa[1]) {
            dsa[1] = student[skill];
          }
          break;
        }
        case 'Backend': {
          if (student[skill] > backend[0]) {
            backend[1] = backend[0];
            backend[0] = student[skill];
          } else if (student[skill] > backend[1]) {
            backend[1] = student[skill];
          }
          break;
        }
        case 'Database': {
          if (student[skill] > database[0]) {
            database[1] = database[0];
            database[0] = student[skill];
          } else if (student[skill] > database[1]) {
            database[1] = student[skill];
          }
          break;
        }
        case 'Frontend/UI': {
          if (student[skill] > frontendUI[0]) {
            frontendUI[1] = frontendUI[0];
            frontendUI[0] = student[skill];
          } else if (student[skill] > frontendUI[1]) {
            frontendUI[1] = student[skill];
          }
          break;
        }
        case 'Cyber Security': {
          if (student[skill] > cyberSec[0]) {
            cyberSec[1] = cyberSec[0];
            cyberSec[0] = student[skill];
          } else if (student[skill] > cyberSec[1]) {
            cyberSec[1] = student[skill];
          }
          break;
        }
        default: {
          console.log('ERROR: Group skill name not parseable');
          break;
        }
      }
    }
  }

  const res = {
    AI: (ai[0] + ai[1]) / 2,
    DSA: (dsa[0] + dsa[1]) / 2,
    Backend: (backend[0] + backend[1]) / 2,
    Database: (database[0] + database[1]) / 2,
    'Frontend/UI': (frontendUI[0] + frontendUI[1]) / 2,
    'Cyber Security': (cyberSec[0] + cyberSec[1]) / 2,
  };
  return res;
};

const allHaveStudentRatings = (ratings) => {
  for (const rating of ratings) {
    if (Object.keys(rating).length === 0) {
      return false;
    }
  }
  return true;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      new: { group_id, user_ratings, members_count },
    } = await req.json();

    if (user_ratings) {
      let groupScores = {};
      if (members_count >= 5 && user_ratings.length === members_count && allHaveStudentRatings(user_ratings)) {
        groupScores = calculateRatings(user_ratings);
      }

      await supabase.from('groups').update({ group_ratings: groupScores }).eq('group_id', group_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: 'Incomplete update data' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Server error processing the request' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
